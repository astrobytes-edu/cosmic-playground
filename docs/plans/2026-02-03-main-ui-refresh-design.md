# Main UI Refresh — Design

**Date:** 2026-02-03  
**Scope:** Dark museum theme only (Explore, Home, Exhibits, Playlists, etc.). Paper/light theme unchanged.

## Goals
- Make the dark museum UI feel calm, cinematic, and inviting.
- Increase hierarchy, spacing, and scanability without adding clutter.
- Add minimalist glyphs to demo cards for a subtle visual anchor.

## Palette Strategy (Dark Only)
- Adopt a 5‑color locked palette in `packages/theme/styles/tokens.css`:
  - Ink: `#0F1115`
  - Slate: `#171B22`
  - Lavender‑gray: `#21222B`
  - Muted teal: `#2F8C8D`
  - Dusty rose: `#B07A93`
- Derive text, borders, glows, and accent variants via `color-mix`.
- Keep light/paper theme in `layer-paper.css` unchanged.

## Layout & Hierarchy
- Add a reusable hero band (`.cp-hero`) for Explore/Home/Exhibits.
- Explore page: hero → discovery/filter bar → featured row → catalog grid.
- Filters: primary controls visible; secondary controls under `<details>` “More filters”.
- Active filter chips beneath search; remove filters via links (server‑rendered).
- Progressive enhancement: small page‑scoped JS for auto‑submit and debounced search.

## Demo Card Glyphs
- Add inline SVG glyphs (stroke‑only, currentColor, consistent viewBox/stroke).
- Place top‑left above title; muted default, muted teal on hover/focus.
- Map glyphs by topic with keyword override for specific demos.

## Featured Curation
- Add `featured: true` to demo content schema.
- Mark Kepler’s Laws, Retrograde Motion, Binary Orbits.
- Use a “Start here: Gravity & Orbits” row on Explore + Home.

