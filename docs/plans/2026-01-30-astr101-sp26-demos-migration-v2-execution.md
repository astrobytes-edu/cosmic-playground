# ASTR101 SP26 Migration v2 — Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Migrate *all* ASTR101 SP26 demos + instructor/station materials from `~/Teaching/astr101-sp26/demos/` into `astrobytes-edu/cosmic-playground` as first-class content and Vite-built instruments (no backward compatibility required).

**Architecture:** Keep the museum site static/fast (minimal client JS), and treat demos as Vite-built “instruments” that are copied into `apps/site/public/play/<slug>/`. Instructor/station materials become Astro content collections, imported from legacy Quarto `.qmd` with a small conversion script (includes inlined; callouts converted into Markdown-friendly blockquotes / admonitions).

**Tech Stack:** pnpm workspace, Astro content collections (mostly Markdown; MDX only when needed), Vite + TypeScript demos, `@cosmic/runtime` instrument runtime, KaTeX as a normal dependency (with an explicit vendoring fallback only if dependency install is blocked).

---

## Status snapshot (2026-01-30)

- ✅ Milestones 0–3 (inventory, content collections, KaTeX, Quarto import) are complete.
- ✅ `packages/physics` has Vitest + ports of legacy shared physics.
- ✅ `@cosmic/runtime` now includes `DemoModes` (Help/Station) and `ChallengeEngine` (wired up in `moon-phases` as the first integration).
- ⚠️ Remaining work is dominated by per-demo migration + drift prevention:
  - Most demos are still stubs but already have imported station/instructor content.
  - Some imported content still references legacy controls not yet implemented in the new instruments (until content is verified per demo).

## Guardrails (prevent scope explosion)

1. **Milestone hard stops:** Stop after each milestone and report status; do not continue into the next milestone in the same run.
2. **End-of-milestone gates:** Every milestone ends with:
   - `corepack pnpm build`
   - `corepack pnpm -C apps/site test:e2e`
3. **Ordering rule (do not reorder):**
   1) inventory + baseline snapshots
   2) site content model + build pipeline
   3) one demo end-to-end to the quality bar
   4) batch waves (2–3 demos per wave)
4. **Workspace rule:** do work in this repo (no git worktrees).

---

## Decisions (locked for v1 unless noted)

1. **Content model**
   - Keep `apps/site/src/content/demos/*.md` as the library metadata + exhibit copy source of truth.
   - Add multiple collections:
     - `instructor/` for demo instructor bundles (directory per bundle, fixed filenames).
     - `hubs/` for suite-level hubs (“Light & Telescopes”, “Distance & Measurement”, “Cosmic Playground”).
     - `stations/` for station-card overrides (see below).
   - **MDX rule:** only use MDX where we need components; default to `.md` for stability.
2. **Station cards**
   - Default station cards are **derived** from demo metadata (fast + consistent).
   - If a station needs nuance, it gets an **override** entry in `stations/` imported from legacy `_assets/station-cards/<slug>.qmd`.
   - Legacy `.qmd` remains archival only; the override content is authoritative.
3. **Shared engines**
   - Port legacy engines into `packages/runtime`, but **freeze the public API first** (types + exported entrypoints), then modernize internals.
   - New demos may only import from `@cosmic/runtime` public exports (no reaching into internal files).
4. **KaTeX strategy**
   - Museum pages: ship KaTeX as a dependency and only load it on pages that declare they contain math (instructor/stations).
   - Demo apps: include KaTeX only for demos that render math (avoid pulling it into every demo).
   - If dependency install is blocked, fall back to vendoring KaTeX assets under `apps/site/public/vendor/katex/` (explicit exception).
5. **Physics strategy**
   - Port `_assets/physics/*.js` + `_assets/*-model.js` into `packages/physics` as TypeScript modules.
   - Add a real unit-test runner (Vitest) and write tests for model code first, then refactor.
   - Model contract: demos consume pure, deterministic functions (testable), not globals.
6. **Demo UI strategy**
   - Use `@cosmic/theme` tokens and the instrument HTML contract everywhere.
   - Prefer `@cosmic/ui` components for interaction patterns (controls/readouts/callouts) to prevent UI drift; CSS-only patterns are a last resort.
7. **Performance/a11y gates**
   - Keep existing HTML-marker validator + Playwright smoke.
   - Add incremental gates as we migrate: `prefers-reduced-motion` compliance for any demo with animation, and “Copy results” keyboard activation for every demo.
   - In E2E, treat console errors as failures (already enforced in smoke tests).

---

## Milestone 0: Inventory + baseline snapshots (HARD STOP)

### Task 0.1: Baseline gates (golden smoke)

**Files:**
- Create: `docs/migration/2026-01-30-baseline.md`

**Step 1: Run baseline**

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: both succeed (this is the “known good” baseline).

