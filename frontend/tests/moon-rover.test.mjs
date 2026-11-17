import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {walkable} from '../src/moon/navigation.ts';
import {gridElevation} from '../src/moon/terrain.ts';
import {measureTerrain, patrolFrame, roverAnswer, roverBrief, roverCycle, roverStops} from '../src/moon/roverTelemetry.ts';

test('the autonomous patrol moves over open terrain, stops to scan, and transmits before proceeding', () => {
  assert.equal(patrolFrame(1).phase,'Driving');
  assert.equal(patrolFrame(4).phase,'Scanning');
  assert.equal(patrolFrame(5).phase,'Transmitting');
  assert.equal(patrolFrame(5).z,roverStops[0].z);
  assert.deepEqual(patrolFrame(roverCycle).stop,roverStops[1]);
  for(let time=0;time<(roverStops.length+1)*roverCycle;time+=.125){
    const {x,z}=patrolFrame(time);
    assert.ok(walkable(x,z),`Rover path overlaps an obstacle at ${x}, ${z}`);
  }
});

test('survey calculates slope in degrees and takes elevation from the archived grid', () => {
  const stop=roverStops[0];
  const analytic=measureTerrain(1,1,4,stop,x=>x/2,null);
  assert.equal(analytic.elevation,stop.x/2);
  assert.ok(Math.abs(analytic.slope-Math.atan(.5)*180/Math.PI)<1e-9);
  const archive=JSON.parse(readFileSync(new URL('../public/moon/shackleton-elevation.json',import.meta.url),'utf8'));
  const readings=roverStops.map((point,index)=>measureTerrain(index+1,1,4,point,(x,z)=>gridElevation(archive,x,z),archive.dataset));
  assert.ok(readings.every(reading=>Number.isFinite(reading.elevation)&&Number.isFinite(reading.slope)&&reading.source===archive.dataset));
  assert.ok(new Set(readings.map(reading=>reading.slope.toFixed(1))).size>1);
});

test('the analyst changes its briefing when new packets arrive and distinguishes data sources', () => {
  const first=measureTerrain(1,1,4,roverStops[0],x=>x/2,'NAC_DTM_ESALL_SR12');
  const second=measureTerrain(2,1,10,roverStops[1],x=>x/4,'NAC_DTM_ESALL_SR12');
  assert.match(roverBrief([]),/waiting/);
  assert.match(roverBrief([first]),/Packet 1 received/);
  assert.match(roverBrief([first,second]),/gentler than/);
  assert.match(roverAnswer('Which site is gentler?',[first]),/need a second survey stop/);
  assert.match(roverAnswer('Which site is gentler?',[first,second]),/Western rise had the gentlest/);
  assert.match(roverAnswer('Where is the NASA data?',[first]),/NAC_DTM_ESALL_SR12/);
  assert.match(roverAnswer('Where is the data source?',[{...first,source:null}]),/simulated/);
});
