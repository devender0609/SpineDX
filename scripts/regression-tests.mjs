import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createBlankCase, createDemoCase } from "../lib/caseFactory.ts";
import { evaluateCase } from "../lib/decisionEngine.ts";
import { validateCaseInput } from "../lib/validation.ts";
import { projectForMode, suppressedFields } from "../lib/modeProjection.ts";
import { EVIDENCE_REGISTRY, getEvidenceList, FRAMEWORK_ONLY_EVIDENCE, EVIDENCE_DOMAIN_LABELS } from "../lib/evidence.ts";
import { RAPID_REQUIREMENTS, outstandingRapidRequirements, comprehensiveSuggestions, applicableRapidRequirements, BASE_RAPID_REQUIREMENT_COUNT, DEFAULT_RAPID_CONTEXT } from "../lib/rapidRequirements.ts";
import { buildPriorityAlerts } from "../lib/priorityAlerts.ts";
import { stripIdentifiers, DRAFT_STORAGE_KEY } from "../lib/draftStorage.ts";
import { buildExport, identifyingFieldsPresent, FULL_EXPORT_WARNING } from "../lib/researchExport.ts";
import { createBlankAdjudication } from "../lib/caseFactory.ts";

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`  ok  ${name}`); };

const SAFETY_KEYS = ["urinaryRetention","urinarySensationLoss","urinaryInitiationDifficulty","overflowIncontinence","saddleSensoryChange","bilateralSevereDeficit","progressiveWeakness","feverOrSystemicInfection","cancerWarning","traumaOrFractureWarning"];
const clearSafety = (c) => { for (const k of SAFETY_KEYS) c[k] = "absent"; c.lumbarScopeConfirmed = "yes"; return c; };
/** blank case that is in scope but has nothing else answered */
const inScopeBlank = () => { const c = createBlankCase(); c.lumbarScopeConfirmed = "yes"; return c; };

console.log("\n-- Untested limbs must never be scored as normal --");

test("an ungraded limb does not generate a false side-discordance alert", () => {
  const c = clearSafety(createDemoCase());
  c.side = "right";
  c.rightKneeExtension = "not-tested"; c.rightAnkleDorsiflexion = "not-tested";
  c.rightGreatToeExtension = "not-tested"; c.rightPlantarFlexion = "not-tested";
  c.leftKneeExtension = "5"; c.leftAnkleDorsiflexion = "4";
  c.leftGreatToeExtension = "5"; c.leftPlantarFlexion = "5";
  const r = evaluateCase(c);
  assert.ok(!r.missing.some(x => x.includes("while the strongest recorded motor deficit is")),
    "an unexamined limb must not produce a laterality contradiction");
});

test("an ungraded limb is reported as not graded, never as 5/5", () => {
  const c = clearSafety(createDemoCase());
  c.rightKneeExtension = "not-tested"; c.rightAnkleDorsiflexion = "not-tested";
  c.rightGreatToeExtension = "not-tested"; c.rightPlantarFlexion = "not-tested";
  const r = evaluateCase(c);
  const row = r.concordance.find(x => /motor/i.test(x.domain));
  // the untested side must never be attributed a grade, and the row must disclose the gap
  assert.ok(!/right\s+\d/.test(row.finding), `ungraded side attributed a grade: ${row.finding}`);
  assert.equal(r.motor.completeness, "partial-examination");
  assert.ok(row.finding.includes("4 of 8 myotomes graded"),
    `the row must disclose how much was graded; got: ${row.finding}`);
});

test("one-sided motor testing is flagged as an explicit gap", () => {
  const c = clearSafety(createDemoCase());
  c.rightKneeExtension = "not-tested"; c.rightAnkleDorsiflexion = "not-tested";
  c.rightGreatToeExtension = "not-tested"; c.rightPlantarFlexion = "not-tested";
  const r = evaluateCase(c);
  assert.ok(r.missing.some(x => x.includes("one side only") && x.includes("not assumed normal")));
});

test("sensory or reflex data alone cannot yield a normal motor severity", () => {
  const c = clearSafety(createBlankCase());
  c.rightAchillesReflex = "normal";
  const r = evaluateCase(c);
  assert.equal(r.neurologic.severity, "indeterminate",
    "no motor group graded, so severity cannot be 'none'");
});

test("a negative rapid motor screen does not invent examination reliability", () => {
  const c = inScopeBlank();
  c.rapidMotorScreen = "absent";
  const r = evaluateCase(c);
  assert.equal(r.neurologic.reliability, "indeterminate",
    "reliability was never documented and must not be assumed 'moderate'");
  assert.ok(r.neurologic.rationale[0].includes("rapid screen"));
  assert.ok(r.neurologic.rationale[0].includes("not"),
    "must state that a complete examination was not performed");
});

test("a documented reliability is still honoured on a negative rapid screen", () => {
  const c = inScopeBlank();
  c.rapidMotorScreen = "absent"; c.examConfidence = "high";
  assert.equal(evaluateCase(c).neurologic.reliability, "high");
});

test("partial motor testing is disclosed in the rationale", () => {
  const c = clearSafety(createDemoCase());
  // grade only the right L5 myotomes; leave the rest untested
  c.rightKneeExtension = "not-tested"; c.rightPlantarFlexion = "not-tested";
  c.leftKneeExtension = "not-tested"; c.leftAnkleDorsiflexion = "not-tested";
  c.leftGreatToeExtension = "not-tested"; c.leftPlantarFlexion = "not-tested";
  const r = evaluateCase(c);
  assert.ok(r.neurologic.rationale.some(x => x.includes("of 8 motor groups graded")),
    `got: ${JSON.stringify(r.neurologic.rationale)}`);
});

test("a fully graded examination is not annotated as partial", () => {
  const r = evaluateCase(clearSafety(createDemoCase()));
  assert.ok(!r.neurologic.rationale.some(x => x.includes("of 8 motor groups graded")));
});

console.log("\n-- Anatomy: findings outside the root scope must surface, not vanish --");

test("L3-4 foraminal stenosis is surfaced as out-of-scope rather than silently dropped", () => {
  const c = clearSafety(createDemoCase());
  for (const lv of c.imagingMatrix) { lv.central = "none"; lv.rightRecess = "none"; lv.leftRecess = "none"; lv.rightForamen = "none"; lv.leftForamen = "none"; }
  const l34 = c.imagingMatrix.find(x => x.level === "L3-4");
  l34.rightForamen = "severe"; l34.rootDeformation = "present";
  const r = evaluateCase(c);
  assert.ok(r.scopeNotes.some(x => x.includes("L3-4") && x.includes("L3 exiting root")),
    "a severe documented finding must never disappear from the output");
  assert.ok(r.ruleTrace.some(x => x.ruleId === "SCOPE-001"));
});

test("in-scope root mapping is anatomically correct", () => {
  const cases = [
    ["L4-5", "rightForamen", "L4"],   // exiting root
    ["L4-5", "rightRecess",  "L5"],   // traversing root
    ["L5-S1", "rightForamen", "L5"],  // exiting root
    ["L5-S1", "rightRecess",  "S1"],  // traversing root
    ["L3-4", "rightRecess",  "L4"],   // traversing root
  ];
  for (const [level, zone, expectedRoot] of cases) {
    const c = clearSafety(createDemoCase());
    c.side = "right";
    for (const lv of c.imagingMatrix) { lv.central = "none"; lv.rightRecess = "none"; lv.leftRecess = "none"; lv.rightForamen = "none"; lv.leftForamen = "none"; lv.rootDeformation = "absent"; }
    const row = c.imagingMatrix.find(x => x.level === level);
    row[zone] = "severe"; row.rootDeformation = "present";
    // give every root a supporting deficit so the candidate is not filtered out
    c.rightKneeExtension = "4"; c.rightAnkleDorsiflexion = "4";
    c.rightGreatToeExtension = "4"; c.rightPlantarFlexion = "4";
    c.rightSensoryRoot = expectedRoot;
    const r = evaluateCase(c);
    assert.equal(r.targets[0]?.root, expectedRoot, `${level} ${zone} should map to ${expectedRoot}`);
  }
});

console.log("\n-- Missing laterality is missing, not conflicting --");

test("undocumented symptom side is recorded as unavailable, not as a conflict", () => {
  const c = clearSafety(createDemoCase());
  c.side = "not-assessed";
  const r = evaluateCase(c);
  assert.ok(!r.targets[0].conflicts.includes("symptom laterality is not compatible"));
  assert.ok(r.targets[0].unavailable.some(x => x.includes("laterality is not documented")));
});

test("a genuine side mismatch is still reported as a conflict", () => {
  const c = clearSafety(createDemoCase());
  c.side = "left";
  const r = evaluateCase(c);
  const all = r.targets.flatMap(t => t.conflicts);
  assert.ok(all.includes("symptom laterality is not compatible"));
});

console.log("\n-- Language boundaries --");

const BANNED = ["no invasive target", "clinically eligible target", "fusion indication established",
  "normal neurologic examination", "normal imaging"];

test("no output field uses banned definitive language", () => {
  const probes = [
    clearSafety(createBlankCase()),
    clearSafety(createDemoCase()),
    inScopeBlank(),
    (() => { const c = clearSafety(createDemoCase()); c.imagesReviewed = "absent"; return c; })(),
    (() => { const c = clearSafety(createDemoCase()); c.rapidImagingScreen = "absent"; return c; })(),
  ];
  for (const p of probes) {
    const text = JSON.stringify(evaluateCase(p)).toLowerCase();
    for (const phrase of BANNED) {
      assert.ok(!text.includes(phrase), `banned phrase "${phrase}" appeared in output`);
    }
  }
});

