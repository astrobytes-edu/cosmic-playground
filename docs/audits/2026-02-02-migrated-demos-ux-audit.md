# Migrated Demos Audit (5 interactive demos) — UX / A11y / Export / Theme Contract

**Date:** 2026-02-02  
**Scope:** The 5 interactive demos already migrated into `apps/demos/src/demos/`:

- `angular-size`
- `binary-orbits`
- `eclipse-geometry`
- `moon-phases`
- `seasons`

This audit is intentionally **actionable**: each finding includes concrete file targets and recommended fixes.

---

## Contracts treated as non-negotiable

From `docs/specs/cosmic-playground-site-spec.md`:

- **9.2** Demo runtime standard (shared runtime behaviors, exports, modes)
- **11.2** Accessibility minimums (keyboard operable, focus visible, reduced motion, status messaging)
- **13.1–13.3** QA expectations (build gates, e2e smoke coverage)

From `docs/specs/cosmic-playground-theme-spec.md`:

- **2.1–2.2** Token-first; **no hardcoded colors** in `apps/site` + `apps/demos`
- **6** Centralized print rules (no per-page or per-demo print hacks)

Related skills enforced for this work:
- `cosmic-ui-ux` (shell + tokens + base-path patterns)
- `cosmic-accessibility-audit` (keyboard/focus/reduced-motion/live regions)
- `cosmic-export-contracts` (ExportPayloadV1 labels + unit consistency)
- `cosmic-runtime-instrumentation` (shared behaviors belong in `packages/runtime`)

---

## Executive summary (what’s “not classroom-ready” yet)

1) **Export contract drift (all 5):** exported rows mix units between `name` and `value` (or duplicate units), and labels don’t consistently match UI/station materials. This is the fastest way to create worksheet/autograder churn.  
2) **Content drift (binary-orbits, moon-phases):** station + instructor docs describe controls/features that do not exist in the migrated demo UI (legacy M1/M2 sliders, eccentricity, “days since new”, Earth’s shadow overlay, etc.).  
3) **Theme contract violations in demo CSS (shared + per-demo):** multiple color literals exist in `apps/demos/**` CSS (and some TS fallbacks). Even when “just visualization”, this still violates the theme spec as written and will spread if left unaddressed.  
4) **Small code-level issues:** duplicated `initMath(document)` in `binary-orbits/main.ts`; minor HTML formatting issues in `eclipse-geometry/index.html`.

---

## Quick status matrix

Legend: ✅ good, ⚠️ needs work, ❌ broken/mismatch

| Demo | Instrument markers | Base-path links | Station mode | Challenge mode | Reduced motion | Export v1 shape | Export labels/units | Theme token rule | Station/instructor alignment |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| angular-size | ✅ | ✅ | ✅ | ✅ | ⚠️ (tooltips/motion ok; viz CSS literals) | ✅ | ⚠️ | ⚠️ | ✅ (mostly) |
| binary-orbits | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| eclipse-geometry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ (legacy code-path notes) |
| moon-phases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ (TS fallback literals) | ⚠️ (instructor mismatch) |
| seasons | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ (legacy code-path notes) |

Notes:
- “Instrument markers” includes `#cp-demo` (named), `#copyResults` button, `#status` live region with `aria-atomic="true"`, and `.cp-demo__drawer`.
- “Theme token rule” is **strict**: no new hardcoded colors in `apps/demos`. Current migrated demos still contain color literals in CSS/SVG/canvas fallbacks.

---

## Findings (prioritized)

### P0 — Must fix before further migration

#### P0.1 Export labels/units are inconsistent across demos (v1 payload, but contract drift)

**Why this is P0:** Exports are part of the instrument contract; they must be stable + unit-explicit and match UI/station materials (`cosmic-export-contracts`).

**Observed pattern (multiple demos):**
- Units appear in `value` (e.g. `"123 km"`) instead of `name` (e.g. `"Distance d (km)"`), or appear in **both** `name` and `value` (e.g. name says `(deg)` and value includes `°`).

