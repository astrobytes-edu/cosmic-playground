# ASTR101 SP26 Demo + Instructor Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all demos + instructor materials from `~/Teaching/astr101-sp26/demos/` into `cosmic-playground` as first-class content and Vite-built instruments, with no backward compatibility constraints.

**Architecture:** Treat the legacy folder as *source material*, but land a fully refactored `cosmic-playground` implementation:
- Demos become TypeScript module instruments in `apps/demos/src/demos/<slug>/` using `@cosmic/theme` + `@cosmic/runtime`.
- Legacy “model code” is ported into `packages/physics` with tests.
- Instructor bundles are ported from `.qmd` into a dedicated content collection and rendered by `/instructor/<slug>/`.
- Station cards are either (A) derived from `apps/site/src/content/demos/*.md` + `station_params`, or (B) upgraded into a dedicated station content collection (recommended if you want to preserve richer Quarto station content).

**Tech Stack:** pnpm workspace, Astro (static museum), Vite demos, TypeScript, Playwright.

---

## Phase 0: Inventory + decisions (short, but critical)

### Task 1: Write a migration manifest (slugs, titles, extra data files)

**Files:**
- Create: `docs/migration/astr101-sp26-manifest.md` (or `.json`)

**Step 1: Add a table for each demo**

Include:
- slug
- title
- legacy files (`<slug>.js`, `<slug>.css`, data JS)
- legacy model file (`_assets/<slug>-model.js`)
- uses KaTeX? uses demo-modes? uses challenge/tour?
- special assets/data requirements

**Step 2: Commit**

```bash
git add docs/migration/astr101-sp26-manifest.md
git commit -m "docs: add ASTR101 SP26 migration manifest"
```

---

## Phase 1: Content model for instructor materials (no backward compat)

### Task 2: Add an instructor content collection

**Files:**
- Modify: `apps/site/src/content/config.ts`
- Create: `apps/site/src/content/instructor/<slug>.mdx` (one per demo)
- Modify: `apps/site/src/pages/instructor/[slug].astro`

**Step 1: Add schema**

Example schema (keep minimal but structured):
```ts
const instructor = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    demo_slug: z.string().min(1),
    suite: z.string().optional(),
    last_updated: z.string().min(1)
  })
});
```

**Step 2: Render instructor content**

Update `/instructor/[slug].astro` to:
- load instructor entry by slug (or by `demo_slug`)
- render `Content` for the rich narrative
- keep a short header linking to the exhibit + demo

**Step 3: Add one sample entry and verify**

Create `apps/site/src/content/instructor/binary-orbits.mdx` with frontmatter + imported content.

**Step 4: Run**

```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

**Step 5: Commit**

```bash
git add apps/site/src/content/config.ts apps/site/src/pages/instructor/[slug].astro apps/site/src/content/instructor/binary-orbits.mdx
git commit -m "feat(site): add instructor content collection"
```

---

## Phase 2: Import/conversion script for Quarto instructor/station sources

### Task 3: Create an importer that converts `.qmd` to `.mdx`

**Files:**
- Create: `scripts/import-astr101-sp26.mjs`
- Create: `scripts/lib/quarto-inline-includes.mjs`

**Step 1: Define CLI**

`node scripts/import-astr101-sp26.mjs --src <path> --out <path>`

Where `--src` points at `~/Teaching/astr101-sp26/demos` and `--out` defaults to:
- instructor output: `apps/site/src/content/instructor/`
- optional station output: `apps/site/src/content/stations/` (if you choose to add it)

**Step 2: Inline Quarto include shortcodes**

Handle patterns like:
```
{{< include ../../_assets/station-cards/angular-size.qmd >}}
```

Implementation sketch:
- parse each line
- if it matches `{{< include <path> >}}`, replace with the contents of the target file (resolved relative to the `.qmd` file)

**Step 3: Convert QMD → MDX**

Minimal conversion rules for v1:
- keep headings/lists/code fences as-is
- strip Quarto frontmatter keys you don’t want
- preserve fenced divs (`:::` blocks) (Astro/MDX can keep them as plain Markdown; optionally convert to `<aside>` later)

**Step 4: Dry-run mode**

Add `--dry-run` that prints which files would be generated.

**Step 5: Commit**

```bash
git add scripts/import-astr101-sp26.mjs scripts/lib/quarto-inline-includes.mjs
git commit -m "chore(migration): add ASTR101 SP26 instructor import script"
```

---

## Phase 3: Port shared physics + models into `@cosmic/physics`

### Task 4: Port shared primitives from legacy `_assets/physics`

**Files:**
- Modify: `packages/physics/src/index.ts`
- Create: `packages/physics/src/units.ts`
- Create: `packages/physics/src/constants.ts`
- Create: `packages/physics/src/twoBodyAnalytic.ts`
- Create: `packages/physics/src/__tests__/twoBodyAnalytic.test.ts`

**Step 1: Write failing unit test**

Example:
```ts
import { describe, it, expect } from "vitest";
import { orbitalPeriod } from "../twoBodyAnalytic";