test("unresolved localization uses the preferred wording", () => {
  const r = evaluateCase(clearSafety(createBlankCase()));
  assert.equal(r.specialistReview.status, "localization-unresolved");
  assert.ok(r.specialistReview.limitations.some(x => x.includes("does not establish a concordant candidate localization")));
});

console.log("\n-- Negative screens are results, not missing data --");

test("a negative rapid imaging screen appears in scope notes, not in missing information", () => {
  const c = clearSafety(createDemoCase());
  c.rapidImagingScreen = "absent";
  c.levelByLevelDocumented = "absent";
  c.imagingMatrix = createBlankCase().imagingMatrix;
  const r = evaluateCase(c);
  assert.ok(r.scopeNotes.some(x => x.includes("limited rapid review did not identify")));
  assert.ok(!r.missing.some(x => x.includes("rapid imaging screen")));
});

test("report-only review explains itself instead of implying a clinical negative", () => {
  const c = clearSafety(createDemoCase());
  c.imagesReviewed = "absent";
  const r = evaluateCase(c);
  const loc = r.highlights.find(h => h.ruleId === "LOC-001");
  assert.ok(loc.detail.includes("direct image review is not documented"));
  assert.ok(loc.detail.includes("not evidence against"),
    "must not let a documentation gap read as a clinical negative");
});

console.log("\n-- Mode projection --");

test("comprehensive-only fields cannot influence a rapid conclusion", () => {
  const full = clearSafety(createDemoCase());
  full.rightAchillesReflex = "absent";
  full.rightSensoryRoot = "S1";
  full.hipExamAbnormal = "present";
  const rapid = projectForMode(full, "rapid");
  assert.equal(rapid.rightAchillesReflex, "not-tested");
  assert.equal(rapid.rightSensoryRoot, "not-tested");
  assert.equal(rapid.hipExamAbnormal, "not-assessed");
  const r = evaluateCase(rapid);
  assert.ok(!r.mimics.some(x => x.includes("hip")),
    "a hidden hip finding must not drive a rapid-mode competing-diagnosis warning");
});

test("rapid-visible fields survive the projection intact", () => {
  const full = clearSafety(createDemoCase());
  const rapid = projectForMode(full, "rapid");
  assert.equal(rapid.side, full.side);
  assert.equal(rapid.clinicianPhenotype, full.clinicianPhenotype);
  assert.equal(rapid.progressiveWeakness, full.progressiveWeakness);
  assert.equal(rapid.imagesReviewed, full.imagesReviewed);
  assert.equal(rapid.proposedProcedure, full.proposedProcedure);
});

test("comprehensive mode passes through unchanged", () => {
  const full = createDemoCase();
  assert.equal(projectForMode(full, "comprehensive"), full);
});

test("the projection does not mutate the stored case", () => {
  const full = clearSafety(createDemoCase());
  const before = JSON.stringify(full);
  projectForMode(full, "rapid");
  assert.equal(JSON.stringify(full), before, "stored data must be preserved for audit");
});

test("suppressed fields are enumerated so the clinician can be told what was set aside", () => {
  const full = clearSafety(createDemoCase());
  const s = suppressedFields(full, "rapid");
  assert.ok(s.includes("age"));
  assert.ok(s.includes("rightSensoryRoot"));
  assert.ok(!s.includes("side"), "a rapid-visible field must not be listed as suppressed");
  assert.equal(suppressedFields(full, "comprehensive").length, 0);
});

console.log("\n-- Evidence integrity --");

test("every evidence ID cited by the engine resolves in the registry", () => {
  const probes = [
    clearSafety(createDemoCase()),
    clearSafety(createBlankCase()),
    (() => { const c = clearSafety(createDemoCase()); c.clinicianPhenotype = "claudication";
      c.standingProvokes = "present"; c.walkingProvokes = "present"; c.sittingRelieves = "present";
      c.flexionRelieves = "present"; c.bicycleBetter = "present"; return c; })(),
    (() => { const c = clearSafety(createDemoCase()); c.proposedProcedure = "decompression-fusion";
      c.proposedLevels = ["L4-5"];
      const f = c.fusionMatrix.find(x => x.level === "L4-5");
      f.dynamicInstability = "present"; f.foraminalCollapse = "absent";
      f.revisionDestabilization = "absent"; f.pseudarthrosis = "absent"; f.relevantDeformity = "absent";
      return c; })(),
  ];
  for (const p of probes) {
    for (const rule of evaluateCase(p).ruleTrace) {
      for (const id of rule.evidenceIds) {
        assert.ok(EVIDENCE_REGISTRY[id], `rule ${rule.ruleId} cites unknown evidence ID "${id}"`);
      }
    }
  }
});

test("every registry entry carries the full required metadata", () => {
  const required = ["citation","url","studyType","population","mainFinding","keyExclusions","applicability","limitations","reviewDate"];
  for (const [id, item] of Object.entries(EVIDENCE_REGISTRY)) {
    for (const field of required) {
      assert.ok(item[field] && String(item[field]).trim().length > 0, `${id} is missing ${field}`);
    }
    assert.ok("superseded" in item, `${id} is missing superseded status`);
  }
});

test("evidence varies with the conclusion actually triggered", () => {
  const radicular = clearSafety(createDemoCase());
  const claud = clearSafety(createDemoCase());
  claud.legDominantPain = "absent"; claud.dermatomalPain = "absent"; claud.straightLegRaise = "negative";
  claud.rightAnkleDorsiflexion = "5"; claud.rightGreatToeExtension = "5"; claud.rightSensoryRoot = "none";
  claud.heelWalkAbnormal = "absent";
  claud.standingProvokes = "present"; claud.walkingProvokes = "present";
  claud.sittingRelieves = "present"; claud.flexionRelieves = "present"; claud.bicycleBetter = "present";
  const a = evaluateCase(radicular).ruleTrace.find(x => x.ruleId === "SYN-001").evidenceIds;
  const b = evaluateCase(claud).ruleTrace.find(x => x.ruleId === "SYN-001").evidenceIds;
  assert.notDeepEqual(a, b, "different syndromes must cite different sources");
  assert.ok(a.includes("NASS-LDH"));
  assert.ok(b.includes("NASS-LSS"));
});

test("a missing-data conclusion cites no disease-treatment literature", () => {
  const r = evaluateCase(clearSafety(createBlankCase()));
  const loc = r.ruleTrace.find(x => x.ruleId === "LOC-001");
  assert.equal(loc.evidenceIds.length, 0,
    "no clinical trial speaks to absent documentation");
});

test("fusion trials are not cited when fusion is not being considered", () => {
  const c = clearSafety(createDemoCase());
  c.proposedProcedure = "decompression";
  const ids = evaluateCase(c).ruleTrace.flatMap(x => x.evidenceIds);
  assert.ok(!ids.includes("NORDSTEN-DS"));
  assert.ok(!ids.includes("SWEDISH-LSS"));
});

test("fusion trials ARE cited when fusion rationale factors are documented", () => {
  const c = clearSafety(createDemoCase());
  c.proposedProcedure = "decompression-fusion"; c.proposedLevels = ["L4-5"];
  const f = c.fusionMatrix.find(x => x.level === "L4-5");
  f.dynamicInstability = "present"; f.foraminalCollapse = "absent";
  f.revisionDestabilization = "absent"; f.pseudarthrosis = "absent"; f.relevantDeformity = "absent";
  const ids = evaluateCase(c).ruleTrace.flatMap(x => x.evidenceIds);
  assert.ok(ids.includes("NORDSTEN-DS"));
});

test("framework reporting standards are never cited as patient-level evidence", () => {
  const probes = [clearSafety(createDemoCase()), clearSafety(createBlankCase())];
  for (const p of probes) {
    for (const id of evaluateCase(p).ruleTrace.flatMap(x => x.evidenceIds)) {
      assert.ok(!FRAMEWORK_ONLY_EVIDENCE.has(id),
        `${id} describes the tool, not the patient, and must not appear in a case rule trace`);
    }
  }
});

test("getEvidenceList drops unknown IDs rather than throwing", () => {
  assert.equal(getEvidenceList(["NASS-LDH", "DOES-NOT-EXIST"]).length, 1);
});

console.log("\n-- Preserved behaviour (must not regress) --");

test("emergency escalation still fires on a single positive red flag", () => {
  const c = inScopeBlank();
  c.urinaryRetention = "present";
  assert.equal(evaluateCase(c).urgency, "emergency");
});

test("incomplete safety screening still blocks a routine conclusion", () => {
  const r = evaluateCase(inScopeBlank());
  assert.equal(r.urgency, "indeterminate");
  assert.ok(validateCaseInput(inScopeBlank()).some(x => x.id === "safety-incomplete" && x.severity === "error"));
});

test("severe imaging without clinical support still yields no candidate", () => {
  const c = clearSafety(createDemoCase());
  c.dermatomalPain = "absent"; c.legDominantPain = "absent"; c.straightLegRaise = "negative";
  c.rightAnkleDorsiflexion = "5"; c.rightGreatToeExtension = "5"; c.rightSensoryRoot = "none";
  c.heelWalkAbnormal = "absent";
  assert.equal(evaluateCase(c).targets.length, 0);
});

test("instability at a non-target level still cannot establish fusion rationale", () => {
  const c = clearSafety(createDemoCase());
  c.proposedProcedure = "decompression-fusion"; c.proposedLevels = ["L4-5"];
  c.fusionMatrix.find(x => x.level === "L2-3").dynamicInstability = "present";
  assert.notEqual(evaluateCase(c).fusion.status, "factors-documented");
});

