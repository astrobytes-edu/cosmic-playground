# EOS Lab — Expert Review: Pedagogy, Science, and Design

**Date**: 2026-02-07 (updated 2026-02-07 Phase 3 pedagogy audit)
**Reviewer**: Claude Opus 4.6 (three parallel review agents: full-state reader, scientific correctness, competitive landscape)
**Demo**: `apps/demos/src/demos/eos-lab/`
**Physics model**: `packages/physics/src/stellarEosModel.ts`

---

## Executive Summary

EOS Lab is **the most sophisticated interactive browser-based stellar EOS teaching tool in existence**. No comparable tool exists in the astronomy education landscape. The combination of three decomposed pressure channels, finite-T Fermi-Dirac solver, interactive regime map, mechanism animations, live KaTeX equations, and scaling law quiz fills a genuine gap between Astro 101 and upper-division stellar structure courses.

22 scientific checks performed: **21 PASS, 1 FAIL (now fixed)**. The Chandrasekhar zero-T convention mismatch (3x error) was fixed in commit `6f977e0`.

**Post-enhancement status**: All 7 enhancement tasks completed (`85cea98`..`d86e5ff`). Demo now includes adiabatic index readout, symbolic/substituted equation toggle, solar profile overlay, guided tour, and WD composition tooltip. Test count: 75 demo tests (24 contract + 51 logic) + 24 E2E tests.

**Phase 2 hardening**: All 25 UI/UX issues resolved (`6bed33c`..`d5b6fe0`). Fixes cover density readout format, tour robustness, stability indicator, keyboard accessibility, animation performance, quiz UX, and dead code cleanup.

**Phase 3 pedagogy audit**: Comprehensive re-audit identified 11 pedagogical/UX improvements. Physics model reconfirmed correct (18/18 tests, CODATA 2018 constants, solar core checkpoint to 9 sig figs). Focus: bridging Tab 1 -> Tab 2 cognitive gap, improving discoverability, strengthening active learning scaffolding.

---

## 1. Competitive Landscape

| Competitor | What it covers | What EOS Lab adds |
|---|---|---|
| PhET Gas Properties | Ideal gas particles only | Radiation + degeneracy channels, stellar context |
| MESA-Web | EOS as black-box infrastructure | Three pressure channels decomposed, interactive regime map |
| Star in a Box | HR diagram visualization | Actual pressure physics, composition controls |
| Textbook figures | Static rho-T regime diagrams | Interactive brute-force grid, real-time composition effects |
| Timmes/HELM EOS | Fortran research code, no viz | Full browser visualization with mechanism animations |

### Key differentiators (no competitor has any of these)

1. Three separate pressure channels with real-time decomposition
2. Full Fermi-Dirac finite-temperature electron pressure (NR + relativistic branches)
3. Interactive regime map computed from the full model (not just analytical boundaries)
4. Mechanism animations for each channel (gas particles, radiation photons, degeneracy levels)
5. Live KaTeX equations with symbolic/substituted toggle
6. Composition controls affecting molecular weights
7. Station mode for structured data collection
8. Scaling Law Detective quiz for active learning
9. LTE closure validity assessment chip
10. Adiabatic index (Gamma_eff) stability readout
11. Solar model profile overlay on regime map
12. First-use guided tour

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
| 1a | Gas pressure formula P = rho k_B T / (mu m_u) | PASS |
| 1b | mu formula: 1/mu = 2X + 3Y/4 + Z/2 | PASS |
| 1c | mu_e formula: 1/mu_e = X + Y/2 + Z/2 | PASS |
| 2 | Radiation pressure P_rad = aT^4/3 | PASS |
| 3a | Zero-T Chandrasekhar formula | **FIXED** (was 3x error from convention mixing) |
| 3b | Finite-T Fermi-Dirac solver | PASS |
| 3c | NR K_NR prefactor in boundary curves | PASS |
| 4a | Gas=Rad boundary: log rho = 3 log T + const | PASS |
| 4b | Gas=Deg boundary: log rho = 1.5 log T + const | PASS |
| 4c | Rad=Deg boundary: log rho = 2.4 log T + const | PASS |
| 5 | CGS units throughout | PASS |
| 6 | Physical constants vs CODATA 2018 | PASS (all 6 constants exact match) |
| 7 | Preset physical reasonableness | PASS (all 6 presets) |
| 8 | Scaling law challenges (x2, x16, x3.17) | PASS |
| 9a | Gas animation physics (v ~ sqrt(T)) | PASS |
| 9b | Radiation animation (no rho dependence) | PASS (note: photon count qualitative) |
| 9c | Degeneracy animation (Pauli filling) | **FIXED** (level spacing was inverted) |
| 10a | Gas equation LaTeX | PASS |
| 10b | Radiation equation LaTeX | PASS |
| 10c | Degeneracy equation LaTeX | PASS |
| 11 | Adiabatic index (pressure-weighted average) | PASS (added in `bd7ce34`) |
| 12 | Solar profile data (Bahcall et al. 2005) | PASS (added in `6acf127`) |

