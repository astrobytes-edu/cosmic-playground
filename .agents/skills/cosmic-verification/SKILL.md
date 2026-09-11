---
name: cosmic-verification
description: Use before claiming any Cosmic Playground change works, is fixed or is ready to land — how to run the gates, write a test that genuinely fails first, measure what the page actually renders, avoid false greens, report evidence, and commit and push safely.
---

# Cosmic verification

A green suite is not evidence until you know what it checked. Read `.agents/references/invariants.md`.

## Gates

- `corepack pnpm gates` runs lint, typecheck, unit tests, build and E2E in order, capturing each exit
  code, and exits non-zero if any fail. Individually:
  `corepack pnpm lint` · `corepack pnpm -r typecheck` · `corepack pnpm test` · `corepack pnpm build` ·
  `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`.
- Capture exit codes directly: `cmd > log 2>&1; echo EXIT=$?` — never through a pipe.
- Never start a second Playwright run while one is running: they share port 4321 and `test-results/` is
  wiped at start. E2E serves the built `dist/`, so rebuild after source changes.
- Targeted: `corepack pnpm -C packages/physics exec vitest run src/<file>.test.ts`;
  `corepack pnpm -C apps/demos exec vitest run src/demos/<slug>`; Playwright with a spec path.
- `lint` stops at the first failing step (biome) and hides the rest; biome's `--max-diagnostics=10` can
  hide the one error among warnings — rerun with `--diagnostic-level=error`.

## Tests that prove something

- **RED first, on assertions.** "Tests  no tests" means the file failed to load (e.g. `it` in a file that
  imports `test`); that is not a RED. To RED a fix already written, run the new test against the old file
  (`git show HEAD:path > path`, run, restore).
- **Read assertions, not names.** Tests here have encoded the defect (asserting `style.display === "none"`,
  gating on an id that never exists).
- `toBeVisible()` is about rendering, not being on screen. `getBoundingClientRect()` is not a visibility
  test (closed `<details>` still has a box); use `checkVisibility()`.
- **Reflow:** `scrollTo(2000, 0)` then `scrollX > 0`, and name the widest element not inside a clipped or
  scrolling ancestor. `documentElement.scrollWidth` counts overflow that is already contained.
- **Load-sensitive timeouts:** measure idle and under a stressor (full E2E alongside), set the timeout
  from the measurement, and RED it under that load.
- Visual baselines exist only for darwin; CI runs Linux with different system fonts.
- A verification that checks the content but not the mode is incomplete: 1,495 TeX strings matched while
  80 display equations rendered inline.

## Evidence in reports

- Numbers and commands: `E2E_EXIT=0, 1,147 passed, 0 failed`; before/after measurements; file:line.
- Say what was not checked. Never "should work", "successfully", or a claim from memory.
- Search-engine and subagent summaries are leads, not facts; confirm against the primary source.

## Commit and land

- Branch `codex/<topic>` from `main`; stage explicit paths; never `git add -A` or a local `.gitignore`.
- Message: what changed, why, and the measured evidence; end with the agent's co-author trailer.
- Land: `git checkout main && git pull --ff-only && git merge --ff-only <branch>`, gates, `git push`.
- Pushing to `main` cancels an in-progress deploy (`deploy.yml` concurrency). Check
  `gh run list --branch main` filtering on `headSha`; a short listing can surface an old run.
- Update `STATUS.md` (`next:`, `blocker:`, `due:`) when progress is made.

## Red flags — stop

- Claiming a fix without a test that failed before it.
- A background gate still running while you edit specs or start another Playwright run.
- Reporting a count you did not just measure.
