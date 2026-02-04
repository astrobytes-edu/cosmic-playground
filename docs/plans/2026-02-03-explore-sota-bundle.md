# Explore SoTA Bundle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a cohesive Explore layout pass with onboarding strip, count line, and refined hero microcopy, keeping token-driven styling and accessibility intact.

**Architecture:** Changes are confined to `explore/index.astro` (layout + microcopy) and `smoke.spec.ts` (tests). No new JS; filtering logic remains unchanged.

**Tech Stack:** Astro, CSS, Playwright.

---

### Task 1: Add failing Playwright tests for onboarding + count line

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write failing tests**

```ts
test("Explore shows onboarding cadence strip", async ({ page }) => {
  await page.goto("explore/");
  await expect(page.getByText("Predict → Play → Explain")).toBeVisible();
});

test("Explore shows exhibit count line", async ({ page }) => {
  await page.goto("explore/");
  const count = page.locator(".results__count");
  await expect(count).toContainText("interactive exhibit");
});
```

**Step 2: Run tests to verify they fail**

Run: `corepack pnpm -C apps/site test:e2e --grep "onboarding cadence|exhibit count line"`  
Expected: FAIL  
- Onboarding strip not present  
- Count line not present

**Step 3: Commit tests**

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: lock explore onboarding and count line"
```

---

### Task 2: Add onboarding strip + count line + hero microcopy

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Update hero lede**

```astro
<p class="lede">Interactive exhibits for seeing how astronomy actually works.</p>
```

**Step 2: Add onboarding strip (no filters only)**

```astro
{noFilters ? (
  <div class="explore-onboard">
    <div class="explore-onboard__cadence">Predict → Play → Explain</div>
    <p class="explore-onboard__lede">A simple loop for every exhibit.</p>
  </div>
) : null}
```

Place after the featured row and before the count line.

**Step 3: Add count line**

```astro
<div class="results__count">
  <strong>{sorted.length}</strong> interactive exhibit{sorted.length === 1 ? "" : "s"}
</div>
```

Show for both filtered and unfiltered views. Remove the old `results__summary` block.

**Step 4: Add layout styles**

```css
.explore-onboard {
  margin-top: var(--cp-space-6);
  display: grid;
  gap: var(--cp-space-1);
}

.explore-onboard__cadence {
  font-size: var(--cp-text-lg);
  color: var(--cp-text);
  letter-spacing: 0.02em;
}

.explore-onboard__lede {
  margin: 0;
  color: var(--cp-text2);
  max-width: 72ch;
}

.results__count {
  margin-top: var(--cp-space-5);
  color: var(--cp-muted);
}
```

**Step 5: Run targeted tests**

Run: `corepack pnpm -C apps/site test:e2e --grep "onboarding cadence|exhibit count line"`  
Expected: PASS

**Step 6: Commit**

```bash
git add apps/site/src/pages/explore/index.astro
git commit -m "style: add explore onboarding and count line"
```

---

### Task 3: Full verification

**Step 1: Build**

Run: `corepack pnpm build`  
Expected: PASS

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: PASS
