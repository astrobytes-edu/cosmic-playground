# Moon Phases -- Physics Review

**Reviewer:** Claude Opus 4.6 (automated physics audit)
**Date:** 2026-02-07
**Files reviewed:**
- `packages/physics/src/moonPhasesModel.ts` (core phase model)
- `packages/physics/src/riseSetModel.ts` (rise/set model)
- `packages/physics/src/astroConstants.ts` (synodic month, obliquity)
- `apps/demos/src/demos/moon-phases/main.ts` (rendering + interaction)
- `apps/demos/src/demos/moon-phases/animation.ts` (animation rate)
- `apps/demos/src/demos/moon-phases/riseSetViewModel.ts` (rise/set view model)
- `apps/demos/src/demos/moon-phases/riseSetUiState.ts` (UI presets)
- `apps/demos/src/demos/moon-phases/exportPayload.ts` (export builder)

## Summary

The moon-phases demo implements a geometric lunar phase model where the phase angle `alpha` is the Sun-Moon-Earth elongation angle measured from the Full Moon position (alpha=0 = Full, alpha=180 = New). The illumination fraction `f = (1 + cos(alpha)) / 2` is the standard formula. The terminator curve rendering uses `r * cos(alpha)` to compute the elliptical squeeze, producing correct limb geometry for all 8 named phases. The rise/set model uses a physically reasonable solar hour-angle approach shifted by the Moon's phase offset.

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| `f = (1 + cos(alpha)) / 2` | `MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(angleDeg)`: converts to radians, returns `(1 + Math.cos(rad)) / 2` | Standard illumination fraction for a sphere lit by a distant source | CORRECT |
| f(0) = 1 (Full) | cos(0) = 1, so f = (1+1)/2 = 1 | Full Moon = 100% illuminated | CORRECT |
| f(90) = 0.5 (Third Quarter) | cos(90) = 0, so f = (1+0)/2 = 0.5 | Quarter = 50% illuminated | CORRECT |
| f(180) = 0 (New) | cos(180) = -1, so f = (1-1)/2 = 0 | New Moon = 0% illuminated | CORRECT |
| f(270) = 0.5 (First Quarter) | cos(270) = 0, so f = (1+0)/2 = 0.5 | Quarter = 50% illuminated | CORRECT |
| Synodic month = 29.53 days | `SYNODIC_MONTH_DAYS = 29.53` in moonPhasesModel.ts; `MEAN_SYNODIC_MONTH_DAYS = 29.530588` in astroConstants.ts | Modern value: 29.53059 days (Meeus) | CORRECT (teaching precision) |
| Days since New = ((alpha - 180 + 360) % 360) / 360 * P_syn | `daysSinceNewFromPhaseAngleDeg`: maps alpha=180 to day 0, alpha=0 to day P/2 | Convention-consistent mapping | CORRECT |
| Solar declination = 23.44 * sin(2*pi*(d-80)/365) | `solarDeclinationDegFromDayOfYear`: `23.44 * Math.sin(2*pi*(n-80)/365)` | Standard teaching sinusoidal approximation | CORRECT |
| Solar hour angle: cos(H0) = -tan(phi)*tan(delta) | `solarRiseSetLocalTimeHours`: `cosH0 = -Math.tan(phi) * Math.tan(delta)` | Standard sunrise/sunset equation | CORRECT |
| Day length = 2*H0 / 15 hours | `dayLengthHours = (2 * (h0 * 180)) / (pi * 15)` = `2 * h0_deg / 15` | H0 in degrees / 15 deg/hr * 2 (symmetric) | CORRECT |
| Moon rise shift = (alpha - 180) / 360 * 24 hours | `shiftHours = ((phaseAngleDeg - 180) / 360) * 24` | Full Moon (alpha=0): shift = -12h (rises at sunset). New Moon (alpha=180): shift = 0h (rises at sunrise). | CORRECT |

### Known-answer spot checks

| Test | Expected | Result | Status |
|------|----------|--------|--------|
| Full Moon (alpha=0): f | 1.000 | (1 + cos(0))/2 = 1.0 | CORRECT |
| First Quarter (alpha=270): f | 0.500 | (1 + cos(270))/2 = 0.5 | CORRECT |
| New Moon (alpha=180): days since new | 0.0 | ((180-180+360)%360)/360 * 29.53 = 0 | CORRECT |
| Full Moon (alpha=0): days since new | 14.765 | ((0-180+360)%360)/360 * 29.53 = 180/360 * 29.53 = 14.765 | CORRECT |
| Full Moon rise (equator, equinox) | ~18:00 | shift = (0-180)/360*24 = -12h. Sunrise at ~6h. Moon rise = 6 + (-12) mod 24 = 18h | CORRECT |
| New Moon rise (equator, equinox) | ~06:00 | shift = (180-180)/360*24 = 0h. Moon rise = 6 + 0 = 6h | CORRECT |
| Equinox declination (day 80) | ~0 deg | 23.44 * sin(2*pi*(80-80)/365) = 0 | CORRECT |
| Summer solstice declination (day 172) | ~23.4 deg | 23.44 * sin(2*pi*92/365) = 23.44 * sin(1.584) ~ 23.4 | CORRECT |

## Rendering Chains Audited

