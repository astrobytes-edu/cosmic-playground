# ASTR101 SP26 Migration v2 — Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Migrate *all* ASTR101 SP26 demos + instructor/station materials from `~/Teaching/astr101-sp26/demos/` into `astrobytes-edu/cosmic-playground` as first-class content and Vite-built instruments (no backward compatibility required).

**Architecture:** Keep the museum site static/fast (minimal client JS), and treat demos as Vite-built “instruments” that are copied into `apps/site/public/play/<slug>/`. Instructor/station materials become Astro content collections, imported from legacy Quarto `.qmd` with a small conversion script (includes inlined; callouts converted to semantic HTML).

**Tech Stack:** pnpm workspace, Astro content collections (MD/MDX), Vite + TypeScript demos, `@cosmic/runtime` instrument runtime, vendored KaTeX assets (no npm dependency).

---

## Decisions (locked for v1 unless noted)

1. **Content model**
   - Keep `apps/site/src/content/demos/*.md` as the library metadata + exhibit copy source of truth.
   - Add `apps/site/src/content/instructor/<bundle>/<section>.mdx` for instructor bundles **and** suite-level hubs (“units”).
   - Add `apps/site/src/content/stations/<slug>.mdx` for station cards; keep derived station cards as a fallback when a station entry is missing.
2. **Station cards**
   - Preserve the legacy Quarto station-card prose by importing `_assets/station-cards/<slug>.qmd` into the new `stations` collection.
   - Continue to support `station_params` rows from demo metadata as a fallback (existing behavior stays).
3. **Shared engines**
   - Port legacy engines into `packages/runtime` incrementally:
     - v1: keep current `createInstrumentRuntime` as the default.
     - v1.x: add optional `tour` / `challenge` exports (TS ports of legacy) when a demo needs them.
     - Do **not** ship suite-level “station/help mode” inside the museum pages; if desired, treat it as *demo-internal* UI.
4. **KaTeX strategy**
   - Vendor KaTeX assets from legacy (`_assets/katex`) into `apps/site/public/vendor/katex/`.
   - Render math **only on instructor + station pages** via a tiny inline autorender script; exhibits remain math-free by default to keep museum pages minimal.
5. **Physics strategy**
   - Port `_assets/physics/*.js` + `_assets/*-model.js` into `packages/physics` as TypeScript modules.
   - Add a real unit-test runner (recommended: Vitest) and write tests for model code first, then refactor.
6. **Demo UI strategy**
   - Use `@cosmic/theme` CSS + the instrument HTML contract for consistency.
   - Keep `@cosmic/ui` minimal for now; only extract UI components after they’re repeated across ≥3 demos (avoid premature abstractions).
7. **Performance/a11y gates**
   - Keep existing HTML-marker validator + Playwright smoke.
   - Add incremental gates as we migrate: `prefers-reduced-motion` compliance for any demo with animation, and “Copy results” keyboard activation for every demo.

---

## Task 0: Branch hygiene (no worktrees)

**Files:** none

**Step 1: Ensure clean status**

Run: `git status --porcelain`
Expected: empty output (or you consciously accept local changes before starting).

**Step 2: Create a working branch**

Run:
```bash
git checkout -b chore/astr101-sp26-migration
```
Expected: branch switches successfully.

**Step 3: Commit cadence**

Commit every task below as specified (small, logical commits).

---

## Task 1: Add migration manifest (slugs + legacy deps)

**Files:**
- Create: `docs/migration/astr101-sp26-manifest.json`

**Step 1: Create manifest**

Each entry must include:
- `slug`, `title`
- `legacy`: `{ demo_dir, model_file, station_card_include, uses: { katex, demoModes, tourEngine, challengeEngine }, dataFiles: string[] }`
- `target`: `{ demo_status: "stub" | "ported", needsPhysicsPort: boolean }`

**Step 2: Verify JSON parses**

Run: `node -e "JSON.parse(require('node:fs').readFileSync('docs/migration/astr101-sp26-manifest.json','utf8')); console.log('OK')"`
Expected: prints `OK`.

**Step 3: Commit**

```bash
git add docs/migration/astr101-sp26-manifest.json
git commit -m "docs(migration): add ASTR101 SP26 manifest"
```

---

## Task 2: Add `instructor` + `stations` content collections

**Files:**
- Modify: `apps/site/src/content/config.ts`

**Step 1: Add collections**

- Add `stations` (MDX) with schema: `title`, `demo_slug`, `last_updated`, `has_math` (optional boolean).
- Add `instructor` (MDX) with schema: `title`, `bundle`, `kind: "demo" | "hub"`, `section: "index" | "activities" | "assessment" | "model" | "backlog"`, `demo_slug?`, `last_updated`, `has_math?`.

**Step 2: Typecheck**

Run: `corepack pnpm -C apps/site typecheck`
Expected: success.

**Step 3: Commit**

