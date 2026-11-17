import {useEffect,useRef,useState} from 'react';
import {Antenna,ArrowUpRight,Check,Leaf,Radio,Shield,Sun,UserRound,Wind} from 'lucide-react';
import {science} from '../outpost/science';
import {aligned,drills,RADIO_LEG_MS,relayPosition} from './fieldwork';
import type {Drill,TuneDrill} from './fieldwork';
import type {PointerEvent} from 'react';

export type EquipmentPreview={kind:TuneDrill;value:number}|{kind:'shelter';value:number};
type Props={kind:Drill;onComplete:()=>void;onPreview:(preview:EquipmentPreview|null)=>void;onStartSurvey:()=>void;storm?:{id:string;date:string;url:string}};

function LinkOut({url,label}:{url:string;label:string}) {
  return <a className="moon-source-link" href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={13}/></a>;
}
function CrewShelter({onComplete,onPreview,storm}:Pick<Props,'onComplete'|'onPreview'|'storm'>) {
  const [crew,setCrew]=useState<number[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [ghost,setGhost]=useState<{x:number;y:number}|null>(null);
  const shelter=useRef<HTMLButtonElement>(null);
  const dragging=useRef<{id:number;pointer:number;x:number;y:number;moved:boolean}|null>(null);
  function place(id:number) {
    if(crew.includes(id))return;
    const inside=[...crew,id];
    setCrew(inside);setSelected(null);
    onPreview({kind:'shelter',value:inside.length});
    if(inside.length===2)onComplete();
  }
  function pick(event:PointerEvent<HTMLButtonElement>,id:number) {
    if(event.button!==0)return;
    dragging.current={id,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function drag(event:PointerEvent<HTMLButtonElement>) {
    const active=dragging.current;
    if(active?.pointer!==event.pointerId)return;
    if(Math.hypot(event.clientX-active.x,event.clientY-active.y)>6)active.moved=true;
    if(active.moved)setGhost({x:event.clientX,y:event.clientY});
  }
  function release(event:PointerEvent<HTMLButtonElement>) {
    const active=dragging.current;
    dragging.current=null;setGhost(null);
    if(!active?.moved)return;
    const rect=shelter.current?.getBoundingClientRect();
    if(rect&&event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom)place(active.id);
  }
  return <section className="fieldwork">
    <div className="moon-dialog-label">HANDS-ON TRAINING · RADIATION</div><h2 id="moon-dialog-title">Move the crew into shelter</h2>
    <p className="moon-dialog-copy">Drag both astronauts into the shielded room. You can also select an astronaut, then select the shelter to move them.</p>
    {storm&&<LinkOut url={storm.url} label={`Archived NASA DONKI event · ${storm.date}`}/>}
    <div className="crew-field">
      <div className="crew-bay"><strong>Outside</strong>{[1,2].map(id=><button key={id} disabled={crew.includes(id)} className="crew-token" aria-pressed={selected===id}
        onClick={()=>setSelected(id)} onPointerDown={event=>pick(event,id)} onPointerMove={drag} onPointerUp={release}
        onPointerCancel={()=>{dragging.current=null;setGhost(null);}}><UserRound size={21}/>Astronaut {id}</button>)}</div>
      <button ref={shelter} className="crew-shelter" aria-label={`Shielded shelter, ${crew.length} of 2 astronauts`} onClick={()=>{if(selected!==null)place(selected);}}>
        <Shield size={30}/><b>Shielded shelter</b><span>{crew.length} / 2 inside</span>
      </button>
    </div>
    {ghost&&<span className="crew-ghost" aria-hidden="true" style={{left:ghost.x,top:ghost.y}}><UserRound size={26}/></span>}
    <div className="field-meter-pair">
      <div><span>Orion crew cabin</span><b>{science.radlab.cabinRate} μGy/min</b><i style={{width:'100%'}}/></div>
      <div className={crew.length?'meter-selected':''}><span>Orion storm shelter</span><b>{science.radlab.shelterRate} μGy/min</b><i style={{width:`${100*science.radlab.shelterRate/science.radlab.cabinRate}%`}}/></div>
    </div>
    <p className="moon-inline-note">Artemis I measured these peaks inside Orion. They compare two locations in a spacecraft.</p>
    <LinkOut url={science.radlab.analysis} label="Artemis I measurement study"/>
    {crew.length===2&&<p className="field-success" role="status"><Check size={17}/>Both astronauts shielded. The shift plan now uses the shelter.</p>}
  </section>;
}

function TuneEquipment({kind,onComplete,onPreview}:Pick<Props,'onComplete'|'onPreview'>&{kind:TuneDrill}) {
  const drill=drills[kind];
  const [value,setValue]=useState(18);
  const [settled,setSettled]=useState(false);
  const [signal,setSignal]=useState<number|null>(null);
  const onDone=useRef(onComplete);
  onDone.current=onComplete;
  const locked=aligned(value,drill.target);
  const radio=kind==='radio';
  useEffect(()=>{
    if(!locked||settled)return;
    const timer=window.setTimeout(()=>{setSettled(true);if(!radio)onDone.current();},700);
    return()=>window.clearTimeout(timer);
  },[locked,radio,settled]);
  const flightStart=useRef<number|null>(null);
  const raf=useRef(0);
  useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);
  function transmit() {
    if(!settled||flightStart.current!==null)return;
    flightStart.current=performance.now();setSignal(0);
    const animate=(now:number)=>{
      const elapsed=Math.min(2*RADIO_LEG_MS,now-(flightStart.current??now));
      setSignal(elapsed);
      if(elapsed<2*RADIO_LEG_MS)raf.current=requestAnimationFrame(animate);
      else onDone.current();
    };
    raf.current=requestAnimationFrame(animate);
  }
  function adjust(next:number) {
    if(settled)return;
    const position=Math.max(0,Math.min(100,Math.round(next)));
    setValue(position);
    onPreview({kind,value:position});
  }
  function dragHardware(event:PointerEvent<HTMLDivElement>) {
    const rect=event.currentTarget.getBoundingClientRect();
    adjust((event.clientX-rect.left)/rect.width*100);
  }
  const Icon=kind==='air'?Wind:kind==='plants'?Leaf:kind==='power'?Sun:Antenna;
  return <section className="fieldwork">
    <div className="moon-dialog-label">HANDS-ON TRAINING</div><h2 id="moon-dialog-title">{drill.title}</h2>
    <p className="moon-dialog-copy">{drill.instruction}</p>
    <div className={`field-hardware field-${kind} ${locked?'aligned':''}`} aria-hidden="true" onPointerDown={event=>{if(!settled){event.currentTarget.setPointerCapture(event.pointerId);dragHardware(event);}}}
      onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))dragHardware(event);}}>
      <i className="field-socket" style={{left:drill.target+'%'}}/>
      <span className="field-handle" style={{left:value+'%'}}><Icon size={27}/></span>
    </div>
    <label className="field-slider-label"><span>{drill.label}</span>
      <input type="range" min={0} max={100} value={value} disabled={settled} onChange={event=>adjust(Number(event.currentTarget.value))}/>
    </label>
    <p className={`field-align ${locked?'aligned':''}`} role="status">{settled?'Aligned and locked.':locked?'Hold steady…':value<drill.target?'Move the control right.':'Move the control left.'}</p>
    {kind==='air'&&<p className="moon-inline-note">This crew needs {2*science.crew.oxygen} kg of oxygen per simulated day, using NASA’s reference value for two crew members.</p>}
    {kind==='plants'&&<p className="moon-inline-note">The test crop is {science.osdr.crop}, the lettuce used in NASA’s OSDR Veggie study. The alignment target is a training setting.</p>}
    {kind==='power'&&<p className="moon-inline-note">At the lunar south pole, a low Sun can disappear behind a ridge. The angle on this practice control is simulated.</p>}
    {radio&&<>
      <button className="moon-primary field-transmit" disabled={!settled||signal!==null} onClick={transmit}><Radio size={17}/>Send test signal</button>
      <div className="signal-timeline" aria-label="Signal travels between Moon and Earth">
        <div><span>MOON</span><span>EARTH</span></div>
        <div className="signal-track"><i style={{left:`${relayPosition(signal??0)*100}%`}}/></div>
        <p aria-live="polite">{signal===null?'Awaiting transmission':signal>=2*RADIO_LEG_MS?'Echo received on the Moon':signal>=RADIO_LEG_MS?'Earth received the test pulse · reply returning':'Test pulse traveling to Earth'}</p>
        <small aria-hidden="true">{((signal??0)/1000).toFixed(1)} / {2*science.radio.oneWay} seconds</small>
      </div>
    </>}
    <LinkOut url={drill.source} label="NASA science behind this drill"/>
    {settled&&!radio&&<p className="field-success" role="status"><Check size={17}/>Equipment check complete.</p>}
  </section>;
}
export function Fieldwork(props:Props) {
  useEffect(()=>()=>props.onPreview(null),[props.onPreview]);
  if(props.kind==='shelter')return <CrewShelter {...props}/>;
  if(props.kind==='survey')return <section className="fieldwork">
    <div className="moon-dialog-label">HANDS-ON TRAINING · SURFACE SCIENCE</div><h2 id="moon-dialog-title">Walk the survey course</h2>
    <p className="moon-dialog-copy">Find three numbered survey beacons in order. Use WASD, the arrow keys, or the direction pad to walk into each ring.</p>
    <p className="moon-inline-note">The beacons are on the modeled Shackleton terrain. Their placement is part of the training course.</p>
    <button className="moon-primary" onClick={props.onStartSurvey}>Walk out to the survey course</button>
  </section>;
  return <TuneEquipment {...props} kind={props.kind}/>;
}
