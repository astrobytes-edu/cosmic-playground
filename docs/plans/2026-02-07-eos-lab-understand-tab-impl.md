# EOS Lab — Tab 2 "Understand" Redesign: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Tab 2 click-one-card deep-dive flow with a simultaneous three-column comparison view, shared controls, live-reaction system, enhanced animations, and Scaling Law Detective challenge.

**Architecture:** Rewrite Tab 2 HTML, add comparison CSS, enhance Canvas animations, rewire main.ts to drive all three channels simultaneously from shared controls. Challenge engine uses existing `ChallengeEngine` from `@cosmic/runtime`.

**Tech Stack:** HTML/CSS grid, Canvas 2D, KaTeX, uPlot (existing), `@cosmic/physics`, `@cosmic/runtime` ChallengeEngine.

**Design doc:** `docs/plans/2026-02-07-eos-lab-understand-tab-design.md`

---

### Task 1: Rewrite Tab 2 HTML — Shared Controls + Comparison Grid

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html` (lines 313–404)

**Step 1: Replace Tab 2 panel contents**

Replace lines 313–404 (the `<div id="panel-understand">` contents) with:

```html
        <!-- Tab 2: Understand (side-by-side comparison) -->
        <div class="cp-tab-panel" role="tabpanel" id="panel-understand"
             aria-labelledby="tab-understand" hidden>

          <!-- Shared controls bar -->
          <div class="compare-controls">
            <div class="compare-controls__sliders">
              <label class="cp-field control">
                <span class="cp-label">Temperature $T$ (K)</span>
                <input id="compareT" class="cp-range" type="range"
                       min="0" max="1000" value="500" step="1" />
                <span class="control__value"><span id="compareTVal"></span></span>
              </label>
              <label class="cp-field control">
                <span class="cp-label">Density $\rho$ (g cm$^{-3}$)</span>
                <input id="compareRho" class="cp-range" type="range"
                       min="0" max="1000" value="500" step="1" />
                <span class="control__value"><span id="compareRhoVal"></span></span>
              </label>
            </div>
            <div class="compare-controls__composition">
              <label class="cp-field control">
                <span class="cp-label">$X$ (hydrogen)</span>
                <input id="compareX" class="cp-range" type="range"
                       min="0" max="1000" value="340" step="1" />
                <span class="control__value"><span id="compareXVal"></span></span>
              </label>
              <label class="cp-field control">
                <span class="cp-label">$Y$ (helium)</span>
                <input id="compareY" class="cp-range" type="range"
                       min="0" max="1000" value="640" step="1" />
                <span class="control__value"><span id="compareYVal"></span></span>
              </label>
              <div class="compare-controls__mu">
                $\mu$ = <span id="compareMuVal">0.617</span>
              </div>
            </div>
            <div class="compare-controls__presets">
              <button class="preset cp-action compare-preset" data-preset-id="solar-core" type="button">Solar core</button>
              <button class="preset cp-action compare-preset" data-preset-id="white-dwarf-core" type="button">White dwarf</button>
              <button class="preset cp-action compare-preset" data-preset-id="massive-core" type="button">Massive star</button>
              <button class="preset cp-action compare-preset" data-preset-id="red-giant-envelope" type="button">Red giant</button>
              <button class="preset cp-action compare-preset" data-preset-id="solar-envelope" type="button">Solar envelope</button>
              <button class="preset cp-action compare-preset" data-preset-id="brown-dwarf-interior" type="button">Brown dwarf</button>
            </div>
          </div>

          <!-- Three-column comparison grid -->
          <div class="compare-grid">
            <!-- Gas column -->
            <article class="compare-column" id="colGas">
              <header class="compare-column__header">
                <h2>$P_{\rm gas}$</h2>
                <p class="compare-column__subtitle">Thermal particle collisions</p>
              </header>
              <canvas id="compareGasCanvas" class="compare-column__canvas"
                      role="img" aria-label="Gas particles bouncing in a box"></canvas>
              <p class="compare-column__badge">Dominates in: Sun core, main-sequence stars</p>
              <div id="compareGasEq" class="compare-column__equation"></div>
              <div id="compareGasFlash" class="compare-column__flash" aria-live="polite"></div>
            </article>

            <!-- Radiation column -->
            <article class="compare-column" id="colRadiation">
              <header class="compare-column__header">
                <h2>$P_{\rm rad}$</h2>
                <p class="compare-column__subtitle">Photon momentum flux</p>
              </header>
              <canvas id="compareRadCanvas" class="compare-column__canvas"
                      role="img" aria-label="Photons bouncing in a box"></canvas>
              <p class="compare-column__badge">Dominates in: O/B-star envelopes, supernovae</p>
              <div id="compareRadEq" class="compare-column__equation"></div>
              <div id="compareRadFlash" class="compare-column__flash" aria-live="polite"></div>
            </article>

            <!-- Degeneracy column -->
            <article class="compare-column" id="colDegeneracy">
              <header class="compare-column__header">
                <h2>$P_{\rm deg}$</h2>
                <p class="compare-column__subtitle">Pauli exclusion pressure</p>
              </header>
              <canvas id="compareDegCanvas" class="compare-column__canvas"
                      role="img" aria-label="Electron energy level filling"></canvas>
              <p class="compare-column__badge">Dominates in: White dwarfs, neutron star crusts</p>
              <div id="compareDegEq" class="compare-column__equation"></div>
              <div id="compareDegFlash" class="compare-column__flash" aria-live="polite"></div>
            </article>
          </div>

          <!-- Scaling Law Detective (optional challenge) -->
          <details class="cp-accordion scaling-detective">
            <summary>Scaling Law Detective</summary>
            <div class="scaling-detective__content">
              <p class="scaling-detective__intro">Can you figure out how each pressure scales? Use the sliders above to test your predictions.</p>
              <div id="scalingChallenge" class="scaling-detective__challenge"></div>
            </div>
          </details>
        </div>
