import assert from "node:assert/strict";
import { createBlankCase, createDemoCase, measured } from "../lib/caseFactory.ts";
import { evaluateCase } from "../lib/decisionEngine.ts";
import { validateCaseInput } from "../lib/validation.ts";

const blank=createBlankCase();
assert.equal(blank.primaryRegion,"lumbar");
assert.equal(blank.standingProvokes,"not-assessed");
assert.equal(blank.smokingStatus,"not-assessed");
assert.equal(blank.age.value,null);
assert.equal(blank.age.status,"not-measured");
let r=evaluateCase(blank);
assert.equal(r.urgency,"indeterminate");
assert.equal(r.neurologic.severity,"indeterminate");
assert.equal(r.targets.length,0);

const emergency=createBlankCase();
emergency.urinaryRetention="present";
r=evaluateCase(emergency);
assert.equal(r.urgency,"emergency");

const urgent=createBlankCase();
for(const k of ["urinaryRetention","urinarySensationLoss","urinaryInitiationDifficulty","overflowIncontinence","saddleSensoryChange","bilateralSevereDeficit","feverOrSystemicInfection","cancerWarning","traumaOrFractureWarning"]) urgent[k]="absent";
urgent.progressiveWeakness="present";
r=evaluateCase(urgent);
assert.equal(r.urgency,"urgent");

const incidental=createDemoCase();
incidental.dermatomalPain="absent"; incidental.legDominantPain="absent"; incidental.straightLegRaise="negative";
incidental.rightAnkleDorsiflexion="5"; incidental.rightGreatToeExtension="5"; incidental.rightSensoryRoot="none";
r=evaluateCase(incidental);
assert.equal(r.targets.length,0,"Severe imaging without clinical support must not create a target");

const demo=createDemoCase();
r=evaluateCase(demo);
assert.equal(r.urgency,"routine");
assert.equal(r.targets[0]?.root,"L5");
assert.equal(r.targets[0]?.level,"L4-5");
assert.ok(["radiculopathy-supported","mixed"].includes(r.syndrome.derived));

const wrongLevelFusion=createDemoCase();
wrongLevelFusion.proposedProcedure="decompression-fusion";
wrongLevelFusion.proposedLevels=["L4-5"];
const l23=wrongLevelFusion.fusionMatrix.find(x=>x.level==="L2-3");
l23.dynamicInstability="present";
r=evaluateCase(wrongLevelFusion);
assert.notEqual(r.fusion.status,"factors-documented","Instability at another level must not establish fusion at L4-5");

const sameLevelFusion=createDemoCase();
sameLevelFusion.proposedProcedure="decompression-fusion";
sameLevelFusion.proposedLevels=["L4-5"];
const l45=sameLevelFusion.fusionMatrix.find(x=>x.level==="L4-5");
l45.dynamicInstability="present"; l45.foraminalCollapse="present"; l45.plannedFacetResectionPercent=measured(60,"%"); l45.revisionDestabilization="absent"; l45.pseudarthrosis="absent"; l45.relevantDeformity="absent";
r=evaluateCase(sameLevelFusion);
assert.equal(r.fusion.status,"factors-documented");

const missingLab=createDemoCase();
missingLab.proposedProcedure="fusion"; missingLab.proposedLevels=["L4-5"]; missingLab.diabetesType="type-2"; missingLab.hba1c={value:null,status:"not-measured",unit:"%"};
r=evaluateCase(missingLab);
assert.ok(r.risk.patientSpecific.some(x=>x.includes("HbA1c is unavailable")));

const invalidPain=createDemoCase();
invalidPain.legPainNrs=measured(14,"0-10");
assert.ok(validateCaseInput(invalidPain).some(x=>x.id==="legPainNrs-range"&&x.severity==="error"));

const fusionWithoutLevel=createDemoCase();
fusionWithoutLevel.proposedProcedure="fusion";
fusionWithoutLevel.proposedLevels=[];
assert.ok(validateCaseInput(fusionWithoutLevel).some(x=>x.id==="fusion-level-missing"&&x.severity==="error"));

const contradictoryHistory=createDemoCase();
contradictoryHistory.priorSurgeryType="none";
contradictoryHistory.priorPseudarthrosis="present";
assert.ok(validateCaseInput(contradictoryHistory).some(x=>x.id==="surgery-history-conflict"&&x.severity==="error"));

