# Explore Filter Density + Microcopy — Design

**Date:** 2026-02-03  
**Scope:** Dark museum theme only. No behavior changes.

## Goals
- Make the filter bar feel invitational, not administrative.
- Reduce visual weight and height while keeping full functionality.
- Keep labels, chips, and placeholders consistent in tone.

## Microcopy (Calm + Invitational)
- Search label: **Search exhibits**
- Search placeholder: **Title, topic, or idea…**
- Topic label: **Choose a topic**
- Time label: **Time budget**
- Sort label: **Sort by**
- More filters summary: **More ways to filter**
- Level label: **Course level**
- Status label: **Status**
- Math mode label: **Math required?**

## Density Adjustments
- Reduce filter bar padding and gaps (token-driven).
- Tighten label gap while preserving clarity.
- Keep Apply button visible but de‑emphasized.

## Chip Labels (Active Filters)
- `Search: <query>`
- `Topic: <topic>`
- `Course level: <level>`
- `Time budget: ≤10 min | 10–20 min | 20+ min`
- `Status: <status>`
- `Math required: Yes/No`
- `Sort: <sort>`

## Accessibility
- Preserve explicit labels for all controls.
- Maintain focus-visible styling and keyboard access.
- No reliance on color-only meaning.

## Verification
- Smoke test for new placeholder and “More ways to filter” summary.
- Full build + e2e pass.
