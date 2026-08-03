import type { CaseInput, ClinicalStatus, FusionLevelFinding, LevelFinding, LumbarLevel, MotorGrade, Root, Severity, Zone } from "./schema.ts";

export type FindingTone = "critical" | "warning" | "positive" | "neutral" | "info";
export type HighlightFinding = { title:string; detail:string; tone:FindingTone; priority:1|2|3; ruleId:string };
export type CandidateTarget = { rank:number; level:LumbarLevel; side:"right"|"left"|"bilateral"; root:Root|"multiroot"; zone:Zone; support:string[]; conflicts:string[]; unavailable:string[]; researchScore:number };
export type ModuleStatus = "available" | "limited" | "unavailable" | "out-of-scope";
export type DecisionOutput = {
  urgency:"emergency"|"urgent"|"routine"|"indeterminate";
  urgencyReason:string;
  applicability:{ safety:ModuleStatus; localization:ModuleStatus; treatment:ModuleStatus; risk:ModuleStatus; reasons:string[] };
  syndrome:{ clinicianEntered:string; derived:"radiculopathy-supported"|"radiculopathy-partial"|"claudication-supported"|"claudication-partial"|"mixed"|"not-supported"|"indeterminate"; rationale:string[]; conflicts:string[] };
  neurologic:{ severity:"none"|"mild"|"moderate"|"severe"|"indeterminate"; reliability:"high"|"moderate"|"low"|"indeterminate"; rationale:string[] };
  targets:CandidateTarget[];
  highlights:HighlightFinding[];
  missing:string[];
  mimics:string[];
  nextSteps:string[];
  nonoperative:string[];
  specialistReview:{ status:"supported"|"not-established"|"unable-to-assess"|"urgent"; reasons:string[]; limitations:string[] };
  fusion:{ status:"established"|"possible"|"not-established"|"unable-to-assess"|"not-applicable"; level?:LumbarLevel; reasons:string[]; missing:string[] };
  risk:{ patientSpecific:string[]; procedureSpecific:string[]; generalEducation:string[]; status:"available"|"limited"|"not-assessed" };
  ruleTrace:{ ruleId:string; input:string; conclusion:string; evidenceIds:string[]; strength:"high"|"moderate"|"limited"|"consensus" }[];
};

const isPresent=(s:ClinicalStatus)=>s==="present";
const isAssessed=(s:ClinicalStatus)=>s==="present"||s==="absent"||s==="not-applicable";
const grade=(g:MotorGrade):number|null=>g==="not-tested"?null:g==="4+"?4.5:Number(g);
const severityValue=(s:Severity)=>s==="none"?0:s==="mild"?1:s==="moderate"?2:s==="severe"?3:null;
const sideMatches=(caseSide:CaseInput["side"],side:"right"|"left"|"bilateral")=>caseSide==="bilateral"||side==="bilateral"||caseSide===side;

const rootFor=(level:LumbarLevel,zone:Zone):Root|"multiroot"|null=>{
  if(zone==="central") return "multiroot";
  const foraminal=zone.includes("foramen");
  if(level==="L3-4") return foraminal?null:"L4";
  if(level==="L4-5") return foraminal?"L4":"L5";
  if(level==="L5-S1") return foraminal?"L5":"S1";
  return null;
};

