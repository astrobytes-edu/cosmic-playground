# Explore Theme Polish (Hero + Chips) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the museum glow to the hero (not the whole page) and promote Explore chips to a theme-level component, keeping all styling token-driven and accessible.

**Architecture:** Theme-level styles live in `packages/theme/styles/` (tokens + museum layer). Explore only handles layout and uses shared classes. No new JS; filtering remains server-rendered with progressive enhancement.

**Tech Stack:** Astro, CSS, Playwright.

---

### Task 1: Add failing Playwright tests for hero glow + chips

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write the failing tests**

```ts
test("Hero glow is scoped to hero", async ({ page }) => {
  await page.goto("explore/");
  const bodyBg = await page.evaluate(() =>
    window.getComputedStyle(document.body).backgroundImage
  );
  const heroBg = await page.locator(".cp-hero").evaluate((el) =>
    window.getComputedStyle(el).backgroundImage
  );
  expect(bodyBg).not.toContain("radial-gradient");
  expect(heroBg).toContain("radial-gradient");
});

test("Filter chips use theme chip class", async ({ page }) => {
  await page.goto("explore/?topic=Orbits");
  const chip = page.locator(".cp-chip").first();
  await expect(chip).toBeVisible();
});
```

**Step 2: Run tests to verify they fail**

Run: `corepack pnpm -C apps/site test:e2e -- --grep "Hero glow|Filter chips use theme chip class"`  
Expected: FAIL  
- body background currently contains radial gradients  
- `.cp-chip` elements do not exist yet

**Step 3: Commit tests**

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: assert hero glow + chip class"
```

---

### Task 2: Move hero glow into theme layer

**Files:**
- Modify: `packages/theme/styles/layer-museum.css`
- Modify: `apps/site/src/styles/global.css`

**Step 1: Update museum layer to keep body flat and hero glowing**

```css
.cp-layer-museum {
  background: var(--cp-bg0);
}

.cp-layer-museum .cp-hero {
  border: 1px solid var(--cp-border-subtle);
  background:
    radial-gradient(
      1200px 600px at 20% 0%,
      var(--cp-glow-teal),
      transparent 60%
    ),
    radial-gradient(
      900px 480px at 85% -10%,
      var(--cp-glow-pink),
      transparent 65%
    ),
    color-mix(in srgb, var(--cp-bg0) 90%, var(--cp-bg2));
}
```

**Step 2: Remove background/border from `.cp-hero` layout rules**

Keep spacing + radius in `apps/site/src/styles/global.css`, but remove background/border so the theme layer controls the look.

**Step 3: Run the targeted tests**

Run: `corepack pnpm -C apps/site test:e2e -- --grep "Hero glow|Filter chips use theme chip class"`  
Expected: **Hero glow test passes** (body no longer has radial gradients; hero does)

**Step 4: Commit**

```bash
git add packages/theme/styles/layer-museum.css apps/site/src/styles/global.css
git commit -m "style: scope museum glow to hero"
```

---

### Task 3: Introduce theme chip class + use it in Explore

**Files:**
- Modify: `packages/theme/styles/layer-museum.css`
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Add `.cp-chip` styles to museum layer**

```css
.cp-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--cp-border-subtle);
  background: var(--cp-chip-bg);
  color: var(--cp-text2);
  text-decoration: none;
  font-size: var(--cp-text-sm);
  transition:
    background var(--cp-transition-fast) var(--cp-ease-out),
    border-color var(--cp-transition-fast) var(--cp-ease-out),
    color var(--cp-transition-fast) var(--cp-ease-out);
}

.cp-chip:hover,
.cp-chip:focus-visible {
  border-color: var(--cp-chip-border-active);
  background: var(--cp-chip-bg-active);
  color: var(--cp-text);
}

.cp-chip--clear {
  background: transparent;
}
```

**Step 2: Update Explore chip markup**

In `apps/site/src/pages/explore/index.astro`, switch:
- Filter chips → `class="cp-chip"`
- Clear chip → `class="cp-chip cp-chip--clear"`
- Topic index links → add `cp-chip` class (keep `topic-index__link` only if needed for layout hooks)

**Step 3: Remove now-redundant chip styling in Explore CSS**

Keep `.filter-chips` and `.topic-index` layout rules, but drop `.filter-chip` and `.topic-index__link` style blocks that duplicate chip styling.

**Step 4: Run the targeted tests**

Run: `corepack pnpm -C apps/site test:e2e -- --grep "Hero glow|Filter chips use theme chip class"`  
Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/layer-museum.css apps/site/src/pages/explore/index.astro
git commit -m "style: add theme chip class and use in Explore"
```

---

### Task 4: Full verification

**Step 1: Build**

Run: `corepack pnpm build`  
Expected: PASS

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`  
Expected: PASS

**Step 3: Commit (if any follow-up tweaks)**

```bash
git add -A
git commit -m "chore: verify explore polish"
```
