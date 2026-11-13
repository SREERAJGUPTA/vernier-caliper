import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import type { PhysicalState, Specimen, MeasurementMode } from '../../src/domain/types';
import { evaluateContact, constrainMovement, canPlace, externalSupport, internalIntersections } from '../../src/contact/solver';
import { FAMILIES, generateSpecimen, referenceDimension, initialOpening } from '../../src/contact/specimens';
import { scaleReading } from '../../src/domain/scales';

const state = (specimen: Specimen, d: number): PhysicalState => ({ specimen, d, N: 50, e: 0, mode: specimen.mode, placed: true, seated: true, offset: 0, tilt: 0, locked: false });
const block: Specimen = { id: 'independent-block', seed: 0, name: 'Block', family: 'block', mode: 'external', color: '#777', geometry: { width: 23.44, height: 18, depth: 10 } };
const ring: Specimen = { id: 'independent-ring', seed: 0, name: 'Ring', family: 'ring', mode: 'internal', color: '#777', geometry: { width: 26, height: 26, depth: 8, radius: 13, innerRadius: 10, wall: 3 } };
const hole: Specimen = { id: 'independent-hole', seed: 0, name: 'Bore', family: 'blind-hole', mode: 'depth', color: '#777', geometry: { width: 20, height: 20, depth: 27.48, floor: 23.48, innerRadius: 7, radius: 10, wall: 3 } };
const step: Specimen = { id: 'independent-step', seed: 0, name: 'Step', family: 'step-block', mode: 'step', color: '#777', geometry: { width: 40, height: 24, depth: 14, levelA: 7, levelB: 30.48, wall: 6 } };