test("progression documented inconsistently still forces indeterminate urgency", () => {
  const c = clearSafety(createDemoCase());
  c.progressiveWeakness = "absent"; c.weaknessTrajectory = "progressive";
  assert.equal(evaluateCase(c).urgency, "indeterminate");
});


console.log("\n-- Red-flag screening granularity --");

test("severe bilateral deficit is asked separately from bladder and saddle symptoms", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  // the composite roll-up must no longer write bilateralSevereDeficit
  const rollup = ui.split("const setRapidCes=")[1].split("};")[0];
  assert.ok(!rollup.includes("bilateralSevereDeficit"),
    "a bladder/saddle composite answer must not silently set the bilateral-deficit red flag");
  assert.ok(/Severe bilateral leg weakness/.test(ui),
    "the bilateral deficit must have its own rapid-mode question");
});

test("clearing the bladder composite leaves the bilateral red flag unanswered", () => {
  // simulate: clinician answers "No" to bladder/saddle only
  const c = inScopeBlank();
  for (const k of ["urinaryRetention","urinarySensationLoss","urinaryInitiationDifficulty","overflowIncontinence","saddleSensoryChange"]) c[k] = "absent";
  const r = evaluateCase(c);
  assert.equal(r.urgency, "indeterminate",
    "safety must stay unresolved until the bilateral deficit is answered on its own");
  assert.ok(r.urgencyReason.includes("bilateral severe deficit"));
});

console.log("\n-- Reachability: no engine-active field may lack a control --");

test("every field the engine or validator reads has a UI control", () => {
  const schema = readFileSync("lib/schema.ts", "utf8");
  const engine = readFileSync("lib/decisionEngine.ts", "utf8");
  const validation = readFileSync("lib/validation.ts", "utf8");
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");

  const block = schema.split("export type CaseInput = {")[1].split("\n};")[0];
  const fields = [...block.matchAll(/^\s{2}(\w+)\s*[?]?:/gm)].map(m => m[1]);

  // Fields legitimately set by program logic rather than by a direct control:
  // screen roll-ups, matrices edited through level pickers, and identifiers.
  const PROGRAMMATIC = new Set([
    "rapidMotorScreen", "rapidImagingScreen", "levelByLevelDocumented",
    "imagingMatrix", "fusionMatrix", "proposedLevels", "studyId",
  ]);

  const reads = (src, f) => src.includes(`.${f}`) || src.includes(`"${f}"`);
  const orphans = fields.filter(f =>
    !PROGRAMMATIC.has(f) && (reads(engine, f) || reads(validation, f)) && !reads(ui, f));

  assert.deepEqual(orphans, [],
    `these fields drive logic but have no UI control, so they can never be set by a clinician: ${orphans.join(", ")}`);
});

test("the applicability out-of-scope module is reachable from the interface", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const f of ["pregnant","cervicalThoracicSymptoms","neuromuscularDisease","knownTumor",
                   "knownInfection","acuteFracture","majorDeformity","priorLongFusion",
                   "predominantlyAxialPain"]) {
    assert.ok(ui.includes(`"${f}"`), `scope exclusion "${f}" has no control`);
  }
});

test("a scope exclusion actually withholds treatment output", () => {
  const c = clearSafety(createDemoCase());
  c.knownTumor = "present";
  const r = evaluateCase(c);
  assert.equal(r.applicability.treatment, "out-of-scope");
  assert.ok(r.applicability.reasons.some(x => /tumour|tumor/i.test(x)));
  assert.equal(r.applicability.pathway.primary, "serious-pathology");
  assert.equal(r.specialistReview.status, "additional-assessment");
});

test("the prior-surgery contradiction rule is reachable from the interface", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const f of ["sameLevelRevision","priorDuralTear","priorInfection","priorPseudarthrosis"]) {
    assert.ok(ui.includes(`"${f}"`), `${f} gates a blocking validator but has no control`);
  }
});

test("the vascular-claudication discriminator is reachable and still fires", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes('"stoppingAloneRelieves"'));
  const c = clearSafety(createDemoCase());
  c.stoppingAloneRelieves = "present";
  assert.ok(evaluateCase(c).mimics.some(x => x.includes("vascular")));
});


test("a routine rapid case needs 10-14 confirmations, 18 at most with branches", () => {
  assert.ok(BASE_RAPID_REQUIREMENT_COUNT >= 10 && BASE_RAPID_REQUIREMENT_COUNT <= 14,
    `routine base workflow must be 10-14; got ${BASE_RAPID_REQUIREMENT_COUNT}`);
  assert.ok(RAPID_REQUIREMENTS.length <= 18,
    `maximum with all branches must not exceed 18; got ${RAPID_REQUIREMENTS.length}`);
});

test("optional treatment context is not counted unless the visit includes it", () => {
  const c = createBlankCase();
  const base = applicableRapidRequirements(c, DEFAULT_RAPID_CONTEXT).map(r => r.key);
  for (const optional of ["injectionResponse", "proposedProcedure",
                          "exerciseProgramCompleted", "medicationTrialCompleted"]) {
    assert.ok(!base.includes(optional), `${optional} must not be universally mandatory`);
  }
  const withCtx = applicableRapidRequirements(c, { procedureReview: true, managementContext: true });
  assert.equal(withCtx.length, RAPID_REQUIREMENTS.length);
});

test("optional treatment context does not block a preliminary synthesis", () => {
  const c = clearSafety(createDemoCase());
  c.injectionResponse = "unknown"; c.proposedProcedure = "not-assessed";
  const blocking = validateCaseInput(c).filter(x => x.severity === "error");
  assert.deepEqual(blocking, [],
    `unanswered optional context must not block: ${blocking.map(b => b.id).join(", ")}`);
});

test("the outstanding counter reaches zero only when every requirement is answered", () => {
  const blank = createBlankCase();
  assert.equal(outstandingRapidRequirements(blank).length, BASE_RAPID_REQUIREMENT_COUNT,
    "a blank case must show every applicable confirmation as outstanding");
  const done = clearSafety(createDemoCase());
  done.priorSurgeryType = "none"; done.proposedProcedure = "none";
  done.rapidMotorFinding = { ...done.rapidMotorFinding, status: "absent" };
  done.rapidMotorScreen = "absent";
  assert.equal(outstandingRapidRequirements(done).length, 0,
    `still outstanding: ${outstandingRapidRequirements(done).map(r => r.key).join(", ")}`);
});

test("the counter is a count, not a completion percentage", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(/required confirmation/.test(ui));
  assert.ok(!/%\s*complete|completion percentage|percentComplete/i.test(ui),
    "a completion percentage misrepresents remaining clinical importance");
});


console.log("\n-- v28.4: versioning and packaging --");

test("package, application and installer versions agree", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const appVersion = readFileSync("lib/appVersion.ts", "utf8");
  const installer = readFileSync("install-v30.0.ps1", "utf8");
  assert.equal(pkg.version, "0.30.0", "package.json version");
  assert.equal(lock.version, "0.30.0", "package-lock.json version");
  assert.ok(appVersion.includes('APP_VERSION = "30.0.0"'), "APP_VERSION");
  assert.ok(installer.includes('$packageVersion   = "0.30.0"'), "installer package version");
  assert.ok(installer.includes('$appVersion       = "30.0.0"'), "installer app version");
  assert.ok(installer.includes('$release          = "v30.0"'), "installer release");
});

test("no stale version strings remain in release-facing files", () => {
  for (const f of ["README.md", "install-v30.0.ps1", "package.json", "package-lock.json",
                   "lib/appVersion.ts", "scripts/engine-tests.mjs", "scripts/verify.sh"]) {
    const text = readFileSync(f, "utf8");
    // the installer legitimately deletes older installers by name; ignore those lines
    const lines = text.split("\n").filter(l => !/Remove-Item.*install-v(28\.[234]|29\.[01])\.ps1/.test(l));
    for (const stale of ["v28.2","v28.3","v28.4","v29.0","v29.1","0.28.2","0.28.3","0.28.4","0.29.0","0.29.1","28.2.0","28.3.0","28.4.0","29.0.0","29.1.0"]) {
      const hit = lines.find(l => l.includes(stale));
      assert.ok(!hit, `${f} still references ${stale}: ${hit}`);
    }
  }
});

test("the old installer is gone and the new one exists", () => {
  assert.ok(!existsSync("install-v28.2.ps1"));
  assert.ok(!existsSync("install-v28.3.ps1"));
  assert.ok(existsSync("install-v30.0.ps1"));
});

test("the installer runs the full verification chain with exit-code checks", () => {
  const ps = readFileSync("install-v30.0.ps1", "utf8");
  for (const cmd of ["npm install", "npm run test:engine", "npm run test:regression",
                     "npm run typecheck", "npm run build"]) {
    assert.ok(ps.includes(cmd), `installer must run "${cmd}"`);
  }
  // every npm invocation must be followed by an exit-code assertion
  const lines = ps.split("\n").map(l => l.trim());
  lines.forEach((line, idx) => {
    if (/^npm (install|run )/.test(line)) {
      const next = lines.slice(idx + 1).find(l => l.length > 0);
      assert.ok(/Assert-LastExitCode/.test(next ?? ""),
        `"${line}" is not followed by an exit-code check`);
    }
  });
  assert.ok(!ps.includes("audit fix --force"), "must not use npm audit fix --force");
  // success banner must come after the build
  assert.ok(ps.lastIndexOf("npm run build") < ps.indexOf("installed and verified"),
    "success banner must follow the build");
});

console.log("\n-- v28.4: lumbar scope confirmation --");

