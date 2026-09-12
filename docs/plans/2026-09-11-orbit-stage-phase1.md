# Orbit Stage, Phase 1 (visual system and shell) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (this session) or superpowers:executing-plans (separate session) to implement this plan task-by-task.

**Goal:** Give `conservation-laws` the approved look without WebGPU:
- the orbit shell (stage + glass instrument column + dock);
- the energy colour grammar;
- an energy bar where $K$ ends on a fixed $\varepsilon$ marker;
- an effective-potential plot with its equation;
- a drawer section that explains it.

All of it sits on the existing Aurora Ink theme.

**Architecture:**
- `@cosmic/physics` gains three effective-potential functions.
- `packages/theme` gains energy and glass tokens and a `data-shell="orbit"` grid.
- `logic.ts` gains pure layout helpers. The physics is injected, so tests need no physics import.
- `index.html`, `style.css` and `main.ts` are restructured into the three regions.
- The SVG top-down drawing stays as the stage. The WebGPU landscape is Phase 2.

**Tech Stack:** TypeScript, Vitest, Playwright, KaTeX (`initMath`), pnpm via corepack.

**Design:** `docs/plans/2026-09-11-orbit-stage-design.md`, the source of truth for every colour, label and behaviour. Read §2, §3, §4, §6 and §7 before starting.

---

## Working rules (read before Task 0)

- **Branch:** `claude/orbit-stage`, already created. Never commit to `main`. Never push; Anna approves pushes.
- **One agent at a time**, including reviewers.
- **Hooks block:**
  - `git add -A` / `git add .`
  - staging any `.gitignore` (leave the untracked `apps/site/.gitignore` alone)
  - `git commit -a`
  - `--no-verify`
  - a second concurrent Playwright run.

  Stage files by path.
- **Exit codes:** capture gate exit codes directly, `cmd > "$LOG" 2>&1; echo EXIT=$?`, never through a pipe.
- **Tests fail first:** a RED test must fail on an **assertion**. "No tests" or a load error is not RED.
- **Math:** every reader-visible symbol is KaTeX (`$...$` in HTML, rendered by `initMath(document)`). Canvas and SVG `<text>` get ASCII only; this plan uses DOM overlay labels instead.
- **Colours:** no hex or `rgba()` in demo CSS (`apps:no-color-literals`, and the contract tests at `design-contracts.test.ts:122-140`). Colours come from tokens.
- **Root font is 18px** (1rem = 18px). Probe computed values; don't assume them.
- **Physics review** (`physics-reviewer` agent) is mandatory before any push. It happens in Task 10.
- **Scratch logs** go to the session scratchpad, never the repo.

**Commands used throughout**

```bash
# logs go outside the repo: the session scratchpad if you have one, else a temp dir
export SCRATCH="${SCRATCH:-$(mktemp -d)}"
# physics
corepack pnpm -C packages/physics exec vitest run src/conservationLawsModel.test.ts
# theme
corepack pnpm -C packages/theme exec vitest run src/tokens.test.ts src/tokenContrast.test.ts src/orbitShell.test.ts
# demo unit + contracts
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws
# build (required before E2E: it copies demos into apps/site/public/play/)
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
# one E2E spec (never while another Playwright run is going)
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test tests/conservation-laws.spec.ts > "$SCRATCH/e2e.log" 2>&1; echo E2E_EXIT=$?
# every gate, in order, with exit codes
corepack pnpm gates > "$SCRATCH/gates.log" 2>&1; echo GATES_EXIT=$?
```

**Out of scope for Phase 1:**
- WebGPU/three.js, the 3D landscape, cameras and bloom (Phase 2);
- the phone bottom sheet, dragging and the time scrubber (Phase 3);
- station and instructor copy, challenges and the tour (Phase 4).

On phones, Phase 1 stacks: stage, then instrument, then dock, then drawer.

---

### Task 0: Baseline

**Files:** none.

**Step 1:** Confirm the branch and the tree.

```bash
git branch --show-current   # expect: claude/orbit-stage
git status -sb              # expect only: ?? apps/site/.gitignore
```

**Step 2:** Run the three unit suites and record the pass counts in the Execution log at the end of this file.

```bash
corepack pnpm -C packages/physics exec vitest run src/conservationLawsModel.test.ts
corepack pnpm -C packages/theme exec vitest run
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws
```

Expected: all pass. If anything fails, stop and report; don't fix unrelated failures here.

**Step 3:** The before-screenshots are the `9d446e4` captures in `output/playwright/conservation-laws/after/`. Note that in the log; there's nothing to capture.

---

### Task 1: Effective potential in `@cosmic/physics`

**Files:**
- Modify: `packages/physics/src/conservationLawsModel.ts`. Add three functions after `specificEnergyPartsAu2Yr2` (ends near line 257), and add them to the `ConservationLawsModel` object at the end of the file.
- Test: `packages/physics/src/conservationLawsModel.test.ts`, appending a `describe` block.

**Step 1: Write the failing tests.** Append:

```ts
describe("ConservationLawsModel effective potential", () => {
  const mu = 4 * Math.PI * Math.PI;
  const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1, Math.abs(b));

  it("at r = 1 AU with h = 2 pi AU^2/yr is -mu/r + h^2/(2 r^2) = -2 pi^2", () => {
    const u = ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 1, hAbsAu2Yr: 2 * Math.PI, muAu3Yr2: mu });
    expect(u).toBeCloseTo(-2 * Math.PI * Math.PI, 12);
  });

  it("with h = 0 is the Newtonian potential -mu/r", () => {
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 2.5, hAbsAu2Yr: 0, muAu3Yr2: mu })).toBeCloseTo(-mu / 2.5, 12);
  });

  it("is NaN for r <= 0, mu <= 0 or a non-finite h", () => {
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 0, hAbsAu2Yr: 1, muAu3Yr2: mu })).toBeNaN();
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 1, hAbsAu2Yr: 1, muAu3Yr2: 0 })).toBeNaN();
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 1, hAbsAu2Yr: Number.NaN, muAu3Yr2: mu })).toBeNaN();
  });

  // Asymmetric and not a preset: tilted outward, so the start is not a turning point.
  const o = ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1.3, speedFactor: 1.17, directionDeg: 17.76 });
  if (o.orbitType !== "elliptical") throw new Error(`expected an elliptical test orbit, got ${o.orbitType}`);
  const U = (rAu: number) =>
    ConservationLawsModel.effectivePotentialAu2Yr2({ rAu, hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });

  it("equals the specific energy at both turning points: U_eff(r_p) = U_eff(r_a) = eps", () => {
    expect(rel(U(o.rpAu), o.epsAu2Yr2)).toBeLessThan(1e-9);
    expect(rel(U(o.raAu), o.epsAu2Yr2)).toBeLessThan(1e-9);
  });

  it("has its minimum -mu^2/(2 h^2) at r_c = h^2/mu, with zero slope there", () => {
    const rc = ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
    expect(rel(rc, (o.hAbsAu2Yr * o.hAbsAu2Yr) / o.muAu3Yr2)).toBeLessThan(1e-12);
    expect(rel(U(rc), -(o.muAu3Yr2 * o.muAu3Yr2) / (2 * o.hAbsAu2Yr * o.hAbsAu2Yr))).toBeLessThan(1e-12);
    const d = 1e-5 * rc;
    expect(Math.abs((U(rc + d) - U(rc - d)) / (2 * d))).toBeLessThan(1e-6);
    expect(U(rc * 1.1)).toBeGreaterThan(U(rc));
    expect(U(rc * 0.9)).toBeGreaterThan(U(rc));
  });

  it("splits the energy along the orbit: v_r^2/2 + U_eff(r) = eps, and v_r^2/2 = (v^2 - (h/r)^2)/2", () => {
    for (let k = 0; k < 12; k++) {
      const nuRad = (2 * Math.PI * k) / 12 + 0.1;
      const pos = ConservationLawsModel.conicPositionAndTangentAu({ ecc: o.ecc, pAu: o.pAu, omegaRad: o.omegaRad, nuRad });
      if (!pos) throw new Error(`no position at nu = ${nuRad}`);
      const rAu = Math.hypot(pos.xAu, pos.yAu);
      const vAuYr = ConservationLawsModel.instantaneousSpeedAuPerYr({
        muAu3Yr2: o.muAu3Yr2,
        hAbsAu2Yr: o.hAbsAu2Yr,
        ecc: o.ecc,
        nuRad
      });
      const kr = ConservationLawsModel.radialKineticAu2Yr2({
        rAu,
        hAbsAu2Yr: o.hAbsAu2Yr,
        muAu3Yr2: o.muAu3Yr2,
        epsAu2Yr2: o.epsAu2Yr2
      });
      expect(rel(kr + U(rAu), o.epsAu2Yr2)).toBeLessThan(1e-9);
      const vt = o.hAbsAu2Yr / rAu;
      expect(Math.abs(kr - 0.5 * (vAuYr * vAuYr - vt * vt))).toBeLessThan(1e-9 * Math.abs(o.epsAu2Yr2));
    }
  });

  it("radial kinetic energy is 0 at a turning point and NaN clearly outside the allowed region", () => {
    const args = { hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2, epsAu2Yr2: o.epsAu2Yr2 };
    expect(ConservationLawsModel.radialKineticAu2Yr2({ ...args, rAu: o.rpAu })).toBeCloseTo(0, 9);
    expect(ConservationLawsModel.radialKineticAu2Yr2({ ...args, rAu: o.rpAu * 0.5 })).toBeNaN();
  });

  it("has no circular radius without angular momentum", () => {
    expect(ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: 0, muAu3Yr2: mu })).toBeNaN();
  });
});
```

**Step 2: Run it and confirm it fails on assertions.**

Run: `corepack pnpm -C packages/physics exec vitest run src/conservationLawsModel.test.ts`

Expected: the new tests FAIL with `TypeError: ConservationLawsModel.effectivePotentialAu2Yr2 is not a function`, and every older test still passes.

A TypeError raised inside `it` counts as a failed assertion run. It is not a load error, because the file loads.

**Step 3: Implement.** Insert after `specificEnergyPartsAu2Yr2`:

```ts
/**
 * Effective potential per unit mass, U_eff(r) = -mu/r + h^2/(2 r^2), AU^2/yr^2.
 * With |h| conserved, the tangential kinetic energy h^2/(2 r^2) depends on r alone, so it acts as a
 * potential (the centrifugal barrier) and eps = v_r^2/2 + U_eff(r). Motion is allowed where U_eff(r) <= eps.
 */
function effectivePotentialAu2Yr2(args: { rAu: number; hAbsAu2Yr: number; muAu3Yr2: number }): number {
  const { rAu, hAbsAu2Yr, muAu3Yr2 } = args;
  if (!(rAu > 0) || !(muAu3Yr2 > 0) || !Number.isFinite(hAbsAu2Yr)) return Number.NaN;
  return -muAu3Yr2 / rAu + (hAbsAu2Yr * hAbsAu2Yr) / (2 * rAu * rAu);
}

/** Radius of the circular orbit with this |h|, where U_eff is smallest: r_c = h^2/mu, AU. NaN without h. */
function circularOrbitRadiusAu(args: { hAbsAu2Yr: number; muAu3Yr2: number }): number {
  const { hAbsAu2Yr, muAu3Yr2 } = args;
  if (!(hAbsAu2Yr > 0) || !(muAu3Yr2 > 0)) return Number.NaN;
  return (hAbsAu2Yr * hAbsAu2Yr) / muAu3Yr2;
}

/**
 * Radial kinetic energy per unit mass, v_r^2/2 = eps - U_eff(r), AU^2/yr^2.
 * Round-off at a turning point reads as 0. A radius clearly outside the allowed region is NaN rather
 * than a clamped 0, so a caller that passes an impossible radius finds out.
 */
function radialKineticAu2Yr2(args: { rAu: number; hAbsAu2Yr: number; muAu3Yr2: number; epsAu2Yr2: number }): number {
  const uEff = effectivePotentialAu2Yr2(args);
  if (!Number.isFinite(uEff) || !Number.isFinite(args.epsAu2Yr2)) return Number.NaN;
  const d = args.epsAu2Yr2 - uEff;
  if (d < -1e-9 * Math.max(Math.abs(args.epsAu2Yr2), Math.abs(uEff))) return Number.NaN;
  return Math.max(0, d);
}
```

Add `effectivePotentialAu2Yr2`, `circularOrbitRadiusAu` and `radialKineticAu2Yr2` to the `ConservationLawsModel` object, after `specificEnergyPartsAu2Yr2`.

**Step 4: Run the tests and confirm they pass.** Same command. Expected: all pass.

**Step 5: Typecheck and commit.**

```bash
corepack pnpm -C packages/physics typecheck > "$SCRATCH/tsc.log" 2>&1; echo TSC_EXIT=$?
git add packages/physics/src/conservationLawsModel.ts packages/physics/src/conservationLawsModel.test.ts
git commit -m "Add the effective potential, circular radius and radial kinetic energy to the conservation-laws model

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Energy and glass tokens

**Files:**
- Modify: `packages/theme/styles/tokens.css`, adding a block after the Celestial Object Palette (ends at `--cp-celestial-orbit`, line 111).
- Modify: `packages/theme/styles/layer-instrument.css`, in the "Instrument surface tokens" block (lines 25-29).
- Test: `packages/theme/src/tokens.test.ts` and `packages/theme/src/tokenContrast.test.ts`.

**Step 1: Write the failing tests.**

In `tokens.test.ts`, inside `describe("Design tokens", ...)`:

```ts
  describe("Energy semantics", () => {
    it.each([
      ["--cp-energy-kinetic", "--cp-celestial-sun"],
      ["--cp-energy-potential", "--cp-violet"],
      ["--cp-energy-total", "--cp-text"]
    ])("%s aliases %s", (token, target) => {
      expect(css).toMatch(new RegExp(`${token}:\\s*var\\(${target}\\)`));
    });
  });
