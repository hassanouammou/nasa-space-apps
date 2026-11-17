export const science = {
  brief: {
    name:'Space Apps · Junior Astronaut Mission Trainer',
    url:'https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/',
    purpose:'The challenge for ages 7–12 asks players to manage an outpost and experience the consequences of their decisions.',
  },
  crew: {
    name:'NASA · Life Support Baseline Values and Assumptions',
    url:'https://ntrs.nasa.gov/citations/20210024855',
    purpose:'Figure 3-4 gives 0.895 kg oxygen and 0.800 kg food solids per crewmember per day for its reference astronaut. The early planetary base water table gives 2.50 kg for total human water consumption at an early planetary base. Those values are multiplied by two to calculate this crew’s basic daily demand.',
    oxygen:0.895, water:2.5, food:0.800,
  },
  water: {
    name:'NASA · Space station water recovery',
    url:'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
    purpose:'NASA reported 98% water recovery on the ISS. The game applies this benchmark to the water processed by its simulated recycler. The input tank and machine capacity are game settings.',
    efficiency:.98,
  },
  plants: {
    name:'NASA · Growing plants in space',
    url:'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/',
    purpose:'NASA’s crop chambers use LED lights and deliver water to roots. This links greenhouse output to both power and water. Crop timing and yield are accelerated for play.',
  },
  osdr: {
    name:'NASA OSDR · Veggie lettuce study (OSD-267)',
    url:'https://osdr.nasa.gov/bio/repo/data/studies/OSD-267',
    purpose:'The experiment compared Outredgeous red romaine grown on the ISS with lettuce grown on Earth. The outpost grows the same variety. A training harvest adds an accelerated, simplified food equivalent.',
    crop:'Outredgeous red romaine',
  },
  radlab: {
    name:'NASA OSDR RadLab · Artemis I radiation archive',
    url:'https://visualization.osdr.nasa.gov/radlab/gui/overview/',
    purpose:'RadLab hosts radiation readings from the uncrewed Artemis I mission. The published analysis measured peak absorbed dose rates of 287 μGy/min in Orion’s crew cabin and 134 μGy/min at its storm shelter during an inner-belt pass. Their ratio tunes the fictional shelter points in this game. These measurements were made in Orion, and do not describe dose on the Moon.',
    analysis:'https://doi.org/10.1038/s41586-024-07927-7',
    cabinRate:287, shelterRate:134,
  },
  pole: {
    name:'NASA · Lunar South Pole environment',
    url:'https://www.nasa.gov/reference/moonbase-environment/',
    purpose:'The Sun stays low at the lunar south pole, so local terrain can block it. This inspires the shadow window in the game. The shift schedule and solar power outputs are fictional.',
  },
  radio: {
    name:'NASA · Artemis communication delay estimates',
    url:'https://ntrs.nasa.gov/api/citations/20250003885/downloads/NASA%20TM20250003885.pdf',
    purpose:'Table 1 estimates nominal Orion command latency at 2.7 seconds one way. The training radio uses 5.4 seconds round trip, excluding processing time. The radio’s electricity cost is a game setting.',
    oneWay:2.7,
  },
  exposure: {
    name:'NASA · Space Radiation Analysis Group',
    url:'https://srag.jsc.nasa.gov/spaceradiation/how/how.cfm',
    purpose:'Location, space weather and protective material all influence astronaut exposure. The training exposure point system is fictional.',
  },
};

export const solarEvents = [
  {id:'2024-05-11T04:07:00-SEP-001',date:'11 May 2024, 04:07 UTC',instrument:'STEREO-A / IMPACT',url:'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/1'},
  {id:'2024-05-10T14:50:00-SEP-001',date:'10 May 2024, 14:50 UTC',instrument:'STEREO-A / IMPACT',url:'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/SEP/30684/1'},
] as const;
