import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createBlankCase, createDemoCase } from "../lib/caseFactory.ts";
import { evaluateCase } from "../lib/decisionEngine.ts";
import { validateCaseInput } from "../lib/validation.ts";
import { projectForMode, suppressedFields } from "../lib/modeProjection.ts";
import { EVIDENCE_REGISTRY, getEvidenceList, FRAMEWORK_ONLY_EVIDENCE } from "../lib/evidence.ts";

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`  ok  ${name}`); };

const SAFETY_KEYS = ["urinaryRetention","urinarySensationLoss","urinaryInitiationDifficulty","overflowIncontinence","saddleSensoryChange","bilateralSevereDeficit","progressiveWeakness","feverOrSystemicInfection","cancerWarning","traumaOrFractureWarning"];
const clearSafety = (c) => { for (const k of SAFETY_KEYS) c[k] = "absent"; return c; };

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
  const row = evaluateCase(c).concordance.find(x => x.domain === "Motor examination");
  assert.ok(row.finding.includes("right not graded"), `got: ${row.finding}`);
  assert.ok(!/right 5\/5/.test(row.finding), "must not print a fabricated 5/5");
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
  const c = createBlankCase();
  c.rapidMotorScreen = "absent";
  const r = evaluateCase(c);
  assert.equal(r.neurologic.reliability, "indeterminate",
    "reliability was never documented and must not be assumed 'moderate'");
  assert.ok(r.neurologic.rationale[0].includes("rapid screen"));
  assert.ok(r.neurologic.rationale[0].includes("not"),
    "must state that a complete examination was not performed");
});

test("a documented reliability is still honoured on a negative rapid screen", () => {
  const c = createBlankCase();
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
    createBlankCase(),
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
  const c = createBlankCase();
  c.urinaryRetention = "present";
  assert.equal(evaluateCase(c).urgency, "emergency");
});

test("incomplete safety screening still blocks a routine conclusion", () => {
  const r = evaluateCase(createBlankCase());
  assert.equal(r.urgency, "indeterminate");
  assert.ok(validateCaseInput(createBlankCase()).some(x => x.id === "safety-incomplete" && x.severity === "error"));
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
  const c = createBlankCase();
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
  assert.ok(r.applicability.reasons.includes("known tumor"));
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


test("rapid mode stays within the mandatory-confirmation budget", () => {
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  const cards = ["Rapid orientation","Rapid safety screen","Rapid syndrome check",
                 "Focused motor screen","Rapid imaging confirmation","Rapid treatment context"];
  let mandatory = 0;
  for (const c of cards) {
    const seg = ui.split(c)[1].split("</Card>")[0];
    // conditional branches are rendered inside {cond&&...}; count only unconditional controls
    const withoutBranches = seg.replace(/\{[a-zA-Z.="\s!==&|]*&&<[\s\S]*?\/div>\}/g, "");
    mandatory += (withoutBranches.match(/<StatusField|<Field label=|<MeasurementField/g) || []).length;
  }
  assert.ok(mandatory <= 18,
    `rapid review must stay at or under 18 mandatory confirmations; counted ${mandatory}`);
});

console.log(`\n${passed} regression tests passed\n`);
