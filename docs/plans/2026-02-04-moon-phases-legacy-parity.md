# Moon Phases Legacy-Parity Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the moon-phases demo to match legacy pedagogy and interaction quality (orbital + phase views, timeline, animation, shadow insight) while staying within the Cosmic Playground shell/tokens/runtime and enforcing strict TDD for new logic and structure.

**Architecture:** Move all phase computations into a new `MoonPhasesModel` in `packages/physics` with unit-explicit, test-backed functions; keep the demo layer as thin wiring (DOM + rendering) that consumes the model. Build legacy-parity UI structure inside the CP shell using tokens/components, with runtime-provided modes, copy-results, and a11y hooks. Add a small structure test to enforce required demo elements before updating the HTML.

**Tech Stack:** TypeScript, Vitest, Vite demos, `@cosmic/runtime`, `@cosmic/physics`, `@cosmic/theme`.

**Constraints / Notes:**
- No git worktrees (per user instruction).
- Strict TDD: tests must fail before implementation for every new behavior; UI structure changes will be backed by a new HTML structure test.

---

## Spec-aligned Acceptance Criteria (cite: `docs/specs/cosmic-playground-site-spec.md`)

- **Demo shell invariant**: Controls left, stage center, readouts right, drawer present; mobile collapses to tabs (9.1).
- **Runtime features**: Copy Results uses v1 payload with ordered rows and explicit export version marker; Help/Station modes remain functional (9.2).
- **Accessibility**: Keyboard operable controls, visible focus, ARIA labels for custom controls, no color-only meaning, reduced-motion support (11.2).
- **Tokenized UI**: No new hex colors in demo CSS; use theme tokens/components (10.1/10.2).
- **Pedagogy parity**: Two synchronized views, timeline, animation controls, shadow insight toggle, days-since-new and waxing/waning context; explicit Observable → Model → Inference in drawer/help.
- **Units/notation**: Explicit units in labels/readouts/exports; α in degrees, f unitless; follow D/d policy (not used here).
- **Base-path safety**: Cross-demo link uses relative `/play/...` path (no root-absolute).

---

## Task 1: Add MoonPhasesModel tests (RED)

**Files:**
- Create: `packages/physics/src/moonPhasesModel.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from "vitest";
import { MoonPhasesModel } from "./moonPhasesModel";

describe("MoonPhasesModel", () => {
  test("illumination fraction matches key phases", () => {
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(0)).toBeCloseTo(1, 6);
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(180)).toBeCloseTo(0, 6);
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(90)).toBeCloseTo(0.5, 6);
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(270)).toBeCloseTo(0.5, 6);
  });

  test("phase names follow legacy bins", () => {
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(0)).toBe("Full Moon");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(45)).toBe("Waning Gibbous");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(90)).toBe("Third Quarter");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(180)).toBe("New Moon");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(270)).toBe("First Quarter");
  });

  test("days since new uses 29.53 d synodic month", () => {
    const daysAtNew = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(180);
    const daysAtFull = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(0);
    expect(daysAtNew).toBeCloseTo(0, 6);
    expect(daysAtFull).toBeCloseTo(29.53 / 2, 3);
  });

  test("waxing/waning flips after full", () => {
    expect(MoonPhasesModel.waxingWaningFromPhaseAngleDeg(180)).toBe("Waxing");
    expect(MoonPhasesModel.waxingWaningFromPhaseAngleDeg(0)).toBe("Waning");
  });
});
```

**Step 2: Run tests to verify failure**

Run: `corepack pnpm -C packages/physics test -- moonPhasesModel.test.ts`

Expected: FAIL (module missing).

---

## Task 2: Implement MoonPhasesModel (GREEN)

**Files:**
- Create: `packages/physics/src/moonPhasesModel.ts`
- Modify: `packages/physics/src/index.ts`

**Step 1: Write minimal implementation**

```ts
const SYNODIC_MONTH_DAYS = 29.53;

const PHASE_BINS = [
  { min: 0, max: 22.5, name: "Full Moon" },
  { min: 22.5, max: 67.5, name: "Waning Gibbous" },
  { min: 67.5, max: 112.5, name: "Third Quarter" },
  { min: 112.5, max: 157.5, name: "Waning Crescent" },
  { min: 157.5, max: 202.5, name: "New Moon" },
  { min: 202.5, max: 247.5, name: "Waxing Crescent" },
  { min: 247.5, max: 292.5, name: "First Quarter" },
  { min: 292.5, max: 337.5, name: "Waxing Gibbous" },
  { min: 337.5, max: 360, name: "Full Moon" }
];

function normalizeAngle(angleDeg: number): number {
  const a = angleDeg % 360;
  return a < 0 ? a + 360 : a;
}

export const MoonPhasesModel = {
  illuminationFractionFromPhaseAngleDeg(angleDeg: number): number {
    const radians = (angleDeg * Math.PI) / 180;
    return (1 + Math.cos(radians)) / 2;
  },

  phaseNameFromPhaseAngleDeg(angleDeg: number): string {
    const normalized = normalizeAngle(angleDeg);
    const match = PHASE_BINS.find((bin) => normalized >= bin.min && normalized < bin.max);
    return match ? match.name : "Full Moon";
  },

  daysSinceNewFromPhaseAngleDeg(angleDeg: number): number {
    const normalized = normalizeAngle(angleDeg);
    const daysFraction = ((normalized - 180 + 360) % 360) / 360;
    return daysFraction * SYNODIC_MONTH_DAYS;
  },

  waxingWaningFromPhaseAngleDeg(angleDeg: number): "Waxing" | "Waning" {
    const days = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(angleDeg);
    return days < SYNODIC_MONTH_DAYS / 2 ? "Waxing" : "Waning";
  },

  synodicMonthDays: SYNODIC_MONTH_DAYS
};
```

