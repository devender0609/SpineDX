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

const cervical=createDemoCase();
cervical.primaryRegion="cervical";
assert.ok(validateCaseInput(cervical).some(x=>x.id==="region-outside"&&x.severity==="error"));

console.log("v27.1 engine and validation tests passed");
