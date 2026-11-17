import {Check, CircleAlert, Flag, RotateCcw, ShieldCheck} from 'lucide-react';
import {motion, useReducedMotion} from 'framer-motion';
import {Link} from 'react-router-dom';
import {Eyebrow, timeLabel} from '../components/Primitives';
import {HistoryPanel, Objectives} from './MissionControl';
import {resources, Telemetry} from '../components/Telemetry';
import type {Mission} from '../types';

export default function Debrief({mission}:{mission:Mission}) {
  const reduced=useReducedMotion();
  const report=mission.report!;
  const safe=report.safety>0;
  return <main className="page-shell debrief">
    <motion.section className={'debrief-hero panel '+(safe?'':'interrupted')} initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}}>
      <div>{safe?<ShieldCheck size={34}/>:<CircleAlert size={34}/>}<Eyebrow>LUNA-01 / MISSION DEBRIEF</Eyebrow><h1>{mission.result}</h1><p>{report.lesson}</p>{mission.emergency.length>0&&<ul>{mission.emergency.map(reason=><li key={reason}>{reason}</li>)}</ul>}</div>
      <div className="score"><strong>{report.score}<small>/100</small></strong><span>MISSION SCORE</span><p>{report.safety}/50 safety · {report.exploration}/20 heritage · {report.science}/30 science</p></div>
    </motion.section>
    <div className="report-stats">
      <div className="panel"><strong>{timeLabel(report.elapsed)}</strong><span>Time used</span></div>
      <div className="panel"><strong>{mission.samples.length}/2</strong><span>Samples collected</span></div>
      <div className="panel"><strong>{mission.discoveries.length}</strong><span>Heritage observations</span></div>
      <div className="panel"><strong>{mission.alerts.length}</strong><span>Alerts recorded</span></div>
    </div>
    <div className="control-grid"><div className="control-main">
      <Telemetry mission={mission}/>
      <section className="panel pad"><h2>Collected and observed</h2>
        <ul className="checklist">{mission.samples.map(sample=><li key={sample}><Check size={16}/>{sample}</li>)}
          {mission.discoveries.includes('H01')&&<li><Flag size={16}/><Link className="text-link" to="/discovery/H01">Apollo 17 Lunar Roving Vehicle</Link></li>}</ul>
        {!mission.samples.length&&<p className="muted">No geological samples were collected.</p>}
      </section>
      <section className="panel pad"><h2>Alert history</h2>{mission.alerts.length?<ol className="logs">{mission.alerts.map((alert,index)=><li key={index}><time>{timeLabel(alert.minute)}</time><span><b>{alert.level}</b> · {alert.reasons.join(', ')}</span></li>)}</ol>:<p className="muted">No alerts recorded.</p>}</section>
    </div><aside className="control-side">
      <Objectives mission={mission}/>
      <section className="panel pad"><h2>Resources used</h2><dl className="report-resources">{resources.map(({key,label,Icon})=><div key={key}><dt><Icon size={16}/>{label}</dt><dd>{report.consumed[key]<0 ? '+'+(-report.consumed[key])+' pts condition' : report.consumed[key]+' pts used'} · {mission.values[key]}% left</dd></div>)}</dl></section>
      <HistoryPanel mission={mission}/>
    </aside></div>
    <Link className="button primary restart" to="/briefing"><RotateCcw size={17}/>Start another mission</Link>
  </main>;
}
