# SpineDx-Tx Hybrid AI v12 — 300,000 Synthetic Analogs

This research prototype combines a literature-mapped safety/rules engine with a deterministic synthetic analog simulation.

## What changed in v12

- Default synthetic cohort increased from 5,000 to **300,000 patient-level analog scenarios**.
- Replaced simple score jitter with patient-level phenotype simulation.
- Added cohort composition checks for urgency, concordance, objective deficit, and instability.
- Renamed misleading "confidence" and "closest profile" labels.
- Added explicit simulation audit checks and a model version.
- Added L1 to the root type so L1–2 foraminal/extraforaminal anatomy is represented correctly.
- Retained safety-rule precedence and disabled outcome probabilities.

## Scientific limitation

The 300,000 analogs are generated from transparent assumptions. They are not real patients, do not contain observed treatment outcomes, and do not validate the application. Increasing the simulated cohort reduces Monte Carlo noise but cannot reduce bias in the assumptions.

## Local build

```bash
npm install
npm run build
npm run dev
```

## Deployment

Copy the project contents into the permanent GitHub repository root, run the production build, then commit and push.
