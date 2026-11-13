import React,{Component,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {scaleTicks,type PhysicalState,type PlateN,type Specimen} from '../domain';
import {PART_OUTLINES,polygonGeometry,ringGeometry,tickGeometry,measuringPadGeometry,stepSpecimenGeometry,knurlGeometry,depthCavityGeometry,type MeasuringPad} from './geometry';
import {InteractionController,projectedAxisDelta,transitionFraction} from '../interaction/controller';
import {probeWebGL2} from '../interaction/context';
import {InputRenderLatency,type InputRenderMetrics} from '../interaction/latency';

export type CameraPreset='front'|'rear'|'side'|'top'|'perspective';
export type QualityTier='enhanced'|'standard'|'constrained';
export interface RenderDiagnostics {drawCalls:number;triangles:number;geometries:number;textures:number;materials:number;meshes:number;renderPixels:number;frameIntervalMs:number;renderer:string;p95?:number;p99?:number;sampleCount:number;sampleDurationMs:number;isDragging:boolean;inputRender:InputRenderMetrics&{source:'carriage-pointer';clock:'performance';warmupMs:number;endpoint:'after-render-submission'};}
export interface SceneProps {
  store:{getSnapshot:()=>PhysicalState;subscribe:(listener:()=>void)=>()=>void};
  onMove:(d:number)=>void;onSelectPart?:(id:string)=>void;onSelectScale?:()=>void;
  view:'gallery'|'bench'|'reading';preset:CameraPreset;resetVersion:number;
  exploded:boolean;ambientMotion:boolean;rotationLocked:boolean;quality:QualityTier;
  selectedPart?:string;onPlace?:()=>void;onInteraction?:()=>void;
  lens?:{enabled:boolean;zoom:number;x:number;y:number};onLensMove?:(x:number,y:number)=>void;
  onReady?:()=>void;onFailure?:(reason:string)=>void;onDiagnostics?:(stats:RenderDiagnostics)=>void;
}
class SceneBoundary extends Component<{children:React.ReactNode;onFailure?:SceneProps['onFailure']},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return{failed:true};}
  componentDidCatch(error:Error){this.props.onFailure?.(error.message);}
  render(){return this.state.failed?null:this.props.children;}
}

function engravingTexture(N?:PlateN){
  const canvas=document.createElement('canvas');canvas.width=N?2048:4096;canvas.height=128;
  const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,128);ctx.fillStyle='#263642';ctx.textAlign='center';
  ctx.textBaseline='middle';ctx.font=`500 ${N?58:70}px Arial, sans-serif`;
  if(N){for(let j=0;j<=N;j+=5)ctx.fillText(String(j),((j*(N-1)/N)+1)/52*2048,64);}
  else{for(let k=0;k<=200;k+=10)ctx.fillText(String(k),(k+2)/208*4096,64);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function brushedRoughness(){
  const bytes=new Uint8Array(128*128*4);let seed=1207;
  for(let y=0;y<128;y++){seed=(seed*1664525+1013904223)>>>0;const shade=180+(seed%31);for(let x=0;x<128;x++){const i=(y*128+x)*4;bytes[i]=bytes[i+1]=bytes[i+2]=shade;bytes[i+3]=255;}}
  const texture=new THREE.DataTexture(bytes,128,128);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1,6);texture.colorSpace=THREE.NoColorSpace;texture.needsUpdate=true;return texture;
}
function useMaterials(){
  const result=useMemo(()=>{
    const roughness=brushedRoughness();
    return {
      steel:new THREE.MeshStandardMaterial({color:'#c2c8c8',metalness:.94,roughness:.37,roughnessMap:roughness,envMapIntensity:1.2}),
      satin:new THREE.MeshStandardMaterial({color:'#d0d1c9',metalness:.8,roughness:.44,roughnessMap:roughness,envMapIntensity:1.1}),
      polished:new THREE.MeshStandardMaterial({color:'#c5cdcf',metalness:.95,roughness:.23}),
      dark:new THREE.MeshStandardMaterial({color:'#46515a',metalness:.85,roughness:.35}),
      ink:new THREE.MeshBasicMaterial({color:'#192a33',side:THREE.DoubleSide,toneMapped:false}),
      selected:new THREE.MeshStandardMaterial({color:'#6d9f97',metalness:.65,roughness:.35}),roughness,
    };
  },[]);
  useEffect(()=>()=>{Object.values(result).forEach(m=>m.dispose());},[result]);return result;
}
type Mats=ReturnType<typeof useMaterials>;

