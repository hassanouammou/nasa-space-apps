import assert from 'node:assert/strict';
import {test} from 'node:test';
import {advance, DAILY_NEEDS, defaultPlan, getFrame, newMission, project} from '../src/outpost/model.ts';
import {science, solarEvents} from '../src/outpost/science.ts';

test('the starter scenario can complete all learning objectives', () => {
  let mission=newMission();
  for(const assignment of ['survey','inside','shelter','inside','survey','inside'])
    mission=advance(mission,{...defaultPlan,assignment},false);
  assert.equal(mission.outcome,'complete');
  assert.equal(mission.stock.science,2);
  assert.equal(mission.stock.harvests,2);
  assert.equal(mission.history.length,6);
});

test('the repeat scenario requires budgeting power before the solar alert', () => {
  let mission=newMission(1);
  for(const [index,assignment] of ['survey','inside','shelter','inside','survey','inside'].entries()){
    mission=advance(mission,{...defaultPlan,plants:index===1?1:2,assignment},false);
    assert.equal(mission.history.length,index+1);
  }
  assert.equal(mission.outcome,'complete');
  assert.notEqual(getFrame(2,0).sun,getFrame(2,1).sun);
});

test('real NASA values determine base needs and simulated water recovery', () => {
  assert.deepEqual(DAILY_NEEDS,{oxygen:1.79,water:5,food:1.6});
  const result=project(newMission(), defaultPlan,false);
  assert.equal(result.effects.recovery, 5.439);
  assert.equal(getFrame(3,0).storm,solarEvents[0]);
  assert.equal(getFrame(3,1).storm,solarEvents[1]);
  assert.equal(science.radio.oneWay*2,5.4);
});

test('shelter lowers exposure using the Artemis shielding ratio and costs power', () => {
  let mission=newMission();
  mission=advance(advance(mission,defaultPlan,false),defaultPlan,false);
  const cabin=project(mission,defaultPlan,false);
  const shelter=project(mission,{...defaultPlan,assignment:'shelter'},false);
  assert.equal(shelter.effects.radiation,Math.round(cabin.effects.radiation*134/287));
  assert.equal(cabin.next.battery-shelter.next.battery,2);
});

test('radio reduces carryover, and plans above the current budget cannot advance', () => {
  const mission=newMission();
  assert.equal(project(mission,defaultPlan,false).next.battery-project(mission,defaultPlan,true).next.battery,1);
  const weak={...mission,stock:{...mission.stock,battery:0},history:[{},{},{}]};
  assert.equal(project(weak,defaultPlan,false).canRun,false);
  assert.equal(advance(weak,defaultPlan,false),weak);
  assert.deepEqual(mission.history,[]);
});

test('crop production pauses when available drinking water has priority', () => {
  const mission=newMission();
  const low={...mission,stock:{...mission.stock,water:5,wastewater:0}};
  const result=project(low,{...defaultPlan,plants:4},false);
  assert.equal(result.effects.cropWater,0);
  assert.equal(result.effects.air,0);
  assert.equal(result.next.growth,0);
});

test('unsafe supply choices can trigger rescue', () => {
  let mission=newMission();
  for(let i=0;i<5&&!mission.outcome;i++)
    mission=advance(mission,{air:0,recycler:0,plants:0,assignment:'survey'},false);
  assert.equal(mission.outcome,'evacuated');
  assert.ok(mission.history.at(-1).notes.some(note=>note.includes('Oxygen ran short')));
});

test('surviving without field reports is a distinct outcome', () => {
  let mission=newMission();
  for(let i=0;i<6;i++) mission=advance(mission,defaultPlan,false);
  assert.equal(mission.outcome,'partial');
});
