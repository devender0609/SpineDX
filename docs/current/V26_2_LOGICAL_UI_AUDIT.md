# SpineDx-Tx v26.2 Logical UI Audit

## Purpose
This release corrects mismatches between clinical questions and their available responses. It does not add new clinical claims.

## Changes
- Replaced raw internal values (`present`, `absent`) with clinician-facing labels (`Yes`, `No`, `Unknown`, `Not assessed`).
- Added `Not applicable` only where clinically meaningful.
- Removed the editable Pediatric field. Adult scope is derived from measured age.
- Reworded all initial-scope questions as explicit clinical questions.
- Added contextual help for pregnancy applicability.
- Converted validation-review categorical free-text boxes to controlled dropdowns.
- Humanized option labels throughout the interface.
- Shows fusion assessment only when fusion is being considered.
- Added units and clearer missingness labels to measurement controls.
- Retained raw coded values in research exports for reproducibility.

## Clinical interpretation
- **Yes** means the clinician has established that the finding is present.
- **No** means the clinician has assessed and documented the finding as absent.
- **Unknown** means the question was addressed but the answer cannot be determined.
- **Not assessed** means the question has not yet been evaluated.
- **Not applicable** is available only when the concept does not apply to the patient or pathway.

## Important limitation
This release improves data semantics and usability. It does not replace evidence review, expert adjudication, or clinical validation.
