# Demo Migration Dashboard + TODOs (as of 2026-02-02)

This document is the planning “control panel” for finishing the demo migration from `~/Teaching/astr101-sp26/demos/` into `cosmic-playground`.

## Snapshot (current repo state)

**Cosmic Playground demo slugs (content + source): 12.**

- **Interactive (migrated): 9**
  - `angular-size`, `binary-orbits`, `blackbody-radiation`, `conservation-laws`, `eclipse-geometry`, `moon-phases`, `seasons`, `keplers-laws`, `parallax-distance`
- **Stub (instrument shell only): 3**
  - `em-spectrum`, `telescope-resolution`, `planetary-conjunctions`

**Legacy demo directories found in `~/Teaching/astr101-sp26/demos/`: 14**

- **Already present in Cosmic Playground:** 11
- **Missing from Cosmic Playground (needs migration): 3**
  - `doppler-shift-spectrometer`, `planetary-climate-sandbox`, `spectral-lines-lab`
- **New in Cosmic Playground (not in legacy repo): 1**
  - `planetary-conjunctions`

## Current build gates (must stay green)

- `corepack pnpm build`
  - Includes `scripts/validate-invariants.mjs` (base-path + print-hack + demo-link guards)
  - Includes `scripts/validate-play-dirs.mjs` (instrument contract validation for `/play/<slug>/`)
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## Migration status table

Legend:

- **Interactive** = real instrument (not `initStubDemo`)
- **Stub** = placeholder instrument that satisfies `/play/<slug>/` contract but has no physics/visualization yet
- **Missing** = exists in legacy repo but no `apps/demos/src/demos/<slug>/` in this repo yet
- **New** = exists in this repo but not in legacy repo

| Demo slug | Legacy? | Wave (manifest) | Status here | Notes |
| --- | --- | --- | --- | --- |
| `angular-size` | yes | 1 | **Interactive** | Uses `@cosmic/physics` `AngularSizeModel`; Station + Challenge mode wired |
| `seasons` | yes | 1 | **Interactive** | Uses `@cosmic/physics` `SeasonsModel`; Station + Challenge mode wired |
| `eclipse-geometry` | yes | 1 | **Interactive** | Uses `@cosmic/physics` `EclipseGeometryModel`; Station + Challenge mode wired |
| `moon-phases` | yes | 1 | **Interactive** | Station + Challenge mode wired; does **not** currently use `@cosmic/physics` |
| `binary-orbits` | yes | 2 | **Interactive** | Uses `@cosmic/physics` `TwoBodyAnalytic`; Station mode wired (no Challenge) |
| `blackbody-radiation` | yes | 2 | **Interactive** | Uses `@cosmic/physics` `BlackbodyRadiationModel`; Station mode + exports v1 wired (Math Mode UI still deferred) |
| `conservation-laws` | yes | 2 | **Interactive** | Uses `@cosmic/physics` `TwoBodyAnalytic` + `ConservationLawsModel`; Station mode + exports v1 wired |
| `keplers-laws` | yes | 2 | **Interactive** | Uses `@cosmic/physics` `KeplersLawsModel`; Station mode wired; export v1 wired |
| `em-spectrum` | yes | 3 | **Stub** | Legacy depends on datasets; needs data packaging + UI |
| `parallax-distance` | yes | 3 | **Interactive** | Uses `@cosmic/physics` `ParallaxDistanceModel` + `@cosmic/data-astr101` `nearbyStars`; Station + export v1 wired |
| `telescope-resolution` | yes | 3 | **Stub** | Legacy had Math Mode + telescope dataset; needs data packaging + UI |
| `planetary-conjunctions` | no | — | **Stub (New)** | New demo concept; needs scope + model + UI |
| `doppler-shift-spectrometer` | yes | — | **Missing** | Newer legacy demo; uses shared spectra dataset + Doppler model |
| `spectral-lines-lab` | yes | — | **Missing** | Newer legacy demo; uses spectra datasets + data contract |
| `planetary-climate-sandbox` | yes | — | **Missing** | Newer legacy demo; uses energy-balance model + presets dataset |

## Migrated demos: current UI/UX state + hardening TODOs

### Cross-cutting “finish line” hardening (applies to all interactive demos)

- [ ] Add `aria-atomic="true"` to `#status` in **all** demo `index.html` files, and tighten `scripts/validate-play-dirs.mjs` to require it.
- [ ] Add a “per-demo contract checklist” section to each demo’s `model_notes` (short bullets: assumptions, units, known limits).
- [ ] Verify **site content** matches the instrument UI:
  - `apps/site/src/content/demos/<slug>.md` (learning goals/misconceptions/play steps)
  - `apps/site/src/content/instructor/<slug>/*` (references to controls/readouts should match the migrated UI)
  - `apps/site/src/content/stations/<slug>.md` (if overrides exist, align with station-mode snapshot columns)
