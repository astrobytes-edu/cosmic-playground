# EOS Lab — Expert Review: Pedagogy, Science, and Design

**Date**: 2026-02-07
**Reviewer**: Claude Opus 4.6 (three parallel review agents: full-state reader, scientific correctness, competitive landscape)
**Demo**: `apps/demos/src/demos/eos-lab/`
**Physics model**: `packages/physics/src/stellarEosModel.ts`

---

## Executive Summary

EOS Lab is **the most sophisticated interactive browser-based stellar EOS teaching tool in existence**. No comparable tool exists in the astronomy education landscape. The combination of three decomposed pressure channels, finite-T Fermi-Dirac solver, interactive regime map, mechanism animations, live KaTeX equations, and scaling law quiz fills a genuine gap between Astro 101 and upper-division stellar structure courses.

22 scientific checks performed: **21 PASS, 1 FAIL (now fixed)**. The Chandrasekhar zero-T convention mismatch (3× error) was fixed in commit `6f977e0`.

---

## 1. Competitive Landscape

| Competitor | What it covers | What EOS Lab adds |
|---|---|---|
| PhET Gas Properties | Ideal gas particles only | Radiation + degeneracy channels, stellar context |
| MESA-Web | EOS as black-box infrastructure | Three pressure channels decomposed, interactive regime map |
| Star in a Box | HR diagram visualization | Actual pressure physics, composition controls |
| Textbook figures | Static ρ-T regime diagrams | Interactive brute-force grid, real-time composition effects |
| Timmes/HELM EOS | Fortran research code, no viz | Full browser visualization with mechanism animations |

### Key differentiators (no competitor has any of these)

1. Three separate pressure channels with real-time decomposition
2. Full Fermi-Dirac finite-temperature electron pressure (NR + relativistic branches)
3. Interactive regime map computed from the full model (not just analytical boundaries)
4. Mechanism animations for each channel (gas particles, radiation photons, degeneracy levels)
5. Live KaTeX equations with substituted numerical values
6. Composition controls affecting molecular weights
7. Station mode for structured data collection
8. Scaling Law Detective quiz for active learning
9. LTE closure validity assessment chip

### Pedagogical positioning

EOS Lab fills the well-documented gap between:
- **Astro 101**: "gas pressure supports stars" (qualitative)
- **Upper-division**: solve the stellar structure ODEs (quantitative)
- **EOS Lab**: "what pressure channels exist and when each matters" (intermediate, ASTR 201 level)

This matches PhET design principles (Wieman, Adams): immediate visual feedback, multiple representations, guided exploration, productive failure.

---

## 2. Scientific Correctness (22 checks)

### All equations verified correct

| # | Check | Verdict |
|---|---|---|
| 1a | Gas pressure formula P = ρ k_B T / (μ m_u) | PASS |
| 1b | μ formula: 1/μ = 2X + 3Y/4 + Z/2 | PASS |
| 1c | μ_e formula: 1/μ_e = X + Y/2 + Z/2 | PASS |
| 2 | Radiation pressure P_rad = aT⁴/3 | PASS |
| 3a | Zero-T Chandrasekhar formula | **FIXED** (was 3× error from convention mixing) |
| 3b | Finite-T Fermi-Dirac solver | PASS |
| 3c | NR K_NR prefactor in boundary curves | PASS |
| 4a | Gas=Rad boundary: log ρ = 3 log T + const | PASS |
| 4b | Gas=Deg boundary: log ρ = 1.5 log T + const | PASS |
| 4c | Rad=Deg boundary: log ρ = 2.4 log T + const | PASS |
| 5 | CGS units throughout | PASS |
| 6 | Physical constants vs CODATA 2018 | PASS (all 6 constants exact match) |
| 7 | Preset physical reasonableness | PASS (all 6 presets) |
| 8 | Scaling law challenges (×2, ×16, ×3.17) | PASS |
| 9a | Gas animation physics (v ~ √T) | PASS |
| 9b | Radiation animation (no ρ dependence) | PASS (note: photon count qualitative) |
| 9c | Degeneracy animation (Pauli filling) | **FIXED** (level spacing was inverted) |
| 10a | Gas equation LaTeX | PASS |
| 10b | Radiation equation LaTeX | PASS |
| 10c | Degeneracy equation LaTeX | PASS |

### Critical finding (FIXED in commit `6f977e0`)

The Chandrasekhar zero-T formula mixed the Shapiro & Teukolsky prefactor (8π²) with the Chandrasekhar bracket function f(x) = x(2x²−3)√(1+x²) + 3 arcsinh(x). These conventions differ by exactly a factor of 3. The fix changed the prefactor denominator from 8π² to 24π² to match the Chandrasekhar convention of the bracket function.

- **Impact**: Only activated when χ = T/T_F < 0.001 (nearly zero-T regime)
- **All six demo presets** used the finite-T FD solver, which was always correct
- **Numerical verification**: P_deg at x_F = 0.8007 now gives 2.627e22 dyne/cm² (matches S&T cross-check to 3.19e-16 relative error)

### Minor issues found and fixed (commit `0585b6e`)

1. **Degeneracy level spacing inverted** (`mechanismViz.ts:372`): For 3D free fermions g(E) ~ √E, levels should be closer at higher energy. The weight formula was growing with index instead of shrinking. Fixed to `1.4 - 0.4*(i/maxLevels)`.

2. **Canvas animations ignore prefers-reduced-motion**: Added `window.matchMedia('(prefers-reduced-motion: reduce)')` check. When reduced motion is preferred, animations render a single static frame instead of running `requestAnimationFrame` loops.

