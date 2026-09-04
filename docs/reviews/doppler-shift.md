# Physics Review — doppler-shift

**Date:** 2026-09-03
**Reviewer:** adversarial physics audit (full chain: model → logic.ts → main.ts → interaction → model)
**Verdict:** Model **verified correct**. Two presentation defects found, one fixed here, one open.

## Chain traced

`packages/physics/src/dopplerShiftModel.ts` → `apps/demos/src/demos/doppler-shift/logic.ts` → `main.ts` rendering → slider/preset interaction → back to the model.

## Verified correct

- **Signs and conventions.** Recession is positive `v_r`, giving `λ_obs > λ_rest` and `z > 0`; approach is negative. Consistent between model, readouts, and the spectrum rendering.
- **Relativistic and classical branches.** Both formulas are correct, the `|β| ≥ 1` guards are present and return `NaN` rather than a complex result, and `formulaDivergencePercent` correctly compares the two.
- **`c = 299792.458`** is valid as both km/s and nm·THz, which is why the same literal appears in both roles.
- **Numerical hazards.** No reachable division by zero, square root of a negative, or `NaN` propagating into rendering.
- **Units.** No SI leakage. Wavelengths in nm, velocities in km/s, frequencies in THz, labelled consistently in UI and export.
- **Rest wavelengths** now agree with `packages/data-spectra` and with `spectralLineModel` after the Rydberg correction (see `docs/reviews/spectral-lines.md`).

## Findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| DS-1 | P2 | **open** | The wave-diagram arrow is inverted. `main.ts:845-862` anchors it at the source and points it *toward* the observer for redshift, beneath a caption reading "source receding →". |
| DS-2 | P2 | **open** | Cosmological redshift is presented as kinematic velocity. Presets Coma (cz = 6925 km/s), 3C 273 (z = 0.158) and "High-z galaxy" (z = 2) run through the special-relativistic inverse into a readout labelled "Radial velocity v_r"; z = 2 displays 239,834 km/s. The demo's own card states it does not model cosmological expansion. Either relabel these presets as redshift-only or add an explicit note that the SR conversion is not the correct interpretation for cosmological z. |
| DS-3 | P2 | **fixed** | Element catalogue wavelengths are *air* values but two strings described them as vacuum (`index.html:286`, `logic.ts:554`). Both now state air for catalogues and vacuum for Bohr-model hydrogen. |

## Notes for the next reviewer

`shiftLines` accepts `ShiftLineInput` whose `label` is now optional, matching `ElementLineEntry`. The demo only draws a label when one exists.
