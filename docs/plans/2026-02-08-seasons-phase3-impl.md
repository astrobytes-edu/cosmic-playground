# Seasons Phase 3: Visual Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore 9 lost visual features (S1–S9) from the legacy demo, migrate to the moon-phases 5-zone layout, and add a new day-length arc — making the seasons demo feel polished and pedagogically complete.

**Architecture:** Layout migrates from `data-shell="triad"` (4-zone: controls + stage + readouts + drawer) to the moon-phases pattern (5-zone: sidebar + stage + readout-strip + context-message + shelf). All new rendering logic goes in `logic.ts` as pure functions with unit tests. `main.ts` is thin DOM wiring. No physics model changes.

**Tech Stack:** HTML/CSS/SVG, TypeScript, Vitest (unit), Playwright (E2E), `@cosmic/physics` (SeasonsModel), `@cosmic/theme` (design tokens)

---

## Current State

- **Layout:** `data-shell="triad"` with `.cp-demo__controls`, `.cp-demo__stage`, `.cp-demo__readouts` (panel), `.cp-demo__drawer` (accordion)
- **SVG viewBox:** `0 0 920 420` — orbit panel at `translate(40,40)` center `(180,170)` r=140; globe at `translate(670,210)` r=155
- **Tests:** 33 contract + 94 logic = 127 unit tests; 37+2 E2E tests
- **Missing features (S1–S9):** Season color coding, Polaris, sunlight rays, season labels, distance line, lat band colors, misconception content, hour angle grid, aphelion marker

## Target State

- **Layout:** Moon-phases 5-zone: `.cp-demo__sidebar` + `.cp-demo__stage` + `.cp-readout-strip.cp-demo__readouts` + `.cp-context-message` + `.cp-demo__shelf`
- **SVG viewBox:** `0 0 920 420` (unchanged) — orbit panel 35% width (~320px), globe 65% width (~600px, r~175)
- **All S1–S9 features restored** + new day-length arc on globe
- **Overlays in shelf tab** (not sidebar)

---

### Task 1: Layout Migration — HTML Shell

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`

**What to change in HTML:**

**Step 1:** Change the root layout attributes:
- Remove `data-shell="triad"` from `#cp-demo`
- Change `.cp-demo__controls` → `.cp-demo__sidebar` (keep `cp-panel` class)
- Keep `aria-label="Controls panel"` unchanged

**Step 2:** Add contextual message area (after the stage, before readouts):
```html
<p class="cp-context-message" id="contextMessage" aria-live="polite"></p>
```

**Step 3:** Replace the readouts panel with a readout strip:
- Remove `<aside class="cp-demo__readouts cp-panel">` wrapper
- Replace with:
```html
<div class="cp-readout-strip cp-demo__readouts" aria-label="Readouts">
  <div class="cp-readout">
    <span class="cp-readout__label">Season (N/S)</span>
    <span class="cp-readout__value">
      <span id="seasonNorthValue"></span>
      <span class="cp-muted"> / </span>
      <span id="seasonSouthValue"></span>
    </span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">Day length</span>
    <span class="cp-readout__value"><span id="dayLengthValue"></span></span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">Noon altitude</span>
    <span class="cp-readout__value"><span id="noonAltitudeValue"></span> <span class="cp-readout__unit">deg</span></span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">Declination</span>
    <span class="cp-readout__value"><span id="declinationValue"></span> <span class="cp-readout__unit">deg</span></span>
  </div>
  <div class="cp-readout">
    <span class="cp-readout__label">Distance</span>
    <span class="cp-readout__value"><span id="distanceAuValue"></span> <span class="cp-readout__unit">AU</span></span>
  </div>
</div>
```
Note: Season readout moves to first position (most prominent). Distance readout moves to last (least prominent). Remove KaTeX math from readout labels — readout strip uses plain text.

**Step 4:** Replace accordion drawer with tabbed shelf:
```html
<section class="cp-demo__shelf" aria-label="Information panels">
  <div class="cp-tabs-container">
    <div class="cp-tabs" role="tablist" aria-label="Demo information">
      <button class="cp-tab cp-tab--active" role="tab" aria-selected="true"
              aria-controls="tab-notice" id="tab-btn-notice">What to notice</button>
      <button class="cp-tab" role="tab" aria-selected="false"
              aria-controls="tab-model" id="tab-btn-model">Model notes</button>
      <button class="cp-tab" role="tab" aria-selected="false"
              aria-controls="tab-overlays" id="tab-btn-overlays">Overlays</button>
    </div>
    <div class="cp-tab-panel" role="tabpanel" id="tab-notice" aria-labelledby="tab-btn-notice">
      <!-- S7 misconception content goes here (Task 8) -->
      <ul>
        <li>Day length and sun angle change with date and hemisphere.</li>
        <li>Tilt drives seasons even if distance stayed constant.</li>
      </ul>
    </div>
    <div class="cp-tab-panel" role="tabpanel" id="tab-model" aria-labelledby="tab-btn-model" hidden>
      <ul>
        <li>Declination uses a simplified geometry...</li>
        <li>Earth-Sun distance uses a first-order eccentric model...</li>
        <li>Key idea: opposite hemispheres have opposite seasons.</li>
      </ul>
    </div>
    <div class="cp-tab-panel" role="tabpanel" id="tab-overlays" aria-labelledby="tab-btn-overlays" hidden>
      <!-- Overlay toggles move here from sidebar (Task 9) -->
    </div>
  </div>
</section>
```

**Step 5:** Move overlay toggles from sidebar to the overlays tab panel. Remove the `<fieldset>` from the sidebar. Place it inside `#tab-overlays`.

