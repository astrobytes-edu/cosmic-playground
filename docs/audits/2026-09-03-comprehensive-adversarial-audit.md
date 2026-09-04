# Cosmic Playground — Comprehensive Adversarial Audit

**Date:** 2026-09-03
**Branch:** `codex/p0-ui-ux-test-hardening` (identical commit to `main`; 62 uncommitted files on top)
**Mode:** AUDIT — read-only. No repository file was modified by this audit.
**Method:** 9 parallel adversarial review agents (physics ×3, UI/UX ×2, accessibility, architecture, test quality, content/pedagogy) plus direct verification of every headline claim by the lead auditor. Every number below comes from a fresh command run or a file read, not from memory or prior audit documents.

---

## 1. Verdict

**The craft is high. The verification and delivery layers are where this project fails.**

The design system, the physics packages, the content schema, and the pedagogical framing are genuinely good — better than most university course software. But between that work and a student's browser sit three failures that no amount of demo polish will fix:

1. **The quality gates have not run in CI since 2026-03-11.** The nightly E2E workflow has failed 79 of its last 101 runs. The `verify` job that runs typecheck + all 2,138 unit tests + the full E2E suite is gated on `pull_request`, and **zero pull requests have ever been opened** in this repository. Every gate you rely on runs only when you type it by hand.
2. **`corepack pnpm -r typecheck` is red right now**, and the current uncommitted work is what broke it.
3. **A wrong physical constant is shipping to students**, green through 2,906 tests, because the tolerance protecting it is three times wider than the error.

Underneath that: an accessibility defect kills the focus ring on every form control in all 19 demos; two homepage links 404 in production; `eos-lab` produces NaN in two of its own shipped presets behind a guard that provably does not work; and a third of the `stars-zams-hr` colour–magnitude diagram is a clamping artifact rather than a population.

None of this is a craft problem. It is an integration problem: work is done to a high standard, then never landed, never gated, and never checked end to end.

### Gate status (fresh runs, 2026-09-03)

| Gate | Command | Result |
|---|---|---|
| Build | `corepack pnpm build` | **PASS** — 80 pages, 19 demos, all 5 validators green |
| Unit tests | `corepack pnpm test` | **PASS** — 2,138 executing, 0 skipped |
| E2E (base path) | `CP_BASE_PATH=/cosmic-playground/ … test:e2e` | **PASS** — 768 passed / 34 skipped |
| Typecheck | `corepack pnpm -r typecheck` | **FAIL** — `packages/runtime/src/math.ts:43` TS18046 |
| CI nightly E2E | GitHub Actions | **FAIL** — 79/101 runs failed; last success 2026-03-11 |
| CI `verify` job | GitHub Actions | **NEVER RUN** — gated on `pull_request`; 0 PRs ever opened |

### Grade

Scored against the project's own rubric (`~/.claude/skills/reviewing-project-quality`), five categories out of 20.

| Category | Score | Evidence |
|---|---|---|
| Test coverage | **12**/20 | All 19 demos have contract + logic tests; 2 lack E2E; but 557 tests execute zero product code, 4 models have no known-answer test, visual regression is 34/34 skipped, no coverage tooling exists, and the unit suite has never run in CI |
| Design system | **14**/20 | Zero legacy tokens; all 19 demos on the component system; but 53 `var()` sites reference undefined tokens, one token holds incompatible types across layers, and per-demo CSS outweighs shared theme CSS 6.3:1 |
| Physics correctness | **11**/20 | Constants file verified clean against CODATA/IAU; most models independently re-derived correct; but 5 of 19 demos have never been physics-reviewed while asserting `content_verified: true`, and one confirmed wrong constant is live |
| Accessibility | **9**/20 | Reduced motion genuinely honoured; live regions clean; but 4 cross-cutting P1s affect all 19 demos, 5 demos have keyboard failures, and axe-core is absent |
| Architecture | **13**/20 | Humble-object split real but leaky; no linter or formatter anywhere in ~90k LOC of TypeScript; significant cross-demo duplication |
| **Total** | **59/100** | **C** |

That grade is a statement about *verification*, not about talent. Four of the five categories move to 16+ with the P1 list below, which is roughly two focused weeks of work.

The project's own metadata is, to its credit, honest: **0 of 19 demos are `status: stable`; 0 are `readiness: launch-ready`.** This audit agrees with that self-assessment. Prior internal notes claiming "A+ (100/100)" and "all demos fully migrated" are stale and should be deleted so they stop misinforming future sessions.

---

## 2. P1 — Blocking

### P1-1 · CI has been red for six months and the real gates never run

`gh run list --workflow=nightly-e2e.yml --limit 200`: **101 runs, 79 failures, 22 successes. Last success 2026-03-11.**

`.github/workflows/deploy.yml` has two mutually exclusive jobs:

```yaml
verify:  if: github.event_name == 'pull_request'   # lint + typecheck + unit + full E2E
build:   if: github.event_name != 'pull_request'   # build + ONE grep'd smoke test → deploy
```

`gh pr list --state all` returns `[]`. No pull request has ever been opened. Therefore the `verify` job — the only place typecheck and the 2,138 unit tests run — **has never executed**. Push to `main`, which `CLAUDE.md` explicitly sanctions for a solo maintainer, deploys to GitHub Pages after a build and a single smoke grep.

**Fix (one line, highest value in this document):** change the `verify` job condition so it runs on push as well:

```yaml
verify:
  if: github.event_name != 'schedule'
build:
  needs: verify
  if: github.event_name != 'pull_request'
```

Then fix or delete the nightly workflow — a job that has failed every night for six months is worse than no job, because it trains you to ignore the notification.

### P1-2 · Typecheck is red on the current working tree

```
packages/runtime typecheck: src/math.ts(43,10): error TS18046: 'katex' is of type 'unknown'.
```

`packages/runtime/src/katex.d.ts:2` declares `const katex: unknown`. That was survivable while `katex` was only ever *passed* to `renderMathInElement` as an opaque option. The new (uncommitted) `renderInlineKatex()` at `math.ts:43` calls `katex.renderToString(...)` on it, which `unknown` forbids.

`AGENTS.md` lists `corepack pnpm -r typecheck` in the land-to-main checklist, but the P0 plan being executed (`docs/plans/2026-04-25-p0-ui-ux-test-hardening.md`, Task 13) omits it from its acceptance criteria. That omission is exactly how this shipped into the working tree.

**Fix:** delete the hand-rolled shim and install the real types.

```bash
corepack pnpm -C packages/runtime add -D @types/katex
```

Then remove `packages/runtime/src/katex.d.ts` and the `/// <reference>` on `math.ts:1`. A hand-written `unknown` shim is a type hole that silently defers cost to whoever next needs the type — this is that moment.

### P1-3 · Two production 404s

**(a)** [`apps/site/src/pages/index.astro:172`](apps/site/src/pages/index.astro:172) links to `${base}stations/`. `src/pages/stations/` contains only `[slug].astro` — there is no index page and no route generating a bare `/stations/`. Verified against build output: `apps/site/dist/stations/index.html` does not exist. This link sits in the homepage's *For instructors* block, the primary instructor entry point. Its two siblings (`instructor/`, `playlists/`) resolve correctly, which is why it was missed.

**(b)** [`apps/site/src/pages/explore/index.astro:513`](apps/site/src/pages/explore/index.astro:513) — the "Surprise me" handler:

```js
const baseHref = document.querySelector("base")?.href || "/";
window.location.href = `${baseHref}exhibits/${slug}/`;
```

