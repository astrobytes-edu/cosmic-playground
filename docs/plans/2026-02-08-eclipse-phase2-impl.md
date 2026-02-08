# Eclipse-Geometry UX Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate eclipse-geometry from triad shell to moon-phases layout, restore all 8 lost legacy features (E1–E8), and add new discoverability features (presets, visual rewards).

**Architecture:** Layout migration first (HTML restructure), then pure logic functions with TDD (contextual messages, arc extents), then UI wiring (drag, arcs, presets). All new logic goes in `logic.ts` as pure functions with DI callbacks. All rendering stays in `main.ts`. Contract tests and E2E updated last.

**Tech Stack:** TypeScript, SVG, CSS custom properties (`--cp-*` tokens), Vitest (unit), Playwright (E2E)

**Design spec:** `docs/plans/2026-02-08-eclipse-seasons-design.md`

---

### Task 1: Layout Migration — HTML Restructure

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html`
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`

**What:** Replace the triad shell (`data-shell="triad"` with controls aside + readouts aside + drawer) with the moon-phases layout (sidebar + stage + readout strip + shelf). Reference `apps/demos/src/demos/moon-phases/index.html` for exact class names.

**Step 1: Restructure index.html**

Replace the outer `<div id="cp-demo" ... data-shell="triad">` with a custom layout (no `data-shell`). The new structure:

```html
<div id="cp-demo" class="cp-layer-instrument cp-demo" aria-label="Eclipse Geometry instrument">
  <!-- SIDEBAR (narrow, left) -->
  <aside class="cp-demo__sidebar cp-panel" aria-label="Controls">
    <!-- Header, callout, phase chips, moon slider, presets button, tilt slider, distance dropdown, utility toolbar -->
    <!-- REMOVE: node longitude slider -->
    <!-- REMOVE: time controls callout (moves to shelf) -->
    <!-- REMOVE: long-run simulation section (moves to shelf) -->
  </aside>

  <!-- STAGE (dominant, right of sidebar) -->
  <section class="cp-demo__stage cp-stage stage" aria-label="Visualization stage">
    <canvas class="cp-starfield" aria-hidden="true"></canvas>
    <svg id="eclipseStage" ...><!-- keep existing dual-panel SVG --></svg>
  </section>

  <!-- READOUT STRIP (horizontal, below stage) -->
  <div class="cp-readout-strip" aria-label="Readouts">
    <!-- 6 horizontal readout items -->
  </div>

  <!-- CONTEXTUAL MESSAGE (below readout strip) -->
  <p id="contextMessage" class="cp-status cp-context-message" aria-live="polite"></p>

  <!-- SHELF (tabs, bottom) -->
  <section class="cp-demo__shelf" aria-label="Information panels">
    <!-- Tab bar + 3 tab panels: "What to notice", "Model notes", "Simulation" -->
  </section>
</div>
```

Key changes:
- `.cp-demo__controls` → `.cp-demo__sidebar`
- `.cp-demo__readouts` aside → `.cp-readout-strip` div (horizontal)
- `.cp-demo__drawer` with accordions → `.cp-demo__shelf` with tabs
- Node longitude slider (`#nodeLon`) removed from sidebar
- Time controls + simulation section moved to shelf "Simulation" tab
- Add `#contextMessage` element for pedagogical feedback

**Step 2: Create readout strip HTML**

The readout strip replaces the vertical readouts panel. Six items in a horizontal row:

```html
<div class="cp-readout-strip" aria-label="Readouts">
  <div class="cp-readout">
    <span class="cp-readout__label">Phase</span>
    <span class="cp-readout__value" id="phaseLabel"></span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">$\Delta$</span>
    <span class="cp-readout__value"><span id="phaseAngle"></span> <span class="cp-readout__unit">deg</span></span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">$\beta$</span>
    <span class="cp-readout__value"><span id="absBeta"></span> <span class="cp-readout__unit">deg</span></span>
  </div>
  <div class="cp-readout cp-readout--solar" id="solarReadout">
    <span class="cp-readout__label">Solar</span>
    <span class="cp-readout__value"><span class="cp-readout__dot"></span><span id="solarOutcome"></span></span>
  </div>
  <div class="cp-readout cp-readout--lunar" id="lunarReadout">
    <span class="cp-readout__label">Lunar</span>
    <span class="cp-readout__value"><span class="cp-readout__dot"></span><span id="lunarOutcome"></span></span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">Node</span>
    <span class="cp-readout__value"><span id="nearestNode"></span> <span class="cp-readout__unit">deg</span></span>
  </div>
</div>
```

**Step 3: Create shelf with tabs**

Replace the accordion drawer with a tabbed shelf. Move simulation controls to a "Simulation" tab:

```html
<section class="cp-demo__shelf" aria-label="Information panels">
  <div class="cp-shelf-tabs" role="tablist">
    <button role="tab" aria-selected="true" aria-controls="tab-notice" id="tab-btn-notice">What to notice</button>
    <button role="tab" aria-selected="false" aria-controls="tab-model" id="tab-btn-model">Model notes</button>
    <button role="tab" aria-selected="false" aria-controls="tab-sim" id="tab-btn-sim">Simulation</button>
  </div>
  <div id="tab-notice" role="tabpanel" aria-labelledby="tab-btn-notice">
    <!-- existing "What to notice" content -->
  </div>
  <div id="tab-model" role="tabpanel" aria-labelledby="tab-btn-model" hidden>
    <!-- existing "Model notes" content -->
  </div>
  <div id="tab-sim" role="tabpanel" aria-labelledby="tab-btn-sim" hidden>
    <!-- Moved from sidebar: years slider, speed dropdown, run/stop, output -->
  </div>
</section>
```

**Step 4: Update style.css for new layout**

Replace triad-dependent styles with a CSS grid matching moon-phases:

```css
.cp-demo {
  display: grid;
  grid-template-columns: minmax(220px, 280px) 1fr;
  grid-template-rows: 1fr auto auto auto;
  grid-template-areas:
    "sidebar stage"
    "readouts readouts"
    "context context"
    "shelf shelf";
  height: 100vh;
  overflow: hidden;
}

.cp-demo__sidebar { grid-area: sidebar; }
.cp-demo__stage { grid-area: stage; }
.cp-readout-strip {
  grid-area: readouts;
  display: flex;
  gap: var(--cp-space-4);
  padding: var(--cp-space-2) var(--cp-space-4);
  justify-content: center;
  flex-wrap: wrap;
}
.cp-context-message { grid-area: context; text-align: center; }
.cp-demo__shelf { grid-area: shelf; }
```

Add readout strip styles (horizontal layout), shelf tab styles, and `.cp-readout--solar`/`.cp-readout--lunar` color-coded styles.

**Step 5: Update main.ts DOM queries**

Update element queries that reference moved/renamed elements:
- `.cp-demo__controls` → `.cp-demo__sidebar`
- Remove `nodeLonSlider` query (slider removed)
- Add queries for new elements: `#contextMessage`, tab buttons, simulation tab panel
- Add tab switching logic (click handler on tab buttons)

**Step 6: Verify build + existing tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eclipse-geometry/`
Expected: Some contract tests may fail (e.g., "readouts aside exists"). Note which ones fail — they'll be updated in Task 12.

Run: `corepack pnpm build`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add apps/demos/src/demos/eclipse-geometry/index.html apps/demos/src/demos/eclipse-geometry/style.css apps/demos/src/demos/eclipse-geometry/main.ts
git commit -m "refactor(eclipse): migrate from triad to moon-phases layout shell

Layout restructure: sidebar + stage + readout strip + shelf tabs.
Node slider removed (will be replaced by draggable nodes).
Simulation controls moved to shelf Simulation tab.
Readouts now horizontal strip below stage."
```

---

### Task 2: Contextual Feedback Messages [E3]

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.test.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Write failing tests for `contextualMessage()`**

Add to `logic.test.ts`:

```typescript
describe("contextualMessage", () => {
  it("returns wrong-phase message when not near New or Full", () => {
    const state = makeState({ phaseAngleDeg: 90, absBetaDeg: 1.0 });
    expect(contextualMessage(state)).toContain("require New or Full Moon");
  });

  it("returns too-far-from-node when near syzygy but |beta| large", () => {
    const state = makeState({ phaseAngleDeg: 2, absBetaDeg: 3.5, nearestNodeDeg: 40, solarType: "none", lunarType: "none" });
    expect(contextualMessage(state)).toContain("too far from a node");
  });

  it("returns near-node-wrong-phase when near node but wrong phase", () => {
    const state = makeState({ phaseAngleDeg: 90, nearestNodeDeg: 5 });
    expect(contextualMessage(state)).toContain("near a node but not at New/Full");
  });

  it("returns eclipse-achieved for solar eclipse", () => {
    const state = makeState({ phaseAngleDeg: 1, absBetaDeg: 0.3, solarType: "total-solar", lunarType: "none" });
    expect(contextualMessage(state)).toContain("solar eclipse");
  });

  it("returns eclipse-achieved for lunar eclipse", () => {
    const state = makeState({ phaseAngleDeg: 179, absBetaDeg: 0.5, solarType: "none", lunarType: "total-lunar" });
    expect(contextualMessage(state)).toContain("lunar eclipse");
  });

  it("returns almost message when close to threshold", () => {
    // beta just above solar partial threshold (~1.5 deg)
    const state = makeState({ phaseAngleDeg: 1, absBetaDeg: 1.8, nearestNodeDeg: 10, solarType: "none", lunarType: "none" });
    const msg = contextualMessage(state, { solarPartialDeg: 1.5 });
    expect(msg).toContain("Almost");
  });

  it("returns empty string for mundane state (far from everything)", () => {
    const state = makeState({ phaseAngleDeg: 90, absBetaDeg: 4, nearestNodeDeg: 60 });
    expect(contextualMessage(state)).toBe("");
  });
});
```

