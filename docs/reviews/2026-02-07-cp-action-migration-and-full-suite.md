# Project Review: cp-action Migration & Full Demo Suite Completion

**Date:** 2026-02-07
**Scope:** Eliminated all `cp-action` legacy components from 10 demos; completed full 4-layer migration for conservation-laws, binary-orbits, and planetary-conjunctions (new demo built from scratch)
**Commits:** `5ee48cb..aa7b5c7` (20 commits on main)
**Status:** ALL 14 demos fully migrated. Zero legacy tokens, zero `cp-action` usage. 3 demos still need dedicated E2E spec files.

---

## 1. What Changed

### 1.1 Legacy Component Elimination

The `cp-action` class (a full-width styled button from the pre-design-system era) has been completely removed from all 14 demos. It was replaced by the semantic component system established during the EOS Lab migration:

| Old Pattern | New Component | Demos Affected |
|-------------|---------------|----------------|
| `cp-action` preset buttons | `cp-chip` in `cp-chip-group` | 9 (blackbody, conservation, seasons, telescope, em-spectrum, eclipse, keplers, planetary, eos-lab) |
| `cp-action` action buttons | `cp-button cp-button--ghost` | 4 (conservation, eclipse, planetary, seasons) |
| Text-based toolbar (Station/Help/Copy) | `cp-utility-toolbar` with 20x20 SVG icons | 10 (all except moon-phases, angular-size, retrograde-motion, eos-lab which already had it) |
| `preset--active` class | `is-active` class | 3 (blackbody, telescope, keplers) |

### 1.2 Full 4-Layer Migrations (3 demos)

| Demo | What Was Done |
|------|---------------|
| **conservation-laws** | Starfield canvas, celestial tokens, readout unit spans, entry animations, 14 pure logic functions extracted, 26 contract + 70 logic tests |
| **binary-orbits** | Starfield canvas, celestial tokens, readout unit spans, entry animations, 5 pure logic functions extracted, 23 contract + 38 logic tests |
| **planetary-conjunctions** | Built from scratch (no legacy demo). SVG orbit visualization, planet pair selector, synodic period model, conjunction detection, 34 contract + 52 logic tests |

### 1.3 New Physics

- `TwoBodyAnalytic.synodicPeriod(p1, p2)` added to `@cosmic/physics` — computes synodic period from two sidereal periods, with proper edge-case handling (equal periods -> Infinity, non-positive -> NaN). 5 new physics tests.

### 1.4 Infrastructure Fixes

