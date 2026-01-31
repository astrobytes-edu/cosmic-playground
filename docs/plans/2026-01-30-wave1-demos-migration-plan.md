# Wave 1 Demos Migration Implementation Plan (Angular Size, Eclipse Geometry, Seasons)

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Migrate Wave 1 demos `angular-size`, `eclipse-geometry`, and `seasons` end-to-end with scientific correctness, unit consistency (no `G=1` anywhere), full feature parity where feasible, and working Station/Challenge/Export UX via `@cosmic/runtime`.

**Architecture:** Port each legacy `*_model.js` into `packages/physics` as pure TypeScript modules with Vitest coverage first. Then replace each demo stub in `apps/demos` with a real instrument UI that consumes the physics module, wires Station Mode (`createDemoModes`) with a real snapshot table, wires Challenge Mode (`ChallengeEngine`) with state-based checks, and exports results via `createInstrumentRuntime`. Finally, align site-facing docs/metadata to match the migrated instrument behavior and units.

**Tech Stack:** pnpm workspace, Vite + TypeScript (`apps/demos`), Astro + Playwright (`apps/site`), Vitest (`packages/physics`), `@cosmic/runtime`, `@cosmic/physics`, `@cosmic/theme`.

## Hard constraints (do not violate)

- Work in-place in this repo (NO git worktrees).
- Do not edit or delete anything under `/Users/anna/Teaching/astr101-sp26/demos/` (legacy source is read-only reference).
- Demos build into `apps/demos/dist/<slug>/` and are copied into `apps/site/public/play/<slug>/`.
- Museum site pages remain mostly static (minimal client JS).
- Units must be consistent everywhere; do not introduce any `G=1` usage or “natural units” language.
- Internal site links should remain GitHub Pages-base-path safe (prefer relative links from `/play/<slug>/` to `/exhibits/...` etc, or compute via `import.meta.env.BASE_URL` when building URLs in JS).

## Wave 1 scope decisions (locked)

**In-scope (parity targets):**
- **Angular Size:** presets (astro + everyday), log sliders for diameter/distance, Moon special modes (orbit-angle + recession-time), angular size formatting (°/′/″), keyboard operability, Station snapshot table + row sets, Challenge checks that require using the controls (not trivia), copy-results export.
- **Seasons:** date/tilt/latitude controls + anchor-date buttons, core readouts (declination, day length, noon altitude, distance in AU, season labels), visualization (orbital + globe view) sufficient to support station/instructor flows, optional “animate year” control that is **off by default** and disabled under reduced motion, Station snapshot table + anchor row set, Challenge checks that require using the controls, copy-results export.
- **Eclipse Geometry:** New/Full controls, Moon position control (drag OR slider) with a keyboard-accessible alternative, node proximity/angle control, tilt control, Earth–Moon distance preset selector, eclipse classification (solar: none/partial/annular/total; lunar: none/penumbral/partial/total), visualization sufficient for “near node vs far” reasoning, optional animations/simulation that are **off by default** and disabled under reduced motion, Station snapshot table + template rows, Challenge checks that require achieving eclipse conditions, copy-results export.

**Explicitly deferred in Wave 1 (capture as backlog; do not block migration):**
- Legacy starfield background and “demo-polish” microinteractions.
- Pixel-perfect replication of legacy SVG styling; prioritize clarity + theme tokens.
- Tour engine integration (not requested for this wave).

## Milestone 0: Baseline snapshot (HARD STOP in execution)

### Task 0.1: Record baseline build + e2e results (before touching code)

**Files:**
- Create: `docs/migration/YYYY-MM-DD-wave1-baseline-snapshot.md` (use the execution date)

**Step 1: Run baseline gates**

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Notes:
- Ensure `CP_BASE_PATH` is set to `/cosmic-playground/` (or unset). An empty `CP_BASE_PATH` can cause `/explore/` to 404 in Playwright if your environment is older than `main@cc1af66`.

Expected:
- `corepack pnpm build` exits 0
- `corepack pnpm -C apps/site test:e2e` exits 0

**Step 2: Record results**

Write:
- timestamp
- exact commands run
- pass/fail summary
- if failures: paste the first actionable error message(s)

**Step 3: Commit**
```bash
git add docs/migration/YYYY-MM-DD-wave1-baseline-snapshot.md
git commit -m "docs(migration): record wave1 baseline build + e2e"
```

---

## Milestone 1: Shared unit/format helpers (small, cross-cutting)

### Task 1.1: Add arcminute/arcsecond helpers to `AstroUnits` (needed by `angular-size`)

**Files:**
- Modify: `packages/physics/src/units.ts`
- Modify: `packages/physics/src/units.test.ts`

**Step 1: Write failing tests**

Add tests for:
- `degToArcmin(1) === 60`
- `degToArcsec(1) === 3600`
- `arcminToDeg(60) === 1`
- `arcsecToDeg(3600) === 1`

Run:
```bash
corepack pnpm -C packages/physics test -- src/units.test.ts
```

Expected: FAIL (helpers missing).

**Step 2: Implement minimal helpers**

Implement:
- `degToArcmin`, `degToArcsec`, `arcminToDeg`, `arcsecToDeg`

Run:
```bash
corepack pnpm -C packages/physics test -- src/units.test.ts
```

