# Component Consolidation — Implementation Plan (Theme + EOS Lab)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `.cp-chip`, `.cp-chip-group`, and `.cp-toggle` to the theme package, then migrate EOS Lab as the golden reference for the new component system.

**Architecture:** Three new CSS component files in `packages/theme/styles/components/`, imported via `stub-demo.css`. EOS Lab migrates sidebar presets → `.cp-chip` in `.cp-chip-group--grid`, Tab 2 presets → `.cp-chip` in `.cp-chip-group`, and solar profile checkbox → `.cp-toggle`. The Scaling Law Detective's dynamically-generated buttons in `main.ts` also migrate from `cp-action` to `cp-button cp-button--ghost`.

**Tech Stack:** CSS custom properties, Vitest contract tests, Playwright E2E

---

### Task 1: Create `chip.css` theme component

**Files:**
- Create: `packages/theme/styles/components/chip.css`

**Step 1: Create the chip component CSS**

Create `packages/theme/styles/components/chip.css` with this exact content:

```css
/* ============================================
   Chip — Compact pill-shaped selector
   ============================================
   Use for preset pickers, band selectors, filter
   chips. Pill radius distinguishes "select" from
   "action" (rectangular .cp-button).
   ============================================ */

.cp-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--cp-space-1) var(--cp-space-2);
  font-size: var(--cp-text-sm, 0.82rem);
  font-weight: var(--cp-font-medium);
  line-height: 1;
  border: 1px solid var(--cp-border);
  border-radius: 9999px;
  background: var(--cp-bg1);
  color: var(--cp-text);
  cursor: pointer;
  transition:
    border-color var(--cp-transition-fast) ease,
    background var(--cp-transition-fast) ease,
    box-shadow var(--cp-transition-fast) ease;
}

.cp-chip:hover {
  border-color: color-mix(in srgb, var(--cp-border) 50%, var(--cp-accent));
  background: color-mix(in srgb, var(--cp-accent) 6%, var(--cp-bg1));
}

.cp-chip:active {
  background: color-mix(in srgb, var(--cp-accent) 12%, var(--cp-bg1));
}

.cp-chip:focus-visible {
  outline: 2px solid var(--cp-accent-amber);
  outline-offset: 2px;
}

/* Active state — dual selectors for JS class + ARIA attribute */
.cp-chip.is-active,
.cp-chip[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--cp-border) 30%, var(--cp-accent));
  background: color-mix(in srgb, var(--cp-accent) 10%, var(--cp-bg2));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cp-accent) 18%, transparent);
}

.cp-chip:disabled,
.cp-chip[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* ============================================
   Chip Group — Layout container for chips
   ============================================ */

.cp-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-1);
}

/* Grid variant: equal-width columns (e.g. sidebar preset grids) */
.cp-chip-group--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--cp-space-2);
}
```

**Step 2: Verify file was created**

Run: `cat packages/theme/styles/components/chip.css | head -5`
Expected: First 5 lines of the file

---

### Task 2: Create `toggle.css` theme component

**Files:**
- Create: `packages/theme/styles/components/toggle.css`

**Step 1: Create the toggle component CSS**

Create `packages/theme/styles/components/toggle.css` with this exact content:

```css
/* ============================================
   Toggle — Sliding on/off switch
   ============================================
   Wraps native <input type="checkbox"> for
   built-in keyboard and form semantics.

   Usage:
     <label class="cp-toggle">
       <input type="checkbox" id="myToggle">
       Label text
     </label>
   ============================================ */

.cp-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--cp-space-2);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--cp-muted);
}

.cp-toggle input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 36px;
  height: 20px;
  border-radius: 9999px;
  border: 1px solid var(--cp-border);
  background: var(--cp-bg2);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.cp-toggle input[type="checkbox"]::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--cp-muted);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.cp-toggle input[type="checkbox"]:checked {
  background: color-mix(in srgb, var(--cp-accent) 25%, var(--cp-bg2));
  border-color: var(--cp-accent);
}

.cp-toggle input[type="checkbox"]:checked::after {
  transform: translateX(16px);
  background: var(--cp-accent);
}

.cp-toggle input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--cp-accent-amber);
  outline-offset: 2px;
}
```

