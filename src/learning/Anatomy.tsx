import { useId, useMemo, useState } from 'react';
import type { PlateN } from '../domain/types';
import { scaleTicks } from '../domain/scales';
import { PART_ANCHORS, PART_OUTLINES } from '../rendering/geometry';
import './learning.css';

export const ANATOMY_PARTS: ReadonlyArray<{ id:string; label:string; role:string; use:string }> = [
  {id:'fixed-external',label:'Fixed external jaw',role:'The outside reference face',use:'Seat one side of an object against its inner measuring face. This face stays at the fixed datum.'},
  {id:'moving-external',label:'Moving external jaw',role:'The outside probing face',use:'Close this jaw gently onto the opposite surface. Its measuring face moves by the slider opening d.'},
  {id:'fixed-internal',label:'Fixed internal jaw',role:'The first inside contact',use:'The outward edge establishes one side of an internal measurement. The modeled tip has finite thickness.'},
  {id:'moving-internal',label:'Moving internal jaw',role:'The second inside contact',use:'Expand this outward edge toward the other wall. A diameter requires a centered measuring section; an off-center contact measures a chord.'},
  {id:'main-scale',label:'Main scale',role:'The whole-millimetre intervals',use:'Read the last main graduation at or before the Vernier zero. These graduations remain fixed to the beam.'},
  {id:'vernier-scale',label:'Vernier scale',role:'The fractional comparison',use:'Compare its marks with the main scale. The graduation index that coincides gives the fractional contribution when an exact coincidence exists.'},
  {id:'carriage',label:'Slider / carriage',role:'One linked moving assembly',use:'Carries the moving jaws, Vernier plate, depth bar and rear moving step face. They all derive their travel from the same d.'},
  {id:'locking-screw',label:'Locking screw',role:'Holds the current opening',use:'Locks physical slider movement. A locked position can still be an invalid measurement; contact and alignment must be checked separately.'},
  {id:'thumb-roller',label:'Thumb roller',role:'Fine manual positioning',use:'Provides a convenient friction surface for small slider adjustments. It is not a micrometer ratchet or a force-controlled mechanism.'},
  {id:'depth-bar',label:'Depth bar',role:'Reaches into a cavity',use:'Extends beyond the beam end as the carriage moves. Seat the beam-end reference face on the rim before probing the bottom.'},
  {id:'beam',label:'Main beam',role:'The guide and fixed reference',use:'Supports the carriage throughout its travel. The beam continues beyond the nominal 150 mm measuring range to support the full Vernier span.'},
  {id:'step-fixed',label:'Fixed rear step face',role:'The first level reference',use:'On the rear, this face establishes the reference level for a step measurement. It is a different measuring surface from the external jaws.'},
  {id:'step-moving',label:'Moving rear step face',role:'The second level contact',use:'The separation from the fixed rear face equals d. Bring the two rear faces against the two compatible levels of a stepped specimen.'},
];

export interface AnatomyProps {
  d: number; N: PlateN; e?: number; selectedPart?: string;
  onSelectPart?: (id: string) => void; exploded: boolean;
  onExplodedChange: (value: boolean) => void; onView?: (view:'front'|'rear') => void;
}

