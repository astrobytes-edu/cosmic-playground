# Layout audit: every demo, 1440x900

**Date:** 2026-09-04
**Method:** each `/play/<slug>/` loaded at 1440x900 (a common laptop), measuring the
sidebar's scroll overflow and how many `.cp-readout` elements sit below the fold.
**Verdict:** systemic. **15 of 20 demos** had at least one readout below the fold.

---

## Why this went unnoticed

The project has ~1,000 E2E tests and every demo's spec asserts that its readouts contain
the right **text**. Not one looked at **geometry**. A readout can hold a perfectly correct
number 3,000px below the viewport and every test passes.

It surfaced only because a reader said they had to drag the page to see one number.

## The measurement, before any fixes

| Demo | Sidebar content | Overflow | Readouts below fold | First at |
| --- | ---: | ---: | ---: | ---: |
| binary-orbits | 3,889px | 3,070 | 46 / 48 | y=3388 |
| eos-lab | 1,505 | 686 | 22 / 22 | 1734 |
| galaxy-rotation | 1,302 | 483 | 22 / 22 | 849 |
| doppler-shift | 1,162 | 343 | 20 / 26 | 1153 |
| keplers-laws | 1,943 | 1,124 | 17 / 19 | 913 |
| conservation-laws | 791 | 0 | 12 / 12 | 1142 |
| planetary-conjunctions | 599 | 0 | 12 / 12 | 1142 |
| spectral-lines | 744 | 0 | 12 / 12 | 1030 |
| stars-zams-hr | 2,997 | 2,178 | 10 / 10 | 1454 |
| seasons | 859 | 40 | 10 / 10 | 913 |
| telescope-resolution | 953 | 159 | 8 / 8 | 1191 |
| blackbody-radiation | 1,120 | 326 | 4 / 4 | 886 |
| retrograde-motion | 578 | 0 | 4 / 12 | 920 |
| parallax-distance | 1,869 | 1,050 | 2 / 16 | 915 |
| eclipse-geometry | 1,119 | 325 | 0 / 12 | — |
| **clean:** angular-size, cluster-census, em-spectrum, hydrostatic-equilibrium-explorer, moon-phases | | 0 | 0 | — |

The sidebar's box is 819px. Everything above that is hidden behind an inner scrollbar,
which is why nobody noticed: the panel looks finished and the rest is simply gone.

## What actually fills these sidebars

The obvious suspect was the controls. It is mostly **not** the controls.

| Demo | Largest sidebar children |
| --- | --- |
| binary-orbits | `cp-notice.rv-challenge-panel` **878px**, `cp-notice.cp-predict-panel` **870px**, `cp-live-insight` 295px |
| stars-zams-hr | four `control-card` sections: **905 + 774 + 602 + 373 = 2,654px** |
| keplers-laws | a long stack of `cp-field` blocks, largest 260px |
| parallax-distance | `cp-field` + `cp-callout` blocks, largest 240px |

**The pattern is prose.** Explanatory panels, challenge cards, live-insight boxes and
callouts are being stacked into a *control* sidebar. The shell already has a `drawer` /
`shelf` area for exactly this content, and these demos do not use it for it.

## What has been fixed

**cluster-census** — full pass, as the worked example. Readouts, the population tally and
the star inspector moved into a strip inside the stage grid; the stage became
height-driven rather than three stacked aspect ratios summing to 1,004px. Sidebar content
1,421px -> 534px, zero readouts below the fold at four viewports. See STATUS.md.

**A shared `.control` component** (`packages/theme/styles/components/control.css`).
`.control { display: grid; gap: 8px }` had been copy-pasted into fifteen demos, stacking
label / input / value on three rows and spending a whole row on one number. Hoisting the
value onto the label's line removed **836px across nine sidebars**:

| Demo | Saved |
| --- | ---: |
| galaxy-rotation | 161px |
| eos-lab | 146 |
| binary-orbits | 125 |
| conservation-laws | 90 |
| eclipse-geometry | 83 |
| telescope-resolution | 82 |
| spectral-lines | 75 |
| blackbody-radiation | 37 |
| planetary-conjunctions | 37 |

