import { describe, expect, it } from 'vitest';
import { createLabStore } from '../../src/state/store';
import { createLearningTask, type LearningObjective } from '../../src/learning/tasks';
import { mayRestoreWork, modeForPage, restoreDraft, restoreLearningSession, restorePhysical, type LearningSession } from '../../src/platform/session';
import type { PlateN } from '../../src/domain/types';

function challenge(objective: LearningObjective = 'external', N: PlateN = 50) {
  const task = createLearningTask(271828, objective, 'advanced', N);
  const store = createLabStore();
  store.newSpecimen(task.mode, task.seed, task.N, task.e);
  store.place(); store.align(); store.move(task.mode === 'external' ? 0 : 150); store.lock(true);
  const session: LearningSession = {
    version: 1, page: 'challenges', view: 'reading', learningMode: 'Challenge',
    task, taskCount: 8, objective, difficulty: 'advanced', seed: 271821,
    guidedStep: 0, prediction: '', timer: true, elapsed: 37, showMicroscope: true,
  };
  return { physical: store.getSnapshot(), session, draft: { msr: '321', index: '17', result: '9.876', units: 'cm', lc: '0.0' } };
}

describe('active learning-session restoration', () => {
  it('preserves challenge identity, contact, locking, timer and unfinished working through JSON reload', () => {
    for (const objective of ['external', 'internal', 'depth', 'step', 'positive-zero', 'negative-zero', 'transfer'] as const) {
      const source = challenge(objective);
      const saved = JSON.parse(JSON.stringify(source));
      const physical = restorePhysical(saved.physical);
      expect(physical).toEqual(source.physical);
      expect(restoreLearningSession(saved.session, 'challenges', physical)).toEqual(source.session);
      expect(restoreDraft(saved.draft)).toEqual(source.draft);
    }
  });

  it('restores a guided prediction and reading step while the requested hash determines the mode', () => {
    const { physical, session } = challenge();
    const guided = { ...session, page: 'measure', learningMode: 'Guided', guidedStep: 2, prediction: 'About 24', task: null };
    const restored = restoreLearningSession(guided, 'measure', physical);
    expect(restored).toMatchObject({ learningMode: 'Guided', guidedStep: 2, prediction: 'About 24', view: 'reading', showMicroscope: true });
    expect(restoreLearningSession(session, 'measure', physical)).toMatchObject({ learningMode: 'Practice', task: session.task, view: 'bench', showMicroscope: false });
    expect(modeForPage('measure', 'Challenge')).toBe('Practice');
    expect(modeForPage('measure', 'Guided')).toBe('Guided');
    expect(modeForPage('challenges', 'Practice')).toBe('Challenge');
    expect(restoreLearningSession(session, 'explore', physical)).toMatchObject({ learningMode: 'Explore', view: 'gallery' });
  });

  it('keeps specimen geometry and off-lattice displacement after a plate swap', () => {
    const store = createLabStore();
    store.newSpecimen('internal', 941, 20, -.05);
    store.move(7.1234);
    const originalSpecimen = store.getSnapshot().specimen;
    store.configure(50, -.05);
    const restored = restorePhysical(JSON.parse(JSON.stringify(store.getSnapshot())));
    expect(restored?.specimen).toEqual(originalSpecimen);
    expect(restored).toMatchObject({ N: 50, e: -.05, d: 7.1234 });
  });

  it('rejects incompatible or corrupt task identifiers and regenerates trusted task copy from its seed', () => {
    const { physical, session } = challenge('least-count');
    expect(restoreLearningSession({ ...session, task: { ...session.task, id: 'wrong-task' } }, 'challenges', physical).task).toBeNull();
    expect(restoreLearningSession(session, 'challenges', { ...physical, e: .07 }).task).toBeNull();
    expect(restoreLearningSession({ ...session, task: { ...session.task, seed: NaN } }, 'challenges', physical).task).toBeNull();
    const injected = { ...session, task: { ...session.task, prompt: 'Stored text should not override the course.', question: { correctIndex: 99 } } };
    expect(restoreLearningSession(injected, 'challenges', physical).task).toEqual(session.task);
  });

  it('rejects impossible mechanics and modified geometry before creating a store', () => {
    const { physical } = challenge('external');
    for (const patch of [{ d: NaN }, { d: -1 }, { N: 0 }, { e: .2 }, { offset: Infinity }, { placed: false, seated: true }, { d: 0 }]) {
      expect(restorePhysical({ ...physical, ...patch })).toBeNull();
    }
    expect(restorePhysical({ ...physical, specimen: null })).toBeNull();
    expect(restorePhysical({ ...physical, specimen: { ...physical.specimen, geometry: { ...physical.specimen.geometry, width: 0 } } })).toBeNull();
  });

  it('honors the latest opt-out even when an older saved payload enabled persistence', () => {
    expect(mayRestoreWork({ save: false }, { save: true })).toBe(false);
    expect(mayRestoreWork(null, { save: false })).toBe(false);
    expect(mayRestoreWork({ save: true }, { save: false })).toBe(true);
    expect(mayRestoreWork(null, undefined)).toBe(true);
  });

  it('never restores teacher reveal, feedback or frozen answer state', () => {
    const { physical, session } = challenge();
    const restored = restoreLearningSession({ ...session, reveal: true, result: { ok: true }, hints: true, frozen: true }, 'challenges', physical);
    for (const key of ['reveal', 'result', 'hints', 'frozen']) expect(restored).not.toHaveProperty(key);
    expect(restored.task).toEqual(session.task);
  });

  it('sanitizes malformed configuration and preserves partial numeric input without accepting objects', () => {
    const restored = restoreLearningSession({ version: 1, taskCount: -1, seed: Infinity, guidedStep: 40, elapsed: NaN, difficulty: 'invented', view: 'fake', prediction: {} }, 'measure', null);
    expect(restored).toMatchObject({ task: null, taskCount: 0, seed: 1631, guidedStep: 0, elapsed: 0, difficulty: 'standard', view: 'bench', prediction: '' });
    expect(restoreDraft({ msr: '-', index: '07', result: '12.', zero: -.02, units: 'cm', lc: {}, vsd: Infinity })).toEqual({ msr: '-', index: '07', result: '12.', zero: -.02, units: 'cm' });
    expect(restoreLearningSession({ ...restored, version: 2, seed: 44 }, 'measure', null).seed).toBe(1631);
  });
});