**Step 2: Export the model**

Add to `packages/physics/src/index.ts`:

```ts
export { MoonPhasesModel } from "./moonPhasesModel";
```

**Step 3: Run tests to verify pass**

Run: `corepack pnpm -C packages/physics test -- moonPhasesModel.test.ts`
Expected: PASS

**Step 4: Refactor (if needed)**
- Keep naming and unit annotations explicit.
- Avoid extra helpers beyond what the demo needs.

---

## Task 3: Add HTML structure test (RED)

**Files:**
- Create: `scripts/validate-moon-phases.test.mjs`

**Step 1: Write failing test (checks for legacy-parity elements)**

```js
import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const demoPath = path.join(
  process.cwd(),
  "apps/demos/src/demos/moon-phases/index.html"
);

function readHtml() {
  return fs.readFileSync(demoPath, "utf8");
}

describe("moon-phases demo structure", () => {
  test("includes orbital + phase views, timeline, animation, shadow toggle", () => {
    const html = readHtml();
    expect(html).toContain('id="orbital-svg"');
    expect(html).toContain('id="phase-svg"');
    expect(html).toContain('id="timeline-strip"');
    expect(html).toContain('id="btn-play"');
    expect(html).toContain('id="btn-pause"');
    expect(html).toContain('id="btn-step-forward"');
    expect(html).toContain('id="btn-step-back"');
    expect(html).toContain('id="speed-select"');
    expect(html).toContain('id="show-shadow-toggle"');
  });
});
```

**Step 2: Run test to verify failure**

Run: `corepack pnpm vitest run scripts/validate-moon-phases.test.mjs`
Expected: FAIL (elements missing).

---

## Task 4: Update moon-phases HTML structure (GREEN)

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html`

**Step 1: Replace stage with two-panel SVG views + timeline + animation controls**
- Keep `#cp-demo`, `#copyResults`, `#status`, `.cp-demo__drawer` intact.
- Controls panel: use `.cp-field`, `.cp-label`, `.cp-input`, `.cp-button` classes.
- Readouts panel: use `.cp-readout` items with labels containing units.
- Add shadow insight toggle and a link to `../eclipse-geometry/` (relative from `/play/moon-phases/`).

**Step 2: Ensure labels/units are explicit**
- Slider label: `Phase angle α (deg)`.
- Readouts: `Illumination fraction f`, `Illuminated (%)`, `Days since new (d)`, `Waxing/Waning`.

**Step 3: Run HTML test**

Run: `corepack pnpm vitest run scripts/validate-moon-phases.test.mjs`
Expected: PASS

---

## Task 5: Update moon-phases styling (layout + reduced motion)

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/style.css`

**Step 1: Replace demo-local control styles with layout-only CSS**
- Use CP tokens for spacing/borders; no new hex colors.
- Keep custom layout classes for stage grid, timeline, animation controls.

**Step 2: Add reduced-motion overrides**

```css
@media (prefers-reduced-motion: reduce) {
  .timeline-phase,
  .cp-button,
  .cp-readout {
    transition: none;
  }
}
```

**Step 3: Verify focus styles remain visible**
- No `outline: none` without replacement.

---

## Task 6: Refactor moon-phases main.ts to legacy-parity behavior

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/main.ts`

**Step 1: Write failing tests for any new logic moved into the model**
- If additional model behavior is needed (e.g., `phaseIndexFromAngleDeg`), add tests to `moonPhasesModel.test.ts` and run failing test first.

**Step 2: Implement legacy-parity interactions**
- Import `MoonPhasesModel` from `@cosmic/physics`.
- Implement:
  - drag/keyboard control of Moon in orbital view (no slider-only control)
  - timeline button navigation and active state
  - animation controls with speed selector and reset
  - shadow toggle that shows Earth’s shadow cone and updates live region
  - derived readouts from model (phase name, f, %, days, waxing/waning)
- Respect `prefers-reduced-motion`: disable continuous animation when `reduce`.

**Step 3: Update Station Mode + Help**
- Ensure Station Mode columns/rows match readouts and labels.
- Add Observable → Model → Inference framing in drawer/help.

**Step 4: Update export payload (v1)**
- Parameters: `Phase angle α (deg)`
- Readouts: `Phase name`, `Illumination fraction f`, `Illuminated (%)`, `Days since new (d)`, `Waxing/Waning`
- Keep order stable and labels unit-explicit.

**Step 5: Manual check (keyboard + reduced motion)**
- Tab through controls; verify focus-visible.
- Toggle reduced motion and ensure animation stays off.

---

## Task 7: Align station/instructor content with new readouts

**Files:**
- Modify: `apps/site/src/content/stations/moon-phases.md`
- Modify: `apps/site/src/content/instructor/moon-phases/model.md`

**Step 1: Update station observables to include days/waxing-waning if surfaced**
- Keep α (deg) and f in sync with demo labels.

**Step 2: Update instructor model doc**
- Point to `packages/physics/src/moonPhasesModel.ts` as the model source.
- Mention days‑since‑new readout and waxing/waning if present.

---

## Verification (run when implementation is complete)

- `corepack pnpm -C packages/physics test`
- `corepack pnpm -C packages/physics typecheck`
- `corepack pnpm vitest run scripts/validate-moon-phases.test.mjs`
- `corepack pnpm -r typecheck`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

## Out of Scope

- Starfield background (explicitly omitted).
- New dependencies or styling systems.
- Any other demos beyond moon-phases.
