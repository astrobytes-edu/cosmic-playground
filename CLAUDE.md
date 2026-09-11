# Cosmic Playground — Claude / LLM working notes

This file is the single source of truth for agent instructions in this repo (Claude, Codex or any other agent). `AGENTS.md` only points here — edit this file, not that one.

## Git workflow (solo maintainer)

If you’re the only developer, you *can* work directly on `main`, but you’ll learn faster (and keep `main` calmer) if you treat `main` as **always-green** and do work on short-lived branches.

### Teaching mode (for humans)

If the user asks about Git (or seems unsure), prefer a “teach while doing” style:
- Always state the **current branch** (`git branch --show-current`) and whether the tree is clean (`git status -sb`) before risky actions.
- Use **safe defaults** (`git pull --ff-only`, `git merge --ff-only`) unless the user explicitly asks for rebases/force pushes.
- Explain *why* a command is being run in one sentence before running it.
- When something fails, explain the failure as a concept first (“the repo changed upstream” / “you have local edits”), then give the smallest next command.
- Never force-push or hard-reset without an explicit request and a clear warning that it is destructive.

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
- Contract tests (optional): `corepack pnpm test:datasets`, `corepack pnpm test:physics-contract`
- If E2E 404s on `/explore/` or `/play/<slug>/`, check `CP_BASE_PATH` first.
- Targeted unit runs: `corepack pnpm -C packages/physics exec vitest run src/<file>.test.ts`; `corepack pnpm -C apps/demos exec vitest run src/demos/<slug>`

## Verification gotchas

- Capture gate exit codes directly (`cmd > log 2>&1; echo EXIT=$?`), never through a pipe.
- Never run two Playwright runs at once: they share port 4321 and `test-results/` is wiped at start.
- A RED must fail on assertions. "Tests  no tests" means the file failed to load (e.g. `it` where the file imports `test`).
- Test physics at asymmetric points, not only symmetric ones: a waxing/waning swap passed because tests checked only full and new moon.
- Moon phase convention: 0 = full, 90 = third quarter, 180 = new, 270 = first quarter; elongation = (alpha - 180) mod 360.
- SVG y points down: a north-up (counter-clockwise) orbit needs `cy - r*sin(theta)`. seasons and eclipse-geometry are still clockwise.
- Reflow: test whether the page actually scrolls (`scrollTo(2000,0)`, then `scrollX > 0`), not `scrollWidth`. A `1fr` track grows to its widest item — use `minmax(0,1fr)` + `min-width: 0`. `/play/` routes are not yet in reflow.spec.ts.
- eos-lab's first-visit tour blocks clicks in E2E unless localStorage `eos-lab-toured` is set.
- Pushing to main cancels an in-progress deploy (`deploy.yml` concurrency, `cancel-in-progress: true`).
- Readiness: only `launch-ready` removes the card badge (`readiness.ts:59`); only `status: stable` removes the exhibit's "Active development" callout. Move both together; `readinessReason` is public copy.

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
- Contracts: `docs/specs/cosmic-playground-site-spec.md` (site), `docs/specs/cosmic-playground-data-contract.md` (data-heavy demos), `docs/specs/cosmic-playground-model-contract.md` (physics: correctness, explicit units, required tests).
- Instructor pages are public; optionally `noindex` and omitted from primary nav.
- Symbols in UI copy, model notes, exports and docs: **D** = physical diameter, **d** = distance. Never reuse D/d for other quantities — name them (e.g. `dEarthMoonKm`, `distanceToSunKm`).
- Use `import.meta.env.BASE_URL` for internal links/asset URLs (GitHub Pages base path support).
- Keep units explicit and consistent everywhere (UI labels, exports, docs).
  - Do **not** use `G=1` or "natural units" phrasing.
  - When orbital mechanics units matter pedagogically, prefer AU / yr / solar masses with
    `$G = 4\pi^2\ \mathrm{AU}^3/(\mathrm{yr}^2 M_\odot)$`.

### Math authoring: KaTeX, never Unicode

**Every equation, symbol, unit and operator that a reader sees is authored as LaTeX and
rendered by KaTeX. Unicode math glyphs are not acceptable in rendered text.**

Not `θ`, `λ`, `M☉`, `π`, `°`, `×`, `−`, `≈`, `∝`, `∞`, `²`, `₁`, `′`, `µ` — write
`$\theta$`, `$\lambda$`, `$M_\odot$`, `$\pi$`, `$^{\circ}$`, `$\times$`, `$-$`,
`$\approx$`, `$\propto$`, `$\infty$`, `$^2$`, `$_1$`, `$\prime$`, `$\mu$`.

Why it matters here and not everywhere: a Unicode glyph inherits whatever the surrounding
CSS does to it. On 2026-09-05, 94 KaTeX nodes across 14 demos were being uppercased by an
inherited `text-transform`, turning frequency `$\nu$` into "N" and mean molecular weight
`$\mu$` into "M" -- different physical quantities, silently, with every test green. Real
math nodes can be checked; a stray `θ` in a string cannot.

**Where the rule applies**

