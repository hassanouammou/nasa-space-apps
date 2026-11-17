import * as T from 'three';
import {astronaut,greenhouse,habitat,heritageReplicas,lifeSupport,looseRocks,normalizedModel,platform,solarArray,stormShelter} from './models';
import {getElevation,gridElevation,ground,rng,terrainHeight} from './terrain';
import {SoftwareRenderer} from './softwareRenderer';
import {routeBetween,walkable} from './navigation';
import type {Point} from './navigation';
import {stationIds,stations} from './story';
import type {Station} from './story';
import {isArtifact} from './artifacts';
import type {ArtifactId} from './artifacts';
import {course,surveyCourse} from './fieldwork';
import type {SurveyRoute} from '../outpost/surveyRoutes';
import type {EquipmentPreview} from './Fieldwork';
import {buildRover} from './roverVisual';
import {measureTerrain,patrolFrame,roverCycle,scanStarts,transmissionStarts} from './roverTelemetry';
import type {RoverPhase,RoverReading} from './roverTelemetry';

export type WorldSettings={storm:boolean;shadow:boolean;grow:number;lights:number;shield:boolean;focus:Station;paused:boolean;active:boolean;day:number;preview:EquipmentPreview|null;surveyIndex:number|null;trackingRover:boolean;surveyRoute?:SurveyRoute};
export type WorldEvent={nearest:Station|null;moving:boolean};
type Options={canvas:HTMLCanvasElement;labels:Map<Station,HTMLButtonElement>;settings:()=>WorldSettings;onArrive:(id:Station)=>void;onLabModel:(loaded:boolean)=>void;onLandingFinished:()=>void;onSurveyPoint:(index:number)=>void;onChange:(state:WorldEvent)=>void;onRoverPhase:(phase:RoverPhase)=>void;onRoverReading:(reading:RoverReading)=>void};
export type MoonWorld={walkTo:(id:Station)=>void;walkSurvey:(index:number)=>void;hold:(key:string,down:boolean)=>void;recenter:()=>void;demonstrateLanding:()=>void;demonstrateArtifact:(id:ArtifactId)=>void;reset:()=>void;dispose:()=>void;source:string|null};

