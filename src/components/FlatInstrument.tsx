import { useSyncExternalStore } from 'react';
import type {LabStore} from '../state/store';
import {scaleTicks} from '../domain/index';
export function FlatInstrument({store,onMove,onSelectScale}:{store:LabStore;onMove:(d:number)=>void;onSelectScale:()=>void}) {
  const s=useSyncExternalStore(store.subscribe,store.getSnapshot), ticks=scaleTicks(s.d,s.e,s.N);
  const g=s.specimen.geometry;
  return <div className="flat-instrument"><p className="notice">2D precision instrument · all measurement and learning controls remain available.</p><svg viewBox={`-20 -40 ${Math.max(265,240+s.d)} 120`} role="img" aria-label="Front instrument view with mechanically linked jaws, graduations, and depth rod. Colored specimen sections show the measuring plane.">
    <defs><linearGradient id="flat-steel" x2="0" y2="1"><stop stopColor="#f9faf9"/><stop offset=".35" stopColor="#bcc4c7"/><stop offset=".7" stopColor="#e3e6e5"/><stop offset="1" stopColor="#939fa6"/></linearGradient></defs>
    {s.placed&&<g transform="translate(0 20) scale(1 -1)" fill={s.specimen.color} stroke="#627063" strokeWidth=".4" opacity={s.seated?1:.45}>
      {s.mode==='external'&&(s.specimen.family==='block'?<rect x={s.seated?0:4} y={-22-g.height/2+s.offset} width={g.width} height={g.height} rx="1"/>:<circle cx={(g.radius??0)+(s.seated?0:4)} cy={-22+s.offset} r={g.radius}/>) }
      {s.mode==='internal'&&<path d={`M${(g.innerRadius??0)+(g.radius??0)} 22a${g.radius} ${g.radius} 0 1 1 ${-2*(g.radius??0)} 0a${g.radius} ${g.radius} 0 1 1 ${2*(g.radius??0)} 0 M${2*(g.innerRadius??0)} 22a${g.innerRadius} ${g.innerRadius} 0 1 0 ${-2*(g.innerRadius??0)} 0a${g.innerRadius} ${g.innerRadius} 0 1 0 ${2*(g.innerRadius??0)} 0`} fillRule="evenodd"/>}
      {s.mode==='depth'&&<path d={`M215 -11h${(g.floor??0)+4}v22H215v-4h${g.floor}V-7H215Z`}/>}
      {s.mode==='step'&&<path d={`M-8 -30h${(g.levelB??0)+16}v20h-8v-8H0v8h-8Z`}/>}
    </g>}
    <g transform="translate(0 20) scale(1 -1)" fill="url(#flat-steel)" stroke="#58656c" strokeWidth=".4"><rect x="-8" y="0" width="223" height="12" rx="1"/><path d="M-10 12H0V-35H-4L-10-23ZM0 12V30H2V12Z"/><g transform={`translate(${s.d} 0)`}><path d="M0 12H53V-5H10V-26L3-35H0Z"/><path d="M0 12V30H-2V12Z"/><rect x="7" y="-11" width="9" height="6" rx="2"/><circle cx="22" cy="14" r="3"/><rect x="0" y="2" width="215" height="1.5"/></g></g>
    <g onClick={onSelectScale} style={{cursor:'zoom-in'}}>{ticks.main.map(t=><line key={t.index} x1={t.x} x2={t.x} y1="15" y2={t.major?9:12} stroke="#22313c" strokeWidth=".25"/>)}{ticks.vernier.map(t=><line key={t.index} x1={t.x} x2={t.x} y1="19" y2={t.major?25:23} stroke="#22313c" strokeWidth=".25"/>)}</g>
    <text x="100" y="-5" textAnchor="middle" fontSize="5" fill="#53616a">PRECISION LAB · 0–150 mm</text>
  </svg><div className="button-group"><button onClick={()=>onMove(s.d-1)}>Close 1 mm</button><button onClick={onSelectScale}>Read the scales</button><button onClick={()=>onMove(s.d+1)}>Open 1 mm</button></div></div>;
}
