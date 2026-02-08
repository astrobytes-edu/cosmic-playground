# Blackbody Radiation Demo Spec v2

**Status:** Draft (implementation target)  
**Date:** 2026-02-08  
**Owner:** Cosmic Playground

---

## 0. Purpose

Define the next-generation `blackbody-radiation` demo as a multi-topic teaching instrument that supports:

1. Blackbody radiation fundamentals (Planck + Wien + Stefan-Boltzmann)
2. Stellar color/temperature/luminosity reasoning with explicit main-sequence assumptions
3. CMB and non-stellar thermal sources as intentional model overrides

This spec is the source of truth for UI behavior, model boundaries, pedagogy framing, and test expectations.

---

## 1. Contract Alignment

This spec follows:

- `docs/specs/cosmic-playground-prd.md`
  - Predict -> Play -> Explain product goal
  - Demo hardening-first policy and launch gates
  - Release-state/readiness metadata expectations
- `docs/specs/cosmic-playground-site-spec.md`
  - Every demo is an instrument
  - Shared shell/runtime expectations
  - Stable copy/export behavior
- `docs/specs/cosmic-playground-model-contract.md`
  - Explicit units in model APIs, UI labels, and exports
  - Correct model over convenience model where feasible
  - Required benchmark + limiting-case + invariant tests

---

## 2. Demo Positioning: When To Use This Demo

### 2.1 Course/topic use-case map

| Topic | Recommended mode | Primary observable | Typical class goal |
|---|---|---|---|
| Intro blackbody radiation | Blackbody Fundamentals | Spectrum shape + peak shift | Connect temperature to spectrum shape and Wien scaling |
| Stellar classification / HR intuition | Stellar Inference (default) | `T`, `R`, `L`, perceived color | Explain why hot stars are often blue and more luminous |
| CMB introduction | Blackbody Fundamentals preset | Microwave peak | Relate low `T` thermal spectrum to long-wavelength peak |
| Thermal emission beyond stars (Earth, planets, lab sources) | Blackbody Fundamentals presets | IR-dominated peaks | Compare everyday thermal emitters to stellar temperatures |
| Brightness vs distance extension | Stellar Inference + Observed Flux layer | `f = L/(4*pi*d^2)` | Separate intrinsic luminosity from apparent brightness |

### 2.2 Out of scope for this demo

- Detailed stellar atmosphere line spectra
- Precise photometric synthetic color pipelines
- Evolutionary tracks/isochrones

---

## 3. UI Architecture and Layout

### 3.1 Shell intent

Use the instrument shell with a viz-first emphasis:

- Left: controls sidebar (core controls + blackbody-only presets)
- Center: spectrum stage
- Right (desktop): collapsible "Stellar Context" panel
- Drawer: model notes + "what to notice" + challenge checklist

### 3.2 Collapsible context panel behavior

- Desktop default: open
- Mobile default: collapsed (bottom-sheet style)
- User toggle persists per session

### 3.3 Preset split (required)

- Sidebar presets: Blackbody Fundamentals mode only
  - Includes non-stellar thermal objects (for example CMB, Earth, tungsten/lava if included)
- Stellar Context panel presets: Stellar Inference mode only
  - Main-sequence anchors + explicit override stars

Rationale: avoid mixing blackbody-only and stellar-structure assumptions in one control cluster.

---

## 4. Interaction Model

### 4.1 Top-level modes

1. `Stellar Inference` (default)
2. `Blackbody Fundamentals`

### 4.2 Substates

- `ms-inferred`: values derived from main-sequence relations
- `preset-override`: values set by preset metadata (can be non-main-sequence)

### 4.3 Readout layers (required)

Layer toggles:

1. `Spectrum` (always on)
2. `Surface Flux` (`F_surface/F_sun = (T/T_sun)^4`)
3. `Luminosity` (`L/L_sun = (R/R_sun)^2 (T/T_sun)^4`)
4. `Observed Flux` (optional extension): `f/f_ref = (L/L_ref)(d_ref/d)^2`

These layers must clarify "per-unit-area emission" versus "total power."

### 4.4 Stage tab contract (required)

Top-level stage tabs must be:

1. `Explore`
2. `Understand`

Do not add a third top-level tab in v2. If additional depth is needed, use nested accordions or local subsection controls inside `Understand`.

#### 4.4.1 Explore tab scope

`Explore` is the instrument workflow surface:

- interactive spectrum plot and readouts
- mode switching (`Stellar Inference` / `Blackbody Fundamentals`)
- presets and context panel interactions
- station-mode style data collection behaviors

#### 4.4.2 Understand tab scope

`Understand` is the concept-to-model explanation surface:

- minimal but interactive explanatory visuals
- short, high-signal text tied directly to live model values
- misconception checks with immediate feedback

The `Understand` tab should explain *why* observed behavior in `Explore` happens.

---

## 4A. Understand Tab Content Contract

