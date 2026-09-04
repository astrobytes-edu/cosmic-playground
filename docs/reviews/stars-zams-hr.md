# Physics Review — stars-zams-hr

**Date:** 2026-09-03
**Reviewer:** adversarial physics audit (full chain: model → logic.ts → main.ts → interaction → model)
**Verdict:** ZAMS physics **verified correct**. Two calibration-domain defects found and **fixed**; two post-main-sequence defects remain open.

## Verified correct

- All **16 Tout et al. (1996) coefficient sets**, checked row by row.
- **Torres (2010) BC_V**: all 13 coefficients across 3 branches.
- **Ballesteros** `T(B−V)`: reproduces `B−V = 0.65 ↔ 5778 K`.
- **Salpeter inverse-CDF** sampling.
- HR and CMD axes invert correctly in both modes (hot to the left, bright upward).
- Solar sanity: this is a *ZAMS* model, so a 1 M☉ star correctly lands at L = 0.698, R = 0.888, T = 5597 K — **not** present-day L = R = 1, T = 5772 K. That is right, not a bug.
- No SI leakage.

## Findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| HR-1 | **P1** | **fixed** | `bminusVFromTeffK` bisected on the bracket `[-0.4, 2.2]`, whose Ballesteros temperatures span only 2975–21707 K, while `T_eff` was clamped to 2800–42000 K. Unreachable targets silently returned a bracket endpoint, pinning **102 of 400** stars at exactly `B−V = 2.2` — which is also `OBSERVER_AXIS_LIMITS.colorMax`. The target is now clamped into the bracket's own reachable range; cool pinning is zero and only genuinely-hotter-than-Ballesteros stars saturate (< 2%), which is physical. |
| HR-2 | **P1** | **fixed** | The Torres BC_V polynomial is valid for `log T ≥ 3.5` (3162 K) and diverges below it: `BC_V(2600 K) = −9.38` against a real value near −3, `BC_V(3000 K) = −5.01` against ≈ −2.7. Since `M_V = M_bol − BC_V` this pushed the coolest dwarfs several magnitudes too faint, off the bottom of the frame. Clamped to the validity floor; the faintest now land at `M_V ≈ 16.1`, correct for 0.1 M☉ M dwarfs (Proxima Centauri is 15.6). |
| HR-3 | **P1** | **fixed** | `cmdCoordinates` clamped out-of-range stars to `[0,1]` rather than culling, stacking roughly 88 of 320 on a single corner pixel where they were individually unselectable. It now reports `inFrame`; `main.ts` culls, and the plot caption states how many were dropped. Axis limits were also too tight for a Salpeter population (median `B−V ≈ 2.0`) and are widened to `colorMax 2.5 / mvFaint 17`. |
| HR-4 | P2 | open | Two divergent copies of the post-main-sequence model: `stageProperties` (`hrInferencePopulationModel.ts:234-313`) versus an inline `buildEvolutionTrack` (`main.ts:311-428`) with different coefficients for every phase. The track's main sequence is `L = L_ZAMS(0.72 + 0.85f)`, so at `t = 0` the evolve marker sits **28% below the population's own main sequence**. The inline copy also violates the "no inline physics" rule in `CLAUDE.md`. |
| HR-5 | P2 | open | `#evolveTime` has `step="0.001"` Gyr fixed in HTML while `main.ts:907-910` updates only `max`. For the offered 20 M☉ option `t_MS = 0.00559 Gyr`, giving 7 slider positions total and **exactly one** in the post-MS phase — the supergiant/remnant track is effectively unreachable. The demo's own README asks students to run 20 M☉. |
| HR-6 | P3 | open | `t_MS = 10 M^-2.5` is inconsistent with the Tout luminosity used elsewhere (≈7× short at 50 M☉). Disclosed in the demo README. |
| HR-7 | P3 | open | `sampleMassMsun` at `u = 0` returns 0.09999999999999999, just below the 0.1 M☉ validity floor, yielding a NaN star with probability ≈ 2⁻³² per draw. |

## Recommendation

HR-4 and HR-5 should be fixed before this demo is promoted past `experimental`: the evolution track is a headline feature and is currently both inconsistent with the population and largely unreachable at high mass.
