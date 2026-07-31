# SpineDx-Tx v23

Transparent lumbar clinical–imaging reconciliation research prototype. v23 focuses on explicit missingness, schema integrity, deterministic safety logic, and executable engine tests. It is not a validated diagnostic, treatment-selection, risk-prediction, or outcome-prediction tool.

## Verify

```bash
npm install
npm run test:engine
npm run typecheck
npm run build
```

See `docs/V23_SCHEMA_RULE_INTEGRITY.md`.


## v24 rule-integrity release

- Incomplete emergency screening now produces **indeterminate urgency**, not routine urgency.
- Syndrome labels are supported by entered clinical features rather than simply repeating the selected phenotype.
- Severe imaging alone cannot create a ranked clinical target.
- Patellar and Achilles reflexes contribute to L4 and S1 localization respectively.
- Visible target output is ordinal rank only; research scores remain in technical details.
- Smoking and diabetes risk logic uses the structured categorical fields as the authoritative source.
- Fusion output includes an explicit unable-to-assess state when key variables are unknown.
- General procedural risks are labeled as non-individualized educational considerations.
