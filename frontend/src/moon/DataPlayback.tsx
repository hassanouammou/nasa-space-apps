import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Pause,Play} from 'lucide-react';
import {science} from '../outpost/science';
import {RADIO_LEG_MS,relayPosition} from './fieldwork';

const clips={
  radiation:{title:'Radiation shielding',source:science.radlab.analysis,duration:3},
  radio:{title:'Signal to Earth',source:science.radio.url,duration:2*science.radio.oneWay},
  oxygen:{title:'Crew oxygen',source:science.crew.url,duration:4},
} as const;
type Clip=keyof typeof clips;

export function DataPlayback() {
  const [clip,setClip]=useState<Clip>('radiation');
  const [time,setTime]=useState(0);
  const [playing,setPlaying]=useState(false);
  const cursor=useRef(0);
  const config=clips[clip];
  useEffect(()=>{
    if(!playing)return;
    const start=performance.now()-cursor.current*1000;
    let frame=0;
    const tick=(now:number)=>{
      const value=Math.min(config.duration,(now-start)/1000);
      cursor.current=value;
      setTime(value);
      if(value>=config.duration)setPlaying(false);
      else frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[playing,config.duration,clip]);
  function seek(value:number) {cursor.current=value;setTime(value);}
  function choose(key:Clip) {setPlaying(false);setClip(key);seek(0);}
  function play(){if(playing){setPlaying(false);return;}if(cursor.current>=config.duration)seek(0);setPlaying(true);}
  const fraction=time/config.duration;
  const cabin=science.radlab.cabinRate,shelter=science.radlab.shelterRate;
  return <>
    <div className="moon-dialog-label">NASA DATA PLAYBACK</div><h2 id="moon-dialog-title">See the numbers in motion</h2>
    <div className="data-chips" aria-label="Data clips">{(Object.keys(clips) as Clip[]).map(key=><button key={key} aria-pressed={clip===key} onClick={()=>choose(key)}>{clips[key].title}</button>)}</div>
    {clip==='radiation'?<>
      <p className="moon-dialog-copy">Compare two peak readings inside Orion during Artemis I. The two bars animate toward the published measurements.</p>
      <div className="field-meter-pair data-bars">
        <div><span>Crew cabin</span><b>{cabin} μGy/min</b><i style={{width:`${fraction*100}%`}}/></div>
        <div className="meter-selected"><span>Storm shelter</span><b>{shelter} μGy/min</b><i style={{width:`${fraction*100*shelter/cabin}%`}}/></div>
      </div>
      <p className="moon-inline-note">{Math.round(100*(1-shelter/cabin))}% lower at the measured shelter location. This comparison shows two peaks from the same pass through Earth’s inner radiation belt.</p>
    </>:clip==='radio'?<>
      <p className="moon-dialog-copy">NASA estimated {science.radio.oneWay} seconds each way for a nominal Artemis command link. Follow the test signal along an illustrative path.</p>
      <div className="signal-timeline">
        <div><span>MOON</span><span>EARTH</span></div><div className="signal-track"><i style={{left:`${relayPosition(time*1000)*100}%`}}/></div>
        <p>{time===0?'Ready to transmit':time<science.radio.oneWay?'Heading to Earth':time<2*science.radio.oneWay?'Echo returning to the Moon':'Echo received at the outpost'}</p>
      </div>
    </>:<>
      <p className="moon-dialog-copy">NASA’s reference astronaut consumes {science.crew.oxygen} kg of oxygen per day. The animation adds both crew members’ daily needs together.</p>
      <div className="data-oxygen">
        {[0,1].map(id=><div key={id}><span>Astronaut {id+1}</span><div className="data-tank"><i style={{height:`${Math.max(0,Math.min(1,fraction*2-id))*100}%`}}/></div><b>{science.crew.oxygen} kg</b></div>)}
      </div>
      <p className="moon-inline-note">Two-person daily budget · {2*science.crew.oxygen} kg oxygen.</p>
    </>}
    <div className="data-transport">
      <button className="moon-primary" onClick={play}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'Pause':time>=config.duration?'Replay':'Play'}</button>
      <input type="range" min={0} max={config.duration} step={.01} value={time} aria-label="Playback position" onChange={event=>{setPlaying(false);seek(Number(event.currentTarget.value));}}/>
      <span aria-hidden="true">{time.toFixed(1)} s</span>
    </div>
    <a className="moon-source-link" href={config.source} target="_blank" rel="noreferrer">NASA source <ArrowUpRight size={13}/></a>
  </>;
}
