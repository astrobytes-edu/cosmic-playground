# Deep UI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Explore/Home experience editorial and elegant by adding topic clustering with a jump index, reinforcing the “Predict → Play → Explain” cadence, and tightening spacing + hierarchy in the dark museum theme.

**Architecture:** Keep all changes in existing Astro pages and shared theme/styles. Explore renders topic sections only when no filters are active; filtered view stays flat. Styling uses existing tokens—no new colors in apps.

**Tech Stack:** Astro pages + components, shared CSS in `packages/theme` and `apps/site/src/styles/global.css`, no new dependencies.

---

### Task 1: Add topic labels + grouping logic for Explore

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Add topic label/order map**

```ts
const topicOrder = [
  "EarthSky",
  "Orbits",
  "LightSpectra",
  "Telescopes",
  "DataInference",
  "Stars",
  "Galaxies",
  "Cosmology"
];

const topicLabel: Record<string, string> = {
  EarthSky: "Earth & Sky",
  Orbits: "Orbits",
  LightSpectra: "Light & Spectra",
  Telescopes: "Telescopes",
  DataInference: "Data & Inference",
  Stars: "Stars",
  Galaxies: "Galaxies",
  Cosmology: "Cosmology"
};
```

**Step 2: Build topic sections (no filters)**

```ts
const noFilters = chips.length === 0;
const topicSections = noFilters
  ? topicOrder.map((key) => ({
      key,
      label: topicLabel[key],
      demos: sorted.filter((d) => d.data.topics.includes(key as any))
    }))
  : [];
```

**Step 3: Commit**

```bash
git add apps/site/src/pages/explore/index.astro
git commit -m "feat: group Explore by topic when unfiltered"
```

---

### Task 2: Add jump‑to‑topic index + topic sections

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Add jump index markup (no filters)**

```astro
{noFilters ? (
  <nav class="topic-index" aria-label="Jump to topic">
    {topicSections.map((section) => (
      <a class="topic-index__link" href={`#topic-${section.key.toLowerCase()}`}>
        {section.label}
      </a>
    ))}
  </nav>
) : null}
```

**Step 2: Render topic sections**

```astro
{noFilters ? (
  <section class="cp-section">
    {topicSections.map((section) =>
      section.demos.length > 0 ? (
        <div class="topic-section" id={`topic-${section.key.toLowerCase()}`}>
          <h2 class="topic-section__title">{section.label}</h2>
          <div class="results__grid">
            {section.demos.map((d) => (
              <DemoCard ... />
            ))}
          </div>
        </div>
      ) : null
    )}
  </section>
) : null}
```

**Step 3: Add Explore‑scoped CSS**

```css
.topic-index {
  margin-top: var(--cp-space-5);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.topic-index__link {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--cp-border-subtle);
  background: var(--cp-chip-bg);
  color: var(--cp-text2);
  text-decoration: none;
  font-size: var(--cp-text-sm);
}
.topic-index__link:hover {
  border-color: var(--cp-chip-border-active);
  background: var(--cp-chip-bg-active);
  color: var(--cp-text);
}
.topic-section {
  margin-top: var(--cp-space-6);
}
.topic-section__title {
  margin: 0 0 var(--cp-space-4);
  scroll-margin-top: calc(var(--cp-space-7) + 48px);
}
```

**Step 4: Commit**

```bash
git add apps/site/src/pages/explore/index.astro
git commit -m "feat: add Explore topic index and sections"
```

---

### Task 3: Add shared section utility + hero subtitle styling

**Files:**
- Modify: `apps/site/src/styles/global.css`

**Step 1: Add `.cp-section` utility**

```css
.cp-section {
  margin-top: var(--cp-space-6);
}
```

**Step 2: Add hero subtitle style**

```css
.hero__subtitle {
  margin: 6px 0 0;
  font-size: var(--cp-text-lg);
  color: var(--cp-text2);
  letter-spacing: 0.02em;
}
```

**Step 3: Commit**

```bash
git add apps/site/src/styles/global.css
git commit -m "style: add section utility and hero subtitle"
```

---

### Task 4: Add home hero subtitle

**Files:**
- Modify: `apps/site/src/pages/index.astro`

**Step 1: Insert subtitle under the hero heading**

```astro
<h1>Cosmic Playground</h1>
<p class="hero__subtitle">Predict → Play → Explain</p>
```

**Step 2: Commit**

```bash
git add apps/site/src/pages/index.astro
git commit -m "feat: add home hero subtitle"
```

---

### Task 5: Tighten card/grid rhythm for Explore + Home

**Files:**
- Modify: `apps/site/src/pages/explore/index.astro`
- Modify: `apps/site/src/pages/index.astro`
- Modify: `apps/site/src/components/DemoCard.astro`

**Step 1: Increase grid gaps**

```css
.results__grid { gap: var(--cp-space-6); }
.grid { gap: var(--cp-space-6); }
```

**Step 2: Slightly reduce badge dominance**

```css
.demo-card__badges { opacity: 0.9; }
```

**Step 3: Commit**

```bash
git add apps/site/src/pages/explore/index.astro apps/site/src/pages/index.astro apps/site/src/components/DemoCard.astro
git commit -m "style: tune grid rhythm and badge contrast"
```

---

### Task 6: Verification

Run:
- `corepack pnpm -C apps/site typecheck`
- `corepack pnpm build`

Expected: PASS

