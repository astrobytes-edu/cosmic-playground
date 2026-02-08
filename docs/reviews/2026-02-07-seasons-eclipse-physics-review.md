# Physics Review: Seasons & Eclipse-Geometry Demos

**Date**: 2026-02-07
**Reviewer**: Physics review agent (Opus 4.6)
**Scope**: Full chain verification for `seasons` and `eclipse-geometry` demos

---

## Seasons Demo

### A. Solar Declination  **PASS**

**Physics model** (`packages/physics/src/seasonsModel.ts`, lines 13-25):

```ts
const L = (2 * Math.PI * (args.dayOfYear - dayOfMarchEquinox)) / tropicalYearDays;
const deltaRad = Math.asin(Math.sin(AstroUnits.degToRad(eps)) * Math.sin(L));
```

This implements `delta = arcsin(sin(epsilon) * sin(L))` where `L = 2pi(N - 80)/365.2422`.

**Verification**:
- The standard simplified formula is `delta = epsilon * sin(2pi(N-80)/365.25)`. The code uses the more accurate `arcsin(sin(epsilon) * sin(L))` which reduces to the same thing for small epsilon. For large epsilon, the arcsin form is correct (the linear approximation breaks down). **Correct**.
- At day 80 (March equinox): `L = 0`, `sin(0) = 0`, so `delta = 0`. **Correct**.
- At day 172 (June solstice): `L = 2pi * 92/365.2422 = 1.582 rad`. `sin(1.582) = 0.9999` (very close to 1). With default tilt 23.5: `arcsin(sin(23.5) * 0.9999) = 23.49 deg`. Close to +tilt. **Correct**.
- The `effectiveObliquityDegrees()` function (lines 7-11) folds any tilt value into [0, 90], which is physically correct for the geometry.
- At extreme tilt 90: `effectiveObliquityDegrees(90) = 90`, so `sin(epsilon) = 1`, and `delta = arcsin(sin(L)) = L` (for small L), reaching +90 at day 172. **Correct**.
- At tilt 45: `effectiveObliquityDegrees(45) = 45`, `delta_max = arcsin(sin(45)) = 45 deg`. **Correct**.

### B. Day Length Formula  **PASS**

**Physics model** (`packages/physics/src/seasonsModel.ts`, lines 27-35):

```ts
const cosH = -Math.tan(phi) * Math.tan(delta);
if (cosH < -1) return 24;
if (cosH > 1) return 0;
const Hdeg = AstroUnits.radToDeg(Math.acos(cosH));
return (2 * Hdeg) / 15;
```

**Verification**:
- Standard sunrise equation: `cos(H) = -tan(phi) * tan(delta)`, where H is the half-day hour angle. **Correct**.
- Day length = `2H / 15` hours (since 1 hour = 15 degrees of hour angle). Equivalently: `2H_rad / (2pi) * 24 = 24*H_deg/360 = 2*H_deg/30`... wait, let me recheck: `H` in degrees, day length = `2*H_deg / 360 * 24 = H_deg / 7.5`. But the code does `2*H_deg/15`.
  - Actually: `H_deg` is the half-day hour angle in degrees. Day length in hours = `2*H_deg / 15`. This is because 15 deg/hour (Earth rotates 360 deg in 24 h = 15 deg/h). So `H_deg` degrees takes `H_deg/15` hours, and full daylight = `2 * H_deg / 15` hours. **Correct**.
- Edge case `cosH < -1`: midnight sun (24h). This happens when `tan(phi)*tan(delta) > 1`, i.e., observer inside polar circle during summer. **Correct**.
- Edge case `cosH > 1`: polar night (0h). This happens when `tan(phi)*tan(delta) < -1`. **Correct**.
- At equator (`phi = 0`): `tan(0) = 0`, so `cosH = 0`, `H = 90 deg`, day length = `2*90/15 = 12.0h`. **Correct**.

### C. Distance Exaggeration  **PASS**

**Logic** (`apps/demos/src/demos/seasons/logic.ts`, lines 68-79):

```ts
const rScaled = orbitR * (1 + distExaggeration * (distanceAu - 1));
```

