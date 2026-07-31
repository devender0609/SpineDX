# SpineDx-Tx Hybrid AI v11

A physician-facing lumbar degenerative clinical reconciliation research prototype combining:

1. Transparent safety and literature-mapped rules
2. A deterministic synthetic analog simulation
3. Clinician-reviewable rationale and uncertainty
4. A concise generated synthesis

## Important scientific limitation

The synthetic module is not trained or calibrated on real patient outcomes. Its percentages represent agreement across simulated scenarios created from transparent assumptions; they are not outcome probabilities, causal treatment effects, or validated recommendations. Outcome prediction is intentionally disabled until real-data calibration and external validation are completed.

## Run

```bash
npm install
npm run build
npm run dev
```

## Architecture

- `lib/decisionEngine.ts`: safety, anatomy, guideline and management logic
- `lib/syntheticEngine.ts`: deterministic Monte Carlo analog simulation
- `components/SpineDecisionApp.tsx`: guided workflow and result views

## Validation roadmap

1. Multidisciplinary rule adjudication
2. Synthetic stress testing and impossible-case testing
3. Retrospective institutional calibration
4. Temporal and external validation
5. Silent prospective evaluation
6. Clinical-impact trial

Do not enter identifiable patient information. Not for autonomous diagnosis, ordering, authorization, or surgical selection.
