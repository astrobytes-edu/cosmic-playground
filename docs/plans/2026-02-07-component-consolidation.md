# Component Consolidation — Single-Source-of-Truth Interactive Elements

**Date:** 2026-02-07
**Status:** Design approved, ready for implementation

## Problem

The design system has 6 button-like concepts but only 3 live in the theme package. Demos reinvent preset chips, toggle switches, and chip containers independently, producing ~40% CSS duplication and inconsistent naming (`.preset--active` vs `.is-active` vs `[aria-pressed]`). The `cp-action` class duplicates `cp-button` with `width: 100%`, causing layout bugs when applied to inline chip contexts.

## Component Taxonomy (6 types)

| Component | Class | Purpose | Replaces |
|-----------|-------|---------|----------|
| **Button** | `.cp-button` | Rectangular action buttons | `.cp-action` (killed) |
| **Chip** | `.cp-chip` | Compact selectable pills | `.preset`, `.band`, `.compare-preset`, `.phase-btn`, `.segmented__button` |
| **Icon button** | `.cp-icon-btn` | Square icon-only toolbar buttons | `.cp-utility-btn` (renamed) |
| **Tab** | `.cp-tab` | Tab navigation | No change |
| **Chip group** | `.cp-chip-group` | Flex-wrap container for chips | `.presets__grid`, `.presets__row`, `.preset-buttons`, `.band-picker`, `.segmented` |
| **Toggle** | `.cp-toggle` | Sliding on/off switch | Raw `<input type="checkbox">` in label wrappers |

## Component Specifications

### `.cp-chip`

Pill-shaped inline selector button. Visually distinct from rectangular `.cp-button` — the pill radius signals "selection" vs "action" at a glance.

```css
.cp-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--cp-space-1) var(--cp-space-2);
  font-size: var(--cp-text-sm, 0.82rem);
  line-height: 1;
  border: 1px solid var(--cp-border);
  border-radius: 9999px;
  background: var(--cp-bg1);
  color: var(--cp-text);
  cursor: pointer;
  transition: border-color var(--cp-transition-fast) ease,
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

/* Active state: supports both JS class and ARIA attribute */
.cp-chip.is-active,
.cp-chip[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--cp-border) 30%, var(--cp-accent));
  background: color-mix(in srgb, var(--cp-accent) 10%, var(--cp-bg2));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cp-accent) 18%, transparent);
}
```

**Instrument-layer glow** (in `layer-instrument.css`):
```css
.cp-layer-instrument .cp-chip:hover,
.cp-layer-instrument .cp-chip:focus-visible {
  box-shadow: var(--cp-glow-accent-teal);
}
```

### `.cp-chip-group`

Container that lays out chips. Two modes: flex-wrap (default) and fixed grid.

```css
.cp-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-1);
}

.cp-chip-group--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--cp-space-2);
}
```

### `.cp-toggle`

Sliding switch for binary options. Wraps native `<input type="checkbox">` for built-in keyboard and form semantics.

```html
<label class="cp-toggle">
  <input type="checkbox" id="showSolarProfile">
  Show solar model profile
</label>
```

