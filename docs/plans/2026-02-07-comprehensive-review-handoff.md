# Seasons & Eclipse-Geometry: Design Brainstorm + Hardening Handoff

> **Copy everything below the line into a fresh Claude Code session.**

---

## Context

Cosmic Playground has 14 interactive astronomy demos, all fully migrated with 2,151 tests (A+ grade). Two demos — **seasons** and **eclipse-geometry** — still have significant UX/visual issues compared to the legacy originals at `~/Teaching/astr101-sp26/demos/`. The rest of the demos look great (especially moon-phases, which is the gold standard).

### What's Wrong

**Seasons demo (`apps/demos/src/demos/seasons/`):**
- The legacy demo at `~/Teaching/astr101-sp26/demos/seasons/` has a more polished, intuitive visual design
- The migrated version added a globe view, overlays, keyboard shortcuts, and animation — but the overall aesthetic still doesn't match the legacy version's quality
- The orbit panel layout, readout styling, and overall composition need a design pass
- The sidebar (drawer) feels too cluttered with too many accordions and controls

**Eclipse-geometry demo (`apps/demos/src/demos/eclipse-geometry/`):**
- Users report "I can't get any eclipses to appear" — the eclipse detection physics is CORRECT (`SYZYGY_TOLERANCE_DEG=5`, same as legacy), but the UX makes it nearly impossible to discover eclipse conditions without trial-and-error
- The sidebar is too verbose — too many readouts and controls for what should be a focused geometric exploration
- No visual guidance showing WHERE eclipses can occur (no eclipse window arcs on the orbit diagram)
- No snap-to-eclipse presets or proximity indicator
- The beta curve panel is hard to interpret without context

### What's RIGHT (keep these)

- All physics models are correct (verified by physics review — `docs/reviews/2026-02-07-seasons-eclipse-physics-review.md`)
- The design token system works perfectly (all celestial tokens, glows, starfield)
- Station Mode, Challenge Mode, and Export all work
- 4-layer testing is solid (contract + logic + physics + E2E)
- Globe view in seasons is a good addition (just needs polish)
- Animate-month in eclipse works correctly (advances sun, moon, and node)

## Task: Brainstorm-First Design Overhaul

**DO NOT write code first.** Start with a design brainstorm comparing three versions of each demo:

### Phase 1: Visual Design Brainstorm (NO CODE)

Use the `superpowers:brainstorming` skill. For each demo:

1. **Read the legacy demo** at `~/Teaching/astr101-sp26/demos/<slug>/`
2. **Read the migrated demo** at `apps/demos/src/demos/<slug>/`
3. **Read the moon-phases gold standard** at `apps/demos/src/demos/moon-phases/`
4. **Compare:** What makes the legacy version feel better? What does moon-phases do right that these don't?
5. **Sketch a design** (describe in words) that combines the best of all three

Key questions to answer in brainstorm:
- **Layout:** How should the stage, controls, readouts, and drawer be arranged? Is the current 4-panel shell the right layout, or should these demos use a different arrangement?
- **Information density:** What's the minimum set of controls and readouts needed for each demo? What can be removed or hidden behind progressive disclosure?
- **Visual hierarchy:** What should the eye be drawn to first? How do we make the key physics visible without clutter?
- **Eclipse discoverability:** How do we make it obvious where eclipses happen without hand-holding? (Eclipse window arcs? Color-coded proximity? Snap buttons?)
- **Seasons clarity:** How do we make the connection between orbit position and day length/temperature feel intuitive?

### Phase 2: Eclipse-Geometry UX + Physics Hardening

After brainstorm approval, implement:

1. **Eclipse window visualization** — Show arcs on the orbit diagram where eclipses are possible (where |beta| < threshold). This is the #1 missing feature.
2. **Proximity indicator** — Color-code readouts or add a "distance from eclipse" indicator so users can see they're getting close
3. **Smart presets** — "Show me a solar eclipse" / "Show me a lunar eclipse" buttons that set moon+node to produce an eclipse
4. **Declutter sidebar** — Move model notes and less-used readouts behind progressive disclosure
5. **Beta curve annotation** — Add horizontal lines showing solar/lunar eclipse thresholds on the beta curve
6. **Verify physics chain:** Trace the full path: slider values → `EclipseGeometryModel.compute()` → readout display → eclipse classification. Make sure the readout shows eclipses when conditions are met.