```

**Step 2: Verify build**

Run: `corepack pnpm build`
Expected: Build succeeds (HTML is valid, JS will have broken DOM queries — that's expected, fixed in Task 4).

**Step 3: Commit**

```bash
git add apps/demos/src/demos/eos-lab/index.html
git commit -m "refactor(eos-lab): rewrite Tab 2 HTML for side-by-side comparison layout"
```

---

### Task 2: Add Comparison Grid CSS

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/style.css`

**Step 1: Replace deep-dive CSS with comparison styles**

Remove the old deep-dive and mechanism-grid CSS (lines 347–505 in style.css — from `.pressure-card--clickable` through `.mechanism-grid`). Replace with comparison grid styles.

Add these new rules after the `.regime-map__legend` section (after line 324):

```css
/* ================================================================
 * Tab 2: Comparison view
 * ================================================================ */

.compare-controls {
  display: grid;
  gap: var(--cp-space-3);
  padding: var(--cp-space-3);
  border-radius: var(--cp-r-3);
  border: 1px solid var(--cp-border);
  background: color-mix(in srgb, var(--cp-bg1) 90%, transparent);
}

.compare-controls__sliders {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--cp-space-3);
}

.compare-controls__composition {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--cp-space-3);
  align-items: end;
}

.compare-controls__mu {
  font-family: var(--cp-readout-value-font, var(--cp-font-mono));
  font-size: 0.95rem;
  color: var(--cp-readout-unit-color, var(--cp-muted));
  padding-bottom: var(--cp-space-1);
}

.compare-controls__mu span {
  color: var(--cp-accent-amber);
  font-variant-numeric: tabular-nums;
}

.compare-controls__presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-1);
}

.compare-preset {
  font-size: 0.8rem;
  padding: var(--cp-space-1) var(--cp-space-2);
}

.compare-preset.is-active {
  border-color: color-mix(in srgb, var(--cp-border) 30%, var(--eos-dominant, var(--cp-accent)));
  background: color-mix(in srgb, var(--eos-dominant, var(--cp-accent)) 10%, var(--cp-bg2));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--eos-dominant, var(--cp-accent)) 18%, transparent);
}

/* Three-column comparison grid */
.compare-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--cp-space-3);
}

.compare-column {
  display: grid;
  gap: var(--cp-space-2);
  padding: var(--cp-space-3);
  border-radius: var(--cp-r-3);
  border: 1px solid var(--cp-border);
  background: color-mix(in srgb, var(--cp-bg1) 92%, transparent);
  align-content: start;
}

#colGas { border-top: 3px solid var(--eos-gas); }
#colRadiation { border-top: 3px solid var(--eos-rad); }
#colDegeneracy { border-top: 3px solid var(--eos-deg); }

#colGas h2 { color: var(--eos-gas); }
#colRadiation h2 { color: var(--eos-rad); }
#colDegeneracy h2 { color: var(--eos-deg); }

.compare-column__header {
  display: grid;
  gap: var(--cp-space-1);
}

.compare-column__header h2 {
  margin: 0;
  font-size: 1.15rem;
}

.compare-column__subtitle {
  margin: 0;
  color: var(--cp-muted);
  font-size: 0.85rem;
}

.compare-column__canvas {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--cp-r-2);
  border: 1px solid color-mix(in srgb, var(--cp-border) 70%, transparent);
  background: color-mix(in srgb, var(--cp-bg0) 95%, transparent);
}

#colGas .compare-column__canvas {
  border-color: color-mix(in srgb, var(--eos-gas) 25%, var(--cp-border));
}

#colRadiation .compare-column__canvas {
  border-color: color-mix(in srgb, var(--eos-rad) 25%, var(--cp-border));
}

#colDegeneracy .compare-column__canvas {
  border-color: color-mix(in srgb, var(--eos-deg) 25%, var(--cp-border));
}

.compare-column__badge {
  margin: 0;
  font-size: 0.78rem;
  color: var(--cp-text2);
  font-style: italic;
  line-height: 1.35;
}

.compare-column__equation {
  font-size: 0.9rem;
  padding: var(--cp-space-2);
  background: color-mix(in srgb, var(--cp-bg0) 80%, transparent);
  border-radius: var(--cp-r-2);
  border: 1px solid var(--cp-border);
  overflow-x: auto;
  min-height: 2.8em;
}

#colGas .compare-column__equation {
  border-left: 3px solid var(--eos-gas);
}

#colRadiation .compare-column__equation {
  border-left: 3px solid var(--eos-rad);
}

#colDegeneracy .compare-column__equation {
  border-left: 3px solid var(--eos-deg);
}

/* Delta-P flash — brief feedback when slider changes */
.compare-column__flash {
  font-size: 0.8rem;
  font-family: var(--cp-readout-value-font, var(--cp-font-mono));
  font-variant-numeric: tabular-nums;
  min-height: 1.2em;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.compare-column__flash.is-visible {
  opacity: 1;
}

.compare-column__flash[data-direction="up"] {
  color: var(--cp-accent-amber);
}

.compare-column__flash[data-direction="down"] {
  color: var(--cp-accent-ice);
}

.compare-column__flash[data-direction="none"] {
  color: var(--cp-muted);
}

/* Scaling Law Detective accordion */
.scaling-detective {
  margin-top: var(--cp-space-2);
}

.scaling-detective__intro {
  margin: 0 0 var(--cp-space-3);
  font-size: 0.95rem;
  color: var(--cp-text2);
}

/* Responsive: 2-column + 1 at medium */
@media (max-width: 899px) {
  .compare-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .compare-grid .compare-column:last-child {
    grid-column: 1 / -1;
    max-width: 50%;
    justify-self: center;
  }

  .compare-controls__sliders,
  .compare-controls__composition {
    grid-template-columns: 1fr;
  }
}

/* Responsive: single column at narrow */
@media (max-width: 599px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }

  .compare-grid .compare-column:last-child {
    max-width: 100%;
  }

  .compare-column__canvas {
    max-height: 120px;
  }
}
```

