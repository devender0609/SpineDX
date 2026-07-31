import type { CaseInput, DecisionOutput } from "./decisionEngine";

export type PathwayKey = "nonoperative" | "injection" | "decompression" | "fusion" | "expedited-review";
export type SyntheticPathway = { key: PathwayKey; label: string; agreement: number; rationale: string };
export type CohortMetric = { label: string; value: number; note: string };
export type SyntheticOutput = {
  cohortSize: number;
  modelVersion: string;
  inputCompleteness: "low" | "moderate" | "high";
  pathwaySupport: SyntheticPathway[];
  indexPhenotype: string;
  uncertaintyDrivers: string[];
  cohortMetrics: CohortMetric[];
  auditChecks: string[];
  modelNotice: string;
  outcomeStatus: string;
};

const DEFAULT_COHORT_SIZE = 300_000;
const MODEL_VERSION = "Hybrid-Sim 12.0";

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
function bernoulli(rng: () => number, p: number) { return rng() < clamp(p); }

function objectiveDeficit(input: CaseInput) {
  const weak = [input.hipFlexion, input.kneeExtension, input.ankleDorsiflexion, input.greatToeExtension, input.plantarFlexion]
    .some(g => g !== "5" && g !== "not-tested");
  return weak || input.gaitAbnormal;
}

function completeness(input: CaseInput, decision: DecisionOutput): SyntheticOutput["inputCompleteness"] {
  let missing = decision.missing.length;
  if (input.dynamicInstability === "unknown") missing += 1;
  if (input.plannedFacetResection === "unknown") missing += 1;
  if (input.boneHealth === "unknown") missing += 1;
  if (input.imagingLevel === "multilevel") missing += 2;
  if (missing <= 2 && decision.reconciliation === "concordant") return "high";
  if (missing <= 5 && decision.reconciliation !== "discordant") return "moderate";
  return "low";
}

/**
 * Generates a patient-level synthetic analog cohort around the index phenotype.
 * The analogs are not real patients and are not fitted to observed outcomes.
 * Pathways are non-mutually-exclusive review signals, not treatment probabilities.
 */
