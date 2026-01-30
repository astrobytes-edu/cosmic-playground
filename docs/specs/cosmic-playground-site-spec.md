# Cosmic Playground — Site Spec v0.1

**Status:** Draft (Codex-ready)

**Owner:** Anna

**Date:** 2026-01-29

**Repo:** `cosmic-playground` (monorepo)

---

## 0. One-liner

**Cosmic Playground** is a public, static, fast “interactive museum” for astronomy demos: a searchable library, pedagogical exhibit pages, curated playlists, printable station cards, and optional instructor notes—plus a standardized demo runtime so every demo feels like the same scientific instrument.

---

## 1. Product goals

### 1.1 Goals

1. **Best-in-class student UX** for interactive learning (predict → play → explain).
2. **Consistent UI/UX and instrumentation** across all demos (shared shell + shared components + shared tokens).
3. **Single source of truth** for demo metadata (titles, tags, learning goals, misconceptions, modes, timing, links).
4. **Reusable across courses** (ASTR 101 / ASTR 201 / beyond) via playlists and embeds.
5. **Refactor-friendly**: existing demos can be imported quickly, then progressively rewritten into the new runtime.
6. **Static hosting**: deploy via GitHub Pages (or any static host).

### 1.2 Non-goals (v0.2)

* No authentication / password gates (treat instructor notes as public).
* No server-side runtime or database.
* No rewriting every demo immediately (progressive migration is allowed).
* No LMS integration.

---

## 2. Guiding principles

1. **Correctness first.** A demo that teaches the wrong thing is worse than no demo.
2. **Every demo is an instrument.** Same cockpit layout, same kinds of readouts, same “model notes” honesty.
3. **Pedagogy is first-class.** The wrapper pages are not optional fluff—they are the learning design.
4. **Accessibility by default.** Keyboard operable controls, visible focus, readable text, reduced-motion support.
5. **Static and fast.** The museum pages ship minimal JS. Demos can be heavier, but must remain performant.

---

## 3. Audience and key user stories

### 3.1 Student

* Find a demo quickly by topic.
* Understand what the demo is trying to teach.
* Complete a short structured task.
* Export/copy results for homework/labs.

### 3.2 Instructor (including future-you)

* Assign a playlist.
* Link students to an exhibit page.
* Print a station card.
* Maintain and iterate demos without breaking the site.

### 3.3 Public visitor

* Browse exhibits and play demos without course context.

---

## 4. Information architecture and routing

> Fresh start: no need to preserve prior course-site URLs.

### 4.1 Canonical routes

* `/` — Home
* `/explore/` — Demo library (search + filters)
* `/exhibits/<slug>/` — Exhibit page (pedagogical wrapper)
* `/play/<slug>/` — The interactive demo app (built artifact)
* `/playlists/` and `/playlists/<slug>/` — Curated sequences
* `/stations/<slug>/` — Printable station card
* `/instructor/<slug>/` — Instructor notes (public in v0.2)

### 4.2 Canonical linking rule

Course sites (ASTR 101/201) should link to **`/exhibits/<slug>/`**, not directly to `/play/`, unless explicitly intended.

---

## 5. Repo architecture (monorepo)

### 5.1 Top-level structure

```
cosmic-playground/
├── apps/
│   ├── site/                  # Astro museum site
│   └── demos/                 # Vite-built demo apps (source)
├── packages/
│   ├── physics/               # units, constants, orbit utilities, etc.
│   ├── ui/                    # reusable UI components (controls/readouts)
│   ├── runtime/               # demo shell: modes, tour, challenge, export
│   └── theme/                 # design tokens, typography, icons
├── scripts/                   # build + validation scripts
├── .github/workflows/         # CI + deploy
└── README.md
```

### 5.2 Build artifact placement

Demo build outputs are copied into:

* `apps/site/public/play/<slug>/` (one folder per demo)
* `apps/site/public/play/_assets/` (shared assets if needed)

This ensures demos are served as plain static files from the museum site.

---

## 6. Technology choices

### 6.1 Museum site

* **Astro** (static build)
* **Astro Content Collections** for typed metadata and content validation

### 6.2 Demo apps

* **Vite** for bundling
* TypeScript recommended

### 6.3 Package management

* Use **pnpm** workspace (preferred for monorepos). If you already standardized on something else, keep it consistent.

---

## 7. Content model (single source of truth)

### 7.1 Content Collections

Located in `apps/site/src/content/`:

* `demos/` — one entry per demo
* `playlists/` — curated sequences
* `exhibits/` — optional longform exhibit prose (can live inside `demos/` too)
* `stations/` — station card content (optional; can be generated)
* `instructor/` — instructor notes content

### 7.2 Demo schema (required fields)

Each file: `apps/site/src/content/demos/<slug>.md`

Frontmatter schema:

* `slug: string` (canonical; matches folder under `/play/`)
* `title: string`
* `status: 'stable' | 'beta' | 'draft'`
* `levels: Array<'ASTR101' | 'ASTR201' | 'Both'>`
* `topics: Array<'EarthSky' | 'LightSpectra' | 'Telescopes' | 'Orbits' | 'Stars' | 'Galaxies' | 'Cosmology' | 'DataInference'>`
* `time_minutes: number` (typical student time)
* `has_math_mode: boolean`
* `tags: string[]`
* `learning_goals: string[]` (3–5)
* `misconceptions: string[]` (1–3)
* `predict_prompt: string`
* `play_steps: string[]` (2–6)
* `explain_prompt: string`
* `model_notes: string[]`
* `demo_path: string` (computed as `/play/<slug>/` but stored for convenience)
* `station_path: string` (computed)
* `instructor_path: string` (computed)
* `last_updated: string` (ISO date)

### 7.3 Playlist schema

Each file: `apps/site/src/content/playlists/<slug>.md`

* `title`
* `audience` (e.g., ASTR101 Module 01)
* `estimated_minutes`
* `demos: Array<{ slug: string; required: boolean; note?: string }>`
* `overview` (short)
* `instructions` (student-facing)

---

## 8. Page and UX specifications

### 8.1 Home (`/`)

**Must include:**

* Brand + tagline(s):

  * “Predict. Play. Explain.”
  * “Play with the universe. Learn the physics.”
* Primary CTAs: Explore / Playlists
* Featured exhibits (4–6)
* “New/Updated” list (from metadata)

### 8.2 Explore (`/explore/`) — Demo library

**Controls:**

* Search (title + tags)
* Filters:

  * topic
  * level
  * time bucket (≤10, 10–20, 20+)
  * status
  * has_math_mode
* Sorting:

  * recommended (default)
  * shortest first
  * newest updated

**Results:**

* Demo cards show: title, badges, 1-line description, time, level(s)
* Clicking a card goes to `/exhibits/<slug>/`

### 8.3 Exhibit page (`/exhibits/<slug>/`) — Pedagogical wrapper

**Required sections:**

1. Title + badges (topic, level, time)
2. Launch controls:

   * Launch demo (same tab)
   * Open fullscreen (new tab)
   * Station card
   * Instructor notes
3. Predict block
4. Learning goals
5. Misconceptions targeted
6. Play steps
7. Explain prompt
8. Model notes (explicit simplifications)
9. Demo embed (responsive iframe) + fallback “Open fullscreen”

### 8.4 Station card (`/stations/<slug>/`) — Print-first

**Requirements:**

* Print-friendly CSS
* Simple structured workflow:

  * context
  * steps
  * answer blanks
  * parameter table
  * “claim + evidence” box

**Default length:** 1 page (2 pages allowed if needed).

### 8.5 Instructor notes (`/instructor/<slug>/`) — Public in v0.2

**Structure:**

* Overview
* Activities
* Assessment
* Model notes (deeper)
* Backlog (internal TODO list)

**Visibility:**

* Not linked from primary nav (optional)
* Add `noindex` meta tag to instructor pages (optional)

---

## 9. Demo runtime standard (“Instrument Standard”)

### 9.1 Demo shell layout invariant

* **Left:** controls panel
* **Center:** visualization stage
* **Right:** readouts + “what to notice”
* **Bottom drawer:** math mode + model notes

Responsive rules:

* Mobile collapses to tabs: Controls | View | Readouts

### 9.2 Shared runtime features (packages/runtime)

Every demo must support:

1. **Modes**

   * `concept` (default)
   * `math` (optional)
   * Mode reflected in URL query (`?mode=math`) and persisted in localStorage.

2. **Export results**

   * `exportResults(): { parameters, readouts, notes, timestamp }`
   * “Copy results” button copies a human-readable block to clipboard.

3. **Model note block**

   * always present (even if short)

4. **Challenge / tour hooks** (optional but standardized)

   * `challengeEngine` and `tourEngine` APIs

5. **KaTeX support**

   * Provide a runtime helper to render math consistently.

### 9.3 Shared UI components (packages/ui)

Minimum component set:

* `Slider`, `Toggle`, `Select`, `Tabs`
* `Callout` (info/warn/model)
* `Badge`
* `Readout` (value + units + short interpretation)
* `ParameterTable`
* `Button`, `IconButton`, `Modal`, `Tooltip`

### 9.4 Shared physics (packages/physics)

* Units + conversions
* Constants
* Common orbit solvers/utilities
* Numerical helpers (stable clamps, interpolation)

---

## 10. Design system (packages/theme)

### 10.1 Tokens

* Typography scale (base + headings)
* Spacing scale
* Radii
* Shadows
* Color tokens

### 10.2 Visual constraints

* Site chrome can be “cosmic”; demos themselves must stay high-contrast and readable.
* Avoid excessive animation; respect reduced motion.

