# Data Validation Specification — v27

## Severity levels

- **Blocking error:** impossible or internally contradictory data. Synthesis is disabled.
- **Important warning:** unusual, discordant, or incomplete data. Clinician acknowledgment is required.
- **Advisory:** optional information that may improve interpretation.

## Implemented checks

### Range checks
Age, pain NRS, symptom duration, walking distance, imaging age, exercise duration, HbA1c, BMI, hemoglobin, albumin, frailty, DEXA T-score, opioid MME, translation, angular motion, and facet-resection percentage.

### Context checks
Measured status/value consistency; procedure-level requirements; exercise duration only when exercise occurred; injection target when response is recorded; fusion-specific assessment only when fusion is proposed.

### Cross-field checks
Safety warning versus elective plan; progressive weakness versus examination trajectory; image-review status versus detailed imaging; symptom/imaging laterality; smoking/nicotine consistency; diabetes/HbA1c consistency; prior surgery versus prior complications; bone-health review for fusion pathways.

The application does not automatically overwrite clinical data. It flags the issue and requires correction or acknowledgment.