**Step 2: Also keep the `.pressure-card--clickable` styles** (lines 347–362) — these are used by Tab 1's mechanism cards. Only remove the mechanism-grid hover styles (lines 364–391), the deep-dive styles (lines 393–473), and the mechanism-grid layout (lines 498–505).

Actually, review carefully: the `.pressure-card--clickable` styles (lines 347–362) belong to Tab 1's pressure cards (click to explore). The `#mechanismGas/Radiation/Degeneracy` hover styles (lines 364–391) are for the OLD Tab 2 cards — those can be removed. The `.deep-dive*` styles (lines 393–473) are for the OLD deep-dive panels — those can be removed. The `.mechanism-grid` styles (lines 498–505) are for the OLD card grid — can be removed.

**Step 3: Verify build**

Run: `corepack pnpm build`

**Step 4: Commit**

```bash
git add apps/demos/src/demos/eos-lab/style.css
git commit -m "style(eos-lab): add comparison grid CSS, remove old deep-dive styles"
```

---

### Task 3: Enhance Canvas Animations

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/mechanismViz.ts`

**Step 1: Enhance GasPressureAnimation**

In `GasPressureAnimation.rebuild()` (line 105):
- Change particle count range: `mapRange(this.logRho, -10, 10, 10, 150)` (was 5, 80)
- Change speed to physical sqrt scaling:
  ```typescript
  const T = Math.pow(10, this.logT);
  const Tref = 1e6;
  const speed = 0.5 + 4.5 * Math.sqrt(Math.min(T, 1e9) / Tref);
  ```
  Clamp to 0.2–7 range.

In `GasPressureAnimation.rescale()` (line 123): Apply same physical formula.

In `GasPressureAnimation.tick()` (line 135):
- Scale wall flash intensity with particle speed: `const a = Math.round((f.timer / 4) * Math.min(200, 80 + speed * 30));`
- Add 2-frame particle trails: before drawing particles, draw previous positions at 20% opacity.

**Step 2: Enhance RadiationPressureAnimation**

In `RadiationPressureAnimation.rebuild()` (line 254):
- Change count to T^3 scaling:
  ```typescript
  const T = Math.pow(10, this.logT);
  const Tref = 1e6;
  const count = Math.round(Math.min(150, Math.max(3, 3 + 147 * Math.pow(T / Tref, 3) / Math.pow(1e3, 3))));
  ```
  This is still mapped through a reasonable range (3–150).

In `RadiationPressureAnimation.tick()` (line 272):
- Scale glow halo radius with T: `const haloR = r * (2 + mapRange(this.logT, 3, 9, 0, 3));`

**Step 3: Enhance DegeneracyPressureAnimation**

Major visual upgrade in `DegeneracyPressureAnimation.tick()` (line 350):

- **Non-uniform spacing**: `const spacing = baseSpacing * (1 - 0.3 * (i / maxLevels));` (levels closer at bottom)
- **Fermi energy line**: Draw a dashed amber line at the top filled level, labeled $E_F$
- **Larger spin arrows**: Change font from 8px to 12px bold, change violet shades
- **Level vibration**: Top 3 filled levels oscillate ±1px using `Math.sin(Date.now() / 200 + i) * (i >= filled - 3 ? 1 : 0)`
- **Fill animation**: Track `prevFilled` and briefly flash new electrons

**Step 4: Verify build**

Run: `corepack pnpm build`

**Step 5: Commit**

```bash
git add apps/demos/src/demos/eos-lab/mechanismViz.ts
git commit -m "feat(eos-lab): enhance mechanism animations — physical scaling, Fermi level, trails"
```

---

### Task 4: Rewire main.ts — Remove Old Deep-Dive, Add Comparison Wiring

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/main.ts`

