export const roverStops = [
  {name:'Habitat apron', x:-2, z:2},
  {name:'Western rise', x:-10, z:-4},
  {name:'Relay approach', x:3, z:-6},
  {name:'Eastern slope', x:10, z:3},
  {name:'Open flats', x:4, z:9},
] as const;

export const terrainSource = 'https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12';
export const roverCycle = 6;
export const scanStarts = 3.25;
export const transmissionStarts = 4.45;
export type RoverPhase = 'Driving'|'Scanning'|'Transmitting'|'Delivered';
export type RoverReading = {
  id:number;
  site:string;
  day:number;
  seconds:number;
  elevation:number;
  slope:number;
  source:string|null;
};
type Height = (x:number,z:number)=>number;

export function patrolFrame(seconds:number) {
  const leg = Math.floor(seconds/roverCycle);
  const into = seconds%roverCycle;
  const stop = roverStops[leg%roverStops.length];
  const from = leg===0 ? {x:-2,z:7} : roverStops[(leg-1)%roverStops.length];
  const fraction = Math.min(1,into/scanStarts);
  const progress = fraction*fraction*(3-2*fraction);
  const phase:RoverPhase = into<scanStarts ? 'Driving' : into<transmissionStarts ? 'Scanning' : 'Transmitting';
  return {leg,into,phase,stop,distance:Math.hypot(stop.x-from.x,stop.z-from.z)*progress,
    x:from.x+(stop.x-from.x)*progress,z:from.z+(stop.z-from.z)*progress,
    bearing:Math.atan2(stop.x-from.x,stop.z-from.z)};
}

export function measureTerrain(id:number, day:number, seconds:number, stop:typeof roverStops[number], height:Height, source:string|null):RoverReading {
  // Central differences use points one original LROC pixel (2 m) on either side.
  const dx=(height(stop.x+2,stop.z)-height(stop.x-2,stop.z))/4;
  const dz=(height(stop.x,stop.z+2)-height(stop.x,stop.z-2))/4;
  return {id,day,seconds,site:stop.name,elevation:height(stop.x,stop.z),slope:Math.atan(Math.hypot(dx,dz))*180/Math.PI,source};
}

export function roverBrief(readings:readonly RoverReading[]) {
  const latest=readings.at(-1);
  const previous=readings.at(-2);
  if(!latest)return 'I’m waiting for the first packet. The rover will stop, scan the ground, and send the reading back here.';
  if(!previous)return `Packet ${latest.id} received from ${latest.site}. The ground slope is ${latest.slope.toFixed(1)}°. I need one more stop to compare terrain.`;
  const change=latest.slope-previous.slope;
  const trend=Math.abs(change)<.15?'about the same as':change>0?`${change.toFixed(1)}° steeper than`:`${(-change).toFixed(1)}° gentler than`;
  return `At ${latest.site}, the ground slopes ${latest.slope.toFixed(1)}°. That’s ${trend} the previous stop at ${previous.site}.`;
}

export function roverAnswer(question:string, readings:readonly RoverReading[]) {
  const latest=readings.at(-1);
  if(/nasa|source|real|lroc|simulat/i.test(question)){
    return latest?.source
      ? `The rover is fictional. I calculate elevation and slope from the archived LROC Shackleton terrain grid (${latest.source}) at the rover’s actual stop positions in the game. The packets are generated in this session.`
      : 'The rover is a training model. When the Shackleton LROC terrain grid loads, I use it to calculate the readings. If it is unavailable, I label the terrain values as simulated.';
  }
  if(!latest)return roverBrief(readings);
  if(/safe|steep|gentl|flat|route|highest|lowest|best|compare|easi|risk|drive/i.test(question)){
    const sites=[...new Map(readings.map(reading=>[reading.site,reading])).values()];
    if(sites.length<2)return `I have readings from ${latest.site} only (${latest.slope.toFixed(1)}°). I’ll need a second survey stop to compare them.`;
    const high=sites.reduce((a,b)=>a.slope>=b.slope?a:b);
    const low=sites.reduce((a,b)=>a.slope<=b.slope?a:b);
    if(high.slope-low.slope<.15)return `The ${sites.length} surveyed stops have similar ground slopes. I wouldn’t choose between them based on slope alone.`;
    return `Across the ${sites.length} surveyed stops, ${low.site} had the gentlest sampled slope (${low.slope.toFixed(1)}°) and ${high.site} the steepest (${high.slope.toFixed(1)}°). I would inspect the gentler site first. This comparison uses individual stops and covers local terrain slope only.`;
  }
  if(/elevat|altitude|height|datum/i.test(question))return `The latest reading at ${latest.site} is ${latest.elevation.toFixed(2)} m relative to the ${latest.source?'terrain grid’s local reference':'simulated terrain’s reference'}. The reference is the zero used for the map.`;
  if(/slope|degree/i.test(question))return 'I compare elevations on both sides of the rover over a four-metre span in each direction. A larger angle means the ground rises more sharply near that stop.';
  if(/packet|scan|read|latest|status|happen|report|trend|what|chang/i.test(question))return roverBrief(readings);
  return 'I can analyze the rover packets. Ask me what changed, which sampled ground is gentler, how slope is calculated, or where the elevation data comes from.';
}
