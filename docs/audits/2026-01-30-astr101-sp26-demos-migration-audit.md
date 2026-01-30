# ASTR101 SP26 Demos → Cosmic Playground Migration Audit (2026-01-30)

**Source to migrate from:** `~/Teaching/astr101-sp26/demos/`  
**Target repo:** `astrobytes-edu/cosmic-playground` (pnpm monorepo)  
**Backwards compatibility:** **Not required** (we can break formats and refactor aggressively)

## Executive summary

`cosmic-playground` is already a solid “museum shell” plus a demo build pipeline, with pragmatic quality gates and Playwright smoke coverage. The main missing pieces to migrate *all* ASTR101 SP26 materials are:

1. A **migration workflow** (scriptable import + refactor checklist per demo).
2. A real **content model for instructor notes** (the current instructor pages are placeholders rendered from demo metadata).
3. A **shared “physics + formatting” layer** (`packages/physics`) populated from the legacy `_assets/*-model.js` and `_assets/physics/*.js`.
4. A decision on what to do with the legacy “suite UX” features (starfield background, demo-polish microinteractions, station-mode and help panel, challenge/tour engines).

The legacy suite already has good separation between **testable model code** (`_assets/*-model.js`) and **UI code** (`<demo>/<demo>.js`). That’s the key leverage point: port models first, then port UI and shell.

## Current state of `cosmic-playground` (target)

### Site + content

- Astro “museum” site: `apps/site` (static build, GitHub Pages base path supported via `import.meta.env.BASE_URL`).
- Demo metadata lives in `apps/site/src/content/demos/*.md` (title, topics, predict/play/explain prompts, model notes, etc.).
- Exhibit pages: `apps/site/src/pages/exhibits/[slug].astro` embed the demo and render pedagogy from the demo content entry.
- Station pages: `apps/site/src/pages/stations/[slug].astro` are print-first and now support optional `station_params` rows (fallback placeholder otherwise).
- Instructor pages: `apps/site/src/pages/instructor/[slug].astro` are currently **placeholder** sections populated from demo metadata (misconceptions + model notes) and a hardcoded backlog; **no real instructor content collection yet**.

### Demos build + gates

- Demos are Vite multi-entry apps in `apps/demos/src/demos/<slug>/` building to `apps/demos/dist/<slug>/`, then copied to `apps/site/public/play/<slug>/` via `scripts/build.mjs`.
- Build-time validator: `scripts/validate-play-dirs.mjs` enforces “instrument standard” HTML markers and some semantics:
  - required markers exist (`#cp-demo`, `#copyResults`, `#status`, `.cp-demo__drawer`)
  - `#status` is a live region (`role="status"`, `aria-live="polite"`)
  - `#copyResults` is a `<button type="button">`
  - `#cp-demo` has an accessible name (`aria-label` or `aria-labelledby`)
  - content metadata exists for each demo source folder
- Playwright smoke tests: `apps/site/tests/smoke.spec.ts`
  - all `/play/<slug>/` pages load and show `#cp-demo` with no console errors
  - pilot-quality export text is enforced for `binary-orbits`
  - keyboard activation for Copy Results is enforced for `binary-orbits`
  - reduced-motion behavior is enforced for `binary-orbits` (no continuous rAF loop)

### Demo implementation status

- “Real” demos in `apps/demos`:
  - `moon-phases` (pilot)
  - `binary-orbits` (pilot-quality instrument)
- Still stubbed (use `apps/demos/src/shared/stub-demo.ts`):
  - `angular-size`, `blackbody-radiation`, `conservation-laws`, `eclipse-geometry`, `em-spectrum`, `keplers-laws`, `parallax-distance`, `seasons`, `telescope-resolution`

### Packages

- `packages/theme`: token + shell CSS.
- `packages/runtime`: mode plumbing + export formatting + clipboard helper.
- `packages/physics`, `packages/ui`: present but effectively placeholders (only export `PACKAGE_NAME` today).

## Current state of `~/Teaching/astr101-sp26/demos/` (source)

### Inventory

- ~167 files (rough order of magnitude).
- Per-demo folders (match the `cosmic-playground` slugs 1:1):  
  `angular-size`, `binary-orbits`, `blackbody-radiation`, `conservation-laws`, `eclipse-geometry`, `em-spectrum`, `keplers-laws`, `moon-phases`, `parallax-distance`, `seasons`, `telescope-resolution`.
- Shared folders:
  - `_assets/` (shared CSS/JS/model engines/data)
  - `_instructor/` (Quarto `.qmd` instructor guides + suite-level docs)

### Per-demo structure (typical)

Each demo generally contains:

- `index.html` (script tags pulling from `_assets` + per-demo JS)
- `<slug>.js` (UI/controller code; wraps model)
- `<slug>.css` (demo styling)
- `README.md`
- `<slug>-station-card.qmd` (Quarto station card wrapper; typically includes `_assets/station-cards/<slug>.qmd`)

Some demos include local data JS:

- `em-spectrum`: `object-data.js`, `telescope-data.js`
- `parallax-distance`: `star-data.js`
- `telescope-resolution`: `telescope-data.js`

### Shared `_assets` content (high value)

The legacy suite already has several “packages-in-waiting”:

- **Testable model code per demo:** `_assets/<slug>-model.js` (e.g. `binary-orbits-model.js`, `seasons-model.js`).
- **Shared physics primitives:** `_assets/physics/astro-constants.js`, `units.js`, `two-body-analytic.js`.
- **Math rendering:** `_assets/katex/*` (used by multiple demos).
- **UX helpers:** `_assets/demo-shell.css`, `demo-polish.js`, `demo-modes.js` (+ CSS), `demo-legacy.css`.
- **Engines:** `_assets/challenge-engine.js`, `_assets/tour-engine.js` (not yet present in `@cosmic/runtime`).
- **Background:** `_assets/starfield.js` + `astro-theme.css`.

### Legacy script dependency map (per demo)

From the legacy `index.html` script tags:

- Uses KaTeX: `binary-orbits`, `blackbody-radiation`, `conservation-laws`, `em-spectrum`, `keplers-laws`, `parallax-distance`, `telescope-resolution`
- Uses shared physics (`_assets/physics/*`): `angular-size`, `binary-orbits`, `conservation-laws`, `eclipse-geometry`, `keplers-laws`, `moon-phases`, `seasons`
- Uses `demo-modes.js` (station/help panel): `angular-size`, `eclipse-geometry`, `moon-phases`, `seasons`
- Uses `challenge-engine.js`: `eclipse-geometry`, `moon-phases`
- Uses `stellar-utils.js`: `binary-orbits`
- Most use `starfield.js` + `demo-polish.js` + `astro-utils.js`

### Instructor materials (`_instructor`)

- Suite-level guides exist (e.g. `light-and-telescopes/`, `distance-and-measurement/`, `cosmic-playground/`) plus a hub `index.qmd`.
- Each demo has a structured instructor bundle:
  - `index.qmd` (teach-first guide)
  - `activities.qmd`
  - `assessment.qmd`
  - `model.qmd`
  - `backlog.qmd`

This aligns *very well* with `docs/specs/cosmic-playground-site-spec.md` Section 8.5 (Instructor notes structure) — the main gap is that `cosmic-playground` currently has nowhere to store/render this richness.

## Gaps / risks / decisions (no backward compat)

### 1) Content model gap: instructor notes

Current instructor pages are generated from demo metadata and don’t support:
- multi-page instructor bundles (activities/assessment/model/backlog)
- suite-level guides (unit hubs)
- embedded demo/station includes from the Quarto system

**Decision:** create a real instructor content collection (or embed instructor content into the demos collection, but that will bloat demo metadata).

### 2) Shared engines + utilities gap

Legacy has working “tour/challenge” engines and station-mode tooling; `@cosmic/runtime` does not (yet).

**Decision:** either:
- (A) port the engines into `packages/runtime` and standardize on them, or
- (B) drop them and keep v1 simpler (but you’ll be throwing away working pedagogy UX).

Given the source already uses them and backwards compat is not required, **porting is usually cheaper long-term** (especially for instructor materials).

### 3) KaTeX strategy

Legacy loads KaTeX via local assets and uses it in several demos and instructor docs.

**Decision:** pick one:
- ship KaTeX via a package dependency and render via `@cosmic/runtime` helper, or
- keep KaTeX as static assets under `apps/site/public/vendor/katex/` and have demos reference it, or
- remove KaTeX from demos and move math to exhibit/instructor pages only.

### 4) Styling + “cosmic background”

Legacy uses `astro-theme.css` and `starfield.js`. The new museum has its own design system (`@cosmic/theme`) and emphasizes readability.

**Decision:** keep starfield as an optional “flavor layer” only if it doesn’t hurt contrast or performance; otherwise drop.

### 5) Migration automation vs hand-porting

You can brute-force port 11 demos by hand, but you’ll lose time to repeated chores (moving DOM wiring, export payloads, readout formatting).

**Recommendation:** build a migration script that **copies** legacy content into a staging area and generates:
- new `apps/demos` demo shells with TODOs
- new `apps/site` instructor/station content entries with resolved includes
- a manifest of what still needs manual refactor

## Recommended target architecture (post-migration)

### Demos (`apps/demos`)

- One demo per slug under `apps/demos/src/demos/<slug>/`.
- Demo code is TypeScript modules; avoid global UMD `window.*` models.
- Each demo imports its model from `@cosmic/physics` (or `@cosmic/physics/<slug>`).
- Shared UI patterns come from `@cosmic/ui` (or shared CSS + small TS helpers).
- Export behavior goes through `@cosmic/runtime` v1 export payload.

### Physics (`packages/physics`)

- Port legacy `_assets/physics/*.js` and `_assets/*-model.js` into typed, testable TS modules.
- Add unit tests for the model-level functions first (fast, stable).

### Runtime (`packages/runtime`)

- Consider absorbing legacy `tour-engine.js`, `challenge-engine.js` and exposing a stable API (even if not used by every demo).
- Optionally provide KaTeX “render math” helper (as site spec suggests).

### Site content (`apps/site`)

- Keep `demos` collection for high-level library metadata.
- Add **new** content collections (recommended):
  - `instructor/` for instructor guides (demo-specific + suite-level hubs)
  - `stations/` or extend `demos` with richer station sections (if you want station cards to be authored as content, not derived)
- Update `/instructor/<slug>/` to render from instructor content, not demo metadata.

## Concrete next steps (overview)

See the implementation plan: `docs/plans/2026-01-30-astr101-sp26-demos-migration.md`.

