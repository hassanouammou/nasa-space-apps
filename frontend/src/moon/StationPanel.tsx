import {ArrowRight,ArrowUpRight,BatteryCharging,Droplets,FlaskConical,Leaf,Minus,Plus,Radio,Shield,Wind,Zap} from 'lucide-react';
import {assignments,CAPACITY,DAYS,GOALS} from '../outpost/model';
import type {Allocation,Assignment} from '../outpost/model';
import type {TrainingRun} from '../outpost/useTrainingRun';
import {getSurveyRoute} from '../outpost/surveyRoutes';
import {science,solarEvents} from '../outpost/science';
import {terrainSource} from './terrain';
import {stationStory,stations} from './story';
import type {BaseStation} from './story';
import type {ReactNode} from 'react';

export const apolloSource='https://science.nasa.gov/3d-resources/apollo-lunar-module/';
export const astronautSource='https://science.nasa.gov/3d-resources/astronaut/';
export const apolloReport='https://www.nasa.gov/history/apollo-11-mission-overview/';
export const quantity=(value:number)=>Number(value.toFixed(2)).toString();
export const resources=[
  {key:'battery',name:'Power',unit:'',Icon:Zap,color:'gold'},
  {key:'oxygen',name:'Oxygen',unit:' kg',Icon:Wind,color:'blue'},
  {key:'water',name:'Water',unit:' kg',Icon:Droplets,color:'blue'},
  {key:'food',name:'Food',unit:' kg',Icon:Leaf,color:'lime'},
  {key:'readiness',name:'Crew',unit:'%',Icon:Shield,color:'lime'},
] as const;

