# Parallax Distance — Full Migration + Hardening Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the parallax-distance demo to the contract-driven design system with full 4-layer testing (physics, design contracts, logic unit tests, Playwright E2E).

**Architecture:** The demo already has working physics (`@cosmic/physics`), HTML shell, CSS, and main.ts with SVG-based diagram rendering. We need to: (1) add starfield + entry animations, (2) replace all legacy tokens with semantic celestial/instrument tokens, (3) separate readout units into `.cp-readout__unit` spans, (4) extract pure logic to `logic.ts`, (5) write all 4 test layers. Pattern follows the angular-size golden reference exactly.

**Tech Stack:** TypeScript, Vitest, Playwright, CSS custom properties, SVG

---

## Task 1: Verify existing physics model test coverage

**Files:**
- Read: `packages/physics/src/parallaxDistanceModel.ts`
- Read: `packages/physics/src/parallaxDistanceModel.test.ts`

**Step 1: Run existing physics tests**

Run: `corepack pnpm -C packages/physics test -- --run --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|parallax)"`
Expected: All 4 existing tests PASS (parsec definition, mas convenience, limiting behavior, unit conversion)

**Step 2: Add inverse round-trip + negative-input edge-case tests**

Add these tests to `packages/physics/src/parallaxDistanceModel.test.ts`:

```typescript
test("round-trip: arcsec -> pc -> arcsec", () => {
  const p = 0.25;
  const d = ParallaxDistanceModel.distanceParsecFromParallaxArcsec(p);
  const pBack = ParallaxDistanceModel.parallaxArcsecFromDistanceParsec(d);
  expect(pBack).toBeCloseTo(p, 12);
});

test("round-trip: mas -> pc -> mas", () => {
  const pMas = 42.5;
  const d = ParallaxDistanceModel.distanceParsecFromParallaxMas(pMas);
  const pBack = ParallaxDistanceModel.parallaxMasFromDistanceParsec(d);
  expect(pBack).toBeCloseTo(pMas, 10);
});

test("round-trip: pc -> ly -> pc", () => {
  const dPc = 8.7;
  const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
  const dPcBack = ParallaxDistanceModel.distanceParsecFromLy(dLy);
  expect(dPcBack).toBeCloseTo(dPc, 10);
});

test("inverse functions return Infinity for non-positive input", () => {
  expect(ParallaxDistanceModel.parallaxArcsecFromDistanceParsec(0)).toBe(Infinity);
  expect(ParallaxDistanceModel.parallaxArcsecFromDistanceParsec(-5)).toBe(Infinity);
  expect(ParallaxDistanceModel.parallaxMasFromDistanceParsec(0)).toBe(Infinity);
  expect(ParallaxDistanceModel.parallaxMasFromDistanceParsec(-1)).toBe(Infinity);
});

test("negative parallax returns Infinity distance", () => {
  expect(ParallaxDistanceModel.distanceParsecFromParallaxArcsec(-0.1)).toBe(Infinity);
  expect(ParallaxDistanceModel.distanceParsecFromParallaxMas(-50)).toBe(Infinity);
});

test("known star: Proxima Centauri (p=768.5 mas -> d~1.30 pc)", () => {
  const d = ParallaxDistanceModel.distanceParsecFromParallaxMas(768.5);
  expect(d).toBeCloseTo(1.301, 2);
});
```

**Step 3: Run tests to verify they pass**

Run: `corepack pnpm -C packages/physics test -- --run --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|parallax|Tests)"`
Expected: All 10 tests PASS (4 existing + 6 new)

**Step 4: Commit**

```bash
git add packages/physics/src/parallaxDistanceModel.test.ts
git commit -m "test(physics): add round-trip and edge-case tests for parallax-distance model"
```

---

## Task 2: Write design contract tests (RED phase)

