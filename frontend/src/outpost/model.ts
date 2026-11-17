import {getSurveyRoute} from './surveyRoutes.ts';
import type {SurveyRoute} from './surveyRoutes.ts';
import {science, solarEvents} from './science.ts';

export const CREW = 2;
export const DAYS = 6;
export const DAILY_NEEDS = {
  oxygen:science.crew.oxygen*CREW,
  water:science.crew.water*CREW,
  food:science.crew.food*CREW,
};
export const CAPACITY = {battery:22,oxygen:10,water:30,food:12,readiness:100};
export const GOALS = {science:2,harvests:1,readiness:60};
export const defaultPlan = {air:3,recycler:3,plants:2,assignment:'inside'} as const;
export type Allocation = 'air'|'recycler'|'plants';
export type Assignment = 'inside'|'survey'|'shelter';
export type Plan = Record<Allocation,number> & {assignment:Assignment;surveyRoute?:SurveyRoute};
export const assignments = {
  inside:{title:'Work inside',detail:'Keep the crew in the habitat. No field research.',power:0},
  survey:{title:'Survey outside',detail:'Gain one science report. Uses power and extra oxygen.',power:2},
  shelter:{title:'Use the storm shelter',detail:'Avoid most exposure. Shelter systems use power.',power:2},
} as const;
export type Inventory = typeof CAPACITY & {growth:number; wastewater:number;science:number;harvests:number;exposure:number};
export type Entry = {day:number; event:string; plan:Plan; notes:string[]; snapshot:Inventory; radio:boolean};
export type Mission = {seed:0|1; stock:Inventory; history:Entry[]; outcome:'complete'|'partial'|'evacuated'|null};
export type Frame = {title:string;detail:string;sun:number;storm?:typeof solarEvents[number];hint:string};

export function newMission(seed:0|1=0):Mission {
  return {seed,stock:{battery:8,oxygen:5,water:24,food:7,readiness:100,growth:0,wastewater:6,science:0,harvests:0,exposure:0},history:[],outcome:null};
}

export function getFrame(day:number,seed:Mission['seed']):Frame {
  const quiet = {title:'Clear skies',detail:'The solar panels have a clear view of the Sun. This is a good shift to prepare for changes in sunlight.',sun:11,hint:'Use clear skies to build a battery reserve. The greenhouse can share the remaining power.'};
  const storm = {title:'Solar particle alert',detail:'An archived NASA event has triggered this training alert. Choose where the crew will work during today’s shift.',sun:10,storm:solarEvents[seed],hint:'Move the crew into the shielded shelter. Keeping its air systems running uses two units of power.'};
  const shadow = {title:'Solar panels in shadow',detail:'A nearby ridge shades the array this shift. The outpost needs to draw from its battery.',sun:2,hint:'Reduce a power-hungry task if the battery is low. Check your air and water forecast before you commit.'};
  const frames = [
    {title:'Open the outpost',detail:'Two astronauts need six days of air, water and food. Allocate power, then pick a crew assignment.',sun:13,hint:'Schedule your outdoor surveys on clear days. Power the greenhouse early so there is time to harvest.'},
    seed===0?quiet:shadow,
    storm,
    seed===0?shadow:quiet,
    {...quiet,title:'Sunlight returns',sun:12},
    {...quiet,title:'Final shift',sun:10,hint:'Check the remaining supplies. Complete a survey only if the crew can safely afford it.'},
  ];
  return frames[day-1] ?? quiet;
}
const round = (n:number)=>Math.round(n*1000)/1000;
const limit = (n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));

