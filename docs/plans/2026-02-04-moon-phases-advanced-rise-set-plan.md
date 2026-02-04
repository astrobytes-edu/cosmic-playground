# Moon Phases Advanced Rise/Set + Sky View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a day-of-year rise/set model with latitude/season controls, plus an optional sky/horizon view, while keeping exports stable, UI tokenized, and accessibility intact.

**Architecture:** Implement a reusable rise/set physics module in `packages/physics` (solar declination, day length, sunrise/sunset, moon rise/set shift) and a demo-level view model formatter for UI strings + polar status. Wire the moon-phases demo to the new model, add Advanced controls (latitude + day-of-year + solstice/equinox presets), add a sky view panel toggle, and extend exports with rise/set readouts using `@cosmic/runtime`.

**Tech Stack:** TypeScript, Vitest, Vite demos, `@cosmic/physics`, `@cosmic/runtime`, `@cosmic/theme`.

**Spec anchors:**
- Demo shell invariant (controls/visual/readouts/drawer): `docs/specs/cosmic-playground-site-spec.md` §9.1
- Runtime export payload v1: `docs/specs/cosmic-playground-site-spec.md` §9.2
- Accessibility minimums: `docs/specs/cosmic-playground-site-spec.md` §11.2
- Tokenized UI and reduced motion: `docs/specs/cosmic-playground-site-spec.md` §10.1–10.2

---

## Task 1: Add rise/set physics tests (RED)

**Files:**
- Create: `packages/physics/src/riseSetModel.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from "vitest";
import {
  solarDeclinationDegFromDayOfYear,
  solarRiseSetLocalTimeHours,
  moonRiseSetLocalTimeHours
} from "./riseSetModel";

describe("riseSetModel", () => {
  test("declination is ~0 at equinox and ~+/-23.4 at solstices", () => {
    const spring = solarDeclinationDegFromDayOfYear(80);
    const summer = solarDeclinationDegFromDayOfYear(172);
    const fall = solarDeclinationDegFromDayOfYear(265);
    const winter = solarDeclinationDegFromDayOfYear(355);

    expect(Math.abs(spring)).toBeLessThan(2);
    expect(Math.abs(fall)).toBeLessThan(2);
    expect(summer).toBeGreaterThan(20);
    expect(summer).toBeLessThan(26);
    expect(winter).toBeLessThan(-20);
    expect(winter).toBeGreaterThan(-26);
  });

  test("equator has ~12h day length even at solstice", () => {
    const { dayLengthHours } = solarRiseSetLocalTimeHours({ latitudeDeg: 0, dayOfYear: 172 });
    expect(dayLengthHours).toBeGreaterThan(11.5);
    expect(dayLengthHours).toBeLessThan(12.5);
  });

  test("mid-latitude summer day length > 12h", () => {
    const { dayLengthHours } = solarRiseSetLocalTimeHours({ latitudeDeg: 60, dayOfYear: 172 });
    expect(dayLengthHours).toBeGreaterThan(14);
  });

  test("polar day/night detection", () => {
    const polarDay = solarRiseSetLocalTimeHours({ latitudeDeg: 80, dayOfYear: 172 });
    const polarNight = solarRiseSetLocalTimeHours({ latitudeDeg: 80, dayOfYear: 355 });

    expect(polarDay.status).toBe("polar-day");
    expect(polarDay.riseHour).toBe(null);
    expect(polarDay.setHour).toBe(null);

    expect(polarNight.status).toBe("polar-night");
    expect(polarNight.riseHour).toBe(null);
    expect(polarNight.setHour).toBe(null);
  });

  test("moon rise/set shifts from sun by phase angle", () => {
    const fullMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 0,
      latitudeDeg: 0,
      dayOfYear: 80,
      useAdvanced: true
    });
    const newMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 180,
      latitudeDeg: 0,
      dayOfYear: 80,
      useAdvanced: true
    });

    expect(fullMoon.riseHour).toBeCloseTo(18, 1);
    expect(fullMoon.setHour).toBeCloseTo(6, 1);
    expect(newMoon.riseHour).toBeCloseTo(6, 1);
    expect(newMoon.setHour).toBeCloseTo(18, 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm -C packages/physics test -- riseSetModel.test.ts`
