import {useEffect,useState} from 'react';
import {ArrowUpRight,Check,MapPin,Play,ScanLine} from 'lucide-react';
import {artifactIds,artifacts,artifactStations} from './artifacts';
import type {ArtifactId} from './artifacts';

const format=(value:number,decimals:number)=>new Intl.NumberFormat('en',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);

export function ArtifactPanel({id,onClose,onReplay}:{id:ArtifactId;onClose:()=>void;onReplay:()=>void}) {
  const artifact=artifacts[id];
  const [replay,setReplay]=useState(0);
  const [progress,setProgress]=useState(0);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setProgress(1);return;}
    const start=performance.now();
    let frame=0;
    const animate=(now:number)=>{
      const elapsed=Math.min(1,(now-start)/2300);
      setProgress(elapsed);
      if(elapsed<1)frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(frame);
  },[id,replay]);
  return <div className="heritage-detail">
    <div className="moon-dialog-label"><ScanLine size={15}/> HERITAGE SCAN · {artifact.year}</div>
    <h2 id="moon-dialog-title">{artifactStations[id].name}</h2>
    <div className="heritage-origin">{artifact.origin} · Training replica</div>
    <p className="heritage-location"><MapPin size={15}/> Original site · {artifact.location}</p>
    <figure className="heritage-photo">
      <div><img src={artifact.photo} alt={artifact.alt}/><span className="heritage-sweep" style={{top:(progress*100)+'%',opacity:progress<1?.85:0}} aria-hidden="true"/></div>
      <figcaption>{artifact.credit}</figcaption>
    </figure>
    <p className="moon-dialog-copy">{artifact.description}</p>
    <div className="heritage-data">
      {artifact.measures.map(item=><div key={item.label}>
        <span>{item.label}</span>
        <strong aria-hidden="true">{format(item.value*progress,item.decimals)} <small>{item.unit}</small></strong>
        <span className="sr-only">{format(item.value,item.decimals)} {item.unit}</span>
        <div className="heritage-meter" aria-hidden="true"><i style={{transform:`scaleX(${progress})`}}/></div>
      </div>)}
    </div>
    <p className="moon-inline-note">{artifact.footnote}</p>
    <div className="heritage-links">
      <a className="moon-source-link" href={artifact.imageSource} target="_blank" rel="noreferrer">Archive image <ArrowUpRight size={13}/></a>
      <a className="moon-source-link" href={artifact.dataSource} target="_blank" rel="noreferrer">Data source <ArrowUpRight size={13}/></a>
    </div>
    <div className="moon-dialog-actions"><button className="moon-alt" onClick={onClose}>Back to surface</button><button className="moon-primary" onClick={()=>{setReplay(value=>value+1);onReplay();}}><Play size={16}/>{artifact.dataLabel}</button></div>
  </div>;
}

export function HeritageLog({discovered,onRead,onWalk}:{discovered:ArtifactId[];onRead:(id:ArtifactId)=>void;onWalk:(id:ArtifactId)=>void}) {
  return <>
    <div className="moon-dialog-label">SHACKLETON OUTPOST</div>
    <h2 id="moon-dialog-title">Lunar heritage</h2>
    <p className="moon-dialog-copy">{discovered.length} of {artifactIds.length} scanned. Walk to an amber beacon to open its archive. The exhibits are replicas of items at different sites across the Moon.</p>
    <div className="heritage-log-list">
      {artifactIds.map(id=>{
        const found=discovered.includes(id);
        return <section key={id}>
          <div><span>{found?<Check size={15}/>:<ScanLine size={15}/>}<b>{artifactStations[id].name}</b></span><small>{found?artifacts[id].location:'Scan pending'}</small></div>
          <button className={found?'moon-alt':'moon-primary'} onClick={()=>found?onRead(id):onWalk(id)}>{found?'View archive':'Walk to replica'}</button>
        </section>;
      })}
    </div>
  </>;
}
