# Binary Orbits -- Physics Review

## Summary

The binary-orbits demo visualizes two stars in circular orbits about their common barycenter. It holds M1 = 1 Msun fixed and allows the user to vary the secondary ratio q = M2/M1 (with q <= 1) and orbital separation a (AU) on a log scale from 0.1 to 100 AU. The period is computed from Kepler's third law in teaching units, barycenter distances are computed from the mass ratio, and the two bodies are animated as counter-rotating dots on concentric circles. All physics equations were verified against standard references and found to be correct.

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| Kepler III (teaching units): P^2 = a^3 / (M1 + M2) | `twoBodyAnalytic.ts:89-94` -- `orbitalPeriodYrFromAuSolar({a, M}) = sqrt(a^3 / M)` | Standard Kepler III with G = 4pi^2 | CORRECT |
| Barycenter distance for m1: r1 = a * m2/(m1+m2) | `logic.ts:78` -- `r1 = sep * (m2 / total)` | Definition of center of mass | CORRECT |
| Barycenter distance for m2: r2 = a * m1/(m1+m2) | `logic.ts:79` -- `r2 = sep * (m1 / total)` | Definition of center of mass | CORRECT |
| Constraint: r1 + r2 = a | `r1 + r2 = sep*(m2/total) + sep*(m1/total) = sep*(m1+m2)/total = sep` | Verified algebraically | CORRECT |
| Angular velocity: omega = 2*pi/P | `logic.ts:73-75` -- `omegaRadPerYr = (2*PI)/periodYr` | Standard definition | CORRECT |
| Phase angle: phi(t) = omega * t_model | `main.ts:215` -- `phase = model.omegaRadPerYr * elapsedYears` | Uniform circular motion | CORRECT |
| Body positions: opposite sides of barycenter | `logic.ts:121-128` -- m1 at `(cx - r1*cos, cy - r1*sin)`, m2 at `(cx + r2*cos, cy + r2*sin)` | Bodies are 180 deg apart (opposite signs); both orbit the center (cx, cy) | CORRECT |
| Mass-to-radius visual scaling: R = base * (1 + 0.25*log10(m+1)) | `logic.ts:108` -- `base * (1 + 0.25 * Math.log10(mass + 1))` | Log scaling for visual cue only (not physical); equal masses give equal radii; larger mass gives larger dot. Physically reasonable display choice | CORRECT (visual) |
| Pixel scale: ppu = 0.38 * min(w,h) / max(r1, r2) | `logic.ts:141-143` -- `pixelsPerUnit(r1, r2, w, h)` | Ensures the larger orbit fits within 38% of canvas | CORRECT (layout) |
| Total mass: M_total = M1 + M2 = 1 + q | `logic.ts` -- `total = m1 + m2` where `m1 = 1`, `m2 = mr` | Used for Kepler III period calculation | CORRECT |
| Orbital speeds: v1 = omega * r1, v2 = omega * r2 | `logic.ts` -- `v1AuPerYr`, `v2AuPerYr` | Uniform circular motion speed definition | CORRECT |

## Rendering Chains Audited

**Parameters -> Model -> Canvas rendering:**

1. UI sliders produce `(massRatio, separationAu)`. Mass ratio is clamped to [0.1, 1.0], separation to [0.1, 100] AU (log scale).
2. `computeModel()` computes `m1=1`, `m2=q`, `total=1+q`, period via `orbitalPeriodYrFromAuSolar({a, total})`, omega, and barycenter distances `r1 = a*m2/total`, `r2 = a*m1/total`.
3. `pixelsPerUnit()` scales the larger orbit to 38% of the canvas dimension.
4. `bodyPositions()` places m1 and m2 on opposite sides of the canvas center at distances `r1*ppu` and `r2*ppu` from center, at the current phase angle. The signs are correct: m1 is at `(-r1*cos(phi), -r1*sin(phi))` relative to center, m2 is at `(+r2*cos(phi), +r2*sin(phi))` relative to center. This ensures they are always diametrically opposite as required for a two-body circular orbit.
5. Animation supports two modes: normalized (fixed 20 s cycle) and physical (`yearsPerSecond = 0.06`, `phase = omega * elapsedYears`). Physics readouts are unchanged across both modes.

**Physical consistency checks:**

- Equal masses (q=1): r1 = r2 = a/2, both orbits have equal radius. Verified.
- Unequal mass ratio (q=0.2): m2 = 0.2 Msun, r1 = a/6, r2 = 5a/6. The lighter secondary has the larger orbit, which is physically correct.
- Period check: For a = 4 AU, M_total = 2 Msun: P = sqrt(64/2) = sqrt(32) = 5.66 yr. This is the correct Keplerian result.
- Shared-period check: both bodies share one orbital period (`P1 = P2`) even when speeds differ (`v1/v2 = r1/r2 = q`).

## Issues Found

None. The barycenter calculation, period computation, angular velocity, and rendering are all physically correct. The body positions are correctly placed on opposite sides of the barycenter. The only simplification is that orbits are assumed circular (e = 0), which is stated explicitly in the help text and export notes as an intentional pedagogical choice.
