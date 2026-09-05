# Cosmic Playground — status

next: continue the stage-first sidebar plan, demo by demo. Fully clean and out of the BUDGETS map: telescope-resolution, conservation-laws, planetary-conjunctions, blackbody-radiation, eclipse-geometry, seasons, spectral-lines. Readouts clean at 1440x900, sidebars still overflowing: parallax-distance (882px), keplers-laws (844), binary-orbits (314), eos-lab (230), galaxy-rotation (148), doppler-shift (51), stars-zams-hr (40). Next: retrograde-motion (4 below the fold) -- the last demo with readouts under the fold. KNOWN NEXT DEFECT: stars-zams-hr gates its stage rules on `min-height: 745px`, so they switch off at 1280x720, the same bug binary-orbits had; cluster-census gates on 640px (harmless at the sizes measured). KNOWN, NOT MINE: two binary-orbits `visual` baselines (`binary-orbits-rv-inclination-30`, `binary-orbits-rv-sb1`) fail on the `#rvPanel` canvas; verified 2026-09-05 that they fail identically on a clean tree, so they are pre-existing baseline drift, not a regression. Other checks: the shell's stage floor (630px at a 900px viewport, released on eight demos so far); whether the grid HAS a readouts row; sidebar prose that duplicates the shelf. Also open: port the progenax/startrax cross-validation fixtures for the IMF and cluster models; the star-cluster dynamics demo; explore's inert filters; instructor bundles for cluster-census + stars-zams-hr
blocker: none — cluster-census shipped 2026-09-04 (20th demo) and had a UI/UX pass the same day; typecheck/build/invariants green
due:

## Current focus
_Seeded 2026-06-07 by the brain STATUS.md convention (`~/brain/work/meta/status-convention.md`). Update in your cosmic-playground session; the brain pulls `next:`/`blocker:`/`due:` via `federate.py`._

Research-grade interactive demos (physics unit-tested), deployed live, used in ASTR 101/201. Cottrell EdTech instrument.

## Open
- [ ] (no empirical learning data yet — assessment plan via CRMSE)

## Rendered math was being re-cased, 2026-09-05

Found while measuring spectral-lines: the readout labels showed frequency as "N".

- **94 KaTeX nodes across 14 demos rendered the wrong physical symbol.** `.cp-readout__label`
  carries `text-transform: uppercase`, and math inherited it. Not only Greek: lowercase
  Latin variables are distinct quantities too, so keplers-laws showed specific angular
  momentum $h$ as H (Hubble parameter, scale height) and $\mu$ as M (mass); parallax-distance
  showed inferred parallax $\hat p$ as P (period); galaxy-rotation showed NFW concentration
  $c$ as C; retrograde-motion showed time $t$ as T; eos-lab showed mean molecular weight
  $\mu$ as M and gas-pressure fraction $\beta$ as B; conservation-laws showed eccentricity
  $e$ as E in a demo that also reports energy.
- **Nothing could have caught it.** `text-transform` is a rendering-time effect that never
  touches the DOM, so `textContent` stayed correct: every E2E assertion about readout text
  passed, and screen readers always got the right symbol. Sighted readers only.
- **One rule fixes all of it.** The transform reaches math purely by INHERITANCE -- the ~20
  uppercase declarations in the theme and demo stylesheets all target class-based ancestors,
  never `.katex`. A declaration on the element beats an inherited value whatever its
  specificity or source order, so `.cp-layer-instrument .katex { text-transform: none }`
  holds for every such ancestor, including ones not written yet. The museum, paper and
  component layers declare no `text-transform` at all, so the instrument layer is the whole
  owner.
- **New gate.** `apps/site/tests/math-rendering.spec.ts` asserts the computed value on the
  math itself rather than any rule that might produce it. Proven RED: 14 of 20 demos fail
  without the fix, 20 pass with it. It requires a demo that authors math to actually render
  some, so a KaTeX failure cannot turn it into a vacuous pass -- stars-zams-hr is the one
  demo with no math at all.

Physics review: no symbol was changed, only a display transform removed, so what renders is
the authored LaTeX -- which was already correct in all 94 cases. Checked each against the
quantity its label names; no label was written lowercase expecting the transform to
uppercase it. Gates: 136 theme, 1,833 demo, full suite 1,044 passed / 34 skipped / 0 failed.

