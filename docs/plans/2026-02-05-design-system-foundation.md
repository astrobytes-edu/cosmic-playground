# Design System Foundation — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the "cosmic" atmosphere back to Cosmic Playground by adding the missing visual foundation — glow system, celestial palette, instrument accents, readout typography, animation keyframes, and a shared starfield module.

**Architecture:** We modify two packages: `@cosmic/theme` (CSS tokens + layer overrides) and `@cosmic/runtime` (TypeScript starfield module). All changes are additive — existing tokens remain untouched. New tokens follow the `--cp-` prefix convention. The starfield is a pure function that returns a cleanup handle.

**Tech Stack:** CSS custom properties, Vitest (theme tests), TypeScript (starfield), Canvas 2D API, `prefers-reduced-motion` media query.

**Critical Rule:** DO NOT modify anything in `~/Teaching/astr101-sp26/demos/`. Only edit files under `~/Teaching/cosmic-playground/`.

---

## Task 1: Add Glow System Tokens to `tokens.css`

**What you'll learn:** CSS custom properties can store *any* CSS value — including complex `box-shadow` definitions with multiple layers. This is how design systems make glows reusable across components without copy-pasting rgba values everywhere.

**Why 30-50% opacity?** Celestial objects emit light. A star's glow at 8% opacity is invisible on most monitors. At 40%, it creates a visible halo that simulates light emission without overwhelming the UI. This range was validated against the legacy demos that students already find visually appealing.

**Files:**
- Modify: `packages/theme/styles/tokens.css` (insert after line 54, before the Data Visualization section)
- Modify: `packages/theme/src/tokens.test.ts` (add glow system test)

**Step 1: Write the failing test**

Add this test block at the end of `packages/theme/src/tokens.test.ts`, before the final `});`:

```typescript
  describe("Glow system", () => {
    it("defines celestial glow tokens at 30-50% opacity", () => {
      const requiredTokens = [
        "--cp-glow-sun",
        "--cp-glow-moon",
        "--cp-glow-planet",
        "--cp-glow-star",
        "--cp-glow-accent-teal",
        "--cp-glow-accent-rose",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });

    it("glow tokens use 30-50% opacity range", () => {
      // Extract all glow opacity values — they should be 0.30-0.50
      const glowPattern = /--cp-glow-\w+:.*?rgba\([^)]*,\s*([\d.]+)\)/g;
      let match;
      const opacities: number[] = [];
      while ((match = glowPattern.exec(css)) !== null) {
        opacities.push(parseFloat(match[1]));
      }
      expect(opacities.length).toBeGreaterThanOrEqual(4);
      for (const opacity of opacities) {
        expect(opacity).toBeGreaterThanOrEqual(0.3);
        expect(opacity).toBeLessThanOrEqual(0.5);
      }
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: FAIL — tokens not found in CSS.

**Step 3: Add glow tokens to `tokens.css`**

Insert after line 54 (after the `--cp-glow-magenta: var(--cp-glow-pink);` legacy alias), before the `/* ---------- Data Visualization ---------- */` comment:

```css

  /* ---------- Glow System (30-50% opacity — celestial objects emit light) ---------- */
  --cp-glow-sun: 0 0 40px 10px rgba(255, 200, 100, 0.45);
  --cp-glow-moon: 0 0 30px 8px rgba(200, 200, 220, 0.35);
  --cp-glow-planet: 0 0 20px 5px rgba(100, 150, 255, 0.30);
  --cp-glow-star: 0 0 15px 3px rgba(255, 255, 255, 0.40);
  --cp-glow-accent-teal: 0 0 25px 6px rgba(45, 212, 191, 0.35);
  --cp-glow-accent-rose: 0 0 25px 6px rgba(244, 114, 182, 0.35);
  --cp-glow-accent-violet: 0 0 25px 6px rgba(167, 139, 250, 0.35);
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: PASS

**Step 5: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/tokens.css packages/theme/src/tokens.test.ts
git commit -m "feat(theme): add glow system tokens (30-50% opacity range)

Celestial objects need visible glows to feel alive. Previous glows were
6-10% opacity (invisible). New tokens follow the 40% opacity principle
from the legacy demos.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add Celestial Object Palette to `tokens.css`

