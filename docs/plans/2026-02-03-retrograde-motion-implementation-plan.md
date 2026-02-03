# Retrograde Motion (Apparent Longitude) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Implement the `retrograde-motion` demo (instrument + shared physics) exactly matching `docs/plans/2026-02-03-retrograde-motion-design.md`, including deterministic Keplerian orbits, explicit angle unwrap + event detection, and a triad-shell UI with linked plot + orbit view.

**Architecture:** Put all reusable orbit/angle/event logic in `packages/physics` as a deterministic, test-backed model. The Vite demo in `apps/demos` is a thin UI layer: controls → (re)compute series via the model → render SVG plot + orbit view → export results via `@cosmic/runtime`.

**Tech Stack:** TypeScript, Vitest (`packages/physics`), Vite demos (`apps/demos`), Astro content (`apps/site/src/content`), Playwright smoke (`apps/site/tests`), `@cosmic/runtime` export + KaTeX init, `@cosmic/theme` instrument tokens/shell.

---

## Specs / contracts implemented (source of truth)

- Demo design + physics + UX contracts: `docs/plans/2026-02-03-retrograde-motion-design.md`
  - Physics model contract (Kepler solver, $\lambda_{\mathrm{app}}$, unwrap, retrograde, stationary refinement)
  - UI/UX contracts (triad shell, labels, accessibility, misconception sentence)
  - Verification + regression expectations
- Demo runtime standard (instrument/export): `docs/specs/cosmic-playground-site-spec.md` §9.1–9.4
- Demo shell variants contract: `docs/specs/cosmic-playground-demo-shell-variants.md` (DOM invariant + `data-shell="triad"`)
- Theme rules (tokens, no hardcoded colors): `docs/specs/cosmic-playground-theme-spec.md` §2.2, §3.2, §4

---

## Open questions (confirm before merging; defaults below)

1) **Planet element dataset / epoch choice:** The design spec locks the *model form* but not the specific $(a,e,\varpi,L_0)$ values. Default plan: use a fixed, documented “toy J2000-ish” element set with $t_0 = 0$ model day so Earth→Mars and Earth→Venus retrograde occur in a 24-month window.
2) **Station + instructor pages:** The prompt only requires the demo + `apps/site/src/content/demos/retrograde-motion.md`. Default plan: do **not** add `apps/site/src/content/stations/retrograde-motion.md` or `apps/site/src/content/instructor/retrograde-motion/*` (out-of-scope), but keep `station_path` / `instructor_path` fields in the demos frontmatter consistent with the schema.

If either default is unacceptable, stop after Task 0 and adjust the plan.

---

## Acceptance criteria (mapped to spec sections)

### A) Physics/model correctness (Design Spec: “Physics model (v1 contract)”)

- A1. **Coplanar Keplerian ellipses** with element set $(a,e,\varpi,L_0)$ and explicit epoch $t_0$; time is real-valued “model day” only. (Design Spec: “Keplerian state per planet”, “Coordinate system and time”)
- A2. **Deterministic Kepler solver**: Newton iteration with:
  - initial guess $E_0=M$ if $e\le 0.8$, else $E_0=\pi$,
  - tolerance $|\Delta E| < 10^{-12}$ rad,
  - max 15 iterations,
  - bisection fallback on $E\in[0,2\pi)$. (Design Spec: “Kepler solver contract (deterministic)”)
- A3. Apparent longitude is computed exactly as:
  $$\lambda_{\mathrm{app}}(t)=\operatorname{wrap}_{0..360}\left(\arctan2(y_t-y_o,\;x_t-x_o)\right).$$
  (Design Spec: “Apparent (sky) longitude from observer to target”)
- A4. Unwrapping follows the **explicit 180° jump rule** over sampled series. (Design Spec: “Angle wrapping and unwrapping (explicit algorithm)”)
- A5. Retrograde is detected by **sign of derivative**:
  $$d\tilde{\lambda}/dt < 0.$$
  Derivative uses central difference on internal grid with $\Delta t_{\mathrm{internal}}=0.25$ day. (Design Spec: “Derivative estimation contract”)
- A6. Stationary points are detected by derivative sign-change brackets and refined via bisection (or secant) until bracket width $<10^{-3}$ day. (Design Spec: “Stationary point detection + refinement contract”)

### B) UI/UX + accessibility (Design Spec: “UI/UX and visuals”, “Accessibility requirements (minimum)”)

