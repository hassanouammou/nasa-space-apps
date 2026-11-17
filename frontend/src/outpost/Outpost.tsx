import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowRight,ArrowUpRight,BatteryCharging,BookOpen,Check,ChevronDown,CloudSun,Droplets,Flag,FlaskConical,Leaf,Minus,Moon,Plus,Radio,RotateCcw,Shield,Sun,TriangleAlert,Users,Wind,Zap} from 'lucide-react';
import {assignments,CAPACITY,CREW,DAYS,GOALS} from './model.ts';
import type {Assignment} from './model.ts';
import {useTrainingRun} from './useTrainingRun';
import {getSurveyRoute} from './surveyRoutes';
import {science,solarEvents} from './science.ts';
import './outpost.css';

const systems=[
  {key:'air',name:'Oxygen maker',help:'Turns water into breathable oxygen.',Icon:Wind},
  {key:'recycler',name:'Water recycler',help:'Cleans used water so you can use it again.',Icon:Droplets},
  {key:'plants',name:'Greenhouse lights',help:'Give crops light. They need water too.',Icon:Leaf},
] as const;
const gauges=[
  {key:'battery',name:'Battery',unit:'units',Icon:Zap,color:'gold'},
  {key:'oxygen',name:'Oxygen',unit:'kg',Icon:Wind,color:'blue'},
  {key:'water',name:'Water',unit:'kg',Icon:Droplets,color:'blue'},
  {key:'food',name:'Food',unit:'kg',Icon:Leaf,color:'lime'},
  {key:'readiness',name:'Crew readiness',unit:'%',Icon:Activity,color:'lime'},
] as const;
const quantity=(value:number)=>Number(value.toFixed(2)).toString();
const endings = {
  complete:{title:'Mission complete',body:'Your crew stayed ready, brought back field reports and grew a harvest. Review your decisions and try another plan.'},
  partial:{title:'Crew safe. More to do.',body:'The crew finished the mission. Look at which objectives are still open and try a different plan on your next run.'},
  evacuated:{title:'Training rescue called',body:'The crew needed help. Read your last shift to see which supply or risk forced a rescue, then try a new plan.'},
};

