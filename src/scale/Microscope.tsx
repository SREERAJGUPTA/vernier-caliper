import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PhysicalState } from '../domain/types';
import type { LabStore } from '../state/store';
import { scaleTicks, scaleReading } from '../domain/index';
import { Icon } from '../components/Icon';

export function Microscope({ store, reveal, onFreeze, large=false }: { store:LabStore; reveal:boolean; onFreeze:(value:boolean)=>void; large?:boolean }) {
  const live = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [frozen, setFrozen] = useState<PhysicalState|null>(null);
  const state = frozen ?? live;
  const [center, setCenter] = useState(state.d + state.e + 3);
  const [zoom, setZoom] = useState(90);
  const [selected, setSelected] = useState(0);
  const [width, setWidth] = useState(900);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{id:number;x:number;center:number}|null>(null);
  useEffect(() => { const el=wrap.current; if(!el) return; const obs=new ResizeObserver(entries=>setWidth(Math.max(240,entries[0].contentRect.width))); obs.observe(el); return()=>obs.disconnect(); },[]);
  useEffect(() => { setCenter(live.d+live.e+3); setSelected(0); },[live.N,live.specimen.id]);
  const ticks = scaleTicks(state.d,state.e,state.N);
  const reading = scaleReading(state.d,state.e,state.N);
  const x = (mm:number) => width/2+(mm-center)*zoom;
  const vSelected = ticks.vernier[Math.min(selected,state.N)];
  const overviewMin = state.d+state.e-3;
  const overviewSpan = state.N+5;
  const ox = (mm:number) => 22+(mm-overviewMin)/overviewSpan*(width-44);
  const toggleFreeze = () => {
    const next = frozen ? null : structuredClone(live); setFrozen(next); onFreeze(!!next);
  };
  const focusSelected = () => setCenter(vSelected.x);
  const visibleMain = ticks.main.filter(t=>x(t.x)>-28&&x(t.x)<width+28);
  const visibleVernier = ticks.vernier.filter(t=>x(t.x)>-28&&x(t.x)<width+28);
  const selectedRelation = () => {
    const left=Math.floor(vSelected.x+1e-10), delta=vSelected.x-left;
    if(Math.abs(delta)<1e-9) return `Selected Vernier division ${selected} aligns with main mark ${left} mm.`;
    return `Selected Vernier division ${selected} lies between main marks ${left} and ${left+1} mm, ${delta<.5?'closer to the lower mark':delta>.5?'closer to the upper mark':'halfway between them'}.`;
  };
  return <section className={`microscope panel ${large?'large-microscope':''}`} aria-labelledby="microscope-title" data-testid="microscope">
    <div className="section-heading"><div><span className="eyebrow">THE READING MICROSCOPE</span><h2 id="microscope-title">Two scales. One small difference.</h2></div><span className={`status-pill ${frozen?'amber':''}`}>{frozen?'Frozen snapshot':'Live instrument'}</span></div>
    <p className="muted small">The two scales share exactly the same spacing map. Choose any division, then look closely. {frozen?'Resume Live before verifying your physical measurement.':'Drag the close-up to pan, or use the arrow buttons.'}</p>
    <div className="scope-tools">
      <button onClick={()=>setCenter(state.d+state.e)}><Icon name="lens"/>Focus on zero</button>
      <label className="inline-label">Division <select aria-label="Inspect Vernier division" value={selected} onChange={e=>{const n=Number(e.target.value);setSelected(n);setCenter(ticks.vernier[n].x);}}>{ticks.vernier.map(t=><option key={t.index} value={t.index}>{t.index}</option>)}</select></label>
      <button onClick={focusSelected}>Focus selected</button>
      <button aria-pressed={!!frozen} onClick={toggleFreeze}>{frozen?'Resume Live':'Freeze'}</button>
      <button onClick={()=>{setZoom(90);setCenter(state.d+state.e+3);setSelected(0);}}>Reset microscope</button>
    </div>
    <div ref={wrap} className="scope-surface">
      <svg className="scope-overview" width="100%" height="94" viewBox={`0 0 ${width} 94`} role="img" aria-label="Full Vernier overview. Use the division selector to inspect a local region." onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setCenter(overviewMin+(e.clientX-rect.left-22)/(width-44)*overviewSpan);}}>
        <rect width={width} height="94" fill="#eee8db"/>
        <rect x={Math.max(0,ox(center-width/2/zoom))} y="5" width={Math.min(width,width/zoom/overviewSpan*(width-44))} height="84" fill="#356b67" fillOpacity=".08" stroke="#356b67" strokeDasharray="4 4"/>
        {ticks.main.filter(t=>ox(t.x)>0&&ox(t.x)<width).map(t=><g key={t.index}><line x1={ox(t.x)} x2={ox(t.x)} y1={t.major?8:16} y2="36" stroke="#36444c"/>{t.major&&<text x={ox(t.x)} y="9" textAnchor="middle" fontSize="10" fill="#22313c">{t.index}</text>}</g>)}
        {ticks.vernier.map(t=><g key={t.index}><line x1={ox(t.x)} x2={ox(t.x)} y1="42" y2={t.major?70:62} stroke={t.index===selected?'#235a55':'#36444c'} strokeWidth={t.index===selected?2:1}/>{t.major&&<text x={ox(t.x)} y="84" textAnchor="middle" fontSize="11" fill="#22313c">{t.index}</text>}</g>)}
      </svg>
      <svg data-testid="scale-closeup" className="scope-closeup" width="100%" height={large?270:220} viewBox={`0 0 ${width} 220`} role="img" aria-label="Magnified main and Vernier graduations. A text reading route is available below."
        onPointerDown={e=>{drag.current={id:e.pointerId,x:e.clientX,center};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{if(drag.current?.id===e.pointerId)setCenter(Math.max(-5,Math.min(205,drag.current.center-(e.clientX-drag.current.x)/zoom)));}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <defs><linearGradient id="scale-metal" x2="0" y2="1"><stop stopColor="#faf9f5"/><stop offset="1" stopColor="#e5e3dd"/></linearGradient></defs>
        <rect width={width} height="220" fill="#fbfaf7"/><rect y="29" width={width} height="80" rx="3" fill="url(#scale-metal)"/><rect y="114" width={width} height="82" rx="3" fill="#ede8dc"/>
        <text x="14" y="20" className="scale-caption">MAIN SCALE · mm</text><text x="14" y="212" className="scale-caption">VERNIER · DIVISION INDICES</text>
        {visibleMain.map(t=><g key={t.index} data-main-index={t.index} data-mm={t.x} data-px={x(t.x)}><line x1={x(t.x)} x2={x(t.x)} y1="107" y2={t.major?49:68} stroke="#22313c" strokeWidth={t.major?2:1.5}/><text x={x(t.x)} y={t.major?44:61} textAnchor="middle" fill="#22313c" fontSize="16" fontFamily="ui-monospace, monospace">{t.index}</text></g>)}
        {visibleVernier.map(t=><g key={t.index} data-vernier-index={t.index} data-mm={t.x} data-px={x(t.x)}><line x1={x(t.x)} x2={x(t.x)} y1="115" y2={t.major?168:156} stroke={t.index===selected?'#235a55':'#22313c'} strokeWidth={t.index===selected?3:1.5}/><text x={x(t.x)} y="187" textAnchor="middle" fill="#22313c" fontSize="16" fontFamily="ui-monospace, monospace">{t.index}</text></g>)}
        {reveal&&reading.exact&&reading.index!==null&&<g><line x1={x(ticks.vernier[reading.index].x)} x2={x(ticks.vernier[reading.index].x)} y1="30" y2="196" stroke="#235a55" strokeWidth="2" strokeDasharray="4 4"/><circle cx={x(ticks.vernier[reading.index].x)} cy="111" r="5" fill="#235a55"/></g>}
      </svg>
    </div>
    <div className="scope-bottom"><div className="button-group"><button aria-label="Pan microscope left" onClick={()=>setCenter(c=>Math.max(-5,c-width/zoom/2))}>←</button><button aria-label="Pan microscope right" onClick={()=>setCenter(c=>Math.min(205,c+width/zoom/2))}>→</button></div><label className="zoom-control">Reading magnification <input aria-label="Reading magnification" type="range" min="20" max="320" step="10" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><output>{zoom} px/mm</output></label><span className="small mono">1 LC = {(zoom/state.N).toFixed(1)} px</span></div>
    {!reading.exact&&<p className="notice">This continuous position has no exact coincidence on this plate. Estimate to the nearest least count; ties round away from zero.</p>}
    {reveal&&<div className="reasoning-strip"><span>MSR <b>{reading.msr} mm</b></span><span>+ division <b>{reading.index??'approx.'}</b> × <b>{(1/state.N).toFixed(2)} mm</b></span><span>= observed <b>{reading.exact?reading.raw.toFixed(2):`≈ ${reading.nearest.toFixed(2)}`} mm</b></span><span>− ({state.e.toFixed(2)}) = <b>{(reading.nearest-state.e).toFixed(2)} mm</b></span></div>}
    <details className="accessible-observations"><summary>Read with structured observations</summary><p>The Vernier zero {Math.abs(state.d+state.e-Math.round(state.d+state.e))<1e-9?`is at main mark ${Math.round(state.d+state.e)} mm`:`is between main marks ${Math.floor(state.d+state.e)} and ${Math.floor(state.d+state.e)+1} mm`}. Each main interval is 1 mm. There are {state.N} Vernier divisions spanning {state.N-1} mm.</p><p>{selectedRelation()}</p><p>Use the division selector above to compare candidates. These are observable scale relationships; complete the same calculation below.</p></details>
  </section>;
}
