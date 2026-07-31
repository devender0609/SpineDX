# SpineDx-Tx staged validation protocol

## Intended use
Structured clinician-facing reconciliation for adult lumbar radiculopathy, degenerative stenosis, and selected low-grade degenerative spondylolisthesis. The system does not read images, make a final diagnosis, estimate causal treatment benefit, or authorize treatment.

## Initial exclusions
Isolated axial pain, high-grade or isthmic slips, major deformity, tumor, infection, trauma, and complex revision surgery remain outside treatment-recommendation scope. Safety escalation may still be displayed.

## Phase 1 — Rule and usability validation
Create 200–300 de-identified expert-authored vignettes. Each case is independently assessed by at least two spine surgeons, one PM&R physician, and one musculoskeletal or neuroradiologist. Adjudicate disagreements before unlocking the test set.

Primary endpoints:
- sensitivity for emergency/urgent cases
- specificity against unsupported level-specific procedures
- agreement on syndrome, level/side/root, decompression review, and independent fusion rationale
- weighted kappa or Fleiss kappa
- completion time, missing-data rate, and System Usability Scale

## Phase 2 — Retrospective consecutive cohort
Freeze the code and rule registry before analysis. Use consecutive eligible clinic patients. Separate development and temporal or external validation cohorts. Report missing data, exclusions, subgroup performance, confusion matrices, calibration for any probabilities, and decision-curve analysis where appropriate.

## Phase 3 — Silent prospective evaluation
Run without displaying recommendations. Record failures, overrides, unsafe outputs, workflow burden, and subgroup disparities. Perform structured error adjudication.

## Phase 4 — Clinical impact study
Use a stepped-wedge or cluster-randomized design after safety and silent prospective milestones are met.

## Required governance
- immutable model and rule version per case
- audit log of inputs, outputs, overrides, and evidence version
- multidisciplinary change control
- predefined stopping rules for unsafe behavior
- no outcome probabilities until trained and calibrated on real patients