```

In `tokenContrast.test.ts`, inside `describe("instrument layer", ...)`, after the `--cp-muted stays visibly subordinate` test:

```ts
    /*
     * Glass (orbit shell). The panel is 38% transparent, so its real ground is whatever the stage
     * paints behind it. The brightest thing Phase 1 paints there is the violet tint over ink. Phase 2
     * adds bloom and must extend this ground.
     */
    it.each([
      ["--cp-text", 4.5],
      ["--cp-muted", 4.5],
      ["--cp-accent-amber", 4.5],
      ["--cp-accent-ice", 4.5],
      ["--cp-energy-kinetic", 4.5],
      ["--cp-energy-potential", 4.5],
      ["--cp-energy-total", 4.5]
    ])("%s on the glass ground meets %s:1", (token, min) => {
      for (const t of ["--cp-instr-glass-bg", "--cp-tint-violet", token as string]) {
        expect(instrument.has(t), `${t} is defined`).toBe(true);
      }
      const ink = resolve(instrument.get("--cp-bg0") as string, instrument, { r: 0, g: 0, b: 0 });
      const sky = resolve(instrument.get("--cp-tint-violet") as string, instrument, ink);
      const glass = resolve(instrument.get("--cp-instr-glass-bg") as string, instrument, sky);
      const fg = resolve(instrument.get(token as string) as string, instrument, glass);
      expect(ratio(fg, glass)).toBeGreaterThanOrEqual(min as number);
    });
```

**Step 2: Run and confirm RED.**

Run: `corepack pnpm -C packages/theme exec vitest run src/tokens.test.ts src/tokenContrast.test.ts`

Expected FAIL:
- the three "aliases" tests (no match);
- the seven glass tests on `--cp-instr-glass-bg is defined`.

The `instrument.has` assertion runs first, so the failure is an assertion, not a throw.

**Step 3: Implement.**

`tokens.css`, after `--cp-celestial-orbit: var(--cp-violet);`:

```css

  /* ---------- Energy semantics (orbit instruments) ----------
   * One meaning per colour, shared by the drawing, the energy bar and the effective-potential plot.
   * Warm kinetic against cool potential sits on the blue-yellow axis, which survives the common
   * red-green deficiencies. The conserved total is neutral: the one quantity that does not change
   * colour. Design: docs/plans/2026-09-11-orbit-stage-design.md section 3.3. */
  --cp-energy-kinetic: var(--cp-celestial-sun);
  --cp-energy-potential: var(--cp-violet);
  --cp-energy-total: var(--cp-text);
```

`layer-instrument.css`, inside the surface-token block after `--cp-instr-panel-border`:

```css

  /* Glass for the orbit shell: more of the sky shows through than --cp-instr-panel-bg lets, so
     text contrast is tested on the composited ground in tokenContrast.test.ts. */
  --cp-instr-glass-bg: color-mix(in srgb, var(--cp-bg1) 62%, transparent);
  --cp-instr-glass-blur: 16px;
  --cp-instr-glass-edge: inset 0 1px 0 color-mix(in srgb, var(--cp-text) 6%, transparent);
```

**Step 4: Run and confirm GREEN.** Same command. Expected: all pass.

If a glass contrast test fails, raise the 62% (for example to 72%) and re-run. Do not lower a text token, and record the measured ratio in the Execution log.

**Step 5: Check that the build invariants accept the new tokens** (the undefined-token rule in `scripts/validate-invariants.mjs`), then commit.

```bash
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
git add packages/theme/styles/tokens.css packages/theme/styles/layer-instrument.css packages/theme/src/tokens.test.ts packages/theme/src/tokenContrast.test.ts
git commit -m "Add energy semantic tokens and orbit-shell glass tokens, with contrast on the composited glass ground

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: The orbit shell grid and glass panels

**Files:**
- Modify: `packages/theme/styles/demo-shell.css`. Append after the existing `@media (max-width: 1024px)` block at the end of the file. The orbit rules must come **after** it; see the specificity note.
- Modify: `packages/theme/styles/layer-instrument.css`, appended at the end.
- Create: `packages/theme/src/orbitShell.test.ts`.

**Specificity note:** `.cp-demo[data-shell="orbit"]` (0,2,0) beats the generic mobile rule `.cp-demo` (0,1,0) at every width. So the orbit shell needs its own mobile block, or phones would get the two-column desktop grid. Glass is `.cp-layer-instrument[data-shell="orbit"] .cp-panel` (0,3,0), which beats `.cp-layer-instrument .cp-panel` (0,2,0) regardless of order.

