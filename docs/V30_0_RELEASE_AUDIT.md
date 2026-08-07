# v30.0 release audit

Reviewed against the shipped v29.1 package. v29.1 passed typecheck, engine tests, 133
regression tests, production build and visual checks. Every defect below sat inside that
passing build, and two of them were reported by you rather than caught by the suite.

---

## 1. Critical audit of v29.1

### 1.1 Syndrome engine was systematically over-confident — BLOCKING

Reproduced: leg-dominant pain, **no** dermatomal pain, **negative** straight-leg raise, and a
single give-way motor finding produced `radiculopathy-supported`.

Two causes. `motorDomain` was true whenever a motor screen existed, without reference to
reliability — so give-way weakness counted identically to a reproducible deficit. And
`symptomDomain` treated leg-dominant pain as equivalent to dermatomal distribution, so
`symptomDomain && motorDomain` reached "supported" on essentially no objective evidence.
Explicit negatives were discarded rather than counted against.

An over-confident syndrome label is worse than an uncertain one: it is the line a clinician
is most likely to carry into a note.

### 1.2 The concordance map contradicted the reasoning — BLOCKING

The map printed `Motor examination — Not assessed` while the detailed reasoning printed
`Focused motor screen: right knee extension at 4/5` for the same case. The map read the
Comprehensive muscle grades only; the reasoning read the Rapid focused finding. Four
independent derivations of motor state existed across the engine, validators, alerts and map.

### 1.3 Reliability was reported as both limited and undocumented — IMPORTANT

Recording "give-way" as the character of weakness produced `reliability: low` in the engine
*and* `motor-reliability-missing` from the validator, because the validator only looked at
`examConfidence`. Character of weakness **is** reliability information. The output asserted
both that reliability was limited and that it was not documented.

### 1.4 Duplicate alerts for one observation — IMPORTANT

The same finding raised "Objective deficit with limited examination reliability" and
"Motor-deficit reliability is not documented". Two entries in a six-item do-not-miss panel
for one issue crowds out genuine conflicts.

### 1.5 The step navigator scrolled 4790px horizontally at 1024 — IMPORTANT

The v29.1 visual suite reported success at 1024 because it only checked page-level overflow
and treated the navigator as a deliberate scroller. It was 4790px wide inside a 1024px
viewport. Six labelled steps cannot be used if five of them are off-screen.

### 1.6 Rapid content leaked into Comprehensive mode — IMPORTANT

"Save time", "Rapid review supports…" and the Rapid confirmation count remained visible after
switching to Comprehensive. Mode-specific rendering read `workflowMode` in some places and
derived state elsewhere, with no single canonical source.

### 1.7 Product marketing occupied the workflow — ADVISORY

Three permanent cards ("Save time", "Catch issues", "Communicate") sat above the clinical
content on every case, consuming a full screen on mobile before the first question.

### 1.8 The same conclusion was restated up to four times — ADVISORY

"Candidate localization unresolved" appeared as a headline and again as "Next clinical step:
localization unresolved", with related restatements in limitations and missing information.

---

## 2. Issue table