**Step 6:** Update CSS — add entry animations for new layout zones:
```css
.cp-demo__sidebar {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
}
.cp-demo__stage {
  animation: cp-fade-in var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 1);
}
.cp-demo__readouts {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 2);
}
.cp-context-message {
  grid-area: context;  /* Note: this needs a grid-template update OR just place between readouts and shelf */
  text-align: center;
  padding: 0 var(--cp-space-4);
  min-height: 1.5em;
  animation: cp-fade-in var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 2);
}
.cp-demo__shelf {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 3);
}
```

Remove old `.cp-demo__controls` and `.cp-demo__drawer` animation rules from style.css.

**Step 7:** In `main.ts`, update element queries:
- Change `.cp-demo__controls .cp-panel-body` to `.cp-demo__sidebar .cp-panel-body` in `getControlsBody()`
- Add tab switching logic (copy pattern from eclipse-geometry `switchTab()`)
- Wire overlay toggles (they still work the same, just moved to shelf)
- Add `contextMessageEl` query

**Step 8:** Verify build passes:
```bash
corepack pnpm build
```

**Step 9:** Commit:
```bash
git add apps/demos/src/demos/seasons/index.html apps/demos/src/demos/seasons/style.css apps/demos/src/demos/seasons/main.ts
git commit -m "feat(seasons): migrate to moon-phases 5-zone layout shell"
```

---

### Task 2: Orbit Panel — Season Labels + Perihelion/Aphelion [S4, S9]

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts`
- Modify: `apps/demos/src/demos/seasons/logic.test.ts`
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1:** Write failing tests in `logic.test.ts`:
```ts
describe("orbitSeasonLabelPositions", () => {
  it("returns 4 labels at 90-degree intervals", () => {
    const labels = orbitSeasonLabelPositions(140, 180, 170);
    expect(labels).toHaveLength(4);
    expect(labels[0].label).toBe("Mar");
    expect(labels[1].label).toBe("Jun");
    expect(labels[2].label).toBe("Sep");
    expect(labels[3].label).toBe("Dec");
  });

  it("places Mar at 0 rad (right, perihelion side)", () => {
    const labels = orbitSeasonLabelPositions(140, 0, 0);
    // Mar equinox is at angle 0 (right side) — x should be positive, y near 0
    expect(labels[0].x).toBeCloseTo(140, 0);
    expect(labels[0].y).toBeCloseTo(0, 0);
  });
});

describe("perihelionAphelionMarkers", () => {
  it("returns two markers with correct labels", () => {
    const markers = perihelionAphelionMarkers(140, 0, 0);
    expect(markers).toHaveLength(2);
    expect(markers[0].label).toMatch(/peri/i);
    expect(markers[1].label).toMatch(/aph/i);
  });
});
```

**Step 2:** Run tests to verify they fail:
```bash
corepack pnpm -C apps/demos test -- --run src/demos/seasons/logic.test.ts
```

**Step 3:** Implement in `logic.ts`:

```ts
export interface OrbitLabel {
  x: number;
  y: number;
  label: string;
  textAnchor: "start" | "middle" | "end";
}

/**
 * Season label positions around the orbit.
 * Uses the same angle convention as orbitPosition (0 = right = perihelion direction).
 * March equinox ≈ 77 days after perihelion → ~76° ahead.
 * Labels are placed just outside the orbit circle.
 */
export function orbitSeasonLabelPositions(
  orbitR: number,
  centerX: number,
  centerY: number,
): OrbitLabel[] {
  // Angles in radians from perihelion (0 = right)
  // March equinox (day 80) is ~77 days after perihelion (day 3)
  // At 0.9856 deg/day → ~76° → 1.326 rad
  const MAR_ANGLE = (77 / 365.25) * 2 * Math.PI;
  const labelR = orbitR + 18; // outside orbit
  const seasons: { label: string; offsetQuarter: number }[] = [
    { label: "Mar", offsetQuarter: 0 },
    { label: "Jun", offsetQuarter: 1 },
    { label: "Sep", offsetQuarter: 2 },
    { label: "Dec", offsetQuarter: 3 },
  ];

  return seasons.map(({ label, offsetQuarter }) => {
    const angle = MAR_ANGLE + (offsetQuarter * Math.PI) / 2;
    const x = centerX + labelR * Math.cos(angle);
    const y = centerY + labelR * Math.sin(angle);
    // Text anchor based on horizontal position
    const cos = Math.cos(angle);
    const textAnchor: "start" | "middle" | "end" =
      cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
    return { x, y, label, textAnchor };
  });
}

export interface OrbitMarker {
  x: number;
  y: number;
  label: string;
}

/**
 * Perihelion (angle=0, right side) and aphelion (angle=pi, left side) markers.
 */
export function perihelionAphelionMarkers(
  orbitR: number,
  centerX: number,
  centerY: number,
): OrbitMarker[] {
  return [
    { x: centerX + orbitR, y: centerY, label: "Peri (Jan)" },
    { x: centerX - orbitR, y: centerY, label: "Aph (Jul)" },
  ];
}
```

**Step 4:** Run tests to verify they pass.

**Step 5:** Add SVG elements to `index.html` inside the orbit panel `<g transform="translate(180, 170)">`:
```html
<!-- Season labels (positioned by JS) -->
<text id="seasonLabel-Mar" class="stage__seasonLabel"></text>
<text id="seasonLabel-Jun" class="stage__seasonLabel"></text>
<text id="seasonLabel-Sep" class="stage__seasonLabel"></text>
<text id="seasonLabel-Dec" class="stage__seasonLabel"></text>

