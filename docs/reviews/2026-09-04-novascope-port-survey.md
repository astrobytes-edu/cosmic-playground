# Novascope → Cosmic Playground port survey

**Date:** 2026-09-04
**Scope:** read-only survey of `~/projects/drannarosen.github.io` and its `src/novascope/`
package, to decide what should move into Cosmic Playground.
**Nothing in that repo was modified.**

---

## Summary

`src/novascope/` is a 46,000-line science package inside the personal site, already
designed for extraction. Its own boundary gate
(`scripts/check-novascope-boundary.mjs`) **names cosmic-playground as an intended
consumer** and enforces the rule that makes the port cheap: the science core imports
nothing but the science core.

The recommendation is **five ports, none of which need three.js**, plus one deliberate
"do not port" list. The single highest-value item is a new demo pairing a sampled star
cluster with a live HR diagram and a live IMF histogram — content Cosmic Playground has
no equivalent of today.

### Verified directly (not taken on trust)

| Claim | Check | Result |
|---|---|---|
| `core/` is dependency-free | `grep` every non-relative import under `core/` | only `vitest` |
| `core/` touches no DOM | `grep` for `window.` / `document.` / `from "three` | only prose in comments ("pre-SN window") |
| No bundled star catalogue | word-boundary search for MIST / PARSEC / isochrone / Hipparcos | none |
| Line counts | `wc -l` | `stellar/index.ts` 299, `constants/index.ts` 166, `imf/*` 247 |
| The B−V accuracy caveat | read `photometry/passbands.ts:331` | confirmed, and see below |

---

## The five ports

### 1. `cluster-census` — a new demo *(highest value)*

Sample a star cluster from a real IMF, then show the **same stars** three ways: their
positions in space, their place on an HR diagram, and their mass histogram against the
analytic law they were drawn from.

**Port:** `core/{constants,random,imf,cluster,stellar,blackbody}` → `packages/physics`
(~1,100 lines); `state/render.ts` + `viz/{clusterField,camera,hrDiagram,histogram,axis,lifecycle}.ts`
→ a new demo (~960 lines).

**Cost:** zero new dependencies. Canvas 2D throughout.

**Why it matters pedagogically:** the massive tail of the IMF *flickers* when you reseed,
because there are only a handful of massive stars. That is small-number statistics made
visible, and CP has no IMF content at all.

### 2. Upgrade `stars-zams-hr` in place

Four drop-in replacements for `packages/physics/src/hrInferencePopulationModel.ts`:

| Today | Replace with | Provenance |
|---|---|---|
| Salpeter α = 2.35 | `maschbergerMass` — exact analytic quantile | Maschberger (2013) MNRAS 429, 1725 Eq. 5 |
| `t_MS ≈ 10 Gyr · M^−2.5` | `msLifetime` | Hurley+ (2000) eqs 4–7 |
| — | `spectralType` | Pecaut & Mamajek (2013) |
| — | `remnantFate` | Heger+ (2003): <8 M☉ WD, 8–25 NS, >25 BH |

**Keep everything CP already has** — post-main-sequence templates, the observer/theorist
mode pair, unresolved binaries, the inference log. Novascope's HR diagram has *only* a
main sequence (`toHRModel` filters to `phase === "MS"`; `postMS` is a reserved enum value
with no implementation). For ASTR 101 the turnoff and giant branch are most of the point,
so this is an upgrade to CP's population model, not a replacement for its diagram.

> **Do not swap CP's B−V.** Novascope's `colorIndex` is blackbody-derived and puts the Sun
> at **B−V = 0.46 against a real 0.65**. Its own docstring says why — line blanketing and
> the Balmer jump, which a Planck function does not have — and records that an earlier
> version of that docstring claimed the opposite. CP's empirical Ballesteros relation lands
> closer. Harvest the passband machinery for *bolometric corrections and multi-band
> colours*; keep an empirical B−V for the CMD; say in the demo which is which.

### 3. `cluster-dynamics` — a new demo

A live collisional N-body cluster in which **mass segregation is a result, not a setting**.

**Port:** `core/dynamics/{types,quantities,integrate,fsi4,direct,ic,diagnostics,monitor,choose,scenarios,timestep}`
(~2,500 lines, 11 test files) → `packages/physics`. Render with `viz/clusterField.ts` on
Canvas 2D.

**Do not port `DynamicsEngine.astro`.** It is 4,483 lines with 2,730 of inline client
script — plot tabs, binary-banner state machine, URL schema and halt logic all in one
file. The model it drives is clean; the shell is not. Rewrite against CP's
`index.html` / `main.ts` / `logic.ts` / `design-contracts.test.ts` convention. Budget 1–2 weeks.

Numbers as shipped there: N = 100–800 (default 400), Plummer softening at 0.1 of
`r_h·N^(−1/3)`, `maxStep = t_cross/2048`, 8 sub-steps per frame, default integrator FSI4
(forward-symplectic, 4th order). Energy tolerance 1e-4, and **the run halts when a hard
binary breaks the fixed step** — which is the best teaching moment on the page. No Web
Worker anywhere; it runs on `requestAnimationFrame` on the main thread.

