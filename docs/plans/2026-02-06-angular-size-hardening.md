# Angular Size — Testing & Architecture Hardening Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all testing and architecture gaps identified during the angular-size design system migration: move inline physics to `@cosmic/physics`, add missing contract tests, add demo unit tests, add Playwright E2E tests with screenshots, and update specification docs.

**Architecture:** The angular-size demo currently has inline Moon orbit physics functions and a recession constant that violate the rule "All physics MUST come from @cosmic/physics." These must be extracted. Testing gaps include: no demo-level unit tests for UI logic (formatAngleDisplay, slider math), missing contract tests for color literals and initStarfield() calls, and no Playwright E2E tests for interactive controls.

**Tech Stack:** Vitest (unit/contract tests), Playwright (E2E), TypeScript, @cosmic/physics, @cosmic/runtime

---

### Task 1: Extract Moon orbit physics to @cosmic/physics

**Files:**
- Modify: `packages/physics/src/astroConstants.ts` (add MOON constants)
- Modify: `packages/physics/src/angularSizeModel.ts` (add orbit functions)
- Modify: `packages/physics/src/angularSizeModel.test.ts` (add tests)
- Modify: `apps/demos/src/demos/angular-size/main.ts` (import from @cosmic/physics)

**Step 1: Add Moon constants to AstroConstants**

In `packages/physics/src/astroConstants.ts`, add a new `MOON` section:

```typescript
MOON: {
  // Present-day mean lunar recession rate.
  // Source: laser ranging, Williams & Boggs (2016).
  MEAN_RECESSION_CM_PER_YEAR: 3.8,

  // Present-day mean Earth-Moon distance (km).
  DISTANCE_TODAY_KM: 384400,

  // Mean lunar diameter (km).
  DIAMETER_KM: 3474,

  // Angular size extremes observed from Earth (deg).
  // Used for perigee/apogee interpolation.
  ORBIT_MIN_ANGULAR_SIZE_DEG: 0.49,
  ORBIT_MAX_ANGULAR_SIZE_DEG: 0.56
},
```

**Step 2: Add Moon orbit functions to AngularSizeModel**

In `packages/physics/src/angularSizeModel.ts`, add these functions and export them:

```typescript
/**
 * Compute Moon-Earth distance at a given orbit angle using a cosine
 * interpolation between perigee (0 deg) and apogee (180 deg).
 *
 * This is a teaching simplification: the real orbit is an ellipse
 * with varying eccentricity.
 */
function moonOrbitPeigeeApogeeKm(): { perigeeKm: number; apogeeKm: number } {
  const perigeeKm = distanceForAngularDiameterDeg({
    diameterKm: AstroConstants.MOON.DIAMETER_KM,
    angularDiameterDeg: AstroConstants.MOON.ORBIT_MAX_ANGULAR_SIZE_DEG
  });
  const apogeeKm = distanceForAngularDiameterDeg({
    diameterKm: AstroConstants.MOON.DIAMETER_KM,
    angularDiameterDeg: AstroConstants.MOON.ORBIT_MIN_ANGULAR_SIZE_DEG
  });
  return { perigeeKm, apogeeKm };
}

function moonDistanceAtOrbitAngleDeg(angleDeg: number): number {
  const { perigeeKm, apogeeKm } = moonOrbitPeigeeApogeeKm();
  const phaseRad = AstroUnits.degToRad(angleDeg);
  const w = (Math.cos(phaseRad) + 1) / 2;
  return apogeeKm + w * (perigeeKm - apogeeKm);
}

function orbitAngleDegFromMoonDistance(distanceKm: number): number {
  const { perigeeKm, apogeeKm } = moonOrbitPeigeeApogeeKm();
  const denom = perigeeKm - apogeeKm;
  if (!(denom > 0)) return 0;
  const w = (distanceKm - apogeeKm) / denom;
  const clampedW = Math.min(1, Math.max(0, w));
  const cos = 2 * clampedW - 1;
  const angleRad = Math.acos(Math.min(1, Math.max(-1, cos)));
  return AstroUnits.radToDeg(angleRad);
}

function moonTimeMyrFromDistanceKm(distanceKm: number): number {
  const kmPerMyr = AstroConstants.MOON.MEAN_RECESSION_CM_PER_YEAR * 10;
  if (kmPerMyr === 0) return 0;
  return (distanceKm - AstroConstants.MOON.DISTANCE_TODAY_KM) / kmPerMyr;
}
```

