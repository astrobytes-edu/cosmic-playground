# Cosmic Playground — Claude / LLM working notes

This repo uses `AGENTS.md` as the authoritative agent instructions. Read and follow it first.

## Git workflow (solo maintainer)

If you’re the only developer, you *can* work directly on `main`, but you’ll learn faster (and keep `main` calmer) if you treat `main` as **always-green** and do work on short-lived branches.

### Teaching mode (for humans)

If the user asks about Git (or seems unsure), prefer a “teach while doing” style:
- Always state the **current branch** (`git branch --show-current`) and whether the tree is clean (`git status -sb`) before risky actions.
- Use **safe defaults** (`git pull --ff-only`, `git merge --ff-only`) unless the user explicitly asks for rebases/force pushes.
- Explain *why* a command is being run in one sentence before running it.
- When something fails, explain the failure as a concept first (“the repo changed upstream” / “you have local edits”), then give the smallest next command.

### The two “merge directions” (what they mean)

- **Merge `main` → branch**: “bring latest `main` into my work-in-progress branch.” This reduces surprises later and is safe while you iterate.
- **Merge branch → `main`**: “land the feature.” This changes `main`, so you want high confidence right before you do it.

### Recommended habit (simple, no rebase required)

**Start work**

```bash
git checkout main
git pull --ff-only
git checkout -b codex/<topic>
```

**While working (optional, but good when `main` moved)**

```bash
git fetch origin
git checkout codex/<topic>
git merge origin/main
```

**Land to `main` (safe fast-forward style)**

```bash
git checkout main
git pull --ff-only
git merge --ff-only codex/<topic>
corepack pnpm build
corepack pnpm -r typecheck
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
git push origin main
```

If `git merge --ff-only codex/<topic>` fails, it usually means `main` advanced since you started. Do the “merge `main` → branch” step above (resolve conflicts if needed), rerun gates, then try landing again.

### Why “branch first” is worth it (even solo)

Working on a branch is not about bureaucracy; it’s about making “undo” and “review” easier:
- You can abandon a branch without touching `main`.
- You can compare your work to `main` at any time (`git log main..HEAD` and `git diff main..HEAD`).
- You can land with confidence using `--ff-only` so history stays linear and simple.

### PRs (still worth it even for solo)

You can keep PR overhead low but still get value:
- PRs give you a checklist (“did I run gates?”) and a permanent reviewable artifact.
- You can open a PR and self-merge when ready; it’s still a disciplined workflow.

### Tiny “I’m learning Git” cheat sheet

- “What branch am I on?” → `git branch --show-current`
- “Is my tree clean?” → `git status -sb`
- “What changed?” → `git diff` (unstaged), `git diff --staged` (staged)
- “What commits did I make?” → `git log --oneline --decorate -10`
- “I want the simplest pulls” → `git pull --ff-only`
- “I messed up but committed” → `git reflog` (find the old SHA), then ask for help before force-resetting

## Quick commands

