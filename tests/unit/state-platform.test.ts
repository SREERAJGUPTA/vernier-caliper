import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLabStore } from '../../src/state/store';
import { InteractionController, projectedAxisDelta, transitionFraction } from '../../src/interaction/controller';
import { createRecord, recordsCSV } from '../../src/platform/records';
import { loadSaved, saveLocal, clearLocal } from '../../src/platform/persistence';
import { scaleReading } from '../../src/domain/scales';
import { verifyReading } from '../../src/domain/verification';
import type { MeasurementMode } from '../../src/domain/types';

// A standalone RFC4180 parser used only as an export oracle.
function parseCSV(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '');
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\r' && text[i + 1] === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

afterEach(() => vi.unstubAllGlobals());

describe('authoritative store and interaction ownership', () => {
  it('all ordinary movement routes use one lock and one continuous d', () => {
    const store = createLabStore(); store.move(23.4567); store.lock(true);
    for (const requested of [0, 40, 150, 23.4767]) expect(store.move(requested).d).toBe(23.4567);
    store.lock(false); expect(store.move(23.4571).d).toBe(23.4571);
  });
  it('place and align do not close the jaws or solve the measurement', () => {
    const store = createLabStore(); const d = store.getSnapshot().d;
    expect(store.place().valid).toBe(true); store.align();
    expect(store.getSnapshot().d).toBe(d); expect(store.getSnapshot().seated).toBe(true);
  });
  it('reset measurement releases physical lock and object but preserves plate, error and specimen', () => {
    const store = createLabStore(); store.configure(50, -.02); store.place(); store.align(); store.move(0); store.lock(true);
    const id = store.getSnapshot().specimen.id; store.resetMeasurement();
    const s = store.getSnapshot(); expect(s.N).toBe(50); expect(s.e).toBe(-.02); expect(s.specimen.id).toBe(id);
    expect(s.locked).toBe(false); expect(s.placed).toBe(false); expect(s.seated).toBe(false);
  });
  it('plate switch preserves physical jaw and zero pattern offset', () => {
    const store = createLabStore(); store.move(23.44); store.configure(50, .04); store.configure(10, .04);
    expect(store.getSnapshot().d).toBe(23.44); expect(store.getSnapshot().e).toBe(.04);
    expect(scaleReading(store.getSnapshot().d, store.getSnapshot().e, store.getSnapshot().N).exact).toBe(false);
  });
  it('old snapshots remain immutable while live state changes', () => {
    const store = createLabStore(); const frozen = structuredClone(store.getSnapshot());
    store.move(100); store.newSpecimen('depth', 999, 20, -.05);
    expect(frozen.mode).toBe('external'); expect(frozen.N).toBe(10);
    expect(frozen.d).not.toBe(store.getSnapshot().d);
    store.restore(frozen); expect(store.getSnapshot()).toEqual(frozen);
  });
  it('50 replacements and 20 subscribe/unsubscribe cycles do not accumulate store listeners', () => {
    const store = createLabStore();
    for (let i = 0; i < 50; i++) store.newSpecimen(['external', 'internal', 'depth', 'step'][i % 4] as MeasurementMode, i);
    for (let i = 0; i < 20; i++) { const unsub = store.subscribe(() => {}); expect(store.listenerCount()).toBe(1); unsub(); }
    expect(store.listenerCount()).toBe(0);
  });
  it('one pointer owner prevents camera takeover until release or cancel', () => {
    const c = new InteractionController(); expect(c.acquire('carriage', 7)).toBe(true);
    expect(c.acquire('camera', 8)).toBe(false); expect(c.release(8)).toBe(false);
    expect(c.owner).toBe('carriage'); expect(c.dragging).toBe(true);
    expect(c.release()).toBe(true); expect(c.owner).toBe('none'); expect(c.pointerId).toBeNull();
    expect(c.acquire('camera', 8)).toBe(true); expect(c.dragging).toBe(false);
  });
  it('projected-axis input returns a safe degeneracy signal and respects axis direction', () => {
    expect(projectedAxisDelta(30, 0, 0, 0)).toBeNull();
    expect(projectedAxisDelta(30, 0, .1, 0)).toBeNull();
    expect(projectedAxisDelta(30, 0, 3, 0)).toBe(10);
    expect(projectedAxisDelta(30, 0, -3, 0)).toBe(-10);
    expect(projectedAxisDelta(0, 40, 0, 4)).toBe(10);
  });
  it('elapsed-time camera damping composes equally at 30, 60, 120 Hz', () => {
    const final: number[] = [];
    for (const hz of [30, 60, 120]) {
      let position = 0;
      for (let frame = 0; frame < hz; frame++) position += (1 - position) * transitionFraction(1 / hz);
      final.push(position);
    }
    expect(Math.max(...final) - Math.min(...final)).toBeLessThan(1e-12);
    expect(final[0]).toBeCloseTo(1 - Math.exp(-1 / .13), 12);
  });
});

describe('completed observations and resilient local storage', () => {
  it('records preserve independent user, reference and immutable assessed physical state', () => {
    const store = createLabStore(); store.place(); store.align(); store.move(0);
    const s = store.getSnapshot(), r = scaleReading(s.d, s.e, s.N);
    const draft = { msr: String(r.msr), index: String(r.index), result: String(r.corrected), units: 'mm' };
    const verified = verifyReading(s, draft); expect(verified.ok).toBe(true);
    const record = createRecord(s, draft, verified);
    draft.result = '999'; store.move(150);
    expect(record.user.result).not.toBe('999'); expect(record.snapshot.d).not.toBe(150);
    expect(record.reference.corrected).toBeCloseTo(r.corrected, 12);
  });
  it('CSV round-trips quotes, commas, line breaks, units and distinct response/reference columns', () => {
    const store = createLabStore(); store.place(); store.align(); store.move(0);
    const s = structuredClone(store.getSnapshot()); s.specimen.name = 'Ring, "copper"\nsecond line';
    const r = scaleReading(s.d, s.e, s.N), user = { msr: r.msr, index: r.index!, result: '99', units: 'cm' };
    const rec = createRecord(s, user, verifyReading(s, user));
    const rows = parseCSV(recordsCSV([rec]));
    expect(rows).toHaveLength(2); expect(rows[1]).toHaveLength(rows[0].length);
    expect(rows[1][rows[0].indexOf('specimen')]).toBe(s.specimen.name);
    expect(rows[1][rows[0].indexOf('user_result')]).toBe('99');
    expect(rows[1][rows[0].indexOf('user_units')]).toBe('cm');
    expect(rows[1][rows[0].indexOf('reference_units')]).toBe('mm');
  });
  it('blocked or exhausted storage never throws into the learning workflow', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('blocked'); } });
    expect(loadSaved()).toBeNull(); expect(saveLocal({ lesson: 2 })).toBe(false); expect(clearLocal()).toBe(false);
  });
  it('rejects malformed JSON and unknown persistence versions', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken json' }); expect(loadSaved()).toBeNull();
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ version: 1, payload: { d: 4 } }) }); expect(loadSaved()).toBeNull();
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ version: 2, payload: { d: 4 } }) }); expect(loadSaved()).toEqual({ d: 4 });
  });
});
