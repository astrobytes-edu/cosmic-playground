# UI/UX Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the Astro museum site + Vite demos + station/instructor materials up to (or beyond) the polish of the legacy demos by porting *UX behaviors and design patterns* (not architecture) into shared theme/runtime code.

**Architecture:** Token-first styling in `@cosmic/theme` (no new hardcoded colors) + minimal shared demo polish in `@cosmic/runtime` so every demo inherits consistent controls (buttons, selects, sliders) and micro-interactions (slider progress, optional tooltips, reduced-motion safe tap feedback). Demo pages opt into layout emphasis via `data-shell` variants, implemented in `packages/theme/styles/demo-shell.css`.

**Tech Stack:** Astro (`apps/site`), Vite + TS (`apps/demos`), CSS tokens/layers (`packages/theme`), runtime helpers (`packages/runtime`).

## Hard constraints (do not violate)

- Treat `docs/specs/cosmic-playground-site-spec.md` as the contract.
- GitHub Pages base path safe links: prefer `import.meta.env.BASE_URL` (site) and/or safe relative links (demos).
- Units explicit everywhere; do **not** introduce “natural units”; UI notation: `D = diameter`, `d = distance`.
- KaTeX: already globally served + runtime auto-render exists; do not add new ad-hoc math renderers.
- Backwards compatibility not needed: remove replaced code to keep repo clean.

---

## Task 1: Implement demo shell variants (layout-only)

**Files:**
- Modify: `packages/theme/styles/demo-shell.css`
- (Doc already exists): `docs/specs/cosmic-playground-demo-shell-variants.md`

**Step 1: Add `data-shell="triad"` variant**
- Update `.cp-demo` grid to support 3-column layout on wide screens:
  - controls | stage | readouts
  - drawer below (consistent rule: below stage+readouts)

**Step 2: Add `data-shell="viz-first"` variant**
- Stage full width at top; below-panels grid for controls + readouts.

**Step 3: Verify build**
- Run: `corepack pnpm build`
- Expected: exit 0

**Step 4: Commit**
```bash
git add packages/theme/styles/demo-shell.css
git commit -m "feat(theme): add demo shell variants (triad, viz-first)"
```

---

## Task 2: Shared demo control polish (sliders + tap feedback)

**Files:**
- Modify: `packages/theme/styles/components/form.css`
- Create: `packages/runtime/src/polish.ts`
- Modify: `packages/runtime/src/index.ts`

**Step 1: Add a `cp-range` slider style (token-based)**
- Implement:
  - thumb sizing and hover/active states
  - firefox progress fill via `::-moz-range-progress`
  - webkit progress fill via a CSS var (e.g. `--cp-range-progress`)
  - `:focus-visible` ring uses `--cp-focus`
  - respects `prefers-reduced-motion`

**Step 2: Add runtime helper to update slider progress**
- In `packages/runtime/src/polish.ts`, implement:
  - `initSliderProgress(root: ParentNode = document)` which:
    - finds all `input[type="range"]` (or `.cp-range`) inside `#cp-demo`
    - sets `--cp-range-progress` based on `(value - min) / (max - min)`
    - listens on `input` to keep it updated

**Step 3: (Optional) Add reduced-motion safe tap feedback**
- In `packages/runtime/src/polish.ts`, implement:
  - `initRipple(root = document)` (scope-limited to `#cp-demo`)
  - attaches to `.cp-button` and key demo buttons
  - no-op when `prefers-reduced-motion: reduce`

**Step 4: Wire polish into runtime**
- Export from `packages/runtime/src/index.ts` and auto-run *once* when `createInstrumentRuntime()` is called.

**Step 5: Verify build**
- Run: `corepack pnpm -r typecheck`
- Expected: exit 0

**Step 6: Commit**
```bash
git add packages/theme/styles/components/form.css packages/runtime/src/polish.ts packages/runtime/src/index.ts
git commit -m "feat(runtime,theme): add shared slider polish + demo tap feedback"
```

---

## Task 3: Remove per-demo control restyling (inherit shared styles)

**Files:**
- Modify: `apps/demos/src/shared/stub-demo.css`
- Modify: `apps/demos/src/demos/*/style.css` (remove duplicated `select` / `input[type=range]` rules as possible)

**Step 1: Import canonical theme components in demo base CSS**
- In `apps/demos/src/shared/stub-demo.css`, import:
  - `@cosmic/theme/styles/components/button.css`
  - `@cosmic/theme/styles/components/form.css`

**Step 2: Delete duplicate `.cp-button` styles from `stub-demo.css`**
- Keep only demo-specific layout helpers; rely on theme buttons.

**Step 3: Standardize demo control markup**
- Option A (preferred): convert `.cp-action` buttons → `.cp-button cp-button--primary` / `--ghost` / `--block`
- Option B: keep `.cp-action` but make it a thin alias of `.cp-button` (no separate styling)

**Step 4: Verify build**
- Run: `corepack pnpm build`
- Expected: exit 0

**Step 5: Commit**
```bash
git add apps/demos/src/shared/stub-demo.css apps/demos/src/demos
git commit -m "refactor(demos): use shared theme controls (buttons/forms)"
```

---

## Task 4: Geometry demos polish pass (layout + controls + affordances)

Target demos:
- `angular-size`
- `eclipse-geometry`
- `seasons`
- `moon-phases`
- `binary-orbits`

