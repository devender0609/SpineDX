import type { CaseInput, DecisionOutput } from "./decisionEngine";

export type SurrogateKey =
  | "expedited-review"
  | "nonoperative"
  | "injection"
  | "decompression"
  | "fusion";

export type SurrogatePathway = {
  key: SurrogateKey;
  label: string;
  score: number;
  classification: "supported" | "not-supported";
  rationale: string;
  performance: {
    aurocMean: number;
    aurocRange: [number, number];
    balancedAccuracy: number;
    sensitivity: number;
    specificity: number;
  };
};

export type ConservativeSurrogateOutput = {
  modelVersion: string;
  trainingRecords: number;
  holdoutRecords: number;
  pathwayEstimates: SurrogatePathway[];
  mappedInputs: string[];
  mappingWarnings: string[];
  notice: string;
};

type TreeNode = {
  feature: string | null;
  threshold: number | null;
  left: number;
  right: number;
  probability: number | null;
};

const TREES: Record<string, TreeNode[]> = {"support_expedited_review":[{"feature":"num__progressive_weakness","threshold":0.5,"left":1,"right":8,"probability":null},{"feature":"num__infection_risk","threshold":0.5,"left":2,"right":7,"probability":null},{"feature":"num__cancer_red_flag","threshold":0.5,"left":3,"right":6,"probability":null},{"feature":"num__fracture_red_flag","threshold":0.5,"left":4,"right":5,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.08249520153533227},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":1.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":1.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":1.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":1.0}],"support_nonoperative":[{"feature":"num__symptom_duration_weeks","threshold":5.5,"left":1,"right":8,"probability":null},{"feature":"num__progressive_weakness","threshold":0.5,"left":2,"right":7,"probability":null},{"feature":"num__infection_risk","threshold":0.5,"left":3,"right":6,"probability":null},{"feature":"num__cancer_red_flag","threshold":0.5,"left":4,"right":5,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9848944580705766},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"cat__clinical_syndrome_axial","threshold":0.5,"left":9,"right":16,"probability":null},{"feature":"cat__injection_response_sustained","threshold":0.5,"left":10,"right":13,"probability":null},{"feature":"cat__clinical_syndrome_uncertain","threshold":0.5,"left":11,"right":12,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.21948946655190305},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9495554050768179},{"feature":"num__progressive_weakness","threshold":0.5,"left":14,"right":15,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9539067695220904},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"cat__pathology_degenerative_spondylolisthesis","threshold":0.5,"left":17,"right":20,"probability":null},{"feature":"num__infection_risk","threshold":0.5,"left":18,"right":19,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9660035238426483},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"num__hip_exam_abnormal","threshold":0.5,"left":21,"right":22,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.3268410259075293},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.7591897676540438}],"support_injection":[{"feature":"cat__injection_response_not_tried","threshold":0.5,"left":1,"right":2,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"cat__clinical_syndrome_neurogenic_claudication","threshold":0.5,"left":3,"right":8,"probability":null},{"feature":"cat__clinical_syndrome_axial","threshold":0.5,"left":4,"right":7,"probability":null},{"feature":"cat__clinical_syndrome_uncertain","threshold":0.5,"left":5,"right":6,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9298419891070271},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0}],"support_decompression_consult":[{"feature":"cat__clinical_syndrome_axial","threshold":0.5,"left":1,"right":14,"probability":null},{"feature":"num__symptom_duration_weeks","threshold":5.5,"left":2,"right":9,"probability":null},{"feature":"num__objective_motor_deficit","threshold":0.5,"left":3,"right":6,"probability":null},{"feature":"num__symptom_duration_weeks","threshold":1.5,"left":4,"right":5,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"num__hip_exam_abnormal","threshold":0.5,"left":7,"right":8,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.8080242184442145},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.3954639226442859},{"feature":"cat__clinical_syndrome_uncertain","threshold":0.5,"left":10,"right":13,"probability":null},{"feature":"num__hip_exam_abnormal","threshold":0.5,"left":11,"right":12,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.786208542687569},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.39384689529698585},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"cat__pathology_degenerative_spondylolisthesis","threshold":0.5,"left":15,"right":16,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"num__symptom_duration_weeks","threshold":5.5,"left":17,"right":18,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.023600106505292918},{"feature":"num__hip_exam_abnormal","threshold":0.5,"left":19,"right":20,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.6651329170531108},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.19380387506965352}],"independent_fusion_rationale":[{"feature":"num__prior_surgery","threshold":0.5,"left":1,"right":16,"probability":null},{"feature":"num__foraminal_collapse","threshold":0.5,"left":2,"right":9,"probability":null},{"feature":"num__deformity","threshold":0.5,"left":3,"right":6,"probability":null},{"feature":"num__dynamic_instability","threshold":0.5,"left":4,"right":5,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.056510830919847425},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.8865634252910489},{"feature":"cat__clinical_syndrome_axial","threshold":0.5,"left":7,"right":8,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9202988419177504},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.34073079031409614},{"feature":"num__symptom_duration_weeks","threshold":5.5,"left":10,"right":13,"probability":null},{"feature":"cat__pathology_foraminal_stenosis","threshold":0.5,"left":11,"right":12,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.3779744517690597},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.6492341737464615},{"feature":"num__vascular_exam_abnormal","threshold":0.5,"left":14,"right":15,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9607652850743468},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.7376593123731521},{"feature":"cat__clinical_syndrome_axial","threshold":0.5,"left":17,"right":22,"probability":null},{"feature":"cat__clinical_syndrome_uncertain","threshold":0.5,"left":18,"right":21,"probability":null},{"feature":"num__symptom_duration_weeks","threshold":5.5,"left":19,"right":20,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.5913767174468374},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.9552402420632231},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":"cat__pathology_degenerative_spondylolisthesis","threshold":0.5,"left":23,"right":24,"probability":null},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.0},{"feature":null,"threshold":null,"left":-1,"right":-1,"probability":0.8839871388793346}]};

