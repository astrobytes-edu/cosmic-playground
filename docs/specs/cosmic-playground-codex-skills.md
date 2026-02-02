# Cosmic Playground: Codex Skills (Current + Backlog)

This document exists so you can paste a single instruction block into a fresh Codex session and get consistent, repo-aligned skills built over time.

## How to use this doc in a new Codex session

Copy/paste the following (edit the target skill name as needed):

```text
You are Codex working in cosmic-playground.

Before doing anything:
1) Run `~/.codex/superpowers/.codex/superpowers-codex bootstrap`.
2) Read `docs/specs/cosmic-playground-site-spec.md` and treat it as the contract.
3) Load relevant skills, at minimum:
   - `superpowers:writing-skills`
   - `superpowers:test-driven-development`
   - `.system/skill-creator`
   - plus any existing Cosmic Playground personal skills listed in
     `docs/specs/cosmic-playground-codex-skills.md`.

Task:
Implement the next skill from the backlog in `docs/specs/cosmic-playground-codex-skills.md`.

Non-negotiables:
- Follow the TDD-for-skills loop from `superpowers:writing-skills` (do NOT batch multiple skills).
- Skills live in `~/.codex/skills/<skill-name>/SKILL.md` with ONLY `name` and `description` in YAML frontmatter.
- Enforce repo constraints: base paths, KaTeX runtime, explicit units, and D=diameter / d=distance notation in UI/content.
```

## Current personal skills (already created)

These are **personal Codex skills** (they live on disk, not in this repo). In a new session, load them via:

```bash
~/.codex/superpowers/.codex/superpowers-codex use-skill <skill-name>
```

### `cosmic-ui-ux`

Use when polishing UI/UX across Astro site + Vite demos + instructor/station materials:

- Enforces demo shell variants + theme tokens/components (no per-demo style systems).
- Enforces base-path safety:
  - Astro pages: `import.meta.env.BASE_URL`
  - Vite demos served from `/play/<slug>/`: use `../../...` (or compute `new URL("../../", window.location.href)`).
- Enforces scientific/math correctness guardrails in UI copy (explicit units; `D`/`d` policy; KaTeX runtime only).

### `cosmic-astro-site-engineering`

Use when changing Astro routing/layouts/components in `apps/site` (especially when base paths and “static-first” constraints are fragile):

- Enforces base-path-safe internal links/assets via `import.meta.env.BASE_URL` (no root-absolute `/...` and no hardcoded `/cosmic-playground/...`).
- Enforces “museum pages are mostly static HTML”: avoid `client:*` on site-wide layout/chrome; prefer GET forms + query params (e.g. `/explore/?q=...`) over global JS.
- Keeps `/stations/` and `/instructor/` paper-theme + print behavior centralized via `apps/site/src/layouts/Layout.astro` (and avoids adding new KaTeX renderers).

### `cosmic-accessibility-audit`

Use when doing an accessibility-focused polish pass or shipping UI interactions in Cosmic Playground:

- Enforces keyboard-only navigation, visible `:focus-visible` treatment, and skip-link correctness on the Astro site.
- Enforces dialog semantics + focus management, live-region status messaging (e.g. Copy results), reduced-motion support, and avoiding color-only meaning.
- Demo-specific: control labels, focus order, and `aria-*` naming for the instrument root (`#cp-demo`).

### `cosmic-export-contracts`

Use when adding/changing demo exports (`copyResults`, CSV, snapshots/station tables):

- Units and names consistent across UI labels, exported params/readouts, and instructor station tables.
- Stable field keys/labels, ordering, and versioning; “human readable + machine readable” formatting via shared runtime helpers.

### `cosmic-demo-authoring`

Use when creating/migrating demos under `apps/demos/src/demos/<slug>/`:

- Enforces the `/play/<slug>/index.html` **instrument contract** (`#cp-demo`, `#copyResults`, `#status`, `.cp-demo__drawer`, accessible name).
- Enforces the build/copy pipeline (`corepack pnpm build` → copy to `apps/site/public/play/<slug>/` → `scripts/validate-play-dirs.mjs`).
- Enforces cross-site links *from demos* via `../../exhibits/<slug>/` etc (no `/...` or `/cosmic-playground/...`).

### `cosmic-physics-modeling`

Use when editing `packages/physics` and other model code:

- Units are part of the API (`distanceKm`, `tiltDeg`, `thetaRad`, `periodYr`).
- No natural units (`G=1`); when relevant prefer AU/yr/M☉ teaching units.
- Requires tests for model changes (benchmark + limiting-case), discourages brittle golden-decimal tests.
- Fixes belong in the model, not demo-only fudge factors.