**Physics model** (`packages/physics/src/seasonsModel.ts`, lines 41-53):

```ts
return 1 - eccentricity * Math.cos(angle);
```

**Verification**:
- `earthSunDistanceAu` returns `1 - e*cos(theta)`, which is the standard first-order approximation for `r/a` in an elliptical orbit. With `e = 0.017`, at perihelion (`theta = 0`): `r = 1 - 0.017 = 0.983 AU`. At aphelion (`theta = pi`): `r = 1 + 0.017 = 1.017 AU`. **Correct**.
- Perihelion is anchored at day 3 (Jan 3), which is standard. **Correct**.
- The exaggeration formula: at perihelion, `rScaled = orbitR * (1 + 8*(0.983-1)) = orbitR * (1 - 0.136) = 0.864 * orbitR`. At aphelion: `rScaled = orbitR * (1 + 8*0.017) = 1.136 * orbitR`. So the visible range is about 0.86R to 1.14R, a 27% variation. The real variation is 3.4%. The 8x factor is pedagogically appropriate -- it makes the eccentricity clearly visible without being absurd. **Correct and reasonable**.

### D. Globe Geometry  **PASS (with notes)**

#### D1. terminatorShiftX (`logic.ts`, line 124)

```ts
return globeRadius * Math.sin((declinationDeg * Math.PI) / 180);
```

**Analysis**: This is an approximation. The terminator on an orthographic projection is a great circle whose center shifts with declination. For an orthographic view from the side (observer at infinity on the equatorial plane, looking along the ecliptic), the terminator is an ellipse. Its horizontal shift is `R * sin(delta)`.

- At solstice (`delta = 23.5`): shift = `R * sin(23.5) = 0.399R`. **Correct**.
- At equinox (`delta = 0`): shift = 0. **Correct**.
- The sign convention: positive declination (summer solstice) gives positive shift. In the rendering (main.ts line 422): `terminator.cx = -tShift - termRx`. A positive tShift moves the dark ellipse further to the LEFT, meaning more of the right (northern sunlit) side is visible. **Correct** (the globe view has sun light coming from the right, so positive declination should expose more of the northern hemisphere to sunlight).

**Note**: The terminator rendering is a simplification. The real projected terminator on an orthographic globe is an ellipse with `rx = R*cos(delta)` (not a full-radius circle). The code uses `termRx = GLOBE_R` for the dark-side ellipse, which means it's a circle that shifts horizontally. This is a schematic approximation, not a precise orthographic projection. Pedagogically acceptable since the note in the SVG says "This visualization is schematic."

#### D2. latitudeToGlobeY (`logic.ts`, line 132)

```ts
return centerY - globeRadius * Math.sin((latDeg * Math.PI) / 180);
```

- North pole (+90): `centerY - R*sin(90) = centerY - R`. This is above center (smaller y in SVG). **Correct**.
- South pole (-90): `centerY - R*sin(-90) = centerY + R`. Below center (larger y). **Correct**.
- For orthographic projection looking along the equatorial plane, the y position of a latitude circle is `R*sin(lat)`. The negative sign converts to SVG y-down. **Correct**.

#### D3. latitudeBandEllipse (`logic.ts`, lines 145-168)

```ts
const circleRadius = globeRadius * Math.cos(latRad);
const cy = centerY - globeRadius * Math.sin(latRad) * Math.cos(tiltRad);
const rx = circleRadius;
const ry = circleRadius * Math.sin(tiltRad);
```

**Analysis**: The globe is viewed from the side, tilted by `tiltDeg` toward the viewer (the axial tilt).

- `rx = R*cos(lat)`: This is the radius of the latitude circle on the sphere, projected face-on. **Correct**.
- `ry = R*cos(lat)*sin(tilt)`: The depth (z-axis) foreshortening. At tilt=0, we see the globe edge-on (from the equatorial plane), so latitude circles appear as horizontal lines (ry=0). At tilt=90 (looking from the pole), we'd see full circles (ry=rx). The factor `sin(tilt)` interpolates. **Correct**.
- `cy = centerY - R*sin(lat)*cos(tilt)`: The projected vertical position. At tilt=0, `cy = centerY - R*sin(lat)`, which is the edge-on projection. At tilt=90, `cy = centerY` (all latitudes collapse to center when viewed from pole). The `cos(tilt)` factor is correct for this projection geometry. **Correct**.

