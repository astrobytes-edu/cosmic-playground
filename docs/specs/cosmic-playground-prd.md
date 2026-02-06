# Cosmic Playground — Product Requirements Document

**Version:** 1.2
**Date:** February 5, 2026
**Author:** Dr. Anna Rosen (SDSU)
**Status:** Draft

**Revision History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 5, 2026 | Initial draft |
| 1.1 | Feb 5, 2026 | Added visual design system (5.4.3-5.4.8): two-layer philosophy, starfield, glow system, celestial palette, instrument accents, readout typography. Updated shell layouts to compositional system. |
| 1.2 | Feb 6, 2026 | Added testing requirements (5.8): four-layer testing protocol (physics, contract, logic, E2E). Updated success metrics with contract/E2E coverage. Updated Phase 2 timeline with testing steps. |

---

## 1. Problem Statement

Introductory astronomy courses (ASTR 101/201) require students to develop quantitative reasoning skills, but many students enter with math anxiety and struggle to connect abstract equations to physical intuition. Existing educational tools are either:

1. **Static** — textbook diagrams that don't allow exploration
2. **Physically incorrect** — "simplified" visualizations that teach misconceptions
3. **Inconsistent** — standalone applets with different UIs, no coherent learning path
4. **Inaccessible** — poor keyboard support, no screen reader labels, not projection-friendly

Instructors spend significant time building or hunting for visualizations, and what they find rarely matches their pedagogical needs or maintains physical accuracy.

**Who experiences this:** ~30 students/year in ASTR 201 at SDSU, but the problem exists across every astronomy program globally.

**Cost of not solving:** Students develop math avoidance, miss the connection between observation and theory, and carry misconceptions forward. Instructors burn out recreating tools each semester.

---

## 2. Goals

### User Goals (Students)
1. **Reduce math anxiety** — Measured by pre/post MARS-R scores; target 15%+ reduction in anxiety
2. **Build physical intuition** — Students can predict outcomes before simulating; measured via embedded prediction tracking
3. **Connect equations to phenomena** — Students voluntarily engage "Math Mode" without prompting; target 40%+ activation rate

### User Goals (Instructors)
4. **Adopt without friction** — Instructor can deploy a demo in class within 5 minutes of first encounter
5. **Trust the physics** — Every demo has explicit unit documentation; no instructor time spent validating correctness

### Product Goals
6. **Cohesive ecosystem** — All demos share consistent UI patterns, navigation, and visual language
7. **Sustainable maintenance** — Changes to shared components propagate automatically; no per-demo drift

---

## 3. Non-Goals (v1)

| Non-Goal | Reason |
|----------|--------|
| Real-time N-body simulation | Too computationally expensive; analytic models sufficient for teaching |
| Mobile-first design | Primary use case is classroom projection; responsive but desktop-optimized |
| Multiplayer/collaborative | Adds complexity; single-user exploration is the v1 focus |
| LMS grade passback | Requires per-LMS integration; export-to-clipboard is sufficient for v1 |
| VR/AR support | Separate initiative requiring different tech stack |
| User accounts/progress tracking | Privacy concerns + complexity; v1 is stateless per-session |
| Internationalization (i18n) | English-only for v1; architecture should not preclude future i18n |
| GPU/WebGPU compute shaders | Future enhancement for expensive simulations; v1 uses CPU + Canvas/Three.js |

---

## 4. User Stories

### Student Stories

**Core Exploration**
- As a student, I want to drag a planet around its orbit and see how its speed changes so that I can build intuition for Kepler's second law before seeing the equation.
- As a student, I want to toggle between "Concept Mode" and "Math Mode" so that I can explore qualitatively first, then see the underlying equations when ready.
- As a student, I want to copy my simulation parameters to share with my instructor so that I can ask questions about specific configurations.

**Accessibility**
- As a student using a screen reader, I want live announcements of changing values so that I can follow the simulation without visual output.
- As a student with motor impairments, I want to control simulations entirely via keyboard so that I don't need precise mouse movements.
- As a student sensitive to motion, I want animations to respect my system's reduced-motion preference so that I can use demos without discomfort.

**Challenges**
- As a student, I want to attempt prediction challenges so that I can test my understanding and get immediate feedback.
- As a student, I want to see my challenge history for the session so that I can track my improvement.

