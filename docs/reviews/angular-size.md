# Angular Size — Physics Review

**Reviewer:** Claude (automated physics audit)
**Date:** 2026-02-07
**Files audited:**
- `packages/physics/src/angularSizeModel.ts` (core model)
- `packages/physics/src/angularSizeModel.test.ts` (model tests)
- `packages/physics/src/units.ts` (unit conversions)
- `packages/physics/src/astroConstants.ts` (physical constants)
- `apps/demos/src/demos/angular-size/logic.ts` (display formatting)
- `apps/demos/src/demos/angular-size/main.ts` (DOM wiring + SVG rendering)
- `apps/demos/src/demos/angular-size/index.html` (markup + slider ranges)

## Summary

The angular-size demo correctly implements the exact angular diameter formula
`theta = 2 arctan(D / 2d)` with no small-angle approximation in the computation
path. Unit conversions (deg/arcmin/arcsec, km/AU/pc/kpc/Mpc/Gpc) are correct and
traced to authoritative constants (IAU 2012 AU, Williams & Boggs 2016 lunar
recession). The SVG geometry diagram faithfully reproduces the viewing-cone
geometry, and the sky-view panel uses correct linear angular-to-pixel scaling.
No physics errors were found.

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| `theta = 2 arctan(D / 2d)` | `angularSizeModel.ts:20` — `2 * Math.atan(diameterKm / (2 * distanceKm))` | Standard solid-geometry angular diameter | PASS |
| Inverse: `d = D / (2 tan(theta/2))` | `angularSizeModel.ts:33` — `diameterKm / (2 * Math.tan(theta / 2))` | Algebraic inverse of above | PASS |
| `deg = rad * 180 / pi` | `units.ts:127` — `(rad * 180) / Math.PI` | Standard conversion | PASS |
| `arcmin = deg * 60` | `units.ts:139` | Definition | PASS |
| `arcsec = deg * 3600` | `units.ts:143` | Definition | PASS |
| Moon recession: `d(t) = d_today + rate * t` | `angularSizeModel.ts:48` — linear model with `kmPerMyr = cmPerYr * 10` | Toy linear extrapolation; rate = 3.8 cm/yr (Williams & Boggs 2016) | PASS (noted as toy model in UI) |
| Moon orbit interpolation: `d(phi) = d_apo + w * (d_peri - d_apo)`, `w = (cos(phi) + 1) / 2` | `angularSizeModel.ts:217-218` | Smooth cosine interpolation (pedagogical simplification of elliptical orbit) | PASS |

## Physical Constants Verified

| Constant | Value Used | IAU/Standard Value | Status |
|----------|-----------|-------------------|--------|
| 1 AU (km) | 149,597,870.7 | IAU 2012: 149,597,870.7 km | PASS |
| 1 pc (km) | 3.0856775814914e13 | IAU: 3.0857e13 km | PASS |
| Sun diameter | 1.392e6 km | 1,392,000 km | PASS |
| Moon diameter | 3,474 km | 3,474.8 km (mean) | PASS |
| Moon mean distance | 384,400 km | 384,400 km (mean) | PASS |
| Moon recession rate | 3.8 cm/yr | 3.830 cm/yr (Williams & Boggs 2016) | PASS |
| Moon angular size range | 0.49 - 0.56 deg | ~0.491 (apogee) - ~0.558 (perigee) | PASS |

### Preset Spot-Checks

