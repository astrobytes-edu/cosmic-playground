# Doppler Shift — Demo Spec

**Status:** Draft v3 (hardened, LaTeX notation)
**Date:** 2026-02-23
**Owner:** Cosmic Playground
**Slug:** `doppler-shift`
**Category:** Light & Spectra

---

## 1) Purpose & Positioning

`doppler-shift` is the Cosmic Playground instrument for the **Doppler effect applied to light**: how the relative motion between a source and an observer shifts the observed wavelength, frequency, and color of spectral lines.

It answers the foundational question: *How do astronomers measure the speed of objects they can never visit — using only the light those objects emit?*

### Primary pedagogical goals

- Build correct intuition for **why** motion shifts wavelengths: an approaching source emits each successive crest closer to the previous one (shorter observed wavelength), while a receding source emits each successive crest farther from the previous one (longer observed wavelength)
- **Confront the "ripple" misconception head-on**: students often picture wavelength varying spatially between source and observer (compressed near the source, stretched behind) — that is how sound works in a medium. Light has no medium; all crests arriving at the observer share the same spacing $\lambda_{\rm obs}$, which is set at the moment of emission.
- Connect the wave mechanism to **observable spectral line shifts** via a synchronized spectrum comparator
- Distinguish **blueshift** (approaching, $\lambda$ decreases, $\nu$ increases) from **redshift** (receding, $\lambda$ increases, $\nu$ decreases)
- Show Doppler shifts in both **wavelength and frequency**, reinforcing $\nu = c / \lambda$ and giving students practice with the asymmetry of the two formulas
- Introduce the **non-relativistic** formula ($\Delta\lambda / \lambda_0 = v_r / c$) and show when the **relativistic** formula is needed
- Define **redshift $z$** and build intuition for what $z = 0.1$, $1$, $3$ actually mean
- Provide real astronomical presets so students experience realistic velocity scales

### Audience

- **ASTR 101**: Wave diagram + spectrum comparator + non-relativistic formula + presets
- **ASTR 201**: Relativistic toggle, quantitative comparison of formulas, connection to cosmological redshift (conceptual), frequency analysis

### Relationship to other demos

| Demo | Relationship |
|------|-------------|
| `spectral-lines` | Provides the element line catalogs (H, He, Na, Ca, Fe) that this demo shifts |
| `em-spectrum` | Wavelength/frequency/energy relationship — this demo shifts lines along that axis |
| `blackbody-radiation` | Continuum shape also shifts; this demo focuses on discrete lines for clarity |
| `binary-orbits` | Spectroscopy extension uses this demo's Doppler physics to show RV curves |
| `galaxy-rotation` (planned) | Uses Doppler shifts of 21-cm H I emission to measure rotation velocities |
| `spectral-lab` (planned) | Capstone synthesis: continuum + lines + Doppler shift combined |

### Out of scope for this demo

- Cosmological redshift (stretching of space) — that is a different physical mechanism and belongs in a future `galaxy-redshift` or `cosmology` demo. We note the distinction in the "Understand" section.
- Gravitational redshift — mentioned conceptually but not modeled.
- Transverse Doppler effect — relativistic second-order effect, too specialized for intro astro.

---

## 2) Layout & Visual Architecture

### Shell variant: `viz-first` (sidebar controls, central stage)

```
+------------------------------------------------------+
| Controls (sidebar)      |  Stage (central)            |
|                         |                             |
| [Velocity slider]       |  Wave Diagram (SVG)         |
| [Redshift z slider]     |  ┌───────────────────────┐  |
| [Element selector]      |  │  uniform λ_obs crests  │  |
| [Formula toggle]        |  │  source ···→ observer  │  |
| [Presets]               |  │  (ghost: λ₀ reference) │  |
|                         |  └───────────────────────┘  |
| Readouts panel          |                             |
|   v_r     = ... km/s    |  Spectrum Comparator        |
|   z       = ...         |  ┌───────────────────────┐  |
|   λ_obs   = ... nm      |  │ Lab:   |  |  |   |    │  |
|   ν_obs   = ... THz     |  │ Obs:    |  |  |   |   │  |
|   Δλ      = ... nm      |  │         ↕ shift        │  |
|   Δν      = ... THz     |  └───────────────────────┘  |
|   Regime: ...           |                             |
|   NR error: ...%        |  [Zoom] [Center on lines]   |
+------------------------------------------------------+
| Drawer: Understand / Model notes                      |
+------------------------------------------------------+
```

### Primary visualizations