#### D4. globeAxisEndpoints (`logic.ts`, lines 176-189)

```ts
const dx = axisLength * Math.sin(tiltRad);
const dy = axisLength * Math.cos(tiltRad);
return {
  x1: centerX - dx, y1: centerY + dy,  // south-pole end (bottom)
  x2: centerX + dx, y2: centerY - dy,  // north-pole end (top)
};
```

- At tilt=0: `dx=0`, `dy=axisLength`. South pole at `(centerX, centerY + axisLength)` (bottom), north pole at `(centerX, centerY - axisLength)` (top). Axis is perfectly vertical. **Correct**.
- At tilt=23.5: `dx = L*sin(23.5) = 0.399L`, `dy = L*cos(23.5) = 0.917L`. North pole at `(centerX + 0.399L, centerY - 0.917L)` -- upper right. The axis leans to the right. For the seasons demo where the sun is to the right of the globe, this means the north pole tilts toward the sun, which is correct for northern summer. **Correct**.

### E. SVG Coordinate Conventions  **PASS**

**Globe SVG structure** (`index.html`, line 173): The globe is placed at `translate(670, 210)` in the main SVG, with center at (0,0) within its group.

**Verification**:
- North pole renders at TOP (smaller y): `globeAxisEndpoints` at tilt=0 gives north pole at `(0, -axisLength)`, which is above center in SVG. **Correct**.
- South pole at BOTTOM: `(0, +axisLength)`. **Correct**.
- Positive declination shifts terminator to reveal MORE of northern hemisphere: `terminatorShiftX(+delta) > 0`, and the dark ellipse moves left (`cx = -tShift - termRx`), exposing more on the right side where the globe is lit. Since the globe is a schematic with sunlight from the right, this correctly shows northern summer. **Correct**.
- Latitude bands at +lat are ABOVE center: `latitudeBandEllipse(+lat)` gives `cy = -R*sin(lat)*cos(tilt) < 0` (above center). **Correct**.
- Globe marker at +lat: `markerY = -R*sin(lat)*0.98 < 0` (above center). **Correct**.

### F. Animation  **PASS**

**Year animation** (`main.ts`, lines 347-384):

```ts
state.dayOfYear = ((animStartDay - 1 + progress * 365.25) % 365.25) + 1;
```

- Wraps correctly: when `progress = 1`, day advances by exactly 365.25 from start. The `% 365.25` ensures wrapping. The `- 1` / `+ 1` offsets keep the range in [1, 365.25]. **Correct**.

**shortestDayDelta** (`logic.ts`, lines 229-235):

```ts
let delta = toDay - fromDay;
while (delta > yearLength / 2) delta -= yearLength;
while (delta < -yearLength / 2) delta += yearLength;
```

- Day 350 to day 10: `delta = 10 - 350 = -340`. Since `-340 < -182.625`, add 365.25: `delta = 25.25`. Forward ~25 days. **Correct**.
- Day 10 to day 350: `delta = 350 - 10 = 340`. Since `340 > 182.625`, subtract 365.25: `delta = -25.25`. Backward ~25 days. **Correct**.

---

## Eclipse-Geometry Demo

### G. Rate Constants  **PASS**

**Definitions in main.ts** (lines 816-826):

```ts
const SUN_RATE_DEG_PER_DAY = 360 / TROPICAL_YEAR_DAYS;
const MOON_RATE_DEG_PER_DAY = 360 / SIDEREAL_MONTH_DAYS;
const NODE_RATE_DEG_PER_DAY = -360 / (NODE_REGRESSION_YEARS * JULIAN_YEAR_DAYS);
```

