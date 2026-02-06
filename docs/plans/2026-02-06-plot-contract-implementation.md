# Plot Contract + EOS Runtime Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement enforceable plot-contract infrastructure (validator + PRD wiring) and ship a shared runtime plot primitive used by `eos-lab` for real-time interactive pressure curves.

**Architecture:** Add a runtime-owned SVG plot engine in `@cosmic/runtime` with a typed `PlotSpec` contract and centralized styling/resize/update lifecycle. Enforce contract usage via `scripts/validate-plot-contract.mjs` and wire it into lint/build/test gates. Update PRD + content schema metadata fields for plot-bearing demos, then migrate `eos-lab` to use `mountPlot` for live updates.

**Tech Stack:** TypeScript, Vitest, Node ESM validation scripts, existing Cosmic Playground runtime/theme tokens.

### Task 1: Add runtime plot primitive + tests

**Files:**
- Create: `packages/runtime/src/plots/plotTypes.ts`
- Create: `packages/runtime/src/plots/plotDefaults.ts`
- Create: `packages/runtime/src/plots/plotUtils.ts`
- Create: `packages/runtime/src/plots/plotEngine.ts`
- Create: `packages/runtime/src/plots/plotEngine.test.ts`
- Modify: `packages/runtime/src/index.ts`

**Acceptance criteria:**
- `mountPlot` exists and returns `{ update, destroy }`.
- Plot rendering is centralized in runtime with responsive sizing + RAF-throttled updates.
- `PlotSpec` requires axis labels and supports state-driven trace updates.
- Runtime tests validate mount/update/destroy behavior.

### Task 2: Enforce plot contract in scripts/CI

**Files:**
- Create: `scripts/validate-plot-contract.mjs`
- Create: `scripts/validate-plot-contract.test.mjs`
- Modify: `scripts/build.mjs`
- Modify: `package.json`

**Acceptance criteria:**
- Validator flags direct Plotly usage outside runtime plot module.
- Validator flags `mountPlot(...)` usage without axis metadata in spec.
- `pnpm lint`, `pnpm build`, and root test command include plot-contract validation.

### Task 3: Wire PRD + metadata schema additions

**Files:**
- Modify: `docs/specs/cosmic-playground-prd.md`
- Modify: `apps/site/src/content/config.ts`
- Modify: `apps/site/src/content/demos/eos-lab.md`

**Acceptance criteria:**
- PRD sections 5.7.1, 5.8.5, 8.4, 8.11 mention plot-contract gates.
- Demo content schema supports `plotContractVersion` and `plotParityAudit`.
- `eos-lab` metadata includes those fields.

### Task 4: Implement EOS live interactive plot using runtime contract

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html`
- Modify: `apps/demos/src/demos/eos-lab/style.css`
- Modify: `apps/demos/src/demos/eos-lab/main.ts`
- Modify: `apps/demos/src/demos/eos-lab/design-contracts.test.ts`
- Modify: `docs/audits/migrations/eos-lab-parity.md`

**Acceptance criteria:**
- EOS demo mounts runtime plot and updates in real time as sliders/presets change.
- Plot uses explicit cgs units and channel labels aligned with readouts/exports.
- Design-contract tests assert plot container + runtime contract usage.
- Parity audit documents plot instrument status.

### Task 5: Verify and report

**Commands:**
- `corepack pnpm -C packages/runtime test`
- `corepack pnpm -C apps/demos test -- eos-lab`
- `corepack pnpm test:invariants`
- `corepack pnpm test:plot-contract`
- `corepack pnpm lint`

**Acceptance criteria:**
- Commands pass (or failures are reported precisely with blockers).
- Final report includes files changed, evidence, and follow-up risks.