**Step 2: Run tests — verify they fail**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eclipse-geometry/logic.test.ts`
Expected: FAIL — `contextualMessage` not defined

**Step 3: Implement `contextualMessage()` in logic.ts**

```typescript
export type EclipseThresholds = {
  solarPartialDeg: number;
  solarCentralDeg: number;
  lunarPenumbralDeg: number;
};

const SYZYGY_NEAR_DEG = 10; // within 10 deg of New/Full
const NODE_NEAR_DEG = 20;   // within 20 deg of a node
const ALMOST_MARGIN_DEG = 0.5; // how close to threshold counts as "almost"

export function contextualMessage(
  state: EclipseDemoState,
  thresholds?: Partial<EclipseThresholds>
): string {
  const { phaseAngleDeg, absBetaDeg, nearestNodeDeg, solarType, lunarType } = state;
  const nearSyzygy = phaseAngleDeg <= SYZYGY_NEAR_DEG || phaseAngleDeg >= (360 - SYZYGY_NEAR_DEG)
    || Math.abs(phaseAngleDeg - 180) <= SYZYGY_NEAR_DEG;
  const nearNode = nearestNodeDeg <= NODE_NEAR_DEG;
  const hasSolar = solarType !== "none";
  const hasLunar = lunarType !== "none";

  // Eclipse achieved
  if (hasSolar) {
    return `${outcomeLabel(solarType)}! Moon at New Moon, ${formatNumber(nearestNodeDeg, 1)}\u00b0 from nearest node.`;
  }
  if (hasLunar) {
    return `${outcomeLabel(lunarType)}! Moon at Full Moon, ${formatNumber(nearestNodeDeg, 1)}\u00b0 from nearest node.`;
  }

  // Almost — near syzygy and beta is close to a threshold
  if (nearSyzygy && thresholds) {
    const solarPartial = thresholds.solarPartialDeg ?? 1.5;
    const lunarPenumbral = thresholds.lunarPenumbralDeg ?? 1.6;
    if (absBetaDeg > solarPartial && absBetaDeg < solarPartial + ALMOST_MARGIN_DEG) {
      return `Almost! |\u03b2| = ${formatNumber(absBetaDeg, 2)}\u00b0 \u2014 needs to be below ${formatNumber(solarPartial, 1)}\u00b0 for a solar eclipse.`;
    }
    if (absBetaDeg > lunarPenumbral && absBetaDeg < lunarPenumbral + ALMOST_MARGIN_DEG) {
      return `Almost! |\u03b2| = ${formatNumber(absBetaDeg, 2)}\u00b0 \u2014 needs to be below ${formatNumber(lunarPenumbral, 1)}\u00b0 for a lunar eclipse.`;
    }
  }

  // Near syzygy but too far from node
  if (nearSyzygy && !nearNode) {
    return `Moon is ${formatNumber(absBetaDeg, 1)}\u00b0 above the ecliptic \u2014 too far from a node for an eclipse.`;
  }

  // Near node but wrong phase
  if (nearNode && !nearSyzygy) {
    return "Moon is near a node but not at New/Full \u2014 no alignment.";
  }

  // Wrong phase (general)
  if (!nearSyzygy) {
    const info = state as { phaseAngleDeg: number };
    // Only show if not completely random position
    if (nearestNodeDeg < 40) {
      return "Eclipses require New or Full Moon \u2014 adjust the phase.";
    }
  }

  return "";
}
```

**Step 4: Run tests — verify they pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eclipse-geometry/logic.test.ts`
Expected: All PASS

**Step 5: Wire into main.ts**

In the `render()` function, after computing derived state, add:

```typescript
const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
  earthMoonDistanceKm: state.earthMoonDistanceKm,
});
const ctxMsg = contextualMessage(derived, {
  solarPartialDeg: thresholds.solarPartialDeg,
  lunarPenumbralDeg: thresholds.lunarPenumbralDeg,
});
contextMessageEl.textContent = ctxMsg;
```

**Step 6: Run build + verify**

Run: `corepack pnpm build`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/demos/src/demos/eclipse-geometry/logic.ts apps/demos/src/demos/eclipse-geometry/logic.test.ts apps/demos/src/demos/eclipse-geometry/main.ts
git commit -m "feat(eclipse): add contextual feedback messages [E3]

Pure function contextualMessage() in logic.ts with 7 unit tests.
Provides pedagogical hints: wrong phase, too far from node, almost,
eclipse achieved. Restores legacy's guided discovery UX."
```

---

### Task 3: Node Glow Restoration + Draggable Nodes [E6]

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html` (SVG node elements)

**Step 1: Add node glow CSS**

In `style.css`, update `.stage__node`:

```css
.stage__node {
  fill: var(--cp-accent);
  stroke: none;
  cursor: grab;
  filter: drop-shadow(var(--cp-glow-accent-teal));
  transition: filter 0.2s var(--cp-ease-out);
}
.stage__node:hover,
.stage__node--dragging {
  filter: drop-shadow(0 0 8px var(--cp-accent));
  cursor: grabbing;
}
```

