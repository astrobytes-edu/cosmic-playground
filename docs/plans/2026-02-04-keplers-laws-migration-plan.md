# Kepler’s Laws Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully migrate the Kepler’s Laws demo to the Cosmic shell with SVG parity to the legacy demo, strict DRY physics via `packages/physics`, v1 exports, tokenized UI, and accessibility parity.

**Architecture:** The demo UI is rebuilt to mirror the legacy SVG affordances inside the Cosmic demo shell. All orbital math and conservation quantities are produced by `packages/physics` (new helper outputs in `KeplersLawsModel`), while UI wiring lives in `apps/demos/src/demos/keplers-laws/main.ts` with small, testable logic utilities.

**Tech Stack:** TypeScript (Vite demo), `@cosmic/runtime` for export/help/station modes, `@cosmic/physics` for all orbital math, SVG for the stage, KaTeX runtime via `initMath`.

> Note: per user instruction, ignore any unrelated moon-phases changes.

---

### Task 1: Add failing physics tests for Kepler readouts + eccentricity clamp

**Files:**
- Modify: `packages/physics/src/keplersLawsModel.test.ts`

**Step 1: Write the failing test**

Add tests that assert the new output fields exist and match known values (Earth-like benchmark), plus clamp to 0.99.

```ts
import { describe, expect, test } from "vitest";
import { KeplersLawsModel } from "./keplersLawsModel";

// ...existing tests...

test("clamps eccentricity to 0.99 (legacy max)", () => {
  expect(KeplersLawsModel.clampEccentricity(0.999)).toBeCloseTo(0.99, 12);
});

test("returns conservation quantities for a circular orbit", () => {
  const st = KeplersLawsModel.stateAtMeanAnomalyRad({
    aAu: 1,
    e: 0,
    centralMassSolar: 1,
    meanAnomalyRad: 0
  });

  // mu = 4π² AU^3/yr^2, r=1 AU
  expect(st.accelAuPerYr2).toBeGreaterThan(39);
  expect(st.accelAuPerYr2).toBeLessThan(40);

  // specific energy ε = -μ/(2a)
  expect(st.specificEnergyAu2Yr2).toBeCloseTo(-2 * Math.PI * Math.PI, 8);

  // specific angular momentum h = sqrt(μ a)
  expect(st.specificAngularMomentumAu2Yr).toBeCloseTo(2 * Math.PI, 8);

  // areal velocity = h/2
  expect(st.arealVelocityAu2Yr).toBeCloseTo(Math.PI, 8);
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm -C packages/physics test -- keplersLawsModel.test.ts`

Expected: FAIL (missing fields and/or clamp mismatch).

**Step 3: Write minimal implementation**

(Deferred to Task 2)

**Step 4: Run test to verify it passes**

(Deferred to Task 2)

**Step 5: Commit (optional)**

```bash
git add packages/physics/src/keplersLawsModel.test.ts
git commit -m "test: cover keplers laws conservation outputs"
```

---

### Task 2: Implement new KeplersLawsModel outputs (accel + conservation)

**Files:**
- Modify: `packages/physics/src/keplersLawsModel.ts`
- Modify: `packages/physics/src/keplersLawsModel.test.ts`

**Step 1: Write minimal implementation**

Extend `KeplerOrbitState` and compute derived values using `TwoBodyAnalytic`.

```ts
export type KeplerOrbitState = {
  // ...existing fields...
  accelAuPerYr2: number;
  specificEnergyAu2Yr2: number;
  specificAngularMomentumAu2Yr: number;
  arealVelocityAu2Yr: number;
};

// inside stateAtMeanAnomalyRad
const accelAuPerYr2 = muAu3Yr2 / (rAu * rAu);
const specificEnergyAu2Yr2 = TwoBodyAnalytic.specificEnergyAu2Yr2({
  rAu,
  vRelAuYr: speedAuPerYr,
  muAu3Yr2
});
const specificAngularMomentumAu2Yr = TwoBodyAnalytic.specificAngularMomentumAu2YrFromOrbit({
  aAu,
  e,
  muAu3Yr2
});
const arealVelocityAu2Yr = TwoBodyAnalytic.arealVelocityAu2Yr({
  hAu2Yr: specificAngularMomentumAu2Yr
});

return {
  // ...existing fields...
  accelAuPerYr2,
  specificEnergyAu2Yr2,
  specificAngularMomentumAu2Yr,
  arealVelocityAu2Yr
};
```

Update `clampEccentricity` max to `0.99`.

**Step 2: Run test to verify it passes**

Run: `corepack pnpm -C packages/physics test -- keplersLawsModel.test.ts`

Expected: PASS.

**Step 3: Commit (optional)**