### Phase angle -> orbital position
1. Angle `alpha` is in degrees, measured CCW from right (math convention)
2. `moonX = centerX + R * cos(alpha)`, `moonY = centerY - R * sin(alpha)` (SVG y-down)
3. At alpha=0 (Full Moon): Moon is at (centerX + R, centerY) = right side = opposite Sun
4. At alpha=180 (New Moon): Moon is at (centerX - R, centerY) = left side = between Earth and Sun

**Convention consistency:** The Sun is implicitly to the left of Earth in the diagram. Full Moon at the right (opposite Sun) and New Moon at the left (between Earth and Sun) is the correct geometric arrangement.

### Phase angle -> lit portion SVG path
1. `squeeze = r * cos(alpha)`: the x-radius of the terminator ellipse
2. When `isWaxing` (alpha > 180): lit portion is on the right side of the Moon face
   - `squeeze >= 0` (gibbous): right semicircle arc + right-bulging ellipse arc
   - `squeeze < 0` (crescent): right semicircle arc + left-bulging ellipse arc (bite into lit area)
3. When waning (alpha <= 180): lit portion is on the left side
   - `squeeze >= 0` (gibbous): left semicircle arc + left-bulging ellipse arc
   - `squeeze < 0` (crescent): left semicircle arc + right-bulging ellipse arc

**Terminator geometry correctness:**
- The terminator is the day-night boundary on the Moon's disk. For a spherical Moon, when viewed from Earth at phase angle alpha, the terminator projects as an ellipse with semi-major axis = r (pole-to-pole) and semi-minor axis = |r * cos(alpha)|.
- `cos(alpha)` is positive for gibbous phases (alpha < 90 or alpha > 270) and negative for crescent phases (90 < alpha < 270), matching the sign-based path logic.
- Full Moon (alpha=0): squeeze = r, the terminator ellipse degenerates to a circle (full disk lit). Path: full circle arc. CORRECT.
- New Moon (alpha=180): squeeze = -r, the terminator ellipse has the same radius as the Moon but on the opposite side (no lit area). Path: empty. CORRECT.
- Quarter (alpha=90 or 270): squeeze = 0, the terminator is a vertical line (straight edge). Path: semicircle + degenerate zero-width ellipse = semicircle. CORRECT.

### Phase angle -> clip rect for orbital Moon
1. `moonLitHalfClipEl` is positioned at `(moonX - R, moonY - R)` with width = `R` (half the Moon)
2. This clips the lit circle to show only the sunward half
3. The clip rect always covers the left half of the Moon (relative to Moon center), which is the sunward side when the Sun is to the left

### Drag interaction -> angle
1. SVG coordinates computed from client coordinates: `svgX = ((clientX - rect.left) / rect.width) * 400`
2. Offset from Earth center: `dx = svgX - centerX`, `dy = centerY - svgY` (flipped for math y-up)
3. Angle: `atan2(dy, dx)` gives CCW angle from right, matching the phase angle convention
4. Snap to cardinal phases (0, 90, 180, 270) within 5 degrees on drag end

### Animation rate
1. `degreesPerSecond = (360 / synodicMonthDays) * speed`
2. At speed=1, one full lunar cycle takes 29.53 real-time seconds (1 day per second)
3. `nextAngleDeg = normalizeAngle(angleDeg + degreesPerSecond * deltaSeconds)`

### Phase naming convention
| alpha range | Phase name | Standard name | Status |
|-------------|-----------|---------------|--------|
| 0 (337.5-22.5) | Full Moon | Full Moon | CORRECT |
| 22.5-67.5 | Waning Gibbous | Waning Gibbous | CORRECT |
| 67.5-112.5 | Third Quarter | Third Quarter | CORRECT |
| 112.5-157.5 | Waning Crescent | Waning Crescent | CORRECT |
| 157.5-202.5 | New Moon | New Moon | CORRECT |
| 202.5-247.5 | Waxing Crescent | Waxing Crescent | CORRECT |
| 247.5-292.5 | First Quarter | First Quarter | CORRECT |
| 292.5-337.5 | Waxing Gibbous | Waxing Gibbous | CORRECT |

The waxing/waning determination uses days since new: waxing when days < P/2, waning otherwise. This is consistent with the convention that the Moon waxes from New (day 0) to Full (day ~14.8) and wanes from Full back to New.

### Rise/set model
- Basic (non-advanced) mode: `riseHour = (18 + alpha/15) % 24`, `setHour = (riseHour + 12) % 24`. Full Moon (alpha=0) rises at 18:00, sets at 06:00. New Moon (alpha=180) rises at 06:00, sets at 18:00. This is the standard pedagogical approximation.
- Advanced mode: Uses `solarRiseSetLocalTimeHours` to compute Sun rise/set from latitude and day-of-year, then shifts by `(alpha - 180) / 360 * 24` hours. The shift formula gives -12h for Full Moon (rises at sunset) and 0h for New Moon (rises at sunrise), consistent with the basic mode at equator/equinox.
- Polar detection: `cos(H0) <= -1` => polar day (Sun never sets), `cos(H0) >= 1` => polar night. In these cases, rise/set returns null with appropriate status. This is physically correct.
- Season presets: Spring = day 80 (March equinox), Summer = day 172 (June solstice), Fall = day 265 (September equinox), Winter = day 355 (December solstice). These are within 1-2 days of the actual dates, acceptable for a teaching model.

## Issues Found

None. All physics equations, phase conventions, terminator geometry, rise/set calculations, and rendering chains are correct. The model is a standard geometric teaching model without orbital tilt or libration, which is appropriate for the pedagogical scope.
