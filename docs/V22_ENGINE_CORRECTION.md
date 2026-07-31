# SpineDx-Tx v22 Engine-Correction Release

Version: 22.0.0  
Rule set: LUMBAR-RULESET-1.2.0  
Export schema: 3.0.0

## Implemented corrections

- Blank cases are created by a schema-neutralizing factory that discards all demonstration values.
- Untested motor, sensory, and reflex findings are no longer interpreted as normal or abnormal.
- Neurologic severity can be `indeterminate` when the examination is insufficient.
- Emergency and progressive-weakness logic uses explicit four-state safety fields.
- Unknown or not-assessed safety findings produce an incomplete safety statement rather than a false negative screen.
- Safety uncertainty no longer blocks generation of a limited report.
- Clinician-entered suspected root is not used to rank candidate targets.
- Candidate ranking now uses tested motor findings, sensory findings, tension signs, laterality, imaging severity, root deformation, and competing sources.
- Central stenosis is represented as a multiroot target rather than a forced single-root target.
- The remaining numerical score threshold was removed from operative-option generation; explicit minimum evidence is required.
- Executable engine tests verify blank-case neutrality, indeterminate untested examination, urinary-retention emergency behavior, and progressive-weakness urgency.

## Known limitations

Legacy numeric fields still use zero as an unentered value. They must be migrated to nullable measurement objects before prospective patient enrollment. Fusion rationale also requires a future level-specific evidence structure. The synthetic emulator remains research-only and does not control emergency or deterministic clinical outputs.