Expected: PASS.

**Step 3: Commit**
```bash
git add packages/physics/src/units.ts packages/physics/src/units.test.ts
git commit -m "feat(physics): add deg/arcmin/arcsec conversions"
```

---

## Demo 1: `angular-size`

### Task A0: Snapshot legacy behavior + UI contract (read-only)

**Files:**
- (read-only) `/Users/anna/Teaching/astr101-sp26/demos/_assets/angular-size-model.js`
- (read-only) `/Users/anna/Teaching/astr101-sp26/demos/angular-size/angular-size.js`
- (read-only) `/Users/anna/Teaching/astr101-sp26/demos/angular-size/index.html`

**Step 1: Identify parity checklist (write into PR description later; no code yet)**
- Presets list (astro/everyday)
- Log sliders for size/distance
- Moon special modes (orbit-angle + recession-time)
- Angular formatting (°/′/″) + unit ladder text
- Station Mode columns + row sets (Sun/Moon, perigee/apogee, +500/+1000 Myr)
- Keyboard shortcuts (at least: Help `?`, Station `g`; optional: arrow key nudge)

Expected: checklist matches legacy station/instructor content.

### Task A1: Port model into `@cosmic/physics` (TDD)

**Files:**
- Create: `packages/physics/src/angularSizeModel.ts`
- Create: `packages/physics/src/angularSizeModel.test.ts`
- Modify: `packages/physics/src/index.ts`

**Export decision (lock this):**
- In `packages/physics/src/angularSizeModel.ts`, export a single object `AngularSizeModel` (mirrors `AstroUnits` style):
  - `export const AngularSizeModel = { angularDiameterDeg, distanceForAngularDiameterDeg, moonDistanceKmFromRecession, presets } as const;`

**Reference skeleton (copy/paste starting point):**
```ts
import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

export type AngularDiameterArgs = { diameterKm: number; distanceKm: number };

function angularDiameterDeg({ diameterKm, distanceKm }: AngularDiameterArgs): number {
  if (!Number.isFinite(diameterKm) || diameterKm <= 0) return 0;
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 180;
  const radians = 2 * Math.atan(diameterKm / (2 * distanceKm));
  return Math.min(180, AstroUnits.radToDeg(radians));
}

function distanceForAngularDiameterDeg(args: {
  diameterKm: number;
  angularDiameterDeg: number;
}): number {
  const { diameterKm, angularDiameterDeg } = args;
  if (!Number.isFinite(diameterKm) || diameterKm <= 0) return Number.NaN;
  if (!Number.isFinite(angularDiameterDeg) || angularDiameterDeg <= 0) return Infinity;
  if (angularDiameterDeg >= 180) return 0;
  const theta = AstroUnits.degToRad(angularDiameterDeg);
  return diameterKm / (2 * Math.tan(theta / 2));
}

function moonDistanceKmFromRecession(args: {
  distanceTodayKm: number;
  recessionCmPerYr: number;
  timeMyr: number;
}): number {
  const { distanceTodayKm, recessionCmPerYr, timeMyr } = args;
  if (!Number.isFinite(distanceTodayKm)) return Number.NaN;
  if (!Number.isFinite(recessionCmPerYr)) return Number.NaN;
  if (!Number.isFinite(timeMyr)) return Number.NaN;
  const kmPerMyr = recessionCmPerYr * 10;
  return distanceTodayKm + kmPerMyr * timeMyr;
}

const presets = {
  sun: {
    name: "Sun",
    diameter: 1.392e6,
    distance: AstroConstants.LENGTH.KM_PER_AU,
    category: "astronomical",
    color: "sun",
    description: "Our star"
  }
  // ...copy remaining presets from legacy...
} as const;

export const AngularSizeModel = {
  angularDiameterDeg,
  distanceForAngularDiameterDeg,
  moonDistanceKmFromRecession,
  presets
} as const;
```

**Step 1: Write failing tests for core functions**

Test cases:
- `angularDiameterDeg({ diameterKm: 0, distanceKm: 10 }) === 0`
- `angularDiameterDeg({ diameterKm: 10, distanceKm: 0 }) === 180`
- Sun at 1 AU ≈ `0.53313°` (tolerance ±0.005°)
- Moon today ≈ `0.51780°` (tolerance ±0.01°)
- Inversion sanity: `angularDiameterDeg({d, distanceForAngularDiameterDeg({d, theta})}) ≈ theta` for a small theta
- Recession conversion: `moonDistanceKmFromRecession({distanceTodayKm: 384400, recessionCmPerYr: 1, timeMyr: 1}) === 384410`

Run:
```bash
corepack pnpm -C packages/physics test -- src/angularSizeModel.test.ts
```

Expected: FAIL (module missing).

**Step 2: Implement `angularSizeModel.ts`**

Port (pure TS):
- `angularDiameterDeg`
- `distanceForAngularDiameterDeg`
- `moonDistanceKmFromRecession`
- `presets` (copy values; keep units as km and km-derived)

Run:
```bash
corepack pnpm -C packages/physics test -- src/angularSizeModel.test.ts
```

Expected: PASS.

**Step 3: Export from package index**

Run:
```bash
corepack pnpm -C packages/physics typecheck
```

Expected: PASS.

