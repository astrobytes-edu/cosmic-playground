# Eclipse-Geometry & Seasons: Demo Design Overhaul

> **Status:** APPROVED (v2 — updated with full legacy feature audit)
> **Date:** 2026-02-08
> **Scope:** Visual/UX redesign of eclipse-geometry and seasons demos
> **Constraint:** No physics model changes. All 2,151 tests must pass after.

---

## Migration Audit: What Was Lost

Before designing the overhaul, here is the complete inventory of features lost or degraded during the original migration from legacy demos. **Every item below is addressed in the design.**

### Eclipse-Geometry: Lost Features

| # | Feature | Legacy | Migrated | Impact |
|---|---------|--------|----------|--------|
| E1 | Eclipse window arcs | 8 SVG paths (solar/lunar x any/central x asc/desc) with gold/green coloring | Completely removed | **Critical** — students can't see where eclipses are possible |
| E2 | Color-coded status badge | Prominent "TOTAL SOLAR ECLIPSE" / "NO ECLIPSE" badge, red/gold/green backgrounds | Replaced with plain text readouts | **High** — lost visual prominence of eclipse outcome |
| E3 | Contextual feedback messages | "Too far from node", "Wrong phase", "Annular conditions" etc. | None — must infer from raw numbers | **High** — lost pedagogical scaffolding |
| E4 | Eclipse log table | Color-coded HTML table (gold=solar, green=lunar rows) with columns: Year, Type, Details | Plain `<pre>` text block | **Medium** — lost visual organization in simulation output |
| E5 | Statistics grid | 3-stat panel: Total Solar, Total Lunar, Years Simulated (highlighted values) | Embedded in plain text | **Medium** — lost prominent stat display |
| E6 | Node glow effects | Gold `drop-shadow(0 0 4px)` on ascending/descending node markers | Muted text color, no glow | **Medium** — nodes less visually prominent as key geometry points |
| E7 | "Instant" animation speed | 4 speed presets: Slow / Normal / Fast / Instant | Only 3: Slow / Medium / Fast | **Low** — lost fast-exploration mode |
| E8 | Drag hint text | "Drag the Moon around its orbit" below visualization | Removed | **Low** — interaction still discoverable |

### Seasons: Lost Features

| # | Feature | Legacy | Migrated | Impact |
|---|---------|--------|----------|--------|
| S1 | Season-colored readout values | Summer=gold, Winter=blue, Spring/Fall=green on ALL readout values | Plain text, no color coding | **High** — lost mnemonic color reinforcement |
| S2 | Polaris axis indicator (orbit view) | Red arrow + "Polaris" label on orbital view showing axis direction | Removed from orbit panel (only globe has axis) | **High** — lost "axis points to Polaris" concept |
| S3 | Sunlight rays on globe | 5 parallel rays from left showing incident light direction + "Sunlight" label | Removed entirely | **High** — lost visual cue for light direction |
| S4 | Season labels around orbit | "March", "June", "September", "December" labels at orbital quadrants | Removed — only `r ~ X.XXX AU` distance label remains | **High** — lost seasonal position context |
| S5 | Distance line Sun-Earth | Dashed visual line from Sun center to Earth position with distance label | Removed — distance is text-only | **Medium** — lost geometric connection visual |
| S6 | Latitude band color differentiation | Equator=green, Tropics=gold, Arctic=blue (distinct colors) | All bands same muted orbit-color | **High** — lost pedagogically essential color distinction |
| S7 | Insight box / misconception prominence | Large box with blue header, red italic misconception quote, detailed explanation | 2 bullets in collapsed accordion ("What to notice") | **High** — core misconception now hidden |
| S8 | Hour angle grid overlay | Toggle for meridian grid lines on globe | Removed from overlay options | **Low** — rarely used, but was available |
| S9 | Aphelion marker | Both "Perihelion (Jan)" and "Aphelion (Jul)" labeled on orbit | Only "peri" label, no "aph" | **Medium** — incomplete orbital context |

### What Migration Got RIGHT (keep these)

