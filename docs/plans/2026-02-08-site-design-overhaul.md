# Site Design Overhaul — Cosmic Playground

**Date:** 2026-02-08
**Status:** Approved via brainstorming session

## Goal

Transform the Cosmic Playground museum (browse) layer from "competent academic project" to "designed by a professional studio." No one should look at this site and think an academic made it.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Demo icons | Per-demo SVG scene illustrations | Unique visual identity per demo, using celestial palette tokens |
| Card layout | Image-top cards | Illustration fills upper ~40%, title + description + tags below |
| Typography | Outfit (display) + Source Sans 3 (body) | Outfit has playful geometric character; Source Sans 3 stays for zero migration risk |
| Card hover | Lift + glow | `translateY(-4px)` + accent glow shadow using `--cp-glow-*` tokens |
| Topic colors | Per-topic signature color | Each topic maps to a celestial palette color for wayfinding |
| Hero | CSS nebula glow layers | Replace ConstellationHero with radial gradient nebula over existing Canvas starfield |
| Home layout | Asymmetric featured + full-bleed topic strip | Hero card (60%) + two smaller cards (40%); edge-to-edge topic chips |

## What We Are NOT Touching

- Demo instrument layer (all 14 demos unchanged)
- Design token system (additive only, no removals)
- Layout.astro structure (header, footer, main container)
- Existing test suite (2,151 tests)
- Physics code

---

## 1. Per-Demo SVG Illustrations

14 illustrations, each a self-contained SVG scene at `viewBox="0 0 200 140"`. They use CSS custom properties from the celestial palette. Each lives as a named case in a single `DemoIllustration.astro` component (switch on slug).

| Demo | Scene | Key SVG elements |
|------|-------|-----------------|
| `moon-phases` | Crescent moon with earthshine | Moon disk (lit/dark halves), subtle earth-glow, star dots |
| `angular-size` | Two objects at different distances | Near-large circle, far-small circle, dashed sightlines to eye point |
| `parallax-distance` | Nearby star shifting against background | Foreground star, two observation points, parallax angle arc |
| `seasons` | Tilted Earth with terminator | Earth sphere with axial tilt line, day/night boundary, small sun |
| `blackbody-radiation` | Glowing thermal curve | Planck curve silhouette, color gradient fill (red to white to blue) |
| `telescope-resolution` | Airy disk diffraction | Concentric rings fading outward, central bright dot, aperture |
| `em-spectrum` | Rainbow spectrum bar with wave | Spectral gradient bar, sine wave with decreasing wavelength |
| `eclipse-geometry` | Sun-Moon-Earth alignment | Three disks in line, shadow cone, umbra/penumbra |
| `keplers-laws` | Elliptical orbit with area sweep | Ellipse, sun at focus, planet, swept area wedge |
| `retrograde-motion` | Geocentric loop | Inner/outer orbit circles, retrograde loop against stars |
| `eos-lab` | Phase diagram | Log axes, colored regime regions (ideal, degenerate, radiation) |
| `conservation-laws` | Colliding bodies | Two circles, momentum arrows, energy bar |
| `binary-orbits` | Two stars orbiting barycenter | Two dots on ellipses, center-of-mass marker, trail arcs |
| `planetary-conjunctions` | Two planets at conjunction | Inner/outer orbit arcs, two planets aligned with sun |

### Token usage

- Fill colors: `--cp-celestial-sun`, `-earth`, `-moon`, `-mars`, `-star`, `-orbit`
- Glow: `drop-shadow()` using celestial glow tokens
- Background: transparent (inherits card background)
- Animations: optional subtle CSS animation per illustration (future C-phase enhancement)

---

## 2. Card Redesign (DemoCard)

### Structure

```
.demo-card
  .demo-card__illustration   ← SVG scene (aspect-ratio: 200/140)
  .demo-card__body
    .demo-card__title         ← h3
    .demo-card__desc          ← p (2-line clamp)
    .demo-card__badges        ← TagPills (status, topics, time, level)
```

### Illustration region

- Aspect ratio: 200/140 (~1.43:1)
- Background: subtle radial gradient using the topic color at ~8% opacity
- Overflow: clip (rounded top corners via parent border-radius)
- Padding: `var(--cp-space-3)` on all sides so SVG floats inside

### Hover state

```css
.demo-card:hover {
  transform: translateY(-4px);
  box-shadow:
    var(--cp-card-shadow-hover),
    0 0 20px color-mix(in srgb, var(--topic-color) 12%, transparent);
  border-color: color-mix(in srgb, var(--topic-color) 35%, transparent);
}
```

- Transition: 200ms `var(--cp-ease-out)`
- Illustration brightens slightly on hover (opacity 0.85 to 1.0)
- Respects `prefers-reduced-motion` (no transform, instant color change only)

---

## 3. Typography: Lexend to Outfit

### Font swap

- Download Outfit variable WOFF2 (weight 100-900)
- Place at `apps/site/public/fonts/Outfit.woff2`
- Update `@font-face` in Layout.astro: replace Lexend declaration
- Update `--cp-font-display` token value: `"Outfit"` instead of `"Lexend"`
- Remove Lexend WOFF2 file and preload tag
- Remove Inter preload (underused; keep file for mono fallback)

### No other changes needed

Source Sans 3 stays for body. Monospace stays as system stack. All existing `var(--cp-font-display)` references automatically pick up Outfit.

---

## 4. Topic Color Mapping

