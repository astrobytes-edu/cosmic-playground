# Main UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the dark museum UI with the new 5‑color palette, improved hierarchy, curated featured rows, and minimalist glyphs on demo cards, while keeping the light/paper theme unchanged.

**Architecture:** Update shared theme tokens and museum layer styles first so the new palette is global and consistent, then adjust Explore/Home/Exhibit page structure and DemoCard presentation to align with the new hierarchy. Add featured metadata to demo content and render a curated “Start here” row. Add a small glyph system mapped by topic for scanability.

**Tech Stack:** Astro pages + components, shared CSS tokens under `packages/theme`, inline SVG glyphs, minimal page‑scoped JS.

---

### Task 1: Add `featured` metadata to demos

**Files:**
- Modify: `apps/site/src/content/config.ts`
- Modify: `apps/site/src/content/demos/keplers-laws.md`
- Modify: `apps/site/src/content/demos/retrograde-motion.md`
- Modify: `apps/site/src/content/demos/binary-orbits.md`

**Step 1: Update schema**

```ts
// apps/site/src/content/config.ts
featured: z.boolean().default(false),
```

**Step 2: Mark featured demos**

```yaml
# add to frontmatter in each file
featured: true
```

**Step 3: Run typecheck (content schema)**

Run: `corepack pnpm -C apps/site typecheck`  
Expected: PASS

**Step 4: Commit**

```bash
git add apps/site/src/content/config.ts apps/site/src/content/demos/keplers-laws.md apps/site/src/content/demos/retrograde-motion.md apps/site/src/content/demos/binary-orbits.md
git commit -m "feat: add featured demos metadata"
```

---

### Task 2: Implement the 5‑color palette in dark tokens

**Files:**
- Modify: `packages/theme/styles/tokens.css`

**Step 1: Replace dark neutral + accent tokens**

```css
--cp-bg0: #0f1115;
--cp-bg1: #171b22;
--cp-bg2: #21222b;
--cp-bg3: color-mix(in srgb, var(--cp-bg2) 80%, var(--cp-bg0));
--cp-border: rgba(255, 255, 255, 0.08);
--cp-border-subtle: rgba(255, 255, 255, 0.06);

--cp-text: color-mix(in srgb, #ffffff 92%, var(--cp-bg0));
--cp-text2: color-mix(in srgb, #ffffff 72%, var(--cp-bg0));
--cp-muted: color-mix(in srgb, #ffffff 52%, var(--cp-bg0));
--cp-faint: color-mix(in srgb, #ffffff 38%, var(--cp-bg0));
--cp-text-3: var(--cp-muted);

--cp-accent: #2f8c8d;
--cp-pink: #b07a93;
--cp-violet: #6d7794;
```

**Step 2: Add derived UI tokens**

```css
--cp-chip-bg: color-mix(in srgb, var(--cp-bg2) 70%, transparent);
--cp-chip-bg-active: color-mix(in srgb, var(--cp-accent) 22%, transparent);
--cp-chip-border-active: color-mix(in srgb, var(--cp-accent) 45%, transparent);

--cp-card-bg: linear-gradient(
  180deg,
  color-mix(in srgb, var(--cp-bg2) 92%, #ffffff 8%) 0%,
  color-mix(in srgb, var(--cp-bg2) 92%, #000000 8%) 100%
);
--cp-card-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
--cp-card-shadow-hover: 0 14px 36px rgba(0, 0, 0, 0.42);
--cp-card-border-hover: color-mix(in srgb, var(--cp-accent) 35%, var(--cp-border));

--cp-status-draft-bg: color-mix(in srgb, var(--cp-pink) 18%, transparent);
--cp-status-draft-text: color-mix(in srgb, var(--cp-pink) 85%, #ffffff 15%);
--cp-status-beta-bg: color-mix(in srgb, var(--cp-accent) 18%, transparent);
--cp-status-beta-text: color-mix(in srgb, var(--cp-accent) 85%, #ffffff 15%);
```

**Step 3: Run theme tests**

Run: `corepack pnpm -C packages/theme test` (if available)  
Expected: PASS (or skip if no script)