| # | Issue | Clinical / usability risk | Correction | Test |
|---|---|---|---|---|
| 1 | Give-way weakness and leg-dominant pain alone produced `radiculopathy-supported` | An over-confident syndrome label is the line most likely to reach the note and the referral | Recalibrated: "supported" now requires ≥2 strong domains, one of which must be objective. Reliability gates whether a motor finding counts as objective. Leg-dominant pain scored separately from dermatomal distribution. Explicit negatives stated in the rationale. New categories `radiculopathy-possible` and `radiculopathy-uncertain` | `leg-dominant pain alone does not establish radiculopathy`; `give-way weakness alone does not establish radiculopathy`; `reproducible weakness plus dermatomal pain does establish radiculopathy`; `negative SLR with no dermatomal features is recorded as negative evidence`; `claudication without radicular features is not called radiculopathy` |
| 2 | Concordance map said "Not assessed" while reasoning reported a graded finding | Two parts of one page contradicting each other destroys trust in both | `lib/motorSummary.ts` — one canonical conversion from motor data to recorded finding, completeness, reliability, localization contribution and display text. Consumed by the map, reasoning, alerts, validators and handoff | `every view reports the same motor finding` |
| 3 | Reliability reported as limited *and* undocumented for one finding | Self-contradictory output; the clinician cannot tell which statement to act on | Character of weakness is treated as reliability information. `reliabilityDocumented` is true whenever reliability is known by any route | `character of weakness counts as documented reliability`; `give-way weakness maps to limited localization contribution` |
| 4 | Two alerts for one observation | Duplicate entries crowd genuine conflicts out of a capped panel | Alert de-duplication on underlying issue (field + action + tier), plus explicit supersession of validator issues already covered by an engine alert | `reliability is raised exactly once`; `a severe deficit with limited reliability is surfaced exactly once` |
| 5 | Step navigator scrolled 4790px at 1024px | A navigator whose steps are off-screen is unusable | Replaced the scroller with a reflowing grid: 6 columns, 3 at ≤1150px, 2 at ≤560px, labels truncating with ellipsis. `overflow: visible`. Single authoritative CSS block | `the step navigator reflows and never scrolls horizontally` |
| 6 | Visual suite could not see nested overflow | The defect above shipped through a passing suite | Nested-container overflow detection added, with 1280 as a fifth breakpoint. Deliberate ellipsis truncation excluded so the check stays trustworthy | `the visual suite checks nested containers, not only the page` |
| 7 | Rapid copy and counts persisted in Comprehensive | Labels disagreeing with the selected mode | One canonical `activeMode`; all mode-specific copy derives from `modeCopy`. Verified by driving a real browser through Rapid → Comprehensive → Rapid | `there is one canonical activeMode`; `rapid-only copy is gated on the canonical mode`; `mode descriptors match the required wording` |
| 8 | Marketing cards in the active workflow | Physicians scrolling past product messaging on every case | Removed; replaced by a compact mode bar carrying mode, descriptor and confirmation count | `product-marketing cards are gone from the active workflow` |
| 9 | One conclusion restated up to four times | A physician reading four restatements learns to skim | Synthesis editor removes verbatim and near-duplicate statements; highlights de-duplicated on the conclusion they state rather than on supporting detail | `the same conclusion is not stated twice in the headline panel`; `missing-information entries are de-duplicated` |
| 10 | "Open source" link label | Implies open access regardless of the destination | Typed `sourceLinks` with destination-accurate labels (View guideline / View PubMed / View DOI record / View publisher page / Full text) and `accessStatus`. Only verified entries carry structured links | `evidence link labels name the destination, never 'Open source'`; `only manually verified entries carry structured links` |
| 11 | Synthesis evidence card too dense for clinical use | Population, exclusions, applicability and limitations at the point of care | Condensed to citation, type, one-line relevance, verification badge and a destination-labelled link. Full metadata remains in the Evidence workspace | Covered by the evidence-density and link tests |

---

## 3. Verification

```
npm run typecheck        clean
npm run test:engine      v30.0 engine and validation tests passed
npm run test:regression   153 regression tests passed
npm run build            compiled successfully
npm run test:visual      All visual checks passed at 1440 / 1280 / 1024 / 768 / 390
bash scripts/verify.sh   exit 0
```

60 screenshots: 5 breakpoints × 12 screens (default, orientation, demo, safety, assessment,
imaging, management, review, synthesis, evidence library, filtered evidence, research
workspace, comprehensive).

---

## 4. Known limitations

**Standing:**

- No real EMR integration; no mock adapter interfaces either.
- No authenticated PHI storage.
- No prospective clinical validation. The recalibrated syndrome thresholds are a reasoned
  design choice, not a validated rule — "two strong domains, one objective" is defensible and
  better calibrated than what it replaced, but it has not been tested against adjudicated cases.
- No proven time savings.
- No systematic evidence review: 26 entries, 3 verified against source, 23 pending.
- No cervical, thoracic, paediatric, deformity, tumour, infection or fracture module.

**Requested but not completed:**

- **Component extraction (item 16) remains undone.** Only `EvidenceLibrary.tsx` is extracted.
  `SpineDecisionApp.tsx` is still monolithic and the named hooks do not exist. Deferred across
  four releases now. It should be the entire content of the next release.
- **The left workflow rail (item 3) was not built.** The navigator was fixed in place as a
  reflowing horizontal grid, which resolves the unusable scrolling. The sticky vertical rail
  layout was not implemented.
- **Alert-to-field navigation (item 17)** still scrolls to the field but does not focus the
  control, and has no dedicated tests.
- **Evidence verification (item 13)** is unchanged at 3 of 26. Verification must precede
  expansion; adding more unverified entries would lower the registry's reliability.
- **The visual redesign (item 15) is corrective, not a redesign.** Overflow, clipping, empty
  sections, mode leakage and card clutter are fixed and verified at five breakpoints. The
  extended colour system, gradient headers and urgency-dominant synthesis layout are not built.

---

## 5. How v30.0 serves the three goals

**Reduces physician work.** Marketing cards no longer sit between the clinician and the first
question. The navigator's six steps are reachable at every width instead of five being
off-screen. The synthesis states each conclusion once rather than up to four times.

**Catches what would be missed.** The syndrome recalibration is the most important change in
this release: give-way weakness and leg-dominant pain no longer produce a "supported"
radiculopathy. The canonical motor model means the concordance map cannot report "not
assessed" for a finding the reasoning describes in detail. Alert de-duplication keeps the
capped do-not-miss panel available for genuine conflicts.

**Improves communication and consistency.** One motor summary feeds the map, reasoning,
alerts, handoff and research trace, so every reader of the record sees the same statement of
what was examined and how reliable it was. Evidence links name their destination, so a
colleague following a citation knows whether to expect a guideline, an abstract or full text.
