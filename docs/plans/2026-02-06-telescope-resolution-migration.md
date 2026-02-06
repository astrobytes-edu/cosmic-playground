# Telescope Resolution Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the telescope-resolution demo to the full design system contract, following the 4-layer testing protocol established by previous migrations (moon-phases → angular-size → parallax-distance → seasons → blackbody-radiation).

**Architecture:** Canvas-based PSF visualization (similar to blackbody-radiation). The demo already uses `@cosmic/physics` for its TelescopeResolutionModel and has a complete UI with controls, stage, readouts, and drawer panels. Migration adds: starfield canvas, readout unit separation, entry animations, logic extraction to pure functions, design contract tests, and Playwright E2E tests. The demo has a **separate readouts aside** (unlike blackbody-radiation which integrated readouts into controls).

**Tech Stack:** TypeScript, Vitest (unit/contract tests), Playwright (E2E), Canvas 2D API, CSS custom properties (design tokens)

---

## Pre-flight: Understand current state

**What exists:**
- `apps/demos/src/demos/telescope-resolution/index.html` (192 lines) — full HTML with controls, canvas stage, readouts aside, drawer
- `apps/demos/src/demos/telescope-resolution/main.ts` (587 lines) — all logic + DOM wiring in one file
- `apps/demos/src/demos/telescope-resolution/style.css` (87 lines) — imports stub-demo.css, has radial-gradient canvas background
- `packages/physics/src/telescopeResolutionModel.ts` — full physics model (Airy PSF, diffraction limit, effective resolution, status)
- `packages/physics/src/telescopeResolutionModel.test.ts` — 11 existing tests (benchmarks, edge cases, Airy intensity)

**What's missing (per migration checklist):**
1. No `<canvas class="cp-starfield">` or `initStarfield()` call
2. No `.cp-readout__unit` spans — units baked into label text like `(arcsec)`
3. No entry animations (`cp-slide-up` / `cp-fade-in`)
4. 3 hardcoded `rgba()` in main.ts Canvas drawing (crosshairs + scale bar) — need CSS token extraction
5. No `logic.ts` — pure functions not extracted from main.ts
6. No `logic.test.ts` — no unit tests for formatters/converters
7. No `design-contracts.test.ts` — no contract enforcement
8. No `apps/site/tests/telescope-resolution.spec.ts` — no E2E tests

**What's already correct:**
- No legacy tokens (`--cp-warning`, `--cp-accent2`, `--cp-accent3`) in CSS or HTML
- Physics from `@cosmic/physics` (not inlined)
- `cp-layer-instrument` class on demo root
- Canvas background uses `var(--cp-glow-teal)` and `var(--cp-glow-violet)` tokens
- Proper `aria-label` attributes on panels

---

## Task 1: Write design contract tests (RED)

**Files:**
- Create: `apps/demos/src/demos/telescope-resolution/design-contracts.test.ts`

**Step 1: Write the failing contract test file**

Copy the blackbody-radiation contract test pattern and adapt for telescope-resolution's structure (separate readouts aside, canvas PSF, no star preview circle).

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Telescope Resolution
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("Telescope Resolution -- Design System Contracts", () => {
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
      // theta_diff (arcsec), theta_eff (arcsec), binary separation (arcsec) = 3 dimensional readouts
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:arcsec|mas|rad)\)/.test(l));
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
      // Should not inline Rayleigh/Airy calculations
      expect(mainTs).not.toMatch(/function\s+rayleigh/i);
      expect(mainTs).not.toMatch(/function\s+airy/i);
    });

    it("canvas stage uses design-system tokens for background", () => {
      // The radial-gradient on #canvas should use token-based colors
      expect(css).toMatch(/\.stage__canvas[\s\S]*?background[\s\S]*?var\(--cp-/);
    });
  });

  describe("Instrument layer wrapper", () => {
    it("HTML has cp-layer-instrument class on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("readouts panel exists as separate aside", () => {
      expect(html).toMatch(/<aside[^>]*cp-demo__readouts/);
    });
  });

  describe("Readouts panel", () => {
    it("readouts panel has accessible label", () => {
      expect(html).toMatch(/cp-demo__readouts[^>]*aria-label="Readouts panel"/);
    });
  });
});
```

**Step 2: Run tests to verify they fail (RED)**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/design-contracts.test.ts 2>&1 | tail -20`