<!-- Aphelion marker (perihelion marker already exists) -->
<circle class="stage__marker" cx="-140" cy="0" r="4" />
<text class="stage__markerLabel" x="-140" y="-12" text-anchor="middle">aph</text>
```

Also update the existing perihelion marker label from `peri` to `Peri (Jan)` — or keep short: just add aphelion with `aph` label, change perihelion text from `peri` → `Peri`.

**Step 6:** Add CSS:
```css
.stage__seasonLabel {
  fill: var(--cp-muted);
  font-size: 11px;
  opacity: 0.7;
}
```

**Step 7:** In `main.ts`, add rendering call in `renderStage()` to position season labels dynamically (OR position them statically in HTML since orbit panel geometry doesn't change). Static is simpler — just hardcode positions in HTML.

Actually, since orbit center and radius are fixed constants, we can just hardcode the SVG positions. But let's use the logic function to compute them once at init time.

**Step 8:** Commit:
```bash
git commit -m "feat(seasons): add season labels + aphelion marker to orbit panel [S4,S9]"
```

---

### Task 3: Orbit Panel — Distance Line + Polaris Axis [S5, S2]

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts`
- Modify: `apps/demos/src/demos/seasons/logic.test.ts`
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1:** Write failing tests:
```ts
describe("distanceLineEndpoints", () => {
  it("returns line from sun (0,0) to earth position", () => {
    const line = distanceLineEndpoints(140, 0, 0);
    expect(line.x1).toBe(0);
    expect(line.y1).toBe(0);
    expect(line.x2).toBeCloseTo(140, 0);
    expect(line.y2).toBeCloseTo(0, 0);
  });
});

describe("polarisIndicator", () => {
  it("returns axis arrow pointing away from earth at tilt angle", () => {
    const result = polarisIndicator(23.5, 0, 0, 30);
    // Polaris line extends from Earth position
    expect(result.x2).not.toBe(0);
    expect(result.y2).not.toBe(0);
  });
});
```

**Step 2:** Run tests to verify fail.

**Step 3:** Implement in `logic.ts`:

The distance line is simple: from sun center (0,0) to Earth position.
The Polaris axis indicator is an arrow extending from Earth's position in the direction opposite to the tilt axis (pointing to celestial north pole).

```ts
/** Distance line from Sun to Earth's current position. */
export function distanceLineEndpoints(
  earthX: number,
  earthY: number,
): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: 0, y1: 0, x2: earthX, y2: earthY };
}

/**
 * Polaris axis indicator extending from Earth position.
 * In the orbit view (top-down, north pole looking down), the axis
 * points "up" out of the screen, but we show it as a short line
 * tilted from vertical by the axial tilt. The tilt direction rotates
 * with orbit position — at Mar equinox the axis tilts right/left of
 * the sun direction.
 *
 * For a schematic orbit view, we show a fixed upward arrow from Earth
 * with a slight tilt to indicate the axis isn't perpendicular to the orbit.
 */
export function polarisIndicatorEndpoints(
  axialTiltDeg: number,
  earthX: number,
  earthY: number,
  length: number,
): { x2: number; y2: number } {
  // In the orbit plane view, the axis projected onto the plane
  // appears as a line tilted by the axial tilt from the normal.
  // For simplicity: always point "up" (negative y) with a slight x offset.
  const tiltRad = (axialTiltDeg * Math.PI) / 180;
  return {
    x2: earthX + length * Math.sin(tiltRad),
    y2: earthY - length * Math.cos(tiltRad),
  };
}
```

Wait — the legacy demo shows a fixed red arrow from Earth pointing toward Polaris. In a top-down orbit view, the Earth's rotation axis points out of the plane (toward the viewer). The projected axis in the orbit plane always points roughly "up" in the SVG, tilted by ε from the ecliptic normal. This is the same `axisEndpoint()` function already in logic.ts!

So we reuse `axisEndpoint(tiltDeg, length)` which gives `{x, y}` relative to Earth. We draw a line from Earth to Earth + that offset.

**Step 4:** Add SVG elements in orbit panel:
```html
<!-- Distance line from Sun to Earth -->
<line id="distanceLine" class="stage__distanceLine" x1="0" y1="0" x2="140" y2="0" />

<!-- Polaris axis indicator from Earth -->
<g id="polarisGroup">
  <line id="polarisAxis" class="stage__polarisAxis" />
  <text id="polarisLabel" class="stage__polarisLabel">Polaris</text>
</g>
```

**Step 5:** Add CSS:
```css
.stage__distanceLine {
  stroke: color-mix(in srgb, var(--cp-muted) 40%, transparent);
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}

.stage__polarisAxis {
  stroke: var(--cp-accent-rose);
  stroke-width: 2;
  stroke-linecap: round;
}

.stage__polarisLabel {
  fill: var(--cp-accent-rose);
  font-size: 10px;
}
```

**Step 6:** In `main.ts` `renderStage()`, update distance line endpoints to match Earth position, and Polaris axis:
```ts
const axisEnd = axisEndpoint(args.axialTiltDeg, 30);
polarisAxis.setAttribute("x1", formatNumber(x, 2));
polarisAxis.setAttribute("y1", formatNumber(y, 2));
polarisAxis.setAttribute("x2", formatNumber(x + axisEnd.x, 2));
polarisAxis.setAttribute("y2", formatNumber(y + axisEnd.y, 2));
polarisLabel.setAttribute("x", formatNumber(x + axisEnd.x + 5, 2));
polarisLabel.setAttribute("y", formatNumber(y + axisEnd.y - 5, 2));

distanceLine.setAttribute("x2", formatNumber(x, 2));
distanceLine.setAttribute("y2", formatNumber(y, 2));
```

**Step 7:** Run tests and verify build.