- [ ] Expand Playwright smoke to cover exports for each interactive demo (not just the pilot), keeping `CP_BASE_PATH=/cosmic-playground/` on.

### `angular-size` (interactive)

- Current: Station + Challenge; exports v1; uses `AngularSizeModel`.
- TODOs:
  - [ ] Check the “units story” end-to-end: UI labels ↔ export labels ↔ station/instructor wording (especially `D` vs `d`).
  - [ ] Add `aria-atomic` to `#status`.

### `seasons` (interactive)

- Current: Station + Challenge; exports v1; uses `SeasonsModel`.
- TODOs:
  - [ ] Content verification: instructor/station text should match current control names (tilt/latitude/day-of-year).
  - [ ] Add `aria-atomic` to `#status`.

### `eclipse-geometry` (interactive)

- Current: Station + Challenge; exports v1; uses `EclipseGeometryModel`.
- TODOs:
  - [ ] Verify the classification wording in UI/readouts matches station/instructor content (solar vs lunar eclipse naming).
  - [ ] Add `aria-atomic` to `#status`.

### `moon-phases` (interactive)

- Current: Station + Challenge; exports v1; **does not** currently depend on `@cosmic/physics`.
- TODOs:
  - [ ] Decide whether to port the core moon-phase geometry into `packages/physics` (tests + shared use), or keep it demo-local (and add targeted tests elsewhere).
  - [ ] Add `aria-atomic` to `#status`.

### `binary-orbits` (interactive)

- Current: Station mode; exports v1; uses `TwoBodyAnalytic` (teaching units guardrails apply).
- TODOs:
  - [ ] Decide whether it needs Challenge mode (or keep it as station-only).
  - [ ] Add `aria-atomic` to `#status`.

## Stub demos: migration TODOs (Wave 2 + Wave 3 + New)

### Shared approach for each stub demo

- [ ] Port/author the model in `packages/physics/src/<demo>Model.ts` with vitest tests (benchmark + limiting case).
- [ ] Replace `initStubDemo` with real instrument wiring:
  - Use `createInstrumentRuntime()` + `createDemoModes()` as appropriate.
  - Keep `/play/<slug>/` base-path-safe links (`../../...`).
  - Keep exports v1 (`ExportPayloadV1`) and make units explicit in row labels.
- [ ] Align site content (`apps/site/src/content/**`) to the final UI labels/readouts and misconceptions.

### Wave 2 stubs (from `docs/migration/astr101-sp26-manifest.json`)

- [x] `blackbody-radiation` — migrated to interactive instrument (model + viz + exports v1). Math Mode UI still a backlog decision.
- [x] `conservation-laws` — migrated to interactive instrument (model + viz + exports v1).

### Wave 3 stubs (data-heavy)

- [ ] `em-spectrum` — migrate telescope/object datasets into repo-owned modules (no fetch); port UI; confirm accessibility for selectable items/legend.
- [ ] `telescope-resolution` — migrate telescope dataset; port optics model; decide whether to reintroduce Math Mode.

### New stub (not in legacy repo)

- [ ] `planetary-conjunctions` — decide scope (ASTR101-only?); create a simple, explicit-units model (synodic period + geometry) and implement instrument UI.

## Legacy demos missing from this repo (needs migration decisions)

These exist in `~/Teaching/astr101-sp26/demos/` but are not yet present as `apps/demos/src/demos/<slug>/`:

- [ ] `doppler-shift-spectrometer`
  - Legacy notes: uses shared spectra dataset + Doppler model (`demos/_assets/spectra/spectra-data.v1.js`, `demos/_assets/doppler-shift-model.js`).
  - TODO: introduce a repo-owned data/home for spectra + Doppler model (likely `packages/physics` + a `packages/data-spectra`-style module), then migrate UI.

- [ ] `spectral-lines-lab`
  - Legacy notes: uses atomic/molecular datasets and references a “spectra data contract”.
  - TODO: import the contract doc into this repo (or restate it), then migrate the datasets + UI.

- [ ] `planetary-climate-sandbox`
  - Legacy notes: uses shared energy-balance model + presets dataset (`demos/_assets/planetary-climate-model.js`, `demos/_assets/climate/planet-presets.v1.js`).
  - TODO: port model into `packages/physics` (tests), decide how presets are stored (static module, not fetch), then migrate UI.

## Meta TODOs (project management)

- [ ] Update `docs/migration/astr101-sp26-manifest.json` to include the three newer legacy demos and to reflect current statuses (interactive vs stub) so it’s a reliable planner.
- [ ] Add a small “dashboard generator” script (optional) that scans:
  - `apps/demos/src/demos/*` (stub vs interactive; key runtime hooks)
  - `apps/site/src/content/demos/*` (metadata presence)
  - legacy inventory (if available)
  and writes an updated status table into this doc.
