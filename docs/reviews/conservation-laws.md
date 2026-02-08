# Conservation Laws -- Physics Review

## Summary

The conservation-laws demo implements a 2D Kepler orbit visualization with user-controlled initial conditions (central mass, initial radius, speed factor relative to circular speed, and launch direction). It computes orbital elements from the state vector, classifies the orbit (circular/elliptical/parabolic/hyperbolic), and animates the particle along the conic section using Kepler's second law (constant areal velocity). All physics equations were verified against standard references and found to be correct.

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| Gravitational parameter: mu = G * M, G = 4pi^2 AU^3/(yr^2 Msun) | `twoBodyAnalytic.ts:84-87` -- `muAu3Yr2FromMassSolar(M) = 4*pi^2 * M` | Kepler teaching normalization | CORRECT |
| Circular speed: v_c = sqrt(mu/r) | `twoBodyAnalytic.ts:96-101` -- `circularSpeedAuPerYr({mu, r}) = sqrt(mu/r)` | Standard result | CORRECT |
| Escape speed: v_esc = sqrt(2*mu/r) | `twoBodyAnalytic.ts:103-108` -- `escapeSpeedAuPerYr({mu, r}) = sqrt(2*mu/r)` | Standard result; v_esc = sqrt(2) * v_c verified by "escape" preset using `Math.SQRT2` | CORRECT |
| Vis-viva: v = sqrt(mu*(2/r - 1/a)) | `twoBodyAnalytic.ts:110-123` -- `visVivaSpeedAuPerYr({r, a, mu})` | Standard vis-viva equation | CORRECT |
| Specific energy: eps = v^2/2 - mu/r | `twoBodyAnalytic.ts:137-147` -- `specificEnergyAu2Yr2({r, v, mu})` | Definition of specific orbital energy | CORRECT |
| Angular momentum: h_z = x*vy - y*vx | `twoBodyAnalytic.ts:202` -- `hz = x*vy - y*vx` | z-component of r x v in 2D | CORRECT |
| Eccentricity vector: e = (v x h)/mu - r_hat | `twoBodyAnalytic.ts:206-211` -- `ex = (vy*hz)/mu - rx; ey = (-vx*hz)/mu - ry` | Standard e-vector formula in 2D: (v x h_z) = (vy*hz, -vx*hz, 0) | CORRECT |
| Semi-latus rectum: p = h^2/mu | `twoBodyAnalytic.ts:214` -- `p = (h*h)/muAu3Yr2` | Standard definition | CORRECT |
| Semi-major axis: a = -mu/(2*eps) | `twoBodyAnalytic.ts:218` -- `a = -muAu3Yr2/(2*eps)` with tolerance guard for eps~0 | Standard result from eps = -mu/(2a) | CORRECT |
| Argument of periapsis: omega = atan2(ey, ex) | `twoBodyAnalytic.ts:221` -- `omega = ecc < 1e-14 ? 0 : atan2(ey, ex)` | Direction of eccentricity vector | CORRECT |
| Conic equation: r(nu) = p/(1 + e*cos(nu)) | `conservationLawsModel.ts:162` and `logic.ts:130` -- `r = pAu / denom` where `denom = 1 + ecc * cos(nuRad)` | Standard conic equation | CORRECT |
| Instantaneous speed: v = (mu/h)*sqrt(1 + 2e*cos(nu) + e^2) | `logic.ts:188-190` -- `q = 1 + 2*ecc*cos(nu) + ecc^2; v = (mu/h)*sqrt(q)` | Derived from v_r = (mu/h)*e*sin(nu), v_theta = (mu/h)*(1+e*cos(nu)); v^2 = (mu/h)^2*(1+2e*cos+e^2) | CORRECT |
| Kepler's 2nd law animation: d(nu)/dt = h/r^2 | `main.ts:231-232` -- `nuSpeedRadPerYr = hAbs/(r*r)` | Standard form of angular momentum conservation | CORRECT |
| Tangent direction: d(r*cos(nu), r*sin(nu))/d(nu) | `logic.ts:149-161` -- `drDnu = p*e*sin/(denom^2); dx = drDnu*cos - r*sin; dy = drDnu*sin + r*cos` | Chain rule on conic polar coords | CORRECT |
| Hyperbola domain: 1 + e*cos(nu) > 0 => cos(nu) > -1/e | `conservationLawsModel.ts:69` -- `nuMax = acos(-1/e) - EPS` | Standard asymptote condition | CORRECT |
| Periapsis distance: r_p = p/(1+e) | `main.ts:358` -- `rpAu = anim.pAu / (1 + anim.ecc)` | nu = 0 in conic equation | CORRECT |
| Apoapsis distance: r_a = p/(1-e) | `main.ts:348` -- `ra = elements.pAu / (1 - elements.ecc)` (for view scaling) | nu = pi in conic equation | CORRECT |
| Direction convention: 0 deg = tangential, +/-90 deg = radial | `conservationLawsModel.ts:37` -- `vx = speed*sin(angle); vy = speed*cos(angle)` | At r=(r0, 0), tangential = +y direction; radial = +x direction. sin/cos decomposition maps 0 deg -> (0, speed), correct | CORRECT |

