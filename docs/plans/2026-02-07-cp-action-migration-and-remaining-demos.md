# cp-action Migration + Remaining Demo Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all `cp-action` references from 10 demos (replacing with `cp-chip`, `cp-button`, `cp-utility-btn`), then fully migrate 3 remaining demos (conservation-laws, binary-orbits, planetary-conjunctions) through the 4-layer testing protocol.

**Architecture:** Each demo's `cp-action` buttons fall into 3 categories: (1) preset/selector buttons → `cp-chip` in `cp-chip-group`, (2) toolbar actions (Station mode, Help, Copy) → `cp-utility-btn` in `cp-utility-toolbar` with SVG icons, (3) playback/action buttons → `cp-button cp-button--ghost`. The utility toolbar pattern is established in eos-lab and retrograde-motion.

**Tech Stack:** HTML/CSS component classes from `packages/theme/styles/components/`, Vitest for contract tests, Playwright for E2E.

---

## Part 1: cp-action Elimination (10 demos)

### Batch A: Demos with preset chips + toolbar actions

---

### Task 1: blackbody-radiation — Replace presets with cp-chip

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/index.html`
- Modify: `apps/demos/src/demos/blackbody-radiation/style.css`
- Modify: `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts`

**Step 1: Read current HTML to confirm cp-action locations**

Run: Read `apps/demos/src/demos/blackbody-radiation/index.html`

Confirm these patterns exist:
- Lines 55-69: 12 preset buttons with `class="cp-action cp-action--ghost preset"`
- Lines 95-98: Station mode, Help, Copy results with `class="cp-action"`
- Line 101: `<div class="cp-actions">`
- Lines 36-38: Segmented scale buttons (Log/Linear) with `class="segmented__button"`

**Step 2: Replace 12 preset buttons with cp-chip**

In `index.html`, replace:
```html
<button class="cp-action cp-action--ghost preset" data-temp-k="34000" type="button">O star</button>
```
with:
```html
<button class="cp-chip preset" data-temp-k="34000" type="button">O star</button>
```

Do this for ALL 12 preset buttons (lines 55-69).

Also replace the preset containers:
```html
<div class="presets__row presets__row--3col" role="group" aria-label="Star presets">
```
with:
```html
<div class="cp-chip-group--grid presets__row" role="group" aria-label="Star presets">
```

Keep the `presets__row` class for the 3-col grid override. Do this for BOTH preset groups (Stars + Extreme & Cold).

**Step 3: Replace segmented scale buttons with cp-chip**

Replace:
```html
<div class="segmented" role="group" aria-label="Intensity scale">
  <button id="scaleLog" class="segmented__button" type="button">Log</button>
  <button id="scaleLinear" class="segmented__button" type="button">Linear</button>
</div>
```
with:
```html
<div class="cp-chip-group" role="group" aria-label="Intensity scale">
  <button id="scaleLog" class="cp-chip" type="button">Log</button>
  <button id="scaleLinear" class="cp-chip" type="button">Linear</button>