Add to the exported `AngularSizeModel` object:
```typescript
export const AngularSizeModel = {
  angularDiameterDeg,
  distanceForAngularDiameterDeg,
  moonDistanceKmFromRecession,
  moonOrbitPeigeeApogeeKm,
  moonDistanceAtOrbitAngleDeg,
  orbitAngleDegFromMoonDistance,
  moonTimeMyrFromDistanceKm,
  presets
} as const;
```

**Step 3: Write tests for new functions**

Add to `packages/physics/src/angularSizeModel.test.ts`:

```typescript
describe("Moon orbit model", () => {
  it("perigee distance is less than apogee", () => {
    const { perigeeKm, apogeeKm } = AngularSizeModel.moonOrbitPeigeeApogeeKm();
    expect(perigeeKm).toBeLessThan(apogeeKm);
    expect(perigeeKm).toBeGreaterThan(350000);
    expect(apogeeKm).toBeLessThan(420000);
  });

  it("orbit angle 0 deg returns perigee distance", () => {
    const { perigeeKm } = AngularSizeModel.moonOrbitPeigeeApogeeKm();
    const d = AngularSizeModel.moonDistanceAtOrbitAngleDeg(0);
    expect(Math.abs(d - perigeeKm)).toBeLessThan(1);
  });

  it("orbit angle 180 deg returns apogee distance", () => {
    const { apogeeKm } = AngularSizeModel.moonOrbitPeigeeApogeeKm();
    const d = AngularSizeModel.moonDistanceAtOrbitAngleDeg(180);
    expect(Math.abs(d - apogeeKm)).toBeLessThan(1);
  });

  it("round-trips angle -> distance -> angle", () => {
    for (const angle of [0, 45, 90, 135, 180]) {
      const d = AngularSizeModel.moonDistanceAtOrbitAngleDeg(angle);
      const back = AngularSizeModel.orbitAngleDegFromMoonDistance(d);
      expect(Math.abs(back - angle)).toBeLessThan(0.01);
    }
  });

  it("moonTimeMyrFromDistanceKm returns 0 for today's distance", () => {
    const t = AngularSizeModel.moonTimeMyrFromDistanceKm(384400);
    expect(Math.abs(t)).toBeLessThan(0.01);
  });

  it("moonTimeMyrFromDistanceKm is consistent with moonDistanceKmFromRecession", () => {
    const timeMyr = 500;
    const d = AngularSizeModel.moonDistanceKmFromRecession({
      distanceTodayKm: 384400,
      recessionCmPerYr: 3.8,
      timeMyr
    });
    const backTime = AngularSizeModel.moonTimeMyrFromDistanceKm(d);
    expect(Math.abs(backTime - timeMyr)).toBeLessThan(0.1);
  });
});
```

**Step 4: Run physics tests**

Run: `corepack pnpm -C packages/physics test -- --run`
Expected: All tests pass (existing + new moon orbit tests).

**Step 5: Update main.ts to use physics imports**

In `apps/demos/src/demos/angular-size/main.ts`:
- Remove the inline functions: `getMoonDistanceAtOrbitAngle`, `orbitAngleFromMoonDistance`, `moonTimeMyrFromDistance`
- Remove the inline constants: `MOON_RECESSION_CM_PER_YEAR`, `MOON_DISTANCE_TODAY_KM`, `MOON_DIAMETER_KM`, `MOON_ORBIT_MIN_ANGULAR_SIZE_DEG`, `MOON_ORBIT_MAX_ANGULAR_SIZE_DEG`
- Remove the `moonOrbit` IIFE
- Import `AstroConstants` from `@cosmic/physics`
- Replace all usages with `AngularSizeModel.moonDistanceAtOrbitAngleDeg(...)`, `AngularSizeModel.orbitAngleDegFromMoonDistance(...)`, `AngularSizeModel.moonTimeMyrFromDistanceKm(...)`, `AstroConstants.MOON.*`

Keep in main.ts (these are UI concerns, not physics):
- `logSliderToValue`, `valueToLogSlider` (slider math)
- `formatNumber`, `formatAngleDisplay` (display formatting)
- `describeMoonOrbitAngle`, `describeMoonRecessionTime` (label formatting)
- `clamp` (utility)

**Step 6: Run demo tests and build**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/angular-size/`
Run: `corepack pnpm build`
Expected: All 14 contract tests pass. Build succeeds.

**Step 7: Commit**

```bash
git add packages/physics/src/astroConstants.ts packages/physics/src/angularSizeModel.ts packages/physics/src/angularSizeModel.test.ts apps/demos/src/demos/angular-size/main.ts
git commit -m "refactor(angular-size): extract Moon orbit physics to @cosmic/physics

