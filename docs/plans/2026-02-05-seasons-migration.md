# Seasons Demo Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully migrate the seasons demo to the design system, extract testable logic, harden physics tests, and add E2E coverage.

**Architecture:** The seasons demo already has working HTML/CSS/TS with physics from `@cosmic/physics` and runtime integration (station mode, challenge engine). The migration adds: starfield canvas, celestial token compliance, readout unit separation, entry animations, glow effects, logic extraction to `logic.ts`, contract tests, and Playwright E2E tests.

**Tech Stack:** TypeScript, Vitest, Playwright, CSS custom properties, SVG

---

## Current State Assessment

The seasons demo (`apps/demos/src/demos/seasons/`) is partially migrated:
- **Working:** HTML structure (triad layout), physics via `SeasonsModel`, runtime (station mode, challenge mode, copy results), keyboard shortcuts, animation loop
- **Missing:** Starfield canvas, celestial tokens (8 legacy violations), readout unit spans, entry animations, glow effects, logic.ts extraction, design contract tests, Playwright E2E tests
- **Legacy tokens to fix:** `--cp-warning` (5 uses in CSS + 2 in HTML SVG defs), `--cp-accent3` (3 uses in CSS)
- **Physics tests:** Only 5 tests — needs edge cases (polar latitudes, zero tilt, midnight sun/polar night)

---

## Task 1: Harden physics model tests

**Files:**
- Modify: `packages/physics/src/seasonsModel.test.ts`

**Step 1: Add edge case tests to the existing file**

Add these tests after the existing 5 tests in `seasonsModel.test.ts`:

```typescript
  it("returns 0 deg declination for 0 deg tilt at any day", () => {
    for (const day of [1, 80, 172, 266, 356]) {
      expect(
        SeasonsModel.sunDeclinationDeg({ dayOfYear: day, axialTiltDeg: 0 })
      ).toBeCloseTo(0, 10);
    }
  });

  it("returns 24h day length at north pole in northern summer", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 172, axialTiltDeg: 23.5 });
    const dayLen = SeasonsModel.dayLengthHours({ latitudeDeg: 90, sunDeclinationDeg: decl });
    expect(dayLen).toBe(24);
  });

  it("returns 0h day length at north pole in northern winter", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 356, axialTiltDeg: 23.5 });
    const dayLen = SeasonsModel.dayLengthHours({ latitudeDeg: 90, sunDeclinationDeg: decl });
    expect(dayLen).toBe(0);
  });

  it("day length is symmetric about equator at equinox", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 80, axialTiltDeg: 23.5 });
    const dayN = SeasonsModel.dayLengthHours({ latitudeDeg: 40, sunDeclinationDeg: decl });
    const dayS = SeasonsModel.dayLengthHours({ latitudeDeg: -40, sunDeclinationDeg: decl });
    expect(dayN).toBeCloseTo(dayS, 1);
  });

  it("noon altitude at equator on equinox is 90 deg", () => {
    const alt = SeasonsModel.sunNoonAltitudeDeg({ latitudeDeg: 0, sunDeclinationDeg: 0 });
    expect(alt).toBe(90);
  });

  it("noon altitude at latitude = declination is 90 deg (subsolar)", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 172, axialTiltDeg: 23.5 });
    const alt = SeasonsModel.sunNoonAltitudeDeg({ latitudeDeg: decl, sunDeclinationDeg: decl });
    expect(alt).toBe(90);
  });

  it("earthSunDistanceAu is minimum at perihelion, maximum ~6 months later", () => {
    const rPeri = SeasonsModel.earthSunDistanceAu({ dayOfYear: 3 });
    const rAphe = SeasonsModel.earthSunDistanceAu({ dayOfYear: 186 });
    expect(rPeri).toBeLessThan(1);
    expect(rAphe).toBeGreaterThan(1);
    expect(rAphe).toBeGreaterThan(rPeri);
  });

  it("orbitAngleRadFromDay returns 0 at perihelion", () => {
    expect(SeasonsModel.orbitAngleRadFromDay({ dayOfYear: 3 })).toBeCloseTo(0, 10);
  });

  it("orbitAngleRadFromDay increases monotonically through the year", () => {
    let prev = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: 4 });
    for (let d = 5; d <= 365; d++) {
      const cur = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: d });
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });

  it("effectiveObliquityDegrees folds large tilt to 0-90 range", () => {
    expect(SeasonsModel.effectiveObliquityDegrees(0)).toBe(0);
    expect(SeasonsModel.effectiveObliquityDegrees(90)).toBe(90);
    expect(SeasonsModel.effectiveObliquityDegrees(180)).toBeCloseTo(0, 10);
    expect(SeasonsModel.effectiveObliquityDegrees(270)).toBeCloseTo(90, 10);
  });
```

