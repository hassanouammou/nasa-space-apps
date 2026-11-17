export const artifactStations = {
  surveyor: {name:'Surveyor 3',x:-29,z:-21,stopX:-25,stopZ:-19,lift:3.4},
  lunokhod: {name:'Lunokhod 2',x:29,z:-23,stopX:25,stopZ:-21,lift:3.4},
  apolloRover: {name:'Apollo 17 rover',x:-11,z:-32,stopX:-9,stopZ:-28,lift:3.5},
} as const;
export type ArtifactId=keyof typeof artifactStations;
export const artifactIds=Object.keys(artifactStations) as ArtifactId[];
export const isArtifact=(id:string):id is ArtifactId=>Object.hasOwn(artifactStations,id);

type Artifact={
  year:number;origin:string;location:string;description:string;photo:string;alt:string;credit:string;
  imageSource:string;dataSource:string;dataLabel:string;footnote:string;
  measures:readonly {label:string;value:number;decimals:number;unit:string}[];
};

export const artifacts:Record<ArtifactId,Artifact> = {
  surveyor:{
    year:1967,origin:'NASA robotic lander',location:'Ocean of Storms · Surveyor crater',
    description:'This robot used a scoop to test whether lunar soil could support a crewed lander. When Apollo 12 visited in 1969, its astronauts removed the TV camera and brought it home for study. The training model shows the robot before that visit.',
    photo:'/moon/heritage/surveyor.webp',alt:'NASA photograph of Surveyor 3 on the side of its lunar crater during Apollo 12',
    credit:'NASA / Johnson Space Center · 20 November 1969',
    imageSource:'https://science.nasa.gov/resource/view-of-surveyor-iii-in-its-crater/',
    dataSource:'https://ntrs.nasa.gov/api/citations/19920002733/downloads/19920002733.pdf',
    dataLabel:'Play the camera count',footnote:'The animation counts the total reported by NASA for the mission.',
    measures:[{label:'Pictures transmitted',value:6326,decimals:0,unit:'photos'}],
  },
  lunokhod:{
    year:1973,origin:'Soviet robotic rover',location:'Le Monnier crater · 25.830° N, 30.914° E',
    description:'Controllers on Earth drove this eight-wheeled rover across the Moon. Its instruments studied the surface, and its wheels left tracks that NASA’s Lunar Reconnaissance Orbiter photographed decades later. Look for its open lid in the image inset.',
    photo:'/moon/heritage/lunokhod.webp',alt:'NASA Lunar Reconnaissance Orbiter image showing the parked Lunokhod 2 rover and tracks, with a labeled inset',
    credit:'NASA / GSFC / Arizona State University · LROC M175070494',
    imageSource:'https://lroc.im-ldi.com/images/699?language=english',
    dataSource:'https://lroc.im-ldi.com/featured_sites/lunokhod-2/zoomable-traverse',
    dataLabel:'Play the rover odometer',footnote:'The odometer shows the LROC traverse total. The animation compresses the journey.',
    measures:[{label:'Total lunar traverse',value:39,decimals:0,unit:'km'}],
  },
  apolloRover:{
    year:1972,origin:'NASA crew-driven rover',location:'Taurus–Littrow Valley · Apollo 17',
    description:'Gene Cernan and Harrison Schmitt used this electric rover to reach widely separated science stops. The crew brought lunar samples back to Earth. The rover stayed on the Moon at its final parking spot.',
    photo:'/moon/heritage/apollo17.webp',alt:'NASA photograph of astronaut Gene Cernan driving the Apollo 17 Lunar Roving Vehicle',
    credit:'NASA / Harrison Schmitt · 11 December 1972',
    imageSource:'https://science.nasa.gov/resource/apollo-17-gene-cernan-in-lunar-roving-vehicle/',
    dataSource:'https://www.nasa.gov/missions/apollo/apollo-17-mission-details/',
    dataLabel:'Play the mission totals',footnote:'The sample total is for the entire Apollo 17 mission.',
    measures:[{label:'Rover distance',value:30.5,decimals:1,unit:'km'},{label:'Samples returned by the crew',value:110.4,decimals:1,unit:'kg'}],
  },
};
