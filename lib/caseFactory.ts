import type { AdjudicationRecord, CaseInput, ClinicalStatus, FusionLevelFinding, LevelFinding, LumbarLevel, Measurement, ReviewerAssessment } from "./schema.ts";

const levels: LumbarLevel[] = ["L1-2", "L2-3", "L3-4", "L4-5", "L5-S1"];
export const missingMeasurement = (unit?: string): Measurement => ({ value: null, status: "not-measured", unit });
export const measured = (value: number, unit?: string): Measurement => ({ value, status: "measured", unit });
const NA: ClinicalStatus = "not-assessed";

export function createBlankImagingMatrix(): LevelFinding[] {
  return levels.map(level => ({
    level,
    central: "not-graded",
    rightRecess: "not-graded",
    leftRecess: "not-graded",
    rightForamen: "not-graded",
    leftForamen: "not-graded",
    discMorphology: "not-assessed",
    migration: "not-assessed",
    synovialCyst: NA,
    rootDeformation: NA,
    priorDecompression: NA,
  }));
}

export function createBlankFusionMatrix(): FusionLevelFinding[] {
  return levels.map(level => ({
    level,
    dynamicInstability: NA,
    translationMm: missingMeasurement("mm"),
    angularMotionDeg: missingMeasurement("degrees"),
    foraminalCollapse: NA,
    plannedFacetResectionPercent: missingMeasurement("%"),
    revisionDestabilization: NA,
    pseudarthrosis: NA,
    relevantDeformity: NA,
  }));
}

export function createBlankCase(): CaseInput {
  return {
    studyId: "", primaryRegion: "lumbar", lumbarScopeConfirmed: "not-assessed",
    age: missingMeasurement("years"), sexAtBirth: "unknown", symptomDurationWeeks: missingMeasurement("weeks"), side: "not-assessed",
    clinicianPhenotype: "not-assessed", clinicianSuspectedRoot: "not-assessed", backPainNrs: missingMeasurement("0-10"), legPainNrs: missingMeasurement("0-10"),
    baselineOdi: missingMeasurement("0-100"), baselinePromisPf: missingMeasurement("T-score"), baselinePromisPi: missingMeasurement("T-score"),
    walkingLimitMeters: missingMeasurement("m"), patientGoal: "", treatmentPreference: "not-assessed",
    legDominantPain: NA, dermatomalPain: NA, standingProvokes: NA, walkingProvokes: NA, sittingRelieves: NA, flexionRelieves: NA,
    stoppingAloneRelieves: NA, bicycleBetter: NA, uphillBetterThanDownhill: NA, legHeaviness: NA, coughSneezeProvokes: NA, groinPain: NA,
    rightKneeExtension: "not-tested", leftKneeExtension: "not-tested", rightAnkleDorsiflexion: "not-tested", leftAnkleDorsiflexion: "not-tested",
    rightGreatToeExtension: "not-tested", leftGreatToeExtension: "not-tested", rightPlantarFlexion: "not-tested", leftPlantarFlexion: "not-tested", rapidMotorScreen: NA,
    weaknessQuality: "not-assessed", weaknessTrajectory: "not-assessed", weaknessProgressionBasis: "not-assessed", examConfidence: "not-assessed",
    muscleAtrophy: NA, heelWalkAbnormal: NA, toeWalkAbnormal: NA, repeatedHeelRaiseAbnormal: NA,
    rightPatellarReflex: "not-tested", leftPatellarReflex: "not-tested", rightAchillesReflex: "not-tested", leftAchillesReflex: "not-tested",
    rightSensoryRoot: "not-tested", leftSensoryRoot: "not-tested", straightLegRaise: "not-tested", femoralStretch: "not-tested",
    hipExamAbnormal: NA, pulsesAbnormal: NA, neuropathyFeatures: NA,
    urinaryRetention: NA, urinarySensationLoss: NA, urinaryInitiationDifficulty: NA, overflowIncontinence: NA, urinaryUrgencyAlone: NA,
    saddleSensoryChange: NA, bilateralSevereDeficit: NA, progressiveWeakness: NA, feverOrSystemicInfection: NA, cancerWarning: NA, traumaOrFractureWarning: NA,
    imagesReviewed: NA, imageQuality: "not-assessed", imagingAgeMonths: missingMeasurement("months"), levelByLevelDocumented: NA, rapidImagingScreen: NA,
    imagingMatrix: createBlankImagingMatrix(), fusionMatrix: createBlankFusionMatrix(),
    exerciseProgramCompleted: NA, exerciseWeeks: missingMeasurement("weeks"), medicationTrialCompleted: NA, injectionResponse: "unknown", injectionLevel: "unknown", injectionSide: "not-assessed",
    smokingStatus: "not-assessed", nicotineVaping: NA, smokelessTobacco: NA, diabetesType: "not-assessed", hba1c: missingMeasurement("%"), bmi: missingMeasurement("kg/m2"),
    hemoglobin: missingMeasurement("g/dL"), albumin: missingMeasurement("g/dL"), frailtyScale: missingMeasurement("1-9"), boneHealth: "not-assessed", dexTScore: missingMeasurement("T-score"),
    fragilityFracture: NA, chronicOpioidUse: NA, opioidMme: missingMeasurement("MME/day"), sleepApnea: NA, cpapAdherent: NA, anticoagulation: NA, priorDvtPe: NA,
    cardiopulmonaryDisease: NA, advancedRenalOrLiverDisease: NA, priorSurgeryType: "not-assessed", sameLevelRevision: NA, priorDuralTear: NA, priorInfection: NA, priorPseudarthrosis: NA,
    proposedProcedure: "not-assessed", proposedLevels: [], plannedSetting: "not-assessed",
    pregnant: NA, cervicalThoracicSymptoms: NA, neuromuscularDisease: NA, knownTumor: NA, knownInfection: NA, acuteFracture: NA,
    majorDeformity: NA, priorLongFusion: NA, predominantlyAxialPain: NA,
  };
}

