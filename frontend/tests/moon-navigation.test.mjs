import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapter, stations } from '../src/moon/story.ts';
import { routeBetween, walkable } from '../src/moon/navigation.ts';
import { getFrame } from '../src/outpost/model.ts';

test('every lunar station has a walkable approach from every other station', () => {
  const stops=Object.values(stations).map(({stopX:x,stopZ:z})=>({x,z}));
  for(const start of [{x:0,z:12},...stops]){
    for(const goal of stops){
      assert.equal(walkable(goal.x,goal.z),true);
      if(start.x===goal.x&&start.z===goal.z)continue;
      const route=routeBetween(start,goal);
      assert.deepEqual(route.at(-1),goal);
      let last=start;
      for(const point of route){
        assert.equal(walkable(point.x,point.z),true);
        assert.equal(Math.abs(last.x-point.x)+Math.abs(last.z-point.z),1);
        last=point;
      }
    }
  }
});

test('the story directs the player to the active simulation event', () => {
  for(const mode of [0,1]){
    assert.equal(chapter(1,getFrame(1,mode)).target,'air');
    assert.equal(chapter(3,getFrame(3,mode)).target,'shelter');
    const shadowDay=mode===0?4:2;
    assert.equal(chapter(shadowDay,getFrame(shadowDay,mode)).target,'power');
    assert.equal(chapter(5,getFrame(5,mode)).target,'lab');
    assert.equal(chapter(6,getFrame(6,mode)).target,'habitat');
  }
});
