# EOS Lab Enhancements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix remaining review findings and add pedagogical enhancements to EOS Lab, bringing it from "state-of-the-art" to "field-defining reference implementation."

**Architecture:** All fixes are localized to the eos-lab demo files (`mechanismViz.ts`, `regimeMap.ts`, `main.ts`, `logic.ts`, `style.css`, `index.html`). The physics model (`stellarEosModel.ts`) is already correct after the Chandrasekhar fix. New features follow the existing pure-function extraction pattern (logic.ts) and Canvas 2D rendering patterns (regimeMap.ts).

**Tech Stack:** TypeScript, Canvas 2D, KaTeX, uPlot, CSS custom properties, Vitest, Playwright

**Source review:** `docs/audits/2026-02-07-eos-lab-expert-review.md`

---

### Task 0: Read the review and understand existing code

**Files:**
- Read: `docs/audits/2026-02-07-eos-lab-expert-review.md`
- Read: `apps/demos/src/demos/eos-lab/mechanismViz.ts`
- Read: `apps/demos/src/demos/eos-lab/regimeMap.ts`
- Read: `apps/demos/src/demos/eos-lab/main.ts`
- Read: `apps/demos/src/demos/eos-lab/logic.ts`
- Read: `apps/demos/src/demos/eos-lab/index.html`
- Read: `apps/demos/src/demos/eos-lab/style.css`
- Read: `apps/demos/src/demos/eos-lab/design-contracts.test.ts`
- Read: `apps/demos/src/demos/eos-lab/logic.test.ts`
- Read: `apps/site/tests/eos-lab.spec.ts`

**Step 1:** Read all files listed above. Understand the architecture before making any changes.

**Step 2:** Verify starting state is clean:

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/`
Expected: 62 tests pass (24 contract + 38 logic)

Run: `corepack pnpm build`
Expected: Build clean

---

### Task 1: Resolve regime map channel colors from CSS custom properties

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/regimeMap.ts`

**Problem:** Channel colors (gas, radiation, degeneracy, mixed) are hardcoded hex values in `regimeMap.ts` that duplicate the values set in `main.ts`. If the channel colors in `main.ts` change, the regime map would be out of sync.

**Step 1:** Read `regimeMap.ts` and find the `resolveColors` function and the channel color definitions. The colors are currently hardcoded as hex strings in the colors object (e.g., `gas: "#34d399"`, `radiation: "#facc15"`, `degeneracy: "#a78bfa"`, `mixed: "#94a3b8"`).

**Step 2:** Modify `resolveColors` to also resolve `--eos-gas`, `--eos-rad`, `--eos-deg` from the stage element (or document root). Add a new parameter to `renderRegimeMap` for the stage element reference, OR resolve from the canvas's parent tree.

The approach: since `main.ts` sets these as CSS custom properties on the stage element (`stage.style.setProperty("--eos-gas", ...)`), the regime map canvas is a descendant of stage, so `getComputedStyle(canvas)` will inherit them.

**Step 3:** Replace the hardcoded hex values with calls to resolve the CSS custom properties:

```typescript
// In resolveColors(), add:
const canvasEl = canvas; // available from renderRegimeMap's first arg
colors.gas = getComputedStyle(canvasEl).getPropertyValue("--eos-gas").trim() || "#34d399";
colors.radiation = getComputedStyle(canvasEl).getPropertyValue("--eos-rad").trim() || "#facc15";
colors.degeneracy = getComputedStyle(canvasEl).getPropertyValue("--eos-deg").trim() || "#a78bfa";
```

Keep the hex fallbacks for safety but the primary source is now CSS.

**Step 4:** Verify:

Run: `corepack pnpm build`
Expected: Build clean

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/`
Expected: All tests pass

**Step 5:** Commit:

```bash
git add apps/demos/src/demos/eos-lab/regimeMap.ts
git commit -m "refactor(eos-lab): resolve regime map channel colors from CSS custom properties"
```

---

### Task 2: Add Canvas resize handling to mechanism animations

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/mechanismViz.ts`