#### A. Wave Diagram (SVG, animated) — upper stage

A **side-view sinusoidal wave** showing the mechanism of Doppler shift for light.

Elements:
- **Source** (left-of-center circle with glow, using `--cp-celestial-star` tokens): emits wavefronts
- **Observer** (right side, telescope/eye icon): receives the light
- **Observed wave crests**: sinusoidal line between source and observer with **uniform spacing** equal to $\lambda_{\rm obs}$ everywhere. This is the physically correct picture for light (no medium).
  - At $v = 0$: spacing equals rest wavelength $\lambda_0$
  - At $v > 0$ (receding): spacing increases uniformly (longer wavelength, redder)
  - At $v < 0$ (approaching): spacing decreases uniformly (shorter wavelength, bluer)
- **Reference ghost wave** (faint dashed sinusoid): shows what the rest-wavelength $\lambda_0$ spacing would look like, overlaid on the same path. When $v \neq 0$, the observed and ghost waves visibly differ, making the shift tangible.
- **Wavelength annotation**: a horizontal bracket showing $\lambda_{\rm obs}$ between two crests near the observer, and a matching bracket on the ghost wave labeled $\lambda_0$
- **Color encoding**: the observed wave line color is set by `wavelengthToRgb(`$\lambda_{\rm obs}$`)` for the selected element's strongest visible line. The ghost wave is always a neutral grey.

**Why uniform spacing (not the ripple picture)**: The horizontal axis maps directly to wavelength and connects visually to the spectrum strip below. More importantly, the "compressed near source, stretched behind" picture is a **sound wave in a medium** — it is the #1 Doppler misconception in introductory astronomy. For light (which has no medium), every crest reaching the observer has the same spacing $\lambda_{\rm obs}$, set by the source velocity at emission. Getting the diagram right is a deliberate pedagogical choice.

**Animation**: wavefronts scroll from source toward observer at a steady rate, all equally spaced at $\lambda_{\rm obs}$. The animation speed is constant (representing $c$); only the spacing changes.

#### B. Spectrum Comparator (Canvas) — lower stage

Two horizontal spectrum strips stacked vertically:

1. **Lab frame** (top strip): spectral lines at rest wavelengths, labeled with transition names (e.g. "H$\alpha$ 656.3 nm"). Background shows the visible rainbow from ~380–750 nm. Lines outside visible range are shown in a grey extension on either side with "UV" / "IR" labels.

2. **Observed frame** (bottom strip): same lines shifted by the current velocity. Each line's horizontal position moves according to the Doppler formula.

3. **Connector lines**: thin vertical dashed lines connecting corresponding lab and observed lines, making the shift visually obvious.

4. **Shift indicator**: a small arrow and "$\Delta\lambda$" label between the lab and observed position of the most prominent line.

Domain: 80–2200 nm (same as spectral-lines demo), with the visible region (380–750 nm) highlighted.

**Zoom & center controls**: Two buttons below the comparator:
- **Zoom to visible**: narrows the domain to 300–900 nm so subtle shifts at low velocities are visible
- **Center on lines**: auto-pans to center on the shifted line cluster, useful when lines have shifted far into UV or IR

**Line density management**: For elements with many lines (especially Fe), only display the **strongest 8 lines** by default. A "Show all lines" toggle reveals the full catalog. This prevents visual clutter while preserving the option for detailed analysis.

---

## 3) Controls

### Dual velocity / redshift input

Two coupled sliders that stay synchronized via the Doppler formula:

**Velocity slider (primary for low speeds)**:
- Range: $-100{,}000$ to $+100{,}000$ km/s (approximately $-0.33c$ to $+0.33c$)
- Default: 0 km/s
- Step: 10 km/s (fine) or preset jumps
- Negative = approaching (blueshift), positive = receding (redshift)
- Label shows sign and direction: e.g. "$-300$ km/s (approaching)"

**Redshift $z$ slider (for high speeds)**:
- Range: $-0.8$ to $+10$
- Default: 0
- Step: 0.001 (fine) for $|z| < 0.5$; 0.01 for $0.5 \leq |z| < 3$; 0.1 for $|z| \geq 3$ (piecewise for usability)
- Coupled: moving the $z$ slider updates the velocity readout (relativistic formula), and vice versa
- When $|v| > 100{,}000$ km/s (beyond the velocity slider range), the velocity slider pins to its max and a "$z$-slider active" indicator appears
- Negative $z$ = blueshift, positive $z$ = redshift

