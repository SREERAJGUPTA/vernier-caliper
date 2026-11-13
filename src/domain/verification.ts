import type { FeedbackField, PhysicalState, ResponseDraft, VerificationResult } from './types';
import { scaleReading } from './scales';
import { evaluateContact } from '../contact/solver';
import { referenceDimension } from '../contact/specimens';

const present = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';
const numeric = (v: unknown) => present(v) ? Number(v) : NaN;
const close = (a: number, b: number) => Number.isFinite(a) && Math.abs(a - b) <= 1e-9;

export function verifyReading(state: PhysicalState, draft: ResponseDraft): VerificationResult {
  const reference = scaleReading(state.d, state.e, state.N);
  const contact = evaluateContact(state);
  const unit = (draft.units ?? 'mm').trim().toLowerCase();
  const factor = unit === 'mm' ? 1 : unit === 'cm' ? 10 : unit === 'm' ? 1000 : NaN;
  const draftMsr = numeric(draft.msr);
  const draftIndex = numeric(draft.index);
  const draftLC = present(draft.lc) ? numeric(draft.lc) : reference.lc;
  const givenObserved = present(draft.observed) ? numeric(draft.observed) : draftMsr + draftIndex * draftLC;
  const arithmeticConsistent = close(numeric(draft.result) * factor, givenObserved - (present(draft.zero) ? numeric(draft.zero) : state.e));
  const expectedObserved = reference.exact ? reference.raw : reference.nearest;
  const expectedMsr = reference.exact ? reference.msr : Math.floor(reference.nearest);
  const expectedIndex = reference.exact ? reference.index! : Math.round((reference.nearest - expectedMsr) * state.N);
  const expectedResult = expectedObserved - state.e;
  let field: FeedbackField | null = null;
  let code = reference.exact ? 'correct' : 'estimate-correct';
  let message = reference.exact ? 'Correct. Your scale reading and signed zero correction agree.' : 'Correct nearest-resolution estimate. No tick is exactly coincident in this off-lattice state.';
  const fail = (f: FeedbackField, c: string, m: string) => { if (field === null) { field = f; code = c; message = m; } };
  if (!Number.isFinite(factor)) fail('units', 'units', 'Use mm, cm or m, and convert the final result to that unit. All scale-work fields are in mm.');
  if (present(draft.msd) && !close(numeric(draft.msd), 1)) fail('msd', 'main-division', 'One main-scale division is 1 mm on this instrument.');
  if (present(draft.divisions) && (!Number.isInteger(numeric(draft.divisions)) || !close(numeric(draft.divisions), state.N))) fail('divisions', 'division-count', `Count the intervals: this plate has ${state.N} divisions and ${state.N + 1} graduation lines.`);
  if (present(draft.vsd) && !close(numeric(draft.vsd), reference.vsd)) fail('vsd', 'vernier-spacing', `Divide the ${state.N - 1} mm span by ${state.N} intervals to obtain one Vernier division.`);
  if (present(draft.lc) && !close(numeric(draft.lc), reference.lc)) fail('lc', 'least-count', 'Subtract one Vernier spacing from 1 mm. Do not divide by the number of graduation lines.');
  if (!Number.isInteger(draftMsr) || !close(draftMsr, expectedMsr)) fail('msr', 'main-interval', `Find the main-scale mark immediately to the left of Vernier zero${reference.exact ? '' : ' in your nearest-resolution estimate'}. ${arithmeticConsistent ? 'Your arithmetic is consistent with your entered values; revise the starting interval.' : 'Read that interval before recalculating.'}`);
  if (!Number.isInteger(draftIndex) || !close(draftIndex, expectedIndex)) fail('index', 'tick-index', expectedIndex === 0 ? 'At an integer indication, use division 0. The far endpoint also aligns, but contributes no extra millimetre.' : `Use the semantic division index${reference.exact ? ' of the coincident pair' : ' corresponding to the nearest-resolution estimate'}, not a printed major numeral or the total number of lines.`);
  if (present(draft.contribution) && !close(numeric(draft.contribution), draftIndex * draftLC)) fail('contribution', 'multiplication', 'Multiply your selected division index by the least count.');
  if (present(draft.observed) && !close(numeric(draft.observed), draftMsr + draftIndex * draftLC)) fail('observed', 'addition', 'Add your main-scale interval and Vernier contribution to obtain the observed reading.');
  if (present(draft.zero) && !close(numeric(draft.zero), state.e)) fail('zero', 'zero-sign', 'Enter the signed instrument zero error. A zero left of main zero has a negative error.');
  if (!close(numeric(draft.result) * factor, expectedResult)) {
    const signMistake = state.e !== 0 && close(numeric(draft.result) * factor, expectedObserved + state.e);
    fail('result', signMistake ? 'correction-sign' : 'result', signMistake ? 'Subtract the signed zero error. Subtracting a negative error increases the corrected reading.' : `Use observed reading minus signed zero error, then convert the final result to ${Number.isFinite(factor) ? unit : 'a supported unit'}.`);
  }
  const readingCorrect = field === null;
  if (!contact.valid) { field = 'contact'; code = 'invalid-contact'; message = `${contact.reason} ${readingCorrect ? 'Your scale arithmetic is correct, but this is not yet a valid physical measurement.' : 'Establish valid contact before correcting your reading.'}`; }
  const explainedIndex = reference.exact ? reference.index : expectedIndex;
  return {
    ok: contact.valid && readingCorrect, techniqueCorrect: contact.valid, readingCorrect,
    field, code, message, arithmeticConsistent, reference, contact,
    referenceDimension: referenceDimension(state.specimen),
    explanation: [
      `${state.N} Vernier divisions span ${state.N - 1} mm. LC = 1 − (${state.N - 1}/${state.N}) = ${reference.lc} mm.`,
      `${reference.exact ? 'Observed' : 'Estimated'} reading = ${expectedMsr} + ${explainedIndex} × ${reference.lc} = ${Number(expectedObserved.toFixed(8))} mm.`,
      `Corrected reading = ${Number(expectedObserved.toFixed(8))} − (${state.e >= 0 ? '+' : ''}${state.e}) = ${Number(expectedResult.toFixed(8))} mm.`,
      contact.valid ? 'Both contact and alignment are valid under the rigid-fixture assumptions.' : 'The arithmetic alone cannot establish an object dimension without valid contact.',
    ],
  };
}
