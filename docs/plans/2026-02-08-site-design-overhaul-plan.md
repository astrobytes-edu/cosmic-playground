# Site Design Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the museum (browse) layer from academic-looking to professionally designed, with per-demo SVG illustrations, topic color coding, Outfit font, nebula hero, and asymmetric home layout.

**Architecture:** Six independent workstreams that share a common foundation (topic color tokens). Task 1 adds tokens, Tasks 2-7 build on them. Tasks 2-7 are largely independent of each other and can be done in any order after Task 1.

**Tech Stack:** Astro components (.astro), CSS custom properties, SVG, Google Fonts (Outfit variable WOFF2)

**Design doc:** `docs/plans/2026-02-08-site-design-overhaul.md`

---

## Task 1: Add Topic Color Tokens + Topic Colors Module

**Files:**
- Modify: `packages/theme/styles/tokens.css` (after line ~131, before the glow section)
- Create: `apps/site/src/lib/topicColors.ts`

**Step 1: Add topic color CSS custom properties to tokens.css**

Add these lines inside the existing `:root { }` block in `packages/theme/styles/tokens.css`, after the existing chart color tokens (around line 131):

```css
  /* Topic wayfinding colors (museum layer) */
  --cp-topic-earthsky:       var(--cp-celestial-earth);
  --cp-topic-orbits:         var(--cp-accent);
  --cp-topic-lightspectra:   var(--cp-violet);
  --cp-topic-telescopes:     #8BE9FD;
  --cp-topic-datainference:  #50FA7B;
  --cp-topic-stars:          var(--cp-celestial-sun);
  --cp-topic-galaxies:       var(--cp-pink);
  --cp-topic-cosmology:      var(--cp-celestial-sun-corona);
```

**Step 2: Create the topicColors.ts module**

Create `apps/site/src/lib/topicColors.ts`:

```ts
/** Maps topic enum keys to their CSS custom property names. */
export const TOPIC_CSS_VAR: Record<string, string> = {
  EarthSky: "--cp-topic-earthsky",
  Orbits: "--cp-topic-orbits",
  LightSpectra: "--cp-topic-lightspectra",
  Telescopes: "--cp-topic-telescopes",
  DataInference: "--cp-topic-datainference",
  Stars: "--cp-topic-stars",
  Galaxies: "--cp-topic-galaxies",
  Cosmology: "--cp-topic-cosmology",
};

/** Returns the CSS var() reference for a topic's color. Falls back to accent. */
export function topicColor(topic: string): string {
  const v = TOPIC_CSS_VAR[topic];
  return v ? `var(${v})` : "var(--cp-accent)";
}

/** Returns the primary topic from an array of topics. */
export function primaryTopic(topics: string[]): string {
  return topics[0] ?? "Orbits";
}
```

**Step 3: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build with no errors.

**Step 4: Commit**

```bash
git add packages/theme/styles/tokens.css apps/site/src/lib/topicColors.ts
git commit -m "feat(theme): add per-topic wayfinding color tokens"
```

---

## Task 2: Swap Lexend Font for Outfit

**Files:**
- Download: `apps/site/public/fonts/Outfit.woff2` (from Google Fonts)
- Modify: `apps/site/src/layouts/Layout.astro` (lines 43-53, @font-face block + preload)
- Modify: `packages/theme/styles/tokens.css` (line 111, --cp-font-display)
- Remove: `apps/site/public/fonts/Lexend.woff2`

**Step 1: Download Outfit variable WOFF2**

Run:
```bash
curl -L "https://fonts.gstatic.com/s/outfit/v13/QGYyz_MVcBeNP4NjuGObqx1XmO1I4W61SJ.woff2" -o apps/site/public/fonts/Outfit.woff2
```

If that URL doesn't work, use the Google Fonts CSS API to find the current URL:
```bash
curl -s "https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" -H "User-Agent: Mozilla/5.0" | grep -o 'https://[^)]*woff2'
```

**Step 2: Update @font-face in Layout.astro**

In `apps/site/src/layouts/Layout.astro`, change the Lexend preload (line 43) and @font-face block:

Replace:
```html
<link rel="preload" href={withBase("fonts/Lexend.woff2")} as="font" type="font/woff2" crossorigin />
```
With:
```html
<link rel="preload" href={withBase("fonts/Outfit.woff2")} as="font" type="font/woff2" crossorigin />
```

Replace the Lexend @font-face declaration (inside the `<style set:html>` block):
```css
@font-face {
  font-family: "Lexend";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("${withBase("fonts/Lexend.woff2")}") format("woff2");
}
```
With:
```css
@font-face {
  font-family: "Outfit";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("${withBase("fonts/Outfit.woff2")}") format("woff2");
}
```

Also remove the Inter preload line (line 45):
```html
<link rel="preload" href={withBase("fonts/Inter.woff2")} as="font" type="font/woff2" crossorigin />
```
(Keep the Inter woff2 file itself — it may be used as mono fallback.)

**Step 3: Update the --cp-font-display token**

In `packages/theme/styles/tokens.css`, line 111, change:
```css
--cp-font-display: "Lexend", ui-sans-serif, system-ui, sans-serif;
```
To:
```css
--cp-font-display: "Outfit", ui-sans-serif, system-ui, sans-serif;
```

**Step 4: Remove old font files**

```bash
rm apps/site/public/fonts/Lexend.woff2
```

Keep `apps/site/public/fonts/Lexend-LICENSE.txt` (attribution).

**Step 5: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build. All headings now render in Outfit.

**Step 6: Commit**

```bash
git add apps/site/public/fonts/Outfit.woff2 apps/site/src/layouts/Layout.astro packages/theme/styles/tokens.css
git rm apps/site/public/fonts/Lexend.woff2
git commit -m "feat(theme): swap Lexend display font for Outfit"
```

---

## Task 3: Create DemoIllustration Component (14 SVG Scenes)

This is the largest task. Build all 14 illustrations in a single component file.

**Files:**
- Create: `apps/site/src/components/DemoIllustration.astro`

**Step 1: Create the component scaffold**

Create `apps/site/src/components/DemoIllustration.astro`:

