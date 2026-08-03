# v28.1 Distinct Rapid Review Audit

## Problem corrected
The v28.0 mode toggle changed labels and hid only a small number of optional fields. Rapid and Comprehensive review therefore had nearly the same burden.

## Rapid review field set
Rapid review now uses grouped and conditional entry:
- Orientation: symptom pattern, side, duration, patient goal
- Safety: grouped cauda-equina warning, progressive weakness, grouped serious-pathology concern
- Assessment: two syndrome confirmations, SLR, conditional claudication triad, one most-concerning motor finding and reliability
- Imaging: source, one candidate level, zone, severity, image quality
- Plan: exercise/PT, medication, injection response, pathway under consideration

Positive safety findings expand their specific components. Injection target fields appear only when a response is recorded. Fusion consideration directs the user to Comprehensive review.

## Comprehensive review retained
The complete bilateral examination, multilevel imaging, advanced imaging, ODI/PROMIS, fusion factors, risk optimization, and research-quality fields remain available without loss of entered data.

## Output distinction
Rapid review generates a preliminary rapid synthesis. Comprehensive review generates the full clinical-imaging synthesis.

## Verification
- TypeScript/TSX syntax transpilation: passed
- Existing engine and validation test suite: passed
- Full local `npm run typecheck` and `npm run build`: required by installer