export function project(mission:Mission,plan:Plan,radio:boolean) {
  const day=mission.history.length+1;
  const frame=getFrame(day,mission.seed);
  const available=mission.stock.battery+frame.sun;
  const route=plan.assignment==='survey'?getSurveyRoute(plan.surveyRoute):undefined;
  const used=2+plan.air+plan.recycler+plan.plants+(route?.power??assignments[plan.assignment].power)+Number(radio);
  const canRun=used<=available&&!mission.outcome;
  const next={...mission.stock};
  const messages:string[]=[];
  const effects={air:0,recovery:0,cropWater:0,harvest:0,radiation:0};
  if (!canRun) return {next,available,used,canRun,effects,messages:['Reduce power spending to run the outpost.']};

  next.battery=Math.min(CAPACITY.battery,available-used);
  const processed=Math.min(next.wastewater,plan.recycler*1.85);
  effects.recovery=round(processed*science.water.efficiency);
  next.wastewater-=processed;
  next.water+=effects.recovery;

  const oxygenNeeded=DAILY_NEEDS.oxygen+(plan.assignment==='survey'?(route?.oxygen??.4):0);
  // Reserve crew drinking water before machines can draw from the tank.
  const equipmentWater=()=>Math.max(0,next.water-DAILY_NEEDS.water);
  effects.air=round(Math.min(plan.air*.68,equipmentWater()/1.125,Math.max(0,CAPACITY.oxygen+oxygenNeeded-next.oxygen)));
  next.oxygen+=effects.air;
  next.water-=effects.air*1.125;

  effects.cropWater=round(Math.min(equipmentWater(),plan.plants*.55));
  next.water-=effects.cropWater;
  next.growth+=effects.cropWater/0.55*20;
  if(next.growth>=100) {
    next.growth-=100;
    next.harvests+=1;
    effects.harvest=2.4;
    next.food+=effects.harvest;
    messages.push(`You harvested ${science.osdr.crop}. The pantry gained 2.4 kg of food equivalent.`);
  }
  const oxygenMet=Math.min(1,next.oxygen/oxygenNeeded);
  const waterMet=Math.min(1,next.water/DAILY_NEEDS.water);
  const foodMet=Math.min(1,next.food/DAILY_NEEDS.food);

  if(oxygenMet<.999) messages.push('Oxygen ran short. The crew lost readiness.');
  if(waterMet<.999) messages.push('Drinking water ran short. The crew lost readiness.');
  if(foodMet<.999) messages.push('The crew could not get full meals.');
  next.oxygen-=oxygenNeeded;
  next.water-=DAILY_NEEDS.water;
  next.food-=DAILY_NEEDS.food;
  next.wastewater=Math.min(12,next.wastewater+5.25*waterMet);

  if(frame.storm) {
    effects.radiation={inside:20,survey:42,shelter:Math.round(20*science.radlab.shelterRate/science.radlab.cabinRate)}[plan.assignment];
    messages.push(plan.assignment==='shelter'?'The shielded shelter reduced the solar-particle exposure.':'The crew took a higher exposure during the solar-particle alert.');
  } else if(plan.assignment==='survey') {
    effects.radiation=3;
  }
  next.exposure+=effects.radiation;
  next.readiness+=2-42*(1-oxygenMet)-34*(1-waterMet)-18*(1-foodMet)-effects.radiation*.9;
  if(plan.assignment==='survey'&&oxygenMet>=.99&&waterMet>=.99) {
    next.science+=1;
    messages.push('The crew returned with one field report.');
  } else if(plan.assignment==='survey') {
    messages.push('The survey could not be completed with the available crew supplies.');
  }
  if(messages.length===0) messages.push('Crew needs were covered. Unused power went into the battery.');
  if(route)messages.push(`You chose ${route.title}. The survey used ${route.power} power and planned ${route.oxygen.toFixed(1)} kg of extra oxygen.`);
  if(radio) messages.push('Mission Control radio used one power unit.');
  for(const key of ['battery','oxygen','water','food','readiness'] as const) next[key]=round(limit(next[key],0,CAPACITY[key]));
  next.growth=round(next.growth);
  next.wastewater=round(next.wastewater);
  const emergency=next.readiness<=25||oxygenMet<.35||waterMet<.35||next.exposure>=70;
  const ready=next.readiness>=GOALS.readiness&&next.science>=GOALS.science&&next.harvests>=GOALS.harvests;
  const outcome:Mission['outcome']=emergency?'evacuated':day===DAYS?(ready?'complete':'partial'):null;
  return {next,available,used,canRun,effects,messages,outcome};
}

export function advance(mission:Mission,plan:Plan,radio:boolean):Mission {
  const result=project(mission,plan,radio);
  if(!result.canRun) return mission;
  const day=mission.history.length+1;
  return {
    ...mission, stock:result.next, outcome:result.outcome??null,
    history:[...mission.history,{day,event:getFrame(day,mission.seed).title,plan:{...plan},notes:result.messages,snapshot:result.next,radio}],
  };
}