The `Understand` tab must include these sections in order.

### 4A.1 Section 1 — Physics model overview

Heading: `Physics of the Blackbody Curve`

Required content:

- one-sentence definition of a blackbody
- explicit note that perceived color is integrated over the visible band, not set by `lambda_peak` alone
- one live readout row showing current `T`, `lambda_peak`, and mode/state badge

### 4A.2 Section 2 — What is a blackbody? (animated visual)

Required visual:

- an animated cavity-with-small-hole conceptual graphic (or equivalent) showing absorption/re-emission concept

Required explanatory points:

- idealized absorber/emitter model
- thermal equilibrium framing
- real stars are approximate blackbodies with line features superimposed

Accessibility requirements:

- animation must respect reduced-motion settings
- static fallback frame with caption must be available

### 4A.3 Section 3 — Curve-shape intuition

Required visual:

- animated Planck-curve panel with overlays for:
  - short-wavelength exponential suppression
  - long-wavelength tail trend
  - peak marker

Required explanatory points:

- why the short-`lambda` side drops quickly
- why the long-`lambda` side remains a tail
- how changing `T` moves peak and total emitted area

### 4A.4 Section 4 — From surface flux to luminosity (stars)

Heading: `From Surface Flux to Luminosity`

Required equations and interpretation:

- `F_surface = sigma T^4` (per-unit-area emitted flux)
- `L = 4*pi*R^2*sigma*T^4` (total luminosity)

Required UI affordance:

- a comparison block that contrasts:
  - same `T`, different `R`
  - same `R`, different `T`

Learner outcome:

- students can articulate why "hotter surface" and "brighter star" are related but not identical statements.

### 4A.5 Section 5 — Main-sequence inference and limits

Required content:

- concise explanation of `ms-inferred` path
- explicit validity range badge for MS fit
- explicit handling of `preset-override` as non-MS-allowed state

Required misconception guardrails:

- "Peak wavelength alone does not determine perceived color"
- "Surface flux depends on `T`; luminosity also depends on `R`"
- "Main-sequence scaling is not universal for all objects"

### 4A.6 Section 6 — Check-your-understanding prompts

Required interaction:

- at least 3 short prompts with immediate correctness feedback
- prompts must map directly to live model state (not static quiz text)

Minimum prompt set:

1. If `T` doubles at fixed `R`, what happens to `F_surface`?
2. If `R` doubles at fixed `T`, what happens to `L`?
3. Why can two stars with similar `lambda_peak` have different luminosity?

---

## 5. Physics Model Specification

### 5.1 Shared blackbody equations (all modes)

- Planck spectral radiance: `B_lambda(T)`
- Wien displacement: `lambda_peak = b/T`
- Surface emitted flux: `F_surface = sigma T^4`
- Luminosity: `L = 4*pi*R^2*sigma*T^4`

Units policy:

- Internal wavelength: `wavelengthCm`
- Display wavelength: nm/um/mm as appropriate
- Temperature: `temperatureK`
- Radius: `radiusRsun` (and km where explicitly needed)
- Luminosity: `luminosityLsun`

### 5.2 Stellar Inference mode (main-sequence proxy)

Infer stellar properties from temperature through physically motivated piecewise relations:

#### Mass-luminosity relation

`L/L_sun = c_i * (M/M_sun)^(alpha_i)` with piecewise `alpha(M)`:

- `0.08 <= M < 0.43`: `L = 0.23 * M^2.3`
- `0.43 <= M < 2.0`: `L = M^4.0`
- `2.0 <= M <= 100`: Eddington-limited hybrid
  - `L_ML = 1.4 * M^3.5`
  - `L_Edd = 3.8e4 * (0.34 / kappa) * M`
  - `L = min(L_ML, eta_Edd * L_Edd)`
  - v2 defaults: `kappa = 0.34 cm^2 g^-1`, `eta_Edd = 0.5`

Notes:

- This keeps low/intermediate mass behavior empirical-style while producing physically motivated high-mass flattening toward Eddington-limited scaling.
- The transition mass is solved from `L_ML = eta_Edd * L_Edd` (about `45 M_sun` for v2 defaults).
- If the Eddington cap branch is active, UI should display an explicit "near Eddington-limited regime" caution badge.

#### Mass-radius relation

`R/R_sun = f(M)` hybrid proxy:

- `0.08 <= M < 0.179`: `R = 0.70 * M^0.8` (teaching-level low-mass extension)
- `0.179 <= M <= 1.5`: `R = 0.438 * M^2 + 0.479 * M + 0.075` (empirical low-mass fit)
- `1.5 < M <= 31`: `R = 1.41 * M^0.57` (continuity-preserving bridge through intermediate/high MS masses)
- `31 < M <= 100`: `R = R(31) * (M/31)^0.50` with `R(31) = 1.41 * 31^0.57` (high-mass extrapolation)

