import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,BookOpen,ChevronRight,Compass,FlaskConical,Footprints,MapPin,Menu,Moon,Radio,RotateCcw,ScanLine,Sun,Trophy,TriangleAlert,Volume2,VolumeX,X,Zap} from 'lucide-react';
import {Link} from 'react-router-dom';
import {DAYS,getFrame} from '../outpost/model';
import {useTrainingRun} from '../outpost/useTrainingRun';
import {chapter,stationIds,stations,stationStory} from './story';
import type {Station} from './story';
import {MissionJournal,NasaPanel,Reserves,StationPanel} from './StationPanel';
import type {WorldEvent,WorldSettings,MoonWorld} from './world';
import {ArtifactPanel,HeritageLog} from './ArtifactPanel';
import {artifactIds,artifacts,isArtifact} from './artifacts';
import type {ArtifactId} from './artifacts';
import {Fieldwork} from './Fieldwork';
import type {EquipmentPreview} from './Fieldwork';
import {DataPlayback} from './DataPlayback';
import {RoverConsole} from './RoverConsole';
import type {RoverPhase,RoverReading} from './roverTelemetry';
import './rover.css';
import './junior.css';
import {MissionRecap} from './MissionRecap';
import {MissionComic} from './MissionComic';
import {SurveyDecision} from './SurveyDecision';
import {EndQuiz,JuniorGuide} from './JuniorGuide';
import {cadetQuiz,cadetTasks} from './juniorGuide';
import {drillFor,surveyCourse} from './fieldwork';
import './moon.css';
import './fieldwork.css';
import './moon-mobile.css';

const directions=[
  {key:'w',Icon:ArrowUp,label:'Move forward',placement:'up'},
  {key:'a',Icon:ArrowLeft,label:'Move left',placement:'left'},
  {key:'s',Icon:ArrowDown,label:'Move back',placement:'down'},
  {key:'d',Icon:ArrowRight,label:'Move right',placement:'right'},
] as const;
const endingCopy={
  complete:{title:'Mission complete',line:'The crew is safe, the plants grew, and we learned more about the Moon. Your choices kept this outpost going.'},
  partial:{title:'Crew safe. More to do.',line:'The crew made it through six shifts. Open the mission journal to see which science or harvest goals need another try.'},
  evacuated:{title:'Training rescue called',line:'The crew needed help. Open the mission journal to see which resource or risk changed the outcome.'},
};
type Panel=Station|'nasa'|'journal'|'restart'|'heritage'|'fieldwork'|'playback'|'guide'|'quiz'|'recap'|'comic';

function savedArtifacts():ArtifactId[] {
  try {
    const data:unknown=JSON.parse(localStorage.getItem('shackleton-heritage-v1')??'[]');
    return Array.isArray(data)?artifactIds.filter(id=>data.includes(id)):[];
  } catch {return [];}
}

function say(line:string) {
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(line);
  utterance.lang='en-US';
  utterance.rate=.94;
  window.speechSynthesis.speak(utterance);
}

