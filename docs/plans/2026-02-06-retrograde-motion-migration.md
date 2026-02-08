# Retrograde Motion — Migration & Hardening Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the retrograde-motion demo to full design-system compliance with contract-driven TDD, humble-object architecture, and 4-layer test coverage.

**Architecture:** Extract all testable logic from monolithic main.ts (745 lines) into logic.ts pure functions with DI callbacks for the physics model. main.ts becomes thin DOM wiring only. Both SVG panels (longitude plot + orbit view) use celestial tokens resolved dynamically from CSS custom properties. Physics model (retrogradeMotionModel.ts) is production-ready and unchanged except for upgrading orbital elements to JPL Table 1 values.

**Tech Stack:** TypeScript, Vitest, Playwright, SVG, @cosmic/physics, @cosmic/runtime, @cosmic/theme

---

## Pre-Migration Tasks

### Task 0: Update orbital elements to JPL Table 1

The current elements are "Toy J2000-ish" (Table 2a). Upgrade to JPL Standish Table 1 (1800–2050 AD) for better accuracy.

**Files:**
- Modify: `packages/physics/src/retrogradeMotionModel.ts:33-41`
- Modify: `packages/physics/src/retrogradeMotionModel.test.ts`

**Step 1: Update PLANET_ELEMENTS**

Replace lines 33–41 of `retrogradeMotionModel.ts`:

```typescript
const PLANET_ELEMENTS = {
  // JPL J2000 approximate elements (Standish, Table 1: 1800–2050 AD).
  // Source: https://ssd.jpl.nasa.gov/planets/approx_pos.html
  // Coplanar model (inclination omitted). No calendar-date prediction claims.
  Venus:   { aAu: 0.72333566, e: 0.00677672, varpiDeg: 131.60246718, L0Deg: 181.97909950 },
  Earth:   { aAu: 1.00000261, e: 0.01671123, varpiDeg: 102.93768193, L0Deg: 100.46457166 },
  Mars:    { aAu: 1.52371034, e: 0.09339410, varpiDeg: 336.05637041, L0Deg: 355.44656795 },
  Jupiter: { aAu: 5.20288700, e: 0.04838624, varpiDeg:  14.72847983, L0Deg:  34.39644051 },
  Saturn:  { aAu: 9.53667594, e: 0.05386179, varpiDeg:  92.59887831, L0Deg:  49.95424423 },
} as const;
```

**Step 2: Run physics tests**

```bash
corepack pnpm -C packages/physics test -- --run
```

Expected: All 12 retrograde-motion tests pass. The regression tests check qualitative behavior (retrograde exists), not exact values, so updated elements should not break them.

**Step 3: Commit**

```bash
git add packages/physics/src/retrogradeMotionModel.ts
git commit -m "fix(physics): upgrade retrograde elements to JPL Table 1 (Standish 1800-2050)"
```

---

### Task 1: Add Venus and Saturn celestial tokens

**Files:**
- Modify: `packages/theme/styles/tokens.css:74` (insert after Jupiter)
- Modify: `packages/theme/src/vars.ts:56` (add TS mirrors)

**Step 1: Add CSS tokens**

In `packages/theme/styles/tokens.css`, insert after line 74 (`--cp-celestial-jupiter`):

```css
  --cp-celestial-venus: #f5deb3;
  --cp-celestial-saturn: #e8d5a3;
```

**Step 2: Add TypeScript mirrors**

In `packages/theme/src/vars.ts`, in the celestial block (after `celestialMars`), add:

```typescript
  celestialJupiter: "--cp-celestial-jupiter",
  celestialVenus: "--cp-celestial-venus",
  celestialSaturn: "--cp-celestial-saturn",
```

Note: `celestialJupiter` may already be present — check before adding. The key additions are Venus and Saturn.

**Step 3: Run theme tests**

```bash
corepack pnpm -C packages/theme test -- --run
```

Expected: 30 tests pass. No new tests needed yet (token existence tests use pattern matching).

**Step 4: Commit**

```bash
git add packages/theme/styles/tokens.css packages/theme/src/vars.ts
git commit -m "feat(theme): add Venus and Saturn celestial tokens"
```

---

## Phase A: Contract Tests (RED)

### Task 2: Write design-contracts.test.ts

Create the contract test file. ALL tests will FAIL initially — this is the RED phase.

**Files:**
- Create: `apps/demos/src/demos/retrograde-motion/design-contracts.test.ts`

**Step 1: Write the contract test file**

