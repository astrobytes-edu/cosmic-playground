# Blackbody + Stars ZAMS Hardening Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all accepted review findings in `blackbody-radiation` and `stars-zams-hr` while preserving existing layout, enforcing clear physics pedagogy, and standardizing solar-unit + LaTeX math notation.

**Architecture:** Keep both demos structurally intact; apply narrow, test-driven patches across (1) UI copy/readout semantics, (2) preset taxonomy completeness, (3) override-mode interaction behavior, and (4) physics-model test coverage at metallicity boundaries. Avoid changing demo shells or introducing new layout systems.

**Tech Stack:** Vite + TypeScript demos, Vitest, Astro content frontmatter/markdown, shared `@cosmic/physics` model APIs, KaTeX runtime (`initMath`).

**Relevant skills:** @cosmic-ui-ux, @cosmic-physics-modeling, @cosmic-export-contracts, @cosmic-accessibility-audit

---

## Task 1: Lock Regression Tests for the Accepted Findings

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/stars-zams-hr/design-contracts.test.ts`
- Modify: `packages/physics/src/zamsTout1996Model.test.ts`

**Step 1: Add failing blackbody contract tests**

Add tests that assert:
- `Human` preset exists in blackbody HTML.
- Understand-tab Stefan-Boltzmann wording uses **surface flux** language (not total emitted flux).
- Blackbody luminosity readout is dimensionless and does not append `L☉` unit chip.

**Step 2: Add failing stars contract tests**

Add tests that assert:
- Ratio readouts (`L/L_{\odot}`, `R/R_{\odot}`, `M/M_{\odot}`) are treated as dimensionless (no solar-symbol unit chip appended).
- HR axis annotation text is directionally consistent (hotter-left labeling).
- Override mode has explicit assumption UI text and metallicity interaction state exposed in DOM (disabled or clearly not-applied flag).

**Step 3: Add failing edge-metallicity physics tests**

Add tests for `Z = 1e-4` and `Z = 0.03`:
- `Teff(M)` monotonicity across representative mass grid.
- inversion consistency `M -> Teff -> M` with tolerance.

**Step 4: Run tests to verify failure first**

Run:
```bash
corepack pnpm -C apps/demos test blackbody-radiation stars-zams-hr
corepack pnpm -C packages/physics test zamsTout1996Model.test.ts
```
Expected: New tests fail with clear assertion messages tied to missing/incorrect behavior.

**Step 5: Commit test scaffolding**

```bash
git add apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts \
        apps/demos/src/demos/stars-zams-hr/design-contracts.test.ts \
        packages/physics/src/zamsTout1996Model.test.ts
git commit -m "test(demos,physics): lock pending blackbody and zams hardening assertions"
```

---

## Task 2: Fix Blackbody Presets + Pedagogical Copy (Thermal Scope)

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/index.html`
- Modify: `apps/demos/src/demos/blackbody-radiation/main.ts`

**Step 1: Add missing Human thermal preset**

In blackbody preset bank, add:
- `Human` with `data-temp-k="310"` (thermal anchor).

**Step 2: Correct Stefan-Boltzmann wording in Understand tab**

Change wording from total-emission phrasing to explicit surface-flux language:
- `F = \sigma T^4` as **surface emitted flux**.
- keep luminosity caveat separate (requires radius assumption).

**Step 3: Keep color misconception guardrail explicit**

Ensure wording stays in LaTeX-aware notation and includes:
- perceived color is integrated over visible-band contribution,
- not only `\lambda_{\rm peak}`.

**Step 4: Align copy/export note strings with updated wording**

Update `exportResults().notes` strings so copied results match the in-demo pedagogy language.

**Step 5: Run targeted demo tests**

Run:
```bash
corepack pnpm -C apps/demos test blackbody-radiation
```
Expected: Passing tests, including new preset/copy assertions.

**Step 6: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/index.html \
        apps/demos/src/demos/blackbody-radiation/main.ts