There is no `<base>` element anywhere in the site (verified: `grep -rn '<base' apps/site/src` is empty). `astro.config.mjs` sets `base: "/cosmic-playground/"`. So the handler navigates to `/exhibits/<slug>/`, dropping the base path, and 404s in production. The server-rendered `href` on line 397 is correct, but `e.preventDefault()` on line 511 discards it — **the button works with JavaScript disabled and breaks with it enabled.**

**Fix (b):** drop the `preventDefault` and the `<base>` lookup; pass `base` in via `define:vars` as `welcome.astro:97` already does.

**Why both survived 768 green E2E tests:** 15 of the 16 spec files test *instruments*. Grepping all of them for `stations/`, `Surprise`, `topics/`, `welcome`, or `glossary` returns nothing. **The museum's own navigation has zero test coverage.**

### P1-4 · Five demos ship unreviewed physics while claiming verification

`CLAUDE.md` states physics review is **mandatory** before pushing any demo involving coordinates, angles, geometry, or physical quantities. These five have no `docs/reviews/<slug>.md`:

`doppler-shift` · `galaxy-rotation` · `hydrostatic-equilibrium-explorer` · `spectral-lines` · `stars-zams-hr`

All five declare `content_verified: true` in their frontmatter.

Compounding this: **all 19 `parityAuditPath` files exist, but 9 are byte-identical 62-word stubs reading "Pending detailed parity review"** (angular-size, conservation-laws, eclipse-geometry, keplers-laws, moon-phases, planetary-conjunctions, retrograde-motion, seasons, telescope-resolution). And the single demo marked `content_verified: false` — `retrograde-motion` — has *two* completed reviews and a clean coordinate audit, is `featured: true`, and wears an "unverified" banner on the homepage. **The verification metadata is inverted.**

For a project positioned as a Cottrell EdTech instrument, metadata asserting verification that did not occur is the finding that costs you a reviewer's trust in every other number on the page.

### P1-5 · A wrong physical constant is live, and the test tolerance hides it

[`packages/physics/src/spectralLineModel.ts:25`](packages/physics/src/spectralLineModel.ts:25):

```ts
/** Rydberg energy (eV) — ionization energy of hydrogen from n=1 */
RYDBERG_EV: 13.605693,               // NIST CODATA 2018
```

13.605693 eV is the **Rydberg energy** `R∞hc` (infinite nuclear mass). Hydrogen's ionization energy is **13.598435 eV** — the docstring is wrong, and so is the value for computing hydrogen lines, because the reduced-mass correction `μ/mₑ = 0.99945` is missing.

Verified numerically by the lead auditor:

| Line | Code output | Correct (vacuum) | Error |
|---|---|---|---|
| Hα (3→2) | 656.112 nm | 656.461 nm | −0.349 nm |
| Hβ (4→2) | 486.009 nm | 486.272 nm | −0.263 nm |
| Lyα (2→1) | 121.502 nm | 121.567 nm | −0.065 nm |

The test that should catch this — [`spectralLineModel.test.ts:25`](packages/physics/src/spectralLineModel.test.ts:25) — asserts `toBeCloseTo(656.3, 0)`, a **±0.5 nm** window, roughly three times the error.

The value is also internally inconsistent: [`packages/data-spectra/src/atomicLines.ts:66`](packages/data-spectra/src/atomicLines.ts:66) stores Hα as `6.56281e-5 cm` = **656.281 nm** with `medium: "air"`, and `dopplerShiftModel` uses 656.281 too. **Two models in the same package disagree about Hα, and both test suites are green.** The demo's own default readout literal is `656.1`.

**Fix:** `RYDBERG_EV: 13.598435` with the docstring corrected to "hydrogen ionization energy (reduced-mass corrected)", and tighten the benchmark tolerances to ±0.01 nm. Then decide air vs. vacuum explicitly (see P2-1).

### P1-6 · The focus ring is destroyed on every form control in every demo

This is a **token type collision**, a bug class the current test suite cannot express.

| File | Declaration | Type |
|---|---|---|
| [`tokens.css:47`](packages/theme/styles/tokens.css:47) | `--cp-glow-teal: color-mix(in srgb, var(--cp-accent) 10%, transparent)` | a **colour** |
| [`layer-instrument.css:33`](packages/theme/styles/layer-instrument.css:33) | `--cp-glow-teal: 0 0 20px rgba(45, 212, 191, 0.40)` | a **shadow list** |

[`packages/theme/styles/components/form.css:21-28`](packages/theme/styles/components/form.css:21) writes:

```css
.cp-input:focus, .cp-select:focus, .cp-textarea:focus, .cp-demo select:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--cp-glow-teal);
}
```

On the museum layer this expands to valid CSS. On the instrument layer it expands to `box-shadow: 0 0 0 3px 0 0 20px rgba(...)` — **invalid, so the whole declaration is dropped.** `outline: none` has already fired. All 19 demo roots carry `cp-layer-instrument` (verified). The only remaining focus cue on a `<select>` is a 1px border-colour change. WCAG 2.4.7 and 1.4.11.

**Fix:** rename the shadow-valued token (`--cp-shadow-glow-teal`) so a token name never holds two types, and use a colour token in `form.css`. Add a build invariant asserting no `--cp-glow-*` token holds a colour in one layer and a shadow list in another — that check is ~15 lines and would have caught this at authoring time.

### P1-7 · No `<main>` landmark in any demo, and the accessible name is discarded

All 19 demo roots are:

```html
<div id="cp-demo" class="cp-layer-instrument cp-demo" aria-label="Moon phases instrument">
```

A bare `<div>` has implicit `role=generic`, on which ARIA **prohibits** `aria-label` — assistive technology discards it. There is no `<main>` element in any of the 19 demos (verified: 19/19 have zero `<main`).

The sharp part: [`apps/site/tests/accessibility.spec.ts:43-47`](apps/site/tests/accessibility.spec.ts:43) asserts this exact attribute exists, and `scripts/validate-play-dirs.mjs` enforces it as a build gate. **A build invariant and an E2E test both certify an accessibility attribute that screen readers ignore.**

**Fix:** change the element to `<main id="cp-demo" …>`, or add `role="main"`. One word, 19 files, and both existing gates keep passing while becoming true.

### P1-8 · Focus ring fails contrast site-wide; paper theme has unreadable text

Computed by the lead auditor with the WCAG relative-luminance formula:

- [`tokens.css:101`](packages/theme/styles/tokens.css:101) `--cp-focus: color-mix(in srgb, var(--cp-accent) 55%, transparent)` composites over `--cp-bg0: #0f1115` to `#215557` → **2.25:1**. WCAG 1.4.11 requires **3:1**. This is the site's only focus affordance on the museum layer.
- [`layer-paper.css`](packages/theme/styles/layer-paper.css) sets `--cp-bg0: #fafaff` but never overrides `--cp-accent-ice` (`#8BE9FD`) or `--cp-accent-amber` (`#FFB86C`). On white those are **1.38:1** and **1.70:1**. [`instructor/index.astro:162,167`](apps/site/src/pages/instructor/index.astro:162) uses both as text colour, and [`Layout.astro:31-34`](apps/site/src/layouts/Layout.astro:31) forces the paper theme on every path containing `/instructor/` or `/stations/`. The same failure hits `DemoCard`, `StatBar`, `CitationCard`, and `playlists/index.astro` under `?theme=paper` — i.e. the print/handout path.

`packages/theme/src/contrast.test.ts` misses both because it **hardcodes hex literals rather than parsing the CSS**, and only tests museum accents even though `layer-instrument.css:16-21` overrides them.

### P1-9 · `eos-lab` produces NaN in two shipped presets, and the guard against it does not work

