# Comprehensive Review Handoff Prompt

> **Copy everything below the line into a fresh Claude Code session.**

---

## Task

Run a comprehensive quality review of the Cosmic Playground project. Two sessions just completed a massive hardening effort (2,039 total tests across 69 files, 18 commits pushed to main). I want you to independently verify the work and catch anything that was missed.

**Use these skills in order:**

### Step 1: `/reviewing-project-quality`

Run the full project quality audit skill. This will:
- Gather fresh test metrics from all 4 layers (physics, theme, demo, E2E)
- Grep for any remaining legacy patterns (`cp-action`, `--cp-warning`, `--cp-accent2`, `--cp-accent3`)
- Grade all 5 categories (test coverage, design system, physics correctness, accessibility, architecture)
- Write a dated review to `docs/reviews/`
- Create a prioritized backlog of anything remaining

**Key numbers to verify against (from prior session):**
- Physics: 144 tests (18 files)
- Theme: 109 tests (3 files)
- Demo unit: 1,203 tests (32 files)
- E2E: 583 passed + 38 skipped (16 spec files)
- Grand total: 2,039 tests

### Step 2: Spot-check recent changes

The most recent commits added:
1. `aria-pressed` on chip buttons in 4 demos (conservation-laws, seasons, eclipse-geometry, keplers-laws)
2. `aria-live="assertive"` on challenge feedback div in `packages/runtime/src/challengeEngine.ts`
3. Cross-demo accessibility E2E spec (`apps/site/tests/accessibility.spec.ts` — 89 tests)
4. Moon-phases logic.ts extraction (59 tests, refactored main.ts to import from logic.ts)
5. Keplers-laws logic test expansion (5 → 25 tests)

For each, verify:
- The code change is correct and complete
- Tests actually test what they claim
- No regressions were introduced
- The refactoring didn't change behavior

### Step 3: Architecture gap analysis

Check for these specific patterns across all 14 demos:

**Every demo should have:**
- [ ] `logic.ts` with pure functions (humble object pattern)
- [ ] `logic.test.ts` with comprehensive tests
- [ ] `design-contracts.test.ts` with token/structure assertions
- [ ] Dedicated E2E spec in `apps/site/tests/<slug>.spec.ts`
- [ ] `aria-pressed` or `aria-checked` on all toggle/chip buttons
- [ ] `aria-live` on status regions
- [ ] `prefers-reduced-motion` check (if demo has animation)
- [ ] Starfield canvas with `aria-hidden="true"`
- [ ] All readout units in `.cp-readout__unit` spans

**Cross-cutting checks:**
- [ ] Zero legacy `cp-action` components anywhere
- [ ] Zero `--cp-warning`, `--cp-accent2`, `--cp-accent3` tokens in demo code
- [ ] All physics imports from `@cosmic/physics` (no inline equations)
- [ ] Challenge feedback div has `aria-live="assertive"` (in runtime)
- [ ] Build passes with no warnings
- [ ] E2E accessibility spec covers all 14 demos

### Step 4: Report

After all checks, produce:
1. A summary table of what passed and what needs attention
2. Updated quality grade if anything changed
3. Specific actionable items for any gaps found (with file paths and line numbers)

## Context

- All 14 demos: angular-size, binary-orbits, blackbody-radiation, conservation-laws, eclipse-geometry, em-spectrum, eos-lab, keplers-laws, moon-phases, parallax-distance, planetary-conjunctions, retrograde-motion, seasons, telescope-resolution
- Previous grade: A+ (100/100)
- CLAUDE.md and MEMORY.md have full project context
- Physics reviews completed for all 14 demos (in `docs/reviews/`)
- The `accessibility.spec.ts` is new — verify it's thorough enough
