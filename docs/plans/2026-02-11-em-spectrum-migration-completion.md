# EM Spectrum Migration Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish migrating the legacy `em-spectrum` demo into Cosmic Playground by restoring key legacy capabilities (unit conversion, spectrum-bar interaction, richer telescope/object affordances) while **verifying and validating all numerical values** against the legacy demo + internal physics sanity checks. Also: when showing telescope coverage, **show the full spectral range** (min→max), not a representative mid-point jump.

**Architecture:** Keep the existing demo structure (`index.html` + `main.ts` + `logic.ts` + `style.css`). All pure math/mapping/formatting helpers live in `logic.ts` and are covered by Vitest. Physics conversions use `@cosmic/physics` (`PhotonModel`, `AstroUnits`). Curated catalogs live in `packages/data-spectra` and are treated as teaching datasets with explicit units in field names.

**Tech Stack:** TypeScript, CSS, `@cosmic/runtime`, `@cosmic/physics`, `@cosmic/data-spectra`, Vitest.

**Non-negotiables:**
- Do not hand-edit `apps/site/public/play/em-spectrum/` (generated output).
- Base-path safety: demo links remain relative (already `../../exhibits/...` etc).
- No natural units; units remain explicit in UI and tests.
- Telescope “range” UI must not implicitly set wavelength to a mid-point.

---

### Task 1: Add “Value Validation” Tests (Baseline Physics + Dataset Sanity)

**Files:**
- Create: `apps/demos/src/demos/em-spectrum/values.test.ts`

**Step 1: Write failing tests for physics anchors (wavelength/frequency/energy)**

Create tests that validate `PhotonModel` conversions and “known anchors” used in teaching. Use tight-ish tolerances (relative tolerance ~1e-3 to 1e-2) to avoid false failures from rounding.

Example (include in `values.test.ts`):

```ts
import { describe, it, expect } from "vitest";
import { AstroUnits, PhotonModel } from "@cosmic/physics";

function relClose(a: number, b: number, rel = 1e-3) {
  const denom = Math.max(1, Math.abs(a), Math.abs(b));
  expect(Math.abs(a - b) / denom).toBeLessThan(rel);
}

describe("em-spectrum value validation", () => {
  it("550 nm -> ~5.45e14 Hz and ~2.25 eV", () => {
    const lambdaNm = 550;
    const nuHz = PhotonModel.frequencyHzFromWavelengthNm(lambdaNm);
    relClose(nuHz, 5.45e14, 2e-2);

    const ev = PhotonModel.photonEnergyEvFromWavelengthNm(lambdaNm);
    relClose(ev, 2.25, 2e-2);
  });

  it("H-alpha 656.281 nm matches atomicLines value", async () => {
    const { atomicLines } = await import("@cosmic/data-spectra");
    const ha = atomicLines.find((l) => l.id === "H_I_Ha");
    expect(ha).toBeTruthy();
    if (!ha) return;
    const nm = AstroUnits.cmToNm(ha.wavelengthCm);
    expect(nm).toBeCloseTo(656.281, 3);
  });
});
```

**Step 2: Add failing tests for dataset invariants**

Add invariants that validate all imported datasets:
- `emSpectrumTelescopes`: `wavelengthMinCm > 0`, `wavelengthMaxCm > 0`, `wavelengthMinCm < wavelengthMaxCm`.
- `emSpectrumObjects`: `name` non-empty; `bands` non-empty; `why` non-empty.
- `atomicLines`: all `wavelengthCm` fall inside visible band boundaries defined by the demo (`logic.ts` BANDS.visible).
- `molecularBands`: center wavelengths fall in IR-ish range (at minimum, `> 0` and `< radio`).

Example snippet:

