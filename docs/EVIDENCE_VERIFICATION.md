# Source-verification report

**Status: 3 of 26 entries verified against source. 23 pending.**

This is stated plainly because an unverified citation that *looks* verified is worse than no
citation. Every entry carries a `verification` stage, and the Evidence page renders a pending
entry with a visible caveat rather than as authoritative guidance.

## Verification stages

| Stage | Meaning |
|---|---|
| `source-verified` | Publication opened; title, authors, journal/organisation, year and identifier confirmed |
| `metadata-verified` | Population and exclusions confirmed against the source |
| `summary-verified` | The app's main-finding summary confirmed not to overstate the source |
| `mapping-verified` | Evidence-to-rule mapping confirmed appropriate |
| `pending` | Not checked against the source document |

Stages are cumulative in intent: `mapping-verified` implies the earlier checks were done.

## Verified entries

### `NICE-NG59-REDFLAGS` — mapping-verified, 2026-08-04

NICE NG59, *Low back pain and sciatica in over 16s: assessment and management*, published
30 November 2016, last updated 11 December 2020.

**Correction made.** A previous release carried this source under the ID `CES-CONSENSUS`,
described as a composite consensus entry on cauda equina syndrome. That was wrong. NG59
explicitly states it does **not** cover the evaluation or care of people with sciatica with
progressive neurological deficit or cauda equina syndrome. Labelling a general low back pain
and sciatica guideline as a dedicated cauda equina consensus statement misrepresented it.

The entry now supports only the **content of the safety screen** — which warning features to
ask about. It is no longer cited for any emergency conclusion, and its exclusion of cauda
equina management is recorded in `keyExclusions`.

### `GIRFT-CES-PATHWAY` — mapping-verified, 2026-08-04

NHS England GIRFT national cauda equina pathway, published as an interactive care pathway
alongside NG59. Covers symptoms and initial management, bladder scanning, radiology, surgery
and post-operative care. Cited for **escalation**, and for the framework's refusal to state
that emergency pathology has been excluded. Recorded as consensus-level, not trial evidence.

### `ASYMPT-MRI` — mapping-verified

Brinjikji et al., systematic review of imaging features of spinal degeneration in asymptomatic
populations. Supports the refusal to treat an imaging abnormality as symptomatic without
concordant clinical findings.

## Pending entries

The remaining 23 entries were compiled from working knowledge and have not been opened and
confirmed in this environment. They are marked `pending` and rendered with a caveat.

**Verification must precede expansion.** Adding further unverified sources to a registry that
is already mostly unverified would reduce its reliability, not increase it. The requested
additional domains — EMG/NCS indications, dynamic radiography, anticoagulation,
anaemia/nutrition, recurrent herniation, frailty, human factors — are therefore **not** added
in this release.

## Recommended verification protocol

1. Open the primary source. Confirm title, authors, journal or organisation, year, DOI/PMID.
2. Confirm the population and the stated exclusions.
3. Confirm the actual finding or recommendation, including its strength.
4. Confirm the app's `mainFinding` summary does not overstate it.
5. Confirm the evidence-to-rule mapping: does this source address the conclusion it is cited for?
6. Record `verifiedOn` and `verifiedBy`. Mark inaccessible sources `pending`, not verified.
7. Where a source has been superseded, record the superseding reference rather than deleting it.

A second reviewer should independently repeat steps 3–5 for any source cited by a safety rule.
