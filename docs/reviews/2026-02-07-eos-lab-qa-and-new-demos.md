# Project Review: EOS Lab QA + New Demo Migrations

**Date:** February 7, 2026
**Scope:** EOS Lab Tab 1 visual QA (4 fixes), conservation-laws full migration, binary-orbits full migration, planetary-conjunctions full implementation, project-wide quality audit
**Commits:** `1f832d6`..`d36ffc0` (8 commits)
**Status:** All 14 demos fully migrated. Zero legacy tokens. Zero legacy `cp-action` components. 3 demos awaiting E2E specs.

---

## What Changed

### EOS Lab Tab 1 QA (4 commits)

| Fix | Files | Summary |
|-----|-------|---------|
| Accordion overflow | style.css | `max-height` + `overflow-y: auto` on `.cp-accordion__body` inside sidebar (12rem outer, 9rem nested) |
| uPlot pressure curve readability | main.ts, uplotHelpers.ts, style.css | Axis font 11px->13px, text opacity 0.6->0.78, Y-axis gutter 72->84, Y-axis floor 1e-10->1e5, plot background 2%->6% |
| Regime map Canvas text | regimeMap.ts | Region labels 11->15px bold, tick labels 10->12px, axis labels 11->13px, padding adjustment |
| Visual polish | style.css | Border-radius on regime map surface, legend swatches 0.9->1rem, monospace readout on #regimeDetail |

### New demo migrations (3 commits)

| Demo | Type | Contract tests | Logic tests | logic.ts |
|------|------|---------------:|------------:|---------:|
| conservation-laws | Full 4-layer migration | 26 | 70 | New (extracted from main.ts) |
| binary-orbits | Full 4-layer migration | 23 | 38 | New (extracted from main.ts) |
| planetary-conjunctions | Full implementation | 34 | 52 | New (plus new physics model in @cosmic/physics) |

All three gained starfield, celestial tokens, readout unit separation, cp-chip/cp-utility-toolbar components, and entry animations.

### EOS Lab competitive analysis review

Three-agent review (code quality, science correctness, coordinate audit) compiled into `docs/reviews/eos-lab.md`. 22 science checks all correct, 8 rendering chains verified, zero critical issues.

---

## Test Metrics

### Current counts

| Layer | Tests | Files |
|-------|------:|------:|
| Physics | 144 | 18 |
| Theme | 97 | 3 |
| Demo contracts + logic | 1,123 | 31 |
| **Subtotal: unit/integration** | **1,364** | **52** |
| Playwright E2E | 322 | 11 |
| (of which skipped) | (28) | |
| **Grand total** | **1,686** | **63** |

### Per-demo breakdown

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
| **Totals** | **362** | **761** | **293** | **1,416** |

(E2E total includes 29 smoke tests not attributed to individual demos.)

### Quality metrics

- **Design system compliance:** All 14 demos have contract tests verifying token usage, starfield presence, no color literals, and readout typography. Zero legacy token aliases (`--cp-warning`, `--cp-accent2`, `--cp-accent3`) remain.
- **Component system:** All 14 demos use `cp-utility-toolbar`. 9 demos use `cp-chip`. Zero `cp-action` legacy components remain anywhere.
- **Starfield:** 14/14 demos have `<canvas class="cp-starfield">` in HTML and `initStarfield()` in main.ts.
- **Readout units:** 14/14 demos have `.cp-readout__unit` spans.
- **Entry animations:** 14/14 demos have `cp-slide-up`/`cp-fade-in` in style.css.
- **Logic extraction:** 13/14 demos have `logic.ts` with pure function extraction. moon-phases uses a different test structure (4 specialized test files instead of one logic.ts).
- **Reviews completed:** 2 demo reviews (retrograde-motion, eos-lab) + 1 project-wide audit (component consolidation).

---

## Quality Grade

| Category | Score | Notes |
|----------|------:|-------|
| Test coverage | 18 | All 14 demos have contract + logic tests. 11/14 have E2E. 3 demos missing E2E (binary-orbits, conservation-laws, planetary-conjunctions). moon-phases has minimal logic tests (9). |
| Design system | 20 | Zero legacy tokens. Zero legacy components. 14/14 starfield. 14/14 readout units. 14/14 entry animations. Full cp-chip/cp-utility-toolbar adoption. |
| Physics correctness | 18 | 2 full science reviews done (retrograde-motion, eos-lab). All audited chains correct. 12 demos have not yet had formal physics review — unit tests cover formulas but coordinate convention audits are missing. |
| Accessibility | 17 | All demos have ARIA labels, keyboard navigation, live regions. Minor gaps: eos-lab tour has no Escape-key dismiss; one CSS animation missing `prefers-reduced-motion` check; older demos not formally audited. |
| Architecture | 19 | Clean humble-object pattern in 13/14 demos. Pure logic.ts extraction. All physics in @cosmic/physics. DI patterns for testing. Minor: some pure functions still in main.ts (eos-lab has 5 label-mapping functions in main.ts). |

**Total: 92/100 = A**

### What earns the grade

- **Complete design system compliance.** Zero legacy tokens and zero legacy components across all 14 demos. This is a clean codebase with no technical debt in the design layer.
- **Deep test coverage.** 1,686 tests across 63 files covering physics models, design contracts, logic extraction, and end-to-end interaction. Every demo has at least 31 tests.
- **Rigorous physics verification.** Two demos (retrograde-motion, eos-lab) have had full three-agent review with science correctness, coordinate audit, and code quality checks — finding zero critical issues.
- **Consistent architecture.** The humble-object pattern (pure logic.ts + thin main.ts wiring) is applied uniformly. Physics models always come from @cosmic/physics.

