# Demo Layout Redesign — Composable Component Architecture

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current three incompatible demo layout variants with a single composable architecture built from reusable UI primitives, eliminating scrolling problems, improving mobile usability, and creating a professional observatory-instrument aesthetic.

**Architecture:** A viz-dominant layout with a compact sidebar, pinned readout strip, optional play bar, and a bottom content shelf. All UI elements (tabs, popovers, bottom sheet, play bar) are independent reusable components that demos compose as needed. Mobile uses a bottom sheet pattern instead of the current broken single-column fallback.

**Tech Stack:** CSS Grid + custom properties, vanilla JS/TS web components (no framework), existing `@cosmic/theme` token system, existing `@cosmic/runtime` infrastructure.

**Audit reference:** `docs/audits/2026-02-06-ui-ux-audit.md`

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Desktop Layout Architecture](#2-desktop-layout-architecture)
3. [Component Library](#3-component-library)
4. [Mobile Layout Architecture](#4-mobile-layout-architecture)
5. [Per-Demo Composition Map](#5-per-demo-composition-map)
6. [Migration Strategy](#6-migration-strategy) (includes 6.4 Playwright Visual Regression)
7. [Acceptance Criteria](#7-acceptance-criteria)

---

## 1. Design Principles

### 1.1 Viz-dominant

The visualization is the primary learning instrument. It must occupy the majority of the viewport on all screen sizes. Controls serve the visualization, not the other way around.

### 1.2 Progressive disclosure

Controls that students interact with continuously (sliders, play/pause) are always visible. Controls that are "set once" (presets, configuration dropdowns, speed selectors) live in popovers that open on demand and close when done. Pedagogical content (What to Notice, Model Notes, Keyboard Shortcuts) lives in a bottom shelf, out of the way but one click away.

### 1.3 Composable primitives

No monolithic layout. Each demo composes from a menu of UI primitives:

| Primitive | Purpose | Usage |
|-----------|---------|-------|
| **Sidebar** | Houses physics controls | All demos |
| **Readout strip** | Pinned readout values | All demos with quantitative readouts |
| **Play bar** | Animation transport | Demos with time animation |
| **Popover** | "Set once" selections | Presets, config dropdowns, speed |
| **Sidebar tabs** | Content panels in sidebar | Future: Background, Worksheet, Model |
| **Bottom shelf** | Pedagogical content | What to Notice, Model Notes, Shortcuts |
| **Bottom sheet** (mobile) | Controls drawer | All demos on mobile |
| **Utility toolbar** | Meta actions | Station mode, Help, Copy |

### 1.4 JS owns state, CSS owns geometry

Every interactive component follows one rule: **JS toggles data attributes; CSS controls all layout and animation.** No `element.style.transform = ...` in JS. Instead, JS sets `data-snap="half"` and CSS responds. This keeps the separation clean and makes every visual state inspectable in DevTools.

Formalized:
- JS modules manage: event listeners, attribute toggling, ARIA state, focus management
- CSS manages: positioning, sizing, transitions, visibility
- Bridge: `data-*` attributes and `aria-*` attributes (never inline styles for layout)

### 1.5 Consistent spatial grammar

Students build spatial expectations. Across ALL demos:

- **Left:** Controls (always)
- **Center/right:** Visualization (always)
- **Below viz:** Readout strip (always)
- **Below controls + viz:** Content shelf (always)
- **Sidebar header:** Utility icons (always)

### 1.6 One sacred breakpoint

`1024px` is the **layout mode boundary** — the single point where desktop grid flips to mobile bottom sheet. Do not add additional breakpoints for layout mode changes. Fine-grained responsive adjustments (font sizes, label visibility) can use other breakpoints, but the structural desktop/mobile split lives at exactly one threshold.

> "1024px is sacred. Do not add layout breakpoints lightly."

---

## 2. Desktop Layout Architecture (>= 1024px)

### 2.1 Grid structure

```
+--[ sidebar ]------+---[ viz ]----------------------------+
|  utility toolbar   |                                      |
|  ───────────────   |     visualization (SVG/Canvas)       |
|  [physics controls]|                                      |
|  [sliders, toggles]|                                      |
|  [mode switches]   |                                      |
|                    +--------------------------------------+
|                    |  readout strip (pinned)               |
|                    +--------------------------------------+
|                    |  play bar (optional, animation demos) |
+--------------------+--------------------------------------+
|  bottom shelf: [ What to Notice | Model | Shortcuts ]     |
+-----------------------------------------------------------+
```

### 2.2 CSS Grid definition

```css
.cp-demo {
  display: grid;
  grid-template-columns: clamp(280px, 25vw, 360px) minmax(0, 1fr);
  grid-template-rows: 1fr auto auto auto;
  grid-template-areas:
    "sidebar  viz"
    "sidebar  readouts"
    "sidebar  playbar"
    "shelf    shelf";
  gap: var(--cp-space-3);
  padding: var(--cp-space-4);
  min-height: 100svh;
  align-items: start;
}
```

**Key change:** One layout for all demos. The `data-shell` attribute variants (`triad`, `viz-first`) are eliminated. Every demo uses the same grid. Differences are expressed through which *components* a demo includes, not which *layout* it uses.

### 2.3 Sidebar

The sidebar is a sticky panel containing only physics-relevant controls. It is NOT a dumping ground.

**Content hierarchy:**

1. **Utility toolbar** (top, always visible) — icon row: `[Station] [Help] [Copy] [Nav ▾]`
2. **Mode switch** (if applicable) — segmented control: `[Kepler | Newton]`
3. **Primary sliders** — always-visible continuous controls
4. **Popover triggers** — compact buttons that open preset/config popovers
5. **Toggle group** — compact checkbox/radio rows for overlays

**Eliminated from sidebar:**
- ~~Full-width stacked utility buttons~~ → icon toolbar (reclaims 300px+)
- ~~Navigation links~~ → dropdown inside Nav icon
- ~~Preset button grids~~ → popover (reclaims 100-200px)
- ~~Speed/config dropdowns~~ → popover
- ~~"What to Notice"~~ → bottom shelf
- ~~"Model Notes"~~ → bottom shelf
- ~~"Keyboard Shortcuts"~~ → bottom shelf (or Help modal)

**Result:** The sidebar fits in one viewport height for ALL demos without scrolling.

### 2.4 Readout strip

A horizontal strip pinned directly below the visualization. Shows key measurements in the established amber-value / ice-unit typography.

```html
<div class="cp-readout-strip" aria-label="Readouts">
  <div class="cp-readout">
    <span class="cp-readout__label">Distance</span>
    <span class="cp-readout__value" id="distanceValue">1.000</span>
    <span class="cp-readout__unit">AU</span>
  </div>
  <!-- ... more readouts ... -->
</div>
```

```css
.cp-readout-strip {
  grid-area: readouts;
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-3) var(--cp-space-5);
  padding: var(--cp-space-3) var(--cp-space-4);
  background: var(--cp-instr-panel-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--cp-r-2);
  border: 1px solid var(--cp-border);
}
```

For demos with many readouts (keplers-laws conservation, eclipse-geometry), secondary readouts go inside a `<details>` accordion within the strip, or into a popover triggered from the strip.

### 2.5 Play bar (conditional)

Only present for demos with animation: keplers-laws, eclipse-geometry, retrograde-motion.

```
[ ◀◀ ] [ ▶ ] [ ⏸ ] [ ▶▶ ] [ ━━━━━━━━○━━━━━━━━━━ ] 0.42 / 1.00 yr  [ ⚙ Speed ▾ ]
```

A compact horizontal transport bar with: rewind, play, pause, step-forward, timeline scrub, phase readout, and a speed popover. This replaces the scattered play/pause/reset/speed controls currently buried in the sidebar.

### 2.6 Bottom shelf

A full-width tabbed panel below the main content area. Replaces the current `.cp-demo__drawer` accordion stack.

```
[ What to Notice ]  [ Model Notes ]  [ Shortcuts ]
─────────────────────────────────────────────────
• When eccentricity is high, notice how the speed
  varies dramatically between perihelion and aphelion...
```

- Tabs are horizontal, compact, and use the existing `--cp-accent` highlight
- First tab ("What to Notice") is open by default
- Content area has a max-height with scroll for very long content
- The shelf is NOT sticky — it scrolls with the page below the fold

### 2.7 Utility toolbar

Replaces the 3-7 stacked full-width buttons at the bottom of every sidebar.

```
[🏠 Station]  [? Help]  [📋 Copy]  [↗ Nav ▾]
```

- 4 icon buttons in a horizontal row at the top of the sidebar
- `Station` opens Station Mode modal (existing)
- `Help` opens Help modal (existing)
- `Copy` copies results to clipboard (existing)
- `Nav` opens a small dropdown with links: Open exhibit, Station card, Instructor notes

**Space savings:** ~300-400px of vertical sidebar space reclaimed across all demos.

---

## 3. Component Library

Each component is a standalone CSS + JS module in `packages/theme/` and `packages/runtime/`. Demos import and compose them.

### 3.1 `CpPopover` (CSS + JS)

A click-triggered floating panel that anchors to a trigger button.

**HTML pattern:**
```html
<div class="cp-popover-anchor">
  <button class="cp-button cp-popover-trigger" aria-expanded="false" aria-controls="presetPopover">
    Presets ▾
  </button>
  <div class="cp-popover" id="presetPopover" role="dialog" aria-label="Presets" hidden>
    <div class="cp-popover__body">
      <!-- preset grid, config form, speed selector, etc. -->
    </div>
  </div>
</div>
```

**Behavior:**
- Click trigger → toggle `hidden` + set `aria-expanded`
- Click outside or press Escape → close
- Anchor to trigger button using CSS `anchor()` with fallback to absolute positioning
- Focus trap inside when open
- Optional: auto-close after selection (for single-select presets)

**CSS:**
```css
.cp-popover-anchor { position: relative; }

.cp-popover {
  position: absolute;
  z-index: 100;
  top: calc(100% + var(--cp-space-2));
  left: 0;
  min-width: 240px;
  max-width: 360px;
  background: var(--cp-instr-panel-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: cp-pop-in 0.15s var(--cp-ease-out);
}

.cp-popover[hidden] { display: none; }

.cp-popover__body {
  padding: var(--cp-space-3);
  max-height: 400px;
  overflow: auto;
}
```

**JS module:** `packages/runtime/src/popover.ts`
```ts
export function initPopovers(root: HTMLElement): void;
```

Scans `root` for `.cp-popover-trigger` elements and wires up click/escape/outside-click handlers. Returns cleanup function for teardown.

### 3.2 `CpTabs` (CSS + JS)

A horizontal tab bar with panel switching. Used for the bottom shelf and available for sidebar content tabs in the future.

**HTML pattern:**
```html
<div class="cp-tabs" role="tablist" aria-label="Information panels">
  <button class="cp-tab" role="tab" aria-selected="true" aria-controls="panel-notice">
    What to Notice
  </button>
  <button class="cp-tab" role="tab" aria-selected="false" aria-controls="panel-model">
    Model Notes
  </button>
</div>
<div class="cp-tab-panel" id="panel-notice" role="tabpanel">...</div>
<div class="cp-tab-panel" id="panel-model" role="tabpanel" hidden>...</div>
```

**Behavior:**
- Click tab → show associated panel, hide others
- Arrow keys navigate between tabs (WAI-ARIA tabs pattern)
- Active tab gets `aria-selected="true"` and `.cp-tab--active` class

**CSS:**
```css
.cp-tabs {
  display: flex;
  gap: var(--cp-space-1);
  border-bottom: 1px solid var(--cp-border);
  padding: 0 var(--cp-space-3);
}

.cp-tab {
  padding: var(--cp-space-2) var(--cp-space-3);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--cp-muted);
  font-size: var(--cp-text-sm);
  font-weight: var(--cp-font-semibold);
  cursor: pointer;
  transition: color var(--cp-transition-fast), border-color var(--cp-transition-fast);
}

.cp-tab--active,
.cp-tab[aria-selected="true"] {
  color: var(--cp-accent);
  border-bottom-color: var(--cp-accent);
}

.cp-tab:hover:not(.cp-tab--active) {
  color: var(--cp-text);
}

.cp-tab-panel {
  padding: var(--cp-space-4);
}

.cp-tab-panel[hidden] { display: none; }
```

**JS module:** `packages/runtime/src/tabs.ts`
```ts
export function initTabs(root: HTMLElement): void;
```

### 3.3 `CpPlayBar` (CSS + JS)

A compact horizontal animation transport. Replaces scattered play/pause/reset/timeline/speed controls.

**HTML pattern:**
```html
<div class="cp-playbar" role="group" aria-label="Animation controls">
  <button class="cp-playbar__btn" id="rewind" aria-label="Rewind">⏮</button>
  <button class="cp-playbar__btn" id="play" aria-label="Play">▶</button>
  <button class="cp-playbar__btn" id="pause" aria-label="Pause" disabled>⏸</button>
  <button class="cp-playbar__btn" id="step" aria-label="Step forward">⏭</button>
  <input type="range" class="cp-range cp-playbar__timeline" id="timeline"
         min="0" max="1000" value="0" aria-label="Timeline">
  <span class="cp-playbar__phase">
    <span class="cp-readout__value" id="phaseValue">0.000</span>
    <span class="cp-readout__unit" id="phaseUnit">yr</span>
  </span>
  <div class="cp-popover-anchor">
    <button class="cp-playbar__btn cp-popover-trigger" aria-label="Speed settings"
            aria-expanded="false" aria-controls="speedPopover">⚙</button>
    <div class="cp-popover" id="speedPopover" hidden>
      <div class="cp-popover__body">
        <select class="cp-select" id="speedSelect">
          <option value="0.1">0.1x</option>
          <option value="0.5">0.5x</option>
          <option value="1" selected>1x</option>
          <option value="2">2x</option>
          <option value="5">5x</option>
          <option value="10">10x</option>
        </select>
      </div>
    </div>
  </div>
</div>
```

**CSS:**
```css
.cp-playbar {
  grid-area: playbar;
  display: flex;
  align-items: center;
  gap: var(--cp-space-2);
  padding: var(--cp-space-2) var(--cp-space-3);
  background: var(--cp-instr-panel-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-2);
}

.cp-playbar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-1);
  color: var(--cp-text);
  cursor: pointer;
  transition: background var(--cp-transition-fast), border-color var(--cp-transition-fast);
}

.cp-playbar__btn:hover { background: var(--cp-bg2); border-color: var(--cp-accent); }
.cp-playbar__btn:disabled { opacity: 0.4; cursor: default; }

.cp-playbar__timeline { flex: 1; min-width: 120px; }

.cp-playbar__phase {
  font-family: var(--cp-font-mono);
  font-size: var(--cp-text-sm);
  white-space: nowrap;
  min-width: 10ch;
}
```

### 3.4 `CpBottomSheet` (CSS + JS, mobile only)

A draggable sheet that slides up from the bottom on viewports < 1024px.

**Three snap points:**
- **Collapsed (10vh):** Only the readout strip + drag handle are visible
- **Half (50vh):** Readouts + primary controls visible
- **Full (90vh):** Everything visible

**HTML pattern (injected at runtime for mobile):**
```html
<div class="cp-bottom-sheet" data-snap="collapsed">
  <div class="cp-bottom-sheet__handle" aria-label="Drag to expand controls">
    <div class="cp-bottom-sheet__grip"></div>
  </div>
  <div class="cp-bottom-sheet__content">
    <!-- readout strip (always visible in collapsed) -->
    <!-- controls (visible in half/full) -->
    <!-- shelf tabs (visible in full) -->
  </div>
</div>
```

**Behavior:**
- Drag handle → snap between three positions
- Tap handle → toggle between collapsed and half
- Swipe down from collapsed → stay collapsed
- Touch outside sheet while expanded → collapse

**CSS:**
```css
.cp-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--cp-instr-panel-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--cp-border);
  border-radius: var(--cp-r-3) var(--cp-r-3) 0 0;
  transition: transform 0.3s var(--cp-ease-out);
  will-change: transform;
}

.cp-bottom-sheet[data-snap="collapsed"] { transform: translateY(calc(100% - 10svh)); }
.cp-bottom-sheet[data-snap="half"]      { transform: translateY(50%); }
.cp-bottom-sheet[data-snap="full"]      { transform: translateY(10%); }

.cp-bottom-sheet__handle {
  display: flex;
  justify-content: center;
  padding: var(--cp-space-2);
  cursor: grab;
}

.cp-bottom-sheet__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--cp-muted);
}

.cp-bottom-sheet__content {
  overflow: auto;
  max-height: calc(90svh - 40px);
  padding: 0 var(--cp-space-3) var(--cp-space-4);
}
```

**JS module:** `packages/runtime/src/bottomSheet.ts`
```ts
export function initBottomSheet(root: HTMLElement): void;
```

Handles touch/pointer drag events, snap calculations, and accessibility (aria-expanded states).

### 3.5 `CpUtilityToolbar` (CSS)

A compact icon-button row replacing the stacked full-width buttons.

```html
<div class="cp-utility-toolbar" role="toolbar" aria-label="Demo actions">
  <button class="cp-utility-btn" id="stationMode" aria-label="Station mode" title="Station mode">
    <svg><!-- station icon --></svg>
  </button>
  <button class="cp-utility-btn" id="help" aria-label="Help" title="Help &amp; shortcuts">
    <svg><!-- help icon --></svg>
  </button>
  <button class="cp-utility-btn" id="copyResults" aria-label="Copy results" title="Copy results">
    <svg><!-- copy icon --></svg>
  </button>
  <div class="cp-popover-anchor">
    <button class="cp-utility-btn cp-popover-trigger" aria-label="Navigation" aria-expanded="false"
            aria-controls="navPopover" title="More links">
      <svg><!-- nav icon --></svg>
    </button>
    <div class="cp-popover" id="navPopover" hidden>
      <nav class="cp-popover__body">
        <a href="..." class="cp-popover-link">Open exhibit</a>
        <a href="..." class="cp-popover-link">Station card</a>
        <a href="..." class="cp-popover-link">Instructor notes</a>
      </nav>
    </div>
  </div>
</div>
```

```css
.cp-utility-toolbar {
  display: flex;
  gap: var(--cp-space-1);
  padding: var(--cp-space-2) 0;
  border-bottom: 1px solid var(--cp-border-subtle);
  margin-bottom: var(--cp-space-3);
}

.cp-utility-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--cp-r-1);
  color: var(--cp-muted);
  cursor: pointer;
  transition: color var(--cp-transition-fast), background var(--cp-transition-fast);
}

.cp-utility-btn:hover {
  color: var(--cp-text);
  background: var(--cp-bg2);
  border-color: var(--cp-border);
}
```

### 3.6 `CpScrollShadow` (CSS only)

Adds scroll shadow indicators to any scrollable container. Applied to the sidebar panel body as a defense-in-depth measure (the new layout should eliminate scrolling, but if content overflows, users see the affordance).

```css
.cp-scroll-shadow {
  background:
    linear-gradient(var(--cp-bg1) 30%, transparent),
    linear-gradient(transparent, var(--cp-bg1) 70%) 0 100%,
    radial-gradient(farthest-side at 50% 0, rgba(0,0,0,0.3), transparent),
    radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,0.3), transparent) 0 100%;
  background-repeat: no-repeat;
  background-size: 100% 40px, 100% 40px, 100% 12px, 100% 12px;
  background-attachment: local, local, scroll, scroll;
}
```

### 3.7 Accessibility checklist (all interactive primitives)

Every interactive component (popover, tabs, bottom sheet, play bar) must pass this checklist before merging. Test one demo **fully keyboard-only** at mobile width early in Phase A to validate the patterns.

| Requirement | Popover | Tabs | Bottom sheet | Play bar |
|-------------|---------|------|--------------|----------|
| Focusable via Tab | trigger button | each tab | handle + content | each button |
| Escape closes/returns focus | close → return to trigger | N/A | collapse → return focus to viz | close speed popover |
| Arrow key navigation | N/A | left/right between tabs | N/A | N/A |
| `aria-expanded` on trigger | yes | N/A | yes (handle) | speed trigger |
| `aria-controls` → panel ID | yes | yes | yes | speed popover |
| `role` attribute | `dialog` | `tab` / `tabpanel` | `dialog` or `complementary` | `group` |
| Focus trap when open | yes | no (tabs are inline) | yes (when full) | no |
| Screen reader announcement | `aria-label` on dialog | `aria-selected` on active tab | live region on snap change | `aria-live` for phase |
| Touch target >= 44px | trigger button | tab buttons | handle grip area | transport buttons |
| Works without JS | hidden by default (accessible degradation) | all panels visible | controls visible in page flow | controls visible in sidebar |

**Test protocol:** After building each component in Phase A, open one demo at 375px width, unplug the mouse, and navigate the entire component with Tab/Enter/Escape/Arrow keys. Fix issues before moving on.

---

## 4. Mobile Layout Architecture (< 1024px)

### 4.1 Phone and tablet strategy

On viewports below 1024px, the layout flips to a **full-bleed visualization + bottom sheet** pattern:

```
+----------------------------------------------+
|                                              |
|          visualization (full screen)          |
|                                              |
+----------------------------------------------+
|  ═══  (bottom sheet grip)                    |
|  [ distance: 1.00 AU ] [ vel: 29.8 km/s ]   |  ← collapsed: readout strip visible
|  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   |
|  [slider] [slider] [presets ▾]               |  ← half: primary controls
|  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   |
|  [What to Notice | Model | ...]              |  ← full: everything
+----------------------------------------------+
```

### 4.2 Responsive viz simplification

At phone widths (< 640px):
- SVG demos: hide secondary labels (clamping notes, axis tick labels for minor ticks)
- Canvas demos: reduce font size for axis labels, skip minor grid lines
- Readout strip carries the quantitative data, so label removal is safe

At tablet widths (640-1023px):
- Full labels preserved
- Bottom sheet provides generous control space

### 4.3 Landscape nudge

For plot-heavy demos (blackbody, telescope) on phone viewports < 640px wide, show a one-time dismissable nudge:

```
📱↔️ "Rotate for best experience"
```

This is a passive suggestion, not a blocker.

### 4.4 Mobile CSS

```css
@media (max-width: 1023px) {
  .cp-demo {
    display: block; /* override grid */
    padding: 0;
  }

  .cp-demo__sidebar { display: none; } /* moved into bottom sheet */

  .cp-demo__stage {
    width: 100%;
    height: 100svh;
    border-radius: 0;
  }

  .cp-readout-strip { display: none; } /* shown inside bottom sheet instead */

  .cp-playbar {
    position: fixed;
    bottom: calc(10svh + var(--cp-space-2)); /* above collapsed bottom sheet */
    left: var(--cp-space-2);
    right: var(--cp-space-2);
    z-index: 150;
    border-radius: var(--cp-r-2);
  }

  .cp-shelf { display: none; } /* moved into bottom sheet */
}
```

---

## 5. Per-Demo Composition Map

This table shows which components each demo uses. Every demo gets the base layout (sidebar + viz + readout strip + shelf + utility toolbar). This column shows the *additional* components.

| Demo | Play bar | Popovers | Sidebar tabs | Notes |
|------|----------|----------|--------------|-------|
| **moon-phases** | No | Phase presets | No | Simplest demo, minimal controls |
| **angular-size** | No | Object presets | No | 2 sliders + presets |
| **parallax-distance** | No | Star catalog preset | No | 2 sliders + dropdown → popover |
| **seasons** | Yes | Latitude presets | No | Day slider + play + preset latitudes |
| **blackbody-radiation** | No | Star presets, comparison toggle | No | Temp slider + presets |
| **telescope-resolution** | No | Configuration popover (binary, atmosphere) | No | 2 sliders + config toggles |
| **em-spectrum** | No | Band presets, Lines popover | No | Wavelength slider + EM bands + lines table |
| **eclipse-geometry** | Yes | Phase presets, simulation config | No | Complex: phase + sim controls |
| **keplers-laws** | Yes | Planet presets, overlay config | No | Most controls of any demo |
| **retrograde-motion** | Yes | Planet pair presets | No | (future migration) |

**Sidebar tabs (future use):** When we add Background, Worksheet, or Model content to the sidebar, demos can opt into `CpTabs` in the sidebar. The component is built and ready; demos just don't use it yet.

---

## 6. Migration Strategy

### 6.1 Phase order

The migration happens in three phases to minimize risk and maximize reuse:

**Phase A: Build the component library (no demo changes)**

1. Create `packages/theme/styles/components/popover.css`
2. Create `packages/theme/styles/components/tabs.css`
3. Create `packages/theme/styles/components/playbar.css`
4. Create `packages/theme/styles/components/bottom-sheet.css`
5. Create `packages/theme/styles/components/utility-toolbar.css`
6. Create `packages/theme/styles/components/readout-strip.css`
7. Create `packages/theme/styles/components/scroll-shadow.css`
8. Create `packages/runtime/src/popover.ts`
9. Create `packages/runtime/src/tabs.ts`
10. Create `packages/runtime/src/bottomSheet.ts`
11. Add imports to `stub-demo.css` chain
12. Export from `@cosmic/runtime`
13. Write unit tests for each JS module (popover, tabs, bottom sheet)
14. Write contract tests for each CSS component (token usage, no color literals)

**Phase B: Migrate demo-shell.css (unified layout)**

1. Replace the three grid variants with the single unified grid
2. Add new grid areas: `readouts` → `readout-strip`, new `playbar`, new `shelf`
3. Add responsive breakpoint for bottom sheet
4. Update `stub-demo.css` imports
5. Verify all 10 demos still render (may need HTML adjustments)

**Phase C: Per-demo migration (one at a time)**

For each demo, in order:
1. Replace stacked utility buttons with `CpUtilityToolbar`
2. Move preset grids into `CpPopover`
3. Move readouts from controls/sidebar into `CpReadoutStrip`
4. Add `CpPlayBar` (if applicable)
5. Move drawer accordions into `CpTabs` (bottom shelf)
6. Remove `data-shell` attribute from HTML
7. Run contract tests + E2E tests
8. Commit

**Demo migration order:** moon-phases → angular-size → parallax-distance → seasons → blackbody-radiation → telescope-resolution → em-spectrum → eclipse-geometry → keplers-laws (simplest first, building confidence)

### 6.2 Backward compatibility

During Phase C, demos that haven't been migrated yet must still work with the new shell. The unified grid should be designed so that existing HTML structures degrade gracefully — if a demo doesn't have a `.cp-readout-strip`, that grid row collapses to zero height.

### 6.3 Test strategy

Each phase has its own test gates:

- **Phase A:** Unit tests for JS modules, contract tests for CSS components
- **Phase B:** All existing E2E tests must still pass (layout change should be invisible to Playwright selectors). Capture "before" baseline screenshots of all 10 demos at 1280x800.
- **Phase C:** Per-demo E2E tests updated to verify new component placement + existing behavior preserved. Visual regression screenshots at each step.

### 6.4 Playwright visual regression testing

Visual regression is a first-class gate throughout the redesign. Screenshots capture layout correctness that unit tests cannot.

**Baseline capture (before Phase B):**
- Screenshot all 10 demos at 1280x800 (desktop) — these are "before" baselines
- Screenshot all 10 demos at 375x812 (mobile) — documents current broken state
- Stored in `apps/site/tests/<slug>.spec.ts-snapshots/`

**Phase B gate (unified grid):**
- Re-screenshot all 10 demos at 1280x800
- Visual diff against pre-Phase-B baselines — changes should be minimal (grid structure change, not content)
- Update baselines after review

**Phase C per-demo screenshots (after each demo migration):**

Each demo gets **2 targeted screenshots** (not exhaustive pixel coverage — that kills velocity):

```ts
test("screenshot: new layout default state", async ({ page }) => {
  await page.waitForTimeout(500); // settle animations
  await expect(page).toHaveScreenshot("<slug>-layout-default.png", {
    maxDiffPixelRatio: 0.03,
  });
});

test("screenshot: mobile collapsed", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("<slug>-mobile-collapsed.png", {
    maxDiffPixelRatio: 0.05,
  });
});
```

For animation demos (seasons, eclipse-geometry, keplers-laws), add one more:
```ts
test("screenshot: play bar visible", async ({ page }) => {
  await expect(page.locator(".cp-playbar")).toHaveScreenshot(
    "<slug>-playbar.png", { maxDiffPixelRatio: 0.05 }
  );
});
```

**Screenshot naming convention:** `<slug>-layout-<state>.png` for desktop, `<slug>-mobile-<state>.png` for mobile.

**Scope rationale:** Shell-level screenshots (full page at default state + mobile collapsed) catch layout regressions without testing every component state. Component-level behavior (popover open, tab switch) is covered by functional E2E tests, not pixel screenshots. This keeps the screenshot count manageable (~25 total) while still catching the layout problems the redesign is meant to fix.

**Total estimated new screenshots:** ~2-3 per demo x 10 demos = ~25 new visual regression screenshots.

---

## 7. Acceptance Criteria

### 7.1 Desktop (>= 1024px)

- [ ] Sidebar fits in one viewport height (no scrolling) for all 10 demos at 800px viewport height
- [ ] Readout strip is visible without scrolling
- [ ] Play bar (where present) is visible without scrolling
- [ ] Visualization occupies >= 65% of viewport width
- [ ] Utility toolbar has 4 icon buttons, no full-width stacked buttons
- [ ] Presets and "set once" controls live in popovers
- [ ] Bottom shelf has tabs for pedagogical content
- [ ] No `data-shell` attribute variants remain in HTML

### 7.2 Mobile (< 1024px)

- [ ] Visualization fills the viewport
- [ ] Bottom sheet opens with drag gesture
- [ ] Readout strip visible in collapsed state
- [ ] Primary controls accessible in half-expanded state
- [ ] All controls accessible in full-expanded state
- [ ] Play bar (where present) floats above collapsed bottom sheet

### 7.3 Component library

- [ ] All 7 CSS component files exist in `packages/theme/styles/components/`
- [ ] All 3 JS modules exist in `packages/runtime/src/`
- [ ] All components use design system tokens (no color literals)
- [ ] All interactive components have ARIA roles and keyboard support
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Contract tests exist for each component

### 7.4 Visual regression

- [ ] Each demo has 1 desktop layout screenshot (default state at 1280x800)
- [ ] Each demo has 1 mobile screenshot (bottom sheet collapsed at 375x812)
- [ ] Animation demos have 1 play bar screenshot
- [ ] All screenshots pass with maxDiffPixelRatio <= 0.05
- [ ] Baselines committed and reviewed for each phase

### 7.5 Accessibility

- [ ] All interactive primitives pass the accessibility checklist (Section 3.7)
- [ ] One demo tested fully keyboard-only at mobile width
- [ ] All components degrade gracefully without JS (content visible, not interactive)

### 7.6 Regression

- [ ] All existing 1051 tests pass
- [ ] All existing E2E tests pass (updated selectors where needed)
- [ ] Build succeeds with no new warnings
- [ ] ~25 new visual regression screenshots committed with reviewed baselines

---

## Appendix A: Control Taxonomy

This table classifies every control type across all 10 demos to determine its UI treatment.

| Control Type | Treatment | Examples |
|-------------|-----------|---------|
| **Continuous** (slider) | Always visible in sidebar | Semi-major axis, eccentricity, temperature, wavelength, day-of-year |
| **Selection** (choose one from set) | Popover with grid/list | Planet presets, star presets, EM band buttons, phase buttons |
| **Toggle** (on/off) | Compact checkbox row in sidebar | Show foci, show apsides, equal areas, atmosphere, binary mode |
| **Mode** (mutually exclusive) | Segmented control in sidebar | Kepler/Newton, 101/201 units |
| **Transport** (animation) | Play bar component | Play, pause, reset, speed, timeline |
| **Configuration** (set once) | Popover | Speed dropdown, simulation years, magnification |
| **Meta action** (utility) | Toolbar icon button | Station mode, help, copy, navigation |
| **Pedagogical** (read) | Bottom shelf tab | What to notice, model notes, keyboard shortcuts |

## Appendix B: Vertical Space Budget (800px viewport)

Target: sidebar content fits in ~700px (800px minus padding).

| Section | Current height | New height | Savings |
|---------|---------------|------------|---------|
| Utility buttons (3-7 stacked) | 300-400px | 44px (toolbar) | 256-356px |
| Preset grid (3x3 buttons) | 140px | 36px (popover trigger) | 104px |
| Navigation links | 120px | 0px (in Nav dropdown) | 120px |
| Speed/config controls | 80px | 0px (in play bar or popover) | 80px |
| **Total savings** | | | **560-660px** |

This means even the most complex demo (keplers-laws with mode switch + 2 sliders + timeline + overlays) fits comfortably in ~300px of sidebar content — well within the 700px budget.

## Appendix C: Future Work (Phase D — not in scope)

**Semantic control layer:** A thin TypeScript abstraction that classifies controls by role:

```ts
type ControlRole = "continuous" | "selection" | "transport" | "toggle" | "mode" | "pedagogical" | "meta";
```

This would enable auto-placement of controls into the correct container (sidebar, popover, play bar, shelf) based on role declaration rather than manual HTML authoring. It could also generate consistent mobile layouts and instructor documentation automatically.

**Not implementing now** — the manual composition approach in this plan is correct for 10 demos. Revisit if/when demo count exceeds ~15 or when adding Worksheet/Background sidebar tabs.
