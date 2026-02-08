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
- `cosmic-frontend` — high-quality frontend implementation for Cosmic Playground with contract-safe UX, flexible layout composition, and non-generic visual direction.
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
- Treat `docs/specs/cosmic-playground-data-contract.md` as the contract for data-heavy demos (Wave 3+).
- Treat `docs/specs/cosmic-playground-model-contract.md` as the contract for any physics/model code (scientific correctness + explicit units + required tests).
- Prefer static + fast pages; minimal client JS on museum pages.
- Use `pnpm` workspace.
- Demos build into `apps/demos/dist/<slug>/` and are copied to `apps/site/public/play/<slug>/`.
- GitHub Pages deploy targets the Astro build output from `apps/site/`.

### Conventions
- Use `import.meta.env.BASE_URL` for internal site links/asset URLs (GitHub Pages base path support).
- Instructor pages are public; optionally `noindex` and omitted from primary nav.

### Communication mode (explanatory default)
- Provide educational, repo-specific explanations while completing tasks.
- Before and after non-trivial code changes, include a concise insight block in chat output using this exact wrapper:
  - `` `★ Insight ─────────────────────────────────────` ``
  - 2-3 key educational points tied to this codebase and the current change
  - `` `─────────────────────────────────────────────────` ``
- Explanations should clarify implementation choices, tradeoffs, and invariants (not generic programming trivia).
- Do not put insight blocks inside repo files unless explicitly requested; keep them in conversation output.

### Verification / base path
- Primary gates:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (or leave `CP_BASE_PATH` unset)
  - Optional contract-focused tests:
    - `corepack pnpm test:datasets`
    - `corepack pnpm test:physics-contract`
- If Playwright is failing due to base paths, check `CP_BASE_PATH` first; an empty/incorrect value can cause `/explore/` and `/play/<slug>/` routes to 404 in e2e.

### Playwright QA (Kepler's Laws)
- Always capture QA screenshots for `keplers-laws` under `output/playwright/`.
- Use MCP Playwright first to navigate to:
  - `http://127.0.0.1:4173/cosmic-playground/play/keplers-laws/`
- If MCP fails (e.g., `net::ERR_BLOCKED_BY_CLIENT`), fall back to CLI Playwright via `@playwright/test` (no test files required).
- Ensure preview server is running:
  - `corepack pnpm -C apps/site preview --host 127.0.0.1 --port 4173`
- Required captures:
  - Default view
  - Newton mode with vectors on
  - Equal areas on
  - 201 unit system
  - Preset Jupiter or High e

### Git workflow (solo maintainer friendly)

Goal: keep `main` boring and always-green, even if you’re the only developer.

- Prefer doing work on short-lived branches (e.g. `codex/<topic>`), then landing to `main` once gates pass.
- Two merge directions:
  - **Merge `main` → branch**: update your working branch with the latest `main` (good during development).
  - **Merge branch → `main`**: land the feature on `main` (do this only after running gates).

Suggested “land to main” checklist:

```bash
git checkout main
git pull --ff-only
git merge --ff-only <your-branch>
corepack pnpm build
corepack pnpm -r typecheck
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
git push origin main
```

If `--ff-only` merge fails, it usually means `main` moved. Update your branch from `main` first (and resolve conflicts), re-run gates, then try again.

#### Teaching requirement (when the human is learning Git)

If the user asks “what should I do?” / “is this normal?” / “what branch are we on?”:
- Start by showing state: `git branch --show-current`, `git status -sb`, and a short `git log --oneline --decorate -5`.
- Explain the “why” in plain language (1–2 sentences), then provide the smallest safe command sequence.
- Prefer `--ff-only` for `pull` and `merge` unless the user explicitly wants a merge commit or rebase.
- Never force-push or hard-reset without an explicit user request and a clear “this is destructive” warning.

### Demo pipeline (important)
- Source: `apps/demos/src/demos/<slug>/` (Vite + TS)
- Build output: `apps/demos/dist/<slug>/`
- Site-served copies: `apps/site/public/play/<slug>/` (copied during `corepack pnpm build`)

### Legacy demo reference (important)
- Legacy demos live at: `~/Teaching/astr101-sp26/demos/`
- Migration hardening directive: treat migrated demos as untrusted; refactor and harden them one-by-one starting with `moon-phases` by comparing behavior, UX, and physics against the legacy demo.

### Units policy (important)
- Keep units explicit and consistent across UI labels, exported results, and docs.
- Do **not** introduce `G=1` or “natural units” language. When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with `G = 4π² AU³/(yr²·M☉)`.

### Symbol / notation policy (important)
- When using single-letter symbols in **UI copy**, **model notes**, **exports**, or **docs**:
  - **D** = physical **diameter**
  - **d** = **distance**
- Do **not** reuse **D**/**d** for other distances (e.g., use `dEarthMoonKm`, `distanceToSunKm`, etc.).

### Math formatting policy (important)
- Teaching-facing math formatting defaults:
  - Inline math uses `$...$`.
  - Display equations use `$$...$$`.
- Use proper solar notation in math and labels:
  - `$L/L_{\odot}$`, `$R/R_{\odot}$`, `$T_{\rm eff}$`.
- For powers-of-ten axes/readouts, use exponent notation (`$10^n$`) and avoid `e` notation in teaching-facing copy.
</INSTRUCTIONS>