**Step 2: Run tests to verify they pass**

Run: `corepack pnpm -C packages/physics test -- --run src/seasonsModel.test.ts 2>&1`
Expected: All 15 tests PASS.

**Step 3: Commit**

```bash
git add packages/physics/src/seasonsModel.test.ts
git commit -m "test(physics): harden SeasonsModel with edge cases (polar, zero-tilt, distance)"
```

---

## Task 2: Write design contract tests (RED phase)

**Files:**
- Create: `apps/demos/src/demos/seasons/design-contracts.test.ts`

**Step 1: Create the contract test file**

Copy the pattern from `parallax-distance/design-contracts.test.ts` and adapt for seasons-specific elements:

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Seasons
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

describe("Seasons -- Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Celestial token invariants", () => {
    it("sun uses --cp-celestial-sun tokens, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__sun[\s\S]*?--cp-warning/);
      expect(html).not.toContain('stop-color="var(--cp-warning)"');
    });

    it("earth uses --cp-celestial-earth, not --cp-accent3 or --cp-chart-1", () => {
      expect(css).not.toMatch(/\.stage__earth[\s\S]*?--cp-accent3/);
      expect(html).not.toContain('stop-color="var(--cp-chart-1)"');
    });

    it("orbit uses --cp-celestial-orbit, not --cp-accent3", () => {
      expect(css).not.toMatch(/\.stage__orbit[\s\S]*?--cp-accent3/);
    });

    it("axis uses semantic token, not --cp-accent3", () => {
      expect(css).not.toMatch(/\.stage__axis[\s\S]*?--cp-accent3/);
    });

    it("sun rays use --cp-celestial-sun, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__ray[\s\S]*?--cp-warning/);
    });

    it("subsolar marker uses --cp-celestial-sun, not --cp-warning", () => {
      expect(css).not.toMatch(/\.stage__markerSun[\s\S]*?--cp-warning/);
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
      // Seasons has: declination (deg), day length (h), noon altitude (deg), distance (AU) = 4 unit spans
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(4);
    });

    it("readout labels do not contain parenthesized units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      const parenthesizedUnits = labels.filter((l) => /\((?:deg|h|AU)\)/.test(l));
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
      // Should NOT define its own declination function
      expect(mainTs).not.toMatch(/function\s+sunDeclination/);
    });
  });
});
```

**Step 2: Run tests to verify they FAIL (RED)**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: FAIL — multiple failures (missing starfield, legacy tokens, missing unit spans, missing animations).

**Step 3: Commit the RED tests**

```bash
git add apps/demos/src/demos/seasons/design-contracts.test.ts
git commit -m "test(seasons): add design contract tests (RED -- 18 tests, most failing)"
```

---

## Task 3: Add starfield canvas and initStarfield

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Add starfield canvas to HTML**

Add immediately after the opening `<body>` tag, before the `<div id="cp-demo">`:

```html
    <canvas class="cp-starfield" aria-hidden="true"></canvas>
```

**Step 2: Import and call initStarfield in main.ts**

Add `initStarfield` to the import from `@cosmic/runtime` (line 1):

```typescript
import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
```

Add starfield initialization at the end of `main.ts`, before the `initMath(document)` call:

```typescript
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
```

**Step 3: Run contract tests to verify starfield tests pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: Starfield-related tests now PASS; others still fail.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/seasons/index.html apps/demos/src/demos/seasons/main.ts
git commit -m "feat(seasons): add starfield canvas and initStarfield call"
```