```astro
---
/**
 * Per-demo SVG scene illustration for cards.
 * Each demo gets a unique mini-scene using celestial palette tokens.
 * viewBox is 200x140, aspect ratio ~1.43:1.
 */
interface Props {
  slug: string;
  class?: string;
}

const { slug, class: className } = Astro.props;
---

<svg
  class:list={["demo-illus", className]}
  viewBox="0 0 200 140"
  aria-hidden="true"
  focusable="false"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    {/* Shared gradients and filters */}
    <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--cp-celestial-sun-core)" />
      <stop offset="60%" stop-color="var(--cp-celestial-sun)" />
      <stop offset="100%" stop-color="var(--cp-celestial-sun-corona)" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="earth-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--cp-celestial-earth)" />
      <stop offset="100%" stop-color="var(--cp-celestial-earth)" stop-opacity="0" />
    </radialGradient>
    <filter id="soft-glow">
      <feGaussianBlur stdDeviation="2" />
    </filter>
  </defs>

  {/* Background star dots (shared across all illustrations) */}
  <g class="demo-illus__stars" opacity="0.3">
    <circle cx="15" cy="12" r="0.8" fill="var(--cp-celestial-star)" />
    <circle cx="45" cy="28" r="0.6" fill="var(--cp-celestial-star)" />
    <circle cx="78" cy="8" r="0.7" fill="var(--cp-celestial-star)" />
    <circle cx="120" cy="22" r="0.5" fill="var(--cp-celestial-star)" />
    <circle cx="155" cy="15" r="0.8" fill="var(--cp-celestial-star)" />
    <circle cx="185" cy="35" r="0.6" fill="var(--cp-celestial-star)" />
    <circle cx="30" cy="125" r="0.5" fill="var(--cp-celestial-star)" />
    <circle cx="170" cy="118" r="0.7" fill="var(--cp-celestial-star)" />
  </g>

  {/* Per-demo scene — switch on slug */}

  {slug === "moon-phases" && (
    <g>
      {/* Earth-glow reflection */}
      <circle cx="100" cy="70" r="32" fill="url(#earth-glow)" opacity="0.08" filter="url(#soft-glow)" />
      {/* Moon disk — dark side */}
      <circle cx="100" cy="70" r="28" fill="var(--cp-celestial-moon-dark)" />
      {/* Moon disk — lit crescent */}
      <path d="M100 42 A28 28 0 0 1 100 98 A16 28 0 0 0 100 42" fill="var(--cp-celestial-moon)" />
      {/* Subtle earthshine on dark side */}
      <circle cx="92" cy="70" r="26" fill="var(--cp-celestial-earth)" opacity="0.04" />
    </g>
  )}

  {slug === "keplers-laws" && (
    <g>
      {/* Sun at focus */}
      <circle cx="70" cy="70" r="12" fill="url(#sun-glow)" />
      <circle cx="70" cy="70" r="6" fill="var(--cp-celestial-sun)" />
      {/* Elliptical orbit */}
      <ellipse cx="100" cy="70" rx="65" ry="45" stroke="var(--cp-celestial-orbit)" stroke-width="0.8" opacity="0.4" />
      {/* Swept area wedge */}
      <path d="M70 70 L155 45 A65 45 0 0 1 160 65 Z" fill="var(--cp-accent)" opacity="0.15" />
      {/* Planet */}
      <circle cx="155" cy="45" r="5" fill="var(--cp-celestial-earth)" />
      <circle cx="155" cy="45" r="8" fill="var(--cp-celestial-earth)" opacity="0.15" filter="url(#soft-glow)" />
    </g>
  )}

  {slug === "angular-size" && (
    <g>
      {/* Eye/observer point */}
      <circle cx="30" cy="70" r="3" fill="var(--cp-celestial-moon)" />
      {/* Near object (large) */}
      <circle cx="90" cy="55" r="14" fill="var(--cp-celestial-earth)" opacity="0.6" />
      {/* Far object (small) */}
      <circle cx="160" cy="85" r="7" fill="var(--cp-celestial-mars)" opacity="0.5" />
      {/* Sightlines */}
      <line x1="33" y1="68" x2="160" y2="78" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" stroke-dasharray="4 3" opacity="0.5" />
      <line x1="33" y1="72" x2="160" y2="92" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" stroke-dasharray="4 3" opacity="0.5" />
      {/* Angle arc */}
      <path d="M45 66 A15 15 0 0 1 45 74" stroke="var(--cp-accent)" stroke-width="1" fill="none" />
    </g>
  )}

  {slug === "parallax-distance" && (
    <g>
      {/* Nearby star */}
      <circle cx="100" cy="50" r="4" fill="var(--cp-celestial-sun)" />
      <circle cx="100" cy="50" r="8" fill="var(--cp-celestial-sun)" opacity="0.15" filter="url(#soft-glow)" />
      {/* Two observation points */}
      <circle cx="60" cy="115" r="3" fill="var(--cp-celestial-earth)" />
      <circle cx="140" cy="115" r="3" fill="var(--cp-celestial-earth)" />
      {/* Baseline */}
      <line x1="60" y1="115" x2="140" y2="115" stroke="var(--cp-accent)" stroke-width="1" />
      {/* Sightlines */}
      <line x1="60" y1="115" x2="100" y2="50" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" stroke-dasharray="3 2" opacity="0.5" />
      <line x1="140" y1="115" x2="100" y2="50" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" stroke-dasharray="3 2" opacity="0.5" />
      {/* Parallax angle arc */}
      <path d="M90 58 A12 12 0 0 1 110 58" stroke="var(--cp-accent)" stroke-width="1" fill="none" />
    </g>
  )}

  {slug === "seasons" && (
    <g>
      {/* Sun (small, off to side) */}
      <circle cx="30" cy="70" r="10" fill="url(#sun-glow)" />
      <circle cx="30" cy="70" r="5" fill="var(--cp-celestial-sun)" />
      {/* Earth */}
      <circle cx="130" cy="70" r="22" fill="var(--cp-celestial-earth)" />
      {/* Day/night terminator */}
      <clipPath id="earth-clip"><circle cx="130" cy="70" r="22" /></clipPath>
      <rect x="130" y="48" width="22" height="44" fill="var(--cp-bg0)" opacity="0.6" clip-path="url(#earth-clip)" />
      {/* Axial tilt line */}
      <line x1="120" y1="45" x2="140" y2="95" stroke="var(--cp-celestial-star)" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.6" />
      {/* Land hints */}
      <circle cx="122" cy="65" r="5" fill="var(--cp-celestial-earth-land, #4a9d4a)" opacity="0.4" clip-path="url(#earth-clip)" />
    </g>
  )}

  {slug === "blackbody-radiation" && (
    <g>
      {/* Planck curve */}
      <defs>
        <linearGradient id="planck-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff3333" />
          <stop offset="35%" stop-color="#ff8800" />
          <stop offset="55%" stop-color="#ffffff" />
          <stop offset="80%" stop-color="#8888ff" />
          <stop offset="100%" stop-color="#4444cc" />
        </linearGradient>
      </defs>
      {/* Axes */}
      <line x1="30" y1="115" x2="180" y2="115" stroke="var(--cp-muted)" stroke-width="0.6" opacity="0.5" />
      <line x1="30" y1="115" x2="30" y2="25" stroke="var(--cp-muted)" stroke-width="0.6" opacity="0.5" />
      {/* Planck curve silhouette */}
      <path d="M35 115 Q50 112, 60 100 Q75 60, 90 35 Q100 28, 110 35 Q130 55, 150 80 Q165 100, 180 110" stroke="url(#planck-fill)" stroke-width="2" fill="none" />
      {/* Filled area */}
      <path d="M35 115 Q50 112, 60 100 Q75 60, 90 35 Q100 28, 110 35 Q130 55, 150 80 Q165 100, 180 110 L180 115 Z" fill="url(#planck-fill)" opacity="0.08" />
      {/* Peak marker */}
      <circle cx="100" cy="28" r="2" fill="var(--cp-celestial-star)" />
    </g>
  )}

  {slug === "telescope-resolution" && (
    <g>
      {/* Airy disk — concentric rings */}
      <circle cx="100" cy="70" r="40" fill="var(--cp-accent)" opacity="0.03" />
      <circle cx="100" cy="70" r="30" fill="var(--cp-accent)" opacity="0.05" />
      <circle cx="100" cy="70" r="20" fill="var(--cp-accent)" opacity="0.08" />
      <circle cx="100" cy="70" r="12" fill="var(--cp-accent)" opacity="0.15" />
      <circle cx="100" cy="70" r="6" fill="var(--cp-celestial-star)" opacity="0.8" />
      <circle cx="100" cy="70" r="3" fill="var(--cp-celestial-star)" />
      {/* Ring outlines */}
      <circle cx="100" cy="70" r="20" stroke="var(--cp-accent)" stroke-width="0.5" fill="none" opacity="0.3" />
      <circle cx="100" cy="70" r="30" stroke="var(--cp-accent)" stroke-width="0.4" fill="none" opacity="0.2" />
      <circle cx="100" cy="70" r="40" stroke="var(--cp-accent)" stroke-width="0.3" fill="none" opacity="0.15" />
      {/* Aperture hint */}
      <path d="M55 120 L100 100 L145 120" stroke="var(--cp-muted)" stroke-width="0.6" fill="none" opacity="0.3" />
    </g>
  )}

  {slug === "em-spectrum" && (
    <g>
      {/* Spectrum gradient bar */}
      <defs>
        <linearGradient id="spectrum-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#cc0000" />
          <stop offset="16%" stop-color="#ff6600" />
          <stop offset="33%" stop-color="#ffff00" />
          <stop offset="50%" stop-color="#00cc00" />
          <stop offset="66%" stop-color="#0066ff" />
          <stop offset="83%" stop-color="#4400cc" />
          <stop offset="100%" stop-color="#6600aa" />
        </linearGradient>
      </defs>
      <rect x="25" y="55" width="150" height="16" rx="3" fill="url(#spectrum-bar)" opacity="0.8" />
      {/* Sine wave above — decreasing wavelength */}
      <path d="M25 40 Q37 28, 50 40 Q63 52, 76 40 Q85 32, 94 40 Q101 46, 108 40 Q113 36, 118 40 Q122 43, 126 40 Q129 38, 132 40 Q135 42, 138 40 Q140 39, 142 40 Q144 41, 146 40 Q148 39.5, 150 40 Q152 40.5, 154 40 Q155 39.5, 157 40 Q158 40.3, 160 40 Q161 39.7, 163 40 Q164 40.2, 166 40 Q167 39.8, 168 40 L175 40" stroke="var(--cp-celestial-star)" stroke-width="1" fill="none" opacity="0.5" />
      {/* Labels */}
      <text x="25" y="90" fill="var(--cp-muted)" font-size="7" font-family="var(--cp-font-sans)">Radio</text>
      <text x="155" y="90" fill="var(--cp-muted)" font-size="7" font-family="var(--cp-font-sans)">Gamma</text>
    </g>
  )}

  {slug === "eclipse-geometry" && (
    <g>
      {/* Sun */}
      <circle cx="30" cy="70" r="18" fill="url(#sun-glow)" />
      <circle cx="30" cy="70" r="10" fill="var(--cp-celestial-sun)" />
      {/* Moon (in front of sun from Earth's perspective) */}
      <circle cx="90" cy="70" r="6" fill="var(--cp-celestial-moon-dark)" />
      <circle cx="90" cy="70" r="6" stroke="var(--cp-celestial-moon)" stroke-width="0.5" fill="none" />
      {/* Earth */}
      <circle cx="160" cy="70" r="10" fill="var(--cp-celestial-earth)" />
      {/* Shadow cone */}
      <path d="M90 64 L160 60 L160 80 L90 76 Z" fill="var(--cp-bg0)" opacity="0.25" />
      {/* Umbra line */}
      <line x1="90" y1="70" x2="160" y2="70" stroke="var(--cp-muted)" stroke-width="0.4" stroke-dasharray="2 2" opacity="0.4" />
    </g>
  )}

  {slug === "retrograde-motion" && (
    <g>
      {/* Inner orbit (Earth) */}
      <circle cx="80" cy="70" r="28" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" fill="none" opacity="0.3" />
      {/* Outer orbit (Mars) */}
      <circle cx="80" cy="70" r="55" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" fill="none" opacity="0.3" />
      {/* Sun */}
      <circle cx="80" cy="70" r="5" fill="var(--cp-celestial-sun)" />
      {/* Earth */}
      <circle cx="108" cy="70" r="3.5" fill="var(--cp-celestial-earth)" />
      {/* Mars */}
      <circle cx="135" cy="55" r="3" fill="var(--cp-celestial-mars)" />
      {/* Retrograde loop on sky */}
      <path d="M150 20 Q158 15, 162 20 Q168 30, 160 32 Q152 34, 155 25 Q158 18, 165 22" stroke="var(--cp-celestial-mars)" stroke-width="1.2" fill="none" opacity="0.6" />
    </g>
  )}

  {slug === "eos-lab" && (
    <g>
      {/* Axes */}
      <line x1="35" y1="115" x2="180" y2="115" stroke="var(--cp-muted)" stroke-width="0.6" opacity="0.5" />
      <line x1="35" y1="115" x2="35" y2="20" stroke="var(--cp-muted)" stroke-width="0.6" opacity="0.5" />
      {/* Regime regions */}
      <rect x="36" y="70" width="50" height="44" fill="var(--cp-accent)" opacity="0.08" rx="2" />
      <rect x="86" y="40" width="50" height="74" fill="var(--cp-celestial-sun)" opacity="0.06" rx="2" />
      <rect x="136" y="21" width="43" height="93" fill="var(--cp-violet)" opacity="0.08" rx="2" />
      {/* Regime labels */}
      <text x="48" y="95" fill="var(--cp-accent)" font-size="6" font-family="var(--cp-font-sans)" opacity="0.7">Ideal</text>
      <text x="96" y="80" fill="var(--cp-celestial-sun)" font-size="6" font-family="var(--cp-font-sans)" opacity="0.7">Degen.</text>
      <text x="143" y="60" fill="var(--cp-violet)" font-size="6" font-family="var(--cp-font-sans)" opacity="0.7">Rad.</text>
      {/* Phase boundary curves */}
      <path d="M36 70 Q60 68, 86 40" stroke="var(--cp-accent)" stroke-width="1" fill="none" opacity="0.4" />
      <path d="M86 40 Q120 30, 136 21" stroke="var(--cp-celestial-sun)" stroke-width="1" fill="none" opacity="0.4" />
    </g>
  )}

  {slug === "conservation-laws" && (
    <g>
      {/* Two colliding bodies */}
      <circle cx="65" cy="70" r="12" fill="var(--cp-celestial-earth)" opacity="0.6" />
      <circle cx="140" cy="70" r="8" fill="var(--cp-celestial-mars)" opacity="0.6" />
      {/* Momentum arrows */}
      <line x1="80" y1="70" x2="105" y2="70" stroke="var(--cp-accent)" stroke-width="1.5" />
      <path d="M102 67 L108 70 L102 73" fill="var(--cp-accent)" />
      <line x1="130" y1="70" x2="115" y2="70" stroke="var(--cp-pink)" stroke-width="1" />
      <path d="M118 67 L112 70 L118 73" fill="var(--cp-pink)" />
      {/* Energy bar below */}
      <rect x="50" y="100" width="100" height="6" rx="3" fill="var(--cp-muted)" opacity="0.15" />
      <rect x="50" y="100" width="60" height="6" rx="3" fill="var(--cp-accent)" opacity="0.3" />
      <rect x="110" y="100" width="40" height="6" rx="3" fill="var(--cp-pink)" opacity="0.25" />
    </g>
  )}

  {slug === "binary-orbits" && (
    <g>
      {/* Center of mass */}
      <circle cx="100" cy="70" r="1.5" fill="var(--cp-muted)" opacity="0.5" />
      <circle cx="100" cy="70" r="3" stroke="var(--cp-muted)" stroke-width="0.5" fill="none" stroke-dasharray="2 1" opacity="0.4" />
      {/* Star A orbit */}
      <ellipse cx="100" cy="70" rx="35" ry="22" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" fill="none" opacity="0.3" />
      {/* Star B orbit */}
      <ellipse cx="100" cy="70" rx="22" ry="14" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" fill="none" opacity="0.3" />
      {/* Star A */}
      <circle cx="135" cy="62" r="6" fill="var(--cp-celestial-sun)" />
      <circle cx="135" cy="62" r="10" fill="var(--cp-celestial-sun)" opacity="0.1" filter="url(#soft-glow)" />
      {/* Star B */}
      <circle cx="78" cy="78" r="4" fill="var(--cp-celestial-mars)" />
      <circle cx="78" cy="78" r="7" fill="var(--cp-celestial-mars)" opacity="0.1" filter="url(#soft-glow)" />
      {/* Trail arcs */}
      <path d="M135 62 A35 22 0 0 1 100 48" stroke="var(--cp-celestial-sun)" stroke-width="1" fill="none" opacity="0.2" />
      <path d="M78 78 A22 14 0 0 1 100 84" stroke="var(--cp-celestial-mars)" stroke-width="0.8" fill="none" opacity="0.2" />
    </g>
  )}

  {slug === "planetary-conjunctions" && (
    <g>
      {/* Sun */}
      <circle cx="70" cy="70" r="8" fill="url(#sun-glow)" />
      <circle cx="70" cy="70" r="4" fill="var(--cp-celestial-sun)" />
      {/* Inner orbit */}
      <circle cx="70" cy="70" r="30" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" fill="none" opacity="0.3" />
      {/* Outer orbit */}
      <circle cx="70" cy="70" r="52" stroke="var(--cp-celestial-orbit)" stroke-width="0.6" fill="none" opacity="0.3" />
      {/* Inner planet (at conjunction) */}
      <circle cx="100" cy="70" r="3.5" fill="var(--cp-celestial-venus)" />
      {/* Outer planet (at conjunction) */}
      <circle cx="122" cy="70" r="4" fill="var(--cp-celestial-mars)" />
      {/* Conjunction alignment line */}
      <line x1="70" y1="70" x2="135" y2="70" stroke="var(--cp-accent)" stroke-width="0.6" stroke-dasharray="3 2" opacity="0.4" />
      {/* Angle marker */}
      <path d="M82 65 A12 12 0 0 1 82 75" stroke="var(--cp-accent)" stroke-width="0.8" fill="none" opacity="0.5" />
    </g>
  )}
</svg>

<style>
  .demo-illus {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
```