**Step 2: Verify file was created**

Run: `cat packages/theme/styles/components/toggle.css | head -5`

---

### Task 3: Add instrument-layer glow overrides + import new components

**Files:**
- Modify: `packages/theme/styles/layer-instrument.css` (append at end)
- Modify: `apps/demos/src/shared/stub-demo.css` (add imports after line 11)

**Step 1: Add chip glow override to layer-instrument.css**

Append after the last line (after `.cp-button--accent:focus-visible` block):

```css

/* --- Chip glow in instrument context --- */
.cp-layer-instrument .cp-chip:hover,
.cp-layer-instrument .cp-chip:focus-visible {
  box-shadow: var(--cp-glow-teal);
}
```

**Step 2: Import chip.css and toggle.css in stub-demo.css**

Add two import lines after the existing `scroll-shadow.css` import (after line 13):

```css
@import "@cosmic/theme/styles/components/chip.css";
@import "@cosmic/theme/styles/components/toggle.css";
```

**Step 3: Verify build**

Run: `corepack pnpm build`
Expected: Clean build, no errors

**Step 4: Commit**

```bash
git add packages/theme/styles/components/chip.css packages/theme/styles/components/toggle.css packages/theme/styles/layer-instrument.css apps/demos/src/shared/stub-demo.css
git commit -m "feat(theme): add cp-chip, cp-chip-group, and cp-toggle components"
```

---

### Task 4: Add contract tests for new components

**Files:**
- Modify: `packages/theme/src/tokens.test.ts` (append new describe blocks)

**Step 1: Read current test file**

Read: `packages/theme/src/tokens.test.ts` (full file)

**Step 2: Add contract tests**

Append a new `describe` block after the existing test blocks. The tests read the CSS files as strings and assert key properties exist:

```typescript
describe("Chip component", () => {
  const chipPath = path.resolve(__dirname, "../styles/components/chip.css");
  const chipCss = fs.readFileSync(chipPath, "utf-8");

  it("defines .cp-chip base class", () => {
    expect(chipCss).toContain(".cp-chip {");
  });

  it("uses pill border-radius", () => {
    expect(chipCss).toMatch(/\.cp-chip\s*\{[^}]*border-radius:\s*9999px/s);
  });

  it("defines active state for both class and ARIA", () => {
    expect(chipCss).toContain(".cp-chip.is-active");
    expect(chipCss).toContain('.cp-chip[aria-pressed="true"]');
  });

  it("defines .cp-chip-group flex container", () => {
    expect(chipCss).toContain(".cp-chip-group {");
    expect(chipCss).toContain("flex-wrap: wrap");
  });

  it("defines .cp-chip-group--grid variant", () => {
    expect(chipCss).toContain(".cp-chip-group--grid {");
    expect(chipCss).toContain("grid-template-columns");
  });

  it("defines disabled state", () => {
    expect(chipCss).toContain(".cp-chip:disabled");
  });
});

describe("Toggle component", () => {
  const togglePath = path.resolve(__dirname, "../styles/components/toggle.css");
  const toggleCss = fs.readFileSync(togglePath, "utf-8");

  it("defines .cp-toggle base class", () => {
    expect(toggleCss).toContain(".cp-toggle {");
  });

  it("hides native checkbox appearance", () => {
    expect(toggleCss).toContain("appearance: none");
  });

  it("defines checked state with accent color", () => {
    expect(toggleCss).toContain(":checked");
    expect(toggleCss).toContain("--cp-accent");
  });

  it("defines thumb pseudo-element", () => {
    expect(toggleCss).toContain("::after");
    expect(toggleCss).toContain("border-radius: 50%");
  });

  it("defines focus-visible outline", () => {
    expect(toggleCss).toContain(":focus-visible");
    expect(toggleCss).toContain("--cp-accent-amber");
  });
});
```

**Step 3: Run tests**

Run: `corepack pnpm -C packages/theme test -- --run`
Expected: All tests pass (30 existing + 11 new = 41)

**Step 4: Commit**

```bash
git add packages/theme/src/tokens.test.ts
git commit -m "test(theme): add contract tests for cp-chip and cp-toggle components"
```

