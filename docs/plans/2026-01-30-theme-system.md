# Theme System (Museum + Instrument Layers) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a two-layer theme system (`museum` vs `instrument`) with shared tokens in `@cosmic/theme`, wire it into `apps/site` and all demos, and document the theme contract as a spec in `docs/specs/`.

**Architecture:** `packages/theme/styles/*.css` defines the canonical design tokens and layer rules. The museum site imports tokens + museum layer. Demo apps import tokens + instrument layer + demo-shell layout contract. A small TS helper provides layer utilities and canonical CSS var names.

**Tech Stack:** pnpm workspace, TypeScript, Astro, Vite.

---

### Task 1: Create `@cosmic/theme` styles + TS helpers

**Files:**
- Create: `packages/theme/styles/tokens.css`
- Create: `packages/theme/styles/layer-museum.css`
- Create: `packages/theme/styles/layer-instrument.css`
- Create: `packages/theme/styles/demo-shell.css`
- Create: `packages/theme/styles/print.css`
- Create: `packages/theme/src/vars.ts`
- Create: `packages/theme/src/layer.ts`
- Modify: `packages/theme/src/index.ts`
- Create: `packages/theme/README.md`
- Modify: `packages/theme/package.json`

**Step 1: Add CSS tokens + layer files**
- Implement shared tokens and both layer styles.
- Add demo shell layout contract + print stylesheet.

**Step 2: Add TS helpers**
- `CSS_VARS` map in `vars.ts`
- `setCosmicLayer` / `getCosmicLayer` in `layer.ts`
- Re-export from `src/index.ts`

**Step 3: Export CSS files from the package**
- Update `package.json` `exports` to include `./styles/*`.

**Step 4: Verify**
Run:
- `corepack pnpm -C packages/theme typecheck`
Expected: PASS

---

### Task 2: Wire museum theme into `apps/site`

**Files:**
- Modify: `apps/site/package.json`
- Modify: `apps/site/src/styles/global.css`
- Modify: `apps/site/src/layouts/Layout.astro`
- Modify: `apps/site/src/components/TagPill.astro`
- Modify: `apps/site/src/components/DemoCard.astro`
- Modify: `apps/site/src/components/FilterBar.astro`

**Step 1: Add `@cosmic/theme` dependency**
- Add `"@cosmic/theme": "workspace:*"`
- Run `corepack pnpm install`

**Step 2: Import theme CSS**
- In `global.css`: import `tokens.css`, `layer-museum.css`, `print.css`
- In `Layout.astro`: set `<body class="cp-layer-museum">` and mark chrome as `.cp-no-print`

**Step 3: Adopt theme primitives**
- Convert `TagPill` to output `.cp-badge` with `data-tone`.
- Convert cards/filter UI to use `.cp-card` surfaces where appropriate.

**Step 4: Verify**
Run:
- `corepack pnpm -C apps/site build`
- `corepack pnpm -C apps/site typecheck`
Expected: PASS

---

### Task 3: Wire instrument theme into demos

**Files:**
- Modify: `apps/demos/package.json`
- Modify: `apps/demos/src/demos/moon-phases/index.html`
- Modify: `apps/demos/src/demos/moon-phases/style.css`
- Modify: `apps/demos/src/shared/stub-demo.css`
- Modify: `apps/demos/src/shared/stub-demo.ts`
- Modify: `apps/demos/src/demos/*/index.html` (stub demos)

**Step 1: Add `@cosmic/theme` dependency**
- Add `"@cosmic/theme": "workspace:*"`
- Run `corepack pnpm install`

**Step 2: Import theme CSS in demo styles**
- For moon phases: import `tokens.css`, `layer-instrument.css`, `demo-shell.css`
- For stub demos: import the same in `stub-demo.css`

**Step 3: Align stub demos with demo-shell contract**
- Ensure each stub demo root uses `class="cp-layer-instrument cp-demo"` on `#cp-demo`.
- Ensure stub markup uses `.cp-demo__controls`, `.cp-demo__stage`, `.cp-demo__readouts`, `.cp-demo__drawer`.

**Step 4: Verify**
Run:
- `corepack pnpm -C apps/demos build`
- `corepack pnpm -C apps/demos typecheck`
Expected: PASS

---

### Task 4: Add theme spec in `docs/specs/`

**Files:**
- Create: `docs/specs/cosmic-playground-theme-spec.md`

**Step 1: Document contract**
- Two-layer model (museum vs instrument)
- Token naming + do/don’t rules
- Demo-shell region class contract
- Accessibility constraints (contrast, focus)
- Print rules for station cards

---

### Task 5: Full verification

**Step 1: Run full monorepo checks**
Run:
- `corepack pnpm build`
- `corepack pnpm typecheck`
Expected: PASS

