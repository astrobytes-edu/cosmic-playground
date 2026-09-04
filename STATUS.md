# Cosmic Playground — status

next: port the progenax/startrax cross-validation fixtures so the IMF, cluster, lifetime and post-main-sequence models are gated against an external reference (the largest gap in docs/reviews/cluster-census.md); then the star-cluster dynamics demo. Also open: explore's filters are inert in the static build, instructor bundles for cluster-census + stars-zams-hr, and the novascope "lens" control grouping (docs/reviews/2026-09-04-novascope-port-survey.md)
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
