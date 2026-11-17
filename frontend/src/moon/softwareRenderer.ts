import * as T from 'three';

type Face={x0:number;y0:number;x1:number;y1:number;x2:number;y2:number;depth:number;fill:string};
type GeometryCache={positions:T.BufferAttribute;indices:T.BufferAttribute|null;colors?:T.BufferAttribute;uvs?:T.BufferAttribute;groups:readonly {start:number;count:number;materialIndex?:number}[]};
const rgb=new T.Color(),normal=new T.Vector3(),sunVector=new T.Vector3(-.66,.61,.36).normalize();
const fallbackColor=new T.Color('#8e9f9c');
const worldCamera=new T.Vector3(),spritePoint=new T.Vector3(),center=new T.Vector3();
const modelToCamera=new T.Matrix4(),matrix=new T.Matrix4(),instanceWorld=new T.Matrix4(),normalMatrix=new T.Matrix3();
const frustum=new T.Frustum(), clip=new T.Matrix4();
const srgb=(linear:number)=>Math.round(255*Math.pow(T.MathUtils.clamp(linear,0,1),.4545));

/** Small perspective rasterizer for browsers where the GPU cannot start WebGL. */
export class SoftwareRenderer {
  readonly software=true;
  private ctx:CanvasRenderingContext2D;
  private width=1;
  private height=1;
  private geometry=new WeakMap<T.BufferGeometry,GeometryCache>();
  private textures=new WeakMap<T.Texture,ImageData|null>();
  private faces:Face[]=[];
  private count=0;
  private shade=1;

  constructor(private canvas:HTMLCanvasElement) {
    const context=canvas.getContext('2d',{alpha:false});
    if(!context)throw new Error('Canvas rendering is unavailable');
    this.ctx=context;
  }
  setSize(width:number,height:number) {
    const scale=Math.min(1,1000/width);
    this.width=Math.max(1,Math.round(width*scale));
    this.height=Math.max(1,Math.round(height*scale));
    this.canvas.width=this.width;
    this.canvas.height=this.height;
  }
  dispose() {this.faces.length=0;}
  private sample(texture:T.Texture,u:number,v:number) {
    let image=this.textures.get(texture);
    if(typeof image==='undefined'){
      try {
        const source=texture.image as CanvasImageSource;
        const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
        const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
        ctx.drawImage(source,0,0,32,32);
        image=ctx.getImageData(0,0,32,32);
      } catch {image=null;}
      this.textures.set(texture,image);
    }
    if(!image)return;
    const x=Math.floor(T.MathUtils.clamp(u,0,.9999)*32),y=Math.floor(T.MathUtils.clamp(texture.flipY?1-v:v,0,.9999)*32);
    const i=(y*32+x)*4;
    rgb.r*=Math.pow(image.data[i]/255,2.2);
    rgb.g*=Math.pow(image.data[i+1]/255,2.2);
    rgb.b*=Math.pow(image.data[i+2]/255,2.2);
  }