`packages/physics/src/stellarEosModel.ts:428-436` caps the finite-temperature chemical-potential bracket at `η = 240`, but the zero-T shortcut only fires at `χ = T/T_F ≤ 1e-3` (line 586) while the non-relativistic branch needs `η ~ 1/χ`. For `1e-3 < χ ≲ 4.2e-3` with `x_F < 0.3` the bracket fails, `solveBisection` returns NaN, and it propagates through `finiteTDegeneracyPressure` → `totalPressureDynePerCm2` → every pressure fraction → `classifyDominantPressure` returns `"invalid"` → the regime map paints it "mixed".

This is not theoretical. **Two shipped presets hit it in the main plot:** *Solar envelope* (T = 5800 K) yields 11 NaN of 241 curve samples; *Red giant envelope* (T = 4000 K) yields 12.

The intended log-safety guard at `eos-lab/logic.ts:269-271` is `Math.max(1e-30, …)`. Verified by execution: **`Math.max(1e-30, NaN) === NaN`.** It floors nothing, so NaN reaches a `distr: 3` uPlot axis — the exact crash class this repository has already been bitten by and documented.

**Fix:** raise the zero-T shortcut to `χ ≤ 5e-3` (the Sommerfeld error there is ~1e-4 relative, better than the quadrature it replaces), size the bracket from `E_F/(k_B T)` which is already passed in, and sanitize the curve builders with `Number.isFinite(v) ? v : null`.

### P1-10 · One third of the `stars-zams-hr` colour–magnitude diagram is a clamping artifact

Two compounding extrapolations in `hrInferencePopulationModel.ts`:

- `bminusVFromTeffK:142-154` bisects on the bracket `[-0.4, 2.2]`, which under the Ballesteros relation spans only 2975–21707 K. Anything outside silently returns a bracket endpoint. (The `clamp(…, 42000)` alongside it is dead code.)
- The Torres bolometric correction (`:107-135`) is extrapolated below its ~3160 K validity floor: `BC_V(2812 K) = −6.73` against a real value near −3.5, pushing `M_V` to 19.0.

`OBSERVER_AXIS_LIMITS` are `colorMax = 2.2` and `mvFaint = 16` — **exactly the saturation values**. For the shipped defaults (N = 320, Salpeter 0.1–50 M☉, and observer mode is the *default* tab): **27.5% of stars peg at B−V = 2.2** and **36.0% at M_V > 16**. `cmdCoordinates` clamps rather than culls, so roughly 88 of 320 points stack on a single corner pixel and are individually unselectable. The default `photErr = 0.03` is far too small to disperse it. The theorist HR view is unaffected.

The headline visualisation of this demo is therefore, in substantial part, showing the edge of its own calibration. (Worth noting what is *not* wrong: the Sun should not land at L = 1, R = 1, T = 5772 K here — this is a ZAMS model, and 0.698 / 0.888 / 5597 K are the correct Tout-1996 values.)

---

## 3. P2 — Significant

### 3.1 Physics

| ID | Demo | Finding |
|---|---|---|
| P2-1 | spectral-lines, doppler-shift | **Air wavelengths labelled as vacuum.** The full element catalogue (Na D 589.0/589.6, Ca II 393.4/396.8, He I 587.6, all 34 Fe I lines) matches *air*, but six user-facing strings claim vacuum: `spectralLineModel.ts:14`, `spectral-lines/index.html:540`, `spectral-lines/logic.ts:559`, `doppler-shift/index.html:285,413`, `doppler-shift/logic.ts:554`. `packages/data-spectra/src/atomicLines.ts` already carries `medium:` per entry — adopt that pattern everywhere. |
| P2-2 | galaxy-rotation | **The dark-matter gap is partly a formula artifact.** `galaxyRotationModel.ts:401-404` builds the "visible matter only" benchmark as spherical `√(GM(<R)/R)` while `vTotalKmS` uses the exact Freeman disk. With the **`no-dark-matter` preset (halo = 0)** the shaded band still reaches **22.1 km/s (13.2%) at R = 7 kpc**, and the curves cross at 2.35 kpc so the fill polygon self-intersects — while the `M_dark` readout correctly reads 0.000. Plot and readout contradict each other. Fix: `hypot(vBulge, vDisk)` for the benchmark, plus a test asserting `V_total === V_visible` when `haloMass10 = 0`. |
| P2-3 | galaxy-rotation | MOND label vs. code: `index.html:241,359` claim the deep-MOND limit `(GMa₀)^¼`; `main.ts:768` plots the full simple-ν interpolation. They differ by **24% at 8 kpc, 55% at 2 kpc**. `vMondDeepKmS` is dead code. |
| P2-4 | galaxy-rotation | A **face-on** disk schematic carries a blueshift/redshift slit (`main.ts:530-570`, caption `index.html:202`). A face-on disk has zero line-of-sight velocity — this teaches the exact misconception the demo exists to kill. |
| P2-5 | doppler-shift | The wave-diagram arrow is **inverted**: `main.ts:845-862` anchors it at the source and points it *toward* the observer for redshift, under a caption reading "source receding →". |
| P2-6 | doppler-shift | Cosmological redshift presented as kinematic velocity: presets Coma (cz = 6925), 3C 273 (z = 0.158) and "High-z galaxy" (z = 2) run through the SR inverse into a readout labelled "Radial velocity v_r" — z = 2 displays **239,834 km/s** — in a demo whose own card says it does not model expansion. |
| P2-7 | spectral-lines | Ad hoc line strengths presented as NIST data. `main.ts:1142` uses `1/(Δn+1)` (Hα:Hβ:Hγ:Hδ = 0.50:0.33:0.25:0.20 vs. Case-B 1.00:0.35:0.16:0.09, and makes Lyα equal to Hα) while `spectralLineModel.ts:463` uses a *different* set for the same element. Both drive drawn line width under a caption citing "the NIST Atomic Spectra Database". |
| P2-8 | spectral-lines | The Balmer-strength proxy reads exactly `0.000` across ~20% of its own slider (`spectralLineModel.ts:409-411` hard-zeros above 17,000 K and below 4,500 K on a 4,000–20,000 K range). B stars have strong Balmer absorption. Labelled "ionization balance" but contains no Saha physics. |
| P2-9 | packages/physics | **Constants are duplicated rather than sourced.** Seven separate definitions of `c`. Private constant blocks in `stellarEosModel.ts:7-14` (a verbatim copy of `AstroConstants.EOS`, admitted in a comment), `blackbodyRadiationModel.ts:3-17` (k_B at 2.5e-4 relative error), `hydrostaticEquilibriumModel.ts:32-38`, `spectralLineModel.ts:23-36`, `galaxyRotationModel.ts:254-261`. Conflicting solar radius (696000 vs 695700 km) and synodic month (29.53 vs 29.530588). Root cause: `astroConstants.ts` **omits** G, σ_SB, M☉, R☉, L☉, m_p, σ_T — which is *why* six model files roll their own. |
| P2-10 | packages/physics | Two conflicting solar-declination models: exact `asin(sin ε sin L)` (`seasonsModel.ts:23`) vs. small-angle `ε·sin γ` with a hardcoded 365-day year (`riseSetModel.ts:29`) — they differ by up to **1.4°**. |
| P2-11 | units | Live SI leakage: `keplers-laws/logic.ts:142` converts AU/yr² → **m/s²** → ×1000 → **mm/s²**. Neither is CGS. `packages/physics/src/units.ts:76-89` exposes SI m/s² converters alongside the CGS sibling at `:91`. |
| P2-12 | eos-lab | `latexScientific(NaN)` returns `"0"` (`logic.ts:690`, verified by reading the guard) — so when the solve in P1-9 fails, the deep-dive equations confidently display **`P_deg = 0`** rather than an error. A physics failure is rendered as a physics result. |
| P2-13 | stars-zams-hr | Two divergent copies of the post-main-sequence toy model — `stageProperties` (`hrInferencePopulationModel.ts:234-313`) vs. an inline `buildEvolutionTrack` (`main.ts:311-428`) with different coefficients for every phase. The track's main sequence is `L = L_ZAMS(0.72 + 0.85f)`, so at `t = 0` the evolve marker sits **28% below the population's own main sequence**. The inline copy also violates the "no inline physics" rule in `CLAUDE.md`. |
| P2-14 | stars-zams-hr | `#evolveTime`'s `step="0.001"` Gyr is fixed in HTML while `main.ts:907-910` updates only `max`. For the offered 20 M☉ option `t_MS = 0.00559 Gyr`, giving **7 slider positions total and exactly one** in the post-MS phase — the supergiant/remnant track is effectively unreachable. The demo's own README asks students to run 20 M☉. |
| P3 | hydrostatic | `hydrostaticEquilibriumModel.ts:367-374` floors `pressureOuter` at 0 without recomputing `pressureDifference`, so `P_in − P_out ≠ dP` for `r/R > 0.970` — reachable at slider positions 98–100, where the UI reports a 400% "pressure contrast" and the force arrows disagree with the pressure labels. Export and station CSV cells also carry raw LaTeX (`1.13 \times 10^{16}`) instead of machine-readable numbers. |

