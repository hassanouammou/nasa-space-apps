import type { Frame } from '../outpost/model';
import {artifactStations} from './artifacts.ts';
import type {ArtifactId} from './artifacts.ts';

export const stations = {
  habitat: {name:'Habitat',x:0,z:-15,stopX:0,stopZ:-8, lift:5.2},
  air: {name:'Life support',x:-17,z:-7,stopX:-11,stopZ:-6,lift:4.4},
  plants: {name:'Greenhouse',x:18,z:-9,stopX:12,stopZ:-7,lift:4.9},
  power: {name:'Solar array',x:-26,z:13,stopX:-16,stopZ:13,lift:4.5},
  shelter: {name:'Storm shelter',x:20,z:13,stopX:13,stopZ:12,lift:4.4},
  ...artifactStations,
  lab: {name:'Science lab',x:0,z:-32,stopX:0,stopZ:-25,lift:6.2},
} as const;
export type Station=keyof typeof stations;
export const stationIds=Object.keys(stations) as Station[];

export type BaseStation=Exclude<Station,ArtifactId>;

export const stationStory:Record<BaseStation,{title:string; lesson:string}> = {
  habitat:{title:'Keep the base alive',lesson:'The habitat is our home. Here you can plan what the crew does, check tomorrow’s supplies, or radio Earth. A reply takes time, so the crew sometimes has to act first.'},
  air:{title:'Water becomes air',lesson:'Follow the blue pipe. The recycler gives us clean water. The oxygen maker splits water so we can breathe. Both use electricity, and the same tank also supplies the crew and the crops.'},
  plants:{title:'A garden on the Moon',lesson:'NASA grew this red romaine lettuce in space. Our greenhouse gives it light and water. If you save power by dimming the lights today, the next harvest takes longer.'},
  power:{title:'The shadow line',lesson:'The Sun stays low at the lunar south pole. A ridge can put solar panels in shadow. Use the power you saved in the battery to keep the most important systems running.'},
  shelter:{title:'Shelter from the Sun',lesson:'Some solar events send high-energy particles into space. Thicker material shields the crew, but staying in the shelter uses power and means postponing the outside survey.'},
  lab:{title:'From Apollo to our outpost',lesson:'This is a 3D reconstruction of the Apollo Lunar Module. Apollo 11’s Eagle carried people to the surface and its lower stage stayed at Tranquility Base. Our outpost is near Shackleton. Future crews will need to live on the Moon for longer than an Apollo visit.'},
};

export function chapter(day:number,frame:Frame):{title:string;line:string;target:BaseStation} {
  if(frame.storm) return {title:'Particles from the Sun',target:'shelter',line:'Cadet, Earth has detected fast particles from the Sun. Meet me at the storm shelter. Look at how the two readings from Artemis I change with shielding.'};
  if(frame.sun===2) return {title:'When the lights go out',target:'power',line:'The ridge is shading our solar panels. Come see what the array makes in shadow, then decide where to spend the battery reserve.'};
  return [
    {title:'First steps',target:'air',line:'Welcome to Shackleton, Cadet. Our crew has six days on the Moon. Follow the beacon to life support and see where the air in our habitat comes from.'},
    {title:'The first seeds',target:'plants',line:'We can only carry so many meals from Earth. Visit the greenhouse. Give the lettuce light and water, and check how that changes our reserves.'},
    {title:'A plan for the crew',target:'habitat',line:'We have air and a place to sleep. Check the command terminal so we can plan the next shift.'},
    {title:'The first seeds',target:'plants',line:'Visit the greenhouse. Give the lettuce light and water, and check how that changes our reserves.'},
    {title:'What Apollo left behind',target:'lab',line:'Visit the science lab. The Apollo model shows how the first explorers left the Moon. On your way, look for heritage replicas and scan them to unlock the original photos.'},
    {title:'The last shift',target:'habitat',line:'Return to the habitat. We need two field reports, a harvest and enough supplies to finish safely.'},
  ][Math.min(5,Math.max(0,day-1))] as {title:string;line:string;target:BaseStation};
}
