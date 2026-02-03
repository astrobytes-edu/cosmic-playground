# Explore Card Hierarchy Polish — Design

**Date:** 2026-02-03  
**Scope:** Dark museum theme only. No changes to light/paper.

## Goals
- Make Explore cards scan faster by tightening hierarchy and badge ordering.
- Treat time as an **estimate range**, not a precise promise.
- Reduce visual noise without adding new UI controls.

## Information Hierarchy (Card)
1. **Title** — highest contrast and primary focal point.
2. **Description** — secondary, clamped to 2 lines.
3. **Badges** — ordered for scanability:
   - **Status** (quiet)
   - **Topic** (primary anchor, with icon)
   - **Time range** (≤10, 10–20, 20+ min)
   - **Level** (secondary context)

## Time Ranges
- **≤10 min** for ≤10
- **10–20 min** for 11–20
- **20+ min** for >20

This keeps time helpful while acknowledging multi‑activity variability.

## Implementation Notes
- Update `apps/site/src/components/DemoCard.astro` to:
  - Reorder badges to Status → Topic → Time → Level.
  - Compute the time range label from `timeMinutes`.
  - Slightly increase title contrast/size and tone down description (token-driven).
- If global badge tone needs slight quieting, adjust in `packages/theme/styles/layer-museum.css` using existing tokens.
- No new hex colors or ad‑hoc styles in apps.

## Accessibility
- Keep focus-visible rings intact.
- No meaning conveyed by color alone (status still text).
- Motion remains subtle; respect reduced-motion rules.

## Verification
- Add Playwright smoke test to assert:
  - Time pills display ranges (not exact minutes).
  - First badge is the status pill.
- Run:
  - `corepack pnpm build`
  - `corepack pnpm -C apps/site test:e2e`