export function Anatomy({ d, N, e=0, selectedPart, onSelectPart, exploded, onExplodedChange, onView }: AnatomyProps) {
  const [localPart,setLocalPart]=useState('fixed-external');
  const [rear,setRear]=useState(false);
  const id=useId();
  const selected=ANATOMY_PARTS.find(p=>p.id===(selectedPart??localPart))??ANATOMY_PARTS[0];
  const ticks=useMemo(()=>scaleTicks(d,e,N),[d,e,N]);
  const maximumX=225+d;
  const mmToPx=740/(maximumX+28);
  const sx=(x:number)=>rear?820-(x+14)*mmToPx:80+(x+14)*mmToPx;
  const sy=(y:number)=>155-y*mmToPx;
  const delta=(part:string):[number,number]=>!exploded?[0,0]:part==='beam'||part==='main-scale'?[0,20]:part==='depth-bar'?[0,32]:part.includes('external')?[0,-12]:part.includes('internal')?[0,8]:part==='locking-screw'?[0,16]:part==='thumb-roller'?[0,-20]:part==='vernier-scale'?[0,-24]:[0,0];
  const point=(part:string,x:number,y:number):[number,number]=>{const [dx,dy]=delta(part);return [sx(x+dx+(PART_ANCHORS[part]?.moving?d:0)),sy(y+dy)];};
  const choose=(part:string)=>{setLocalPart(part);onSelectPart?.(part);if(part.startsWith('step-')&&!rear){setRear(true);onView?.('rear');}};
  const drawPart=(part:string,fill='#c9cbc5')=>{
    const outline=PART_OUTLINES[part];if(!outline)return null;
    const isSelected=selected.id===part;
    return <g key={part} tabIndex={0} role="button" aria-label={ANATOMY_PARTS.find(p=>p.id===part)?.label??part} onClick={()=>choose(part)} onKeyDown={ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose(part);}}} className="anatomy-svg-part"><polygon points={outline.map(([x,y])=>point(part,x,y).join(',')).join(' ')} fill={isSelected?'#b2cec4':fill} stroke={isSelected?'#214e48':'#58645f'} strokeWidth={isSelected?2.5:1.1} vectorEffect="non-scaling-stroke" />{part==='carriage'&&<polygon points={[[-1,-4],[53,-4],[53,8],[-1,8]].map(([x,y])=>point(part,x,y).join(',')).join(' ')} fill="#f7f3e9" stroke="#68736b" strokeWidth="1" />}</g>;
  };
  const anchor=PART_ANCHORS[selected.id];
  const selectedXY=point(selected.id,anchor?.x??0,anchor?.y??0);
  return <section className="learning-page anatomy-page">
    <header className="learning-heading learning-heading--compact"><p className="learning-eyebrow">THE ANATOMY GUIDE</p><h2>Every part <em>has a purpose.</em></h2><p>Select a component to connect its shape, its movement, and its measuring job.</p></header>
    <div className="learning-card anatomy-main"><div className="learning-section-heading"><div className="learning-segment" aria-label="Anatomy view"><button type="button" aria-pressed={!rear} onClick={()=>{setRear(false);onView?.('front');}}>Front illustration</button><button type="button" aria-pressed={rear} onClick={()=>{setRear(true);onView?.('rear');}}>Rear illustration</button></div><button type="button" className={exploded?'learning-primary':''} aria-pressed={exploded} onClick={()=>onExplodedChange(!exploded)}>{exploded?'Reassemble instrument':'Explode components'}</button></div>
      {exploded&&<p className="learning-callout" role="status"><strong>Explanatory exploded view.</strong> Measurement controls are paused. Reassembling restores the exact opening, object, locks and response.</p>}
      <div className="anatomy-illustration-wrap"><svg className="anatomy-illustration" viewBox="0 0 900 390" role="group" aria-label={`${rear?'Rear':'Front'} orthographic caliper illustration, ${exploded?'exploded':'assembled'}. Select a component or use the component buttons below.`}>
        <defs><linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e3e6df" /><stop offset=".38" stopColor="#c2c7bf" /><stop offset=".58" stopColor="#f3f2eb" /><stop offset="1" stopColor="#aab1a8" /></linearGradient></defs>
        <ellipse cx="440" cy="326" rx="320" ry="10" fill="#ded5c7" opacity=".4" />
        {!rear&&drawPart('depth-bar','#919c98')}
        {drawPart('beam',`url(#${id}-steel)`)}
        {drawPart('fixed-external',`url(#${id}-steel)`)}{drawPart('fixed-internal',`url(#${id}-steel)`)}
        {drawPart('moving-external',`url(#${id}-steel)`)}{drawPart('moving-internal',`url(#${id}-steel)`)}
        {drawPart('carriage',`url(#${id}-steel)`)}
        {!rear&&drawPart('vernier-scale','#ecece3')}
        {rear&&drawPart('depth-bar','#8c9992')}
        {rear&&drawPart('step-fixed','#c1cdbf')}{rear&&drawPart('step-moving','#c1cdbf')}
        {!rear&&<g aria-label="Main scale" role="button" tabIndex={0} onClick={()=>choose('main-scale')} onKeyDown={ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose('main-scale');}}} className="anatomy-svg-part">
          {ticks.main.filter(t=>t.index>=0&&t.index<=205).map(t=>{const [x,y]=point('main-scale',t.x,-2);return <line key={t.index} x1={x} x2={x} y1={y} y2={y-(t.major?4:2.2)*mmToPx} stroke={selected.id==='main-scale'?'#1c645a':'#22313c'} strokeWidth={t.major?1.1:.65} />;})}
          {ticks.main.filter(t=>t.index>=0&&t.index%20===0).map(t=>{const [x,y]=point('main-scale',t.x,6);return <text key={t.index} x={x} y={y} fontSize="8" textAnchor="middle" fill="#22313c">{t.index}</text>;})}
        </g>}
        {!rear&&<g aria-hidden="true">{ticks.vernier.map(t=>{const [x,y]=point('vernier-scale',t.x-d,-5);return <line key={t.index} x1={x} x2={x} y1={y} y2={y+(t.major?4:2.5)*mmToPx} stroke="#22313c" strokeWidth={t.major?1:.65} />;})}</g>}
        {(['locking-screw','thumb-roller'] as const).map(part=>{const a=PART_ANCHORS[part];const [x,y]=point(part,a.x,a.y);return <g key={part} tabIndex={0} role="button" aria-label={part==='locking-screw'?'Locking screw':'Thumb roller'} onClick={()=>choose(part)} onKeyDown={ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose(part);}}} className="anatomy-svg-part"><rect x={x-(part==='thumb-roller'?5:3)*mmToPx} y={y-3*mmToPx} width={(part==='thumb-roller'?10:6)*mmToPx} height={6*mmToPx} rx={1.5*mmToPx} fill={selected.id===part?'#9bbeb2':'#a7aea7'} stroke={selected.id===part?'#214e48':'#54625a'} strokeWidth="1.3" />{[-2,-1,0,1,2].map(n=><line key={n} x1={x+n*mmToPx} x2={x+n*mmToPx} y1={y-2.5*mmToPx} y2={y+2.5*mmToPx} stroke="#54625a" strokeWidth=".8" />)}</g>;})}
        <circle cx={selectedXY[0]} cy={selectedXY[1]} r="5" fill="#356b67" stroke="#f7f3e9" strokeWidth="2" /><path d={`M${selectedXY[0]},${selectedXY[1]} L${selectedXY[0]},345 L450,345`} fill="none" stroke="#356b67" strokeWidth="1.5" strokeDasharray="3 4" /><rect x="280" y="350" width="340" height="31" rx="15" fill="#e0e9e0" /><text x="450" y="371" fill="#214e48" textAnchor="middle" fontSize="15" fontWeight="600">{selected.label}</text>
        <text x="30" y="27" className="svg-caption">{rear?'REAR':'FRONT'} VIEW · SELECT A COMPONENT</text>
      </svg></div>
      <div className="anatomy-detail" aria-live="polite"><span className="anatomy-part-index">{String(ANATOMY_PARTS.findIndex(p=>p.id===selected.id)+1).padStart(2,'0')} / 13</span><div><p className="learning-eyebrow">{selected.role}</p><h2>{selected.label}</h2><p>{selected.use}</p></div></div>
      <div className="anatomy-part-buttons" aria-label="Instrument components">{ANATOMY_PARTS.map(part=><button type="button" key={part.id} aria-pressed={selected.id===part.id} onClick={()=>choose(part.id)}>{part.label}</button>)}</div>
      <p className="learning-source-note">A generic four-way teaching caliper inspired by manufacturer references, with educational modifications. This is an explanatory illustration, not a certified replica.</p>
    </div>
  </section>;
}