export default function Outpost() {
  const run=useTrainingRun();
  const {mission,plan,day,frame,usedRadio,forecast,waiting,completed,last,notice,radioDay,replyAt,now,reply,update,assign,radio}=run;
  const [activePanel,setActivePanel]=useState<'mission'|'log'|'science'>('mission');
  const [showRestart,setShowRestart]=useState(false);
  const restartDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=restartDialog.current;
    if(showRestart&&!dialog?.open) dialog?.showModal();
    if(!showRestart&&dialog?.open) dialog.close();
  },[showRestart]);

  function nextShift() {
    if(run.nextShift())window.scrollTo({top:0,behavior:'instant'});
  }
  function restart() {
    run.restart();
    setShowRestart(false);
    choosePanel('mission');
  }
  function choosePanel(panel:typeof activePanel) {
    setActivePanel(panel);
    window.scrollTo({top:0,behavior:'instant'});
  }

  return <div className="outpost">
    <header className="op-header"><div className="op-head-inner">
      <button className="op-brand" onClick={()=>choosePanel('mission')}><span className="op-mark"><Moon size={20}/></span><span>JUNIOR ASTRONAUT<small>SPACEFORALL</small></span></button>
      <nav aria-label="Outpost navigation">
        <button aria-current={activePanel==='mission'?'page':undefined} onClick={()=>choosePanel('mission')}><Flag size={15}/>Mission</button>
        <button aria-current={activePanel==='log'?'page':undefined} onClick={()=>choosePanel('log')}><BookOpen size={15}/>Flight log</button>
        <button aria-current={activePanel==='science'?'page':undefined} onClick={()=>choosePanel('science')}><FlaskConical size={15}/>NASA data</button>
      </nav>
      <button className="op-reset" onClick={()=>setShowRestart(true)}><RotateCcw size={15}/><span>New mission</span></button>
    </div></header>
    <main className="op-shell">
      {activePanel==='mission'&&<>
        <div className="op-title"><div><div className="op-kicker"><span/>LUNAR SOUTH POLE · TRAINING MISSION</div><h1>Shackleton Outpost</h1><p>Keep two astronauts supplied for six days. Grow a harvest and bring back two field reports.</p></div><div className="op-day"><Users size={17}/><span>{CREW} crew</span><span>Day {Math.min(day,DAYS)} / {DAYS}</span></div></div>
        {mission.outcome&&<section className={'op-panel op-ending '+mission.outcome}><div className="op-kicker"><span/>MISSION DEBRIEF</div><h2>{endings[mission.outcome].title}</h2><p>{endings[mission.outcome].body}</p><button className="op-primary" onClick={()=>choosePanel('log')}>Review flight log <ArrowRight size={17}/></button> <Link className="op-primary" to="/">Open the 3D mission recap <ArrowRight size={17}/></Link></section>}
        <div className="op-grid">
          <div className="op-main">
            <section className="op-panel op-scene">
              <img src="/images/shackleton-outpost.webp" alt="Illustrated Shackleton outpost with a crew habitat, solar arrays and a greenhouse"/>
              <div className="op-scene-copy"><span><Moon size={15}/> SHACKLETON SECTOR</span><p>Outpost concept illustration</p></div>
              {!completed&&<span className={'op-scene-tag '+(frame.storm?'alert':'')}><Sun size={15}/> +{frame.sun} solar power today</span>}
            </section>
            <section className="op-panel op-reserves" aria-label="Outpost supplies">
              {gauges.map(({key,name,unit,Icon,color})=><div key={key} className={'op-gauge '+color}>
                <span><Icon size={15}/>{name}</span><strong>{quantity(mission.stock[key])}<small>{unit}</small></strong><progress value={mission.stock[key]} max={CAPACITY[key]} aria-label={name}/>
              </div>)}
            </section>
            {!completed&&<section className={'op-panel op-event '+(frame.storm?'alert':'')}>
              <div className="op-event-icon">{frame.storm?<TriangleAlert size={22}/>:<CloudSun size={22}/>}</div>
              <div><h2>{frame.title}</h2><p>{frame.detail}</p>
              {frame.storm&&<a href={frame.storm.url} target="_blank" rel="noreferrer">NASA DONKI archive · {frame.storm.date} <ArrowUpRight size={14}/></a>}</div>
            </section>}
            <section className="op-panel op-goals">
              <div><Flag size={16}/><h2>Mission goals</h2></div>
              <ul>
                <li>{mission.stock.science>=GOALS.science?<Check size={15}/>:<FlaskConical size={15}/>}Field reports <strong>{mission.stock.science} / {GOALS.science}</strong></li>
                <li>{mission.stock.harvests>=GOALS.harvests?<Check size={15}/>:<Leaf size={15}/>}Harvests <strong>{mission.stock.harvests} / {GOALS.harvests}</strong></li>
                <li><Shield size={15}/>Finish with crew readiness <strong>≥ {GOALS.readiness}%</strong></li>
              </ul>
            </section>
            {last&&<section className="op-panel op-last"><h2>Last shift · Day {last.day}</h2><p>{last.notes.join(' ')}</p></section>}
          </div>
          {!completed&&<div className="op-side">
            <section className="op-panel op-plan">
              <div className="op-panel-title"><div><Zap size={19}/><h2>Allocate power</h2></div><span className={forecast.canRun?'':'over'}>{forecast.used} / {forecast.available} used</span></div>
              <p className="op-help">Your habitat uses 2 units. Share the rest between systems, or save it in the battery.</p>
              {systems.map(({key,name,help,Icon})=><div key={key} className="op-control"><div className="op-control-icon"><Icon size={17}/></div><div><strong>{name}</strong><p>{help}</p></div>
                <div className="op-stepper" id={'allocation-'+key} role="group" aria-label={name+' power'}>
                  <button aria-label={'Decrease '+name} onClick={()=>update(key,plan[key]-1)} disabled={plan[key]===0}><Minus size={15}/></button>
                  <output aria-live="polite">{plan[key]}</output>
                  <button aria-label={'Increase '+name} onClick={()=>update(key,plan[key]+1)} disabled={plan[key]===4}><Plus size={15}/></button>
                </div>
              </div>)}
            </section>
            <section className="op-panel op-crew">
              <div className="op-panel-title"><div><Users size={18}/><h2>Assign the crew</h2></div></div>
              <div className="op-options" role="group" aria-label="Crew assignment">
                {(Object.keys(assignments) as Assignment[]).map(key=>{
                  const route=key==='survey'?getSurveyRoute(plan.surveyRoute):undefined;
                  return <button className={plan.assignment===key?'chosen':''} aria-pressed={plan.assignment===key} key={key} onClick={()=>assign(key)}>
                    <span className="op-radio-dot"/><span><b>{route?`Survey ${route.title}`:assignments[key].title}</b><small>{route?`Uses ${route.oxygen.toFixed(1)} kg extra oxygen.`:assignments[key].detail}</small></span><span className="op-cost">{route?.power??assignments[key].power} <Zap size={12}/></span>
                  </button>;
                })}
              </div>
              <div className="op-radio">
                <button onClick={radio} disabled={waiting||usedRadio||forecast.available<forecast.used+1}><Radio size={16}/>{waiting?'Waiting for Earth…':usedRadio?'Radio sent':'Ask Mission Control'}<small>+1 power</small></button>
                {replyAt>0&&<p aria-live="polite">{waiting?`Signal round trip · ${((replyAt-now)/1000).toFixed(1)} s`:`Earth reply for Day ${radioDay}. ${reply}`}</p>}
              </div>
            </section>
            <section className="op-panel op-forecast">
              <div className="op-panel-title"><div><Activity size={18}/><h2>End-of-day forecast</h2></div></div>
              {forecast.canRun?<><div className="op-predictions">
                <span>Battery <b>{quantity(forecast.next.battery)}</b></span>
                <span>O₂ <b>{quantity(forecast.next.oxygen)} kg</b></span>
                <span>Water <b>{quantity(forecast.next.water)} kg</b></span>
                <span>Food <b>{quantity(forecast.next.food)} kg</b></span>
              </div><p className="op-reading">Make {quantity(forecast.effects.air)} kg O₂ · Recycle {quantity(forecast.effects.recovery)} kg water · Water crops with {quantity(forecast.effects.cropWater)} kg</p><p className="op-reading">Crop growth {quantity(forecast.next.growth)}% · Exposure +{forecast.effects.radiation} training pts · Crew {quantity(forecast.next.readiness)}%</p>{forecast.outcome==='evacuated'&&<p className="op-warning" role="status">This plan would trigger a rescue. Check supplies and shielding.</p>}</>:<p className="op-warning" role="status">Over budget by {forecast.used-forecast.available} power units. Reduce a setting to continue.</p>}
              <button className="op-primary op-advance" onClick={nextShift} disabled={!forecast.canRun}>Run Day {day} <ArrowRight size={19}/></button>
            </section>
          </div>}
        </div>
      </>}
      {activePanel==='log'&&<>
        <div className="op-title"><div><div className="op-kicker"><span/>SHACKLETON OUTPOST</div><h1>Flight log</h1><p>See how your choices changed the base over time.</p></div><button className="op-primary" onClick={()=>choosePanel('mission')}>Back to mission <ArrowRight size={17}/></button></div>
        <div className="op-log">
          {mission.history.length===0&&<section className="op-panel op-last"><h2>Your log is empty</h2><p>Run the first day to record your plan and see its results.</p></section>}
          {[...mission.history].reverse().map(entry=><details className="op-panel" key={entry.day} open={entry.day===mission.history.length}>
            <summary><span>DAY {entry.day}</span><strong>{entry.event}</strong><ChevronDown size={17}/></summary>
            <div><p>{assignments[entry.plan.assignment].title} · Oxygen maker {entry.plan.air} · Recycler {entry.plan.recycler} · Greenhouse {entry.plan.plants}</p>
              <ul>{entry.notes.map(note=><li key={note}>{note}</li>)}</ul>
              <p className="op-reading">Battery {entry.snapshot.battery} · O₂ {quantity(entry.snapshot.oxygen)} kg · Water {quantity(entry.snapshot.water)} kg · Food {quantity(entry.snapshot.food)} kg · Crew {quantity(entry.snapshot.readiness)}%</p>
            </div>
          </details>)}
        </div>
      </>}
      {activePanel==='science'&&<>
        <div className="op-title"><div><div className="op-kicker"><span/>MISSION SCIENCE</div><h1>NASA data</h1><p>Look up the science and measurements behind your choices.</p></div><button className="op-primary" onClick={()=>choosePanel('mission')}>Back to mission <ArrowRight size={17}/></button></div>
        <div className="op-source-grid">
          <section className="op-panel"><h2>NASA DONKI · Archived solar events</h2><p>Both May 2024 records were detected by STEREO-A. Each mission uses one record to trigger its training alert. The alert date in the simulation and its risk points are game settings.</p>
          {solarEvents.map(event=><a key={event.id} href={event.url} target="_blank" rel="noreferrer">{event.id}<ArrowUpRight size={14}/></a>)}</section>
          {Object.values(science).map(source=><section className="op-panel" key={source.url}><h2>{source.name}</h2><p>{source.purpose}</p><a href={source.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={14}/></a>{'analysis' in source&&<a href={source.analysis} target="_blank" rel="noreferrer">Open published rate comparison <ArrowUpRight size={14}/></a>}</section>)}
        </div>
      </>}
      <p className="op-footnote">Educational training simulation · Archived NASA data · Game power, exposure, and readiness use simplified training values.</p>
      <div className="sr-only" role="status" aria-live="polite">{notice}</div>
    </main>
    <dialog className="op-dialog" ref={restartDialog} onCancel={()=>setShowRestart(false)}><h2>Start a new mission?</h2><p>This replaces the current training run and changes the order of the sunlight conditions.</p><div><button className="op-reset" onClick={()=>setShowRestart(false)}>Keep playing</button><button className="op-primary" onClick={restart}>Start new mission</button></div></dialog>
  </div>;
}