**Targets (examples):**
- `apps/demos/src/demos/angular-size/main.ts` — `exportResults(...)`
- `apps/demos/src/demos/binary-orbits/main.ts` — `exportResults()`
- `apps/demos/src/demos/eclipse-geometry/main.ts` — `exportResults(...)`
- `apps/demos/src/demos/moon-phases/main.ts` — `handleCopyResults()` payload
- `apps/demos/src/demos/seasons/main.ts` — `exportResults(...)`

**Recommended fix:**
- For rows with fixed units: put units in `name`, keep `value` unitless (stringified number).
  - Example: `name: "Earth–Moon distance (km)"`, `value: "384400"`
  - Example: `name: "Orbital period P (yr)"`, `value: "2.83"`
- For rows where unit can vary (e.g. “display” that switches °/′/″), keep unit in `value` and make that explicit in the `name` (e.g. `"Angular diameter θ (display)"`).

**Verification:**
- Manual: click “Copy results”, confirm the copied text is `(v1)` and rows are consistent + unit-explicit.
- Automated: expand `apps/site/tests/smoke.spec.ts` export tests to cover all 5 demos (see P0.4).

---

#### P0.2 Station + instructor docs are out of sync with migrated UI (binary-orbits, moon-phases)

**Why this is P0:** These pages are what *instructors will read/print*. Mismatches cause immediate classroom confusion.

**Binary Orbits mismatches**

Current demo UI controls:
- `Mass ratio (m₂/m₁)`
- `Separation (a, AU)`

Docs currently claim:
- controls `M1`, `M2`, separation `a`, eccentricity `e`
- overlays: velocity vectors
- optional “increase eccentricity”

**Targets:**
- `apps/site/src/content/stations/binary-orbits.md`
- `apps/site/src/content/instructor/binary-orbits/index.md`
- `apps/site/src/content/instructor/binary-orbits/activities.md`
- `apps/site/src/content/instructor/binary-orbits/assessment.md`
- `apps/site/src/content/instructor/binary-orbits/model.md`
- `apps/site/src/content/demos/binary-orbits.md` (frontmatter `station_params` wording)

**Recommended fix:**
- Rewrite station/instructor materials to match the migrated UI:
  - Replace “M1/M2 sliders” with “mass ratio” + clear mapping (`m1 fixed at 1 M☉` per demo notes, `m2 = ratio*m1`).
  - Remove eccentricity/velocity-vector instructions unless/until implemented.
  - Keep formulas, but ensure labels match what students see in the instrument and export.

**Moon Phases mismatches**

Current demo UI:
- 1 slider (“phase angle”), phase name readout, illuminated % readout.
- Station Mode builds a table; Challenge Mode exists.

Instructor docs currently mention:
- “days since new” readout
- optional Earth’s shadow overlay

**Targets:**
- `apps/site/src/content/instructor/moon-phases/index.md` (and likely `activities.md`)

**Recommended fix:**
- Remove/mark as backlog any unimplemented features (“days since new”, shadow overlay).
- Align symbol naming: the demo currently mixes “phase angle Δ” in HTML with “α” in help text. Pick one symbol and apply it consistently across:
  - demo UI labels + help text
  - station card
  - export rows
  - instructor materials

**Verification:**
- Manual: open `/stations/binary-orbits/` and `/instructor/binary-orbits/` and confirm all listed controls exist in the instrument UI.
- Base-path smoke: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

#### P0.3 Theme spec “no hardcoded colors in apps” is currently violated in demos CSS (shared + per-demo)

**Why this is P0:** if we allow color literals in migrated demos, every future migration will copy-paste them and the token system stops being authoritative.

**Primary offenders (shared):**
- `apps/demos/src/shared/stub-demo.css` includes literal `rgba(0, 0, 0, 0.25)` backgrounds.

**Per-demo offenders (examples):**
- `apps/demos/src/demos/angular-size/style.css` includes multiple `rgba(...)` and literal black shadows.
- `apps/demos/src/demos/eclipse-geometry/style.css` includes `rgba(...)`.
- `apps/demos/src/demos/seasons/style.css` includes `rgba(...)`.

**TS offender pattern (visualization fallbacks):**
- `apps/demos/src/demos/binary-orbits/main.ts` and `apps/demos/src/demos/moon-phases/main.ts` use `cssVar("--cp-…", "<hex fallback>")` with non-token palette values.

