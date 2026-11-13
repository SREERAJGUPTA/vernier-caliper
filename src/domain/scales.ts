import type { PlateN, ScaleDescriptor, ScaleReading } from './types';

export const COINCIDENCE_EPSILON_MM = 1e-10;
export const RANGE_MM = 150;
export const PLATES: readonly PlateN[] = [10, 20, 50];
export const ZERO_OFFSET_LIMIT_MM = 0.1;

export function assertPlate(N: number): asserts N is PlateN {
  if (!PLATES.includes(N as PlateN)) throw new RangeError('Supported plates have 10, 20 or 50 divisions.');
}
export function leastCount(N: PlateN): number { assertPlate(N); return 1 / N; }
export function roundToResolution(value: number, N: PlateN): number {
  assertPlate(N);
  // Symmetric nearest, exact half steps away from zero. The additive guard is
  // 1e-12 in lattice units and corrects binary arithmetic at an exact tie only.
  const rounded = Math.sign(value) * Math.floor(Math.abs(value) * N + 0.5 + 1e-12) / N;
  return Object.is(rounded, -0) ? 0 : rounded;
}
export function onLattice(value: number, N: PlateN): boolean {
  return Math.abs(value - Math.round(value * N) / N) <= COINCIDENCE_EPSILON_MM;
}
export function scaleReading(d: number, e: number, N: PlateN): ScaleReading {
  assertPlate(N);
  if (![d, e].every(Number.isFinite)) throw new RangeError('Scale state must be finite.');
  const raw = d + e;
  const nearest = roundToResolution(raw, N);
  const exact = onLattice(raw, N);
  const latticeInteger = Math.round(raw * N);
  // Euclidean division, including negative indications. Do not truncate.
  const msr = exact ? Math.floor(latticeInteger / N) : Math.floor(raw);
  const index = exact ? latticeInteger - msr * N : null;
  return {
    raw, corrected: raw - e, lc: 1 / N, vsd: (N - 1) / N,
    msr, index, contribution: index === null ? null : index / N,
    exact, nearest, residual: raw - nearest,
    mainIndex: index === null ? null : msr + index,
  };
}
export function scaleTicks(d: number, e: number, N: PlateN, datum = 0): ScaleDescriptor {
  assertPlate(N);
  return {
    N, lc: 1 / N, vsd: (N - 1) / N, raw: d + e, datum,
    main: Array.from({ length: 208 }, (_, i) => {
      const k = i - 2;
      return { index: k, x: datum + k, major: k % 5 === 0, label: k % 10 === 0 ? String(k) : null };
    }),
    vernier: Array.from({ length: N + 1 }, (_, j) => ({
      index: j, x: datum + d + e + j * (N - 1) / N,
      major: j % 5 === 0, label: j % 5 === 0 || j === N ? String(j) : null,
    })),
  };
}
export function formattedReading(value: number, N: PlateN): string {
  return value.toFixed(N === 10 ? 1 : 2);
}
export function zeroOffsetOptions(N: PlateN): number[] {
  const steps = Math.round(ZERO_OFFSET_LIMIT_MM * N);
  return Array.from({ length: 2 * steps + 1 }, (_, i) => (i - steps) / N);
}

