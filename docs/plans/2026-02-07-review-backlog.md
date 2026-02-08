# Review Backlog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all P1 and P2 issues from the 2026-02-07 comprehensive review: add missing `aria-pressed` initial state to 4 demos, add contract tests for aria-pressed, add E2E test for challenge feedback `aria-live`, and remove dead `.cp-action` code.

**Architecture:** Surgical HTML edits + contract test additions + dead code deletion. No behavior changes — only adding missing attributes and removing unused code. TDD for the new contract tests.

**Tech Stack:** Vitest (contracts), Playwright (E2E), static HTML, TypeScript

**Scope note:** Ignore any concurrent changes to demo activities or instructor resources — those are from a separate session.

---

### Task 1: Add `aria-pressed="false"` to blackbody-radiation chip buttons

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/index.html` (lines 37-38, 55-69)

**Step 1: Add `aria-pressed="false"` to the 2 scale toggle buttons**

In `index.html`, the scale buttons (lines 37-38) lack initial `aria-pressed`. Add it:

```html
<!-- line 37: add aria-pressed="false" -->
<button id="scaleLog" class="cp-chip" type="button" aria-pressed="false">Log</button>
<button id="scaleLinear" class="cp-chip" type="button" aria-pressed="false">Linear</button>
```

The JS at `main.ts:510-511` already calls `setAttribute("aria-pressed", ...)` on toggle, and `main.ts:514` calls `setIntensityScale(state.intensityScale)` at init which sets the correct initial pressed state via JS. But the HTML should have the default for screen readers that evaluate before JS runs.

**Step 2: Verify tests still pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/blackbody-radiation/`
Expected: All 67 tests pass (no regressions)

---

### Task 2: Add `aria-pressed="false"` to em-spectrum chip buttons

**Files:**
- Modify: `apps/demos/src/demos/em-spectrum/index.html` (lines 33-39)

**Step 1: Add `aria-pressed="false"` to all 7 band buttons**

```html
<!-- lines 33-39: add aria-pressed="false" to each -->
<button class="cp-chip band" type="button" data-band="radio" aria-pressed="false">Radio</button>
<button class="cp-chip band" type="button" data-band="microwave" aria-pressed="false">Microwave</button>
<button class="cp-chip band" type="button" data-band="infrared" aria-pressed="false">Infrared</button>
<button class="cp-chip band" type="button" data-band="visible" aria-pressed="false">Visible</button>
<button class="cp-chip band" type="button" data-band="ultraviolet" aria-pressed="false">UV</button>
<button class="cp-chip band" type="button" data-band="xray" aria-pressed="false">X-ray</button>
<button class="cp-chip band" type="button" data-band="gamma" aria-pressed="false">Gamma</button>
```

The JS at `main.ts:201` already toggles `aria-pressed` correctly on click.

**Step 2: Verify tests still pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/em-spectrum/`
Expected: All 132 tests pass

---

### Task 3: Add `aria-pressed="false"` to eos-lab chip buttons

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html` (lines 146-151, 373-378)

**Step 1: Add `aria-pressed="false"` to all 12 preset buttons (6 main + 6 compare)**

Main presets (lines 146-151) — add `aria-pressed="false"` to each:
```html
<button class="cp-chip preset" type="button" data-preset-id="solar-core" aria-pressed="false">Solar core</button>
<button class="cp-chip preset" type="button" data-preset-id="solar-envelope" aria-pressed="false">Solar envelope</button>
<button class="cp-chip preset" type="button" data-preset-id="massive-core" aria-pressed="false">Massive-star core</button>
<button class="cp-chip preset" type="button" data-preset-id="red-giant-envelope" aria-pressed="false">Red giant envelope</button>
<button class="cp-chip preset" type="button" data-preset-id="white-dwarf-core" aria-pressed="false" title="He-like composition (Y=0.98) mimics C/O white dwarfs because mu_e &approx; 2 in both cases. Since n_e = rho/(mu_e m_u), the same mu_e gives the same electron density and degeneracy pressure.">White dwarf core</button>
<button class="cp-chip preset" type="button" data-preset-id="brown-dwarf-interior" aria-pressed="false">Brown dwarf interior</button>
```

Compare presets (lines 373-378) — add `aria-pressed="false"` to each:
```html
<button class="cp-chip preset compare-preset" data-preset-id="solar-core" type="button" aria-pressed="false">Solar core</button>
<button class="cp-chip preset compare-preset" data-preset-id="white-dwarf-core" type="button" aria-pressed="false">White dwarf</button>
<button class="cp-chip preset compare-preset" data-preset-id="massive-core" type="button" aria-pressed="false">Massive star</button>
<button class="cp-chip preset compare-preset" data-preset-id="red-giant-envelope" type="button" aria-pressed="false">Red giant</button>
<button class="cp-chip preset compare-preset" data-preset-id="solar-envelope" type="button" aria-pressed="false">Solar envelope</button>
<button class="cp-chip preset compare-preset" data-preset-id="brown-dwarf-interior" type="button" aria-pressed="false">Brown dwarf</button>
```

The JS at `main.ts:522` already toggles `aria-pressed` on interaction.

**Step 2: Verify tests still pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/`
Expected: All 100 tests pass

---

### Task 4: Add `aria-pressed="false"` to telescope-resolution dynamic buttons

**Files:**
- Modify: `apps/demos/src/demos/telescope-resolution/main.ts` (line 146, after `btn.textContent = ...`)

**Step 1: Add initial `aria-pressed` when dynamically creating band buttons**

telescope-resolution creates chip buttons in JS (line 142-146). After setting `textContent`, add:

```typescript
// After line 146: btn.textContent = band.shortLabel;
btn.setAttribute("aria-pressed", "false");
```

The JS at `main.ts:171` already toggles it on click. This ensures the initial state is set before any interaction.

**Step 2: Verify tests still pass**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/telescope-resolution/`
Expected: All 99 tests pass

