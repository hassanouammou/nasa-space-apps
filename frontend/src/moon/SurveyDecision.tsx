import {BatteryCharging,MapPin,Radio,Wind} from 'lucide-react';
import {surveyRoutes} from '../outpost/surveyRoutes';
import type {SurveyRoute} from '../outpost/surveyRoutes';
import {terrainSource} from './roverTelemetry';
import type {RoverReading} from './roverTelemetry';

const choices=['rise','relay'] as const;

export function SurveyDecision({readings,onSelect}:{readings:readonly RoverReading[];onSelect:(route:SurveyRoute)=>void}) {
  const latestBySite=new Map(readings.map(packet=>[packet.site,packet]));
  const samples=choices.map(id=>latestBySite.get(surveyRoutes[id].title));
  const ready=samples.every(Boolean);
  const archived=ready&&samples.every(packet=>packet?.source);
  return <section className="fieldwork survey-decision">
    <div className="moon-dialog-label"><Radio size={15}/> SCOUT · FIELD REPORT</div>
    <h2 id="moon-dialog-title">Pick a place to explore</h2>
    <p className="moon-dialog-copy">Which do you need to save today, battery power or oxygen? Compare Scout’s readings, then walk to three beacons to check the area.</p>
    {!ready&&<p className="moon-inline-note" role="status">Scout is sending both terrain scans. Received {samples.filter(Boolean).length} of 2.</p>}
    <div className="survey-options">
      {choices.map((id,index)=>{
        const route=surveyRoutes[id],reading=samples[index];
        return <button key={id} onClick={()=>onSelect(id)} disabled={!ready} className="survey-option">
          <strong><MapPin size={15}/>{route.title}</strong>
          <span>{reading?`Ground slope ${reading.slope.toFixed(1)}°`:'Waiting for Scout'}</span>
          <small>{route.detail}</small>
          <span className="survey-cost"><span><BatteryCharging size={14}/>{route.power} power</span><span><Wind size={14}/>{route.oxygen.toFixed(1)} kg extra oxygen</span></span>
        </button>;
      })}
    </div>
    <p className="moon-inline-note">{archived?<>The slopes come from <a href={terrainSource} target="_blank" rel="noreferrer">NASA’s archived Shackleton terrain</a>. </>:ready?'These terrain readings use the simulated map. ':null}The costs are training rules. The slope is measured at each scan point.</p>
  </section>;
}