### `cosmic-content-authoring`

Use when editing site content in `apps/site/src/content/**`:

- Enforces schema correctness (`apps/site/src/content/config.ts`).
- Prevents base-path-breaking markdown links (no `](/...)`, no `/cosmic-playground/...`, no full `https://...github.io/...` URLs).
- Uses KaTeX auto-render only (no extra renderers/scripts in markdown).
- Keeps demo excerpt paragraph plain text (no links/math in first paragraph).

### `cosmic-instructor-materials-style`

Use when authoring or editing instructor notes and station cards (`apps/site/src/content/instructor/**`, `apps/site/src/content/stations/**`):

- Enforces the instructor/station content schemas (`apps/site/src/content/config.ts`) and the instructor section file layout (`index|activities|assessment|model|backlog`).
- Keeps materials print-first by fixing content (no page-local print CSS; global print fixes only in `packages/theme/styles/print.css`).
- Enforces base-path-safe markdown links in content (no `import.meta.env.BASE_URL` and no root-absolute `](/...)` links).
- Enforces explicit units and correct `D` (diameter) / `d` (distance) notation in teaching copy.

### `cosmic-ux-polish-pass`

Use when doing a demo-by-demo UX polish pass without inventing new systems or letting one demo drift from the shared instrument style:

- Uses a stable checklist (layout, affordances, keyboard/focus, responsive behavior, reduced motion).
- Fixes “shared problems” (reproducible in 2+ demos) once in `apps/demos/src/shared/stub-demo.css` or `packages/theme/styles/*` (not demo-local overrides).
- Avoids new dependencies (no GSAP/anime.js “just for polish”) and keeps motion token-based + `prefers-reduced-motion` safe.

### `cosmic-spec-to-implementation`

Use when turning Cosmic Playground spec docs into an execution plan (file targets + acceptance criteria + verification commands), especially when time/authority pressure tempts “just start coding” or “just make CI green”:

- Starts by citing the relevant spec sections (site spec + theme spec when applicable).
- Produces a falsifiable plan: concrete file targets, PR-sized slices, and commands (no claiming “done/saved/ran” without actually doing it).
- Refuses “fix CI by unsetting `CP_BASE_PATH`” and keeps base-path safety front-and-center.

### `cosmic-runtime-instrumentation`

Use when adding shared runtime behaviors across demos (tooltips, slider progress, help/station dialogs, keyboard shortcuts, mode persistence):

- Prefers `packages/runtime` helpers (and extending them once) over per-demo JS.
- Avoids duplicated tooltip/keydown/mode-persistence logic in `apps/demos/src/demos/<slug>/main.ts` under “just ship it” pressure.

### `cosmic-theme-tokens-and-components`

Use when changing Cosmic Playground styling (tokens, layers, components, print) in a way that could create UI drift:

- Enforces token-first styling and avoids new color literals in `apps/site` and `apps/demos` (visualization-only exceptions allowed).
- Prefers updating `packages/theme/styles/*` (tokens/layers/components/print) over per-demo CSS or page-local print hacks.

### `cosmic-basepath-smoke-tests`

Use when debugging 404s/broken routes in local or GitHub Pages builds (especially anything that changes under a base path):

- Checks `CP_BASE_PATH` first, then audits root-absolute links in Astro + markdown content.
- Enforces correct cross-site linking from demos under `/play/<slug>/` (no `import.meta.env.BASE_URL` in demos; use `../../...` or computed `siteRoot`).

## How to implement new skills (required workflow)

Use **`superpowers:writing-skills`** as the workflow spec. The short version:

1) **RED (baseline)**: write 3 pressure scenarios that combine time pressure + authority pressure + “just ship it” shortcuts. Run them *without* the new skill and capture failures verbatim.
2) **GREEN (minimal skill)**: write `~/.codex/skills/<skill-name>/SKILL.md` that directly counters the baseline failures.
3) **REFACTOR**: rerun scenarios *with* the skill; patch loopholes until the behavior is reliably corrected.
4) **STOP**: do not start another skill in the same session unless this one is “bulletproof enough”.

Keep SKILL.md short and searchable. Put “when to use” keywords in the `description:` field.

## Backlog: skills to add later (recommended order)

Each item below includes: goal, freedom level, and initial pressure tests to use for RED.

Backlog is empty (as of 2026-02-01).
