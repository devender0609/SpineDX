# SpineDx-Tx v29.0

Package version `0.29.0` · application version `29.0.0` · ruleset `LUMBAR-RULESET-2.0.0`

A clinician-facing lumbar/lumbosacral clinical–imaging reconciliation prototype.

It does not diagnose, select surgery, recommend fusion, or predict outcomes. It helps a
physician or advanced practice clinician review a lumbar case more quickly and more
consistently, and it makes the boundaries of what was actually reviewed explicit.

**Not clinically validated.** No prospective evaluation, no EMR integration, no authenticated
storage. Do not enter directly identifying patient information.

## Clinical scope

Adult lumbar/lumbosacral assessment only:

- lumbar radicular symptoms; L4, L5 and S1 localization
- L3–4, L4–5 and L5–S1 imaging; central, lateral-recess and foraminal disease
- lumbar disc-related radiculopathy and neurogenic claudication
- clinical–imaging concordance and discordance
- initial decompression-target review
- separate documentation of fusion-rationale factors
- safety screening and perioperative optimization context
- optional ODI and PROMIS baselines (Comprehensive only)
- research adjudication and evidence traceability

There is no cervical, thoracic, paediatric, deformity, tumour, infection or fracture module.
The first question of every assessment confirms whether the case is primarily
lumbar/lumbosacral. Answering *No* or *Uncertain* keeps safety documentation available and
withholds lumbar localization, decompression, fusion and treatment synthesis.

## Two modes

**Rapid review** — **14 mandatory confirmations** for a routine case, 18 at most once optional
branches are opened. Covers safety screening, basic syndrome classification, major discordance
detection and preliminary localization. A live counter shows how many remain; optional fields
are never counted. Output is labelled a *preliminary rapid synthesis* and states that it is not
a complete neurologic or multilevel imaging assessment.

The Rapid motor screen records **one movement on one side** in a dedicated structure. It never
writes graded Comprehensive muscle values: a single "L5 weakness" observation is not evidence
that ankle dorsiflexion and great-toe extension were each tested, and one side says nothing
about the other.

**Comprehensive review** — full bilateral neurologic examination, multilevel imaging matrix,
level-specific fusion rationale, perioperative optimization, ODI and PROMIS, and the research
workspace.

Rapid mode is enforced by an allowlist projection, not by hiding fields. Comprehensive answers
are preserved when you switch, but they are excluded from the rapid engine input, so hidden
data cannot influence a rapid conclusion. A notice tells you how many fields are held back.

Comprehensive review is *suggested* — never forced — for prior lumbar surgery, fusion
consideration, progressive or severe deficit, limited image quality, a competing explanation,
or more than one relevant level.

## Drafts

Draft storage is **off until you opt in** on that browser, with a session-only alternative.
When enabled, free-text and identifier-capable fields are stripped before writing, drafts
expire after 24 hours, storage status and last-save time are always visible, and a saved draft
is never restored without pressing Resume. Adjudication data and research notes are never
written to a draft.

Prototype browser storage. Not approved for PHI or shared clinical workstations.

## Research export

Two explicit options behind a pre-export review that lists the identifying fields currently
holding data. The **structured de-identified export** actually removes study ID, patient goal,
case ID, site code, reviewer IDs, rationale, disagreement reason and notes, and omits the
unfiltered form state entirely. The **full export** requires confirmation and is labelled as
possibly containing identifiers. Nothing is labelled de-identified unless the code stripped it.

## Running

```
npm install
npm run test        # engine + regression suites
npm run typecheck
npm run build
npm run test:visual # requires a running server; see scripts/verify.sh
```

`bash scripts/verify.sh` runs the full chain — typecheck, engine tests, regression tests,
production build, then visual checks at 1440 / 1024 / 768 / 390 against a real server — and
stops at the first failure. Set `SKIP_VISUAL=1` where no browser is available; it is skipped
loudly, never silently passed.

On Windows, run `install-v29.0.ps1` from the extracted source folder. It verifies version
agreement, syncs the repository, copies the source, then runs install, engine tests,
regression tests, typecheck and the production build, checking `$LASTEXITCODE` after each.
It cannot print success after a failure.

## Documentation

- `docs/V29_0_RELEASE_AUDIT.md` — current release audit and issue table
- `docs/screenshots/` — verified captures at 1440 / 1024 / 768 / 390
- `docs/V28_4_RELEASE_AUDIT.md` — prior release audit
- `docs/V28_3_CLINICAL_SAFETY_AUDIT.md` — prior clinical-safety audit
- `docs/current/` — validation protocol, data dictionary, evidence registry, intended use