**Files:**
- Create: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`
- Read (reference): `apps/demos/src/demos/angular-size/design-contracts.test.ts`

**Step 1: Create design-contracts.test.ts**

This file reads `index.html`, `style.css`, and `main.ts` as strings and asserts design system invariants. Adapted from angular-size's contracts for parallax-distance's SVG elements (earth circles, star circle, rays, arc — no radialGradient defs, these use CSS classes).

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Parallax Distance
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 *
 * Invariants:
 *   1. SVG celestial objects MUST use --cp-celestial-* tokens (not legacy)
 *   2. A starfield canvas MUST exist in the HTML
 *   3. Readout values MUST separate units into .cp-readout__unit spans
 *   4. No hardcoded rgba() color literals in CSS (use tokens)
 *   5. Entry animations MUST use cp-slide-up / cp-fade-in
 *   6. main.ts must import initStarfield and call it
 *   7. Physics must come from @cosmic/physics only
 */

describe("Parallax Distance -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("earth circles use --cp-celestial-earth, not --cp-accent3 or --cp-accent", () => {
      expect(css).toMatch(/\.stage__earth[\s\S]*?--cp-celestial-earth/);
      expect(css).not.toMatch(/\.stage__earth[\s\S]*?--cp-accent3/);
    });

    it("star uses --cp-celestial-star, not --cp-warning", () => {
      expect(css).toMatch(/\.stage__star[\s\S]*?--cp-celestial-star/);
      expect(css).not.toMatch(/\.stage__star[\s\S]*?--cp-warning/);
    });

    it("arc uses --cp-accent-amber or celestial token, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__arc[\s\S]*?--cp-warning/);
    });

    it("rays use --cp-celestial-orbit or semantic token, not --cp-accent3", () => {
      expect(css).not.toMatch(/\.stage__ray[\s\S]*?--cp-accent3/);
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
      // parallax has arcsec unit, distance has pc and ly units, SNR is dimensionless
      // At minimum: arcsec, pc, ly = 3 unit spans
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:arcsec|pc|ly|mas)\)/.test(l));
      expect(parenthesizedUnits.length).toBe(0);
    });
  });

  describe("Panel translucency", () => {
    it("stage SVG container uses backdrop-filter", () => {
      expect(css).toMatch(/backdrop-filter/);
    });
  });

  describe("No legacy token leakage in CSS", () => {
    it("no --cp-warning tokens remain in demo CSS", () => {
      expect(css).not.toContain("--cp-warning");
    });

    it("no --cp-accent2 or --cp-accent3 aliases remain in CSS", () => {
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("no --cp-accent2 or --cp-accent3 aliases remain in HTML", () => {
      expect(html).not.toContain("--cp-accent2");
      expect(html).not.toContain("--cp-accent3");
    });
  });

  describe("Entry animations", () => {
    it("demo shell sections have entry animations", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
    });
  });

  describe("Color literal absence", () => {
    it("CSS has no hardcoded rgba() color literals (outside color-mix)", () => {
      const lines = css.split("\n");
      const violations = lines.filter((line) => {
        if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
        if (/rgba\s*\(/.test(line) && !line.includes("color-mix")) return true;
        return false;
      });
      expect(violations).toEqual([]);
    });

    it("CSS has no hardcoded hex color values", () => {
      const lines = css.split("\n");
      const violations = lines.filter((line) => {
        if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
        return /#[0-9a-fA-F]{3,8}\b/.test(line);
      });
      expect(violations).toEqual([]);
    });
  });

  describe("Starfield initialization", () => {
    it("main.ts imports and calls initStarfield", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain("initStarfield");
      expect(mainTs).toMatch(/initStarfield\s*\(/);
    });
  });

  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics, not inline", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain('from "@cosmic/physics"');
      // Should NOT define its own parallax function
      expect(mainTs).not.toMatch(/function\s+distanceParsec/);
    });
  });
});
```

**Step 2: Run tests to verify they FAIL (RED)**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts 2>&1 | tail -30`
Expected: Multiple failures — missing starfield canvas, legacy tokens still present, no entry animations, readout units not separated. This is expected (RED phase).

**Step 3: Commit the RED tests**

```bash
git add apps/demos/src/demos/parallax-distance/design-contracts.test.ts
git commit -m "test(parallax-distance): add design contract tests (RED -- all expected to fail)"
```

---

## Task 3: Add starfield canvas to HTML + initStarfield() in main.ts

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`

