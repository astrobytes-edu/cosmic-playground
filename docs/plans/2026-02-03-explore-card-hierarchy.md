# Explore Card Hierarchy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update Explore cards to emphasize title hierarchy, order badges as Status → Topic → Time → Level, and show time ranges instead of exact minutes.

**Architecture:** Keep logic inside `DemoCard.astro` (presentation only). Use existing theme tokens and component classes; avoid new color literals. Add Playwright smoke tests to lock in badge order and time range formatting.

**Tech Stack:** Astro, CSS, Playwright.

---

### Task 1: Add failing Playwright tests for badge order + time ranges

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write failing tests**

```ts
test("Explore cards show time ranges (not exact minutes)", async ({ page }) => {
  await page.goto("explore/");
  const timeBadge = page
    .locator(".demo-card .cp-badge")
    .filter({ hasText: "min" })
    .first();
  await expect(timeBadge).toBeVisible();
  const text = (await timeBadge.textContent()) ?? "";
  expect(text).toMatch(/(≤|–|\+)/);
});

test("Explore cards order badges with status first", async ({ page }) => {
  await page.goto("explore/");
  const badges = page.locator(".demo-card .demo-card__badges .cp-badge");
  await expect(badges.first()).toBeVisible();
  const firstText = (await badges.first().textContent())?.toLowerCase() ?? "";
  expect(["stable", "beta", "draft"]).toContain(firstText.trim());
});
```

**Step 2: Run tests to verify they fail**

Run: `corepack pnpm -C apps/site test:e2e --grep "time ranges|status first"`  
Expected: FAIL  
- Time badge is exact minutes  
- First badge is a topic/level, not status

**Step 3: Commit tests**

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: explore card time ranges and badge order"
```

---

### Task 2: Update DemoCard badge order and time labels

**Files:**
- Modify: `apps/site/src/components/DemoCard.astro`

**Step 1: Add time range helper**

```ts
const timeLabel =
  timeMinutes <= 10 ? "≤10 min" : timeMinutes <= 20 ? "10–20 min" : "20+ min";
```

**Step 2: Reorder badges (Status → Topic → Time → Level)**

Move the status pill into the badge row first, then topics, then time range, then levels. Keep math mode after levels if present.

**Step 3: Tighten title/description hierarchy**

Use token-driven styling:
- Title: `var(--cp-text)` and `var(--cp-text-xl)`
- Description: `var(--cp-text2)` (keep clamp)

**Step 4: Run targeted tests**

Run: `corepack pnpm -C apps/site test:e2e --grep "time ranges|status first"`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/site/src/components/DemoCard.astro
git commit -m "style: reorder explore badges and use time ranges"
```

---

### Task 3: Full verification

**Step 1: Build**

Run: `corepack pnpm build`  
Expected: PASS

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: PASS
