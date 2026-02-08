# Seasons & Eclipse-Geometry Demo Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two poorly-migrated demos (seasons, eclipse-geometry) to restore feature parity with legacy versions, fix physics bugs, and improve visual fidelity — unblocking the broader enhancement backlog.

**Architecture:** Both demos follow the established humble-object pattern (`logic.ts` + `main.ts`). New pure functions go into `logic.ts` with tests; DOM wiring stays thin in `main.ts`. All physics comes from `@cosmic/physics`.

**Tech Stack:** TypeScript, SVG, CSS custom properties, Vitest, Playwright

---

## Part A: Eclipse-Geometry Fixes (3 tasks, ~30 min)

The eclipse demo has one critical physics bug and one minor UX gap. The overall architecture is sound — the beta curve panel is actually an improvement over the legacy side-view.

### Task 1: Fix animate-month to advance all three bodies

**Problem:** `animateMonth()` at `main.ts:986-993` only advances the Moon using `PHASE_RATE_DEG_PER_DAY`. It does NOT advance `state.sunLonDeg` or `nodeLon.value`. This means during a 1-month animation, the Sun and nodes freeze while only the Moon moves — physically wrong. The legacy version advances all three bodies.

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts:986-993`
- Test: `apps/demos/src/demos/eclipse-geometry/logic.test.ts` (add new test)

**Step 1: Write the failing test**

In `logic.test.ts`, add a test that verifies animate-month advances all three angles:

```typescript
describe("animate-month rate constants", () => {
  test("PHASE_RATE equals MOON_RATE minus SUN_RATE", () => {
    // Synodic rate = sidereal moon rate - sun rate
    // This is the fundamental relationship: 1/P_syn = 1/P_sid - 1/P_orb
    const sunRate = 360 / 365.2422; // deg/day (tropical year)
    const moonRate = 360 / 27.321661; // deg/day (sidereal month)
    const synodicRate = 360 / 29.530589; // deg/day (synodic month)
    expect(moonRate - sunRate).toBeCloseTo(synodicRate, 2);
  });
});
```

**Step 2: Run test to verify it passes** (this is a physics identity test)

Run: `corepack pnpm -C apps/demos test -- --run --reporter verbose src/demos/eclipse-geometry/logic.test.ts`

**Step 3: Fix the animate-month block in main.ts**

Replace lines 986-993:

```typescript
// BEFORE (BUG: only Moon advances)
if (runMode === "animate-month") {
  const dtDays = ANIMATE_MONTH_DAYS_PER_SECOND * dtSec;
  moonLon.value = String(
    EclipseGeometryModel.normalizeAngleDeg(Number(moonLon.value) + PHASE_RATE_DEG_PER_DAY * dtDays)
  );
  render();
  rafId = requestAnimationFrame(tick);
  return;
}
```

```typescript
// AFTER (all three bodies advance, matching animate-year pattern)
if (runMode === "animate-month") {
  const dtDays = ANIMATE_MONTH_DAYS_PER_SECOND * dtSec;
  state.sunLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + SUN_RATE_DEG_PER_DAY * dtDays);
  moonLon.value = String(
    EclipseGeometryModel.normalizeAngleDeg(Number(moonLon.value) + MOON_RATE_DEG_PER_DAY * dtDays)
  );
  nodeLon.value = String(
    EclipseGeometryModel.normalizeAngleDeg(Number(nodeLon.value) + NODE_RATE_DEG_PER_DAY * dtDays)
  );
  render();
  rafId = requestAnimationFrame(tick);
  return;
}
```

Key change: Replace `PHASE_RATE_DEG_PER_DAY` (synodic rate) with proper `SUN_RATE_DEG_PER_DAY`, `MOON_RATE_DEG_PER_DAY`, and `NODE_RATE_DEG_PER_DAY` — exactly matching the animate-year pattern at lines 1000-1002.

**Step 4: Run full demo test suite**

Run: `corepack pnpm -C apps/demos test -- --run --reporter verbose src/demos/eclipse-geometry/`
Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/demos/src/demos/eclipse-geometry/main.ts apps/demos/src/demos/eclipse-geometry/logic.test.ts
git commit -m "fix(eclipse-geometry): advance sun and node in animate-month

The animate-month loop only advanced Moon longitude using the synodic
rate. Sun and node longitudes were frozen, producing unphysical motion.
Now all three bodies advance at their proper rates, matching the
animate-year pattern."
```