### What keeps it from higher

- **3 demos missing E2E specs.** binary-orbits, conservation-laws, and planetary-conjunctions have contract + logic tests but no Playwright E2E tests yet.
- **12 demos without formal physics review.** Only retrograde-motion and eos-lab have had the three-agent review. Demos with coordinate systems (eclipse-geometry, keplers-laws, seasons) would benefit from formal coordinate audits.
- **Minor accessibility gaps.** No formal WCAG audit across the full suite. Known issues in eos-lab (tour Escape key, `dominance-pulse` animation, `opacity: 0.55` contrast).

---

## Backlog

### Priority 1: Missing E2E test suites

Three demos need Playwright E2E specs to match the testing standard of the other 11.

| Demo | Contract | Logic | E2E needed | Effort |
|------|-------:|------:|:----------:|:------:|
| binary-orbits | 23 | 38 | Yes | Medium |
| conservation-laws | 26 | 70 | Yes | Medium |
| planetary-conjunctions | 34 | 52 | Yes | Medium |

### Priority 2: Physics reviews for geometry-heavy demos

Coordinate convention bugs pass unit tests (proven by eclipse-geometry history). These demos warrant formal three-agent reviews.

| Demo | Has coordinate systems | Risk level |
|------|:---------------------:|:----------:|
| eclipse-geometry | Yes (dual-panel SVG, angles) | High |
| keplers-laws | Yes (orbit SVG + Canvas hybrid, drag) | High |
| seasons | Yes (dual-panel SVG, tilt geometry) | Medium |
| angular-size | Yes (SVG geometry) | Medium |
| parallax-distance | Yes (SVG parallax) | Medium |
| binary-orbits | Yes (SVG orbits) | Medium |
| planetary-conjunctions | Yes (SVG orbits) | Medium |

### Priority 3: Accessibility audit

| Item | Scope | Effort |
|------|-------|:------:|
| WCAG AA contrast audit across all demos | All 14 | Medium |
| `prefers-reduced-motion` audit for custom CSS animations | All 14 | Small |
| Keyboard navigation audit (Tab order, focus traps) | All 14 | Medium |
| Tour Escape-key dismiss | eos-lab | Small |

### Priority 4: Performance optimization

| Item | Demo | Effort |
|------|------|:------:|
| Web Worker for `evaluateRegimeGrid` (8,000-point blocking evaluation) | eos-lab | Medium |
| `requestAnimationFrame` throttle on slider `render()` calls | eos-lab | Small |
| Cache `pressureCurveData` when only composition changes | eos-lab | Small |

### Priority 5: Review documentation

| Item | Effort |
|------|:------:|
| Demo reviews for remaining 12 demos | Large (12 reviews) |
| Component documentation / style guide | Medium |
| Architecture decision records (ADRs) | Medium |

---

## Files Changed (this session)

| File | Action | Lines |
|------|--------|------:|
| `apps/demos/src/demos/eos-lab/style.css` | Modified | 837 |
| `apps/demos/src/demos/eos-lab/main.ts` | Modified | 1,394 |
| `apps/demos/src/demos/eos-lab/uplotHelpers.ts` | Modified | 141 |
| `apps/demos/src/demos/eos-lab/regimeMap.ts` | Modified | 555 |
| `apps/demos/src/demos/conservation-laws/index.html` | Modified | -- |
| `apps/demos/src/demos/conservation-laws/main.ts` | Modified | -- |
| `apps/demos/src/demos/conservation-laws/style.css` | Modified | -- |
| `apps/demos/src/demos/conservation-laws/logic.ts` | Created | -- |
| `apps/demos/src/demos/conservation-laws/logic.test.ts` | Created | -- |
| `apps/demos/src/demos/conservation-laws/design-contracts.test.ts` | Modified | -- |
| `apps/demos/src/demos/binary-orbits/index.html` | Modified | -- |
| `apps/demos/src/demos/binary-orbits/main.ts` | Modified | -- |
| `apps/demos/src/demos/binary-orbits/style.css` | Modified | -- |
| `apps/demos/src/demos/binary-orbits/logic.ts` | Created | -- |
| `apps/demos/src/demos/binary-orbits/logic.test.ts` | Created | -- |
| `apps/demos/src/demos/binary-orbits/design-contracts.test.ts` | Created | -- |
| `apps/demos/src/demos/planetary-conjunctions/index.html` | Modified | -- |
| `apps/demos/src/demos/planetary-conjunctions/main.ts` | Modified | -- |
| `apps/demos/src/demos/planetary-conjunctions/style.css` | Modified | -- |
| `apps/demos/src/demos/planetary-conjunctions/logic.ts` | Created | -- |
| `apps/demos/src/demos/planetary-conjunctions/logic.test.ts` | Created | -- |
| `apps/demos/src/demos/planetary-conjunctions/design-contracts.test.ts` | Created | -- |
| `packages/physics/src/twoBodyAnalytic.ts` | Modified | -- |
| `packages/physics/src/twoBodyAnalytic.test.ts` | Modified | -- |
| `docs/reviews/eos-lab.md` | Created | 212 |
| `docs/reviews/README.md` | Modified | 22 |