test("scope is a lumbar yes/no/uncertain confirmation, not a region module menu", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("primarily lumbar/lumbosacral?"), "scope confirmation must be present");
  assert.ok(!/options=\{\["not-assessed","lumbar","cervical"/.test(ui),
    "a selectable cervical/thoracic module menu implies modules that do not exist");
});

test("unconfirmed scope blocks the lumbar pathway", () => {
  const c = clearSafety(createDemoCase());
  c.lumbarScopeConfirmed = "not-assessed";
  assert.equal(evaluateCase(c).applicability.treatment, "out-of-scope");
  assert.ok(validateCaseInput(c).some(x => x.id === "scope-unconfirmed" && x.severity === "error"));
});

test("'no' and 'uncertain' both withhold localization and treatment output", () => {
  for (const answer of ["no", "uncertain"]) {
    const c = clearSafety(createDemoCase());
    c.lumbarScopeConfirmed = answer;
    const r = evaluateCase(c);
    assert.equal(r.applicability.treatment, "out-of-scope", `scope=${answer}`);
    assert.equal(r.specialistReview.status, "additional-assessment", `scope=${answer}`);
    assert.ok(validateCaseInput(c).some(x => x.id === "scope-outside" && x.severity === "error"));
  }
});

test("safety screening still functions when the case is out of scope", () => {
  const c = createBlankCase();
  c.lumbarScopeConfirmed = "no";
  c.urinaryRetention = "present";
  assert.equal(evaluateCase(c).urgency, "emergency",
    "an emergency must still escalate for a non-lumbar case");
});

console.log("\n-- v28.4: mode round-trip and snapshot --");

test("switching rapid to comprehensive and back preserves the stored case", () => {
  const full = clearSafety(createDemoCase());
  const before = JSON.stringify(full);
  projectForMode(full, "rapid");
  projectForMode(full, "comprehensive");
  projectForMode(full, "rapid");
  assert.equal(JSON.stringify(full), before, "round-tripping must not mutate stored data");
  // and comprehensive still sees the full picture
  assert.equal(projectForMode(full, "comprehensive").rightSensoryRoot, full.rightSensoryRoot);
});

test("the frozen snapshot does not track later edits", () => {
  const c = clearSafety(createDemoCase());
  const snapshot = structuredClone(c);
  const frozen = evaluateCase(snapshot);
  c.side = "left";                       // clinician keeps editing after generating
  const live = evaluateCase(c);
  assert.notDeepEqual(frozen.concordance, live.concordance,
    "the frozen result must not follow the live form");
  assert.deepEqual(frozen, evaluateCase(snapshot), "the snapshot must remain reproducible");
});

test("the handoff is labelled with a snapshot time", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("Generated from assessment snapshot at"));
});

console.log("\n-- v28.4: do-not-miss prioritization --");

test("alerts are tiered and capped", () => {
  const c = createBlankCase();  // maximally incomplete
  const alerts = buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "rapid");
  assert.ok(alerts.length > 0 && alerts.length <= 6, `expected 1-6 alerts, got ${alerts.length}`);
  for (const a of alerts) assert.ok(["blocking","important","advisory"].includes(a.tier));
  const tiers = alerts.map(a => ({ blocking: 0, important: 1, advisory: 2 })[a.tier]);
  assert.deepEqual(tiers, [...tiers].sort((x, y) => x - y), "alerts must be ordered by tier");
});

test("every alert carries a direct action", () => {
  const c = createBlankCase();
  for (const a of buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "comprehensive")) {
    assert.ok(["Review","Edit","Confirm","Switch to Comprehensive"].includes(a.action), a.action);
  }
});

test("low-value research warnings stay out of the do-not-miss list", () => {
  const c = clearSafety(createDemoCase());
  c.patientGoal = "";                    // produces the advisory goal-missing info issue
  const alerts = buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "comprehensive");
  assert.ok(!alerts.some(a => a.id === "goal-missing"),
    "documentation advisories must not compete with clinical conflicts");
});

test("a severe deficit with limited reliability is surfaced exactly once", () => {
  const c = clearSafety(createDemoCase());
  c.rightAnkleDorsiflexion = "2"; c.examConfidence = "low";
  const alerts = buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "comprehensive");
  const reliability = alerts.filter(a => /reliab/i.test(a.title));
  assert.equal(reliability.length, 1, `expected one reliability alert, got ${reliability.length}`);
  assert.equal(reliability[0].id, "motor-reliability");
});

test("a proposed level without imaging is surfaced as blocking", () => {
  const c = clearSafety(createDemoCase());
  c.proposedProcedure = "decompression"; c.proposedLevels = ["L3-4"];
  const alerts = buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "comprehensive");
  assert.ok(alerts.some(a => a.tier === "blocking" && /L3-4/.test(a.detail)));
});

console.log("\n-- v28.4: conditional evidence --");

test("injection evidence appears only when injection information contributes", () => {
  const none = clearSafety(createDemoCase()); none.injectionResponse = "not-tried";
  none.injectionLevel = "not-applicable"; none.injectionSide = "not-assessed";
  const withInj = clearSafety(createDemoCase());
  const idsNone = evaluateCase(none).ruleTrace.flatMap(r => r.evidenceIds);
  const idsWith = evaluateCase(withInj).ruleTrace.flatMap(r => r.evidenceIds);
  assert.ok(!idsNone.includes("ESI-EVIDENCE"));
  assert.ok(idsWith.includes("ESI-EVIDENCE"));
  assert.ok(idsWith.includes("SNRB-DX"), "a known target cites the level-specificity limitation");
});

test("optimization evidence appears only for risk factors actually recorded", () => {
  const clean = clearSafety(createDemoCase());
  clean.proposedProcedure = "decompression"; clean.proposedLevels = ["L4-5"];
  assert.ok(!evaluateCase(clean).ruleTrace.some(r => r.ruleId === "OPT-001"),
    "no recorded risk factor means no optimization citation");

  const smoker = structuredClone(clean); smoker.smokingStatus = "current";
  const ids = evaluateCase(smoker).ruleTrace.find(r => r.ruleId === "OPT-001").evidenceIds;
  assert.ok(ids.includes("SMOKING-FUSION"));
  assert.ok(!ids.includes("OPIOID-OUTCOME"), "unrecorded factors must not be cited");
});

test("bone-health evidence is cited only for instrumented pathways", () => {
  const decomp = clearSafety(createDemoCase());
  decomp.proposedProcedure = "decompression"; decomp.proposedLevels = ["L4-5"];
  decomp.boneHealth = "osteoporosis";
  assert.ok(!evaluateCase(decomp).ruleTrace.flatMap(r => r.evidenceIds).includes("BONE-INSTRUMENT"),
    "bone-health instrumentation evidence does not apply to decompression alone");
});

test("prior surgery cites revision evidence with the correct wording", () => {
  const c = clearSafety(createDemoCase());
  c.priorSurgeryType = "discectomy";
  const rule = evaluateCase(c).ruleTrace.find(r => r.ruleId === "REV-001");
  assert.ok(rule.evidenceIds.includes("REVISION-DISEASE"));
  assert.ok(/operative history and postoperative anatomy/.test(rule.conclusion));
});

test("the expanded registry keeps full metadata on every entry", () => {
  assert.ok(Object.keys(EVIDENCE_REGISTRY).length >= 25,
    "the registry should cover the active clinical domains");
  for (const [id, item] of Object.entries(EVIDENCE_REGISTRY)) {
    for (const f of ["citation","url","studyType","population","mainFinding",
                     "keyExclusions","applicability","limitations","reviewDate"]) {
      assert.ok(item[f] && String(item[f]).trim(), `${id} missing ${f}`);
    }
  }
});

test("the library is labelled curated, never comprehensive", () => {
  const lib = readFileSync("components/evidence/EvidenceLibrary.tsx", "utf8");
  assert.ok(lib.includes("Curated evidence supporting the current framework"));
  assert.ok(/not comprehensive/i.test(lib));
  assert.ok(!/comprehensive evidence library|exhaustive evidence/i.test(lib));
});

console.log("\n-- v28.4: draft storage and instrumentation --");

test("drafts strip free-text fields that could carry identifiers", () => {
  const c = clearSafety(createDemoCase());
  c.studyId = "MRN-12345"; c.patientGoal = "Jane Doe wants to walk";
  const stripped = stripIdentifiers(c);
  assert.equal(stripped.studyId, "");
  assert.equal(stripped.patientGoal, "");
  assert.equal(stripped.side, c.side, "clinical fields must survive stripping");
  const serialised = JSON.stringify(stripped);
  assert.ok(!serialised.includes("MRN-12345"));
  assert.ok(!serialised.includes("Jane Doe"));
});

test("draft storage is labelled as prototype and makes no compliance claim", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("Prototype local draft storage"));
  assert.ok(ui.includes("Do not enter directly identifying patient information"));
  assert.ok(!/HIPAA[- ]compliant storage(?! unless)/i.test(ui.replace(/not authenticated or HIPAA-compliant storage/g, "")),
    "must not claim HIPAA-compliant storage");
});

test("clearing a draft requires confirmation", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("confirmClear"));
  assert.ok(ui.includes("Discard the saved draft?"));
});

test("instrumentation records counts and timings, not clinical values", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  const metricsType = src.split("export type UsabilityMetrics")[1].split("};")[0];
  for (const f of ["patientGoal","studyId","imagingMatrix","proposedLevels","hba1c"]) {
    assert.ok(!metricsType.includes(f), `metrics must not carry ${f}`);
  }
  assert.ok(metricsType.includes("elapsedSeconds") && metricsType.includes("fieldEdits"));
});

test("no validated time-saving claim is displayed", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(!/saves? (physicians? )?\d+ ?(minutes|min|seconds)/i.test(ui));
});

