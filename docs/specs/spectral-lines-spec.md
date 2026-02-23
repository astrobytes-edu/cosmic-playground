# Spectral Lines & the Bohr Atom — Demo Spec

**Status:** Draft
**Date:** 2026-02-22
**Owner:** Cosmic Playground
**Slug:** `spectral-lines`
**Category:** Light & Spectra

---

## 1) Purpose & Positioning

`spectral-lines` is the Cosmic Playground instrument for **atomic spectral lines, the Bohr model of hydrogen, and photon emission/absorption**.

It answers the foundational question: *Why do atoms produce light at only specific wavelengths, and how do astronomers use this to identify elements across the universe?*

### Primary pedagogical goals

- Build intuition for **quantized energy levels** — the electron can only occupy discrete orbits
- Connect the **Bohr atom** (spatial picture) ↔ **energy-level diagram** (abstract ladder) ↔ **spectrum strip** (observable output) as three synchronized representations of the same physics
- Demonstrate **emission** (electron drops, photon exits) and **absorption** (photon arrives with correct energy, electron jumps up) as complementary processes
- Show that each element has a unique **spectral fingerprint**, enabling remote identification of composition
- Introduce the **Balmer, Lyman, Paschen, and Brackett** series as organized families of transitions

### Audience

- **ASTR 101**: Hydrogen tab — Bohr atom + emission/absorption + series identification
- **ASTR 201**: Multi-element tab — pattern matching, temperature-dependent line strengths (Boltzmann population preview)

### Relationship to other demos

| Demo | Relationship |
|------|-------------|
| `blackbody-radiation` | Continuum (thermal) spectrum — `spectral-lines` adds the *discrete* component on top |
| `em-spectrum` | Wavelength ↔ frequency ↔ energy conversions — `spectral-lines` uses these relationships but grounds them in atomic transitions |
| `doppler-shift` (planned) | Shifts the line positions — depends on the line catalog established here |
| `spectral-lab` (planned) | Synthesis capstone: continuum + lines + Doppler — consumes both `blackbody-radiation` and `spectral-lines` physics |

### Out of scope for this demo

- Full quantum mechanical treatment (angular momentum, orbital shapes, spin-orbit coupling)
- Continuous (free-free, bound-free) emission processes
- Zeeman/Stark splitting
- Radiative transfer or optical depth
- Molecular spectroscopy

---

## 2) Physics Contract

### 2.1 Hydrogen — The Bohr Model (exact)

The Bohr model gives **exact** energy levels for hydrogen-like atoms. This is not an approximation for hydrogen; the Bohr energies match the Schrödinger solution exactly (ignoring fine structure, which is ~10⁴× smaller than level spacing).

**Energy levels:**

$$
E_n = -\frac{13.6\ \text{eV}}{n^2}, \quad n = 1, 2, 3, \ldots
$$

where 13.6 eV = 1 Rydberg = the ionization energy of hydrogen from the ground state.

**Transition energy:**

$$
\Delta E = E_{\text{upper}} - E_{\text{lower}} = 13.6\ \text{eV} \left( \frac{1}{n_{\text{lower}}^2} - \frac{1}{n_{\text{upper}}^2} \right)
$$

Note: $\Delta E > 0$ because $n_{\text{upper}} > n_{\text{lower}}$, so the second term is smaller than the first.

**Transition wavelength:**

$$
\lambda = \frac{hc}{\Delta E}
$$

where $hc = 1240\ \text{eV·nm}$ (exact to 4 significant figures for teaching use).

Or equivalently, via the Rydberg formula:

$$
\frac{1}{\lambda} = R_\infty \left( \frac{1}{n_{\text{lower}}^2} - \frac{1}{n_{\text{upper}}^2} \right)
$$

where $R_\infty = 1.0974 \times 10^7\ \text{m}^{-1}$ is the Rydberg constant.

**Bohr orbit radii (for visualization):**

$$
r_n = n^2\, a_0, \quad a_0 = 0.0529\ \text{nm}
$$

The visualization should use a **compressed** radial scale (e.g., $r_{\text{display}} \propto n^{1.2}$ or similar) so that $n = 1$ through $n = 6$ are all clearly visible. This must be labeled "Not to scale" and documented in model notes.

**Series classification:**

| Series | $n_{\text{lower}}$ | Spectral region | Key lines |
|--------|-------------------|-----------------|-----------|
| Lyman | 1 | UV (91.2–121.6 nm) | Ly$\alpha$ 121.6 nm |
| Balmer | 2 | Visible + near-UV (364.6–656.3 nm) | H$\alpha$ 656.3, H$\beta$ 486.1, H$\gamma$ 434.0, H$\delta$ 410.2 nm |
| Paschen | 3 | Near-IR (820.4–1875 nm) | Pa$\alpha$ 1875, Pa$\beta$ 1282 nm |
| Brackett | 4 | IR (1458–4051 nm) | Br$\alpha$ 4051, Br$\gamma$ 2166 nm |

