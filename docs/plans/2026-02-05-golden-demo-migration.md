# Golden Demo Migration (Moon Phases) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the moon-phases demo to use all Phase 1 design system tokens, establishing the golden reference template for all future demo migrations.

**Architecture:** This plan enforces a contract-driven approach — we write failing tests first that assert design system invariants (e.g., "no legacy color tokens in SVG markup"), then modify HTML/CSS/TS to satisfy those contracts. The result is a demo that is visually atmospheric (starfield, translucent panels, celestial glows) AND programmatically verifiable.

**Tech Stack:** HTML, CSS (custom properties cascade), TypeScript, Vitest (contract tests), `@cosmic/runtime` (starfield module)

**Pre-requisites:** Phase 1 complete (commit `8545e31`). All 30 token tests passing. Starfield module exported from `@cosmic/runtime`.

---

## Audit Summary: What Needs to Change

| Area | Current (Broken) | Target (Contract) |
|------|------------------|--------------------|
| Sun color | `var(--cp-warning)` | `var(--cp-celestial-sun)` |
| Earth color | `var(--cp-accent2)` | `var(--cp-celestial-earth)` |
| Moon lit | `var(--cp-text)` / `var(--cp-muted)` | `var(--cp-celestial-moon)` |
| Moon dark | `var(--cp-bg3)` | `var(--cp-celestial-moon-dark)` |
| Orbit path | `var(--cp-border)` | `var(--cp-celestial-orbit)` |
| Starfield | Missing entirely | `<canvas class="cp-starfield">` + `initStarfield()` |
| Panel BGs | Opaque `var(--cp-bg1)` | Translucent `rgba()` + `backdrop-filter` |
| Readout units | Inline in text | Separated `<span class="cp-readout__unit">` |
| Timeline active | `var(--cp-warning)` | `var(--cp-accent-amber)` |
| Sky markers | `var(--cp-accent2)` / `var(--cp-warning)` | Celestial tokens |

---

### Task 1: Write Contract Tests for Celestial Token Usage

**Why:** Contract-driven development — the test defines the invariant before we touch any demo code. Every future demo migration will reuse this test pattern.