function safety(i:CaseInput){
  const required:[string,ClinicalStatus][]=[
    ["urinary retention",i.urinaryRetention],["loss of urinary sensation",i.urinarySensationLoss],["difficulty initiating urination",i.urinaryInitiationDifficulty],["overflow incontinence",i.overflowIncontinence],["saddle sensory change",i.saddleSensoryChange],["bilateral severe deficit",i.bilateralSevereDeficit],["progressive weakness",i.progressiveWeakness],["systemic infection warning",i.feverOrSystemicInfection],["cancer warning",i.cancerWarning],["trauma/fracture warning",i.traumaOrFractureWarning]
  ];
  const missing=required.filter(([,s])=>!isAssessed(s)).map(([n])=>n);
  const emergency=required.slice(0,6).filter(([,s])=>isPresent(s)).map(([n])=>n);
  const urgent=required.slice(6).filter(([,s])=>isPresent(s)).map(([n])=>n);
  if(emergency.length) return {urgency:"emergency" as const, reason:`Emergency warning finding(s): ${emergency.join(", ")}. Follow the local emergency pathway immediately.`,missing};
  if(urgent.length) return {urgency:"urgent" as const, reason:`Expedited assessment is supported because of: ${urgent.join(", ")}.`,missing};
  if(missing.length) return {urgency:"indeterminate" as const, reason:`Urgency cannot be resolved because required safety findings are not fully assessed: ${missing.join(", ")}.`,missing};
  return {urgency:"routine" as const, reason:"Required emergency warning findings were documented as absent. This does not independently exclude emergency pathology.",missing};
}

function syndrome(i:CaseInput){
  const rad:string[]=[]; const claud:string[]=[]; const conflicts:string[]=[];
  if(isPresent(i.legDominantPain)) rad.push("leg-dominant pain");
  if(isPresent(i.dermatomalPain)) rad.push("dermatomal pain distribution");
  if(i.straightLegRaise==="positive"||i.femoralStretch==="positive") rad.push("positive nerve-tension test");
  const motorAbnormal=[i.rightKneeExtension,i.leftKneeExtension,i.rightAnkleDorsiflexion,i.leftAnkleDorsiflexion,i.rightGreatToeExtension,i.leftGreatToeExtension,i.rightPlantarFlexion,i.leftPlantarFlexion].some(g=>grade(g)!==null&&grade(g)!<5);
  if(motorAbnormal) rad.push("focal motor abnormality");
  if([i.rightSensoryRoot,i.leftSensoryRoot].some(x=>["L4","L5","S1"].includes(String(x)))) rad.push("dermatomal sensory finding");
  if(isPresent(i.standingProvokes)||isPresent(i.walkingProvokes)) claud.push("standing/walking provocation");
  if(isPresent(i.sittingRelieves)||isPresent(i.flexionRelieves)) claud.push("sitting/flexion relief");
  if(isPresent(i.bicycleBetter)||isPresent(i.uphillBetterThanDownhill)) claud.push("flexion-favoring activity pattern");
  if(isPresent(i.legHeaviness)) claud.push("leg heaviness");
  if(isPresent(i.stoppingAloneRelieves)||isPresent(i.pulsesAbnormal)) conflicts.push("vascular features require review");
  if(isPresent(i.hipExamAbnormal)||isPresent(i.groinPain)) conflicts.push("hip findings may compete with lumbar attribution");
  if(isPresent(i.neuropathyFeatures)) conflicts.push("peripheral neuropathy may compete with root localization");
  let derived:DecisionOutput["syndrome"]["derived"]="indeterminate";
  if(rad.length>=3&&claud.length>=2) derived="mixed";
  else if(rad.length>=3) derived="radiculopathy-supported";
  else if(rad.length>=1) derived="radiculopathy-partial";
  else if(claud.length>=3) derived="claudication-supported";
  else if(claud.length>=1) derived="claudication-partial";
  else if(i.clinicianPhenotype!=="not-assessed") derived="not-supported";
  return { clinicianEntered:i.clinicianPhenotype, derived, rationale:[...rad,...claud], conflicts };
}