This is the largest task. It involves:

**Step 1: Remove old deep-dive DOM queries** (lines 224–257)

Remove all `mechanismGrid`, `mechanismGas/Radiation/Degeneracy`, `deepDiveGas/Radiation/Degeneracy`, `gasAnimCanvas/radAnimCanvas/degAnimCanvas`, `gasEquationEl/radEquationEl/degEquationEl`, `gasDeepT/gasDeepTVal/gasDeepRho/gasDeepRhoVal`, `radDeepT/radDeepTVal`, `degDeepRho/degDeepRhoVal`, `gasDeepChartEl/radDeepChartEl/degDeepChartEl` queries.

**Step 2: Add new comparison DOM queries**

```typescript
/* Compare view (Tab 2) */
const compareT = q<HTMLInputElement>("#compareT");
const compareTVal = q("#compareTVal");
const compareRho = q<HTMLInputElement>("#compareRho");
const compareRhoVal = q("#compareRhoVal");
const compareX = q<HTMLInputElement>("#compareX");
const compareXVal = q("#compareXVal");
const compareY = q<HTMLInputElement>("#compareY");
const compareYVal = q("#compareYVal");
const compareMuVal = q("#compareMuVal");

const compareGasCanvas = q<HTMLCanvasElement>("#compareGasCanvas");
const compareRadCanvas = q<HTMLCanvasElement>("#compareRadCanvas");
const compareDegCanvas = q<HTMLCanvasElement>("#compareDegCanvas");

const compareGasEq = q("#compareGasEq");
const compareRadEq = q("#compareRadEq");
const compareDegEq = q("#compareDegEq");

const compareGasFlash = q("#compareGasFlash");
const compareRadFlash = q("#compareRadFlash");
const compareDegFlash = q("#compareDegFlash");

const comparePresetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("button.compare-preset[data-preset-id]")
);
```

