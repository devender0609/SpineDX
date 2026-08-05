import type { CaseInput } from "./schema.ts";

/**
 * Clinically distinct pathways.
 *
 * The previous model collapsed everything non-routine into one `out-of-scope` state, so a
 * suspected spinal infection and a pregnancy produced the same downstream behaviour and
 * nearly the same wording. They are not the same situation and must not read as though they
 * are: one needs urgent evaluation, the other needs a note about imaging and medication and
 * otherwise proceeds normally.
 */
export type PathwayId =
  | "routine"
  | "serious-pathology"
  | "complex-postoperative"
  | "outside-localization"
  | "special-population";

export type PathwayFinding = {
  pathway: PathwayId;
  /** Short clinician-facing statement of what was recorded. */
  reason: string;
  /** What the framework will and will not do as a result. */
  consequence: string;
};

export type PathwayAssessment = {
  /** Highest-priority pathway. Serious pathology always wins. */
  primary: PathwayId;
  findings: PathwayFinding[];
  /** Localization and elective treatment synthesis withheld. */
  blocksTreatmentSynthesis: boolean;
  /** Localization rules do not apply at all (as opposed to being withheld pending review). */
  blocksLocalization: boolean;
  /** Comprehensive review is the better tool for this case. */
  recommendsComprehensive: boolean;
  /** Examination reliability must be qualified regardless of what was recorded. */
  qualifiesExamReliability: boolean;
  /** The single recommended next action for this pathway. */
  nextAction: string | null;
};

const isPresent = (v: string) => v === "present";

const PRIORITY: PathwayId[] = [
  "serious-pathology",
  "special-population",
  "complex-postoperative",
  "outside-localization",
  "routine",
];

