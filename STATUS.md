# Cosmic Playground — status

next: parallax-distance and keplers-laws are done; continue down docs/reviews/2026-09-04-layout-audit.md -- eos-lab (14 readouts below the fold), galaxy-rotation (22), doppler-shift (20), then conservation-laws, planetary-conjunctions, spectral-lines, seasons, telescope-resolution, blackbody-radiation, retrograde-motion, eclipse-geometry. The sidebars themselves are the next class of problem: keplers-laws still hides 844px and parallax-distance 882px of controls behind an inner scrollbar, which no demo-level fix has touched yet. Also open: port the progenax/startrax cross-validation fixtures for the IMF and cluster models (the lifetime and ZAMS ones landed 2026-09-04); then the star-cluster dynamics demo. Also open: explore's filters are inert in the static build, instructor bundles for cluster-census + stars-zams-hr, and the novascope "lens" control grouping (docs/reviews/2026-09-04-novascope-port-survey.md)
blocker: none — cluster-census shipped 2026-09-04 (20th demo) and had a UI/UX pass the same day; typecheck/build/invariants green
due:

## Current focus
_Seeded 2026-06-07 by the brain STATUS.md convention (`~/brain/work/meta/status-convention.md`). Update in your cosmic-playground session; the brain pulls `next:`/`blocker:`/`due:` via `federate.py`._

Research-grade interactive demos (physics unit-tested), deployed live, used in ASTR 101/201. Cottrell EdTech instrument.

## Open
- [ ] (no empirical learning data yet — assessment plan via CRMSE)

## cluster-census UI/UX pass, 2026-09-04

Prompted by "it looks horrible ... make it more like novascope". Comparing the two
*components* rather than the two physics packages found the gap; see the new section in
`docs/reviews/2026-09-04-novascope-port-survey.md`.

- **The HR diagram was a plotted function, not a population.** Every star sat exactly on
  the ZAMS, and ageing the cluster *deleted* stars off the top rather than bending them
  into a giant branch. `postMainSequenceTrack` + `totalLifetimeMyr` now put them on a
  schematic branch. Two of its three timescales are Hurley's own and were already in the
  module; the shape is textbook. Revised physics review in `docs/reviews/cluster-census.md`.
- **The draw floor moved from 0.08 to 0.1 Msun**, the ZAMS model's own floor, so every star
  drawn is one the model can place. Previously ~11.5 percent of each cluster was rendered
  as hollow rings meaning "no HR point". Clamping stays rejected — that is the
  `stars-zams-hr` defect. The missing sliver is now stated in prose.
- **Cross-panel selection.** One selection id drives both the cluster panel and the HR
  diagram, with a hover/pin inspection card. Reachable by keyboard (arrow keys step by
  mass, Escape clears), which the novascope original does not offer.
- **Axis titles are HTML KaTeX** positioned around the canvas; only tick labels stay on
  the canvas, now with real superscripts (written as `\uXXXX` escapes so
  `validate-math-formatting` still sees ASCII source).
- **Derived slope.** `highMassSlopeFromEnvironment` (Jerabkova+2018) had been ported and
  left with no caller. A "derive alpha" lens now drives it from metallicity and cluster
  mass, so the mass function stops being a dial and becomes a consequence.

### three.js, and a correction

The cluster panel is now a three.js scene (`clusterScene.ts`): additive-blended glow
sprites, orbit/zoom/pan via `OrbitControls`, and a 2D/3D toggle where 2-D is the same scene
under an orthographic camera rather than a second renderer.

**I got the earlier three.js call wrong.** The brief was "install relevant packages
(three.js, etc.) to make CP SOTA"; the 2026-09-04 survey answered "do the *physics* ports
require three.js", concluded no, and reported that as the answer. Different question. The
survey now carries the correction.

Worth knowing for the next 3-D demo:

- The look novascope gets is **additive blending plus a per-star radial glow**, not
  three.js -- its own cluster field is Canvas 2D. But its renderer has to drop most stars
  to plain squares to stay smooth under orbit, because a gradient per star per frame is
  too expensive. In a fragment shader every star gets the falloff at N = 20,000.
- three's stock size attenuation assumes a scene measured in units of ~1. This one is in
  tens of parsecs, where the same constant magnifies sprites ~19x. Normalise to the
  camera's focal distance.