**Step 1: Add canvas element to index.html**

Insert immediately after the opening `<div id="cp-demo" ...>` tag (before the `<aside class="cp-demo__controls">`):

```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

**Step 2: Add initStarfield import and call in main.ts**

Add `initStarfield` to the existing `@cosmic/runtime` import line:

```typescript
import { createDemoModes, createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
```

Add starfield initialization at the end of main.ts, before `initMath(document);`:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
```

**Step 3: Run the starfield contract test**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts 2>&1 | grep -E "(starfield|PASS|FAIL)"`
Expected: Starfield tests now PASS; other contract tests still FAIL.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/parallax-distance/index.html apps/demos/src/demos/parallax-distance/main.ts
git commit -m "feat(parallax-distance): add starfield canvas and initStarfield() call"
```

---

## Task 4: Replace legacy CSS tokens with semantic celestial/instrument tokens

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/style.css`

This is the largest CSS change. Replace every legacy token reference with the correct semantic token.

**Step 1: Replace `.stage__earth` (was `--cp-accent3` -> `--cp-celestial-earth`)**

Replace the earth styling:

```css
.stage__earth {
  fill: color-mix(in srgb, var(--cp-bg0) 55%, transparent);
  stroke: color-mix(in srgb, var(--cp-celestial-earth) 65%, transparent);
  stroke-width: 2px;
  filter: drop-shadow(var(--cp-glow-planet));
}
```

**Step 2: Replace `.stage__star` (was `--cp-warning` -> `--cp-celestial-star`)**

```css
.stage__star {
  fill: var(--cp-celestial-star);
  filter: drop-shadow(var(--cp-glow-star));
}
```

**Step 3: Replace `.stage__ray` (was `--cp-accent3` -> `--cp-celestial-orbit`)**

```css
.stage__ray {
  stroke: color-mix(in srgb, var(--cp-celestial-orbit) 55%, transparent);
  stroke-width: 2px;
  stroke-linecap: round;
  opacity: 0.9;
}
```

**Step 4: Replace `.stage__arc` (was `--cp-warning` -> `--cp-accent-amber`)**

```css
.stage__arc {
  fill: none;
  stroke: var(--cp-accent-amber);
  stroke-opacity: 0.95;
  stroke-width: 3px;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cp-accent-amber) 18%, transparent));
}
```

**Step 5: Replace `.stage__label--angle` (was `--cp-warning` -> `--cp-accent-amber`)**

```css
.stage__label--angle {
  fill: color-mix(in srgb, var(--cp-accent-amber) 85%, var(--cp-text));
}
```

**Step 6: Run token contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts 2>&1 | grep -E "(legacy|warning|accent|PASS|FAIL)"`
Expected: Celestial token and legacy leakage tests now PASS.

**Step 7: Commit**

```bash
git add apps/demos/src/demos/parallax-distance/style.css
git commit -m "refactor(parallax-distance): replace legacy tokens with semantic celestial/instrument tokens"
```

---

## Task 5: Separate readout units into `.cp-readout__unit` spans

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`

**Step 1: Update the readout HTML**

Change the four readout blocks. Remove parenthesized units from labels, add `<span class="cp-readout__unit">` after value spans.

Parallax readout:
```html
<div class="cp-readout">
  <div class="cp-readout__label">Parallax $p$</div>
  <div class="cp-readout__value"><span id="parallaxArcsec"></span> <span class="cp-readout__unit">arcsec</span></div>
</div>
```

Distance (pc) readout:
```html
<div class="cp-readout">
  <div class="cp-readout__label">Distance $d$</div>
  <div class="cp-readout__value"><span id="distancePc"></span> <span class="cp-readout__unit">pc</span></div>
</div>
```

Distance (ly) readout:
```html
<div class="cp-readout">
  <div class="cp-readout__label">Distance $d$</div>
  <div class="cp-readout__value"><span id="distanceLy"></span> <span class="cp-readout__unit">ly</span></div>
