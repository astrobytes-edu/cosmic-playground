# Deep UI Polish — Design

**Date:** 2026-02-03  
**Scope:** Dark museum theme only. Light/paper theme unchanged.

## Goals
- Turn Explore into an editorial browse experience when no filters are active.
- Keep Predict → Play → Explain visible as the product cadence (Home hero subtitle).
- Add topic grouping + jump-to-topic navigation without new JS systems.
- Tighten hierarchy, spacing, and hover choreography using existing tokens.

## Information Architecture
- **Explore (no filters):** Jump-to-topic index → topic sections (each with heading + grid).
- **Explore (filters active):** current flat results list + chips; topic index hidden.
- **Home:** hero with subtitle “Predict → Play → Explain,” followed by the featured row.
- **Exhibits/Playlists:** retain existing structure, inherit new spacing utilities.

## Topic Grouping
**Topic order (curated):**
1. Earth & Sky (`EarthSky`)
2. Orbits (`Orbits`)
3. Light & Spectra (`LightSpectra`)
4. Telescopes (`Telescopes`)
5. Data & Inference (`DataInference`)
6. Stars (`Stars`)
7. Galaxies (`Galaxies`)
8. Cosmology (`Cosmology`)

**Labels:** human-friendly display names (no raw enum tokens in UI).

## Visual & Motion
- Use `.cp-section` utility for consistent top spacing and anchor offset.
- Jump-to-topic index uses chip styling tokens (`--cp-chip-*`) with subtle hover.
- Card hierarchy: title is highest contrast, badges are subdued.
- Micro-motion: gentle glyph lift + shadow bloom; respect reduced motion.

## Accessibility
- Jump index is a `<nav aria-label="Jump to topic">` with anchor links.
- Section headings get `scroll-margin-top` to avoid header overlap.
- No new color-only encoding; all state changes remain token-driven.