**Numerical verification**:
- `TROPICAL_YEAR_DAYS = 365.2422`
- `SUN_RATE = 360/365.2422 = 0.98565 deg/day`. Standard value ~0.9856 deg/day. **Correct**.
- `SIDEREAL_MONTH_DAYS = 27.321661`
- `MOON_RATE = 360/27.321661 = 13.1764 deg/day`. Standard value ~13.176 deg/day. **Correct**.
- `NODE_REGRESSION_YEARS = 18.61` (Julian years)
- `JULIAN_YEAR_DAYS = 31557600/86400 = 365.25`
- `NODE_RATE = -360/(18.61 * 365.25) = -360/6797.3025 = -0.05296 deg/day`. Standard value ~-0.053 deg/day. The minus sign indicates retrograde regression. **Correct**.
- **Synodic rate check**: `MOON_RATE - SUN_RATE = 13.1764 - 0.98565 = 12.1907 deg/day`. Expected: `360/29.530588 = 12.1908 deg/day`. Consistent to 4 significant figures. **Correct**.

The code also defines:
```ts
const PHASE_RATE_DEG_PER_DAY = 360 / SYNODIC_MONTH_DAYS;
```
This is `360/29.530588 = 12.1908 deg/day`, consistent with the derived synodic rate. **Correct**.

### H. Animate-Month Fix  **PASS**

**main.ts lines 990-1001** (animate-month handler):

```ts
if (runMode === "animate-month") {
    const dtDays = ANIMATE_MONTH_DAYS_PER_SECOND * dtSec;
    state.sunLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + SUN_RATE_DEG_PER_DAY * dtDays);
    state.moonLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.moonLonDeg + MOON_RATE_DEG_PER_DAY * dtDays);
    state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg + NODE_RATE_DEG_PER_DAY * dtDays);
    moonLon.value = String(Math.round(state.moonLonDeg));
    nodeLon.value = String(Math.round(state.nodeLonDeg));
    render();
    ...
```

**Verification**:
- All three bodies (sun, moon, node) are advanced at their proper rates. **Correct**.
- State precision: `state.moonLonDeg` and `state.nodeLonDeg` are updated directly with full floating-point precision, then rounded values are written to sliders for display only. **Correct**.
- The `render()` function (line 342): when `runMode !== "idle"`, it reads from `state.moonLonDeg` and `state.nodeLonDeg` (not from slider values), avoiding step=1 snapping loss. **Correct**.
- The same fix is present in animate-year mode (lines 1004-1024). **Correct**.

### I. Beta Calculation  **PASS**

**Physics model** (`eclipseGeometryModel.ts`, lines 26-35):

```ts
function eclipticLatitudeDeg(args) {
  const iRad = AstroUnits.degToRad(args.tiltDeg);
  const dRad = AstroUnits.degToRad(args.moonLonDeg - args.nodeLonDeg);
  const betaRad = Math.asin(Math.sin(iRad) * Math.sin(dRad));
  return AstroUnits.radToDeg(betaRad);
}
```

**Verification**: This implements `beta = arcsin(sin(i) * sin(lambda_M - Omega))`.

- This is the standard formula for ecliptic latitude of the Moon given its orbital inclination `i` and its angular distance from the ascending node `(lambda_M - Omega)`. **Correct**.
- At ascending node (`lambda_M = Omega`): `sin(0) = 0`, so `beta = 0`. **Correct**.
- At descending node (`lambda_M = Omega + 180`): `sin(pi) = 0`, so `beta = 0`. **Correct**.
- Maximum latitude at `lambda_M - Omega = 90`: `beta = arcsin(sin(i)) = i`. **Correct**.
- Minimum latitude at `lambda_M - Omega = 270`: `beta = arcsin(sin(i) * sin(270)) = arcsin(-sin(i)) = -i`. **Correct**.

**formatSignedBeta** (`logic.ts`, lines 27-31):

```ts
const sign = betaDeg > 0 ? "+" : "\u2212";
```

- Positive beta = "+" (above ecliptic). Negative beta = Unicode minus (below ecliptic). **Correct**.

**Beta curve in SVG** (`logic.ts`, lines 59-81):

```ts
const y = args.panelCenterY - beta * args.yScale;
```

- Positive beta (above ecliptic) gives `y < panelCenterY` (upward in SVG). **Correct** (SVG y-down, so subtracting moves up).

**Beta marker in main.ts** (line 330):

```ts
const markerY = clamp(-args.betaDeg * BETA_Y_SCALE, -140, 140);
```