</div>
```

SNR readout (dimensionless — no unit span needed):
```html
<div class="cp-readout">
  <div class="cp-readout__label">Signal-to-noise $p/\sigma_p$</div>
  <div class="cp-readout__value"><span id="snr"></span></div>
</div>
```

**Step 2: Run readout contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts 2>&1 | grep -E "(readout|unit|PASS|FAIL)"`
Expected: Readout unit separation tests now PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/parallax-distance/index.html
git commit -m "refactor(parallax-distance): separate readout units into .cp-readout__unit spans"
```

---

## Task 6: Add entry animations + backdrop-filter

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/style.css`

**Step 1: Add entry animation rules to CSS**

Add at the end of `style.css`:

```css
/* --- Entry animations --- */
.cp-demo__controls {
  animation: cp-slide-up var(--cp-transition-slow) var(--cp-ease-out) both;
}

.cp-demo__stage {
  animation: cp-fade-in var(--cp-transition-slow) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 1);
}

.cp-demo__readouts {
  animation: cp-slide-up var(--cp-transition-slow) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 2);
}

.cp-demo__drawer {
  animation: cp-fade-in var(--cp-transition-slow) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 3);
}
```

**Step 2: Add backdrop-filter to the stage SVG container**

Add `-webkit-backdrop-filter` and `backdrop-filter` to `.stage__svg`:

```css
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
```

**Step 3: Run animation + translucency contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts 2>&1 | grep -E "(animation|backdrop|translucen|PASS|FAIL)"`
Expected: Entry animation and panel translucency tests now PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/parallax-distance/style.css
git commit -m "feat(parallax-distance): add staggered entry animations and backdrop-filter"
```

---

## Task 7: Verify all design contract tests pass (GREEN)

**Files:**
- Read: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`

**Step 1: Run full contract test suite**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts 2>&1`
Expected: ALL tests pass (approximately 17 tests). If any still fail, debug and fix the specific CSS/HTML issue.

**Step 2: Run the build to check no-color-literals invariant**

Run: `corepack pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no color-literal violations.

**Step 3: Commit (only if fixes were needed)**

```bash
git add apps/demos/src/demos/parallax-distance/
git commit -m "fix(parallax-distance): fix remaining contract test failures"
```

---

## Task 8: Extract pure UI logic to logic.ts

**Files:**
- Create: `apps/demos/src/demos/parallax-distance/logic.ts`
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`

**Step 1: Create logic.ts with extracted pure functions**

Extract `clamp`, `formatNumber`, and add parallax-specific helpers:

```typescript
/**
 * Pure UI logic for the parallax-distance demo.
 * No DOM access -- all functions are testable in isolation.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

/**
 * Compute signal-to-noise ratio for a parallax measurement.
 * Returns Infinity if sigmaMas is non-positive.
 */
export function signalToNoise(parallaxMas: number, sigmaMas: number): number {
  if (!(sigmaMas > 0)) return Infinity;
  return parallaxMas / sigmaMas;
}

/**
 * Describe measurement quality as a human-readable string.
 * Thresholds based on Gaia DR3 typical precision (~0.02 mas for bright stars).
 */
export function describeMeasurability(snr: number): string {
  if (!Number.isFinite(snr) || snr <= 0) return "Not measurable";
  if (snr >= 20) return "Excellent";
  if (snr >= 5) return "Good";
  if (snr >= 3) return "Marginal";
  return "Poor";
}

/**
 * Compute the exaggerated half-angle for the parallax diagram.
 * Returns clamped value and whether clamping was applied.
 */
export function diagramHalfAngle(
  parallaxMas: number,
  exaggeration = 6000
): { halfAngle: number; clamped: boolean } {
  const pArcsec = parallaxMas / 1000;
  const pRad = (pArcsec * Math.PI) / (180 * 3600);
  const raw = pRad * exaggeration;
  const halfAngle = clamp(raw, 0.02, 0.34);
  return { halfAngle, clamped: raw > 0.34 || raw < 0.02 };
}

/**
 * Compute the star Y position for the diagram given the half-angle.
 * Returns { starY, clamped } where clamped is true if starY was pushed to 80.
 */
export function diagramStarY(
  baselineY: number,
  baselineLen: number,
  halfAngle: number
): { starY: number; clamped: boolean } {
  let starY = baselineY - (baselineLen / 2) / Math.tan(halfAngle);
  let clamped = false;
  if (starY < 80) {
    starY = 80;
    clamped = true;
  }
  return { starY, clamped };
}
```

