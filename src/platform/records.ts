import type { PhysicalState, ResponseDraft, VerificationResult } from '../domain/types';
export interface MeasurementRecord {
  id: string; time: string; specimen: string; family: string; mode: string; lc: number;
  user: ResponseDraft; reference: { msr: number; index: number | null; contribution: number | null; observed: number; zero: number; corrected: number };
  units: 'mm'; status: string; technique: boolean; reading: boolean; seed: number; snapshot: PhysicalState;
}
export function createRecord(state: PhysicalState, user: ResponseDraft, result: VerificationResult): MeasurementRecord {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: new Date().toISOString(), specimen: state.specimen.name, family: state.specimen.family, mode: state.mode, lc: 1 / state.N,
    user: { ...user }, reference: { msr: result.reference.msr, index: result.reference.index, contribution: result.reference.contribution, observed: result.reference.raw, zero: state.e, corrected: result.reference.corrected },
    units: 'mm', status: result.ok ? 'verified' : result.code, technique: result.techniqueCorrect, reading: result.readingCorrect, seed: state.specimen.seed, snapshot: structuredClone(state) };
}
export function recordsCSV(records: MeasurementRecord[]) {
  const headers = ['time','specimen','family','measurement_mode','least_count_mm','user_msr','user_index','user_contribution','user_observed','user_zero_error','user_result','user_units','reference_msr_mm','reference_index','reference_contribution_mm','reference_observed_mm','reference_zero_error_mm','reference_corrected_mm','reference_units','verification','technique_valid','reading_correct','seed'];
  const escape = (v: unknown) => { let s = String(v ?? ''); if (/^[=+@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = records.map(r => [r.time,r.specimen,r.family,r.mode,r.lc,r.user.msr,r.user.index,r.user.contribution,r.user.observed,r.user.zero,r.user.result,r.user.units ?? 'mm',r.reference.msr,r.reference.index,r.reference.contribution,r.reference.observed,r.reference.zero,r.reference.corrected,r.units,r.status,r.technique,r.reading,r.seed]);
  return '\uFEFF' + [headers,...rows].map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
}
