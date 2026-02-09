# Parallax Distance Live-Capture Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign `parallax-distance` so students can see causality in real time (Earth motion -> line-of-sight change -> apparent shift), then capture two epochs and infer parallax/distance with projection-correct math.

**Architecture:** Keep the existing shell contract (`sidebar`, `stage`, `readouts`, `drawer`) and migrate demo behavior to a live-orbit capture workflow. Use a pure-logic module for coordinate/inference math (including deterministic noise and effective-baseline projection) and keep DOM/render orchestration in `main.ts`. Preserve runtime export shape (`ExportPayloadV1`) and station mode integration while changing labels/columns to distance-first and measurement-correct framing.

**Tech Stack:** TypeScript, SVG, Vitest (`logic.test.ts`, `main.integration.test.ts`, `design-contracts.test.ts`), Playwright (`apps/site/tests/parallax-distance.spec.ts`), `@cosmic/runtime`, `@cosmic/physics`, `@cosmic/data-astr101`.

## Contracts and design anchors

- PRD readiness/tests/contracts: `docs/specs/cosmic-playground-prd.md` (5.7.1, 5.8.x, 6.1, 8.4, 8.5, 8.11, 8.12)
- Model contract and units: `docs/specs/cosmic-playground-model-contract.md`
- Shell/layout invariants: `packages/theme/styles/demo-shell.css`
- Existing demo surface:
  - `apps/demos/src/demos/parallax-distance/index.html`
  - `apps/demos/src/demos/parallax-distance/main.ts`
  - `apps/demos/src/demos/parallax-distance/logic.ts`

---

### Task 1: Lock the coordinate and inference contract in pure logic tests

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/logic.test.ts`

**Step 1: Add failing tests for geometry basis consistency**
- Add tests that require `axisHat` be perpendicular to `starDirHat` and unit-normalized.
- Add tests that `starDirHat={0,1}` implies `axisHat={1,0}` default.

**Step 2: Add failing tests for axis-based detector model**
- Add tests proving detector `Now` motion lies on one axis (back-and-forth), not circular 2D drift.

**Step 3: Add failing tests for projection-based inference**
- Add tests for:
  - `deltaThetaSignedMas = dot(deltaOffset, axisHat)`
  - `pHatMas = abs(deltaThetaSignedMas) / bEff`
  - `bEff = abs(dot((rB-rA), axisHat))`
- Include one synthetic known-answer case where p recovery is exact.

**Step 4: Add failing tests for deterministic noise + degenerate baseline**
- Add tests that seeded noise is repeatable for identical capture metadata.
- Add tests that `bEff <= 0` returns non-computable sentinel/readout placeholders and no `NaN`/`Infinity` inference.

**Step 5: Run targeted tests and verify red**
Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts`
Expected: FAIL on new tests.

---

### Task 2: Implement the revised math/inference API in `logic.ts`

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/logic.ts`
- Modify: `apps/demos/src/demos/parallax-distance/logic.test.ts`

**Step 1: Add coordinate helpers**
- Implement helpers for:
  - `normalizeVec2`
  - `perp`
  - `dot`
  - `earthPosAuFromPhaseDeg`

**Step 2: Add basis builder**
- Implement `buildParallaxBasis(starDirHat)` returning normalized `starDirHat` + perpendicular `axisHat`.

**Step 3: Add detector mapping helpers**
- Implement `detectorTrueOffsetMasFromPhase(...)` using axis projection only.
- Keep render exaggeration helpers explicitly separate from inference helpers.

**Step 4: Add capture inference helpers**
- Implement functions to compute:
  - `baselineVecAu`
  - `baselineEffAu`
  - `deltaThetaSignedMas`
  - `deltaThetaMas`
  - `pHatMas`
  - `dHatPc`
- Return an explicit `computable` flag and warning code when `bEff <= threshold`.

**Step 5: Add deterministic Gaussian noise helper**
- Seed hash input: `{epochLabel, roundedPhaseDeg, distancePc, sigmaMas}` + fixed salt string.
- Noise applied along `axisHat` only.

**Step 6: Run tests and verify green**
Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts`
Expected: PASS.

---

### Task 3: Redesign markup for live orbit + capture workflow

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Test: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`

**Step 1: Replace phase-first controls with capture workflow controls**
- Keep distance first.
- Add controls: Play/Pause, Capture A, Capture B, Swap A/B, Clear captures.
- Keep detector modes (overlay/difference/blink), sigma, exaggeration.

**Step 2: Add compact workflow stepper**
- Add visible 1-2-3 progress microcopy:
  1) Set distance
  2) Capture A
  3) Capture B

**Step 3: Update orbit panel semantics**
- Draw and label:
  - target direction (`starDirHat`)
  - parallax axis (`axisHat`)
  - live Earth marker and optional captured Earth markers
  - baseline chord for A/B

**Step 4: Update detector panel semantics**
- Keep fixed background stars.
- Show live `Now`, captured A/B, difference vector using signed delta direction.

**Step 5: Update readout labels for correctness**
- Replace `Measured separation 2p` with:
  - `Measured shift Δθ`
  - `Effective baseline B_eff`
  - `Inferred parallax p̂`
  - `Equivalent Jan-Jul shift 2p̂ (derived)`
- Label true vs inferred distances explicitly.

**Step 6: Update design-contract tests to enforce new required nodes/text**
- Ensure old shell/runtime markers remain intact.
- Add assertions for target-direction + parallax-axis labels and capture controls.

---

### Task 4: Refactor `main.ts` to live-capture state machine + synchronized rendering

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`
- Test: `apps/demos/src/demos/parallax-distance/main.integration.test.ts`

