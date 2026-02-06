# EM Spectrum Visual Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the em-spectrum demo's spectrum bar into a rich, pedagogically powerful visualization: legacy-inspired spectral gradient, inlaid chirp wave showing frequency increase, size-comparison scale objects, and cleaner readout layout.

**Architecture:** CSS/HTML/JS changes only. The logic layer (`logic.ts`) gains pure functions for the gradient and wave drawing. The spectrum gradient uses hex colors in JS (physical data, not design tokens). A Canvas 2D overlay draws the chirp wave on top of the gradient bar. The no-color-literals contract only checks CSS files.

**Tech Stack:** TypeScript, Canvas 2D, CSS, Vitest, Playwright

---

### Task 1: Add spectrum visualization functions to logic.ts + unit tests

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/logic.ts`
- Modify: `apps/demos/src/demos/em-spectrum/logic.test.ts`

**What:**
Add three exports to logic.ts:
1. `SCALE_OBJECTS` — array of {label, lambdaCm} for size comparison labels
2. `spectrumGradientCSS()` — returns a CSS linear-gradient string using the legacy's color approach adapted to our log-scale positions
3. `drawSpectrumWave(ctx, width, height)` — draws a chirp wave on a Canvas 2D context where frequency increases from left (radio) to right (gamma)

**Step 1: Add the exports to logic.ts**

At the end of logic.ts, add:

```typescript
/**
 * Scale-object labels positioned at their approximate wavelength.
 * Used to annotate the spectrum bar with familiar size comparisons.
 */
export const SCALE_OBJECTS: Array<{ label: string; lambdaCm: number }> = [
  { label: "Buildings", lambdaCm: 1e4 },
  { label: "Humans",    lambdaCm: 1.7e2 },
  { label: "Insects",   lambdaCm: 1e0 },
  { label: "Cells",     lambdaCm: 1e-3 },
  { label: "Molecules", lambdaCm: 1e-7 },
  { label: "Atoms",     lambdaCm: 1e-8 },
  { label: "Nuclei",    lambdaCm: 1e-12 },
];

/**
 * CSS linear-gradient string for the EM spectrum.
 *
 * Uses the legacy demo's color scheme (dark maroon for radio through
 * the visible rainbow to deep purple/black for gamma), adapted to
 * log-scale positions. Hex colors here represent physical spectral data,
 * not design tokens — acceptable in JS per architecture rules.
 */
export function spectrumGradientCSS(): string {
  const stops: Array<[number, string]> = [
    // Radio — dark maroon to warm red
    [0,    "#800000"],
    [8,    "#993000"],
    [15,   "#cc3300"],
    [22,   "#ff3300"],
    [28,   "#ff0000"],
    // Near-IR edge / visible red
    [32,   "#ff0000"],
    [34,   "#ff4500"],
    [37,   "#ffa500"],
    [40,   "#ffff00"],
    [44,   "#00ff00"],
    [48,   "#00ffff"],
    [52,   "#0000ff"],
    [55,   "#4b0082"],
    // UV
    [58,   "#8b00ff"],
    [65,   "#9932cc"],
    // X-ray
    [80,   "#4b0082"],
    // Gamma — deep purple to near-black
    [100,  "#1a0033"],
  ];
  const parts = stops.map(([pos, color]) => `${color} ${pos}%`);
  return `linear-gradient(to right, ${parts.join(", ")})`;
}

/**
 * Draw a chirp wave overlay on a canvas context.
 *
 * The wave frequency increases smoothly from left (low freq / radio)
 * to right (high freq / gamma), visually demonstrating that shorter
 * wavelengths = higher frequency. The range is normalized so the wave
 * is visible across the entire bar (not physically literal, since the
 * actual range spans 20 orders of magnitude).
 *
 * @param ctx - Canvas 2D rendering context
 * @param width - canvas pixel width
 * @param height - canvas pixel height
 */