**Step 2: Update main.ts to import from logic.ts**

Remove inline `clamp` and `formatNumber` definitions from main.ts. Add import:

```typescript
import { clamp, formatNumber, signalToNoise, diagramHalfAngle, diagramStarY } from "./logic";
```

Update `render()` to use `signalToNoise`:

```typescript
const snr = signalToNoise(inputs.parallaxMas, inputs.sigmaMas);
```

Update `renderDiagram()` to use `diagramHalfAngle` and `diagramStarY`:

```typescript
function renderDiagram(inputs: { parallaxMas: number }) {
  const viewW = 900;
  const viewH = 520;
  const cx = viewW / 2;
  const baselineY = 420;
  const baselineLen = 320;
  // ... (baseline + earth positioning unchanged) ...

  const { halfAngle } = diagramHalfAngle(inputs.parallaxMas);
  const { starY, clamped } = diagramStarY(baselineY, baselineLen, halfAngle);
  const starX = cx;

  // ... (rest of SVG attribute updates unchanged) ...

  clampNote.textContent = clamped
    ? "Note: star position is clamped for visibility (angle would be even smaller)."
    : "";
}
```

Similarly update `exportResults()` to use `signalToNoise`.

**Step 3: Verify demo still builds**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/parallax-distance/logic.ts apps/demos/src/demos/parallax-distance/main.ts
git commit -m "refactor(parallax-distance): extract pure UI logic to logic.ts (humble object pattern)"
```

---

## Task 9: Write unit tests for logic.ts

**Files:**
- Create: `apps/demos/src/demos/parallax-distance/logic.test.ts`

**Step 1: Create logic.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  signalToNoise,
  describeMeasurability,
  diagramHalfAngle,
  diagramStarY,
} from "./logic";

describe("Parallax Distance -- UI Logic", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max", () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });
    it("handles min === max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe("formatNumber", () => {
    it("formats normal numbers with default 2 digits", () => {
      expect(formatNumber(3.14159)).toBe("3.14");
    });
    it("formats with custom digit count", () => {
      expect(formatNumber(1.23456, 4)).toBe("1.2346");
    });
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity)).toBe("\u2014");
    });
    it("returns em-dash for -Infinity", () => {
      expect(formatNumber(-Infinity)).toBe("\u2014");
    });
  });

  describe("signalToNoise", () => {
    it("computes p/sigma for positive sigma", () => {
      expect(signalToNoise(100, 1)).toBe(100);
    });
    it("returns Infinity for zero sigma", () => {
      expect(signalToNoise(100, 0)).toBe(Infinity);
    });
    it("returns Infinity for negative sigma", () => {
      expect(signalToNoise(100, -1)).toBe(Infinity);
    });
    it("handles small parallax with large sigma", () => {
      expect(signalToNoise(0.5, 10)).toBeCloseTo(0.05, 10);
    });
  });

  describe("describeMeasurability", () => {
    it("returns Excellent for high SNR", () => {
      expect(describeMeasurability(25)).toBe("Excellent");
    });
    it("returns Good for moderate SNR", () => {
      expect(describeMeasurability(10)).toBe("Good");
    });
    it("returns Marginal for low SNR", () => {
      expect(describeMeasurability(4)).toBe("Marginal");
    });
    it("returns Poor for very low SNR", () => {
      expect(describeMeasurability(2)).toBe("Poor");
    });
    it("returns Not measurable for zero SNR", () => {
      expect(describeMeasurability(0)).toBe("Not measurable");
    });
    it("returns Not measurable for Infinity", () => {
      expect(describeMeasurability(Infinity)).toBe("Not measurable");
    });
  });

  describe("diagramHalfAngle", () => {
    it("returns clamped=false for mid-range parallax", () => {
      const { halfAngle, clamped } = diagramHalfAngle(100);
      expect(halfAngle).toBeGreaterThan(0.02);
      expect(halfAngle).toBeLessThan(0.34);
      expect(clamped).toBe(false);
    });
    it("clamps large parallax angles", () => {
      const { halfAngle, clamped } = diagramHalfAngle(1000);
      expect(halfAngle).toBe(0.34);
      expect(clamped).toBe(true);
    });
    it("clamps tiny parallax angles to minimum", () => {
      const { halfAngle, clamped } = diagramHalfAngle(1);
      expect(halfAngle).toBe(0.02);
      expect(clamped).toBe(true);
    });
  });

  describe("diagramStarY", () => {
    it("places star above baseline for reasonable angle", () => {
      const { starY, clamped } = diagramStarY(420, 320, 0.15);
      expect(starY).toBeLessThan(420);
      expect(starY).toBeGreaterThan(80);
      expect(clamped).toBe(false);
    });
    it("clamps starY to 80 for very small angles", () => {
      const { starY, clamped } = diagramStarY(420, 320, 0.02);
      expect(starY).toBe(80);
      expect(clamped).toBe(true);
    });
  });
});
```

