# v29.0 release audit

Reviewed against the shipped v28.4 package. This is the first release where the visual
requirements were **actually verified** rather than deferred: Chromium runs in this environment,
so `scripts/visual-check.mjs` now drives a real browser at four viewports as part of
`scripts/verify.sh`. I had claimed twice that this was not possible. It was — I had not tried.

---

## 1. Critical audit of v28.4

Three defects were serious. Two of them I introduced.

### 1.1 The Rapid motor screen fabricated examination detail — BLOCKING

`applyRapidMotor(side, root, grade)` expanded one observation into graded Comprehensive muscle
fields. For `root === "L5"` it wrote the same grade to **both** ankle dorsiflexion **and**
great-toe extension. For `side === "bilateral"` it wrote a graded value to both limbs. It also
hardcoded `weaknessQuality: "true"` — asserting the weakness was true rather than
pain-limited or give-way, without asking.

So a clinician recording "right L5 weakness, 4/5" produced a record stating that two named
myotomes had each been individually tested at 4/5, with the weakness characterised as
objectively true. None of that was observed. This is the same class of defect as the v28.3
untested-limb bug, except this time the fabrication was authored deliberately as a convenience
mapping.

### 1.2 The "de-identified" research export was not de-identified — BLOCKING (privacy)

The button read *Download de-identified research record*. The payload contained
`fullEnteredCase: data` (the entire unfiltered form state), the complete `adjudication` record
including `caseId`, `siteCode`, all three reviewers' `reviewerId`, `rationale`,
`disagreementReason` and `notes`, plus `studyId` and the free-text `patientGoal`.

Nothing was stripped. The label was false, and it was the kind of false label that causes a
researcher to email a file they should not email.

### 1.3 Draft storage was on by default with no expiry — IMPORTANT (privacy)

Autosave began writing to `localStorage` on first keystroke with no opt-in, no expiry, and no
visible status. A stale case sat indefinitely on any browser, including a shared clinical
workstation, and a draft could be restored without the clinician asking for it.

### 1.4 An evidence entry misrepresented its source — IMPORTANT (integrity)

I created `CES-CONSENSUS`, described as a "composite consensus entry" on cauda equina syndrome,
pointing at NICE NG59. I verified NG59 this session: it **explicitly does not cover** the
evaluation or management of sciatica with progressive neurological deficit or cauda equina
syndrome. I had labelled a general low back pain and sciatica guideline as a dedicated cauda
equina consensus statement — precisely the error the brief names.

Compounding this: the registry presented 25 entries uniformly, implying all had been checked
against source. They had not. Most were compiled from working knowledge.

### 1.5 Other findings

- Injection response and proposed pathway were universally mandatory in Rapid mode, inflating a
  routine case to 18 confirmations when neither may be relevant to the visit.
- `clinicianAgreed` was recorded as `not-recorded` without ever asking the clinician — an
  instrumentation field that could never be populated.
- 60 CSS selectors had multiple competing non-media declarations (`body`, `button`, `.card`,
  `.stepper`, `.field select` each declared three times).
- Six schema fields remained inert with no documented disposition.

---

## 2. Issue table

| # | Issue | Clinical / privacy risk | Correction | Test |
|---|---|---|---|---|
| 1 | Rapid motor expanded one observation into two graded muscles | The record asserts myotomes were tested that were not. A downstream reader cannot distinguish a focused screen from a bilateral examination, and a fabricated grade can drive a false localization | New `rapidMotorFinding` structure records status, side, suspected root, **the movement actually tested**, lowest observed grade and character of weakness. `applyRapidMotor` deleted. The engine consumes it as a focused screen and the synthesis states it is not a full bilateral examination | `one L5 observation does not create two graded muscles`; `one side does not create a graded contralateral limb`; `the synthesis states the finding is a focused screen`; `the UI never writes comprehensive muscle fields from the rapid screen` |
| 2 | `weaknessQuality` hardcoded to `"true"` | Asserts objective weakness where the clinician may have observed pain-limited or give-way effort | Replaced by an explicit `reliability` field mapping to the shared scale; `objective-reproducible → high`, `pain-limited/effort-limited/give-way → low`, unset → `indeterminate` | `rapid reliability is taken from the clinician, never assumed` (all five mappings) |
| 3 | Comprehensive muscle grades were in the rapid projection allowlist | A graded muscle from a prior Comprehensive session could still reach a rapid conclusion | Removed from the allowlist entirely. Rapid never grades a myotome, so a graded value can only be Comprehensive data | `rapid findings stay separate from comprehensive examination data` |
| 4 | Export labelled de-identified while shipping the full case, adjudication, reviewer IDs and free text | A researcher transmits identifiers believing they were removed | `lib/researchExport.ts`. Renamed *Export research record for secure review*. Pre-export modal lists identifying fields currently holding data, read from the same constant the stripper uses so the list cannot drift. De-identified path strips all designated fields and omits `fullEnteredCase`; `deidentified: true` is set only on that path. Full export requires confirmation and carries the warning verbatim | `the de-identified export actually strips every designated field` (asserts eight planted secrets are absent); `the full export is labelled not de-identified and carries the warning`; `the export control is no longer labelled de-identified`; `the review modal lists exactly what the de-identified export removes` |
| 5 | Drafts on by default, no expiry, silent restore | Patient data persisting on a shared workstation | Off until explicit opt-in with a session-only alternative; `saveDraft`/`loadDraft` refuse without opt-in; 24-hour expiry discarded on read; visible status and last-save time; clear control with confirmation; restore only via Resume | `draft storage is off until explicitly enabled`; `drafts expire`; `drafts are never auto-restored without an explicit Resume`; `adjudication and research notes never enter browser drafts`; `storage status and a clear control are visible` |
| 6 | NG59 mislabelled as a cauda equina consensus statement | Misrepresents what a guideline supports; a reviewer checking the citation loses trust in the whole registry | Split into two correctly scoped entries. `NICE-NG59-REDFLAGS` supports the *content* of the safety screen only, with its exclusion of cauda equina and progressive deficit recorded in `keyExclusions`. `GIRFT-CES-PATHWAY` covers escalation. The emergency conclusion no longer cites NG59 | `no evidence entry claims to be a source it is not`; `safety evidence distinguishes screen content from escalation pathway` |
| 7 | 25 entries presented uniformly though most were unverified | An unverified citation that looks verified is worse than none | `verified: "verified" \| "unverified"` is now a required field with `verifiedOn`. Three entries are verified against source this session; 24 are marked unverified and must be shown with that caveat | `every entry declares a domain and a verification status`; `verified entries carry a verification date` |
| 8 | Injection response and pathway universally mandatory | Padding a "rapid" workflow with questions irrelevant to the visit | Base workflow reduced to **14** decision-critical confirmations. Injection and prior-treatment history are counted only when the clinician opts into management context; proposed pathway only when the visit includes procedure-specific review. Maximum 18 with all branches | `a routine rapid case needs 10-14 confirmations, 18 at most with branches`; `optional treatment context is not counted unless the visit includes it`; `optional treatment context does not block a preliminary synthesis` |
| 9 | Clinician agreement never asked | An instrumentation field that could never be populated | Post-synthesis control: Agree / Partly agree / Disagree / Unable to assess, writing the clinician's actual selection | `clinician agreement is asked, not assumed` |
| 10 | 60 duplicated CSS selectors | Unpredictable cascade; every fix risks regressing another screen | `scripts/consolidate-css.mjs` merges duplicate declarations property-by-property in source order, preserving the cascade for equal specificity. 329 selectors, zero duplicates, 27 at-rule blocks kept separate | `no major CSS selector is declared twice outside a media query` |
| 11 | Six inert schema fields | Implies coverage that does not exist | `docs/FIELD_DISPOSITIONS.md` documents each. `clinicianSuspectedRoot` **activated** as an independent impression compared against the derived candidate — and deliberately excluded from the derivation, since feeding it in and then reporting agreement would be circular. The other five are research-only with stated reasons | `every previously-inert field has a documented disposition`; `clinician impression is compared with the derived candidate, not fed into it` |
| 12 | Visual requirements unverified across three releases | Layout defects shipped unseen; nav tabs and the stepper overflowed the viewport at 768px and 390px | Chromium installed; `scripts/visual-check.mjs` asserts no page-level horizontal scroll, no element overflowing the viewport outside a deliberate scroller, no wrapped level labels, no empty cards, and touch targets ≥32px at four viewports. Responsive corrections applied and re-verified. Screenshots committed to `docs/screenshots/` | `verified breakpoint screenshots are present in the package`; `the verification chain includes visual checks and cannot pass them silently` |
| 13 | Orientation copy consumed a full mobile screen before the first question; a module band restated the scope question directly beneath it | Time cost on the workflow the tool exists to shorten | Module band removed; the three value pills hidden below 820px | Verified in the mobile capture |

---

## 3. Verification

```
npm run typecheck        clean
npm run test:engine      v29.0 engine and validation tests passed
npm run test:regression   104 regression tests passed
npm run build            compiled successfully
npm run test:visual      All visual checks passed at 1440 / 1024 / 768 / 390
bash scripts/verify.sh   exit 0
```

Screenshots: `docs/screenshots/{desktop-1440,tablet-landscape-1024,tablet-portrait-768,mobile-390}-entry.png`.

Fault injection previously confirmed the chain stops on failure and prints no success banner.
Visual checks fail the chain; they are skipped only via an explicit `SKIP_VISUAL=1`.

---

## 4. Deferred limitations

**Explicitly out of scope for this release:**

- No real EMR integration. No integration interface layer was added — item 13's mock adapter
  layer is **not done**. Adding empty interfaces that no caller uses would be scaffolding that
  looks like progress.
- No authenticated PHI storage. Drafts are unencrypted browser storage, opt-in, expiring.
- No prospective clinical validation. No rule is validated against adjudicated reference
  standards or outcomes. The candidate score (`sv*15 + support*10 − conflicts*12`) and the
  six-week durability cutoff remain design choices with no empirical basis.
- No proven time savings. Instrumentation now captures clinician-reported effect; nothing
  measured. No time-saving claim appears anywhere in the product.
- No systematic evidence review. 26 entries, 3 verified against source. Labelled *curated
  evidence supporting the current framework*.
- No cervical, thoracic, paediatric, deformity, tumour, infection or fracture module.

**Requested but not completed in this release — stated plainly rather than claimed:**

- **Item 3 scope pathways are only partially differentiated.** Serious pathology, complex
  postoperative/deformity, outside-localization and special-population now produce *distinct
  reasons* and paediatric age blocks adult treatment synthesis, but they do not yet route to
  four separate pathways with different downstream behaviour. Infection and pregnancy no longer
  read identically; they still land in one `out-of-scope` treatment state.
- **Item 7 Evidence tab is not yet registry-driven.** The registry now carries `domain` on
  every entry, which is the prerequisite, but the Evidence tab still renders hard-coded cards
  and the domain filters are not built. The case-specific synthesis evidence *is* fully
  registry-driven.
- **Item 11 adjudication semantics unchanged.** The reviewer form still offers
  "fusion rationale established / possible / not established". This contradicts the
  clinician-facing language and should be replaced with prespecified factor documentation plus a
  separate yes/no/unable question, along with blinding and review-context fields.
- **Item 12 component extraction not done.** `SpineDecisionApp.tsx` was not split into the
  thirteen named components. The CSS consolidation and breakpoint verification were done; the
  component refactor was not. It is the largest remaining piece of technical debt and carries
  real regression risk, which is why I did not attempt it in the same pass as the clinical fixes.
- **Item 9's remaining evidence domains** (EMG/NCS, dynamic radiography, anticoagulation,
  anaemia/nutrition, recurrent herniation, frailty, human factors) are not yet added. Given that
  24 existing entries are unverified, adding more unverified entries would worsen the registry's
  reliability. Verification should precede expansion.

---

## 5. How v29.0 serves the three goals

**Reduces physician work.** A routine rapid case is 14 confirmations, down from 18, because
injection history and procedure planning are no longer asked of every patient. The counter names
what remains and never counts a field the visit does not need. The focused motor screen asks for
one movement instead of implying a bilateral examination. On mobile the clinician reaches the
first question without scrolling past product copy.

**Catches what would be missed.** The Rapid motor fix removes a source of fabricated findings
that could have driven a false localization — and unlike a missing field, a fabricated grade is
invisible to the reader. `clinicianSuspectedRoot` adds a genuine do-not-miss check: when the
clinician's impression diverges from the derived candidate, that divergence is surfaced rather
than silently resolved. Paediatric age now blocks adult treatment output while safety
escalation continues.

**Improves communication and consistency.** The synthesis distinguishes a focused screen from a
full examination in the text a receiving clinician reads. The export can no longer promise
de-identification it does not perform. Every evidence entry now declares whether its citation
has been checked, so a reviewer knows which claims to trust — which matters more for a research
handoff than a larger number of entries would.