**Problem:** `setupCanvas` is called only on `start()`. If the browser window resizes, the canvas dimensions become stale and rendering is misaligned. The `regimeMap.ts` already handles this correctly by calling `resizeCanvasToCssPixels` on every render.

**Step 1:** Read `mechanismViz.ts`. Note that `w` and `h` are set in `start()` from `getBoundingClientRect()` and never updated.

**Step 2:** Add a `ResizeObserver` to each animation class. When the canvas resizes, call `setupCanvas` again to update dimensions:

In the `MechanismAnimation` interface, the `start()` method already takes a canvas. Add a private `resizeObserver` field to each class.

For each of the three classes (Gas, Radiation, Degeneracy), add to `start()`:

```typescript
this.resizeObserver = new ResizeObserver(() => {
  this.ctx = setupCanvas(this.canvas!);
  const rect = this.canvas!.getBoundingClientRect();
  this.w = rect.width;
  this.h = rect.height;
  // Gas and Radiation need particle positions re-clamped
  // Degeneracy just redraws
});
this.resizeObserver.observe(canvas);
```

And in `stop()`:

```typescript
this.resizeObserver?.disconnect();
this.resizeObserver = null;
```

**Step 3:** For Gas and Radiation, after resize re-clamp all particle positions to new bounds:

```typescript
for (const p of this.particles) {
  p.x = Math.min(p.x, this.w - p.radius);
  p.y = Math.min(p.y, this.h - p.radius);
}
```

**Step 4:** Verify:

Run: `corepack pnpm build`
Expected: Build clean

**Step 5:** Commit:

```bash
git add apps/demos/src/demos/eos-lab/mechanismViz.ts
git commit -m "fix(eos-lab): add ResizeObserver to mechanism animations for responsive canvas"
```

---

### Task 3: Add adiabatic index (γ_eff) readout

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/logic.ts`
- Modify: `apps/demos/src/demos/eos-lab/logic.test.ts`
- Modify: `apps/demos/src/demos/eos-lab/index.html`
- Modify: `apps/demos/src/demos/eos-lab/main.ts`

**Problem:** The effective adiabatic index γ_eff = d(ln P_total)/d(ln ρ) transitions from 5/3 (ideal gas) to 4/3 (radiation-dominated or ultrarelativistic degeneracy). This connects directly to stellar stability (γ < 4/3 = dynamically unstable).

**Step 1: Write the failing test**

Add to `logic.test.ts`:

```typescript
describe("adiabaticIndex", () => {
  it("returns ~5/3 for gas-dominated conditions", () => {
    // Solar envelope: ideal gas dominated → gamma ≈ 5/3
    const gamma = adiabaticIndex({
      T: 5800, rho: 1e-7, X: 0.74, Y: 0.24, eta: 1.0,
      evaluate: mockEvaluate,
    });
    expect(gamma).toBeCloseTo(5 / 3, 1);
  });

  it("returns ~4/3 for radiation-dominated conditions", () => {
    // High T, low rho: radiation dominates → gamma ≈ 4/3
    const gamma = adiabaticIndex({
      T: 1e8, rho: 1e-8, X: 0.70, Y: 0.28, eta: 1.0,
      evaluate: mockEvaluate,
    });
    expect(gamma).toBeCloseTo(4 / 3, 1);
  });
});
```

Where `mockEvaluate` is a callback that wraps `StellarEosModel.evaluate()` for DI (same pattern as other logic.ts functions).

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/logic.test.ts`
Expected: FAIL (function not defined)

**Step 2: Implement adiabaticIndex in logic.ts**

The approach: numerical derivative via centered finite differences on log-log scale:

```typescript
export function adiabaticIndex(args: {
  T: number;
  rho: number;
  X: number;
  Y: number;
  eta: number;
  evaluate: (T: number, rho: number, X: number, Y: number, eta: number) => { totalPressureDynePerCm2: number };
}): number {
  const { T, rho, X, Y, eta, evaluate } = args;
  const delta = 0.01; // 1% perturbation in log space
  const rhoHi = rho * Math.pow(10, delta);
  const rhoLo = rho * Math.pow(10, -delta);
  const pHi = evaluate(T, rhoHi, X, Y, eta).totalPressureDynePerCm2;
  const pLo = evaluate(T, rhoLo, X, Y, eta).totalPressureDynePerCm2;
  if (pHi <= 0 || pLo <= 0) return NaN;
  return (Math.log10(pHi) - Math.log10(pLo)) / (2 * delta);
}
```

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/logic.test.ts`
Expected: PASS

**Step 3: Add readout to HTML**

In `index.html`, find the readout strip (`.cp-readout-strip`). Add a new readout after the existing ones:

```html
<div class="cp-readout">
  <span class="cp-readout__label">$\gamma_{\rm eff}$</span>
  <span class="cp-readout__value" id="gammaEffValue">—</span>
  <span class="cp-readout__unit" id="gammaEffNote"></span>
</div>
```

**Step 4: Wire in main.ts**

In `main.ts`, in the `render()` function where other readouts are updated:

```typescript
const gammaEff = adiabaticIndex({
  T: state.T, rho: state.rho,
  X: state.composition.X, Y: state.composition.Y,
  eta: state.radiationDepartureEta,
  evaluate: (T, rho, X, Y, eta) => StellarEosModel.evaluate({
    temperatureK: T, densityGPerCm3: rho,
    composition: compositionFromXY(X, Y),
    radiationDepartureEta: eta,
  }),
});
gammaEffValue.textContent = Number.isFinite(gammaEff) ? gammaEff.toFixed(3) : "—";
gammaEffNote.textContent = gammaEff < 4/3 + 0.01 ? "(unstable)" : "";
```

**Step 5: Add design contract test**

In `design-contracts.test.ts`, add:

```typescript
it("includes adiabatic index readout", () => {
  expect(html).toContain('id="gammaEffValue"');
  expect(mainTs).toContain("adiabaticIndex");
  expect(html).toContain("gamma_{\\rm eff}");
});
```

**Step 6: Add E2E test**

In `eos-lab.spec.ts`:

```typescript
test("adiabatic index readout is visible", async ({ page }) => {
  await expect(page.locator("#gammaEffValue")).toBeVisible();
  const gamma = await page.locator("#gammaEffValue").textContent();
  expect(Number(gamma)).toBeGreaterThan(1);
  expect(Number(gamma)).toBeLessThan(2);
});
```

**Step 7:** Verify all tests pass and build clean. Commit:

```bash
git add apps/demos/src/demos/eos-lab/{logic.ts,logic.test.ts,index.html,main.ts,design-contracts.test.ts}
git add apps/site/tests/eos-lab.spec.ts
git commit -m "feat(eos-lab): add adiabatic index gamma_eff readout with stability indicator"
```

---

### Task 4: Symbolic → substituted equation toggle on Tab 2

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/logic.ts`
- Modify: `apps/demos/src/demos/eos-lab/logic.test.ts`
- Modify: `apps/demos/src/demos/eos-lab/main.ts`
- Modify: `apps/demos/src/demos/eos-lab/style.css`

**Problem:** Tab 2 equations currently show only the fully-substituted form. Students should first see the symbolic formula, then click to reveal numerical substitution.

**Step 1: Write failing test**

Add to `logic.test.ts`:

```typescript
describe("symbolic equation formatters", () => {
  it("gasEquationSymbolic returns symbolic LaTeX without values", () => {
    const latex = gasEquationSymbolic();
    expect(latex).toContain("P_{\\rm gas}");
    expect(latex).toContain("\\rho");
    expect(latex).toContain("\\mu");
    expect(latex).not.toMatch(/\d\.\d+/); // no numerical values
  });

  it("radEquationSymbolic returns symbolic LaTeX without values", () => {
    const latex = radEquationSymbolic();
    expect(latex).toContain("P_{\\rm rad}");
    expect(latex).toContain("T^4");
    expect(latex).not.toMatch(/\d\.\d+/);
  });

  it("degEquationSymbolic returns symbolic LaTeX without values", () => {
    const latex = degEquationSymbolic();
    expect(latex).toContain("P_{\\rm deg}");
    expect(latex).not.toMatch(/\d\.\d+/);
  });
});
```

