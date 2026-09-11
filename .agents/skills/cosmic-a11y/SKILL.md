---
name: cosmic-a11y
description: Use when auditing or changing Cosmic Playground interactive UI for accessibility — keyboard operation, focus visibility, screen-reader announcements, disabled-state clarity, contrast on real backgrounds, reduced motion and phone reflow — across Astro pages and Vite demos; accessibility defects block launch-ready.
---

# Cosmic accessibility

Read `.agents/references/invariants.md` first. WCAG 2.2 AA is the bar; the PRD's launch gate requires
0 open P0/P1 accessibility regressions (`docs/specs/cosmic-playground-prd.md`, section 6.1).

## Checks, in order

1. **Keyboard.** Tab through every control, drawer, dialog and mode switch. Every slider must move with
   arrow keys. Snap-to-value logic applied on every `input` pulls each 1-deg step back (moon-phases);
   snap only when moving toward the target, or on pointer release.
2. **Focus.** Visible `:focus-visible` on everything interactive. `overflow: hidden|clip` on a container
   can clip the ring; inset it. Disabled controls leave the tab order.
3. **Announcements.** Headline results reach `#status` via `setLiveRegionText` on `change`, not on
   `input` and not in a render loop (see `cosmic-demo-contracts`). Test the text, not the attributes.
4. **Disabled state.** A disabled slider must look disabled (the theme has no disabled range style yet)
   and say why, e.g. a hint linked by `aria-describedby` ("Choose Custom to edit").
5. **Contrast.** Measure against the actual ground each token sits on (panel, card, readout), not only
   `--cp-bg0`. A value on a data-dependent canvas ground needs its own check.
6. **Reduced motion.** With `prefers-reduced-motion: reduce`, nothing auto-animates; the global override
   in `animations.css` must not be defeated by inline styles.
7. **Reflow.** No sideways scrolling at 320px on museum pages and on `/play/<slug>/` (see
   `cosmic-verification` for how to measure).
8. **Dialogs.** Accessible name, focus moves in and returns, Escape closes; tours must not block the page
   (eos-lab's first-visit overlay hides 21 of 23 tab stops — audit U3).

## Shells actually in use

`data-shell="viz-first"` (6 demos) and `data-shell="triad"` (3); the other demos use the default shell.
Check whichever the demo uses.

## Red flags — stop

- A test that asserts ARIA attributes but never that the region receives text.
- A gate that tests for a control by an id that does not exist (the count is 0 and the test passes).
- Removing a focus ring; color as the only signal; a disabled control styled like an enabled one.

## Verify

Keyboard pass by hand or Playwright `press`; `apps/site/tests/accessibility.spec.ts`,
`reflow.spec.ts`, the demo's own spec. Record severity and whether it blocks promotion
(`cosmic-readiness`).
