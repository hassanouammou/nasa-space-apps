import {science,solarEvents} from '../outpost/science.ts';
import {terrainSource} from '../moon/roverTelemetry.ts';
import {cometMessage} from './conversation.ts';
import type {CometLanguage} from './conversation.ts';

export type Evidence = {name:string;record:string;url:string};
export type Reading = {label:string;value:number;unit:string;digits?:number};
export type Answer = {
  text:string;
  evidence:Evidence[];
  readings?:Reading[];
  classification?:'NASA measurement'|'NASA planning estimate'|'Calculated from NASA values'|'NASA archive';
  topic?:Topic;
};

const sources={
  crew:{name:'NASA Technical Reports Server',record:'Life Support Baseline Values · 20210024855',url:science.crew.url},
  water:{name:'NASA · International Space Station',record:'Water Recovery Milestone · June 2023',url:'https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/'},
  veggie:{name:'NASA Open Science Data Repository',record:'Veggie lettuce study · OSD-267',url:science.osdr.url},
  pole:{name:'NASA · Moonbase Environment',record:'Lighting and terrain at the lunar south pole',url:science.pole.url},
  orion:{name:'NASA · Artemis I',record:'Radiation measurements inside Orion',url:'https://www.nasa.gov/missions/artemis/artemis-1/artemis-i-radiation-measurements-validate-orion-safety-for-astronauts/'},
  radiation:{name:'NASA-led Artemis I radiation study',record:'Published measurements · Figure 3',url:science.radlab.analysis},
  radio:{name:'NASA Technical Reports Server',record:'Artemis communications · Table 1',url:science.radio.url},
  donki:{name:'NASA Goddard · Space Weather DONKI',record:'Space weather observations and notifications',url:'https://ccmc.gsfc.nasa.gov/tools/DONKI/'},
  terrain:{name:'NASA LROC instrument archive',record:'Shackleton Crater Rim · NAC_DTM_ESALL_SR12',url:terrainSource},
  moon:{name:'NASA Science · Moon Facts',record:'Size, distance, gravity and water ice',url:'https://science.nasa.gov/moon/facts/'},
  moonwalk:{name:'NASA · Moon lithograph',record:'History of lunar exploration',url:'https://science.nasa.gov/wp-content/uploads/2024/01/62217main-moon-lithograph.pdf'},
  apollo11:{name:'NASA · Apollo Lunar Surface Journal',record:'Apollo 11 mission overview',url:'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html'},
  samples:{name:'NASA · Apollo Mission Sample Collection',record:'Moon to Mars Architecture Update · page 24',url:'https://www.nasa.gov/wp-content/uploads/2023/10/20220613-nac-heo-sci-cmte-koerner-chavers-moon-to-mars-architecture-update.pdf#page=24'},
  apollo17:{name:'NASA · Apollo by the Numbers',record:'Apollo 17 flight and lunar surface summary',url:'https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_17a_Summary.htm'},
} satisfies Record<string,Evidence>;

function measurement(text:string,evidence:Evidence[],readings:Reading[],classification:Answer['classification']='NASA measurement'):Answer {
  return {text,evidence,readings,classification};
}
const readable=(value:number,digits=3)=>value.toLocaleString('en-US',{maximumFractionDigits:digits});

