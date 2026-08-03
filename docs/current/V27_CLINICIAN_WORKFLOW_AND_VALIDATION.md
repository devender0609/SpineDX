# v27 Clinician Workflow and Data Integrity

## Purpose
Reduce form burden without removing clinical detail. Core fields are visible; advanced examination, imaging, fusion, risk, and research fields appear only when relevant.

## Validation behavior
- **Error:** impossible or contradictory data that block synthesis.
- **Warning:** unusual or clinically discordant data requiring clinician acknowledgment.
- **Advisory:** optional information that may improve interpretation.

The application never silently changes clinical data. It identifies the inconsistency and asks the clinician to confirm or correct it.

## Major workflow changes
- Direct primary-region selection replaces indirect cervical/thoracic exclusion questions.
- Scope is derived from age, region, phenotype, history, and imaging.
- Radiculopathy and claudication fields appear conditionally.
- Only selected potentially relevant imaging levels expand.
- Fusion fields appear only for fusion pathways and only for proposed levels.
- Research adjudication is separated from the clinical workspace.
- Results prioritize urgency, syndrome, localization, uncertainty, next step, and fusion rationale.
