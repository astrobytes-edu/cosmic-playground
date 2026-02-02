# Demo Migration Finish Plan (Waves 2–3 + Hardening)

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Finish migrating the remaining ASTR101 SP26 demos into consistent, classroom-ready Cosmic Playground instruments, while hardening shared contracts so UI/UX regressions don’t multiply across demos.

**Architecture:** Two-track workflow:
1) **Harden shared contracts once** (validators + runtime/theme shared behaviors).
2) **Migrate demos as vertical slices** (model + UI + exports + content alignment) one demo per PR, using the established shell/runtime/theme patterns.

**Tech Stack:** Vite demos (`apps/demos`), Astro site (`apps/site`), shared runtime (`packages/runtime`), shared theme (`packages/theme`), shared physics (`packages/physics`), validation scripts (`scripts/*`), Playwright e2e (`apps/site/tests`).

## Contracts to cite (source of truth)

- Site spec:
  - Demo runtime expectations (modes/export/model notes/KaTeX): `docs/specs/cosmic-playground-site-spec.md` **9.2**
  - Performance + accessibility minimums: `docs/specs/cosmic-playground-site-spec.md` **11.1–11.2**
  - CI/QA + link validation expectations: `docs/specs/cosmic-playground-site-spec.md` **13.1–13.3**
- Theme spec:
  - Token-first + centralized print: `docs/specs/cosmic-playground-theme-spec.md` **2.1–2.2**, **6**

## Current migration state (input)

Use the dashboard as the live inventory:
- `docs/migration/2026-02-02-demo-migration-dashboard.md`

Summary snapshot:
- Interactive (migrated): `angular-size`, `binary-orbits`, `eclipse-geometry`, `moon-phases`, `seasons`, `keplers-laws`, `parallax-distance`
- Stub: `blackbody-radiation`, `conservation-laws`, `em-spectrum`, `telescope-resolution`, `planetary-conjunctions`
- Missing from Cosmic Playground but present in legacy repo: `doppler-shift-spectrometer`, `spectral-lines-lab`, `planetary-climate-sandbox`

## PR Slice 1: Tighten the instrument contract + apply across all demos

**Scope:** Strengthen the “instrument contract” so the a11y/status behaviors you care about are enforced once by validators, then fix all existing demos to comply.

**Files:**
- Modify: `scripts/validate-play-dirs.mjs`
- Modify: `apps/demos/src/demos/*/index.html`
- (Optional) Create: `scripts/validate-play-dirs.test.mjs`
- (Optional) Modify: `package.json` (add a `test:play-dirs` script)

**Acceptance criteria:**
- `#status` live region requirements include:
  - `role="status"`
  - `aria-live="polite"`
  - `aria-atomic="true"`
