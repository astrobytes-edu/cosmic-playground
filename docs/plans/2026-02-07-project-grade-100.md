# Project Grade 100/100 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the Cosmic Playground project from 92/100 (A) to 100/100 (A+) by closing all five grading gaps: E2E test coverage, physics reviews, accessibility, and architecture.

**Architecture:** The project uses a 4-layer testing protocol (physics → contracts → logic → E2E), a contract-driven design system with zero legacy tokens, and a humble-object pattern where `logic.ts` has pure functions and `main.ts` is thin DOM wiring. All physics lives in `@cosmic/physics`. E2E tests use Playwright.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, uPlot, KaTeX, SVG/Canvas 2D

---

## Part I: E2E Test Coverage (+2 points → 20/20)

Three demos have zero Playwright E2E tests. Each spec follows the pattern established in `apps/site/tests/retrograde-motion.spec.ts` (46 tests, the most recent reference).

**Reference patterns:**
- Navigation: `page.goto("play/<slug>/", { waitUntil: "domcontentloaded" })`
- Starfield: `await expect(page.locator("canvas.cp-starfield")).toBeAttached()` (not `toBeVisible`)
- Slider interaction: `slider.evaluate((el: HTMLInputElement) => { el.value = "50"; el.dispatchEvent(new Event("input", { bubbles: true })); })`
- Readout parsing: `parseFloat(await locator.textContent() || "NaN")`
- Screenshots: `test.skip("screenshot: ...", ...)` with `maxDiffPixelRatio: 0.05`

**Gate command (run after each spec is complete):**
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "<slug>"
```

---

### Task 1: Binary Orbits E2E Spec

**Files:**
- Create: `apps/site/tests/binary-orbits.spec.ts`

**Context:** Binary Orbits uses Canvas 2D (no SVG), has 2 sliders (`#massRatio`, `#separation`), 2 readouts (`#baryOffsetValue`, `#periodValue`), continuous rAF animation (no play/pause), station mode, help mode, and export. It renders at `play/binary-orbits/`.

**Step 1: Write the E2E spec**

Create `apps/site/tests/binary-orbits.spec.ts` with these test sections (~25-30 tests):

```typescript
import { test, expect } from "@playwright/test";

test.describe("Binary Orbits", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // === Layout & Visibility (6 tests) ===
  // - Title contains "Binary Orbits"
  // - #orbitCanvas visible
  // - .cp-demo__sidebar visible
  // - .cp-demo__readouts visible
  // - canvas.cp-starfield attached (toBeAttached, not toBeVisible)
  // - data-shell="viz-first" attribute present

  // === Controls (4 tests) ===
  // - #massRatio slider changes #massRatioValue text
  //   (set value to "3", dispatch input, verify display shows "3.0")
  // - #separation slider changes #separationValue text
  //   (set value to "6", dispatch input, verify display shows "6.0")
  // - Mass ratio slider respects min=0.2, max=5
  // - Separation slider respects min=1, max=8

  // === Readouts (4 tests) ===
  // - #baryOffsetValue is numeric with unit span containing "AU"
  // - #periodValue is numeric with unit span containing "yr"
  // - Changing mass ratio updates baryOffsetValue
  //   (read before, change slider, read after, values differ)
  // - Changing separation updates periodValue
  //   (read before, change slider, read after, values differ)

  // === Canvas Rendering (2 tests) ===
  // - Canvas has non-zero width and height
  // - Canvas has CSS background (not transparent)

  // === Accessibility (6 tests) ===
  // - #status has aria-live="polite"
  // - .cp-demo__sidebar has aria-label
  // - .cp-demo__readouts has aria-label
  // - .cp-demo__stage has aria-label
  // - Readout units in .cp-readout__unit spans (>= 2)
  // - Tab navigation reaches mass ratio slider

  // === Station Mode (3 tests) ===
  // - #stationMode button visible
  // - Click opens station panel (check for station-specific DOM)
  // - Station panel has "Add comparison set" button or preset

  // === Export (2 tests) ===
  // - #copyResults button visible
  // - Click #copyResults triggers status message containing "Copied"

  // === Reduced Motion (1 test) ===
  // - Under prefers-reduced-motion, canvas renders static (rAF count <= 1)
  //   Reference: smoke.spec.ts "Pilot demo respects prefers-reduced-motion"

  // === Visual Regression (2 tests, skipped) ===
  // - Default view screenshot
  // - High mass ratio (q=5) screenshot
});
```

