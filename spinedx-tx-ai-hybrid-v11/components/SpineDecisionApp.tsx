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

type Stage = "presentation" | "exam" | "imaging" | "planning";
const STAGES: Stage[] = ["presentation", "exam", "imaging", "planning"];
type ResultTab = "assessment" | "management" | "evidence";

function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}{required && <b className="required"> *</b>}</span>{children}{help && <small>{help}</small>}</label>;
}
function Check({ children, checked, onChange }: { children: ReactNode; checked: boolean; onChange: (v:boolean)=>void }) {
  return <label className="check"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} /><span>{children}</span></label>;
}
function Card({ title, eyebrow, children, tone="default" }: { title: string; eyebrow?: string; children: ReactNode; tone?: "default"|"soft"|"warning" }) {
  return <section className={`card card-${tone}`}>{eyebrow && <div className="card-eyebrow">{eyebrow}</div>}<h2>{title}</h2>{children}</section>;
}
function List({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="muted">{empty ?? "No additional items were generated."}</p>;
  return <ul className="clean-list">{items.map((x,i)=><li key={`${i}-${x}`}>{x}</li>)}</ul>;
}
function Pill({ children, tone="neutral" }: { children: ReactNode; tone?: "neutral"|"good"|"warn"|"danger"|"info" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

const grades = ["5","4","3","2","1","0","not-tested"] as const;
const reflexes = ["normal","reduced","absent","brisk","not-tested"] as const;

export default function SpineDecisionApp() {
  const [data, setData] = useState<CaseInput>(initialCase);
  const [snapshot, setSnapshot] = useState<CaseInput | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedAt, setGeneratedAt] = useState("");
  const [stage, setStage] = useState<Stage>("presentation");
  const [resultTab, setResultTab] = useState<ResultTab>("assessment");
  const [finalReview, setFinalReview] = useState({ safety: false, priorCare: false, risk: false });
  const resultsRef = useRef<HTMLElement>(null);
  const result = useMemo(()=>snapshot ? evaluateCase(snapshot) : null,[snapshot]);
  const stale = snapshot ? JSON.stringify(data)!==JSON.stringify(snapshot) : false;
  const update = <K extends keyof CaseInput>(key:K,value:CaseInput[K]) => { setData(p=>({...p,[key]:value})); setErrors([]); };
  const submit=(e:FormEvent)=>{e.preventDefault(); const v=validateCase(data); if (!finalReview.safety) v.push("Confirm that the urgent safety screen has been reviewed."); if (!finalReview.priorCare) v.push("Confirm that prior care and injection details have been reviewed."); if (!finalReview.risk) v.push("Confirm that perioperative risk has been reviewed or marked not applicable."); setErrors(v); if(v.length){scrollTo({top:0,behavior:"smooth"});return;} setSnapshot({...data}); setGeneratedAt(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})); setResultTab("assessment"); setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50)};
  const reset=()=>{setData(initialCase);setSnapshot(null);setErrors([]);setGeneratedAt("");setStage("presentation");setFinalReview({safety:false,priorCare:false,risk:false})};
  const loadExample=()=>{setData(initialCase);setSnapshot(null);setErrors([]);setGeneratedAt("");setStage("presentation");setFinalReview({safety:false,priorCare:false,risk:false})};
  const evidence = result ? EVIDENCE.filter(x=>result.evidenceIds.includes(x.id)) : [];

  const statusTone = result?.urgency === "emergency" ? "danger" : result?.urgency === "urgent" ? "warn" : "good";
  const recTone = result?.reconciliation === "concordant" ? "good" : result?.reconciliation === "partially-concordant" ? "info" : result?.reconciliation === "discordant" ? "danger" : "warn";
  const reviewCount = result?.checks.filter(x=>x.status!=="met").length ?? 0;
  const stageIndex = STAGES.indexOf(stage);
  const goBack = () => setStage(STAGES[Math.max(0, stageIndex - 1)]);
  const goNext = () => setStage(STAGES[Math.min(STAGES.length - 1, stageIndex + 1)]);

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">S</div><div><h1>SpineDx-Tx</h1><p>Clinical reconciliation workspace</p></div></div>
      <div className="top-actions"><Pill tone="info">Lumbar degenerative scope</Pill><button className="ghost-button" type="button" onClick={loadExample}>Load example</button><button className="ghost-button" onClick={reset}>Reset</button></div>
    </header>

    <div className="disclaimer"><strong>Research prototype.</strong> Supports structured review only. It does not diagnose, authorize, order, or replace clinician image review and judgment. Do not enter identifiable patient information.</div>

    {errors.length>0 && <div className="error-summary" role="alert"><strong>Complete the required fields</strong><ul>{errors.map(x=><li key={x}>{x}</li>)}</ul></div>}

    <div className={`workspace ${result ? "has-results" : "form-only"}`}>
      <aside className="workflow-nav" aria-label="Clinical workflow">
        <button className={`${stage==="presentation"?"active":""} ${stageIndex>0||result?"complete":""}`} onClick={()=>setStage("presentation")}><span>{stageIndex>0||result?"✓":"1"}</span><div><b>Presentation</b><small>Symptoms and goals</small></div></button>
        <button className={`${stage==="exam"?"active":""} ${stageIndex>1||result?"complete":""}`} onClick={()=>setStage("exam")}><span>{stageIndex>1||result?"✓":"2"}</span><div><b>Examination</b><small>Neurologic and mimics</small></div></button>
        <button className={`${stage==="imaging"?"active":""} ${stageIndex>2||result?"complete":""}`} onClick={()=>setStage("imaging")}><span>{stageIndex>2||result?"✓":"3"}</span><div><b>Imaging</b><small>Level, zone, stability</small></div></button>
        <button className={`${stage==="planning"?"active":""} ${result?"complete":""}`} onClick={()=>setStage("planning")}><span>{result?"✓":"4"}</span><div><b>Safety & planning</b><small>Red flags, prior care, risk</small></div></button>
      </aside>

      <form className="clinical-form" onSubmit={submit} noValidate>
        {stage === "presentation" && <div className="stage-stack">
          <div className="stage-header"><div><span className="stage-kicker">Step 1</span><h2>Presentation</h2><p>Define the dominant syndrome, severity, functional limitation, and patient goal.</p></div><Pill tone="neutral">Required for interpretation</Pill></div>
          <Card title="Clinical pattern">
            <div className="grid three">
              <Field label="Age" required><input type="number" min="18" max="110" value={data.age} onChange={e=>update("age",+e.target.value)}/></Field>
              <Field label="Duration (weeks)" required><input type="number" min="0" value={data.symptomDurationWeeks} onChange={e=>update("symptomDurationWeeks",+e.target.value)}/></Field>
              <Field label="Onset"><select value={data.onset} onChange={e=>update("onset",e.target.value as CaseInput["onset"])}><option value="acute">Acute</option><option value="subacute">Subacute</option><option value="chronic">Chronic</option></select></Field>
              <Field label="Symptom side"><select value={data.side} onChange={e=>update("side",e.target.value as CaseInput["side"])}><option value="right">Right</option><option value="left">Left</option><option value="bilateral">Bilateral</option><option value="midline">Midline</option></select></Field>
              <Field label="Clinical syndrome"><select value={data.painPattern} onChange={e=>update("painPattern",e.target.value as CaseInput["painPattern"])}><option value="radicular">Radicular</option><option value="claudication">Neurogenic claudication</option><option value="axial">Predominantly axial</option><option value="mixed">Mixed</option><option value="uncertain">Uncertain</option></select></Field>
              <Field label="Suspected root"><select value={data.suspectedRoot} onChange={e=>update("suspectedRoot",e.target.value as CaseInput["suspectedRoot"])}><option value="none">Not localized</option><option>L2</option><option>L3</option><option>L4</option><option>L5</option><option>S1</option><option value="multiroot">Multiple roots</option></select></Field>
            </div>
          </Card>
          <Card title="Severity and function">
            <div className="grid three">
              <Field label={`Back pain · ${data.backPain}/10`}><input type="range" min="0" max="10" value={data.backPain} onChange={e=>update("backPain",+e.target.value)}/></Field>
              <Field label={`Leg pain · ${data.legPain}/10`}><input type="range" min="0" max="10" value={data.legPain} onChange={e=>update("legPain",+e.target.value)}/></Field>
              <Field label="Walking tolerance (m)" help="Use 0 when not limited."><input type="number" min="0" value={data.walkingLimitMeters} onChange={e=>update("walkingLimitMeters",+e.target.value)}/></Field>
            </div>
            <div className="check-grid compact"><Check checked={data.standingProvokes} onChange={v=>update("standingProvokes",v)}>Standing or walking provokes symptoms</Check><Check checked={data.sittingRelieves} onChange={v=>update("sittingRelieves",v)}>Sitting relieves symptoms</Check><Check checked={data.flexionRelieves} onChange={v=>update("flexionRelieves",v)}>Flexion relieves symptoms</Check><Check checked={data.coughSneezeProvokes} onChange={v=>update("coughSneezeProvokes",v)}>Cough, sneeze, or Valsalva provokes</Check><Check checked={data.nightRestPain} onChange={v=>update("nightRestPain",v)}>Night or unremitting rest pain</Check><Check checked={data.groinPain} onChange={v=>update("groinPain",v)}>Groin-dominant pain</Check></div>
            <Field label="Patient’s primary measurable functional goal" required><input value={data.patientGoal} onChange={e=>update("patientGoal",e.target.value)}/></Field>
          </Card>
        </div>}

        {stage === "exam" && <div className="stage-stack">
          <div className="stage-header"><div><span className="stage-kicker">Step 2</span><h2>Objective examination</h2><p>Capture findings by muscle and pattern rather than relying on a single root label.</p></div></div>
          <Card title="Motor and reflex examination">
            <div className="grid three">{([['hipFlexion','Hip flexion'],['kneeExtension','Knee extension'],['ankleDorsiflexion','Ankle dorsiflexion'],['greatToeExtension','Great-toe extension'],['plantarFlexion','Plantar flexion']] as const).map(([k,l])=><Field key={k} label={l}><select value={data[k]} onChange={e=>update(k,e.target.value as CaseInput[typeof k])}>{grades.map(g=><option key={g} value={g}>{g === "not-tested" ? "Not tested" : g}</option>)}</select></Field>)}
              <Field label="Patellar reflex"><select value={data.patellarReflex} onChange={e=>update("patellarReflex",e.target.value as CaseInput["patellarReflex"])}>{reflexes.map(x=><option key={x} value={x}>{x.replace("-"," ")}</option>)}</select></Field>
              <Field label="Achilles reflex"><select value={data.achillesReflex} onChange={e=>update("achillesReflex",e.target.value as CaseInput["achillesReflex"])}>{reflexes.map(x=><option key={x} value={x}>{x.replace("-"," ")}</option>)}</select></Field>
            </div>
          </Card>
          <Card title="Localization and competing sources">
            <div className="grid three">
              <Field label="Sensory pattern"><select value={data.sensoryRoot} onChange={e=>update("sensoryRoot",e.target.value as CaseInput["sensoryRoot"])}><option value="none">No focal deficit</option><option>L2</option><option>L3</option><option>L4</option><option>L5</option><option>S1</option><option value="non-dermatomal">Non-dermatomal</option><option value="not-tested">Not tested</option></select></Field>
              <Field label="Straight-leg raise"><select value={data.straightLegRaise} onChange={e=>update("straightLegRaise",e.target.value as CaseInput["straightLegRaise"])}><option value="positive">Positive</option><option value="negative">Negative</option><option value="not-tested">Not tested</option></select></Field>
              <Field label="Femoral stretch"><select value={data.femoralStretch} onChange={e=>update("femoralStretch",e.target.value as CaseInput["femoralStretch"])}><option value="positive">Positive</option><option value="negative">Negative</option><option value="not-tested">Not tested</option></select></Field>
            </div>
            <div className="check-grid compact"><Check checked={data.gaitAbnormal} onChange={v=>update("gaitAbnormal",v)}>Abnormal gait or heel/toe testing</Check><Check checked={data.hipExamAbnormal} onChange={v=>update("hipExamAbnormal",v)}>Hip examination suggests a competing source</Check><Check checked={data.pulsesAbnormal} onChange={v=>update("pulsesAbnormal",v)}>Pulse or vascular examination abnormal</Check></div>
          </Card>
        </div>}

        {stage === "imaging" && <div className="stage-stack">
          <div className="stage-header"><div><span className="stage-kicker">Step 3</span><h2>Imaging and structural context</h2><p>Reconcile the symptomatic side and candidate root with the level and anatomic zone.</p></div><Pill tone="info">Direct image review required</Pill></div>
          <Card title="Dominant lesion">
            <div className="grid three">
              <Field label="Imaging age (months)"><input type="number" min="0" value={data.imagingAgeMonths} onChange={e=>update("imagingAgeMonths",+e.target.value)}/></Field>
              <Field label="Dominant level"><select value={data.imagingLevel} onChange={e=>update("imagingLevel",e.target.value as CaseInput["imagingLevel"])}>{["L1-2","L2-3","L3-4","L4-5","L5-S1","multilevel"].map(x=><option key={x} value={x}>{x === "multilevel" ? "Multilevel" : x}</option>)}</select></Field>
              <Field label="Imaging side"><select value={data.imagingSide} onChange={e=>update("imagingSide",e.target.value as CaseInput["imagingSide"])}><option value="right">Right</option><option value="left">Left</option><option value="bilateral">Bilateral</option><option value="central">Central</option></select></Field>
              <Field label="Dominant lesion"><select value={data.imagingFinding} onChange={e=>update("imagingFinding",e.target.value as CaseInput["imagingFinding"])}><option value="disc">Disc herniation</option><option value="central-stenosis">Central stenosis</option><option value="lateral-recess">Lateral recess stenosis</option><option value="foraminal">Foraminal stenosis</option><option value="extraforaminal">Extraforaminal lesion</option><option value="other">Other</option></select></Field>
              <Field label="Reported severity"><select value={data.stenosisSeverity} onChange={e=>update("stenosisSeverity",e.target.value as CaseInput["stenosisSeverity"])}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option><option value="not-graded">Not graded</option></select></Field>
              <Field label="Dynamic instability"><select value={data.dynamicInstability} onChange={e=>update("dynamicInstability",e.target.value as CaseInput["dynamicInstability"])}><option value="unknown">Unknown</option><option value="absent">Absent</option><option value="present">Present</option></select></Field>
            </div>
          </Card>
          <Card title="Stability and operative anatomy">
            <div className="grid three"><Field label="Slip (mm)"><input type="number" min="0" value={data.slipMillimeters} onChange={e=>update("slipMillimeters",+e.target.value)}/></Field><Field label="Dynamic translation (mm)"><input type="number" min="0" value={data.translationMillimeters} onChange={e=>update("translationMillimeters",+e.target.value)}/></Field><Field label="Angular motion (°)"><input type="number" min="0" value={data.angularMotionDegrees} onChange={e=>update("angularMotionDegrees",+e.target.value)}/></Field><Field label="Planned facet resection"><select value={data.plannedFacetResection} onChange={e=>update("plannedFacetResection",e.target.value as CaseInput["plannedFacetResection"])}><option value="unknown">Unknown</option><option value="limited">Limited</option><option value="substantial">Substantial</option></select></Field></div>
            <div className="check-grid compact"><Check checked={data.migratedDisc} onChange={v=>update("migratedDisc",v)}>Migrated or sequestered disc</Check><Check checked={data.spondylolisthesis} onChange={v=>update("spondylolisthesis",v)}>Degenerative spondylolisthesis</Check><Check checked={data.deformityPresent} onChange={v=>update("deformityPresent",v)}>Clinically relevant deformity</Check><Check checked={data.priorLumbarSurgery} onChange={v=>update("priorLumbarSurgery",v)}>Prior lumbar surgery</Check></div>
          </Card>
        </div>}

        {stage === "planning" && <div className="stage-stack">
          <div className="stage-header"><div><span className="stage-kicker">Step 4</span><h2>Safety and treatment planning</h2><p>Screen for time-sensitive disease, document prior care, and identify modifiable surgical risk.</p></div></div>
          <Card title="Urgent safety screen" tone="warning">
            <div className="check-grid compact"><Check checked={data.progressiveWeakness} onChange={v=>update("progressiveWeakness",v)}>Progressive motor weakness</Check><Check checked={data.urinaryRetention} onChange={v=>update("urinaryRetention",v)}>New urinary retention or major bladder dysfunction</Check><Check checked={data.saddleAnesthesia} onChange={v=>update("saddleAnesthesia",v)}>New saddle sensory change</Check><Check checked={data.bilateralSevereDeficit} onChange={v=>update("bilateralSevereDeficit",v)}>Severe bilateral neurologic deficit</Check><Check checked={data.fever} onChange={v=>update("fever",v)}>Fever</Check><Check checked={data.bacteremiaOrRecentInfection} onChange={v=>update("bacteremiaOrRecentInfection",v)}>Bacteremia or recent infection</Check><Check checked={data.immunosuppression} onChange={v=>update("immunosuppression",v)}>Immunosuppression</Check><Check checked={data.recentProcedure} onChange={v=>update("recentProcedure",v)}>Recent invasive procedure</Check><Check checked={data.cancerHistory} onChange={v=>update("cancerHistory",v)}>History of cancer</Check><Check checked={data.unexplainedWeightLoss} onChange={v=>update("unexplainedWeightLoss",v)}>Unexplained weight loss</Check><Check checked={data.recentTrauma} onChange={v=>update("recentTrauma",v)}>Recent trauma</Check><Check checked={data.osteoporosisRisk} onChange={v=>update("osteoporosisRisk",v)}>Osteoporosis or fracture risk</Check><Check checked={data.chronicSteroidUse} onChange={v=>update("chronicSteroidUse",v)}>Chronic systemic steroid use</Check><Check checked={data.inflammatoryFeatures} onChange={v=>update("inflammatoryFeatures",v)}>Inflammatory back-pain features</Check></div>
          </Card>
          <Card title="Prior care">
            <div className="grid three"><Field label="Exercise/PT weeks"><input type="number" min="0" value={data.exerciseWeeks} onChange={e=>update("exerciseWeeks",+e.target.value)}/></Field><Field label="Injection response"><select value={data.injectionResponse} onChange={e=>update("injectionResponse",e.target.value as CaseInput["injectionResponse"])}><option value="not-tried">Not tried</option><option value="none">No benefit</option><option value="brief">Brief benefit</option><option value="meaningful-temporary">Meaningful temporary benefit</option><option value="sustained">Sustained benefit</option></select></Field><Field label="Injection duration (days)"><input type="number" min="0" value={data.injectionDurationDays} onChange={e=>update("injectionDurationDays",+e.target.value)}/></Field><Field label="Injection level"><select value={data.injectionLevel} onChange={e=>update("injectionLevel",e.target.value as CaseInput["injectionLevel"])}>{["unknown","L1-2","L2-3","L3-4","L4-5","L5-S1"].map(x=><option key={x} value={x}>{x === "unknown" ? "Unknown" : x}</option>)}</select></Field><Field label="Injection side"><select value={data.injectionSide} onChange={e=>update("injectionSide",e.target.value as CaseInput["injectionSide"])}><option value="unknown">Unknown</option><option value="right">Right</option><option value="left">Left</option><option value="bilateral">Bilateral</option></select></Field></div>
            <div className="check-grid compact"><Check checked={data.completedExerciseProgram} onChange={v=>update("completedExerciseProgram",v)}>Structured exercise-based care completed</Check><Check checked={data.medicationTrial} onChange={v=>update("medicationTrial",v)}>Medication trial documented</Check></div>
          </Card>
          <details className="advanced"><summary>Perioperative risk and optimization</summary><div className="advanced-body"><div className="grid three"><Field label="BMI"><input type="number" min="10" max="80" value={data.bmi} onChange={e=>update("bmi",+e.target.value)}/></Field><Field label="HbA1c"><input type="number" min="3" max="20" step="0.1" value={data.a1c} onChange={e=>update("a1c",+e.target.value)}/></Field><Field label="Frailty"><select value={data.frailty} onChange={e=>update("frailty",e.target.value as CaseInput["frailty"])}><option value="none">None</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option><option value="unknown">Unknown</option></select></Field><Field label="Bone health"><select value={data.boneHealth} onChange={e=>update("boneHealth",e.target.value as CaseInput["boneHealth"])}><option value="normal">Normal</option><option value="osteopenia">Osteopenia</option><option value="osteoporosis">Osteoporosis</option><option value="unknown">Unknown</option></select></Field></div><div className="check-grid compact"><Check checked={data.smoking} onChange={v=>update("smoking",v)}>Current smoking</Check><Check checked={data.diabetes} onChange={v=>update("diabetes",v)}>Diabetes</Check><Check checked={data.chronicOpioidUse} onChange={v=>update("chronicOpioidUse",v)}>Chronic opioid use</Check><Check checked={data.depressionAnxietyConcern} onChange={v=>update("depressionAnxietyConcern",v)}>Depression or anxiety concern</Check><Check checked={data.anticoagulation} onChange={v=>update("anticoagulation",v)}>Anticoagulation</Check></div></div></details>
          <Card title="Final review" eyebrow="REQUIRED BEFORE SYNTHESIS" tone="soft">
            <p className="muted">Review the three confirmations below before generating. Unchecked red flags mean “not identified,” not “not assessed.”</p>
            {(!finalReview.safety || !finalReview.priorCare || !finalReview.risk) && <div className="review-status" role="status">{[finalReview.safety, finalReview.priorCare, finalReview.risk].filter(Boolean).length} of 3 final-review confirmations completed. You may click Generate clinical synthesis at any time; missing confirmations will be highlighted.</div>}
            <div className="final-review-grid">
              <Check checked={finalReview.safety} onChange={v=>setFinalReview(p=>({...p,safety:v}))}>Urgent safety screen reviewed</Check>
              <Check checked={finalReview.priorCare} onChange={v=>setFinalReview(p=>({...p,priorCare:v}))}>Prior care and injection details reviewed</Check>
              <Check checked={finalReview.risk} onChange={v=>setFinalReview(p=>({...p,risk:v}))}>Perioperative risk reviewed or not applicable</Check>
            </div>
          </Card>
        </div>}

        <div className="form-footer wizard-footer">
          <div className="footer-progress"><strong>Step {stageIndex + 1} of 4</strong><span>{stage === "planning" ? "Review all sections, then generate the final synthesis." : "Complete this section and continue."}</span></div>
          <div className="footer-actions">
            {stageIndex > 0 && <button className="secondary-button" type="button" onClick={goBack}>Back</button>}
            {stage !== "planning" ? <button className="primary-button" type="button" onClick={goNext}>Continue</button> : <button className="primary-button" type="submit" title="Generate clinical synthesis after required review checks are completed">Generate clinical synthesis</button>}
          </div>
        </div>
      </form>

      {result && <section className="results" ref={resultsRef} aria-live="polite">
        <>
          <div className="result-header"><div><span className="stage-kicker">Generated {generatedAt}</span><h2>Clinical synthesis</h2></div><div className="result-badges"><Pill tone={statusTone}>{result.urgency.toUpperCase()} PATHWAY</Pill><Pill tone={recTone}>{result.reconciliation.replace("-"," ").toUpperCase()}</Pill></div></div>
          {stale && <div className="stale-note">Inputs changed after generation. Regenerate before using this summary.</div>}

          <div className="summary-strip">
            <div><small>Clinical syndrome</small><strong>{result.syndrome}</strong></div>
            <div><small>Items needing review</small><strong>{reviewCount}</strong></div>
            <div><small>Patient goal</small><strong>{snapshot?.patientGoal}</strong></div>
          </div>

          <Card title={result.urgency === "routine" ? "Priority assessment" : "Time-sensitive assessment"} eyebrow="WHAT MATTERS NOW" tone={result.urgency === "routine" ? "soft" : "warning"}><p className="lead">{result.urgencyReason}</p></Card>

          <div className="result-tabs"><button className={resultTab==="assessment"?"active":""} onClick={()=>setResultTab("assessment")}>Assessment</button><button className={resultTab==="management"?"active":""} onClick={()=>setResultTab("management")}>Management</button><button className={resultTab==="hybrid"?"active":""} onClick={()=>setResultTab("hybrid")}>Hybrid AI</button><button className={resultTab==="evidence"?"active":""} onClick={()=>setResultTab("evidence")}>Evidence</button></div>

          {resultTab === "assessment" && <div className="result-stack">
            <Card title="Clinical–imaging reconciliation" eyebrow={result.reconciliation.toUpperCase()}><p>{result.reconciliationNarrative}</p></Card>
            <div className="two-col"><Card title="Supporting findings"><List items={result.support} empty="No positive concordance feature was established by the current fields."/></Card><Card title="Contradictions and uncertainty"><List items={result.contradictions} empty="No major contradiction was identified by the current rule set."/></Card></div>
            <Card title="Information still needed"><List items={result.missing} empty="No major missing element was identified by the current form."/></Card>
            <details className="detail-block"><summary>Clinical quality checks</summary><div className="check-list">{result.checks.map(x=><div key={x.label}><span className={`status-dot ${x.status}`}></span><div><b>{x.label}</b><small>{x.rationale}</small></div><Pill tone={x.status==="met"?"good":x.status==="review"?"warn":"neutral"}>{x.status}</Pill></div>)}</div></details>
            <details className="detail-block"><summary>Alternative diagnoses and mimics</summary><div className="detail-body"><List items={result.alternatives} empty="No specific competing diagnosis was triggered; clinical judgment remains required."/></div></details>
          </div>}

          {resultTab === "management" && <div className="result-stack">
            <Card title="Recommended next actions" eyebrow="SEQUENCED PLAN"><List items={[...result.diagnosticNextSteps, ...result.surgicalDecision]} empty="No additional action was automatically generated."/></Card>
            <div className="two-col"><Card title="Nonoperative pathway"><List items={result.nonoperativePathway} empty="No routine nonoperative pathway was generated because the case requires escalation or clarification."/></Card><Card title="Optimization priorities"><List items={result.optimization} empty="No specific optimization item was triggered by the current inputs."/></Card></div>
            <Card title="Potential operative strategies" eyebrow="ONLY IF CLINICALLY CONCORDANT"><List items={result.operativeOptions} empty="No procedure-specific option was generated until a surgically remediable lesion is established."/></Card>
            <Card title="Decompression versus fusion" tone="soft"><p className="lead">{result.fusionAssessment}</p></Card>
            <details className="detail-block" open><summary>Prerequisites before operative planning</summary><div className="detail-body"><List items={result.surgicalPrerequisites}/></div></details>
            <details className="detail-block"><summary>Procedure-related risks to discuss</summary><div className="detail-body"><List items={result.operativeRisks}/></div></details>
          </div>}

          {resultTab === "hybrid" && synthetic && <div className="result-stack">
            <Card title="Synthetic analog model" eyebrow="HYBRID AI RESEARCH MODULE" tone="soft">
              <p className="lead">{synthetic.modelNotice}</p>
              <div className="model-meta"><span><b>{synthetic.cohortSize.toLocaleString()}</b> simulated analogs</span><span><b>{synthetic.confidence}</b> interpretability confidence</span></div>
            </Card>
            <Card title="Pathway support across simulated analogs" eyebrow="SCENARIO AGREEMENT — NOT OUTCOME PROBABILITY">
              <div className="pathway-bars">{synthetic.pathwaySupport.map(x=><div className="pathway-row" key={x.key}><div className="pathway-label"><b>{x.label}</b><span>{x.agreement}%</span></div><div className="pathway-track"><i style={{width:`${x.agreement}%`}} /></div><small>{x.rationale}</small></div>)}</div>
            </Card>
            <div className="two-col"><Card title="Closest simulated profile"><p>{synthetic.nearestProfile}</p></Card><Card title="Uncertainty drivers"><List items={synthetic.uncertaintyDrivers} empty="No major uncertainty driver was triggered by the current fields."/></Card></div>
            <Card title="Outcome prediction status" tone="warning"><p>{synthetic.outcomeStatus}</p></Card>
            <details className="detail-block"><summary>How this module works</summary><div className="detail-body"><ul><li>Patient inputs are passed first through the safety and literature-rule engine.</li><li>A deterministic Monte Carlo cohort perturbs transparent evidence-informed pathway assumptions.</li><li>The displayed percentages summarize simulated scenario agreement, not treatment benefit, complication risk, or causal effect.</li><li>Safety rules override the synthetic model. No autonomous order or procedure recommendation is generated.</li></ul></div></details>
          </div>}

          {resultTab === "evidence" && <div className="result-stack"><Card title="Evidence map" eyebrow="RULE-CATEGORY SUPPORT"><p className="muted">These references support the general rule category. They do not validate this software or create a patient-specific recommendation.</p><div className="evidence-list">{evidence.map(x=><article key={x.id}><div><Pill tone="info">{x.id}</Pill><span>{x.year}</span></div><h3>{x.title}</h3><p>{x.source}</p><small>{x.note}</small></article>)}</div></Card></div>}

          <button className="print-button" onClick={()=>window.print()}>Print clinician summary</button>
        </>
      </section>}
    </div>
  </main>;
}
