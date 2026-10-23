# Red-team audit — Cosmic Playground, 2026-10-23

**Verdict: 51/100 (C-).** Mean of 35 independent area grades, median 52, range 34-72.
The physics core is the strongest part of this project. The layer between the physics and
the student -- drawings, labels, axes, readouts, controls -- has not been held to the same
standard, and that is where almost every serious defect lives.

Raw data: [`2026-10-23-red-team-findings.json`](./2026-10-23-red-team-findings.json)
(599 findings with evidence, failure scenario, proposed fix and verifier verdict; 1.9 MB).

Run on `claude-opus-5`. Remediation continues in a new session on Opus 5.5; the handoff
prompt is [`docs/plans/2026-10-23-remediation-handoff.md`](../plans/2026-10-23-remediation-handoff.md).

---

## 1. Method, and what it cost

| Wave | Agents | Scope | Verified? |
|---|---|---|---|
| 1 | 27 | 7 cross-cutting (physics package, architecture/DRY, site IA, design system, a11y, test/gate integrity, content/pedagogy) + one per demo | yes, P0/P1 up to a cap of 72 |
| 1 | 72 | adversarial verifiers, one per high-severity finding, instructed to **refute** by independent recomputation | - |
| 2 | 8 | legacy parity, performance, deploy/CI/licensing, SOTA benchmark, instrument UX, spec drift, touch/responsive, assessment readiness | no |

Six agents ran concurrently. Every auditor was read-only and barred from `pnpm build`,
`pnpm test`, `pnpm gates`, typecheck and Playwright, both to honour the project's
test-gating rule and because six concurrent builds would make any measurement meaningless.

**Evidence standard: independent recomputation or a line-by-line trace. A green test was
never accepted as evidence of correctness.** That rule earned its place -- see S2 below.

Measured cost: wave 1 ran **99 agents, 13,925,971 subagent output tokens, 2,739 tool calls,
152.7 min wall**; wave 2 ran **8 agents, 1,450,589 tokens, 476 tool calls, 25.7 min**.

### How much of this is real

| | Count |
|---|---|
| Findings, after dedupe | **599** (480 wave 1 + 119 wave 2) |
| Wave-1 high-severity after dedupe | 329 |
| Reached a verifier | 72 (the cap; **257 were never verified**) |
| Confirmed | **64** |
| Refuted | 8 |
| Of those 8, refuted *because this session already fixed them* | **6** |
| Genuine false positives | **2 of 72 = 3%** |
| Severity among the confirmed | 15 P0, 35 P1, 14 downgraded to P2 |

Two honest caveats. First, **257 P0/P1 findings never reached a verifier**; the workflow
logged that cap rather than hiding it, but they carry `NOT-VERIFIED-verify-cap` and must be
confirmed before being worked. Second, all 119 wave-2 findings are unverified by design.

A 3% genuine false-positive rate is the headline methodological result: a single-pass
auditor held to a recomputation standard is trustworthy. The two real misses were overreach
rather than fabrication -- a claim that `keplerSolver` is unreachable from
`@cosmic/physics` (it is re-exported) and a claim about `hubs/cosmic-playground.md`
inverting the angular-size relation (wrong line, three supporting claims failed). The other
six refutations are an artefact of auditing a tree that was being fixed underneath them,
and each confirms its physics while reporting the defect as no longer live.

---

## 2. Grades

| Grade | Area |
|---:|---|
| 34 | telescope-resolution |
| 34 | Touch, mobile and responsive |
| 42 | Scientific/pedagogical accuracy of reader-visible content |
| 42 | eclipse-geometry |
| 42 | parallax-distance |
| 42 | stars-zams-hr |
| 44 | Accessibility (WCAG 2.2 AA) |
| 44 | angular-size |
| 44 | eos-lab |
| 44 | planetary-conjunctions |
| 46 | em-spectrum |
| 46 | hydrostatic-equilibrium-explorer |
| 47 | Spec/doc drift vs code |
| 48 | spectral-lines |
| 52 | Site IA, homepage and navigation |
| 52 | Design-system integrity and enforcement honesty |
| 52 | Test-and-gate integrity |
| 52 | blackbody-radiation |
| 52 | doppler-shift |
| 52 | keplers-laws |
| 52 | Shared instrument experience across the 20 demos |
| 52 | Course-readiness |
| 54 | Monorepo architecture, DRY, single source of truth |
| 54 | binary-orbits |
| 56 | moon-phases |
| 58 | galaxy-rotation |
| 58 | retrograde-motion |
| 58 | seasons |
| 58 | State-of-the-art comparison |
| 61 | Deployment, CI, security, licensing, provenance |
| 62 | cluster-census |
| 62 | Performance and payload |
| 63 | `packages/physics` (~30 models) |
| 68 | Legacy-to-port parity |
| 72 | conservation-laws |

**Not comparable to the 2026-09-03 audit's C/59.** That graded the project as one object;
this graded 35 areas on a different rubric with far deeper per-demo reading. What *is*
comparable is that audit's core finding -- a self-assessed A+ that was wrong by 40 points.
The same class of overclaim is still present in frontmatter and public copy (S6).

