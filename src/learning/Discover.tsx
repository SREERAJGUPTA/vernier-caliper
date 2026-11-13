import { useId, useMemo, useState } from 'react';
import type { PlateN } from '../domain/types';
import { scaleReading, scaleTicks } from '../domain/scales';
import { PART_ANCHORS } from '../rendering/geometry';
import { HISTORY_CHAPTERS } from './history';
import './learning.css';

function HistoryArt({ chapter }: { chapter: number }) {
  const lines = Array.from({ length: 13 }, (_, i) => i);
  return <svg className="history-art" viewBox="0 0 300 180" aria-label="Original modern illustration of the measurement idea" role="img">
    <rect x="8" y="8" width="284" height="164" rx="24" fill="#f1e8d8" />
    {chapter === 0 ? <g fill="none" stroke="#365954" strokeWidth="5" strokeLinecap="round"><path d="M105 42Q64 82 73 142M105 42Q160 83 169 142" /><circle cx="106" cy="42" r="9" fill="#b79a63" /><path d="M72 142h98" strokeDasharray="3 8" /><path d="M205 42v103M197 53h16m-16 15h9m-9 15h16m-16 15h9m-9 15h16m-16 15h9" strokeWidth="2" /></g> : chapter === 2 ? <g fill="none" stroke="#566c6a" strokeWidth="2">{[45,60,75,90,105].map((r) => <path key={r} d={`M50 ${140-r} A ${r} ${r} 0 0 1 ${50+r} 140`} />)}<path d="M50 140L150 40M50 140h120" stroke="#a18443" strokeWidth="3" /><circle cx="50" cy="140" r="5" fill="#22313c" /></g> : chapter === 5 ? <g><path d="M48 75h200v35H48zM48 75V48h10v27m-10 35v35h10v-35M111 75V48h10v27m-10 35v35h10v-35" fill="#b6b8b3" stroke="#54615e" strokeWidth="2" /><rect x="105" y="66" width="84" height="54" rx="9" fill="#356b67" /><rect x="116" y="77" width="61" height="28" rx="3" fill="#e6ead6" /><text x="147" y="97" textAnchor="middle" fontSize="19" fill="#22313c" fontFamily="monospace">12.35</text></g> : chapter === 4 ? <g fill="none" stroke="#356b67" strokeWidth="3"><rect x="64" y="65" width="45" height="75" rx="3" fill="#d4ddd3" /><rect x="119" y="49" width="45" height="91" rx="3" fill="#c3cfbf" /><rect x="174" y="32" width="45" height="108" rx="3" fill="#b2c3b0" /><path d="M47 145h188" stroke="#8a7756" /><text x="142" y="163" textAnchor="middle" fontSize="12" fill="#22313c" stroke="none">REFERENCE DIMENSIONS</text></g> : <g stroke="#22313c" strokeWidth="2"><path d="M35 88h230M35 118h230" stroke="#bcae94" />{lines.map(i => <path key={i} d={`M${40+i*18} 88v${i%5===0?-31:-20}M${40+i*16.2+(chapter===3?10.8:0)} 118v${i%5===0?31:20}`} />)}<path d="M40 99h108" stroke="#356b67" strokeWidth="4" /><circle cx="148" cy="99" r="5" fill="#356b67" stroke="none" /></g>}
  </svg>;
}