describe('analytic four-way contact and swept movement', () => {
  it.each([[block, 23.44], [ring, 20], [hole, 23.48], [step, 23.48]] as const)('uses each independent fixture surface for canonical contact', (specimen, expected) => {
    const s = state(specimen, expected);
    const contact = evaluateContact(s);
    expect(contact.valid).toBe(true); expect(contact.penetration).toBe(0);
    expect(Math.abs(contact.gap!)).toBeLessThanOrEqual(1e-9);
    expect(contact.target).toBeCloseTo(expected, 12);
  });
  it('never closes a jaw simply by placing a specimen', () => {
    const s = state(block, 40); const previous = JSON.stringify(s);
    expect(canPlace(s).valid).toBe(true); expect(JSON.stringify(s)).toBe(previous);
    expect(evaluateContact(s).valid).toBe(false);
    expect(canPlace({ ...s, d: 10 }).valid).toBe(false);
  });
  it('large external pointer jumps stop at the support surface', () => {
    const result = constrainMovement(state(block, 40), -200);
    expect(result.d).toBe(23.44); expect(result.blocked).toBe(true);
    expect(result.contact.valid).toBe(true); expect(result.contact.penetration).toBe(0);
  });
  it('large inside, depth and rear-step jumps stop at their actual walls', () => {
    for (const [specimen, expected] of [[ring, 20], [hole, 23.48], [step, 23.48]] as const) {
      const result = constrainMovement(state(specimen, 4), 300);
      expect(result.d).toBeCloseTo(expected, 12); expect(result.contact.valid).toBe(true);
    }
  });
  it('a zero correction never changes contact geometry', () => {
    for (const e of [-.1, -.02, 0, .04, .1]) expect(evaluateContact({ ...state(block, 23.44), e }).target).toBe(23.44);
  });
  it('keeps locked displacement for every mode, request direction and request size', () => {
    for (const specimen of [block, ring, hole, step]) for (const request of [-100, 0, .013, 40, 150, 1000]) {
      const s = { ...state(specimen, initialOpening(specimen)), locked: true };
      expect(constrainMovement(s, request).d).toBe(s.d);
    }
  });
  it('does not quantize arbitrary continuous displacement to least count', () => {
    const s = { ...state(block, 40), placed: false };
    expect(constrainMovement(s, 23.456789).d).toBe(23.456789);
    expect(constrainMovement(s, 23.456789).d % .02).not.toBe(0);
  });
  it('off-centre inside contact is a chord, and never a valid diameter', () => {
    const s = { ...state(ring, 16), offset: 6 };
    expect(internalIntersections(ring, 6)).toEqual({ left: -8, right: 8 });
    const c = evaluateContact(s);
    expect(c.target).toBe(16); expect(c.probeValid).toBe(true); expect(c.valid).toBe(false);
    expect(c.reason).toContain('chord'); expect(referenceDimension(ring)).toBe(20);
  });
  it('rejects a too-small bore, shallow insertion and impossible wall', () => {
    expect(canPlace(state({ ...ring, geometry: { ...ring.geometry, innerRadius: 2 } }, 3)).valid).toBe(false);
    expect(canPlace(state({ ...ring, geometry: { ...ring.geometry, depth: 2 } }, 3)).valid).toBe(false);
    expect(canPlace(state({ ...ring, geometry: { ...ring.geometry, wall: 0 } }, 3)).valid).toBe(false);
  });
  it('requires a seated depth reference independently of bottom contact', () => {
    const c = evaluateContact({ ...state(hole, 23.48), seated: false });
    expect(c.probeValid).toBe(true); expect(c.referenceValid).toBe(false); expect(c.valid).toBe(false);
    expect(c.reason).toContain('rim');
  });
  it('blocks movement when a depth rod would collide with cavity walls', () => {
    const s = { ...state(hole, 3), offset: 6.8 };
    expect(evaluateContact(s).clearance).toBeLessThan(0);
    expect(constrainMovement(s, 30).d).toBe(3);
    expect(canPlace(s).valid).toBe(false);
  });
  it('rejects a depth cavity whose mouth swallows the entire beam-end reference', () => {
    const wide = { ...hole, geometry: { ...hole.geometry, innerRadius: 13, radius: 16 } };
    const s = state(wide, 0);
    expect(canPlace(s).valid).toBe(false);
    expect(evaluateContact(s).reason).toContain('too wide');
    expect(constrainMovement(s, 20).d).toBe(0);
  });
  it('validates the narrower lower aperture of a stepped cavity across the complete probe path', () => {
    const stepped: Specimen = { ...hole, family: 'stepped-cavity', geometry: { ...hole.geometry, innerRadius: 8, radius: 11 } };
    const s = { ...state(stepped, 0), offset: 5.5 };
    // The upper 8 mm radius clears this rod, but the actual 6 mm lower neck does not.
    expect(8 - Math.hypot(5.5 + .7, .7)).toBeGreaterThan(0);
    expect(evaluateContact(s).clearance).toBeLessThan(0);
    expect(canPlace(s).valid).toBe(false);
    expect(constrainMovement(s, 23.48).d).toBe(0);
    expect(evaluateContact({ ...state(stepped, 23.48), offset: 0 }).valid).toBe(true);
  });
  it('rejects external objects beyond finite jaw reach and unreachable rear ledges', () => {
    expect(canPlace(state({ ...block, geometry: { ...block.geometry, height: 42 } }, 40)).valid).toBe(false);
    expect(evaluateContact({ ...state(block, 23.44), offset: 10 }).valid).toBe(false);
    expect(evaluateContact({ ...state(step, 23.48), offset: 12 }).valid).toBe(false);
  });
  it('models tilted block support but flags alignment separately', () => {
    const support = externalSupport(block, 30);
    const independentWidth = 23.44 * Math.sqrt(3) / 2 + 18 / 2;
    expect(support.max - support.min).toBeCloseTo(independentWidth, 12);
    expect(evaluateContact({ ...state(block, independentWidth), tilt: 30 }).valid).toBe(false);
  });
  it('covers placement phases and removal without stale collisions', () => {
    expect(evaluateContact({ ...state(block, 40), placed: false }).phase).toBe('unplaced');
    expect(evaluateContact({ ...state(block, 40), seated: false }).phase).toBe('positioned');
    expect(evaluateContact(state(block, 40)).phase).toBe('probing');
    expect(evaluateContact(state(block, 23.44)).phase).toBe('valid-contact');
    expect(constrainMovement({ ...state(block, 40), placed: false }, 0).d).toBe(0);
  });
  it('repeated opening and closing does not accumulate a contact drift', () => {
    let s = state(block, 40);
    for (let i = 0; i < 500; i++) {
      s = { ...s, d: constrainMovement(s, 0).d }; assert.equal(s.d, 23.44);
      s = { ...s, d: constrainMovement(s, 90).d }; assert.equal(s.d, 90);
    }
  });
  it('generates reproducible supported geometry for every family and plate', () => {
    let count = 0;
    for (const mode of ['external', 'internal', 'depth', 'step'] as const) for (const family of FAMILIES[mode]) for (const N of [10, 20, 50] as const) for (let seed = 0; seed < 80; seed++) {
      const specimen = generateSpecimen(mode, seed, N, family);
      const start = { ...state(specimen, initialOpening(specimen)), N };
      assert.equal(canPlace(start).valid, true, `${family} seed${seed}`);
      const result = constrainMovement(start, mode === 'external' ? 0 : 150);
      assert.equal(result.contact.valid, true, `${family} seed${seed}`);
      const dimension = mode === 'external' ? (family === 'block' ? specimen.geometry.width : 2 * specimen.geometry.radius!) : mode === 'internal' ? 2 * specimen.geometry.innerRadius! : mode === 'depth' ? specimen.geometry.floor! : specimen.geometry.levelB! - specimen.geometry.levelA!;
      assert.ok(Math.abs(result.d - dimension) <= 1e-9);
      assert.equal(scaleReading(result.d, 0, N).exact, true);
      assert.deepEqual(specimen, generateSpecimen(mode, seed, N, family));
      assert.ok(!specimen.name.match(/\d/)); count++;
    }
    expect(count).toBe(3360);
  });
  it('clamps global range and ignores non-finite input', () => {
    const s = { ...state(block, 40), placed: false };
    expect(constrainMovement(s, -20).d).toBe(0); expect(constrainMovement(s, 999).d).toBe(150);
    expect(constrainMovement(s, NaN).d).toBe(40);
  });
});
