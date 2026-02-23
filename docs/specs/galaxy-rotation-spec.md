# Galaxy Rotation Curves — Demo Spec

**Status:** Draft v2 (hardened, LaTeX notation)
**Date:** 2026-02-23
**Owner:** Cosmic Playground
**Slug:** `galaxy-rotation`
**Category:** Galaxies & Cosmology

---

## 1) Purpose & Positioning

`galaxy-rotation` is the Cosmic Playground instrument for **galactic rotation curves**: how the orbital speed of gas and stars varies with distance from the center of a galaxy, what Newtonian gravity predicts, and why the observations demand something more — **dark matter**.

It answers one of the most consequential questions in modern astrophysics: *We can measure how fast galaxies spin using the Doppler effect. The speeds don't match what we predict from the visible matter. What's missing?*

### Primary pedagogical goals

- Show how the **Doppler shift of 21-cm hydrogen emission** (or optical emission lines) at different positions across a galaxy measures rotational velocity at each radius
- Build the **rotation curve** — the $V(R)$ plot — as the central observable
- Compare the observed (flat) rotation curve to the **Keplerian prediction** from visible matter alone, which falls as $R^{-1/2}$ at large radii
- Demonstrate that the discrepancy implies **unseen mass** — either dark matter or modified gravity
- Let students interactively adjust the **dark matter halo** mass to fit the observed curve, building intuition for how much dark matter is needed and where it sits
- Connect to the Doppler effect: every point on the rotation curve is a velocity measured from a spectral line shift
- (Optional) Compare the dark-matter fit to a **MOND prediction** from visible matter alone

### Audience

- **ASTR 101**: Qualitative — see the flat rotation curve, understand the mismatch, grasp the dark matter argument
- **ASTR 201**: Quantitative — decompose the curve into bulge + disk + halo components, mass modeling via $M(<R) = V^2 R / G$, compare NFW vs. MOND

### Relationship to other demos

| Demo | Relationship |
|------|-------------|
| `doppler-shift` | This demo is a direct application: each velocity point comes from a Doppler measurement |
| `spectral-lines` | The 21-cm line (hyperfine transition of neutral hydrogen) and optical emission lines (e.g., H$\alpha$ at 656.3 nm) are the observational tools |
| `keplers-laws` | Keplerian falloff ($V \propto R^{-1/2}$) is the expected behavior for a point-mass or compact mass distribution |
| `binary-orbits` | Orbital mechanics applied to single objects on circular orbits within a galaxy potential |
| `conservation-laws` | Virial theorem, gravitational binding — connect to cluster-scale dark matter evidence |

### Out of scope for this demo

- Dark matter particle physics — we discuss the gravitational evidence, not the particle candidates
- Galaxy formation and evolution — this demo is about the present-day kinematic evidence
- Full 3D galaxy models — we use a 1D radial profile for clarity
- Galaxy cluster dynamics — discussed qualitatively in the "Dark Matter Across Scales" panel (§15) but not interactively modeled

---

## 2) Layout & Visual Architecture

### Shell variant: `viz-first` (sidebar controls, central stage)

```
+---------------------------------------------------------------+
| Controls (sidebar)         |  Stage                            |
|                            |                                   |
| [Galaxy model selector]    |  Galaxy View (SVG/Canvas)         |
| [Dark halo mass slider]    |  ┌─────────────────────────────┐  |
| [Dark halo scale slider]   |  │      ····               ····│  |
| [Disk mass slider]         |  │   ···    ·····────·····    ··│  |
| [Bulge mass slider]        |  │  ··         ● center       ··│  |
| [Show: V_obs / V_disk /    |  │   ···    ·····────·····    ··│  |
|   V_bulge / V_halo /       |  │      ····               ····│  |
|   V_MOND]                  |  │  ← blue    slit    red →    │  |
| [Slit position slider]     |  └─────────────────────────────┘  |
|                            |                                   |
| [Plot mode: V(R) / M(<R)]  |  Rotation Curve Plot (Canvas)     |
|                            |  ┌─────────────────────────────┐  |
| Readouts panel             |  │  V    ___________________   │  |
|   V(R) = ... km/s          |  │  ↑  ╱   observed (flat)     │  |
|   R = ... kpc              |  │  │╱  - - - - Keplerian      │  |
|   M(<R) = ... M☉           |  │  │    ··· disk  ─── halo    │  |
|   Δλ_21cm = ... mm         |  │  │    ─·─ MOND              │  |
|   f_b = ...                |  │  +──────────────── R →       │  |
|                            |  └─────────────────────────────┘  |
+---------------------------------------------------------------+
| Drawer: Understand / Model notes / Dark Matter Across Scales   |
+---------------------------------------------------------------+
```

### Primary visualizations

#### A. Galaxy View (upper stage) — face-on schematic with slit overlay

A stylized **face-on spiral galaxy** rendered as a luminous disk with spiral arms (or a simple exponential disk with radial brightness falloff).

> **Important note on viewing geometry.** The face-on view is a *schematic diagram* showing the galaxy from above — a "bird's-eye" view illustrating where along the disk each velocity measurement is made. In reality, rotation curves are measured from galaxies that are **tilted** relative to our line of sight (inclination $i \neq 0°$), because a perfectly face-on galaxy ($i = 0°$) produces no radial velocity component and hence no Doppler shift. The demo displays the **intrinsic** (inclination-corrected) rotation velocity $V(R)$, as is standard in published rotation curves.

Key elements:
- **Galactic center**: bright bulge with glow (`--cp-celestial-sun-core` or a warm golden token)
- **Disk**: exponential brightness profile fading outward, with subtle spiral arm structure
- **Spectroscopic slit**: a horizontal line across the galaxy center (representing where a long-slit spectrograph samples)
  - Left side of slit: **blue-tinted** (approaching, blueshifted gas)
  - Right side of slit: **red-tinted** (receding, redshifted gas)
  - This directly shows HOW rotation curves are measured
- **Slit position marker**: a vertical tick showing the current radius being highlighted, synced with the rotation curve below
- **Dark matter halo**: a faint, extended circular region around the galaxy (much larger than the visible disk), with opacity proportional to the halo mass slider. This visualizes the invisible: the halo extends far beyond where stars are visible.

