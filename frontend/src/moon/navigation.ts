export type Point={x:number;z:number};
const obstacles=[
  {x:0,z:-14,w:6.5,d:4.6},{x:-17,z:-7,w:4.3,d:4},{x:18,z:-9,w:4.8,d:4.2},
  {x:-26,z:13,w:9.1,d:6.3},{x:20,z:13,w:4.7,d:4.8},{x:0,z:-32,w:5.5,d:5.3},
  {x:-29,z:-21,w:2.4,d:2.4},{x:29,z:-23,w:2.8,d:2.5},{x:-11,z:-32,w:2.7,d:2.3},
];
export function walkable(x:number,z:number) {
  return Math.abs(x)<=44&&z>=-45&&z<=39&&!obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);
}
const steps=[[-1,0],[1,0],[0,-1],[0,1]] as const;
export function routeBetween(from:Point,to:Point):Point[] {
  // The station approach points sit on a one-metre navigation grid.
  const origin={x:Math.round(from.x),z:Math.round(from.z)};
  const key=({x,z}:Point)=>x+','+z;
  const next=[origin];
  const prior=new Map<string,Point|null>([[key(origin),null]]);
  for(let head=0;head<next.length;head++){
    const point=next[head];
    if(point.x===to.x&&point.z===to.z){
      const path:Point[]=[];
      let cursor:Point|null=point;
      while(cursor&&key(cursor)!==key(origin)){path.push(cursor);cursor=prior.get(key(cursor))??null;}
      return path.reverse();
    }
    for(const [dx,dz] of steps){
      const x=point.x+dx,z=point.z+dz,neighbor={x,z};
      if(!walkable(x,z)||prior.has(key(neighbor)))continue;
      prior.set(key(neighbor),point);
      next.push(neighbor);
    }
  }
  return [];
}