**Step 1: Write the failing test.** Create `packages/theme/src/orbitShell.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const STYLES = join(import.meta.dirname, "..", "styles");
const shell = readFileSync(join(STYLES, "demo-shell.css"), "utf8");
const instrument = readFileSync(join(STYLES, "layer-instrument.css"), "utf8");

/** Declarations of the first rule written exactly as `selector {`, searching from `from`. "" if absent. */
function ruleBody(css: string, selector: string, from = 0): string {
  const at = css.indexOf(`${selector} {`, from);
  if (at < 0) return "";
  const open = css.indexOf("{", at);
  return css.slice(open + 1, css.indexOf("}", open));
}

describe("orbit shell (design section 4)", () => {
  it("puts the stage and dock in the left column and the instrument on the right", () => {
    const body = ruleBody(shell, '.cp-demo[data-shell="orbit"]');
    expect(body).toMatch(/"viz\s+readouts"/);
    expect(body).toMatch(/"sidebar\s+readouts"/);
    expect(body).toMatch(/"shelf\s+shelf"/);
    expect(body).toContain("minmax(0, 1fr)");
  });

  it("stacks stage, instrument, dock and drawer at 1024px and below, after the generic mobile rule", () => {
    const generic = shell.indexOf("@media (max-width: 1024px)");
    const orbitMobile = shell.indexOf("@media (max-width: 1024px)", generic + 1);
    expect(orbitMobile).toBeGreaterThan(generic);
    expect(ruleBody(shell, '.cp-demo[data-shell="orbit"]', orbitMobile)).toMatch(/"viz"\s+"readouts"\s+"sidebar"\s+"shelf"/);
  });

  it("stops the dock from being a sticky, height-capped sidebar", () => {
    const body = ruleBody(shell, '.cp-demo[data-shell="orbit"] .cp-demo__controls');
    expect(body).toContain("position: relative");
    expect(body).toContain("max-height: none");
  });

  it("paints glass panels from tokens only", () => {
    const body = ruleBody(instrument, '.cp-layer-instrument[data-shell="orbit"] .cp-panel');
    expect(body).toContain("var(--cp-instr-glass-bg)");
    expect(body).toContain("blur(var(--cp-instr-glass-blur))");
    expect(body).toContain("-webkit-backdrop-filter: blur(var(--cp-instr-glass-blur))");
    expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it("sets panel headers and readout labels in sentence case", () => {
    expect(ruleBody(instrument, '.cp-layer-instrument[data-shell="orbit"] .cp-panel-header')).toContain("text-transform: none");
    expect(ruleBody(instrument, '.cp-layer-instrument[data-shell="orbit"] .cp-readout__label')).toContain("text-transform: none");
  });
});
```

**Step 2: Run and confirm RED.**

Run: `corepack pnpm -C packages/theme exec vitest run src/orbitShell.test.ts`

Expected: 5 FAIL. Every `ruleBody` returns "", so the `toMatch`/`toContain` assertions fail. The "tokens only" test fails on `toContain`.

**Step 3: Implement.** Append to `demo-shell.css`:

```css

/* ============================================
   Orbit shell: stage + instrument + dock
   ============================================
   The stage is the hero; the readouts become a glass instrument column on the
   right; the controls become a dock under the stage. Same four regions and
   ARIA as every demo, with only the grid areas moved. Written after the generic
   mobile block on purpose: .cp-demo[data-shell="orbit"] outranks .cp-demo, so
   it needs its own stacked layout below.
   Design: docs/plans/2026-09-11-orbit-stage-design.md section 4.
   ============================================ */
.cp-demo[data-shell="orbit"] {
  grid-template-columns: minmax(0, 1fr) clamp(300px, 24vw, 380px);
  grid-template-rows: minmax(0, 1fr) auto auto;
  grid-template-areas:
    "viz      readouts"
    "sidebar  readouts"
    "shelf    shelf";
}

.cp-demo[data-shell="orbit"] .cp-demo__controls {
  position: relative;
  top: auto;
  max-height: none;
  overflow: visible;
}

.cp-demo[data-shell="orbit"] .cp-demo__readouts {
  align-self: start;
  position: sticky;
  top: var(--cp-space-4);
  z-index: 3;
}

.cp-demo[data-shell="orbit"] .cp-demo__stage {
  min-height: 0;
}

@media (max-width: 1024px) { /* --cp-bp-lg */
  .cp-demo[data-shell="orbit"] {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas:
      "viz"
      "readouts"
      "sidebar"
      "shelf";
  }

  .cp-demo[data-shell="orbit"] .cp-demo__readouts {
    position: static;
  }
}
```

Append to `layer-instrument.css`:

```css

/* --- Orbit shell: glass instrument surfaces (design section 3.2) --- */
.cp-layer-instrument[data-shell="orbit"] .cp-panel {
  background: var(--cp-instr-glass-bg);
  border-color: color-mix(in srgb, var(--cp-text) 10%, transparent);
  border-radius: var(--cp-r-2);
  box-shadow: var(--cp-instr-glass-edge), var(--cp-shadow-2);
  backdrop-filter: blur(var(--cp-instr-glass-blur));
  -webkit-backdrop-filter: blur(var(--cp-instr-glass-blur));
}

.cp-layer-instrument[data-shell="orbit"] .cp-panel-header {
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--cp-font-display);
  font-size: 1rem;
  color: var(--cp-text2);
}

.cp-layer-instrument[data-shell="orbit"] .cp-readout {
  background: none;
  padding: 0;
}

.cp-layer-instrument[data-shell="orbit"] .cp-readout__label {
  text-transform: none;
  letter-spacing: 0;
}
```

**Step 4: Run and confirm GREEN.** Run `src/orbitShell.test.ts` and then the full theme suite (`corepack pnpm -C packages/theme exec vitest run`). Expected: all pass.

**Step 5: Commit.**

```bash
git add packages/theme/styles/demo-shell.css packages/theme/styles/layer-instrument.css packages/theme/src/orbitShell.test.ts
git commit -m "Add the orbit shell grid (stage, instrument, dock) and glass instrument panels

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

No demo uses `data-shell="orbit"` yet, so nothing renders differently until Task 5.

---

### Task 4: Pure layout helpers for the energy instrument

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/logic.ts`. Append a section at the end, and reuse the existing `clamp` and `formatNumber`.
- Test: `apps/demos/src/demos/conservation-laws/logic.test.ts`. Add the three names to the import list at the top and append `describe` blocks.

`logic.ts` imports no physics; its header says so. $U_{\rm eff}$ is therefore **injected** as a callback, the same dependency-injection pattern other demos use (`formatWavelengthCm(cmToNm)`).

**Step 1: Write the failing tests.** Append:

```ts
describe("energyBarLayout", () => {
  // One bound orbit seen at two points: near periapsis (K large) and far out (K small).
  const base = { epsAu2Yr2: -11.05, uDeepestAu2Yr2: -39.48, widthPx: 300 };
  const near = energyBarLayout({ ...base, kAu2Yr2: 28.43, uAu2Yr2: -39.48 });
  const far = energyBarLayout({ ...base, kAu2Yr2: 4.66, uAu2Yr2: -15.71 });
  if (!near || !far) throw new Error("expected layouts");

  it("keeps the total-energy marker still while K and U trade length", () => {
    expect(near.epsPx).toBe(far.epsPx);
    expect(near.kBar.widthPx).toBeGreaterThan(far.kBar.widthPx);
    expect(near.uBar.widthPx).toBeGreaterThan(far.uBar.widthPx);
  });

  it("ends U at zero, starts K where U ends, and ends K on the marker", () => {
    for (const b of [near, far]) {
      expect(b.uBar.xPx + b.uBar.widthPx).toBeCloseTo(b.zeroPx, 9);
      expect(b.kBar.xPx).toBe(b.uBar.xPx);
      expect(b.kBar.xPx + b.kBar.widthPx).toBeCloseTo(b.epsPx, 9);
    }
  });

  it("puts zero and eps at known pixels: scale from 1.06 x -39.48 to 0 + 0.2 x 39.48", () => {
    // lo = -41.8488, hi = 7.896, span = 49.7448
    expect(near.zeroPx).toBeCloseTo((41.8488 / 49.7448) * 300, 6);
    expect(near.epsPx).toBeCloseTo(((-11.05 + 41.8488) / 49.7448) * 300, 6);
  });

  it("fits an unbound orbit, with eps > 0 right of zero and inside the track", () => {
    const b = energyBarLayout({ kAu2Yr2: 60, uAu2Yr2: -39.48, epsAu2Yr2: 20.52, uDeepestAu2Yr2: -39.48, widthPx: 300 });
    if (!b) throw new Error("expected a layout");
    expect(b.epsPx).toBeGreaterThan(b.zeroPx);
    expect(b.epsPx).toBeLessThanOrEqual(300);
  });

  it("returns null without a finite negative deepest potential or a width", () => {
    expect(energyBarLayout({ ...base, kAu2Yr2: 1, uAu2Yr2: -1, uDeepestAu2Yr2: Number.NEGATIVE_INFINITY })).toBeNull();
    expect(energyBarLayout({ ...base, kAu2Yr2: 1, uAu2Yr2: -1, widthPx: 0 })).toBeNull();
  });
});

describe("effectivePotentialPlot", () => {
  // Toy units with a closed form: mu = 2, h = 1, so U_eff = -2/r + 1/(2 r^2), minimum -2 at r_c = 0.5.
  // eps = -1.5 gives -1.5 r^2 + 2 r - 0.5 = 0, i.e. turning points r_p = 1/3 and r_a = 1.
  const uEff = (r: number) => -2 / r + 1 / (2 * r * r);
  const args = { uEff, epsAu2Yr2: -1.5, uEffMinAu2Yr2: -2, rpAu: 1 / 3, raAu: 1, rMaxAu: 2, widthPx: 300, heightPx: 150 };
  const plot = effectivePotentialPlot(args);
  if (!plot) throw new Error("expected a plot");
  // rMin = 0.55 / 3; energy from 1.12 x -2 = -2.24 up to 0 + 0.45 x 2 = 0.9.
  const rMin = 0.55 / 3;

  it("maps r and energy to known pixels", () => {
    expect(plot.rpXPx).toBeCloseTo(((1 / 3 - rMin) / (2 - rMin)) * 300, 9);
    expect(plot.raXPx ?? Number.NaN).toBeCloseTo(((1 - rMin) / (2 - rMin)) * 300, 9);
    expect(plot.zeroYPx).toBeCloseTo((0.9 / 3.14) * 150, 9);
    expect(plot.epsYPx).toBeCloseTo((2.4 / 3.14) * 150, 9);
  });

  it("puts both turning points on the energy line", () => {
    expect(plot.yPx(uEff(1 / 3))).toBeCloseTo(plot.epsYPx, 6);
    expect(plot.yPx(uEff(1))).toBeCloseTo(plot.epsYPx, 6);
  });

  it("keeps the minimum inside the plot and clamps the centrifugal barrier to the top edge", () => {
    expect(plot.yPx(-2)).toBeLessThan(150);
    expect(plot.yPx(uEff(rMin))).toBe(0);
  });

  it("draws the curve with samples + 1 points and closes the allowed region", () => {
    expect(plot.curveD.startsWith("M 0.00 ")).toBe(true);
    expect(plot.curveD.split(" L ").length).toBe(121);
    expect(plot.allowedD.endsWith("Z")).toBe(true);
    expect(plot.curveD).not.toContain("NaN");
  });

  it("has no outer turning point for an open orbit, and the allowed region runs to the edge", () => {
    const open = effectivePotentialPlot({ ...args, epsAu2Yr2: 0.5, raAu: Number.POSITIVE_INFINITY });
    if (!open) throw new Error("expected a plot");
    expect(open.raXPx).toBeNull();
    expect(open.allowedD).toContain(`L ${(300).toFixed(2)} ${open.epsYPx.toFixed(2)} Z`);
  });

  it("returns null for radial motion or a degenerate window", () => {
    expect(effectivePotentialPlot({ ...args, rpAu: 0 })).toBeNull();
    expect(effectivePotentialPlot({ ...args, rMaxAu: 0.2 })).toBeNull();
    expect(effectivePotentialPlot({ ...args, heightPx: 0 })).toBeNull();
  });
});

describe("turningPointsText", () => {
  it("names both turning points of a bound orbit", () => {
    expect(turningPointsText({ orbitType: "elliptical", rpAu: 1.1015, raAu: 3.0183 })).toBe("Turns around at 1.10 AU and 3.02 AU.");
  });
  it("names the one turning point of an open orbit", () => {
    expect(turningPointsText({ orbitType: "hyperbolic", rpAu: 1, raAu: Number.POSITIVE_INFINITY })).toBe(
      "Turns around once, at 1.00 AU, and does not come back."
    );
  });
  it("describes a circular orbit as touching the bottom of the curve", () => {
    expect(turningPointsText({ orbitType: "circular", rpAu: 1, raAu: 1 })).toBe(
      "Circular: the energy line touches the bottom of the curve at 1.00 AU."
    );
  });
  it("explains radial motion", () => {
    expect(turningPointsText({ orbitType: "radial", rpAu: 0, raAu: 1.2 })).toBe(
      "No angular momentum, so there is no barrier: the body falls straight in."
    );
  });
});
```

Add `energyBarLayout, effectivePotentialPlot, turningPointsText` to the import from `./logic` at the top of the test file.

**Step 2: Run and confirm RED.**

Run: `corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws/logic.test.ts`

Expected: the new tests FAIL with `energyBarLayout is not a function` (or equivalent), and the 117 existing tests pass.

**Check first:** the toy numbers assume `formatNumber(x, 2)` is `x.toFixed(2)` for non-zero x. Read `formatNumber` (logic.ts line 44). If it trims zeros, fix the expected strings in the `turningPointsText` tests before continuing.

**Step 3: Implement.** Append to `logic.ts`:

```ts
// ---------------------------------------------------------------------------
// Energy instrument (orbit-stage design, sections 6 and 7)
// ---------------------------------------------------------------------------

export type EnergyBar = {
  /** x of U = 0, px from the track's left edge. */
  zeroPx: number;
  /** x of the total-energy marker; fixed for a given orbit. */
  epsPx: number;
  /** U runs from U up to 0. */
  uBar: { xPx: number; widthPx: number };
  /** K starts where U ends and runs to U + K, which is eps. */
  kBar: { xPx: number; widthPx: number };
};

/**
 * Two stacked bars on one scale that is fixed per orbit. U runs from 0 down to U; K starts where U ends, so its far
 * end lands on eps, which stays still while the body moves. The scale runs from 6% past the deepest U on the orbit
 * (-mu/r_p) to max(eps, 0) plus a fifth of that depth, so an unbound eps > 0 still fits.
 * Null when there is no finite deepest potential (radial infall reaches r = 0) or no width to draw in.
 */
export function energyBarLayout(args: {
  kAu2Yr2: number;
  uAu2Yr2: number;
  epsAu2Yr2: number;
  uDeepestAu2Yr2: number;
  widthPx: number;
}): EnergyBar | null {
  const { kAu2Yr2, uAu2Yr2, epsAu2Yr2, uDeepestAu2Yr2, widthPx } = args;
  if (![kAu2Yr2, uAu2Yr2, epsAu2Yr2, uDeepestAu2Yr2, widthPx].every(Number.isFinite)) return null;
  if (!(uDeepestAu2Yr2 < 0) || !(widthPx > 0)) return null;
  const lo = uDeepestAu2Yr2 * 1.06;
  const hi = Math.max(epsAu2Yr2, 0) - uDeepestAu2Yr2 * 0.2;
  const x = (v: number) => ((v - lo) / (hi - lo)) * widthPx;
  const zeroPx = x(0);
  const uPx = x(uAu2Yr2);
  return {
    zeroPx,
    epsPx: x(epsAu2Yr2),
    uBar: { xPx: uPx, widthPx: zeroPx - uPx },
    kBar: { xPx: uPx, widthPx: x(uAu2Yr2 + kAu2Yr2) - uPx }
  };
}

export type EffectivePotentialPlot = {
  /** SVG path of U_eff(r) across the plot. */
  curveD: string;
  /** Closed SVG path between the energy line and the curve, from r_p to r_a (or to the plot edge). */
  allowedD: string;
  epsYPx: number;
  zeroYPx: number;
  rpXPx: number;
  /** Null for an open orbit, or when r_a is beyond the plot. */
  raXPx: number | null;
  xPx: (rAu: number) => number;
  yPx: (eAu2Yr2: number) => number;
};

/**
 * U_eff(r) in plot pixels, y down. `uEff` is injected so this file stays free of physics imports.
 * r runs from 0.55 r_p to rMaxAu. Energy runs from 12% below the minimum U_eff (-mu^2/(2 h^2)) up to max(eps, 0)
 * plus 45% of that depth; the centrifugal barrier above the top is clamped to the top edge.
 */
export function effectivePotentialPlot(args: {
  uEff: (rAu: number) => number;
  epsAu2Yr2: number;
  uEffMinAu2Yr2: number;
  rpAu: number;
  raAu: number;
  rMaxAu: number;
  widthPx: number;
  heightPx: number;
  samples?: number;
}): EffectivePotentialPlot | null {
  const { uEff, epsAu2Yr2, uEffMinAu2Yr2, rpAu, raAu, rMaxAu, widthPx, heightPx, samples = 120 } = args;
  if (!(rpAu > 0) || !(rMaxAu > rpAu) || !(uEffMinAu2Yr2 < 0) || !Number.isFinite(epsAu2Yr2)) return null;
  if (!(widthPx > 0) || !(heightPx > 0)) return null;
  const rMin = 0.55 * rpAu;
  const eLo = 1.12 * uEffMinAu2Yr2;
  const eHi = Math.max(epsAu2Yr2, 0) - 0.45 * uEffMinAu2Yr2;
  const xPx = (rAu: number) => ((rAu - rMin) / (rMaxAu - rMin)) * widthPx;
  const yPx = (e: number) => ((eHi - clamp(e, eLo, eHi)) / (eHi - eLo)) * heightPx;
  const pt = (rAu: number, e: number) => `${xPx(rAu).toFixed(2)} ${yPx(e).toFixed(2)}`;

  const curve: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const r = rMin + ((rMaxAu - rMin) * i) / samples;
    curve.push(`${i === 0 ? "M" : "L"} ${pt(r, uEff(r))}`);
  }

  const rEnd = Number.isFinite(raAu) ? Math.min(raAu, rMaxAu) : rMaxAu;
  const allowed: string[] = [`M ${pt(rpAu, epsAu2Yr2)}`];
  for (let i = 0; i <= samples; i++) {
    const r = rpAu + ((rEnd - rpAu) * i) / samples;
    allowed.push(`L ${pt(r, uEff(r))}`);
  }
  allowed.push(`L ${pt(rEnd, epsAu2Yr2)} Z`);

  return {
    curveD: curve.join(" "),
    allowedD: allowed.join(" "),
    epsYPx: yPx(epsAu2Yr2),
    zeroYPx: yPx(0),
    rpXPx: xPx(rpAu),
    raXPx: Number.isFinite(raAu) && raAu <= rMaxAu ? xPx(raAu) : null,
    xPx,
    yPx
  };
}

/** The turning points in words, for the plot's accessible name and the caption under it. */
export function turningPointsText(args: { orbitType: string; rpAu: number; raAu: number }): string {
  const { orbitType, rpAu, raAu } = args;
  if (orbitType === "radial" || !(rpAu > 0)) return "No angular momentum, so there is no barrier: the body falls straight in.";
  if (orbitType === "circular") return `Circular: the energy line touches the bottom of the curve at ${formatNumber(rpAu, 2)} AU.`;
  if (Number.isFinite(raAu)) return `Turns around at ${formatNumber(rpAu, 2)} AU and ${formatNumber(raAu, 2)} AU.`;
  return `Turns around once, at ${formatNumber(rpAu, 2)} AU, and does not come back.`;
}
```

Check the one subtle case: the open-orbit test expects the allowed region's last `L` to be at `x = 300.00`, the plot edge, because `rEnd = rMaxAu` maps to `widthPx`.

**Step 4: Run and confirm GREEN.** Same command. Expected: all pass. Then run `corepack pnpm -C apps/demos typecheck`.

**Step 5: Commit.**

```bash
git add apps/demos/src/demos/conservation-laws/logic.ts apps/demos/src/demos/conservation-laws/logic.test.ts
git commit -m "Add energy-bar, effective-potential plot and turning-point helpers to conservation-laws logic

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Markup for the orbit shell, energy instrument and the effective-potential explanation

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/index.html`, the whole `#cp-demo` element.
- Test: `apps/demos/src/demos/conservation-laws/design-contracts.test.ts`, appending a `describe` inside the top-level one.

**Step 1: Write the failing contract tests.** Append inside `describe("Conservation Laws -- Design System Contracts", ...)`:

```ts
  describe("Orbit shell and energy instrument (orbit-stage design, Phase 1)", () => {
    it("uses the orbit shell", () => {
      expect(html).toContain('data-shell="orbit"');
      expect(html).not.toContain('data-shell="triad"');
    });

    it("keeps the four regions and their accessible names", () => {
      for (const cls of ["cp-demo__controls", "cp-demo__stage", "cp-demo__readouts", "cp-demo__drawer"]) {
        expect(html).toContain(cls);
      }
      expect(html).toContain('aria-label="Controls panel"');
      expect(html).toContain('aria-label="Readouts panel"');
    });

    it("has an energy bar: U and K fills, a zero line and a total-energy marker", () => {
      for (const id of ["energyBar", "energyBarU", "energyBarK", "energyBarZero", "energyBarEps"]) {
        expect(html).toContain(`id="${id}"`);
      }
    });

    it("tags the K, U and eps readouts with their energy meaning", () => {
      expect(html).toMatch(/data-energy="kinetic"[\s\S]*?id="kAu"/);
      expect(html).toMatch(/data-energy="potential"[\s\S]*?id="uAu"/);
      expect(html).toMatch(/data-energy="total"[\s\S]*?id="eps"/);
    });

    it("typesets the effective-potential equation in the instrument", () => {
      expect(html).toContain("U_{\\rm eff}(r) = -\\frac{\\mu}{r} + \\frac{h^2}{2r^2}");
    });

    it("has the effective-potential plot parts and KaTeX turning-point labels", () => {
      for (const id of ["ueffPlot", "ueffCurve", "ueffAllowed", "ueffZero", "ueffEps", "ueffDrop", "ueffDot", "ueffRpLabel", "ueffRaLabel", "ueffCaption"]) {
        expect(html).toContain(`id="${id}"`);
      }
      expect(html).toMatch(/id="ueffRpLabel"[^>]*>\$r_p\$</);
      expect(html).toMatch(/id="ueffRaLabel"[^>]*>\$r_a\$</);
    });

    it("explains the effective potential in the drawer", () => {
      expect(html).toContain("Why an effective potential?");
      expect(html).toContain("v^2 = v_r^2 + v_t^2");
      expect(html).toContain("r_c = h^2/\\mu");
      expect(html).toContain("centrifugal barrier");
    });

    it("moves the orbit type into the stage header as a chip", () => {
      expect(html).toMatch(/class="stage__chip"[\s\S]*?id="orbitType"/);
    });
  });

  describe("Orbit shell styling (orbit-stage design, Phase 1)", () => {
    it("colours energy by meaning, from the energy tokens", () => {
      expect(css).toContain("var(--cp-energy-kinetic)");
      expect(css).toContain("var(--cp-energy-potential)");
      expect(css).toContain("var(--cp-energy-total)");
    });

    it("drops the boxed stage: no border, radius or gradient on the orbit drawing", () => {
      const orbitRule = /\.orbit\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
      expect(orbitRule).not.toMatch(/border|radial-gradient/);
    });
  });
```

The "boxed stage" test is in this task on purpose. It stays RED until Task 6, which is fine: commit Task 5 with that test marked `it.todo`, then switch it back to `it` in Task 6 Step 1. Do the same for "colours energy by meaning".

**Step 2: Run and confirm RED.**

Run: `corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws/design-contracts.test.ts`

Expected: the eight markup tests FAIL on `toContain`/`toMatch`, and the two styling tests show as todo.

**Step 3: Implement.** Replace the `<div id="cp-demo" ...> ... </div>` element in `index.html` with the markup below.

- Every id `main.ts` looks up with `must()` is kept.
- The presets and the orbit type move to the stage header.
- The utility toolbar and status move into the dock.
- Only one `.cp-panel-header` remains, in the instrument.

```html
    <div
      id="cp-demo"
      role="main"
      class="cp-layer-instrument cp-demo"
      data-shell="orbit"
      aria-label="Conservation Laws instrument"
    >
      <h1 class="sr-only">Conservation Laws: Energy &amp; Momentum</h1>

      <section class="cp-demo__stage cp-stage stage" aria-label="Orbit visualization stage">
        <canvas class="cp-starfield" aria-hidden="true"></canvas>
        <div class="stage__head">
          <p class="stage__title">Energy and angular momentum</p>
          <span class="stage__chip"><span class="sr-only">Orbit type: </span><span id="orbitType"></span></span>
          <div class="presets">
            <div class="cp-chip-group--grid presets__row" role="group" aria-label="Orbit presets">
              <button class="cp-chip preset" data-preset="circular" type="button" aria-pressed="false">Circular</button>
              <button class="cp-chip preset" data-preset="elliptical" type="button" aria-pressed="false">Elliptical</button>
              <button class="cp-chip preset" data-preset="escape" type="button" aria-pressed="false">Escape</button>
              <button class="cp-chip preset" data-preset="hyperbolic" type="button" aria-pressed="false">Hyperbolic</button>
            </div>
          </div>
        </div>

        <!-- KEEP the existing <svg id="orbitSvg" ...> ... </svg> element here unchanged (defs, centralMass, orbitPath,
             orbitTrail, particle, velocityLine). -->

        <!-- KEEP the existing <p id="stageCaption" class="stage__caption"> ... </p> element here unchanged. -->
      </section>

      <aside class="cp-demo__readouts cp-panel instrument" aria-label="Readouts panel">
        <div class="cp-panel-header">Readouts</div>
        <div class="cp-panel-body">
          <section class="instrument__section" aria-labelledby="energyTitle">
            <p id="energyTitle" class="instrument__title">
              Energy per unit mass <span class="instrument__unit">AU$^2$/yr$^2$</span>
            </p>
            <div class="energy-bar">
              <div class="energy-bar__labels" aria-hidden="true">
                <span class="energy-bar__label energy-bar__label--u">$U$</span>
                <span class="energy-bar__label energy-bar__label--k">$K$</span>
              </div>
              <div
                id="energyBar"
                class="energy-bar__tracks"
                role="img"
                aria-label="Energy bar: the potential energy U and the kinetic energy K add up to the fixed total energy."
              >
                <span id="energyBarU" class="energy-bar__fill energy-bar__fill--u"></span>
                <span id="energyBarK" class="energy-bar__fill energy-bar__fill--k"></span>
                <span id="energyBarZero" class="energy-bar__marker energy-bar__marker--zero"
                  ><span class="energy-bar__tick">0</span></span
                >
                <span id="energyBarEps" class="energy-bar__marker energy-bar__marker--eps"
                  ><span class="energy-bar__tick">$\varepsilon$</span></span
                >
              </div>
            </div>
            <div class="instrument__energy-values">
              <div class="cp-readout" data-energy="kinetic">
                <div class="cp-readout__label">Kinetic ${K = v^2/2}$</div>
                <div class="cp-readout__value"><span id="kAu"></span> <span class="cp-readout__unit">AU$^2$/yr$^2$</span></div>
              </div>
              <div class="cp-readout" data-energy="potential">
                <div class="cp-readout__label">Potential ${U = -\mu/r}$</div>
                <div class="cp-readout__value"><span id="uAu"></span> <span class="cp-readout__unit">AU$^2$/yr$^2$</span></div>
              </div>
              <div class="cp-readout" data-energy="total">
                <div class="cp-readout__label">Total ${\varepsilon = K + U}$</div>
                <div class="cp-readout__value"><span id="eps"></span> <span class="cp-readout__unit">AU$^2$/yr$^2$</span></div>
              </div>
            </div>
          </section>

          <section class="instrument__section" aria-labelledby="ueffTitle">
            <p id="ueffTitle" class="instrument__title">Effective potential</p>
            <p class="instrument__equation">$U_{\rm eff}(r) = -\frac{\mu}{r} + \frac{h^2}{2r^2}$</p>
            <div class="ueff">
              <svg id="ueffPlot" class="ueff__plot" role="img" aria-label="Effective potential against distance.">
                <path id="ueffAllowed" class="ueff__allowed" d=""></path>
                <line id="ueffZero" class="ueff__zero" x1="0" y1="0" x2="0" y2="0"></line>
                <path id="ueffCurve" class="ueff__curve" d=""></path>
                <line id="ueffEps" class="ueff__eps" x1="0" y1="0" x2="0" y2="0"></line>
                <line id="ueffDrop" class="ueff__drop" x1="0" y1="0" x2="0" y2="0"></line>
                <circle id="ueffDot" class="ueff__dot" cx="0" cy="0" r="4"></circle>
              </svg>
              <span id="ueffRpLabel" class="ueff__label" aria-hidden="true">$r_p$</span>
              <span id="ueffRaLabel" class="ueff__label" aria-hidden="true">$r_a$</span>
            </div>
            <p id="ueffCaption" class="instrument__caption">
              The body can only be where the energy line is above the curve; it turns around where they meet.
            </p>
          </section>

          <section class="instrument__section" aria-label="Orbit values">
            <div class="instrument__values">
              <div class="cp-readout">
                <div class="cp-readout__label">Eccentricity $e$</div>
                <div class="cp-readout__value"><span id="ecc"></span></div>
              </div>
              <div class="cp-readout">
                <div class="cp-readout__label">Angular momentum $|h|$</div>
                <div class="cp-readout__value"><span id="h"></span> <span class="cp-readout__unit">AU$^2$/yr</span></div>
              </div>
              <div class="cp-readout">
                <div class="cp-readout__label">Speed $v$</div>
                <div class="cp-readout__value"><span id="vKmS"></span> <span class="cp-readout__unit">km/s</span></div>
              </div>
              <div class="cp-readout">
                <div class="cp-readout__label">Periapsis $r_p$</div>
                <div class="cp-readout__value"><span id="rpAu"></span> <span class="cp-readout__unit">AU</span></div>
              </div>
            </div>
          </section>
        </div>
      </aside>

      <aside class="cp-demo__controls cp-panel dock" aria-label="Controls panel">
        <div class="cp-panel-body">
          <div class="dock__bar">
            <div class="cp-button-row" role="group" aria-label="Animation controls">
              <button id="play" class="cp-button cp-button--ghost" type="button">Play</button>
              <button id="pause" class="cp-button cp-button--ghost" type="button" disabled>Pause</button>
              <button id="step" class="cp-button cp-button--ghost" type="button">Step</button>
              <button id="reset" class="cp-button cp-button--ghost" type="button">Reset</button>
            </div>
            <!-- KEEP the existing <div class="cp-utility-toolbar" ...> ... </div> element here unchanged. -->
          </div>

          <!-- KEEP the four existing <label class="control ..."> elements here unchanged, in the same order:
               #massSlider, #r0Slider, #speedFactor (control--stacked), #directionDeg. -->

          <p id="status" class="cp-status" role="status" aria-live="polite" aria-atomic="true"></p>
        </div>
      </aside>

      <section class="cp-demo__drawer cp-drawer" aria-label="Panels">
        <div class="cp-panels">
          <!-- KEEP the existing "What to notice" and "Model notes" <details> elements here unchanged. -->

          <details class="cp-accordion">
            <summary>
              <span class="cp-accordion__title">Why an effective potential?</span>
              <span class="cp-accordion__meta">$U_{\rm eff}(r)$</span>
            </summary>
            <div class="cp-accordion__body">
              <p>
                Split the speed into radial and tangential parts, $v^2 = v_r^2 + v_t^2$. Angular momentum per unit
                mass is conserved, $h = r\,v_t$, so $v_t = h/r$ and the specific energy becomes
              </p>
              <p class="drawer__equation">
                $\displaystyle \varepsilon = \tfrac{1}{2}v_r^2 + U_{\rm eff}(r), \qquad U_{\rm eff}(r) = -\frac{\mu}{r} + \frac{h^2}{2r^2}.$
              </p>
              <ul>
                <li>
                  The tangential kinetic energy, $h^2/2r^2$, depends only on $r$ once $h$ is fixed, so it acts like a
                  potential: a centrifugal barrier that keeps the body away from $r = 0$.
                </li>
                <li>
                  $\tfrac{1}{2}v_r^2$ cannot be negative, so the body can only be where $U_{\rm eff}(r) \le \varepsilon$.
                  It turns around ($v_r = 0$) where $U_{\rm eff}(r) = \varepsilon$: at $r_p$, and for a bound orbit at $r_a$.
                </li>
                <li>
                  The curve is lowest at $r_c = h^2/\mu$, where $U_{\rm eff} = -\mu^2/2h^2$. An orbit with exactly
                  that energy is circular.
                </li>
                <li>With $\varepsilon \ge 0$ there is no outer turning point: the body comes in once and leaves.</li>
                <li>
                  In the plot, the gold line from the energy level down to the curve has length $\tfrac{1}{2}v_r^2$.
                  It shrinks to zero at each turning point.
                </li>
              </ul>
            </div>
          </details>
        </div>
      </section>
    </div>
```

**Every `KEEP` comment is an instruction.** Move the named existing element there verbatim, then delete the comment. When done:
- `grep -n "KEEP" index.html` must return nothing;
- `grep -c 'id="' index.html` must not drop below the count before the edit plus the new ids.

**Step 4: Check the references this move could break.**

```bash
grep -rn "cp-panel-header\|Energy &amp; Momentum\|Readouts\b" apps/site/tests/conservation-laws.spec.ts apps/site/tests/accessibility.spec.ts apps/site/tests/smoke.spec.ts
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws
node scripts/validate-math-formatting.mjs > "$SCRATCH/math.log" 2>&1; echo MATH_EXIT=$?
```

Expected:
- the eight new markup tests pass, and the two styling tests are todo;
- the older contracts still pass. `readout labels do not contain parenthesized units` passes because the new labels have none;
- `MATH_EXIT=0`.

The page is unstyled until Task 6, so no E2E yet.

**Step 5: Commit.**

```bash
git add apps/demos/src/demos/conservation-laws/index.html apps/demos/src/demos/conservation-laws/design-contracts.test.ts
git commit -m "Restructure conservation-laws into the orbit shell, with the energy bar, effective-potential plot and its explanation

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Stylesheet for the stage, instrument and dock

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/style.css`, replaced entirely.
- Test: `design-contracts.test.ts`. Switch the two `it.todo` tests from Task 5 back to `it`.

**Step 1: Make the styling tests RED.** Change the two `it.todo(...)` back to `it(...)`, then run the contract tests.

Expected FAIL:
- "colours energy by meaning": no `--cp-energy-*` in the CSS yet;
- "drops the boxed stage": the current `.orbit` rule has `border` and `radial-gradient`.

**Step 2: Implement.** Replace `style.css` with the following. Tokens only; no hex and no `rgba()`.

```css
@import "../../shared/stub-demo.css";

/* ===== Stage: open sky, no card (orbit-stage design 3.1) ===== */
.stage {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: var(--cp-space-3);
  padding: var(--cp-space-2) var(--cp-space-2) 0;
}

/* `.cp-starfield` is position: fixed with z-index 0, so everything drawn over it is positioned above it. */
.stage__head,
.orbit,
.stage__caption {
  position: relative;
  z-index: 1;
}

.stage__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cp-space-2) var(--cp-space-4);
}

.stage__title {
  margin: 0;
  font-family: var(--cp-font-display);
  font-size: 1.1rem;
  font-weight: var(--cp-font-semibold);
  color: var(--cp-text);
}

.stage__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--cp-space-2);
  padding: var(--cp-space-0) var(--cp-space-3);
  border: 1px solid var(--cp-border);
  border-radius: 999px;
  background: var(--cp-chip-bg);
  color: var(--cp-text2);
  font-size: 0.85rem;
}

.stage__chip::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cp-energy-total);
}

.presets {
  margin-left: auto;
}

.presets__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-1);
}

/* Height-driven: a square drawing at width 100% asks for its column's width as height. The rem budget is set by
 * measurement in Task 9; the SVG's default preserveAspectRatio (xMidYMid meet) centres the drawing in the box. */
.orbit {
  display: block;
  width: 100%;
  height: clamp(270px, calc(100svh - 16rem), 760px);
}

.orbit__path {
  fill: none;
  stroke: var(--cp-celestial-orbit);
  stroke-width: 2.5;
}

/* The fading trail behind the body. main.ts sets each segment's stroke-opacity, newest brightest. */
.orbit__trail {
  fill: none;
  stroke: var(--cp-celestial-earth);
  stroke-width: 3;
  stroke-linecap: round;
}

.orbit__mass {
  fill: var(--cp-celestial-sun-core);
  filter: drop-shadow(var(--cp-glow-sun));
}

.orbit__particle {
  fill: var(--cp-celestial-earth);
  filter: drop-shadow(var(--cp-glow-planet));
}

.orbit__velocity {
  stroke: var(--cp-accent-green);
  stroke-width: 2;
}

.orbit__arrowhead {
  fill: var(--cp-accent-green);
}

.stage__caption {
  margin: 0 auto;
  max-width: 70ch;
  color: var(--cp-muted);
  font-size: 0.85rem;
  text-align: center;
}

.stage__caption-view,
.stage__caption-time {
  display: block;
}

/* ===== Instrument column (design 7) ===== */
.instrument .cp-panel-body {
  display: grid;
  gap: var(--cp-space-5);
}

.instrument__section {
  display: grid;
  gap: var(--cp-space-2);
  min-width: 0;
}

.instrument__title {
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--cp-space-2);
  font-family: var(--cp-font-display);
  font-size: 1rem;
  font-weight: var(--cp-font-semibold);
  color: var(--cp-text);
}

.instrument__unit {
  font-family: var(--cp-font-sans);
  font-size: 0.8rem;
  font-weight: var(--cp-font-normal);
  color: var(--cp-readout-unit-color);
  white-space: nowrap;
}

.instrument__equation {
  margin: 0;
  overflow-x: auto;
  color: var(--cp-text2);
}

.instrument__caption {
  margin: 0;
  color: var(--cp-muted);
  font-size: 0.85rem;
}

.instrument .cp-readout__value {
  font-size: 1.15rem;
}

.instrument__energy-values {
  display: grid;
  gap: var(--cp-space-1);
}

.instrument__energy-values .cp-readout {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 0 var(--cp-space-2);
}

.instrument__values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--cp-space-3) var(--cp-space-4);
}

/* A 3px swatch in the quantity's colour, so no quantity relies on the amber value colour alone (design 3.3). */
.cp-readout[data-energy] .cp-readout__label::before {
  content: "";
  display: inline-block;
  width: 3px;
  height: 0.9em;
  margin-right: var(--cp-space-2);
  vertical-align: -0.1em;
  border-radius: 2px;
  background: var(--cp-energy-total);
}

.cp-readout[data-energy="kinetic"] .cp-readout__label::before {
  background: var(--cp-energy-kinetic);
}

.cp-readout[data-energy="potential"] .cp-readout__label::before {
  background: var(--cp-energy-potential);
}

/* ===== Energy bar: U from 0 down to U, K from U to eps (design 7) ===== */
.energy-bar {
  --bar-row: 1.4rem;
  --bar-head: 1.1rem;
  display: grid;
  grid-template-columns: 1.4rem minmax(0, 1fr);
  gap: var(--cp-space-2);
}

.energy-bar__labels {
  display: grid;
  grid-template-rows: repeat(2, var(--bar-row));
  row-gap: var(--cp-space-2);
  align-items: center;
  padding-top: var(--bar-head);
  font-weight: var(--cp-font-semibold);
}

.energy-bar__label--u {
  color: var(--cp-energy-potential);
}

.energy-bar__label--k {
  color: var(--cp-energy-kinetic);
}

.energy-bar__tracks {
  position: relative;
  height: calc(var(--bar-head) + 2 * var(--bar-row) + var(--cp-space-2));
}

.energy-bar__fill {
  position: absolute;
  left: 0;
  width: 0;
  height: var(--bar-row);
  border-radius: 4px;
}

.energy-bar__fill--u {
  top: var(--bar-head);
  background: var(--cp-energy-potential);
}

.energy-bar__fill--k {
  top: calc(var(--bar-head) + var(--bar-row) + var(--cp-space-2));
  background: var(--cp-energy-kinetic);
}

.energy-bar__marker {
  position: absolute;
  top: calc(var(--bar-head) - 3px);
  bottom: 0;
  left: 0;
}

.energy-bar__marker--zero {
  width: 1px;
  background: var(--cp-muted);
}

.energy-bar__marker--eps {
  width: 2px;
  margin-left: -1px;
  background: var(--cp-energy-total);
}

.energy-bar__tick {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  color: var(--cp-muted);
  font-size: 0.75rem;
  line-height: 1.2;
  white-space: nowrap;
}

/* ===== Effective-potential plot (design 6.2) ===== */
.ueff {
  position: relative;
  height: 9rem;
  padding-bottom: 1.1rem;
}

.ueff__plot {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ueff__allowed {
  fill: color-mix(in srgb, var(--cp-energy-kinetic) 18%, transparent);
  stroke: none;
}

.ueff__zero {
  stroke: var(--cp-faint);
  stroke-dasharray: 3 4;
}

.ueff__curve {
  fill: none;
  stroke: var(--cp-energy-potential);
  stroke-width: 2;
}

.ueff__eps {
  stroke: var(--cp-energy-total);
  stroke-width: 1.5;
}

.ueff__drop {
  stroke: var(--cp-energy-kinetic);
  stroke-width: 2;
}

.ueff__dot {
  fill: var(--cp-energy-total);
}

.ueff__label {
  position: absolute;
  bottom: 0;
  left: 0;
  transform: translateX(-50%);
  color: var(--cp-muted);
  font-size: 0.8rem;
  line-height: 1;
}

/* ===== Dock (design 4) ===== */
.dock .cp-panel-body {
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--cp-space-3) var(--cp-space-5);
  align-items: end;
}

.dock__bar,
.dock .cp-status {
  grid-column: 1 / -1;
}

.dock__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--cp-space-2);
}

.dock .cp-status {
  margin: 0;
}

.control__value,
.control__unit {
  color: var(--cp-muted);
}

.cp-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-1);
}

.cp-button-row > .cp-button {
  flex: 1 1 auto;
  padding-inline: var(--cp-space-3);
}

/* ===== Drawer ===== */
.drawer__equation {
  overflow-x: auto;
  text-align: center;
}

/* ===== Phones and tablets: stage, instrument, dock, drawer (grid in demo-shell.css) ===== */
@media (max-width: 1024px) {
  .orbit {
    height: min(88vw, 60svh);
  }

  .presets {
    margin-left: 0;
  }
}

/* ===== Entry animations ===== */
.cp-demo__stage {
  animation: cp-fade-in var(--cp-duration-enter) var(--cp-ease-out) both;
}

.cp-demo__readouts {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 1);
}

.cp-demo__controls {
  animation: cp-slide-up var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 2);
}

.cp-demo__drawer {
  animation: cp-fade-in var(--cp-duration-enter) var(--cp-ease-out) both;
  animation-delay: calc(var(--cp-stagger) * 3);
}
```

**Step 3: Run the contracts and the build.**

```bash
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
```

Expected:
- all contract tests pass, including the two styling tests and the existing `demo shell sections have entry animations`, `no hardcoded rgba()` and `no hex` tests;
- `BUILD_EXIT=0`.

The `color-mix(... transparent)` line is allowed: the rgba test skips lines containing `color-mix`, and there is no hex.

**Step 4: Commit.**

```bash
git add apps/demos/src/demos/conservation-laws/style.css apps/demos/src/demos/conservation-laws/design-contracts.test.ts
git commit -m "Style conservation-laws as the orbit shell: open stage, glass instrument with energy bar and plot, dock

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

The energy bar and plot are still empty; `main.ts` fills them in Task 7.

---

### Task 7: Wire the energy bar and the effective-potential plot

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/main.ts`
- Test: `apps/site/tests/conservation-laws.spec.ts`, a new `test.describe` at the end of the file
- Test: `apps/demos/src/demos/conservation-laws/design-contracts.test.ts`, one test

**What the wiring must do:**
- **When the orbit changes:** `recomputeOrbit` redraws the plot's curve, allowed region, zero and $\varepsilon$ lines and $r_p$/$r_a$ labels. So does a resize of the plot box.
- **Every frame:** `renderBody` moves the energy bars, the plot's dot and its drop line.
- **Physics:** comes only from `ConservationLawsModel`. Contract: "main.ts imports physics from @cosmic/physics, not inline", so write no `-mu / r` in `main.ts`.
- **Test hook:** the drop line publishes `data-radial-kinetic`. That is the value E2E asserts, because an SVG line's length alone can't tell a rounding error from a physics error.

**Step 1: Write the failing tests.**

Contract, in the "Orbit shell and energy instrument" describe:

```ts
    it("renders the energy bar and plot from logic.ts helpers and the physics model", () => {
      expect(mainTs).toContain("energyBarLayout(");
      expect(mainTs).toContain("effectivePotentialPlot(");
      expect(mainTs).toContain("ConservationLawsModel.effectivePotentialAu2Yr2");
      expect(mainTs).toContain("ConservationLawsModel.circularOrbitRadiusAu");
      expect(mainTs).toContain("ConservationLawsModel.radialKineticAu2Yr2");
    });
```

E2E, appended to the end of `conservation-laws.spec.ts`:

```ts
test.describe("Conservation Laws -- orbit shell and energy instrument", () => {
  const MU = 4 * Math.PI * Math.PI; // M = 1 solar mass
  const setSlider = async (page: Page, id: string, value: number) => {
    await page.locator(`#${id}`).evaluate((el: HTMLInputElement, v: number) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  const num = async (page: Page, id: string) => Number.parseFloat((await page.locator(`#${id}`).textContent()) ?? "NaN");
  const rect = (page: Page, sel: string) =>
    page.locator(sel).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    });

  test.beforeEach(async ({ page }) => {
    // Reduced motion switches off the entry slide, so boxes are measured where they settle.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
  });

  test("lays out stage left, instrument right and dock under the stage at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const stage = await rect(page, ".cp-demo__stage");
    const inst = await rect(page, ".cp-demo__readouts");
    const dock = await rect(page, ".cp-demo__controls");
    expect(inst.left).toBeGreaterThanOrEqual(stage.right - 1);
    expect(dock.top).toBeGreaterThanOrEqual(stage.bottom - 1);
    expect(dock.right).toBeLessThanOrEqual(inst.left + 1);
  });

  test("glass panels blur what is behind them", async ({ page }) => {
    const filter = await page.locator(".cp-demo__readouts").evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filter).toBe("blur(16px)");
  });

  test("K ends on the total-energy marker, which stays put while K and U trade (Elliptical)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    const read = () =>
      page.evaluate(() => {
        const r = (id: string) => (document.getElementById(id) as HTMLElement).getBoundingClientRect();
        return {
          uLeft: r("energyBarU").left,
          uRight: r("energyBarU").right,
          kLeft: r("energyBarK").left,
          kRight: r("energyBarK").right,
          zero: r("energyBarZero").left,
          eps: r("energyBarEps").left + r("energyBarEps").width / 2
        };
      });
    const a = await read();
    expect(a.uRight - a.uLeft).toBeGreaterThan(10);
    expect(Math.abs(a.uRight - a.zero)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.kLeft - a.uLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.kRight - a.eps)).toBeLessThanOrEqual(1.5);
    for (let i = 0; i < 3; i++) await page.locator("#step").click();
    const b = await read();
    expect(Math.abs(b.eps - a.eps)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(b.kRight - b.eps)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(b.uLeft - a.uLeft)).toBeGreaterThan(2);
  });

  test("the drop line is the radial kinetic energy: zero at both turning points, not between (Elliptical)", async ({ page }) => {
    // Elliptical starts tangential at speed factor 0.75, so the start is apoapsis; 8 Steps are half an orbit.
    await page.locator('[data-preset="elliptical"]').click();
    const drop = async () => {
      const l = page.locator("#ueffDrop");
      const [y1, y2, kr] = await Promise.all([l.getAttribute("y1"), l.getAttribute("y2"), l.getAttribute("data-radial-kinetic")]);
      return { kr: Number(kr), len: Math.abs(Number(y2) - Number(y1)) };
    };
    const apo = await drop();
    expect(apo.kr).toBeLessThan(1e-6);
    expect(apo.len).toBeLessThan(0.5);
    for (let i = 0; i < 4; i++) await page.locator("#step").click();
    const between = await drop();
    expect(between.kr).toBeGreaterThan(1);
    expect(between.len).toBeGreaterThan(3);
    for (let i = 0; i < 4; i++) await page.locator("#step").click();
    const peri = await drop();
    expect(peri.kr).toBeLessThan(1e-6);
    expect(peri.len).toBeLessThan(0.5);
  });

  test("the plot's r_p and r_a labels sit where independent arithmetic from the readouts puts them (tilted start)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0.9);
    await setSlider(page, "directionDeg", 30);
    const rp = await num(page, "rpAu");
    const eps = await num(page, "eps");
    const rMax = await num(page, "viewRadiusAu");
    const ra = -MU / eps - rp; // 2a - r_p, with a = -mu / (2 eps)
    const plot = await rect(page, "#ueffPlot");
    const left = async (id: string) => Number.parseFloat(await page.locator(`#${id}`).evaluate((el) => (el as HTMLElement).style.left));
    const rMin = 0.55 * rp;
    expect(Math.abs((await left("ueffRpLabel")) - ((rp - rMin) / (rMax - rMin)) * plot.width)).toBeLessThanOrEqual(2);
    expect(Math.abs((await left("ueffRaLabel")) - ((ra - rMin) / (rMax - rMin)) * plot.width)).toBeLessThanOrEqual(2);
  });

  test("radial motion hides the energy bar and the plot rather than drawing nonsense", async ({ page }) => {
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#orbitType")).toHaveText("radial");
    await expect(page.locator("#energyBarK")).toBeHidden();
    await expect(page.locator("#ueffCurve")).toBeHidden();
  });
});
```

**Step 2: Build, run, and confirm RED.**

```bash
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws/design-contracts.test.ts
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test tests/conservation-laws.spec.ts -g "orbit shell and energy instrument" > "$SCRATCH/e2e.log" 2>&1; echo E2E_EXIT=$?
```

Expected:
- the contract test FAILs;
- the two layout tests pass already, from Tasks 3, 5 and 6;
- the four instrument tests FAIL on assertions: zero widths, `data-radial-kinetic` null giving `NaN`, `style.left` empty, and `#energyBarK` visible with width 0. If any fail on a timeout or a missing element instead, fix the test first.