---

## 3. What is actually good

This is not a courtesy section; auditors re-derived these rather than trusting them.

- **`packages/physics` (63).** All 16 Tout et al. (1996) coefficient sets re-implemented
  independently in plain JS reproduced the repo's values **exactly** (1 $M_\odot$, $Z=0.02$
  -> $L = 0.6977\,L_\odot$, $R = 0.8882\,R_\odot$, $T_{\rm eff} = 5597$ K; 10 $M_\odot$ ->
  5552 $L_\odot$, 25,095 K). `besselJ1Approx` matched an independent integral
  representation of $J_1$ to **3.7e-9** over $x \in [0.5, 20]$. $\theta_{\rm diff} =
  1.22\lambda/D$ reproduced $0.05767^{\prime\prime}$ for Hubble at 550 nm, and the Airy
  expression's first null lands exactly on $\theta_{\rm diff}$.
- **conservation-laws (72).** Every legacy control preserved at identical ranges, plus an
  effective-potential view, an energy bar and a potential tab the legacy never had.
- **Legacy parity (68).** 13 of 14 legacy demos ported; the shared engines
  (`challengeEngine`, `demoModes`, `starfield`, `tabs`, popovers) were genuinely
  consolidated into `packages/runtime` instead of copied per demo.
- **moon-phases** is a real improvement on its ancestor: umbra/penumbra cones, earthshine,
  a timeline strip, observer latitude and a rise/set view model, plus an explicit
  "Phases are NOT Earth's shadow" callout.
- **Base-path discipline** is clean -- the repo's own checker passes, and `topics.ts`,
  `readiness.ts` and `stations/index.astro` show real single-source-of-truth work.
- **Deploy/licensing (61)** is the quiet success: nothing loads from a third-party origin
  at runtime, KaTeX and fonts are vendored, and code/content licensing is separated.

---

## 4. The 15 confirmed P0s

Each was independently recomputed by a verifier told to refute it.

| File | Defect |
|---|---|
| `packages/physics/src/telescopeResolutionModel.ts:96` | AO modelled as seeing x (1-Strehl): 6x-29x too coarse. **FIXED** |
| `packages/physics/src/stellarLifetimeModel.ts:23` | Z-blind Hurley lifetime beside a Z-dependent ZAMS: up to 2.3x too long |
| `apps/demos/src/demos/stars-zams-hr/main.ts:333` | Inline duplicate evolution model; track starts 28% below its own ZAMS |
| `packages/physics/src/clusterProfileModel.ts:68` | EFF surface-brightness $\gamma$ used as a 3-D density exponent; $\gamma=3$ lands on the log-divergent mass case |
| `apps/demos/src/demos/em-spectrum/index.html:100` | Ticks evenly spaced on an 18-decade log axis: labels misplaced by up to 72x |
| `apps/demos/src/demos/em-spectrum/logic.ts:40` | Microwave defined as 0.1-1 mm, so all four of its own examples and the CMB peak classify as Radio |
| `apps/demos/src/demos/eos-lab/regimeMap.ts:256` | "GAS" label drawn on degeneracy-dominated cells, ~5 dex off ($P_{\rm deg}/P_{\rm gas} = 1347$ there) |
| `apps/demos/src/demos/keplers-laws/main.ts:394` | Newton-mode $v$ and $F$ arrows fixed at 60 px and 40 px: Kepler 2 and the inverse-square law drawn as constant |
| `apps/demos/src/demos/moon-phases/main.ts:859` | Both quarter-phase challenges grade on illuminated fraction alone, so each accepts the opposite quarter |
| `apps/demos/src/demos/moon-phases/main.ts:906` | Shadow challenge calls any $\lvert\alpha\rvert < 30^{\circ}$ a lunar-eclipse alignment: 32x the umbral window |
| `apps/demos/src/demos/parallax-distance/logic.ts:127` | Detector offset sign inverted: the star shifts *with* Earth, contradicting the drawn sightlines |
| `apps/demos/src/demos/seasons/logic.ts:522` | Day/night arc built from a superseded projection; daylight arc overruns the terminator by up to 39% of the globe radius |
| `apps/demos/src/demos/spectral-lines/main.ts:949` | Bohr transition arrow points inward in *both* modes: absorption draws the emission picture |
| `apps/demos/src/demos/spectral-lines/main.ts:1174` | Every line compressed into ~50 px of a 694 px plot: no fingerprint resolves, Mystery challenge undecidable |
| `apps/demos/src/demos/stars-zams-hr/logic.ts:200` | Guide labels hardcoded and drawn against the wrong frame |

`parallax-distance` is the one `launch-ready`, `status: stable` demo in the catalogue, and
its confirmed P0 is an inverted sign in the central measurement.

---

## 5. Six structural fixes, not 599 tickets

Each closes a whole class. This is the spine of the remediation plan.

**S1. A drawing-vs-model contract test per demo.** Nearly every P0 above is a drawing or a
label contradicting the model beneath it. Assert, at three **asymmetric** points per demo,
that the rendered geometry and labels match the model's own output. Would have caught
roughly 20 of the 64 P0s. Effort: L.

