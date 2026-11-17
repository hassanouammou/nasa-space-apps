import * as T from 'three';

export {terrainSource} from './roverTelemetry.ts';
type Elevation={size:number; extent:number; heights:number[]; dataset:string};

const localBump=(x:number,z:number)=>Math.sin(x*.38+z*.22)*.085+Math.cos(x*.61-z*.35)*.05;
const craters=[[-35,-38,11,1.8],[38,-22,13,2.3],[37,28,10,2.3],[-43,1,12,2.0],[7,39,11,2.1],[-31,44,17,3.4],[17,-65,13,2.7],[-39,-81,24,4.4]];
function shapedHeight(x:number,z:number) {
  let y=1.2*Math.cos(x*.055+z*.04)+.7*Math.sin(x*.11-z*.075);
  y*=Math.min(1,Math.hypot(x,z)/43);
  for(const [cx,cz,r,d] of craters) {
    const a=Math.hypot(x-cx,z-cz)/r;
    if(a<1) y-=d*Math.pow(1-a*a,1.5);
    if(a<1.45) y+=d*.25*Math.exp(-Math.pow((a-1)/.155,2));
  }
  const hills=Math.max(0,(Math.hypot(x,z)-52)/25);
  y+=Math.min(14,hills*(2+Math.abs(Math.sin(x*.036)*Math.cos(z*.043))*5));
  return y;
}
export function gridElevation(data:Elevation,x:number,z:number) {
  const half=data.extent/2;
  const u=T.MathUtils.clamp((x+half)/data.extent,0,1)*(data.size-1);
  const v=T.MathUtils.clamp((z+half)/data.extent,0,1)*(data.size-1);
  const col=Math.min(Math.floor(u),data.size-2),row=Math.min(Math.floor(v),data.size-2);
  const i=row*data.size+col;
  const blend=(a:number,b:number,t:number)=>a+(b-a)*t;
  return blend(blend(data.heights[i],data.heights[i+1],u-col),blend(data.heights[i+data.size],data.heights[i+data.size+1],u-col),v-row);
}
export function terrainHeight(data:Elevation|null,x:number,z:number) {
  if(!data)return shapedHeight(x,z)+localBump(x,z);
  const half=data.extent/2;
  const radius=Math.max(Math.abs(x),Math.abs(z));
  const extension=Math.max(0,radius-half*.84);
  return gridElevation(data,x,z)+localBump(x,z)+extension*.1*(1+Math.sin(x*.045+z*.025));
}
export async function getElevation():Promise<Elevation|null> {
  try {
    const response=await fetch('/moon/shackleton-elevation.json');
    if(!response.ok)return null;
    const data:Elevation=await response.json();
    return data.heights.length===data.size**2?data:null;
  } catch {return null;}
}

export function rng(seed:number) {
  return ()=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  };
}
export function lunarTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  const pixels=ctx.createImageData(256,256);
  const random=rng(94105);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const base=165+Math.sin(x*.13+y*.3)*6+Math.cos(x*.51-y*.26)*5+(random()-.5)*52;
    const i=(y*256+x)*4;
    pixels.data[i]=base;
    pixels.data[i+1]=base;
    pixels.data[i+2]=base+1;
    pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const texture=new T.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(56,56);
  texture.colorSpace=T.SRGBColorSpace;
  return texture;
}
export function ground(height:(x:number,z:number)=>number,segments=160) {
  const geometry=new T.PlaneGeometry(280,280,segments,segments);
  geometry.rotateX(-Math.PI/2);
  const points=geometry.attributes.position;
  const random=rng(15);
  const colors:number[]=[];
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),z=points.getZ(i);
    points.setY(i,height(x,z));
    const shade=.56+.08*Math.sin(x*.13+z*.19)+.065*Math.cos(z*.4-x*.53)+random()*.06;
    colors.push(shade,shade*.99,shade*.96);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({map:lunarTexture(),vertexColors:true,roughness:1}));
  mesh.receiveShadow=true;
  return mesh;
}