function neurologic(i:CaseInput){
  const tested=[i.rightKneeExtension,i.leftKneeExtension,i.rightAnkleDorsiflexion,i.leftAnkleDorsiflexion,i.rightGreatToeExtension,i.leftGreatToeExtension,i.rightPlantarFlexion,i.leftPlantarFlexion].map(grade).filter((x):x is number=>x!==null);
  const rationale:string[]=[];
  if(!tested.length&&i.rightSensoryRoot==="not-tested"&&i.leftSensoryRoot==="not-tested"&&i.rightPatellarReflex==="not-tested"&&i.leftPatellarReflex==="not-tested"&&i.rightAchillesReflex==="not-tested"&&i.leftAchillesReflex==="not-tested") return {severity:"indeterminate" as const,reliability:"indeterminate" as const,rationale:["Neurologic examination is not sufficiently completed."]};
  const min=tested.length?Math.min(...tested):5;
  if(min<=3) rationale.push(`lowest reliable motor grade ${min}/5`);
  else if(min<5) rationale.push(`focal motor grade below 5/5`);
  if(isPresent(i.heelWalkAbnormal)||isPresent(i.toeWalkAbnormal)||isPresent(i.repeatedHeelRaiseAbnormal)) rationale.push("functional motor abnormality");
  if(isPresent(i.muscleAtrophy)) rationale.push("muscle atrophy");
  if(isPresent(i.progressiveWeakness)) rationale.push(`progressive weakness (${i.weaknessProgressionBasis})`);
  let severity:DecisionOutput["neurologic"]["severity"]="none";
  if(isPresent(i.progressiveWeakness)||min<=3||isPresent(i.bilateralSevereDeficit)) severity="severe";
  else if(min<5||isPresent(i.heelWalkAbnormal)||isPresent(i.toeWalkAbnormal)||isPresent(i.repeatedHeelRaiseAbnormal)) severity="moderate";
  else if([i.rightSensoryRoot,i.leftSensoryRoot].some(x=>["L4","L5","S1","non-dermatomal"].includes(String(x)))||[i.rightPatellarReflex,i.leftPatellarReflex,i.rightAchillesReflex,i.leftAchillesReflex].some(r=>["reduced","absent"].includes(r))) severity="mild";
  const reliability: DecisionOutput["neurologic"]["reliability"] = i.examConfidence==="not-assessed"?"indeterminate":i.examConfidence;
  if(i.weaknessQuality==="pain-limited"||i.weaknessQuality==="give-way"||i.weaknessQuality==="uncertain") rationale.push(`weakness quality is ${i.weaknessQuality}; confirmation is required`);
  return {severity,reliability,rationale};
}

function addMotorEvidence(i:CaseInput,root:Root,side:"right"|"left",support:string[],conflicts:string[],unavailable:string[]){
  const pick=(r:MotorGrade,l:MotorGrade)=>side==="right"?r:l;
  const tests:MotorGrade[] = root==="L4"?[pick(i.rightKneeExtension,i.leftKneeExtension)]:root==="L5"?[pick(i.rightAnkleDorsiflexion,i.leftAnkleDorsiflexion),pick(i.rightGreatToeExtension,i.leftGreatToeExtension)]:[pick(i.rightPlantarFlexion,i.leftPlantarFlexion)];
  const vals=tests.map(grade);
  if(vals.every(v=>v===null)) unavailable.push(`${root} motor examination not tested`);
  else if(vals.some(v=>v!==null&&v<5)) support.push(`${root}-compatible motor deficit`);
  else conflicts.push(`${root}-related motor testing is normal`);
  const sensory=side==="right"?i.rightSensoryRoot:i.leftSensoryRoot;
  if(sensory==="not-tested") unavailable.push("sensory examination not tested"); else if(sensory===root) support.push(`${root}-compatible sensory finding`); else if(sensory!=="none"&&sensory!=="not-assessed") conflicts.push(`sensory finding favors ${sensory}`);
  const reflex=root==="L4"?(side==="right"?i.rightPatellarReflex:i.leftPatellarReflex):root==="S1"?(side==="right"?i.rightAchillesReflex:i.leftAchillesReflex):null;
  if(reflex){ if(reflex==="not-tested") unavailable.push("relevant reflex not tested"); else if(reflex==="reduced"||reflex==="absent") support.push(`${root}-compatible reflex change`); }
}