**Step 4: Commit**

```bash
git add packages/theme/styles/tokens.css
git commit -m "style: apply muted spectral palette to dark tokens"
```

---

### Task 3: Update museum layer card + badge styling

**Files:**
- Modify: `packages/theme/styles/layer-museum.css`

**Step 1: Adjust background + card styles**

```css
.cp-layer-museum { background: var(--cp-bg0); }

.cp-card {
  background: var(--cp-card-bg);
  border: 1px solid var(--cp-border);
  box-shadow: var(--cp-card-shadow);
}
.cp-card:hover {
  box-shadow: var(--cp-card-shadow-hover), var(--cp-shadow-2);
  border-color: var(--cp-card-border-hover);
}
```

**Step 2: Update badges to use chip tokens**

```css
.cp-badge {
  background: var(--cp-chip-bg);
  border-color: var(--cp-border-subtle);
}
```

**Step 3: Add status badge variants**

```css
.cp-badge[data-tone="status-draft"] {
  background: var(--cp-status-draft-bg);
  color: var(--cp-status-draft-text);
  border-color: color-mix(in srgb, var(--cp-status-draft-text) 35%, var(--cp-border));
}
.cp-badge[data-tone="status-beta"] {
  background: var(--cp-status-beta-bg);
  color: var(--cp-status-beta-text);
  border-color: color-mix(in srgb, var(--cp-status-beta-text) 35%, var(--cp-border));
}
```

**Step 4: Commit**

```bash
git add packages/theme/styles/layer-museum.css
git commit -m "style: refine museum card and badge styling"
```

---

### Task 4: Add minimalist glyphs and mapping

**Files:**
- Create: `apps/site/src/components/DemoGlyph.astro`
- Create: `apps/site/src/lib/demoGlyphs.ts`
- Modify: `apps/site/src/components/DemoCard.astro`

**Step 1: Add glyph components (stroke‑only SVG, currentColor)**

```astro
--- // DemoGlyph.astro
const { name } = Astro.props;
---
<svg ... stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">...</svg>
```

**Step 2: Add mapping helper**

```ts
// demoGlyphs.ts
export function pickDemoGlyph(topics: string[], slug: string, title: string): DemoGlyphName { ... }
```

**Step 3: Render glyph in DemoCard**

```astro
<DemoGlyph name={glyph} class="demo-card__glyph" aria-hidden="true" />
```

**Step 4: Commit**

```bash
git add apps/site/src/components/DemoGlyph.astro apps/site/src/lib/demoGlyphs.ts apps/site/src/components/DemoCard.astro
git commit -m "feat: add demo glyphs to cards"
```

---

### Task 5: Restructure Explore page + filters + chips

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`
- Modify: `apps/site/src/components/FilterBar.astro`

**Step 1: Add hero, featured row, chips, and summary copy**
**Step 2: Add `<details>` for More filters**
**Step 3: Add page‑scoped JS for auto‑submit (debounced)**

**Step 4: Commit**

```bash
git add apps/site/src/pages/explore/index.astro apps/site/src/components/FilterBar.astro
git commit -m "feat: refresh Explore layout and filters"
```

---

### Task 6: Update Home + Exhibit pages for new hierarchy

**Files:**
- Modify: `apps/site/src/pages/index.astro`
- Modify: `apps/site/src/pages/exhibits/[slug].astro`
- Modify: `apps/site/src/styles/global.css`

**Step 1: Use featured row with label “Start here: Gravity & Orbits”**
**Step 2: Apply `.cp-hero` class for hero bands**
**Step 3: Tweak spacing tokens via global styles (no new colors)**

**Step 4: Commit**

```bash
git add apps/site/src/pages/index.astro apps/site/src/pages/exhibits/[slug].astro apps/site/src/styles/global.css
git commit -m "style: apply new hero and spacing hierarchy"
```

---

### Task 7: Full verification

Run:
- `corepack pnpm -r typecheck`
- `corepack pnpm build`

Expected: PASS

**Final Commit (if needed):**

```bash
git add -A
git commit -m "chore: finalize main UI refresh"
```