describe("twoBodyAnalytic", () => {
  it("computes period scaling with a^(3/2)", () => {
    expect(orbitalPeriod({ a: 2, mu: 1 })).toBeCloseTo(Math.sqrt(8), 6);
  });
});
```

**Step 2: Implement minimal exports**

Translate the legacy JS to typed TS, but keep API stable for demo code.

**Step 3: Run tests**

Add a test runner for packages (recommend `vitest`) or use Node’s built-in test runner. Pick one and standardize repo-wide.

**Step 4: Commit**

```bash
git add packages/physics/src
git commit -m "feat(physics): port shared primitives from legacy demos"
```

---

## Phase 4: Migrate demos (repeatable pattern, 1 slug at a time)

### Task 5: Define the per-demo migration checklist (template)

**Files:**
- Create: `docs/migration/demo-migration-checklist.md`

**Step 1: Write the checklist**

Checklist should include:
- stage is interactive
- 1–3 controls, 2+ readouts, “What to notice”
- `exportResults()` returns v1 payload and uses runtime copy
- no hardcoded colors (CSS vars in CSS + canvas)
- reduced motion supported (no continuous animation)
- passes build validator + E2E smoke

**Step 2: Commit**

```bash
git add docs/migration/demo-migration-checklist.md
git commit -m "docs: add per-demo migration checklist"
```

### Task 6+: Migrate each demo (one task per slug)

For each slug in:
`angular-size`, `blackbody-radiation`, `conservation-laws`, `eclipse-geometry`, `em-spectrum`, `keplers-laws`, `moon-phases`, `parallax-distance`, `seasons`, `telescope-resolution`, `binary-orbits`

**Files:**
- Modify: `apps/demos/src/demos/<slug>/index.html`
- Modify: `apps/demos/src/demos/<slug>/main.ts`
- Modify: `apps/demos/src/demos/<slug>/style.css`
- Modify: `apps/site/src/content/demos/<slug>.md`
- Create/Modify (optional): `packages/physics/src/<slug>*.ts`

**Step 1: Write/adjust the model module**

Port `_assets/<slug>-model.js` into `@cosmic/physics` (or local module), keeping functions testable and UI-free.

**Step 2: Implement the instrument**

Replace stub UI with:
- controls (labeled)
- stage (canvas/SVG)
- readouts
- model notes drawer
- export results button using runtime

**Step 3: Update metadata**

Make sure `apps/site/src/content/demos/<slug>.md` reflects the real demo behavior and model notes.

**Step 4: Verify**

```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/<slug> apps/site/src/content/demos/<slug>.md packages/physics/src
git commit -m "feat(demo): migrate <slug> to new instrument standard"
```

---

## Phase 5: Migrate instructor bundles (all slugs)

### Task 7: Run the instructor importer and land the converted content

**Files:**
- Create: `apps/site/src/content/instructor/*.mdx`
- Modify: `apps/site/src/pages/instructor/[slug].astro` (if needed for layout)

**Step 1: Run import script**

```bash
node scripts/import-astr101-sp26.mjs --src ~/Teaching/astr101-sp26/demos
```

**Step 2: Manual cleanup pass**

Per imported MDX:
- ensure internal links use `import.meta.env.BASE_URL`
- replace `/demos/<slug>/` legacy links with `/play/<slug>/` or `/exhibits/<slug>/`
- ensure no Quarto-only shortcodes remain

**Step 3: Verify**

```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

**Step 4: Commit**

```bash
git add apps/site/src/content/instructor apps/site/src/pages/instructor/[slug].astro
git commit -m "feat(content): import instructor guides from ASTR101 SP26"
```

---

## Phase 6: Tighten gates (since backward compat not needed)

### Task 8: Remove stub demo code and require “real demo” minimums

**Files:**
- Delete: `apps/demos/src/shared/stub-demo.ts`
- Delete: `apps/demos/src/shared/stub-demo.css`
- Modify: `scripts/validate-play-dirs.mjs`
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Remove stub scaffolding**

After all demos are migrated, remove stub helpers and ensure no demo imports them.

**Step 2: Add at least one “real-ness” gate**

Example: require a readouts panel contains 2+ `.cp-readout` blocks in built HTML (pragmatic but enforceable).

**Step 3: Verify + commit**

```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
git add -A
git commit -m "chore: drop stub demos and enforce real instrument minimums"
```

---

## Final verification

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Then:
```bash
git push origin main
```

