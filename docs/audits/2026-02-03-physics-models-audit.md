# Cosmic Playground - Physics/Models Correctness Audit (Demo-by-Demo)

**Date:** 2026-02-03

**Scope:** Physics correctness and "application" correctness for each demo in `apps/demos/src/demos/*`, with recommended corrections. No code changes in this audit.

**Primary contracts referenced:**
- `docs/specs/cosmic-playground-model-contract.md` (units + correctness + tests)
- `docs/specs/cosmic-playground-site-spec.md` (shared physics in `packages/physics`)
- `docs/specs/cosmic-playground-legacy-demo-migration-contract.md` (math authoring as LaTeX, avoid unicode math in authored source)

## What is enforced today (machine checks)

These are currently enforced by repo tooling:

- **Model contract structure**: `node scripts/validate-physics-models.mjs` ensures each `packages/physics/src/*Model.ts` has a corresponding `*Model.test.ts` and that model symbols are exported from `packages/physics/src/index.ts`.
- **Unit test presence and basic correctness**: `corepack pnpm -C packages/physics test` runs vitest checks that include benchmark and sanity tests across multiple models.
- **No unicode math in selected sources**: `node scripts/validate-math-formatting.mjs` scans `apps/demos/src/demos/**`, `apps/site/src/content/**`, and `packages/runtime/src/**` for unicode math symbols. (It does not currently scan `packages/physics/src/**`.)

Not enforced (gaps relevant to this audit):

- **"No approximations if an exact model is feasible"** is not mechanically enforced. Several demos explicitly label toy models; that labeling is good, but it is still a policy decision to accept or replace a given approximation.
- **Physics correctness at the application layer** (for example, whether a demo uses the best available model from `packages/physics` or duplicates a formula) is not automatically checked.

## Audit rubric (applied to each demo)

For each demo, this audit checks:

1) **Model source**: Is the physics implemented in `packages/physics` when it is reusable?
2) **Units**: Are units explicit in identifiers, UI labels, exports, and notes?
3) **Correctness**: Are equations correct for the stated model?
4) **Approximations**: Are approximations clearly labeled, and could an exact model be implemented at reasonable cost?
5) **Tests**: Does `packages/physics` contain relevant benchmark/limiting-case tests for the model being used?

## Demo-by-demo findings

### 1) `angular-size`

**Files:**
- Demo: `apps/demos/src/demos/angular-size/main.ts`
- Model: `packages/physics/src/angularSizeModel.ts`
- Tests: `packages/physics/src/angularSizeModel.test.ts`

**Physics goal (as implemented):**
- Compute angular diameter from diameter and distance, and explore the Moon's angular-size range.

**Core equation (correct and exact):**
$$\\theta = 2\\arctan\\left(\\frac{D}{2d}\\right)$$

**Strengths:**
- Uses an exact angular diameter formula in `AngularSizeModel.angularDiameterDeg(...)`.
- Units are explicit in exports and UI labels (`D` in km, `d` in km, `\\theta` in deg with display conversions to arcmin/arcsec).
- Tests include benchmarks for the Sun at 1 AU and the Moon today.
- Moon recession mode is labeled as a toy model (good honesty).

**Limitations / approximations:**
- **Moon orbit mode currently uses a cosine interpolation between perigee and apogee distances** (`getMoonDistanceAtOrbitAngle`). This is not the Keplerian ellipse radius law.
  - The exact (still simple) ellipse relation is:
    - From perigee and apogee:
      $$a = \\frac{r_p + r_a}{2}, \\quad e = \\frac{r_a - r_p}{r_a + r_p}$$
    - Radius vs true anomaly:
      $$r(\\nu) = \\frac{a(1-e^2)}{1 + e\\cos\\nu}$$
  - This correction is feasible and would remove an approximation without increasing conceptual complexity.
- **Moon recession mode** is explicitly a toy model with constant recession rate. A physically correct tidal-evolution model is not trivial and is acceptable to keep as a toy model, but it should remain clearly labeled (it currently is).

**Recommended corrections (no code changes here):**
- Replace the orbit-mode interpolation with the exact ellipse radius law above (derive `a` and `e` from the existing `perigeeKm`/`apogeeKm` values).
  - Implementation could reuse `TwoBodyAnalytic.orbitalRadius({ a, e, thetaRad })` to stay DRY.
- If you keep an "orbit angle" slider, define it explicitly as true anomaly `\\nu` (or rename the slider label to avoid implying physical time).

---

### 2) `binary-orbits`