**Step 3: Implement in `main.ts`.**

(a) Add to the `./logic` import: `effectivePotentialPlot`, `energyBarLayout`, `turningPointsText`, `type EffectivePotentialPlot`.

(b) After the existing `must()` lookups (after `viewRadiusAuValue`):

```ts
const energyBarTracks = must<HTMLDivElement>("#energyBar");
const energyBarU = must<HTMLSpanElement>("#energyBarU");
const energyBarK = must<HTMLSpanElement>("#energyBarK");
const energyBarZero = must<HTMLSpanElement>("#energyBarZero");
const energyBarEps = must<HTMLSpanElement>("#energyBarEps");
const ueffPlot = must<SVGSVGElement>("#ueffPlot");
const ueffCurve = must<SVGPathElement>("#ueffCurve");
const ueffAllowed = must<SVGPathElement>("#ueffAllowed");
const ueffZero = must<SVGLineElement>("#ueffZero");
const ueffEps = must<SVGLineElement>("#ueffEps");
const ueffDrop = must<SVGLineElement>("#ueffDrop");
const ueffDot = must<SVGCircleElement>("#ueffDot");
const ueffRpLabel = must<HTMLSpanElement>("#ueffRpLabel");
const ueffRaLabel = must<HTMLSpanElement>("#ueffRaLabel");
```

