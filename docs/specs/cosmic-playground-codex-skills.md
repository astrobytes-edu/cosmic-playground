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

## How to implement new skills (required workflow)

Use **`superpowers:writing-skills`** as the workflow spec. The short version:

1) **RED (baseline)**: write 3 pressure scenarios that combine time pressure + authority pressure + “just ship it” shortcuts. Run them *without* the new skill and capture failures verbatim.
2) **GREEN (minimal skill)**: write `~/.codex/skills/<skill-name>/SKILL.md` that directly counters the baseline failures.
3) **REFACTOR**: rerun scenarios *with* the skill; patch loopholes until the behavior is reliably corrected.
4) **STOP**: do not start another skill in the same session unless this one is “bulletproof enough”.

Keep SKILL.md short and searchable. Put “when to use” keywords in the `description:` field.

## Backlog: skills to add later (recommended order)

Each item below includes: goal, freedom level, and initial pressure tests to use for RED.

### 1) `cosmic-export-contracts` (medium freedom)

**Use when** adding/changing demo exports (`copyResults`, CSV, snapshots).

What it should enforce:

- Units and names consistent across UI labels, exported params/readouts, and instructor station tables.
- Stable field keys, versioning, and “human readable + machine readable” formatting.

Pressure tests:

- “Just dump whatever JSON is easy” → inconsistent keys, missing units, no versioning.

### 2) `cosmic-runtime-instrumentation` (medium/low freedom)

**Use when** adding shared runtime behaviors across demos (tooltips, slider progress, mode dialogs, shortcuts).

What it should enforce:

- Prefer adding/reusing runtime helpers in `packages/runtime/` rather than per-demo JS.
- Avoid duplicated tooltip/slider logic; hook into the shared runtime polish.

Pressure tests:

- “Only this demo needs it” → reimplements tooltips locally.

### 3) `cosmic-theme-tokens-and-components` (medium freedom)

**Use when** editing `packages/theme` (tokens, components, surfaces).

What it should enforce:

- Token-first styling, consistent component scoping, and avoiding ad-hoc raw colors.
- Backwards pressure: “I’ll just add a new CSS file in the demo” → should redirect to theme component patterns.

Pressure tests:

- “Just match legacy styling” → starts hardcoding colors/spacing instead of tokens.

### 4) `cosmic-basepath-smoke-tests` (low freedom)

**Use when** debugging 404s/broken routes in local or GH Pages builds.

What it should enforce:

- A repeatable triage flow: check `import.meta.env.BASE_URL` usage, demo `../../...` link usage, and `CP_BASE_PATH` for e2e.
- A quick “search for root-absolute links” checklist.

Pressure tests:

- “It works locally” → ignores base-path differences and ships broken GH Pages links.

### 5) `cosmic-instructor-materials-style` (high freedom)

**Use when** authoring instructor/station content for clarity and print/readability.

What it should enforce:

- Consistent section structure, callouts, tables, and explicit units/notation.
- Avoid putting math/links in demo excerpt paragraphs.

Pressure tests:

- “Just paste notes from a doc” → inconsistent headings, missing units, broken links.

### 6) `cosmic-ux-polish-pass` (high freedom, demo checklist)

**Use when** doing demo-by-demo polish without inventing new systems.

What it should enforce:

- A stable checklist: spacing, affordances, keyboard/focus, responsive layout, motion rules.
- “If you need a new pattern, add it once to theme/runtime, then reuse.”

Pressure tests:

- “This demo is special” → forks styles/layouts.

### 7) `cosmic-spec-to-implementation` (medium freedom)

**Use when** turning spec docs into execution plans and PR-sized task lists.

What it should enforce:

- Read `docs/specs/cosmic-playground-site-spec.md` first; cite concrete file targets.
- Include verification commands in every plan; don’t claim “done” without running them.

Pressure tests:

- “Start coding” → skips reading specs, produces drift and rework.
