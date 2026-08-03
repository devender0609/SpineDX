# SpineDx-Tx v27.2 — Lumbar-only clinical module

This build removes cervical, thoracic, multiregion, and nonspinal selections from the clinician workflow. The active module is fixed to lumbar/lumbosacral so the interface cannot imply unsupported region-specific logic.

The underlying schema retains region provenance only for backward-compatible research imports; new clinical cases initialize as lumbar/lumbosacral.


## v27.6.2 responsive layout fix
- Restores a full-width six-step navigator above the assessment content on desktop.
- Uses a two-row grid on tablets and a full-width horizontal scroller on small screens.
- Removes the accidental narrow left sidebar layout.
- Fixes concise-summary urgency typing.
- Shortens orientation guidance and scope wording.
