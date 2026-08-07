"use client";
import { label } from "@/components/ui/labels";
import type { DecisionOutput } from "@/lib/decisionEngine";

/**
 * The hero states each conclusion once. Everything it shows is read from the frozen
 * DecisionOutput — no interpretation happens here.
 */
export default function SynthesisHero({result}:{result:DecisionOutput}){
  const top=result.targets[0];const m=result.motor;
  const img=result.concordance.find(x=>x.domain==="Imaging");
  const band=result.urgency==="emergency"?"emergency":result.urgency==="urgent"?"urgent":"";
  const mainLimit=result.missing[0]??result.scopeNotes[0]??"None recorded";
  return <section className="hero">
       <div className={`hero-band ${band}`}>
         <span className="hero-urgency">{label(result.urgency)}</span>
         <span className="hero-title">{label(result.syndrome.derived)}{top?` — ${top.side} ${top.root}, ${top.level}`:" — localization unresolved"}</span>
       </div>
       <dl className="hero-grid">
         <div className="hero-cell"><dt>Symptoms</dt><dd>{result.concordance.find(x=>x.domain==="Symptoms")?.finding??"Not documented"}</dd></div>
         <div className="hero-cell"><dt>{m.domainLabel}</dt><dd>{m.recorded?`${m.displayText}${m.reliabilityText?` · ${m.reliabilityText}`:""}`:"Not assessed"}</dd></div>
         <div className="hero-cell"><dt>Imaging</dt><dd>{img?.finding??"Not documented"}</dd></div>
         <div className="hero-cell wide"><dt>Current conclusion</dt><dd>{top?`Most concordant candidate localization: ${top.side} ${top.root}, ${top.level} ${label(top.zone)}`:"Current information does not establish a concordant candidate localization."}</dd></div>
         <div className="hero-cell wide"><dt>Next step</dt><dd>{result.nextSteps[0]??result.specialistReview.reasons[0]??"Clinical review required"}</dd></div>
         <div className="hero-cell wide"><dt>Main limitation</dt><dd>{mainLimit}</dd></div>
       </dl>
     </section>;
}