### 2.2 Multi-Element Line Data (empirical)

For elements beyond hydrogen, the demo stores **empirical wavelength tables** (not computed from first principles, since multi-electron atoms require quantum mechanics beyond Bohr). Each element entry contains:

- Element symbol and name
- Array of prominent line wavelengths (nm, vacuum)
- Relative intensities (normalized, 0–1)
- Electron configuration note (for model transparency)

**Included elements (v1):**

| Element | Key lines (nm, approximate) | Context |
|---------|----------------------------|---------|
| H (hydrogen) | 656.3, 486.1, 434.0, 410.2, 397.0, 121.6 | Balmer + Ly$\alpha$ — computed from Bohr model |
| He (helium) | 587.6, 501.6, 471.3, 447.1, 388.9, 667.8 | Second most abundant; He I lines in stellar spectra |
| Na (sodium) | 589.0, 589.6 (D doublet), 568.8, 330.2 | Classic flame test element; streetlight orange |
| Ca (calcium) | 393.4 (K), 396.8 (H), 422.7, 527.0, 612.2 | Strongest absorption lines in solar spectrum (Ca II H & K) |
| Fe (iron) | 438.4, 440.5, 466.8, 489.1, 495.8, 516.7, 527.0, 532.8 | Forest of lines; dominant in cool star spectra |

**Data source note:** Line wavelengths are taken from the NIST Atomic Spectra Database. The demo uses vacuum wavelengths throughout (air-vacuum correction is < 0.3 nm in the visible and not pedagogically relevant at this level).

### 2.3 Physics Accuracy Commitments

| Aspect | Treatment | Justification |
|--------|-----------|---------------|
| H energy levels | Exact Bohr formula | Matches Schrödinger exactly (no fine structure needed at this level) |
| H wavelengths | Computed from $E_n$ | Not hardcoded — students see the formula at work |
| Multi-element lines | Empirical NIST data | Multi-electron QM is out of scope; honesty > false precision |
| Line widths | Fixed Gaussian σ for display | Real line broadening (thermal, pressure, natural) is out of scope |
| Relative intensities | Qualitative (empirical table) | Oscillator strengths / Einstein A-coefficients are ASTR 201+ |
| Bohr orbit radii | Compressed display scale | True $n^2$ scaling makes high $n$ orbits invisible; labeled "not to scale" |

### 2.4 Units Policy

- Internal wavelengths: **nm** (this is a visible-band-focused demo; no CGS cm conversion needed in the model, but the model should accept/return nm and provide cm convenience methods for interop with `PhotonModel`)
- Photon energies: **eV** (natural scale for atomic transitions)
- Frequencies: **Hz** (via `PhotonModel` conversions when displayed)
- Temperature (Boltzmann mode): **K**

---

## 3) Public Physics API

### Module: `packages/physics/src/spectralLineModel.ts`

```typescript
export const SpectralLineModel = {

  // ── Hydrogen (Bohr model, exact) ──────────────────────────

  /**
   * Energy of the nth level (eV). Returns negative values (bound state).
   * E_n = -13.6 eV / n^2
   */
  hydrogenEnergyEv(args: { n: number }): number;

  /**
   * Transition energy (eV) for n_upper → n_lower.
   * Returns positive value (energy of emitted/absorbed photon).
   * ΔE = 13.6 eV × (1/n_lower² − 1/n_upper²)
   */
  transitionEnergyEv(args: { nUpper: number; nLower: number }): number;

  /**
   * Transition wavelength (nm) for n_upper → n_lower.
   * λ = hc / ΔE
   */
  transitionWavelengthNm(args: { nUpper: number; nLower: number }): number;

  /**
   * Transition frequency (Hz) for n_upper → n_lower.
   */
  transitionFrequencyHz(args: { nUpper: number; nLower: number }): number;

  /**
   * Bohr orbit radius for level n (nm).
   * r_n = n² × a₀, where a₀ = 0.05292 nm
   */
  bohrRadiusNm(args: { n: number }): number;

  /**
   * Classify a transition into its series name.
   * Returns "Lyman" | "Balmer" | "Paschen" | "Brackett" | "Pfund" | "Humphreys" | "n_lower={n}"
   */
  seriesName(args: { nLower: number }): string;

  /**
   * Series limit wavelength (nm) — the shortest wavelength in the series.
   * λ_limit = hc / (13.6 eV / n_lower²)
   */
  seriesLimitNm(args: { nLower: number }): number;

  /**
   * Generate all transitions for a given series up to n_max.
   * Returns array of { nUpper, nLower, wavelengthNm, energyEv, seriesName }.
   */
  seriesTransitions(args: { nLower: number; nMax?: number }): TransitionRecord[];

  /**
   * Generate all hydrogen transitions for n_lower=1..maxSeries, n_upper up to nMax.
   * Useful for building the full emission spectrum.
   */
  allHydrogenTransitions(args: { nMax?: number; maxSeries?: number }): TransitionRecord[];

  /**
   * Boltzmann population ratio N_n / N_1 at temperature T.
   * N_n / N_1 = (g_n / g_1) × exp(−(E_n − E_1) / (k_B T))
   * where g_n = 2n² is the degeneracy.
   * Returns the relative population of level n compared to ground state.
   */
  boltzmannPopulationRatio(args: { n: number; temperatureK: number }): number;

  // ── Multi-element (empirical) ─────────────────────────────

  /**
   * List of available element keys.
   */
  availableElements(): string[];

  /**
   * Get the line catalog for a given element.
   * Returns { symbol, name, lines: Array<{ wavelengthNm, relativeIntensity, label? }> }
   */
  elementLines(args: { element: string }): ElementLineData;

} as const;

// ── Types ──────────────────────────────────────────────────

export interface TransitionRecord {
  nUpper: number;
  nLower: number;
  wavelengthNm: number;
  energyEv: number;
  frequencyHz: number;
  seriesName: string;
}

export interface ElementLineData {
  symbol: string;
  name: string;
  lines: Array<{
    wavelengthNm: number;
    relativeIntensity: number;
    label?: string;  // e.g., "Hα", "Ca K", "Na D₁"
  }>;
}
```

