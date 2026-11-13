import type { PhysicalState, PlateN, MeasurementMode } from './types';
import { generateSpecimen, initialOpening } from '../contact/specimens';

/** Reproducible, serializable scenario inputs. No scenario contains an answer-key field. */
export const SAMPLE_SCENARIOS: readonly { name: string; mode: MeasurementMode; seed: number; N: PlateN; e: number }[] = [
  { name: 'First external reading', mode: 'external', seed: 182, N: 10, e: 0 },
  { name: 'Inside diameter', mode: 'internal', seed: 941, N: 20, e: 0 },
  { name: 'Seated depth', mode: 'depth', seed: 3163, N: 50, e: .04 },
  { name: 'Rear step faces', mode: 'step', seed: 1207, N: 50, e: -.02 },
];
export function scenarioState(mode: MeasurementMode, seed: number, N: PlateN, e = 0): PhysicalState {
  const specimen = generateSpecimen(mode, seed, N);
  return { d: initialOpening(specimen), N, e, mode, specimen, placed: false, seated: false, offset: 0, tilt: 0, locked: false };
}
