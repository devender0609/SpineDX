# v28.3 — Clinical safety and evidence-integrity audit

Reviewed against v28.2. Every defect below was reproduced against the running v28.2 engine
before being changed, and every fix has a test that fails on the old behaviour.

Baseline v28.2 status: typecheck, engine tests and production build all **passed**. None of
the defects below were caught by the existing suite — they are correctness failures inside
passing code, which is the category that matters most in a tool whose purpose is to prevent
a clinician from missing something.

---

## 1. Defects found and corrected

### 1.1 An unexamined limb was scored as 5/5, then used to raise a false alert — BLOCKING

`evaluateCase` computed per-side motor minima with `Math.min(...grades, 5)`. The trailing `5`
is a seed value, so a side on which **nothing was tested** collapsed to a normal `5`.

Two consequences, both bad:

- The concordance map printed `right 5/5` for a limb that was never touched.
- With symptoms recorded right-sided, a right leg not examined, and a left ankle at 4/5, the
  engine emitted: *"Symptoms are right-sided, while the strongest recorded motor deficit is
  left-sided."* That is a fabricated do-not-miss alert built entirely out of absent data, and
  it points the clinician at the wrong leg.

This is the exact failure mode the specification names first: missing information must not be
converted into a normal finding.

**Fix.** Introduced `sideMotor()`, returning `{min: number|null, testedCount}`. `null` means
untested and is never coerced. Side comparison runs only when both sides have at least one
graded group; otherwise the engine states plainly that one limb was not graded and is not
assumed normal.

### 1.2 Severe L3–4 foraminal stenosis disappeared from the output entirely — BLOCKING

`rootFor("L3-4", "*-foramen")` returned `null`, and the caller did `if(!root) continue`.
The L3–4 foramen contains the **L3 exiting root**, which is outside the module's L4/L5/S1
scope — but the finding was dropped with no trace anywhere in the output.

Reproduced: severe right L3–4 foraminal stenosis with root deformation, plus a concordant L4
picture (knee extension 4/5, reduced patellar reflex, L4 sensory change, positive femoral
stretch) produced **0 targets and 0 mentions of L3–4** in any field.

A clinician who documented a severe finding was shown nothing about it. Silence reads as
"nothing there."

**Fix.** `rootFor` now returns a discriminated `RootResolution`. Out-of-scope findings are
collected into a new `scopeNotes` output channel, surfaced in a "Scope and screen limitations"
card, and traced as `SCOPE-001`. The app says what it saw and why it could not reconcile it,
rather than discarding it. It does **not** invent L3 localization logic.

### 1.3 Undocumented laterality was reported as a conflict — IMPORTANT

`sideMatches` was boolean, so `side: "not-assessed"` and `side: "midline"` both returned false
and pushed `"symptom laterality is not compatible"` into the candidate's **conflicts**. Unknown
is not discordant. This manufactured a discordance the clinician never recorded, and it
depressed the candidate score via the `-conflicts.length*12` term.

**Fix.** `compareSide` is now three-state (`match`/`mismatch`/`unknown`). Unknown routes to
`unavailable` with an explicit note. Genuine mismatches still register as conflicts (tested).

### 1.4 Invented examination reliability — IMPORTANT

A negative rapid motor screen returned a hard-coded `reliability: "moderate"`. Reliability was
never asked in that path. The app was asserting a confidence level the clinician did not give.

**Fix.** Reliability is now always derived from `examConfidence`, defaulting to
`indeterminate`. A documented reliability is still honoured (tested both ways).

### 1.5 Untested motor exam graded as "no deficit" — IMPORTANT

The early-return guard required motor, sensory **and** all four reflexes to be untested. If a
single reflex was checked, control fell through to `const min = tested.length ? ... : 5` —
again seeding 5 — and severity was computed as `none`. A patient with one reflex checked and
no motor testing was reported as having no motor deficit.

**Fix.** A separate branch handles "no motor group graded": severity stays `indeterminate`
and the rationale states that sensory or reflex findings alone do not establish motor
severity. Partial exams are annotated (`n of 8 motor groups graded; ungraded groups are not
treated as normal`).

### 1.6 Hidden comprehensive fields drove rapid conclusions — IMPORTANT (architectural)

