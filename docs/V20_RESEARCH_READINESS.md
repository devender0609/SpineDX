# SpineDx-Tx v20 research-readiness update

This release implements high-priority reviewer corrections:

- one authoritative application, rule-set, evidence, and synthetic-emulator version;
- blank assessment mode separated from a persistently labeled demonstration case;
- deterministic emergency and clinical rule outputs separated from the optional synthetic rule-emulation experiment;
- the synthetic module is disabled unless a reviewer explicitly enables it;
- procedure-gated risk presentation and fusion-specific gating;
- domain-specific completeness display;
- structured clinician override categories;
- de-identified export provenance, missingness, versions, and clinician review;
- sex-at-birth field for clinically applicable interpretation and future fairness evaluation;
- stronger validation blocks for unentered age, BMI, image review, imaging matrix, patient goal, and low-confidence examination.

## Remaining limitation
Several numeric fields still use zero as the legacy UI placeholder. v21 should migrate these fields to explicit `known / unknown / not measured / not applicable` states and nullable values before real-patient data collection. The synthetic experiment must not be interpreted as clinical validation.
