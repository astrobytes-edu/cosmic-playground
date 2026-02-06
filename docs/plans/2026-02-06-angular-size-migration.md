# Angular Size Demo Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the angular-size demo to the contract-driven design system established by the moon-phases golden reference, making all colors flow from tokens.css.

**Architecture:** Copy the moon-phases design-contracts.test.ts pattern, adapt assertions for angular-size's specific SVG elements (observer, object, rays, angle arc, size indicator) and readouts (θ display, θ deg, D km, d km). The demo has a simpler celestial structure than moon-phases: one object circle with preset-driven gradient fills (sun, moon, planet, mars, galaxy, generic) plus measurement indicators (rays, arc, size line). No orbit paths or earth groups.

**Tech Stack:** Vitest (contract tests), CSS custom properties (design tokens), TypeScript, SVG, `@cosmic/runtime` (starfield)

---

### Task 1: Write Design Contract Tests (RED)

**Why:** Contract tests are the backbone of the design system. We write them first so they fail, then make them pass — this is TDD applied to visual design. Each test encodes an invariant that must hold for every instrument-layer demo.

**Files:**
- Create: `apps/demos/src/demos/angular-size/design-contracts.test.ts`

**Step 1: Write the contract test file**

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Angular Size
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
 *   5. No hardcoded rgba() color literals in CSS (use tokens)
 *   6. Entry animations MUST use cp-slide-up / cp-fade-in
 */

describe("Angular Size — Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("SVG sun gradient uses --cp-celestial-sun, not --cp-chart-4 or --cp-warning", () => {
      const sunGlow = html.match(/<radialGradient id="sunGlow"[\s\S]*?<\/radialGradient>/);
      expect(sunGlow).not.toBeNull();
      expect(sunGlow![0]).toContain("--cp-celestial-sun");
      expect(sunGlow![0]).not.toContain("--cp-chart-4");
      expect(sunGlow![0]).not.toContain("--cp-warning");
    });

    it("SVG moon gradient uses --cp-celestial-moon, not --cp-text", () => {
      const moonGlow = html.match(/<radialGradient id="moonGlow"[\s\S]*?<\/radialGradient>/);
      expect(moonGlow).not.toBeNull();
      expect(moonGlow![0]).toContain("--cp-celestial-moon");
      expect(moonGlow![0]).not.toContain("stop-color=\"var(--cp-text)\"");
    });

    it("SVG planet gradient uses --cp-celestial-earth, not --cp-chart-1", () => {
      const planetGlow = html.match(/<radialGradient id="planetGlow"[\s\S]*?<\/radialGradient>/);
      expect(planetGlow).not.toBeNull();
      expect(planetGlow![0]).toContain("--cp-celestial-earth");
      expect(planetGlow![0]).not.toContain("--cp-chart-1");
    });

    it("SVG mars gradient uses --cp-celestial-mars, not --cp-danger", () => {
      const marsGlow = html.match(/<radialGradient id="marsGlow"[\s\S]*?<\/radialGradient>/);
      expect(marsGlow).not.toBeNull();
      expect(marsGlow![0]).toContain("--cp-celestial-mars");
      expect(marsGlow![0]).not.toContain("--cp-danger");
    });

    it("no legacy --cp-chart-* tokens remain in SVG defs", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toMatch(/--cp-chart-[1-5]/);
    });

    it("no --cp-danger tokens remain in SVG defs", () => {
      const defs = html.match(/<defs>[\s\S]*?<\/defs>/g) || [];
      const allDefs = defs.join("\n");
      expect(allDefs).not.toContain("--cp-danger");
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
      // θ display has dynamic unit (deg/arcmin/arcsec) → needs cp-readout__unit
      // θ (deg) has unit (deg) → needs cp-readout__unit
      // D has unit (km) → needs cp-readout__unit
      // d has unit (km) → needs cp-readout__unit
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      // Labels like "Angular diameter θ (deg)" should become "Angular diameter θ"
      // with the unit in a separate span
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:deg|km|arcmin|arcsec)\)/.test(l));
      expect(parenthesizedUnits.length).toBe(0);
    });
  });

  describe("Panel translucency", () => {
    it("stage SVG container uses backdrop-filter", () => {
      // The stage area should participate in the frosted-glass aesthetic
      expect(css).toMatch(/backdrop-filter/);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("angle arc does not use --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__angleArc[\s\S]*?--cp-warning/);
    });

    it("size line does not use --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__sizeLine[\s\S]*?--cp-warning/);
    });

    it("no --cp-warning tokens remain in demo CSS", () => {
      expect(css).not.toContain("--cp-warning");
    });
  });

  describe("Entry animations", () => {
    it("demo shell sections have entry animations", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
    });
  });
});
```

**Step 2: Run tests to verify they fail (RED)**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts`

