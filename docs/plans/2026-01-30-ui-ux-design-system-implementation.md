# UI/UX Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the "Cosmic Wonder with Subtle Polish" design system — typography scale, icon system, transitions, and component polish optimized for classroom projection.

**Architecture:** Extend the existing two-layer theme system (`@cosmic/theme`) with new CSS tokens for typography and transitions. Add Lucide icons as a dependency. Enhance existing components (DemoCard, TagPill) with hover states and microinteractions. All changes validated through E2E tests.

**Tech Stack:** CSS custom properties, Astro components, Lucide icons (via lucide-astro), Playwright E2E tests, Vitest for token validation.

---

## Phase 1: Typography Scale (Tasks 1-4)

### Task 1: Add Typography Tokens

**Files:**
- Modify: `packages/theme/styles/tokens.css:34-38`
- Test: `packages/theme/src/tokens.test.ts` (create)

**Step 1: Create the test file for token validation**

Create `packages/theme/src/tokens.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Design tokens", () => {
  const tokensPath = path.resolve(__dirname, "../styles/tokens.css");
  const css = fs.readFileSync(tokensPath, "utf-8");

  describe("Typography scale", () => {
    it("defines all text size tokens", () => {
      const requiredTokens = [
        "--cp-text-sm",
        "--cp-text-md",
        "--cp-text-lg",
        "--cp-text-xl",
        "--cp-text-2xl",
        "--cp-text-3xl",
        "--cp-text-4xl",
        "--cp-text-hero",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });

    it("uses rem units for text sizes", () => {
      const textSizePattern = /--cp-text-\w+:\s*[\d.]+rem/g;
      const matches = css.match(textSizePattern);
      expect(matches?.length).toBeGreaterThanOrEqual(8);
    });

    it("defines line-height tokens", () => {
      expect(css).toContain("--cp-leading-tight");
      expect(css).toContain("--cp-leading-normal");
      expect(css).toContain("--cp-leading-relaxed");
    });

    it("defines font-weight tokens", () => {
      expect(css).toContain("--cp-font-normal");
      expect(css).toContain("--cp-font-medium");
      expect(css).toContain("--cp-font-semibold");
      expect(css).toContain("--cp-font-bold");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/theme && pnpm test`

Expected: FAIL with "does not contain --cp-text-sm" (or similar)

**Step 3: Add vitest config to theme package**

Create `packages/theme/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

**Step 4: Add test script to package.json**

Modify `packages/theme/package.json` — add to scripts:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

**Step 5: Run test again to confirm setup works**

Run: `cd packages/theme && pnpm test`

Expected: FAIL (tests run, assertions fail)

**Step 6: Implement typography tokens in tokens.css**

Replace lines 34-38 in `packages/theme/styles/tokens.css` (the Typography section) with:

```css
  /* ---------- Typography ---------- */
  --cp-font-sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Inter,
    Roboto, Helvetica, Arial, sans-serif;
  --cp-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;

  /* Text sizes (projection-optimized: larger base) */
  --cp-text-sm: 0.875rem;    /* 14px - badges only */
  --cp-text-md: 1.125rem;    /* 18px - body */
  --cp-text-lg: 1.25rem;     /* 20px - lead paragraphs */
  --cp-text-xl: 1.5rem;      /* 24px - h4, card titles */
  --cp-text-2xl: 1.875rem;   /* 30px - h3 */
  --cp-text-3xl: 2.25rem;    /* 36px - h2 */
  --cp-text-4xl: 3rem;       /* 48px - h1 */
  --cp-text-hero: 4rem;      /* 64px - home hero */

  /* Line heights */
  --cp-leading-tight: 1.25;
  --cp-leading-normal: 1.5;
  --cp-leading-relaxed: 1.75;

  /* Font weights */
  --cp-font-normal: 400;
  --cp-font-medium: 500;
  --cp-font-semibold: 600;
  --cp-font-bold: 700;