**Recommended fix:**
- Replace literals in CSS with token-driven colors via `var(--cp-*)` and `color-mix(...)`.
- Remove “old palette” fallbacks in TS; if a fallback is needed, it should match the current tokens (or fail loudly so we detect missing theme imports).
- If you must keep a visualization-only non-token color (rare), document it in the demo’s “Model notes” panel (and prefer using existing chart/status tokens first: `--cp-chart-*`, `--cp-warning`, `--cp-danger`, etc.).

**Verification:**
- Targeted scan: `rg -n -- "#[0-9a-fA-F]{3,8}|\\brgb\\(|\\bhsl\\(" apps/demos/src | head`
- Full gate: `corepack pnpm build`

---

#### P0.4 E2E smoke should cover exports for all 5 migrated interactive demos

**Why this is P0:** exports are the main “student artifact” workflow, and we want base-path-safe coverage for all migrated instruments, not only the pilot.

**Target:**
- `apps/site/tests/smoke.spec.ts`

**Recommended additions:**
- Parameterize the existing “export stable text” test over:
  - `angular-size`
  - `binary-orbits`
  - `eclipse-geometry`
  - `moon-phases`
  - `seasons`
- Keep the test contract stable:
  - copied text contains the v1 header and “Timestamp:”
  - has non-empty “Parameters” and “Readouts” sections (except for demos that intentionally omit one section)
- Keep coverage under `CP_BASE_PATH=/cosmic-playground/` (do not weaken base-path checks).

**Verification:**
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

### P1 — Should fix in Slice 2 (polish + correctness)

#### P1.1 `binary-orbits` calls `initMath(document)` twice

**Target:**
- `apps/demos/src/demos/binary-orbits/main.ts` (duplicate call near end)

**Fix:**
- Remove the duplicate call.

**Verification:**
- `corepack pnpm build`

---

#### P1.2 `eclipse-geometry/index.html` has a fragile inline-math line break

**Target:**
- `apps/demos/src/demos/eclipse-geometry/index.html` (model callout contains `small` + newline + `$|\\beta|$`)

**Fix:**
- Keep the inline `$|\\beta|$` in the same text node so it renders cleanly under KaTeX auto-render.

---

#### P1.3 Consistency: use the theme component classes for form controls (where feasible)

Several demos still use a local `.control` wrapper rather than the theme’s `.cp-field/.cp-label/.cp-range` patterns. This is not “wrong”, but it risks drift over time.

**Targets (optional in Slice 2):**
- `apps/demos/src/demos/*/index.html`
- `apps/demos/src/demos/*/style.css`

**Fix:**
- Convert demo controls to the standard theme form components only where the change is low-risk (avoid big layout churn mid-semester).

---

### P2 — Nice-to-have / backlog (document, don’t block)

#### P2.1 Make canvas semantics more explicit

Canvas-based demos rely on the parent stage’s `aria-label`. Consider adding `role="img"` + `aria-label` to the canvas element itself (or an adjacent caption) for clearer SR output.

**Targets:**
- `apps/demos/src/demos/binary-orbits/index.html`
- `apps/demos/src/demos/moon-phases/index.html`

---

## Recommended Slice 2 implementation order (minimize churn)

1) **Shared enforcement first**
   - Add a runtime helper for live-region updates (optional clear-then-set) and reuse it in Station Mode status (`packages/runtime/src/demoModes.ts`).
   - Remove color literals from `apps/demos/src/shared/stub-demo.css` (token-only).
2) **Export contract alignment (per demo, small diffs)**
   - Update `exportResults` payloads to “units in name, unitless values”.
   - Align symbols/labels to match UI/station materials (choose one, update everywhere).
3) **Content alignment (binary-orbits, moon-phases)**
   - Rewrite station + instructor content to match the migrated UI; move unimplemented features to backlog pages.
4) **E2E coverage expansion**
   - Extend `apps/site/tests/smoke.spec.ts` export tests to all 5 migrated demos and run under `CP_BASE_PATH=/cosmic-playground/`.

---

## Verification commands (Slice 2 gates)

- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
- (targeted) `node scripts/validate-play-dirs.mjs`
- (targeted) `corepack pnpm -C packages/runtime test` (if runtime unit tests exist / are added)