```css
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
  width: 36px;
  height: 20px;
  border-radius: 9999px;
  border: 1px solid var(--cp-border);
  background: var(--cp-bg2);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
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
  transition: transform 0.2s ease, background 0.2s ease;
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

### `.cp-icon-btn` (rename of `.cp-utility-btn`)

No style changes. Rename for clarity: "icon button" communicates purpose better than "utility button."

### `.cp-button` cleanup

Kill `.cp-action` entirely. The only difference was `width: 100%`, which `.cp-button--block` already provides.

**Before:** `class="cp-action"` or `class="preset cp-action"`
**After:** `class="cp-button cp-button--block"` (sidebar full-width actions) or `class="cp-chip"` (selectable presets)

## Active-State Convention

Standardize on dual support everywhere:

- **`.is-active`** — for JS-toggled state (when ARIA doesn't apply)
- **`[aria-pressed="true"]`** — for toggle buttons (preferred when semantics fit)

Both selectors appear in `.cp-chip` styles. Demos should prefer `aria-pressed` for toggle-like chips and `.is-active` for "current selection" indicators.

## Migration Map (per demo)

Skip: `retrograde-motion` (being rewritten separately).

| Demo | Chip migration | Toggle migration | Container migration |
|------|---------------|-----------------|---------------------|
| **eos-lab** (Tab 1) | `.preset.cp-button.cp-button--outline` → `.cp-chip` | N/A | `.presets__grid` → `.cp-chip-group--grid` |
| **eos-lab** (Tab 2) | `.compare-preset` → `.cp-chip` | `.regime-map__overlay-toggle` → `.cp-toggle` | `.compare-controls__presets` → `.cp-chip-group` |
| **moon-phases** | `.phase-btn` → `.cp-chip` | N/A | `.phase-buttons` → `.cp-chip-group--grid` |
| **angular-size** | Radio rows stay (they're actual radios, not chips) | N/A | N/A |
| **parallax-distance** | N/A | N/A | N/A |
| **seasons** | N/A | N/A | N/A |
| **blackbody-radiation** | `.segmented__button` → `.cp-chip` | N/A | `.segmented` → `.cp-chip-group--grid` |
| **telescope-resolution** | `.band` → `.cp-chip` | N/A | `.band-picker` → `.cp-chip-group` |
| **em-spectrum** | `.band` → `.cp-chip` | N/A | `.band-picker` → `.cp-chip-group--grid` |
| **eclipse-geometry** | N/A | N/A | `.button-row` → keep (actual buttons, not chips) |
| **keplers-laws** | `.cp-button.cp-button--active` → `.cp-chip` for presets | N/A | `.cp-button-row` → `.cp-chip-group--grid` for presets |
| **conservation-laws** | `.preset.cp-action` → `.cp-chip` | N/A | `.presets__row` → `.cp-chip-group--grid` |
| **binary-orbits** | TBD (not yet migrated) | TBD | TBD |
| **planetary-conjunctions** | TBD (not yet migrated) | TBD | TBD |

## Global changes

| File | Change |
|------|--------|
| `packages/theme/styles/components/chip.css` | **NEW** — `.cp-chip`, `.cp-chip-group` |
| `packages/theme/styles/components/toggle.css` | **NEW** — `.cp-toggle` |
| `packages/theme/styles/components/button.css` | Rename `.cp-utility-btn` → `.cp-icon-btn` (add alias for backward compat during migration) |
| `packages/theme/styles/layer-instrument.css` | Add `.cp-chip` glow overrides |
| `packages/theme/styles/index.css` | Import `chip.css` and `toggle.css` |
| `apps/demos/src/shared/stub-demo.css` | Remove `.cp-action` and `.cp-action--ghost` |
| Each demo's `index.html` | Update class names per migration map |
| Each demo's `style.css` | Remove demo-specific chip/preset/band CSS |
| Each demo's `main.ts` | Update any JS that references old class names |
| `packages/theme/src/tokens.test.ts` | Add contract tests for `.cp-chip`, `.cp-toggle` |

## Implementation Order

1. **Add new theme components** — chip.css, toggle.css, icon-btn rename, instrument-layer glows
2. **Add contract tests** — verify new components exist and have correct properties
3. **Kill `.cp-action`** — remove from stub-demo.css, update all 6 demos that use it
4. **Migrate demos one at a time** — eos-lab first (just fixed), then moon-phases, blackbody-radiation, telescope-resolution, em-spectrum, keplers-laws, conservation-laws
5. **Clean up** — remove dead demo-specific CSS, verify all contract + E2E tests pass

## Verification

After each demo migration:
- `corepack pnpm -C packages/theme test -- --run` (theme contract tests)
- `corepack pnpm -C apps/demos test -- --run src/demos/<slug>/design-contracts.test.ts`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep "<Demo Name>"`
