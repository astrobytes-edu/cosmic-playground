# Kepler's Laws UX Hardening (2026-03-03)

## What Changed
- Added a new **Friendly / Advanced** readout split to reduce cognitive load for first-time users while preserving full technical readouts in Advanced mode.
- Promoted **Kepler 2: Equal areas** into a dedicated callout section with stronger visual emphasis and an animated wedge cue (reduced-motion safe).
- Added a **Concept focus** selector (`Kepler 2`, `Energy`, `Kepler 3`) that subtly de-emphasizes unrelated UI groups.
- Clarified controls with short explanatory copy and accessible tooltip triggers for:
  - Kepler vs Newton mode differences
  - Mean anomaly as a time proxy
- Improved period-scaling scaffolding with:
  - log-scale labeled ticks for semi-major axis
  - dynamic scaling hint (`P ∝ a^(3/2)` + `ΔP ×...` vs previous value)
- Added conservation drift messaging:
  - Kepler mode reports analytic near-zero expectation
  - Newton mode reports signed percent drift for `Δε` and `Δh`
- Refreshed station mode text to a hypothesis -> test -> evidence workflow.

## Why This Improves Learning / UX
- The default Friendly mode front-loads the three most pedagogically useful observables (`r`, `v`, `P`) and removes advanced clutter.
- Equal-areas discoverability now happens in the main controls flow rather than being buried in generic overlays.
- Concept focus creates an intentional attention path, which supports novice learners and station pacing.
- Explicit mode and mean-anomaly wording reduces common misconceptions around what is being solved analytically versus interpreted geometrically.

## Known Limitations
- Conservation drift values in Newton mode are descriptive and threshold-free (no auto warning state yet).
- Concept-focus de-emphasis is visual only; it does not lock controls or constrain interactions.
- Numeric notation controls apply to readouts, but export formatting remains stable and schema-compatible.