export function drawSpectrumWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const midY = height / 2;
  const amplitude = height * 0.32;

  // Chirp: frequency increases exponentially from left to right.
  // minCycles = cycles in leftmost pixel-region, maxCycles = rightmost.
  // A 10:1 ratio gives a clear visual chirp without extremes.
  const minFreq = 3;   // cycles across full width at x=0
  const maxFreq = 60;  // cycles across full width at x=width

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  let phase = 0;
  for (let x = 0; x <= width; x++) {
    // Exponential frequency sweep
    const t = x / width;
    const localFreq = minFreq * Math.pow(maxFreq / minFreq, t);
    // Accumulate phase (integral of frequency)
    const dx = 1 / width;
    phase += localFreq * dx * 2 * Math.PI;
    const y = midY + amplitude * Math.sin(phase);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
}
```

**Step 2: Add unit tests to logic.test.ts**

```typescript
import { spectrumGradientCSS, SCALE_OBJECTS, drawSpectrumWave } from "./logic";

describe("spectrumGradientCSS", () => {
  it("returns a linear-gradient CSS string", () => {
    const result = spectrumGradientCSS();
    expect(result).toMatch(/^linear-gradient\(to right,/);
  });

  it("contains at least 15 color stops", () => {
    const result = spectrumGradientCSS();
    const stops = result.match(/#[0-9a-fA-F]{6}/g) || [];
    expect(stops.length).toBeGreaterThanOrEqual(15);
  });

  it("starts at 0% and ends at 100%", () => {
    const result = spectrumGradientCSS();
    expect(result).toContain("0%");
    expect(result).toContain("100%");
  });

  it("contains visible spectrum colors", () => {
    const result = spectrumGradientCSS();
    expect(result).toContain("#ff0000"); // red
    expect(result).toContain("#00ff00"); // green
    expect(result).toContain("#0000ff"); // blue
  });
});

describe("SCALE_OBJECTS", () => {
  it("has 7 scale comparison objects", () => {
    expect(SCALE_OBJECTS).toHaveLength(7);
  });

  it("objects are ordered from largest to smallest wavelength", () => {
    for (let i = 1; i < SCALE_OBJECTS.length; i++) {
      expect(SCALE_OBJECTS[i].lambdaCm).toBeLessThan(SCALE_OBJECTS[i - 1].lambdaCm);
    }
  });

  it("each object has a label and positive wavelength", () => {
    for (const obj of SCALE_OBJECTS) {
      expect(obj.label.length).toBeGreaterThan(0);
      expect(obj.lambdaCm).toBeGreaterThan(0);
    }
  });
});

describe("drawSpectrumWave", () => {
  it("is a function that accepts ctx, width, height", () => {
    expect(typeof drawSpectrumWave).toBe("function");
    expect(drawSpectrumWave.length).toBe(3);
  });
});
```

Note: `drawSpectrumWave` can't be deeply tested in jsdom (no real Canvas), so we just verify the function signature. The visual result is verified via E2E screenshots.

**Step 3: Run tests**

```bash
corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/logic.test.ts
```

**Step 4: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/logic.ts apps/demos/src/demos/em-spectrum/logic.test.ts
git commit -m "feat(em-spectrum): add spectrumGradientCSS, drawSpectrumWave, SCALE_OBJECTS"
```

---

### Task 2: Redesign spectrum bar — gradient, wave canvas, scale objects

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/style.css`
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`

**What:**
1. Make spectrum bar much taller (~80px), remove the CSS gradient (will be JS-applied)
2. Add a `<canvas>` overlay inside `.spectrum__bar` for the chirp wave
3. Apply the gradient via JS; draw the wave overlay on the canvas
4. Add a `.spectrum__scale` row for size-comparison labels
5. Position scale objects at their wavelength-derived positions
6. Add box-shadow glow to the bar (legacy had this)

**Step 1: Update HTML**

In `index.html`, inside `.spectrum__bar` (line 67), add a canvas overlay before the highlight/marker:

```html
<div class="spectrum__bar" aria-hidden="true">
  <canvas id="spectrumWaveCanvas" class="spectrum__wave"></canvas>
  <div id="bandHighlight" class="spectrum__highlight"></div>
  <div id="marker" class="spectrum__marker">
    <div id="markerLabel" class="spectrum__markerLabel"></div>
  </div>
</div>
```

After `.spectrum__ticks` (line 81), add the scale row:

```html
<div class="spectrum__scale" aria-hidden="true" id="spectrumScale"></div>
```

**Step 2: Update CSS**

Replace `.spectrum__bar` (lines 87-99) — remove static gradient, make taller, add glow:

```css
.spectrum__bar {
  position: relative;
  height: 80px;
  border-radius: 12px;
  border: 1px solid var(--cp-border);
  overflow: hidden;
  box-shadow:
    0 0 24px 4px color-mix(in srgb, var(--cp-accent) 18%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 6%, transparent);
}
```

Add the wave canvas overlay style:

```css
.spectrum__wave {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```

Adjust `.spectrum__marker` for taller bar:

```css
.spectrum__marker {
  position: absolute;
  top: -6px;
  width: 2px;
  height: 92px;
  background: color-mix(in srgb, var(--cp-text) 80%, transparent);
}
```

Adjust `.spectrum__markerLabel` top for taller bar:

```css
.spectrum__markerLabel {
  ...
  top: -22px;
  ...
}
```

Add scale row:

```css
.spectrum__scale {
  position: relative;
  height: 24px;
  margin-top: 4px;
  font-size: 0.76rem;
  color: var(--cp-muted);
}

.spectrum__scale-item {
  position: absolute;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
  line-height: 1;
}
```

**Step 3: Update main.ts**

Add to logic imports:
```typescript
import { ..., spectrumGradientCSS, drawSpectrumWave, SCALE_OBJECTS } from "./logic";
```

Add DOM queries:
```typescript
const spectrumBarEl = document.querySelector<HTMLDivElement>(".spectrum__bar");
const spectrumWaveCanvasEl = document.querySelector<HTMLCanvasElement>("#spectrumWaveCanvas");
const spectrumScaleEl = document.querySelector<HTMLDivElement>("#spectrumScale");
```

After runtime init / starfield, apply gradient + draw wave + render scale:
```typescript
// Apply spectrum gradient
if (spectrumBarEl) {
  spectrumBarEl.style.background = spectrumGradientCSS();
}

// Draw chirp wave overlay
function renderWaveOverlay() {
  if (!spectrumWaveCanvasEl) return;
  const rect = spectrumWaveCanvasEl.parentElement?.getBoundingClientRect();
  if (!rect) return;
  const dpr = window.devicePixelRatio || 1;
  spectrumWaveCanvasEl.width = rect.width * dpr;
  spectrumWaveCanvasEl.height = rect.height * dpr;
  const ctx = spectrumWaveCanvasEl.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  drawSpectrumWave(ctx, rect.width, rect.height);
}
renderWaveOverlay();
window.addEventListener("resize", renderWaveOverlay);

// Render scale comparison objects
function renderScaleObjects() {
  if (!spectrumScaleEl) return;
  spectrumScaleEl.innerHTML = "";
  for (const obj of SCALE_OBJECTS) {
    const pos = clamp(wavelengthToPositionPercent(obj.lambdaCm), 3, 97);
    const span = document.createElement("span");
    span.className = "spectrum__scale-item";
    span.style.left = `${pos}%`;
    span.textContent = obj.label;
    spectrumScaleEl.appendChild(span);
  }
}
renderScaleObjects();
```

**Step 4: Build and verify visually**

```bash
corepack pnpm build
```

Open in browser and confirm:
- Tall, colorful spectrum bar with legacy-style rainbow gradient
- Semi-transparent white chirp wave overlaid, frequency increasing left → right
- Scale labels (Buildings → Nuclei) positioned below ticks
- Marker and highlight still work correctly

**Step 5: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/style.css apps/demos/src/demos/em-spectrum/index.html apps/demos/src/demos/em-spectrum/main.ts
git commit -m "feat(em-spectrum): rich spectrum bar with chirp wave + scale objects"
```

---

### Task 3: Move equation callout to Model Notes + clean up readouts

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`

**What:**
Move the `<div class="cp-callout" data-kind="model">` (lines 117-119) from readouts panel into Model Notes accordion body.

**Step 1: Cut from readouts panel (line 117-119)**

Remove from inside `<aside class="cp-demo__readouts">`:
```html
<div class="cp-callout" data-kind="model">
  Relationships: $c = \lambda \nu$ and $E = h\nu = \frac{hc}{\lambda}$.
</div>
```

**Step 2: Paste into Model Notes accordion (before the `<ul>`)**

```html
<div class="cp-accordion__body">
  <div class="cp-callout" data-kind="model">
    Relationships: $c = \lambda \nu$ and $E = h\nu = \frac{hc}{\lambda}$.
  </div>
  <ul>
    <li>Internal math uses CGS constants: ...</li>
    ...
```

**Step 3: Build + visual check**

```bash
corepack pnpm build
```

Verify readouts panel shows just the 3 readout cards, and equation appears when opening Model Notes.

**Step 4: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/index.html
git commit -m "refactor(em-spectrum): move equation callout to Model Notes"
```

---

### Task 4: Update contract test + E2E tests

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/design-contracts.test.ts`
- Modify: `apps/site/tests/em-spectrum.spec.ts`

**What:**
1. Update contract test: spectrum bar gradient is now JS-applied, not CSS tokens
2. Add E2E tests for scale objects + equation placement
3. Update any E2E tests affected by the taller spectrum bar

**Step 1: Update contract test**

In `design-contracts.test.ts`, replace the architecture test (line 106-109):

```typescript
// OLD:
it("spectrum bar uses design-system tokens for gradient", () => {
  expect(css).toMatch(/\.spectrum__bar[\s\S]*?background[\s\S]*?var\(--cp-/);
});

// NEW:
it("spectrum gradient is generated by logic.ts, not hardcoded in CSS", () => {
  const mainPath = path.resolve(__dirname, "main.ts");
  const mainTs = fs.readFileSync(mainPath, "utf-8");
  expect(mainTs).toContain("spectrumGradientCSS");
  expect(css).not.toMatch(/\.spectrum__bar[\s\S]*?linear-gradient/);
});
```

**Step 2: Add E2E tests**

In `em-spectrum.spec.ts`, add:

```typescript
test("scale objects row shows size comparison labels", async ({ page }) => {
  const scale = page.locator(".spectrum__scale");
  await expect(scale).toBeVisible();
  await expect(scale).toContainText("Buildings");
  await expect(scale).toContainText("Nuclei");
});

test("spectrum bar has chirp wave canvas overlay", async ({ page }) => {
  const canvas = page.locator("#spectrumWaveCanvas");
  await expect(canvas).toBeVisible();
});

test("equation callout appears in Model Notes, not readouts", async ({ page }) => {
  const readouts = page.getByLabel("Readouts panel");
  await expect(readouts).not.toContainText("Relationships:");

  const modelNotes = page.locator("details", { hasText: "Model notes" });
  await modelNotes.locator("summary").click();
  await expect(modelNotes).toContainText("Relationships:");
});
```

**Step 3: Run all tests**

```bash
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

**Step 4: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/design-contracts.test.ts apps/site/tests/em-spectrum.spec.ts
git commit -m "test(em-spectrum): update contracts + E2E for visual polish"
```

---

### Task 5: Full gate run + visual review + memory update

**What:**
1. Run every gate: physics, theme, demo tests, build, typecheck, E2E
2. Take before/after screenshots for visual comparison
3. Update MEMORY.md

**Step 1: Full gate**

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C packages/theme test -- --run
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
corepack pnpm -C apps/site typecheck
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

All must pass.

**Step 2: Visual screenshots**

Use Playwright to capture the demo and compare with the pre-polish version.

**Step 3: Update MEMORY.md with visual polish notes**
