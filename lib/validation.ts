import type { CaseInput, ClinicalStatus, LumbarLevel, Measurement } from "./schema.ts";

export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationDomain = "orientation" | "safety" | "symptoms" | "examination" | "imaging" | "treatment" | "risk" | "research";
export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  domain: ValidationDomain;
  field?: string;
  title: string;
  message: string;
  action?: string;
};

type RangeRule = { field:keyof CaseInput; label:string; min:number; max:number; warningMin?:number; warningMax?:number; domain:ValidationDomain };
const rangeRules:RangeRule[] = [
  {field:"age",label:"Age",min:0,max:120,warningMin:18,warningMax:100,domain:"orientation"},
  {field:"symptomDurationWeeks",label:"Symptom duration",min:0,max:1000,warningMax:520,domain:"symptoms"},
  {field:"backPainNrs",label:"Back pain",min:0,max:10,domain:"symptoms"},
  {field:"legPainNrs",label:"Leg pain",min:0,max:10,domain:"symptoms"},
  {field:"walkingLimitMeters",label:"Walking limit",min:0,max:50000,warningMax:20000,domain:"symptoms"},
  {field:"imagingAgeMonths",label:"Imaging age",min:0,max:600,warningMax:12,domain:"imaging"},
  {field:"exerciseWeeks",label:"Exercise duration",min:0,max:520,warningMax:104,domain:"treatment"},
  {field:"hba1c",label:"HbA1c",min:3,max:20,warningMin:4,warningMax:14,domain:"risk"},
  {field:"bmi",label:"BMI",min:10,max:80,warningMin:15,warningMax:60,domain:"risk"},
  {field:"hemoglobin",label:"Hemoglobin",min:3,max:22,warningMin:7,warningMax:18,domain:"risk"},
  {field:"albumin",label:"Albumin",min:1,max:6,warningMin:2,warningMax:5.5,domain:"risk"},
  {field:"frailtyScale",label:"Clinical Frailty Scale",min:1,max:9,domain:"risk"},
  {field:"dexTScore",label:"DEXA T-score",min:-7,max:5,warningMin:-5,warningMax:3,domain:"risk"},
  {field:"opioidMme",label:"Opioid MME/day",min:0,max:2000,warningMax:300,domain:"risk"},
];

const assessed=(x:ClinicalStatus)=>x==="present"||x==="absent"||x==="not-applicable";
const measured=(m:Measurement)=>m.status==="measured"&&m.value!==null;
const add=(issues:ValidationIssue[], issue:ValidationIssue)=>issues.push(issue);