**S2. Harden `scripts/validate-math-formatting.mjs`.** It prints
`OK: no unicode-math symbols` while three separate auditors found Unicode $\mu$ and
$\Rightarrow$ reaching readers through `\uXXXX` escapes it cannot decode. Add the missing
glyphs (`<= >= != +- . / sqrt sum int -> <-`), decode `\uXXXX` and `&#x` before testing,
and add every reader-visible root to `SCAN_ROOTS`. Effort: M.

**S3. One readout component with mandatory units and an optional qualifier.** The blackbody
$L/L_\odot$ failure was structural: the model function was honestly named
`luminosityRatioSameRadius`, and the label dropped the condition. A component that cannot
render a value without a unit, and can carry a qualifier, makes that impossible. Effort: M.

**S4. One shell-level reflow fix.** `.cp-playbar` cannot wrap and the mobile shell gives it
a bare `1fr` track; no `.katex-display` containment rule reaches any demo page. Fix both in
`packages/theme`, delete the per-demo overrides that mask it, then add the `play/` routes to
`reflow.spec.ts`. Closes the 34-graded touch/mobile area across all 20 demos at once.
Effort: M.

**S5. A shell-applied `aria-valuetext` and live-region helper.** Log sliders announce their
raw 0-1000 track position in every demo, and most demos announce no readout change at all.
One helper in `packages/runtime`, applied by the shell, closes ~15 accessibility P1s.
Announce on `change` and preset clicks, never from inside `render()`. Effort: M.

**S6. Derive `content_verified` from evidence instead of asserting it.** It reads `true` on
demos with open P0s; `/about/` claims "3 modes per demo" when 9 of 20 have no Challenge
control; the **golden-reference** moon-phases station card swaps First and Third Quarter
against the demo's own model. Effort: S.

---

## 6. Scientific decisions taken (approved 2026-10-23)

| Decision | Chosen | Status |
|---|---|---|
| AO model | Core + halo: resolution = diffraction limit, Strehl reported separately as the core's energy fraction | **landed** |
| MOND baryon gravity | Share the exact Freeman disk + bulge with the Newtonian curve | **landed** |
| Blackbody $L/L_\odot$ | Relabel as flux ratio at equal radius; no physics change | **landed** |
| Lifetime metallicity | Lock the displayed pair at $Z = 0.02$ and say so; $Z$ moves only the HR position | pending |

---

## 7. Fixed and validated this session (11)

| Change | Closes | Evidence |
|---|---|---|
| `lib/catalog.ts` math-safe `excerptFromBody`, typeset by `DemoCard` | P0 raw truncated LaTeX on cards | unbalanced-math descriptions **2 -> 0** over all 20 bodies |
| `galaxyRotationModel.ts` MOND shares the Freeman disk | P0 two curves, two baryon models | RED->GREEN test; spherical/Freeman = 0.864 at $R=10$ kpc; 26/26 |
| `telescopeResolutionModel.ts` AO = diffraction limit + new `aoPsf()` | P0 AO 6x-29x too coarse | old model gave $0.400^{\prime\prime}$ for 8 m, 10 m and 39 m alike; 11/11 + 99/99 |
| blackbody readout relabelled | P0 luminosity claimed for the CMB | export and comparison table already said "same radius"; four surfaces agree |
| `noindex` moved into `<head>` | 20 instructor pages indexable | only robots meta in the repo, in head |
| skip-link `z-index` + opaque background | P1 skip link under the sticky header | `calc(var(--cp-z-sticky) + 1)` |
| `lib/nav.ts` single nav source | P1 three divergent nav lists | header, footer and MobileNav all consume it |
| `FilterBar` uses `TOPIC_LABEL` | P1 raw enum keys shown to readers | `DataInference` no longer reaches the DOM |
| Unicode `<=` replaced with words | P1 Unicode math in copy | `validate-math-formatting` EXIT=0 |
| `lib/base.ts` one `withBase()` | P2 base-path rule in **14 copies** | site typecheck 0 errors, 0 warnings |
| `.cp-readout__qualifier` in the theme | supports the relabel without per-demo CSS | theme 160/160 |

Gates run (owners of the changed code only, never the full suite): site typecheck 0/0;
`packages/physics` galaxyRotationModel 26/26 and telescopeResolutionModel 11/11;
`packages/theme` 160/160; `apps/demos` blackbody + galaxy-rotation 108/108,
telescope-resolution 99/99; `validate-invariants`, `validate-math-formatting`,
`validate-datasets`, `validate-plot-contract` all EXIT=0.

**Nothing is committed.** All 11 changes are in the working tree on `main`.

---

## 8. Where the product stands

Against the state of the art (graded 58), the physics rigour is already ahead of NAAP and
in PhET's neighbourhood. Where PhET still wins is implicit scaffolding and interaction
design: a student is expected to discover what to do, and here most demos do not reward
that. Course-readiness (52) says the same thing from the instructor's side -- most demos
cannot be assigned tomorrow because there is no pre/post item, no answer key and nothing a
student submits.

The honest summary: a strong research-grade physics library wearing an unfinished exhibit.