- B1. Uses instrument DOM contract with `#cp-demo`, `#copyResults`, `#status`, `.cp-demo__drawer` and `data-shell="triad"`. (Site Spec §9.1, Demo Shell Variants doc)
- B2. Stage shows **two linked views simultaneously**:
  - Plot: unwrapped $\tilde{\lambda}_{\mathrm{app}}(t)$ + retrograde bands + stationary markers + cursor + thin wrapped strip. (Design Spec: “Stage view A”)
  - Orbit view: Sun + ellipses + current positions + line of sight + inertial +x axis reference ray with “0 deg” tick. (Design Spec: “Stage view B”, “Inertial 0° axis (explicit)”)
- B3. Primary label is **“Apparent (sky) longitude”** with LaTeX $\\lambda_{\\mathrm{app}}$ in the UI. (Design Spec: “Goals”, “Readouts”)
- B4. Drawer contains required misconception sentence exactly:
  - “Retrograde here is **apparent**: the planet never reverses its orbit; the sign flip comes from relative motion and viewing geometry.” (Design Spec: “Pedagogical guardrail (required copy)”)
- B5. Retrograde highlighting is **not color-only** (pattern + tone and/or embedded “retrograde” labels). (Design Spec: “Accessibility requirement (do not rely on color alone)”)
- B6. Keyboard support:
  - controls operable by keyboard,
  - plot supports keyboard time stepping (left/right) as well as pointer scrubbing,
  - copy results updates a live region. (Design Spec: “Accessibility requirements (minimum)”)

### C) Base-path safety + build pipeline (Repo contracts)

- C1. No root-absolute or hardcoded `/cosmic-playground/` links in demo HTML/TS. (Base-path rules)
- C2. `corepack pnpm build` passes, including `scripts/validate-play-dirs.mjs`. (Demo pipeline contract)
- C3. `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` passes. (Site Spec §13, prompt requirement)

---

## Regression expectations (must stay true)

- R1. Earth observer → Mars target yields at least one retrograde interval with two stationary points (within a 24 model-month window).
- R2. Earth observer → Venus target yields at least one retrograde interval (within a 24 model-month window).

---

## Out of scope (explicit)

- Real-world calendar-date mapping or ephemeris-grade accuracy (Design Spec non-goals).
- Inclined orbits / RA-Dec coordinates / N-body perturbations.
- Exoplanet systems.
- **Station cards and instructor notes** for `retrograde-motion` (unless explicitly requested).

---

## Implementation plan (TDD-first, bite-sized tasks)

### Task 0: Preflight scans + add a failing e2e expectation

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts` (add `retrograde-motion` to `migratedInteractiveDemos` list)

**Step 1: Write the failing Playwright expectation**

Add an entry:

```ts
{
  slug: "retrograde-motion",
  expects: ["Observer", "Target", "Apparent (sky) longitude lambda_app (deg)"]
}
```

**Step 2: Run the single e2e file (expect FAIL)**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e tests/smoke.spec.ts`

Expected: FAIL because `/play/retrograde-motion/` does not exist yet.

---

### Task 1: Add deterministic Kepler solver (unit tests first)

**Files:**
- Create: `packages/physics/src/retrogradeMotionModel.test.ts`
- Create: `packages/physics/src/retrogradeMotionModel.ts`

**Step 1: Write failing tests for the solver**

Add tests that:
- satisfy Kepler’s equation residual,
- match circular limit ($e=0 \Rightarrow E=M$),
- exercise bisection fallback by forcing `maxIterations: 0`.

```ts
import { describe, expect, test } from "vitest";
import { RetrogradeMotionModel } from "./retrogradeMotionModel";

describe("RetrogradeMotionModel.solveEccentricAnomalyRad", () => {
  test("satisfies Kepler equation residual", () => {
    const e = 0.3;
    const M = 1.234;
    const E = RetrogradeMotionModel.solveEccentricAnomalyRad({
      meanAnomalyRad: M,
      eccentricity: e
    });
    const resid = E - e * Math.sin(E) - M;
    expect(Math.abs(resid)).toBeLessThan(1e-10);
  });

  test("circular limit: e=0 gives E≈M", () => {
    const e = 0;
    const M = 2.0;
    const E = RetrogradeMotionModel.solveEccentricAnomalyRad({
      meanAnomalyRad: M,
      eccentricity: e
    });
    expect(Math.abs(E - M)).toBeLessThan(1e-12);
  });

  test("bisection fallback produces a valid solution", () => {
    const e = 0.95;
    const M = 5.8;
    const E = RetrogradeMotionModel.solveEccentricAnomalyRad({
      meanAnomalyRad: M,
      eccentricity: e,
      maxIterations: 0
    });
    const resid = E - e * Math.sin(E) - M;
    expect(Math.abs(resid)).toBeLessThan(1e-10);
  });
});
```

**Step 2: Run physics tests (expect FAIL)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