</div>
```

**Step 4: Replace toolbar actions with cp-utility-toolbar**

Replace the Station mode / Help / Copy results section:
```html
<button id="stationMode" class="cp-action" type="button">Station mode</button>
<button id="help" class="cp-action cp-action--ghost" type="button">Help / shortcuts</button>
...
<button id="copyResults" class="cp-action" type="button">Copy results</button>
```

with the utility toolbar pattern from eos-lab:
```html
<div class="cp-utility-toolbar" role="toolbar" aria-label="Demo actions">
  <button id="stationMode" class="cp-utility-btn" type="button" aria-label="Station mode" title="Station mode">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="2" width="12" height="16" rx="1.5"></rect>
      <line x1="7" y1="7" x2="13" y2="7"></line>
      <line x1="7" y1="10" x2="13" y2="10"></line>
      <line x1="7" y1="13" x2="10" y2="13"></line>
    </svg>
  </button>
  <button id="help" class="cp-utility-btn" type="button" aria-label="Help and shortcuts" title="Help / keys">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="10" cy="10" r="8"></circle>
      <path d="M7.5 7.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"></path>
      <circle cx="10" cy="15" r="0.75" fill="currentColor" stroke="none"></circle>
    </svg>
  </button>
  <button id="copyResults" class="cp-utility-btn" type="button" aria-label="Copy results" title="Copy results">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="10" height="12" rx="1.5"></rect>
      <path d="M14 6V3.5A1.5 1.5 0 0 0 12.5 2H5.5A1.5 1.5 0 0 0 4 3.5V14"></path>
    </svg>
  </button>
  <div class="cp-popover-anchor">
    <button class="cp-utility-btn cp-popover-trigger" aria-label="Navigation links" aria-expanded="false" aria-controls="navPopover" title="More links" type="button">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="4" cy="10" r="1.5"></circle>
        <circle cx="10" cy="10" r="1.5"></circle>
        <circle cx="16" cy="10" r="1.5"></circle>
      </svg>
    </button>
    <div class="cp-popover" id="navPopover" hidden>
      <nav class="cp-popover__body">
        <a class="cp-popover-link" href="../../exhibits/blackbody-radiation/">Open exhibit</a>
        <a class="cp-popover-link" href="../../stations/blackbody-radiation/">Station card</a>
        <a class="cp-popover-link" href="../../instructor/blackbody-radiation/">Instructor notes</a>
      </nav>
    </div>
  </div>
</div>
```

Remove the old `<div class="cp-actions">` wrapper and any standalone link buttons at the bottom.

**Step 5: Update style.css**

Replace `.preset.cp-action` with `.preset` (the cp-chip base provides the padding/font):
```css
/* DELETE this rule: */
.preset.cp-action {
  padding: var(--cp-space-1) var(--cp-space-2);
  font-size: 0.8rem;
}
```

The `.cp-chip` base in `chip.css` already provides these defaults. If custom sizing is still needed, use `.preset` alone as the selector.

Also remove any `.segmented__button` custom styles if they exist — the `cp-chip` base replaces them.

**Step 6: Update main.ts query selectors**

Search `main.ts` for:
- `segmented__button` → update to `cp-chip` if queried by class
- `cp-action` → remove from any querySelector strings
- `.is-active` toggle logic should remain unchanged (cp-chip uses `.is-active`)

**Step 7: Add component contract tests**

Add to `design-contracts.test.ts` in a new `describe("Component contracts")` block:
```typescript
describe("Component contracts", () => {
  it("uses cp-chip for preset buttons (not cp-action)", () => {
    const presetChips = html.match(/class="cp-chip preset"/g) || [];
    expect(presetChips.length).toBeGreaterThanOrEqual(12);
    expect(html).not.toContain("cp-action");
  });

  it("uses cp-chip for scale selector (not segmented__button)", () => {
    expect(html).toContain('class="cp-chip"');
    expect(html).not.toContain("segmented__button");
  });

  it("uses cp-chip-group containers for presets", () => {
    expect(html).toContain("cp-chip-group--grid");
    expect(html).toContain("cp-chip-group");
  });

  it("uses cp-utility-toolbar for actions (not cp-actions)", () => {
    expect(html).toContain("cp-utility-toolbar");
    expect(html).not.toContain('"cp-actions"');
  });

  it("has zero cp-action references in HTML and CSS", () => {
    expect(html).not.toContain("cp-action");
    expect(css).not.toContain("cp-action");
  });
});
```

**Step 8: Run tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/design-contracts.test.ts`
Expected: All tests pass, including new component contracts.

**Step 9: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/
git commit -m "feat(blackbody-radiation): migrate to cp-chip component system"
```

---

### Task 2: conservation-laws — Replace presets + playback with components

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/index.html`
- Modify: `apps/demos/src/demos/conservation-laws/style.css`
- Create: `apps/demos/src/demos/conservation-laws/design-contracts.test.ts` (stub with component contracts only — full contracts come in Part 2)

**Step 1: Read current HTML**

The demo has:
- Lines 51-57: 4 preset buttons (`class="cp-action cp-action--ghost preset"`) with `data-preset` attrs
- Lines 62-64: Play/Pause/Reset buttons (`class="cp-action cp-action--ghost"`)
- Lines 66-69: Station mode, Help, Copy results (`class="cp-action"`)
- Container: `<div class="presets__row">`

**Step 2: Replace 4 preset buttons with cp-chip**

