"use client";
import { Card } from "@/components/ui/primitives";
import { FEEDBACK_QUESTIONS } from "./feedbackQuestions";
import type { FeedbackResponses } from "@/lib/draftStorage";

/** Compact by default; the full research instrument opens only on request. */
export default function FeedbackPrompt({feedback,setFeedback,open,setOpen,submitted,onSubmit}:{
  feedback:FeedbackResponses;setFeedback:(f:(p:FeedbackResponses)=>FeedbackResponses)=>void;
  open:boolean;setOpen:(f:(o:boolean)=>boolean)=>void;submitted:boolean;onSubmit:()=>void;}){
  const feedbackOpen=open;const setFeedbackOpen=setOpen;const feedbackSubmitted=submitted;
  return <><div className="feedback-compact"><b>Was this synthesis useful?</b><div className="feedback-row">{([["agree","Yes"],["partly","Partly"],["disagree","No"]] as const).map(([k,l])=><button key={k} type="button" className={feedback.clinicianAgreed===k?"selected":""} onClick={()=>setFeedback(f=>({...f,clinicianAgreed:k}))}>{l}</button>)}</div><button type="button" className="link-button" onClick={()=>setFeedbackOpen(o=>!o)}>{feedbackOpen?"Hide research feedback":"Provide research feedback"}</button></div>{feedbackOpen&&<Card title="Clinician feedback" className="feedback-card"><p className="section-intro">Prototype usability capture for the three product goals. Categorical responses and timestamps only — no clinical values, free text, or identifiers are stored.</p>{FEEDBACK_QUESTIONS.map(q=><div key={q.key} className="feedback-block"><b>{q.label}</b><div className="feedback-row">{q.options.map(([k,l])=><button key={k} type="button" className={(feedback as Record<string,string>)[q.key]===k?"selected":""} onClick={()=>setFeedback(f=>({...f,[q.key]:k}))}>{l}</button>)}</div></div>)}<button type="button" className="primary" disabled={feedbackSubmitted} onClick={onSubmit}>{feedbackSubmitted?"Recorded":"Submit feedback"}</button>{feedbackSubmitted&&<p className="field-note">Recorded for future usability evaluation. No time-saving claim is made until prospectively measured.</p>}</Card>}</>;
}
