# SpineDx-Tx v27.6.1 responsive layout fix

This patch restores the assessment workflow to a single-column page structure with the step navigator above the form.

## Corrections
- Desktop: six-step full-width navigator.
- Tablet: two rows of three steps.
- Mobile: full-width horizontal step navigation above content.
- Removed accidental narrow sticky sidebar and internal scrollbar.
- Fixed concise-summary urgency rendering (`result.urgency` is a string union, not an object with `label`).
- Shortened orientation helper text and lumbar-module scope wording.