## spectral-lines stage pass, 2026-09-05

12 readouts below the fold -- every one, at every desktop width. The eleventh demo in the
stage-first campaign, and the first whose stage did not respond to viewport width at all.

- **The inverse of the usual width-driven bug.** The stage was a near-constant 833px
  (833 at 1440, 833 at 1920, 820 at 1366, 808 at 1280) because both diagrams cap on
  *width* -- `max-width: 400px` for the Bohr atom, `220px` for the energy ladder -- and
  then take their height from that cap, since `height: auto` on a fixed-ratio viewBox
  makes height a function of width. `.viz-top` spent 426px of vertical space to draw
  620px of content inside a 980px row: 360px of horizontal space wasted while height was
  the scarce resource. Both are now height-driven, widths following from their viewBox
  ratios.
- **A plain `svh` percentage was the wrong shape.** What the drawings compete with is a
  stack of CONSTANTS -- 46px of stage tabs, 32px of panel padding, the 71px playbar, the
  readouts strip -- ~25.5rem measured. `26svh` still asked for 187px at a 720px viewport
  where ~150px was going spare. Subtract the constant first, then split the remainder
  68/32 between the diagrams and the spectrum strip.
- **The demo's own `.readout-grid` rule was dead code.** `repeat(auto-fit, minmax(160px, 1fr))`
  at (0,1,0) never beat the shell's `.cp-demo__readouts .cp-panel-body` at (0,2,0), so six
  readouts wrapped into four columns and two rows with two empty cells. Forced to one row.
- **The two advanced tool panels moved to the drawer.** 981px of content behind a
  disclosure that cost the stage 79px while closed. They are panels, not stage furniture;
  main.ts finds them by id, so all 21 E2E tests passed unchanged.
- **A regression I caused, and fixed.** Shrinking the drawings shrank their labels with
  them: SVG text scales with the viewBox, so the 11-unit orbit labels landed at 3px at
  1280x720. Compensating the font size alone was not enough -- both label stacks already
  sit shoulder to shoulder at full size, so growing them just made them collide. The
  drawings now convert an intended on-screen size into user units, shed the labels that no
  longer have room (keeping the active transition, whose rings are the only amber ones),
  ladder the survivors apart, grow the energy ladder's gutters so "n=3" stops clipping at
  the viewBox edge, and paint labels after the orbits -- SVG has no z-index, so a label
  appended inside the loop was overdrawn by the next ring.

Readouts below the fold 12 -> 0 at 1440x900, 1920x1080, 1366x768 and 1280x720; stage
833 -> 505px at 1440x900 with the Bohr atom at 274px. spectral-lines removed from BUDGETS
-- the seventh demo to graduate. Gates: typecheck clean, 1,833 demo tests, 21 spectral-lines
E2E, 41 ratchet, full suite 1,024 passed / 34 skipped / 0 failed.

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

## Why the sidebars overflow: the stages spend the budget, 2026-09-04

Asked for a modular sidebar design, measured all twenty sidebars by the role each child
plays, and found the answer is not in the sidebars at all.

| Role | px across 20 demos | Home in the shell? |
| --- | --- | --- |
| Parameters | 5,340 | yes, the sidebar |
| Prose | 3,732 | yes, the drawer |
| Presets | 2,389 | **none** |
| Utility toolbar + misc | 1,725 | yes |
| Mode switches | 1,082 | yes, the sidebar |
| Transport | 444 | yes, `.cp-playbar` |

Total content is ~14,700px against ~16,000px of capacity, so the aggregate fits and the
problem is distribution. **11 of 20 demos overflow, hiding 4,205px.**

### The mechanism

Stage height at a 1280 vs a 1920 viewport, same 900px tall window:

| Demo | 1280 | 1920 | growth |
| --- | --- | --- | --- |
| telescope-resolution | 944 | 1544 | **+600** |
| retrograde-motion | 629 | 917 | +288 |
| galaxy-rotation | 632 | 892 | +260 |
| moon-phases | 470 | 646 | +176 |
| doppler-shift | 888 | 1022 | +134 |
| binary-orbits, keplers-laws, parallax-distance | | | **0** |