git commit -m "fix(blackbody): add human preset and correct surface-flux pedagogy text"
```

---

## Task 3: Enforce Solar-Unit + LaTeX Semantics for Dimensionless Readouts

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/index.html`
- Modify: `apps/demos/src/demos/stars-zams-hr/index.html`
- Modify: `apps/demos/src/demos/stars-zams-hr/main.ts`

**Step 1: Normalize labels to LaTeX solar notation**

Use labels such as:
- `L/L_{\odot}`
- `R/R_{\odot}`
- `M/M_{\odot}`
- `T_{\rm eff}`

**Step 2: Remove unit-chip implication for ratios**

For dimensionless ratios, remove solar-unit chip display (no `L☉`, `R☉`, `M☉` chip). Keep values as pure numbers.

**Step 3: Keep absolute quantities with units only where dimensional**

Example:
- `T_{\rm eff}` keeps `K`.
- ratios remain unitless.

**Step 4: Keep copy/export fields unit-explicit and unambiguous**

Adjust export readout names where needed:
- include `(dimensionless)` for ratios in payload labels,
- preserve backward compatibility (`ExportPayloadV1`, no schema break).

**Step 5: Run tests**

Run:
```bash
corepack pnpm -C apps/demos test blackbody-radiation stars-zams-hr
```
Expected: tests pass and no label/unit contract regressions.

**Step 6: Commit**

```bash
git add apps/demos/src/demos/blackbody-radiation/index.html \
        apps/demos/src/demos/stars-zams-hr/index.html \
        apps/demos/src/demos/stars-zams-hr/main.ts
git commit -m "fix(ui): make solar-ratio readouts dimensionless with latex labels"
```

---

## Task 4: Resolve Stars Override-Mode UX Confusion + HR Direction Cue

**Files:**
- Modify: `apps/demos/src/demos/stars-zams-hr/main.ts`
- Modify: `apps/demos/src/demos/stars-zams-hr/index.html`
- Modify: `apps/demos/src/demos/stars-zams-hr/style.css`

**Step 1: Make override-mode metallicity behavior explicit**

When `presetState === "override"`:
- disable metallicity slider interaction (or mark it clearly as not applied),
- expose explanatory text near validity badge: metallicity is informational in override state.

**Step 2: Restore normal metallicity behavior in inferred ZAMS mode**

When returning to inferred mode:
- re-enable metallicity slider,
- remove override-specific helper text.

**Step 3: Fix HR horizontal direction annotation**

Update stage annotation to consistent hot-left convention, e.g.:
- `Hotter \leftarrow \;\; T_{\rm eff} \;\; \rightarrow Cooler`
(or equivalent plain-text directional wording if canvas text cannot render KaTeX).

**Step 4: Validate keyboard and accessibility semantics**

Ensure disabled/not-applied state is reflected with ARIA-friendly attributes and visible style.

**Step 5: Run tests**

Run:
```bash
corepack pnpm -C apps/demos test stars-zams-hr
```
Expected: passing tests for override-state behavior and direction-label contract.

**Step 6: Commit**

```bash
git add apps/demos/src/demos/stars-zams-hr/index.html \
        apps/demos/src/demos/stars-zams-hr/main.ts \
        apps/demos/src/demos/stars-zams-hr/style.css
git commit -m "fix(stars-zams-hr): clarify override-mode controls and correct hr direction cues"
```

---

## Task 5: Harden Tout-1996 Edge-Z Physics Tests

**Files:**
- Modify: `packages/physics/src/zamsTout1996Model.test.ts`

**Step 1: Add boundary-Z monotonicity tests**

Add monotonic `Teff(M)` assertions at:
- `Z = 1e-4`
- `Z = 0.03`
for representative mass grid in valid domain.

**Step 2: Add boundary-Z inversion stability tests**

For both boundary metallicities:
- sample multiple masses,
- compute `Teff`, invert with `massFromTemperatureMetallicity`,
- assert bounded relative error.