**Files:**
- Demo: `apps/demos/src/demos/binary-orbits/main.ts`
- Model: `packages/physics/src/twoBodyAnalytic.ts`
- Tests: `packages/physics/src/twoBodyAnalytic.test.ts`

**Physics goal (as implemented):**
- Show barycenter motion and period scaling for a two-body system.

**Core relationships (correct under stated assumptions):**
- Kepler normalization in AU/yr/$M_{\\odot}$ teaching units:
  $$G = 4\\pi^2\\,\\frac{\\mathrm{AU}^3}{\\mathrm{yr}^2\\,M_{\\odot}}$$
- For a circular relative orbit with separation `a` (AU) and total mass $M_1 + M_2$ (in $M_{\\odot}$):
  $$P^2 = \\frac{a^3}{M_1 + M_2}$$
- Barycenter distances (for separation `a`):
  $$r_1 = a\\,\\frac{M_2}{M_1+M_2}, \\quad r_2 = a\\,\\frac{M_1}{M_1+M_2}$$

**Strengths:**
- Uses `TwoBodyAnalytic.orbitalPeriodYrFromAuSolar(...)` so the teaching normalization is centralized and tested.
- Clearly labels its assumptions ("perfectly circular, coplanar, point masses").
- Units are explicit in exports.

**Limitations / approximations:**
- Circular/coplanar assumption is explicit and acceptable for the purpose of this demo.

**Recommended corrections (no code changes here):**
- None required for correctness, given the stated model. If future scope expands to eccentric binaries, use `TwoBodyAnalytic` ellipse geometry and define what angle slider means (mean anomaly vs true anomaly).

---

### 3) `blackbody-radiation`

**Files:**
- Demo: `apps/demos/src/demos/blackbody-radiation/main.ts`
- Model: `packages/physics/src/blackbodyRadiationModel.ts`
- Tests: `packages/physics/src/blackbodyRadiationModel.test.ts`

**Physics goal (as implemented):**
- Show Planck curve shape, Wien peak shift, and steep $T^4$ scaling.

**Core equations (implemented correctly):**
- Planck spectral radiance (implemented in CGS, as a function of wavelength):
$$B_{\\lambda}(T) = \\frac{2hc^2}{\\lambda^5}\\,\\frac{1}{\\exp\\left(\\frac{hc}{\\lambda kT}\\right)-1}$$
- Wien displacement law:
$$\\lambda_{\\mathrm{peak}}\\,T = b$$
- Stefan-Boltzmann scaling at fixed radius:
$$\\frac{L}{L_{\\odot}} = \\left(\\frac{T}{T_{\\odot}}\\right)^4$$

**Strengths:**
- Core physics is implemented in `packages/physics` with tests and benchmark checks (Sun peak wavelength, $T^4$ scaling).
- Units are explicit: internal wavelength in cm, display in nm; temperature in K.
- The demo explicitly labels the star color preview as an approximation (good).

**Limitations / approximations:**
- "Color" mapping is intentionally approximate (not colorimetry). This is acceptable if framed as a qualitative preview.
- The plot uses normalized intensity (good for teaching shape), so it is not a physically calibrated brightness plot. This should remain explicit in copy (it currently is).

**Recommended corrections (no code changes here):**
- Optional: add one more benchmark test for relative peak shift (for example, doubling $T$ halves $\\lambda_{\\mathrm{peak}}$) to strengthen regression coverage.

---

### 4) `conservation-laws`

**Files:**
- Demo: `apps/demos/src/demos/conservation-laws/main.ts`
- Models: `packages/physics/src/conservationLawsModel.ts`, `packages/physics/src/twoBodyAnalytic.ts`
- Tests: `packages/physics/src/conservationLawsModel.test.ts`, `packages/physics/src/twoBodyAnalytic.test.ts`

**Physics goal (as implemented):**
- Demonstrate how conserved specific energy $\\varepsilon$ and angular momentum $|h|$ determine orbit type and shape.

**Core relations (implemented correctly in teaching units):**
- Specific energy:
$$\\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r}$$
- Conic polar form:
$$r(\\nu) = \\frac{p}{1 + e\\cos\\nu}$$
- Speed as a function of $e$ and $\\nu$ (via $v_r$/$v_{\\theta}$ relation, expressed in the demo as):
$$v = \\frac{\\mu}{|h|}\\sqrt{1 + 2e\\cos\\nu + e^2}$$

**Strengths:**
- Uses `TwoBodyAnalytic.orbitElementsFromStateAuYr(...)` rather than ad hoc classification logic.
- Orbit plotting uses conic-section geometry in `packages/physics` and is test-backed.
- Units are explicit (AU, yr, $M_{\\odot}$) and the teaching normalization is stated.

