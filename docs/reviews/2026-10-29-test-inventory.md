# Test inventory and baseline (T1), 2026-10-29

Roadmap item T1 of the remediation tracker. Every vitest and Playwright test file was read and
each test assigned one class. Nothing was edited. Per-file classifications, with a `file:line`
reason for every non-guard test, are in [`2026-10-29-test-inventory/`](2026-10-29-test-inventory/).

## Method

- **Counts and unit wall time:** one local vitest run per package (JSON reporter), 2026-10-29,
  on an idle machine.
- **CI and E2E times:** the green Pages deploy of `01ee019`, run 40836929714, desktop and mobile
  Playwright projects, 2 workers. Per-test durations are parsed from that run's log. No second
  full E2E suite was run.
- **Classification:** five read-only Sonnet readers, one per group. Each read every file in full
  and the code under test where a verdict depended on it. The lead re-checked the claims this
  document leans on (marked *checked*). The rest are the readers' readings, cited by line.

Classes:

| Class | Meaning |
|---|---|
| GUARD | asserts a behaviour or value a reader could hit, and could fail |
| STRING-ONLY | regex or `toContain` over CSS/HTML/TS source; no behaviour (unit only) |
| DUPLICATE-GATE | re-checks a `scripts/validate-*.mjs` gate, biome, tsc, or another spec |
| DUPLICATE-UNIT | E2E that re-checks a pure function a unit test already pins |
| PINS-DEFECT | asserts a value or behaviour the audit found wrong |
| ASSERTS-NOTHING | no real assertion, a tautology, dead code, or a skipped screenshot |

## Baseline

| Suite | Files | Tests | Time |
|---|---|---|---|
| `apps/demos` vitest | 52 | 1,916 | 2.1 s local |
| `packages/physics` vitest | 31 | 491 | 3.4 s local |
| `packages/theme`, `runtime`, `math` vitest | 11 | 216 | under 2 s local |
| `scripts/*.test.mjs` | 7 | 30 | see defect 1 below |
| **Unit total** | **101** | **2,653** | **~11 s local; CI `pnpm test` step 27 s** |
| Playwright, desktop and mobile | 31 specs | 1,300 runs (1,269 run, 31 skipped) | 1,349 s summed; **703 s CI wall** |

CI gate time on that run: typecheck 22 s, unit 27 s, build 19 s, **Playwright 703 s, 89% of
the gate wall time.**

## Classification

| Class | Unit tests | Share | E2E runs | Share |
|---|---|---|---|---|
| GUARD | 1,705 | 64% | 1,014 | 78% |
| STRING-ONLY | 730 | 28% | — | — |
| DUPLICATE-GATE | 71 | 3% | 199 | 15% |
| DUPLICATE-UNIT | — | — | 25 | 2% |
| PINS-DEFECT | 55 | 2% | 12 | 1% |
| ASSERTS-NOTHING | 92 | 3% | 50 | 4% |
| **Total** | **2,653** | | **1,300** | |

GUARD overstates strength. The readers flagged as weak:
- **125 package guards:** circular expectations, symmetric-point-only checks, or windows wider
  than the physics.
- **337 per-demo E2E guards:** static DOM checks, or "the value changed" checks.
- **13 tests of dead code:** the `bottomSheet` runtime module, and the plot-contract gate, which
  guards a Plotly path that no longer exists.

By group:

| Group | Files | Tests | GUARD | STRING | DUP | PINS | NOTHING |
|---|---|---|---|---|---|---|---|
| demos part 1 | 26 | 1,095 | 647 | 379 | 22 | 22 | 25 |
| demos part 2 | 26 | 821 | 463 | 251 | 34 | 28 | 45 |
| packages + scripts | 49 | 737 | 595 | 100 | 15 | 5 | 22 |
| per-demo E2E | 19 | 710 | 580 | — | 75 | 11 | 44 |
| site-wide E2E | 12 | 590 | 434 | — | 149 | 1 | 6 |

## What the inventory found

### 1. String-only tests are the only check of four design invariants

`scripts/validate-invariants.mjs` does not check the following (*checked*: a grep for
`starfield`, `celestial`, `readout__unit`, `cp-warning` and `accent2` finds nothing):
- the starfield canvas;
- celestial tokens;
- readout unit spans;
- panel translucency.

The 730 string-only unit tests, mostly in `design-contracts.test.ts`, are therefore the only
thing holding those CLAUDE.md invariants. They hold them weakly: `moon-phases`'
translucency pair passes with the declarations deleted (cd6a085e).

**Token Purity is not enforced at all.** `packages/theme/styles/tokens.css:53,54,59` still
defines `--cp-accent2`, `--cp-accent3` and `--cp-warning` (*checked*), so the undefined-token
gate cannot catch their use.

T2's brief ("delete tests that assert CSS strings") would drop those invariants to zero
coverage unless a replacement lands first.

### 2. Defect-pinning tests (67)

Unit tests that pin defects, by file:

| File | Tests | Findings |
|---|---|---|
| `eclipse-geometry/logic.test.ts` | 15 | built on a stub that contradicts the real model (baf6afc4, 03851ec4, 3559b8f9) |
| `seasons/logic.test.ts` | 9 | latitude-band ellipse and clockwise orbit (c52b5182, c7c5c678) |
| `retrograde-motion/logic.test.ts` | 6 | `resolveDistinctPair` no-op (320ea1b9); zodiac layout (a4413327, unverified) |
| `telescope-resolution/logic.test.ts` | 6 | e-notation (7856cb03); 0.4 arcsec FOV floor (4004a39d) |
| `spectral-lines/logic.test.ts` | 4 | 50–5000 nm "All" domain, a confirmed P0 (48c04de1) |
| `blackbody-radiation` | 4 | e-notation (a926069f); 10 nm–$10^6$ nm domain (1277cdf6); stale `aria-pressed` (7beba0f9) |
| `planetary-conjunctions/logic.test.ts` | 3 | e-notation; "yr days" readout (28fd346c) |
| `eos-lab/logic.test.ts` | 2 | the 3/2 midpoint (5bc1bfe0) |
| `em-spectrum/logic.test.ts` | 1 | microwave band boundary, a P0 (6b9e34a9) |
| `packages/physics` | 5 | `clusterProfileModel` (e3496cf8, two tests); `stellarEosModel` $P_{\rm deg,e}$ 24.8% high (5dde4737); `keplersLawsModel` clamp (c97297fb, disputed); Startrax parity at $Z = 0.02$ only (b45450de) |

E2E tests that pin defects:
- `seasons.spec.ts`, 3 tests: 3e7aa345 and 779a7d4a.
- `binary-orbits.spec.ts`, 4 tests that assert prediction gating is absent: ded36b8b and
  b8e115e2.
- One test each in `keplers-laws.spec.ts` (0317d2bc, the drift readout that always shows
  0.000%), `planetary-conjunctions.spec.ts` (45ffd858), `galaxy-rotation.spec.ts` (6afb0df1),
  `spectral-lines.spec.ts` (8e77b02e, a false NIST credit) and `smoke.spec.ts:143`.

About 10 of these rest on findings the audit marked NOT VERIFIED. A pin is only a defect if
its finding holds, so each is re-checked before it is changed.

Classification call: the solar-$Z$ values in `stellarLifetimeModel.test.ts` (302b5e41) stay
GUARD. They are correct at $Z = 0.02$; the defect is that the function has no $Z$ argument,
which is a coverage gap rather than a wrong assertion.

### 3. Where the E2E time goes

| Item | CI cost | Evidence |
|---|---|---|
| `retrograde-motion.spec.ts:662` | 60 s, the slowest single test | two `waitForTimeout(30_000)`; asserts only "no console errors" (*checked*: 1.0 min on CI) |
| `reflow.spec.ts` in the desktop project | 26 s | every test sets 320×512 at `:68`, so the desktop run repeats the mobile one (*checked*) |
| `accessibility.spec.ts` | 121 s | reloads per test, 120 loads; 60 tests duplicate `validate-play-dirs`; the static checks need no browser |
| `eos-lab.spec.ts` | 138 s | 4.3 s per test; nine Tab 2 tests each reload the same page |
| `layout-budget.spec.ts` | ~24 s of waits | `waitForTimeout(600)` × 40 at `:149` and `:223` |
| `/play/` page loads | — | each of the 20 demos is loaded about 13 times across 6 site-wide specs |

**Estimated removable time, by deleting non-guard runs:**
- about 171 s from the per-demo specs (61 s of it is the retrograde test);
- about 118 s from the site-wide specs.

That is about 290 s of the 1,349 s summed, roughly 21%. Consolidating page loads would save an
estimated 110 s more.

Both figures come from per-test CI durations and averages. They are NOT MEASURED as wall-clock
savings. With 2 workers, wall time falls by roughly half the summed saving. T4 measures it.

### 4. Gaps in what the suites guard

The readers found five behaviours a reader would see that no test asserts:
- a finite Planck or Wien value (blackbody);
- the Doppler shift direction;
- a telescope resolution value that fails at coefficient 1.0 or 1.5 (the current window passes
  1.0, 1.22 and 1.5);
- higher speed at perihelion in Kepler;
- any computed spectral-line wavelength in the demo.

Two more are checked only at points that hide a sign error:
- the moon-phases waxing/waning test, at 0° and 180° only;
- the parallax axis offset unit test, at 0°, 90° and 180° only. The integration test covers
  the asymmetric phases.

These are T3 inputs.

### 5. Defects in the test setup

1. **Root `vitest run scripts/<x>.test.mjs` also collects the copies under `.claude/worktrees/*`.**
   The repo root has no vitest config, so each script suite ran 4 times locally. CI has no
   worktrees, so it is unaffected. A root config with `exclude: [".claude/**"]` fixes it.
2. `content-claims.spec.ts:50,58` would `goto` `/undefined/` if no station demo were verified.
3. `layout-budget.spec.ts:204` allows the sidebar `<=` its budget, so the budget cannot ratchet
   down.

### 6. Audit findings this inventory found stale

These are the readers' claims. Each is checked again before the tracker changes.

| Finding | Reader's claim |
|---|---|
| 55912396 (AO model) | fixed in source; `telescopeResolutionModel.test.ts:72-110` pins the fix |
| aaceb7e5 (MOND acceleration) | `vMondKmS` now uses `vVisibleKmS` (`galaxyRotationModel.ts:466`); only `vMondDeepKmS` still uses the spherical mass |
| c9d6ca8f, cee8b691, 270cce28 | `validate-math-formatting.test.mjs` shows the escape gaps are closed |
| b57bc03e | six specs load hydrostatic-equilibrium-explorer |
| 45a4866e | cites `:162`/`:232`; the waits are at `:149`/`:223` |
| bd6d1154 | partly stale: the Unicode-arrow pin is gone |

## Caveats

- Verdicts (keep, trim, rewrite, delete) are the readers' judgement, not measurements.
- E2E counts include the reflow spec twice, which is why there are 590 site-wide runs for 520
  unique tests.
- Line numbers are from the working tree on 2026-10-29.