(c) Before `validOrbit()`:

```ts
/** The effective-potential plot for the current orbit and box; null when there is nothing to draw. */
let ueff: EffectivePotentialPlot | null = null;

function setLine(line: SVGLineElement, x1: number, y1: number, x2: number, y2: number) {
  line.setAttribute("x1", x1.toFixed(2));
  line.setAttribute("y1", y1.toFixed(2));
  line.setAttribute("x2", x2.toFixed(2));
  line.setAttribute("y2", y2.toFixed(2));
}

function placeFill(el: HTMLElement, xPx: number, widthPx: number) {
  el.style.left = `${xPx.toFixed(1)}px`;
  el.style.width = `${Math.max(0, widthPx).toFixed(1)}px`;
}

/** U_eff at r for this orbit, from the model. */
function uEffAt(o: ValidOrbit, rAu: number): number {
  return ConservationLawsModel.effectivePotentialAu2Yr2({ rAu, hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
}
```

(d) Add these functions next to `renderBody`:

```ts
/** The plot's curve, allowed region, lines and turning-point labels. Runs when the orbit or the plot's box changes. */
function renderPotentialPlot() {
  const o = validOrbit();
  const box = ueffPlot.getBoundingClientRect();
  ueffPlot.setAttribute("viewBox", `0 0 ${Math.max(1, box.width).toFixed(0)} ${Math.max(1, box.height).toFixed(0)}`);
  ueff = null;
  if (o && o.orbitType !== "radial") {
    const rc = ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
    ueff = effectivePotentialPlot({
      uEff: (rAu) => uEffAt(o, rAu),
      epsAu2Yr2: o.epsAu2Yr2,
      uEffMinAu2Yr2: uEffAt(o, rc),
      rpAu: o.rpAu,
      raAu: o.raAu,
      rMaxAu: viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au }),
      widthPx: box.width,
      heightPx: box.height
    });
  }
  for (const el of [ueffCurve, ueffAllowed, ueffZero, ueffEps, ueffDrop, ueffDot]) el.style.display = ueff ? "" : "none";
  ueffRpLabel.hidden = !ueff;
  ueffRaLabel.hidden = !ueff || ueff.raXPx === null;
  ueffPlot.setAttribute(
    "aria-label",
    o
      ? `Effective potential against distance. ${turningPointsText({ orbitType: o.orbitType, rpAu: o.rpAu, raAu: o.raAu })}`
      : "Effective potential against distance."
  );
  if (!ueff) return;
  ueffCurve.setAttribute("d", ueff.curveD);
  ueffAllowed.setAttribute("d", ueff.allowedD);
  setLine(ueffZero, 0, ueff.zeroYPx, box.width, ueff.zeroYPx);
  setLine(ueffEps, 0, ueff.epsYPx, box.width, ueff.epsYPx);
  ueffRpLabel.style.left = `${ueff.rpXPx.toFixed(1)}px`;
  if (ueff.raXPx !== null) ueffRaLabel.style.left = `${ueff.raXPx.toFixed(1)}px`;
}

/** Energy bar, and the plot's dot and drop line, at the body's current r. Runs every animation frame. */
function renderEnergyInstrument(o: ValidOrbit, rAu: number, energy: { kAu2Yr2: number; uAu2Yr2: number }) {
  const bar = energyBarLayout({
    kAu2Yr2: energy.kAu2Yr2,
    uAu2Yr2: energy.uAu2Yr2,
    epsAu2Yr2: o.epsAu2Yr2,
    // The deepest potential on the orbit is at periapsis; NaN for radial motion (r_p = 0), which hides the bar.
    uDeepestAu2Yr2: ConservationLawsModel.specificEnergyPartsAu2Yr2({ rAu: o.rpAu, vAuYr: 0, muAu3Yr2: o.muAu3Yr2 }).uAu2Yr2,
    widthPx: energyBarTracks.clientWidth
  });
  for (const el of [energyBarU, energyBarK, energyBarZero, energyBarEps]) el.style.display = bar ? "" : "none";
  if (bar) {
    placeFill(energyBarU, bar.uBar.xPx, bar.uBar.widthPx);
    placeFill(energyBarK, bar.kBar.xPx, bar.kBar.widthPx);
    energyBarZero.style.left = `${bar.zeroPx.toFixed(1)}px`;
    energyBarEps.style.left = `${bar.epsPx.toFixed(1)}px`;
  }

  if (!ueff) return;
  const x = ueff.xPx(rAu);
  ueffDot.setAttribute("cx", x.toFixed(2));
  ueffDot.setAttribute("cy", ueff.epsYPx.toFixed(2));
  setLine(ueffDrop, x, ueff.epsYPx, x, ueff.yPx(uEffAt(o, rAu)));
  ueffDrop.dataset.radialKinetic = String(
    ConservationLawsModel.radialKineticAu2Yr2({ rAu, hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2, epsAu2Yr2: o.epsAu2Yr2 })
  );
}

function hideEnergyInstrument() {
  for (const el of [energyBarU, energyBarK, energyBarZero, energyBarEps]) el.style.display = "none";
}
```