- `OrbitControls` zooms a perspective camera by moving it and an orthographic one via
  `camera.zoom`. A reset that only repositions cameras half works.
- Cost: 562 KB for this demo's chunk (~130 KB gzipped), code-split so no other demo pays.
  A browser without WebGL loses the one panel, not the instrument.

### Theme fix with repo-wide reach

`[hidden] { display: none !important }` added to `tokens.css`, and it immediately found a
real one: **keplers-laws was showing its Newton velocity and force vectors with an inline
`display` while leaving the markup's `hidden` attribute in place**, so assistive technology
was told those overlays did not exist while they were on screen. `setSvgVisible` now
toggles the attribute. The three E2E tests covering those overlays asserted
`el.style.display === "none"` -- the very line that caused the bug -- so they passed
throughout; they now assert visibility *and* that `hidden` agrees with it. Same pattern as
[[tests-encode-defects]].

The rule itself: An author `display` rule
beats the UA's `[hidden]` rule regardless of specificity, so `element.hidden = true` was
silently doing nothing on any styled container — the DOM said hidden and the pixels
disagreed. The theme had already patched this twice per-component
(`.cp-tab-panel[hidden]`, `.cp-popover[hidden]`); a scan found **26 element/rule pairs
across 14 demos** exposed to the same failure. Guarded by a token test.

## cp-field hoist, 2026-09-04

`.cp-field__value` stacked label / value / hint on separate rows, the same defect the
shared `.control` component fixed, in different markup. Hoisted in the theme with the same
`:has()` scoping: **275px off keplers-laws and parallax-distance**, no change to the other
four demos that use `.cp-field` without a value, zero errors.

## The layout ratchet was measuring the wrong thing, 2026-09-04

It filtered readouts with `getBoundingClientRect().height > 0`, and its own comment claimed
this excluded content inside a collapsed `<details>`. It does not. Chromium hides a closed
details' contents with `content-visibility: hidden`: painting and descendant layout are
skipped, but the element keeps a box and still reports a rect. keplers-laws' closed
Conservation accordion measures **189x582 while `checkVisibility()` returns false**.

So the ratchet had been counting readouts the reader had not opened. Three demos were
over-reported: **binary-orbits 9 -> 1, eos-lab 22 -> 14, keplers-laws 17 -> 7**. Once the
predicate was right the ratchet caught all three itself, by failing for being *better* than
its budget.

Worth keeping: `getBoundingClientRect()` is not a visibility test. `checkVisibility()` is.

## keplers-laws and parallax-distance, 2026-09-04

Both had the same shape of problem and the same root cause, which the previous session had
diagnosed but not fixed: **an SVG with a viewBox and `height: auto` is width-driven.** Its
intrinsic aspect ratio sets its height, so capping an ancestor does not shrink it -- it
just lets `overflow: hidden` cut the bottom off, 317px of orbit measured.

Three rules invert that, and they are the reusable part:

1. the stage is a flex (or grid) column, so its children divide a bounded height;
2. the surface takes what is left and **may shrink** -- `min-height: 0`, without which a
   flex item refuses to go below its content size;
3. the SVG gets an explicit height, leaving nothing for the ratio to decide.
   `preserveAspectRatio="xMidYMid meet"` then letterboxes it: never cropped, never
   distorted. Dragging still lands correctly because the pointer mapping already went
   through `getScreenCTM().inverse()`, which accounts for letterboxing.

**keplers-laws: 7 readouts below the fold -> 0**, at 1920x1080, 1440x900, 1366x768 and
1280x720. The reserve the stage subtracts from the viewport is a single number because the
readouts panel is now 254px at all four: the Friendly/Advanced switch moved into the panel
header (as a grid cell it stretched to two 91x101px buttons to choose a detail level), and
the Conservation disclosure spans the full row beneath the cards. That disclosure had been
clipping its own meta to "ene".

**parallax-distance: 2 below the fold at 1440 and 6 at 1366/1280 -> 0** at all four. Two of
the strip's eight cards now read as sub-lines of the number they qualify -- the Jan-Jul
shift under the parallax it doubles, the quality verdict under the signal-to-noise it
grades -- which took the strip from 359px to 242px. Eight content-sized cards in a wrapping
flex row packed raggedly: 214 + 307 + 221px on one row, a single 415px card on the next.