**Step 2: Run tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts 2>&1`
Expected: All tests PASS (approximately 22 tests).

**Step 3: Commit**

```bash
git add apps/demos/src/demos/parallax-distance/logic.test.ts
git commit -m "test(parallax-distance): add unit tests for pure UI logic (SNR, formatting, diagram geometry)"
```

---

## Task 10: Run full demo test suite (design contracts + logic)

**Files:**
- Read results only

**Step 1: Run all parallax-distance Vitest tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/ 2>&1`
Expected: All tests PASS — both design-contracts.test.ts and logic.test.ts.

**Step 2: Run full project Vitest suite**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -5`
Expected: All demo tests pass (moon-phases + angular-size + parallax-distance + keplers-laws).

**Step 3: Run physics tests too**

Run: `corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5`
Expected: All 95+ physics tests pass.

---

## Task 11: Write Playwright E2E tests

**Files:**
- Create: `apps/site/tests/parallax-distance.spec.ts`
- Read (reference): `apps/site/tests/angular-size.spec.ts`

**Step 1: Create the E2E test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Parallax Distance -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/parallax-distance/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present and visible", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeVisible();
  });

  test("SVG stage has correct viewBox and accessible label", async ({ page }) => {
    const svg = page.locator("#diagram");
    await expect(svg).toHaveAttribute("viewBox", "0 0 900 520");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute(
      "aria-label",
      "Parallax triangle diagram with two observation points and a star"
    );
  });

  test("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("parallax-distance-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Slider Interaction ---

  test("parallax slider updates readouts when moved", async ({ page }) => {
    const before = await page.locator("#parallaxArcsec").textContent();
    await page.locator("#parallaxMas").fill("500");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const after = await page.locator("#parallaxArcsec").textContent();
    expect(after).not.toBe(before);
  });

  test("sigma slider updates sigma readout", async ({ page }) => {
    const before = await page.locator("#sigmaMasValue").textContent();
    await page.locator("#sigmaMas").fill("10");
    await page.locator("#sigmaMas").dispatchEvent("input");
    const after = await page.locator("#sigmaMasValue").textContent();
    expect(after).not.toBe(before);
  });

  test("moving parallax slider updates distance readouts inversely", async ({ page }) => {
    // Set parallax to 100 mas => d = 10 pc
    await page.locator("#parallaxMas").fill("100");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const dPc100 = await page.locator("#distancePc").textContent();

    // Set parallax to 10 mas => d = 100 pc
    await page.locator("#parallaxMas").fill("10");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const dPc10 = await page.locator("#distancePc").textContent();

    // Distance should be larger for smaller parallax
    expect(parseFloat(dPc10 ?? "0")).toBeGreaterThan(parseFloat(dPc100 ?? "0"));
  });

  // --- Preset Selection ---

  test("selecting a preset updates parallax slider", async ({ page }) => {
    // First ensure the preset dropdown has options
    const options = page.locator("#starPreset option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // at least Custom + one star

    // Select Proxima Centauri (first real star)
    await page.locator("#starPreset").selectOption({ index: 1 });
    const parallaxVal = await page.locator("#parallaxMas").inputValue();
    expect(parseInt(parallaxVal)).toBeGreaterThan(0);
  });

  test("manual slider movement clears preset to Custom", async ({ page }) => {
    // Select a preset first
    await page.locator("#starPreset").selectOption({ index: 1 });
    const presetBefore = await page.locator("#starPreset").inputValue();
    expect(presetBefore).not.toBe("");

    // Move slider manually
    await page.locator("#parallaxMas").fill("42");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const presetAfter = await page.locator("#starPreset").inputValue();
    expect(presetAfter).toBe("");
  });

  test("cycling through all presets does not produce errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    const options = page.locator("#starPreset option");
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      await page.locator("#starPreset").selectOption({ index: i });
      // Verify readouts update (not empty)
      const pArcsec = await page.locator("#parallaxArcsec").textContent();
      expect(pArcsec?.trim().length).toBeGreaterThan(0);
    }

    expect(errors).toEqual([]);
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // --- Accordion / Drawer ---

  test("What to notice accordion is open by default", async ({ page }) => {
    const firstAccordion = page.locator(".cp-accordion").first();
    await expect(firstAccordion).toHaveAttribute("open", "");
    await expect(firstAccordion).toContainText("What to notice");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
    await expect(modelNotes).toContainText("Model notes");
  });

  // --- Station Mode ---

  test("station mode button opens station dialog", async ({ page }) => {
    const stationBtn = page.locator("#stationMode");
    await expect(stationBtn).toBeVisible();
    await expect(stationBtn).toBeEnabled();
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Parallax Distance",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("parallax-distance-station.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Accessibility ---

  test("status region has aria-live for announcements", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("role", "status");
  });

  test("controls panel has accessible label", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
  });

  test("help button opens help modal", async ({ page }) => {
    const helpBtn = page.locator("#help");
    await expect(helpBtn).toBeVisible();
    await expect(helpBtn).toBeEnabled();
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
```