When a preset sets a value beyond the velocity slider range, the $z$ slider takes over and the velocity slider shows a "clamped" state.

### Element selector
- Chips: H, He, Na, Ca, Fe (reuse `SpectralLineModel.availableElements()` catalog)
- Default: H (hydrogen)
- Determines which spectral lines appear on both strips
- For Fe: defaults to showing 8 strongest lines; "Show all" toggle reveals full set

### Formula toggle
- Two-state: "Non-relativistic" (default) / "Relativistic"
- Non-rel: $\lambda_{\rm obs} = \lambda_0 (1 + v_r / c)$
- Relativistic: $\lambda_{\rm obs} = \lambda_0 \sqrt{(1 + \beta) / (1 - \beta)}$, where $\beta = v/c$
- When relativistic is selected, show comparison readouts (non-rel vs rel values) plus a **divergence percentage** so students can directly see the error of the non-relativistic approximation

### Presets (pedagogically chosen)

| # | Name | Value | Notes |
|---|------|-------|-------|
| 1 | "At rest" | $v = 0$ km/s | Baseline reference |
| 2 | "Vega" | $v = -20.6$ km/s | Familiar bright star, slight blueshift (SIMBAD: Gontcharov 2006) |
| 3 | "Barnard's Star" | $v = -110$ km/s | Fastest radial velocity among nearby stars, approaching |
| 4 | "Andromeda (M31)" | $v = -301$ km/s | Approaching galaxy, collision course |
| 5 | "Typical galaxy cluster" | $v = +1{,}000$ km/s | Moderate Hubble-flow recession |
| 6 | "Coma Cluster" | $v = +6{,}925$ km/s | Classic cluster, mildly relativistic threshold |
| 7 | "Quasar 3C 273" | $z = 0.158$ | First identified quasar; $v$ computed by model ($\approx 43{,}700$ km/s rel) |
| 8 | "High-$z$ galaxy" | $z = 2.0$ | Where non-relativistic formula fails dramatically; $v$ via $z$-slider |

Presets 1–6 set the velocity slider directly. Presets 7–8 set the $z$ slider (the velocity slider clamps to max, and the velocity readout shows the model-computed value).

### Direction indicator
- Visual label below the velocity slider: "BLUESHIFT $\longleftarrow$" or "$\longrightarrow$ REDSHIFT" with color-coded text (blue/red)
- Changes dynamically with slider position

---

## 4) Readouts

| Label | ID | Value | Unit |
|-------|-----|-------|------|
| Radial velocity | `vrValue` | Signed number | km/s |
| Redshift | `zValue` | Signed, 6 digits | (dimensionless) |
| Observed wavelength | `lambdaObsValue` | For selected prominent line | nm |
| Wavelength shift | `deltaLambdaValue` | $\lambda_{\rm obs} - \lambda_0$ | nm |
| Observed frequency | `nuObsValue` | $c / \lambda_{\rm obs}$ | THz |
| Frequency shift | `deltaNuValue` | $\nu_{\rm obs} - \nu_0$ | THz |
| Regime | `regimeValue` | Classification text + divergence % | — |

### Regime classification

The "Regime" readout displays a label plus the actual non-rel vs. rel divergence:

| Condition | Label | Typical divergence |
|-----------|-------|-------------------|
| $\|v\| < 0.02c$ (~6,000 km/s) | "Non-relativistic" | < 1% |
| $0.02c \leq \|v\| < 0.1c$ | "Mildly relativistic" | 1–5% |
| $\|v\| \geq 0.1c$ | "Relativistic" | > 5% |

**Always** show the computed divergence percentage: e.g. "Mildly relativistic (NR error: 2.3%)". This is calculated as $|z_{\rm rel} - z_{\rm nonrel}| / |z_{\rm rel}| \times 100\%$.

### Relativistic comparison mode

When the formula toggle is "Relativistic", show additional comparison readouts:

| Label | Value |
|-------|-------|
| Non-rel $\lambda_{\rm obs}$ | $\lambda_0 (1 + v/c)$ |
| Relativistic $\lambda_{\rm obs}$ | $\lambda_0 \sqrt{(1+\beta)/(1-\beta)}$ |
| Divergence | $\|(\text{rel} - \text{nonrel}) / \text{rel}\| \times 100\%$ |

---

## 5) Physics Model — `DopplerShiftModel`

### Constants

```
C_KM_S = 299792.458          // speed of light (km/s), exact
C_M_S  = 299792458           // speed of light (m/s), exact
```

### Core functions

