# HR Diagram Inference Lab (`stars-zams-hr`)

## Purpose
This lab teaches the H-R diagram as both:
- a measurement-built map (Observer CMD: `M_V` vs `(B-V)`), and
- an inference map for hidden physical variables (Theorist HR: `log(L/L_sun)` vs `log(T_eff)`).

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

## Manual staged-reveal verification
1. Switch Observer CMD <-> Theorist HR and verify axis behavior and persistent badges.
2. Toggle radius lines in each mode; confirm overlays render only in theorist mode.
3. Toggle mass colors; verify legend and point color mapping appear/disappear.
4. Run evolve tool for `0.8` and `20 M_sun`; verify shorter lifetime and different post-MS behavior at high mass.
5. Click representative MS, giant, and WD points; verify readout card (`L`, `T_eff`, inferred `R`, mass only when revealed).
6. Add at least three inference claims; export JSON and validate shape/content.
7. Generate twice with same seed and controls; verify identical population arrangement.
