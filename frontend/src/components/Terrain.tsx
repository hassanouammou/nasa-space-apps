import {useState} from 'react';
import {Crosshair, Flag, FlaskConical, MapPin, Navigation, ScanLine} from 'lucide-react';
import type {Mission} from '../types';

const points = {
  base: {x:16,y:71,label:'LUNA BASE',description:'Your fictional airlock and return point.',Icon:Flag},
  rover: {x:64,y:27,label:'OBSERVATION POINT',description:'Survey Apollo heritage remotely from outside the protected perimeter.',Icon:ScanLine},
  science: {x:82,y:65,label:'SAMPLE FIELD',description:'Basalt and regolith are available outside the heritage perimeter.',Icon:FlaskConical},
};

export function Terrain({mission}:{mission:Mission}) {
  const [selected,setSelected] = useState<keyof typeof points|null>(null);
  const current=points[mission.position];
  return <section className="panel terrain-panel">
    <div className="panel-bar"><div><MapPin size={17}/><h2>Surface navigation</h2></div><span>TAURUS–LITTROW</span></div>
    <div className="terrain">
      <img src="/images/lunar-terrain.webp" alt="" />
      <div className="terrain-grid"/>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="route-diagram" aria-hidden="true">
        <path d="M16 71 L30 42 L48 31 L64 27" className={mission.route==='ridge'?'taken':''}/>
        <path d="M16 71 L37 79 L53 67 L56 44 L64 27" className={mission.route==='valley'?'taken':''}/>
        <path d="M64 27 L76 42 L82 65" className={mission.position==='science'?'taken':''}/>
        <path d="M82 65 L57 82 L29 87 L16 71"/>
      </svg>
      <span className="map-north"><Navigation size={16}/>N</span>
      {(Object.keys(points) as (keyof typeof points)[]).map(key=>{
        const {x,y,label,Icon}=points[key];
        return <button key={key} className={'map-node '+(mission.position===key?'current ':'')+(selected===key?'selected':'')} style={{left:x+'%',top:y+'%'}} aria-label={label} aria-pressed={selected===key} onClick={()=>setSelected(previous=>previous===key?null:key)}><Icon size={17}/><small>{label}</small></button>;
      })}
      <div className="map-live"><Crosshair size={15}/> EVA LOCATION · {current.label}</div>
    </div>
    <div className="map-caption">{selected ? <><b>{points[selected].label}</b> {points[selected].description}</> : 'Illustrated terrain and fictional traverse · schematic, with no geographic scale.'}</div>
  </section>;
}
