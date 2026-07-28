"use client";

import { FormEvent, ReactNode, useMemo, useRef, useState } from "react";
import { CaseInput, EVIDENCE, evaluateCase, validateCase } from "@/lib/decisionEngine";

const initialCase: CaseInput = {
  age: 66, symptomDurationWeeks: 32, onset: "chronic", side: "right", painPattern: "radicular", suspectedRoot: "L5",
  backPain: 4, legPain: 8, walkingLimitMeters: 150, standingProvokes: true, sittingRelieves: true, flexionRelieves: true,
  coughSneezeProvokes: false, nightRestPain: false, groinPain: false, patientGoal: "Walk 30 minutes without severe leg pain",
  hipFlexion: "5", kneeExtension: "5", ankleDorsiflexion: "4", greatToeExtension: "4", plantarFlexion: "5",
  patellarReflex: "normal", achillesReflex: "normal", sensoryRoot: "L5", straightLegRaise: "positive", femoralStretch: "negative",
  gaitAbnormal: false, hipExamAbnormal: false, pulsesAbnormal: false,
  imagingAgeMonths: 2, imagingLevel: "L4-5", imagingSide: "right", imagingFinding: "lateral-recess", stenosisSeverity: "severe",
  migratedDisc: false, spondylolisthesis: true, slipMillimeters: 4, dynamicInstability: "unknown", translationMillimeters: 0,
  angularMotionDegrees: 0, deformityPresent: false, priorLumbarSurgery: false, plannedFacetResection: "unknown",
  completedExerciseProgram: true, exerciseWeeks: 12, medicationTrial: true, injectionResponse: "meaningful-temporary",
  injectionLevel: "L4-5", injectionSide: "right", injectionDurationDays: 21,
  progressiveWeakness: false, urinaryRetention: false, saddleAnesthesia: false, bilateralSevereDeficit: false, fever: false,
  bacteremiaOrRecentInfection: false, immunosuppression: false, recentProcedure: false, cancerHistory: false,
  unexplainedWeightLoss: false, recentTrauma: false, osteoporosisRisk: false, chronicSteroidUse: false, inflammatoryFeatures: false,
  smoking: false, diabetes: false, a1c: 6.0, bmi: 28, frailty: "none", boneHealth: "unknown", chronicOpioidUse: false,
  depressionAnxietyConcern: false, anticoagulation: false,
};

function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return <label className="field"><span>{label}{required && <b className="required"> *</b>}</span>{children}{help && <small>{help}</small>}</label>;
}
function Check({ children, checked, onChange }: { children: ReactNode; checked: boolean; onChange: (v:boolean)=>void }) {
  return <label className="check"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} /> {children}</label>;
}
function Section({ title, step, children }: { title: string; step?: number; children: ReactNode }) {
  return <section className="panel">{step && <div className="step">Step {step}</div>}<h2>{title}</h2>{children}</section>;
}
const grades = ["5","4","3","2","1","0","not-tested"] as const;
const reflexes = ["normal","reduced","absent","brisk","not-tested"] as const;