**Step 8:** Commit:
```bash
git commit -m "feat(seasons): add distance line + Polaris axis to orbit panel [S5,S2]"
```

---

### Task 4: Globe — Color-Differentiated Latitude Bands [S6]

**Files:**
- Modify: `apps/demos/src/demos/seasons/style.css`

This is a CSS-only change. The legacy demo used distinct colors:
- Equator: green (solid, thicker)
- Tropics (Cancer/Capricorn): gold (dashed)
- Arctic/Antarctic circles: blue/ice (dashed)

**Step 1:** Update CSS for latitude band classes:
```css
.stage__lat-band--equator {
  stroke: color-mix(in srgb, var(--cp-accent-green) 70%, transparent);
  stroke-width: 1.5;
}

.stage__lat-band--tropic {
  stroke: color-mix(in srgb, var(--cp-accent-amber) 60%, transparent);
  stroke-width: 1;
  stroke-dasharray: 6 4;
}

.stage__lat-band--arctic {
  stroke: color-mix(in srgb, var(--cp-accent-ice) 50%, transparent);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}
```

Remove the generic `.stage__lat-band` stroke that currently colors all bands the same muted orbit color.

**Step 2:** Verify build and visual result.

**Step 3:** Commit:
```bash
git commit -m "feat(seasons): color-differentiate latitude bands (green/amber/ice) [S6]"
```

---

### Task 5: Globe — Sunlight Rays [S3]

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`

**Step 1:** Add 5 sunlight ray lines in the globe `<g>` (inside the globe group, before the clip-path group). These are horizontal lines coming from the left:

```html
<!-- Sunlight rays from left [S3] -->
<g id="sunlightRays" class="stage__sunlightRays">
  <line x1="-250" y1="-120" x2="-160" y2="-120" class="stage__ray" />
  <line x1="-250" y1="-60" x2="-160" y2="-60" class="stage__ray" />
  <line x1="-250" y1="0" x2="-160" y2="0" class="stage__ray" />
  <line x1="-250" y1="60" x2="-160" y2="60" class="stage__ray" />
  <line x1="-250" y1="120" x2="-160" y2="120" class="stage__ray" />
  <text class="stage__rayLabel" x="-245" y="-140">Sunlight</text>
</g>
```

Note: The globe is centered at `translate(670, 210)` with r=155. Rays come from outside the globe on the left. x1=-250 is ~95px left of the globe edge. x2=-160 is just at the globe edge (-155).

**Step 2:** The `.stage__ray` CSS already exists in style.css:
```css
.stage__ray {
  fill: none;
  stroke: var(--cp-celestial-sun);
  stroke-opacity: 0.75;
  stroke-width: 3px;
  stroke-linecap: round;
}
```

Add ray label style:
```css
.stage__rayLabel {
  fill: var(--cp-celestial-sun);
  font-size: 11px;
  opacity: 0.65;
}
```

**Step 3:** Add sunlight rays to overlay toggles (default: ON). Add to the overlays record in `main.ts`:
```ts
"sunlight-rays": [sunlightRaysGroup],
```

Add overlay chip button in the overlays tab:
```html
<button class="cp-chip" type="button" aria-pressed="true" data-overlay="sunlight-rays">Sunlight</button>
```

**Step 4:** Commit:
```bash
git commit -m "feat(seasons): add sunlight rays to globe view [S3]"
```

---

### Task 6: Globe — Day-Length Arc (NEW)

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts`
- Modify: `apps/demos/src/demos/seasons/logic.test.ts`
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/style.css`
- Modify: `apps/demos/src/demos/seasons/main.ts`

The day-length arc is a NEW feature (not in legacy). It shows a colored arc at the observer's latitude on the globe, split into a "day" (amber) portion and "night" (dark) portion. This makes day length *visible* on the globe.

**Step 1:** Write failing tests:
```ts
describe("dayLengthArcGeometry", () => {
  it("returns day arc and night arc paths", () => {
    const result = dayLengthArcGeometry({
      latitudeDeg: 40,
      dayLengthHours: 14.5,
      globeRadius: 155,
      tiltDeg: 23.5,
    });
    expect(result.dayArcD).toMatch(/^M/); // valid SVG path
    expect(result.nightArcD).toMatch(/^M/);
  });

  it("12h day produces symmetric arcs", () => {
    const result = dayLengthArcGeometry({
      latitudeDeg: 0,
      dayLengthHours: 12,
      globeRadius: 155,
      tiltDeg: 23.5,
    });
    // Day and night arcs should be roughly the same length
    expect(result.dayFraction).toBeCloseTo(0.5, 1);
  });

  it("24h daylight (polar day) gives full circle for day arc", () => {
    const result = dayLengthArcGeometry({
      latitudeDeg: 70,
      dayLengthHours: 24,
      globeRadius: 155,
      tiltDeg: 23.5,
    });
    expect(result.dayFraction).toBe(1);
  });

  it("0h daylight (polar night) gives full circle for night arc", () => {
    const result = dayLengthArcGeometry({
      latitudeDeg: 70,
      dayLengthHours: 0,
      globeRadius: 155,
      tiltDeg: 23.5,
    });
    expect(result.dayFraction).toBe(0);
  });
});
```

**Step 2:** Run tests to verify fail.

**Step 3:** Implement `dayLengthArcGeometry` in `logic.ts`:

The arc is drawn at the observer's latitude band on the globe. It's an ellipse arc (same projection as the latitude band). The "day" portion is the fraction of the circle that's on the lit (sun-facing) side.

```ts
export interface DayLengthArc {
  dayArcD: string;    // SVG path for the lit portion
  nightArcD: string;  // SVG path for the dark portion
  dayFraction: number; // 0 to 1
}

