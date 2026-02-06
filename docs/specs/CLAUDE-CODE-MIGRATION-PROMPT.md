# Cosmic Playground Migration — Claude Code Implementation Prompt

**Context:** You are implementing the Cosmic Playground migration for Dr. Anna Rosen at SDSU. The full PRD is at `docs/specs/cosmic-playground-prd.md`. Read it thoroughly before proceeding.

**Critical Rule:** COPY demos from `~/Teaching/astr101-sp26/demos/` into `apps/demos/`. Do NOT modify the legacy demos — they are still being used for teaching this semester.

---

## Phase 1: Design System Foundation (Do First)

### 1.1 Implement Starfield Module in `@cosmic/runtime`

Create `packages/runtime/src/starfield.ts`:

```typescript
export interface StarfieldConfig {
  canvas: HTMLCanvasElement;
  starCount?: number;       // default 200
  depthLayers?: number;     // default 3
  twinkleRate?: number;     // default 0.02
  parallaxFactor?: number;  // default 0 (disabled)
}

export function initStarfield(config: StarfieldConfig): () => void;
// Returns cleanup function
```

Requirements:
- 3 depth layers: large/bright (10%), medium (30%), small/dim (60%)
- Stars are white (#ffffff) at varying opacities (0.3-0.8)
- Subtle twinkle via opacity oscillation (sinusoidal, not random)
- Respect `prefers-reduced-motion` — if reduce, render static (no animation loop)
- Performance target: < 1ms per frame
- Export from `packages/runtime/src/index.ts`

### 1.2 Add Visual Design Tokens to `@cosmic/theme`

Update `packages/theme/styles/tokens.css` with these additions:

```css
/* ============================================
   GLOW SYSTEM (30-50% opacity range)
   ============================================ */
--glow-sun: 0 0 40px 10px rgba(255, 200, 100, 0.45);
--glow-moon: 0 0 30px 8px rgba(200, 200, 220, 0.35);
--glow-planet: 0 0 20px 5px rgba(100, 150, 255, 0.30);
--glow-star: 0 0 15px 3px rgba(255, 255, 255, 0.40);
--glow-accent-teal: 0 0 25px 6px rgba(45, 212, 191, 0.35);
--glow-accent-rose: 0 0 25px 6px rgba(244, 114, 182, 0.35);

/* ============================================
   CELESTIAL OBJECT PALETTE
   ============================================ */
--celestial-sun: #fbbf24;
--celestial-sun-glow: rgba(251, 191, 36, 0.45);
--celestial-moon: #e2e8f0;
--celestial-moon-glow: rgba(226, 232, 240, 0.35);
--celestial-earth: #3b82f6;
--celestial-earth-glow: rgba(59, 130, 246, 0.30);
--celestial-mars: #ef4444;
--celestial-mars-glow: rgba(239, 68, 68, 0.30);
--celestial-star: #ffffff;
--celestial-star-glow: rgba(255, 255, 255, 0.40);
--celestial-orbit: #6d7794;

/* ============================================
   INSTRUMENT ACCENTS
   ============================================ */
--accent-amber: #FFB86C;
--accent-green: #50FA7B;
--accent-ice: #8BE9FD;
--accent-rose: #FF79C6;

/* ============================================
   READOUT TYPOGRAPHY
   ============================================ */
--readout-label-size: 0.75rem;
--readout-label-weight: 600;
--readout-label-tracking: 0.05em;
--readout-label-color: var(--color-muted);
--readout-value-size: 1.5rem;
--readout-value-weight: 500;
--readout-value-color: var(--accent-amber);
--readout-value-font: "SF Mono", "Fira Code", ui-monospace, monospace;
--readout-unit-size: 0.875rem;
--readout-unit-weight: 400;
--readout-unit-color: var(--accent-ice);
```

### 1.3 Create Instrument Layer Overrides

Update `packages/theme/styles/layer-instrument.css`:

```css
[data-layer="instrument"] {
  /* Vivid accent overrides */
  --accent-teal: #2dd4bf;
  --accent-rose: #f472b6;
  --accent-violet: #a78bfa;

  /* Panel translucency */
  --panel-bg: rgba(23, 27, 34, 0.85);
  --panel-border: rgba(109, 119, 148, 0.3);
  --panel-backdrop: blur(8px);
}

[data-layer="instrument"] .readout-value {
  color: var(--accent-amber);
  font-family: var(--readout-value-font);
  font-variant-numeric: tabular-nums;
}

[data-layer="instrument"] .celestial-sun {
  fill: var(--celestial-sun);
  filter: drop-shadow(var(--glow-sun));
}

/* ... similar for moon, earth, mars, star ... */
```

### 1.4 Implement Compositional Shell CSS

Update `packages/theme/styles/demo-shell.css`:

```css
.demo-shell {
  display: grid;
  min-height: 100vh;
  background: var(--color-ink);
}

.demo-shell[data-layout="columns"] {
  grid-template-columns: 280px 1fr 280px;
  gap: var(--space-4);
}

.demo-shell[data-layout="rows"] {
  grid-template-rows: 1fr auto;
}

.demo-shell[data-layout="fullscreen"] {
  grid-template-rows: 1fr;
}

[data-stage] {
  position: relative;
  overflow: hidden;
}

[data-controls], [data-readouts] {
  padding: var(--space-4);
  background: var(--panel-bg);
  backdrop-filter: var(--panel-backdrop);
  border-radius: var(--radius-lg);
}

/* Responsive collapse */
@media (max-width: 1024px) {
  .demo-shell[data-layout="columns"] {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
}
```

---

## Phase 2: Implement `@cosmic/ui` Web Components

Use Lit for Web Components. Create these in `packages/ui/src/`:

### 2.1 `<cp-readout>` Component

```typescript
// packages/ui/src/cp-readout.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('cp-readout')
export class CpReadout extends LitElement {
  @property() label = '';
  @property() value = '';
  @property() unit = '';

  static styles = css`
    :host {
      display: block;
    }
    .label {
      font-size: var(--readout-label-size);
      font-weight: var(--readout-label-weight);
      letter-spacing: var(--readout-label-tracking);
      color: var(--readout-label-color);
      text-transform: uppercase;
    }
    .value {
      font-size: var(--readout-value-size);
      font-weight: var(--readout-value-weight);
      color: var(--readout-value-color);
      font-family: var(--readout-value-font);
      font-variant-numeric: tabular-nums;
    }
    .unit {
      font-size: var(--readout-unit-size);
      font-weight: var(--readout-unit-weight);
      color: var(--readout-unit-color);
      margin-left: 0.25em;
    }
  `;

  render() {
    return html`
      <div class="label">${this.label}</div>
      <div>
        <span class="value">${this.value}</span>
        <span class="unit">${this.unit}</span>
      </div>
    `;
  }
}
```

### 2.2 Implement Remaining Components

Create these following the same pattern:
- `<cp-slider>` — range input with label, value display, unit
- `<cp-button>` — variants: primary, ghost, outline
- `<cp-toggle>` — checkbox/switch with label
- `<cp-select>` — styled dropdown
- `<cp-panel>` — collapsible panel with header
- `<cp-accordion>` — expandable section

All components must:
- Use only CSS custom properties from `@cosmic/theme`
- Support keyboard navigation
- Announce state changes to screen readers (aria-live)
- Scale for projection (min 18px effective font size)

---

## Phase 3: Migrate Demos (COPY, Don't Modify Legacy)

### 3.1 Copy Demo Files

```bash
# For each demo in ~/Teaching/astr101-sp26/demos/
cp -r ~/Teaching/astr101-sp26/demos/{demo-name}/ apps/demos/{demo-name}/
```

### 3.2 Migration Checklist Per Demo

For EACH demo, make these changes to the COPIED version in `apps/demos/`:

1. **Replace custom HTML elements** with `@cosmic/ui` components:
   - `<input type="range">` → `<cp-slider>`
   - `<button>` → `<cp-button>`
   - `<input type="checkbox">` → `<cp-toggle>`
   - `<select>` → `<cp-select>`
   - Custom readout divs → `<cp-readout>`

2. **Update CSS imports**:
   ```typescript
   import '@cosmic/theme/styles/tokens.css';
   import '@cosmic/theme/styles/layer-instrument.css';
   import '@cosmic/theme/styles/demo-shell.css';
   ```

3. **Add starfield**:
   ```typescript
   import { initStarfield } from '@cosmic/runtime';

   const starfieldCanvas = document.getElementById('starfield') as HTMLCanvasElement;
   const cleanupStarfield = initStarfield({ canvas: starfieldCanvas });
   // Call cleanupStarfield() on demo unmount
   ```

4. **Apply celestial object styles**:
   - Sun: `class="celestial-sun"` or use `--celestial-sun` / `--glow-sun`
   - Moon: `class="celestial-moon"`
   - etc.

5. **Update shell markup** to compositional system:
   ```html
   <div class="demo-shell" data-layout="columns" data-layer="instrument">
     <aside data-controls>...</aside>
     <main data-stage>
       <canvas id="starfield"></canvas>
       <canvas id="simulation"></canvas>
     </main>
     <aside data-readouts>...</aside>
   </div>
   ```

6. **Verify physics imports** come from `@cosmic/physics`:
   ```typescript
   import { KeplersLawsModel } from '@cosmic/physics';
   // NOT inline equations or local physics files
   ```

### 3.3 Demo Migration Order

Migrate in this order (dependency order):
1. `moon-phases` — simplest, good reference
2. `angular-size` — similar complexity
3. `parallax` — simple geometry
4. `seasons` — uses earth/sun
5. `blackbody` — spectrum visualization
6. `telescope-resolution` — optics
7. `photon-energy` — light/spectra
8. `spectral-lines` — spectrum viz
9. `keplers-laws` — orbital mechanics
10. `retrograde-motion` — multi-body
11. `eclipses` — geometry
12. `conservation-laws` — physics viz
13. `two-body` — orbital mechanics
14. `hr-diagram` — stellar data

---

## Phase 4: Validation & Testing

### 4.1 Visual Regression Tests

Set up Playwright screenshot tests:
```typescript
// tests/visual/demos.spec.ts
test('moon-phases matches baseline', async ({ page }) => {
  await page.goto('/play/moon-phases/');
  await expect(page).toHaveScreenshot('moon-phases.png');
});
```

### 4.2 Physics Model Tests

Ensure all physics tests pass:
```bash
cd packages/physics && pnpm test
```

### 4.3 Accessibility Audit

Run Lighthouse on each demo:
```bash
npx lighthouse http://localhost:4321/play/moon-phases/ --only-categories=accessibility
# Target: 90+ score
```

### 4.4 Component Tests

Test each `@cosmic/ui` component:
- Keyboard navigation (Tab, Enter, Space, Arrow keys)
- Screen reader announcements
- Theme token inheritance
- Responsive scaling

---

## Critical Reminders

1. **DO NOT modify** `~/Teaching/astr101-sp26/demos/` — those are actively used for teaching
2. **All colors** must come from tokens — no hardcoded hex values in demo code
3. **All physics** must come from `@cosmic/physics` — no inline equations
4. **All UI components** must come from `@cosmic/ui` — no custom buttons/sliders
5. **Glow opacity** must be 30-50% — if it looks invisible, it's wrong
6. **Readout values** must use amber (#FFB86C) and tabular-nums
7. **Units must be explicit** — never omit or assume units

---

## Success Criteria

The migration is complete when:
- [ ] All 14 demos render in `apps/demos/` using shared components
- [ ] Starfield visible behind all demos
- [ ] Celestial objects have visible glows (30-50% opacity)
- [ ] Readouts show clear label/value/unit hierarchy
- [ ] All demos pass Lighthouse accessibility (90+)
- [ ] All physics tests pass
- [ ] Visual regression tests establish baselines
- [ ] Legacy demos in `~/Teaching/astr101-sp26/demos/` are UNCHANGED
