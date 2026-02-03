# Cosmic Playground — Codebase Architecture + Contracts Audit

**Date:** 2026-02-02  
**Scope:** monorepo architecture, invariant enforcement, contract coverage, DRY/maintainability, CI readiness

## Contracts reviewed (source of truth)

- `docs/specs/cosmic-playground-site-spec.md` (routing, monorepo layout, instrument standard, build pipeline, QA)
- `docs/specs/cosmic-playground-theme-spec.md` (layer model, token-first styling, demo shell contract)
- `docs/specs/cosmic-playground-model-contract.md` (units + testing requirements for model code)
- `docs/specs/cosmic-playground-data-contract.md` (dataset packaging + manifest enforcement)
- `docs/specs/cosmic-playground-legacy-demo-migration-contract.md` (base paths, artifact contract, unicode-math prohibition)

## Architectural assessment (high-level)

The repo structure matches the site spec’s intended boundaries:

- `apps/site` (Astro “museum” site) depends primarily on `@cosmic/theme` and uses `import.meta.env.BASE_URL` for internal links/assets.
- `apps/demos` (Vite multi-entry demos) depends on shared packages (`@cosmic/runtime`, `@cosmic/physics`, `@cosmic/theme`, and dataset packages) and is built with `base: "./"` to produce portable `/play/<slug>/` artifacts.
- `packages/*` is the right home for shared, contract-critical logic:
  - `packages/runtime` centralizes export formatting, demo mode behavior, clipboard handling, KaTeX helpers, and “polish” utilities.
  - `packages/theme` is the canonical token + layer + demo-shell source.
  - `packages/physics` hosts unit-explicit models with required vitest coverage.
  - `packages/data-*` provides dataset + manifest-based metadata enforcement.

This separation is a strong foundation for enforcing “shared behavior belongs in packages/*” and preventing per-demo drift.

## What is currently enforced (and where)

### Build pipeline enforcement (contract-aligned)

`scripts/build.mjs` runs a predictable pipeline:

1) invariant checks (`validate-invariants`, `validate-math-formatting`, `validate-datasets`, `validate-physics-models`)  
2) KaTeX asset copy (`copy-katex-assets`)  
3) demos build (Vite multi-entry)  
4) copy built artifacts into `apps/site/public/play/`  
5) artifact contract validation (`validate-play-dirs`)  
6) site build (Astro static)

This matches the site spec’s build artifact placement and the migration contract’s artifact contract checks.

### Invariant validators (mechanical, fast, effective)

Current validators cover the highest-risk regressions:

- base-path safety:
  - forbids hardcoded `"/cosmic-playground/"` strings in app-layer code/content/demos
  - forbids root-absolute links in Astro code and markdown content
  - forbids `import.meta.env.BASE_URL` usage inside Vite demo source
- theme contract:
  - forbids app-layer hardcoded color literals in `.astro`/`.css`/`.html`
  - forbids page-local print hacks in content/pages
- math authoring contract:
  - forbids unicode math symbols in demo/site/runtime sources (forces LaTeX source strings)
- data contract:
  - enforces `packages/data-*/manifest.json` structure and `*Meta` exports
- model contract:
  - enforces `*Model.ts` ↔ `*Model.test.ts` pairing and index exports
- instrument artifact contract (built output):
  - validates `#cp-demo`, `#copyResults`, `#status` live-region attributes, and `.cp-demo__drawer`

### Runtime reuse (DRY wins)

`packages/runtime` provides a stable “instrument runtime” API that demos consume (`createInstrumentRuntime`, `formatExportText`, `toCsv`, KaTeX helpers). This is a good example of DRY that also improves contract compliance (export formatting and copy UX become centralized rather than demo-by-demo).

## CI readiness (gap → fixed)

### Finding: CI only ran build + e2e

`.github/workflows/deploy.yml` previously ran:
- install deps
- `corepack pnpm build`
- Playwright e2e smoke tests

It did not run:
- `typecheck`
- unit tests (`packages/physics`, `packages/theme`)
- validator tests (vitest for `scripts/validate-*.test.mjs`)

This was a mismatch with the site spec’s “required checks” section (lint/typecheck/unit tests/build).

### Remediation applied in this audit

- Updated root scripts to make `corepack pnpm lint` and `corepack pnpm test` meaningful (no longer placeholders): `package.json`
- Updated CI workflow to run `lint`, `typecheck`, and `test` before build: `.github/workflows/deploy.yml`

## Concrete issues found during audit (and fixed)

### TypeScript strictness regression in a migrated demo

`corepack pnpm typecheck` failed due to nullability issues in `apps/demos/src/demos/telescope-resolution/main.ts` (DOM selectors typed as possibly null, used inside functions).

**Fix applied:**
- Introduced a small shared helper `requiredSelector()` in `apps/demos/src/shared/dom.ts`
- Switched telescope-resolution’s DOM queries to use `requiredSelector()` (eliminates `T | null` types and throws a clear runtime error if the DOM contract is broken)

This both restores strict typecheck and improves DRY for future demo work.

## DRY + maintainability notes (next improvements)

These are not regressions, but good follow-on work to keep the repo clean as migrations scale:

1) **Adopt `requiredSelector()` pattern across migrated demos (optional but recommended).**  
   This reduces repeated “big null-check + alias” blocks and makes strict TypeScript easier to maintain.

2) **Consider consolidating repeated Node script helpers.**  
   Multiple `scripts/validate-*.mjs` files repeat small utilities (`pathExists`, directory walking, etc.). A `scripts/lib/fs.mjs` helper would reduce duplication and make validators easier to extend.

3) **Extend invariant scanning to catch root-absolute navigation strings in JS.**  
   Current invariant checks focus on `href/src/action="/..."` patterns. A lightweight “forbid `"/explore/"` and friends in demo TS” check (similar to the existing regex approach) would close a common base-path footgun.

4) **(Longer-term) add an export-content contract check.**  
   Today, we validate export payload shape and copy UX behavior, but not unit labeling / naming conventions inside exported rows. A validator that asserts “unitful values have unitful row names” (or demo-by-demo allowlists) would improve pedagogy stability.

## Gates executed for this audit (all green)

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