**Independently verified correct** (attacked and survived): all 22 entries in `astroConstants.ts` against CODATA 2018/2022 and IAU 2015; the entire `dopplerShiftModel` including relativistic factors and `|β|≥1` guards; `stellarEosModel`'s μ, μₑ, Fermi momentum and Chandrasekhar prefactor; `galaxyRotationModel`'s Hernquist, Freeman, NFW and MOND implementations, `ρ_crit`, `a₀`, `λ₂₁`, and all four Numerical-Recipes Bessel fits; all 16 Tout et al. (1996) coefficient sets. `retrogradeMotionModel.ts:34-35` (JPL Standish elements with a source URL) is the provenance pattern the rest of the package should copy.

**`hydrostatic-equilibrium-explorer` is the strongest physics in the repository** and deserves saying so plainly. Its two pressure profiles were re-derived symbolically and then checked against a 2,000,001-point numerical integration of `−ρg` from the surface inward, agreeing to **1e-13 relative error**, with `P(R) = 0` satisfied identically. `m(r)` is genuinely the enclosed mass and consistent with each `ρ(r)`. There is no ODE integration, so there is no step-size or stiffness hazard. Central pressure is quoted as a bare `GM²/R⁴` *scale* with the caption "an order-of-magnitude support requirement, not the exact central pressure", and the exact toy-model centre is reported separately — **no coefficient is claimed that the model does not compute.** The core-temperature scale gives 14.3 MK against the solar 15.7 MK and is labelled a scale everywhere. And the ideal-gas thermal bridge was checked at every corner of the slider domain: `T/T_F > 1` throughout, so it is never applied inside a degenerate state. That is a genuine correctness property, not luck.

### 3.2 Test quality

The counts are **honest and slightly understated** — 2,138 unit + 768 executing E2E = **2,906 tests**, zero skipped in vitest, no `.only`, no commented-out blocks. The problem is not the count. It is what a passing test proves.

- **557 tests execute zero lines of demo code.** All 19 `design-contracts.test.ts` files import only `fs`, `path`, and `vitest`. **90.2%** of their 1,260 assertions are `toContain`/`toMatch` on a source file read as a string. `expect(mainTs).toContain('from "./logic"')` tests that an import statement is spelled correctly. The 26 moon-phases contract tests pass if `main.ts` is deleted. This layer is a **linter**, not a test suite — valuable, but it must not be counted as behavioural coverage.
- **`accessibility.spec.ts` is 121 of 802 E2E tests (15%)** generated from 9 literal blocks, with zero behavioural assertions. Line 66 iterates `count` times and **passes with zero assertions when `count === 0`** — replicated 19× at runtime.
- **Only 23 of 1,428 E2E assertions (1.6%) test derived physics**, 16 of them in `binary-orbits.spec.ts` alone. `parallax-distance` never checks `d = 1/p`; `keplers-laws` never checks `P² ∝ a³`; `conservation-laws` never checks a conserved quantity. `.not.toBe(before)` appears **70×** — it passes whenever the demo computes a *different wrong number*.
- **Planck's law is never evaluated.** `planckSpectralRadianceCgs` — the core physics of blackbody-radiation — has three test references, **all asserting `=== 0` on guard/overflow paths**.
- **θ = 1.22λ/D is unguarded end to end.** The model test's `0.04 < θ < 0.08` band admits any Rayleigh coefficient in ≈[0.85, 1.69], and `telescope-resolution.spec.ts` has zero numeric assertions.
- **Four models have no known-answer test at all:** `conservationLawsModel`, `retrogradeMotionModel` (loads real JPL elements, asserts only `length >= 1`), `keplerSolver`, `sanity`.
- **Self-certifying values** (the code checking itself): `eclipseGeometryModel` thresholds (1.476 vs published ≈1.58), `stellarEosModel` 17-significant-figure snapshots, `moonPhasesModel` 29.53, and a `galaxyRotationModel` test titled *"near 187 km/s"* whose assertion range is `175–185`.
- **Visual regression is off.** 34 of 34 skipped E2E tests are `test.skip("screenshot: …")`. Only `binary-orbits` has live snapshots (5), and they are `-darwin.png` while both CI jobs run `ubuntu-latest` — **structurally red**.
- **No coverage tooling exists** anywhere: no `@vitest/coverage-v8`, no c8, no istanbul. Coverage is unmeasured and currently unmeasurable.
- 49 of 372 exported `logic.ts` symbols (**13.2%**) have zero test references.
- `scripts/validate-moon-phases.test.mjs` **currently fails** (asserts a long-removed `id="toggle-sky-view"`) and is excluded from the root `test` script — rotting silently.

**Five mutations no test would catch** (each verified against every layer):

| # | Location | Mutation | Why nothing catches it |
|---|---|---|---|
| 1 | `blackbodyRadiationModel.ts:46` | `exp(x) - 1` → `+ 1` | All 3 Planck references assert `=== 0` on guard paths |
| 2 | `parallax-distance/logic.ts:116` | `y: sin` → `cos` | Sole caller's test uses `axis=(-1,0)` at phases 0/90/180, so `earthPos.y` never enters an assertion |
| 3 | `seasons/logic.ts:399` | SVG sweep flag `1 1` → `1 0` | `dayLengthArcGeometry` has zero tests; contract only greps `id="dayArc"` |
| 4 | `stars-zams-hr/logic.ts:66` | `1e5` → `1e-5` | Drives every readout; zero tests, no E2E spec, 100% string contracts |
| 5 | `keplers-laws/main.ts:716` | `getAngleFromEvent` x-mirror flip | Unexported; the one related E2E test asserts a `role` attribute and never drags |

`binary-orbits.spec.ts` and `dopplerShiftModel.test.ts` show you already know what a good test looks like. The gap is that those patterns were applied to two files out of ninety.

### 3.3 UI/UX — demos

Consistency across 19 exhibits is itself a UX property, and it has drifted badly.

```
starfield 19/19 · export 19/19 · readout-units 19/19 · station 17/19 · math 17/19
presets 17/19 · guidance 13/19 · shelf 12/19 · challenge 9/19 · animate 9/19
reset 3/19 · predict 2/19
```

