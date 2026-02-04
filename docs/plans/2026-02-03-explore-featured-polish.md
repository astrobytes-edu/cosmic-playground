# Explore Featured Row Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a calm lead sentence under “Start here: Gravity & Orbits” and tighten spacing around the featured row.

**Architecture:** Local to `explore/index.astro`; no logic changes. Use existing tokens and classes only.

**Tech Stack:** Astro, CSS, Playwright.

---

### Task 1: Add failing Playwright test for featured lead

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write failing test**

```ts
test("Explore featured row shows lead text", async ({ page }) => {
  await page.goto("explore/");
  const lead = page.locator(".featured__lede");
  await expect(lead).toHaveText("Begin with the core orbit ideas before branching out.");
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm -C apps/site test:e2e --grep "featured row shows lead"`  
Expected: FAIL (lead text missing)

**Step 3: Commit tests**

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: lock explore featured lead"
```

---

### Task 2: Add featured lead + spacing

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Add lead paragraph**

```astro
<p class="featured__lede">
  Begin with the core orbit ideas before branching out.
</p>
```

**Step 2: Add spacing styles**

Use tokens in local `<style>`:

```css
.featured__header {
  display: grid;
  gap: var(--cp-space-1);
}

.featured__lede {
  margin: 0;
  color: var(--cp-text2);
  max-width: 72ch;
}
```

**Step 3: Run targeted test**

Run: `corepack pnpm -C apps/site test:e2e --grep "featured row shows lead"`  
Expected: PASS

**Step 4: Commit**

```bash
git add apps/site/src/pages/explore/index.astro
git commit -m "style: add featured lead and spacing"
```

---

### Task 3: Full verification

**Step 1: Build**

Run: `corepack pnpm build`  
Expected: PASS

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: PASS
