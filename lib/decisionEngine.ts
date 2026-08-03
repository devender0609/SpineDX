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
  specialistReview:{ status:"emergency"|"expedited"|"routine-reasonable"|"additional-assessment"|"no-invasive-target"; reasons:string[]; limitations:string[] };
  fusion:{ status:"factors-documented"|"incompletely-assessed"|"no-independent-factor"|"not-applicable"; level?:LumbarLevel; reasons:string[]; missing:string[] };
  risk:{ patientSpecific:string[]; procedureSpecific:string[]; generalEducation:string[]; status:"available"|"limited"|"not-assessed" };
  concordance:{ domain:string; finding:string; status:"support"|"conflict"|"missing"|"neutral" }[];
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
  const rationale:string[]=[]; const conflicts:string[]=[];
  const symptomDomain=isPresent(i.legDominantPain)||isPresent(i.dermatomalPain);
  const tensionDomain=i.straightLegRaise==="positive"||i.femoralStretch==="positive";
  const motorDomain=[i.rightKneeExtension,i.leftKneeExtension,i.rightAnkleDorsiflexion,i.leftAnkleDorsiflexion,i.rightGreatToeExtension,i.leftGreatToeExtension,i.rightPlantarFlexion,i.leftPlantarFlexion].some(g=>grade(g)!==null&&grade(g)!<5);
  const sensoryDomain=[i.rightSensoryRoot,i.leftSensoryRoot].some(x=>["L4","L5","S1"].includes(String(x)));
  const reflexDomain=[i.rightPatellarReflex,i.leftPatellarReflex,i.rightAchillesReflex,i.leftAchillesReflex].some(r=>r==="reduced"||r==="absent");
  if(symptomDomain) rationale.push("radicular symptom phenotype");
  if(tensionDomain) rationale.push("positive nerve-tension test");
  if(motorDomain) rationale.push("focal motor abnormality");
  if(sensoryDomain) rationale.push("dermatomal sensory finding");
  if(reflexDomain) rationale.push("compatible reflex abnormality");
  const provocation=isPresent(i.standingProvokes)||isPresent(i.walkingProvokes);
  const relief=isPresent(i.sittingRelieves)||isPresent(i.flexionRelieves);
  const flexionPattern=isPresent(i.bicycleBetter)||isPresent(i.uphillBetterThanDownhill)||isPresent(i.legHeaviness);
  if(provocation) rationale.push("standing or walking provocation");
  if(relief) rationale.push("sitting or flexion relief");
  if(flexionPattern) rationale.push("flexion-favoring activity pattern");
  if(isPresent(i.stoppingAloneRelieves)||isPresent(i.pulsesAbnormal)) conflicts.push("vascular features require review");
  if(isPresent(i.hipExamAbnormal)||isPresent(i.groinPain)) conflicts.push("hip findings may compete with lumbar attribution");
  if(isPresent(i.neuropathyFeatures)) conflicts.push("peripheral neuropathy may compete with root localization");
  const radSupported=symptomDomain&&(motorDomain||sensoryDomain||reflexDomain||tensionDomain);
  const radPartial=symptomDomain||motorDomain||sensoryDomain||reflexDomain||tensionDomain;
  const claudSupported=provocation&&relief&&flexionPattern;
  const claudPartial=[provocation,relief,flexionPattern].filter(Boolean).length>=2;
  let derived:DecisionOutput["syndrome"]["derived"]="indeterminate";
  if(radSupported&&claudSupported) derived="mixed";
  else if(radSupported) derived="radiculopathy-supported";
  else if(claudSupported) derived="claudication-supported";
  else if(radPartial) derived="radiculopathy-partial";
  else if(claudPartial) derived="claudication-partial";
  else if(i.clinicianPhenotype!=="not-assessed") derived="not-supported";
  return { clinicianEntered:i.clinicianPhenotype, derived, rationale, conflicts };
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
  if(i.imagesReviewed!=="present"||i.levelByLevelDocumented!=="present"||i.imageQuality==="not-assessed"||i.imageQuality==="unknown") return out;
  for(const lf of i.imagingMatrix){
    const zones:{zone:Zone;severity:Severity;side:"right"|"left"|"bilateral"}[]=[
      {zone:"central",severity:lf.central,side:"bilateral"},{zone:"right-recess",severity:lf.rightRecess,side:"right"},{zone:"left-recess",severity:lf.leftRecess,side:"left"},{zone:"right-foramen",severity:lf.rightForamen,side:"right"},{zone:"left-foramen",severity:lf.leftForamen,side:"left"}
    ];
    for(const z of zones){
      const sv=severityValue(z.severity); if(sv===null||sv<1) continue;
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
      const strongImaging=sv>=2||lf.rootDeformation==="present"||["extrusion","sequestration"].includes(lf.discMorphology);
      if(clinicalSupport===0||(!strongImaging&&clinicalSupport<2)) continue;
      const score=Math.max(0,Math.min(100,sv*15+support.length*10-conflicts.length*12));
      out.push({rank:0,level:lf.level,side:z.side,root,zone:z.zone,support,conflicts,unavailable,researchScore:score});
    }
  }
  return out.sort((a,b)=>b.researchScore-a.researchScore).slice(0,5).map((x,idx)=>({...x,rank:idx+1}));
}