**Nine of twenty stages get taller as the window gets wider**, and the three that read zero
are the three whose stages were bounded this week. The cause is one declaration, e.g.
`telescope-resolution/style.css:53`: `width: 100%; height: auto` on a drawing with an
intrinsic ratio means height = width / ratio. `height: auto` appears in 17 of the 20 demo
stylesheets.

Horizontal space is the abundant resource here -- the sidebar is 360px of a 1440px viewport
-- and vertical space is the scarce one. Width-driven sizing spends the plentiful one on the
scarce one, so a reader on a bigger monitor gets a worse demo.

The grid's first row is `1fr`, but `.cp-demo` has `min-height: 100svh` rather than `height`,
so `1fr` never constrains anything: the stage takes its full intrinsic height, the readouts
take theirs, and the sidebar gets what is left, which is nothing.

**So sidebar overflow is a symptom.** Bounding a stage is the only move that creates budget
rather than shuffling it.

### A recommendation I got wrong

I screened demos for "room for a preset bar in the playbar row" as
`viewport - stage bottom - padding`, forgetting the readouts panel occupies that same space.
Recomputed honestly, only 3 of 15 preset-carrying demos have room, and the ones with the
worst sidebars (eos-lab -644, doppler-shift -578, galaxy-rotation -242, keplers-laws -13,
parallax-distance -8) all have none.

Built it twice before believing the numbers. doppler-shift's sidebar overflow went 343 ->
67px and its presets went from partly visible to entirely below the fold, because its stage
is 955px tall. keplers-laws' went 844 -> 303px and the orbit went from 448x299 to **291x194**
at 1280x720, where the perihelion and aphelion labels stop being readable. Both reverted.

**The sidebar's independent scroll is a feature.** It isolates control overflow from the
stage. Moving controls into the shared column makes them compete with the visualization, so
for a demo already over budget the move relocates the problem instead of solving it.
Presets go behind a trigger instead: a fixed ~44px however many sit behind it, and nothing
taken from the stage.

## Sidebars now say when they are hiding something, 2026-09-04

All 20 reported a 0px scrollbar gutter -- macOS overlay scrollbars, invisible until you
scroll -- so 4,205px was hidden with no signal at all. CSS cannot detect its own overflow,
and neither `scrollbar-gutter: stable` nor styling `::-webkit-scrollbar` produced a gutter;
both were tried and measured. `initScrollAffordance` in `@cosmic/runtime` publishes
`data-scroll` and the stylesheet fades that edge. Every demo already calls it through
`createInstrumentRuntime` -> `initDemoPolish`, so none had to opt in. The test is two-sided:
a sidebar that fits must say "none" and carry no fade, because an affordance that is always
on carries no information.

## eos-lab, the worked example, 2026-09-04

Worst demo in the audit on three counts at once: a 1,282px stage, 540px of hidden sidebar,
every readout below the fold.

Content moved before anything was resized -- both panel help paragraphs to the drawer, the
three channel cards into the readout strip where they always belonged, the seven derived
quantities behind a disclosure, the six presets behind a trigger -- and then the stage was
bounded with both surfaces made height-driven.

**Readouts below the fold 14 -> 0** at all four desktop sizes, **sidebar hidden 540 -> 230**,
and the plots come out at 342px and 225px against the 370px and 321px they had when nothing
else fit on screen.

Three defects found on the way:

- **A ResizeObserver feedback loop.** `flex-basis: auto` means the basis is the content
  size, and uPlot puts an explicitly sized root inside its container -- so `setSize` grew
  the container, which fired the observer, which called `setSize` again. It ran away to
  3,812px tall. `flex: 1 1 0` plus `overflow: hidden` breaks the cycle.
- **uPlot's height is its plotting area only**; its root also carries the legend below.
  Passing the container's full height overflowed it by the legend and the container clipped,
  taking the x-axis off the bottom of the chart.
- **`renderMathIfChanged` read the source back off the element after the caller had written
  it**, which is only safe while consecutive values differ. Writing the same value twice left
  raw LaTeX on screen: KaTeX had replaced the contents, the cache still said "rendered", and
  the guard skipped the render that would have fixed it. Latent while every call came from a
  slider moving to a new value; a resize handler re-rendering identical state exposed it
  immediately. `setMathText` owns the write now.

## doppler-shift, 2026-09-04

955px stage, 343px of hidden sidebar, all 20 readouts below the fold.

