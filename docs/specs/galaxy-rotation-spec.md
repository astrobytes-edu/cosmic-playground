# Galaxy Rotation Curves — Demo Spec

**Status:** Draft
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
- Build the **rotation curve** — the V(R) plot — as the central observable
- Compare the observed (flat) rotation curve to the **Keplerian prediction** from visible matter alone, which falls as 1/sqrt(R) at large radii
- Demonstrate that the discrepancy implies **unseen mass** — either dark matter or modified gravity
- Let students interactively adjust the **dark matter halo** mass to fit the observed curve, building intuition for how much dark matter is needed and where it sits
- Connect to the Doppler effect: every point on the rotation curve is a velocity measured from a spectral line shift

### Audience

- **ASTR 101**: Qualitative — see the flat rotation curve, understand the mismatch, grasp the dark matter argument
- **ASTR 201**: Quantitative — decompose the curve into bulge + disk + halo components, mass modeling, M(R) = V^2 R / G

### Relationship to other demos

| Demo | Relationship |
|------|-------------|
| `doppler-shift` | This demo is a direct application: each velocity point comes from a Doppler measurement |
| `spectral-lines` | The 21-cm line (hyperfine transition of neutral hydrogen) and optical emission lines are the observational tools |
| `keplers-laws` | Keplerian falloff (V ~ 1/sqrt(R)) is the expected behavior for a point-mass or compact mass distribution |
| `binary-orbits` | Orbital mechanics applied to single objects on circular orbits within a galaxy potential |
| `conservation-laws` | Virial theorem, gravitational binding — connect to cluster-scale dark matter evidence |

### Out of scope for this demo

