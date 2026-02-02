<INSTRUCTIONS>
## Cosmic Playground (monorepo) agent notes

### Superpowers system

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.

Before starting work, run:
`~/.codex/superpowers/.codex/superpowers-codex bootstrap`

When a relevant skill exists for the task, you must load it via:
`~/.codex/superpowers/.codex/superpowers-codex use-skill <skill-name>`
</EXTREMELY_IMPORTANT>

### Skill catalog (recommended for this repo)

Skills are stored in `~/.codex/skills/` (personal) and `~/.codex/superpowers/skills/` (process).

Load a skill:
`~/.codex/superpowers/.codex/superpowers-codex use-skill <skill-name>`

Process skills (how to work):
- `superpowers:writing-plans` — write a falsifiable plan before coding.
- `superpowers:executing-plans` — execute a written plan with checkpoints.
- `superpowers:systematic-debugging` — root-cause investigation before fixes.
- `superpowers:test-driven-development` — test-first for behavior changes.

Cosmic Playground personal skills (what to enforce):
- `cosmic-spec-to-implementation` — turn specs into PR-sized slices with acceptance + commands.
- `cosmic-astro-site-engineering` — Astro base-path safety + static-first museum pages + KaTeX runtime.
- `cosmic-basepath-smoke-tests` — triage/fix GH Pages base-path regressions across site/content/demos.
- `cosmic-content-authoring` — content schema validity + base-path-safe markdown links + excerpt rules.
- `cosmic-instructor-materials-style` — instructor/station schemas + print-first patterns (no page-local print hacks).
- `cosmic-demo-authoring` — Vite demo + `/play/<slug>/` instrument contract + build/copy pipeline.
- `cosmic-runtime-instrumentation` — shared demo behaviors belong in `packages/runtime` (no per-demo forks).
- `cosmic-theme-tokens-and-components` — token-first styling + centralized print fixes in `packages/theme`.
- `cosmic-ui-ux` — shell consistency + tokens + correctness guardrails (units, D=diameter, d=distance).
- `cosmic-export-contracts` — stable, unit-explicit exports via `@cosmic/runtime` helpers.
- `cosmic-physics-modeling` — explicit units in APIs + tests + no `G=1`.
- `cosmic-accessibility-audit` — keyboard/focus/dialog/live-region/reduced-motion guardrails.
- `cosmic-ux-polish-pass` — demo-by-demo polish without new systems/deps or shared drift.

### Python environment (conda)

- When running Python for this repo (including skill tooling like `quick_validate.py` / `package_skill.py`), use the Conda env `astro` (it includes `pyyaml`).
- Prefer non-interactive invocation so commands are reproducible without `conda activate`:
  - `conda run -n astro python <script.py> ...`
- If a Python command fails due to a missing module, call out the exact missing package and the install command for the `astro` env (do not silently work around it).

### Repo goals
- Treat `docs/specs/cosmic-playground-site-spec.md` as the contract.
- Prefer static + fast pages; minimal client JS on museum pages.
- Use `pnpm` workspace.
- Demos build into `apps/demos/dist/<slug>/` and are copied to `apps/site/public/play/<slug>/`.
- GitHub Pages deploy targets the Astro build output from `apps/site/`.

### Conventions
- Use `import.meta.env.BASE_URL` for internal site links/asset URLs (GitHub Pages base path support).
- Instructor pages are public; optionally `noindex` and omitted from primary nav.

### Verification / base path
- Primary gates:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (or leave `CP_BASE_PATH` unset)
- If Playwright is failing due to base paths, check `CP_BASE_PATH` first; an empty/incorrect value can cause `/explore/` and `/play/<slug>/` routes to 404 in e2e.

### Demo pipeline (important)
- Source: `apps/demos/src/demos/<slug>/` (Vite + TS)
- Build output: `apps/demos/dist/<slug>/`
- Site-served copies: `apps/site/public/play/<slug>/` (copied during `corepack pnpm build`)

### Units policy (important)
- Keep units explicit and consistent across UI labels, exported results, and docs.
- Do **not** introduce `G=1` or “natural units” language. When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with `G = 4π² AU³/(yr²·M☉)`.

### Symbol / notation policy (important)
- When using single-letter symbols in **UI copy**, **model notes**, **exports**, or **docs**:
  - **D** = physical **diameter**
  - **d** = **distance**
- Do **not** reuse **D**/**d** for other distances (e.g., use `dEarthMoonKm`, `distanceToSunKm`, etc.).
</INSTRUCTIONS>
