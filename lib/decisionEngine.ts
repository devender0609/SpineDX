export type Laterality = "right" | "left" | "bilateral" | "midline";
export type Root = "L1" | "L2" | "L3" | "L4" | "L5" | "S1";
export type MotorGrade = "5" | "4+" | "4" | "3" | "2" | "1" | "0" | "not-tested";
export type Reflex = "normal" | "reduced" | "absent" | "brisk" | "not-tested";
export type Severity = "none" | "mild" | "moderate" | "severe" | "not-graded";
export type LumbarLevel = "L1-2" | "L2-3" | "L3-4" | "L4-5" | "L5-S1";
export type LevelFinding = {
  level: LumbarLevel;
  central: Severity;
  rightRecess: Severity;
  leftRecess: Severity;
  rightForamen: Severity;
  leftForamen: Severity;
  discMorphology: "none" | "bulge" | "protrusion" | "extrusion" | "sequestration";
  migration: "none" | "cranial" | "caudal";
  synovialCyst: boolean;
  rootDeformation: boolean;
  priorDecompression: boolean;
};
export type CaseInput = {
  age:number; symptomDurationWeeks:number; onset:"acute"|"subacute"|"chronic"; side:Laterality;
  painPattern:"radicular"|"claudication"|"axial"|"mixed"|"uncertain"; suspectedRoot:Root|"none"|"multiroot";
  backPain:number; legPain:number; walkingLimitMeters:number; standingProvokes:boolean; sittingRelieves:boolean; flexionRelieves:boolean;
  coughSneezeProvokes:boolean; nightRestPain:boolean; groinPain:boolean; patientGoal:string;
  mostImportantSymptom:"leg-pain"|"back-pain"|"weakness"|"numbness"|"walking"|"other";
  desiredActivity:string; treatmentPreference:"nonoperative"|"surgery-open"|"undecided"; riskTolerance:"low"|"moderate"|"high";
  workDemand:"sedentary"|"light"|"moderate"|"heavy"|"retired"; homeSupport:"adequate"|"limited"|"unknown";
  odi:number; promisPhysicalFunction:number; promisPainInterference:number; depressionTScore:number; zcqSeverity:number;

  rightHipFlexion:MotorGrade; leftHipFlexion:MotorGrade; rightKneeExtension:MotorGrade; leftKneeExtension:MotorGrade;
  rightAnkleDorsiflexion:MotorGrade; leftAnkleDorsiflexion:MotorGrade; rightGreatToeExtension:MotorGrade; leftGreatToeExtension:MotorGrade;
  rightPlantarFlexion:MotorGrade; leftPlantarFlexion:MotorGrade;
  weaknessQuality:"true"|"pain-limited"|"give-way"|"uncertain"; weaknessTrajectory:"none"|"stable"|"progressive"|"improving";
  weaknessDurationDays:number; muscleAtrophy:boolean; examConfidence:"high"|"moderate"|"low";
  rightPatellarReflex:Reflex; leftPatellarReflex:Reflex; rightAchillesReflex:Reflex; leftAchillesReflex:Reflex;
  rightSensoryRoot:Root|"none"|"non-dermatomal"|"not-tested"; leftSensoryRoot:Root|"none"|"non-dermatomal"|"not-tested";
  sensoryRoot:Root|"none"|"non-dermatomal"|"not-tested";
  straightLegRaise:"positive"|"negative"|"not-tested"; femoralStretch:"positive"|"negative"|"not-tested";
  gaitAbnormal:boolean; heelWalkAbnormal:boolean; toeWalkAbnormal:boolean; repeatedHeelRaiseAbnormal:boolean;
  hipExamAbnormal:boolean; pulsesAbnormal:boolean; neuropathyFeatures:boolean;
  standingProvocationPattern:"not-assessed"|"standing"|"walking"|"both"; reliefPattern:"not-assessed"|"sitting"|"flexion"|"stopping-only"|"none";
  bicycleToleranceBetter:boolean; uphillBetter:boolean; legHeaviness:boolean;

  imagingAgeMonths:number; actualImagesReviewed:boolean; imageQuality:"adequate"|"limited"|"unknown"; levelByLevelDocumented:boolean;
  imagingMatrix:LevelFinding[]; imagingLevel:LumbarLevel|"multilevel"; imagingSide:"right"|"left"|"bilateral"|"central";
  imagingFinding:"disc"|"central-stenosis"|"lateral-recess"|"foraminal"|"extraforaminal"|"other"; stenosisSeverity:"mild"|"moderate"|"severe"|"not-graded";
  migratedDisc:boolean; spondylolisthesis:boolean; slipMillimeters:number; slipType:"none"|"degenerative"|"isthmic"|"high-grade";
  dynamicInstability:"unknown"|"absent"|"present"; translationMillimeters:number; angularMotionDegrees:number;
  deformityPresent:boolean; coronalCobbDegrees:number; lateralListhesisMillimeters:number; segmentalKyphosisDegrees:number; sagittalImbalancePresent:boolean;
  foraminalCollapse:"unknown"|"absent"|"present"; priorLumbarSurgery:boolean; priorLongFusion:boolean; plannedFacetResection:"unknown"|"limited"|"substantial";

  completedExerciseProgram:boolean; exerciseWeeks:number; medicationTrial:boolean;
  injectionResponse:"not-tried"|"none"|"brief"|"meaningful-temporary"|"sustained"; injectionLevel:"unknown"|LumbarLevel; injectionSide:"unknown"|"right"|"left"|"bilateral";
  injectionDurationDays:number; injectionType:"unknown"|"transforaminal"|"interlaminar"|"caudal"|"selective-root";
  injectionImmediateReliefPercent:number; injectionDelayedReliefPercent:number; injectionFunctionImproved:boolean;

  progressiveWeakness:boolean; urinaryRetention:boolean; urinarySensationLoss:boolean; urinaryInitiationDifficulty:boolean; overflowIncontinence:boolean;
  urgencyAlone:boolean; saddleAnesthesia:boolean; bilateralSevereDeficit:boolean; reducedAnalTone:"not-assessed"|"normal"|"reduced";
  postVoidResidualMl:number; fever:boolean; bacteremiaOrRecentInfection:boolean; immunosuppression:boolean; recentProcedure:boolean;
  cancerHistory:boolean; unexplainedWeightLoss:boolean; recentTrauma:boolean; osteoporosisRisk:boolean; chronicSteroidUse:boolean; inflammatoryFeatures:boolean;

  smoking:boolean; smokingStatus:"never"|"former"|"current"; cigarettesPerDay:number; packYears:number; quitDate:string; vapingNicotine:boolean; smokelessTobacco:boolean; nicotineReplacement:boolean;
  diabetes:boolean; diabetesType:"none"|"type-1"|"type-2"|"other"; a1c:number; a1cDate:string; insulinUse:boolean; bmi:number; frailty:"none"|"mild"|"moderate"|"severe"|"unknown"; clinicalFrailtyScale:number;
  boneHealth:"normal"|"osteopenia"|"osteoporosis"|"unknown"; priorFragilityFracture:boolean; dexLowestTScore:number; vitaminD:number; boneMedication:"none"|"antiresorptive"|"anabolic"|"unknown";
  chronicOpioidUse:boolean; opioidMmed:number; opioidDurationMonths:number; benzodiazepineUse:boolean; depressionAnxietyConcern:boolean; phq9:number; gad7:number;
  anticoagulation:boolean; anticoagulantName:string; priorDvtPe:boolean; anemia:boolean; hemoglobin:number; albumin:number; recentWeightLoss:boolean;
  hypertension:boolean; coronaryDisease:boolean; heartFailure:boolean; arrhythmia:boolean; copd:boolean; sleepApnea:boolean; cpapUse:boolean; kidneyDiseaseStage:"none"|"1"|"2"|"3"|"4"|"5"|"dialysis"; liverDisease:boolean; cardiopulmonaryDisease:boolean;
  priorSurgeryType:"none"|"decompression"|"discectomy"|"fusion"|"instrumentation"|"multiple"; priorSurgeryLevels:string; priorSurgeryDate:string; sameLevelRevision:boolean; priorDuralTear:boolean; priorInfection:boolean; priorPseudarthrosis:boolean; hardwareFailure:boolean;
  plannedProcedure:"not-selected"|"decompression"|"discectomy"|"fusion"|"decompression-fusion"|"other"; plannedLevels:number; plannedApproach:"not-selected"|"posterior"|"anterior"|"lateral"|"combined"; plannedRevision:boolean; plannedSetting:"outpatient"|"inpatient"|"not-selected";

  pediatric:boolean; pregnant:boolean; cervicalThoracicSymptoms:boolean; neuromuscularDisease:boolean; tumorKnown:boolean; infectionKnown:boolean; acuteFractureKnown:boolean;
  clinicianAgreement:"not-reviewed"|"agree"|"partly-agree"|"disagree"; overrideReason:string; finalClinicalDecision:string;
};
export type EvidenceRef={id:string;title:string;source:string;year:number;note:string;population:string;limitations:string};
export type RuleTrace={ruleId:string;finding:string;basis:string;strength:"high"|"moderate"|"limited"|"consensus"};
export type CandidateTarget={level:string;side:string;root:string;zone:string;score:number;for:string[];against:string[]};
export type Applicability={status:"appropriate"|"limited"|"out-of-scope";reasons:string[]};
export type DecisionOutput={
 urgency:"routine"|"urgent"|"emergency"; urgencyReason:string; syndrome:string; neurologicSeverity:"none"|"mild"|"moderate"|"severe";
 reconciliation:"concordant"|"partially-concordant"|"discordant"|"insufficient"; reconciliationNarrative:string;
 applicability:Applicability; candidateTargets:CandidateTarget[]; support:string[]; contradictions:string[]; missing:string[]; alternatives:string[];
 diagnosticNextSteps:string[]; nonoperativePathway:string[]; surgicalDecision:string[]; fusionAssessment:string; operativeOptions:string[];
 surgicalPrerequisites:string[]; operativeRisks:string[]; optimization:string[]; patientGoalAlignment:string; riskSummary:string[];
 ruleTrace:RuleTrace[]; evidenceIds:string[]; checks:{label:string;status:"met"|"review"|"missing";rationale:string}[];
};
export const EVIDENCE:EvidenceRef[]=[
 {id:"NASS-LDH",title:"Lumbar Disc Herniation With Radiculopathy",source:"North American Spine Society",year:2012,note:"Clinical and imaging correlation is required; no single examination finding is definitive.",population:"Adults with lumbar disc herniation and radiculopathy.",limitations:"Guideline predates some contemporary trials and techniques."},
 {id:"NASS-LSS",title:"Degenerative Lumbar Spinal Stenosis",source:"North American Spine Society",year:2011,note:"Stenosis is a clinical syndrome; imaging severity alone does not establish causation.",population:"Adults with degenerative lumbar stenosis.",limitations:"Evidence quality varies by intervention and outcome."},
 {id:"NORDSTEN-5Y",title:"Nordsten-DS Five-Year Randomized Trial",source:"BMJ",year:2024,note:"Decompression alone was non-inferior to decompression plus fusion for many patients with stenosis and degenerative spondylolisthesis.",population:"Selected patients with stenosis and degenerative spondylolisthesis.",limitations:"Does not apply automatically to high-grade, isthmic, deformity, destructive, or clearly unstable pathology."},
 {id:"SWEDISH-LSS",title:"Swedish Spinal Stenosis Study Five-Year Results",source:"Bone & Joint Journal",year:2024,note:"Routine fusion did not improve five-year disability outcomes in the studied population.",population:"Patients undergoing surgery for lumbar stenosis with or without low-grade slip.",limitations:"Individual anatomy and instability mechanisms still require assessment."},
 {id:"ACR-LBP",title:"Appropriateness Criteria: Low Back Pain",source:"American College of Radiology",year:2021,note:"Imaging and escalation depend on red flags, prior care, and intended intervention.",population:"Adults with low back pain and related symptoms.",limitations:"Appropriateness guidance does not replace direct clinical evaluation."},
 {id:"CES-PATH",title:"Suspected Cauda Equina Emergency Pathway",source:"National emergency pathway",year:2025,note:"Retention, loss of urinary sensation, saddle change, or severe bilateral deficit warrants emergency assessment.",population:"Patients with suspected cauda equina compression.",limitations:"Symptoms are imperfect; local emergency pathways and direct examination govern care."},
 {id:"CNS-RISK",title:"Preoperative Spine Risk Assessment",source:"CNS/AANS",year:2021,note:"Modifiable risks such as smoking, diabetes, nutrition, anemia, and bone health should be assessed separately from appropriateness.",population:"Patients considered for spine surgery.",limitations:"Risk magnitude varies by procedure and data source."}
];
const roots:Record<LumbarLevel,{exit:Root;trav:Root}>={"L1-2":{exit:"L1",trav:"L2"},"L2-3":{exit:"L2",trav:"L3"},"L3-4":{exit:"L3",trav:"L4"},"L4-5":{exit:"L4",trav:"L5"},"L5-S1":{exit:"L5",trav:"S1"}};
const sev=(x:Severity)=>x==="severe"?3:x==="moderate"?2:x==="mild"?1:0;
const grade=(g:MotorGrade)=>g==="5"?5:g==="4+"?4.5:g==="4"?4:g==="3"?3:g==="2"?2:g==="1"?1:g==="0"?0:5;
function motorDeficit(i:CaseInput){const vals=[i.rightHipFlexion,i.leftHipFlexion,i.rightKneeExtension,i.leftKneeExtension,i.rightAnkleDorsiflexion,i.leftAnkleDorsiflexion,i.rightGreatToeExtension,i.leftGreatToeExtension,i.rightPlantarFlexion,i.leftPlantarFlexion].map(grade);return Math.min(...vals)}
function neurologicSeverity(i:CaseInput):DecisionOutput["neurologicSeverity"]{const m=motorDeficit(i);if(i.progressiveWeakness||m<=3||i.bilateralSevereDeficit)return"severe";if(m===4||i.heelWalkAbnormal||i.toeWalkAbnormal||i.repeatedHeelRaiseAbnormal)return"moderate";if(m===4.5||i.rightSensoryRoot!=="none"||i.leftSensoryRoot!=="none"||i.rightPatellarReflex!=="normal"||i.leftPatellarReflex!=="normal"||i.rightAchillesReflex!=="normal"||i.leftAchillesReflex!=="normal")return"mild";return"none"}
function scope(i:CaseInput):Applicability{const r:string[]=[];if(i.pediatric||i.age<18)r.push("Pediatric patient");if(i.pregnant)r.push("Pregnancy-related evaluation");if(i.cervicalThoracicSymptoms)r.push("Predominant cervical or thoracic symptoms");if(i.neuromuscularDisease)r.push("Neuromuscular disease");if(i.tumorKnown||i.infectionKnown||i.acuteFractureKnown)r.push("Known tumor, infection, or acute fracture");if(i.priorLongFusion)r.push("Prior long-segment fusion or complex revision anatomy");if(i.slipType==="high-grade"||i.slipType==="isthmic")r.push("High-grade or isthmic spondylolisthesis");if(i.deformityPresent&&(i.coronalCobbDegrees>=20||i.sagittalImbalancePresent))r.push("Major deformity");if(i.painPattern==="axial")r.push("Predominantly axial pain is outside the operative recommendation scope");return r.length?{status:r.some(x=>x.includes("Known")||x.includes("Pediatric")||x.includes("cervical")||x.includes("Neuromuscular"))?"out-of-scope":"limited",reasons:r}:{status:"appropriate",reasons:[]}}
function candidates(i:CaseInput):CandidateTarget[]{const out:CandidateTarget[]=[];for(const f of i.imagingMatrix){const zones:[string,Severity,string,Root][]=[["right lateral recess",f.rightRecess,"right",roots[f.level].trav],["left lateral recess",f.leftRecess,"left",roots[f.level].trav],["right foramen",f.rightForamen,"right",roots[f.level].exit],["left foramen",f.leftForamen,"left",roots[f.level].exit],["central canal",f.central,"bilateral",roots[f.level].trav]];for(const [zone,s,side,root] of zones){if(sev(s)===0)continue;let score=sev(s)*18;const yes:string[]=[];const no:string[]=[];if(i.side===side||i.side==="bilateral"||side==="bilateral"){score+=18;yes.push("Laterality is compatible")}else{score-=20;no.push("Laterality conflicts")};if(i.suspectedRoot===root||i.suspectedRoot==="multiroot"){score+=20;yes.push(`Suspected root includes ${root}`)}else if(i.suspectedRoot!=="none"){score-=10;no.push(`Suspected root is ${i.suspectedRoot}`)};const sensory=(side==="right"?i.rightSensoryRoot:i.leftSensoryRoot);if(sensory===root){score+=12;yes.push("Sensory distribution supports the root")};if((root==="L5"&&i.heelWalkAbnormal)||(root==="S1"&&(i.toeWalkAbnormal||i.repeatedHeelRaiseAbnormal))){score+=12;yes.push("Functional motor test supports the root")};if(i.hipExamAbnormal){score-=10;no.push("Abnormal hip examination is a competing source")};if(i.pulsesAbnormal){score-=12;no.push("Abnormal vascular examination is a competing source")};if(f.rootDeformation){score+=8;yes.push("Root deformation documented")};out.push({level:f.level,side,root,zone,score:Math.max(0,Math.min(100,score)),for:yes,against:no})}}return out.sort((a,b)=>b.score-a.score).slice(0,5)}
export function validateCase(i:CaseInput){const e:string[]=[];if(!i.patientGoal.trim())e.push("Document the patient-defined goal.");if(!i.actualImagesReviewed)e.push("Confirm direct image review or document why it is unavailable.");if(!i.levelByLevelDocumented)e.push("Complete the level-by-level imaging matrix.");if(i.examConfidence==="low")e.push("Repeat or confirm the neurologic examination because confidence is low.");return e}
export function evaluateCase(i:CaseInput):DecisionOutput{
 const app=scope(i), neuro=neurologicSeverity(i), target=candidates(i), top=target[0]; const emergency=i.urinaryRetention||i.urinarySensationLoss||i.overflowIncontinence||i.saddleAnesthesia||i.bilateralSevereDeficit||(i.postVoidResidualMl>=300&&i.urinaryInitiationDifficulty);const infection=i.fever&&(i.bacteremiaOrRecentInfection||i.immunosuppression||i.recentProcedure);const cancer=i.cancerHistory&&(i.nightRestPain||i.unexplainedWeightLoss);const fracture=i.recentTrauma&&(i.osteoporosisRisk||i.chronicSteroidUse||i.age>=65);
 const urgency=emergency?"emergency":(i.progressiveWeakness||infection||cancer||fracture)?"urgent":"routine";const urgencyReason=emergency?"Possible cauda equina compression or severe bilateral neurologic deterioration requires immediate local emergency assessment and urgent imaging review.":i.progressiveWeakness?"Progressive objective weakness warrants expedited specialist assessment.":infection||cancer||fracture?"Serious-pathology warning features require expedited diagnostic evaluation.":"No emergency feature was identified by the entered data; routine timing still requires clinician confirmation.";
 const syndrome=i.painPattern==="claudication"?"Probable neurogenic claudication":i.painPattern==="radicular"?"Probable lumbar radiculopathy":i.painPattern==="mixed"?"Mixed radicular/claudicant syndrome":i.painPattern==="axial"?"Axial-predominant low-back pain":"Syndrome uncertain";
 let reconciliation:DecisionOutput["reconciliation"]="insufficient";if(top){reconciliation=top.score>=70?"concordant":top.score>=45?"partially-concordant":"discordant"}
 const support:string[]=[];const contradictions:string[]=[];const missing:string[]=[];if(top) support.push(`Highest-ranked target: ${top.side} ${top.root} at ${top.level} ${top.zone} (${top.score}/100 structured concordance score).`,...top.for);if(top) contradictions.push(...top.against);if(i.imageQuality!=="adequate")missing.push("Imaging quality is limited or unknown.");if(i.dynamicInstability==="unknown")missing.push("Dynamic instability is unknown.");if(i.examConfidence!=="high")missing.push("Neurologic examination confidence is not high.");if(i.imagingAgeMonths>12)missing.push("Imaging is older than 12 months; determine whether it still represents current symptoms.");
 const alternatives:string[]=[];if(i.hipExamAbnormal||i.groinPain)alternatives.push("Hip pathology");if(i.pulsesAbnormal||i.reliefPattern==="stopping-only")alternatives.push("Vascular claudication");if(i.neuropathyFeatures)alternatives.push("Peripheral neuropathy");if(i.painPattern==="axial")alternatives.push("Facet, sacroiliac, discogenic, endplate, or nonspecific chronic low-back pain mechanisms");
 const diagnosticNextSteps:string[]=[];if(app.status!=="appropriate")diagnosticNextSteps.push("Use the appropriate specialty or emergency pathway because this case is outside or at the edge of the validated module scope.");if(!top||reconciliation==="discordant")diagnosticNextSteps.push("Reassess level, side, root, hip, vascular, and peripheral nerve localization before an invasive procedure.");if(i.imagingLevel==="multilevel")diagnosticNextSteps.push("Perform level-by-level clinical–imaging reconciliation; do not treat every abnormal level.");
 const nonoperativePathway:string[]=[];if(urgency==="routine")nonoperativePathway.push("Shared decision-making with activity modification and individualized exercise-based rehabilitation.","Medication strategy based on contraindications and prior response.");if(i.injectionResponse==="not-tried"&&i.painPattern!=="axial"&&reconciliation!=="discordant")nonoperativePathway.push("A targeted diagnostic/therapeutic injection may be considered; response does not independently prove the symptomatic level.");
 const surgicalDecision:string[]=[];if(app.status==="appropriate"&&urgency!=="emergency"&&top&&top.score>=55&&(i.symptomDurationWeeks>=6||neuro==="moderate"||neuro==="severe"))surgicalDecision.push("Surgical consultation is potentially reasonable after clinician confirmation of the target and patient preference.");else surgicalDecision.push("A routine elective surgical recommendation is not established by the current data.");
 const independent=i.dynamicInstability==="present"||i.foraminalCollapse==="present"||i.plannedFacetResection==="substantial"||(i.deformityPresent&&(i.coronalCobbDegrees>=20||i.sagittalImbalancePresent));const fusionAssessment=independent&&top&&top.score>=55?"An independent fusion rationale may be present, but it requires direct confirmation of instability, deformity, collapse, revision-related instability, or anticipated iatrogenic instability. Fusion is not supported merely by stenosis, back pain, prior surgery, facet disease, or a mild stable degenerative slip.":"Decompression-first reasoning is favored. No independent fusion rationale is established from the entered data.";
 const operativeOptions:string[]=[];if(top&&top.score>=55){operativeOptions.push(`Targeted decompression consideration at ${top.level}, ${top.side} ${top.zone}, addressing the ${top.root} root.`);if(i.imagingFinding==="disc")operativeOptions.push("Limited discectomy/microdiscectomy may be considered when disc morphology and symptoms are concordant.");if(i.imagingFinding==="foraminal"||i.imagingFinding==="extraforaminal")operativeOptions.push("Foraminotomy or far-lateral decompression may be considered based on direct image review and facet preservation.")}
 const optimization:string[]=[];
 const nicotine=i.smoking||i.smokingStatus==="current"||i.vapingNicotine||i.smokelessTobacco||i.nicotineReplacement;
 if(nicotine)optimization.push("Current nicotine exposure: document cessation plan, timing, and institutional verification requirements before fusion.");
 if(i.diabetes&&(i.a1c<=0||i.a1cDate===""))optimization.push("Diabetes present but a current HbA1c is unavailable."); else if(i.diabetes&&i.a1c>=8)optimization.push("Elevated HbA1c: optimize glycemic control using the procedure-specific institutional pathway.");
 if(i.anemia||i.hemoglobin>0&&i.hemoglobin<12)optimization.push("Anemia or low hemoglobin: evaluate cause and treat before elective surgery when feasible.");
 if(i.albumin>0&&i.albumin<3.5||i.recentWeightLoss)optimization.push("Nutrition concern: assess malnutrition and recent unintended weight loss.");
 if(i.boneHealth==="osteoporosis"||i.osteoporosisRisk||i.priorFragilityFracture||i.dexLowestTScore<=-2.5)optimization.push("Bone-health concern: complete procedure-specific bone optimization before instrumentation.");
 if(i.chronicOpioidUse||i.opioidMmed>0)optimization.push("Preoperative opioid exposure: document MME, prescriber, expectations, and perioperative analgesic plan.");
 if(i.sleepApnea&&!i.cpapUse)optimization.push("Obstructive sleep apnea with no documented CPAP use/adherence requires perioperative review.");
 if(i.anticoagulation)optimization.push("Create a coordinated anticoagulant/antiplatelet interruption and resumption plan.");
 const riskSummary:string[]=[];
 if(i.frailty==="moderate"||i.frailty==="severe"||i.clinicalFrailtyScale>=5)riskSummary.push("Frailty-related perioperative vulnerability is elevated.");
 if(i.cardiopulmonaryDisease||i.coronaryDisease||i.heartFailure||i.copd||i.sleepApnea)riskSummary.push("Cardiopulmonary comorbidity requires formal procedure- and anesthesia-specific assessment.");
 if(i.kidneyDiseaseStage==="4"||i.kidneyDiseaseStage==="5"||i.kidneyDiseaseStage==="dialysis"||i.liverDisease)riskSummary.push("Advanced renal or hepatic disease may increase perioperative medical risk.");
 if(i.priorDvtPe)riskSummary.push("Prior DVT/PE requires individualized thrombosis and bleeding planning.");
 if(i.plannedRevision||i.sameLevelRevision||i.priorDuralTear||i.priorInfection||i.priorPseudarthrosis)riskSummary.push("Revision history or prior surgical complication increases technical complexity and limits generalizability of routine estimates.");
 if(i.plannedProcedure==="not-selected")riskSummary.push("A proposed procedure has not been selected; procedure-specific risk cannot be characterized.");
 riskSummary.push("No individualized complication percentage is calculated. These are evidence-informed flags pending calibration on real outcomes data.");
 const goalAligned=i.treatmentPreference==="nonoperative"&&surgicalDecision[0].startsWith("Surgical")?"The current surgical-consultation pathway may not align with the stated preference for nonoperative care; use shared decision-making.":`The proposed pathway should be discussed in relation to the goal: ${i.patientGoal}`;
 const ruleTrace:RuleTrace[]=[{ruleId:"SAFE-001",finding:urgencyReason,basis:"Emergency neurologic and serious-pathology screen",strength:"consensus"},{ruleId:"LOC-001",finding:top?`Candidate ${top.root} target at ${top.level}`:"No target established",basis:"Level, zone, side, motor, sensory, reflex, and competing-source reconciliation",strength:"moderate"},{ruleId:"FUS-001",finding:fusionAssessment,basis:"Decompression-first interpretation for many patients with stenosis and low-grade degenerative slip",strength:"high"},{ruleId:"SCOPE-001",finding:`Applicability: ${app.status}`,basis:"Prespecified intended-use population and exclusions",strength:"consensus"}];
 const checks=[{label:"Intended-use population",status:app.status==="appropriate"?"met":app.status==="limited"?"review":"missing",rationale:app.reasons.join("; ")||"Within the initial degenerative lumbar scope."},{label:"Direct image review",status:i.actualImagesReviewed?"met":"missing",rationale:"The tool must not replace direct image review."},{label:"Level-by-level matrix",status:i.levelByLevelDocumented?"met":"missing",rationale:"Multilevel abnormalities require zone- and side-specific review."},{label:"Patient goal and preference",status:i.patientGoal&&i.treatmentPreference?"met":"missing",rationale:"Treatment decisions should incorporate goals and preference."}] as DecisionOutput["checks"];
 return {urgency,urgencyReason,syndrome,neurologicSeverity:neuro,reconciliation,reconciliationNarrative:top?`The highest-ranked structured target is ${top.side} ${top.root} at ${top.level} ${top.zone}. This is a reconciliation result, not a confirmed diagnosis.`:"No level-root target could be established.",applicability:app,candidateTargets:target,support,contradictions,missing,alternatives,diagnosticNextSteps,nonoperativePathway,surgicalDecision,fusionAssessment,operativeOptions,surgicalPrerequisites:["Direct review of current imaging","Confirmation of side, root, and functional deficit","Patient-centered discussion of alternatives and expectations","Separate medical and anesthetic risk assessment"],operativeRisks:["Dural tear","Neural injury","Infection","Persistent or recurrent symptoms","Reoperation","Instability after decompression when relevant"],optimization,patientGoalAlignment:goalAligned,riskSummary,ruleTrace,evidenceIds:["NASS-LDH","NASS-LSS","NORDSTEN-5Y","SWEDISH-LSS","ACR-LBP","CES-PATH","CNS-RISK"],checks}
}
