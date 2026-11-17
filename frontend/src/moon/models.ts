import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {rng} from './terrain';

const matte=(color:string,metalness=.05,roughness=.7)=>new T.MeshStandardMaterial({color,metalness,roughness});
const body=matte('#e3e3dd'), dark=matte('#22282f'), edge=matte('#687580',.3), gold=matte('#ba7a36',.35), rail=matte('#1f3736'), black=matte('#0e151b');
const cyan=matte('#68f0e3'), blue=matte('#3569a8',.38), white=matte('#f8eee0',.1);
const warmLight=new T.MeshBasicMaterial({color:'#ffd59a'}), cyanLight=new T.MeshBasicMaterial({color:'#84f1f0'}), amber=new T.MeshBasicMaterial({color:'#ff8b55'});

function piece(group:T.Object3D,geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number) {
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  group.add(mesh);
  return mesh;
}
const box=(group:T.Object3D,w:number,h:number,d:number,material:T.Material,x:number,y:number,z:number)=>piece(group,new T.BoxGeometry(w,h,d),material,x,y,z);
const sphere=(group:T.Object3D,r:number,material:T.Material,x:number,y:number,z:number)=>piece(group,new T.SphereGeometry(r,16,11),material,x,y,z);
const cylinder=(group:T.Object3D,r:number,h:number,material:T.Material,x:number,y:number,z:number)=>piece(group,new T.CylinderGeometry(r,r,h,18),material,x,y,z);
const ring=(group:T.Object3D,r:number,tube:number,material:T.Material,x:number,y:number,z:number)=>piece(group,new T.TorusGeometry(r,tube,8,28),material,x,y,z);

export function habitat() {
  const group=new T.Group();
  cylinder(group,3.15,10.6,body,0,3.08,0).rotation.z=Math.PI/2;
  for(const x of [-5.27,-4.8,4.8,5.27])ring(group,3.16,.11,x===-4.8||x===4.8?gold:edge,x,3.08,0).rotation.y=Math.PI/2;
  for(const x of [-3.8,3.8])for(const z of [-2,2]){
    box(group,1.0,1.1,1.0,edge,x,.5,z);
    box(group,1.6,.17,1.5,gold,x,.15,z);
  }
  for(const x of [-3.45,-1.75,1.75,3.45]){
    box(group,1.16,.73,.36,dark,x,3.34,3.1);
    box(group,.92,.43,.07,warmLight,x,3.33,3.31);
  }
  box(group,2.6,3.0,1.0,edge,0,1.95,3.15);
  box(group,1.65,2.5,.11,dark,0,1.91,3.73);
  box(group,1.43,.09,.15,cyanLight,0,3.2,3.8);
  for(let i=0;i<5;i++)box(group,2.75,.17,.48,edge,0,.58-i*.105,3.75+i*.41);
  for(const x of [-1.32,1.32])box(group,.08,.8,2.23,gold,x,.66,4.62).rotation.x=.17;
  cylinder(group,.13,2.55,edge,-2.4,6.65,.11);
  const dish=piece(group,new T.SphereGeometry(1.16,18,12,0,Math.PI*2,0,Math.PI*.48),white,-2.4,7.8,.11);
  dish.scale.set(1,.32,1);dish.rotation.x=.80;
  box(group,2.3,.25,2.6,dark,2.7,5.91,0);
  return group;
}

export function lifeSupport() {
  const group=new T.Group();
  box(group,7.6,.38,6.8,edge,0,.19,0);
  box(group,5.75,3.2,3.5,body,.1,1.84,-1.0);
  box(group,5.9,.26,3.7,rail,.1,3.55,-1.0);
  for(const x of [-2.35,.0,2.35]){
    cylinder(group,.68,2.68,x===0?edge:body,x,1.65,1.4);
    sphere(group,.68,body,x,2.92,1.4).scale.y=.34;
    cylinder(group,.71,.18,x===0?cyan:gold,x,1.9,1.4);
    cylinder(group,.11,1.9,cyan,x,.47,2.25).rotation.x=Math.PI/2;
  }
  box(group,5.65,.18,.19,cyan,-.1,.66,2.68);
  box(group,1.1,1.35,.24,dark,.15,1.9,2.45);
  box(group,.7,.55,.05,cyanLight,.15,2.08,2.59);
  return group;
}