### Constants (in model file)

```typescript
const BOHR = {
  /** Rydberg energy (eV) — ionization energy of hydrogen from n=1 */
  RYDBERG_EV: 13.605693,     // NIST CODATA 2018 (1 Ry = 13.605 693 122 994 eV)
  /** Bohr radius a₀ (nm) */
  A0_NM: 0.052918,           // NIST CODATA 2018 (a₀ = 0.529 177 210 903 × 10⁻¹ nm)
  /** hc product (eV·nm) for λ = hc/E conversions */
  HC_EV_NM: 1239.842,        // derived from CODATA 2018 h, c
  /** Boltzmann constant (eV/K) */
  KB_EV_PER_K: 8.617333e-5,  // NIST CODATA 2018
} as const;
```

### Test requirements (`spectralLineModel.test.ts`)

Following the model contract, tests must include:

**Benchmark tests:**
- H$\alpha$ (n=3→2): λ = 656.3 nm ± 0.1 nm
- Ly$\alpha$ (n=2→1): λ = 121.6 nm ± 0.1 nm
- Balmer limit (n=∞→2): λ = 364.6 nm ± 0.2 nm
- E₁ = −13.6 eV ± 0.01 eV
- Bohr radius a₀ = 0.0529 nm ± 0.0001 nm

**Limiting-case tests:**
- `hydrogenEnergyEv({ n: Infinity })` → 0 (ionization limit)
- `transitionEnergyEv({ nUpper: very large, nLower: 1 })` → approaches 13.6 eV
- `boltzmannPopulationRatio({ n: 2, temperatureK: 0 })` → 0 (all atoms in ground state at T=0)

**Sanity invariant tests:**
- Transition wavelengths are always positive
- Higher series transitions yield longer wavelengths: λ(Paschen) > λ(Balmer) > λ(Lyman) for the same Δn
- Series limit wavelength < all transition wavelengths in that series
- `transitionEnergyEv` + `transitionWavelengthNm` are self-consistent via hc
- All element line catalogs have wavelengthNm > 0 and 0 ≤ relativeIntensity ≤ 1
- Boltzmann ratios decrease monotonically with n at any finite T

**Monotonicity tests:**
- E_n is strictly increasing (less negative) with n
- λ within a series is strictly decreasing with increasing n_upper
- Boltzmann ratio for n=2 increases with T

---

## 4) UI/UX Contract

### 4.1 Layout

