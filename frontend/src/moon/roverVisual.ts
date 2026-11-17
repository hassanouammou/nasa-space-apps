import * as T from 'three';

export function buildRover(height:(x:number,z:number)=>number) {
  const group=new T.Group();
  const metal=new T.MeshStandardMaterial({color:'#b1c3c7',roughness:.62});
  const graphite=new T.MeshStandardMaterial({color:'#283242',roughness:.88});
  const gold=new T.MeshStandardMaterial({color:'#be883e',roughness:.67});
  const teal=new T.MeshBasicMaterial({color:'#62fff0'});
  const softTeal=new T.MeshBasicMaterial({color:'#4ff8ed',transparent:true,opacity:.46,depthWrite:false});
  function box(parent:T.Group,material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number) {
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    parent.add(mesh);
  }
  box(group,metal,0,.64,0,1.34,.46,2);
  box(group,gold,0,.96,-.48,1.16,.19,.70);
  box(group,graphite,0,.86,.49,1.10,.09,.75);
  box(group,teal,0,.69,1.02,.91,.06,.07);
  const wheels:T.Group[]=[];
  const wheelGeometry=new T.CylinderGeometry(.37,.37,.22,12);
  wheelGeometry.rotateZ(Math.PI/2);
  for(const side of [-1,1])for(const z of [-.76,0,.76]){
    const wheel=new T.Group();
    wheel.position.set(side*.77,.37,z);
    wheel.add(new T.Mesh(wheelGeometry,graphite));
    box(wheel,metal,side*.12,0,0,.04,.12,.49);
    group.add(wheel);
    wheels.push(wheel);
  }
  const sensor=new T.Group();
  sensor.position.set(0,.9,.36);
  box(sensor,metal,0,.30,0,.14,.61,.14);
  box(sensor,graphite,0,.62,0,.43,.24,.29);
  box(sensor,teal,0,.62,.155,.27,.08,.05);
  group.add(sensor);

  const receiver=new T.Group();
  receiver.position.set(0,height(0,-9),-9);
  box(receiver,metal,0,1.36,0,.12,2.72,.12);
  box(receiver,graphite,0,.18,0,.55,.36,.55);
  const dish=new T.Mesh(new T.ConeGeometry(.55,.27,14,1,true),metal);
  dish.position.y=2.64;
  dish.rotation.x=-Math.PI*.67;
  receiver.add(dish);
  const beacon=new T.Mesh(new T.SphereGeometry(.13,10,6),teal);
  beacon.position.y=2.81;
  receiver.add(beacon);

  const scanRing=new T.Mesh(new T.TorusGeometry(1,.033,5,30),softTeal);
  scanRing.rotation.x=-Math.PI/2;
  const radio=new T.Group();
  const packetGeometry=new T.SphereGeometry(1,8,6);
  const dots=Array.from({length:14},()=>new T.Mesh(packetGeometry,softTeal));
  const streak=Array.from({length:5},()=>new T.Mesh(packetGeometry,teal));
  radio.add(...dots,...streak);
  const start=new T.Vector3(),end=receiver.position.clone().add(new T.Vector3(0,2.81,0));
  const crest=new T.Vector3();
  const arc=new T.QuadraticBezierCurve3(start,crest,end);
  const position=new T.Vector3();
  function transmit(progress:number, reduced:boolean) {
    start.copy(group.position).add(new T.Vector3(0,1.60,0));
    crest.copy(start).lerp(end,.54);
    crest.y+=Math.max(3.5, start.distanceTo(end)*.36);
    dots.forEach((dot,i)=>{
      dot.position.copy(arc.getPoint((i+1)/(dots.length+1),position));
      dot.scale.setScalar(.065);
    });
    streak.forEach((bit,i)=>{
      bit.position.copy(arc.getPoint(T.MathUtils.clamp(progress-i*.055,0,1),position));
      bit.scale.setScalar((.21-i*.028)*(reduced?.65:1));
    });
  }
  scanRing.visible=radio.visible=false;
  return {group,wheels,sensor,receiver,beacon,scanRing,radio,transmit};
}
