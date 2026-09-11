# Conservation Laws Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/play/conservation-laws/` show the orbit the student actually set: exact presets, the particle at $r_0$, honest arrows and view, energy that visibly trades between $K$ and $U$ while $\varepsilon$ stays fixed, and announcements. Then fix the teaching copy that depends on it.

**Architecture:** Exact state lives in JS and the sliders only display it. One physics function, `ConservationLawsModel.initialOrbit`, derives everything the demo shows (elements, start anomaly, periapsis/apoapsis, periapsis speed). The display, the Station table and the announcements all read that one result. Conic helpers move out of `logic.ts` into `packages/physics`; `logic.ts` keeps only view, arrow, formatting and announcement rules.

**Tech Stack:** TypeScript, Vite demos, Vitest (physics + demo logic), Astro content collections, Playwright E2E, KaTeX.

**Source:** adversarial review of 2026-09-11, verified against the live deploy of 5d20f02 and an independent recompute. The finding IDs below refer to that report.

---

## Findings -> tasks

| ID | Severity | Finding | Task |
|---|---|---|---|
| P1 | High | Escape preset snaps $\sqrt2$ to 1.41: bound, e = 0.988; Station row says parabolic | 3, 7, 8 |
| P2 | High | Particle starts at periapsis, not at $r_0$; speed readout shows periapsis speed | 1, 3, 7 |
| P3 | High | Speed factor 0 labelled "parabolic (escape)" with $\varepsilon<0$; stale particle | 1, 7 |
| B1 | High | Q1 key, station card, activities and live-teach script need a state the slider cannot reach | 10 |
| B2 | High | Exhibit asks about linear momentum; no $K$/$U$ shown | 6, 7, 10 |
| P4 | Medium | View collapses near escape (5 px/AU) and jumps 8.3x across it | 4, 7 |
| P5 | Medium | Arrow = 60 px x $v/v_{\rm circ}(r_0)$, clamped 20-120 px | 5, 7 |
| U1 (U8) | Medium | No announcements | 6, 7, 8 |
| U2 | Medium | Phone: controls 870 px below the orbit | Deferred (D3) |
| H1 | Medium | Tests encode the defects | 1-9 |
| B3 | Medium | Q2 says $h = rv\sin\phi$; demo angle needs $\cos$ | 10 |
| H2 | Medium | Parity audit all "Pending"; `content_verified: true` | 11 |
| B4 | Low | Instructor raw carets and `√2` headings; validator gap | Delegated agent (branch `claude/instructor-math-formatting`), merged in Task 10 |
| B5 | Low | ASCII math in help text and slider values | 7, 9 |
| H3 | Low | Vacuous Tab test; dead `classifyOrbit`; stale backlog | 6, 9, 10 |
| U3 | Low | "What to notice" below the fold at 1440x900 | No change (D5) |

## Decisions (stated assumptions; Anna can overrule)

- **D1 Arrow scale (Anna's call, contribution point).** Recommended: the arrow is the distance covered in a round time step $\Delta t$ at the current velocity, drawn at the orbit's own px/AU scale. $\Delta t$ is picked once per orbit from `[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]` days so that the fastest arrow (at periapsis) is at most 120 px, and the caption names $\Delta t$. Within an orbit the length is exactly proportional to speed (no clamp). Across orbits it stays honest through the caption, e.g. $M = 10\,M_\odot$ shows 90.7 px in 10 d against 57.3 px in 20 d at $M = 1$, a ratio of $\sqrt{10}$. Alternative: normalize to periapsis speed with a "longest arrow = $v_p$" key. Task 5 marks `pickArrowDtDays` as the spot for Anna to write it herself if she wants.
- **D2 Station column labels stay ASCII** (`eps (AU^2/yr^2)`): `demoModes.ts:308` writes the same labels into the CSV header, so LaTeX there would put `$...$` into exported data. Rendering headers with KaTeX while stripping them for CSV is a runtime change, out of scope.
- **D3 U2 phone order is deferred to the shared shell.** `demo-shell.css:316-330` stacks viz, playbar, readouts, sidebar below 1024 px for every triad demo and names a bottom sheet as the planned fix. A per-demo reorder would fork shared layout. Record it in STATUS.md.
- **D4 No visual redesign here.** The energy bar chart, swept-area view, Challenge Mode and stage-first composition need the design brief and Anna's approval of a visual direction. This plan restores legacy parity ($K$, $U$ readouts) and fixes correctness only.
- **D5 U3 accepted.** The drawer is secondary content; the stage and all readouts must stay above the fold instead.
- **D6 Title stays "Conservation Laws: Energy & Momentum"**; the momentum in question is angular momentum, and the prompt and tags are reworded to say so.

## Conventions for every task

- Branch: `claude/conservation-laws-refactor` (already created from main at 5d051da). `git branch --show-current` before committing.
- Stage explicit paths only. Hooks block `git add -A`, `git add .`, `git commit -a`, force pushes and a second Playwright run.
- End every commit message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Capture exit codes directly: `cmd > log 2>&1; echo EXIT=$?`. Never through a pipe.
- A RED must fail on assertions. "no tests" means the file failed to load.
- Skills: @cosmic-physics (Tasks 1-5), @cosmic-demo-contracts and @cosmic-a11y (Tasks 6-9), @cosmic-instructor-materials (Task 10), @cosmic-readiness (Task 11), @cosmic-verification (Tasks 12-13), @superpowers:test-driven-development throughout.

### Commands

| What | Command |
|---|---|
| Physics tests (one file) | `corepack pnpm -C packages/physics exec vitest run src/twoBodyAnalytic.test.ts` |
| Demo unit tests | `corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws` |
| Typecheck | `corepack pnpm -r typecheck` |
| Build (demos + site; E2E serves this) | `corepack pnpm build` |
| This demo's E2E | `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test --project=desktop tests/conservation-laws.spec.ts` |
| All gates | `corepack pnpm gates` |

E2E runs against `pnpm preview` of the last build (`playwright.config.ts:56-60`), so **rebuild before every E2E run** or it measures stale code. The desktop project is 1280x720.

### Reference values

Every number in the tests below comes from an independent recompute that uses $\mathbf{e} = [(v^2-\mu/r)\,\mathbf{r} - (\mathbf{r}\cdot\mathbf{v})\,\mathbf{v}]/\mu$, not the model's $\mathbf{v}\times\mathbf{h}$ form. $G = 4\pi^2$ AU$^3$/(yr$^2$ $M_\odot$), start at $(r_0, 0)$, velocity $v\,(\sin\theta, \cos\theta)$ with $\theta$ from tangential, + outward. The script is in Appendix A; rerun it if a value is in doubt.

| State ($M$, $r_0$, $f$, $\theta$) | e | $\varepsilon$ | h | $r_p$ | $r_a$ | $\nu_0$ (rad) | $v_p$ (AU/yr) | view R (AU) | $\Delta t$ (d) | arrow at start (px) |
|---|---|---|---|---|---|---|---|---|---|---|
| circular (1, 1, 1, 0) | 0 | -19.739209 | 6.283185 | 1 | 1 | 0 | 6.283185 | 1.5 | 20 | 57.341 |
| elliptical (1, 1, 0.75, 0) | 0.4375 | -28.375113 | 4.712389 | 0.391304 | 1 | $\pi$ | 12.042772 | 1.5 | 20 | 43.006 |
| (1, 1, 1.40, 0) | 0.96 | -0.789568 | 8.796459 | 1 | 49 | 0 | 8.796459 | 6 | 100 | 100.347 |
| escape (1, 1, $\sqrt2$, 0) | 1 | 0 | 8.885766 | 1 | inf | 0 | 8.885766 | 6 | 100 | 101.366 |
| (1, 1, 1.42, 0) | 1.0164 | 0.323723 | 8.922123 | 1 | inf | 0 | 8.922123 | 6 | 100 | 101.781 |
| hyperbolic (1, 1, 1.8, 0) | 2.24 | 24.476619 | 11.309734 | 1 | inf | 0 | 11.309734 | 6 | 50 | 64.509 |
| (1, 1, 1.2, +60) | 0.893532 | -11.053957 | 3.769911 | 0.190121 | 3.381308 | 2.369222 | 19.829024 | 3.719438 | 20 | 27.750 |
| ($10^{0.4}$, $10^{-0.3}$, 0.9, -30) | 0.526379 | -117.727169 | 5.494814 | 0.199473 | 0.642859 | -2.412321 (wrapped 3.870864) | 27.546673 | 1.5 | 5 | 28.884 |
| (10, 1, 1, 0) | 0 | -197.392088 | 19.869177 | 1 | 1 | 0 | 19.869177 | 1.5 | 10 | 90.665 |
| (1, 10, 1.8, 0) | 2.24 | 2.447662 | 35.764518 | 10 | inf | 0 | 3.576452 | 50 | 2000 | 97.918 |

At the start of the elliptical preset $K_0 = 11.103305$ and $U_0 = -39.478418$. For the asymmetric state $\mu = 99.165302$, $K_0 = 80.133620$, $U_0 = -197.860789$.

---

### Task 0: Baseline

**Files:** none.

**Step 1: Record the starting counts**

```bash
git branch --show-current
corepack pnpm -C packages/physics exec vitest run src/twoBodyAnalytic.test.ts src/conservationLawsModel.test.ts > /tmp/cl-phys0.log 2>&1; echo EXIT=$?
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws > /tmp/cl-demo0.log 2>&1; echo EXIT=$?
```

Expected: `claude/conservation-laws-refactor`; physics 16 passed; demo 97 passed (measured 2026-09-11). If either differs, stop and find out why before changing code.

---

### Task 1: Radial motion and the start anomaly in `TwoBodyAnalytic` (P2, P3)

**Files:**
- Modify: `packages/physics/src/twoBodyAnalytic.ts` (`orbitElementsFromStateAuYr`, lines 166-246)
- Test: `packages/physics/src/twoBodyAnalytic.test.ts`

Nothing outside `conservation-laws` calls `orbitElementsFromStateAuYr` (grep of `apps/` and `packages/`, 2026-09-11), so adding a `"radial"` type is safe.

**Step 1: Write the failing tests** (append to `twoBodyAnalytic.test.ts`)

```ts
describe("orbitElementsFromStateAuYr at the edges and off-axis", () => {
  const mu = 4 * Math.PI * Math.PI;
  const state = (r0Au: number, speedAuYr: number, directionDeg: number) => {
    const a = (directionDeg * Math.PI) / 180;
    return {
      rVecAu: { xAu: r0Au, yAu: 0 },
      vVecAuYr: { vxAuYr: speedAuYr * Math.sin(a), vyAuYr: speedAuYr * Math.cos(a) }
    };
  };

  it("a body at rest is radial and bound, not parabolic", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 0, 0), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("radial");
    expect(el.epsAu2Yr2).toBeCloseTo(-mu, 10);
    expect(el.hAbsAu2Yr).toBe(0);
  });

  it("purely radial outward motion is radial", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 3, 90), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("radial");
  });

  it("exact escape speed, tangential, is parabolic with zero energy", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 2 * Math.PI * Math.SQRT2, 0), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("parabolic");
    expect(Math.abs(el.epsAu2Yr2)).toBeLessThan(1e-12);
  });

  it("a start below circular speed is at apoapsis (nu = pi)", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 0.75 * 2 * Math.PI, 0), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(Math.cos(el.nuRad)).toBeCloseTo(-1, 12);
  });

  it("an outward start (f = 1.2, +60 deg) is past periapsis", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 1.2 * 2 * Math.PI, 60), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("elliptical");
    expect(el.ecc).toBeCloseTo(0.893532, 5);
    expect(el.epsAu2Yr2).toBeCloseTo(-11.053957, 5);
    expect(el.nuRad).toBeCloseTo(2.369222, 5);
  });

  it("an inward start at an asymmetric state has negative true anomaly", () => {
    const massSolar = 10 ** 0.4;
    const r0Au = 10 ** -0.3;
    const muHere = mu * massSolar;
    const v = 0.9 * Math.sqrt(muHere / r0Au);
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(r0Au, v, -30), muAu3Yr2: muHere });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.ecc).toBeCloseTo(0.526379, 5);
    expect(el.epsAu2Yr2).toBeCloseTo(-117.727169, 4);
    expect(el.hAbsAu2Yr).toBeCloseTo(5.494814, 5);
    expect(el.nuRad).toBeCloseTo(-2.412321, 5);
  });
});
```

**Step 2: Run and confirm they fail on assertions**

Run: `corepack pnpm -C packages/physics exec vitest run src/twoBodyAnalytic.test.ts > /tmp/cl-t1.log 2>&1; echo EXIT=$?`
Expected: EXIT=1. "a body at rest" gets `"parabolic"`; the purely radial outward case gets `"parabolic"`; the three `nuRad` tests get `undefined` (NaN comparisons). "exact escape" may already pass; it pins behaviour Task 3 depends on.

**Step 3: Implement**

In `twoBodyAnalytic.ts`, export the type above `orbitElementsFromStateAuYr`:

```ts
export type TwoBodyOrbitType = "elliptical" | "circular" | "parabolic" | "hyperbolic" | "radial";
```

Change the return type's `orbitType` to `TwoBodyOrbitType` and add `nuRad: number;` to it. Replace the block from `// Periapsis direction is along eccentricity vector.` through the `return { ... }` with:

```ts
  // Periapsis direction is along eccentricity vector.
  const omega = ecc < 1e-14 ? 0 : Math.atan2(ey, ex);

  // True anomaly of this state: the angle from periapsis to r, measured in the direction of motion.
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const along = x * cosO + y * sinO;
  const ahead = -x * sinO + y * cosO;
  const nuRad = Math.atan2(hz >= 0 ? ahead : -ahead, along);

  // h = 0 (no sideways speed) is a straight-line fall or rise. Its eccentricity vector is -r_hat,
  // so |e| = 1 would otherwise read as "parabolic" whatever the energy.
  const RADIAL_TOL = 1e-12;
  const isRadial = h <= RADIAL_TOL * r * Math.sqrt(v2 + muAu3Yr2 / r);

  const E_TOL = 1e-8;
  let orbitType: TwoBodyOrbitType | "invalid" = "elliptical";
  if (!Number.isFinite(ecc)) orbitType = "invalid";
  else if (isRadial) orbitType = "radial";
  else if (ecc < 1e-10) orbitType = "circular";
  else if (Math.abs(ecc - 1) < E_TOL) orbitType = "parabolic";
  else if (ecc > 1) orbitType = "hyperbolic";

  if (orbitType === "invalid") return { orbitType: "invalid" };

  return {
    rAu: r,
    v2Au2Yr2: v2,
    epsAu2Yr2: eps,
    hAu2Yr: hz,
    hAbsAu2Yr: h,
    ecc,
    eVec: { ex, ey },
    pAu: p,
    aAu: a,
    omegaRad: omega,
    nuRad: isRadial ? Number.NaN : nuRad,
    orbitType
  };
```

**Step 4: Run and confirm they pass**

Run: `corepack pnpm -C packages/physics exec vitest run src/twoBodyAnalytic.test.ts > /tmp/cl-t1.log 2>&1; echo EXIT=$?`
Expected: EXIT=0, 15 passed (9 existing + 6 new).

Then `corepack pnpm -C packages/physics exec tsc -p tsconfig.json --noEmit > /tmp/cl-t1tc.log 2>&1; echo EXIT=$?`. Expected EXIT=0. `apps/demos` will not typecheck until Task 8 (its `main.ts` still types `orbitType` without `"radial"`); that is expected.

**Step 5: Commit**

```bash
git add packages/physics/src/twoBodyAnalytic.ts packages/physics/src/twoBodyAnalytic.test.ts
git commit -m "Classify zero-angular-momentum states as radial and report the start anomaly

A body at rest has |e| = 1 and was labelled parabolic (escape) while bound.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Move the conic helpers into physics, add the energy split (architecture, B2)

`logic.ts:119-191` holds orbital-mechanics formulas (`orbitalRadiusAu`, `conicPositionAndTangentAu`, `instantaneousSpeedAuPerYr`). The invariant is that demo code calls models and never re-derives equations, so they move to `ConservationLawsModel` with object arguments like the rest of that file. The old copies and their tests in `logic.ts` / `logic.test.ts` are deleted in Task 6.

**Files:**
- Modify: `packages/physics/src/conservationLawsModel.ts`
- Test: `packages/physics/src/conservationLawsModel.test.ts`

**Step 1: Write the failing tests** (append)

```ts
describe("ConservationLawsModel conic helpers", () => {
  const mu = 4 * Math.PI * Math.PI;

  it("orbitalRadiusAu: periapsis at nu = 0, apoapsis at nu = pi, NaN past the asymptote", () => {
    expect(ConservationLawsModel.orbitalRadiusAu({ ecc: 0.5, pAu: 1, nuRad: 0 })).toBeCloseTo(1 / 1.5, 12);
    expect(ConservationLawsModel.orbitalRadiusAu({ ecc: 0.5, pAu: 1, nuRad: Math.PI })).toBeCloseTo(2, 12);
    expect(ConservationLawsModel.orbitalRadiusAu({ ecc: 2, pAu: 1, nuRad: Math.acos(-0.5) })).toBeNaN();
  });

  it("conicPositionAndTangentAu: omega rotates the orbit, tangent is perpendicular on a circle", () => {
    const rot = ConservationLawsModel.conicPositionAndTangentAu({ ecc: 0, pAu: 2, omegaRad: Math.PI / 2, nuRad: 0 });
    expect(rot!.xAu).toBeCloseTo(0, 12);
    expect(rot!.yAu).toBeCloseTo(2, 12);
    const p = ConservationLawsModel.conicPositionAndTangentAu({ ecc: 0, pAu: 2, omegaRad: 0, nuRad: Math.PI / 4 });
    expect(p!.xAu * p!.dxAu + p!.yAu * p!.dyAu).toBeCloseTo(0, 10);
    expect(ConservationLawsModel.conicPositionAndTangentAu({ ecc: -1, pAu: 1, omegaRad: 0, nuRad: 0 })).toBeNull();
  });

  it("instantaneousSpeedAuPerYr: circular speed everywhere on a circle, faster at periapsis", () => {
    const h = 2 * Math.PI;
    expect(ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: mu, hAbsAu2Yr: h, ecc: 0, nuRad: 2 })).toBeCloseTo(2 * Math.PI, 10);
    const hEll = 0.75 * 2 * Math.PI;
    const vPeri = ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: mu, hAbsAu2Yr: hEll, ecc: 0.4375, nuRad: 0 });
    const vApo = ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: mu, hAbsAu2Yr: hEll, ecc: 0.4375, nuRad: Math.PI });
    expect(vPeri).toBeCloseTo(12.042772, 5);
    expect(vApo).toBeCloseTo(0.75 * 2 * Math.PI, 10);
  });

  it("specificEnergyPartsAu2Yr2: K = v^2/2, U = -mu/r, eps = K + U", () => {
    const parts = ConservationLawsModel.specificEnergyPartsAu2Yr2({ rAu: 1, vAuYr: 0.75 * 2 * Math.PI, muAu3Yr2: mu });
    expect(parts.kAu2Yr2).toBeCloseTo(11.103305, 5);
    expect(parts.uAu2Yr2).toBeCloseTo(-39.478418, 5);
    expect(parts.epsAu2Yr2).toBeCloseTo(-28.375113, 5);
  });

  it("K + U is the same at every point of an asymmetric orbit (conservation)", () => {
    const muHere = mu * 10 ** 0.4;
    const ecc = 0.526379;
    const pAu = 0.304471;
    const hAbsAu2Yr = Math.sqrt(muHere * pAu);
    const epsAt = (nuRad: number) => {
      const rAu = ConservationLawsModel.orbitalRadiusAu({ ecc, pAu, nuRad });
      const vAuYr = ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: muHere, hAbsAu2Yr, ecc, nuRad });
      return ConservationLawsModel.specificEnergyPartsAu2Yr2({ rAu, vAuYr, muAu3Yr2: muHere }).epsAu2Yr2;
    };
    const eps0 = epsAt(0.3);
    for (const nu of [1.1, 2.2, 3.3, 4.4, 5.5]) {
      expect(epsAt(nu)).toBeCloseTo(eps0, 9);
    }
  });
});
```

**Step 2: Run and confirm they fail**

Run: `corepack pnpm -C packages/physics exec vitest run src/conservationLawsModel.test.ts > /tmp/cl-t2.log 2>&1; echo EXIT=$?`
Expected: EXIT=1 with "is not a function" failures for the five new tests (the functions do not exist yet).

**Step 3: Implement** (in `conservationLawsModel.ts`, above `export const ConservationLawsModel`)

```ts
/** r(nu) = p / (1 + e cos nu). NaN where the conic does not reach (hyperbola past its asymptote). */
function orbitalRadiusAu(args: { ecc: number; pAu: number; nuRad: number }): number {
  const { ecc, pAu, nuRad } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return NaN;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return NaN;
  if (!Number.isFinite(nuRad)) return NaN;
  const denom = 1 + ecc * Math.cos(nuRad);
  return denom > 0 ? pAu / denom : NaN;
}

