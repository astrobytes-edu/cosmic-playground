# UI/UX Hardening Audit + Direction (Legacy → Cosmic Playground)

**Date:** 2026-02-01  
**Scope:** Astro museum site (`apps/site`), Vite demos (`apps/demos`), instructor + station materials (paper/print)  
**Legacy baseline (required reference):** `/Users/anna/Teaching/astr101-sp26/demos/` (read-only)

## Executive summary

Cosmic Playground has the right architecture (theme tokens + three layers + demo shell contract + runtime modals), but it is missing several *“polish multipliers”* that make the legacy demos feel finished:

- **Control affordances:** sliders look “default”, values feel disconnected from controls, and there’s little feedback for actions.
- **Surface consistency:** many pages use ad-hoc `rgba(...)` backgrounds that fight the token system (especially in paper mode).
- **Rhythm + hierarchy:** spacing/typography is close, but not yet consistently “instrument-like” across demos and “document-like” across instructor/station materials.

Direction: **Keep Aurora Ink + the instrument standard**, but port the *legacy UX behaviors* (slider progress, ripple/tap feedback, “card” controls with a label + live value, modal polish, and print-first rhythm) into the shared theme/runtime so *every demo inherits the polish* by default.

---

## Legacy UX wins to preserve (what makes it feel “polished”)

### Layout patterns
- **Single mental model:** “header → viz → readouts → controls” or “viz + controls cards” with consistent panel treatment (`demo-shell.css`, `demo-legacy.css`).
- **Max-width + predictable gutters:** content centered with a stable max width + responsive collapse (e.g. `--demo-max-width`, mobile single column).
- **Control cards:** every slider lives in a “card” with a **label + live value** and optional **scale hints**.

### Typography + spacing
- Strong **title/subtitle rhythm** (centered, clear hierarchy).
- Consistent **small caps/uppercase labels** for panels/readouts.
- Plenty of **micro whitespace** (tight but not cramped); consistent row gaps.

### Interaction behaviors (biggest polish multipliers)
- **Slider progress fill** (the “track” visually shows current value) + thumb hover/active states (`astro-theme.css` + `AstroUtils.updateSliderProgress`).
- Optional **slider tooltip** while interacting (`data-tooltip-source` pattern + `demo-polish.js`).
- **Ripple feedback** on buttons/chips and subtle active states (`demo-polish.js`).
- **Modal UX** (Help/Station): solid spacing, close button, focus handling, print path (`demo-modes.css`).

### Responsiveness + accessibility
- “Just works” down to narrow screens: grids collapse, controls wrap, and interaction targets stay ≥44px.
- Visible focus for all interactive controls; keyboard shortcuts documented.
- SR-only live regions used for status announcements.

---

## Current Cosmic Playground gaps (new vs legacy) — by category

### Layout
**New:** demos have a solid cockpit grid via `packages/theme/styles/demo-shell.css`, but variation support is implicit (per-demo CSS) and some demos need different emphasis (viz-first vs controls-first).  
**Legacy win:** predictable layout variants with the same spacing rules.

### Typography + spacing
**New:** tokens exist (`packages/theme/styles/tokens.css`), but site/demos frequently override with ad-hoc values and repeated inline styles.  
**Legacy win:** nearly everything derives from a small set of spacing + type rules.

### Interactive affordances
**New:** buttons are mostly fine, but demos rely on a custom `.cp-action` (duplicated) and sliders/selects are styled per-demo with inconsistent behavior.  
**Legacy win:** one slider style + progress fill everywhere; action feedback everywhere.

### Keyboard/focus
**New:** runtime dialogs implement focus trapping and Escape-to-close (`packages/runtime/src/demoModes.ts`), but focus styling and “target size” are inconsistent across demos and the Astro site form controls.  
**Legacy win:** everything interactive looks interactive *and* focusable.

### Modals/panels
**New:** runtime modal layout is good, but visuals are still “unstyled util” compared to legacy (table/action button polish, spacing, and print affordance).  
**Legacy win:** modal looks like a real product surface.

### Responsiveness/adaptability
**New:** demo shell stacks under `1024px`, but there’s no first-class way to choose a different emphasis (e.g. fullscreen stage, text-forward lab mode).  
**Legacy win:** each demo can shift emphasis while keeping the same design language.

### Motion
**New:** reduced-motion is respected in a few places; overall motion is minimal.  
**Legacy win:** micro-interactions are present but optional, and can be disabled.

### Accessibility
**New:** strong base (tokens, focus-visible, runtime dialog trap). Biggest risk is regressions from ad-hoc styling and missing semantic patterns (labels, legends, aria for non-native controls).  
**Legacy win:** ARIA + SR-only patterns applied consistently.