**Step 3: Replace deep-dive state + functions** (lines 691–962)

Remove the entire deep-dive panel system section. Replace with comparison system:

```typescript
/* ================================================================
 * Comparison view (Tab 2)
 * ================================================================ */

const compareAnimations: {
  gas: GasPressureAnimation;
  radiation: RadiationPressureAnimation;
  degeneracy: DegeneracyPressureAnimation;
} = {
  gas: new GasPressureAnimation(),
  radiation: new RadiationPressureAnimation(),
  degeneracy: new DegeneracyPressureAnimation(),
};

let compareAnimsStarted = false;
let prevCompareModel: StellarEosStateCgs | null = null;

function startCompareAnimations(): void {
  if (compareAnimsStarted) return;
  compareAnimations.gas.start(compareGasCanvas);
  compareAnimations.radiation.start(compareRadCanvas);
  compareAnimations.degeneracy.start(compareDegCanvas);
  compareAnimsStarted = true;
}

function stopCompareAnimations(): void {
  if (!compareAnimsStarted) return;
  compareAnimations.gas.stop();
  compareAnimations.radiation.stop();
  compareAnimations.degeneracy.stop();
  compareAnimsStarted = false;
}

function syncCompareSliders(): void {
  compareT.value = tempSlider.value;
  compareRho.value = rhoSlider.value;
  compareX.value = xSlider.value;
  compareY.value = ySlider.value;
}

function renderCompareView(model: StellarEosStateCgs): void {
  // Update slider readouts
  compareTVal.textContent = formatScientific(model.input.temperatureK, 4) + " K";
  compareRhoVal.textContent = formatScientific(model.input.densityGPerCm3, 4) + " g cm^-3";
  compareXVal.textContent = formatFraction(model.input.composition.hydrogenMassFractionX, 3);
  compareYVal.textContent = formatFraction(model.input.composition.heliumMassFractionY, 3);
  compareMuVal.textContent = formatFraction(model.meanMolecularWeightMu, 3);

  // Update equations (KaTeX)
  compareGasEq.textContent = `$$${gasEquationLatex({
    rho: model.input.densityGPerCm3,
    T: model.input.temperatureK,
    mu: model.meanMolecularWeightMu,
    pGas: model.gasPressureDynePerCm2,
  })}$$`;
  renderMath(compareGasEq);

  compareRadEq.textContent = `$$${radEquationLatex({
    T: model.input.temperatureK,
    pRad: model.radiationPressureDynePerCm2,
  })}$$`;
  renderMath(compareRadEq);

  compareDegEq.textContent = `$$${degEquationLatex({
    rho: model.input.densityGPerCm3,
    muE: model.meanMolecularWeightMuE,
    xF: model.fermiRelativityX,
    pDeg: model.electronDegeneracyPressureDynePerCm2,
  })}$$`;
  renderMath(compareDegEq);

  // Update animations
  const logT = Math.log10(model.input.temperatureK);
  const logRho = Math.log10(model.input.densityGPerCm3);
  compareAnimations.gas.updateParams({ logT, logRho });
  compareAnimations.radiation.updateParams({ logT });
  compareAnimations.degeneracy.updateParams({ logRho });

  // Delta-P flash
  if (prevCompareModel) {
    showDeltaFlash(compareGasFlash, prevCompareModel.gasPressureDynePerCm2, model.gasPressureDynePerCm2);
    showDeltaFlash(compareRadFlash, prevCompareModel.radiationPressureDynePerCm2, model.radiationPressureDynePerCm2);
    showDeltaFlash(compareDegFlash, prevCompareModel.electronDegeneracyPressureDynePerCm2, model.electronDegeneracyPressureDynePerCm2);
  }
  prevCompareModel = model;

  // Preset highlight
  for (const btn of comparePresetButtons) {
    const isActive = btn.dataset.presetId === state.selectedPresetId;
    btn.classList.toggle("is-active", isActive);
  }
}

let flashTimeout = 0;
function showDeltaFlash(el: HTMLElement, oldP: number, newP: number): void {
  const ratio = newP / oldP;
  if (!Number.isFinite(ratio) || Math.abs(ratio - 1) < 0.001) {
    el.dataset.direction = "none";
    el.textContent = "\u2014";
  } else if (ratio > 1) {
    el.dataset.direction = "up";
    el.textContent = `\u2191 \u00D7${ratio.toFixed(ratio > 10 ? 0 : 1)}`;
  } else {
    el.dataset.direction = "down";
    el.textContent = `\u2193 \u00D7${(1 / ratio).toFixed(ratio < 0.1 ? 0 : 1)}`;
  }
  el.classList.add("is-visible");
  clearTimeout(flashTimeout);
  flashTimeout = window.setTimeout(() => {
    compareGasFlash.classList.remove("is-visible");
    compareRadFlash.classList.remove("is-visible");
    compareDegFlash.classList.remove("is-visible");
  }, 2000);
}
```