The demo uses the standard Cosmic Playground instrument shell with **two primary tabs** on the main stage:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ASIDE (Controls)              │  MAIN STAGE                        │
│                                │                                    │
│  [Hydrogen] [Elements]  tabs   │  Tabs: [Explore] [Understand]      │
│                                │                                    │
│  ── Hydrogen tab ──            │  ┌────────────────────────────────┐ │
│  Mode: (●Emission ○Absorption) │  │                                │ │
│                                │  │     BOHR ATOM (SVG)            │ │
│  Upper level n  [2━━━●━━━━6]   │  │   Concentric orbits n=1..6    │ │
│  Lower level n  [1━━●━━━━━5]   │  │   Electron dot (animated)     │ │
│                                │  │   Photon arrow (animated)      │ │
│  Series filter:                │  │   Nucleus at center            │ │
│  [All][Lyman][Balmer]          │  │                                │ │
│  [Paschen][Brackett]           │  │                                │ │
│                                │  │   "Not to scale" label         │ │
│  Presets:                      │  │                                │ │
│  [Hα][Hβ][Hγ][Lyα]            │  └────────────────────────────────┘ │
│                                │                                    │
│  ── Elements tab ──            │  ┌────────────────────────────────┐ │
│  Select: [H][He][Na][Ca][Fe]   │  │  ENERGY-LEVEL DIAGRAM (SVG)   │ │
│  □ Show H for comparison       │  │  Horizontal bars at E_n        │ │
│                                │  │  Transition arrow animated     │ │
│  ── Readouts ──                │  │  n labels + eV values          │ │
│  Transition: n=3 → n=2         │  └────────────────────────────────┘ │
│  λ: 656.3 nm                  │                                    │
│  E: 1.89 eV                   │  ┌────────────────────────────────┐ │
│  ν: 4.57×10¹⁴ Hz              │  │  SPECTRUM STRIP (Canvas)       │ │
│  Series: Balmer                │  │  Rainbow band 100–2000 nm      │ │
│                                │  │  Emission lines / absorption   │ │
│  [Utility toolbar]             │  │  dips overlaid                 │ │
│  [Status live region]          │  └────────────────────────────────┘ │
│                                │                                    │
├──────────────────────────────────────────────────────────────────────┤
│  DRAWER: [What to notice] [Model notes]                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Stage — Three Synchronized Visualizations

The core pedagogical innovation is that three views update simultaneously from the same physics state. When the student selects a transition (or clicks an orbit), all three respond:

#### (A) Bohr Atom View (top-left of stage, SVG)

**Static elements:**
- Central nucleus: small filled circle with glow (`--cp-celestial-sun-core` tokens)
- Concentric orbit rings for n = 1 through 6: dashed circles with progressive radii
  - Radii use compressed scale: $r_{\text{display}} = r_0 + k \cdot n^{1.3}$ (tuned so all 6 orbits are clearly distinguishable)
  - Each ring labeled with $n$ value
  - Color: `--cp-celestial-orbit` token, with the currently occupied orbit highlighted
- "Not to scale" text in bottom corner of SVG (`--cp-text3` muted color)

**Animated elements:**
- **Electron dot**: a small bright circle sitting on one orbit ring
  - In **emission mode**: starts at the upper orbit, animates smoothly inward to the lower orbit (easing: decelerate-in, ~600ms)
  - In **absorption mode**: starts at the lower orbit, animates outward to the upper orbit (easing: accelerate-out, ~600ms)
  - Glow: `--cp-glow-accent-teal` while stationary, brief `cp-value-flash` keyframe on arrival
- **Photon representation**: a small colored circle (colored to match λ) with a wavy trail
  - In **emission**: appears at the electron's starting position and flies outward radially, expanding and fading
  - In **absorption**: flies inward from outside the atom toward the electron, then disappears as the electron jumps
  - Color: mapped from the transition wavelength using `wavelengthToApproxRgb()` (from `blackbody-radiation` logic or shared utility)
  - UV/IR photons (outside visible range) rendered in false color: UV as violet with a dashed trail, IR as dark red with a dotted trail, each labeled "UV (invisible)" or "IR (invisible)"

**Interaction:**
- Clicking on an orbit ring directly selects it as the upper or lower level (depending on mode and current selection)
- Hovering an orbit ring shows a tooltip: "$n = 3$, $E_3 = -1.51$ eV"

#### (B) Energy-Level Diagram (top-right of stage, SVG)

**Static elements:**
- Vertical axis (energy in eV), with 0 at top and −13.6 eV at bottom
- Horizontal bars at each $E_n$ for n = 1 through 6, plus an "ionization" bar at 0 eV
- Each bar labeled: "$n = 3$" on the left, "$-1.51$ eV" on the right
- Bar spacing follows the $1/n^2$ progression (physical, not compressed — this diagram *is* to scale in energy)
- Bars use `--cp-accent-ice` color, with the occupied level in `--cp-accent-amber`

**Animated elements:**
- Downward arrow (emission) or upward arrow (absorption) between the two selected levels
- Arrow colored to match the photon wavelength
- A small photon icon ($\gamma$) at the arrow tip with the wavelength label
- Arrow draws on (animates stroke-dashoffset) synchronized with the electron animation in the Bohr view

**Key design note:** The energy-level diagram spacing is *physical* ($1/n^2$ scaling), while the Bohr atom radii are *compressed*. This is intentional — the energy diagram is the quantitative tool, the Bohr atom is the spatial intuition-builder. Both are labeled appropriately.

#### (C) Spectrum Strip (bottom of stage, Canvas)

