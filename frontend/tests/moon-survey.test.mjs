import assert from 'node:assert/strict';
import {test} from 'node:test';
import {advance,defaultPlan,newMission,project} from '../src/outpost/model.ts';
import {surveyCourse} from '../src/moon/fieldwork.ts';
import {routeBetween} from '../src/moon/navigation.ts';

test('Scouts two terrain routes put a beacon at each scan and return to the habitat',()=>{
  const [rise,relay]=['rise','relay'].map(surveyCourse);
  assert.equal(rise[1].name,'Western rise');
  assert.equal(relay[1].name,'Relay approach');
  assert.deepEqual(rise[2],relay[2]);
  for(const course of [rise,relay])for(let index=1;index<course.length;index++){
    const target=course[index];
    assert.deepEqual(routeBetween(course[index-1],target).at(-1),{x:target.x,z:target.z});
  }
});

test('the survey route changes battery and oxygen costs and is logged',()=>{
  const mission=newMission();
  const survey={...defaultPlan,assignment:'survey'};
  const rise=project(mission,{...survey,surveyRoute:'rise'},false);
  const relay=project(mission,{...survey,surveyRoute:'relay'},false);
  assert.equal(relay.used-rise.used,1);
  assert.ok(Math.abs(relay.next.oxygen-rise.next.oxygen-.4)<1e-9);
  assert.match(advance(mission,{...survey,surveyRoute:'relay'},false).history[0].notes.join(' '),/Relay approach/);
  assert.deepEqual(project(mission,{...defaultPlan,surveyRoute:'rise'},false),project(mission,defaultPlan,false));
});