Expected: FAIL (module missing).

---

## Task 2: Implement rise/set physics model (GREEN)

**Files:**
- Create: `packages/physics/src/riseSetModel.ts`
- Modify: `packages/physics/src/index.ts`

**Step 1: Implement minimal model**

```ts
const SOLAR_OBLIQUITY_DEG = 23.44;
const HOURS_PER_DAY = 24;
const DEG_PER_HOUR = 15;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function wrapHours(hours: number): number {
  const wrapped = hours % HOURS_PER_DAY;
  return wrapped < 0 ? wrapped + HOURS_PER_DAY : wrapped;
}

export type RiseSetStatus = "ok" | "polar-day" | "polar-night";

export type RiseSetResult = {
  riseHour: number | null;
  setHour: number | null;
  dayLengthHours: number | null;
  status: RiseSetStatus;
  declinationDeg: number;
};

export function solarDeclinationDegFromDayOfYear(dayOfYear: number): number {
  const n = clamp(dayOfYear, 1, 365);
  const gamma = (2 * Math.PI * (n - 80)) / 365;
  return SOLAR_OBLIQUITY_DEG * Math.sin(gamma);
}

export function solarRiseSetLocalTimeHours({
  latitudeDeg,
  dayOfYear
}: {
  latitudeDeg: number;
  dayOfYear: number;
}): RiseSetResult {
  const declinationDeg = solarDeclinationDegFromDayOfYear(dayOfYear);
  const phi = toRadians(latitudeDeg);
  const delta = toRadians(declinationDeg);
  const cosH0 = -Math.tan(phi) * Math.tan(delta);

  if (cosH0 <= -1) {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: 24,
      status: "polar-day",
      declinationDeg
    };
  }

  if (cosH0 >= 1) {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: 0,
      status: "polar-night",
      declinationDeg
    };
  }

  const h0 = Math.acos(cosH0); // radians
  const dayLengthHours = (2 * (h0 * 180)) / (Math.PI * DEG_PER_HOUR);
  const sunRise = 12 - dayLengthHours / 2;
  const sunSet = 12 + dayLengthHours / 2;

  return {
    riseHour: wrapHours(sunRise),
    setHour: wrapHours(sunSet),
    dayLengthHours,
    status: "ok",
    declinationDeg
  };
}

export function moonRiseSetLocalTimeHours({
  phaseAngleDeg,
  latitudeDeg,
  dayOfYear,
  useAdvanced
}: {
  phaseAngleDeg: number;
  latitudeDeg: number;
  dayOfYear: number;
  useAdvanced: boolean;
}): RiseSetResult {
  const baseDay = useAdvanced ? dayOfYear : 80; // equinox reference
  const sun = solarRiseSetLocalTimeHours({ latitudeDeg, dayOfYear: baseDay });
  if (sun.status !== "ok") {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: sun.dayLengthHours,
      status: sun.status,
      declinationDeg: sun.declinationDeg
    };
  }

  const shiftHours = ((phaseAngleDeg - 180) / 360) * HOURS_PER_DAY;
  return {
    riseHour: wrapHours((sun.riseHour ?? 0) + shiftHours),
    setHour: wrapHours((sun.setHour ?? 0) + shiftHours),
    dayLengthHours: sun.dayLengthHours,
    status: sun.status,
    declinationDeg: sun.declinationDeg
  };
}
```

**Step 2: Export from physics index**

```ts
export {
  solarDeclinationDegFromDayOfYear,
  solarRiseSetLocalTimeHours,
  moonRiseSetLocalTimeHours
} from "./riseSetModel";
```

**Step 3: Run tests to verify pass**

Run: `corepack pnpm -C packages/physics test -- riseSetModel.test.ts`
Expected: PASS

---

## Task 3: Add demo-level rise/set view model tests (RED)