const METRICS = {"independent_fusion_rationale":{"aurocMean":0.95,"aurocMin":0.949,"aurocMax":0.951,"balancedAccuracy":0.935,"sensitivity":0.942,"specificity":0.927},"support_decompression_consult":{"aurocMean":0.862,"aurocMin":0.862,"aurocMax":0.863,"balancedAccuracy":0.837,"sensitivity":0.932,"specificity":0.743},"support_expedited_review":{"aurocMean":0.954,"aurocMin":0.952,"aurocMax":0.955,"balancedAccuracy":0.954,"sensitivity":0.908,"specificity":1.0},"support_injection":{"aurocMean":0.962,"aurocMin":0.961,"aurocMax":0.963,"balancedAccuracy":0.962,"sensitivity":1.0,"specificity":0.925},"support_nonoperative":{"aurocMean":0.859,"aurocMin":0.858,"aurocMax":0.861,"balancedAccuracy":0.851,"sensitivity":0.727,"specificity":0.975}};

function hasObjectiveMotorDeficit(input: CaseInput): boolean {
  const grades = [
    input.rightHipFlexion, input.leftHipFlexion,
    input.rightKneeExtension, input.leftKneeExtension,
    input.rightAnkleDorsiflexion, input.leftAnkleDorsiflexion,
    input.rightGreatToeExtension, input.leftGreatToeExtension,
    input.rightPlantarFlexion, input.leftPlantarFlexion,
  ];
  return grades.some(g => g !== "5" && g !== "not-tested");
}

function syndrome(input: CaseInput): string {
  if (input.painPattern === "claudication") return "neurogenic_claudication";
  return input.painPattern;
}

function pathology(input: CaseInput): string {
  if (input.spondylolisthesis) return "degenerative_spondylolisthesis";
  const map: Record<CaseInput["imagingFinding"], string> = {
    disc: "disc_herniation",
    "central-stenosis": "central_stenosis",
    "lateral-recess": "lateral_recess_stenosis",
    foraminal: "foraminal_stenosis",
    extraforaminal: "extraforaminal_lesion",
    other: "nonspecific",
  };
  return map[input.imagingFinding];
}

function injectionResponse(input: CaseInput): string {
  if (input.injectionResponse === "not-tried") return "not_tried";
  if (input.injectionResponse === "sustained") return "sustained";
  if (input.injectionResponse === "none") return "none";
  return "temporary";
}

