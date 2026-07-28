export type Laterality = "right" | "left" | "bilateral" | "midline";
export type Root = "L2" | "L3" | "L4" | "L5" | "S1";
export type MotorGrade = "5" | "4" | "3" | "2" | "1" | "0" | "not-tested";
export type Reflex = "normal" | "reduced" | "absent" | "brisk" | "not-tested";

export type CaseInput = {
  age: number;
  symptomDurationWeeks: number;
  onset: "acute" | "subacute" | "chronic";
  side: Laterality;
  painPattern: "radicular" | "claudication" | "axial" | "mixed" | "uncertain";
  suspectedRoot: Root | "none" | "multiroot";
  backPain: number;
  legPain: number;
  walkingLimitMeters: number;
  standingProvokes: boolean;
  sittingRelieves: boolean;
  flexionRelieves: boolean;
  coughSneezeProvokes: boolean;
  nightRestPain: boolean;
  groinPain: boolean;
  patientGoal: string;

  hipFlexion: MotorGrade;
  kneeExtension: MotorGrade;
  ankleDorsiflexion: MotorGrade;
  greatToeExtension: MotorGrade;
  plantarFlexion: MotorGrade;
  patellarReflex: Reflex;
  achillesReflex: Reflex;
  sensoryRoot: Root | "none" | "non-dermatomal" | "not-tested";
  straightLegRaise: "positive" | "negative" | "not-tested";
  femoralStretch: "positive" | "negative" | "not-tested";
  gaitAbnormal: boolean;
  hipExamAbnormal: boolean;
  pulsesAbnormal: boolean;

  imagingAgeMonths: number;
  imagingLevel: "L1-2" | "L2-3" | "L3-4" | "L4-5" | "L5-S1" | "multilevel";
  imagingSide: "right" | "left" | "bilateral" | "central";
  imagingFinding: "disc" | "central-stenosis" | "lateral-recess" | "foraminal" | "extraforaminal" | "other";
  stenosisSeverity: "mild" | "moderate" | "severe" | "not-graded";
  migratedDisc: boolean;
  spondylolisthesis: boolean;
  slipMillimeters: number;
  dynamicInstability: "unknown" | "absent" | "present";
  translationMillimeters: number;
  angularMotionDegrees: number;
  deformityPresent: boolean;
  priorLumbarSurgery: boolean;
  plannedFacetResection: "unknown" | "limited" | "substantial";

  completedExerciseProgram: boolean;
  exerciseWeeks: number;
  medicationTrial: boolean;
  injectionResponse: "not-tried" | "none" | "brief" | "meaningful-temporary" | "sustained";
  injectionLevel: "unknown" | "L1-2" | "L2-3" | "L3-4" | "L4-5" | "L5-S1";
  injectionSide: "unknown" | "right" | "left" | "bilateral";
  injectionDurationDays: number;

  progressiveWeakness: boolean;
  urinaryRetention: boolean;
  saddleAnesthesia: boolean;
  bilateralSevereDeficit: boolean;
  fever: boolean;
  bacteremiaOrRecentInfection: boolean;
  immunosuppression: boolean;
  recentProcedure: boolean;
  cancerHistory: boolean;
  unexplainedWeightLoss: boolean;
  recentTrauma: boolean;
  osteoporosisRisk: boolean;
  chronicSteroidUse: boolean;
  inflammatoryFeatures: boolean;

  smoking: boolean;
  diabetes: boolean;
  a1c: number;
  bmi: number;
  frailty: "none" | "mild" | "moderate" | "severe" | "unknown";
  boneHealth: "normal" | "osteopenia" | "osteoporosis" | "unknown";
  chronicOpioidUse: boolean;
  depressionAnxietyConcern: boolean;
  anticoagulation: boolean;
};