- Negative sign on betaDeg means positive beta goes upward (negative y in the local coordinate system, which has `transform="translate(30, 180)"`). Consistent with the beta curve path builder. **Correct**.

### J. Eclipse Conditions  **PASS**

**computeDerived** (`logic.ts`, lines 186-245):

```ts
const isNewSyzygy =
    model.angularSeparationDeg(phaseAngle, 0) <= SYZYGY_TOLERANCE_DEG;
const isFullSyzygy =
    model.angularSeparationDeg(phaseAngle, 180) <= SYZYGY_TOLERANCE_DEG;

const solarType = isNewSyzygy
    ? model.solarEclipseType({ betaDeg, earthMoonDistanceKm }).type
    : "none";

const lunarType = isFullSyzygy
    ? model.lunarEclipseType({ betaDeg, earthMoonDistanceKm }).type
    : "none";
```

**Verification**:
- **Solar eclipse**: Requires New Moon (phase angle near 0) AND beta small enough. The code checks `angularSeparation(phaseAngle, 0) <= SYZYGY_TOLERANCE_DEG` (New Moon within 5 deg of syzygy), then delegates to `solarEclipseTypeFromBetaDeg` which checks whether `|beta|` is within geometric thresholds. **Correct**.
- **Lunar eclipse**: Requires Full Moon (phase angle near 180) AND beta small enough. Same pattern with 180 deg check. **Correct**.

**Phase angle** (`eclipseGeometryModel.ts`, line 23):

```ts
return normalizeAngleDeg(args.moonLonDeg - args.sunLonDeg);
```

- Phase angle = Moon longitude - Sun longitude. At New Moon, Moon and Sun are in the same direction: `moonLon = sunLon`, phase = 0. At Full Moon, they are opposite: `moonLon = sunLon + 180`, phase = 180. **Correct**.

**Solar eclipse type** (`eclipseGeometryModel.ts`, lines 196-228):

```ts
const { umbraRadiusKm, penumbraRadiusKm } = shadowRadiiKmAtDistance({
    bodyRadiusKm: moonRadiusKm,   // Moon casts shadow
    sunRadiusKm,
    distanceToSunKm: auKm,
    distanceFromBodyKm: dEarthMoonKm  // Shadow falls at Earth's distance
});

const partialLimitKm = earthRadiusKm + penumbraRadiusKm;
const centralLimitKm = earthRadiusKm + Math.abs(umbraRadiusKm);

if (impactKm <= centralLimitKm) {
    return { type: umbraRadiusKm > 0 ? "total-solar" : "annular-solar" };
}
```

- `umbraRadiusKm > 0` means the umbra converges beyond the Moon-Earth distance (Moon appears larger than Sun), so total eclipse. `umbraRadiusKm < 0` means the umbra converges before reaching Earth (Moon appears smaller), so annular. **Correct**.
- At perigee (363,300 km): The Moon's angular size is at maximum, more likely total.
- At apogee (405,500 km): The Moon's angular size is at minimum, more likely annular.
- The shadow radius formula (`shadowRadiiKmAtDistance`, lines 61-75) correctly computes `R_body - (d_from * (R_sun - R_body) / d_sun)` for umbra (convergent cone) and `R_body + (d_from * (R_sun + R_body) / d_sun)` for penumbra (divergent cone). **Correct**.

**Lunar eclipse type** (`eclipseGeometryModel.ts`, lines 162-194): Same pattern but with Earth's shadow at Moon's distance. Uses `bodyRadiusKm: earthRadiusKm` (Earth casts shadow). **Correct**.

---

## Additional Checks

### Orbit rendering convention (eclipse-geometry)

**main.ts lines 282-286** (orbit SVG):

```ts
const moonAngle = (Math.PI / 180) * moonDisplayLonDeg;
const mx = cx + r * Math.cos(moonAngle);
const my = cy + r * Math.sin(moonAngle);
```

This is a CW (clockwise) convention in SVG (y-down): angle 0 is right, angle 90 is down. This is consistent with the drag handler in `svgPointToAngleDeg` which uses `atan2(dy, dx)` with `dy = pointY - centerY` (y-down). **Consistent**.

