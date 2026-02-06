# Cosmic Playground UI/UX Audit Report

> **Date:** 2026-02-06
> **Scope:** All 10 migrated instrument-layer demos
> **Method:** Full-page screenshots at 1280x800 (desktop) + 375x812 (mobile), accessibility tree inspection, interactive state testing

---

## Executive Summary

The 10 migrated demos share a consistent design system (dark theme, celestial tokens, starfield backgrounds, amber/ice readouts) that creates a cohesive "planetarium instrument" aesthetic. The token migration is complete and contract-tested. However, **five systemic UX problems** recur across most or all demos, and several demos have individual issues that hurt usability for teaching.

**Severity scale:** CRITICAL (blocks learning), MAJOR (hurts usability), MINOR (polish)

---

## 1. Systemic Issues (affect most/all demos)

### S1. Controls Panel Scroll Problem (CRITICAL)

**Affected:** All 10 demos
**What:** The controls panel is a sticky sidebar with `overflow: auto` on `.cp-panel-body`. On a typical 800px-tall viewport, the bottom half of controls (utility buttons, nav links) is hidden below the fold. Users must scroll within a scrolling page to find "Station mode", "Help", "Copy results", and navigation links.

**Evidence:**
- blackbody-radiation: star preview, peak wavelength readout, luminosity ratio, and 6 utility/nav buttons are below fold
- eclipse-geometry: time controls, long-run simulation, and all utility/nav buttons are below fold
- keplers-laws: presets, overlays, and all 5 utility/nav buttons are below fold
- telescope-resolution: binary mode, magnification, atmosphere toggle, and utility buttons are below fold

**Impact:** Students in a classroom setting don't discover Station Mode, Challenge Mode, or Help. Instructors can't find "Copy results" or navigation links without scrolling.

**Root cause:** Every demo puts *all* controls + utility buttons + nav links in a single scrollable panel. No visual affordance (scroll indicator, shadow) shows there's more content below.

---

### S2. Utility Button Bloat at Panel Bottom (MAJOR)

**Affected:** All 10 demos
**What:** Every controls panel ends with 3-6 full-width stacked buttons:
```
Station mode
Challenge mode (some demos)
Help / shortcuts
Copy results
---
Open exhibit
Station card
Instructor notes
```

These are navigation and meta-actions, not physics controls. They consume 300-400px of vertical space, pushing actual controls off-screen.

**Evidence:** keplers-laws has 5 buttons + 2 nav links = 7 stacked rows. eclipse-geometry has 4 buttons + 3 nav links = 7 rows. blackbody-radiation has 3 buttons + 3 nav links = 6 rows.

**Impact:** Primary physics controls (sliders, presets) compete for space with secondary navigation. The panel feels like it never ends.

---

### S3. Mobile Layout is Broken (CRITICAL)

**Affected:** All 10 demos
**What:** At 375px width, the responsive breakpoint (`max-width: 1024px`) collapses to single-column. However:
1. The stage visualization shrinks to ~150px tall (useless for Canvas/SVG demos)
2. Controls and stage render side-by-side in two very narrow columns (blackbody shows ~140px-wide controls column)
3. Preset button grids overflow and text truncates ("White Dwarf" becomes "White\nDwarf")
4. Readout panels wrap unpredictably
5. Canvas plots (blackbody, telescope) become illegible — axis labels overlap

**Evidence:** Mobile blackbody screenshot shows: controls column ~140px wide, canvas ~180px wide with unreadable axis labels, preset buttons stacked 3-per-row with text wrapping, "What to notice" accordion competing for width with the controls.

**Impact:** Demos are unusable on phones and tablets (students often use iPads in class).

---

### S4. No Scroll Affordance on Panels (MAJOR)

**Affected:** All demos with long controls panels (8 of 10)
**What:** The sticky `.cp-demo__controls` panel clips overflow with no visual indicator that more content exists below. No scroll shadow, no "more below" indicator, no fade-out gradient. Users don't know they need to scroll.

**Impact:** Features at the bottom of the controls panel (Station mode, presets in some demos) are effectively hidden.

---

### S5. Inconsistent Layout Variants Create Confusion (MINOR)

**Affected:** Cross-demo navigation
**What:** Three different layout patterns exist:
- **Default (2-col):** controls left, stage right (blackbody, telescope, em-spectrum, angular-size)
- **Triad (3-col):** controls left, stage center, readouts right (parallax, seasons, eclipse-geometry)
- **Viz-first:** stage on top, controls below (moon-phases, keplers-laws)

Students moving between demos find controls in different positions. Readouts appear as a right sidebar in some demos, below the stage in others, and integrated into controls in still others.

**Impact:** Students build spatial expectations ("controls are on the left") that break when they switch demos. Learning curve for each demo is higher than necessary.

---

## 2. Per-Demo Issues

