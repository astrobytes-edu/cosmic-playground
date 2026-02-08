# Kepler's Laws -- Physics Review

## Summary

The keplers-laws demo implements a planar two-body Keplerian orbit sandbox with correct physics throughout the model layer. The Kepler equation solver uses Newton's method with bisection fallback, the vis-viva equation is correctly applied, velocity components are properly derived from perifocal coordinates, and conservation quantities (energy, angular momentum, areal velocity) are self-consistent. One confirmed coordinate-convention discrepancy exists between the SVG rendering (x-mirrored) and the Canvas rendering (standard orientation), which is a known cosmetic issue documented in MEMORY.md. All preset orbital elements match published values to sufficient precision for a teaching demo.

## Rendering Chains Audited

| Chain | Forward mapping (physics to screen) | Inverse mapping (screen to physics) | Verdict |
|-------|--------------------------------------|--------------------------------------|---------|
| **M -> theta -> (r, theta) -> SVG** | `meanToTrueAnomalyRad` -> `orbitalRadius` -> `orbitalToSvg` (negates x: `xOrb = -r*cos(theta)`, flips y: `y = cy - yOrb*scale`) | `getAngleFromEvent`: `atan2(cy - svgY, cx - svgX)` correctly inverts the x-negate convention | CORRECT |
| **Orbit ellipse (SVG)** | `updateOrbitPath`: ellipse center offset by `+c` (focus-to-center), `rx = a*scale`, `ry = b*scale` | N/A (no inverse) | CORRECT |
| **Canvas planet dot** | `drawOrbitCanvas`: `px = cx + r*cos(theta)*scale`, `py = cy - r*sin(theta)*scale` -- uses standard math convention (NO x-negate) | N/A | X-MIRROR vs SVG (known, cosmetic) |
| **Velocity vector** | `vx = -stateAtM.vxAuPerYr`, `vy = stateAtM.vyAuPerYr`, endpoint: `(pos.x + vx*vScale, pos.y - vy*vScale)` -- negates vx to match SVG x-mirror | N/A | CORRECT |
| **Force vector** | Direction from planet toward star via `atan2(cy - pos.y, cx - pos.x)` -- purely geometric, always points toward focus | N/A | CORRECT |
| **Equal-areas wedge** | Sweeps from `startTheta` to current `thetaRad`, sampling `r(theta)` via full Kepler solve at each point, all passed through `orbitalToSvg` | N/A | CORRECT |
| **Apsides markers** | Perihelion at `cx - (rx - c)`, aphelion at `cx + (rx + c)` -- distances labeled `a(1-e)` and `a(1+e)` | N/A | CORRECT |
| **Foci markers** | Focus 1 (star) at `cx`, Focus 2 at `cx + 2c` | N/A | CORRECT |
| **Drag interaction** | `getAngleFromEvent` -> `trueToMeanAnomalyRad` -> update M and t | N/A | CORRECT |

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| **Kepler's equation**: `E - e*sin(E) = M` | Newton's method (`E0 = M` for `e <= 0.8`, `E0 = pi` for `e > 0.8`), tol `1e-12`, max 15 iter; bisection fallback on `[0, 2pi)` | Standard; initial guess heuristic matches Danby (1988) recommendation | CORRECT |
| **True anomaly from E**: `cos(theta) = (cos(E) - e) / (1 - e*cos(E))`, `sin(theta) = sqrt(1-e^2)*sin(E) / (1 - e*cos(E))` | `meanToTrueAnomalyRad` in twoBodyAnalytic.ts lines 74-77 | Bate, Mueller & White (1971) eq. 4.2-12 | CORRECT |
| **Orbital radius**: `r = a(1-e^2) / (1 + e*cos(theta))` | `orbitalRadius` in twoBodyAnalytic.ts line 37 | Conic equation | CORRECT |
| **Vis-viva**: `v = sqrt(mu * (2/r - 1/a))` | `visVivaSpeedAuPerYr` in twoBodyAnalytic.ts line 120 | Standard vis-viva equation | CORRECT |
| **Kepler's 3rd law**: `P = sqrt(a^3 / M)` | `orbitalPeriodYrFromAuSolar` in twoBodyAnalytic.ts line 93, with `mu = 4*pi^2 * M` | P^2 = a^3/M in AU/yr/Msun units | CORRECT |
| **Velocity components (perifocal)**: `v_r = (mu/h)*e*sin(theta)`, `v_theta = (mu/h)*(1 + e*cos(theta))` | keplersLawsModel.ts lines 128-133 | Battin (1987) eq. 3.19 | CORRECT |
| **Rotation to Cartesian**: `vx = v_r*cos(theta) - v_theta*sin(theta)`, `vy = v_r*sin(theta) + v_theta*cos(theta)` | keplersLawsModel.ts lines 135-136 | Standard polar-to-Cartesian | CORRECT |
| **Specific angular momentum**: `h = sqrt(mu * a * (1 - e^2))` | `specificAngularMomentumAu2YrFromOrbit` in twoBodyAnalytic.ts line 158 | Standard orbital mechanics | CORRECT |
| **Specific energy**: `eps = v^2/2 - mu/r` | `specificEnergyAu2Yr2` in twoBodyAnalytic.ts line 146 | Standard two-body energy | CORRECT |
| **Areal velocity**: `dA/dt = h/2` | `arealVelocityAu2Yr` in twoBodyAnalytic.ts line 163 | Kepler's 2nd law | CORRECT |
| **Gravitational acceleration**: `a_grav = mu / r^2` | keplersLawsModel.ts line 144 | Newton's law (test particle limit) | CORRECT |
| **Mean anomaly from time**: `M = 2*pi*(t/P) mod 2*pi` | `meanAnomalyRadFromTime` in logic.ts line 21 | Definition of mean anomaly | CORRECT |
| **E from theta (inverse)**: `cos(E) = (e + cos(theta)) / (1 + e*cos(theta))`, `sin(E) = sqrt(1-e^2)*sin(theta) / (1 + e*cos(theta))` | `trueToEccentricAnomalyRad` in twoBodyAnalytic.ts lines 46-51 | Inverse of theta(E) | CORRECT |
| **M from theta (inverse)**: `M = E - e*sin(E)` | `trueToMeanAnomalyRad` in twoBodyAnalytic.ts lines 55-57 | Kepler's equation (forward) | CORRECT |