- Install (if needed): `corepack pnpm install`
- Build everything (demos + site): `corepack pnpm build`
- Site checks: `corepack pnpm -C apps/site typecheck`
- E2E (Playwright): `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (or leave `CP_BASE_PATH` unset)
- Python (conda env with PyYAML): `conda run -n astro python <script.py> ...`

## Dependency notes

- If a Python tool fails with `ModuleNotFoundError`, install the missing package into the `astro` conda env (and we’ll call out the exact package + command when it happens).
- If a `corepack pnpm ...` command fails due to missing deps, run `corepack pnpm install`.

## Architecture at a glance

- `apps/site/`: Astro static site (GitHub Pages deploy target is `apps/site/dist/`)
- `apps/demos/`: Vite-built interactive instruments (each demo is its own folder under `apps/demos/src/demos/<slug>/`)
- `packages/physics/`: Pure, testable physics models (prefer TDD for ports)
- `packages/runtime/`: Shared demo runtime (Station Mode, Challenge Mode, export helpers, starfield, etc.)
- `packages/theme/`: Shared tokens, demo shell styles, instrument layer, and animation keyframes

## Demo build/copy pipeline

- Vite builds demos to `apps/demos/dist/<slug>/`
- `corepack pnpm build` copies those outputs to `apps/site/public/play/<slug>/`
- `/play/<slug>/` pages on the site are served from `apps/site/public/play/<slug>/`

## Legacy demo reference (important)

- Legacy demos live at: `~/Teaching/astr101-sp26/demos/`
- **DO NOT modify legacy demos** — they are actively used for teaching this semester.
- Migration hardening directive: treat migrated demos as untrusted; refactor and harden them one-by-one by comparing behavior, UX, and physics against the legacy demo.

## Hard constraints / conventions

- Prefer static + fast pages; minimal client JS on museum pages.
- Use `import.meta.env.BASE_URL` for internal links/asset URLs (GitHub Pages base path support).
- Keep units explicit and consistent everywhere (UI labels, exports, docs).
  - Do **not** use `G=1` or "natural units" phrasing.
  - When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with `G = 4π² AU³/(yr²·M☉)`.

---

## Design System — Contract-Driven Architecture

The design system follows a **contract-driven, single-source-of-truth** approach. Tokens are defined once in CSS, mirrored in TypeScript, and enforced by automated tests. Every visual property flows from the token system — no hardcoded color values in demo code.

### Two-Layer Philosophy

| Layer | Purpose | Look |
|-------|---------|------|
| **Museum** (default) | Site chrome, exhibit pages | Muted, sophisticated, ink-on-slate |
| **Instrument** (`.cp-layer-instrument`) | Interactive demos | Vivid accents, celestial glows, translucent panels |

The instrument layer overrides museum tokens via CSS cascade: `.cp-layer-instrument` scopes vivid accents, glow intensities, and panel translucency.

### Token Hierarchy (single source of truth)

```
tokens.css          → defines ALL custom properties (colors, glows, spacing, typography)
  ├─ vars.ts        → TypeScript mirror of CSS tokens (for JS references)
  ├─ tokens.test.ts → contract tests asserting token existence and value ranges
  └─ layer-instrument.css → instrument layer overrides (vivid accents, translucent panels)
