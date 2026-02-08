# Project Review: EOS Lab UX Hardening

**Date:** February 7, 2026
**Scope:** EOS Lab visual bug fixes (3), interactivity improvements (3), Vite dev-server fix, null-safety hardening
**Commit:** `c722a2f`
**Status:** All tests pass. No regressions.

---

## What Changed

### Bug fixes

| Fix | Files | Summary |
|-----|-------|---------|
| Vite publicDir | vite.config.ts | Added `publicDir` so KaTeX CSS loads in dev server (was 404) |
| uPlot canvas background | style.css | `background: var(--cp-bg0)` on `.pressure-plot__surface canvas` eliminates transparent-canvas checkerboard |
| Log-scale tick thinning | main.ts | `logTickValues` auto-steps by 2 or 3 decades when range produces >7 or >12 labels |
| Regime map legend overlap | index.html, style.css | Replaced KaTeX `$P_{\rm gas}$` with native `<i>P</i><sub>gas</sub>` for compact flex layout; adjusted grid gap |

### Interactivity improvements

| Feature | Files | Summary |
|---------|-------|---------|
| Drag-to-zoom on pressure curves | main.ts | Enabled `cursor.drag: { x: true, y: true }`; double-click resets to full range |
| Click-to-set on regime map | main.ts, regimeMap.ts | `canvasToLogCoords()` inverse mapping; click sets T/rho with live-region announcement |
| Hover tooltip on regime map | main.ts, style.css | Amber monospace tooltip tracks cursor; edge-aware flip prevents overflow |

### Safety hardening

| Fix | Files | Summary |
|-----|-------|---------|
| Null-safe preset state | main.ts | `selectedPresetId` now `Preset["id"] | null`; guards in `renderPresetState()`, `exportResults()`, `getSnapshotRow()` |

---

## Test Metrics

### Current counts (unchanged from previous audit)

| Layer | Tests | Files |
|-------|------:|------:|
| Physics | 144 | 18 |
| Theme | 97 | 3 |
| Demo contracts + logic | 1,123 | 31 |
| **Subtotal: unit/integration** | **1,364** | **52** |
| Playwright E2E | 322 | 11 |
| (of which skipped) | (28) | |
| **Grand total** | **1,686** | **63** |

Test count unchanged — this session modified 1 contract test assertion (KaTeX → HTML) but added no new tests.

### Design system compliance

- **Legacy tokens:** 0 remaining
- **Legacy components:** 0 `cp-action` remaining
- **Contract test suites:** 14/14 demos
- **Color literal violations:** 0 (removed `#0e1117` fallback from canvas CSS)

---

## Quality Grade

| Category | Score | Delta | Notes |
|----------|------:|:-----:|-------|
| Test coverage | 18 | — | Same as previous. 3 demos still missing E2E. |
| Design system | 20 | — | Zero legacy tokens/components. Legend KaTeX→HTML change maintains compliance. |
| Physics correctness | 18 | — | No new physics reviews. `canvasToLogCoords()` correctly inverts y-axis (verified manually). |
| Accessibility | 17 | — | New live-region announcement on regime-map click. Crosshair cursor hint. Same gaps remain (tour Escape key, contrast). |
| Architecture | 19 | — | `canvasToLogCoords()` cleanly exported from regimeMap.ts. Null-safe state type. |

**Total: 92/100 = A** (unchanged)

### What this session improved (within the grade)

- **Discoverability:** Regime map is now interactive (click + hover) instead of passive display. Students can point-and-click to explore stellar regimes.
- **Readability:** Thinned log-scale labels prevent crowding. Dark canvas background eliminates transparency artifact.
- **Robustness:** Null-safe preset state prevents runtime crashes when using custom (non-preset) T/rho values.
- **Dev experience:** Vite publicDir fix means KaTeX renders correctly in dev server, not just production.

### What would raise the grade

Same as previous audit:
1. E2E specs for binary-orbits, conservation-laws, planetary-conjunctions (+1 test coverage → 19)
2. Physics reviews for geometry-heavy demos (+1 physics → 19)
3. WCAG contrast audit + tour Escape-key fix (+1 accessibility → 18)

---

## Backlog (unchanged priorities)

| Priority | Item | Status |
|:--------:|------|--------|
| P1 | E2E specs for 3 remaining demos | Not started |
| P2 | Physics reviews for geometry-heavy demos | 2/14 done |
| P3 | Accessibility audit (WCAG AA, reduced-motion) | Not started |
| P4 | Performance (Web Worker for regime grid, rAF throttle) | Not started |
| P5 | Review documentation for remaining 12 demos | Not started |

---

## Files Changed (this session)

| File | Action | Summary |
|------|--------|---------|
| `apps/demos/vite.config.ts` | Modified | Added `publicDir` |
| `apps/demos/src/demos/eos-lab/style.css` | Modified | Canvas bg, legend fix, tooltip CSS |
| `apps/demos/src/demos/eos-lab/index.html` | Modified | Legend: KaTeX → HTML `<sub>` |
| `apps/demos/src/demos/eos-lab/main.ts` | Modified | Tick thinning, drag-zoom, click/hover, null guards |
| `apps/demos/src/demos/eos-lab/regimeMap.ts` | Modified | Added `canvasToLogCoords()` |
| `apps/demos/src/demos/eos-lab/design-contracts.test.ts` | Modified | Updated legend assertion |