Two things did most of the work. **Side by side instead of stacked**: both drawings are
3.2:1 and 4:1 with `width: 100%` and an `aspect-ratio`, so stacked they demanded 875px of a
1,020px column -- most of that width was being converted into height nobody asked for. As
cause and observable side by side, each card asks for about half, and the stage stops
growing on its own because it is bounded by its columns rather than by the viewport. No cap
needed.

**Releasing the shell's stage floor mattered as much.** `min-height: clamp(420px, 70svh,
820px)` is 630px at a 900px viewport, and once the content came down to 446px that floor was
the only thing still setting the stage height. It pushed the readouts back under the fold by
itself. Worth checking on every demo in this pass: a stage that no longer needs the floor is
still paying for it.

Content moved first, as on eos-lab: intro and both panel subtitles to the drawer with the
sound-vs-light misconception callout, the eight velocity presets behind a trigger, and the
two slider values plus the frequency restatement of the wavelength pair behind a disclosure.
The five element chips stayed inline -- one row, and choosing the element is a primary
control rather than a jump to a named scenario.

**Readouts below the fold 20 -> 0** at 1920x1080 and 1440x900, 2 at 1366x768 and 1280x720
where the demo genuinely cannot fit stage, transport and readouts at once. **Sidebar hidden
343 -> 51.**

Reverted and recorded in the stylesheet: spanning the representative-line card across two
columns. Its "Why this line?" chip stacks under the label in a 208px column and, since a
grid row is as tall as its tallest cell, that turns every card in the row from 84px into
118px. But the grid is three columns at 1280, so a two-column card leaves one behind it and
costs a whole extra row -- the panel went 389px to 402px and two more readouts dropped below
the fold.

## galaxy-rotation, 2026-09-04

652px stage, 322px of hidden sidebar, all 22 readouts below the fold.

Its galaxy schematic is the purest case of width-driven sizing in the project: a **square**
viewBox at `width: 100%`, so its height is its column's width. At a 1920 viewport that
column is 693px and the drawing became 693px tall, taking the stage to 828px. Meanwhile the
column had ~240px of width to spare precisely because the drawing is square -- the layout
was converting the resource it had into the one it lacked.

Capping the height spends that spare width instead: the box stays column-width and
`preserveAspectRatio` centres the drawing in it. The cap follows the viewport, so what is
left after the transport bar and the readouts is what the drawing gets -- 360px at a 900px
viewport, 540px at 1080, a 190px floor below that.

The shell's stage floor had to go with it, same as doppler-shift. Third demo in a row where
that floor was still the binding constraint after the content came down.

Seven of the eleven readouts went behind a disclosure: radius, concentration and virial
radius restate the sliders' own values, enclosed and visible mass with the baryon fraction
are the budget behind the dark-to-visible ratio, and the 21-cm shift is a side observation.
What stays on one row is the demo's claim -- total velocity against visible-matter velocity,
and the dark mass that explains the gap.

**Readouts below the fold 22 -> 0** at 1920x1080, 1440x900 and 1366x768; still 8 at 1280x720.
**Sidebar hidden 322 -> 148.**

One E2E test read `#radiusValue` with `innerText`, which returns "" for content inside a
closed disclosure. `textContent` is the right accessor once a readout is disclosed.

## telescope-resolution, 2026-09-04

The worst width-driven stage in the project, and the first demo to come out of the BUDGETS
map entirely.

Its PSF canvas is square at `width: 100%`, so its height was its column's width -- 988px at
a 1440 viewport, **1,468px at 1920**, taking the stage from 944px to 1,544px as the window
got wider.

**The cap goes on width, not height.** Unlike an SVG, a canvas has no
`preserveAspectRatio`: it stretches its bitmap to whatever CSS box it is given, so capping
the height of a `width: 100%` canvas squashes the Airy pattern into an ellipse. Constraining
the width and leaving `height: auto` keeps the 1:1 ratio -- and for a square drawing the
vertical budget and the horizontal one are the same number, which is why an `svh` term
belongs in a max-width here.

The 520px ceiling had a second reason worth recording: **the backing store is 420x420**
(`width="420" height="420"` on the element, and `drawPsf` fills `canvasEl.width` pixels), so
every CSS pixel past ~420 was upscale rather than detail. The PSF was being stretched 2.35x
at 1440 and 3.5x at 1920. Raising the backing store instead would multiply a per-pixel loop
that runs on every slider move.

