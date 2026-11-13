import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import { scaleReading, scaleTicks, roundToResolution, zeroOffsetOptions, onLattice, COINCIDENCE_EPSILON_MM } from '../../src/domain/scales';
import type { PlateN } from '../../src/domain/types';

describe('signed direct Vernier metrology', () => {
  it.each([[10, 7.6, 7, 6], [20, 12.35, 12, 7], [50, 23.48, 23, 24]] as const)('retains the N=%i fixed example', (N, d, msr, index) => {
    const r = scaleReading(d, 0, N);
    expect(r.exact).toBe(true); expect(r.msr).toBe(msr); expect(r.index).toBe(index);
    expect(r.raw).toBeCloseTo(d, 12);
  });
  it('subtracts both signs of zero error', () => {
    expect(scaleReading(23.44, .04, 50).raw).toBeCloseTo(23.48, 12);
    expect(scaleReading(23.44, .04, 50).corrected).toBeCloseTo(23.44, 12);
    expect(scaleReading(23.50, -.02, 50).raw).toBeCloseTo(23.48, 12);
    expect(scaleReading(23.50, -.02, 50).corrected).toBeCloseTo(23.50, 12);
  });
  it('uses Euclidean floor for the closed negative zero example', () => {
    const r = scaleReading(0, -.02, 50);
    expect(r.raw).toBe(-.02); expect(r.msr).toBe(-1); expect(r.index).toBe(49);
    expect(r.mainIndex).toBe(48);
    const t = scaleTicks(0, -.02, 50);
    expect(t.vernier[49].x).toBeCloseTo(48, 12);
  });
  it('uses canonical index zero at integer readings despite both endpoint coincidences', () => {
    for (const N of [10, 20, 50] as const) for (let d = 0; d <= 150; d++) {
      const r = scaleReading(d, 0, N), t = scaleTicks(d, 0, N);
      assert.equal(r.index, 0); assert.equal(t.vernier[N].x, d + N - 1);
    }
  });
  it('exhaustively matches an independent integer-micrometre oracle for every supported exact opening and zero offset', () => {
    let cases = 0;
    for (const N of [10, 20, 50] as const) {
      const unitUm = 1000 / N;
      for (let dUm = 0; dUm <= 150000; dUm += unitUm) {
        for (let eUm = -100; eUm <= 100; eUm += unitUm) {
          const rUm = dUm + eUm;
          const expectedMsr = Math.floor(rUm / 1000);
          const remainderUm = rUm - expectedMsr * 1000;
          const expectedIndex = remainderUm / unitUm;
          const actual = scaleReading(dUm / 1000, eUm / 1000, N);
          assert.equal(actual.exact, true, `not exact N${N} d${dUm} e${eUm}`);
          assert.equal(actual.msr, expectedMsr); assert.equal(actual.index, expectedIndex);
          assert.ok(Math.abs(actual.corrected - dUm / 1000) <= 1e-9);
          // Independent integer numerator: x_v(n) in N*micrometres.
          const tickNumerator = rUm * N + expectedIndex * (N - 1) * 1000;
          assert.equal(tickNumerator, (expectedMsr + expectedIndex) * N * 1000);
          cases++;
        }
      }
    }
    expect(cases).toBe(102019);
  });
  it('keeps a continuous off-lattice state and never creates an exact coincidence', () => {
    let seed = 989;
    for (const N of [10, 20, 50] as const) for (let i = 0; i < 1000; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const interval = seed % (150 * N);
      const d = (interval + .314159) / N;
      const r = scaleReading(d, 0, N);
      assert.equal(r.exact, false); assert.equal(r.index, null); assert.equal(r.contribution, null);
      assert.equal(r.raw, d);
      const ticks = scaleTicks(d, 0, N);
      assert.equal(ticks.vernier[0].x, d);
    }
  });
  it('separates immediately adjacent non-noise states at integer and LC boundaries', () => {
    for (const N of [10, 20, 50] as const) for (const at of [0, 1, 23 + 1 / N, 150]) {
      expect(scaleReading(at + 1e-8, 0, N).exact).toBe(false);
      expect(scaleReading(at - 1e-8, 0, N).exact).toBe(false);
    }
    expect(COINCIDENCE_EPSILON_MM).toBeLessThanOrEqual(1e-9);
  });
  it('keeps exact physical geometry across plate switches and unsupported zero lattices', () => {
    const d = 23.44, e = .04;
    for (const N of [10, 20, 50] as const) expect(scaleTicks(d, e, N).vernier[0].x).toBeCloseTo(23.48, 12);
    expect(scaleReading(d, e, 10).exact).toBe(false);
    expect(scaleReading(d, e, 20).exact).toBe(false);
    expect(scaleReading(d, e, 50).index).toBe(24);
    expect(onLattice(e, 10)).toBe(false);
  });
  it('supports complete plate spans at maximum travel and negative main ticks', () => {
    for (const N of [10, 20, 50] as const) {
      const ticks = scaleTicks(150, .1, N);
      expect(ticks.vernier).toHaveLength(N + 1);
      expect(ticks.vernier[N].x - ticks.vernier[0].x).toBeCloseTo(N - 1, 12);
      expect(ticks.main[0].x).toBeLessThan(-.1);
      expect(ticks.main.at(-1)!.x).toBeGreaterThan(ticks.vernier[N].x);
    }
  });
  it('rounds exact ties away from zero without changing the scale state', () => {
    expect(roundToResolution(1.25, 10)).toBe(1.3);
    expect(roundToResolution(-1.25, 10)).toBe(-1.3);
    expect(roundToResolution(.01, 50)).toBe(.02);
    expect(roundToResolution(-.01, 50)).toBe(-.02);
    expect(roundToResolution(.009999, 50)).toBe(0);
  });
  it('offers bounded plate-representable zero errors only', () => {
    for (const N of [10, 20, 50] as const) for (const e of zeroOffsetOptions(N)) {
      expect(Math.abs(e)).toBeLessThanOrEqual(.1); expect(onLattice(e, N)).toBe(true);
    }
  });
  it('rejects unsupported plates and non-finite positions', () => {
    expect(() => scaleReading(3, 0, 11 as PlateN)).toThrow();
    expect(() => scaleReading(NaN, 0, 10)).toThrow();
  });
});