**Step 2: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add apps/site/src/components/DemoIllustration.astro
git commit -m "feat(site): add per-demo SVG scene illustrations for 14 demos"
```

---

## Task 4: Redesign DemoCard with Image-Top Layout

**Files:**
- Modify: `apps/site/src/components/DemoCard.astro`
- Modify: `apps/site/src/components/MiniCard.astro`

**Step 1: Rewrite DemoCard.astro**

Replace the entire content of `apps/site/src/components/DemoCard.astro` with the new image-top layout:

```astro
---
import TagPill from "./TagPill.astro";
import TopicIcon from "./TopicIcon.astro";
import DemoIllustration from "./DemoIllustration.astro";
import { topicColor, primaryTopic } from "../lib/topicColors";

export type DemoCardProps = {
  title: string;
  slug: string;
  href: string;
  description: string;
  status: "stable" | "beta" | "draft";
  topics: string[];
  levels: string[];
  timeMinutes: number;
  hasMathMode: boolean;
};

const {
  title,
  slug,
  href,
  description,
  status,
  topics,
  levels,
  timeMinutes,
  hasMathMode
} = Astro.props as DemoCardProps;

const topic = primaryTopic(topics);
const color = topicColor(topic);
const statusTone =
  status === "stable" ? "teal" : status === "beta" ? "status-beta" : "status-draft";
