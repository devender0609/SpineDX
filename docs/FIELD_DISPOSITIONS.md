# Schema field dispositions

Every field previously flagged as inert now has an explicit, tested disposition. "Research-only"
means the field is retained in the export schema and the research workspace but is deliberately
excluded from clinical reasoning.

| Field | Disposition | Rationale |
|---|---|---|
| `clinicianSuspectedRoot` | **Activated** — comparison only | Compared against the derived candidate and surfaced as a contradiction when they differ. Deliberately excluded from the derivation itself: feeding a clinician's impression into the engine and then reporting agreement would be circular. It exists to compare clinician impression, framework candidate, and adjudicated reference standard. |
| `sexAtBirth` | **Research-only** | No rule in the current lumbar module uses it. Retained for cohort description in research export. Not shown in the clinical workflow. |
| `plannedSetting` | **Research-only** | Outpatient/inpatient does not affect localization, urgency, or fusion rationale. Retained for research description. |
| `coughSneezeProvokes` | **Removed from clinical reasoning; research-only** | A Valsalva-provocation history is weak and non-localizing. Retaining it as an engine input would imply a discriminative power it does not have. |
| `urinaryUrgencyAlone` | **Research-only, deliberately excluded from the safety screen** | Isolated urinary urgency without retention, sensory loss, or saddle change is non-specific and common. Including it in the emergency screen would raise false positives without adding sensitivity; the specific red flags are screened separately. |
| `synovialCyst` | **Research-only** | A cyst is captured through the zone-level severity grading that already drives candidate localization. A separate flag would double-count the same finding. |
