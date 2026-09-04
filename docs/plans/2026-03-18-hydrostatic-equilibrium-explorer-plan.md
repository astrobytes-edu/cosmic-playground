# Hydrostatic Equilibrium Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-quality ASTR 201 exhibit that teaches the hydrostatic-equilibrium reasoning chain from gravity to core-temperature scaling inside the native Cosmic Playground demo shell.

**Architecture:** Add a new `packages/physics` hydrostatic model with unit-explicit CGS APIs and tests, then build a new `apps/demos` instrument that reuses the shared shell, KaTeX runtime, challenge patterns, and content pipeline. The demo should keep the observable first: star cutaway + local shell patch, coordinated radial profile plots, live reasoning cards, and an embedded challenge deck.

**Tech Stack:** TypeScript, Vite demo runtime, Astro content collections, KaTeX via `@cosmic/runtime`, Vitest, SVG/Canvas rendering, shared Cosmic theme tokens.

---

### Task 1: Model-first hydrostatic utilities

**Files:**
- Create: `packages/physics/src/hydrostaticEquilibriumModel.ts`
- Create: `packages/physics/src/hydrostaticEquilibriumModel.test.ts`
- Modify: `packages/physics/src/index.ts`

**Plan:**
1. Write failing tests for the uniform-density toy model:
   - exact mean density
   - exact central pressure profile with `P(R)=0`
   - monotonic `M(r)`, `g(r)`, and `P(r)`
   - zero/finite limiting cases at `r=0` and `r=R`
2. Run the targeted physics test file and verify it fails because the new model is missing.
3. Implement `HydrostaticEquilibriumModel` with unit-explicit CGS functions:
   - solar conversions
   - uniform-density profile
   - centrally concentrated toy profile
   - central pressure and core-temperature scales
   - shell-support helpers for balanced / under / over-supported states
4. Re-run the targeted physics test file and keep it green.
5. Export the model from `packages/physics/src/index.ts`.

### Task 2: Demo logic utilities

**Files:**
- Create: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/logic.ts`
- Create: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/logic.test.ts`

**Plan:**
1. Write failing tests for demo-level pure helpers:
   - slider normalization and preset application
   - safe scientific / normalized formatting
   - profile sampling and monotonicity
   - challenge-answer evaluation helpers
   - reasoning-card derived values (shell readouts, normalized solar scaling)
2. Run the targeted demo logic test and verify it fails.
3. Implement only the pure helpers required by the tests.
4. Re-run the targeted demo logic test until it passes.

### Task 3: Demo shell and pedagogy markup

**Files:**
- Create: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/index.html`
- Create: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/style.css`
- Create: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/design-contracts.test.ts`

**Plan:**
1. Write a failing design-contract test that checks for:
   - `cp-demo`, `copyResults`, `status`, `cp-demo__drawer`
   - starfield, utility toolbar, readout strip, stage tabs, accordion drawer
   - hero shell SVG, profile plot surface, reasoning ladder, challenge panel
   - KaTeX stylesheet, model-limit note, support-mode controls, preset buttons
2. Add the HTML scaffold using the canonical shell:
   - controls sidebar
   - stage with hero + profiles + reasoning panel
   - readout strip
   - drawer accordions for “What to notice”, “Model notes”, “Support is not fusion”, and derivations
3. Add token-first CSS using `stub-demo.css` plus local layout polish.
4. Run the design-contract test to confirm the structure is present.

### Task 4: Demo orchestration and rendering

**Files:**
- Create: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/main.ts`

**Plan:**
1. Build state + preset handling around the new hydrostatic model.
2. Reuse runtime helpers:
   - `createInstrumentRuntime`
   - `initMath`
   - `initTabs`
   - `initPopovers`
   - `initStarfield`
   - `setLiveRegionText`
3. Implement stage rendering:
   - star cutaway with enclosed-mass fill
   - local shell patch inset with force arrows
   - profile-plot tabs with vertical guide + highlighted current value
   - live reasoning ladder + equation cards with optional derivations
4. Implement the embedded challenge/checkpoint workflow.
5. Implement copy-results export payload with unit-explicit labels.

### Task 5: Site content + exhibit wiring

**Files:**
- Create: `apps/site/src/content/demos/hydrostatic-equilibrium-explorer.md`
- Create: `apps/site/src/content/stations/hydrostatic-equilibrium-explorer.md`
- Create: `apps/site/src/content/instructor/hydrostatic-equilibrium-explorer/index.md`
- Create: `apps/site/src/content/instructor/hydrostatic-equilibrium-explorer/activities.md`
- Create: `apps/site/src/content/instructor/hydrostatic-equilibrium-explorer/assessment.md`
- Create: `apps/site/src/content/instructor/hydrostatic-equilibrium-explorer/model.md`
- Create: `apps/site/src/content/instructor/hydrostatic-equilibrium-explorer/backlog.md`
- Create: `docs/audits/migrations/hydrostatic-equilibrium-explorer-parity.md`

**Plan:**
1. Add the demo content entry so `/exhibits/hydrostatic-equilibrium-explorer/` is generated automatically.
2. Add station-card content with prediction, scaling, and misconception prompts.
3. Add instructor bundle content aligned to ASTR 201 usage.
4. Add a parity/readiness audit stub so the new demo satisfies content expectations.

### Task 6: Verification

**Files:**
- No new files expected.

**Plan:**
1. Run targeted tests first:
   - `corepack pnpm -C packages/physics test -- hydrostaticEquilibriumModel.test.ts`
   - `corepack pnpm -C apps/demos test -- hydrostatic-equilibrium-explorer/logic.test.ts`
   - `corepack pnpm -C apps/demos test -- hydrostatic-equilibrium-explorer/design-contracts.test.ts`
2. Run type/build gates:
   - `corepack pnpm -r typecheck`
   - `corepack pnpm build`
3. If feasible, run the site e2e gate:
   - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
4. Summarize evidence, assumptions, and follow-up recommendations.