**Readouts below the fold 8 -> 0, sidebar overflow 77 -> 0**, and the stage is 598px at both
1440 and 1920 -- it has stopped growing with the window.

Two E2E tests selected drawer accordions by position (`.first()`, `.nth(1)`), so moving the
sidebar's intro prose into a new panel broke both without either named panel changing. They
select by name now. Worth watching for on the remaining demos: this pass adds a drawer panel
almost every time.

## conservation-laws, 2026-09-04

A 1,016px stage with all six readouts below the fold. Its orbit is square at `width: 100%`,
already carrying `max-width: 980px` -- which only stopped it past a 1920 viewport. A square
drawing asks for the whole column's width as height, the most expensive shape there is when
height is what is scarce. Capped against the viewport, it centres in the width it no longer
needs and the starfield shows through, which reads better than the full-bleed version did.

**Readouts below the fold 12 -> 0** at all four sizes; the sidebar was already clean. Second
demo out of the BUDGETS map.

A theme fix this demo exposed: `.cp-readout__unit` had no `white-space`, so
`AU$^2$/yr$^2$` rendered as "AU2/yr" with the second exponent orphaned on the line below --
KaTeX emits each piece as its own inline element and the line broke between them. A unit is
one symbol and must not break. That one was latent across every demo.

Reverted and recorded: narrowing the readout columns so all six fit one row. An 8.5rem floor
gives six columns at 1440 and takes the panel 324px -> 255px, but only there. At 1366 and
1280 it gives five, so a card wraps anyway AND every card is narrower, so labels like
"Specific angular momentum" wrap further: 324px -> 344px at 1366, -> 364px at 1280. Helping
the measured viewport by hurting two real ones is not a trade worth making.

## planetary-conjunctions, 2026-09-04

Structurally identical to conservation-laws -- a single square SVG at `width: 100%` filling
a 982px column, `max-width: 980px` that only bit past 1920, and a sidebar that was already
clean. Same cap, same floor release. **Readouts below the fold 12 -> 0** at all four sizes.
Third demo out of the BUDGETS map.

Worth noting for the remaining ones: **the shell's stage floor has now been released
individually on six demos.** `min-height: clamp(420px, 70svh, 820px)` is 630px at a 900px
viewport, which is more than a bounded stage needs, so every demo in this pass ends up
opting out of it one at a time. That is the shape of a rule that wants to move into the
shell -- but not before enough demos have opted out to show what the right default is, and
not while five demos still rely on the floor to look reasonable.

## blackbody-radiation, 2026-09-04

Its grid had no `readouts` area at all -- "no readouts column, the stage is the centrepiece"
-- so the peak wavelength, the luminosity ratio and the star preview lived at the bottom of
the **controls** panel. The sidebar held 1,083px in a 794px box: the peak wavelength sat at
y=848 and the luminosity ratio at y=957, and neither number a reader comes for was fully on
screen.

The intent was right and the placement was not. A strip in the shell's readouts row keeps
the stage the centrepiece and puts the numbers under the spectrum they describe.

**A grid area that does not exist does not error.** An element asking for `grid-area:
readouts` is auto-placed into an implicit row after everything else; the strip landed at
y=2237, below the drawer. Worth checking on any demo with a custom `grid-template-areas`
before moving anything into a shell row -- stars-zams-hr had the same gap.

The spectrum canvas then needed capping -- 16:9 at `width: 100%`, `max-width: 980px` that
only bit past 1920. Multiplying the viewport budget by 16/9 converts the height that is
available into the width that produces it, which is how you cap a canvas without distorting
it.

**Readouts below the fold 4 -> 0, sidebar overflow 289 -> 0.** Fourth demo out of the map.

One of the three E2E tests this broke had been asserting something false: "demo loads with
shell sections visible (readouts in controls)" called `toBeVisible` on both readouts and
passed the entire time they sat below the fold. `toBeVisible` is about rendering, not about
being on screen -- the same class of thing as [[tests-encode-defects]], and a reminder that
the layout ratchet exists because no ordinary assertion looks at geometry.

## eclipse-geometry, 2026-09-04