```bash
git add packages/physics/src/keplersLawsModel.ts packages/physics/src/keplersLawsModel.test.ts
git commit -m "feat(physics): expose kepler conservation outputs"
```

---

### Task 3: Add failing demo-logic tests (slider mapping, time/anomaly, readout units, export order)

**Files:**
- Create: `apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts`
- Create: `apps/demos/src/demos/keplers-laws/keplers-laws-logic.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { AstroUnits } from "@cosmic/physics";
import {
  logSliderToValue,
  valueToLogSlider,
  timeFromMeanAnomalyRad,
  meanAnomalyRadFromTime,
  buildReadouts,
  buildExportPayload
} from "./keplers-laws-logic";

const EPS = 1e-6;

test("log slider mapping round-trips for a (0.3–40 AU)", () => {
  const slider = valueToLogSlider(1, 0.3, 40);
  const value = logSliderToValue(slider, 0.3, 40);
  expect(Math.abs(value - 1)).toBeLessThan(1e-3);
});

test("time/anomaly conversions are consistent", () => {
  const P = 2.5;
  const M = Math.PI / 2;
  const t = timeFromMeanAnomalyRad(M, P);
  const M2 = meanAnomalyRadFromTime(t, P);
  expect(Math.abs(M2 - M)).toBeLessThan(EPS);
});

test("readouts match unit toggles (101 vs 201)", () => {
  const base = buildReadouts({
    rAu: 1,
    speedAuPerYr: 2 * Math.PI,
    accelAuPerYr2: 4 * Math.PI * Math.PI,
    periodYr: 1,
    specificEnergyAu2Yr2: -2 * Math.PI * Math.PI,
    specificAngularMomentumAu2Yr: 2 * Math.PI,
    arealVelocityAu2Yr: Math.PI,
    units: "101"
  });
  expect(base.velocity.unit).toBe("km/s");
  expect(base.acceleration.unit).toBe("mm/s²");

  const cgs = buildReadouts({
    ...base.source,
    units: "201"
  });
  expect(cgs.velocity.unit).toBe("cm/s");
  expect(cgs.acceleration.unit).toBe("cm/s²");
});

test("export payload order matches UI controls/readouts", () => {
  const payload = buildExportPayload({
    mode: "kepler",
    units: "101",
    speed: 1,
    aAu: 1,
    e: 0.017,
    centralMassSolar: 1,
    meanAnomalyDeg: 0,
    rAu: 1,
    speedKmS: 29.78,
    accelMs2: 0.00593,
    periodYr: 1,
    specificEnergy: -39.478,
    specificAngularMomentum: 6.283,
    arealVelocity: 3.1416
  });

  expect(payload.parameters.map((r) => r.name)).toEqual([
    "Semi-major axis a (AU)",
    "Eccentricity e",
    "Central mass M★ (M☉)",
    "Mode",
    "Unit system",
    "Speed (yr/s)",
    "Mean anomaly M (deg)"
  ]);

  expect(payload.readouts.map((r) => r.name).slice(0, 4)).toEqual([
    "Distance r (AU)",
    "Velocity v (km/s)",
    "Acceleration (mm/s²)",
    "Period P (yr)"
  ]);
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts`

Expected: FAIL (module/functions missing).

**Step 3: Write minimal implementation**

(Deferred to Task 4)

**Step 4: Run test to verify it passes**

(Deferred to Task 4)

**Step 5: Commit (optional)**

```bash
git add apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts

git commit -m "test: add keplers laws logic tests"
```

---

### Task 4: Implement demo logic helpers (mapping, conversions, readouts, exports)

**Files:**
- Create: `apps/demos/src/demos/keplers-laws/keplers-laws-logic.ts`
- Modify: `apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts`

**Step 1: Write minimal implementation**

Implement the helpers with explicit units and no demo-local physics.