function SourceLink({url,children}:{url:string;children:ReactNode}) {
  return <a className="moon-source-link" href={url} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={13}/></a>;
}
function Tuning({run,id,label,children}:{run:TrainingRun;id:Allocation;label:string;children:ReactNode}) {
  return <div className="moon-tune">
    <div><b>{label}</b><small>{children}</small></div><div className="moon-stepper" role="group" aria-label={label}>
      <button aria-label={'Decrease '+label} disabled={run.plan[id]===0} onClick={()=>run.update(id,run.plan[id]-1)}><Minus size={17}/></button>
      <output aria-live="polite">{run.plan[id]}</output>
      <button aria-label={'Increase '+label} disabled={run.plan[id]===4} onClick={()=>run.update(id,run.plan[id]+1)}><Plus size={17}/></button>
    </div>
  </div>;
}
function PowerForecast({run}:{run:TrainingRun}) {
  const {forecast}=run;
  return <div className="moon-forecast">
    <div><span><BatteryCharging size={15}/> Power committed</span><b className={forecast.canRun?'':'warning'}>{forecast.used} / {forecast.available}</b></div>
    {!forecast.canRun?<p className="warning">Reduce spending by {forecast.used-forecast.available} power units.</p>:
      <div className="moon-forecast-grid">{resources.map(({key,name,unit,Icon})=><span key={key}><Icon size={13}/>{name}<b>{quantity(forecast.next[key])}{unit}</b></span>)}</div>}
    {forecast.outcome==='evacuated'&&<p className="warning">This plan would require rescue.</p>}
  </div>;
}
function Assign({run,choices}:{run:TrainingRun;choices:Assignment[]}) {
  return <div className="moon-assign" aria-label="Crew assignment">
    {choices.map(id=>{
      const route=id==='survey'?getSurveyRoute(run.plan.surveyRoute):undefined;
      return <button key={id} aria-pressed={run.plan.assignment===id} onClick={()=>run.assign(id)}>
        <span><b>{route?`Survey ${route.title}`:assignments[id].title}</b><small>{route?`Uses ${route.oxygen.toFixed(1)} kg extra oxygen.`:assignments[id].detail}</small></span><span><Zap size={13}/>{route?.power??assignments[id].power}</span>
      </button>;
    })}
  </div>;
}
export function StationPanel({id,run,onClose,onCommit,onLanding,canCommit,labModel}:{id:BaseStation;run:TrainingRun;onClose:()=>void;onCommit:()=>void;onLanding:()=>void;canCommit:boolean;labModel:boolean|null}) {
  const {frame,forecast,mission}=run;
  return <>
    <div className="moon-dialog-label">{stations[id].name} · DAY {Math.min(run.day,DAYS)}</div>
    <h2 id="moon-dialog-title">{stationStory[id].title}</h2>
    <p className="moon-dialog-copy">{stationStory[id].lesson}</p>
    {!run.completed&&<>
      {id==='air'&&<>
        <Tuning run={run} id="air" label="Oxygen maker">Makes {quantity(forecast.effects.air)} kg of oxygen this day.</Tuning>
        <Tuning run={run} id="recycler" label="Water recycler">Returns {quantity(forecast.effects.recovery)} kg of clean water.</Tuning>
        <SourceLink url={science.crew.url}>NASA life-support baseline</SourceLink>
        <SourceLink url={science.water.url}>ISS water recovery</SourceLink>
      </>}
      {id==='plants'&&<>
        <Tuning run={run} id="plants" label="Greenhouse lights">Crops use {quantity(forecast.effects.cropWater)} kg of water.</Tuning>
        <div className="moon-demo-meter"><Leaf size={17}/><div><b>{science.osdr.crop}</b><progress max={100} value={mission.stock.growth} aria-label="Current crop growth"/></div><b>{quantity(mission.stock.growth)}%</b></div>
        <p className="moon-inline-note">Next shift {forecast.effects.harvest>0?'can bring a harvest.':`could bring growth to ${quantity(forecast.next.growth)}%.`}</p>
        <SourceLink url={science.osdr.url}>NASA OSDR crop experiment</SourceLink>
      </>}
      {id==='power'&&<>
        <div className="moon-demo-number"><Zap size={23}/><b>+{frame.sun}</b><span>solar power this shift</span></div>
        <Tuning run={run} id="air" label="Oxygen maker">Air for the crew uses water and power.</Tuning>
        <Tuning run={run} id="recycler" label="Water recycler">Recover more water when the battery allows.</Tuning>
        <Tuning run={run} id="plants" label="Greenhouse lights">Lower the lights to return power to the battery.</Tuning>
        <SourceLink url={science.pole.url}>NASA lunar south pole lighting</SourceLink>
      </>}
      {id==='shelter'&&<>
        {frame.storm&&<SourceLink url={frame.storm.url}>NASA DONKI archive · {frame.storm.date}</SourceLink>}
        <div className="moon-dose" aria-label="Artemis I measurements">
          <div><span>Crew cabin</span><b>{science.radlab.cabinRate} <small>μGy/min</small></b><progress max={science.radlab.cabinRate} value={science.radlab.cabinRate} aria-label="Measured Artemis I crew cabin rate"/></div>
          <div><span>Shielded shelter</span><b>{science.radlab.shelterRate} <small>μGy/min</small></b><progress max={science.radlab.cabinRate} value={science.radlab.shelterRate} aria-label="Measured Artemis I shelter rate"/></div>
        </div>
        <p className="moon-inline-note">Artemis I measurements in Orion. Your projected exposure is {forecast.effects.radiation} training points.</p>
        <Assign run={run} choices={['inside','shelter','survey']}/>
        <SourceLink url={science.radlab.analysis}>Artemis I shielding study</SourceLink>
      </>}
      {id==='lab'&&<Assign run={run} choices={['inside','survey']}/>}
      {id==='habitat'&&<>
        <p className="moon-inline-note"><b>Plan the day.</b> Pick one job for the crew. If the plan uses too much power, lower a machine setting at Life Support, the Greenhouse, or the Solar Array.</p>
        <Assign run={run} choices={['inside','survey','shelter']}/>
        <button className="moon-alt moon-wide" onClick={run.radio} disabled={run.waiting||run.usedRadio||forecast.available<forecast.used+1}><Radio size={16}/>{run.waiting?'Waiting for Earth…':run.usedRadio?'Radio sent':'Ask Earth · 1 power'}</button>
        {run.replyAt>0&&<p className="moon-inline-note" aria-live={run.waiting?'off':'polite'}>{run.waiting?`Round trip · ${((run.replyAt-run.now)/1000).toFixed(1)} s`:`Earth reply for Day ${run.radioDay}. ${run.reply}`}</p>}
      </>}
    </>}
    {id==='lab'&&<>
      <button className="moon-alt moon-wide" type="button" onClick={onLanding} disabled={labModel!==true}><FlaskConical size={16}/>{labModel===null?'Loading the Lunar Module…':labModel?'Replay the 3D landing':'Lunar Module unavailable'}</button>
      <SourceLink url={apolloSource}>NASA 3D Lunar Module model</SourceLink>
      <SourceLink url={apolloReport}>Apollo 11 mission overview</SourceLink>
    </>}
    {!run.completed&&<PowerForecast run={run}/>}
    {!run.completed&&id==='habitat'&&!canCommit&&<p className="moon-inline-note">Complete your chapter’s fieldwork to unlock the next day.</p>}
    <div className="moon-dialog-actions">
      <button className="moon-alt" onClick={onClose}>Back to surface</button>
      {!run.completed&&id==='habitat'&&<button className="moon-primary" disabled={!forecast.canRun||!canCommit} onClick={onCommit}>Run Day {run.day}<ArrowRight size={17}/></button>}
    </div>
  </>;
}