**Step 4: Commit**
```bash
git add packages/physics/src/angularSizeModel.ts packages/physics/src/angularSizeModel.test.ts packages/physics/src/index.ts
git commit -m "feat(physics): add angular size model (km + degrees)"
```

### Task A2: Replace stub demo with real Angular Size instrument (no Station/Challenge yet)

**Files:**
- Modify: `apps/demos/src/demos/angular-size/index.html`
- Modify: `apps/demos/src/demos/angular-size/style.css`
- Modify: `apps/demos/src/demos/angular-size/main.ts`

**Step 1: Replace stage + controls skeleton**

Implement UI (minimum):
- Preset select (astro/everyday grouping)
- Diameter + distance controls (log sliders)
- Moon mode toggle (Orbit angle vs Recession time) that only appears for Moon preset
- Stage visualization (SVG or canvas) showing object apparent size (no animation required)
- Readouts: angular diameter (display unit + raw degrees), diameter (km), distance (km)
- Drawer: model notes + units

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 2: Wire physics model**

Use:
- `import { AngularSizeModel } from "@cosmic/physics"`
- `AstroUnits` for deg/arcmin/arcsec conversions (via Task 1.1)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 3: Quick build check (demo-only)**

Run:
```bash
corepack pnpm -C apps/demos build
```

Expected: build succeeds and outputs `apps/demos/dist/angular-size/index.html`.

**Step 4: Commit**
```bash
git add apps/demos/src/demos/angular-size/index.html apps/demos/src/demos/angular-size/style.css apps/demos/src/demos/angular-size/main.ts
git commit -m "feat(demo): implement angular-size instrument core UI"
```

### Task A3: Add Station Mode with real snapshot table (Angular Size)

**Files:**
- Modify: `apps/demos/src/demos/angular-size/main.ts`

**Step 1: Implement `createDemoModes({ station })`**

Station requirements:
- Columns (minimum): `case`, `diameter (km)`, `distance (km)`, `θ (display)`, `θ (deg)`, `moonMode`, `moonSetting`
- `getSnapshotRow()` returns a row from current UI state (no prompts)
- Row sets:
  - “Add Sun + Moon (today)”
  - “Add Moon perigee/apogee-like”
  - “Add Moon future (+500/+1000 Myr)”

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 2: Manual sanity (developer run)**

Run:
```bash
corepack pnpm -C apps/demos dev
```

Expected: Station mode opens, “Add row (snapshot)” adds a row without prompts, “Copy CSV” works.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/angular-size/main.ts
git commit -m "feat(demo): add station mode snapshot table (angular-size)"
```

### Task A4: Add Challenge Mode with real checks (Angular Size)

**Files:**
- Modify: `apps/demos/src/demos/angular-size/main.ts`

**Step 1: Define `getState()` and `setState()`**

State must include:
- `diameterKm`, `distanceKm`, `presetKey`
- if Moon preset: `moonTimeMode`, `moonOrbitAngleDeg` or `moonRecessionTimeMyr`
- derived: `thetaDeg`

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 2: Implement 3 state-based challenges**

Concrete checks (examples; lock these to deterministic numeric tolerances):
1) “Set the Sun to ~0.53°” (preset Sun, ensure θ within ±0.02°)
2) “Find a distance where the Moon looks ~0.50°” (preset Moon, adjust distance; θ within ±0.02°)
3) “Double distance halves θ (small-angle sanity)” (use a mid-range everyday object; check ratio close to 0.5)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/angular-size/main.ts
git commit -m "feat(demo): add challenge mode checks (angular-size)"
```

### Task A5: Implement copy-results export (Angular Size)

**Files:**
- Modify: `apps/demos/src/demos/angular-size/main.ts`

**Step 1: Implement `exportResults()` returning v1 payload**

Include:
- Parameters: preset name, diameter (km), distance (km), Moon mode/setting if applicable
- Readouts: angular diameter (display + raw degrees)
- Notes: key model caveats (toy recession linearity; exact formula used; units)

**Reference skeleton (copy/paste starting point):**
```ts
import { createInstrumentRuntime } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:angular-size:mode",
  url: new URL(window.location.href)
});

function exportResults(): ExportPayloadV1 {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: presetName },
      { name: "Diameter", value: `${diameterKm.toFixed(0)} km` },
      { name: "Distance", value: `${distanceKm.toFixed(0)} km` }
    ],
    readouts: [
      { name: "Angular diameter θ", value: `${thetaDisplay.value}${thetaDisplay.symbol}` },
      { name: "Angular diameter θ (deg)", value: `${thetaDeg.toFixed(4)}°` }
    ],
    notes: [
      "Uses the exact geometric relation θ = 2 arctan(d/(2D)).",
      "All lengths are in km; angles are reported in degrees/arcmin/arcsec."
    ]
  };
}

(window as any).__cp = { slug: "angular-size", mode: runtime.mode, exportResults };
```

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 2: Manual test**
- Click “Copy results”, verify `#status` announces success
- Paste: verify it includes units (km, °/′/″)

**Step 3: Commit**
```bash
git add apps/demos/src/demos/angular-size/main.ts
git commit -m "feat(demo): add v1 results export (angular-size)"
```

### Task A6: Unit audit checklist (Angular Size) — must pass before “migrated”

