import { describe, it, expect } from 'vitest';
import type { PhysicalState, ResponseDraft } from '../../src/domain/types';
import { verifyReading } from '../../src/domain/verification';

const fixture = (d = 23.44, e = .04): PhysicalState => ({
  d, e, N: 50, mode: 'external', placed: true, seated: true, offset: 0, tilt: 0, locked: false,
  specimen: { id: 'verification-independent', seed: 45, name: 'Block', mode: 'external', family: 'block', color: '#777', geometry: { width: d, height: 18, depth: 10 } },
});
const correct: ResponseDraft = { msr: '23', index: '24', result: '23.44', units: 'mm' };

describe('separate technique and reading verification', () => {
  it('accepts complete signed positive and negative examples', () => {
    expect(verifyReading(fixture(), correct).ok).toBe(true);
    const negative = verifyReading(fixture(23.5, -.02), { ...correct, result: '23.50' });
    expect(negative.ok).toBe(true);
  });
  it('assesses invalid contact separately from correct scale arithmetic', () => {
    const result = verifyReading({ ...fixture(), seated: false }, correct);
    expect(result.readingCorrect).toBe(true); expect(result.techniqueCorrect).toBe(false);
    expect(result.ok).toBe(false); expect(result.field).toBe('contact');
  });
  it('diagnoses the earliest incorrect interval and recognizes consistent arithmetic', () => {
    const result = verifyReading(fixture(), { msr: '22', index: '24', result: '22.44' });
    expect(result.field).toBe('msr'); expect(result.arithmeticConsistent).toBe(true);
    expect(result.message).toContain('arithmetic is consistent');
  });
  it('does not confuse a division count with a line count', () => {
    const result = verifyReading(fixture(), { ...correct, divisions: '51', lc: 1 / 51 });
    expect(result.field).toBe('divisions'); expect(result.code).toBe('division-count');
  });
  it.each([
    [{ msd: '0.5' }, 'msd'], [{ vsd: '0.95' }, 'vsd'], [{ lc: '0.05' }, 'lc'],
    [{ index: '25' }, 'index'], [{ contribution: '0.42' }, 'contribution'],
    [{ observed: '23.42' }, 'observed'], [{ zero: '-0.04' }, 'zero'], [{ result: '23.52' }, 'result'],
  ])('returns targeted feedback for %o', (wrong, field) => {
    expect(verifyReading(fixture(), { ...correct, ...wrong }).field).toBe(field);
  });
  it('recognizes the correction sign mistake', () => {
    expect(verifyReading(fixture(), { ...correct, result: '23.52' }).code).toBe('correction-sign');
  });
  it('accepts equivalent numeric formatting and converted final units', () => {
    expect(verifyReading(fixture(), { ...correct, result: '23.4400' }).ok).toBe(true);
    expect(verifyReading(fixture(), { ...correct, result: '2.344', units: 'cm' }).ok).toBe(true);
    expect(verifyReading(fixture(), { ...correct, result: '.02344', units: 'm' }).ok).toBe(true);
    expect(verifyReading(fixture(), { ...correct, units: 'inch' }).field).toBe('units');
    expect(verifyReading(fixture(3.5, 0), { msr: 3, index: 25, result: '3.5' }).ok).toBe(true);
  });
  it('uses canonical zero, never the endpoint index, for integer indications', () => {
    const result = verifyReading(fixture(24, 0), { msr: 24, index: 50, result: 25 });
    expect(result.field).toBe('index'); expect(result.message).toContain('division 0');
  });
  it('assesses off-lattice work as a declared nearest-resolution estimate', () => {
    const result = verifyReading(fixture(23.477, 0), { msr: 23, index: 24, result: 23.48 });
    expect(result.ok).toBe(true); expect(result.code).toBe('estimate-correct');
    expect(result.reference.exact).toBe(false); expect(result.reference.index).toBeNull();
  });
  it('student draft never mutates instrument settings, contact or scenario', () => {
    const s = fixture(); const before = JSON.stringify(s);
    const draft = { ...correct, divisions: '20', zero: '-.1', lc: '99' };
    verifyReading(s, draft); expect(JSON.stringify(s)).toBe(before);
  });
  it('blank required fields never turn into numeric zeros', () => {
    expect(verifyReading(fixture(), { msr: '', index: '', result: '' }).ok).toBe(false);
  });
});