New CSS custom properties added to `tokens.css`:

```css
:root {
  --cp-topic-earthsky:       var(--cp-celestial-earth);    /* #3b82f6 blue */
  --cp-topic-orbits:         var(--cp-accent);             /* #2f8c8d teal */
  --cp-topic-lightspectra:   var(--cp-violet);             /* #6d7794 violet */
  --cp-topic-telescopes:     var(--cp-accent-ice, #8BE9FD); /* ice blue */
  --cp-topic-datainference:  var(--cp-accent-green, #50FA7B); /* green */
  --cp-topic-stars:          var(--cp-celestial-sun);      /* #fbbf24 amber */
  --cp-topic-galaxies:       var(--cp-pink);               /* #b07a93 rose */
  --cp-topic-cosmology:      var(--cp-celestial-sun-corona); /* #ff8c00 orange */
}
```

### Application

- DemoCard receives `data-topic` attribute from primary topic
- Card CSS uses `--topic-color` custom property (set via data attribute)
- Illustration background gradient uses `--topic-color` at 8% opacity
- Hover glow uses `--topic-color` at 12% opacity
- Topic section headers on explore page use the color for the icon container

### TypeScript mirror

Add topic color map to `demoGlyphs.ts` (or a new `topicColors.ts`):

```ts
export const TOPIC_COLORS: Record<string, string> = {
  EarthSky: "var(--cp-topic-earthsky)",
  Orbits: "var(--cp-topic-orbits)",
  // ...
};
```

---

## 5. CSS Nebula Hero

Replace `ConstellationHero.astro` with `NebularHero.astro`.

### Structure

Layered CSS radial gradients creating an emission nebula effect:

```
.nebula-hero (position: absolute, covers hero zone)
  ::before  — primary nebula cloud (pink/teal radial gradient)
  ::after   — secondary nebula wisp (amber/violet offset gradient)
  .nebula-hero__stars — scattered CSS star dots with cp-twinkle animation
```

### Gradient layers (approximate)

1. **Primary cloud**: radial-gradient, ellipse 70% 50% at 60% 40%, using `--cp-pink` at 12% opacity fading to transparent
2. **Secondary wisp**: radial-gradient, ellipse 40% 60% at 35% 65%, using `--cp-celestial-sun-corona` at 8% fading to transparent
3. **Teal accent**: radial-gradient, ellipse 50% 40% at 70% 55%, using `--cp-accent` at 6%
4. **Vignette**: radial-gradient, transparent center fading to `--cp-bg0` at edges

### Animation

- Slow scale pulse: `scale(1) to scale(1.05)` over 20s, infinite alternate
- Opacity drift: `0.8 to 1.0` over 15s, offset from scale
- Respects `prefers-reduced-motion` (static, no animation)

### Mobile

- Still visible (unlike ConstellationHero which was hidden)
- Reduced size and opacity for performance

---

## 6. Home Page Layout Changes

### Asymmetric featured cards

Replace the current equal `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` with:

```css
.featured-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  grid-template-rows: auto auto;
  gap: var(--cp-space-5);
}

.featured-card:first-child {
  grid-row: 1 / -1;  /* Hero card spans both rows */
}
```

- First card (Kepler's Laws): large, spans full left column height, bigger illustration
- Cards 2 and 3: stacked on the right, smaller
- Mobile: collapses to single column (all cards equal)

### Full-bleed topic discovery strip

New component between hero and featured section:

```css
.topic-strip {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: var(--cp-space-4) var(--cp-space-5);
  overflow-x: auto;
  display: flex;
  gap: var(--cp-space-3);
  justify-content: center;
}
```

- Contains topic chips with icons, colored by topic color
- Scrollable on mobile, centered on desktop
- Subtle border-top and border-bottom for separation
- Links to `explore/?topic=X` filtered views

---

## 7. Files Changed (Summary)

### New files
- `apps/site/src/components/DemoIllustration.astro` — 14 SVG scenes
- `apps/site/src/components/NebularHero.astro` — CSS nebula hero
- `apps/site/src/components/TopicStrip.astro` — full-bleed topic chips
- `apps/site/public/fonts/Outfit.woff2` — display font
- `apps/site/src/lib/topicColors.ts` — topic-to-color mapping

### Modified files
- `packages/theme/styles/tokens.css` — add `--cp-topic-*` custom properties
- `apps/site/src/layouts/Layout.astro` — swap Lexend for Outfit in @font-face
- `apps/site/src/components/DemoCard.astro` — image-top layout, topic color, hover
- `apps/site/src/components/MiniCard.astro` — use DemoIllustration (small version)
- `apps/site/src/components/FeaturedCard` (in index.astro) — use DemoIllustration
- `apps/site/src/pages/index.astro` — asymmetric grid, topic strip, nebula hero
- `apps/site/src/components/JourneyStep.astro` — use DemoIllustration instead of DemoGlyph

### Removed files
- `apps/site/src/components/DemoGlyph.astro` — replaced by DemoIllustration
- `apps/site/src/components/ConstellationHero.astro` — replaced by NebularHero
- `apps/site/src/lib/demoGlyphs.ts` — replaced by slug-based illustration lookup
- `apps/site/public/fonts/Lexend.woff2` — replaced by Outfit

### Kept (no changes)
- All demo code (apps/demos/)
- All physics code (packages/physics/)
- All tests (except adding new ones for the redesigned components)
- Theme token system (additive only)
