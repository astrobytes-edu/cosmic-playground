# Eclipse Geometry -- Physics Review

## Summary

Full chain audit of the eclipse-geometry demo covering the physics model (`eclipseGeometryModel.ts`), pure UI logic (`logic.ts`), and DOM/SVG wiring (`main.ts`). All six rendering chains (ecliptic latitude, phase angle, eclipse classification, SVG orbit rendering, beta curve, and drag interaction) were traced end-to-end. Verdict: **all physics equations, coordinate conventions, and inverse mappings are correct; no issues found.**

## Rendering Chains Audited

| # | Chain | Forward mapping | Inverse mapping | Verdict |
|---|-------|-----------------|-----------------|---------|
| 1 | Moon position on orbit circle | `moonDisplayLonDeg` (moonLon - sunLon) -> `cos/sin(angle)` -> SVG `(cx, cy)` | `svgPointToAngleDeg(cx,cy,px,py)` -> `displayAngle + sunLon` -> `moonLon` | OK |
| 2 | Ascending/descending node markers | `nodeDisplayLonDeg` (nodeLon - sunLon) -> `cos/sin` for asc, +180 for desc | (not interactive -- no inverse needed) | OK |
| 3 | Beta indicator line | `betaDeg` -> `my - betaDeg * scale` (negate for SVG y-down) | (not interactive) | OK |
| 4 | Beta sinusoidal curve | `eclipticLatitudeDeg(moonLon, tilt, nodeLon)` -> `panelCenterY - beta * yScale` | (not interactive) | OK |
| 5 | Beta panel marker | `moonFraction * panelWidth` for x; `-betaDeg * BETA_Y_SCALE` for y | (not interactive) | OK |
| 6 | Eclipse classification | `phaseAngleDeg` -> syzygy check -> `solarEclipseType` / `lunarEclipseType` from `betaDeg` + distance | (no inverse) | OK |

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| Phase angle: `Delta = lambda_M - lambda_Sun (mod 360)` | `phaseAngleDeg()` line 22-24 of model | Standard definition; 0 = New, 180 = Full | OK |
| Ecliptic latitude: `beta = arcsin(sin(i) * sin(lambda_M - Omega))` | `eclipticLatitudeDeg()` lines 26-35 of model | Spherical trig on tilted orbital plane; exact for small i | OK |
| Angular separation: `min(|a-b| mod 360, 360 - |a-b| mod 360)` | `angularSeparationDeg()` lines 17-20 of model | Returns shortest arc [0, 180] | OK |
| Nearest node distance: `min(sep(moon, node), sep(moon, node+180))` | `nearestNodeDistanceDeg()` lines 37-41 of model | Both ascending and descending nodes checked | OK |
| Umbra radius at distance d: `R_body - d*(R_sun - R_body)/D_sun` | `shadowRadiiKmAtDistance()` line 70-71 of model | Similar-triangle cone geometry; negative = no umbra (annular) | OK |
| Penumbra radius at distance d: `R_body + d*(R_sun + R_body)/D_sun` | `shadowRadiiKmAtDistance()` line 72-73 of model | Outer cone; always positive | OK |
| Beta threshold from impact parameter: `beta_max = arcsin(b_max / d)` | `betaMaxDegFromImpactKm()` lines 77-81 of model | Small angle would be b/d; arcsin is exact | OK |
| Solar eclipse: total vs annular from sign of umbra radius at Earth | `solarEclipseTypeFromBetaDeg()` line 224 | `umbraRadiusKm > 0` means umbra reaches Earth (total); `<= 0` means it doesn't (annular) | OK |
| Lunar eclipse: total when impact < umbra - R_moon; partial when < umbra + R_moon; penumbral when < penumbra + R_moon | `lunarEclipseTypeFromBetaDeg()` lines 186-193 | Standard geometric criterion | OK |
| Eclipse thresholds: solar partial = R_earth + penumbra(moon shadow); solar central = R_earth + |umbra(moon shadow)| | `eclipseThresholdsDeg()` lines 137-147 | Correctly uses Moon as shadow-casting body for solar; Earth as shadow-casting body for lunar | OK |

## Coordinate Convention Audit

1. **SVG y-axis (down-positive)**: Rendering uses `cos(angle)` for x, `sin(angle)` for y without negation. This means 0 deg = right, angles increase clockwise in the SVG plane. **Consistent** -- the drag handler `svgPointToAngleDeg` uses the same convention with `dy = pointY - centerY` (line 37 of logic.ts). No inversion bug.