Four things I got wrong on the way, all found by measuring:

- **The root font-size in this project is 18px, not 16.** Every rem is 1.125x what a px
  reading suggests, which silently invalidated two rounds of column arithmetic. `10.5rem`
  is 189px.
- **`justify-self: stretch` beats `aspect-ratio`.** A grid item with an auto width is
  stretched to its area by default, so a 4:3 schematic came out 467x519 -- portrait.
- **`max-height` on a replaced element is the primitive that shrinks it**, unlike a cap on
  its container. Chromium keeps a specified `width: 100%` rather than shrinking it to
  preserve the ratio, so the box letterboxes horizontally instead.
- **The stage sizes as `content-box`**, so padding and border sit outside a set `height`.

Two changes I tried and reverted rather than ship on mixed evidence:

- **Gridding the shared `.cp-readout-strip`** (ten demos). Equal columns pack better but
  force wrapping: measured across four widths it won at 1366 and 1440, lost at 1920, and
  tied at 1280. Not worth changing ten demos for.
- **Shortening "Inferred parallax uncertainty" to a sigma glyph** to save a line. A design
  contract caught it -- that wording exists to distinguish the *inferred* uncertainty from
  the `sigma_meas` the reader sets, and the test was written to stop exactly that
  shortening. Kept the wording, found the space elsewhere.

## stars-zams-hr: colour, then layout, 2026-09-04

**Colour.** I told you 30.3 percent of the population pegged at B-V = 2.2. That was my
error: the filter was `>= 2.2`, which counts cool stars, not stars stuck on an endpoint.
Measured properly the worst pile-up was 0.8-3.0 percent, and the bisection saturation had
already been fixed before this session.

Checking did find a real error, though. Ballesteros (2012) is calibrated over roughly
3,000-10,000 K, and inverting it below that returned colours about **0.46 mag too red** --
our coolest star (2,812 K) came out at B-V = 2.37 where no real M dwarf is redder than
about 2.2. Above 21,707 K it could not reach at all and returned its bracket endpoint of
-0.4, bluer than any real star.

Replaced with the Pecaut & Mamajek dwarf sequence -- the same table that already names the
spectral types, so one source of truth again. The Sun now comes out at B-V = 0.650
exactly, the coolest dwarf at 1.91, and the hot end at -0.33 (O5V).

**Layout.** Sidebar hidden **2,178px -> 25px**; zero readouts below the fold at 1920x1080,
1440x900 and 1366x768. Start Here and the Inference Log moved to the drawer; the 905px
Selected Star card became a strip under the plot. This demo defines its own grid
(`"viz sidebar" / "shelf shelf"`, controls on the right) and had **no `readouts` row at
all**, so the strip first landed in an implicit row below the drawer.

A new E2E spec caught something worth having: at 1280x720 the stage's `overflow: hidden`
was **clipping 55px off the bottom of the diagram**, axis and all. Below 745px of viewport
height the demo now keeps its natural layout and the page scrolls, which is the honest
trade.

It was the only demo of the twenty with no dedicated E2E spec. Two of the tests I first
wrote for it asserted `typeof text === "string"` and that the canvas was still visible --
neither could fail. Replaced with one that compares the canvas to itself across a control
change, which is the strongest thing E2E can say about a plot it cannot read back.

## One source of truth for the stellar physics, 2026-09-04

Both star demos now take their shared physics from the same place, and it is gated against
an external reference.

- **startrax parity.** `packages/physics/src/__fixtures__/stellar-startrax.json` is a
  committed dump of startrax's own Tout (1996) ZAMS and Hurley (2000) lifetime at ten
  masses; 42 tests assert our ports reproduce it to a part in a thousand. This closes the
  gap the cluster-census review named as its largest.
- **One main-sequence lifetime.** The HR population model carried a private
  `10 * M^-2.5`; it disagreed with Hurley by **33x at 100 Msun**. Unified, with tests that
  stop the shortcut reappearing.