| Preset | theta (computed) | Expected | Status |
|--------|-----------------|----------|--------|
| Sun at 1 AU | 0.5331 deg | 0.5331 deg (31'59") | PASS |
| Moon at 384,400 km | 0.5178 deg | 0.518 deg (31'5") | PASS |
| Jupiter at opposition (628.7 Mkm) | 0.01274 deg ~ 45.9" | ~46" at opposition | PASS |
| ISS (109 m @ 420 km) | 0.01486 deg ~ 53.5" | ~53" typical | PASS |

## Rendering Chains Audited

### Geometry Diagram (SVG Stage)

The rendering chain is:

1. `render()` computes `thetaDegValue` from `AngularSizeModel.angularDiameterDeg()`.
2. `renderStage(thetaDegValue)` converts to radians, computes `halfRad = thetaRad / 2`.
3. SVG "radius" (half-height of object at objectX): `radius = tan(halfRad) * (objectX - observerX)`.
   - Observer at x=90, object at x=520, so horizontal span = 430 SVG units.
   - This is geometrically exact: the apparent half-height at distance L from the apex of a cone with half-angle `halfRad` is `L * tan(halfRad)`.
4. Radius is clamped to `[0, 130]` SVG units to keep the diagram readable.
5. Object circle radius has a floor of 6 SVG units for visibility.
6. Light-cone rays emanate from observer (90, 180) to object top/bottom edges.
7. Angle arc uses unit-vector projection onto a 56 SVG-unit arc radius — correctly renders the visual opening angle.

**Verdict:** The SVG diagram correctly represents the viewing-cone geometry. The `tan(halfRad)` mapping is the exact geometric relationship, not an approximation. Clamping is cosmetic only; numeric readouts are authoritative (as stated in the "Model notes" tab).

### Sky View Panel

1. Adaptive FOV: `fovDeg = clamp(3 * thetaDegValue, 0.5, 60)` — object fills ~1/3 of viewport.
2. Object pixel radius: `objR = (thetaDegValue / fovDeg) * VIEWPORT_R` where VIEWPORT_R = 140.
   - This is correct linear angular-to-pixel mapping (gnomonic projection is linear for small FOV).
   - Clamped to `[2, 138]` pixels.
3. Full Moon reference ring: `refR = (0.533 / fovDeg) * VIEWPORT_R` — correctly scaled relative to FOV.
4. FOV label auto-switches between deg/arcmin/arcsec display.

**Verdict:** Correct. The linear scaling is appropriate for the FOV range (0.5-60 deg), where gnomonic distortion is negligible.

### Unit Display

- `formatAngleDisplay()`: auto-selects deg (>= 1 deg), arcmin (>= 1'), arcsec (< 1'). Thresholds correct.
- `formatDistanceAuto()`: progression cm -> m -> km -> AU -> pc -> kpc -> Mpc -> Gpc with sensible breakpoints.
- `formatDiameterAuto()`: similar progression tailored for object sizes.
- Forced unit selectors bypass auto and apply the chosen unit directly.

## Slider Ranges and Physical Validity

| Slider | Min | Max | Physical meaning | Status |
|--------|-----|-----|-----------------|--------|
| Distance | 0.0001 km (0.1 m) | 1e20 km (~10.6 Gly) | Arm's length to cosmological horizon | PASS |
| Diameter | 0.00001 km (1 cm) | 1e19 km (~galaxy-cluster scale) | Coin to galaxy cluster | PASS |
| Moon orbit angle | 0 deg | 360 deg | Full orbit (cosine-interpolated) | PASS |
| Moon recession time | -1000 Myr | +1000 Myr | 1 Gyr past to 1 Gyr future | PASS |

All sliders use logarithmic mapping via `logSliderToValue()` (HTML range 0-1000 mapped log-linearly), which is appropriate for the ~24-order-of-magnitude distance range.

## Edge Case Handling

| Case | Behavior | Status |
|------|----------|--------|
| Distance = 0 | Returns theta = 180 deg (fills hemisphere) | PASS |
| Diameter = 0 | Returns theta = 0 deg (point source) | PASS |
| Non-finite inputs | Returns 0, 180, or em-dash display | PASS |
| theta > 90 deg | SVG adds `--wide` class; radius clamped to 130 | PASS |
| Extreme tan(halfRad) | Clamped via `Math.min(maxRadius, radius)` | PASS |

## Issues Found

None. The physics implementation is correct throughout the full chain from model to rendering.

### Minor Notes (non-issues, informational only)

1. **Moon orbit model is simplified:** The cosine interpolation between perigee and apogee is a pedagogical simplification of the actual elliptical orbit. This is appropriate for the demo's purpose and is not presented as an exact orbital model.

2. **Recession model is linear:** The Moon recession uses a constant rate extrapolation, which is labeled as a "toy model" in the export notes. Over 1 Gyr timescales, tidal evolution is nonlinear, but the linear model serves the pedagogical goal of showing how angular size changes with distance.

3. **`moonOrbitPeigeeApogeeKm` has a typo** ("Peigee" instead of "Perigee") in the function name. This is a cosmetic code-quality issue, not a physics error.