export type EvidenceRef = { id: string; title: string; source: string; year: number; note: string };
export type Check = { label: string; status: "met" | "review" | "missing"; rationale: string };
export type DecisionOutput = {
  urgency: "routine" | "urgent" | "emergency";
  urgencyReason: string;
  syndrome: string;
  reconciliation: "concordant" | "partially-concordant" | "discordant" | "insufficient";
  reconciliationNarrative: string;
  support: string[];
  contradictions: string[];
  missing: string[];
  alternatives: string[];
  diagnosticNextSteps: string[];
  nonoperativePathway: string[];
  surgicalDecision: string[];
  fusionAssessment: string;
  optimization: string[];
  checks: Check[];
  evidenceIds: string[];
};

export const EVIDENCE: EvidenceRef[] = [
  { id: "ACR-LBP", title: "ACR Appropriateness Criteria: Low Back Pain", source: "American College of Radiology", year: 2021, note: "Imaging appropriateness depends on red flags, prior management, and whether intervention is being considered." },
  { id: "NICE-NG59", title: "Low back pain and sciatica in over 16s", source: "NICE NG59", year: 2020, note: "Assessment should consider alternative diagnoses, shared decision-making, and non-invasive and invasive options." },
  { id: "GIRFT-CES", title: "National suspected cauda equina syndrome pathway", source: "NICE/GIRFT", year: 2025, note: "New bladder dysfunction, saddle sensory change, or major neurologic deterioration requires urgent local emergency-pathway assessment." },
  { id: "NASS-LDH", title: "Diagnosis and Treatment of Lumbar Disc Herniation with Radiculopathy", source: "North American Spine Society", year: 2012, note: "Diagnosis requires clinical and imaging correlation; no single examination finding is definitive." },
  { id: "NASS-LSS", title: "Diagnosis and Treatment of Degenerative Lumbar Spinal Stenosis", source: "North American Spine Society", year: 2011, note: "Lumbar stenosis is a clinical syndrome and imaging severity alone does not establish symptom causation." },
  { id: "NORDSTEN-5Y", title: "Nordsten-DS five-year randomized trial", source: "BMJ", year: 2024, note: "For many patients with stenosis and degenerative spondylolisthesis, decompression alone was non-inferior to decompression plus fusion; subgroup exceptions may exist." },
  { id: "HIP-SPINE", title: "Hip-spine syndrome review", source: "JAAOS", year: 2026, note: "Concurrent hip and spine disease requires deliberate identification of the dominant pain generator." },
];

const levelRoots: Record<Exclude<CaseInput["imagingLevel"], "multilevel">, { exiting: Root; traversing: Root }> = {
  "L1-2": { exiting: "L1" as Root, traversing: "L2" },
  "L2-3": { exiting: "L2", traversing: "L3" },
  "L3-4": { exiting: "L3", traversing: "L4" },
  "L4-5": { exiting: "L4", traversing: "L5" },
  "L5-S1": { exiting: "L5", traversing: "S1" },
};

function expectedRoot(input: CaseInput): Root | null {
  if (input.imagingLevel === "multilevel" || input.imagingFinding === "central-stenosis" || input.imagingFinding === "other") return null;
  const map = levelRoots[input.imagingLevel];
  return input.imagingFinding === "foraminal" || input.imagingFinding === "extraforaminal" ? map.exiting : map.traversing;
}

function motorRoots(input: CaseInput): Root[] {
  const roots: Root[] = [];
  const weak = (g: MotorGrade) => g !== "5" && g !== "not-tested";
  if (weak(input.hipFlexion)) roots.push("L2", "L3");
  if (weak(input.kneeExtension)) roots.push("L3", "L4");
  if (weak(input.ankleDorsiflexion)) roots.push("L4", "L5");
  if (weak(input.greatToeExtension)) roots.push("L5");
  if (weak(input.plantarFlexion)) roots.push("S1");
  return [...new Set(roots)];
}

function lateralityCompatibility(input: CaseInput): "match" | "partial" | "mismatch" | "not-assessable" {
  if (input.imagingSide === "central" || input.side === "midline") return "not-assessable";
  if (input.side === input.imagingSide) return "match";
  if (input.side === "bilateral" || input.imagingSide === "bilateral") return "partial";
  return "mismatch";
}