```typescript
/** Shift a rest wavelength by a radial velocity. */
shiftedWavelengthNm(args: {
  lambdaRestNm: number;
  velocityKmS: number;
  relativistic?: boolean;  // default: false
}): number;

/** Shift a rest frequency by a radial velocity. */
shiftedFrequencyTHz(args: {
  nuRestTHz: number;
  velocityKmS: number;
  relativistic?: boolean;
}): number;

/** Convert wavelength (nm) to frequency (THz). */
wavelengthNmToFrequencyTHz(lambdaNm: number): number;
// nu_THz = c / (lambda_nm * 1e-9) / 1e12 = 299792.458 / lambda_nm

/** Convert frequency (THz) to wavelength (nm). */
frequencyTHzToWavelengthNm(nuTHz: number): number;
// lambda_nm = 299792.458 / nu_THz  (using c in nm·THz units)

/** Compute redshift from rest and observed wavelengths. */
redshift(args: {
  lambdaRestNm: number;
  lambdaObsNm: number;
}): number;

/** Compute redshift directly from velocity. */
redshiftFromVelocity(args: {
  velocityKmS: number;
  relativistic?: boolean;
}): number;

/** Recover velocity from a known redshift. */
velocityFromRedshift(args: {
  z: number;
  relativistic?: boolean;
}): number;

/** Shift an entire array of lines. */
shiftLines(args: {
  lines: Array<{ wavelengthNm: number; label: string }>;
  velocityKmS: number;
  relativistic?: boolean;
}): Array<{
  wavelengthNm: number;
  shiftedNm: number;
  shiftedFrequencyTHz: number;
  label: string;
  deltaLambdaNm: number;
  deltaFrequencyTHz: number;
  z: number;
}>;

/** Classify the velocity regime. */
regime(velocityKmS: number): {
  label: "non-relativistic" | "mildly-relativistic" | "relativistic";
  divergencePercent: number;  // |z_rel - z_nonrel| / |z_rel| × 100
};

/** Beta factor: v / c. */
beta(velocityKmS: number): number;

/** Compute the divergence between non-rel and rel formulas at a given velocity. */
formulaDivergencePercent(velocityKmS: number): number;
```

### Formulas

**Non-relativistic** (first-order Doppler):

$$\lambda_{\rm obs} = \lambda_0 \left(1 + \frac{v_r}{c}\right)$$

$$\nu_{\rm obs} = \frac{\nu_0}{1 + v_r / c}$$

$$z = \frac{v_r}{c}$$

Note the **asymmetry**: the wavelength formula has $(1 + v/c)$ in the numerator, while the frequency formula has $(1 + v/c)$ in the denominator. This means $\Delta\lambda / \lambda_0 = v/c$ but $\Delta\nu / \nu_0 = -v/c \,/\, (1 + v/c) \neq -v/c$ exactly. Both give the same $z$ to first order, but the frequency shift is not simply the negative of the wavelength shift at finite $v$. This asymmetry is pedagogically interesting and worth highlighting.

**Relativistic** (full special-relativistic Doppler):

$$\lambda_{\rm obs} = \lambda_0 \sqrt{\frac{1 + \beta}{1 - \beta}}$$

$$\nu_{\rm obs} = \nu_0 \sqrt{\frac{1 - \beta}{1 + \beta}}$$

$$z = \sqrt{\frac{1 + \beta}{1 - \beta}} - 1$$

where $\beta = v_r / c$, with sign convention: positive $v$ = receding.

The relativistic formulas are symmetric: the $\lambda$ factor is the reciprocal of the $\nu$ factor, which is an elegant consequence of special relativity.

**Inverse** (velocity from $z$):

$$\text{Non-relativistic: } v = z \cdot c$$

$$\text{Relativistic: } \beta = \frac{(1 + z)^2 - 1}{(1 + z)^2 + 1}, \quad v = \beta \cdot c$$

### Test benchmarks

All benchmarks use vacuum wavelengths for consistency with `SpectralLineModel` (which computes from the Bohr formula / NIST vacuum values).