**Implementation guidance:**
- For the reduced-motion test, follow the exact pattern from `smoke.spec.ts` line ~240 (the binary-orbits pilot test). That test already exists in smoke — you can move it here or duplicate it.
- For station mode tests, click `#stationMode`, then look for `.station-table` or similar DOM that appears.
- For slider interaction, always use the `.evaluate()` pattern, never `.fill()`.

**Step 2: Run the tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Binary Orbits"
```

Expected: All tests PASS.

**Step 3: Commit**

```bash
git add apps/site/tests/binary-orbits.spec.ts
git commit -m "test(e2e): add binary-orbits Playwright spec"
```

---

### Task 2: Conservation Laws E2E Spec

**Files:**
- Create: `apps/site/tests/conservation-laws.spec.ts`

**Context:** Conservation Laws uses SVG (`#orbitSvg`, 600x600 viewBox) with a central mass, orbiting particle, orbit path, and velocity vector. It has 4 log-scale sliders (`#massSlider`, `#r0Slider`, `#speedFactor`, `#directionDeg`), 4 preset chips (`circular`, `elliptical`, `escape`, `hyperbolic`), play/pause/reset animation controls, 6 readouts (`#orbitType`, `#ecc`, `#eps`, `#h`, `#vKmS`, `#rpAu`), station mode, help mode, and export. Renders at `play/conservation-laws/`.

**Step 1: Write the E2E spec**

Create `apps/site/tests/conservation-laws.spec.ts` with these test sections (~30-35 tests):

```typescript
import { test, expect } from "@playwright/test";

test.describe("Conservation Laws", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // === Layout & Visibility (6 tests) ===
  // - Title contains "Conservation Laws" or "Orbital Mechanics"
  // - #orbitSvg visible
  // - .cp-demo__sidebar visible with header
  // - .cp-demo__readouts visible
  // - canvas.cp-starfield attached
  // - data-shell="viz-first" attribute present

  // === Slider Controls (5 tests) ===
  // - #massSlider changes #massValue text
  //   (log-scale: set slider to "0.5", verify #massValue updates)
  // - #r0Slider changes #r0Value text
  // - #speedFactor changes #speedValue text
  //   (set to "1.414", verify display shows ~1.41)
  // - #directionDeg changes #directionValue text
  //   (set to "45", verify display shows "45")
  // - Speed factor shows escape note when v >= sqrt(2)

  // === Preset Chips (4 tests) ===
  // - Clicking [data-preset="circular"] sets speed=1, direction=0
  // - Clicking [data-preset="elliptical"] sets speed=0.75
  // - Clicking [data-preset="escape"] sets speed to sqrt(2)
  // - Clicking [data-preset="hyperbolic"] sets speed=1.8

  // === Animation Controls (4 tests) ===
  // - Play/pause/reset buttons visible
  // - Click play disables play button, enables pause
  // - Click pause re-enables play
  // - Click reset returns particle to initial position

  // === Readouts (6 tests) ===
  // - #orbitType shows one of: "Circular", "Elliptical", "Parabolic", "Hyperbolic"
  // - #ecc is numeric (eccentricity)
  // - #eps has unit span "AU²/yr²"
  // - #h has unit span "AU²/yr"
  // - #vKmS has unit span "km/s"
  // - #rpAu has unit span "AU"

  // === Physics Behavior (3 tests) ===
  // - Circular preset: eccentricity ~0 (parseFloat < 0.05)
  // - Escape preset: orbit type is "Parabolic"
  // - Hyperbolic preset: orbit type is "Hyperbolic"

  // === SVG Structure (2 tests) ===
  // - #centralMass circle visible
  // - #orbitPath path element present

  // === Accessibility (5 tests) ===
  // - #status has aria-live="polite"
  // - .cp-demo__sidebar has aria-label
  // - .cp-demo__readouts has aria-label
  // - Readout units in .cp-readout__unit spans (>= 4)
  // - Tab navigation reaches play button

  // === Export (2 tests) ===
  // - #copyResults button visible
  // - Click triggers "Copied" status message

  // === Visual Regression (3 tests, skipped) ===
  // - Default circular orbit screenshot
  // - Elliptical preset screenshot
  // - Hyperbolic preset screenshot
});
```