## Coordinate Convention Audit

1. **Physics model (keplersLawsModel.ts)**: Standard math convention. `xAu = r*cos(theta)`, `yAu = r*sin(theta)`. Theta = 0 at perihelion, increases counterclockwise. **Consistent internally.**

2. **SVG rendering (orbitalToSvg)**: x-mirrored. `xOrb = -r*cos(theta)`, so perihelion (theta=0) appears to the LEFT of the star in SVG space. y is flipped for SVG y-down: `y = cy - yOrb*scale`. The ellipse center is offset by `+c` (positive SVG-x), which correctly places the geometric center to the right of the focus when perihelion is to the left. **Consistent with the x-negate convention.**

3. **SVG drag inversion (getAngleFromEvent)**: Uses `atan2(cy - svgY, cx - svgX)`. The `cx - svgX` term correctly inverts the x-negate in `orbitalToSvg`. If the planet is to the left (negative SVG-x offset from center), then `cx - svgX > 0`, yielding `theta ~ 0` (perihelion). **Correctly inverts the forward mapping.**

4. **Canvas rendering (drawOrbitCanvas)**: Uses standard math convention: `px = cx + r*cos(theta)*scale`, `py = cy - r*sin(theta)*scale`. This places perihelion to the RIGHT of the focus. **This is mirrored relative to the SVG rendering.** The Canvas serves only as a background overlay for the planet trail dot; since the SVG orbit path and interactive elements (planet, foci, apsides, vectors, wedge) all use the same x-negate convention consistently, the Canvas mirror is cosmetic and does not affect physics correctness. This is a known issue (documented in MEMORY.md as "keplers-laws Canvas orbit rendering mirrors x relative to SVG").

5. **Velocity vector rendering**: `vx` is negated (`-stateAtM.vxAuPerYr`) before applying to SVG, and `vy` is applied with a y-flip (`pos.y - vy*vScale`). This correctly mirrors the velocity into the same SVG convention as the position. At perihelion (theta=0), the physics model gives `vy > 0`, so the SVG arrow points upward (negative SVG-y direction), which is physically correct for counterclockwise orbit. **Consistent.**

6. **Force vector rendering**: Purely geometric -- direction from planet SVG position toward star SVG position via `atan2`. Always points toward the focus regardless of convention. **Convention-independent.**

7. **Apsides placement**: Perihelion at `cx - (rx - c)` = left side (smaller SVG-x). Aphelion at `cx + (rx + c)` = right side. This matches the x-negate convention where theta=0 (perihelion) maps to the left. **Consistent.**

8. **Focus placement**: Star at `cx` (one focus), empty focus at `cx + 2c`. Since the ellipse center is at `cx + c`, the empty focus is at distance `c` to the right of center, and the star is at distance `c` to the left of center. For `orbitalToSvg`, perihelion (`theta=0`, `r = a(1-e)`) maps to `cx + (-(a(1-e))) * scale/a_max = cx - (1-e)*scale`, which is to the left of the star. The aphelion maps to `cx + a(1+e)*scale/a_max`, which is to the right. The geometric center of the ellipse should be at `cx + ae*scale/a_max = cx + c`, matching the SVG ellipse `cx` attribute. **Consistent.**

## Preset Values Audit

| Preset | a (AU) | e | Physical reference | Verdict |
|--------|--------|---|-------------------|---------|
| Mercury | 0.387 | 0.206 | NASA: a=0.387 AU, e=0.2056 | CORRECT (rounded) |
| Venus | 0.723 | 0.007 | NASA: a=0.723 AU, e=0.0068 | CORRECT (rounded) |
| Earth | 1.0 | 0.017 | NASA: a=1.000 AU, e=0.0167 | CORRECT (rounded) |
| Mars | 1.524 | 0.093 | NASA: a=1.524 AU, e=0.0934 | CORRECT (rounded) |
| Jupiter | 5.203 | 0.049 | NASA: a=5.203 AU, e=0.0484 | CORRECT (rounded) |
| Pluto | 39.48 | 0.249 | NASA: a=39.48 AU, e=0.2488 | CORRECT (rounded) |
| Halley | 17.8 | 0.967 | JPL: a=17.83 AU, e=0.9671 | CORRECT (rounded) |
| Circular | 1.0 | 0.0 | Idealized reference orbit | CORRECT |
| High e | 5.0 | 0.9 | Pedagogical extreme case | CORRECT |