```typescript
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Retrograde Motion
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 */

const demoDir = __dirname;
const htmlPath = path.resolve(demoDir, "index.html");
const cssPath = path.resolve(demoDir, "style.css");
const mainPath = path.resolve(demoDir, "main.ts");

const html = fs.readFileSync(htmlPath, "utf-8");
const css = fs.readFileSync(cssPath, "utf-8");
const main = fs.readFileSync(mainPath, "utf-8");

describe("Retrograde Motion — Design System Contracts", () => {
  // ── Starfield ─────────────────────────────────────────────
  describe("Starfield contract", () => {
    it("HTML contains a starfield canvas", () => {
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });

    it("main.ts imports and calls initStarfield", () => {
      expect(main).toContain("initStarfield");
    });
  });

  // ── Celestial tokens ──────────────────────────────────────
  describe("Celestial token contract", () => {
    it("Sun uses --cp-celestial-sun tokens in main.ts", () => {
      expect(main).toContain("--cp-celestial-sun");
      expect(main).not.toMatch(/["']--cp-warning["']/);
    });

    it("main.ts references all five planet celestial tokens", () => {
      expect(main).toContain("--cp-celestial-earth");
      expect(main).toContain("--cp-celestial-mars");
      expect(main).toContain("--cp-celestial-venus");
      expect(main).toContain("--cp-celestial-jupiter");
      expect(main).toContain("--cp-celestial-saturn");
    });

    it("orbit paths use --cp-celestial-orbit", () => {
      expect(main).toContain("--cp-celestial-orbit");
    });
  });

  // ── No legacy token leakage ───────────────────────────────
  describe("No legacy tokens", () => {
    it("CSS has no --cp-warning, --cp-accent2, --cp-accent3", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("main.ts has no legacy tokens", () => {
      expect(main).not.toContain("--cp-accent3");
      // --cp-warning is allowed ONLY for semantic warning states, not celestial objects.
      // The sun must use --cp-celestial-sun-*, not --cp-warning.
    });
  });

  // ── Readout unit separation ───────────────────────────────
  describe("Readout unit separation", () => {
    it("HTML has at least 4 readout unit spans", () => {
      // Readouts with units: day(s), deg, deg/day, days (for intervals)
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(4);
    });

    it("no parenthesized units in readout labels", () => {
      // Labels should not contain "(deg)" or "(days)" — units go in separate spans
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      for (const label of labels) {
        expect(label).not.toMatch(/\(deg\)|\(days\)|\(day\)|\(deg\/day\)/);
      }
    });
  });

  // ── Entry animations ──────────────────────────────────────
  describe("Entry animations", () => {
    it("controls and stage have entry animations in CSS", () => {
      expect(css).toMatch(/cp-slide-up|cp-fade-in/);
    });
  });

  // ── No color literals ─────────────────────────────────────
  describe("No color literals in CSS", () => {
    it("CSS has no rgba() outside color-mix", () => {
      const lines = css.split("\n");
      for (const line of lines) {
        if (line.includes("rgba(") && !line.includes("color-mix")) {
          expect(line).not.toMatch(/rgba\(/);
        }
      }
    });

    it("CSS has no hardcoded hex colors", () => {
      // Allow hex in comments only
      const nonCommentLines = css.split("\n").filter((l) => !l.trim().startsWith("/*") && !l.trim().startsWith("*"));
      for (const line of nonCommentLines) {
        expect(line).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      }
    });
  });

  // ── Architecture compliance ───────────────────────────────
  describe("Architecture compliance", () => {
    it("main.ts imports from @cosmic/physics", () => {
      expect(main).toMatch(/from\s+["']@cosmic\/physics["']/);
    });

    it("main.ts imports from ./logic (humble object)", () => {
      expect(main).toMatch(/from\s+["'].\/logic["']/);
    });
  });

  // ── Instrument layer ──────────────────────────────────────
  describe("Instrument layer", () => {
    it("HTML has cp-layer-instrument on demo root", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("readouts panel exists as aside with aria-label", () => {
      expect(html).toMatch(/<aside[^>]*class="cp-demo__readouts/);
      expect(html).toMatch(/<aside[^>]*aria-label="Readouts panel"/);
    });
  });

  // ── Panel translucency ────────────────────────────────────
  describe("Panel translucency", () => {
    it("SVG backgrounds use translucent treatment", () => {
      // retrograde-motion uses color-mix pattern (like angular-size)
      expect(css).toMatch(/color-mix|radial-gradient|--cp-instr-panel-bg/);
    });

    it("controls or readouts use backdrop-filter or translucent bg", () => {
      // The stub-demo.css provides this for .cp-panel, but verify not overridden
      expect(css).not.toMatch(/background:\s*(#|rgb|hsl)/);
    });
  });
});
```

