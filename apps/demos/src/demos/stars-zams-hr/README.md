# HR Diagram Inference Lab (`stars-zams-hr`)

## Purpose
This lab teaches the H-R diagram as both:
- a measurement-built map (Observer CMD: `M_V` vs `(B-V)`), and
- an inference map for hidden physical variables (Theorist HR: `log(L/L_sun)` vs `log(T_eff)`).

It is now tuned for guided classroom use in both ASTR 101 and ASTR 201:
- `Guide mode` is on by default and adds lightweight region labels plus learning hints.
- Advanced population/evolution controls are grouped under collapsed experiment controls so first-time students can follow the core workflow first.

## Physical assumptions (explicit)
- Main-sequence stars use Tout et al. (1996) ZAMS fits in `@cosmic/physics`:
  - `L(M, Z)` and `R(M, Z)` from analytic metallicity-dependent relations.
  - `T_eff` from Stefan-Boltzmann closure.
- Main-sequence lifetime estimate for evolve tool:
  - `t_MS ~ 10 Gyr * (M/M_sun)^(-2.5)`.
- Post-main-sequence paths are conceptual mass-class templates:
  - `M < 8 M_sun`: MS -> (sub)giant -> white dwarf.
  - `M >= 8 M_sun`: MS -> supergiant -> compact remnant.
- Observer-space calibration:
  - `M_bol = 4.74 - 2.5 log10(L/L_sun)`.
  - `BC_V(T_eff)` from embedded empirical polynomial calibration.
  - `(B-V)(T_eff)` from embedded empirical color-temperature calibration.
- Synthetic photometric noise:
  - Deterministic Gaussian noise with seeded RNG.
  - Error scales with apparent magnitude derived from `distancePc`.
- Unresolved binaries:
  - `binaryFrac` controls binary mixing in observer space via flux-summed `V` and `B` bands.

## How to run
From repo root:

```bash
corepack pnpm -C apps/demos dev
```

Open the built demo route used by the site shell:
- `/play/stars-zams-hr/`

## Accessibility and mode-invariance guarantees
- Plot mode switching preserves the same underlying synthetic stars for fixed seed/settings; only plotted coordinates differ between CMD and HR views.
- The plot is keyboard-focusable (`Tab`), with directional selection (`Arrow` keys) and boundary jumps (`Home`/`End`) for star readouts without a mouse.
- Guide labels and tooltips are view-only; turning `Guide mode` on/off does not change the population or selected star.
- Blank numeric inputs recover to valid defaults/ranges on blur/change instead of leaving the UI in an invalid state.

## Manual staged-reveal verification
1. Leave `Guide mode` on, load the demo, and confirm `Start Here`, `Explore the Diagram`, `Selected Star`, `Experiment Controls`, and `Inference Log` appear in that order.
2. Switch Observer CMD <-> Theorist HR and verify the same selected star persists while axis guidance updates to brighter-up / hot-left wording.
3. Toggle radius lines in each mode; confirm the preference is preserved, the checkbox disables in observer mode, and overlays render only in theorist mode.
4. Toggle mass colors; verify the legend and point color mapping appear/disappear without changing the selected star readout.
5. Hover a few stars and confirm the tooltip follows the pointer with concise stage / temperature / luminosity readouts.
6. Click representative main-sequence, giant, and white-dwarf points; verify the selected-star card and plain-language interpretation update correctly.
7. Use `Young cluster`, `Old cluster`, `High binary fraction`, `Low metallicity`, and `Solar-like reference`; verify controls update predictably and claims are preserved.
8. Clear a numeric field such as `Distance`, `Photometric error`, or `Metallicity`, blur the field, and verify it snaps back to a valid finite value.
9. Drag `Cluster age` and `Binary fraction`; confirm slider, numeric box, and displayed current value stay synchronized and update the population reactively.
10. Run the evolve tool for `0.8` and `20 M_sun`; verify the higher-mass track has the shorter lifetime and a different post-main-sequence path.
11. Add at least three inference claims, use a sentence starter, export JSON, and validate that guide mode / preset metadata are present.
12. Resize to a narrower laptop-width viewport and verify the plot remains the visual anchor, cards stay readable, and controls do not overlap.