export function greenhouse() {
  const group=new T.Group();
  box(group,8.6,.4,7.8,edge,0,.2,0);
  const glass=new T.MeshPhysicalMaterial({color:'#82bbbb',transparent:true,opacity:.28,metalness:.1,roughness:.13,side:T.DoubleSide,depthWrite:false});
  const canopy=piece(group,new T.CylinderGeometry(3.7,3.7,7.9,32,1,true,0,Math.PI),glass,0,1.13,0);
  canopy.rotation.x=Math.PI/2;canopy.rotation.y=-Math.PI/2;
  for(const x of [-3.95,-2.65,-1.33,0,1.33,2.65,3.95]){
    const arch=piece(group,new T.TorusGeometry(3.72,.063,8,34,Math.PI),edge,x,1.15,0);
    arch.rotation.y=Math.PI/2;
  }
  for(const z of [-3.65,-2.62,0,2.62,3.65]){
    const y=1.15+Math.sqrt(Math.max(0,3.68**2-z*z));
    box(group,8,.075,.075,edge,0,y,z);
  }
  const led=new T.MeshBasicMaterial({color:'#be8dee'});
  box(group,7.8,.1,.13,led,0,3.64,0);
  const crops=new T.Group(),random=rng(28);
  for(const z of [-2.1,2.1]){
    box(group,7,.35,1.46,dark,0,.78,z);
    box(group,6.8,.05,1.3,matte('#604739'),0,.985,z);
    for(let i=0;i<11;i++)for(const lane of [-.36,.36]){
      const plant=new T.Group();plant.position.set(-3.03+i*.61,1.02,z+lane);
      const green=matte(lane>0?'#60a63f':'#477947',0,1);
      for(let j=0;j<4;j++){
        const leaf=sphere(plant,.22,green,Math.sin(j*1.75)*.1,.11+random()*.12,Math.cos(j*1.75)*.1);
        leaf.scale.set(.63,1.03,.34);leaf.rotation.z=j*.8;
      }
      crops.add(plant);
    }
  }
  group.add(crops);
  const light=new T.PointLight('#ac73f4',28,9,1.7);light.position.set(0,2.6,0);group.add(light);
  return {group,crops,led,light};
}

export function solarArray() {
  const group=new T.Group(),panels=new T.Group();
  for(const x of [-6,0,6])for(const z of [-3.7,3.7]){
    box(group,1.55,.2,1.55,edge,x,.15,z);
    cylinder(group,.18,2.95,edge,x,1.62,z);
    const row=new T.Group();row.position.set(x,3.04,z);row.rotation.x=-.58;row.rotation.y=-.12;
    box(row,5.25,.14,2.7,edge,0,0,0);
    for(let i=0;i<6;i++)for(let j=0;j<3;j++)box(row,.783,.04,.80,blue,-2.15+i*.855,.09,-.87+j*.87);
    panels.add(row);
  }
  group.add(panels);
  const beacon=box(group,1.1,1.2,.95,dark,7.5,.65,-.4);
  box(group,.4,.13,.08,cyanLight,7.5,1.01,.13);
  return {group,panels,beacon};
}

export function stormShelter() {
  const group=new T.Group();
  const hull=piece(group,new T.SphereGeometry(3.55,25,17,0,Math.PI*2,0,Math.PI*.56),matte('#63656a'),0,1.59,0);
  hull.scale.set(1.08,.9,.82);
  box(group,8,.60,6.9,edge,0,.38,0);
  box(group,2.38,2.83,2.32,dark,0,1.77,2.3);
  const door=box(group,1.95,2.35,.22,body,0,1.72,3.54);
  box(group,2.13,.17,.35,gold,0,3.06,3.53);
  const lamp=box(group,.66,.17,.2,amber,0,3.35,3.55);
  for(const sign of [-1,1])for(const i of [0,1,2])box(group,.47,1.02,.13,gold,sign*(1.42+i*.47),.82,3.59).rotation.z=-.6;
  return {group,door,lamp};
}

