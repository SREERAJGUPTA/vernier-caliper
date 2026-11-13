import type { MeasurementMode, PlateN } from '../domain/types';

export type LearningObjective = 'mixed' | 'external' | 'internal' | 'depth' | 'step' | 'least-count' | 'positive-zero' | 'negative-zero' | 'wrong-tick' | 'resolution-accuracy' | 'transfer';
export type Difficulty = 'intro' | 'standard' | 'advanced';
export const OBJECTIVES: ReadonlyArray<{ id: LearningObjective; label: string; description: string }> = [
  { id: 'mixed', label: 'A little of everything', description: 'A seeded sequence across measurement and reasoning skills.' },
  { id: 'external', label: 'Outside dimensions', description: 'Seat an object and bring the large jaws into gentle contact.' },
  { id: 'internal', label: 'Inside diameters', description: 'Insert the small jaws and find a centered diametral contact.' },
  { id: 'depth', label: 'Depth & reference seating', description: 'Seat the depth reference face before extending the probe.' },
  { id: 'step', label: 'Step measurements', description: 'Use the rear reference and moving step faces.' },
  { id: 'least-count', label: 'Discover the least count', description: 'Find the small difference between two ordinary spacings.' },
  { id: 'positive-zero', label: 'Positive zero error', description: 'Subtract a positive offset from the observed indication.' },
  { id: 'negative-zero', label: 'Negative zero error', description: 'Subtract a negative offset and explain the sign.' },
  { id: 'wrong-tick', label: 'Find the reading mistake', description: 'Identify the first incorrect step in a proposed calculation.' },
  { id: 'resolution-accuracy', label: 'Resolution ≠ accuracy', description: 'Distinguish fine graduation spacing from trustworthy measurement.' },
  { id: 'transfer', label: 'Try an unfamiliar scale', description: 'Apply the same reading method to a new object and Vernier plate.' },
];

export interface ConceptQuestion {
  kind: 'choice'; prompt: string; options: string[]; correctIndex: number;
  explanation: string; misconception: string;
}
export interface LearningTask {
  id: string; seed: number; objective: LearningObjective; difficulty: Difficulty;
  mode: MeasurementMode; N: PlateN; e: number; title: string; prompt: string;
  hints: string[]; question?: ConceptQuestion;
}

function mix(seed: number): number {
  let a = seed | 0;
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  return (a ^ (a >>> 16)) >>> 0;
}

