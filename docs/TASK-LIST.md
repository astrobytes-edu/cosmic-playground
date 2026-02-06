# Cosmic Playground Task List

> **Generated:** 2026-02-05
> **Purpose:** Comprehensive TODO tracking for demo migration, improvements, and fixes

---

## ⚠️ CRITICAL: Migration Quality Problem

**The existing "migrated" demos cannot be trusted.** Many were:
- Incomplete implementations
- Poorly written rewrites (not actual migrations)
- Missing features from the legacy versions
- Not validated against the original demos

**Every demo needs side-by-side validation against the legacy version before it can be considered "done."**

---

## Executive Summary

| Category | Count | Status |
|----------|-------|--------|
| **Demos with code (needs validation)** | 12 | 🔴 **UNTRUSTED** |
| **Stub Demos (needs full implementation)** | 1 | 🔴 Not started |
| **Missing Demos (needs migration)** | 3 | 🔴 Not started |
| **Cross-cutting hardening TODOs** | ~15 | 🟡 Various |

**Legacy demos location:** `~/Teaching/astr101-sp26/demos/` (NOT currently mounted—need access to validate)

---

## Priority 0: Demo Validation Against Legacy (ALL DEMOS)

**Every demo with code must be validated against the legacy version.** This is blocking for all other work.

### Validation Protocol (per demo)

For each demo, open legacy and new side-by-side and verify:

1. **Feature parity**
   - [ ] All controls from legacy exist in new
   - [ ] All readouts/outputs from legacy exist in new
   - [ ] All modes (Station, Challenge, Math Mode) that existed in legacy are present
   - [ ] Presets/datasets match legacy

2. **Physics correctness**
   - [ ] Same inputs → same outputs (within numerical tolerance)
   - [ ] Edge cases handled identically
   - [ ] Units match (or are explicitly converted)