---

## Task 4: Migrate SVG tokens to celestial palette

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`

**Step 1: Replace SVG gradient tokens in HTML**

In `index.html`, replace the `<defs>` section (lines 102-111):

Replace `sunGlow` gradient:
- `stop-color="var(--cp-warning)"` → `stop-color="var(--cp-celestial-sun)"`

Replace `earthGlow` gradient:
- `stop-color="var(--cp-chart-1)"` → `stop-color="var(--cp-celestial-earth)"`

**Step 2: Replace legacy CSS tokens in style.css**

These are the exact replacements needed:

| Line | Old | New |
|------|-----|-----|
| 64 | `var(--cp-accent3)` | `var(--cp-celestial-orbit)` |
| 70 | `var(--cp-warning)` | `var(--cp-celestial-sun)` |
| 78 | `var(--cp-accent3)` | `var(--cp-celestial-earth)` |
| 84 | `var(--cp-warning)` | `var(--cp-celestial-sun)` |
| 91 | `var(--cp-accent3)` | `var(--cp-celestial-earth)` |
| 112 | `var(--cp-warning)` | `var(--cp-celestial-sun)` |

Specifically:
- `.stage__orbit` stroke: `--cp-accent3` → `--cp-celestial-orbit`
- `.stage__sun` stroke: `--cp-warning` → `--cp-celestial-sun`
- `.stage__earth, .stage__earthDisk` stroke: `--cp-accent3` → `--cp-celestial-earth`
- `.stage__ray` stroke: `--cp-warning` → `--cp-celestial-sun`
- `.stage__axis` stroke: `--cp-accent3` → `--cp-celestial-earth`
- `.stage__markerSun` fill: `--cp-warning` → `--cp-celestial-sun`

**Step 3: Run contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: Celestial token and legacy token tests now PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/seasons/index.html apps/demos/src/demos/seasons/style.css
git commit -m "feat(seasons): migrate SVG tokens to --cp-celestial-* palette"
```

---

## Task 5: Separate readout units into .cp-readout__unit spans

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Update HTML readout structure**

For the 4 dimensional readouts, update the HTML to have separate unit spans.

Declination readout (line 167-168):
```html
            <div class="cp-readout__label">Solar declination $\delta$</div>
            <div class="cp-readout__value"><span id="declinationValue"></span> <span class="cp-readout__unit">deg</span></div>
```

Day length readout (line 170-171):
```html
            <div class="cp-readout__label">Day length</div>
            <div class="cp-readout__value"><span id="dayLengthValue"></span> <span class="cp-readout__unit">h</span></div>
```

Noon altitude readout (line 173-174):
```html
            <div class="cp-readout__label">Noon altitude</div>
            <div class="cp-readout__value"><span id="noonAltitudeValue"></span> <span class="cp-readout__unit">deg</span></div>
```

Distance readout (line 177-178):
```html
            <div class="cp-readout__label">Earth-Sun distance $r$</div>
            <div class="cp-readout__value"><span id="distanceAuValue"></span> <span class="cp-readout__unit">AU</span></div>
```

Note: Remove `(AU)` from the distance label since it's now in the unit span. The label says `$r$` which is sufficient.

**Step 2: Update main.ts render to not include unit suffixes in value text**

In the `render()` function (around lines 467-470), change:

```typescript
  declinationValue.textContent = `${formatNumber(declinationDegValue, 1)}`;
  dayLengthValue.textContent = `${formatNumber(dayLengthHoursValue, 2)}`;
  noonAltitudeValue.textContent = `${formatNumber(noonAltitudeDegValue, 1)}`;
  distanceAuValue.textContent = `${formatNumber(distanceAu, 3)}`;
```