### Moon Phases

| Issue | Severity | Description |
|-------|----------|-------------|
| Viz-first layout on desktop | MINOR | Stage takes top ~60% of viewport; controls below require scrolling. Good for the visualization but inconsistent with other demos. |
| Phase strip overflow | MINOR | The 8-phase icon strip at the bottom of the stage area wraps poorly at narrower widths |
| Sky view wasted space | MAJOR | The sky view section (E-W horizon) is a large mostly-empty area with a tiny Sun and Moon dot. Could be more compact. |

### Angular Size

| Issue | Severity | Description |
|-------|----------|-------------|
| Scientific notation readouts | MINOR | `1.39200e+6 km` and `1.49598e+8 km` are hard to parse at a glance. These should use engineering notation or unit prefixes. |
| SVG diagram clipping | MAJOR | At extreme values (ISS preset: very small diameter, large distance), the "D ~ ..." label clips against the right edge. Same class of bug as keplers-laws Halley clipping. |
| Quick sky rule callout | MINOR | The teal callout box is visually prominent but doesn't respond to any interaction. Could be collapsible. |

### Parallax Distance

| Issue | Severity | Description |
|-------|----------|-------------|
| Triangle diagram is small | MINOR | The parallax triangle uses only ~40% of the stage area vertically. The clamping note takes prime visual real estate. |
| Controls panel too short | MINOR | Only 2 sliders + 1 dropdown — the controls panel feels empty compared to other demos. Lots of wasted vertical space before utility buttons. |

### Seasons

| Issue | Severity | Description |
|-------|----------|-------------|
| Dual-panel SVG is cramped | MAJOR | The orbit diagram and sunlight geometry diagram are squeezed side-by-side. At viewport widths below ~1400px, both panels become hard to read. Labels overlap. |
| No current-day indication | MINOR | The "Day of year" slider lacks a "Today" marker or quick-jump. |

### Blackbody Radiation

| Issue | Severity | Description |
|-------|----------|-------------|
| Canvas axis labels at small viewport | MAJOR | Below ~900px viewport width, x-axis wavelength labels overlap. At mobile widths, the entire plot is illegible. |
| Readouts embedded in controls | MINOR | Peak wavelength and luminosity ratio live inside the controls panel (below presets) rather than in a separate readouts panel. Inconsistent with triad-layout demos. |
| Star preview circle is large | MINOR | The color preview circle takes ~100px of height in the controls panel, pushing readouts and utility buttons further down. |

### Telescope Resolution

| Issue | Severity | Description |
|-------|----------|-------------|
| PSF image dominates viewport | MINOR | The binary star PSF image is a large white blob that fills the entire stage. While physically correct, it provides no context about what the viewer is seeing at first glance. |
| Controls truncated | MAJOR | Binary mode checkbox, magnification slider, atmosphere toggle, and all utility buttons are below the fold on 800px screens. |
| Scale bar text tiny | MINOR | The "4.94 arcsec" scale bar text in the PSF view is small and hard to read against the bright PSF. |

### EM Spectrum

| Issue | Severity | Description |
|-------|----------|-------------|
| Band buttons grid wraps oddly | MINOR | 7 EM band buttons (Radio through Gamma) wrap to 2 rows at controls panel width, with "Gamma" alone on the second row. Unbalanced. |
| Explore panels are verbose | MINOR | The Lines tab shows 13 items as a flat list. Could be a compact table. |
| Spectrum bar is small | MAJOR | The spectrum bar visualization (the main educational element) occupies only ~80px of vertical height. The band description, scale labels, and comparison objects take more space than the spectrum itself. |

### Eclipse Geometry

| Issue | Severity | Description |
|-------|----------|-------------|
| Controls panel extremely long | CRITICAL | Phase buttons, moon angle slider, node longitude, orbital tilt, distance dropdown, time controls, long-run simulation (years slider, speed, run/stop), then 4 utility buttons, then 3 nav links. Requires extensive scrolling. |
| Beta curve panel is small | MAJOR | The ecliptic-latitude-vs-position sinusoid shares space with the orbit view. Both are cramped. |
| Long-run simulation UI is complex | MINOR | The simulation section has nested controls (years slider, speed dropdown, run/stop buttons) that could be behind an "Advanced" accordion. |

### Kepler's Laws

| Issue | Severity | Description |
|-------|----------|-------------|
| Halley preset clips labels | MAJOR | Aphelion label clips off the right edge of the SVG at e=0.967. |
| Vector labels float detached | MINOR | "v" and "F" labels appear far from their arrows in Newton mode. |
| Perihelion text collision | MINOR | Distance line text, perihelion label, and star label overlap at perihelion. |
| Controls panel very long | MAJOR | Mode toggle, keyboard shortcuts accordion, 2 sliders, orbital phase, animation controls, speed, 9 presets, overlays, 5 utility/nav buttons — requires 3+ screens of scrolling. |
| Conservation laws hidden | MINOR | Conservation readouts (kinetic, potential, total energy, angular momentum) are behind an accordion in the readouts panel. Students don't discover them. |

