# Cosmic Playground — status

next: port the progenax/startrax cross-validation fixtures so the new IMF, cluster and lifetime models are gated against an external reference (the largest gap in docs/reviews/cluster-census.md); then the star-cluster dynamics demo. Also open: explore's filters are inert in the static build, instructor bundles for cluster-census + stars-zams-hr
blocker: none — cluster-census shipped 2026-09-04 (20th demo); lint/typecheck/build/invariants green, 2,303 unit + 948 e2e passing
due:

## Current focus
_Seeded 2026-06-07 by the brain STATUS.md convention (`~/brain/work/meta/status-convention.md`). Update in your cosmic-playground session; the brain pulls `next:`/`blocker:`/`due:` via `federate.py`._

Research-grade interactive demos (physics unit-tested), deployed live, used in ASTR 101/201. Cottrell EdTech instrument.

## Open
- [ ] (no empirical learning data yet — assessment plan via CRMSE)

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
