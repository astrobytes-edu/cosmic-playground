# Physics Review — hydrostatic-equilibrium-explorer

**Date:** 2026-09-03
**Reviewer:** adversarial physics audit (full chain: model → logic.ts → main.ts → interaction → model)
**Verdict:** **Strongest physics in the repository.** One P3 consistency defect, otherwise verified.

## Verified correct

Every claim below was independently re-derived or numerically checked, not read off the source.

- **Sign of the HSE equation.** `dP/dr = −ρg` at lines 135, 213, 268, 299. Correct.
- **`m(r)` is genuinely the enclosed mass** and is integrated consistently with each `ρ(r)`. For the central-condensation toy, `ρ_c = 15M/(8πR³)` and `m(x) = ½M(5x³ − 3x⁵)` were re-derived by hand and satisfy `m(R) = M` exactly.
- **Both pressure profiles are the exact analytic integrals** of `−ρg` with `P(R) = 0`. Verified against a 2,000,001-point numerical integration from the surface inward:

  | model | x=0 | x=0.25 | x=0.5 | x=0.75 |
  |---|---|---|---|---|
  | uniform, rel. err | 0 | 0 | 0 | 4.2e-16 |
  | central toy, rel. err | 1.6e-13 | 1.5e-13 | 1.3e-13 | 2.7e-13 |

- **No ODE integration anywhere** — everything is closed form — so there is no step-size, stiffness, or convergence hazard to audit. No polytrope or Lane-Emden solution is used or claimed.
- **Central pressure is honestly scoped.** `centralPressureScaleDynePerCm2` is a bare `GM²/R⁴` with no coefficient, rendered as `P_c ∼ GM²/R⁴` and captioned "an order-of-magnitude support requirement, not the exact central pressure for every stellar structure". The exact toy-model centre is reported separately alongside the ratio. Verified: exact/scale = 0.11937 = 3/(8π) uniform, 0.29842 = 15/(16π) central toy, both to machine precision. **No coefficient is quoted that the model does not compute.**
- **Core-temperature scale** gives 14.33 MK for `M = R = 1, μ = 0.62` against the real solar 15.7 MK, and is labelled a *scale* everywhere, never a temperature.
- **The ideal-gas thermal bridge is never applied inside a degenerate state.** `T/T_F > 1` was checked at every corner of the slider domain (M ∈ [0.1, 30] M☉, R ∈ [0.1, 20] R☉), worst case 2.8 at (0.1, 0.1). This is a real correctness property, not an accident of the presets.
- **Local shell balance** `netForce = (P_in − P_out)A − ρg·dr·A` is identically zero at `supportFactor = 1`; under- and over-support give the correct sign. No sign bug.
- **Constants** (G, k_B, m_p, M☉, R☉) all match CODATA 2018 / IAU nominal.
- **Quiz answers check out**: the "half the radius" item claims 2⁴ = 16× from `P_c ∝ R⁻⁴`; verified numerically as 16.00×.

## Findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| HSE-1 | P3 | open | `hydrostaticEquilibriumModel.ts:367-374` floors `pressureOuter` at 0 without recomputing `pressureDifference`, so the invariant `P_in − P_out = dP` breaks for `r/R > 0.9705` — reachable at slider positions 98–100, where the UI reports a 400% "pressure contrast" and the force arrows disagree with the pressure labels. Fix: recompute `pressureDifference` after the clamp, or bound `shellThickness ≤ 2P(r)/(ρg)`. |
| HSE-2 | P3 | open | Export and station CSV cells carry raw LaTeX (`1.13 \times 10^{16}`) rather than machine-readable numbers (`main.ts:1092-1094`, `:1631-1652`). |
| HSE-3 | P3 | open | The constants block at `:32-38` has no provenance comments. |

No SI leakage: consistently CGS plus solar units, with units carried in field names and matching between compute, readout, and export (except HSE-2).