**Static elements:**
- A horizontal wavelength axis (log or linear scale toggle, default linear for visible)
- Wavelength range: adjustable via series filter
  - "All" mode: 50–5000 nm (covers Lyman UV through Brackett IR)
  - "Balmer" filter: 350–700 nm (visible focus)
  - "Lyman" filter: 80–130 nm (UV)
  - etc.
- A rainbow gradient band (380–750 nm region) with non-visible regions shown as dark
- Wavelength tick marks and labels

**Dynamic elements — Emission mode:**
- Bright vertical lines at each transition wavelength in the currently selected series
- Line color: `wavelengthToApproxRgb(λ)` for visible; false-color for UV/IR
- Line height proportional to relative intensity (or equal height, with intensity toggle)
- The currently selected transition's line is highlighted (brighter, thicker) and labeled: "Hα 656.3 nm"
- As the student clicks through transitions, lines accumulate, building up the full series spectrum

**Dynamic elements — Absorption mode:**
- The rainbow band is shown as a continuous bright spectrum (representing the background continuum source)
- Dark vertical dips appear at each transition wavelength — the absorption lines
- The currently selected dip is highlighted and labeled

**Multi-element mode:**
- When on the "Elements" tab, the spectrum strip shows vertical lines for the selected element
- If "Show H for comparison" is checked, hydrogen Balmer lines are shown in a second row (offset) for reference
- Each element's lines use a consistent color tag in the legend

### 4.3 Controls — Hydrogen Tab

**Mode toggle (emission/absorption):**
- Radio-style chip group: `[Emission]` / `[Absorption]`
- Emission default

**Level selectors:**
- Two sliders (or discrete step buttons):
  - "Upper level $n$": range 2–8, step 1
  - "Lower level $n$": range 1–7, step 1
  - Constraint: $n_{\text{upper}} > n_{\text{lower}}$ always (UI enforces this — adjusting one auto-clamps the other)
- Display current values prominently: "$n = 3 \to n = 2$"

**Series filter chips:**
- `[All]` `[Lyman]` `[Balmer]` `[Paschen]` `[Brackett]`
- Selecting a series:
  - Filters the spectrum strip to show only that series' transitions
  - Auto-sets $n_{\text{lower}}$ to the series value (Balmer → $n_{\text{lower}} = 2$, etc.)
  - Adjusts the spectrum wavelength range to zoom into the relevant region
  - Shows all transitions as dim lines, with the currently selected one highlighted

**Preset chips:**
- Quick-jump to famous transitions: `[Hα]` `[Hβ]` `[Hγ]` `[Lyα]` `[Pa α]`
- Each sets $n_{\text{upper}}$, $n_{\text{lower}}$, and plays the transition animation

**Play transition button:**
- A small play button (▶) that re-triggers the animation for the current transition
- Useful for re-watching after changing a parameter

### 4.4 Controls — Elements Tab

**Element selector:**
- Chip group: `[H]` `[He]` `[Na]` `[Ca]` `[Fe]`
- Hydrogen selected by default

**Comparison overlay:**
- Checkbox: "Show H Balmer lines for reference"
- When checked, hydrogen Balmer series lines appear as a second row in the spectrum strip, allowing visual comparison

**Mode toggle:**
- Same emission/absorption toggle as hydrogen tab (shared state)

**Mystery spectrum challenge (Challenge Mode, ASTR 201):**
- Button: "Mystery Spectrum"
- Randomizes element + mode; student must identify the element from the line pattern
- Uses `ChallengeEngine` from `@cosmic/runtime`

### 4.5 Readout Cards

Always visible in the sidebar:

| Label | Value | Unit | Source |
|-------|-------|------|--------|
| Transition | $n = 3 \to n = 2$ | — | selected levels |
| Wavelength $\lambda$ | 656.3 | nm | `transitionWavelengthNm` or element catalog |
| Energy $E_{\gamma}$ | 1.89 | eV | `transitionEnergyEv` |
| Frequency $\nu$ | 4.57 × 10¹⁴ | Hz | `transitionFrequencyHz` |
| Series | Balmer | — | `seriesName` |
| Band | Visible (red) | — | wavelength-to-band classification |

Unit separation: each readout uses `<span class="cp-readout__unit">` per the design system contract.

### 4.6 Explore / Understand Stage Tabs

**Explore tab (default):**
- Shows the three synchronized visualizations (Bohr atom + energy levels + spectrum strip)
- Primary interactive workspace

