import {science} from '../outpost/science.ts';
import type {SurveyRoute} from '../outpost/surveyRoutes';
import type {BaseStation} from './story';

export const drills={
  air:{title:'Seal the oxygen line',instruction:'Slide the blue pipe collar until it meets the gold socket. Keep it aligned while the seal closes.',target:74,label:'Oxygen pipe collar',source:science.crew.url},
  plants:{title:'Focus the grow lights',instruction:'Adjust the lights until the beam covers the center of the seed tray. Hold that setting while the light meter confirms it.',target:58,label:'Grow light aim',source:science.osdr.url},
  power:{title:'Aim the solar array',instruction:'Rotate the array until its face lines up with the Sun marker. This helps when the Sun is visible. A ridge can still block it.',target:72,label:'Solar panel tilt',source:science.pole.url},
  radio:{title:'Bring Earth into radio range',instruction:'Tune the antenna until the two waves match. Then send a test pulse and watch it travel to Earth and back.',target:68,label:'Antenna tuning',source:science.radio.url},
} as const;
export type TuneDrill=keyof typeof drills;
export type Drill=TuneDrill|'shelter'|'survey';
export const RADIO_LEG_MS=science.radio.oneWay*1000;
export const course=[
  {x:-4,z:-23,name:'Crater rim'},
  {x:0,z:-20,name:'Sample patch'},
  {x:5,z:-23,name:'Survey marker'},
] as const;

const check={x:-1,z:-24,name:'Equipment check'};
const report={x:0,z:-8,name:'Habitat report beacon'};
const branches={
  rise:[check,{x:-10,z:-4,name:'Western rise'},report],
  relay:[check,{x:3,z:-6,name:'Relay approach'},report],
} as const;
export function surveyCourse(route?:SurveyRoute) {
  return route?branches[route]:course;
}

export function drillFor(station:BaseStation):Drill {
  if(station==='habitat')return 'radio';
  if(station==='lab')return 'survey';
  return station;
}
export function aligned(value:number,target:number) {
  return Math.abs(value-target)<=4;
}
export function relayPosition(elapsed:number) {
  const time=Math.max(0,Math.min(elapsed,2*RADIO_LEG_MS));
  return time<=RADIO_LEG_MS?time/RADIO_LEG_MS:(2*RADIO_LEG_MS-time)/RADIO_LEG_MS;
}