export function astronaut() {
  const group=new T.Group();
  const torso=sphere(group,.48,white,0,1.34,0);torso.scale.set(.77,.91,.57);
  box(group,.58,.69,.28,edge,0,1.38,.34);
  box(group,.62,.61,.15,body,0,1.41,.52);
  box(group,.35,.11,.045,gold,0,1.54,.608);
  const head=sphere(group,.325,white,0,1.93,-.007);head.scale.set(.98,1.05,.93);
  const visor=sphere(group,.259,new T.MeshPhysicalMaterial({color:'#ce8e4d',metalness:.45,roughness:.22,clearcoat:1}),0,1.944,-.17);visor.scale.set(1.045,.75,.55);
  ring(group,.27,.039,edge,0,1.944,-.246).scale.y=.73;
  const leftLeg=new T.Group(),rightLeg=new T.Group(),leftArm=new T.Group(),rightArm=new T.Group();
  for(const [leg,side] of [[leftLeg,-1],[rightLeg,1]] as const){
    leg.position.set(side*.195,1.035,.015);
    cylinder(leg,.133,.62,white,0,-.26,0);
    cylinder(leg,.139,.11,gold,0,-.50,0);
    box(leg,.25,.22,.42,body,0,-.73,-.096);
    box(leg,.255,.08,.43,dark,0,-.82,-.097);
    group.add(leg);
  }
  for(const [arm,side] of [[leftArm,-1],[rightArm,1]] as const){
    arm.position.set(side*.40,1.60,0);
    arm.rotation.z=side*.14;
    sphere(arm,.168,white,0,-.05,0);
    cylinder(arm,.111,.43,white,0,-.264,0);
    sphere(arm,.116,dark,0,-.51,0);
    group.add(arm);
  }
  return {group,leftLeg,rightLeg,leftArm,rightArm};
}

export function platform() {
  const group=new T.Group();
  cylinder(group,4.75,.4,edge,0,.2,0);
  cylinder(group,4.31,.13,dark,0,.46,0);
  const grid=ring(group,4.24,.064,cyanLight,0,.55,0);
  grid.rotation.x=-Math.PI/2;
  for(const x of [-4,4])box(group,.4,1.1,.42,gold,x,.77,1.6);
  return group;
}

export async function normalizedModel(path:string,maxSize:number) {
  const model=(await new GLTFLoader().loadAsync(path)).scene;
  const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
  const center=bounds.getCenter(new T.Vector3());
  model.position.set(-center.x,-bounds.min.y,-center.z);
  model.traverse(object=>{if(object instanceof T.Mesh){object.castShadow=true;object.receiveShadow=true;}});
  const wrap=new T.Group();
  wrap.add(model);
  wrap.scale.setScalar(maxSize/Math.max(size.x,size.y,size.z));
  return wrap;
}

export function looseRocks(height:(x:number,z:number)=>number,count=880) {
  const random=rng(62008);
  const geometry=new T.DodecahedronGeometry(1,0);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setY(i,positions.getY(i)*(1+.21*Math.sin(positions.getZ(i)*6)));
  geometry.computeVertexNormals();
  const mesh=new T.InstancedMesh(geometry,matte('#858381',0,.98),count);
  const dummy=new T.Object3D();
  const color=new T.Color();
  for(let i=0;i<mesh.count;i++){
    const foreground=i<Math.floor(count*.24);
    let x=(random()-.5)*(foreground?75:210),z=(random()-.565)*(foreground?66:190);
    if(!foreground&&Math.abs(x)<29&&z>-37&&z<25){x+=x<0?-28:28;z-=3;}
    const s=foreground?.08+random()*.16:.12+Math.pow(random(),3.5)*1.15;
    dummy.position.set(x,height(x,z)+s*.2,z);
    dummy.scale.set(s*(1+random()),s*.65,s*(1.1+random()*.45));dummy.rotation.set(random(),random()*7,random());
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    color.setScalar(.65+random()*.36);mesh.setColorAt(i,color);
  }
  mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}

