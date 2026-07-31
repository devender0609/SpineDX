# SpineDx Conservative Synthetic-Rule Surrogate v2

This rerun intentionally reduces apparent precision by:

- limiting each tree to depth 4;
- requiring at least 500 records per leaf;
- excluding urgency and the precomputed concordance category;
- evaluating across five independent stratified train/test splits;
- reporting mean, standard deviation, and observed range.

This does not create clinical validity. The labels still originate from deterministic
synthetic rules. The estimates measure how consistently a deliberately simplified model
recovers those synthetic rules.

Use only for engineering comparison, regression testing, and simulation research.
Do not use for patient care or claims of diagnostic, prognostic, or treatment accuracy.