Run tests, verify FAIL.

**Step 2: Implement symbolic equation formatters in logic.ts**

```typescript
export function gasEquationSymbolic(): string {
  return `P_{\\rm gas} = \\frac{\\rho \\, k_B \\, T}{\\mu \\, m_u}`;
}

export function radEquationSymbolic(): string {
  return `P_{\\rm rad} = \\frac{a \\, T^4}{3}`;
}

export function degEquationSymbolic(): string {
  return `P_{\\rm deg} = K \\left(\\frac{\\rho}{\\mu_e \\, m_u}\\right)^{5/3} \\quad \\text{(NR limit)}`;
}
```

Run tests, verify PASS.

**Step 3: Add toggle state and UI in main.ts**

Add a boolean `showSubstituted` state variable (default `false`). The equation display elements get a click handler that toggles between symbolic and substituted forms:

```typescript
let showSubstituted = false;

function renderEquations(model: StellarEosStateCgs): void {
  if (showSubstituted) {
    compareGasEq.innerHTML = gasEquationLatex({ rho: ..., T: ..., mu: ..., pGas: ... });
    // ... rad, deg
  } else {
    compareGasEq.innerHTML = gasEquationSymbolic();
    // ... rad, deg
  }
  renderMath(compareGasEq);
  // ...
}
```

Add click handlers:

```typescript
for (const eq of [compareGasEq, compareRadEq, compareDegEq]) {
  eq.style.cursor = "pointer";
  eq.title = "Click to toggle symbolic/numerical";
  eq.addEventListener("click", () => {
    showSubstituted = !showSubstituted;
    renderEquations(lastModel);
  });
}
```

**Step 4: Add visual indicator in style.css**

```css
.compare-column__equation {
  cursor: pointer;
  position: relative;
}

.compare-column__equation::after {
  content: "click to toggle";
  position: absolute;
  right: var(--cp-space-1);
  bottom: 2px;
  font-size: 0.65rem;
  color: var(--cp-muted);
  opacity: 0;
  transition: opacity 0.2s;
}

.compare-column__equation:hover::after {
  opacity: 1;
}
```

**Step 5:** Verify all tests pass and build clean. Commit:

```bash
git add apps/demos/src/demos/eos-lab/{logic.ts,logic.test.ts,main.ts,style.css}
git commit -m "feat(eos-lab): add symbolic/substituted equation toggle on Tab 2"
```

---

