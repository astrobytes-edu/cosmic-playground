# Link Shading + Off‑White Text Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Soften dark‑mode text contrast, add tokenized link shading, and add the brand motto under the site header.

**Architecture:** Tune global tokens in `packages/theme/styles/tokens.css`, keep paper theme overrides in `packages/theme/styles/layer-paper.css`, and update header markup + global CSS for the brand subtitle and link tones.

**Tech Stack:** Astro layouts, theme tokens CSS, Playwright e2e smoke tests.

---

### Task 1: Add failing tests for subtitle + off‑white text

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write the failing tests**
- Add a test that the site header contains “Predict → Play → Explain”.
- Add a test that body text color is not pure white in dark mode.

**Step 2: Run test to verify it fails**
Run: `corepack pnpm -C apps/site test:e2e --grep "Header shows cadence tagline"`
Expected: FAIL (subtitle missing).

---

### Task 2: Update header markup + styles

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`
- Modify: `apps/site/src/styles/global.css`

**Step 1: Update brand markup**
- Wrap the brand link in a `.brand` container with:
  - `.brand__name` link
  - `.brand__subtitle` text (“Predict → Play → Explain”)

**Step 2: Style subtitle**
- Add `.brand__subtitle` styles (small, emphasized, letter‑spaced, subtle color).

**Step 3: Run test to verify it passes**
Run: `corepack pnpm -C apps/site test:e2e --grep "Header shows cadence tagline"`
Expected: PASS.

---

### Task 3: Add tokenized link shading + off‑white tuning

**Files:**
- Modify: `packages/theme/styles/tokens.css`
- Modify: `packages/theme/styles/layer-paper.css`

**Step 1: Tune dark text tokens**
- Reduce white mix percentages for `--cp-text`, `--cp-text2`, `--cp-muted`, `--cp-faint`.

**Step 2: Add link tokens**
- Define `--cp-link`, `--cp-link-hover`, `--cp-link-active` using existing tokens.
- Update global `a` styles to use link tokens.

**Step 3: Preserve paper theme**
- In `layer-paper.css`, set `--cp-link*` tokens to match current paper behavior.

**Step 4: Run tests**
Run:
```
corepack pnpm -C apps/site test:e2e --grep "Body text uses softened off-white"
corepack pnpm -C apps/site test:e2e
```
Expected: PASS.

---

### Task 4: Sanity checks + commit

**Step 1: Verify no new color literals in apps**
Run: `rg -n -- "#[0-9a-fA-F]{3,8}|\brgb\\(|\bhsl\\(" apps/site`
Expected: no new literals added.

**Step 2: Commit**
Run:
```
git add docs/plans/2026-02-04-link-shading-offwhite-design.md \
  docs/plans/2026-02-04-link-shading-offwhite.md \
  apps/site/tests/smoke.spec.ts \
  apps/site/src/layouts/Layout.astro \
  apps/site/src/styles/global.css \
  packages/theme/styles/tokens.css \
  packages/theme/styles/layer-paper.css
git commit -m "feat(theme): soften text and add link shading"
```
