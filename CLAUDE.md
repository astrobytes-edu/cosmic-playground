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
- `packages/runtime/`: Shared demo runtime (Station Mode, Challenge Mode, export helpers, etc.)
- `packages/theme/`: Shared tokens and demo shell styles

## Demo build/copy pipeline

- Vite builds demos to `apps/demos/dist/<slug>/`
- `corepack pnpm build` copies those outputs to `apps/site/public/play/<slug>/`
- `/play/<slug>/` pages on the site are served from `apps/site/public/play/<slug>/`

## Legacy demo reference (important)

- Legacy demos live at: `~/Teaching/astr101-sp26/demos/`
- Migration hardening directive: treat migrated demos as untrusted; refactor and harden them one-by-one starting with `moon-phases` by comparing behavior, UX, and physics against the legacy demo.

## Hard constraints / conventions

- Prefer static + fast pages; minimal client JS on museum pages.
- Use `import.meta.env.BASE_URL` for internal links/asset URLs (GitHub Pages base path support).
- Keep units explicit and consistent everywhere (UI labels, exports, docs).
  - Do **not** use `G=1` or “natural units” phrasing.
  - When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with `G = 4π² AU³/(yr²·M☉)`.

## Suggested workflow when migrating demos

1. Port legacy physics into `packages/physics/` as pure TS + Vitest coverage.
2. Implement the instrument UI in `apps/demos/src/demos/<slug>/` using `@cosmic/runtime` (Station/Challenge/Export).
3. Update `apps/site/src/content/demos/<slug>.md` (and station/instructor content if needed) so docs match the shipped controls/units.
4. Keep gates green: `corepack pnpm build` and Playwright e2e.
