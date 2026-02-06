# Blackbody Radiation Migration + Hardening Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully migrate and harden the blackbody-radiation demo following the 4-layer testing protocol and 10-step migration pattern established by moon-phases, angular-size, parallax-distance, and seasons.

**Architecture:** The blackbody-radiation demo already has core HTML/CSS/TS structure and a working physics model (`@cosmic/physics`). This plan adds: (1) design contract tests, (2) starfield integration, (3) readout unit separation, (4) entry animations, (5) pure logic extraction with unit tests, (6) Playwright E2E tests with visual regression. All pure functions move to `logic.ts` (humble object pattern).

**Tech Stack:** TypeScript, Vitest, Playwright, CSS custom properties, Canvas 2D API, `@cosmic/physics`, `@cosmic/runtime`

---

## Task 1: Write design contract tests (RED)

**Files:**
- Create: `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts`

These tests will initially FAIL because starfield, readout units, and entry animations are not yet present.

**Step 1: Create the contract test file**

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Blackbody Radiation
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("Blackbody Radiation -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Starfield invariant", () => {
    it("demo HTML contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
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

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // peak wavelength (nm) + luminosity ratio (Lsun)
      expect(unitSpans.length).toBeGreaterThanOrEqual(2);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:nm|K)\)/.test(l));
      expect(parenthesizedUnits.length).toBe(0);
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

    it("no --cp-accent2, --cp-accent3, or --cp-warning in HTML", () => {
      expect(html).not.toContain("--cp-accent2");
      expect(html).not.toContain("--cp-accent3");
      expect(html).not.toContain("--cp-warning");
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

  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics, not inline", () => {
      const mainPath = path.resolve(__dirname, "main.ts");
      const mainTs = fs.readFileSync(mainPath, "utf-8");
      expect(mainTs).toContain('from "@cosmic/physics"');
      // Should not inline Planck's law
      expect(mainTs).not.toMatch(/function\s+planck/i);
    });

    it("canvas stage uses design-system tokens for background", () => {
      // The radial-gradient on the canvas should use token-based colors, not hardcoded hex/rgba
      expect(css).toMatch(/canvas[\s\S]*?background[\s\S]*?var\(--cp-/);
    });

    it("star preview circle uses token-based styling", () => {
      expect(css).toMatch(/star-preview__circle[\s\S]*?var\(--cp-/);
    });
  });

  describe("Celestial glow effects", () => {
    it("star preview circle has glow or box-shadow using tokens", () => {
      expect(css).toMatch(/star-preview__circle[\s\S]*?(?:box-shadow|filter)[\s\S]*?var\(--cp-/);
    });
  });

  describe("Instrument layer wrapper", () => {
    it("HTML has cp-layer-instrument class on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("HTML has triad shell layout", () => {
      expect(html).toContain('data-shell="triad"');
    });
  });
});
```

**Step 2: Run tests to verify initial state**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/design-contracts.test.ts
```

Expected: Some tests PASS (architecture compliance, no legacy tokens, color literals, instrument layer), some FAIL (starfield, readout units, entry animations). This is the RED phase.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts
git commit -m "test(blackbody-radiation): add design contract tests (RED phase)"
```

---

## Task 2: Add starfield canvas + initStarfield()

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/index.html` (add canvas before spectrumCanvas)
- Modify: `apps/demos/src/demos/blackbody-radiation/main.ts` (import + call initStarfield)

**Step 1: Add starfield canvas to index.html**

In `index.html`, inside the `<section class="cp-demo__stage ...">` element, add the starfield canvas **before** the spectrum canvas:

```html
<section class="cp-demo__stage cp-stage stage" aria-label="Spectrum visualization stage">
  <canvas class="cp-starfield" aria-hidden="true"></canvas>
  <canvas
    id="spectrumCanvas"
    role="img"
    aria-label="Blackbody spectrum curve showing relative intensity versus wavelength"
  ></canvas>
</section>
```

**Step 2: Import and call initStarfield in main.ts**

At the top of `main.ts`, add `initStarfield` to the runtime import:

```typescript
import { createDemoModes, createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
```

At the bottom of `main.ts`, after `initMath(document);`, add:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
```

**Step 3: Run contract tests to verify starfield tests now pass**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/design-contracts.test.ts
```