- **`em-spectrum` and `planetary-conjunctions` never call `createDemoModes`** — no Station Mode, no Help dialog, no math toggle. The other 17 all have them.
- **Challenge Mode exists in five incompatible dialects** across 9 demos: toolbar `#btn-challenges` (3), toolbar `#challengeMode` (2), sidebar `#challengeModeBtn` (1), inline panel with *no launcher* (doppler-shift, spectral-lines), shelf-drawer card (hydrostatic). `telescope-resolution` renders a hard-`disabled` `#challengeMode` button and never imports `ChallengeEngine`.
- **The ID convention forked three ways** — `btn-station-mode`/`btn-help` in 3 demos vs. `stationMode`/`help` in 16. Cross-demo selectors silently no-op on the minority.
- **16 of 19 demos have no reset control.** Absent from `seasons` and `eos-lab`.
- **6 demos have zero contextual guidance**, including the golden reference `moon-phases` — demos copied from it inherited the omission.
- **53 `var()` sites across 12 demos reference custom properties defined nowhere** (165 declared, 141 used, 15 undefined, 13 without a fallback). Two silent failure modes: inside `color-mix()` an undefined var kills the entire function — so `doppler-shift`'s signature blueshift/redshift colour coding **does not render at all** (`style.css:46,49,63,67,94,95,99,100`); on SVG paint attributes the element falls back to **black** — `keplers-laws/index.html:34,39,69,71` paints the sun and earth gradients black. The `no-color-literals` invariant catches hardcoded hex but has no counterpart for undefined tokens.
- **16 normalized sliders announce meaningless raw numbers to screen readers.** The `min=0 max=1000` log-proxy pattern shows `8.20 m` visually and `410` in the accessibility tree. Only `moon-phases`, `keplers-laws`, and `em-spectrum` set `aria-valuetext`. Worst offender: `eos-lab` with 8.
- `binary-orbits/index.html:60` — **a `<label>` wraps a slider plus four buttons**, folding the button text into the slider's accessible name and making label-click forwarding fight the presets.
- `keplers-laws`' central drag interaction is **completely unsignposted** — a draggable `role="slider"` group with two pointerdown handlers and no `cursor: grab`, no hover state, no hint text. `eclipse-geometry/style.css:136-140` already has the fix.
- **Mobile:** `em-spectrum/style.css:66-68,130-132` has two `repeat(7, minmax(0,1fr))` grids with **zero media queries** and `white-space: nowrap` labels — at 390px each column is ~42px and the spectrum axis overflows. `angular-size/style.css:33-34` has the same problem (160px/115px panels at 390px).

**UX debt ranking, worst → best:**

`em-spectrum → planetary-conjunctions → keplers-laws → doppler-shift → hydrostatic-equilibrium-explorer → angular-size → stars-zams-hr → binary-orbits → telescope-resolution → eos-lab → blackbody-radiation → galaxy-rotation → seasons → conservation-laws → moon-phases → parallax-distance → retrograde-motion → spectral-lines → eclipse-geometry`

### 3.4 UI/UX — museum site

- **Seven or more built pages are unreachable.** Navigation (`Layout.astro:94-119` + `MobileNav.astro:18-23`) has only Explore / Playlists / For Instructors / About. **Zero inbound links** to `/welcome/`, `/glossary/`, or the entire `/topics/*` tree (index + 6 topic pages). `topics/[slug].astro` — with its suggested learning sequence and aggregated learning goals — is one of the best pages in the codebase and is invisible. `/welcome/` is a role-picker wizard that is the natural first-run experience and the only route into topics, and nothing links to it.
- **The `hubs` collection is dead.** Four entries, schema-validated on every build, referenced by zero pages (verified: 0 matches across `pages`, `components`, `lib`, `layouts`).
- **`hasStationPath()` can never return false.** [`catalog.ts:56-58`](apps/site/src/lib/catalog.ts:56) checks `station_path.trim().length > 0`, but the schema declares it `z.string().min(1)`. The **"Labs (Station mode)" quick filter therefore matches all 19 demos** and does nothing, and the conditional at `playlists/[slug].astro:98` is dead.
- **`for-instructors` and `instructor` are duplicates.** `/instructor/`'s entire content is section three of `/for-instructors/`. Two URLs, two card designs, one purpose — and `/instructor/` isn't in the nav, so an instructor landing there cannot discover the fuller page. `instructor/[slug].astro:63-65` still says *"Not linked from primary navigation"*, which is now false.
- **Topic tags are inert.** `TagPill.astro:9` renders a `<span>`, never an `<a>`. Combined with the orphaned topic tree, the taxonomy drives sorting and colour but is never a navigable dimension.
- **`short_key_idea` is populated for 0 of 19 demos** (verified), so every card description comes from `excerptFromBody()` — the first non-empty line of the markdown, truncated to 140 characters with no ellipsis and no word-boundary awareness. `catalog.ts:13` carries the TODO admitting it. **This is the cheapest content win available.**
- **`about.astro:15` says "14 interactive demos."** There are 19.
- **`var(--cp-text-base)` is undefined** (the scale is sm/md/lg/xl/2xl/3xl/4xl/hero). Three files ship the invalid declaration: `explore:626`, `for-instructors:217`, `topics/[slug]:442`.
- **Mobile:** `FilterBar.astro:131` sticks at `top: 52px` under a 102px header — **50px is permanently clipped at every viewport width** — and consumes 414px of a 667px phone. Exhibit iframes render into a 293×183px porthole (`IframeStage` `aspect-ratio: 16/10`) against a demo shell whose stage alone is `min-height: 360px`. Horizontal scroll at 320px from `playlists/index.astro:191` (340px grid), `explore:745`, `for-instructors:196`, and five 280px grids; `global.css` has zero media queries.
- **`playwright.config.ts` declares no viewport and no projects** — all 16 specs run at 1280×720. That is the root cause of every mobile finding above surviving to production.
- **KaTeX loads almost everywhere.** `Layout.astro:13` defaults `hasMath = true` and line 43 loads `katex.min.css` unconditionally; only `index` and `explore` opt out.
- **`DemoCanvasThumbnail` renders 38× on `/for-instructors/`** (19 station cards + 19 instructor cards), each nesting the 410-line `DemoIllustration` SVG inline. The runtime itself is well built — singleton guard, IntersectionObserver gating, reduced-motion handling, one shared rAF loop — but the same 19 demos are illustrated twice on one page.

### 3.5 Content, instructor resources, pedagogy

**Completeness gaps** (no 404s — both `[slug].astro` files generate paths from the *demos* collection — but four pages build degraded):

| Demo | Station | Instructor bundle |
|---|---|---|
| `planetary-conjunctions` | **missing** (+ no `station_params` → three blank rows and a "Generic station template" warning) | **index only, 55 words** |
| `stars-zams-hr` | **missing** | **missing entirely** |
| `eos-lab` | present | **missing entirely** |
| `retrograde-motion` | present | **`backlog.md` only** — 534 words of developer TODOs |

`retrograde-motion` is the sharpest edge: `featured: true`, linked from the homepage "Start here" block, and the one thing an instructor sees is a to-do list. `instructor/index.astro:63` only shows "scaffold template" when the section count is exactly 0, so the two 1-section bundles read as complete.

**Wave-2 instructor bundles lost the quality of wave 1.** The 11 wave-1 bundles are genuinely good — `moon-phases` gives a cold instructor a four-beat live script with exact questions, think-pair-share timings in seconds, and clicker items with distractor rationales and demo setup. Wave 2 (`doppler-shift`, `galaxy-rotation`, `spectral-lines`, `hydrostatic-equilibrium-explorer`) gives *"**Correct:** C"* with **no reasoning, no distractor rationale, no demo setup**, and short-answer prompts with **no answer keys at all**. Instructors cannot grade from these.