**Step 4: Wire compare slider events**

```typescript
// Compare slider → state sync (Tab 2 drives Tab 1)
compareT.addEventListener("input", () => {
  tempSlider.value = compareT.value;
  state.temperatureK = logSliderToValue({
    sliderValue: clamp(Number(compareT.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: TEMPERATURE_MIN_K, valueMax: TEMPERATURE_MAX_K,
  });
  state.selectedPresetId = state.selectedPresetId; // clear preset on manual change
  render();
});

compareRho.addEventListener("input", () => {
  rhoSlider.value = compareRho.value;
  state.densityGPerCm3 = logSliderToValue({
    sliderValue: clamp(Number(compareRho.value), 0, 1000),
    sliderMin: 0, sliderMax: 1000,
    valueMin: DENSITY_MIN_G_PER_CM3, valueMax: DENSITY_MAX_G_PER_CM3,
  });
  render();
});

compareX.addEventListener("input", () => {
  xSlider.value = compareX.value;
  // Reuse existing composition constraint logic
  xSlider.dispatchEvent(new Event("input"));
});

compareY.addEventListener("input", () => {
  ySlider.value = compareY.value;
  ySlider.dispatchEvent(new Event("input"));
});

// Compare preset clicks
for (const btn of comparePresetButtons) {
  btn.addEventListener("click", () => {
    const presetId = btn.dataset.presetId as Preset["id"];
    applyPreset(presetId);
    render();
  });
}
```

