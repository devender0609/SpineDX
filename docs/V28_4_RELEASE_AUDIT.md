# v28.4 release audit

Reviewed against the shipped v28.3 package. Release incremented to **v28.4** rather than
renaming to `install-v28.3.ps1`, because the changes are substantial: a new scope-confirmation
gate that changes engine behaviour, a new draft-persistence layer, a restructured do-not-miss
surface, and ten new evidence entries.

v28.3 baseline: typecheck, engine tests, regression tests and production build all passed.
As in the previous round, the defects below sat inside passing code.

---

## 1. Issue table

| # | Issue found in v28.3 | Clinical or usability risk | Correction | Test added |
|---|---|---|---|---|
| 1 | `package-lock.json` still `0.28.2`; README, installer filename, installer body and engine-test banner all said v28.2 | A research team cannot tell which build produced a result. Version drift breaks reproducibility of any recorded assessment | All identifiers moved to `0.28.4` / `28.4.0` / `v28.4`; installer renamed `install-v28.4.ps1`; lockfile, README, engine banner and audit updated | `package, application and installer versions agree`; `no stale version strings remain in release-facing files`; `the old installer is gone and the new one exists` |
| 2 | Windows installer ran only `test:engine`. The entire v28.3 regression suite — every clinical-safety guard — was never executed on install | A regression in untested-limb handling, root mapping or evidence gating would install cleanly and silently | Installer runs install → engine → regression → typecheck → build, with `Assert-LastExitCode` after each; success banner lists all four; preflight asserts installer/package version agreement before copying | `the installer runs the full verification chain with exit-code checks` (asserts every `npm` line is followed by an exit-code check, and that the banner follows the build) |
| 3 | Comprehensive orientation offered a region menu including cervical, thoracic and "multiple spine regions" | Presenting unsupported regions as selectable implies those modules exist. A clinician could select "cervical" and reasonably expect cervical logic | Replaced with a lumbar scope confirmation (Yes / No / Uncertain / Not assessed). *No* and *Uncertain* both permit safety documentation and withhold localization, decompression, fusion and treatment synthesis, with an explicit banner. `primaryRegion` retained in the research schema for legacy imports but no longer surfaced as a module selector | `scope is a lumbar yes/no/uncertain confirmation, not a region module menu`; `unconfirmed scope blocks the lumbar pathway`; `'no' and 'uncertain' both withhold localization and treatment output`; `safety screening still functions when the case is out of scope` |
| 4 | No visible indication of how much of Rapid review remained | Clinician cannot tell whether the preliminary synthesis rests on a complete rapid screen or a half-finished one | Live counter — "*N* required confirmations remaining", naming the outstanding items — driven by an explicit 18-item requirement list. A count, not a percentage, because a percentage implies remaining work is proportional to clinical importance | `rapid mode stays within the mandatory-confirmation budget`; `the outstanding counter reaches zero only when every requirement is answered`; `the counter is a count, not a completion percentage` |
| 5 | Comprehensive escalation was suggested only for fusion | Prior surgery, severe deficit, limited image quality and competing explanations all silently proceeded through a workflow not designed for them | `comprehensiveSuggestions()` covers prior surgery, fusion, progressive weakness, severe motor grade, limited image quality, competing hip/vascular/neuropathic findings and multilevel disease. Rendered as a suggestion with a switch button; never forced | `comprehensive escalation is suggested, never forced` |
| 6 | Rapid mode did not ask about prior lumbar surgery | Revision anatomy changes localization and target selection more than almost any other factor, and it was invisible in the mode most likely to be used at speed | Added as a rapid confirmation and to the projection allowlist; drives both the escalation suggestion and the REV-001 evidence rule. Kept the total at 18 by making image quality conditional on direct image review | Covered by the requirement-count and escalation tests |
| 7 | A refresh destroyed a long Comprehensive assessment | Total loss of clinician work; the single most likely reason a clinician abandons a tool permanently | Debounced autosave to local storage with a resume/discard bar, discard confirmation, and a visible timestamp. Free-text fields stripped before write. Labelled prototype storage with no compliance claim | `drafts strip free-text fields that could carry identifiers`; `draft storage is labelled as prototype and makes no compliance claim`; `clearing a draft requires confirmation` |
| 8 | The results page showed no generation time, so a synthesis and a subsequently edited form were visually indistinguishable | A clinician could copy a handoff believing it reflected the form in front of them | "Generated from assessment snapshot at *time*" shown on the results header and included in the copied handoff | `the handoff is labelled with a snapshot time`; `the frozen snapshot does not track later edits` |
| 9 | Do-not-miss was a flat amber strip listing three validation titles, with no tiering, no detail and no action | Blocking safety issues and documentation advisories appeared identical; nothing told the clinician what to do next | `buildPriorityAlerts()` produces blocking / important / advisory tiers, each with a direct action (Review, Edit, Confirm, Switch to Comprehensive) that navigates to the relevant step and field. Capped at six. Inclusion is governed by an allowlist of clinically meaningful issue IDs so new low-value validators cannot leak in | `alerts are tiered and capped`; `every alert carries a direct action`; `low-value research warnings stay out of the do-not-miss list`; `a severe deficit with limited reliability is surfaced`; `a proposed level without imaging is surfaced as blocking` |
| 10 | Registry held 15 entries; injection, optimization and revision domains had no evidence at all, and injection reasoning cited a general radiculopathy guideline | Citing a disc-herniation guideline for an injection-response conclusion misrepresents what the source addresses | Ten entries added across examination accuracy, injection, optimization, revision disease and shared decision-making. `evidenceLevel` added. Injection now cites ESI and selective-block evidence — including the injectate-spread limitation that makes response non-localizing. Optimization cites only the factors actually recorded. Bone-health instrumentation evidence is withheld from decompression-only pathways | `injection evidence appears only when injection information contributes`; `optimization evidence appears only for risk factors actually recorded`; `bone-health evidence is cited only for instrumented pathways`; `prior surgery cites revision evidence with the correct wording`; `the expanded registry keeps full metadata on every entry`; `the library is labelled curated, never comprehensive` |
| 11 | Entry-burden rules were implemented but unguarded | Conditional disclosure regresses easily and silently | Verified injection target, fusion detail, prior-surgery complications, CPAP and HbA1c are all conditional; verified rapid mode exposes no ODI/PROMIS, fusion matrix, frailty, DEXA or adjudication fields | `conditional fields are not asked before they are relevant`; `rapid mode does not expose comprehensive-only instruments` |
| 12 | No usability instrumentation | The three product goals include saving time, and there was no way to ever measure it | Counts and timings only — elapsed seconds, field edits, confirmations answered, mode switches, alert counts, mode. No clinical values, no free text, no identifiers. Stored locally for future evaluation | `instrumentation records counts and timings, not clinical values`; `no validated time-saving claim is displayed` |