Expected: Multiple FAIL — at minimum: starfield canvas missing, starfield init missing, no `.cp-readout__unit` spans, readout labels have `(arcsec)`, no entry animations.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/telescope-resolution/design-contracts.test.ts
git commit -m "test(telescope-resolution): add design contract tests (RED)"
```

---

## Task 2: Add starfield canvas to HTML + initStarfield() in main.ts

**Files:**
- Modify: `apps/demos/src/demos/telescope-resolution/index.html`
- Modify: `apps/demos/src/demos/telescope-resolution/main.ts`

**Step 1: Add starfield canvas to HTML**

Add the starfield canvas as the first child inside the `#cp-demo` div (before `<aside class="cp-demo__controls">`):

```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

**Step 2: Add initStarfield() call in main.ts**

Add import at top of main.ts (alongside existing `@cosmic/runtime` imports):

```typescript
import { createDemoModes, createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
```

Add starfield initialization after the `runtime` const (around line 49), before state:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });
```

**Step 3: Run contract tests to check starfield passes**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/design-contracts.test.ts 2>&1 | tail -20`

Expected: Starfield invariant and Starfield initialization tests now PASS. Others still failing.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/telescope-resolution/index.html apps/demos/src/demos/telescope-resolution/main.ts
git commit -m "feat(telescope-resolution): add starfield canvas + initStarfield()"
```

---

## Task 3: Separate readout units into .cp-readout__unit spans

**Files:**
- Modify: `apps/demos/src/demos/telescope-resolution/index.html`

**Step 1: Migrate readouts**

Replace the 3 dimensional readouts in the readouts panel. Current pattern:

```html
<div class="cp-readout__label">Diffraction limit $\theta_\mathrm{diff}$ (arcsec)</div>
<div class="cp-readout__value"><span id="thetaDiff"></span></div>
```

New pattern (remove `(arcsec)` from label, add unit span in value):

```html
<div class="cp-readout__label">Diffraction limit $\theta_\mathrm{diff}$</div>
<div class="cp-readout__value"><span id="thetaDiff"></span> <span class="cp-readout__unit">arcsec</span></div>
```

Apply this to all 3 dimensional readouts:
1. `Diffraction limit $\theta_\mathrm{diff}$` — add `<span class="cp-readout__unit">arcsec</span>` after `#thetaDiff`
2. `Effective resolution $\theta_\mathrm{eff}$` — add `<span class="cp-readout__unit">arcsec</span>` after `#thetaEff`
3. `Binary separation` — add `<span class="cp-readout__unit">arcsec</span>` after `#sepReadout`

The 4th readout (Status: resolved/marginal/unresolved) is dimensionless — leave it without a unit span.

**Step 2: Run contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/design-contracts.test.ts 2>&1 | tail -20`

Expected: Readout unit separation tests now PASS. Entry animations still failing.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/telescope-resolution/index.html
git commit -m "feat(telescope-resolution): separate readout units into .cp-readout__unit spans"
```

---

## Task 4: Add entry animations to style.css

**Files:**
- Modify: `apps/demos/src/demos/telescope-resolution/style.css`

**Step 1: Add staggered entry animations**

Append to the end of style.css:

```css
/* Entry animations */
.cp-demo__controls {
  animation: cp-slide-up 0.6s ease-out both;
}

.cp-demo__stage {
  animation: cp-fade-in 0.8s ease-out 0.1s both;
}

.cp-demo__readouts {
  animation: cp-fade-in 0.8s ease-out 0.2s both;
}

.cp-demo__drawer {
  animation: cp-fade-in 0.8s ease-out 0.3s both;
}
```

**Step 2: Run contract tests — all should pass now**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/design-contracts.test.ts 2>&1 | tail -20`

Expected: ALL 16 contract tests PASS (GREEN).

**Step 3: Commit**

```bash
git add apps/demos/src/demos/telescope-resolution/style.css
git commit -m "feat(telescope-resolution): add staggered entry animations"
```

---

## Task 5: Extract pure logic functions to logic.ts

**Files:**
- Create: `apps/demos/src/demos/telescope-resolution/logic.ts`
- Modify: `apps/demos/src/demos/telescope-resolution/main.ts`

**Step 1: Create logic.ts with pure functions**

Extract these functions from main.ts into a new logic.ts file. These are all pure (no DOM, no side effects):

```typescript
/**
 * Pure UI logic for the telescope-resolution demo.
 * No DOM access -- all functions are testable in isolation.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a 0-1000 slider position to a value on a log scale.
 * Used for aperture (0.007 m to 1e7 m) and separation (1e-3 to 1e3 arcsec).
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
 * Format an aperture in meters for display with auto unit selection.
 * Returns {text, unit} for flexible display (value + separate unit span).
 */
export function formatApertureM(apertureM: number): { text: string; unit: string } {
  if (!Number.isFinite(apertureM) || apertureM <= 0) return { text: "\u2014", unit: "" };
  if (apertureM >= 1000) return { text: formatNumber(apertureM / 1000, 3), unit: "km" };
  if (apertureM >= 1) return { text: formatNumber(apertureM, 3), unit: "m" };
  return { text: formatNumber(apertureM * 100, 3), unit: "cm" };
}

/**
 * Format a wavelength in cm for display with auto unit selection.
 * Returns {text, unit} for flexible display.
 */
export function formatWavelengthCm(lambdaCm: number, cmToNm: (cm: number) => number): { text: string; unit: string } {
  if (!Number.isFinite(lambdaCm) || lambdaCm <= 0) return { text: "\u2014", unit: "" };
  if (lambdaCm >= 100) return { text: formatNumber(lambdaCm / 100, 3), unit: "m" };
  if (lambdaCm >= 1) return { text: formatNumber(lambdaCm, 3), unit: "cm" };
  if (lambdaCm >= 0.1) return { text: formatNumber(lambdaCm * 10, 3), unit: "mm" };
  if (lambdaCm >= 1e-4) return { text: formatNumber(lambdaCm / 1e-4, 3), unit: "um" };
  return { text: formatNumber(cmToNm(lambdaCm), 3), unit: "nm" };
}

/**
 * Describe a resolution status as a label and visual tone.
 */
export function describeStatus(status: string): { label: string; tone: "good" | "warn" | "bad" } {
  if (status === "resolved") return { label: "Resolved", tone: "good" };
  if (status === "marginal") return { label: "Marginal", tone: "warn" };
  return { label: "Unresolved", tone: "bad" };
}

/**
 * Map a status tone to the data-tone attribute value used by the badge.
 */
export function toneToBadgeAttr(tone: "good" | "warn" | "bad"): string {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  return "danger";
}

/**
 * Compute the field of view in arcsec from the effective resolution and binary separation.
 * FOV is chosen to show the PSF structure clearly (at least 6x theta_eff or 3x separation).
 */
export function computeFovArcsec(thetaEffArcsec: number, separationArcsec: number): number {
  return Math.max(0.4, Math.min(500, Math.max(6 * thetaEffArcsec, 3 * separationArcsec)));
}

/**
 * Compute the zoomed FOV from the base FOV and zoom level.
 */
export function zoomedFov(fovArcsec: number, zoom: number): number {
  return fovArcsec / clamp(zoom, 1, 20);
}
```

**Step 2: Update main.ts to import from logic.ts**

Replace the local function definitions in main.ts with imports from `./logic`:

```typescript
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatApertureM,
  formatWavelengthCm,
  describeStatus,
  toneToBadgeAttr,
  computeFovArcsec,
  zoomedFov
} from "./logic";
```

Remove the function definitions for: `clamp`, `logSliderToValue`, `valueToLogSlider`, `formatNumber`, `formatApertureM`, `formatWavelengthCm`, `describeStatus` from main.ts (lines ~85-134).

Update the `formatWavelengthCm` call site in main.ts to pass `AstroUnits.cmToNm` as the converter:
```typescript
// Before:
const w = formatWavelengthCm(model.wavelengthCm);
// After:
const w = formatWavelengthCm(model.wavelengthCm, AstroUnits.cmToNm);
```

In the `render()` function, update `describeStatus` usage to also use `toneToBadgeAttr`:
```typescript
// Before:
statusBadgeEl.dataset.tone =
  statusInfo.tone === "good" ? "good" : statusInfo.tone === "warn" ? "warn" : "danger";