**Step 2: Run to verify RED**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/design-contracts.test.ts
```

Expected: Multiple failures — starfield missing, no `./logic` import, `--cp-celestial-sun` not in main.ts, no readout unit spans, no entry animations.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/design-contracts.test.ts
git commit -m "test(retrograde-motion): add RED design contract tests (18 contracts)"
```

---

## Phase B: Logic Extraction

### Task 3: Create logic.ts with utility functions

Extract pure functions from main.ts into logic.ts. Start with utilities and formatting.

**Files:**
- Create: `apps/demos/src/demos/retrograde-motion/logic.ts`
- Create: `apps/demos/src/demos/retrograde-motion/logic.test.ts`

**Step 1: Write failing tests for utility functions**

Create `logic.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  formatNumber,
  clamp,
  geometryHintLabel,
  formatRetrogradeState,
  formatDuration,
  seriesIndexAtDay,
  findPrevNextStationary,
  nearestRetrogradeInterval,
} from "./logic";

describe("formatNumber", () => {
  it("formats finite numbers to fixed digits", () => {
    expect(formatNumber(3.14159, 2)).toBe("3.14");
  });
  it("returns dash for NaN", () => {
    expect(formatNumber(NaN, 2)).toBe("\u2014");
  });
  it("returns dash for Infinity", () => {
    expect(formatNumber(Infinity, 1)).toBe("\u2014");
  });
  it("handles zero", () => {
    expect(formatNumber(0, 3)).toBe("0.000");
  });
  it("handles negative numbers", () => {
    expect(formatNumber(-1.5, 1)).toBe("-1.5");
  });
});

describe("clamp", () => {
  it("returns value when in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps to min", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("geometryHintLabel", () => {
  it("returns inferior-planet for target inside observer", () => {
    expect(geometryHintLabel(1.0, 0.72)).toBe("Inferior-planet geometry");
  });
  it("returns superior-planet for target outside observer", () => {
    expect(geometryHintLabel(1.0, 1.52)).toBe("Superior-planet geometry");
  });
  it("returns empty for same orbit", () => {
    expect(geometryHintLabel(1.0, 1.0)).toBe("");
  });
});

describe("formatRetrogradeState", () => {
  it("returns Direct for positive slope", () => {
    expect(formatRetrogradeState(0.5)).toBe("Direct");
  });
  it("returns Retrograde for negative slope", () => {
    expect(formatRetrogradeState(-0.3)).toBe("Retrograde");
  });
  it("returns Stationary for zero slope", () => {
    expect(formatRetrogradeState(0)).toBe("Stationary");
  });
  it("returns dash for NaN", () => {
    expect(formatRetrogradeState(NaN)).toBe("\u2014");
  });
});

describe("formatDuration", () => {
  it("formats interval duration in days", () => {
    expect(formatDuration(100, 172.5)).toBe("72.5");
  });
  it("returns dash if either bound is NaN", () => {
    expect(formatDuration(NaN, 100)).toBe("\u2014");
  });
});

describe("seriesIndexAtDay", () => {
  it("maps cursor day to array index", () => {
    expect(seriesIndexAtDay(1.0, 0, 0.25)).toBe(4);
  });
  it("clamps to 0 for before window", () => {
    expect(seriesIndexAtDay(-1, 0, 0.25)).toBe(0);
  });
  it("rounds to nearest index", () => {
    expect(seriesIndexAtDay(0.3, 0, 0.25)).toBe(1);
  });
});

describe("findPrevNextStationary", () => {
  const days = [100, 200, 300];

  it("finds bracketing stationary days", () => {
    const result = findPrevNextStationary(days, 150);
    expect(result.prev).toBe(100);
    expect(result.next).toBe(200);
  });
  it("returns NaN prev when before first", () => {
    const result = findPrevNextStationary(days, 50);
    expect(result.prev).toBeNaN();
    expect(result.next).toBe(100);
  });
  it("returns NaN next when after last", () => {
    const result = findPrevNextStationary(days, 350);
    expect(result.prev).toBe(300);
    expect(result.next).toBeNaN();
  });
  it("handles empty array", () => {
    const result = findPrevNextStationary([], 100);
    expect(result.prev).toBeNaN();
    expect(result.next).toBeNaN();
  });
  it("handles exact match on stationary day", () => {
    const result = findPrevNextStationary(days, 200);
    expect(result.prev).toBe(200);
    expect(result.next).toBe(300);
  });
});

describe("nearestRetrogradeInterval", () => {
  const intervals = [
    { startDay: 100, endDay: 170 },
    { startDay: 400, endDay: 460 },
  ];

  it("returns containing interval when cursor is inside", () => {
    const result = nearestRetrogradeInterval(intervals, 130);
    expect(result).toEqual({ startDay: 100, endDay: 170 });
  });
  it("returns nearest interval when cursor is outside", () => {
    const result = nearestRetrogradeInterval(intervals, 250);
    expect(result).toEqual({ startDay: 100, endDay: 170 });
  });
  it("returns null for empty array", () => {
    expect(nearestRetrogradeInterval([], 100)).toBeNull();
  });
});
```