## Rendering Chains Audited

**Initial conditions -> State vector -> Orbital elements -> SVG rendering:**

1. UI sliders produce `(massSolar, r0Au, speedFactor, directionDeg)`.
2. `recomputeOrbit()` computes `mu = 4*pi^2 * M`, `v_circ = sqrt(mu/r0)`, `v0 = speedFactor * v_circ`.
3. `ConservationLawsModel.initialStateAuYr()` places particle at `(r0, 0)` with velocity decomposed by `directionDeg`. At 0 deg: velocity is purely tangential (+y), matching the physics convention that tangential velocity at the +x axis points in the +y direction.
4. `TwoBodyAnalytic.orbitElementsFromStateAuYr()` computes eps, h, e-vector, p, a, omega from the state vector.
5. `orbitalRadiusAu()` and `conicPositionAndTangentAu()` compute positions and tangent directions from (e, p, omega, nu).
6. `toSvg()` converts (xAu, yAu) to SVG pixels with y-flip (`cy - yAu * scale`), consistent with SVG y-down convention.
7. `velocityArrowSvg()` converts the orbital tangent to SVG coordinates with the same y-flip, and scales the arrow length by `vRatio = v/v_circ`.
8. Animation advances nu using `d(nu)/dt = h/r^2` (Kepler II), with sub-stepping (20ms max step, 100ms total dt clamp) for stability.

**Orbit classification chain:**

- `classifyOrbit()` in logic.ts and `orbitElementsFromStateAuYr()` in twoBodyAnalytic.ts both use consistent eccentricity thresholds. The classification (e < 1e-6 -> circular, |e-1| < 1e-6/1e-8 -> parabolic, e < 1 -> elliptical, e > 1 -> hyperbolic) is physically correct. The slight threshold difference (1e-6 in logic.ts vs 1e-8 in twoBodyAnalytic.ts) is harmless because the physics model's classification is authoritative and logic.ts classification is only used for display formatting.

**Speed-factor presets:**

- Circular: speedFactor = 1.0 => v = v_circ => e = 0, eps = -mu/(2r). Correct.
- Elliptical: speedFactor = 0.75 => v < v_circ => 0 < e < 1. Correct.
- Escape: speedFactor = sqrt(2) => v = v_esc => e = 1, eps = 0. Correct.
- Hyperbolic: speedFactor = 1.8 => v > v_esc => e > 1, eps > 0. Correct.

## Issues Found

None. All physics equations, rendering chains, coordinate conventions, and orbit classifications are correct. The SVG y-flip is consistently applied throughout. The animation time-stepping correctly uses Kepler's second law with appropriate sub-step size limits and dt clamping for tab-backgrounding robustness. The instantaneous speed formula, eccentricity vector computation, and conic sampling are all standard and verified.