```html
<div class="cp-chip-group--grid presets__row" role="group" aria-label="Orbit presets">
  <button class="cp-chip preset" data-preset="circular" type="button">Circular</button>
  <button class="cp-chip preset" data-preset="elliptical" type="button">Elliptical</button>
  <button class="cp-chip preset" data-preset="escape" type="button">Escape</button>
  <button class="cp-chip preset" data-preset="hyperbolic" type="button">Hyperbolic</button>
</div>
```

**Step 3: Replace Play/Pause/Reset with cp-button--ghost**

```html
<div class="cp-button-row" role="group" aria-label="Animation controls">
  <button id="play" class="cp-button cp-button--ghost" type="button">Play</button>
  <button id="pause" class="cp-button cp-button--ghost" type="button" disabled>Pause</button>
  <button id="reset" class="cp-button cp-button--ghost" type="button">Reset</button>
</div>
```

**Step 4: Replace toolbar actions with cp-utility-toolbar**

Same pattern as blackbody-radiation (Task 1, Step 4), using conservation-laws exhibit/station/instructor links.

**Step 5: Update style.css**

Delete `.preset.cp-action` rule (line 29-32). The `cp-chip` base handles sizing.

**Step 6: Update main.ts query selectors if needed**

Check for `cp-action` in querySelector strings and update.

**Step 7: Add component contract tests**

Create a minimal `design-contracts.test.ts` with the component contracts. The full design contract suite will be added in Part 2 Task 10.

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(__dirname);
const html = readFileSync(resolve(dir, "index.html"), "utf-8");
const css = readFileSync(resolve(dir, "style.css"), "utf-8");

describe("conservation-laws — Component contracts", () => {
  it("uses cp-chip for preset buttons", () => {
    const chips = html.match(/class="cp-chip preset"/g) || [];
    expect(chips.length).toBeGreaterThanOrEqual(4);
  });

  it("uses cp-chip-group container for presets", () => {
    expect(html).toContain("cp-chip-group");
  });

  it("uses cp-button--ghost for playback controls", () => {
    expect(html).toContain("cp-button--ghost");
  });

  it("uses cp-utility-toolbar for actions", () => {
    expect(html).toContain("cp-utility-toolbar");
  });

  it("has zero cp-action references", () => {
    expect(html).not.toContain("cp-action");
    expect(css).not.toContain("cp-action");
  });
});
```

**Step 8: Run tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/conservation-laws/design-contracts.test.ts`

**Step 9: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/
git commit -m "feat(conservation-laws): migrate to cp-chip component system"
```

---

### Task 3: seasons — Replace anchor chips + toolbar

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/design-contracts.test.ts`

**Step 1: Read current HTML**

The demo has:
- Lines 39-42: 4 anchor date buttons (`class="cp-action cp-action--ghost"`) in `.anchor-row`
- Line 74: Animate Year button (`class="cp-action cp-action--ghost"`)
- Lines 80-84: Station mode, Challenge mode, Help, Copy results (`class="cp-action"`)

**Step 2: Replace 4 anchor date buttons with cp-chip**

```html
<div class="cp-chip-group anchor-row" role="group" aria-label="Anchor dates">
  <button id="anchorMarEqx" class="cp-chip" type="button">Mar equinox</button>
  <button id="anchorJunSol" class="cp-chip" type="button">Jun solstice</button>
  <button id="anchorSepEqx" class="cp-chip" type="button">Sep equinox</button>
  <button id="anchorDecSol" class="cp-chip" type="button">Dec solstice</button>
</div>
```

**Step 3: Replace Animate Year with cp-button--ghost**

```html
<button id="animateYear" class="cp-button cp-button--ghost" type="button">
  Animate year
</button>
```

**Step 4: Replace toolbar actions with cp-utility-toolbar**

Same utility toolbar pattern with Station mode, Challenge mode, Help, Copy results icons. Seasons has Challenge mode, so include the star icon:
```html
<button id="challengeMode" class="cp-utility-btn" type="button" aria-label="Challenges" title="Challenges">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 2l2.2 4.5 5 .7-3.6 3.5.8 5L10 13.4 5.6 15.7l.8-5L2.8 7.2l5-.7z"/>
  </svg>
</button>
```