**What you'll learn:** Shared color tokens for domain objects (sun, moon, earth, mars) prevent each demo from inventing its own slightly-different yellow for the sun. This is the "single source of truth" principle applied to color — change `--cp-celestial-sun` once, and every sun in every demo updates.

**Why not just use generic palette colors?** Because `--cp-chart-1` (teal) tells you nothing about what it represents. `--cp-celestial-sun` is self-documenting — any developer reading the SVG knows exactly what that color is for. Semantic naming reduces bugs.

**Files:**
- Modify: `packages/theme/styles/tokens.css` (insert after glow system, before Data Visualization)
- Modify: `packages/theme/src/tokens.test.ts` (add celestial palette test)

**Step 1: Write the failing test**

Add after the glow system test in `tokens.test.ts`:

```typescript
  describe("Celestial object palette", () => {
    it("defines tokens for astronomical objects", () => {
      const requiredTokens = [
        "--cp-celestial-sun",
        "--cp-celestial-moon",
        "--cp-celestial-earth",
        "--cp-celestial-mars",
        "--cp-celestial-star",
        "--cp-celestial-orbit",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: FAIL

**Step 3: Add celestial palette tokens**

Insert in `tokens.css` after the glow system block:

```css

  /* ---------- Celestial Object Palette ---------- */
  --cp-celestial-sun: #fbbf24;
  --cp-celestial-sun-core: #fff5cc;
  --cp-celestial-sun-corona: #ff8c00;
  --cp-celestial-moon: #e2e8f0;
  --cp-celestial-moon-dark: #3a3a4a;
  --cp-celestial-earth: #3b82f6;
  --cp-celestial-earth-land: #4a9d4a;
  --cp-celestial-mars: #ef4444;
  --cp-celestial-jupiter: #d4a574;
  --cp-celestial-star: #ffffff;
  --cp-celestial-orbit: var(--cp-violet);
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: PASS

**Step 5: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/tokens.css packages/theme/src/tokens.test.ts
git commit -m "feat(theme): add celestial object palette tokens

Shared color tokens for sun, moon, earth, mars, star, and orbit paths.
Ensures visual consistency across all demos — no more hardcoded hex
values in individual SVG files.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add Instrument Accent Colors to `tokens.css`

**What you'll learn:** The "two-layer" philosophy means the *same token name* can have *different values* depending on context. The museum layer uses muted colors for a sophisticated feel. The instrument layer uses vivid colors for a "spacecraft control panel" feel. CSS custom properties cascade — a child element inherits the nearest ancestor's value. So `[data-layer="instrument"]` can override `--cp-accent` without affecting the museum pages.

**But first**, we add the *instrument-specific* accent colors as their own tokens. These are the "data display" colors that don't exist in the museum context at all — amber for values, green for success, ice for units.

**Files:**
- Modify: `packages/theme/styles/tokens.css` (insert after celestial palette)
- Modify: `packages/theme/src/tokens.test.ts` (add instrument accents test)

**Step 1: Write the failing test**

```typescript
  describe("Instrument accent colors", () => {
    it("defines instrument-specific accent tokens", () => {
      const requiredTokens = [
        "--cp-accent-amber",
        "--cp-accent-green",
        "--cp-accent-ice",
        "--cp-accent-rose",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: FAIL

**Step 3: Add instrument accent tokens**

Insert in `tokens.css` after the celestial palette:

```css

  /* ---------- Instrument Accents (spacecraft control panel palette) ---------- */
  --cp-accent-amber: #FFB86C;
  --cp-accent-green: #50FA7B;
  --cp-accent-ice: #8BE9FD;
  --cp-accent-rose: #FF79C6;
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: PASS

**Step 5: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/tokens.css packages/theme/src/tokens.test.ts
git commit -m "feat(theme): add instrument accent colors (amber/green/ice/rose)

These vivid accents are used in demo readouts and interactive states.
Amber for primary values, green for success, ice for units/secondary,
rose for warnings. Distinct from the muted museum palette.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add Readout Typography Tokens to `tokens.css`