## 2. v28.3 behaviour explicitly preserved

Every guard listed as protected is still enforced by a passing test: allowlist projection;
hidden-field isolation; untested motor groups never scored normal; rapid motor screen not
equal to a complete examination; rapid imaging screen not equal to normal multilevel imaging;
unknown laterality not a conflict; out-of-scope findings visible; emergency escalation visible
despite validation errors; report-only imaging distinguished from direct review; fusion
evidence withheld when irrelevant; missing-data conclusions uncited; preliminary labelling;
concise handoff; typed registry with applicability and limitations.

The scope gate changed one preserved behaviour by design: a blank case is now out-of-scope
until lumbar scope is confirmed, so its specialist status is `additional-assessment` rather
than `localization-unresolved`. Test fixtures were updated to confirm scope explicitly; the
underlying localization wording is unchanged and still asserted.

## 3. Verification

```
npm run typecheck        clean
npm run test:engine      v28.4 engine and validation tests passed
npm run test:regression   74 regression tests passed
npm run build            compiled successfully, 4 static routes
```

`bash scripts/verify.sh` exits 0. Previously verified by fault injection: a deliberate test
failure produces exit 1, the build never runs, and no success banner is printed.

## 4. Remaining limitations

- **No EMR integration.** All data is entered manually.
- **No authenticated storage and no PHI handling.** Drafts are unencrypted browser local
  storage on the clinician's own machine. Free-text fields are stripped before write, but this
  is a prototype safeguard, not a compliance control.
- **No prospective clinical validation.** No rule has been evaluated against adjudicated
  reference standards or outcomes. The candidate-scoring weights and the six-week durability
  cutoff remain design choices with no empirical basis.
- **No proven time savings.** Instrumentation now makes measurement possible; nothing measured
  yet. No time-saving claim is displayed anywhere.
- **No systematic evidence review.** The library is labelled *curated evidence supporting the
  current framework*. Twenty-five entries selected by relevance, not by systematic search.
- **No cervical, thoracic, paediatric, deformity, tumour, infection or fracture module.**
- **Visual design not verified at real breakpoints.** The stylesheet still carries layered
  override sediment from earlier releases — `.executive-grid` is declared six times. New v28.4
  components were written with explicit responsive rules at 900px and 700px, but I cannot
  render the application, so the full desktop/tablet/mobile pass in item 4 of the brief is
  **not** complete. It needs one session with a browser open. I have not represented it as done.
- **Six inert schema fields remain**: `sexAtBirth`, `clinicianSuspectedRoot`,
  `coughSneezeProvokes`, `urinaryUrgencyAlone`, `plannedSetting`, `synovialCyst`.
  `clinicianSuspectedRoot` is worth building rather than deleting — comparing the clinician's
  suspected root against the derived localization would be a genuine do-not-miss check.

## 5. How this serves the three goals

**Saves time.** Rapid review is 18 confirmations with a visible counter, so a clinician knows
what remains rather than scanning for gaps. Conditional disclosure means injection targets,
fusion factors, prior-surgery complications, CPAP and HbA1c appear only once relevant. Draft
recovery removes the worst time cost of all: repeating a completed assessment after a refresh.

**Catches what would be missed.** The scope gate stops a non-lumbar case from receiving lumbar
localization output. Do-not-miss is now tiered and capped at six with a direct action on each,
so a blocking safety issue is visually distinct from a documentation advisory — the previous
flat strip made them identical. Prior surgery is now asked in Rapid mode, where revision
anatomy was previously invisible.

**Improves communication.** The handoff carries the snapshot timestamp, so a receiving
clinician knows the synthesis corresponds to a frozen assessment rather than a form that has
since changed. Evidence shown alongside a conclusion now states population, exclusions and
limitations — and cites nothing when nothing applies, which is itself the honest signal.
