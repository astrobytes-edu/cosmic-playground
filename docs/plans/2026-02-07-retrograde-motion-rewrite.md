# Retrograde Motion — Complete Rewrite Plan

**Date:** 2026-02-07
**Status:** Approved design, ready for implementation

## Problem

The current retrograde-motion demo has correct physics and passes all tests, but looks broken in the browser: washed-out backgrounds, no visual containment, no animation, cluttered controls, and no pedagogical scaffolding. It needs a complete UI/UX rewrite modeled on the moon-phases golden reference.

## Design Decisions (from brainstorm)

| Decision | Choice |
|----------|--------|
| Layout | Full moon-phases pattern: sidebar + viz-panels + playbar + readout strip + tabbed shelf |
| Panel ratio | 1.4fr / 1fr (longitude plot left, orbit view right) |
| Animation | Full playbar: play/pause/step-forward/step-back/reset + speed selector (1x/5x/10x/20x) |
| Controls | Preset selector at top + Advanced accordion (observer, target, window, plot step) |
| Toolbar | Full utility toolbar (station mode, help, challenges, copy, nav popover) |
| Readouts | Horizontal strip below playbar (5 readouts) |
| Shelf | Three tabs: "What to notice", "Model notes", "Explore further" |
| Plot design | Polished instrument plot: axis labels, ticks, gridlines, retro bands, cursor |
| Orbit view | Planet trail + celestial glow + line of sight |
| Zodiac ring | Toggle in Advanced accordion, shows constellation labels around orbit periphery |
| State badge | Prominent pill on plot panel: "DIRECT →" / "← RETROGRADE" / "● STATIONARY" |
| Sky-view inset | Narrow 1D strip below orbit view showing target moving against background stars |
| First-retro annotation | One-time callout when animation first enters retrograde |

## Architecture

### Layout Structure

```
┌─────────────────┬──────────────────────────────────────┐
│    SIDEBAR      │            VIZ STAGE                 │
│  ┌────────────┐ │  ┌──────────────────┬──────────────┐ │
│  │ Toolbar    │ │  │  Longitude Plot  │  Orbit View  │ │
│  │            │ │  │  (viz-panel)     │  (viz-panel) │ │
│  ├────────────┤ │  │                  │              │ │
│  │ Preset     │ │  │                  │  Sky-view    │ │
│  │ selector   │ │  │                  │  inset below │ │
│  ├────────────┤ │  └──────────────────┴──────────────┘ │
│  │ ▸ Advanced │ ├──────────────────────────────────────┤
│  │  observer  │ │  PLAYBAR                             │
│  │  target    │ │  ▶ ⏸ ⏪ ⏩ ⟲  Speed[▼]  ──●─────  │
│  │  window    │ │  [◀Stat]  [⊙ Retro]  [Stat▶]       │
│  │  plotStep  │ ├──────────────────────────────────────┤
│  │  zodiac ☐  │ │  READOUT STRIP                      │
│  │  others ☐  │ │  Day│λ_app│dλ/dt│State│Retro dur    │
│  ├────────────┤ ├──────────────────────────────────────┤
│  │ Status     │ │  SHELF (3 tabs)                      │
│  └────────────┘ │  Notice │ Model │ Explore            │
└─────────────────┴──────────────────────────────────────┘
```

### Files Modified

| File | Change |
|------|--------|
| `index.html` | Complete rewrite: moon-phases structure with sidebar, viz-panels, playbar, readout strip, shelf |
| `style.css` | Complete rewrite: viz-panel, panel-title, playbar, readout-strip, sky-view, state badge, zodiac ring |
| `main.ts` | Major rewrite: animation loop, playbar wiring, trail rendering, sky-view, annotation, zodiac ring |
| `logic.ts` | Add functions: animation state, trail data, sky-view projection, zodiac mapping |
| `logic.test.ts` | Add tests for new logic functions |
| `design-contracts.test.ts` | Update contracts for new structure (viz-panel, playbar, readout-strip, shelf tabs) |

### Files NOT Modified

- `packages/physics/src/retrogradeMotionModel.ts` — physics model stays as-is
- No other demos change

## Implementation Steps

### Phase A: HTML + CSS Foundation (Steps 1–3)

#### Step 1: Rewrite `index.html` — moon-phases structure

Replace the current HTML with the moon-phases layout pattern:

1. **Sidebar** (`cp-demo__sidebar cp-panel`):
   - `cp-panel-header`: "Retrograde Motion"
   - `cp-panel-body cp-scroll-shadow`:
     - Utility toolbar: station-mode, help, challenges, copy, nav popover
     - Challenge container (empty div for ChallengeEngine)
     - Preset selector: Earth→Mars, Earth→Venus (select or button group)
     - Advanced accordion (`cp-accordion`):
       - Observer planet dropdown
       - Target planet dropdown
       - Window months slider (6–36)
       - Plot step selector (0.25, 0.5, 1, 2 days)
       - Zodiac ring checkbox
       - Show other planets checkbox
     - Status live-region

2. **Stage** (`cp-demo__stage cp-stage`):
   - `.viz-layout` grid (1.4fr / 1fr):
     - Left `.viz-panel`: panel-title "Apparent Longitude λ_app" + state badge + plot SVG (viewBox 0 0 1000 400) + drag hint
     - Right column:
       - `.viz-panel`: panel-title "Orbit View (top-down)" + orbit SVG (viewBox 0 0 420 420)
       - Sky-view inset strip (narrow, ~60px)

3. **Playbar** (`cp-playbar`):
   - Transport row: play, pause, step-back, step-forward, reset buttons + speed select (1x/5x/10x/20x)
   - Scrub row: model-day range slider with day label
   - Nav row: prev-stationary, center-on-retrograde, next-stationary buttons

4. **Readout strip** (`cp-readout-strip cp-demo__readouts`):
   - Model day t (days)
   - Apparent longitude λ_app (deg)
   - dλ̃/dt (deg/day)
   - State (Direct/Retrograde/Stationary)
   - Retrograde duration (days)

5. **Shelf** (`cp-demo__shelf`):
   - Tab 1 "What to notice": Observable / Model / Inference bullets
   - Tab 2 "Model notes": Keplerian mechanics, model conventions
   - Tab 3 "Explore further": Links to Kepler's Laws, Eclipse Geometry, historical context

#### Step 2: Rewrite `style.css` — moon-phases visual treatment

Key rules to add:

```css
/* Viz layout (two-panel grid) */
.viz-layout { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); }

/* Viz panels: translucent, blurred, bordered */
.viz-panel {
  background: var(--cp-instr-panel-bg);
  border: 1px solid var(--cp-instr-panel-border);
  border-radius: 12px;
  padding: var(--cp-space-3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* State badge */
.retro__state-badge { position: absolute; top/right; pill shape; }
.retro__state-badge--direct { color: var(--cp-accent-amber); }
.retro__state-badge--retrograde { color: var(--cp-pink); }
.retro__state-badge--stationary { color: var(--cp-accent-ice); }

/* Sky-view inset */
.retro__sky-view { height: 60px; border-radius: 8px; ... }

/* Zodiac labels */
.retro__zodiac-label { fill: var(--cp-muted); opacity: 0.3; }
```

Entry animations: staggered `cp-slide-up` / `cp-fade-in` on sidebar, stage, playbar, readouts, shelf.
Responsive: `.viz-layout` collapses to single column at ≤900px.

#### Step 3: Update `design-contracts.test.ts`

Update contract tests for new structure:
- Viz-panel presence (`.viz-panel` class)
- Panel translucency (`--cp-instr-panel-bg`, `backdrop-filter`)
- Readout strip (`.cp-readout-strip`)
- Shelf tabs (3 tabs)
- Playbar presence
- State badge presence
- All existing token contracts remain

### Phase B: Animation System (Steps 4–5)

#### Step 4: Add animation logic to `logic.ts`

New pure functions:
- `advanceCursor(currentDay, dt, speed, windowEnd)` → next cursor day (wraps or clamps)
- `buildTrailPoints(series, cursorIndex, trailLength)` → array of {x, y, opacity} for planet trail
- `projectToSkyView(lambdaDeg, viewWidth)` → x position in sky-view strip
- `zodiacLabelPositions(radius, centerX, centerY)` → array of {x, y, label, angleDeg} for 12 zodiac signs
- `formatSpeed(speed)` → "1x" / "5x" / "10x" / "20x"

#### Step 5: Wire animation in `main.ts`

1. **Animation state:** `playing: boolean`, `speed: number`, `lastTimestamp: number`
2. **Animation loop:** `requestAnimationFrame` callback that advances cursor by `speed × dt`
3. **Playbar wiring:** play/pause/step/reset buttons toggle animation state
4. **Scrub slider:** horizontal range input in playbar, bidirectional with cursor day
5. **Trail rendering:** on each frame, draw fading trail behind target planet in orbit SVG
6. **Sky-view rendering:** update dot position in sky-view strip
7. **State badge:** update text/class when dλ/dt sign changes
8. **First-retro annotation:** show callout on first retrograde entry, dismiss on click