export function Discover({ onStartMeasurement, onSelectPlate }: { onStartMeasurement?: () => void; onSelectPlate?: (N: PlateN) => void }) {
  const [N, setN] = useState<PlateN>(10);
  const [shift, setShift] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [angle, setAngle] = useState(0);
  const [zero, setZero] = useState<0.04 | -0.02>(0.04);
  const [calibrationSlope, setCalibrationSlope] = useState(false);
  const id = useId();
  const descriptors = useMemo(() => scaleTicks(shift, 0, N), [shift, N]);
  const reading = scaleReading(shift, 0, N);
  const pxPerMM = 696 / (N + 1);
  const x = (mm: number) => 45 + mm * pxPerMM;
  const zeroScale = scaleTicks(0, zero, 50);
  const zeroRead = scaleReading(0, zero, 50);
  const focus = zeroRead.mainIndex ?? 0;
  const planeGap = PART_ANCHORS['vernier-scale'].z - PART_ANCHORS['main-scale'].z;
  const parallaxMM = -planeGap * Math.tan(angle * Math.PI / 180);
  return <section className="learning-page discover-page" aria-label="Discover precision measurement">
    <header className="learning-heading learning-heading--compact"><h2>Two scales. <em>A new way to see.</em></h2><p>A millimetre is easy to mark. The clever part is reading what lies between the marks.</p></header>
    <section className="learning-card discovery-workshop" aria-labelledby={`${id}-workshop`}>
      <div className="learning-section-heading"><div><p className="learning-eyebrow">01 / Discover the least count</p><h2 id={`${id}-workshop`}>Make the difference visible.</h2></div><div className="learning-segment" aria-label="Discovery Vernier plate">{([10,20,50] as const).map(n => <button type="button" key={n} aria-pressed={N===n} onClick={() => { setN(n); setShift(0); setRevealed(false); setPrediction(''); }}>{n} divisions</button>)}</div></div>
      <p>Compare <strong>{N} main-scale divisions spanning {N} mm</strong> with <strong>{N} Vernier divisions spanning {N-1} mm</strong>. The smaller spacing is real; every mark below follows that construction.</p>
      <div className="discovery-scale-wrap"><svg className="discovery-scale" viewBox="0 0 790 206" role="img" aria-label={`Main scale divisions are 1 millimetre. ${N} Vernier divisions span ${N-1} millimetres. Vernier zero is displaced by ${shift.toFixed(3)} millimetres.`}>
        <rect x="20" y="43" width="750" height="63" rx="10" fill="#e7e4dd" /><rect x={x(shift)-8} y="107" width={(N-1)*pxPerMM+16} height="65" rx="8" fill="#d6dfd9" />
        <text x="28" y="25" className="svg-caption">MAIN SCALE · 1 mm per division</text><text x="28" y="196" className="svg-caption">VERNIER SCALE · {N} intervals / {N+1} graduation lines</text>
        {descriptors.main.filter(t=>t.index>=0&&t.index<=N).map(t=><g key={t.index}><line x1={x(t.x)} x2={x(t.x)} y1="99" y2={t.major?60:76} stroke="#22313c" strokeWidth="1.4" />{(N<=20||t.index%5===0)&&<text x={x(t.x)} y="55" textAnchor="middle" fontSize="13" fill="#22313c">{t.index}</text>}</g>)}
        {descriptors.vernier.map(t=><g key={t.index}><line x1={x(t.x)} x2={x(t.x)} y1="109" y2={t.major?143:132} stroke={revealed&&reading.exact&&t.index===reading.index?'#2d625c':'#22313c'} strokeWidth={revealed&&reading.exact&&t.index===reading.index?2.5:1.4} />{(N<=20||t.index%5===0)&&<text x={x(t.x)} y="163" textAnchor="middle" fontSize="13" fill="#22313c">{t.index}</text>}</g>)}
      </svg></div>
      <div className="learning-control-row"><label htmlFor={`${id}-shift`}>Move the Vernier <output>{shift.toFixed(3)} mm</output><input id={`${id}-shift`} type="range" min="0" max="1" step="0.001" value={shift} onChange={e=>setShift(Number(e.target.value))} /></label><button type="button" onClick={()=>setShift(Math.min(1,Number((shift+1/N).toFixed(9))))}>Advance by one least count</button><button type="button" onClick={()=>setShift(0)}>Align the zeros</button></div>
      <div className="discovery-equations"><div><small>ONE MAIN DIVISION</small><strong>1 mm</strong></div><div><small>ONE VERNIER DIVISION</small><strong>{N-1} ÷ {N} = {(N-1)/N} mm</strong></div><div><small>THE DIFFERENCE</small><strong>{revealed?`${1/N} mm`:'Your prediction?'}</strong></div></div>
      <form className="learning-prediction" onSubmit={e=>{e.preventDefault();setRevealed(true);}}><label htmlFor={`${id}-prediction`}>What is the least count, in mm?<input id={`${id}-prediction`} inputMode="decimal" value={prediction} onChange={e=>setPrediction(e.target.value)} placeholder="Enter your prediction" /></label><button className="learning-primary" type="submit">Compare my prediction</button></form>
      {revealed&&<div className="learning-feedback" role="status"><strong>{Math.abs(Number(prediction)-1/N)<1e-9&&prediction.trim()!==''?'You found the difference.':'Follow the difference between the spacings.'}</strong><p>LC = 1 − ({N-1}/{N}) = <strong>{1/N} mm</strong>. After {reading.index??'n'} intervals, the small spacing differences accumulate. {reading.exact?`At this position, division ${reading.index} coincides; the fractional contribution is ${reading.contribution} mm.`:'This continuous position is between readable steps; no pair is exactly coincident. A nearby overlap is an estimate.'}</p></div>}
      <details className="learning-details"><summary>Why do N divisions need N + 1 lines?</summary><p>Count the spaces in a fence with 11 posts: there are 10 spaces. A scale works the same way. The zero line starts the first interval; it is not “division one”. At an integer reading, the first and last Vernier lines can both align. Use index 0 for the fractional contribution.</p></details>
      {onSelectPlate&&<button type="button" className="learning-link-button" onClick={()=>onSelectPlate(N)}>Use this plate on the instrument →</button>}
    </section>

    <div className="learning-two-column">
      <section className="learning-card" aria-labelledby={`${id}-parallax`}><p className="learning-eyebrow">02 / Change your point of view</p><h2 id={`${id}-parallax`}>The marks stay still.<br />Their apparent alignment changes.</h2><p>In this model the main and Vernier graduation planes are separated by <strong>{planeGap.toFixed(1)} mm</strong>. An oblique sight line creates an apparent shift.</p>
        <svg viewBox="0 0 460 230" className="parallax-diagram" role="img" aria-label={`At viewing angle ${angle} degrees from the normal, a ${planeGap.toFixed(1)} millimetre plane separation creates an apparent shift of ${parallaxMM.toFixed(3)} millimetres. True graduations do not move.`}>
          <text x="20" y="24" className="svg-caption">TOP VIEW · PROJECTED GRADUATIONS</text>
          {[0,1,2,3,4,5,6].map(k=><line key={`m${k}`} x1={45+k*60} x2={45+k*60} y1="44" y2="76" stroke="#22313c" strokeWidth="2" />)}
          {[0,1,2,3,4,5,6].map(k=><line key={`v${k}`} x1={45+(k*.9+parallaxMM)*60} x2={45+(k*.9+parallaxMM)*60} y1="81" y2="108" stroke="#356b67" strokeWidth="2" />)}
          <text x="20" y="139" className="svg-caption">SIDE SECTION · ACTUAL PLANE SEPARATION</text>
          <line x1="40" x2="415" y1="200" y2="200" stroke="#22313c" strokeWidth="3" /><line x1="40" x2="415" y1="164" y2="164" stroke="#356b67" strokeWidth="3" />
          <line x1="210" y1="164" x2={210-planeGap*120*Math.tan(angle*Math.PI/180)} y2="200" stroke="#a18443" strokeWidth="3" /><line x1="210" y1="150" x2="210" y2="214" stroke="#56625e" strokeDasharray="3 5" /><circle cx="210" cy="164" r="4" fill="#356b67" /><circle cx={210-planeGap*120*Math.tan(angle*Math.PI/180)} cy="200" r="4" fill="#22313c" /><text x="318" y="187" fontSize="13" fill="#22313c">{planeGap.toFixed(1)} mm apart</text>
        </svg>
        <label htmlFor={`${id}-angle`}>Viewing angle from the normal: <strong>{angle}°</strong><input id={`${id}-angle`} type="range" min="-60" max="60" step="1" value={angle} onChange={e=>setAngle(Number(e.target.value))} /></label>
        <p className="learning-callout">Apparent shift = −h tan θ = <strong>{parallaxMM.toFixed(3)} mm</strong>. Looking straight on makes θ = 0°, so the shift vanishes. This is projection geometry, not a change in jaw opening.</p>
      </section>
      <section className="learning-card" aria-labelledby={`${id}-zero`}><p className="learning-eyebrow">03 / A zero can have a sign</p><h2 id={`${id}-zero`}>Closed jaws.<br />A displaced zero.</h2><p>The mechanical opening is zero. Only the graduation pattern is shifted. These examples use the <strong>0.02 mm plate</strong>.</p>
        <div className="learning-segment"><button type="button" aria-pressed={zero>0} onClick={()=>setZero(.04)}>+0.04 mm error</button><button type="button" aria-pressed={zero<0} onClick={()=>setZero(-.02)}>−0.02 mm error</button></div>
        <svg viewBox="0 0 460 185" className="zero-diagram" role="img" aria-label={`Closed jaws with signed zero error ${zero} millimetres. Vernier division ${zeroRead.index} matches main-scale tick ${zeroRead.mainIndex}.`}>
          <text x="20" y="23" className="svg-caption">CLOSE-UP OF MATCHING DIVISION {zeroRead.index}</text>
          <rect x="18" y="40" width="424" height="100" rx="12" fill="#f2eee5" />
          {zeroScale.main.filter(t=>Math.abs(t.x-focus)<1.15).map(t=><g key={t.index}><line x1={230+(t.x-focus)*190} x2={230+(t.x-focus)*190} y1="58" y2="91" stroke="#22313c" strokeWidth="2" /><text x={230+(t.x-focus)*190} y="52" textAnchor="middle" fontSize="13">{t.index}</text></g>)}
          {zeroScale.vernier.filter(t=>Math.abs(t.x-focus)<1.15).map(t=><g key={t.index}><line x1={230+(t.x-focus)*190} x2={230+(t.x-focus)*190} y1="95" y2="122" stroke={t.index===zeroRead.index?'#2d625c':'#22313c'} strokeWidth={t.index===zeroRead.index?3:1.5} /><text x={230+(t.x-focus)*190} y="138" textAnchor="middle" fontSize="13">{t.index}</text></g>)}
          <text x="230" y="173" textAnchor="middle" fontSize="14" fill="#22313c">{zero>0?'Vernier zero lies to the right of main zero.':'Vernier zero lies to the left of main zero.'}</text>
        </svg>
        <p className="learning-callout">{zero>0?<>e = n × LC = 2 × 0.02 = <strong>+0.04 mm</strong>.</>:<>e = −(N − n) × LC = −(50 − 49) × 0.02 = <strong>−0.02 mm</strong>.</>}</p><p>Corrected reading = observed reading − e. For an observation of 23.48 mm, this gives <strong>{(23.48-zero).toFixed(2)} mm</strong>. A negative zero error is subtracted just like any signed number.</p>
        <details className="learning-details"><summary>For a deeper mathematical view</summary><p>A small negative indication uses floor division: −0.02 = −1 + 49 × 0.02. The remainder is nonnegative. This explains the tick-49 coincidence without changing the scale geometry.</p></details>
      </section>
    </div>

    <section className="learning-card" aria-labelledby={`${id}-calibration`}><p className="learning-eyebrow">04 / Trust a measurement</p><h2 id={`${id}-calibration`}>Checking zero is a beginning.</h2><div className="learning-four-concepts"><article><h3>Zero check</h3><p>Clean and gently close the measuring faces. Observe whether the indication is zero.</p></article><article><h3>Zero correction</h3><p>Subtract a known signed offset in the calculation. The instrument itself has not changed.</p></article><article><h3>Calibration</h3><p>Compare indications with reference dimensions, including their uncertainties, to establish a measurement relationship.</p></article><article><h3>Physical adjustment</h3><p>Change the instrument to alter its indications. Adjustment and calibration are different operations.</p></article></div>
      <label className="learning-checkbox"><input type="checkbox" checked={calibrationSlope} onChange={e=>setCalibrationSlope(e.target.checked)} />Compare an illustrative instrument with a spacing error as well as a zero offset</label>
      <div className="learning-table-wrap"><table><caption>Teaching example · ideal reference dimensions, not a calibration certificate</caption><thead><tr><th scope="col">Known reference</th><th scope="col">Observed indication</th><th scope="col">After subtracting +0.04 mm</th></tr></thead><tbody>{[0,25,50,100].map(v=><tr key={v}><th scope="row">{v.toFixed(2)} mm</th><td>{(v+.04+(calibrationSlope?v*.001:0)).toFixed(3)} mm</td><td>{(v+(calibrationSlope?v*.001:0)).toFixed(3)} mm</td></tr>)}</tbody></table></div>
      <p>{calibrationSlope?'Here, removing the zero offset leaves an error that grows with length. A zero check alone would miss it. The extra digits describe this mathematical example; they do not claim the caliper can resolve them.':'In the ideal additive model used by the measuring bench, subtracting the offset removes that offset at every opening. Real instruments can have additional errors, so checking several reference dimensions matters.'}</p>
      <div className="learning-two-column learning-small-gap"><article className="learning-note"><h3>Resolution, accuracy, repeatability</h3><p><strong>Resolution:</strong> the smallest distinguishable change in indication. <strong>Accuracy:</strong> closeness to a reference value. <strong>Repeatability:</strong> how closely repeated measurements agree under the same conditions. One does not automatically prove the others.</p></article><article className="learning-note"><h3>A careful measuring routine</h3><p>Clean faces → check zero → select suitable contact surfaces → align and seat → use gentle, even pressure → look straight on → record units and suitable precision. The bench assumes rigid objects and an ideal guide; mouse speed does not simulate force or deformation.</p></article></div>
    </section>

    <section className="learning-history" aria-labelledby={`${id}-history`}><header className="learning-section-heading"><div><p className="learning-eyebrow">A SHORT HISTORY OF A BIG QUESTION</p><h2 id={`${id}-history`}>How Small Can We Measure?</h2><p>If a ruler can measure a millimetre, how do we measure something even smaller?</p></div></header><div className="history-chapters">{HISTORY_CHAPTERS.map((chapter,index)=><details className="history-chapter" key={chapter.number} open={index===0?true:undefined}><summary><span className="history-number">{chapter.number}</span><span><small>{chapter.era}</small><strong>{chapter.title}</strong></span><span aria-hidden="true" className="history-plus">+</span></summary><div className="history-body"><HistoryArt chapter={index} /><div><p>{chapter.body}</p><p className="learning-experiment"><strong>Try this thought experiment</strong><br />{chapter.experiment}</p><small>Illustration is a modern teaching reconstruction. <a href={chapter.sourceUrl} target="_blank" rel="noreferrer">Source: {chapter.source} ↗</a></small></div></div></details>)}</div></section>
    {onStartMeasurement&&<section className="learning-ending"><p className="learning-eyebrow">FROM IDEA TO INSTRUMENT</p><h2>Now, put the difference to work.</h2><button type="button" className="learning-primary" onClick={onStartMeasurement}>Try a measurement →</button></section>}
    <footer className="learning-source-note">Built for thoughtful measurement. Source notes are bundled in the project; reference links open only when selected. <a href="https://www2.mitutoyo.co.jp/eng/useful/E11003/pageindices/index23.html" target="_blank" rel="noreferrer">Technique & parallax ↗</a> · <a href="https://jcgm.bipm.org/vim/en/2.39.html" target="_blank" rel="noreferrer">Calibration terminology ↗</a></footer>
  </section>;
}