const timeLabel =
  timeMinutes <= 10 ? "\u226410 min" : timeMinutes <= 20 ? "10\u201320 min" : "20+ min";
---

<article class="demo-card cp-card" style={`--topic-color: ${color}`}>
  <a class="demo-card__link" href={href}>
    <div class="demo-card__illustration">
      <DemoIllustration slug={slug} />
    </div>
    <div class="demo-card__body">
      <h3 class="demo-card__title">{title}</h3>
      <p class="demo-card__desc">{description}</p>
      <div class="demo-card__badges" aria-label="Tags">
        <TagPill label={status} tone={statusTone} />
        {topics.map((t) => (
          <TagPill label={t} tone="blue">
            <TopicIcon slot="icon" topic={t} />
          </TagPill>
        ))}
        <TagPill label={timeLabel} tone="default" />
        {levels.map((l) => <TagPill label={l} tone="default" />)}
        {hasMathMode ? <TagPill label="math mode" tone="violet" /> : null}
      </div>
    </div>
  </a>
</article>

<style>
  .demo-card {
    border-radius: var(--cp-r-3);
    overflow: clip;
    transition:
      transform 200ms var(--cp-ease-out),
      box-shadow 200ms var(--cp-ease-out),
      border-color 200ms var(--cp-ease-out);
  }

  .demo-card:hover {
    transform: translateY(-4px);
    box-shadow:
      var(--cp-card-shadow-hover),
      0 0 24px color-mix(in srgb, var(--topic-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--topic-color) 35%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .demo-card {
      transition: none;
    }
    .demo-card:hover {
      transform: none;
    }
  }

  .demo-card__link {
    display: block;
    text-decoration: none;
  }

  .demo-card__illustration {
    padding: var(--cp-space-3);
    background:
      radial-gradient(
        ellipse 80% 70% at 50% 50%,
        color-mix(in srgb, var(--topic-color) 8%, transparent) 0%,
        transparent 70%
      );
    border-bottom: 1px solid var(--cp-border-subtle);
    opacity: 0.85;
    transition: opacity 200ms var(--cp-ease-out);
  }

  .demo-card:hover .demo-card__illustration {
    opacity: 1;
  }

  .demo-card__body {
    padding: var(--cp-space-4);
    display: grid;
    gap: var(--cp-space-2);
  }

  .demo-card__title {
    margin: 0;
    font-size: var(--cp-text-xl);
    color: var(--cp-title);
    transition: color 200ms var(--cp-ease-out);
  }

  .demo-card:hover .demo-card__title {
    color: var(--cp-title-strong);
  }

  .demo-card__desc {
    margin: 0;
    color: var(--cp-text2);
    max-width: 72ch;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .demo-card__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    opacity: 0.9;
    margin-top: var(--cp-space-1);
  }
</style>
```

**Step 2: Update MiniCard.astro to use DemoIllustration**

Replace the content of `apps/site/src/components/MiniCard.astro`:

```astro
---
/**
 * Compact demo card for horizontal scroll strips.
 * Shows: DemoIllustration + title + primary topic + update date.
 */
import DemoIllustration from "./DemoIllustration.astro";
import TopicIcon from "./TopicIcon.astro";
import { topicColor, primaryTopic } from "../lib/topicColors";

interface Props {
  title: string;
  slug: string;
  href: string;
  topics: string[];
  lastUpdated: string;
}

const { title, slug, href, topics, lastUpdated } = Astro.props;
const color = topicColor(primaryTopic(topics));
---

<a class="mini-card cp-card" href={href} style={`--topic-color: ${color}`}>
  <div class="mini-card__illustration">
    <DemoIllustration slug={slug} />
  </div>
  <span class="mini-card__title">{title}</span>
  <span class="mini-card__meta">
    {topics[0] && <TopicIcon topic={topics[0]} size={12} />}
    <time class="mini-card__date">{lastUpdated}</time>
  </span>
</a>

<style>
  .mini-card {
    display: flex;
    flex-direction: column;
    gap: var(--cp-space-2);
    min-width: 180px;
    max-width: 220px;
    text-decoration: none;
    flex-shrink: 0;
    overflow: clip;
    transition:
      transform 200ms var(--cp-ease-out),
      box-shadow 200ms var(--cp-ease-out),
      border-color 200ms var(--cp-ease-out);
  }

  .mini-card:hover {
    transform: translateY(-3px);
    box-shadow:
      var(--cp-card-shadow-hover),
      0 0 16px color-mix(in srgb, var(--topic-color) 10%, transparent);
    border-color: color-mix(in srgb, var(--topic-color) 30%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .mini-card { transition: none; }
    .mini-card:hover { transform: none; }
  }

  .mini-card__illustration {
    padding: var(--cp-space-2);
    background:
      radial-gradient(
        ellipse 80% 70% at 50% 50%,
        color-mix(in srgb, var(--topic-color) 6%, transparent) 0%,
        transparent 70%
      );
    border-bottom: 1px solid var(--cp-border-subtle);
  }

  .mini-card__title {
    font-weight: var(--cp-font-semibold);
    font-size: var(--cp-text-sm);
    color: var(--cp-title);
    line-height: var(--cp-leading-tight);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    padding: 0 var(--cp-space-3);
  }

  .mini-card:hover .mini-card__title {
    color: var(--cp-title-strong);
  }

  .mini-card__meta {
    display: flex;
    align-items: center;
    gap: var(--cp-space-1);
    color: var(--cp-faint);
    font-size: 0.75rem;
    margin-top: auto;
    padding: 0 var(--cp-space-3) var(--cp-space-3);
  }

  .mini-card__date {
    font-family: var(--cp-font-mono);
    font-size: 0.7rem;
  }
</style>
```

**Step 3: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build. Cards now show illustrations instead of glyphs.

**Step 4: Commit**

```bash
git add apps/site/src/components/DemoCard.astro apps/site/src/components/MiniCard.astro
git commit -m "feat(site): redesign DemoCard and MiniCard with image-top layout"
```

---

## Task 5: Create NebularHero and Replace ConstellationHero

**Files:**
- Create: `apps/site/src/components/NebularHero.astro`
- Modify: `apps/site/src/pages/index.astro` (replace ConstellationHero import)

**Step 1: Create NebularHero.astro**

Create `apps/site/src/components/NebularHero.astro`:

```astro
---
/**
 * CSS nebula glow for the home hero zone.
 * Layered radial gradients creating an emission nebula effect
 * in pinks, teals, and ambers. Sits over the existing Canvas
 * starfield from MuseumStarfield. Decorative only.
 */
---

<div class="nebula-hero" aria-hidden="true"></div>

<style>
  .nebula-hero {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .nebula-hero::before,
  .nebula-hero::after {
    content: "";
    position: absolute;
    inset: -20%;
    border-radius: 50%;
  }

  /* Primary nebula cloud — pink/rose emission */
  .nebula-hero::before {
    background:
      radial-gradient(
        ellipse 70% 50% at 60% 40%,
        color-mix(in srgb, var(--cp-pink) 14%, transparent) 0%,
        color-mix(in srgb, var(--cp-pink) 6%, transparent) 40%,
        transparent 70%
      ),
      radial-gradient(
        ellipse 40% 60% at 35% 65%,
        color-mix(in srgb, var(--cp-celestial-sun-corona) 10%, transparent) 0%,
        color-mix(in srgb, var(--cp-celestial-sun) 4%, transparent) 35%,
        transparent 60%
      );
    animation: nebula-drift 20s ease-in-out infinite alternate;
  }

  /* Secondary nebula wisp — teal/cyan accent */
  .nebula-hero::after {
    background:
      radial-gradient(
        ellipse 50% 40% at 70% 55%,
        color-mix(in srgb, var(--cp-accent) 10%, transparent) 0%,
        color-mix(in srgb, var(--cp-accent) 4%, transparent) 40%,
        transparent 65%
      ),
      radial-gradient(
        ellipse 55% 45% at 25% 35%,
        color-mix(in srgb, var(--cp-violet) 8%, transparent) 0%,
        transparent 55%
      );
    animation: nebula-breathe 15s ease-in-out infinite alternate;
  }

  @keyframes nebula-drift {
    from {
      transform: scale(1) translate(0, 0);
      opacity: 0.8;
    }
    to {
      transform: scale(1.05) translate(2%, -1%);
      opacity: 1;
    }
  }

  @keyframes nebula-breathe {
    from {
      transform: scale(1.02) translate(-1%, 1%);
      opacity: 0.7;
    }
    to {
      transform: scale(0.98) translate(1%, -1%);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nebula-hero::before,
    .nebula-hero::after {
      animation: none;
      opacity: 0.9;
    }
  }

  @media (max-width: 767px) {
    .nebula-hero::before,
    .nebula-hero::after {
      opacity: 0.7;
    }
  }
</style>
```

**Step 2: Update index.astro to use NebularHero**

In `apps/site/src/pages/index.astro`, replace the ConstellationHero import (line 6):

Change:
```ts
import ConstellationHero from "../components/ConstellationHero.astro";
```
To:
```ts
import NebularHero from "../components/NebularHero.astro";
```

And replace the usage in the hero section (around line 48):
Change: `<ConstellationHero />`
To: `<NebularHero />`

Also remove the existing `obs-hero::before` vignette styles from the `<style>` block in index.astro (lines 168-190) since the NebularHero now handles the atmospheric gradient. Replace with:

```css
.obs-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse 100% 100% at 50% 50%,
      transparent 40%,
      color-mix(in srgb, var(--cp-bg0) 50%, transparent) 100%
    );
  pointer-events: none;
  z-index: 0;
}
```

**Step 3: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build. Home hero now shows nebula glow instead of constellation.

**Step 4: Commit**

```bash
git add apps/site/src/components/NebularHero.astro apps/site/src/pages/index.astro
git commit -m "feat(site): replace constellation hero with CSS nebula glow"
```

---

## Task 6: Asymmetric Home Layout + Full-Bleed Topic Strip

**Files:**
- Create: `apps/site/src/components/TopicStrip.astro`
- Modify: `apps/site/src/pages/index.astro` (featured grid + topic strip + update featured cards)

**Step 1: Create TopicStrip.astro**

Create `apps/site/src/components/TopicStrip.astro`:

```astro
---
import TopicIcon from "./TopicIcon.astro";
import { topicColor } from "../lib/topicColors";

interface Props {
  baseUrl: string;
}

const { baseUrl } = Astro.props;

const topics = [
  { key: "EarthSky", label: "Earth & Sky" },
  { key: "Orbits", label: "Orbits" },
  { key: "LightSpectra", label: "Light & Spectra" },
  { key: "Telescopes", label: "Telescopes" },
  { key: "DataInference", label: "Data & Inference" },
  { key: "Stars", label: "Stars" },
];
---

<nav class="topic-strip" aria-label="Browse by topic">
  <div class="topic-strip__inner">
    {topics.map((t) => (
      <a
        class="topic-strip__chip"
        href={`${baseUrl}explore/?topic=${t.key}`}
        style={`--chip-color: ${topicColor(t.key)}`}
      >
        <TopicIcon topic={t.key} size={16} />
        <span>{t.label}</span>
      </a>
    ))}
  </div>
</nav>

<style>
  .topic-strip {
    width: 100vw;
    margin-left: calc(-50vw + 50%);
    padding: var(--cp-space-4) var(--cp-space-5);
    border-top: 1px solid var(--cp-border-subtle);
    border-bottom: 1px solid var(--cp-border-subtle);
    background: color-mix(in srgb, var(--cp-bg1) 30%, transparent);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .topic-strip__inner {
    display: flex;
    gap: var(--cp-space-3);
    justify-content: center;
    max-width: var(--cp-site-max);
    margin: 0 auto;
  }

  .topic-strip__chip {
    display: inline-flex;
    align-items: center;
    gap: var(--cp-space-2);
    padding: var(--cp-space-2) var(--cp-space-4);
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--chip-color) 25%, var(--cp-border));
    background: color-mix(in srgb, var(--chip-color) 6%, transparent);
    color: var(--cp-text2);
    text-decoration: none;
    font-size: var(--cp-text-sm);
    font-weight: var(--cp-font-medium);
    white-space: nowrap;
    flex-shrink: 0;
    transition:
      background 200ms var(--cp-ease-out),
      border-color 200ms var(--cp-ease-out),
      color 200ms var(--cp-ease-out),
      box-shadow 200ms var(--cp-ease-out);
  }

  .topic-strip__chip:hover {
    background: color-mix(in srgb, var(--chip-color) 15%, transparent);
    border-color: color-mix(in srgb, var(--chip-color) 45%, transparent);
    color: var(--cp-text);
    box-shadow: 0 0 12px color-mix(in srgb, var(--chip-color) 10%, transparent);
  }

  @media (max-width: 767px) {
    .topic-strip__inner {
      justify-content: flex-start;
    }
  }
</style>
```

**Step 2: Update index.astro featured grid + add topic strip**

In `apps/site/src/pages/index.astro`:

a) Add import for TopicStrip and DemoIllustration (at the top with other imports):
```ts
import TopicStrip from "../components/TopicStrip.astro";
import DemoIllustration from "../components/DemoIllustration.astro";
import { topicColor, primaryTopic } from "../lib/topicColors";
```

b) Remove the DemoGlyph import and `pickDemoGlyph` import (lines 7-8).

c) Add the TopicStrip between the hero and the "How it works" section (after the closing `</section>` of obs-hero, before the "How it works" section):
```astro
<TopicStrip baseUrl={base} />
```

d) Update the featured card section to use DemoIllustration instead of DemoGlyph, and add topic colors. Replace the featured-card map block (lines 81-95) with:

```astro
{featured.map((d, i) => {
  const topic = primaryTopic(d.data.topics);
  const color = topicColor(topic);
  return (
    <article class="featured-card cp-card" style={`--card-i: ${i}; --topic-color: ${color}`}>
      <a class="featured-card__link" href={`${base}exhibits/${d.slug}/`}>
        <div class="featured-card__illustration">
          <DemoIllustration slug={d.slug} />
        </div>
        <div class="featured-card__body">
          <span class="featured-card__number">{i + 1}</span>
          <h3 class="featured-card__title">{d.data.title}</h3>
          <p class="featured-card__desc">{excerptFromBody(d.body)}</p>
        </div>
      </a>
    </article>
  );
})}
```

e) Update the featured-grid CSS to be asymmetric. Replace the `.featured-grid` rule in the `<style>` block:

```css
.featured-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  grid-template-rows: 1fr 1fr;
  gap: var(--cp-space-5);
}

