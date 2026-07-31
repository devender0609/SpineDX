import type { CaseInput, DecisionOutput } from "./decisionEngine";

export type PathwayKey = "nonoperative" | "injection" | "decompression" | "fusion" | "expedited-review";
export type SyntheticPathway = { key: PathwayKey; label: string; agreement: number; rationale: string };
export type SyntheticOutput = {
  cohortSize: number;
  confidence: "low" | "moderate";
  pathwaySupport: SyntheticPathway[];
  nearestProfile: string;
  uncertaintyDrivers: string[];
  modelNotice: string;
  outcomeStatus: string;
};

function hashCase(input: CaseInput): number {
  const text = JSON.stringify(input);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

function objectiveDeficit(input: CaseInput) {
  const weak = [input.hipFlexion, input.kneeExtension, input.ankleDorsiflexion, input.greatToeExtension, input.plantarFlexion].some(g => g !== "5" && g !== "not-tested");
  return weak || input.gaitAbnormal;
}

function baseScores(input: CaseInput, decision: DecisionOutput) {
  const urgent = decision.urgency !== "routine" || input.progressiveWeakness;
  const concordant = decision.reconciliation === "concordant";
  const partial = decision.reconciliation === "partially-concordant";
  const radicular = input.painPattern === "radicular" || input.painPattern === "mixed";
  const claudication = input.painPattern === "claudication";
  const deficit = objectiveDeficit(input);
  const persistent = input.symptomDurationWeeks >= 6;
  const careTried = input.completedExerciseProgram || input.medicationTrial || input.injectionResponse !== "not-tried";
  const surgicallyRemediable = ["disc", "central-stenosis", "lateral-recess", "foraminal", "extraforaminal"].includes(input.imagingFinding);
  const instabilityRationale = input.dynamicInstability === "present" || input.deformityPresent || input.priorLumbarSurgery || input.plannedFacetResection === "substantial";
  const collapseRationale = input.spondylolisthesis && input.imagingFinding === "foraminal";

  let nonoperative = 0.58;
  if (urgent) nonoperative -= 0.38;
  if (persistent && careTried) nonoperative -= 0.16;
  if (input.injectionResponse === "sustained") nonoperative += 0.22;
  if (decision.reconciliation === "discordant" || decision.reconciliation === "insufficient") nonoperative += 0.10;

  let injection = 0.22;
  if (radicular && !urgent && (concordant || partial)) injection += 0.18;
  if (input.injectionResponse === "sustained") injection -= 0.08;
  if (claudication && input.imagingFinding === "central-stenosis") injection -= 0.12;

  let decompression = 0.18;
  if (surgicallyRemediable && (radicular || claudication)) decompression += 0.22;
  if (concordant) decompression += 0.20;
  if (partial) decompression += 0.08;
  if (persistent && careTried) decompression += 0.12;
  if (deficit) decompression += 0.10;
  if (urgent) decompression += 0.18;
  if (decision.reconciliation === "discordant" || decision.reconciliation === "insufficient") decompression -= 0.25;

  let fusion = 0.08;
  if (instabilityRationale) fusion += 0.24;
  if (collapseRationale) fusion += 0.10;
  if (!input.spondylolisthesis && input.dynamicInstability !== "present" && !input.deformityPresent && !input.priorLumbarSurgery) fusion -= 0.03;
  if (decision.reconciliation === "discordant" || decision.reconciliation === "insufficient") fusion -= 0.08;

  let expedited = 0.05;
  if (input.progressiveWeakness) expedited += 0.58;
  if (decision.urgency === "urgent") expedited += 0.28;
  if (decision.urgency === "emergency") expedited += 0.65;
  if (deficit && concordant) expedited += 0.08;

  return {
    nonoperative: clamp(nonoperative), injection: clamp(injection), decompression: clamp(decompression),
    fusion: clamp(fusion), "expedited-review": clamp(expedited),
  };
}

export function runSyntheticAnalogModel(input: CaseInput, decision: DecisionOutput, cohortSize = 5000): SyntheticOutput {
  const rng = mulberry32(hashCase(input));
  const base = baseScores(input, decision);
  const sums: Record<PathwayKey, number> = { nonoperative: 0, injection: 0, decompression: 0, fusion: 0, "expedited-review": 0 };
  const keys = Object.keys(sums) as PathwayKey[];

  for (let i = 0; i < cohortSize; i++) {
    const uncertainty = 0.16;
    for (const key of keys) {
      // Each analog perturbs evidence-informed pathway support; this is scenario agreement, not outcome probability.
      const jitter = (rng() - 0.5) * uncertainty;
      sums[key] += clamp(base[key] + jitter);
    }
  }

  const uncertaintyDrivers: string[] = [];
  if (decision.reconciliation !== "concordant") uncertaintyDrivers.push("Clinical–imaging relationship is not fully concordant.");
  if (input.dynamicInstability === "unknown") uncertaintyDrivers.push("Dynamic instability is not characterized.");
  if (input.plannedFacetResection === "unknown") uncertaintyDrivers.push("Expected facet resection is unknown.");
  if (input.boneHealth === "unknown") uncertaintyDrivers.push("Bone health is unknown if instrumentation is contemplated.");
  if (input.imagingLevel === "multilevel") uncertaintyDrivers.push("Multilevel disease requires level-by-level localization.");
  if (input.injectionResponse !== "not-tried" && input.injectionLevel === "unknown") uncertaintyDrivers.push("Injection target is incompletely documented.");

  const pathwaySupport: SyntheticPathway[] = [
    { key: "expedited-review", label: "Expedited specialist review", agreement: Math.round((sums["expedited-review"] / cohortSize) * 100), rationale: "Driven by neurologic progression and urgent-pathway features." },
    { key: "nonoperative", label: "Continued nonoperative care", agreement: Math.round((sums.nonoperative / cohortSize) * 100), rationale: "Favored when neurologically stable, incompletely localized, early in course, or improving." },
    { key: "injection", label: "Targeted injection consideration", agreement: Math.round((sums.injection / cohortSize) * 100), rationale: "Contextual option for selected radicular presentations; not proof of the symptomatic level." },
    { key: "decompression", label: "Decompression consultation", agreement: Math.round((sums.decompression / cohortSize) * 100), rationale: "Favored by a concordant remediable lesion, persistent limitation, or objective deficit." },
    { key: "fusion", label: "Independent fusion rationale", agreement: Math.round((sums.fusion / cohortSize) * 100), rationale: "Requires a separate rationale such as instability, deformity, collapse, revision, or destabilizing facet removal." },
  ].sort((a,b) => b.agreement - a.agreement);

  const profile = `${input.age}-year-old with ${input.painPattern} symptoms, ${decision.reconciliation.replace("-", " ")} clinical–imaging relationship, ${input.imagingFinding.replaceAll("-", " ")} at ${input.imagingLevel}, and ${decision.urgency} urgency.`;

  return {
    cohortSize,
    confidence: uncertaintyDrivers.length <= 1 && decision.reconciliation === "concordant" ? "moderate" : "low",
    pathwaySupport,
    nearestProfile: profile,
    uncertaintyDrivers,
    modelNotice: "Synthetic analog agreement is generated from transparent, evidence-informed assumptions and deterministic simulation. It is not a validated probability, treatment recommendation, or substitute for real-patient calibration.",
    outcomeStatus: "Outcome probabilities are intentionally disabled until the model is calibrated and externally validated on real patient data.",
  };
}