### 4. `dust-extinction` — a new demo

`core/extinction/*` (423 lines, 386-line test) plus a ~200-line Canvas 2D plot. CCM89 and
Gordon+2023 side by side, each stopping where its published domain stops (the code returns
NaN outside its range rather than extrapolating, so the curve simply ends).

The hook is exact and CP has nothing on dust: **reddening multiplies the integrand, not the
answer.** The existing lab already shows the error from applying `A(λ_eff)` to an
integrated flux instead.

### 5. `core/photometry` → `packages/physics` as infrastructure

`passbands.ts` + `completeness.ts` + `index.ts` (620 lines) unlock filters, colour indices,
bolometric corrections, distance modulus and completeness limits for several future demos.
Validated there against a published value: Sun M_V = 4.86 vs 4.83.

> **Licensing gate first.** `passbandCurves.ts` carries 30 measured filter curves (2,859
> samples) from `lsst/throughputs` and the SVO Filter Profile Service. Each carries
> provenance and a `sourceSha256`, but **no license text**. lsst/throughputs is
> GPL-3/BSD-mixed by subdirectory and SVO curves carry the originating instrument teams'
> terms. Resolve this before redistributing under CP's Apache-2.0, or start with a
> Johnson-only subset.

Also worth taking: `core/params/urlState.ts` (180 lines, no DOM) into `packages/runtime` —
a typed query-string codec that writes only non-defaults and ignores unknown keys, so a
lecture bookmark survives a control being renamed.

---

## Do not port

| What | Why |
|---|---|
| `viz/starfield/*` + `/star-render-lab` (7,000 lines) | Needs three.js WebGPU + TSL. `three.tsl.*.js` alone is 833 KB in that site's build; CP ships zero 3D today. The subject — exposure calibration, tone mapping — is not intro material. |
| `viz/webgl/*`, `/volume-lab`, `/explore/gas-expulsion`, `/explore/cluster` | Raw WebGL 2 with hand-written GLSL, plus a 16 MB binary dataset dependency. |
| `core/feedback/*` (2,635 lines) | Research-grade: Vink vs Björklund winds, KM09 radiation pressure, Weaver bubbles. Two published wind prescriptions disagreeing by 5× is a great *graduate* lesson. Its own project note calls it a temporary prototype. |
| `/explore/feedback-budget`, `/explore/mass-segregation` | Both quarantined by their author — one for an undiagnosed rendering fault, one pending redesign. Do not inherit known-broken pages. |
| `ClusterHero.astro`, `src/lib/hero/*` | Declared site-specific and non-extractable in its own header. Its header credits CP's starfield as the lineage. |

**On three.js:** nothing in the recommended list needs it. Every port above is Canvas 2D.
The only candidates that need it are on the do-not-port list. Adding three.js should
therefore be a decision driven by a demo CP actually wants in 3D, not by this survey.

---

## Port friction to expect

1. **`.ts` import extensions.** Every intra-novascope import is `from "../constants/index.ts"`.
   CP's `tsconfig.base.json` uses `moduleResolution: "Bundler"` without
   `allowImportingTsExtensions`. Add the flag, or sed the specifiers.
2. **Unicode in comments.** Novascope headers use `M☉`, `α`, `ρ`, `→` freely. CP's
   `validate-invariants.mjs` rejects Unicode math under `apps/site` and `apps/demos` — so
   `packages/physics` is safe, but anything landing under `apps/demos/src/demos/` needs
   ASCII-ising. `#` followed by 3+ hex digits in a comment also trips `no-color-literals`.
3. **Two ZAMS implementations.** CP's `zamsTout1996Model.ts` hardcodes `tSunK: 5772`;
   novascope derives 5772.0034 from L☉/R☉/σ_SB. Pick one *before* importing the second, or
   any parity test between them is a coin flip.
4. **Bring the fixtures.** `scripts/fixtures/{stellar-startrax, imf-maschberger-progenax,
   imf-env-progenax, extinction-fluxax, dynamics-gasexpulsion}.json` (~50 KB) are the
   cross-validation anchors against progenax/startrax/fluxax/astropy. Porting the physics
   without them discards most of the reason to trust it.
5. **Known-stale spots not to inherit:** `core/optics/index.ts` has a docstring saying
   diffraction `p ~ 1.6` where the code and its derivation say 2;
   `core/colorimetry/schemes.ts` argues at length for removing two schemes that are still
   present and active.

## Licensing

The personal-site repo has **no LICENSE file**. It is the same author's, so relicensing
into CP's Apache-2.0 / CC-BY-NC-SA-4.0 is her call, but it should be stated explicitly at
port time. Upstream provenance is clean: `core/extinction` is ported from fluxax
(Apache-2.0, stated in-file), `core/imaging/toneMap.ts` from three.js r185.1 (MIT), and
`core/{stellar,imf,cluster,dynamics}` from the author's own progenax / startrax / gravax —
with `core/stellar` stating explicitly that it is **not** line-translated from any GPL code.
The only open question is the filter curves in item 5 above.