---

### Task 5: Migrate EOS Lab sidebar presets (Tab 1) to cp-chip

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html` (lines 143-152)
- Modify: `apps/demos/src/demos/eos-lab/style.css` (remove `.presets__grid`, `.preset.cp-action` dead code)

**Step 1: Update sidebar preset HTML**

Replace the presets section (lines 143-154) — change `.presets__grid` to `.cp-chip-group--grid`, remove `cp-button cp-button--outline` classes, add `cp-chip`:

Before:
```html
<div class="presets">
  <div class="presets__label">Preset states (ASTR 201)</div>
  <div id="presetButtons" class="presets__grid" role="group" aria-label="Preset states">
    <button class="cp-button cp-button--outline preset" type="button" data-preset-id="solar-core">Solar core</button>
    ...
  </div>
```

After:
```html
<div class="presets">
  <div class="presets__label">Preset states (ASTR 201)</div>
  <div id="presetButtons" class="cp-chip-group--grid" role="group" aria-label="Preset states">
    <button class="cp-chip preset" type="button" data-preset-id="solar-core">Solar core</button>
    <button class="cp-chip preset" type="button" data-preset-id="solar-envelope">Solar envelope</button>
    <button class="cp-chip preset" type="button" data-preset-id="massive-core">Massive-star core</button>
    <button class="cp-chip preset" type="button" data-preset-id="red-giant-envelope">Red giant envelope</button>
    <button class="cp-chip preset" type="button" data-preset-id="white-dwarf-core" title="He-like composition (Y=0.98) mimics C/O white dwarfs because mu_e &approx; 2 in both cases. Since n_e = rho/(mu_e m_u), the same mu_e gives the same electron density and degeneracy pressure.">White dwarf core</button>
    <button class="cp-chip preset" type="button" data-preset-id="brown-dwarf-interior">Brown dwarf interior</button>
  </div>
