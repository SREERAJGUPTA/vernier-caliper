import type { MeasurementMode, PlateN, Specimen, SpecimenFamily } from '../domain/types';

export const FAMILIES: Record<MeasurementMode, readonly SpecimenFamily[]> = {
  external: ['cylinder', 'sphere', 'coin', 'bolt', 'block'],
  internal: ['ring', 'washer', 'pipe', 'bearing'],
  depth: ['blind-hole', 'stepped-cavity', 'vessel'],
  step: ['step-block', 'stepped-flange'],
};
const NAMES: Record<SpecimenFamily, string> = {
  cylinder: 'Ceramic cylinder', sphere: 'Polished sphere', coin: 'Brass token', bolt: 'Bolt shaft', block: 'Gauge block',
  ring: 'Machined ring', washer: 'Wide washer', pipe: 'Copper sleeve', bearing: 'Bearing socket',
  'blind-hole': 'Blind bore', 'stepped-cavity': 'Stepped cavity', vessel: 'Small vessel',
  'step-block': 'Two-level block', 'stepped-flange': 'Stepped flange',
};
const COLORS = ['#bd9169', '#5f8f8a', '#a0a7ad', '#ba8d96', '#af974f'];
export function seededRandom(seed: number): () => number {
  let v = seed >>> 0;
  return () => {
    v = (v + 0x6D2B79F5) >>> 0;
    let t = Math.imul(v ^ (v >>> 15), 1 | v);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function generateSpecimen(mode: MeasurementMode, seed: number, N: PlateN, family?: SpecimenFamily): Specimen {
  const random = seededRandom(seed);
  const families = FAMILIES[mode];
  const selected = family && families.includes(family) ? family : families[Math.floor(random() * families.length)];
  const lattice = (min: number, max: number) => (Math.ceil(min * N) + Math.floor(random() * (Math.floor(max * N) - Math.ceil(min * N) + 1))) / N;
  let geometry: Specimen['geometry'];
  if (mode === 'external') {
    const diameter = lattice(selected === 'bolt' ? 7 : 10, selected === 'block' ? 55 : 25);
    geometry = selected === 'block'
      ? { width: diameter, height: 18, depth: 10 }
      : { width: diameter, height: diameter, depth: selected === 'coin' ? 2.4 : selected === 'bolt' ? 19 : 12, radius: diameter / 2 };
  } else if (mode === 'internal') {
    const bore = lattice(12, 33);
    const wall = selected === 'washer' ? 4 : 3;
    geometry = { width: bore + 2 * wall, height: bore + 2 * wall, depth: selected === 'washer' ? 4 : selected === 'pipe' ? 16 : 9, radius: bore / 2 + wall, innerRadius: bore / 2, wall };
  } else if (mode === 'depth') {
    const cavity = lattice(12, selected === 'vessel' ? 48 : 36);
    const innerRadius = selected === 'vessel' ? 6 : selected === 'stepped-cavity' ? 8 : 5;
    geometry = { width: 2 * innerRadius + 6, height: 2 * innerRadius + 6, depth: cavity + 4, floor: cavity, innerRadius, radius: innerRadius + 3, wall: 3 };
  } else {
    const separation = lattice(8, 42);
    geometry = { width: separation + 14, height: 24, depth: 14, levelA: 7, levelB: 7 + separation, wall: 6 };
  }
  return { id: `${mode}-${seed >>> 0}-${selected}`, seed: seed >>> 0, name: NAMES[selected], family: selected, mode, color: COLORS[Math.floor(random() * COLORS.length)], geometry };
}

/** Independent assessment dimension. Contact code does not call this helper. */
export function referenceDimension(specimen: Specimen): number {
  const g = specimen.geometry;
  switch (specimen.mode) {
    case 'external': return specimen.family === 'block' ? g.width : 2 * (g.radius ?? g.width / 2);
    case 'internal': return 2 * (g.innerRadius ?? 0);
    case 'depth': return g.floor ?? g.depth;
    case 'step': return (g.levelB ?? 0) - (g.levelA ?? 0);
  }
}

/** Safe loading pose, distinct from contact. It never establishes a measurement. */
export function initialOpening(specimen: Specimen): number {
  if (specimen.mode === 'external') return Math.min(150, referenceDimension(specimen) + 14);
  if (specimen.mode === 'internal') return 4;
  return 0;
}
