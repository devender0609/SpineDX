# SpineDx-Tx v20.0.0 — Research-Readiness Build

This build separates the transparent deterministic clinical reconciliation engine from the optional synthetic rule-emulation experiment. It is a research prototype and is not clinically validated.

See `docs/V20_RESEARCH_READINESS.md` and `docs/OUTCOME_DEFINITIONS.md`.

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


## Version 15
Adds the 23-point clinical validation framework described in docs/V15_IMPLEMENTATION_MAP.md.


## Version 16: two-stage results experience

- Full-width assessment form during data entry
- No live clinical synthesis sidebar
- Explicit Generate clinical synthesis action
- Dedicated full-width report view
- Four summary cards for urgency, syndrome, localization, and applicability
- Qualitative target concordance in the primary report
- Numerical reconciliation scores moved into expandable technical details
- Edit inputs action returns to the assessment without losing entered data


## Version 17 guided layout

The assessment is now a five-step guided workflow. Only one focused clinical section is displayed at a time, with a compact stepper, Previous/Continue controls, and the existing separate full-width synthesis. This reduces visual overload without removing clinical fields or validation outputs.


## v19 synthetic model
The research tab includes Synthetic-Rule Surrogate 3.0 trained on 300,000 synthetic records with expanded patient, comorbidity, prior-surgery, procedure, and risk-factor variables. See docs/SURROGATE_MODEL_CARD_V19.md. Outputs are not clinical probabilities.