/** Position and d(position)/d(nu) in the plot frame (orbit rotated by omega). */
function conicPositionAndTangentAu(args: {
  ecc: number;
  pAu: number;
  omegaRad: number;
  nuRad: number;
}): { xAu: number; yAu: number; dxAu: number; dyAu: number } | null {
  const { ecc, pAu, omegaRad, nuRad } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return null;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return null;
  if (!Number.isFinite(omegaRad) || !Number.isFinite(nuRad)) return null;

  const cosNu = Math.cos(nuRad);
  const sinNu = Math.sin(nuRad);
  const denom = 1 + ecc * cosNu;
  if (!(denom > 0)) return null;

  const r = pAu / denom;
  const drDnu = (pAu * ecc * sinNu) / (denom * denom);
  const xOrb = r * cosNu;
  const yOrb = r * sinNu;
  const dxOrb = drDnu * cosNu - r * sinNu;
  const dyOrb = drDnu * sinNu + r * cosNu;

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);
  return {
    xAu: xOrb * cosO - yOrb * sinO,
    yAu: xOrb * sinO + yOrb * cosO,
    dxAu: dxOrb * cosO - dyOrb * sinO,
    dyAu: dxOrb * sinO + dyOrb * cosO
  };
}

/** v(nu) = (mu / h) sqrt(1 + 2 e cos nu + e^2). */
function instantaneousSpeedAuPerYr(args: {
  muAu3Yr2: number;
  hAbsAu2Yr: number;
  ecc: number;
  nuRad: number;
}): number {
  const { muAu3Yr2, hAbsAu2Yr, ecc, nuRad } = args;
  if (!Number.isFinite(muAu3Yr2) || !(muAu3Yr2 > 0)) return NaN;
  if (!Number.isFinite(hAbsAu2Yr) || !(hAbsAu2Yr > 0)) return NaN;
  if (!Number.isFinite(ecc) || ecc < 0 || !Number.isFinite(nuRad)) return NaN;
  const q = 1 + 2 * ecc * Math.cos(nuRad) + ecc * ecc;
  return (muAu3Yr2 / hAbsAu2Yr) * Math.sqrt(Math.max(0, q));
}

/** Specific kinetic and potential energy and their sum, AU^2/yr^2. */
function specificEnergyPartsAu2Yr2(args: { rAu: number; vAuYr: number; muAu3Yr2: number }): {
  kAu2Yr2: number;
  uAu2Yr2: number;
  epsAu2Yr2: number;
} {
  const { rAu, vAuYr, muAu3Yr2 } = args;
  const kAu2Yr2 = Number.isFinite(vAuYr) ? 0.5 * vAuYr * vAuYr : NaN;
  const uAu2Yr2 = rAu > 0 && muAu3Yr2 > 0 ? -muAu3Yr2 / rAu : NaN;
  return { kAu2Yr2, uAu2Yr2, epsAu2Yr2: kAu2Yr2 + uAu2Yr2 };
}
```

Add `orbitalRadiusAu, conicPositionAndTangentAu, instantaneousSpeedAuPerYr, specificEnergyPartsAu2Yr2` to the exported `ConservationLawsModel` object.

**Step 4: Run and confirm they pass**

Run the same command. Expected: EXIT=0, 10 passed (5 existing + 5 new).

**Step 5: Commit**

```bash
git add packages/physics/src/conservationLawsModel.ts packages/physics/src/conservationLawsModel.test.ts
git commit -m "Move the conic helpers into ConservationLawsModel and add the K/U split

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `initialOrbit`, the one derivation everything reads (P1, P2)

**Files:**
- Modify: `packages/physics/src/conservationLawsModel.ts`
- Test: `packages/physics/src/conservationLawsModel.test.ts`

**Step 1: Write the failing tests** (append)