function consumable(question:string,key:'oxygen'|'water'|'food',language:CometLanguage='en'):Answer {
  const french=language==='fr';
  const words:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twelve:12,un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,sept:7,huit:8,neuf:9,dix:10,douze:12};
  const count=(word:string|undefined,fallback:number)=>word?words[word]??Number(word):fallback;
  const astronauts=french?question.match(/\b(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze)\s+(?:astronautes?|personnes?)\b/):question.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(?:astronauts?|crew(?:\s+members?)?|people|person)\b/);
  const days=french?question.match(/\b(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze)\s+jours?\b/):question.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+days?\b/);
  const crew=count(astronauts?.[1],1), duration=count(days?.[1],1);
  if(crew<1||duration<1||crew>1000||duration>1000||/\d+[.,]\d+\s+(?:days?|astronaut\w*|people|jours?|personnes?)/.test(question)||/\b(?:hours?|weeks?|months?|years?|heures?|semaines?|mois|ans?|annees?)\b/.test(question)) {
    return {text:french?'Donne-moi un nombre entier d’astronautes et de jours. Par exemple « oxygène pour deux astronautes pendant six jours ».':'I can calculate this for whole numbers of crew members and days. Try “oxygen for two astronauts for six days.”',evidence:[]};
  }
  const rate=science.crew[key];
  if(french){
    const format=(value:number)=>value.toLocaleString('fr-FR',{maximumFractionDigits:3});
    const noun={oxygen:'d’oxygène',water:'d’eau au total dans une première base',food:'d’aliments secs'}[key];
    const base=`Pour ses calculs, la NASA prend comme référence ${format(rate)} kg ${noun} par personne et par jour.`;
    const expanded=crew!==1||duration!==1;
    const total=rate*crew*duration;
    return measurement(
      expanded?`${base} Pour ${crew} ${crew===1?'personne':'personnes'} pendant ${duration} ${duration===1?'jour':'jours'}, cela donne **${format(total)} kg** (${format(rate)} × ${crew} × ${duration}).`:`${base} Les besoins réels peuvent varier.`,
      [sources.crew],[{label:expanded?'Total calculé':'Par personne et par jour',value:total,unit:'kg',digits:3}],
      expanded?'Calculated from NASA values':'NASA planning estimate',
    );
  }
  const noun={oxygen:'oxygen',water:'total human water consumption at an early planetary base',food:'dry food solids'}[key];
  const base=`NASA’s planning reference uses ${rate.toFixed(key==='oxygen'?3:2)} kg of ${noun} per person per day.`;
  const total=readable(rate*crew*duration);
  const expanded=crew!==1||duration!==1;
  return measurement(
    expanded?`${base} For ${crew} ${crew===1?'astronaut':'astronauts'} over ${duration} ${duration===1?'day':'days'}, that’s **${total} kg**. Calculation: ${readable(rate)} × ${crew} × ${duration}.`:`${base} Actual needs can vary.`,
    [sources.crew],[{label:expanded?'Calculated total':'Per person per day',value:rate*crew*duration,unit:'kg',digits:3}],
    expanded?'Calculated from NASA values':'NASA planning estimate',
  );
}
const stories={
  shielding:()=>measurement('Inside Orion during one pass through Earth’s inner radiation belt, the peak rate was **287 μGy/min** in the cabin and **134 μGy/min** at the shelter. That’s about **53% lower** at the shelter location. μGy/min measures how fast energy from radiation is absorbed.',[sources.orion,sources.radiation],[
    {label:'Crew cabin',value:science.radlab.cabinRate,unit:'μGy/min'},
    {label:'Storm shelter',value:science.radlab.shelterRate,unit:'μGy/min'},
  ]),
  orionSensors:()=>measurement('During Artemis I, **34 active detectors** and **5,600 passive sensors** measured radiation inside Orion. Active detectors can send readings during a mission. Passive sensors store a record to check later.',[sources.orion],[
    {label:'Active detectors',value:34,unit:''},{label:'Passive sensors',value:5600,unit:''},
  ]),
  radio:()=>measurement('NASA estimated **2.7 seconds** one way for a nominal Artemis command link. An immediate echo over the same link would take **5.4 seconds** there and back. That estimate is for a command link, and an actual conversation can take longer.',[sources.radio],[
    {label:'One way',value:science.radio.oneWay,unit:'s'},{label:'There and back',value:science.radio.oneWay*2,unit:'s'},
  ],'NASA planning estimate'),
  oxygen:(q:string)=>consumable(q,'oxygen'),
  water:(q:string)=>consumable(q,'water'),
  food:(q:string)=>consumable(q,'food'),
  recycling:()=>measurement('NASA reported that the International Space Station demonstrated **98% water recovery**. Think of 100 equal parts of water going through the recovery system: about 98 are recovered.',[sources.water],[{label:'Water recovered',value:98,unit:'%'}]),
  plants:()=>({text:'Yes! NASA’s Veggie experiment grew **Outredgeous red romaine lettuce** on the International Space Station. Researchers compared it with lettuce grown on Earth and looked at nutrition and microbes.',evidence:[sources.veggie]}),
  sunlight:()=>({text:'Near the lunar south pole, the Sun stays low over the horizon. A crater rim or ridge can block sunlight and put a solar panel in shadow. That’s a reason to plan where to put your panels and how to store energy.',evidence:[sources.pole]}),
  storm:(q:string)=>{
    if(/\b(now|today|current(?:ly)?|latest|live|this week)\b/.test(q))
      return {text:'I use archived event records here. For current space-weather observations, open NASA’s DONKI system.',evidence:[sources.donki]};
    const item=/\b(?:10 may|may 10|2024-05-10)\b/.test(q)?solarEvents[1]:solarEvents[0];
    return {text:`NASA’s DONKI archive records a solar energetic particle event on **${item.date}**. Its record lists ${item.instrument}, an instrument that detects energetic particles. An archived event can help crews practise how to respond to an alert.`,
      evidence:[{name:sources.donki.name,record:item.id,url:item.url}],classification:'NASA archive' as const};
  },
  terrain:()=>measurement('NASA’s Lunar Reconnaissance Orbiter Camera team published an elevation map for the Shackleton crater rim. This grid has a scale of **2 metres per pixel**. Each pixel provides an elevation sample you can use to estimate how steep the ground is.',[sources.terrain],[
    {label:'Terrain grid scale',value:2,unit:'m/pixel'},
  ],'NASA archive'),
  distance:()=>measurement('The Moon is **384,400 km** from Earth on average. The distance changes as the Moon follows its orbit.',[sources.moon],[{label:'Mean Earth–Moon distance',value:384400,unit:'km'}]),
  gravity:()=>measurement('The Moon’s gravity at the surface is about **one-sixth** of Earth’s. That’s why an astronaut can make longer, slower hops there.',[sources.moon],[{label:'Earth',value:100,unit:'%'},{label:'Moon · approximately',value:17,unit:'%'}]),
  ice:()=>({text:'NASA has found evidence of **water ice** on the Moon. The highest concentrations occur in dark craters near the poles. Solar panels can go in sunlit areas while science teams look for ice in shadow.',evidence:[sources.moon,sources.pole]}),
  walkers:()=>measurement('**12 Apollo astronauts** walked on the Moon. The astronauts brought back lunar rock and soil so scientists could study it on Earth.',[sources.moonwalk],[{label:'People who walked on the Moon during Apollo',value:12,unit:''}],'NASA archive'),
  landings:()=>measurement('**Six Apollo missions** landed astronauts on the Moon: Apollo 11, 12, 14, 15, 16, and 17.',[sources.samples],[{label:'Crewed Apollo landings',value:6,unit:''}],'NASA archive'),
  apolloSamples:(q:string)=>{
    const mission=q.match(/apollo\s*(11|12|14|15|16|17)\b/)?.[1];
    const counts:Record<string,number>={11:58,12:69,14:227,15:370,16:731,17:741};
    const amount=mission?counts[mission]:2196;
    const subject=mission?'Apollo '+mission:'The six Apollo landing missions';
    return measurement(`${subject} returned **${readable(amount)} lunar samples** according to NASA’s collection table. That count includes rock and soil samples.`,[sources.samples],[{label:'Samples returned',value:amount,unit:''}],'NASA archive');
  },
  apollo11:()=>measurement('Apollo 11 made the first crewed Moon landing in **July 1969**. Neil Armstrong and Buzz Aldrin walked on the surface. Michael Collins stayed in lunar orbit. NASA’s surface journal records **20 kg** of material collected.',[sources.apollo11],[{label:'Surface crew',value:2,unit:''},{label:'Material collected',value:20,unit:'kg'}],'NASA archive'),
  apollo17:()=>measurement('Apollo 17 explored Taurus–Littrow Valley. NASA’s mission chronology gives **110.52 kg** of samples collected and **35.7 km** driven in the Lunar Roving Vehicle.',[sources.apollo17],[{label:'Samples collected',value:110.52,unit:'kg'},{label:'Rover distance',value:35.7,unit:'km'}],'NASA archive'),
} satisfies Record<string,(question:string)=>Answer>;
export type Topic=keyof typeof stories;

