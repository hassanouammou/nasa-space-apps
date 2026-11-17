import {lazy, Suspense, useCallback, useEffect, useState} from 'react';
import {ArrowRight, MessageSquare, Rocket} from 'lucide-react';
import {Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {api, ApiError} from './api';
import {Brand, Notice} from './components/Primitives';
import Assistant from './components/Assistant';
import Briefing from './pages/Briefing';
import Home from './pages/Home';
import type {Artifact, Mission, Scenario} from './types';

const Debrief=lazy(()=>import('./pages/Debrief'));
const Discovery=lazy(()=>import('./pages/Discovery'));
const MissionControl=lazy(()=>import('./pages/MissionControl'));
const message=(error:unknown)=>error instanceof Error?error.message:'Mission services are unavailable.';
export default function App() {
  const location=useLocation();
  const navigate=useNavigate();
  const [mission,setMission]=useState<Mission|null>(null);
  const [sessionError,setSessionError]=useState('');
  const [restoring,setRestoring]=useState(Boolean(sessionStorage.getItem('luna-mission-id')));
  const [scenario,setScenario]=useState<Scenario|null>(null);
  const [scenarioError,setScenarioError]=useState('');
  const [catalogue,setCatalogue]=useState<Artifact[]|null>(null);
  const [catalogueError,setCatalogueError]=useState('');
  const [busy,setBusy]=useState(false);
  const [actionError,setActionError]=useState('');
  const [assistant,setAssistant]=useState<{artifact:Artifact|null}|null>(null);

  const restore=useCallback(async()=>{
    const key=sessionStorage.getItem('luna-mission-id');
    if (!key) return;
    setRestoring(true);
    setSessionError('');
    try {setMission(await api.mission(key));}
    catch(error) {
      if(error instanceof ApiError&&error.status===404) sessionStorage.removeItem('luna-mission-id');
      setSessionError(error instanceof ApiError&&error.status===404?'The last simulation session expired. Start a new mission from the briefing.':message(error));
    }
    finally {setRestoring(false);}
  },[]);
  useEffect(()=>{void restore();},[restore]);
  const loadScenario=useCallback(async()=>{
    setScenarioError('');
    try {setScenario(await api.scenario());}catch(error){setScenarioError(message(error));}
  },[]);
  const loadArchive=useCallback(async()=>{
    setCatalogueError('');
    try {setCatalogue(await api.catalogue());}catch(error){setCatalogueError(message(error));}
  },[]);
  useEffect(()=>{
    window.scrollTo(0,0);
    setActionError('');
  },[location.pathname]);
  useEffect(()=>{
    if (location.pathname==='/briefing'&&!scenario) void loadScenario();
    if (location.pathname.startsWith('/discovery')&&!catalogue) void loadArchive();
  },[location.pathname,scenario,catalogue,loadScenario,loadArchive]);

  async function start() {
    if(busy) return;
    setBusy(true);
    setActionError('');
    try {
      const initial=await api.create();
      const next=await api.choose(initial,'start');
      setMission(next);
      setSessionError('');
      sessionStorage.setItem('luna-mission-id',next.id);
      navigate('/mission');
    }catch(error){setActionError(message(error));}
    finally{setBusy(false);}
  }
  async function choose(choice:string) {
    if(busy||!mission)return;
    setBusy(true);
    setActionError('');
    try {
      const next=await api.choose(mission,choice);
      setMission(next);
      if (next.result) navigate('/debrief');
    } catch(error) {
      setActionError(message(error));
      if(error instanceof ApiError&&error.status===409) await restore();
    } finally {setBusy(false);}
  }
  const activeMission=mission?.result?'/debrief':mission?'/mission':'/briefing';
  const absent=<main className="page-shell">{restoring?<p role="status">Restoring your flight plan…</p>:<>
    <div className="page-heading"><h1>Mission control</h1><p>Open the briefing to initialize your lunar simulation.</p></div>{sessionError&&<Notice>{sessionError}</Notice>}
    {sessionError&&sessionStorage.getItem('luna-mission-id')&&<button className="button secondary" onClick={()=>void restore()}>Retry session</button>} <Link className="button primary" to="/briefing">Mission briefing <ArrowRight size={17}/></Link>
  </>}</main>;
  return <>
    <a className="skip-link" href="#workspace-content" onClick={event=>{event.preventDefault();document.getElementById('workspace-content')?.focus();}}>Skip to main content</a>
    <header className="topbar"><div className="topbar-inner"><Brand/>
      <nav aria-label="Main navigation"><NavLink to="/" end>Home</NavLink><NavLink to={activeMission}>Mission</NavLink><NavLink to="/discovery">Heritage</NavLink></nav>
      <div className="topbar-actions"><button className="icon-button assistant-trigger" aria-label="Open mission assistant" title="Mission assistant" onClick={()=>setAssistant({artifact:null})}><MessageSquare size={18}/></button><Link className="button small" to={activeMission}><Rocket size={15}/><span>{mission?.result?'Debrief':mission?'Resume mission':'Mission control'}</span></Link></div>
    </div></header>
    <div id="workspace-content" tabIndex={-1}>
      <Suspense fallback={<main className="page-shell" role="status">Loading mission console…</main>}>
      <Routes>
        <Route path="/" element={<Home resumable={Boolean(mission&&!mission.result)}/>}/>
        <Route path="/briefing" element={<Briefing scenario={scenario} busy={busy} error={actionError||scenarioError} onStart={()=>void start()} onRetry={()=>void loadScenario()}/>}/>
        <Route path="/mission" element={mission?(mission.result?<Navigate to="/debrief" replace/>:<MissionControl mission={mission} busy={busy} error={actionError||sessionError} onChoose={choice=>void choose(choice)}/>):absent}/>
        <Route path="/debrief" element={mission?.result?<Debrief mission={mission}/>:mission?<Navigate to="/mission" replace/>:absent}/>
        <Route path="/discovery/:id?" element={<Discovery catalogue={catalogue} discovered={mission?.discoveries||[]} error={catalogueError} onRetry={()=>void loadArchive()} onAsk={artifact=>setAssistant({artifact})}/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
      </Suspense>
    </div>
    {assistant&&<Assistant artifact={assistant.artifact} onClose={()=>setAssistant(null)}/>}
  </>;
}