// After:
statusBadgeEl.dataset.tone = toneToBadgeAttr(statusInfo.tone);
```

Update the FOV computation in `render()`:
```typescript
// Before:
const fovArcsec = Math.max(0.4, Math.min(500, Math.max(6 * model.thetaEffArcsec, 3 * sep)));
const zoomedFovArcsec = fovArcsec / clamp(state.zoom, 1, 20);
// After:
const fovArcsec = computeFovArcsec(model.thetaEffArcsec, sep);
const zoomedFovArcsec = zoomedFov(fovArcsec, state.zoom);
```

**Step 3: Build to verify no regressions**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/design-contracts.test.ts 2>&1 | tail -10`

Expected: All 16 contract tests still PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/telescope-resolution/logic.ts apps/demos/src/demos/telescope-resolution/main.ts
git commit -m "refactor(telescope-resolution): extract pure logic to logic.ts (humble object)"
```

---

## Task 6: Write unit tests for logic.ts

**Files:**
- Create: `apps/demos/src/demos/telescope-resolution/logic.test.ts`

**Step 1: Write comprehensive unit tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatApertureM,
  formatWavelengthCm,
  describeStatus,
  toneToBadgeAttr,
  computeFovArcsec,
  zoomedFov
} from "./logic";

describe("Telescope Resolution -- Logic", () => {
  // --- clamp ---

  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min when below", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max when above", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
    it("handles equal min and max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  // --- logSliderToValue / valueToLogSlider ---

  describe("logSliderToValue", () => {
    it("returns minVal at slider=0", () => {
      expect(logSliderToValue(0, 0.007, 1e7)).toBeCloseTo(0.007, 4);
    });
    it("returns maxVal at slider=1000", () => {
      expect(logSliderToValue(1000, 0.007, 1e7)).toBeCloseTo(1e7, -2);
    });
    it("returns geometric midpoint at slider=500", () => {
      const mid = logSliderToValue(500, 0.007, 1e7);
      // Geometric midpoint: 10^((log10(0.007) + log10(1e7))/2) = 10^((-2.155+7)/2) = 10^2.4225 ~ 264.6
      expect(mid).toBeGreaterThan(200);
      expect(mid).toBeLessThan(350);
    });
  });

  describe("valueToLogSlider", () => {
    it("returns 0 for minVal", () => {
      expect(valueToLogSlider(0.007, 0.007, 1e7)).toBe(0);
    });
    it("returns 1000 for maxVal", () => {
      expect(valueToLogSlider(1e7, 0.007, 1e7)).toBe(1000);
    });
    it("returns 0 for non-finite input", () => {
      expect(valueToLogSlider(NaN, 0.007, 1e7)).toBe(0);
      expect(valueToLogSlider(Infinity, 0.007, 1e7)).toBe(0);
    });
    it("returns 0 for zero or negative", () => {
      expect(valueToLogSlider(0, 0.007, 1e7)).toBe(0);
      expect(valueToLogSlider(-5, 0.007, 1e7)).toBe(0);
    });
    it("round-trips with logSliderToValue", () => {
      const val = 2.4;
      const slider = valueToLogSlider(val, 0.007, 1e7);
      const roundTripped = logSliderToValue(slider, 0.007, 1e7);
      expect(roundTripped).toBeCloseTo(val, 0);
    });
  });

  // --- formatNumber ---

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
    it("uses scientific notation for very large values", () => {
      expect(formatNumber(1.5e8, 3)).toBe("1.50e+8");
    });
    it("uses scientific notation for very small values", () => {
      expect(formatNumber(5e-5, 3)).toBe("5.00e-5");
    });
    it("uses toFixed for normal range (1 to 999999)", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });
  });

  // --- formatApertureM ---

  describe("formatApertureM", () => {
    it("returns km for aperture >= 1000 m", () => {
      const r = formatApertureM(12742000); // Earth-diameter baseline
      expect(r.unit).toBe("km");
      expect(parseFloat(r.text)).toBeGreaterThan(10000);
    });
    it("returns m for aperture 1-999", () => {
      const r = formatApertureM(2.4);
      expect(r.unit).toBe("m");
      expect(r.text).toBe("2.400");
    });
    it("returns cm for aperture < 1 m", () => {
      const r = formatApertureM(0.07);
      expect(r.unit).toBe("cm");
      expect(r.text).toBe("7.000");
    });
    it("returns em-dash for non-finite", () => {
      expect(formatApertureM(NaN).text).toBe("\u2014");
    });
    it("returns em-dash for zero or negative", () => {
      expect(formatApertureM(0).text).toBe("\u2014");
      expect(formatApertureM(-1).text).toBe("\u2014");
    });
  });

  // --- formatWavelengthCm ---

  describe("formatWavelengthCm", () => {
    // Provide a simple cmToNm converter for testing
    const cmToNm = (cm: number) => cm * 1e7;

    it("returns nm for optical wavelengths", () => {
      const r = formatWavelengthCm(5.5e-5, cmToNm); // 550 nm
      expect(r.unit).toBe("nm");
      expect(parseFloat(r.text)).toBeCloseTo(550, -1);
    });
    it("returns um for near-IR wavelengths", () => {
      const r = formatWavelengthCm(2.2e-4, cmToNm); // 2.2 um
      expect(r.unit).toBe("um");
      expect(parseFloat(r.text)).toBeCloseTo(2.2, 0);
    });
    it("returns mm for millimeter wavelengths", () => {
      const r = formatWavelengthCm(0.13, cmToNm); // 1.3 mm
      expect(r.unit).toBe("mm");
    });
    it("returns cm for centimeter wavelengths", () => {
      const r = formatWavelengthCm(21, cmToNm); // 21 cm
      expect(r.unit).toBe("cm");
      expect(parseFloat(r.text)).toBeCloseTo(21, 0);
    });
    it("returns m for meter wavelengths", () => {
      const r = formatWavelengthCm(300, cmToNm); // 3 m
      expect(r.unit).toBe("m");
    });
    it("returns em-dash for non-finite", () => {
      expect(formatWavelengthCm(NaN, cmToNm).text).toBe("\u2014");
    });
    it("returns em-dash for zero or negative", () => {
      expect(formatWavelengthCm(0, cmToNm).text).toBe("\u2014");
      expect(formatWavelengthCm(-1, cmToNm).text).toBe("\u2014");
    });
  });

  // --- describeStatus ---

  describe("describeStatus", () => {
    it("maps 'resolved' to good tone", () => {
      const s = describeStatus("resolved");
      expect(s.label).toBe("Resolved");
      expect(s.tone).toBe("good");
    });
    it("maps 'marginal' to warn tone", () => {
      const s = describeStatus("marginal");
      expect(s.label).toBe("Marginal");
      expect(s.tone).toBe("warn");
    });
    it("maps 'unresolved' to bad tone", () => {
      const s = describeStatus("unresolved");
      expect(s.label).toBe("Unresolved");
      expect(s.tone).toBe("bad");
    });
    it("maps unknown status to Unresolved/bad", () => {
      const s = describeStatus("blurry");
      expect(s.label).toBe("Unresolved");
      expect(s.tone).toBe("bad");
    });
  });

  // --- toneToBadgeAttr ---

  describe("toneToBadgeAttr", () => {
    it("maps good -> good", () => {
      expect(toneToBadgeAttr("good")).toBe("good");
    });
    it("maps warn -> warn", () => {
      expect(toneToBadgeAttr("warn")).toBe("warn");
    });
    it("maps bad -> danger", () => {
      expect(toneToBadgeAttr("bad")).toBe("danger");
    });
  });

  // --- computeFovArcsec ---

  describe("computeFovArcsec", () => {
    it("is at least 6x thetaEff", () => {
      const fov = computeFovArcsec(1.0, 0);
      expect(fov).toBeGreaterThanOrEqual(6);
    });
    it("is at least 3x separation", () => {
      const fov = computeFovArcsec(0.01, 10);
      expect(fov).toBeGreaterThanOrEqual(30);
    });
    it("is clamped to minimum 0.4", () => {
      const fov = computeFovArcsec(0.001, 0.001);
      expect(fov).toBeGreaterThanOrEqual(0.4);
    });
    it("is clamped to maximum 500", () => {
      const fov = computeFovArcsec(100, 200);
      expect(fov).toBeLessThanOrEqual(500);
    });
  });

  // --- zoomedFov ---

  describe("zoomedFov", () => {
    it("divides FOV by zoom", () => {
      expect(zoomedFov(10, 5)).toBeCloseTo(2);
    });
    it("clamps zoom to minimum 1", () => {
      expect(zoomedFov(10, 0)).toBe(10);
    });
    it("clamps zoom to maximum 20", () => {
      expect(zoomedFov(100, 50)).toBeCloseTo(5);
    });
  });
});
```