**Step 2: Increase node hit area in SVG**

In `index.html`, change node dot radius from 5 to 8:

```html
<circle id="ascNodeDot" class="stage__node" cx="140" cy="0" r="8" tabindex="0" role="button" aria-label="Ascending node" />
<circle id="descNodeDot" class="stage__node" cx="-140" cy="0" r="8" tabindex="0" role="button" aria-label="Descending node" />
```

**Step 3: Implement node drag handler in main.ts**

Add a drag handler for nodes following the same pattern as `moonDot` drag (lines 1226–1282 of current main.ts). Key differences:
- Dragging one node updates `nodeLonDeg`
- The other node automatically moves to maintain 180deg separation
- Use `svgPointToAngleDeg()` from logic.ts (same function used for moon drag)

```typescript
function setupNodeDrag(nodeEl: SVGCircleElement, isAscending: boolean) {
  let dragging = false;
  const start = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    dragging = true;
    nodeEl.classList.add("stage__node--dragging");
  };
  const move = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    const pt = clientToSvg(e instanceof MouseEvent ? e : e.touches[0]);
    if (!pt) return;
    // Orbit center in SVG coords: orbitPanel translate(40,40) + inner translate(220,180) = (260, 220)
    const angle = svgPointToAngleDeg(260, 220, pt.x, pt.y);
    state.nodeLonDeg = isAscending ? angle : ((angle + 180) % 360);
    render();
  };
  const end = () => {
    dragging = false;
    nodeEl.classList.remove("stage__node--dragging");
  };
  nodeEl.addEventListener("mousedown", start);
  nodeEl.addEventListener("touchstart", start, { passive: false });
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move, { passive: false });
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}
setupNodeDrag(ascNodeDot, true);
setupNodeDrag(descNodeDot, false);
```

**Step 4: Add keyboard support for nodes**

When a node is focused (via `tabindex="0"`), arrow keys adjust longitude:

```typescript
[ascNodeDot, descNodeDot].forEach((el, i) => {
  el.addEventListener("keydown", (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      state.nodeLonDeg = (state.nodeLonDeg + step) % 360;
      render();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      state.nodeLonDeg = (state.nodeLonDeg - step + 360) % 360;
      render();
      e.preventDefault();
    }
  });
});
```

**Step 5: Verify build + manual test**

Run: `corepack pnpm build`
Expected: PASS

**Step 6: Commit**

```bash
git commit -m "feat(eclipse): restore node glow + add draggable nodes [E6]

Nodes now glow teal with drop-shadow, have grab cursor, and are
draggable (mouse + touch + keyboard). Dragging one node moves the
other to maintain 180deg separation. Node slider removed from sidebar."
```

---

### Task 4: Eclipse Window Arc Computation [E1 — Logic]

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.test.ts`

**Step 1: Write failing tests for `eclipseArcExtentDeg()`**

```typescript
describe("eclipseArcExtentDeg", () => {
  // Uses physics model's deltaLambdaFromBetaDeg
  const deltaLambda = (args: { tiltDeg: number; betaDeg: number }) => {
    const { tiltDeg, betaDeg } = args;
    if (tiltDeg === 0) return 180; // full circle
    const ratio = Math.sin(Math.abs(betaDeg) * Math.PI / 180) / Math.abs(Math.sin(tiltDeg * Math.PI / 180));
    if (ratio >= 1) return 0; // no arc
    return Math.asin(ratio) * 180 / Math.PI;
  };

  it("returns ~20 deg half-extent at standard tilt and typical threshold", () => {
    const result = eclipseArcExtentDeg({
      tiltDeg: 5.145,
      thresholdBetaDeg: 1.5,
      deltaLambdaFromBetaDeg: deltaLambda,
    });
    expect(result).toBeCloseTo(19.3, 0); // approximately
  });

  it("returns 180 when tilt is 0 (eclipses everywhere)", () => {
    const result = eclipseArcExtentDeg({
      tiltDeg: 0,
      thresholdBetaDeg: 1.5,
      deltaLambdaFromBetaDeg: deltaLambda,
    });
    expect(result).toBe(180);
  });

  it("returns 0 when tilt is large enough that threshold is never reached", () => {
    const result = eclipseArcExtentDeg({
      tiltDeg: 10,
      thresholdBetaDeg: 0.1, // very tight threshold
      deltaLambdaFromBetaDeg: deltaLambda,
    });
    // sin(0.1) / sin(10) = 0.01 / 0.17 ≈ 0.01, so asin gives ~0.58 deg
    expect(result).toBeLessThan(1);
  });

  it("returns larger arc for larger threshold", () => {
    const small = eclipseArcExtentDeg({ tiltDeg: 5.145, thresholdBetaDeg: 0.6, deltaLambdaFromBetaDeg: deltaLambda });
    const large = eclipseArcExtentDeg({ tiltDeg: 5.145, thresholdBetaDeg: 1.5, deltaLambdaFromBetaDeg: deltaLambda });
    expect(large).toBeGreaterThan(small);
  });
});
```

**Step 2: Run tests — verify they fail**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eclipse-geometry/logic.test.ts`

