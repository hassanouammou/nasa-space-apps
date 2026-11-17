import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
import {Crosshair,Radio,Send,Sparkles,X} from 'lucide-react';
import {roverAnswer,roverBrief,terrainSource} from './roverTelemetry';
import type {RoverPhase,RoverReading} from './roverTelemetry';

type Exchange={question:string;answer:string;packet:number|null};
const prompts=['What changed?', 'Which site is gentler?', 'Where is the NASA data?'];

export function RoverConsole({phase,readings,tracking,onTrack,onClose}:{phase:RoverPhase;readings:RoverReading[];tracking:boolean;onTrack:()=>void;onClose:()=>void}) {
  const [question,setQuestion]=useState('');
  const [exchanges,setExchanges]=useState<Exchange[]>([]);
  const thread=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const log=thread.current;
    if(log)log.scrollTop=log.scrollHeight;
  },[exchanges]);
  const latest=readings.at(-1);
  const strip=readings.slice(-5);
  const max=Math.max(1,...strip.map(r=>r.slope));
  function ask(value:string){
    const cleaned=value.trim();
    if(!cleaned)return;
    const exchange={question:cleaned,answer:roverAnswer(cleaned,readings),packet:latest?.id??null};
    setExchanges(history=>[...history.slice(-2),exchange]);
    setQuestion('');
  }
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    ask(question);
  }
  return <aside className="rover-console" aria-label="Live rover console">
    <div className="rover-head"><div><span className="rover-label"><Radio size={13}/> HABITAT UPLINK</span><h2>Scout 01</h2></div>
      <button className="moon-alt" onClick={onTrack} aria-pressed={tracking}><Crosshair size={15}/>{tracking?'Astronaut view':'Follow rover'}</button>
      <button className="rover-close" onClick={onClose} aria-label="Close rover console"><X size={17}/></button>
    </div>
    <div className="rover-status"><span className={'rover-dot '+phase.toLowerCase()}/><strong>{phase==='Delivered'?'Packet delivered':phase}</strong><span>{latest?'Packet '+String(latest.id).padStart(2,'0'):'Acquiring first packet'}</span></div>
    <div className="rover-reading" key={latest?.id??0}>
      <div className="rover-site">{latest?.site??'Waiting for habitat receipt'}</div>
      <div className="rover-metrics">
        <div><small>Local elevation</small><strong>{latest?latest.elevation.toFixed(2):'—'} <span>m</span></strong></div>
        <div><small>Ground slope</small><strong>{latest?latest.slope.toFixed(1):'—'}<span>°</span></strong></div>
        <div className="rover-chart" aria-label={strip.map(r=>r.site+' '+r.slope.toFixed(1)+' degrees').join(', ')||'No slope samples yet'} role="img">
          {strip.map(r=><i key={r.id} style={{height:Math.max(6,r.slope/max*100)+'%'}} title={r.site+': '+r.slope.toFixed(1)+'°'}/>)}
        </div>
      </div>
    </div>
    <section className="rover-analysis" aria-label="Rover analyst">
      <div className="rover-label"><Sparkles size={13}/> SCOUT ANALYST · LIVE</div>
      <p>{roverBrief(readings)}</p>
      {exchanges.length>0&&<div className="rover-thread" ref={thread} role="log" aria-label="Scout chat history">
        {exchanges.map((exchange,index)=><div className="rover-exchange" key={index}><strong>{exchange.question}</strong><p>{exchange.answer}</p>{exchange.packet!==null&&<small>Answered through packet {exchange.packet}</small>}</div>)}
      </div>}
      <div className="rover-prompts">{prompts.map(prompt=><button key={prompt} onClick={()=>ask(prompt)}>{prompt}</button>)}</div>
      <form className="rover-form" onSubmit={submit}>
        <input aria-label="Ask Scout about the rover data" placeholder="Ask about the readings…" value={question} onChange={event=>setQuestion(event.target.value)} maxLength={160}/>
        <button aria-label="Send rover question" disabled={!question.trim()}><Send size={16}/></button>
      </form>
    </section>
    <div className="rover-source">{latest?.source?<a href={terrainSource} target="_blank" rel="noreferrer">NASA LRO · Shackleton terrain archive ↗</a>:latest?'Simulated terrain readings':'LROC terrain grid when available'}<span>Training rover</span></div>
  </aside>;
}
