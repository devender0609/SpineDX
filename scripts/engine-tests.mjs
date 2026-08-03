import assert from "node:assert/strict";
import { createBlankCase, createDemoCase, measured } from "../lib/caseFactory.ts";
import { evaluateCase } from "../lib/decisionEngine.ts";

const blank=createBlankCase();
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
assert.notEqual(r.fusion.status,"established","Instability at another level must not establish fusion at L4-5");

const sameLevelFusion=createDemoCase();
sameLevelFusion.proposedProcedure="decompression-fusion";
sameLevelFusion.proposedLevels=["L4-5"];
const l45=sameLevelFusion.fusionMatrix.find(x=>x.level==="L4-5");
l45.dynamicInstability="present"; l45.foraminalCollapse="present"; l45.plannedFacetResectionPercent=measured(60,"%"); l45.revisionDestabilization="absent"; l45.pseudarthrosis="absent"; l45.relevantDeformity="absent";
r=evaluateCase(sameLevelFusion);
assert.equal(r.fusion.status,"established");

const missingLab=createDemoCase();
missingLab.proposedProcedure="fusion"; missingLab.proposedLevels=["L4-5"]; missingLab.diabetesType="type-2"; missingLab.hba1c={value:null,status:"not-measured",unit:"%"};
r=evaluateCase(missingLab);
assert.ok(r.risk.patientSpecific.some(x=>x.includes("HbA1c is unavailable")));

console.log("v26 engine tests passed");
