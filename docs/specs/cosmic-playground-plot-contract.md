# Cosmic Playground - Plot Instrument Contract

**Status:** Draft (proposed for enforcement)  
**Date:** 2026-02-06  
**Audience:** anyone adding or editing interactive plots in demos

## Goal

Treat plots as first-class scientific instruments with a single runtime contract, so demos stay consistent, testable, accessible, and maintainable across migration waves.

This contract applies whenever a demo renders an interactive plot (for example, EOS curves, phase-space trajectories, or parameter sweeps).

## Related contracts

- `docs/specs/cosmic-playground-prd.md` (Sections 5.7.1, 5.8.5, 6.1, 8.4, 8.5, 8.11, 8.12)
- `docs/specs/cosmic-playground-site-spec.md` (Section 9 Demo runtime standard)
- `docs/specs/cosmic-playground-model-contract.md` (units and physics correctness)
- `docs/specs/cosmic-playground-data-contract.md` (dataset/schema invariants)

## Non-negotiables

### 1) Plot rendering is centralized

- Demos must not call Plotly APIs directly (`newPlot`, `react`, etc.).
- Demos must not import `plotly.js` directly.
- Plot rendering is owned by `packages/runtime/plots/plotEngine.ts`.

Reason: one place for theming, mobile behavior, accessibility defaults, and performance fixes.

### 2) Plots are pure functions of state

Plot outputs must be derived only from demo state and a declared plot contract.

```ts
(state, plotSpec) -> rendered figure
```

Plot specs must not use hidden mutable state, ad-hoc DOM queries, or side effects.

### 3) Demos provide data semantics, not rendering policy

Demos may define:
- axis meaning and units
- trace data from state
- allowed interaction affordances (zoom/pan/hover on or off)

Demos may not define:
- global margins, fonts, or token mapping
- mobile breakpoint behavior
- library-level performance settings

Those belong to runtime/theme defaults.

### 4) Accessibility and responsive behavior are runtime-owned

- Plot interaction must be keyboard reachable.
- Focus states and announcements must follow shared runtime accessibility patterns.
- Reduced motion must be honored.
- Mobile behavior must come from runtime rules, not per-demo CSS hacks.

### 5) Units and notation policy applies to plot labels

- Axis labels, legend labels, and readouts must use explicit units when values are unitful.
- UI notation policy remains active: `D` means diameter and `d` means distance.
- Plot labels must not introduce natural-unit language or `G = 1`.

### 6) Export/readout consistency is required

If a plotted quantity is surfaced in readouts/exports:
- naming and units must match between plot labels, readout rows, and export rows
- export schema/version rules from PRD Section 8.12 remain binding

## Runtime module structure

Authoritative location:

```text
packages/runtime/
  plots/
    plotEngine.ts
    plotTypes.ts
    plotDefaults.ts
    plotUtils.ts
```

This module may wrap Plotly today, but the demo contract must stay library-agnostic so renderer swaps remain possible.

## Authoritative plot contract

```ts
export interface AxisSpec {
  label: string;
  unit?: string;
  scale?: "linear" | "log";
}

export interface PlotSpec<State> {
  id: string;
  axes: { x: AxisSpec; y: AxisSpec };
  init(state: State): PlotInit;
  update(state: State): PlotUpdate;
  animate?(state: State, dtMs: number): PlotUpdate | null;
  interaction?: { zoom?: boolean; pan?: boolean; hover?: boolean };
}

export interface PlotTrace {
  id: string;
  label: string;
  points: Array<{ x: number; y: number }>;
}

export interface PlotInit {
  traces: PlotTrace[];
  xDomain?: [number, number];
  yDomain?: [number, number];
}

export interface PlotUpdate {
  traces?: PlotTrace[];
  xDomain?: [number, number];
  yDomain?: [number, number];
}

export interface PlotController<State> {
  update(state: State): void;
  destroy(): void;
}

export function mountPlot<State>(
  container: HTMLElement,
  spec: PlotSpec<State>,
  initialState: State
): PlotController<State>;
```

Current runtime implementation renders via Plotly inside `@cosmic/runtime` while preserving the same ownership boundary (demos provide state semantics, runtime owns rendering policy). A future renderer swap is allowed only inside runtime.

## Lifecycle contract

1. `mountPlot(...)`
- applies runtime defaults and theme tokens
- calls library mount once
- returns controller with `update` and `destroy`

2. `update(state)`
- computes new `PlotUpdate` from pure `spec.update(state)`
- uses runtime-owned incremental update path
- throttles high-frequency updates

3. `animate(state, dtMs)` (optional)
- only used when the demo has animation
- must return data delta or `null`

4. `destroy()`
- removes listeners/observers and internal timers
- releases plotting resources

## Forbidden patterns

- direct Plotly import/use in demo-local code
- per-demo CSS overrides against renderer internals (for example `.js-plotly-plot ...`)
- plot code that queries controls/readouts DOM for data
- ad-hoc mobile branches in each demo for plot layout

## Verification and enforcement

### Required tests

- Contract tests for plot specs (`init`, `update`, optional `animate`)
- Runtime unit tests for mount/update/destroy behavior
- E2E smoke checks for keyboard path, reduced-motion behavior, and viewport adaptation on at least one plot demo

### Machine enforcement (to add/enforce in CI)

- `scripts/validate-plot-contract.mjs` must fail when:
  - demo code imports Plotly directly
  - forbidden direct Plotly calls appear outside `packages/runtime/plots`
  - required axis metadata is missing
- contract checks should be included in the migration contract enforcement bundle (PRD Section 8.11)

## Launch-gate integration

For plot-bearing demos, these PRD gates are mandatory:

- Section 5.7.1: readiness metadata remains required
- Section 6.1: build/e2e/accessibility gates remain required
- Section 8.4: parity audit must include plot behavior and interaction parity
- Section 8.5: release-state promotion blocked by open plot-contract failures
- Section 8.12: export compatibility matrix updated when plot-linked export fields change

## Additional spec additions recommended

1. Readiness metadata extension for plot demos (PRD 5.7.1)
- add `plotContractVersion: 1` and `plotParityAudit: "pass|fail|n/a"` for demos that render plots

2. CI contract enforcement extension (PRD 5.8.5 and 8.11)
- add no-direct-plotly validation and plot-axis metadata checks to required CI status

3. Migration parity template extension (PRD 8.4)
- explicitly include a "plot instrument parity" row (behavior, labels/units, interaction defaults)

4. Export compatibility matrix guidance (PRD 8.12)
- add a note when exported values are plot-derived, so downstream worksheets are protected from silent relabeling

## PR review checklist

- [ ] Demo plot code uses `mountPlot` and `PlotSpec`; no direct Plotly calls
- [ ] Axis semantics and units are explicit and match readouts/exports
- [ ] Runtime controls mobile/responsive behavior (no per-demo renderer CSS hacks)
- [ ] Keyboard/reduced-motion behavior verified for plot interactions
- [ ] Parity audit includes plot behavior where migration is involved
- [ ] If export fields changed, compatibility matrix updated in same PR