**Step 3: Implement `eclipseArcExtentDeg()`**

```typescript
export function eclipseArcExtentDeg(args: {
  tiltDeg: number;
  thresholdBetaDeg: number;
  deltaLambdaFromBetaDeg: (a: { tiltDeg: number; betaDeg: number }) => number;
}): number {
  if (args.tiltDeg === 0) return 180; // full circle
  return args.deltaLambdaFromBetaDeg({
    tiltDeg: args.tiltDeg,
    betaDeg: args.thresholdBetaDeg,
  });
}
```

Also add `buildArcPath()` for SVG rendering:

```typescript
export function buildArcPath(args: {
  cx: number;
  cy: number;
  r: number;
  centerAngleDeg: number;
  halfExtentDeg: number;
}): string {
  const { cx, cy, r, centerAngleDeg, halfExtentDeg } = args;
  if (halfExtentDeg >= 180) {
    // Full circle — draw two semicircles
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  }
  if (halfExtentDeg <= 0) return "";
  const startDeg = centerAngleDeg - halfExtentDeg;
  const endDeg = centerAngleDeg + halfExtentDeg;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = halfExtentDeg * 2 > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
```

Add tests for `buildArcPath()` as well (verify path starts with M, contains A, is empty for 0 extent).

**Step 4: Run tests — verify they pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eclipse-geometry/logic.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git commit -m "feat(eclipse): add eclipse arc extent + path logic [E1]

eclipseArcExtentDeg() computes angular half-extent of eclipse windows.
buildArcPath() generates SVG arc d-strings for rendering.
Both use DI for physics callbacks (deltaLambdaFromBetaDeg)."
```

---

### Task 5: Eclipse Window Arc Rendering [E1 — UI]

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html` (add arc path elements to SVG)
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css` (arc styling)
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts` (render arcs)

**Step 1: Add SVG path elements for arcs**

Inside the orbit panel `<g>` (after the orbit circle, before moon dot), add 8 arc path elements matching legacy's 4-tier system:

```html
<!-- Eclipse window arcs (4 tiers x 2 nodes) -->
<path id="arc-solar-any-asc" class="stage__arc stage__arc--solar" d="" />
<path id="arc-solar-central-asc" class="stage__arc stage__arc--solar stage__arc--central" d="" />
<path id="arc-lunar-any-asc" class="stage__arc stage__arc--lunar" d="" />
<path id="arc-lunar-central-asc" class="stage__arc stage__arc--lunar stage__arc--central" d="" />
<path id="arc-solar-any-desc" class="stage__arc stage__arc--solar" d="" />
<path id="arc-solar-central-desc" class="stage__arc stage__arc--solar stage__arc--central" d="" />
<path id="arc-lunar-any-desc" class="stage__arc stage__arc--lunar" d="" />
<path id="arc-lunar-central-desc" class="stage__arc stage__arc--lunar stage__arc--central" d="" />
```

**Step 2: Add arc CSS**

```css
.stage__arc {
  fill: none;
  stroke-width: 6;
  opacity: 0.2;
  pointer-events: none;
}
.stage__arc--solar {
  stroke: var(--cp-accent-rose);
}
.stage__arc--lunar {
  stroke: var(--cp-accent);
}
.stage__arc--central {
  stroke-width: 10;
  opacity: 0.3;
}
.stage__arc--pulse {
  animation: cp-glow-pulse 0.8s ease-out;
}
```

**Step 3: Wire arc rendering in main.ts**

In `renderStage()`, after positioning nodes, compute and set arc paths:

```typescript
function renderArcs() {
  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });
  const dLambda = EclipseGeometryModel.deltaLambdaFromBetaDeg;
  const tilt = state.orbitalTiltDeg;
  const nodeLon = state.nodeLonDeg;
  const descNodeLon = (nodeLon + 180) % 360;
  const R = 140; // orbit radius in SVG

  const arcs = [
    { id: "arc-solar-any-asc", beta: thresholds.solarPartialDeg, center: nodeLon },
    { id: "arc-solar-central-asc", beta: thresholds.solarCentralDeg, center: nodeLon },
    { id: "arc-lunar-any-asc", beta: thresholds.lunarPenumbralDeg, center: nodeLon },
    { id: "arc-lunar-central-asc", beta: thresholds.lunarUmbralDeg, center: nodeLon },
    { id: "arc-solar-any-desc", beta: thresholds.solarPartialDeg, center: descNodeLon },
    { id: "arc-solar-central-desc", beta: thresholds.solarCentralDeg, center: descNodeLon },
    { id: "arc-lunar-any-desc", beta: thresholds.lunarPenumbralDeg, center: descNodeLon },
    { id: "arc-lunar-central-desc", beta: thresholds.lunarUmbralDeg, center: descNodeLon },
  ];

  for (const arc of arcs) {
    const halfExtent = eclipseArcExtentDeg({ tiltDeg: tilt, thresholdBetaDeg: arc.beta, deltaLambdaFromBetaDeg: dLambda });
    const el = document.getElementById(arc.id) as SVGPathElement | null;
    if (el) {
      el.setAttribute("d", buildArcPath({ cx: 0, cy: 0, r: R, centerAngleDeg: arc.center, halfExtentDeg: halfExtent }));
    }
  }
}
```