---

### Task 2: Add signed beta display

**Problem:** The readout shows only `|β|` (absolute beta). The legacy demo showed signed beta in its side-view height indicator ("above"/"below" ecliptic). The migrated beta curve panel inherently shows sign, but the numeric readout does not.

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html` (readout label)
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts` (render signed value)
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.ts` (add format function if needed)
- Test: `apps/demos/src/demos/eclipse-geometry/logic.test.ts`

**Step 1: Write the failing test**

In `logic.test.ts`:

```typescript
describe("formatSignedBeta", () => {
  test("positive beta shows + prefix", () => {
    expect(formatSignedBeta(2.5, 3)).toBe("+2.500");
  });
  test("negative beta shows - prefix", () => {
    expect(formatSignedBeta(-1.23, 3)).toBe("\u22121.230");
  });
  test("zero beta shows no sign", () => {
    expect(formatSignedBeta(0, 3)).toBe("0.000");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `corepack pnpm -C apps/demos test -- --run --reporter verbose src/demos/eclipse-geometry/logic.test.ts`
Expected: FAIL — `formatSignedBeta` not found

**Step 3: Implement `formatSignedBeta` in logic.ts**

```typescript
export function formatSignedBeta(betaDeg: number, decimals: number): string {
  if (betaDeg === 0) return betaDeg.toFixed(decimals);
  const sign = betaDeg > 0 ? "+" : "\u2212";
  return `${sign}${Math.abs(betaDeg).toFixed(decimals)}`;
}
```

**Step 4: Run test to verify it passes**

**Step 5: Update HTML readout**

In `index.html`, change the beta readout label from `|β|` to `β` (remove absolute-value bars). Add a second readout line for signed beta, or change the existing one. The `|β|` readout can stay for eclipse-condition checking, but add a signed readout showing "above"/"below" ecliptic.

Specifically: change the `absBeta` readout element to show signed value, and update its label to `β (ecliptic lat.)`.

**Step 6: Update main.ts render**

In the render function where `absBeta.textContent = formatNumber(derived.absBetaDeg, 3)`, change to:
```typescript
absBeta.textContent = formatSignedBeta(derived.betaDeg, 3);
```

**Step 7: Run full test suite + build**

```bash
corepack pnpm -C apps/demos test -- --run --reporter verbose src/demos/eclipse-geometry/
corepack pnpm build
```

**Step 8: Commit**

```bash
git add apps/demos/src/demos/eclipse-geometry/
git commit -m "feat(eclipse-geometry): show signed beta in readout

Replace |β| absolute-value readout with signed β showing + (above) or
- (below) ecliptic. Adds formatSignedBeta() to logic.ts with tests."
```

---

### Task 3: Eclipse E2E verification + physics review

**Files:**
- Test: `apps/site/tests/eclipse-geometry.spec.ts` (add animate-month test)

**Step 1: Add E2E test for animate-month advancing all bodies**

```typescript
test("animate-month advances sun and node (not just moon)", async ({ page }) => {
  // Read initial sun/moon/node values from readouts
  // Click "1 Month" button
  // Wait for animation
  // Verify sun moved, node moved, moon completed ~1 synodic cycle
});
```

The exact selectors depend on the existing E2E patterns. Check `eclipse-geometry.spec.ts` for how readouts are read and animations triggered.

**Step 2: Run E2E**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "eclipse-geometry"
```

**Step 3: Commit**

```bash
git add apps/site/tests/eclipse-geometry.spec.ts
git commit -m "test(eclipse-geometry): E2E for animate-month physics fix"
```

---

## Part B: Seasons Demo Restoration (10 tasks, ~4 hr)

The seasons demo lost critical pedagogical features during migration: the globe view, distance exaggeration, overlay toggles, full tilt range, proper day-length formatting, smooth transitions, keyboard shortcuts, and fixed-duration animation. This is a substantial rework.

### Task 4: Extend tilt slider to 0–90° and add day-length format

**Problem:** Tilt slider is capped at 45° (legacy: 0–90°). Day length shows decimal "14.53" instead of "14h 32m".

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html` (slider max, add latitude slider)
- Modify: `apps/demos/src/demos/seasons/logic.ts` (add `formatDayLength`, update clamp)
- Test: `apps/demos/src/demos/seasons/logic.test.ts`
- Modify: `apps/demos/src/demos/seasons/main.ts` (use new format, remove 45° clamp)

**Step 1: Write failing tests for `formatDayLength`**

```typescript
describe("formatDayLength", () => {
  test("formats 14.53 hours as 14h 32m", () => {
    expect(formatDayLength(14.53)).toBe("14h 32m");
  });
  test("formats 0 hours as 0h 00m", () => {
    expect(formatDayLength(0)).toBe("0h 00m");
  });
  test("formats 24 hours as 24h 00m", () => {
    expect(formatDayLength(24)).toBe("24h 00m");
  });
  test("formats 12.0 hours as 12h 00m", () => {
    expect(formatDayLength(12.0)).toBe("12h 00m");
  });
  test("rounds minutes correctly", () => {
    expect(formatDayLength(14.99)).toBe("14h 59m");
  });
});
```

**Step 2: Run test → FAIL**

**Step 3: Implement in logic.ts**

```typescript
export function formatDayLength(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
```

**Step 4: Run test → PASS**

**Step 5: Update HTML**
- Change tilt slider `max` from `"45"` to `"90"`
- Keep `value="23.5"` and `step="0.1"`

**Step 6: Update main.ts**
- Remove the `clamp(..., 0, 45)` restriction
- Use `formatDayLength()` for day-length readout

**Step 7: Run full suite**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/seasons/
corepack pnpm build
```

**Step 8: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): extend tilt to 90 deg, format day length as Xh Ym"
```

---

### Task 5: Restore distance exaggeration in orbit view

**Problem:** `orbitPosition()` in logic.ts clamps distance to [0.95, 1.05], making Earth's slightly elliptical orbit (e=0.017) invisible. Legacy used `8 × (distanceAU - 1)` exaggeration to visually demonstrate that distance does NOT cause seasons.

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts` (update `orbitPosition`)
- Test: `apps/demos/src/demos/seasons/logic.test.ts`

**Step 1: Write failing test**

```typescript
describe("orbitPosition with exaggeration", () => {
  test("exaggerates perihelion distance visually", () => {
    const pos = orbitPosition(0, 0.983, 150, 8);
    // At perihelion (0.983 AU), exaggeration = 8 * (0.983 - 1) = -0.136
    // rScaled = 150 * (1 + (-0.136)) = 150 * 0.864 = 129.6
    expect(pos.x).toBeCloseTo(129.6, 0);
    expect(pos.y).toBeCloseTo(0, 0);
  });

  test("exaggerates aphelion distance visually", () => {
    const pos = orbitPosition(0, 1.017, 150, 8);
    // At aphelion (1.017 AU), exaggeration = 8 * (1.017 - 1) = 0.136
    // rScaled = 150 * (1 + 0.136) = 150 * 1.136 = 170.4
    expect(pos.x).toBeCloseTo(170.4, 0);
  });

  test("no exaggeration when factor is 0", () => {
    const pos = orbitPosition(0, 1.017, 150, 0);
    expect(pos.x).toBeCloseTo(150, 0);
  });
});
```

**Step 2: Run test → FAIL**

**Step 3: Update `orbitPosition` in logic.ts**

```typescript
export function orbitPosition(
  phaseDeg: number,
  distanceAu: number,
  orbitR: number,
  distExaggeration = 8
): { x: number; y: number } {
  const phaseRad = (phaseDeg * Math.PI) / 180;
  const rScaled = orbitR * (1 + distExaggeration * (distanceAu - 1));
  return {
    x: rScaled * Math.cos(phaseRad),
    y: rScaled * Math.sin(phaseRad),
  };
}
```

**Step 4: Run test → PASS**

**Step 5: Update main.ts** to pass `distExaggeration` parameter (default 8).

**Step 6: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): restore 8x distance exaggeration in orbit view

Earth's orbital eccentricity (e=0.017) is too small to see without
exaggeration. Legacy used 8x multiplier to visually demonstrate that
distance variation does NOT cause seasons. The old [0.95, 1.05] clamp
made the orbit appear perfectly circular."
```

---

### Task 6: Add globe view SVG panel

**Problem:** The legacy demo had a globe view showing Earth from the side with latitude bands, terminator (day/night boundary), axis tilt, and a latitude marker. This is the key pedagogical visualization — it shows WHY seasons happen (light angle + duration). The migrated demo only has a flat tilt-disk schematic.

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html` (add globe SVG panel)
- Modify: `apps/demos/src/demos/seasons/style.css` (globe styles)
- Modify: `apps/demos/src/demos/seasons/logic.ts` (globe geometry functions)
- Modify: `apps/demos/src/demos/seasons/main.ts` (render globe)
- Test: `apps/demos/src/demos/seasons/logic.test.ts`

**Step 1: Write failing tests for globe geometry functions**

```typescript
describe("globe projection", () => {
  test("terminatorShiftX for zero declination is zero", () => {
    expect(terminatorShiftX(0, 150)).toBeCloseTo(0, 1);
  });

  test("terminatorShiftX for +23.5 deg shifts right (more N lit)", () => {
    const shift = terminatorShiftX(23.5, 150);
    expect(shift).toBeGreaterThan(0);
    expect(shift).toBeLessThan(150);
  });

  test("terminatorShiftX for -23.5 deg shifts left (more S lit)", () => {
    const shift = terminatorShiftX(-23.5, 150);
    expect(shift).toBeLessThan(0);
  });

  test("latitudeToGlobeY maps equator to center", () => {
    expect(latitudeToGlobeY(0, 200, 150)).toBeCloseTo(200, 0);
  });

  test("latitudeToGlobeY maps +90 to top", () => {
    expect(latitudeToGlobeY(90, 200, 150)).toBeCloseTo(50, 0);
  });

  test("latitudeToGlobeY maps -90 to bottom", () => {
    expect(latitudeToGlobeY(-90, 200, 150)).toBeCloseTo(350, 0);
  });

  test("latitudeBandEllipse for equator at zero tilt", () => {
    const band = latitudeBandEllipse(0, 0, 200, 200, 150);
    expect(band.cy).toBeCloseTo(200, 0);
    expect(band.rx).toBeCloseTo(150, 0);
    expect(band.ry).toBeCloseTo(0, 0); // edge-on
  });

  test("latitudeBandEllipse for tropic at 23.5 tilt", () => {
    const band = latitudeBandEllipse(23.5, 23.5, 200, 200, 150);
    expect(band.cy).toBeLessThan(200); // above center
    expect(band.rx).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test → FAIL**

**Step 3: Implement globe geometry in logic.ts**

Key functions to add:
- `terminatorShiftX(declinationDeg, globeRadius)` — how far the terminator shifts based on solar declination
- `latitudeToGlobeY(latDeg, centerY, globeRadius)` — convert latitude to Y position on globe
- `latitudeBandEllipse(latDeg, tiltDeg, centerX, centerY, globeRadius)` — compute ellipse parameters for a latitude circle on the tilted globe
- `globeAxisEndpoints(tiltDeg, centerX, centerY, axisLength)` — axis line endpoints

These are pure geometry — no DOM.

**Step 4: Run tests → PASS**

**Step 5: Add globe SVG to index.html**

The SVG viewBox needs to expand. Currently `viewBox="0 0 920 420"` with two panels (orbit + tilt). Change to a 3-panel layout:

Option A: Expand viewBox to `"0 0 1340 420"` (add 420px wide globe panel on right)
Option B: Stack orbit + globe in a 2-row layout
Option C: Replace the flat tilt-disk panel with the globe view

**Recommended: Option C** — replace the tilt-disk panel with the globe. The flat disk is redundant when the globe shows the same information (axis tilt) plus much more (terminator, latitude bands). The orbit panel stays.

Globe SVG structure (inside the existing SVG, replacing the tilt panel):
```svg
<!-- Globe view (replaces flat tilt disk) -->
<g transform="translate(550, 210)">
  <defs>
    <clipPath id="globe-clip"><circle r="150"/></clipPath>
    <radialGradient id="globeGrad" cx="30%" cy="30%">
      <stop offset="0%" stop-color="var(--cp-celestial-earth-light, #6ba3d6)"/>
      <stop offset="100%" stop-color="var(--cp-celestial-earth, #2a5f8f)"/>
    </radialGradient>
  </defs>
  <circle r="150" fill="url(#globeGrad)"/>
  <g clip-path="url(#globe-clip)">
    <ellipse id="tropic-n" class="latitude-band"/>
    <ellipse id="tropic-s" class="latitude-band"/>
    <ellipse id="arctic-n" class="latitude-band arctic"/>
    <ellipse id="arctic-s" class="latitude-band arctic"/>
    <ellipse id="equator-band" class="latitude-band equator"/>
    <ellipse id="terminator" class="terminator"/>
  </g>
  <line id="globe-axis" class="globe-axis"/>
  <circle id="globe-marker" r="5" class="globe-marker"/>
</g>
```

**Step 6: Add CSS styles for globe elements**

```css
.latitude-band { fill: none; stroke: var(--cp-orbit); stroke-width: 0.5; opacity: 0.4; }
.latitude-band.arctic { stroke-dasharray: 4 3; }
.latitude-band.equator { stroke-width: 1; opacity: 0.6; }
.terminator { fill: rgba(0, 0, 0, 0.5); }
.globe-axis { stroke: var(--cp-muted); stroke-width: 1.5; stroke-dasharray: 4 3; }
.globe-marker { fill: var(--cp-accent-rose); }
```

**Step 7: Wire up globe rendering in main.ts**

Add `renderGlobe()` function that:
1. Computes solar declination from current day/tilt
2. Positions terminator based on declination
3. Updates latitude band ellipses based on tilt
4. Positions globe axis based on tilt
5. Positions latitude marker

Call it from the main `renderStage()` function.

**Step 8: Run full suite + build**

**Step 9: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): add globe view with terminator and latitude bands

Replace flat tilt-disk schematic with orthographic globe showing
latitude bands (tropics, arctic circles, equator), day/night
terminator, tilted axis, and latitude marker. This is the key
pedagogical visualization showing WHY seasons happen."
```

---

### Task 7: Add overlay toggles

**Problem:** Legacy had 5 overlay toggles (celestial equator, ecliptic, latitude bands, terminator, hour grid). Migrated has none.

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html` (add toggle checkboxes or cp-chip buttons)
- Modify: `apps/demos/src/demos/seasons/main.ts` (toggle visibility)
- Modify: `apps/demos/src/demos/seasons/style.css` (if needed)

**Step 1: Add overlay toggle markup to HTML**

Use `cp-chip` pattern (with `aria-pressed`) consistent with other demos:

```html
<fieldset class="cp-chip-group" role="group" aria-label="Overlays">
  <legend class="cp-muted">Overlays</legend>
  <button class="cp-chip" aria-pressed="true" data-overlay="latitude-bands">Lat. Bands</button>
  <button class="cp-chip" aria-pressed="true" data-overlay="terminator">Terminator</button>
  <button class="cp-chip" aria-pressed="false" data-overlay="ecliptic">Ecliptic</button>
  <button class="cp-chip" aria-pressed="false" data-overlay="equator">Cel. Equator</button>
</fieldset>
```

(Drop the "hour grid" — it's confusing and the globe view doesn't need it.)

**Step 2: Wire up toggle handlers in main.ts**

Toggle visibility of SVG groups based on `aria-pressed` state.

**Step 3: Add contract test for aria-pressed on overlay chips**

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): add overlay toggles for latitude bands, terminator, ecliptic, equator"
```

---

### Task 8: Fix animation to use fixed duration

**Problem:** Current animation uses `daysPerSecond = 36` which is frame-rate dependent. Legacy uses fixed 10-second duration with a progress fraction.

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts` (add animation progress helper)
- Modify: `apps/demos/src/demos/seasons/main.ts` (rewrite animation loop)
- Test: `apps/demos/src/demos/seasons/logic.test.ts`

**Step 1: Write failing test**

```typescript
describe("animationProgress", () => {
  test("clamps to [0, 1]", () => {
    expect(animationProgress(0, 10000)).toBe(0);
    expect(animationProgress(5000, 10000)).toBeCloseTo(0.5);
    expect(animationProgress(10000, 10000)).toBe(1);
    expect(animationProgress(15000, 10000)).toBe(1);
  });
});
```

**Step 2: Implement**

```typescript
export function animationProgress(elapsedMs: number, durationMs: number): number {
  return clamp(elapsedMs / durationMs, 0, 1);
}
```

**Step 3: Rewrite animation in main.ts**

Replace the current `daysPerSecond`-based stepping with:
```typescript
const YEAR_ANIM_DURATION_MS = 10_000;
let animStartT = 0;
let animStartDay = 0;

function tick(t: number) {
  if (!animStartT) { animStartT = t; animStartDay = currentDay; }
  const elapsed = t - animStartT;
  const progress = animationProgress(elapsed, YEAR_ANIM_DURATION_MS);
  const targetDay = animStartDay + progress * 365.25;
  setDay(targetDay % 365.25);
  if (progress < 1) rafId = requestAnimationFrame(tick);
  else stopAnimation();
}
```

Also add reduced-motion fallback: if `prefers-reduced-motion`, use 24 discrete steps (one per ~15 days) with `setTimeout` instead of smooth rAF.

**Step 4: Run tests + build**

**Step 5: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "fix(seasons): use fixed 10s animation duration, add reduced-motion fallback

Replace frame-rate-dependent daysPerSecond stepping with elapsed/duration
progress fraction. Adds reduced-motion fallback using 24 discrete steps."
```

---

### Task 9: Add smooth preset transitions

**Problem:** Clicking season presets (Spring Equinox, Summer Solstice, etc.) jumps instantly. Legacy animates over 500ms.

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts` (add easing function)
- Modify: `apps/demos/src/demos/seasons/main.ts` (animate preset transitions)
- Test: `apps/demos/src/demos/seasons/logic.test.ts`

**Step 1: Write failing test**

```typescript
describe("easeInOutCubic", () => {
  test("starts at 0", () => expect(easeInOutCubic(0)).toBe(0));
  test("ends at 1", () => expect(easeInOutCubic(1)).toBe(1));
  test("midpoint is 0.5", () => expect(easeInOutCubic(0.5)).toBe(0.5));
  test("first half is slow start", () => {
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
  });
});
```

**Step 2: Implement easing in logic.ts**

```typescript
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
```

**Step 3: Add preset transition in main.ts**

When a preset button is clicked, animate from current day to target day over 500ms using `easeInOutCubic`. Handle shortest-path wrapping (e.g., day 350 → day 10 should go forward 25 days, not backward 340).

**Step 4: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): animate preset transitions with 500ms eased interpolation"
```

---

### Task 10: Add keyboard shortcuts

**Problem:** No keyboard shortcuts. Legacy had ←/→ (step 1/30 days), E (equinox), S (solstice), Space (play/pause).

**Files:**
- Modify: `apps/demos/src/demos/seasons/main.ts` (add keydown handler)
- Test: `apps/site/tests/seasons.spec.ts` (add keyboard E2E tests)

**Step 1: Add keydown handler in main.ts**

```typescript
document.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  switch (e.key) {
    case "ArrowRight": stepDays(1); e.preventDefault(); break;
    case "ArrowLeft": stepDays(-1); e.preventDefault(); break;
    case "ArrowUp": stepDays(30); e.preventDefault(); break;
    case "ArrowDown": stepDays(-30); e.preventDefault(); break;
    case " ": togglePlayPause(); e.preventDefault(); break;
    case "e": case "E": goToEquinox(); break;
    case "s": case "S": goToSolstice(); break;
  }
});
```

**Step 2: Add E2E keyboard test**

```typescript
test("arrow keys step day of year", async ({ page }) => {
  const dayReadout = page.getByTestId("day-readout");
  await page.keyboard.press("ArrowRight");
  // Verify day advanced by 1
});
```

**Step 3: Commit**

```bash
git add apps/demos/src/demos/seasons/ apps/site/tests/seasons.spec.ts
git commit -m "feat(seasons): add keyboard shortcuts (arrows, E, S, Space)"
```

---

### Task 11: Add latitude slider

**Problem:** Legacy had a latitude slider (0–90°) that positioned a marker on the globe and computed day length for that latitude. The migrated demo has no latitude control.

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html` (add latitude slider)
- Modify: `apps/demos/src/demos/seasons/logic.ts` (ensure `dayLengthHours` exists)
- Modify: `apps/demos/src/demos/seasons/main.ts` (wire up slider, position marker)
- Test: `apps/demos/src/demos/seasons/logic.test.ts`

**Step 1: Verify dayLengthHours function exists**

Check if `@cosmic/physics` has a day-length function. If not, add one to logic.ts (it's a standard formula using declination and latitude).

```typescript
describe("dayLengthHours", () => {
  test("equator at equinox gives 12h", () => {
    expect(dayLengthHours(0, 0)).toBeCloseTo(12, 0);
  });
  test("45N at summer solstice gives ~15.5h", () => {
    expect(dayLengthHours(45, 23.44)).toBeCloseTo(15.5, 0);
  });
  test("arctic circle at summer solstice gives 24h", () => {
    expect(dayLengthHours(66.56, 23.44)).toBeCloseTo(24, 0);
  });
  test("south pole at summer solstice gives 0h (polar night)", () => {
    expect(dayLengthHours(-90, 23.44)).toBeCloseTo(0, 0);
  });
});
```

**Step 2: Implement (if needed)**

```typescript
export function dayLengthHours(latDeg: number, decDeg: number): number {
  const latRad = (latDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  if (cosH <= -1) return 24; // midnight sun
  if (cosH >= 1) return 0;   // polar night
  return (2 * Math.acos(cosH) / Math.PI) * 12;
}
```

**Step 3: Add slider to HTML**

```html
<label>
  <span>Latitude</span>
  <input type="range" id="latitude-slider" min="-90" max="90" value="45" step="1"
         aria-label="Observer latitude" data-tooltip-source="#latitude-display">
  <output id="latitude-display">45°N</output>
</label>
```

**Step 4: Wire in main.ts** — update globe marker position and day-length readout when latitude changes.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): add latitude slider with day-length computation and globe marker"
```

---

### Task 12: Update contract tests + full E2E verification

**Problem:** After all the changes above, contract tests need updating (new elements, globe view, overlay toggles) and E2E tests need to cover the new features.

**Files:**
- Modify: `apps/demos/src/demos/seasons/design-contracts.test.ts`
- Modify: `apps/site/tests/seasons.spec.ts`

**Step 1: Update contract tests**

- Add test for globe SVG elements (terminator, latitude bands, globe axis)
- Add test for overlay toggle `aria-pressed` attributes
- Add test for latitude slider presence
- Verify tilt slider max is "90"

**Step 2: Update E2E tests**

- Test globe rendering (terminator moves with day)
- Test overlay toggles show/hide elements
- Test latitude slider updates day-length readout
- Test distance exaggeration visible in orbit view
- Test tilt slider goes to 90°
- Test preset transitions are animated (not instant)

**Step 3: Run all gates**

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

**Step 4: Commit**

```bash
git add apps/demos/src/demos/seasons/ apps/site/tests/seasons.spec.ts
git commit -m "test(seasons): update contract tests and E2E for restored features"
```

---

### Task 13: Physics review for seasons

**Dispatch a physics review agent** to trace the full chain:
1. `@cosmic/physics` season model → `logic.ts` functions → `main.ts` rendering
2. Verify: declination calculation matches J2000 formula
3. Verify: day-length formula is correct (standard sunrise equation)
4. Verify: distance exaggeration is pedagogically sound (not misleading)
5. Verify: globe terminator position is geometrically correct
6. Verify: latitude band positions are correct for given tilt
7. Verify: animation wraps day-of-year correctly (no discontinuities)
8. Verify: coordinate conventions (SVG y-down) are handled correctly in globe

**Commit any fixes found.**

---

## Execution Order & Dependencies

```
Task 1 (eclipse animate-month fix) → Task 2 (signed beta) → Task 3 (eclipse E2E)
Task 4 (tilt + day format)
Task 5 (distance exaggeration)     → both feed into →  Task 6 (globe view)
Task 6 (globe view) → Task 7 (overlays) → Task 8 (animation) → Task 9 (presets)
Task 9 → Task 10 (keyboard)
Task 6 → Task 11 (latitude slider)
Tasks 1-11 all → Task 12 (tests) → Task 13 (physics review)
```

Eclipse tasks (1-3) are independent of seasons tasks (4-13) and can be done first as a quick win.

---

## Verification Gates

After all tasks complete, run the full gate sequence:

```bash
corepack pnpm -C packages/physics test -- --run           # 144 physics tests
corepack pnpm -C packages/theme test -- --run             # 109 theme tests
corepack pnpm -C apps/demos test -- --run                 # ~1,210+ demo tests
corepack pnpm build                                        # clean build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e  # 584+ E2E tests
```

All must pass before considering the work complete.
