# SpineDx-Tx v27.6 clinical outcomes and UI audit

## Purpose
This release reduces clinician-facing technical clutter, adds optional baseline patient-reported outcomes, improves imaging-source semantics, and separates clinical evidence from technical rule traceability.

## Clinical changes
- Added optional baseline ODI, PROMIS Physical Function, and PROMIS Pain Interference.
- PROMs provide longitudinal disability/function context only; they do not determine urgency, localization, or treatment.
- Removed the redundant imaging-availability field from Orientation.
- Replaced the binary imaging-source wording with direct-image review, report-only/no direct review, unknown, and not assessed states.
- Removed empty "None documented" lines unless an empty state is clinically useful.
- Added copy-summary and print/save-PDF actions.

## Evidence architecture
- The clinician synthesis shows concise conclusions and supporting evidence IDs without technical rule IDs.
- Technical rule IDs remain in the research workspace.
- The evidence library now includes radiculopathy guidance, low-back-pain/sciatica guidance, NORDSTEN-DS, ODI psychometrics, PROMIS validity, and transparent validation resources.

## Data validation
- ODI hard range: 0-100.
- PROMIS T-score hard data-integrity range: 0-100; values outside 20-80 generate a confirmation warning.
- These are data-quality checks, not universal clinical thresholds.

## Verification
- Engine and validation test suite passed.
- TypeScript/TSX syntax transpilation passed.
- Full local Next.js typecheck/build is enforced by install-v27.6.ps1.