function targets(i:CaseInput,sy:ReturnType<typeof syndrome>):CandidateTarget[]{
  const out:CandidateTarget[]=[];
  if(i.imagesReviewed!=="present"||i.levelByLevelDocumented!=="present"||i.imageQuality!=="adequate") return out;
  for(const lf of i.imagingMatrix){
    const zones:{zone:Zone;severity:Severity;side:"right"|"left"|"bilateral"}[]=[
      {zone:"central",severity:lf.central,side:"bilateral"},{zone:"right-recess",severity:lf.rightRecess,side:"right"},{zone:"left-recess",severity:lf.leftRecess,side:"left"},{zone:"right-foramen",severity:lf.rightForamen,side:"right"},{zone:"left-foramen",severity:lf.leftForamen,side:"left"}
    ];
    for(const z of zones){
      const sv=severityValue(z.severity); if(sv===null||sv<2) continue;
      const root=rootFor(lf.level,z.zone); if(!root) continue;
      const support:string[]=[]; const conflicts:string[]=[]; const unavailable:string[]=[];
      if(!sideMatches(i.side,z.side)) conflicts.push("symptom laterality is not compatible"); else support.push("compatible laterality");
      if(root==="multiroot"){
        if(sy.derived==="claudication-supported"||sy.derived==="mixed") support.push("neurogenic claudication phenotype"); else if(sy.derived==="claudication-partial") support.push("partial claudication phenotype"); else conflicts.push("central stenosis lacks a supported claudication phenotype");
      } else {
        addMotorEvidence(i,root,z.side as "right"|"left",support,conflicts,unavailable);
        if((root==="L5"||root==="S1")&&i.straightLegRaise==="positive") support.push("positive straight-leg raise");
        if(root==="L4"&&i.femoralStretch==="positive") support.push("positive femoral stretch test");
      }
      if(lf.rootDeformation==="present") support.push("root deformation documented"); else if(lf.rootDeformation==="not-assessed"||lf.rootDeformation==="unknown") unavailable.push("root deformation not assessed");
      if(isPresent(i.hipExamAbnormal)||isPresent(i.groinPain)) conflicts.push("competing hip finding");
      if(isPresent(i.pulsesAbnormal)||isPresent(i.stoppingAloneRelieves)) conflicts.push("competing vascular finding");
      if(isPresent(i.neuropathyFeatures)) conflicts.push("competing neuropathy finding");
      const clinicalSupport=support.filter(x=>!x.includes("root deformation")&&!x.includes("laterality")).length;
      if(clinicalSupport===0) continue;
      const score=Math.max(0,Math.min(100,sv*15+support.length*10-conflicts.length*12));
      out.push({rank:0,level:lf.level,side:z.side,root,zone:z.zone,support,conflicts,unavailable,researchScore:score});
    }
  }
  return out.sort((a,b)=>b.researchScore-a.researchScore).slice(0,5).map((x,idx)=>({...x,rank:idx+1}));
}

function applicability(i:CaseInput){
  const reasons:string[]=[];
  const outOfScope=[
    ["pregnancy",i.pregnant],["cervical/thoracic symptoms",i.cervicalThoracicSymptoms],["neuromuscular disease",i.neuromuscularDisease],["known tumor",i.knownTumor],["known infection",i.knownInfection],["acute fracture",i.acuteFracture],["major deformity",i.majorDeformity],["prior long fusion",i.priorLongFusion],["predominantly axial pain",i.predominantlyAxialPain]
  ] as [string,ClinicalStatus][];
  for(const [label,status] of outOfScope) if(isPresent(status)) reasons.push(label);
  const ageOut=i.age.status==="measured"&&i.age.value!==null&&i.age.value<18; if(ageOut) reasons.push("age under 18 years");
  const treatment:ModuleStatus=reasons.length?"out-of-scope":"available";
  const localization:ModuleStatus=reasons.length?"limited":i.imagesReviewed==="present"&&i.levelByLevelDocumented==="present"?"available":"limited";
  const risk:ModuleStatus=i.proposedProcedure==="not-assessed"||i.proposedProcedure==="none"?"unavailable":"available";
  return {safety:"available" as ModuleStatus,localization,treatment,risk,reasons};
}