export function runSyntheticAnalogModel(
  input: CaseInput,
  decision: DecisionOutput,
  cohortSize = DEFAULT_COHORT_SIZE,
): SyntheticOutput {
  const safeCohortSize = Math.max(10_000, Math.min(1_000_000, Math.floor(cohortSize)));
  const rng = mulberry32(hashCase(input) ^ safeCohortSize);

  const indexUrgent = decision.urgency !== "routine" || input.progressiveWeakness;
  const indexConcordant = decision.reconciliation === "concordant";
  const indexPartial = decision.reconciliation === "partially-concordant";
  const indexDiscordant = decision.reconciliation === "discordant" || decision.reconciliation === "insufficient";
  const indexRadicular = input.painPattern === "radicular" || input.painPattern === "mixed";
  const indexClaudication = input.painPattern === "claudication";
  const indexDeficit = objectiveDeficit(input);
  const indexPersistent = input.symptomDurationWeeks >= 6;
  const indexCareTried = input.completedExerciseProgram || input.medicationTrial || input.injectionResponse !== "not-tried";
  const indexRemediable = ["disc", "central-stenosis", "lateral-recess", "foraminal", "extraforaminal"].includes(input.imagingFinding);
  const indexInstability = input.dynamicInstability === "present" || input.deformityPresent || input.priorLumbarSurgery || input.plannedFacetResection === "substantial";
  const indexSustainedInjectionBenefit = input.injectionResponse === "sustained";

  const counts: Record<PathwayKey, number> = {
    nonoperative: 0,
    injection: 0,
    decompression: 0,
    fusion: 0,
    "expedited-review": 0,
  };
  let urgentCount = 0;
  let concordantCount = 0;
  let deficitCount = 0;
  let instabilityCount = 0;

  for (let i = 0; i < safeCohortSize; i++) {
    // Patient-level phenotype variation centered on the index case.
    const urgent = bernoulli(rng, indexUrgent ? 0.88 : 0.05);
    const concordant = bernoulli(rng, indexConcordant ? 0.86 : indexPartial ? 0.53 : 0.18);
    const deficit = bernoulli(rng, indexDeficit ? 0.82 : 0.14);
    const persistent = bernoulli(rng, indexPersistent ? 0.84 : 0.28);
    const careTried = bernoulli(rng, indexCareTried ? 0.86 : 0.32);
    const remediable = bernoulli(rng, indexRemediable ? 0.91 : 0.24);
    const radicular = bernoulli(rng, indexRadicular ? 0.87 : 0.22);
    const claudication = bernoulli(rng, indexClaudication ? 0.83 : 0.16);
    const instability = bernoulli(rng, indexInstability ? 0.78 : 0.10);
    const sustainedBenefit = bernoulli(rng, indexSustainedInjectionBenefit ? 0.80 : 0.10);
    const discordance = !concordant && bernoulli(rng, indexDiscordant ? 0.72 : 0.38);

    if (urgent) urgentCount++;
    if (concordant) concordantCount++;
    if (deficit) deficitCount++;
    if (instability) instabilityCount++;

    // Safety review is deliberately sensitive and overrides elective pathways.
    const expeditedReview = urgent || (deficit && concordant && bernoulli(rng, 0.55));

    // Nonoperative support remains possible in stable, early, improving, or incompletely localized cases.
    const nonoperative = !urgent && (
      sustainedBenefit ||
      !persistent ||
      discordance ||
      (!deficit && bernoulli(rng, careTried ? 0.48 : 0.70))
    );

    // Injection is a contextual therapeutic option only; it is suppressed for urgent cases and central claudication.
    const injection = !urgent && radicular && concordant && !sustainedBenefit && bernoulli(rng, 0.52) && !(claudication && input.imagingFinding === "central-stenosis");

    // Decompression review requires a remediable lesion plus clinical syndrome; discordance lowers support.
    const decompression = remediable && (radicular || claudication) && !discordance && (
      urgent ||
      (concordant && (persistent || deficit) && (careTried || deficit))
    );

    // Fusion requires an independent instability/deformity/revision rationale in addition to a coherent operative target.
    const fusion = decompression && instability && bernoulli(rng, input.spondylolisthesis ? 0.68 : 0.52);

    if (expeditedReview) counts["expedited-review"]++;
    if (nonoperative) counts.nonoperative++;
    if (injection) counts.injection++;
    if (decompression) counts.decompression++;
    if (fusion) counts.fusion++;
  }

  const pct = (n: number) => Math.round((n / safeCohortSize) * 100);
  const uncertaintyDrivers: string[] = [];
  if (decision.reconciliation !== "concordant") uncertaintyDrivers.push("Clinical–imaging relationship is not fully concordant.");
  if (input.dynamicInstability === "unknown") uncertaintyDrivers.push("Dynamic instability is not characterized.");
  if (input.plannedFacetResection === "unknown") uncertaintyDrivers.push("Expected facet resection is unknown.");
  if (input.boneHealth === "unknown") uncertaintyDrivers.push("Bone health is unknown if instrumentation is contemplated.");
  if (input.imagingLevel === "multilevel") uncertaintyDrivers.push("Multilevel disease requires level-by-level localization.");
  if (input.injectionResponse !== "not-tried" && input.injectionLevel === "unknown") uncertaintyDrivers.push("Injection target is incompletely documented.");
  if (decision.missing.length > 3) uncertaintyDrivers.push("Several required clinical or imaging details remain missing.");

  const pathwaySupport: SyntheticPathway[] = [
    { key: "expedited-review", label: "Expedited specialist review", agreement: pct(counts["expedited-review"]), rationale: "Triggered by urgent neurologic or serious-pathology features; safety rules supersede elective pathway estimates." },
    { key: "nonoperative", label: "Continued nonoperative care", agreement: pct(counts.nonoperative), rationale: "Supported in stable, early, improving, or incompletely localized scenarios." },
    { key: "injection", label: "Targeted injection consideration", agreement: pct(counts.injection), rationale: "A contextual therapeutic option for selected concordant radicular scenarios; not a diagnostic proof." },
    { key: "decompression", label: "Decompression consultation", agreement: pct(counts.decompression), rationale: "Requires a clinically coherent, surgically remediable lesion with persistent limitation or objective deficit." },
    { key: "fusion", label: "Independent fusion rationale", agreement: pct(counts.fusion), rationale: "Requires a separate instability, deformity, revision, collapse, or destabilizing-resection mechanism." },
  ];
  pathwaySupport.sort((a, b) => b.agreement - a.agreement);

  return {
    cohortSize: safeCohortSize,
    modelVersion: MODEL_VERSION,
    inputCompleteness: completeness(input, decision),
    pathwaySupport,
    indexPhenotype: `${input.age}-year-old with ${input.painPattern} symptoms, a ${decision.reconciliation.replaceAll("-", " ")} clinical–imaging relationship, ${input.imagingFinding.replaceAll("-", " ")} at ${input.imagingLevel}, and ${decision.urgency} urgency.`,
    uncertaintyDrivers,
    cohortMetrics: [
      { label: "Urgent phenotype", value: pct(urgentCount), note: "Analog scenarios containing urgent neurologic or serious-pathology features." },
      { label: "Clinically concordant phenotype", value: pct(concordantCount), note: "Analog scenarios with aligned clinical and imaging localization." },
      { label: "Objective deficit phenotype", value: pct(deficitCount), note: "Analog scenarios containing an objective motor or gait deficit." },
      { label: "Independent instability phenotype", value: pct(instabilityCount), note: "Analog scenarios containing a separate fusion-relevant mechanism." },
    ],
    auditChecks: [
      "Deterministic seed: identical inputs generate identical aggregate results.",
      "Safety precedence: emergency and urgent rules cannot be downgraded by the simulation.",
      "Non-mutually-exclusive outputs: pathway percentages may sum to more than 100%.",
      "No observed outcomes: the cohort contains no real treatment effects, complications, or follow-up outcomes.",
      "Cohort size is a stability parameter only; 300,000 simulated cases do not confer clinical validity.",
    ],
    modelNotice: "This module simulates 300,000 patient-level analog scenarios from transparent assumptions. It is not a registry, not a trained clinical model, and not evidence that a treatment will work for this patient.",
    outcomeStatus: "Patient-specific outcome probabilities remain disabled until models are trained and calibrated on real longitudinal data, externally validated, and prospectively evaluated.",
  };
}