export function MissionJournal({run}:{run:TrainingRun}) {
  const stock=run.mission.stock;
  return <>
    <div className="moon-dialog-label">SHACKLETON OUTPOST</div><h2 id="moon-dialog-title">Mission journal</h2>
    <div className="moon-goals"><span>Field reports <b>{stock.science} / {GOALS.science}</b></span><span>Harvests <b>{stock.harvests} / {GOALS.harvests}</b></span><span>Crew readiness <b>{quantity(stock.readiness)}%</b></span></div>
    {run.mission.history.length===0&&<p className="moon-dialog-copy">Finish your first shift at the habitat to start the log.</p>}
    {[...run.mission.history].reverse().map(entry=><details className="moon-log-entry" key={entry.day}><summary>Day {entry.day} · {entry.event}</summary><p>{assignments[entry.plan.assignment].title} · Power {entry.snapshot.battery} · Water {quantity(entry.snapshot.water)} kg</p><ul>{entry.notes.map(note=><li key={note}>{note}</li>)}</ul></details>)}
  </>;
}
export function NasaPanel() {
  return <>
    <div className="moon-dialog-label">REAL DATA IN THE SIMULATION</div><h2 id="moon-dialog-title">NASA data</h2>
    <details className="moon-log-entry" open><summary>Shackleton’s real terrain</summary><p>A 97 × 97 pixel crop of the Lunar Reconnaissance Orbiter Camera elevation model, with two metres per sample. The elevation datum is shifted to the playable area's centre. The outpost is fictional.</p><SourceLink url={terrainSource}>LROC · NAC_DTM_ESALL_SR12</SourceLink></details>
    <details className="moon-log-entry"><summary>Apollo and spacesuit models</summary><p>The science platform shows a NASA Lunar Module model. The suit reference at the habitat is from DigitalSpace Corporation via NASA.</p><SourceLink url={apolloSource}>NASA · Apollo Lunar Module</SourceLink><SourceLink url={astronautSource}>NASA · Astronaut model</SourceLink></details>
    <details className="moon-log-entry"><summary>Solar alerts from DONKI</summary><p>Two archived STEREO-A events give the training alerts their recorded time and instrument. The game uses fictional exposure points.</p>{solarEvents.map(event=><SourceLink key={event.id} url={event.url}>{event.id}</SourceLink>)}</details>
    {Object.values(science).map(source=><details className="moon-log-entry" key={source.url}><summary>{source.name}</summary><p>{source.purpose}</p><SourceLink url={source.url}>Open source</SourceLink>{'analysis' in source&&<SourceLink url={source.analysis}>Published Artemis I comparison</SourceLink>}</details>)}
  </>;
}
export function Reserves({run}:{run:TrainingRun}) {
  return <div className="moon-reserves" aria-label="Outpost reserves">
    {resources.map(({key,name,unit,Icon,color})=><div className={color} key={key}>
      <span><Icon size={13}/>{name}</span><strong>{quantity(run.mission.stock[key])}{unit}</strong><progress value={run.mission.stock[key]} max={CAPACITY[key]} aria-label={name}/>
    </div>)}
  </div>;
}
