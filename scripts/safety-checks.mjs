import fs from 'node:fs';
const engine=fs.readFileSync('lib/decisionEngine.ts','utf8');
const app=fs.readFileSync('components/SpineDecisionApp.tsx','utf8');
const checks=[
 ['tri-state safety type', engine.includes('ClinicalStatus = "present" | "absent" | "unknown" | "not-assessed"')],
 ['emergency uses explicit present status', engine.includes('urinaryRetentionStatus') && engine.includes('.includes("present")')],
 ['safety completeness exported', engine.includes('export function safetyCompleteness')],
 ['synthetic model not used for emergency', !/runConservativeSurrogate[\s\S]{0,1200}urgency=/.test(app)],
 ['blank case starts safety not assessed', app.includes('urinaryRetentionStatus:"not-assessed"')],
 ['identifier warning in export', app.includes('Review free-text fields for identifiers before sharing')],
 ['score 55 removed from surgical consultation', !engine.includes('top.score>=55&&(i.symptomDurationWeeks')]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok) failed++;}
if(failed) process.exit(1);