**Files:**
- Create: `apps/demos/src/demos/moon-phases/design-contracts.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Moon Phases
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 *
 * Invariants:
 *   1. SVG celestial objects MUST use --cp-celestial-* tokens (not legacy)
 *   2. A starfield canvas MUST exist in the HTML
 *   3. Readout values MUST separate units into .cp-readout__unit spans
 *   4. Demo-specific panels MUST use translucent backgrounds
 */

describe("Moon Phases — Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("SVG sun elements use --cp-celestial-sun, not --cp-warning", () => {
      // sunGlow gradient and sunlight arrows must use celestial token
      const sunGlowSection = html.match(/<radialGradient id="sunGlow"[\s\S]*?<\/radialGradient>/);
      expect(sunGlowSection).not.toBeNull();
      expect(sunGlowSection![0]).toContain("--cp-celestial-sun");
      expect(sunGlowSection![0]).not.toContain("--cp-warning");
    });

    it("SVG earth elements use --cp-celestial-earth, not --cp-accent2", () => {
      const earthGradient = html.match(/<radialGradient id="earthGradient"[\s\S]*?<\/radialGradient>/);
      expect(earthGradient).not.toBeNull();
      expect(earthGradient![0]).toContain("--cp-celestial-earth");
      expect(earthGradient![0]).not.toContain("--cp-accent2");
    });

    it("SVG moon-dark uses --cp-celestial-moon-dark, not --cp-bg3", () => {
      const moonDark = html.match(/<circle id="moon-dark"[^>]*>/);
      expect(moonDark).not.toBeNull();
      expect(moonDark![0]).toContain("--cp-celestial-moon-dark");
      expect(moonDark![0]).not.toContain("--cp-bg3");
    });

    it("SVG moon-lit gradient uses --cp-celestial-moon", () => {
      const moonLit = html.match(/<radialGradient id="moonLit"[\s\S]*?<\/radialGradient>/);
      expect(moonLit).not.toBeNull();
      expect(moonLit![0]).toContain("--cp-celestial-moon");
    });

    it("orbit path uses --cp-celestial-orbit, not --cp-border", () => {
      // The dashed orbit circle around Earth
      const orbitCircle = html.match(/<circle[^>]*stroke-dasharray="4 4"[^>]*>/);
      expect(orbitCircle).not.toBeNull();
      expect(orbitCircle![0]).toContain("--cp-celestial-orbit");
      expect(orbitCircle![0]).not.toContain("--cp-border");
    });

    it("sunlight arrows use --cp-celestial-sun, not --cp-warning", () => {
      const sunlightGroup = html.match(/<g id="sunlight-arrows"[\s\S]*?<\/g>/);
      expect(sunlightGroup).not.toBeNull();
      expect(sunlightGroup![0]).toContain("--cp-celestial-sun");
      expect(sunlightGroup![0]).not.toContain("--cp-warning");
    });

    it("no legacy --cp-warning tokens remain in SVG gradients", () => {
      // Extract all SVG defs content
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-warning");
    });

    it("no legacy --cp-accent2 tokens remain in SVG gradients", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-accent2");
    });
  });

  describe("Starfield invariant", () => {
    it("demo HTML contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      // Readouts that display units should have separate unit spans
      // "Phase angle alpha" has unit (deg) → needs cp-readout__unit
      // "Illumination fraction f" is dimensionless → no unit needed
      // "Illuminated (%)" has unit (%) → needs cp-readout__unit
      // "Days since new" has unit (d) → needs cp-readout__unit
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Panel translucency", () => {
    it("demo CSS uses translucent backgrounds for viz panels", () => {
      expect(css).toMatch(/\.viz-panel[\s\S]*?background:\s*rgba\(/);
    });

    it("demo CSS uses backdrop-filter for viz panels", () => {
      expect(css).toMatch(/\.viz-panel[\s\S]*?backdrop-filter/);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("timeline active state does not use --cp-warning", () => {
      expect(css).not.toMatch(/\.timeline-phase\.active[\s\S]*?--cp-warning/);
    });

    it("sky markers do not use --cp-accent2", () => {
      expect(html).not.toMatch(/<circle id="sky-rise-marker"[^>]*--cp-accent2/);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/moon-phases/design-contracts.test.ts`

Expected: Multiple FAIL — the demo currently uses legacy tokens everywhere.

**Step 3: Commit the failing tests**

```bash
git add apps/demos/src/demos/moon-phases/design-contracts.test.ts
git commit -m "test(moon-phases): add design system contract tests (RED)

Contract tests assert hard invariants:
- Celestial objects use --cp-celestial-* tokens
- Starfield canvas exists
- Readout units separated into .cp-readout__unit spans
- Panels use translucent backgrounds
- No legacy token leakage

All tests expected to FAIL until demo is migrated."
```

---

### Task 2: Add Starfield Canvas to Demo HTML

**Why:** The starfield is the atmospheric foundation that makes translucent panels and celestial glows visually coherent. Without it, the panels float on a flat black void.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html` (add canvas element)
- Modify: `apps/demos/src/demos/moon-phases/main.ts` (import + call initStarfield)

**Step 1: Add canvas element to HTML**

In `index.html`, immediately after `<body>`, BEFORE the `<div id="cp-demo">`, add:

```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

**Step 2: Import and initialize starfield in main.ts**

At the top of `main.ts`, add to the import from `@cosmic/runtime`:

```typescript
import {
  ChallengeEngine,
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initStarfield,
  setLiveRegionText
} from "@cosmic/runtime";
```

At the bottom of `main.ts`, after `initMath(document);`, add:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
```

**Step 3: Verify starfield contract test passes**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/moon-phases/design-contracts.test.ts -t "starfield"`

Expected: PASS for "demo HTML contains a starfield canvas element"

**Step 4: Commit**