**Step 5: Add component contract tests to existing design-contracts.test.ts**

Add a new `describe("Component contracts")` block:
```typescript
describe("Component contracts", () => {
  it("uses cp-chip for anchor date buttons", () => {
    const chips = html.match(/class="cp-chip"/g) || [];
    expect(chips.length).toBeGreaterThanOrEqual(4);
  });

  it("uses cp-chip-group for anchor row", () => {
    expect(html).toContain("cp-chip-group");
  });

  it("uses cp-utility-toolbar for actions", () => {
    expect(html).toContain("cp-utility-toolbar");
  });

  it("has zero cp-action references", () => {
    expect(html).not.toContain("cp-action");
  });
});
```

**Step 6: Run tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/seasons/design-contracts.test.ts`

**Step 7: Commit**

```bash
git add apps/demos/src/demos/seasons/
git commit -m "feat(seasons): migrate to cp-chip component system"
```

---

### Batch A Gate Check

Run: `corepack pnpm -C apps/demos test -- --run`
Run: `corepack pnpm build`
Report results before proceeding to Batch B.

---

### Batch B: Demos with toolbar actions only (no presets to chip-ify)

---

### Task 4: parallax-distance — Replace toolbar actions

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Modify: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`

This demo has ONLY toolbar buttons (Station mode, Help, Copy results) — no preset chips.

**Step 1: Replace cp-action toolbar with cp-utility-toolbar**

Replace:
```html
<button id="stationMode" class="cp-action" type="button">Station mode</button>
<button id="help" class="cp-action cp-action--ghost" type="button">Help / shortcuts</button>
...
<button id="copyResults" class="cp-action" type="button">Copy results</button>
```
with the utility toolbar pattern (same SVG icons as Task 1).

Remove old `<div class="cp-actions">` wrapper.

**Step 2: Add component contract tests**

```typescript
describe("Component contracts", () => {
  it("uses cp-utility-toolbar for actions", () => {
    expect(html).toContain("cp-utility-toolbar");
  });

  it("has zero cp-action references", () => {
    expect(html).not.toContain("cp-action");
  });
});
```

**Step 3: Run tests and commit**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts`

```bash
git add apps/demos/src/demos/parallax-distance/
git commit -m "feat(parallax-distance): migrate to cp-utility-toolbar, remove cp-action"
```

---

### Task 5: telescope-resolution — Replace toolbar actions

**Files:**
- Modify: `apps/demos/src/demos/telescope-resolution/index.html`
- Modify: `apps/demos/src/demos/telescope-resolution/design-contracts.test.ts`

Same pattern as parallax-distance. Has Station mode, Challenge mode (disabled), Help, Copy results.

**Step 1: Replace cp-action toolbar with cp-utility-toolbar**

Include Challenge mode button (disabled state preserved):
```html
<button id="challengeMode" class="cp-utility-btn" type="button" aria-label="Challenges" title="Challenges" disabled>
  <svg ...star icon...></svg>
</button>
```

**Step 2: Also migrate band picker if it uses legacy classes**

Check if `.band` buttons need migration to `.cp-chip`. From the consolidation plan, telescope-resolution bands should become `cp-chip` in a `cp-chip-group`.

**Step 3: Add component contract tests**

Same pattern — test for `cp-utility-toolbar`, zero `cp-action`, and chip usage for bands if applicable.

**Step 4: Run tests and commit**

```bash
git add apps/demos/src/demos/telescope-resolution/
git commit -m "feat(telescope-resolution): migrate to cp-chip + cp-utility-toolbar"
```

---

### Task 6: em-spectrum — Replace toolbar actions

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/design-contracts.test.ts`

Has only `copyResults` as cp-action. Also check if band picker needs migration.

**Step 1: Replace cp-action with cp-utility-toolbar**

em-spectrum has minimal toolbar — just Copy results. But follow the full utility toolbar pattern for consistency.

**Step 2: Migrate band picker to cp-chip if applicable**

From the consolidation plan, em-spectrum bands should become `cp-chip` in `cp-chip-group--grid`.

**Step 3: Add component contract tests and commit**

