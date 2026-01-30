# Seed Initial Demo Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Seed the v0.1 demo library with the initial set of slugs (from the reference demos), ensuring every content demo has a working `/play/<slug>/` target (even if the demo is a “coming soon” stub).

**Architecture:** Add minimal stub demos under `apps/demos/src/demos/<slug>/` so the Vite MPA build produces `dist/<slug>/index.html` for each. Add corresponding content entries under `apps/site/src/content/demos/<slug>.md` with non-empty pedagogy fields.

**Tech Stack:** TypeScript, Vite MPA, Astro Content Collections.

---

### Task 1: Add stub demos for initial slugs

**Files:**
- Create: `apps/demos/src/shared/stub-demo.ts`
- Create: `apps/demos/src/shared/stub-demo.css`
- Create: `apps/demos/src/demos/<slug>/{index.html,main.ts,style.css}` for:
  - `angular-size`
  - `binary-orbits`
  - `blackbody-radiation`
  - `conservation-laws`
  - `eclipse-geometry`
  - `em-spectrum`
  - `keplers-laws`
  - `parallax-distance`
  - `seasons`
  - `telescope-resolution`

**Step 1: Shared stub module**
- Renders a consistent “instrument-like” layout and a clear “migration pending” message.

**Step 2: Per-demo entrypoints**
- Each `index.html` sets demo title + short one-liner.
- Each `main.ts` calls the shared stub initializer.

**Step 3: Verify**
Run: `corepack pnpm -C apps/demos build`
Expected: `apps/demos/dist/<slug>/index.html` exists for each slug.

---

### Task 2: Add content entries for each slug

**Files:**
- Create: `apps/site/src/content/demos/<slug>.md` for the slugs above (plus existing `moon-phases`)
- Modify: `apps/site/src/content/playlists/earth-sky-starters.md` (optional) to include multiple demos

**Step 1: Add required frontmatter**
- `title`, `status`, `levels`, `topics`, `time_minutes`, `has_math_mode`, `tags`,
  `learning_goals`, `misconceptions`, `predict_prompt`, `play_steps`, `explain_prompt`,
  `model_notes`, `demo_path`, `station_path`, `instructor_path`, `last_updated`.

**Step 2: Verify**
Run: `corepack pnpm build`
Expected: PASS, and validation finds play artifacts for all content demos.

---

### Task 3: Commit + push

Run:
- `git add -A`
- `git commit -m "chore(content): seed initial demo library with stubs"`
- `git push`