`workflowMode` was a pure UI toggle. `evaluateCase(data)` always read the entire stored case.
Reflexes, sensory roots, femoral stretch, hip exam, neuropathy features, gait findings, extra
imaging levels and the whole risk block were invisible in rapid mode but still fed syndrome
derivation, neurologic severity, candidate support and competing-diagnosis warnings.

This is the state-model question I raised before reviewing the code. Of the three options,
the codebase supported none of them; it simply leaked.

**Fix.** `lib/modeProjection.ts` implements **snapshot-and-project**. The stored case is never
mutated, so nothing is lost on mode switch. The *engine input* is rebuilt from an explicit
**allowlist** of rapid-visible fields. An allowlist, not a denylist, because a denylist fails
open — any field added to the schema later would silently start leaking. `suppressedFields()`
enumerates what was set aside, and the UI now tells the clinician how many fields are held
back and offers the switch to Comprehensive.

Related: `applyRapidImaging` rewrote only the selected row, leaving other levels populated
from a prior comprehensive session. It now rebuilds the matrix from blank.

### 1.7 An emergency could be suppressed by unrelated validation errors — BLOCKING

`generate()` returns early on any blocking error. `emergency-elective-conflict` fires as an
error when a red flag is present alongside a proposed procedure — so a patient with urinary
retention and a planned decompression produced **no output at all**. The app declined to tell
the clinician it looked like an emergency.

**Fix.** Urgency is now evaluated continuously from the live case and rendered in a persistent
banner above the workflow, independent of validation state. Blocking errors still stop the
*routine synthesis*, which is correct; they no longer stop the safety message. The banner
states explicitly that the app cannot exclude emergency pathology.

### 1.8 Banned language shipped in the output — IMPORTANT

`specialistReview.status` included the literal `"no-invasive-target"`, rendered as
*"No invasive target established"* — a phrase the specification names as prohibited, because
the physician never asked the app to decide surgery.

**Fix.** Renamed to `localization-unresolved`, wording changed to *"Current information does
not establish a concordant candidate localization. Additional localization is needed before
procedure-specific review."* A test now scans the entire serialised output of five case
archetypes for all five banned phrases.

### 1.9 Negative screen results filed under "missing information" — ADVISORY

A negative rapid imaging screen was pushed into `missing`, then rendered under "Information
requiring resolution". A completed screen returning negative is a **result**, not a data gap.

**Fix.** Routed to `scopeNotes` with the specification's preferred phrasing.

### 1.10 A documentation gap read as a clinical negative — IMPORTANT

When imaging was report-only, `targets()` returned `[]` and the headline read
*"No concordant target established"* with the detail *"Imaging is not treated as symptomatic
without compatible clinical findings"* — implying the clinical picture failed, when in fact
localization was never attempted because the images were not opened.

**Fix.** `targets()` returns a `blockedReason`. The headline now reads *"Candidate
localization unresolved"* and states: *"Candidate localization was not attempted because
direct image review is not documented. This is a documentation gap, not evidence against a
compressive lesion."*

### 1.11 Evidence layer was decorative — IMPORTANT

`evidenceIds` were bare strings with no backing registry. The clinician-facing panel printed
`Supporting sources: NASS-LDH` — meaningless at the point of care. `docs/current/EVIDENCE_REGISTRY.csv`
existed but was imported by nothing. `SAFE-001` cited the same two IDs on every case regardless
of conclusion, and two cited IDs (`CES-PATH`, `NASS-DS`, `NORDSTEN-5Y`) did not correspond to
anything resolvable.

**Fix.** `lib/evidence.ts` provides a typed registry carrying every field the specification
requires: id, citation, study type, population, main finding, key exclusions, applicability to
the rule, limitations, review date, superseded status. Citations now vary by triggered
conclusion:

- radiculopathy → NASS-LDH + SLR-DX; claudication → NASS-LSS; mixed → both
- foraminal candidates additionally cite FORAMEN-GRADE (with its limitation stated: reader
  agreement is not symptom correlation)
- fusion trials (NORDSTEN-DS, SWEDISH-LSS) cite **only** when fusion factors are documented
- **missing-data conclusions cite nothing**, with an explicit statement that no trial speaks
  to absent documentation
- TRIPOD+AI and DECIDE-AI are marked framework-only and are barred from case rule traces —
  they describe the tool's validation status, not the patient