---

### Task 5: Add `aria-pressed` contract tests to all demos with chip buttons

**Files:**
- Modify: `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/em-spectrum/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/eos-lab/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/conservation-laws/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/seasons/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/eclipse-geometry/design-contracts.test.ts`
- Modify: `apps/demos/src/demos/keplers-laws/design-contracts.test.ts`

**Step 1: Write the test (same pattern for all 7 demos)**

Add a new `describe` block after the existing "Component migration" section in each file. The test reads the HTML as a string and asserts every `cp-chip` button has `aria-pressed`:

```typescript
describe("Chip button aria-pressed", () => {
  it("all cp-chip buttons have initial aria-pressed attribute", () => {
    // Match every <button...class="cp-chip...> tag
    const chipButtons = html.match(/<button[^>]*class="[^"]*cp-chip[^"]*"[^>]*>/g) || [];
    expect(chipButtons.length).toBeGreaterThan(0);
    const missing = chipButtons.filter((tag) => !tag.includes("aria-pressed"));
    expect(missing, "cp-chip buttons missing aria-pressed").toEqual([]);
  });
});
```

For **telescope-resolution** this test does NOT apply (buttons are dynamic, not in HTML). Skip this file.

For **planetary-conjunctions** the chips use `aria-checked` with `role="radio"` (different ARIA pattern), so also skip.

**Step 2: Run all demo tests**

Run: `corepack pnpm -C apps/demos test -- --run`
Expected: All 1,203+ tests pass (7 new tests added)

**Step 3: Commit**

```
a11y: add aria-pressed to chip buttons in 4 demos + contract tests

- Add initial aria-pressed="false" to blackbody-radiation, em-spectrum,
  eos-lab HTML and telescope-resolution dynamic button creation
- Add contract tests verifying all cp-chip buttons have aria-pressed
  in 7 demos (excludes telescope-resolution dynamic + planetary-conjunctions radio)
```

---

### Task 6: Add E2E test for challenge feedback `aria-live`

**Files:**
- Modify: `apps/site/tests/accessibility.spec.ts`

**Step 1: Add a new test section after the "Reduced motion respect" block**

Pick one demo that has challenge mode (e.g., `angular-size`). Launch challenge, check the feedback div attributes:

```typescript
// ---------------------------------------------------------------------------
// Challenge feedback accessibility
// ---------------------------------------------------------------------------

test.describe("Challenge feedback accessibility", () => {
  test("challenge feedback div has aria-live=assertive", async ({ page }) => {
    await page.goto("play/angular-size/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    // Launch challenge mode
    const challengeBtn = page.locator("#challengeMode");
    if ((await challengeBtn.count()) > 0) {
      await challengeBtn.click();
      const feedback = page.locator(".cp-challenge-feedback");
      await expect(feedback).toBeAttached();
      await expect(feedback).toHaveAttribute("aria-live", "assertive");
      await expect(feedback).toHaveAttribute("aria-atomic", "true");
    }
  });
});
```

**Step 2: Run the accessibility E2E tests**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "Challenge feedback"`
Expected: 1 test passes

**Step 3: Commit**

```
test(a11y): add E2E check for challenge feedback aria-live assertive
```

---

### Task 7: Remove dead `.cp-action` code from shared layer

**Files:**
- Modify: `apps/demos/src/shared/stub-demo.css` (delete lines 26-88)
- Modify: `packages/runtime/src/polish.ts` (line 173)

**Step 1: Delete `.cp-action` and `.cp-actions` CSS rules**

In `stub-demo.css`, remove the entire block from line 26 (`.cp-action {`) through line 88 (`.cp-actions { display: grid; gap: 10px; }` closing brace). This includes:
- `.cp-action` (base styles)
- `.cp-action:hover`
- `.cp-action--ghost`
- `.cp-action--ghost:hover:not(:disabled)`
- `.cp-action:active`
- `.cp-action:focus-visible`
- `.cp-action:disabled, .cp-action[aria-disabled="true"]`
- `.cp-actions` (grid layout)

**Step 2: Remove `.cp-action` from polish.ts selector**

In `polish.ts` line 173, change:
```typescript
// Before:
'button, a.cp-button, button.cp-button, .cp-action, .cp-accordion > summary'
// After:
'button, a.cp-button, button.cp-button, .cp-accordion > summary'
```

**Step 3: Verify build and tests**

Run: `corepack pnpm build && corepack pnpm -C apps/demos test -- --run`
Expected: Build clean, all demo tests pass. No demo uses `.cp-action` so nothing should break.

**Step 4: Run E2E smoke to confirm no visual regressions**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "smoke"`
Expected: All smoke tests pass

**Step 5: Commit**

```
refactor: remove dead .cp-action CSS and polish.ts selector

No demo uses .cp-action class. All demos migrated to cp-chip/cp-button.
```

---

### Task 8: Final verification gate

**Step 1: Run all 4 test layers**

```bash
corepack pnpm -C packages/physics test -- --run
corepack pnpm -C packages/theme test -- --run
corepack pnpm -C apps/demos test -- --run
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected:
- Physics: 144 tests pass
- Theme: 109 tests pass
- Demo: 1,210+ tests pass (7 new contract tests)
- E2E: 584+ pass (1 new challenge feedback test)

**Step 2: Verify build is clean**

Run: `corepack pnpm build`
Expected: Clean build, no warnings

**Step 3: Update review grade**

The comprehensive review should now score 100/100:
- All chip buttons have initial `aria-pressed` (was 98/100)
- Dead `.cp-action` code removed
- Challenge feedback `aria-live` tested