```bash
git add apps/demos/src/demos/em-spectrum/
git commit -m "feat(em-spectrum): migrate to cp-chip + cp-utility-toolbar"
```

---

### Batch B Gate Check

Run: `corepack pnpm -C apps/demos test -- --run`
Run: `corepack pnpm build`

---

### Batch C: Complex demos with mixed button types

---

### Task 7: eclipse-geometry — Chips + action buttons + toolbar

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html`
- Modify: `apps/demos/src/demos/eclipse-geometry/design-contracts.test.ts`

**Step 1: Replace New Moon / Full Moon with cp-chip**

```html
<div class="cp-chip-group button-row" role="group" aria-label="Phase buttons">
  <button id="setNewMoon" class="cp-chip" type="button">New Moon</button>
  <button id="setFullMoon" class="cp-chip" type="button">Full Moon</button>
</div>
```

**Step 2: Replace Animate month / Animate year with cp-button--ghost**

```html
<div class="cp-button-row" role="group" aria-label="Time controls">
  <button id="animateMonth" class="cp-button cp-button--ghost" type="button">Animate month</button>
  <button id="animateYear" class="cp-button cp-button--ghost" type="button">Animate 1 year</button>
</div>
```

**Step 3: Replace Run simulation / Stop with cp-button--ghost**

Same pattern.

**Step 4: Replace toolbar with cp-utility-toolbar**

Include Station mode, Challenge mode, Help, Copy results.

**Step 5: Add component contracts, run tests, commit**

```bash
git add apps/demos/src/demos/eclipse-geometry/
git commit -m "feat(eclipse-geometry): migrate to cp-chip + cp-utility-toolbar"
```

---

### Task 8: keplers-laws — Presets + toolbar

**Files:**
- Modify: `apps/demos/src/demos/keplers-laws/index.html`
- Modify: `apps/demos/src/demos/keplers-laws/design-contracts.test.ts`

**Step 1: Replace preset buttons**

Replace `cp-button cp-button--outline preset` with `cp-chip preset`:
```html
<button class="cp-chip preset" data-a="0.387" data-e="0.206">Mercury</button>
```
Do for ALL 9 presets (6 planets + Halley + Circular + High e).

Replace `cp-button-grid` containers with `cp-chip-group--grid`.

**Step 2: Replace toolbar**

Replace `cp-action` buttons with `cp-utility-toolbar`. Remove both `<div class="cp-actions">` wrappers. Move the exhibit/instructor links to a `cp-popover` nav inside the toolbar.

**Step 3: Add component contracts, run tests, commit**

```bash
git add apps/demos/src/demos/keplers-laws/
git commit -m "feat(keplers-laws): migrate to cp-chip + cp-utility-toolbar"
```

---

### Task 9: binary-orbits + planetary-conjunctions — Toolbar only

**Files:**
- Modify: `apps/demos/src/demos/binary-orbits/index.html`
- Modify: `apps/demos/src/demos/planetary-conjunctions/index.html`

Both have only toolbar actions (Station mode, Help, Copy results).

**Step 1: Replace with cp-utility-toolbar in both**

Same pattern. For planetary-conjunctions (stub), only copyResults needs replacing.

**Step 2: Commit**

```bash
git add apps/demos/src/demos/binary-orbits/ apps/demos/src/demos/planetary-conjunctions/
git commit -m "feat(binary-orbits, planetary-conjunctions): migrate to cp-utility-toolbar"
```

---

### Batch C Gate Check

Run: `corepack pnpm -C apps/demos test -- --run`
Run: `corepack pnpm build`

---

### Task 9.5: Final cp-action sweep

**Step 1: Verify zero cp-action references remain**

Run: `grep -r "cp-action" apps/demos/src/demos/` — must return ZERO results (except test files asserting absence).

**Step 2: Run full suite**

Run: `corepack pnpm -C apps/demos test -- --run`
Run: `corepack pnpm build`
Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Step 3: Commit sweep if any stragglers found**

---

## Part 2: Full Migration of 3 Remaining Demos

### Task 10: conservation-laws — Full 4-layer migration

This demo is already functional with physics, animation, Station mode. It needs: starfield, token migration, logic extraction, full contract tests, E2E tests.

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/index.html`
- Modify: `apps/demos/src/demos/conservation-laws/style.css`
- Modify: `apps/demos/src/demos/conservation-laws/main.ts`
- Modify: `apps/demos/src/demos/conservation-laws/design-contracts.test.ts` (expand from Task 2 stub)
- Create: `apps/demos/src/demos/conservation-laws/logic.ts`
- Create: `apps/demos/src/demos/conservation-laws/logic.test.ts`
- Create: `apps/site/tests/conservation-laws.spec.ts`

