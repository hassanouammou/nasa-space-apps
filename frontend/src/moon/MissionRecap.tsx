import {ArrowRight,BookOpen,CheckCircle2,ClipboardList,Radio} from 'lucide-react';
import {assignments,DAYS,getFrame} from '../outpost/model';
import type {Mission} from '../outpost/model';
import type {MissionActivity} from '../outpost/useTrainingRun';
import {artifactIds,artifactStations} from './artifacts';
import {drillFor} from './fieldwork';
import {cadetQuiz} from './juniorGuide';
import {chapter} from './story';
import {quantity,resources} from './StationPanel';
import './recap.css';

const finishedTasks={
  air:'Sealed the oxygen line.',
  plants:'Aimed the greenhouse lights.',
  power:'Tilted the solar panels toward the Sun.',
  shelter:'Moved both astronauts into the shelter.',
  survey:'Walked through all three survey beacons.',
  radio:'Tuned the antenna and sent a test signal.',
};

export function MissionRecap({mission,activity,title,onQuiz,onJournal}:{mission:Mission;activity:MissionActivity;title:string;onQuiz:()=>void;onJournal:()=>void}) {
  const found=artifactIds.filter(id=>activity.artifacts.includes(id));
  const shifts=mission.history.length;
  return <section className="mission-recap">
    <div className="moon-dialog-label">MISSION RECAP</div>
    <h2 id="moon-dialog-title">Your Moon story</h2>
    <p className="moon-dialog-copy"><strong>{title}</strong><br/>You ran {shifts} of {DAYS} mission days.</p>
    <div className="recap-totals">
      <span><strong>{activity.fieldwork.length}</strong>Station tasks</span>
      <span><strong>{mission.stock.science}</strong>Field reports</span>
      <span><strong>{mission.stock.harvests}</strong>Harvests</span>
    </div>
    <h3>What you did each day</h3>
    <ol className="recap-days">{mission.history.map(entry=>{
      const finished=activity.fieldwork.includes(entry.day);
      const task=drillFor(chapter(entry.day,getFrame(entry.day,mission.seed)).target);
      return <li key={entry.day}><span>{entry.day}</span><div>
        <strong>{assignments[entry.plan.assignment].title}</strong>
        {finished&&<p><CheckCircle2 size={13}/>{finishedTasks[task]}</p>}
        <p>Machine settings · Air {entry.plan.air}, water recycling {entry.plan.recycler}, grow lights {entry.plan.plants}.</p>
        {entry.notes.map(note=><p key={note}>{note}</p>)}
      </div></li>;
    })}</ol>
    {(found.length>0||activity.rover||activity.landing)&&<>
      <h3>What you explored</h3>
      <ul className="recap-exploration">
        {found.map(id=><li key={id}><CheckCircle2 size={14}/>Discovered {artifactStations[id].name}.</li>)}
        {activity.rover&&<li><Radio size={14}/>Opened Scout’s live rover readings.</li>}
        {activity.landing&&<li><CheckCircle2 size={14}/>Started the 3D Apollo landing demo.</li>}
      </ul>
    </>}
    <h3>What you had left</h3>
    <dl className="recap-supplies">{resources.map(({key,name,unit,Icon})=><div key={key}>
      <dt><Icon size={13}/>{key==='readiness'?'Crew readiness':name}</dt><dd>{quantity(mission.stock[key])}{unit}</dd>
    </div>)}</dl>
    {activity.quizScore!==null&&<p className="moon-inline-note">Your quiz score was {activity.quizScore} out of {cadetQuiz.length}.</p>}
    <div className="moon-dialog-actions">
      <button className="moon-alt" onClick={onJournal}><BookOpen size={15}/>Mission journal</button>
      <button className="moon-primary" onClick={onQuiz}><ClipboardList size={16}/>{activity.quizScore===null?'Take the quiz':'Try the quiz again'} <ArrowRight size={15}/></button>
    </div>
  </section>;
}