3. **UI/UX fidelity**
   - [ ] Visual appearance is acceptable (doesn't need to be identical, but should be equivalent)
   - [ ] Interactions work the same way
   - [ ] Keyboard/accessibility at least as good as legacy

4. **Exports**
   - [ ] Export format matches expectations
   - [ ] All parameters and readouts included

### Demo Validation Status

| Demo | Legacy Comparison | Feature Parity | Physics OK | UI OK | Exports OK | Notes |
|------|-------------------|----------------|------------|-------|------------|-------|
| `angular-size` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `binary-orbits` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | Known: station card refs missing features |
| `blackbody-radiation` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | Math Mode deferred |
| `conservation-laws` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `eclipse-geometry` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `em-spectrum` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `keplers-laws` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `moon-phases` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | Doesn't use @cosmic/physics |
| `parallax-distance` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `retrograde-motion` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | No station mode |
| `seasons` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | |
| `telescope-resolution` | ❓ Not done | ❓ | ❓ | ❓ | ❓ | Challenge disabled, Math Mode deferred |

### To start validation:
1. Mount legacy folder: `~/Teaching/astr101-sp26/demos/`
2. For each demo, run legacy and new simultaneously
3. Document discrepancies
4. Fix or file as known limitation

---

## Priority 1: Migration Dashboard Correction

The current dashboard is misleading. Update it to reflect:

- [ ] **`telescope-resolution`** — Mark as **Interactive** (not Stub). It has full UI, PSF rendering, atmosphere/AO controls, and exports v1.
- [ ] **`retrograde-motion`** — Add to manifest and dashboard. It's a fully working 745-line demo with Keplerian motion model.
- [ ] **`planetary-conjunctions`** — This is the **only true stub** (8 lines using `initStubDemo`).

---

## Priority 2: Missing Demo Migrations (🔴 Blocking for completeness)

These 3 demos exist in the legacy repo (`~/Teaching/astr101-sp26/demos/`) but have **no code** in this repo yet.

### 2.1 `doppler-shift-spectrometer`
- **Legacy:** Uses shared spectra dataset + Doppler model
- **Status:** `demo_status: missing` in manifest
- **Tasks:**
  - [ ] Create `packages/physics/src/dopplerShiftModel.ts` with vitest tests
  - [ ] Create `packages/data-spectra/` module (or extend existing) for spectra dataset
  - [ ] Implement demo UI in `apps/demos/src/demos/doppler-shift-spectrometer/`
  - [ ] Wire instrument runtime, exports v1, station mode
  - [ ] Add site content (`.md` files for learning goals, instructor notes)

### 2.2 `spectral-lines-lab`
- **Legacy:** Uses atomic/molecular datasets + spectra data contract
- **Status:** `demo_status: missing` in manifest
- **Tasks:**
  - [ ] Import/create spectra data contract documentation
  - [ ] Create atomic line datasets in `packages/data-spectra/`
  - [ ] Implement demo UI in `apps/demos/src/demos/spectral-lines-lab/`
  - [ ] Wire instrument runtime, exports v1
  - [ ] Add site content

### 2.3 `planetary-climate-sandbox`
- **Legacy:** Uses energy-balance model + planet presets dataset
- **Status:** `demo_status: missing` in manifest
- **Tasks:**
  - [ ] Create `packages/physics/src/planetaryClimateModel.ts` with vitest tests
    - Equilibrium temperature
    - Greenhouse effect (single-layer approx)
    - Albedo effects
  - [ ] Create planet presets module (static, not fetched)
  - [ ] Implement demo UI in `apps/demos/src/demos/planetary-climate-sandbox/`
  - [ ] Wire instrument runtime, exports v1, station mode
  - [ ] Add site content

---

## Priority 3: Stub Demo Completion

### 3.1 `planetary-conjunctions` (the only true stub)
- **Current:** 8 lines using `initStubDemo`
- **Tasks:**
  - [ ] Define scope (ASTR101-only? synodic period + conjunction geometry?)
  - [ ] Create `packages/physics/src/planetaryConjunctionsModel.ts`
    - Synodic period calculation
    - Conjunction/opposition geometry
    - Elongation angles
  - [ ] Replace `initStubDemo` with real instrument wiring
  - [ ] Add station mode with snapshot columns
  - [ ] Add site content

---

## Priority 4: Cross-Cutting Hardening (All Demos)

### 4.1 Accessibility
- [ ] Add `aria-atomic="true"` to `#status` in **all** demo `index.html` files:
  - `angular-size` ❌
  - `binary-orbits` ❌
  - `blackbody-radiation` ❌
  - `conservation-laws` ❌
  - `eclipse-geometry` ❌
  - `em-spectrum` ❌
  - `keplers-laws` ❌
  - `moon-phases` ❌
  - `parallax-distance` ❌
  - `retrograde-motion` ❌
  - `seasons` ❌
  - `telescope-resolution` ❌
- [ ] Tighten `scripts/validate-play-dirs.mjs` to require `aria-atomic="true"` on status elements

### 4.2 Content Alignment
- [ ] Verify site content matches instrument UI for each demo:
  - Learning goals/misconceptions in `apps/site/src/content/demos/<slug>.md`
  - Instructor references in `apps/site/src/content/instructor/<slug>/*`
  - Station mode columns in `apps/site/src/content/stations/<slug>.md`
  - **Known issue:** `binary-orbits` station card references eccentricity and velocity vectors not in current UI

### 4.3 Demo Contract Checklist
- [ ] Add "per-demo contract checklist" section to each demo's `model_notes`:
  - Assumptions
  - Units (explicit!)
  - Known limitations/approximations

### 4.4 Test Coverage
- [ ] Expand Playwright smoke tests to cover exports for **each** interactive demo (not just pilot)
- [ ] Ensure `CP_BASE_PATH=/cosmic-playground/` works for all tests

---

## Priority 5: Physics Model Validation (SoTA)

From `docs/backlog.md`:

### 5.1 Cross-Check Infrastructure
- [ ] Add high-confidence numeric cross-check suite (dense parameter sweeps vs independent implementation)
- [ ] Implement "reference" helpers that are independent of production code paths
- [ ] Add stress tests for numerical stability (large/small/edge-case inputs)

### 5.2 Model-by-Model Validation

| Model | Key Validation Tasks |
|-------|---------------------|
| `AngularSizeModel` | Dense sweep monotonicity, small-angle limit cross-check |
| `PhotonModel` | λ→ν→λ closure, benchmark points (radio, optical, X-ray) |
| `BlackbodyRadiationModel` | Wien scaling validation, Planck integral consistency |
| `ParallaxDistanceModel` | Inverse consistency, Infinity behavior for p≤0 |
| `TelescopeResolutionModel` | J1 approximation cross-check, Airy normalization |
| `EclipseGeometryModel` | Threshold angle smoothness, umbra radius sign flip |
| `SeasonsModel` | Bound checks (δ, day length, noon altitude) |
| `TwoBodyAnalytic` | Anomaly conversion dense grid, orbit element extraction |
| `KeplersLawsModel` | Period scaling regression, vis-viva consistency |
| `ConservationLawsModel` | Conic equation satisfaction within tolerance |
| `RetrogradeMotionModel` | Far-past/future stability, stationary refinement tolerance |

---

## Priority 6: Architecture & Infrastructure

### 6.1 Runtime Package Testing
- [ ] Add unit tests for `@cosmic/runtime` (currently untested per audit)
- [ ] Test `createInstrumentRuntime()`, `createDemoModes()`, export utilities

### 6.2 Demo Code Documentation
- [ ] Add inline comments to demo `main.ts` files explaining:
  - State management approach
  - Rendering pipeline
  - Physics model integration points

### 6.3 Shared UI Component Extraction (Later)
- [ ] Identify common UI patterns across demos (sliders, readouts, modals)
- [ ] Consider extracting to shared component library

### 6.4 Dashboard Generator Script (Optional)
- [ ] Create script that scans:
  - `apps/demos/src/demos/*` (stub vs interactive detection)
  - `apps/site/src/content/demos/*` (metadata presence)
  - Writes updated status table to migration dashboard

---

## Priority 7: Demo-Specific Fixes

### 7.1 `moon-phases`
- [ ] Decide: port core moon-phase geometry into `packages/physics` (with tests) OR keep demo-local with targeted tests

### 7.2 `binary-orbits`
- [ ] Decide: add Challenge mode OR keep station-only
- [ ] Fix station card references to features not in UI (eccentricity, velocity vectors)

### 7.3 `blackbody-radiation`
- [ ] Decide on Math Mode UI (currently deferred)

### 7.4 `telescope-resolution`
- [ ] Consider reintroducing Math Mode (legacy had it)
- [ ] Verify Challenge mode is properly disabled or implement it

---

## Priority 8: Build & Deployment

### 8.1 Current Build Gates (must stay green)
```bash
corepack pnpm build
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

### 8.2 CI/CD Improvements
- [ ] Add demo-specific smoke tests to CI
- [ ] Consider visual regression testing for canvas/SVG outputs

---

## Quick Reference: Demo Status Matrix

| Demo | Lines | Has Code | Validated | Trusted | Notes |
|------|-------|----------|-----------|---------|-------|
| `angular-size` | 982 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `binary-orbits` | 392 | ✅ | ❌ | ❌ | Station card refs missing features |
| `blackbody-radiation` | 500 | ✅ | ❌ | ❌ | Math Mode missing vs legacy |
| `conservation-laws` | 709 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `eclipse-geometry` | 1297 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `em-spectrum` | 547 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `keplers-laws` | 667 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `moon-phases` | 1083 | ✅ | ❌ | ❌ | Doesn't use @cosmic/physics |
| `parallax-distance` | 393 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `retrograde-motion` | 745 | ✅ | ❌ | ❌ | No station mode |
| `seasons` | 759 | ✅ | ❌ | ❌ | Needs legacy comparison |
| `telescope-resolution` | 586 | ✅ | ❌ | ❌ | Challenge disabled, Math Mode deferred |
| `planetary-conjunctions` | 8 | 🟡 Stub | — | ❌ | Needs implementation |
| `doppler-shift-spectrometer` | 0 | ❌ | — | ❌ | Needs migration |
| `spectral-lines-lab` | 0 | ❌ | — | ❌ | Needs migration |
| `planetary-climate-sandbox` | 0 | ❌ | — | ❌ | Needs migration |

**Legend:** ✅ = Yes, ❌ = No/Not done, 🟡 = Partial

---

## Notes

1. **Legacy demos location:** `~/Teaching/astr101-sp26/demos/` (not currently mounted in this session)
2. **If you need to compare with legacy:** Mount that folder and run side-by-side comparisons
3. **Physics models are solid:** Audit score 8.5/10 for `packages/physics`
4. **Demo code needs documentation:** Most `main.ts` files lack inline comments

---

## Recommended Immediate Actions

1. **🔴 Mount legacy folder** (`~/Teaching/astr101-sp26/demos/`) — BLOCKING for all validation
2. **🔴 Validate each demo against legacy** — document what's broken/missing/wrong
3. **🔴 Fix broken demos** — prioritize by course schedule (which demos are needed soonest?)
4. **Then:** Add `aria-atomic`, migrate missing demos, etc.

### Validation Priority Order (suggested)

Based on typical intro astro course flow:
1. `seasons` — fundamental concept, taught early
2. `moon-phases` — fundamental concept, taught early
3. `angular-size` — foundational measurement concept
4. `parallax-distance` — core distance measurement
5. `blackbody-radiation` — light and spectra unit
6. `em-spectrum` — light and spectra unit
7. `telescope-resolution` — telescopes unit
8. `keplers-laws` — orbits unit
9. `binary-orbits` — orbits unit
10. `conservation-laws` — orbits unit
11. `eclipse-geometry` — specialized topic
12. `retrograde-motion` — specialized topic