- Challenge Mode (3 scenarios in seasons, 5 in eclipse) — **NEW, not in legacy**
- Accessibility: `aria-pressed`, `aria-live`, keyboard nav, screen reader support — **IMPROVED**
- Copy/Export results — **NEW**
- Reduced-motion support — **NEW**
- Code modularity: logic.ts pure functions, @cosmic/physics models — **IMPROVED**
- Design token system (celestial palette, glows, panel translucency) — **IMPROVED**
- Station Mode with KaTeX math notation — **IMPROVED**

---

## Design Decisions (confirmed in brainstorm)

| Decision | Choice |
|----------|--------|
| Eclipse layout shell | Moon-phases style (sidebar + stage + bottom strip + shelf) |
| Seasons layout shell | Moon-phases style (same, for consistency) |
| Seasons stage panels | Keep both (orbit + globe), fix exaggeration |
| Seasons panel split | ~35% orbit / ~65% globe (asymmetric, globe is hero) |
| Distance exaggeration | Reduce from 8x to 2x |
| Eclipse node control | Replace slider with draggable nodes on orbit SVG |
| Eclipse discoverability | Eclipse-zone arcs on orbit + threshold shading on beta curve |
| Eclipse presets | Smart "Show me an eclipse..." popover |
| Seasons overlays | Move from sidebar to shelf tab |
| Simulation controls | Move from sidebar to shelf tab |

---

## Shared: Moon-Phases Layout Shell

Both demos adopt the 5-zone vertical layout from moon-phases:

```
+----------+----------------------------------------------+
| SIDEBAR  |                   STAGE                      |
| (narrow, |             (dominant, ~75%)                  |
|  ~25%)   |                                              |
+----------+----------------------------------------------+
|  READOUT STRIP (horizontal, compact)                    |
+---------------------------------------------------------+
|  SHELF (tabs): What to notice | Model notes | ...       |
+---------------------------------------------------------+
```

- No right-hand readouts panel -- readouts become a horizontal bottom strip
- Stage gets ~75% of horizontal space (vs ~50% in current triad)
- Advanced/secondary controls move to shelf tabs
- Utility toolbar stays in sidebar (compact icon row)
- Use moon-phases' custom layout classes (no data-shell="triad")

---

## Eclipse-Geometry: Detailed Design

### Sidebar (target: 8 elements)

1. **Header:** "Eclipse Geometry"
2. **Callout:** "Eclipses need two things: the right phase AND proximity to a node."
3. **Phase chips:** [New Moon] [Full Moon] (existing cp-chip-group)
4. **Moon angle slider:** 0-360 deg (backup for drag interaction)
5. **Eclipse presets popover:** Button "Show me an eclipse..." opens:
   - "Total solar eclipse" -- snaps Moon to New + node to Sun direction
   - "Lunar eclipse" -- snaps Moon to Full + node aligned
   - "No eclipse" -- sets Moon far from nodes
   - "Eclipse season" -- animate month starting near a node
6. **Orbital tilt slider:** 0-10 deg (keep, pedagogically essential)
7. **Distance preset dropdown:** Perigee / Mean / Apogee (keep)
8. **Utility toolbar:** Station, Challenges, Help, Copy, More

**Removed from sidebar:**
- Node longitude slider (replaced by draggable nodes on orbit)
- Time controls callout (moved to shelf "Simulation" tab)
- Long-run simulation section (moved to shelf "Simulation" tab)

### Stage: Dual-Panel SVG (920 x 420)

**Left panel -- "Orbit (ecliptic plane)"**

- Earth at center (blue glow, existing)
- Circular Moon orbit (existing)
- Moon dot -- draggable (existing)
- Sun direction indicator (existing)
- Ascending + descending node dots -- NEW: draggable (replacing node slider)
  - Drag either node; the other moves to maintain 180 deg separation
  - Cursor: grab/grabbing, same pattern as Moon drag
  - Node labels update with current longitude
- **RESTORE [E6]:** Node glow effects
  - Nodes get `filter: drop-shadow(var(--cp-glow-accent-teal))` (using design tokens, not hardcoded gold)
  - Slightly larger radius (r=6 instead of r=5) for visibility
  - Color: `var(--cp-accent)` (teal) to distinguish from Moon (white) and Earth (blue)