**Files:**
- Create: `apps/demos/src/demos/moon-phases/riseSetViewModel.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from "vitest";
import { buildRiseSetViewModel } from "./riseSetViewModel";

const BASE = {
  phaseAngleDeg: 0,
  latitudeDeg: 0,
  dayOfYear: 80,
  useAdvanced: true
};

describe("buildRiseSetViewModel", () => {
  test("formats times and status for normal case", () => {
    const vm = buildRiseSetViewModel(BASE);
    expect(vm.riseText).toMatch(/\d{2}:\d{2}/);
    expect(vm.setText).toMatch(/\d{2}:\d{2}/);
    expect(vm.statusText).toBe("Local solar time");
    expect(vm.isPolar).toBe(false);
  });

  test("polar conditions show N/A + warning", () => {
    const vm = buildRiseSetViewModel({
      ...BASE,
      latitudeDeg: 80,
      dayOfYear: 172
    });
    expect(vm.riseText).toBe("N/A");
    expect(vm.setText).toBe("N/A");
    expect(vm.statusText).toMatch(/No rise\/set/);
    expect(vm.isPolar).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run apps/demos/src/demos/moon-phases/riseSetViewModel.test.ts`
Expected: FAIL (module missing).

---

## Task 4: Implement demo rise/set view model (GREEN)

**Files:**
- Create: `apps/demos/src/demos/moon-phases/riseSetViewModel.ts`

**Step 1: Implement minimal formatting helper**

```ts
import { moonRiseSetLocalTimeHours } from "@cosmic/physics";

type RiseSetViewModel = {
  riseText: string;
  setText: string;
  statusText: string;
  isPolar: boolean;
};

function formatClock(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) return "N/A";
  const totalMinutes = Math.round(hours * 60);
  const hh = Math.floor((totalMinutes / 60) % 24);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function buildRiseSetViewModel(params: {
  phaseAngleDeg: number;
  latitudeDeg: number;
  dayOfYear: number;
  useAdvanced: boolean;
}): RiseSetViewModel {
  const result = moonRiseSetLocalTimeHours(params);
  if (result.status !== "ok") {
    return {
      riseText: "N/A",
      setText: "N/A",
      statusText: "No rise/set at this latitude/season (polar day/night).",
      isPolar: true
    };
  }

  return {
    riseText: formatClock(result.riseHour),
    setText: formatClock(result.setHour),
    statusText: "Local solar time",
    isPolar: false
  };
}
```

**Step 2: Run tests to verify pass**

Run: `corepack pnpm vitest run apps/demos/src/demos/moon-phases/riseSetViewModel.test.ts`
Expected: PASS

---

## Task 5: Expand HTML structure test (RED)

**Files:**
- Modify: `scripts/validate-moon-phases.test.mjs`

**Step 1: Add failing assertions**

```js
expect(html).toContain('id="toggle-advanced"');
expect(html).toContain('id="latitude"');
expect(html).toContain('id="dayOfYear"');
expect(html).toContain('id="preset-spring"');
expect(html).toContain('id="preset-summer"');
expect(html).toContain('id="preset-fall"');
expect(html).toContain('id="preset-winter"');
expect(html).toContain('id="toggle-sky-view"');
expect(html).toContain('id="sky-view"');
expect(html).toContain('id="rise-time"');
expect(html).toContain('id="set-time"');
expect(html).toContain('id="rise-set-status"');
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run scripts/validate-moon-phases.test.mjs`
Expected: FAIL (new elements missing).

---

## Task 6: Add Advanced controls + sky view markup (GREEN)

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html`

**Step 1: Add Advanced toggle and controls**
- Add a checkbox with id `toggle-advanced` and label `Advanced: latitude/season`.
- Add latitude slider `#latitude` (min -90, max 90, step 1) with a live readout `#latitudeReadout` showing degrees.
- Add day-of-year slider `#dayOfYear` (min 1, max 365) with readout `#dayOfYearReadout`.
- Add preset buttons `#preset-spring` (Mar equinox), `#preset-summer` (Jun solstice), `#preset-fall` (Sept equinox), `#preset-winter` (Dec solstice).
- Wrap advanced controls in a container that can be hidden when toggle is off.