console.log("\n-- v28.4: entry-burden rules --");

test("conditional fields are not asked before they are relevant", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  // injection target only when a response is recorded
  assert.ok(ui.includes("showInjectionTarget&&"));
  // fusion detail only when a fusion pathway is chosen
  assert.ok(ui.includes("showFusion&&"));
  // prior-surgery complications only once prior surgery is recorded
  assert.ok(ui.includes('data.priorSurgeryType!=="none"&&data.priorSurgeryType!=="not-assessed"&&'));
  // CPAP only when sleep apnoea is recorded
  assert.ok(ui.includes('data.sleepApnea==="present"&&'));
  // HbA1c only when diabetes is recorded
  assert.ok(ui.includes('data.diabetesType!=="none"&&data.diabetesType!=="not-assessed"&&'));
});

test("rapid mode does not expose comprehensive-only instruments", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  const rapidBlocks = ["Rapid orientation","Rapid safety screen","Rapid syndrome check",
                       "Focused motor screen","Rapid imaging confirmation","Optional management context"]
    .map(c => (ui.split(c)[1] ?? "").split("</Card>")[0]).join("");
  for (const banned of ["baselineOdi","baselinePromisPf","baselinePromisPi",
                        "fusionMatrix","frailtyScale","dexTScore","adjudication"]) {
    assert.ok(!rapidBlocks.includes(banned), `rapid mode must not expose ${banned}`);
  }
});

test("comprehensive escalation is suggested, never forced", () => {
  const c = clearSafety(createDemoCase());
  c.priorSurgeryType = "fusion";
  assert.ok(comprehensiveSuggestions(c).some(x => x.includes("prior lumbar surgery")));
  const clean = clearSafety(createDemoCase());
  clean.priorSurgeryType = "none";
  assert.equal(comprehensiveSuggestions(clean).length, 0);
});


console.log("\n-- v29.0: Rapid motor model does not fabricate examination detail --");

test("one L5 observation does not create two graded muscles", () => {
  const c = clearSafety(createBlankCase());
  c.rapidMotorScreen = "present";
  c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L5",
    testedMovement: "ankle-dorsiflexion", lowestObservedGrade: "4", reliability: "objective-reproducible" };
  const graded = ["rightKneeExtension","leftKneeExtension","rightAnkleDorsiflexion","leftAnkleDorsiflexion",
    "rightGreatToeExtension","leftGreatToeExtension","rightPlantarFlexion","leftPlantarFlexion"]
    .filter(k => c[k] !== "not-tested");
  assert.deepEqual(graded, [],
    `a focused screen must not write Comprehensive muscle grades; wrote ${graded.join(", ")}`);
});

test("one side does not create a graded contralateral limb", () => {
  const c = clearSafety(createBlankCase());
  c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "S1",
    testedMovement: "plantar-flexion", lowestObservedGrade: "3", reliability: "objective-reproducible" };
  assert.equal(c.leftPlantarFlexion, "not-tested");
  const r = evaluateCase(c);
  assert.ok(!r.missing.some(x => x.includes("strongest recorded motor deficit is left")));
});

test("the synthesis states the finding is a focused screen, not a full examination", () => {
  const c = clearSafety(createBlankCase());
  c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L5",
    testedMovement: "ankle-dorsiflexion", lowestObservedGrade: "4", reliability: "objective-reproducible" };
  const n = evaluateCase(c).neurologic;
  assert.equal(n.severity, "moderate");
  assert.ok(n.rationale.some(x => /focused screen/i.test(x)));
  assert.ok(n.rationale.some(x => /not a full bilateral examination/i.test(x)));
});

test("rapid reliability is taken from the clinician, never assumed", () => {
  const base = { status: "present", side: "right", suspectedRoot: "L5",
    testedMovement: "ankle-dorsiflexion", lowestObservedGrade: "4" };
  const cases = [["objective-reproducible","high"],["chronic-baseline","moderate"],
                 ["pain-limited","low"],["give-way","low"],["not-assessed","indeterminate"]];
  for (const [given, expected] of cases) {
    const c = clearSafety(createBlankCase());
    c.rapidMotorFinding = { ...base, reliability: given };
    assert.equal(evaluateCase(c).neurologic.reliability, expected, `reliability ${given}`);
  }
});

test("rapid findings stay separate from comprehensive examination data", () => {
  const full = clearSafety(createDemoCase());
  full.rapidMotorFinding = { status: "present", side: "left", suspectedRoot: "L4",
    testedMovement: "knee-extension", lowestObservedGrade: "4", reliability: "pain-limited" };
  const rapid = projectForMode(full, "rapid");
  assert.deepEqual(rapid.rapidMotorFinding, full.rapidMotorFinding, "the focused screen survives");
  assert.equal(rapid.rightAnkleDorsiflexion, "not-tested", "comprehensive grades are excluded");
  assert.equal(full.rightAnkleDorsiflexion, "4", "the stored comprehensive exam is untouched");
});

test("switching modes neither fabricates nor erases examination findings", () => {
  const full = clearSafety(createDemoCase());
  const before = JSON.stringify(full);
  projectForMode(full, "rapid"); projectForMode(full, "comprehensive");
  assert.equal(JSON.stringify(full), before);
});