```ts
describe("ConservationLawsModel.initialOrbit", () => {
  const at = (o: ReturnType<typeof ConservationLawsModel.initialOrbit>) => {
    if (o.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    return o;
  };
  const startPoint = (o: ReturnType<typeof at>) =>
    ConservationLawsModel.conicPositionAndTangentAu({ ecc: o.ecc, pAu: o.pAu, omegaRad: o.omegaRad, nuRad: o.nu0Rad })!;

  it("elliptical preset starts where the student put it: r0 on +x, at apoapsis", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0.75, directionDeg: 0 }));
    expect(o.orbitType).toBe("elliptical");
    expect(o.nu0Rad).toBeCloseTo(Math.PI, 12);
    expect(startPoint(o).xAu).toBeCloseTo(1, 12);
    expect(startPoint(o).yAu).toBeCloseTo(0, 12);
    expect(o.rpAu).toBeCloseTo(0.391304, 6);
    expect(o.raAu).toBeCloseTo(1, 12);
    expect(o.vPeriAuYr).toBeCloseTo(12.042772, 5);
  });

  it("the start speed is the speed that was set, not the periapsis speed", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.2, directionDeg: 60 }));
    const vStart = ConservationLawsModel.instantaneousSpeedAuPerYr({
      muAu3Yr2: o.muAu3Yr2, hAbsAu2Yr: o.hAbsAu2Yr, ecc: o.ecc, nuRad: o.nu0Rad
    });
    expect(vStart).toBeCloseTo(1.2 * 2 * Math.PI, 10);
    expect(o.nu0Rad).toBeCloseTo(2.369222, 5);
    expect(o.raAu).toBeCloseTo(3.381308, 5);
  });

  it("an inward asymmetric start reproduces r0 and wraps nu0 into [0, 2pi)", () => {
    const r0Au = 10 ** -0.3;
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 10 ** 0.4, r0Au, speedFactor: 0.9, directionDeg: -30 }));
    expect(o.nu0Rad).toBeCloseTo(3.870864, 5);
    expect(startPoint(o).xAu).toBeCloseTo(r0Au, 10);
    expect(startPoint(o).yAu).toBeCloseTo(0, 10);
    expect(o.vPeriAuYr).toBeCloseTo(27.546673, 4);
  });

  it("speedFactor = Math.SQRT2 is exactly parabolic with no apoapsis", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: Math.SQRT2, directionDeg: 0 }));
    expect(o.orbitType).toBe("parabolic");
    expect(Math.abs(o.epsAu2Yr2)).toBeLessThan(1e-12);
    expect(o.raAu).toBe(Number.POSITIVE_INFINITY);
  });

  it("the slider's nearest values are honestly bound and unbound", () => {
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.41, directionDeg: 0 }).orbitType).toBe("elliptical");
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.42, directionDeg: 0 }).orbitType).toBe("hyperbolic");
  });

  it("speed factor 0 is radial and bound, with no periapsis speed", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0, directionDeg: 0 }));
    expect(o.orbitType).toBe("radial");
    expect(o.epsAu2Yr2).toBeCloseTo(-4 * Math.PI * Math.PI, 10);
    expect(o.vPeriAuYr).toBe(0);
    expect(o.raAu).toBeCloseTo(1, 12);
  });

  it("rejects a non-positive radius or mass", () => {
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 0, speedFactor: 1, directionDeg: 0 }).orbitType).toBe("invalid");
    expect(ConservationLawsModel.initialOrbit({ massSolar: 0, r0Au: 1, speedFactor: 1, directionDeg: 0 }).orbitType).toBe("invalid");
  });
});
```

**Step 2: Run and confirm they fail**

Run: `corepack pnpm -C packages/physics exec vitest run src/conservationLawsModel.test.ts > /tmp/cl-t3.log 2>&1; echo EXIT=$?`
Expected: EXIT=1, "initialOrbit is not a function" in 7 tests.

**Step 3: Implement**

At the top of `conservationLawsModel.ts`:

```ts
import { TwoBodyAnalytic, type TwoBodyOrbitType } from "./twoBodyAnalytic";
```

Above `export const ConservationLawsModel`:

```ts
export type InitialOrbit =
  | { orbitType: "invalid" }
  | {
      orbitType: TwoBodyOrbitType;
      muAu3Yr2: number;
      vCircAuYr: number;
      v0AuYr: number;
      rVecAu: Vec2Au;
      ecc: number;
      pAu: number;
      omegaRad: number;
      hAbsAu2Yr: number;
      epsAu2Yr2: number;
      /** True anomaly of the starting point; wrapped to [0, 2pi) for closed orbits. 0 for radial. */
      nu0Rad: number;
      /** Periapsis distance; 0 for radial motion. */
      rpAu: number;
      /** Farthest distance reached; Infinity for open orbits. */
      raAu: number;
      /** Speed at periapsis, the fastest point on the drawn path; 0 for radial motion. */
      vPeriAuYr: number;
    };

/**
 * Everything the instrument shows, from the four controls. The display, Station Mode and the
 * announcements must all read this, so an exact preset (speedFactor = Math.SQRT2) cannot be
 * classified one way on screen and another in the table.
 */
function initialOrbit(args: {
  massSolar: number;
  r0Au: number;
  speedFactor: number;
  directionDeg: number;
}): InitialOrbit {
  const { massSolar, r0Au, speedFactor, directionDeg } = args;
  const muAu3Yr2 = TwoBodyAnalytic.muAu3Yr2FromMassSolar(massSolar);
  const vCircAuYr = TwoBodyAnalytic.circularSpeedAuPerYr({ muAu3Yr2, rAu: r0Au });
  if (!Number.isFinite(vCircAuYr) || !Number.isFinite(speedFactor) || speedFactor < 0) {
    return { orbitType: "invalid" };
  }

  const v0AuYr = speedFactor * vCircAuYr;
  const init = initialStateAuYr({ r0Au, speedAuYr: v0AuYr, directionDeg });
  if (!init.rVecAu || !init.vVecAuYr) return { orbitType: "invalid" };

  const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ rVecAu: init.rVecAu, vVecAuYr: init.vVecAuYr, muAu3Yr2 });
  if (el.orbitType === "invalid") return { orbitType: "invalid" };

  const radial = el.orbitType === "radial";
  const closed = !radial && el.ecc < 1 && el.orbitType !== "parabolic";
  return {
    orbitType: el.orbitType,
    muAu3Yr2,
    vCircAuYr,
    v0AuYr,
    rVecAu: init.rVecAu,
    ecc: el.ecc,
    pAu: el.pAu,
    omegaRad: el.omegaRad,
    hAbsAu2Yr: el.hAbsAu2Yr,
    epsAu2Yr2: el.epsAu2Yr2,
    nu0Rad: radial ? 0 : closed ? wrap2Pi(el.nuRad) : el.nuRad,
    rpAu: radial ? 0 : el.pAu / (1 + el.ecc),
    raAu: radial
      ? el.epsAu2Yr2 < 0 ? -muAu3Yr2 / el.epsAu2Yr2 : Number.POSITIVE_INFINITY
      : closed ? el.pAu / (1 - el.ecc) : Number.POSITIVE_INFINITY,
    vPeriAuYr: el.hAbsAu2Yr > 0 ? (muAu3Yr2 * (1 + el.ecc)) / el.hAbsAu2Yr : 0
  };
}
```

`wrap2Pi` already exists in this file (line 100). Add `initialOrbit` to the exported object.

**Step 4: Run and confirm they pass**

Expected: EXIT=0, 17 passed. Then run the whole physics package once: `corepack pnpm -C packages/physics test > /tmp/cl-t3all.log 2>&1; echo EXIT=$?` (EXIT=0).

**Step 5: Commit**

```bash
git add packages/physics/src/conservationLawsModel.ts packages/physics/src/conservationLawsModel.test.ts
git commit -m "Derive the demo's orbit, start anomaly and apsides in one physics function

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: A view window that is continuous across escape (P4)

Today (`main.ts:350-356`) a bound orbit is fitted to its apoapsis, clamped to 50 AU, while an open orbit gets $6\,r_0$. At speed factor 1.40 the view is 50 AU (the start point lands 5 px from the centre, under the 10 px Sun), at 1.42 it is 6 AU. The new rule clips any orbit, closed or open, at $6\,r_0$.

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/logic.ts`
- Test: `apps/demos/src/demos/conservation-laws/logic.test.ts`

**Step 1: Write the failing tests** (add `viewRadiusAu` to the import list; append)

```ts
describe("viewRadiusAu", () => {
  it("fits a small closed orbit with the 1.5 AU floor", () => {
    expect(viewRadiusAu({ raAu: 1, r0Au: 1 })).toBe(1.5);
  });

  it("is continuous across escape: 1.40 (bound, ra = 49 AU) and 1.42 (open) share one window", () => {
    expect(viewRadiusAu({ raAu: 49, r0Au: 1 })).toBe(6);
    expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 1 })).toBe(6);
  });

  it("keeps the start point well clear of the 10 px Sun near escape", () => {
    expect((1 * 250) / viewRadiusAu({ raAu: 49, r0Au: 1 })).toBeGreaterThan(41);
  });

  it("fits a moderately eccentric orbit with a 10% margin", () => {
    expect(viewRadiusAu({ raAu: 3.381308, r0Au: 1 })).toBeCloseTo(3.719438, 5);
  });

  it("caps at 50 AU and floors at 1.5 AU", () => {
    expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 10 })).toBe(50);
    expect(viewRadiusAu({ raAu: 0.642859, r0Au: 10 ** -0.3 })).toBe(1.5);
  });
});
```

**Step 2: Run and confirm they fail**

Run: `corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws/logic.test.ts > /tmp/cl-t4.log 2>&1; echo EXIT=$?`
Expected: EXIT=1, "viewRadiusAu is not a function" in 5 tests; the existing tests still pass.

**Step 3: Implement** (in `logic.ts`, after `toSvg`)

```ts
export const VIEW_RADIUS_MIN_AU = 1.5;
export const VIEW_RADIUS_MAX_AU = 50;
/** Orbits reaching farther than this many r0 are clipped, closed or open, so the view cannot jump at e = 1. */
export const VIEW_R0_MULTIPLE = 6;

/** Radius of the plotted window in AU. `raAu` is Infinity for open orbits. */
export function viewRadiusAu(args: { raAu: number; r0Au: number }): number {
  const { raAu, r0Au } = args;
  const closedFit = Number.isFinite(raAu) ? Math.max(raAu, r0Au) * 1.1 : Number.POSITIVE_INFINITY;
  return clamp(Math.min(closedFit, VIEW_R0_MULTIPLE * r0Au), VIEW_RADIUS_MIN_AU, VIEW_RADIUS_MAX_AU);
}
```

**Step 4: Run and confirm they pass.** Expected: EXIT=0.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/logic.ts apps/demos/src/demos/conservation-laws/logic.test.ts
git commit -m "Add a view window that stays continuous across escape

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: An arrow whose length is the physics (P5, decision D1)

The arrow becomes the distance covered in $\Delta t$ at the current velocity, drawn at the orbit's px/AU. $\Delta t$ is the largest step in the ladder whose arrow at periapsis (the fastest drawn point) is at most 120 px. There is no clamp, so within one orbit the length is exactly proportional to speed.

> **Contribution point for Anna (optional).** `pickArrowDtDays` is the rule that decides what "arrow length" means to a student. If you would rather write it yourself, keep the signature, leave the tests in Step 1 as the contract, and replace the body in Step 3. The trade-off: a per-orbit step keeps every arrow readable but makes cross-orbit comparisons go through the caption; one fixed step for all orbits lets arrows compare directly but overflows the stage for $M = 10\,M_\odot$, $r_0 = 0.1$ AU (~570 px).

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/logic.ts`
- Test: `apps/demos/src/demos/conservation-laws/logic.test.ts`

**Step 1: Write the failing tests** (add `pickArrowDtDays`, `arrowLengthPx` to the imports; append)

```ts
describe("arrow time step and length", () => {
  const s15 = 250 / 1.5;
  const s6 = 250 / 6;

  it("default circular orbit: 20 days, 57.3 px", () => {
    expect(pickArrowDtDays(2 * Math.PI, s15)).toBe(20);
    expect(arrowLengthPx(2 * Math.PI, 20, s15)).toBeCloseTo(57.341, 3);
  });

  it("is exactly proportional to speed: periapsis / apoapsis = (1 + e)/(1 - e), no clamp", () => {
    const dt = pickArrowDtDays(12.042772, s15)!;
    expect(dt).toBe(20);
    const apo = arrowLengthPx(0.75 * 2 * Math.PI, dt, s15);
    const peri = arrowLengthPx(12.042772, dt, s15);
    expect(apo).toBeCloseTo(43.006, 3);
    expect(peri).toBeCloseTo(109.904, 3);
    expect(peri / apo).toBeCloseTo(1.4375 / 0.5625, 5);
  });

  it("ten solar masses: per-day length is sqrt(10) times longer", () => {
    const dt10 = pickArrowDtDays(19.869177, s15)!;
    expect(dt10).toBe(10);
    const perDay1 = arrowLengthPx(2 * Math.PI, 20, s15) / 20;
    const perDay10 = arrowLengthPx(19.869177, dt10, s15) / dt10;
    expect(perDay10 / perDay1).toBeCloseTo(Math.sqrt(10), 5);
  });

  it("escape, hyperbolic and slow zoomed-out orbits", () => {
    expect(pickArrowDtDays(8.885766, s6)).toBe(100);
    expect(pickArrowDtDays(11.309734, s6)).toBe(50);
    expect(pickArrowDtDays(3.576452, 5)).toBe(2000);
  });

  it("returns null when nothing moves", () => {
    expect(pickArrowDtDays(0, s15)).toBeNull();
  });

  it("never exceeds 120 px at the fastest point unless even one day would", () => {
    for (const v of [0.5, 3, 12, 40, 150]) {
      const dt = pickArrowDtDays(v, s15)!;
      if (dt > 1) expect(arrowLengthPx(v, dt, s15)).toBeLessThanOrEqual(120);
    }
  });
});
```

**Step 2: Run and confirm they fail.** Expected: EXIT=1, "is not a function".

**Step 3: Implement** (in `logic.ts`, after `viewRadiusAu`)

```ts
export const ARROW_DT_LADDER_DAYS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000] as const;
export const ARROW_MAX_PX = 120;
/** Julian year in days, the same year as AstroConstants.TIME.YEAR_S / DAY_S. */
const DAYS_PER_YEAR = 365.25;

