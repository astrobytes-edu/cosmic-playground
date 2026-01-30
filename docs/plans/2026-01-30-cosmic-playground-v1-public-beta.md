# Cosmic Playground v1 (Public Beta) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Ship the v1 “Public Beta” scope from `docs/specs/cosmic-playground-roadmap.md` on top of Site Spec v0.1, without migrating additional legacy demos yet.

**Architecture:** Keep Astro pages static and fast; keep demos as Vite multi-page apps copied into `apps/site/public/play/<slug>/`. Enforce an “instrument standard” via build-time quality gates plus Playwright smoke tests.

**Tech Stack:** pnpm workspace, Astro (static), Vite (multi-page), TypeScript, Playwright.

## Spec Reference

- Site contract: `docs/specs/cosmic-playground-site-spec.md` (v0.1 in this repo)
- v1 scope: `docs/specs/cosmic-playground-roadmap.md` (v1 “Public Beta” section)

## Task 1: Add v1 “Authoring Kit” quality gates

**Files:**
- Modify: `scripts/validate-play-dirs.mjs`

**Step 1: Extend validator to enforce the instrument contract**

Implement these checks:

1. **Content → play artifacts must exist** (already present)
2. **Instrument shell markers must exist in built HTML**:
   - `id="cp-demo"`
   - `id="copyResults"`
   - `id="status"`
   - `cp-demo__drawer` (model notes region)
3. **Demo folders must have metadata**:
   - For every folder under `apps/demos/src/demos/<slug>/`, require a corresponding content entry in `apps/site/src/content/demos/<slug>.md` (or `.mdx`)

**Step 2: Run the validator after a build**

Run: `corepack pnpm build`

Expected: validator prints `OK:` and exits 0.

**Step 3: Commit**

Run:
```bash
git add scripts/validate-play-dirs.mjs
git commit -m "build: enforce demo quality gates"
```

---

## Task 2: Bring the pilot demo up to “exemplar quality bar”

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/main.ts`

**Step 1: Remove hardcoded theme colors in the canvas**

Replace literal hex/rgba strings with values derived from CSS variables (read from `getComputedStyle(document.documentElement)`), so the pilot respects `packages/theme/styles/tokens.css`.

**Step 2: Verify behavior**

Run: `corepack pnpm -C apps/demos dev`

Expected: no console errors; canvas renders; copy results works.

**Step 3: Commit**

Run:
```bash
git add apps/demos/src/demos/moon-phases/main.ts
git commit -m "feat(demo): align moon-phases colors with theme tokens"
```

---

## Task 3: Add Playwright smoke tests (Public Beta requirement)

**Files:**
- Modify: `apps/site/package.json`
- Create: `apps/site/playwright.config.ts`
- Create: `apps/site/tests/smoke.spec.ts`

**Step 1: Add Playwright dependencies + scripts**

Add dev deps:
- `@playwright/test`

Add scripts:
- `test:e2e`: run Playwright tests

**Step 2: Configure Playwright webServer**

Use Astro preview as the server:
- Command: `pnpm -C apps/site preview --host 127.0.0.1 --port 4321`
- Base path: `/cosmic-playground/` (project-site base)

**Step 3: Write smoke tests**

Test cases:
1. `/explore/` renders and shows at least 1 demo card.
2. For every demo slug in `apps/site/src/content/demos/`, `/play/<slug>/` loads and contains `#cp-demo`.
3. Fail if the page logs console errors (except for known benign warnings; keep allowlist empty at v1).

**Step 4: Run**

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: all tests pass locally.

**Step 5: Commit**

Run:
```bash
git add apps/site/package.json apps/site/playwright.config.ts apps/site/tests/smoke.spec.ts
git commit -m "test(e2e): add Playwright smoke coverage for museum + demos"
```

---

## Task 4: Run Playwright in CI before deploy

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Step 1: Add Playwright install + test step**

Add steps after build:
- Install browsers: `corepack pnpm -C apps/site exec playwright install --with-deps`
- Run tests: `corepack pnpm -C apps/site test:e2e`

**Step 2: Commit**

Run:
```bash
git add .github/workflows/deploy.yml
git commit -m "ci: run Playwright smoke tests before deploy"
```

---

## Task 5: Final verification + push

**Step 1: Full build**

Run: `corepack pnpm build`

Expected: Astro build succeeds, validator passes.

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Push**

Run: `git push`

