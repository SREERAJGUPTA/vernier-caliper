import type { PhysicalState, PlateN, MeasurementMode, Specimen } from '../domain/types';
import { generateSpecimen, constrainMovement, canPlace } from '../domain/index';

export type LabStore = ReturnType<typeof createLabStore>;
export function startingOpening(specimen: Specimen) {
  return specimen.mode === 'external' ? Math.min(150, Math.max(specimen.geometry.width, (specimen.geometry.radius ?? 0) * 2) + 14) : specimen.mode === 'internal' ? 4 : 0;
}
export function createLabStore(saved?: Partial<PhysicalState>) {
  const specimen = generateSpecimen('external', 1631, 10);
  let state: PhysicalState = { d: startingOpening(specimen), N: 10, e: 0, mode: 'external', specimen, placed: false, seated: false, offset: 0, tilt: 0, locked: false, ...saved };
  const listeners = new Set<() => void>();
  const emit = (patch: Partial<PhysicalState>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const store = {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    move: (requested: number) => { const result = constrainMovement(state, requested); if (result.d !== state.d) emit({ d: result.d }); return result; },
    lock: (locked: boolean) => emit({ locked }),
    place: () => { const result = canPlace(state); if (result.valid) emit({ placed: true, seated: false }); return result; },
    align: () => { if (!state.placed) return; emit({ seated: true, offset: 0, tilt: 0 }); },
    pose: (offset: number, tilt: number) => {
      // Preview invalid poses without moving a solid specimen through the instrument.
      emit({ placed: false, seated: false, offset, tilt });
    },
    remove: () => emit({ placed: false, seated: false }),
    configure: (N: PlateN, e: number) => emit({ N, e }),
    newSpecimen: (mode: MeasurementMode, seed: number, N = state.N, e = state.e) => {
      const next = generateSpecimen(mode, seed, N);
      emit({ specimen: next, mode, N, e, d: startingOpening(next), placed: false, seated: false, offset: 0, tilt: 0, locked: false });
    },
    resetMeasurement: () => emit({ d: startingOpening(state.specimen), placed: false, seated: false, locked: false, offset: 0, tilt: 0 }),
    restore: (snapshot: PhysicalState) => emit(structuredClone(snapshot)),
    listenerCount: () => listeners.size,
  };
  return store;
}