### Task 5: Stellar profile overlay on regime map

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/logic.ts`
- Modify: `apps/demos/src/demos/eos-lab/logic.test.ts`
- Modify: `apps/demos/src/demos/eos-lab/regimeMap.ts`
- Modify: `apps/demos/src/demos/eos-lab/main.ts`
- Modify: `apps/demos/src/demos/eos-lab/index.html`

**Problem:** The regime map shows where different pressure channels dominate, but students don't see how real stars trace paths through this space. Overlaying a solar model profile (T vs ρ from core to surface) would connect the EOS lab to stellar structure.

**Step 1: Write failing test**

Add to `logic.test.ts`:

```typescript
describe("solarProfileData", () => {
  it("returns an array of {logT, logRho} points from core to surface", () => {
    const profile = solarProfileData();
    expect(profile.length).toBeGreaterThan(5);
    // Core should be hot and dense
    expect(profile[0].logT).toBeGreaterThan(7);
    expect(profile[0].logRho).toBeGreaterThan(1);
    // Surface should be cool and sparse
    const last = profile[profile.length - 1];
    expect(last.logT).toBeLessThan(4);
    expect(last.logRho).toBeLessThan(-5);
  });
});
```

Run tests, verify FAIL.

**Step 2: Implement solarProfileData in logic.ts**

Use a simple Standard Solar Model profile (Bahcall et al. 2005) as a lookup table — ~15 points from core to photosphere:

```typescript
export function solarProfileData(): Array<{ logT: number; logRho: number; label?: string }> {
  // Standard Solar Model profile (Bahcall et al. 2005, approximate)
  // Each point: [log10(T/K), log10(rho/(g/cm^3)), optional label]
  const raw: [number, number, string?][] = [
    [7.196, 2.176, "Core"],           // r/R=0.0
    [7.15,  2.0],                     // r/R=0.05
    [7.05,  1.6],                     // r/R=0.10
    [6.9,   1.1],                     // r/R=0.15
    [6.75,  0.5],                     // r/R=0.25
    [6.55, -0.2],                     // r/R=0.40
    [6.35, -0.8, "Radiative zone"],   // r/R=0.55
    [6.15, -1.5],                     // r/R=0.65
    [5.9,  -2.5, "Base of CZ"],       // r/R=0.71
    [5.5,  -4.0],                     // r/R=0.85
    [5.0,  -5.5],                     // r/R=0.95
    [4.5,  -6.5],                     // r/R=0.99
    [3.76, -7.0, "Photosphere"],      // r/R=1.0
  ];
  return raw.map(([logT, logRho, label]) => ({ logT, logRho, label }));
}
```

Run tests, verify PASS.

**Step 3: Add overlay toggle checkbox to HTML**

In `index.html`, near the regime map section, add a checkbox:

```html
<label class="cp-form__label regime-map__overlay-toggle">
  <input type="checkbox" id="showSolarProfile"> Solar model profile
</label>
```

**Step 4: Add rendering in regimeMap.ts**

Add a new function `drawSolarProfile` that takes the canvas, config, and profile data:

```typescript
export function drawSolarProfile(
  ctx: CanvasRenderingContext2D,
  config: RegimeMapConfig,
  profile: Array<{ logT: number; logRho: number; label?: string }>,
): void {
  // Convert logT/logRho to canvas coordinates using existing logTToX/logRhoToY
  // Draw a thick dashed white line through the points
  // Draw labeled dots at key positions (Core, Photosphere, etc.)
}
```

**Step 5: Wire in main.ts**

In `renderRegimeMap`, after the existing render call, conditionally call `drawSolarProfile` if the checkbox is checked:

```typescript
const showProfile = showSolarProfileCheckbox.checked;
if (showProfile) {
  const profile = solarProfileData();
  drawSolarProfile(regimeMapCtx, regimeConfig, profile);
}
```

**Step 6: Add contract test**

```typescript
it("includes solar profile overlay toggle", () => {
  expect(html).toContain('id="showSolarProfile"');
  expect(mainTs).toContain("solarProfileData");
});
```

**Step 7: Add E2E test**

```typescript
test("solar profile overlay can be toggled", async ({ page }) => {
  const checkbox = page.locator("#showSolarProfile");
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
});
```

**Step 8:** Verify all tests pass and build clean. Commit:

```bash
git add apps/demos/src/demos/eos-lab/{logic.ts,logic.test.ts,regimeMap.ts,main.ts,index.html,design-contracts.test.ts}
git add apps/site/tests/eos-lab.spec.ts
git commit -m "feat(eos-lab): add solar model profile overlay on regime map"
```

---

### Task 6: White dwarf composition tooltip

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html`
- Modify: `apps/demos/src/demos/eos-lab/style.css`

**Problem:** The WD preset uses Y=0.98 (pedagogical simplification for μ_e ≈ 2). Students who know WDs are C/O could be confused.

**Step 1:** In `index.html`, find the white-dwarf-core preset button. Add a `title` attribute:

```html
<button class="cp-button preset" data-preset-id="white-dwarf-core"
  title="Uses Y=0.98 (He-like composition). Real WDs are C/O, but mu_e ≈ 2 in both cases.">
  White dwarf core
</button>
```

**Step 2:** Also add a note to the preset's `notes` field in `main.ts`:

In the `white-dwarf-core` preset object, update the `notes` string to include:
```
"Y=0.98 approximates C/O composition (both give mu_e ≈ 2). Gas pressure contribution uses mu ≈ 1.34 instead of true C/O mu ≈ 2, but P_deg >> P_gas here."
```

**Step 3:** Verify build clean. Commit:

```bash
git add apps/demos/src/demos/eos-lab/{index.html,main.ts}
git commit -m "docs(eos-lab): add white dwarf composition clarification tooltip and note"
```

---

### Task 7: First-use guided tour

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/main.ts`
- Modify: `apps/demos/src/demos/eos-lab/style.css`
- Modify: `apps/demos/src/demos/eos-lab/index.html`

**Problem:** The demo interface is rich and could overwhelm first-time users. A brief 3-step guided tour would lower the barrier to entry.

**Step 1:** Add a "Tour" button to the utility toolbar in `index.html`:

```html
<button class="cp-action" id="startTour" type="button" title="Guided tour">
  <span aria-hidden="true">?</span> Tour
</button>
```

**Step 2:** Implement a minimal tour system in `main.ts` (no external library):

The tour consists of 3 steps:
1. Highlight temperature slider — "Drag temperature to see how pressure changes"
2. Highlight regime map — "This map shows which pressure channel dominates"
3. Highlight Tab 2 tab — "Switch to Understand to see the mechanism animations"

Each step shows a tooltip popup near the highlighted element. Use `getBoundingClientRect()` for positioning. A "Next" button advances, "Skip" dismisses.

```typescript
const TOUR_STEPS = [
  { target: "#tempSlider", text: "Drag temperature to see how each pressure channel responds.", position: "below" },
  { target: "#regimeMapCanvas", text: "This map shows which pressure dominates at every (T, \\rho) combination.", position: "above" },
  { target: "#tab-understand", text: "Switch here to see physical mechanism animations for each channel.", position: "below" },
];
```

**Step 3:** Add tour styles in `style.css`:

```css
.tour-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
.tour-highlight { position: relative; z-index: 1001; box-shadow: 0 0 0 4px var(--cp-accent-amber); border-radius: var(--cp-r-2); }
.tour-tooltip { position: absolute; z-index: 1002; /* ... */ }
```

**Step 4:** Use `localStorage.getItem("eos-lab-toured")` to auto-show on first visit. Set the flag after tour completes or is skipped.

**Step 5:** Add E2E test:

```typescript
test("tour button opens guided tour", async ({ page }) => {
  await page.locator("#startTour").click();
  await expect(page.locator(".tour-tooltip")).toBeVisible();
});
```

**Step 6:** Verify all tests pass and build clean. Commit:

```bash
git add apps/demos/src/demos/eos-lab/{main.ts,style.css,index.html}
git add apps/site/tests/eos-lab.spec.ts
git commit -m "feat(eos-lab): add first-use guided tour with 3-step walkthrough"
```

---

### Task 8: Final verification gate

**Files:** All modified files

**Step 1:** Run full demo test suite:

```bash
corepack pnpm -C apps/demos test -- --run
```
Expected: All tests pass

**Step 2:** Run physics tests:

```bash
corepack pnpm -C packages/physics test -- --run
```
Expected: 139 tests pass

**Step 3:** Run build:

```bash
corepack pnpm build
```
Expected: Build clean, no warnings

**Step 4:** Run E2E tests:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "EOS Lab"
```
Expected: All eos-lab E2E tests pass

**Step 5:** Visual spot check — open the demo in a browser and verify:
- Regime map channel colors match the pressure cards
- Mechanism animations work (and freeze when prefers-reduced-motion is set)
- Solar profile overlay toggles on/off
- Equation toggle works (click to switch symbolic/substituted)
- γ_eff readout updates and shows "(unstable)" when appropriate
- Tour runs through 3 steps
- WD preset shows tooltip on hover

**Step 6:** Commit any final fixes, then push:

```bash
git push origin main
```
