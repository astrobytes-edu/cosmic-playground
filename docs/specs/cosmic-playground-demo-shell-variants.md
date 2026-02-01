# Cosmic Playground — Demo Shell Variants v0.1

**Status:** Draft (Codex-ready)  
**Date:** 2026-02-01  
**Scope:** Layout *only* (shared tokens/components remain constant)

## Goal

Support meaningful layout variation between demos **without UI drift** by defining a small set of “shell variants” that:

- keep the same regions and semantics (controls, stage, readouts, drawer)
- use the same theme tokens and component styles
- differ only in **layout emphasis** (what gets space on wide vs narrow screens)

## Invariant DOM contract (all variants)

Every demo root stays:

```html
<div id="cp-demo" class="cp-layer-instrument cp-demo" data-shell="…">
  <aside class="cp-demo__controls cp-panel" aria-label="Controls panel">…</aside>
  <section class="cp-demo__stage cp-stage" aria-label="Visualization stage">…</section>
  <aside class="cp-demo__readouts cp-panel" aria-label="Readouts panel">…</aside>
  <section class="cp-demo__drawer cp-drawer" aria-label="Panels">…</section>
</div>
```

If `data-shell` is omitted, the demo uses the **default** shell.

## Variant selection (opt-in mechanism)

Set the shell variant on the root demo element:

- `data-shell="instrument"` (default; may be omitted)
- `data-shell="triad"`
- `data-shell="viz-first"`

Implementation location: `packages/theme/styles/demo-shell.css` (variant selectors).

---

## Shell variants

### 1) `instrument` (default)

**Intent:** the “standard cockpit” for most demos: controls are always available, stage is large, readouts are visible without overwhelming the stage.

**Desktop layout:**

- Left: sticky controls panel
- Right: stage on top; readouts and drawer below

**Responsive:**

- Under breakpoint: stack stage → readouts → controls → drawer (no JS)

Good for:
- most migrated “instrument” demos
- demos where controls are frequently adjusted while watching the stage

---

### 2) `triad`

**Intent:** match the spec’s “controls | stage | readouts” mental model on wide screens, especially for geometry demos where it’s valuable to see readouts update *beside* the visualization.

**Desktop layout:**

- Left: sticky controls
- Center: stage (taller / wider than default)
- Right: sticky readouts
- Drawer: spans below stage+readouts (or full width; choose one rule and keep it consistent)

**Responsive:**

- Collapse to a single column (stage first), same as default

Good for:
- geometry-heavy demos (eclipse geometry, seasons) where readouts are essential while interacting
- projection/teaching contexts with wide displays

---

### 3) `viz-first`

**Intent:** maximize the visualization stage by giving it the top of the page and pushing controls/readouts below, while keeping the same instrument components.

**Desktop layout:**

- Top: stage (full width)
- Below: controls and readouts in a 2-column grid (or stacked)
- Drawer: below (or merged with the below-panels region)

**Responsive:**

- Stage first; then an accordion-like stack (CSS-only `details`) is encouraged but not required

Good for:
- demos with a visually rich stage where controls are adjusted less frequently
- classroom projection where the stage should dominate

---

## Guardrails (prevents “variant drift”)

- Variants are layout-only: **no per-variant colors**, no per-variant typography changes.
- Keep breakpoints and spacing consistent: use theme spacing tokens and a single breakpoint policy.
- If a demo needs custom layout beyond these variants, add a new variant (rare) rather than per-demo bespoke grids.