/** No hidden size is placed in pupil-facing names, prompts, or hints. */
export function createLearningTask(seed: number, objective: LearningObjective = 'mixed', difficulty: Difficulty = 'standard', plate: PlateN = 10): LearningTask {
  const pool: LearningObjective[] = ['external', 'internal', 'depth', 'step', 'least-count', 'positive-zero', 'negative-zero', 'wrong-tick', 'resolution-accuracy', 'transfer'];
  const resolved = objective === 'mixed' ? pool[mix(seed) % pool.length] : objective;
  const mode: MeasurementMode = (['external', 'internal', 'depth', 'step'] as const).includes(resolved as MeasurementMode)
    ? resolved as MeasurementMode : (['external', 'internal', 'depth', 'step'] as const)[mix(seed + 17) % 4];
  const N: PlateN = difficulty === 'intro' ? 10 : resolved === 'transfer' ? ([10, 20, 50] as const)[(mix(seed + 4) % 2 + ([10, 20, 50] as const).indexOf(plate) + 1) % 3] : plate;
  const lc = 1 / N;
  const e = resolved === 'positive-zero' ? Math.min(0.1, 2 * lc) : resolved === 'negative-zero' ? -lc : 0;
  const metadata = OBJECTIVES.find((item) => item.id === resolved)!;
  const contactHint: Record<MeasurementMode, string> = {
    external: 'Seat the reference side, then close the moving jaw. Both measuring faces must touch the object.',
    internal: 'Insert the inside jaws first. Center the opening before expanding: an off-center chord is shorter than a diameter.',
    depth: 'Seat the beam end on the rim before extending the depth bar. Bottom contact by itself is not enough.',
    step: 'Use the two rear step faces. Keep the fixed reference face flush with the first level.',
  };
  const result: LearningTask = {
    id: `${seed >>> 0}-${resolved}-${N}`, seed: seed >>> 0, objective: resolved, difficulty, mode, N, e,
    title: metadata.label,
    prompt: resolved === 'positive-zero' || resolved === 'negative-zero'
      ? `Measure this specimen, read the scales, then correct the signed zero error of ${e >= 0 ? '+' : '−'}${Math.abs(e).toFixed(N === 10 ? 1 : 2)} mm.`
      : `Make a valid ${mode === 'external' ? 'outside' : mode === 'internal' ? 'inside' : mode} measurement. Read the main scale and the matching Vernier division, then submit your result.`,
    hints: [contactHint[mode], 'Read the last main-scale millimetre at or before Vernier zero. Then compare candidate graduation lines.', 'Observed reading = main-scale reading + division index × least count. Corrected reading = observed reading − signed zero error.'],
  };
  if (resolved === 'least-count') {
    result.prompt = 'Look at the construction of this Vernier, then infer its least count.';
    const correct = `${lc.toFixed(N === 10 ? 1 : 2)} mm`;
    const distractors = ['1 mm', `${((N - 1) / N).toFixed(N === 10 ? 1 : 2)} mm`, `${N} mm`];
    const correctIndex = mix(seed + 21) % 4;
    const options = distractors.slice(); options.splice(correctIndex, 0, correct);
    result.question = { kind: 'choice', prompt: `${N} Vernier divisions span ${N - 1} main-scale millimetres. What is the least count?`, options, correctIndex, explanation: `One Vernier division is ${(N - 1) / N} mm. The difference from one 1 mm main-scale division is ${lc} mm. There are ${N + 1} lines but ${N} intervals.`, misconception: 'division-count' };
  } else if (resolved === 'wrong-tick') {
    result.prompt = 'Diagnose a reading before you try your own measurement.';
    result.question = {
      kind: 'choice', prompt: `The main-scale reading is 12 mm and Vernier division 7 coincides. A student writes 12 + 8 × ${lc} mm. Which is the first mistake?`,
      options: ['The student counted the zero line as division 1.', 'The 12 mm main-scale reading must be added twice.', 'The least count must be 1 mm.', 'Every calculation needs a negative zero correction.'], correctIndex: 0,
      explanation: `The zero graduation has index 0. Seven intervals from zero reaches index 7, so the observed reading is 12 + 7 × ${lc} = ${(12 + 7 * lc).toFixed(N === 10 ? 1 : 2)} mm.`, misconception: 'wrong-index',
    };
  } else if (resolved === 'resolution-accuracy') {
    result.prompt = 'Decide what a finer scale can and cannot tell you.';
    result.question = {
      kind: 'choice', prompt: 'A caliper has a 0.02 mm least count. Does this alone prove that every measured result is within 0.02 mm of the reference value?',
      options: ['Yes: the number of scale divisions certifies its accuracy.', 'No: zero error, calibration, alignment and measuring technique also matter.', 'Yes, as long as every result has two decimal places.', 'No: a Vernier caliper cannot measure fractions of a millimetre.'], correctIndex: 1,
      explanation: 'Resolution concerns the smallest distinguishable indication change. Accuracy concerns closeness to a reference value. Repeatability concerns agreement among repeated measurements under the same conditions. Fine graduations do not guarantee the other two.', misconception: 'resolution-accuracy',
    };
  }
  return result;
}

export interface ObjectiveProgress { attempts: number; completed: number; misconceptions: Record<string, number> }
export type LearningProgress = Partial<Record<LearningObjective, ObjectiveProgress>>;
export function recordLearningResult(previous: LearningProgress, objective: LearningObjective, success: boolean, misconception?: string): LearningProgress {
  const current = previous[objective] ?? { attempts: 0, completed: 0, misconceptions: {} };
  const misconceptions = { ...current.misconceptions };
  if (!success && misconception) misconceptions[misconception] = (misconceptions[misconception] ?? 0) + 1;
  return { ...previous, [objective]: { attempts: current.attempts + 1, completed: current.completed + Number(success), misconceptions } };
}