Expected: Starfield invariant + Starfield initialization tests now PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/index.html apps/demos/src/demos/blackbody-radiation/main.ts
git commit -m "feat(blackbody-radiation): add starfield canvas + initStarfield()"
```

---

## Task 3: Separate readout units into .cp-readout__unit spans

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/index.html`

**Step 1: Update readout HTML**

Change the readouts section. The key changes:
1. Remove `(nm)` from the peak wavelength label, add a `<span class="cp-readout__unit">nm</span>` inside the value div.
2. Remove `(same radius)` phrasing from luminosity ratio label, add a `<span class="cp-readout__unit">` for the unit indicator.

Replace the readouts panel body (lines 87-102) with:

```html
<div class="cp-panel-body">
  <div class="star-preview" aria-label="Star preview">
    <div id="starCircle" class="star-preview__circle" role="img" aria-label="Approximate star color"></div>
    <div class="star-preview__label">
      <span id="spectralClass"></span> · <span id="colorName"></span>
    </div>
  </div>
  <div class="cp-readout">
    <div class="cp-readout__label">Peak wavelength $\lambda_{\\rm peak}$</div>
    <div class="cp-readout__value">
      <span id="peakNm"></span>
      <span class="cp-readout__unit">nm</span>
    </div>
  </div>
  <div class="cp-readout">
    <div class="cp-readout__label">Luminosity ratio $L/L_{\\odot}$</div>
    <div class="cp-readout__value">
      <span id="lumRatio"></span>
      <span class="cp-readout__unit">L<sub>&#x2609;</sub></span>
    </div>
  </div>
</div>
```

**Step 2: Run contract tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/design-contracts.test.ts
```

Expected: Readout unit separation tests now PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/index.html
git commit -m "feat(blackbody-radiation): separate readout units into .cp-readout__unit spans"
```

---

## Task 4: Add staggered entry animations

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/style.css`

**Step 1: Add entry animation rules to style.css**

Add at the end of `style.css` (before the `@media` query):

```css
.cp-demo__controls {
  animation: cp-slide-up 0.6s var(--cp-ease-out);
}

.cp-demo__stage {
  animation: cp-fade-in 0.8s var(--cp-ease-out) 0.1s backwards;
}

.cp-demo__readouts {
  animation: cp-slide-up 0.6s var(--cp-ease-out) 0.2s backwards;
}

.cp-demo__drawer {
  animation: cp-fade-in 0.8s var(--cp-ease-out) 0.3s backwards;
}
```

**Step 2: Run contract tests to verify all pass**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/design-contracts.test.ts
```

Expected: ALL contract tests now PASS. Entry animation tests are GREEN.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/style.css
git commit -m "feat(blackbody-radiation): add staggered entry animations (cp-slide-up/cp-fade-in)"
```

---

## Task 5: Add celestial glow effect to star preview

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/style.css`

**Step 1: Enhance star preview with dynamic glow**

The star preview circle already has `box-shadow: var(--cp-card-glow)`. Enhance it to use a celestial glow token. Update the `.star-preview__circle` rule:

```css
.star-preview__circle {
  width: 84px;
  height: 84px;
  border-radius: 999px;
  border: 1px solid var(--cp-border);
  background: var(--cp-bg3);
  box-shadow: var(--cp-card-glow);
  filter: drop-shadow(var(--cp-glow-star));
}
```

**Step 2: Run contract tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/design-contracts.test.ts
```

Expected: All PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/style.css
git commit -m "feat(blackbody-radiation): add celestial glow drop-shadow to star preview"
```

---

## Task 6: Extract pure UI logic to logic.ts

**Files:**
- Create: `apps/demos/src/demos/blackbody-radiation/logic.ts`
- Modify: `apps/demos/src/demos/blackbody-radiation/main.ts`

**Step 1: Create logic.ts with pure functions extracted from main.ts**

The following pure functions move from `main.ts` to `logic.ts`:
- `clamp()`
- `logSliderToValue()`
- `valueToLogSlider()` (depends on `clamp`)
- `formatNumber()`
- `wavelengthDomainNm()`
- `sampleLogSpace()`