function fusion(i:CaseInput,top:CandidateTarget|undefined):DecisionOutput["fusion"]{
  if(!top||top.root==="multiroot"&&!i.proposedLevels.length) return {status:"unable-to-assess",reasons:[],missing:["No level-specific operative target is available."]};
  if(i.proposedProcedure==="none"||i.proposedProcedure==="not-assessed"||i.proposedProcedure==="decompression"||i.proposedProcedure==="discectomy") return {status:"not-applicable",reasons:["Fusion is not the currently proposed procedure."],missing:[]};
  const level=(i.proposedLevels[0]||top.level) as LumbarLevel;
  const f=i.fusionMatrix.find(x=>x.level===level);
  if(!f) return {status:"unable-to-assess",level,reasons:[],missing:["Level-specific fusion assessment is missing."]};
  const reasons:string[]=[]; const missing:string[]=[];
  if(isPresent(f.dynamicInstability)) reasons.push("documented dynamic instability"); else if(!isAssessed(f.dynamicInstability)) missing.push("dynamic instability");
  if(isPresent(f.foraminalCollapse)) reasons.push("foraminal collapse at the proposed level"); else if(!isAssessed(f.foraminalCollapse)) missing.push("foraminal collapse");
  if(f.plannedFacetResectionPercent.status==="measured"&&f.plannedFacetResectionPercent.value!==null&&f.plannedFacetResectionPercent.value>=50) reasons.push("anticipated substantial facet resection"); else if(f.plannedFacetResectionPercent.status!=="measured") missing.push("planned facet resection extent");
  if(isPresent(f.revisionDestabilization)) reasons.push("revision-related destabilization"); else if(!isAssessed(f.revisionDestabilization)) missing.push("revision destabilization");
  if(isPresent(f.pseudarthrosis)) reasons.push("pseudarthrosis"); else if(!isAssessed(f.pseudarthrosis)) missing.push("pseudarthrosis status");
  if(isPresent(f.relevantDeformity)) reasons.push("relevant deformity at the proposed level"); else if(!isAssessed(f.relevantDeformity)) missing.push("level-specific deformity relevance");
  if(reasons.length>=2) return {status:"established",level,reasons,missing};
  if(reasons.length===1) return {status:"possible",level,reasons,missing};
  if(missing.length) return {status:"unable-to-assess",level,reasons,missing};
  return {status:"not-established",level,reasons:["No independent level-specific fusion factor was identified."],missing};
}