export function assessPathways(i: CaseInput): PathwayAssessment {
  const findings: PathwayFinding[] = [];

  // ---- Serious pathology / urgent diagnostic ------------------------------------------
  // These are not "outside scope". They are unresolved concerns requiring evaluation, and the
  // output must say so rather than implying the tool simply does not handle them.
  if (isPresent(i.feverOrSystemicInfection)) findings.push({ pathway: "serious-pathology",
    reason: "Infection concern is recorded.",
    consequence: "Routine localization and elective treatment synthesis are withheld until the infection concern is resolved." });
  if (isPresent(i.cancerWarning)) findings.push({ pathway: "serious-pathology",
    reason: "Malignancy concern is recorded.",
    consequence: "Routine localization and elective treatment synthesis are withheld until the malignancy concern is resolved." });
  if (isPresent(i.traumaOrFractureWarning) || isPresent(i.acuteFracture)) findings.push({ pathway: "serious-pathology",
    reason: "Acute fracture or major trauma concern is recorded.",
    consequence: "Degenerative localization rules do not apply until fracture is excluded." });
  if (isPresent(i.knownInfection)) findings.push({ pathway: "serious-pathology",
    reason: "Known spinal infection is recorded.",
    consequence: "This is outside the degenerative module and requires infection-specific assessment." });
  if (isPresent(i.knownTumor)) findings.push({ pathway: "serious-pathology",
    reason: "Known tumour is recorded.",
    consequence: "This is outside the degenerative module and requires oncologic assessment." });

  // ---- Complex postoperative / deformity ------------------------------------------------
  if (isPresent(i.priorLongFusion)) findings.push({ pathway: "complex-postoperative",
    reason: "Prior long fusion is recorded.",
    consequence: "Standard primary-degenerative localization rules may not apply to adjacent or previously instrumented segments." });
  if (isPresent(i.majorDeformity)) findings.push({ pathway: "complex-postoperative",
    reason: "Major deformity is recorded.",
    consequence: "Deformity alters segmental alignment and foraminal dimensions, so single-level concordance rules may not apply." });
  if (isPresent(i.priorPseudarthrosis)) findings.push({ pathway: "complex-postoperative",
    reason: "Prior pseudarthrosis is recorded.",
    consequence: "Postoperative structural assessment is required before a candidate level is advanced." });
  if (i.priorSurgeryType === "multiple" || isPresent(i.sameLevelRevision)) findings.push({ pathway: "complex-postoperative",
    reason: "Extensive revision anatomy is recorded.",
    consequence: "Operative history and postoperative anatomy must be reviewed before localization is relied on." });

  // ---- Outside current localization scope -----------------------------------------------
  if (i.lumbarScopeConfirmed === "no") findings.push({ pathway: "outside-localization",
    reason: "The assessment is not primarily lumbar/lumbosacral.",
    consequence: "This module assesses adult lumbar/lumbosacral presentations only. It cannot assess cervical, thoracic or multiregion presentations." });
  else if (i.lumbarScopeConfirmed === "uncertain") findings.push({ pathway: "outside-localization",
    reason: "The primary region is uncertain.",
    consequence: "Lumbar level and root synthesis is withheld until the primary region is established." });
  else if (i.lumbarScopeConfirmed === "not-assessed") findings.push({ pathway: "outside-localization",
    reason: "Lumbar scope is not yet confirmed.",
    consequence: "Confirm the primary region before the lumbar pathway is interpreted." });
  if (isPresent(i.cervicalThoracicSymptoms)) findings.push({ pathway: "outside-localization",
    reason: "Cervical or thoracic symptoms are recorded.",
    consequence: "No cervical or thoracic module exists in this build." });
  if (isPresent(i.predominantlyAxialPain) && i.legDominantPain === "absent" && i.clinicianPhenotype !== "claudication")
    findings.push({ pathway: "outside-localization",
      reason: "Pain is predominantly axial without radicular or claudicatory features.",
      consequence: "Root- and level-specific localization is not applicable to axial-predominant pain in this module." });

  // ---- Special population -----------------------------------------------------------------
  const age = i.age.status === "measured" ? i.age.value : null;
  if (age !== null && age < 18) findings.push({ pathway: "special-population",
    reason: "Patient age is under 18.",
    consequence: "This module is validated for adults only. Adult treatment synthesis is blocked; paediatric assessment is required." });
  if (isPresent(i.pregnant)) findings.push({ pathway: "special-population",
    reason: "Pregnancy is recorded.",
    consequence: "Imaging selection and medication options differ in pregnancy. Clinical localization reasoning continues; treatment synthesis requires obstetric coordination." });
  if (isPresent(i.neuromuscularDisease)) findings.push({ pathway: "special-population",
    reason: "Neuromuscular disease is recorded.",
    consequence: "Baseline weakness and reflex change reduce the specificity of the neurologic examination for root localization." });

  if (!findings.length) {
    return { primary: "routine", findings: [], blocksTreatmentSynthesis: false,
      blocksLocalization: false, recommendsComprehensive: false,
      qualifiesExamReliability: false, nextAction: null };
  }

  const present = new Set(findings.map(f => f.pathway));
  const primary = PRIORITY.find(p => present.has(p)) ?? "routine";

  const paediatric = findings.some(f => f.reason.includes("under 18"));
  const pregnancyOnly = present.has("special-population") && !paediatric &&
    !present.has("serious-pathology") && !present.has("outside-localization");

  return {
    primary,
    findings,
    // Pregnancy alone does not withhold localization reasoning — it changes imaging and
    // medication choices. Treating it like an infection concern would be wrong.
    blocksTreatmentSynthesis:
      present.has("serious-pathology") || present.has("outside-localization") || paediatric,
    blocksLocalization: present.has("outside-localization"),
    recommendsComprehensive: present.has("complex-postoperative"),
    qualifiesExamReliability: findings.some(f => f.reason.includes("Neuromuscular")),
    nextAction:
      present.has("serious-pathology")
        ? "Urgent evaluation of the recorded concern takes priority over elective localization review."
        : paediatric
        ? "Refer to a paediatric spine pathway. This module is validated for adults only."
        : present.has("outside-localization")
        ? "Use the appropriate region-specific pathway; this module assesses adult lumbar/lumbosacral presentations only."
        : present.has("complex-postoperative")
        ? "Open Comprehensive review and obtain the operative history and postoperative imaging."
        : pregnancyOnly
        ? "Coordinate imaging and medication decisions with the obstetric team."
        : null,
  };
}

export const PATHWAY_LABELS: Record<PathwayId, string> = {
  "routine": "Routine lumbar pathway",
  "serious-pathology": "Serious pathology — urgent diagnostic pathway",
  "complex-postoperative": "Complex postoperative or deformity pathway",
  "outside-localization": "Outside current localization scope",
  "special-population": "Special-population pathway",
};
