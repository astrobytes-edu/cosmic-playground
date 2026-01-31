# @cosmic/theme

Design tokens and component styles for Cosmic Playground.

## Quick Start

```css
@import "@cosmic/theme/styles/tokens.css";
@import "@cosmic/theme/styles/layer-museum.css";
```

## Token Categories

### Colors

**Aurora Ink Palette** (dark theme):

- `--cp-bg0` through `--cp-bg3`: Warm ink blacks
- `--cp-text`, `--cp-text2`, `--cp-muted`, `--cp-faint`: Neutral text
- `--cp-accent` (teal), `--cp-pink`, `--cp-violet`: Aurora accents

**Paper Palette** (light theme):

- Apply via `data-theme="paper"` or `.cp-layer-paper`

### Typography

- Sizes: `--cp-text-sm` (14px) through `--cp-text-hero` (64px)
- Weights: `--cp-font-normal` (400) through `--cp-font-bold` (700)
- Line heights: `--cp-leading-tight` (1.25), `--cp-leading-normal` (1.5)

### Spacing

`--cp-space-0` (2px) through `--cp-space-7` (48px)

### Motion

- Durations: `--cp-transition-fast` (150ms), `--cp-transition-normal` (200ms)
- Easing: `--cp-ease-out`, `--cp-ease-in-out`, `--cp-ease-spring`

## Components

### Button (`.cp-button`)

```html
<button class="cp-button">Default</button>
<button class="cp-button cp-button--primary">Primary</button>
<button class="cp-button cp-button--ghost">Ghost</button>
<button class="cp-button cp-button--accent">Accent (Pink)</button>
```

### Form Inputs (`.cp-input`, `.cp-select`, `.cp-textarea`)

```html
<div class="cp-field">
  <label class="cp-label">Email</label>
  <input type="email" class="cp-input" placeholder="you@example.com">
</div>
```

## Theme Layers

1. **Museum** (`.cp-layer-museum`): Dark with aurora gradients
2. **Instrument** (`.cp-layer-instrument`): Calmer dark for demos
3. **Paper** (`.cp-layer-paper`): Light for instructor materials

## Accessibility

- All colors meet WCAG AA contrast (4.5:1)
- High contrast mode: `data-contrast="high"` or `prefers-contrast: more`
- Reduced motion: respects `prefers-reduced-motion: reduce`