.featured-card:first-child {
  grid-row: 1 / -1;
}

@media (max-width: 767px) {
  .featured-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
  .featured-card:first-child {
    grid-row: auto;
  }
}
```

f) Update the featured-card styles to use topic colors and the new illustration layout. Replace the existing `.featured-card` styles with:

```css
.featured-card {
  position: relative;
  overflow: clip;
  animation: cp-slide-up 0.5s var(--cp-ease-out) both;
  animation-delay: calc(var(--card-i, 0) * 0.1s + 0.2s);
  transition:
    transform 200ms var(--cp-ease-out),
    border-color 200ms var(--cp-ease-out),
    box-shadow 200ms var(--cp-ease-out);
}

.featured-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--topic-color) 60%, transparent),
    color-mix(in srgb, var(--cp-violet) 40%, transparent)
  );
  opacity: 0.5;
  transition: opacity 200ms var(--cp-ease-out);
}

.featured-card:hover::before {
  opacity: 1;
}

.featured-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--topic-color) 40%, transparent);
  box-shadow:
    var(--cp-card-shadow-hover),
    0 0 20px color-mix(in srgb, var(--topic-color) 10%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .featured-card {
    animation: none;
    transition: none;
  }
  .featured-card:hover {
    transform: none;
  }
}

.featured-card__link {
  display: flex;
  flex-direction: column;
  height: 100%;
  text-decoration: none;
}