#### B. Rotation Curve Plot (lower stage) — $V(R)$ vs. $R$ (default) or $M(<R)$ vs. $R$

The central scientific graphic. A standard Cartesian plot with a **toggle** between two modes:

##### Mode 1 (default): Velocity — $V(R)$ vs. $R$

**Axes**:
- Horizontal: galactocentric radius $R$ (kpc), range 0–50 kpc
- Vertical: circular velocity $V$ (km/s), range 0–350 km/s

**Curves** (each can be toggled on/off via checkboxes):
- **Observed (total)**: solid thick line, color `--cp-accent-amber`. This is the physically correct total: $V_{\rm total} = \sqrt{V_{\rm bulge}^2 + V_{\rm disk}^2 + V_{\rm halo}^2}$
- **Keplerian prediction**: dashed line, color `--cp-accent-ice`. What you'd expect if all the mass were visible: $V_{\rm Kep} = \sqrt{G\,M_{\rm vis}(<R)/R}$. Falls as $R^{-1/2}$ outside the visible disk.
- **Bulge contribution**: thin dotted line, color `--cp-chart-1`. Rises steeply then falls.
- **Disk contribution**: thin dot-dash line, color `--cp-chart-2`. Rises, peaks around $2$–$3\,R_d$, then falls.
- **Halo contribution**: thin long-dash line, color `--cp-chart-3`. Rises roughly linearly then flattens — dominates at large $R$.
- **MOND prediction** (optional toggle): thin solid line, color `--cp-accent-rose`. Deep-MOND formula from visible mass only (see §5).

**Interactive element**: a **draggable marker** on the observed curve that the student can pull along the radius axis. As it moves, the readouts update and the slit position marker on the galaxy view moves in sync.

**Fill region**: when both total and Keplerian curves are shown, a subtle fill between them (light `--cp-accent-rose` at 15% opacity) to highlight the "missing mass" discrepancy. Label: "Dark matter contribution"

**The "aha" moment**: with the halo slider at zero, the observed curve drops off (Keplerian). As students increase the dark halo mass, the curve flattens out to match real observations. They are literally adding dark matter to make the physics work.

##### Mode 2: Enclosed Mass — $M(<R)$ vs. $R$

**Axes**:
- Horizontal: galactocentric radius $R$ (kpc), range 0–50 kpc
- Vertical: enclosed mass $M(<R)$ ($10^{10}\,M_\odot$), range auto-scaled

**Curves**:
- **Total enclosed mass**: solid thick, `--cp-accent-amber`
- **Visible mass** (bulge + disk): dashed, `--cp-accent-ice`
- **Dark mass** (halo only): thin long-dash, `--cp-chart-3`
- **Crossing point** where $M_{\rm dark} > M_{\rm vis}$: vertical dotted line with annotation

This view shows the mass decomposition directly and makes the dark-matter dominance at large $R$ very intuitive.

---

## 3) Controls

### Galaxy model selector
- Dropdown or chips: "Milky Way-like" (default), "Dwarf galaxy", "Massive spiral", "No dark matter", "Custom"
- Each preset sets appropriate bulge mass, disk mass, and halo parameters
- "Custom" enables all sliders for free exploration

### Dark matter halo mass slider
- Range: 0 to 200 (units: $10^{10}\,M_\odot$, so 0 to $2 \times 10^{12}\,M_\odot$)
- Default: 130 ($1.3 \times 10^{12}\,M_\odot$, Milky Way virial mass per McMillan 2017)
- Label: "Dark halo mass ($\times 10^{10}\,M_\odot$)"
- **This is the star control**: sliding it from 0 to the correct value visually demonstrates the dark matter argument

### Dark matter halo scale radius slider
- Range: 5 to 50 kpc
- Default: 21.5 kpc (MW NFW scale radius)
- Label: "Halo scale radius (kpc)"

### Disk mass slider
- Range: 0.1 to 20 (units: $10^{10}\,M_\odot$)
- Default: 5.0 ($5 \times 10^{10}\,M_\odot$, approximately Milky Way thin + thick disk)
- Label: "Disk mass ($\times 10^{10}\,M_\odot$)"

### Disk scale length slider
- Range: 1 to 10 kpc
- Default: 2.6 kpc (MW thin disk scale length, McMillan 2017)

### Bulge mass slider
- Range: 0 to 5 (units: $10^{10}\,M_\odot$)
- Default: 0.9 ($9 \times 10^{9}\,M_\odot$, McMillan 2017)
- Label: "Bulge mass ($\times 10^{10}\,M_\odot$)"

### Bulge scale radius
- Fixed internally at $a_b = 0.3$ kpc for the MW preset (Hernquist scale radius)
- Exposed as a slider only in "Custom" mode: range 0.1–2.0 kpc

### Component visibility checkboxes
- [x] Observed (total) — always shown
- [ ] Keplerian — toggled
- [ ] Disk contribution
- [ ] Bulge contribution
- [ ] Halo contribution
- [ ] MOND prediction
- Default: Observed + Keplerian checked (the two essential curves for the dark matter argument)

### Plot mode toggle
- "Velocity $V(R)$" (default) / "Enclosed mass $M(<R)$"

### Radius marker
- Slider or click-on-plot: $R$ from 0.5 to 50 kpc
- Default: 10 kpc

---

## 4) Readouts

| Label | ID | Value | Unit |
|-------|-----|-------|------|
| Radius | `radiusValue` | Current marker position | kpc |
| Total velocity $V(R)$ | `vTotalValue` | Total circular velocity at $R$ | km/s |
| Keplerian velocity | `vKeplerianValue` | $V$ if only visible mass counted | km/s |
| Enclosed mass $M(<R)$ | `mEnclosedValue` | Total mass inside $R$ | $10^{10}\,M_\odot$ |
| Visible mass $M_{\rm vis}(<R)$ | `mVisibleValue` | Bulge + disk mass inside $R$ | $10^{10}\,M_\odot$ |
| Dark mass $M_{\rm dark}(<R)$ | `mDarkValue` | Halo mass inside $R$ | $10^{10}\,M_\odot$ |
| Dark-to-visible ratio | `darkVisRatioValue` | $M_{\rm dark} / M_{\rm vis}$ at this $R$ | (dimensionless) |
| Baryon fraction $f_b$ | `baryonFracValue` | $M_{\rm vis} / M_{\rm total}$ at this $R$ | (dimensionless) |
| 21-cm Doppler shift | `deltaLambda21Value` | $\Delta\lambda_{21} = \lambda_0 V(R) / c$ | mm |
| Concentration $c$ | `concValue` | $R_{\rm vir} / r_s$ (derived) | (dimensionless) |
| Virial radius $R_{\rm vir}$ | `rVirValue` | From $M_{\rm halo}$ and cosmology | kpc |

