import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type XY = readonly [number, number];
/** Reproducible industrial silhouettes in millimetres; shared with vector anatomy. */
export const PART_OUTLINES: Record<string, readonly XY[]> = {
  beam: [[-8,-5],[214.8,-5],[214.8,8],[-8,8]],
  'main-scale-face': [[-2,-4.8],[206,-4.8],[206,7.8],[-2,7.8]],
  'fixed-external': [[-.35,7],[-10,7],[-11,-10],[-9,-24],[-5,-37],[-2,-40],[-.35,-40]],
  'moving-external': [[.35,7],[12,7],[13,-11],[10,-24],[5,-37],[2,-40],[.35,-40]],
  'fixed-internal': [[.3,7],[8,7],[6,14],[1.5,21],[.35,24],[.35,20]],
  'moving-internal': [[-.3,7],[-8,7],[-6,14],[-1.5,21],[-.35,24],[-.35,20]],
  carriage: [[-3,-13],[56,-13],[56,11],[-3,11]],
  'vernier-scale': [[-1,-12],[51,-12],[51,-5],[-1,-5]],
  'depth-bar': [[12,-.8],[215,-.8],[215,.8],[12,.8]],
  'step-fixed': [[-3,-5],[0,-5],[0,7],[-3,7]],
  'step-moving': [[0,-5],[3,-5],[3,7],[0,7]],
};

export interface PartAnchor { x:number; y:number; z:number; moving:boolean; }
export const PART_ANCHORS: Record<string,PartAnchor> = {
  beam:{x:155,y:6,z:2,moving:false},
  'fixed-external':{x:-5,y:-24,z:3,moving:false},
  'moving-external':{x:6,y:-24,z:3,moving:true},
  'fixed-internal':{x:3,y:17,z:-.5,moving:false},
  'moving-internal':{x:-3,y:17,z:.5,moving:true},
  carriage:{x:53,y:0,z:4,moving:true},
  'main-scale':{x:93,y:1,z:3.06,moving:false},
  'vernier-scale':{x:23,y:-7,z:3.36,moving:true},
  'locking-screw':{x:37,y:15,z:0,moving:true},
  'thumb-roller':{x:46,y:-16,z:0,moving:true},
  'depth-bar':{x:212,y:0,z:-2.6,moving:true},
  'step-fixed':{x:0,y:1,z:-5,moving:false},
  'step-moving':{x:0,y:1,z:-5,moving:true},
};

export function polygonGeometry(points:readonly XY[], depth=6, bevel=.25):THREE.BufferGeometry {
  const shape=new THREE.Shape();
  points.forEach(([x,y],i)=> i===0 ? shape.moveTo(x,y) : shape.lineTo(x,y));
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:depth-2*bevel,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:12});
  geometry.translate(0,0,-depth/2+bevel);
  return geometry;
}

/** Exact measurement pads. The visible steel bodies stop short of these datums. */
export function measurementAnchors(d:number) {
  return {
    externalFixed:[0,-22,0] as const, externalMoving:[d,-22,0] as const,
    internalFixed:[0,20,0] as const, internalMoving:[d,20,0] as const,
    depthReference:[215,0,-2.6] as const,depthTip:[215+d,0,-2.6] as const,
    stepFixed:[0,1,-5.15] as const,stepMoving:[d,1,-4.85] as const,
  };
}

export type MeasuringPad='external-fixed'|'external-moving'|'internal-fixed'|'internal-moving'|'depth-reference'|'depth-bar'|'step-fixed'|'step-moving';
/** These returned buffers are the actual visible metrological mesh geometry. */
export function measuringPadGeometry(kind:MeasuringPad):THREE.BufferGeometry {
  if(kind==='internal-fixed'||kind==='internal-moving'){
    const sign=kind==='internal-fixed'?1:-1;
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(sign*.38,-sign*.9);shape.lineTo(sign*.24,-sign*.9);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1});
    geometry.rotateX(Math.PI/2);geometry.translate(0,20.5,0);return geometry;
  }
  const bounds:Record<MeasuringPad,[number,number,number,number,number,number]>={
    'external-fixed':[-.32,0,-36,-8,-3,3],
    'external-moving':[0,.32,-36,-8,-3,3],
    'internal-fixed':[0,.16,19.5,20.5,-.9,-.1],
    'internal-moving':[-.16,0,19.5,20.5,.1,.9],
    'depth-reference':[214.9,215,-4.5,7.5,-1.6,1.6],
    'depth-bar':[12,215,-.7,.7,-3.3,-1.9],
    'step-fixed':[0,.24,-5,7,-5.3,-5.01],
    'step-moving':[-.24,0,-5,7,-4.99,-4.7],
  };
  const [a,b,c,d,e,f]=bounds[kind];
  const geometry=new THREE.BoxGeometry(b-a,d-c,f-e);
  geometry.translate((a+b)/2,(c+d)/2,(e+f)/2);return geometry;
}