.featured-card__illustration {
  padding: var(--cp-space-4);
  background:
    radial-gradient(
      ellipse 80% 70% at 50% 50%,
      color-mix(in srgb, var(--topic-color) 8%, transparent) 0%,
      transparent 70%
    );
  border-bottom: 1px solid var(--cp-border-subtle);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.featured-card__body {
  padding: var(--cp-space-4);
  position: relative;
}

.featured-card__number {
  position: absolute;
  top: var(--cp-space-3);
  right: var(--cp-space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--topic-color) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--topic-color) 30%, transparent);
  color: var(--topic-color);
  font-family: var(--cp-font-display);
  font-size: var(--cp-text-sm);
  font-weight: var(--cp-font-semibold);
}

.featured-card__title {
  margin: 0;
  font-size: var(--cp-text-xl);
  color: var(--cp-title);
}

.featured-card:hover .featured-card__title {
  color: var(--cp-title-strong);
}

.featured-card__desc {
  margin: var(--cp-space-2) 0 0;
  color: var(--cp-text2);
  font-size: var(--cp-text-sm);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

g) Update the instructor links section to use Icon.astro instead of DemoGlyph (lines 140-153). Replace DemoGlyph usage with Lucide icons:

```astro
import Icon from "../components/Icon.astro";
```