**Step 3: Keep existing solar-neighborhood benchmark assertions**

Do not relax current benchmark checks at `Z \approx 0.02`.

**Step 4: Run physics tests**

Run:
```bash
corepack pnpm -C packages/physics test zamsTout1996Model.test.ts
```
Expected: all tests pass; edge-Z coverage included.

**Step 5: Commit**

```bash
git add packages/physics/src/zamsTout1996Model.test.ts
git commit -m "test(physics): add edge-metallicity monotonic and inversion coverage for tout zams"
```

---

## Task 6: Spec + Content Alignment for Solar Units and LaTeX Math

**Files:**
- Modify: `docs/specs/blackbody-radiation-v2-spec.md`
- Modify: `docs/specs/stars-zams-hr-spec.md`
- Modify: `apps/site/src/content/demos/blackbody-radiation.md`
- Modify: `apps/site/src/content/demos/stars-zams-hr.md`

**Step 1: Update notation policy in both specs**

Explicitly document notation and units:
- ratios rendered as `L/L_{\odot}`, `R/R_{\odot}`, `M/M_{\odot}` (dimensionless),
- dimensional quantities explicitly carry units,
- demo-facing equations use LaTeX formatting.

**Step 2: Align misconception and model-note copy**

Ensure blackbody content calls out:
- `F = \sigma T^4` is surface flux,
- luminosity needs radius assumptions.

**Step 3: Align stars content with override-mode semantics**

State that override presets bypass ZAMS inference and metallicity control does not drive override outputs.

**Step 4: Run content/build checks**

Run:
```bash
corepack pnpm build
```
Expected: clean build with content schema validity and no broken pages.

**Step 5: Commit**

```bash
git add docs/specs/blackbody-radiation-v2-spec.md \
        docs/specs/stars-zams-hr-spec.md \
        apps/site/src/content/demos/blackbody-radiation.md \
        apps/site/src/content/demos/stars-zams-hr.md
git commit -m "docs(specs): codify latex solar-unit notation and override semantics"
```

---

## Task 7: Full Verification + QA Evidence Capture

**Files:**
- Modify (if needed for findings): `docs/audits/migrations/blackbody-radiation-parity.md`
- Modify (if needed for findings): `docs/audits/migrations/stars-zams-hr-parity.md`

**Step 1: Run mandatory verification gates**

Run:
```bash
corepack pnpm -C packages/physics test zamsTout1996Model.test.ts
corepack pnpm -C apps/demos test blackbody-radiation stars-zams-hr
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```
Expected:
- physics + demo tests pass,
- full build passes,
- e2e passes or failures are unrelated and documented.

**Step 2: Manual QA checklist (blackbody + stars-zams-hr)**

- Blackbody: `Human` preset selectable and readout updates.
- Blackbody Understand tab text explicitly distinguishes surface flux from luminosity.
- Stars HR axis cue correctly shows hotter-left convention.
- Stars override preset visibly marks metallicity as not-applied (or disabled).
- Ratio readouts are dimensionless and use LaTeX solar notation.

**Step 3: Update parity notes with validation evidence**

If deltas changed, update parity audit markdowns with:
- intentional deltas,
- pedagogical rationale,
- verification command outcomes.

**Step 4: Commit QA/parity updates**

```bash
git add docs/audits/migrations/blackbody-radiation-parity.md \
        docs/audits/migrations/stars-zams-hr-parity.md
git commit -m "docs(parity): capture post-hardening verification evidence"
```

---

## Defaults and Assumptions Locked for Implementation

1. Ignore the prior scope-contamination finding by request; no history rewrite is planned.
2. Keep blackbody demo layout and shell intact; apply only targeted behavior/copy/readout fixes.
3. Keep `ExportPayloadV1`; improve labels/notes only (no breaking schema).
4. Use solar-ratio notation consistently and treat those readouts as dimensionless.
5. Use LaTeX math in UI/docs where math is presented; keep plain-text fallbacks where canvas text cannot render KaTeX directly.