/** Pixels covered in `dtDays` at `vAuYr`, drawn at the orbit's scale. */
export function arrowLengthPx(vAuYr: number, dtDays: number, scalePxPerAu: number): number {
  return vAuYr * (dtDays / DAYS_PER_YEAR) * scalePxPerAu;
}

/** Largest round step whose arrow at the fastest point fits `maxPx`; null when nothing moves. */
export function pickArrowDtDays(vMaxAuYr: number, scalePxPerAu: number, maxPx: number = ARROW_MAX_PX): number | null {
  if (!(vMaxAuYr > 0) || !(scalePxPerAu > 0)) return null;
  let best: number = ARROW_DT_LADDER_DAYS[0];
  for (const days of ARROW_DT_LADDER_DAYS) {
    if (arrowLengthPx(vMaxAuYr, days, scalePxPerAu) <= maxPx) best = days;
  }
  return best;
}
```

**Step 4: Run and confirm they pass.** Expected: EXIT=0.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/logic.ts apps/demos/src/demos/conservation-laws/logic.test.ts
git commit -m "Scale the velocity arrow as distance covered in a stated time

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Formatting and announcement text (P1, P3, U1)

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/logic.ts`
- Test: `apps/demos/src/demos/conservation-laws/logic.test.ts`

The old helpers (`classifyOrbit`, `orbitalRadiusAu`, `conicPositionAndTangentAu`, `instantaneousSpeedAuPerYr`, `velocityArrowSvg`) are deleted in Task 8, when `main.ts` stops importing them, so every commit keeps the unit tests green.

**Step 1: Write the failing tests** (add `formatSpeedFactor`, `formatSpecificEnergy`, `orbitAnnouncement` to the imports; append; and add one case to the existing `formatOrbitType` block)

```ts
// inside describe("formatOrbitType")
it("radial -> 'radial (straight line)'", () => {
  expect(formatOrbitType("radial")).toBe("radial (straight line)");
});
```

```ts
describe("formatSpeedFactor", () => {
  it("shows three decimals so the exact escape preset reads differently from the slider's 1.41", () => {
    expect(formatSpeedFactor(Math.SQRT2)).toBe("1.414");
    expect(formatSpeedFactor(1.41)).toBe("1.410");
    expect(formatSpeedFactor(1)).toBe("1.000");
    expect(formatSpeedFactor(0)).toBe("0");
  });
});

describe("formatSpecificEnergy", () => {
  it("shows round-off at exact escape as 0, never e-notation", () => {
    expect(formatSpecificEnergy(3.5e-15, 39.478418)).toBe("0");
    expect(formatSpecificEnergy(-1.4e-14, 197.860789)).toBe("0");
  });

  it("formats ordinary energies to four decimals", () => {
    expect(formatSpecificEnergy(-28.375113, 39.478418)).toBe("-28.3751");
    expect(formatSpecificEnergy(-0.2349, 39.478418)).toBe("-0.2349");
  });
});

describe("orbitAnnouncement", () => {
  it("says bound, at escape or unbound in words", () => {
    expect(orbitAnnouncement({ orbitType: "circular", ecc: 0, epsAu2Yr2: -19.7 })).toBe("Circular orbit: bound, eccentricity 0.");
    expect(orbitAnnouncement({ orbitType: "elliptical", ecc: 0.4375, epsAu2Yr2: -28.4 })).toBe("Elliptical orbit: bound, eccentricity 0.438.");
    expect(orbitAnnouncement({ orbitType: "parabolic", ecc: 1, epsAu2Yr2: 0 })).toBe("Parabolic orbit: exactly at escape, specific energy 0.");
    expect(orbitAnnouncement({ orbitType: "hyperbolic", ecc: 2.24, epsAu2Yr2: 24.5 })).toBe("Hyperbolic orbit: unbound, eccentricity 2.240.");
    expect(orbitAnnouncement({ orbitType: "radial", ecc: 1, epsAu2Yr2: -39.5 })).toBe("Radial motion: with no sideways speed the body falls straight in.");
    expect(orbitAnnouncement({ orbitType: "invalid", ecc: NaN, epsAu2Yr2: NaN })).toBe("No valid orbit for these settings.");
  });
});
```

**Step 2: Run and confirm they fail.** Expected: EXIT=1 (the radial case returns "invalid"; the new functions are missing).

**Step 3: Implement** (in `logic.ts`)

Add `case "radial": return "radial (straight line)";` to `formatOrbitType` before `default`. Then add after it:

```ts
/** Three decimals, so the exact escape preset (1.414) is distinguishable from the slider's 1.41. */
export function formatSpeedFactor(value: number): string {
  return formatNumber(value, 3);
}

/** Specific energy for display. Round-off below 1e-9 of the potential scale mu/r0 shows as 0. */
export function formatSpecificEnergy(epsAu2Yr2: number, potentialScaleAu2Yr2: number): string {
  if (
    Number.isFinite(epsAu2Yr2) &&
    Number.isFinite(potentialScaleAu2Yr2) &&
    Math.abs(epsAu2Yr2) <= 1e-9 * Math.abs(potentialScaleAu2Yr2)
  ) {
    return "0";
  }
  return formatNumber(epsAu2Yr2, 4);
}

/** Plain-words status for screen readers; call on `change` and preset clicks, never per frame. */
export function orbitAnnouncement(args: { orbitType: string; ecc: number; epsAu2Yr2: number }): string {
  const e = formatNumber(args.ecc, 3);
  switch (args.orbitType) {
    case "circular":
      return "Circular orbit: bound, eccentricity 0.";
    case "elliptical":
      return `Elliptical orbit: bound, eccentricity ${e}.`;
    case "parabolic":
      return "Parabolic orbit: exactly at escape, specific energy 0.";
    case "hyperbolic":
      return `Hyperbolic orbit: unbound, eccentricity ${e}.`;
    case "radial":
      return args.epsAu2Yr2 < 0
        ? "Radial motion: with no sideways speed the body falls straight in."
        : "Radial motion: the body moves straight out and escapes.";
    default:
      return "No valid orbit for these settings.";
  }
}
```

**Step 4: Run and confirm they pass.** Expected: EXIT=0.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/logic.ts apps/demos/src/demos/conservation-laws/logic.test.ts
git commit -m "Add speed, energy and announcement formatting for the refactored demo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: E2E tests for what the student sees (RED, no commit yet)

These are the tests that would have caught every High finding. They are committed with the implementation in Task 8, once green.

**Files:**
- Modify: `apps/site/tests/conservation-laws.spec.ts`

**Step 1: Remove the tests that encode the defects**

- Delete `"clicking escape preset shows orbit type near parabolic"` (spec lines 97-102) and `"after escape preset, orbit type is near parabolic"` (lines 183-188). Both accept `/parabolic|elliptical/`, so they pass on a bound orbit.
- Replace `"tab navigation reaches play button"` (lines 235-239, which calls `.focus()` and never presses Tab) with:

```ts
  test("Tab from the top of the page reaches the play button", async ({ page }) => {
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = (await page.evaluate(() => document.activeElement?.id)) === "play";
    }
    expect(reached).toBe(true);
  });
```

- In `"readout units in .cp-readout__unit spans (count >= 4)"`, change the expectation to `toBeGreaterThanOrEqual(6)` and the name to `(count >= 6)`.

**Step 2: Add the physics-on-screen tests** (new `describe` block before the Reduced Motion block)