function Body({id,material,children,onSelect,depth=6,bevel=.25}:{id:string;material:THREE.Material;children?:React.ReactNode;onSelect?:(id:string)=>void;depth?:number;bevel?:number}){
  const geometry=useMemo(()=>polygonGeometry(PART_OUTLINES[id],depth,bevel),[id,depth,bevel]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh name={id} geometry={geometry} material={material} castShadow receiveShadow onClick={(e)=>{e.stopPropagation();onSelect?.(id);}}>{children}</mesh>;
}
function Pad({kind,material}:{kind:MeasuringPad;material:THREE.Material}){
  const geometry=useMemo(()=>measuringPadGeometry(kind),[kind]);useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh name={`contact:${kind}`} geometry={geometry} material={material} castShadow/>;
}
function Screw({position,id,material,onSelect}:{position:[number,number,number];id:string;material:THREE.Material;onSelect?:(id:string)=>void}){
  return <group name={id} position={position} onClick={e=>{e.stopPropagation();onSelect?.(id);}}>
    <mesh rotation={[Math.PI/2,0,0]} material={material} castShadow><cylinderGeometry args={[1.5,1.5,1.2,20]}/></mesh>
    <mesh position={[0,0,.64]}><boxGeometry args={[1.8,.22,.1]}/><meshBasicMaterial color="#344148"/></mesh>
  </group>;
}
function Knurl({material}:{material:THREE.Material}){const geometry=useMemo(()=>knurlGeometry(),[]);useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh geometry={geometry} material={material}/>;}
function ScaleMarkings({N,mat,patternRef,onSelectScale}:{N:PlateN;mat:Mats;patternRef:React.RefObject<THREE.Group|null>;onSelectScale?:()=>void}){
  const descriptor=useMemo(()=>scaleTicks(0,0,N),[N]);
  const main=useMemo(()=>tickGeometry(descriptor.main,-2,true,3.06),[descriptor]);
  const vernier=useMemo(()=>tickGeometry(descriptor.vernier,-5,false,3.36),[descriptor]);
  const mainTexture=useMemo(()=>engravingTexture(),[]),vernierTexture=useMemo(()=>engravingTexture(N),[N]);
  useEffect(()=>()=>{main.dispose();vernier.dispose();vernierTexture.dispose();},[main,vernier,vernierTexture]);
  useEffect(()=>()=>mainTexture.dispose(),[mainTexture]);
  return <>
    <mesh name="main-scale" geometry={main} material={mat.ink} onClick={e=>{e.stopPropagation();onSelectScale?.();}}/>
    <mesh position={[102,5.4,3.08]} onClick={e=>{e.stopPropagation();onSelectScale?.();}}><planeGeometry args={[208,3.5]}/><meshBasicMaterial map={mainTexture} transparent depthWrite={false} toneMapped={false}/></mesh>
    <group ref={patternRef}>
      <mesh name="vernier-scale" geometry={vernier} material={mat.ink} onClick={e=>{e.stopPropagation();onSelectScale?.();}}/>
      <mesh position={[25,-10.8,3.38]} onClick={e=>{e.stopPropagation();onSelectScale?.();}}><planeGeometry args={[52,2.8]}/><meshBasicMaterial map={vernierTexture} transparent depthWrite={false} toneMapped={false}/></mesh>
    </group>
  </>;
}

function SpecimenShape({specimen,preview}:{specimen:Specimen;preview:boolean}){
  const g=specimen.geometry,mode=specimen.mode;
  const material=useMemo(()=>new THREE.MeshStandardMaterial({color:specimen.color,metalness:['bolt','bearing','washer','pipe'].includes(specimen.family)?.72:.18,roughness:.36,transparent:preview,opacity:preview?.46:1,side:THREE.DoubleSide}),[specimen,preview]);
  const geometry=useMemo(()=>{
    if(mode==='internal'){const ring=ringGeometry(g.innerRadius!,g.radius!,g.depth);ring.rotateX(-Math.PI/2);return ring;}
    if(mode==='depth')return depthCavityGeometry(g.innerRadius!,g.radius!,g.floor!,specimen.family==='stepped-cavity');
    if(specimen.family==='sphere')return new THREE.SphereGeometry(g.radius!,40,24);
    if(specimen.family==='block')return new THREE.BoxGeometry(g.width,g.height,g.depth);
    if(mode==='step'){
      const step=g.levelB!-g.levelA!;
      return stepSpecimenGeometry(step,specimen.family);
    }
    const geo=new THREE.CylinderGeometry(g.radius!,g.radius!,g.depth,64);geo.rotateX(Math.PI/2);return geo;
  },[specimen]);
  useEffect(()=>()=>{material.dispose();geometry.dispose();},[material,geometry]);
  const depthFloor=g.floor??0,depthOuter=g.radius??8;
  return <>
    <mesh name={`specimen-${specimen.family}`} geometry={geometry} material={material} castShadow receiveShadow/>
    {mode==='depth'&&<mesh position={[depthFloor+2,0,0]} rotation={[0,0,Math.PI/2]} material={material} castShadow><cylinderGeometry args={[depthOuter,depthOuter,4,48]}/></mesh>}
    {specimen.family==='bolt'&&<mesh position={[0,0,-g.depth/2-2]} rotation={[Math.PI/2,0,0]} material={material}><cylinderGeometry args={[g.radius!*1.45,g.radius!*1.45,4,6]}/></mesh>}
  </>;
}

function Petals({count,active}:{count:number;active:boolean}){
  const mesh=useRef<THREE.InstancedMesh>(null);const dummy=useMemo(()=>new THREE.Object3D(),[]);
  const data=useMemo(()=>Array.from({length:12},(_,i)=>({x:-35+i*25,y:-30+(i%4)*19,z:(i%2?1:-1)*(38+(i%3)*13),phase:i*2.19,t:0})),[]);
  const shape=useMemo(()=>{const s=new THREE.Shape();s.moveTo(0,-1.7);s.bezierCurveTo(-2.9,-.7,-2.4,2.8,0,3.6);s.bezierCurveTo(2.6,2.8,2.5,-.6,0,-1.7);return new THREE.ShapeGeometry(s,10);},[]);
  useEffect(()=>()=>shape.dispose(),[shape]);
  useFrame((_,dt)=>{
    if(!mesh.current)return;mesh.current.visible=active;
    for(let i=0;i<count;i++){const p=data[i];if(active){p.t+=Math.min(dt,.06);p.y-=dt*1.9;if(p.y< -53.6){p.y=-53.6;if(p.t>55+i*2){p.y=60;p.t=0;}}}
      const settled=p.y<=-53.5;dummy.position.set(p.x+Math.sin(p.t*.3+p.phase)*4,p.y,p.z+Math.sin(p.t*.6+p.phase)*2);dummy.rotation.set(settled?-Math.PI/2:Math.sin(p.t+p.phase)*.8,p.phase+p.t*.3,settled?.3:Math.sin(p.t*.7+p.phase));dummy.scale.setScalar(.68+(i%3)*.09);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);
    }mesh.current.instanceMatrix.needsUpdate=true;
  });
  return <instancedMesh ref={mesh} args={[shape,undefined,count]} raycast={()=>undefined} frustumCulled={false}><meshStandardMaterial color="#e5b9bd" roughness={.75} side={THREE.DoubleSide}/></instancedMesh>;
}