```typescript
/**
 * Pure UI logic for the blackbody-radiation demo.
 * No DOM access -- all functions are testable in isolation.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a 0-1000 slider position to a value on a log scale.
 * Used for the temperature slider which spans 2.725 K to 1e6 K.
 */
export function logSliderToValue(sliderVal: number, minVal: number, maxVal: number): number {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

/**
 * Convert a value back to a 0-1000 slider position on a log scale.
 * Inverse of logSliderToValue.
 */
export function valueToLogSlider(value: number, minVal: number, maxVal: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const frac = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(frac * 1000), 0, 1000);
}

/**
 * Format a number for display: scientific notation for very large/small,
 * fixed-point otherwise. Returns em-dash for non-finite values.
 */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

/**
 * Return the wavelength domain for the spectrum plot (in nm).
 * Wide enough to show peaks for both CMB (2.725 K) and hot stars.
 */
export function wavelengthDomainNm(): { minNm: number; maxNm: number } {
  return { minNm: 10, maxNm: 1e6 };
}

/**
 * Generate n logarithmically-spaced values between min and max.
 * Used for sampling the Planck curve across a wide wavelength range.
 */
export function sampleLogSpace(min: number, max: number, n: number): number[] {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push(Math.pow(10, minLog + t * (maxLog - minLog)));
  }
  return out;
}
```

**Step 2: Update main.ts to import from logic.ts**

Replace the inline function definitions in `main.ts` with imports:

```typescript
import { clamp, logSliderToValue, valueToLogSlider, formatNumber, wavelengthDomainNm, sampleLogSpace } from "./logic";
```

Remove the following function bodies from `main.ts` (lines 94-181):
- `clamp` (lines 94-96)
- `logSliderToValue` (lines 98-104)
- `valueToLogSlider` (lines 106-113)
- `formatNumber` (lines 115-121)
- `wavelengthDomainNm` (lines 167-170)
- `sampleLogSpace` (lines 172-181)

**Step 3: Verify build still works**

```bash
corepack pnpm build
```