```ts
test.describe("Conservation Laws -- what the student sees", () => {
  const CENTER = 300;
  const setSlider = async (page: Page, id: string, value: number) => {
    await page.locator(`#${id}`).evaluate((el: HTMLInputElement, v: number) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  const particle = async (page: Page) => ({
    x: Number(await page.locator("#particle").getAttribute("cx")),
    y: Number(await page.locator("#particle").getAttribute("cy"))
  });
  const arrowPx = async (page: Page) => {
    const l = page.locator("#velocityLine");
    const [x1, y1, x2, y2] = await Promise.all(["x1", "y1", "x2", "y2"].map((a) => l.getAttribute(a).then(Number)));
    return Math.hypot(x2 - x1, y2 - y1);
  };
  const num = async (page: Page, id: string) => Number.parseFloat((await page.locator(`#${id}`).textContent()) ?? "NaN");

  test.beforeEach(async ({ page }) => {
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
  });

  test("Escape preset is exactly parabolic with zero energy (P1)", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    await expect(page.locator("#orbitType")).toHaveText("parabolic (escape)");
    await expect(page.locator("#ecc")).toHaveText("1.000");
    await expect(page.locator("#eps")).toHaveText("0");
    await expect(page.locator("#speedValue")).toHaveText("1.414");
  });

  test("the slider's nearest values straddle escape honestly", async ({ page }) => {
    await setSlider(page, "speedFactor", 1.41);
    await expect(page.locator("#orbitType")).toHaveText("elliptical");
    await setSlider(page, "speedFactor", 1.42);
    await expect(page.locator("#orbitType")).toHaveText("hyperbolic");
  });

  test("Station Mode's Escape rows agree with the screen (P1)", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    await page.locator("#stationMode").click();
    const dialog = page.getByRole("dialog", { name: /Station Mode/ });
    await dialog.getByRole("button", { name: /Add row/ }).click();
    await dialog.getByRole("button", { name: /preset cases/ }).click();
    // Anchor on the first cell: the Snapshot row's "(escape)" would also match a bare "Escape".
    const snapshot = dialog.locator("tr", { hasText: /^\s*Snapshot/ });
    const reference = dialog.locator("tr", { hasText: /^\s*Escape/ });
    await expect(snapshot).toContainText("parabolic (escape)");
    await expect(reference).toContainText("parabolic (escape)");
    await expect(snapshot).toContainText("1.414");
  });

  test("Elliptical preset starts at r0 on +x with the speed that was set (P2)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    const p = await particle(page);
    expect(p.x).toBeCloseTo(CENTER + 250 / 1.5, 0);
    expect(p.y).toBeCloseTo(CENTER, 0);
    expect(await num(page, "vKmS")).toBeCloseTo(0.75 * 29.785, 1);
  });

  test("an outward 60 deg start is also on +x (asymmetric state)", async ({ page }) => {
    await setSlider(page, "speedFactor", 1.2);
    await setSlider(page, "directionDeg", 60);
    const p = await particle(page);
    expect(p.x).toBeCloseTo(CENTER + 250 / 3.719438, 0);
    expect(p.y).toBeCloseTo(CENTER, 0);
    expect(await num(page, "vKmS")).toBeCloseTo(1.2 * 29.785, 1);
  });

  test("Reset returns the body to where it started", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    const start = await particle(page);
    await page.locator("#play").click();
    await page.waitForTimeout(400);
    await page.locator("#pause").click();
    const moved = await particle(page);
    expect(Math.hypot(moved.x - start.x, moved.y - start.y)).toBeGreaterThan(5);
    await page.locator("#reset").click();
    const back = await particle(page);
    expect(back.x).toBeCloseTo(start.x, 1);
    expect(back.y).toBeCloseTo(start.y, 1);
  });

  test("speed factor 0 is radial motion, not escape (P3)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#orbitType")).toHaveText("radial (straight line)");
    await expect(page.locator("#eps")).toHaveText("-39.4784");
    await expect(page.locator("#velocityLine")).toBeHidden();
    await expect(page.locator("#play")).toBeDisabled();
    const p = await particle(page);
    expect(p.x).toBeCloseTo(CENTER + 250 / 1.5, 0);
  });

  test("the view does not jump across escape (P4)", async ({ page }) => {
    for (const f of [1.4, 1.42]) {
      await setSlider(page, "speedFactor", f);
      const p = await particle(page);
      expect(Math.hypot(p.x - CENTER, p.y - CENTER)).toBeCloseTo(250 / 6, 0);
    }
    await setSlider(page, "speedFactor", 1.4);
    await expect(page.locator("#apoCaption")).toBeVisible();
    await expect(page.locator("#raAu")).toHaveText("49.0");
  });

  test("the arrow is distance covered in the stated time (P5)", async ({ page }) => {
    await expect(page.locator("#arrowDtDays")).toHaveText("20");
    expect(await arrowPx(page)).toBeCloseTo(57.341, 0);
    await setSlider(page, "massSlider", 1);
    await expect(page.locator("#arrowDtDays")).toHaveText("10");
    expect(await arrowPx(page)).toBeCloseTo(90.665, 0);
  });

  test("K and U trade while the specific energy stays fixed (B2)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#kAu")).toHaveText("11.1033");
    await expect(page.locator("#uAu")).toHaveText("-39.4784");
    const eps = await page.locator("#eps").textContent();
    await page.locator("#play").click();
    await page.waitForTimeout(300);
    await page.locator("#pause").click();
    await expect(page.locator("#kAu")).not.toHaveText("11.1033");
    await expect(page.locator("#uAu")).not.toHaveText("-39.4784");
    await expect(page.locator("#eps")).toHaveText(eps ?? "");
  });

  test("announces the orbit after a keyboard change and a preset (U1)", async ({ page }) => {
    await page.locator("#speedFactor").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#status")).toHaveText("Elliptical orbit: bound, eccentricity 0.020.");
    await page.locator('[data-preset="hyperbolic"]').click();
    await expect(page.locator("#status")).toHaveText("Hyperbolic orbit: unbound, eccentricity 2.240.");
  });

  test("help text is typeset, not ASCII (B5)", async ({ page }) => {
    await page.locator("#help").click();
    const dialog = page.getByRole("dialog", { name: /Help/ });
    await expect(dialog.locator(".katex").first()).toBeVisible();
    await expect(dialog).not.toContainText("sqrt(");
  });

  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
    test(`all readouts are above the fold at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator(".cp-readout")).toHaveCount(8);
      const bottoms = await page.locator(".cp-readout").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      for (const b of bottoms) expect(b).toBeLessThanOrEqual(size.height);
    });
  }
});
```

Add `type Page` to the import: `import { test, expect, type Page } from "@playwright/test";`.

**Step 3: Rebuild and run; confirm RED on assertions**

```bash
corepack pnpm build > /tmp/cl-build7.log 2>&1; echo EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test --project=desktop tests/conservation-laws.spec.ts > /tmp/cl-e2e7.log 2>&1; echo EXIT=$?
grep -E "passed|failed" /tmp/cl-e2e7.log | tail -3
```

Expected: build EXIT=0; E2E EXIT=1. The new describe fails on assertions, e.g. `#orbitType` "elliptical" not "parabolic (escape)", particle x 234.78 not 466.67, missing `#arrowDtDays`/`#kAu`, empty `#status`, 6 readouts not 8. The original layout, slider and control tests still pass. If a new test fails with "no tests" or a TypeScript error, fix the test file before continuing.

---

### Task 8: Rebuild the demo on exact state (P1-P5, U1, B2, B5) -> GREEN

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/index.html`
- Modify: `apps/demos/src/demos/conservation-laws/style.css`
- Modify: `apps/demos/src/demos/conservation-laws/logic.ts`, `logic.test.ts`
- Replace: `apps/demos/src/demos/conservation-laws/main.ts`
- Test: `apps/site/tests/conservation-laws.spec.ts` (from Task 7)

**Step 1: `index.html` — controls with typeset units**

Replace the four `<label class="control">` blocks (lines 24-48) with:

```html
          <label class="control">
            <span>Central mass $M$</span>
            <input id="massSlider" type="range" min="-1" max="1" step="0.01" value="0" />
            <span class="control__value"><span id="massValue"></span> <span class="control__unit">$M_{\odot}$</span></span>
          </label>

          <label class="control">
            <span>Initial radius $r_0$</span>
            <input id="r0Slider" type="range" min="-1" max="1" step="0.01" value="0" />
            <span class="control__value"><span id="r0Value"></span> <span class="control__unit">AU</span></span>
          </label>

          <label class="control">
            <span>Speed factor $v/v_{\rm circ}$</span>
            <input id="speedFactor" type="range" min="0" max="2.5" step="0.01" value="1" />
            <span class="control__value"
              ><span id="speedValue"></span><span class="control__unit">$\times$</span>
              <span class="cp-muted">(escape at $\sqrt{2}$)</span></span
            >
          </label>

          <label class="control">
            <span>Direction from tangential (+ is outward)</span>
            <input id="directionDeg" type="range" min="-85" max="85" step="1" value="0" />
            <span class="control__value"><span id="directionValue"></span><span class="control__unit">$^{\circ}$</span></span>
          </label>
```

**Step 2: `index.html` — restore $K$ and $U$ next to $\varepsilon$**

Between the Eccentricity readout and the Specific energy readout insert:

```html
          <div class="cp-readout">
            <div class="cp-readout__label">Kinetic $K = v^2/2$</div>
            <div class="cp-readout__value"><span id="kAu"></span> <span class="cp-readout__unit">AU$^2$/yr$^2$</span></div>
          </div>
          <div class="cp-readout">
            <div class="cp-readout__label">Potential $U = -\mu/r$</div>
            <div class="cp-readout__value"><span id="uAu"></span> <span class="cp-readout__unit">AU$^2$/yr$^2$</span></div>
          </div>
```

and change the energy label to `Specific energy $\varepsilon = K + U$`.

**Step 3: `index.html` — stage caption**

Directly after `</svg>` inside the stage section:

```html
        <p id="stageCaption" class="stage__caption">
          <span id="arrowCaption">Green arrow: distance covered in <span id="arrowDtDays"></span> days at the current velocity.</span>
          <span id="apoCaption" hidden>This orbit reaches <span id="raAu"></span> AU, beyond the view.</span>
        </p>
```

**Step 4: `index.html` — drawer copy that matches the new behaviour**

"What to notice": set the meta to `4 bullets` and the list to:

```html
                <li>Press Play on the Elliptical preset: $K$ and $U$ trade places while $\varepsilon = K + U$ stays fixed.</li>
                <li>Escape is set by energy: $\varepsilon&lt;0$ (bound), $\varepsilon=0$ (escape), $\varepsilon&gt;0$ (unbound).</li>
                <li>At the same $r_0$, $v_{\rm esc}=\sqrt{2}\,v_{\rm circ}$. The slider passes from elliptical at 1.41 to hyperbolic at 1.42; the Escape preset sets exactly $\sqrt{2}$.</li>
                <li>At the same speed, a larger $|h|$ keeps the closest approach $r_p$ larger.</li>
```

"Model notes" list:

```html
                <li>Teaching units: AU / yr / $M_{\odot}$ with $G=4\pi^2\,\mathrm{AU}^3/(\mathrm{yr}^2\,M_{\odot})$.</li>
                <li>The body starts at $r_0$ on the $+x$ axis, moving at $v/v_{\rm circ}$ times the circular speed there, tilted from tangential (+ is outward).</li>
                <li>The green arrow is the distance the body would cover in the stated number of days at its current velocity, drawn at the orbit's scale.</li>
                <li>Paths reaching beyond $6\,r_0$ (within 1.5 to 50 AU) are clipped to that window, bound or not; the caption gives how far a clipped bound orbit reaches.</li>
                <li>With zero speed there is no angular momentum and no conic: the body falls straight in.</li>
```

**Step 5: `style.css`**

Add after `.control__value`:

```css
.control__unit {
  color: var(--cp-muted);
}
```

Add after `.orbit`:

```css
.stage__caption {
  margin: var(--cp-space-2) 0 0;
  max-width: 60ch;
  color: var(--cp-muted);
  font-size: 0.9rem;
  text-align: center;
}
```

In `.orbit`, change `max-width: clamp(280px, calc(100svh - 23rem), 700px);` to `calc(100svh - 25rem)`: the caption adds about 2rem of stage height. The fold tests in Task 7 decide the final number. If either size fails, raise it 1rem at a time, rebuild, rerun, and write the measured value and date into the comment above `.orbit`.

**Step 6: `logic.ts` and `logic.test.ts` — remove the old path**

Delete from `logic.ts`: `classifyOrbit` (unused by `main.ts`, and its thresholds 1e-6 disagree with the model's 1e-10 / 1e-8), `orbitalRadiusAu`, `conicPositionAndTangentAu`, `instantaneousSpeedAuPerYr` (now in `ConservationLawsModel`, Task 2) and `velocityArrowSvg` (replaced by Task 5), plus the "Orbital mechanics helpers" section comment. Delete the matching `describe` blocks and imports from `logic.test.ts`. Update the file header comment to "formatting, view window, arrow scale and announcement text".

**Step 7: Replace `main.ts`** (listing in two parts; part 1 is the state, the animation and rendering)

The shape: `controls` holds exact values; slider `input` writes one control and recomputes; presets write exact values and sync the sliders for display only; everything shown comes from `orbit = ConservationLawsModel.initialOrbit(controls)`.

```ts
import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ConservationLawsModel, TwoBodyAnalytic } from "@cosmic/physics";
import {
  arrowLengthPx,
  buildPathD,
  clamp,
  formatNumber,
  formatOrbitType,
  formatSpecificEnergy,
  formatSpeedFactor,
  logSliderToValue,
  orbitAnnouncement,
  pickArrowDtDays,
  toSvg,
  valueToLogSlider,
  viewRadiusAu
} from "./logic";

type Controls = { massSolar: number; r0Au: number; speedFactor: number; directionDeg: number };
type Orbit = ReturnType<typeof ConservationLawsModel.initialOrbit>;
type ValidOrbit = Exclude<Orbit, { orbitType: "invalid" }>;

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`conservation-laws: missing ${selector}`);
  return el;
}

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

const massSlider = must<HTMLInputElement>("#massSlider");
const r0Slider = must<HTMLInputElement>("#r0Slider");
const speedSlider = must<HTMLInputElement>("#speedFactor");
const directionSlider = must<HTMLInputElement>("#directionDeg");
const massValue = must<HTMLSpanElement>("#massValue");
const r0Value = must<HTMLSpanElement>("#r0Value");
const speedValue = must<HTMLSpanElement>("#speedValue");
const directionValue = must<HTMLSpanElement>("#directionValue");
const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button.preset[data-preset]"));
const playButton = must<HTMLButtonElement>("#play");
const pauseButton = must<HTMLButtonElement>("#pause");
const resetButton = must<HTMLButtonElement>("#reset");
const stationModeButton = must<HTMLButtonElement>("#stationMode");
const helpButton = must<HTMLButtonElement>("#help");
const copyResults = must<HTMLButtonElement>("#copyResults");
const status = must<HTMLParagraphElement>("#status");
const orbitPath = must<SVGPathElement>("#orbitPath");
const particle = must<SVGCircleElement>("#particle");
const velocityLine = must<SVGLineElement>("#velocityLine");
const orbitTypeValue = must<HTMLSpanElement>("#orbitType");
const eccValue = must<HTMLSpanElement>("#ecc");
const kValue = must<HTMLSpanElement>("#kAu");
const uValue = must<HTMLSpanElement>("#uAu");
const epsValue = must<HTMLSpanElement>("#eps");
const hValue = must<HTMLSpanElement>("#h");
const vKmSValue = must<HTMLSpanElement>("#vKmS");
const rpAuValue = must<HTMLSpanElement>("#rpAu");
const arrowCaption = must<HTMLSpanElement>("#arrowCaption");
const arrowDtDays = must<HTMLSpanElement>("#arrowDtDays");
const apoCaption = must<HTMLSpanElement>("#apoCaption");
const raAuValue = must<HTMLSpanElement>("#raAu");

const CENTER = { x: 300, y: 300 };
const VIEW_RADIUS_PX = 250;
const PATH_SAMPLES = 720;
/** Teaching time scale: a circular orbit at 1 AU around 1 Msun takes about 3 s. */
const SIM_YEARS_PER_SEC = 1 / 3;

const PRESETS = {
  circular: { label: "Circular", speedFactor: 1, directionDeg: 0 },
  elliptical: { label: "Elliptical", speedFactor: 0.75, directionDeg: 0 },
  escape: { label: "Escape", speedFactor: Math.SQRT2, directionDeg: 0 },
  hyperbolic: { label: "Hyperbolic", speedFactor: 1.8, directionDeg: 0 }
} as const;
type PresetName = keyof typeof PRESETS;

const prefersReducedMotion =
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:conservation-laws:mode",
  url: new URL(window.location.href)
});

/** Exact values. The sliders display these; a slider is read only when the student moves it. */
const controls: Controls = { massSolar: 1, r0Au: 1, speedFactor: 1, directionDeg: 0 };
let orbit: Orbit = ConservationLawsModel.initialOrbit(controls);

const anim = {
  playing: false,
  frameId: null as number | null,
  lastTimeMs: 0,
  nuRad: 0,
  nuMin: 0,
  nuMax: 2 * Math.PI,
  dir: 1,
  scalePxPerAu: VIEW_RADIUS_PX / 1.5,
  dtDays: null as number | null
};

function validOrbit(): ValidOrbit | null {
  return orbit.orbitType === "invalid" ? null : orbit;
}

function canAnimate(): boolean {
  const o = validOrbit();
  return !prefersReducedMotion && o !== null && o.orbitType !== "radial";
}