**Step 2: Build the site so demo assets are available**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Build succeeds, `apps/site/public/play/parallax-distance/` populated.

**Step 3: Run E2E tests (first run will create baseline screenshots)**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Parallax" --update-snapshots 2>&1 | tail -30`
Expected: All E2E tests pass, screenshot baselines created.

**Step 4: Commit**

```bash
git add apps/site/tests/parallax-distance.spec.ts apps/site/tests/*.png
git commit -m "test(parallax-distance): add Playwright E2E tests with visual regression screenshots"
```

---

## Task 12: Run all gates and final verification

**Files:**
- Read results only

**Step 1: Run physics tests**

Run: `corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5`
Expected: All pass.

**Step 2: Run all demo Vitest tests**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -5`
Expected: All pass (moon-phases + angular-size + parallax-distance + keplers-laws).

**Step 3: Run theme tests**

Run: `corepack pnpm -C packages/theme test -- --run 2>&1 | tail -5`
Expected: 30 tests pass.

**Step 4: Build everything**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Clean build.

**Step 5: Run typecheck**

Run: `corepack pnpm -C apps/site typecheck 2>&1 | tail -5`
Expected: No errors.

**Step 6: Run full E2E suite**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e 2>&1 | tail -30`
Expected: All E2E tests pass (angular-size + parallax-distance).

**Step 7: Update memory with new test counts**

Update MEMORY.md test counts:
- parallax-distance: ~17 contract + ~22 logic = ~39 tests
- Physics: 95 + 6 new = ~101 tests
- E2E: 25 (angular-size) + ~20 (parallax-distance) = ~45 tests
- Grand total: ~101 physics + ~111 demo + 30 theme + ~45 E2E = ~287 tests