```ts
import { BANDS } from "./logic";
import { atomicLines, molecularBands, emSpectrumTelescopes, emSpectrumObjects } from "@cosmic/data-spectra";

it("telescopes ranges are well-formed", () => {
  for (const t of emSpectrumTelescopes) {
    expect(t.wavelengthMinCm).toBeGreaterThan(0);
    expect(t.wavelengthMaxCm).toBeGreaterThan(0);
    expect(t.wavelengthMinCm).toBeLessThan(t.wavelengthMaxCm);
  }
});

it("atomic lines are within visible band cutoffs", () => {
  for (const line of atomicLines) {
    expect(line.wavelengthCm).toBeGreaterThanOrEqual(BANDS.visible.lambdaMinCm);
    expect(line.wavelengthCm).toBeLessThanOrEqual(BANDS.visible.lambdaMaxCm);
  }
});
```

**Step 3: Run targeted tests and confirm FAIL**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/values.test.ts
```
Expected: FAIL until the dataset and/or validation expectations are aligned (especially after new data is added in later tasks).

**Step 4: Commit test-only checkpoint**

```bash
git add apps/demos/src/demos/em-spectrum/values.test.ts
git commit -m "test(em-spectrum): add value validation anchors and dataset invariants"
```

---

### Task 2: Restore Telescope Catalog Parity (Add Missing Telescopes + Validate Values)

**Files:**
- Modify: `packages/data-spectra/src/emSpectrumTelescopes.ts`
- Modify: `apps/demos/src/demos/em-spectrum/values.test.ts`

**Step 1: Add the missing telescope rows from the legacy demo**

From legacy `/Users/anna/Teaching/astr101-sp26/demos/em-spectrum/telescope-data.js`, migrate at least:
- `Arecibo` (historical; collapsed 2020)
- `Event Horizon Telescope` (EHT)

Implement with the same wavelength range values (cm) as the legacy demo.

**Step 2: Add strict tests for the migrated telescope rows**

Add tests that assert the migrated dataset includes these entries and their ranges match the legacy numeric values exactly (these are teaching-curated, so exactness is fine).

Example:

```ts
import { emSpectrumTelescopes } from "@cosmic/data-spectra";

it("includes Arecibo and EHT with legacy ranges", () => {
  const arecibo = emSpectrumTelescopes.find((t) => t.name === "Arecibo");
  expect(arecibo).toBeTruthy();
  if (arecibo) {
    expect(arecibo.wavelengthMinCm).toBe(3e0);
    expect(arecibo.wavelengthMaxCm).toBe(6e2);
  }

  const eht = emSpectrumTelescopes.find((t) => t.name === "Event Horizon Telescope");
  expect(eht).toBeTruthy();
  if (eht) {
    expect(eht.wavelengthMinCm).toBe(8.7e-2);
    expect(eht.wavelengthMaxCm).toBe(1.3e-1);
  }
});
```

**Step 3: Run targeted tests and confirm PASS**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/values.test.ts
```
Expected: PASS (for these entries).

**Step 4: Commit**

```bash
git add packages/data-spectra/src/emSpectrumTelescopes.ts apps/demos/src/demos/em-spectrum/values.test.ts
git commit -m "feat(data-spectra): add Arecibo and EHT telescope ranges"
```

---

### Task 3: Implement “Show Telescope Range” Overlay (No Mid-point Jump)

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/style.css`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`
- Modify: `apps/demos/src/demos/em-spectrum/logic.ts`
- Modify: `apps/demos/src/demos/em-spectrum/logic.test.ts`

**Step 1: Write failing tests for range→overlay geometry**

In `logic.test.ts`, add tests for a new helper that converts `[lambdaMinCm, lambdaMaxCm]` into `[leftPercent, widthPercent]` (clamped to the spectrum domain).

Add a new helper signature (to implement in `logic.ts`):
- `rangeToOverlayPercent(lambdaMinCm: number, lambdaMaxCm: number): { left: number; width: number; clipped: boolean }`

Failing test example:

```ts
import { rangeToOverlayPercent } from "./logic";

it("rangeToOverlayPercent returns non-negative width and stays within [0,100]", () => {
  const r = rangeToOverlayPercent(1e-9, 1e-6); // X-ray band-like
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.left).toBeLessThanOrEqual(100);
  expect(r.width).toBeGreaterThan(0);
  expect(r.left + r.width).toBeLessThanOrEqual(100);
});
```

**Step 2: Implement range overlay math (pure)**

In `logic.ts`, implement:
- `clampWavelengthToSpectrumDomainCm(lambdaCm)` (domain defined by `LAMBDA_MIN_LOG`/`LAMBDA_MAX_LOG`).
- `rangeToOverlayPercent(min,max)` using `wavelengthToPositionPercent()` with clamping and returning a `clipped` flag when min/max exceeded domain.

**Step 3: Add overlay elements to the spectrum bar**

In `index.html`, add a second overlay layer inside `.spectrum__bar` for telescope range:
- `#telescopeRange` (a semi-transparent highlight spanning coverage)
- `#telescopeMinMarker` and `#telescopeMaxMarker` (thin vertical markers, optional labels)

Keep it `aria-hidden="true"`; selection should be announced via `#status`.

**Step 4: Style the overlay**

In `style.css`, create styles distinct from band highlight:
- `#telescopeRange` uses a different alpha + border so it doesn’t look like “current band”.
- markers are thin, visually crisp, and don’t fight the wavelength marker.

**Step 5: Add selection state and behavior in `main.ts`**

Add `selectedTelescopeName: string | null` (or index) in state (separate from wavelength state).

In the Telescopes panel:
- Render each telescope row as an actual `<button>` (or keep `<li>` but contain a button).
- On click, set selection state and call `renderTelescopeRangeOverlay(telescope)`.
- Crucially: **do not call `setWavelengthCm(...)`** as part of telescope selection.

Also:
- Update the list rendering to show the formatted range explicitly (already present in string, but ensure it’s visible even without “Now:”).
- Announce: `setLiveRegionText(status, "Showing range for <name>: <max> to <min>.")`.

**Step 6: Run targeted tests**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/logic.test.ts
```
Expected: PASS.

**Step 7: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/index.html apps/demos/src/demos/em-spectrum/style.css apps/demos/src/demos/em-spectrum/main.ts apps/demos/src/demos/em-spectrum/logic.ts apps/demos/src/demos/em-spectrum/logic.test.ts
git commit -m "feat(em-spectrum): show telescope spectral ranges without jumping wavelength"
```

---

### Task 4: Restore Convert “Unit Toggle” Capability (Legacy Feature Parity + Validated Values)

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`
- Modify: `apps/demos/src/demos/em-spectrum/values.test.ts`

**Step 1: Write failing tests for multi-unit conversions**

Add tests for a few equivalent inputs across units:
- `500 nm == 0.5 um == 5e-5 cm`
- `1 GHz == 1e9 Hz`
- `1 keV == 1000 eV`

Use `AstroUnits` conversions and `PhotonModel` to cross-check.

**Step 2: Update Convert panel to include unit selects**

In `index.html`, replace the fixed (nm/Hz/eV) Convert inputs with:
- wavelength numeric + unit select (km/m/mm/um/nm/pm/fm)
- frequency numeric + unit select (Hz/kHz/MHz/GHz/THz/PHz/EHz)
- energy numeric + unit select (erg/J/eV/keV/MeV)

**Step 3: Implement convert logic with unit-awareness**

In `main.ts`, implement unit-aware conversion paths:
- parse source input (value+unit) → base units (`lambdaCm`, `nuHz`, `energyErg`)
- compute the other two via `PhotonModel`
- write back to the other fields in their currently-selected units

Use `AstroUnits` where available; for frequency and energy unit scaling, add small local helpers (pure functions inside `main.ts` or moved to `logic.ts` if test value).

**Step 4: Run tests**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/values.test.ts
```

