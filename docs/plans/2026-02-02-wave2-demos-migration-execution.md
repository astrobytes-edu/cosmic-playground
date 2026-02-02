# Wave 2 Demos Migration Execution Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Convert all ASTR101 SP26 **Wave 2** demos into fully interactive Cosmic Playground instruments (no `initStubDemo`), with physics models in `packages/physics` + required tests, and aligned site content.

**Architecture:** For each Wave 2 stub (`blackbody-radiation`, `conservation-laws`), port the legacy `_assets/*-model.js` into a typed `packages/physics/src/*Model.ts` module (explicit units + tests), then port the legacy demo UI/controller into `apps/demos/src/demos/<slug>/` using the standard instrument shell and `@cosmic/runtime` helpers (modes, exports v1, KaTeX init, live region).

**Tech Stack:** Vite demos (`apps/demos`), Astro site (`apps/site`), shared runtime (`packages/runtime`), shared theme (`packages/theme`), shared physics (`packages/physics`), validation scripts (`scripts/*`), Playwright e2e (`apps/site/tests`).

## Inventory (source of truth)

**Wave 2 demos (manifest):**
- `binary-orbits` (already **Interactive** here; not a stub)
- `keplers-laws` (already **Interactive** here; not a stub)
- `blackbody-radiation` (**Stub** here; must migrate)
- `conservation-laws` (**Stub** here; must migrate)

**Legacy source repo:** `/Users/anna/Teaching/astr101-sp26/demos/`
- Blackbody files: `blackbody-radiation/blackbody.js`, `blackbody-radiation/blackbody.css`, `_assets/blackbody-model.js`
- Conservation files: `conservation-laws/conservation-laws.js`, `conservation-laws/conservation-laws.css`, `_assets/conservation-laws-model.js` plus shared physics helpers under `_assets/physics/*` already mirrored in `@cosmic/physics` as `TwoBodyAnalytic` + `AstroConstants`.

## Contracts (non-negotiable)

- Base paths:
  - Astro (`apps/site/src/**`): `import.meta.env.BASE_URL` for internal links/assets.
  - Markdown content (`apps/site/src/content/**`): no `BASE_URL`; no root-absolute `](/...)`; use relative links.
  - Vite demos (`apps/demos/src/demos/**` served at `/play/<slug>/`): no root-absolute links; use `../../...`; never hardcode `/cosmic-playground/`; never use `import.meta.env.BASE_URL`.