---

## 11. Performance and accessibility requirements

### 11.1 Performance

* Museum pages should be mostly static HTML (minimal client JS).
* Demo pages may load more JS, but should:

  * avoid blocking the first interaction
  * keep assets local (no third-party CDNs required)

### 11.2 Accessibility (minimum)

* Keyboard operable controls
* Visible focus states
* ARIA labels for custom controls
* No color-only encoding for meaning
* Reduced-motion support

---

## 12. Build pipeline

### 12.1 Demos build (apps/demos)

* Multi-entry build: each demo has its own `index.html` + `main.ts`
* Output structure:

  * `apps/demos/dist/<slug>/...`

### 12.2 Copy artifacts into site

A script copies demo dist outputs into:

* `apps/site/public/play/<slug>/...`

### 12.3 Site build

* Astro builds `apps/site/` into static output
* Deploy static output to GitHub Pages

---

## 13. CI / QA

### 13.1 Required checks

* `lint`
* `typecheck`
* `unit tests` for `packages/physics`
* `build` (demos + site)

### 13.2 E2E smoke tests (recommended)

Use Playwright:

* Visit `/explore/` and assert library renders
* For each demo slug:

  * visit `/play/<slug>/`
  * assert a known root element exists
  * fail on console errors

### 13.3 Link validation

* Ensure every demo listed in content has a matching `/play/<slug>/` directory.

---

## 14. Implementation milestones (Codex plan)

### Milestone 0 — Scaffold

* [ ] Create monorepo structure (`apps/`, `packages/`, `scripts/`)
* [ ] Astro site boots locally
* [ ] GitHub Pages deploy works

### Milestone 1 — Content collections + library shell

* [ ] Define content schemas (demos/playlists)
* [ ] Seed demo entries for initial set
* [ ] Implement `/explore/` with filters/search

### Milestone 2 — Exhibit pages

* [ ] Implement `/exhibits/[slug]` template
* [ ] Iframe embed component + fullscreen link

### Milestone 3 — Station cards

* [ ] Implement `/stations/[slug]`
* [ ] Print CSS

### Milestone 4 — Demo import + build pipeline

* [ ] Copy existing demos into `/play/` (temporary quick win)
* [ ] Create Vite multi-entry build for refactored demos
* [ ] Add script that builds demos then copies dist into site

### Milestone 5 — Refactor one demo end-to-end

* [ ] Choose a pilot (Seasons or Moon Phases)
* [ ] Rewrite into `apps/demos/src/demos/<slug>/`
* [ ] Use shared shell + UI components
* [ ] Implement export results
* [ ] Verify feature parity + improved UX

### Milestone 6 — Progressive refactor of remaining demos

* [ ] Convert demos one-by-one
* [ ] Replace legacy `_assets` with `packages/*`

---

## 15. Acceptance criteria (v0.2)

1. Site deploys publicly with:

   * `/explore/`, `/exhibits/<slug>/`, `/stations/<slug>/`, `/playlists/<slug>/`
2. Demo library is driven entirely by content metadata.
3. Every demo listed in the library has a working `/play/<slug>/` target.
4. Exhibit pages include the full pedagogy blocks (predict/play/explain/model notes).
5. Station cards print cleanly.
6. At least one demo is fully refactored into the new runtime with improved UI/UX.

---

## 16. Appendices

### A) Example demo content file (template)

```md
---
slug: seasons
title: "Seasons: Why Tilt Matters"
status: beta
levels: [Both]
topics: [EarthSky]
time_minutes: 10
has_math_mode: true
tags: ["tilt", "sunlight", "insolation"]
learning_goals:
  - "Explain why axial tilt causes seasons."
  - "Relate sun angle/day length to heating."
  - "Distinguish tilt-driven seasons from distance myths."
misconceptions:
  - "Seasons are caused by Earth being closer/farther from the Sun."
predict_prompt: "If Earth’s axis were not tilted, what would happen to seasons?"
play_steps:
  - "Set tilt to 0° and observe insolation patterns."
  - "Increase tilt to 23.5° and compare hemispheres."
  - "Change date and observe day length changes."
explain_prompt: "Use what you observed to explain how tilt changes sunlight angle and day length, producing seasonal temperature changes."
model_notes:
  - "This model exaggerates some geometry for clarity."
  - "It treats Earth as a sphere and ignores atmospheric circulation details."
demo_path: "/play/seasons/"
station_path: "/stations/seasons/"
instructor_path: "/instructor/seasons/"
last_updated: "2026-01-29"
---

Short description (1–3 sentences) shown on cards.
```

### B) Demo “export results” copy format

```
Cosmic Playground — Demo Results
Demo: <title>
Timestamp: <ISO>
Mode: concept|math

Parameters:
- ...

Readouts:
- ... (with units)

Claim:
<one sentence>

Evidence from demo:
- ...
```