**Step 2: Run to verify RED**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/logic.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement logic.ts**

Create `apps/demos/src/demos/retrograde-motion/logic.ts`:

```typescript
/**
 * Retrograde Motion — Pure UI Logic
 *
 * All testable logic extracted from main.ts.
 * No DOM access. Physics model injected via callbacks (DI).
 */

// ── Utilities ───────────────────────────────────────────────

const EM_DASH = "\u2014";

export function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return EM_DASH;
  return value.toFixed(digits);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── State labels ────────────────────────────────────────────

export function geometryHintLabel(
  observerA: number,
  targetA: number,
): string {
  if (targetA < observerA) return "Inferior-planet geometry";
  if (targetA > observerA) return "Superior-planet geometry";
  return "";
}

export function formatRetrogradeState(dLambdaDt: number): string {
  if (!Number.isFinite(dLambdaDt)) return EM_DASH;
  if (dLambdaDt > 0) return "Direct";
  if (dLambdaDt < 0) return "Retrograde";
  return "Stationary";
}

export function formatDuration(startDay: number, endDay: number): string {
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) return EM_DASH;
  return (endDay - startDay).toFixed(1);
}

// ── Series indexing ─────────────────────────────────────────

export function seriesIndexAtDay(
  tDay: number,
  windowStartDay: number,
  dtInternal: number,
): number {
  const raw = (tDay - windowStartDay) / dtInternal;
  return Math.max(0, Math.round(raw));
}

export function findPrevNextStationary(
  stationaryDays: number[],
  cursorDay: number,
): { prev: number; next: number } {
  let prev = NaN;
  let next = NaN;
  for (const d of stationaryDays) {
    if (d <= cursorDay) prev = d;
    if (d > cursorDay && Number.isNaN(next)) next = d;
  }
  // If cursor is exactly on a stationary day, next should be the one after
  if (prev === cursorDay) {
    const idx = stationaryDays.indexOf(prev);
    if (idx < stationaryDays.length - 1) next = stationaryDays[idx + 1];
  }
  return { prev, next };
}

export function nearestRetrogradeInterval(
  intervals: { startDay: number; endDay: number }[],
  cursorDay: number,
): { startDay: number; endDay: number } | null {
  if (intervals.length === 0) return null;

  // Check if cursor is inside any interval
  for (const iv of intervals) {
    if (cursorDay >= iv.startDay && cursorDay <= iv.endDay) return iv;
  }

  // Find nearest by midpoint distance
  let best = intervals[0];
  let bestDist = Math.abs(cursorDay - (best.startDay + best.endDay) / 2);
  for (let i = 1; i < intervals.length; i++) {
    const mid = (intervals[i].startDay + intervals[i].endDay) / 2;
    const dist = Math.abs(cursorDay - mid);
    if (dist < bestDist) {
      best = intervals[i];
      bestDist = dist;
    }
  }
  return best;
}
```

**Step 4: Run tests to verify GREEN**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/logic.test.ts
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/logic.ts apps/demos/src/demos/retrograde-motion/logic.test.ts
git commit -m "feat(retrograde-motion): extract utility + indexing logic with tests"
```

---

### Task 4: Add SVG coordinate helpers and display state to logic.ts

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/logic.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/logic.test.ts`

**Step 1: Write failing tests for SVG coordinate helpers**

Add to `logic.test.ts`:

```typescript
import {
  plotXFromDay,
  plotYFromDeg,
  dayFromPlotX,
  orbitEllipsePoints,
  buildOrbitPath,
  computeDisplayState,
  buildExportPayload,
  type RetroModelCallbacks,
  type DisplayState,
} from "./logic";

describe("plotXFromDay", () => {
  it("maps window start to left margin", () => {
    expect(plotXFromDay(0, 0, 720, 1000, 60)).toBeCloseTo(60);
  });
  it("maps window end to right edge minus margin", () => {
    expect(plotXFromDay(720, 0, 720, 1000, 60)).toBeCloseTo(940);
  });
  it("maps midpoint to center", () => {
    expect(plotXFromDay(360, 0, 720, 1000, 60)).toBeCloseTo(500);
  });
});

describe("plotYFromDeg", () => {
  it("maps yMax to top margin", () => {
    expect(plotYFromDeg(400, 0, 400, 300, 30)).toBeCloseTo(30);
  });
  it("maps yMin to bottom edge minus margin", () => {
    expect(plotYFromDeg(0, 0, 400, 300, 30)).toBeCloseTo(270);
  });
});

describe("dayFromPlotX", () => {
  it("is the inverse of plotXFromDay", () => {
    const day = 250;
    const x = plotXFromDay(day, 0, 720, 1000, 60);
    const recovered = dayFromPlotX(x, 0, 720, 1000, 60);
    expect(recovered).toBeCloseTo(day, 1);
  });
});

describe("orbitEllipsePoints", () => {
  it("generates correct number of points", () => {
    const pts = orbitEllipsePoints(1.0, 0.0, 0, 100);
    expect(pts.length).toBe(100);
  });
  it("circular orbit has constant radius", () => {
    const pts = orbitEllipsePoints(1.0, 0.0, 0, 64);
    for (const p of pts) {
      const r = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(r).toBeCloseTo(1.0, 10);
    }
  });
  it("eccentric orbit perihelion is at a(1-e)", () => {
    const a = 1.5;
    const e = 0.1;
    const pts = orbitEllipsePoints(a, e, 0, 360);
    const radii = pts.map((p) => Math.sqrt(p.x * p.x + p.y * p.y));
    const minR = Math.min(...radii);
    expect(minR).toBeCloseTo(a * (1 - e), 2);
  });
});

describe("buildOrbitPath", () => {
  it("returns SVG d attribute string starting with M", () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    const d = buildOrbitPath(pts);
    expect(d).toMatch(/^M/);
    expect(d).toContain("L");
    expect(d).toContain("Z");
  });
});

describe("computeDisplayState", () => {
  // Stub model callbacks for testing
  const stubCallbacks: RetroModelCallbacks = {
    planetElements: (key: string) => {
      const elements: Record<string, { aAu: number; e: number; varpiDeg: number; L0Deg: number }> = {
        Earth: { aAu: 1.0, e: 0.017, varpiDeg: 103, L0Deg: 100 },
        Mars: { aAu: 1.52, e: 0.093, varpiDeg: 336, L0Deg: 355 },
        Venus: { aAu: 0.72, e: 0.007, varpiDeg: 132, L0Deg: 182 },
      };
      return elements[key] ?? elements["Earth"];
    },
  };

  const mockSeries = {
    observer: "Earth" as const,
    target: "Mars" as const,
    t0Day: 0,
    windowStartDay: 0,
    windowEndDay: 720,
    dtInternalDay: 0.25,
    timesDay: [0, 0.25, 0.5, 0.75, 1.0],
    lambdaWrappedDeg: [50, 50.1, 50.2, 50.3, 50.4],
    lambdaUnwrappedDeg: [50, 50.1, 50.2, 50.3, 50.4],
    dLambdaDtDegPerDay: [0.4, 0.4, 0.4, 0.4, 0.4],
    stationaryDays: [200, 280],
    retrogradeIntervals: [{ startDay: 200, endDay: 280 }],
  };

  it("returns display state with correct structure", () => {
    const state = computeDisplayState(mockSeries, 0.5, stubCallbacks);
    expect(state).toHaveProperty("cursorDay");
    expect(state).toHaveProperty("lambdaDeg");
    expect(state).toHaveProperty("dLambdaDt");
    expect(state).toHaveProperty("stateLabel");
    expect(state).toHaveProperty("geometryHint");
    expect(state).toHaveProperty("prevStationary");
    expect(state).toHaveProperty("nextStationary");
    expect(state).toHaveProperty("retroInterval");
  });

  it("labels direct motion correctly", () => {
    const state = computeDisplayState(mockSeries, 0.5, stubCallbacks);
    expect(state.stateLabel).toBe("Direct");
  });

  it("provides geometry hint for Earth-Mars", () => {
    const state = computeDisplayState(mockSeries, 0.5, stubCallbacks);
    expect(state.geometryHint).toBe("Superior-planet geometry");
  });
});
```

**Step 2: Run to verify RED**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/logic.test.ts
```

**Step 3: Implement SVG helpers and display state in logic.ts**

Add to `logic.ts`:

```typescript
// ── SVG coordinate mapping ──────────────────────────────────

