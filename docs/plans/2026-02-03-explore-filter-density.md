# Explore Filter Density + Microcopy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce filter bar visual weight and update microcopy to be calm/invitational while keeping behavior unchanged.

**Architecture:** All changes remain in `FilterBar.astro` and Explore chip label generation. No new JS, no data model changes. Use existing tokens only.

**Tech Stack:** Astro, CSS, Playwright.

---

### Task 1: Add failing Playwright tests for filter microcopy

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write failing tests**

```ts
test("Explore filter uses invitational microcopy", async ({ page }) => {
  await page.goto("explore/");
  const search = page.locator("input[name='q']");
  await expect(search).toHaveAttribute("placeholder", "Title, topic, or idea…");
  const summary = page.locator(".filter-bar__details summary");
  await expect(summary).toHaveText("More ways to filter");
});
```

**Step 2: Run tests to verify they fail**

Run: `corepack pnpm -C apps/site test:e2e --grep "invitational microcopy"`  
Expected: FAIL  
- Placeholder currently "title or tag…"  
- Summary currently "More filters"

**Step 3: Commit tests**

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: lock explore filter microcopy"
```

---

### Task 2: Update FilterBar microcopy + density

**Files:**
- Modify: `apps/site/src/components/FilterBar.astro`
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Update labels + placeholders**

Change labels/placeholder to:
- Search exhibits
- Title, topic, or idea…
- Choose a topic
- Time budget
- Sort by
- More ways to filter
- Course level
- Math required?

**Step 2: Tighten spacing (token-driven)**

Use token values:
- `.filter-bar` padding: `var(--cp-space-3)`
- row gaps: `var(--cp-space-2)`
- field gap: `var(--cp-space-1)`
- label font-size: `var(--cp-text-sm)`

**Step 3: Update chip labels to match microcopy**

In `apps/site/src/pages/explore/index.astro`, update chip labels:
- `Course level: <level>`
- `Time budget: <range>`
- `Math required: Yes/No`

**Step 4: Run targeted tests**

Run: `corepack pnpm -C apps/site test:e2e --grep "invitational microcopy"`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/site/src/components/FilterBar.astro apps/site/src/pages/explore/index.astro
git commit -m "style: refine explore filter density and microcopy"
```

---

### Task 3: Full verification

**Step 1: Build**

Run: `corepack pnpm build`  
Expected: PASS

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: PASS
