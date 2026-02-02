# Cosmic Playground — Legacy Demo Migration Contract

**Status:** Draft (enforce in review + build gates)  
**Date:** 2026-02-02  
**Scope:** migrating legacy demos from `~/Teaching/astr101-sp26/demos/` into `cosmic-playground`

## Goal

Migrations must preserve the **teaching intent** and produce a consistent “instrument” experience:

- the demo behaves correctly and predictably
- the visualization is readable (token-first styling, no hardcoded colors)
- **math is authored as LaTeX** (rendered via the existing KaTeX runtime; no unicode-math in source strings)
- units are explicit and consistent across **UI ↔ exports ↔ site content**
- content does not misrepresent the current instrument (explicit “unverified” until reviewed)

This contract is intentionally stricter than “it runs”.

## Inputs (required reading per demo)

Before porting or “declaring done”, you must read:

1) Legacy demo folder:
- `~/Teaching/astr101-sp26/demos/<slug>/index.html`
- `~/Teaching/astr101-sp26/demos/<slug>/<slug>.js`
- `~/Teaching/astr101-sp26/demos/<slug>/<slug>.css`
- `~/Teaching/astr101-sp26/demos/<slug>/README.md` (if present)

2) Legacy model + shared assets (as applicable):
- `~/Teaching/astr101-sp26/demos/_assets/*-model.js`
- `~/Teaching/astr101-sp26/demos/_assets/physics/*.js`
- `~/Teaching/astr101-sp26/demos/_assets/demo-modes.js`, `_assets/challenge-engine.js` (if referenced)

3) Repo contracts:
- `docs/specs/cosmic-playground-site-spec.md`
- `docs/specs/cosmic-playground-theme-spec.md`
- `docs/specs/cosmic-playground-model-contract.md` (if physics/model code changes)
- `docs/specs/cosmic-playground-data-contract.md` (if datasets are involved)

## Non‑negotiable invariants

### 1) Base paths

- **Astro code** (`apps/site/src/**`): use `import.meta.env.BASE_URL` for internal links/assets.
- **Markdown content** (`apps/site/src/content/**`): no `BASE_URL`; no root-absolute `](/...)`; use relative links.
- **Vite demos** (`apps/demos/src/demos/**` served at `/play/<slug>/`):
  - no root-absolute links
  - never hardcode `/cosmic-playground/`
  - never treat `import.meta.env.BASE_URL` as site root

### 2) Instrument artifact contract (built output)

Built `apps/site/public/play/<slug>/index.html` must include:

- `#cp-demo` (with accessible name)
- `#copyResults`
- `#status` (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`)
- `.cp-demo__drawer`

### 3) Math formatting

- Author math as **LaTeX** (e.g. `$P^2=a^3/M$`, `\\pi`, `\\sigma_p`, `^{\\circ}`).
- Do not use unicode math symbols in authored source strings (examples to avoid: `°`, `☉`, `α`, `β`, `λ`, `σ`, `π`, `×`, `∝`, `²`).
- Do not add new KaTeX renderers/scripts; use the existing `@cosmic/runtime` KaTeX helpers (`initMath`/`renderMath`).

### 4) Units + notation

- Units explicit everywhere (UI labels, exports, docs); no “natural units”; no `G=1`.
- Teaching orbital normalization must stay: `$G = 4\\pi^2\\,\\mathrm{AU}^3/(\\mathrm{yr}^2\\,M_{\\odot})$`.
- Notation policy in teaching-facing copy: `D` = diameter, `d` = distance.

### 5) Styling + accessibility

- Token-first styling only; no app-layer hardcoded colors (per theme spec).
- Keyboard operable; visible `:focus-visible`; reduced-motion respected; dialog focus management correct.

## Definition of done (per demo)

A demo migration can be marked “done” only when all are true:

1) Legacy behavior review captured
- a short “legacy parity note” exists in the demo drawer model notes (what we kept, what we intentionally dropped, what’s deferred).

2) Physics/model correctness (when applicable)
- model lives in `packages/physics/src/<Something>Model.ts`
- required vitest coverage exists per `docs/specs/cosmic-playground-model-contract.md`
- `node scripts/validate-physics-models.mjs` passes

3) Export + copy UX
- exports are v1 payloads (`ExportPayloadV1`)
- exported names/notes have explicit units and are unicode-math-free in source

4) Content alignment signal
- `apps/site/src/content/demos/<slug>.md` has `content_verified: true` only after the exhibit/station/instructor copy is reviewed against the migrated UI and exports
- otherwise it stays `false` and the site shows an “unverified” warning banner

## Verification gates (required)

Run the applicable gates and keep them green:

- `node scripts/validate-invariants.mjs`
- `node scripts/validate-play-dirs.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
- If physics models changed: `node scripts/validate-physics-models.mjs` and `corepack pnpm -C packages/physics test`
- If datasets changed: `node scripts/validate-datasets.mjs`

