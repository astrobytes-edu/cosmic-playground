# @cosmic/physics

Physics utilities and teaching models for Cosmic Playground.

This package is the **single source of truth** for the physics/model layer used by the demos. Demos should call these models rather than duplicating equations in UI code.

Related contracts/specs:

- Physics/model contract: `docs/specs/cosmic-playground-model-contract.md`
- Site/demo runtime contract (exports + instrumentation): `docs/specs/cosmic-playground-site-spec.md`

## Symbol conventions (important)

We sometimes use single-letter symbols in **model notes**, **UI copy**, and **exported results**. To avoid ambiguity, we use these conventions consistently:

- **D**: physical **diameter** (km unless otherwise stated)
- **d**: **distance** from observer to object (km unless otherwise stated)
- **$\theta$**: angular diameter (degrees in UI, radians only when explicitly labeled)
- **R**: radius (km)
- **r**: orbital distance (km or AU, depending on the model)
- **a**: semi-major axis (AU in our Kepler “teaching units” models)
- **P**: period (years in our Kepler “teaching units” models)

If a quantity is not one of the above, prefer a descriptive name (e.g. `distanceToSunKm`) rather than reusing **D**/**d**.

## Units + angle conventions

- **Units belong in the API.** If a value is in km, AU, years, arcsec, etc., the identifier should say so (e.g. `distanceKm`, `aAu`, `periodYr`, `seeingArcsec`).
- **Degrees vs radians are not interchangeable.** If a function expects radians, it should say `*Rad`; if degrees, `*Deg`.
- **No natural units.** Do not introduce `G=1`. Orbital mechanics teaching normalization uses:

$$G = 4\pi^2\ \frac{\mathrm{AU}^3}{\mathrm{yr}^2\ M_\odot}.$$

Let’s unpack each piece:
- **$G$** is the gravitational constant in the chosen teaching units
- **$\mathrm{AU}$** is the astronomical unit
- **$\mathrm{yr}$** is the Julian year (see `AstroConstants.TIME.YEAR_S`)
- **$M_\odot$** is one solar mass

What this equation is really saying: by choosing units this way, Kepler’s third law becomes especially transparent in the classroom.

## Model coverage map (where to look)

- Constants: `packages/physics/src/astroConstants.ts`
- Unit conversions: `packages/physics/src/units.ts`
- Shared Kepler solver: `packages/physics/src/keplerSolver.ts`
- Two-body analytic relations: `packages/physics/src/twoBodyAnalytic.ts`
- Teaching models:
  - Angular size: `packages/physics/src/angularSizeModel.ts`
  - Photon relations: `packages/physics/src/photonModel.ts`
  - Blackbody radiation: `packages/physics/src/blackbodyRadiationModel.ts`
  - Parallax: `packages/physics/src/parallaxDistanceModel.ts`
  - Telescope resolution: `packages/physics/src/telescopeResolutionModel.ts`
  - Eclipse geometry: `packages/physics/src/eclipseGeometryModel.ts`
  - Seasons: `packages/physics/src/seasonsModel.ts`
  - Kepler’s laws (ellipse/orbit state): `packages/physics/src/keplersLawsModel.ts`
  - Conservation laws (conics + sampling): `packages/physics/src/conservationLawsModel.ts`
  - Retrograde motion (apparent longitude): `packages/physics/src/retrogradeMotionModel.ts`

## Tests and verification

Primary commands:

```bash
corepack pnpm -C packages/physics test
corepack pnpm -C packages/physics typecheck
```

Repo gates that include physics:

```bash
corepack pnpm -r typecheck
corepack pnpm build
```

## Models (equations + interpretation)

The sections below describe what each model computes, what it assumes, and the governing relationships used.

### AngularSizeModel (`angularSizeModel.ts`)

Angular diameter depends on an object’s physical diameter and its distance from the observer:

$$\theta = 2\arctan\left(\frac{D}{2d}\right)$$

Let’s unpack each piece:
- **$\theta$** is the angular diameter (degrees in UI; computed via radians internally)
- **$D$** is the object’s physical diameter (km unless otherwise stated)
- **$d$** is the distance from the observer to the object (km unless otherwise stated)

Small-angle regime (when $D \ll d$):

$$\theta \approx \frac{D}{d}\quad (\text{radians})$$

What this equation is really saying: apparent size is a geometry ratio; doubling distance halves angular diameter (in the small-angle regime).

Also includes:
- Inverse solve for distance given $D$ and $\theta$
- A simple linear “Moon recession” helper for pedagogy (not a tidal evolution model)

### PhotonModel (`photonModel.ts`)

Photon relations in CGS/SI-mixed practical units (implemented via `AstroConstants` + `AstroUnits`):

Frequency/wavelength:

$$c = \lambda \nu$$

Let’s unpack each piece:
- **$c$** is the speed of light
- **$\lambda$** is wavelength
- **$\nu$** is frequency

Photon energy:

$$E = h\nu = \frac{hc}{\lambda}$$

Let’s unpack each piece:
- **$E$** is photon energy
- **$h$** is Planck’s constant
- **$\nu$** is frequency
- **$\lambda$** is wavelength

What this equation is really saying: higher-frequency (shorter-wavelength) light carries more energy per photon.

### BlackbodyRadiationModel (`blackbodyRadiationModel.ts`)

This model is intended for teaching spectra and scaling, not for precision stellar atmospheres.

Planck spectral radiance (per wavelength, CGS):

$$B_\lambda(T) = \frac{2hc^2}{\lambda^5}\,\frac{1}{\exp\!\left(\frac{hc}{\lambda k T}\right)-1}$$

Let’s unpack each piece:
- **$B_\lambda(T)$** is spectral radiance per wavelength
- **$T$** is temperature (K)
- **$h$** is Planck’s constant
- **$c$** is the speed of light
- **$k$** is Boltzmann’s constant
- **$\lambda$** is wavelength

Wien displacement law (peak wavelength):

$$\lambda_{\text{peak}}T \approx b$$

Let’s unpack each piece:
- **$\lambda_{\text{peak}}$** is the wavelength of peak emission
- **$T$** is temperature
- **$b$** is Wien’s displacement constant

Stefan–Boltzmann flux:

$$F = \sigma T^4$$

What this equation is really saying: increasing temperature strongly shifts and boosts emission.

Notes:
- The `temperatureToRgbApprox()` helper is explicitly **perceptual/approximate**, not colorimetry.

### ParallaxDistanceModel (`parallaxDistanceModel.ts`)

Annual parallax definition (parsec):

$$d(\text{pc}) = \frac{1}{p(\text{arcsec})}$$

Let’s unpack each piece:
- **$d$** is distance in parsecs
- **$p$** is parallax angle in arcseconds

What this equation is really saying: doubling distance halves parallax angle; very small parallax means very large distance.

### TelescopeResolutionModel (`telescopeResolutionModel.ts`)

Diffraction-limited resolution (Rayleigh criterion; small-angle):

$$\theta_{\text{diff}} \approx 1.22\,\frac{\lambda}{D}$$

Let’s unpack each piece:
- **$\theta_{\text{diff}}$** is angular resolution (radians; reported as arcseconds in UI)
- **$\lambda$** is wavelength
- **$D$** is aperture diameter
- The coefficient $1.22$ comes from the first zero of the Airy pattern

Airy pattern intensity (normalized):

$$I(x) = \left(\frac{2J_1(x)}{x}\right)^2,\quad x=\frac{\pi D\theta}{\lambda}$$

Notes:
- `besselJ1Approx()` is an approximation suitable for visualization.
- “Effective resolution” combines diffraction and seeing with a simple AO-inspired parameterization; it is not a full turbulence/PSF model.

### EclipseGeometryModel (`eclipseGeometryModel.ts`)

This model is a **2D/plane-of-sky geometric threshold** model used for classifying eclipse “possible vs not” and basic types.

Key relationships:

Phase angle (ecliptic longitudes):

$$\Delta = \operatorname{wrap}_{0..360}(\lambda_{\text{Moon}} - \lambda_{\text{Sun}})$$

Ecliptic latitude from inclination and node geometry:

$$\beta = \sin^{-1}\!\big(\sin i\,\sin(\lambda - \Omega)\big)$$

Shadow cone radii at distance $d$ (linear cone approximation):

$$R_{\text{umbra}}(d) = R_{\text{body}} - d\,\frac{R_{\text{Sun}} - R_{\text{body}}}{D_{\text{Sun}}}$$
$$R_{\text{penumbra}}(d) = R_{\text{body}} + d\,\frac{R_{\text{Sun}} + R_{\text{body}}}{D_{\text{Sun}}}$$

Let’s unpack each piece (for the umbra equation):
- **$R_{\text{umbra}}(d)$** is the umbral radius at distance $d$ from the occulting body
- **$R_{\text{body}}$** is the occulting body’s radius (Earth for lunar eclipses, Moon for solar)
- **$R_{\text{Sun}}$** is the Sun’s radius
- **$D_{\text{Sun}}$** is the distance from the occulting body to the Sun (approximately 1 AU in this model)

What this equation is really saying: the shadow cone narrows (umbra) or widens (penumbra) linearly with distance in this approximation.

### SeasonsModel (`seasonsModel.ts`)

This is a **toy/teaching model** focused on geometry; it is not an ephemeris.

Solar declination:

$$\delta = \arcsin\!\big(\sin\varepsilon\,\sin L\big)$$

Let’s unpack each piece:
- **$\delta$** is solar declination (degrees)
- **$\varepsilon$** is axial tilt/obliquity (degrees; folded to $0^\circ..90^\circ$)
- **$L$** is the Sun’s ecliptic longitude measured from the March equinox (modeled as uniform in time)

Day length:

$$\cos H_0 = -\tan\phi\,\tan\delta,\quad T_{\text{day}} = \frac{2H_0}{15^\circ/\text{hour}}$$

Noon altitude:

$$h_\odot = 90^\circ - |\phi - \delta|$$

Earth–Sun distance (explicitly approximate):

$$r \approx 1 - e\cos\!\left(2\pi\,\frac{t-t_{\text{peri}}}{T}\right)$$

### Kepler Solver (`keplerSolver.ts`)

Many orbit-related demos/models need to solve Kepler’s equation for the **eccentric anomaly** $E$:

$$M = E - e\sin E$$

Let’s unpack each piece:
- **$M$** is mean anomaly (radians)
- **$E$** is eccentric anomaly (radians)
- **$e$** is eccentricity (unitless; elliptic orbits use $0\le e<1$)

Implementation notes (important for reproducibility and DRY):
- The shared entry point is `solveEccentricAnomalyRadDeterministic()` and is used by both `TwoBodyAnalytic` and `RetrogradeMotionModel`.
- Algorithm: Newton iteration (with fixed tolerance + max iterations) with a deterministic bisection fallback, so it always returns the same answer for the same inputs (no “depends on iteration luck” behavior).
- The solver preserves $2\pi$ “turns” in $M$ so callers can build continuous time series without discontinuities at wrap boundaries.

### TwoBodyAnalytic (`twoBodyAnalytic.ts`)

Reusable analytic relations for two-body dynamics in a plane.

Ellipse radius in polar form:

$$r(\theta) = \frac{a(1-e^2)}{1 + e\cos\theta}$$

Vis-viva:

$$v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right)$$

Specific energy:

$$\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}$$

Specific angular momentum (2D magnitude):

$$h = |\mathbf{r}\times\mathbf{v}|$$

Mean-to-true anomaly conversion uses the shared deterministic Kepler solver in `keplerSolver.ts`.

### KeplersLawsModel (`keplersLawsModel.ts`)

This is a teaching wrapper that turns $(a,e,M)$ into:
- position $(x,y)$ in AU,
- velocities $(v_x,v_y)$ in AU/yr,
- speed via vis-viva.

Assumptions:
- planar two-body orbit
- central mass expressed in $M_\odot$ using the teaching normalization ($G=4\pi^2$)

Key relationships (elliptic case, $0\le e < 1$):

Orbital period (Kepler’s third law in our teaching units):

$$P^2 = \frac{a^3}{M_\star},\quad P=\sqrt{\frac{a^3}{M_\star}}$$

Mean motion:

$$n=\frac{2\pi}{P}$$

Radius from $E$:

$$r=a(1-e\cos E)$$

Perifocal velocity components (used to compute $(v_x,v_y)$):

$$v_r=\frac{\mu}{h}\,e\sin\nu,\quad v_\theta=\frac{\mu}{h}\,(1+e\cos\nu)$$

### ConservationLawsModel (`conservationLawsModel.ts`)

Geometry helpers for conic sections and orbit sampling (used in the Conservation Laws demo).

Conic in polar form:

$$r(\nu)=\frac{p}{1+e\cos\nu}$$

Notes:
- Includes safe plotting domains for hyperbolas/parabolas so the renderer doesn’t sample arbitrarily near asymptotes.
- Provides a simple “advance $\nu$” helper for UI animation (not a physical time integrator).

### RetrogradeMotionModel (`retrogradeMotionModel.ts`)

This model implements the **retrograde-motion design spec**: coplanar Keplerian ellipses + apparent direction from observer to target + explicit unwrap + event detection.

Orbital element set per planet:
- semi-major axis $a$ (AU)
- eccentricity $e$ (unitless)
- longitude of perihelion $\varpi$ (deg)
- mean longitude at epoch $L_0$ (deg at $t=t_0$)

Mean longitude:

$$L(t) = L_0 + \frac{180}{\pi}\,n(t-t_0)\quad (\text{deg})$$

Mean anomaly:

$$M(t)=\operatorname{wrap}_{0..2\pi}\left(\frac{\pi}{180}(L(t)-\varpi)\right)\quad (\text{rad})$$

Kepler equation:

$$M = E - e\sin E$$

True anomaly:

$$\nu = 2\arctan2\left(\sqrt{1+e}\,\sin\frac{E}{2},\ \sqrt{1-e}\,\cos\frac{E}{2}\right)$$

Radius:

$$r = a(1-e\cos E)$$

Position:

$$x=r\cos(\nu+\varpi),\quad y=r\sin(\nu+\varpi)$$

Apparent (sky) longitude (from observer to target):

$$\lambda_{\mathrm{app}}(t)=\operatorname{wrap}_{0..360}\left(\arctan2(y_t-y_o,\ x_t-x_o)\right)$$

Unwrap algorithm (sampled series, explicit 180-deg jump rule):
- $\tilde{\lambda}_0=\lambda_0$
- $\Delta=\lambda_i-\lambda_{i-1}$; if $\Delta>180$ then $\Delta\leftarrow\Delta-360$; if $\Delta<-180$ then $\Delta\leftarrow\Delta+360$
- $\tilde{\lambda}_i=\tilde{\lambda}_{i-1}+\Delta$

Retrograde definition:

$$\frac{d\tilde{\lambda}}{dt}<0$$

Implementation notes:
- Uses an internal sampling step $\Delta t_{\text{internal}}=0.25$ day for event detection.
- Derivative uses central difference; stationary points are refined by bisection to a time tolerance of $10^{-3}$ day.

## Higher-than-unit-test confidence (future work)

Unit tests are necessary but not sufficient for “SoTA” confidence. A next step is to add numeric cross-checks for models against an independent implementation (or higher-precision reference) over dense parameter grids. Track that work in `docs/backlog.md`.
