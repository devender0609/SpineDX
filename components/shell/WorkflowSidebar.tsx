"use client";
import type { ValidationIssue } from "@/lib/validation";
import type { RapidRequirement } from "@/lib/rapidRequirements";

/**
 * Sticky desktop workflow navigation. Replaces the former floating stepper; collapses to a
 * horizontal strip below 980px. Status is conveyed by icon, text and colour together.
 */
export default function WorkflowSidebar({activeMode,switchMode,modeCopy,steps,step,setStep,issues,domainStep,outOfScope,outstanding,suggestions}:{
  activeMode:"rapid"|"comprehensive";switchMode:(m:"rapid"|"comprehensive")=>void;
  modeCopy:{title:string;blurb:string};steps:readonly string[];step:number;setStep:(n:number)=>void;
  issues:ValidationIssue[];domainStep:Record<string,number>;outOfScope:boolean;
  outstanding:RapidRequirement[];suggestions:string[];}){
  return <aside className="sidebar" aria-label="Workflow">
      <div className="side-mode">
        <div className="segmented compact" role="radiogroup" aria-label="Review mode">
          <button type="button" role="radio" aria-checked={activeMode==="rapid"} className={activeMode==="rapid"?"on":""} onClick={()=>switchMode("rapid")}>Rapid</button>
          <button type="button" role="radio" aria-checked={activeMode==="comprehensive"} className={activeMode==="comprehensive"?"on":""} onClick={()=>switchMode("comprehensive")}>Comprehensive</button>
        </div>
        <p className="side-mode-copy">{modeCopy.blurb}</p>
      </div>

      <ol className="side-steps">
        {steps.map((x,i)=>{
          const errs=issues.filter(v=>domainStep[v.domain]===i&&v.severity==="error").length;
          const warns=issues.filter(v=>domainStep[v.domain]===i&&v.severity==="warning").length;
          const state=step===i?"current":step>i?"done":"todo";
          return <li key={x}>
            <button type="button" className={`side-step ${state}`} disabled={outOfScope&&i>=2&&i<=4} onClick={()=>setStep(i)} aria-current={step===i?"step":undefined}>
              <span className="dot" aria-hidden="true">{state==="done"?"✓":i+1}</span>
              <span className="side-step-label">{x}</span>
              {errs>0?<span className="side-flag err">{errs} issue{errs>1?"s":""}</span>
               :warns>0?<span className="side-flag warn">{warns}</span>:null}
            </button>
          </li>;
        })}
      </ol>

      {activeMode==="rapid"&&<div className="side-count">
        <b>{outstanding.length===0?"All confirmations complete":`${outstanding.length} confirmation${outstanding.length===1?"":"s"} remaining`}</b>
        {outstanding.length>0&&<span>{outstanding.slice(0,3).map(r=>r.label).join(" · ")}</span>}
      </div>}

      {suggestions.length>0&&activeMode==="rapid"&&<div className="side-rec">
        <b>Comprehensive recommended</b><span>{suggestions[0]}</span>
        <button type="button" onClick={()=>switchMode("comprehensive")}>Switch</button>
      </div>}
    </aside>
}