Expected: Clean build, no type errors.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/logic.ts apps/demos/src/demos/blackbody-radiation/main.ts
git commit -m "refactor(blackbody-radiation): extract pure UI logic to logic.ts (humble object pattern)"
```

---

## Task 7: Write unit tests for logic.ts

**Files:**
- Create: `apps/demos/src/demos/blackbody-radiation/logic.test.ts`

**Step 1: Create comprehensive unit tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  wavelengthDomainNm,
  sampleLogSpace,
} from "./logic";

describe("Blackbody Radiation -- UI Logic", () => {
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

  describe("logSliderToValue", () => {
    const MIN = 2.725;
    const MAX = 1e6;

    it("slider 0 returns minVal", () => {
      const v = logSliderToValue(0, MIN, MAX);
      expect(v).toBeCloseTo(MIN, 2);
    });

    it("slider 1000 returns maxVal", () => {
      const v = logSliderToValue(1000, MIN, MAX);
      expect(v).toBeCloseTo(MAX, -2);
    });

    it("slider 500 returns geometric midpoint", () => {
      const v = logSliderToValue(500, MIN, MAX);
      const expected = Math.pow(10, (Math.log10(MIN) + Math.log10(MAX)) / 2);
      expect(v).toBeCloseTo(expected, 0);
    });

    it("slider values increase monotonically", () => {
      const a = logSliderToValue(200, MIN, MAX);
      const b = logSliderToValue(400, MIN, MAX);
      const c = logSliderToValue(800, MIN, MAX);
      expect(a).toBeLessThan(b);
      expect(b).toBeLessThan(c);
    });
  });

  describe("valueToLogSlider", () => {
    const MIN = 2.725;
    const MAX = 1e6;

    it("minVal returns slider 0", () => {
      expect(valueToLogSlider(MIN, MIN, MAX)).toBe(0);
    });

    it("maxVal returns slider 1000", () => {
      expect(valueToLogSlider(MAX, MIN, MAX)).toBe(1000);
    });

    it("returns 0 for non-finite input", () => {
      expect(valueToLogSlider(NaN, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(Infinity, MIN, MAX)).toBe(0);
    });

    it("returns 0 for zero or negative input", () => {
      expect(valueToLogSlider(0, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(-5, MIN, MAX)).toBe(0);
    });

    it("round-trips with logSliderToValue", () => {
      for (const slider of [0, 100, 500, 750, 1000]) {
        const value = logSliderToValue(slider, MIN, MAX);
        const back = valueToLogSlider(value, MIN, MAX);
        expect(back).toBe(slider);
      }
    });
  });

  describe("formatNumber", () => {
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
    });

    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity)).toBe("\u2014");
    });

    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("uses fixed-point for normal numbers", () => {
      expect(formatNumber(3.14159, 2)).toBe("3.14");
    });

    it("uses toFixed rounding", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });

    it("uses scientific notation for very large numbers", () => {
      expect(formatNumber(1.5e7, 3)).toBe("1.50e+7");
    });

    it("uses scientific notation for very small numbers", () => {
      expect(formatNumber(0.00005, 3)).toBe("5.00e-5");
    });

    it("defaults to 3 significant digits", () => {
      expect(formatNumber(42.1234)).toBe("42.123");
    });
  });

  describe("wavelengthDomainNm", () => {
    it("returns domain from 10 nm to 1e6 nm", () => {
      const { minNm, maxNm } = wavelengthDomainNm();
      expect(minNm).toBe(10);
      expect(maxNm).toBe(1e6);
    });
  });

  describe("sampleLogSpace", () => {
    it("returns array of correct length", () => {
      expect(sampleLogSpace(1, 1000, 4)).toHaveLength(4);
    });

    it("first element equals min", () => {
      const arr = sampleLogSpace(10, 10000, 100);
      expect(arr[0]).toBeCloseTo(10, 5);
    });

    it("last element equals max", () => {
      const arr = sampleLogSpace(10, 10000, 100);
      expect(arr[arr.length - 1]).toBeCloseTo(10000, 0);
    });

    it("values increase monotonically", () => {
      const arr = sampleLogSpace(1, 1e6, 50);
      for (let i = 1; i < arr.length; i++) {
        expect(arr[i]).toBeGreaterThan(arr[i - 1]);
      }
    });

    it("produces logarithmically spaced values (ratios equal)", () => {
      const arr = sampleLogSpace(10, 10000, 4);
      // 10, 100, 1000, 10000 -- each ratio should be 10
      const ratio1 = arr[1] / arr[0];
      const ratio2 = arr[2] / arr[1];
      const ratio3 = arr[3] / arr[2];
      expect(ratio1).toBeCloseTo(ratio2, 3);
      expect(ratio2).toBeCloseTo(ratio3, 3);
    });

    it("handles n=1 (returns [min])", () => {
      const arr = sampleLogSpace(42, 9999, 1);
      expect(arr).toHaveLength(1);
      expect(arr[0]).toBeCloseTo(42, 5);
    });
  });
});
```

**Step 2: Run tests to verify all pass**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/logic.test.ts
```

Expected: ALL PASS (~25 tests).

**Step 3: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/logic.test.ts
git commit -m "test(blackbody-radiation): add unit tests for pure UI logic (slider math, formatting, sampling)"
```

---

## Task 8: Write Playwright E2E tests

**Files:**
- Create: `apps/site/tests/blackbody-radiation.spec.ts`

**Prerequisite:** Build must succeed (`corepack pnpm build`) so the demo is available at `/play/blackbody-radiation/`.

**Step 1: Build the project**

```bash
corepack pnpm build
```