**Files:**
- Modify: `apps/demos/src/demos/angular-size/index.html`
- Modify: `apps/demos/src/demos/angular-size/style.css`
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html`
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`
- Modify: `apps/demos/src/demos/moon-phases/index.html`
- Modify: `apps/demos/src/demos/moon-phases/style.css`
- Modify: `apps/demos/src/demos/binary-orbits/index.html`
- Modify: `apps/demos/src/demos/binary-orbits/style.css`

**Step 1: Opt into shell variants**
- Use `data-shell="triad"` for `eclipse-geometry` and `seasons` (readouts deserve a full column).
- Use `data-shell="instrument"` (default) or `viz-first` where it improves projection readability.

**Step 2: Make controls look like “instrument controls”**
- Ensure every slider has:
  - a visible label
  - a live value display (already present in most)
  - consistent spacing and min hit targets

**Step 3: Add slider tooltips only where the slider value is not obvious**
- Add `data-tooltip-source="#someDisplaySpan"` on the slider input.
- Use sparingly (legacy pattern): log sliders and “mapped” sliders benefit most.

**Step 4: Moon phases parity (UX-first)**
- Add a small preset strip for key phases (New / 1st Quarter / Full / 3rd Quarter).
- Add play/pause (reduced-motion aware) with a simple speed selector.

**Step 5: Verify build**
- Run: `corepack pnpm build`
- Expected: exit 0

**Step 6: Commit**
```bash
git add apps/demos/src/demos/angular-size apps/demos/src/demos/eclipse-geometry apps/demos/src/demos/seasons apps/demos/src/demos/moon-phases apps/demos/src/demos/binary-orbits
git commit -m "feat(demos): polish geometry instruments (shell variants + controls)"
```

---

## Task 5: Astro site form controls + surfaces (token-consistent)

**Files:**
- Modify: `apps/site/src/styles/global.css`
- Modify: `apps/site/src/components/FilterBar.astro`
- Modify: `apps/site/src/components/IframeStage.astro`
- Modify: `apps/site/src/pages/exhibits/[slug].astro`

**Step 1: Import `form.css`**
- Add: `@import "@cosmic/theme/styles/components/form.css";` in `apps/site/src/styles/global.css`.

**Step 2: Convert FilterBar to use `.cp-input` / `.cp-select`**
- Remove duplicated input/select styling from the component.

**Step 3: Replace hardcoded `rgba(...)` surfaces with token surfaces**
- Use `var(--cp-bg1)` / `color-mix(...)` and `var(--cp-border)` so paper mode behaves correctly.

**Step 4: Verify build**
- Run: `corepack pnpm build`
- Expected: exit 0

**Step 5: Commit**
```bash
git add apps/site/src/styles/global.css apps/site/src/components/FilterBar.astro apps/site/src/components/IframeStage.astro apps/site/src/pages/exhibits/[slug].astro
git commit -m "refactor(site): use theme form controls + token surfaces"
```

---

## Task 6: Instructor + station materials polish (paper-first prose)

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`
- Modify: `apps/site/src/pages/stations/[slug].astro`
- Modify: `apps/site/src/pages/instructor/[slug].astro`
- Create: `packages/theme/styles/components/prose.css`
- Modify: `apps/site/src/styles/global.css` (import prose rules)

**Step 1: Apply paper theme by default on station pages**
- In `Layout.astro`, treat `/stations/` as paper theme (same as instructor).

**Step 2: Add `.cp-prose` rules**
- In `packages/theme/styles/components/prose.css`, style:
  - headings, paragraphs, lists
  - tables (borders, zebra optional, print-friendly)
  - blockquotes as callouts (left border + background using tokens)
  - KaTeX display blocks spacing

**Step 3: Wrap station/instructor content with `.cp-prose`**
- Apply to both the override content and the default template content.

**Step 4: Remove hardcoded dark surfaces**
- Replace `rgba(0,0,0,…)` usage with token surfaces.

**Step 5: Verify build**
- Run: `corepack pnpm build`
- Expected: exit 0

**Step 6: Commit**
```bash
git add packages/theme/styles/components/prose.css apps/site/src/layouts/Layout.astro apps/site/src/pages/stations/[slug].astro apps/site/src/pages/instructor/[slug].astro apps/site/src/styles/global.css
git commit -m "feat(site,theme): paper-first prose + station/instructor polish"
```

---

## Task 7: Cleanup (remove replaced styles)

**Files:**
- Modify: `apps/demos/src/shared/stub-demo.css`
- Modify: `apps/site/src/components/*` and `apps/site/src/pages/*` as needed

**Step 1: Remove duplicated button/input styles that are now in `@cosmic/theme`**
- Keep the repo “single source of truth” for UI primitives.

**Step 2: Verify build**
- Run: `corepack pnpm build`
- Expected: exit 0

**Step 3: Commit**
```bash
git add apps/demos/src/shared/stub-demo.css apps/site/src
git commit -m "chore(ui): remove replaced legacy/duplicate styles"
```

---

## Task 8: Verification gates (required)

**Step 1: Typecheck**
- Run: `corepack pnpm -r typecheck`
- Expected: exit 0

**Step 2: Build**
- Run: `corepack pnpm build`
- Expected: exit 0

**(Optional) Step 3: E2E smoke**
- Run: `corepack pnpm -C apps/site test:e2e`
- Expected: exit 0

