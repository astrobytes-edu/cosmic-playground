# Cosmic Playground — Repo Audit (v0.1 scaffold)

**Date:** 2026-01-30

**Scope:** Full monorepo review (Astro site, demos pipeline, packages, scripts, CI workflow)

**Baseline:** `main` after commit `292789d` (theme layers)

---

## Executive summary

This repo is in a strong state for a “PR-sized first implementation”:

- `corepack pnpm build` passes (demos build → copy → validate → Astro static build).
- `corepack pnpm typecheck` passes across all workspace projects.
- The museum routes and content collections match the v0.1 spec, and the theme system cleanly separates **museum** vs **instrument**.

Main improvements before scaling:

1. Make the build-copy step **fully deterministic** locally by cleaning `apps/site/public/play` up-front (avoid stale artifact false-positives). See `scripts/build.mjs:42`.
2. Replace the placeholder `lint` + placeholder `test` with real checks (eslint + at least one unit test suite).
3. Implement the remaining “Instrument Standard” behavior (modes + mobile tabs) beyond CSS-only stacking.

---

## Spec compliance (v0.1)

### Museum routes

Implemented and statically built:
- Home `/` (taglines + CTAs + featured + updated list): `apps/site/src/pages/index.astro:1`
- Explore `/explore/` (search + filters + sorting): `apps/site/src/pages/explore/index.astro:1`
- Exhibit `/exhibits/[slug]/` (all pedagogy blocks + iframe + launch controls): `apps/site/src/pages/exhibits/[slug].astro:1`
- Playlists `/playlists/` and `/playlists/[slug]/`: `apps/site/src/pages/playlists/index.astro:1`, `apps/site/src/pages/playlists/[slug].astro:1`
- Station cards `/stations/[slug]/` (print-first layout): `apps/site/src/pages/stations/[slug].astro:1`
- Instructor notes `/instructor/[slug]/` (public + `noindex`, not in primary nav): `apps/site/src/pages/instructor/[slug].astro:1`

### Content model

- Content Collections are in place with Zod schemas: `apps/site/src/content/config.ts:1`
- One file per demo slug: `apps/site/src/content/demos/:1`
- **Spec deviation:** Astro reserves `slug`, so demo slugs are derived from filenames (`<slug>.md`) and accessed via `entry.slug`. Documented in `docs/spec-deviations.md:1`.

### Demo pipeline

- Vite MPA discovery and build: `apps/demos/vite.config.ts:1`
- Copy into `apps/site/public/play/<slug>/`: `scripts/build.mjs:36`
- Build validation: `scripts/validate-play-dirs.mjs:15`

---

## Theme system audit

Theme is cleanly separated into:

- Shared tokens: `packages/theme/styles/tokens.css:1`
- Museum layer (allowed glow + exhibit cards/badges): `packages/theme/styles/layer-museum.css:1`
- Instrument layer (calmer surfaces + panel primitives): `packages/theme/styles/layer-instrument.css:1`
- Demo shell layout contract: `packages/theme/styles/demo-shell.css:1`
- Print rules: `packages/theme/styles/print.css:1`

Theme contract is documented in:
- `docs/specs/cosmic-playground-theme-spec.md:1`
- `packages/theme/README.md:1`

Good:
- Minimal coupling: apps import CSS from the theme package; tokens are not redefined per app.
- “Instrument Standard” layout is expressed as CSS + required region classnames (low JS).

Watchouts:
- `color-mix()` is used (e.g. `packages/theme/styles/layer-museum.css:22`); modern browser support is good, but it’s worth confirming Safari target compatibility for your audience.

---

## Build/deploy pipeline audit

### CI workflow

GitHub Pages deploy workflow is straightforward and monorepo-correct:
- `actions/setup-node` + pnpm cache
- root install + root build
- uploads `apps/site/dist`

See `.github/workflows/deploy.yml:1`.  
**Spec deviation** (Astro “official action” wording) is documented in `docs/spec-deviations.md:1`.

### Determinism risk (local builds)

`scripts/build.mjs` copies only directories found under `apps/demos/dist` into `apps/site/public/play`, but it does **not** remove stale demo directories that no longer exist in `dist`. See `scripts/build.mjs:46`.

Why it matters:
- If a slug is removed from the demos build (or renamed) but still exists from a previous local run, validation can pass even though the build step didn’t recreate that artifact.

Recommendation:
- Before copying, delete and recreate `apps/site/public/play/` (or copy into a temp dir and swap).

---

## Code quality notes

### Good patterns

- Clear, minimal packages scaffold with workspace dependencies.
- Strong separation of concerns: content-driven museum pages, demo build pipeline, shared theme/runtime.
- Typecheck is enabled and enforced via `pnpm typecheck`.

### “Improve soon” items

- `lint` is a placeholder at root (`package.json:1`). Add eslint + basic rules (especially for Astro + TS).
- `test` is a placeholder; spec calls out unit tests for `packages/physics`. Add at least a tiny `vitest` suite once physics utilities exist.
- Duplicate helpers (`excerptFromBody`) exist in multiple pages; low priority, but an easy refactor into `apps/site/src/lib/`.
- Explore filters use `as any` casts for query params (`apps/site/src/pages/explore/index.astro:48`). Consider validating query values against the known enums to avoid silent bad states.

---

## Next recommended PRs (prioritized)

1. Make `scripts/build.mjs` clean `apps/site/public/play/` before copying (deterministic local builds).
2. Add eslint (and replace placeholder `lint`) + minimal formatting conventions.
3. Implement runtime “modes” and a real mobile tab UI for demo shell (Controls | View | Readouts), using the new theme shell contract.
4. Add Playwright smoke tests (optional but recommended by spec) for `/explore/` and `/play/<slug>/`.

