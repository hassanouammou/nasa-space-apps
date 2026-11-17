export type Values = Record<'oxygen'|'battery'|'water'|'suit'|'hr'|'temperature'|'fatigue'|'sleep'|'spo2', number>;
export type Resource = 'oxygen'|'battery'|'water'|'suit';
export type EventId = 'E00'|'E01'|'E02'|'E03'|'E05'|'E06'|'E07'|'E08';
export interface Health {level:'NORMAL'|'ATTENTION'|'CRITICAL'; reasons:string[]; recommendation:string}
export interface Choice {id:string;label:string;description:string;effects:Partial<Values & {time:number}>;disabled_reason:string|null;return_warnings:string[]}
export interface Scenario {id:string; name:string; destination:string; duration:number; initial:Values; reserve:Partial<Values>}
export interface Mission {
  id:string; mission:string; event:EventId; minute:number; remaining:number; revision:number;
  values:Values; position:'base'|'rover'|'science'; route:'ridge'|'valley'|null; discoveries:string[];
  samples:string[]; result:string|null; emergency:string[];
  history:{minute:number;event:EventId;choice:string}[]; telemetry:(Values & {minute:number})[];
  health:Health; alerts:(Health & {minute:number})[];
  current:{title:string;description:string;choices:Choice[]};
  objectives:{label:string;complete:boolean}[];
  report:{
    score:number;safety:number;exploration:number;science:number;
    consumed:Record<Resource, number>;elapsed:number;lesson:string;
  }|null;
}
export interface Source {title:string;url:string}
export interface Artifact {id:string;name:string;short:string;mission:string;year:number;image:string;description:string;function:string;importance:string;placement:string;sources:Source[]}
export interface Answer {answer:string;sources:Source[]}