export function dayLengthArcGeometry(args: {
  latitudeDeg: number;
  dayLengthHours: number;
  globeRadius: number;
  tiltDeg: number;
}): DayLengthArc {
  const { latitudeDeg, dayLengthHours, globeRadius, tiltDeg } = args;
  const dayFraction = clamp(dayLengthHours / 24, 0, 1);

  // Get the latitude band ellipse parameters
  const band = latitudeBandEllipse(latitudeDeg, tiltDeg, 0, 0, globeRadius);
  const { rx, ry, cy } = band;

  if (dayFraction >= 1) {
    // Full day — draw full ellipse as day arc, empty night arc
    return {
      dayArcD: `M ${-rx} ${cy} A ${rx} ${Math.abs(ry)} 0 1 1 ${rx} ${cy} A ${rx} ${Math.abs(ry)} 0 1 1 ${-rx} ${cy}`,
      nightArcD: "",
      dayFraction: 1,
    };
  }
  if (dayFraction <= 0) {
    return {
      dayArcD: "",
      nightArcD: `M ${-rx} ${cy} A ${rx} ${Math.abs(ry)} 0 1 1 ${rx} ${cy} A ${rx} ${Math.abs(ry)} 0 1 1 ${-rx} ${cy}`,
      dayFraction: 0,
    };
  }

  // The day arc spans dayFraction * 360 degrees, centered on the lit side (left = sun side).
  // Lit side is centered at angle π (left), since sunlight comes from the left.
  const halfDayAngle = dayFraction * Math.PI; // in radians, half of the day arc

  // Start and end angles of the day arc (on the ellipse, angle from 3 o'clock CW)
  const dayStartAngle = Math.PI - halfDayAngle;
  const dayEndAngle = Math.PI + halfDayAngle;

  const ellipsePoint = (angle: number) => ({
    x: rx * Math.cos(angle),
    y: cy + Math.abs(ry) * Math.sin(angle),
  });

  const dayStart = ellipsePoint(dayStartAngle);
  const dayEnd = ellipsePoint(dayEndAngle);
  const largeArcDay = dayFraction > 0.5 ? 1 : 0;
  const largeArcNight = dayFraction < 0.5 ? 1 : 0;

  const absRy = Math.abs(ry);
  const dayArcD = `M ${dayStart.x.toFixed(2)} ${dayStart.y.toFixed(2)} A ${rx.toFixed(2)} ${absRy.toFixed(2)} 0 ${largeArcDay} 1 ${dayEnd.x.toFixed(2)} ${dayEnd.y.toFixed(2)}`;
  const nightArcD = `M ${dayEnd.x.toFixed(2)} ${dayEnd.y.toFixed(2)} A ${rx.toFixed(2)} ${absRy.toFixed(2)} 0 ${largeArcNight} 1 ${dayStart.x.toFixed(2)} ${dayStart.y.toFixed(2)}`;

  return { dayArcD, nightArcD, dayFraction };
}
```

**Step 4:** Run tests to verify pass.

**Step 5:** Add SVG elements in the globe group (inside clip-path, after latitude bands):
```html
<!-- Day-length arc at observer's latitude -->
<path id="dayArc" class="stage__dayArc stage__dayArc--day" />
<path id="nightArc" class="stage__dayArc stage__dayArc--night" />
```

**Step 6:** Add CSS:
```css
.stage__dayArc {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}
.stage__dayArc--day {
  stroke: var(--cp-accent-amber);
  opacity: 0.7;
}
.stage__dayArc--night {
  stroke: color-mix(in srgb, var(--cp-bg0) 70%, transparent);
  opacity: 0.5;
}
```

**Step 7:** In `main.ts` `renderGlobe()`, call `dayLengthArcGeometry()` and set the path `d` attributes:
```ts
const dayArc = dayLengthArcGeometry({
  latitudeDeg: args.latitudeDeg,
  dayLengthHours: dayLengthHoursValue,
  globeRadius: GLOBE_R,
  tiltDeg: args.axialTiltDeg,
});
dayArcEl.setAttribute("d", dayArc.dayArcD);
nightArcEl.setAttribute("d", dayArc.nightArcD);
```

Need to pass `dayLengthHours` into `renderGlobe` (or into `renderStage` which calls `renderGlobe`).

**Step 8:** Add day-length arc toggle to overlay chips:
```html
<button class="cp-chip" type="button" aria-pressed="true" data-overlay="day-arc">Day arc</button>
```

And in `main.ts` overlay targets:
```ts
"day-arc": [dayArcEl, nightArcEl],
```

**Step 9:** Commit:
```bash
git commit -m "feat(seasons): add day-length arc on globe (amber day / dark night)"
```

---

### Task 7: Season Readout Color Coding [S1]

**Files:**
- Modify: `apps/demos/src/demos/seasons/logic.ts`
- Modify: `apps/demos/src/demos/seasons/logic.test.ts`
- Modify: `apps/demos/src/demos/seasons/style.css`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1:** Write failing test:
```ts
describe("seasonColorClass", () => {
  it("returns 'season--summer' for Summer", () => {
    expect(seasonColorClass("Summer")).toBe("season--summer");
  });
  it("returns 'season--winter' for Winter", () => {
    expect(seasonColorClass("Winter")).toBe("season--winter");
  });
  it("returns 'season--spring' for Spring", () => {
    expect(seasonColorClass("Spring")).toBe("season--spring");
  });
  it("returns 'season--autumn' for Autumn", () => {
    expect(seasonColorClass("Autumn")).toBe("season--autumn");
  });
});
```

**Step 2:** Run tests to verify fail.

**Step 3:** Implement in `logic.ts`:
```ts
export function seasonColorClass(season: Season): string {
  switch (season) {
    case "Summer": return "season--summer";
    case "Winter": return "season--winter";
    case "Spring": return "season--spring";
    case "Autumn": return "season--autumn";
  }
}
```

**Step 4:** Add CSS:
```css
.season--summer { color: var(--cp-accent-amber); }
.season--winter { color: var(--cp-accent-ice); }
.season--spring { color: var(--cp-accent-green); }
.season--autumn { color: var(--cp-accent-green); }
```

**Step 5:** In `main.ts` `render()`, apply the class to season readout spans:
```ts
seasonNorthValue.className = seasonColorClass(north);
seasonSouthValue.className = seasonColorClass(south);
```

**Step 6:** Commit:
```bash
git commit -m "feat(seasons): add season color coding to readout strip [S1]"
```

---

### Task 8: Misconception Content + Contextual Message [S7]

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/logic.ts`
- Modify: `apps/demos/src/demos/seasons/logic.test.ts`
- Modify: `apps/demos/src/demos/seasons/main.ts`