The dark-to-visible ratio readout is the punchline: at $R \sim 50$ kpc it can be 7:1 or more, directly showing that most of the mass is dark.

The baryon fraction $f_b$ can be compared to the cosmological value $f_{b,\rm cosmic} = \Omega_b / \Omega_m \approx 0.157$ (Planck 2018). When $f_b \ll 0.157$, even baryons are "missing" — a hook into the circumgalactic medium and the baryon budget.

The 21-cm Doppler shift $\Delta\lambda_{21}$ ties the rotation curve directly back to the `doppler-shift` demo: at $V = 200$ km/s, $\Delta\lambda_{21} \approx 0.14$ mm.

---

## 5) Physics Model — `GalaxyRotationModel`

### Mass components

#### Bulge (Hernquist profile)

$$\rho_{\rm bulge}(r) = \frac{M_b}{2\pi} \frac{a_b}{r\,(r + a_b)^3}$$

$$M_{\rm bulge}(<r) = M_b \frac{r^2}{(r + a_b)^2}$$

$$V_{\rm bulge}(r) = \sqrt{\frac{G\,M_{\rm bulge}(<r)}{r}}$$

where $M_b$ = bulge mass, $a_b$ = Hernquist scale radius (default 0.3 kpc for MW).

#### Disk (exponential disk — enclosed-mass approximation)

The surface density of an exponential disk is:

$$\Sigma(R) = \frac{M_d}{2\pi R_d^2}\,e^{-R/R_d}$$

The **exact** rotation curve requires modified Bessel functions:

$$V_{\rm disk}^2(R) = 4\pi G\,\Sigma_0\,R_d\,y^2\left[I_0(y)\,K_0(y) - I_1(y)\,K_1(y)\right]$$

where $y = R / (2R_d)$ and $I_n$, $K_n$ are modified Bessel functions of the first and second kind.

For computational simplicity, we use the commonly employed **enclosed-mass approximation**:

$$M_{\rm disk}(<R) = M_d\left[1 - \left(1 + \frac{R}{R_d}\right)e^{-R/R_d}\right]$$

$$V_{\rm disk}(R) = \sqrt{\frac{G\,M_{\rm disk}(<R)}{R}}$$

> **Approximation note.** The enclosed-mass approximation treats the disk as if it were spherically distributed. This **overestimates** $V_{\rm disk}$ by up to ~15% near the peak (around $R \approx 2.2\,R_d$) because a flat disk produces less centripetal acceleration than a sphere of the same enclosed mass. The approximation improves at large $R$ where the enclosed mass converges. For a pedagogical demo this is acceptable and standard practice; implementing the exact Bessel-function solution is a future enhancement (see §14).

#### Halo (NFW profile — Navarro-Frenk-White)

$$\rho_{\rm halo}(r) = \frac{\rho_s}{(r/r_s)(1 + r/r_s)^2}$$

$$M_{\rm halo}(<r) = 4\pi\rho_s r_s^3 \left[\ln\!\left(1 + \frac{r}{r_s}\right) - \frac{r/r_s}{1 + r/r_s}\right]$$

$$V_{\rm halo}(r) = \sqrt{\frac{G\,M_{\rm halo}(<r)}{r}}$$

where the characteristic density is:

$$\rho_s = \frac{M_{\rm vir}}{4\pi r_s^3\left[\ln(1+c) - \frac{c}{1+c}\right]}$$

with $c = R_{\rm vir} / r_s$ being the concentration parameter.

> **Cosmological dependence.** The virial radius $R_{\rm vir}$ is defined by $M_{\rm vir} = \frac{4}{3}\pi R_{\rm vir}^3 \cdot 200\,\rho_{\rm crit}$, where $\rho_{\rm crit} = 3H_0^2 / (8\pi G)$. The demo uses a fixed Planck 2018 cosmology internally: $H_0 = 67.4$ km/s/Mpc, $\Omega_m = 0.315$. This gives $\rho_{\rm crit} \approx 1.26 \times 10^{-8}\;(10^{10}\,M_\odot)/\text{kpc}^3$. The concentration $c$ and virial radius $R_{\rm vir}$ are displayed as derived readouts; students set $M_{\rm halo}$ and $r_s$ directly.

For the slider interface, we parameterize as:
- $M_{\rm halo}$ = total halo virial mass (slider)
- $r_s$ = NFW scale radius (slider)
- $c$ = $R_{\rm vir} / r_s$ (derived, displayed as readout)
- $R_{\rm vir}$ (derived from $M_{\rm halo}$ and cosmology, displayed as readout)

#### Total

$$V_{\rm total}(R) = \sqrt{V_{\rm bulge}^2 + V_{\rm disk}^2 + V_{\rm halo}^2}$$

This is the key formula: the velocities add in quadrature because gravitational potentials are additive.

### Keplerian reference

$$V_{\rm Kep}(R) = \sqrt{\frac{G\,M_{\rm vis}(<R)}{R}}$$

where $M_{\rm vis} = M_{\rm bulge}(<R) + M_{\rm disk}(<R)$. This is what you'd predict without dark matter.

### MOND prediction (optional toggle)

MOND (Modified Newtonian Dynamics; Milgrom 1983) modifies gravity at low accelerations rather than invoking dark matter. In the **deep-MOND regime** ($a \ll a_0$):

$$V_{\rm MOND}(R) = \left(G\,M_{\rm vis}(<R)\,a_0\right)^{1/4}$$

where $a_0 \approx 1.2 \times 10^{-10}$ m/s² is the MOND acceleration constant ($\approx 3{,}700$ (km/s)²/kpc in galaxy units).