**What you'll learn:** Typography tokens encode a *visual hierarchy* — the relationship between label, value, and unit. By storing sizes, weights, tracking (letter-spacing), and colors as tokens, every `<cp-readout>` component inherits the same hierarchy automatically. `font-variant-numeric: tabular-nums` is a crucial detail — it makes digits all the same width so numbers don't "jump" as they update (e.g., "1.23" and "4.56" take exactly the same horizontal space).

**Files:**
- Modify: `packages/theme/styles/tokens.css` (insert after instrument accents, before root closing `}`)
- Modify: `packages/theme/src/tokens.test.ts` (add readout typography test)

**Step 1: Write the failing test**

```typescript
  describe("Readout typography", () => {
    it("defines readout label/value/unit tokens", () => {
      const requiredTokens = [
        "--cp-readout-label-size",
        "--cp-readout-label-weight",
        "--cp-readout-label-tracking",
        "--cp-readout-label-color",
        "--cp-readout-value-size",
        "--cp-readout-value-weight",
        "--cp-readout-value-color",
        "--cp-readout-value-font",
        "--cp-readout-unit-size",
        "--cp-readout-unit-color",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });

    it("readout values use amber color", () => {
      expect(css).toMatch(/--cp-readout-value-color:.*amber/);
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: FAIL

**Step 3: Add readout typography tokens**

Insert in `tokens.css` after instrument accents, before the existing `--cp-status-draft-bg` section:

```css

  /* ---------- Readout Typography (label → value → unit hierarchy) ---------- */
  --cp-readout-label-size: 0.75rem;
  --cp-readout-label-weight: 600;
  --cp-readout-label-tracking: 0.05em;
  --cp-readout-label-color: var(--cp-muted);
  --cp-readout-value-size: 1.5rem;
  --cp-readout-value-weight: 500;
  --cp-readout-value-color: var(--cp-accent-amber);
  --cp-readout-value-font: "SF Mono", "Fira Code", ui-monospace, SFMono-Regular,
    Menlo, Monaco, Consolas, monospace;
  --cp-readout-unit-size: 0.875rem;
  --cp-readout-unit-weight: 400;
  --cp-readout-unit-color: var(--cp-accent-ice);
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: PASS

**Step 5: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/tokens.css packages/theme/src/tokens.test.ts
git commit -m "feat(theme): add readout typography tokens (label/value/unit)

Three-tier hierarchy for data readouts: uppercase muted labels, large
amber monospace values, subtle ice-blue units. Designed for projection
readability from the back of a lecture hall.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add Animation Keyframes to Theme

**What you'll learn:** CSS `@keyframes` define reusable animation sequences that components reference by name. Putting them in the theme (not per-demo) means every demo gets the same pulse, glow-pulse, and value-flash without copy-pasting. The `prefers-reduced-motion` media query disables all animations for users who find motion disorienting — this is a WCAG requirement, not optional.

**Why `animation-duration: 0.01ms` instead of `animation: none`?** Setting duration to near-zero still triggers `animationend` events that JavaScript might be listening for. Setting `animation: none` would silently break any JS that depends on animation completion callbacks. The 0.01ms trick is the industry standard for accessible motion reduction.

**Files:**
- Create: `packages/theme/styles/animations.css`
- Modify: `packages/theme/src/tokens.test.ts` (add animation keyframes test)

**Step 1: Write the failing test**

Add a new `describe` block and update the file-reading logic to also read `animations.css`:

At the top of `tokens.test.ts`, after the existing `css` variable (line 7), add:

```typescript
  const animPath = path.resolve(__dirname, "../styles/animations.css");
  const animCss = fs.existsSync(animPath) ? fs.readFileSync(animPath, "utf-8") : "";
```

Then add this test block:

```typescript
  describe("Animation keyframes", () => {
    it("defines required keyframe animations", () => {
      const requiredKeyframes = [
        "@keyframes cp-pulse",
        "@keyframes cp-glow-pulse",
        "@keyframes cp-value-flash",
        "@keyframes cp-slide-up",
        "@keyframes cp-pop-in",
        "@keyframes cp-fade-in",
      ];
      for (const kf of requiredKeyframes) {
        expect(animCss).toContain(kf);
      }
    });

    it("includes reduced-motion override", () => {
      expect(animCss).toContain("prefers-reduced-motion");
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: FAIL — file doesn't exist.

**Step 3: Create `animations.css`**

Create file `packages/theme/styles/animations.css`:

```css
/* ============================================
   Cosmic Playground — Shared Animation Keyframes

   All animation names are prefixed cp- to avoid
   collisions with third-party libraries.
   ============================================ */