### Phase C: Polished Plot + Orbit View (Steps 6–7)

#### Step 6: Longitude plot enhancements

1. **Axes:** Y-axis label "λ_app (°)", X-axis label "Model Day t"
2. **Tick marks:** labeled at regular intervals, using `var(--cp-muted)`
3. **Gridlines:** dashed, very subtle (`opacity: 0.08`)
4. **Retrograde bands:** filled rectangles with `var(--cp-pink)` at 8% opacity + SVG diagonal hatch pattern
5. **Main curve:** `var(--cp-accent)` stroke, 2px
6. **Cursor:** vertical line `var(--cp-accent-ice)` + dot on curve
7. **Wrapped strip:** narrow band at bottom of plot SVG

#### Step 7: Orbit view enhancements

1. **Planet glow:** `filter: drop-shadow(var(--cp-glow-planet))` on planet circles
2. **Trail:** polyline behind target planet, recent 60 model-days, fading opacity + decreasing width
3. **Line of sight:** dashed line from observer through target to edge, `var(--cp-accent-amber)`
4. **Zodiac ring:** 12 constellation abbreviations at ecliptic longitudes, toggled by checkbox
5. **Sky-view strip:** narrow horizontal SVG below orbit panel, shows target dot against faint star markers

### Phase D: Pedagogy Content (Step 8)

#### Step 8: Write shelf tab content

**Tab 1 — "What to notice":**
- **Observable:** Watch the target planet's longitude in the plot. During retrograde intervals (pink bands), the planet appears to reverse its motion against the background stars.
- **Model:** Earth and the target planet both orbit the Sun. When Earth overtakes Mars (or Venus overtakes Earth), the line of sight sweeps backward temporarily.
- **Inference:** No planet actually reverses. Retrograde motion is a viewing-geometry effect. Its duration depends on the orbital-period ratio between observer and target.

**Tab 2 — "Model notes":**
- Planets follow coplanar Keplerian ellipses with elements (a, e, ϖ, L₀) from JPL Table 1.
- Time unit is "model day" (no calendar-date claims). One model month = 30 days.
- Apparent longitude: λ_app(t) = atan2(y_t − y_o, x_t − x_o), wrapped to [0, 360°).
- Unwrapped series λ̃(t) uses 180° jump rule. Retrograde defined by dλ̃/dt < 0.
- Stationary points: where dλ̃/dt = 0 (refined by bisection to 10⁻³ day tolerance).

**Tab 3 — "Explore further":**
- "See the orbital mechanics behind these ellipses" → link to Kepler's Laws demo
- "Another geometry-of-viewing effect" → link to Eclipse Geometry demo
- Historical note: Copernicus used retrograde motion to argue for heliocentrism. Ptolemy's epicycles were a mathematical description of this same apparent reversal.

### Phase E: Tests + Gates (Steps 9–10)

#### Step 9: Update tests

1. **logic.test.ts:** Add tests for `advanceCursor`, `buildTrailPoints`, `projectToSkyView`, `zodiacLabelPositions`, `formatSpeed`
2. **design-contracts.test.ts:** Update for viz-panel, playbar, readout-strip, shelf tabs, state badge
3. **Playwright E2E:** Update `apps/site/tests/retrograde-motion.spec.ts` for new layout

#### Step 10: Run all gates

```bash
corepack pnpm -C packages/physics test -- --run          # physics tests
corepack pnpm -C apps/demos test -- --run                # demo tests
corepack pnpm build                                       # build + invariants
corepack pnpm -C packages/runtime typecheck               # runtime types
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e  # E2E
```

All must pass before this work is complete.

## Test Targets

| Layer | Current | Target |
|-------|---------|--------|
| Physics | 5 tests | 5 (unchanged) |
| Design contracts | 18 tests | ~22 tests |
| Logic unit | 45 tests | ~60 tests |
| Playwright E2E | 36 tests | ~40 tests |
| **Total** | **104** | **~127** |

## Success Criteria

1. Demo loads with dark, atmospheric background (starfield visible through translucent panels)
2. Two viz-panels with proper containment (border, blur, translucent bg)
3. Animation plays smoothly: planet moves along orbit, longitude curve traces, sky-view dot tracks
4. State badge transitions between Direct/Retrograde/Stationary with visual feedback
5. Planet trail shows retrograde loop in orbit view
6. Sky-view strip shows the planet reversing against background stars
7. First-retrograde annotation appears once, dismissible
8. Zodiac ring toggleable in Advanced accordion
9. All gates pass (physics, demo tests, build, typecheck, E2E)
10. Responsive: single-column layout at ≤900px