**Step 5: Hook into tab switching**

Add a tab switch observer so animations start/stop with Tab 2 visibility:

```typescript
// Start/stop compare animations on tab switch
const tab2Panel = q("#panel-understand");
const observer = new MutationObserver(() => {
  if (!tab2Panel.hidden) {
    syncCompareSliders();
    startCompareAnimations();
  } else {
    stopCompareAnimations();
  }
});
observer.observe(tab2Panel, { attributes: true, attributeFilter: ["hidden"] });
```

**Step 6: Add `renderCompareView(model)` call inside the main `render()` function**

After the existing readout rendering (around line 681), add:

```typescript
  // Compare view (Tab 2) — always sync model, only animate when visible
  if (!tab2Panel.hidden) {
    renderCompareView(model);
  }
  syncCompareSliders();
```

**Step 7: Verify build**

Run: `corepack pnpm build`

**Step 8: Commit**

```bash
git add apps/demos/src/demos/eos-lab/main.ts
git commit -m "feat(eos-lab): wire comparison view — shared controls, animations, preset sync, delta-P flash"
```

---

### Task 5: Add Scaling Law Detective Challenge

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/main.ts`
- Modify: `apps/demos/src/demos/eos-lab/logic.ts`

**Step 1: Add challenge validation helpers to logic.ts**

```typescript
/** Check if a scaling-law answer is correct within tolerance. */
export function checkScalingAnswer(
  userFactor: number,
  correctFactor: number,
  tolerance = 0.15
): { correct: boolean; close: boolean; message: string } {
  const ratio = userFactor / correctFactor;
  if (Math.abs(ratio - 1) < tolerance) {
    return { correct: true, close: true, message: `Correct! The pressure changed by a factor of ${correctFactor.toFixed(1)}.` };
  }
  if (Math.abs(ratio - 1) < tolerance * 2.5) {
    return { correct: false, close: true, message: `Close! Try again. Watch the equation values carefully.` };
  }
  return { correct: false, close: false, message: `Not quite. Hint: look at the exponent in the equation.` };
}
```

**Step 2: Add challenge definitions to main.ts**

Import `ChallengeEngine` and `Challenge` type from `@cosmic/runtime`. Define 3 challenges:

1. Gas: "Double T → P doubles" (factor ×2)
2. Radiation: "Double T → P changes by ×16" (factor ×16, since T⁴)
3. Degeneracy: "Double ρ → P changes by ×3.2" (factor ×2^(5/3) ≈ 3.17)

Each uses `type: "custom"` with a check function that:
- Reads `getState()` to get current pressures
- Compares to `initialState` pressures
- Uses `checkScalingAnswer()` from logic.ts

**Step 3: Instantiate ChallengeEngine**

```typescript
const scalingChallengeContainer = q("#scalingChallenge");
const scalingEngine = new ChallengeEngine(scalingChallenges, {
  container: scalingChallengeContainer,
  showUI: true,
  getState: () => ({ ... current state ... }),
  setState: (next) => { ... apply state, render() ... },
});
```

Wire the accordion open/close to start/stop the engine.

**Step 4: Verify build**

Run: `corepack pnpm build`

**Step 5: Commit**

```bash
git add apps/demos/src/demos/eos-lab/main.ts apps/demos/src/demos/eos-lab/logic.ts
git commit -m "feat(eos-lab): add Scaling Law Detective challenge engine"
```

---

### Task 6: Update E2E Tests

**Files:**
- Modify: `apps/site/tests/eos-lab.spec.ts`

**Step 1: Remove old deep-dive tests**

Remove these 6 tests that reference the old Tab 2 flow:
- "clicking gas mechanism card opens gas deep-dive panel"
- "gas deep-dive back button returns to mechanism overview"
- "radiation deep-dive has only temperature slider"
- "degeneracy deep-dive has density slider"
- "deep-dive slider updates equation content"
- "switching between deep-dives closes previous"

Also remove:
- "pressure cards are clickable on Understand tab" (mechanism cards are gone)

**Step 2: Add new comparison view tests**

```typescript
test("Tab 2 comparison grid shows three channel columns", async ({ page }) => {
  await page.locator("#tab-understand").click();
  await expect(page.locator(".compare-grid")).toBeVisible();
  await expect(page.locator(".compare-column")).toHaveCount(3);
});