**Step 5: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/index.html apps/demos/src/demos/em-spectrum/main.ts apps/demos/src/demos/em-spectrum/values.test.ts
git commit -m "feat(em-spectrum): restore unit toggles in Convert panel with validated conversions"
```

---

### Task 5: Restore Spectrum-Bar Click Interaction (Optional Drag) + Keyboard Log Steps

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html`
- Modify: `apps/demos/src/demos/em-spectrum/main.ts`
- Modify: `apps/demos/src/demos/em-spectrum/logic.ts`
- Modify: `apps/demos/src/demos/em-spectrum/logic.test.ts`

**Step 1: Add pure helper for x-position→percent**

In `logic.ts`, add:
- `clientXToPercent(clientX: number, rectLeft: number, rectWidth: number): number`

Test it in `logic.test.ts` (0% at left edge, 100% at right edge).

**Step 2: Implement click-to-jump**

In `main.ts`, add a click handler on `.spectrum__bar`:
- compute percent from click position
- call `setWavelengthCm(positionPercentToWavelengthCm(percent))`
- announce updated wavelength in `#status`

**Step 3: Implement keyboard log-step behavior**

Add `keydown` handler on `.spectrum__bar` (make it focusable with `tabindex="0"` if needed):
- ArrowRight multiplies wavelength by `10^{-step}`
- ArrowLeft multiplies by `10^{+step}`
- With Shift, use a larger step (match legacy intent)

This should update only wavelength state and must not break other keyboard paths.

**Step 4: Run demo tests + quick manual check**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/logic.test.ts
```

Manual:
- Click left/right ends of spectrum bar and confirm wavelength labels change orders of magnitude.
- Use Arrow keys while focused on spectrum bar and confirm smooth log stepping.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/em-spectrum/index.html apps/demos/src/demos/em-spectrum/main.ts apps/demos/src/demos/em-spectrum/logic.ts apps/demos/src/demos/em-spectrum/logic.test.ts
git commit -m "feat(em-spectrum): add spectrum-bar click + keyboard log stepping"
```

---

### Task 6: Update Teaching Surfaces to Match the Migrated Architecture

**Files:**
- Modify: `apps/site/src/content/instructor/em-spectrum/model.md`
- Modify: `apps/site/src/content/demos/em-spectrum.md`
- Modify: `docs/audits/migrations/em-spectrum-parity.md`

**Step 1: Instructor notes: fix code references**

Update the “Links” block to point to:
- `apps/demos/src/demos/em-spectrum/main.ts`
- `apps/demos/src/demos/em-spectrum/logic.ts`
- `packages/data-spectra/src/*`
- `@cosmic/physics` usage (conceptual)

Remove references to legacy `demos/_assets/em-spectrum-model.js` paths.

**Step 2: Exhibit copy: align with Convert implementation**

After Task 4, keep exhibit copy mentioning unit toggles; otherwise, revise copy to match reality.

**Step 3: Update parity audit with verification notes**

Add a short “Verified on YYYY-MM-DD” section and mark which backlog items are now complete.

**Step 4: Run site build gate**

Run:
```bash
corepack pnpm build
```

**Step 5: Commit**

```bash
git add apps/site/src/content/instructor/em-spectrum/model.md apps/site/src/content/demos/em-spectrum.md docs/audits/migrations/em-spectrum-parity.md
git commit -m "docs(em-spectrum): align instructor/exhibit copy with migrated demo and parity status"
```

---

### Task 7: Full Verification Gates (Before Marking “Candidate”)

**Files:**
- None (verification only)

**Step 1: Demo/unit tests**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/logic.test.ts
corepack pnpm -C apps/demos test -- src/demos/em-spectrum/values.test.ts
```

**Step 2: Whole-repo build**

Run:
```bash
corepack pnpm build
```

**Step 3: Base-path e2e**

Run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

**Step 4: Readiness promotion (optional)**

If all gates pass and parity audit is updated, update:
- `apps/site/src/content/demos/em-spectrum.md` readiness `experimental -> candidate`
- `lastVerifiedAt` to today