```

**Step 2: Remove dead `.presets__grid` CSS from style.css**

The `.presets__grid` rule (grid-template-columns, gap) is now handled by `.cp-chip-group--grid` from theme. Remove:

```css
.presets__grid {
  display: grid;
  gap: var(--cp-space-1);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

Also verify: the `.presets` container and `.presets__label` rules should stay (they control the outer wrapper and label, not the grid).

**Step 3: Verify tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/design-contracts.test.ts`
Expected: 33 tests pass (contract tests check for `preset` class, not `cp-button--outline`)

---

### Task 6: Migrate EOS Lab Tab 2 presets to cp-chip

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html` (lines 372-379)
- Modify: `apps/demos/src/demos/eos-lab/style.css` (remove `.compare-preset` standalone styles from Task 1 of this session, replace with simpler override)

**Step 1: Update Tab 2 preset HTML**

The 6 compare-preset buttons (already had `cp-action` removed earlier this session) become `cp-chip`:

Before:
```html
<button class="preset compare-preset" data-preset-id="solar-core" type="button">Solar core</button>
```

After:
```html
<button class="cp-chip preset compare-preset" data-preset-id="solar-core" type="button">Solar core</button>
```

Add `.cp-chip-group` to the container:

Before: `<div class="compare-controls__presets">`
After: `<div class="compare-controls__presets cp-chip-group">`

**Step 2: Simplify compare-preset CSS in style.css**

Remove the standalone `.compare-preset` block added earlier (display, border, border-radius, background, color, cursor, hover, active). Those properties now come from `.cp-chip`. Keep only the EOS-specific active state override (which tints with `--eos-dominant`):

Remove:
```css
.compare-preset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-1);
  background: var(--cp-bg1);
  color: var(--cp-text);
  cursor: pointer;
  font-size: 0.8rem;
  padding: var(--cp-space-1) var(--cp-space-2);
  line-height: 1;
}

.compare-preset:hover {
  border-color: color-mix(in srgb, var(--cp-border) 50%, var(--cp-accent));
  background: color-mix(in srgb, var(--cp-accent) 6%, var(--cp-bg1));
}

.compare-preset:active {
  background: color-mix(in srgb, var(--cp-accent) 12%, var(--cp-bg1));
}
```

The `.compare-preset.is-active` rule stays (it uses `--eos-dominant` for channel-tinted active state).

Also remove `compare-controls__presets` flex/gap rules since `.cp-chip-group` handles that:
```css
.compare-controls__presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-1);
}
```

**Step 3: Verify tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/design-contracts.test.ts`
Expected: 33 tests pass

---

### Task 7: Migrate solar profile toggle to cp-toggle

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/index.html` (line 296-298)
- Modify: `apps/demos/src/demos/eos-lab/style.css` (remove `.regime-map__overlay-toggle`)

**Step 1: Update toggle HTML**

Before:
```html
<label class="regime-map__overlay-toggle">
  <input type="checkbox" id="showSolarProfile"> Show solar model profile
</label>
```

After:
```html
<label class="cp-toggle">
  <input type="checkbox" id="showSolarProfile"> Show solar model profile
</label>
```

**Step 2: Remove demo-specific toggle CSS**

Remove from style.css:
```css
.regime-map__overlay-toggle {
  display: flex;
  align-items: center;
  gap: var(--cp-space-1);
  font-size: 0.8rem;
  color: var(--cp-muted);
  margin-top: var(--cp-space-1);
  cursor: pointer;
}
```

**Step 3: Verify tests + build**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/design-contracts.test.ts`
Run: `corepack pnpm build`
Expected: All pass

---

### Task 8: Migrate Scaling Law Detective buttons in main.ts

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/main.ts` (3 locations using `cp-action`)

**Step 1: Update dynamically generated buttons**

The Scaling Law Detective generates buttons in JS. These are action buttons (not selection chips), so they should use `cp-button cp-button--ghost`:

Line ~994: Change `cp-action scaling-detective__option` → `cp-button cp-button--ghost scaling-detective__option`

Line ~1022: Change `cp-action scaling-detective__next` → `cp-button cp-button--ghost scaling-detective__next`

Line ~1029: Change `cp-action scaling-detective__reset` → `cp-button cp-button--ghost scaling-detective__reset`

**Step 2: Verify tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/design-contracts.test.ts`
Run: `corepack pnpm build`
Expected: All pass

**Step 3: Commit all EOS Lab changes**

```bash
git add apps/demos/src/demos/eos-lab/index.html apps/demos/src/demos/eos-lab/style.css apps/demos/src/demos/eos-lab/main.ts
git commit -m "feat(eos-lab): migrate to cp-chip, cp-chip-group, and cp-toggle components"
```

---

### Task 9: Update EOS Lab design contract tests

**Files:**
- Modify: `apps/demos/src/demos/eos-lab/design-contracts.test.ts`

**Step 1: Read current contract tests**

Read: `apps/demos/src/demos/eos-lab/design-contracts.test.ts` (full file)

**Step 2: Add component contract tests**

Add tests asserting:
- Sidebar presets use `cp-chip` class (not `cp-button--outline`)
- Tab 2 presets use `cp-chip` class
- Preset containers use `cp-chip-group` class
- Solar profile toggle uses `cp-toggle` class
- No remaining `cp-action` references in HTML

**Step 3: Run tests**

Run: `corepack pnpm -C apps/demos test -- --run src/demos/eos-lab/design-contracts.test.ts`
Expected: All pass

**Step 4: Commit**

```bash
git add apps/demos/src/demos/eos-lab/design-contracts.test.ts
git commit -m "test(eos-lab): add component contract tests for cp-chip, cp-toggle usage"
```

---

### Task 10: Run full verification gates

**Step 1: Run all demo tests**

Run: `corepack pnpm -C apps/demos test -- --run`
Expected: All demo tests pass

**Step 2: Run theme tests**

Run: `corepack pnpm -C packages/theme test -- --run`
Expected: 41 tests pass (30 existing + 11 new)

**Step 3: Build**

Run: `corepack pnpm build`
Expected: Clean build

**Step 4: Run EOS Lab E2E**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "EOS"`
Expected: 31 tests pass

**Step 5: Verify no cp-action remains in EOS Lab**

Run: `grep -r "cp-action" apps/demos/src/demos/eos-lab/`
Expected: No matches