The full MOND interpolation function is:

$$a = \frac{a_N}{2} + \frac{a_N}{2}\sqrt{1 + \frac{4a_0}{a_N}}$$

where $a_N = G\,M_{\rm vis}(<R)/R^2$ is the Newtonian acceleration from visible matter.

> **Pedagogical note on MOND.** MOND is included as a curve toggle — not as a full alternative model with its own sliders. The goal is for students to see that MOND can fit galaxy rotation curves from visible matter alone (it typically reproduces flat curves remarkably well), while acknowledging that MOND faces challenges at galaxy cluster scales (where it underpredicts the mass by factors of 2–3). This motivates the discussion in the "Dark Matter Across Scales" panel (§15). Science is about testing alternatives.

### Enclosed mass from velocity

$$M(<R) = \frac{V(R)^2\,R}{G}$$

This is the direct inversion: measure $V(R)$, get $M(<R)$. When $M(<R) \gg M_{\rm vis}(<R)$, the difference is dark matter.

### 21-cm Doppler connection

$$\Delta\lambda_{21}(R) = \lambda_0\,\frac{V(R)}{c}$$

where $\lambda_0 = 21.106$ cm and $c = 299{,}792.458$ km/s. This readout directly ties each rotation curve point to a measurable Doppler shift, connecting back to the `doppler-shift` demo.

### Baryon fraction

$$f_b(R) = \frac{M_{\rm vis}(<R)}{M_{\rm total}(<R)}$$

Compare to the cosmological baryon fraction $f_{b,\rm cosmic} = \Omega_b / \Omega_m \approx 0.157$ (Planck 2018).

### Constants and units

All quantities in "galaxy units":
- Distances: kpc
- Velocities: km/s
- Masses: $10^{10}\,M_\odot$

The gravitational constant in these units:

$$G = 4.3009 \times 10^{-3}\;\text{pc}\;(\text{km/s})^2\;M_\odot^{-1}$$

Converting to kpc (1 pc = $10^{-3}$ kpc):

$$G = 4.3009 \times 10^{-3} \times 10^{-3}\;\text{kpc}\;(\text{km/s})^2\;M_\odot^{-1} = 4.3009 \times 10^{-6}\;\text{kpc}\;(\text{km/s})^2\;M_\odot^{-1}$$

Absorbing the mass unit ($10^{10}\,M_\odot$):

$$\boxed{G_{\rm galaxy} = 4.3009 \times 10^{4}\;\text{kpc}\;(\text{km/s})^2\;(10^{10}\,M_\odot)^{-1}}$$

So: $V^2 = G_{\rm galaxy} \cdot M_{10} / R_{\rm kpc}$, where $M_{10}$ is mass in $10^{10}\,M_\odot$.

### Core functions

```typescript
/** Galaxy-scale gravitational constant. */
const G_GALAXY = 4.3009e4; // kpc (km/s)^2 per (10^10 Msun)

/** Planck 2018 cosmology for NFW virial radius. */
const H0_KPC = 0.0674;    // km/s/kpc (= 67.4 km/s/Mpc)
const RHO_CRIT = 3 * H0_KPC ** 2 / (8 * Math.PI * G_GALAXY);
// ≈ 1.26e-8 (10^10 Msun) / kpc^3

/** MOND acceleration constant. */
const A0_MOND = 3703; // (km/s)^2 / kpc  (= 1.2e-10 m/s^2)

/** Circular velocity from bulge (Hernquist profile). */
vBulgeKmS(args: {
  radiusKpc: number;
  bulgeMass10: number;
  bulgeScaleKpc?: number; // default 0.3
}): number;

/** Circular velocity from exponential disk (enclosed-mass approximation). */
vDiskKmS(args: {
  radiusKpc: number;
  diskMass10: number;
  diskScaleLengthKpc: number;
}): number;

/** Circular velocity from NFW dark matter halo. */
vHaloKmS(args: {
  radiusKpc: number;
  haloMass10: number;
  haloScaleRadiusKpc: number;
}): number;

/** MOND circular velocity from visible mass only. */
vMondKmS(args: {
  radiusKpc: number;
  params: GalaxyParams;
}): number;

/** Total circular velocity (quadrature sum). */
vTotalKmS(args: { radiusKpc: number; params: GalaxyParams }): number;

/** Keplerian velocity from visible mass only. */
vKeplerianKmS(args: { radiusKpc: number; params: GalaxyParams }): number;

/** Enclosed mass at radius R. */
enclosedMass10(args: { radiusKpc: number; params: GalaxyParams }): {
  total: number; bulge: number; disk: number; halo: number;
};

/** NFW derived quantities. */
nfwDerived(args: { haloMass10: number; haloScaleRadiusKpc: number }): {
  rVirKpc: number;
  concentration: number;
};

/** 21-cm Doppler shift at given velocity. */
deltaLambda21mm(velocityKmS: number): number;

/** Baryon fraction at radius R. */
baryonFraction(args: { radiusKpc: number; params: GalaxyParams }): number;

/** Generate a full rotation curve (array of R, V points). */
rotationCurve(args: {
  params: GalaxyParams;
  rMinKpc?: number;
  rMaxKpc?: number;
  nPoints?: number;
}): Array<{
  radiusKpc: number;
  vTotalKmS: number;
  vBulgeKmS: number;
  vDiskKmS: number;
  vHaloKmS: number;
  vKeplerianKmS: number;
  vMondKmS: number;
  mTotal10: number;
  mVisible10: number;
  mDark10: number;
  baryonFraction: number;
  deltaLambda21mm: number;
}>;

interface GalaxyParams {
  bulgeMass10: number;        // bulge mass in 10^10 Msun
  bulgeScaleKpc: number;      // Hernquist scale radius (kpc)
  diskMass10: number;         // disk mass in 10^10 Msun
  diskScaleLengthKpc: number; // exponential scale length (kpc)
  haloMass10: number;         // NFW halo virial mass in 10^10 Msun
  haloScaleRadiusKpc: number; // NFW scale radius (kpc)
}
```

### Galaxy presets