**Files:**
- Verify: `apps/demos/src/demos/angular-size/*`
- Verify: `packages/physics/src/angularSizeModel.ts`
- Verify: `apps/site/src/content/demos/angular-size.md`
- Verify: `apps/site/src/content/stations/angular-size.md`

**Step 1: No `G=1` anywhere**
Run:
```bash
rg -n \"G\\s*=\\s*1|G=1\" packages apps docs || true
```
Expected: no matches (empty output).

**Step 2: Unit alignment**
- UI labels mention km for diameter/distance; θ shown as °/′/″
- Export rows include the same units and symbols
- Station card text still matches the implemented controls (Moon orbit + recession present)

**Step 3: Content alignment**

Update demo metadata model notes (remove “stub” language; add real notes):
- Modify: `apps/site/src/content/demos/angular-size.md`

Run:
```bash
corepack pnpm -C apps/site typecheck
```

Expected: PASS.

**Step 4: Commit**
```bash
git add apps/site/src/content/demos/angular-size.md
git commit -m "docs(site): align angular-size model notes with migrated instrument"
```

---

## Demo 2: `seasons`

### Task S1: Port model into `@cosmic/physics` (TDD)

**Files:**
- Create: `packages/physics/src/seasonsModel.ts`
- Create: `packages/physics/src/seasonsModel.test.ts`
- Modify: `packages/physics/src/index.ts`

**Export decision (lock this):**
- In `packages/physics/src/seasonsModel.ts`, export a single object `SeasonsModel`:
  - `export const SeasonsModel = { PERIHELION_DAY_UNCERTAINTY, effectiveObliquityDegrees, sunDeclinationDeg, dayLengthHours, sunNoonAltitudeDeg, earthSunDistanceAu, orbitAngleRadFromDay } as const;`

**Reference skeleton (copy/paste starting point):**
```ts
import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

const TROPICAL_YEAR_DAYS = AstroConstants.TIME.MEAN_TROPICAL_YEAR_DAYS;
export const PERIHELION_DAY_UNCERTAINTY = 2;

function effectiveObliquityDegrees(obliquityDeg: number): number {
  const t = Math.abs(obliquityDeg % 360);
  const folded = t > 180 ? 360 - t : t;
  return folded > 90 ? 180 - folded : folded;
}

function sunDeclinationDeg(args: {
  dayOfYear: number;
  axialTiltDeg: number;
  tropicalYearDays?: number;
  dayOfMarchEquinox?: number;
}): number {
  const tropicalYearDays = args.tropicalYearDays ?? TROPICAL_YEAR_DAYS;
  const dayOfMarchEquinox = args.dayOfMarchEquinox ?? 80;
  const eps = effectiveObliquityDegrees(args.axialTiltDeg);
  const L = (2 * Math.PI * (args.dayOfYear - dayOfMarchEquinox)) / tropicalYearDays;
  const deltaRad = Math.asin(Math.sin(AstroUnits.degToRad(eps)) * Math.sin(L));
  return AstroUnits.radToDeg(deltaRad);
}

function dayLengthHours(args: { latitudeDeg: number; sunDeclinationDeg: number }): number {
  const phi = AstroUnits.degToRad(args.latitudeDeg);
  const delta = AstroUnits.degToRad(args.sunDeclinationDeg);
  const cosH = -Math.tan(phi) * Math.tan(delta);
  if (cosH < -1) return 24;
  if (cosH > 1) return 0;
  const Hdeg = AstroUnits.radToDeg(Math.acos(cosH));
  return (2 * Hdeg) / 15;
}

function sunNoonAltitudeDeg(args: { latitudeDeg: number; sunDeclinationDeg: number }): number {
  return 90 - Math.abs(args.latitudeDeg - args.sunDeclinationDeg);
}

function earthSunDistanceAu(args: {
  dayOfYear: number;
  yearDays?: number;
  eccentricity?: number;
  perihelionDay?: number;
}): number {
  const yearDays = args.yearDays ?? TROPICAL_YEAR_DAYS;
  const eccentricity = args.eccentricity ?? 0.017;
  const perihelionDay = args.perihelionDay ?? 3;
  const daysFromPerihelion = args.dayOfYear - perihelionDay;
  const angle = (2 * Math.PI * daysFromPerihelion) / yearDays;
  return 1 - eccentricity * Math.cos(angle);
}

function orbitAngleRadFromDay(args: { dayOfYear: number; yearDays?: number; perihelionDay?: number }): number {
  const yearDays = args.yearDays ?? TROPICAL_YEAR_DAYS;
  const perihelionDay = args.perihelionDay ?? 3;
  const daysFromPerihelion = args.dayOfYear - perihelionDay;
  return (2 * Math.PI * daysFromPerihelion) / yearDays;
}

export const SeasonsModel = {
  PERIHELION_DAY_UNCERTAINTY,
  effectiveObliquityDegrees,
  sunDeclinationDeg,
  dayLengthHours,
  sunNoonAltitudeDeg,
  earthSunDistanceAu,
  orbitAngleRadFromDay
} as const;
```

**Step 1: Write failing tests for “anchor date” behaviors**