- Modified gravity theories (MOND) — mentioned in model notes as an alternative but not interactively modeled
- Dark matter particle physics — we discuss the gravitational evidence, not the particle candidates
- Galaxy formation and evolution — this demo is about the present-day kinematic evidence
- Full 3D galaxy models — we use a 1D radial profile for clarity

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
|   V_bulge / V_halo]        |  │      ····               ····│  |
|                            |  │  ← blue    slit    red →    │  |
| [Slit position slider]     |  └─────────────────────────────┘  |
|                            |                                   |
| Readouts panel             |  Rotation Curve Plot (Canvas)     |
|   V(R) = ... km/s          |  ┌─────────────────────────────┐  |
|   R = ... kpc               |  │  V    ___________________   │  |
|   M(<R) = ... Msun         |  │  ↑  ╱   observed (flat)     │  |
|   V_Keplerian = ... km/s   |  │  │╱  - - - - Keplerian      │  |
|                            |  │  │    ··· disk  ─── halo     │  |
|                            |  │  +──────────────────── R →   │  |
|                            |  └─────────────────────────────┘  |
+---------------------------------------------------------------+
| Drawer: Understand / Model notes                               |
+---------------------------------------------------------------+
```

### Primary visualizations

#### A. Galaxy View (upper stage) — face-on disk with slit overlay

A stylized **face-on spiral galaxy** rendered as a luminous disk with spiral arms (or a simple exponential disk with radial brightness falloff).

Key elements:
- **Galactic center**: bright bulge with glow (`--cp-celestial-sun-core` or a warm golden token)
- **Disk**: exponential brightness profile fading outward, with subtle spiral arm structure
- **Spectroscopic slit**: a horizontal line across the galaxy center (representing where a long-slit spectrograph samples)
  - Left side of slit: **blue-tinted** (approaching, blueshifted gas)
  - Right side of slit: **red-tinted** (receding, redshifted gas)
  - This directly shows HOW rotation curves are measured
- **Slit position marker**: a vertical tick showing the current radius being highlighted, synced with the rotation curve below
- **Dark matter halo**: a faint, extended circular region around the galaxy (much larger than the visible disk), with opacity proportional to the halo mass slider. This visualizes the invisible: the halo extends far beyond where stars are visible.

#### B. Rotation Curve Plot (lower stage) — V(R) vs. R

The central scientific graphic. A standard Cartesian plot showing:

**Axes**:
- Horizontal: galactocentric radius R (kpc), range 0–50 kpc
- Vertical: circular velocity V (km/s), range 0–350 km/s

**Curves** (each can be toggled on/off via checkboxes):
- **Observed (total)**: solid thick line, color `--cp-accent-amber`. This is the physically correct total: V_total = sqrt(V_bulge^2 + V_disk^2 + V_halo^2)
- **Keplerian prediction**: dashed line, color `--cp-accent-ice`. What you'd expect if all the mass were at the center: V = sqrt(GM(<R)/R). Falls as 1/sqrt(R) outside the visible disk.
- **Bulge contribution**: thin dotted line, color `--cp-chart-1`. Rises steeply then falls.
- **Disk contribution**: thin dot-dash line, color `--cp-chart-2`. Rises, peaks around 2–3 disk scale lengths, then falls.
- **Halo contribution**: thin long-dash line, color `--cp-chart-3`. Rises roughly linearly then flattens — dominates at large R.

**Interactive element**: a **draggable marker** on the observed curve that the student can pull along the radius axis. As it moves, the readouts update and the slit position marker on the galaxy view moves in sync.

**The "aha" moment**: with the halo slider at zero, the observed curve drops off (Keplerian). As students increase the dark halo mass, the curve flattens out to match real observations. They are literally adding dark matter to make the physics work.

---

## 3) Controls

### Galaxy model selector
- Dropdown or chips: "Milky Way-like" (default), "Dwarf galaxy", "Massive elliptical", "Custom"
- Each preset sets appropriate bulge mass, disk mass, and halo parameters
- "Custom" enables all sliders for free exploration

### Dark matter halo mass slider
- Range: 0 to 200 (units: 10^10 Msun, so 0 to 2 x 10^12 Msun)
- Default: 100 (10^12 Msun, typical Milky Way halo)
- Label: "Dark halo mass (x10^10 Msun)"
- **This is the star control**: sliding it from 0 to the correct value visually demonstrates the dark matter argument

### Dark matter halo scale radius slider
- Range: 5 to 50 kpc
- Default: 20 kpc (typical NFW scale radius)
- Label: "Halo scale radius (kpc)"

### Disk mass slider
- Range: 1 to 20 (units: 10^10 Msun)
- Default: 5 (5 x 10^10 Msun, approximately Milky Way)
- Label: "Disk mass (x10^10 Msun)"

### Disk scale length slider
- Range: 1 to 10 kpc
- Default: 3.5 kpc (Milky Way)

### Bulge mass slider
- Range: 0 to 5 (units: 10^10 Msun)
- Default: 1 (10^10 Msun)
- Label: "Bulge mass (x10^10 Msun)"

### Component visibility checkboxes
- [x] Observed (total) — always shown
- [ ] Keplerian — toggled
- [ ] Disk contribution
- [ ] Bulge contribution
- [ ] Halo contribution
- Default: Observed + Keplerian checked (the two essential curves for the dark matter argument)

### Radius marker
- Slider or click-on-plot: R from 0.5 to 50 kpc
- Default: 10 kpc

---

## 4) Readouts

| Label | ID | Value | Unit |
|-------|-----|-------|------|
| Radius | `radiusValue` | Current marker position | kpc |
| Total velocity V(R) | `vTotalValue` | Total circular velocity at R | km/s |
| Keplerian velocity | `vKeplerianValue` | V if all mass inside R were a point | km/s |
| Enclosed mass M(<R) | `mEnclosedValue` | Total mass inside R | 10^10 Msun |
| Visible mass M_vis(<R) | `mVisibleValue` | Bulge + disk mass inside R | 10^10 Msun |
| Dark mass M_dark(<R) | `mDarkValue` | Halo mass inside R | 10^10 Msun |
| Dark-to-visible ratio | `darkVisRatioValue` | M_dark / M_visible at this R | (dimensionless) |

The dark-to-visible ratio readout is the punchline: at R ~ 50 kpc it can be 10:1 or more, directly showing that most of the mass is dark.

---

## 5) Physics Model — `GalaxyRotationModel`

### Mass components

#### Bulge (Hernquist profile)
```
rho_bulge(r) = (M_b / (2*pi)) * (a_b / r) * 1 / (r + a_b)^3
M_bulge(<r) = M_b * r^2 / (r + a_b)^2
V_bulge(r)  = sqrt(G * M_bulge(<r) / r)
```
where M_b = bulge mass, a_b = bulge scale radius (fixed at 0.5 kpc for simplicity, or a fraction of disk scale length).

#### Disk (exponential disk — Freeman approximation)
```
Sigma(R) = (M_d / (2*pi*R_d^2)) * exp(-R / R_d)