function applicability(i:CaseInput){
  const reasons:string[]=[];
  if(i.primaryRegion==="not-assessed") reasons.push("primary region not assessed");
  else if(i.primaryRegion!=="lumbar") reasons.push(`primary region is ${i.primaryRegion.replaceAll("-"," ")}`);
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
  if(i.proposedProcedure!=="fusion"&&i.proposedProcedure!=="decompression-fusion") return {status:"not-applicable",reasons:[],missing:[]};
  const level=i.proposedLevels[0]??top?.level;
  if(!level) return {status:"incompletely-assessed",reasons:[],missing:["proposed fusion level"]};
  const f=i.fusionMatrix.find(x=>x.level===level);
  if(!f) return {status:"incompletely-assessed",level,reasons:[],missing:["level-specific fusion assessment"]};
  const reasons:string[]=[]; const missing:string[]=[];
  if(isPresent(f.dynamicInstability)) reasons.push("documented dynamic instability"); else if(!isAssessed(f.dynamicInstability)) missing.push("dynamic instability");
  if(isPresent(f.foraminalCollapse)) reasons.push("foraminal height loss or exiting-root compression documented"); else if(!isAssessed(f.foraminalCollapse)) missing.push("foraminal height loss");
  if(f.plannedFacetResectionPercent.status==="measured"&&f.plannedFacetResectionPercent.value!==null) reasons.push(`planned facet resection documented (${f.plannedFacetResectionPercent.value}%)`); else if(f.plannedFacetResectionPercent.status!=="not-applicable") missing.push("planned facet resection extent");
  if(isPresent(f.revisionDestabilization)) reasons.push("revision-related destabilization documented"); else if(!isAssessed(f.revisionDestabilization)) missing.push("revision destabilization");
  if(isPresent(f.pseudarthrosis)) reasons.push("pseudarthrosis documented"); else if(!isAssessed(f.pseudarthrosis)) missing.push("pseudarthrosis status");
  if(isPresent(f.relevantDeformity)) reasons.push("level-specific deformity documented"); else if(!isAssessed(f.relevantDeformity)) missing.push("level-specific deformity relevance");
  if(reasons.length) return {status:"factors-documented",level,reasons,missing};
  if(missing.length) return {status:"incompletely-assessed",level,reasons,missing};
  return {status:"no-independent-factor",level,reasons:["No independent level-specific fusion-rationale factor was documented."],missing};
}