Key exclusions are recorded where they bite hardest: SPORT excluded cauda equina and
progressive severe deficit; NORDSTEN-DS excluded isthmic spondylolisthesis and severe
instability — precisely the patients in whom fusion is most argued.

### 1.12 Frozen-assessment leaks — ADVISORY

`exportJson` bundled the **frozen** result with **live** validation issues, so editing inputs
after generating changed the exported issue list without regenerating the result. `copySummary`
omitted the mode label and the preliminary qualifier, and dumped all missing items into one line.

**Fix.** Export uses `generatedIssues` and `generatedWorkflowMode`, and additionally records
the suppressed-field list and the full entered case for audit. The copied handoff now follows
the specification's five-field structure (clinical problem, candidate localization, immediate
priority, recommended action, major uncertainty), carries the `PRELIMINARY RAPID SYNTHESIS`
label and the "not a complete examination" qualifier, and reports copy success or failure
instead of failing silently.

### 1.13 Unreachable region logic — ADVISORY

`primaryRegion` had no control anywhere in the UI. It was hard-set to `"lumbar"` in
`createBlankCase` and never changed, so the `region-missing` and `region-outside` validators,
the out-of-scope applicability branch, and the step-skipping logic were all dead code — while
the UI simultaneously claimed other regions were out of scope with no way to record that.

**Fix.** Added the selector to Comprehensive orientation.

### 1.14 Twenty-four engine-active fields had no UI control — BLOCKING (class defect)

A reachability audit across the schema, engine, validator and component found **24 of 117**
`CaseInput` fields that the engine or validator reads but that no control anywhere in the
interface can set. In real use they are permanently `not-assessed`. Two whole subsystems were
therefore dead:

- **All nine applicability exclusion flags** (`pregnant`, `cervicalThoracicSymptoms`,
  `neuromuscularDisease`, `knownTumor`, `knownInfection`, `acuteFracture`, `majorDeformity`,
  `priorLongFusion`, `predominantlyAxialPain`). The entire out-of-scope mechanism was
  unreachable, so the app could never withhold treatment output for a case it was not built
  for — while its own UI copy claimed those conditions were out of scope.
- **All four prior-surgery complication fields** (`sameLevelRevision`, `priorDuralTear`,
  `priorInfection`, `priorPseudarthrosis`), which gate the blocking `surgery-history-conflict`
  validator. That error could only ever fire from imported or demo data.

Also unreachable: `stoppingAloneRelieves` — the discriminator between vascular and neurogenic
claudication, and the only input besides abnormal pulses to the vascular competing-explanation
warning. `muscleAtrophy`, `repeatedHeelRaiseAbnormal`, `groinPain`,
`uphillBetterThanDownhill`, `nicotineVaping`, `smokelessTobacco`, `fragilityFracture` and
`cpapAdherent` likewise.

**Fix.** Controls added for all of them, placed by clinical context rather than dumped into one
screen: a collapsed "Scope exclusions" panel in Comprehensive orientation; the vascular and
flexion-pattern discriminators inside the existing claudication disclosure; atrophy, repeated
heel raise and groin pain in the advanced examination panel; nicotine detail, fragility
fracture and CPAP adherence in advanced risk; and prior-surgery complications revealed
conditionally once a prior surgery is recorded. Nothing was added to Rapid review.

**Guard.** A test now parses the schema, engine, validator and component and fails if *any*
engine-active field lacks a control, with an allowlist for the seven fields legitimately set by
program logic (screen roll-ups, matrices, identifiers). The orphan list is asserted empty, so
this class of defect cannot silently return when fields are added later.

### 1.15 A red flag was buried inside a composite question — IMPORTANT

The rapid safety screen asked *"Any new bladder, saddle, or severe bilateral warning?"* and a
single "No" wrote `absent` into six fields including `bilateralSevereDeficit`. A clinician does
not naturally evaluate severe bilateral leg weakness while answering a bladder prompt, and the
two findings have different examination bases. This is a plausible false-negative route on a
red flag, produced by the roll-up itself.

**Fix.** Severe bilateral deficit is now its own rapid question. The bladder/saddle composite
covers only the five urinary and saddle items. A test asserts the roll-up no longer writes the
bilateral field, and that answering the bladder composite alone leaves urgency `indeterminate`
rather than resolving it.

