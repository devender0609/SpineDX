# v29.1 release audit

Reviewed against the shipped v29.0 package.

v29.0 baseline: typecheck, engine tests, 104 regression tests, production build and visual
checks all passed. As in every prior round, the defects below sat inside passing code — and
one of them was found only by *looking at a screenshot* after the automated visual suite had
reported success.

---

## 1. Critical audit of v29.0

### 1.1 "Structured de-identified export" was not de-identification — BLOCKING (privacy)

I introduced this label in v29.0 while fixing a worse version of the same problem. The export
did strip the designated fields, so it was not the outright false label v28.4 carried. But
"de-identified" is a term of art: it denotes a status conferred by institutional privacy
review under a defined standard, not the outcome of a field-removal function. Exact dates were
also exported verbatim, which is one of the most reliable re-identification vectors in a
clinical dataset.

Calling field removal "de-identification" invites a researcher to treat the file as releasable
when it is not.

### 1.2 Session-only draft storage did not exist — IMPORTANT (privacy)

The v29.0 README described a session-only alternative. The button labelled "Session only"
called `setDraftDismissed(true)` — it hid the opt-in bar and wrote nothing anywhere. There was
no session mode: only "local draft" and "nothing". A clinician on a shared workstation who
chose the apparently-safer option got no storage at all, which is safe by accident, but the
README documented a capability the code did not have.

### 1.3 All non-routine situations still collapsed into one state — IMPORTANT

v29.0 gave infection and pregnancy *distinct reason strings*, which I described honestly at the
time as partial. They still converged on a single `out-of-scope` treatment state with identical
downstream behaviour. A suspected spinal infection and a pregnancy are not the same clinical
situation: one requires urgent evaluation and blocks elective reasoning; the other changes
imaging and medication choices and otherwise proceeds. Producing the same behaviour for both
teaches the clinician to ignore the classification.

### 1.4 Two sources of truth for evidence — IMPORTANT

The Evidence page rendered hard-coded cards while case-specific evidence read `lib/evidence.ts`.
The registry could be corrected without the page changing, and vice versa. The page also had no
filters, no search, and no verification badges, so an unverified summary appeared identical to a
verified one.

### 1.5 Adjudication asked reviewers to apply an undefined threshold — IMPORTANT

The reviewer form offered "fusion rationale: established / possible / not established". No
definition of "established" existed anywhere in the protocol. Each reviewer applied a private
threshold, which makes inter-rater disagreement uninterpretable: two reviewers who saw
identical factors could disagree purely on where they set the bar. It also contradicted the
clinician-facing language, which deliberately refuses to say "fusion indication established".

Blinding status, review context and per-domain confidence were not captured at all, so a
reference-standard review could not be shown to have been blind to app output.

### 1.6 An empty card shipped in the synthesis — IMPORTANT (found by eye, not by assertion)

"Prioritized next steps" rendered as a heading with nothing beneath it whenever the engine
produced no next steps and no nonoperative suggestions. The automated empty-card check missed
it: the card contained an empty `<ul>`, which is not an empty string in `textContent` terms.

The v29.0 visual suite reported success. Opening the screenshot found the defect in seconds.
This is the most useful lesson of the release and is why the suite now captures twelve screens
rather than one.

### 1.7 Usability capture interrupted clinical content — ADVISORY

The clinician-feedback block sat between the standardized handoff and the concordance map, so
a research instrument was placed in the middle of the clinical reading path.

### 1.8 Other findings

- Feedback captured agreement only. The three product goals include time burden and
  communication, and neither could be measured.
- A stepper button clipped its label plus status icon at 1024px.
- Evidence cards overflowed the viewport at 768px and below — grid children default to
  `min-width: auto` and refuse to shrink below their content.

---

## 2. Issue table

