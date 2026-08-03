# SpineDx-Tx v27.2 — Lumbar-only clinical module

This build removes cervical, thoracic, multiregion, and nonspinal selections from the clinician workflow. The active module is fixed to lumbar/lumbosacral so the interface cannot imply unsupported region-specific logic.

The underlying schema retains region provenance only for backward-compatible research imports; new clinical cases initialize as lumbar/lumbosacral.