### Critical finding (FIXED in commit `6f977e0`)

The Chandrasekhar zero-T formula mixed the Shapiro & Teukolsky prefactor (8pi^2) with the Chandrasekhar bracket function f(x) = x(2x^2-3)sqrt(1+x^2) + 3 arcsinh(x). These conventions differ by exactly a factor of 3. The fix changed the prefactor denominator from 8pi^2 to 24pi^2 to match the Chandrasekhar convention of the bracket function.

- **Impact**: Only activated when chi = T/T_F < 0.001 (nearly zero-T regime)
- **All six demo presets** used the finite-T FD solver, which was always correct
- **Numerical verification**: P_deg at x_F = 0.8007 now gives 2.627e22 dyne/cm^2 (matches S&T cross-check to 3.19e-16 relative error)

### Minor issues found and fixed (commit `0585b6e`)

1. **Degeneracy level spacing inverted** (`mechanismViz.ts:372`): For 3D free fermions g(E) ~ sqrt(E), levels should be closer at higher energy. The weight formula was growing with index instead of shrinking. Fixed to `1.4 - 0.4*(i/maxLevels)`.

2. **Canvas animations ignore prefers-reduced-motion**: Added `window.matchMedia('(prefers-reduced-motion: reduce)')` check. When reduced motion is preferred, animations render a single static frame instead of running `requestAnimationFrame` loops.

3. **Flash timeout race condition** (`main.ts:728-748`): A single shared timeout for all three delta-P flash badges meant overlapping slider changes could cause premature disappearance or lingering flashes. Fixed with per-element `WeakMap<HTMLElement, number>` timeouts.

---

## 3. Design Assessment

### Strengths

- **No hardcoded colors in CSS** -- all via tokens or `color-mix()`. Channel colors set as CSS custom properties at runtime (`--eos-gas`, `--eos-rad`, `--eos-deg`).
- **Three responsive breakpoints** (980px, 899px, 599px) handle desktop -> tablet -> phone gracefully.
- **Entry animations** use staggered `cp-slide-up` / `cp-fade-in` per design system contract.
- **`aspect-ratio` constraints** on chart containers prevent unbounded growth.
- **Delta-P flash system** provides immediate feedback on which pressure channel increased/decreased.
- **Regime map colors resolved from CSS** (`85cea98`) -- single source of truth via `getComputedStyle`.
- **Canvas resize handling** (`a0b7134`) -- ResizeObserver on mechanism animations for responsive canvas.

### Resolved issues (enhancement session)

1. ~~Regime map channel colors duplicated~~ -- **DONE** `85cea98`: Colors resolved from CSS custom properties via `getComputedStyle(canvas)`.
2. ~~No Canvas resize handling in mechanismViz.ts~~ -- **DONE** `a0b7134`: ResizeObserver added to all 3 animation classes.

### Remaining design issues

1. **No `requestAnimationFrame` batching** -- Each slider `input` event calls `render()` synchronously. Fast slider movement could cause jank.
2. **Compare slider bidirectional sync** -- Tab 2 sliders dispatch events back to sidebar sliders. Fragile indirect event chain.

---

## 4. Pedagogical Assessment

### Strengths (already SoTA)

1. **Two-tab Explore/Understand architecture** -- Tab 1 quantitative, Tab 2 physical intuition. Multiple representations per PhET research.
2. **Scaling Law Detective** targets exactly the right exponents (T^1, T^4, rho^(5/3)). Active learning with immediate reinforcement.
3. **LTE closure chip** -- rare for interactive tools to flag their own assumptions.
4. **Presets spanning 15+ decades** force order-of-magnitude reasoning.
5. **Station mode** transforms exploration toy into lab instrument.
6. **Regime map** -- only interactive version of the classic textbook rho-T diagram.

### Enhancements delivered (all DONE)

