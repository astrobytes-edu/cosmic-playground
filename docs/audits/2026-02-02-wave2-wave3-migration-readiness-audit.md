# Wave 2 + Wave 3 Migration Readiness Audit

**Date:** 2026-02-02  
**Repo:** `cosmic-playground`  
**Audience:** migration work in the next clean session (Wave 2 + Wave 3)

## Goal

Confirm that the repo has the **guardrails, shared patterns, and documentation hygiene** needed to migrate the remaining stub demos (Wave 2 + Wave 3) without reintroducing base-path, export, a11y, KaTeX, and theme-token regressions.

This is a **readiness** audit (not a demo-quality audit). If a finding won’t block migration but is likely to create rework, it’s listed as “P1”.

## Contracts treated as non‑negotiable

From `docs/specs/cosmic-playground-site-spec.md`:

- Routing + artifact pipeline: `/play/<slug>/` artifacts copied into `apps/site/public/play/<slug>/`
- Demo runtime expectations (export + modes + model notes): **9.2**
- Accessibility minimums: **11.1–11.2** (keyboard operable, focus visible, reduced motion, live region)
- QA gates: **13.1–13.3** (build + e2e)

From `docs/specs/cosmic-playground-theme-spec.md`:

- Token-first theme source of truth: `packages/theme`
- **2.2 Hard rule:** no hardcoded colors in `apps/site` and `apps/demos`
- Print fixes centralized in `packages/theme/styles/print.css`

## Current migration state snapshot

**Content + source demo slugs:** 12

- **Interactive (migrated): 7**
  - `angular-size`, `binary-orbits`, `eclipse-geometry`, `moon-phases`, `seasons`, `keplers-laws`, `parallax-distance`
- **Stub (instrument shell only): 5**
  - Wave 2: `blackbody-radiation`, `conservation-laws`
  - Wave 3: `em-spectrum`, `telescope-resolution`
  - New (not in legacy repo): `planetary-conjunctions`

## Evidence: verification commands run (and passed)

These are the gates that should stay green throughout Wave 2/3 work:

- `node scripts/validate-invariants.mjs` (no violations)
- `node scripts/validate-play-dirs.mjs` (OK)
- `corepack pnpm build` (OK)
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (OK)

## Guardrail review (what’s strong already)

### 1) Base-path safety is enforced and passing

**What exists:**
- `scripts/validate-invariants.mjs` blocks:
  - root-absolute `href="/..."` / `src="/..."` / `action="/..."`
  - hardcoded `"/cosmic-playground/"` usage in app code and content
  - root-absolute markdown links `](/...)` inside content
  - demo use of `import.meta.env.BASE_URL` (forbidden in `/play/<slug>/`)

**Result:** repo is in a good position to migrate Wave 2/3 without GH Pages regressions.

### 2) Demo artifact contract is enforced at build time

**What exists:**
- `scripts/validate-play-dirs.mjs` validates the built artifacts under `apps/site/public/play/<slug>/index.html` have:
  - `#cp-demo` (and an accessible name via `aria-label` or `aria-labelledby`)
  - `#copyResults` button semantics
  - `#status` live region (`role=status`, `aria-live=polite`, `aria-atomic=true`)
  - `.cp-demo__drawer`

**Result:** any migrated Wave 2/3 demo that accidentally drops contract markers will fail the build gate.

### 3) “No fetch” data packaging pattern now exists (Wave 3 prerequisite)

**What exists:**
- A repo-owned dataset package: `packages/data-astr101`
  - Example dataset used successfully by `parallax-distance`

**Result:** Wave 3 migrations can bundle datasets deterministically (no network fetch), which matches the repo’s static-site goals and deploy environment.

## Readiness findings (prioritized)

### P0 — Fix/decide before starting Wave 2/3 migrations

#### P0.1 Theme-spec enforcement gap: `rgba(...)` is not currently caught

**Why it matters:** `docs/specs/cosmic-playground-theme-spec.md` says “no hardcoded colors” in `apps/site` and `apps/demos`. The current invariant regex only catches `#...`, `rgb(...)`, and `hsl(...)`, not `rgba(...)` / `hsla(...)`.

**Evidence:**
- Hardcoded `rgba(...)` exists in `apps/site`:
  - `apps/site/src/styles/global.css`
  - `apps/site/src/components/DemoCard.astro`