Call `renderArcs()` at the end of `renderStage()`.

**Step 4: Verify build + visual check**

Run: `corepack pnpm build`
Expected: PASS — arcs visible near nodes, resize when tilt changes

**Step 5: Commit**

```bash
git commit -m "feat(eclipse): render eclipse window arcs on orbit [E1]

8 SVG arc paths (solar/lunar x any/central x asc/desc) drawn
around nodes. Rose arcs for solar, teal for lunar. Central arcs
are thicker and more opaque. Arcs resize dynamically with tilt
and distance changes. At tilt=0, arcs cover full circle."
```

---

### Task 6: Beta Curve Threshold Shading

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html` (add rect elements)
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Add SVG rect elements for threshold bands in beta panel**

Inside the `#betaPanel` group, before the sinusoidal curve:

```html
<!-- Threshold shading bands -->
<rect id="band-solar-partial" class="stage__band stage__band--solar" />
<rect id="band-solar-central" class="stage__band stage__band--solar stage__band--central" />
<rect id="band-lunar-penumbral" class="stage__band stage__band--lunar" />
<!-- Threshold labels -->
<text id="label-solar" class="stage__band-label stage__band-label--solar" text-anchor="end">solar</text>
<text id="label-lunar" class="stage__band-label stage__band-label--lunar" text-anchor="end">lunar</text>
```

**Step 2: Add CSS for bands**

```css
.stage__band {
  opacity: 0.1;
  pointer-events: none;
}
.stage__band--solar { fill: var(--cp-accent-rose); }
.stage__band--central { opacity: 0.18; }
.stage__band--lunar { fill: var(--cp-accent); }
.stage__band-label { font-size: 9px; }
.stage__band-label--solar { fill: var(--cp-accent-rose); opacity: 0.6; }
.stage__band-label--lunar { fill: var(--cp-accent); opacity: 0.6; }
```

**Step 3: Render bands in main.ts**

In `renderStage()`, compute threshold band positions. The beta panel's y-axis maps beta degrees to pixels using `yScale`. Bands are horizontal rects centered on y=0:

```typescript
function renderBands() {
  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });
  // Beta panel: panelX=30, panelWidth=300, panelCenterY=0 (in local coords), yScale from tilt
  const yScale = 140 / state.orbitalTiltDeg; // panelHeight/2 / maxBeta
  const panelWidth = 300;

  const setBand = (id: string, betaDeg: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    const h = betaDeg * yScale * 2;
    el.setAttribute("x", "0");
    el.setAttribute("y", String(-betaDeg * yScale));
    el.setAttribute("width", String(panelWidth));
    el.setAttribute("height", String(h));
  };

  setBand("band-solar-partial", thresholds.solarPartialDeg);
  setBand("band-solar-central", thresholds.solarCentralDeg);
  setBand("band-lunar-penumbral", thresholds.lunarPenumbralDeg);

  // Position labels at right edge
  const setLabel = (id: string, betaDeg: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("x", String(panelWidth + 5));
    el.setAttribute("y", String(-betaDeg * yScale + 3));
  };
  setLabel("label-solar", thresholds.solarPartialDeg);
  setLabel("label-lunar", thresholds.lunarPenumbralDeg);
}
```

Call `renderBands()` in `renderStage()`.

**Step 4: Commit**

```bash
git commit -m "feat(eclipse): add threshold shading bands on beta curve

Horizontal rose bands for solar thresholds, teal for lunar.
Central solar threshold gets darker band. Labels at right edge.
Bands update dynamically when distance preset changes."
```

---

### Task 7: Color-Coded Readout Outcomes [E2]

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Add outcome color CSS**

```css
.cp-readout--solar[data-active="true"] {
  background: color-mix(in srgb, var(--cp-accent-rose) 12%, transparent);
  border-radius: var(--cp-radius-sm);
}
.cp-readout--solar[data-active="true"] .cp-readout__dot {
  background: var(--cp-accent-rose);
}
.cp-readout--lunar[data-active="true"] {
  background: color-mix(in srgb, var(--cp-accent) 12%, transparent);
  border-radius: var(--cp-radius-sm);
}
.cp-readout--lunar[data-active="true"] .cp-readout__dot {
  background: var(--cp-accent);
}
.cp-readout__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cp-text-muted);
  margin-right: 4px;
  vertical-align: middle;
}
```

**Step 2: Wire in main.ts render()**

```typescript
// After computing derived state:
solarReadout.dataset.active = String(derived.solarType !== "none");
lunarReadout.dataset.active = String(derived.lunarType !== "none");
```