Expected: Multiple FAIL — the demo currently uses `--cp-chart-4`, `--cp-warning`, `--cp-danger`, has no starfield, has no unit spans, and has no entry animations. This confirms our tests correctly detect the issues.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/angular-size/design-contracts.test.ts
git commit -m "test(angular-size): add design contract tests (RED)

14 contract tests encoding instrument-layer invariants:
- Celestial tokens (no --cp-chart-*, --cp-danger, --cp-warning in SVG)
- Starfield canvas required
- Readout unit separation (.cp-readout__unit spans)
- Panel translucency (backdrop-filter)
- No legacy token leakage (--cp-warning)
- Entry animations (cp-slide-up / cp-fade-in)"
```

---

### Task 2: Add Starfield Canvas + initStarfield()

**Why:** Every instrument-layer demo must have a twinkling starfield behind the content. The starfield is a full-viewport `<canvas>` positioned behind everything via CSS `position: fixed; z-index: -1`. The `initStarfield()` function from `@cosmic/runtime` handles rendering 3 depth layers of stars with sinusoidal twinkle.

**Files:**
- Modify: `apps/demos/src/demos/angular-size/index.html` (add canvas element)
- Modify: `apps/demos/src/demos/angular-size/main.ts` (import + call initStarfield)

**Step 1: Add starfield canvas to HTML**

Add immediately after the opening `<body>` tag, before the `<div id="cp-demo">`:

```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

**Step 2: Import and call initStarfield in main.ts**

Add `initStarfield` to the existing `@cosmic/runtime` import:

```typescript
import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
```

Then at the end of the file, after `initMath(document);`, add:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>('.cp-starfield');
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
```

**Step 3: Run the starfield contract test**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts -t "starfield"`

Expected: PASS for "demo HTML contains a starfield canvas element"

**Step 4: Commit**

```bash
git add apps/demos/src/demos/angular-size/index.html apps/demos/src/demos/angular-size/main.ts
git commit -m "feat(angular-size): add starfield canvas + initStarfield

Adds the cp-starfield canvas behind all demo content.
Three depth layers of twinkling stars create the cosmic
atmosphere shared by all instrument-layer demos."
```

---

### Task 3: Migrate SVG Gradients to Celestial Tokens

**Why:** This is the core celestial token migration — every object in the SVG must use `--cp-celestial-*` tokens. The angular-size demo has 6 gradient definitions for different object types (sun, moon, planet, mars, galaxy, generic) that currently use legacy `--cp-chart-*`, `--cp-danger`, and `--cp-text` references.

**Files:**
- Modify: `apps/demos/src/demos/angular-size/index.html` (SVG defs)

**Step 1: Replace sunGlow gradient**

Find `<radialGradient id="sunGlow">` and replace:

```html
<radialGradient id="sunGlow">
  <stop offset="0%" stop-color="var(--cp-celestial-sun-core)" stop-opacity="0.98" />
  <stop offset="70%" stop-color="var(--cp-celestial-sun)" stop-opacity="0.88" />
  <stop offset="100%" stop-color="var(--cp-celestial-sun-corona)" stop-opacity="0.35" />
</radialGradient>
```

**Step 2: Replace moonGlow gradient**

```html
<radialGradient id="moonGlow" cx="30%" cy="30%">
  <stop offset="0%" stop-color="var(--cp-celestial-moon)" stop-opacity="0.98" />
  <stop offset="100%" stop-color="var(--cp-celestial-moon-dark)" stop-opacity="0.35" />
</radialGradient>
```

**Step 3: Replace planetGlow gradient**

```html
<radialGradient id="planetGlow" cx="35%" cy="35%">
  <stop offset="0%" stop-color="var(--cp-celestial-earth)" stop-opacity="0.95" />
  <stop offset="100%" stop-color="var(--cp-celestial-earth)" stop-opacity="0.25" />
</radialGradient>
```

**Step 4: Replace marsGlow gradient**

```html
<radialGradient id="marsGlow" cx="35%" cy="35%">
  <stop offset="0%" stop-color="var(--cp-celestial-mars)" stop-opacity="0.95" />
  <stop offset="100%" stop-color="var(--cp-celestial-mars)" stop-opacity="0.25" />
</radialGradient>
```

**Step 5: Replace galaxyGlow gradient**

The galaxy uses `--cp-chart-3` (violet). Map to `--cp-celestial-orbit` (which resolves to violet, perfect for deep-sky objects):

```html
<radialGradient id="galaxyGlow" cx="35%" cy="35%">
  <stop offset="0%" stop-color="var(--cp-celestial-orbit)" stop-opacity="0.92" />
  <stop offset="100%" stop-color="var(--cp-celestial-orbit)" stop-opacity="0.22" />
</radialGradient>
```

**Step 6: Replace objectGlow (generic) gradient**