Expected: FAIL (module missing).

**Step 3: Implement minimal solver to pass**

Implement:
- `wrap0ToTauRad`,
- Newton iteration (15 iters, tol `1e-12`),
- deterministic bisection fallback on `[0, 2π]`.

**Step 4: Re-run tests (expect PASS)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

---

### Task 2: Implement orbital position from $(a,e,\varpi,L_0,t_0)$ (unit tests first)

**Files:**
- Modify: `packages/physics/src/retrogradeMotionModel.test.ts`
- Modify: `packages/physics/src/retrogradeMotionModel.ts`

**Step 1: Add failing tests for circular-orbit geometry**

For $e=0$:
- radius stays $r=a$,
- angle advances linearly with $L(t)$,
- returned $(x,y)$ is on the circle within tolerance.

**Step 2: Run tests (expect FAIL)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

**Step 3: Implement**

Implement:
- `meanLongitudeDegAtTime`,
- `meanAnomalyRadAtTime` with wrap to `[0,2π)`,
- true anomaly from eccentric anomaly (spec formula),
- $r=a(1-e\cos E)$,
- $(x,y)$ using $\nu+\varpi$.

**Step 4: Run tests (expect PASS)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

---

### Task 3: Implement $\lambda_{\mathrm{app}}$ + unwrap + derivative helpers (unit tests first)

**Files:**
- Modify: `packages/physics/src/retrogradeMotionModel.test.ts`
- Modify: `packages/physics/src/retrogradeMotionModel.ts`

**Step 1: Add failing unwrap tests**

```ts
test("unwrap180Deg produces continuous series", () => {
  const wrapped = [350, 355, 2, 5];
  const unwrapped = RetrogradeMotionModel.unwrapDeg180(wrapped);
  expect(unwrapped).toEqual([350, 355, 362, 365]);
});
```

**Step 2: Add failing derivative tests (central difference)**

Use a simple linear unwrapped series where the derivative is constant.

**Step 3: Run tests (expect FAIL)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

**Step 4: Implement helpers exactly per spec**

Implement:
- `wrap0To360Deg`,
- `wrapDeltaDeg180` (the “if Δ>180…” rule),
- `unwrapDeg180` (series algorithm),
- `centralDifferenceDegPerDay` with one-sided ends.

**Step 5: Run tests (expect PASS)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

---

### Task 4: Implement stationary-point refinement + retrograde intervals (unit tests first)

**Files:**
- Modify: `packages/physics/src/retrogradeMotionModel.test.ts`
- Modify: `packages/physics/src/retrogradeMotionModel.ts`

**Step 1: Add failing tests for refinement tolerance**

Use a synthetic function (or a tiny fixture series) where a derivative sign change bracket exists and confirm refinement returns a time in the bracket and bracket width shrinks below `1e-3`.

**Step 2: Add failing regression tests (Earth→Mars and Earth→Venus retrograde occurs)**

```ts
test("Earth->Mars has a retrograde interval (model expectation)", () => {
  const series = RetrogradeMotionModel.computeSeries({
    observer: "Earth",
    target: "Mars",
    windowStartDay: 0,
    windowMonths: 24
  });
  expect(series.stationaryDays.length).toBeGreaterThanOrEqual(2);
  expect(series.retrogradeIntervals.length).toBeGreaterThanOrEqual(1);
});

test("Earth->Venus has a retrograde interval (model expectation)", () => {
  const series = RetrogradeMotionModel.computeSeries({
    observer: "Earth",
    target: "Venus",
    windowStartDay: 0,
    windowMonths: 24
  });
  expect(series.retrogradeIntervals.length).toBeGreaterThanOrEqual(1);
});
```

**Step 3: Run tests (expect FAIL)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

**Step 4: Implement**

Implement in the model:
- fixed internal step `dtInternalDays = 0.25`,
- series generation on internal grid,
- derivative sign series (central difference),
- bracket detection for stationary points,
- refinement via bisection on a derivative function using central difference with `dtInternalDays`,
- retrograde intervals built from refined stationary points + derivative sign.

**Step 5: Run tests (expect PASS)**

Run: `corepack pnpm -C packages/physics test -- retrogradeMotionModel`

---

### Task 5: Export the model from `@cosmic/physics` and typecheck

**Files:**
- Modify: `packages/physics/src/index.ts`

**Step 1: Add export**

```ts
export { RetrogradeMotionModel } from "./retrogradeMotionModel";
```

**Step 2: Typecheck physics**

Run: `corepack pnpm -C packages/physics typecheck`

Expected: PASS.

---

### Task 6: Create the demo scaffold (`/play/retrograde-motion/` contract)