export function createDemoCase(): CaseInput {
  const c = createBlankCase();
  c.studyId = "DEMO-001"; c.primaryRegion = "lumbar"; c.lumbarScopeConfirmed = "yes";
  c.age = measured(66, "years"); c.sexAtBirth = "female"; c.symptomDurationWeeks = measured(32, "weeks"); c.side = "right";
  c.clinicianPhenotype = "radicular"; c.clinicianSuspectedRoot = "L5"; c.backPainNrs = measured(4, "0-10"); c.legPainNrs = measured(8, "0-10");
  c.baselineOdi = measured(42, "0-100"); c.baselinePromisPf = measured(38, "T-score"); c.baselinePromisPi = measured(64, "T-score");
  c.walkingLimitMeters = measured(150, "m"); c.patientGoal = "Walk for 30 minutes with manageable leg pain"; c.treatmentPreference = "undecided";
  c.legDominantPain = "present"; c.dermatomalPain = "present"; c.standingProvokes = "present"; c.walkingProvokes = "present"; c.sittingRelieves = "present"; c.flexionRelieves = "present";
  c.stoppingAloneRelieves = "absent"; c.bicycleBetter = "present"; c.uphillBetterThanDownhill = "present"; c.legHeaviness = "absent"; c.coughSneezeProvokes = "absent"; c.groinPain = "absent";
  c.rightKneeExtension = "5"; c.leftKneeExtension = "5"; c.rightAnkleDorsiflexion = "4"; c.leftAnkleDorsiflexion = "5";
  c.rightGreatToeExtension = "4"; c.leftGreatToeExtension = "5"; c.rightPlantarFlexion = "5"; c.leftPlantarFlexion = "5"; c.rapidMotorScreen = "present";
  c.weaknessQuality = "true"; c.weaknessTrajectory = "stable"; c.weaknessProgressionBasis = "not-assessed"; c.examConfidence = "high";
  c.muscleAtrophy = "absent"; c.heelWalkAbnormal = "present"; c.toeWalkAbnormal = "absent"; c.repeatedHeelRaiseAbnormal = "absent";
  c.rightPatellarReflex = "normal"; c.leftPatellarReflex = "normal"; c.rightAchillesReflex = "normal"; c.leftAchillesReflex = "normal";
  c.rightSensoryRoot = "L5"; c.leftSensoryRoot = "none"; c.straightLegRaise = "positive"; c.femoralStretch = "negative";
  c.hipExamAbnormal = "absent"; c.pulsesAbnormal = "absent"; c.neuropathyFeatures = "absent";
  for (const key of ["urinaryRetention","urinarySensationLoss","urinaryInitiationDifficulty","overflowIncontinence","urinaryUrgencyAlone","saddleSensoryChange","bilateralSevereDeficit","progressiveWeakness","feverOrSystemicInfection","cancerWarning","traumaOrFractureWarning"] as const) c[key] = "absent";
  c.imagesReviewed = "present"; c.imageQuality = "adequate"; c.imagingAgeMonths = measured(2, "months"); c.levelByLevelDocumented = "present"; c.rapidImagingScreen = "present";
  const l45 = c.imagingMatrix.find(x => x.level === "L4-5")!; l45.rightRecess = "severe"; l45.discMorphology = "protrusion"; l45.migration = "none"; l45.rootDeformation = "present"; l45.synovialCyst = "absent"; l45.priorDecompression = "absent";
  for (const level of c.imagingMatrix.filter(x => x.level !== "L4-5")) { level.central = "none"; level.rightRecess = "none"; level.leftRecess = "none"; level.rightForamen = "none"; level.leftForamen = "none"; level.discMorphology = "none"; level.migration = "none"; level.rootDeformation = "absent"; level.synovialCyst = "absent"; level.priorDecompression = "absent"; }
  c.exerciseProgramCompleted = "present"; c.exerciseWeeks = measured(12, "weeks"); c.medicationTrialCompleted = "present"; c.injectionResponse = "meaningful-temporary"; c.injectionLevel = "L4-5"; c.injectionSide = "right";
  c.smokingStatus = "never"; c.nicotineVaping = "absent"; c.smokelessTobacco = "absent"; c.diabetesType = "none"; c.bmi = measured(28, "kg/m2");
  c.boneHealth = "unknown"; c.fragilityFracture = "absent"; c.chronicOpioidUse = "absent"; c.sleepApnea = "absent"; c.anticoagulation = "absent"; c.priorDvtPe = "absent";
  c.cardiopulmonaryDisease = "absent"; c.advancedRenalOrLiverDisease = "absent"; c.priorSurgeryType = "none"; c.sameLevelRevision = "absent"; c.priorDuralTear = "absent"; c.priorInfection = "absent"; c.priorPseudarthrosis = "absent";
  c.proposedProcedure = "not-assessed"; c.pregnant = "absent"; c.cervicalThoracicSymptoms = "absent"; c.neuromuscularDisease = "absent"; c.knownTumor = "absent"; c.knownInfection = "absent"; c.acuteFracture = "absent"; c.majorDeformity = "absent"; c.priorLongFusion = "absent"; c.predominantlyAxialPain = "absent";
  return c;
}

