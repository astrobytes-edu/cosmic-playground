# Kepler's Laws Viz-First UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Kepler's Laws demo UI to be viz-first and legacy-faithful, with clean math notation ($a$, $e$), explicit units, stronger orbit visibility, and reduced panel dominance.

**Architecture:** Switch the demo shell to `data-shell="viz-first"`, reorganize the markup to mirror the legacy flow (stage first, controls/readouts below), and tune demo-local CSS to emphasize the orbit and soften panel chrome. Use KaTeX via existing `initMath(document)` for inline math labels and unit notation.

**Tech Stack:** Vite + TypeScript (`apps/demos`), demo-local CSS, `@cosmic/runtime` (KaTeX), Playwright e2e (`apps/site/tests/smoke.spec.ts`).

---

### Task 1: Add e2e expectations for viz-first shell + math labels

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write the failing test**

Add assertions in the Kepler's Laws test to confirm:
- `#cp-demo` uses `data-shell="viz-first"`
- inline math tokens for `a` and `e` exist (via `data-math` spans)

```ts
await expect(page.locator("#cp-demo")).toHaveAttribute("data-shell", "viz-first");
await expect(page.locator('[data-math="a"]').first()).toBeVisible();
await expect(page.locator('[data-math="e"]').first()).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Kepler\u2019s Laws"
```
Expected: FAIL because shell remains `triad` and math spans don't exist yet.

**Step 3: Commit**

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: assert Kepler's Laws viz-first shell + math labels"
```

---

### Task 2: Rebuild demo markup to match legacy flow (viz-first)

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/index.html`

**Step 1: Update shell variant + stage-first structure**

- Set `data-shell="viz-first"` on `#cp-demo`.
- Reorder/structure sections to mirror legacy: stage first, then readouts + controls below (still using shell regions).
- Keep all required shell regions present (`controls`, `stage`, `readouts`, `drawer`).

**Step 2: Add legacy-style header near the stage**

Add a header block (title + subtitle + station card link) above the stage surface.

**Step 3: Replace plain-text symbols with KaTeX spans**

Examples:
```html
<label class="cp-label" for="aSlider">Semi-major axis <span data-math="a"></span></label>
<label class="cp-label" for="eSlider">Eccentricity <span data-math="e"></span></label>
```
Use unicode arrows in hints:
- `0.3 AU → 40 AU (log scale)`
- `0 (circle) → 0.99`

**Step 4: Make readout labels math-clean**

Examples:
```html
<div class="cp-readout__label">Distance <span data-math="r"></span></div>
<div class="cp-readout__label">Speed <span data-math="v"></span></div>
<div class="cp-readout__label">Period <span data-math="P"></span></div>
```
Keep units explicit in the unit line.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/keplers-laws/index.html
git commit -m "feat(keplers-laws): switch to viz-first shell + legacy-first layout"
```

---

### Task 3: Improve visual styling to match legacy aesthetics

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/style.css`

**Step 1: Stage background and orbit emphasis**

- Replace teal-heavy background with a darker neutral + subtle starfield (multi-radial gradient) on `.stage-surface`.
- Strengthen the orbit path: increase stroke width and opacity, tune dash pattern.

Example intent (exact tokens may vary):
```css
.stage-surface {
  background:
    radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--cp-warning) 25%, transparent), transparent 55%),
    radial-gradient(circle at 75% 35%, color-mix(in srgb, var(--cp-accent) 18%, transparent), transparent 60%),
    radial-gradient(circle at 50% 50%, var(--cp-bg1), var(--cp-bg0));
}

#orbitPath {
  stroke: color-mix(in srgb, var(--cp-text) 70%, var(--cp-border));
  stroke-width: 1.6;
  opacity: 0.75;
}
```

**Step 2: De-emphasize panels**

- Lighten panel backgrounds in this demo (subtle transparency), reduce border contrast.
- Ensure the stage reads as the primary element.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/keplers-laws/style.css
git commit -m "style(keplers-laws): strengthen orbit + soften panels"
```

---

### Task 4: Align units + symbols in runtime text

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/main.ts`

**Step 1: Ensure unit strings use proper typography**

- Replace `mm/s^2` style with `mm/s²` (or KaTeX if rendered).
- Confirm label updates do not collapse to "mode" in 201 view.

**Step 2: Run targeted demo logic test (if logic touched)**

Run:
```bash
corepack pnpm vitest run apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts
```
Expected: PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/keplers-laws/main.ts
git commit -m "fix(keplers-laws): tighten unit typography + label text"
```

---

### Task 5: Verification + screenshots

**Step 1: Run e2e (Kepler-only)**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Kepler\u2019s Laws"
```
Expected: PASS.

**Step 2: Regenerate Playwright QA screenshots**

- Start preview server:
```bash
corepack pnpm -C apps/site preview --host 127.0.0.1 --port 4173
```
- Capture with CLI Playwright to `output/playwright/` (default, Newton+vectors, equal areas, unit 201, Jupiter/High-e).

**Step 3: Commit (optional, only if output assets are intended for git)**

```bash
git add output/playwright/
# (Commit only if these assets should be versioned; default is ignore.)
```

---

## Notes on legacy alignment

Primary references (keep open while editing):
- Legacy markup: `/Users/anna/Teaching/astr101-sp26/demos/keplers-laws/index.html`
- Legacy styling: `/Users/anna/Teaching/astr101-sp26/demos/keplers-laws/keplers-laws.css`

Focus on:
- Stage-first hierarchy
- Clear math labels ($a$, $e$, $r$, $v$, $P$)
- Orbit visibility (not washed out)
- Reduced panel dominance (controls/supporting info below stage)