**Files:**
- Create: `apps/demos/src/demos/retrograde-motion/index.html`
- Create: `apps/demos/src/demos/retrograde-motion/style.css`
- Create: `apps/demos/src/demos/retrograde-motion/main.ts`

**Step 1: Add instrument DOM skeleton**

Must include:
- `#cp-demo` with accessible name
- `#copyResults` `<button type="button">`
- `#status` with `role="status" aria-live="polite" aria-atomic="true"`
- `.cp-demo__drawer`
- `data-shell="triad"`

**Step 2: Wire runtime + KaTeX init**

In `main.ts`, create `createInstrumentRuntime({ hasMathMode: false, storageKey, url })`, update `#status` via `setLiveRegionText`, and call `initMath(document)`.

**Step 3: Run build (expect still FAIL later until site metadata exists)**

Run: `corepack pnpm build`

Expected: May fail later due to missing site metadata / other gates; at minimum `validate-play-dirs` should see the new demo and enforce markers.

---

### Task 7: Add demo metadata entry (Astro content)

**Files:**
- Create: `apps/site/src/content/demos/retrograde-motion.md`

**Step 1: Create frontmatter matching `apps/site/src/content/config.ts`**

Include:
- `status: draft`
- `has_math_mode: false`
- `demo_path: "/play/retrograde-motion/"`
- `station_path: "/stations/retrograde-motion/"`
- `instructor_path: "/instructor/retrograde-motion/"`
- `last_updated: "2026-02-03"`

Ensure the **markdown body** uses **relative links** (no `](/...)`).

**Step 2: Run typecheck (workspace)**

Run: `corepack pnpm -r typecheck`

Expected: PASS.

---

### Task 8: Implement v1 UI (controls → compute → render) with spec labels

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`
- Modify: `apps/demos/src/demos/retrograde-motion/style.css`
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`

**Step 1: Controls**

Add controls in HTML:
- preset select (Earth→Mars default),
- observer select (Earth, Venus, Mars, Jupiter, Saturn),
- target select (Venus, Mars, Jupiter, Saturn),
- window length (months; 1 month = 30 model days),
- cursor time slider (model day),
- buttons: prev/next stationary, center on nearest retrograde,
- toggles: show other planets, show velocity arrows (optional).

All math in labels is LaTeX, e.g. `Apparent (sky) longitude $\\lambda_{\\mathrm{app}}$`.

**Step 2: Series compute**

On observer/target/window changes:
- call `RetrogradeMotionModel.computeSeries(...)`,
- store series (times, wrapped/unwrapped, derivative, intervals, stationary points),
- update plot + readouts.

On cursor-only changes:
- do **not** recompute entire series; snap cursor to the internal index and read derived values from cached arrays.

**Step 3: Plot rendering (SVG)**

Render:
- unwrapped curve,
- shaded+patterned retrograde bands with embedded “retrograde” label text,
- stationary point markers,
- cursor line,
- thin wrapped strip (0..360) below.

Make plot container focusable and implement keyboard stepping (left/right = ±1 day; shift+arrow = ±0.25 day).

**Step 4: Orbit view rendering (SVG)**

Render:
- Sun at center,
- observer and target ellipses,
- current positions,
- line of sight,
- inertial +x axis reference ray with “0 deg” label (ASCII, no unicode math symbols),
- optional velocity arrows (toggle).

**Step 5: Drawer model notes**

Include:
- required misconception sentence (exact wording from spec),
- no-calendar-claims note,
- glossary (observer/target/apparent longitude/stationary point),
- the defining equation for $\\lambda_{\\mathrm{app}}$ and the unwrap rule in LaTeX.

Call `initMath(document)` once at startup (and after any dynamic HTML injection if needed).

**Step 6: Run build + e2e (expect PASS)**

Run:
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

### Task 9: Implement export payload + update the e2e expectation (if needed)

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`
- Modify (if needed): `apps/site/tests/smoke.spec.ts`

**Step 1: ExportPayloadV1**

Use ordered rows with explicit units in the names (ASCII in export labels):
- Parameters: Observer, Target, Window start day, Window end day, Plot step (day), Internal step (day), Model type
- Readouts: Current day, Apparent (sky) longitude `lambda_app (deg)`, `d(lambda_tilde)/dt (deg/day)`, State, nearest stationary days, nearest retrograde bounds + duration
- Notes: assumptions (Keplerian 2D, coplanar, inertial +x axis, model time only) + misconception sentence (plain text)

**Step 2: Run e2e smoke (expect PASS)**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e tests/smoke.spec.ts`

---

## Final verification commands (run and record results)

- `corepack pnpm -C packages/physics test`
- `corepack pnpm -r typecheck`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

