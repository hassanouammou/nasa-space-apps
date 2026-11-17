import assert from 'node:assert/strict';
import {test} from 'node:test';
import {aligned,course,drillFor,drills,RADIO_LEG_MS,relayPosition} from '../src/moon/fieldwork.ts';
import {walkable,routeBetween} from '../src/moon/navigation.ts';
import {chapter} from '../src/moon/story.ts';
import {getFrame} from '../src/outpost/model.ts';

test('both mission variants cover all six fieldwork activities', () => {
  for(const seed of [0,1]) {
    const challenges=Array.from({length:6},(_,i)=>drillFor(chapter(i+1,getFrame(i+1,seed)).target));
    assert.deepEqual(new Set(challenges),new Set(['air','plants','shelter','power','survey','radio']));
  }
});
test('equipment must stay in its marked alignment band', () => {
  for(const drill of Object.values(drills)){
    assert.ok(aligned(drill.target-4,drill.target));
    assert.ok(aligned(drill.target+4,drill.target));
    assert.equal(aligned(drill.target+5,drill.target),false);
    assert.equal(aligned(18,drill.target),false);
  }
});
test('the radio visualization travels outward and back in 5.4 seconds', () => {
  assert.equal(RADIO_LEG_MS,2700);
  assert.equal(relayPosition(0),0);
  assert.equal(relayPosition(1350),0.5);
  assert.equal(relayPosition(2700),1);
  assert.equal(relayPosition(4050),0.5);
  assert.equal(relayPosition(5400),0);
  assert.equal(relayPosition(5600),0);
});
test('the three survey points are reachable from the science lab in sequence', () => {
  let start={x:0,z:-25};
  for(const point of course){
    assert.ok(walkable(point.x,point.z));
    assert.deepEqual(routeBetween(start,point).at(-1),{x:point.x,z:point.z});
    start=point;
  }
});
