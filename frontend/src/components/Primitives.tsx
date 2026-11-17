import type {ReactNode} from 'react';
import {ArrowUpRight, Radio, Orbit, TriangleAlert} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {Health, Source} from '../types';

export const HEALTH_NOTE = 'Educational simulation only — not a medical monitoring or diagnostic system.';
export const timeLabel = (time:number) => [Math.floor(time/60),time%60].map(number => String(number).padStart(2,'0')).join(':');
export function Brand() {
  return <Link to="/" className="brand"><span className="brand-icon"><Orbit size={24}/></span><span>JUNIOR <b>ASTRONAUT</b><small>SPACEFORALL</small></span></Link>;
}
export function Eyebrow({children}:{children:ReactNode}) {
  return <div className="eyebrow"><span/>{children}</div>;
}
export function Status({health}:{health:Health}) {
  return <span className={'status '+health.level.toLowerCase()}><Radio size={13}/>{health.level}</span>;
}
export function Notice({children}:{children:ReactNode}) {
  return <div className="notice" role="alert"><TriangleAlert size={17}/><span>{children}</span></div>;
}
export function Sources({sources}:{sources:Source[]}) {
  return <ul className="source-list">{sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={14}/></a></li>)}</ul>;
}
