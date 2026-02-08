# Hero Orbit Hardening — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the empty hero RHS with a live binary-orbit micro-demo, tighten the hero layout, and pull content higher on the page.

**Architecture:** A new `HeroOrbit.astro` component renders a silent, looping binary-star orbit on a `<canvas>`. The hero becomes a two-column CSS grid (text left, orbit right). The existing nebula gradients stay as the background layer; the orbit canvas sits above them.

**Tech Stack:** Canvas 2D, `@cosmic/physics` (tree-shaken for `orbitalPeriodYrFromAuSolar`), binary-orbits logic functions (pure math, ~2KB).

---

## What Changes

### 1. Hero becomes two-column grid

The current hero is a single-column flex container. The text sits left-aligned; the entire RHS is wasted nebula fog.

**Desktop (>= 768px):** `grid-template-columns: 1fr 1fr`. Text left, canvas right.
**Mobile (< 768px):** Single column. Text above, compact orbit canvas (200px) below.
**Min-height:** Reduced from `50vh` to `40vh` (token `--cp-hero-min-height` updated).

### 2. HeroOrbit component

A new `apps/site/src/components/HeroOrbit.astro` renders a binary-star orbit loop.

**What it shows:**
- Two stars orbiting a shared barycenter
- Mass ratio 0.4 (asymmetric — smaller star orbits wider)
- Separation 3 AU, period tuned to ~4 seconds real-time
- Fading orbital trails (~270 deg of arc, alpha-decaying)
- Star sizes scaled by mass (`bodyRadius()` from binary-orbits logic)
- Primary star: `--cp-celestial-sun` (amber). Secondary: `--cp-accent` (teal)
- Subtle radial glow behind each star
- Barycenter cross: `--cp-muted` at 30% opacity

**What it does not show:**
- No controls, sliders, or buttons
- No text overlays or annotations
- No orbit outline (just trails)

**Animation:** `requestAnimationFrame` with clamped delta-time (`Math.min(dt, 0.1)`). Respects `prefers-reduced-motion`: shows a static snapshot with pre-rendered trails.

### 3. Dependency: @cosmic/physics

The site's `package.json` gains `"@cosmic/physics": "workspace:*"` for the orbital period calculation. Tree-shaking keeps the bundle impact minimal (period function + clamp utility).

### 4. Everything else stays

- TopicStrip, PPE "How it works," featured grid, recent scroll, instructor section — all unchanged
- NebularHero stays as background behind the orbit canvas
- DemoIllustration cards stay static (no motion trails)

## Mobile Behavior

| Breakpoint | Hero layout | Orbit canvas |
|-----------|-------------|--------------|
| >= 768px | Two-column grid | Full height, right column |
| < 768px | Single column stack | 200px tall, below text |

## Accessibility

- Canvas has `aria-hidden="true"` (decorative)
- `prefers-reduced-motion: reduce` disables animation, shows static frame
- No interactive elements in the orbit — purely visual

## Files Touched

| Action | File |
|--------|------|
| Create | `apps/site/src/components/HeroOrbit.astro` |
| Modify | `apps/site/src/pages/index.astro` (hero grid + import) |
| Modify | `apps/site/package.json` (add @cosmic/physics) |
| Modify | `packages/theme/styles/tokens.css` (hero min-height 50vh → 40vh) |
| Modify | `packages/theme/src/tokens.test.ts` (if height token tested) |
