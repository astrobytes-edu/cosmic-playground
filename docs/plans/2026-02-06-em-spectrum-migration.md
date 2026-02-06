# EM Spectrum Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the em-spectrum demo to the full design system contract, following the 4-layer testing protocol established by previous migrations (moon-phases → angular-size → parallax-distance → seasons → blackbody-radiation → telescope-resolution).

**Architecture:** DOM-based spectrum visualization (NOT Canvas 2D — unlike blackbody-radiation and telescope-resolution). The demo uses a CSS-styled `.spectrum__bar` div with a marker and highlight overlay, plus a band-card, readouts panel, and tabbed explore panels (Convert, Telescopes, Objects, Lines). Physics comes from `@cosmic/physics` (PhotonModel, AstroUnits). Data comes from `@cosmic/data-spectra` (atomicLines, emSpectrumObjects, emSpectrumTelescopes, molecularBands). Migration adds: starfield canvas, readout unit separation, legacy token removal, entry animations, logic extraction to pure functions, design contract tests, logic unit tests, and Playwright E2E tests.

**Tech Stack:** TypeScript, Vitest (unit/contract tests), Playwright (E2E), CSS custom properties (design tokens), DOM-based visualization

---

## Pre-flight: Understand current state

**What exists:**
- `apps/demos/src/demos/em-spectrum/index.html` (201 lines) — full HTML with controls, stage, readouts aside, drawer with 4 tabs
- `apps/demos/src/demos/em-spectrum/main.ts` (547 lines) — all logic + DOM wiring in one file
- `apps/demos/src/demos/em-spectrum/style.css` (221 lines) — imports stub-demo.css, has band buttons, spectrum bar, tabs
- `packages/physics/src/photonModel.ts` — 14 methods (wavelength/frequency/energy conversions in CGS + nm/eV helpers)
- `packages/physics/src/photonModel.test.ts` — 5 existing tests (sanity, round-trips, consistency)

**What's missing (per migration checklist):**
1. No `<canvas class="cp-starfield">` or `initStarfield()` call
2. No `.cp-readout__unit` spans — readout values are set by JS as combined `${value} ${unit}` strings
3. No entry animations (`cp-slide-up` / `cp-fade-in`)
4. **Legacy tokens in CSS**: `--cp-accent2` and `--cp-accent3` used in `.spectrum__bar` gradient (line 94-96)
5. No `logic.ts` — 7 pure functions not extracted from main.ts
6. No `logic.test.ts` — no unit tests for formatters/converters
7. No `design-contracts.test.ts` — no contract enforcement
8. No `apps/site/tests/em-spectrum.spec.ts` — no E2E tests

**What's already correct:**
- No `--cp-warning` tokens in CSS or HTML
- Physics from `@cosmic/physics` (not inlined)
- `cp-layer-instrument` class on demo root
- Readouts panel exists as separate `<aside>` with `aria-label="Readouts panel"`
- Status region has `role="status"` and `aria-live="polite"`
- Controls panel has `aria-label="Controls panel"`

**Key difference from canvas demos:** The spectrum bar is a styled `<div>` (not `<canvas>`), so there's no `.stage__canvas` CSS selector pattern. The stage uses `.stage` and `.spectrum__bar` for layout. Contract tests should verify the spectrum bar uses tokens, not canvas background checks.

---

## Task 1: Write design contract tests (RED)

**Files:**
- Create: `apps/demos/src/demos/em-spectrum/design-contracts.test.ts`

**Step 1: Write the failing contract test file**

Adapt the telescope-resolution pattern for em-spectrum's DOM-based structure (no canvas stage, spectrum bar uses CSS gradient, has legacy tokens to remove).

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- EM Spectrum
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

