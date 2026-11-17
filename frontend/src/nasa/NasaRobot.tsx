import {Fragment,useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
import {ArrowUpRight,AudioLines,ChartNoAxesColumn,Database,Radio,Send,ShieldCheck,X} from 'lucide-react';
import type {Answer,Reading,Topic} from './knowledge';
import {cometMessage} from './conversation';
import type {CometLanguage} from './conversation';
import './robot.css';

const prompts={en:[
  {label:'Crew oxygen',question:'How much oxygen for 2 astronauts for 6 days?'},
  {label:'Radiation',question:'How much did radiation change inside Orion’s storm shelter?'},
  {label:'Moonwalkers',question:'How many astronauts walked on the Moon?'},
  {label:'Space crops',question:'What did NASA grow in Veggie?'},
],fr:[
  {label:'Oxygène',question:'Combien d’oxygène pour 2 astronautes pendant 6 jours ?'},
  {label:'Abri',question:'Pourquoi un abri protège-t-il du rayonnement ?'},
  {label:'La Lune',question:'Combien d’astronautes ont marché sur la Lune ?'},
  {label:'Plantes',question:'La NASA a-t-elle cultivé des plantes dans l’espace ?'},
]};
const frenchClassification={
  'NASA measurement':'Mesure NASA',
  'NASA planning estimate':'Estimation NASA',
  'Calculated from NASA values':'Calcul à partir de données NASA',
  'NASA archive':'Archive NASA',
};
type Exchange={question:string;language:CometLanguage;answer?:Answer};


function RobotFace({searching=false}:{searching?:boolean}) {
  return <span className={'nasa-face'+(searching?' searching':'')} aria-hidden="true">
    <span className="nasa-antenna"/><span className="nasa-visor"><i/><i/></span>
  </span>;
}

function RichText({text}:{text:string}) {
  return <>{text.split('**').map((part,index)=>index%2?<strong key={index}>{part}</strong>:<Fragment key={index}>{part}</Fragment>)}</>;
}

function ReadingGraphic({readings,language}:{readings:Reading[];language:CometLanguage}) {
  const comparable=readings.length>1&&readings.every(reading=>reading.unit===readings[0].unit);
  const maximum=Math.max(...readings.map(reading=>reading.value));
  return <div className={'nasa-readings'+(comparable?' compare':'')}>
    {readings.map(({label,value,unit,digits=2})=><div className="nasa-reading" key={label}>
      <span>{label}</span><strong>{value.toLocaleString(language==='fr'?'fr-FR':'en-US',{maximumFractionDigits:digits})}{unit==='%'?'%':unit?' '+unit:''}</strong>
      {comparable&&<span className="nasa-bar" aria-hidden="true"><i style={{width:maximum?100*value/maximum+'%':'0%'}}/></span>}
    </div>)}
  </div>;
}

function Reply({answer,language}:{answer:Answer;language:CometLanguage}) {
  return <div className="nasa-reply">
    <div className="nasa-reply-label"><AudioLines size={13}/><span>COMET</span>{answer.classification&&<small>{language==='fr'?frenchClassification[answer.classification]:answer.classification}</small>}</div>
    <p lang={language}><RichText text={answer.text}/></p>
    {answer.readings&&<ReadingGraphic readings={answer.readings} language={language}/>}
    {answer.evidence.length>0&&<div className="nasa-sources">
      {answer.evidence.map(({name,record,url})=><a href={url} key={url} target="_blank" rel="noreferrer">
        <Database size={15}/><span><strong>{name}</strong><small>{record}</small></span><ArrowUpRight size={15}/>
      </a>)}
    </div>}
  </div>;
}

export default function NasaRobot() {
  const [open,setOpen]=useState(false);
  const [text,setText]=useState('');
  const [thread,setThread]=useState<Exchange[]>([]);
  const [pending,setPending]=useState(false);
  const [language,setLanguage]=useState<CometLanguage>('en');
  const french=language==='fr';
  const dialog=useRef<HTMLDialogElement>(null);
  const log=useRef<HTMLDivElement>(null);
  const launcher=useRef<HTMLButtonElement>(null);
  const prior=useRef<Topic|undefined>(undefined);
  const busy=useRef(false);
  const opener=useRef<HTMLElement|null>(null);

  function close() {setOpen(false);}
  useEffect(()=>{
    function launch() {
      opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
      setOpen(true);
    }
    window.addEventListener('nasa-robot-open',launch);
    return()=>window.removeEventListener('nasa-robot-open',launch);
  },[]);
  useEffect(()=>{
    const panel=dialog.current;
    if(open&&!panel?.open)panel?.showModal();
    else if(!open&&panel?.open){
      panel.close();
      (opener.current?.isConnected?opener.current:launcher.current)?.focus();
    }
  },[open]);
  useEffect(()=>{
    if(open&&log.current)log.current.scrollTop=log.current.scrollHeight;
  },[open,thread]);
  useEffect(()=>{
    const viewport=window.visualViewport;
    const panel=dialog.current;
    if(!open||!viewport||!panel)return;
    const reposition=()=>{
      const offset=Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop);
      panel.style.setProperty('--nasa-keyboard-offset',offset+'px');
      panel.style.setProperty('--nasa-visible-height',viewport.height+'px');
    };
    reposition();
    viewport.addEventListener('resize',reposition);
    viewport.addEventListener('scroll',reposition);
    return()=>{
      viewport.removeEventListener('resize',reposition);
      viewport.removeEventListener('scroll',reposition);
      panel.style.removeProperty('--nasa-keyboard-offset');
      panel.style.removeProperty('--nasa-visible-height');
    };
  },[open]);

  async function ask(input:string) {
    const question=input.trim();
    if(!question||busy.current)return;
    const {language:replyLanguage,reply}=cometMessage(question,language);
    const turn={question,language:replyLanguage};
    setLanguage(replyLanguage);
    setText('');
    if(reply){
      setThread(previous=>[...previous.slice(-11),{...turn,answer:{text:reply,evidence:[]}}]);
      return;
    }
    busy.current=true;
    setPending(true);
    setThread(previous=>[...previous.slice(-11),turn]);
    try {
      const {answerFromComet}=await import('./knowledge');
      const answer=answerFromComet(question,prior.current,replyLanguage);
      if(answer.topic)prior.current=answer.topic;
      setThread(previous=>[...previous.slice(0,-1),{...turn,answer}]);
    } catch {
      const error=replyLanguage==='fr'?'Je n’ai pas pu charger mes sources NASA. Réessaie.':'I couldn’t load my NASA library. Try asking again.';
      setThread(previous=>[...previous.slice(0,-1),{...turn,answer:{text:error,evidence:[]}}]);
    } finally {
      busy.current=false;
      setPending(false);
    }
  }
  function submit(event:FormEvent<HTMLFormElement>) {event.preventDefault();void ask(text);}

  return <>
    <button className="nasa-launcher" ref={launcher} onClick={()=>{opener.current=launcher.current;setOpen(true);}} aria-label="Ask Comet" aria-expanded={open} aria-controls="nasa-chat">
      <RobotFace/><span className="nasa-launcher-text">Ask Comet</span>
    </button>
    <dialog className="nasa-chat" id="nasa-chat" ref={dialog} aria-labelledby="nasa-chat-title" lang={language} onCancel={event=>{event.preventDefault();close();}}>
      <header className="nasa-chat-head">
        <RobotFace searching={pending}/>
        <div><h2 id="nasa-chat-title">Comet</h2><p><ShieldCheck size={12}/> {french?'Réponses scientifiques sourcées par la NASA':'Science answers from NASA sources'}</p></div>
        <button className="nasa-close" aria-label={french?'Fermer la discussion avec Comet':'Close Comet chat'} onClick={close}><X size={18}/></button>
      </header>
      <div className="nasa-chat-log" ref={log} role="log" aria-label="Conversation with Comet" aria-live="polite">
        {thread.length===0&&<div className="nasa-welcome">
          <Radio size={22}/>
          <h3>Hi, I’m Comet!</h3>
          <p>Say hello in English or French, or ask me about the Moon.</p>
        </div>}
        {thread.map(({question,answer,language:turnLanguage},index)=><div className="nasa-turn" key={index}>
          <p className="nasa-question">{question}</p>
          {answer?<Reply answer={answer} language={turnLanguage}/>:<div className="nasa-search" role="status"><span/><span/><span/> {turnLanguage==='fr'?'Je consulte mes sources NASA…':'Checking NASA sources…'}</div>}
        </div>)}
      </div>
      <div className="nasa-chat-foot">
        <div className="nasa-prompts" aria-label="Suggested questions">
          {prompts[language].map(({label,question})=><button key={label} disabled={pending} onClick={()=>void ask(question)}>{label==='Crew oxygen'&&<ChartNoAxesColumn size={12}/>} {label}</button>)}
        </div>
        <form onSubmit={submit} className="nasa-input">
          <label htmlFor="comet-question" className="sr-only">{french?'Pose ta question à Comet':'Ask Comet a question'}</label>
          <input id="comet-question" value={text} onChange={event=>setText(event.target.value)} placeholder={french?'Pose ta question…':'Ask a space question…'} maxLength={220} autoComplete="off"/>
          <button disabled={pending||!text.trim()} aria-label={french?'Envoyer la question':'Send question'}><Send size={17}/></button>
        </form>
        <p className="nasa-footnote">{french?'Ouvre un lien NASA pour vérifier la réponse.':'Open a NASA link to check the answer.'}</p>
      </div>
    </dialog>
  </>;
}