function World(props:SceneProps){
  const {store,view,quality,exploded,rotationLocked,ambientMotion}=props;
  const {gl,scene,camera,size,invalidate,set}=useThree();const mat=useMaterials();
  const moveGroup=useRef<THREE.Group>(null),fixedJaw=useRef<THREE.Group>(null),movingJaw=useRef<THREE.Group>(null),carriage=useRef<THREE.Group>(null),insideMoving=useRef<THREE.Group>(null),insideFixed=useRef<THREE.Group>(null),plate=useRef<THREE.Group>(null),specimenGroup=useRef<THREE.Group>(null),pattern=useRef<THREE.Group>(null);
  const [semantic,setSemantic]=useState(()=>store.getSnapshot());
  const [specimenPreview,setSpecimenPreview]=useState(false);
  const activeProps=useRef(props);activeProps.current=props;
  const controller=useMemo(()=>new InteractionController(),[]),drag=useRef<{id:number;x:number;y:number;d:number;axisX:number;axisY:number}|null>(null);
  const controls=useMemo(()=>new OrbitControls(camera,gl.domElement),[camera,gl]);
  const transition=useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null),explodeAmount=useRef(0),interactionStarted=useRef(false);
  const lensCamera=useMemo(()=>new THREE.PerspectiveCamera(),[]),lensOrtho=useMemo(()=>new THREE.OrthographicCamera(),[]);
  const projectedOrigin=useMemo(()=>new THREE.Vector3(),[]),projectedX=useMemo(()=>new THREE.Vector3(),[]),drawingSize=useMemo(()=>new THREE.Vector2(),[]);
  const current=useRef(semantic);const diagnosticTime=useRef(0),ready=useRef(false);
  const frameWindow=useRef<number[]>([]),wasAnimating=useRef(false),readyAt=useRef(0);
  const inputLatency=useMemo(()=>new InputRenderLatency(240),[]);

  useEffect(()=>{
    const update=()=>{const next=store.getSnapshot();const prev=current.current;current.current=next;
      if(next.N!==prev.N||next.specimen!==prev.specimen||next.placed!==prev.placed||next.seated!==prev.seated||next.offset!==prev.offset||next.tilt!==prev.tilt)setSemantic(next);invalidate();};
    return store.subscribe(update);
  },[store,invalidate]);
  useEffect(()=>{
    const pmrem=new THREE.PMREMGenerator(gl),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.8;
    room.dispose();pmrem.dispose();invalidate();return()=>{scene.environment=null;environment.dispose();};
  },[gl,scene,invalidate]);
  useEffect(()=>{
    controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=65;controls.maxDistance=1000;controls.maxPolarAngle=Math.PI-.12;controls.minPolarAngle=.12;controls.enablePan=true;controls.screenSpacePanning=true;controls.target.set(105,-6,0);controls.update();
    const changed=()=>invalidate();const started=()=>{transition.current=null;interactionStarted.current=true;activeProps.current.onInteraction?.();};
    controls.addEventListener('change',changed);controls.addEventListener('start',started);
    return()=>{controls.removeEventListener('change',changed);controls.removeEventListener('start',started);controls.dispose();};
  },[controls,invalidate]);
  useEffect(()=>{
    if(view==='reading'&&!(camera instanceof THREE.OrthographicCamera)){
      const c=new THREE.OrthographicCamera(-65*size.width/size.height,65*size.width/size.height,65,-65,.1,2000);c.position.set(105,-6,280);set({camera:c});return;
    }
    if(view!=='reading'&&!(camera instanceof THREE.PerspectiveCamera)){
      const c=new THREE.PerspectiveCamera(32,size.width/size.height,.1,2000);c.position.set(105,96,260);set({camera:c});return;
    }
    const s=store.getSnapshot();const center=(215+s.d-15)/2;
    const visibleHeight=Math.max(110,(250+s.d)/Math.max(.3,size.width/size.height));
    const distance=visibleHeight/(2*Math.tan(16*Math.PI/180))*1.08;
    const p=props.preset;const target=new THREE.Vector3(center,-6,0);
    const position=p==='front'?new THREE.Vector3(center,-6,distance):p==='rear'?new THREE.Vector3(center,-6,-distance):p==='side'?new THREE.Vector3(center+distance,-6,.1):p==='top'?new THREE.Vector3(center,distance,.1):new THREE.Vector3(center+distance*.13,-6+distance*.35,distance);
    if(view==='reading'){position.set(center,-6,distance);}
    transition.current={position,target};invalidate();
  },[view,props.preset,props.resetVersion,camera,set,store,invalidate,size.width,size.height]);
  useEffect(()=>{
    if(camera instanceof THREE.OrthographicCamera){const halfHeight=Math.max(65,(250+store.getSnapshot().d)/(2*Math.max(.3,size.width/size.height)));camera.left=-halfHeight*size.width/size.height;camera.right=halfHeight*size.width/size.height;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();}
    const cap=quality==='constrained'?1_000_000:quality==='enhanced'?3_000_000:2_000_000;
    gl.setPixelRatio(Math.min(window.devicePixelRatio,Math.sqrt(cap/Math.max(1,size.width*size.height)),2));invalidate();
  },[camera,gl,size,quality,invalidate]);
  useEffect(()=>{
    const clear=(event?:Event)=>{const wasDragging=drag.current!==null;if(event?.type!=='lostpointercapture'||wasDragging)inputLatency.clearPending();drag.current=null;specimenDrag.current=null;setSpecimenPreview(false);controller.release();controls.enabled=true;controls.enableRotate=!activeProps.current.rotationLocked;setSemantic({...store.getSnapshot()});invalidate();};
    const secondTouch=(event:PointerEvent)=>{if(event.pointerType==='touch'&&controller.pointerId!==null&&controller.pointerId!==event.pointerId)clear();};
    const lost=(e:Event)=>{e.preventDefault();clear();activeProps.current.onFailure?.('The 3D graphics context was lost. The same measurement remains available in the 2D instrument.');};
    const vis=()=>{if(document.hidden)clear();else invalidate();};
    window.addEventListener('blur',clear);window.addEventListener('pointerdown',secondTouch);gl.domElement.addEventListener('pointercancel',clear);gl.domElement.addEventListener('lostpointercapture',clear);gl.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',vis);
    return()=>{window.removeEventListener('blur',clear);window.removeEventListener('pointerdown',secondTouch);gl.domElement.removeEventListener('pointercancel',clear);gl.domElement.removeEventListener('lostpointercapture',clear);gl.domElement.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',vis);};
  },[gl,controls,controller,invalidate]);
  const startDrag=(e:ThreeEvent<PointerEvent>)=>{
    if(exploded||store.getSnapshot().locked)return;e.stopPropagation();
    if(!controller.acquire('carriage',e.pointerId))return;
    projectedOrigin.set(store.getSnapshot().d,0,0).project(camera);projectedX.set(store.getSnapshot().d+1,0,0).project(camera);
    const axisX=(projectedX.x-projectedOrigin.x)*size.width/2,axisY=-(projectedX.y-projectedOrigin.y)*size.height/2;
    if(projectedAxisDelta(1,1,axisX,axisY)===null){controller.release();controls.target.set(105,-6,0);camera.position.set(105,-6,280);camera.lookAt(controls.target);controls.update();invalidate();return;}
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,d:store.getSnapshot().d,axisX,axisY};transition.current=null;controls.enabled=false;interactionStarted.current=true;props.onInteraction?.();
    (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
  };
  const moveDrag=(e:ThreeEvent<PointerEvent>)=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;e.stopPropagation();const delta=projectedAxisDelta(e.clientX-d.x,e.clientY-d.y,d.axisX,d.axisY);if(delta!==null){const receipt=performance.now();if(ready.current&&receipt-readyAt.current>=2000)inputLatency.recordInput(e.nativeEvent.timeStamp,receipt,performance.timeOrigin);props.onMove(d.d+delta);}invalidate();};
  const endDrag=(e:ThreeEvent<PointerEvent>)=>{if(drag.current?.id!==e.pointerId)return;e.stopPropagation();drag.current=null;controller.release(e.pointerId);controls.enabled=true;controls.enableRotate=!rotationLocked;(e.target as unknown as Element).releasePointerCapture?.(e.pointerId);invalidate();};
  const specimenDrag=useRef<{x:number;y:number;pointer:number}|null>(null);
  const grabSpecimen=(e:ThreeEvent<PointerEvent>)=>{if(exploded||semantic.placed||!props.onPlace)return;e.stopPropagation();if(!controller.acquire('specimen',e.pointerId))return;specimenDrag.current={x:e.clientX,y:e.clientY,pointer:e.pointerId};setSpecimenPreview(true);controls.enabled=false;props.onInteraction?.();(e.target as unknown as Element).setPointerCapture?.(e.pointerId);};
  const slideSpecimen=(e:ThreeEvent<PointerEvent>)=>{const grab=specimenDrag.current;if(!grab||grab.pointer!==e.pointerId||!specimenGroup.current)return;e.stopPropagation();specimenGroup.current.position.x=155+(e.clientX-grab.x)/Math.max(.5,size.width/280);specimenGroup.current.position.y=-32-(e.clientY-grab.y)/Math.max(.5,size.height/130);invalidate();};
  const dropSpecimen=(e:ThreeEvent<PointerEvent>,cancelled=false)=>{
    if(!specimenDrag.current)return;e.stopPropagation();const shift=Math.hypot(e.clientX-specimenDrag.current.x,e.clientY-specimenDrag.current.y);
    const s=store.getSnapshot(),g=s.specimen.geometry;
    const target=s.mode==='external'?new THREE.Vector3(g.radius??g.width/2,-22,0):s.mode==='internal'?new THREE.Vector3(g.innerRadius??8,19+g.depth/2,0):s.mode==='depth'?new THREE.Vector3(215+(g.floor??g.depth)/2,0,-2.6):new THREE.Vector3(((g.levelB??0)-(g.levelA??0))/2,-8,-7.7);
    target.project(camera);const rect=gl.domElement.getBoundingClientRect();
    const targetX=rect.left+(target.x+1)*rect.width/2,targetY=rect.top+(1-target.y)*rect.height/2;
    const nearFixture=Math.hypot(e.clientX-targetX,e.clientY-targetY)<=Math.max(44,Math.min(80,rect.width*.12));
    specimenDrag.current=null;setSpecimenPreview(false);controller.release();controls.enabled=true;
    if(!cancelled)(e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
    if(!cancelled&&shift>15&&nearFixture)props.onPlace?.();setSemantic({...store.getSnapshot()});invalidate();
  };
  const selectMaterial=(id:string,defaultMat=mat.steel)=>props.selectedPart===id?mat.selected:defaultMat;

  useFrame((state,dt)=>{
    const s=store.getSnapshot();const animating=Math.abs(explodeAmount.current-(exploded?1:0))>.001;
    explodeAmount.current+=((exploded?1:0)-explodeAmount.current)*transitionFraction(dt,.16);if(!animating)explodeAmount.current=exploded?1:0;
    const ex=explodeAmount.current;
    if(moveGroup.current)moveGroup.current.position.x=s.d;
    if(pattern.current){pattern.current.position.set(s.d+s.e,0,ex*42);}
    if(fixedJaw.current)fixedJaw.current.position.y=-ex*18;
    if(movingJaw.current)movingJaw.current.position.y=-ex*18;
    if(carriage.current)carriage.current.position.z=ex*22;
    if(plate.current)plate.current.position.z=2.95+ex*42;
    if(insideFixed.current)insideFixed.current.position.y=ex*22;
    if(insideMoving.current)insideMoving.current.position.y=ex*22;
    controls.enableRotate=!rotationLocked;controls.enabled=!controller.dragging;
    let cameraMoving=false;
    if(transition.current){const t=transition.current,alpha=transitionFraction(dt);camera.position.lerp(t.position,alpha);controls.target.lerp(t.target,alpha);cameraMoving=true;
      if(camera.position.distanceTo(t.position)<.02&&controls.target.distanceTo(t.target)<.02){camera.position.copy(t.position);controls.target.copy(t.target);transition.current=null;}
    }
    controls.update();
    // Keep panning bounded around the specimen and beam without changing scale geometry.
    controls.target.x=THREE.MathUtils.clamp(controls.target.x,-20,330);controls.target.y=THREE.MathUtils.clamp(controls.target.y,-75,80);controls.target.z=THREE.MathUtils.clamp(controls.target.z,-50,50);
    if(document.hidden)return;
    gl.info.autoReset=false;gl.info.reset();gl.setScissorTest(false);gl.setViewport(0,0,size.width,size.height);gl.render(scene,camera);
    if(props.lens?.enabled){
      const lens=props.lens,w=Math.min(180,size.width*.35),h=w,zoom=THREE.MathUtils.clamp(lens.zoom,1.5,12);
      const x=THREE.MathUtils.clamp(lens.x*size.width-w/2,0,size.width-w),y=THREE.MathUtils.clamp(lens.y*size.height-h/2,0,size.height-h);
      const cropped=camera instanceof THREE.PerspectiveCamera?lensCamera:lensOrtho;
      if(camera instanceof THREE.PerspectiveCamera)lensCamera.copy(camera);else lensOrtho.copy(camera as THREE.OrthographicCamera);
      cropped.setViewOffset(size.width,size.height,x+w/2-w/(2*zoom),y+h/2-h/(2*zoom),w/zoom,h/zoom);cropped.updateMatrixWorld();
      gl.setScissorTest(true);gl.setScissor(x,size.height-y-h,w,h);gl.setViewport(x,size.height-y-h,w,h);gl.clearDepth();gl.render(scene,cropped);gl.setScissorTest(false);gl.setViewport(0,0,size.width,size.height);
    }
    // The synchronous render calls have submitted this frame's commands. The GPU
    // may still be working; this explicitly does not measure display completion.
    const inputSample=inputLatency.submitted(performance.now());
    if(inputSample){
      document.dispatchEvent(new CustomEvent('precision-lab-input-render',{detail:{...inputSample,source:'carriage-pointer',endpoint:'after-render-submission'}}));
      try{performance.measure('precision-lab-pointer-to-render',{start:inputSample.inputTime,end:inputSample.submissionTime});performance.clearMeasures('precision-lab-pointer-to-render');}catch{/* Optional trace annotation must never interrupt measurement. */}
    }
    const activeFrame=cameraMoving||animating||controller.dragging||(ambientMotion&&view==='gallery'&&quality!=='constrained');
    if(!ready.current){ready.current=true;readyAt.current=performance.now();performance.mark('precision-lab-instrument-ready');props.onReady?.();}
    if(activeFrame&&wasAnimating.current&&performance.now()-readyAt.current>2000){frameWindow.current.push(dt*1000);if(frameWindow.current.length>240)frameWindow.current.shift();}
    wasAnimating.current=activeFrame;
    diagnosticTime.current+=dt;
    if(diagnosticTime.current>1){diagnosticTime.current=0;let meshes=0;const materials=new Set<THREE.Material>();scene.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});gl.getDrawingBufferSize(drawingSize);
      const samples=[...frameWindow.current].sort((a,b)=>a-b),duration=samples.reduce((a,b)=>a+b,0),valid=samples.length>=15&&duration>=3000;
      props.onDiagnostics?.({drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,materials:materials.size,meshes,renderPixels:drawingSize.x*drawingSize.y,frameIntervalMs:dt*1000,renderer:gl.getContext().getParameter(gl.getContext().RENDERER),p95:valid?samples[Math.min(samples.length-1,Math.ceil(samples.length*.95)-1)]:undefined,p99:valid?samples[Math.min(samples.length-1,Math.ceil(samples.length*.99)-1)]:undefined,sampleCount:samples.length,sampleDurationMs:duration,isDragging:controller.dragging,inputRender:{...inputLatency.metrics(),source:'carriage-pointer',clock:'performance',warmupMs:2000,endpoint:'after-render-submission'}});
    }
    if(activeFrame)invalidate();
  },1);

  const sp=semantic.specimen,g=sp.geometry;let objectPosition:[number,number,number]=[155,-32,8];
  if(semantic.placed){
    const seating=semantic.seated?0:4;
    if(sp.mode==='external')objectPosition=[(g.radius??g.width/2)+seating,-22+semantic.offset,0];
    if(sp.mode==='internal')objectPosition=[Math.sqrt(Math.max(0,(g.innerRadius??0)**2-semantic.offset**2))+seating,19+g.depth/2,semantic.offset];
    if(sp.mode==='depth')objectPosition=[215+seating,semantic.offset,-2.6];
    if(sp.mode==='step')objectPosition=[seating,0,-7.7];
  }
  return <>
    <color attach="background" args={['#f7f3e9']}/>
    <ambientLight intensity={.55}/><hemisphereLight args={['#fff4de','#b1b6ad',1.2]}/>
    <directionalLight position={[-30,100,120]} intensity={3} color="#fff2da" castShadow={quality!=='constrained'} shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-210} shadow-camera-right={210} shadow-camera-top={140} shadow-camera-bottom={-140} shadow-camera-near={1} shadow-camera-far={500} shadow-normalBias={.15}/>
    <directionalLight position={[180,40,-90]} intensity={2.7} color="#e6edf0"/>
    <directionalLight position={[240,-15,80]} intensity={1.1} color="#fffdf6"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[110,-54,0]} receiveShadow><planeGeometry args={[1200,1200]}/><meshStandardMaterial color="#ede5d6" roughness={.95}/></mesh>
    <Body id="beam" material={selectMaterial('beam',mat.satin)} depth={3.4} bevel={.2} onSelect={props.onSelectPart}/>
    <group position={[0,0,2.375]}><Body id="main-scale-face" material={selectMaterial('main-scale',mat.satin)} depth={1.35} bevel={.08} onSelect={()=>props.onSelectScale?.()}/></group>
    <Pad kind="depth-reference" material={mat.polished}/>
    <group ref={fixedJaw}><Body id="fixed-external" material={selectMaterial('fixed-external')} onSelect={props.onSelectPart}/><Pad kind="external-fixed" material={mat.polished}/></group>
    <group ref={insideFixed}><group position={[0,0,-.5]}><Body id="fixed-internal" material={selectMaterial('fixed-internal')} depth={.8} bevel={.07} onSelect={props.onSelectPart}/></group><Pad kind="internal-fixed" material={mat.polished}/></group>
    <Pad kind="step-fixed" material={selectMaterial('step-fixed',mat.polished)}/>
    <group ref={moveGroup} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <group ref={movingJaw}><Body id="moving-external" material={selectMaterial('moving-external')} onSelect={props.onSelectPart}/><Pad kind="external-moving" material={mat.polished}/></group>
      <group ref={insideMoving}><group position={[0,0,.5]}><Body id="moving-internal" material={selectMaterial('moving-internal')} depth={.8} bevel={.07} onSelect={props.onSelectPart}/></group><Pad kind="internal-moving" material={mat.polished}/></group>
      <group ref={carriage} name="carriage" onClick={e=>{e.stopPropagation();props.onSelectPart?.('carriage');}}>
        <mesh position={[27,10,0]} material={selectMaterial('carriage')} castShadow><boxGeometry args={[58,4,7]}/></mesh>
        <mesh position={[54,0,4.05]} material={selectMaterial('carriage')} castShadow><boxGeometry args={[4,18,1]}/></mesh>
        <mesh position={[-1,0,-3.2]} material={selectMaterial('carriage')} castShadow><boxGeometry args={[4,18,2]}/></mesh>
        <mesh position={[27,-11,-1]} material={selectMaterial('carriage')} castShadow><boxGeometry args={[58,5,5]}/></mesh>
        <mesh position={[27,0,-4]} material={mat.satin} castShadow><boxGeometry args={[58,20,1.4]}/></mesh>
        <group name="locking-screw" position={[37,14,0]} onClick={e=>{e.stopPropagation();props.onSelectPart?.('locking-screw');}}>
          <mesh material={selectMaterial('locking-screw',mat.dark)} castShadow><cylinderGeometry args={[3,3,4,28]}/></mesh>
          <mesh position={[0,2.1,0]} material={mat.polished}><cylinderGeometry args={[2.6,2.6,.3,28]}/></mesh>
        </group>
        <group name="thumb-roller" position={[46,-16,0]} onClick={e=>{e.stopPropagation();props.onSelectPart?.('thumb-roller');}}>
          <mesh rotation={[Math.PI/2,0,0]} material={selectMaterial('thumb-roller',mat.dark)} castShadow><cylinderGeometry args={[3.5,3.5,6,40]}/></mesh>
          <Knurl material={mat.polished}/>
        </group>
        <Screw id="slider-fastener-left" position={[2,-11,3.3]} material={mat.polished}/><Screw id="slider-fastener-right" position={[51,-11,3.3]} material={mat.polished}/>
      </group>
      <group ref={plate}><Body id="vernier-scale" material={selectMaterial('vernier-scale',mat.satin)} depth={.8} bevel={.1}/></group>
      <Pad kind="depth-bar" material={selectMaterial('depth-bar',mat.polished)}/>
      <Pad kind="step-moving" material={selectMaterial('step-moving',mat.polished)}/>
    </group>
    <ScaleMarkings N={semantic.N} mat={mat} patternRef={pattern} onSelectScale={props.onSelectScale}/>
    <group ref={specimenGroup} position={objectPosition} rotation={[0,0,semantic.placed?semantic.tilt*Math.PI/180:0]} onPointerDown={grabSpecimen} onPointerMove={slideSpecimen} onPointerUp={dropSpecimen} onPointerCancel={e=>dropSpecimen(e,true)}>
      <SpecimenShape specimen={sp} preview={specimenPreview||(semantic.placed&&(!semantic.seated||semantic.offset!==0||semantic.tilt!==0))}/>
    </group>
    <Petals count={quality==='enhanced'?12:quality==='standard'?6:0} active={ambientMotion&&view==='gallery'&&quality!=='constrained'}/>
  </>;
}