function stopAnimation() {
  anim.playing = false;
  if (anim.frameId !== null) {
    cancelAnimationFrame(anim.frameId);
    anim.frameId = null;
  }
  playButton.disabled = !canAnimate();
  pauseButton.disabled = true;
}

function resetAnimation() {
  stopAnimation();
  const o = validOrbit();
  if (!o) return;
  anim.dir = 1;
  anim.nuRad = o.nu0Rad;
  renderBody();
}

function startAnimation() {
  if (prefersReducedMotion) {
    setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
    return;
  }
  const o = validOrbit();
  if (anim.playing || !o || o.orbitType === "radial") return;
  // An open orbit that already ran to the edge of the view starts again from the beginning.
  if (o.ecc >= 1 && anim.nuRad >= anim.nuMax - 1e-9) anim.nuRad = o.nu0Rad;

  anim.playing = true;
  playButton.disabled = true;
  pauseButton.disabled = false;
  anim.lastTimeMs = performance.now();

  const tick = (nowMs: number) => {
    if (!anim.playing) return;
    let dtRemain = Math.min((nowMs - anim.lastTimeMs) / 1000, 0.1);
    anim.lastTimeMs = nowMs;
    let stopped = false;
    // Kepler's second law: h = r^2 dnu/dt, so dnu/dt = h / r^2.
    while (dtRemain > 1e-9 && !stopped) {
      const dtSec = Math.min(dtRemain, 0.02);
      const rAu = ConservationLawsModel.orbitalRadiusAu({ ecc: o.ecc, pAu: o.pAu, nuRad: anim.nuRad });
      const nuRadPerYr = rAu > 0 ? o.hAbsAu2Yr / (rAu * rAu) : 0;
      const step = ConservationLawsModel.advanceTrueAnomalyRad({
        nuRad: anim.nuRad,
        ecc: o.ecc,
        nuMin: anim.nuMin,
        nuMax: anim.nuMax,
        dir: anim.dir,
        dtSec,
        nuSpeedRadPerSec: nuRadPerYr * SIM_YEARS_PER_SEC
      });
      anim.nuRad = step.nuRad;
      anim.dir = step.dir;
      stopped = step.stopped;
      dtRemain -= dtSec;
    }
    renderBody();
    if (stopped) {
      stopAnimation();
      setLiveRegionText(status, "The body has left the view. Press Play to run it again.");
      return;
    }
    anim.frameId = requestAnimationFrame(tick);
  };
  anim.frameId = requestAnimationFrame(tick);
}

function renderControlValues() {
  massValue.textContent = formatNumber(controls.massSolar, 2);
  r0Value.textContent = formatNumber(controls.r0Au, 2);
  speedValue.textContent = formatSpeedFactor(controls.speedFactor);
  directionValue.textContent = String(Math.round(controls.directionDeg));
}

function recomputeOrbit() {
  stopAnimation();
  orbit = ConservationLawsModel.initialOrbit(controls);
  renderControlValues();

  const o = validOrbit();
  if (!o) {
    orbitTypeValue.textContent = formatOrbitType("invalid");
    for (const el of [eccValue, kValue, uValue, epsValue, hValue, vKmSValue, rpAuValue]) el.textContent = "—";
    orbitPath.setAttribute("d", "");
    velocityLine.style.display = "none";
    stopAnimation();
    return;
  }

  const rMaxAu = viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au });
  anim.scalePxPerAu = VIEW_RADIUS_PX / rMaxAu;
  anim.dtDays = pickArrowDtDays(o.vPeriAuYr, anim.scalePxPerAu);
  anim.dir = 1;
  anim.nuRad = o.nu0Rad;

  if (o.orbitType === "radial") {
    anim.nuMin = 0;
    anim.nuMax = 0;
    const start = toSvg(o.rVecAu.xAu, o.rVecAu.yAu, CENTER, anim.scalePxPerAu);
    orbitPath.setAttribute("d", `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${CENTER.x} ${CENTER.y}`);
  } else {
    const domain = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: o.ecc, pAu: o.pAu, rMaxAu });
    anim.nuMin = domain.nuMin;
    anim.nuMax = domain.nuMax;
    const points = ConservationLawsModel.sampleConicOrbitAu({
      ecc: o.ecc,
      pAu: o.pAu,
      omegaRad: o.omegaRad,
      numPoints: PATH_SAMPLES,
      rMaxAu
    });
    orbitPath.setAttribute("d", buildPathD(points, CENTER, anim.scalePxPerAu));
  }

  const radial = o.orbitType === "radial";
  orbitTypeValue.textContent = formatOrbitType(o.orbitType);
  eccValue.textContent = radial ? "—" : formatNumber(o.ecc, 3);
  epsValue.textContent = formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / controls.r0Au);
  hValue.textContent = formatNumber(o.hAbsAu2Yr, 4);
  rpAuValue.textContent = radial ? "—" : formatNumber(o.rpAu, 3);

  arrowCaption.hidden = anim.dtDays === null;
  arrowDtDays.textContent = anim.dtDays === null ? "" : String(anim.dtDays);
  apoCaption.hidden = !(Number.isFinite(o.raAu) && o.raAu > rMaxAu);
  raAuValue.textContent = Number.isFinite(o.raAu) ? formatNumber(o.raAu, 1) : "";

  renderBody();
  stopAnimation();
}

/** Particle, arrow, speed, K and U at the current true anomaly. Runs every animation frame. */
function renderBody() {
  const o = validOrbit();
  if (!o) return;

  let xAu = o.rVecAu.xAu;
  let yAu = o.rVecAu.yAu;
  let vAuYr = o.v0AuYr;
  let ux = 0;
  let uy = 0;
  if (o.orbitType !== "radial") {
    const pos = ConservationLawsModel.conicPositionAndTangentAu({
      ecc: o.ecc,
      pAu: o.pAu,
      omegaRad: o.omegaRad,
      nuRad: anim.nuRad
    });
    if (!pos) return;
    xAu = pos.xAu;
    yAu = pos.yAu;
    vAuYr = ConservationLawsModel.instantaneousSpeedAuPerYr({
      muAu3Yr2: o.muAu3Yr2,
      hAbsAu2Yr: o.hAbsAu2Yr,
      ecc: o.ecc,
      nuRad: anim.nuRad
    });
    const mag = Math.hypot(pos.dxAu, pos.dyAu);
    if (mag > 0) {
      ux = (pos.dxAu / mag) * anim.dir;
      uy = (pos.dyAu / mag) * anim.dir;
    }
  }

  const p = toSvg(xAu, yAu, CENTER, anim.scalePxPerAu);
  particle.setAttribute("cx", p.x.toFixed(2));
  particle.setAttribute("cy", p.y.toFixed(2));

  const lengthPx = anim.dtDays === null ? 0 : arrowLengthPx(vAuYr, anim.dtDays, anim.scalePxPerAu);
  velocityLine.style.display = lengthPx > 0 ? "" : "none";
  velocityLine.setAttribute("x1", p.x.toFixed(2));
  velocityLine.setAttribute("y1", p.y.toFixed(2));
  // SVG y points down, so the tangent's y component flips.
  velocityLine.setAttribute("x2", (p.x + ux * lengthPx).toFixed(2));
  velocityLine.setAttribute("y2", (p.y - uy * lengthPx).toFixed(2));

  const energy = ConservationLawsModel.specificEnergyPartsAu2Yr2({
    rAu: Math.hypot(xAu, yAu),
    vAuYr,
    muAu3Yr2: o.muAu3Yr2
  });
  vKmSValue.textContent = formatNumber(TwoBodyAnalytic.speedKmPerSFromAuPerYr(vAuYr), 3);
  kValue.textContent = formatNumber(energy.kAu2Yr2, 4);
  uValue.textContent = formatNumber(energy.uAu2Yr2, 4);
}
```

`main.ts` part 2: controls, presets, Station Mode, export and start-up.

```ts
function announce() {
  const o = validOrbit();
  setLiveRegionText(
    status,
    orbitAnnouncement({
      orbitType: orbit.orbitType,
      ecc: o ? o.ecc : Number.NaN,
      epsAu2Yr2: o ? o.epsAu2Yr2 : Number.NaN
    })
  );
}

function syncSlidersToControls() {
  massSlider.value = String(valueToLogSlider(controls.massSolar));
  r0Slider.value = String(valueToLogSlider(controls.r0Au));
  // The browser snaps these to the slider step for display; `controls` keeps the exact value.
  speedSlider.value = String(controls.speedFactor);
  directionSlider.value = String(controls.directionDeg);
}

function setPresetPressed(name: PresetName | null) {
  for (const btn of presetButtons) {
    btn.setAttribute("aria-pressed", btn.dataset.preset === name ? "true" : "false");
  }
}

function applyPreset(name: PresetName) {
  controls.speedFactor = PRESETS[name].speedFactor;
  controls.directionDeg = PRESETS[name].directionDeg;
  syncSlidersToControls();
  recomputeOrbit();
  setPresetPressed(name);
  announce();
}

const sliderReaders: Array<[HTMLInputElement, () => void]> = [
  [massSlider, () => { controls.massSolar = clamp(logSliderToValue(Number(massSlider.value)), 0.1, 10); }],
  [r0Slider, () => { controls.r0Au = clamp(logSliderToValue(Number(r0Slider.value)), 0.1, 10); }],
  [speedSlider, () => { controls.speedFactor = clamp(Number(speedSlider.value), 0, 2.5); }],
  [directionSlider, () => { controls.directionDeg = clamp(Number(directionSlider.value), -85, 85); }]
];

for (const [slider, readInto] of sliderReaders) {
  slider.addEventListener("input", () => {
    readInto();
    setPresetPressed(null);
    recomputeOrbit();
  });
  // Announce once the value settles: `input` fires on every drag step, `change` once.
  slider.addEventListener("change", announce);
}

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const name = button.dataset.preset;
    if (name && name in PRESETS) applyPreset(name as PresetName);
  });
}

playButton.addEventListener("click", startAnimation);
pauseButton.addEventListener("click", stopAnimation);
resetButton.addEventListener("click", resetAnimation);

/** One row from exact controls, through the same derivation as the screen. */
function stationRow(caseLabel: string, c: Controls) {
  const o = ConservationLawsModel.initialOrbit(c);
  const base = {
    case: caseLabel,
    mSolar: formatNumber(c.massSolar, 3),
    r0Au: formatNumber(c.r0Au, 3),
    speedFactor: formatSpeedFactor(c.speedFactor),
    directionDeg: String(Math.round(c.directionDeg)),
    orbitType: formatOrbitType(o.orbitType)
  };
  if (o.orbitType === "invalid") return { ...base, e: "—", eps: "—", h: "—", rp: "—" };
  const radial = o.orbitType === "radial";
  return {
    ...base,
    e: radial ? "—" : formatNumber(o.ecc, 3),
    eps: formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / c.r0Au),
    h: formatNumber(o.hAbsAu2Yr, 4),
    rp: radial ? "—" : formatNumber(o.rpAu, 3)
  };
}