**Step 1:** Expand the "What to notice" tab content with misconception callout:
```html
<div class="cp-tab-panel" role="tabpanel" id="tab-notice" aria-labelledby="tab-btn-notice">
  <div class="cp-callout" data-kind="misconception">
    Common myth: seasons are caused by Earth being closer to the Sun.
    In fact, Earth is closest in January (Northern Hemisphere winter)!
  </div>
  <ul>
    <li><strong>Observable:</strong> Day length and sun angle change systematically with the calendar.</li>
    <li><strong>Model:</strong> Axial tilt ($\varepsilon$) causes the Sun's declination ($\delta$) to cycle annually.</li>
    <li><strong>Inference:</strong> Tilt, not distance, drives seasons. Opposite hemispheres have opposite seasons at the same time.</li>
  </ul>
</div>
```

**Step 2:** Write failing test for `contextualMessage`:
```ts
describe("contextualMessage", () => {
  it("returns distance myth note at perihelion in Northern winter", () => {
    const msg = contextualMessage({
      dayOfYear: 3,
      seasonNorth: "Winter",
      axialTiltDeg: 23.5,
      distanceAu: 0.983,
    });
    expect(msg).toContain("closest");
  });

  it("returns solstice note at June solstice", () => {
    const msg = contextualMessage({
      dayOfYear: 172,
      seasonNorth: "Summer",
      axialTiltDeg: 23.5,
      distanceAu: 1.017,
    });
    expect(msg).toContain("solstice");
  });

  it("returns empty string for generic days", () => {
    const msg = contextualMessage({
      dayOfYear: 150,
      seasonNorth: "Spring",
      axialTiltDeg: 23.5,
      distanceAu: 1.005,
    });
    expect(msg).toBe("");
  });

  it("returns tilt note when tilt is zero", () => {
    const msg = contextualMessage({
      dayOfYear: 172,
      seasonNorth: "Summer",
      axialTiltDeg: 0,
      distanceAu: 1.017,
    });
    expect(msg).toContain("tilt");
  });
});
```

**Step 3:** Implement in `logic.ts`:
```ts
export interface SeasonContextState {
  dayOfYear: number;
  seasonNorth: Season;
  axialTiltDeg: number;
  distanceAu: number;
}

export function contextualMessage(state: SeasonContextState): string {
  const { dayOfYear, seasonNorth, axialTiltDeg, distanceAu } = state;

  // Zero tilt = no seasons
  if (axialTiltDeg < 1) {
    return "With near-zero tilt, declination stays near 0\u00B0 all year \u2014 no seasons.";
  }

  // Perihelion in Northern winter (distance myth)
  if (dayOfYear <= 10 || dayOfYear >= 360) {
    return "Earth is closest to the Sun right now \u2014 yet it\u2019s Northern Hemisphere winter. Distance doesn\u2019t drive seasons.";
  }

  // Near solstices
  if (Math.abs(dayOfYear - 172) <= 3) {
    return "June solstice: longest day in the North, shortest in the South.";
  }
  if (Math.abs(dayOfYear - 356) <= 3) {
    return "December solstice: longest day in the South, shortest in the North.";
  }

  // Near equinoxes
  if (Math.abs(dayOfYear - 80) <= 3) {
    return "March equinox: nearly equal day and night worldwide.";
  }
  if (Math.abs(dayOfYear - 266) <= 3) {
    return "September equinox: nearly equal day and night worldwide.";
  }

  return "";
}
```

**Step 4:** Run tests.

**Step 5:** In `main.ts`, update `render()` to set the contextual message:
```ts
const msg = contextualMessage({
  dayOfYear: day,
  seasonNorth: north,
  axialTiltDeg,
  distanceAu,
});
contextMessageEl.textContent = msg;
```

**Step 6:** Commit:
```bash
git commit -m "feat(seasons): add misconception content + contextual messages [S7]"
```

---

### Task 9: Overlay Shelf Tab [S8]

**Files:**
- Modify: `apps/demos/src/demos/seasons/index.html`
- Modify: `apps/demos/src/demos/seasons/main.ts`

This task moves the overlay toggle chips from the sidebar to the Overlays shelf tab, and adds a new "Hour Grid" toggle [S8].