**Understand tab:**
- Display-equation cards (matching `blackbody-radiation` pattern) covering:

  1. **Quantized Energy Levels**
     $$E_n = -\frac{13.6\ \text{eV}}{n^2}$$
     - Energy is *negative* (bound state); the electron needs +13.6 eV to escape from $n = 1$.
     - Levels get closer together as $n$ increases — this is why spectral series converge to a limit.

  2. **The Bohr Radius**
     $$r_n = n^2 a_0, \quad a_0 = 0.0529\ \text{nm}$$
     - The orbit radius grows as $n^2$: the $n = 3$ orbit is 9× larger than $n = 1$.
     - This is the *only* thing Bohr gets wrong for multi-electron atoms. For hydrogen, it's exact.

  3. **Photon Emission & Absorption**
     $$E_{\gamma} = h\nu = \frac{hc}{\lambda} = 13.6\ \text{eV}\left(\frac{1}{n_{\text{lower}}^2} - \frac{1}{n_{\text{upper}}^2}\right)$$
     - **Emission**: electron drops from $n_{\text{upper}}$ to $n_{\text{lower}}$; photon carries away exactly $\Delta E$.
     - **Absorption**: photon with exactly $\Delta E$ is absorbed; electron jumps up. Photons with wrong energy pass through.

  4. **The Rydberg Formula**
     $$\frac{1}{\lambda} = R_\infty \left(\frac{1}{n_{\text{lower}}^2} - \frac{1}{n_{\text{upper}}^2}\right), \quad R_\infty = 1.097 \times 10^7\ \text{m}^{-1}$$
     - This was discovered *empirically* (Rydberg, 1888) decades before the Bohr model (1913) explained it.
     - The convergence: as $n_{\text{upper}} \to \infty$, we reach the **series limit** — the shortest wavelength in a series.

  5. **Why Other Elements Have Different Lines**
     - Multi-electron atoms have more complex energy-level structures due to electron-electron interactions.
     - Each element has a unique line pattern — a "spectral fingerprint."
     - Astronomers use pattern matching to identify elements in distant stars.

- **Misconception callout card:**
  > **"Do electrons really orbit like planets?"** The Bohr model gives correct *energies* for hydrogen but incorrect *spatial pictures*. Real electrons exist in probability clouds (orbitals), not circular paths. We use Bohr's picture because it builds correct energy-level intuition — but it is a stepping stone, not the final answer.

---

## 5) Animation Contract

### 5.1 Transition Animation Sequence (Emission)

1. **Electron highlight** — current orbit ring glows brighter (100ms fade-in)
2. **Electron drop** — electron dot animates from upper orbit to lower orbit
   - Duration: 600ms
   - Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (decelerate)
   - Simultaneously: energy-level arrow draws from upper to lower bar (stroke-dashoffset animation)
3. **Photon emission** — colored circle + wave trail appears at the electron's starting position
   - Flies radially outward (400ms, linear)
   - Fades to 0 opacity at edge of Bohr atom SVG
4. **Spectrum flash** — the corresponding line on the spectrum strip flashes (`cp-value-flash` keyframe) and remains highlighted
5. **Readout update** — readout values update with `cp-value-flash` animation

### 5.2 Transition Animation Sequence (Absorption)

1. **Photon arrival** — colored circle + wave trail flies inward from outside the SVG toward the electron
   - Duration: 400ms, linear
2. **Electron jump** — electron dot animates from lower orbit to upper orbit
   - Duration: 600ms
   - Easing: `cubic-bezier(0, 0, 0.2, 1)` (accelerate out)
   - Simultaneously: energy-level arrow draws upward
3. **Absorption dip** — the corresponding line on the spectrum darkens (dip appears or deepens)
4. **Readout update**

### 5.3 Reduced Motion

All animations respect `prefers-reduced-motion`:
- Animations are replaced with instant state changes (electron teleports, photon appears/disappears)
- Flash effects are replaced with static highlights
- Transition durations set to 0

---

## 6) Preset Policy

### Hydrogen Presets

| Preset | $n_{\text{upper}}$ | $n_{\text{lower}}$ | λ (nm) | Context |
|--------|-----|-----|--------|---------|
| Hα | 3 | 2 | 656.3 | Red emission line; most prominent in nebulae |
| Hβ | 4 | 2 | 486.1 | Blue-green; second Balmer line |
| Hγ | 5 | 2 | 434.0 | Violet Balmer line |
| Hδ | 6 | 2 | 410.2 | Deep violet; near series limit |
| Lyα | 2 | 1 | 121.6 | Strongest UV line; crucial for cosmology |
| Paα | 4 | 3 | 1875.1 | Infrared; used in dusty-region astronomy |

### Element Presets

| Preset | Lines shown | Context |
|--------|-------------|---------|
| Na D doublet | 589.0, 589.6 nm | Classic flame test; streetlight glow |
| Ca H & K | 393.4, 396.8 nm | Strongest solar absorption lines |
| Fe forest | all Fe lines | Why cool-star spectra look so "busy" |

---

## 7) Export Contract

Uses `ExportPayloadV1`:

```typescript
{
  version: 1,
  timestamp: "ISO string",
  parameters: [
    { name: "Mode", value: "Emission" | "Absorption" },
    { name: "Tab", value: "Hydrogen" | "Elements" },
    { name: "Element", value: "H" },
    { name: "n_upper", value: "3" },
    { name: "n_lower", value: "2" },
    { name: "Series filter", value: "Balmer" }
  ],
  readouts: [
    { name: "Transition", value: "n=3 → n=2" },
    { name: "Wavelength lambda (nm)", value: "656.3" },
    { name: "Energy E_gamma (eV)", value: "1.89" },
    { name: "Frequency nu (Hz)", value: "4.57e14" },
    { name: "Series", value: "Balmer" }
  ],
  notes: [
    "Hydrogen energy levels from the Bohr model: E_n = -13.6 eV / n^2.",
    "Wavelengths computed via lambda = hc / Delta E (vacuum wavelengths).",
    "Multi-element line data from NIST Atomic Spectra Database (strongest lines only).",
    "Bohr atom radii in the visualization use a compressed display scale (not physical n^2 scaling).",
    "Line widths in the spectrum strip are for display only (fixed Gaussian, not physical broadening)."
  ]
}
```

---

## 8) Accessibility Contract

Required:
- Keyboard-navigable level selectors (arrow keys to step n)
- All interactive orbit rings have `role="button"` and `aria-label="Select orbit n=3, energy -1.51 eV"`
- Mode toggle uses `role="radiogroup"` + `role="radio"` + `aria-checked`
- Series filter chips use `aria-pressed`
- Status live region for animation events: "Emission: photon emitted at 656.3 nm (Balmer series)"
- Spectrum strip canvas has `aria-label` describing current state
- All display equations rendered with KaTeX (accessible math markup)
- Tab panels use ARIA tab pattern (per `initTabs()`)
- Color is not the only indicator: line labels include wavelength text; UV/IR marked with text, not just false-color

---

## 9) Design System Compliance

Per the design system contract in `CLAUDE.md`:

- [ ] Starfield: `<canvas class="cp-starfield" aria-hidden="true">` + `initStarfield()`
- [ ] SVG celestial tokens: nucleus uses `--cp-celestial-sun-core`, orbits use `--cp-celestial-orbit`
- [ ] Readout units in `<span class="cp-readout__unit">`
- [ ] Panels use `var(--cp-instr-panel-bg)` + `backdrop-filter: blur(8px)`
- [ ] No hardcoded color literals in CSS
- [ ] Glow tokens (30–50% opacity) for nucleus, electron, photon
- [ ] Entry animations: `cp-slide-up` / `cp-fade-in` with stagger on shell sections
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Design contract tests in `design-contracts.test.ts` (copy and adapt from `moon-phases` golden reference)

---

## 10) Site Content Contract

### Demo metadata (`apps/site/src/content/demos/spectral-lines.md`)

```yaml
---
title: "Spectral Lines & the Bohr Atom"
description: "Explore how atoms produce light at specific wavelengths through quantum energy-level transitions."
status: draft
categories: [Light & Spectra]
time: "10-20 min"
audience: "Both"
courses: [ASTR 101, ASTR 201]
---
```

### Predict → Play → Explain

**Predict:**
> Hydrogen gas in a nebula glows red. If hydrogen has infinitely many possible electron transitions, why does it appear to be just one color? Before launching the demo, predict: which single transition do you think dominates the visible glow?

**Play:**
1. Launch the demo in Emission mode with "All" series selected.
2. Click through the Balmer series presets (Hα, Hβ, Hγ, Hδ). Watch the Bohr atom animation for each.
3. Note which transitions fall in the visible band on the spectrum strip.
4. Switch to the Lyman series. Where do those lines land? Can you see them with your eyes?
5. Switch to Absorption mode. Load the Balmer filter. Notice how the bright continuum develops dark gaps.
6. **Challenge:** Switch to the Elements tab. Select "Mystery Spectrum" and try to identify the element by matching its line pattern against known elements.

**Explain:**
Hydrogen produces specific wavelengths because its electron can only occupy discrete energy levels ($E_n = -13.6\ \text{eV} / n^2$). Each jump between levels emits (or absorbs) a photon with exactly the right energy: $E_\gamma = hc/\lambda$. The red glow of nebulae comes from H$\alpha$ (656.3 nm), the $n = 3 \to 2$ Balmer transition — the strongest visible line. The Lyman series is even stronger but falls in the UV, invisible to our eyes. This is why spectroscopy is so powerful: by measuring *which* wavelengths are present, astronomers identify elements in stars, nebulae, and galaxies without ever visiting them.

### Misconceptions