function risk(i:CaseInput):DecisionOutput["risk"]{
  if(i.proposedProcedure==="not-assessed"||i.proposedProcedure==="none") return {status:"not-assessed",patientSpecific:[],procedureSpecific:[],generalEducation:[]};
  const p:string[]=[]; const proc:string[]=[];
  if(i.smokingStatus==="current"||isPresent(i.nicotineVaping)||isPresent(i.smokelessTobacco)) p.push("Current nicotine exposure: optimization is recommended, especially before fusion.");
  if(!["none","not-assessed"].includes(i.diabetesType)){ if(i.hba1c.status!=="measured") p.push("Diabetes is present but a current HbA1c is unavailable."); else if(i.hba1c.value!==null&&i.hba1c.value>=8) p.push("Provisional glycemic optimization flag: HbA1c is elevated; apply the local procedure-specific pathway."); }
  if(i.hemoglobin.status==="measured"&&i.hemoglobin.value!==null&&i.hemoglobin.value<12) p.push("Provisional anemia flag: evaluate cause and optimize when feasible.");
  if(i.albumin.status==="measured"&&i.albumin.value!==null&&i.albumin.value<3.5) p.push("Provisional nutrition flag: low albumin requires clinical interpretation.");
  if(i.boneHealth==="osteoporosis"||isPresent(i.fragilityFracture)||(i.dexTScore.status==="measured"&&i.dexTScore.value!==null&&i.dexTScore.value<=-2.5)) p.push("Bone-health concern: complete procedure-specific optimization before instrumentation.");
  if(isPresent(i.chronicOpioidUse)||(i.opioidMme.status==="measured"&&i.opioidMme.value!==null&&i.opioidMme.value>0)) p.push("Preoperative opioid exposure: document MME, prescriber, expectations, and analgesic plan.");
  if(isPresent(i.sleepApnea)&&i.cpapAdherent!=="present") p.push("Sleep apnea without documented CPAP adherence requires perioperative review.");
  if(isPresent(i.anticoagulation)) p.push("A coordinated anticoagulation interruption and resumption plan is required.");
  if(isPresent(i.priorDvtPe)) p.push("Prior DVT/PE requires individualized thrombosis and bleeding planning.");
  if(isPresent(i.cardiopulmonaryDisease)) p.push("Cardiopulmonary comorbidity requires formal anesthesia and medical assessment.");
  if(isPresent(i.advancedRenalOrLiverDisease)) p.push("Advanced renal or liver disease may increase perioperative medical risk.");
  if(i.priorSurgeryType!=="none"&&i.priorSurgeryType!=="not-assessed") proc.push("Prior lumbar surgery increases technical complexity and may limit model applicability.");
  if(isPresent(i.sameLevelRevision)||isPresent(i.priorDuralTear)||isPresent(i.priorInfection)||isPresent(i.priorPseudarthrosis)) proc.push("Same-level revision or prior complication requires individualized technical planning.");
  if(i.proposedLevels.length>1) proc.push("Multilevel surgery generally carries greater procedural burden than a single-level operation.");
  return {status:p.length||proc.length?"available":"limited",patientSpecific:p,procedureSpecific:proc,generalEducation:["General procedural considerations include dural tear, neural injury, infection, persistent or recurrent symptoms, reoperation, and instability when relevant. These are not individualized estimates."]};
}

