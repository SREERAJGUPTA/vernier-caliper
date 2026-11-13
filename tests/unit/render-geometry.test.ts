import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { measuringPadGeometry, tickGeometry, polygonGeometry, PART_OUTLINES, stepSpecimenGeometry } from '../../src/rendering/geometry';
import { scaleTicks } from '../../src/domain/scales';

describe('actual rendered contact buffers and graduation buffers', () => {
  it('transformed contact vertices agree with independent datums throughout travel', () => {
    const cases = [
      ['external-fixed', false, 'max', 0], ['external-moving', true, 'min', 0],
      ['internal-fixed', false, 'min', 0], ['internal-moving', true, 'max', 0],
      ['depth-reference', false, 'max', 215], ['depth-bar', true, 'max', 215],
      ['step-fixed', false, 'min', 0], ['step-moving', true, 'max', 0],
    ] as const;
    for (const d of [0, .013, 7.6, 12.35, 23.48, 80.76, 150]) {
      for (const [kind, moving, side, datum] of cases) {
        const geometry = measuringPadGeometry(kind);
        const group = new THREE.Group(); group.position.set(moving ? d : 0, 0, 0);
        const mesh = new THREE.Mesh(geometry); group.add(mesh); group.updateMatrixWorld(true);
        const position = geometry.getAttribute('position'); const x: number[] = [];
        for (let i = 0; i < position.count; i++) {
          const vertex = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
          x.push(vertex.x);
        }
        const actual = side === 'min' ? Math.min(...x) : Math.max(...x);
        expect(Math.abs(actual - datum - (moving ? d : 0)), `${kind} d=${d}`).toBeLessThanOrEqual(.001);
        geometry.dispose(); (mesh.material as THREE.Material).dispose();
      }
    }
  });
  it('3D tick quad centers retain the independently calculated positions', () => {
    for (const N of [10, 20, 50] as const) for (const [d, e] of [[0, -.02], [7.6, 0], [23.44, .04], [150, .1]]) {
      const ticks = scaleTicks(d, e, N).vernier;
      const buffer = tickGeometry(ticks, -5, false, 3.7);
      const p = buffer.getAttribute('position');
      for (let j = 0; j <= N; j++) {
        const center = (p.getX(j * 6) + p.getX(j * 6 + 1)) / 2;
        const expected = d + e + j - j / N;
        expect(Math.abs(center - expected)).toBeLessThanOrEqual(.001);
      }
      buffer.dispose();
    }
  });
  it('finite internal knife pads and inserted blade bodies clear the canonical curved bore', () => {
    for (const radius of [2.5, 6, 10, 16.5]) {
      for (const moving of [false, true]) {
        const pad = measuringPadGeometry(moving ? 'internal-moving' : 'internal-fixed');
        const body = polygonGeometry(PART_OUTLINES[moving ? 'moving-internal' : 'fixed-internal'], .8, .07);
        for (const [geometry, zShift] of [[pad, 0], [body, moving ? .5 : -.5]] as const) {
          const position = geometry.getAttribute('position');
          for (let i = 0; i < position.count; i++) {
            if (position.getY(i) < 19) continue; // body below the insertion mouth is outside the specimen
            const x = position.getX(i) + (moving ? 2 * radius : 0);
            const z = position.getZ(i) + zShift;
            const radial = Math.hypot(x - radius, z);
            expect(radial, `radius ${radius}, ${moving ? 'moving' : 'fixed'} vertex ${i}`).toBeLessThanOrEqual(radius + 1e-6);
          }
          geometry.dispose();
        }
      }
    }
  });
  it('rear pads can travel inside both real stepped fixture meshes without penetrating either shoulder', () => {
    for (const family of ['step-block', 'stepped-flange']) {
      const separation = 23.48;
      const specimenGeometry = stepSpecimenGeometry(separation, family);
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      const specimen = new THREE.Mesh(specimenGeometry, material); specimen.position.z = -7.7; specimen.updateMatrixWorld(true);
      for (const d of [0, .013, 10, separation]) for (const moving of [false, true]) {
        const pad = measuringPadGeometry(moving ? 'step-moving' : 'step-fixed');
        pad.computeBoundingBox(); const centre = pad.boundingBox!.getCenter(new THREE.Vector3());
        const p = pad.getAttribute('position');
        for (let i = 0; i < p.count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(p, i).lerp(centre, .0001);
          point.x += moving ? d : 0;
          const ray = new THREE.Raycaster(point, new THREE.Vector3(1, .031, .019).normalize());
          const hits = ray.intersectObject(specimen).map(hit => hit.distance);
          const distinct = hits.filter((distance, n) => n === 0 || Math.abs(distance - hits[n - 1]) > 1e-6);
          expect(distinct.length % 2, `${family}, d=${d}, ${moving ? 'moving' : 'fixed'} pad vertex ${i}`).toBe(0);
        }
        pad.dispose();
      }
      specimenGeometry.dispose(); material.dispose();
    }
  });
});
