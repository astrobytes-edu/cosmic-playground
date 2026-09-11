# Orbit stage: design

**Date:** 2026-09-11 · **Owner:** Anna · **Status:** direction approved, awaiting the implementation plan
**Scope:** `conservation-laws` first, then `keplers-laws`, `binary-orbits` and `planetary-conjunctions`
**Mock-ups:** [Orbit Stage Directions](https://claude.ai/code/artifact/51806f5b-ae9e-4173-bbed-c663d484f2d3); the three directions are live there

## 1. Decision

Anna chose **B's landscape inside A's glass**: the effective-potential landscape is the hero of the stage, and the instrument column and dock are frosted glass over a deep sky. The result must **stay inside the existing theme**: Aurora Ink tokens, the instrument layer, Outfit / Source Sans 3, amber readout values with ice units, the starfield, and the motion contract. The **effective-potential equation is shown and explained** in the demo.

The mock-up palettes (Geist, gold `#f2c14e`, graphite `#0d0f12`) were for exploring a direction only and are not adopted. Every colour below is an existing token or a new token added to `packages/theme`.

Why the demo currently looks basic (measured on `9d446e4`): a flat `--cp-bg0` ground; the orbit boxed in a bordered teal-gradient square; a 2 px orbit line with 10 px and 8 px dots; one panel style for everything; eight identical amber cards; and colours that stand for no quantity.

## 2. What stays (theme contracts)

| Contract | Source | In the orbit shell |
|---|---|---|
| Tokens only, no colour literals in demo CSS | theme spec §2.2, `apps:no-color-literals` | Unchanged. three.js reads colours from CSS tokens at runtime (§8.3). |
| Starfield | `initStarfield()` | Kept as the far layer behind the WebGL canvas. |
| Translucent panels + blur | invariant 4 | Kept; the blur and the glass opacity become tokens (§3.2). |
| Readouts: label → value → unit, amber value, ice unit | invariant 3 | Kept for the value list. The energy bar adds quantity swatches (§3.3). |
| Celestial tokens, glow opacity 30–50 % | invariants 1, 6 | The Sun uses `--cp-celestial-sun-core/-sun/-corona` and `--cp-glow-sun`; the body uses `--cp-celestial-earth`. |
| Four regions: controls, stage, readouts, drawer | theme spec §4 | Kept; only their grid areas move (§4). |
| KaTeX for every symbol; ASCII only inside canvases | CLAUDE.md math rule | Stage labels are **DOM overlays rendered by KaTeX**, not canvas text (§5.3). |
| Motion: `cp-fade-in`/`cp-slide-up`, reduced motion | invariant 8 | Kept; the scene also honours `prefers-reduced-motion` (§9). |
| Fonts | `--cp-font-display` Outfit, `--cp-font-sans` Source Sans 3, `--cp-readout-value-font` | Unchanged. |

## 3. Visual system

### 3.1 Ground: depth, not a box

- No stage card: the bordered, rounded, teal-gradient `.orbit` square is removed. The stage is open sky, full bleed within `cp-demo__stage`.
- Three depth layers, far to near:
  1. the existing starfield canvas;
  2. faint nebula haze from the instrument tints `--cp-tint-violet` and `--cp-tint-teal` at scene scale, drawn in the WebGL scene with low alpha;
  3. the landscape and the orbit.
- A vignette to `--cp-bg0` at the edges keeps the glass legible.

### 3.2 Glass: A's instrument surfaces, as tokens

New tokens in `layer-instrument.css`, applied first under `data-shell="orbit"`:

| Token | Value | Note |
|---|---|---|
| `--cp-instr-glass-bg` | `color-mix(in srgb, var(--cp-bg1) 62%, transparent)` | Replaces the 0.88 opacity only in the orbit shell. |
| `--cp-instr-glass-blur` | `16px` | The panel contract test accepts `blur(var(--cp-instr-glass-blur))`. |
| `--cp-instr-glass-edge` | `inset 0 1px 0 color-mix(in srgb, var(--cp-text) 6%, transparent)` | Top highlight that reads as glass. |

- Panels use `--cp-r-2` and `--cp-shadow-2`.
- Contrast is measured, not assumed. `tokenContrast.test.ts` gains the composited glass ground over the brightest stage pixel: nebula plus bloom behind the panel. `--cp-muted` must clear 4.5:1 on it. If it does not, the glass opacity rises; the text token does not change.

### 3.3 Colour grammar: one meaning per colour

New semantic tokens in `tokens.css`, aliases of existing colours:

| Token | Alias of | Means | Why |
|---|---|---|---|
| `--cp-energy-kinetic` | `--cp-celestial-sun` (`#fbbf24`) | $K$, and the radial part $\tfrac12 v_r^2$ | Warm; matches B's gold drop line. |
| `--cp-energy-potential` | `--cp-violet` (instrument `#a78bfa`) | $U$, $U_{\rm eff}$ and the landscape mesh | Cool; already `--cp-celestial-orbit`, so the orbit and the potential share a hue. |
| `--cp-energy-total` | `--cp-text` | $\varepsilon$: the level plane, the level line and the bar marker | Neutral: the conserved quantity is the one that does not change colour. |

Gold against violet is a warm/cool pair along the blue–yellow axis, which survives protanopia and deuteranopia. Teal stays reserved for interaction (focus, buttons, active chips) and pink for challenges, as in theme spec §5.

**Known overlap:** amber readout values (`#FFB86C`) sit close to kinetic gold. The value list keeps the amber contract. $K$, $U$ and $\varepsilon$ readouts carry a 3 px swatch in their energy token, so no quantity relies on the amber alone.

### 3.4 Type and motion

- **Type:** Outfit for the one demo title, and Source Sans 3 for labels in sentence case. The instrument's section titles drop the uppercase `cp-panel-header` treatment under the orbit shell. Readout values use the existing mono tabular stack.
- **Motion:**
  - the orbit trail brightens with speed;
  - ghost positions at equal time steps;
  - Sun bloom (TSL `bloom()` + `RenderPipeline`, WebGPU and WebGL2 only);
  - entry animations use the existing keyframes.
- No decorative motion beyond the star twinkle already in the starfield.

## 4. Layout

Desktop (≥ 1025 px), `data-shell="orbit"` in `demo-shell.css`:

```
grid-template-columns: minmax(0, 1fr) clamp(300px, 24vw, 380px);
grid-template-areas:
  "stage     readouts"
  "controls  readouts"
  "drawer    drawer";
```

- `cp-demo__stage` holds the scene, the camera switch (Landscape / Top-down / Edge-on), the presets and the caption.
- `cp-demo__readouts` becomes the **instrument** column, in glass: energy bar, then the $U_{\rm eff}$ plot with its equation, then values.
- `cp-demo__controls` becomes the **dock** under the stage, in glass: Play/Pause, Step, time scrubber, and the $M$, $r_0$, $v/v_{\rm circ}$ and direction sliders.
- `cp-demo__drawer` keeps What to notice, Model notes and the new **Why an effective potential?** accordion.
- The stage height budget is measured, then `layout-budget.spec.ts` is tightened. At 1280×720, stage, dock and energy bar must all be above the fold.
- **Phones (< 1025 px):**
  - stage first;
  - then the instrument as tabs (Energy · $U_{\rm eff}$ · Values);
  - the dock moves into the shared bottom sheet (`initBottomSheet`, collapsed / half / full).
  - The 320 px reflow gate applies.

## 5. Stage

### 5.1 Landscape view (default)

- **Surface:** $z = U_{\rm eff}(r)$ as a surface of revolution. It is drawn as a lit wireframe in `--cp-energy-potential` with depth-faded rings, clamped above the centrifugal barrier and below $1.05\,|U_{\rm eff,min}|$.
- **Level plane:** a translucent annulus at height $\varepsilon$ in `--cp-energy-total`. Dashed rings mark where it cuts the surface: $r_p$ and, when bound, $r_a$.
- **Orbit:** traced twice.
  - On the level plane (neutral): where the body is.
  - Projected onto the surface (violet): the potential it is passing over.
- **Body and drop line:** the body is `--cp-celestial-earth` with `--cp-glow-planet`. A gold drop line to the surface has length $\varepsilon - U_{\rm eff}(r) = \tfrac12 v_r^2$. It shrinks to zero at the turning points.
- **Sun:** the sun tokens with bloom, on the axis.
- **Permanent label, top-left:** "Height is energy per unit mass, not depth in space." It is a `cp-callout data-kind="misconception"` style chip.

### 5.2 Top-down and edge-on views

- **Top-down:** the true orbit in the plane, with ghosts at equal times, swept-area wedges, and the velocity arrow to scale. The arrow is the distance covered in one ghost step, as now.
- **Edge-on:** the landscape profile; it is the $U_{\rm eff}$ plot in 3D.
- Camera changes animate over `--cp-duration-enter`, or cut when reduced motion is on.

### 5.3 Labels

Labels are DOM elements positioned from projected scene coordinates and typeset by KaTeX: $r_p$, $r_a$, $\varepsilon$, $U_{\rm eff}(r)$ and the scale. They follow the math rule, inherit `.katex { text-transform: none }`, and give E2E real text to assert.

## 6. The effective potential: equation and explanation

### 6.1 The physics (per unit mass, AU / yr / $M_\odot$, $\mu = GM$, $G = 4\pi^2\,\mathrm{AU}^3/(\mathrm{yr}^2 M_\odot)$)

Split the speed into radial and tangential parts, $v^2 = v_r^2 + v_t^2$. Angular momentum per unit mass is conserved, $h = r v_t$, so $v_t = h/r$ and

$$
\varepsilon = \tfrac12 v_r^2 + \underbrace{\tfrac12 \frac{h^2}{r^2} - \frac{\mu}{r}}_{U_{\rm eff}(r)},
\qquad
U_{\rm eff}(r) = -\frac{\mu}{r} + \frac{h^2}{2r^2}.
$$

What the equation says:

- The tangential kinetic energy depends only on $r$ once $h$ is fixed, so it acts like a potential: the **centrifugal barrier** $h^2/2r^2$ that keeps the body from reaching $r = 0$.
- Because $\tfrac12 v_r^2 \ge 0$, motion is allowed only where $U_{\rm eff}(r) \le \varepsilon$.
- **Turning points** ($v_r = 0$) solve $U_{\rm eff}(r) = \varepsilon$: $r = \dfrac{-\mu \pm \sqrt{\mu^2 + 2\varepsilon h^2}}{2\varepsilon}$. These equal $r_p = p/(1+e)$ and $r_a = p/(1-e)$, with $p = h^2/\mu$ and $e = \sqrt{1 + 2\varepsilon h^2/\mu^2}$.
- The **minimum** is at $r_c = h^2/\mu$, with $U_{\rm eff}(r_c) = -\mu^2/2h^2$. Setting $\varepsilon$ there gives a circular orbit.
- **$\varepsilon \ge 0$:** only the inner turning point exists, so the body comes in once and leaves (parabolic or hyperbolic).

Units: $U_{\rm eff}$ and $\varepsilon$ in $\mathrm{AU^2/yr^2}$; $h$ in $\mathrm{AU^2/yr}$.

**Required tests** (model contract, `@cosmic/physics`):
- Known answers: at $r_c$, $\partial U_{\rm eff}/\partial r = 0$, with the value $-\mu^2/2h^2$.
- Round trip: $U_{\rm eff}(r_p) = U_{\rm eff}(r_a) = \varepsilon$ for bound presets and an asymmetric non-preset state.
- Energy split: $\tfrac12 v_r^2 + U_{\rm eff}(r) = \varepsilon$ along a sampled orbit, to $10^{-9}$ relative error.
- The parabolic and radial edge cases.

### 6.2 Where it appears

1. **Instrument, $U_{\rm eff}$ section:**
   - the equation typeset under the plot title;
   - the curve in `--cp-energy-potential`;
   - the $\varepsilon$ line in `--cp-energy-total`;
   - the allowed region, where $\varepsilon \ge U_{\rm eff}$, shaded in `--cp-energy-kinetic` at low alpha;
   - the body's dot on the $\varepsilon$ line, with its gold drop line to the curve;
   - $r_p$ and $r_a$ ticks.
   - A one-line caption: "The body can only be where the line is above the curve; it turns around where they meet."
2. **Drawer, "Why an effective potential?":** the three-step derivation above, the barrier and turning-point bullets, and a sentence tying the landscape to the plot: "The landscape is this curve spun around the Sun."
3. **Stage:** the misconception label (§5.1), and the drop line labelled $\tfrac12 v_r^2$ on hover or focus.
4. **Station card and instructor pages:** a short version, and one instructor question on reading turning points from the plot, added in the rollout task with a math validator run.

## 7. Instrument

- **Energy bar:** one object in two rows.
  - $U$ runs from 0 down to $U$ in violet.
  - $K$ starts where $U$ ends, in gold, so its far end always lands on the fixed $\varepsilon$ marker.
  - The scale is fixed per orbit (from $-\mu/r_p$ to $\max(\varepsilon, 0)$), so the bars visibly trade while the marker stays still.
  - Values sit in the row labels, never inside short bars.
- **Values:** $\varepsilon$, $|h|$, $v$ (km/s), $r$, $e$, $r_p$, orbit type. They use the existing readout typography, with sentence-case labels and no per-value card boxes: one glass surface, grouped with spacing.
- **Orbit type** is a status chip in the stage header: Circular / Elliptical / Parabolic / Hyperbolic, with bound or unbound.

## 8. Architecture

### 8.1 Packages

- **`@cosmic/physics`** adds `effectivePotentialAu2Yr2({ rAu, hAu2Yr, muAu3Yr2 })`, `radialKineticAu2Yr2(...)` and `circularOrbitRadiusAu({ hAu2Yr, muAu3Yr2 })`. `rpAu`/`raAu` already come from `initialOrbit`. There is no maths in the renderer.
- **`@cosmic/orbit-stage`** (new, in `packages/`) is presentation only. `createOrbitStage(host, options)` returns `null` when no renderer can be created, per the WebGL convention in CLAUDE.md. It owns the scene, the cameras, the label overlay and `dispose()`. Inputs are plain numbers from the demo's `logic.ts`.
- **`apps/demos/.../conservation-laws`**: `main.ts` wires controls to the physics and passes a frame state to the stage. `logic.ts` gains the pure helpers (energy-bar scale, allowed-region samples, label text).

### 8.2 Renderer chain

`three/webgpu` `WebGPURenderer` does the following:
- WebGPU where it is available;
- its own WebGL2 backend otherwise;
- `forceWebGL` in E2E, because headless WebGPU is unreliable.

If neither backend starts, the demo falls back to the current SVG top-down drawing, restyled to §3. The landscape is replaced by the 2D $U_{\rm eff}$ plot, which is always present. WebGPU is never required.

### 8.3 Theme colours in the scene

`readStageTheme(root)` resolves the tokens with `getComputedStyle` into `THREE.Color`:
- the energy tokens;
- the `--cp-celestial-*` tokens;
- `--cp-bg0`;
- the tints.

It re-reads when `high-contrast.css` or the colour scheme changes. There are no hex literals in TypeScript.

### 8.4 Test hooks

- The stage publishes `data-camera`, `data-renderer` (`webgpu` | `webgl2` | `svg`), `data-turning-points` and `data-energy-level` on its overlay. The WebGL buffer can't be read back, so E2E has no other way to see state (CLAUDE.md).

## 9. Accessibility

- **Keyboard:**
  - every slider has `aria-valuetext`;
  - the camera switch is a radio group;
  - the time scrubber has `aria-valuetext` "t = 1.41 yr of 2.38 yr";
  - Step is kept.
- **Live region:** it announces orbit type changes, turning points ("Turns around at 1.00 AU and 2.57 AU"), and Play/Pause/Reset.
- **Reduced motion:** starts paused; no camera tweens; bloom kept, but no pulsing.
- **The scene has a text equivalent:** a visually hidden description that updates with the preset ("Energy landscape: the total-energy level cuts the potential at 1.00 AU and 2.57 AU; the orbit is bound").
- **Direct manipulation (phase 2):** dragging the body or the velocity tip always has slider equivalents.

## 10. Testing

- **Physics:** the §6.1 tests, RED first.
- **Logic:** energy-bar scale, allowed-region sampling and label strings, at asymmetric states.
- **Design contracts:**
  - no colour literals;
  - glass tokens;
  - energy tokens used by the bar, plot and scene theme;
  - KaTeX labels contain no Unicode math;
  - `.orbit` box styles removed.
- **Theme:** token existence for the new tokens; contrast of `--cp-muted` and readout values on the composited glass ground.
- **E2E** (one Playwright run at a time, WebGL2 forced):
  - `data-renderer` is `webgl2`;
  - turning-point labels match $r_p$/$r_a$ from the readouts;
  - the camera switch moves `data-camera`;
  - the SVG fallback renders with WebGL disabled;
  - layout budget at 1440×900 and 1280×720;
  - reflow at 320 px;
  - bottom sheet on phones;
  - reduced motion.
- **Reviews:**
  - a physics review before pushing anything in §5–§7;
  - a visual review at the four sizes before and after;
  - one reviewer agent at a time.

## 11. Phases

1. **Visual system and shell:** theme tokens, the orbit shell grid, glass, energy bar, $U_{\rm eff}$ plot with the equation and drawer copy, restyled SVG top-down fallback. This alone fixes the "basic" look without WebGPU.
2. **Stage:** `@cosmic/orbit-stage`, landscape and top-down cameras, KaTeX label overlay, bloom, trails and ghosts.
3. **Interaction:** edge-on view, dragging the body and velocity, time scrubber, live orbit preview.
4. **Pedagogy and polish:** challenges and the predict chip, guided tour, sonified screen-reader mode, station and instructor copy.
5. **Rollout** to `keplers-laws`, then `binary-orbits`, then `planetary-conjunctions` (after its audit and an inclination model).

Readiness stays `candidate` until Anna approves promotion.

## 12. Open questions

- Should the glass tokens become the default for every instrument demo after conservation-laws ships, or stay orbit-shell only?
- Is the misconception label permanent, or dismissible after the first visit?