Test cases (tilt = 23.5°, March equinox day = 80):
- `sunDeclinationDeg({ dayOfYear: 80 }) === 0` (exact, given formula)
- June solstice (`dayOfYear: 172`) is near `+23.5°` (±0.5°)
- December solstice (`dayOfYear: 356`) is near `-23.5°` (±0.5°)
- `dayLengthHours({ latitudeDeg: 0, sunDeclinationDeg: 0 }) === 12` (±1e-9)
- `earthSunDistanceAu({ dayOfYear: 3, eccentricity: 0.017 }) ≈ 0.983` (±0.002)

Run:
```bash
corepack pnpm -C packages/physics test -- src/seasonsModel.test.ts
```

Expected: FAIL (module missing).

**Step 2: Implement `seasonsModel.ts` (pure TS)**

Port:
- `PERIHELION_DAY_UNCERTAINTY`
- `effectiveObliquityDegrees`
- `sunDeclinationDeg`
- `dayLengthHours`
- `sunNoonAltitudeDeg`
- `earthSunDistanceAu`
- `orbitAngleRadFromDay`

Run:
```bash
corepack pnpm -C packages/physics test -- src/seasonsModel.test.ts
```

Expected: PASS.

**Step 3: Export + typecheck**

Run:
```bash
corepack pnpm -C packages/physics typecheck
```

Expected: PASS.

**Step 4: Commit**
```bash
git add packages/physics/src/seasonsModel.ts packages/physics/src/seasonsModel.test.ts packages/physics/src/index.ts
git commit -m "feat(physics): add seasons model (declination/day-length toy)"
```

### Task S2: Replace stub Seasons demo with real instrument (core UI + readouts)

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Implement controls + readouts**

Controls (minimum):
- Day-of-year slider (1–365) + date label (e.g., “March 21”)
- Axial tilt slider (0–45°; default 23.5°)
- Latitude slider (-90–90°; default 40°)
- Anchor buttons: Mar equinox / Jun solstice / Sep equinox / Dec solstice
- Optional: “Animate year” toggle/button (off by default; disabled when reduced motion)

Readouts (minimum):
- Solar declination δ (deg)
- Day length (hours)
- Noon altitude (deg)
- Earth–Sun distance (AU)
- Season label for N/S (simple mapping based on δ sign + date)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 2: Implement visualization**

Minimum acceptable stage:
- simple orbital diagram (Sun + Earth position on orbit for current day)
- simple “tilt + sunlight” diagram OR globe terminator schematic

Constraint:
- no continuous animation unless user clicks “Animate year”

Run:
```bash
corepack pnpm -C apps/demos build
```

Expected: outputs `apps/demos/dist/seasons/index.html`.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/seasons/index.html apps/demos/src/demos/seasons/style.css apps/demos/src/demos/seasons/main.ts
git commit -m "feat(demo): implement seasons instrument core UI"
```

### Task S3: Add Station Mode snapshot table (Seasons)

**Files:**
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Implement `createDemoModes({ station })`**

Columns (minimum; match legacy/station card):
- Date, day, latitude, tilt, δ, day length, noon altitude, season (N), season (S), distance (AU)

Row sets:
- “Add anchor dates” (80/172/266/356 using current lat/tilt)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 2: Commit**
```bash
git add apps/demos/src/demos/seasons/main.ts
git commit -m "feat(demo): add station mode snapshot table (seasons)"
```

### Task S4: Add Challenge Mode with real checks (Seasons)

**Files:**
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Implement `getState()` / `setState()`**

State must include:
- `dayOfYear`, `axialTiltDeg`, `latitudeDeg`
- derived: `declinationDeg`, `dayLengthHours`, `noonAltitudeDeg`

**Step 2: Implement 3 state-based challenges**

Lock these:
1) “Show no seasons: set tilt to 0° and check δ ≈ 0° all year” (require tilt ≤ 1° and declination within ±1°)
2) “At equinox, day length ~12h at mid-latitudes” (day=80 and day length within ±1h for |lat| ≤ 50°)
3) “Explain opposite hemispheres” (set day=172 and verify N day length > S day length for symmetric latitude)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/seasons/main.ts
git commit -m "feat(demo): add challenge mode checks (seasons)"
```

### Task S5: Implement copy-results export + reduced motion behavior (Seasons)

**Files:**
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1: Export results (v1)**

Include:
- Parameters: day-of-year + date label, latitude (deg), tilt (deg)
- Readouts: δ (deg), day length (h), noon altitude (deg), distance (AU), seasons (N/S)
- Notes: simplified declination approximation; toy eccentric distance model; perihelion uncertainty note

**Step 2: Reduced motion**

If `prefers-reduced-motion: reduce`:
- do not auto-start any animations (already required)
- disable “Animate year” and show a small note near the control

Run:
```bash
corepack pnpm -C apps/demos typecheck
```

