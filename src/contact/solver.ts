import type { ContactResult, MovementResult, PhysicalState, PlacementResult, Specimen } from '../domain/types';
import { DATUMS } from '../mechanics/kinematics';

export const CONTACT_EPSILON_MM = 1e-9;
const radians = (degrees: number) => degrees * Math.PI / 180;

/** Support of a supported specimen in the measuring direction, not an answer key. */
export function externalSupport(specimen: Specimen, tilt = 0): { min: number; max: number } {
  const g = specimen.geometry;
  if (specimen.family === 'block') {
    const a = radians(tilt);
    const half = Math.abs(Math.cos(a)) * g.width / 2 + Math.abs(Math.sin(a)) * g.height / 2;
    return { min: -half, max: half };
  }
  const radius = g.radius ?? g.width / 2;
  return { min: -radius, max: radius };
}

/** Circle/measurement-line intersections. Centering, not wall contact alone, determines a diameter. */
export function internalIntersections(specimen: Specimen, offset = 0): { left: number; right: number } | null {
  const radius = specimen.geometry.innerRadius ?? 0;
  if (radius <= 0 || Math.abs(offset) >= radius) return null;
  const halfChord = offset === 0 ? radius : Math.sqrt(radius * radius - offset * offset);
  return { left: -halfChord, right: halfChord };
}

function geometryProbe(state: PhysicalState): { target: number | null; clearance: number; error: string | null } {
  const { specimen, mode, offset, tilt } = state;
  const g = specimen.geometry;
  if (specimen.mode !== mode) return { target: null, clearance: 0, error: 'Choose a specimen compatible with this measurement mode.' };
  if (![state.d, offset, tilt, g.width, g.height, g.depth].every(Number.isFinite)) return { target: null, clearance: 0, error: 'This specimen has invalid geometry.' };
  if (mode === 'external') {
    const support = externalSupport(specimen, tilt);
    const a = radians(tilt);
    const halfHeight = specimen.family === 'block'
      ? Math.abs(Math.sin(a)) * g.width / 2 + Math.abs(Math.cos(a)) * g.height / 2
      : g.height / 2;
    const centreY = -22 + offset;
    const clearance = Math.min(centreY - halfHeight - DATUMS.externalMinY, DATUMS.externalMaxY - centreY - halfHeight);
    const target = support.max - support.min;
    return { target, clearance, error: clearance < -CONTACT_EPSILON_MM ? 'The measuring section lies beyond the finite jaw reach. Align the specimen within the jaws.' : target > 150 ? 'The specimen exceeds the 150 mm measuring range.' : null };
  }
  if (mode === 'internal') {
    const bore = (g.innerRadius ?? 0) * 2;
    const intersections = internalIntersections(specimen, offset);
    const wall = g.wall ?? ((g.radius ?? 0) - (g.innerRadius ?? 0));
    if (bore < DATUMS.internalMinBore || !intersections) return { target: null, clearance: 0, error: 'The bore is too small or the tips miss its accessible opening.' };
    const target = intersections.right - intersections.left;
    const clearance = target - 2 * DATUMS.internalTipThickness;
    const error = wall <= 0 ? 'The cavity needs a positive wall thickness.' : g.depth < DATUMS.internalInsertion ? 'The rim is too shallow for the modeled inside-jaw insertion.' : clearance <= 0 ? 'The finite inside tips cannot enter this bore.' : target > 150 ? 'The bore exceeds the measuring range.' : null;
    return { target, clearance, error };
  }
  if (mode === 'depth') {
    // Rim plane x=215; selected bottom plane x=215+floor. The rod's swept
    // circular cross-section must remain inside the supported cavity aperture.
    const floor = g.floor ?? g.depth;
    const minimumPathRadius = (g.innerRadius ?? 0) * (specimen.family === 'stepped-cavity' ? .75 : 1);
    const clearance = minimumPathRadius - Math.hypot(Math.abs(offset) + DATUMS.depthRodHalfWidth, DATUMS.depthRodHalfWidth);
    // Intersect the actual beam-end rectangle y[-4.5,7.5], z[-1.6,1.6]
    // with the cavity annulus around (y=offset,z=-2.6). A large mouth can
    // swallow the entire beam end even when the rod itself clears perfectly.
    const maxRimReach = Math.hypot(Math.max(Math.abs(-4.5 - offset), Math.abs(7.5 - offset)), 4.2);
    const minRimReach = Math.hypot(Math.max(-4.5 - offset, 0, offset - 7.5), 1);
    const rimOverlap = maxRimReach > (g.innerRadius ?? 0) + 1e-6 && minRimReach < (g.radius ?? 0) - 1e-6;
    const error = clearance < 0 ? 'The depth rod collides with a cavity wall. Centre the probe.' : !rimOverlap ? 'The mouth is too wide for the beam-end reference face to seat on its rim.' : floor < 0 || floor > 150 ? 'The selected bottom is outside the depth-bar travel.' : floor >= g.depth ? 'The cavity needs a positive bottom thickness.' : (g.wall ?? 0) <= 0 ? 'The depth reference requires a solid rim.' : null;
    return { target: floor, clearance, error };
  }
  // Rear face x=0 seats on level A. Rear moving face x=d reaches level B.
  const levelA = g.levelA ?? 0;
  const levelB = g.levelB ?? 0;
  const target = levelB - levelA;
  const clearance = Math.min(g.depth / 2 - Math.abs(offset), DATUMS.stepReach - (g.wall ?? 6));
  const error = target <= 0 || target > 150 ? 'The step separation is outside the supported range.' : clearance < 0 ? 'A rear step face is beyond the accessible ledge.' : g.height < 12 ? 'Both rear faces need supported reference ledges.' : null;
  return { target, clearance, error };
}