const matchers:[Topic,RegExp][]=[
  ['apolloSamples',/\b(?:how many|number of|count)\b.*\b(samples?|rocks?)\b.*\bapollo\b|\bapollo\b.*\b(?:how many|number of|count)\b.*\b(samples?|rocks?)\b|\bhow many\b.*\b(lunar|moon) (samples?|rocks?)\b/],
  ['landings',/\b(how many|number of)\b.*\b(apollo|missions?|landings?)\b.*\b(land\w*|missions?|landings?)\b/],
  ['apollo11',/\b(apollo\s*11|eagle|first (moon|lunar) (landing|walk)|neil armstrong|buzz aldrin)\b/],
  ['apollo17',/\b(apollo\s*17|taurus.littrow|harrison schmitt|gene cernan)\b/],
  ['orionSensors',/\b(sensors?|dosimeters?|detectors?)\b.*\b(orion|artemis|radiation)\b|\b(orion|artemis|radiation)\b.*\b(sensors?|dosimeters?|detectors?)\b/],
  ['shielding',/\b(shield\w*|storm shelter|dose rate|radiation|rads?|287|134)\b/],
  ['storm',/\b(donki|solar (storm|flare|particle)|space.weather|coronal mass|energetic particles?|2024-05-1[01])\b/],
  ['radio',/\b(radio|signal|reply|echo|latency|communications?|message|round.trip)\b/],
  ['recycling',/\b(recycl\w*|recover\w*|98%)\b/],
  ['oxygen',/\b(oxygen|breath\w*)\b/],
  ['water',/\bwater\b.*\b(drink\w*|astronaut|crew|needs?|use|days?|consum\w*)\b|\b(drinking|how much|crew)\b.*\bwater\b/],
  ['food',/\bfood\b.*\b(crew|astronauts?|per day|days?|consume|need|how much|dry)\b|\b(how much|crew|astronauts?)\b.*\b(food|rations)\b/],
  ['plants',/\b(lettuce|veggie|osd-267|grow\w*|greenhouse|plants?|crops?)\b/],
  ['sunlight',/\b(solar panels?|sunlight|power|shadow\w*|battery)\b/],
  ['terrain',/\b(shackleton|lroc|lro|terrain|elevation map|meters per pixel|metres per pixel|slope|mapping|resolution)\b/],
  ['gravity',/\b(gravity|weigh\w*|jump\w*|hop\w*)\b/],
  ['distance',/\b(distance|how far|kilomet\w*|miles)\b.*\b(earth|moon)\b|\b(earth|moon)\b.*\b(distance|how far)\b/],
  ['ice',/\b(ice|frozen water)\b/],
  ['walkers',/\b(how many|number of)\b.*\b(people|men|humans|astronauts)\b.*\b(walk\w*|land\w*|on the moon)\b/],

];