const sideMismatch=createDemoCase();
sideMismatch.side="left";
assert.ok(validateCaseInput(sideMismatch).some(x=>x.id==="side-mismatch-left"&&x.severity==="warning"));

const incompleteSafety=createDemoCase();
incompleteSafety.urinaryRetention="not-assessed";
assert.ok(validateCaseInput(incompleteSafety).some(x=>x.id==="safety-incomplete"&&x.severity==="error"));

// Scope is now governed by an explicit lumbar confirmation rather than a region menu.
const outOfScope=createDemoCase();
outOfScope.lumbarScopeConfirmed="no";
assert.ok(validateCaseInput(outOfScope).some(x=>x.id==="scope-outside"&&x.severity==="error"));
assert.equal(evaluateCase(outOfScope).applicability.treatment,"out-of-scope");
const unconfirmed=createDemoCase();
unconfirmed.lumbarScopeConfirmed="not-assessed";
assert.ok(validateCaseInput(unconfirmed).some(x=>x.id==="scope-unconfirmed"&&x.severity==="error"));

const injectionMissing=createDemoCase();
injectionMissing.injectionResponse="brief";
injectionMissing.injectionLevel="unknown";
injectionMissing.injectionSide="not-assessed";
const injectionIssues=validateCaseInput(injectionMissing);
assert.ok(injectionIssues.some(x=>x.id==="injection-level-missing"));
assert.ok(injectionIssues.some(x=>x.id==="injection-side-missing"));

const injectionComplete=createDemoCase();
injectionComplete.injectionResponse="meaningful-temporary";
injectionComplete.injectionLevel="L4-5";
injectionComplete.injectionSide="right";
assert.ok(!validateCaseInput(injectionComplete).some(x=>x.id==="injection-level-missing"||x.id==="injection-side-missing"));


const trajectoryConflict=createDemoCase();
trajectoryConflict.progressiveWeakness="absent";
trajectoryConflict.weaknessTrajectory="progressive";
assert.ok(validateCaseInput(trajectoryConflict).some(x=>x.id==="trajectory-safety-conflict"&&x.severity==="error"));
r=evaluateCase(trajectoryConflict);
assert.equal(r.urgency,"indeterminate");
assert.ok(r.missing.some(x=>x.includes("progressive weakness")));

const unsupportedProposedLevel=createDemoCase();
unsupportedProposedLevel.proposedProcedure="decompression";
unsupportedProposedLevel.proposedLevels=["L3-4"];
assert.ok(validateCaseInput(unsupportedProposedLevel).some(x=>x.id==="proposed-level-L3-4-imaging-missing"&&x.severity==="error"));

const noFusionEvidence=createDemoCase();
noFusionEvidence.proposedProcedure="decompression";
r=evaluateCase(noFusionEvidence);
assert.ok(!r.ruleTrace.some(x=>x.ruleId==="FUS-001"));
assert.ok(!r.highlights.some(x=>x.ruleId==="FUS-001"));
assert.equal(r.concordance.length,5);


const rapidNoMotor=createBlankCase();
rapidNoMotor.rapidMotorScreen="absent";
r=evaluateCase(rapidNoMotor);
assert.equal(r.neurologic.severity,"none");
assert.ok(r.neurologic.rationale.some(x=>x.includes("rapid screen")));
// the screen result must explicitly deny being a complete examination
assert.ok(r.neurologic.rationale.some(x=>x.includes("not")&&x.includes("complete neurologic examination")));

const rapidNoImaging=createDemoCase();
rapidNoImaging.rapidImagingScreen="absent";
rapidNoImaging.levelByLevelDocumented="absent";
rapidNoImaging.imagingMatrix=createBlankCase().imagingMatrix;
r=evaluateCase(rapidNoImaging);
assert.ok(r.concordance.some(x=>x.domain==="Imaging"&&x.finding.includes("No potentially relevant compressive finding")));
assert.ok(r.ruleTrace.find(x=>x.ruleId==="LOC-001")?.evidenceIds.length===0);

const noBenefit=createDemoCase();
noBenefit.injectionResponse="none";
r=evaluateCase(noBenefit);
assert.ok(r.nonoperative.some(x=>x.includes("produced no benefit")));
assert.ok(!r.nonoperative.some(x=>x.startsWith("A targeted injection may be discussed")));

console.log("v31.0 engine and validation tests passed");