---

## 3. Cross-Cutting Observations

### What Works Well

1. **Token system is solid.** Celestial palette (sun-gold, earth-blue, accent-teal/rose/ice) is consistent and distinctive across all 10 demos. No legacy tokens remain.

2. **Readout typography.** Amber monospace values + ice-blue units is immediately scannable and looks professional. KaTeX math symbols in labels add scientific credibility.

3. **Starfield backgrounds** create atmospheric depth without being distracting.

4. **Accessibility.** Every demo has ARIA labels on panels, `aria-live` status regions, keyboard support on sliders, and screen-reader-compatible structure. This is above average for educational tools.

5. **Staggered entry animations** (cp-fade-in, cp-slide-up) feel polished and don't impede usability.

6. **"What to notice" accordions** are a strong pedagogical pattern — they guide observation without prescribing conclusions.

### What Needs Rethinking

1. **The controls panel is a dumping ground.** Physics controls, mode toggles, presets, overlays, utility actions, and navigation all live in one scrollable column. There's no information architecture — everything has equal visual weight.

2. **No responsive strategy below 1024px.** The `@media` breakpoint exists but the single-column fallback doesn't actually work. Canvas/SVG visualizations need minimum dimensions that phones can't provide.

3. **Readout placement varies by demo.** Some demos have readouts in a dedicated right panel (triad), some integrate readouts into controls, some put readouts below the stage. Students can't build a mental model of "readouts are always here."

4. **Button styling lacks hierarchy.** "Kepler mode" (a critical physics mode switch) looks identical to "Station mode" (a meta-action) and "Open exhibit" (a navigation link). All are the same full-width bordered button.

5. **No persistent help affordance.** Keyboard shortcuts, mode explanations, and "what does this button do?" hints are hidden behind accordions or "Help" buttons. First-time users face a wall of sliders and buttons with no guidance.

---

## 4. Priority Matrix

| Priority | Issue | Affected | Effort |
|----------|-------|----------|--------|
| P0 | S1: Controls scroll problem | All 10 | Medium (restructure panel sections) |
| P0 | S3: Mobile layout broken | All 10 | High (responsive redesign) |
| P1 | S2: Utility button bloat | All 10 | Low (collapse to toolbar/dropdown) |
| P1 | S4: No scroll affordance | 8 of 10 | Low (CSS scroll shadows) |
| P1 | Eclipse controls too long | 1 | Medium (accordion grouping) |
| P2 | S5: Layout variant inconsistency | All 10 | High (pick one pattern) |
| P2 | SVG label clipping (angular-size, keplers-laws) | 2 | Medium (auto-reposition) |
| P2 | Canvas legibility at small sizes | 3 | Medium (responsive canvas) |
| P3 | Per-demo polish items | Various | Low each |

---

## 5. Recommendations Summary

### Immediate wins (low effort, high impact)

1. **Add scroll shadows** to `.cp-panel-body` (CSS `background-attachment: local` technique) — shows users there's more content below.

2. **Collapse utility buttons** into a compact toolbar row (icon buttons) or a "More actions" dropdown. Reclaim 300px+ of vertical space.

3. **Move nav links out of controls** — put "Open exhibit", "Station card", "Instructor notes" in the drawer/footer area, not the controls panel.

### Structural changes (medium effort, high impact)

4. **Split controls into sections** with clear visual hierarchy:
   - **Primary** (always visible): physics sliders, presets
   - **Secondary** (accordion): overlays, animation, advanced options
   - **Meta** (toolbar): Station mode, help, copy, nav

5. **Standardize on one layout pattern** for all demos (recommendation: triad with responsive breakpoints). Readouts always in a dedicated panel.

6. **Design a real mobile experience** — either a "controls drawer" pattern (stage full-screen, controls in a bottom sheet) or a minimum-width warning.

### Longer-term improvements

7. **First-run guidance** — a brief tooltip tour or highlighted "start here" for the primary slider.

8. **Dynamic label positioning** for SVG/Canvas — detect edge clipping and reposition.

9. **Responsive canvas** — redraw at appropriate detail levels for smaller viewports.

---

## Appendix: Screenshots

All screenshots saved in working directory:
- `audit-moon-phases.png`
- `audit-angular-size.png`
- `audit-parallax-distance.png`
- `audit-seasons.png`
- `audit-blackbody.png`
- `audit-telescope.png`
- `audit-em-spectrum.png`
- `audit-eclipse-geometry.png`
- `audit-keplers-laws.png`
- `audit-mobile-blackbody.png` (375px viewport)