**Step 2: Create E2E test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Blackbody Radiation -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/blackbody-radiation/", { waitUntil: "domcontentloaded" });
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

  test("spectrum canvas is present and has accessible label", async ({ page }) => {
    const canvas = page.locator("#spectrumCanvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("role", "img");
  });

  test("screenshot: default state (Sun temperature)", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("blackbody-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Temperature Slider ---

  test("temperature slider updates readouts", async ({ page }) => {
    const before = await page.locator("#peakNm").textContent();
    await page.locator("#tempSlider").fill("200");
    await page.locator("#tempSlider").dispatchEvent("input");
    const after = await page.locator("#peakNm").textContent();
    expect(after).not.toBe(before);
  });

  test("temperature slider updates star color preview", async ({ page }) => {
    await page.locator("#tempSlider").fill("100");
    await page.locator("#tempSlider").dispatchEvent("input");
    const color1 = await page.locator("#starCircle").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    await page.locator("#tempSlider").fill("900");
    await page.locator("#tempSlider").dispatchEvent("input");
    const color2 = await page.locator("#starCircle").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    expect(color1).not.toBe(color2);
  });

  // --- Preset Buttons ---

  test("Sun preset sets temperature to 5772 K", async ({ page }) => {
    await page.locator('button.preset[data-temp-k="5772"]').click();
    const text = await page.locator("#tempValue").textContent();
    expect(text).toContain("5772");
  });

  test("CMB preset sets temperature to 2.725 K", async ({ page }) => {
    await page.locator('button.preset[data-temp-k="2.725"]').click();
    const text = await page.locator("#tempValue").textContent();
    expect(text).toContain("2.725");
  });

  test("screenshot: CMB preset", async ({ page }) => {
    await page.locator('button.preset[data-temp-k="2.725"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("blackbody-cmb.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Scale Toggle ---

  test("log/linear scale buttons toggle aria-pressed", async ({ page }) => {
    const logBtn = page.locator("#scaleLog");
    const linearBtn = page.locator("#scaleLinear");

    await expect(logBtn).toHaveAttribute("aria-pressed", "true");
    await expect(linearBtn).toHaveAttribute("aria-pressed", "false");

    await linearBtn.click();
    await expect(logBtn).toHaveAttribute("aria-pressed", "false");
    await expect(linearBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("screenshot: linear scale", async ({ page }) => {
    await page.locator("#scaleLinear").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("blackbody-linear.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Overlay Checkboxes ---

  test("visible band checkbox can be toggled", async ({ page }) => {
    const checkbox = page.locator("#showVisibleBand");
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("peak marker checkbox can be toggled", async ({ page }) => {
    const checkbox = page.locator("#showPeakMarker");
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(2);
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
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Blackbody Radiation",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("blackbody-station.png", {
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
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
```

**Step 3: Run E2E tests (first run generates baseline screenshots)**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Blackbody" --update-snapshots
```

**Step 4: Verify E2E tests pass on second run**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Blackbody"
```

Expected: ALL PASS (~22 tests).

**Step 5: Commit**

```bash
git add apps/site/tests/blackbody-radiation.spec.ts apps/site/tests/*.png
git commit -m "test(blackbody-radiation): add Playwright E2E tests with visual regression screenshots"
```

---

## Task 9: Run all gates and verify

**Step 1: Run physics tests**

```bash
corepack pnpm -C packages/physics test -- --run
```

Expected: All 111+ physics tests pass (including 5 blackbody tests).

**Step 2: Run all demo tests**

```bash
corepack pnpm -C apps/demos test -- --run
```

Expected: All demo tests pass (including new blackbody contract + logic tests).

**Step 3: Run theme tests**

```bash
corepack pnpm -C packages/theme test -- --run
```

Expected: 30 theme tests pass.

**Step 4: Full build**

```bash
corepack pnpm build
```

Expected: Clean build, no errors, no color-literal violations.

**Step 5: Typecheck**

```bash
corepack pnpm -C apps/site typecheck
```

Expected: Clean.

**Step 6: Run all E2E tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected: All E2E tests pass (existing 114 + new ~22 = ~136 total).

**Step 7: Final commit if any fixups needed, otherwise done**

No commit needed if all gates pass. If any fixups were required during gate-checking, commit them:

```bash
git commit -m "fix(blackbody-radiation): address gate failures from final verification"
```

---

## Task 10: Update memory with new test counts

After all gates pass, update MEMORY.md with:

- Phase 6: blackbody-radiation migration + hardening -- DONE
- New test counts: ~15 contract + ~25 logic + ~22 E2E tests
- Next demo: telescope-resolution (6th in migration order)
- Any new gotchas discovered during this migration

---

## Summary

| Layer | File | Expected Tests |
|-------|------|---------------|
| Physics | `packages/physics/src/blackbodyRadiationModel.test.ts` | 5 (existing) |
| Contract | `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts` | ~15 |
| Logic | `apps/demos/src/demos/blackbody-radiation/logic.test.ts` | ~25 |
| E2E | `apps/site/tests/blackbody-radiation.spec.ts` | ~22 |
| **Total new** | | **~62** |

**Expected commits:** 8-9 (one per task, following conventional commit format)
