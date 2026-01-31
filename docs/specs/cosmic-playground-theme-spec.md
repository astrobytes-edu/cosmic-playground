# Cosmic Playground — Theme Spec v0.2

**Status:** Draft (Codex-ready)

**Owner:** Anna

**Date:** 2026-01-31

**Repo:** `cosmic-playground` (monorepo)

---

## 0. One-liner

Cosmic Playground uses a **three-layer theme**: a "museum" layer for the Astro site chrome (allowed to be atmospheric), an "instrument" layer for demos (calm, readable, consistent), and a "paper" layer for instructor-facing pages (clean light mode).

### Aurora Ink palette philosophy

The Aurora Ink palette replaces the previous blue-heavy "cosmic cliche" with a modern aesthetic:

- **Warm ink blacks** — neutral charcoal backgrounds (`#0a0a0c`) instead of blue-blacks
- **Neutral text** — clean whites (`#e8e8ec`) without blue tint
- **Teal + Pink + Violet accents** — teal for primary interactive, pink for special emphasis, violet for tertiary/categories
- **Paper mode** — a clean light theme for instructor pages and print

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
- Paper layer: `packages/theme/styles/layer-paper.css`
- Demo shell layout contract: `packages/theme/styles/demo-shell.css`
- Print: `packages/theme/styles/print.css`

### 2.2 Hard rule: no hardcoded colors

In `apps/site` and `apps/demos`, **do not hardcode new colors**. Use CSS variables defined in `tokens.css`:

- `--cp-bg0`, `--cp-bg1`, `--cp-bg2`, `--cp-bg3`
- `--cp-text`, `--cp-text2`, `--cp-muted`, `--cp-faint`
- `--cp-accent`, `--cp-accent-hover` (teal - primary)
- `--cp-pink`, `--cp-pink-hover` (pink - special emphasis)
- `--cp-violet`, `--cp-violet-hover` (violet - tertiary)
- Legacy: `--cp-accent2`, `--cp-accent3`, `--cp-accent4` (aliases)
- `--cp-border`, `--cp-border-subtle`, `--cp-focus`

Exceptions: tiny per-demo visualization-only colors inside `<canvas>` or SVG (document them in model notes).

---

## 3. Three-layer model

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

### 3.3 Paper layer (instructor-facing)

Intent:

- clean, readable light mode
- print-friendly by default
- professional appearance for handouts

Mechanics:

- Set `<html data-theme="paper">` or `<body class="cp-layer-paper">`
- Auto-applied to `/instructor/*` pages
- Manual via `?theme=paper` query param

---

## 4. Demo shell ("instrument") layout contract

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

## 5. Accent usage (Aurora Ink palette)

The Aurora Ink palette uses three accent colors for **small, meaningful emphasis**:

| Color  | Token         | Use for                                           |
| ------ | ------------- | ------------------------------------------------- |
| Teal   | `--cp-accent` | Primary interactive (links, buttons, focus rings) |
| Pink   | `--cp-pink`   | Special emphasis (goals, challenges, alerts)      |
| Violet | `--cp-violet` | Tertiary (categories, model callouts, tags)       |

Avoid:

- large pink/teal backgrounds
- accent body text
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