```bash
git add apps/demos/src/demos/moon-phases/index.html apps/demos/src/demos/moon-phases/main.ts
git commit -m "feat(moon-phases): add starfield canvas background

Adds animated twinkling starfield behind all demo panels,
establishing the cosmic atmosphere that makes translucent
panels and celestial glows visually coherent."
```

---

### Task 3: Migrate SVG Gradients to Celestial Tokens

**Why:** This is the core token migration — every celestial body in every demo MUST use `--cp-celestial-*` tokens. This task replaces all 10+ legacy color references in the SVG markup.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html`

**Step 1: Replace sun gradient tokens**

In `index.html`, find the `<radialGradient id="sunGlow">` and replace `var(--cp-warning)` with `var(--cp-celestial-sun)`:

```html
<radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stop-color="var(--cp-celestial-sun-core)" />
  <stop offset="60%" stop-color="var(--cp-celestial-sun)" stop-opacity="0.6" />
  <stop offset="100%" stop-color="var(--cp-celestial-sun)" stop-opacity="0" />
</radialGradient>
```

**Step 2: Replace earth gradient tokens**

Find `<radialGradient id="earthGradient">` and replace:

```html
<radialGradient id="earthGradient" cx="30%" cy="30%">
  <stop offset="0%" stop-color="var(--cp-celestial-earth)" />
  <stop offset="100%" stop-color="var(--cp-celestial-earth-land)" />
</radialGradient>
```

**Step 3: Replace moon gradient tokens**

Find `<radialGradient id="moonLit">` and replace:

```html
<radialGradient id="moonLit" cx="30%" cy="30%">
  <stop offset="0%" stop-color="var(--cp-celestial-moon)" />
  <stop offset="100%" stop-color="var(--cp-celestial-moon-dark)" />
</radialGradient>
```

**Step 4: Replace moon-dark circle fill**

Find `<circle id="moon-dark"` and change `fill="var(--cp-bg3)"` to `fill="var(--cp-celestial-moon-dark)"`.

**Step 5: Replace sunlight arrows**

In the `<g id="sunlight-arrows">` group, replace all `stroke="var(--cp-warning)"` and `fill="var(--cp-warning)"` with `stroke="var(--cp-celestial-sun)"` and `fill="var(--cp-celestial-sun)"`.

**Step 6: Replace orbit path**

Find the dashed orbit circle and replace `stroke="var(--cp-border)"` with `stroke="var(--cp-celestial-orbit)"`.

**Step 7: Replace view indicator**

Find `<g id="view-indicator">` and replace `var(--cp-accent2)` with `var(--cp-celestial-earth)` (the "Your view" indicator points down from Earth's perspective).

**Step 8: Replace sky view markers**

Find `<circle id="sky-rise-marker"` and change `fill="var(--cp-accent2)"` to `fill="var(--cp-celestial-earth)"`.
Find `<circle id="sky-set-marker"` and change `fill="var(--cp-warning)"` to `fill="var(--cp-celestial-sun)"`.

**Step 9: Replace earth shadow text**

In `<g id="earth-shadow-group">`, replace `fill="var(--cp-warning)"` with `fill="var(--cp-celestial-sun)"` on the "Earth's Shadow" labels.

**Step 10: Replace phase-view moon surface gradient**

Find `<radialGradient id="moonSurface">` and replace:

```html
<radialGradient id="moonSurface" cx="30%" cy="30%">
  <stop offset="0%" stop-color="var(--cp-celestial-moon)" />
  <stop offset="100%" stop-color="var(--cp-celestial-moon-dark)" />
</radialGradient>
```

**Step 11: Run contract tests**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/moon-phases/design-contracts.test.ts -t "Celestial token"`

Expected: ALL celestial token tests PASS.

**Step 12: Commit**

```bash
git add apps/demos/src/demos/moon-phases/index.html
git commit -m "feat(moon-phases): migrate all SVG colors to celestial tokens

Replaces 10+ legacy token references (--cp-warning, --cp-accent2,
--cp-bg3, --cp-text/muted) with semantic celestial tokens
(--cp-celestial-sun, --cp-celestial-earth, --cp-celestial-moon, etc.).

Single source of truth: every celestial color now flows from tokens.css."
```