(Remove the ` deg`, ` h`, ` AU` suffixes from the textContent assignments — they're now in the HTML unit spans.)

**Step 3: Run contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: Readout unit separation tests PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/seasons/index.html apps/demos/src/demos/seasons/main.ts
git commit -m "feat(seasons): separate readout units into .cp-readout__unit spans"
```

---

## Task 6: Add celestial glow drop-shadow effects

**Files:**
- Modify: `apps/demos/src/demos/seasons/style.css`

**Step 1: Add glow effects to celestial objects**

Add `filter: drop-shadow(...)` to the sun and earth classes:

```css
.stage__sun {
  fill: url(#sunGlow);
  stroke: var(--cp-celestial-sun);
  stroke-opacity: 0.5;
  stroke-width: 2px;
  filter: drop-shadow(var(--cp-glow-sun));
}

.stage__earth,
.stage__earthDisk {
  fill: url(#earthGlow);
  stroke: color-mix(in srgb, var(--cp-celestial-earth) 58%, transparent);
  stroke-width: 2px;
  filter: drop-shadow(var(--cp-glow-planet));
}
```

**Step 2: Verify visually (no test for this — glow is aesthetic)**

Run: `corepack pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/seasons/style.css
git commit -m "feat(seasons): add celestial glow drop-shadow effects to sun and earth"
```

---

## Task 7: Add staggered entry animations

**Files:**
- Modify: `apps/demos/src/demos/seasons/style.css`

**Step 1: Add entry animation styles**

Append to `style.css`:

```css
/* ── Entry animations ──────────────────────── */
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
  animation: cp-fade-in var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 3);
}
```

**Step 2: Run contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: Entry animation tests PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/seasons/style.css
git commit -m "feat(seasons): add staggered entry animations (cp-slide-up/cp-fade-in)"
```

---

## Task 8: Run all contract tests — verify GREEN

**Files:**
- Read results only

**Step 1: Run all seasons contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: All 18 tests PASS (GREEN).

**Step 2: Run full demo test suite**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -10`
Expected: All demo tests pass (moon-phases + angular-size + parallax-distance + keplers-laws + seasons).

**Step 3: Run build**

Run: `corepack pnpm build 2>&1 | tail -10`
Expected: Clean build with no errors.

---

## Task 9: Extract pure UI logic to logic.ts

**Files:**
- Create: `apps/demos/src/demos/seasons/logic.ts`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Create logic.ts with pure functions**

Extract these functions from `main.ts` into `logic.ts`:

```typescript
/**
 * Pure UI logic for the seasons demo.
 * No DOM access -- all functions are testable in isolation.
 */

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

const MONTHS = [
  { name: "Jan", days: 31 },
  { name: "Feb", days: 28 },
  { name: "Mar", days: 31 },
  { name: "Apr", days: 30 },
  { name: "May", days: 31 },
  { name: "Jun", days: 30 },
  { name: "Jul", days: 31 },
  { name: "Aug", days: 31 },
  { name: "Sep", days: 30 },
  { name: "Oct", days: 31 },
  { name: "Nov", days: 30 },
  { name: "Dec", days: 31 },
] as const;

export function formatDateFromDayOfYear(day: number): string {
  let d = clamp(Math.round(day), 1, 365);
  for (const m of MONTHS) {
    if (d <= m.days) return `${m.name} ${d}`;
    d -= m.days;
  }
  return "Dec 31";
}

export function seasonFromPhaseNorth(dayOfYear: number): Season {
  const yearDays = 365.2422;
  const dayOfMarchEquinox = 80;
  const phase = ((dayOfYear - dayOfMarchEquinox) / yearDays) % 1;
  const wrapped = phase < 0 ? phase + 1 : phase;
  const quadrant = Math.floor(wrapped * 4) % 4;
  if (quadrant === 0) return "Spring";
  if (quadrant === 1) return "Summer";
  if (quadrant === 2) return "Autumn";
  return "Winter";
}

export function oppositeSeason(season: Season): Season {
  if (season === "Spring") return "Autumn";
  if (season === "Autumn") return "Spring";
  if (season === "Summer") return "Winter";
  return "Summer";
}

/**
 * Compute the earth's position on the orbit diagram.
 * Returns { x, y } in the orbit SVG coordinate system.
 */
export function orbitPosition(
  angleRad: number,
  distanceAu: number,
  orbitR: number
): { x: number; y: number } {
  const rScaled = orbitR * clamp(distanceAu, 0.95, 1.05);
  return {
    x: rScaled * Math.cos(angleRad),
    y: rScaled * Math.sin(angleRad),
  };
}

/**
 * Compute the axis endpoint coordinates for the tilt diagram.
 * Returns { x, y } for the positive end (negate for the other end).
 */
export function axisEndpoint(axialTiltDeg: number, length: number): { x: number; y: number } {
  const axisRad = (-axialTiltDeg * Math.PI) / 180;
  return {
    x: Math.sin(axisRad) * length,
    y: -Math.cos(axisRad) * length,
  };
}

/**
 * Compute the Y position of a marker on the earth disk
 * given a latitude (or declination) in degrees.
 */
export function diskMarkerY(angleDeg: number, diskR: number, scale = 0.85): number {
  const rad = (angleDeg * Math.PI) / 180;
  return -Math.sin(rad) * scale * diskR;
}
```

**Step 2: Update main.ts to import from logic.ts**

Replace the inline `clamp`, `formatNumber`, `MONTHS`, `formatDateFromDayOfYear`, `seasonFromPhaseNorth`, `oppositeSeason` functions in main.ts with imports from logic.ts:

```typescript
import { clamp, formatNumber, formatDateFromDayOfYear, seasonFromPhaseNorth, oppositeSeason, orbitPosition, axisEndpoint, diskMarkerY } from "./logic";
```

Remove the duplicated function definitions from main.ts (lines 294-344 approximately).

Also update `renderStage` to use the extracted geometry helpers (`orbitPosition`, `axisEndpoint`, `diskMarkerY`).

**Step 3: Verify the build still works**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts 2>&1`
Expected: All contract tests still PASS.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/seasons/logic.ts apps/demos/src/demos/seasons/main.ts
git commit -m "refactor(seasons): extract pure UI logic to logic.ts (humble object pattern)"
```

---

## Task 10: Write unit tests for logic.ts

**Files:**
- Create: `apps/demos/src/demos/seasons/logic.test.ts`

**Step 1: Create the test file**

```typescript
import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  formatDateFromDayOfYear,
  seasonFromPhaseNorth,
  oppositeSeason,
  orbitPosition,
  axisEndpoint,
  diskMarkerY,
} from "./logic";

