# SpineDx-Tx AI — literature-mapped lumbar decision-support prototype

A Next.js research prototype for structured lumbar safety screening, syndrome characterization, clinical–imaging reconciliation, diagnostic gaps, treatment context, decompression-versus-fusion evidence framing, and perioperative optimization.

## Safety

This is not a validated medical device. It must not be used for autonomous diagnosis, ordering, surgical selection, authorization, or patient-facing advice. No identifiable patient data should be entered in the public demo.

## Evidence framework

Rules are explicitly mapped to ACR Low Back Pain Appropriateness Criteria, NICE NG59, the NICE/GIRFT cauda equina pathway, NASS lumbar disc herniation and lumbar stenosis guidelines, the 2024 Nordsten-DS randomized trial, and contemporary hip-spine literature. Evidence mapping does not validate the software.

## Run

```bash
npm install
npm run build
npm run dev
```

## Validation required before clinical use

1. Multidisciplinary rule adjudication with a rule-by-rule evidence table.
2. Retrospective case-vignette validation against blinded expert consensus.
3. Silent prospective validation on real clinic cases.
4. Human-factors testing and failure-mode analysis.
5. Subgroup fairness, calibration, privacy, cybersecurity, and regulatory review.
6. Controlled clinical-impact evaluation.