(e) In `recomputeOrbit`:
- In the invalid branch, before its `return`, add `hideEnergyInstrument(); renderPotentialPlot();`.
- Just before the final `renderBody();`, add `renderPotentialPlot();`.

(f) At the end of `renderBody`, after `uValue.textContent = ...`, add:

```ts
  renderEnergyInstrument(o, Math.hypot(xAu, yAu), energy);
```

Radial motion reaches `renderBody` with a valid orbit. The bar then hides itself because `uDeepest` is NaN, and `ueff` is null, so the plot stays hidden.

(g) After `recomputeOrbit();` at the bottom of the file:

```ts
// The plot is sized to its box, and the box is only known after layout; redraw whenever it changes.
new ResizeObserver(() => {
  renderPotentialPlot();
  renderBody();
}).observe(ueffPlot);
```

**Step 4: Build, run, and confirm GREEN.** Same three commands as Step 2, plus the whole conservation-laws spec to catch regressions:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test tests/conservation-laws.spec.ts > "$SCRATCH/e2e.log" 2>&1; echo E2E_EXIT=$?
```

Expected: all pass. The older tests that must survive the restructure are:
- `K and U trade while the specific energy stays fixed (B2)`
- `the arrow is distance covered in the stated time (P5)`
- `readout units in .cp-readout__unit spans (count >= 6)`

If P5's pixel values changed, the SVG's rendered size changed but its viewBox did not. The assertions read SVG attributes in viewBox units, so they must not change. Investigate rather than update them.

**Step 5: Commit.**

```bash
git add apps/demos/src/demos/conservation-laws/main.ts apps/demos/src/demos/conservation-laws/design-contracts.test.ts apps/site/tests/conservation-laws.spec.ts
git commit -m "Drive the energy bar and effective-potential plot from the model, with a radial-kinetic test hook

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Observatory / Potential view switch, with the 2D Potential profile

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/logic.ts` and `logic.test.ts`
- Modify: `apps/demos/src/demos/conservation-laws/index.html`, `style.css` and `main.ts`
- Test: `design-contracts.test.ts` and `apps/site/tests/conservation-laws.spec.ts`

**Behaviour (design §5.0):**
- The stage header holds a two-tab switch, **Observatory** (selected on load) and **Potential**.
- It uses the shared tabs pattern, `initTabs` from `@cosmic/runtime`: `role="tablist"`, arrow keys, and `hidden` on the inactive panel.
- Switching changes only the drawing. The body, time and readouts are shared, and playback is not reset.
- The live region says "Observatory view." or "Potential view. Turns around at ...".
- Both panels share one height, so switching does not move the dock.

**Step 1: Write the failing unit tests.** Add `potentialEnergyWindow` and `potentialProfile` to the test import, then append:

```ts
describe("potentialEnergyWindow", () => {
  it("runs from 12% below the minimum to max(eps, 0) plus 45% of the depth", () => {
    // toBeCloseTo, not toEqual: 1.12 * -2 is -2.2400000000000002 in floating point.
    const bound = potentialEnergyWindow({ epsAu2Yr2: -1.5, uEffMinAu2Yr2: -2 });
    expect(bound.eLo).toBeCloseTo(-2.24, 12);
    expect(bound.eHi).toBeCloseTo(0.9, 12);
    const open = potentialEnergyWindow({ epsAu2Yr2: 0.5, uEffMinAu2Yr2: -2 });
    expect(open.eLo).toBeCloseTo(-2.24, 12);
    expect(open.eHi).toBeCloseTo(1.4, 12);
  });
});

describe("potentialProfile", () => {
  // Same toy as effectivePotentialPlot: mu = 2, h = 1, turning points 1/3 and 1 at eps = -1.5.
  const uEff = (r: number) => -2 / r + 1 / (2 * r * r);
  const args = { uEff, epsAu2Yr2: -1.5, uEffMinAu2Yr2: -2, rpAu: 1 / 3, raAu: 1, rMaxAu: 2, widthPx: 600, heightPx: 300 };
  const prof = potentialProfile(args);
  if (!prof) throw new Error("expected a profile");

  it("puts the Sun at the centre and r on a linear scale out to rMaxAu on each side", () => {
    expect(prof.xPx(0)).toBe(300);
    expect(prof.xPx(2)).toBe(600);
    expect(prof.xPx(-2)).toBe(0);
    expect(prof.rpXPx).toBeCloseTo(350, 9);
    expect(prof.raXPx ?? Number.NaN).toBeCloseTo(450, 9);
  });

  it("is mirror-symmetric about the Sun", () => {
    for (const r of [0.4, 0.8, 1.7]) {
      expect(prof.xPx(r) + prof.xPx(-r)).toBeCloseTo(600, 9);
    }
  });

  it("puts the turning points on the energy line", () => {
    expect(prof.yPx(uEff(1 / 3))).toBeCloseTo(prof.epsYPx, 6);
    expect(prof.yPx(uEff(1))).toBeCloseTo(prof.epsYPx, 6);
  });

  it("draws two curve halves and two closed allowed regions, with no NaN", () => {
    expect(prof.curveD.match(/M /g)?.length).toBe(2);
    expect(prof.allowedD.match(/Z/g)?.length).toBe(2);
    expect(prof.curveD).not.toContain("NaN");
  });

  it("uses the same energy window as the instrument plot", () => {
    const plot = effectivePotentialPlot({ ...args, widthPx: 300, heightPx: 300 });
    expect(prof.epsYPx).toBeCloseTo(plot?.epsYPx ?? Number.NaN, 9);
  });

  it("has no outer turning point for an open orbit, and is null for radial motion", () => {
    expect(potentialProfile({ ...args, epsAu2Yr2: 0.5, raAu: Number.POSITIVE_INFINITY })?.raXPx).toBeNull();
    expect(potentialProfile({ ...args, rpAu: 0 })).toBeNull();
  });
});
```

Run `corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws/logic.test.ts`. Expected: the new tests FAIL, `is not a function`.

**Step 2: Implement.** In `logic.ts`, add the shared window and refactor `effectivePotentialPlot` to use it, replacing its two `eLo`/`eHi` lines:

```ts
/**
 * The energy range both potential drawings show: from 12% below the minimum U_eff (-mu^2/(2 h^2)) to max(eps, 0)
 * plus 45% of that depth, so the trough, the energy line and some of the barrier are always in view.
 */
export function potentialEnergyWindow(args: { epsAu2Yr2: number; uEffMinAu2Yr2: number }): { eLo: number; eHi: number } {
  return { eLo: 1.12 * args.uEffMinAu2Yr2, eHi: Math.max(args.epsAu2Yr2, 0) - 0.45 * args.uEffMinAu2Yr2 };
}
```

In `effectivePotentialPlot`, write `const { eLo, eHi } = potentialEnergyWindow({ epsAu2Yr2, uEffMinAu2Yr2 });`. Then append:

```ts
export type PotentialProfile = {
  curveD: string;
  allowedD: string;
  epsYPx: number;
  zeroYPx: number;
  rpXPx: number;
  /** Null for an open orbit, or when r_a is beyond the view. */
  raXPx: number | null;
  /** Signed distance along the cut through the Sun, AU, to px. */
  xPx: (signedRAu: number) => number;
  yPx: (eAu2Yr2: number) => number;
};

/**
 * The Potential view's 2D drawing: the landscape cut through the Sun, U_eff(|x|) for x from -rMaxAu to +rMaxAu,
 * mirrored about the centre, with r on a linear scale so distances read true. Within 0.55 r_p of the Sun the
 * centrifugal barrier is off the top and is not drawn. The body is drawn at x = +r by the caller.
 */
export function potentialProfile(args: {
  uEff: (rAu: number) => number;
  epsAu2Yr2: number;
  uEffMinAu2Yr2: number;
  rpAu: number;
  raAu: number;
  rMaxAu: number;
  widthPx: number;
  heightPx: number;
  samples?: number;
}): PotentialProfile | null {
  const { uEff, epsAu2Yr2, uEffMinAu2Yr2, rpAu, raAu, rMaxAu, widthPx, heightPx, samples = 90 } = args;
  if (!(rpAu > 0) || !(rMaxAu > rpAu) || !(uEffMinAu2Yr2 < 0) || !Number.isFinite(epsAu2Yr2)) return null;
  if (!(widthPx > 0) || !(heightPx > 0)) return null;
  const { eLo, eHi } = potentialEnergyWindow({ epsAu2Yr2, uEffMinAu2Yr2 });
  const cx = widthPx / 2;
  const xPx = (signedRAu: number) => cx + (signedRAu / rMaxAu) * cx;
  const yPx = (e: number) => ((eHi - clamp(e, eLo, eHi)) / (eHi - eLo)) * heightPx;
  const pt = (signedRAu: number, e: number) => `${xPx(signedRAu).toFixed(2)} ${yPx(e).toFixed(2)}`;
  const rMin = 0.55 * rpAu;
  const rEnd = Number.isFinite(raAu) ? Math.min(raAu, rMaxAu) : rMaxAu;

  const half = (sign: 1 | -1) => {
    const out: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const r = rMin + ((rMaxAu - rMin) * i) / samples;
      out.push(`${i === 0 ? "M" : "L"} ${pt(sign * r, uEff(r))}`);
    }
    return out.join(" ");
  };
  const allowed = (sign: 1 | -1) => {
    const out = [`M ${pt(sign * rpAu, epsAu2Yr2)}`];
    for (let i = 0; i <= samples; i++) {
      const r = rpAu + ((rEnd - rpAu) * i) / samples;
      out.push(`L ${pt(sign * r, uEff(r))}`);
    }
    out.push(`L ${pt(sign * rEnd, epsAu2Yr2)} Z`);
    return out.join(" ");
  };

  return {
    curveD: `${half(-1)} ${half(1)}`,
    allowedD: `${allowed(-1)} ${allowed(1)}`,
    epsYPx: yPx(epsAu2Yr2),
    zeroYPx: yPx(0),
    rpXPx: xPx(rpAu),
    raXPx: Number.isFinite(raAu) && raAu <= rMaxAu ? xPx(raAu) : null,
    xPx,
    yPx
  };
}
```

Run the unit tests. Expected: all pass, including every Task 4 `effectivePotentialPlot` test after the refactor. Commit:

```bash
git add apps/demos/src/demos/conservation-laws/logic.ts apps/demos/src/demos/conservation-laws/logic.test.ts
git commit -m "Add the mirrored potential profile and share the energy window between both potential drawings

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

