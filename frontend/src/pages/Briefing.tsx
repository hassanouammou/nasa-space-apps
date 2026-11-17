import {ArrowRight, BatteryCharging, Check, Droplets, HeartPulse, ShieldCheck, Wind} from 'lucide-react';
import {Eyebrow, HEALTH_NOTE, Notice, timeLabel} from '../components/Primitives';
import type {Scenario} from '../types';

export default function Briefing({scenario,busy,error,onStart,onRetry}:{scenario:Scenario|null;busy:boolean;error:string;onStart:()=>void;onRetry:()=>void}) {
  return <main className="page-shell">
    <div className="page-heading"><Eyebrow>FLIGHT PLAN / LUNA-01</Eyebrow><h1>Mission briefing</h1><p>Mission Explorer · Taurus–Littrow Valley</p></div>
    <div className="briefing-grid">
      <section className="panel briefing-picture"><img src="/images/lunar-terrain.webp" alt="Illustration of the lunar terrain from above"/><div><Eyebrow>SURFACE SECTOR</Eyebrow><h2>Taurus–Littrow</h2><p>A fictional EVA in the valley explored by Apollo 17.</p></div></section>
      <section className="panel pad">
        <h2>Flight objectives</h2><ul className="checklist">{['Prepare your astronaut and equipment.','Choose a surface traverse and log one Apollo artifact.','Collect two geological samples outside the heritage perimeter.','Monitor simulated telemetry and preserve return reserves.','Return safely before your six-hour window closes.'].map(item=><li key={item}><Check size={16}/>{item}</li>)}</ul>
        <p className="muted">Crew · You are the EVA explorer. Mission Control provides guidance.</p>
        <p className="muted">Keep your distance from historical objects. A safe early return earns full safety credit.</p>
      </section>
      {scenario && <section className="panel pad briefing-resources"><h2>Initial conditions</h2><div className="starting-grid">
        <div><Wind/>{scenario.initial.oxygen}% <small>Suit oxygen</small></div><div><BatteryCharging/>{scenario.initial.battery}% <small>Battery</small></div><div><Droplets/>{scenario.initial.water}% <small>Water</small></div><div><ShieldCheck/>{scenario.initial.suit}% <small>Suit condition</small></div><div><HeartPulse/>{scenario.initial.hr} bpm <small>Heart rate</small></div>
      </div><p className="muted">{scenario.initial.temperature} °C temperature · {scenario.initial.spo2}% blood SpO₂ · {scenario.initial.fatigue}/100 fatigue · {scenario.initial.sleep} h sleep · {timeLabel(scenario.duration)} mission window</p></section>}
    </div>
    {error && <Notice>{error}</Notice>}
    <div className="briefing-actions"><p>{HEALTH_NOTE}</p>{!scenario && error ? <button className="button secondary" onClick={onRetry}>Retry briefing</button> : <button className="button primary" disabled={busy||!scenario} onClick={onStart}>{busy?'Initializing…':scenario?'Begin Mission':'Loading flight plan…'}<ArrowRight size={18}/></button>}</div>
  </main>;
}