**Step 1: Expand design contract tests (RED)**

Expand the stub from Task 2 into the full contract suite. Use moon-phases as the template — add tests for:
- Starfield canvas present
- Celestial tokens for sun (central mass) and particle
- Glow effects on celestial objects
- Readout unit separation (`cp-readout__unit`)
- No legacy tokens (`--cp-warning`, `--cp-accent2`, `--cp-accent3`)
- Entry animations (`cp-slide-up`, `cp-fade-in`)
- No color literals in CSS
- Physics imports from `@cosmic/physics`
- Instrument layer class
- Panel translucency (radial-gradient on SVG, since this uses SVG like angular-size)

Run tests — most should FAIL (RED).

**Step 2: Add starfield canvas**

Add to `index.html` inside the stage area:
```html
<canvas class="cp-starfield" aria-hidden="true"></canvas>
```

In `main.ts`, add:
```typescript
import { initStarfield } from "@cosmic/runtime";
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });
```

**Step 3: Migrate SVG tokens**

In `style.css`:
- Replace `.orbit` radial-gradient with `--cp-celestial-*` tokens
- Replace `.orbit__mass` color with `--cp-celestial-sun-core`
- Replace `.orbit__particle` color with `--cp-celestial-earth` (or planet token)
- Replace `.orbit__velocity` color with `--cp-accent-green`
- Replace `.orbit__path` stroke with `--cp-celestial-orbit`
- Add glow: `filter: drop-shadow(var(--cp-glow-sun))` on central mass
- Add glow: `filter: drop-shadow(var(--cp-glow-planet))` on particle

**Step 4: Separate readout units**

Check each readout in `index.html` and wrap units in `<span class="cp-readout__unit">`:
```html
<div class="cp-readout__value" id="readSpeed">0.00 <span class="cp-readout__unit">AU/yr</span></div>
```

For the 6 readouts: orbit type (no unit), eccentricity (no unit), energy (AU²/yr²), angular momentum (AU²/yr), speed (AU/yr), periapsis (AU).

**Step 5: Add entry animations**

Add stagger classes to shell sections:
```html
<aside class="cp-demo__sidebar cp-panel cp-slide-up" style="animation-delay: 0.1s">
```

**Step 6: Run contract tests — should be GREEN**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/conservation-laws/design-contracts.test.ts`

**Step 7: Extract pure logic to logic.ts**

Extract from `main.ts`:
- `logSliderToValue(sliderVal, min, max)` → pure math
- `valueToLogSlider(value, min, max)` → pure math
- `formatNumber(value, sigFigs)` → pure formatting
- `orbitalRadiusAu(p, e, nu)` → orbital geometry
- `conicPositionAndTangentAu(...)` → position + tangent vector
- `instantaneousSpeedAuPerYr(...)` → speed from vis-viva
- `buildPathD(...)` → SVG path string generation
- `classifyOrbit(e)` → orbit type string
- `computeReadouts(...)` → format all 6 readout values

Keep `main.ts` as thin wiring: DOM queries, event listeners, animation loop, render calls.

**Step 8: Write logic.test.ts**

Test each extracted function:
- `logSliderToValue`: known-answer (midpoint returns geometric mean)
- `formatNumber`: edge cases (very small, very large, zero)
- `orbitalRadiusAu`: circular (e=0, r=p), elliptical periapsis/apoapsis
- `classifyOrbit`: e<1 → "Elliptical", e≈1 → "Parabolic", e>1 → "Hyperbolic", e≈0 → "Circular"
- `buildPathD`: returns valid SVG path string starting with "M"
- `computeReadouts`: known-answer for circular orbit (e=0, energy = -mu/2a, h = sqrt(mu*a))

Run: `corepack pnpm -C apps/demos test -- --run src/demos/conservation-laws/logic.test.ts`

**Step 9: Write Playwright E2E tests**

Create `apps/site/tests/conservation-laws.spec.ts`:
- Page loads without errors
- Starfield canvas is attached
- All 4 sliders respond to input
- All 6 readouts update when sliders change
- Preset buttons (Circular, Elliptical, Escape, Hyperbolic) set correct orbit type
- Play/Pause/Reset animation controls work
- Station mode modal opens
- Help modal opens
- Responsive layout at mobile/desktop
- Visual regression screenshots

**Step 10: Run all gates**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/conservation-laws/`
Run: `corepack pnpm build`
Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- conservation-laws`

**Step 11: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/ apps/site/tests/conservation-laws.spec.ts
git commit -m "feat(conservation-laws): full 4-layer migration with design contracts, logic extraction, and E2E tests"
```