V_disk^2(R) = 4*pi*G*Sigma_0*R_d * y^2 * [I_0(y)*K_0(y) - I_1(y)*K_1(y)]
```
where y = R / (2*R_d), and I_n, K_n are modified Bessel functions of the first and second kind.

For computational simplicity, we can use the commonly used approximation for the enclosed mass of an exponential disk:
```
M_disk(<R) = M_d * [1 - (1 + R/R_d) * exp(-R/R_d)]
```
and then V_disk(R) = sqrt(G * M_disk(<R) / R) as a reasonable approximation. The full Bessel-function version is more accurate but may not be worth the complexity for an intro demo. We should note the approximation in model notes.

#### Halo (NFW profile — Navarro-Frenk-White)
```
rho_halo(r) = rho_s / [(r/r_s) * (1 + r/r_s)^2]

M_halo(<r) = 4*pi*rho_s*r_s^3 * [ln(1 + r/r_s) - (r/r_s)/(1 + r/r_s)]

V_halo(r) = sqrt(G * M_halo(<r) / r)
```
where rho_s = M_halo / [4*pi*r_s^3 * (ln(1+c) - c/(1+c))], with c = R_vir / r_s being the concentration parameter.

For the slider interface, we parameterize as:
- M_halo_total = total halo mass (virial mass)
- r_s = scale radius
- Concentration derived: c = R_vir / r_s, where R_vir is determined by M_halo and a virial overdensity criterion (or we just let students set M and r_s directly)

#### Total
```
V_total(R) = sqrt(V_bulge^2 + V_disk^2 + V_halo^2)
```

This is the key formula: the velocities add in quadrature because we're adding the gravitational potential contributions.

### Keplerian reference
```
V_Keplerian(R) = sqrt(G * M_visible(<R) / R)
```
where M_visible = M_bulge(<R) + M_disk(<R). This is what you'd predict without dark matter.

### Enclosed mass from velocity
```
M(<R) = V(R)^2 * R / G
```
This is the direct inversion: measure V(R), get M(<R). When M(<R) >> M_visible(<R), the difference is dark matter.

### Constants and units

All quantities in "galaxy units":
- Distances: kpc
- Velocities: km/s
- Masses: 10^10 Msun (or Msun, with appropriate scaling)
- G in compatible units: G = 4.302 x 10^-3 pc Msun^-1 (km/s)^2, or equivalently G = 4.302 x 10^-3 kpc (10^10 Msun)^-1 (km/s)^2 * 10^10 ...

Let's be precise:
```
G = 4.3009 x 10^-3  pc (km/s)^2 / Msun
  = 4.3009 x 10^-3  * 10^3  kpc (km/s)^2 / Msun     (since 1 kpc = 10^3 pc)
  = 4.3009            kpc (km/s)^2 / (10^10 Msun)     (if mass in 10^10 Msun units)
```

So if we express mass in units of 10^10 Msun and distance in kpc:
```
G_galaxy = 4.3009  kpc (km/s)^2 per (10^10 Msun)
```

This means: V^2 = G_galaxy * M_10 / R_kpc, where M_10 is mass in 10^10 Msun.

### Core functions

```typescript
/** Circular velocity from bulge (Hernquist profile). */
vBulgeKmS(args: { radiusKpc: number; bulgeMass10: number; bulgeScaleKpc?: number }): number;

/** Circular velocity from exponential disk. */
vDiskKmS(args: { radiusKpc: number; diskMass10: number; diskScaleLengthKpc: number }): number;

/** Circular velocity from NFW dark matter halo. */
vHaloKmS(args: { radiusKpc: number; haloMass10: number; haloScaleRadiusKpc: number }): number;

/** Total circular velocity (quadrature sum). */
vTotalKmS(args: { radiusKpc: number; params: GalaxyParams }): number;

/** Keplerian velocity from visible mass only. */
vKeplerianKmS(args: { radiusKpc: number; params: GalaxyParams }): number;