| # | Test case | Input | Expected | Source |
|---|-----------|-------|----------|--------|
| 1 | H$\alpha$ at rest | $\lambda_0 = 656.281$ nm, $v = 0$ | $\lambda_{\rm obs} = 656.281$ nm | Definition |
| 2 | H$\alpha$ receding 300 km/s (non-rel) | $\lambda_0 = 656.281$ nm, $v = +300$ | $\lambda_{\rm obs} \approx 656.938$ nm | $\Delta\lambda = 656.281 \times 300/299792.458 \approx 0.657$ nm |
| 3 | H$\alpha$ approaching 300 km/s | $\lambda_0 = 656.281$ nm, $v = -300$ | $\lambda_{\rm obs} \approx 655.625$ nm | |
| 4 | Frequency conversion | $\lambda = 656.281$ nm | $\nu \approx 456.805$ THz | $\nu = c/\lambda$ |
| 5 | Frequency shift (non-rel, +300 km/s) | $\nu_0 \approx 456.805$ THz, $v = +300$ | $\nu_{\rm obs} \approx 456.348$ THz | $\nu_0 / (1 + v/c)$ |
| 6 | Quasar $z = 0.158$ non-rel | $z = 0.158$ | $v \approx 47{,}367$ km/s | $v = zc$ |
| 7 | Quasar $z = 0.158$ relativistic | $z = 0.158$ | $v \approx 43{,}665$ km/s | exact formula |
| 8 | High $z = 2$ relativistic | $z = 2$ | $\beta = 0.8$, $v \approx 239{,}834$ km/s | exact |
| 9 | $z = 0$ identity | $v = 0$ | $z = 0$, $\lambda_{\rm obs} = \lambda_0$ | Sanity |
| 10 | Divergence at $0.02c$ | $v = 5{,}996$ km/s | divergence $\approx 1.0\%$ | Threshold check |
| 11 | Divergence at $0.1c$ | $v = 29{,}979$ km/s | divergence $\approx 5.25\%$ | $z_{\rm nr}=0.1$, $z_{\rm rel}\approx 0.1055$ |
| 12 | Negative velocity | $v = -1000$ | $z < 0$, $\lambda_{\rm obs} < \lambda_0$, $\nu_{\rm obs} > \nu_0$ | Sign convention |
| 13 | Speed of light limit | $v \to 299{,}792$ km/s | rel: $z \to \infty$ | Physical limit |
| 14 | Frequency–wavelength round-trip | $\lambda \to \nu \to \lambda$ | $\lambda_{\rm out} = \lambda_{\rm in}$ | Consistency |

### Wavelength convention

This demo uses **vacuum wavelengths** throughout. The `SpectralLineModel` computes from the Bohr formula / quantum transition energies, which naturally yield vacuum wavelengths. Some textbooks quote air wavelengths (e.g. H$\alpha$ = 656.2852 nm in air vs. ~656.46 nm in vacuum from NIST). We use whatever `SpectralLineModel.elementLines('H')` returns for H$\alpha$ and label it clearly.

If students compare to air-wavelength references, the Understand panel notes: "This demo uses vacuum wavelengths. Air wavelengths differ by ~0.03% due to the refractive index of air."

### Dependencies

- `SpectralLineModel.elementLines()` for line catalogs
- `AstroConstants.PHOTON.C_CM_PER_S` (converted to km/s) or define `C_KM_S` locally
- No dependency on `TwoBodyAnalytic` (that connection happens in the binary-orbits extension)

---

## 6) SVG Wave Diagram — Rendering Specification

### Canvas: 800 × 250 viewBox

**Source (left-of-center)**:
- Circle at $x = 200$, $r = 12$, fill `var(--cp-celestial-star-core)`, glow `var(--cp-glow-star)`
- Labeled "Source" below

**Observer (right)**:
- Telescope/eye icon at $x = 700$
- Labeled "Observer" below

**Observed wave (between source and observer)**:
- Draw a sinusoidal wave from source to observer
- **All crests are uniformly spaced** at a distance proportional to $\lambda_{\rm obs}$
- Draw ~8–12 crests (adjust count to fill the space at the current $\lambda_{\rm obs}$)
- Wave line stroke color: `wavelengthToRgb(`$\lambda_{\rm obs}$`)` for the selected element
- Stroke width: 2 px
- Amplitude: ~20 px

**Reference ghost wave (overlaid)**:
- A faint dashed sinusoid at $\lambda_0$ spacing (the rest wavelength)
- Stroke: `var(--cp-instr-panel-border)` at 30% opacity, dashed (4 px dash, 4 px gap)
- Amplitude: ~15 px (slightly smaller to avoid visual clutter)
- When $v = 0$, the observed and ghost waves overlap exactly
- When $v \neq 0$, the beat pattern between observed and ghost waves makes the shift tangible