```html
<radialGradient id="objectGlow" cx="40%" cy="30%">
  <stop offset="0%" stop-color="var(--cp-celestial-star)" stop-opacity="0.95" />
  <stop offset="100%" stop-color="var(--cp-celestial-star)" stop-opacity="0.3" />
</radialGradient>
```

**Step 7: Run celestial token tests**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts -t "Celestial"`

Expected: ALL 6 celestial token tests PASS.

**Step 8: Commit**

```bash
git add apps/demos/src/demos/angular-size/index.html
git commit -m "feat(angular-size): migrate SVG gradients to celestial tokens

Replaces 6 gradient defs: sunGlow, moonGlow, planetGlow, marsGlow,
galaxyGlow, objectGlow. Legacy --cp-chart-*, --cp-danger, --cp-text
replaced with semantic --cp-celestial-* tokens.

Single source of truth: every celestial color flows from tokens.css."
```

---

### Task 4: Separate Readout Units into Dedicated Spans

**Why:** The readout typography hierarchy requires units in `<span class="cp-readout__unit">` elements. This enables the amber-value / ice-blue-unit visual pattern: values render in amber monospace, units in ice-blue. Currently the angular-size demo embeds units in labels like "Angular diameter θ (deg)" or sets them dynamically in value text.

**Files:**
- Modify: `apps/demos/src/demos/angular-size/index.html` (readout markup)
- Modify: `apps/demos/src/demos/angular-size/main.ts` (readout value rendering)

**Step 1: Update readout HTML markup**

Replace the 4 readout blocks in the readouts panel:

```html
<div class="cp-readout">
  <div class="cp-readout__label">Angular diameter $\theta$</div>
  <div class="cp-readout__value"><span id="thetaDisplay"></span><span id="thetaDisplayUnit" class="cp-readout__unit"></span></div>
</div>
<div class="cp-readout">
  <div class="cp-readout__label">Angular diameter $\theta$</div>
  <div class="cp-readout__value"><span id="thetaDeg"></span><span class="cp-readout__unit">deg</span></div>
</div>
<div class="cp-readout">
  <div class="cp-readout__label">Diameter $D$</div>
  <div class="cp-readout__value"><span id="diameterKm"></span><span class="cp-readout__unit">km</span></div>
</div>
<div class="cp-readout">
  <div class="cp-readout__label">Distance $d$</div>
  <div class="cp-readout__value"><span id="distanceKm"></span><span class="cp-readout__unit">km</span></div>
</div>
```

Note: The first readout (θ display) has a dynamic unit that changes between deg/arcmin/arcsec, so it gets its own `<span id="thetaDisplayUnit">`.

**Step 2: Update main.ts to populate the dynamic unit span**

Add a new element query near the other readout elements:

```typescript
const thetaDisplayUnitEl = document.querySelector<HTMLSpanElement>("#thetaDisplayUnit");
```

Add it to the null check guard. Then in the `render()` function, change:

```typescript
// Before:
thetaDisplay.textContent = `${display.text} ${display.unit}`.trim();
thetaDeg.textContent = `${formatNumber(thetaDegValue, 6)} deg`;

// After:
thetaDisplay.textContent = display.text;
thetaDisplayUnit.textContent = display.unit;
thetaDeg.textContent = formatNumber(thetaDegValue, 6);
```

Also remove the appended units from `diameterKm` and `distanceKm`:

```typescript
// Before:
diameterKm.textContent = formatNumber(state.diameterKm, 6);
distanceKm.textContent = formatNumber(state.distanceKm, 6);

// After (no change needed — these already don't append units)
```

**Step 3: Run readout contract tests**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts -t "Readout"`

Expected: PASS for readout unit separation and label format tests.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/angular-size/index.html apps/demos/src/demos/angular-size/main.ts
git commit -m "feat(angular-size): separate readout units into dedicated spans

Readout labels no longer contain parenthesized units.
Units are now in .cp-readout__unit spans:
- θ display: dynamic unit (deg/arcmin/arcsec)
- θ deg: 'deg'
- D: 'km'
- d: 'km'

Enables amber-value / ice-blue-unit typography hierarchy."
```

---

### Task 5: Replace Legacy CSS Tokens (--cp-warning → semantic)

**Why:** The angle arc and size line currently use `--cp-warning` (a bright yellow status color) for measurement indicators. This should be `--cp-accent-amber` (the instrument panel accent). The `--cp-warning` token is for status messages, not visual design elements.

**Files:**
- Modify: `apps/demos/src/demos/angular-size/style.css`

**Step 1: Replace --cp-warning in angle arc**

In `.stage__angleArc`:
- `stroke: var(--cp-warning)` → `stroke: var(--cp-accent-amber)`
- `filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cp-warning) 18%, transparent))` → `filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cp-accent-amber) 18%, transparent))`

**Step 2: Replace --cp-warning in size line**

In `.stage__sizeLine`:
- `stroke: var(--cp-warning)` → `stroke: var(--cp-accent-amber)`
- `filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cp-warning) 12%, transparent))` → `filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cp-accent-amber) 12%, transparent))`

**Step 3: Run legacy token tests**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts -t "legacy"`