```ts
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AstroUnits } from "@cosmic/physics";

export function logSliderToValue(slider: number, min: number, max: number): number {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const frac = slider / 1000;
  return Math.pow(10, minLog + frac * (maxLog - minLog));
}

export function valueToLogSlider(value: number, min: number, max: number): number {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const logVal = Math.log10(value);
  return Math.round(((logVal - minLog) / (maxLog - minLog)) * 1000);
}

export function meanAnomalyRadFromTime(tYr: number, periodYr: number): number {
  return (2 * Math.PI * (tYr / periodYr)) % (2 * Math.PI);
}

export function timeFromMeanAnomalyRad(M: number, periodYr: number): number {
  const wrapped = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return (wrapped / (2 * Math.PI)) * periodYr;
}

export function buildReadouts(args: {
  rAu: number;
  speedAuPerYr: number;
  accelAuPerYr2: number;
  periodYr: number;
  specificEnergyAu2Yr2: number;
  specificAngularMomentumAu2Yr: number;
  arealVelocityAu2Yr: number;
  units: "101" | "201";
}) {
  const { units } = args;

  const velocity =
    units === "201"
      ? { value: AstroUnits.auPerYrToCmPerS(args.speedAuPerYr), unit: "cm/s" }
      : { value: AstroUnits.auPerYrToKmPerS(args.speedAuPerYr), unit: "km/s" };

  const acceleration =
    units === "201"
      ? { value: AstroUnits.auPerYr2ToCmPerS2(args.accelAuPerYr2), unit: "cm/s²" }
      : { value: AstroUnits.auPerYr2ToMPerS2(args.accelAuPerYr2) * 1000, unit: "mm/s²" };

  const conservation =
    units === "201"
      ? {
          kinetic: { value: AstroUnits.au2PerYr2ToCm2PerS2(0.5 * args.speedAuPerYr ** 2), unit: "cm²/s²" },
          potential: {
            value: AstroUnits.au2PerYr2ToCm2PerS2(args.specificEnergyAu2Yr2 - 0.5 * args.speedAuPerYr ** 2),
            unit: "cm²/s²"
          },
          total: { value: AstroUnits.au2PerYr2ToCm2PerS2(args.specificEnergyAu2Yr2), unit: "cm²/s²" },
          h: { value: AstroUnits.au2PerYrToCm2PerS(args.specificAngularMomentumAu2Yr), unit: "cm²/s" },
          areal: { value: AstroUnits.au2PerYrToCm2PerS(args.arealVelocityAu2Yr), unit: "cm²/s" }
        }
      : {
          kinetic: { value: 0.5 * args.speedAuPerYr ** 2, unit: "AU²/yr²" },
          potential: { value: args.specificEnergyAu2Yr2 - 0.5 * args.speedAuPerYr ** 2, unit: "AU²/yr²" },
          total: { value: args.specificEnergyAu2Yr2, unit: "AU²/yr²" },
          h: { value: args.specificAngularMomentumAu2Yr, unit: "AU²/yr" },
          areal: { value: args.arealVelocityAu2Yr, unit: "AU²/yr" }
        };

  return {
    source: args,
    velocity,
    acceleration,
    period: { value: args.periodYr, unit: "yr" },
    distance: { value: args.rAu, unit: "AU" },
    conservation
  };
}

export function buildExportPayload(args: {
  mode: "kepler" | "newton";
  units: "101" | "201";
  speed: number;
  aAu: number;
  e: number;
  centralMassSolar: number;
  meanAnomalyDeg: number;
  rAu: number;
  speedKmS: number;
  accelMs2: number;
  periodYr: number;
  specificEnergy: number;
  specificAngularMomentum: number;
  arealVelocity: number;
}): ExportPayloadV1 {
  const accelUnit = args.units === "201" ? "cm/s²" : "mm/s²";
  const velocityUnit = args.units === "201" ? "cm/s" : "km/s";

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Semi-major axis a (AU)", value: args.aAu.toFixed(3) },
      { name: "Eccentricity e", value: args.e.toFixed(3) },
      { name: "Central mass M★ (M☉)", value: args.centralMassSolar.toFixed(3) },
      { name: "Mode", value: args.mode === "newton" ? "Newton" : "Kepler" },
      { name: "Unit system", value: args.units === "201" ? "201 (CGS)" : "101 (AU/yr)" },
      { name: "Speed (yr/s)", value: args.speed.toFixed(2) },
      { name: "Mean anomaly M (deg)", value: String(Math.round(args.meanAnomalyDeg)) }
    ],
    readouts: [
      { name: "Distance r (AU)", value: args.rAu.toFixed(3) },
      { name: `Velocity v (${velocityUnit})`, value: args.speedKmS.toFixed(2) },
      { name: `Acceleration (${accelUnit})`, value: args.accelMs2.toFixed(3) },
      { name: "Period P (yr)", value: args.periodYr.toFixed(3) },
      { name: "Kinetic (v²/2)", value: args.specificEnergy.toFixed(4) },
      { name: "Potential (−μ/r)", value: args.specificEnergy.toFixed(4) },
      { name: "Total ε", value: args.specificEnergy.toFixed(4) },
      { name: "Angular momentum h", value: args.specificAngularMomentum.toFixed(4) },
      { name: "Areal velocity (dA/dt)", value: args.arealVelocity.toFixed(4) }
    ],
    notes: [
      "Units and labels match the UI controls/readouts.",
      "Teaching normalization: G = 4π² AU³/(yr²·M☉).",
      "Time slider advances mean anomaly uniformly; position is computed via Kepler’s equation."
    ]
  };
}
```