export function evaluateCase(i:CaseInput):DecisionOutput{
  const sf=safety(i); const sy=syndrome(i); const neuro=neurologic(i); const app=applicability(i); const t=targets(i,sy); const top=t[0]; const missing=[...sf.missing];
  if(i.imagesReviewed!=="present") missing.push("direct image review"); if(i.levelByLevelDocumented!=="present") missing.push("level-by-level imaging matrix"); if(i.examConfidence==="not-assessed") missing.push("examination confidence"); if(!i.patientGoal.trim()) missing.push("patient goal");
  const mimics=[...sy.conflicts];
  const objectiveStrong=neuro.severity==="moderate"||neuro.severity==="severe";
  const durable=i.symptomDurationWeeks.status==="measured"&&i.symptomDurationWeeks.value!==null&&i.symptomDurationWeeks.value>=6;
  const limitations:string[]=[];
  if(neuro.reliability==="low"||neuro.reliability==="indeterminate") limitations.push("Neurologic examination reliability is limited.");
  if(!top) limitations.push("No clinically eligible imaging target was established.");
  let specialist:DecisionOutput["specialistReview"];
  if(sf.urgency==="emergency"||sf.urgency==="urgent") specialist={status:"urgent",reasons:[sf.reason],limitations};
  else if(app.treatment==="out-of-scope") specialist={status:"unable-to-assess",reasons:["The case is outside the initial treatment-reconciliation scope."],limitations};
  else if(top&&(durable||objectiveStrong)&&top.conflicts.length<=1) specialist={status:"supported",reasons:[durable?"Symptoms have persisted for at least six weeks.":"A reliable objective neurologic deficit is present.",`Candidate ${top.rank}: ${top.side} ${top.root} at ${top.level} ${top.zone}.`],limitations};
  else if(!top||sf.urgency==="indeterminate") specialist={status:"unable-to-assess",reasons:[],limitations:[...limitations,"Required information is incomplete."]};
  else specialist={status:"not-established",reasons:["Current evidence does not establish specialist review support under the prespecified rule set."],limitations};
  const fus=fusion(i,top); const rk=risk(i);
  const highlights:HighlightFinding[]=[
    {title:`Urgency: ${sf.urgency}`,detail:sf.reason,tone:sf.urgency==="emergency"?"critical":sf.urgency==="urgent"?"warning":sf.urgency==="routine"?"positive":"neutral",priority:1,ruleId:"SAFE-001"},
    {title:`Syndrome: ${sy.derived.replaceAll("-"," ")}`,detail:sy.rationale.length?sy.rationale.join("; "):"Insufficient clinical features to derive a syndrome.",tone:sy.derived.includes("supported")?"positive":sy.derived==="indeterminate"?"neutral":"info",priority:1,ruleId:"SYN-001"},
    {title:top?`Best-supported target: ${top.side} ${top.root}, ${top.level} ${top.zone}`:"No symptomatic target established",detail:top?`${top.support.length} supporting domain(s), ${top.conflicts.length} conflict(s), ${top.unavailable.length} unavailable domain(s).`:"Severe imaging alone is not treated as symptomatic without clinical eligibility.",tone:top?"info":"neutral",priority:1,ruleId:"LOC-001"},
    {title:`Specialist review: ${specialist.status.replaceAll("-"," ")}`,detail:[...specialist.reasons,...specialist.limitations].join(" ")||"No additional statement.",tone:specialist.status==="urgent"?"warning":specialist.status==="supported"?"positive":"neutral",priority:2,ruleId:"TRT-001"},
    {title:`Fusion rationale: ${fus.status.replaceAll("-"," ")}`,detail:[...fus.reasons,...fus.missing.map(x=>`Missing: ${x}`)].join("; ")||"Not applicable.",tone:fus.status==="established"?"warning":fus.status==="possible"?"info":"neutral",priority:2,ruleId:"FUS-001"},
  ];
  const nextSteps:string[]=[];
  if(sf.urgency==="emergency") nextSteps.push("Follow the local emergency pathway immediately.");
  else if(sf.urgency==="urgent") nextSteps.push("Arrange expedited in-person clinical assessment and direct imaging review.");
  if(sf.urgency==="indeterminate") nextSteps.push("Complete the required safety screen before interpreting urgency as routine.");
  if(!top) nextSteps.push("Complete or repeat clinical localization, direct image review, and mimic assessment before an invasive procedure.");
  if(mimics.length) nextSteps.push("Address competing hip, vascular, or neuropathic findings before attributing symptoms to lumbar imaging.");
  const nonoperative=sf.urgency==="routine"?["Use shared decision-making and individualized exercise-based rehabilitation when appropriate.","Review medication contraindications, prior response, and patient preference.","A targeted injection may be considered for selected radicular cases; response does not independently prove the symptomatic level."]:[];
  const trace=[
    {ruleId:"SAFE-001",input:"Required emergency and serious-pathology fields",conclusion:sf.reason,evidenceIds:["CES-PATH","ACR-LBP"],strength:"consensus" as const},
    {ruleId:"SYN-001",input:"Symptoms, examination, tension signs, and mimics",conclusion:sy.derived,evidenceIds:["NASS-LDH","NASS-LSS"],strength:"moderate" as const},
    {ruleId:"LOC-001",input:"Clinically eligible level-side-zone findings",conclusion:top?`${top.root} at ${top.level} ${top.zone}`:"No target",evidenceIds:["NASS-LDH","NASS-LSS"],strength:"moderate" as const},
    {ruleId:"FUS-001",input:"Level-specific instability, collapse, resection, revision, pseudarthrosis, deformity",conclusion:fus.status,evidenceIds:["NORDSTEN-5Y","SWEDISH-LSS"],strength:"high" as const}
  ];
  return {urgency:sf.urgency,urgencyReason:sf.reason,applicability:app,syndrome:sy,neurologic:neuro,targets:t,highlights,missing,mimics,nextSteps,nonoperative,specialistReview:specialist,fusion:fus,risk:rk,ruleTrace:trace};
}