- **"Higher energy = larger orbit"** — Higher energy levels are *less negative* (closer to zero), meaning the electron is less tightly bound. The orbit is larger, but the electron has *less* total energy (kinetic + potential). Confusingly, the electron moves *slower* in higher orbits.
- **"Emission and absorption produce different lines"** — Same lines, different appearance: bright lines on a dark background (emission) vs. dark lines on a bright background (absorption). The wavelengths are identical.
- **"The Bohr model is wrong"** — For hydrogen energy levels, the Bohr model gives the exact same answer as full quantum mechanics. Where Bohr fails is in predicting orbital shapes and in handling multi-electron atoms. But for this demo's purpose — understanding quantized transitions — Bohr is not merely a toy model; it is exactly correct.
- **"A photon with slightly too much energy can still be absorbed"** — No. The energy match must be exact ($\Delta E = h\nu$). Excess energy cannot be "stored" — the photon passes through. (Exception: ionization transitions have a continuum of energies above the threshold, but that is out of scope for this demo.)

### Station Card

**Goal:** Record ≥3 Balmer-series transitions and verify that λ values match the Rydberg formula.

**Observation table columns:**
| Case | $n_{\text{upper}}$ | $n_{\text{lower}}$ | λ (nm) | E (eV) | Series |

**Steps:**
1. Set Hα (n=3→2). Record λ and E.
2. Set Hβ (n=4→2). Record λ and E.
3. Set Hγ (n=5→2). Record λ and E.
4. **Scaling check:** Compute $\Delta E$ ratios. Does $E_\gamma(\text{Hβ})/E_\gamma(\text{Hα})$ match the formula prediction?
5. **Prediction:** What wavelength do you expect for Hδ (n=6→2)? Record your prediction, then check.

### Instructor Notes

**Overview:** This demo teaches atomic spectral lines through the Bohr model of hydrogen, with an extension to multi-element line identification. The three synchronized views (Bohr atom, energy-level diagram, spectrum strip) are the key pedagogical tool — students who "think in pictures" connect through the atom view, while students who "think in math" connect through the energy ladder. The spectrum strip is what everyone connects to observations.

**Main code path:**
- Physics model: `packages/physics/src/spectralLineModel.ts`
- Demo source: `apps/demos/src/demos/spectral-lines/`
- Site content: `apps/site/src/content/demos/spectral-lines.md`

**Suggested activities:**
1. (10 min) **Balmer Series Discovery**: Students predict, then verify, the Balmer wavelengths using the Rydberg formula. Station card guides this.
2. (5 min) **Emission vs. Absorption**: Toggle between modes; explain how nebulae show emission spectra while stellar atmospheres show absorption.
3. (8 min) **Element Fingerprinting**: Using the Elements tab, students match a mystery spectrum to a known element. Discussion: How do astronomers identify elements in the Sun?
4. (ASTR 201, 10 min) **Boltzmann Population**: If the temperature slider is implemented (v2), explore why the Sun's spectrum shows strong Balmer lines despite hydrogen being mostly in n=1 — the Boltzmann factor reveals which transitions are *likely* at a given temperature.

**Model notes:**
- Hydrogen levels are exact (Bohr = Schrödinger for energy eigenvalues of hydrogen).
- Bohr orbit radii in the SVG are compressed for visibility; the energy-level diagram is to scale.
- Multi-element line data is empirical (NIST ASD). The demo does not compute multi-electron energy levels.
- Line widths in the spectrum are cosmetic (fixed Gaussian, not physical broadening).
- The photon "particle" animation is a pedagogical concession — photons are quantum objects, not classical projectiles. The wave trail hints at this duality.

---

## 11) Verification Gates

Minimum required checks:

1. `corepack pnpm -C packages/physics test spectralLineModel.test.ts`
2. `corepack pnpm -C apps/demos test spectral-lines`
3. `corepack pnpm build`
4. `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

## 12) Deferred Scope (v2+)

Not in v1:

- **Boltzmann temperature slider** (ASTR 201) — controls line-strength weighting via population ratios
- **Fine structure / doublet splitting** (e.g., Na D doublet resolved in detail)
- **Line broadening physics** (thermal, pressure, natural widths)
- **Continuous opacity** (bound-free, free-free transitions)
- **Kirchhoff's Laws interactive panel** — linking hot/cold gas scenarios to emission/absorption/continuous spectra
- **Spectral classification tie-in** — connecting to `stars-zams-hr` for O/B/A/F/G/K/M line-strength sequences
- **Animated "build-a-spectrum" mode** — student clicks transitions one by one and watches the spectrum accumulate, then compares to a real stellar spectrum image

These are planned as follow-on modules once the v1 Bohr/hydrogen + multi-element baseline is validated.

---

## 13) Relationship to Future Demos

This spec establishes the **spectral line catalog and physics model** that will be consumed by:

- **`doppler-shift`** — shifts the line catalog wavelengths by $\Delta\lambda / \lambda = v_r / c$
- **`spectral-lab`** — composites `BlackbodyRadiationModel` (continuum) + `SpectralLineModel` (absorption/emission lines) + Doppler shift into a full virtual spectrograph

The `SpectralLineModel` API is designed to be reusable across all three demos.