**Step 2: Add Sky view toggle + panel**
- Add checkbox `#toggle-sky-view` with label `Show sky view`.
- Add a compact `#sky-view` container below the phase panel with an SVG showing horizon + rise/set markers.
- Provide a text summary element for screen readers (e.g. `#sky-summary`).

**Step 3: Add rise/set readouts**
- Add readouts in the right panel with ids `rise-time`, `set-time`, `rise-set-status`.
- Ensure labels include units (local solar time).

**Step 4: Re-run HTML test**

Run: `corepack pnpm vitest run scripts/validate-moon-phases.test.mjs`
Expected: PASS

---

## Task 7: Update moon-phases styles (layout + tokens + reduced motion)

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/style.css`

**Step 1: Layout for Advanced controls and sky view**
- Add styles for advanced controls container and preset buttons using `.cp-button`.
- Add a compact grid for the sky view to reduce whitespace.
- Use existing tokens (`--cp-*`); no new hex colors.

**Step 2: Hide sky view when toggle off**
- Add a class (e.g. `.is-hidden { display: none; }`) used by JS.

**Step 3: Reduced motion**
- Ensure any new transitions are disabled in `@media (prefers-reduced-motion: reduce)`.

---

## Task 8: Add UI behavior unit tests (RED)

**Files:**
- Create: `apps/demos/src/demos/moon-phases/riseSetUiState.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from "vitest";
import {
  PRESET_DAY_OF_YEAR,
  getAdvancedVisibility,
  getSkyViewVisibility,
  applyPresetDayOfYear
} from "./riseSetUiState";

