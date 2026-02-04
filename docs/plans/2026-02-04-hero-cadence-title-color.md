# Hero Physics Line + Cadence Items + Title Color Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the physics hero line, itemize Predict/Play/Explain, and tint key titles using theme tokens.

**Architecture:** Update Explore page markup + CSS, header brand markup + CSS, and theme tokens for title colors; keep paper theme neutral via overrides.

**Tech Stack:** Astro templates, theme tokens CSS, Playwright e2e smoke tests.

---

### Task 1: Add failing tests for hero line + itemized cadence + title tint

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write failing tests**
- Assert Explore hero contains “Play with the universe. Learn the physics.”
- Assert header cadence is itemized (three items: Predict, Play, Explain).
- Assert Explore onboarding cadence is itemized (three items).
- Assert demo card titles have a different color than body text.

**Step 2: Run tests to verify they fail**
Run: `corepack pnpm -C apps/site test:e2e --grep "Hero shows physics line"`
Expected: FAIL.

---

### Task 2: Update header + Explore hero/onboarding markup

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Header cadence list**
- Replace the header subtitle text with a `<ul class="brand__cadence">` containing three `<li>` items.

**Step 2: Explore hero**
- Insert the physics line under the Explore H1.

**Step 3: Explore onboarding cadence list**
- Replace the single cadence line with a `<ul>` of three `<li>` items.

**Step 4: Run targeted tests**
Run: `corepack pnpm -C apps/site test:e2e --grep "Hero shows physics line"`
Expected: PASS.

---

### Task 3: Add title color tokens + styles

**Files:**
- Modify: `packages/theme/styles/tokens.css`
- Modify: `packages/theme/styles/layer-paper.css`
- Modify: `apps/site/src/styles/global.css`
- Modify: `apps/site/src/components/DemoCard.astro`
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Title tokens**
- Add `--cp-title` and `--cp-title-strong` to `tokens.css` (derived from existing accents + text).
- Set heading colors to use these tokens.

**Step 2: Paper theme override**
- In `layer-paper.css`, set `--cp-title` and `--cp-title-strong` to `--cp-text`.

**Step 3: Card title tint**
- Add a class to demo card titles and apply `--cp-title` with a subtle hover shift to `--cp-title-strong`.

**Step 4: Header + onboarding styling**
- Add styles for `.brand__cadence` and Explore onboarding cadence list (itemized, pill‑like).
- Add styles for the hero physics line.

**Step 5: Run tests**
Run:
```
corepack pnpm -C apps/site test:e2e --grep "Hero shows physics line"
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
git add docs/plans/2026-02-04-hero-cadence-title-color-design.md \
  docs/plans/2026-02-04-hero-cadence-title-color.md \
  apps/site/tests/smoke.spec.ts \
  apps/site/src/layouts/Layout.astro \
  apps/site/src/pages/explore/index.astro \
  apps/site/src/styles/global.css \
  apps/site/src/components/DemoCard.astro \
  packages/theme/styles/tokens.css \
  packages/theme/styles/layer-paper.css
git commit -m "feat(site): add hero physics line and title tints"
```