/** Enclosed mass at radius R. */
enclosedMass10(args: { radiusKpc: number; params: GalaxyParams }): {
  total: number; bulge: number; disk: number; halo: number;
};

/** Generate a full rotation curve (array of R, V points). */
rotationCurve(args: { params: GalaxyParams; rMinKpc?: number; rMaxKpc?: number; nPoints?: number }): Array<{
  radiusKpc: number;
  vTotalKmS: number;
  vBulgeKmS: number;
  vDiskKmS: number;
  vHaloKmS: number;
  vKeplerianKmS: number;
}>;

interface GalaxyParams {
  bulgeMass10: number;       // bulge mass in 10^10 Msun
  bulgeScaleKpc: number;     // Hernquist scale radius (kpc)
  diskMass10: number;        // disk mass in 10^10 Msun
  diskScaleLengthKpc: number; // exponential scale length (kpc)
  haloMass10: number;        // NFW halo virial mass in 10^10 Msun
  haloScaleRadiusKpc: number; // NFW scale radius (kpc)
}
```

### Galaxy presets

| Preset | Bulge (10^10 Msun) | Disk (10^10 Msun) | R_d (kpc) | Halo (10^10 Msun) | r_s (kpc) | Notes |
|--------|--------------------|--------------------|-----------|--------------------|-----------| ------|
| Milky Way-like | 1.0 | 5.0 | 3.5 | 100 | 20 | Canonical MW decomposition |
| Dwarf galaxy | 0.0 | 0.3 | 1.5 | 5 | 8 | Dark-matter dominated at all radii |
| Massive spiral | 2.0 | 10.0 | 5.0 | 200 | 25 | Large Sb/Sc galaxy |
| No dark matter | 1.0 | 5.0 | 3.5 | 0 | 20 | Shows Keplerian falloff — the "missing mass" scenario |

### Test benchmarks

| Test case | Input | Expected | Notes |
|-----------|-------|----------|-------|
| V_total at R=0 | any params | 0 km/s | All profiles go to zero at center |
| MW-like at R=8.2 kpc | Default preset | V_total ≈ 220-240 km/s | Solar circle, well-constrained |
| Keplerian falloff | No halo, R >> R_d | V ~ 1/sqrt(R) behavior | Check several points at large R |
| Halo dominance at large R | MW preset, R=50 kpc | V_halo >> V_disk, V_bulge | Halo contribution dominates |
| Enclosed mass monotonicity | Any params | M(<R) increases with R | Sanity check |
| Quadrature addition | At any R | V_total^2 = V_b^2 + V_d^2 + V_h^2 | Definition |
| Disk enclosed mass limit | R -> infinity | M_disk(<R) -> M_disk_total | Exponential convergence |
| NFW enclosed mass at r_s | R = r_s | M(<r_s) = M_halo * f(1)/f(c) | Analytic check |

---

## 6) Understand Panel (Drawer)

### Equations (KaTeX)

**Card 1: Circular velocity**
```latex
V(R) = \sqrt{\frac{G\,M(<R)}{R}}
```
Caption: The speed needed for a circular orbit at radius R, given the enclosed mass M(<R).

**Card 2: Component decomposition**
```latex
V_{\rm total}(R) = \sqrt{V_{\rm bulge}^2 + V_{\rm disk}^2 + V_{\rm halo}^2}
```
Caption: Contributions add in quadrature because gravitational potentials are additive.

**Card 3: The dark matter argument**
```latex
M_{\rm dark}(<R) = \frac{V_{\rm obs}^2\,R}{G} - M_{\rm visible}(<R)
```
Caption: The difference between the total mass implied by the rotation speed and the visible mass is attributed to dark matter.

**Card 4: Keplerian expectation**
```latex
V_{\rm Keplerian}(R) \propto R^{-1/2} \quad \text{for } R \gg R_{\rm disk}
```
Caption: Outside the visible disk, if there were no additional mass, V should fall off. Flat rotation curves demand extra mass at large radii.

**Card 5: Measuring V(R) with Doppler**
```latex
V_{\rm rot}(R) = \frac{c\,\Delta\lambda}{\lambda_0\,\sin i}
```
Caption: The rotation speed at each radius is measured by the Doppler shift of the 21-cm hydrogen line (or optical emission lines like H-alpha). The sin(i) correction accounts for the galaxy's inclination to our line of sight.

### Model notes
- Mass profiles use the Hernquist (bulge), exponential disk (Freeman), and NFW (halo) analytic models — standard choices in galaxy dynamics.
- The disk velocity uses the enclosed-mass approximation rather than the exact Bessel-function solution. This is accurate to ~10% and avoids computational complexity.
- Real rotation curves have bumps, wiggles, and asymmetries from spiral arms, bars, and non-circular motions. This demo shows idealized smooth profiles.
- **MOND (Modified Newtonian Dynamics)** is an alternative hypothesis that modifies gravity at low accelerations rather than invoking dark matter. It successfully fits many rotation curves but faces challenges at cluster scales. We model only the dark matter hypothesis here.
- The "Milky Way" preset uses approximate values consistent with published mass models (e.g., McMillan 2017, Bland-Hawthorn & Gerhard 2016).

---

## 7) Predict → Play → Explain

### Predict prompt
> Stars at the outer edge of a spiral galaxy (30 kpc from center) orbit at about the same speed as stars halfway in (15 kpc). According to Kepler's laws, if most of the galaxy's mass is concentrated in the bright central region, should the outer stars be moving faster, slower, or the same speed as the inner stars? What does it mean that they move at the same speed?

### Play steps
1. Select **"No dark matter"** preset. Observe the rotation curve — it rises and then **falls off** at large radii. This is the Keplerian prediction.
2. Now select **"Milky Way-like"** preset. The curve stays **flat** out to 50 kpc. Toggle ON the halo contribution to see why — the dark matter halo provides the extra gravity.
3. Switch back to "No dark matter" and **slowly increase the dark halo mass** slider from 0. Watch the rotation curve flatten out. How much dark matter do you need to match a flat curve at ~220 km/s?
4. Select **"Dwarf galaxy"** preset. Notice the dark-to-visible ratio is even larger. Dwarf galaxies are the most dark-matter-dominated objects in the universe!
5. Move the radius marker to R = 50 kpc and read the dark-to-visible mass ratio. Compare to R = 5 kpc.

### Explain prompt
> You measured a galaxy's rotation curve and found V = 200 km/s at R = 30 kpc. The visible mass inside that radius is 4 x 10^10 Msun. Calculate the total mass inside 30 kpc using V^2 R / G. How much of it is dark matter? (Use G = 4.3 kpc (km/s)^2 / (10^10 Msun).)

---

## 8) Station Mode

### Columns

| Key | Label |
|-----|-------|
| `case` | Case |
| `radiusKpc` | Radius R (kpc) |
| `vTotalKmS` | V_total (km/s) |
| `vKeplerianKmS` | V_Keplerian (km/s) |
| `mEnclosed10` | M_total(<R) (10^10 Msun) |
| `mVisible10` | M_visible(<R) (10^10 Msun) |
| `mDark10` | M_dark(<R) (10^10 Msun) |
| `darkVisRatio` | M_dark / M_vis |

### Comparison row set: "Radial profile"
Generate rows at R = 2, 5, 10, 15, 20, 30, 40, 50 kpc for the current galaxy model.

### Synthesis prompt
> Plot M_dark / M_visible as a function of radius. At what radius does dark matter start to dominate? What does this tell you about where the dark matter halo extends compared to the visible galaxy?

---

## 9) Galaxy View — Rendering Specification

### SVG or Canvas: 600 x 600 viewport

**Background**: transparent (starfield shows through)

**Disk**: Elliptical gradient simulating a face-on exponential disk
- Central bulge: bright warm glow (using `--cp-celestial-sun-corona` tones)
- Disk: exponential radial falloff, with subtle spiral arm structure (2 or 4 arms using logarithmic spiral equations). The arms are artistic, not physically computed.
- Colors: warm center transitioning to cooler blue at edges (young stars in arms)

**Dark matter halo**: a large diffuse circular haze extending well beyond the disk
- Color: `--cp-accent-violet` or similar at very low opacity (10-20%)
- Radius scales with the halo mass slider
- Label: "Dark matter halo" with a subtle boundary indicator

**Spectroscopic slit**: a horizontal line through the galaxy center
- Left half: blue-tinted overlay (approaching side)
- Right half: red-tinted overlay (receding side)
- Arrow annotations: "Blueshift" (left), "Redshift" (right)
- This visually connects to the Doppler demo: "this is how we measure the rotation curve"

**Radius marker**: a tick mark on the slit at the current radius, synced with the plot below

---

## 10) Rotation Curve Plot — Rendering Specification

### Canvas: full panel width, aspect ratio ~2:1

**Axes**:
- X: R (kpc), 0 to 50, major gridlines every 10 kpc
- Y: V (km/s), 0 to 350, major gridlines every 50 km/s
- Axis labels in `--cp-readout-label-color`

**Curves**:
- Total observed: thick solid, `--cp-accent-amber`, 2.5px stroke
- Keplerian: dashed, `--cp-accent-ice`, 2px stroke
- Bulge: thin dotted, `--cp-chart-1`, 1.5px stroke
- Disk: thin dot-dash, `--cp-chart-2`, 1.5px stroke
- Halo: thin long-dash, `--cp-chart-3`, 1.5px stroke
- Each curve has a small legend chip at the right margin

**Marker**: filled circle on the total curve at the current radius, with crosshair lines to both axes

**Fill region**: when both total and Keplerian curves are shown, a subtle fill between them (light `--cp-accent-rose` at 15% opacity) to highlight the "missing mass" discrepancy. Label: "Dark matter contribution"

---

## 11) Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Toggle help |
| `g` | Toggle station mode |
| `k` | Toggle Keplerian curve |
| `[` / `]` | Move radius marker by 2 kpc |
| `1–4` | Activate galaxy preset 1–4 |

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
    { "name": "Bulge mass (10^10 Msun)", "value": "1.0" },
    { "name": "Disk mass (10^10 Msun)", "value": "5.0" },
    { "name": "Disk scale length (kpc)", "value": "3.5" },
    { "name": "Dark halo mass (10^10 Msun)", "value": "100" },
    { "name": "Halo scale radius (kpc)", "value": "20" }
  ],
  "readouts": [
    { "name": "Radius R (kpc)", "value": "10.0" },
    { "name": "V_total (km/s)", "value": "220.5" },
    { "name": "V_Keplerian (km/s)", "value": "195.3" },
    { "name": "M_total(<R) (10^10 Msun)", "value": "11.3" },
    { "name": "M_visible(<R) (10^10 Msun)", "value": "4.8" },
    { "name": "M_dark(<R) (10^10 Msun)", "value": "6.5" },
    { "name": "Dark-to-visible ratio", "value": "1.35" }
  ],
  "notes": [
    "Uses Hernquist bulge + exponential disk + NFW halo mass decomposition.",
    "V_total^2 = V_bulge^2 + V_disk^2 + V_halo^2 (quadrature addition).",
    "Disk velocity uses enclosed-mass approximation (not exact Bessel solution).",
    "G = 4.3009 kpc (km/s)^2 per (10^10 Msun)."
  ]
}
```

---

## 14) Implementation Dependencies

### New physics module: `galaxyRotationModel.ts`

Located in `packages/physics/src/`. Implements:
- Hernquist bulge profile
- Exponential disk enclosed mass (and velocity)
- NFW halo profile
- Total rotation curve computation
- Galaxy presets
- Enclosed mass decomposition

### Dependencies on existing modules
- `AstroConstants` (for G in appropriate units — may need to add galaxy-scale G)
- No dependency on `DopplerShiftModel` (the Doppler connection is conceptual, shown via the slit overlay, not computed)
- No dependency on `TwoBodyAnalytic` (this is galactic-scale, not binary-scale)

### Modified Bessel functions
The exact exponential disk rotation curve requires modified Bessel functions I_0, I_1, K_0, K_1. Options:
1. Use the enclosed-mass approximation (simpler, ~10% accurate) — **recommended for v1**
2. Implement Bessel function approximations (polynomial fits, e.g., Abramowitz & Stegun) — future enhancement
3. Use a library — adds a dependency we don't want

The approximation is noted in model notes and is standard practice in pedagogical contexts.