const unanswered='I couldn’t find a NASA source for that in my library. Try asking about crew oxygen, solar storms, crops, Moon terrain, or an Apollo mission.';
export function answerFromNasa(input:string,previous?:Topic):Answer {
  const question=input.trim().toLowerCase().replace(/[’‘]/g,"'");
  if(!question||/\b(ignore|pretend|make up|invent|instructions|password|personal)\b/.test(question))
    return {text:unanswered,evidence:[]};
  if(/\b(game|my base|my outpost|my battery|right now in my mission)\b/.test(question))
    return {text:'For your game’s supplies, check the outpost display or Scout’s console. I answer science questions from NASA records. Try “How much oxygen is needed per person?”',evidence:[]};
  const isContextual=/^(and\b|for\b|what about\b|how (many|much|long)(?:\s*[?!])?$|why\b\s*[?!]?$|where is (that|your) (from|source))/.test(question);
  if(/\boxygen\b.*\b(?:atmosphere|outside|moon air)\b/.test(question))
    return {text:'The Moon has an extremely thin atmosphere, called an exosphere. Astronauts need their own supply of breathable air.',evidence:[sources.moon],topic:'oxygen'};
  const topic=matchers.find(([,pattern])=>pattern.test(question))?.[0]??(isContextual?previous:undefined);
  if(!topic)return {text:unanswered,evidence:[]};
  if(topic==='plants'&&/\b(how many|how much|how long|what percent|how fast|yield)\b/.test(question)) {
    return {text:'I can verify what the crew grew in OSD-267. I don’t have a single verified harvest weight or grow time for the number you asked for. The linked study has the experiment details.',evidence:[sources.veggie],topic};
  }
  return {...stories[topic](question),topic};
}