**Step 3: Commit**

```bash
git commit -m "feat(eclipse): color-coded readout outcomes [E2]

Solar readout gets rose tint + dot when eclipse active.
Lunar readout gets teal tint + dot. Gray dot for none.
Restores legacy's visual prominence for eclipse outcomes."
```

---

### Task 8: Eclipse Presets Popover

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.test.ts`

**Step 1: Add tests for preset state functions**

```typescript
describe("eclipsePresets", () => {
  it("totalSolarPreset sets moon to New and node to sun direction", () => {
    const p = totalSolarPreset({ sunLonDeg: 0 });
    expect(p.moonLonDeg).toBe(0); // New Moon = same as Sun
    expect(p.nodeLonDeg).toBe(0); // Node at Sun direction
  });

  it("lunarEclipsePreset sets moon to Full and node aligned", () => {
    const p = lunarEclipsePreset({ sunLonDeg: 0 });
    expect(p.moonLonDeg).toBe(180); // Full Moon = opposite Sun
    expect(p.nodeLonDeg).toBe(0);  // Node at Sun direction
  });

  it("noEclipsePreset sets moon far from nodes", () => {
    const p = noEclipsePreset({ sunLonDeg: 0, nodeLonDeg: 0 });
    expect(p.moonLonDeg).toBe(90); // 90 deg from both nodes
  });
});
```

**Step 2: Implement presets in logic.ts**

```typescript
export function totalSolarPreset(args: { sunLonDeg: number }) {
  return { moonLonDeg: args.sunLonDeg, nodeLonDeg: args.sunLonDeg };
}

export function lunarEclipsePreset(args: { sunLonDeg: number }) {
  return { moonLonDeg: (args.sunLonDeg + 180) % 360, nodeLonDeg: args.sunLonDeg };
}

export function noEclipsePreset(args: { sunLonDeg: number; nodeLonDeg: number }) {
  return { moonLonDeg: (args.nodeLonDeg + 90) % 360 };
}
```

**Step 3: Add popover HTML in sidebar**

```html
<div class="cp-popover-anchor">
  <button id="presetsBtn" class="cp-button cp-button--ghost cp-popover-trigger"
    type="button" aria-expanded="false" aria-controls="presetsPopover">
    Show me an eclipse...
  </button>
  <div class="cp-popover" id="presetsPopover" hidden>
    <div class="cp-popover__body">
      <button class="cp-popover-link" id="presetTotalSolar" type="button">Total solar eclipse</button>
      <button class="cp-popover-link" id="presetLunar" type="button">Lunar eclipse</button>
      <button class="cp-popover-link" id="presetNoEclipse" type="button">No eclipse (for comparison)</button>
      <button class="cp-popover-link" id="presetSeason" type="button">Eclipse season (animate)</button>
    </div>
  </div>
</div>
```

**Step 4: Wire click handlers in main.ts**

Each preset button sets state and calls `render()`. "Eclipse season" triggers animate-month starting near a node.

**Step 5: Commit**

```bash
git commit -m "feat(eclipse): add eclipse presets popover

'Show me an eclipse...' button with 4 presets:
total solar, lunar, no eclipse, eclipse season.
Presets snap moon+nodes to produce target outcome."
```

---

### Task 9: Simulation Output Upgrade [E4, E5]

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/logic.test.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/index.html` (shelf sim tab)
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`

**Step 1: Add `formatSimTable()` function to logic.ts**

Replace `formatSimSummary()` with `formatSimTable()` that returns structured data:

```typescript
export type SimTableRow = { year: number; type: string; details: string; category: "solar" | "lunar" };

export function formatSimTable(sim: SimState, tropicalYearDays: number): {
  rows: SimTableRow[];
  summary: { solarCount: number; lunarCount: number; years: number };
} {
  // ... extract from existing formatSimSummary logic
}
```

**Step 2: Render as HTML table in main.ts**

Replace the `<pre>` output with a dynamically generated `<table>`:

```typescript
function renderSimTable(data: ReturnType<typeof formatSimTable>) {
  const { rows, summary } = data;
  // Build summary bar
  // Build table rows with data-category="solar"|"lunar" for CSS coloring
  // Append to sim output container
}
```

**Step 3: Add CSS for table rows**

```css
.sim-table tr[data-category="solar"] td { color: var(--cp-accent-rose); }
.sim-table tr[data-category="lunar"] td { color: var(--cp-accent); }
.sim-summary { display: flex; gap: var(--cp-space-4); padding: var(--cp-space-2); }
.sim-summary__stat { font-family: var(--cp-font-mono); }
```

**Step 4: Commit**

```bash
git commit -m "feat(eclipse): upgrade simulation output to styled table [E4,E5]

Color-coded table rows: rose for solar, teal for lunar eclipses.
Summary stats bar above table. Scrollable container.
Replaces plain <pre> text block."
```

---

### Task 10: Visual Rewards

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/style.css`
- Modify: `apps/demos/src/demos/eclipse-geometry/main.ts`