**Implementation guidance:**
- Log-scale sliders: the slider value (e.g., `"0.5"`) maps to a log-transformed physical value. The display (`#massValue`) shows the physical value, not the slider position. Don't assert exact numeric values — just verify the text changed.
- Preset chips use `data-preset` attribute, click via `page.locator('[data-preset="circular"]').click()`.
- The orbit type readout (`#orbitType`) contains a KaTeX-rendered classification or plain text — use `.textContent()` and match against known orbit type names.

**Step 2: Run the tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Conservation Laws"
```

Expected: All tests PASS.

**Step 3: Commit**

```bash
git add apps/site/tests/conservation-laws.spec.ts
git commit -m "test(e2e): add conservation-laws Playwright spec"
```

---

### Task 3: Planetary Conjunctions E2E Spec

**Files:**
- Create: `apps/site/tests/planetary-conjunctions.spec.ts`

**Context:** Planetary Conjunctions uses SVG (`#conjunctionSvg`, 600x600 viewBox) with Earth and target planet orbits, conjunction line, and flash animation. It has a 4-planet radio chip group (`Venus`, `Mars`, `Jupiter`, `Saturn`), 1 speed slider (`#speedSlider`), a reset button (`#reset`), 6 readouts (`#synodicPeriod`, `#daysElapsed`, `#conjunctionCount`, `#earthAngle`, `#targetAngle`, `#separation`), and export. Renders at `play/planetary-conjunctions/`. No station mode. Continuous auto-start animation.

**Step 1: Write the E2E spec**

Create `apps/site/tests/planetary-conjunctions.spec.ts` with these test sections (~25-30 tests):

```typescript
import { test, expect } from "@playwright/test";

test.describe("Planetary Conjunctions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/planetary-conjunctions/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // === Layout & Visibility (6 tests) ===
  // - Title contains "Planetary Conjunctions" or "Conjunctions"
  // - #conjunctionSvg visible
  // - .cp-demo__sidebar visible
  // - .cp-demo__readouts visible
  // - canvas.cp-starfield attached
  // - data-shell="viz-first" attribute present

  // === Planet Selection (4 tests) ===
  // - Default selected planet is Mars (aria-checked="true" on [data-planet="Mars"])
  // - Click [data-planet="Venus"] changes selection (aria-checked flips)
  // - Click [data-planet="Jupiter"] updates #synodicPeriod readout
  // - Click [data-planet="Saturn"] updates #targetAngle to different range

  // === Speed Slider (2 tests) ===
  // - #speedSlider changes #speedValue display
  //   (set to "50", verify shows "50")
  // - Speed slider respects min=1, max=100

  // === Animation & Reset (3 tests) ===
  // - Days elapsed increments over time (wait 1s, compare before/after)
  // - Reset button sets days elapsed back to 0
  // - Reset button sets conjunction count to 0

  // === Readouts (6 tests) ===
  // - #synodicPeriod is numeric with unit span "days"
  // - #daysElapsed is numeric with unit span "days"
  // - #conjunctionCount is numeric (integer)
  // - #earthAngle is numeric with unit span containing "deg" or "°"
  // - #targetAngle is numeric with unit span
  // - #separation is numeric with unit span

  // === Synodic Period Physics (2 tests) ===
  // - Mars synodic period ~780 days (parseFloat between 770 and 790)
  // - Venus synodic period ~584 days (switch planet, check between 574 and 594)

  // === SVG Structure (3 tests) ===
  // - #earthOrbit circle visible
  // - #targetOrbit circle visible
  // - #earthDot and #targetDot visible

  // === Accessibility (5 tests) ===
  // - #status has aria-live="polite"
  // - .cp-demo__sidebar has aria-label
  // - .cp-demo__readouts has aria-label
  // - Planet selector has role="radiogroup"
  // - Readout units in .cp-readout__unit spans (>= 4)

  // === Export (2 tests) ===
  // - #copyResults button visible
  // - Click triggers "Copied" status message

  // === Visual Regression (2 tests, skipped) ===
  // - Default Mars view screenshot
  // - Venus selected screenshot
});
```