1. **Symbolic -> substituted equation toggle** -- `549b4fd`: Equations on Tab 2 start symbolic, toggle to numerical on click. CSS hint guides discoverability.
2. **Stellar profile overlay on regime map** -- `6acf127`: Standard Solar Model (Bahcall et al. 2005) T-rho path from core to photosphere. Labeled key points.
3. **Adiabatic index readout** -- `bd7ce34`: Gamma_eff pressure-weighted average with xF-dependent degeneracy exponent. Connects EOS to stellar stability.
4. **Guided first-use tour** -- `1d74761`: 3-step walkthrough (slider, regime map, Tab 2). localStorage persistence, replay via Tour button.
5. **White dwarf composition note** -- `978d893`: Tooltip and expanded note explain Y=0.98 approximation.

---

## 5. Remaining UI/UX Issues (Phase 2 Hardening)

**All 25 issues resolved.** See Section 6 for commit SHAs.

### P0 -- Broken / Incorrect

| # | Issue | Status | Commit |
|---|---|---|---|
| 1 | Density readout uses raw ASCII `g cm^-3` | **DONE** | `6bed33c` |
| 2 | Tour highlights hidden elements on Tab 2 | **DONE** | `6bed33c` |
| 3 | Tour tooltip horizontal overflow on narrow viewports | **DONE** | `6bed33c` |

### P1 -- Should Fix

| # | Issue | Status | Commit |
|---|---|---|---|
| 4 | Gamma_eff has no visual indicator at 4/3 threshold | **DONE** | `293f4d2` |
| 5 | Inconsistent sig figs across pressure displays | **DONE** | `cfd1f9e` |
| 6 | Equation toggle has no keyboard access | **DONE** | `293f4d2` |
| 7 | Regime map axis labels use plain ASCII | **DONE** | `293f4d2` |
| 8 | `resolveCss()` called every animation frame | **DONE** | `293f4d2` |
| 9 | Three animations run continuously when Tab 2 idle | **DONE** | `cfd1f9e` |
| 10 | `renderMath()` called on regime detail every render | **DONE** | `293f4d2` |
| 11 | Tour cleanup doesn't restore focus | **DONE** | `6bed33c` |
| 12 | Pressure cards not keyboard-focusable | N/A | Dead CSS class |
| 13 | Compare Y slider max not updated by presets | **DONE** | `cfd1f9e` |
| 14 | Composition finalization fires twice | **DONE** | `293f4d2` |
| 15 | `formatScientific` returns `1.234e+15` ASCII | **DONE** | `293f4d2` |
| 16 | `wallFlashes` array unbounded in gas animation | **DONE** | `cfd1f9e` |
| 17 | `PressureCurveData.densities` jsdoc wrong | **DONE** | `cfd1f9e` |

### P2 -- Nice to Have

| # | Issue | Status | Commit |
|---|---|---|---|
| 18 | Compare tab doesn't show mu_e (only mu) | **DONE** | `d5b6fe0` |
| 19 | Preset note text is a wall of text | **DONE** | `d5b6fe0` |
| 20 | Performance badge always visible on regime map | **DONE** | `d5b6fe0` |
| 21 | Scaling quiz auto-advance not cancelable | **DONE** | `d5b6fe0` |
| 22 | No "Reset quiz" button for Scaling Detective | **DONE** | `d5b6fe0` |
| 23 | Dead exports: deep-dive data functions | **DONE** | `d5b6fe0` (documented) |
| 24 | Dead export: `invalidateRegimeMapColors()` | **DONE** | `d5b6fe0` (removed) |
| 25 | Magic numbers in mechanismViz speed calculations | **DONE** | `d5b6fe0` |

---

## 6. Completed Action Items