| Preset | $M_b$ | $a_b$ (kpc) | $M_d$ | $R_d$ (kpc) | $M_h$ | $r_s$ (kpc) | Notes |
|--------|--------|-------------|--------|-------------|--------|-------------|-------|
| Milky Way-like | 0.9 | 0.3 | 5.0 | 2.6 | 130 | 21.5 | McMillan (2017); $V(8.2) \approx 216$ km/s |
| Dwarf galaxy | 0.0 | 0.5 | 0.3 | 1.5 | 5 | 8 | Dark-matter dominated at all radii |
| Massive spiral | 2.0 | 0.5 | 10.0 | 5.0 | 200 | 25 | Large Sb/Sc galaxy; $V_{\rm max} \approx 252$ km/s |
| No dark matter | 0.9 | 0.3 | 5.0 | 2.6 | 0 | — | Keplerian falloff — the "missing mass" scenario |

All masses in $10^{10}\,M_\odot$.

> **Why no elliptical galaxy preset?** Elliptical galaxies are **pressure-supported** (stars on random orbits), not rotationally supported. Rotation curves are measured for **disk galaxies** (spirals and irregulars). The relevant kinematic tracer for ellipticals is the velocity *dispersion* $\sigma$, not a rotation curve $V(R)$. Including an elliptical preset would teach incorrect astrophysics. The "Massive spiral" preset shows how a large disk galaxy differs from the Milky Way.

### Test benchmarks

| # | Test case | Input | Expected | Tolerance | Notes |
|---|-----------|-------|----------|-----------|-------|
| 1 | $V_{\rm total}$ at $R = 0$ | any params | 0 km/s | exact | All profiles → 0 at center |
| 2 | MW at solar circle | MW preset, $R = 8.2$ kpc | $V_{\rm total} \approx 216$ km/s | ±10 km/s | McMillan 2017 reference |
| 3 | Keplerian falloff | No-halo preset, $R = 30$ kpc | $V \approx 92$ km/s | ±5 km/s | Falls as $R^{-1/2}$ |
| 4 | Keplerian falloff slope | No-halo, $R = 30$ vs $R = 50$ kpc | $V(50)/V(30) \approx \sqrt{30/50} = 0.775$ | ±0.03 | Verifies $R^{-1/2}$ scaling |
| 5 | Halo dominance | MW, $R = 50$ kpc | $V_{\rm halo} / V_{\rm total} > 0.9$ | — | Halo dominates at large $R$ |
| 6 | Enclosed mass monotonicity | Any params, $R_1 < R_2$ | $M(<R_1) < M(<R_2)$ | exact | Sanity check |
| 7 | Quadrature identity | At any $R$ | $V_{\rm total}^2 = V_b^2 + V_d^2 + V_h^2$ | $< 10^{-6}$ | Definition |
| 8 | Disk mass convergence | $R \to \infty$ | $M_{\rm disk}(<R) \to M_d$ | $< 1\%$ at $R = 10\,R_d$ | Exponential convergence |
| 9 | NFW at $r_s$ | MW preset, $R = r_s = 21.5$ kpc | $M(<r_s) / M_{\rm vir} = f(1)/f(c) \approx 0.125$ | ±0.005 | Analytic check |
| 10 | NFW concentration | MW preset | $c \approx 10.7$, $R_{\rm vir} \approx 231$ kpc | ±0.5, ±5 kpc | From $H_0 = 67.4$ |
| 11 | Dark-to-visible at 50 kpc | MW preset | $M_{\rm dark}/M_{\rm vis} \approx 7.2$ | ±0.5 | Readout check |
| 12 | Baryon fraction at 50 kpc | MW preset | $f_b \approx 0.12$ | ±0.02 | Below cosmic $f_{b} = 0.157$ |
| 13 | MOND at 30 kpc | MW preset visible mass | $V_{\rm MOND} \approx 175$ km/s | ±5 km/s | Deep-MOND from $M_{\rm vis} \approx 5.88$ |
| 14 | 21-cm shift at 200 km/s | $V = 200$ km/s | $\Delta\lambda_{21} \approx 0.141$ mm | ±0.005 mm | $\lambda_0 V / c$ |
| 15 | Explain prompt | $V = 200$, $R = 30$ kpc | $M_{\rm total} \approx 27.9 \times 10^{10}\,M_\odot$ | ±0.5 | $V^2 R / G_{\rm galaxy}$ |
| 16 | Dwarf dark fraction | Dwarf, $R = 10$ kpc | $M_{\rm dark}/M_{\rm vis} \approx 2.9$ | ±0.3 | Dark-dominated even at small $R$ |
| 17 | Massive spiral $V_{\rm max}$ | Massive spiral preset | $V_{\rm max} \approx 252$ km/s near $R \approx 20$ kpc | ±10 km/s | Higher than MW |

---

## 6) Understand Panel (Drawer)

### Equations (KaTeX)

**Card 1: Circular velocity**
```latex
V(R) = \sqrt{\frac{G\,M(<R)}{R}}
```
Caption: The speed needed for a circular orbit at radius $R$, given the enclosed mass $M(<R)$.

**Card 2: Component decomposition**
```latex
V_{\rm total}(R) = \sqrt{V_{\rm bulge}^2 + V_{\rm disk}^2 + V_{\rm halo}^2}
```
Caption: Contributions add in quadrature because gravitational potentials are additive.

**Card 3: The dark matter argument**
```latex
M_{\rm dark}(<R) = \frac{V_{\rm obs}^2\,R}{G} - M_{\rm vis}(<R)
```
Caption: The difference between the total mass implied by the rotation speed and the visible mass is attributed to dark matter.

**Card 4: Keplerian expectation**
```latex
V_{\rm Kep}(R) \propto R^{-1/2} \quad \text{for } R \gg R_d
```
Caption: Outside the visible disk, if there were no additional mass, $V$ should fall off. Flat rotation curves demand extra mass at large radii.

**Card 5: Measuring $V(R)$ with Doppler**
```latex
V_{\rm obs}(R) = \frac{c\,\Delta\lambda}{\lambda_0\,\sin i}
```
Caption: The rotation speed at each radius is measured by the Doppler shift of the 21-cm hydrogen line (or optical emission lines like H$\alpha$). The $\sin i$ correction accounts for the galaxy's inclination to our line of sight. This demo displays the intrinsic (corrected) $V(R)$, as is standard in published rotation curves.