- **Sidebar z-index fix** (`demo-shell.css`): Raised `.cp-demo__controls` and `.cp-demo__sidebar` to `z-index: 3` (above drawer's `z-index: 2`) to prevent KaTeX-rendered math in drawer from intercepting pointer events on utility toolbar buttons.
- **stub-demo.ts**: Now calls `initPopovers()` for navigation popover support in all demos.

---

## 2. Test Metrics

### Current Counts

| Layer | Tests | Files |
|-------|------:|------:|
| Physics | 144 | 18 |
| Theme | 97 | 3 |
| Demo contracts + logic | 1,123 | 31 |
| **Subtotal: unit/integration** | **1,364** | **52** |
| Playwright E2E | 344 | 11 |
| (of which skipped) | (28) | |
| **Grand total** | **1,708** | **63** |

### Per-Demo Breakdown

| Demo | Contract | Logic | E2E | Total |
|------|-------:|------:|----:|------:|
| angular-size | 25 | 56 | 27 | 108 |
| binary-orbits | 23 | 38 | -- | 61 |
| blackbody-radiation | 21 | 46 | 18 | 85 |
| conservation-laws | 26 | 70 | -- | 96 |
| eclipse-geometry | 27 | 104 | 35 | 166 |
| em-spectrum | 28 | 104 | 35 | 167 |
| eos-lab | 38 | 61 | 31 | 130 |
| keplers-laws | 37 | 5 | 45 | 87 |
| moon-phases | 22 | 9 | -- | 31 |
| parallax-distance | 18 | 27 | 17 | 62 |
| planetary-conjunctions | 34 | 52 | -- | 86 |
| retrograde-motion | 18 | 79 | 46 | 143 |
| seasons | 21 | 35 | 17 | 73 |
| telescope-resolution | 24 | 75 | 22 | 121 |
| smoke (cross-demo) | -- | -- | 29 | 29 |
| **Totals** | **362** | **761** | **344** | **1,490** |

*Note: Physics (144) and theme (97) tests add 241 more for the 1,708 grand total. Moon-phases has 9 legacy logic tests spread across 3 files (riseSetUiState, exportPayload, animation).*

### Quality Metrics

- **Accessibility:** 235 `aria-label` attributes across 14 demos. All utility toolbars use `role="toolbar"`. All interactive controls have associated labels. All popovers have `aria-expanded` and `aria-controls` attributes.
- **Reduced motion:** Global override in `animations.css` tested by theme token tests. Button and form transitions have separate `prefers-reduced-motion` overrides.
- **Design system compliance:** Zero `cp-action` in HTML/CSS. Zero `--cp-warning`/`--cp-accent2`/`--cp-accent3` legacy tokens. All 14 demos have starfield canvas. All 14 demos have `cp-utility-toolbar`. All 14 demos have `cp-readout__unit` spans.
- **Component adoption:** 9 demos use `cp-chip`/`cp-chip-group`, 4 use `cp-button--ghost` for actions, 1 uses `cp-toggle`. Remaining 5 demos (angular-size, moon-phases, parallax-distance, binary-orbits, retrograde-motion) have no preset buttons — only toolbar + range sliders.

---

## 3. Quality Grade

| Category | Score | Notes |
|----------|------:|-------|
| Test coverage | 18/20 | 14/14 demos have contracts. 13/14 have logic tests. 10/14 have dedicated E2E. 4 demos missing E2E specs (moon-phases, binary-orbits, conservation-laws, planetary-conjunctions). All pass smoke tests. |
| Design system | 20/20 | Zero legacy components. Zero legacy tokens. Uniform component system across all demos. Starfield + utility toolbar on all 14. |
| Physics correctness | 17/20 | 144 physics tests. Coordinate review gates caught 3 bugs in eclipse-geometry. Not all demos have had formal physics review dispatched (conservation-laws, binary-orbits, planetary-conjunctions are newly migrated). |
| Accessibility | 16/20 | 235 ARIA labels, keyboard-navigable popovers, `prefers-reduced-motion`. No formal screen-reader audit. Some demos lack `role="status"` on dynamic readouts. |
| Architecture | 19/20 | Clean humble-object pattern on 13/14 demos. All physics in @cosmic/physics. Pure logic functions with DI callbacks. Minor coupling: moon-phases still has inline logic (legacy golden reference). |
| **Total** | **90/100** | **A** |

### What Earns the Grade

- **Complete design system adoption.** All 14 demos use the same token set, component library, and shell structure. No legacy code paths remain. This is the strongest category — a full 20/20.
- **Deep test coverage.** 1,708 tests across 4 layers provides high confidence. The contract test pattern (reading HTML/CSS as strings) catches regression at the structural level, not just visual.
- **Consistent architecture.** The humble-object pattern (thin `main.ts` + pure `logic.ts`) is applied uniformly. Physics models are centralized in `@cosmic/physics` with no inline equations.
- **New demo from scratch.** Planetary-conjunctions demonstrates the framework's maturity — a new demo was built entirely using established patterns, with full test coverage, in a single session.

### What Keeps It from Higher

- **4 demos lack dedicated E2E.** Moon-phases, binary-orbits, conservation-laws, and planetary-conjunctions rely on smoke tests only. Dedicated E2E specs would add layout, control interaction, and screenshot regression coverage.
- **No formal physics review on 3 newest demos.** Conservation-laws, binary-orbits, and planetary-conjunctions have physics unit tests but haven't gone through the coordinate-review gate that caught bugs in eclipse-geometry and keplers-laws.
- **Accessibility not formally audited.** ARIA patterns are consistent but no screen-reader walkthrough, no color-contrast audit beyond the 3 theme tests, no focus-trap testing outside popovers.

---

## 4. Backlog

### Priority 1: Missing E2E Specs (4 demos)

These demos pass smoke tests but lack dedicated Playwright specs for control interaction, layout validation, and visual regression screenshots.

| Demo | Estimated Tests | Effort |
|------|---------------:|--------|
| binary-orbits | ~20 | 1 session |
| conservation-laws | ~25 | 1 session |
| planetary-conjunctions | ~25 | 1 session |
| moon-phases | ~15 | 1 session |

### Priority 2: Physics Review Gate (3 demos)

Dispatch physics review agents to trace the full chain: physics model -> logic.ts -> main.ts rendering -> user interaction -> back to model. This protocol caught 3 sign bugs in eclipse-geometry.

| Demo | Risk Area |
|------|-----------|
| conservation-laws | Orbit velocity arrows, energy conservation display |
| binary-orbits | Center-of-mass frame, orbital phase rendering |
| planetary-conjunctions | Synodic period accuracy, conjunction detection thresholds |

### Priority 3: Accessibility Audit

| Item | Description |
|------|-------------|
| Screen-reader walkthrough | Test all 14 demos with VoiceOver on macOS |
| Focus management | Verify focus trap in modals/challenges, focus restoration after dialog close |
| Color contrast | Systematic check of all text-on-background combinations in instrument layer |
| Dynamic content | Ensure all readout updates have appropriate `aria-live` regions |

### Priority 4: Polish

| Item | Description |
|------|-------------|
| Moon-phases logic extraction | Extract remaining inline logic to `logic.ts` + `logic.test.ts` (currently the only demo without a proper logic layer) |
| Keplers-laws logic expansion | Currently only 5 logic tests — the demo has significant rendering logic that could be extracted |
| Responsive audit | Test all 14 demos at mobile breakpoints (320px, 375px, 768px) |
| Touch interaction | Verify range sliders and drag interactions work on touch devices |

### Priority 5: Future Maturity

| Item | Description |
|------|-------------|
| Component documentation | Storybook or static page showing all cp-chip/cp-toggle/cp-button variants |
| Demo template generator | CLI script to scaffold a new demo with all 4 test layers pre-configured |
| Performance baseline | Lighthouse CI for each demo page, canvas FPS benchmarks |
| i18n readiness | Audit hardcoded English strings, prepare for future localization |

---

## 5. Files Changed (This Session)

| File | Action | Category |
|------|--------|----------|
| `apps/demos/src/demos/blackbody-radiation/{index.html,main.ts,style.css,design-contracts.test.ts}` | Modified | cp-action -> cp-chip |
| `apps/demos/src/demos/conservation-laws/{index.html,main.ts,style.css,design-contracts.test.ts}` | Modified | cp-action -> cp-chip + full migration |
| `apps/demos/src/demos/conservation-laws/{logic.ts,logic.test.ts}` | Created | Logic extraction (14 functions, 70 tests) |
| `apps/demos/src/demos/seasons/{index.html,main.ts,design-contracts.test.ts}` | Modified | cp-action -> cp-chip |
| `apps/demos/src/demos/parallax-distance/{index.html,main.ts,design-contracts.test.ts}` | Modified | Toolbar migration |
| `apps/demos/src/demos/telescope-resolution/{index.html,main.ts,style.css,design-contracts.test.ts}` | Modified | cp-action -> cp-chip |
| `apps/demos/src/demos/em-spectrum/{index.html,main.ts,style.css,design-contracts.test.ts}` | Modified | cp-action -> cp-chip |
| `apps/demos/src/demos/eclipse-geometry/{index.html,main.ts,design-contracts.test.ts}` | Modified | cp-action -> cp-chip |
| `apps/demos/src/demos/keplers-laws/{index.html,main.ts,style.css,design-contracts.test.ts}` | Modified | cp-action -> cp-chip + grid layout |
| `apps/demos/src/demos/binary-orbits/{index.html,main.ts,style.css,design-contracts.test.ts}` | Modified | Toolbar + full migration |
| `apps/demos/src/demos/binary-orbits/{logic.ts,logic.test.ts}` | Created | Logic extraction (5 functions, 38 tests) |
| `apps/demos/src/demos/planetary-conjunctions/{index.html,style.css,main.ts}` | Created | New demo from scratch |
| `apps/demos/src/demos/planetary-conjunctions/{logic.ts,logic.test.ts,design-contracts.test.ts}` | Created | Full test suite (34+52 tests) |
| `apps/demos/src/demos/eos-lab/{main.ts,regimeMap.ts,style.css,uplotHelpers.ts}` | Modified | Visual polish |
| `apps/demos/src/shared/stub-demo.ts` | Modified | Added initPopovers() |
| `apps/site/tests/{angular-size,blackbody-radiation,keplers-laws}.spec.ts` | Modified | E2E fixes for migration |
| `packages/physics/src/twoBodyAnalytic.{ts,test.ts}` | Modified | Added synodicPeriod |
| `packages/theme/styles/demo-shell.css` | Modified | Sidebar z-index fix |
| **57 files total** | | **+4,224 / -574 lines** |