## Kepler Solver Robustness

- **Newton iteration**: Initial guess `E0 = M` for `e <= 0.8`, `E0 = pi` for `e > 0.8`. Tolerance `1e-12 rad`, max 15 iterations. The `e <= 0.8` threshold is standard -- for low-to-moderate eccentricity, `E ~ M` is a good initial guess and Newton converges quadratically. For near-parabolic orbits, `E0 = pi` avoids the slow convergence near `M ~ 0`.
- **Bisection fallback**: If Newton fails (non-convergence or residual too large), falls back to bisection on `[0, 2pi)` with 200 iterations and the same tolerance. The residual function `E - e*sin(E) - M` is monotonically increasing for `0 <= e < 1`, guaranteeing a unique root.
- **Turn preservation**: Multi-revolution support via `turns = floor(M / 2pi)`, solving for the wrapped anomaly, then adding back `turns * 2pi`. This enables continuous time series without discontinuities.
- **Eccentricity clamping**: `e` is clamped to `[0, 0.99]` in the UI layer (`clampEccentricity`), avoiding numerical stiffness near `e -> 1`.
- **Test coverage**: Grid test over `e in {0, 0.3, 0.8, 0.95}` and `M in {-10.2, ..., 20*pi+0.01}` verifies residual < `1e-10`.

## Conservation Law Self-Consistency

The demo displays kinetic energy (`v^2/2`), potential energy (`-mu/r`), total specific energy, angular momentum `h`, and areal velocity `dA/dt = h/2`. These are computed from the physics model's `stateAtMeanAnomalyRad` output. The total energy is computed via `v^2/2 - mu/r` where `v` comes from vis-viva; for a fixed `(a, e)`, vis-viva gives `v^2 = mu*(2/r - 1/a)`, so `eps = -mu/(2a)` = constant. The angular momentum `h = sqrt(mu*a*(1-e^2))` depends only on orbital elements, not position. These are exactly conserved by construction (analytic orbit), not subject to numerical integration drift.

## Equal-Areas Visualization Accuracy

The equal-areas wedge sweeps 10% of the orbital period backward from the current mean anomaly. It samples 30 points in true anomaly between `startTheta` and `currentTheta`, computing `r(theta)` via the full Kepler solve chain at each point (true anomaly -> mean anomaly -> `stateAtMeanAnomalyRad` -> `rAu`). The wedge is drawn as a filled polygon from the star through the arc and back. The 12 equal-time markers are placed at `M = 2*pi*i/12` for `i = 0..11`, each solved via the Kepler equation. This correctly demonstrates that equal time intervals produce unequal arc lengths but equal swept areas.

**Note**: The interpolation between `startTheta` and `currentTheta` (line 324: `theta = startTheta + t * (state.thetaRad - startTheta)`) uses linear interpolation in true anomaly, not in mean anomaly. This means the 30 sample points are not uniformly spaced in time, but the wedge shape is still correct because each sample computes the exact `r(theta)` for its true anomaly. The wedge boundary follows the physical orbit path.

## Issues Found

1. **Canvas x-mirror (known, cosmetic)**: The Canvas `drawOrbitCanvas` uses `+r*cos(theta)` while the SVG `orbitalToSvg` uses `-r*cos(theta)`. The Canvas is only used to draw the planet trail dot overlay, and the SVG handles all interactive elements, labels, and geometric overlays. The visual discrepancy means the Canvas dot appears on the opposite side of the star from the SVG planet when `theta != pi/2` or `3*pi/2`. This is documented in MEMORY.md and classified as cosmetic since the Canvas layer is a secondary visual aid, not the primary interaction surface.

2. **No animation dt clamp**: The animation loop in `startAnimation` (line 513) computes `dt = (now - lastTime) / 1000` without clamping. If the browser tab is backgrounded and then foregrounded, `dt` can be very large, causing the planet to jump discontinuously. MEMORY.md notes "Animation dt must be clamped (Math.min(dt, 0.1)) to prevent cursor jump when tab is backgrounded" as a known best practice. This is a UX issue, not a physics error -- the final position after the jump is still physically correct (M is computed mod 2pi).

3. **Acceleration unit label in 101 mode**: In `buildReadouts` (logic.ts line 61), the 101-mode acceleration is computed as `AstroUnits.auPerYr2ToMPerS2(accel) * 1000` with unit label "mm/s^2". This is a valid unit conversion (m/s^2 * 1000 = mm/s^2), but the choice of mm/s^2 for an intro course is unusual. Not a physics error.

**No incorrect physics equations or sign errors found in the model or SVG rendering layer.**