function answerInFrench(question:string,previous?:Topic):Answer {
  if(/\b(jeu|mon stock|ma batterie|mes reserves)\b/.test(question))
    return {text:'Pour tes réserves dans le jeu, regarde le tableau de la base. Je peux t’expliquer les données NASA derrière le jeu.',evidence:[]};
  const followUp=/^(et (?:pour|si)|pour \d|combien\s*[?!]*$)/.test(question);
  const supply=question.match(/\b(oxygene|eau|nourriture|aliments? secs?)\b/)?.[1];
  const lookup=(topic:Topic,text:string):Answer=>({text,evidence:(stories[topic] as (input:string)=>Answer)(topic==='storm'&&/\b(maintenant|aujourd'hui|actuell\w*)\b/.test(question)?'current':question).evidence,topic});
  if(/\b(recycl\w*|recuper\w*)\b.*\beau\b|\beau\b.*\b(recycl\w*|recuper\w*)\b/.test(question))
    return lookup('recycling','La Station spatiale internationale a réussi à récupérer **98 % de son eau**, selon la NASA. Sur 100 parts d’eau, environ 98 pouvaient être réutilisées.');
  if(/\b(glace|eau gelee)\b/.test(question))
    return lookup('ice','Oui. La NASA a trouvé de la glace sur la Lune, surtout dans des cratères sombres près des pôles.');
  if(supply&&/\b(combien|besoin|quantite|astronautes?|equipage|jours?)\b/.test(question))
    return {...consumable(question,supply==='eau'?'water':supply==='oxygene'?'oxygen':'food','fr'),topic:supply==='eau'?'water':supply==='oxygene'?'oxygen':'food'};
  if(followUp&&(previous==='oxygen'||previous==='water'||previous==='food'))
    return {...consumable(question,previous,'fr'),topic:previous};
  if(/\b(proteg\w*|abri|radiations?|rayonnement)\b/.test(question))
    return lookup('shielding','Pendant Artemis I, la NASA a mesuré moins de rayonnement dans l’abri du vaisseau Orion que dans la cabine. Lors du passage comparé, le niveau dans l’abri était environ **53 % plus bas**.');
  if(/\b(tempete solaire|donki|meteo spatiale)\b/.test(question))
    return lookup('storm',/\b(maintenant|aujourd'hui|actuell\w*)\b/.test(question)
      ?'Je consulte des archives. Pour la météo spatiale du jour, ouvre le site DONKI de la NASA.'
      :'La NASA garde une trace des tempêtes solaires dans son archive DONKI. Le jeu s’appuie sur un événement passé pour te faire essayer une décision.');
  if(/\b(gravit[eé]|pesanteur|saut\w*)\b/.test(question))
    return lookup('gravity','Sur la Lune, la gravité est environ **six fois plus faible** que sur Terre. C’est pour cela que tu peux y faire des bonds plus longs.');
  if(/\b(distance|loin|kilometres)\b/.test(question)&&/\b(lune|terre)\b/.test(question))
    return lookup('distance','La Lune est à environ **384 400 km** de la Terre en moyenne. La distance change au fil de son trajet autour de la Terre.');
  if(/\b(laitue|salade|legumes?|plantes?|serre|veggie)\b/.test(question))
    return lookup('plants','La NASA a fait pousser de la **laitue romaine rouge** dans la Station spatiale internationale. Les chercheurs l’ont comparée à de la laitue cultivée sur Terre.');
  if(/\b(apollo\s*17|taurus.littrow)\b/.test(question)){
    if(/\bcombien\b.*\b(echantillons?|roches?)\b/.test(question))
      return lookup('apolloSamples','Apollo 17 a rapporté **741 échantillons** de roche et de sol lunaires, selon le tableau de la NASA.');
    return lookup('apollo17','Apollo 17 a exploré la vallée de Taurus–Littrow et a rapporté environ **110,5 kg** de roches et de sol lunaires.');
  }
  if(/\bcombien\b.*\b(astronautes?|personnes?|gens)\b.*\b(marche|lune)\b/.test(question))
    return lookup('walkers','**12 astronautes** ont marché sur la Lune pendant les missions Apollo.');
  return {text:'Je n’ai pas trouvé de réponse à cette question dans mes sources NASA. Essaie une question sur la Lune, l’oxygène ou les tempêtes solaires.',evidence:[]};
}

export function answerFromComet(input:string,previous?:Topic,previousLanguage:CometLanguage='en'):Answer&{language:CometLanguage} {
  const {language,question,reply}=cometMessage(input,previousLanguage);
  if(reply)return {text:reply,evidence:[],language};
  const answer=language==='fr'?answerInFrench(question,previous):answerFromNasa(question,previous);
  return {...answer,language};
}