- **RESTORE [E1]:** Eclipse window arcs
  - Rose-colored arc segments on the orbit circle near each node
    where |beta| < solar eclipse threshold
  - Teal-colored arc segments where |beta| < lunar eclipse threshold
  - Separate "any" arcs (dashed, wider extent) and "central" arcs (solid, narrower)
    — matching legacy's 4-tier arc system
  - Arcs resize dynamically when tilt or distance changes
  - When tilt = 0, arcs cover the full circle (eclipses every month)
  - When tilt = 10 deg, arcs shrink to narrow bands
  - Semi-transparent fill (opacity 0.15-0.25) so they don't obscure the orbit
- Eclipse achievement glow: When Moon enters an eclipse arc at the correct
  phase, the arc pulses briefly

**Right panel -- "Beta curve"**

- Sinusoidal beta(theta) curve (existing dashed rose line)
- Moon marker on curve (existing rose dot)
- NEW: Threshold shading bands (horizontal)
  - Rose band at +/- solar partial threshold (~1.5 deg at mean distance)
  - Darker rose band at +/- solar central threshold (~0.6 deg)
  - Teal band at +/- lunar penumbral threshold (~1.6 deg)
  - Bands update dynamically when distance preset changes
  - Semi-transparent fill (opacity 0.1-0.15)
  - Right-edge labels: "solar", "lunar"
- NEW: Glow effect when Moon marker enters a shaded band
- NEW: Threshold tick marks on Y-axis at threshold values

### Readout Strip (bottom, 5-6 items)

```
Phase: New Moon | Delta: 0.3 deg | beta: +0.45 deg | Solar: [*] Total | Lunar: [-] | Node: 12 deg
```

- Phase: Text label (New Moon / Full Moon / Waxing crescent / etc.)
- Phase angle Delta: Numeric with unit
- Beta (ecliptic lat.): Signed, 2-3 decimal places
- **RESTORE [E2]:** Solar outcome: Color-coded indicator + type text
  - Gray dot + "None" for no eclipse (default)
  - Rose dot + bold "Partial" / "Annular" / "Total" for solar eclipse
  - Background tint on the readout cell when eclipse is active
- **RESTORE [E2]:** Lunar outcome: Same pattern with teal dot + teal tint
- Nearest node: Angular distance in degrees

### Contextual Feedback — RESTORE [E3]

A single-line status message below the readout strip (or integrated into it) that provides context-aware pedagogical guidance:

- **No eclipse, wrong phase:** "Eclipses require New or Full Moon -- currently {phase}."
- **No eclipse, near syzygy but |beta| large:** "Moon is {beta} above the ecliptic -- too far from a node for an eclipse."
- **No eclipse, near node but wrong phase:** "Moon is near a node but not at New/Full -- no alignment."
- **Eclipse achieved:** "Total solar eclipse! Moon is at New Moon and {nearestNode} from the nearest node."
- **Close but not quite:** "Almost! |beta| = {beta} -- needs to be below {threshold} for a {type} eclipse."

This restores the pedagogical scaffolding that was completely lost. Implementation: pure function `contextualMessage(state: EclipseDemoState): string` in logic.ts.

### Shelf Tabs

1. "What to notice" -- existing 2 bullets (keep)
2. "Model notes" -- existing geometry explanation (keep)
3. **"Simulation" -- NEW tab, contains:**
   - Years slider (log scale, 1-1000)
   - Speed dropdown (slow/medium/fast)
   - Run / Stop buttons
   - **RESTORE [E4, E5]:** Simulation output as styled table, not plain `<pre>`
     - HTML `<table>` with columns: Year, Type, Details
     - Row color coding: rose background tint for solar eclipses, teal for lunar
     - Summary stats bar above table: "Solar: 42 | Lunar: 38 | Years: 100"
     - Scrollable container (max-height: 250px)
     - Uses `.cp-readout__value` styling for stat numbers

### Visual Reward System

