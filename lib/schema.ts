export type ClinicalStatus = "present" | "absent" | "unknown" | "not-assessed" | "not-applicable";
export type Confidence = "high" | "moderate" | "low" | "not-assessed";
export type Laterality = "right" | "left" | "bilateral" | "midline" | "not-assessed";
/**
 * Legacy structured region field. Retained for the research schema and for imported records
 * only. It is NOT surfaced as a clinical module selector, because presenting cervical or
 * thoracic as selectable options implies those modules exist. Clinical scope is governed by
 * `lumbarScopeConfirmed`.
 */
export type FusionRationaleFactor =
  | "dynamic-instability"
  | "pseudarthrosis"
  | "revision-destabilization"
  | "relevant-deformity"
  | "foraminal-height-restoration"
  | "anticipated-destabilizing-decompression"
  | "hardware-failure-or-postoperative-structural"
  | "other-prespecified"
  | "insufficient-information";

export type ReviewConfidence = "high" | "moderate" | "low" | "not-entered";

export type PrimaryRegion = "lumbar" | "cervical" | "thoracic" | "multiple" | "nonspinal-uncertain" | "not-assessed";
export type ScopeConfirmation = "yes" | "no" | "uncertain" | "not-assessed";

/**
 * Dedicated Rapid motor observation.
 *
 * Rapid review records ONE focused observation. It must never be expanded into graded
 * Comprehensive muscle fields: a single "L5 weakness" observation is not evidence that both
 * ankle dorsiflexion and great-toe extension were individually tested, and an observation on
 * one side says nothing about the other. This structure keeps the focused screen separate
 * from the bilateral examination so neither can be mistaken for the other.
 */
export type TestedMovement =
  | "knee-extension" | "ankle-dorsiflexion" | "great-toe-extension" | "plantar-flexion"
  | "heel-walk" | "toe-walk" | "other" | "not-assessed";
export type RapidMotorReliability =
  | "objective-reproducible" | "pain-limited" | "effort-limited" | "give-way"
  | "chronic-baseline" | "uncertain" | "not-assessed";
export type RapidMotorFinding = {
  status: ClinicalStatus;
  side: Laterality;
  suspectedRoot: "L4" | "L5" | "S1" | "multiroot" | "uncertain" | "not-assessed";
  testedMovement: TestedMovement;
  lowestObservedGrade: MotorGrade;
  reliability: RapidMotorReliability;
};

/** Clinically distinct scope pathways. These are NOT interchangeable exclusions. */
export type ScopePathway =
  | "in-scope"
  | "serious-pathology"      // infection, malignancy, fracture, CES features, progressive severe deficit
  | "complex-postop-deformity" // prior long fusion, major deformity, revision anatomy, pseudarthrosis
  | "outside-localization"   // axial-only, nonspinal, unsupported region
  | "special-population";    // pregnancy, paediatric age, neuromuscular disease
export type Root = "L4" | "L5" | "S1";
export type RootOrNone = Root | "multiroot" | "none" | "not-assessed";
export type LumbarLevel = "L1-2" | "L2-3" | "L3-4" | "L4-5" | "L5-S1";
export type Zone = "central" | "right-recess" | "left-recess" | "right-foramen" | "left-foramen";
export type Severity = "none" | "mild" | "moderate" | "severe" | "not-graded";
export type MotorGrade = "5" | "4+" | "4" | "3" | "2" | "1" | "0" | "not-tested";
export type Reflex = "normal" | "reduced" | "absent" | "brisk" | "not-tested";
export type Measurement = { value: number | null; status: "measured" | "not-measured" | "unknown" | "not-applicable"; date?: string; unit?: string };

export type LevelFinding = {
  level: LumbarLevel;
  central: Severity;
  rightRecess: Severity;
  leftRecess: Severity;
  rightForamen: Severity;
  leftForamen: Severity;
  discMorphology: "none" | "bulge" | "protrusion" | "extrusion" | "sequestration" | "not-assessed";
  migration: "none" | "cranial" | "caudal" | "not-assessed";
  synovialCyst: ClinicalStatus;
  rootDeformation: ClinicalStatus;
  priorDecompression: ClinicalStatus;
};

export type FusionLevelFinding = {
  level: LumbarLevel;
  dynamicInstability: ClinicalStatus;
  translationMm: Measurement;
  angularMotionDeg: Measurement;
  foraminalCollapse: ClinicalStatus;
  plannedFacetResectionPercent: Measurement;
  revisionDestabilization: ClinicalStatus;
  pseudarthrosis: ClinicalStatus;
  relevantDeformity: ClinicalStatus;
};

