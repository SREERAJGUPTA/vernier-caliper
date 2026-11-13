/** All lengths are millimetres. This module has no rendering dependencies. */
export type PlateN = 10 | 20 | 50;
export type MeasurementMode = 'external' | 'internal' | 'depth' | 'step';
export type SpecimenFamily = 'cylinder' | 'sphere' | 'coin' | 'bolt' | 'block' | 'ring' | 'washer' | 'pipe' | 'bearing' | 'blind-hole' | 'stepped-cavity' | 'vessel' | 'step-block' | 'stepped-flange';
export interface SpecimenGeometry {
  width: number; height: number; depth: number;
  radius?: number; innerRadius?: number; wall?: number;
  levelA?: number; levelB?: number; floor?: number;
}
export interface Specimen {
  id: string; seed: number; name: string; family: SpecimenFamily;
  mode: MeasurementMode; color: string; geometry: SpecimenGeometry;
}
export interface PhysicalState {
  d: number; N: PlateN; e: number; mode: MeasurementMode;
  specimen: Specimen; placed: boolean; seated: boolean;
  /** Transverse fixture offset in mm; inside offset measures a chord. */
  offset: number;
  /** Tilt in degrees: only zero is a valid aligned fixture. */
  tilt: number; locked: boolean;
}
export interface ScaleTick { index: number; x: number; major: boolean; label: string | null }
export interface ScaleDescriptor { N: PlateN; lc: number; vsd: number; main: ScaleTick[]; vernier: ScaleTick[]; raw: number; datum: number }
export interface ScaleReading {
  raw: number; corrected: number; lc: number; vsd: number;
  msr: number; index: number | null; contribution: number | null;
  exact: boolean; nearest: number; residual: number; mainIndex: number | null;
}
export type PlacementPhase = 'unplaced' | 'positioned' | 'reference-seated' | 'probing' | 'valid-contact';
export interface ContactResult {
  valid: boolean; phase: PlacementPhase; reason: string;
  referenceValid: boolean; probeValid: boolean; aligned: boolean;
  target: number | null; gap: number | null; penetration: number;
  referenceX: number; probeX: number; clearance: number;
}
export interface MovementResult { d: number; blocked: boolean; contact: ContactResult }
export interface PlacementResult { valid: boolean; reason: string }
export interface ResponseDraft {
  msr: string | number; index: string | number; result: string | number;
  units?: string; msd?: string | number; divisions?: string | number;
  vsd?: string | number; lc?: string | number;
  contribution?: string | number; observed?: string | number; zero?: string | number;
}
export type FeedbackField = keyof ResponseDraft | 'contact' | 'estimation';
export interface VerificationResult {
  ok: boolean; techniqueCorrect: boolean; readingCorrect: boolean;
  field: FeedbackField | null; code: string; message: string;
  arithmeticConsistent: boolean; reference: ScaleReading; contact: ContactResult;
  referenceDimension: number; explanation: string[];
}
