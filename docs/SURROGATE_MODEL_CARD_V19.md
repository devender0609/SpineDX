# SpineDx Synthetic-Rule Surrogate 3.0 (v19)

Trained on 300,000 entirely synthetic records (240,000 training; 60,000 holdout) to reproduce explicitly programmed synthetic labels. This is for software testing, research workflow development, and sensitivity analysis only.

## New variables
Smoking/nicotine, BMI, diabetes/HbA1c/insulin, frailty, nutrition/hemoglobin/albumin, bone health, opioid and psychosocial factors, cardiopulmonary/renal/thromboembolic comorbidities, prior surgery and complications, planned procedure/levels/revision/setting.

## Targets
Five pathway classifications plus six research-only risk classifications: optimization needed, perioperative medical concern, fusion-healing concern, infection concern, non-home discharge concern, and persistent-opioid concern.

## Model
Eleven independent shallow decision trees (maximum depth 5; minimum leaf 750; balanced class weighting).

## Critical limitation
Performance on the synthetic holdout measures agreement with the synthetic data-generating assumptions. Scores are not clinical probabilities, treatment-benefit estimates, or validated individualized risks. Real clinical use requires real observed outcomes, calibration, external validation, subgroup analysis, and governance review.