Missing from every bundle, including the good ones: materials/tech setup (device per pair? offline? print pages?), common student answers ("what you'll actually hear"), a recovery move when >40% pick the wrong answer, alignment to ASTR 101/201 course objectives, and **LMS-importable formats — QTI or Canvas CSV is the single biggest adoption lever here.**

**Content depth ranking** (demo frontmatter + station + instructor word counts):

`binary-orbits 3814 · seasons 3659 · eclipse-geometry 3517 · em-spectrum 3335 · parallax-distance 3282 · moon-phases 3271 · blackbody-radiation 3185 · angular-size 3158 · keplers-laws 3074 · telescope-resolution 2863 · hydrostatic-equilibrium-explorer 2796 · conservation-laws 2661 · spectral-lines 2231 · doppler-shift 2085 · galaxy-rotation 1800 · retrograde-motion 1520 · eos-lab 1020 · stars-zams-hr 358 · planetary-conjunctions 262`

Note the inversion at ranks 13–15: **the newest demos have the richest student-facing frontmatter and the thinnest instructor support** — backwards for adoption.

**Public-facing accuracy problems on `about.astro`** — this page is the most likely to be read by a funder or a colleague, and it is the strongest writing on the site, which makes these worth fixing precisely:

1. `about.astro:36` — *"every demo begins with a written prediction prompt."* Only **2 of 19** instruments have prediction gating (`binary-orbits`, `hydrostatic-equilibrium-explorer`), and `exhibits/[slug].astro:95-112` renders Predict / Play / Explain **simultaneously with no commit gate**, so the P in POE is structurally defeated.
2. `about.astro:59-60` — claims an assessment strategy measuring *"prediction accuracy, explanation quality, and reasoning under novelty."* Verified: there is **zero instrumentation** in the codebase — no analytics, no telemetry, no interaction logging. The only `localStorage` write is demo-mode persistence.
3. `about.astro:38-44` — **Bardar et al. (2007) is misattributed.** That is the Light and Spectroscopy Concept Inventory validation paper, cited here as evidence for **moon phases**.
4. `about.astro:53-60` — "Haynes et al. (2004)" on embedded assessment is unverifiable as cited.

**Licensing:** `LICENSE` and `LICENSE-CONTENT.md` are **untracked** (verified via `git ls-files`). At `HEAD` the repository has no license — all rights reserved — while the live About page says "free, open-source."

**Other:** `\\` inside `$…$` in **18 markdown bodies** (15 instructor, 3 station) renders as a KaTeX line break, including the entire header row of the printable `stations/galaxy-rotation.md` data table. Five demos appear in no playlist, and **no ASTR 201 playlist exists at all**. The glossary has 19 terms, all wave-1, while seven `[Both]`-tagged demos use undefined jargon ("inertial frame", "stationary points"). Unattributed data sources: telescope aperture specs, the nearby-star catalog, Planck-2018 cosmology parameters, and JPL elements (code comment only). `docs/curriculum/` claims a "Locked" canonical count of 25 demos (8+8+9) against a reality of 19 with **Cosmology at 0 of 9** — reconcile before any proposal reuses that text.

### 3.6 Architecture

**The humble-object contract is not held.** Measured: **24,676 lines of `main.ts` against 7,494 lines of `logic.ts` — a 3.3:1 ratio.** Roughly 3,900 lines *inside* `main.ts` are provably DOM-free (a conservative lower bound) — over half the size of all `logic.ts` combined. That code is pure, testable, and untested by construction.

| Verdict | Demos | main:logic |
|---|---|---|
| **God object** (>4:1) | angular-size 7.3, galaxy-rotation 6.4, telescope-resolution 5.2, blackbody-radiation 4.9, keplers-laws 4.5, parallax-distance 4.0 | 6/19 |
| Heavy (2.5–4:1) | binary-orbits, spectral-lines, stars-zams-hr, retrograde-motion, seasons, doppler-shift, conservation-laws, hydrostatic-equilibrium, eclipse-geometry | 9/19 |
| Acceptable | moon-phases 2.5, planetary-conjunctions 1.8, em-spectrum 1.5, **eos-lab 0.67** | 4/19 |

**`eos-lab` is the only demo with a real module split** (`regimeMap.ts`, `mechanismViz.ts`, `uplotHelpers.ts`, `regimeWorker.ts`) — and it is the only one with a healthy ratio. That is the pattern to propagate. Nothing currently enforces it: no line budget, no DOM-free-function check, no logic-coverage floor.

Two specific dissections: `binary-orbits/main.ts` (2,313 lines) has a **380-line flat top-level event-wiring block** (lines 1824–2204) that is untestable by construction, plus 521 lines of canvas drawing; `getRvChartLayout:732` is 41 pure lines holding the click-to-measure inverse transform. `spectral-lines/main.ts` (2,153 lines) has a 171-line `render()` containing **27 optional-chained writes and 28 `if (el)` guards**, a 151-line mystery state machine whose predicates *already live in `logic.ts`* (split brain), and `drawBohrAtom` (203 lines) which rebuilds the entire SVG tree and re-attaches per-orbit listeners on every render.

**Duplication inventory** — the highest-leverage refactor in the codebase:

| # | Duplicated | Demos | Notes |
|---|---|---|---|
| 1 | rAF loop + `dt` clamp + play/pause/reduced-motion | **14** | 13 independent `matchMedia` calls |
| 2 | Required-element lookup | **18** | 6 rival implementations; the shared `shared/dom.ts` is used by **1** of 19 |
| 3 | `clamp` (×21 files, mostly byte-identical), `formatNumber` (×14, **5 divergent bodies under the same name**) | 19 | `@cosmic/math` already exports `clamp`; **1 of 19 demos imports it** (verified) |
| 4 | Canvas DPR resize | 9 + site | `spectral-lines` duplicates it twice in one file |
| 5 | SVG element/arc-path builders | 7 | 498 raw `setAttribute` calls |
| 6 | `getComputedStyle` token read | **8 impls** | 7 return `""` silently → `ctx.fillStyle = ""` is a **no-op**, so a renamed token paints the wrong colour with no error |
| 7 | `exportResults` + copy handler | 18 | |
| 8 | Chip/radio wiring | 13 | 33 `aria-pressed` + 31 `aria-checked` hand-written; the right abstraction is stranded in `binary-orbits:1513` |
| 9 | Slider wiring | 19 | 75 `input` listeners |
| 10 | **World→SVG transforms: 6 implementations, 3 conventions** | 6 | `retrograde-motion:807` is y-up while `:814` in the *same file* is y-down; `keplers-laws:183` is x-mirrored; this is precisely the bug class the mandatory manual physics review exists to catch |
| 11 | Demo HTML shell | 19 | **all 19 `<head>` blocks byte-identical**; 747 lines of toolbar markup; 79 duplicated icon SVGs |
| 12 | `createDemoModes` config | 17 | 1,690 lines; 16 of 17 share an identical "Global" section |

Extracting items 1–10 nets roughly **−2,200 demo lines, +700 tested shared lines**.

**`packages/runtime` owns page *chrome* and none of the *instrument*.** Starfield, tabs, popover, modes, challenge, live region, KaTeX — clean `init*`/`dispose` shape, 19/19 adoption. Every row in the table above is missing from it.

**Dead code shipping to students** (all verified): `bottomSheet.ts` (157 lines) + its test (163) + `bottom-sheet.css` (67) is bundled into all 19 demos with **zero usage and no export**; `shared/stub-demo.ts` and `stub-modes.ts` (220 lines) have zero imports; **`packages/ui` is 2 lines with zero dependents** — a vestigial workspace package. ~610 lines removable at zero risk. `packages/math` *is* justified (physics imports it in 5 files; separating it avoids a `runtime → physics` edge).