2. **Beta sign in orbit panel**: The beta indicator line computes `by = my - betaDeg * scale` (main.ts line 305). Positive beta (Moon above ecliptic) moves the line endpoint upward in SVG (decreasing y). **Correct.**

3. **Beta sign in beta curve panel**: `buildBetaCurvePath` computes `y = panelCenterY - beta * yScale` (logic.ts line 64). Positive beta goes upward in SVG. **Correct** -- matches the axis labels in the HTML: "+" is at the top (y = -130), "-" is at the bottom (y = 134).

4. **Beta marker in beta panel**: `markerY = -betaDeg * BETA_Y_SCALE` (main.ts line 329). Since the beta panel `<g>` is at `translate(30, 180)` making panelCenterY = 0 in local coords, this is equivalent to `panelCenterY - beta * scale`. **Consistent** with the curve path builder.

5. **Sun-fixed display frame**: Orbit rendering subtracts `sunLonDeg` from both `moonLonDeg` and `nodeLonDeg` to create a "Sun-fixed" view (main.ts lines 274-279). The drag inverse correctly adds `sunLonDeg` back (main.ts line 1242): `moonLon = displayAngle + sunLon`. **Round-trip verified.**

6. **Node regression sign**: `NODE_RATE_DEG_PER_DAY = -360 / (18.61 * julian_year_days)` (main.ts line 821). The negative sign is correct: the lunar nodes regress westward (decreasing longitude). **Correct.**

7. **Moon and Sun angular rates**: Sun rate = `360 / tropical_year_days` (eastward, positive). Moon rate = `360 / sidereal_month_days` (eastward, positive, faster than Sun). Phase rate = `360 / synodic_month_days`. **All signs correct.**

## Shadow Cone Geometry -- Detailed Verification

The `shadowRadiiKmAtDistance` function implements the standard similar-triangle shadow cone formulas:

- **Umbra (converging cone):** `r_umbra(d) = R_body - d * (R_sun - R_body) / D_sun`. At `d = 0`, this equals `R_body`. As `d` increases, the umbra radius shrinks. When `R_sun > R_body` (always true for Moon/Earth shadowed by the Sun), the cone converges. If `d` is large enough, `r_umbra` goes negative, meaning the umbra vertex is behind the target -- this correctly triggers annular eclipse classification.

- **Penumbra (diverging cone):** `r_penumbra(d) = R_body + d * (R_sun + R_body) / D_sun`. Always positive and growing with distance. **Correct.**

At mean Earth-Moon distance (384,400 km), the model yields:
- Moon shadow umbra at Earth: `1737.4 - 384400 * (696000 - 1737.4) / 149597870.7` ~ `1737.4 - 1783.5 = -46.1 km` (negative, so annular at mean distance)
- At perigee (363,300 km): `1737.4 - 363300 * 694262.6 / 149597870.7` ~ `1737.4 - 1684.9 = +52.5 km` (positive, so total eclipse possible)

This matches the test expectation: perigee -> total-solar, apogee -> annular-solar. **Verified.**

## Eclipse Classification Logic -- Detailed Verification

The classification pipeline in `computeDerived` (logic.ts):

1. Compute `phaseAngleDeg` (Delta).
2. Check if Delta is within `SYZYGY_TOLERANCE_DEG = 5` degrees of 0 (New) or 180 (Full).
3. Only if syzygy: call `solarEclipseTypeFromBetaDeg` or `lunarEclipseTypeFromBetaDeg` with the signed `betaDeg`.
4. Both classification functions take `abs(betaDeg)` internally via `Math.abs(degToRad(...))` before computing the impact parameter.

The syzygy tolerance is a pedagogical simplification (noted in export notes). It prevents confusing students with eclipse outcomes at arbitrary phases. **Physically reasonable for a teaching tool.**

## Simulation Engine -- Spot Check

The simulation loop (main.ts `stepSimulation`) correctly:
- Advances Sun, Moon, and node longitudes at their respective angular rates per time step.
- Tracks syzygy windows (entering/exiting the tolerance band) and records the best (closest to exact syzygy) beta within each window.
- Classifies eclipses only at the best-beta point of each window, avoiding double-counting.

The `SIM_STEP_DAYS = 0.1` day time step is adequate: the synodic period is ~29.5 days, so the syzygy tolerance window of 5 degrees spans roughly `5 / (360/29.5)` ~ 0.41 days. At 0.1-day resolution, the window is sampled ~4 times. **Adequate for a pedagogical simulation.**

## Issues Found

None -- all chains verified clean.
