import type { CaseInput } from "./schema.ts";

/**
 * The confirmations Rapid review requires before a preliminary synthesis is meaningful.
 * Exactly these drive the "N required confirmations remaining" counter — a count, not a
 * percentage, because a percentage implies the remaining work is proportional to the
 * clinical importance of what is left, which it is not.
 *
 * Measurement fields are deliberately excluded: "not measured" is a legitimate answer, not
 * an unanswered state, so counting them would never reach zero for a patient whose symptom
 * duration is genuinely unknown.
 */
export type RapidRequirement = {
  key: string; label: string; step: number;
  answered: (c: CaseInput) => boolean;
  /** When present, the requirement only counts if the case makes it relevant. */
  relevant?: (c: CaseInput, ctx: RapidContext) => boolean;
};
/** Optional review contexts the physician opts into for this visit. */
export type RapidContext = { procedureReview: boolean; managementContext: boolean };
export const DEFAULT_RAPID_CONTEXT: RapidContext = { procedureReview: false, managementContext: false };

const answered = (v: string) => v !== "not-assessed" && v !== "unknown";

export const RAPID_REQUIREMENTS: RapidRequirement[] = [
  { key: "lumbarScopeConfirmed",     label: "Lumbar scope confirmation",   step: 0, answered: c => c.lumbarScopeConfirmed !== "not-assessed" },
  { key: "clinicianPhenotype",       label: "Main symptom pattern",        step: 0, answered: c => answered(c.clinicianPhenotype) },
  { key: "side",                     label: "Side",                        step: 0, answered: c => c.side !== "not-assessed" },
  { key: "bladderSaddle",            label: "Bladder or saddle symptoms",  step: 1, answered: c => answered(c.urinaryRetention) },
  { key: "bilateralSevereDeficit",   label: "Severe bilateral deficit",    step: 1, answered: c => answered(c.bilateralSevereDeficit) },
  { key: "progressiveWeakness",      label: "New or progressive weakness", step: 1, answered: c => answered(c.progressiveWeakness) },
  { key: "seriousPathology",         label: "Infection, cancer, fracture or trauma concern", step: 1, answered: c => answered(c.feverOrSystemicInfection) },
  { key: "legDominantPain",          label: "Leg-dominant symptoms",       step: 2, answered: c => answered(c.legDominantPain) },
  { key: "dermatomalPain",           label: "Dermatomal pain",             step: 2, answered: c => answered(c.dermatomalPain) },
  { key: "straightLegRaise",         label: "Straight-leg raise",          step: 2, answered: c => c.straightLegRaise !== "not-tested" },
  { key: "rapidMotorScreen",         label: "Focal motor deficit",         step: 2, answered: c => answered(c.rapidMotorFinding.status) },
  { key: "imagesReviewed",           label: "Imaging source",              step: 3, answered: c => answered(c.imagesReviewed) },
  { key: "rapidImagingScreen",       label: "Compressive finding",         step: 3, answered: c => answered(c.rapidImagingScreen) },
  { key: "priorSurgeryType",         label: "Prior lumbar operation",      step: 4, answered: c => c.priorSurgeryType !== "not-assessed" },
  // --- conditional: only counted when the visit actually includes these reviews ---
  { key: "exerciseProgramCompleted", label: "Exercise or physical therapy", step: 4,
    answered: c => answered(c.exerciseProgramCompleted),
    relevant: (_c, ctx) => ctx.managementContext },
  { key: "medicationTrialCompleted", label: "Medication trial",            step: 4,
    answered: c => answered(c.medicationTrialCompleted),
    relevant: (_c, ctx) => ctx.managementContext },
  { key: "injectionResponse",        label: "Injection response",          step: 4,
    answered: c => c.injectionResponse !== "unknown",
    relevant: (_c, ctx) => ctx.managementContext },
  { key: "proposedProcedure",        label: "Pathway being considered",    step: 4,
    answered: c => c.proposedProcedure !== "not-assessed",
    relevant: (_c, ctx) => ctx.procedureReview },
];

/** Requirements that apply to this case. Irrelevant optional fields are never counted. */
export const applicableRapidRequirements = (c: CaseInput, ctx: RapidContext = DEFAULT_RAPID_CONTEXT) =>
  RAPID_REQUIREMENTS.filter(r => !r.relevant || r.relevant(c, ctx));

export const outstandingRapidRequirements = (c: CaseInput, ctx: RapidContext = DEFAULT_RAPID_CONTEXT): RapidRequirement[] =>
  applicableRapidRequirements(c, ctx).filter(r => !r.answered(c));

/**
 * Case features for which Comprehensive review is the better tool. These are SUGGESTIONS.
 * The switch is never forced from here; only safety or data-integrity rules block progress.
 */
export function comprehensiveSuggestions(c: CaseInput): string[] {
  const out: string[] = [];
  if (c.priorSurgeryType !== "none" && c.priorSurgeryType !== "not-assessed")
    out.push("prior lumbar surgery is recorded, so operative history and postoperative anatomy need review");
  if (c.proposedProcedure === "fusion" || c.proposedProcedure === "decompression-fusion")
    out.push("fusion is being considered, which requires level-specific rationale documentation");
  if (c.progressiveWeakness === "present")
    out.push("progressive weakness is recorded and warrants a full neurologic examination");
  const severeMotor = [c.rightKneeExtension, c.leftKneeExtension, c.rightAnkleDorsiflexion, c.leftAnkleDorsiflexion,
    c.rightGreatToeExtension, c.leftGreatToeExtension, c.rightPlantarFlexion, c.leftPlantarFlexion]
    .some(g => g !== "not-tested" && Number(g === "4+" ? 4.5 : g) <= 3);
  if (severeMotor)
    out.push("a severe motor deficit is recorded and warrants a full bilateral examination");
  if (c.imageQuality === "limited")
    out.push("image quality is limited, so the imaging review needs qualification");
  if (c.pulsesAbnormal === "present" || c.hipExamAbnormal === "present" || c.neuropathyFeatures === "present")
    out.push("a competing vascular, hip or peripheral nerve explanation is recorded");
  const gradedLevels = c.imagingMatrix.filter(l =>
    [l.central, l.rightRecess, l.leftRecess, l.rightForamen, l.leftForamen].some(s => s !== "not-graded" && s !== "none"));
  if (gradedLevels.length > 1)
    out.push("more than one potentially relevant level is documented");
  return out;
}

export const RAPID_REQUIREMENT_COUNT = RAPID_REQUIREMENTS.length;
/** Base workflow: the decision-critical confirmations every routine case needs. */
export const BASE_RAPID_REQUIREMENT_COUNT =
  RAPID_REQUIREMENTS.filter(r => !r.relevant).length;