**Wavelength annotations**:
- A horizontal bracket between two crests of the observed wave near the observer, labeled "$\lambda_{\rm obs} =$ XXX nm"
- A matching bracket on the ghost wave labeled "$\lambda_0 =$ XXX nm" (shown only when $v \neq 0$)

**Direction arrow**: small arrow above the source showing the velocity direction (left for approaching, right for receding). Labeled with $v_r$ value.

**Animation**: wavefronts scroll from source toward observer at a steady rate. The crests move at constant speed (representing $c$) and are uniformly spaced at $\lambda_{\rm obs}$. When the velocity changes, all crests smoothly transition to the new spacing simultaneously (because in the steady state, the source has been emitting at the new rate long enough for all visible crests to reflect it).

### "Sound vs. Light" misconception callout (below the diagram)

A small togglable inset (collapsed by default, labeled "Why don't the waves bunch up near the source?"):

When expanded, shows two side-by-side mini-diagrams:
1. **Sound (in a medium)**: circular ripples from a moving source, compressed ahead, stretched behind. Caption: "Sound waves travel through air. The medium carries the crests, so spacing varies with position."
2. **Light (no medium)**: uniform parallel crests. Caption: "Light needs no medium. Each crest travels at $c$ regardless of the source's motion. The spacing is set at emission and stays constant."

This directly addresses the most common Doppler misconception. The mini-diagrams use `--cp-instr-panel-bg` background and are purely static SVGs.

### Accessibility
- `aria-label="Wave diagram showing Doppler shift of light"` on SVG
- Source and observer labeled for screen readers
- Live region: "Observed wavelength: X nm. Shift: Y nm toward [blue/red]. Crests are [closer together / farther apart / at rest spacing]."

---

## 7) Spectrum Comparator — Rendering Specification

### Canvas element: full width, aspect ratio 16:3

**Background**: visible rainbow gradient (380–750 nm) occupying the central portion; UV region (<380 nm) in a grey-violet wash on the left; IR region (>750 nm) in a grey-red wash on the right.

**Lab frame strip (top half)**:
- Vertical lines at each element's rest wavelengths
- Line color: `wavelengthToRgbString(`$\lambda$`)` from spectral-lines logic (or white for UV/IR)
- Label above each line: transition name and rest wavelength

**Observed frame strip (bottom half)**:
- Identical lines but shifted by the current velocity
- Same color logic applied to shifted wavelengths
- Lines that shift outside the 80–2200 nm domain are clipped with a "shifted off-scale" indicator

**Connectors**:
- Thin dashed lines connecting each lab line to its shifted counterpart
- Color: muted white with 40% opacity

**Shift annotation**:
- On the strongest visible line (typically H$\alpha$ for hydrogen): a horizontal arrow between lab and observed positions, labeled with $\Delta\lambda$ in nm and $\Delta\nu$ in THz

### Zoom and pan

- **Default view**: full domain (80–2200 nm)
- **"Zoom to visible" button**: narrows to 300–900 nm, useful at low velocities where shifts are small
- **"Center on lines" button**: auto-pans so the shifted line cluster is centered in view
- **Mouse wheel / pinch**: zoom in/out around cursor position (optional enhancement)
- Current view range shown as subtle axis labels at the bottom edge

### Line density management

| Element | Typical line count | Default display | "Show all" count |
|---------|--------------------|-----------------|-------------------|
| H | 4 (Balmer series visible) | All | All |
| He | 6 | All | All |
| Na | 2 (D lines) | All | All |
| Ca | 5 | All | All |
| Fe | 30+ visible | Strongest 8 | Full catalog |

Toggle button: "Show all N lines" / "Show strongest 8" (only appears for Fe or any element with > 10 visible lines).

---

## 8) Understand Panel (Drawer)

### Equations (KaTeX)

**Card 1: Non-relativistic Doppler (wavelength)**
```latex
\lambda_{\rm obs} = \lambda_0 \left(1 + \frac{v_r}{c}\right)
```
Caption: Valid when $v_r \ll c$. Positive $v_r$ = receding = redshift.

**Card 2: Non-relativistic Doppler (frequency)**
```latex
\nu_{\rm obs} = \frac{\nu_0}{1 + v_r / c}
```
Caption: Note the asymmetry: wavelength has $(1 + v/c)$ as a multiplier, but frequency has it as a divisor. Both give the same $z$ to first order, but $\Delta\nu / \nu_0 \neq -\Delta\lambda / \lambda_0$ exactly.