function addSky(scene:T.Scene) {
  const random=rng(94), points=[];
  for(let i=0;i<870;i++){
    const a=random()*Math.PI*2,y=.02+random()*.98;
    const r=Math.sqrt(1-y*y)*175;
    points.push(Math.cos(a)*r,y*175,Math.sin(a)*r);
  }
  const stars=new T.BufferGeometry();
  stars.setAttribute('position',new T.Float32BufferAttribute(points,3));
  scene.add(new T.Points(stars,new T.PointsMaterial({color:'#aabdd5',size:.24,transparent:true,opacity:.72,fog:false})));
  const texture=document.createElement('canvas');texture.width=512;texture.height=256;
  const ctx=texture.getContext('2d')!;
  ctx.fillStyle='#1d4a81';ctx.fillRect(0,0,512,256);
  const continents=[[[92,55],[157,49],[174,71],[146,104],[119,115],[108,139],[85,101],[62,89]],[[125,132],[153,129],[184,164],[167,202],[147,220],[132,190]],[[239,59],[303,39],[364,50],[437,63],[471,84],[407,115],[351,100],[323,141],[302,125],[299,91],[262,91]],[[260,101],[305,96],[320,145],[296,181],[271,168],[254,130]],[[378,163],[429,158],[455,188],[415,205],[380,190]]];
  ctx.fillStyle='#477c70';
  continents.forEach(area=>{ctx.beginPath();area.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();});
  for(let i=0;i<110;i++){
    ctx.fillStyle='rgba(226,246,252,'+(random()*.21)+')';
    ctx.beginPath();ctx.ellipse(random()*512,random()*256,8+random()*34,1+random()*5,-.2,0,Math.PI*2);ctx.fill();
  }
  const earthMap=new T.CanvasTexture(texture);earthMap.colorSpace=T.SRGBColorSpace;
  const earth=new T.Mesh(new T.SphereGeometry(5.8,32,24),new T.MeshBasicMaterial({map:earthMap,fog:false,color:'#b5cadf'}));
  earth.position.set(-51,30,-136);earth.rotation.set(.18,2.65,-.31);scene.add(earth);
}
function glowTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,2,32,32,32);
  gradient.addColorStop(0,'rgba(255,189,120,.62)');
  gradient.addColorStop(.27,'rgba(247,154,103,.15)');
  gradient.addColorStop(1,'rgba(252,124,86,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  return new T.CanvasTexture(canvas);
}
function disposeMaterials(scene:T.Scene) {
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
  scene.traverse(object=>{
    if(object instanceof T.Mesh||object instanceof T.Points||object instanceof T.Sprite||object instanceof T.Line){
      if('geometry' in object)geometries.add(object.geometry);
      for(const m of (Array.isArray(object.material)?object.material:[object.material]) as T.Material[]){
        materials.add(m);
        for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);
      }
    }
  });
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
  for(const t of textures)t.dispose();
}
export async function createMoonWorld({canvas,labels,settings,onArrive,onLabModel,onLandingFinished,onSurveyPoint,onChange,onRoverPhase,onRoverReading}:Options):Promise<MoonWorld> {
  const elevation=await getElevation();
  const height=(x:number,z:number)=>terrainHeight(elevation,x,z);
  const gl=canvas.getContext('webgl2',{antialias:true,powerPreference:'high-performance'});
  let gpu:T.WebGLRenderer|null=null;
  if(gl){
    gpu=new T.WebGLRenderer({canvas,context:gl,antialias:true,powerPreference:'high-performance'});
    gpu.shadowMap.enabled=true;
    gpu.shadowMap.type=T.PCFShadowMap;
    gpu.toneMapping=T.ACESFilmicToneMapping;
    gpu.toneMappingExposure=1.20;
    gpu.setPixelRatio(Math.min(1.65,window.devicePixelRatio));
  }
  const renderer=gpu??new SoftwareRenderer(canvas);
  const software=!gpu;
  const scene=new T.Scene();
  scene.background=new T.Color('#080b15');
  scene.fog=new T.Fog('#1c202b',102,222);
  const camera=new T.PerspectiveCamera(51,1,.12,320);
  scene.add(new T.HemisphereLight('#d2e4f9','#746254',1.12));
  const sun=new T.DirectionalLight('#fff0d6',3.1);
  sun.position.set(-34,21,14);
  sun.target.position.set(0,0,-12);
  sun.castShadow=true;
  sun.shadow.camera.left=-49;sun.shadow.camera.right=49;sun.shadow.camera.top=47;sun.shadow.camera.bottom=-47;
  sun.shadow.camera.near=1;sun.shadow.camera.far=125;sun.shadow.mapSize.set(1536,1536);
  sun.shadow.normalBias=.085;sun.shadow.bias=-.0005;
  scene.add(sun,sun.target,ground(height,software?64:160),looseRocks(height,software?250:880));
  addSky(scene);

  const crop=greenhouse(),shield=stormShelter(),solar=solarArray(),lab=platform();
  const heritage=heritageReplicas();
  const objects={habitat:habitat(),air:lifeSupport(),plants:crop.group,power:solar.group,shelter:shield.group,lab,
    surveyor:heritage.surveyor,lunokhod:heritage.lunokhod,apolloRover:heritage.apolloRover};
  for(const id of stationIds){
    const j=stations[id];
    objects[id].position.set(j.x,height(j.x,j.z),j.z);
    scene.add(objects[id]);
  }
  const rover=buildRover(height);
  scene.add(rover.group,rover.receiver,rover.scanRing,rover.radio);
  const sampleHeight=elevation?(x:number,z:number)=>gridElevation(elevation,x,z):height;
  let roverClock=0, captured:RoverReading|null=null, phase:RoverPhase|null=null;
  const player=astronaut();
  const avatar=player.group;
  const p=new T.Vector3(0,height(0,12),12);
  avatar.position.copy(p);scene.add(avatar);
  const labModel=new T.Group();labModel.position.y=.73;lab.add(labModel);
  let destroyed=false;
  void normalizedModel('/moon/apollo-module.glb',7.3).then(model=>{
    if(destroyed){const temporary=new T.Scene();temporary.add(model);disposeMaterials(temporary);return;}
    labModel.add(model);
    onLabModel(true);
  }).catch(error=>{if(!destroyed){onLabModel(false);console.warn('The Apollo model could not load.',error);}});
  void normalizedModel('/moon/astronaut.glb',2.25).then(model=>{
    if(destroyed){const temporary=new T.Scene();temporary.add(model);disposeMaterials(temporary);return;}
    model.position.set(-3.1,height(-3.1,-9.35),-9.35); model.rotation.y=Math.PI-.42;
    scene.add(model);
  }).catch(error=>{if(!destroyed)console.warn('The suit reference could not load.',error);});

  const shadowMaterial=new T.MeshBasicMaterial({color:'#111423',transparent:true,opacity:.34,depthWrite:false});
  const shadowGeometry=new T.CircleGeometry(1,16);
  shadowGeometry.rotateX(-Math.PI/2);
  const playerShadow=new T.Mesh(shadowGeometry,shadowMaterial);
  if(software){
    playerShadow.scale.set(1.04,1,.55);scene.add(playerShadow);
    for(const id of stationIds){
      const station=stations[id],shadow=new T.Mesh(shadowGeometry,shadowMaterial);
      shadow.position.set(station.x+2,height(station.x+2,station.z-1.5)+.055,station.z-1.5);
      shadow.scale.set(isArtifact(id)?1.4:id==='power'?8.6:5.5,1,isArtifact(id)?1:3.6);
      scene.add(shadow);
    }
  }
  const marker=new T.Mesh(new T.TorusGeometry(1,.075,8,30),new T.MeshBasicMaterial({color:'#a4eddf',transparent:true,opacity:.8}));
  marker.rotation.x=-Math.PI/2;scene.add(marker);
  const scan=new T.Mesh(new T.TorusGeometry(1.45,.047,8,24),new T.MeshBasicMaterial({color:'#ffd294',transparent:true,opacity:.9}));
  scan.rotation.x=-Math.PI/2;scan.visible=false;scene.add(scan);
  const surveyRings=course.map(point=>{
    const ring=new T.Mesh(new T.TorusGeometry(1.25,.085,10,27),new T.MeshBasicMaterial({color:'#38dceb',transparent:true,opacity:.85}));
    ring.rotation.x=-Math.PI/2;
    ring.position.set(point.x,height(point.x,point.z)+.16,point.z);
    const mast=new T.Mesh(new T.CylinderGeometry(.05,.075,2.15,10),new T.MeshBasicMaterial({color:'#74e7ed'}));
    mast.position.set(point.x,height(point.x,point.z)+1.15,point.z);
    ring.visible=mast.visible=false;
    scene.add(ring,mast);
    return {ring,mast};
  });
  const liveGauge=new T.Mesh(new T.TorusGeometry(.75,.064,8,29),new T.MeshBasicMaterial({color:'#75e8fc',transparent:true,opacity:.9}));
  liveGauge.visible=false;
  scene.add(liveGauge);
  const halo=new T.Sprite(new T.SpriteMaterial({map:glowTexture(),depthWrite:false,transparent:true,opacity:.65}));
  halo.position.set(20,height(20,13)+3.6,16.6);halo.scale.setScalar(5.1);scene.add(halo);
  const keyMap:Record<string,string>={w:'w',s:'s',a:'a',d:'d',arrowup:'w',arrowdown:'s',arrowleft:'a',arrowright:'d'};
  const activeKeys=new Set<string>();
  const desired=new T.Vector3(),view=new T.Vector3(),camPoint=new T.Vector3(),lookPoint=new T.Vector3(),projectPoint=new T.Vector3();
  let lastFrame=performance.now(),elapsed=0;
  let yaw=0,pitch=.46,route:Point[]=[],target:Station|number|null=null,nearest:Station|null=null,moving=false,hydrated=false;
  let pointer:{id:number;x:number;y:number}|null=null;
  let raf=0,lastMove=0,lastRendered=0,landingStart:number|null=null,dayStarted=0,currentDay=1,lastSurveyPoint=-1;
  let artifactScan:{id:ArtifactId;start:number}|null=null;

  function resize() {
    const {clientWidth:w,clientHeight:h}=canvas;
    if(!w||!h)return;
    if(gpu)gpu.setSize(w,h,false);else renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();

  function guide(goal:Point,next:Station|number) {
    const waypoints=routeBetween(p,goal);
    route=waypoints.filter((point,i)=>{
      const previous=waypoints[i-1]??{x:Math.round(p.x),z:Math.round(p.z)};
      const following=waypoints[i+1];
      return !following||(point.x-previous.x!==following.x-point.x)||(point.z-previous.z!==following.z-point.z);
    });
    target=next;
  }
  function walkTo(id:Station) {
    const goal=stations[id];
    guide({x:goal.stopX,z:goal.stopZ},id);
  }
  function closest() {
    return stationIds.find(id=>{
      const v=stations[id];
      return Math.hypot(p.x-v.stopX,p.z-v.stopZ)<3.2;
    })??null;
  }
  function onKeyDown(event:KeyboardEvent) {
    const config=settings();
    if(event.ctrlKey||event.metaKey||event.altKey||config.paused||config.trackingRover||!config.active)return;
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLElement&&event.target.isContentEditable)return;
    const key=event.key.toLowerCase();
    if(key==='e'){
      const id=closest();
      if(id){event.preventDefault();onArrive(id);}
    }
    if(keyMap[key]){event.preventDefault();activeKeys.add(keyMap[key]);route=[];target=null;}
  }
  function onKeyUp(event:KeyboardEvent){activeKeys.delete(keyMap[event.key.toLowerCase()]);}
  function releaseKeys(){activeKeys.clear();}
  function pointerDown(e:PointerEvent){pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}
  function pointerMove(e:PointerEvent){
    if(pointer?.id!==e.pointerId)return;
    yaw-=(e.clientX-pointer.x)*.0065;
    pitch=T.MathUtils.clamp(pitch+(e.clientY-pointer.y)*.004,.20,.82);
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY};
  }
  function pointerEnd(){pointer=null;}
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',releaseKeys);
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);
  const motionReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate() {
    if(destroyed)return;
    raf=requestAnimationFrame(animate);
    const now=performance.now();
    if(software&&now-lastFrame<29)return;
    const dt=Math.min(.11,(now-lastFrame)/1000),s=settings();
    lastFrame=now;
    elapsed+=dt;
    const time=elapsed;
    // The survey clock continues while the player reads the console.
    roverClock+=dt;
    const patrol=patrolFrame(roverClock);
    if(captured&&patrol.leg>=captured.id){onRoverReading(captured);captured=null;}
    if(patrol.phase==='Scanning'&&!captured)
      captured=measureTerrain(patrol.leg+1,s.day,roverClock,patrol.stop,sampleHeight,elevation?.dataset??null);
    const nextPhase=patrol.leg>0&&patrol.into<.65?'Delivered':patrol.phase;
    if(phase!==nextPhase){phase=nextPhase;onRoverPhase(nextPhase);}
    const {group:vehicle,scanRing,radio,sensor,beacon}=rover;
    vehicle.position.set(patrol.x,height(patrol.x,patrol.z)+(software?.19:.04),patrol.z);
    vehicle.rotation.y+=Math.atan2(Math.sin(patrol.bearing-vehicle.rotation.y),Math.cos(patrol.bearing-vehicle.rotation.y))*Math.min(1,dt*8);
    if(!motionReduced)for(const wheel of rover.wheels)wheel.rotation.x=patrol.distance/.37;
    sensor.rotation.y=patrol.phase==='Scanning'&&!motionReduced?Math.sin((patrol.into-scanStarts)*6)*.85:0;
    scanRing.visible=patrol.phase==='Scanning';
    scanRing.position.set(patrol.x,vehicle.position.y+.16,patrol.z);
    scanRing.scale.setScalar(motionReduced?1.2:.65+1.55*(patrol.into-scanStarts)/(transmissionStarts-scanStarts));
    radio.visible=patrol.phase==='Transmitting';
    if(radio.visible)rover.transmit((patrol.into-transmissionStarts)/(roverCycle-transmissionStarts),motionReduced);
    beacon.scale.setScalar(nextPhase==='Delivered'&&!motionReduced?1.25+.7*Math.sin(patrol.into/.65*Math.PI):1);
    view.set(-Math.sin(yaw),0,-Math.cos(yaw));
    desired.set(0,0,0);
    if(s.active&&!s.paused&&!s.trackingRover){
      if(activeKeys.size){
        if(activeKeys.has('w'))desired.add(view);
        if(activeKeys.has('s'))desired.sub(view);
        if(activeKeys.has('d')){desired.x-=view.z;desired.z+=view.x;}
        if(activeKeys.has('a')){desired.x+=view.z;desired.z-=view.x;}
        if(desired.lengthSq())desired.normalize();
      } else if(target!==null) {
        if(route.length&&Math.hypot(route[0].x-p.x,route[0].z-p.z)<.11)route.shift();
        if(route.length){
          desired.set(route[0].x-p.x,0,route[0].z-p.z).normalize();
        } else {
          const id=target;target=null;
          if(typeof id==='string'&&Math.hypot(stations[id].stopX-p.x,stations[id].stopZ-p.z)<3.2){
            yaw=Math.atan2(p.x-stations[id].x,p.z-stations[id].z);
            onArrive(id);
          }
        }
      }
    } else if(activeKeys.size)activeKeys.clear();
    const walks=desired.lengthSq()>.1;
    if(walks){
      const maxStep=dt*(target!==null?13.5:5.2);
      const step=target!==null&&route.length?Math.min(maxStep,Math.hypot(route[0].x-p.x,route[0].z-p.z)):maxStep;
      const x=p.x+desired.x*step,z=p.z+desired.z*step;
      if(walkable(x,p.z))p.x=x;
      if(walkable(p.x,z))p.z=z;
      lastMove+=dt;
      const angle=Math.atan2(-desired.x,-desired.z);
      avatar.rotation.y+=Math.atan2(Math.sin(angle-avatar.rotation.y),Math.cos(angle-avatar.rotation.y))*Math.min(1,dt*10);
    }
    p.y=height(p.x,p.z);
    avatar.position.copy(p);
    if(software)playerShadow.position.set(p.x+.55,height(p.x+.55,p.z-.28)+.052,p.z-.28);
    const swing=walks?Math.sin(lastMove*11)*.56:0;
    player.leftLeg.rotation.x=swing;player.rightLeg.rotation.x=-swing;player.leftArm.rotation.x=-swing*.75;player.rightArm.rotation.x=swing*.75;
    if(walks&&!motionReduced)avatar.position.y+=Math.abs(swing)*.25;
    const near=closest();
    if(nearest!==near||moving!==(target!==null)){
      const entered=near!==nearest;
      nearest=near;moving=target!==null;onChange({nearest,moving});
      if(entered&&near&&isArtifact(near)&&target===null&&s.active&&!s.paused&&s.surveyIndex===null)onArrive(near);
    }
    let distance=canvas.clientWidth<680?9.1:10.0;
    while(distance>3&& !walkable(p.x-view.x*distance,p.z-view.z*distance))distance-=.75;
    camPoint.set(p.x-view.x*distance,p.y+2.0+distance*Math.sin(pitch),p.z-view.z*distance);
    lookPoint.set(p.x+view.x*3.9,p.y+1.7,p.z+view.z*3.9);
    if(s.trackingRover){
      const position=rover.group.position;
      camPoint.set(position.x+6,position.y+5.1,position.z+9.2);
      lookPoint.set(position.x*.76,position.y+1.5,position.z*.76-2.15);
    }
    if(!hydrated){camera.position.copy(camPoint);hydrated=true;}
    camera.position.lerp(camPoint,1-Math.exp(-dt*7.5));
    camera.position.y=Math.max(camera.position.y,height(camera.position.x,camera.position.z)+1.1);
    camera.lookAt(lookPoint);camera.updateMatrixWorld();
    if(s.surveyIndex===null)lastSurveyPoint=-1;
    const surveyPath=surveyCourse(s.surveyRoute);
    for(let index=0;index<surveyRings.length;index++){
      const {ring,mast}=surveyRings[index];
      ring.visible=mast.visible=s.surveyIndex!==null;
      if(ring.visible){
        const {x,z}=surveyPath[index];
        ring.position.set(x,height(x,z)+.16,z);
        mast.position.set(x,height(x,z)+1.15,z);
      }
      const next=s.surveyIndex===index;
      ring.material.color.set(index<(s.surveyIndex??0)?'#a4ea8f':next?'#39edf4':'#6085a4');
      mast.material.color.copy(ring.material.color);
      ring.scale.setScalar(next&&!motionReduced?1.04+Math.sin(time*5)*.12:1);
    }
    if(s.surveyIndex!==null&&s.surveyIndex!==lastSurveyPoint&&!s.paused){
      const point=surveyPath[s.surveyIndex];
      if(point&&Math.hypot(p.x-point.x,p.z-point.z)<1.5){
        lastSurveyPoint=s.surveyIndex;
        target=null;route=[];
        onSurveyPoint(s.surveyIndex);
      }
    }
    const focus=stations[s.focus];
    marker.position.set(focus.stopX,height(focus.stopX,focus.stopZ)+.18,focus.stopZ);
    marker.scale.setScalar(motionReduced?1:1+(Math.sin(time*3)+1)*.12);
    if(s.day!==currentDay){currentDay=s.day;dayStarted=time;}
    const dawn=dayStarted>0?Math.min(1,(time-dayStarted)/1.8):1;
    const daylight=(s.shadow?1.45:3.1)*(motionReduced?1:.55+.45*dawn);
    sun.intensity=T.MathUtils.lerp(sun.intensity,daylight,Math.min(1,dt*2.4));
    const preview=s.preview;
    const tilt=preview?.kind==='power'?-.12-preview.value*.007:s.shadow?-.12:-.58;
    liveGauge.visible=Boolean(preview);
    if(preview){
      const gaugeAt=stations[preview.kind==='radio'?'habitat':preview.kind];
      liveGauge.position.set(gaugeAt.x+.21,height(gaugeAt.x,gaugeAt.z)+4.4,gaugeAt.z);
      liveGauge.quaternion.copy(camera.quaternion);
      liveGauge.scale.setScalar(.7+(preview.kind==='shelter'?preview.value/2:preview.value/100)*.55);
      liveGauge.material.color.set(preview.kind==='shelter'?'#ffd7a1':'#75e8fc');
    }
    for(const panel of solar.panels.children)panel.rotation.x=T.MathUtils.lerp(panel.rotation.x,tilt,Math.min(1,dt*2.4));
    crop.led.color.set(s.lights?'#ce9aff':'#4a3a4d');
    crop.light.intensity=preview?.kind==='plants'?preview.value*.46:s.lights*7;
    for(const plant of crop.crops.children)plant.scale.setScalar(.50+s.grow*.006);
    shield.door.position.x=T.MathUtils.lerp(shield.door.position.x,s.shield||preview?.kind==='shelter'&&preview.value===2?0:1.35,Math.min(1,dt*2.4));
    halo.visible=s.storm;halo.material.opacity=motionReduced?.62:.44+Math.sin(time*4)*.20;
    shield.lamp.visible=s.storm;
    labModel.rotation.y=motionReduced?.32:.32+Math.sin(time*.3)*.32;
    if(artifactScan){
      const age=time-artifactScan.start, phase=Math.min(1,age/2.5);
      const {x,z}=stations[artifactScan.id];
      scan.visible=!motionReduced&&phase<1;
      scan.position.set(x,height(x,z)+.22+phase*2.4,z);
      scan.material.opacity=(1-phase)*.85;
      if(artifactScan.id==='surveyor')heritage.scoop.rotation.x=motionReduced?0:Math.sin(phase*Math.PI*2)*.38;
      if(artifactScan.id==='lunokhod')for(const tread of heritage.robotWheels)tread.rotation.x=motionReduced?0:phase*Math.PI*4;
      if(artifactScan.id==='apolloRover')heritage.antenna.rotation.y=motionReduced?0:Math.sin(phase*Math.PI*2)*.45;
      if(phase===1)artifactScan=null;
    }
    if(landingStart!==null){
      const progress=T.MathUtils.clamp((time-landingStart)/5,0,1);
      labModel.position.y=.73+10.5*Math.pow(1-progress,1.8);
      if(progress===1){
        landingStart=null;
        onLandingFinished();
      }
    }
    for(const [id,el] of labels){
      const j=stations[id];
      projectPoint.set(j.x,height(j.x,j.z)+j.lift,j.z).project(camera);
      const show=projectPoint.z<1&&projectPoint.z>-1&&Math.abs(projectPoint.x)<.97&&Math.abs(projectPoint.y)<.90;
      el.style.visibility=show?'visible':'hidden';
      if(show)el.style.transform=`translate3d(${((projectPoint.x+1)*canvas.clientWidth/2).toFixed(1)}px,${((1-projectPoint.y)*canvas.clientHeight/2).toFixed(1)}px,0) translate(-50%,-50%)`;
    }
    if(!software||now-lastRendered>(s.paused?115:46)){
      renderer.render(scene,camera);
      lastRendered=now;
    }
  }
  animate();
  return {
    walkTo,
    walkSurvey:index=>{const point=surveyCourse(settings().surveyRoute)[index];if(point)guide(point,index);},
    hold:(key,down)=>{if(down){activeKeys.add(key);route=[];target=null;}else activeKeys.delete(key);},
    recenter:()=>{yaw=0;pitch=.46;},
    demonstrateArtifact:id=>{artifactScan={id,start:elapsed};},
    demonstrateLanding:()=>{yaw=0;pitch=.31;landingStart=elapsed;},
    reset:()=>{p.set(0,height(0,12),12);avatar.rotation.y=0;yaw=0;route=[];target=null;landingStart=null;labModel.position.y=.73;roverClock=0;captured=null;phase=null;activeKeys.clear();},
    source:elevation?.dataset??null,
    dispose:()=>{
      destroyed=true;cancelAnimationFrame(raf);observer.disconnect();
      window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',releaseKeys);
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);
      canvas.removeEventListener('pointerup',pointerEnd);canvas.removeEventListener('pointercancel',pointerEnd);
      disposeMaterials(scene);renderer.dispose();
    },
  };
}
