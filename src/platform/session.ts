import type { PhysicalState, PlateN, ResponseDraft, Specimen } from '../domain/types';
import { generateSpecimen } from '../contact/specimens';
import { evaluateContact } from '../contact/solver';
import { createLearningTask, OBJECTIVES, type Difficulty, type LearningObjective, type LearningTask } from '../learning/tasks';

export type LearningMode = 'Explore' | 'Guided' | 'Practice' | 'Challenge';
export type LabPage = 'explore' | 'measure' | 'anatomy' | 'discover' | 'challenges';
export type LabView = 'gallery' | 'bench' | 'reading';
export interface LearningSession {
  version: 1;
  page: LabPage;
  view: LabView;
  learningMode: LearningMode;
  task: LearningTask | null;
  taskCount: number;
  objective: LearningObjective;
  difficulty: Difficulty;
  seed: number;
  guidedStep: number;
  prediction: string;
  timer: boolean;
  elapsed: number;
  showMicroscope: boolean;
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const within = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number => within(value, 0, max) && Number.isSafeInteger(value);
const plates: readonly PlateN[] = [10, 20, 50];
const modes = ['external', 'internal', 'depth', 'step'] as const;
const pages: readonly LabPage[] = ['explore', 'measure', 'anatomy', 'discover', 'challenges'];
const learningModes: readonly LearningMode[] = ['Explore', 'Guided', 'Practice', 'Challenge'];
const views: readonly LabView[] = ['gallery', 'bench', 'reading'];
const difficulties: readonly Difficulty[] = ['intro', 'standard', 'advanced'];
const has = <T extends string | number>(values: readonly T[], value: unknown): value is T => values.includes(value as T);

/** A separately stored opt-out takes precedence over an older session payload. */
export function mayRestoreWork(preferences: unknown, savedPreferences: unknown): boolean {
  if (object(preferences) && typeof preferences.save === 'boolean') return preferences.save;
  return !(object(savedPreferences) && savedPreferences.save === false);
}

/** The URL selects the destination; a saved challenge must not put Measure in an unnamed mode. */
export function modeForPage(page: LabPage, previous: LearningMode): LearningMode {
  if (page === 'explore') return 'Explore';
  if (page === 'challenges') return 'Challenge';
  if (page === 'measure') return previous === 'Guided' ? 'Guided' : 'Practice';
  return previous;
}

function matchesSpecimen(value: Record<string, unknown>, candidate: Specimen): boolean {
  if (!object(value.geometry)) return false;
  const scalarKeys = ['id', 'seed', 'name', 'family', 'mode', 'color'] as const;
  const geometryKeys = ['width', 'height', 'depth', 'radius', 'innerRadius', 'wall', 'levelA', 'levelB', 'floor'] as const;
  return scalarKeys.every(key => value[key] === candidate[key]) && geometryKeys.every(key => value.geometry && (value.geometry as Record<string, unknown>)[key] === candidate.geometry[key]);
}

/** Restore only supported, finite mechanics. Changing plate does not regenerate the specimen. */
export function restorePhysical(value: unknown): PhysicalState | null {
  if (!object(value) || !has(plates, value.N) || !has(modes, value.mode)
    || !within(value.d, 0, 150) || !within(value.e, -.1, .1)
    || !within(value.offset, -1000, 1000) || !within(value.tilt, -180, 180)
    || typeof value.placed !== 'boolean' || typeof value.seated !== 'boolean' || typeof value.locked !== 'boolean'
    || (value.seated && !value.placed) || !object(value.specimen) || !integer(value.specimen.seed, 0xffffffff)) return null;
  // A specimen may have been generated on a different plate before the user swapped it.
  const specimen = plates.map(N => generateSpecimen(value.mode as PhysicalState['mode'], (value.specimen as Record<string, unknown>).seed as number, N))
    .find(candidate => matchesSpecimen(value.specimen as Record<string, unknown>, candidate));
  if (!specimen) return null;
  const result: PhysicalState = { d: value.d, N: value.N, e: value.e, mode: value.mode, specimen, placed: value.placed, seated: value.seated, offset: value.offset, tilt: value.tilt, locked: value.locked };
  if (result.placed && evaluateContact(result).penetration > 1e-8) return null;
  return result;
}

export function restoreDraft(value: unknown): ResponseDraft {
  const result: ResponseDraft = { msr: '', index: '', result: '', units: 'mm' };
  if (!object(value)) return result;
  const fields = ['msr', 'index', 'result', 'msd', 'divisions', 'vsd', 'lc', 'contribution', 'observed', 'zero'] as const;
  for (const key of fields) {
    const entry = value[key];
    if ((typeof entry === 'string' && entry.length <= 200) || (typeof entry === 'number' && Number.isFinite(entry))) result[key] = entry;
  }
  if (has(['mm', 'cm', 'm'], value.units)) result.units = value.units;
  return result;
}

function restoreTask(value: unknown, physical: PhysicalState | null): LearningTask | null {
  if (!object(value) || !physical || !integer(value.seed, 0xffffffff)
    || !OBJECTIVES.some(item => item.id === value.objective && item.id !== 'mixed')
    || !has(difficulties, value.difficulty) || !has(plates, value.N)) return null;
  // Transfer chooses a new plate; try each source plate to reconstruct its actual result.
  const candidates = plates.map(N => createLearningTask(value.seed as number, value.objective as LearningObjective, value.difficulty as Difficulty, N));
  return candidates.find(task => task.id === value.id && task.N === value.N && task.mode === value.mode && task.e === value.e
    && task.N === physical.N && task.mode === physical.mode && task.e === physical.e) ?? null;
}

/** Answer visibility, feedback and teacher reveal state are deliberately absent from this schema. */
export function restoreLearningSession(value: unknown, page: LabPage, physical: PhysicalState | null): LearningSession {
  const saved = object(value) && value.version === 1 ? value : {};
  const task = restoreTask(saved.task, physical);
  const previous = has(learningModes, saved.learningMode) ? saved.learningMode : 'Explore';
  const samePage = has(pages, saved.page) && saved.page === page;
  const view = samePage && has(views, saved.view) ? saved.view : page === 'explore' ? 'gallery' : 'bench';
  return {
    version: 1, page, view, learningMode: modeForPage(page, previous), task,
    taskCount: integer(saved.taskCount) && (!task || saved.taskCount > 0) ? saved.taskCount : task ? 1 : 0,
    objective: OBJECTIVES.some(item => item.id === saved.objective) ? saved.objective as LearningObjective : 'mixed',
    difficulty: has(difficulties, saved.difficulty) ? saved.difficulty : 'standard',
    seed: integer(saved.seed, 0xffffffff) ? saved.seed : 1631,
    guidedStep: integer(saved.guidedStep, 3) ? saved.guidedStep : 0,
    prediction: typeof saved.prediction === 'string' && saved.prediction.length <= 200 ? saved.prediction : '',
    timer: saved.timer === true,
    elapsed: integer(saved.elapsed) ? saved.elapsed : 0,
    showMicroscope: samePage && saved.showMicroscope === true,
  };
}