When an eclipse is achieved:
1. The corresponding eclipse window arc on the orbit pulses with increased opacity
2. The solar/lunar outcome in the readout strip transitions from gray to rose/teal
3. A brief floating label appears near the Moon dot: "Solar eclipse!" or "Lunar eclipse!"
4. The label fades after 2 seconds

### Draggable Nodes: Interaction Design

- Visual: Node dots get a slightly larger hit area (r=8 instead of r=5)
- Cursor: grab on hover, grabbing during drag
- Behavior: Dragging one node moves the other to maintain 180 deg separation
- Constraint: Nodes always on the orbit circle (snap to circle during drag)
- Feedback: Node labels update in real-time showing current longitude
- Keyboard: When a node is focused, arrow keys adjust longitude +/- 1 deg
  (Shift: +/- 10 deg)
- **RESTORE [E6]:** Glow persists during drag (node glows brighter when focused/grabbed)

---

## Seasons: Detailed Design

### Sidebar (target: 8 elements)

1. **Header:** "Seasons: Why Tilt Matters"
2. **Misconception callout:** "Common myth: seasons are caused by Earth being closer/farther from the Sun." (keep — matches legacy's prominent misconception callout)
3. **Day-of-year slider:** 1-365 (keep)
4. **Anchor chips:** [Mar Eq] [Jun Sol] [Sep Eq] [Dec Sol] (keep)
5. **Axial tilt slider:** 0-90 deg (keep)
6. **Latitude slider:** -90 to +90 deg (keep)
7. **Animate year button** (keep)
8. **Utility toolbar:** Station, Challenges, Help, Copy, More

**Removed from sidebar:**
- Overlay toggles (4 buttons) -- moved to shelf "Globe overlays" tab

### Stage: Dual-Panel SVG (920 x 420, asymmetric split)

**Left panel (~35%) -- "Orbit (toy scale)"**

- Sun at center (existing)
- Earth on orbital path (existing)
- Distance exaggeration reduced from 8x to 2x
  - At 2x, eccentricity is barely visible -- reinforces "orbit is nearly circular"
  - Pedagogically correct: distance does NOT cause seasons
- **RESTORE [S9]:** Both perihelion AND aphelion markers
  - "Perihelion (Jan)" at closest point
  - "Aphelion (Jul)" at farthest point
  - Small dot + text label for each (matching legacy)
- Earth dot at current position (keep)
- **RESTORE [S4]:** Season labels around orbit
  - "March" at spring equinox position (top)
  - "June" at summer solstice position (right)
  - "September" at fall equinox position (bottom)
  - "December" at winter solstice position (left)
  - Labels positioned at orbital quadrants, subtle text styling
  - Dynamic repositioning to match orbital orientation
- **RESTORE [S5]:** Distance line from Sun to Earth
  - Dashed line from Sun center to Earth position
  - Small distance label near midpoint: "r ~ X.XXX AU"
  - Replaces the orphaned `orbitLabel` text at bottom
- **RESTORE [S2]:** Polaris axis indicator
  - Short red line extending from Earth dot in the axis tilt direction
  - Small "Polaris" label at the tip
  - Shows axis orientation IN the orbital view (currently only globe has axis)
  - Uses `var(--cp-accent-rose)` instead of hardcoded `#ff6b6b`
- Orbit label below (keep, but update to show season position)

**Right panel (~65%) -- "Globe View"**

- Larger globe: Radius increased from 155px to ~175px
- Tilted axis line (existing)
- **RESTORE [S6]:** Color-differentiated latitude bands
  - Equator: `var(--cp-accent-green)` (green, 1.5px stroke, opacity 0.7)
  - Tropics of Cancer/Capricorn: `var(--cp-accent-amber)` (gold, dashed)
  - Arctic/Antarctic circles: `var(--cp-accent-ice)` (ice-blue, dashed)
  - Replaces current muted single-color bands
  - Color coding matches legacy and is pedagogically essential
- Terminator (existing)
- Observer latitude marker (existing)
- **RESTORE [S3]:** Sunlight rays on globe
  - 5 parallel horizontal rays entering globe from the left side
  - Styled with `var(--cp-celestial-sun)` at 40-60% opacity
  - Small "Sunlight" label at the leftmost ray
  - Rays connect the orbit panel (where Sun is) to the globe view
  - More prominent than a single arrow -- gives immediate visual cue
- NEW: Day-length arc
  - A colored arc drawn along the observer's latitude circle on the globe
  - Amber/gold arc for the sunlit portion of the day
  - Semi-transparent dark arc for the night portion
  - Arc proportions reflect actual day/night ratio at current latitude+date
  - Visually communicates day length WITHOUT needing to read a number
  - Updates in real-time as user adjusts date, latitude, or tilt
  - Toggleable (default ON) — added to overlays shelf tab

### Readout Strip (bottom, 5 items)

```
delta: +23.4 deg | Day: 14h 52m | Noon alt: 73.1 deg | r: 1.017 AU | Spring (N) / Autumn (S)
```

- Solar declination delta: Signed, 1 decimal
- Day length: HERO readout (slightly larger font) -- this is the key output
- Noon altitude: 1 decimal with unit
- **REVISED:** Earth-Sun distance: Keep in strip (muted styling, smaller font)
  - Rationale: Station Mode needs all values visible; removing distance entirely
    breaks data collection workflow. Muted styling avoids overemphasizing it.
- **RESTORE [S1]:** Season (N/S): Color-coded text
  - Summer: `var(--cp-accent-amber)` (warm gold)
  - Winter: `var(--cp-accent-ice)` (cool ice-blue)
  - Spring/Autumn: `var(--cp-accent-green)` (green)
  - Applied to BOTH the season label text AND the corresponding readout value
  - Provides instant visual season identification at a glance

### RESTORE [S7]: Enhanced "What to notice" Content

The current "What to notice" tab has only 2 generic bullets. Restore legacy's detailed pedagogical content:

1. **Misconception highlight:** "Seasons are NOT caused by distance. Earth's orbit is nearly circular (e < 0.017). In fact, Earth is closest to the Sun in January -- Northern Hemisphere winter!"
2. **Key observation:** "Day length and sun angle change dramatically with date and hemisphere. At the June solstice, the North Pole gets 24 hours of daylight while the South Pole gets none."
3. **Tilt experiment:** "Try setting tilt to 0. Notice how day length becomes 12 hours everywhere, all year -- no seasons without tilt."

This restores the pedagogical depth that was compressed to 2 shallow bullets.

### Shelf Tabs

1. **"What to notice"** -- RESTORED with 3 detailed bullets (see above)
2. **"Model notes"** -- existing equations (keep)
3. **"Globe overlays"** -- NEW tab, contains:
   - Latitude bands toggle (default ON)
   - Terminator toggle (default ON)
   - Day-length arc toggle (default ON) — NEW
   - Ecliptic toggle (default OFF)
   - Celestial equator toggle (default OFF)
   - **RESTORE [S8]:** Hour angle grid toggle (default OFF)
   - Brief 1-line description for each

---

## Summary of Changes

| Aspect | Eclipse (current -> new) | Seasons (current -> new) |
|--------|-------------------------|-------------------------|
| Shell | triad -> moon-phases style | triad -> moon-phases style |
| Readouts | Right panel (6) -> bottom strip (5-6) | Right panel (5) -> bottom strip (5) |
| Node control | Slider -> draggable nodes | N/A |
| Eclipse zones | None -> arc + band shading [E1] | N/A |
| Node glow | None -> teal glow [E6] | N/A |
| Status display | Plain text -> color-coded [E2] | N/A |
| Context messages | None -> pedagogical hints [E3] | N/A |
| Sim output | Plain pre -> styled table [E4,E5] | N/A |
| Simulation | Sidebar -> shelf tab | N/A |
| Overlays | N/A | Sidebar -> shelf tab |
| Distance exag. | N/A | 8x -> 2x |
| Globe size | N/A | 155px -> ~175px |
| Day-length viz | N/A | Number only -> visual arc |
| Eclipse presets | None -> smart popover | N/A |
| Eclipse reward | Text only -> glow + color | N/A |
| Season colors | N/A | None -> gold/ice/green readouts [S1] |
| Polaris axis | N/A | None -> orbit panel indicator [S2] |
| Sunlight rays | N/A | None -> 5 parallel rays on globe [S3] |
| Season labels | N/A | None -> orbit quadrant labels [S4] |
| Distance line | N/A | None -> dashed Sun-Earth line [S5] |
| Lat band colors | N/A | Muted -> green/gold/blue [S6] |
| Misconception | N/A | 2 bullets -> 3 detailed bullets [S7] |
| Hour angle grid | N/A | Removed -> restored in shelf [S8] |
| Perihelion/Aphelion | N/A | "peri" only -> both labeled [S9] |

---

## Implementation Phases

### Phase 2: Eclipse-Geometry UX Overhaul

1. **Layout migration:** Change from triad to moon-phases style layout
   - Restructure index.html
   - Move readouts to bottom strip with color-coded outcome indicators [E2]
   - Remove right panel
   - Add shelf with tabs (move simulation there)
2. **Contextual feedback:** Add `contextualMessage()` to logic.ts [E3]
   - Pure function taking `EclipseDemoState`, returns guidance string
   - Unit test all message conditions
   - Render below readout strip as `<p class="cp-status">`
3. **Node enhancements:** Restore glow + add drag interaction [E6]
   - Add teal glow filter to node dots
   - Remove node longitude slider from sidebar
   - Wire drag events (same pattern as Moon drag)
4. **Eclipse window arcs:** Draw colored arc segments on orbit near nodes [E1]
   - Compute arc extents from tilt + distance thresholds
   - Add 4-tier arcs (solar any/central, lunar any/central) matching legacy
   - Add logic functions (`eclipseArcExtent()`), unit test them
5. **Beta curve threshold shading:** Add horizontal shaded bands
   - Compute threshold values from distance preset
   - Draw semi-transparent rect elements
   - Add threshold tick marks on Y-axis
6. **Eclipse presets popover:** Add "Show me an eclipse..." button
7. **Simulation output upgrade:** Replace `<pre>` with styled table [E4, E5]
   - HTML table with color-coded rows (rose=solar, teal=lunar)
   - Summary stats bar above table
   - Scrollable container
8. **Visual rewards:** Glow effects on eclipse achievement
9. **Update tests:** Adjust contract tests and E2E for new layout

### Phase 3: Seasons Visual Overhaul

1. **Layout migration:** Change to moon-phases style layout
   - Restructure index.html
   - Move readouts to bottom strip with season color coding [S1]
   - Move overlays to shelf tab (include hour angle grid [S8])
2. **Panel rebalancing:** Change SVG panel split to ~35/65
   - Reduce orbit panel width
   - Increase globe radius to ~175px
3. **Orbit panel restoration:** Fix all missing orbit elements
   - Reduce distance exaggeration from 8x to 2x
   - Add season labels at orbital quadrants [S4]
   - Add perihelion + aphelion markers with labels [S9]
   - Add dashed distance line from Sun to Earth [S5]
   - Add Polaris axis indicator with label [S2]
4. **Globe restoration:** Fix color coding + add new elements
   - Restore color-differentiated latitude bands (green/gold/blue) [S6]
   - Add 5 sunlight rays from left side of globe [S3]
   - Add day-length arc at observer's latitude (amber/dark)
   - Add day-length arc to overlay shelf tab toggles
5. **Season readout color coding:** [S1]
   - Apply amber/ice/green to season text in readout strip
   - Keep distance in strip but muted [revised from earlier "remove"]
6. **Restore misconception content:** Expand "What to notice" bullets [S7]
7. **Update tests:** Adjust contract tests and E2E for new layout

### Phase 4: Testing + Physics Review

1. Update design contract tests for new element structure
2. Update E2E tests for new layout (selectors, visual regression)
3. Run full physics review on both demos
   - Especially: draggable node coordinate math, eclipse arc computation
   - Especially: Polaris axis direction, sunlight ray geometry
4. Verify all 2,151 tests still pass
5. Run full build + E2E suite

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Layout migration breaks E2E selectors | Update selectors incrementally |
| Draggable nodes introduce coordinate bugs | Follow Moon drag pattern; mandatory physics review |
| Eclipse arc computation is wrong | Unit test threshold-to-arc math first; compare against legacy arc code |
| Day-length arc rendering is complex | Pure function in logic.ts, test in isolation |
| Distance exaggeration change affects orbit tests | Update E2E screenshots |
| Polaris axis direction wrong in orbit view | Physics review traces axis tilt through both panels |
| Sunlight ray geometry inconsistent with terminator | Rays always horizontal (from left); terminator shift from declination — both use same model |
| Latitude band colors fail contrast check | Use existing accent tokens that pass WCAG AA (already tested in contrast.test.ts) |
| Color-coded sim table is too complex | Keep as enhancement; if scope exceeds budget, styled `<pre>` with ANSI-like markers is acceptable fallback |
| Season labels overlap on small orbit panel (~35% width) | Use abbreviated labels ("Mar", "Jun", "Sep", "Dec") if space is tight |

---

## Caveats and Known Trade-offs

1. **Distance in readout strip:** The original plan removed it. Revised to keep it (muted) because Station Mode requires all values visible for data collection. Trade-off: slight visual emphasis on distance, which conflicts with the "distance doesn't cause seasons" message. Mitigation: muted font size + no color coding (gray, not amber).

2. **Hour angle grid:** Restored as shelf toggle, but this is the least-used overlay. If implementation scope gets tight, this is the first feature to defer (P5 priority).

3. **Day-length arc toggleability:** The arc should be toggleable (default ON) via the overlays shelf tab, not always-on. Some instructors may prefer a clean globe without the arc for different lesson plans.

4. **Eclipse "Instant" speed:** Not restoring. The 3-speed system (slow/medium/fast) is sufficient, and "Instant" bypasses the animation entirely which defeats pedagogical purpose.

5. **Simulation breadcrumb:** The simulation controls move to a shelf tab, which makes them less discoverable. Add a small "Simulation controls are in the Simulation tab below" hint in the sidebar (appears once, then dismissed) OR a small link in the time controls area: "[Run long simulation...]" that opens the shelf tab.

6. **Beta curve vs. legacy side view:** The migrated beta curve (abstract graph) replaces the legacy side view (spatial perspective). The beta curve is arguably more rigorous and matches how astronomers think about eclipse geometry. **Not reverting to side view.** Instead, the threshold shading bands on the beta curve add the pedagogical scaffolding that the side view provided intuitively.

7. **Eclipse log table complexity:** A full HTML `<table>` with color-coded rows is more complex than the current `<pre>`. If this becomes a scope risk, an acceptable fallback is a styled `<pre>` with colored text spans (not a full table). The key requirement is that solar and lunar eclipses are visually distinguishable.

8. **Keyboard shortcut 'e'/'s' behavior (seasons):** Restore legacy "jump to nearest" behavior. Currently jumps to a hardcoded day. Will implement `shortestDayDelta` to find nearest equinox/solstice from current position. (Approved)

9. **Orbit panel density (seasons):** At 35% width, use abbreviated month labels ("Mar", "Jun", "Sep", "Dec"). If density is still too high, the distance line [S5] is first to defer — it's redundant with the readout strip. (Approved)

---

## Files to Modify

### Eclipse-geometry
- apps/demos/src/demos/eclipse-geometry/index.html
- apps/demos/src/demos/eclipse-geometry/style.css
- apps/demos/src/demos/eclipse-geometry/main.ts
- apps/demos/src/demos/eclipse-geometry/logic.ts
- apps/demos/src/demos/eclipse-geometry/logic.test.ts
- apps/demos/src/demos/eclipse-geometry/design-contracts.test.ts
- apps/site/tests/eclipse-geometry.spec.ts

### Seasons
- apps/demos/src/demos/seasons/index.html
- apps/demos/src/demos/seasons/style.css
- apps/demos/src/demos/seasons/main.ts
- apps/demos/src/demos/seasons/logic.ts
- apps/demos/src/demos/seasons/logic.test.ts
- apps/demos/src/demos/seasons/design-contracts.test.ts
- apps/site/tests/seasons.spec.ts