---

### Task 4: Separate Readout Units into Dedicated Spans

**Why:** The readout typography hierarchy (label → value → unit) requires each piece in its own element. This enables the amber-value / ice-blue-unit visual pattern from the legacy demos. Dimensional readouts get `<span class="cp-readout__unit">`, dimensionless readouts (like phase name) don't.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html` (readout markup)
- Modify: `apps/demos/src/demos/moon-phases/main.ts` (update readout text setting)

**Step 1: Update readout HTML markup**

For each readout that has a physical unit, restructure the label to remove the unit from the label text, and add a `<span class="cp-readout__unit">` inside the value div.

The readouts and their units:

| Readout | Label (new) | Unit span |
|---------|-------------|-----------|
| Phase name | Phase name | (none — categorical) |
| Phase angle | Phase angle α | `<span class="cp-readout__unit">deg</span>` |
| Illumination fraction | Illumination fraction f | (none — dimensionless) |
| Illuminated | Illuminated | `<span class="cp-readout__unit">%</span>` |
| Days since new | Days since new | `<span class="cp-readout__unit">d</span>` |
| Waxing/Waning | Waxing / Waning | (none — categorical) |
| Moon rise time | Moon rise | `<span class="cp-readout__unit">LST</span>` |
| Moon set time | Moon set | `<span class="cp-readout__unit">LST</span>` |
| Rise/set status | Rise / set status | (none — text) |

Update the HTML readout blocks. Example for phase angle:

```html
<div class="cp-readout">
  <div class="cp-readout__label">Phase angle α</div>
  <div class="cp-readout__value"><span id="angleReadout">0</span><span class="cp-readout__unit">deg</span></div>
</div>
```

Example for illuminated:

```html
<div class="cp-readout">
  <div class="cp-readout__label">Illuminated</div>
  <div class="cp-readout__value"><span id="illumination">100</span><span class="cp-readout__unit">%</span></div>
</div>
```

Example for days since new:

```html
<div class="cp-readout">
  <div class="cp-readout__label">Days since new</div>
  <div class="cp-readout__value"><span id="days-since-new">14.8</span><span class="cp-readout__unit">d</span></div>
</div>
```

Example for rise/set times:

```html
<div class="cp-readout">
  <div class="cp-readout__label">Moon rise</div>
  <div class="cp-readout__value"><span id="rise-time">--:--</span><span class="cp-readout__unit">LST</span></div>
</div>
```

**Step 2: Update main.ts readout text**

In `updateReadouts()`, the illumination percent line currently sets `illumPercentEl.textContent = String(Math.round(illum * 100));` — remove the "%" since it's now in the unit span. Similarly verify `daysSinceNewEl`, `riseTimeEl`, `setTimeEl` don't append units.

Check: `illumPercentEl.textContent` currently sets `String(Math.round(illum * 100))` — this is already without `%`. But the initial HTML says `100%` — remove the `%` from the initial value to just `100`.

**Step 3: Run contract tests**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/moon-phases/design-contracts.test.ts -t "unit separation"`

Expected: PASS for "readout values with units use .cp-readout__unit spans"

**Step 4: Commit**

```bash
git add apps/demos/src/demos/moon-phases/index.html apps/demos/src/demos/moon-phases/main.ts
git commit -m "feat(moon-phases): separate readout units into dedicated spans

Readout values now follow the label→value→unit typography hierarchy:
- Labels: uppercase muted text (0.75rem)
- Values: large amber monospace (1.5rem, tabular-nums)
- Units: ice-blue accent (0.875rem)

This enables the instrument-panel aesthetic from legacy demos."
```

---

### Task 5: Make Demo Panels Translucent

**Why:** The instrument layer's signature look is panels that float over the starfield with a frosted-glass effect. Without translucency, the starfield is invisible behind the panels and the cosmic atmosphere is lost.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/style.css`

**Step 1: Add translucent backgrounds to viz panels**

Replace the `.viz-panel` background rule:

```css
.viz-panel {
  background: rgba(23, 27, 34, 0.88);
  border: 1px solid rgba(109, 119, 148, 0.25);
  border-radius: 12px;
  padding: var(--cp-space-3);
  display: grid;
  gap: var(--cp-space-2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Step 2: Make timeline panel translucent**

```css
.timeline-panel {
  background: rgba(23, 27, 34, 0.88);
  border: 1px solid rgba(109, 119, 148, 0.25);
  border-radius: 12px;
  padding: var(--cp-space-3);
  margin-bottom: var(--cp-space-4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Step 3: Make sky-view panel translucent**

```css
.sky-view-panel {
  background: rgba(23, 27, 34, 0.88);
  border: 1px solid rgba(109, 119, 148, 0.25);
  border-radius: 12px;
  padding: var(--cp-space-3);
  margin-bottom: var(--cp-space-4);
  display: grid;
  gap: var(--cp-space-2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Step 4: Make animation controls translucent**

```css
.animation-controls {
  display: flex;
  align-items: center;
  gap: var(--cp-space-2);
  padding: var(--cp-space-3);
  background: rgba(23, 27, 34, 0.88);
  border: 1px solid rgba(109, 119, 148, 0.25);
  border-radius: 12px;
  flex-wrap: wrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Step 5: Make advanced controls translucent**

```css
.advanced-controls {
  display: grid;
  gap: var(--cp-space-2);
  padding: var(--cp-space-2);
  border: 1px solid rgba(109, 119, 148, 0.25);
  border-radius: 12px;
  background: rgba(23, 27, 34, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Step 6: Run contract tests**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/moon-phases/design-contracts.test.ts -t "translucency"`

Expected: PASS for panel translucency tests.

**Step 7: Commit**

```bash
git add apps/demos/src/demos/moon-phases/style.css
git commit -m "feat(moon-phases): make all panels translucent over starfield

Panels now use rgba(23, 27, 34, 0.88) + backdrop-filter: blur(8px)
for frosted-glass effect. Stars twinkle through panel edges,
establishing the cosmic atmosphere."
```

---

### Task 6: Migrate Timeline and UI CSS to Design System Tokens

**Why:** Removes the last legacy token references from the demo CSS, ensuring every color in the demo flows from `tokens.css`.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/style.css`

**Step 1: Replace timeline active state colors**

Change `.timeline-phase.active` from `--cp-warning` to `--cp-accent-amber`:

```css
.timeline-phase.active {
  background: color-mix(in srgb, var(--cp-accent-amber) 18%, transparent);
  border-color: color-mix(in srgb, var(--cp-accent-amber) 60%, var(--cp-border));
}
```

And `.timeline-phase.active span`:

```css
.timeline-phase.active span {
  color: var(--cp-accent-amber);
}
```

**Step 2: Replace waning timeline direction color**

Change `.timeline-direction.waning` from `--cp-accent2` to `--cp-violet`:

```css
.timeline-direction.waning {
  color: var(--cp-violet);
}
```

**Step 3: Replace phase button active state**

Change `.phase-btn.active` to use the accent (already correct — uses `--cp-accent`). No change needed.

**Step 4: Run contract tests**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/moon-phases/design-contracts.test.ts -t "legacy token"`

Expected: PASS for "timeline active state does not use --cp-warning"

**Step 5: Commit**

```bash
git add apps/demos/src/demos/moon-phases/style.css
git commit -m "feat(moon-phases): replace all legacy token refs in demo CSS

Timeline active states now use --cp-accent-amber instead of
--cp-warning. Waning direction uses --cp-violet instead of
--cp-accent2. Zero legacy tokens remain in the demo."
```

---

### Task 7: Add Celestial Glow Effects to SVG Objects

**Why:** Celestial objects should emit light — the sun needs a warm glow, the moon needs a subtle glow. This is what makes the legacy demos feel "alive" vs the flat current implementation.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html` (SVG filter defs)
- Modify: `apps/demos/src/demos/moon-phases/style.css` (glow CSS for SVG elements)

**Step 1: Add SVG glow filters to defs**

Inside the `<defs>` of `#orbital-svg`, add glow filters:

```html
<filter id="sun-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
  <feMerge>
    <feMergeNode in="blur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

**Step 2: Apply glow to sun circle**

On the sun glow circle `<circle cx="-60" cy="200" r="80" fill="url(#sunGlow)" ...>`, add `filter="url(#sun-glow-filter)"`.

**Step 3: Add CSS glow to Earth**

In `style.css`, add:

```css
#earth-group circle {
  filter: drop-shadow(var(--cp-glow-planet));
}
```

**Step 4: Commit**

```bash
git add apps/demos/src/demos/moon-phases/index.html apps/demos/src/demos/moon-phases/style.css
git commit -m "feat(moon-phases): add celestial glow effects to SVG objects

Sun gets Gaussian blur glow filter, Earth gets drop-shadow
using --cp-glow-planet token. Celestial objects now emit light
rather than sitting flat on the canvas."
```

---

### Task 8: Add Entry Animations to Panels

**Why:** Panels should slide in subtly when the page loads, not just appear. The `cp-slide-up` animation from Phase 1 handles this. Respects `prefers-reduced-motion` automatically via the global override in `animations.css`.

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/style.css`

**Step 1: Add staggered entry animations**

```css
.cp-demo__controls {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
}

.cp-demo__stage {
  animation: cp-fade-in var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 1);
}

.cp-demo__readouts {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 2);
}

.cp-demo__drawer {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 3);
}
```

**Step 2: Commit**

```bash
git add apps/demos/src/demos/moon-phases/style.css
git commit -m "feat(moon-phases): add staggered entry animations to panels

Controls, stage, readouts, and drawer panels animate in with
cp-slide-up/cp-fade-in. Staggered by 50ms intervals.
Automatically disabled for prefers-reduced-motion users."
```

---

### Task 9: Full Verification — Tests, Types, Build

**Why:** Final gate before declaring the golden demo complete. Every test must pass, every type must check, the full build must succeed, and legacy demos must be untouched.

**Files:** (none created — verification only)

**Step 1: Run all moon-phases tests**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos test -- --run`

Expected: ALL tests pass (design contracts + existing unit tests).

**Step 2: Run typecheck**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm -C apps/demos typecheck`

Expected: 0 errors.

**Step 3: Run full build**

Run: `cd /Users/anna/Teaching/cosmic-playground && corepack pnpm build`

Expected: Build succeeds.

**Step 4: Verify legacy untouched**

Run: `git diff HEAD -- ~/Teaching/astr101-sp26/` (should show nothing — different repo).

Also verify no files outside `apps/demos/src/demos/moon-phases/` were modified in this phase:

Run: `git diff 8545e31..HEAD --name-only`

Expected: Only files in `apps/demos/src/demos/moon-phases/` changed.

**Step 5: Commit docs update**

```bash
git add docs/plans/2026-02-05-golden-demo-migration.md
git commit -m "docs: add Phase 2 golden demo migration plan"
```

---

## Summary of Contracts Established

After Phase 2 is complete, these hard invariants hold for the moon-phases demo and serve as the template for all future migrations:

1. **Celestial Token Contract**: Every SVG celestial body uses `--cp-celestial-*` tokens. No `--cp-warning`, `--cp-accent2`, `--cp-bg3` in SVG markup.
2. **Starfield Contract**: Every instrument-layer demo has `<canvas class="cp-starfield">` + `initStarfield()`.
3. **Readout Typography Contract**: Units are separated into `.cp-readout__unit` spans. Values are amber monospace. Units are ice-blue.
4. **Panel Translucency Contract**: All demo-specific panels use `rgba()` backgrounds + `backdrop-filter: blur(8px)`.
5. **Token Purity Contract**: Zero legacy token references (`--cp-warning`, `--cp-accent2`) in demo CSS.
6. **Celestial Glow Contract**: Sun, Earth, and Moon have appropriate glow effects using design system glow tokens.
7. **Motion Contract**: Entry animations use `cp-slide-up`/`cp-fade-in` with stagger. All respect `prefers-reduced-motion`.