**Decision needed:**
1) If the theme rule is intended to be strict (recommended): update `scripts/validate-invariants.mjs` to catch `rgba(` and `hsla(`, then replace the existing `rgba(...)` usage with token-derived `color-mix(...)` expressions.
2) If the theme rule is intended to be “no *new* hardcoded colors”: document that exception explicitly in the spec and keep the validator as-is.

**Recommendation:** choose (1) before Wave 2/3 to avoid “silent drift” during fast migrations.

#### P0.2 Data package conventions are not written down yet (Wave 3 scaling risk)

**Why it matters:** Wave 3 demos (`em-spectrum`, `telescope-resolution`) will need larger datasets and likely multiple datasets. Without conventions, data can become ad hoc (hard to typecheck, hard to update, hard to cite).

**Recommendation:** adopt (and document) a minimal convention now:
- Put Wave 3 datasets in dedicated packages (e.g. `packages/data-spectra`, `packages/data-telescopes`) rather than inside demo folders.
- Every dataset export should include:
  - a `type` for the row schema
  - explicit units in field names (`wavelengthNm`, `apertureM`, etc.)
  - a short source note (paper / mission / dataset provenance)
  - (optional but ideal) a `version` string to make future changes explicit

### P1 — Not blockers, but likely to reduce rework during migration

#### P1.1 Stub demos still use the older “stub shell” layout

**Observation:** stubs don’t set a `data-shell` variant (e.g. `data-shell="triad"`). That’s not a contract requirement, but in practice:
- Wave 2/3 migrations should converge on the same shell variants so UX differences are intentional, not accidental.

**Recommendation:** when migrating each demo, set an explicit `data-shell` that matches the UI needs (most of the physics-first demos want `"triad"`).

#### P1.2 Instructor materials are still partly “legacy-path aware”

**Observation:** several instructor bundles still refer to old demo entrypoints/paths (from the legacy repo).

**Recommendation:** treat “content alignment” as part of each migration PR:
- Update instructor “This guide is instructor-facing” block to point at:
  - `apps/demos/src/demos/<slug>/main.ts`
  - `packages/physics/src/<model>.ts` (if applicable)
  - `packages/data-*/src/...` (if applicable)

#### P1.3 KaTeX build-time warning persists

**Observation:** `pnpm build` prints:
> `../../assets/katex/katex.min.css doesn't exist at build time, it will remain unchanged to be resolved at runtime`

**Status:** not breaking (the asset is copied and works at runtime), but it’s a mild source of confusion.

**Recommendation:** optional cleanup later (not required before Wave 2/3): adjust demo build or Vite config to eliminate the warning (or document it in a dev note).

## Wave 2 readiness notes (physics-first demos)

Wave 2 stubs are ideal to migrate using the established pattern:

- Create model in `packages/physics/src/<demo>Model.ts` with vitest tests
- Replace stub demo `main.ts` with real instrument wiring:
  - `createInstrumentRuntime`
  - `createDemoModes` (station mode + help at minimum)
  - v1 export payload with unit-explicit row names
- Keep base-path-safe cross-links inside demo HTML: `../../exhibits/<slug>/`, etc.

**Wave 2 demos:**
- `blackbody-radiation`: decide whether to reintroduce Math Mode (legacy had it)
- `conservation-laws`: decide which conservation(s) are in-scope (energy? momentum? both?) and keep units explicit throughout

## Wave 3 readiness notes (data-heavy demos)

Wave 3 stubs should follow the “no fetch” data rule and expand the data-package pattern:

- `em-spectrum`: datasets for band ranges + detectors/observatories + example targets
- `telescope-resolution`: telescope list + aperture + observing wavelength + resolution relation

**Recommended approach:**
- create dataset packages with typed exports (`packages/data-spectra`, `packages/data-telescopes`)
- ensure all units are explicit in field names and UI labels (no “unitless wavelength”)
- keep demo visualization colors token-first; if spectral colors are needed, document them as a visualization-only exception in model notes

## Migration pre-flight checklist (repeat per PR)

Before declaring a Wave 2/3 demo migration “done”, run:

- `corepack pnpm -C packages/physics test` (if model touched)
- `node scripts/validate-invariants.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## Bottom line

The repo is **structurally ready** to begin Wave 2 and Wave 3 migrations:
- base-path and instrument-contract gates exist and are passing
- “no fetch” data bundling is now proven via `parallax-distance`

The only “readiness” decision that should be made before Wave 2/3 starts is:
- whether to tighten and enforce the theme spec’s “no hardcoded colors” rule by extending the invariant validator to catch `rgba(...)`/`hsla(...)` (recommended).