**Step 3: Write the failing contract and E2E tests.**

Contracts, in the "Orbit shell and energy instrument" describe:

```ts
    it("switches the stage between Observatory (default) and Potential with tabs", () => {
      expect(html).toContain('data-view="observatory"');
      expect(html).toMatch(/role="tablist"[^>]*aria-label="Stage view"/);
      expect(html).toMatch(/id="viewObservatoryTab"[^>]*aria-selected="true"[^>]*aria-controls="observatoryView"/);
      expect(html).toMatch(/id="viewPotentialTab"[^>]*aria-selected="false"[^>]*aria-controls="potentialView"/);
      expect(html).toMatch(/id="potentialView"[^>]*hidden/);
      expect(mainTs).toContain("initTabs(");
      expect(mainTs).toContain("potentialProfile(");
    });

    it("labels the Potential view as energy, not space", () => {
      expect(html).toMatch(/data-kind="misconception"[^>]*>\s*Height is energy per unit mass, not depth in space\./);
    });
```

E2E, inside the Task 7 describe:

```ts
  test("opens in Observatory, switches to Potential and back by click and arrow key, without moving the body", async ({ page }) => {
    const stage = page.locator(".cp-demo__stage");
    await expect(stage).toHaveAttribute("data-view", "observatory");
    await expect(page.locator("#observatoryView")).toBeVisible();
    await expect(page.locator("#potentialView")).toBeHidden();
    await page.locator('[data-preset="elliptical"]').click();
    for (let i = 0; i < 3; i++) await page.locator("#step").click();
    const u = await page.locator("#uAu").textContent();
    const dockTop = (await rect(page, ".cp-demo__controls")).top;

    await page.getByRole("tab", { name: "Potential" }).click();
    await expect(stage).toHaveAttribute("data-view", "potential");
    await expect(page.locator("#potentialView")).toBeVisible();
    await expect(page.locator("#observatoryView")).toBeHidden();
    await expect(page.locator("#uAu")).toHaveText(u ?? "");
    await expect(page.locator("#status")).toContainText("Potential view.");
    expect(Math.abs((await rect(page, ".cp-demo__controls")).top - dockTop)).toBeLessThanOrEqual(1);

    await page.keyboard.press("ArrowLeft");
    await expect(stage).toHaveAttribute("data-view", "observatory");
    await expect(page.locator("#status")).toHaveText("Observatory view.");
  });

  test("the Potential view puts the body on the energy line at x = r, with the Sun at the centre (tilted start)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0.9);
    await setSlider(page, "directionDeg", 30);
    await page.getByRole("tab", { name: "Potential" }).click();
    const rp = await num(page, "rpAu");
    const rMax = await num(page, "viewRadiusAu");
    const g = await page.evaluate(() => {
      const n = (id: string, a: string) => Number(document.getElementById(id)?.getAttribute(a));
      const w = (document.getElementById("potentialSvg") as Element).getBoundingClientRect().width;
      const rpLeft = Number.parseFloat((document.getElementById("potentialRpLabel") as HTMLElement).style.left);
      return { w, bodyX: n("potentialBody", "cx"), bodyY: n("potentialBody", "cy"), epsY: n("potentialEps", "y1"), sunX: n("potentialSun", "cx"), rpLeft };
    });
    expect(Math.abs(g.sunX - g.w / 2)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(g.bodyY - g.epsY)).toBeLessThanOrEqual(0.5);
    // At the start r = r0 = 1 AU. The caption's view radius has 2 decimals, worth about 1px here.
    expect(Math.abs(g.bodyX - (g.w / 2 + (1 / rMax) * (g.w / 2)))).toBeLessThanOrEqual(2);
    expect(Math.abs(g.rpLeft - (g.w / 2 + (rp / rMax) * (g.w / 2)))).toBeLessThanOrEqual(2);
  });
```

Build, then run the describe. Expected: both contracts FAIL; both E2E FAIL on `data-view` or the missing tab. That is a locator timeout on `getByRole("tab")`, which counts as RED here only because the element is genuinely absent.

**Step 4: Implement the markup.** In `index.html`:

(a) Add `data-view="observatory"` to the `<section class="cp-demo__stage ...">` tag.

(b) In `.stage__head`, directly after `<p class="stage__title">...</p>`:

```html
          <div class="cp-tabs stage__views" role="tablist" aria-label="Stage view">
            <button id="viewObservatoryTab" class="cp-tab" role="tab" aria-selected="true" aria-controls="observatoryView" type="button">Observatory</button>
            <button id="viewPotentialTab" class="cp-tab" role="tab" aria-selected="false" aria-controls="potentialView" tabindex="-1" type="button">Potential</button>
          </div>
```

(c) Wrap the existing `<svg id="orbitSvg" ...>...</svg>` in a panel, and add the Potential panel after it, before `#stageCaption`:

```html
        <div id="observatoryView" class="stage__view" role="tabpanel" aria-labelledby="viewObservatoryTab">
          <!-- the existing <svg id="orbitSvg" ...> ... </svg>, unchanged -->
        </div>

        <div id="potentialView" class="stage__view potential" role="tabpanel" aria-labelledby="viewPotentialTab" hidden>
          <p class="cp-callout potential__note" data-kind="misconception">Height is energy per unit mass, not depth in space.</p>
          <div class="potential__frame">
            <svg id="potentialSvg" class="potential__svg" role="img" aria-label="Effective potential profile through the Sun.">
              <path id="potentialAllowed" class="ueff__allowed" d=""></path>
              <line id="potentialZero" class="ueff__zero" x1="0" y1="0" x2="0" y2="0"></line>
              <path id="potentialCurve" class="ueff__curve potential__curve" d=""></path>
              <line id="potentialEps" class="ueff__eps" x1="0" y1="0" x2="0" y2="0"></line>
              <circle id="potentialSun" class="orbit__mass" cx="0" cy="12" r="8"></circle>
              <line id="potentialDrop" class="ueff__drop potential__drop" x1="0" y1="0" x2="0" y2="0"></line>
              <circle id="potentialBody" class="orbit__particle" cx="0" cy="0" r="7"></circle>
            </svg>
            <span id="potentialRpLabel" class="potential__label potential__label--turn" aria-hidden="true">$r_p$</span>
            <span id="potentialRaLabel" class="potential__label potential__label--turn" aria-hidden="true">$r_a$</span>
            <span id="potentialEpsLabel" class="potential__label" aria-hidden="true">$\varepsilon$</span>
          </div>
        </div>
```

**Step 5: Implement the styles.** In `style.css`:

(a) Replace the `.orbit { ... }` rule from Task 6 with the three rules below. The height budget moves to the panel, so both views are the same height.

```css
.stage__view {
  position: relative;
  z-index: 1;
  height: clamp(270px, calc(100svh - 16rem), 760px);
}

.orbit {
  display: block;
  width: 100%;
  height: 100%;
}

.stage__views {
  border-bottom: 0;
  padding: 0;
}
```

(b) In the `@media (max-width: 1024px)` block, replace `.orbit { height: min(88vw, 60svh); }` with `.stage__view { height: min(88vw, 60svh); }`.

(c) Remove `.orbit` from the `.stage__head, .orbit, .stage__caption` z-index rule; `.stage__view` now carries it.

(d) Append:

```css
/* ===== Potential view: the 2D landscape profile (design 5.0) ===== */
.potential {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--cp-space-2);
}

.potential__note {
  justify-self: start;
  margin: 0;
  font-size: 0.85rem;
}

.potential__frame {
  position: relative;
  min-height: 0;
  padding-bottom: 1.4rem;
}

.potential__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.potential__curve {
  stroke-width: 2.5;
}

.potential__drop {
  stroke-width: 3;
}

.potential__label {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  color: var(--cp-text2);
  font-size: 0.9rem;
  line-height: 1;
}

.potential__label--turn {
  top: auto;
  bottom: 0;
  transform: translateX(-50%);
}
```

**Step 6: Implement the behaviour in `main.ts`.**

(a) Add `initTabs` to the `@cosmic/runtime` import, and `potentialProfile, type PotentialProfile` to the `./logic` import.

(b) Add the lookups:

```ts
const stageSection = must<HTMLElement>(".cp-demo__stage");
const stageViews = must<HTMLElement>(".stage__views");
const viewPotentialTab = must<HTMLButtonElement>("#viewPotentialTab");
const potentialSvg = must<SVGSVGElement>("#potentialSvg");
const potentialCurve = must<SVGPathElement>("#potentialCurve");
const potentialAllowed = must<SVGPathElement>("#potentialAllowed");
const potentialZero = must<SVGLineElement>("#potentialZero");
const potentialEps = must<SVGLineElement>("#potentialEps");
const potentialSun = must<SVGCircleElement>("#potentialSun");
const potentialDrop = must<SVGLineElement>("#potentialDrop");
const potentialBody = must<SVGCircleElement>("#potentialBody");
const potentialRpLabel = must<HTMLSpanElement>("#potentialRpLabel");
const potentialRaLabel = must<HTMLSpanElement>("#potentialRaLabel");
const potentialEpsLabel = must<HTMLSpanElement>("#potentialEpsLabel");
```

(c) Next to `let ueff`, add `let profile: PotentialProfile | null = null;`.

(d) Add these next to `renderPotentialPlot`:

```ts
/** The Potential view's profile for the current orbit. A hidden panel has no box, so this runs again on show. */
function renderPotentialView() {
  const o = validOrbit();
  const box = potentialSvg.getBoundingClientRect();
  profile = null;
  if (o && o.orbitType !== "radial" && box.width > 0) {
    const rc = ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
    profile = potentialProfile({
      uEff: (rAu) => uEffAt(o, rAu),
      epsAu2Yr2: o.epsAu2Yr2,
      uEffMinAu2Yr2: uEffAt(o, rc),
      rpAu: o.rpAu,
      raAu: o.raAu,
      rMaxAu: viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au }),
      widthPx: box.width,
      heightPx: box.height
    });
  }
  for (const el of [potentialCurve, potentialAllowed, potentialZero, potentialEps, potentialDrop, potentialBody]) {
    el.style.display = profile ? "" : "none";
  }
  potentialRpLabel.hidden = !profile;
  potentialRaLabel.hidden = !profile || profile.raXPx === null;
  potentialEpsLabel.hidden = !profile;
  if (!profile) return;
  potentialSvg.setAttribute("viewBox", `0 0 ${box.width.toFixed(0)} ${box.height.toFixed(0)}`);
  potentialCurve.setAttribute("d", profile.curveD);
  potentialAllowed.setAttribute("d", profile.allowedD);
  setLine(potentialZero, 0, profile.zeroYPx, box.width, profile.zeroYPx);
  setLine(potentialEps, 0, profile.epsYPx, box.width, profile.epsYPx);
  potentialSun.setAttribute("cx", (box.width / 2).toFixed(2));
  potentialRpLabel.style.left = `${profile.rpXPx.toFixed(1)}px`;
  if (profile.raXPx !== null) potentialRaLabel.style.left = `${profile.raXPx.toFixed(1)}px`;
  potentialEpsLabel.style.left = `${(box.width - 12).toFixed(1)}px`;
  potentialEpsLabel.style.top = `${(profile.epsYPx - 12).toFixed(1)}px`;
}

function syncStageView() {
  const view = viewPotentialTab.getAttribute("aria-selected") === "true" ? "potential" : "observatory";
  if (stageSection.dataset.view === view) return;
  stageSection.dataset.view = view;
  renderPotentialView();
  renderBody();
  const o = validOrbit();
  setLiveRegionText(
    status,
    view === "potential"
      ? `Potential view. ${o ? turningPointsText({ orbitType: o.orbitType, rpAu: o.rpAu, raAu: o.raAu }) : ""}`.trim()
      : "Observatory view."
  );
}
```

(e) In `renderEnergyInstrument`, after the plot block, add the profile block. The `if (!ueff) return;` must become a non-returning `if (ueff) { ... }` so the profile still updates:

```ts
  if (profile) {
    const px = profile.xPx(rAu);
    potentialBody.setAttribute("cx", px.toFixed(2));
    potentialBody.setAttribute("cy", profile.epsYPx.toFixed(2));
    setLine(potentialDrop, px, profile.epsYPx, px, profile.yPx(uEffAt(o, rAu)));
  }
```

(f) In `recomputeOrbit`, call `renderPotentialView();` next to both `renderPotentialPlot()` calls.

(g) At the bottom, after the plot's `ResizeObserver`:

```ts
initTabs(stageSection);
// initTabs has already updated aria-selected by the time these run: its listeners were added first.
stageViews.addEventListener("click", syncStageView);
stageViews.addEventListener("keydown", syncStageView);
new ResizeObserver(() => {
  renderPotentialView();
  renderBody();
}).observe(potentialSvg);
```

**Step 7: Build, run, and confirm GREEN.**

```bash
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws
corepack pnpm -C apps/demos typecheck > "$SCRATCH/tsc.log" 2>&1; echo TSC_EXIT=$?
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test tests/conservation-laws.spec.ts > "$SCRATCH/e2e.log" 2>&1; echo E2E_EXIT=$?
```

Expected: all pass. If the arrow-key test fails, check that `initTabs` focused the Potential tab on click; its click handler calls `target.focus()`.

**Step 8: Commit.**

