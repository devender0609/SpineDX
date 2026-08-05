# Draft storage specification

**Prototype browser storage. Not approved for PHI or shared clinical workstations.**

## Modes

Off by default. The clinician chooses explicitly; there is no implicit save.

| Mode | Store | Lifetime | Use |
|---|---|---|---|
| Do not save | none | — | Shared or public workstation |
| This session only | `sessionStorage` | Cleared by the browser when the tab closes | Shared clinical workstation |
| Local draft, 24 hours | `localStorage` | Expiry enforced on read | Personal device, long Comprehensive assessment |

Session mode uses `sessionStorage` rather than a flag over `localStorage`, so the browser
itself guarantees the lifetime. A timer would not survive a crash; tab closure does.

Switching modes removes any copy from the other store, so a draft cannot survive in
`localStorage` after the clinician downgrades to session-only.

## What is written

Stripped before writing: `studyId`, `patientGoal`, and every other free-text field.
Never written: adjudication data, reviewer identifiers, research notes, exact dates.

## Behaviour

- Storage mode and last-save time are always visible in the header strip.
- A saved draft is **never** restored automatically. The clinician presses **Resume**.
- **Clear draft** is available at all times and requires confirmation before deletion.
- Local drafts older than 24 hours are discarded on read rather than offered.
- No HIPAA or compliance claim is made anywhere in the product.

## Tests

Three modes and their stores; store isolation on mode switch; expiry applying to local drafts
only; refusal to write when off; no silent restore; no adjudication data in the payload;
identifier stripping.