export function evaluateContact(state: PhysicalState): ContactResult {
  const geometry = geometryProbe(state);
  const target = geometry.target;
  const gap = target === null ? null : state.mode === 'external' ? state.d - target : target - state.d;
  const penetration = gap === null ? 0 : Math.max(0, -gap);
  const aligned = Math.abs(state.tilt) < 1e-9 && (state.mode !== 'internal' || Math.abs(state.offset) < 1e-9);
  const referenceValid = state.placed && state.seated && !geometry.error;
  const probeValid = state.placed && !geometry.error && gap !== null && Math.abs(gap) <= CONTACT_EPSILON_MM;
  const valid = referenceValid && probeValid && aligned && state.d >= 0 && state.d <= 150;
  let phase: ContactResult['phase'] = !state.placed ? 'unplaced' : !state.seated ? 'positioned' : valid ? 'valid-contact' : probeValid ? 'probing' : 'reference-seated';
  let reason: string;
  if (!state.placed) reason = 'Place the specimen in the measuring region.';
  else if (geometry.error) reason = geometry.error;
  else if (!state.seated) reason = state.mode === 'depth' ? 'Seat the beam end on the rim before reading a depth.' : state.mode === 'step' ? 'Seat the fixed rear step face on the reference ledge.' : 'Seat the fixed reference face against the specimen.';
  else if (!aligned) reason = state.mode === 'internal' && Math.abs(state.offset) > 1e-9 ? 'Off-centre wall contact measures a chord, not the bore diameter. Centre the inside tips.' : 'Remove the specimen tilt before making a valid measurement.';
  else if (penetration > CONTACT_EPSILON_MM) reason = 'The measuring feature penetrates the specimen. Reposition it before reading.';
  else if (!probeValid) reason = state.mode === 'external' ? 'Close the movable jaw gently until both faces make contact.' : state.mode === 'internal' ? 'Expand the inside jaws until both outward faces touch the bore.' : state.mode === 'depth' ? 'Extend the depth bar until its tip reaches the selected bottom.' : 'Advance the moving rear face to the second ledge.';
  else reason = 'Valid contact. Both reference and probe are seated and aligned.';
  if (state.placed && state.seated && !valid && gap !== null && gap > CONTACT_EPSILON_MM) phase = 'probing';
  return {
    valid, phase, reason, referenceValid, probeValid, aligned,
    target, gap, penetration, clearance: geometry.clearance,
    referenceX: state.mode === 'depth' ? DATUMS.depthReference : 0,
    probeX: state.mode === 'depth' ? DATUMS.depthReference + state.d : state.d,
  };
}

/** Loading only: this helper does not move the jaws or establish contact. */
export function canPlace(state: PhysicalState): PlacementResult {
  const geometry = geometryProbe(state);
  if (geometry.error || geometry.target === null) return { valid: false, reason: geometry.error ?? 'Unsupported geometry.' };
  if (state.mode === 'external' && state.d < geometry.target - CONTACT_EPSILON_MM) return { valid: false, reason: 'Open the jaws before placing this specimen.' };
  if (state.mode === 'internal' && (state.d > geometry.target - 0.4 || state.d < 2 * DATUMS.internalTipThickness)) return { valid: false, reason: 'Set an opening of at least 3.2 mm, with clearance from the bore wall, before inserting the inside tips.' };
  if ((state.mode === 'depth' || state.mode === 'step') && state.d > geometry.target + CONTACT_EPSILON_MM) return { valid: false, reason: 'Retract the probe before seating this specimen.' };
  return { valid: true, reason: 'The specimen can be placed safely. Align its reference, then move the slider to contact.' };
}

/** One-dimensional swept constraints prevent any pointer jump crossing a solid surface. */
export function constrainMovement(state: PhysicalState, requestedD: number): MovementResult {
  if (state.locked || !Number.isFinite(requestedD)) return { d: state.d, blocked: true, contact: evaluateContact(state) };
  let d = Math.min(150, Math.max(0, requestedD));
  const geometry = geometryProbe(state);
  if (state.placed && geometry.error) d = state.d;
  if (state.placed && geometry.target !== null && !geometry.error) {
    d = state.mode === 'external' ? Math.max(d, geometry.target) : Math.min(d, geometry.target);
    // Keep finite inside tip solids separated while inserted.
    if (state.mode === 'internal') d = Math.max(2 * DATUMS.internalTipThickness, d);
  }
  return { d, blocked: Math.abs(d - requestedD) > CONTACT_EPSILON_MM, contact: evaluateContact({ ...state, d }) };
}

/** Exposed for independent fixture diagnostics, never used as an answer-key lookup. */
export function fixtureSurfaceTarget(state: PhysicalState): number | null { return geometryProbe(state).target; }
