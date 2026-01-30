# Cosmic Playground (Site v0.1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.  
> **For this repo/session:** Execute in-session (no worktree) with checkpoints after each task batch.

**Goal:** Create a pnpm monorepo with an Astro “museum” site and a Vite multi-page demos pipeline that builds demos into `/play/<slug>/`, meeting Milestones 0–3 and setting up Milestone 4 cleanly.

**Architecture:** `apps/demos` builds static demo artifacts per slug; a root script copies artifacts into `apps/site/public/play/<slug>/`; `apps/site` (Astro) reads demo metadata from Content Collections and renders Home/Explore/Exhibit/Playlist/Station/Instructor routes with minimal client JS.

**Tech Stack:** pnpm workspaces, Node.js (ESM scripts), TypeScript, Astro (static), Vite (MPA).

**Pre-task (already requested by owner):** Repo meta scaffolding files and folders exist: `AGENTS.md`, `docs/plans/`, `docs/audits/`, `docs/backlog.md`, `CHANGELOG.md`.

---

### Task 1: Create pnpm workspace + root tooling

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `tsconfig.base.json`

**Step 1: Add `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 2: Add root `package.json` with required scripts**

Minimum scripts (spec contract):
- `dev` → runs Astro dev server
- `build` → builds demos → copies → builds site (via `scripts/build.mjs`)
- `lint` → placeholder OK initially, but prefer real lint early
- `typecheck` → `tsc -b` across workspace
- `test` → placeholder OK

**Step 3: Add `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "types": ["vite/client"]
  }
}
```

**Step 4: Verify workspace wiring**

Run:
- `pnpm -v`
- `pnpm -r --help` (sanity)

Expected: pnpm installed and commands available.

---

### Task 2: Create workspace packages skeleton (`packages/*`)

**Files (repeat per package):**
- Create: `packages/<name>/package.json`
- Create: `packages/<name>/tsconfig.json`
- Create: `packages/<name>/src/index.ts`

Packages to create:
- `packages/physics`
- `packages/ui`
- `packages/runtime`
- `packages/theme`

**Step 1: Create minimal package manifests**

Each `package.json`:
- `name`: `@cosmic/<name>`
- `type`: `module`
- `exports`: `./src/index.ts` (OK for now; Vite will bundle sources)
- `version`: `0.0.0`

**Step 2: Create `tsconfig.json` extending root**

```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

**Step 3: Export a placeholder symbol**

Example `src/index.ts`:
- `export const PACKAGE_NAME = "@cosmic/<name>";`

**Step 4: Typecheck quick sanity**

Run: `pnpm -r typecheck` (after deps installed in Task 9).

---

### Task 3: Scaffold `apps/demos` (Vite MPA) + one pilot demo

**Files:**
- Create: `apps/demos/package.json`
- Create: `apps/demos/tsconfig.json`
- Create: `apps/demos/vite.config.ts`
- Create: `apps/demos/src/demos/<slug>/index.html`
- Create: `apps/demos/src/demos/<slug>/main.ts`
- Create: `apps/demos/src/demos/<slug>/style.css`

**Step 1: Create Vite MPA structure**

Constraints from spec:
- each demo is its own HTML entry under `src/demos/<slug>/index.html`
- build outputs to `dist/<slug>/...`
- Vite `base: "./"` so artifacts work under nested hosting paths
- auto-discover slugs by reading directories under `src/demos/`

**Step 2: Implement `vite.config.ts` discovery**

Implement (Node `fs` + `path`) to produce `build.rollupOptions.input` mapping:
- key: `<slug>`
- value: absolute path to `src/demos/<slug>/index.html`

**Step 3: Add one pilot demo (choose `moon-phases` unless blocked)**

Minimal requirements:
- compiles in Vite build
- has a visible “demo shell direction” (title/header, one control, one readout)
- exports a known root element (`#cp-demo`) for future smoke tests

**Step 4: Verify demo build output shape**

Run (after deps installed):
- `pnpm -C apps/demos build`

Expected:
- `apps/demos/dist/moon-phases/index.html` exists

---

### Task 4: Scaffold `apps/site` (Astro) for GitHub Pages project deployment

**Files:**
- Create: `apps/site/package.json`
- Create: `apps/site/astro.config.mjs`
- Create: `apps/site/tsconfig.json`
- Create: `apps/site/src/pages/index.astro`
- Create: `apps/site/src/layouts/Layout.astro`
- Create: `apps/site/src/styles/global.css`

**Step 1: Configure Astro static output + base**

In `astro.config.mjs`:
- `output: "static"`
- `site`: `https://<github-user>.github.io/<repo-name>/` (can be placeholder but required for canonical URLs)
- `base`: `"/<repo-name>/"` (must match project site base when deployed)

**Step 2: Use `import.meta.env.BASE_URL` for internal links**

In `Layout.astro` and nav links, join paths via `new URL("explore/", Astro.site ?? import.meta.env.BASE_URL)` or use a small helper.

**Step 3: Minimal global styling**

Add base typography, colors, focus ring, and skip link.

---

### Task 5: Add Content Collections + seed content

**Files:**
- Create: `apps/site/src/content/config.ts`
- Create: `apps/site/src/content/demos/<slug>.md`
- Create: `apps/site/src/content/playlists/<slug>.md`

**Step 1: Implement collections per spec**

Minimum collections to unblock routes:
- `demos`
- `playlists`

Include required frontmatter fields from spec for `demos` (title/status/levels/topics/time/has_math_mode/tags/learning_goals/misconceptions/predict_prompt/play_steps/explain_prompt/model_notes/demo_path/station_path/instructor_path/last_updated).

Note: Astro Content Collections reserve `slug`; canonical slugs are derived from filenames (`demos/<slug>.md`) and accessed via `entry.slug`.

**Step 2: Seed demo entries**

Create at least 1 demo entry matching pilot slug (e.g. `moon-phases`) and a few more stubs (with non-empty pedagogy fields) so Explore feels real.

**Step 3: Seed one playlist**

Playlist resolves demo slugs and renders them in order.

---

### Task 6: Implement required routes + shared components

**Files:**
- Create: `apps/site/src/pages/explore/index.astro`
- Create: `apps/site/src/pages/exhibits/[slug].astro`
- Create: `apps/site/src/pages/playlists/index.astro`
- Create: `apps/site/src/pages/playlists/[slug].astro`
- Create: `apps/site/src/pages/stations/[slug].astro`
- Create: `apps/site/src/pages/instructor/[slug].astro`
- Create: `apps/site/src/components/DemoCard.astro`
- Create: `apps/site/src/components/FilterBar.astro`
- Create: `apps/site/src/components/IframeStage.astro`
- Create: `apps/site/src/components/TagPill.astro`

**Step 1: Home (`/`)**
- Links to Explore + featured playlist/demos (simple).

**Step 2: Explore (`/explore/`)**
- Server-rendered filters via query params (no islands initially).
- Search across title/tags/topics.
- Sorting (e.g., title, updated date, time).

**Step 3: Exhibit (`/exhibits/[slug]/`)**
- Pulls matching demo from `demos` collection by `slug`.
- Renders predict → play → explain blocks + model notes.
- Embeds `/play/<slug>/` via `IframeStage`.

**Step 4: Playlists**
- Index lists playlists.
- Detail resolves demo slugs; renders DemoCards.

**Step 5: Station card**
- Print-first layout + print CSS.
- Includes QR-friendly link to exhibit.

**Step 6: Instructor**
- Public page, optionally sets `<meta name="robots" content="noindex">`
- Not linked from primary nav.

---

### Task 7: Build pipeline script + validation

**Files:**
- Create: `scripts/build.mjs`
- Create: `scripts/validate-play-dirs.mjs`

**Step 1: Build orchestration**

`scripts/build.mjs` does:
1. `pnpm -C apps/demos build`
2. copy `apps/demos/dist/<slug>/` → `apps/site/public/play/<slug>/`
3. run validation script
4. `pnpm -C apps/site build`

**Step 2: Validation contract**

Validation reads demo slugs from `apps/site/src/content/demos/*.md` and asserts that after copy, `apps/site/public/play/<slug>/index.html` exists.

Expected: non-zero exit code on missing demo artifact.

---

### Task 8: GitHub Pages deploy workflow + README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Step 1: Workflow**
- Uses official Astro GitHub Pages workflow.
- Installs deps at repo root.
- Runs root `pnpm build`.
- Deploys from `apps/site` as required by action.

**Step 2: README**
- Local dev: `pnpm install`, `pnpm dev`
- Full build: `pnpm build`
- Explain `/play/` artifacts and base path behavior.

---

### Task 9: Install dependencies and run full build locally

**Step 1: Install**

Run: `pnpm install`

Expected: workspace dependencies installed.

**Step 2: Full build**

Run: `pnpm build`

Expected:
- demos build succeeds
- copy succeeds
- validation passes
- Astro build succeeds

**Step 3: Quick manual smoke**

Run: `pnpm dev` then check:
- `/explore/` renders list
- at least one exhibit embeds the demo iframe (`/play/<slug>/`)
