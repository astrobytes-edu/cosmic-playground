# Physics Review — galaxy-rotation

**Date:** 2026-09-03
**Reviewer:** adversarial physics audit (full chain: model → logic.ts → main.ts → interaction → model)
**Verdict:** Component physics **verified correct**. One P1 presentation defect: the demo's headline "dark matter gap" is partly a formula artifact.

## Verified correct

Independently re-derived and numerically spot-checked:

- **Hernquist bulge**, **exponential (Freeman) disk** including all four Numerical-Recipes Bessel fits, and the **NFW halo** `f(x)/f(c)` mass profile.
- `G_GALAXY`, `ρ_crit = 126.08 M☉/kpc³`, `a₀ = 3703 (km/s)²/kpc`, `λ₂₁ = 211.06 mm`, Planck-2018 cosmology.
- Milky Way preset: `r_vir = 218 kpc`, `c = 10.2`, `V(8 kpc) = 217 km/s` — all consistent with the literature.
- The exact Freeman disk `v_c` is used for the total curve (not a spherical approximation).
- Bessel cancellation degrades only for `y = R/2R_d > 100`; the sliders cap `y ≤ 25`, so it is latent, not live.
- No SI leakage; no reachable numerical hazard.

## Findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| GR-1 | **P1** | **open** | The "visible matter only" benchmark (`galaxyRotationModel.ts:401-404`) is built as a *spherical* `√(G M_vis(<R)/R)` while the total curve uses the *exact Freeman disk*. `main.ts:714-733` shades the gap between them as the evidence for dark matter. With the `no-dark-matter` preset (halo mass = 0) the band still reaches **22.1 km/s (13.2%) at R = 7 kpc**, and the two curves cross at 2.35 kpc so the fill polygon self-intersects — while the `M_dark` readout correctly reads 0.000 at the same moment. Plot and readout contradict each other. **Fix:** build the benchmark as `hypot(v_bulge, v_disk)` and add a test asserting `V_total === V_visible` when `haloMass10 = 0`. |
| GR-2 | P2 | open | `M_dark = V²R/G − M_vis` as displayed does not reproduce the demo's own readout (+47.6% at 5 kpc, +36.3% at 8 kpc for the MW preset). Same root cause as GR-1. |
| GR-3 | P2 | open | MOND label vs. code: `index.html:241,359` claim the deep-MOND limit `(G M a₀)^(1/4)`; `main.ts:768` plots the full simple-ν interpolation. They differ by 24% at 8 kpc and 55% at 2 kpc. `vMondDeepKmS` is dead code. `logic.ts:229` already says "full interpolation", contradicting the HTML. |
| GR-4 | P2 | open | A **face-on** disk schematic (`main.ts:530-570`, caption `index.html:202`) carries a blueshift/redshift slit. A face-on disk has zero line-of-sight velocity — this teaches the exact misconception the demo exists to correct. Show an inclined disk, or relabel the schematic. |
| GR-5 | P3 | open | The seven constants at `galaxyRotationModel.ts:254-261` are numerically correct but carry no provenance comments. |

## Recommendation

GR-1 should be fixed before this demo is promoted past `candidate`. The other findings are labelling and can follow.
