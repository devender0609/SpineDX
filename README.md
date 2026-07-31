# SpineDx-Tx Clinical Framework v13

Research prototype for structured lumbar clinical–imaging reconciliation.

## Major v13 changes
- bilateral muscle and reflex documentation
- weakness quality and trajectory
- functional heel/toe testing
- claudication provocation/relief characterization
- neuropathy, hip, and vascular competing-source prompts
- direct-image-review, image-quality, and level-by-level imaging governance
- expanded deformity, collapse, stability, and facet-resection data
- expanded injection details
- more specific bladder safety screening
- isolated axial pain locked out of operative recommendations
- prior surgery and deformity no longer treated as stand-alone fusion rationales
- synthetic module relabeled as rule-sensitivity simulation
- rule registry, validation protocol, and safety-test cases included

## Scientific status
This is not a trained or validated clinical AI model. The Monte Carlo module is for rule sensitivity and software stress testing only. It does not represent observed patients or predict treatment benefit.

## Local build
```powershell
npm install
npm run build
```


## Version 14: conservative synthetic-rule surrogate

This build adds an in-browser TypeScript implementation of the capacity-limited
synthetic-label surrogate v2. The five shallow decision trees were trained on
240,000 synthetic records and assessed on 60,000 synthetic records with repeated
holdout evaluation.

The displayed tree scores are synthetic-rule outputs, not probabilities of treatment
benefit, need for surgery, or clinical outcomes. The detailed v13 clinical form is
mapped into the smaller training schema, and mapping limitations are shown in the UI.
