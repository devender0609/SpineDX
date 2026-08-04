import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createBlankCase, createDemoCase } from "../lib/caseFactory.ts";
import { evaluateCase } from "../lib/decisionEngine.ts";
import { validateCaseInput } from "../lib/validation.ts";
import { projectForMode, suppressedFields } from "../lib/modeProjection.ts";
import { EVIDENCE_REGISTRY, getEvidenceList, FRAMEWORK_ONLY_EVIDENCE } from "../lib/evidence.ts";
import { RAPID_REQUIREMENTS, outstandingRapidRequirements, comprehensiveSuggestions } from "../lib/rapidRequirements.ts";
import { buildPriorityAlerts } from "../lib/priorityAlerts.ts";
import { stripIdentifiers, DRAFT_STORAGE_KEY } from "../lib/draftStorage.ts";

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
  assert.ok(RAPID_REQUIREMENTS.length >= 12 && RAPID_REQUIREMENTS.length <= 18,
    `rapid review must sit within 12-18 mandatory confirmations; the list defines ${RAPID_REQUIREMENTS.length}`);
});

test("the outstanding counter reaches zero only when every requirement is answered", () => {
  const blank = createBlankCase();
  assert.equal(outstandingRapidRequirements(blank).length, RAPID_REQUIREMENTS.length,
    "a blank case must show every confirmation as outstanding");
  const done = clearSafety(createDemoCase());
  done.priorSurgeryType = "none"; done.proposedProcedure = "none";
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
  const installer = readFileSync("install-v28.4.ps1", "utf8");
  assert.equal(pkg.version, "0.28.4", "package.json version");
  assert.equal(lock.version, "0.28.4", "package-lock.json version");
  assert.ok(appVersion.includes('APP_VERSION = "28.4.0"'), "APP_VERSION");
  assert.ok(installer.includes('$packageVersion   = "0.28.4"'), "installer package version");
  assert.ok(installer.includes('$appVersion       = "28.4.0"'), "installer app version");
  assert.ok(installer.includes('$release          = "v28.4"'), "installer release");
});

test("no stale version strings remain in release-facing files", () => {
  for (const f of ["README.md", "install-v28.4.ps1", "package.json", "package-lock.json",
                   "lib/appVersion.ts", "scripts/engine-tests.mjs", "scripts/verify.sh"]) {
    const text = readFileSync(f, "utf8");
    // the installer legitimately deletes older installers by name; ignore those lines
    const lines = text.split("\n").filter(l => !/Remove-Item.*install-v28\.[23]\.ps1/.test(l));
    for (const stale of ["v28.2", "v28.3", "0.28.2", "0.28.3", "28.2.0", "28.3.0"]) {
      const hit = lines.find(l => l.includes(stale));
      assert.ok(!hit, `${f} still references ${stale}: ${hit}`);
    }
  }
});

test("the old installer is gone and the new one exists", () => {
  assert.ok(!existsSync("install-v28.2.ps1"));
  assert.ok(!existsSync("install-v28.3.ps1"));
  assert.ok(existsSync("install-v28.4.ps1"));
});

test("the installer runs the full verification chain with exit-code checks", () => {
  const ps = readFileSync("install-v28.4.ps1", "utf8");
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

test("a severe deficit with limited reliability is surfaced", () => {
  const c = clearSafety(createDemoCase());
  c.rightAnkleDorsiflexion = "2"; c.examConfidence = "low";
  const alerts = buildPriorityAlerts(evaluateCase(c), validateCaseInput(c), "comprehensive");
  assert.ok(alerts.some(a => a.id === "severe-deficit-low-reliability"));
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
  const ui = readFileSync("components/SpineDecisionApp.tsx", "utf8");
  assert.ok(/[Cc]urated/.test(ui));
  assert.ok(!/comprehensive evidence library|exhaustive evidence/i.test(ui));
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
                       "Focused motor screen","Rapid imaging confirmation","Rapid treatment context"]
    .map(c => ui.split(c)[1].split("</Card>")[0]).join("");
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

console.log(`\n${passed} regression tests passed\n`);