**`validate-plot-contract.mjs` gates an architecture that does not exist.** Verified: `packages/runtime/src/plots/` is absent, and `mountPlot` appears in exactly one place in the entire repo — a *negative* assertion (`expect(mainTs).not.toContain("mountPlot")`). The one charting demo imports `uplot` directly and is uncovered. A green gate with zero coverage.

**Type safety:** `any` — runtime **21**, demos 18, site 10, physics/theme/math **0**. Non-null `!` — demos **214**, runtime 24, site 13 (**256** total). `@ts-ignore` — **0** (good). The worst offender is `challengeEngine.ts`, which defines a correct discriminated union and then destroys it with `Required<Challenge>` and 21 `as any`, leaking `check(state: any)` into consumers. `ExportRow.value: string` erases all units at the export boundary — a units-explicit project should not do that. `tsconfig.base.json` is `strict` but omits `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noFallthroughCasesInSwitch`; `apps/site` uses a different baseline.

**Silent failure:** 32 optional-chained writes to *required* elements (27 in `spectral-lines`), 77 `if (el)` guards, 14 empty catch blocks. **A renamed HTML id renders a partially blank instrument with no exception, no warning, and no failing test.** Positive counterweight: zero `console.*` in source and zero unused CSS tokens of 161.

**Also:** `scripts/*.mjs` — 2,004 lines enforcing every contract in the project — is in **no tsconfig and no linter**. `playwright.config.ts` sets no `retries`, `reporter`, `forbidOnly`, or `trace`, so a CI failure leaves no artifact. No `engines` field in any of 11 `package.json` files; `typescript` is pinned in 10 places; `uplot` is a dependency of all 19 demos and imported by one. The demos→site copy step is **correct** — `build.mjs:47` removes `public/play` before copying and `validate-play-dirs.mjs` runs after, so stale output cannot ship.

### 3.7 Delivery and tooling

- **62 files uncommitted** (43 modified, 19 untracked) including the entire `hydrostatic-equilibrium-explorer` demo, `LICENSE`, `STATUS.md`, and the new `DemoCanvasThumbnail` component. Last commit: **2026-03-18**. The branch `codex/p0-ui-ux-test-hardening` is at the same commit as `main` — nothing has been landed.
- **No linter or formatter anywhere.** Verified: no ESLint, Prettier, Biome, or `.editorconfig` at root or in any package, across ~90k lines of TypeScript.
- **Per-demo CSS outweighs the shared theme 6.3:1** — 8,001 lines across 19 `style.css` files vs. 1,261 lines in `packages/theme/styles`. `hydrostatic-equilibrium-explorer/style.css` alone is **1,307 lines**, larger than the entire theme package. Roughly 600 lines are duplicated across demos and belong in the theme, ~430 of it low-risk (entry-animation stagger on theme-owned selectors in 17 demos, plus 11 redundant `prefers-reduced-motion` blocks that `animations.css:80-88` already handles globally with `!important`). 18 dead CSS classes across 4 demos.
- **Every demo page loads a 278 KB shared JS chunk** (`assets/astroConstants-*.js`) carrying KaTeX plus the physics package, whether the demo uses math mode or not.
- **No print-media E2E coverage** despite instructor and station materials being print-first: `page.emulateMedia({ media: "print" })` appears nowhere in the test suite.
- **`validate-physics-models.mjs` enforces structure, not correctness** — "a `.test.ts` file exists" plus "the symbol is exported from index.ts". An empty test file passes. No validator reads `apps/`, so `CLAUDE.md`'s "all physics from `@cosmic/physics`" is discipline, not a gate (all 19 currently comply, but nothing stops the next one).

---

## 4. Prioritized backlog

### P1 — Do first (roughly one week)

| # | Item | Effort |
|---|---|---|
| 1 | Change the `verify` CI job to run on push, with `build` depending on it. Fix or delete the nightly workflow. | 30 min |
| 2 | `pnpm add -D @types/katex`, delete `katex.d.ts`, get typecheck green | 30 min |
| 3 | Fix `RYDBERG_EV` → 13.598435; tighten line-wavelength tolerances to ±0.01 nm; reconcile Hα against `atomicLines.ts` | 1 h |
| 4 | Fix both 404s: add `stations/index.astro`; remove the `<base>` lookup in the Surprise handler | 1 h |
| 5 | Rename the shadow-valued `--cp-glow-*` tokens; fix `form.css` focus ring; add the token-type build invariant | 2 h |
| 6 | `<div id="cp-demo">` → `<main id="cp-demo">` across 19 demos | 30 min |
| 7 | Raise `--cp-focus` opacity to reach 3:1; override `--cp-accent-ice`/`-amber` in `layer-paper.css` | 1 h |
| 8 | Commit the 62-file working tree in coherent slices, `LICENSE` first | 2 h |
| 9 | Add `site-links.spec.ts` — crawl every internal `href` on every built page, assert 200 | 2 h |
| 10 | Add an `iphone-se` Playwright project (375×667) and run the existing specs against it | 1 h |
| 11 | Correct or remove the four unsupported claims on `about.astro`; update "14" → "19" | 1 h |
| 12 | Fix the `eos-lab` NaN band (raise the zero-T shortcut to `χ ≤ 5e-3`, size the bracket from `E_F/k_BT`, sanitize curve builders with `Number.isFinite`) and make `latexScientific` surface non-finite values instead of printing `0` | 3 h |
| 13 | Fix `stars-zams-hr` clamping: widen the B−V bracket, floor the Torres BC at its validity limit, and **cull** rather than clamp out-of-frame stars | 3 h |
| 14 | Physics-review the 5 unreviewed demos; set `content_verified` to reflect reality (it is currently inverted) | 1 day |

### P2 — Next (two to three weeks)

13. Add `@axe-core/playwright` across all 19 `/play/` pages and every Astro route.
14. Rewrite `contrast.test.ts` to **parse** `tokens.css` + `layer-instrument.css` and test composited panel backgrounds, not hardcoded hex.
15. Add `@vitest/coverage-v8`; establish a baseline; gate on no-regression.
16. Add known-answer tests for the four unguarded models; evaluate Planck's law at a real point; tighten the Rayleigh band.
17. Fix `hasStationPath()` to check the stations collection; make the "Labs" filter mean something.
18. Add Topics to the nav; make `TagPill` linkable; decide `/welcome/`'s fate; delete `instructor/index.astro` in favour of `/for-instructors/`.
19. Define the 15 missing CSS custom properties; add an `apps:no-undefined-tokens` build check (~20 lines).
20. Populate `short_key_idea` for all 19 demos.
21. Author the four missing/partial instructor bundles, starting with `retrograde-motion` (featured).
22. Unify Challenge Mode to one dialect and one ID convention; add a reset control to the 16 demos lacking one.
23. Fix `galaxy-rotation`'s visible-matter benchmark, the MOND label, and the face-on slit caption.
24. Fix the `doppler-shift` arrow direction and relabel cosmological presets.
25. Re-enable visual regression: regenerate snapshots on Linux (or in Docker) and un-skip the 34 tests.

### P3 — Then

26. Add ESLint + Prettier (or Biome) with a CI gate.
27. Extract the ~600 duplicated CSS lines into `packages/theme`; delete the 18 dead classes.
28. Add `aria-valuetext` to the 16 normalized sliders.
29. Code-split KaTeX out of the shared demo chunk.
30. Add print-media E2E for station and instructor pages.
31. Consolidate the three copies of `topicOrder`/`topicLabel`/`topicDescription` into `src/lib/topics.ts`.
32. Fix the `\\`-in-KaTeX rendering bug in 18 markdown bodies.
33. Add missing constants (G, σ_SB, M☉, R☉, L☉, m_p, σ_T) to `astroConstants.ts` and delete the six private constant blocks.
34. Attribute the unattributed data sources; reconcile `docs/curriculum/`'s "locked" 25-demo count.