Two findings from doing it, both from measuring rather than reading:

- The rule **must not apply to a control with no `.control__value`**. Forcing two columns
  on one pushes its input into the narrow auto column. stars-zams-hr's text and number
  fields did exactly that and its sidebar got **88px longer**; the fix is the `:has()`
  scope now in the component.
- `doppler-shift` and `seasons` use the value cell as a full-width flex row of its own.
  They opt out with `.control--stacked` and keep their old layout.

## binary-orbits, fixed

The worst case. Before, at 1440x900: **3,764px of sidebar in an 819px box, hiding 2,945px**
behind a nested scroller with no affordance -- including `#predictPanel` at y=1,957 and
`#rvChallengePanel` at y=2,907 *within that scroller*. 1,748px of teaching activity a
reader would never find.

| | Before | After |
| --- | ---: | ---: |
| Sidebar content hidden | 2,945px | 601px |
| Readouts shown | 23, every view | 8-13, per view |
| Readouts below the fold | 46 of 48 | 9 of 24 |
| Readouts area | 2,252px | ~440px |
| Page height | 3,717px | 1,592-1,833px |
| Integrity panel | 922px in a 226px column | ~100px, spanning the grid |

What was done:

- **The two activities and the invariant quiz moved to the drawer** as accordions. They
  are exercises, not controls.
- **Readouts are filtered by view.** `state.view` used to toggle only the plots, so the
  orbit view showed mass functions and RV semi-amplitudes for a curve that was not drawn.
  Each readout now declares its views in `data-views`; a few (the period, the momentum
  check) legitimately belong to several.
- **The spectroscopy-mode and spectrum-element pickers** are shown only in the spectrum
  view, where they do anything. 450px of sidebar in the other three.
- **`#integrityPanel` spans the readout grid** instead of wrapping to 922px inside one
  226px column. It is the demo's thesis and it was the worst-laid-out thing on the page.
- **The stage is height-driven.** `#orbitCanvas { aspect-ratio: 4/3 }` is an id selector
  that ignores the viewport, and `min-height: clamp(440px, 72svh, 860px)` beat the
  max-height that was meant to cap it -- **min-height wins over max-height in CSS**, so
  capping alone did nothing.

### A layering bug this uncovered

Moving an activity into the drawer made it **unclickable**. The sidebar is `position:
sticky` with `z-index: 3`; the drawer is `z-index: 2` and spans both columns, so a button
in the drawer's left ~360px receives no clicks -- `elementFromPoint` returns a sidebar
chip instead. This has been true for every demo since the shell was written; nobody noticed
because the drawer only ever held prose. The project's own E2E notes had recorded the
symptom as a test quirk to work around with `force: true`, which hid it.

Raising the drawer above the sidebar was measured and **rejected**: it makes every sidebar
control, sliders included, unclickable once the drawer is in view, which is worse. The two
comments in `demo-shell.css` disagreed about which should win; the sidebar's was correct.
The fix is to stop the overlap -- interactive drawer content is now inset past the sidebar
column -- and both are reachable.

## What has not been fixed

Everything else. The remaining work is per-demo and structural: moving prose out of
control sidebars into the drawer, and giving readouts a strip that shares the stage's
height budget.

It is gated rather than forgotten. `apps/site/tests/layout-budget.spec.ts` is a **ratchet**:
it records what each demo does today, fails if any demo gets worse, and fails just as
loudly if one gets better — because then the budget should be tightened. Each fix removes
a line. When the map is empty the problem is gone.

## Suggested order

1. ~~**binary-orbits**~~ — done, above.
2. **stars-zams-hr** — 2,654px of control cards; also still carries the ZAMS clamping
   defect from the 2026-09-03 audit, so it wants one combined pass.
3. **keplers-laws**, **parallax-distance** — `cp-field` stacks.
4. The rest, where the overflow is a few hundred pixels and a readout strip is most of the
   answer.