describe("riseSetUiState", () => {
  test("presets map to expected day-of-year values", () => {
    expect(PRESET_DAY_OF_YEAR.spring).toBe(80);
    expect(PRESET_DAY_OF_YEAR.summer).toBe(172);
    expect(PRESET_DAY_OF_YEAR.fall).toBe(265);
    expect(PRESET_DAY_OF_YEAR.winter).toBe(355);
  });

  test("advanced toggle controls visibility flags", () => {
    expect(getAdvancedVisibility(true)).toBe(false);
    expect(getAdvancedVisibility(false)).toBe(true);
  });

  test("sky view toggle controls visibility flags", () => {
    expect(getSkyViewVisibility(true)).toBe(false);
    expect(getSkyViewVisibility(false)).toBe(true);
  });

  test("preset application updates day-of-year", () => {
    expect(applyPresetDayOfYear(10, "summer")).toBe(172);
    expect(applyPresetDayOfYear(200, "winter")).toBe(355);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run apps/demos/src/demos/moon-phases/riseSetUiState.test.ts`
Expected: FAIL (module missing).

---

## Task 9: Implement UI behavior helpers (GREEN)

**Files:**
- Create: `apps/demos/src/demos/moon-phases/riseSetUiState.ts`

**Step 1: Implement minimal helpers**

```ts
export const PRESET_DAY_OF_YEAR = {
  spring: 80,
  summer: 172,
  fall: 265,
  winter: 355
} as const;

export type RiseSetPreset = keyof typeof PRESET_DAY_OF_YEAR;

export function getAdvancedVisibility(enabled: boolean): boolean {
  return !enabled;
}

export function getSkyViewVisibility(enabled: boolean): boolean {
  return !enabled;
}

export function applyPresetDayOfYear(current: number, preset: RiseSetPreset): number {
  return PRESET_DAY_OF_YEAR[preset] ?? current;
}
```

**Step 2: Run tests to verify pass**

Run: `corepack pnpm vitest run apps/demos/src/demos/moon-phases/riseSetUiState.test.ts`
Expected: PASS

---

## Task 10: Add moon-phases e2e checks (RED)

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Add failing assertions**
- Navigate to `play/moon-phases/`
- Toggle `#toggle-advanced` and expect advanced controls to appear.
- Click seasonal presets and expect `#dayOfYear` to update.
- Toggle `#toggle-sky-view` and expect `#sky-view` to become visible.

**Step 2: Run test to verify it fails**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep \"Moon phases advanced\"`
Expected: FAIL (new behaviors not wired yet).

---

## Task 11: Wire Advanced + sky view in main.ts (TDD via view model)

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/main.ts`
- Modify: `apps/demos/src/demos/moon-phases/riseSetViewModel.ts` (if needed)

**Step 1: Add new element lookups**
- `#toggle-advanced`, `#latitude`, `#latitudeReadout`, `#dayOfYear`, `#dayOfYearReadout`
- Preset buttons
- `#toggle-sky-view`, `#sky-view`, `#sky-summary`
- `#rise-time`, `#set-time`, `#rise-set-status`

**Step 2: Add state + handlers**
- `let advancedEnabled = false;`
- `let latitudeDeg = 0; let dayOfYear = 80;`
- Toggle advanced: show/hide controls, update view model and readouts.
- Preset buttons set `dayOfYear` to 80/172/265/355 and update slider.
- Toggle sky view: add/remove `.is-hidden` on `#sky-view`.

**Step 3: Update readouts**
- Use `buildRiseSetViewModel` to update `rise-time`, `set-time`, `rise-set-status`.
- Update `#sky-summary` text with rise/set results for screen readers.

**Step 4: Update sky view SVG**
- Draw horizon line + E/W labels.
- Place rise/set markers using normalized positions (0–1 mapped to x-axis).
- Hide markers when `isPolar`.

---

## Task 12: Export contract updates (TDD)

**Files:**
- Create: `apps/demos/src/demos/moon-phases/exportPayload.test.ts`
- Modify: `apps/demos/src/demos/moon-phases/main.ts`

**Step 1: Write failing test for new export rows**

```ts
import { describe, expect, test } from "vitest";
import { buildMoonPhasesExport } from "./exportPayload";

describe("buildMoonPhasesExport", () => {
  test("includes rise/set rows with units", () => {
    const payload = buildMoonPhasesExport({
      phaseAngleDeg: 0,
      latitudeDeg: 0,
      dayOfYear: 80,
      advancedEnabled: false
    });

    const readoutNames = payload.readouts.map((row) => row.name);
    expect(readoutNames).toContain("Moon rise time (local)");
    expect(readoutNames).toContain("Moon set time (local)");
  });
});
```

**Step 2: Run test to verify failure**

Run: `corepack pnpm vitest run apps/demos/src/demos/moon-phases/exportPayload.test.ts`
Expected: FAIL (module missing).

**Step 3: Implement export builder**
- Create `apps/demos/src/demos/moon-phases/exportPayload.ts` exporting `buildMoonPhasesExport()`.
- Include ordered parameters and readouts, append new rows for latitude/day-of-year and rise/set.
- Keep v1 payload and `@cosmic/runtime` usage.

**Step 4: Wire to copy results**
- Replace inline payload in `handleCopyResults()` with `buildMoonPhasesExport`.

**Step 5: Run test to verify pass**

Run: `corepack pnpm vitest run apps/demos/src/demos/moon-phases/exportPayload.test.ts`
Expected: PASS

---

## Task 13: Update instructor/model notes (docs)

**Files:**
- Modify: `apps/site/src/content/instructor/moon-phases/model.md`
- Modify: `apps/site/src/content/stations/moon-phases.md`

**Step 1: Add brief note**
- Mention Advanced toggle uses day-of-year + latitude to estimate rise/set.
- Clarify polar day/night behavior (no rise/set in this simplified model).

---

## Verification (after implementation)

- `corepack pnpm -C packages/physics test -- riseSetModel.test.ts`
- `corepack pnpm vitest run scripts/validate-moon-phases.test.mjs`
- `corepack pnpm vitest run apps/demos/src/demos/moon-phases/riseSetViewModel.test.ts`
- `corepack pnpm vitest run apps/demos/src/demos/moon-phases/exportPayload.test.ts`
- `corepack pnpm -r typecheck`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
