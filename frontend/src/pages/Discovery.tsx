import {ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, MessageSquare, Satellite} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import {Eyebrow, Notice, Sources} from '../components/Primitives';
import type {Artifact} from '../types';

const mapSource='https://science.nasa.gov/image-article/apod-2011-september-8-apollo-17-site-a-sharper-view/';

export default function Discovery({catalogue,discovered,error,onRetry,onAsk}:{catalogue:Artifact[]|null;discovered:string[];error:string;onRetry:()=>void;onAsk:(item:Artifact)=>void}) {
  const {id}=useParams();
  const item=catalogue?.find(entry=>entry.id===id);
  return <main className="page-shell archive">
    {id&&<Link className="text-link" to="/discovery"><ArrowLeft size={15}/> Apollo archive</Link>}
    <div className="page-heading"><Eyebrow>APOLLO / HERITAGE ARCHIVE</Eyebrow><h1>{item?.name ?? 'Space heritage'}</h1><p>{item?.mission ?? 'Artifacts from the Apollo 17 landing site.'}</p></div>
    {error&&<><Notice>{error}</Notice><button className="button secondary" onClick={onRetry}>Retry archive</button></>}
    {!catalogue&&!error&&<p role="status">Loading the Apollo archive…</p>}
    {catalogue&&id&&!item&&<Notice>This archive entry is unavailable.</Notice>}
    {catalogue&&!id&&<>
      <div className="archive-grid">{catalogue.map(entry=><Link className="panel archive-card" key={entry.id} to={'/discovery/'+entry.id}>
        <img src={entry.image} alt={'Illustration of '+entry.name}/><div><span className="archive-tag">{entry.id} / {entry.year}{discovered.includes(entry.id)?' / LOGGED':''}</span><h2>{entry.name}</h2><p>{entry.short}</p><span className="text-link">Open archive entry <ArrowRight size={16}/></span></div>
      </Link>)}</div>
      <section className="panel pad archive-map"><Satellite size={24}/><div><h2>Where the artifacts remained</h2><p>NASA’s annotated orbital image identifies the rover’s final parking spot, Challenger’s descent stage and the ALSEP station.</p></div><a className="button secondary" href={mapSource} target="_blank" rel="noreferrer">Open NASA site map <ArrowUpRight size={16}/></a></section>
      <details className="panel nasa-map"><summary>View annotated orbital image</summary><figure><a href={mapSource} target="_blank" rel="noreferrer"><img src="/images/apollo17-lro.webp" loading="lazy" alt="Annotated Apollo 17 orbital image showing ALSEP at left, Challenger descent stage near center and the rover toward the right"/></a><figcaption>NASA / GSFC / Arizona State University / Lunar Reconnaissance Orbiter</figcaption></figure></details>
    </>}
    {item&&<div className="artifact-detail">
      <figure className="panel"><img src={item.image} alt={'Illustration of '+item.name}/><figcaption>Illustration · Apollo 17 · {item.year}</figcaption></figure>
      <section className="panel pad"><div className="archive-tag">{item.id} / {item.year} {discovered.includes(item.id)&&' / LOGGED IN MISSION'}</div>
        <p className="artifact-summary">{item.description}</p>
        <h2>Function</h2><p>{item.function}</p><h2>Historical and scientific value</h2><p>{item.importance}</p><h2>Site location</h2><p>{item.placement}</p>
        <h2 className="source-heading"><BookOpen size={18}/> Documentary sources</h2><Sources sources={item.sources}/>
        <button className="button primary" onClick={()=>onAsk(item)}><MessageSquare size={17}/>Ask AI</button>
      </section>
    </div>}
  </main>;
}
