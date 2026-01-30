# `@cosmic/theme`

Two-layer theme system:

- **Museum layer**: site chrome (aurora backgrounds allowed)
- **Instrument layer**: demos (flat panels, high readability)

## Rules

1. Never hardcode colors in `apps/site` or demo apps. Use CSS variables from `styles/tokens.css`.
2. Use accents sparingly: badges, focus rings, tiny borders, small highlights.
3. Maintain WCAG contrast for text (≥ 4.5:1 for normal text).
4. Station cards must support print styling (import `styles/print.css` somewhere global for the museum).

## Museum usage (Astro)

- Import:
  - `@cosmic/theme/styles/tokens.css`
  - `@cosmic/theme/styles/layer-museum.css`
  - `@cosmic/theme/styles/print.css`

- Apply to body:

```html
<body class="cp-layer-museum">
```

## Instrument usage (Demos)

- Import:
  - `@cosmic/theme/styles/tokens.css`
  - `@cosmic/theme/styles/layer-instrument.css`
  - `@cosmic/theme/styles/demo-shell.css`

- Root structure:

```html
<div class="cp-layer-instrument cp-demo">
  <aside class="cp-demo__controls cp-panel">...</aside>
  <main class="cp-demo__stage cp-stage">...</main>
  <aside class="cp-demo__readouts cp-panel">...</aside>
  <section class="cp-demo__drawer cp-drawer">...</section>
</div>
```

## Magenta guidance

Use `--cp-accent4` for:
- selected/active states
- misconception callouts
- special “highlight” states

Avoid using magenta for large surfaces or body text backgrounds.

