---
name: cosmic-ui
description: Use when building, restyling or polishing Cosmic Playground interfaces — demo stages, controls and readouts in apps/demos, site pages in apps/site, or shared tokens and components in packages/theme — where layout must hold from 1920px down to 320px, styling must come from tokens, and scientific labels must stay correct.
---

# Cosmic UI

Read `.agents/references/invariants.md` first. Pick the mode that fits the task:

- **Build** — new or reworked UI. Write a short design direction first (audience, the one relationship the
  screen teaches, one signature visual), inspect the running page, then implement.
- **Polish** — refine one demo after behaviour works. No new systems, dependencies or per-demo forks.
- **Theme** — change `packages/theme` (tokens, layers, shell, components). If it affects two or more
  demos, it belongs here, not in a demo stylesheet.

## Design system (enforced by tests and build)

- Tokens only: no hex or `rgba()` in demo CSS (`apps:no-color-literals`). Bodies use `--cp-celestial-*`.
- Instrument layer: `<canvas class="cp-starfield" aria-hidden="true">` + `initStarfield({ canvas })`;
  panels use `var(--cp-instr-panel-bg)` + `backdrop-filter: blur(8px)`.
- Readouts: label -> value -> unit, unit in `<span class="cp-readout__unit">`; units never wrap.
- Motion: `cp-slide-up` / `cp-fade-in`, respecting `prefers-reduced-motion`.
- Math in UI via KaTeX (`renderMath`), including `$L/L_{\odot}$`. Canvas tick labels are ASCII.
- Plots show real numeric axes; log axes get major and minor ticks with `10^n` labels.

## Layout rules learned the hard way

- **Vertical space is scarce, horizontal is cheap.** `width: 100%; height: auto` on a fixed-ratio SVG or
  canvas makes height grow with window width. Make stages height-driven: flex/grid column, surface
  `min-height: 0`, explicit SVG height + `preserveAspectRatio="xMidYMid meet"`. Cap a canvas by width
  (it stretches its bitmap rather than letterboxing).
- `min-height` beats `max-height`: a stage floor such as `clamp(420px, 70svh, 820px)` defeats any cap.
- A plain `1fr` track grows to its widest item. Use `minmax(0, 1fr)` and `min-width: 0` on children;
  flex rows that hold buttons and labels need `flex-wrap: wrap` (the shared `.cp-playbar` lacks both —
  the likely cause of phone overflow on several demos).
- `overflow: hidden` makes a scroll container whose grid minimum is zero (accordions collapsed to 2px);
  `overflow: clip` does not, so its minimum is its content's width (wide KaTeX inside widens the page).
- Specificity beats source order; an author `display` beats `[hidden]`. The root font is 18px, so
  1rem = 18px — probe computed values, don't assume.
- `text-transform` on an ancestor re-cases math (`nu` became "N"); the instrument layer resets `.katex`.

## Visual review loop (build and polish)

1. Screenshot 1440x900, 1280x720, 390x844 and 320x640 before changing anything; list defects with
   measurements (overlap px, contrast ratio, readouts below the fold, clipped text).
2. Exercise every control; a control that changes only its own label is a defect.
3. Implement; re-screenshot the same four sizes and compare.
4. `apps/site/tests/layout-budget.spec.ts` is a ratchet: it fails when a demo gets worse and when it
   gets better (tighten the budget).

## Red flags — stop

- Hex/rgba in demo CSS, slug-specific tokens, a new styling system during polish.
- A fixed-ratio drawing at `width: 100%` with no height bound; `1fr` holding unbreakable content.
- Hiding focus rings; animation without reduced-motion handling.
- Verifying layout with `toBeVisible()` or `scrollWidth` (see `cosmic-verification`).

## Verify

Screenshots at the four sizes; `corepack pnpm build`; site E2E (layout-budget, reflow, design contracts).
Accessibility specifics: `cosmic-a11y`.