function seriousPathology(input: CaseInput) {
  const ces = input.urinaryRetention || input.saddleAnesthesia || input.bilateralSevereDeficit;
  const infection = input.fever && (input.bacteremiaOrRecentInfection || input.immunosuppression || input.recentProcedure);
  const cancer = input.cancerHistory && (input.nightRestPain || input.unexplainedWeightLoss);
  const fracture = input.recentTrauma || ((input.osteoporosisRisk || input.chronicSteroidUse) && input.age >= 65);
  return { ces, infection, cancer, fracture };
}

export function validateCase(input: CaseInput): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.age) || input.age < 18 || input.age > 110) errors.push("Enter an age between 18 and 110 years.");
  if (!Number.isFinite(input.symptomDurationWeeks) || input.symptomDurationWeeks < 0 || input.symptomDurationWeeks > 1040) errors.push("Enter symptom duration between 0 and 1040 weeks.");
  if (![input.backPain, input.legPain].every(v => Number.isFinite(v) && v >= 0 && v <= 10)) errors.push("Pain scores must be between 0 and 10.");
  if (!input.patientGoal.trim()) errors.push("Document a measurable patient goal.");
  if (input.diabetes && (!Number.isFinite(input.a1c) || input.a1c < 3 || input.a1c > 20)) errors.push("Enter a plausible HbA1c value when diabetes is selected.");
  if (!Number.isFinite(input.bmi) || input.bmi < 10 || input.bmi > 80) errors.push("Enter a plausible BMI between 10 and 80.");
  return errors;
}

export function evaluateCase(input: CaseInput): DecisionOutput {
  const support: string[] = [];
  const contradictions: string[] = [];
  const missing: string[] = [];
  const alternatives: string[] = [];
  const diagnosticNextSteps: string[] = [];
  const nonoperativePathway: string[] = [];
  const surgicalDecision: string[] = [];
  const optimization: string[] = [];
  const evidenceIds = new Set<string>(["NICE-NG59", "NASS-LDH", "NASS-LSS"]);

  const serious = seriousPathology(input);
  let urgency: DecisionOutput["urgency"] = "routine";
  let urgencyReason = "No emergency feature was entered. A negative checklist does not exclude serious disease when history, examination, or risk assessment is incomplete.";
  if (serious.ces) {
    urgency = "emergency";
    urgencyReason = "New urinary retention, saddle sensory change, or severe bilateral neurologic deficit may indicate cauda equina compression. Stop the routine pathway and use the local emergency assessment and urgent MRI pathway.";
    evidenceIds.add("GIRFT-CES"); evidenceIds.add("ACR-LBP");
  } else if (input.progressiveWeakness || serious.infection || serious.cancer || serious.fracture) {
    urgency = "urgent";
    urgencyReason = "One or more features require expedited clinician assessment for progressive neurologic deficit, infection, malignancy, or fracture. The exact urgency and imaging depend on the full presentation and local protocol.";
    evidenceIds.add("ACR-LBP");
  }

  const syndrome = input.painPattern === "radicular" ? `Clinician-entered ${input.suspectedRoot === "none" ? "radicular" : input.suspectedRoot + "-type radicular"} syndrome`
    : input.painPattern === "claudication" ? "Clinician-entered neurogenic claudication syndrome"
    : input.painPattern === "axial" ? "Predominantly axial low-back pain syndrome"
    : input.painPattern === "mixed" ? "Mixed axial and leg-symptom syndrome" : "Uncertain lumbar symptom syndrome";

  let assessable = 0, matched = 0;
  const side = lateralityCompatibility(input);
  if (side !== "not-assessable") {
    assessable++;
    if (side === "match") { matched++; support.push("Symptom and imaging laterality agree."); }
    else if (side === "partial") contradictions.push("Laterality is only partially aligned; bilateral symptoms or imaging require level-by-level review.");
    else contradictions.push("Symptom laterality conflicts with the entered imaging abnormality.");
  } else missing.push("Laterality cannot be reconciled from a central or midline label alone.");

  const root = expectedRoot(input);
  if (input.painPattern === "radicular" && input.suspectedRoot !== "none" && input.suspectedRoot !== "multiroot") {
    if (root) {
      assessable++;
      if (root === input.suspectedRoot) { matched++; support.push(`The suspected ${input.suspectedRoot} root is anatomically compatible with the entered level and zone.`); }
      else contradictions.push(`The suspected ${input.suspectedRoot} root is not the usual exiting/traversing root for the selected lesion. Direct image review and detailed mapping are needed.`);
    } else missing.push("Single-root localization is not valid for multilevel or central canal disease; document each level, side, and zone.");
  }

  if (input.painPattern === "claudication") {
    assessable++;
    const clinicallyCompatible = input.standingProvokes && (input.sittingRelieves || input.flexionRelieves) && input.walkingLimitMeters > 0;
    const imagingCompatible = input.imagingFinding === "central-stenosis" || input.imagingLevel === "multilevel";
    if (clinicallyCompatible && imagingCompatible) { matched++; support.push("The entered posture-dependent walking limitation and stenotic imaging are compatible with neurogenic claudication."); }
    else contradictions.push("The claudication label is incompletely supported; document posture dependence, walking tolerance, and vascular/hip alternatives.");
  }

  const objectiveRoots = motorRoots(input);
  if (objectiveRoots.length && root) {
    assessable++;
    if (objectiveRoots.includes(root)) { matched++; support.push("The entered muscle weakness is compatible with the candidate root, recognizing overlapping myotomes."); }
    else contradictions.push("The entered weakness pattern does not clearly localize to the candidate root.");
  } else if (objectiveRoots.length && !root) missing.push("Multilevel/central disease requires muscle-by-muscle correlation with each candidate level rather than a single-root match.");

  if (input.sensoryRoot !== "none" && input.sensoryRoot !== "not-tested" && input.sensoryRoot !== "non-dermatomal" && root) {
    assessable++;
    if (input.sensoryRoot === root) { matched++; support.push("The sensory distribution is compatible with the candidate root, while dermatomal overlap limits specificity."); }
    else contradictions.push("The sensory distribution does not clearly match the candidate root.");
  }
  if (input.sensoryRoot === "non-dermatomal") alternatives.push("Peripheral neuropathy, central sensitization, or another non-root process");

  if (input.hipExamAbnormal || input.groinPain) {
    alternatives.push("Hip pathology or hip-spine syndrome");
    contradictions.push("Groin pain or an abnormal hip examination raises a competing pain generator.");
    diagnosticNextSteps.push("Complete hip range-of-motion/provocative testing and obtain hip imaging or diagnostic injection only when it would change management.");
    evidenceIds.add("HIP-SPINE");
  }
  if (input.pulsesAbnormal || (input.painPattern === "claudication" && !input.sittingRelieves && !input.flexionRelieves)) alternatives.push("Vascular claudication");
  if (input.inflammatoryFeatures) alternatives.push("Inflammatory axial disease");
  if (input.painPattern === "axial") alternatives.push("Facet-mediated, sacroiliac, myofascial, discogenic, or nonspecific low-back pain");

  if (input.stenosisSeverity === "severe") support.push("Severe narrowing is present, but severity alone does not establish symptom causation or treatment indication.");
  if (input.stenosisSeverity === "mild" && (objectiveRoots.length || input.progressiveWeakness)) contradictions.push("Objective or progressive weakness with only mild reported narrowing warrants direct image review and consideration of another level or diagnosis.");
  if (input.imagingAgeMonths > 12 || (input.imagingAgeMonths > 3 && input.progressiveWeakness)) missing.push("Imaging may not reflect the current neurologic status; repeat imaging is reasonable only if it is expected to change management.");
  if (input.imagingLevel === "multilevel" || input.imagingFinding === "central-stenosis") missing.push("Record each candidate level, side, and zone of compression; a single multilevel label is inadequate for procedural targeting.");

  if (input.injectionResponse !== "not-tried") {
    const injectionTargetKnown = input.injectionLevel !== "unknown" && input.injectionSide !== "unknown";
    if (!injectionTargetKnown) missing.push("Injection interpretation requires the injected level, side, technique, medication, immediate response, and duration.");
    if (input.injectionResponse === "sustained") support.push("Sustained meaningful benefit may support continued nonsurgical care when neurologic status is stable and goals are being met.");
    else if (input.injectionResponse === "none") contradictions.push("Lack of injection benefit does not exclude a diagnosis but reduces confidence in that specific therapeutic strategy or target.");
  }

  if (urgency === "routine") {
    nonoperativePathway.push("Use education, activity guidance, and an individualized exercise-based program when appropriate; reassess function and neurologic status over time.");
    if (!input.completedExerciseProgram) nonoperativePathway.push("A structured exercise-based program has not been documented; this is not a universal prerequisite when neurologic or other urgent circumstances exist.");
    if (input.injectionResponse === "not-tried" && input.painPattern === "radicular") nonoperativePathway.push("An epidural or selective injection may be considered for selected patients as a therapeutic trial; it should not be treated as a definitive diagnostic test.");
  }

  const clinicalImagingCoherent = contradictions.filter(x => x.includes("laterality") || x.includes("root") || x.includes("weakness") || x.includes("sensory")).length === 0 && assessable >= 2 && matched / assessable >= 0.5;
  if (!clinicalImagingCoherent) surgicalDecision.push("Do not use the current fields to finalize a level-specific invasive procedure; reconcile symptoms, objective examination, and direct imaging review first.");
  if (urgency === "routine" && clinicalImagingCoherent && input.symptomDurationWeeks >= 6 && (input.legPain > input.backPain || input.painPattern === "claudication")) {
    surgicalDecision.push("A surgical consultation may be reasonable when disabling leg-dominant symptoms persist despite appropriate nonoperative care and a surgically remediable lesion is clinically concordant.");
  }
  if (input.painPattern === "axial") surgicalDecision.push("Predominantly axial pain alone should not be attributed to stenosis or used as a stand-alone indication for decompression from this tool.");

  let fusionAssessment = "The form does not establish an indication for fusion. Operative choice requires diagnosis-specific review of instability, slip morphology, foraminal collapse, deformity, prior surgery, planned facet removal, bone quality, and patient risk.";
  if (input.spondylolisthesis) {
    evidenceIds.add("NORDSTEN-5Y");
    if (input.dynamicInstability === "absent" && !input.deformityPresent && input.plannedFacetResection !== "substantial") fusionAssessment = "For many patients with stenosis and low-grade degenerative spondylolisthesis without a compelling instability/deformity mechanism, randomized evidence supports considering decompression alone. This does not exclude fusion for selected anatomy or surgical circumstances.";
    else if (input.dynamicInstability === "present" || input.deformityPresent || input.plannedFacetResection === "substantial") fusionAssessment = "Fusion may be considered when a clinically meaningful instability/deformity mechanism or expected iatrogenic instability is present, but no single translation or angular threshold should be used as an automatic indication.";
    else missing.push("Clarify slip grade/morphology, standing and dynamic imaging, foraminal collapse, deformity, and expected facet resection before discussing fusion.");
  }

  if (input.smoking) optimization.push("Smoking is a modifiable risk relevant to wound healing and fusion success; document cessation counseling when surgery is considered.");
  if (input.diabetes && input.a1c >= 8) optimization.push("Glycemic control may increase perioperative risk; coordinate optimization rather than using a universal HbA1c cutoff in isolation.");
  if (input.bmi >= 35) optimization.push("Obesity may increase perioperative complexity and complication risk; discuss individualized risk and optimization without using BMI alone to deny care.");
  if (input.frailty === "moderate" || input.frailty === "severe") optimization.push("Frailty warrants formal perioperative risk assessment, discharge planning, and shared decision-making.");
  if (input.boneHealth === "unknown" && (input.age >= 65 || input.osteoporosisRisk || input.spondylolisthesis)) optimization.push("Assess bone health when instrumentation is being considered; use DXA and/or opportunistic CT assessment according to local practice.");
  if (input.boneHealth === "osteoporosis") optimization.push("Osteoporosis requires bone-health optimization and may alter fixation strategy and risk counseling.");
  if (input.chronicOpioidUse) optimization.push("Document baseline opioid exposure and create a perioperative analgesia/taper plan.");
  if (input.depressionAnxietyConcern) optimization.push("Psychological distress can affect recovery and should be assessed and treated without implying that symptoms are non-organic.");
  if (input.anticoagulation) optimization.push("Anticoagulation management requires procedure-specific coordination and should not be automated by this prototype.");

  if (input.recentTrauma || input.osteoporosisRisk || input.chronicSteroidUse) diagnosticNextSteps.push("Use fracture-oriented imaging when clinical suspicion is present; modality depends on trauma severity, neurologic findings, and local protocol.");
  if (serious.infection) diagnosticNextSteps.push("Urgent laboratory evaluation and contrast-enhanced MRI are commonly considered when spinal infection is suspected, guided by local protocol.");
  if (serious.cancer) diagnosticNextSteps.push("Use an urgent malignancy pathway and appropriate MRI when cancer-related spinal pathology is suspected.");
  if (urgency === "routine" && input.symptomDurationWeeks < 6 && !input.progressiveWeakness) diagnosticNextSteps.push("Routine early imaging is generally not indicated for uncomplicated acute low-back pain/radiculopathy without red flags.");
  evidenceIds.add("ACR-LBP");

  let reconciliation: DecisionOutput["reconciliation"] = "insufficient";
  if (assessable >= 2) {
    const ratio = matched / assessable;
    reconciliation = ratio === 1 && contradictions.length === 0 ? "concordant" : ratio >= 0.5 && contradictions.length <= 2 ? "partially-concordant" : "discordant";
  }
  const reconciliationNarrative = `${matched} of ${assessable} assessable domains matched. This is a transparent reconciliation checklist, not a diagnostic probability, surgical indication, or authorization criterion.`;

  const checks: Check[] = [
    { label: "Emergency and serious-pathology screen", status: urgency === "routine" ? "met" : "review", rationale: urgencyReason },
    { label: "Syndrome characterized", status: input.painPattern === "uncertain" ? "missing" : "met", rationale: "A syndrome label should be supported by symptom behavior, objective findings, and alternatives." },
    { label: "Clinical–imaging laterality reconciled", status: side === "match" ? "met" : side === "not-assessable" ? "missing" : "review", rationale: "Laterality mismatch lowers confidence in a level-specific pain generator." },
    { label: "Root/level relationship assessable", status: root ? "met" : "review", rationale: "Central and multilevel disease cannot be reduced to one root without level-by-level review." },
    { label: "Objective neurologic examination documented", status: [input.hipFlexion,input.kneeExtension,input.ankleDorsiflexion,input.greatToeExtension,input.plantarFlexion].some(x=>x==="not-tested") ? "missing" : "met", rationale: "Muscle-by-muscle examination is more useful than a single root dropdown." },
    { label: "Competing hip/vascular/peripheral sources addressed", status: (input.hipExamAbnormal || input.pulsesAbnormal || input.sensoryRoot === "non-dermatomal") ? "review" : "met", rationale: "Alternative pain generators are common and may coexist." },
    { label: "Imaging current and intervention-relevant", status: input.imagingAgeMonths > 12 ? "review" : "met", rationale: "Repeat imaging is justified when it is likely to change management, not by age alone." },
    { label: "Patient goal and prior care documented", status: input.patientGoal.trim() && (input.completedExerciseProgram || urgency !== "routine") ? "met" : "review", rationale: "Treatment should be linked to function, preferences, and prior care." },
    { label: "Surgical optimization assessed", status: optimization.length ? "review" : "met", rationale: "Modifiable risk and bone health should be addressed when surgery is considered." },
  ];

  return { urgency, urgencyReason, syndrome, reconciliation, reconciliationNarrative, support, contradictions, missing, alternatives: [...new Set(alternatives)], diagnosticNextSteps: [...new Set(diagnosticNextSteps)], nonoperativePathway, surgicalDecision, fusionAssessment, optimization, checks, evidenceIds: [...evidenceIds] };
}