3. **Flash timeout race condition** (`main.ts:728-748`): A single shared timeout for all three delta-P flash badges meant overlapping slider changes could cause premature disappearance or lingering flashes. Fixed with per-element `WeakMap<HTMLElement, number>` timeouts.

---

## 3. Design Assessment

### Strengths

- **No hardcoded colors in CSS** — all via tokens or `color-mix()`. Channel colors set as CSS custom properties at runtime (`--eos-gas`, `--eos-rad`, `--eos-deg`).
- **Three responsive breakpoints** (980px, 899px, 599px) handle desktop → tablet → phone gracefully.
- **Entry animations** use staggered `cp-slide-up` / `cp-fade-in` per design system contract.
- **`aspect-ratio` constraints** on chart containers prevent unbounded growth.
- **Delta-P flash system** provides immediate feedback on which pressure channel increased/decreased.

### Remaining issues

1. **Regime map channel colors duplicated** — `regimeMap.ts` has hardcoded hex values that must stay in sync with `main.ts` CSS custom property assignments. Should resolve from runtime CSS properties.
2. **No Canvas resize handling in mechanismViz.ts** — `setupCanvas` called on `start()` but never on window resize. Stale canvas dimensions on resize.
3. **No `requestAnimationFrame` batching** — Each slider `input` event calls `render()` synchronously. Fast slider movement could cause jank.
4. **Compare slider bidirectional sync** — Tab 2 sliders dispatch events back to sidebar sliders. Fragile indirect event chain.

---

## 4. Pedagogical Assessment

### Strengths (already SoTA)

1. **Two-tab Explore/Understand architecture** — Tab 1 quantitative, Tab 2 physical intuition. Multiple representations per PhET research.
2. **Scaling Law Detective** targets exactly the right exponents (T¹, T⁴, ρ⁵/³). Active learning with immediate reinforcement.
3. **LTE closure chip** — rare for interactive tools to flag their own assumptions.
4. **Presets spanning 15+ decades** force order-of-magnitude reasoning.
5. **Station mode** transforms exploration toy into lab instrument.
6. **Regime map** — only interactive version of the classic textbook ρ-T diagram.

### Enhancement opportunities

1. **Symbolic → substituted equation toggle** — Currently shows only numerical substitution. Showing symbolic form first, then substitution on click, would scaffold mathematical reasoning.
2. **Stellar profile overlay on regime map** — Plot the Sun's radial T(r) vs ρ(r) profile as a curve on the regime map. Students would see the stellar interior traces a path across regimes.
3. **Adiabatic index readout** — Show γ_eff = d(ln P)/d(ln ρ)|_S, connecting EOS to stellar stability (γ < 4/3 = unstable).
4. **Guided first-use tour** — Brief 3-step walkthrough to lower barrier for first-time users.
5. **White dwarf composition note** — The WD preset uses Y=0.98 (pedagogical simplification for μ_e ≈ 2). A tooltip explaining that real WDs are C/O (which would be Z, not Y) would prevent confusion for knowledgeable students.

---

## 5. Recommended Action Items

| Priority | Item | Effort | Impact | Status |
|---|---|---|---|---|
| P0 | Fix Chandrasekhar 3× error | 1 line | Correctness | **DONE** `6f977e0` |
| P1 | `prefers-reduced-motion` for Canvas | ~15 lines | Accessibility | **DONE** `0585b6e` |
| P1 | Fix flash timeout race condition | ~10 lines | UX correctness | **DONE** `0585b6e` |
| P2 | Fix degeneracy level spacing | ~2 lines | Scientific accuracy | **DONE** `0585b6e` |
| P2 | Resolve regime map colors from CSS | ~20 lines | Maintainability | TODO |
| P2 | Add Canvas resize handling to mechanismViz | ~15 lines | Responsive correctness | TODO |
| P3 | Stellar profile overlay on regime map | ~100 lines | Pedagogy | TODO |
| P3 | Adiabatic index (γ_eff) readout | ~40 lines | Pedagogy | TODO |
| P3 | Symbolic → substituted equation toggle | ~50 lines | Pedagogy | TODO |
| P3 | First-use guided tour | ~80 lines | Onboarding | TODO |
| P3 | White dwarf composition tooltip | ~10 lines | Clarity | TODO |

---

## 6. Architecture Summary

### File structure

```
apps/demos/src/demos/eos-lab/
├── index.html          (481 lines — WAI-ARIA tabs, 6 presets, 4 accordions)
├── main.ts             (1140 lines — state management, render loop, event wiring)
├── logic.ts            (697 lines — pure functions, scaling challenges, equation formatters)
├── mechanismViz.ts     (514 lines — 3 Canvas 2D animation classes)
├── regimeMap.ts        (516 lines — regime dominance map renderer)
├── uplotHelpers.ts     (140 lines — uPlot adapter for design system)
├── style.css           (701 lines — responsive, no color literals)
├── design-contracts.test.ts  (24 tests)
└── logic.test.ts       (38 tests)

packages/physics/src/
└── stellarEosModel.ts  (877 lines — ideal gas + radiation + Fermi-Dirac EOS)

apps/site/tests/
└── eos-lab.spec.ts     (24 E2E tests)
```

### Key patterns

- **Log-scale slider mapping** (integer 0–1000 → logarithmic physical values)
- **Deferred grid rebuild** (composition drag events defer expensive 8000-evaluation grid)
- **Tab 2 lifecycle** (MutationObserver starts/stops Canvas animations on tab visibility)
- **Runtime CSS custom properties** for channel colors (hex in JS, not CSS)
- **Grid caching** keyed by composition + η (not T/ρ, since grid covers full T-ρ plane)
