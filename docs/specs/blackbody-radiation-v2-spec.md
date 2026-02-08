# Blackbody Radiation Demo Spec v2

**Status:** Draft  
**Date:** 2026-02-08  
**Owner:** Cosmic Playground

---

## 1) Scope and Positioning

`blackbody-radiation` is the Astro 101 thermal-radiation instrument.

Primary use:
- blackbody spectrum intuition
- Wien peak shift
- Stefan-Boltzmann surface-flux scaling
- visible-band interpretation and color misconception guardrails

Out of scope for this demo:
- high-fidelity mass-metallicity stellar-structure inference
- HR-diagram ZAMS fitting
- stellar evolution tracks

Those are moved to `stars-zams-hr`.

---

## 2) Product Split Contract

### 2.1 Blackbody instrument (`blackbody-radiation`)

- Thermal-first pedagogy.
- Preserves broad thermal presets (for example CMB, Human, Earth, Brown Dwarf).
- Includes basic stellar-context presets for intuitive comparison, but does not claim universal stellar-structure inference from temperature.
- Includes top-level stage tabs:
  - `Explore`
  - `Understand`

### 2.2 Stars instrument (`stars-zams-hr`)

- Owns ZAMS modeling fidelity using Tout et al. (1996).
- Owns HR placement driven by mass and metallicity controls.
- Serves as ASTR 201 pathway for stellar-structure and HR instruction.

---

## 3) Teaching Use Cases

Recommended usage map:

1. Intro blackbody radiation:
- Use `blackbody-radiation` in `Explore` tab.
- Observable: Planck-curve shape + peak shift.

2. Color misconception correction:
- Use `blackbody-radiation` `Understand` tab framing:
  - perceived color is integrated over the visible band
  - peak wavelength alone is not the full color story

3. CMB and non-stellar thermal emitters:
- Use thermal presets in `blackbody-radiation`.

4. Stellar HR/ZAMS modeling:
- Use `stars-zams-hr`.

---

## 4) UI/UX Contract (Blackbody)

Required:

- Keep current core layout stable (no broad redesign regressions).
- Add/maintain `Explore` + `Understand` tabs using runtime ARIA tabs behavior.
- Keep preset affordance split understandable:
  - thermal anchors remain available
  - stellar context presets remain available
- Preserve utility toolbar behavior (station/help/copy/popover).

Non-goals in this version:
- A/B compare overlay
- colorimetry pipeline with eye-response weighting plot
- full luminosity-vs-distance layer stack

Those remain candidate follow-ups.

---

## 5) Physics Contract (Blackbody)

Core equations:

- Planck spectral radiance: `B_lambda(T)`
- Wien displacement: `lambda_peak = b / T`
- Stefan-Boltzmann surface flux: `F = sigma T^4`

Units policy:

- internal wavelength: cm
- display wavelength: nm / um / mm (as appropriate)
- temperature: K
- ratio notation: use LaTeX-formatted solar ratios (for example `L/L_{\odot}`) as dimensionless quantities

Model messaging requirements:

- Explicitly separate surface flux (`T^4`) from total luminosity assumptions.
- Avoid implying that `T` alone universally determines stellar luminosity.
- Use LaTeX math for equation-facing instructional copy (`F = \sigma T^4`, `\lambda_{\rm peak}`).

---

## 6) Preset Contract (Blackbody)

Preset categories:

1. Thermal anchors:
- include CMB, Human, Earth, Brown Dwarf (plus additional calibrated anchors as needed)

2. Stellar context anchors:
- include representative stellar classes and evolved examples where pedagogically useful

Each preset must have:

- explicit temperature
- optional radius metadata (if used for contextual readouts)
- assumption note text when non-main-sequence or contextual override behavior is shown

---

## 7) Accessibility Contract (Blackbody)

Required:

- keyboard-usable controls and tab navigation
- visible focus states
- ARIA-correct tabs and tabpanels
- status live region for copy/export actions

---

## 8) Export and Content Contract

`blackbody-radiation` export remains `ExportPayloadV1` with explicit units and assumptions in notes.

Site content entry (`apps/site/src/content/demos/blackbody-radiation.md`) must remain aligned with:
- Astro 101 thermal-first scope
- misconception list including peak-vs-color and temperature-vs-luminosity caveats
- parity audit path

---

## 9) Verification Gates

Minimum required checks:

1. `corepack pnpm -C apps/demos test blackbody-radiation`
2. `corepack pnpm build`
3. `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

## 10) Follow-on Roadmap Link

Advanced stellar modeling and HR workflows are tracked in:

- `docs/specs/stars-zams-hr-spec.md`