describe("Seasons -- UI Logic", () => {
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
    it("formats with specified digits", () => {
      expect(formatNumber(3.14159, 2)).toBe("3.14");
    });
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN, 1)).toBe("\u2014");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity, 1)).toBe("\u2014");
    });
  });

  describe("formatDateFromDayOfYear", () => {
    it("day 1 is Jan 1", () => {
      expect(formatDateFromDayOfYear(1)).toBe("Jan 1");
    });
    it("day 31 is Jan 31", () => {
      expect(formatDateFromDayOfYear(31)).toBe("Jan 31");
    });
    it("day 32 is Feb 1", () => {
      expect(formatDateFromDayOfYear(32)).toBe("Feb 1");
    });
    it("day 59 is Feb 28", () => {
      expect(formatDateFromDayOfYear(59)).toBe("Feb 28");
    });
    it("day 60 is Mar 1", () => {
      expect(formatDateFromDayOfYear(60)).toBe("Mar 1");
    });
    it("day 80 is Mar 21 (March equinox anchor)", () => {
      expect(formatDateFromDayOfYear(80)).toBe("Mar 21");
    });
    it("day 172 is Jun 21 (approx June solstice)", () => {
      expect(formatDateFromDayOfYear(172)).toBe("Jun 21");
    });
    it("day 365 is Dec 31", () => {
      expect(formatDateFromDayOfYear(365)).toBe("Dec 31");
    });
    it("clamps day < 1 to Jan 1", () => {
      expect(formatDateFromDayOfYear(0)).toBe("Jan 1");
    });
    it("clamps day > 365 to Dec 31", () => {
      expect(formatDateFromDayOfYear(400)).toBe("Dec 31");
    });
  });

  describe("seasonFromPhaseNorth", () => {
    it("returns Spring at March equinox (day 80)", () => {
      expect(seasonFromPhaseNorth(80)).toBe("Spring");
    });
    it("returns Summer at June solstice (day 172)", () => {
      expect(seasonFromPhaseNorth(172)).toBe("Summer");
    });
    it("returns Autumn at September equinox (day 266)", () => {
      expect(seasonFromPhaseNorth(266)).toBe("Autumn");
    });
    it("returns Winter at December solstice (day 356)", () => {
      expect(seasonFromPhaseNorth(356)).toBe("Winter");
    });
    it("returns Winter in January (day 15)", () => {
      expect(seasonFromPhaseNorth(15)).toBe("Winter");
    });
  });

  describe("oppositeSeason", () => {
    it("Spring <-> Autumn", () => {
      expect(oppositeSeason("Spring")).toBe("Autumn");
      expect(oppositeSeason("Autumn")).toBe("Spring");
    });
    it("Summer <-> Winter", () => {
      expect(oppositeSeason("Summer")).toBe("Winter");
      expect(oppositeSeason("Winter")).toBe("Summer");
    });
  });

  describe("orbitPosition", () => {
    it("returns (orbitR, 0) at angle 0 and distance 1.0 AU", () => {
      const pos = orbitPosition(0, 1.0, 140);
      expect(pos.x).toBeCloseTo(140, 5);
      expect(pos.y).toBeCloseTo(0, 5);
    });
    it("returns (0, orbitR) at angle pi/2 and distance 1.0 AU", () => {
      const pos = orbitPosition(Math.PI / 2, 1.0, 140);
      expect(pos.x).toBeCloseTo(0, 5);
      expect(pos.y).toBeCloseTo(140, 5);
    });
    it("clamps distance scaling to 0.95-1.05 range", () => {
      const posLow = orbitPosition(0, 0.5, 140);
      expect(posLow.x).toBeCloseTo(0.95 * 140, 5);
      const posHigh = orbitPosition(0, 2.0, 140);
      expect(posHigh.x).toBeCloseTo(1.05 * 140, 5);
    });
  });

  describe("axisEndpoint", () => {
    it("returns vertical axis for 0 deg tilt", () => {
      const end = axisEndpoint(0, 120);
      expect(end.x).toBeCloseTo(0, 5);
      expect(end.y).toBeCloseTo(-120, 5);
    });
    it("tilts axis for 23.5 deg tilt", () => {
      const end = axisEndpoint(23.5, 120);
      // x = sin(-23.5 deg) * 120 = negative, y = -cos(-23.5 deg) * 120 = negative
      expect(end.x).toBeLessThan(0);
      expect(end.y).toBeLessThan(0);
    });
  });

  describe("diskMarkerY", () => {
    it("returns 0 for 0 deg angle", () => {
      expect(diskMarkerY(0, 92)).toBeCloseTo(0, 5);
    });
    it("returns negative (up) for positive angle (northern latitude)", () => {
      expect(diskMarkerY(40, 92)).toBeLessThan(0);
    });
    it("returns positive (down) for negative angle (southern latitude)", () => {
      expect(diskMarkerY(-40, 92)).toBeGreaterThan(0);
    });
    it("scales with disk radius", () => {
      const y1 = diskMarkerY(45, 92);
      const y2 = diskMarkerY(45, 184);
      expect(Math.abs(y2)).toBeCloseTo(Math.abs(y1) * 2, 2);
    });
  });
});
```

**Step 2: Run logic tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/logic.test.ts 2>&1`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/seasons/logic.test.ts
git commit -m "test(seasons): add unit tests for pure UI logic (dates, seasons, geometry)"
```

---

## Task 11: Run full test suite and build gates

**Files:**
- Read results only

**Step 1: Run physics tests**

Run: `corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5`
Expected: All pass (including new seasons edge cases).

**Step 2: Run all demo Vitest tests**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -10`
Expected: All pass (moon-phases + angular-size + parallax-distance + keplers-laws + seasons).

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