**Budget.** This took mandatory rapid confirmations to 19, one over the specified ceiling of 18.
Image quality is now asked only once direct image review is confirmed — you cannot grade the
quality of images you did not open, and `targets()` already blocks localization when direct
review is absent, so no conclusion changes. Mandatory count returns to 18, and a test enforces
the ceiling.

---

## 2. Tests

`scripts/regression-tests.mjs` — 42 new tests. Every test in sections 1–6 fails against
v28.2. Sections 7–8 are preservation tests confirming no regression in emergency escalation,
safety-screen blocking, incidental-imaging suppression, cross-level fusion rejection, and
progression-conflict handling.

One pre-existing assertion in `engine-tests.mjs` was updated: it asserted the string
`"focused motor screen"`, which was deliberately reworded to `"identified in the rapid
screen"` per the specification. The replacement assertion is stronger — it also requires the
output to explicitly deny being a complete examination.

`scripts/verify.sh` runs typecheck → engine tests → regression tests → production build under
`set -euo pipefail`, with the success banner after the final step. **Verified by injecting a
deliberate failure**: exit code 1, build never ran, success banner not printed.

Final run: typecheck clean, 42 regression tests + the existing engine suite passing, production build compiled.

---

## 3. Remaining limitations

**Not fixed, and you should decide rather than me:**

- **Report-only imaging still blocks localization entirely.** I kept the gate and fixed only
  the messaging, because the specification treats "imaging not directly reviewed" as a
  do-not-miss item. But most PM&R and APP reviews start from a radiology report. If this tool
  is meant for triage upstream of the surgeon, the gate makes it unusable in the majority
  workflow. This is a product decision, not a bug.
- **Six inert schema fields remain**: `sexAtBirth`, `clinicianSuspectedRoot`,
  `coughSneezeProvokes`, `urinaryUrgencyAlone`, `plannedSetting` and `synovialCyst` are read by
  neither the engine nor the validator. They are harmless but should be either wired to
  something or removed; `clinicianSuspectedRoot` in particular looks like it was meant to be
  compared against the derived localization and never was. I left them rather than delete
  fields the research export may depend on.
- **CSS is layered override sediment.** `.executive-grid` is declared six times,
  `.level-checks`, `.literature-grid`, `.module-scope` and `.stepper` two to three times each,
  with later blocks partially overriding earlier ones. I did **not** consolidate this: I cannot
  render the app here, so a dedup pass I can't visually verify risks breaking layouts you
  currently rely on. It needs one pass with a browser open.
- **`L1-2` and `L2-3` still exist in the data matrices but not in the UI level list.** This is
  now safe rather than silent — the `rootFor` fix surfaces any finding at those levels as an
  explicit out-of-scope note — but imported data can still reference levels the clinician
  cannot edit.

**Requires work outside the codebase:**

- No rule here is clinically validated. The framework is deterministic and consensus-derived;
  concordance thresholds, the candidate-scoring weights (`sv*15 + support*10 − conflicts*12`)
  and the six-week durability cutoff are design choices, not derived from outcome data. The
  scoring function in particular has no empirical basis and should not be shown as a numeric
  score to clinicians until it does.
- The evidence library is **curated, not systematic**. It is labelled as such and must not be
  described otherwise until a formal review is completed.
- Prospective evaluation per DECIDE-AI, multidisciplinary adjudication of every rule change,
  and EMR integration all remain outstanding.

---

## 4. How this serves the three goals

**Saves time** — rapid mode now genuinely runs on rapid inputs only, so it can be trusted as a
short workflow rather than a comprehensive form with fields hidden. The copied handoff is
note-ready in the specified structure.

**Catches what would be missed** — the two blocking defects both degraded exactly this goal.
1.1 generated a false alert pointing at the wrong leg while the unexamined leg went
unmentioned; 1.2 silently swallowed a severe documented finding. 1.7 meant a suspected
emergency could produce no output at all. Alert quality also improves by subtraction:
undocumented laterality no longer fires a spurious conflict, so the do-not-miss list carries
fewer false positives competing for attention.

**Improves communication** — the handoff carries the preliminary label and an explicit
uncertainty field, so the receiving clinician sees the boundaries of the review, not just its
conclusion. Evidence cards now show citation, population, exclusions and limitations rather
than an internal ID, and cite nothing when nothing applies — which is itself the honest signal.
