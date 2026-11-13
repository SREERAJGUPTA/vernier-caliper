/** Instrument-local coordinates: x along beam, y toward inside jaws, z front. */
export const DATUMS = Object.freeze({
  graduation: 0,
  fixedExternal: 0,
  externalMinY: -36,
  externalMaxY: -8,
  externalHalfThickness: 3,
  internalY: 20,
  internalMinY: 15,
  internalMaxY: 24,
  internalTipThickness: 1.6,
  internalMinBore: 5,
  internalInsertion: 3,
  depthReference: 215,
  depthRodY: 0,
  depthRodZ: -2.6,
  depthRodHalfWidth: 0.7,
  depthRodRadius: Math.SQRT2 * 0.7,
  rearStepZ: -5,
  rearFixedStepZ: -5.15,
  rearMovingStepZ: -4.85,
  stepReach: 16,
  maxOpening: 150,
  beamEnd: 215,
});
export type Vec3Tuple = [number, number, number];
export const mmToWorld = (mm: number): number => mm;
export function partTransforms(d: number) {
  return {
    fixedExternal: [0, 0, 0] as Vec3Tuple,
    movingExternal: [d, 0, 0] as Vec3Tuple,
    fixedInternal: [0, 0, 0] as Vec3Tuple,
    movingInternal: [d, 0, 0] as Vec3Tuple,
    carriage: [d, 0, 0] as Vec3Tuple,
    vernier: [d, 0, 0] as Vec3Tuple,
    depthBar: [d, 0, 0] as Vec3Tuple,
    depthTip: [DATUMS.depthReference + d, DATUMS.depthRodY, DATUMS.depthRodZ] as Vec3Tuple,
    fixedStep: [0, 0, 0] as Vec3Tuple,
    movingStep: [d, 0, 0] as Vec3Tuple,
  };
}
export function contactAnchors(d: number) {
  return {
    externalFixed: [0, -22, 0] as Vec3Tuple,
    externalMoving: [d, -22, 0] as Vec3Tuple,
    internalFixed: [0, DATUMS.internalY, 0] as Vec3Tuple,
    internalMoving: [d, DATUMS.internalY, 0] as Vec3Tuple,
    depthReference: [DATUMS.depthReference, 0, DATUMS.depthRodZ] as Vec3Tuple,
    depthTip: [DATUMS.depthReference + d, 0, DATUMS.depthRodZ] as Vec3Tuple,
    stepFixed: [0, 1, DATUMS.rearFixedStepZ] as Vec3Tuple,
    stepMoving: [d, 1, DATUMS.rearMovingStepZ] as Vec3Tuple,
  };
}