Expected: PASS for all 3 legacy token tests.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/angular-size/style.css
git commit -m "feat(angular-size): replace --cp-warning with --cp-accent-amber

Angle arc and size line measurement indicators now use the
instrument panel accent token instead of the status warning color.
Zero --cp-warning references remain in demo CSS."
```

---

### Task 6: Add Celestial Glow Effects to SVG Objects

**Why:** Celestial objects should emit light. The object circle currently has a generic `drop-shadow` using `--cp-text`. We should add proper glow that changes with the preset — the sun should glow warmly, planets should glow faintly blue.

**Files:**
- Modify: `apps/demos/src/demos/angular-size/style.css`

**Step 1: Update object glow to use design system token**

Replace the `.stage__object` filter:

```css
.stage__object {
  stroke: color-mix(in srgb, var(--cp-accent) 58%, transparent);
  stroke-width: 2px;
  filter: drop-shadow(var(--cp-glow-planet));
}
```

This uses the design system's planet glow token (30% opacity blue glow at 20px spread). The gradient fill already determines the object's color identity — the glow adds luminosity.

**Step 2: Add glow to angle arc**

The measurement arc should have a subtle amber glow to match its stroke. This is already handled by the `filter: drop-shadow(...)` in the rule from Task 5 — no additional change needed.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/angular-size/style.css
git commit -m "feat(angular-size): add celestial glow to SVG objects

Object circle now uses --cp-glow-planet token for consistent
glow effect. Stroke updated from --cp-accent3 to --cp-accent."
```

---

### Task 7: Add Entry Animations to Shell Sections

**Why:** Panels should slide in when the page loads, not just appear. The staggered animation pattern uses `cp-slide-up` for controls/readouts/drawer and `cp-fade-in` for the stage. The global `animations.css` handles `prefers-reduced-motion` automatically.

**Files:**
- Modify: `apps/demos/src/demos/angular-size/style.css`

**Step 1: Add staggered entry animations**

Add at the end of the CSS file (before the `@media` rules if any):

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

**Step 2: Run entry animation tests**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts -t "Entry"`

Expected: PASS for entry animation tests.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/angular-size/style.css
git commit -m "feat(angular-size): add staggered entry animations

Controls, stage, readouts, and drawer animate in with
cp-slide-up/cp-fade-in, staggered by 50ms intervals.
Automatically disabled for prefers-reduced-motion users."
```

---

### Task 8: Full Verification — All Tests, Types, Build

**Why:** Final gate before declaring the angular-size migration complete. Every test must pass, types must check, and the full build must succeed.

**Files:** (none created — verification only)

**Step 1: Run all angular-size contract tests**

Run: `corepack pnpm -C apps/demos test -- --run apps/demos/src/demos/angular-size/design-contracts.test.ts`

Expected: ALL tests PASS (14 contract tests GREEN).

**Step 2: Run all demo tests**

Run: `corepack pnpm -C apps/demos test -- --run`

Expected: ALL tests pass (angular-size + moon-phases + any others).

**Step 3: Run full build**

Run: `corepack pnpm build`

Expected: Build succeeds with no errors.

**Step 4: Run theme tests**

Run: `corepack pnpm -C packages/theme test -- --run`

Expected: 30 theme tests pass.

**Step 5: Verify no legacy demos modified**

Verify no files were changed in `~/Teaching/astr101-sp26/demos/`.

**Step 6: Final commit (if needed)**

If any adjustments were made during verification, commit them.

---

## Migration Inventory: angular-size

| Contract | Before | After |
|----------|--------|-------|
| **Celestial tokens** | `--cp-chart-4`, `--cp-chart-1`, `--cp-danger`, `--cp-text` in SVG | All `--cp-celestial-*` tokens |
| **Starfield** | No starfield canvas | `<canvas class="cp-starfield">` + `initStarfield()` |
| **Readout units** | Units in labels: "θ (deg)" | Separate `<span class="cp-readout__unit">` |
| **Panel translucency** | SVG bg uses CSS radial-gradient | Retained (creative choice) + backdrop-filter |
| **Legacy CSS tokens** | `--cp-warning` in angle arc + size line | `--cp-accent-amber` |
| **Celestial glows** | Generic `drop-shadow` with `--cp-text` | `--cp-glow-planet` token |
| **Entry animations** | None | `cp-slide-up` / `cp-fade-in` with stagger |