test("the UI never writes comprehensive muscle fields from the rapid screen", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(!ui.includes("applyRapidMotor"), "the fabricating handler must be gone");
  assert.ok(!/AnkleDorsiflexion` as "rightAnkleDorsiflexion"\] = grade/.test(ui));
  assert.ok(ui.includes("updateRapidMotor"));
  assert.ok(ui.includes("Movement actually tested"));
});

console.log("\n-- v29.0: research export privacy --");

test("the identifier-reduced export actually strips every designated field", () => {
  const c = clearSafety(createDemoCase());
  c.studyId = "MRN-9911"; c.patientGoal = "Jane Doe, walk to church";
  const adj = createBlankAdjudication();
  adj.caseId = "CASE-7"; adj.siteCode = "SITE-A";
  adj.firstReviewer = { ...adj.firstReviewer, reviewerId: "DR-SMITH", rationale: "free text here",
    disagreementReason: "reason text", notes: "note text" };
  const payload = buildExport({ mode: "identifier-reduced", snapshot: c, fullCase: c, result: evaluateCase(c),
    issues: [], adjudication: adj, workflowMode: "comprehensive", suppressed: [],
    appVersion: "29.0.0", rulesetVersion: "r", exportSchemaVersion: "s" });
  const text = JSON.stringify(payload);
  for (const secret of ["MRN-9911","Jane Doe","CASE-7","SITE-A","DR-SMITH",
                        "free text here","reason text","note text"]) {
    assert.ok(!text.includes(secret), `identifier-reduced export leaked "${secret}"`);
  }
  assert.equal(payload.identifierReduced, true);
  assert.equal(payload.formallyDeidentified, false,
    "removing listed fields is not formal de-identification and must not be claimed as such");
  assert.ok(/not formal de-identification/i.test(payload.residualRisk));
  assert.equal(payload.fullEnteredCase, undefined,
    "the unfiltered form state must not ride along in an identifier-reduced export");
  assert.ok(payload.removedFields.length > 0, "removals must be itemised");
});

test("the full export is labelled not de-identified and carries the warning", () => {
  const c = clearSafety(createDemoCase());
  const payload = buildExport({ mode: "full", snapshot: c, fullCase: c, result: null, issues: [],
    adjudication: createBlankAdjudication(), workflowMode: "rapid", suppressed: [],
    appVersion: "29.0.0", rulesetVersion: "r", exportSchemaVersion: "s" });
  assert.equal(payload.identifierReduced, false);
  assert.equal(payload.exportMode, "full");
  assert.ok(FULL_EXPORT_WARNING.includes("approved secure research environment"));
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("FULL_EXPORT_WARNING"), "the warning must be shown before a full export");
  assert.ok(ui.includes("window.confirm"), "the full export needs explicit confirmation");
});

test("no export is described as de-identified", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  const lib = readFileSync("lib/researchExport.ts", "utf8");
  assert.ok(ui.includes("Export research record for secure review"));
  assert.ok(ui.includes("Identifier-reduced research export"));
  for (const src of [ui, lib]) {
    assert.ok(!/de-identified export|Download de-identified|deidentified: true/i.test(src),
      "removing listed fields is not formal de-identification");
  }
});

test("the identifier-reduced export converts exact dates to relative intervals", () => {
  const c = clearSafety(createDemoCase());
  c.priorSurgeryDate = "2019-04-17";
  const payload = buildExport({ mode: "identifier-reduced", snapshot: c, fullCase: c, result: null,
    issues: [], adjudication: createBlankAdjudication(), workflowMode: "comprehensive",
    suppressed: [], appVersion: "a", rulesetVersion: "r", exportSchemaVersion: "s" });
  const text = JSON.stringify(payload);
  assert.ok(!text.includes("2019-04-17"), "an exact date must not be exported verbatim");
  assert.ok(/months before export/.test(payload.assessment.priorSurgeryDate));
});

test("the export modal states included, removed, transformed and residual risk", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const label of ["Removed:", "Transformed:", "Included:", "Residual risk:"]) {
    assert.ok(ui.includes(label), `export review must state "${label}"`);
  }
});

test("the review modal lists exactly what the de-identified export removes", () => {
  const c = clearSafety(createDemoCase());
  c.studyId = "X1";
  const adj = createBlankAdjudication(); adj.caseId = "C1";
  const listed = identifyingFieldsPresent(c, adj);
  assert.ok(listed.some(f => f.includes("studyId")));
  assert.ok(listed.some(f => f.includes("caseId")));
});

console.log("\n-- v29.0: draft storage --");

test("draft storage offers three explicit modes backed by different stores", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  assert.ok(src.includes('export type DraftMode = "off" | "session" | "local"'));
  assert.ok(src.includes("sessionStorage"), "session-only mode must actually use sessionStorage");
  assert.ok(/mode === "session" \? window\.sessionStorage : window\.localStorage/.test(src));
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const opt of ["Do not save", "This session only", "Local draft, 24 hours"]) {
    assert.ok(ui.includes(opt), `draft option "${opt}" missing`);
  }
});

test("switching draft modes does not leave a copy in the other store", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  assert.ok(/\(mode === "local" \? window\.sessionStorage : window\.localStorage\)\.removeItem/.test(src));
});

test("session drafts are not subject to the 24-hour timer", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  assert.ok(/dm === "local" && Date\.now\(\)/.test(src),
    "expiry applies to local drafts; the browser clears session storage itself");
});

test("draft storage is off until explicitly enabled", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("Save your work in this browser?"));
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  assert.ok(/export function saveDraft[\s\S]{0,200}const s = store\(draftMode\(\)\);[\s\S]{0,60}if \(!s\) return null;/.test(src),
    "saveDraft must refuse to write when mode is off");
  assert.ok(/export function loadDraft[\s\S]{0,240}if \(!s\) return null;/.test(src));
});

test("drafts expire", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  assert.ok(src.includes("DRAFT_TTL_MS"));
  assert.ok(/Date\.now\(\) - Date\.parse\(parsed\.savedAt\) > DRAFT_TTL_MS/.test(src),
    "an expired draft must be discarded on read, not resurrected");
});

test("drafts are never auto-restored without an explicit Resume", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("Resume draft"));
  assert.ok(!/setData\(d\.data\)[^}]*\}\s*,\s*\[\]\)/.test(ui),
    "a draft must not be loaded into state on mount");
});

test("adjudication and research notes never enter browser drafts", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  const draftType = src.split("export type Draft")[1].split(";")[0];
  for (const f of ["adjudication", "reviewer", "notes", "rationale"]) {
    assert.ok(!draftType.includes(f), `draft payload must not include ${f}`);
  }
});

test("storage status and a clear control are visible", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("draft-status"));
  assert.ok(ui.includes("Clear draft"));
  assert.ok(ui.includes("Not approved for PHI or shared clinical workstations"));
});

console.log("\n-- v29.0: clinician feedback --");

test("clinician agreement is asked, not assumed", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const opt of ["Agree", "Partly agree", "Disagree", "Unable to assess"]) {
    assert.ok(ui.includes(opt), `feedback option "${opt}" missing`);
  }
  assert.ok(ui.includes("...feedback"), "the recorded values must come from the clinician");
  assert.ok(ui.includes("FEEDBACK_QUESTIONS"));
});

test("feedback covers all three product goals plus impact", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const label of ["Clinical agreement", "Effect on time", "Clinical usefulness",
                       "Handoff usefulness", "Did it change your assessment?"]) {
    assert.ok(ui.includes(label), `feedback question "${label}" missing`);
  }
  for (const opt of ["Saved time", "Added time", "Identified a useful issue",
                     "Produced an irrelevant alert", "Changed urgency", "Changed localization"]) {
    assert.ok(ui.includes(opt), `feedback option "${opt}" missing`);
  }
});

test("metrics stay categorical with no clinical values or free text", () => {
  const src = readFileSync("lib/draftStorage.ts", "utf8");
  const block = src.split("export type UsabilityMetrics")[1].split("};")[0];
  for (const f of ["patientGoal","studyId","imagingMatrix","proposedLevels","hba1c","notes","rationale"]) {
    assert.ok(!block.includes(f), `metrics must not carry ${f}`);
  }
  assert.ok(block.includes("elapsedSeconds") && block.includes("fieldEdits"));
});

console.log("\n-- v29.1: factor-based fusion adjudication --");

test("reviewers document prespecified factors, not an undefined 'established' category", () => {
  const schema = readFileSync("lib/schema.ts", "utf8");
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(!schema.includes('fusionRationale: "established"'),
    "the undefined 'established' category must be gone");
  assert.ok(!/options=\{\["not-entered","established","possible"/.test(ui));
  for (const f of ["dynamic-instability","pseudarthrosis","revision-destabilization",
                   "relevant-deformity","foraminal-height-restoration",
                   "anticipated-destabilizing-decompression",
                   "hardware-failure-or-postoperative-structural","other-prespecified",
                   "insufficient-information"]) {
    assert.ok(schema.includes(f), `fusion factor "${f}" missing from the schema`);
  }
});

test("the factor question is separate from the yes/no/unable judgment", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("Are one or more independent fusion-rationale factors documented?"));
  assert.ok(ui.includes('options={["not-entered","yes","no","unable-to-assess"]'));
  assert.ok(/not a treatment recommendation/i.test(ui));
});

test("review context and blinding fields are captured", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const label of ["Reviewer specialty","Images directly reviewed?","Reviewer saw app output?",
                       "Reviewer saw outcomes?","Confidence: syndrome","Confidence: localization",
                       "Confidence: fusion rationale","Was the available information sufficient?"]) {
    assert.ok(ui.includes(label), `review-context field "${label}" missing`);
  }
  assert.ok(/blind to app output/i.test(ui), "blinding requirement must be stated to the reviewer");
});

console.log("\n-- v29.0: evidence integrity --");

test("no evidence entry claims to be a source it is not", () => {
  const ng59 = EVIDENCE_REGISTRY["NICE-NG59-REDFLAGS"];
  assert.ok(ng59, "NG59 must be present under an accurate ID");
  assert.ok(/does NOT cover/i.test(ng59.keyExclusions),
    "NG59's exclusion of cauda equina and progressive deficit must be recorded");
  assert.ok(!EVIDENCE_REGISTRY["CES-CONSENSUS"],
    "the mislabelled composite cauda equina entry must be gone");
  assert.equal(EVIDENCE_REGISTRY["GIRFT-CES-PATHWAY"].domain, "safety");
});

test("every entry declares a domain and a verification status", () => {
  for (const [id, e] of Object.entries(EVIDENCE_REGISTRY)) {
    assert.ok(e.domain, `${id} has no domain`);
    assert.ok(["verified","unverified"].includes(e.verified), `${id} has no verification status`);
  }
});

test("verified entries carry a verification date", () => {
  for (const [id, e] of Object.entries(EVIDENCE_REGISTRY)) {
    if (e.verified === "verified") assert.ok(e.verifiedOn, `${id} claims verified with no date`);
  }
});

test("safety evidence distinguishes screen content from escalation pathway", () => {
  const c = inScopeBlank(); c.urinaryRetention = "present";
  const ids = evaluateCase(c).ruleTrace.find(r => r.ruleId === "SAFE-001").evidenceIds;
  assert.ok(ids.includes("GIRFT-CES-PATHWAY"));
  assert.ok(!ids.includes("NICE-NG59-REDFLAGS"),
    "a guideline that excludes cauda equina management must not be cited for an emergency conclusion");
});


console.log("\n-- v29.0: field dispositions, scope pathways, UI consolidation --");

test("every previously-inert field has a documented disposition", () => {
  const doc = readFileSync("docs/FIELD_DISPOSITIONS.md", "utf8");
  for (const f of ["clinicianSuspectedRoot","sexAtBirth","plannedSetting",
                   "coughSneezeProvokes","urinaryUrgencyAlone","synovialCyst"]) {
    assert.ok(doc.includes(f), `${f} has no documented disposition`);
  }
});

test("clinician impression is compared with the derived candidate, not fed into it", () => {
  const c = clearSafety(createDemoCase());
  c.clinicianSuspectedRoot = "S1";           // demo derives an L5 candidate
  const r = evaluateCase(c);
  assert.ok(r.targets[0], "a candidate should still be derived");
  assert.ok(r.missing.some(x => /suspected root/i.test(x)),
    "a divergence between impression and derivation must be surfaced");
  // and it must not have changed the derivation itself
  const without = clearSafety(createDemoCase());
  assert.deepEqual(evaluateCase(without).targets[0].root, r.targets[0].root,
    "the clinician's impression must not alter the derived candidate");
});

test("paediatric age blocks adult treatment synthesis but keeps safety documentation", () => {
  const c = clearSafety(createDemoCase());
  c.age = { status: "measured", value: 14 };
  const r = evaluateCase(c);
  assert.equal(r.applicability.treatment, "out-of-scope");
  c.urinaryRetention = "present";
  assert.equal(evaluateCase(c).urgency, "emergency",
    "safety escalation must survive a paediatric out-of-scope case");
});

test("serious pathology is not treated as a generic exclusion", () => {
  const serious = clearSafety(createDemoCase()); serious.knownInfection = "present";
  const population = clearSafety(createDemoCase()); population.pregnant = "present";
  const rs = evaluateCase(serious), rp = evaluateCase(population);
  assert.notDeepEqual(rs.applicability.reasons, rp.applicability.reasons,
    "an infection concern and a pregnancy must not produce the same reason");
  assert.ok(rs.applicability.reasons.some(x => /infection/i.test(x)));
  assert.ok(rp.applicability.reasons.some(x => /pregnan/i.test(x)));
});

test("no major CSS selector is declared twice outside a media query", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const plain = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gs, "");
  const counts = {};
  for (const m of plain.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const sel of m[1].split(",")) {
      const s2 = sel.trim();
      if (s2 && !s2.startsWith("@") && !s2.startsWith("/*")) counts[s2] = (counts[s2] ?? 0) + 1;
    }
  }
  const dupes = Object.entries(counts).filter(([, n]) => n > 1).map(([s2]) => s2);
  assert.deepEqual(dupes, [], `duplicate selector declarations: ${dupes.slice(0, 8).join(", ")}`);
});

test("verified breakpoint screenshots are present in the package", () => {
  for (const bp of ["desktop-1440","tablet-1024","tablet-768","mobile-390"]) {
    assert.ok(existsSync(`docs/screenshots/${bp}-01-default-empty.png`), `missing capture for ${bp}`);
  }
});

test("the verification chain includes visual checks and cannot pass them silently", () => {
  const sh = readFileSync("scripts/verify.sh", "utf8");
  assert.ok(sh.includes("test:visual"));
  assert.ok(sh.includes('fail "visual checks"'));
  assert.ok(sh.includes("SKIP_VISUAL"), "skipping must be explicit");
});


console.log("\n-- v29.1: clinically distinct pathways --");

test("serious pathology is an urgent diagnostic pathway, not a generic exclusion", () => {
  const c = clearSafety(createDemoCase());
  c.feverOrSystemicInfection = "present";
  const r = evaluateCase(c);
  assert.equal(r.applicability.pathway.primary, "serious-pathology");
  assert.equal(r.applicability.treatment, "out-of-scope");
  assert.ok(r.nextSteps.some(x => /[Uu]rgent evaluation/.test(x)),
    "the next action must be escalation, not merely 'outside scope'");
  assert.ok(!r.applicability.reasons.some(x => /outside the current lumbar module/i.test(x)));
});

test("complex postoperative recommends comprehensive without generic exclusion wording", () => {
  const c = clearSafety(createDemoCase());
  c.priorLongFusion = "present";
  const r = evaluateCase(c);
  assert.equal(r.applicability.pathway.primary, "complex-postoperative");
  assert.ok(r.applicability.pathway.recommendsComprehensive);
  assert.ok(r.applicability.reasons.some(x => /prior long fusion/i.test(x)));
  assert.ok(r.nextSteps.some(x => /Comprehensive review/i.test(x)));
  assert.notEqual(r.applicability.treatment, "out-of-scope",
    "a complex postoperative case is not blocked, it is escalated to the right tool");
});

test("outside-localization explains what the module can and cannot assess", () => {
  const c = clearSafety(createDemoCase());
  c.lumbarScopeConfirmed = "no";
  const r = evaluateCase(c);
  assert.equal(r.applicability.pathway.primary, "outside-localization");
  assert.equal(r.applicability.localization, "out-of-scope");
  assert.ok(r.applicability.pathway.findings.some(f => /cannot assess/i.test(f.consequence)));
});

test("special population is not equivalent to serious pathology", () => {
  const pregnancy = clearSafety(createDemoCase()); pregnancy.pregnant = "present";
  const infection = clearSafety(createDemoCase()); infection.feverOrSystemicInfection = "present";
  const rp = evaluateCase(pregnancy), ri = evaluateCase(infection);
  assert.equal(rp.applicability.pathway.primary, "special-population");
  assert.equal(ri.applicability.pathway.primary, "serious-pathology");
  assert.notDeepEqual(rp.applicability.reasons, ri.applicability.reasons);
  assert.notEqual(rp.applicability.treatment, "out-of-scope",
    "pregnancy must not be handled like an infection concern");
  assert.ok(rp.nextSteps.some(x => /obstetric/i.test(x)));
});

test("paediatric age blocks adult synthesis but keeps safety output", () => {
  const c = clearSafety(createDemoCase());
  c.age = { status: "measured", value: 15 };
  const r = evaluateCase(c);
  assert.equal(r.applicability.pathway.primary, "special-population");
  assert.equal(r.applicability.treatment, "out-of-scope");
  assert.ok(r.nextSteps.some(x => /paediatric|pediatric/i.test(x)));
  c.urinaryRetention = "present";
  const emergency = evaluateCase(c);
  assert.equal(emergency.urgency, "emergency");
  assert.equal(emergency.applicability.safety, "available",
    "safety documentation is never withheld by a pathway");
});

test("neuromuscular disease qualifies examination reliability", () => {
  const c = clearSafety(createDemoCase());
  c.neuromuscularDisease = "present";
  const r = evaluateCase(c);
  assert.ok(r.applicability.pathway.qualifiesExamReliability);
  assert.ok(r.applicability.pathway.findings.some(f => /specificity of the neurologic examination/i.test(f.consequence)));
});

test("serious pathology outranks every other pathway", () => {
  const c = clearSafety(createDemoCase());
  c.pregnant = "present"; c.priorLongFusion = "present"; c.cancerWarning = "present";
  assert.equal(evaluateCase(c).applicability.pathway.primary, "serious-pathology");
});


console.log("\n-- v29.1: registry-driven evidence page --");

test("the evidence page renders from the registry, with no hard-coded cards", () => {
  const app = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(app.includes("<EvidenceLibrary/>"));
  assert.ok(!app.includes("literature-grid"), "hard-coded evidence markup must be gone");
  assert.ok(!app.includes("literature-card"));
  const lib = readFileSync("components/evidence/EvidenceLibrary.tsx", "utf8");
  assert.ok(lib.includes("EVIDENCE_REGISTRY"), "the page must read the registry directly");
});

test("there is exactly one source of truth for evidence metadata", () => {
  for (const f of ["components/SpineDecisionApp.tsx", "components/evidence/EvidenceLibrary.tsx"]) {
    const src = readFileSync(f, "utf8");
    // no component may hardcode a citation string
    assert.ok(!/citation:\s*"/.test(src), `${f} declares evidence metadata inline`);
  }
});

test("every filter domain has a label and every entry has a real domain", () => {
  const labels = Object.keys(EVIDENCE_DOMAIN_LABELS);
  for (const [id, e] of Object.entries(EVIDENCE_REGISTRY)) {
    assert.ok(labels.includes(e.domain), `${id} has domain "${e.domain}" with no filter label`);
  }
});

test("unverified entries are visibly marked as pending, not shown as authoritative", () => {
  const lib = readFileSync("components/evidence/EvidenceLibrary.tsx", "utf8");
  assert.ok(lib.includes("Pending verification"));
  assert.ok(/has not been checked against the source document/i.test(lib),
    "a pending entry must carry an explicit caveat");
  const pending = Object.values(EVIDENCE_REGISTRY).filter(e => e.verification === "pending");
  assert.ok(pending.length > 0, "the registry should be honest about what is unverified");
});

test("every entry declares a verification stage", () => {
  const stages = ["source-verified","metadata-verified","summary-verified","mapping-verified","pending"];
  for (const [id, e] of Object.entries(EVIDENCE_REGISTRY)) {
    assert.ok(stages.includes(e.verification), `${id} has no verification stage`);
    if (e.verification !== "pending") {
      assert.ok(e.verifiedOn && e.verifiedBy, `${id} claims verification with no date or reviewer`);
    }
  }
});

test("the evidence page supports search across id, citation and topic", () => {
  const lib = readFileSync("components/evidence/EvidenceLibrary.tsx", "utf8");
  assert.ok(lib.includes("type=\"search\""));
  for (const f of ["e.id", "e.citation", "e.mainFinding", "e.population", "e.studyType"]) {
    assert.ok(lib.includes(f), `search must cover ${f}`);
  }
});

test("case-specific evidence stays capped and conclusion-linked", () => {
  const c = clearSafety(createDemoCase());
  for (const rule of evaluateCase(c).ruleTrace) {
    assert.ok(rule.evidenceIds.length <= 3,
      `rule ${rule.ruleId} cites ${rule.evidenceIds.length} sources; the synthesis caps at 3`);
  }
});


console.log("\n-- v29.1: synthesis has no empty sections --");

test("the next-steps card is not rendered when there is nothing to say", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes('{(result.nextSteps.length>0||result.nonoperative.length>0)&&<Card title="Prioritized next steps"'),
    "an empty next-steps card must not render");
});

test("clinician feedback follows the clinical content", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  const feedback = ui.indexOf('<Card title="Clinician feedback"');
  const concordance = ui.indexOf('<Card title="Concordance map">');
  assert.ok(feedback > concordance,
    "usability capture must not sit between the handoff and the clinical reasoning");
});

test("the visual suite asserts against empty sections", () => {
  const vs = readFileSync("scripts/visual-check.mjs", "utf8");
  assert.ok(/An empty section is a heading with no rendered content/.test(vs));
  assert.ok(vs.includes("result-subsection"), "the check must cover subsections, not just cards");
});

test("the visual suite captures every major screen, not just the entry view", () => {
  const vs = readFileSync("scripts/visual-check.mjs", "utf8");
  for (const screen of ["01-default-empty","03-demo-loaded","09-synthesis",
                        "10-evidence-library","12-research-workspace","13-comprehensive"]) {
    assert.ok(vs.includes(screen), `visual suite must capture ${screen}`);
  }
  for (const bp of ["1440","1024","768","390"]) assert.ok(vs.includes(bp));
});

test("captured screenshots exist for every breakpoint and key screen", () => {
  for (const bp of ["desktop-1440","tablet-1024","tablet-768","mobile-390"]) {
    for (const screen of ["01-default-empty","09-synthesis","10-evidence-library"]) {
      assert.ok(existsSync(`docs/screenshots/${bp}-${screen}.png`),
        `missing capture ${bp}-${screen}`);
    }
  }
});


console.log("\n-- v30.0: canonical motor model --");

test("every view reports the same motor finding", () => {
  const c = clearSafety(createBlankCase());
  c.side = "right"; c.rapidMotorScreen = "present";
  c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L4",
    testedMovement: "knee-extension", lowestObservedGrade: "4", reliability: "give-way" };
  const r = evaluateCase(c);
  const row = r.concordance.find(x => /motor/i.test(x.domain));
  assert.ok(!/not assessed/i.test(row.finding),
    `the map said "${row.finding}" while the reasoning recorded a graded finding`);
  assert.ok(row.finding.includes("knee extension"));
  assert.ok(r.neurologic.rationale.join(" ").includes("knee extension"));
  assert.equal(r.motor.completeness, "focused-screen");
});

test("character of weakness counts as documented reliability", () => {
  const c = clearSafety(createBlankCase());
  c.rapidMotorScreen = "present";
  c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L5",
    testedMovement: "ankle-dorsiflexion", lowestObservedGrade: "4", reliability: "give-way" };
  const r = evaluateCase(c);
  assert.equal(r.motor.reliability, "give-way-inconsistent");
  assert.ok(r.motor.reliabilityDocumented,
    "give-way IS reliability information; reporting it as undocumented is self-contradictory");
  assert.ok(!r.missing.some(x => /reliability is not documented/i.test(x)));
  assert.ok(!validateCaseInput(c).some(x => x.id === "motor-reliability-missing"));
});

test("give-way weakness maps to limited localization contribution", () => {
  const mk = (reliability) => { const c = clearSafety(createBlankCase());
    c.rapidMotorScreen = "present";
    c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L5",
      testedMovement: "ankle-dorsiflexion", lowestObservedGrade: "4", reliability };
    return evaluateCase(c).motor; };
  assert.equal(mk("give-way").localizationContribution, "limited");
  assert.equal(mk("pain-limited").localizationContribution, "limited");
  assert.equal(mk("objective-reproducible").localizationContribution, "supportive");
});

test("reliability is raised exactly once", () => {
  const c = clearSafety(createBlankCase());
  c.rapidMotorScreen = "present";
  c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L4",
    testedMovement: "knee-extension", lowestObservedGrade: "4", reliability: "give-way" };
  const alerts = buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "rapid");
  assert.equal(alerts.filter(a => /reliab/i.test(a.title)).length, 1);
});

console.log("\n-- v30.0: syndrome calibration --");

const syndromeCase = (mut) => { const c = clearSafety(createBlankCase());
  c.side = "right"; c.clinicianPhenotype = "radicular"; c.imagesReviewed = "present";
  c.rapidImagingScreen = "absent"; c.imageQuality = "adequate";
  mut(c); return evaluateCase(c).syndrome.derived; };

test("leg-dominant pain alone does not establish radiculopathy", () => {
  const d = syndromeCase(c => { c.legDominantPain = "present";
    c.dermatomalPain = "absent"; c.straightLegRaise = "negative"; });
  assert.notEqual(d, "radiculopathy-supported", `got ${d}`);
});

test("give-way weakness alone does not establish radiculopathy", () => {
  const d = syndromeCase(c => { c.legDominantPain = "present";
    c.dermatomalPain = "absent"; c.straightLegRaise = "negative";
    c.rapidMotorScreen = "present";
    c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L4",
      testedMovement: "knee-extension", lowestObservedGrade: "4", reliability: "give-way" }; });
  assert.equal(d, "radiculopathy-possible",
    `an unreliable motor finding must not produce a supported conclusion; got ${d}`);
});

test("reproducible weakness plus dermatomal pain does establish radiculopathy", () => {
  const d = syndromeCase(c => { c.legDominantPain = "present"; c.dermatomalPain = "present";
    c.straightLegRaise = "positive"; c.rapidMotorScreen = "present";
    c.rapidMotorFinding = { status: "present", side: "right", suspectedRoot: "L5",
      testedMovement: "ankle-dorsiflexion", lowestObservedGrade: "4",
      reliability: "objective-reproducible" }; });
  assert.equal(d, "radiculopathy-supported", `got ${d}`);
});

test("negative SLR with no dermatomal features is recorded as negative evidence", () => {
  const c = clearSafety(createBlankCase());
  c.clinicianPhenotype = "radicular"; c.legDominantPain = "present";
  c.dermatomalPain = "absent"; c.straightLegRaise = "negative";
  const sy = evaluateCase(c).syndrome;
  assert.ok(sy.rationale.some(x => /explicit negative/i.test(x)),
    "explicit negatives must be stated, not silently ignored");
});

test("claudication without radicular features is not called radiculopathy", () => {
  const d = syndromeCase(c => { c.clinicianPhenotype = "claudication";
    c.legDominantPain = "absent"; c.dermatomalPain = "absent"; c.straightLegRaise = "negative";
    c.standingProvokes = "present"; c.walkingProvokes = "present";
    c.sittingRelieves = "present"; c.flexionRelieves = "present"; c.bicycleBetter = "present"; });
  assert.equal(d, "claudication-supported", `got ${d}`);
});

console.log("\n-- v30.0: synthesis is edited, not repeated --");

test("the same conclusion is not stated twice in the headline panel", () => {
  const c = clearSafety(createBlankCase());
  c.side = "right"; c.clinicianPhenotype = "radicular"; c.legDominantPain = "present";
  c.imagesReviewed = "present"; c.rapidImagingScreen = "absent"; c.imageQuality = "adequate";
  const titles = evaluateCase(c).highlights.map(h => h.title.toLowerCase());
  const localization = titles.filter(t => t.includes("localization"));
  assert.ok(localization.length <= 1,
    `localization stated ${localization.length} times: ${localization.join(" | ")}`);
});

test("missing-information entries are de-duplicated", () => {
  const c = clearSafety(createDemoCase());
  const missing = evaluateCase(c).missing.map(m => m.toLowerCase());
  assert.equal(new Set(missing).size, missing.length, "verbatim duplicates in missing list");
});

console.log("\n-- v30.0: mode state --");

test("there is one canonical activeMode", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(/const activeMode=workflowMode;/.test(ui));
  assert.ok(ui.includes("modeCopy"), "mode descriptions must derive from the canonical mode");
});

test("rapid-only copy is gated on the canonical mode", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  // the confirmation count and rapid descriptors must sit behind activeMode==="rapid"
  assert.ok(/activeMode==="rapid"/.test(ui));
  assert.ok(!ui.includes('workflowMode==="rapid"&&<div className="rapid-status"'),
    "mode-specific rendering must not read a second mode variable");
});

test("product-marketing cards are gone from the active workflow", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  for (const t of ["value-pill", "Save time", "Catch issues"]) {
    assert.ok(!ui.includes(t), `marketing element "${t}" still renders during assessment`);
  }
});

test("mode descriptors match the required wording", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(ui.includes("Focused review"));
  assert.ok(ui.includes("Safety, syndrome, focused motor, and preliminary imaging reconciliation."));
  assert.ok(ui.includes("Detailed review"));
  assert.ok(ui.includes("Full neurologic examination, level-specific imaging, postoperative anatomy"));
});


test("evidence link labels name the destination, never 'Open source'", () => {
  const lib = readFileSync("components/evidence/EvidenceLibrary.tsx", "utf8");
  const ev = readFileSync("lib/evidence.ts", "utf8");
  assert.ok(!/Open source|Open primary source/.test(lib),
    "'Open source' wrongly implies open access");
  for (const label of ["View guideline","View PubMed","View DOI record",
                       "View publisher page","Full text"]) {
    assert.ok(ev.includes(label), `link label "${label}" missing`);
  }
  assert.ok(ev.includes("accessStatus"), "access status must be declarable");
});

test("only manually verified entries carry structured links", () => {
  for (const [id, e] of Object.entries(EVIDENCE_REGISTRY)) {
    if (e.sourceLinks) {
      assert.notEqual(e.verification, "pending",
        `${id} has structured links but is pending verification`);
    }
  }
});


console.log("\n-- v30.0: navigator and layout --");

test("the step navigator reflows and never scrolls horizontally", () => {
  const css = readFileSync("app/globals.css", "utf8");
  // media-query overrides are intentional; only the base declaration must be unique
  const plain = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gs, "");
  const base = plain.match(/(?<![\w.-])\.stepper\s*\{[^}]*\}/g) ?? [];
  assert.equal(base.length, 1, `expected one base .stepper declaration, found ${base.length}`);
  assert.ok(/overflow:visible/.test(base[0]), "the navigator must not be a horizontal scroller");
  assert.ok(/grid-template-columns:repeat\(6/.test(base[0]));
  for (const bp of ["1150", "560"]) {
    // the same max-width may appear in more than one block; scan them all
    const blocks = [...css.matchAll(new RegExp(`@media\\(max-width:${bp}px\\)\\{`, "g"))]
      .map(m => css.slice(m.index, m.index + 500));
    assert.ok(blocks.length > 0, `no ${bp}px breakpoint`);
    assert.ok(blocks.some(b => /\.stepper\{[^}]*grid-template-columns/.test(b)),
      `missing navigator reflow at ${bp}px`);
  }
});

test("the visual suite checks nested containers, not only the page", () => {
  const vs = readFileSync("scripts/visual-check.mjs", "utf8");
  assert.ok(/nested horizontal scroll/.test(vs));
  assert.ok(/textOverflow === "ellipsis"/.test(vs),
    "deliberate truncation must not be reported as a defect");
  for (const w of ["1440", "1280", "1024", "768", "390"]) assert.ok(vs.includes(w), `breakpoint ${w}`);
});

test("mode toggle vocabulary agrees with the step-card vocabulary", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(/switchMode\("rapid"\)}>Rapid</.test(ui));
  assert.ok(/switchMode\("comprehensive"\)}>Comprehensive</.test(ui));
  assert.ok(ui.includes("Rapid safety screen"), "step cards use the same vocabulary");
});

console.log(`\n${passed} regression tests passed\n`);