export default function Scene(props:SceneProps){
  const [capability]=useState(()=>probeWebGL2());
  const host=useRef<HTMLDivElement>(null);const [lensPosition,setLensPosition]=useState({x:props.lens?.x??.65,y:props.lens?.y??.35});
  const [dimensions,setDimensions]=useState({width:800,height:420});const lensDrag=useRef<{x:number;y:number;startX:number;startY:number;id:number}|null>(null);
  useEffect(()=>{if(props.lens)setLensPosition({x:props.lens.x,y:props.lens.y});},[props.lens?.x,props.lens?.y]);
  useEffect(()=>{if(!capability.available)props.onFailure?.(capability.reason);},[capability,props.onFailure]);
  useEffect(()=>{if(!host.current)return;const ro=new ResizeObserver(entries=>{const r=entries[0].contentRect;setDimensions({width:r.width,height:r.height});});ro.observe(host.current);return()=>ro.disconnect();},[]);
  const lens=props.lens?{...props.lens,...lensPosition}:undefined;const w=Math.min(180,dimensions.width*.35);
  if(!capability.available)return <div role="status" style={{padding:24,color:'#22313c'}}>{capability.reason}</div>;
  return <div ref={host} className="instrument-canvas" style={{position:'relative',width:'100%',height:'100%',minHeight:300}} data-testid="instrument-scene">
    <SceneBoundary onFailure={props.onFailure}>
      <Canvas shadows={props.quality!=='constrained'} frameloop="demand" dpr={[1,1.5]} camera={{position:[140,96,260],fov:32,near:.1,far:2000}} gl={defaults=>{try{return new THREE.WebGLRenderer({...defaults,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){queueMicrotask(()=>props.onFailure?.('3D initialization failed. Continue with the same state in the 2D instrument.'));throw error;}}} onCreated={({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;}} style={{touchAction:'none'}} fallback={<span>3D is unavailable. The precision 2D instrument remains available.</span>}>
        <World {...props} lens={lens}/>
      </Canvas>
    </SceneBoundary>
    {props.store.getSnapshot().mode==='depth'&&props.store.getSnapshot().placed&&<div style={{position:'absolute',right:16,bottom:12,fontSize:11,color:'#344c55',background:'#f7f3e9e8',padding:'5px 8px',borderRadius:6,pointerEvents:'none'}}>Specimen cutaway · unchanged contact geometry</div>}
    {lens?.enabled&&<div role="group" aria-label="Surface magnifier. Drag to inspect a different area." style={{position:'absolute',left:THREE.MathUtils.clamp(lens.x*dimensions.width-w/2,0,dimensions.width-w),top:THREE.MathUtils.clamp(lens.y*dimensions.height-w/2,0,dimensions.height-w),width:w,height:w,border:'2px solid #356b67',borderRadius:6,boxShadow:'0 4px 20px #22313c30',cursor:'move',touchAction:'none'}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);lensDrag.current={id:e.pointerId,x:lensPosition.x,y:lensPosition.y,startX:e.clientX,startY:e.clientY};e.stopPropagation();}} onPointerMove={e=>{const drag=lensDrag.current;if(!drag||drag.id!==e.pointerId)return;const x=THREE.MathUtils.clamp(drag.x+(e.clientX-drag.startX)/dimensions.width,.05,.95),y=THREE.MathUtils.clamp(drag.y+(e.clientY-drag.startY)/dimensions.height,.05,.95);setLensPosition({x,y});props.onLensMove?.(x,y);}} onPointerUp={e=>{lensDrag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{lensDrag.current=null;}}>
      <span style={{position:'absolute',left:-2,top:-26,color:'#fff',background:'#356b67',borderRadius:'5px 5px 0 0',padding:'4px 9px',font:'11px system-ui',whiteSpace:'nowrap'}}>Surface lens · {lens.zoom}×</span>
    </div>}
  </div>;
}
export { Scene };