export function plotXFromDay(
  tDay: number,
  windowStart: number,
  windowEnd: number,
  plotWidth: number,
  marginX: number,
): number {
  const usable = plotWidth - 2 * marginX;
  const frac = (tDay - windowStart) / (windowEnd - windowStart);
  return marginX + frac * usable;
}

export function plotYFromDeg(
  deg: number,
  yMin: number,
  yMax: number,
  plotHeight: number,
  marginY: number,
): number {
  const usable = plotHeight - 2 * marginY;
  const frac = (deg - yMin) / (yMax - yMin);
  return plotHeight - marginY - frac * usable;
}

export function dayFromPlotX(
  x: number,
  windowStart: number,
  windowEnd: number,
  plotWidth: number,
  marginX: number,
): number {
  const usable = plotWidth - 2 * marginX;
  const frac = (x - marginX) / usable;
  return windowStart + frac * (windowEnd - windowStart);
}

// ── Orbit geometry ──────────────────────────────────────────

const TAU = 2 * Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function orbitEllipsePoints(
  aAu: number,
  e: number,
  varpiDeg: number,
  steps: number,
): { x: number; y: number }[] {
  const varpiRad = varpiDeg * DEG_TO_RAD;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const nu = (i / steps) * TAU;
    const r = (aAu * (1 - e * e)) / (1 + e * Math.cos(nu));
    const theta = nu + varpiRad;
    pts.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  return pts;
}

