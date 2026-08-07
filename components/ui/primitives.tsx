"use client";
/**
 * Shared presentational primitives. Extracted from the former monolith so that form
 * rendering lives in one place and no step re-implements a control.
 * These components hold NO clinical interpretation — that stays in lib/.
 */
import type { ReactNode } from "react";

import type { ClinicalStatus, Measurement } from "@/lib/schema";
import type { DecisionOutput } from "@/lib/decisionEngine";
type FindingTone=DecisionOutput["highlights"][number]["tone"];
import type { ValidationIssue } from "@/lib/validation";

export { label, labels } from "./labels";
import { label, clinicalStatuses, levels, grades } from "./labels";
export const STATUS_SHORT:Record<string,string>={"present":"Yes","absent":"No","unknown":"Unknown","not-assessed":"Not assessed","not-applicable":"N/A"};

export function Card({title,children,className="",action}:{title:string;children:ReactNode;className?:string;action?:ReactNode}){return <section className={`card ${className}`}><div className="card-heading"><div className="card-title">{title}</div>{action}</div>{children}</section>}
export function Field({label:fieldLabel,children,hint,required,fieldId}:{label:string;children:ReactNode;hint?:string;required?:string;fieldId?:string}){return <label className="field" data-field={fieldId}><span>{fieldLabel}{required&&<em>{required}</em>}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function Select<T extends string>({value,options,onChange}:{value:T;options:readonly T[];onChange:(v:T)=>void}){return <select value={value} onChange={e=>onChange(e.target.value as T)}>{options.map(x=><option key={x} value={x}>{label(x)}</option>)}</select>}
/** Frequent categorical answers are segmented controls, not dropdowns: one tap, no menu. */
export function Segmented<T extends string>({value,options,onChange,labels,name}:{value:T;options:readonly T[];onChange:(v:T)=>void;labels?:Record<string,string>;name?:string}){
  return <div className="segmented" role="radiogroup" aria-label={name}>
    {options.map(o=><button key={o} type="button" role="radio" aria-checked={value===o} className={value===o?"on":""} onClick={()=>onChange(o)}>{labels?.[o]??label(o)}</button>)}
  </div>;
}
export function StatusField({label:fieldLabel,value,onChange,hint,allowNA=false,fieldId}:{label:string;value:ClinicalStatus;onChange:(v:ClinicalStatus)=>void;hint?:string;allowNA?:boolean;fieldId?:string}){
  const options=(allowNA?clinicalStatuses:clinicalStatuses.filter(x=>x!=="not-applicable")) as readonly ClinicalStatus[];
  return <Field label={fieldFieldLabelShim(fieldLabel)} hint={hint} fieldId={fieldId}><Segmented value={value} options={options} onChange={onChange} labels={STATUS_SHORT} name={fieldLabel}/></Field>;
}
const fieldFieldLabelShim=(x:string)=>x;
/** Short categorical lists render as segmented controls; long lists stay dropdowns. */
export function ChoiceField<T extends string>({label:l,value,options,onChange,hint,labels,fieldId}:{label:string;value:T;options:readonly T[];onChange:(v:T)=>void;hint?:string;labels?:Record<string,string>;fieldId?:string}){
  return <Field label={l} hint={hint} fieldId={fieldId}>
    {options.length<=5
      ?<Segmented value={value} options={options} onChange={onChange} labels={labels} name={l}/>
      :<Select value={value} options={options} onChange={onChange}/>}
  </Field>;
}
export function MeasurementField({label:fieldLabel,m,onChange,min,max,step=1,hint}:{label:string;m:Measurement;onChange:(m:Measurement)=>void;min?:number;max?:number;step?:number;hint?:string}){
  const invalid=m.status==="measured"&&(m.value===null||(min!==undefined&&m.value<min)||(max!==undefined&&m.value>max));
  return <Field label={fieldLabel} hint={hint}><div className={`measurement ${invalid?"invalid":""}`}><select value={m.status} onChange={e=>onChange({...m,status:e.target.value as Measurement["status"],value:e.target.value==="measured"?m.value:null})}>{["not-measured","measured","unknown","not-applicable"].map(x=><option key={x} value={x}>{label(x)}</option>)}</select>{m.status==="measured"&&<div className="value-with-unit"><input type="number" value={m.value??""} min={min} max={max} step={step} onChange={e=>onChange({...m,value:e.target.value===""?null:Number(e.target.value)})}/><span>{m.unit}</span></div>}</div>{invalid&&<small className="inline-error">Enter a value within {min}–{max}.</small>}</Field>
}
export function ToneBadge({tone,children}:{tone:FindingTone;children:ReactNode}){return <span className={`tone-badge tone-${tone}`}>{children}</span>}
export function List({items,emptyText}:{items:string[];emptyText?:string}){return items.length?<ul className="finding-list">{items.map((x,i)=><li key={`${x}-${i}`}>{x}</li>)}</ul>:emptyText?<p className="muted">{emptyText}</p>:null}
export function IssuePanel({issues,onJump}:{issues:ValidationIssue[];onJump:(issue:ValidationIssue)=>void}){if(!issues.length)return <div className="validation-clear"><b>Ready</b><span>No data-integrity issues were detected.</span></div>;return <div className="issue-stack">{issues.map(issue=><button type="button" key={issue.id} className={`issue issue-${issue.severity}`} onClick={()=>onJump(issue)}><span className="issue-icon">{issue.severity==="error"?"!":issue.severity==="warning"?"△":"i"}</span><span><b>{issue.title}</b><small>{issue.message}</small>{issue.action&&<em>{issue.action}</em>}</span></button>)}</div>}