export default function SpineDecisionApp() {
  const [data, setData] = useState<CaseInput>(initialCase);
  const [snapshot, setSnapshot] = useState<CaseInput | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedAt, setGeneratedAt] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ symptoms:true, exam:true, imaging:true, safety:true, care:true, risk:true });
  const resultsRef = useRef<HTMLElement>(null);
  const result = useMemo(()=>snapshot ? evaluateCase(snapshot) : null,[snapshot]);
  const stale = snapshot ? JSON.stringify(data)!==JSON.stringify(snapshot) : false;
  const update = <K extends keyof CaseInput>(key:K,value:CaseInput[K]) => { setData(p=>({...p,[key]:value})); setErrors([]); };
  const toggle = (key:string)=>setOpenSections(p=>({...p,[key]:!p[key]}));
  const submit=(e:FormEvent)=>{e.preventDefault(); const v=validateCase(data); setErrors(v); if(v.length){scrollTo({top:0,behavior:"smooth"});return;} setSnapshot({...data}); setGeneratedAt(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})); setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50)};
  const reset=()=>{setData(initialCase);setSnapshot(null);setErrors([])};
  const evidence = result ? EVIDENCE.filter(x=>result.evidenceIds.includes(x.id)) : [];

  return <main>
    <header className="hero"><div><div className="eyebrow">LUMBAR CLINICAL RECONCILIATION PROTOTYPE</div><h1>SpineDx-Tx AI</h1><p>Structured safety screening, syndrome characterization, clinical–imaging reconciliation, treatment-context review, and surgical optimization.</p></div><div className="safety"><strong>Research demonstration</strong><br/>Not a diagnosis, order, surgical indication, authorization tool, or substitute for direct image review. Do not enter identifiable patient information.</div></header>
    {errors.length>0 && <div className="error-summary" role="alert"><strong>Correct these entries:</strong><ul>{errors.map(x=><li key={x}>{x}</li>)}</ul></div>}
    <div className="toolbar"><span>Scope: adults with lumbar degenerative symptoms; excludes trauma, tumor, infection, deformity, and emergency care except for safety escalation.</span><div><button className="text-button" onClick={()=>setData(initialCase)}>Load example</button><button className="text-button" onClick={reset}>Reset</button></div></div>

    <div className="layout">
      <form className="form" onSubmit={submit} noValidate>
        <button type="button" className="section-toggle" onClick={()=>toggle("symptoms")}>1. Symptoms and functional pattern <span>{openSections.symptoms?"−":"+"}</span></button>
        {openSections.symptoms && <Section title="Symptoms and function" step={1}>
          <div className="grid three">
            <Field label="Age" required><input type="number" min="18" max="110" value={data.age} onChange={e=>update("age",+e.target.value)}/></Field>
            <Field label="Duration (weeks)" required><input type="number" min="0" value={data.symptomDurationWeeks} onChange={e=>update("symptomDurationWeeks",+e.target.value)}/></Field>
            <Field label="Onset"><select value={data.onset} onChange={e=>update("onset",e.target.value as CaseInput["onset"])}><option value="acute">Acute</option><option value="subacute">Subacute</option><option value="chronic">Chronic</option></select></Field>
            <Field label="Symptom side"><select value={data.side} onChange={e=>update("side",e.target.value as CaseInput["side"])}><option>right</option><option>left</option><option>bilateral</option><option>midline</option></select></Field>
            <Field label="Clinical syndrome"><select value={data.painPattern} onChange={e=>update("painPattern",e.target.value as CaseInput["painPattern"])}><option value="radicular">Radicular</option><option value="claudication">Neurogenic claudication</option><option value="axial">Predominantly axial</option><option value="mixed">Mixed</option><option value="uncertain">Uncertain</option></select></Field>
            <Field label="Suspected root"><select value={data.suspectedRoot} onChange={e=>update("suspectedRoot",e.target.value as CaseInput["suspectedRoot"])}><option value="none">Not localized</option><option>L2</option><option>L3</option><option>L4</option><option>L5</option><option>S1</option><option value="multiroot">Multiple roots</option></select></Field>
            <Field label={`Back pain ${data.backPain}/10`}><input type="range" min="0" max="10" value={data.backPain} onChange={e=>update("backPain",+e.target.value)}/></Field>
            <Field label={`Leg pain ${data.legPain}/10`}><input type="range" min="0" max="10" value={data.legPain} onChange={e=>update("legPain",+e.target.value)}/></Field>
            <Field label="Walking tolerance (meters)" help="Use 0 if not limited."><input type="number" min="0" value={data.walkingLimitMeters} onChange={e=>update("walkingLimitMeters",+e.target.value)}/></Field>
          </div>
          <div className="check-grid"><Check checked={data.standingProvokes} onChange={v=>update("standingProvokes",v)}>Standing/walking provokes symptoms</Check><Check checked={data.sittingRelieves} onChange={v=>update("sittingRelieves",v)}>Sitting relieves symptoms</Check><Check checked={data.flexionRelieves} onChange={v=>update("flexionRelieves",v)}>Flexion relieves symptoms</Check><Check checked={data.coughSneezeProvokes} onChange={v=>update("coughSneezeProvokes",v)}>Cough/sneeze/Valsalva provokes symptoms</Check><Check checked={data.nightRestPain} onChange={v=>update("nightRestPain",v)}>Night or unremitting rest pain</Check><Check checked={data.groinPain} onChange={v=>update("groinPain",v)}>Groin-dominant pain</Check></div>
          <Field label="Patient’s primary measurable functional goal" required><input value={data.patientGoal} onChange={e=>update("patientGoal",e.target.value)}/></Field>
        </Section>}

        <button type="button" className="section-toggle" onClick={()=>toggle("exam")}>2. Neurologic, hip, and vascular examination <span>{openSections.exam?"−":"+"}</span></button>
        {openSections.exam && <Section title="Objective examination" step={2}>
          <h3>Motor grades</h3><div className="grid three">{([['hipFlexion','Hip flexion'],['kneeExtension','Knee extension'],['ankleDorsiflexion','Ankle dorsiflexion'],['greatToeExtension','Great-toe extension'],['plantarFlexion','Plantar flexion']] as const).map(([k,l])=><Field key={k} label={l}><select value={data[k]} onChange={e=>update(k,e.target.value as CaseInput[typeof k])}>{grades.map(g=><option key={g}>{g}</option>)}</select></Field>)}</div>
          <div className="grid three"><Field label="Patellar reflex"><select value={data.patellarReflex} onChange={e=>update("patellarReflex",e.target.value as CaseInput["patellarReflex"])}>{reflexes.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Achilles reflex"><select value={data.achillesReflex} onChange={e=>update("achillesReflex",e.target.value as CaseInput["achillesReflex"])}>{reflexes.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Sensory pattern"><select value={data.sensoryRoot} onChange={e=>update("sensoryRoot",e.target.value as CaseInput["sensoryRoot"])}><option value="none">No deficit</option><option>L2</option><option>L3</option><option>L4</option><option>L5</option><option>S1</option><option value="non-dermatomal">Non-dermatomal</option><option value="not-tested">Not tested</option></select></Field><Field label="Straight-leg raise"><select value={data.straightLegRaise} onChange={e=>update("straightLegRaise",e.target.value as CaseInput["straightLegRaise"])}><option>positive</option><option>negative</option><option>not-tested</option></select></Field><Field label="Femoral stretch"><select value={data.femoralStretch} onChange={e=>update("femoralStretch",e.target.value as CaseInput["femoralStretch"])}><option>positive</option><option>negative</option><option>not-tested</option></select></Field></div>
          <div className="check-grid"><Check checked={data.gaitAbnormal} onChange={v=>update("gaitAbnormal",v)}>Abnormal gait/heel-toe testing</Check><Check checked={data.hipExamAbnormal} onChange={v=>update("hipExamAbnormal",v)}>Hip examination suggests competing source</Check><Check checked={data.pulsesAbnormal} onChange={v=>update("pulsesAbnormal",v)}>Pulses/vascular examination abnormal</Check></div>
        </Section>}

        <button type="button" className="section-toggle" onClick={()=>toggle("imaging")}>3. Imaging and structural context <span>{openSections.imaging?"−":"+"}</span></button>
        {openSections.imaging && <Section title="Imaging" step={3}>
          <div className="grid three"><Field label="Imaging age (months)"><input type="number" min="0" value={data.imagingAgeMonths} onChange={e=>update("imagingAgeMonths",+e.target.value)}/></Field><Field label="Dominant level"><select value={data.imagingLevel} onChange={e=>update("imagingLevel",e.target.value as CaseInput["imagingLevel"])}>{["L1-2","L2-3","L3-4","L4-5","L5-S1","multilevel"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Imaging side"><select value={data.imagingSide} onChange={e=>update("imagingSide",e.target.value as CaseInput["imagingSide"])}><option>right</option><option>left</option><option>bilateral</option><option>central</option></select></Field><Field label="Dominant lesion"><select value={data.imagingFinding} onChange={e=>update("imagingFinding",e.target.value as CaseInput["imagingFinding"])}><option value="disc">Disc herniation</option><option value="central-stenosis">Central canal stenosis</option><option value="lateral-recess">Lateral recess stenosis</option><option value="foraminal">Foraminal stenosis</option><option value="extraforaminal">Extraforaminal lesion</option><option value="other">Other</option></select></Field><Field label="Reported severity"><select value={data.stenosisSeverity} onChange={e=>update("stenosisSeverity",e.target.value as CaseInput["stenosisSeverity"])}><option>mild</option><option>moderate</option><option>severe</option><option value="not-graded">Not graded</option></select></Field><Field label="Dynamic instability"><select value={data.dynamicInstability} onChange={e=>update("dynamicInstability",e.target.value as CaseInput["dynamicInstability"])}><option>unknown</option><option>absent</option><option>present</option></select></Field><Field label="Slip (mm)"><input type="number" min="0" step="0.1" value={data.slipMillimeters} onChange={e=>update("slipMillimeters",+e.target.value)}/></Field><Field label="Dynamic translation (mm)"><input type="number" min="0" step="0.1" value={data.translationMillimeters} onChange={e=>update("translationMillimeters",+e.target.value)}/></Field><Field label="Angular motion (degrees)"><input type="number" min="0" step="0.1" value={data.angularMotionDegrees} onChange={e=>update("angularMotionDegrees",+e.target.value)}/></Field><Field label="Planned facet resection"><select value={data.plannedFacetResection} onChange={e=>update("plannedFacetResection",e.target.value as CaseInput["plannedFacetResection"])}><option>unknown</option><option>limited</option><option>substantial</option></select></Field></div>
          <div className="check-grid"><Check checked={data.migratedDisc} onChange={v=>update("migratedDisc",v)}>Migrated/sequestered disc</Check><Check checked={data.spondylolisthesis} onChange={v=>update("spondylolisthesis",v)}>Degenerative spondylolisthesis</Check><Check checked={data.deformityPresent} onChange={v=>update("deformityPresent",v)}>Clinically relevant deformity</Check><Check checked={data.priorLumbarSurgery} onChange={v=>update("priorLumbarSurgery",v)}>Prior lumbar surgery</Check></div>
        </Section>}

        <button type="button" className="section-toggle" onClick={()=>toggle("safety")}>4. Serious pathology and emergency screen <span>{openSections.safety?"−":"+"}</span></button>
        {openSections.safety && <Section title="Safety screen" step={4}><div className="red-flag-box"><div className="check-grid"><Check checked={data.progressiveWeakness} onChange={v=>update("progressiveWeakness",v)}>Progressive motor weakness</Check><Check checked={data.urinaryRetention} onChange={v=>update("urinaryRetention",v)}>New urinary retention/major bladder dysfunction</Check><Check checked={data.saddleAnesthesia} onChange={v=>update("saddleAnesthesia",v)}>New saddle sensory change</Check><Check checked={data.bilateralSevereDeficit} onChange={v=>update("bilateralSevereDeficit",v)}>Severe bilateral neurologic deficit</Check><Check checked={data.fever} onChange={v=>update("fever",v)}>Fever</Check><Check checked={data.bacteremiaOrRecentInfection} onChange={v=>update("bacteremiaOrRecentInfection",v)}>Bacteremia/recent infection</Check><Check checked={data.immunosuppression} onChange={v=>update("immunosuppression",v)}>Immunosuppression</Check><Check checked={data.recentProcedure} onChange={v=>update("recentProcedure",v)}>Recent invasive procedure</Check><Check checked={data.cancerHistory} onChange={v=>update("cancerHistory",v)}>History of cancer</Check><Check checked={data.unexplainedWeightLoss} onChange={v=>update("unexplainedWeightLoss",v)}>Unexplained weight loss</Check><Check checked={data.recentTrauma} onChange={v=>update("recentTrauma",v)}>Recent trauma</Check><Check checked={data.osteoporosisRisk} onChange={v=>update("osteoporosisRisk",v)}>Osteoporosis/fracture risk</Check><Check checked={data.chronicSteroidUse} onChange={v=>update("chronicSteroidUse",v)}>Chronic systemic steroid use</Check><Check checked={data.inflammatoryFeatures} onChange={v=>update("inflammatoryFeatures",v)}>Inflammatory back-pain features</Check></div></div></Section>}

        <button type="button" className="section-toggle" onClick={()=>toggle("care")}>5. Prior care and injection context <span>{openSections.care?"−":"+"}</span></button>
        {openSections.care && <Section title="Prior care" step={5}><div className="grid three"><Field label="Exercise/PT weeks"><input type="number" min="0" value={data.exerciseWeeks} onChange={e=>update("exerciseWeeks",+e.target.value)}/></Field><Field label="Injection response"><select value={data.injectionResponse} onChange={e=>update("injectionResponse",e.target.value as CaseInput["injectionResponse"])}><option value="not-tried">Not tried</option><option value="none">No benefit</option><option value="brief">Brief benefit</option><option value="meaningful-temporary">Meaningful temporary benefit</option><option value="sustained">Sustained benefit</option></select></Field><Field label="Injection duration (days)"><input type="number" min="0" value={data.injectionDurationDays} onChange={e=>update("injectionDurationDays",+e.target.value)}/></Field><Field label="Injection level"><select value={data.injectionLevel} onChange={e=>update("injectionLevel",e.target.value as CaseInput["injectionLevel"])}>{["unknown","L1-2","L2-3","L3-4","L4-5","L5-S1"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Injection side"><select value={data.injectionSide} onChange={e=>update("injectionSide",e.target.value as CaseInput["injectionSide"])}><option>unknown</option><option>right</option><option>left</option><option>bilateral</option></select></Field></div><div className="check-grid"><Check checked={data.completedExerciseProgram} onChange={v=>update("completedExerciseProgram",v)}>Structured exercise-based care completed</Check><Check checked={data.medicationTrial} onChange={v=>update("medicationTrial",v)}>Medication trial documented</Check></div></Section>}

        <button type="button" className="section-toggle" onClick={()=>toggle("risk")}>6. Surgical risk and optimization <span>{openSections.risk?"−":"+"}</span></button>
        {openSections.risk && <Section title="Risk and optimization" step={6}><div className="grid three"><Field label="BMI"><input type="number" min="10" max="80" step="0.1" value={data.bmi} onChange={e=>update("bmi",+e.target.value)}/></Field><Field label="HbA1c"><input type="number" min="3" max="20" step="0.1" value={data.a1c} onChange={e=>update("a1c",+e.target.value)}/></Field><Field label="Frailty"><select value={data.frailty} onChange={e=>update("frailty",e.target.value as CaseInput["frailty"])}><option>unknown</option><option>none</option><option>mild</option><option>moderate</option><option>severe</option></select></Field><Field label="Bone health"><select value={data.boneHealth} onChange={e=>update("boneHealth",e.target.value as CaseInput["boneHealth"])}><option>unknown</option><option>normal</option><option>osteopenia</option><option>osteoporosis</option></select></Field></div><div className="check-grid"><Check checked={data.smoking} onChange={v=>update("smoking",v)}>Current smoking</Check><Check checked={data.diabetes} onChange={v=>update("diabetes",v)}>Diabetes</Check><Check checked={data.chronicOpioidUse} onChange={v=>update("chronicOpioidUse",v)}>Chronic opioid use</Check><Check checked={data.depressionAnxietyConcern} onChange={v=>update("depressionAnxietyConcern",v)}>Depression/anxiety concern</Check><Check checked={data.anticoagulation} onChange={v=>update("anticoagulation",v)}>Anticoagulation</Check></div></Section>}

        <div className="submit-bar"><button className="primary" type="submit">Generate evidence-linked clinical summary</button><span>Required fields are marked *</span></div>
      </form>

      <aside className="results" ref={resultsRef} aria-live="polite">
        {!result && <div className="empty-results"><div className="empty-icon">✓</div><h2>Ready for structured review</h2><p>The output is generated from a fixed snapshot and separates safety escalation, reconciliation, diagnostic gaps, treatment context, and optimization.</p></div>}
        {result && <>
          {stale && <div className="stale-banner">Inputs changed after generation. Regenerate before using the summary.</div>}
          <div className={`urgency ${result.urgency}`}><strong>{result.urgency.toUpperCase()} PATHWAY</strong><span>{result.urgencyReason}</span></div>
          <div className="score-card"><div className="score-heading"><div><span>Clinical–imaging reconciliation</span><strong className="word-score">{result.reconciliation.replace("-"," ")}</strong></div></div><p>{result.reconciliationNarrative}</p></div>
          <Section title="Clinical checks"><div className="checks">{result.checks.map(c=><div key={c.label} title={c.rationale}><span className={`status-dot ${c.status}`}/>{c.label}<b>{c.status}</b></div>)}</div></Section>
          <Section title="Syndrome"><p className="diagnosis">{result.syndrome}</p></Section>
          <ResultSection title="Supporting findings" items={result.support} empty="No affirmative support was established from the entered fields."/>
          <ResultSection title="Contradictions and uncertainty" items={result.contradictions} empty="No major contradiction was identified by the current rule set."/>
          <ResultSection title="Missing information" items={result.missing} empty="No major missing item was identified by the current rule set."/>
          <ResultSection title="Alternative diagnoses and mimics" items={result.alternatives} ordered empty="No specific competing diagnosis was triggered; clinical judgment remains required."/>
          <ResultSection title="Diagnostic next steps" items={result.diagnosticNextSteps} empty="No additional test is automatically recommended. Order testing only when it is expected to change management."/>
          <ResultSection title="Nonoperative pathway context" items={result.nonoperativePathway} empty="No routine nonoperative recommendation was generated because the case requires escalation or clarification."/>
          <ResultSection title="Surgical decision context" items={result.surgicalDecision} empty="The entered information does not establish a surgical indication."/>
          <ResultSection title="Potential operative strategies" items={result.operativeOptions} empty="No procedure-specific option can be responsibly generated from the entered pathology."/>
          <ResultSection title="Prerequisites before operative planning" items={result.surgicalPrerequisites} empty="Direct specialist review remains required."/>
          <ResultSection title="Operative risks to discuss" items={result.operativeRisks} empty="Procedure-specific risks require surgeon review."/>
          <Section title="Decompression versus fusion"><div className="fusion"><p>{result.fusionAssessment}</p></div></Section>
          <ResultSection title="Risk and optimization" items={result.optimization} empty="No optimization flag was triggered by the entered fields; this is not a complete perioperative assessment."/>
          <Section title="Evidence map"><div className="evidence-list">{evidence.map(e=><article key={e.id}><b>{e.id}</b><strong>{e.title}</strong><span>{e.source}, {e.year}</span><p>{e.note}</p></article>)}</div><small>Evidence references support the general rule category; they do not validate this software or make a patient-specific recommendation.</small></Section>
          <div className="result-actions"><button className="secondary" onClick={()=>window.print()}>Print clinician summary</button><span>Generated {generatedAt}</span></div>
        </>}
      </aside>
    </div>
    <footer><strong>Logic version 0.6.</strong> Clinically audited, evidence-mapped transparent rules for research prototyping only. A multidisciplinary panel must approve every rule and perform retrospective, silent prospective, and impact validation before clinical deployment.</footer>
  </main>
}

function ResultSection({title,items,empty,ordered=false}:{title:string;items:string[];empty:string;ordered?:boolean}){
  return <Section title={title}>{ordered?<ol>{items.length?items.map(x=><li key={x}>{x}</li>):<li>{empty}</li>}</ol>:<ul>{items.length?items.map(x=><li key={x}>{x}</li>):<li>{empty}</li>}</ul>}</Section>
}