### Instructor Stories

**Classroom Use**
- As an instructor, I want to project a demo with text readable from the back row so that all students can follow along.
- As an instructor, I want a "Station Mode" that hides controls and shows only the visualization so that I can use demos as interactive lecture figures.
- As an instructor, I want printable station cards so that students can work through demos independently during lab.

**Curriculum Integration**
- As an instructor, I want demos organized by topic (Earth & Sky, Light & Spectra, Orbits, etc.) so that I can find relevant tools quickly.
- As an instructor, I want to link directly to a demo with specific preset parameters so that I can share exact configurations in my syllabus.
- As an instructor, I want instructor notes that explain pedagogical context and common misconceptions so that I can use demos effectively.

**Trust & Verification**
- As an instructor, I want to see the physics model documentation so that I can verify the simulation is correct.
- As an instructor, I want explicit unit labels (AU, km, yr, etc.) on all values so that I can trust what's being displayed.

---

## 5. Requirements

### 5.1 Architecture (P0 — Must Have)

#### 5.1.1 Monorepo Structure
The codebase must maintain a shared-package architecture:

```
packages/
├── @cosmic/physics    # Pure physics models (no DOM)
├── @cosmic/runtime    # Demo lifecycle, modes, export, a11y
├── @cosmic/theme      # Design tokens + CSS layers
├── @cosmic/ui         # Shared UI components (Web Components)
├── @cosmic/renderer   # Canvas/Three.js abstractions
└── @cosmic/data-*     # Domain datasets
apps/
├── demos/             # Individual demo implementations
└── site/              # Astro-based catalog/museum site
```

**Acceptance Criteria:**
- [ ] All demos import UI components from `@cosmic/ui`, not define their own
- [ ] Physics models have no DOM dependencies and can be unit tested in isolation
- [ ] Changing a token in `@cosmic/theme` updates all demos on rebuild
- [ ] Adding a new demo requires no changes to shared packages

#### 5.1.2 TypeScript Throughout
All source code must be TypeScript with strict mode enabled.

**Acceptance Criteria:**
- [ ] `tsconfig.json` has `"strict": true`
- [ ] No `any` types except in clearly documented escape hatches
- [ ] Physical quantities use branded/tagged types where practical
- [ ] All public APIs have JSDoc documentation

#### 5.1.3 Physical Correctness
Physics models must use explicit, pedagogically-appropriate units.

**Acceptance Criteria:**
- [ ] Teaching normalization: G = 4π² AU³/(yr²·M☉) for orbital mechanics
- [ ] No "G = 1" or dimensionless natural units in student-facing output
- [ ] Every numeric output has an explicit unit label
- [ ] Unit conversion helpers in `@cosmic/physics` (AstroUnits)
- [ ] Physics models have accompanying test suites with known-answer tests

### 5.2 UI Component Library (P0 — Must Have)

#### 5.2.1 Core Components (`@cosmic/ui`)
Implement as Web Components (Lit-based) for framework independence:

| Component | Description |
|-----------|-------------|
| `<cp-slider>` | Range input with label, value display, unit |
| `<cp-button>` | Styled button with variants (primary, ghost, outline) |
| `<cp-toggle>` | Checkbox/switch with label |
| `<cp-select>` | Dropdown with styled options |
| `<cp-readout>` | Numeric display with label and unit |
| `<cp-panel>` | Collapsible panel with header |
| `<cp-accordion>` | Expandable section with summary/details |
| `<cp-badge>` | Status/category indicator |

**Acceptance Criteria:**
- [ ] Components render identically in Astro site and standalone demo HTML
- [ ] All components support keyboard navigation
- [ ] All components announce state changes to screen readers
- [ ] Components use only CSS custom properties from `@cosmic/theme`
- [ ] Components scale appropriately for projection (min 18px base font)

#### 5.2.2 Compositional Demo Shell Layouts
Replace rigid named shells with a compositional attribute system:

| Attribute | Purpose |
|-----------|---------|
| `data-stage` | Main visualization canvas |
| `data-controls` | Input controls (sliders, toggles, selects) |
| `data-readouts` | Output displays (values, equations, status) |
| `data-toolbar` | Action buttons (play/pause, reset, export) |

**Common Compositions:**