**Step 1: Replace old fixed-epoch state with new capture model**
- Add `isPlaying`, `orbitPhaseDegNow`, `captureA`, `captureB`, `starDirHat`, `axisHat`.

**Step 2: Implement animation loop**
- Use RAF-driven orbit progression when playing.
- Under reduced motion: default paused and no blink alternation.

**Step 3: Implement capture actions**
- `Capture A <- Now`, `Capture B <- Now`, `Swap A/B`, `Clear captures`.
- Capture stores earth AU position, true + measured detector offsets.

**Step 4: Implement inference/readout pipeline from capture pair**
- Compute `Δθ`, `B_eff`, `p̂`, `d̂`, and uncertainty outputs only when computable.
- If not computable, show placeholders and a status warning.

**Step 5: Keep export contract shape stable**
- Keep `ExportPayloadV1` shape (`version`, `timestamp`, `parameters`, `readouts`, `notes`) unchanged.
- Update row names/values to reflect corrected measurement semantics.

**Step 6: Update live-region announcements**
- Announce capture events, computability state, and inferred outputs.

**Step 7: Run integration tests and verify green**
Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/main.integration.test.ts`
Expected: PASS.

---

### Task 5: Update demo styling for new controls and axis cues

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/style.css`
- Test: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`

**Step 1: Style capture workflow controls and stepper**
- Ensure strong affordances for incomplete/complete capture states.

**Step 2: Add visual hierarchy for direction/axis overlays**
- Distinguish target direction, parallax axis, live vs captured markers.

**Step 3: Keep shell compatibility + token constraints**
- No hardcoded hex or raw rgba literals.
- Preserve mobile stack behavior consistent with shared shell.

**Step 4: Ensure focus-visible and reduced-motion compliance**
- Focus contrast on capture controls and any draggable/interactive stage element.

---

### Task 6: Update station mode and copy-results semantics

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`
- Modify: `apps/site/src/content/stations/parallax-distance.md`
- Modify: `apps/site/src/content/demos/parallax-distance.md`

**Step 1: Update station table columns to distance-first measurement flow**
- Include `distance true`, `Δθ`, `B_eff`, `p̂`, `d̂`, uncertainty/SNR quality.

**Step 2: Update station synthesis prompt**
- Prompt students to explain why small `B_eff` or large `sigma` weakens inference.

**Step 3: Update demo content play steps**
- Replace legacy Jan/Jul-only language with live capture workflow language.

---

### Task 7: Extend E2E pedagogy acceptance tests

**Files:**
- Modify: `apps/site/tests/parallax-distance.spec.ts`

**Step 1: Add causality test**
- Validate live orbit changes detector `Now` position while background stays fixed.

**Step 2: Add capture workflow tests**
- Validate capture A/B produce inference readouts.
- Validate swap flips signed direction but preserves absolute inference.

**Step 3: Add degenerate-baseline guard test**
- Capture near-identical phases, assert warning and placeholder inference.

**Step 4: Add reduced-motion test**
- Emulate reduced motion, assert autoplay defaults paused and blink disabled.

**Step 5: Keep screenshot tests deterministic**
- For screenshot scenarios: paused, blink off, fixed captures.

---

### Task 8: Instructor material alignment + parity artifact update

**Files:**
- Modify: `apps/site/src/content/instructor/parallax-distance/index.md`
- Modify: `apps/site/src/content/instructor/parallax-distance/activities.md`
- Modify: `apps/site/src/content/instructor/parallax-distance/model.md`
- Modify: `docs/audits/migrations/parallax-distance-parity.md`

**Step 1: Update instructor narrative to capture workflow**
- Replace slider-era phrasing with live-orbit capture language.

**Step 2: Update activity prompts to truth vs inferred framing**
- Use `d_true` and `d_hat` framing where appropriate.

**Step 3: Update model note assumptions**
- Include axis-based measurement operator and effective baseline concept.

**Step 4: Replace parity audit placeholders with concrete deltas**
- Record intentional UX/physics changes and rationale.

---

### Task 9: Full verification gates

**Files:**
- No file changes expected.

**Step 1: Run demo vitest suites**
Run: `corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts src/demos/parallax-distance/main.integration.test.ts src/demos/parallax-distance/design-contracts.test.ts`
Expected: PASS.

**Step 2: Run site E2E for parallax**
Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/parallax-distance.spec.ts`
Expected: PASS (with screenshot tests either skipped or deterministic baselines passing).

**Step 3: Run build + launch gates**
Run:
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
Expected: PASS.

---

## Acceptance criteria

- Students can visibly follow continuous causality from orbit motion to detector shift.
- Inference is mathematically correct for arbitrary capture phases using axis projection and effective baseline.
- UI labeling is measurement-correct (`Δθ`, `B_eff`, `p̂`, `d̂`) and pedagogically explicit (`true` vs `inferred`).
- Deterministic noise and deterministic screenshot states eliminate flaky tests.
- Shell, export schema shape, accessibility, and reduced-motion requirements remain contract-safe.
