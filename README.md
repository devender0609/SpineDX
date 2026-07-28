# SpineDx-Tx Professional v8

A physician-facing lumbar clinical reconciliation prototype with a streamlined four-step workflow and a concise, evidence-linked synthesis.

## Design changes
- Four-stage workflow instead of six long stacked forms
- Sticky navigation and summary workspace
- Assessment, Management, and Evidence tabs
- Important actions shown first; detailed content is collapsible
- Surgical strategies, prerequisites, fusion considerations, risks, and optimization retained
- Mobile and print layouts

## Important limitation
This is a research and documentation prototype. It is not a diagnosis, treatment recommendation, surgical authorization tool, or substitute for direct clinician review of the patient and imaging.

## Run
```bash
npm install
npm run build
npm run dev
```


## v8 workflow change
The synthesis action is available only on the final Safety & Planning step. Earlier steps use Back/Continue navigation, and the results panel appears only after a complete four-step submission.
