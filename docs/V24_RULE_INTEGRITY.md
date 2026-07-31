# SpineDx-Tx v24 — Rule Integrity Release

Version: 24.0.0  
Rule set: LUMBAR-RULESET-1.4.0

## Implemented

1. Added indeterminate urgency for incomplete emergency screens.
2. Added feature-supported radiculopathy and claudication syndrome labels.
3. Added a minimum clinical-evidence gate before imaging targets can be ranked.
4. Added patellar-reflex support for L4 and Achilles-reflex support for S1.
5. Removed visible concordance categories derived from unvalidated numerical cutoffs.
6. Changed structured smoking and diabetes fields to the authoritative risk inputs.
7. Added an unable-to-assess fusion conclusion when instability, collapse, or facet-resection data are unknown.
8. Relabeled general procedural complications as non-individualized educational considerations.
9. Expanded executable tests for imaging-only cases, incomplete urgency, reflex localization, diabetes missingness, and fusion uncertainty.

## Remaining limitations

- Several ordinary yes/no clinical fields remain booleans and therefore cannot fully distinguish absent from not assessed.
- Fusion variables are not yet stored level by level.
- The upper-lumbar localization framework requires formal multidisciplinary review.
- The synthetic emulator remains research-only and should be excluded from the future expert-validation distribution.
- Full clinical validity requires independent adjudication using real or de-identified cases.