Then replace the instructor-link DemoGlyph elements:
- `<DemoGlyph name="notes" size={24} />` becomes `<Icon name="BookOpen" size={20} />`
- `<DemoGlyph name="instructor" size={24} />` becomes `<Icon name="GraduationCap" size={20} />`
- `<DemoGlyph name="featured" size={24} />` becomes `<Icon name="Shuffle" size={20} />`

**Step 3: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build. Home page now has asymmetric featured grid + topic strip.

**Step 4: Commit**

```bash
git add apps/site/src/components/TopicStrip.astro apps/site/src/pages/index.astro
git commit -m "feat(site): asymmetric featured cards + full-bleed topic strip"
```

---

## Task 7: Update JourneyStep + Explore Page Topic Colors

**Files:**
- Modify: `apps/site/src/components/JourneyStep.astro`
- Modify: `apps/site/src/pages/explore/index.astro`

**Step 1: Update JourneyStep to use DemoIllustration**

In `apps/site/src/components/JourneyStep.astro`:

Replace DemoGlyph import with DemoIllustration:
```ts
import DemoIllustration from "./DemoIllustration.astro";
import { topicColor, primaryTopic } from "../lib/topicColors";
```

Remove the `pickDemoGlyph` import and `glyph` variable.

Add topic color:
```ts
const color = topicColor(primaryTopic(topics));
```

