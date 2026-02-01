# Cosmic Playground — Claude / LLM working notes

This repo uses `AGENTS.md` as the authoritative agent instructions. Read and follow it first.

## Quick commands

- Install (if needed): `corepack pnpm install`
- Build everything (demos + site): `corepack pnpm build`
- Site checks: `corepack pnpm -C apps/site typecheck`
- E2E (Playwright): `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (or leave `CP_BASE_PATH` unset)
- Python (conda env with PyYAML): `conda run -n astro python <script.py> ...`

## Dependency notes

- If a Python tool fails with `ModuleNotFoundError`, install the missing package into the `astro` conda env (and we’ll call out the exact package + command when it happens).
- If a `corepack pnpm ...` command fails due to missing deps, run `corepack pnpm install`.

## Architecture at a glance

- `apps/site/`: Astro static site (GitHub Pages deploy target is `apps/site/dist/`)
- `apps/demos/`: Vite-built interactive instruments (each demo is its own folder under `apps/demos/src/demos/<slug>/`)
- `packages/physics/`: Pure, testable physics models (prefer TDD for ports)
- `packages/runtime/`: Shared demo runtime (Station Mode, Challenge Mode, export helpers, etc.)
- `packages/theme/`: Shared tokens and demo shell styles

## Demo build/copy pipeline

- Vite builds demos to `apps/demos/dist/<slug>/`
- `corepack pnpm build` copies those outputs to `apps/site/public/play/<slug>/`
- `/play/<slug>/` pages on the site are served from `apps/site/public/play/<slug>/`

## Hard constraints / conventions

- Prefer static + fast pages; minimal client JS on museum pages.
- Use `import.meta.env.BASE_URL` for internal links/asset URLs (GitHub Pages base path support).
- Keep units explicit and consistent everywhere (UI labels, exports, docs).
  - Do **not** use `G=1` or “natural units” phrasing.
  - When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with `G = 4π² AU³/(yr²·M☉)`.

## Suggested workflow when migrating demos

1. Port legacy physics into `packages/physics/` as pure TS + Vitest coverage.
2. Implement the instrument UI in `apps/demos/src/demos/<slug>/` using `@cosmic/runtime` (Station/Challenge/Export).
3. Update `apps/site/src/content/demos/<slug>.md` (and station/instructor content if needed) so docs match the shipped controls/units.
4. Keep gates green: `corepack pnpm build` and Playwright e2e.