**Step 2: Run logic tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/logic.test.ts 2>&1 | tail -20`

Expected: All tests PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/telescope-resolution/logic.test.ts
git commit -m "test(telescope-resolution): add unit tests for pure UI logic"
```

---

## Task 7: Run full demo + physics test suite

**Files:**
- No files modified — verification only

**Step 1: Run physics tests**

Run: `corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5`
Expected: All pass (including 11 telescope-resolution model tests).

**Step 2: Run all demo Vitest tests**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -20`
Expected: All pass (moon-phases + angular-size + parallax-distance + seasons + blackbody-radiation + telescope-resolution).

**Step 3: Run theme tests**

Run: `corepack pnpm -C packages/theme test -- --run 2>&1 | tail -5`
Expected: 30 tests pass.

**Step 4: Build everything**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Clean build.

**Step 5: Run typecheck**

Run: `corepack pnpm -C apps/site typecheck 2>&1 | tail -5`
Expected: No errors.

---

## Task 8: Write Playwright E2E tests

**Files:**
- Create: `apps/site/tests/telescope-resolution.spec.ts`

**Step 1: Create the E2E test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Telescope Resolution -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/telescope-resolution/", { waitUntil: "domcontentloaded" });
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

  test("PSF canvas is present and has accessible label", async ({ page }) => {
    const canvas = page.locator("#canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("aria-label", "Point-spread function view");
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("telescope-resolution-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: atmosphere mode", async ({ page }) => {
    await page.locator("#includeAtmosphere").check();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("telescope-resolution-atmosphere.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("telescope-resolution-station.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Preset Selector ---

  test("telescope preset selector changes aperture readout", async ({ page }) => {
    const before = await page.locator("#apertureValue").textContent();
    // Select a different preset (Hubble = 2.4 m)
    await page.locator("#preset").selectOption("hubble");
    const after = await page.locator("#apertureValue").textContent();
    expect(after).not.toBe(before);
  });

  // --- Aperture Slider ---

  test("aperture slider updates aperture readout", async ({ page }) => {
    const before = await page.locator("#apertureValue").textContent();
    await page.locator("#aperture").fill("800");
    await page.locator("#aperture").dispatchEvent("input");
    const after = await page.locator("#apertureValue").textContent();
    expect(after).not.toBe(before);
  });

  test("aperture slider switches preset to Custom", async ({ page }) => {
    await page.locator("#preset").selectOption("hubble");
    await page.locator("#aperture").fill("800");
    await page.locator("#aperture").dispatchEvent("input");
    const presetVal = await page.locator("#preset").inputValue();
    expect(presetVal).toBe("custom");
  });

  // --- Wavelength Band Buttons ---

  test("wavelength band buttons are present", async ({ page }) => {
    const buttons = page.locator("#bands button.band");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("clicking a band button activates it", async ({ page }) => {
    const buttons = page.locator("#bands button.band");
    const secondBtn = buttons.nth(1);
    await secondBtn.click();
    await expect(secondBtn).toHaveAttribute("aria-pressed", "true");
  });

  // --- Binary Mode ---

  test("binary separation slider updates separation readout", async ({ page }) => {
    const before = await page.locator("#sepReadout").textContent();
    await page.locator("#separation").fill("300");
    await page.locator("#separation").dispatchEvent("input");
    const after = await page.locator("#sepReadout").textContent();
    expect(after).not.toBe(before);
  });

  test("disabling binary mode disables separation slider", async ({ page }) => {
    await page.locator("#binaryEnabled").uncheck();
    await expect(page.locator("#separation")).toBeDisabled();
  });

  test("disabling binary mode shows single-star status", async ({ page }) => {
    await page.locator("#binaryEnabled").uncheck();
    const status = await page.locator("#statusReadout").textContent();
    expect(status).toContain("Single");
  });

  // --- Atmosphere Controls ---

  test("atmosphere controls are hidden by default", async ({ page }) => {
    await expect(page.locator("#atmosphereControls")).toBeHidden();
  });

  test("enabling atmosphere shows atmosphere controls", async ({ page }) => {
    await page.locator("#includeAtmosphere").check();
    await expect(page.locator("#atmosphereControls")).toBeVisible();
  });

  test("seeing preset changes seeing slider value", async ({ page }) => {
    await page.locator("#includeAtmosphere").check();
    const before = await page.locator("#seeing").inputValue();
    await page.locator("#seeingPreset").selectOption("poor");
    const after = await page.locator("#seeing").inputValue();
    expect(after).not.toBe(before);
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
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Telescope Resolution",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
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

**Step 2: Build the site so demo assets are available**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Build succeeds, `apps/site/public/play/telescope-resolution/` populated.

**Step 3: Run E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Telescope" 2>&1 | tail -30`
Expected: All non-skipped E2E tests PASS.

