# v18 Patient & Procedure Risk Module

This release expands structured collection for nicotine exposure, diabetes, frailty, cardiopulmonary disease, renal disease, nutrition/anemia, bone health, opioid exposure, prior spine surgery/complications, and proposed procedure details.

## Output policy

The module produces evidence-informed optimization and applicability flags only. It does not calculate individualized complication, nonunion, readmission, discharge, or patient-reported outcome probabilities. Numerical risk estimates remain disabled until models are trained and calibrated on real patients with observed outcomes and externally validated.

## Separation of concepts

1. Clinical/anatomic appropriateness
2. Modifiable optimization factors
3. Procedure-specific perioperative risk
4. Prior-surgery technical complexity

A risk factor does not independently establish an indication for surgery or fusion.