describe("EM Spectrum -- Design System Contracts", () => {
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
      // wavelength, frequency, energy = 3 dimensional readouts
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) =>
        /\((?:nm|Hz|eV|cm|m|km)\)/.test(l)
      );
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
      // Should not inline photon calculations
      expect(mainTs).not.toMatch(/function\s+planck/i);
      expect(mainTs).not.toMatch(/6\.626\s*\*\s*1e-27/);
    });

    it("spectrum bar uses design-system tokens for gradient", () => {
      // The spectrum__bar should use token-based colors (not raw hex/rgba)
      expect(css).toMatch(/\.spectrum__bar[\s\S]*?background[\s\S]*?var\(--cp-/);
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

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/design-contracts.test.ts 2>&1 | tail -20`

Expected: Multiple FAIL — at minimum: starfield canvas missing, starfield init missing, no `.cp-readout__unit` spans, legacy `--cp-accent2`/`--cp-accent3` in CSS, no entry animations.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/design-contracts.test.ts
git commit -m "test(em-spectrum): add design contract tests (RED)"
```

---

## Task 2: Add starfield canvas to HTML + initStarfield() in main.ts

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`

**Step 1: Add starfield canvas to HTML**

Add the starfield canvas as the first child inside the `#cp-demo` div (before `<aside class="cp-demo__controls">`):

```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

**Step 2: Add initStarfield() call in main.ts**

Add `initStarfield` to the existing `@cosmic/runtime` import:

```typescript
import {
  createInstrumentRuntime,
  initMath,
  initStarfield,
  setLiveRegionText
} from "@cosmic/runtime";
```

Add starfield initialization after the `runtime` const (around line 273), before state:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });
```

**Step 3: Run contract tests to check starfield passes**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/design-contracts.test.ts 2>&1 | tail -20`

Expected: Starfield invariant and Starfield initialization tests now PASS. Others still failing.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/index.html apps/demos/src/demos/em-spectrum/main.ts
git commit -m "feat(em-spectrum): add starfield canvas + initStarfield()"
```

---

## Task 3: Separate readout units into .cp-readout__unit spans

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`

**Step 1: Add unit spans to HTML readouts**

Each of the 3 dimensional readouts needs a `.cp-readout__unit` span. The readout values are currently set entirely by JavaScript, but we need the unit spans in the HTML structure for the contract test. Update the readouts section:

Replace each readout value div. Current pattern:
```html
<div class="cp-readout__value"><span id="readoutWavelength"></span></div>
```

New pattern (add unit span):
```html
<div class="cp-readout__value"><span id="readoutWavelength"></span> <span class="cp-readout__unit" id="readoutWavelengthUnit"></span></div>
```

Apply to all 3 readouts:
1. Wavelength: add `<span class="cp-readout__unit" id="readoutWavelengthUnit"></span>` after `#readoutWavelength`
2. Frequency: add `<span class="cp-readout__unit" id="readoutFrequencyUnit"></span>` after `#readoutFrequency`
3. Energy: add `<span class="cp-readout__unit" id="readoutEnergyUnit"></span>` after `#readoutEnergy`

**Step 2: Update main.ts to set value and unit separately**

Add DOM queries for the unit elements (near line 185):
```typescript
const readoutWavelengthUnitEl = document.querySelector<HTMLSpanElement>("#readoutWavelengthUnit");
const readoutFrequencyUnitEl = document.querySelector<HTMLSpanElement>("#readoutFrequencyUnit");
const readoutEnergyUnitEl = document.querySelector<HTMLSpanElement>("#readoutEnergyUnit");
```

Add them to the guard check and alias block.

Update `renderReadouts()` to set value and unit separately:
```typescript
function renderReadouts(lambdaCm: number) {
  const nuHz = PhotonModel.frequencyHzFromWavelengthCm(lambdaCm);
  const energyErg = PhotonModel.photonEnergyErgFromWavelengthCm(lambdaCm);

  const w = formatWavelength(lambdaCm);
  const f = formatFrequency(nuHz);
  const e = formatEnergyFromErg(energyErg);

  readoutWavelength.textContent = w.value;
  readoutWavelengthUnit.textContent = w.unit;
  readoutFrequency.textContent = f.value;
  readoutFrequencyUnit.textContent = f.unit;
  readoutEnergy.textContent = e.value;
  readoutEnergyUnit.textContent = e.unit;
  wavelengthValue.textContent = `${w.value} ${w.unit}`.trim();
}
```

**Step 3: Run contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/design-contracts.test.ts 2>&1 | tail -20`

Expected: Readout unit separation tests now PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/index.html apps/demos/src/demos/em-spectrum/main.ts
git commit -m "feat(em-spectrum): separate readout units into .cp-readout__unit spans"
```

---

## Task 4: Remove legacy tokens from style.css

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/style.css`

**Step 1: Replace legacy token references**

The `.spectrum__bar` gradient on lines 92-97 uses legacy tokens:
```css
background: linear-gradient(
  to right,
  color-mix(in srgb, var(--cp-accent2) 50%, var(--cp-bg1)),
  color-mix(in srgb, var(--cp-accent) 55%, var(--cp-bg1)),
  color-mix(in srgb, var(--cp-accent3) 55%, var(--cp-bg1))
);
```

Replace with semantic tokens:
- `--cp-accent2` is a legacy alias — replace with `--cp-violet` (the purple/blue end of spectrum)
- `--cp-accent3` is a legacy alias for `--cp-accent` — replace with `--cp-pink` (the red/high-energy end)

New gradient:
```css
background: linear-gradient(
  to right,
  color-mix(in srgb, var(--cp-violet) 50%, var(--cp-bg1)),
  color-mix(in srgb, var(--cp-accent) 55%, var(--cp-bg1)),
  color-mix(in srgb, var(--cp-pink) 55%, var(--cp-bg1))
);
```

This represents: long wavelength (violet/cool) → mid (teal/accent) → short wavelength (pink/hot).

**Step 2: Run contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/design-contracts.test.ts 2>&1 | tail -20`

Expected: Legacy token leakage tests now PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/style.css
git commit -m "fix(em-spectrum): replace legacy --cp-accent2/accent3 with semantic tokens"
```

---

## Task 5: Add entry animations to style.css

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/style.css`

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

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/design-contracts.test.ts 2>&1 | tail -20`

Expected: ALL contract tests PASS (GREEN). Verify the count: should be ~15 tests.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/style.css
git commit -m "feat(em-spectrum): add staggered entry animations"
```

---

## Task 6: Extract pure logic functions to logic.ts

**Files:**
- Create: `apps/demos/src/demos/em-spectrum/logic.ts`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`

**Step 1: Create logic.ts with pure functions**

Extract these 7 pure functions from main.ts. All are pure (no DOM, no side effects). The `formatEnergyFromErg` function currently uses `AstroUnits.ergToEv` directly — extract it with a DI callback (like `formatWavelengthCm` in telescope-resolution uses `cmToNm`).

```typescript
/**
 * Pure UI logic for the em-spectrum demo.
 * No DOM access -- all functions are testable in isolation.
 */

export type BandKey =
  | "radio"
  | "microwave"
  | "infrared"
  | "visible"
  | "ultraviolet"
  | "xray"
  | "gamma";

export type BandInfo = {
  key: BandKey;
  name: string;
  lambdaMinCm: number;
  lambdaMaxCm: number;
  description: string;
  examples: string;
  detection: string;
};

export const BANDS: Record<BandKey, BandInfo> = {
  radio: {
    key: "radio",
    name: "Radio",
    lambdaMinCm: 1e-1,
    lambdaMaxCm: 1e6,
    description:
      "The longest wavelengths in the EM spectrum. Radio waves pass through clouds, dust, and even buildings.",
    examples:
      "AM/FM radio, WiFi, pulsars, the cosmic microwave background, radio galaxies",
    detection: "Large dish antennas and interferometers (VLA, ALMA, FAST)"
  },
  microwave: {
    key: "microwave",
    name: "Microwave",
    lambdaMinCm: 1e-2,
    lambdaMaxCm: 1e-1,
    description:
      "Between radio and infrared. Microwaves reveal the cosmic microwave background and cold molecular gas.",
    examples: "Microwave ovens, CMB, molecular clouds, radar",
    detection: "Microwave receivers and bolometers (Planck, WMAP)"
  },
  infrared: {
    key: "infrared",
    name: "Infrared",
    lambdaMinCm: 7e-5,
    lambdaMaxCm: 1e-2,
    description:
      "Emitted by warm objects. Infrared can penetrate dust clouds to reveal star-forming regions.",
    examples: "Thermal emission, brown dwarfs, dust-enshrouded star formation",
    detection: "Cooled IR detectors (JWST, Spitzer, Herschel)"
  },
  visible: {
    key: "visible",
    name: "Visible",
    lambdaMinCm: 3.8e-5,
    lambdaMaxCm: 7e-5,
    description:
      "The narrow band our eyes can see. Stars, galaxies, and nebulae shine brightly in visible light.",
    examples: "Sunlight, starlight, nebulae, galaxies",
    detection: "Human eyes, CCDs, ground optical telescopes, Hubble"
  },
  ultraviolet: {
    key: "ultraviolet",
    name: "Ultraviolet",
    lambdaMinCm: 1e-6,
    lambdaMaxCm: 3.8e-5,
    description:
      "Higher energy than visible light. UV reveals hot young stars and active galactic nuclei.",
    examples: "Sunburns, massive stars, accretion disks",
    detection: "UV-sensitive detectors, mostly space-based (HST, GALEX)"
  },
  xray: {
    key: "xray",
    name: "X-ray",
    lambdaMinCm: 1e-9,
    lambdaMaxCm: 1e-6,
    description:
      "Very high energy photons from extremely hot gas and violent events.",
    examples: "X-ray binaries, supernova remnants, hot cluster gas",
    detection: "Space telescopes with grazing-incidence optics (Chandra, XMM)"
  },
  gamma: {
    key: "gamma",
    name: "Gamma-ray",
    lambdaMinCm: 1e-13,
    lambdaMaxCm: 1e-9,
    description:
      "The highest energy photons. Gamma rays come from the most extreme events in the universe.",
    examples: "Gamma-ray bursts, nuclear reactions, pulsars",
    detection: "Space detectors (Fermi) and ground Cherenkov telescopes (VERITAS)"
  }
};

export const LAMBDA_MIN_LOG = Math.log10(1e-12); // 10 fm
export const LAMBDA_MAX_LOG = Math.log10(1e6); // 10 km

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a wavelength in cm to a position percentage on the spectrum bar.
 * Position 0% = longest wavelength (left/radio), 100% = shortest (right/gamma).
 */
export function wavelengthToPositionPercent(lambdaCm: number): number {
  const lambdaLog = Math.log10(Math.max(1e-13, Math.min(1e7, lambdaCm)));
  return 100 - ((lambdaLog - LAMBDA_MIN_LOG) / (LAMBDA_MAX_LOG - LAMBDA_MIN_LOG)) * 100;
}

/**
 * Convert a position percentage back to wavelength in cm.
 * Inverse of wavelengthToPositionPercent.
 */
export function positionPercentToWavelengthCm(positionPercent: number): number {
  const pos = clamp(positionPercent, 0, 100);
  const lambdaLog = LAMBDA_MAX_LOG - (pos / 100) * (LAMBDA_MAX_LOG - LAMBDA_MIN_LOG);
  return Math.pow(10, lambdaLog);
}

/**
 * Format a wavelength in cm for display with auto unit selection.
 * Returns {value, unit} for separate rendering.
 * Covers fm -> pm -> nm -> um -> mm -> m -> km.
 */
export function formatWavelength(lambdaCm: number): { value: string; unit: string } {
  if (!Number.isFinite(lambdaCm) || lambdaCm <= 0) return { value: "\u2014", unit: "" };
  if (lambdaCm >= 1e5) return { value: (lambdaCm / 1e5).toPrecision(3), unit: "km" };
  if (lambdaCm >= 100) return { value: (lambdaCm / 100).toPrecision(3), unit: "m" };
  if (lambdaCm >= 0.1) return { value: (lambdaCm * 10).toPrecision(3), unit: "mm" };
  if (lambdaCm >= 1e-4) return { value: (lambdaCm / 1e-4).toPrecision(3), unit: "um" };
  if (lambdaCm >= 1e-7) return { value: (lambdaCm / 1e-7).toPrecision(3), unit: "nm" };
  if (lambdaCm >= 1e-10) return { value: (lambdaCm / 1e-10).toPrecision(3), unit: "pm" };
  return { value: (lambdaCm / 1e-13).toPrecision(3), unit: "fm" };
}

/**
 * Format a frequency in Hz for display with auto unit selection.
 * Returns {value, unit} for separate rendering.
 * Covers Hz -> kHz -> MHz -> GHz -> THz -> PHz -> EHz.
 */
export function formatFrequency(nuHz: number): { value: string; unit: string } {
  if (!Number.isFinite(nuHz) || nuHz <= 0) return { value: "\u2014", unit: "" };
  if (nuHz >= 1e18) return { value: (nuHz / 1e18).toPrecision(3), unit: "EHz" };
  if (nuHz >= 1e15) return { value: (nuHz / 1e15).toPrecision(3), unit: "PHz" };
  if (nuHz >= 1e12) return { value: (nuHz / 1e12).toPrecision(3), unit: "THz" };
  if (nuHz >= 1e9) return { value: (nuHz / 1e9).toPrecision(3), unit: "GHz" };
  if (nuHz >= 1e6) return { value: (nuHz / 1e6).toPrecision(3), unit: "MHz" };
  if (nuHz >= 1e3) return { value: (nuHz / 1e3).toPrecision(3), unit: "kHz" };
  return { value: nuHz.toPrecision(3), unit: "Hz" };
}

/**
 * Format a photon energy given in erg for display with auto unit selection.
 * Uses a DI callback for erg->eV conversion to avoid importing @cosmic/physics in tests.
 * Returns {value, unit} for separate rendering.
 * Covers erg -> eV -> keV -> MeV.
 */
export function formatEnergyFromErg(
  energyErg: number,
  ergToEv: (erg: number) => number
): { value: string; unit: string } {
  if (!Number.isFinite(energyErg) || energyErg <= 0) return { value: "\u2014", unit: "" };
  const energyEv = ergToEv(energyErg);
  if (energyEv >= 1e6) return { value: (energyEv / 1e6).toPrecision(3), unit: "MeV" };
  if (energyEv >= 1e3) return { value: (energyEv / 1e3).toPrecision(3), unit: "keV" };
  if (energyEv >= 1e-3) return { value: energyEv.toPrecision(3), unit: "eV" };
  return { value: energyErg.toPrecision(3), unit: "erg" };
}

/**
 * Determine which EM band a wavelength (cm) falls into.
 */
export function bandFromWavelengthCm(lambdaCm: number): BandKey {
  for (const key of Object.keys(BANDS) as BandKey[]) {
    const band = BANDS[key];
    if (lambdaCm >= band.lambdaMinCm && lambdaCm <= band.lambdaMaxCm) return key;
  }
  if (lambdaCm > BANDS.radio.lambdaMaxCm) return "radio";
  if (lambdaCm < BANDS.gamma.lambdaMinCm) return "gamma";
  return "visible";
}

/**
 * Compute the geometric center wavelength of a band (in cm).
 * Used to jump the slider to a band's center when a band button is clicked.
 */
export function bandCenterCm(key: BandKey): number {
  const band = BANDS[key];
  return Math.sqrt(band.lambdaMinCm * band.lambdaMaxCm);
}
```

**Step 2: Update main.ts to import from logic.ts**

Replace the local type definitions, BANDS constant, and function definitions with imports from `./logic`:

```typescript
import {
  type BandKey,
  type BandInfo,
  BANDS,
  LAMBDA_MIN_LOG,
  LAMBDA_MAX_LOG,
  clamp,
  wavelengthToPositionPercent,
  positionPercentToWavelengthCm,
  formatWavelength,
  formatFrequency,
  formatEnergyFromErg,
  bandFromWavelengthCm,
  bandCenterCm
} from "./logic";
```

Remove from main.ts:
- The `BandKey` type alias (lines 15-22)
- The `BandInfo` type (lines 24-32)
- The `BANDS` constant (lines 34-106)
- The `LAMBDA_MIN_LOG` and `LAMBDA_MAX_LOG` constants (lines 108-109)
- The `clamp` function (lines 111-113)
- The `wavelengthToPositionPercent` function (lines 115-118)
- The `positionPercentToWavelengthCm` function (lines 120-124)
- The `formatWavelength` function (lines 126-135)
- The `formatFrequency` function (lines 137-146)
- The `formatEnergyFromErg` function (lines 148-155)
- The `bandFromWavelengthCm` function (lines 157-165)

Update the `formatEnergyFromErg` call sites to pass `AstroUnits.ergToEv` as the converter:
```typescript
// Before:
const e = formatEnergyFromErg(energyErg);
// After:
const e = formatEnergyFromErg(energyErg, AstroUnits.ergToEv);
```

Update `setBand()` to use `bandCenterCm`:
```typescript
// Before:
function setBand(key: BandKey) {
  const band = BANDS[key];
  const lambdaCenter = Math.sqrt(band.lambdaMinCm * band.lambdaMaxCm);
  setWavelengthCm(lambdaCenter);
}
// After:
function setBand(key: BandKey) {
  setWavelengthCm(bandCenterCm(key));
}
```

**Step 3: Build to verify no regressions**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/design-contracts.test.ts 2>&1 | tail -10`

Expected: All contract tests still PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/logic.ts apps/demos/src/demos/em-spectrum/main.ts
git commit -m "refactor(em-spectrum): extract pure logic to logic.ts (humble object)"
```

---

## Task 7: Write unit tests for logic.ts

**Files:**
- Create: `apps/demos/src/demos/em-spectrum/logic.test.ts`

**Step 1: Write comprehensive unit tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  clamp,
  wavelengthToPositionPercent,
  positionPercentToWavelengthCm,
  formatWavelength,
  formatFrequency,
  formatEnergyFromErg,
  bandFromWavelengthCm,
  bandCenterCm,
  BANDS,
  LAMBDA_MIN_LOG,
  LAMBDA_MAX_LOG
} from "./logic";

describe("EM Spectrum -- Logic", () => {
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

  // --- wavelengthToPositionPercent / positionPercentToWavelengthCm ---

  describe("wavelengthToPositionPercent", () => {
    it("returns ~0% for very long wavelengths (radio end)", () => {
      const pos = wavelengthToPositionPercent(1e6); // 10 km
      expect(pos).toBeCloseTo(0, 0);
    });
    it("returns ~100% for very short wavelengths (gamma end)", () => {
      const pos = wavelengthToPositionPercent(1e-12); // 10 fm
      expect(pos).toBeCloseTo(100, 0);
    });
    it("returns 50% for geometric midpoint", () => {
      // Midpoint: 10^((log10(1e-12) + log10(1e6))/2) = 10^(-3) = 0.001 cm = 10 um
      const pos = wavelengthToPositionPercent(1e-3);
      expect(pos).toBeCloseTo(50, 0);
    });
    it("is monotonically decreasing (shorter wavelength = larger position)", () => {
      const p1 = wavelengthToPositionPercent(1e-5); // 100 nm
      const p2 = wavelengthToPositionPercent(1e-3); // 10 um
      const p3 = wavelengthToPositionPercent(1e0); // 1 cm
      expect(p1).toBeGreaterThan(p2);
      expect(p2).toBeGreaterThan(p3);
    });
  });

  describe("positionPercentToWavelengthCm", () => {
    it("returns longest wavelength at position 0%", () => {
      const lambda = positionPercentToWavelengthCm(0);
      expect(lambda).toBeCloseTo(1e6, -4); // 10 km
    });
    it("returns shortest wavelength at position 100%", () => {
      const lambda = positionPercentToWavelengthCm(100);
      expect(lambda).toBeCloseTo(1e-12, -14); // 10 fm
    });
    it("clamps position to 0-100 range", () => {
      expect(positionPercentToWavelengthCm(-10)).toBe(positionPercentToWavelengthCm(0));
      expect(positionPercentToWavelengthCm(110)).toBe(positionPercentToWavelengthCm(100));
    });
    it("round-trips with wavelengthToPositionPercent", () => {
      const lambdaCm = 5.5e-5; // 550 nm (visible)
      const pos = wavelengthToPositionPercent(lambdaCm);
      const roundTripped = positionPercentToWavelengthCm(pos);
      expect(roundTripped).toBeCloseTo(lambdaCm, 8);
    });
  });

  // --- formatWavelength ---

  describe("formatWavelength", () => {
    it("returns em-dash for non-finite input", () => {
      expect(formatWavelength(NaN).value).toBe("\u2014");
      expect(formatWavelength(Infinity).value).toBe("\u2014");
    });
    it("returns em-dash for zero or negative", () => {
      expect(formatWavelength(0).value).toBe("\u2014");
      expect(formatWavelength(-1).value).toBe("\u2014");
    });
    it("returns nm for optical wavelengths", () => {
      const r = formatWavelength(5.5e-5); // 550 nm in cm
      expect(r.unit).toBe("nm");
      expect(parseFloat(r.value)).toBeCloseTo(550, -1);
    });
    it("returns um for near-IR wavelengths", () => {
      const r = formatWavelength(2.2e-4); // 2.2 um in cm
      expect(r.unit).toBe("um");
      expect(parseFloat(r.value)).toBeCloseTo(2.2, 0);
    });
    it("returns mm for millimeter wavelengths", () => {
      const r = formatWavelength(0.13); // 1.3 mm in cm
      expect(r.unit).toBe("mm");
    });
    it("returns m for meter wavelengths", () => {
      const r = formatWavelength(300); // 3 m in cm
      expect(r.unit).toBe("m");
    });
    it("returns km for very long wavelengths", () => {
      const r = formatWavelength(1e6); // 10 km in cm
      expect(r.unit).toBe("km");
    });
    it("returns pm for X-ray wavelengths", () => {
      const r = formatWavelength(1e-8); // 0.1 nm = 100 pm in cm
      expect(r.unit).toBe("pm");
    });
    it("returns fm for gamma-ray wavelengths", () => {
      const r = formatWavelength(1e-12); // 10 fm in cm
      expect(r.unit).toBe("fm");
    });
    it("returns cm for centimeter wavelengths", () => {
      const r = formatWavelength(21); // 21 cm (HI line)
      expect(r.unit).toBe("m");
      expect(parseFloat(r.value)).toBeCloseTo(0.21, 1);
    });
  });

  // --- formatFrequency ---

  describe("formatFrequency", () => {
    it("returns em-dash for non-finite input", () => {
      expect(formatFrequency(NaN).value).toBe("\u2014");
      expect(formatFrequency(Infinity).value).toBe("\u2014");
    });
    it("returns em-dash for zero or negative", () => {
      expect(formatFrequency(0).value).toBe("\u2014");
      expect(formatFrequency(-1).value).toBe("\u2014");
    });
    it("returns Hz for very low frequencies", () => {
      const r = formatFrequency(500);
      expect(r.unit).toBe("Hz");
    });
    it("returns kHz for kHz-range frequencies", () => {
      const r = formatFrequency(5e3);
      expect(r.unit).toBe("kHz");
    });
    it("returns MHz for MHz-range frequencies", () => {
      const r = formatFrequency(100e6);
      expect(r.unit).toBe("MHz");
    });
    it("returns GHz for GHz-range frequencies", () => {
      const r = formatFrequency(5.0e9);
      expect(r.unit).toBe("GHz");
    });
    it("returns THz for THz-range frequencies", () => {
      const r = formatFrequency(4.3e14); // visible light ~430 THz
      expect(r.unit).toBe("THz");
    });
    it("returns PHz for PHz-range frequencies", () => {
      const r = formatFrequency(1e16);
      expect(r.unit).toBe("PHz");
    });
    it("returns EHz for EHz-range frequencies", () => {
      const r = formatFrequency(1e20);
      expect(r.unit).toBe("EHz");
    });
  });

  // --- formatEnergyFromErg ---

  describe("formatEnergyFromErg", () => {
    // Simple converter for testing (matches AstroUnits.ergToEv within ~1%)
    const ergToEv = (erg: number) => erg / 1.602176634e-12;

    it("returns em-dash for non-finite input", () => {
      expect(formatEnergyFromErg(NaN, ergToEv).value).toBe("\u2014");
      expect(formatEnergyFromErg(Infinity, ergToEv).value).toBe("\u2014");
    });
    it("returns em-dash for zero or negative", () => {
      expect(formatEnergyFromErg(0, ergToEv).value).toBe("\u2014");
      expect(formatEnergyFromErg(-1, ergToEv).value).toBe("\u2014");
    });
    it("returns eV for optical photon energies", () => {
      // ~2.25 eV photon (550 nm) => E_erg ~ 3.6e-12
      const r = formatEnergyFromErg(3.6e-12, ergToEv);
      expect(r.unit).toBe("eV");
    });
    it("returns keV for X-ray photon energies", () => {
      // ~10 keV => E_erg ~ 1.6e-8
      const r = formatEnergyFromErg(1.6e-8, ergToEv);
      expect(r.unit).toBe("keV");
    });
    it("returns MeV for gamma-ray photon energies", () => {
      // ~10 MeV => E_erg ~ 1.6e-5
      const r = formatEnergyFromErg(1.6e-5, ergToEv);
      expect(r.unit).toBe("MeV");
    });
    it("returns erg for very low energies below meV", () => {
      // E_eV < 1e-3 => falls to erg display
      // Need erg such that ergToEv(erg) < 1e-3 => erg < 1.6e-15
      const r = formatEnergyFromErg(1e-16, ergToEv);
      expect(r.unit).toBe("erg");
    });
  });

  // --- bandFromWavelengthCm ---

  describe("bandFromWavelengthCm", () => {
    it("returns visible for 550 nm", () => {
      expect(bandFromWavelengthCm(5.5e-5)).toBe("visible");
    });
    it("returns radio for 21 cm", () => {
      expect(bandFromWavelengthCm(21)).toBe("radio");
    });
    it("returns infrared for 2.2 um", () => {
      expect(bandFromWavelengthCm(2.2e-4)).toBe("infrared");
    });
    it("returns xray for 1 nm", () => {
      expect(bandFromWavelengthCm(1e-7)).toBe("xray");
    });
    it("returns gamma for very short wavelengths beyond range", () => {
      expect(bandFromWavelengthCm(1e-15)).toBe("gamma");
    });
    it("returns radio for very long wavelengths beyond range", () => {
      expect(bandFromWavelengthCm(1e8)).toBe("radio");
    });
    it("returns ultraviolet for 100 nm", () => {
      expect(bandFromWavelengthCm(1e-5)).toBe("ultraviolet");
    });
    it("returns microwave for 3 mm", () => {
      expect(bandFromWavelengthCm(0.03)).toBe("microwave");
    });
  });

  // --- bandCenterCm ---

  describe("bandCenterCm", () => {
    it("returns geometric mean of band limits", () => {
      const center = bandCenterCm("visible");
      const expected = Math.sqrt(3.8e-5 * 7e-5);
      expect(center).toBeCloseTo(expected, 10);
    });
    it("center falls within band boundaries", () => {
      for (const key of Object.keys(BANDS) as Array<keyof typeof BANDS>) {
        const center = bandCenterCm(key);
        expect(center).toBeGreaterThanOrEqual(BANDS[key].lambdaMinCm);
        expect(center).toBeLessThanOrEqual(BANDS[key].lambdaMaxCm);
      }
    });
  });

  // --- BANDS data integrity ---

  describe("BANDS data integrity", () => {
    it("all 7 EM bands are defined", () => {
      expect(Object.keys(BANDS).length).toBe(7);
    });
    it("all bands have positive wavelength limits", () => {
      for (const band of Object.values(BANDS)) {
        expect(band.lambdaMinCm).toBeGreaterThan(0);
        expect(band.lambdaMaxCm).toBeGreaterThan(band.lambdaMinCm);
      }
    });
    it("adjacent bands have matching boundaries", () => {
      // radio.min ~= microwave.max
      expect(BANDS.radio.lambdaMinCm).toBeCloseTo(BANDS.microwave.lambdaMaxCm, 2);
      // microwave.min ~= infrared.max
      expect(BANDS.microwave.lambdaMinCm).toBeCloseTo(BANDS.infrared.lambdaMaxCm, 6);
      // infrared.min ~= visible.max
      expect(BANDS.infrared.lambdaMinCm).toBeCloseTo(BANDS.visible.lambdaMaxCm, 6);
    });
  });

  // --- Constants ---

  describe("spectrum range constants", () => {
    it("LAMBDA_MIN_LOG corresponds to 10 fm", () => {
      expect(LAMBDA_MIN_LOG).toBeCloseTo(Math.log10(1e-12), 10);
    });
    it("LAMBDA_MAX_LOG corresponds to 10 km", () => {
      expect(LAMBDA_MAX_LOG).toBeCloseTo(Math.log10(1e6), 10);
    });
    it("range spans 18 orders of magnitude", () => {
      expect(LAMBDA_MAX_LOG - LAMBDA_MIN_LOG).toBeCloseTo(18, 10);
    });
  });
});
```

**Step 2: Run logic tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/logic.test.ts 2>&1 | tail -20`

Expected: All tests PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/logic.test.ts
git commit -m "test(em-spectrum): add unit tests for pure UI logic"
```

---

## Task 8: Add edge-case tests for PhotonModel

**Files:**
- Modify: `packages/physics/src/photonModel.test.ts`

**Step 1: Add edge-case tests**

The existing 5 PhotonModel tests are good but lack edge-case coverage that the em-spectrum demo relies on. Add tests for:

```typescript
  // --- Edge cases ---

  it("returns NaN for zero wavelength", () => {
    expect(PhotonModel.frequencyHzFromWavelengthNm(0)).toBeNaN();
    expect(PhotonModel.photonEnergyEvFromWavelengthNm(0)).toBeNaN();
  });

  it("returns NaN for negative wavelength", () => {
    expect(PhotonModel.frequencyHzFromWavelengthNm(-500)).toBeNaN();
    expect(PhotonModel.photonEnergyEvFromWavelengthNm(-500)).toBeNaN();
  });

  it("returns NaN for NaN input", () => {
    expect(PhotonModel.frequencyHzFromWavelengthNm(NaN)).toBeNaN();
    expect(PhotonModel.photonEnergyEvFromWavelengthNm(NaN)).toBeNaN();
  });

  it("handles extreme radio wavelengths (10 km = 2.1e14 nm)", () => {
    const nuHz = PhotonModel.frequencyHzFromWavelengthNm(2.1e14);
    expect(nuHz).toBeGreaterThan(0);
    expect(nuHz).toBeLessThan(1e5); // should be ~1.4 kHz
  });

  it("handles extreme gamma-ray wavelengths (10 fm = 1e-5 nm)", () => {
    const energyEv = PhotonModel.photonEnergyEvFromWavelengthNm(1e-5);
    expect(energyEv).toBeGreaterThan(1e8); // >100 MeV
  });

  it("round-trips frequency -> energy -> frequency", () => {
    const freqHz = 5e14; // visible light
    const energyEv = PhotonModel.photonEnergyEvFromFrequencyHz(freqHz);
    const backFreqHz = PhotonModel.frequencyHzFromPhotonEnergyEv(energyEv);
    expect(Math.abs(backFreqHz - freqHz) / freqHz).toBeLessThan(1e-12);
  });
```

**Step 2: Run physics tests**

Run: `corepack pnpm -C packages/physics test -- --run src/photonModel.test.ts 2>&1 | tail -10`

Expected: All 11 tests PASS (5 existing + 6 new).

**Step 3: Commit**

```bash
git add packages/physics/src/photonModel.test.ts
git commit -m "test(physics): add edge-case tests for PhotonModel"
```

---

## Task 9: Run full demo + physics test suite

**Files:**
- No files modified — verification only

**Step 1: Run physics tests**

Run: `corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5`
Expected: All pass (including 11 PhotonModel tests).

**Step 2: Run all demo Vitest tests**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -20`
Expected: All pass (moon-phases + angular-size + parallax-distance + seasons + blackbody-radiation + telescope-resolution + em-spectrum).

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

## Task 10: Write Playwright E2E tests

**Files:**
- Create: `apps/site/tests/em-spectrum.spec.ts`

**Step 1: Create the E2E test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("EM Spectrum -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/em-spectrum/", { waitUntil: "domcontentloaded" });
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

  test("spectrum bar is present", async ({ page }) => {
    await expect(page.locator(".spectrum__bar")).toBeVisible();
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("em-spectrum-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: radio band selected", async ({ page }) => {
    await page.locator('.band[data-band="radio"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("em-spectrum-radio.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: convert panel active", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("em-spectrum-convert.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Band Buttons ---

  test("seven band buttons are present", async ({ page }) => {
    const buttons = page.locator(".band");
    await expect(buttons).toHaveCount(7);
  });

  test("visible band is active by default", async ({ page }) => {
    const visibleBtn = page.locator('.band[data-band="visible"]');
    await expect(visibleBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking a band button activates it and deactivates others", async ({ page }) => {
    const radioBtn = page.locator('.band[data-band="radio"]');
    await radioBtn.click();
    await expect(radioBtn).toHaveAttribute("aria-pressed", "true");
    // Previous active button should now be deactivated
    const visibleBtn = page.locator('.band[data-band="visible"]');
    await expect(visibleBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking a band button updates band badge", async ({ page }) => {
    await page.locator('.band[data-band="xray"]').click();
    const badge = page.locator("#bandBadge");
    await expect(badge).toContainText("X-ray");
  });

  // --- Wavelength Slider ---

  test("wavelength slider updates readouts", async ({ page }) => {
    const before = await page.locator("#readoutWavelength").textContent();
    await page.locator("#wavelengthSlider").fill("100");
    await page.locator("#wavelengthSlider").dispatchEvent("input");
    const after = await page.locator("#readoutWavelength").textContent();
    expect(after).not.toBe(before);
  });

  test("slider changes update band badge", async ({ page }) => {
    // Move to extreme left (radio)
    await page.locator("#wavelengthSlider").fill("10");
    await page.locator("#wavelengthSlider").dispatchEvent("input");
    const badge = await page.locator("#bandBadge").textContent();
    expect(badge).toBe("Radio");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("wavelength readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutWavelength").textContent();
    const unit = await page.locator("#readoutWavelengthUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  // --- Band Card ---

  test("band card shows description for current band", async ({ page }) => {
    await expect(page.locator("#bandDescription")).not.toBeEmpty();
  });

  test("band card shows examples and detectors", async ({ page }) => {
    await expect(page.locator("#bandExamples")).not.toBeEmpty();
    await expect(page.locator("#bandDetection")).not.toBeEmpty();
  });

  // --- Tabs ---

  test("four tabs are present", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);
  });

  test("Lines tab is active by default", async ({ page }) => {
    const linesTab = page.locator("#tabLines");
    await expect(linesTab).toHaveAttribute("aria-selected", "true");
  });

  test("clicking Convert tab shows convert panel", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await expect(page.locator("#panelConvert")).toBeVisible();
    await expect(page.locator("#panelLines")).toBeHidden();
  });

  test("convert panel has three input fields", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await expect(page.locator("#convertWavelengthNm")).toBeVisible();
    await expect(page.locator("#convertFrequencyHz")).toBeVisible();
    await expect(page.locator("#convertEnergyEv")).toBeVisible();
  });

  test("typing wavelength in convert panel updates frequency and energy", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await page.locator("#convertWavelengthNm").fill("500");
    await page.locator("#convertWavelengthNm").dispatchEvent("input");
    const freq = await page.locator("#convertFrequencyHz").inputValue();
    const energy = await page.locator("#convertEnergyEv").inputValue();
    expect(freq).toBeTruthy();
    expect(energy).toBeTruthy();
    expect(Number(freq)).toBeGreaterThan(0);
    expect(Number(energy)).toBeGreaterThan(0);
  });

  // --- Telescopes List ---

  test("clicking Telescopes tab shows telescope list", async ({ page }) => {
    await page.locator("#tabTelescopes").click();
    await expect(page.locator("#panelTelescopes")).toBeVisible();
    const items = page.locator("#telescopeList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  // --- Accordion / Drawer ---

  test("Explore panels accordion is open by default", async ({ page }) => {
    const firstAccordion = page.locator(".cp-accordion").first();
    await expect(firstAccordion).toHaveAttribute("open", "");
    await expect(firstAccordion).toContainText("Explore panels");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
    await expect(modelNotes).toContainText("Model notes");
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

  test("band picker has accessible label", async ({ page }) => {
    const bandPicker = page.locator(".band-picker");
    await expect(bandPicker).toHaveAttribute("aria-label", "EM band");
  });
});
```

**Step 2: Build the site so demo assets are available**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Build succeeds, `apps/site/public/play/em-spectrum/` populated.

**Step 3: Run E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "EM Spectrum" 2>&1 | tail -30`
Expected: All non-skipped E2E tests PASS.

**Step 4: Commit**

```bash
git add apps/site/tests/em-spectrum.spec.ts
git commit -m "test(em-spectrum): add Playwright E2E tests"
```

---

## Task 11: Final gate run

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

## Task 12: Update memory with new counts

**Files:**
- Modify: `/Users/anna/.claude/projects/-Users-anna-Teaching-cosmic-playground/memory/MEMORY.md`

**Step 1: Update migration status**

Add to Demo Migration Status section:
```
- Phase 8: em-spectrum migration + hardening — DONE (15 contract + ~50 logic + ~25 E2E tests, ~10 commits)
```

Update Next:
```
- Next: eclipse-geometry (8th in migration order — geometry)
```

**Step 2: Update test counts**

Add the em-spectrum entry:
```
- em-spectrum: 15 contract + ~50 logic = ~65 tests
```

Update totals accordingly. Also update PhotonModel test count from 5 to 11.

---

## Summary of expected new test counts

| Layer | Count | Description |
|-------|-------|-------------|
| Physics model | 6 new (5 existing → 11) | Edge cases for PhotonModel (zero, negative, NaN, extremes, round-trip) |
| Design contracts | ~15 | Token usage, starfield, readouts, animations, legacy tokens, color literals |
| Logic unit tests | ~50 | clamp, position/wavelength conversions, formatters (wavelength/frequency/energy), band classification, band center, data integrity |
| Playwright E2E | ~25 | Layout, band buttons, slider, readouts, tabs, convert panel, accordion, accessibility |
| **Total new** | **~96** | |

## Key gotchas for this migration

1. **NOT a canvas demo**: Unlike blackbody-radiation and telescope-resolution, em-spectrum uses DOM elements (`.spectrum__bar`, `.spectrum__marker`) for visualization. No Canvas 2D API. Contract tests check CSS on `.spectrum__bar`, not `.stage__canvas`.
2. **Legacy tokens MUST be removed**: `--cp-accent2` and `--cp-accent3` are used in `.spectrum__bar` gradient (line 94-96 of style.css). Replace with `--cp-violet` and `--cp-pink`.
3. **formatEnergyFromErg needs DI callback**: The original uses `AstroUnits.ergToEv` directly. Extract with a DI parameter (like `formatWavelengthCm` in telescope-resolution uses `cmToNm`) so tests don't need to import `@cosmic/physics`.
4. **Readout units set by JavaScript**: Unlike other demos where units are static HTML text, em-spectrum's readout values and units are set dynamically by `renderReadouts()`. Both the HTML spans and the JS update logic need changes.
5. **Tab system is custom**: The explore panels use a custom tab implementation with `role="tab"` / `role="tabpanel"` and arrow-key navigation. E2E tests should verify tab switching.
6. **BANDS data is large**: The 7-band EM spectrum data (107 lines) moves to logic.ts. This is pure data with no DOM dependency, making it testable.
7. **Build validation rejects Unicode math** in demo sources — use ASCII in test comments (no theta, arrows, etc.).