**Card 3: Redshift definition**
```latex
z = \frac{\lambda_{\rm obs} - \lambda_0}{\lambda_0} = \frac{\Delta\lambda}{\lambda_0}
```
Caption: Dimensionless measure of the fractional wavelength change. Same $z$ whether computed from wavelength or frequency: $z = \nu_0 / \nu_{\rm obs} - 1$.

**Card 4: Relativistic Doppler**
```latex
\lambda_{\rm obs} = \lambda_0 \sqrt{\frac{1 + \beta}{1 - \beta}}, \quad \nu_{\rm obs} = \nu_0 \sqrt{\frac{1 - \beta}{1 + \beta}}, \quad \beta = \frac{v_r}{c}
```
Caption: Required when $v_r$ is a significant fraction of $c$. The $\lambda$ and $\nu$ factors are exact reciprocals — an elegant consequence of special relativity that the non-relativistic formulas only approximate.

**Card 5: Velocity from redshift (relativistic)**
```latex
\beta = \frac{(1+z)^2 - 1}{(1+z)^2 + 1}
```
Caption: Exact inverse of the relativistic Doppler formula.

**Card 6: Formula comparison mini-plot**

A small static or semi-interactive plot showing $z_{\rm nonrel}$ (= $\beta$) vs. $z_{\rm rel}$ (= $\sqrt{(1+\beta)/(1-\beta)} - 1$) as functions of $\beta$ from 0 to 0.5. The curves overlap at low $\beta$ and diverge visibly around $\beta \approx 0.05$–$0.1$. Annotated with:
- "< 1% difference" zone ($\beta < 0.02$)
- "1–5% difference" zone ($0.02 < \beta < 0.1$)
- "> 5% difference" zone ($\beta > 0.1$)

This makes the Explain prompt (finding the 5% divergence point) visually concrete.

### Model notes

- Uses special-relativistic Doppler only. **Cosmological redshift** (expansion of space stretching the wavelength of photons in flight) is a distinct physical mechanism and is NOT the same as the kinematic Doppler shift modeled here. However, at low $z$ ($z \lesssim 0.1$), the two are observationally indistinguishable — they agree to first order, which is why Hubble's original law $v = H_0 d$ works as a useful approximation. A future demo will address cosmological expansion.
- Gravitational redshift (from strong gravity) is a general-relativistic effect and is not included here.
- Sign convention follows the astronomical standard: positive velocity = receding from observer.
- Speed of light: $c = 299{,}792.458$ km/s (exact by definition).
- This demo uses **vacuum wavelengths**. Textbooks sometimes quote air wavelengths (shorter by ~0.03% at optical wavelengths due to the refractive index of air $n \approx 1.000293$). If values look slightly different from a textbook, this is likely the reason.

### Sound vs. Light callout (also accessible from wave diagram)

**"Isn't this like a siren passing by?"**

Yes and no. Sound waves and light waves both exhibit Doppler shifts, but the mechanisms differ:

- **Sound** travels through a medium (air). A moving source physically compresses the air ahead and rarefies it behind. The wavelength genuinely varies with position between source and observer.
- **Light** needs no medium. Each photon departs the source at speed $c$, and the wavelength is determined solely by the source's velocity at the moment of emission. All crests arriving at the observer have the same spacing — there is no "compressed ahead, stretched behind" pattern in space.

The math is the same to first order ($\Delta\lambda / \lambda = v / c$), but the physical picture is fundamentally different. The wave diagram in this demo shows the correct picture for light: uniform crest spacing at $\lambda_{\rm obs}$.

---

## 9) Predict → Play → Explain

### Predict prompt
> The hydrogen H$\alpha$ line sits at 656.3 nm — deep red. A star is approaching you at 300 km/s. Will H$\alpha$ shift toward blue or toward red? Estimate how many nanometers it shifts. (Hint: $c \approx 300{,}000$ km/s, so 300 km/s is about $0.001c$.)

### Play steps
1. Set element to **Hydrogen** and velocity to **0 km/s**. Identify H$\alpha$ on the spectrum comparator. Note both its wavelength and frequency.
2. Slowly increase velocity to **$+300$ km/s** (receding). Watch H$\alpha$ shift rightward (redward). Note the wavelength shift AND the frequency shift — are they the same magnitude?
3. Now set velocity to **$-300$ km/s** (approaching). Watch H$\alpha$ shift leftward (blueward). Check: does the shift match your prediction?
4. Try the **"Quasar 3C 273"** preset ($z = 0.158$). Toggle between Non-relativistic and Relativistic formulas. Look at the divergence percentage — is it significant?
5. Try the **"High-$z$ galaxy"** preset ($z = 2$). Now the non-relativistic formula is seriously wrong. What does the divergence percentage show?
6. Open the "Why don't the waves bunch up near the source?" callout in the wave diagram. Compare the sound and light pictures. Can you explain in your own words why the wave crests are evenly spaced for light?