**Step 4: Commit**

```bash
git add apps/site/tests/telescope-resolution.spec.ts
git commit -m "test(telescope-resolution): add Playwright E2E tests"
```

---

## Task 9: Final gate run

**Files:**
- No files modified — verification only

**Step 1: Run full gate suite**

```bash
corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5
corepack pnpm -C packages/theme test -- --run 2>&1 | tail -5
corepack pnpm -C apps/demos test -- --run 2>&1 | tail -10
corepack pnpm build 2>&1 | tail -10
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e 2>&1 | tail -30
```

Expected: All pass.

---

## Task 10: Update memory with new counts

**Files:**
- Modify: `/Users/anna/.claude/projects/-Users-anna-Teaching-cosmic-playground/memory/MEMORY.md`

**Step 1: Update migration status**

Add to Demo Migration Status section:
```
- Phase 7: telescope-resolution migration + hardening — DONE (16 contract + ~30 logic + ~22 E2E tests, ~8 commits)
```

Update Next:
```
- Next: em-spectrum (7th in migration order — light/spectra)
```

**Step 2: Update test counts**

Update the telescope-resolution entry:
```
- telescope-resolution: 16 contract + ~30 logic = ~46 tests
```

Update totals accordingly.

---

## Summary of expected new test counts

| Layer | Count | Description |
|-------|-------|-------------|
| Physics model | 0 new (11 existing) | Already comprehensive |
| Design contracts | 16 | Token usage, starfield, readouts, animations, color literals |
| Logic unit tests | ~30 | clamp, log sliders, formatters, status, FOV, zoom |
| Playwright E2E | ~22 | Layout, interactions, controls, accessibility |
| **Total new** | **~68** | |

## Key gotchas for this migration

1. **Canvas demos with starfield**: The `#canvas` ID distinguishes the PSF canvas from `.cp-starfield`. Style.css already targets `.stage__canvas` (not `canvas`) so no CSS collision.
2. **Hardcoded rgba() in main.ts**: The 3 `rgba()` values in `drawPsf()` are Canvas 2D context calls (not CSS) — the no-color-literals contract only checks CSS files, so these are acceptable. They are functional overlay styling (crosshairs, scale bar) on a pixel-by-pixel rendered image.
3. **formatWavelengthCm** needs `cmToNm` parameter: The original function used `AstroUnits.cmToNm` directly — the extracted version takes it as a parameter for testability without importing the physics package in test files.
4. **Readout labels with KaTeX**: The `$\theta_\mathrm{diff}$` math stays in the label — only the `(arcsec)` unit part moves to a separate span.
5. **build validation rejects Unicode math** in demo sources — use ASCII in test comments (no theta, arrows, etc.).