export function validateCaseInput(i:CaseInput):ValidationIssue[]{
  const issues:ValidationIssue[]=[];
  for(const r of rangeRules){
    const m=i[r.field] as Measurement;
    if(!m||typeof m!=="object"||!("status" in m)) continue;
    if(m.status==="measured"&&m.value===null) add(issues,{id:`${String(r.field)}-missing-value`,severity:"error",domain:r.domain,field:String(r.field),title:`${r.label} is marked measured without a value`,message:"Enter the measured value or change the measurement status.",action:`Review ${r.label}.`});
    if(m.status!=="measured"&&m.value!==null) add(issues,{id:`${String(r.field)}-value-status`,severity:"error",domain:r.domain,field:String(r.field),title:`${r.label} has a value but is not marked measured`,message:"Measured values must use the Measured status.",action:`Correct the status for ${r.label}.`});
    if(measured(m)){
      const v=m.value!;
      if(v<r.min||v>r.max) add(issues,{id:`${String(r.field)}-range`,severity:"error",domain:r.domain,field:String(r.field),title:`${r.label} is outside the allowed range`,message:`Entered value ${v} is outside ${r.min}–${r.max}${m.unit?` ${m.unit}`:""}.`,action:"Correct the value or verify the unit."});
      else if((r.warningMin!==undefined&&v<r.warningMin)||(r.warningMax!==undefined&&v>r.warningMax)) add(issues,{id:`${String(r.field)}-unusual`,severity:"warning",domain:r.domain,field:String(r.field),title:`${r.label} is unusual but possible`,message:`Confirm ${v}${m.unit?` ${m.unit}`:""} and its unit before using it in the synthesis.`,action:"Confirm the value."});
    }
  }

  if(i.primaryRegion==="not-assessed") add(issues,{id:"region-missing",severity:"error",domain:"orientation",field:"primaryRegion",title:"Primary region is not selected",message:"The lumbar pathway cannot be interpreted until the primary region is identified.",action:"Select lumbar/lumbosacral, another region, multiple regions, or uncertain."});
  if(i.primaryRegion!=="not-assessed"&&i.primaryRegion!=="lumbar") add(issues,{id:"region-outside",severity:"error",domain:"orientation",field:"primaryRegion",title:"Selected region is outside the current lumbar module",message:"This build does not contain validated cervical or thoracic localization and treatment logic. Safety screening may continue, but lumbar questions and synthesis must not be used.",action:"Use the appropriate region-specific module or change the region only if the lumbar spine is the true primary focus."});
  if(measured(i.age)&&i.age.value!<18) add(issues,{id:"pediatric",severity:"warning",domain:"orientation",field:"age",title:"Patient is outside the initial adult scope",message:"The current treatment-reconciliation rules have not been developed for pediatric patients.",action:"Use safety screening only and refer to the pediatric pathway."});

  const safety:[string,ClinicalStatus][]=[
    ["urinary retention",i.urinaryRetention],["loss of urinary sensation",i.urinarySensationLoss],["difficulty initiating urination",i.urinaryInitiationDifficulty],["overflow incontinence",i.overflowIncontinence],["saddle sensory change",i.saddleSensoryChange],["severe bilateral deficit",i.bilateralSevereDeficit],["progressive weakness",i.progressiveWeakness],["infection warning",i.feverOrSystemicInfection],["cancer warning",i.cancerWarning],["trauma/fracture warning",i.traumaOrFractureWarning],
  ];
  const incomplete=safety.filter(([,s])=>!assessed(s));
  if(incomplete.length) add(issues,{id:"safety-incomplete",severity:"error",domain:"safety",title:"Emergency assessment is incomplete",message:`${incomplete.length} required safety item(s) remain unknown or not assessed.`,action:"Complete the safety screen before interpreting urgency as routine."});
  if(safety.some(([,s])=>s==="present")&&i.proposedProcedure!=="not-assessed"&&i.proposedProcedure!=="none") add(issues,{id:"emergency-elective-conflict",severity:"error",domain:"safety",title:"Elective procedure planning conflicts with a safety warning",message:"One or more emergency or serious-pathology findings are present while an elective procedure is selected.",action:"Resolve the emergency pathway before elective planning."});
  if(i.progressiveWeakness==="present"&&i.weaknessTrajectory!=="progressive") add(issues,{id:"progression-conflict",severity:"warning",domain:"examination",field:"weaknessTrajectory",title:"Progressive weakness is documented inconsistently",message:"The safety screen marks progression present, but the examination trajectory is not progressive.",action:"Reconcile the safety and examination entries."});
  if(i.weaknessTrajectory==="progressive"&&i.progressiveWeakness!=="present") add(issues,{id:"trajectory-safety-conflict",severity:"error",domain:"examination",field:"weaknessTrajectory",title:"Progressive weakness conflicts with the safety screen",message:"The examination trajectory is progressive, but the safety screen does not record progressive weakness as present.",action:"Confirm whether weakness is new or progressive and reconcile both sections before synthesis."});
  const allMotor=[i.rightKneeExtension,i.leftKneeExtension,i.rightAnkleDorsiflexion,i.leftAnkleDorsiflexion,i.rightGreatToeExtension,i.leftGreatToeExtension,i.rightPlantarFlexion,i.leftPlantarFlexion];
  if(i.progressiveWeakness==="present"&&allMotor.every(x=>x==="5"||x==="not-tested")) add(issues,{id:"progression-normal-motor",severity:"warning",domain:"examination",title:"Progressive weakness lacks a documented motor deficit",message:"All tested motor grades are normal or not tested.",action:"Clarify whether progression is patient-reported, clinically suspected, or objectively documented."});

  if(i.imagesReviewed!=="present"&&i.imagingMatrix.some(l=>[l.central,l.rightRecess,l.leftRecess,l.rightForamen,l.leftForamen].some(s=>s!=="not-graded")||l.rootDeformation==="present")) add(issues,{id:"images-not-reviewed-details",severity:"warning",domain:"imaging",field:"imagesReviewed",title:"Detailed imaging findings were entered without direct image review",message:"Confirm whether these findings came from the report or direct review.",action:"Document the imaging source accurately."});
  if(i.imagesReviewed==="absent"&&i.levelByLevelDocumented==="present") add(issues,{id:"imaging-source-conflict",severity:"warning",domain:"imaging",title:"Level-by-level findings conflict with imaging review status",message:"The record says images were not reviewed but the detailed matrix is complete.",action:"Clarify whether the matrix is report-derived or image-derived."});
  const rightClinical=i.side==="right"; const leftClinical=i.side==="left";
  const rightSevere=i.imagingMatrix.some(l=>l.rightRecess==="moderate"||l.rightRecess==="severe"||l.rightForamen==="moderate"||l.rightForamen==="severe");
  const leftSevere=i.imagingMatrix.some(l=>l.leftRecess==="moderate"||l.leftRecess==="severe"||l.leftForamen==="moderate"||l.leftForamen==="severe");
  if(rightClinical&&!rightSevere&&leftSevere) add(issues,{id:"side-mismatch-right",severity:"warning",domain:"imaging",title:"Symptoms and imaging are side-discordant",message:"Symptoms are right-sided, but only left-sided moderate/severe compression is documented.",action:"Confirm symptom laterality and imaging side."});
  if(leftClinical&&!leftSevere&&rightSevere) add(issues,{id:"side-mismatch-left",severity:"warning",domain:"imaging",title:"Symptoms and imaging are side-discordant",message:"Symptoms are left-sided, but only right-sided moderate/severe compression is documented.",action:"Confirm symptom laterality and imaging side."});

  if(i.exerciseProgramCompleted==="absent"&&measured(i.exerciseWeeks)&&i.exerciseWeeks.value!>0) add(issues,{id:"exercise-conflict",severity:"error",domain:"treatment",title:"Exercise-program entries conflict",message:"Exercise is marked not completed, but a positive duration was entered.",action:"Correct the completion status or duration."});
  if(i.injectionResponse!=="not-tried"&&i.injectionResponse!=="unknown"){
    if(i.injectionLevel==="unknown"||i.injectionLevel==="not-applicable") add(issues,{id:"injection-level-missing",severity:"warning",domain:"treatment",field:"injectionLevel",title:"Injection response lacks a documented level",message:"A response is recorded without the lumbar injection level.",action:"Enter the level or leave it explicitly unknown after review."});
    if(i.injectionSide==="not-assessed") add(issues,{id:"injection-side-missing",severity:"warning",domain:"treatment",field:"injectionSide",title:"Injection response lacks a documented side",message:"A response is recorded without injection laterality.",action:"Enter right, left, bilateral, or midline when applicable."});
  }
  if(i.injectionResponse==="not-tried"&&(i.injectionLevel!=="not-applicable"||i.injectionSide!=="not-assessed")) add(issues,{id:"injection-history-conflict",severity:"warning",domain:"treatment",field:"injectionResponse",title:"Injection history is internally inconsistent",message:"No injection is recorded, but a target remains in the case.",action:"Clear the target or correct the injection-response entry."});
  const imagingLevels=i.imagingMatrix.filter(l=>[l.central,l.rightRecess,l.leftRecess,l.rightForamen,l.leftForamen].some(v=>v!=="none"&&v!=="not-graded")).map(l=>l.level);
  if(i.injectionResponse!=="not-tried"&&i.injectionResponse!=="unknown"&&i.injectionLevel!=="unknown"&&i.injectionLevel!=="not-applicable"&&!imagingLevels.includes(i.injectionLevel)) add(issues,{id:"injection-level-imaging-mismatch",severity:"warning",domain:"treatment",field:"injectionLevel",title:"Injection target lacks corresponding imaging documentation",message:`The injection was recorded at ${i.injectionLevel}, but no potentially relevant imaging abnormality is documented at that level.`,action:"Review the injection type and target, or document the corresponding imaging level."});
  if(i.injectionResponse!=="not-tried"&&i.injectionResponse!=="unknown"&&i.injectionSide!=="not-assessed"&&i.side!=="not-assessed"&&i.side!=="bilateral"&&i.injectionSide!=="bilateral"&&i.injectionSide!=="midline"&&i.injectionSide!==i.side) add(issues,{id:"injection-side-symptom-mismatch",severity:"warning",domain:"treatment",field:"injectionSide",title:"Injection side differs from the primary symptom side",message:`The injection was ${i.injectionSide}-sided, while symptoms are recorded as ${i.side}-sided.`,action:"Confirm symptom laterality and whether the injection was diagnostic, therapeutic, selective, or nonselective."});
  if(i.proposedProcedure!=="not-assessed"&&i.proposedProcedure!=="none") for(const level of i.proposedLevels) if(!imagingLevels.includes(level)) add(issues,{id:`proposed-level-${level}-imaging-missing`,severity:"error",domain:"treatment",field:"proposedLevels",title:"A proposed procedure level lacks imaging documentation",message:`${level} is selected for the proposed pathway, but no potentially relevant ${level} imaging abnormality is documented.`,action:"Document the relevant imaging finding or remove the level from the proposed pathway."});
  if(i.proposedProcedure==="fusion"||i.proposedProcedure==="decompression-fusion"){
    if(!i.proposedLevels.length) add(issues,{id:"fusion-level-missing",severity:"error",domain:"treatment",field:"proposedLevels",title:"Fusion is selected without an operative level",message:"At least one proposed level is required for level-specific fusion reasoning.",action:"Select the proposed level(s)."});
  }
  if((i.proposedProcedure==="decompression"||i.proposedProcedure==="discectomy")&&i.fusionMatrix.some(f=>f.pseudarthrosis==="present")) add(issues,{id:"pseudarthrosis-nonfusion",severity:"warning",domain:"treatment",title:"Pseudarthrosis is documented in a nonfusion pathway",message:"Confirm that this is historical and not being interpreted as a current decompression risk output.",action:"Review prior fusion history."});

  if(i.smokingStatus==="never"&&(i.nicotineVaping==="present"||i.smokelessTobacco==="present")) add(issues,{id:"nicotine-conflict",severity:"warning",domain:"risk",title:"Nicotine history is internally inconsistent",message:"Smoking is marked never, but another nicotine exposure is present.",action:"Clarify tobacco and nicotine history."});
  if(i.diabetesType==="none"&&measured(i.hba1c)) add(issues,{id:"diabetes-hba1c-conflict",severity:"warning",domain:"risk",title:"HbA1c is entered while diabetes is marked absent",message:"This may be appropriate screening, but confirm that diabetes status is correct.",action:"Confirm diabetes status and reason for testing."});
  if(i.diabetesType!=="none"&&i.diabetesType!=="not-assessed"&&i.hba1c.status!=="measured") add(issues,{id:"diabetes-hba1c-missing",severity:"info",domain:"risk",title:"Current HbA1c is unavailable",message:"Procedure-specific glycemic interpretation cannot be completed.",action:"Enter a current measured HbA1c when available."});
  if(i.priorSurgeryType==="none"&&(i.sameLevelRevision==="present"||i.priorDuralTear==="present"||i.priorInfection==="present"||i.priorPseudarthrosis==="present")) add(issues,{id:"surgery-history-conflict",severity:"error",domain:"risk",title:"Prior-surgery history is contradictory",message:"A prior surgical complication is present while prior surgery is marked none.",action:"Correct the prior-surgery type or complication history."});
  if(i.boneHealth==="not-assessed"&&i.proposedProcedure.includes("fusion")) add(issues,{id:"bone-health-unassessed",severity:"warning",domain:"risk",title:"Bone health is not assessed for a fusion pathway",message:"Instrumentation planning may be incomplete without bone-health review.",action:"Document available DEXA, fragility-fracture history, or bone-health status."});

  if(!i.patientGoal.trim()) add(issues,{id:"goal-missing",severity:"info",domain:"orientation",field:"patientGoal",title:"Patient goal is not documented",message:"A meaningful treatment synthesis should reflect the patient’s main functional goal.",action:"Enter the main goal."});
  return issues;
}

export function hasBlockingErrors(issues:ValidationIssue[]){return issues.some(x=>x.severity==="error");}
export function issuesByDomain(issues:ValidationIssue[],domain:ValidationDomain){return issues.filter(x=>x.domain===domain);}
