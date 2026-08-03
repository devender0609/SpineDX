# SpineDx-Tx v25

Transparent lumbar clinical–imaging reconciliation and research-adjudication prototype. v25 adds structured capture of independent clinician judgment, second review, adjudicated reference standards, actual treatment, and longitudinal outcomes. It remains a research prototype and is not a validated diagnostic, treatment-selection, risk-prediction, or outcome-prediction tool.

## Verify

```bash
npm install
npm run test:engine
npm run typecheck
npm run build
```

## Research workflow

1. Enter a de-identified clinical case.
2. Record the independent clinician impression before app exposure.
3. Generate the frozen app synthesis.
4. Record second-reviewer and adjudicated labels.
5. Record actual treatment and observed outcomes separately.
6. Export CSV for analysis or complete JSON for audit and reproducibility.

See `docs/current/V25_RESEARCH_DATASET.md`.