---

## Prioritized problems + concrete fixes (with file targets)

### P0 — “Everything inherits polish” (shared controls + surfaces)

1) **Eliminate ad-hoc dark `rgba(...)` surfaces on paper pages** (instructor + stations) so paper mode is truly paper.
   - `apps/site/src/layouts/Layout.astro` (apply paper mode automatically on `/stations/*` as well as `/instructor/*`)
   - `apps/site/src/pages/stations/[slug].astro` (replace hardcoded dark backgrounds/borders with token-based surfaces)
   - `apps/site/src/pages/instructor/[slug].astro` (same; nav + blocks should use `var(--cp-bg*)` not `rgba(0,0,0,…)`)

2) **Unify form control styling for the Astro site** (FilterBar currently reimplements inputs/selects).
   - `apps/site/src/styles/global.css` (import `@cosmic/theme/styles/components/form.css`)
   - `apps/site/src/components/FilterBar.astro` (use `.cp-input` / `.cp-select` + remove duplicated styles)

3) **Add a shared slider style + progress fill for demos** (legacy polish win).
   - `packages/theme/styles/components/form.css` (extend with a `.cp-range` style and webkit/firefox track rules)
   - `packages/runtime/src/index.ts` (auto-init slider progress updates for all `input[type="range"]` in demos, or provide a helper invoked by all demos)
   - `apps/demos/src/shared/stub-demo.css` (stop per-demo slider/select re-styling; rely on shared styles)

4) **Provide button “tap feedback” (ripple or equivalent) across demos** with reduced-motion support.
   - `packages/runtime/src/index.ts` (or a new `packages/runtime/src/polish.ts`) to attach ripple to `.cp-button` / `.cp-action`
   - Ensure: respects `prefers-reduced-motion: reduce`

### P1 — Demo “shell variants” (variation without chaos)

5) **Introduce 2–3 shell variants that only change layout emphasis** (not component styles).
   - `packages/theme/styles/demo-shell.css` (add variant selectors via class or `data-shell`)
   - Demo opt-in via root: `#cp-demo` (e.g. `data-shell="viz-first"`)
   - Apply to geometry demos first:
     - `apps/demos/src/demos/angular-size/index.html`
     - `apps/demos/src/demos/eclipse-geometry/index.html`
     - `apps/demos/src/demos/seasons/index.html`
     - `apps/demos/src/demos/moon-phases/index.html`
     - `apps/demos/src/demos/binary-orbits/index.html`

### P1 — Callouts + readouts consistency

6) **Standardize callout “kinds” and styling** (tip/activity/model/misconception) so demos + station/instructor pages share a visual language.
   - `packages/theme/styles/layer-instrument.css` (define `.cp-callout[data-kind="tip"]`, `data-kind="activity"` in addition to existing kinds)
   - `apps/demos/src/demos/*/index.html` (ensure `data-kind` values match the supported set)

7) **Move readout card styling out of `stub-demo.css` into theme** so readouts look consistent everywhere.
   - `packages/theme/styles/components/…` (new `readout.css` or extend existing)
   - `apps/demos/src/shared/stub-demo.css` (remove duplicated `.cp-readout` styling once theme has it)

### P2 — Prose + tables for instructor/station materials

8) **Add “paper prose” rules** for markdown content (headings, lists, tables, blockquotes/callouts) so instructor/station pages look like real handouts.
   - `packages/theme/styles/layer-paper.css` (or a new `packages/theme/styles/components/prose.css`)
   - `apps/site/src/pages/stations/[slug].astro` and `apps/site/src/pages/instructor/[slug].astro` (wrap rendered content in a `.cp-prose` container)

### P2 — Exhibit embed ergonomics

9) **Make the embedded demo feel more integrated and responsive** (and improve fallback affordances).
   - `apps/site/src/components/IframeStage.astro` (token-based surfaces; consider a slightly taller default aspect ratio for “instrument” UIs)
   - `apps/site/src/pages/exhibits/[slug].astro` (launch controls grouping + spacing)

---

## “Definition of polished” for this hardening pass

When you open any `/play/<slug>/` demo:
- Buttons and sliders look like part of the same instrument family.
- Sliders show progress; values feel connected to controls.
- Actions provide feedback (copy results, mode toggles) without visual noise.
- Layout adapts cleanly on narrow screens *without custom per-demo CSS hacks*.

When you open `/stations/<slug>/` or `/instructor/<slug>/`:
- Default appearance is paper-like, readable, and prints cleanly.
- Blockquotes/callouts, tables, and KaTeX display math look intentional (not “unstyled markdown”).