### Phase 3: Seasons Visual Overhaul

After brainstorm approval, implement:

1. **Globe polish** — Better terminator rendering, smoother latitude bands, more visible axis tilt
2. **Orbit panel redesign** — Make Earth's position and the sun-earth geometry the visual focus, not the orbit path
3. **Readout redesign** — Fewer, more impactful readouts (day length is key; declination angle matters; distance is secondary)
4. **Sidebar declutter** — Reduce accordion count, surface the most important controls
5. **Preset transitions** — Make season preset buttons (equinox/solstice) feel smooth and purposeful
6. **Day-length visualization** — Add a visual representation of day vs. night duration (arc on globe? bar chart? light/dark band?)

### Phase 4: Testing + Physics Review

1. Update contract tests and E2E for any layout/element changes
2. Run full physics review on both demos (dispatch a physics review agent)
3. Verify all 2,151 tests still pass after changes

## Key Files

### Eclipse-geometry
- `apps/demos/src/demos/eclipse-geometry/main.ts` — rendering + interaction (~1000 lines)
- `apps/demos/src/demos/eclipse-geometry/logic.ts` — pure functions (formatSignedBeta, etc.)
- `apps/demos/src/demos/eclipse-geometry/index.html` — HTML structure + shelf tabs
- `apps/demos/src/demos/eclipse-geometry/style.css` — demo-specific styles
- `apps/demos/src/demos/eclipse-geometry/design-contracts.test.ts` — 28 contract tests
- `apps/demos/src/demos/eclipse-geometry/logic.test.ts` — 111 logic tests
- `apps/site/tests/eclipse-geometry.spec.ts` — 37 E2E tests + 3 skipped screenshots
- `packages/physics/src/eclipseGeometry.ts` — physics model

### Seasons
- `apps/demos/src/demos/seasons/main.ts` — rendering + interaction
- `apps/demos/src/demos/seasons/logic.ts` — pure functions (globe geometry, formatDayLength, etc.)
- `apps/demos/src/demos/seasons/index.html` — HTML structure + shelf tabs
- `apps/demos/src/demos/seasons/style.css` — demo-specific styles
- `apps/demos/src/demos/seasons/design-contracts.test.ts` — 33 contract tests
- `apps/demos/src/demos/seasons/logic.test.ts` — 94 logic tests
- `apps/site/tests/seasons.spec.ts` — 37 E2E tests + 2 skipped screenshots
- `packages/physics/src/seasons.ts` — physics model

### Legacy demos (read-only reference)
- `~/Teaching/astr101-sp26/demos/seasons/` — legacy seasons
- `~/Teaching/astr101-sp26/demos/eclipse-geometry/` — legacy eclipse-geometry

### Gold standard
- `apps/demos/src/demos/moon-phases/` — the best-looking migrated demo (use as aesthetic reference)

## Test Baseline (must all pass before and after)

```bash
corepack pnpm -C packages/physics test -- --run    # 144 physics tests
corepack pnpm -C packages/theme test -- --run      # 116 theme tests
corepack pnpm -C apps/demos test -- --run           # 1,287 demo tests
corepack pnpm build                                 # full build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e  # 604 E2E tests
```

---

## Copy-Paste Prompt

```
I'm continuing work on Cosmic Playground (~/Teaching/cosmic-playground), a suite of 14 interactive astronomy teaching demos. The engineering is solid (2,151 tests, A+ grade, 14 physics reviews) but two demos need a design overhaul.

Read docs/plans/2026-02-07-comprehensive-review-handoff.md for the full context and phased plan.

**The problem:** The seasons and eclipse-geometry demos don't look or feel as good as the legacy originals (at ~/Teaching/astr101-sp26/demos/). Moon-phases is the gold standard for what a migrated demo should look and feel like. The eclipse demo has a critical UX issue: users can't figure out how to produce eclipses (the physics is correct but the interface gives no guidance). Both demos have cluttered sidebars.

**Start with Phase 1:** Use the brainstorming skill. Read all three versions of each demo (legacy, migrated, moon-phases gold standard) and design a visual/UX overhaul. DO NOT write code yet — I want to approve the design direction first.

Focus on: layout composition, information density (less is more), eclipse discoverability, and making the key physics visually intuitive. The goal is to make these demos feel >SoTA compared to any astronomy teaching tool online.
```
