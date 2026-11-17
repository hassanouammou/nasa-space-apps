import {useRef,useState} from 'react';
import {ArrowRight,BookOpen,CheckCircle2,Footprints,MapPin,RotateCcw,Trophy} from 'lucide-react';
import {cadetQuiz,cadetScore,cadetTasks} from './juniorGuide';
import type {Drill} from './fieldwork';

type GuideProps={drill:Drill;readyForHabitat:boolean;finished:boolean;onContinue:()=>void};
export function JuniorGuide({drill,readyForHabitat,finished,onContinue}:GuideProps) {
  const task=cadetTasks[drill];
  return <section className="junior">
    <div className="moon-dialog-label"><BookOpen size={15}/> CADET GUIDE</div>
    <h2 id="moon-dialog-title">Your Moon mission</h2>
    <p className="moon-dialog-copy">You have six Moon days to help two astronauts stay safe, grow food, and explore.</p>
    <ol className="junior-guide-list">
      <li><span>1</span><div><strong>Find the glowing marker</strong><p>Tap <b>Show me the way</b> for a guided walk. You can also walk with the arrow keys or on-screen arrows.</p></div></li>
      <li><span>2</span><div><strong>Try the hands-on task</strong><p>Each station shows you what to move, match, or find. A check mark tells you when you’re done.</p></div></li>
      <li><span>3</span><div><strong>Go home and plan</strong><p>Back at the Habitat, choose what the crew will do. Check your power, then tap <b>Run Day</b> to see what happens.</p></div></li>
    </ol>
    <div className="junior-next">
      <small>{finished?'MISSION FINISHED':'YOUR NEXT STEP'}</small>
      <strong>{finished?'Review your mission':readyForHabitat?'Go back to the Habitat':task.title}</strong>
      <p>{finished?'See what you did on the Moon, then take the cadet quiz.':readyForHabitat?'Your station task is done. It’s time to choose a plan for the crew.':task.action}</p>
    </div>
    <button className="moon-primary junior-go" onClick={onContinue}>{finished?<Trophy size={17}/>:<Footprints size={17}/>} {finished?'Open mission recap':'Back to the Moon'} <ArrowRight size={16}/></button>
  </section>;
}

export function EndQuiz({onFinish,onClose}:{onFinish:(score:number)=>void;onClose:()=>void}) {
  const [answers,setAnswers]=useState<number[]>([]);
  const [selection,setSelection]=useState<number|null>(null);
  const [checked,setChecked]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const question=cadetQuiz[answers.length];
  const total=cadetQuiz.length;
  const score=cadetScore(answers);
  function next() {
    if(selection===null)return;
    const updated=[...answers,selection];
    setAnswers(updated);
    setSelection(null);
    setChecked(false);
    if(updated.length===total)onFinish(cadetScore(updated));
    heading.current?.focus();
  }
  function retake() {
    setAnswers([]);
    setSelection(null);
    setChecked(false);
    heading.current?.focus();
  }
  return <section className="junior">
    <div className="moon-dialog-label"><Trophy size={15}/> CADET QUIZ</div>
    <h2 id="moon-dialog-title" ref={heading} tabIndex={-1}>{question?'Ready, Cadet?':'Quiz complete!'}</h2>
    {question?<form onSubmit={event=>{event.preventDefault();if(checked)next();else if(selection!==null)setChecked(true);}}>
      <div className="junior-quiz-meta"><span>Question {answers.length+1} of {total}</span><span>{question.topic}</span></div>
      <progress max={total} value={answers.length} aria-label="Quiz progress"/>
      <fieldset>
        <legend>{question.question}</legend>
        {question.choices.map((choice,index)=><label className={'junior-choice'+(checked&&index===question.correct?' correct':'')} key={choice}>
          <input type="radio" name="cadet-choice" checked={selection===index} onChange={()=>setSelection(index)} disabled={checked}/>{choice}
        </label>)}
      </fieldset>
      {checked&&<div className="junior-next" role="status"><strong>{selection===question.correct?'You got it!':'Good try!'}</strong><p>{question.explanation}</p></div>}
      <button className="moon-primary junior-go" type="submit" disabled={selection===null}>{checked?(answers.length+1===total?'See my score':'Next question'):'Check my answer'} <ArrowRight size={16}/></button>
    </form>:<>
      <div className="junior-result"><Trophy size={28}/><strong>{score} / {total}</strong><span>{score===total?'Moon expert!':'Every mission teaches you something.'}</span></div>
      <ul className="junior-review">{cadetQuiz.map((item,index)=><li key={item.topic}>{answers[index]===item.correct?<CheckCircle2 size={15}/>:<MapPin size={15}/>}<div><strong>{item.topic}</strong><p>{item.explanation}</p></div></li>)}</ul>
      <div className="moon-dialog-actions"><button className="moon-alt" onClick={retake}><RotateCcw size={15}/>Try again</button><button className="moon-primary" onClick={onClose}>Back to recap</button></div>
    </>}
  </section>;
}
