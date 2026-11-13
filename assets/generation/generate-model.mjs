// Node 24's built-in TypeScript stripping loads the exact shared model source.
// Run: node assets/generation/generate-model.mjs
import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter.js';
import {PART_OUTLINES,polygonGeometry,measuringPadGeometry,tickGeometry,knurlGeometry} from '../../src/rendering/geometry.ts';
import {scaleTicks} from '../../src/domain/scales.ts';
const root=new THREE.Group();root.name='PrecisionLab_Fresh_Parametric_Model';
const material=new THREE.MeshStandardMaterial({color:'#c2c8c8',metalness:.94,roughness:.37});
const d=23.44,e=.04,N=50;
const add=(name,geometry,position=[0,0,0],shadow=true)=>{const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(...position);mesh.castShadow=shadow;root.add(mesh);return mesh;};
add('beam',polygonGeometry(PART_OUTLINES.beam,3.4,.2));
add('main_scale_face',polygonGeometry(PART_OUTLINES['main-scale-face'],1.35,.08),[0,0,2.375]);
for(const moving of [false,true]){
  const x=moving?d:0;
  add(moving?'moving_external':'fixed_external',polygonGeometry(PART_OUTLINES[moving?'moving-external':'fixed-external']),[x,0,0]);
  add(moving?'moving_internal':'fixed_internal',polygonGeometry(PART_OUTLINES[moving?'moving-internal':'fixed-internal'],.8,.07),[x,0,moving?.5:-.5]);
  for(const type of ['external','internal','step'])add(`${type}_${moving?'moving':'fixed'}_contact`,measuringPadGeometry(`${type}-${moving?'moving':'fixed'}`),[x,0,0]);
}
add('depth_reference_face',measuringPadGeometry('depth-reference'));
add('depth_bar',measuringPadGeometry('depth-bar'),[d,0,0]);
add('vernier_plate',polygonGeometry(PART_OUTLINES['vernier-scale'],.8,.1),[d,0,2.95]);
for(const [name,w,h,t,x,y,z] of [
  ['slider_upper_rail',58,4,7,27,10,0],['slider_end',4,18,1,54,0,4.05],['slider_return',4,18,2,-1,0,-3.2],['slider_lower_rail',58,5,5,27,-11,-1],['slider_back',58,20,1.4,27,0,-4],
]) add(name,new THREE.BoxGeometry(w,h,t),[d+x,y,z]);
add('locking_screw',new THREE.CylinderGeometry(3,3,4,28),[d+37,14,0]);
const wheel=add('thumb_roller',new THREE.CylinderGeometry(3.5,3.5,6,40),[d+46,-16,0]);wheel.rotation.x=Math.PI/2;
add('thumb_roller_knurl',knurlGeometry(),[d+46,-16,0]);
const descriptor=scaleTicks(0,0,N);
add('main_graduations',tickGeometry(descriptor.main,-2,true,3.06),[0,0,0],false);
add('vernier_graduations',tickGeometry(descriptor.vernier,-5,false,3.36),[d+e,0,0],false);
root.updateMatrixWorld(true);
const partInventory=root.children.map(part=>{const geometry=part.geometry;geometry.computeBoundingBox();return{name:part.name,triangles:(geometry.index?.count??geometry.attributes.position.count)/3,position:part.position.toArray(),boundsLocal:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()}};});
await mkdir('assets/generated',{recursive:true});
await writeFile('assets/generated/caliper-reference.obj',new OBJExporter().parse(root));
await writeFile('assets/generated/model-inventory.json',JSON.stringify({description:'CPU geometry inventory; not GPU profiling or visual certification',units:'mm',configuration:{d,e,N},parts:partInventory,totalTriangles:partInventory.reduce((n,p)=>n+p.triangles,0)},null,2)+'\n');
root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});material.dispose();
console.log(JSON.stringify({parts:partInventory.length,triangles:partInventory.reduce((n,p)=>n+p.triangles,0),obj:'assets/generated/caliper-reference.obj'}));
