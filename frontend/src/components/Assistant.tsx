import {useEffect, useRef, useState} from 'react';
import {Bot, Send, X} from 'lucide-react';
import type {Answer,Artifact} from '../types';
import {api} from '../api';
import {Sources} from './Primitives';

const prompts=['What is the Lunar Roving Vehicle?','Why did Apollo astronauts leave equipment on the Moon?','What was the purpose of ALSEP?','How did Apollo 17 explore Taurus-Littrow?','What can we learn from these historical artifacts?'];
type Exchange={question:string;response?:Answer;error?:string};
export default function Assistant({artifact,onClose}:{artifact:Artifact|null;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const thread=useRef<HTMLDivElement>(null);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [messages,setMessages]=useState<Exchange[]>([]);
  useEffect(()=>{const element=dialog.current; if(element&&!element.open)element.showModal();return()=>{if(element?.open) element.close();};},[]);
  useEffect(()=>{ if(thread.current)thread.current.scrollTop=thread.current.scrollHeight;},[messages,busy]);
  async function ask(raw:string) {
    const question=raw.trim();
    if (!question||busy) return;
    setBusy(true);
    setInput('');
    setMessages(previous=>[...previous,{question}]);
    const finish=(exchange:Exchange)=>setMessages(previous=>[...previous.slice(0,-1),exchange]);
    try {finish({question,response:await api.ask(question,artifact?.id)});}
    catch (error) {finish({question,error:error instanceof Error?error.message:'Archive temporarily unavailable.'});}
    finally {setBusy(false);}
  }
  return <dialog ref={dialog} className="assistant" onCancel={event=>{event.preventDefault();onClose();}}>
    <div className="assistant-layout">
      <div className="assistant-heading"><span className="feature-icon"><Bot size={22}/></span><div><h2>Mission assistant</h2><p>Local document search · {artifact?.id ?? 'Apollo archive'}</p></div><button className="icon-button" aria-label="Close assistant" onClick={onClose}><X size={21}/></button></div>
      <div className="assistant-thread" ref={thread} aria-live="polite">
        <div className="assistant-reply">Ask about the Apollo 17 landing site, its hardware, or the surface experiments. Replies come from the mission’s reference archive.</div>
        {messages.map(({question,response,error},index)=><div className="exchange" key={index}><div className="assistant-question">{question}</div>{response&&<div className="assistant-reply"><p>{response.answer}</p><Sources sources={response.sources}/></div>}{error&&<div className="assistant-reply error-text">{error}</div>}</div>)}
        {busy&&<div className="assistant-reply">Searching archive…</div>}
      </div>
      <div className="suggestions">{(artifact?['What is the purpose of this artifact?',...prompts.slice(1)]:prompts).map(value=><button key={value} disabled={busy} onClick={()=>void ask(value)}>{value}</button>)}</div>
      <form onSubmit={event=>{event.preventDefault();void ask(input);}}><input aria-label="Ask the mission assistant" placeholder="Ask about Apollo heritage…" value={input} maxLength={500} onChange={event=>setInput(event.target.value)}/><button type="submit" className="button primary" disabled={busy||!input.trim()} aria-label="Send question"><Send size={17}/></button></form>
    </div>
  </dialog>;
}