export default function MoonGame() {
  const run=useTrainingRun();
  const current=chapter(run.day,run.frame);
  const drill=drillFor(current.target);
  const task=cadetTasks[drill];
  const course=surveyCourse(run.plan.surveyRoute);
  const [active,setActive]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [stationsOpen,setStationsOpen]=useState(false);
  const [roverOpen,setRoverOpen]=useState(false);
  const [trackingRover,setTrackingRover]=useState(false);
  const [roverPhase,setRoverPhase]=useState<RoverPhase>('Driving');
  const [roverReadings,setRoverReadings]=useState<RoverReading[]>([]);
  const [voice,setVoice]=useState(false);
  const quizScore=run.activity.quizScore;
  const [panel,setPanel]=useState<Panel|null>(null);
  const [discoveries,setDiscoveries]=useState(savedArtifacts);
  const [equipment,setEquipment]=useState<EquipmentPreview|null>(null);
  const [surveyIndex,setSurveyIndex]=useState<number|null>(null);
  const [dayCard,setDayCard]=useState<number|null>(null);
  const [worldState,setWorldState]=useState<WorldEvent>({moving:false,nearest:null});
  const [worldReady,setWorldReady]=useState(false);
  const [worldError,setWorldError]=useState(false);
  const [terrainId,setTerrainId]=useState<string|null>(null);
  const [landing,setLanding]=useState(false);
  const [labModel,setLabModel]=useState<boolean|null>(null);
  const approach=useRef<Station|null>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const world=useRef<MoonWorld|null>(null);
  const labels=useRef(new Map<Station,HTMLButtonElement>());
  useEffect(()=>{
    if(active&&roverOpen&&roverReadings.length>0&&!run.activity.rover&&!run.completed)run.recordMilestone('rover');
  },[active,roverOpen,roverReadings,run.activity.rover,run.completed,run.recordMilestone]);
  const alreadyVisited=run.activity.fieldwork.includes(run.day);
  const objective=alreadyVisited?'habitat':current.target;
  const config=useRef<WorldSettings>({active:false,paused:false,storm:false,shadow:false,grow:0,lights:0,shield:false,focus:objective,day:run.day,preview:null,surveyIndex:null,trackingRover:false});
  config.current={active,paused:Boolean(panel),storm:Boolean(run.frame.storm&&!run.completed),shadow:run.frame.sun===2,
    grow:run.mission.stock.growth,lights:run.plan.plants,shield:run.plan.assignment==='shelter',focus:objective,day:run.day,preview:equipment,surveyIndex,trackingRover,surveyRoute:run.plan.surveyRoute};

  const onArrival=useRef((id:Station)=>{void id;});
  onArrival.current=(id)=>{
    approach.current=null;
    setPanel(id);
    if(isArtifact(id)){
      run.recordArtifact(id);
      setDiscoveries(previous=>previous.includes(id)?previous:[...previous,id]);
      world.current?.demonstrateArtifact(id);
      if(voice)say(artifacts[id].description);
      return;
    }
    if(id===current.target&&!alreadyVisited&&!run.completed&&(drill!=='survey'||surveyIndex===null))setPanel('fieldwork');
    if(voice)say(stationStory[id].lesson);
  };
  const onSurveyPoint=useRef((index:number)=>{void index;});
  onSurveyPoint.current=(index)=>{
    if(index+1===course.length){
      setSurveyIndex(null);
      run.recordFieldwork();
      if(run.plan.surveyRoute)run.assign('survey');
      if(voice)say('Survey complete. Return to the habitat to plan the final outdoor assignment.');
    } else setSurveyIndex(index+1);
  };
  useEffect(()=>{
    const surface=canvas.current;
    if(!surface)return;
    let disposed=false;
    void import('./world').then(({createMoonWorld})=>createMoonWorld({
      canvas:surface,labels:labels.current,settings:()=>config.current,
      onArrive:id=>{if(!disposed)onArrival.current(id);},
      onLabModel:loaded=>{if(!disposed)setLabModel(loaded);},
      onLandingFinished:()=>{if(!disposed)setLanding(false);},
      onSurveyPoint:index=>{if(!disposed)onSurveyPoint.current(index);},
      onChange:state=>{if(!disposed)setWorldState(state);},
      onRoverPhase:phase=>{if(!disposed)setRoverPhase(phase);},
      onRoverReading:reading=>{if(!disposed)setRoverReadings(previous=>[...previous.slice(-29),reading]);},
    })).then(runtime=>{
      if(disposed){runtime.dispose();return;}
      world.current=runtime;
      setTerrainId(runtime.source);
      setWorldReady(true);
    }).catch(()=>{if(!disposed)setWorldError(true);});
    return()=>{
      disposed=true;
      world.current?.dispose();
      if('speechSynthesis' in window)window.speechSynthesis.cancel();
    };
  },[]);
  useEffect(()=>{
    const element=dialog.current;
    if(panel&&!element?.open)element?.showModal();
    if(!panel&&element?.open)element.close();
  },[panel]);

  useEffect(()=>{
    try {localStorage.setItem('shackleton-heritage-v1',JSON.stringify(discoveries));}catch { /* Discovery remains available for this session. */ }
  },[discoveries]);

  function go(id:Station) {
    if(!worldReady)return;
    setStationsOpen(false);
    closeRover();
    if(!active)setActive(true);
    setPanel(null);
    if(worldState.nearest===id&&!worldState.moving){onArrival.current(id);return;}
    approach.current=id;
    world.current?.walkTo(id);
  }
  function closeRover() {setTrackingRover(false);setRoverOpen(false);}
  function toggleRover() {
    if(roverOpen){closeRover();return;}
    setRoverOpen(true);
    setTrackingRover(true);
  }
  function close() {setPanel(null);setEquipment(null);}
  function start(showGuide=true) {
    close();
    setActive(true);
    if(run.completed)setPanel('recap');
    else {
      setDayCard(run.day);
      if(showGuide&&run.day===1&&!alreadyVisited)setPanel('guide');
      if(voice)say(task.action);
    }
  }
  function finishFieldwork() {
    run.recordFieldwork();
    if(drill==='shelter')run.assign('shelter');
  }
  function commit() {
    if(!alreadyVisited||!run.nextShift())return;
    if(run.forecast.outcome){setPanel('recap');return;}
    close();
    world.current?.recenter();
    const next=run.day+1;
    if(next<=DAYS){
      setDayCard(next);
      if(voice)say(cadetTasks[drillFor(chapter(next,getFrame(next,run.mission.seed)).target)].action);
    }
  }
  function restart() {
    setStationsOpen(false);
    setMenuOpen(false);
    run.restart();
    closeRover();
    setRoverReadings([]);
    setSurveyIndex(null);
    setDayCard(null);
    setActive(false);
    setLanding(false);
    approach.current=null;
    world.current?.reset();
    close();
  }
  function demonstrateLanding() {
    close();
    world.current?.demonstrateLanding();
    run.recordMilestone('landing');
    setLanding(true);
    if(voice)say('Watch the Apollo Lunar Module descend onto the training platform.');
  }
  function toggleVoice() {
    const next=!voice;
    setVoice(next);
    if(next)say(active?current.line:'Welcome to Shackleton Outpost, Cadet.');
    else if('speechSynthesis' in window)window.speechSynthesis.cancel();
  }
  const atStation=worldState.nearest;
  const outcome=run.mission.outcome?endingCopy[run.mission.outcome]:null;
  return <main className="moon-game">
    <header className="moon-top">
      <button className="moon-brand" onClick={()=>setPanel('journal')} aria-label="Junior Astronaut mission journal"><span className="moon-logo"><Moon size={21}/></span><span>JUNIOR<span> ASTRONAUT</span><small>SPACEFORALL</small></span></button>
      <button className="moon-menu-toggle" type="button" aria-label={menuOpen?'Close mission menu':'Open mission menu'} aria-expanded={menuOpen} aria-controls="moon-mission-menu" onClick={()=>{setMenuOpen(!menuOpen);setStationsOpen(false);}}>
        {menuOpen?<X size={21}/>:<Menu size={21}/>}
      </button>
      <nav className="moon-nav" id="moon-mission-menu" aria-label="Mission menu" data-open={menuOpen} onClick={event=>{if((event.target as Element).closest('button'))setMenuOpen(false);}}>
        <button onClick={()=>setPanel(active?'guide':'comic')} aria-label="Cadet guide"><BookOpen size={17}/><span>Guide</span></button>
        {'speechSynthesis' in window&&<button onClick={toggleVoice} aria-pressed={voice} title="Narration">{voice?<Volume2 size={17}/>:<VolumeX size={17}/>}<span>Narration</span></button>}
        <button onClick={()=>setPanel('journal')}><BookOpen size={17}/><span>Journal</span></button>
        <button onClick={()=>setPanel('heritage')} aria-label={`Artifacts ${discoveries.length} of ${artifactIds.length}`}><ScanLine size={17}/><span>Artifacts {discoveries.length}/{artifactIds.length}</span></button>
        <button onClick={toggleRover} aria-pressed={roverOpen} aria-label="Rover live" disabled={!worldReady}><Radio size={17}/><span>Rover live</span></button>
        <button onClick={()=>setPanel('playback')} aria-label="Data playback"><FlaskConical size={17}/><span>Data playback</span></button>
        <button onClick={()=>setPanel('nasa')} aria-label="NASA sources"><BookOpen size={17}/><span>Sources</span></button>
        <button onClick={()=>setPanel('restart')} title="Restart mission" aria-label="Restart mission"><RotateCcw size={17}/></button>
      </nav>
    </header>
    <div className={'moon-screen'+(trackingRover?' tracking-rover':'')}>
      <canvas ref={canvas} onPointerDown={()=>{setMenuOpen(false);setStationsOpen(false);}} aria-label="Interactive three-dimensional Shackleton lunar outpost"/>
      <div className="moon-gradient"/>
      <div className="moon-markers">{stationIds.map(id=><button tabIndex={active?0:-1} key={id} ref={el=>{if(el)labels.current.set(id,el);else labels.current.delete(id);}} className={'moon-marker '+(isArtifact(id)?'heritage-marker ':'')+(id===objective?'highlight':'')} onClick={()=>go(id)}><MapPin size={14}/>{stations[id].name}</button>)}</div>

      {!worldReady&&!worldError&&<p className="moon-loading" role="status">Preparing the lunar terrain…</p>}
      {worldError&&<section className="moon-welcome moon-fallback">
        <div className="moon-eyebrow"><span/>SHACKLETON OUTPOST</div><h1>3D is unavailable</h1><p>This browser could not start the WebGL scene. You can continue the same mission using the control room.</p><Link className="moon-primary" to="/outpost">Open control room <ArrowRight size={18}/></Link>
      </section>}
      {!active&&worldReady&&!trackingRover&&<section className="moon-welcome">
        <div className="moon-eyebrow"><span/>LUNAR SOUTH POLE</div>
        <h1>Shackleton<br/><em>Outpost</em></h1>
        <p>Keep two astronauts alive on the Moon. Read your illustrated briefing, then step onto the surface and take charge of the outpost.</p>
        <button className="moon-primary" onClick={()=>run.mission.history.length?start():setPanel('comic')}><Footprints size={18}/>{run.completed?'Open mission debrief':run.mission.history.length?'Resume moonwalk':'Read mission briefing'} <ArrowRight size={19}/></button>
        <Link className="moon-textlink" to="/outpost">Open control room</Link>
      </section>}

      {active&&worldReady&&<>
        <div className="moon-location"><div className="moon-eyebrow"><span/>SHACKLETON SECTOR</div><strong>Day {Math.min(run.day,DAYS)} <small>/ {DAYS}</small></strong><span className={'moon-condition '+(run.frame.storm?'storm':'')}>{run.frame.storm?<TriangleAlert size={16}/>:<Sun size={16}/>} {run.frame.storm?'Solar particle alert':`+${run.frame.sun} solar power`}</span></div>
        <Reserves run={run}/>
        <div className="moon-dock">
        <div className="moon-story">
          {surveyIndex!==null?<><div className="moon-eyebrow"><span/>SURFACE SURVEY · {surveyIndex} / {course.length} RECORDED</div><h2>{course[surveyIndex].name}</h2><p>Walk the astronaut into the next blue ring. Use the controls or follow the beacon.</p>
          <button className="moon-alt" onClick={()=>world.current?.walkSurvey(surveyIndex)}><MapPin size={16}/>Guide me to the beacon</button></>:
          landing?<><div className="moon-eyebrow"><span/>SCIENCE LAB · APOLLO DEMONSTRATION</div><h2>The Lunar Module descends</h2><p>Watch the model land on the platform. NASA’s Apollo spacecraft carried separate stages for descent and ascent.</p></>:
          outcome?<><div className="moon-eyebrow"><span/>MISSION DEBRIEF</div><h2>{outcome.title}</h2><p>{outcome.line}</p>
          <div className="junior-story-actions"><button className="moon-primary" onClick={()=>setPanel('recap')}><BookOpen size={16}/>Mission recap</button><button className="moon-alt" onClick={()=>setPanel('quiz')}><Trophy size={16}/>{quizScore===null?'Cadet quiz':`Retake quiz · ${quizScore}/${cadetQuiz.length}`}</button></div></>:
          <><div className="moon-eyebrow"><span/>DAY {run.day} · CADET GUIDE</div><h2>{alreadyVisited?'Go back to the Habitat':task.title}</h2>
          <p>{alreadyVisited?'Choose a job for the crew. Check your power, then tap Run Day.':task.action}</p>
          {!alreadyVisited&&<div className="junior-why">{task.why}</div>}
          <div className="junior-story-actions"><button className="moon-primary" onClick={()=>go(objective)} disabled={worldState.moving&&approach.current===objective}><MapPin size={17}/>{worldState.moving&&approach.current===objective?`Walking to ${stations[objective].name}…`:'Show me the way'} <ChevronRight size={17}/></button></div></>}
        </div>
        <div className="moon-tools">
          <div className="moon-tool-actions">
          <button className="moon-compass" aria-label="Recenter camera" title="Recenter camera" onClick={()=>world.current?.recenter()}><Compass size={21}/></button>
          <button className="moon-alt moon-stations-toggle" type="button" aria-expanded={stationsOpen} aria-controls="moon-station-list" onClick={()=>{setStationsOpen(!stationsOpen);setMenuOpen(false);}}><MapPin size={16}/>Stations</button>
          </div>
          <div className="moon-dpad" aria-label="Moonwalk controls">
            {directions.map(({key,Icon,label,placement})=><button className={placement} key={key} aria-label={label} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);world.current?.hold(key,true);}} onPointerUp={()=>world.current?.hold(key,false)} onPointerCancel={()=>world.current?.hold(key,false)} onLostPointerCapture={()=>world.current?.hold(key,false)}
              onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();world.current?.hold(key,true);}}} onKeyUp={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();world.current?.hold(key,false);}}}><Icon size={18}/></button>)}
          </div>
          {atStation&&!worldState.moving&&<button className="moon-alt moon-nearby" onClick={()=>onArrival.current(atStation)}><Zap size={15}/>Use {stations[atStation].name}</button>}
        </div>
        <nav className="moon-station-list" id="moon-station-list" aria-label="Lunar stations" data-open={stationsOpen}>
          {stationIds.map(id=><button className={objective===id?'selected':''} key={id} onClick={()=>go(id)}><span/>{stations[id].name}</button>)}
        </nav>
        </div>
      </>}
      {roverOpen&&<RoverConsole phase={roverPhase} readings={roverReadings} tracking={trackingRover} onTrack={()=>setTrackingRover(value=>!value)} onClose={closeRover}/>}
      {dayCard!==null&&active&&!outcome&&<div className="day-transition" key={dayCard} onAnimationEnd={()=>setDayCard(null)} aria-hidden="true"><div><span>SHACKLETON OUTPOST</span><strong>DAY {String(dayCard).padStart(2,'0')}</strong><p>{current.title}</p></div></div>}
    </div>
    <footer className="moon-footer"><span>{terrainId?'LROC elevation · '+terrainId:'Shackleton terrain simulation'}</span><span>WASD or arrows to walk · Drag to look · E to use a nearby station</span></footer>
    <div className="sr-only" role="status">{run.notice}</div>
    <dialog className={'moon-dialog'+(panel==='comic'?' comic-dialog':'')} ref={dialog} aria-labelledby="moon-dialog-title" onCancel={event=>{event.preventDefault();close();}}>
      {panel&&<>{panel!=='comic'&&<button className="moon-dialog-close moon-chat-link" onClick={()=>window.dispatchEvent(new Event('nasa-robot-open'))} aria-label="Ask Comet from this panel" title="Ask Comet"><Radio size={15}/></button>}<button className="moon-dialog-close" onClick={close} aria-label="Close panel"><X size={19}/></button>
        {panel==='comic'?<MissionComic onLaunch={()=>start(false)} onSkip={()=>start()}/>:panel==='guide'?<JuniorGuide drill={drill} readyForHabitat={alreadyVisited} finished={run.completed} onContinue={()=>run.completed?setPanel('recap'):close()}/>:panel==='recap'?<MissionRecap mission={run.mission} activity={run.activity} title={outcome?.title??'Mission recap'} onQuiz={()=>setPanel('quiz')} onJournal={()=>setPanel('journal')}/>:panel==='quiz'?<EndQuiz onFinish={run.recordQuizScore} onClose={()=>setPanel('recap')}/>:panel==='heritage'?<HeritageLog discovered={discoveries} onRead={setPanel} onWalk={go}/>:isArtifact(panel)?<ArtifactPanel key={panel} id={panel} onClose={close} onReplay={()=>{if(worldState.nearest===panel)world.current?.demonstrateArtifact(panel);}}/>:panel==='nasa'?<NasaPanel/>:panel==='playback'?<DataPlayback/>:panel==='fieldwork'?<>
          {drill==='survey'?<SurveyDecision readings={roverReadings} onSelect={route=>{run.selectRoute(route);setSurveyIndex(0);close();}}/>:<Fieldwork key={drill+'-'+run.day} kind={drill} onComplete={finishFieldwork} onPreview={setEquipment}
            storm={run.frame.storm} onStartSurvey={()=>{setSurveyIndex(0);close();}}/>}
          <div className="moon-dialog-actions"><button className="moon-alt" onClick={close}>Back to surface</button>{alreadyVisited&&drill==='radio'&&<button className="moon-primary" onClick={()=>setPanel('habitat')}>Open habitat controls</button>}</div>
        </>:panel==='journal'?<MissionJournal run={run}/>:panel==='restart'?<>
          <div className="moon-dialog-label">SHACKLETON OUTPOST</div><h2 id="moon-dialog-title">Start a new mission?</h2><p className="moon-dialog-copy">This starts a fresh training run with a different sunlight sequence.</p><div className="moon-dialog-actions"><button className="moon-alt" onClick={close}>Keep playing</button><button className="moon-primary" onClick={restart}>Restart mission</button></div>
        </>:<StationPanel id={panel} run={run} onClose={close} onCommit={commit} canCommit={alreadyVisited} onLanding={demonstrateLanding} labModel={labModel}/>}
      </>}
    </dialog>
  </main>;
}