- Demo artifact contract (built `apps/site/public/play/<slug>/index.html` must have):
  - `#cp-demo` (with accessible name)
  - `#copyResults` (button semantics)
  - `#status` live region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`)
  - `.cp-demo__drawer`
- Theme spec: token-first; no new hardcoded colors in `apps/demos` (visualization-only exceptions must be documented).
- Physics/model contract: explicit units; no `G=1`; tests required for any new `*Model.ts` (benchmark + limiting case + sanity invariant).
- Accessibility: keyboard operable; visible focus; reduced-motion compliant; correct dialog semantics if introduced.

## PR Slice 1: Migrate `blackbody-radiation` (model + instrument)

**Scope:** Port the legacy blackbody model + visualization into the Cosmic Playground instrument shell, with export v1 and optional Math Mode.

**Open decision (must choose before coding):**
- Keep legacy “101/201” as **Concept/Math** modes (recommended), or ship as Concept-only initially.

**Files:**
- Create (model): `packages/physics/src/blackbodyRadiationModel.ts`
- Create (tests): `packages/physics/src/blackbodyRadiationModel.test.ts`
- Modify (exports): `packages/physics/src/index.ts`
- Modify (demo): `apps/demos/src/demos/blackbody-radiation/index.html`
- Modify (demo): `apps/demos/src/demos/blackbody-radiation/main.ts`
- Modify (demo): `apps/demos/src/demos/blackbody-radiation/style.css`
- Modify (content alignment): `apps/site/src/content/demos/blackbody-radiation.md`
- Modify (instructor alignment): `apps/site/src/content/instructor/blackbody-radiation/*`
- Modify (dashboard): `docs/migration/2026-02-02-demo-migration-dashboard.md`

**Acceptance criteria:**
- Demo is no longer a stub (`initStubDemo` removed) and provides:
  - temperature control (K) with clear readouts
  - peak wavelength readout (nm) and a spectrum visualization
  - “Copy results” exports v1 with unit-explicit row names (no units embedded in values)
  - reduced-motion compliant behavior (no forced animation under `prefers-reduced-motion`)
- No base-path violations in demo links (all cross-site links use `../../...`).
- No new hardcoded colors in CSS; any unavoidable visualization-only colors are documented in drawer “Model notes”.
- Physics model is in `packages/physics` and has required tests (benchmark + limiting case + sanity invariant).

**Verification commands:**
- `corepack pnpm -C packages/physics test`
- `node scripts/validate-physics-models.mjs`
- `node scripts/validate-play-dirs.mjs`
- `node scripts/validate-invariants.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## PR Slice 2: Migrate `conservation-laws` (model + instrument)

**Scope:** Port the orbit-shape/energy/angular-momentum conservation demo into the instrument shell with stable exports and explicit units.

**Open decision (must choose before coding):**
- Confirm scope: energy + angular momentum for **orbit type + shape** (recommended; matches legacy), or broaden to include linear momentum explicitly (likely out of scope).

**Files:**
- Create (model): `packages/physics/src/conservationLawsModel.ts`
- Create (tests): `packages/physics/src/conservationLawsModel.test.ts`
- Modify (exports): `packages/physics/src/index.ts`
- Modify (demo): `apps/demos/src/demos/conservation-laws/index.html`
- Modify (demo): `apps/demos/src/demos/conservation-laws/main.ts`
- Modify (demo): `apps/demos/src/demos/conservation-laws/style.css`
- Modify (content alignment): `apps/site/src/content/demos/conservation-laws.md`
- Modify (instructor alignment): `apps/site/src/content/instructor/conservation-laws/*`
- Modify (station alignment, if needed): `apps/site/src/content/stations/conservation-laws.md`
- Modify (dashboard): `docs/migration/2026-02-02-demo-migration-dashboard.md`

**Acceptance criteria:**
- Demo is no longer a stub (`initStubDemo` removed) and provides:
  - controls for initial conditions (explicit units in labels)
  - a clear orbit visualization with play/pause/reset (keyboard operable)
  - readouts that support the teaching point (e.g., eccentricity `e`, specific energy `ε`, specific angular momentum magnitude `|h|`, orbit type)
  - “Copy results” exports v1 with unit-explicit row names
  - reduced-motion compliant behavior (no continuous animation under `prefers-reduced-motion`)
- Physics model is in `packages/physics` and has required tests (benchmark + limiting case + sanity invariant).
- No base-path violations and no new hardcoded app-layer colors.

**Verification commands:**
- `corepack pnpm -C packages/physics test`
- `node scripts/validate-physics-models.mjs`
- `node scripts/validate-play-dirs.mjs`
- `node scripts/validate-invariants.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## PR Slice 3: Wave 2 completion sweep (docs + gates)

**Scope:** Update migration dashboard for Wave 2 completeness and run all repo gates once with Wave 2 finished.

**Files:**
- Modify: `docs/migration/2026-02-02-demo-migration-dashboard.md`

**Acceptance criteria:**
- Dashboard Wave 2 rows show `blackbody-radiation` and `conservation-laws` as **Interactive** (no longer stub).
- Known gaps/risks for Wave 2 are recorded (e.g., any deferred Math Mode/UI features).
- All verification gates pass.

**Verification commands:**
- `node scripts/validate-invariants.mjs`
- `node scripts/validate-play-dirs.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