export type CaseInput = {
  studyId: string;
  primaryRegion: PrimaryRegion;
  lumbarScopeConfirmed: ScopeConfirmation;
  rapidMotorFinding: RapidMotorFinding;
  age: Measurement;
  sexAtBirth: "female" | "male" | "intersex" | "unknown";
  symptomDurationWeeks: Measurement;
  side: Laterality;
  clinicianPhenotype: "radicular" | "claudication" | "axial" | "mixed" | "uncertain" | "not-assessed";
  clinicianSuspectedRoot: RootOrNone;
  backPainNrs: Measurement;
  legPainNrs: Measurement;
  baselineOdi: Measurement;
  baselinePromisPf: Measurement;
  baselinePromisPi: Measurement;
  walkingLimitMeters: Measurement;
  patientGoal: string;
  treatmentPreference: "nonoperative" | "open-to-surgery" | "undecided" | "not-assessed";

  legDominantPain: ClinicalStatus;
  dermatomalPain: ClinicalStatus;
  standingProvokes: ClinicalStatus;
  walkingProvokes: ClinicalStatus;
  sittingRelieves: ClinicalStatus;
  flexionRelieves: ClinicalStatus;
  stoppingAloneRelieves: ClinicalStatus;
  bicycleBetter: ClinicalStatus;
  uphillBetterThanDownhill: ClinicalStatus;
  legHeaviness: ClinicalStatus;
  coughSneezeProvokes: ClinicalStatus;
  groinPain: ClinicalStatus;

  rightKneeExtension: MotorGrade;
  leftKneeExtension: MotorGrade;
  rightAnkleDorsiflexion: MotorGrade;
  leftAnkleDorsiflexion: MotorGrade;
  rightGreatToeExtension: MotorGrade;
  leftGreatToeExtension: MotorGrade;
  rightPlantarFlexion: MotorGrade;
  leftPlantarFlexion: MotorGrade;
  rapidMotorScreen: ClinicalStatus;
  weaknessQuality: "true" | "pain-limited" | "give-way" | "uncertain" | "not-assessed";
  weaknessTrajectory: "stable" | "progressive" | "improving" | "none" | "not-assessed";
  weaknessProgressionBasis: "patient-reported" | "clinician-concern" | "serial-objective" | "not-assessed";
  examConfidence: Confidence;
  muscleAtrophy: ClinicalStatus;
  heelWalkAbnormal: ClinicalStatus;
  toeWalkAbnormal: ClinicalStatus;
  repeatedHeelRaiseAbnormal: ClinicalStatus;
  rightPatellarReflex: Reflex;
  leftPatellarReflex: Reflex;
  rightAchillesReflex: Reflex;
  leftAchillesReflex: Reflex;
  rightSensoryRoot: RootOrNone | "non-dermatomal" | "not-tested";
  leftSensoryRoot: RootOrNone | "non-dermatomal" | "not-tested";
  straightLegRaise: "positive" | "negative" | "not-tested";
  femoralStretch: "positive" | "negative" | "not-tested";
  hipExamAbnormal: ClinicalStatus;
  pulsesAbnormal: ClinicalStatus;
  neuropathyFeatures: ClinicalStatus;

  urinaryRetention: ClinicalStatus;
  urinarySensationLoss: ClinicalStatus;
  urinaryInitiationDifficulty: ClinicalStatus;
  overflowIncontinence: ClinicalStatus;
  urinaryUrgencyAlone: ClinicalStatus;
  saddleSensoryChange: ClinicalStatus;
  bilateralSevereDeficit: ClinicalStatus;
  progressiveWeakness: ClinicalStatus;
  feverOrSystemicInfection: ClinicalStatus;
  cancerWarning: ClinicalStatus;
  traumaOrFractureWarning: ClinicalStatus;

  imagesReviewed: ClinicalStatus;
  imageQuality: "adequate" | "limited" | "unknown" | "not-assessed";
  imagingAgeMonths: Measurement;
  levelByLevelDocumented: ClinicalStatus;
  rapidImagingScreen: ClinicalStatus;
  imagingMatrix: LevelFinding[];
  fusionMatrix: FusionLevelFinding[];

  exerciseProgramCompleted: ClinicalStatus;
  exerciseWeeks: Measurement;
  medicationTrialCompleted: ClinicalStatus;
  injectionResponse: "not-tried" | "none" | "brief" | "meaningful-temporary" | "sustained" | "unknown";
  injectionLevel: LumbarLevel | "unknown" | "not-applicable";
  injectionSide: Laterality;

  smokingStatus: "never" | "former" | "current" | "not-assessed";
  nicotineVaping: ClinicalStatus;
  smokelessTobacco: ClinicalStatus;
  diabetesType: "none" | "type-1" | "type-2" | "other" | "not-assessed";
  hba1c: Measurement;
  bmi: Measurement;
  hemoglobin: Measurement;
  albumin: Measurement;
  frailtyScale: Measurement;
  boneHealth: "normal" | "osteopenia" | "osteoporosis" | "unknown" | "not-assessed";
  dexTScore: Measurement;
  fragilityFracture: ClinicalStatus;
  chronicOpioidUse: ClinicalStatus;
  opioidMme: Measurement;
  sleepApnea: ClinicalStatus;
  cpapAdherent: ClinicalStatus;
  anticoagulation: ClinicalStatus;
  priorDvtPe: ClinicalStatus;
  cardiopulmonaryDisease: ClinicalStatus;
  advancedRenalOrLiverDisease: ClinicalStatus;
  priorSurgeryType: "none" | "decompression" | "discectomy" | "fusion" | "multiple" | "not-assessed";
  sameLevelRevision: ClinicalStatus;
  priorDuralTear: ClinicalStatus;
  priorInfection: ClinicalStatus;
  priorPseudarthrosis: ClinicalStatus;

  proposedProcedure: "none" | "decompression" | "discectomy" | "fusion" | "decompression-fusion" | "other" | "not-assessed";
  proposedLevels: LumbarLevel[];
  plannedSetting: "outpatient" | "inpatient" | "not-assessed";

  pregnant: ClinicalStatus;
  cervicalThoracicSymptoms: ClinicalStatus;
  neuromuscularDisease: ClinicalStatus;
  knownTumor: ClinicalStatus;
  knownInfection: ClinicalStatus;
  acuteFracture: ClinicalStatus;
  majorDeformity: ClinicalStatus;
  priorLongFusion: ClinicalStatus;
  predominantlyAxialPain: ClinicalStatus;
};