- All 12 demos’ source `index.html` satisfy the stricter requirement.
- `corepack pnpm build` passes (includes demo build + copy + validate).
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` passes.

**Verification:**
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Notes (why now):**
- This prevents repeating “small a11y fixes” 12+ times during the rest of the migration.

## PR Slice 2: Harden the 5 migrated interactive demos (shared fixes first)

**Scope:** Resolve known UI/UX issues and missing features in the already-migrated demos, focusing on shared fixes that would otherwise be reintroduced during Wave 2/3.

**Files:**
- Create: `docs/audits/2026-02-02-migrated-demos-ux-audit.md` (short, actionable)
- Modify (shared, if needed): `packages/runtime/src/*`
- Modify (shared, if needed): `packages/theme/styles/*`
- Modify (demo-specific, only if truly unique): `apps/demos/src/demos/angular-size/*`, `apps/demos/src/demos/binary-orbits/*`, `apps/demos/src/demos/eclipse-geometry/*`, `apps/demos/src/demos/moon-phases/*`, `apps/demos/src/demos/seasons/*`
- Modify (content verification as needed): `apps/site/src/content/demos/*`, `apps/site/src/content/instructor/**`, `apps/site/src/content/stations/**`
- Modify (tests): `apps/site/tests/smoke.spec.ts`

**Acceptance criteria:**
- Shared fixes land in shared layers:
  - cross-demo runtime behaviors → `packages/runtime`
  - shared visuals/controls/focus/print → `packages/theme`
  - no per-demo styling systems introduced
- Each migrated demo has:
  - stable export behavior (Copy results works via keyboard; status updates announced)
  - station/challenge modes (where present) still function
  - reduced-motion behavior remains compliant
- Playwright smoke covers **exports** for each interactive demo (not just the pilot), under `CP_BASE_PATH=/cosmic-playground/`.

**Verification:**
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## PR Slice 3: Start Wave 2 migration with one physics-first demo (Kepler’s Laws)

**Scope:** Convert `keplers-laws` from stub → real instrument end-to-end, using the now-stable contract and shared patterns.

**Files:**
- Create/Modify (model): `packages/physics/src/keplersLawsModel.ts`
- Create/Modify (tests): `packages/physics/src/keplersLawsModel.test.ts`
- Modify (demo): `apps/demos/src/demos/keplers-laws/index.html`
- Modify (demo): `apps/demos/src/demos/keplers-laws/main.ts`
- Modify (demo): `apps/demos/src/demos/keplers-laws/style.css`
- Modify (content alignment): `apps/site/src/content/demos/keplers-laws.md`
- (Optional) Modify (instructor/station alignment): `apps/site/src/content/instructor/keplers-laws/*`, `apps/site/src/content/stations/keplers-laws.md`

**Acceptance criteria:**
- Physics uses explicit units (no `G=1`), with at least:
  - one benchmark test
  - one limiting-case sanity test
- Demo uses the standard instrument shell + tokens + runtime helpers:
  - `createInstrumentRuntime`, `createDemoModes` (as appropriate)
  - exports v1 with unit-explicit row labels
  - no root-absolute links; demo cross-links use `../../...`
- Build + base-path e2e gates pass.

**Verification:**
- `corepack pnpm -C packages/physics test`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Status:** Completed and pushed (2026-02-02).

## PR Slice 4: Establish the “data-heavy demo” pattern, then migrate one Wave 3 demo (Parallax Distance)

**Scope:** Define a repo-owned, “no fetch” data packaging pattern suitable for the Wave 3 demos, then migrate `parallax-distance` end-to-end as the exemplar.

**Files (pattern, choose one and stick to it):**
- Option A (preferred): Create a small data package
  - Create: `packages/data-astr101/*` (module exports datasets as ESM)
- Option B (simpler early-stage): Keep data in demos source tree
  - Create: `apps/demos/src/data/*`

**Files (demo):**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`
- Modify: `apps/demos/src/demos/parallax-distance/style.css`
- Modify: `apps/site/src/content/demos/parallax-distance.md`

**Acceptance criteria:**
- No network fetch for core datasets (data is bundled).
- The model is explicit about units and has at least one limiting-case check (angle → 0 ⇒ distance → ∞).
- Demo matches the instrument contract and passes validators and base-path e2e.

**Verification:**
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Status:** Completed and pushed (2026-02-02).

## After these slices (repeatable workflow)

At this point you should have:
- a tightened contract that stops regressions,
- a hardened “golden set” of migrated demos,
- a proven pattern for physics-first demos (Wave 2),
- a proven pattern for data-heavy demos (Wave 3).

Then proceed one demo per PR in this order:
- Finish Wave 2: `conservation-laws`, `blackbody-radiation`
- Finish Wave 3: `em-spectrum`, `telescope-resolution`
- Decide scope + migrate: `planetary-conjunctions` (new), then the 3 missing legacy demos (`spectral-lines-lab`, `doppler-shift-spectrometer`, `planetary-climate-sandbox`) once the spectra/climate datasets are placed in the chosen data pattern.