```bash
git add apps/demos/src/demos/conservation-laws/index.html apps/demos/src/demos/conservation-laws/style.css apps/demos/src/demos/conservation-laws/main.ts apps/demos/src/demos/conservation-laws/design-contracts.test.ts apps/site/tests/conservation-laws.spec.ts
git commit -m "Add the Observatory/Potential stage switch with the 2D effective-potential profile

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: The activity sends students from Observatory to Potential

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/index.html` (the What to notice accordion)
- Modify: `apps/site/src/content/demos/conservation-laws.md` (`play_steps`)
- Modify: `apps/site/src/content/stations/conservation-laws.md`
- Modify: `apps/site/src/content/instructor/conservation-laws/activities.md`. Change both its new MW Short section and its "Station version" copy of the station card, which must stay identical to the station file.
- Test: `design-contracts.test.ts`, and the `Conservation Laws -- instructor page` describe in `apps/site/tests/conservation-laws.spec.ts`

**Physics note for the copy.** At a turning point $v_r = 0$, so the motion is purely **tangential**. That is where the body is "neither approaching nor receding from the Sun", **not** where it moves "straight toward" it. Keep that wording exactly.

**Step 1: Write the failing tests.**

Contract, in the "Orbit shell and energy instrument" describe:

```ts
    it("the activity sends students from Observatory to Potential", () => {
      const notice = /What to notice[\s\S]*?<\/details>/.exec(html)?.[0] ?? "";
      expect(notice).toContain("Potential");
      expect(notice).toContain("\\tfrac{1}{2}v_r^2");
    });
```

E2E, in `test.describe("Conservation Laws -- instructor page", ...)`:

```ts
  test("the station card and instructor activities send students to the Potential view", async ({ page }) => {
    await page.goto("stations/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Turning points:").first()).toBeVisible();
    await expect(page.getByText(/Switch the stage to\s+Potential/).first()).toBeVisible();
    await page.goto("instructor/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Where does the orbit turn around\?/ })).toBeVisible();
  });
```

Check first whether the instructor activities render on `instructor/conservation-laws/` or on a sub-route: `grep -n "goto" apps/site/tests/conservation-laws.spec.ts | tail -5`. Use the route the existing instructor tests use.

**Step 2: Confirm RED.** Run the contract tests, build, then run `-g "send students to the Potential view"`. Expected: both FAIL on assertions (text not found).

**Step 3: Implement the copy.**

(a) In `index.html`, in the What to notice list:
- change the meta from `4 bullets` to `5 bullets`;
- insert as the second `<li>`:

```html
                <li>Switch the stage from Observatory to Potential and press Play (or Step) on Elliptical: the gold line from the energy level down to $U_{\rm eff}(r)$ is $\tfrac{1}{2}v_r^2$, and it shrinks to zero exactly where the orbit turns around, at $r_p$ and $r_a$.</li>
```

(b) In `apps/site/src/content/demos/conservation-laws.md`, insert as the second `play_steps` entry. It is a YAML double-quoted string, so backslashes are doubled.

```yaml
  - "Switch the stage from Observatory to Potential and press Play again. Where does the gold line down to $U_{\\rm eff}(r)$ shrink to zero, and what is the orbit doing there?"
```

(c) In the station card, in **both** `apps/site/src/content/stations/conservation-laws.md` and the "Station version" block of `activities.md`:
- Title line: `(6–8 minutes)` becomes `(8–10 minutes)`. In `activities.md`, also change the section heading `## Station version (6–8 min)` to `(8–10 min)`.
- Insert a new item 2, and renumber the old 2, 3 and 4 to 3, 4 and 5:

```md
> 2) **Turning points:** On **Elliptical**, predict first: where on the orbit is the body neither approaching nor receding from the Sun? Then switch the stage to **Potential** and press **Step** until the gold line has zero length. Is the body at the $r_p$ label or the $r_a$ label? Find the other place the line vanishes.  
```

- Replace the old item 4, now item 5, with:

```md
> 5) **Explanation (1–2 sentences):** Use “energy sets bound vs unbound”, “angular momentum sets closest approach” and “the orbit turns around where $U_{\rm eff}(r) = \varepsilon$.”
```

- In the word bank, after the $K$ and $U$ entry:

```md
> - **Effective potential $U_{\rm eff}(r)$ (Potential view):** the energy landscape. The body can only be where the energy line $\varepsilon$ is above it; the gold line between them is $\tfrac{1}{2}v_r^2$.
```

(d) In `activities.md`:
- set `last_updated: "2026-09-11"`;
- insert this section after the "MW Short (8–12 min): Why $\sqrt{2}$?" section and before "Friday Lab":

```md
## MW Short (5–8 min): Where does the orbit turn around?

**Goal:** students read turning points from the effective potential, $\varepsilon = \tfrac{1}{2}v_r^2 + U_{\rm eff}(r)$.

**Setup (projector):** Elliptical preset, stage on **Observatory**.

1. Ask for a prediction: *"Where on this orbit is the body neither approaching nor receding from the Sun?"* Press **Step** a few times and let students point.
2. Switch the stage to **Potential**. The gold line from the energy level $\varepsilon$ down to the curve $U_{\rm eff}(r) = -\mu/r + h^2/2r^2$ has length $\tfrac{1}{2}v_r^2$.
3. Step until the gold line vanishes. It vanishes only at $r_p$ and $r_a$, where $v_r = 0$ and the motion is purely tangential.

**Key takeaway:** the body can only be where $U_{\rm eff}(r) \le \varepsilon$, and it turns around where the two are equal. The bottom of the curve, at $r_c = h^2/\mu$, is the circular orbit.

**Discussion prompt:** *"Why does more angular momentum push $r_p$ outward?"* A larger $h$ raises the barrier $h^2/2r^2$.
```

**Step 4: Confirm GREEN, and validate the maths.**

```bash
corepack pnpm -C apps/demos exec vitest run src/demos/conservation-laws
node scripts/validate-math-formatting.mjs > "$SCRATCH/math.log" 2>&1; echo MATH_EXIT=$?
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test tests/conservation-laws.spec.ts > "$SCRATCH/e2e.log" 2>&1; echo E2E_EXIT=$?
diff <(sed -n '/Station card: Conservation Laws/,/regardless of direction/p' apps/site/src/content/stations/conservation-laws.md) \
     <(sed -n '/Station card: Conservation Laws/,/regardless of direction/p' apps/site/src/content/instructor/conservation-laws/activities.md) \
  && echo STATION_COPIES_MATCH
```

Expected:
- all pass;
- `MATH_EXIT=0`;
- `STATION_COPIES_MATCH` is printed.

**Step 5: Commit.**

```bash
git add apps/demos/src/demos/conservation-laws/index.html apps/demos/src/demos/conservation-laws/design-contracts.test.ts apps/site/src/content/demos/conservation-laws.md apps/site/src/content/stations/conservation-laws.md apps/site/src/content/instructor/conservation-laws/activities.md apps/site/tests/conservation-laws.spec.ts
git commit -m "Have the conservation-laws activity send students to the Potential view to find turning points

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Fold budget, reflow and visual review

**Files:**
- Modify: `apps/demos/src/demos/conservation-laws/style.css`, only the `16rem` budget in `.stage__view` and whatever the review finds
- Test: `apps/site/tests/conservation-laws.spec.ts`
- Reference: `apps/site/tests/layout-budget.spec.ts` and `apps/site/tests/reflow.spec.ts`. Both already cover this route.

**Step 1: Write the fold test.** Add it to the Task 7 describe:

```ts
  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
    test(`at ${size.width}x${size.height} the stage view, energy bar and dock are all on screen`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("#orbitType")).toHaveText("circular");
      expect((await rect(page, ".stage__view:not([hidden])")).bottom).toBeLessThanOrEqual(size.height);
      expect((await rect(page, "#energyBar")).bottom).toBeLessThanOrEqual(size.height);
      expect((await rect(page, ".cp-demo__controls")).bottom).toBeLessThanOrEqual(size.height);
    });
  }
```

**Step 2: Measure, then tune the one number.**
- Build and run these tests.
- If the dock ends below the fold, record the measured `bottom` values in the Execution log.
- Raise the `16rem` in `.stage__view` to the smallest whole rem that passes at **both** sizes. Remember 1rem = 18px.
- Do not shrink the caption, the dock or the type to make room.
- **If no rem ≥ the 270px floor passes at 1280×720, stop and report the measurements to Anna.** Don't change the layout on your own.

**Step 3: Run the site-wide layout gates together, as one Playwright run.**

```bash
corepack pnpm build > "$SCRATCH/build.log" 2>&1; echo BUILD_EXIT=$?
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site exec playwright test tests/conservation-laws.spec.ts tests/layout-budget.spec.ts tests/reflow.spec.ts tests/accessibility.spec.ts tests/smoke.spec.ts > "$SCRATCH/e2e-layout.log" 2>&1; echo E2E_EXIT=$?
```

Expected: all pass.
- `layout-budget` holds conservation-laws to `CLEAN`: 0 readouts below the fold at 1440×900 and 0 dock overflow.
- `reflow` must show no sideways scroll at 320px on `play/conservation-laws/`.

If layout-budget now reports **better** numbers for another demo, that is not this task's business. If it reports worse numbers for conservation-laws, fix the layout; never loosen the budget.

**Step 4: Visual review.** Dispatch **one** `visual-ux-reviewer` agent with this brief:

> Review `/play/conservation-laws/` on branch `claude/orbit-stage`: build, then serve with `corepack pnpm -C apps/site preview --host 127.0.0.1 --port 4173` from the repo root. Capture 1440x900, 1280x720, 390x844 and 320x640 in BOTH stage views (Observatory default; click the Potential tab), on the Elliptical preset after 3 Steps. Save to `output/playwright/conservation-laws/orbit-shell/<view>-<w>x<h>.png`. Before-captures are in `output/playwright/conservation-laws/after/`. Measure and report, ordered by harm to a student:
> - overlap in px;
> - clipped text;
> - contrast of text on the glass panels over the busiest part of the sky;
> - focus visibility on the view tabs, presets and Step;
> - whether any control changes only its own label;
> - whether the $r_p$/$r_a$ labels collide with each other or the curve;
> - whether the energy bar's $K$ end visibly meets the $\varepsilon$ marker;
> - whether switching views moves anything outside the stage.
>
> Read-only: report, don't edit.

**Step 5:** Fix Critical and High findings, one commit each, with a test where one can be written. Re-run Step 3's command after the fixes. Record the Medium and Low findings you did not fix in the Execution log.

**Step 6: Commit** the budget and the fixes. Stage by path; screenshots under `output/` are not committed.

```bash
git add apps/demos/src/demos/conservation-laws/style.css apps/site/tests/conservation-laws.spec.ts
git commit -m "Size the conservation-laws stage so the view, energy bar and dock fit at 1280x720 and 1440x900

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Physics review (mandatory before any push)

**Files:** none unless findings require changes.

**Step 1:** Dispatch **one** `physics-reviewer` agent with this brief:

> Review branch `claude/orbit-stage` against `main` (`git diff main...HEAD`) for conservation-laws. Trace the full chain for an ASYMMETRIC state (M = 1.6, r0 = 0.8 AU, speed factor 1.17, direction 17.76 degrees) and for the Elliptical preset after 3 Steps:
>
> 1. `packages/physics/src/conservationLawsModel.ts`: `effectivePotentialAu2Yr2`, `circularOrbitRadiusAu`, `radialKineticAu2Yr2`. Check the formulas, units (AU, yr, $M_\odot$, $G = 4\pi^2$), domains and the -1e-9 tolerance.
> 2. `logic.ts`: `energyBarLayout` (does K's end equal eps?), `potentialEnergyWindow`, `effectivePotentialPlot` (its r axis starts at 0.55 r_p), `potentialProfile` (its r axis is linear from the Sun, mirrored). Are the two different x-scales stated where a reader would see them? Is y down consistently with energy up?
> 3. `main.ts`: `uDeepest = U(r_p)`; the body's r from `conicPositionAndTangentAu`; the drop line from eps to `U_eff(r)`; `data-radial-kinetic`; the body at x = +r in the profile.
> 4. Every reader-visible claim: the drawer's "Why an effective potential?", What to notice, the play steps, the station card, the instructor MW Short, "Height is energy per unit mass, not depth in space", and every `turningPointsText` string. In particular, "Circular: the energy line touches the bottom of the curve" is true only when eps = U_eff,min.
>
> Recompute independently; don't trust the tests. Report findings as verified or lead, with file:line, and end with SAFE TO SHIP or NOT SAFE.

**Step 2:** Fix every verified finding, test first where testable, one commit per fix. Re-dispatch the reviewer on the fix commits only, until the verdict is SAFE TO SHIP. Record each round in the Execution log.

---

### Task 12: Gates, status and handoff

**Step 1: Run every gate.**

```bash
corepack pnpm gates > "$SCRATCH/gates.log" 2>&1; echo GATES_EXIT=$?
tail -12 "$SCRATCH/gates.log"
```

Expected: `GATES_EXIT=0` with lint, typecheck, unit, build and e2e each `EXIT=0`. Record the E2E pass, skip and fail counts. If anything fails, use superpowers:systematic-debugging; do not re-run hoping it passes.

**Step 2: Update the records.**
- `STATUS.md`: set `next:` to "Anna reviews the Phase 1 orbit shell screenshots; on approval, land to main, then Phase 2 (three.js Potential landscape)". Add a short "Orbit stage Phase 1" section: what shipped, gate counts, reviewer verdicts, and deferred findings.
- This plan's Execution log: complete it.
- `apps/site/src/content/demos/conservation-laws.md`: leave `status` and `readiness` unchanged (beta / candidate). Promotion is Anna's decision. Update `last_updated` only if it isn't already `"2026-09-11"`.

```bash
git add STATUS.md docs/plans/2026-09-11-orbit-stage-phase1.md
git commit -m "Record orbit stage Phase 1 in STATUS and the plan log

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

**Step 3: Hand off to Anna. Do not push.**
- Send the after-screenshots of both views at 1440×900 and 390×844 with `SendUserFile`.
- Give a one-paragraph report: what changed, gate counts, the physics verdict, and deferred findings.
- Ask for approval to land.

On approval, land with CLAUDE.md's fast-forward sequence:
1. Check `gh run list --branch main --limit 1` first, because pushing cancels a running deploy.
2. `git checkout main && git pull --ff-only && git merge --ff-only claude/orbit-stage`.
3. Run the gates.
4. `git push origin main`.

---

## Execution log

Fill in as tasks land. Evidence means the command, its exit code and the counts or measurements, not "passed".

| Task | Commit | Evidence | Notes / errata |
|---|---|---|---|
| 0 | — | | |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |
