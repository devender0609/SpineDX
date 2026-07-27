export type CaseInput = {
  age: number;
  symptomDurationMonths: number;
  side: "right" | "left" | "bilateral";
  painPattern: "L3" | "L4" | "L5" | "S1" | "claudication" | "axial";
  backPain: number;
  legPain: number;
  walkingLimit: boolean;
  motorDeficit: "none" | "L3" | "L4" | "L5" | "S1";
  sensoryDeficit: "none" | "L3" | "L4" | "L5" | "S1";
  imagingLevel: "L3-4" | "L4-5" | "L5-S1" | "multilevel";
  imagingSide: "right" | "left" | "bilateral";
  imagingFinding: "disc" | "central-stenosis" | "lateral-recess" | "foraminal";
  stenosisSeverity: "mild" | "moderate" | "severe";
  spondylolisthesis: boolean;
  dynamicInstability: "unknown" | "absent" | "present";
  completedPT: boolean;
  injectionResponse: "not-tried" | "none" | "temporary" | "sustained";
  progressiveWeakness: boolean;
  bowelBladderChange: boolean;
  saddleAnesthesia: boolean;
  feverOrInfectionRisk: boolean;
  hipExamAbnormal: boolean;
  patientGoal: string;
};

export type DecisionOutput = {
  urgency: "routine" | "urgent" | "emergency";
  urgencyReason: string;
  clinicalPattern: string;
  imagingAssociation: string;
  concordanceLabel: "insufficient" | "discordant" | "partially-concordant" | "concordant";
  matchedDomains: number;
  assessableDomains: number;
  support: string[];
  contradictions: string[];
  missing: string[];
  alternatives: string[];
  treatmentOptions: string[];
  fusionAssessment: string;
  summary: string;
  clinicalChecks: { label: string; status: "met" | "review" | "missing" }[];
};

type Root = "L3" | "L4" | "L5" | "S1";

function expectedRoot(input: CaseInput): Root | null {
  // This is an anatomic compatibility aid only. A single-root comparison is not
  // valid for central canal or multilevel disease.
  if (input.imagingLevel === "multilevel" || input.imagingFinding === "central-stenosis") return null;

  const exitingRoot: Record<Exclude<CaseInput["imagingLevel"], "multilevel">, Root> = {
    "L3-4": "L3",
    "L4-5": "L4",
    "L5-S1": "L5",
  };
  const traversingRoot: Record<Exclude<CaseInput["imagingLevel"], "multilevel">, Root> = {
    "L3-4": "L4",
    "L4-5": "L5",
    "L5-S1": "S1",
  };

  return input.imagingFinding === "foraminal"
    ? exitingRoot[input.imagingLevel]
    : traversingRoot[input.imagingLevel];
}

function sideCompatibility(input: CaseInput): "match" | "partial" | "mismatch" {
  if (input.side === input.imagingSide) return "match";
  if (input.side === "bilateral" || input.imagingSide === "bilateral") return "partial";
  return "mismatch";
}

function findingLabel(finding: CaseInput["imagingFinding"]): string {
  return {
    disc: "disc herniation",
    "central-stenosis": "central canal stenosis",
    "lateral-recess": "lateral recess stenosis",
    foraminal: "foraminal stenosis",
  }[finding];
}

export function validateCase(input: CaseInput): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.age) || input.age < 18 || input.age > 100) errors.push("Enter an age between 18 and 100 years.");
  if (!Number.isFinite(input.symptomDurationMonths) || input.symptomDurationMonths < 0 || input.symptomDurationMonths > 240) errors.push("Enter symptom duration between 0 and 240 months.");
  if (![input.backPain, input.legPain].every(v => Number.isFinite(v) && v >= 0 && v <= 10)) errors.push("Pain scores must be between 0 and 10.");
  if (!input.patientGoal.trim()) errors.push("Document the patient’s primary functional goal.");
  return errors;
}

export function evaluateCase(input: CaseInput): DecisionOutput {
  const support: string[] = [];
  const contradictions: string[] = [];
  const missing: string[] = [];
  const alternatives: string[] = [];

  const possibleCes = input.bowelBladderChange || input.saddleAnesthesia;
  const urgency: DecisionOutput["urgency"] = possibleCes
    ? "emergency"
    : (input.progressiveWeakness || input.feverOrInfectionRisk)
      ? "urgent"
      : "routine";

  const urgencyReason = possibleCes
    ? "New bladder/bowel dysfunction or saddle sensory change can occur with cauda equina compression. Stop the routine pathway and arrange immediate clinician assessment and emergency imaging according to the local protocol. These symptoms are not diagnostic by themselves."
    : input.progressiveWeakness
      ? "Progressive motor weakness requires expedited clinician assessment. The appropriate urgency depends on severity, speed of progression, and associated neurologic findings."
      : input.feverOrInfectionRisk
        ? "Fever, bacteremia, immunosuppression, recent invasive procedure, or other infection risk with spine symptoms requires expedited assessment for spinal infection and other serious causes."
        : "No emergency feature was entered. A negative checkbox screen does not exclude serious disease when the history, examination, or risk assessment is incomplete.";

  let matchedDomains = 0;
  let assessableDomains = 0;

  // Domain 1: laterality.
  const side = sideCompatibility(input);
  assessableDomains += 1;
  if (side === "match") {
    matchedDomains += 1;
    support.push("Entered symptom laterality and imaging laterality agree.");
  } else if (side === "partial") {
    contradictions.push("Laterality is only partially concordant. Bilateral symptoms with unilateral imaging, or unilateral symptoms with bilateral imaging, requires direct level-by-level image review.");
  } else {
    contradictions.push("Entered symptom laterality does not match the selected imaging abnormality.");
  }

  const root = expectedRoot(input);
  const isRootPattern = ["L3", "L4", "L5", "S1"].includes(input.painPattern);

  // Domain 2: syndrome/root relationship. Do not score single-root localization
  // in central or multilevel disease because the dropdown cannot represent the anatomy.
  if (input.painPattern === "claudication") {
    assessableDomains += 1;
    if (input.walkingLimit && ["central-stenosis", "lateral-recess"].includes(input.imagingFinding)) {
      matchedDomains += 1;
      support.push("Walking- or standing-limited symptoms are compatible with a stenotic syndrome; vascular, hip, and other musculoskeletal mimics still require consideration.");
    } else {
      contradictions.push("The selected claudication pattern is not adequately supported by the entered walking history or imaging type.");
    }
  } else if (input.painPattern === "axial") {
    contradictions.push("Predominantly axial low-back pain is nonspecific. The selected imaging finding should not be labeled the pain generator from these fields alone.");
  } else if (isRootPattern && root) {
    assessableDomains += 1;
    if (root === input.painPattern) {
      matchedDomains += 1;
      support.push(`The user-entered ${input.painPattern}-type symptom pattern is anatomically compatible with the usual root relationship for ${input.imagingLevel} ${findingLabel(input.imagingFinding)}.`);
    } else {
      contradictions.push(`The user-entered ${input.painPattern}-type symptom pattern is not the usual root relationship for ${input.imagingLevel} ${findingLabel(input.imagingFinding)}. Dermatomal overlap exists, so confirm the actual pain map, neurologic examination, and images.`);
    }
  } else if (isRootPattern && !root) {
    missing.push("Single-root concordance is not scored for central canal or multilevel disease. Record each compressed level, side, and zone, and determine whether the overall syndrome—not a single root label—matches the imaging.");
  }

  // Domains 3 and 4: objective exam localization, only when a single root is assessable.
  if (input.motorDeficit !== "none") {
    if (root) {
      assessableDomains += 1;
      if (root === input.motorDeficit) {
        matchedDomains += 1;
        support.push("The entered motor finding is compatible with the usual root relationship, recognizing overlapping myotomes and the need for muscle-by-muscle strength documentation.");
      } else {
        contradictions.push("The entered motor finding does not match the usual root relationship for the selected lesion.");
      }
    } else {
      missing.push("Motor localization cannot be reconciled from a single root dropdown in multilevel or central disease. Document individual muscle grades and correlate them with each candidate level.");
    }
  } else {
    support.push("No focal motor deficit was entered. A normal motor examination does not exclude radiculopathy or lumbar stenosis.");
  }

  if (input.sensoryDeficit !== "none") {
    if (root) {
      assessableDomains += 1;
      if (root === input.sensoryDeficit) {
        matchedDomains += 1;
        support.push("The entered sensory finding is compatible with the usual root relationship, while recognizing dermatomal overlap and limited specificity.");
      } else {
        contradictions.push("The entered sensory finding does not match the usual root relationship for the selected lesion.");
      }
    } else {
      missing.push("Sensory localization cannot be reconciled from a single root dropdown in multilevel or central disease. Document the actual sensory map and correlate it with each candidate level.");
    }
  }

  // Competing diagnosis is not a concordance 'domain' and therefore cannot inflate the score.
  if (input.hipExamAbnormal) {
    contradictions.push("An abnormal hip examination raises a competing pain generator or hip–spine syndrome and should be resolved before attributing symptoms solely to the lumbar finding.");
    alternatives.push("Hip pathology or hip–spine syndrome");
    missing.push("Clarify groin pain, hip range of motion, provocative testing, and whether hip imaging or a diagnostic injection would change management.");
  }

  if (input.stenosisSeverity === "severe") {
    support.push("Severe narrowing was selected on imaging; imaging severity alone does not establish that the abnormality is symptomatic or determine treatment.");
  } else if (input.stenosisSeverity === "mild" && input.motorDeficit !== "none") {
    contradictions.push("An objective motor deficit with only mild reported narrowing warrants direct image review and consideration of another level, lesion, or diagnosis.");
  }

  if (input.injectionResponse === "temporary" || input.injectionResponse === "sustained") {
    support.push("Benefit after an injection is contextual information only. Without the injected level, side, medication, technique, and duration of response, it cannot establish the symptomatic level.");
  }
  if (input.injectionResponse === "sustained") {
    support.push("Sustained meaningful benefit may support continued nonsurgical management when neurologic status is stable and the patient’s goals are being met.");
  }

  if (input.walkingLimit) alternatives.push("Vascular claudication when exertional features, pulses, or vascular history are concerning");
  alternatives.push("Peripheral neuropathy or focal peripheral nerve entrapment when findings are non-dermatomal or electrodiagnostic clarification is needed");
  alternatives.push("Sacroiliac, facet-mediated, or myofascial pain when symptoms are predominantly axial or non-radicular");

  if (input.spondylolisthesis && input.dynamicInstability === "unknown") {
    missing.push("Instability has not been characterized. Review standing imaging and use dynamic views selectively when the result is expected to change the operative plan; no single motion threshold should be treated as a universal fusion indication.");
  }
  if (!input.completedPT && urgency === "routine") {
    missing.push("Prior nonsurgical care is incomplete or not documented. This is a workflow item, not a universal prerequisite for surgery, and may be bypassed when neurologic or other clinical circumstances warrant.");
  }
  if (input.painPattern === "claudication" && !input.walkingLimit) {
    missing.push("Clarify symptom provocation and relief with standing, walking, sitting, and flexion before labeling neurogenic claudication.");
  }
  if (input.imagingLevel === "multilevel" || input.imagingFinding === "central-stenosis") {
    missing.push("A single imaging level/side field is inadequate for multilevel or central disease. Record the actual levels, sides, zones of compression, and the most clinically plausible target.");
  }

  const ratio = assessableDomains ? matchedDomains / assessableDomains : 0;
  const concordanceLabel: DecisionOutput["concordanceLabel"] = assessableDomains < 2
    ? "insufficient"
    : contradictions.length >= 2 || ratio < 0.5
      ? "discordant"
      : ratio < 1
        ? "partially-concordant"
        : "concordant";

  const clinicalPattern = input.painPattern === "claudication"
    ? "User-entered neurogenic claudication-type symptom pattern"
    : input.painPattern === "axial"
      ? "User-entered predominantly axial low-back pain pattern"
      : `User-entered ${input.painPattern}-type radicular symptom pattern`;
  const imagingAssociation = `${input.imagingLevel} ${findingLabel(input.imagingFinding)} (${input.imagingSide}, ${input.stenosisSeverity})`;

  const treatmentOptions: string[] = [];
  if (urgency === "emergency") {
    treatmentOptions.push("Do not use the elective treatment pathway. Arrange immediate emergency evaluation under the local cauda equina/compressive-neurologic protocol.");
  } else if (urgency === "urgent") {
    treatmentOptions.push("Arrange expedited clinician review and targeted workup for the entered neurologic or infection concern before routine treatment planning.");
  } else {
    treatmentOptions.push("Base treatment on the confirmed clinical syndrome, direct image review, symptom severity, functional limitation, prior care, patient goals, and shared decision-making—not on this checklist label alone.");
    if (!input.completedPT) treatmentOptions.push("Consider individualized nonsurgical care when neurologically safe and clinically appropriate; components depend on diagnosis, prior response, contraindications, and patient preference.");
    if (input.injectionResponse === "sustained") treatmentOptions.push("Continue observation or nonsurgical care while meaningful benefit persists and neurologic status remains stable.");
    if (concordanceLabel === "concordant" || concordanceLabel === "partially-concordant") {
      treatmentOptions.push("When symptoms remain functionally limiting despite appropriate care, specialist review for decompression may be reasonable after confirmation of the target level and discussion of expected benefits, risks, and alternatives.");
    }
    if (concordanceLabel === "discordant" || concordanceLabel === "insufficient") {
      treatmentOptions.push("Resolve the clinical–imaging mismatch or insufficient localization before a level-specific invasive procedure.");
    }
  }

  let fusionAssessment = "Do not infer a fusion indication from stenosis severity, back-pain score, spondylolisthesis, or a single instability field alone. Review slip morphology, deformity, foraminal collapse, planned facet resection, prior surgery, bone health, mechanical symptoms, and patient-specific risk.";
  if (input.dynamicInstability === "present") {
    fusionAssessment = "Reported dynamic motion may be relevant, but it does not independently establish a fusion indication. Confirm measurement quality and reproducibility, symptoms, slip/deformity characteristics, anticipated destabilization from decompression, and patient-specific risks.";
  } else if (input.spondylolisthesis && input.dynamicInstability === "unknown") {
    fusionAssessment = "The decompression-versus-fusion decision remains unresolved. Randomized evidence supports decompression alone for many patients with symptomatic low-grade degenerative spondylolisthesis, while selected anatomic or operative circumstances may still justify fusion.";
  } else if (input.dynamicInstability === "absent") {
    fusionAssessment = "Absence of documented dynamic instability may support considering decompression alone in selected leg-predominant cases, but operative choice still depends on slip characteristics, foraminal disease, deformity, planned facet resection, prior surgery, and patient factors.";
  }

  const rootRelationshipNeedsReview = !root || contradictions.some(x => x.includes("usual root relationship"));
  const clinicalChecks: DecisionOutput["clinicalChecks"] = [
    { label: "Emergency neurologic and infection screen completed", status: urgency === "routine" ? "met" : "review" },
    { label: "Clinical and imaging laterality reconciled", status: side === "match" ? "met" : "review" },
    { label: "Root/level relationship assessable and reviewed", status: rootRelationshipNeedsReview ? "review" : "met" },
    { label: "Competing hip source addressed", status: input.hipExamAbnormal ? "review" : "met" },
    { label: "Prior nonsurgical care documented", status: input.completedPT ? "met" : "missing" },
    { label: "Patient goal documented", status: input.patientGoal.trim() ? "met" : "missing" },
    { label: "Instability characterized when relevant", status: input.spondylolisthesis && input.dynamicInstability === "unknown" ? "missing" : "met" },
  ];

  const summary = `${clinicalPattern} with an entered imaging association of ${imagingAssociation}. ${assessableDomains} domain${assessableDomains === 1 ? " was" : "s were"} assessable and ${matchedDomains} matched. The classification is ${concordanceLabel}; it is an unvalidated reconciliation aid, not a probability, diagnosis, treatment recommendation, or authorization criterion.`;

  return {
    urgency,
    urgencyReason,
    clinicalPattern,
    imagingAssociation,
    concordanceLabel,
    matchedDomains,
    assessableDomains,
    support,
    contradictions,
    missing,
    alternatives,
    treatmentOptions,
    fusionAssessment,
    summary,
    clinicalChecks,
  };
}
