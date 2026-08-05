export type EvidenceStrength = "high" | "moderate" | "limited" | "consensus";
export type EvidenceDomain =
  | "safety" | "radiculopathy" | "claudication-stenosis" | "examination" | "imaging"
  | "injection" | "decompression" | "fusion" | "revision-postoperative" | "optimization"
  | "outcomes" | "implementation-validation";
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
  /** Level/quality descriptor where a recognised scheme applies. Omitted where none fits. */
  evidenceLevel?: string;
  /** Clinical domain, for the Evidence tab filters. */
  domain: EvidenceDomain;
  /**
   * Whether the citation, scope and claims of this entry have been checked against the source
   * document. "unverified" entries are shown with a visible caveat: they were compiled from
   * working knowledge and have NOT been opened and confirmed. This is a first-class field
   * because an unverified citation that looks verified is worse than no citation.
   */
  verified: "verified" | "unverified";
  verifiedOn?: string;
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
    domain: "radiculopathy",
    verified: "unverified",
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
    domain: "claudication-stenosis",
    verified: "unverified",
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
    domain: "imaging",
    verified: "unverified",
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
    domain: "examination",
    verified: "unverified",
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
    domain: "imaging",
    verified: "unverified",
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
    domain: "decompression",
    verified: "unverified",
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
    domain: "decompression",
    verified: "unverified",
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
    domain: "fusion",
    verified: "unverified",
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
    domain: "fusion",
    verified: "unverified",
    superseded: false,
  },
  "NICE-NG59-REDFLAGS": {
    id: "NICE-NG59-REDFLAGS",
    citation:
      "NICE guideline NG59. Low back pain and sciatica in over 16s: assessment and management. Published 30 November 2016, last updated 11 December 2020.",
    url: "https://www.nice.org.uk/guidance/ng59",
    studyType: "society-guideline",
    population: "People aged over 16 with low back pain and sciatica, across NHS care settings.",
    mainFinding:
      "Sets out the warning features that should be asked about in every presentation: difficulty passing urine, loss of sensation on passing urine, faecal incontinence, saddle anaesthesia, and bilateral severe sciatica or progressive motor weakness.",
    keyExclusions:
      "The guideline explicitly does NOT cover the evaluation or management of sciatica with progressive neurological deficit or cauda equina syndrome, nor people under 16, nor adolescent scoliosis. It states that clinicians should recognise these emergencies and refer, not that it tells them how to manage them.",
    applicability:
      "Supports the CONTENT of the safety screen only — which features to ask about. It does not support any statement about excluding cauda equina syndrome, and it is not a cauda equina management guideline.",
    limitations:
      "A general low back pain and sciatica guideline. Using it as authority for cauda equina diagnosis or management would misrepresent its stated scope.",
    reviewDate: "2026-08-04",
    domain: "safety",
    evidenceLevel: "National guideline (NICE)",
    verified: "verified",
    verifiedOn: "2026-08-04",
    superseded: false,
  },
  "GIRFT-CES-PATHWAY": {
    id: "GIRFT-CES-PATHWAY",
    citation:
      "NHS England Getting It Right First Time (GIRFT) national pathway for cauda equina syndrome, published as an interactive care pathway alongside NICE NG59.",
    url: "https://www.nice.org.uk/guidance/ng59/resources/interactive-care-pathway-for-cauda-equina-syndrome-15370315021",
    studyType: "expert-consensus",
    population:
      "Patients with suspected cauda equina syndrome in primary, community and secondary care.",
    mainFinding:
      "Provides a national decision-support pathway covering symptoms and initial management, bladder scanning, radiology, surgery and post-operative care, with escalation on clinical suspicion.",
    keyExclusions:
      "A service-delivery and decision-support pathway, not a diagnostic-accuracy study. No validated instrument exists that safely rules out cauda equina syndrome.",
    applicability:
      "Supports escalating on a positive screen, and supports this framework's refusal to state that emergency pathology has been excluded.",
    limitations:
      "Consensus and benchmarking derived rather than trial evidence. An escalation and completeness rule, not a clinical effectiveness finding. UK service context may not transfer directly.",
    reviewDate: "2026-08-04",
    domain: "safety",
    evidenceLevel: "National pathway / consensus",
    verified: "verified",
    verifiedOn: "2026-08-04",
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
    domain: "imaging",
    verified: "unverified",
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
    domain: "outcomes",
    verified: "unverified",
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
    domain: "outcomes",
    verified: "unverified",
    superseded: false,
  },
  "CROSSED-SLR": {
    id: "CROSSED-SLR",
    citation:
      "Diagnostic accuracy of the crossed straight-leg raise for lumbar disc herniation (pooled diagnostic-accuracy evidence).",
    url: "https://pubmed.ncbi.nlm.nih.gov/23220802/",
    studyType: "diagnostic-accuracy",
    population: "Patients with suspected lumbar radiculopathy, largely surgical referral cohorts.",
    mainFinding:
      "The crossed straight-leg raise is specific but insensitive: a positive test raises the probability of herniation while a negative test excludes little.",
    keyExclusions: "Surgical referral populations; limited data outside disc herniation.",
    applicability:
      "Supports weighting a positive crossed test as a supporting domain and never treating a negative one as reassurance.",
    limitations: "Few primary studies; reference standards and thresholds vary.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Moderate certainty",
    domain: "examination",
    verified: "unverified",
    superseded: false,
  },
  "MOTOR-REFLEX-DX": {
    id: "MOTOR-REFLEX-DX",
    citation:
      "Diagnostic performance of motor, sensory and reflex testing for lumbosacral root involvement (pooled evidence).",
    url: "https://pubmed.ncbi.nlm.nih.gov/23220802/",
    studyType: "diagnostic-accuracy",
    population: "Adults with suspected lumbosacral radiculopathy.",
    mainFinding:
      "Individual motor, sensory and reflex findings each have modest accuracy for identifying the affected root; combinations of concordant findings perform better than any single test.",
    keyExclusions:
      "Does not address multilevel or postoperative anatomy, where root attribution is substantially harder.",
    applicability:
      "Directly supports requiring multiple concordant domains before a candidate root is advanced.",
    limitations:
      "Inter-examiner reliability of manual motor grading and reflex assessment is itself imperfect and is not captured by accuracy estimates.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Moderate certainty",
    domain: "examination",
    verified: "unverified",
    superseded: false,
  },
  "ESI-EVIDENCE": {
    id: "ESI-EVIDENCE",
    citation:
      "Systematic review evidence on epidural steroid injection for lumbar radiculopathy: short-term benefit and diagnostic limitations.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26030910/",
    studyType: "systematic-review",
    population: "Adults with lumbar radiculopathy receiving epidural or transforaminal steroid injection.",
    mainFinding:
      "Injection provides modest short-term leg-pain and function benefit with limited durability; long-term surgical avoidance is not established.",
    keyExclusions:
      "Trials generally excluded cauda equina syndrome, severe progressive deficit, and infection.",
    applicability:
      "Supports treating an injection response as supportive context for the treatment discussion, not as localizing evidence.",
    limitations:
      "Heterogeneous technique, target selection, steroid and volume. A response does not distinguish the injected level from adjacent levels because injectate spreads, so response alone cannot establish the symptomatic level.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Moderate certainty for short-term benefit; low for durability",
    domain: "injection",
    verified: "unverified",
    superseded: false,
  },
  "SNRB-DX": {
    id: "SNRB-DX",
    citation:
      "Diagnostic selective nerve-root block: accuracy for identifying the symptomatic level.",
    url: "https://pubmed.ncbi.nlm.nih.gov/19479201/",
    studyType: "diagnostic-accuracy",
    population: "Adults with radicular pain considered for level-specific intervention.",
    mainFinding:
      "Diagnostic selective blocks have moderate accuracy for the symptomatic level and are meaningfully limited by injectate spread and placebo response.",
    keyExclusions: "Multilevel and postoperative anatomy, where spread is less predictable.",
    applicability:
      "Supports explicitly separating injection type, target, response and limitation, and refusing to treat response as proof of level.",
    limitations:
      "No accepted reference standard for the symptomatic level, so accuracy estimates are circular to a degree.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Low to moderate certainty",
    domain: "injection",
    verified: "unverified",
    superseded: false,
  },
  "SMOKING-FUSION": {
    id: "SMOKING-FUSION",
    citation:
      "Meta-analysis of smoking and nicotine exposure on lumbar fusion and wound outcomes.",
    url: "https://pubmed.ncbi.nlm.nih.gov/38831392/",
    studyType: "systematic-review",
    population: "Adults undergoing lumbar fusion.",
    mainFinding:
      "Smoking is associated with higher pseudarthrosis and wound-complication rates; cessation before surgery is associated with improved outcomes.",
    keyExclusions: "Observational pooling; cessation duration is inconsistently defined.",
    applicability:
      "Supports the nicotine optimization prompt when an operative pathway is being considered.",
    limitations:
      "Confounding by indication and by socioeconomic factors is not fully addressed. Effect sizes vary widely across studies.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Low to moderate certainty (observational)",
    domain: "optimization",
    verified: "unverified",
    superseded: false,
  },
  "GLYCEMIC-SSI": {
    id: "GLYCEMIC-SSI",
    citation:
      "Perioperative glycaemic control and surgical-site infection risk in spine surgery.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28187071/",
    studyType: "systematic-review",
    population: "Adults with diabetes undergoing spine surgery.",
    mainFinding:
      "Elevated perioperative glucose and HbA1c are associated with increased surgical-site infection risk.",
    keyExclusions: "Largely observational; thresholds differ between studies and societies.",
    applicability:
      "Supports flagging an elevated or unavailable HbA1c as an optimization item, not as a contraindication.",
    limitations:
      "No single validated HbA1c threshold for proceeding or deferring. Local pathway governs.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Low to moderate certainty (observational)",
    domain: "optimization",
    verified: "unverified",
    superseded: false,
  },
  "BONE-INSTRUMENT": {
    id: "BONE-INSTRUMENT",
    citation:
      "Bone mineral density and instrumentation failure in lumbar fusion.",
    url: "https://pubmed.ncbi.nlm.nih.gov/32341830/",
    studyType: "systematic-review",
    population: "Adults undergoing instrumented lumbar fusion.",
    mainFinding:
      "Low bone mineral density is associated with screw loosening, subsidence and proximal junctional failure.",
    keyExclusions: "Excludes non-instrumented decompression, to which it does not apply.",
    applicability:
      "Supports bone-health assessment before instrumentation only. Not relevant to decompression-only pathways.",
    limitations:
      "DEXA underestimates deficiency in degenerative lumbar spines because of osteophytes and sclerosis; opportunistic CT may reclassify patients.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Low to moderate certainty (observational)",
    domain: "optimization",
    verified: "unverified",
    superseded: false,
  },
  "OPIOID-OUTCOME": {
    id: "OPIOID-OUTCOME",
    citation:
      "Preoperative opioid exposure and outcomes after lumbar spine surgery.",
    url: "https://pubmed.ncbi.nlm.nih.gov/30234821/",
    studyType: "systematic-review",
    population: "Adults undergoing lumbar spine surgery with documented preoperative opioid use.",
    mainFinding:
      "Preoperative opioid exposure is associated with worse patient-reported outcomes and higher persistent postoperative use.",
    keyExclusions: "Observational; dose and duration definitions vary widely.",
    applicability:
      "Supports documenting exposure, MME and an analgesic plan. Does not support withholding treatment.",
    limitations:
      "Strong confounding by pain severity and psychosocial factors; association is not causal.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Low certainty (observational)",
    domain: "optimization",
    verified: "unverified",
    superseded: false,
  },
  "REVISION-DISEASE": {
    id: "REVISION-DISEASE",
    citation:
      "Outcomes of revision lumbar surgery for recurrent herniation, adjacent-segment disease and pseudarthrosis.",
    url: "https://pubmed.ncbi.nlm.nih.gov/30973511/",
    studyType: "systematic-review",
    population: "Adults undergoing revision lumbar decompression or fusion.",
    mainFinding:
      "Revision surgery yields smaller average improvement and higher complication rates than primary surgery, with outcomes varying substantially by indication.",
    keyExclusions: "Heterogeneous indications pooled together; deformity revision often excluded.",
    applicability:
      "Supports requiring review of the operative report and postoperative anatomy before advancing a target at a previously operated level.",
    limitations:
      "Indication heterogeneity limits transfer to any individual revision case.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Low to moderate certainty (observational)",
    domain: "revision-postoperative",
    verified: "unverified",
    superseded: false,
  },
  "SHARED-DECISION": {
    id: "SHARED-DECISION",
    citation:
      "Shared decision-making and decision aids in preference-sensitive spine care.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28402085/",
    studyType: "systematic-review",
    population: "Adults facing elective, preference-sensitive musculoskeletal and spine treatment decisions.",
    mainFinding:
      "Structured decision support improves knowledge and reduces decisional conflict; effects on treatment choice and outcomes are inconsistent.",
    keyExclusions: "Emergency and non-preference-sensitive decisions.",
    applicability:
      "Supports documenting the patient's functional goal and treatment preference as part of the record.",
    limitations:
      "Does not establish that any particular decision-support format improves clinical outcomes.",
    reviewDate: "2026-08-04",
    evidenceLevel: "Moderate certainty for decisional outcomes",
    domain: "implementation-validation",
    verified: "unverified",
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
    domain: "implementation-validation",
    verified: "unverified",
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
    domain: "implementation-validation",
    verified: "unverified",
    superseded: false,
  },
};

export const getEvidence = (id: string): EvidenceItem | undefined => EVIDENCE_REGISTRY[id];
export const getEvidenceList = (ids: readonly string[]): EvidenceItem[] =>
  ids.map(getEvidence).filter((x): x is EvidenceItem => x !== undefined);

/** IDs that describe the tool's own validation status rather than patient-level clinical evidence. */
export const FRAMEWORK_ONLY_EVIDENCE = new Set(["TRIPOD-AI", "DECIDE-AI"]);
