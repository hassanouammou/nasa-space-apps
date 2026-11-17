import {useEffect,useState} from 'react';
import {advance,assignments,defaultPlan,getFrame,newMission,project} from './model.ts';
import type {Allocation,Assignment,Mission,Plan} from './model.ts';
import type {SurveyRoute} from './surveyRoutes.ts';
import {science} from './science.ts';

export type MissionActivity = {fieldwork:number[]; artifacts:string[]; rover:boolean; landing:boolean; quizScore:number|null};
const blankActivity:MissionActivity={fieldwork:[],artifacts:[],rover:false,landing:false,quizScore:null};
type Save = {mission:Mission; plan:Plan; radioDay:number|null; replyAt:number; reply:string; activity?:MissionActivity};
const readSave=():Save=>{
  try {
    const stored=localStorage.getItem('shackleton-trainer-v2');
    if(stored) {
      const saved=JSON.parse(stored) as Save;
      const mission=saved.mission;
      if ((mission.seed===0||mission.seed===1)&&Array.isArray(mission.history)&&mission.stock&&Number.isFinite(mission.stock.battery)
          && saved.plan.assignment in assignments && (['air','recycler','plants'] as const).every(key=>[0,1,2,3,4].includes(saved.plan[key]))) return saved;
    }
  } catch { /* Storage can be disabled in some browsers. */ }
  return {mission:newMission(),plan:{...defaultPlan},radioDay:null,replyAt:0,reply:''};
};

export function useTrainingRun() {
  const [saved]=useState(readSave);
  const [mission,setMission]=useState(saved.mission);
  const [plan,setPlan]=useState<Plan>(saved.plan);
  const [activity,setActivity]=useState(saved.activity??blankActivity);
  const [radioDay,setRadioDay]=useState<number|null>(saved.radioDay);
  const [replyAt,setReplyAt]=useState(saved.replyAt);
  const [now,setNow]=useState(Date.now);
  const [reply,setReply]=useState(saved.reply);
  const [notice,setNotice]=useState('');
  const day=mission.history.length+1;
  const frame=getFrame(day,mission.seed);
  const usedRadio=radioDay===day;
  const forecast=project(mission,plan,usedRadio);
  const waiting=replyAt>now;
  const completed=Boolean(mission.outcome);
  const last=mission.history.at(-1);

  useEffect(()=>{
    try {localStorage.setItem('shackleton-trainer-v2',JSON.stringify({mission,plan,radioDay,replyAt,reply,activity}));}
    catch { /* The current run stays in memory. */ }
  },[mission,plan,radioDay,replyAt,reply,activity]);
  useEffect(()=>{
    if(!waiting)return;
    const timer=window.setInterval(()=>setNow(Date.now()),100);
    return()=>window.clearInterval(timer);
  },[waiting]);
  function update(key:Allocation,value:number) {
    setPlan(current=>({...current,[key]:Math.max(0,Math.min(4,value))}));
  }
  function radio() {
    if(waiting||usedRadio||forecast.available<forecast.used+1)return;
    const time=Date.now();
    setRadioDay(day);
    setNow(time);
    setReplyAt(time+science.radio.oneWay*2000);
    setReply(frame.hint);
  }
  function nextShift() {
    const updated=advance(mission,plan,usedRadio);
    if(updated===mission)return false;
    setMission(updated);
    setPlan(current=>({...current,assignment:'inside',surveyRoute:undefined}));
    setNotice(`Day ${day} complete. ${updated.history.at(-1)?.notes.join(' ')}`);
    return true;
  }
  function recordFieldwork() {
    if(!completed)setActivity(value=>value.fieldwork.includes(day)?value:{...value,fieldwork:[...value.fieldwork,day]});
  }
  function recordArtifact(id:string) {
    if(!completed)setActivity(value=>value.artifacts.includes(id)?value:{...value,artifacts:[...value.artifacts,id]});
  }
  function recordMilestone(key:'rover'|'landing') {
    if(!completed)setActivity(value=>value[key]?value:{...value,[key]:true});
  }
  function recordQuizScore(quizScore:number) {
    setActivity(value=>({...value,quizScore}));
  }
  function restart() {
    setActivity(blankActivity);
    setMission(newMission(mission.seed===0?1:0));
    setPlan({...defaultPlan});
    setRadioDay(null);
    setReplyAt(0);
    setReply('');
    setNotice('New mission started.');
  }
  return {mission,activity,recordFieldwork,recordArtifact,recordMilestone,recordQuizScore,plan,day,frame,usedRadio,forecast,waiting,completed,last,notice,radioDay,replyAt,now,reply,update,
    selectRoute:(surveyRoute:SurveyRoute)=>setPlan(current=>({...current,surveyRoute})),
    assign:(assignment:Assignment)=>setPlan(current=>({...current,assignment})),radio,nextShift,restart};
}

export type TrainingRun=ReturnType<typeof useTrainingRun>;