  private emit(mesh:T.Mesh,matrixWorld:T.Matrix4,camera:T.PerspectiveCamera) {
    let data=this.geometry.get(mesh.geometry);
    if(!data){
      const {position,color,uv}=mesh.geometry.attributes;
      const index=mesh.geometry.index;
      data={positions:position as T.BufferAttribute,indices:index,colors:color as T.BufferAttribute|undefined,uvs:uv as T.BufferAttribute|undefined,
        groups:mesh.geometry.groups.length?mesh.geometry.groups:[{start:0,count:index?.count??position.count}]};
      this.geometry.set(mesh.geometry,data);
    }
    const {positions,indices,colors,uvs,groups}=data;
    if(!positions?.count)return;
    modelToCamera.multiplyMatrices(camera.matrixWorldInverse,matrixWorld);
    normalMatrix.getNormalMatrix(matrixWorld);
    const m=modelToCamera.elements,proj=camera.projectionMatrix.elements;
    const screen=new Float32Array(positions.count*3),width=this.width,height=this.height;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
      const ax=m[0]*x+m[4]*y+m[8]*z+m[12],ay=m[1]*x+m[5]*y+m[9]*z+m[13],az=-(m[2]*x+m[6]*y+m[10]*z+m[14]);
      const depth=Math.max(.16,az);
      screen[i*3]=(1+ax*proj[0]/depth)*width*.5;
      screen[i*3+1]=(1-ay*proj[5]/depth)*height*.5;
      screen[i*3+2]=az;
    }
    for(const group of groups){
      const material=(Array.isArray(mesh.material)?mesh.material[group.materialIndex??0]:mesh.material) as T.MeshStandardMaterial;
      if(!material||material.visible===false)continue;
      for(let i=group.start,end=group.start+group.count;i+2<end;i+=3){
        const a=indices?indices.getX(i):i,b=indices?indices.getX(i+1):i+1,c=indices?indices.getX(i+2):i+2;
        const x0=screen[a*3],y0=screen[a*3+1],z0=screen[a*3+2];
        const x1=screen[b*3],y1=screen[b*3+1],z1=screen[b*3+2];
        const x2=screen[c*3],y2=screen[c*3+1],z2=screen[c*3+2];
        if((z0<=.14&&z1<=.14&&z2<=.14)||Math.max(x0,x1,x2)<0||Math.min(x0,x1,x2)>width||Math.max(y0,y1,y2)<0||Math.min(y0,y1,y2)>height)continue;
        const cross=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
        const front=cross<0;
        if(Math.abs(cross)<.14||(!front&&material.side===T.FrontSide)||(front&&material.side===T.BackSide))continue;
        const x=positions.getX(a),y=positions.getY(a),z=positions.getZ(a);
        const ux=positions.getX(b)-x,uy=positions.getY(b)-y,uz=positions.getZ(b)-z;
        const vx=positions.getX(c)-x,vy=positions.getY(c)-y,vz=positions.getZ(c)-z;
        normal.set(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx).applyMatrix3(normalMatrix).normalize();
        if(!front)normal.negate();
        rgb.copy(material.color??fallbackColor);
        if(colors)rgb.multiplyScalar((colors.getX(a)+colors.getX(b)+colors.getX(c))/3);
        if(material.map&&uvs&&!colors)this.sample(material.map,(uvs.getX(a)+uvs.getX(b)+uvs.getX(c))/3,(uvs.getY(a)+uvs.getY(b)+uvs.getY(c))/3);
        if(!(material instanceof T.MeshBasicMaterial)){
          rgb.multiplyScalar((.34+Math.max(0,normal.dot(sunVector))*.61+.14*Math.max(normal.y,0))*this.shade);
          if(material.emissive)rgb.lerp(material.emissive,Math.min(.5,material.emissiveIntensity*.15));
        }
        const depth=(z0+z1+z2)/3;
        if(depth>96&&material.fog!==false)rgb.lerp(fog,Math.min(.75,(depth-96)/140));
        const fill=`rgba(${srgb(rgb.r)},${srgb(rgb.g)},${srgb(rgb.b)},${material.transparent?material.opacity:1})`;
        const face=this.faces[this.count]??{x0:0,y0:0,x1:0,y1:0,x2:0,y2:0,depth:0,fill:''};
        Object.assign(face,{x0,y0,x1,y1,x2,y2,depth,fill});
        this.faces[this.count++]=face;
      }
    }
  }
  render(scene:T.Scene,camera:T.PerspectiveCamera) {
    scene.updateMatrixWorld();
    worldCamera.setFromMatrixPosition(camera.matrixWorld);
    clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(clip);
    this.count=0;
    this.shade=1;
    const context=this.ctx,width=this.width,height=this.height;
    context.fillStyle='#080b15';context.fillRect(0,0,width,height);
    const sprites:T.Sprite[]=[];
    scene.traverseVisible(object=>{
      if(object instanceof T.DirectionalLight)this.shade=object.intensity>2?.99:.74;
      if(object instanceof T.Sprite){sprites.push(object);return;}
      if(object instanceof T.Points){
        const position=object.geometry.attributes.position;
        const vector=new T.Vector3();
        context.fillStyle='rgba(174,195,217,.65)';
        for(let i=0;i<position.count;i++){
          vector.fromBufferAttribute(position,i).project(camera);
          if(Math.abs(vector.x)<=1&&Math.abs(vector.y)<=1&&vector.z<1)context.fillRect((vector.x+1)*width*.5,(1-vector.y)*height*.5,i%7===0?2:1,1);
        }
        return;
      }
      if(object instanceof T.InstancedMesh){
        for(let i=0;i<object.count;i++){
          object.getMatrixAt(i,matrix);
          instanceWorld.multiplyMatrices(object.matrixWorld,matrix);
          center.setFromMatrixPosition(instanceWorld);
          if(center.distanceToSquared(worldCamera)>130**2||!frustum.containsPoint(center))continue;
          this.emit(object,instanceWorld,camera);
        }
      } else if(object instanceof T.Mesh&&frustum.intersectsObject(object))this.emit(object,object.matrixWorld,camera);
    });
    this.faces.length=this.count;
    this.faces.sort((a,b)=>b.depth-a.depth);
    context.lineWidth=.43;
    for(const f of this.faces){
      context.fillStyle=f.fill;
      context.beginPath();context.moveTo(f.x0,f.y0);context.lineTo(f.x1,f.y1);context.lineTo(f.x2,f.y2);context.closePath();
      context.fill();
      if(f.fill.endsWith(',1)')){context.strokeStyle=f.fill;context.stroke();}
    }
    for(const sprite of sprites){
      spritePoint.setFromMatrixPosition(sprite.matrixWorld).project(camera);
      if(spritePoint.z>=1||Math.abs(spritePoint.x)>1||Math.abs(spritePoint.y)>1)continue;
      const x=(spritePoint.x+1)*width*.5,y=(1-spritePoint.y)*height*.5;
      const gradient=context.createRadialGradient(x,y,2,x,y,40);
      gradient.addColorStop(0,'rgba(255,155,82,.57)');gradient.addColorStop(1,'rgba(255,155,82,0)');
      context.fillStyle=gradient;context.fillRect(x-40,y-40,80,80);
    }
  }
}
const fog=new T.Color('#1c202b');
