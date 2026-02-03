# Explore E2E Smoke Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the Explore page e2e smoke failures (visible `.cp-button` and persistent `.results` wrapper), then verify and push.

**Architecture:** Keep Explore server-rendered with progressive enhancement. Ensure `.results` exists in both filtered and unfiltered views, and keep the Apply button focusable/visible (subtle UI only). Avoid global JS and keep base-path-safe links.

**Tech Stack:** Astro, CSS, Playwright.

### Task 1: Reproduce current failures

**Files:**
- Test: `apps/site/tests/smoke.spec.ts`

**Step 1: Run the build**

Run: `corepack pnpm build`  
Expected: Pass

**Step 2: Run the failing e2e test**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: Fail on `Buttons have focus-visible ring` or `.results` empty-state check.

### Task 2: Ensure `.results` is always present

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Adjust markup to always render `.results`**

Ensure `.results` wraps either:
- The topic index sections when **no filters** are applied, or
- The flat filtered grid + summary when **filters** are applied.

**Step 2: Keep base-path-safe links**

Verify any internal links still use `${base}` and no root-absolute paths are introduced.

### Task 3: Make the Apply button visible and focusable

**Files:**
- Modify: `apps/site/src/components/FilterBar.astro`

**Step 1: Ensure the first `.cp-button` is visible**

Keep the Apply button in DOM and visible (subtle opacity allowed), not `display: none` or `visibility: hidden`.

**Step 2: Preserve progressive enhancement**

Auto-submit can stay as JS enhancement, but the button must remain focusable and visible without JS.

### Task 4: Verify locally

**Step 1: Build**

Run: `corepack pnpm build`  
Expected: Pass

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: All tests pass

### Task 5: Commit and push

**Step 1: Commit**

```bash
git add apps/site/src/pages/explore/index.astro apps/site/src/components/FilterBar.astro
git commit -m "fix: stabilize explore e2e selectors"
```

**Step 2: Push**

```bash
git push
```