Expected: PASS.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/seasons/main.ts
git commit -m "feat(demo): add v1 export + reduced-motion handling (seasons)"
```

### Task S6: Unit audit checklist (Seasons) — must pass before “migrated”

**Files:**
- Verify: `apps/demos/src/demos/seasons/*`
- Verify: `packages/physics/src/seasonsModel.ts`
- Verify: `apps/site/src/content/demos/seasons.md`
- Verify: `apps/site/src/content/stations/seasons.md`

**Step 1: No `G=1` anywhere**
Run:
```bash
rg -n \"G\\s*=\\s*1|G=1\" packages apps docs || true
```
Expected: no matches.

**Step 2: Unit alignment**
- UI: tilt/latitude/declination/noon altitude in degrees; day length in hours; distance in AU
- Export rows match the same units and symbols
- Station card references controls that exist (tilt, day of year, latitude)

**Step 3: Content alignment**
- Modify: `apps/site/src/content/demos/seasons.md` (remove “stub” note; add real model notes)

Run:
```bash
corepack pnpm -C apps/site typecheck
```
Expected: PASS.

**Step 4: Commit**
```bash
git add apps/site/src/content/demos/seasons.md
git commit -m "docs(site): align seasons model notes with migrated instrument"
```

---

## Demo 3: `eclipse-geometry`

### Task E1: Port model into `@cosmic/physics` (TDD)

**Files:**
- Create: `packages/physics/src/eclipseGeometryModel.ts`
- Create: `packages/physics/src/eclipseGeometryModel.test.ts`
- Modify: `packages/physics/src/index.ts`

**Export decision (lock this):**
- In `packages/physics/src/eclipseGeometryModel.ts`, export a single object `EclipseGeometryModel`:
  - `export const EclipseGeometryModel = { SAROS_CYCLE_DAYS, EXELIGMOS_CYCLE_DAYS, normalizeAngleDeg, angularSeparationDeg, phaseAngleDeg, eclipticLatitudeDeg, nearestNodeDistanceDeg, betaFromDeltaLambdaDeg, deltaLambdaFromBetaDeg, shadowRadiiKmAtDistance, eclipseThresholdsDeg, lunarEclipseTypeFromBetaDeg, solarEclipseTypeFromBetaDeg, isSarosRelated, isExeligmosRelated } as const;`

**Reference skeleton (copy/paste starting point):**
```ts
import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

const SYNODIC_MONTH_DAYS = AstroConstants.TIME.MEAN_SYNODIC_MONTH_DAYS;
export const SAROS_CYCLE_DAYS = SYNODIC_MONTH_DAYS * 223;
export const EXELIGMOS_CYCLE_DAYS = SAROS_CYCLE_DAYS * 3;
const CYCLE_TOLERANCE_DAYS = 1;

function normalizeAngleDeg(angleDeg: number): number {
  return ((angleDeg % 360) + 360) % 360;
}

function angularSeparationDeg(aDeg: number, bDeg: number): number {
  const diff = Math.abs(normalizeAngleDeg(aDeg - bDeg));
  return diff > 180 ? 360 - diff : diff;
}

function phaseAngleDeg(args: { moonLonDeg: number; sunLonDeg: number }): number {
  return normalizeAngleDeg(args.moonLonDeg - args.sunLonDeg);
}

function eclipticLatitudeDeg(args: { tiltDeg: number; moonLonDeg: number; nodeLonDeg: number }): number {
  const iRad = AstroUnits.degToRad(args.tiltDeg);
  const dRad = AstroUnits.degToRad(args.moonLonDeg - args.nodeLonDeg);
  const betaRad = Math.asin(Math.sin(iRad) * Math.sin(dRad));
  return AstroUnits.radToDeg(betaRad);
}

function nearestNodeDistanceDeg(args: { moonLonDeg: number; nodeLonDeg: number }): number {
  const dAsc = angularSeparationDeg(args.moonLonDeg, args.nodeLonDeg);
  const dDesc = angularSeparationDeg(args.moonLonDeg, args.nodeLonDeg + 180);
  return Math.min(dAsc, dDesc);
}

// ...port remaining functions from legacy (thresholds + classification)...

function isSarosRelated(args: { daysSeparation: number }): boolean {
  if (!Number.isFinite(args.daysSeparation)) return false;
  const absDays = Math.abs(args.daysSeparation);
  return Math.abs(absDays - SAROS_CYCLE_DAYS) <= CYCLE_TOLERANCE_DAYS;
}

function isExeligmosRelated(args: { daysSeparation: number }): boolean {
  if (!Number.isFinite(args.daysSeparation)) return false;
  const absDays = Math.abs(args.daysSeparation);
  return Math.abs(absDays - EXELIGMOS_CYCLE_DAYS) <= CYCLE_TOLERANCE_DAYS;
}

export const EclipseGeometryModel = {
  SAROS_CYCLE_DAYS,
  EXELIGMOS_CYCLE_DAYS,
  normalizeAngleDeg,
  angularSeparationDeg,
  phaseAngleDeg,
  eclipticLatitudeDeg,
  nearestNodeDistanceDeg,
  // ...remaining exports...
  isSarosRelated,
  isExeligmosRelated
} as const;
```

**Step 1: Write failing tests for thresholds + classification**

Test cases (use mean distance `384400 km`):
- `normalizeAngleDeg(-10) === 350`
- `angularSeparationDeg(10, 350) === 20`
- `eclipticLatitudeDeg({ tiltDeg: 5.145, moonLonDeg: nodeLonDeg, nodeLonDeg }) === 0`
- Threshold ordering: `solarCentralDeg < solarPartialDeg` and `lunarTotalDeg < lunarUmbralDeg < lunarPenumbralDeg`
- Golden thresholds (mean distance): `solarPartialDeg ≈ 1.476°` (±0.05°), `solarCentralDeg ≈ 0.957°` (±0.05°)
- Central solar type flips with distance:
  - at `363300 km` (perigee-ish): `solarEclipseTypeFromBetaDeg({ betaDeg: 0 })` is `total-solar`
  - at `405500 km` (apogee-ish): central is `annular-solar`

Run:
```bash
corepack pnpm -C packages/physics test -- src/eclipseGeometryModel.test.ts
```

Expected: FAIL (module missing).

**Step 2: Implement `eclipseGeometryModel.ts`**

Port everything from legacy model (pure TS):
- cycle constants (`SAROS_CYCLE_DAYS`, `EXELIGMOS_CYCLE_DAYS`)
- angle helpers, latitude/node helpers
- shadow radii, thresholds
- eclipse type classifiers
- Saros/Exeligmos checks

Run:
```bash
corepack pnpm -C packages/physics test -- src/eclipseGeometryModel.test.ts
```
Expected: PASS.

**Step 3: Export + typecheck**
Run:
```bash
corepack pnpm -C packages/physics typecheck
```
Expected: PASS.

**Step 4: Commit**
```bash
git add packages/physics/src/eclipseGeometryModel.ts packages/physics/src/eclipseGeometryModel.test.ts packages/physics/src/index.ts
git commit -m "feat(physics): add eclipse geometry model (shadow + thresholds)"
```

### Task E2: Replace stub Eclipse Geometry demo with real instrument (core UI + classification)

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html`
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Implement controls (no simulation yet)**

Controls (minimum):
- Moon phase/position control (slider in degrees 0–360, plus optional drag)
- Buttons: New Moon / Full Moon
- Orbital tilt slider (0–10°, default 5.145°)
- Node position/proximity control (either node longitude slider OR “nearest node distance” via moving node)
- Earth–Moon distance preset select: perigee / mean / apogee (values match legacy)

Readouts (minimum):
- Phase label + phase angle Δ (deg)
- `|β|` (deg) and nearest-node distance (deg)
- Solar outcome and lunar outcome (none/partial/annular/total; none/penumbral/partial/total)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```
Expected: PASS.

**Step 2: Implement visualization**

Minimum acceptable stage:
- simple top-view orbit ring with Moon position + node markers
- simple “out of plane” indicator proportional to β

Constraint:
- no animation unless user clicks animate/run controls

Run:
```bash
corepack pnpm -C apps/demos build
```
Expected: outputs `apps/demos/dist/eclipse-geometry/index.html`.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/eclipse-geometry/index.html apps/demos/src/demos/eclipse-geometry/style.css apps/demos/src/demos/eclipse-geometry/main.ts
git commit -m "feat(demo): implement eclipse-geometry instrument core UI"
```

### Task E3: Add Station Mode snapshot table (Eclipse Geometry)

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Implement `createDemoModes({ station })`**

Columns (match legacy station + station card):
- case, phase, Δ (deg), |β| (deg), nearest node (deg), tilt i (deg), Earth–Moon distance (km), outcome

Row sets:
- “Add 4-case template (blank)” (new far, new near, full far, full near)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```
Expected: PASS.

**Step 2: Commit**
```bash
git add apps/demos/src/demos/eclipse-geometry/main.ts
git commit -m "feat(demo): add station mode snapshot table (eclipse-geometry)"
```

### Task E4: Add Challenge Mode with real checks (Eclipse Geometry)

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Implement `getState()` / `setState()`**

State must include:
- `moonLonDeg`, `sunLonDeg` (if modeled), `nodeLonDeg`, `orbitalTiltDeg`, `earthMoonDistanceKm`
- derived: `phaseAngleDeg`, `betaDeg`, `absBetaDeg`, `solarType`, `lunarType`

**Step 2: Implement 3–5 state-based challenges (port from legacy, simplified if needed)**

Lock these challenges (minimum 3):
1) Achieve *a solar eclipse* (New Moon + |β| below solarPartialDeg)
2) Achieve *a lunar eclipse* (Full Moon + lunarType != none)
3) Show *monthly eclipses if i=0°* (set tilt to 0 and show eclipse at New and Full without moving nodes)

Optional (if UI includes distance presets early):
4) Show total vs annular flip using perigee vs apogee (central eclipse at β≈0)

Run:
```bash
corepack pnpm -C apps/demos typecheck
```
Expected: PASS.

**Step 3: Commit**
```bash
git add apps/demos/src/demos/eclipse-geometry/main.ts
git commit -m "feat(demo): add challenge mode checks (eclipse-geometry)"
```

### Task E5: Implement optional animation/simulation + reduced motion behavior (Eclipse Geometry)

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`
- Modify (if needed for controls): `apps/demos/src/demos/eclipse-geometry/index.html`

**Step 1: Add “Animate month” and “Animate year” controls (off by default)**
- Ensure animation only starts after user click
- Ensure stop button works

**Step 2: Add “Run simulation” for N years (optional, but instructor content references it)**
- Years slider (e.g., 1–100) and speed select
- Track eclipse counts by checking syzygy windows + thresholds (as in legacy)
- (If time) track a log table for a few example events

**Step 3: Reduced motion**

If reduced motion:
- disable animation/simulation start buttons
- keep manual exploration fully functional

Run:
```bash
corepack pnpm -C apps/demos typecheck
```
Expected: PASS.

**Step 4: Commit**
```bash
git add apps/demos/src/demos/eclipse-geometry/main.ts apps/demos/src/demos/eclipse-geometry/index.html
git commit -m "feat(demo): add simulation controls + reduced-motion handling (eclipse-geometry)"
```

### Task E6: Implement copy-results export (Eclipse Geometry)

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Export results (v1)**

Include:
- Parameters: tilt i (deg), Δ (deg), node distance (deg), Earth–Moon distance (km)
- Readouts: |β| (deg), solar outcome, lunar outcome, (optional) thresholds values used
- Notes: simplified geometry; thresholds are physically motivated but not ephemeris-grade; what’s omitted

Run:
```bash
corepack pnpm -C apps/demos typecheck
```
Expected: PASS.

**Step 2: Commit**
```bash
git add apps/demos/src/demos/eclipse-geometry/main.ts
git commit -m "feat(demo): add v1 results export (eclipse-geometry)"
```

### Task E7: Unit audit checklist (Eclipse Geometry) — must pass before “migrated”

**Files:**
- Verify: `apps/demos/src/demos/eclipse-geometry/*`
- Verify: `packages/physics/src/eclipseGeometryModel.ts`
- Verify: `apps/site/src/content/demos/eclipse-geometry.md`
- Verify: `apps/site/src/content/stations/eclipse-geometry.md`
- Verify: `apps/site/src/content/instructor/eclipse-geometry/*`

**Step 1: No `G=1` anywhere**
Run:
```bash
rg -n \"G\\s*=\\s*1|G=1\" packages apps docs || true
```
Expected: no matches.

**Step 2: Unit alignment**
- UI and export: angles in degrees; distances in km; thresholds in degrees; eclipse types as categorical strings
- Docs/station/instructor references still match implemented controls (New/Full, tilt, node proximity, distance presets, simulation if kept)

**Step 3: Content alignment**
- Modify: `apps/site/src/content/demos/eclipse-geometry.md` (remove “stub” note; add real model notes)

Run:
```bash
corepack pnpm -C apps/site typecheck
```
Expected: PASS.

**Step 4: Commit**
```bash
git add apps/site/src/content/demos/eclipse-geometry.md
git commit -m "docs(site): align eclipse-geometry model notes with migrated instrument"
```

---

## Milestone 2: E2E coverage for Wave 1 (export + keyboard + reduced motion)

### Task 2.1: Add Playwright tests for Wave 1 demos export text shape

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Add an export-text test per demo**

Pattern: copy the existing `binary-orbits` export test and adapt.

Assertions (per slug):
- copy results updates `#status` with “Copied”
- captured clipboard contains:
  - `Cosmic Playground`
  - `(v1)`
  - `Timestamp:`
  - at least 1 parameter and 1 readout line
- includes at least one expected unit token:
  - `angular-size`: contains `km` and one of `°`/`′`/`″`
  - `seasons`: contains `AU` and `hours`
  - `eclipse-geometry`: contains `km` and `deg`/`°`

Run (targeted):
```bash
corepack pnpm -C apps/site test:e2e -- smoke.spec.ts -g \"exports stable results text\"
```
Expected: PASS.

**Step 2: Commit**
```bash
git add apps/site/tests/smoke.spec.ts
git commit -m \"test(e2e): add wave1 export smoke coverage\"
```

### Task 2.2: Reduced motion: ensure no auto-animation loops for Wave 1 demos

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Add a reduced-motion check per demo that has optional animation**

For `seasons` and `eclipse-geometry`:
- emulate reduced motion
- instrument `requestAnimationFrame` count (as in binary-orbits test)
- load the page and wait ~300ms
- assert RAF count <= 1 unless user clicks an animate button (do not click)

Run (targeted):
```bash
corepack pnpm -C apps/site test:e2e -- smoke.spec.ts -g \"prefers-reduced-motion\"
```
Expected: PASS.

**Step 2: Commit**
```bash
git add apps/site/tests/smoke.spec.ts
git commit -m \"test(e2e): enforce reduced-motion behavior for wave1 demos\"
```

---

## Milestone 3: Full repo gates (must stay green)

### Task 3.1: Wave 1 full verification gate

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected:
- Both commands succeed (exit 0).
- `apps/site/public/play/angular-size/index.html`, `apps/site/public/play/seasons/index.html`, `apps/site/public/play/eclipse-geometry/index.html` exist after build.
- No Playwright console errors for any `/play/<slug>/` page.

### Task 3.2: Wave 1 completion note (human-facing)

**Files:**
- Create: `docs/migration/2026-01-30-wave1-migration-complete.md`

Include:
- What shipped for each slug (and what was deferred)
- Unit audit checklist results (explicit “no `G=1` strings” confirmation)
- Any content edits required to keep station/instructor pages honest

**Commit**
```bash
git add docs/migration/2026-01-30-wave1-migration-complete.md
git commit -m \"docs(migration): record wave1 completion status\"
```

## Spec Deviations

- Superpowers skills suggest worktrees; this plan follows the repo constraint “work in-place (no worktrees)”.