/** Training replicas. Their site positions are fictional and their proportions are approximate. */
export function heritageReplicas() {
  const surveyor=new T.Group();
  cylinder(surveyor,.53,.51,edge,0,1.13,0);
  box(surveyor,.60,.37,.49,white,.42,1.42,-.11);
  for(let i=0;i<3;i++){
    const angle=i*2*Math.PI/3;
    const leg=new T.Group();leg.rotation.y=angle;
    cylinder(leg,.105,1.22,white,0,.65,.59).rotation.x=-.64;
    cylinder(leg,.29,.12,gold,0,.17,.95);
    surveyor.add(leg);
  }
  cylinder(surveyor,.06,1.35,edge,0,1.98,0);
  const dish=piece(surveyor,new T.SphereGeometry(.58,16,9,0,Math.PI*2,0,Math.PI*.5),white,.22,2.60,-.16);
  dish.scale.y=.23;dish.rotation.x=-.8;
  const scoop=new T.Group();scoop.position.set(0,1.03,.39);
  box(scoop,.11,.10,1.03,edge,0,-.15,.42).rotation.x=.30;
  box(scoop,.30,.13,.28,gold,0,-.32,.93);
  surveyor.add(scoop);

  const lunokhod=new T.Group(),robotWheels:T.Mesh[]=[];
  const shell=sphere(lunokhod,.86,white,0,.83,0);shell.scale.set(1,.61,1.42);
  box(lunokhod,1.14,.35,.3,edge,0,.94,-1.04);
  for(const x of [-.82,.82])for(const z of [-.88,-.30,.30,.88]){
    const wheel=cylinder(lunokhod,.31,.216,dark,x,.34,z);wheel.rotation.z=Math.PI/2;
    ring(lunokhod,.22,.032,edge,x*1.15,.34,z).rotation.y=Math.PI/2;
    const tread=box(lunokhod,.24,.05,.16,edge,x,.63,z);
    robotWheels.push(tread);
  }
  const lid=cylinder(lunokhod,.83,.074,blue,0,1.58,.61);
  lid.rotation.x=.89;lid.scale.z=1.2;
  cylinder(lunokhod,.052,.68,edge,-.56,1.26,-.73).rotation.z=-.35;
  box(lunokhod,.26,.19,.28,dark,.21,1.36,-.23);

  const apolloRover=new T.Group();
  box(apolloRover,1.46,.22,2.4,edge,0,.58,0);
  for(const z of [-.86,.86])for(const x of [-.88,.88]){
    const wheel=cylinder(apolloRover,.39,.245,dark,x,.40,z);wheel.rotation.z=Math.PI/2;
    ring(apolloRover,.32,.055,edge,x*1.13,.40,z).rotation.y=Math.PI/2;
  }
  for(const x of [-.38,.38]){
    box(apolloRover,.53,.088,.57,gold,x,.80,.32);
    const seat=box(apolloRover,.53,.54,.10,gold,x,1.03,.57);seat.rotation.x=-.16;
  }
  for(const x of [-.63,.63])box(apolloRover,.12,.13,1.36,white,x,.81,-.10);
  cylinder(apolloRover,.054,1.21,edge,.40,1.21,-.94);
  const antenna=piece(apolloRover,new T.SphereGeometry(.51,16,9,0,Math.PI*2,0,Math.PI*.5),white,.40,1.88,-.94);
  antenna.scale.y=.28;antenna.rotation.x=.89;
  box(apolloRover,.57,.46,.62,white,0,.91,.98);

  return {surveyor,lunokhod,apolloRover,scoop,robotWheels,antenna};
}
