import {Activity, ArrowUpRight, Check, Circle, ClipboardList, History, Radio, ScanLine} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {Mission} from '../types';
import {Decisions} from '../components/Decisions';
import {Eyebrow, Notice, timeLabel} from '../components/Primitives';
import {Systems, Telemetry} from '../components/Telemetry';
import {Terrain} from '../components/Terrain';

const stages = [
  {events:['E00','E01'],label:'Preparation'},{events:['E02'],label:'Traverse'},{events:['E03'],label:'Discovery'},
  {events:['E05'],label:'Recovery'},{events:['E06'],label:'Science'},{events:['E07'],label:'Return'},
];

export function HistoryPanel({mission}:{mission:Mission}) {
  return <section className="panel"><div className="panel-bar"><div><History size={17}/><h2>Flight log</h2></div><span>{mission.history.length} ACTIONS</span></div><ol className="logs">
    {mission.history.map((entry,index)=><li key={index}><time>{timeLabel(entry.minute)}</time><span>{entry.choice}</span></li>)}
  </ol></section>;
}
export function Objectives({mission}:{mission:Mission}) {
  return <section className="panel"><div className="panel-bar"><div><ClipboardList size={17}/><h2>Objectives</h2></div><span>{mission.objectives.filter(item=>item.complete).length}/{mission.objectives.length}</span></div>
    <ul className="checklist objectives">{mission.objectives.map(({label,complete})=><li key={label} className={complete?'complete':''}>{complete?<Check size={16}/>:<Circle size={13}/>}<span>{label}</span></li>)}</ul>
  </section>;
}
export default function MissionControl({mission,busy,error,onChoose}:{mission:Mission;busy:boolean;error:string;onChoose:(choice:string)=>void}) {
  const current=stages.findIndex(stage=>stage.events.includes(mission.event));
  return <main className="page-shell">
    <div className="mission-title"><div className="page-heading"><Eyebrow>LUNA-01 / TAURUS–LITTROW VALLEY</Eyebrow><h1>Mission control</h1></div><span className="status normal"><Radio size={15}/>EVA SIMULATION</span></div>
    <ol className="stage-track">{stages.map(({label},index)=><li key={label} className={index===current?'active':index<current?'complete':''} aria-current={index===current?'step':undefined}><span>{index<current?<Check size={13}/>:index+1}</span>{label}</li>)}</ol>
    {error&&<Notice>{error}</Notice>}
    <div className="control-grid">
      <div className="control-main">
        <Terrain mission={mission}/>
        {(mission.event==='E03'||mission.discoveries.includes('H01'))&&<Link className="discovery-callout" to="/discovery/H01"><ScanLine size={20}/><span><strong>{mission.event==='E03'?'Artifact detected':'Discovery logged'}</strong><small>Apollo 17 · Lunar Roving Vehicle</small></span><ArrowUpRight size={18}/></Link>}
        <Decisions key={mission.event} mission={mission} busy={busy} onChoose={onChoose}/>
        <Telemetry mission={mission}/>
      </div>
      <aside className="control-side">
        <Systems mission={mission}/>
        <section className={'panel risk-card '+mission.health.level.toLowerCase()}>
          <div className="panel-bar"><div><Activity size={17}/><h2>Flight surgeon console</h2></div></div>
          <div><strong>{mission.health.level}</strong><p role="status">{mission.health.recommendation}</p><dl className="quick-vitals"><div><dt>Heart rate</dt><dd>{mission.values.hr} bpm</dd></div><div><dt>Blood SpO₂</dt><dd>{mission.values.spo2}%</dd></div><div><dt>Temperature</dt><dd>{mission.values.temperature} °C</dd></div><div><dt>Fatigue</dt><dd>{mission.values.fatigue}/100</dd></div></dl><a href="#telemetry" onClick={e=>{e.preventDefault();document.getElementById('telemetry')?.scrollIntoView();}}>View telemetry history <ArrowUpRight size={14}/></a></div>
        </section>
        <Objectives mission={mission}/>
        <HistoryPanel mission={mission}/>
      </aside>
    </div>
  </main>;
}