```html
<!-- Classic triad: controls | stage | readouts -->
<div class="demo-shell" data-layout="columns">
  <aside data-controls>...</aside>
  <main data-stage>...</main>
  <aside data-readouts>...</aside>
</div>

<!-- Viz-first: stage on top, controls below -->
<div class="demo-shell" data-layout="rows">
  <main data-stage>...</main>
  <footer data-controls data-readouts>...</footer>
</div>

<!-- Station mode: stage only, floating toolbar -->
<div class="demo-shell" data-layout="fullscreen">
  <main data-stage>...</main>
  <div data-toolbar class="floating">...</div>
</div>
```

**Acceptance Criteria:**
- [ ] Shells are responsive (collapse to single column on narrow viewports)
- [ ] Demos compose layouts from primitives rather than selecting named shells
- [ ] CSS Grid handles layout based on `data-layout` attribute
- [ ] Custom layouts achievable without modifying `@cosmic/theme`

### 5.3 Rendering Layer (P0 — Must Have)

#### 5.3.1 Canvas2D Abstraction (`@cosmic/renderer`)
Provide a thin wrapper for 2D rendering:

```typescript
interface Renderer2D {
  clear(): void;
  drawCircle(x: number, y: number, r: number, opts: DrawOptions): void;
  drawEllipse(cx: number, cy: number, rx: number, ry: number, opts: DrawOptions): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, opts: DrawOptions): void;
  drawPath(points: Point[], opts: DrawOptions): void;
  drawText(text: string, x: number, y: number, opts: TextOptions): void;
  drawArrow(from: Point, to: Point, opts: ArrowOptions): void;
}
```

**Acceptance Criteria:**
- [ ] Renderer handles DPI scaling automatically
- [ ] Renderer respects `prefers-reduced-motion`
- [ ] Renderer supports both immediate and retained-mode patterns
- [ ] Performance: 60fps for typical 2D demos on mid-range hardware

#### 5.3.2 Three.js Integration (P1 — Nice to Have)
Provide optional 3D renderer for demos that need it:

```typescript
interface Renderer3D {
  scene: THREE.Scene;
  camera: THREE.Camera;
  addMesh(mesh: THREE.Mesh): void;
  render(): void;
}
```

**Acceptance Criteria:**
- [ ] 3D renderer is tree-shakeable (not bundled if unused)
- [ ] Demos can use 2D or 3D renderer interchangeably where appropriate
- [ ] 3D demos gracefully degrade on systems without WebGL

### 5.4 Design System (P0 — Must Have)

#### 5.4.1 Visual Identity
The "Cosmic Nebula" aesthetic:

- **Color palette:** Dark backgrounds (#0f1115 ink, #171b22 slate), muted accents (teal #2f8c8d, dusty rose #b07a93, slate violet #6d7794)
- **Typography:** System sans-serif stack, 18px body for projection readability
- **Spacing:** 4px base unit, consistent rhythm
- **Radius:** Soft corners (10-18px), not sharp

**Acceptance Criteria:**
- [ ] All colors defined as CSS custom properties in `@cosmic/theme`
- [ ] Contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Typography scale from tokens (sm/md/lg/xl/2xl/3xl/4xl/hero)
- [ ] Visual regression tests catch unintended style changes

#### 5.4.2 Consistency Enforcement

**Acceptance Criteria:**
- [ ] ESLint rules prevent inline styles in demo code
- [ ] CI fails if demo uses color not from token system
- [ ] Storybook (or equivalent) documents all components with examples

#### 5.4.3 Two-Layer Visual Philosophy (P0 — Must Have)

The design system operates in two distinct contexts:

| Layer | Context | Aesthetic |
|-------|---------|-----------|
| **Museum** | Site chrome, navigation, exhibit pages | Muted, sophisticated, "science museum at night" |
| **Instrument** | Demo stages, controls, readouts | Vivid, alive, "spacecraft control panel" |

**Museum Layer Tokens:**
- Backgrounds: ink (#0f1115), slate (#171b22)
- Accents: muted teal (#2f8c8d), dusty rose (#b07a93), slate violet (#6d7794)
- Panels: translucent with subtle borders

**Instrument Layer Overrides:**
- Celestial objects glow at 30-50% opacity (not 10%)
- Accent colors shift vivid: teal → #2dd4bf, rose → #f472b6, violet → #a78bfa
- Data readouts use amber (#FFB86C) for key values
- Interactive elements have visible hover/active states

**Acceptance Criteria:**
- [ ] CSS custom properties scoped via `[data-layer="museum"]` and `[data-layer="instrument"]`
- [ ] Demos automatically inherit instrument layer when embedded
- [ ] Site pages automatically inherit museum layer
- [ ] Instrument layer tokens defined in `layer-instrument.css`

#### 5.4.4 Starfield Background (P0 — Must Have)

A subtle animated starfield creates the "cosmic" atmosphere that distinguishes this from generic dashboards.

**Implementation:**
```typescript
interface StarfieldConfig {
  starCount: number;       // 150-250 stars
  depthLayers: number;     // 3 layers (near/mid/far)
  twinkleRate: number;     // Subtle opacity oscillation
  parallaxFactor: number;  // Optional mouse-follow parallax
}
```

**Visual Specification:**
- Stars are white (#ffffff) at varying opacities (0.3-0.8)
- Three depth layers: large/bright (near), medium (mid), small/dim (far)
- Subtle twinkle animation (opacity oscillation, not position)
- Respects `prefers-reduced-motion` (static if reduced)
- Renders on a separate canvas behind demo content
- Panels "float" above the starfield via translucent backgrounds

**Acceptance Criteria:**
- [ ] Starfield module in `@cosmic/runtime` (not per-demo)
- [ ] Single initialization call: `initStarfield(canvas, config)`
- [ ] Performance: < 1ms per frame on mid-range hardware
- [ ] Disabled or static when `prefers-reduced-motion: reduce`
- [ ] Works with both museum and instrument layers

#### 5.4.5 Glow System (P0 — Must Have)

Celestial objects emit light. The glow system makes simulated objects "feel alive" rather than flat shapes.

**The 40% Opacity Principle:**
Legacy demos used 30-50% opacity glows. Current demos use 6-10% (barely visible). The correct range is **30-50%** for celestial objects.

**Glow Tokens:**
```css
--glow-sun: 0 0 40px 10px rgba(255, 200, 100, 0.45);
--glow-moon: 0 0 30px 8px rgba(200, 200, 220, 0.35);
--glow-planet: 0 0 20px 5px rgba(100, 150, 255, 0.30);
--glow-star: 0 0 15px 3px rgba(255, 255, 255, 0.40);
--glow-accent-teal: 0 0 25px 6px rgba(45, 212, 191, 0.35);
--glow-accent-rose: 0 0 25px 6px rgba(244, 114, 182, 0.35);
```

**Application:**
- Sun/star objects: warm yellow-orange glow
- Moon: cool silver-white glow
- Planets: blue-tinted glow
- Interactive highlights: accent-colored glows on hover/selection

**Acceptance Criteria:**
- [ ] Glow tokens defined in `@cosmic/theme`
- [ ] All celestial objects in demos use appropriate glow token
- [ ] Glows visible but not overwhelming (30-50% opacity range)
- [ ] Glows disabled when `prefers-reduced-motion: reduce`

#### 5.4.6 Celestial Object Palette (P0 — Must Have)

Consistent colors for astronomical objects across all demos:

| Object | Fill | Glow Base | Usage |
|--------|------|-----------|-------|
| Sun | #fbbf24 (amber-400) | rgba(251, 191, 36, 0.45) | Solar system demos |
| Moon | #e2e8f0 (slate-200) | rgba(226, 232, 240, 0.35) | Moon phases, eclipses |
| Earth | #3b82f6 (blue-500) | rgba(59, 130, 246, 0.30) | Orbital demos |
| Mars | #ef4444 (red-500) | rgba(239, 68, 68, 0.30) | Retrograde motion |
| Star (generic) | #ffffff | rgba(255, 255, 255, 0.40) | Parallax, HR diagram |
| Orbit path | #6d7794 (slate-violet) | none | Ellipse outlines |

**Acceptance Criteria:**
- [ ] Celestial tokens defined in `@cosmic/theme`
- [ ] All demos use tokens (no hardcoded colors for celestial objects)
- [ ] Colors maintain recognizability across light/dark contexts

#### 5.4.7 Instrument Accents (P0 — Must Have)

Data displays and interactive controls use "instrument" accent colors that evoke spacecraft interfaces:

| Accent | Hex | Usage |
|--------|-----|-------|
| Amber | #FFB86C | Primary readout values, active states |
| Green | #50FA7B | Success states, positive feedback |
| Ice | #8BE9FD | Secondary values, informational |
| Rose | #FF79C6 | Warnings, special attention |

**Application Rules:**
- Primary numeric values: amber
- Unit labels: ice (lower contrast than value)
- Success feedback (correct prediction): green
- Error/warning states: rose
- Interactive hover states: accent glow at 20% opacity

**Acceptance Criteria:**
- [ ] Instrument accent tokens in `@cosmic/theme`
- [ ] `<cp-readout>` component uses amber for values, ice for units
- [ ] Challenge feedback uses green/rose appropriately
- [ ] Accent colors have sufficient contrast on dark backgrounds

#### 5.4.8 Readout Typography (P0 — Must Have)

Data displays require clear visual hierarchy to be readable from the back of a lecture hall.

**Hierarchy:**
```
ORBITAL PERIOD          ← label (small, muted, uppercase tracking)
  2.47 yr               ← value (large, amber, tabular-nums)
```

**Typography Tokens:**
```css
--readout-label-size: 0.75rem;
--readout-label-weight: 600;
--readout-label-tracking: 0.05em;
--readout-label-color: var(--color-muted);

--readout-value-size: 1.5rem;
--readout-value-weight: 500;
--readout-value-color: var(--accent-amber);
--readout-value-font: "SF Mono", "Fira Code", ui-monospace, monospace;

--readout-unit-size: 0.875rem;
--readout-unit-weight: 400;
--readout-unit-color: var(--accent-ice);
```

**Acceptance Criteria:**
- [ ] `<cp-readout>` component renders label/value/unit with correct hierarchy
- [ ] Values use tabular figures (`font-variant-numeric: tabular-nums`)
- [ ] Readouts legible from 10 meters at 1080p projection
- [ ] Units always explicit (never omitted or assumed)

### 5.5 Accessibility (P0 — Must Have)

**Acceptance Criteria:**
- [ ] All interactive elements reachable via keyboard (Tab/Enter/Space/Arrows)
- [ ] Focus visible and styled consistently
- [ ] Live regions announce dynamic value changes
- [ ] Animations disabled when `prefers-reduced-motion: reduce`
- [ ] Touch targets minimum 44x44px
- [ ] No information conveyed by color alone (use icons/patterns)
- [ ] Tested with VoiceOver (macOS) and NVDA (Windows)

### 5.6 Demo Catalog Site (P0 — Must Have)

#### 5.6.1 Site Structure

| Page | Description |
|------|-------------|
| `/` | Landing with hero, featured demos |
| `/explore/` | Filterable grid of all demos |
| `/exhibits/{slug}/` | Demo page with iframe + context |
| `/play/{slug}/` | Standalone demo (iframe target) |
| `/stations/{slug}/` | Printable station card |
| `/instructor/{slug}/` | Instructor notes (unlisted) |
| `/playlists/{slug}/` | Curated demo sequences |

**Acceptance Criteria:**
- [ ] Site is static (Astro), deploys to GitHub Pages
- [ ] Demo discovery via search, topic filter, difficulty filter
- [ ] Deep links with query params preserve demo state
- [ ] Print stylesheet for station cards

### 5.7 Demo Requirements (P0 — Must Have for Each Demo)

Every demo must include:

| Artifact | Description |
|----------|-------------|
| `index.html` + `main.ts` + `style.css` | Demo source |
| Physics model in `@cosmic/physics` | Testable, documented |
| Exhibit page | Predict → Play → Explain structure |
| Station card | Print-ready 1-page guide |
| Instructor notes | Pedagogy, misconceptions, activities |
| Challenges (optional) | Prediction challenges with feedback |

**Acceptance Criteria:**
- [ ] Demo uses only `@cosmic/ui` components (no custom buttons/sliders)
- [ ] Demo imports physics from `@cosmic/physics` (no inline equations)
- [ ] Demo works standalone (open `index.html` in browser after build)
- [ ] Demo works embedded in site iframe
- [ ] Demo passes Lighthouse accessibility audit (90+)

### 5.8 Testing Requirements (P0 — Must Have)

Every demo requires four layers of testing to prevent drift and ensure correctness:

#### 5.8.1 Physics Model Tests (Vitest)
Location: `packages/physics/src/<model>.test.ts`

Every physics model must have:
- Known-answer tests against published astronomical values
- Round-trip / invertibility tests (e.g., angle -> distance -> angle)
- Edge case tests (zero, negative, Infinity, NaN)
- Consistency tests between related functions

#### 5.8.2 Design Contract Tests (Vitest)
Location: `apps/demos/src/demos/<slug>/design-contracts.test.ts`

Every instrument-layer demo must have contract tests enforcing:
- Celestial token invariants (SVG gradients use `--cp-celestial-*`)
- Starfield canvas present in HTML
- `initStarfield()` imported and called in main.ts
- Readout unit separation (`<span class="cp-readout__unit">`)
- Panel translucency (`backdrop-filter` present in CSS)
- No legacy token leakage (`--cp-warning`, `--cp-accent2`, `--cp-accent3`)
- No hardcoded color literals (no raw `rgba()` or hex values in demo CSS)
- Architecture compliance (physics imported from `@cosmic/physics`, not inline)
- Entry animations present (`cp-slide-up` / `cp-fade-in`)

Golden reference: `moon-phases/design-contracts.test.ts` (14 tests). Copy and adapt for each demo.

#### 5.8.3 Demo Logic Unit Tests (Vitest)
Location: `apps/demos/src/demos/<slug>/logic.test.ts`

Every demo with non-trivial UI logic must extract pure functions to a `logic.ts` module and test them:
- Formatting function tests (number display, angle units, labels)
- Slider math round-trip tests (logarithmic scale, clamping)
- State management tests (preset loading, mode switching)
- Label generation tests (orbit angle names, recession time strings)

#### 5.8.4 E2E / Playwright Tests
Location: `apps/site/tests/<slug>.spec.ts`

Every migrated demo must have Playwright E2E tests covering:
- Layout verification (all shell sections visible)
- Control interaction tests (presets, sliders, mode switches)
- Readout correctness verification (values update when controls change)
- Learning activity tests (station mode, challenge mode, help)
- Accessibility tests (keyboard reachability, `aria-live`, `aria-label`)
- Visual regression screenshots (committed as baselines with `toHaveScreenshot()`)
- Accordion/drawer behavior (open/close, content visibility)

**Acceptance Criteria:**
- [ ] Physics models have 90%+ line coverage
- [ ] Every demo has `design-contracts.test.ts` adapted from moon-phases golden reference
- [ ] Every demo with UI logic has `logic.ts` + `logic.test.ts`
- [ ] Every migrated demo has Playwright E2E tests with visual regression screenshots
- [ ] All tests pass in CI before merge
- [ ] Zero architecture violations (no inline physics, no hardcoded colors)

---

## 6. Success Metrics

### Leading Indicators (Days to Weeks Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Demo load time | < 2s on 3G | Lighthouse performance score |
| Accessibility score | 90+ | Lighthouse accessibility audit |
| Component reuse | 100% | No demo-specific UI components |
| Test coverage | 80%+ for physics | Vitest coverage report |
| Contract test coverage | 100% of demos | Every demo has `design-contracts.test.ts` |
| E2E test coverage | 100% of demos | Every demo has Playwright tests |
| Architecture compliance | 0 violations | No inline physics in demo code |
| Visual regression | 0 unintended changes | Playwright screenshot diff |

### Lagging Indicators (Semester-Scale)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Math anxiety reduction | 15%+ | MARS-R pre/post |
| Math mode engagement | 40%+ voluntary activation | Analytics (if implemented) |
| Instructor adoption | 3+ institutions using | Outreach tracking |
| Demo completion | 70%+ finish challenges | Embedded tracking |
| Student confidence | 20%+ improvement | Custom equation attitude survey |

### Evaluation Timeline

| Timepoint | Check |
|-----------|-------|
| 1 week post-launch | Technical metrics (performance, a11y) |
| 1 month | Instructor feedback, bug reports |
| End of semester | Student outcomes (anxiety, confidence) |
| 1 year | Cross-institution adoption |

---

## 7. Open Questions

| Question | Owner | Blocking? |
|----------|-------|-----------|
| Should `@cosmic/ui` use Lit, Stencil, or vanilla Web Components? | Engineering | Yes — affects dev experience |
| How to handle demo versioning when physics models change? | Engineering | No — can decide during implementation |
| Should we add analytics for usage tracking? | Product | No — can add later, privacy concerns |
| What's the minimum WebGL version for 3D demos? | Engineering | No — affects subset of demos |
| How to handle print stylesheets for complex diagrams? | Design | No — can iterate |
| Should challenges have a leaderboard? | Product | No — explicitly P2 |

---

## 8. Timeline & Phasing

### Phase 1: Foundation (4 weeks)
- Implement `@cosmic/ui` core components
- Implement `@cosmic/renderer` Canvas2D abstraction
- Migrate 1 demo (moon-phases) as reference implementation
- Set up visual regression testing

### Phase 2: Migration (6 weeks)
- Migrate remaining 13 demos to shared component architecture
- **For each demo: write contract tests first (RED), then implement (GREEN)**
- **Extract UI logic to `logic.ts`, add unit tests**
- **Add Playwright E2E tests with visual regression screenshots**
- Validate physics models against legacy behavior
- Complete instructor materials for all demos

### Phase 3: Polish (4 weeks)
- Visual refinement pass on all demos
- Accessibility audit and fixes
- Performance optimization
- Documentation completion

### Phase 4: Pilot (1 semester)
- Deploy for ASTR 101/201 Spring 2026
- Collect pre/post assessment data
- Iterate based on instructor/student feedback

---

## 9. Appendix: Existing Package Inventory

### `@cosmic/physics` (Implemented)
- `AstroConstants` — Physical constants with explicit units
- `AstroUnits` — Unit conversion helpers
- `AngularSizeModel`, `BlackbodyRadiationModel`, `ConservationLawsModel`
- `EclipseGeometryModel`, `KeplersLawsModel`, `MoonPhasesModel`
- `ParallaxDistanceModel`, `PhotonModel`, `RetrogradeMotionModel`
- `SeasonsModel`, `TelescopeResolutionModel`, `TwoBodyAnalytic`
- Kepler solver with Newton-Raphson iteration

### `@cosmic/runtime` (Partially Implemented — Needs Enhancement)
- `createInstrumentRuntime()` — Mode management, export formatting ✓
- `ChallengeEngine` — Prediction challenge framework ✓
- `setLiveRegionText()` — Accessibility announcements ✓
- `initDemoPolish()` — Tooltip/range enhancements ✓
- Export payload formatting (v1 schema) ✓
- **Missing:** `initStarfield()` — Animated starfield background module

### `@cosmic/theme` (Partially Implemented — Needs Enhancement)
- CSS tokens (colors, spacing, typography, shadows) ✓
- Layer system (museum vs instrument contexts) — needs vivid instrument overrides
- Demo shell layouts — needs compositional attribute system
- Component styles (panel, accordion, button, form) ✓
- **Missing:** Starfield module, glow system tokens, celestial object palette, instrument accents, readout typography tokens

### `@cosmic/ui` (Stub — Needs Implementation)
- Currently exports only `PACKAGE_NAME`
- Target: Web Components for all shared UI

### `@cosmic/data-*` (Implemented)
- `data-astr101`: Nearby stars dataset
- `data-spectra`: Atomic lines, molecular bands, EM spectrum objects
- `data-telescopes`: Telescope presets, seeing conditions, wavelength bands

---

## 10. Appendix: Design Principles

1. **Physical correctness over simplicity** — Never sacrifice accuracy for ease of implementation. If a simplification introduces misconceptions, find a better approach.

2. **Show, then tell** — Let students explore phenomena before introducing equations. Math mode is opt-in.

3. **Explicit units always** — Every number has a unit. No "normalized" or "arbitrary" values in student-facing output.

4. **Accessibility is not optional** — Every feature must work for keyboard, screen reader, and reduced-motion users.

5. **Projection-first** — Design for the back row of a lecture hall. Large text, high contrast, clear visual hierarchy.

6. **Single source of truth** — One component library, one physics library, one design system. No forks, no drift.

7. **Boring technology** — Prefer stable, well-documented tools over cutting-edge. The goal is teaching, not tech demos.
