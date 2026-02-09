# Parallax Distance SoTA Correction Plan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all known correctness/pedagogy drifts in `parallax-distance` so the demo, tests, and instructor materials are fully aligned with capture-first inference and scientifically correct uncertainty framing.

**Architecture:** Keep the existing live-orbit capture architecture in `apps/demos` and apply narrowly-scoped, test-driven patches across three layers: (1) math helper edge-case semantics, (2) UI uncertainty copy semantics, and (3) instructor/station assessment content consistency. Add regression checks so legacy slider-based pedagogy cannot re-enter.

**Tech Stack:** TypeScript + SVG demo (`apps/demos`), Vitest (`logic.test.ts`, `design-contracts.test.ts`), Playwright (`apps/site/tests`), Astro content markdown (`apps/site/src/content/instructor/**`).

**Relevant skills:** @cosmic-physics-modeling, @cosmic-content-authoring, @cosmic-instructor-materials-style, @cosmic-accessibility-audit

---

### Task 1: Lock Failing Tests for the Three Review Findings

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/logic.test.ts`
- Modify: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`
- Modify: `apps/site/tests/parallax-distance.spec.ts`

**Step 1: Add failing SNR edge-case test**
- In `logic.test.ts`, add assertion that `describeMeasurability(Infinity)` maps to highest quality tier (not "Not measurable").

**Step 2: Add failing uncertainty-label contract test**
- In `design-contracts.test.ts`, add assertion that uncertainty control text uses measurement framing (for example, `sigma_meas` wording), not ambiguous `sigma_p` framing.

**Step 3: Add failing instructor-content regression test**
- In Playwright spec, add checks on instructor pages to assert no legacy `parallax slider` language and presence of capture-first actions.

**Step 4: Run tests to verify they fail first**
Run:
```bash
corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts src/demos/parallax-distance/design-contracts.test.ts
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e tests/parallax-distance.spec.ts
```
Expected: FAIL with explicit assertions tied to the three review findings.

**Step 5: Commit failing-test scaffolding**
```bash
git add apps/demos/src/demos/parallax-distance/logic.test.ts \
        apps/demos/src/demos/parallax-distance/design-contracts.test.ts \
        apps/site/tests/parallax-distance.spec.ts
git commit -m "test(parallax): lock sota correctness regressions for snr copy and pedagogy"
```

---

### Task 2: Fix Physics Helper Edge Case (Infinite SNR Classification)

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/logic.ts`
- Test: `apps/demos/src/demos/parallax-distance/logic.test.ts`

**Step 1: Implement minimal classification fix**
- Update `describeMeasurability` so infinite positive SNR maps to top tier (`Excellent`), while invalid/negative cases remain `Not measurable`.

**Step 2: Confirm no inference-path regression**
- Keep all existing threshold boundaries (`>=10`, `>=5`) unchanged for finite values.

**Step 3: Run targeted logic tests**
Run:
```bash
corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts
```
Expected: PASS.

**Step 4: Commit**
```bash
git add apps/demos/src/demos/parallax-distance/logic.ts \
        apps/demos/src/demos/parallax-distance/logic.test.ts
git commit -m "fix(parallax): correct infinite-snr quality classification"
```

---

### Task 3: Correct Uncertainty Semantics in Demo UI + Readouts

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`
- Modify: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/parallax-distance/main.integration.test.ts`

**Step 1: Rename control copy to measurement uncertainty**
- Replace ambiguous `Astrometric uncertainty sigma_p` with explicit per-epoch measurement wording (for example `Per-epoch astrometric uncertainty sigma_meas`).

**Step 2: Align live-region/help/readout wording**
- Ensure on-screen helper text, help panel bullets, and status messages consistently reference measured/inferred uncertainty distinction (`sigma_meas -> sigma_p_hat`).

**Step 3: Verify accessibility/legibility remains intact**
- Keep control IDs unchanged unless absolutely necessary; if changed, update integration/e2e tests and maintain keyboard/focus behavior.

**Step 4: Run demo tests**
Run:
```bash
corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/design-contracts.test.ts src/demos/parallax-distance/main.integration.test.ts
```
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/demos/src/demos/parallax-distance/index.html \
        apps/demos/src/demos/parallax-distance/main.ts \
        apps/demos/src/demos/parallax-distance/design-contracts.test.ts \
        apps/demos/src/demos/parallax-distance/main.integration.test.ts
git commit -m "fix(parallax-ui): clarify sigma_meas semantics and keep inference framing consistent"
```

