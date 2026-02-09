# Parallax Distance Revamp + Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `parallax-distance` clearly functional, pedagogically strong, and visually professional by fixing root-cause interactivity failures first, then redesigning UI/UX to explicitly teach Earth-orbit baseline, changing parallax angle, and inverse distance dependence.

**Architecture:** Keep current Vite + TypeScript demo architecture and contracts (`index.html` + `main.ts` + `logic.ts` + `style.css`) with physics sourced from `@cosmic/physics`. Use pure functions in `logic.ts` for visual mappings and pedagogy state; keep DOM/render wiring in `main.ts`; keep contract assertions in `design-contracts.test.ts`.

**Tech Stack:** TypeScript, SVG, CSS custom properties (`--cp-*`), `@cosmic/runtime`, `@cosmic/physics`, Vitest.

**Design Direction:** Scientific instrument board with one signature moment: a live two-epoch orbit view where Earth-at-Jan/Earth-at-Jul sightlines visibly bracket the parallax angle and a detector-shift strip makes distance dependence obvious.

---

### Task 1: Lock Root Cause with Failing Tests (Functionality First)

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/logic.test.ts`

**Step 1: Add failing test for monotonic visual angle mapping**

Add a test that checks visual half-angle changes across slider domain (1, 10, 100, 1000 mas) and is strictly increasing.

**Step 2: Add failing test for star Y responsiveness across domain**

Add a test that checks `diagramStarY(...)` outputs at least 3 distinct values over valid parallax range (no single clamped value).

**Step 3: Add failing test for detector offset mapping**

Add a test for a new `detectorOffsetPx(...)` helper ensuring offset is monotonic and bounded by configured track width.

**Step 4: Run targeted tests and confirm FAIL**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/parallax-distance/logic.test.ts
```
Expected: failures proving current mapping is effectively static.

**Step 5: Commit test-only checkpoint**

```bash
git add apps/demos/src/demos/parallax-distance/logic.test.ts
git commit -m "test(parallax): capture non-responsive visual mapping regression"
```

---

### Task 2: Implement Visual Mapping Layer in Pure Logic

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/logic.ts`
- Modify: `apps/demos/src/demos/parallax-distance/logic.test.ts`

**Step 1: Add explicit conversion helpers**

Implement pure helpers:
- `parallaxArcsecFromMas(parallaxMas)`
- `parallaxRadiansFromMas(parallaxMas)`

No distance formulas here (distance remains from `@cosmic/physics` in `main.ts`).

**Step 2: Replace clamp-heavy angle mapping**

Implement a log-domain visual mapping helper that:
- is monotonic over `[1, 1000] mas`
- produces visible variation without physically replacing model math
- returns metadata (`halfAngle`, `exaggeration`, `progress`) for labeling

**Step 3: Implement detector strip mapping**

Add `detectorOffsetPx(parallaxMas, trackHalfWidthPx, minOffsetPx)` using same normalized log-progress for coherent stage behavior.

**Step 4: Update tests to PASS and keep regression guards**

Keep strict assertions for monotonicity, bounded ranges, and non-static outputs.

**Step 5: Run logic tests and commit**

```bash
corepack pnpm -C apps/demos test -- src/demos/parallax-distance/logic.test.ts
```

```bash
git add apps/demos/src/demos/parallax-distance/logic.ts apps/demos/src/demos/parallax-distance/logic.test.ts
git commit -m "fix(parallax): replace static clamped diagram mapping with responsive visual mapping"
```

---

### Task 3: Redesign Stage Semantics to Teach Orbit + Angle + Distance

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`

**Step 1: Restructure stage markup (keep required IDs/contracts)**

Update stage with semantic groups:
- Orbit geometry layer: Sun, circular Earth orbit, Earth (Jan), Earth (Jul), baseline marker
- Sightline layer: two rays from Earth positions to star
- Angle layer: arc + label for `2p` (exaggerated)
- Detector strip inset: Jan and Jul apparent star marker positions

Retain required shell + marker elements:
- `#cp-demo`
- `#copyResults`
- `#status` with live region semantics
- `.cp-demo__drawer`

**Step 2: Add stage legend and teaching cue text**

Add concise stage captions:
- "Observer moves, star nearly fixed"
- "Parallax shrinks with increasing distance"

Use KaTeX-compatible inline math where appropriate (`$p$`, `$d \propto 1/p$`).

**Step 3: Update `main.ts` DOM queries for new stage nodes**

Add references for new SVG nodes (orbit path, sun, detector markers, optional distance guide labels).

**Step 4: Rewrite `renderDiagram(...)` around explicit geometry blocks**

In order:
1. place Sun and orbit scaffold
2. place Earth-Jan/Earth-Jul on opposite points
3. position star from visual mapping
4. update sightlines and arc path
5. update detector strip offsets and labels

**Step 5: Keep physics model source unchanged**

Continue using:
- `ParallaxDistanceModel.distanceParsecFromParallaxMas(...)`
- `ParallaxDistanceModel.distanceLyFromParsec(...)`

No inline replacement formulas for distance in UI rendering.

**Step 6: Keyboard and live-region behavior**

Ensure slider updates are still native keyboard-accessible and status region remains non-breaking.

**Step 7: Commit stage architecture update**

```bash
git add apps/demos/src/demos/parallax-distance/index.html apps/demos/src/demos/parallax-distance/main.ts
git commit -m "feat(parallax): redesign stage to show Earth orbit, parallax angle, and detector shift"
```