**Limitations / approximations:**
- For open orbits, the curve is clipped to a finite plotting window. This is a visualization constraint, not a physics error, and is labeled.

**Recommended corrections (no code changes here):**
- None required for correctness given current scope.

---

### 5) `eclipse-geometry`

**Files:**
- Demo: `apps/demos/src/demos/eclipse-geometry/main.ts`
- Model: `packages/physics/src/eclipseGeometryModel.ts`
- Tests: `packages/physics/src/eclipseGeometryModel.test.ts`

**Physics goal (as implemented):**
- Teach the geometry conditions for solar and lunar eclipses (syzygy plus small enough ecliptic latitude $|\\beta|$) and how thresholds change with Earth-Moon distance.

**Core ingredients (implemented correctly for the stated simplified model):**
- Phase angle:
$$\\Delta = (\\lambda_{\\mathrm{Moon}} - \\lambda_{\\odot})\\bmod 360$$
- Ecliptic latitude (for a simplified tilted orbit geometry):
$$\\beta = \\arcsin\\left(\\sin i\\,\\sin(\\lambda_{\\mathrm{Moon}}-\\Omega)\\right)$$
- Umbra/penumbra radii from similar triangles (implemented in km):
  - These relations are correct within a 1D collinear Sun-body geometry model.

**Strengths:**
- Keeps the model in `packages/physics` with tests that validate physically ordered thresholds and expected outcomes (total vs annular at different Earth-Moon distances).
- Units are explicit (deg and km) and exports include thresholds.
- The demo is explicit that it is not an ephemeris-grade predictor.

**Limitations / approximations (some feasible to improve):**
- Uses a "syzygy tolerance" for interaction gating. This is a UI design choice; it should remain described as a pedagogical tolerance (it is).
- Uses a fixed Earth-Sun distance (1 AU) by default. Seasonal variation is small but real (order percent). An exact Keplerian distance model is feasible but may not be necessary for the learning goal.

**Recommended corrections (no code changes here):**
- Optional: allow `distanceToSunKm` as an explicit parameter (even if it defaults to 1 AU) so the approximation is explicit in the model API and can be explored if desired.

---

### 6) `em-spectrum`

**Files:**
- Demo: `apps/demos/src/demos/em-spectrum/main.ts`
- Models: `packages/physics/src/photonModel.ts`, `packages/physics/src/units.ts`
- Data: `packages/data-spectra/src/index.ts`
- Tests: `packages/physics/src/photonModel.test.ts`, `packages/physics/src/units.test.ts`

**Physics goal (as implemented):**
- Convert between wavelength, frequency, and photon energy; contextualize bands and example telescopes/lines.

**Core relations (implemented correctly):**
$$c = \\lambda\\nu$$
$$E = h\\nu = \\frac{hc}{\\lambda}$$

**Strengths:**
- Conversions live in `PhotonModel` and use `AstroConstants` as the single source of truth.
- Units are explicit (cm, nm, Hz, eV) and conversions are centralized and test-backed.
- Demo inputs enforce positivity and handle invalid inputs safely.

**Limitations / approximations:**
- Band boundaries and example lists are definitional/curated rather than computed; that is appropriate for this demo.

**Recommended corrections (no code changes here):**
- None required for correctness.

---

### 7) `keplers-laws`

**Files:**
- Demo: `apps/demos/src/demos/keplers-laws/main.ts`
- Models: `packages/physics/src/keplersLawsModel.ts`, `packages/physics/src/twoBodyAnalytic.ts`, `packages/physics/src/units.ts`
- Tests: `packages/physics/src/keplersLawsModel.test.ts`, `packages/physics/src/twoBodyAnalytic.test.ts`

**Physics goal (as implemented):**
- Show Kepler's Third Law scaling and speed variation around an ellipse, using a stable solver for Kepler's equation.

**Core relations (implemented correctly):**
- Teaching normalization:
$$G = 4\\pi^2\\,\\frac{\\mathrm{AU}^3}{\\mathrm{yr}^2\\,M_{\\odot}}$$
so that:
$$P^2 = \\frac{a^3}{M}$$
- Kepler's equation (solved numerically in `TwoBodyAnalytic`):
$$M = E - e\\sin E$$

**Strengths:**
- Uses a Newton solver for Kepler's equation and converts mean anomaly to true anomaly with correct geometry.
- Keeps unit conventions explicit and centralized; includes conversion to km/s for display.
- Clamps eccentricity for numerical stability (explicitly described in the model).