| # | Issue | Clinical / privacy / usability risk | Correction | Test |
|---|---|---|---|---|
| 1 | Export labelled "de-identified"; exact dates exported verbatim | A researcher treats the file as releasable when institutional review has not conferred that status; dates are a strong re-identification vector | Renamed **identifier-reduced research export**. `formallyDeidentified: false` on both paths. Exact dates converted to relative intervals. Pre-export modal states included / removed / transformed / residual risk, reading from the same constants the stripper uses so the list cannot drift. `docs/EXPORT_PRIVACY.md` | `no export is described as de-identified`; `the identifier-reduced export converts exact dates to relative intervals`; `the export modal states included, removed, transformed and residual risk`; `the identifier-reduced export actually strips every designated field` (plants 8 values, asserts none survive) |
| 2 | Session-only draft mode did not exist | The README documented a capability the code lacked; a clinician choosing the safer-sounding option got undefined behaviour | Three real modes: **Do not save** (nothing written), **This session only** (`sessionStorage`, so the browser guarantees lifetime rather than a timer that would not survive a crash), **Local draft, 24 hours** (`localStorage`, expiry enforced on read). Switching modes clears the other store. `docs/DRAFT_STORAGE.md` | `draft storage offers three explicit modes backed by different stores`; `switching draft modes does not leave a copy in the other store`; `session drafts are not subject to the 24-hour timer` |
| 3 | Infection and pregnancy produced identical behaviour | A classification that behaves identically for clinically opposite situations trains the clinician to ignore it | `lib/pathways.ts` with four pathways and distinct consequences. Serious pathology → next action is urgent evaluation, elective synthesis blocked. Complex postoperative → recommends Comprehensive, *not* blocked. Outside-localization → states what the module can and cannot assess. Special population → paediatric blocks adult synthesis; pregnancy keeps localization and routes to obstetric coordination; neuromuscular disease qualifies examination reliability. Safety output is never withheld by any pathway | `serious pathology is an urgent diagnostic pathway, not a generic exclusion`; `complex postoperative recommends comprehensive without generic exclusion wording`; `outside-localization explains what the module can and cannot assess`; `special population is not equivalent to serious pathology`; `paediatric age blocks adult synthesis but keeps safety output`; `neuromuscular disease qualifies examination reliability`; `serious pathology outranks every other pathway` |
| 4 | Two sources of truth for evidence | The registry and the page could diverge; unverified summaries looked authoritative | `components/evidence/EvidenceLibrary.tsx` renders from `EVIDENCE_REGISTRY`. 9,727 characters of hard-coded markup deleted. Domain filter chips with counts, search across ID/citation/finding/population/type, expandable applicability and limitations, verification badges, superseded treatment | `the evidence page renders from the registry, with no hard-coded cards`; `there is exactly one source of truth for evidence metadata`; `every filter domain has a label and every entry has a real domain`; `the evidence page supports search across id, citation and topic` |
| 5 | Unverified evidence indistinguishable from verified | An unverified citation that looks verified is worse than none | Five-stage `verification` field. Pending entries render with an explicit caveat that the summary has not been checked against source. 3 of 26 verified; 23 marked pending. `docs/EVIDENCE_VERIFICATION.md` | `unverified entries are visibly marked as pending, not shown as authoritative`; `every entry declares a verification stage`; `verified entries carry a verification date` |
| 6 | Adjudicators asked to apply an undefined "established" threshold | Inter-rater disagreement becomes uninterpretable — two reviewers seeing identical factors can disagree purely on where they set a private bar | Nine prespecified factors documented individually, then a separate "are one or more independent factors documented? yes / no / unable" question. Plus reviewer specialty, direct-image-review vs report-only, saw-app-output, saw-outcomes, per-domain confidence, and sufficiency judgment. Blinding requirement stated in the form | `reviewers document prespecified factors, not an undefined 'established' category`; `the factor question is separate from the yes/no/unable judgment`; `review context and blinding fields are captured` |
| 7 | Empty "Prioritized next steps" card in the synthesis | The brief prohibits empty sections; an empty heading reads as a system failure | Card guarded on content. Empty-section detector rewritten to check headings across cards *and* subsections, ignore whitespace-only wrappers, and treat an empty `<ul>` as empty | `the next-steps card is not rendered when there is nothing to say`; `the visual suite asserts against empty sections` |
| 8 | Feedback interrupted the clinical reading path | A research instrument between the handoff and the reasoning | Moved below the concordance map and candidate localization | `clinician feedback follows the clinical content` |
| 9 | Feedback measured agreement only | Two of the three product goals were unmeasurable | Five questions: clinical agreement, effect on time, clinical usefulness, handoff usefulness, and whether the assessment changed. Categorical responses and timestamps only | `feedback covers all three product goals plus impact`; `metrics stay categorical with no clinical values or free text`; `no validated time-saving claim is displayed` |
| 10 | Visual suite captured one screen | A defect on any other screen shipped unseen | Twelve screens per breakpoint: default/empty, orientation, demo loaded, the rapid walkthrough, blocked-synthesis state, synthesis, evidence library, filtered evidence, research workspace, comprehensive. Assertions run on every capture | `the visual suite captures every major screen, not just the entry view`; `captured screenshots exist for every breakpoint and key screen` |
| 11 | Stepper button clipped at 1024px; evidence cards overflowed at ≤768px | Clipped labels and horizontal overflow | Stepper buttons size to content with the strip scrollable at any width. `min-width: 0` applied to grid and flex children that were refusing to shrink below content | Clipped-button and overflow assertions in the visual suite, run on all twelve screens |