**Card 6: MOND prediction**
```latex
V_{\rm MOND} = \left(G\,M_{\rm vis}\,a_0\right)^{1/4}
```
Caption: In Milgrom's Modified Newtonian Dynamics, the asymptotic (deep-MOND) velocity depends only on visible mass and the acceleration constant $a_0 \approx 1.2 \times 10^{-10}$ m/s². MOND fits many galaxy rotation curves without dark matter but faces challenges at cluster scales.

**Card 7: Baryon fraction**
```latex
f_b(R) = \frac{M_{\rm vis}(<R)}{M_{\rm total}(<R)} \quad ; \quad f_{b,\rm cosmic} \approx 0.157
```
Caption: The local baryon fraction can be compared to the cosmic average from Planck. When $f_b < f_{b,\rm cosmic}$, even baryons are "missing" — likely in the hot circumgalactic medium.

### Model notes
- Mass profiles use the Hernquist (bulge), exponential disk (Freeman), and NFW (halo) analytic models — standard choices in galaxy dynamics.
- The disk velocity uses the enclosed-mass approximation rather than the exact Bessel-function solution ($I_n$, $K_n$). This overestimates $V_{\rm disk}$ by up to ~15% near the peak ($R \approx 2.2\,R_d$) and is more accurate at large $R$. The approximation is standard in pedagogical contexts.
- Real rotation curves have bumps, wiggles, and asymmetries from spiral arms, bars, and non-circular motions. This demo shows idealized smooth profiles.
- The NFW virial radius depends on cosmology through $\rho_{\rm crit}$. The demo uses Planck 2018 values ($H_0 = 67.4$ km/s/Mpc) internally.
- The "Milky Way" preset uses values consistent with McMillan (2017) and Bland-Hawthorn & Gerhard (2016).
- **MOND** is shown as an optional curve toggle for comparison. It uses the full interpolation function (not just the deep-MOND limit) so the transition is smooth. MOND fits individual rotation curves well but underpredicts cluster masses by factors of 2–3 (see §15).
- The galaxy view is a **schematic face-on diagram**. Real rotation curves are measured from galaxies tilted to our line of sight (inclination $i \neq 0°$). The demo displays the intrinsic (inclination-corrected) $V(R)$.

---

## 7) Predict → Play → Explain

### Predict prompt
> Stars at the outer edge of a spiral galaxy (30 kpc from center) orbit at about the same speed as stars halfway in (15 kpc). According to Kepler's laws, if most of the galaxy's mass is concentrated in the bright central region, should the outer stars be moving faster, slower, or the same speed as the inner stars? What does it mean that they move at the same speed?

### Play steps
1. Select **"No dark matter"** preset. Observe the rotation curve — it rises and then **falls off** at large radii. This is the Keplerian prediction.
2. Now select **"Milky Way-like"** preset. The curve stays **flat** out to 50 kpc. Toggle ON the halo contribution to see why — the dark matter halo provides the extra gravity.
3. Switch back to "No dark matter" and **slowly increase the dark halo mass** slider from 0. Watch the rotation curve flatten out. How much dark matter do you need to match a flat curve at ~220 km/s?
4. Toggle ON the **MOND prediction**. Notice it also produces a flat curve from visible mass alone — no dark matter needed at the galaxy scale. Science demands we test alternatives!
5. Select **"Dwarf galaxy"** preset. Notice the dark-to-visible ratio is even larger. Dwarf galaxies are the most dark-matter-dominated objects in the universe.
6. Switch to **"Enclosed mass" plot mode**. Find the radius where $M_{\rm dark}$ exceeds $M_{\rm vis}$. For the MW preset, this happens at $R \approx 10$ kpc.
7. Move the radius marker to $R = 50$ kpc and read the baryon fraction. Compare to the cosmic value of 0.157.

### Explain prompt
> You measured a galaxy's rotation curve and found $V = 200$ km/s at $R = 30$ kpc. The visible mass inside that radius is $4 \times 10^{10}\,M_\odot$. Calculate the total mass inside 30 kpc using $M = V^2 R / G$. How much of it is dark matter? What is the baryon fraction, and how does it compare to the cosmic average?
>
> Use $G_{\rm galaxy} = 4.3 \times 10^{4}$ kpc (km/s)² per ($10^{10}\,M_\odot$).
>
> *Answer: $M_{\rm total} = 200^2 \times 30 / (4.3 \times 10^4) \approx 27.9 \times 10^{10}\,M_\odot$. Dark matter: $\approx 23.9 \times 10^{10}\,M_\odot$ (86%). Baryon fraction: $f_b = 4/27.9 \approx 0.14$, close to but slightly below the cosmic 0.157.*

---

## 8) Station Mode

### Columns

| Key | Label |
|-----|-------|
| `case` | Case |
| `radiusKpc` | $R$ (kpc) |
| `vTotalKmS` | $V_{\rm total}$ (km/s) |
| `vKeplerianKmS` | $V_{\rm Kep}$ (km/s) |
| `vMondKmS` | $V_{\rm MOND}$ (km/s) |
| `mEnclosed10` | $M_{\rm total}(<R)$ ($10^{10}\,M_\odot$) |
| `mVisible10` | $M_{\rm vis}(<R)$ ($10^{10}\,M_\odot$) |
| `mDark10` | $M_{\rm dark}(<R)$ ($10^{10}\,M_\odot$) |
| `darkVisRatio` | $M_{\rm dark} / M_{\rm vis}$ |
| `baryonFrac` | $f_b$ |
| `deltaLambda21mm` | $\Delta\lambda_{21}$ (mm) |

### Comparison row set: "Radial profile"
Generate rows at $R = 2, 5, 10, 15, 20, 30, 40, 50$ kpc for the current galaxy model.

### Synthesis prompt
> Plot $M_{\rm dark} / M_{\rm vis}$ as a function of radius. At what radius does dark matter start to dominate? Compare the baryon fraction at $R = 50$ kpc to the cosmic value of 0.157. What does this tell you about where the dark matter halo extends compared to the visible galaxy?