**Implementation guidance:**
- Planet chips use `role="radio"` with `aria-checked` attributes. Click via `page.locator('[data-planet="Venus"]').click()`.
- Animation auto-starts — the days elapsed readout will already be > 0 by the time assertions run. For the "reset" test, click reset first, then verify daysElapsed shows "0".
- For synodic period assertions, use a range: `expect(parseFloat(text)).toBeGreaterThan(770)` and `toBeLessThan(790)` for Mars.

**Step 2: Add planetary-conjunctions to smoke.spec.ts migration list**

Modify `apps/site/tests/smoke.spec.ts` — add to the `migratedInteractiveDemos` array (after the `telescope-resolution` entry at line ~336):

```typescript
    {
      slug: "planetary-conjunctions",
      expects: ["Synodic period (days)", "Days elapsed", "Conjunctions observed"]
    }
```

**Step 3: Run all E2E tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected: All tests PASS (including new smoke test for planetary-conjunctions export).

**Step 4: Commit**

```bash
git add apps/site/tests/planetary-conjunctions.spec.ts apps/site/tests/smoke.spec.ts
git commit -m "test(e2e): add planetary-conjunctions Playwright spec + smoke export"
```

---

## Part II: Accessibility Hardening (+3 points → 20/20)

Three accessibility gaps need closing: tour Escape-key dismissal, WCAG contrast audit, and reduced-motion verification.

---

### Task 4: Tour Escape-Key Dismissal

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/main.ts` (tour implementation, ~line 1366-1466)

**Context:** The EOS Lab guided tour creates an overlay + tooltip step-by-step walkthrough. Clicking the overlay dismisses it. But pressing Escape does nothing. The popover (`packages/runtime/src/popover.ts:88-92`) and bottom sheet (`packages/runtime/src/bottomSheet.ts:135-139`) both handle Escape correctly — the tour should follow the same pattern.

**Step 1: Find the tour `cleanup()` function in `main.ts`**

Read `apps/demos/src/demos/eos-lab/main.ts` and locate the tour implementation (search for "tour"). Find the `cleanup()` function that the overlay click handler calls.

**Step 2: Add Escape key listener**

Inside the tour initialization (after the overlay click handler), add a keydown listener:

```typescript
function onEscapeTour(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    cleanup();
  }
}
document.addEventListener("keydown", onEscapeTour);
```

And in the `cleanup()` function body, add the removal:

```typescript
document.removeEventListener("keydown", onEscapeTour);
```

**Step 3: Add contract test assertion**

In `apps/demos/src/demos/eos-lab/design-contracts.test.ts`, add inside the existing test suite:

```typescript
it("tour supports Escape key dismissal", () => {
  expect(mainTs).toContain('"Escape"');
  expect(mainTs).toMatch(/cleanup|closeTour/);
});
```

**Step 4: Run tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/
```

Expected: All EOS Lab tests PASS (38 contract + 61 logic + 1 new = 100).

**Step 5: Commit**