**Step 1:** In the Overlays tab panel, place the overlay chip group:
```html
<div class="cp-tab-panel" role="tabpanel" id="tab-overlays" aria-labelledby="tab-btn-overlays" hidden>
  <fieldset class="cp-chip-group overlay-row" role="group" aria-label="Overlays">
    <legend class="cp-muted">Globe overlays</legend>
    <button class="cp-chip" type="button" aria-pressed="true" data-overlay="latitude-bands">Lat. Bands</button>
    <button class="cp-chip" type="button" aria-pressed="true" data-overlay="terminator">Terminator</button>
    <button class="cp-chip" type="button" aria-pressed="true" data-overlay="sunlight-rays">Sunlight</button>
    <button class="cp-chip" type="button" aria-pressed="true" data-overlay="day-arc">Day arc</button>
    <button class="cp-chip" type="button" aria-pressed="false" data-overlay="ecliptic">Ecliptic</button>
    <button class="cp-chip" type="button" aria-pressed="false" data-overlay="equator">Cel. Equator</button>
    <button class="cp-chip" type="button" aria-pressed="false" data-overlay="hour-grid">Hour Grid</button>
  </fieldset>
</div>
```

**Step 2:** Add the hour grid SVG element in the globe group:
```html
<g id="hourGrid" class="stage__hourGrid" style="display:none">
  <!-- 6 meridian lines at 30-degree intervals, rendered by JS -->
</g>
```

**Step 3:** In `main.ts`, add hour grid rendering (6 ellipses at 30° longitude intervals on the tilted globe). This is geometrically similar to latitude bands but rotated. Each meridian is a half-ellipse.

Actually, for simplicity, generate 6 `<ellipse>` elements via JS at init time and set their transforms to rotate around the axis. OR use `<line>` elements that connect the poles through the globe surface.

Simplest approach: 6 great-circle arcs. Since the globe is orthographic projection with tilt, each meridian is a vertical ellipse (rx = 0, ry = GLOBE_R for the meridian that faces us; full ellipse for the perpendicular ones). This is complex geometry.

Simpler fallback: draw vertical lines at regular intervals across the globe face, clipped to the globe circle. This gives a visual grid effect.

```ts
function renderHourGrid(tiltDeg: number) {
  const hourGridEl = document.querySelector<SVGGElement>("#hourGrid");
  if (!hourGridEl) return;
  hourGridEl.innerHTML = ""; // clear previous

  // Draw 6 vertical lines (at -120, -80, -40, 0, 40, 80, 120 px)
  // representing longitude meridians
  for (let i = -2; i <= 2; i++) {
    const x = i * 50;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", String(-GLOBE_R));
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(GLOBE_R));
    line.setAttribute("class", "stage__hourGridLine");
    hourGridEl.appendChild(line);
  }
}
```

Add CSS:
```css
.stage__hourGridLine {
  stroke: color-mix(in srgb, var(--cp-muted) 30%, transparent);
  stroke-width: 0.8;
}
```

And add to overlay targets:
```ts
"hour-grid": [hourGridEl],
```

**Step 4:** Commit:
```bash
git commit -m "feat(seasons): move overlays to shelf tab + add hour grid [S8]"
```

---

### Task 10: Reduce Distance Exaggeration

**Files:**
- Modify: `apps/demos/src/demos/seasons/main.ts`

The orbit title currently says "Orbit (toy distance)" and uses `distExaggeration = 8`. The design spec says reduce to 2x for a more realistic orbit while still showing the eccentricity.

**Step 1:** In `renderStage()`, change the `orbitPosition` call:
```ts
const { x, y } = orbitPosition(angle, args.distanceAu, orbitR, 2);
```

**Step 2:** Update the orbit title in HTML from "Orbit (toy distance)" to "Orbit (exaggerated distance)".

**Step 3:** Verify the E2E test for distance exaggeration still passes — the test just checks that `aphR > periR` with `aphR - periR > 5`. With 2x exaggeration and e=0.017:
- periR ≈ 140 * (1 + 2*(-0.017)) = 140*0.966 = 135.2
- aphR ≈ 140 * (1 + 2*(0.017)) = 140*1.034 = 144.8
- Difference ≈ 9.6 > 5 ✓

**Step 4:** Commit:
```bash
git commit -m "feat(seasons): reduce distance exaggeration from 8x to 2x"
```

---

### Task 11: Update Design Contract Tests

**Files:**
- Modify: `apps/demos/src/demos/seasons/design-contracts.test.ts`

**Step 1:** Fix failing tests due to layout change:
- Test for `.cp-demo__controls` → update to also accept `.cp-demo__sidebar`
- Test for `.cp-demo__drawer` → update for `.cp-demo__shelf`
- Readouts panel test → update for readout strip
- Entry animation selectors → update for sidebar/shelf

**Step 2:** Add new contract tests:
```ts
describe("Layout: moon-phases 5-zone shell", () => {
  it("uses cp-demo__sidebar, not cp-demo__controls with data-shell", () => {
    expect(html).toContain('class="cp-demo__sidebar');
    expect(html).not.toContain('data-shell="triad"');
  });

  it("has readout strip (not readout panel)", () => {
    expect(html).toContain("cp-readout-strip");
  });

  it("has tabbed shelf with 3 tabs", () => {
    const tabs = html.match(/role="tab"/g) || [];
    expect(tabs.length).toBe(3);
  });
});

describe("Season color classes", () => {
  it("CSS defines season color classes", () => {
    expect(css).toContain("season--summer");
    expect(css).toContain("season--winter");
    expect(css).toContain("season--spring");
  });
});

describe("Orbit panel features", () => {
  it("has season labels in orbit SVG", () => {
    expect(html).toContain('id="seasonLabel-Mar"');
  });

  it("has aphelion marker", () => {
    expect(html).toMatch(/aph/i);
  });

  it("has distance line element", () => {
    expect(html).toContain('id="distanceLine"');
  });

  it("has Polaris axis indicator", () => {
    expect(html).toContain('id="polarisAxis"');
  });
});

describe("Globe features", () => {
  it("has sunlight ray elements", () => {
    expect(html).toContain('id="sunlightRays"');
  });

  it("has day-length arc paths", () => {
    expect(html).toContain('id="dayArc"');
    expect(html).toContain('id="nightArc"');
  });
});

describe("Latitude band color differentiation", () => {
  it("equator uses --cp-accent-green", () => {
    expect(css).toMatch(/lat-band--equator[\s\S]*?--cp-accent-green/);
  });
  it("tropics use --cp-accent-amber", () => {
    expect(css).toMatch(/lat-band--tropic[\s\S]*?--cp-accent-amber/);
  });
  it("arctic circles use --cp-accent-ice", () => {
    expect(css).toMatch(/lat-band--arctic[\s\S]*?--cp-accent-ice/);
  });
});

describe("Misconception content", () => {
  it("What to notice tab has misconception callout", () => {
    expect(html).toMatch(/data-kind="misconception"/);
    expect(html).toContain("closest");
  });
});

describe("Contextual message element", () => {
  it("has contextual message element with aria-live", () => {
    expect(html).toContain('id="contextMessage"');
    expect(html).toMatch(/id="contextMessage"[^>]*aria-live/);
  });
});
```

