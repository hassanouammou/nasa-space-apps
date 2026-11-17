import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Footprints,Radio} from 'lucide-react';
import './comic.css';

const pages=[
  {chapter:'THE CALL',title:'Welcome, Cadet.',caption:'An astronaut looks over the lunar outpost, with Earth in the sky.',voice:'Mission Control',line:'You’re in charge for six days. Keep two astronauts safe, grow food, and find out what’s hiding in the dust.',action:'Your job is to keep the outpost running.'},
  {chapter:'THE FIRST WALK',title:'Follow the glow.',caption:'The astronaut follows blue markers toward the life-support station.',voice:'Mission Control',line:'See that glowing marker? It leads to Life Support. Tap Show me the way for a guided walk, or use the arrows to move.',action:'First stop · Life Support'},
  {chapter:'THE OXYGEN CHECK',title:'Lock the blue ring.',caption:'A gloved hand guides a blue coupling toward a gold socket.',voice:'Mission Control',line:'Slide the blue ring into the gold slot and hold it there. Then go back to the habitat to plan the day.',action:'Keep enough electricity for air, water, and food.'},
  {chapter:'THE SCOUT',title:'Listen to the Moon.',caption:'A rover sends a bright data pulse toward the habitat antenna.',voice:'Scout 01',line:'I’ll scan the ground and send you the readings. Open Rover live to follow me. Later, you’ll choose where to explore.',action:'Use NASA terrain readings to make your own call.'},
] as const;

export function MissionComic({onLaunch,onSkip}:{onLaunch:()=>void;onSkip:()=>void}) {
  const [index,setIndex]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const page=pages[index];
  const last=index===pages.length-1;
  useEffect(()=>{if(index>0)heading.current?.focus();},[index]);
  return <article className="mission-comic">
    <div className="comic-top"><span><BookOpen size={15}/> JUNIOR ASTRONAUT · MISSION BRIEFING</span><strong>PAGE {index+1} / {pages.length}</strong></div>
    <div className="comic-spread" key={index}>
      <div className="comic-art"><img src={`/moon/comic/page-${index+1}.webp`} alt={page.caption}/></div>
      <div className="comic-copy">
        <span className="comic-chapter">{page.chapter}</span>
        <h2 id="moon-dialog-title" tabIndex={-1} ref={heading}>{page.title}</h2>
        <div className="comic-bubble"><b><Radio size={14}/>{page.voice}</b><p>{page.line}</p></div>
        <p className="comic-action">{page.action}</p>
      </div>
    </div>
    <nav className="comic-nav" aria-label="Briefing pages">
      <button className="moon-alt" onClick={()=>setIndex(index-1)} disabled={index===0}><ArrowLeft size={15}/> Back</button>
      <div className="comic-pages">{pages.map((item,i)=><button key={item.chapter} aria-label={`Go to page ${i+1}`} aria-current={i===index?'step':undefined} onClick={()=>setIndex(i)}>{i+1}</button>)}</div>
      <button className="moon-primary" onClick={last?onLaunch:()=>setIndex(index+1)}>{last?<><Footprints size={16}/> Start moonwalk</>:<>Next page <ArrowRight size={16}/></>}</button>
    </nav>
    <button className="comic-skip" onClick={onSkip}>Skip briefing</button>
  </article>;
}