```bash
git add apps/demos/src/demos/eos-lab/main.ts apps/demos/src/demos/eos-lab/design-contracts.test.ts
git commit -m "a11y(eos-lab): add Escape key dismissal to guided tour"
```

---

### Task 5: WCAG AA Contrast Audit

**Files:**
- Modify: `packages/theme/styles/tokens.css` (if any token values need adjustment)
- Modify: various demo `style.css` files (if per-demo overrides needed)
- Create: `packages/theme/src/contrast.test.ts` (contrast ratio tests — may already exist)

**Context:** WCAG AA requires 4.5:1 contrast ratio for normal text, 3:1 for large text (>=18pt or >=14pt bold). The design system uses `--cp-fg0` (off-white, ~`rgb(215,220,228)`) on `--cp-bg0` (dark, ~`rgb(15,17,21)`). Most token pairs likely pass, but need verification for:
- Muted text (`--cp-fg1`, `--cp-fg2`) on dark backgrounds
- Readout unit color (`--cp-readout-unit-color`, ice-blue) on dark panel backgrounds
- Legend/caption text on translucent panels
- Disabled/dimmed states (e.g., `opacity: 0.55` on LTE caution cards)

**Step 1: Check if contrast tests already exist**

Read `packages/theme/src/contrast.test.ts` — it may already exist from the component consolidation phase. If it does, check what pairs are covered and add any missing pairs.

**Step 2: Identify all text-on-background pairs**

Search `packages/theme/styles/tokens.css` for all foreground color tokens and their intended background pairings. Key pairs to test:

| Foreground Token | Background Token | Context | Min Ratio |
|-----------------|-----------------|---------|-----------|
| `--cp-fg0` | `--cp-bg0` | Body text | 4.5:1 |
| `--cp-fg1` | `--cp-bg0` | Muted text | 4.5:1 |
| `--cp-fg2` | `--cp-bg0` | Dimmed text | 4.5:1 |
| `--cp-readout-value-color` | `--cp-bg0` | Amber readouts | 4.5:1 |
| `--cp-readout-unit-color` | `--cp-bg0` | Ice-blue units | 4.5:1 |
| `--cp-readout-label-color` | `--cp-bg0` | Label text | 4.5:1 |
| `--cp-accent-amber` | `--cp-bg0` | Accent text | 4.5:1 |
| `--cp-accent-ice` | `--cp-bg0` | Accent text | 4.5:1 |
| `--cp-fg0` | `--cp-instr-panel-bg` | Panel text | 4.5:1 |

**Step 3: Write contrast ratio test**

If `contrast.test.ts` doesn't exist or is incomplete, write tests that parse token values from `tokens.css` and compute WCAG contrast ratios using the relative luminance formula:

```typescript
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

Assert each pair meets >= 4.5 for normal text, >= 3.0 for large text/UI components.

**Step 4: Fix any failing pairs**

If any token pair fails the contrast check, adjust the token value in `tokens.css` to meet the minimum ratio. Typical fixes:
- Brighten muted text slightly (increase lightness)
- Darken translucent panel backgrounds (increase opacity)

**Step 5: Run tests**

```bash
corepack pnpm -C packages/theme test -- --run
```

Expected: All 97+ theme tests PASS.

**Step 6: Commit**

```bash
git add packages/theme/
git commit -m "a11y(theme): WCAG AA contrast ratio verification for all text/bg token pairs"
```

---

### Task 6: Reduced-Motion Verification

**Files:**
- Possibly modify: demo `main.ts` files that use rAF animation loops
- Create: test assertions in E2E specs

**Context:** CSS reduced-motion is handled globally in `packages/theme/styles/animations.css` (lines 80-88) — it sets `animation-duration: 0.01ms !important` and `transition-duration: 0.01ms !important`. But JS-driven `requestAnimationFrame` loops in demos are NOT automatically suppressed. Some demos check `prefers-reduced-motion` in JS (moon-phases does), but others may not.

**Step 1: Audit all rAF-using demos for JS-side reduced-motion checks**

Search each demo's `main.ts` for BOTH `requestAnimationFrame` AND `prefers-reduced-motion`:

| Demo | Has rAF? | Has JS reduced-motion check? |
|------|----------|------------------------------|
| binary-orbits | Yes | Check |
| conservation-laws | Yes | Check |
| planetary-conjunctions | Yes | Check |
| eclipse-geometry | Yes | Check |
| keplers-laws | Yes | Check |
| retrograde-motion | Yes | Check |
| seasons | Yes | Check |
| moon-phases | Yes | Yes (confirmed) |

**Step 2: Add reduced-motion guard to any demo missing it**

For each demo that has rAF but no JS check, add near the top of `main.ts`:

```typescript
const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
```

Then in the animation loop, either:
- Skip the loop entirely and render a static frame, OR
- Render at reduced frequency (every 500ms instead of every frame)

The exact approach depends on the demo — some need at least one frame to show the initial state.

**Step 3: Add E2E reduced-motion test to each new spec**

In each of the 3 new E2E specs (Tasks 1-3), add a reduced-motion test following the smoke.spec.ts pilot pattern:

```typescript
test("respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("play/<slug>/", { waitUntil: "domcontentloaded" });
  // Verify animation doesn't run continuously
  // (exact assertion depends on demo — check rAF count or static render)
});
```

**Step 4: Run full E2E suite**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/*/main.ts
git commit -m "a11y: add JS-side prefers-reduced-motion guard to all animated demos"
```

---

## Part III: Physics Reviews (+2 points → 20/20)

Only 2 of 14 demos have had formal physics reviews (retrograde-motion, eos-lab). The remaining 12 need the 3-agent review: code quality + science correctness + coordinate audit.

**Critical principle from MEMORY.md:** Physics review caught 3 critical sign bugs in eclipse-geometry that all unit tests and E2E tests missed. This layer is essential for geometry-heavy demos.

---

### Task 7: Physics Reviews — Geometry-Heavy Demos (Batch 1)

**Files:**
- Create: `docs/reviews/<slug>.md` for each reviewed demo

**Context:** These demos involve coordinate systems, angles, and geometric rendering — the highest-risk category for sign bugs, axis flips, and convention mismatches.

**Step 1: Review eclipse-geometry**

Dispatch 3 parallel agents using the reviewing-demos skill:

1. **Science Correctness Agent**: Trace every physics equation from `@cosmic/physics` through `logic.ts` to SVG rendering. Verify: angular diameter formula, umbra/penumbra geometry, beta (ecliptic latitude) mapping, shadow cone calculations.

2. **Coordinate Audit Agent**: Trace every rendering chain:
   - Physics model (math convention: CCW, y-up) → `logic.ts` helpers → SVG (CW, y-down)
   - `svgPointToAngleDeg`: verify `dy = pointY - centerY` (not inverted)
   - Beta curve: positive beta → UP in SVG → `panelCenterY - beta * yScale`
   - Drag interaction: verify inverse mapping matches forward mapping

3. **Code Quality Agent**: Architecture compliance, dead code, performance.

Write results to `docs/reviews/eclipse-geometry.md`.

**Step 2: Review keplers-laws**

Same 3-agent pattern. Key areas:
- `orbitalToSvg` negates x (`xOrb = -r*cos(theta)`) — verify `getAngleFromEvent` uses `centerX - svgX`
- Canvas orbit trail rendering (x-mirror relative to SVG)
- Kepler equation solver convergence
- Equal-areas sweep visualization accuracy

Write results to `docs/reviews/keplers-laws.md`.

**Step 3: Review angular-size**

Same 3-agent pattern. Key areas:
- Angular diameter formula: `theta = 2 * arctan(D / (2*d))`
- Small-angle approximation boundary
- SVG scaling of apparent size circle

Write results to `docs/reviews/angular-size.md`.

**Step 4: Review parallax-distance**

