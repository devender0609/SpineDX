# SpineDx-Tx v23 — Schema and Rule Integrity

## Implemented
- Nullable numeric inputs for demographics, PROMs, laboratory values, imaging measurements, treatment response, and planned procedure extent.
- Explicit `not-assessed` states for key categorical variables.
- Legacy duplicate safety booleans removed from the clinical schema.
- Blank cases use null/missing states rather than zero or false clinical assumptions.
- Missing age is no longer interpreted as pediatric.
- Untested motor findings remain unavailable during localization and are listed as missing evidence.
- Synthetic research modules map nulls only inside the research-only adapter and cannot control deterministic safety logic.
- Expanded executable tests cover blank-case missingness, emergency status, progressive weakness, missing age, and untested motor localization.

## Remaining limitations
- Candidate ranking weights remain developmental and require multidisciplinary expert adjudication.
- Fusion findings still require a future level-specific schema.
- The synthetic emulator remains research-only and should be removed from the expert-validation deployment branch.