**Step 2: Run test to verify it passes**

Run: `corepack pnpm vitest run apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts`

Expected: PASS.

**Step 3: Commit (optional)**

```bash
git add apps/demos/src/demos/keplers-laws/keplers-laws-logic.ts apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts

git commit -m "feat: add keplers laws demo logic helpers"
```

---

### Task 5: Rebuild demo markup to match legacy SVG affordances (Cosmic shell)

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/index.html`

**Step 1: Update markup**

- Replace canvas stage with SVG structure mirroring legacy (orbit ellipse, foci/apsides markers + labels, distance line + label, velocity/force vectors, equal-area wedge + markers, draggable planet group with slider role).
- Restore legacy control panels: Kepler/Newton buttons, 101/201 unit toggle, Play/Pause/Reset, speed select, timeline scrub, presets, overlay toggles.
- Keep Cosmic additions: station/help/copy buttons; keep `#cp-demo`, `#copyResults`, `#status`, `.cp-demo__drawer`.
- Use tokenized classes (`cp-button`, `cp-input`, `cp-panel`, `cp-readout`, etc.).
- No color literals; all SVG `fill`/`stroke` must use theme tokens (CSS variables).
- Use relative links `../../exhibits/keplers-laws/` etc (base-path safe).

**Step 2: Manual sanity check**

- Confirm `#cp-demo` has aria-label.
- Confirm `#copyResults` is `<button type="button">`.
- Confirm `#status` has role/status + aria-live.

---

### Task 6: Update styles to support SVG parity + tokens

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/style.css`

**Step 1: Implement token-based styling**

- Import shared stub CSS, then add demo-specific layout only.
- Provide SVG sizing, panel spacing, and focus-visible styles for draggable planet/timeline handle.
- Implement starfield background using CSS gradients with tokens only (no color literals).
- Ensure reduced-motion fallback for any animation (if added).
- No new hex/rgb/hsl literals in `apps/demos`.

**Step 2: Manual check**

- Run `rg -n -- "#[0-9a-fA-F]{3,8}|rgb\(|hsl\(" apps/demos/src/demos/keplers-laws` and confirm empty.

---

### Task 7: Wire SVG + controls to physics model (main.ts)

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/main.ts`
- Modify: `apps/demos/src/demos/keplers-laws/keplers-laws-logic.ts`

**Step 1: Refactor to use new logic helpers**

- Use log slider mapping for `a` and linear mapping for `M★` to match legacy slider behavior.
- Maintain `state` with `t` (yr), `meanAnomalyRad`, and `trueAnomalyRad` derived via `KeplersLawsModel` / `TwoBodyAnalytic`.
- Animation: `requestAnimationFrame` with `speed` in years/sec.
- Timeline scrub: input range sets `t` and `meanAnomalyRad`.
- Drag planet: pointer updates `trueAnomalyRad` (from pointer angle), then compute `meanAnomalyRad` and `t` via `TwoBodyAnalytic.trueToMeanAnomalyRad`.
- Keyboard parity: Space play/pause, Home/End perihelion/aphelion, arrows with Shift fine, `K`/`N`, `1`–`6` presets.

**Step 2: Readouts + unit toggle**

- Use `KeplersLawsModel.stateAtMeanAnomalyRad` outputs for `r`, `speed`, `accel`, and conservation quantities.
- Use `buildReadouts` for unit conversions and labels.
- Update readout DOM in legacy order: r → v → acceleration → P, then conservation block.

**Step 3: Exports (v1)**

- Use `buildExportPayload` so labels and ordering match UI.
- Ensure parameters order matches controls (a, e, M, mode, units, speed, mean anomaly).

**Step 4: A11y live regions**

- Keep `#status` for copy feedback only.
- Add a separate live region (e.g., `#orbitStatus`) for orbit position announcements and update via `setLiveRegionText`.

**Step 5: Manual checks**

- Verify KaTeX rendered via `initMath(document)`.
- Verify `cp-demo__drawer` remains present.

---

### Task 8: Update demo content metadata (if needed)

**Files:**
- Modify: `apps/site/src/content/demos/keplers-laws.md`

**Step 1: Align copy with new controls**

- Ensure `play_steps` mention Play/Pause or timeline scrub if needed.
- Update `last_updated` to `2026-02-04`.

---

### Task 9: Verification (required)

Run in this order and report results:

1. `corepack pnpm -C packages/physics test`
2. `corepack pnpm -C packages/physics typecheck`
3. `corepack pnpm vitest run apps/demos/src/demos/keplers-laws/keplers-laws.logic.test.ts`
4. `corepack pnpm -r typecheck`
5. `corepack pnpm build`
6. `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
