# Cosmic Playground — Theme Spec v0.1

**Status:** Draft (Codex-ready)

**Owner:** Anna

**Date:** 2026-01-30

**Repo:** `cosmic-playground` (monorepo)

---

## 0. One-liner

Cosmic Playground uses a **two-layer theme**: a “museum” layer for the Astro site chrome (allowed to be atmospheric) and an “instrument” layer for demos (must be calm, readable, and consistent).

---

## 1. Goals

1. **Consistency:** every exhibit page and demo shares a recognizable visual language.
2. **Readability:** demos prioritize legibility and control affordances over “cosmic vibes”.
3. **Refactorability:** theme tokens are centralized in `packages/theme`, not scattered across apps.
4. **Accessibility:** focus visible; contrast is non-negotiable.

---

## 2. Source of truth

Theme package: `packages/theme`

### 2.1 Canonical files

- Tokens: `packages/theme/styles/tokens.css`
- Museum layer: `packages/theme/styles/layer-museum.css`
- Instrument layer: `packages/theme/styles/layer-instrument.css`
- Demo shell layout contract: `packages/theme/styles/demo-shell.css`
- Print: `packages/theme/styles/print.css`

### 2.2 Hard rule: no hardcoded colors

In `apps/site` and `apps/demos`, **do not hardcode new colors**. Use CSS variables defined in `tokens.css`:

- `--cp-bg0`, `--cp-bg1`, `--cp-bg2`
- `--cp-text`, `--cp-muted`, `--cp-faint`
- `--cp-accent`, `--cp-accent2`, `--cp-accent3`, `--cp-accent4`
- `--cp-border`, `--cp-focus`

Exceptions: tiny per-demo visualization-only colors inside `<canvas>` or SVG (document them in model notes).

---

## 3. Two-layer model

### 3.1 Museum layer (Astro site chrome)

Intent:
- atmospheric backgrounds OK (aurora glows)
- cards feel like “exhibits”
- minimal client JS; style should not require runtime JS

Mechanics:
- Set `<body class="cp-layer-museum">`
- Import:
  - `@cosmic/theme/styles/tokens.css`
  - `@cosmic/theme/styles/layer-museum.css`
  - `@cosmic/theme/styles/print.css`

Primitives:
- `.cp-card` — primary surface for cards/panels
- `.cp-badge` — tag/badge chip (use `data-tone`)

### 3.2 Instrument layer (demos)

Intent:
- calmer, flatter surfaces
- high contrast; accents only for focus/affordances/callouts
- consistent cockpit layout across demos

Mechanics:
- Root demo element must include: `class="cp-layer-instrument cp-demo"`
- Import:
  - `@cosmic/theme/styles/tokens.css`
  - `@cosmic/theme/styles/layer-instrument.css`
  - `@cosmic/theme/styles/demo-shell.css`

Primitives:
- `.cp-panel`, `.cp-panel-header`, `.cp-panel-body`
- `.cp-stage` (center visualization container)
- `.cp-drawer` (bottom drawer in stage column)
- `.cp-callout` with `data-kind="model"` or `data-kind="misconception"`

---

## 4. Demo shell (“instrument”) layout contract

Every demo must provide these regions inside `.cp-demo`:

```html
<div class="cp-layer-instrument cp-demo">
  <aside class="cp-demo__controls cp-panel">...</aside>
  <section class="cp-demo__stage cp-stage">...</section>
  <aside class="cp-demo__readouts cp-panel">...</aside>
  <section class="cp-demo__drawer cp-drawer">...</section>
</div>
```

Semantics:
- controls/readouts should have ARIA labels
- stage should have an `aria-label` describing the visualization

Responsive:
- Desktop: 2 columns (controls left; stage column right with readouts + panels below the stage).
- Under 980px: stacks to a single column with the stage first (no JS required).

---

## 5. Accent usage (including magenta)

Accents are for **small, meaningful emphasis**:
- focus rings
- selected tags/filters
- “misconception” callouts (magenta: `--cp-accent4`)
- a small number of badges (avoid rainbow UI)

Avoid:
- large magenta backgrounds
- magenta body text
- low-contrast text on tinted backgrounds

---

## 6. Print rules

Station cards must print cleanly:
- Chrome should be hidden using `.cp-no-print` and/or `nav` rules in `print.css`.
- Printed output must be black-on-white, with borders preserved.

---

## 7. TypeScript helpers (optional)

`packages/theme/src` provides:
- `CSS_VARS` (canonical CSS var names)
- `setCosmicLayer()` / `getCosmicLayer()` utilities

Use these only when a runtime toggle is needed; default should remain static classes.
