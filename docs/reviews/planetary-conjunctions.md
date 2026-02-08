# Planetary Conjunctions -- Physics Review

## Summary

The planetary-conjunctions demo visualizes circular heliocentric orbits of Earth and a selectable target planet (Venus, Mars, Jupiter, or Saturn), detects conjunctions when their heliocentric longitudes align within a threshold, and computes the synodic period. Sidereal periods are derived from Kepler III using JPL J2000 semi-major axes via the retrograde-motion model's planet element table. All physics equations were verified against standard references and found to be correct, with one minor note about the conjunction definition (heliocentric alignment, not geocentric elongation).

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| Kepler III (teaching units): P = sqrt(a^3/M) yr | `twoBodyAnalytic.ts:89-94` -- `orbitalPeriodYrFromAuSolar({a, M}) = sqrt(a^3/M)` with M = 1 Msun | Standard Kepler III | CORRECT |
| Synodic period: P_syn = \|P1 * P2 / (P1 - P2)\| | `twoBodyAnalytic.ts:269-275` -- `synodicPeriod(p1, p2) = abs((p1*p2)/(p1-p2))` with guard for p1 = p2 -> Infinity | Standard synodic period formula | CORRECT |
| Heliocentric longitude: theta(t) = 2*pi*t/P (mod 2*pi) | `logic.ts:93-101` -- `planetAngleRad(days, period) = ((TAU * days / period) % TAU + TAU) % TAU` | Uniform circular motion, wrapped to [0, 2pi) | CORRECT |
| Angular separation: min(\|theta1 - theta2\|, 2pi - \|theta1 - theta2\|) | `logic.ts:107-112` -- `diff = abs(a1-a2) % TAU; if (diff > PI) diff = TAU - diff; return diff * 180/PI` | Correct shortest-arc formula in [0, 180] deg | CORRECT |
| Conjunction detection: separation <= threshold (5 deg) | `logic.ts:117-120` -- `isConjunction(sep, 5)` with rising-edge counting | Threshold-based detection with edge trigger to count each event once | CORRECT |
| Earth semi-major axis: a = 1.00000261 AU | `logic.ts:53` and `retrogradeMotionModel.ts:38` -- matches JPL J2000 table | JPL Standish Table 1 (1800-2050 AD) | CORRECT |
| Venus semi-major axis: a = 0.72333566 AU | `retrogradeMotionModel.ts:37` | JPL J2000 | CORRECT |
| Mars semi-major axis: a = 1.52371034 AU | `retrogradeMotionModel.ts:39` | JPL J2000 | CORRECT |
| Jupiter semi-major axis: a = 5.20288700 AU | `retrogradeMotionModel.ts:40` | JPL J2000 | CORRECT |
| Saturn semi-major axis: a = 9.53667594 AU | `retrogradeMotionModel.ts:41` | JPL J2000 | CORRECT |
| Model year: 31557600 s / 86400 s = 365.25 days (Julian year) | `logic.ts:67` -- `yearDays() = 31557600/86400` | Julian year definition | CORRECT |
| SVG coordinate transform: y-flip for physics->SVG | `logic.ts:174-177` -- `x = cx + r*cos(angle); y = cy - r*sin(angle)` | Correct: SVG y-down, physics y-up | CORRECT |
| Orbit radius scaling: linear in a/a_max | `logic.ts:184-192` -- `orbitRadiusPx(a, maxA, maxPx) = (a/maxA)*maxPx` | Proportional scaling | CORRECT |

## Rendering Chains Audited

**Planet selection -> Period computation -> Animation -> Conjunction detection:**

1. User selects a target planet (Venus/Mars/Jupiter/Saturn).
2. `siderealPeriodDays()` retrieves the planet's semi-major axis from `RetrogradeMotionModel.planetElements()` (JPL J2000 table), computes `P_yr = sqrt(a^3)` via `TwoBodyAnalytic.orbitalPeriodYrFromAuSolar()`, and converts to days via `* 365.25`.
3. Earth's period uses `a_Earth = 1.00000261 AU` -> `P = sqrt(a^3) * 365.25 = 365.25 days` (to within 0.0001 day).
4. Synodic period is computed via `TwoBodyAnalytic.synodicPeriod(P_earth, P_target)`.
5. Animation advances `elapsedDays` by `dtSec * speedMultiplier` each frame (dt clamped to 0.1s for tab-backgrounding safety).
6. Planet angles are computed via `planetAngleRad(elapsedDays, period)` -- both start at angle = 0 at t = 0.
7. Angular separation is computed via `angularSeparationDeg()`, which correctly handles the 0/2pi wraparound by using the shortest-arc formula.
8. Conjunction detection uses a rising-edge trigger (`inConj && !lastWasConjunction && elapsedDays > 1`) to count each conjunction event exactly once. The 1-day guard prevents false triggers at initialization.

**Synodic period spot-checks (computed from JPL elements):**

- Earth-Venus: P_E = 365.25 d, P_V = sqrt(0.72333566^3) * 365.25 = 224.7 d. P_syn = |365.25 * 224.7 / (365.25 - 224.7)| = 583.9 d. Published value: 583.9 d. CORRECT.
- Earth-Mars: P_M = sqrt(1.52371034^3) * 365.25 = 687.0 d. P_syn = |365.25 * 687.0 / (365.25 - 687.0)| = 779.9 d. Published value: 779.9 d. CORRECT.
- Earth-Jupiter: P_J = sqrt(5.20288700^3) * 365.25 = 4332.6 d. P_syn = |365.25 * 4332.6 / (365.25 - 4332.6)| = 398.9 d. Published value: 398.9 d. CORRECT.
- Earth-Saturn: P_S = sqrt(9.53667594^3) * 365.25 = 10759.2 d. P_syn = |365.25 * 10759.2 / (365.25 - 10759.2)| = 378.1 d. Published value: 378.1 d. CORRECT.

**Conjunction line rendering:**

The conjunction line is drawn from the Sun (SVG center) through the vector-average direction of the two planets' heliocentric longitudes. Vector averaging (`atan2(sin(a1)+sin(a2), cos(a1)+cos(a2))`) correctly handles the 0/2pi wraparound, unlike naive angle averaging. This is correct.

## Issues Found

None. All physics equations, synodic period calculations, coordinate conventions, and conjunction detection logic are correct. The demo correctly uses heliocentric longitudes for conjunction detection (aligned as seen from the Sun), which is the standard definition for heliocentric conjunction. The circular orbit approximation (ignoring eccentricity) is clearly documented in the export notes and is appropriate for a teaching demo focused on synodic periods rather than exact ephemeris prediction. The angular separation formula, edge-triggered conjunction counting, and SVG rendering chain are all verified.
