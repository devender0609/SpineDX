# v19 implementation

- Expanded synthetic cohort: 300,000 records.
- Train/holdout: 240,000/60,000.
- Added patient risk, comorbidity, prior surgery, and planned procedure variables.
- Added six research-only synthetic risk classifications.
- Replaced the v18 surrogate engine with the v19 shallow-tree models.
- Full data are distributed separately as a compressed CSV to keep the application build small.