```

### Design System Invariants (enforced by tests + build)

These rules are non-negotiable. The build and test suites enforce them automatically.

1. **Celestial Token Contract**: Every SVG celestial object MUST use `--cp-celestial-*` tokens. Never use `--cp-warning`, `--cp-accent2`, or generic colors for sun/moon/earth/planets.
2. **Starfield Contract**: Every instrument-layer demo MUST have `<canvas class="cp-starfield" aria-hidden="true">` and call `initStarfield()` from `@cosmic/runtime`.
3. **Readout Typography Contract**: Readouts follow a label → value → unit hierarchy. Units MUST be separated into `<span class="cp-readout__unit">` elements. Values render in amber monospace (`--cp-readout-value-color`), units in ice-blue (`--cp-readout-unit-color`).
4. **Panel Translucency Contract**: Demo-specific panels MUST use `var(--cp-instr-panel-bg)` (not opaque backgrounds) + `backdrop-filter: blur(8px)` so the starfield shows through.
5. **No Color Literals**: The build invariant `apps:no-color-literals` forbids hardcoded `rgba()` or hex values in demo CSS. Extract to tokens or use existing `var(--cp-*)` references.
6. **Glow Opacity Contract**: Celestial glow tokens use 30–50% opacity. If a glow looks invisible, it's wrong.
7. **Token Purity**: Zero legacy aliases (`--cp-warning`, `--cp-accent2`) in demo code. Use semantic names.
8. **Motion Contract**: Entry animations use `cp-slide-up` / `cp-fade-in` with stagger. All animations respect `prefers-reduced-motion` via the global override in `animations.css`.

### Key Token Categories

| Category | Tokens | Example |
|----------|--------|---------|
| Celestial palette | `--cp-celestial-sun`, `-moon`, `-earth`, `-mars`, `-star`, `-orbit` | Sun gradient: `var(--cp-celestial-sun-core)` |
| Glow system | `--cp-glow-sun`, `-moon`, `-planet`, `-star`, `-accent-teal/rose/violet` | Earth: `filter: drop-shadow(var(--cp-glow-planet))` |
| Instrument accents | `--cp-accent-amber`, `-green`, `-ice`, `-rose` | Readout values: `var(--cp-accent-amber)` |
| Panel surfaces | `--cp-instr-panel-bg`, `-bg-muted`, `-border` | `background: var(--cp-instr-panel-bg)` |
| Readout typography | `--cp-readout-label-*`, `--cp-readout-value-*`, `--cp-readout-unit-*` | Defined in `tokens.css`, applied by `layer-instrument.css` |
| Animation keyframes | `cp-fade-in`, `cp-slide-up`, `cp-pop-in`, `cp-pulse`, `cp-glow-pulse`, `cp-value-flash`, `cp-twinkle` | Defined in `animations.css` |

### CSS Import Chain (demo entry point)

Every demo's `style.css` starts with:
```css
@import "../../shared/stub-demo.css";
```

Which imports (in order):
```
tokens.css → animations.css → layer-instrument.css → demo-shell.css → button.css → form.css
```

This ensures the full token system + shell + components are available before demo-specific styles.

---

## Design System Testing

### Token tests (`packages/theme/src/tokens.test.ts`)
- 30 tests verifying token existence and value constraints
- Glow opacity range (30–50%), text sizes in rem, readout amber color, animation keyframes, reduced-motion override

### Demo contract tests (`apps/demos/src/demos/<slug>/design-contracts.test.ts`)
- Per-demo tests that read HTML/CSS as strings and assert token usage patterns
- **Golden reference**: `moon-phases/design-contracts.test.ts` (14 tests)
- Copy and adapt this file for each demo during migration

### Running tests
```bash
corepack pnpm -C packages/theme test -- --run    # 30 token tests
corepack pnpm -C apps/demos test -- --run         # all demo tests
corepack pnpm build                               # includes invariant validation
```

---

## Demo Migration Workflow (contract-driven)

### Golden reference: `moon-phases`

The moon-phases demo is the fully migrated reference. Every pattern established there is a contract for remaining demos.

### Per-demo migration checklist

1. **Write contract tests first (RED)**: Copy `moon-phases/design-contracts.test.ts`, adapt assertions for the demo's specific SVG elements and readouts.
2. **Add starfield**: `<canvas class="cp-starfield" aria-hidden="true">` + `initStarfield()`.
3. **Migrate SVG tokens**: Replace all generic/legacy color references with `--cp-celestial-*` tokens.
4. **Separate readout units**: Add `<span class="cp-readout__unit">` for dimensional readouts.
5. **Make panels translucent**: Use `var(--cp-instr-panel-bg)` + `backdrop-filter: blur(8px)`.
6. **Replace legacy CSS tokens**: Swap `--cp-warning`, `--cp-accent2` with semantic equivalents.
7. **Add celestial glows**: SVG filters for sun, CSS `drop-shadow()` for planets.
8. **Add entry animations**: `cp-slide-up` / `cp-fade-in` with stagger on shell sections.
9. **Verify**: All contract tests GREEN, typecheck clean, build succeeds.

### Demo migration order (from CLAUDE-CODE-MIGRATION-PROMPT.md)

1. ~~`moon-phases`~~ — DONE (golden reference)
2. `angular-size` — similar complexity
3. `parallax-distance` — simple geometry
4. `seasons` — uses earth/sun
5. `blackbody-radiation` — spectrum visualization
6. `telescope-resolution` — optics
7. `em-spectrum` — light/spectra
8. `eclipse-geometry` — geometry
9. `keplers-laws` — orbital mechanics
10. `retrograde-motion` — multi-body
11. `conservation-laws` — physics viz
12. `binary-orbits` — orbital mechanics
13. `planetary-conjunctions` — multi-body

### Physics imports

All physics models MUST come from `@cosmic/physics` — no inline equations in demo code.