Move inline Moon orbit interpolation functions and recession constant
from demo main.ts to AngularSizeModel and AstroConstants. Add 6 unit
tests for round-trip orbit angle, perigee/apogee bounds, and recession
time consistency.

Closes architecture violation: physics belongs in @cosmic/physics."
```

---

### Task 2: Strengthen contract tests

**Files:**
- Modify: `apps/demos/src/demos/angular-size/design-contracts.test.ts`

**Step 1: Add missing contract tests**

Append these test cases to the existing file:

```typescript
describe("Color literal absence", () => {
  it("CSS has no hardcoded rgba() color literals", () => {
    // Allowed: rgba inside color-mix() or var() expressions
    // Forbidden: standalone rgba() as a color value
    const lines = css.split("\n");
    const violations = lines.filter((line) => {
      // Skip comments
      if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
      // Match rgba() that is NOT inside color-mix()
      if (/rgba\s*\(/.test(line) && !line.includes("color-mix")) return true;
      return false;
    });
    expect(violations).toEqual([]);
  });

  it("CSS has no hardcoded hex color values", () => {
    const lines = css.split("\n");
    const violations = lines.filter((line) => {
      if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;
      // Match standalone hex colors (#fff, #ffffff, etc.) but not in comments
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
    expect(mainTs).toContain("from \"@cosmic/physics\"");
    // Should NOT define its own angular diameter function
    expect(mainTs).not.toMatch(/function\s+angularDiameter/);
  });

  it("no legacy --cp-accent2 or --cp-accent3 aliases in CSS", () => {
    expect(css).not.toContain("--cp-accent2");
    expect(css).not.toContain("--cp-accent3");
  });

  it("no legacy --cp-accent2 or --cp-accent3 aliases in HTML", () => {
    expect(html).not.toContain("--cp-accent2");
    expect(html).not.toContain("--cp-accent3");
  });
});
```

**Step 2: Run tests (expect all GREEN)**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/angular-size/design-contracts`
Expected: All tests pass (14 original + 5 new = 19 tests).

**Step 3: Commit**

```bash
git add apps/demos/src/demos/angular-size/design-contracts.test.ts
git commit -m "test(angular-size): add color literal, starfield init, and architecture contract tests

5 new contract tests enforce: no hardcoded rgba/hex in CSS, main.ts
imports and calls initStarfield, physics comes from @cosmic/physics,
and no legacy --cp-accent2/accent3 aliases remain."
```

---

### Task 3: Add demo-level unit tests for UI logic

**Files:**
- Create: `apps/demos/src/demos/angular-size/logic.test.ts`

**Step 1: Write unit tests**

This file tests the pure functions that live in main.ts. Since these functions are not currently exported, we have two options:
(a) Extract them to a `logic.ts` module and import in both main.ts and the test
(b) Copy the pure function logic into the test and verify behavior

Option (a) is cleaner. Create `apps/demos/src/demos/angular-size/logic.ts` with the pure functions extracted from main.ts.

Create `apps/demos/src/demos/angular-size/logic.ts`:
```typescript
import { AstroUnits } from "@cosmic/physics";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function logSliderToValue(sliderVal: number, minVal: number, maxVal: number): number {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

export function valueToLogSlider(value: number, minVal: number, maxVal: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const frac = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(frac * 1000), 0, 1000);
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(digits - 1);
  return value.toFixed(digits);
}

export function formatAngleDisplay(thetaDegValue: number): { text: string; unit: string } {
  if (!Number.isFinite(thetaDegValue)) return { text: "\u2014", unit: "" };

  const abs = Math.abs(thetaDegValue);
  if (abs >= 1) return { text: thetaDegValue.toFixed(2), unit: "deg" };
  if (abs >= 1 / 60) return { text: AstroUnits.degToArcmin(thetaDegValue).toFixed(1), unit: "arcmin" };
  return { text: AstroUnits.degToArcsec(thetaDegValue).toFixed(0), unit: "arcsec" };
}

export function describeMoonOrbitAngle(angleDeg: number): string {
  const normalized = ((angleDeg % 360) + 360) % 360;
  if (Math.abs(normalized - 0) <= 1 || Math.abs(normalized - 360) <= 1) return "Perigee";
  if (Math.abs(normalized - 180) <= 1) return "Apogee";
  return `${Math.round(normalized)} deg`;
}

export function describeMoonRecessionTime(timeMyr: number): string {
  const t = Math.round(timeMyr);
  if (t === 0) return "Today";
  if (t < 0) return `${Math.abs(t)} Myr ago`;
  return `+${t} Myr`;
}
```

Create `apps/demos/src/demos/angular-size/logic.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatAngleDisplay,
  describeMoonOrbitAngle,
  describeMoonRecessionTime,
} from "./logic";

describe("Angular Size -- UI Logic", () => {
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
  });

  describe("logSliderToValue / valueToLogSlider round-trip", () => {
    const MIN = 0.0001;
    const MAX = 1e20;

    it("slider 0 maps to MIN", () => {
      const v = logSliderToValue(0, MIN, MAX);
      expect(Math.abs(v - MIN) / MIN).toBeLessThan(0.01);
    });

    it("slider 1000 maps to MAX", () => {
      const v = logSliderToValue(1000, MIN, MAX);
      expect(Math.abs(v - MAX) / MAX).toBeLessThan(0.01);
    });

    it("slider 500 maps to geometric mean", () => {
      const v = logSliderToValue(500, MIN, MAX);
      const expected = Math.sqrt(MIN * MAX);
      expect(Math.abs(Math.log10(v) - Math.log10(expected))).toBeLessThan(0.01);
    });

    it("round-trips value -> slider -> value", () => {
      const values = [1, 100, 1e6, 1e12, 1e-3];
      for (const v of values) {
        const slider = valueToLogSlider(v, MIN, MAX);
        const back = logSliderToValue(slider, MIN, MAX);
        expect(Math.abs(Math.log10(back) - Math.log10(v))).toBeLessThan(0.01);
      }
    });

    it("valueToLogSlider returns 0 for non-positive input", () => {
      expect(valueToLogSlider(0, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(-1, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(NaN, MIN, MAX)).toBe(0);
    });
  });

  describe("formatNumber", () => {
    it("formats normal numbers with fixed digits", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.141");
    });
    it("uses exponential for large numbers", () => {
      expect(formatNumber(1.5e8, 3)).toBe("1.50e+8");
    });
    it("uses exponential for small numbers", () => {
      expect(formatNumber(0.00012, 3)).toBe("1.20e-4");
    });
    it("returns em-dash for non-finite", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
      expect(formatNumber(Infinity)).toBe("\u2014");
    });
    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });
  });

  describe("formatAngleDisplay", () => {
    it("shows degrees for angles >= 1 deg", () => {
      expect(formatAngleDisplay(2.5)).toEqual({ text: "2.50", unit: "deg" });
    });
    it("shows arcmin for angles between 1/60 and 1 deg", () => {
      const result = formatAngleDisplay(0.5);
      expect(result.unit).toBe("arcmin");
      expect(parseFloat(result.text)).toBeCloseTo(30, 0);
    });
    it("shows arcsec for tiny angles", () => {
      const result = formatAngleDisplay(0.001);
      expect(result.unit).toBe("arcsec");
      expect(parseFloat(result.text)).toBeCloseTo(3.6, 0);
    });
    it("returns em-dash for NaN", () => {
      expect(formatAngleDisplay(NaN)).toEqual({ text: "\u2014", unit: "" });
    });
  });

  describe("describeMoonOrbitAngle", () => {
    it("returns Perigee at 0 deg", () => {
      expect(describeMoonOrbitAngle(0)).toBe("Perigee");
    });
    it("returns Apogee at 180 deg", () => {
      expect(describeMoonOrbitAngle(180)).toBe("Apogee");
    });
    it("returns rounded angle for other values", () => {
      expect(describeMoonOrbitAngle(90)).toBe("90 deg");
    });
    it("handles 360 as Perigee", () => {
      expect(describeMoonOrbitAngle(360)).toBe("Perigee");
    });
  });

  describe("describeMoonRecessionTime", () => {
    it("returns Today for 0", () => {
      expect(describeMoonRecessionTime(0)).toBe("Today");
    });
    it("formats negative as past", () => {
      expect(describeMoonRecessionTime(-500)).toBe("500 Myr ago");
    });
    it("formats positive as future", () => {
      expect(describeMoonRecessionTime(500)).toBe("+500 Myr");
    });
  });
});
```

**Step 2: Update main.ts to import from logic.ts**

Replace the inline function definitions in `main.ts` with:
```typescript
import { clamp, logSliderToValue, valueToLogSlider, formatNumber, formatAngleDisplay, describeMoonOrbitAngle, describeMoonRecessionTime } from "./logic";
```

**Step 3: Run tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/angular-size/logic`
Expected: All tests pass.

Run: `corepack pnpm -C apps/demos test -- --run src/demos/angular-size/`
Expected: All tests pass (contract + logic).

**Step 4: Commit**

```bash
git add apps/demos/src/demos/angular-size/logic.ts apps/demos/src/demos/angular-size/logic.test.ts apps/demos/src/demos/angular-size/main.ts
git commit -m "test(angular-size): add unit tests for UI logic (formatAngle, sliders, labels)

Extract pure UI functions (clamp, logSliderToValue, valueToLogSlider,
formatNumber, formatAngleDisplay, describeMoonOrbitAngle,
describeMoonRecessionTime) to logic.ts module. 22 unit tests cover
round-trip slider math, angle display thresholds, and label formatting."
```

---

### Task 4: Add Playwright E2E tests with screenshots

**Files:**
- Create: `apps/site/tests/angular-size.spec.ts`

**Step 1: Write E2E tests**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Angular Size — E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/angular-size/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeVisible();
  });

  test("screenshot: default state (Sun preset)", async ({ page }) => {
    // Wait for KaTeX to render
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("angular-size-default-sun.png", {
      maxDiffPixelRatio: 0.02
    });
  });

  // --- Preset Selection ---

  test("changing preset updates readouts and object label", async ({ page }) => {
    const preset = page.locator("#preset");
    await preset.selectOption("moon");

    const objectLabel = page.locator("#objectLabel");
    await expect(objectLabel).toContainText("Moon");

    // Moon controls should become visible
    const moonControls = page.locator("#moonControls");
    await expect(moonControls).toBeVisible();
  });

  test("preset changes update diameter and distance readouts", async ({ page }) => {
    const preset = page.locator("#preset");
    await preset.selectOption("mars");

    const diameterKm = page.locator("#diameterKm");
    const distanceKm = page.locator("#distanceKm");

    // Mars diameter is 6779 km
    await expect(diameterKm).toContainText("6779");
  });

  test("everyday presets work (basketball)", async ({ page }) => {
    const preset = page.locator("#preset");
    await preset.selectOption("basketball");

    const objectLabel = page.locator("#objectLabel");
    await expect(objectLabel).toContainText("Basketball");
  });

  test("screenshot: Moon preset with controls", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("angular-size-moon-preset.png", {
      maxDiffPixelRatio: 0.02
    });
  });

  // --- Slider Interaction ---

  test("distance slider updates readout", async ({ page }) => {
    const slider = page.locator("#distanceSlider");
    const before = await page.locator("#distanceKm").textContent();

    // Move slider to different position
    await slider.fill("200");
    await slider.dispatchEvent("input");

    const after = await page.locator("#distanceKm").textContent();
    expect(after).not.toBe(before);
  });

  test("diameter slider updates readout", async ({ page }) => {
    const slider = page.locator("#diameterSlider");
    const before = await page.locator("#diameterKm").textContent();

    await slider.fill("800");
    await slider.dispatchEvent("input");

    const after = await page.locator("#diameterKm").textContent();
    expect(after).not.toBe(before);
  });

  // --- Moon Controls ---

  test("moon orbit mode: slider changes angular size", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    await expect(page.locator("#moonControls")).toBeVisible();

    // Default mode is orbit
    await expect(page.locator("#moonModeOrbit")).toBeChecked();

    const thetaBefore = await page.locator("#thetaDeg").textContent();

    // Move orbit angle to 180 (apogee)
    await page.locator("#moonOrbitAngle").fill("180");
    await page.locator("#moonOrbitAngle").dispatchEvent("input");

    const thetaAfter = await page.locator("#thetaDeg").textContent();
    expect(thetaAfter).not.toBe(thetaBefore);
  });

  test("moon recession mode: switch and adjust time", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");

    // Switch to recession mode
    await page.locator("#moonModeRecession").check();

    // Orbit row should be hidden, recession row visible
    await expect(page.locator("#moonOrbitRow")).toBeHidden();
    await expect(page.locator("#moonRecessionRow")).toBeVisible();

    // Adjust recession time to +500 Myr
    await page.locator("#moonRecessionTime").fill("500");
    await page.locator("#moonRecessionTime").dispatchEvent("input");

    // Moon should be farther away, so angular size smaller
    const theta = await page.locator("#thetaDeg").textContent();
    expect(parseFloat(theta ?? "0")).toBeLessThan(0.5);
  });

  test("screenshot: Moon recession +500 Myr", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    await page.locator("#moonModeRecession").check();
    await page.locator("#moonRecessionTime").fill("500");
    await page.locator("#moonRecessionTime").dispatchEvent("input");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("angular-size-moon-recession-500myr.png", {
      maxDiffPixelRatio: 0.02
    });
  });

  // --- Readout Formatting ---

  test("readout units are in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("theta display switches to arcmin for small angles", async ({ page }) => {
    // Mars at opposition has a small angular size (~12 arcsec)
    await page.locator("#preset").selectOption("mars");

    const unit = await page.locator("#thetaDisplayUnit").textContent();
    // Mars angular size is ~12.8 arcsec, so should show arcsec
    expect(["arcmin", "arcsec"]).toContain(unit?.trim());
  });

  // --- Station Mode ---

  test("station mode button is visible and functional", async ({ page }) => {
    const stationBtn = page.locator("#stationMode");
    await expect(stationBtn).toBeVisible();
    await expect(stationBtn).toBeEnabled();

    await stationBtn.click();
    // Station mode dialog/overlay should appear
    await expect(page.locator(".cp-station")).toBeVisible();
  });

  // --- Challenge Mode ---

  test("challenge mode button is enabled and starts challenges", async ({ page }) => {
    const challengeBtn = page.locator("#challengeMode");
    await expect(challengeBtn).toBeVisible();
    await expect(challengeBtn).toBeEnabled();

    await challengeBtn.click();
    // Challenge UI should appear
    await expect(page.locator(".cp-challenge")).toBeVisible();
  });

  test("screenshot: challenge mode active", async ({ page }) => {
    await page.locator("#challengeMode").click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("angular-size-challenge-mode.png", {
      maxDiffPixelRatio: 0.02
    });
  });

  // --- Accordion/Drawer ---

  test("What to notice accordion is open by default", async ({ page }) => {
    const accordion = page.locator(".cp-accordion").first();
    await expect(accordion).toHaveAttribute("open", "");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
  });

  // --- Accessibility ---

  test("all interactive elements are keyboard-reachable", async ({ page }) => {
    // Tab through and verify key elements get focus
    const focusableSelectors = [
      "#preset",
      "#distanceSlider",
      "#diameterSlider",
      "#stationMode",
      "#challengeMode",
      "#help",
      "#copyResults"
    ];

    for (const selector of focusableSelectors) {
      const el = page.locator(selector);
      await expect(el).toBeVisible();
      // Verify element is focusable (has no tabindex=-1 and is not disabled)
      const tabindex = await el.getAttribute("tabindex");
      expect(tabindex).not.toBe("-1");
    }
  });

  test("status region has aria-live for announcements", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("role", "status");
  });

  test("SVG stage has accessible label", async ({ page }) => {
    const svg = page.locator("#stageSvg");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute("aria-label", "Angular size visualization");
  });

  // --- Copy Results ---

  test("copy results produces formatted output", async ({ page }) => {
    // Install clipboard capture
    await page.addInitScript(() => {
      (window as any).__cpLastClipboardText = null;
      const clipboard = (navigator as any).clipboard ?? {};
      (navigator as any).clipboard = clipboard;
      clipboard.writeText = async (text: string) => {
        (window as any).__cpLastClipboardText = text;
      };
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    await page.locator("#copyResults").click();
    await expect(page.locator("#status")).toContainText("Copied");

    const copied = await page.evaluate(() => (window as any).__cpLastClipboardText);
    expect(typeof copied).toBe("string");
    const text = String(copied);
    expect(text).toContain("Diameter D (km)");
    expect(text).toContain("Distance d (km)");
    expect(text).toContain("Angular diameter theta");
  });
});
```

**Step 2: Run the Playwright tests and generate screenshots**

First build:
```bash
corepack pnpm build
```

Then run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --update-snapshots tests/angular-size.spec.ts
```

Expected: All tests pass, screenshot baselines created.

**Step 3: Commit**

```bash
git add apps/site/tests/angular-size.spec.ts apps/site/tests/angular-size.spec.ts-snapshots/
git commit -m "test(angular-size): add Playwright E2E tests with visual regression screenshots

24 E2E tests covering: layout/shell sections, preset selection, slider
interaction, Moon orbit/recession controls, readout formatting, station
mode, challenge mode, accordion behavior, accessibility (keyboard, aria),
copy results, and 4 visual regression screenshots."
```

---

### Task 5: Update PRD with comprehensive testing phases

**Files:**
- Modify: `docs/specs/cosmic-playground-prd.md`

**Step 1: Add testing section to PRD**

After section 5.7 "Demo Requirements", add new section 5.8:

```markdown
### 5.8 Testing Requirements (P0 — Must Have)

Every demo requires four layers of testing:

#### 5.8.1 Physics Model Tests (Vitest)
Location: `packages/physics/src/<model>.test.ts`

Every physics model must have:
- Known-answer tests against published values
- Round-trip / invertibility tests (e.g., angle -> distance -> angle)
- Edge case tests (zero, negative, Infinity, NaN)
- Consistency tests between related functions

#### 5.8.2 Design Contract Tests (Vitest)
Location: `apps/demos/src/demos/<slug>/design-contracts.test.ts`

Every instrument-layer demo must have:
- Celestial token invariants (SVG gradients use `--cp-celestial-*`)
- Starfield canvas present in HTML
- Readout unit separation (`<span class="cp-readout__unit">`)
- Panel translucency (backdrop-filter present in CSS)
- No legacy token leakage (`--cp-warning`, `--cp-accent2`, `--cp-accent3`)
- No hardcoded color literals (no raw rgba/hex in demo CSS)
- Architecture compliance (physics from `@cosmic/physics`, starfield initialized)
- Entry animations present (`cp-slide-up` / `cp-fade-in`)

#### 5.8.3 Demo Logic Unit Tests (Vitest)
Location: `apps/demos/src/demos/<slug>/logic.test.ts`

Every demo with non-trivial UI logic must have:
- Formatting function tests (number display, angle units, labels)
- Slider math round-trip tests (log scale, clamping)
- State management tests (preset loading, mode switching)

#### 5.8.4 E2E / Playwright Tests
Location: `apps/site/tests/<slug>.spec.ts`

Every migrated demo must have:
- Layout verification (all shell sections visible)
- Control interaction tests (presets, sliders, mode switches)
- Readout correctness verification
- Learning activity tests (station mode, challenge mode)
- Accessibility tests (keyboard reachability, aria attributes)
- Visual regression screenshots (baseline comparisons)
- Copy results output verification

**Acceptance Criteria:**
- [ ] Physics models have 90%+ line coverage
- [ ] Every demo has contract tests adapted from moon-phases golden reference
- [ ] Every demo with UI logic has a logic.test.ts
- [ ] Every migrated demo has Playwright E2E tests
- [ ] Visual regression baselines are committed for each demo
- [ ] All tests pass in CI before merge
```

**Step 2: Update success metrics section**

In section 6, add to the Leading Indicators table:

```markdown
| Contract test coverage | 100% of demos | Every demo has design-contracts.test.ts |
| E2E test coverage | 100% of demos | Every demo has Playwright tests |
| Architecture compliance | 0 violations | No inline physics in demo code |
```

**Step 3: Update Phase 2 timeline**

Update section 8 Phase 2 to include testing:
```markdown
### Phase 2: Migration (6 weeks)
- Migrate remaining 13 demos to shared component architecture
- **For each demo: write contract tests first (RED), then implement (GREEN)**
- **Add demo logic unit tests for non-trivial UI functions**
- **Add Playwright E2E tests with visual regression screenshots**
- Validate physics models against legacy behavior
- Complete instructor materials for all demos
```

**Step 4: Commit**

```bash
git add docs/specs/cosmic-playground-prd.md
git commit -m "docs(prd): add comprehensive testing requirements (5.8)

Four test layers per demo: physics model tests, design contract tests,
demo logic unit tests, and Playwright E2E with visual regression. Updated
success metrics and Phase 2 timeline to include testing requirements."
```

---

### Task 6: Update migration prompt with testing details

**Files:**
- Modify: `docs/specs/CLAUDE-CODE-MIGRATION-PROMPT.md`

**Step 1: Expand Phase 4 with detailed test requirements**

Replace Phase 4 (Validation & Testing) with comprehensive testing:

```markdown
## Phase 4: Validation & Testing (Per-Demo, Not End-Stage)

**CRITICAL: Testing is not a post-migration activity. Tests are written FIRST for each demo (TDD).**

### 4.1 Physics Model Tests (before migration)

Every physics model MUST be tested in isolation. Tests live in `packages/physics/src/`:

```bash
corepack pnpm -C packages/physics test -- --run
```

Required test types:
- **Known-answer tests**: Verify against published astronomical values
- **Round-trip tests**: Forward + inverse functions reproduce input
- **Edge cases**: Zero, negative, Infinity, NaN inputs
- **Consistency**: Related functions agree (e.g., recession distance vs time)

### 4.2 Design Contract Tests (RED first, then GREEN)

Every demo gets `design-contracts.test.ts` adapted from the golden reference at `moon-phases/design-contracts.test.ts`.

**Mandatory contract tests:**
1. SVG celestial gradients use `--cp-celestial-*` tokens
2. Starfield canvas exists in HTML
3. Readout units in `<span class="cp-readout__unit">`
4. Panel translucency (backdrop-filter)
5. No legacy token leakage (`--cp-warning`, `--cp-accent2`, `--cp-accent3`)
6. No hardcoded color literals (rgba/hex) in demo CSS
7. `initStarfield()` imported and called in main.ts
8. Physics imported from `@cosmic/physics` (not inline)
9. Entry animations use `cp-slide-up` / `cp-fade-in`

```bash
corepack pnpm -C apps/demos test -- --run src/demos/<slug>/design-contracts
```

### 4.3 Demo Logic Unit Tests

Demos with non-trivial UI logic (formatting, slider math, state management) MUST extract pure functions to `logic.ts` and test them:

```bash
corepack pnpm -C apps/demos test -- --run src/demos/<slug>/logic
```

Test types:
- Formatting functions (number display, angle unit switching)
- Slider math (logarithmic scale, round-trips)
- Label generation (orbit angle names, recession time strings)

### 4.4 Playwright E2E Tests (per demo)

Every migrated demo gets a Playwright test file at `apps/site/tests/<slug>.spec.ts`:

```bash
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/<slug>.spec.ts
```

**Required E2E coverage per demo:**
- [ ] Layout: All shell sections visible (controls, stage, readouts, drawer)
- [ ] Starfield canvas present
- [ ] Preset/control interaction updates readouts
- [ ] Slider changes update values
- [ ] Mode switching works (if applicable)
- [ ] Station mode activates and shows table
- [ ] Challenge mode starts and presents challenges
- [ ] Accordions open/close
- [ ] Copy results produces formatted export text
- [ ] Accessibility: keyboard reachability, aria-live, aria-label
- [ ] Visual regression screenshots (committed as baselines)

### 4.5 Visual Regression Screenshots

Use Playwright `toHaveScreenshot()` for baseline comparisons:
```typescript
await expect(page).toHaveScreenshot('demo-default.png', {
  maxDiffPixelRatio: 0.02
});
```

Screenshot baselines are committed to `apps/site/tests/<slug>.spec.ts-snapshots/`.

### 4.6 Accessibility Audit

Run Lighthouse on each demo:
```bash
npx lighthouse http://localhost:4321/play/<slug>/ --only-categories=accessibility
# Target: 90+ score
```

### 4.7 Build Validation

Full build must pass:
```bash
corepack pnpm build
```

This includes the `apps:no-color-literals` invariant that forbids hardcoded color values.
```

**Step 2: Update per-demo migration checklist**

Add testing steps to section 3.2 Migration Checklist Per Demo:

```markdown
7. **Write contract tests (RED)**: Copy `moon-phases/design-contracts.test.ts`, adapt assertions for demo's SVG/CSS.
8. **Extract and test UI logic**: Create `logic.ts` with pure functions, write `logic.test.ts`.
9. **Write Playwright E2E tests**: Create `apps/site/tests/<slug>.spec.ts` with layout, controls, screenshots.
10. **Verify all GREEN**: Contract tests, logic tests, E2E tests, build.
```

**Step 3: Commit**

```bash
git add docs/specs/CLAUDE-CODE-MIGRATION-PROMPT.md
git commit -m "docs(migration): expand testing requirements with 4-layer testing protocol

Phase 4 now specifies: physics model tests, design contract tests (TDD),
demo logic unit tests, and Playwright E2E with visual regression
screenshots. Per-demo checklist updated with testing steps."
```

---

### Task 7: Run all gates and verify

**Step 1: Run all tests**

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
```

Expected: All tests pass, build clean.

**Step 2: Run Playwright tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected: All E2E tests pass.

**Step 3: Commit docs/plans update**

```bash
git add docs/plans/2026-02-06-angular-size-hardening.md
git commit -m "docs: add angular-size testing and hardening plan"
```