---

### Task 4: Bring Instructor/Assessment/Backlog Docs to Capture-First SoTA Standard

**Files:**
- Modify: `apps/site/src/content/instructor/parallax-distance/index.md`
- Modify: `apps/site/src/content/instructor/parallax-distance/assessment.md`
- Modify: `apps/site/src/content/instructor/parallax-distance/backlog.md`
- Modify: `apps/site/src/content/instructor/parallax-distance/activities.md` (only if any residual drift remains)

**Step 1: Remove obsolete slider instructions**
- Replace references like `demo slider` / `set p` with capture-first actions (`set distance`, `capture A`, `capture B`, read `deltaTheta`, `B_eff`, `p_hat`, `d_hat`).

**Step 2: Align assessment prompts with new observables**
- Rewrite clicker setup text so uncertainty and SNR questions refer to inferred quantities from captures.

**Step 3: Update backlog P0 phrasing to current interaction model**
- Replace `parallax slider` references with orbit/capture controls and uncertainty controls.

**Step 4: Update `last_updated` stamps to current date**
- Set touched instructor docs to `2026-02-09`.

**Step 5: Run content + e2e checks**
Run:
```bash
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e tests/parallax-distance.spec.ts
```
Expected: PASS; no unicode-math validation failures.

**Step 6: Commit**
```bash
git add apps/site/src/content/instructor/parallax-distance/index.md \
        apps/site/src/content/instructor/parallax-distance/assessment.md \
        apps/site/src/content/instructor/parallax-distance/backlog.md \
        apps/site/src/content/instructor/parallax-distance/activities.md
git commit -m "docs(parallax): align instructor and assessment guidance with capture-first pedagogy"
```

---

### Task 5: Comprehensive SoTA Verification Gate (Code + Physics + Pedagogy)

**Files:**
- No new production files required unless failures are found.

**Step 1: Run full parallax demo test gate**
Run:
```bash
corepack pnpm -C apps/demos test -- --run src/demos/parallax-distance/logic.test.ts src/demos/parallax-distance/design-contracts.test.ts src/demos/parallax-distance/main.integration.test.ts
```
Expected: PASS.

**Step 2: Run full build gate**
Run:
```bash
corepack pnpm build
```
Expected: PASS across unicode-math validator + demos build + site build.

**Step 3: Run typecheck gate**
Run:
```bash
corepack pnpm -r typecheck
```
Expected: PASS (existing non-blocking hints acceptable, no errors).

**Step 4: Run parallax e2e gate**
Run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e tests/parallax-distance.spec.ts
```
Expected: PASS.

**Step 5: Perform manual pedagogy/physics smoke pass**
- Open `/play/parallax-distance/` and verify:
  - capture A/B workflow naturally communicates causality,
  - `B_eff` warning appears for weak projected baseline,
  - exaggeration changes visuals only,
  - uncertainty messaging explicitly distinguishes measurement vs inferred uncertainty.

**Step 6: Commit verification artifacts (if any) + push**
```bash
git status -sb
git push origin main
```
Expected: clean working tree and pushed final fix set.

---

### Task 6: Post-fix Audit Note (Close the Loop)

**Files:**
- Modify: `docs/audits/migrations/parallax-distance-parity.md`

**Step 1: Record closure of three findings**
- Add dated subsection documenting:
  - uncertainty semantics fix,
  - infinite-SNR classification correction,
  - instructor-doc alignment completion.

**Step 2: Update promotion recommendation**
- If all gates pass and no open P0 items remain, move recommendation from `experimental` toward next readiness state per repo conventions.

**Step 3: Commit**
```bash
git add docs/audits/migrations/parallax-distance-parity.md
git commit -m "docs(parallax-audit): record sota correction closure and readiness recommendation"
```