---

## 9) Galaxy View — Rendering Specification

### SVG or Canvas: 600 × 600 viewport

**Background**: transparent (starfield shows through)

**Disk**: Elliptical gradient simulating a face-on exponential disk
- Central bulge: bright warm glow (using `--cp-celestial-sun-corona` tones)
- Disk: exponential radial falloff, with subtle spiral arm structure (2 or 4 arms using logarithmic spiral equations). The arms are artistic, not physically computed.
- Colors: warm center transitioning to cooler blue at edges (young stars in arms)

**Dark matter halo**: a large diffuse circular haze extending well beyond the disk
- Color: `--cp-accent-violet` or similar at very low opacity (10–20%)
- Radius scales with $R_{\rm vir}$ (derived from halo mass)
- Label: "Dark matter halo" with a subtle boundary indicator

**Spectroscopic slit**: a horizontal line through the galaxy center
- Left half: blue-tinted overlay (approaching side)
- Right half: red-tinted overlay (receding side)
- Arrow annotations: "Blueshift" (left), "Redshift" (right)
- Subscript: "Schematic — real observations use tilted galaxies"

**Radius marker**: a tick mark on the slit at the current radius, synced with the plot below

---

## 10) Rotation Curve Plot — Rendering Specification

### Canvas: full panel width, aspect ratio ~2:1

**Axes**:
- X: $R$ (kpc), 0 to 50, major gridlines every 10 kpc
- Y: $V$ (km/s), 0 to 350, major gridlines every 50 km/s (velocity mode) — or $M(<R)$ ($10^{10}\,M_\odot$), auto-scaled (mass mode)
- Axis labels in `--cp-readout-label-color`

**Velocity mode curves**:
- Total observed: thick solid, `--cp-accent-amber`, 2.5px stroke
- Keplerian: dashed, `--cp-accent-ice`, 2px stroke
- Bulge: thin dotted, `--cp-chart-1`, 1.5px stroke
- Disk: thin dot-dash, `--cp-chart-2`, 1.5px stroke
- Halo: thin long-dash, `--cp-chart-3`, 1.5px stroke
- MOND: thin solid, `--cp-accent-rose`, 1.5px stroke
- Each curve has a small legend chip at the right margin

**Mass mode curves**:
- Total: thick solid, `--cp-accent-amber`
- Visible: dashed, `--cp-accent-ice`
- Dark: thin long-dash, `--cp-chart-3`
- Crossing-point annotation where $M_{\rm dark} = M_{\rm vis}$

**Marker**: filled circle on the total curve at the current radius, with crosshair lines to both axes

**Fill region** (velocity mode): when both total and Keplerian curves are shown, a subtle fill between them (light `--cp-accent-rose` at 15% opacity) to highlight the "missing mass" discrepancy. Label: "Dark matter contribution"

---

## 11) Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Toggle help |
| `g` | Toggle station mode |
| `k` | Toggle Keplerian curve |
| `m` | Toggle MOND curve |
| `p` | Toggle plot mode (velocity ↔ mass) |
| `[` / `]` | Move radius marker by 2 kpc |
| `1`–`4` | Activate galaxy preset 1–4 |

---

## 12) Accessibility

- All sliders keyboard-accessible with `aria-label` and `aria-valuetext`
- Live region describes: current radius, velocity, dominant mass component
- Plot has companion screen-reader text: "Rotation curve showing velocity versus radius for a [preset name] galaxy"
- Color-blind safe: curves distinguished by line style (solid, dashed, dotted, dot-dash) in addition to color
- Respects `prefers-reduced-motion`: no animated transitions when changing sliders (instant updates)

---

## 13) Export Payload

```json
{
  "version": 1,
  "timestamp": "...",
  "parameters": [
    { "name": "Galaxy model", "value": "Milky Way-like" },
    { "name": "Bulge mass (10^10 Msun)", "value": "0.9" },
    { "name": "Bulge scale radius (kpc)", "value": "0.3" },
    { "name": "Disk mass (10^10 Msun)", "value": "5.0" },
    { "name": "Disk scale length (kpc)", "value": "2.6" },
    { "name": "Dark halo mass (10^10 Msun)", "value": "130" },
    { "name": "Halo scale radius (kpc)", "value": "21.5" }
  ],
  "derived": [
    { "name": "Concentration c", "value": "10.7" },
    { "name": "Virial radius R_vir (kpc)", "value": "231" }
  ],
  "readouts": [
    { "name": "Radius R (kpc)", "value": "10.0" },
    { "name": "V_total (km/s)", "value": "215.0" },
    { "name": "V_Keplerian (km/s)", "value": "151.4" },
    { "name": "V_MOND (km/s)", "value": "170.7" },
    { "name": "M_total(<R) (10^10 Msun)", "value": "10.74" },
    { "name": "M_visible(<R) (10^10 Msun)", "value": "5.33" },
    { "name": "M_dark(<R) (10^10 Msun)", "value": "5.41" },
    { "name": "Dark-to-visible ratio", "value": "1.02" },
    { "name": "Baryon fraction f_b", "value": "0.50" },
    { "name": "Delta-lambda 21cm (mm)", "value": "0.151" }
  ],
  "notes": [
    "Uses Hernquist bulge + exponential disk + NFW halo mass decomposition.",
    "V_total^2 = V_bulge^2 + V_disk^2 + V_halo^2 (quadrature addition).",
    "Disk velocity uses enclosed-mass approximation (overestimates by up to ~15% near peak).",
    "G_galaxy = 4.3009e4 kpc (km/s)^2 per (10^10 Msun).",
    "NFW virial radius computed using Planck 2018 cosmology (H_0 = 67.4 km/s/Mpc).",
    "MOND uses full interpolation function with a_0 = 1.2e-10 m/s^2."
  ]
}
```

---

## 14) Implementation Dependencies

### New physics module: `galaxyRotationModel.ts`

Located in `packages/physics/src/`. Implements:
- Hernquist bulge profile
- Exponential disk enclosed mass (and velocity)
- NFW halo profile (with cosmology-derived virial radius)
- MOND prediction (full interpolation function)
- Total rotation curve computation
- Galaxy presets
- Enclosed mass decomposition
- 21-cm Doppler shift helper
- Baryon fraction helper

