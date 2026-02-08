# stars-zams-hr Migration Parity Audit

## 1) Behavior parity
- This is a net-new instrument, not a direct migration of a legacy Vite demo.
- Baseline behavior includes ZAMS inference (`M`, `Z` -> `L`, `R`, `Teff`) and H-R marker plotting, plus explicit override presets for non-ZAMS objects.

## 2) Visual/interaction parity
- Uses the standard Cosmic instrument shell (`cp-layer-instrument`, controls/stage/drawer triad pattern).
- Uses shared utility toolbar, popover links, station/help modes, chip presets, and token-only styling.

## 3) Export parity
- Uses `ExportPayloadV1` with explicit units and model-state annotations (`ZAMS inferred` vs `Override`).
- Copy-results output includes parameters (`M`, `Z`, mode), readouts (`Teff`, `L/Lsun`, `R/Rsun`), and model assumptions.

## 4) Pedagogical parity
- Aligns with Predict-Play-Explain workflow for ASTR 201 stellar structure and H-R instruction.
- Explicitly flags model limits and override presets to prevent silent misuse of ZAMS relations.

## 5) Intentional deltas
- Introduces Tout et al. (1996) metallicity-dependent ZAMS modeling across 0.1-100 Msun.
- Introduces direct H-R stage visualization tied to live model values.

## 6) Promotion recommendation
- Current recommendation: `experimental` until e2e classroom parity checks and launch-gate QA are complete.
