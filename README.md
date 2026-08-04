# SpineDx-Tx v28.4

Package version `0.28.4` · application version `28.4.0` · ruleset `LUMBAR-RULESET-1.9.0`

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

**Rapid review** — 18 mandatory confirmations covering safety screening, basic syndrome
classification, major discordance detection and preliminary localization. A live counter shows
how many confirmations remain. Output is labelled a *preliminary rapid synthesis* and states
that it is not a complete neurologic or multilevel imaging assessment.

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

Work is autosaved to browser local storage so a long Comprehensive assessment survives a
refresh. Free-text fields are stripped before saving. This is prototype storage: it is not
authenticated and makes no compliance claim.

## Running

```
npm install
npm run test        # engine + regression suites
npm run typecheck
npm run build
```

`bash scripts/verify.sh` runs the full chain and stops at the first failure.

On Windows, run `install-v28.4.ps1` from the extracted source folder. It verifies version
agreement, syncs the repository, copies the source, then runs install, engine tests,
regression tests, typecheck and the production build, checking `$LASTEXITCODE` after each.
It cannot print success after a failure.

## Documentation

- `docs/V28_4_RELEASE_AUDIT.md` — current release audit and issue table
- `docs/V28_3_CLINICAL_SAFETY_AUDIT.md` — prior clinical-safety audit
- `docs/current/` — validation protocol, data dictionary, evidence registry, intended use