test("Tab 2 shared T slider updates all three equations", async ({ page }) => {
  await page.locator("#tab-understand").click();
  const gasBefore = await page.locator("#compareGasEq").textContent();
  await page.locator("#compareT").fill("800");
  await page.locator("#compareT").dispatchEvent("input");
  const gasAfter = await page.locator("#compareGasEq").textContent();
  expect(gasAfter).not.toBe(gasBefore);
  // Radiation and degeneracy equations also rendered
  await expect(page.locator("#compareRadEq .katex")).toBeVisible();
  await expect(page.locator("#compareDegEq .katex")).toBeVisible();
});

test("Tab 2 preset chips set slider values", async ({ page }) => {
  await page.locator("#tab-understand").click();
  await page.locator('button.compare-preset[data-preset-id="white-dwarf-core"]').click();
  // Check that equations updated (white dwarf should show degeneracy dominant)
  await expect(page.locator("#compareDegEq")).toContainText("10");
});

test("Tab 2 canvas animations are visible", async ({ page }) => {
  await page.locator("#tab-understand").click();
  await expect(page.locator("#compareGasCanvas")).toBeVisible();
  await expect(page.locator("#compareRadCanvas")).toBeVisible();
  await expect(page.locator("#compareDegCanvas")).toBeVisible();
});

test("Tab 2 composition sliders show mu readout", async ({ page }) => {
  await page.locator("#tab-understand").click();
  await expect(page.locator("#compareMuVal")).toBeVisible();
  const mu = await page.locator("#compareMuVal").textContent();
  expect(Number(mu)).toBeGreaterThan(0);
});

test("Scaling Law Detective accordion can be opened", async ({ page }) => {
  await page.locator("#tab-understand").click();
  const accordion = page.locator(".scaling-detective");
  await accordion.locator("summary").evaluate((el) => (el as HTMLElement).click());
  await expect(accordion).toHaveAttribute("open", "");
  await expect(page.locator("#scalingChallenge")).toBeVisible();
});
```

**Step 3: Run E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "EOS Lab"`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add apps/site/tests/eos-lab.spec.ts
git commit -m "test(eos-lab): update E2E tests for comparison view, remove deep-dive tests"
```

---

### Task 7: Final Verification Gate

**Step 1: Run all demo unit tests**

Run: `corepack pnpm -C apps/demos test -- --run`
Expected: All tests pass (no eos-lab contract/logic tests to break since we didn't change those).

**Step 2: Run full build**

Run: `corepack pnpm build`
Expected: Clean build, no errors.

**Step 3: Run E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
Expected: All tests pass.

**Step 4: Visual check**

Open `http://localhost:4321/cosmic-playground/play/eos-lab/` and:
- [ ] Tab 2 shows three-column layout with all animations running
- [ ] Shared T slider → gas speeds up, radiation multiplies, degeneracy frozen
- [ ] Shared ρ slider → gas multiplies, radiation frozen, degeneracy fills up
- [ ] Preset chips work and highlight
- [ ] ΔP flash shows on slider change, fades after 2s
- [ ] KaTeX equations render with colored variables
- [ ] Responsive layout works at narrow widths
- [ ] Scaling Law Detective accordion opens

**Step 5: Commit any final fixes, then report complete**
