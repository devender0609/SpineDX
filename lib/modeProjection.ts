import type { CaseInput } from "./schema.ts";
import { createBlankCase } from "./caseFactory.ts";

export type WorkflowMode = "rapid" | "comprehensive";

/**
 * Fields a clinician can actually see and confirm in Rapid review.
 *
 * This is an ALLOWLIST, deliberately. The requirement is that hidden fields must not
 * continue influencing conclusions, while switching modes must not destroy data. A
 * denylist fails open: any field added to the schema later would silently start
 * leaking into rapid conclusions. An allowlist fails closed.
 *
 * The stored case (`data`) is never mutated by this projection — it is preserved in full
 * for audit and for switching back to Comprehensive. Only the ENGINE INPUT is narrowed.
 */
const RAPID_VISIBLE_FIELDS = [
  // Orientation
  "studyId", "primaryRegion", "lumbarScopeConfirmed", "clinicianPhenotype", "side",
  "symptomDurationWeeks", "patientGoal",
  // Safety screen (composite roll-ups expand into these)
  "urinaryRetention", "urinarySensationLoss", "urinaryInitiationDifficulty", "overflowIncontinence",
  "saddleSensoryChange", "bilateralSevereDeficit", "progressiveWeakness", "weaknessProgressionBasis",
  "weaknessTrajectory", "feverOrSystemicInfection", "cancerWarning", "traumaOrFractureWarning",
  // Syndrome
  "legDominantPain", "dermatomalPain", "straightLegRaise",
  "walkingProvokes", "standingProvokes", "sittingRelieves", "flexionRelieves", "pulsesAbnormal",
  // Focused motor screen
  "rapidMotorScreen", "weaknessQuality", "examConfidence",
  "rightKneeExtension", "leftKneeExtension", "rightAnkleDorsiflexion", "leftAnkleDorsiflexion",
  "rightGreatToeExtension", "leftGreatToeExtension", "rightPlantarFlexion", "leftPlantarFlexion",
  // Imaging confirmation
  "imagesReviewed", "imageQuality", "rapidImagingScreen", "levelByLevelDocumented", "imagingMatrix",
  // Treatment context
  "exerciseProgramCompleted", "medicationTrialCompleted",
  "injectionResponse", "injectionLevel", "injectionSide", "proposedProcedure", "priorSurgeryType",
] as const satisfies readonly (keyof CaseInput)[];

export const RAPID_FIELD_SET: ReadonlySet<keyof CaseInput> = new Set(RAPID_VISIBLE_FIELDS);

/**
 * Build the case object the decision engine is allowed to see for a given mode.
 * Comprehensive mode passes through unchanged. Rapid mode returns a blank case with
 * only the rapid-visible fields copied across.
 */
export function projectForMode(data: CaseInput, mode: WorkflowMode): CaseInput {
  if (mode === "comprehensive") return data;
  const projected = createBlankCase();
  for (const field of RAPID_VISIBLE_FIELDS) {
    // Structured clone keeps the projection independent of the stored case.
    (projected as Record<string, unknown>)[field] = structuredClone(data[field]);
  }
  return projected;
}

/**
 * Fields that hold a value in the stored case but are excluded from the rapid engine input.
 * Used to tell the clinician exactly what was set aside, rather than dropping it silently.
 */
export function suppressedFields(data: CaseInput, mode: WorkflowMode): string[] {
  if (mode === "comprehensive") return [];
  const blank = createBlankCase();
  const suppressed: string[] = [];
  for (const key of Object.keys(blank) as (keyof CaseInput)[]) {
    if (RAPID_FIELD_SET.has(key)) continue;
    if (JSON.stringify(data[key]) !== JSON.stringify(blank[key])) suppressed.push(key);
  }
  return suppressed;
}