Same 3-agent pattern. Key areas:
- Parallax formula: `d = 1/p` (pc from arcsec)
- Baseline geometry (Earth's orbit)
- Error propagation (`sigma_p` to distance uncertainty)

Write results to `docs/reviews/parallax-distance.md`.

**Step 5: Commit**

```bash
git add docs/reviews/
git commit -m "docs(reviews): add physics reviews for eclipse-geometry, keplers-laws, angular-size, parallax-distance"
```

---

### Task 8: Physics Reviews — Remaining Demos (Batch 2)

**Files:**
- Create: `docs/reviews/<slug>.md` for each reviewed demo

**Step 1: Review seasons**

Key areas:
- Axial tilt geometry (obliquity → declination)
- Solar angle calculation
- Dual-panel SVG (orbit + tilt geometry)
- Day length formula

**Step 2: Review blackbody-radiation**

Key areas:
- Planck function: `B_lambda = (2hc^2 / lambda^5) / (exp(hc/(lambda*kT)) - 1)`
- Wien displacement law: `lambda_peak = b/T`
- Stefan-Boltzmann luminosity scaling
- Canvas plot: wavelength axis (log or linear?), spectral gradient physical accuracy

**Step 3: Review telescope-resolution**

Key areas:
- Rayleigh criterion: `theta = 1.22 * lambda / D`
- Airy pattern (PSF) rendering
- Seeing-limited vs diffraction-limited regime
- Binary star resolution visualization

**Step 4: Review em-spectrum**

Key areas:
- Wavelength ↔ frequency ↔ energy conversions: `c = lambda*nu`, `E = h*nu`
- Unit scaling (nm, um, mm, m, cm)
- EM band boundaries (radio, microwave, IR, visible, UV, X-ray, gamma)
- Spectral gradient physical accuracy

**Step 5: Review moon-phases**

Key areas:
- Phase angle → illumination fraction: `f = (1 + cos(alpha)) / 2`
- Terminator curve geometry
- Lunar orbit geometry

**Step 6: Review conservation-laws, binary-orbits, planetary-conjunctions**

Key areas:
- Conservation laws: Kepler orbit mechanics, energy/angular-momentum conservation, orbit classification
- Binary orbits: barycenter calculation, period from Kepler's third law, mass ratio geometry
- Planetary conjunctions: synodic period formula `P_syn = |P1*P2/(P1-P2)|`, conjunction detection

**Step 7: Commit**

```bash
git add docs/reviews/
git commit -m "docs(reviews): add physics reviews for remaining 8 demos (14/14 complete)"
```

---

## Part IV: Architecture Polish (+1 point → 20/20)

---

### Task 9: Web Worker for EOS Lab Regime Grid

**Files:**
- Create: `apps/demos/src/demos/eos-lab/regimeWorker.ts`
- Modify: `apps/demos/src/demos/eos-lab/regimeMap.ts`
- Modify: `apps/demos/src/demos/eos-lab/main.ts`

**Context:** `evaluateRegimeGrid()` in `logic.ts` iterates over 8,000 cells (100×80 grid), calling `StellarEosModel.evaluateStateCgs()` on each. This blocks the main thread for ~50ms on fast hardware, potentially longer on student laptops. Moving this to a Web Worker eliminates jank during composition slider interaction.

**Step 1: Create the Worker module**

Create `apps/demos/src/demos/eos-lab/regimeWorker.ts`:

```typescript
// Web Worker for regime grid evaluation
// Receives: { logTMin, logTMax, logRhoMin, logRhoMax, cols, rows, X, Y, eta }
// Returns: { grid: Uint8Array, elapsed: number }

import { StellarEosModel } from "@cosmic/physics";

self.onmessage = (e: MessageEvent) => {
  const { logTMin, logTMax, logRhoMin, logRhoMax, cols, rows, X, Y, eta } = e.data;
  const t0 = performance.now();
  const grid = new Uint8Array(cols * rows);
  const model = new StellarEosModel();

  for (let j = 0; j < rows; j++) {
    const logRho = logRhoMax - (j / (rows - 1)) * (logRhoMax - logRhoMin);
    for (let i = 0; i < cols; i++) {
      const logT = logTMin + (i / (cols - 1)) * (logTMax - logTMin);
      const state = model.evaluateStateCgs(
        Math.pow(10, logT), Math.pow(10, logRho), X, Y, eta
      );
      // Encode dominant channel as 0=gas, 1=radiation, 2=degeneracy
      grid[j * cols + i] = state.dominantChannel;
    }
  }

  const elapsed = performance.now() - t0;
  self.postMessage({ grid, elapsed }, [grid.buffer]);
};
```

**Step 2: Update regimeMap.ts to accept pre-computed grids**

Modify `renderRegimeMap()` to accept an optional pre-computed grid instead of computing inline. The synchronous path remains as fallback.

**Step 3: Wire Worker in main.ts**

In `main.ts`, create the Worker on init:

```typescript
const regimeWorker = new Worker(
  new URL("./regimeWorker.ts", import.meta.url),
  { type: "module" }
);
```

Post messages on composition change, receive results and render.

**Step 4: Verify Vite handles the Worker**

Vite supports `new Worker(new URL(...), { type: "module" })` natively. No config change needed.

**Step 5: Run tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/
corepack pnpm build
```

Expected: All tests PASS, build succeeds.

**Step 6: Commit**

```bash
git add apps/demos/src/demos/eos-lab/regimeWorker.ts apps/demos/src/demos/eos-lab/regimeMap.ts apps/demos/src/demos/eos-lab/main.ts
git commit -m "perf(eos-lab): move regime grid evaluation to Web Worker"
```

---

### Task 10: Final Audit and Grade Update

**Files:**
- Create: `docs/reviews/2026-02-XX-grade-100.md`
- Modify: `docs/reviews/README.md`

**Step 1: Run all test suites**

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C packages/theme test -- --run
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

All must pass.

**Step 2: Generate final quality audit**

Use the `reviewing-project-quality` skill to generate a comprehensive audit. Verify all 5 categories score 20/20:

| Category | Target | Evidence |
|----------|--------|----------|
| Test coverage | 20 | All 14 demos have E2E specs |
| Design system | 20 | Zero legacy tokens/components |
| Physics correctness | 20 | 14/14 demos reviewed |
| Accessibility | 20 | Tour Escape, contrast audit, reduced-motion verified |
| Architecture | 20 | Web Worker, clean separation |

**Step 3: Commit**

```bash
git add docs/reviews/
git commit -m "docs(reviews): final A+ (100/100) quality audit"
```

---

## Verification Gates (run at end of each Part)

```bash
# Unit tests (physics + theme + demo)
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C packages/theme test -- --run
corepack pnpm -C apps/demos test -- --run

# Build
corepack pnpm build

# E2E
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e

# Typecheck
corepack pnpm -C apps/site typecheck
```

---

## Execution Order Summary

| Order | Task | Points | Deps |
|:-----:|------|:------:|------|
| 1 | Task 1: Binary Orbits E2E | +0.67 | None |
| 2 | Task 2: Conservation Laws E2E | +0.67 | None |
| 3 | Task 3: Planetary Conjunctions E2E + smoke | +0.67 | None |
| 4 | Task 4: Tour Escape key | +0.5 | None |
| 5 | Task 5: WCAG contrast audit | +1.0 | None |
| 6 | Task 6: Reduced-motion verification | +1.5 | Tasks 1-3 (adds tests to new specs) |
| 7 | Task 7: Physics reviews batch 1 (4 demos) | +1.0 | None |
| 8 | Task 8: Physics reviews batch 2 (8 demos) | +1.0 | None |
| 9 | Task 9: Web Worker for regime grid | +1.0 | None |
| 10 | Task 10: Final audit | — | All above |

**Parallelizable:** Tasks 1-3 can run in parallel. Tasks 4-5 can run in parallel. Tasks 7-8 are sequential (same skill). Task 9 is independent.