---

### Task 11: binary-orbits — Full 4-layer migration

Similar to conservation-laws but uses Canvas 2D instead of SVG.

**Files:**
- Modify: `apps/demos/src/demos/binary-orbits/index.html`
- Modify: `apps/demos/src/demos/binary-orbits/style.css`
- Modify: `apps/demos/src/demos/binary-orbits/main.ts`
- Create: `apps/demos/src/demos/binary-orbits/design-contracts.test.ts`
- Create: `apps/demos/src/demos/binary-orbits/logic.ts`
- Create: `apps/demos/src/demos/binary-orbits/logic.test.ts`
- Create: `apps/site/tests/binary-orbits.spec.ts`

**Step 1: Write full design contract tests (RED)**

Use blackbody-radiation contracts as template (Canvas 2D pattern):
- Starfield canvas present
- Canvas uses CSS tokens for background (not inline styles)
- Readout unit separation
- No legacy tokens
- Entry animations
- No color literals in CSS
- Physics imports
- Component contracts (cp-utility-toolbar, zero cp-action)

**Step 2: Add starfield canvas**

Same pattern — add `<canvas class="cp-starfield">` + `initStarfield()`.

**Step 3: Migrate CSS tokens**

Replace any raw colors with `--cp-*` tokens. Canvas drawing colors read from CSS via `getComputedStyle` are fine (same pattern as blackbody-radiation).

**Step 4: Separate readout units**

2 readouts: barycenter offset (AU), orbital period (yr).

**Step 5: Extract pure logic**

Extract from `main.ts`:
- `computeModel(massRatio, separationAu, totalMass)` → barycenter + period
- `formatNumber(value, digits)` → formatting
- `bodyRadius(mass)` → visual sizing (log scale)
- Any other pure functions

**Step 6: Write logic.test.ts**

Test computed physics:
- Equal masses → barycenter at midpoint
- Extreme mass ratio → barycenter near heavier body
- Period scales with Kepler's law
- Body radius monotonically increases with mass

**Step 7: Write E2E tests**

- Page loads, starfield attached
- Mass ratio slider updates readouts
- Separation slider updates period
- Canvas renders (non-blank after short delay)
- Station mode, Help work
- Responsive layout

**Step 8: Run all gates and commit**

```bash
git add apps/demos/src/demos/binary-orbits/ apps/site/tests/binary-orbits.spec.ts
git commit -m "feat(binary-orbits): full 4-layer migration"
```

---

### Task 12: planetary-conjunctions — Full build from stub

This demo is currently a stub. It needs to be built from scratch.

**IMPORTANT:** Check if the legacy demo exists at `~/Teaching/astr101-sp26/demos/`. Based on exploration, there is NO legacy planetary-conjunctions demo. This needs to be built fresh based on the stub's declared purpose: "Time between conjunctions (days)."

**Physics model needed:** Synodic period formula P_syn = P1 * P2 / |P1 - P2|

**Files:**
- Modify: `apps/demos/src/demos/planetary-conjunctions/index.html`
- Modify: `apps/demos/src/demos/planetary-conjunctions/style.css`
- Modify: `apps/demos/src/demos/planetary-conjunctions/main.ts`
- Create: `apps/demos/src/demos/planetary-conjunctions/design-contracts.test.ts`
- Create: `apps/demos/src/demos/planetary-conjunctions/logic.ts`
- Create: `apps/demos/src/demos/planetary-conjunctions/logic.test.ts`
- Create: `apps/site/tests/planetary-conjunctions.spec.ts`
- Possibly modify: `packages/physics/src/` (synodic period model)