---

## 5. Toward state of the art

Three structural moves, each justified by a measured need rather than by taste.

### 5.1 Give `packages/runtime` (or a revived `packages/ui`) the instrument layer

**Measured need:** `main.ts` outweighs `logic.ts` 3.3:1 with ~3,900 DOM-free lines stranded in the untestable half; 12 distinct behaviours duplicated across 14–19 demos each; 8,001 lines of per-demo CSS against 1,261 of shared theme (6.3:1); 6 world→SVG transform implementations using 3 different conventions; 53 `var()` references to undefined tokens.

The runtime package owns page *chrome* and none of the *instrument*. That is why the newest demo needs 1,307 lines of CSS and 1,868 lines of `main.ts` to do what the oldest does.

**Order the extraction by correctness value, not by line count:**

1. **`createViewport`** — 6 implementations, 3 conventions, and this repo's history records three separate sign bugs in exactly this code (eclipse-geometry, keplers-laws, retrograde-motion). One implementation with a property test `toWorld(toPx(w)) ≈ w` retires the entire bug class that the mandatory manual physics review currently exists to catch. **This is the single highest-value refactor in the codebase.**
2. **`bindElements(spec)`** — throws with *all* missing ids at once. Kills 32 optional-chained writes to required elements, 77 `if (el)` guards, and 214 lying non-null assertions. Converts "renders a blank panel silently" into "fails loudly at init".
3. **`createPlayback({tick, maxDt})`** — 14 demos, ~700 lines, one place to honour reduced motion.
4. Format/clamp (delete 21 local `clamp`s; `@cosmic/math` already exports it and 1 of 19 demos uses it), canvas/SVG helpers, a throwing token reader, export + copy (which also moves `exportResults` into `logic.ts` for 18 demos, directly improving the ratio in §3.6), chip and slider binding.

Net: **≈ −1,500 lines and five eliminated bug classes.** Repurpose the 2-line `packages/ui` stub as the home so `runtime` stays "chrome" — no new workspace package needed.

**Before any of that**, take the free wins: delete `bottomSheet.*`, both `stub-*.ts`, and the `packages/ui` placeholder (~610 lines, zero risk), and add `knip` or `ts-prune`, which would have found every one of them automatically.

**Do not build a declarative demo framework yet.** The evidence says *yes* for controls/readouts/export/modes — 75 sliders, 64 hand-written ARIA state writes, 18 export builders, 1,690 lines of mode config and 747 lines of toolbar markup is a real measured surface, and a generator would make "every readout has a unit span" an invariant instead of 19 contract files. But it says *no* for the stage: `drawBohrAtom`, the seasons globe, and the eos-lab regime map are genuinely different programs. A schema imposed **now**, over 19 divergent `formatNumber` implementations and 6 coordinate conventions, would freeze that divergence into a spec.

Build it after the extraction above, and gate it: express `planetary-conjunctions` (384 lines) and `em-spectrum` (471 lines) declaratively first. **Accept if** both drop under 150 lines of `main.ts` with no E2E loss and the third demo costs under an hour. **Reject if** either needs a `custom:` escape hatch for more than 15% of its controls.

### 5.2 Make the tests test behaviour

**Measured need:** 557 tests execute zero product code; 1.6% of E2E assertions check physics; a wrong constant shipped green; five single-character mutations survive the entire suite.

The layer that would have caught the Rydberg bug is the one that barely exists: **known-answer tests against independent authorities**, and **E2E assertions on computed values** rather than `.not.toBe(before)`.

**Smallest decisive first step:** pick the five mutations listed in §3.2 and write the five tests that kill them. That is a day's work and it converts the suite from *large* to *load-bearing*. Then adopt `binary-orbits.spec.ts` as the E2E template for the other 18.

Keep the design-contracts layer — it is a genuinely useful linter — but stop counting it as coverage. Rename the directory or the describe blocks so the distinction is visible in the output.

### 5.3 Close the loop between the instrument and the evidence

**Measured need:** `STATUS.md` says "no empirical learning data yet"; `about.astro` describes an assessment strategy that has no implementation; `docs/curriculum/` claims a locked demo count that does not match reality.

For a Cottrell EdTech instrument, the gap between "we built 19 excellent simulations" and "we can show they change reasoning" is the whole proposal. Right now nothing in the codebase can produce evidence.

**Smallest decisive first step — and it is small:** the export payload already captures parameters, readouts, and a timestamp in a stable format. Add a prediction commit gate to the exhibit page (the Predict block currently renders alongside the answer, which defeats POE), capture the student's typed prediction into the same payload, and let them paste the result into an LMS assignment. That is a paste-based data pipeline requiring **no server, no tracking, no IRB complexity, and no new dependency** — and it produces exactly the prediction-accuracy and explanation-quality data `about.astro` already promises.

Only after that is producing real data should you consider instrumented telemetry.

### 5.4 Adoption

The single highest-leverage non-technical item: **QTI or Canvas-CSV export for the clicker and assessment items.** The wave-1 instructor bundles are good enough that other instructors would use them; nothing about the current format lets them.

---

## 6. Evidence index

| Claim | Verification |
|---|---|
| Gate results | Fresh runs of `pnpm build`, `pnpm test`, `pnpm -r typecheck`, `test:e2e` on 2026-09-03 |
| CI history | `gh run list --workflow=nightly-e2e.yml --limit 200`; `gh pr list --state all` |
| Rydberg error | Independently recomputed by the lead auditor: `λ = hc/[R(1/n_l² − 1/n_u²)]` for R∞ vs. R_H |
| Contrast ratios | WCAG relative-luminance formula applied to composited token values |
| Token type collision | Direct read of `tokens.css:47`, `layer-instrument.css:33`, `form.css:21-28`; 19/19 demo roots confirmed `cp-layer-instrument` |
| 404s | `apps/site/dist/stations/index.html` absent; `grep -rn '<base' apps/site/src` empty |
| Test counts | `vitest run` per package; `npx playwright test --list` |
| Content gaps | Filesystem enumeration of `content/{demos,stations,instructor,playlists,hubs}` |
| Physics models | Symbolic re-derivation and numerical spot-checks against CODATA 2018/2022, IAU 2015, JPL, Tout et al. (1996) |
| Detailed agent reports | 9 reports retained in the session scratchpad; findings above are those the lead auditor independently confirmed or judged well-evidenced |

---

## 7. What this audit did not cover

- No demo was exercised interactively in a browser; UI findings are from source analysis, numerical replication of the shipped algorithms, and the existing E2E suite.
- Legacy demos in `~/Teaching/astr101-sp26/demos/` were not compared (out of scope, and they must not be modified).
- No security or dependency-vulnerability scan was performed.
- Coverage was not measured, because no coverage tooling is installed and this audit installed nothing.

---

## 8. Two things worth saying plainly

First: **the metadata is already telling the truth.** Zero demos are marked `stable`, zero are `launch-ready`, and the 2026-04-25 audit's P0 list has been fully implemented in the working tree. Nothing in this report contradicts the project's own self-assessment — it sharpens it. The stale internal note claiming "A+ (100/100)" should be deleted so it stops misleading future sessions.

Second: **almost every P1 here is a gate that was designed but not closed**, not work that was done badly. The physics review exists and is excellent where it ran; it just never ran on five demos. The E2E suite is large and well-structured; it just never tests navigation. The token system is coherent; one token just holds two types. The CI workflow has the right jobs; they are attached to an event that never fires. That is a much better position to be in than the grade suggests, and it is why the P1 list is roughly a week rather than a quarter.
