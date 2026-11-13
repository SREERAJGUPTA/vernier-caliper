import { useSyncExternalStore } from 'react';
import type { LabStore } from '../state/store';
import { evaluateContact } from '../domain/index';

export function ContactInspector({store,reveal=false,compact=false}:{store:LabStore;reveal?:boolean;compact?:boolean}) {
  const s=useSyncExternalStore(store.subscribe,store.getSnapshot), c=evaluateContact(s), g=s.specimen.geometry;
  const target=c.target??20, span=Math.max(s.d,target)+24, scale=310/span, x=(mm:number)=>40+mm*scale;
  const status=!s.placed?'Specimen in tray':c.valid?'Contact established':!s.seated?'Reference not seated':'Probe approaching';
  return <div className={`contact-inspector ${compact?'compact':''}`}>
    <div className="section-heading"><h3>Contact inspector</h3><span className="micro-label">EXPLANATORY SECTION</span></div>
    <svg viewBox="0 0 390 160" role="img" aria-label={`${s.mode} contact section: ${status}. ${c.reason}`}>
      <defs><pattern id="section-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M-1 1l2-2M0 6l6-6M5 7l2-2" stroke="#b8aea0" strokeWidth="1"/></pattern></defs>
      <rect width="390" height="160" rx="12" fill="#f4f0e6"/>
      {s.placed&&s.mode==='external'&&<rect x={x(0)} y="61" width={target*scale} height="50" rx={s.specimen.family==='block'?2:22} fill={s.specimen.color} opacity=".75"/>}
      {s.placed&&s.mode==='internal'&&<><path d={`M${x(0)-12} 45H${x(target)+12}V124H${x(0)-12}Z M${x(0)} 55V114H${x(target)}V55Z`} fill="url(#section-hatch)" fillRule="evenodd" stroke="#847b70"/><line x1={x(0)} x2={x(target)} y1="84" y2="84" stroke="#847b70" strokeDasharray="3 5"/></>}
      {s.placed&&s.mode==='depth'&&<><path d={`M${x(0)} 47H${x(target)+13}V124H${x(0)}V111H${x(target)}V60H${x(0)}Z`} fill="url(#section-hatch)" stroke="#847b70"/><text x={x(target)+17} y="91" fontSize="10" fill="#504b43">bottom</text></>}
      {s.placed&&s.mode==='step'&&<><path d={`M${x(0)} 51H${x(target)}V85H${x(target)+18}V130H${x(0)}Z`} fill="url(#section-hatch)" stroke="#847b70"/><text x={x(0)+6} y="75" fontSize="10">ledge A</text><text x={x(target)+6} y="121" fontSize="10">ledge B</text></>}
      <line x1={x(0)-(s.seated?0:7)} x2={x(0)-(s.seated?0:7)} y1="37" y2="126" stroke={c.referenceValid?'#356b67':'#796951'} strokeWidth="5"/>
      <line x1={x(s.d)} x2={x(s.d)} y1={s.mode==='depth'?78:46} y2={s.mode==='depth'?92:113} stroke={c.probeValid?'#356b67':'#22313c'} strokeWidth="5"/>
      {s.mode==='depth'&&<line x1={x(0)} x2={x(s.d)} y1="85" y2="85" stroke="#22313c" strokeWidth="6"/>}
      <text x="12" y="24" fontSize="12" fill="#22313c">Reference {c.referenceValid?'✓':'○'}</text><text x="245" y="24" fontSize="12" fill="#22313c">Probe {c.probeValid?'✓':'○'}</text>
      <text x="12" y="149" fontSize="11" fill="#504b43">{!s.placed?'Place the specimen to inspect the measuring section.':c.aligned?'Aligned measuring section':'Off-centre or tilted section — align before reading.'}</text>
    </svg>
    <p className="small">{c.reason}</p>
    {reveal&&c.gap!==null&&<p className="small mono">Remaining clearance: {Math.max(0,c.gap).toFixed(3)} mm · {g.width>0?'Rigid-body fixture':''}</p>}
  </div>;
}