export type ReviewerAssessment = {
  reviewerId: string;
  specialty: "spine-surgery" | "pmr" | "pain" | "radiology" | "other" | "not-entered";
  syndrome: "radiculopathy" | "claudication" | "mixed" | "axial" | "indeterminate" | "not-entered";
  side: Laterality | "not-entered";
  root: RootOrNone | "not-entered";
  level: LumbarLevel | "multilevel" | "none" | "not-entered";
  zone: Zone | "multilevel" | "none" | "not-entered";
  urgency: "emergency" | "urgent" | "routine" | "indeterminate" | "not-entered";
  additionalTesting: "yes" | "no" | "indeterminate" | "not-entered";
  specialistReviewSupport: "supported" | "not-established" | "unable-to-assess" | "not-entered";
  decompressionTarget: string;
  /**
   * Factor-based fusion adjudication. Reviewers document which PRESPECIFIED factors they can
   * see in the record, then answer a separate yes/no/unable question. They are never asked to
   * select an undefined "established" category, which invited each reviewer to apply a private
   * threshold and made disagreement uninterpretable.
   */
  fusionFactors: FusionRationaleFactor[];
  fusionFactorsDocumented: "yes" | "no" | "unable-to-assess" | "not-entered";
  reviewerSpecialty: "not-entered" | "orthopedic-spine" | "neurosurgery" | "pmr" | "radiology" | "app" | "other";
  reviewerYearsExperience: Measurement;
  imagesDirectlyReviewed: "yes" | "report-only" | "not-entered";
  sawAppOutput: "yes" | "no" | "not-entered";
  sawOutcomes: "yes" | "no" | "not-entered";
  reviewMinutes: Measurement;
  confidenceSyndrome: ReviewConfidence;
  confidenceLocalization: ReviewConfidence;
  confidenceFusion: ReviewConfidence;
  missingInformationJudgment: "sufficient" | "insufficient" | "not-entered";
  confidence: Confidence;
  rationale: string;
};

export type AdjudicationRecord = {
  caseId: string;
  siteCode: string;
  firstReviewer: ReviewerAssessment;
  secondReviewer: ReviewerAssessment;
  adjudicated: ReviewerAssessment;
  adjudicationMethod: "unanimous" | "majority" | "third-reviewer" | "consensus-meeting" | "not-entered";
  disagreementReason: string;
  actualTreatment: string;
  procedurePerformed: string;
  operativeLevels: string;
  outcomeVisibleDuringAdjudication: false;
  anyThirtyDayComplication: "yes" | "no" | "unknown";
  majorMedicalComplication: "yes" | "no" | "unknown";
  surgicalSiteInfection: "yes" | "no" | "unknown";
  neurologicDeterioration: "yes" | "no" | "unknown";
  duralTear: "yes" | "no" | "unknown";
  ninetyDayReadmission: "yes" | "no" | "unknown";
  ninetyDayReoperation: "yes" | "no" | "unknown";
  nonHomeDischarge: "yes" | "no" | "unknown";
  sixMonthOdi: Measurement;
  twelveMonthOdi: Measurement;
  sixMonthLegPain: Measurement;
  twelveMonthLegPain: Measurement;
  sixMonthBackPain: Measurement;
  twelveMonthBackPain: Measurement;
  sixMonthPromisPf: Measurement;
  twelveMonthPromisPf: Measurement;
  notes: string;
};