## Task 12: Write Playwright E2E tests

**Files:**
- Create: `apps/site/tests/seasons.spec.ts`

**Step 1: Create the E2E test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Seasons -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/seasons/", { waitUntil: "domcontentloaded" });
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
    const svg = page.locator("#seasonStage");
    await expect(svg).toHaveAttribute("viewBox", "0 0 920 420");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute(
      "aria-label",
      "Seasons visualization (orbit + sunlight geometry)"
    );
  });

  test("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("seasons-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Slider Interaction ---

  test("day-of-year slider updates date readout", async ({ page }) => {
    const before = await page.locator("#dateValue").textContent();
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const after = await page.locator("#dateValue").textContent();
    expect(after).not.toBe(before);
  });

  test("tilt slider updates declination readout", async ({ page }) => {
    // Set to June solstice so declination is sensitive to tilt
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const before = await page.locator("#declinationValue").textContent();

    await page.locator("#tilt").fill("10");
    await page.locator("#tilt").dispatchEvent("input");
    const after = await page.locator("#declinationValue").textContent();
    expect(after).not.toBe(before);
  });

  test("latitude slider updates noon altitude readout", async ({ page }) => {
    const before = await page.locator("#noonAltitudeValue").textContent();
    await page.locator("#latitude").fill("60");
    await page.locator("#latitude").dispatchEvent("input");
    const after = await page.locator("#noonAltitudeValue").textContent();
    expect(after).not.toBe(before);
  });

  // --- Anchor Buttons ---

  test("anchor buttons set day-of-year to expected values", async ({ page }) => {
    await page.locator("#anchorJunSol").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("172");

    await page.locator("#anchorMarEqx").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("80");

    await page.locator("#anchorSepEqx").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("266");

    await page.locator("#anchorDecSol").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("356");
  });

  // --- Season Labels ---

  test("March equinox shows Spring/Autumn", async ({ page }) => {
    await page.locator("#anchorMarEqx").click();
    await expect(page.locator("#seasonNorthValue")).toHaveText("Spring");
    await expect(page.locator("#seasonSouthValue")).toHaveText("Autumn");
  });

  test("June solstice shows Summer/Winter", async ({ page }) => {
    await page.locator("#anchorJunSol").click();
    await expect(page.locator("#seasonNorthValue")).toHaveText("Summer");
    await expect(page.locator("#seasonSouthValue")).toHaveText("Winter");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(4);
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
      name: "Station Mode: Seasons",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("seasons-station.png", {
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
Expected: Build succeeds, `apps/site/public/play/seasons/` populated.

**Step 3: Run E2E tests (first run creates baseline screenshots)**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Seasons" --update-snapshots 2>&1 | tail -30`
Expected: All E2E tests pass, screenshot baselines created.

**Step 4: Commit**

```bash
git add apps/site/tests/seasons.spec.ts apps/site/tests/*.png
git commit -m "test(seasons): add Playwright E2E tests with visual regression screenshots"
```

---

## Task 13: Final gate run and memory update

**Files:**
- Read results only

**Step 1: Run full gate suite**

```bash
corepack pnpm -C packages/physics test -- --run 2>&1 | tail -5
corepack pnpm -C packages/theme test -- --run 2>&1 | tail -5
corepack pnpm -C apps/demos test -- --run 2>&1 | tail -10
corepack pnpm build 2>&1 | tail -10
corepack pnpm -C apps/site typecheck 2>&1 | tail -5
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e 2>&1 | tail -30
```

Expected: All pass.

**Step 2: Update MEMORY.md with new counts**

Update the seasons entry in the migration status and test counts:
- Phase 5: seasons migration + hardening — DONE
- seasons: 18 contract + ~30 logic = ~48 tests
- Physics: 101 + 10 new = ~111 tests
- E2E: 25 (angular-size) + 19 (parallax-distance) + ~20 (seasons) + 51 (smoke) = ~115 tests
