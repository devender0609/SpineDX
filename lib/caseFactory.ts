import type { CaseInput, LevelFinding } from "./decisionEngine";

const neutralStringByKey: Partial<Record<keyof CaseInput, string>> = {
  onset: "acute",
  side: "midline",
  painPattern: "uncertain",
  suspectedRoot: "none",
  mostImportantSymptom: "other",
  treatmentPreference: "undecided",
  riskTolerance: "moderate",
  workDemand: "sedentary",
  homeSupport: "unknown",
  weaknessQuality: "uncertain",
  weaknessTrajectory: "none",
  examConfidence: "low",
  rightPatellarReflex: "not-tested",
  leftPatellarReflex: "not-tested",
  rightAchillesReflex: "not-tested",
  leftAchillesReflex: "not-tested",
  rightSensoryRoot: "not-tested",
  leftSensoryRoot: "not-tested",
  sensoryRoot: "not-tested",
  straightLegRaise: "not-tested",
  femoralStretch: "not-tested",
  standingProvocationPattern: "not-assessed",
  reliefPattern: "not-assessed",
  imageQuality: "unknown",
  imagingLevel: "multilevel",
  imagingSide: "central",
  imagingFinding: "other",
  stenosisSeverity: "not-graded",
  slipType: "none",
  dynamicInstability: "unknown",
  foraminalCollapse: "unknown",
  plannedFacetResection: "unknown",
  injectionResponse: "not-tried",
  injectionLevel: "unknown",
  injectionSide: "unknown",
  injectionType: "unknown",
  progressiveWeaknessStatus: "not-assessed",
  urinaryRetentionStatus: "not-assessed",
  urinarySensationLossStatus: "not-assessed",
  urinaryInitiationDifficultyStatus: "not-assessed",
  overflowIncontinenceStatus: "not-assessed",
  saddleAnesthesiaStatus: "not-assessed",
  bilateralSevereDeficitStatus: "not-assessed",
  feverStatus: "not-assessed",
  cancerWarningStatus: "not-assessed",
  traumaWarningStatus: "not-assessed",
  reducedAnalTone: "not-assessed",
  smokingStatus: "never",
  diabetesType: "none",
  frailty: "unknown",
  boneHealth: "unknown",
  boneMedication: "unknown",
  kidneyDiseaseStage: "none",
  priorSurgeryType: "none",
  plannedProcedure: "not-selected",
  sexAtBirth: "unknown",
  plannedApproach: "not-selected",
  plannedSetting: "not-selected",
  clinicianAgreement: "not-reviewed",
  overrideReasonCategory: "none"
};

/**
 * Creates a blank case without carrying any positive values from the demo.
 * The template contributes keys and runtime primitive types only; its values are discarded.
 */
export function createBlankCaseFromTemplate(template: CaseInput, blankMatrix: LevelFinding[]): CaseInput {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(template) as [keyof CaseInput, CaseInput[keyof CaseInput]][]) {
    if (key === "imagingMatrix") {
      result[key] = blankMatrix.map(row => ({ ...row }));
    } else if (typeof value === "boolean") {
      result[key] = false;
    } else if (typeof value === "number") {
      result[key] = 0;
    } else if (typeof value === "string") {
      result[key] = neutralStringByKey[key] ?? "";
    } else {
      result[key] = value;
    }
  }

  const motorKeys: (keyof CaseInput)[] = [
    "rightHipFlexion", "leftHipFlexion", "rightKneeExtension", "leftKneeExtension",
    "rightAnkleDorsiflexion", "leftAnkleDorsiflexion", "rightGreatToeExtension",
    "leftGreatToeExtension", "rightPlantarFlexion", "leftPlantarFlexion"
  ];
  for (const key of motorKeys) result[key] = "not-tested";

  return result as CaseInput;
}