**NOTE:** This task is the most complex — it requires building a new demo from scratch. The plan here is high-level; specific implementation details should be determined during execution based on the pedagogical goals (conjunction timing, synodic period visualization).

**Step 1: Design the demo UI**

Based on the stub metadata and typical conjunction pedagogy:
- Controls: planet pair selector (chips: Venus-Earth, Earth-Mars, Earth-Jupiter, etc.)
- Visualization: SVG or Canvas showing two circular orbits with planet positions
- Readouts: synodic period (days), next conjunction angle, current separation angle
- Animation: planets orbiting at different rates, highlighting conjunctions

**Step 2: Add synodic period physics model**

Either add to `twoBodyAnalytic.ts` or create new `synodicPeriod.ts`:
```typescript
export function synodicPeriodDays(p1Days: number, p2Days: number): number {
  return Math.abs(p1Days * p2Days / (p1Days - p2Days));
}
```

With known-answer tests (Earth-Mars ≈ 780 days, Earth-Venus ≈ 584 days, Earth-Jupiter ≈ 399 days).

**Step 3-12: Follow standard 4-layer migration**

Same pattern as conservation-laws: design contracts → starfield → tokens → logic extraction → E2E tests → gates.

**Step 13: Commit**

```bash
git add apps/demos/src/demos/planetary-conjunctions/ apps/site/tests/planetary-conjunctions.spec.ts packages/physics/src/
git commit -m "feat(planetary-conjunctions): full demo implementation with synodic period model"
```

---

## Final Verification

### Task 13: Run all gates

**Step 1: Theme tests**

Run: `corepack pnpm -C packages/theme test -- --run`
Expected: 97 tests pass

**Step 2: All demo tests**

Run: `corepack pnpm -C apps/demos test -- --run`
Expected: 826+ tests pass (now higher with new contract + logic tests)

**Step 3: Build**

Run: `corepack pnpm build`
Expected: Clean build, zero warnings

**Step 4: E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
Expected: 322+ tests pass (now higher with new demo E2E tests)

**Step 5: Zero cp-action sweep**

Run: `grep -r "cp-action" apps/demos/src/demos/ --include="*.html" --include="*.css" --include="*.ts" | grep -v "test.ts" | grep -v "not.*contain"`
Expected: Zero results

**Step 6: Run /reviewing-project-quality**

Generate the quality audit report.

---

## Summary of All Commits

| # | Demo | Type | Commit message |
|---|------|------|----------------|
| 1 | blackbody-radiation | cp-action→chips | `feat(blackbody-radiation): migrate to cp-chip component system` |
| 2 | conservation-laws | cp-action→chips | `feat(conservation-laws): migrate to cp-chip component system` |
| 3 | seasons | cp-action→chips | `feat(seasons): migrate to cp-chip component system` |
| 4 | parallax-distance | cp-action→toolbar | `feat(parallax-distance): migrate to cp-utility-toolbar` |
| 5 | telescope-resolution | cp-action→chips+toolbar | `feat(telescope-resolution): migrate to cp-chip + cp-utility-toolbar` |
| 6 | em-spectrum | cp-action→chips+toolbar | `feat(em-spectrum): migrate to cp-chip + cp-utility-toolbar` |
| 7 | eclipse-geometry | cp-action→chips+toolbar | `feat(eclipse-geometry): migrate to cp-chip + cp-utility-toolbar` |
| 8 | keplers-laws | presets→chips+toolbar | `feat(keplers-laws): migrate to cp-chip + cp-utility-toolbar` |
| 9 | binary-orbits + planetary-conjunctions | cp-action→toolbar | `feat(binary-orbits, planetary-conjunctions): migrate to cp-utility-toolbar` |
| 10 | conservation-laws | full migration | `feat(conservation-laws): full 4-layer migration` |
| 11 | binary-orbits | full migration | `feat(binary-orbits): full 4-layer migration` |
| 12 | planetary-conjunctions | full build | `feat(planetary-conjunctions): full demo implementation` |