**Step 3:** Run all tests:
```bash
corepack pnpm -C apps/demos test -- --run src/demos/seasons/
```

**Step 4:** Commit:
```bash
git commit -m "test(seasons): update contract tests for phase 3 layout + features"
```

---

### Task 12: Update E2E Tests

**Files:**
- Modify: `apps/site/tests/seasons.spec.ts`

**Step 1:** Fix failing E2E tests:
- `.cp-demo__controls` → `.cp-demo__sidebar` (or both via locator chain)
- `.cp-demo__readouts` label → "Readouts" (readout strip has different label)
- `.cp-demo__drawer` → `.cp-demo__shelf`
- Accordion tests → tab tests
- `aria-label="Controls panel"` test → update selector
- `aria-label="Readouts panel"` → update for readout strip aria-label

**Step 2:** Add new E2E tests:
```ts
test("readout strip shows season with color coding", async ({ page }) => {
  await page.locator("#anchorJunSol").click();
  await page.waitForTimeout(700);
  const seasonEl = page.locator("#seasonNorthValue");
  await expect(seasonEl).toHaveText("Summer");
  await expect(seasonEl).toHaveClass(/season--summer/);
});

test("shelf tabs switch content", async ({ page }) => {
  // "What to notice" tab is active by default
  await expect(page.locator("#tab-notice")).toBeVisible();
  // Click Model notes tab
  await page.locator("#tab-btn-model").evaluate((el: HTMLElement) => el.click());
  await expect(page.locator("#tab-model")).toBeVisible();
  await expect(page.locator("#tab-notice")).toBeHidden();
});

test("overlays tab shows toggle chips", async ({ page }) => {
  await page.locator("#tab-btn-overlays").evaluate((el: HTMLElement) => el.click());
  await expect(page.locator("#tab-overlays")).toBeVisible();
  const chips = page.locator('#tab-overlays button[data-overlay]');
  expect(await chips.count()).toBeGreaterThanOrEqual(6);
});

test("sunlight rays are visible by default", async ({ page }) => {
  const rays = page.locator("#sunlightRays");
  await expect(rays).toBeAttached();
});

test("contextual message appears at solstice", async ({ page }) => {
  await page.locator("#anchorJunSol").click();
  await page.waitForTimeout(700);
  const msg = page.locator("#contextMessage");
  await expect(msg).toContainText("solstice");
});
```

**Step 3:** Run E2E:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Seasons"
```

**Step 4:** Commit:
```bash
git commit -m "test(seasons): update E2E tests for phase 3 layout + features"
```

---

### Task 13: Physics Review

**Files:**
- Read: all seasons files (logic.ts, main.ts, style.css)

**Dispatch a physics review agent** that traces the full chain for:

1. **Polaris axis direction:** `axisEndpoint(tiltDeg, length)` → SVG rendering. Verify the axis points "up and to the right" for positive tilt (Northern Hemisphere tilted toward viewer). The existing `axisEndpoint` negates the tilt angle: `axisRad = -tilt * PI/180`, so `sin(axisRad)` is negative → x component goes LEFT. But in orbit view, looking down from above the North Pole, the axis projected onto the orbit plane should lean... Actually this is already in use for the globe view and was reviewed. Just verify it looks correct in the orbit panel context.

2. **Sunlight ray direction:** Rays go left-to-right (from Sun, which is at the center-left of the globe). Since the globe is at `translate(670, 210)` and the Sun is in the orbit panel at `translate(220, 210)`, sunlight should come from the LEFT. Rays with negative x values (in globe local coords) pointing left→right are correct.

3. **Day-length arc geometry:** Verify that `dayLengthArcGeometry` produces arcs whose lit portion is on the Sun-facing (left) side of the globe. The day arc should be centered at angle π (left side, where sunlight enters).

4. **Distance exaggeration:** With `distExaggeration=2`, verify perihelion is still to the RIGHT of center (angle ~0 from `SeasonsModel.orbitAngleRadFromDay({dayOfYear: 3})`).

5. **Season label positions:** Verify March is ~76° from perihelion direction, and labels go counterclockwise (Mar → Jun → Sep → Dec).

**After review:** Fix any issues found, then commit.

```bash
git commit -m "docs+fix(seasons): physics review pass"
```

---

## Verification Gates

After all 13 tasks, run the full gate:

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C packages/theme test -- --run
corepack pnpm -C apps/demos test -- --run
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

All must pass. Expected test count increases:
- Contract tests: 33 → ~45 (12 new)
- Logic tests: 94 → ~110 (16 new)
- E2E tests: 37 → ~42 (5 new)
