# Backlog

## Next

- Expand demo content seeding and improve topic taxonomy.
- Refactor additional demos into `apps/demos/src/demos/<slug>/` once the pilot demo quality bar is met.
- Harden the Authoring Kit templates + docs.

## Later

- Optional `noindex` and nav omission rules for instructor routes (if not already).
- Accessibility audits + keyboard testing checklist per component.

## Physics / models (SoTA validation)

### Cross-check infrastructure (beyond unit tests)

- Higher-than-unit-test confidence, the next step would be a numeric cross-check against a second, independent implementation (e.g. a high-precision reference) over a dense grid of `((e, M))`, but that's beyond what we can truthfully call "guaranteed" in this codebase today.
- Add a high-confidence numeric cross-check suite for `packages/physics` models (dense parameter sweeps vs a second, independent implementation / higher-precision reference), beyond unit tests.
- Implement “reference” helpers that are intentionally independent of production code paths (no shared helpers) and run them only in tests:
  - Example: a second Kepler solver implementation (series + bisection-only) used only for test cross-checks.
  - Example: a second Airy PSF implementation using a different J1 approximation to validate `besselJ1Approx()`.
- Add stress tests for numerical stability:
  - very large/small inputs
  - negative/edge-case inputs (where the model defines behavior)
  - windows far from the origin in time for orbit models (e.g. $|t| \sim 10^6$ day)
- Prefer invariants + inequality bounds over brittle “golden decimals”.

### Model-by-model SoTA checklist

- `AngularSizeModel` (`packages/physics/src/angularSizeModel.ts`)
  - Dense sweep: verify monotonicity ($\theta$ decreases with $d$ for fixed $D$; increases with $D$ for fixed $d$).
  - Cross-check small-angle limit: for $D/d \ll 1$, validate $\theta \approx D/d$ (radians) to a tolerance that scales with $(D/d)^3$.
  - Add dimensional-analysis-style tests on the inverse function `distanceForAngularDiameterDeg()`.

- `PhotonModel` (`packages/physics/src/photonModel.ts`)
  - Cross-check closure: $\lambda \to \nu \to \lambda$ and $E \to \nu \to E$ over a dense grid (with relative error bounds).
  - Add a set of benchmark points (radio, optical, X-ray) with expected order-of-magnitude energies.

- `BlackbodyRadiationModel` (`packages/physics/src/blackbodyRadiationModel.ts`)
  - Validate Wien’s law scaling: $\lambda_{\text{peak}} \propto 1/T$ across a dense temperature grid.
  - Validate Planck integral consistency (numerical): $\int B_\lambda\,d\lambda \propto T^4$ (within bounded error, using a stable integration range).
  - Keep `temperatureToRgbApprox()` explicitly labeled as *approximate*; optionally add a better “teaching color” mapping later (still honest about limitations).

- `ParallaxDistanceModel` (`packages/physics/src/parallaxDistanceModel.ts`)
  - Property tests: $d(p(\text{mas}))$ and inverses are consistent; Infinity behavior for $p \le 0$ is stable.

- `TelescopeResolutionModel` (`packages/physics/src/telescopeResolutionModel.ts`)
  - Cross-check J1 approximation:
    - Compare `besselJ1Approx()` vs a second approximation over $x\in[0, x_{\max}]$ used by the demo.
  - Validate Airy normalization: $I(0)=1$, $I(x)\ge 0$, and intensity decreases near the first minimum.
  - Validate monotonicity: diffraction limit decreases with aperture and increases with wavelength.

- `EclipseGeometryModel` (`packages/physics/src/eclipseGeometryModel.ts`)
  - Invariants: threshold angles should vary smoothly with Earth–Moon distance; Saros/Exeligmos detection behaves as intended.
  - Add a “toy” cross-check case where distances are scaled and verify qualitative outcomes (e.g. umbra radius sign flip implies annular vs total).
  - Optional extension (still honest): allow Earth–Sun distance to vary (tie to `AstroConstants.LENGTH.KM_PER_AU` or a simple orbit) and quantify effect.

- `SeasonsModel` (`packages/physics/src/seasonsModel.ts`)
  - Confirm bounds: $|\delta| \le |\varepsilon|$; day length is in $[0,24]$; noon altitude is in $[-90, 90]$ (as implemented).
  - Make approximation status explicit and keep tests that enforce “tilt drives seasons” pedagogy.
  - Optional SoTA extension: add a Kepler-solved Earth–Sun distance model (behind a “math mode” or advanced toggle) while preserving the current teaching-default toy model.

- `TwoBodyAnalytic` (`packages/physics/src/twoBodyAnalytic.ts`)
  - Cross-check anomaly conversions (dense grid): `trueToMeanAnomalyRad(meanToTrueAnomalyRad(M))` $\\approx$ $M$ (mod $2\\pi$) for multiple $e$.
  - Add invariants for the derived element extraction `orbitElementsFromStateAuYr()` (e.g. circular state returns $e\approx 0$).

- `KeplersLawsModel` (`packages/physics/src/keplersLawsModel.ts`)
  - Regression checks: known benchmarks for period scaling and circular speed at 1 AU, 1 $M_\odot$ remain stable.
  - Add invariant checks: speed from components matches vis-viva within tolerance.

- `ConservationLawsModel` (`packages/physics/src/conservationLawsModel.ts`)
  - Clarify (tests + docs) that this is a geometry/sampling helper, not a time integrator.
  - Add property tests: sampled points satisfy the conic equation within numerical tolerance.

- `RetrogradeMotionModel` (`packages/physics/src/retrogradeMotionModel.ts`)
  - Add far-past/far-future stability tests (no NaNs; stable retrograde detection with very large |t| windows).
  - Add cross-check for event detection: stationary refinement reaches the spec tolerance ($<10^{-3}$ day) across multiple planet pairs.
  - Move planet element data into a dedicated dataset file with provenance notes (J2000-ish, teaching model, no calendar-date claims).