const blankReviewer = (): ReviewerAssessment => ({ reviewerId:"", specialty:"not-entered", syndrome:"not-entered", side:"not-entered", root:"not-entered", level:"not-entered", zone:"not-entered", urgency:"not-entered", additionalTesting:"not-entered", specialistReviewSupport:"not-entered", decompressionTarget:"", fusionRationale:"not-entered", confidence:"not-assessed", rationale:"" });
export function createBlankAdjudication(): AdjudicationRecord {
  return {
    caseId:"", siteCode:"", firstReviewer:blankReviewer(), secondReviewer:blankReviewer(), adjudicated:blankReviewer(), adjudicationMethod:"not-entered", disagreementReason:"", actualTreatment:"", procedurePerformed:"", operativeLevels:"", outcomeVisibleDuringAdjudication:false,
    anyThirtyDayComplication:"unknown", majorMedicalComplication:"unknown", surgicalSiteInfection:"unknown", neurologicDeterioration:"unknown", duralTear:"unknown", ninetyDayReadmission:"unknown", ninetyDayReoperation:"unknown", nonHomeDischarge:"unknown",
    sixMonthOdi:missingMeasurement("ODI"), twelveMonthOdi:missingMeasurement("ODI"), sixMonthLegPain:missingMeasurement("0-10"), twelveMonthLegPain:missingMeasurement("0-10"), sixMonthBackPain:missingMeasurement("0-10"), twelveMonthBackPain:missingMeasurement("0-10"), sixMonthPromisPf:missingMeasurement("T-score"), twelveMonthPromisPf:missingMeasurement("T-score"), notes:""
  };
}