- **One post-main-sequence track**, extended to cover white dwarfs and supergiants so the
  richer demo keeps what it needs. The old private version clamped its cooling phase to
  exactly 1, so **every white dwarf came out at 15,400 K** -- the cooling sequence, one of
  the three structures that demo asks readers to identify, was a single point. It is a
  real sequence now: 81,000 K down to the observed luminosity-function cutoff at 3,900 K,
  at constant radius. IFMR from Cummings et al. (2018); cooling from Mestel (1952).

Two mistakes of mine worth recording:

- I scoped binary-orbits' "Spectroscopy mode" control to the spectrum view **from its
  label**, without checking what it does. SB1/SB2 decides whether the RV panel draws one
  curve or two, so it belongs to the RV view as well; a screenshot test caught it.
- The `-visual-` screenshot baselines were swept into commit 7dd9b81 by a blanket
  `git add -A` after I had said I would leave them out, and I then regenerated them while
  the layout was mid-fix. They are correct now and committed deliberately.

## binary-orbits fixed, 2026-09-04

Worst demo in the audit. Sidebar hidden content **2,945px -> 601px**; readouts **23 in
every view -> 8-13 filtered by view**; page **3,717px -> ~1,700px**. Activities and the
invariant quiz moved to the drawer, the integrity panel given the full grid width, the
stage made height-driven. Detail in the audit doc.

Two things worth remembering:

- **min-height beats max-height in CSS.** The stage carried `min-height: clamp(440px,
  72svh, 860px)`, so capping it with max-height did nothing at all -- the computed max was
  504px, the min 648px, and the stage stayed 682px. Both have to move.
- **The drawer has been unclickable under the sticky sidebar since the shell was written.**
  Sidebar `z-index: 3`, drawer `z-index: 2`, and the drawer spans both columns, so a button
  in its left ~360px gets no clicks. Nobody noticed because the drawer only held prose. The
  project's own E2E notes recorded the symptom as a test quirk to work around with
  `force: true`, which hid it. Raising the drawer was measured and rejected -- it makes
  every sidebar control unclickable instead, which is worse. Interactive drawer content is
  inset past the sidebar column now, and both are reachable.

## Project-wide layout audit, 2026-09-04

Full measurement of all 20 demos at 1440x900 in
`docs/reviews/2026-09-04-layout-audit.md`. **15 of 20 had at least one readout below the
fold.** binary-orbits had 46 of 48, the first at y = 3,388, in a sidebar holding 3,889px of
content in an 819px box.

It went unnoticed because ~1,000 E2E tests all assert readout **text** and none looked at
**geometry**: a readout can hold a perfectly correct number 3,000px below the viewport and
every test passes.

**It is mostly not the controls.** It is prose -- challenge panels, live-insight boxes,
callouts and control cards stacked into a *control* sidebar, when the shell already has a
drawer for exactly that content. binary-orbits alone has 1,748px of it in two panels.

Two things landed:

- **`packages/theme/styles/components/control.css`.** `.control { display: grid; gap: 8px }`
  had been copy-pasted into fifteen demos, stacking label / input / value on three rows.
  Hoisting the value onto the label's line removed **836px across nine sidebars**. It must
  be scoped with `:has(> .control__value)` -- forcing two columns on a control with no
  value pushes its input into the narrow auto column, which made stars-zams-hr's sidebar
  88px *longer* before the scope went in. `doppler-shift` and `seasons` opt out via
  `.control--stacked`.
- **`apps/site/tests/layout-budget.spec.ts`, a ratchet.** It records what each demo does
  today, fails if any gets worse, and fails just as loudly if one gets better -- because
  then the budget should be tightened. Each fix removes a line; when the map is empty the
  problem is gone.

## cluster-census layout pass, 2026-09-04

Prompted by "tighten the sidebar ... don't have to drag the whole page to see one number".
Measured first, at 1440x900:

| Element | Top edge | On screen? |
| --- | --- | --- |
| "Heaviest star" | 931px | no (viewport ends at 900) |
| Turnoff / total mass / radius | 1039 / 1147 / 1255 | no |
| Population tally | 1351px | no |

The sidebar held **1,421px of content in an 870px column**, and the reseed hint said "watch
the heaviest star" 900px above the number it named. Nothing caught it because no test was
looking at geometry.

What changed:

- **Readouts moved out of the sidebar into a strip under the plots**, along with the tally
  (now inline chips) and the star inspector. It lives *inside* the stage grid rather than
  the shell's `readouts` area, because that area is a sibling row of `viz` and cannot be
  height-coupled to it -- and the point is that one max-height bounds the plots and the
  numbers describing them together.
- **The stage is height-driven** rather than three stacked aspect ratios that summed to
  1,004px whatever the window was. Floors go on the drawing surfaces, not the grid rows: a
  row floor also has to cover the panel title, which left the histogram 88px of canvas.
- **Each slider's value sits on its label's line.** Explicit `grid-row`, because the slider
  is between them in the DOM and auto-placement puts the value on a third row.
- Sidebar content is now **586px**. The live-region status line was being clipped
  mid-sentence by the old overflow; it is `sr-only` now, since the strip says the same
  thing visually.
- Smaller honesty fixes: the turnoff's `Msun` unit disappears with the number when it reads
  "not yet"; the extrapolated count hides itself at zero; the histogram's canvas legend is
  gone, because no corner of that plot is reliably empty -- which corners are empty is
  exactly what the reader is changing -- and the panel subtitle already said it.

**Eight new E2E tests assert the layout budget** across 1920x1080 / 1440x900 / 1366x768 /
1280x720: every readout on screen, no sidebar overflow, and no panel collapsed below a
readable height.

## Finding: the E2E suite is flaky under parallel load

Three consecutive full runs of the 1,001-test suite each ended with **exactly one failure,
and a different one each time**:

| Run | Failure | Isolated re-run |
| --- | --- | --- |
| 1 | `keplers-laws renders with resolved canvas colors and animates` | genuine, fixed |
| 2 | `eos-lab composition constraints keep X + Y + Z = 1` | 31/31 pass |
| 3 | `site-links every built page is reachable` | 3/3 pass |

Runs 2 and 3 pass in isolation and pass as their whole spec file, so those are flakes, not
regressions. Run 1 was real and is fixed.

This is not new and was not introduced by the 2026-09-04 work, but it has been invisible
because a suite that reports "1 failed" is easy to re-run until green. It matters because
it makes every full-suite result ambiguous: a real single failure is indistinguishable from
the flake without a second run. Worth a pass to find the shared cause -- most likely
timing under `--workers` contention.

## Findings recorded 2026-09-04

- **Explore's filters do nothing in production.** `apps/site` builds with `output: "static"`,
  so `Astro.url.searchParams` is empty at build time and `explore/index.astro` renders one
  unfiltered page. Topic, level, time, status, math, quick-filter, sort and search are all
  computed server-side from params that never arrive; `/explore/?topic=Orbits` returns the
  same 19 cards as `/explore/`. The active-filter chips never render either. `smoke.spec.ts`
  appeared to cover this but only asserted that *some* `.cp-chip` is visible, which the
  quick-filter row always satisfies. Fix is a design decision — client-side filtering, or
  `getStaticPaths` over the filter space, or SSR — so it is not being done incidentally.
  Topic filtering specifically now has a working alternative: `/topics/<slug>/`.
- **`unlisted: true`** is a new demo frontmatter field for "exists, but is not advertised".
  Listing surfaces go through `listedDemos()` in `apps/site/src/lib/catalog.ts`; detail
  routes (`exhibits/`, `stations/`, `instructor/`, `play/`) deliberately still build so
  shared links survive. `eos-lab` is the first user.

## Shipped 2026-09-04

- **cluster-census**, the 20th demo. Draw a cluster from the Maschberger or Kroupa mass
  function; see the same stars in space, on an HR diagram and as a mass histogram.
  Physics ported into `packages/physics` from the novascope package: IMF laws, Plummer and
  EFF profiles, Hurley+2000 lifetimes, a shared seeded RNG with named sub-streams.
- **`ZamsTout1996Model` gained opt-in high-mass extrapolation.** Above 100 Msun the Tout
  fits extrapolate cleanly and are used, with the star ringed and tallied. Below 0.1 Msun
  they are not used at all. Not porting the progenax/startrax fixtures is the known gap.
- **Latent runtime bug fixed:** `initStarfield` threw `InvalidStateError` on any demo whose
  starfield canvas measured 0x0 at init (background tab, hidden pane, un-laid-out iframe).