```

**Step 7: Run test to verify it passes**

Run: `cd packages/theme && pnpm test`

Expected: PASS

**Step 8: Commit**

```bash
git add packages/theme/src/tokens.test.ts packages/theme/vitest.config.ts packages/theme/package.json packages/theme/styles/tokens.css
git commit -m "$(cat <<'EOF'
feat(theme): add typography scale tokens

- Add text size tokens (sm through hero) optimized for projection
- Add line-height tokens (tight, normal, relaxed)
- Add font-weight tokens (normal, medium, semibold, bold)
- Add vitest setup for token validation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add Transition Tokens

**Files:**
- Modify: `packages/theme/styles/tokens.css`
- Modify: `packages/theme/src/tokens.test.ts`

**Step 1: Add failing test for transition tokens**

Add to `packages/theme/src/tokens.test.ts`:

```typescript
  describe("Transition tokens", () => {
    it("defines transition duration tokens", () => {
      expect(css).toContain("--cp-transition-fast");
      expect(css).toContain("--cp-transition-normal");
      expect(css).toContain("--cp-transition-slow");
    });

    it("defines easing tokens", () => {
      expect(css).toContain("--cp-ease-out");
      expect(css).toContain("--cp-ease-in-out");
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd packages/theme && pnpm test`

Expected: FAIL

**Step 3: Add transition tokens to tokens.css**

Add after the font weights section in `packages/theme/styles/tokens.css`:

```css
  /* ---------- Transitions ---------- */
  --cp-transition-fast: 150ms;
  --cp-transition-normal: 200ms;
  --cp-transition-slow: 300ms;
  --cp-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --cp-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

**Step 4: Run test to verify it passes**

Run: `cd packages/theme && pnpm test`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/tokens.css packages/theme/src/tokens.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): add transition tokens

- Add duration tokens (fast, normal, slow)
- Add easing tokens (ease-out, ease-in-out)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add Elevation Tokens

**Files:**
- Modify: `packages/theme/styles/tokens.css`
- Modify: `packages/theme/src/tokens.test.ts`

**Step 1: Add failing test for elevation tokens**

Add to `packages/theme/src/tokens.test.ts`:

```typescript
  describe("Elevation tokens", () => {
    it("defines elevation shadow levels", () => {
      expect(css).toContain("--cp-elevation-1");
      expect(css).toContain("--cp-elevation-2");
      expect(css).toContain("--cp-elevation-3");
    });

    it("defines hover glow for cards", () => {
      expect(css).toContain("--cp-card-glow");
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd packages/theme && pnpm test`

Expected: FAIL

**Step 3: Add elevation tokens to tokens.css**

Replace the Shadows section in `packages/theme/styles/tokens.css`:

```css
  /* ---------- Shadows & Elevation ---------- */
  --cp-shadow-1: 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 30px rgba(0, 0, 0, 0.35);
  --cp-shadow-2: 0 1px 0 rgba(255, 255, 255, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.5);

  /* Elevation system (use for layered UI) */
  --cp-elevation-1: 0 2px 8px rgba(0, 0, 0, 0.3);
  --cp-elevation-2: 0 4px 16px rgba(0, 0, 0, 0.4);
  --cp-elevation-3: 0 8px 32px rgba(0, 0, 0, 0.5);

  /* Card hover glow (uses accent color) */
  --cp-card-glow: 0 8px 32px rgba(45, 212, 191, 0.15);
```

**Step 4: Run test to verify it passes**

Run: `cd packages/theme && pnpm test`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/tokens.css packages/theme/src/tokens.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): add elevation and glow tokens

- Add 3-level elevation system for layered UI
- Add card-glow token for hover effects

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Apply Typography to Base Styles

**Files:**
- Modify: `packages/theme/styles/tokens.css:61-66`
- Test: `apps/site/tests/smoke.spec.ts` (add visual test)

**Step 1: Add E2E test for base typography**

Add to `apps/site/tests/smoke.spec.ts` inside the describe block:

```typescript
  test("Base typography uses design tokens", async ({ page }) => {
    await page.goto("explore/");

    const body = page.locator("body");
    const fontSize = await body.evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );
    // 1.125rem = 18px at default browser settings
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(18);
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL (current base is 16px)

**Step 3: Update base styles in tokens.css**

Replace lines 61-66 in `packages/theme/styles/tokens.css`:

```css
html,
body {
  background: var(--cp-bg0);
  color: var(--cp-text);
  font-family: var(--cp-font-sans);
  font-size: var(--cp-text-md);
  line-height: var(--cp-leading-normal);
}

h1, h2, h3, h4, h5, h6 {
  line-height: var(--cp-leading-tight);
  font-weight: var(--cp-font-semibold);
}

h1 { font-size: var(--cp-text-4xl); }
h2 { font-size: var(--cp-text-3xl); }
h3 { font-size: var(--cp-text-2xl); }
h4 { font-size: var(--cp-text-xl); }
```

**Step 4: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/tokens.css apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(theme): apply typography tokens to base styles

- Set body font-size to 18px (projection-optimized)
- Add heading size hierarchy using tokens
- Add E2E test for base typography

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Icon System (Tasks 5-8)

### Task 5: Install Lucide Icons

**Files:**
- Modify: `apps/site/package.json`
- Create: `apps/site/src/components/Icon.astro`
- Test: `apps/site/tests/smoke.spec.ts`

**Step 1: Add E2E test for icon rendering**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Icon component renders SVG", async ({ page }) => {
    await page.goto("explore/");

    // After we add icons, search input should have search icon
    const searchIcon = page.locator(".filter-bar svg");
    await expect(searchIcon.first()).toBeVisible();
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL (no SVG in filter bar)

**Step 3: Install lucide-astro**

Run: `cd apps/site && pnpm add lucide-astro`

**Step 4: Create Icon wrapper component**

Create `apps/site/src/components/Icon.astro`:

```astro
---
import type { LucideIcon } from "lucide-astro";
import * as icons from "lucide-astro";

export type IconName =
  | "Search" | "Filter" | "X" | "Check"
  | "ChevronRight" | "ChevronDown"
  | "ExternalLink" | "Copy" | "Printer" | "Maximize"
  | "Clock" | "GraduationCap" | "FlaskConical";

interface Props {
  name: IconName;
  size?: number;
  class?: string;
  "aria-hidden"?: boolean;
}

const { name, size = 20, class: className, "aria-hidden": ariaHidden = true } = Astro.props;

const IconComponent = icons[name] as LucideIcon;
---

<IconComponent
  size={size}
  class={className}
  aria-hidden={ariaHidden}
/>
```

**Step 5: Update FilterBar to use Icon**

Modify `apps/site/src/components/FilterBar.astro` — add import and icon:

At the top of the frontmatter:
```astro
---
import Icon from "./Icon.astro";
// ... rest of imports
```

In the search input wrapper (find the search input and wrap it):
```astro
<div class="filter-bar__search">
  <Icon name="Search" size={18} class="filter-bar__search-icon" />
  <input type="search" name="query" ... />
</div>
```

Add styles for the search wrapper:
```css
.filter-bar__search {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-bar__search-icon {
  position: absolute;
  left: 12px;
  color: var(--cp-muted);
  pointer-events: none;
}

.filter-bar__search input {
  padding-left: 40px;
}
```

**Step 6: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 7: Commit**

```bash
git add apps/site/package.json apps/site/src/components/Icon.astro apps/site/src/components/FilterBar.astro apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(site): add Icon component with Lucide icons

- Install lucide-astro package
- Create Icon wrapper component with type-safe icon names
- Add search icon to FilterBar
- Add E2E test for icon rendering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Add Topic Icons

**Files:**
- Create: `apps/site/src/components/TopicIcon.astro`
- Modify: `apps/site/src/components/TagPill.astro`

**Step 1: Add E2E test for topic icons**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Topic badges show icons", async ({ page }) => {
    await page.goto("explore/");

    // Topic badges should have SVG icons
    const topicBadge = page.locator('.cp-badge[data-tone="blue"] svg');
    await expect(topicBadge.first()).toBeVisible();
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL

**Step 3: Create TopicIcon component**

Create `apps/site/src/components/TopicIcon.astro`:

```astro
---
import {
  Globe, Sparkles, Telescope, Orbit,
  Star, RotateCcw, Infinity, BarChart3
} from "lucide-astro";

interface Props {
  topic: string;
  size?: number;
}

const { topic, size = 14 } = Astro.props;

const topicIcons: Record<string, any> = {
  EarthSky: Globe,
  LightSpectra: Sparkles,
  Telescopes: Telescope,
  Orbits: Orbit,
  Stars: Star,
  Galaxies: RotateCcw,
  Cosmology: Infinity,
  DataInference: BarChart3,
};

const IconComponent = topicIcons[topic];
---

{IconComponent && <IconComponent size={size} aria-hidden="true" />}
```

**Step 4: Update TagPill to accept icon slot**

Modify `apps/site/src/components/TagPill.astro`:

```astro
---
interface Props {
  label: string;
  tone?: "default" | "teal" | "violet" | "blue" | "magenta";
}

const { label, tone = "default" } = Astro.props;
---

<span class="cp-badge" data-tone={tone}>
  <slot name="icon" />
  {label}
</span>

<style>
  .cp-badge {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
</style>
```

**Step 5: Update DemoCard to pass topic icons**

Modify `apps/site/src/components/DemoCard.astro` — update topics rendering:

Add import:
```astro
import TopicIcon from "./TopicIcon.astro";
```

Update the topics map:
```astro
{topics.map((t) => (
  <TagPill label={t} tone="blue">
    <TopicIcon slot="icon" topic={t} />
  </TagPill>
))}
```

**Step 6: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 7: Commit**

```bash
git add apps/site/src/components/TopicIcon.astro apps/site/src/components/TagPill.astro apps/site/src/components/DemoCard.astro apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(site): add topic icons to badges

- Create TopicIcon component mapping topics to Lucide icons
- Update TagPill to accept icon slot
- Update DemoCard to show topic icons
- Add E2E test for topic icon visibility

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Card Interactions (Tasks 7-9)

### Task 7: Add Card Hover Transitions

**Files:**
- Modify: `packages/theme/styles/layer-museum.css`
- Test: `apps/site/tests/smoke.spec.ts`

**Step 1: Add E2E test for card hover**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Cards have transition on hover", async ({ page }) => {
    await page.goto("explore/");

    const card = page.locator(".cp-card").first();
    const transition = await card.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    expect(transition).toContain("transform");
    expect(transition).toContain("box-shadow");
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL (no transition property)

**Step 3: Update card styles in layer-museum.css**

Replace the `.cp-card` rules in `packages/theme/styles/layer-museum.css`:

```css
.cp-card {
  background: color-mix(in srgb, var(--cp-bg1) 92%, transparent);
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-3);
  box-shadow: var(--cp-shadow-1);
  transition:
    transform var(--cp-transition-normal) var(--cp-ease-out),
    box-shadow var(--cp-transition-normal) var(--cp-ease-out),
    border-color var(--cp-transition-normal) var(--cp-ease-out);
}

.cp-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--cp-card-glow), var(--cp-shadow-2);
  border-color: color-mix(in srgb, var(--cp-border) 65%, var(--cp-accent3));
}

.cp-card:active {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .cp-card {
    transition: none;
  }
  .cp-card:hover {
    transform: none;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/layer-museum.css apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(theme): add card hover transitions

- Add transform, box-shadow, border transitions to cp-card
- Add hover lift effect with accent glow
- Add reduced-motion support
- Add E2E test for transition property

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Add Button Component

**Files:**
- Create: `packages/theme/styles/components/button.css`
- Modify: `packages/theme/src/index.ts`
- Create: `apps/site/src/components/Button.astro`
- Test: `apps/site/tests/smoke.spec.ts`

**Step 1: Add E2E test for button**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Buttons have focus-visible ring", async ({ page }) => {
    await page.goto("explore/");

    // Tab to first button and check focus style
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); // Skip to button

    const focusedButton = page.locator("button:focus-visible, a.cp-button:focus-visible").first();
    const outline = await focusedButton.evaluate((el) =>
      window.getComputedStyle(el).outlineColor
    );
    // Should be accent color (teal)
    expect(outline).toBeTruthy();
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL

**Step 3: Create button.css**

Create `packages/theme/styles/components/button.css`:

```css
.cp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cp-space-2);
  padding: var(--cp-space-3) var(--cp-space-5);
  font-size: var(--cp-text-md);
  font-weight: var(--cp-font-medium);
  line-height: 1;
  text-decoration: none;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-2);
  background: var(--cp-bg1);
  color: var(--cp-text);
  cursor: pointer;
  transition:
    background var(--cp-transition-fast) var(--cp-ease-out),
    border-color var(--cp-transition-fast) var(--cp-ease-out),
    transform var(--cp-transition-fast) var(--cp-ease-out);
}

.cp-button:hover {
  background: var(--cp-bg2);
  border-color: color-mix(in srgb, var(--cp-border) 60%, var(--cp-accent));
}

.cp-button:active {
  transform: scale(0.98);
}

.cp-button:focus-visible {
  outline: 2px solid var(--cp-focus);
  outline-offset: 2px;
}

.cp-button--primary {
  background: var(--cp-accent);
  border-color: var(--cp-accent);
  color: var(--cp-bg0);
}

.cp-button--primary:hover {
  background: color-mix(in srgb, var(--cp-accent) 85%, white);
  border-color: color-mix(in srgb, var(--cp-accent) 85%, white);
}

.cp-button--ghost {
  background: transparent;
  border-color: transparent;
}

.cp-button--ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: transparent;
}

.cp-button:disabled,
.cp-button[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .cp-button {
    transition: none;
  }
}
```

**Step 4: Create Button.astro component**

Create `apps/site/src/components/Button.astro`:

```astro
---
interface Props {
  variant?: "default" | "primary" | "ghost";
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  class?: string;
}

const {
  variant = "default",
  href,
  type = "button",
  disabled = false,
  class: className
} = Astro.props;

const variantClass = variant !== "default" ? `cp-button--${variant}` : "";
const classes = ["cp-button", variantClass, className].filter(Boolean).join(" ");
---

{href ? (
  <a
    href={href}
    class={classes}
    aria-disabled={disabled}
  >
    <slot />
  </a>
) : (
  <button
    type={type}
    class={classes}
    disabled={disabled}
  >
    <slot />
  </button>
)}
```

**Step 5: Import button.css in global.css**

Add to `apps/site/src/styles/global.css` after the other imports:

```css
@import "@cosmic/theme/styles/components/button.css";
```

**Step 6: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 7: Commit**

```bash
git add packages/theme/styles/components/button.css apps/site/src/components/Button.astro apps/site/src/styles/global.css apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(theme): add Button component

- Create button.css with default, primary, ghost variants
- Create Button.astro with link/button support
- Add hover, active, focus-visible, disabled states
- Add reduced-motion support
- Add E2E test for focus ring

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Add Navigation Active State

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`
- Test: `apps/site/tests/smoke.spec.ts`

**Step 1: Add E2E test for active nav**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Navigation shows active state", async ({ page }) => {
    await page.goto("explore/");

    const activeLink = page.locator('nav a[aria-current="page"]');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toContainText("Explore");
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL (no aria-current attribute)

**Step 3: Update Layout.astro navigation**

In `apps/site/src/layouts/Layout.astro`, update the nav links to include aria-current:

In the frontmatter:
```astro
const currentPath = Astro.url.pathname;

function isActive(href: string) {
  const base = import.meta.env.BASE_URL || "/";
  const fullHref = href.startsWith("/") ? base + href.slice(1) : base + href;
  return currentPath.startsWith(fullHref);
}
```

Update nav links:
```astro
<nav>
  <a
    href={`${import.meta.env.BASE_URL}explore/`}
    aria-current={isActive("/explore/") ? "page" : undefined}
  >
    Explore
  </a>
  <a
    href={`${import.meta.env.BASE_URL}playlists/`}
    aria-current={isActive("/playlists/") ? "page" : undefined}
  >
    Playlists
  </a>
</nav>
```

Add style for active state:
```css
nav a[aria-current="page"] {
  color: var(--cp-accent);
  border-bottom: 2px solid currentColor;
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/site/src/layouts/Layout.astro apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(site): add navigation active state

- Add isActive helper for current page detection
- Add aria-current="page" for accessibility
- Add visual indicator (accent color + underline)
- Add E2E test for active nav state

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Component Polish (Tasks 10-12)

### Task 10: Add Link Transitions

**Files:**
- Modify: `packages/theme/styles/tokens.css`

**Step 1: Add E2E test for link transitions**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Links have transitions", async ({ page }) => {
    await page.goto("explore/");

    const link = page.locator("a").first();
    const transition = await link.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    expect(transition).not.toBe("all 0s ease 0s");
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL

**Step 3: Update link styles in tokens.css**

Replace the link styles in `packages/theme/styles/tokens.css`:

```css
a {
  color: var(--cp-accent3);
  text-decoration: none;
  transition: color var(--cp-transition-fast) var(--cp-ease-out);
}

a:hover {
  color: color-mix(in srgb, var(--cp-accent3) 80%, white);
}

a:active {
  color: var(--cp-accent3);
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/tokens.css apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(theme): add link transitions

- Add color transition to links
- Update hover state to brighten
- Add E2E test for link transitions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Add Badge Hover States

**Files:**
- Modify: `packages/theme/styles/layer-museum.css`

**Step 1: Add E2E test for badge interactions**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Badges have hover transition", async ({ page }) => {
    await page.goto("explore/");

    const badge = page.locator(".cp-badge").first();
    const transition = await badge.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    expect(transition).toContain("background");
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL

**Step 3: Update badge styles**

Update `.cp-badge` in `packages/theme/styles/layer-museum.css`:

```css
.cp-badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--cp-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--cp-muted);
  font-size: var(--cp-text-sm);
  transition:
    background var(--cp-transition-fast) var(--cp-ease-out),
    border-color var(--cp-transition-fast) var(--cp-ease-out);
}

.cp-badge:hover {
  background: rgba(255, 255, 255, 0.08);
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/theme/styles/layer-museum.css apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(theme): add badge hover transitions

- Add background/border transitions to badges
- Add subtle hover highlight
- Add E2E test for badge transitions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Add Empty State Component

**Files:**
- Create: `apps/site/src/components/EmptyState.astro`
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Add E2E test for empty state**

Add to `apps/site/tests/smoke.spec.ts`:

```typescript
  test("Empty state shows when no results", async ({ page }) => {
    await page.goto("explore/?query=xyznonexistent123");

    const emptyState = page.locator(".empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No demos found");
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/site && pnpm test:e2e`

Expected: FAIL

**Step 3: Create EmptyState component**

Create `apps/site/src/components/EmptyState.astro`:

```astro
---
import { SearchX } from "lucide-astro";

interface Props {
  title?: string;
  message?: string;
}

const {
  title = "No demos found",
  message = "Try adjusting your filters or search query."
} = Astro.props;
---

<div class="empty-state">
  <SearchX size={48} aria-hidden="true" />
  <h3>{title}</h3>
  <p>{message}</p>
  <slot />
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--cp-space-4);
    padding: var(--cp-space-7);
    text-align: center;
    color: var(--cp-muted);
  }

  .empty-state h3 {
    margin: 0;
    font-size: var(--cp-text-xl);
    color: var(--cp-text);
  }

  .empty-state p {
    margin: 0;
    max-width: 40ch;
  }

  .empty-state :global(svg) {
    opacity: 0.5;
  }
</style>
```

**Step 4: Update explore page to use EmptyState**

In `apps/site/src/pages/explore/index.astro`, import and use EmptyState:

Add import:
```astro
import EmptyState from "../../components/EmptyState.astro";
```

Wrap the demo grid with conditional:
```astro
{filteredDemos.length > 0 ? (
  <div class="demo-grid">
    {filteredDemos.map((demo) => (
      <DemoCard ... />
    ))}
  </div>
) : (
  <EmptyState />
)}
```

**Step 5: Run test to verify it passes**

Run: `cd apps/site && pnpm test:e2e`

Expected: PASS

**Step 6: Commit**

```bash
git add apps/site/src/components/EmptyState.astro apps/site/src/pages/explore/index.astro apps/site/tests/smoke.spec.ts
git commit -m "$(cat <<'EOF'
feat(site): add EmptyState component

- Create EmptyState with icon, title, message
- Add to explore page for no-results scenario
- Add E2E test for empty state visibility

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Verification (Task 13)

### Task 13: Run Full Test Suite & Visual Check

**Step 1: Run all theme unit tests**

Run: `cd packages/theme && pnpm test`

Expected: All PASS

**Step 2: Run all E2E tests**

Run: `cd apps/site && pnpm test:e2e`

Expected: All PASS

**Step 3: Run full build**

Run: `pnpm build`

Expected: Build completes without errors

**Step 4: Manual verification checklist**

Run dev server: `pnpm dev`

Check:
- [ ] Typography is 18px base, headings scale up
- [ ] Cards lift on hover with teal glow
- [ ] Topic badges have icons
- [ ] Search input has search icon
- [ ] Navigation shows active page
- [ ] Links have smooth color transition
- [ ] Badges brighten on hover
- [ ] Empty state shows when filtering returns nothing
- [ ] All focus states show teal ring
- [ ] Reduced motion: no animations/transforms

**Step 5: Commit final verification**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: verify UI/UX design system implementation

All tests passing:
- Typography scale tokens
- Transition tokens
- Elevation tokens
- Icon system
- Card interactions
- Button component
- Navigation active state
- Link transitions
- Badge hover states
- Empty state component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Phase | Tasks | Components Added |
|-------|-------|------------------|
| 1. Typography | 1-4 | Typography tokens, heading styles |
| 2. Icons | 5-6 | Icon.astro, TopicIcon.astro, Lucide |
| 3. Interactions | 7-9 | Card transitions, Button.astro, Nav active |
| 4. Polish | 10-12 | Link transitions, Badge hover, EmptyState |
| 5. Verification | 13 | Full test suite |

**Total: 13 tasks, ~26 commits**

---

## Files Modified/Created

**New files:**
- `packages/theme/src/tokens.test.ts`
- `packages/theme/vitest.config.ts`
- `packages/theme/styles/components/button.css`
- `apps/site/src/components/Icon.astro`
- `apps/site/src/components/TopicIcon.astro`
- `apps/site/src/components/Button.astro`
- `apps/site/src/components/EmptyState.astro`

**Modified files:**
- `packages/theme/styles/tokens.css`
- `packages/theme/styles/layer-museum.css`
- `packages/theme/package.json`
- `apps/site/src/components/FilterBar.astro`
- `apps/site/src/components/TagPill.astro`
- `apps/site/src/components/DemoCard.astro`
- `apps/site/src/layouts/Layout.astro`
- `apps/site/src/pages/explore/index.astro`
- `apps/site/src/styles/global.css`
- `apps/site/tests/smoke.spec.ts`