**Step 1: Add floating label element in SVG**

```html
<text id="eclipseLabel" class="stage__eclipse-label" x="0" y="0" text-anchor="middle" opacity="0"></text>
```

**Step 2: Add CSS animation**

```css
.stage__eclipse-label {
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
}
.stage__eclipse-label--solar { fill: var(--cp-accent-rose); }
.stage__eclipse-label--lunar { fill: var(--cp-accent); }
.stage__eclipse-label--active {
  animation: eclipseReveal 2s ease-out forwards;
}
@keyframes eclipseReveal {
  0% { opacity: 1; transform: translateY(0); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-20px); }
}
```

**Step 3: Trigger in render() when eclipse state changes**

Track previous eclipse state. When transitioning from none to eclipse, show floating label near moon dot and pulse the relevant arc.

**Step 4: Commit**

```bash
git commit -m "feat(eclipse): add visual reward system for eclipse discovery

Floating label appears near Moon: 'Solar eclipse!' or 'Lunar eclipse!'
Label fades after 2 seconds. Relevant arc pulses briefly.
Readout strip outcome transitions from gray to colored."
```

---

### Task 11: Update Design Contract Tests

**Files:**
- Modify: `apps/demos/src/demos/eclipse-geometry/design-contracts.test.ts`

**Step 1: Update tests for new layout structure**

Changes needed:
- "readouts aside exists" → check for `.cp-readout-strip` instead
- "controls aside" → check for `.cp-demo__sidebar`
- "no data-shell='triad'" → verify no `data-shell` attribute
- Add test: "shelf tabs exist" — verify 3 tab buttons + 3 tab panels
- Add test: "eclipse arcs exist" — verify 8 arc path elements
- Add test: "contextual message element exists"
- Add test: "readout strip has 6 items"
- Add test: "solar/lunar readouts have dot indicators"
- Remove tests that assert triad-specific structure

**Step 2: Run all contract tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eclipse-geometry/design-contracts.test.ts`
Expected: All PASS

**Step 3: Commit**

```bash
git commit -m "test(eclipse): update contract tests for new layout

Contracts now verify moon-phases layout shell, readout strip,
shelf tabs, eclipse arcs, contextual message element.
Removed triad-specific assertions."
```

---

### Task 12: Update E2E Tests

**Files:**
- Modify: `apps/site/tests/eclipse-geometry.spec.ts`

**Step 1: Update selectors for new layout**

Replace triad-specific selectors:
- `.cp-demo__controls` → `.cp-demo__sidebar`
- `.cp-demo__readouts` → `.cp-readout-strip`
- Readout value locators update for new structure
- Add tests for new features: arc visibility, presets, contextual messages

**Step 2: Run E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "eclipse"`
Expected: All PASS (with updated selectors)

**Step 3: Commit**

```bash
git commit -m "test(eclipse): update E2E tests for new layout + features

Updated selectors for moon-phases layout shell.
Added tests: eclipse arcs visible, presets work,
contextual messages appear, simulation table renders."
```

---

### Task 13: Physics Review

**Step 1: Dispatch a physics review agent**

The review must trace the full chain for:
1. **Draggable node coordinates:** SVG drag → `svgPointToAngleDeg()` → `state.nodeLonDeg` → `renderStage()` node positioning → arc positioning. Verify no sign/convention bugs.
2. **Eclipse arc extent:** `eclipseThresholdsDeg()` → `deltaLambdaFromBetaDeg()` → `eclipseArcExtentDeg()` → `buildArcPath()` → SVG rendering. Verify arcs are correctly centered on nodes and correctly sized.
3. **Contextual message thresholds:** Verify `solarPartialDeg` and `lunarPenumbralDeg` are correctly passed and compared.

**Step 2: Fix any issues found**

**Step 3: Run full test suite**

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C packages/theme test -- --run
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

All must pass.

**Step 4: Commit any fixes**

```bash
git commit -m "fix(eclipse): address physics review findings"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] Layout is moon-phases style (sidebar + stage + readout strip + shelf)
- [ ] No `data-shell="triad"` attribute
- [ ] Node slider removed from sidebar
- [ ] Nodes are draggable (mouse + touch + keyboard)
- [ ] Nodes glow teal with drop-shadow
- [ ] 8 eclipse window arcs visible near nodes
- [ ] Arcs resize when tilt or distance changes
- [ ] Arcs cover full circle when tilt = 0
- [ ] Beta curve has threshold shading bands
- [ ] Readout strip is horizontal with 6 items
- [ ] Solar outcome turns rose when eclipse active
- [ ] Lunar outcome turns teal when eclipse active
- [ ] Contextual message appears below readout strip
- [ ] "Show me an eclipse..." popover works
- [ ] Simulation output is a color-coded table
- [ ] Floating label appears on eclipse discovery
- [ ] All contract tests pass
- [ ] All logic tests pass
- [ ] All E2E tests pass
- [ ] Full build succeeds
- [ ] Physics review complete