### Drag handler (eclipse-geometry)

**logic.ts lines 42-51**:

```ts
const dx = pointX - centerX;
const dy = pointY - centerY;
return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
```

**main.ts lines 1243-1244**:

```ts
const ORBIT_CX_SVG = 40 + 220;  // 260
const ORBIT_CY_SVG = 40 + 180;  // 220
```

The orbit center in SVG coordinates is at the outer `translate(40,40)` plus the inner `translate(220,180)`, giving (260, 220). **Correct** (matches the HTML structure at lines 187 and 190).

**main.ts lines 1262-1265**:

```ts
const displayAngleDeg = svgPointToAngleDeg(ORBIT_CX_SVG, ORBIT_CY_SVG, pt.x, pt.y);
const newMoonLon = EclipseGeometryModel.normalizeAngleDeg(displayAngleDeg + state.sunLonDeg);
```

Since rendering subtracts `sunLonDeg` to get the display angle, the inverse correctly adds it back. **Correct**.

### Simulation syzygy-window tracking

The simulation (`stepSimulation`, lines 932-982) tracks syzygy windows using a "best within window" pattern. When the phase angle enters within `SYZYGY_TOLERANCE_DEG` of 0 or 180, a window opens. Within the window, the closest approach (smallest `sepDeg`) is tracked. When the phase angle exits the window, the eclipse type is evaluated at the best point. This avoids double-counting eclipses and finds the geometrically closest syzygy moment. **Correct pattern**.

### sunNoonAltitudeDeg

**Physics model** (`seasonsModel.ts`, line 38):

```ts
return 90 - Math.abs(args.latitudeDeg - args.sunDeclinationDeg);
```

This is the standard formula for solar noon altitude. The sun crosses the meridian at altitude `90 - |phi - delta|`. **Correct**.

---

## Bugs Found

**None**. Both demos have correct physics implementations.

---

## Sign Convention Issues

**None**. All coordinate transforms are consistent:
- SVG y-down is properly handled with negative signs where needed
- Beta positive = above ecliptic = upward in SVG (correct negation)
- Globe north = top of SVG (correct negation)
- Terminator shift sign is correct (positive declination = more northern hemisphere lit)
- Drag angle conversion is consistent with rendering convention

---

## Pedagogical Concerns

1. **Terminator approximation** (seasons): The terminator is rendered as a shifting circle rather than a proper ellipse with varying `rx = R*cos(delta)`. This is noted as "schematic" in the SVG, which is appropriate. For a more precise globe view, the terminator ellipse should narrow at equinoxes (where it is a straight line through the poles) and widen at solstices. The current approach gives the right qualitative behavior (shift direction and amount) but the terminator shape is approximate. **Minor concern, adequately noted in the UI.**

2. **Distance exaggeration label** (seasons): The orbit panel title says "Orbit (toy distance)" which is honest about the 8x exaggeration. **Good**.

3. **Declination model accuracy** (seasons): The export notes correctly state "~1 deg accuracy vs ephemeris" for the simplified model. The actual error is due to treating mean longitude L as linearly increasing, ignoring the equation of center. **Adequately disclaimed**.

4. **Syzygy tolerance** (eclipse-geometry): The 5-degree tolerance for interactive mode is reasonable for a teaching tool. The export notes clearly state this is "a simplified geometric model; it is not an ephemeris-grade eclipse predictor." **Adequately disclaimed**.

---

## Summary

| Item | Verdict |
|------|---------|
| A. Solar Declination | PASS |
| B. Day Length Formula | PASS |
| C. Distance Exaggeration | PASS |
| D. Globe Geometry | PASS (with note on terminator approximation) |
| E. SVG Coordinate Conventions | PASS |
| F. Animation | PASS |
| G. Rate Constants | PASS |
| H. Animate-Month Fix | PASS |
| I. Beta Calculation | PASS |
| J. Eclipse Conditions | PASS |

**Overall verdict**: The physics is correct in both demos. All formulas match standard astronomical references, all coordinate conventions are internally consistent, and all sign conventions are correct. No bugs found. The pedagogical disclaimers are appropriate and clearly communicated to students.
