import {useState} from 'react';
import {ArrowRight, ListChecks, Lock, TriangleAlert} from 'lucide-react';
import {motion, useReducedMotion} from 'framer-motion';
import type {Choice, Mission, Values} from '../types';

const labels:Record<keyof (Values&{time:number}),string> = {
  oxygen:'% suit O₂',battery:'% battery',water:'% water',suit:'% suit',hr:' bpm',temperature:' °C',fatigue:' fatigue',sleep:' h sleep',spo2:'% blood SpO₂',time:' min',
};

function Effect({name,amount}:{name:keyof typeof labels;amount:number}) {
  return <span className="effect">{(amount>0&&name!=='time'?'+':'')+amount}{labels[name]}</span>;
}
export function Decisions({mission,busy,onChoose}:{mission:Mission;busy:boolean;onChoose:(choice:string)=>void}) {
  const [confirm,setConfirm]=useState<string|null>(null);
  const reduced=useReducedMotion();
  function choose(choice:Choice) {
    if (choice.return_warnings.length&&confirm!==choice.id) {setConfirm(choice.id);return;}
    onChoose(choice.id);
  }
  return <motion.section className="panel decisions" initial={reduced?false:{opacity:.65,y:6}} animate={{opacity:1,y:0}}>
    <div className="panel-bar"><div><ListChecks size={18}/><h2>Mission decision</h2></div><span>{mission.event}</span></div>
    <div className="decision-body">
      <h3>{mission.current.title}</h3><p>{mission.current.description}</p>
      <div className="choice-list">{mission.current.choices.map((choice,index)=>
        <div className="choice-wrap" key={choice.id}>
          <button disabled={busy||Boolean(choice.disabled_reason)} className="choice" onClick={()=>choose(choice)}>
            <span className="choice-letter">{String.fromCharCode(65+index)}</span>
            <span className="choice-copy"><strong>{choice.label}</strong><small>{choice.description}</small>
              <span className="effects">{Object.entries(choice.effects).map(([name,amount])=><Effect key={name} name={name as keyof typeof labels} amount={amount}/>)}</span>
              {choice.disabled_reason&&<span className="choice-warning">{choice.disabled_reason}</span>}
              {choice.return_warnings.length>0&&<span className="choice-warning"><TriangleAlert size={14}/> {choice.return_warnings.join(' · ')}</span>}
            </span>{choice.disabled_reason?<Lock size={16}/>:<ArrowRight size={18}/>}
          </button>
          {confirm===choice.id&&<div className="route-confirm"><p>This return projection is outside mission limits. Attempt the route?</p><button className="button danger" disabled={busy} onClick={()=>onChoose(choice.id)}>Confirm attempt</button><button className="button secondary" onClick={()=>setConfirm(null)}>Cancel</button></div>}
        </div>)}</div>
    </div>
  </motion.section>;
}