```bash
git add apps/site/src/content/config.ts
git commit -m "feat(site): add instructor + stations content collections"
```

---

## Task 3: Render station cards from content when available

**Files:**
- Modify: `apps/site/src/pages/stations/[slug].astro`
- Create: `apps/site/src/content/stations/binary-orbits.mdx` (temporary fixture)

**Step 1: Prefer station content**

In the station page:
- Attempt `getEntry("stations", slug)` first.
- If found: render `<Content />` inside the station layout and keep the header + exhibit link.
- If not found: fall back to the existing derived station card template.

**Step 2: Add one fixture entry**

Add `binary-orbits.mdx` with a simple heading + a short excerpt (we’ll replace via importer later).

**Step 3: Verify**

Run: `corepack pnpm -C apps/site build`
Expected: build succeeds; `/stations/binary-orbits/` uses the MDX content.

**Step 4: Commit**

```bash
git add apps/site/src/pages/stations/[slug].astro apps/site/src/content/stations/binary-orbits.mdx
git commit -m "feat(site): allow station cards to be authored as content"
```

---

## Task 4: Render instructor bundles from content (and keep fallback)

**Files:**
- Modify: `apps/site/src/pages/instructor/[slug].astro`
- Create: `apps/site/src/content/instructor/binary-orbits/index.mdx` (temporary fixture)

**Step 1: Instructor bundle resolver**

Update `/instructor/[slug].astro` to:
- Attempt to load instructor entries where `bundle === slug`.
- If any exist: render a simple internal nav (index/activities/assessment/model/backlog) and render each section’s MDX.
- If none exist: fall back to the current placeholder rendering from `demos` metadata (so pages keep working during migration).

**Step 2: Add one fixture entry**

Create `binary-orbits/index.mdx` with a short “Why this demo exists” and keep the rest as TODO (importer will replace).

**Step 3: Verify**

Run: `corepack pnpm -C apps/site build`
Expected: build succeeds; `/instructor/binary-orbits/` renders MDX content.

**Step 4: Commit**

```bash
git add apps/site/src/pages/instructor/[slug].astro apps/site/src/content/instructor/binary-orbits/index.mdx
git commit -m "feat(site): render instructor bundles from content when present"
```

---

## Task 5: Vendor KaTeX assets + minimal autorender on instructor/stations

**Files:**
- Create: `apps/site/public/vendor/katex/` (copy assets)
- Create: `apps/site/src/components/KatexAutoRender.astro`
- Modify: `apps/site/src/pages/instructor/[slug].astro`
- Modify: `apps/site/src/pages/stations/[slug].astro`

**Step 1: Copy legacy assets**

Run:
```bash
mkdir -p apps/site/public/vendor/katex
cp -R ~/Teaching/astr101-sp26/demos/_assets/katex/* apps/site/public/vendor/katex/
```
Expected: KaTeX CSS/JS/fonts present under `apps/site/public/vendor/katex/`.

**Step 2: Add `KatexAutoRender` component**

Component responsibilities:
- Link KaTeX CSS from `import.meta.env.BASE_URL`.
- Load KaTeX JS from `import.meta.env.BASE_URL`.
- Inline a tiny script that renders `$...$` and `$$...$$` into KaTeX output inside a container element (no external deps).

**Step 3: Use on station/instructor pages**

- Only include the component when the rendered content indicates `has_math: true` (frontmatter flag), otherwise don’t load it.

**Step 4: Verify**

Run: `corepack pnpm -C apps/site build`
Expected: build succeeds.

**Step 5: Commit**

```bash
git add apps/site/public/vendor/katex apps/site/src/components/KatexAutoRender.astro apps/site/src/pages/instructor/[slug].astro apps/site/src/pages/stations/[slug].astro
git commit -m "feat(site): vendor KaTeX and autorender math on instructor/station pages"
```

---

## Task 6: Add Quarto `.qmd` → MDX importer (inlines includes + callouts)

**Files:**
- Create: `scripts/import-astr101-sp26.mjs`
- Create: `scripts/lib/quarto-to-mdx.mjs`
- Create: `scripts/lib/quarto-inline-includes.mjs`

**Step 1: Script CLI**

`node scripts/import-astr101-sp26.mjs --src ~/Teaching/astr101-sp26/demos`

Outputs (overwrites allowed via `--force`):
- `apps/site/src/content/instructor/<bundle>/*.mdx`
- `apps/site/src/content/stations/<slug>.mdx`

**Step 2: Conversion rules**

- Inline `{{< include ... >}}` before conversion.
- Convert Quarto callouts (`::: {.callout-... title="..."}`) into `<aside class="cp-callout" data-kind="...">`.
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
git add scripts/import-astr101-sp26.mjs scripts/lib/quarto-to-mdx.mjs scripts/lib/quarto-inline-includes.mjs apps/site/src/content/instructor apps/site/src/content/stations
git commit -m "chore(migration): import legacy instructor + station content from Quarto"
```

---

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

