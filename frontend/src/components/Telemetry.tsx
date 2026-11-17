import {useState} from 'react';
import {Activity, BatteryCharging, Droplets, Gauge, HeartPulse, ShieldCheck, Thermometer, Timer, Wind} from 'lucide-react';
import {CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {Mission} from '../types';
import {HEALTH_NOTE, Status, timeLabel} from './Primitives';

export const resources = [
  {key:'oxygen',label:'Suit oxygen',Icon:Wind},
  {key:'battery',label:'Battery',Icon:BatteryCharging},
  {key:'water',label:'Water',Icon:Droplets},
  {key:'suit',label:'Suit condition',Icon:ShieldCheck},
] as const;
const metrics = [
  {key:'hr',label:'Heart rate',unit:'bpm',domain:[50,150],Icon:HeartPulse},
  {key:'temperature',label:'Body temperature',unit:'°C',domain:[34,40],Icon:Thermometer},
  {key:'fatigue',label:'Fatigue',unit:'/ 100',domain:[0,100],Icon:Gauge},
  {key:'spo2',label:'Blood SpO₂',unit:'%',domain:[75,100],Icon:Activity},
] as const;

export function Systems({mission}:{mission:Mission}) {
  return <section className="panel">
    <div className="panel-bar"><div><Gauge size={17}/><h2>Suit systems</h2></div><span>SUPPLIES</span></div>
    <div className="systems-body">
      {resources.map(({key,label,Icon})=><div className="resource" key={key}>
        <div><span><Icon size={15}/>{label}</span><strong>{mission.values[key]}%</strong></div>
        <progress className={mission.values[key]<=25?'low':''} value={mission.values[key]} max={100} aria-label={label}/>
      </div>)}
      <div className="clock"><Timer size={19}/><span>Remaining mission time</span><strong>{timeLabel(mission.remaining)}</strong></div>
    </div>
  </section>;
}
export function Telemetry({mission}:{mission:Mission}) {
  const [metric,setMetric]=useState<typeof metrics[number]['key']>('hr');
  const current=metrics.find(item=>item.key===metric)!;
  return <section className="panel telemetry" id="telemetry">
    <div className="panel-bar"><div><Activity size={18}/><h2>Astronaut telemetry</h2></div><Status health={mission.health}/></div>
    <div className="telemetry-content">
      <div className="vitals">{metrics.map(({key,label,unit,Icon})=><button key={key} className={'vital '+(key===metric?'active':'')} onClick={()=>setMetric(key)} aria-pressed={key===metric}><span><Icon size={15}/>{label}</span><strong>{mission.values[key]}<small>{unit}</small></strong></button>)}</div>
      <div className="chart-top"><span>{current.label} / {current.unit}</span><span>Prior sleep · {mission.values.sleep} h</span></div>
      <div className="chart" aria-label={current.label+' simulated time series'}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170}>
          <LineChart data={mission.telemetry} margin={{top:8,right:16,bottom:0,left:0}}>
            <CartesianGrid stroke="#213144" strokeDasharray="3 5" vertical={false}/>
            <XAxis type="number" dataKey="minute" domain={[0,360]} ticks={[0,60,120,180,240,300,360]} tickFormatter={timeLabel} tick={{fill:'#a8b6c8',fontSize:11}} stroke="#314154"/>
            <YAxis domain={[...current.domain]} width={35} tick={{fill:'#a8b6c8',fontSize:11}} stroke="#314154"/>
            <Tooltip labelFormatter={value=>timeLabel(Number(value))+' elapsed'} contentStyle={{background:'#111e2c',border:'1px solid #31465c',borderRadius:8}} itemStyle={{color:'#67ddfd'}}/>
            <Line type="linear" dataKey={metric} name={current.label} stroke="#59d9ff" strokeWidth={2} isAnimationActive={false} dot={{r:3,fill:'#59d9ff'}}/>
            {mission.telemetry.length===1&&<ReferenceDot x={0} y={mission.values[metric]} r={5} fill="#59d9ff" stroke="none"/>}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={'advice '+mission.health.level.toLowerCase()}>{mission.health.reasons.length>0&&<b>{mission.health.reasons.join(' · ')}</b>}<span>{mission.health.recommendation}</span></div>
      <p className="health-note">{HEALTH_NOTE}</p>
    </div>
  </section>;
}