**Step 2: Record**

Write a short baseline note with the exact commands run + pass/fail.

**Step 3: Commit**

```bash
git add docs/migration/2026-01-30-baseline.md
git commit -m "docs(migration): record baseline build + e2e"
```

### Task 0.2: Inventory (slugs, shared assets, math demos, data files)

**Files:**
- Create/Modify: `docs/migration/astr101-sp26-manifest.json`

**Step 1: Populate inventory fields**

The manifest must include:
- demo slugs + titles
- shared assets list (engines, KaTeX, shared physics)
- math demos vs non-math demos
- demo-modes demos
- external data-file demos

**Step 2: Verify JSON parses**

Run: `node -e "JSON.parse(require('node:fs').readFileSync('docs/migration/astr101-sp26-manifest.json','utf8')); console.log('OK')"`
Expected: prints `OK`.

**Step 3: Commit**

```bash
git add docs/migration/astr101-sp26-manifest.json
git commit -m "docs(migration): expand ASTR101 SP26 inventory manifest"
```

**Hard stop:** Stop here and report what inventory says is “math”, “data”, and “engine-heavy”.

---

## Milestone 1: Site content model (collections + rendering) (HARD STOP)

### Task 1.1: Add `instructor` + `hubs` + `stations` content collections

**Files:**
- Modify: `apps/site/src/content/config.ts`

**Step 1: Add collections**

- Add `stations` for station overrides.
- Add `instructor` for per-demo instructor bundle sections (index/activities/assessment/model/backlog).
- Add `hubs` for suite-level hub pages (index + optional extras).

**Step 2: Typecheck**

Run: `corepack pnpm -C apps/site typecheck`
Expected: success.

**Step 3: Commit**

```bash
git add apps/site/src/content/config.ts
git commit -m "feat(site): add instructor/hubs/stations content collections"
```

### Task 1.2: Station page supports overrides

**Files:**
- Modify: `apps/site/src/pages/stations/[slug].astro`

**Steps:**
1. If a `stations/<slug>` entry exists, render it.
2. Otherwise, fall back to the derived station layout (current behavior).
3. Commit.

### Task 1.3: Instructor page supports bundles

**Files:**
- Modify: `apps/site/src/pages/instructor/[slug].astro`

**Steps:**
1. If instructor bundle entries exist, render them (with a small internal nav).
2. Otherwise, fall back to the current placeholder derived from demo metadata.
3. Commit.

### Milestone 1 verification + stop

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```
Expected: pass.

**Hard stop:** Stop here and report which pages now render from content and which still use fallback.

---

## Milestone 2: KaTeX for instructor/stations (HARD STOP)

### Task 2.1: Add KaTeX dependency (preferred path)

**Files:**
- Modify: `apps/site/package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Install**

Run:
```bash
corepack pnpm -C apps/site add katex
```
Expected: dependency added and lock updated.

**Step 2: Commit**

```bash
git add apps/site/package.json pnpm-lock.yaml
git commit -m "chore(site): add katex dependency"
```

### Task 2.2: Add `KatexAutoRender` component (pages opt-in)

**Files:**
- Create: `apps/site/src/components/KatexAutoRender.astro`
- Modify: `apps/site/src/pages/instructor/[slug].astro`
- Modify: `apps/site/src/pages/stations/[slug].astro`

**Steps:**
1. Add a component that loads KaTeX CSS/JS and renders `$…$` and `$$…$$` inside the content container.
2. Only include the component when content frontmatter declares `has_math: true`.
3. Commit.

### Task 2.3 (fallback): Vendor KaTeX if install is blocked

If Task 2.1 cannot run due to environment restrictions:
- Copy from legacy `_assets/katex` into `apps/site/public/vendor/katex/`
- Implement `KatexAutoRender` against the vendored paths
- Record the exception in `docs/migration/2026-01-30-baseline.md`