function featureMap(input: CaseInput): Record<string, number> {
  const s = syndrome(input);
  const p = pathology(input);
  const inj = injectionResponse(input);
  const infectionRisk =
    input.fever &&
    (input.bacteremiaOrRecentInfection || input.immunosuppression || input.recentProcedure);
  const cancerRisk =
    input.cancerHistory && (input.nightRestPain || input.unexplainedWeightLoss);
  const fractureRisk =
    input.recentTrauma ||
    ((input.osteoporosisRisk || input.chronicSteroidUse) && input.age >= 65);

  const values: Record<string, number> = {
    "num__symptom_duration_weeks": input.symptomDurationWeeks,
    "num__objective_motor_deficit": hasObjectiveMotorDeficit(input) ? 1 : 0,
    "num__progressive_weakness": input.progressiveWeakness ? 1 : 0,
    "num__infection_risk": infectionRisk ? 1 : 0,
    "num__cancer_red_flag": cancerRisk ? 1 : 0,
    "num__fracture_red_flag": fractureRisk ? 1 : 0,
    "num__hip_exam_abnormal": input.hipExamAbnormal ? 1 : 0,
    "num__vascular_exam_abnormal": input.pulsesAbnormal ? 1 : 0,
    "num__dynamic_instability": input.dynamicInstability === "present" ? 1 : 0,
    "num__deformity": input.deformityPresent ? 1 : 0,
    "num__prior_surgery": input.priorLumbarSurgery ? 1 : 0,
    "num__foraminal_collapse": input.foraminalCollapse === "present" ? 1 : 0,
  };

  for (const key of [
    "axial", "mixed", "neurogenic_claudication", "radicular", "uncertain"
  ]) values[`cat__clinical_syndrome_${key}`] = s === key ? 1 : 0;

  for (const key of [
    "degenerative_spondylolisthesis", "foraminal_stenosis",
    "disc_herniation", "central_stenosis", "lateral_recess_stenosis",
    "extraforaminal_lesion", "nonspecific"
  ]) values[`cat__pathology_${key}`] = p === key ? 1 : 0;

  for (const key of ["not_tried", "none", "temporary", "sustained"]) {
    values[`cat__injection_response_${key}`] = inj === key ? 1 : 0;
  }
  return values;
}

function evaluateTree(nodes: TreeNode[], values: Record<string, number>): number {
  let index = 0;
  for (let guard = 0; guard < 100; guard++) {
    const node = nodes[index];
    if (!node) return 0.5;
    if (node.feature === null) return Math.max(0, Math.min(1, node.probability ?? 0.5));
    const value = values[node.feature] ?? 0;
    index = value <= (node.threshold ?? 0) ? node.left : node.right;
  }
  return 0.5;
}

const CONFIG = [
  {
    target: "support_expedited_review",
    key: "expedited-review" as const,
    label: "Expedited specialist review",
    rationale: "Capacity-limited surrogate based on progressive weakness and serious-pathology warning features.",
  },
  {
    target: "support_nonoperative",
    key: "nonoperative" as const,
    label: "Continued nonoperative care",
    rationale: "Synthetic-rule surrogate based on syndrome, duration, prior injection response, and selected competing findings.",
  },
  {
    target: "support_injection",
    key: "injection" as const,
    label: "Targeted injection consideration",
    rationale: "Synthetic-rule surrogate based mainly on syndrome and whether a prior injection was attempted.",
  },
  {
    target: "support_decompression_consult",
    key: "decompression" as const,
    label: "Decompression consultation",
    rationale: "Synthetic-rule surrogate based on syndrome, remediable pathology, duration, motor deficit, and hip findings.",
  },
  {
    target: "independent_fusion_rationale",
    key: "fusion" as const,
    label: "Independent fusion rationale",
    rationale: "Synthetic-rule surrogate based on an operative phenotype plus instability, deformity, revision, collapse, and competing findings.",
  },
];

export function runConservativeSurrogate(
  input: CaseInput,
  _decision: DecisionOutput,
): ConservativeSurrogateOutput {
  const values = featureMap(input);
  const mappedInputs = Object.entries(values)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${key.replace(/^cat__|^num__/,"")}=${value}`);

  const mappingWarnings: string[] = [];
  if (input.dynamicInstability === "unknown") mappingWarnings.push("Dynamic instability was mapped as absent because it is unknown.");
  if (input.foraminalCollapse === "unknown") mappingWarnings.push("Foraminal collapse was mapped as absent because it is unknown.");
  if (input.imagingLevel === "multilevel") mappingWarnings.push("The surrogate does not perform level-by-level multilevel localization.");
  mappingWarnings.push("The v13 clinical form is mapped into a smaller synthetic training schema; some detailed examination and imaging fields are not used by this surrogate.");

  const pathwayEstimates: SurrogatePathway[] = CONFIG.map(config => {
    const score = evaluateTree(TREES[config.target], values);
    const m = METRICS[config.target as keyof typeof METRICS];
    return {
      key: config.key,
      label: config.label,
      score: Math.round(score * 100),
      classification: score >= 0.5 ? "supported" : "not-supported",
      rationale: config.rationale,
      performance: {
        aurocMean: m.aurocMean,
        aurocRange: [m.aurocMin, m.aurocMax],
        balancedAccuracy: m.balancedAccuracy,
        sensitivity: m.sensitivity,
        specificity: m.specificity,
      },
    };
  });

  return {
    modelVersion: "Synthetic-Rule Surrogate 2.0 (conservative)",
    trainingRecords: 240_000,
    holdoutRecords: 60_000,
    pathwayEstimates,
    mappedInputs,
    mappingWarnings,
    notice:
      "These estimates come from shallow decision trees trained to reproduce synthetic rule labels. They are not clinical probabilities, outcome predictions, or evidence that a treatment is appropriate.",
  };
}