**Limitations / approximations:**
- Eccentricity is clamped to avoid the stiff $e \\to 1$ regime. This is a practical UI constraint and is acceptable.

**Recommended corrections (no code changes here):**
- None required for correctness within the intended domain.

---

### 8) `moon-phases`

**Files:**
- Demo: `apps/demos/src/demos/moon-phases/main.ts`
- Runtime: `packages/runtime/src/index.ts` (export formatting)

**Physics goal (as implemented):**
- Teach that phases are geometry (illumination fraction) rather than Earth's shadow.

**Core relation (implemented correctly for the stated definition of phase angle):**
$$f = \\frac{1 + \\cos\\alpha}{2}$$
where $\\alpha$ is the Sun-Moon-Earth phase angle (as defined by the demo's slider convention).

**Strengths:**
- Uses the standard illuminated fraction equation with a clear model note in the help panel.
- Makes the phase-angle convention explicit: $\\alpha = 0$ is Full, $\\alpha = 180$ is New.
- Exports include units and avoids unicode math in authored strings.

**Limitations / approximations:**
- The terminator drawing is explicitly "not a full 3D ray-trace" and uses a 2D visualization trick. This is acceptable for the learning goal if it remains labeled (it is).
- The demo does not model orbital motion, inclination, or libration. This is a scope choice.

**Recommended corrections (no code changes here):**
- Optional: if you want more physically faithful rendering (still without ephemerides), use a simple Lambertian shading on a disk driven by $\\alpha$ rather than the circle-intersection trick. This would reduce "visual approximation" while keeping the same underlying math.

---

### 9) `parallax-distance`

**Files:**
- Demo: `apps/demos/src/demos/parallax-distance/main.ts`
- Model: `packages/physics/src/parallaxDistanceModel.ts`
- Data: `packages/data-astr101/src/index.ts`
- Tests: `packages/physics/src/parallaxDistanceModel.test.ts`

**Physics goal (as implemented):**
- Teach the parsec definition and how distance scales as $1/p$.

**Core relation (implemented correctly):**
$$d(\\mathrm{pc}) = \\frac{1}{p(\\mathrm{arcsec})}$$
and:
$$p(\\mathrm{arcsec}) = \\frac{p(\\mathrm{mas})}{1000}$$

**Strengths:**
- Uses `ParallaxDistanceModel` with explicit units (pc, ly, arcsec, mas).
- Includes an explicit note that the diagram is schematic/exaggerated.
- Exports are unit-labeled.

**Limitations / approximations:**
- The demo does not attempt a statistically correct distance inference under noisy parallax (for example, bias and priors). That is acceptable for a "definition-first" instrument, but it is worth noting as a limitation.

**Recommended corrections (no code changes here):**
- Optional: add an "advanced note" that naive inversion becomes unreliable at low signal-to-noise, without implementing a full Bayesian estimator.

---

### 10) `planetary-conjunctions`

**Files:**
- Demo stub: `apps/demos/src/demos/planetary-conjunctions/main.ts`
- Stub helper: `apps/demos/src/shared/stub-demo.ts`

**Status:**
- This demo is currently a stub and does not implement a physics model yet.

**Recommended model direction (no code changes here):**
- A minimal, correctness-first model can still avoid misleading approximations:
  - Represent planets with circular heliocentric orbits (clearly labeled as circular) using known sidereal periods $P$.
  - Define conjunction as equality of ecliptic longitudes $\\lambda_1(t) = \\lambda_2(t)$ (mod $360$).
  - Synodic period:
    $$\\frac{1}{P_{\\mathrm{syn}}} = \\left|\\frac{1}{P_1} - \\frac{1}{P_2}\\right|$$
- If you want to go beyond circular orbits, reuse `TwoBodyAnalytic` for a Keplerian ellipse and define what orbital elements are included (still no ephemeris claim unless you ingest real elements).

---

### 11) `seasons`

**Files:**
- Demo: `apps/demos/src/demos/seasons/main.ts`
- Model: `packages/physics/src/seasonsModel.ts`
- Tests: `packages/physics/src/seasonsModel.test.ts`

**Physics goal (as implemented):**
- Teach that axial tilt drives seasons via solar declination, day length, and noon altitude; optionally show Earth-Sun distance variation.

**Core relations (declination and day length are correct for the stated toy model):**
- Declination (toy model in the code and explicitly labeled):
$$\\delta \\approx \\arcsin\\left(\\sin\\varepsilon\\,\\sin L\\right)$$
- Day length (standard spherical astronomy relation):
$$\\cos H_0 = -\\tan\\phi\\,\\tan\\delta, \\quad \\mathrm{dayLength} = \\frac{2H_0}{15^{\\circ}/\\mathrm{h}}$$

**Strengths:**
- Model lives in `packages/physics` with tests that check equinox and solstice behavior and day-length sanity.
- The demo is explicit (in exported notes) that declination and distance are approximations and that distance is not the main cause of seasons.
- Units are explicit across UI and exports.

**Limitations / approximations (and which are feasible to remove):**
- Earth-Sun distance is currently modeled as:
  $$r \\approx 1 - e\\cos\\theta$$
  which is a first-order approximation and not a Keplerian solver.
  - An exact ellipse radius is feasible and already supported by `TwoBodyAnalytic`:
    - Compute mean anomaly from day-of-year:
      $$M = 2\\pi\\,\\frac{t - t_p}{P}$$
    - Solve for true anomaly $\\nu$ (Kepler equation), then:
      $$r(\\nu) = \\frac{a(1-e^2)}{1 + e\\cos\\nu}$$
  - This is a good candidate for upgrading to an exact model because it removes an approximation with minimal complexity.
- Declination uses uniform-in-time ecliptic longitude (ignores equation of center). Improving this is feasible but may not be necessary for the learning goals; it should remain labeled as an approximation unless upgraded.

**Recommended corrections (no code changes here):**
- Replace `SeasonsModel.earthSunDistanceAu(...)` with an exact Keplerian ellipse radius model using `TwoBodyAnalytic.meanToTrueAnomalyRad(...)` and `TwoBodyAnalytic.orbitalRadius(...)`, with `a = 1\\,\\mathrm{AU}` and `e = 0.0167` (or the chosen value).
- Keep the "distance is not the cause of seasons" messaging, but make the distance curve physically correct so students do not see an artifact of the approximation.

---

### 12) `telescope-resolution`

**Files:**
- Demo: `apps/demos/src/demos/telescope-resolution/main.ts`
- Models: `packages/physics/src/telescopeResolutionModel.ts`, `packages/physics/src/units.ts`
- Data: `packages/data-telescopes/src/index.ts`
- Tests: `packages/physics/src/telescopeResolutionModel.test.ts`

**Physics goal (as implemented):**
- Teach diffraction limit scaling with $\\lambda$ and $D$, compare with seeing, and classify binary resolution.

**Core relations (implemented correctly):**
- Rayleigh criterion scaling:
$$\\theta_{\\mathrm{diff}} \\approx 1.22\\,\\frac{\\lambda}{D}$$

**Strengths:**
- Diffraction scaling is correct and test-backed with a Hubble benchmark.
- Units are explicit at boundaries: wavelength computed in cm, aperture in cm; readouts in arcsec.
- PSF rendering uses a normalized Airy intensity profile (with a documented approximation for $J_1$).
- The demo labels its classification thresholds as didactic rather than instrument-grade.

**Limitations / approximations (some feasible to refine):**
- The Bessel $J_1$ implementation is an approximation, but is appropriate for visualization and is regression-tested via sanity checks.
- Atmospheric seeing is modeled with a Gaussian blur kernel in the application rendering path, while the diffraction PSF is Airy. A fully correct convolution is not available in closed form; any practical implementation will still use approximations.
- The "effective resolution" combination rule is a simplified heuristic. It is acceptable as long as it stays labeled as didactic (it currently is).

**Recommended corrections (no code changes here):**
- If you want to reduce approximation-induced artifacts while staying simple:
  - Define the seeing PSF explicitly as a Gaussian with a sigma derived from FWHM, and compute an effective sigma by combining sigmas in quadrature (only if you keep the Gaussian assumption).
  - Consider switching the seeing blur to a Moffat profile (more realistic) if the goal is to emphasize realistic tails; still an approximation, but a better one.

## Cross-demo recommendations (prioritized)

1) **Upgrade feasible-to-fix approximations to exact models (highest value):**
   - `angular-size`: replace Moon orbit distance interpolation with exact ellipse $r(\\nu)$.
   - `seasons`: replace Earth-Sun distance approximation with exact ellipse radius computed via Kepler equation (reuse `TwoBodyAnalytic`).

2) **Make approximations mechanically discoverable (enforcement):**
   - Add a lightweight policy doc section or checklist item: "If a demo uses an approximation where an exact model is feasible, the export notes must say why we did not implement the exact model."

3) **Optional validator expansion (no code changes in this audit):**
   - Extend `scripts/validate-math-formatting.mjs` to include `packages/physics/src/**` if you want the "no unicode math in source" policy to apply repo-wide (or restrict it to teaching-facing strings only).