### Dependencies on existing modules
- `AstroConstants` (for $c$ in km/s; $G_{\rm galaxy}$ defined locally in galaxy units)
- No dependency on `DopplerShiftModel` (the Doppler connection is conceptual, shown via the slit overlay and $\Delta\lambda_{21}$ readout, not computed via the Doppler model)
- No dependency on `TwoBodyAnalytic` (this is galactic-scale, not binary-scale)

### Modified Bessel functions (future enhancement)
The exact exponential disk rotation curve requires modified Bessel functions $I_0$, $I_1$, $K_0$, $K_1$. Options:
1. **v1 (current)**: Use the enclosed-mass approximation (overestimates by up to ~15% near peak)
2. **v2 (future)**: Implement polynomial approximations for Bessel functions (Abramowitz & Stegun)
3. **v3 (future)**: Use a numerical library

The enclosed-mass approximation is noted in model notes and is standard practice in pedagogical contexts.

---

## 15) Dark Matter Across Scales (Understand Panel — Extended Section)

This section extends beyond individual galaxy rotation curves to show how dark matter evidence accumulates across cosmic scales. It is presented as a scrollable section in the Understand drawer, below the equation cards.

### Scale 1: Galaxy rotation curves (this demo)

**Evidence**: Flat rotation curves where Keplerian falloff is expected.
**Method**: Doppler shift of 21-cm HI emission or optical lines (H$\alpha$, [NII]).
**Key numbers**: $M_{\rm dark}/M_{\rm vis} \sim 5$–$10$ within $R_{\rm vir}$. For the Milky Way, $M_{\rm vir} \approx 1.3 \times 10^{12}\,M_\odot$, of which only ~5% is in stars.
**MOND status**: Fits individual rotation curves well (including dwarfs via the baryonic Tully-Fisher relation).

### Scale 2: Galaxy clusters — velocity dispersion (Zwicky 1933)

**Evidence**: Fritz Zwicky measured galaxy velocities in the Coma cluster and found they were moving too fast to be gravitationally bound by the visible mass alone.
**Method**: Virial theorem — $M_{\rm virial} = 5\,\sigma_v^2\,R_h / G$, where $\sigma_v$ is the velocity dispersion and $R_h$ is the half-mass radius.
**Key numbers**: For Coma, $\sigma_v \approx 1{,}000$ km/s, $R_h \approx 1.5$ Mpc → $M \sim 10^{15}\,M_\odot$. Visible galaxies account for only ~2–3% of this.
**Historical note**: This was the **original** dark matter argument (1933), decades before rotation curves!
**MOND status**: Underpredicts cluster masses by factors of 2–3. MOND advocates invoke undetected baryons (hot gas), but the shortfall persists.

### Scale 3: Galaxy clusters — X-ray gas

**Evidence**: Hot intracluster medium (ICM) at $T \sim 10^7$–$10^8$ K emits X-rays. The gas mass exceeds the stellar mass in cluster galaxies.
**Method**: X-ray luminosity and temperature profiles → gas mass and total gravitating mass (via hydrostatic equilibrium).
**Key numbers**: ICM + galaxies ≈ 15% of total mass → 85% dark matter. The baryon fraction in clusters ($f_b \approx 0.13$–$0.17$) is close to the cosmic value — clusters are "fair samples" of the universe.

### Scale 4: The Bullet Cluster (1E 0657-56)

**Evidence**: Two galaxy clusters collided. The X-ray gas (most of the visible mass) was stripped and decelerated in the collision, but gravitational lensing shows the mass peaks are **offset** from the gas — they coincide with the galaxies (and, presumably, dark matter).
**Method**: Weak gravitational lensing maps the total mass distribution; X-ray imaging maps the gas.
**Key implication**: The mass is **not where the baryons are**. This is very difficult to explain with modified gravity (MOND), because in MOND the gravitational lensing should track the dominant baryonic mass (the gas). The Bullet Cluster is often called the "smoking gun" for particle dark matter.

### Scale 5: Cosmic microwave background and large-scale structure

**Evidence**: The power spectrum of CMB temperature fluctuations and the distribution of galaxies both require a non-baryonic dark matter component to match observations.
**Key numbers**: $\Omega_m \approx 0.315$, $\Omega_b \approx 0.049$ → dark matter is ~85% of all matter.
**Connection**: The cosmic baryon fraction $f_b = \Omega_b / \Omega_m \approx 0.157$ is the value shown in the demo's baryon fraction readout.

### Summary table (displayed in the panel)

| Scale | Method | $M_{\rm dark}/M_{\rm vis}$ | MOND fits? |
|-------|--------|---------------------------|------------|
| Galaxy ($R \sim 50$ kpc) | Rotation curves | ~5–10 | Yes |
| Galaxy cluster ($R \sim$ Mpc) | Velocity dispersion, X-rays | ~6–7 | Partial (factor 2–3 short) |
| Bullet Cluster | Gravitational lensing | Mass offset from gas | No — key falsification |
| Universe (CMB) | Power spectrum | $\Omega_{\rm DM}/\Omega_b \approx 5.4$ | Alternative theories needed |

---

## 16) Notation Conventions

This spec uses LaTeX math notation throughout:
- All inline variables and expressions use `$...$` delimiters
- Display equations use `$$...$$` blocks
- Greek letters: $\rho$ (density), $\sigma$ (dispersion), $\Sigma$ (surface density), $\Omega$ (cosmological density parameters)
- Subscript conventions: $M_b$ (bulge), $M_d$ (disk), $M_h$ (halo), $M_{\rm vis}$ (visible), $M_{\rm dark}$ (dark matter), $R_d$ (disk scale length), $r_s$ (NFW scale radius), $R_{\rm vir}$ (virial radius), $a_b$ (bulge scale radius), $a_0$ (MOND constant)
- KaTeX cards in the Understand panel use the same LaTeX notation
- ASCII wireframes use Unicode equivalents where necessary (these are code fences, not rendered math)
- TypeScript identifiers use camelCase with unit suffixes: `vTotalKmS`, `radiusKpc`, `mEnclosed10`, `deltaLambda21mm`, `baryonFraction`
