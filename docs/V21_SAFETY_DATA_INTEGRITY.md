# SpineDx-Tx v21 Safety and Data Integrity Release

## Implemented
- Safety-critical findings use explicit present, absent, unknown, or not-assessed states.
- Blank mode resets inherited positive demonstration findings and starts required safety fields as not assessed.
- Emergency logic remains deterministic and uses only explicit present states.
- Safety completeness is reported separately from localization, imaging, and procedure-risk completeness.
- The prior global score threshold is no longer the sole trigger for specialist-review support.
- Research exports contain immutable assessment/result snapshots, an export-schema version, and an identifier-review warning.
- Application, rule-set, package, and export-schema versions are aligned.
- A zero-dependency safety verification script is included.

## Remaining before prospective enrollment
Legacy numeric fields still require full migration to value plus measurement-status objects. Until that migration is complete, zero-valued optional laboratory and outcome fields must not be interpreted as measured normal values. Formal expert adjudication and automated clinical unit tests remain required before prospective clinical use.