Add `style={`--topic-color: ${color}`}` to the `.journey-step__card` element.

Replace the DemoGlyph element with:
```astro
<div class="journey-step__illus">
  <DemoIllustration slug={slug} />
</div>
```

Update the CSS: replace `.journey-step__glyph` styles with:
```css
.journey-step__illus {
  width: 64px;
  flex-shrink: 0;
  border-radius: var(--cp-r-1);
  overflow: clip;
  background:
    radial-gradient(
      ellipse at 50% 50%,
      color-mix(in srgb, var(--topic-color) 6%, transparent) 0%,
      transparent 70%
    );
  border: 1px solid var(--cp-border-subtle);
  transition: border-color 200ms var(--cp-ease-out);
}

.journey-step__card:hover .journey-step__illus {
  border-color: color-mix(in srgb, var(--topic-color) 30%, transparent);
}
```

**Step 2: Update explore page topic section headers with topic colors**

In `apps/site/src/pages/explore/index.astro`:

Add import:
```ts
import { topicColor } from "../../lib/topicColors";
```

In the topic section header, add inline style for the topic icon container. Update the topic section map to include the color:

```astro
<div
  class="topic-section__header"
  style={`--topic-color: ${topicColor(section.key)}`}
>
```

Add CSS for the colored icon:
```css
.topic-section__header {
  color: var(--topic-color, var(--cp-muted));
}
```

**Step 3: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add apps/site/src/components/JourneyStep.astro apps/site/src/pages/explore/index.astro
git commit -m "feat(site): topic colors on journey steps and explore page sections"
```

---

## Task 8: Clean Up Old Files

**Files:**
- Remove: `apps/site/src/components/DemoGlyph.astro`
- Remove: `apps/site/src/components/ConstellationHero.astro`
- Remove: `apps/site/src/lib/demoGlyphs.ts`
- Verify: no remaining imports of removed files

**Step 1: Search for remaining imports of old components**

Search the codebase for any remaining references to DemoGlyph, ConstellationHero, or demoGlyphs:

```bash
grep -r "DemoGlyph\|ConstellationHero\|demoGlyphs\|pickDemoGlyph" apps/site/src/ --include="*.astro" --include="*.ts"
```

Fix any remaining references found. They should all have been updated in Tasks 4-7, but verify.

**Step 2: Remove old files**

```bash
git rm apps/site/src/components/DemoGlyph.astro
git rm apps/site/src/components/ConstellationHero.astro
git rm apps/site/src/lib/demoGlyphs.ts
```

**Step 3: Verify build passes**

Run: `corepack pnpm build`
Expected: Clean build with zero errors. No dangling imports.

**Step 4: Run the full test suite**

Run: `corepack pnpm -C packages/theme test -- --run && corepack pnpm -C apps/demos test -- --run`
Expected: All existing tests pass (these are demo/theme tests, not site tests).

**Step 5: Commit**

```bash
git commit -m "chore(site): remove deprecated DemoGlyph, ConstellationHero, demoGlyphs"
```

---

## Task 9: Visual QA + E2E Smoke Test

**Step 1: Build and serve locally**

```bash
corepack pnpm build && corepack pnpm -C apps/site preview
```

**Step 2: Manual visual QA checklist**

Open the local preview and check:
- [ ] Home page hero: nebula glow visible, text readable over it
- [ ] Home page topic strip: all 6 topics visible, colored, clickable
- [ ] Home page featured cards: asymmetric layout, illustrations visible, hover lifts card with glow
- [ ] Home page recent scroll: mini-cards show illustrations
- [ ] Explore page: all 14 demo cards show unique illustrations
- [ ] Explore page: topic sections have colored icons
- [ ] Playlists page: journey steps show illustrations
- [ ] All typography renders in Outfit (headings) + Source Sans 3 (body)
- [ ] Mobile viewport: single-column layout, topic strip scrollable
- [ ] Reduced motion: no transforms on hover, no nebula animation

**Step 3: Run E2E smoke tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- --grep smoke
```

Expected: All smoke tests pass (they test page loading, not specific visual elements).

**Step 4: Final commit**

If any fixes were needed during QA, commit them:

```bash
git add -A
git commit -m "fix(site): visual QA fixes from design overhaul"
```