Notes:

- This keeps a data-grounded low-mass branch and smooth behavior for inversion in the full `0.08-100 M_sun` domain.
- The `0.08-0.179 M_sun` radius branch is an explicit extrapolation for continuity and should be badged as approximate.
- `31-100 M_sun` is extrapolated beyond the calibration range and must be badged as approximate.

#### Temperature closure

`T = T_sun * ((L/L_sun)/(R/R_sun)^2)^(1/4)`

Implementation rule:

- Invert `T(M)` numerically using monotonic root finding in log-mass space.
- Valid solve range: `M in [0.08, 100] M_sun`.
- If requested `T` is outside inferred range, clamp and show explicit "outside MS inference range" badge.
- For high masses (especially when the Eddington cap branch is active), show a caution note that winds/rotation/metallicity and evolutionary state can shift the true relation.

### 5.3 Preset override model

Preset metadata can explicitly set `{temperatureK, radiusRsun, massMsun?}`.

For overrides:

- `L/L_sun` is computed from `R` and `T` via Stefan-Boltzmann ratio form.
- Label state as `Preset override (non-MS allowed)`.
- Include validity note in UI and exports.

This enables red/blue supergiants, white dwarfs, neutron stars, CMB, and planetary objects without implying they obey the MS fit.

### 5.4 Color model

- Keep "perceived color" as an approximation derived from integrated visible contribution.
- Do not map perceived color from `lambda_peak` alone.
- UI must include an active misconception guardrail:
  - example copy: "Peak wavelength is one marker; perceived color depends on the full visible spectrum."

---

## 6. Preset Taxonomy (v2)

### 6.1 Sidebar presets (Blackbody Fundamentals)

- CMB
- Earth-like thermal emitter
- Human-body range (optional)
- Warm metal/lava range (optional)
- Sun reference anchor

### 6.2 Stellar Context presets (Stellar Inference panel)

Main-sequence anchors:

- M dwarf, K dwarf, G (Sun), F, A, B, O

Override stars:

- Red giant
- Red supergiant
- Blue supergiant
- White dwarf
- Neutron star

Each override preset must ship with explicit source assumptions in model notes.

---

## 7. Accessibility and Input Requirements

- Arrow keys adjust temperature
- `Shift + Arrow` uses larger step
- Focus-visible states on all toggles/chips/panel controls
- Live-region messaging for mode and layer changes
- Context panel collapse/expand is keyboard operable and screen-reader labeled

---

## 8. Export Contract Updates (v1-compatible extension)

Copy/export payload must remain `version: 1` compatible and add explicit fields (non-breaking additions only):

- `Mode` (`Stellar Inference` or `Blackbody Fundamentals`)
- `State` (`ms-inferred` or `preset-override`)
- `Temperature T (K)`
- `Radius R (Rsun)` when available
- `Mass M (Msun)` when available/inferred
- `Peak wavelength lambda_peak (nm)`
- `Surface flux ratio F/Fsun`
- `Luminosity ratio L/Lsun`
- `Perceived color (approx)`
- `Validity note`

If any existing field names change, update export compatibility matrix per PRD requirements.

---

## 9. Test and Verification Requirements

### 9.1 Physics/model tests

Add/extend tests in `packages/physics` for:

- Piecewise `L(M)` and `R(M)` continuity at boundaries
- Monotonic `T(M)` over valid domain
- Inversion stability `T -> M -> T`
- Limiting cases (low-mass cool dwarf, high-mass hot star)
- Override path computes luminosity from `R^2 T^4`

### 9.2 Demo logic/tests

Add/extend tests in `apps/demos/src/demos/blackbody-radiation` for:

- Mode switching state transitions
- Preset routing by mode (sidebar vs context panel)
- Layer readout consistency (`F`, `L`, optional `f`)
- Misconception guardrail copy presence

### 9.3 E2E coverage

- Desktop context panel defaults open
- Mobile context panel defaults collapsed
- Keyboard adjustments and shortcuts
- Station mode snapshot rows include new readouts

### 9.4 Baseline gates

- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
- Optional but recommended:
  - `corepack pnpm test:physics-contract`

---

## 10. Rollout and Release-State Notes

Before promoting `blackbody-radiation` readiness state:

1. Update parity artifact: `docs/audits/migrations/blackbody-radiation-parity.md`
2. Update demo metadata readiness fields in `apps/site/src/content/demos/blackbody-radiation.md`
3. Record intentional deltas from legacy behavior (especially new MS-inference and override logic)
4. Verify export compatibility impact and document if schema labels changed

---

## 11. Open Decisions (resolved for v2)

- Default mode: **Stellar Inference**
- Context panel default state: **open on desktop, collapsed on mobile**
- Preset split: **sidebar (blackbody mode)** vs **context panel (stellar mode)**
- Main-sequence model: **piecewise `alpha(M)` plus piecewise `R(M)`**
