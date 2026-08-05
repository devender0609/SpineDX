# Export privacy specification

## Terminology

The structured export is called **identifier-reduced**, never *de-identified*.

Removing the fields listed below reduces direct identifiers. It is not formal de-identification,
which requires review and approval under institutional privacy policy. A previous release
labelled this export "de-identified" while shipping the complete entered case, the full
adjudication record, reviewer IDs and free text — the label was false, and the kind of false
label that causes a file to be transmitted when it should not be.

## Modes

### Identifier-reduced research export

**Removed**

| Category | Fields |
|---|---|
| Direct identifiers | `studyId` |
| Free text | `patientGoal`, reviewer `rationale`, `disagreementReason`, `notes` |
| Reviewer identifiers | `reviewerId` on all three reviewer roles |
| Case and site identifiers | `caseId`, `siteCode` |
| Unfiltered state | `fullEnteredCase` is omitted entirely |

**Transformed**

Exact dates (`priorSurgeryDate`, `imagingDate`, `injectionDate`) are converted to relative
intervals ("~14 months before export"). No exact date is exported verbatim.

**Included**

Structured clinical variables, the derived synthesis, validation issues, the rule trace, and
the list of fields suppressed by rapid-mode projection.

**Residual re-identification risk**

A rare finding combination, an unusual age, or a small site cohort may still permit
re-identification. Institutional privacy review is required before release.

### Full research export

Requires explicit confirmation and displays:

> This file may contain sensitive or identifying clinical information. Use only within an
> approved secure research environment.

`formallyDeidentified` is `false` on **both** paths. No export claims formal de-identification.

## Pre-export review

Before either export, a modal lists the identifying fields that currently hold data. The list
and the stripping logic read from the same constants (`IDENTIFIABLE_CASE_FIELDS`,
`IDENTIFIABLE_ADJUDICATION_FIELDS`, `IDENTIFIABLE_REVIEWER_FIELDS`, `DATE_FIELDS`), so the list
shown to the user cannot drift from what is actually removed.

## Tests

`the identifier-reduced export actually strips every designated field` plants eight known
values across case, adjudication and reviewer fields and asserts none survive serialisation.
`the identifier-reduced export converts exact dates to relative intervals` asserts an exact
date does not appear. `no export is described as de-identified` scans both the UI and the
export module.