Readouts already on screen; the sidebar hid 242px at 1440x900 and 483px at 1280x720. Two
items were nearly all of it: a 91px intro and a **206px model callout**, both prose, in a
794px box.

The callout said what the shelf's default tab already said -- eclipses need the Moon near a
node AND New or Full phase -- so removing it was de-duplication rather than demotion. The
one thing it added, the definition of a node, moved into that bullet. **Worth checking on
every remaining demo: sidebar prose that repeats the shelf.**

**Sidebar hidden 242 -> 0.** Fifth demo out of the map.

The screenshot then showed a defect nothing else would have: the two node labels were pinned
at fixed points, x=0 with y=-156 and y=170, while the dots they name move around the orbit
with the node longitude. So "asc. node 210" sat at the top of the circle whatever the
ascending node was doing, and at the default longitude the lower label landed on the
schematic caption and the two strings overlapped. Each label follows its own dot now, with
`text-anchor` picked from the side it is on. The angles are the ones the dots already use,
so no computed quantity changed.

## binary-orbits, second pass, 2026-09-04

This demo already had a stage bound from the earlier pass. It was gated on
`and (min-height: 820px)` -- **which switched it off on exactly the viewports that need it
most.** At 1440x900 the gate passed and the orbit canvas was 862x374 with one readout below
the fold; at 1366x768 and 1280x720 it did not, so the id selector's `aspect-ratio: 4 / 3`
took over, the canvas became 854x641, and all sixteen readouts went under the fold. A
shorter window was getting a taller stage.

The clamp inside the block already protects a short viewport from a crushed canvas -- that
is what its 300px floors are for -- so the height gate was doing nothing but disabling the
fix. **Worth grepping for on the rest: any media query gating a layout fix on viewport
height.**

Readouts below the fold 1 -> 0 at 1440 and 1920, 16 -> 0 at 1366, 16 -> 3 at 1280. Sidebar
hidden 601 -> 314.

What remains in that sidebar is live and control-adjacent, and stays: an inclination hint
that computes sin(i) for the slider above it, and a Live response panel that answers the
mass-ratio slider. 314px behind a working scroll fade is the honest stopping point for
those -- the alternative is deleting content the demo teaches with.

## seasons, 2026-09-04

A 664px stage with all ten readouts below the fold. This demo has less viewport to spend
than most: between its stage and its readouts sits a 176px row carrying the year scrub bar
and the causal ladder.

Its SVG is `width: 100%` at a 920x420 viewBox, so its height followed its column's width --
452px at 1440, 671px at 1920. **The cap goes on width, multiplied by the viewBox's own
ratio**, so the bordered box keeps hugging the drawing instead of letterboxing a gradient
around it. At 1440 the column is narrower than the cap, so nothing changes there; it bites
at 1366 and below, which is where every readout was off screen.

Shell floor released with it, seventh demo running. The sidebar's one-line intro moved to
the shelf's What to notice tab, clearing the last 40px.

**Readouts below the fold 10 -> 0, sidebar 40 -> 0.** Sixth demo out of the map.

Grepping for the binary-orbits bug found two more: **stars-zams-hr gates its stage rules on
`min-height: 745px`**, so they switch off at 1280x720 exactly as binary-orbits' did;
cluster-census gates on 640px, which is below every size measured here; spectral-lines uses
`max-height: 768px`, a different shape. The stars-zams-hr one is a known defect waiting for
its pass.

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

**Solved 2026-09-04.** The recurring failure was `site-links` link integrity, and the log
said plainly: "Test timeout of 30000ms exceeded". That test crawls the whole site with
hundreds of sequential HTTP requests; it takes 4.0s alone and shares a preview server with
eight workers and ~130 concurrent tests in a full run. Both crawls now carry a 120s ceiling
instead of the 30s default, which is sized for a test that touches one page.

A second, separate accounting gap turned up on 2026-09-04. A full `--project=desktop` run
reported **911 passed + 34 skipped = 945**, but `--list` for that same project counts
**969**. Twenty-four tests are in neither column, with exit code 0 and no failures. Some of
it is conditional skipping that depends on run context -- `smoke.spec.ts:260` and `:543`
were listed as skipped in the full run and both passed when the file ran alone -- but that
has not been traced to the full 24. Worth knowing before quoting a suite total: the summary
line is not a census.

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