| Surface | Rule |
|---|---|
| Demo HTML, site pages, components, layouts, authored content | LaTeX only. Enforced by `scripts/validate-math-formatting.mjs`, which fails the build. |
| Markdown bodies (`src/content/**/*.md`) | Typeset at build by remark-math + rehype-katex. Display math must be fenced — `$$` alone on the lines above and below; single-line `$$…$$` renders INLINE (the validator rejects it). Frontmatter and `.astro` pages still use client auto-render, where `$$` is display. |
| Astro/TS that emits reader-visible strings | LaTeX only. Render it with `renderInlineMath()` from `apps/site/src/lib/inlineMath.ts` (build-time KaTeX, no client JS) or `renderMath()` from `@cosmic/runtime` in the demos. |
| Canvas 2D / uPlot axis labels | The one exemption -- KaTeX cannot render into a canvas. Use ASCII (`lambda`, `deg`, `M_sun`), never Unicode. |
| `packages/physics` comments and test names | Not scanned today; the maths there is documentation, not rendered output. Prefer ASCII in new code. |

**Adding a new reader-visible surface?** Add its directory to `SCAN_ROOTS` in
`scripts/validate-math-formatting.mjs`. The site's own pages, components, layouts and lib
were missing from that list until 2026-09-10, which is how a `×` reached a filter chip.

**Notation defaults**
- Inline math `$...$`; display math `$$...$$`, fenced on its own lines in Markdown.
- Solar notation: `$L/L_{\odot}$`, `$R/R_{\odot}$`, `$T_{\rm eff}$`.
- Powers of ten as `$10^n$`; no `e` notation in teaching-facing copy.

### WebGL demos (three.js)

`three` is a dependency of `apps/demos`, used by `cluster-census` (`clusterScene.ts`) and
available to any demo that needs real 3-D. Vite code-splits it, so only demos that import
it pay the ~130 KB gzipped. Conventions, learned the hard way:

- **Never call `requiredContext2d` on a canvas you intend to render WebGL into.** Asking a
  canvas for a 2-D context permanently forecloses getting a WebGL one from it.
- **Stack a 2-D overlay canvas** over the WebGL one for anything needing text (scale bars,
  labels) and for one-off shapes like selection rings.
- **Return `null` rather than throwing** when the renderer cannot be created. Scenes are
  built at module scope, so a throw takes the whole demo down; a reader without WebGL
  should lose one panel.
- **Publish camera state as `data-` attributes** on the overlay. The WebGL buffer is not
  preserved, so `readPixels` returns nothing and E2E has no other way to assert that the
  view actually moved.
- Point-sprite size attenuation and `OrbitControls` zoom both have scene-scale traps; see
  the notes in `docs/reviews/2026-09-04-novascope-port-survey.md`.

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

## Agent skills, reviewer roles and hooks

One copy in the repo, shared by Claude and Codex.

- **Skills** live in `.agents/skills/` (Codex's repo path); `.claude/skills` is a symlink to it. Every skill
  starts from `.agents/references/invariants.md`. Skills: `cosmic-site-content`,
  `cosmic-instructor-materials`, `cosmic-ui`, `cosmic-demo-contracts`, `cosmic-physics`, `cosmic-a11y`,
  `cosmic-verification`, `cosmic-readiness`, `cosmic-adversarial-review`. In Codex, invoke with `$cosmic-...`.
- **Reviewer roles** are written once in `.agents/roles/` and wrapped by `.claude/agents/` and
  `.codex/agents/`: `physics-reviewer`, `adversarial-reviewer`, `visual-ux-reviewer`, `readiness-auditor`.
  Run at most one reviewer agent at a time.
- **Hooks** (`scripts/agent-hooks/`, wired in `.claude/settings.json` and `.codex/hooks.json`) block
  `git add -A` / `git add .`, staging `.gitignore`, `git commit -a`, force pushes, `--no-verify` and a second
  concurrent Playwright run; report math-formatting problems in files just edited; and remind about
  STATUS.md at stop. Codex asks you to trust project hooks once via `/hooks`.
- **Commands** (Claude): `/cp-gates`, `/cp-audit-demo <slug>`, `/cp-promote <slug>`, `/cp-fix <finding>`.
  `corepack pnpm gates [names]` runs every gate in order with exit codes, for either agent.
- Superpowers process skills (`superpowers:writing-plans`, `superpowers:executing-plans`,
  `superpowers:systematic-debugging`, `superpowers:test-driven-development`) remain available where installed.

## Communication mode (explanatory default)

- Give educational, repo-specific explanations while completing tasks.
- Before and after non-trivial code changes, include a concise insight block in chat (never in repo files unless asked):
  - `` `★ Insight ─────────────────────────────────────` ``
  - 2-3 points tied to this codebase and the current change (choices, tradeoffs, invariants — not generic trivia)
  - `` `─────────────────────────────────────────────────` ``

## Playwright QA (Kepler's Laws)

- Capture QA screenshots for `keplers-laws` under `output/playwright/`, from `http://127.0.0.1:4173/cosmic-playground/play/keplers-laws/` (preview: `corepack pnpm -C apps/site preview --host 127.0.0.1 --port 4173`).
- Use MCP Playwright first; if it fails (e.g. `net::ERR_BLOCKED_BY_CLIENT`), fall back to CLI `@playwright/test` (no test files required).
- Required captures: default view; Newton mode with vectors on; equal areas on; 201 unit system; Jupiter or High-e preset.

<!-- brain-status-convention -->
## Brain status updates
When you make notable progress, hit a blocker, or set the next action, update this repo's `STATUS.md` (`next:` / `blocker:` / `due:` lines) — the brain pulls it into the portfolio dashboard + standup via `federate.py` (see `~/brain/work/meta/status-convention.md`). Brain stays pull-only: never hand-edit `~/brain`; capture events with `brain "…"`.
