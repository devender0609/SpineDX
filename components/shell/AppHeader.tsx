"use client";
import { APP_VERSION } from "@/lib/appVersion";
import type { DraftMode } from "@/lib/draftStorage";

type View="entry"|"results"|"literature"|"research";

/** Compact application header: identity, workspace navigation, draft status, actions. */
export default function AppHeader({view,setView,hasResult,storageMode,draftSavedAt,onClearDraft,onLoadDemo,onNewCase}:{
  view:View;setView:(v:View)=>void;hasResult:boolean;storageMode:DraftMode;draftSavedAt:string|null;
  onClearDraft:()=>void;onLoadDemo:()=>void;onNewCase:()=>void;}){
  const result=hasResult;const loadDemo=onLoadDemo;const reset=onNewCase;const setConfirmClear=onClearDraft;
  return <header className="appbar">
    <div className="appbar-brand"><span className="logo" aria-hidden="true">SD</span><span className="brand-text"><b>SpineDx-Tx</b><small>Lumbar clinical–imaging reconciliation</small></span></div>
    <nav className="appbar-nav" aria-label="Workspace">
      {([["entry","Assessment"],["results","Synthesis"],["literature","Evidence"],["research","Research"]] as const).map(([v,l])=>
        <button key={v} type="button" className={view===v?"on":""} disabled={v==="results"&&!result} onClick={()=>setView(v)}>{l}</button>)}
    </nav>
    <div className="appbar-actions">
      {storageMode==="off"
        ?<span className="chip subtle" title="Prototype browser storage. Not approved for PHI or shared clinical workstations.">No draft</span>
        :<button type="button" className="chip draft-chip" title="Prototype browser storage. Not approved for PHI or shared clinical workstations." onClick={()=>setConfirmClear()}>
            {storageMode==="session"?"Session draft":`Local draft${draftSavedAt?` · ${new Date(draftSavedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`:""}`}
            <span className="chip-x" aria-hidden="true">×</span><span className="sr-only">Clear draft</span>
          </button>}
      <span className="chip version">v{APP_VERSION}</span>
      <button type="button" onClick={loadDemo}>Load demo</button>
      <button type="button" className="primary" onClick={reset}>New case</button>
    </div>
  </header>
;
}