---

### Task 4: Controls + Readouts Pedagogy Upgrade (Misconceptions Explicit)

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/index.html`
- Modify: `apps/demos/src/demos/parallax-distance/main.ts`

**Step 1: Clarify control labels with explicit units**

Ensure labels/readouts remain unit-explicit:
- `p` in `mas` control, `arcsec` readout
- `d` in `pc` and `ly`
- `p/\sigma_p` dimensionless

**Step 2: Add misconception-targeted callouts in drawer**

Add short "Common misconception" bullets:
- Parallax is due to observer baseline change, not star zig-zag motion.
- Smaller `p` means larger `d` (inverse relationship).
- Tiny angle measurement uncertainty dominates at large distances.

**Step 3: Add derived quality readout**

Use `describeMeasurability(snr)` to display quality class (`Excellent`, `Good`, etc.) beside SNR.

**Step 4: Keep copy/export schema stable**

Retain export payload v1 and existing readout names unless versioned change is necessary.

**Step 5: Commit pedagogical content pass**

```bash
git add apps/demos/src/demos/parallax-distance/index.html apps/demos/src/demos/parallax-distance/main.ts
git commit -m "feat(parallax): add misconception-focused guidance and measurement-quality feedback"
```

---

### Task 5: Full Visual Redesign (Token-First, Professional Quality)

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/style.css`

**Step 1: Establish local visual token layer**

Define demo-scoped CSS variables for stage surfaces, line hierarchy, readout emphasis, and accent contrast using existing `--cp-*` palette.

**Step 2: Improve composition hierarchy**

Implement clear separation:
- controls = compact operational panel
- stage = dominant focal surface
- readouts = high-legibility numeric cards
- drawer = explanatory context

**Step 3: Upgrade SVG readability**

Add visual hierarchy styles:
- orbit path: subtle/dashed
- baseline and rays: medium contrast
- angle arc: highlighted accent
- labels: numeric/tabular-friendly and non-overlapping

**Step 4: Responsive quality pass**

Ensure stage remains legible on mobile:
- avoid overcrowded labels
- preserve readout scanability
- maintain touch-target spacing for controls

**Step 5: Motion and reduced-motion**

Keep entry animations tasteful and disable non-essential transitions under `prefers-reduced-motion: reduce`.

**Step 6: Focus visibility guard**

Do not suppress focus styles; preserve theme focus rings and improve any weak contrast cases.

**Step 7: Commit visual redesign**

```bash
git add apps/demos/src/demos/parallax-distance/style.css
git commit -m "style(parallax): professional instrument-style redesign with responsive and a11y-safe hierarchy"
```

---

### Task 6: Contract and Design-Guard Updates

**Files:**
- Modify: `apps/demos/src/demos/parallax-distance/design-contracts.test.ts`

**Step 1: Add stage-structure assertions for pedagogy-critical nodes**

Assert presence of core stage elements:
- orbit path
- Earth Jan/Jul markers
- parallax arc label
- detector shift strip markers

**Step 2: Keep existing contract assertions intact**

Preserve tests for:
- starfield presence
- unit separation in readouts
- token usage and no hardcoded hex/rgba leakage
- `initStarfield(...)` usage
- `@cosmic/physics` import in `main.ts`

**Step 3: Run design contracts and commit**

```bash
corepack pnpm -C apps/demos test -- src/demos/parallax-distance/design-contracts.test.ts
```

```bash
git add apps/demos/src/demos/parallax-distance/design-contracts.test.ts
git commit -m "test(parallax): enforce orbit-angle-distance stage contract invariants"
```

---

### Task 7: Final Verification Gates (Required)

**Files:**
- No file changes expected.

**Step 1: Run required targeted tests**

```bash
corepack pnpm -C /Users/anna/Teaching/cosmic-playground/apps/demos test -- src/demos/parallax-distance/design-contracts.test.ts src/demos/parallax-distance/logic.test.ts
```
Expected: PASS.

**Step 2: Run required build**

```bash
corepack pnpm -C /Users/anna/Teaching/cosmic-playground/apps/demos build
```
Expected: PASS with no parallax bundle errors.

**Step 3: Manual accessibility + usability pass**

Manual checks:
- keyboard-only slider adjustment and button activation
- visible focus rings on all interactive elements
- mobile viewport check for stage/readout legibility
- reduced-motion check (`prefers-reduced-motion`) for non-essential animation removal

**Step 4: Update demo content metadata only if needed**

If behavior/readout semantics materially changed, update:
- `apps/site/src/content/demos/parallax-distance.md`
Else leave untouched.

**Step 5: Final commit for verification notes (if any file changed)**

```bash
git add apps/site/src/content/demos/parallax-distance.md
git commit -m "docs(parallax): align demo content notes with revamped stage behavior"
```
(Only if metadata/content changed.)

---

## Acceptance Criteria

- Slider + preset + readouts + stage all visibly and numerically update in sync.
- Stage explicitly communicates Earth-orbit baseline, changing parallax angle, and distance dependence.
- Misconceptions are explicitly addressed in teaching-facing copy.
- Readout labels are unit-explicit and notation-clean (`p`, `d`, `\sigma_p`).
- Keyboard path, focus visibility, and reduced-motion behavior remain solid.
- Required tests/build commands pass exactly as requested.

