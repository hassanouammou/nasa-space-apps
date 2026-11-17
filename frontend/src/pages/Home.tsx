import {Activity, ArrowDown, ArrowRight, Compass, Flag, Layers3, Moon, Radar, Telescope, Timer} from 'lucide-react';
import {Link} from 'react-router-dom';
import {motion, useReducedMotion} from 'framer-motion';
import {Eyebrow} from '../components/Primitives';

const features = [
  {Icon:Compass,title:'Mission Trainer',description:'Plan your traverse, collect lunar samples and make the decisions that bring your astronaut safely home.'},
  {Icon:Activity,title:'Astronaut Health',description:'Track simulated vitals and suit reserves. Decide when to rest, push on, or call it early.'},
  {Icon:Telescope,title:'Space Heritage',description:'Locate Apollo hardware and explore its story through a sourced lunar archive.'},
];

export default function Home({resumable}:{resumable:boolean}) {
  const reduced = useReducedMotion();
  return <>
    <main className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-image" src="/images/lunar-eva.webp" alt="Illustration of a suited astronaut traversing a rocky lunar valley"/>
        <div className="hero-shade"/>
        <motion.div className="hero-copy" initial={reduced ? false : {opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.55}}>
          <Eyebrow>LUNAR SURFACE OPERATIONS</Eyebrow>
          <h1 id="hero-title">JUNIOR<br/><span>ASTRONAUT</span></h1>
          <p className="hero-tagline">Explore space. Make decisions.<br className="desktop-break"/> Protect your astronaut.<br className="desktop-break"/> Discover humanity’s space heritage.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/briefing"><Flag size={16}/>Start Mission<ArrowRight size={18}/></Link>
            <a className="button secondary" href="#project-overview" onClick={event=>{event.preventDefault();document.getElementById('project-overview')?.scrollIntoView({behavior:reduced?'instant':'smooth'});}}>About the project<ArrowDown size={16}/></a>
          </div>
          {resumable && <Link to="/mission" className="resume-link">Resume your current traverse <ArrowRight size={14}/></Link>}
        </motion.div>
        <div className="hero-location"><Radar size={17}/><span>TAURUS–LITTROW VALLEY<small>MOON / LUNA-01</small></span></div>
      </section>
      <div className="brief-strip">
        <div><Moon/><span><small>DESTINATION</small><b>Taurus–Littrow, Moon</b></span></div>
        <div><Timer/><span><small>SIMULATED WINDOW</small><b>6 hours</b></span></div>
        <div><Layers3/><span><small>MISSION PROFILE</small><b>Surface exploration</b></span></div>
      </div>
      <section className="overview" id="project-overview">
        <Eyebrow>THE EXPERIENCE</Eyebrow>
        <h2>One mission. Three disciplines.</h2>
        <div className="feature-grid">{features.map(({Icon,title,description})=><article key={title}><span className="feature-icon"><Icon size={22}/></span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
    </main>
    <footer className="landing-footer"><span>SPACEFORALL / JUNIOR ASTRONAUT</span><span>LUNA-01 is a fictional educational mission inspired by Apollo.</span></footer>
  </>;
}