export function buildOrbitPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  const parts = [`M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`];
  for (let i = 1; i < pts.length; i++) {
    parts.push(`L${pts[i].x.toFixed(2)},${pts[i].y.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join("");
}

// ── Display state (DI pattern) ──────────────────────────────

export type RetroModelCallbacks = {
  planetElements: (key: string) => { aAu: number; e: number; varpiDeg: number; L0Deg: number };
};

export type DisplayState = {
  cursorDay: number;
  lambdaDeg: number;
  lambdaUnwrappedDeg: number;
  dLambdaDt: number;
  stateLabel: string;
  geometryHint: string;
  prevStationary: number;
  nextStationary: number;
  retroInterval: { startDay: number; endDay: number } | null;
  retroDuration: string;
};

export function computeDisplayState(
  series: {
    observer: string;
    target: string;
    windowStartDay: number;
    dtInternalDay: number;
    timesDay: number[];
    lambdaWrappedDeg: number[];
    lambdaUnwrappedDeg: number[];
    dLambdaDtDegPerDay: number[];
    stationaryDays: number[];
    retrogradeIntervals: { startDay: number; endDay: number }[];
  },
  cursorDay: number,
  model: RetroModelCallbacks,
): DisplayState {
  const idx = seriesIndexAtDay(cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeIdx = clamp(idx, 0, series.timesDay.length - 1);

  const lambdaDeg = series.lambdaWrappedDeg[safeIdx] ?? NaN;
  const lambdaUnwrappedDeg = series.lambdaUnwrappedDeg[safeIdx] ?? NaN;
  const dLambdaDt = series.dLambdaDtDegPerDay[safeIdx] ?? NaN;

  const observerEl = model.planetElements(series.observer);
  const targetEl = model.planetElements(series.target);

  const { prev, next } = findPrevNextStationary(series.stationaryDays, cursorDay);
  const retroInterval = nearestRetrogradeInterval(series.retrogradeIntervals, cursorDay);

  return {
    cursorDay,
    lambdaDeg,
    lambdaUnwrappedDeg,
    dLambdaDt,
    stateLabel: formatRetrogradeState(dLambdaDt),
    geometryHint: geometryHintLabel(observerEl.aAu, targetEl.aAu),
    prevStationary: prev,
    nextStationary: next,
    retroInterval,
    retroDuration: retroInterval
      ? formatDuration(retroInterval.startDay, retroInterval.endDay)
      : EM_DASH,
  };
}

// ── Export builder ───────────────────────────────────────────

export function buildExportPayload(
  state: DisplayState,
  params: {
    observer: string;
    target: string;
    windowStartDay: number;
    windowEndDay: number;
    plotStepDay: number;
  },
): {
  version: 1;
  demo: string;
  parameters: Record<string, string>;
  readouts: { label: string; value: string; unit: string }[];
  notes: string[];
} {
  return {
    version: 1,
    demo: "retrograde-motion",
    parameters: {
      observer: params.observer,
      target: params.target,
      windowStart: `${params.windowStartDay} days`,
      windowEnd: `${params.windowEndDay} days`,
      plotStep: `${params.plotStepDay} days`,
      model: "Keplerian 2D coplanar",
    },
    readouts: [
      { label: "Model day", value: formatNumber(state.cursorDay, 2), unit: "days" },
      { label: "Apparent longitude", value: formatNumber(state.lambdaDeg, 2), unit: "deg" },
      { label: "d lambda/dt", value: formatNumber(state.dLambdaDt, 4), unit: "deg/day" },
      { label: "State", value: state.stateLabel, unit: "" },
      { label: "Geometry", value: state.geometryHint, unit: "" },
      { label: "Prev stationary", value: formatNumber(state.prevStationary, 2), unit: "days" },
      { label: "Next stationary", value: formatNumber(state.nextStationary, 2), unit: "days" },
      {
        label: "Retrograde interval",
        value: state.retroInterval
          ? `${formatNumber(state.retroInterval.startDay, 2)} - ${formatNumber(state.retroInterval.endDay, 2)}`
          : EM_DASH,
        unit: "days",
      },
      { label: "Retrograde duration", value: state.retroDuration, unit: "days" },
    ],
    notes: [
      "Keplerian, coplanar orbits; no N-body perturbations.",
      "Model time only; no calendar-date predictions.",
      "Elements: JPL J2000 approximate (Standish, Table 1).",
    ],
  };
}
```

**Step 4: Run tests to verify GREEN**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/logic.test.ts
```

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/logic.ts apps/demos/src/demos/retrograde-motion/logic.test.ts
git commit -m "feat(retrograde-motion): add SVG coordinates, display state, and export logic"
```

---

## Phase C: HTML + CSS Migration (make contracts GREEN)

### Task 5: Add starfield canvas to HTML

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`

**Step 1: Add starfield canvas**

Insert immediately after the opening `<body>` tag's `<div id="cp-demo" ...>`:

```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

Place it as the first child of the `cp-demo` div.

**Step 2: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/index.html
git commit -m "feat(retrograde-motion): add starfield canvas"
```

---

### Task 6: Add readout unit spans to HTML

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`

**Step 1: Update readout markup**

For each dimensional readout, separate the unit into a `<span class="cp-readout__unit">`:

- Model day: `<span id="readoutDay">0.00</span> <span class="cp-readout__unit">days</span>`
- Lambda: `<span id="readoutLambda">—</span> <span class="cp-readout__unit">deg</span>`
- Slope: `<span id="readoutSlope">—</span> <span class="cp-readout__unit">deg/day</span>`
- Prev stationary: add `<span class="cp-readout__unit">days</span>` after value
- Next stationary: add `<span class="cp-readout__unit">days</span>` after value
- Retro bounds: add `<span class="cp-readout__unit">days</span>` after value
- Duration: add `<span class="cp-readout__unit">days</span>` after value

Also remove parenthesized units from label text (e.g., change `$\lambda_{\mathrm{app}}$ (deg)` to just `$\lambda_{\mathrm{app}}$`).

**Step 2: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/index.html
git commit -m "feat(retrograde-motion): separate readout units into cp-readout__unit spans"
```

---

### Task 7: Add entry animations to CSS

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/style.css`

**Step 1: Add animation rules**

Append to `style.css`:

```css
.cp-demo__controls {
  animation: cp-slide-up 0.5s ease-out both;
}

.cp-demo__stage {
  animation: cp-fade-in 0.6s ease-out 0.1s both;
}

.cp-demo__readouts {
  animation: cp-slide-up 0.5s ease-out 0.2s both;
}
```

**Step 2: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/style.css
git commit -m "feat(retrograde-motion): add entry animations"
```

---

### Task 8: Rewrite main.ts with humble-object pattern

This is the largest task. Replace the monolithic main.ts with thin DOM wiring that imports from logic.ts and @cosmic/physics.

**Files:**
- Rewrite: `apps/demos/src/demos/retrograde-motion/main.ts`

**Key changes:**

1. Import `initStarfield` from `@cosmic/runtime` and call it
2. Import `RetrogradeMotionModel` from `@cosmic/physics`
3. Import all logic functions from `./logic`
4. Replace inline `formatNumber`, `clamp`, etc. with imports from logic
5. Replace `--cp-warning` (sun) with `--cp-celestial-sun-core`
6. Replace `--cp-accent3` (wrapped strip) with `--cp-accent`
7. Add dynamic planet token resolution via `getComputedStyle`
8. Use `computeDisplayState()` for all readout updates
9. Use `orbitEllipsePoints()` and `buildOrbitPath()` for orbit rendering
10. Use `plotXFromDay()` / `plotYFromDeg()` / `dayFromPlotX()` for plot rendering

**Planet token map (in main.ts):**

```typescript
const PLANET_TOKEN: Record<string, string> = {
  Venus: "--cp-celestial-venus",
  Earth: "--cp-celestial-earth",
  Mars: "--cp-celestial-mars",
  Jupiter: "--cp-celestial-jupiter",
  Saturn: "--cp-celestial-saturn",
};

function resolvePlanetColor(key: string): string {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(PLANET_TOKEN[key] ?? "--cp-text").trim();
}
```

**SVG rendering constants (in main.ts):**

```typescript
const SUN_TOKEN = "--cp-celestial-sun-core";
const ORBIT_TOKEN = "--cp-celestial-orbit";
```

The full main.ts rewrite should be ~500 lines (down from 745), with all math delegated to logic.ts.

**Step 1: Rewrite main.ts**

(Implementation details are in the logic.ts API — main.ts calls those functions. The existing event handler structure and SVG construction approach remain, but all color tokens, formatting, and state computation are replaced with logic.ts calls.)

**Step 2: Run contract tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/design-contracts.test.ts
```

Expected: All 18 contracts GREEN.

**Step 3: Run logic tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/retrograde-motion/logic.test.ts
```

Expected: All logic tests pass.

**Step 4: Build**

```bash
corepack pnpm build
```

Expected: Clean build, no color literal violations.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/main.ts
git commit -m "refactor(retrograde-motion): rewrite main.ts with humble-object pattern and celestial tokens"
```

---

## Phase D: E2E Tests

### Task 9: Write Playwright E2E tests

**Files:**
- Create: `apps/site/tests/retrograde-motion.spec.ts`

**Test structure (~30 tests):**

1. **Layout & visual** (5): demo loads, triad layout, both SVGs visible, starfield attached, default preset
2. **Controls interaction** (7): preset switch, observer/target selects, window months, plot step, cursor slider, show other planets
3. **Navigation buttons** (5): next/prev stationary, center on retrograde, readout updates, cursor accuracy
4. **Readouts verification** (5): model day, lambda, derivative, state label, retrograde interval
5. **Keyboard & accessibility** (4): arrow keys, tab navigation, copy results, pedagogical guardrail text
6. **Visual regression screenshots** (4): Earth-Mars default, Earth-Venus, cursor on stationary, orbit with other planets

**Step 1: Write the E2E test file**

(Follow the pattern from `apps/site/tests/eclipse-geometry.spec.ts` — use `page.goto`, `page.locator`, `expect(locator).toBeVisible()`, screenshot comparisons.)

**Step 2: Run E2E tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- retrograde-motion
```

**Step 3: Commit**

```bash
git add apps/site/tests/retrograde-motion.spec.ts
git commit -m "test(retrograde-motion): add Playwright E2E tests (~30 tests)"
```

---

## Phase E: Physics Review & Final Gate

### Task 10: Physics review (MANDATORY)

Dispatch a dedicated physics review agent that traces the full chain:

```
RetrogradeMotionModel (physics) → logic.ts (pure functions) → main.ts (SVG rendering) → user interaction → back to model
```

**Checklist:**
- [ ] Orbital elements match JPL Table 1
- [ ] Mean longitude evolution is correct
- [ ] Kepler solver produces correct E for all planets
- [ ] True anomaly formula matches standard reference
- [ ] Heliocentric position (x, y) uses correct angle convention
- [ ] Apparent longitude atan2(dy, dx) has correct sign
- [ ] Unwrapping produces continuous series
- [ ] Central difference derivative is smooth near stationary points
- [ ] Stationary point refinement converges
- [ ] Retrograde intervals have correct sign classification
- [ ] SVG rendering x/y matches physics x/y (no mirror bugs)
- [ ] Orbit view 0-deg axis matches physics 0-deg
- [ ] Planet positions in SVG match orbitStateAtModelDay output
- [ ] Line of sight in SVG points from observer to target (not reversed)
- [ ] Drag-to-scrub correctly maps screen coords to model days

### Task 11: Run all gates

```bash
corepack pnpm build && \
corepack pnpm -C packages/physics test -- --run && \
corepack pnpm -C apps/demos test -- --run && \
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

ALL must pass before any push to main.

---

## Test Count Targets

| Layer | Target | Notes |
|-------|--------|-------|
| Physics model | 12+ (existing) | May add lambdaAppWrappedDeg known-answer tests |
| Design contracts | 18 | Token, starfield, readout, animation, architecture |
| Logic unit tests | 40–60 | All pure functions in logic.ts |
| Playwright E2E | 25–35 | Layout, controls, navigation, readouts, screenshots |

**Grand total target: ~100+ tests for retrograde-motion**
