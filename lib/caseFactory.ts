import type { CaseInput, LevelFinding } from "./decisionEngine";

/**
 * Creates a blank assessment with explicit missing states.
 * Numeric values are null, not zero. Categorical values use not-assessed/unknown.
 * Negative clinical findings must be entered explicitly by the clinician.
 */
export function createBlankCaseFromTemplate(template: CaseInput, blankMatrix: LevelFinding[]): CaseInput {
  const blank = structuredClone(template);

  for (const key of Object.keys(blank) as (keyof CaseInput)[]) {
    const value = blank[key];
    if (key === "imagingMatrix") continue;
    if (typeof value === "number") (blank as unknown as Record<string, unknown>)[key] = null;
    else if (typeof value === "boolean") (blank as unknown as Record<string, unknown>)[key] = false;
    else if (typeof value === "string") (blank as unknown as Record<string, unknown>)[key] = "";
  }

  blank.imagingMatrix = blankMatrix.map(row => ({ ...row }));
  blank.onset = "not-assessed";
  blank.side = "not-assessed";
  blank.painPattern = "not-assessed";
  blank.suspectedRoot = "none";
  blank.mostImportantSymptom = "not-assessed";
  blank.treatmentPreference = "undecided";
  blank.riskTolerance = "not-assessed";
  blank.workDemand = "not-assessed";
  blank.homeSupport = "unknown";
  blank.weaknessQuality = "uncertain";
  blank.weaknessTrajectory = "none";
  blank.examConfidence = "low";
  blank.rightPatellarReflex = "not-tested";
  blank.leftPatellarReflex = "not-tested";
  blank.rightAchillesReflex = "not-tested";
  blank.leftAchillesReflex = "not-tested";
  blank.rightSensoryRoot = "not-tested";
  blank.leftSensoryRoot = "not-tested";
  blank.sensoryRoot = "not-tested";
  blank.straightLegRaise = "not-tested";
  blank.femoralStretch = "not-tested";
  blank.standingProvocationPattern = "not-assessed";
  blank.reliefPattern = "not-assessed";
  blank.imageQuality = "unknown";
  blank.imagingLevel = "multilevel";
  blank.imagingSide = "central";
  blank.imagingFinding = "other";
  blank.stenosisSeverity = "not-graded";
  blank.slipType = "none";
  blank.dynamicInstability = "unknown";
  blank.foraminalCollapse = "unknown";
  blank.plannedFacetResection = "unknown";
  blank.injectionResponse = "not-tried";
  blank.injectionLevel = "unknown";
  blank.injectionSide = "unknown";
  blank.injectionType = "unknown";
  blank.progressiveWeaknessStatus = "not-assessed";
  blank.urinaryRetentionStatus = "not-assessed";
  blank.urinarySensationLossStatus = "not-assessed";
  blank.urinaryInitiationDifficultyStatus = "not-assessed";
  blank.overflowIncontinenceStatus = "not-assessed";
  blank.saddleAnesthesiaStatus = "not-assessed";
  blank.bilateralSevereDeficitStatus = "not-assessed";
  blank.feverStatus = "not-assessed";
  blank.cancerWarningStatus = "not-assessed";
  blank.traumaWarningStatus = "not-assessed";
  blank.reducedAnalTone = "not-assessed";
  blank.smokingStatus = "not-assessed";
  blank.diabetesType = "not-assessed";
  blank.frailty = "unknown";
  blank.boneHealth = "unknown";
  blank.boneMedication = "unknown";
  blank.kidneyDiseaseStage = "not-assessed";
  blank.priorSurgeryType = "not-assessed";
  blank.plannedProcedure = "not-selected";
  blank.sexAtBirth = "unknown";
  blank.plannedApproach = "not-selected";
  blank.plannedSetting = "not-selected";
  blank.clinicianAgreement = "not-reviewed";
  blank.overrideReasonCategory = "none";

  const motorKeys: (keyof CaseInput)[] = [
    "rightHipFlexion", "leftHipFlexion", "rightKneeExtension", "leftKneeExtension",
    "rightAnkleDorsiflexion", "leftAnkleDorsiflexion", "rightGreatToeExtension",
    "leftGreatToeExtension", "rightPlantarFlexion", "leftPlantarFlexion"
  ];
  for (const key of motorKeys) (blank as unknown as Record<string, unknown>)[key] = "not-tested";

  return blank;
}