/** Two rear-access shoulders. The reference shoulder is recessed by .31 mm
 * across z, allowing the upper moving step blade to travel from d=0. */
export function stepSpecimenGeometry(separation:number,family='step-block'):THREE.BufferGeometry {
  const box=(a:number,b:number,c:number,d:number,e:number,f:number)=>{const g=new THREE.BoxGeometry(b-a,d-c,f-e);g.translate((a+b)/2,(c+d)/2,(e+f)/2);return g;};
  const bottom=box(-9,separation+9,-24,-6,-3,3);
  let left:THREE.BufferGeometry,right:THREE.BufferGeometry;
  if(family==='stepped-flange'){
    const flange=(front:number,x:number)=>{const g=polygonGeometry([[-front,-5],[-front,7],[-1,10],[2.5,10],[3,7],[3,-5],[2.5,-8],[-1,-8]],9,0);g.rotateY(Math.PI/2);g.translate(x,0,0);return g;};
    left=flange(2.69,-4.5);right=flange(3,separation+4.5);
  }else {left=box(-9,0,-6,10,-3,2.69);right=box(separation,separation+9,-6,10,-3,3);}
  const buffers=[bottom,left,right].map(g=>g.index?g.toNonIndexed():g);
  const geometry=mergeGeometries(buffers);
  new Set([bottom,left,right,...buffers]).forEach(g=>g.dispose());return geometry;
}

export function knurlGeometry():THREE.BufferGeometry {
  const ribs=Array.from({length:16},(_,i)=>{const g=new THREE.BoxGeometry(.18,.3,5.7);g.rotateZ(-i*Math.PI/8);g.translate(Math.sin(i*Math.PI/8)*3.5,Math.cos(i*Math.PI/8)*3.5,0);return g;});
  const result=mergeGeometries(ribs);ribs.forEach(g=>g.dispose());return result;
}

/** Open explanatory section of the same supported cavity surfaces.
 * A stepped cavity has a true annular shoulder at 45% depth and a 75%-radius
 * lower bore. The solver uses the same declared shape family and geometry. */
export function depthCavityGeometry(innerRadius:number,outerRadius:number,floor:number,stepped=false):THREE.BufferGeometry {
  const segment=(ri:number,start:number,length:number)=>{
    const shape=new THREE.Shape();shape.absarc(0,0,outerRadius,Math.PI*.15,Math.PI*1.85,false);
    shape.lineTo(Math.cos(Math.PI*1.85)*ri,Math.sin(Math.PI*1.85)*ri);
    shape.absarc(0,0,ri,Math.PI*1.85,Math.PI*.15,true);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false,curveSegments:48});
    geometry.rotateY(Math.PI/2);geometry.translate(start,0,0);return geometry;
  };
  if(!stepped)return segment(innerRadius,0,floor);
  const shoulder=floor*.45,top=segment(innerRadius,0,shoulder),bottom=segment(innerRadius*.75,shoulder,floor-shoulder);
  const result=mergeGeometries([top,bottom]);top.dispose();bottom.dispose();return result;
}

/** Merge thin ink rectangles into one buffer: dimensions stay exact, no per-tick objects. */
export function tickGeometry(ticks:readonly {x:number;index:number;major:boolean}[],y:number,up:boolean,z:number):THREE.BufferGeometry {
  const vertices:number[]=[];
  for(const t of ticks){
    const width=t.major?.11:.075, height=t.major?4.2:2.4;
    const a=t.x-width/2,b=t.x+width/2,c=y,d=y+(up?height:-height);
    vertices.push(a,c,z,b,c,z,b,d,z,a,c,z,b,d,z,a,d,z);
  }
  const result=new THREE.BufferGeometry();
  result.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  result.computeVertexNormals();return result;
}

export function ringGeometry(inner:number,outer:number,depth:number,segments=72):THREE.BufferGeometry {
  const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);
  const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:segments/4,steps:1});
  geometry.translate(0,0,-depth/2);return geometry;
}

export function disposeTree(root:THREE.Object3D) {
  const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