### Explain prompt
> At what velocity (as a fraction of $c$) does the non-relativistic formula give a wavelength shift that's wrong by more than 5%? Use the formula toggle and the divergence readout to find the threshold. Explain in one sentence *why* the simple formula breaks down at high speeds.

### Mystery spectrum challenge (optional enrichment)

> **Challenge mode**: The observer sees H$\alpha$ at 668.5 nm instead of its rest wavelength of 656.3 nm. Is the source approaching or receding? What is its velocity? What is its redshift $z$? Solve it both ways (non-relativistic and relativistic) and compare. (Hint: first compute $z = \Delta\lambda / \lambda_0$, then find $v$.)

This inverts the problem from "set $v$, see shift" to "see shift, find $v$" — closer to what astronomers actually do.

---

## 10) Station Mode

### Columns

| Key | Label |
|-----|-------|
| `case` | Case |
| `element` | Element |
| `lambdaRestNm` | $\lambda_0$ (nm) |
| `nuRestTHz` | $\nu_0$ (THz) |
| `velocityKmS` | $v_r$ (km/s) |
| `zNonRel` | $z$ (non-rel) |
| `zRel` | $z$ (relativistic) |
| `lambdaObsNonRel` | $\lambda_{\rm obs}$, non-rel (nm) |
| `lambdaObsRel` | $\lambda_{\rm obs}$, rel (nm) |
| `nuObsRel` | $\nu_{\rm obs}$, rel (THz) |
| `divergencePct` | NR error (%) |

### Comparison row set
Generate rows for each preset to build a complete velocity-scale reference table.

### Synthesis prompt
> Compare the non-relativistic and relativistic $z$ values across all presets. At what velocity scale does the divergence exceed 1%? What does this tell you about when astronomers need the full relativistic formula? Also: look at the frequency column — for the highest-velocity presets, is $\Delta\nu / \nu_0$ close to $\Delta\lambda / \lambda_0$? Why or why not?

---

## 11) Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Toggle help |
| `g` | Toggle station mode |
| `r` | Toggle relativistic formula |
| `[` / `]` | Decrease / increase velocity by 100 km/s |
| `{` / `}` | Decrease / increase velocity by 10,000 km/s |
| `z` / `Z` | Decrease / increase redshift $z$ by 0.1 |
| `1–8` | Activate preset 1–8 |

---

## 12) Accessibility

- All controls keyboard-navigable with `tabindex` ordering
- Live region announces velocity changes, regime transitions, and line positions
- Wave diagram SVG has descriptive `aria-label` with current state
- Spectrum comparator canvas has companion `aria-live` region describing which lines are visible and their shifts
- Respects `prefers-reduced-motion`: static wave diagram (no animation), instant line positions
- Minimum text size 14 px; readout values 16 px
- Dual slider: both sliders are labeled and screen-reader accessible; changes to one are reflected in the other's announced value
- Sound vs. Light callout content is accessible as expandable disclosure widget with proper `aria-expanded` state

---

## 13) Export Payload

```json
{
  "version": 1,
  "timestamp": "...",
  "parameters": [
    { "name": "Radial velocity (km/s)", "value": "..." },
    { "name": "Redshift z", "value": "..." },
    { "name": "Element", "value": "H" },
    { "name": "Formula", "value": "non-relativistic" }
  ],
  "readouts": [
    { "name": "Redshift z", "value": "..." },
    { "name": "Observed wavelength (nm)", "value": "..." },
    { "name": "Wavelength shift (nm)", "value": "..." },
    { "name": "Observed frequency (THz)", "value": "..." },
    { "name": "Frequency shift (THz)", "value": "..." },
    { "name": "Regime", "value": "mildly-relativistic" },
    { "name": "NR divergence (%)", "value": "..." }
  ],
  "notes": [
    "Non-relativistic: lambda_obs = lambda_0 (1 + v/c), nu_obs = nu_0 / (1 + v/c).",
    "Relativistic: lambda_obs = lambda_0 sqrt((1+beta)/(1-beta)), nu_obs = nu_0 sqrt((1-beta)/(1+beta)).",
    "Sign convention: positive velocity = receding = redshift.",
    "Vacuum wavelengths used throughout."
  ]
}
```