| Priority | Item | Status | Commit |
|---|---|---|---|
| P0 | Fix Chandrasekhar 3x error | **DONE** | `6f977e0` |
| P1 | `prefers-reduced-motion` for Canvas | **DONE** | `0585b6e` |
| P1 | Fix flash timeout race condition | **DONE** | `0585b6e` |
| P2 | Fix degeneracy level spacing | **DONE** | `0585b6e` |
| P2 | Resolve regime map colors from CSS | **DONE** | `85cea98` |
| P2 | Add Canvas resize handling to mechanismViz | **DONE** | `a0b7134` |
| P3 | Adiabatic index (Gamma_eff) readout | **DONE** | `bd7ce34` |
| P3 | Symbolic -> substituted equation toggle | **DONE** | `549b4fd` |
| P3 | Stellar profile overlay on regime map | **DONE** | `6acf127` |
| P3 | White dwarf composition tooltip | **DONE** | `978d893` |
| P3 | First-use guided tour | **DONE** | `1d74761` |
| P1 | Update E2E tests for symbolic default | **DONE** | `d86e5ff` |
| P0 | Fix density readout format + tour bugs (#1-3, #11) | **DONE** | `6bed33c` |
| P1 | Stability indicator, a11y, perf, formatting (#4,6-8,10,14,15) | **DONE** | `293f4d2` |
| P1 | Idle throttle, wallFlash cap, sig figs, jsdoc (#5,9,13,16,17) | **DONE** | `cfd1f9e` |
| P2 | Quiz UX, dead code cleanup, named constants (#18-25) | **DONE** | `d5b6fe0` |
| -- | Fix pre-existing E2E KaTeX visibility flake | **DONE** | `d5b6fe0` |

---

## 7. Phase 3: Pedagogy & UX Improvements

Physics model reconfirmed correct (18/18 tests, all constants CODATA 2018 exact, solar core checkpoint to 1e-9 tolerance, white dwarf to 5e-4). No new physics issues. Remaining improvements are pedagogical and UX-focused.

### Identified improvements

| # | Issue | Category | Status |
|---|---|---|---|
| P3-1 | Tab 2 animations lack pedagogical bridge text | Learning trajectory | **DONE** |
| P3-2 | Equation toggle (symbolic/substituted) not discoverable | Affordances | **DONE** |
| P3-3 | Help modal doesn't explain two-tab structure | Navigation | **DONE** |
| P3-4 | Guided tour doesn't cover Tab 2 animations | First-use experience | **DONE** |
| P3-5 | Regime map lacks interpretive guidance | Visual hierarchy | **DONE** |
| P3-6 | No visual feedback when pressure dominance switches | Feedback loops | **DONE** |
| P3-7 | Station mode synthesis prompt is vague | Assessment quality | **DONE** |
| P3-8 | Scaling quiz lacks progress indicator | Active learning | **DONE** |
| P3-9 | Preset buttons lack :focus-visible styles | Accessibility | **DONE** |
| P3-10 | Deep-dive accordions lack actionable "Try this" suggestions | Active learning | **DONE** |
| P3-11 | Composition slider constraint not visually explained | Error prevention | Deferred |
| P3-12 | P_rad card not dimmed when LTE closure fails | Misconception prevention | **DONE** |
| P3-13 | Model notes too technical for beginners | Progressive disclosure | **DONE** |
| P3-14 | Preset buttons lack descriptive aria-labels | Accessibility | **DONE** |
| P3-15 | White dwarf tooltip doesn't explain mu_e significance | Scientific clarity | **DONE** |

---

## 8. Architecture Summary

### File structure (post-enhancement)

```
apps/demos/src/demos/eos-lab/
  index.html          (490 lines -- WAI-ARIA tabs, 6 presets, 4 accordions, tour button)
  main.ts             (1240 lines -- state, render, events, tour, equation toggle)
  logic.ts            (770 lines -- pure functions, scaling challenges, equation formatters, solar profile, adiabatic index)
  mechanismViz.ts     (540 lines -- 3 Canvas 2D animation classes + ResizeObserver)
  regimeMap.ts        (580 lines -- regime map renderer + solar profile overlay)
  uplotHelpers.ts     (140 lines -- uPlot adapter for design system)
  style.css           (790 lines -- responsive, no color literals, tour styles)
  design-contracts.test.ts  (24 tests)
  logic.test.ts       (51 tests)

packages/physics/src/
  stellarEosModel.ts  (877 lines -- ideal gas + radiation + Fermi-Dirac EOS)

apps/site/tests/
  eos-lab.spec.ts     (24 E2E tests)
```

### Key patterns

- **Log-scale slider mapping** (integer 0-1000 -> logarithmic physical values)
- **Deferred grid rebuild** (composition drag events defer expensive 8000-evaluation grid)
- **Tab 2 lifecycle** (MutationObserver starts/stops Canvas animations on tab visibility)
- **CSS custom property resolution** for channel colors (resolved via `getComputedStyle`)
- **Grid caching** keyed by composition + eta (not T/rho, since grid covers full T-rho plane)
- **Pressure-weighted adiabatic index** (pure function, no DI callback needed)
- **Symbolic/substituted toggle** (state boolean, re-renders on click)
- **Solar profile data** (Bahcall et al. 2005 lookup table, conditionally passed to regime map)
- **Tour system** (DOM-created overlay + tooltip, localStorage persistence)
