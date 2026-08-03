# SpineDx-Tx v25 Research Dataset and Adjudication Release

## Purpose
This release converts the application into a structured research data-collection platform while preserving the transparent rule engine. It does not train or update a clinical model.

## New research variables
- Study case ID and site code
- Independent clinician syndrome, root, level, zone, urgency, and plan
- Second-reviewer assessment
- Adjudicated reference standard
- Actual treatment and procedure
- 30-day complication and 90-day readmission
- 6- and 12-month ODI and leg-pain outcomes
- Clinician agreement and structured override

## Design safeguards
Independent clinician judgments, adjudicated labels, actual treatment, and outcomes are stored separately. Historical treatment is not treated as ground truth. The application and rule versions are exported with every record. Free-text exports require identifier review.

## Recommended study workflow
1. Enter the clinical case.
2. Record the independent clinician assessment before viewing the app synthesis.
3. Generate the locked app result.
4. Obtain a second reviewer where available.
5. Adjudicate disagreements using a prespecified multidisciplinary process.
6. Record actual treatment and longitudinal outcomes separately.
7. Freeze the app during formal validation.