### Milestone 2 verification + stop

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```
Expected: pass.

**Hard stop:** Stop here and report whether KaTeX is dependency-driven or vendored (and why).

---

## Milestone 3: Import Quarto instructor + station content (HARD STOP)

### Task 3.1: Add Quarto `.qmd` → Markdown/MDX importer

**Files:**
- Create: `scripts/import-astr101-sp26.mjs`
- Create: `scripts/lib/quarto-to-markdown.mjs`
- Create: `scripts/lib/quarto-inline-includes.mjs`

**Step 1: Script CLI**

`node scripts/import-astr101-sp26.mjs --src ~/Teaching/astr101-sp26/demos`

Outputs (overwrites allowed via `--force`):
- `apps/site/src/content/instructor/<bundle>/*.md`
- `apps/site/src/content/stations/<slug>.md`

**Step 2: Conversion rules**

- Inline `{{< include ... >}}` before conversion.
- Convert Quarto callouts (`::: {.callout-... title="..."}`) into Markdown-friendly blockquote sections (preserving title and “kind” where possible).
- Keep headings/lists/tables/code fences.
- Preserve inline math (leave `$...$` as-is for KaTeX autorender).

**Step 3: Dry-run**

Run: `node scripts/import-astr101-sp26.mjs --src ~/Teaching/astr101-sp26/demos --dry-run`
Expected: prints a deterministic list of files it would write.

**Step 4: First import**

Run: `node scripts/import-astr101-sp26.mjs --src ~/Teaching/astr101-sp26/demos --force`
Expected: instructor + station MDX files generated for all bundles.

**Step 5: Verify build**

Run: `corepack pnpm -C apps/site build`
Expected: build succeeds with imported content.

**Step 6: Commit**

```bash
git add scripts/import-astr101-sp26.mjs scripts/lib/quarto-to-markdown.mjs scripts/lib/quarto-inline-includes.mjs apps/site/src/content/instructor apps/site/src/content/stations
git commit -m "chore(migration): import legacy instructor + station content from Quarto"
```

---

## Milestone 4: Drift prevention (content vs demo) (HARD STOP)

**Goal:** Prevent “imported legacy content” from being mistaken as “current behavior” while demos are still stubs / partially migrated.

### Task 4.1: Add explicit content verification flags

**Files:**
- Modify: `apps/site/src/content/config.ts`
- Modify: `apps/site/src/pages/instructor/[slug].astro`
- Modify: `apps/site/src/pages/stations/[slug].astro`
- Create: `apps/site/src/components/LegacyContentBanner.astro`

**Step 1: Extend collection schemas**

Add a field like:
- `content_status: "legacy" | "verified" | "edited"`

Default imported Quarto content to `legacy`.

**Step 2: Render a banner on legacy pages**

When `content_status !== "verified"`, show a print-friendly banner explaining:
- content is imported from legacy
- demo UI may not match yet
- treat as draft until verified

**Step 3: Typecheck + commit**

Run: `corepack pnpm -C apps/site typecheck`  
Expected: success.

Commit: `feat(site): label imported instructor/station content as legacy`

### Task 4.2: Fix `binary-orbits` unit/copy mismatch (surgical)

**Files:**
- Modify: `apps/demos/src/demos/binary-orbits/index.html`
- Modify: `apps/site/src/content/demos/binary-orbits.md`

**Steps:**
1. Update UI labels/model notes to match teaching units (AU/yr/M☉, `G = 4π²`) used by the demo code.
2. Update exhibit `model_notes` to match.
3. Run the end-of-milestone gates + commit.

### Milestone 4 verification + stop

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```
Expected: pass.

**Hard stop:** Stop here and report that (a) legacy content is labeled, and (b) `binary-orbits` copy is unit-consistent.

---

## Demo build pipeline notes (Vite multi-entry)

- Vite multi-page build is configured in `apps/demos/vite.config.ts`:
  - auto-discovers slugs under `apps/demos/src/demos/`
  - uses `rollupOptions.input` map for per-slug HTML entrypoints
  - sets `base: "./"` for portable hosting under `apps/site/public/play/<slug>/`

## Task 7+: Physics + demos (repeat per slug; TDD first)

**Note:** These tasks are longer; execute in small batches (1–2 demos per batch).

### Task 7: Set up `packages/physics` unit tests (Vitest)

**Files:**
- Modify: `package.json`
- Modify: `packages/physics/package.json`
- Create: `packages/physics/vitest.config.ts`
- Create: `packages/physics/src/__tests__/sanity.test.ts`

**Steps:**
1. Add Vitest dev dependency at workspace root.
2. Add `packages/physics` script: `test`.
3. Write a failing test, run it, make it pass.
4. Commit.

**Verify:**
- `corepack pnpm -C packages/physics test` passes.

### Task 8+: Port model code + migrate each demo UI

For each slug:
1. Port model from `~/Teaching/astr101-sp26/demos/_assets/<slug>-model.js` into `packages/physics/src/<slug>.ts` with tests first.
2. Replace the stub demo UI in `apps/demos/src/demos/<slug>/` with a TS instrument using the new model.
3. Ensure export payload v1 + reduced motion + keyboard Copy Results.
4. Update demo metadata (`apps/site/src/content/demos/<slug>.md`) with real prompts + station params (or rely on station content).
5. Run full gates:
   - `corepack pnpm build`
   - `corepack pnpm -C apps/site test:e2e`
6. Commit per demo: `feat(demo): migrate <slug>`

---

## Final verification (before any push)

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: both succeed with no regressions.

---

## Spec Deviations

- None intended. If we add any new route outside the canonical set in `docs/specs/cosmic-playground-site-spec.md`, record it here explicitly.