function exportResults(): ExportPayloadV1 {
  const o = validOrbit();
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mode", value: runtime.mode },
      { name: "Central mass M (Msun)", value: formatNumber(controls.massSolar, 4) },
      { name: "Initial radius r_0 (AU)", value: formatNumber(controls.r0Au, 4) },
      { name: "Speed factor v/v_circ", value: formatNumber(controls.speedFactor, 6) },
      { name: "Direction from tangential (deg, + outward)", value: String(Math.round(controls.directionDeg)) }
    ],
    readouts: [
      { name: "Orbit type", value: formatOrbitType(orbit.orbitType) },
      { name: "Eccentricity e", value: o ? formatNumber(o.ecc, 6) : "—" },
      { name: "Specific kinetic energy K (AU^2/yr^2)", value: kValue.textContent ?? "—" },
      { name: "Specific potential energy U (AU^2/yr^2)", value: uValue.textContent ?? "—" },
      { name: "Specific energy eps (AU^2/yr^2)", value: o ? formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / controls.r0Au) : "—" },
      { name: "Specific angular momentum |h| (AU^2/yr)", value: o ? formatNumber(o.hAbsAu2Yr, 8) : "—" },
      { name: "Periapsis r_p (AU)", value: o ? formatNumber(o.rpAu, 8) : "—" },
      { name: "Speed v (km/s)", value: vKmSValue.textContent ?? "—" }
    ],
    notes: [
      "Teaching units: AU / yr / Msun with G = 4*pi^2 AU^3/(yr^2 Msun).",
      "Bound or unbound follows the sign of eps = K + U; the conic shape follows the eccentricity.",
      "Paths reaching beyond 6 r_0 (within 1.5 to 50 AU) are clipped to the plotted window."
    ]
  };
}

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Keyboard shortcuts work when focus is not in an input field.",
    sections: [
      {
        heading: "Shortcuts",
        type: "shortcuts",
        items: [
          { key: "?", action: "Toggle help" },
          { key: "g", action: "Toggle station mode" }
        ]
      },
      {
        // Typeset by renderMath(modal) each time the dialog opens (runtime demoModes.ts:389).
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Start at $M = 1\\,M_{\\odot}$, $r_0 = 1$ AU, $v/v_{\\rm circ} = 1$, direction $0^{\\circ}$: a circular orbit.",
          "Press Escape to set $v/v_{\\rm circ} = \\sqrt{2}$ exactly and watch $\\varepsilon$ read 0.",
          "Press Play on the Elliptical preset: $K$ and $U$ change while $\\varepsilon = K + U$ does not.",
          "Tilt the direction to lower $|h|$ at the same speed and watch $r_p$ shrink."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Conservation Laws",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Record a circular case (speed factor 1).",
      "Press Escape and record it (speed factor exactly the square root of 2).",
      "Record a hyperbolic case (speed factor above 1.42) and compare the specific energy."
    ],
    // ASCII on purpose: the runtime writes these labels into the CSV header (decision D2).
    columns: [
      { key: "case", label: "Case" },
      { key: "mSolar", label: "M (Msun)" },
      { key: "r0Au", label: "r0 (AU)" },
      { key: "speedFactor", label: "v/v_circ" },
      { key: "directionDeg", label: "dir (deg)" },
      { key: "orbitType", label: "type" },
      { key: "e", label: "e" },
      { key: "eps", label: "eps (AU^2/yr^2)" },
      { key: "h", label: "|h| (AU^2/yr)" },
      { key: "rp", label: "r_p (AU)" }
    ],
    getSnapshotRow: () => stationRow("Snapshot", { ...controls }),
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add the four preset cases (1 solar mass, 1 AU)",
        getRows: () =>
          (Object.keys(PRESETS) as PresetName[]).map((name) =>
            stationRow(PRESETS[name].label, {
              massSolar: 1,
              r0Au: 1,
              speedFactor: PRESETS[name].speedFactor,
              directionDeg: PRESETS[name].directionDeg
            })
          )
      }
    ]
  }
});

demoModes.bindButtons({ helpButton, stationButton: stationModeButton });

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) => setLiveRegionText(status, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."));
});

syncSlidersToControls();
recomputeOrbit();
if (prefersReducedMotion) {
  setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
}
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);
```

**Step 8: Unit tests, typecheck, math validator**

```bash
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws > /tmp/cl-t8u.log 2>&1; echo EXIT=$?
corepack pnpm -C apps/demos typecheck > /tmp/cl-t8tc.log 2>&1; echo EXIT=$?
node scripts/validate-math-formatting.mjs > /tmp/cl-t8m.log 2>&1; echo EXIT=$?
```

Expected: EXIT=0 for all three. A typecheck error on `valid && o.ecc`-style narrowing means the TypeScript version predates aliased-condition narrowing; restructure with an early return instead of silencing it.

**Step 9: Rebuild and run the E2E spec -> GREEN**

```bash
corepack pnpm build > /tmp/cl-build8.log 2>&1; echo EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test --project=desktop tests/conservation-laws.spec.ts > /tmp/cl-e2e8.log 2>&1; echo EXIT=$?
grep -E "passed|failed|skipped" /tmp/cl-e2e8.log | tail -3
```

Expected: EXIT=0 for both. If a fold test fails, follow Step 5; if "K and U trade" is flaky, lengthen the wait to 600 ms, never loosen the assertion.

**Step 10: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/index.html apps/demos/src/demos/conservation-laws/style.css \
  apps/demos/src/demos/conservation-laws/main.ts apps/demos/src/demos/conservation-laws/logic.ts \
  apps/demos/src/demos/conservation-laws/logic.test.ts apps/site/tests/conservation-laws.spec.ts
git commit -m "Show the orbit the student set in conservation-laws

Exact presets, the body starts at r0, the arrow is distance in a stated time, the view no
longer jumps at escape, K and U are back, speed 0 is radial, and changes are announced.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Design contracts for the new surface (B5, U1, H3)

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/design-contracts.test.ts`

**Step 1: Add the contracts** (inside the top-level `describe`, after "Chip button aria-pressed")

```ts
  describe("Contracts from the 2026-09-11 review", () => {
    it("K and U readouts exist with separated units", () => {
      expect(html).toMatch(/id="kAu"><\/span> <span class="cp-readout__unit">/);
      expect(html).toMatch(/id="uAu"><\/span> <span class="cp-readout__unit">/);
      expect((html.match(/class="cp-readout__unit"/g) || []).length).toBeGreaterThanOrEqual(6);
    });

    it("slider values carry typeset units, never ASCII Msun or deg", () => {
      expect(html).toMatch(/id="massValue"><\/span> <span class="control__unit">\$M_\{\\odot\}\$/);
      expect(html).toMatch(/id="directionValue"><\/span><span class="control__unit">\$\^\{\\circ\}\$/);
      expect(mainTs).not.toMatch(/textContent = `[^`]*\b(Msun|deg)\b/);
    });

    it("the stage names the arrow's time step", () => {
      expect(html).toContain('id="arrowDtDays"');
    });

    it("announcements happen on change and presets, never inside the per-frame renderBody", () => {
      const renderBody = mainTs.match(/function renderBody\(\) \{[\s\S]*?\n\}\n/)?.[0] ?? "";
      expect(renderBody.length).toBeGreaterThan(0);
      expect(renderBody).not.toContain("setLiveRegionText");
      expect(mainTs).toContain('addEventListener("change", announce)');
    });

    it("help text is LaTeX, not ASCII math", () => {
      expect(mainTs).not.toContain("sqrt(2)");
    });

    it("the old conic helpers and dead classifier are gone from logic.ts", () => {
      const logicTs = fs.readFileSync(path.resolve(__dirname, "logic.ts"), "utf-8");
      for (const name of ["classifyOrbit", "orbitalRadiusAu", "conicPositionAndTangentAu", "instantaneousSpeedAuPerYr", "velocityArrowSvg"]) {
        expect(logicTs).not.toContain(`function ${name}`);
      }
    });
  });
```

**Step 2: Run, then prove each can fail**

Run: `corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws/design-contracts.test.ts > /tmp/cl-t9.log 2>&1; echo EXIT=$?`
Expected: EXIT=0 (Task 8 satisfied them).

Because they were written after the code, check that they bite: temporarily change `massValue.textContent = formatNumber(controls.massSolar, 2);` to `` massValue.textContent = `${formatNumber(controls.massSolar, 2)} Msun`; ``, rerun (expect the "never ASCII Msun" test to FAIL), then restore and rerun (EXIT=0). Do the same once for the `renderBody` contract by adding `setLiveRegionText(status, "x");` inside `renderBody`.

**Step 3: Commit**

```bash
git add apps/demos/src/demos/conservation-laws/design-contracts.test.ts
git commit -m "Add design contracts for typeset units, announcements and the arrow caption

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Teaching copy that matches the instrument (B1, B2, B3, H3; brings in B4)

Use @cosmic-instructor-materials and @cosmic-site-content. Frontmatter is typeset by client auto-render (double backslashes inside YAML double quotes); Markdown bodies by remark-math (single backslashes, fenced `$$`).

**Files:**
- Cherry-pick: `cb8f67b` from `claude/instructor-math-formatting` (instructor math formatting, 32 files)
- Modify: `apps/site/src/content/demos/conservation-laws.md`
- Modify: `apps/site/src/content/stations/conservation-laws.md`
- Modify: `apps/site/src/content/instructor/conservation-laws/{index,activities,assessment,backlog,model}.md`

**Step 1: Bring in the instructor math formatting, content commit only**

```bash
git show --name-only --format= cb8f67b | grep -vc '^apps/site/src/content/instructor/'   # expect 0
git cherry-pick cb8f67b
```

Do **not** take `72f975a` (the stricter validator): with it, `validate-math-formatting.mjs` exits 1 on 24 lines outside instructor pages (station cards, the hub, `FilterBar.astro`, three demo `index.html` files). It lands after those are fixed, recorded as a follow-up in Task 13. In the conservation-laws folder `cb8f67b` changes only five lines (two `√2` headings, three unit carets in `model.md`), none of which the steps below touch.

**Step 2: Exhibit (B2)** — `apps/site/src/content/demos/conservation-laws.md` frontmatter

- `tags`: replace `"momentum conservation"` with `"angular momentum"`.
- `predict_prompt: "A planet on an elliptical orbit moves closer to its star. What happens to its speed, its kinetic energy and its total energy?"`
- `play_steps:`
  - `"Press Play on the Elliptical preset and watch $K$ and $U$ trade places while $\\varepsilon$ stays fixed."`
  - `"Drag $v/v_{\\rm circ}$ from 1.41 to 1.42: the orbit switches from elliptical to hyperbolic. Press Escape for exactly $\\sqrt{2}$, where $\\varepsilon = 0$."`
  - `"Set the direction to $60^\\circ$ and compare $|h|$ and periapsis $r_p$ with $0^\\circ$ at the same speed factor."`
- `explain_prompt: "Which quantities stayed constant while the body moved, which changed, and what assumptions make that true?"`
- `misconceptions`: add `"A faster-moving orbiting body has more total energy."`
- `model_notes`, third bullet: `"Escape at $v/v_{\\rm circ}=\\sqrt{2}$; the Escape preset sets it exactly, while the slider steps from 1.41 to 1.42."`
- `content_verified: false` (Task 12 sets it back after the re-review), `last_updated: "2026-09-11"`.
- Body: `Start with a circular case ($v/v_{\rm circ}=1$), press Play on the Elliptical preset to watch $K$ and $U$ trade, then press Escape ($\sqrt{2}$) and go beyond to see $\varepsilon$ change sign.`

**Step 3: Station card (B1)** — `apps/site/src/content/stations/conservation-laws.md`

- Task 1 (line 17): `> 1) **Escape test:** Raise the speed factor until the orbit type changes from elliptical to hyperbolic. Record the last elliptical and first hyperbolic values, then press **Escape** and record the exact value it sets.  `
- Word bank: add `> - **Kinetic $K$ and potential $U$:** they trade places as the body moves; their sum $\varepsilon$ does not change.`
- Sanity check (line 41): `>   (so speed factor $\approx 1.414$; the slider steps from 1.41 to 1.42), regardless of direction.`
- `last_updated: "2026-09-11"`.

**Step 4: Instructor pages (B1, B3, H3)**

- `index.md`, live-teach step 2: append `Press Play and ask: *"Which readouts change, and which stays fixed?"* ($K$ and $U$ change; $\varepsilon$ does not.)`
- `index.md`, step 3: `3. **Go to escape:** press the **Escape** preset, which sets $v/v_{\rm circ}=\sqrt{2}\approx 1.414$ exactly (the slider alone steps from 1.41, still bound, to 1.42, unbound).`
- `activities.md`, MW Quick step 3: `3. Press the **Escape** preset (speed factor exactly $\sqrt{2}\approx 1.414$) and ask: *"What's special about this value?"*`
- `activities.md`, MW Short step 2: `2. Increase the speed factor until the orbit type switches from elliptical (1.41) to hyperbolic (1.42), then press **Escape** to see the exact boundary, "parabolic (escape)".`
- `activities.md`, "Station version" block: make task 1 and the sanity check identical to Step 3.
- `assessment.md`, Q1 (B1): replace options and explanation with

```markdown
A. 1.00  
B. 1.20  
C. $\sqrt{2}\approx 1.414$  
D. 2.00

**Answer:** C  
**Why:** escape occurs at $v_{\rm esc}=\sqrt{2}\,v_{\rm circ}$. On the slider the orbit is still elliptical at 1.41 and already hyperbolic at 1.42; the Escape preset sets the exact value.
```

- `assessment.md`, Q2 "Why" (B3): `**Why:** $h = r v\cos\theta$, where $\theta$ is the direction from tangential, so only the sideways part of the velocity counts; at $85^\circ$ that is $\cos 85^\circ \approx 0.09$ of the speed.`
- `backlog.md` (H3): move "energy decomposition" to Completed as `**DONE (2026-09-11):** $K$ and $U$ readouts beside $\varepsilon$; an energy bar chart waits on the design brief.`; move the "station mode overlay" row to Completed as `**DONE:** Station Mode (snapshot rows, preset cases, CSV, print).`; fix the stale entrypoints `demos/_assets/physics/` -> `packages/physics/src/` and `demos/_instructor/conservation-laws/` -> `apps/site/src/content/instructor/conservation-laws/`.
- All five instructor files: the nav line `- Instructor hub: [/demos/_instructor/](../../instructor/)` becomes `- Instructor hub: [All instructor notes](../../instructor/)`.

**Step 5: Validate and build**

```bash
node scripts/validate-math-formatting.mjs > /tmp/cl-t10m.log 2>&1; echo EXIT=$?
corepack pnpm -C apps/site typecheck > /tmp/cl-t10tc.log 2>&1; echo EXIT=$?
corepack pnpm build > /tmp/cl-t10b.log 2>&1; echo EXIT=$?
grep -c "katex-error" apps/site/dist/exhibits/conservation-laws/index.html apps/site/dist/stations/conservation-laws/index.html apps/site/dist/instructor/conservation-laws/index.html
```

Expected: three EXIT=0; each grep count 0. Open the three pages in the preview and read the changed passages once (predict prompt, station task 1, Q1, Q2) to confirm the math renders.

**Step 6: Commit**

```bash
git add apps/site/src/content/demos/conservation-laws.md apps/site/src/content/stations/conservation-laws.md \
  apps/site/src/content/instructor/conservation-laws/index.md apps/site/src/content/instructor/conservation-laws/activities.md \
  apps/site/src/content/instructor/conservation-laws/assessment.md apps/site/src/content/instructor/conservation-laws/backlog.md \
  apps/site/src/content/instructor/conservation-laws/model.md