@keyframes cp-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cp-slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cp-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  70% {
    transform: scale(1.04);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes cp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes cp-glow-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 20px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 35px currentColor);
  }
}

@keyframes cp-value-flash {
  0% {
    color: var(--cp-accent-amber, #FFB86C);
    transform: scale(1.05);
  }
  100% {
    color: inherit;
    transform: scale(1);
  }
}

@keyframes cp-twinkle {
  0%, 100% {
    opacity: var(--cp-star-opacity, 0.8);
  }
  50% {
    opacity: calc(var(--cp-star-opacity, 0.8) * 0.4);
  }
}

/* ============================================
   Reduced Motion — WCAG accessibility requirement

   When the user prefers reduced motion, all
   animations collapse to near-instant. We use
   0.01ms (not "none") so animationend events
   still fire for any JS listeners.
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: PASS

**Step 5: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/animations.css packages/theme/src/tokens.test.ts
git commit -m "feat(theme): add shared animation keyframes + reduced-motion

Six reusable animations: fade-in, slide-up, pop-in, pulse, glow-pulse,
value-flash, twinkle. All disabled via prefers-reduced-motion using the
0.01ms duration trick (preserves animationend events).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Update `vars.ts` with New Token Mappings

**What you'll learn:** `vars.ts` is the TypeScript "mirror" of `tokens.css`. It maps camelCase JS names to CSS custom property strings. This lets TypeScript code reference tokens with autocomplete and type-checking — `CSS_VARS.celestialSun` instead of a raw string `"--cp-celestial-sun"` that could be typo'd silently.

**Files:**
- Modify: `packages/theme/src/vars.ts` (add new token mappings)

**Step 1: Add new token mappings to `CSS_VARS`**

Add these entries to the `CSS_VARS` object in `packages/theme/src/vars.ts`, before the closing `} as const;`:

```typescript

  // Celestial glows (30-50% opacity)
  glowSun: "--cp-glow-sun",
  glowMoon: "--cp-glow-moon",
  glowPlanet: "--cp-glow-planet",
  glowStar: "--cp-glow-star",
  glowAccentTeal: "--cp-glow-accent-teal",
  glowAccentRose: "--cp-glow-accent-rose",
  glowAccentViolet: "--cp-glow-accent-violet",

  // Celestial object palette
  celestialSun: "--cp-celestial-sun",
  celestialSunCore: "--cp-celestial-sun-core",
  celestialSunCorona: "--cp-celestial-sun-corona",
  celestialMoon: "--cp-celestial-moon",
  celestialMoonDark: "--cp-celestial-moon-dark",
  celestialEarth: "--cp-celestial-earth",
  celestialMars: "--cp-celestial-mars",
  celestialStar: "--cp-celestial-star",
  celestialOrbit: "--cp-celestial-orbit",

  // Instrument accents
  accentAmber: "--cp-accent-amber",
  accentGreen: "--cp-accent-green",
  accentIce: "--cp-accent-ice",
  accentRose: "--cp-accent-rose",

  // Readout typography
  readoutLabelColor: "--cp-readout-label-color",
  readoutValueColor: "--cp-readout-value-color",
  readoutValueFont: "--cp-readout-value-font",
  readoutUnitColor: "--cp-readout-unit-color",
```

**Step 2: Run typecheck to verify**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme typecheck`

Expected: No errors.

**Step 3: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/src/vars.ts
git commit -m "feat(theme): add TS mappings for new tokens in vars.ts

Mirrors the new CSS tokens (glow system, celestial palette, instrument
accents, readout typography) in the TypeScript CSS_VARS constant for
autocomplete and type-safe token references.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Overhaul `layer-instrument.css`

**What you'll learn:** CSS layers let you define *context-specific overrides* that cascade naturally. The `.cp-layer-instrument` class is applied to demo roots. Inside this scope, we override the muted museum accents with vivid instrument accents, make panels translucent (so the starfield shows through), and add utility classes for celestial object styling.

**`backdrop-filter: blur()`** creates the "frosted glass" effect — it blurs whatever is behind the element. Combined with a semi-transparent background, panels appear to float over the starfield with a subtle depth effect. This is how macOS sidebars and iOS sheets work.

**Files:**
- Modify: `packages/theme/styles/layer-instrument.css` (overhaul)

**Step 1: Rewrite `layer-instrument.css`**

Replace the entire contents of `packages/theme/styles/layer-instrument.css` with:

```css
/* ============================================
   Instrument Layer — "Spacecraft Control Panel"

   Applied to demo roots via:
     <div class="cp-layer-instrument cp-demo">

   Overrides the muted museum aesthetic with
   vivid accents, visible glows, and translucent
   panels that float over the starfield.
   ============================================ */

/* --- Vivid accent overrides --- */
.cp-layer-instrument {
  background: var(--cp-bg0);

  --cp-accent: #2dd4bf;
  --cp-accent-hover: #5eead4;
  --cp-pink: #f472b6;
  --cp-pink-hover: #f9a8d4;
  --cp-violet: #a78bfa;
  --cp-violet-hover: #c4b5fd;
}

/* --- Glow intensity overrides (visible, not invisible) --- */
.cp-layer-instrument {
  --cp-glow-teal: 0 0 20px rgba(45, 212, 191, 0.40);
  --cp-glow-pink: 0 0 20px rgba(244, 114, 182, 0.35);
  --cp-glow-violet: 0 0 20px rgba(167, 139, 250, 0.35);

  /* Legacy */
  --cp-glow-accent: var(--cp-glow-teal);
  --cp-glow-blue: var(--cp-glow-violet);
  --cp-glow-magenta: var(--cp-glow-pink);
}

/* --- Translucent panels (starfield shows through) --- */
.cp-layer-instrument .cp-panel {
  background: rgba(23, 27, 34, 0.88);
  border: 1px solid rgba(109, 119, 148, 0.25);
  border-radius: var(--cp-r-2);
  box-shadow: var(--cp-shadow-1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.cp-layer-instrument .cp-panel-header {
  padding: var(--cp-space-3) var(--cp-space-4);
  border-bottom: 1px solid rgba(109, 119, 148, 0.15);
  color: var(--cp-muted);
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.cp-layer-instrument .cp-panel-body {
  padding: var(--cp-space-4);
}

/* --- Readout styling --- */
.cp-layer-instrument .cp-readout {
  background: rgba(33, 34, 43, 0.7);
  border-radius: var(--cp-r-1);
  padding: var(--cp-space-3);
}

.cp-layer-instrument .cp-readout__label {
  font-size: var(--cp-readout-label-size);
  font-weight: var(--cp-readout-label-weight);
  letter-spacing: var(--cp-readout-label-tracking);
  color: var(--cp-readout-label-color);
  text-transform: uppercase;
  margin-bottom: var(--cp-space-1);
}

.cp-layer-instrument .cp-readout__value {
  font-size: var(--cp-readout-value-size);
  font-weight: var(--cp-readout-value-weight);
  color: var(--cp-readout-value-color);
  font-family: var(--cp-readout-value-font);
  font-variant-numeric: tabular-nums;
  line-height: var(--cp-leading-tight);
}

.cp-layer-instrument .cp-readout__unit {
  font-size: var(--cp-readout-unit-size);
  font-weight: var(--cp-readout-unit-weight);
  color: var(--cp-readout-unit-color);
  margin-left: 0.25em;
}

/* --- Callouts --- */
.cp-layer-instrument .cp-callout {
  border-left: 3px solid var(--cp-accent);
  background: color-mix(in srgb, var(--cp-accent) 8%, transparent);
  padding: var(--cp-space-3) var(--cp-space-4);
  border-radius: var(--cp-r-2);
}

.cp-layer-instrument .cp-callout[data-kind="model"] {
  border-left-color: var(--cp-violet);
  background: color-mix(in srgb, var(--cp-violet) 8%, transparent);
}

.cp-layer-instrument .cp-callout[data-kind="misconception"] {
  border-left-color: var(--cp-pink);
  background: color-mix(in srgb, var(--cp-pink) 8%, transparent);
}

/* --- Celestial object utility classes (for SVG elements) --- */
.cp-layer-instrument .celestial-sun {
  fill: var(--cp-celestial-sun);
  filter: drop-shadow(var(--cp-glow-sun));
}

.cp-layer-instrument .celestial-moon {
  fill: var(--cp-celestial-moon);
  filter: drop-shadow(var(--cp-glow-moon));
}

.cp-layer-instrument .celestial-earth {
  fill: var(--cp-celestial-earth);
  filter: drop-shadow(var(--cp-glow-planet));
}

.cp-layer-instrument .celestial-mars {
  fill: var(--cp-celestial-mars);
  filter: drop-shadow(var(--cp-glow-planet));
}

.cp-layer-instrument .celestial-star-generic {
  fill: var(--cp-celestial-star);
  filter: drop-shadow(var(--cp-glow-star));
}

.cp-layer-instrument .orbit-path {
  stroke: var(--cp-celestial-orbit);
  fill: none;
  opacity: 0.5;
}

/* --- Interactive glow states --- */
.cp-layer-instrument .cp-button:hover,
.cp-layer-instrument .cp-button:focus-visible {
  box-shadow: var(--cp-glow-teal);
}

.cp-layer-instrument .cp-button--accent:hover,
.cp-layer-instrument .cp-button--accent:focus-visible {
  box-shadow: var(--cp-glow-pink);
}
```

**Step 2: Run typecheck across monorepo**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -r typecheck`

Expected: No errors (CSS-only changes don't affect TS).

**Step 3: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/layer-instrument.css
git commit -m "feat(theme): overhaul instrument layer with vivid accents + translucent panels

- Override muted museum accents with vivid teal/pink/violet
- Glow intensity bumped to 35-40% opacity (visible, not invisible)
- Panels now translucent (88% opacity + backdrop-filter blur)
- Readout styling with label/value/unit hierarchy
- Celestial object utility classes for SVG elements
- Interactive glow states on buttons

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Implement Starfield Module in `@cosmic/runtime`

**What you'll learn:** The starfield uses the Canvas 2D API — a lower-level drawing surface than SVG. Canvas is better for particle systems (hundreds of dots) because each "star" isn't a DOM node — it's just pixels drawn in a `requestAnimationFrame` loop. SVG would create 200 `<circle>` elements that the browser has to track, layout, and composite. Canvas just blits pixels.

**HiDPI handling:** Modern Macs have 2x pixel density. If you create a 600px-wide canvas, it physically has 1200 pixels. Without scaling, everything looks blurry. The trick: set `canvas.width = logicalWidth * devicePixelRatio`, then `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so your drawing coordinates stay in CSS pixels while the canvas renders at native resolution.

**The cleanup pattern:** `initStarfield()` returns a `() => void` cleanup function. This is the standard pattern for subscriptions in modern JS — the caller is responsible for calling the cleanup when the component unmounts. It stops the animation loop and removes the resize listener, preventing memory leaks.

**Files:**
- Create: `packages/runtime/src/starfield.ts`
- Modify: `packages/runtime/src/index.ts` (add export)

**Step 1: Create `starfield.ts`**

Create file `packages/runtime/src/starfield.ts`:

```typescript
/**
 * Starfield — animated canvas background for Cosmic Playground demos.
 *
 * Creates a subtle field of twinkling stars that sits behind translucent
 * demo panels, establishing the "cosmic" atmosphere.
 *
 * Usage:
 *   const cleanup = initStarfield({ canvas: myCanvas });
 *   // Later, when done:
 *   cleanup();
 */

export interface StarfieldConfig {
  /** The canvas element to draw on. */
  canvas: HTMLCanvasElement;
  /** Number of stars to generate. Default: 200 */
  starCount?: number;
  /** Amplitude of opacity oscillation. Default: 0.3 */
  twinkleAmount?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

/** Star colors: white, warm (Betelgeuse), cool (Rigel), off-white */
const STAR_COLORS = ["#ffffff", "#ffe4c4", "#cae1ff", "#fff5ee"];

/**
 * Three depth layers create a parallax-like sense of depth.
 * Far stars are small/dim, near stars are large/bright.
 */
const LAYERS = [
  { fraction: 0.55, minSize: 0.3, maxSize: 0.8, baseOpacity: 0.3, speedBase: 0.01 },
  { fraction: 0.30, minSize: 0.5, maxSize: 1.2, baseOpacity: 0.5, speedBase: 0.02 },
  { fraction: 0.15, minSize: 1.0, maxSize: 2.5, baseOpacity: 0.7, speedBase: 0.03 },
];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (const layer of LAYERS) {
    const layerCount = Math.round(count * layer.fraction);
    for (let i = 0; i < layerCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: rand(layer.minSize, layer.maxSize),
        baseOpacity: layer.baseOpacity + rand(-0.1, 0.1),
        twinkleSpeed: layer.speedBase * rand(0.5, 1.5),
        twinklePhase: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
  }
  return stars;
}

function drawStar(ctx: CanvasRenderingContext2D, star: Star, opacity: number): void {
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.fillStyle = star.color;

  // Large stars get a soft glow halo
  if (star.size > 1.0) {
    const gradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.size * 3,
    );
    gradient.addColorStop(0, star.color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
    ctx.fill();
    // Draw the crisp core on top
    ctx.fillStyle = star.color;
  }

  ctx.beginPath();
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Initialize an animated starfield on the given canvas.
 *
 * @returns A cleanup function that stops the animation and removes listeners.
 */
export function initStarfield(config: StarfieldConfig): () => void {
  const { canvas, starCount = 200, twinkleAmount = 0.3 } = config;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let logicalWidth = 0;
  let logicalHeight = 0;
  let stars: Star[] = [];
  let animationId = 0;
  let running = false;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    logicalWidth = rect.width;
    logicalHeight = rect.height;

    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = generateStars(starCount, logicalWidth, logicalHeight);

    // If static mode, draw once after resize
    if (!running) {
      renderFrame(0);
    }
  }

  function renderFrame(timeSec: number): void {
    ctx!.clearRect(0, 0, logicalWidth, logicalHeight);

    for (const star of stars) {
      const twinkle = Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase);
      const opacity = star.baseOpacity + twinkle * twinkleAmount;
      drawStar(ctx!, star, opacity);
    }
  }

  function animate(timestamp: number): void {
    renderFrame(timestamp / 1000);
    if (running) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function start(): void {
    if (running) return;
    running = true;
    animationId = requestAnimationFrame(animate);
  }

  function stop(): void {
    running = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = 0;
    }
  }

  // Initialize
  resize();

  if (prefersReducedMotion) {
    // Draw a single static frame — no animation loop
    renderFrame(0);
  } else {
    start();
  }

  // Listen for resize
  const handleResize = (): void => resize();
  window.addEventListener("resize", handleResize);

  // Return cleanup function
  return () => {
    stop();
    window.removeEventListener("resize", handleResize);
  };
}
```

**Step 2: Export from `index.ts`**

Add this line to `packages/runtime/src/index.ts`, after the existing exports (after line 37):

```typescript
export { initStarfield } from "./starfield";
export type { StarfieldConfig } from "./starfield";
```

**Step 3: Run typecheck**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/runtime typecheck`

Expected: No errors.

**Step 4: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/runtime/src/starfield.ts packages/runtime/src/index.ts
git commit -m "feat(runtime): add starfield module for cosmic atmosphere

Animated canvas background with 200 stars in 3 depth layers. Features:
- Sinusoidal twinkle with per-star phase offset
- HiDPI canvas scaling (devicePixelRatio)
- Soft glow halos on near stars
- Static mode when prefers-reduced-motion: reduce
- Returns cleanup function for proper teardown

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Update `demo-shell.css` with Starfield Support

**What you'll learn:** The starfield canvas needs to sit *behind* all demo content at `z-index: 0`, covering the entire viewport. The demo content sits at `z-index: 1`. This is accomplished with `position: fixed` on the canvas (pinned to the viewport) and `position: relative` on the content wrapper (creates a new stacking context above the canvas). The key CSS trick is that `position: relative` + `z-index: 1` lifts the entire content tree above the fixed canvas.

**Files:**
- Modify: `packages/theme/styles/demo-shell.css` (add starfield canvas rules + ensure panels are translucent)

**Step 1: Add starfield canvas rules**

Add at the top of `packages/theme/styles/demo-shell.css`, before the `.cp-demo` rule:

```css
/* --- Starfield canvas (sits behind all demo content) --- */
.cp-starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}
```

**Step 2: Add `position: relative` and `z-index: 1` to `.cp-demo`**

In the existing `.cp-demo` rule (line 1), add these two properties:

```css
  position: relative;
  z-index: 1;
```

**Step 3: Run the build to verify nothing breaks**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm build`

Expected: Build succeeds.

**Step 4: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add packages/theme/styles/demo-shell.css
git commit -m "feat(theme): add starfield canvas CSS + z-index layering

Starfield canvas is position:fixed behind content (z:0). Demo content
is position:relative above it (z:1). Panels with translucent backgrounds
allow the starfield to bleed through, creating depth.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Add the `stub-demo.css` Import for Animations

**What you'll learn:** The shared demo CSS import chain (`stub-demo.css`) is the single entry point that every demo's `style.css` imports. By adding `animations.css` to this chain, every demo automatically gets all animation keyframes without needing to import them individually. This is the "single source of truth" principle — one change propagates everywhere.

**Files:**
- Modify: `apps/demos/src/shared/stub-demo.css` (add animations import)

**Step 1: Read the current file**

Read `apps/demos/src/shared/stub-demo.css` to see the current import chain.

**Step 2: Add the animations import**

Add this line after the existing imports:

```css
@import "@cosmic/theme/styles/animations.css";
```

**Step 3: Run the build**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm build`

Expected: Build succeeds.

**Step 4: Commit**

```bash
cd /Users/anna/Teaching/cosmic-playground
git add apps/demos/src/shared/stub-demo.css
git commit -m "feat(demos): add animations.css to shared import chain

Every demo now inherits all animation keyframes (pulse, glow-pulse,
value-flash, etc.) and the reduced-motion override automatically.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Verify Full Build + All Tests Pass

**What you'll learn:** The final verification step catches integration issues — a token might pass its own test but break a downstream import. Running the full build and typecheck across the entire monorepo is the only way to confirm nothing is broken.

**Step 1: Run all theme tests**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C packages/theme test`

Expected: All tests PASS (including new glow, celestial, instrument accent, readout, animation tests).

**Step 2: Run full monorepo typecheck**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -r typecheck`

Expected: No type errors.

**Step 3: Run full build**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm build`

Expected: Build succeeds for all packages and apps.

**Step 4: Verify legacy demos are untouched**

Run: `cd /Users/anna/Teaching/astr101-sp26 && git status`

Expected: No changes (clean working tree, or only unrelated changes). If any files in `demos/` show as modified, **STOP and investigate**.

**Step 5: Final commit (if any cleanup needed)**

If any small fixes were required during verification, commit them with:
```bash
git commit -m "fix: address integration issues from design system foundation"
```

---

## Summary of Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `packages/theme/styles/tokens.css` | Modified | Added glow system, celestial palette, instrument accents, readout typography |
| `packages/theme/styles/layer-instrument.css` | Overhauled | Vivid accents, translucent panels, readout styling, celestial utilities |
| `packages/theme/styles/animations.css` | Created | Shared keyframe animations + reduced-motion |
| `packages/theme/styles/demo-shell.css` | Modified | Starfield canvas CSS + z-index layering |
| `packages/theme/src/vars.ts` | Modified | TS token mappings for new CSS variables |
| `packages/theme/src/tokens.test.ts` | Modified | Tests for all new token categories |
| `packages/runtime/src/starfield.ts` | Created | Animated starfield module |
| `packages/runtime/src/index.ts` | Modified | Export starfield |
| `apps/demos/src/shared/stub-demo.css` | Modified | Add animations import |
