export type EvidenceStrength = "high" | "moderate" | "limited" | "consensus";
export type StudyType =
  | "society-guideline"
  | "randomized-trial"
  | "systematic-review"
  | "prospective-cohort"
  | "diagnostic-accuracy"
  | "measurement-validation"
  | "reporting-standard"
  | "expert-consensus";

export type EvidenceItem = {
  id: string;
  citation: string;
  url: string;
  studyType: StudyType;
  population: string;
  mainFinding: string;
  keyExclusions: string;
  applicability: string;
  limitations: string;
  reviewDate: string;
  superseded: false | string;
};

/**
 * Curated registry. This is NOT a systematic review and must not be described as
 * comprehensive. Every rule that cites an ID here must cite it for a conclusion the
 * source actually addresses — see `assertEvidenceApplicability` in the engine tests.
 */
export const EVIDENCE_REGISTRY: Record<string, EvidenceItem> = {
  "NASS-LDH": {
    id: "NASS-LDH",
    citation:
      "North American Spine Society. Evidence-Based Clinical Guidelines: Lumbar Disc Herniation with Radiculopathy (2012 revision).",
    url: "https://pubmed.ncbi.nlm.nih.gov/24239490/",
    studyType: "society-guideline",
    population: "Adults with suspected lumbar disc herniation with radiculopathy.",
    mainFinding:
      "History, neurologic examination and imaging are interpreted together; imaging alone does not establish the symptomatic side, root or level.",
    keyExclusions:
      "Does not address cauda equina syndrome management, tumour, infection, fracture, deformity, or paediatric populations.",
    applicability:
      "Supports syndrome classification and the requirement for clinical–imaging concordance before level attribution.",
    limitations:
      "Guideline predates several later trials; recommendation strength varies by question and is not uniform across the document.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "NASS-LSS": {
    id: "NASS-LSS",
    citation:
      "North American Spine Society. Evidence-Based Clinical Guidelines: Degenerative Lumbar Spinal Stenosis (revised).",
    url: "https://pubmed.ncbi.nlm.nih.gov/23830297/",
    studyType: "society-guideline",
    population: "Adults with degenerative lumbar spinal stenosis and neurogenic claudication.",
    mainFinding:
      "Neurogenic claudication is a clinical diagnosis; imaging severity correlates imperfectly with symptom burden and function.",
    keyExclusions:
      "Excludes congenital stenosis, deformity-driven stenosis, and stenosis secondary to tumour, infection or fracture.",
    applicability:
      "Supports claudication phenotype classification and the caution against inferring symptoms from central canal severity alone.",
    limitations:
      "Consensus-heavy in several domains; limited direct evidence on zone-specific attribution.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "ASYMPT-MRI": {
    id: "ASYMPT-MRI",
    citation:
      "Brinjikji W, et al. Systematic literature review of imaging features of spinal degeneration in asymptomatic populations. AJNR 2015.",
    url: "https://pubmed.ncbi.nlm.nih.gov/25430861/",
    studyType: "systematic-review",
    population: "Asymptomatic adults across a wide age range, pooled imaging cohorts.",
    mainFinding:
      "Degenerative findings including disc bulge, protrusion and degeneration are common in people without symptoms and increase steadily with age.",
    keyExclusions:
      "Pooled asymptomatic cohorts only; does not establish how to weight findings in symptomatic patients.",
    applicability:
      "Directly supports refusing to treat an imaging abnormality as symptomatic without concordant clinical findings.",
    limitations:
      "Heterogeneous imaging protocols and grading definitions across included studies; prevalence estimates are not individualised.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "SLR-DX": {
    id: "SLR-DX",
    citation:
      "van der Windt DA, et al. Physical examination for lumbar radiculopathy due to disc herniation. Cochrane Database Syst Rev.",
    url: "https://pubmed.ncbi.nlm.nih.gov/23220802/",
    studyType: "diagnostic-accuracy",
    population: "Patients with suspected lumbar radiculopathy referred for surgical assessment.",
    mainFinding:
      "The straight-leg raise is sensitive but has poor specificity for disc herniation; individual examination items perform modestly in isolation.",
    keyExclusions:
      "Largely surgical referral populations, which inflates prevalence relative to primary care.",
    applicability:
      "Supports treating a positive tension sign as one supporting domain rather than as localising proof.",
    limitations:
      "Spectrum bias across included studies; reference standards varied.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "FORAMEN-GRADE": {
    id: "FORAMEN-GRADE",
    citation: "Lee S, et al. A practical MRI grading system for lumbar foraminal stenosis. AJR 2010.",
    url: "https://pubmed.ncbi.nlm.nih.gov/20308517/",
    studyType: "diagnostic-accuracy",
    population: "Adults undergoing lumbar MRI for suspected foraminal stenosis.",
    mainFinding: "The four-point grading system showed high inter-reader agreement.",
    keyExclusions: "Reader-agreement study; does not assess correlation with symptoms or surgical outcome.",
    applicability:
      "Supports structured zone-level documentation, not symptom attribution to a graded foramen.",
    limitations:
      "Agreement is not accuracy. No outcome linkage. Later reviews report heterogeneous symptom correlation.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "SPORT-LDH": {
    id: "SPORT-LDH",
    citation:
      "Lurie JD, et al. Surgical versus non-operative treatment for lumbar disc herniation: eight-year results of SPORT. Spine 2014.",
    url: "https://pubmed.ncbi.nlm.nih.gov/24153171/",
    studyType: "randomized-trial",
    population:
      "Surgical candidates with imaging-confirmed disc herniation, concordant radiculopathy and at least six weeks of symptoms.",
    mainFinding:
      "Both groups improved; as-treated analyses favoured surgery, while extensive crossover limited the randomised comparison.",
    keyExclusions:
      "Excluded cauda equina syndrome, progressive severe deficit, prior surgery at the level, and symptoms under six weeks.",
    applicability:
      "Applies only where a concordant candidate localization is already established and symptoms are durable.",
    limitations:
      "Crossover approached 50%, so intention-to-treat and as-treated estimates diverge substantially. Not applicable to discordant or unlocalised cases.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "SPORT-LSS": {
    id: "SPORT-LSS",
    citation:
      "Lurie JD, et al. Long-term outcomes of lumbar spinal stenosis: eight-year results of SPORT. Spine 2015.",
    url: "https://pubmed.ncbi.nlm.nih.gov/25569524/",
    studyType: "randomized-trial",
    population: "Surgical candidates with symptomatic stenosis and confirmatory imaging.",
    mainFinding: "Results differed by analytic approach with substantial treatment crossover.",
    keyExclusions: "Excluded significant deformity, instability requiring fusion, and prior lumbar surgery.",
    applicability: "Applies to symptomatic stenosis where localization is established.",
    limitations: "Crossover limits causal interpretation; population is a surgical referral cohort.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "NORDSTEN-DS": {
    id: "NORDSTEN-DS",
    citation:
      "Austevoll IM, et al. Decompression alone versus decompression with instrumented fusion for degenerative spondylolisthesis: five-year results. BMJ 2024.",
    url: "https://www.bmj.com/content/386/bmj-2024-079771",
    studyType: "randomized-trial",
    population:
      "Adults with symptomatic stenosis and degenerative spondylolisthesis considered surgical candidates.",
    mainFinding: "Decompression alone was non-inferior to decompression with fusion at five years.",
    keyExclusions:
      "Excluded isthmic spondylolisthesis, degenerative scoliosis beyond a threshold, prior surgery at the index level, and severe instability.",
    applicability:
      "Relevant only when fusion is actually being considered for degenerative spondylolisthesis. Not applicable to decompression-only pathways.",
    limitations:
      "Non-inferiority design with a prespecified margin; excluded populations are precisely those in whom fusion is most debated.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "SWEDISH-LSS": {
    id: "SWEDISH-LSS",
    citation:
      "Försth P, et al. Swedish Spinal Stenosis Study: five-year results of decompression with or without fusion.",
    url: "https://pubmed.ncbi.nlm.nih.gov/38945544/",
    studyType: "randomized-trial",
    population: "Adults with one- or two-level central stenosis, with and without spondylolisthesis.",
    mainFinding: "Five-year outcomes did not support routine addition of fusion.",
    keyExclusions: "Excluded degenerative scoliosis, prior lumbar surgery, and stenosis beyond two levels.",
    applicability: "Relevant only where fusion is being considered for one- or two-level central stenosis.",
    limitations: "Population-specific; does not address foraminal-driven or revision-driven fusion rationale.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "CES-CONSENSUS": {
    id: "CES-CONSENSUS",
    citation:
      "Multidisciplinary consensus and national standards on suspected cauda equina syndrome pathways (composite consensus entry).",
    url: "https://www.nice.org.uk/guidance/ng59",
    studyType: "expert-consensus",
    population: "Adults presenting with possible cauda equina syndrome.",
    mainFinding:
      "Suspected cauda equina syndrome requires immediate escalation on clinical suspicion; no screening question set safely excludes it.",
    keyExclusions:
      "Consensus rather than a diagnostic-accuracy study. No validated rule-out instrument exists.",
    applicability:
      "Supports escalation on a positive screen and supports refusing to state that emergency pathology has been excluded.",
    limitations:
      "Consensus-level evidence only. This is a completeness and escalation rule, not a high-level clinical effectiveness finding.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "ACR-LBP": {
    id: "ACR-LBP",
    citation: "American College of Radiology. ACR Appropriateness Criteria: Low Back Pain.",
    url: "https://www.acr.org/clinical-resources/clinical-tools-and-reference/appropriateness-criteria",
    studyType: "society-guideline",
    population: "Adults with low back pain, with and without radicular features.",
    mainFinding:
      "Imaging selection depends on red flags, neurologic deficit, symptom persistence and prior surgery.",
    keyExclusions: "Addresses imaging selection, not treatment selection or level attribution.",
    applicability: "Supports the serious-pathology screening domain and imaging-adequacy prompts.",
    limitations: "Appropriateness ratings are consensus-informed and are not outcome evidence.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "ODI-PSYCH": {
    id: "ODI-PSYCH",
    citation: "Psychometric evaluations of the Oswestry Disability Index in low back pain populations.",
    url: "https://pubmed.ncbi.nlm.nih.gov/19646379/",
    studyType: "measurement-validation",
    population: "Adults with low back pain across clinical and surgical settings.",
    mainFinding: "ODI has established validity, reliability and responsiveness as a disability measure.",
    keyExclusions: "Not a localization or treatment-selection instrument; MCID varies by population and time point.",
    applicability: "Supports use as a baseline and longitudinal function measure only.",
    limitations:
      "A single universal MCID across diagnoses, instruments and time points is not supported by the literature.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "PROMIS-VALID": {
    id: "PROMIS-VALID",
    citation: "Validation of PROMIS Physical Function and Pain Interference in lumbar spine populations.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26970039/",
    studyType: "measurement-validation",
    population: "Adults undergoing evaluation or surgery for lumbar spine conditions.",
    mainFinding: "PROMIS domains show acceptable validity and efficiency relative to legacy instruments.",
    keyExclusions: "Not designed for anatomic localization or operative-level selection.",
    applicability: "Supports optional baseline and longitudinal outcome capture only.",
    limitations: "T-score interpretation is population-referenced; MCID estimates vary across studies.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "TRIPOD-AI": {
    id: "TRIPOD-AI",
    citation: "Collins GS, et al. TRIPOD+AI statement. BMJ 2024.",
    url: "https://pubmed.ncbi.nlm.nih.gov/38626948/",
    studyType: "reporting-standard",
    population: "Prediction-model research including machine-learning models.",
    mainFinding:
      "Prediction models require prespecified outcomes, transparent methods, calibration assessment and external validation.",
    keyExclusions: "A reporting standard, not clinical evidence about lumbar disease.",
    applicability:
      "Applies to the framework's own validation status; cited only for statements about the tool, never about a patient.",
    limitations: "Does not itself establish that any specific rule in this app is valid.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
  "DECIDE-AI": {
    id: "DECIDE-AI",
    citation: "Vasey B, et al. DECIDE-AI reporting guideline. BMJ 2022.",
    url: "https://pubmed.ncbi.nlm.nih.gov/35584845/",
    studyType: "reporting-standard",
    population: "Early live clinical evaluation of decision-support systems.",
    mainFinding:
      "Prospective evaluation should assess safety, workflow fit, clinician interaction and real-world performance.",
    keyExclusions: "A reporting standard, not clinical evidence about lumbar disease.",
    applicability: "Applies to the framework's evaluation status; never cited as patient-level evidence.",
    limitations: "Does not establish clinical validity of any rule.",
    reviewDate: "2026-08-03",
    superseded: false,
  },
};

export const getEvidence = (id: string): EvidenceItem | undefined => EVIDENCE_REGISTRY[id];
export const getEvidenceList = (ids: readonly string[]): EvidenceItem[] =>
  ids.map(getEvidence).filter((x): x is EvidenceItem => x !== undefined);

/** IDs that describe the tool's own validation status rather than patient-level clinical evidence. */
export const FRAMEWORK_ONLY_EVIDENCE = new Set(["TRIPOD-AI", "DECIDE-AI"]);