git commit -m "Make the conservation-laws teaching copy match what the instrument can show

Q1's key, the station card and the activities asked for a slider value that cannot exist;
the exhibit asked about linear momentum, which the demo never shows.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: An honest parity record (H2)

**Files:**
- Modify: `docs/audits/migrations/conservation-laws-parity.md` (every section currently says "Pending")

**Step 1: Replace the file with**

```markdown
# conservation-laws Migration Parity Audit

Legacy: `~/Teaching/astr101-sp26/demos/conservation-laws/` (read-only). Compared 2026-09-11 with branch `claude/conservation-laws-refactor`.

## 1) Behavior parity
- Start point: legacy mapped r0 on +x into the start anomaly (`conservation-laws.js:416-427`). The port had lost this and started every orbit at periapsis. Restored through `ConservationLawsModel.initialOrbit` (`nu0Rad`).
- Presets: legacy computed from exact state. The port read the snapped slider back, so Escape gave e = 0.988. Restored: exact `controls`.
- Classification: the same `TwoBodyAnalytic` thresholds, plus a new `radial` type for h = 0 (both versions used to call a body at rest "parabolic").
- Animation: the same equal-area advance (dnu/dt = h/r^2, 1/3 yr per second). New: Play restarts an open orbit that has left the view.

## 2) Visual and interaction parity
- Readouts: legacy showed type, e, eps, h, v, K, U, r_p and a. The refactor shows all of them except a.
- Arrow: legacy and the port both drew 60 px x v/v_circ(r0), clamped to 20-120 px. Now it is the distance covered in a stated number of days, drawn at the orbit's scale.
- View: legacy fitted the drawn path; now a window continuous across e = 1, capped at 6 r0 (1.5 to 50 AU).

## 3) Export parity
- Adds K and U; every field names its unit.

## 4) Pedagogical parity
- Legacy announced "Orbit is X. e = ..." after every update; the port announced nothing. Now announced on `change` and preset clicks.
- Station Mode is new in the port (legacy linked a PDF station card).

## 5) Intentional deltas
- No semi-major-axis readout: the readout row holds 8 cards in two rows at 1280 px.
- Speed factor shown to 3 decimals, so the exact Escape preset (1.414) is distinguishable from 1.41.
- Arrow time step, radial classification and the view window rule, as above.
- Station column labels stay ASCII because the same labels head the CSV export.

## 6) Promotion recommendation
- Parity is met with the deltas above. The readiness decision is recorded in STATUS.md; stable needs Anna's approval.
```

**Step 2: Commit**

```bash
git add docs/audits/migrations/conservation-laws-parity.md
git commit -m "Record conservation-laws parity with legacy and the intentional deltas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Verify, then review (one reviewer at a time)

Use @cosmic-verification. Every claim below needs an exit code or a measurement from this session.

**Step 1: All gates**

```bash
corepack pnpm gates > /tmp/cl-gates.log 2>&1; echo EXIT=$?
```

Expected: EXIT=0. Record each gate's pass count from the log (physics, theme, demos, build, typecheck, E2E) for STATUS.md.

**Step 2: Physics review (mandatory before any push)**

Dispatch the `physics-reviewer` agent with scope: `git diff main..HEAD -- packages/physics/src/twoBodyAnalytic.ts packages/physics/src/conservationLawsModel.ts apps/demos/src/demos/conservation-laws/`. Ask it to trace model -> `logic.ts` -> `main.ts` rendering -> interaction for: the start anomaly sign for inward and outward starts, counter-clockwise motion on screen, the radial threshold, the arrow's y flip, K + U = eps along the animated orbit, and the view window at e just below and above 1. Give it Appendix A for independent values. Wait for the report. Fix any finding test-first and rerun Step 1 before going on.

**Step 3: Adversarial re-review**

After the physics review has finished, run `/cp-audit-demo conservation-laws` against a fresh `corepack pnpm -C apps/site preview --host 127.0.0.1 --port 4173`. Pass criteria: P1-P5, U1, B1-B3 and H1-H3 each re-marked fixed with a measurement, and no new High finding.

**Step 4: Visual review**

After Step 3 has finished, dispatch `visual-ux-reviewer` at 1440x900, 1280x720, 390x844 and 320x640. Save its screenshots under `output/playwright/conservation-laws/after/`, next to the review's before-evidence. U2 (controls below the readouts on phones) is expected to remain; it is decision D3, not a regression.

**Step 5: Mark the content verified, only if Step 3 passed**

In `apps/site/src/content/demos/conservation-laws.md` set `content_verified: true` and `lastVerifiedAt: "2026-09-11"` (or the actual date of Step 3), then:

```bash
git add apps/site/src/content/demos/conservation-laws.md
git commit -m "Mark conservation-laws content verified after the re-review

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Readiness, STATUS.md and landing

**Step 1: Readiness** (@cosmic-readiness)

Run `/cp-promote conservation-laws`. Promote to `candidate` only if Task 12 passed with no open High or Medium physics finding. If promoting, add `play/conservation-laws/` to `apps/site/tests/reflow.spec.ts` in the same commit (the rule for candidate and above) and set `readinessReason` to public copy such as `"Presets, start state, energy readouts and announcements were checked against an independent recompute on 2026-09-11; awaiting classroom use before stable."` Stable needs Anna's approval: ask, do not set it.

**Step 2: STATUS.md**

- Update `next:` with what landed and the gate numbers from Task 12.
- Add a "conservation-laws refactor, 2026-09-11" section: findings fixed, measurements, and these follow-ups:
  - Validator commit `72f975a` (branch `claude/instructor-math-formatting`) waits on 24 non-instructor lines, listed in the agent report.
  - Raw TeX inside inline code on `galaxy-rotation/model.md:45`, `moon-phases/model.md:49-52`, `parallax-distance/assessment.md:44,64`, and 17 ASCII `->` arrows in instructor prose (left unchanged by the agent).
  - U2: phone ordering belongs to the shared shell's bottom-sheet work (D3).
  - D4: energy bar chart, swept area, Challenge Mode and stage composition wait on the design brief.

```bash
git add STATUS.md
git commit -m "Update STATUS for the conservation-laws refactor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

**Step 3: Land on main** (CLAUDE.md "Land to main")

```bash
git checkout main
git pull --ff-only
git merge --ff-only claude/conservation-laws-refactor
corepack pnpm build > /tmp/cl-land-build.log 2>&1; echo EXIT=$?
corepack pnpm -r typecheck > /tmp/cl-land-tc.log 2>&1; echo EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e > /tmp/cl-land-e2e.log 2>&1; echo EXIT=$?
gh run list --branch main --limit 1
```

If `--ff-only` fails, `main` moved: merge `main` into the branch, rerun Task 12 Step 1, and try again. **Ask Anna before `git push origin main`.** The push publishes the site, and it cancels any deploy still running (`deploy.yml` has `cancel-in-progress: true`), so check the last command's output first.

**Step 4: Clean up the agent worktree**

```bash
git worktree list
git worktree remove .claude/worktrees/agent-a95da6db8a05153b2
```

Keep the branch `claude/instructor-math-formatting` for `72f975a`. `.claude/worktrees/` is not gitignored, so never stage it.

---

## Appendix A: independent recompute for the reference values

Run with `python3`. It deliberately avoids the repo's model formulas.

```python
import math
G = 4 * math.pi**2; DPY = 365.25; LADDER = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]

def view_r(e, p, r0):
    ra = p / (1 - e) if e < 1 else math.inf
    fit = max(ra, r0) * 1.1 if e < 1 else math.inf
    return min(max(min(fit, 6 * r0), 1.5), 50), ra

def pick(vmax, s, maxpx=120):
    if not vmax > 0: return None
    ok = [d for d in LADDER if d * vmax * s / DPY <= maxpx]
    return ok[-1] if ok else LADDER[0]

def run(M, r0, f, deg):
    mu = G * M; v = f * math.sqrt(mu / r0); a = math.radians(deg)
    x, y, vx, vy = r0, 0.0, v * math.sin(a), v * math.cos(a)
    v2 = vx * vx + vy * vy; eps = v2 / 2 - mu / r0; h = x * vy - y * vx; rv = x * vx + y * vy
    ex = ((v2 - mu / r0) * x - rv * vx) / mu; ey = ((v2 - mu / r0) * y - rv * vy) / mu
    e = math.hypot(ex, ey); p = h * h / mu; om = math.atan2(ey, ex) if e > 1e-14 else 0.0
    nu0 = math.atan2(-x * math.sin(om) + y * math.cos(om), x * math.cos(om) + y * math.sin(om))
    R, ra = view_r(e, p, r0); s = 250 / R; vp = mu * (1 + e) / h if h > 0 else 0; dt = pick(vp, s)
    print(dict(e=round(e, 6), eps=round(eps, 6), h=round(h, 6), rp=round(p / (1 + e), 6), ra=ra,
               nu0=round(nu0, 6), vPeri=round(vp, 6), K0=round(v2 / 2, 6), U0=round(-mu / r0, 6),
               viewR=round(R, 6), dtDays=dt, arrow0px=round(v * (dt / DPY) * s, 3) if dt else 0))

for args in [(1, 1, 1, 0), (1, 1, 0.75, 0), (1, 1, 1.40, 0), (1, 1, math.sqrt(2), 0), (1, 1, 1.42, 0),
             (1, 1, 1.8, 0), (1, 1, 1.2, 60), (10**0.4, 10**-0.3, 0.9, -30), (10, 1, 1, 0), (1, 10, 1.8, 0)]:
    run(*args)
```

## Out of scope

- Visual redesign (D4) and phone ordering (D3), as above.
- `em-spectrum`, `planetary-conjunctions` and the other STATUS.md items: separate plans.
- Fixing the 24 non-instructor lines that block `72f975a`: a follow-up recorded in STATUS.md.

## Execution log and errata (2026-09-11)

Recorded while executing this plan with subagents. The tasks above are left as written.

**Errata**
- Task 1 Step 4: `twoBodyAnalytic.test.ts` already had 11 tests, so green is 17, not 15.
- Task 10 Step 1: `cb8f67b` changes four unit carets in `conservation-laws/model.md`, not three.
- Task 7: the Station Mode row locators are anchored regexes (`/^\s*Escape/`), corrected before execution (`4d3188f`).

**Decided during execution**
- Fold at 1280x720 (Anna, 2026-09-11). With eight readouts and the caption below the orbit, the lowest readout ended at 758px. The caption now sits beside the orbit at >= 1025px (`minmax(0, 1fr) 14rem`), the orbit floor is 270px and the budget `calc(100svh - 25rem)`: 896px at 1440x900, 716px at 1280x720. The fold tests wait for finite animations before measuring.
- Code review follow-ups: a test pinning the clockwise true-anomaly branch (`f60ab55`), a test for the outward radial announcement (`1a392b5`), and K and U defined on the instructor model page (`71dd7be`).
- The mandatory physics review found M1 and L1-L5, fixed in `8043322`, `38e4d36` and `95a493e`:
  - M1: an exact Escape after a mass change rounded e to 0.9999999999999996 and animated as a closed orbit. `initialOrbit` now returns e = 1 for parabolic orbits.
  - L1: forward Euler stepping gave wrong periods at high e (speed factor 0.3: 0.553 s against Kepler's 1.137 s). Bound orbits now step the mean anomaly; open orbits sub-step dnu <= 0.01 rad (`advanceTrueAnomalyByTime`; `advanceTrueAnomalyRad` removed).
  - L2: an arrow too fast for a 1-day step is capped at 120px with a "not to scale" caption (`arrowScale`).
  - L3: `formatNumber` never emits e-notation; circular orbits show e = 0.
  - L4: clockwise starts are `invalid` in `initialOrbit`.
  - L5: mu = GM is stated in the Model notes; all four sliders carry `aria-valuetext`.
- Environment: Playwright 1.58's browser install hung while unpacking under Node 26.5.0 and finished in 11 s under Node 24.18.0. The stricter math validator `72f975a` still waits on 24 non-instructor lines.