---

## 3. Verification

```
npm run typecheck        clean
npm run test:engine      v29.1 engine and validation tests passed
npm run test:regression   133 regression tests passed
npm run build            compiled successfully
npm run test:visual      All visual checks passed at 1440 / 1024 / 768 / 390
bash scripts/verify.sh   exit 0
```

Screenshots in `docs/screenshots/` — 4 breakpoints × ~12 screens. Fault injection previously
confirmed the chain stops on failure and prints no success banner.

---

## 4. Remaining limitations

**Standing limitations:**

- No real EMR integration. Mock adapter interfaces (item 10) were **not** added — empty
  interfaces with no caller would be scaffolding that looks like progress.
- No authenticated PHI storage.
- No prospective clinical validation. The candidate score (`sv*15 + support*10 − conflicts*12`)
  and the six-week durability cutoff remain design choices with no empirical basis.
- No proven time savings. Instrumentation now captures clinician-reported time burden;
  nothing measured. No time-saving claim appears in the product.
- No systematic evidence review. 26 entries, 3 verified.
- No cervical, thoracic, paediatric, deformity, tumour, infection or fracture module.

**Requested but not completed in this release:**

- **Component extraction (item 7) is largely undone.** Only `EvidenceLibrary.tsx` was
  extracted. `SpineDecisionApp.tsx` remains monolithic; the named shell, assessment, synthesis
  and research components and the five hooks do not exist. This is now the largest piece of
  technical debt in the repository and it has been deferred across three releases. It should be
  the primary work of the next one, done alone, with the test suite as the safety net.
- **Additional evidence domains (item 9) deliberately withheld.** EMG/NCS, dynamic radiography,
  anticoagulation, anaemia/nutrition, recurrent herniation, frailty and human factors are not
  added. With 23 of 26 entries pending verification, adding more unverified sources would lower
  the registry's reliability. Verification precedes expansion.
- **Visual redesign (item 8) is corrective, not a redesign.** Overflow, clipping, empty
  sections, ordering and responsive behaviour are fixed and verified. The premium design system,
  gradient headers, urgency-dominant synthesis layout and card-count reduction are not done. The
  synthesis is still a stack of cards rather than a visually dominant summary.

---

## 5. How v29.1 supports the three goals

**Reduces physician work.** The pathway classifier stops a clinician working through a lumbar
localization flow for a case that needs urgent evaluation instead — the wasted work is prevented
rather than reported afterwards. The empty next-steps card no longer appears, and management
context remains optional, holding a routine rapid case at 14 confirmations.

**Catches what would be missed.** Serious pathology now produces "urgent evaluation takes
priority" rather than "outside scope", which is the difference between an escalation and a
shrug. Pregnancy keeps its localization reasoning instead of being blocked like an infection
concern. Paediatric age blocks adult treatment output while safety escalation continues.
Verification badges let a clinician see which evidence claims have been checked, so trust
attaches to the right entries rather than to the library as a whole.

**Improves communication and consistency.** Factor-based adjudication removes the private
threshold that made reviewer disagreement uninterpretable — two reviewers now disagree about
observable factors, not about an undefined word. Blinding and review-context capture make it
possible to show a reference-standard review was blind to app output. The export can no longer
describe itself as de-identified, so a research handoff carries an accurate privacy status.