function risk(i:CaseInput):DecisionOutput["risk"]{
  if(i.proposedProcedure==="not-assessed"||i.proposedProcedure==="none") return {status:"not-assessed",patientSpecific:[],procedureSpecific:[],generalEducation:[]};
  const p:string[]=[]; const proc:string[]=[];
  if(i.smokingStatus==="current"||isPresent(i.nicotineVaping)||isPresent(i.smokelessTobacco)) p.push(i.proposedProcedure.includes("fusion")?"Current nicotine exposure is relevant to wound and fusion-healing risk; follow the local optimization pathway.":"Current nicotine exposure is relevant to perioperative and wound risk; follow the local optimization pathway.");
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
  const sf=safety(i); const sy=syndrome(i); const neuro=neurologic(i); const app=applicability(i); const t=targets(i,sy); const top=t[0];
  const missing=[...sf.missing]; const mimics=[...sy.conflicts];
  const contradictions:string[]=[];
  const motorRightMin=Math.min(...[i.rightKneeExtension,i.rightAnkleDorsiflexion,i.rightGreatToeExtension,i.rightPlantarFlexion].map(grade).filter((x):x is number=>x!==null),5);
  const motorLeftMin=Math.min(...[i.leftKneeExtension,i.leftAnkleDorsiflexion,i.leftGreatToeExtension,i.leftPlantarFlexion].map(grade).filter((x):x is number=>x!==null),5);
  const deficitSide=motorRightMin<motorLeftMin?"right":motorLeftMin<motorRightMin?"left":"bilateral or symmetric";
  if(i.side!=="not-assessed"&&i.side!=="bilateral"&&deficitSide!=="bilateral or symmetric"&&i.side!==deficitSide) contradictions.push(`Symptoms are ${i.side}-sided, while the strongest recorded motor deficit is ${deficitSide}-sided.`);
  if(i.weaknessTrajectory==="progressive"&&i.progressiveWeakness!=="present") contradictions.push("The examination records progressive weakness, but the safety screen does not record progressive weakness as present.");
  if(i.progressiveWeakness==="present"&&i.weaknessTrajectory!=="progressive") contradictions.push("The safety screen records progressive weakness, but the examination trajectory is not marked progressive.");
  const assessedImagingLevels=i.imagingMatrix.filter(f=>[f.central,f.rightRecess,f.leftRecess,f.rightForamen,f.leftForamen].some(x=>x!=="not-graded"&&x!=="none")).map(f=>f.level);
  for(const level of i.proposedLevels) if(!assessedImagingLevels.includes(level)) contradictions.push(`The proposed pathway includes ${level}, but no potentially relevant ${level} imaging abnormality is documented.`);
  if(i.injectionResponse!=="not-tried"&&i.injectionResponse!=="unknown"&&i.injectionLevel!=="unknown"&&i.injectionLevel!=="not-applicable"&&!assessedImagingLevels.includes(i.injectionLevel)) contradictions.push(`The recorded injection targeted ${i.injectionLevel}, but no potentially relevant finding is documented at that level.`);
  if(i.injectionResponse!=="not-tried"&&i.injectionResponse!=="unknown"&&i.injectionSide!=="not-assessed"&&i.side!=="not-assessed"&&i.side!=="bilateral"&&i.injectionSide!=="bilateral"&&i.injectionSide!=="midline"&&i.injectionSide!==i.side) contradictions.push(`The injection was ${i.injectionSide}-sided, while the primary symptoms are ${i.side}-sided.`);
  missing.push(...contradictions);
  if(i.imagesReviewed!=="present") missing.push("Direct image review is not documented.");
  if(i.levelByLevelDocumented!=="present") missing.push("Potentially relevant levels and zones are not fully documented.");
  if(i.examConfidence==="not-assessed") missing.push("Examination reliability is not documented.");
  if(!i.patientGoal.trim()) missing.push("The patient’s main functional goal is not documented.");
  if(!top&&assessedImagingLevels.length) missing.push("Repeat side- and root-specific clinical localization because the recorded examination and imaging do not converge on one target.");
  const objectiveStrong=neuro.severity==="moderate"||neuro.severity==="severe";
  const durable=i.symptomDurationWeeks.status==="measured"&&i.symptomDurationWeeks.value!==null&&i.symptomDurationWeeks.value>=6;
  const progressionConflict=i.weaknessTrajectory==="progressive"&&i.progressiveWeakness!=="present";
  const limitations:string[]=[];
  if(neuro.reliability==="low"||neuro.reliability==="indeterminate") limitations.push("Neurologic examination reliability is limited.");
  if(!top) limitations.push("No concordant invasive-treatment target was established.");
  let specialist:DecisionOutput["specialistReview"];
  if(sf.urgency==="emergency") specialist={status:"emergency",reasons:[sf.reason],limitations};
  else if(sf.urgency==="urgent"||progressionConflict||(neuro.severity==="severe"&&neuro.reliability!=="low")) specialist={status:"expedited",reasons:[progressionConflict?"Neurologic progression is documented inconsistently and requires prompt reconciliation.":sf.urgency==="urgent"?sf.reason:"A severe neurologic deficit is documented and requires prompt clinical reassessment."],limitations};
  else if(app.treatment==="out-of-scope") specialist={status:"additional-assessment",reasons:["The case is outside the current lumbar treatment-reconciliation module."],limitations};
  else if(top&&(durable||objectiveStrong||i.treatmentPreference==="open-to-surgery")&&top.conflicts.length<=1) specialist={status:"routine-reasonable",reasons:[durable?"Symptoms have persisted for at least six weeks.":objectiveStrong?"An objective neurologic deficit is present.":"The patient is open to specialist discussion.",`Most concordant candidate: ${top.side} ${top.root} at ${top.level} ${top.zone}.`],limitations};
  else if(sf.urgency==="indeterminate") specialist={status:"additional-assessment",reasons:[],limitations:[...limitations,"Required safety information is incomplete."]};
  else if(!top) specialist={status:"no-invasive-target",reasons:["Current information does not establish a concordant invasive-treatment target."],limitations};
  else specialist={status:"additional-assessment",reasons:["Additional assessment may be useful before deciding whether an invasive-treatment review is appropriate."],limitations};
  const fus=fusion(i,top); const rk=risk(i);
  const syndromeDetail=sy.derived.includes("radiculopathy")&&contradictions.length?`${sy.derived.replaceAll("-"," ")}; side/root localization remains discordant.`:sy.rationale.length?sy.rationale.join("; "):"Insufficient clinical features to derive a syndrome.";
  const highlights:HighlightFinding[]=[
    {title:`Urgency: ${progressionConflict?"indeterminate":sf.urgency}`,detail:progressionConflict?"Urgency cannot be finalized until the contradictory documentation of progressive weakness is reconciled.":sf.reason,tone:sf.urgency==="emergency"?"critical":sf.urgency==="urgent"||progressionConflict?"warning":sf.urgency==="routine"?"positive":"neutral",priority:1,ruleId:"SAFE-001"},
    {title:`Syndrome: ${sy.derived.replaceAll("-"," ")}`,detail:syndromeDetail,tone:sy.derived.includes("supported")&&!contradictions.length?"positive":sy.derived==="indeterminate"?"neutral":"warning",priority:1,ruleId:"SYN-001"},
    {title:top?`Most concordant candidate: ${top.side} ${top.root}, ${top.level} ${top.zone}`:"No concordant target established",detail:top?`${top.support.length} supporting domain(s), ${top.conflicts.length} conflict(s), ${top.unavailable.length} unavailable domain(s).`:contradictions[0]??"Imaging is not treated as symptomatic without compatible clinical findings.",tone:top&&top.conflicts.length===0?"positive":top?"info":"neutral",priority:1,ruleId:"LOC-001"},
    {title:`Next clinical step: ${specialist.status.replaceAll("-"," ")}`,detail:[...specialist.reasons,...specialist.limitations].join(" ")||"No additional statement.",tone:specialist.status==="emergency"?"critical":specialist.status==="expedited"?"warning":specialist.status==="routine-reasonable"?"positive":"neutral",priority:2,ruleId:"TRT-001"},
  ];
  if(fus.status!=="not-applicable") highlights.push({title:`Fusion factors: ${fus.status.replaceAll("-"," ")}`,detail:[...fus.reasons,...fus.missing.map(x=>`Missing: ${x}`)].join("; ")||"No independent factor documented.",tone:fus.status==="factors-documented"?"info":"neutral",priority:2,ruleId:"FUS-001"});
  const nextSteps:string[]=[];
  if(sf.urgency==="emergency") nextSteps.push("Follow the local emergency pathway immediately.");
  else if(sf.urgency==="urgent"||progressionConflict||(neuro.severity==="severe"&&neuro.reliability!=="low")) nextSteps.push("Promptly repeat and reconcile the neurologic examination, progression history, and direct imaging review.");
  if(sf.urgency==="indeterminate") nextSteps.push("Complete the required safety screen before interpreting urgency as routine.");
  if(contradictions.length) nextSteps.push(...contradictions.slice(0,4).map(x=>`Resolve: ${x}`));
  if(!top) nextSteps.push("Document a side- and root-specific sensory, reflex, and motor examination and review the corresponding axial imaging before considering an invasive target.");
  if(mimics.length) nextSteps.push("Address competing hip, vascular, or neuropathic findings before attributing symptoms to lumbar imaging.");
  const nonoperative=sf.urgency==="routine"&&!progressionConflict?["Use shared decision-making and individualized exercise-based rehabilitation when appropriate.","Review medication contraindications, prior response, and the patient’s functional goal.","A targeted injection may be considered in selected radicular cases; response is supportive context and does not independently prove the symptomatic level."]:[];
  const concordance:DecisionOutput["concordance"]=[
    {domain:"Symptoms",finding:i.side==="not-assessed"?"Laterality not assessed":`${i.side} ${i.clinicianPhenotype} presentation`,status:i.side==="not-assessed"?"missing":"neutral"},
    {domain:"Motor examination",finding:`Strongest deficit: ${deficitSide}; right ${motorRightMin}/5, left ${motorLeftMin}/5`,status:contradictions.some(x=>x.startsWith("Symptoms are"))?"conflict":motorRightMin<5||motorLeftMin<5?"support":"neutral"},
    {domain:"Imaging",finding:top?`${top.level} ${top.zone}, ${top.side} ${top.root}`:assessedImagingLevels.length?`Abnormality documented at ${assessedImagingLevels.join(", ")}, but no concordant target`:"No potentially relevant level documented",status:top?"support":assessedImagingLevels.length?"conflict":"missing"},
    {domain:"Injection",finding:i.injectionResponse==="not-tried"?"No injection performed":i.injectionResponse==="unknown"?"Response unknown":`${i.injectionSide} ${i.injectionLevel}: ${i.injectionResponse.replaceAll("-"," ")}`,status:contradictions.some(x=>x.toLowerCase().includes("injection"))?"conflict":i.injectionResponse==="unknown"?"missing":"neutral"},
    {domain:"Proposed pathway",finding:i.proposedProcedure==="not-assessed"?"Not assessed":`${i.proposedProcedure.replaceAll("-"," ")} ${i.proposedLevels.join(", ")||"without a level"}`,status:contradictions.some(x=>x.startsWith("The proposed pathway"))?"conflict":i.proposedProcedure==="not-assessed"?"missing":"neutral"},
  ];
  const trace:DecisionOutput["ruleTrace"]=[
    {ruleId:"SAFE-001",input:"Required emergency and serious-pathology fields",conclusion:progressionConflict?"Progression documentation is internally inconsistent; urgency requires clinician reconciliation.":sf.reason,evidenceIds:["CES-PATH","ACR-LBP"],strength:"consensus"},
    {ruleId:"SYN-001",input:"Symptoms, examination, tension signs, and mimics",conclusion:sy.derived,evidenceIds:sy.derived.includes("claudication")?["NASS-LSS"]:["NASS-LDH"],strength:"moderate"},
    {ruleId:"LOC-001",input:"Side-, root-, level-, and zone-specific concordance",conclusion:top?`${top.root} at ${top.level} ${top.zone}`:"No concordant target",evidenceIds:sy.derived.includes("claudication")?["NASS-LSS"]:["NASS-LDH"],strength:"moderate"}
  ];
  if(i.injectionResponse!=="not-tried"&&i.injectionResponse!=="unknown") trace.push({ruleId:"INJ-001",input:"Injection type, level, side, and response",conclusion:"Injection response is treated as supportive context only.",evidenceIds:["NASS-LDH"],strength:"limited"});
  if(fus.status!=="not-applicable") trace.push({ruleId:"FUS-001",input:"Level-specific instability, foraminal compromise, planned destabilization, revision, pseudarthrosis, and deformity",conclusion:fus.status,evidenceIds:["NORDSTEN-5Y","SWEDISH-LSS"],strength:"high"});
  return {urgency:progressionConflict?"indeterminate":sf.urgency,urgencyReason:progressionConflict?"Progressive weakness is documented inconsistently across sections.":sf.reason,applicability:app,syndrome:sy,neurologic:neuro,targets:t,highlights,missing:[...new Set(missing)],mimics:[...new Set(mimics)],nextSteps:[...new Set(nextSteps)],nonoperative,specialistReview:specialist,fusion:fus,risk:rk,concordance,ruleTrace:trace};
}
