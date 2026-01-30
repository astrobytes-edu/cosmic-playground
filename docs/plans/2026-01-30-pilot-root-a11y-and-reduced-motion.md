# Pilot Root A11y + Reduced Motion Gates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce two pragmatic pilot-quality requirements: the instrument root has an accessible name, and the exemplar demo respects `prefers-reduced-motion`.

**Architecture:** Add a build-time HTML gate in `scripts/validate-play-dirs.mjs` to require `#cp-demo` has an accessible name (prefer `aria-label`, allow `aria-labelledby`). Add a Playwright E2E test for `binary-orbits` that runs with reduced motion and asserts the demo does not start a continuous `requestAnimationFrame` loop.

**Tech Stack:** Node build script, Playwright, pnpm build.

---

### Task 0: Commit this plan

**Files:**
- Create: `docs/plans/2026-01-30-pilot-root-a11y-and-reduced-motion.md`

**Step 1: Commit**

Run:
```bash
git add docs/plans/2026-01-30-pilot-root-a11y-and-reduced-motion.md
git commit -m "docs(plan): add pilot root a11y + reduced motion plan"
```

---

### Task 1: Build-time gate for `#cp-demo` accessible name

**Files:**
- Modify: `scripts/validate-play-dirs.mjs`
- Modify: `docs/specs/cosmic-playground-authoring-kit-spec.md`
- Modify: `docs/specs/cosmic-playground-pilot-quality-bar.md`

**Step 1: Implement build validator check**

For every built `apps/site/public/play/<slug>/index.html`:
- locate the start tag containing `id="cp-demo"`
- fail if it contains neither:
  - `aria-label="..."`
  - `aria-labelledby="..."`

**Step 2: Update Authoring Kit spec**

In the “Demo shell contract (required)” section, add that `#cp-demo` must have an accessible name (`aria-label` recommended).

**Step 3: Update pilot quality bar spec**

Under “Enforceable checks (v1)”, document the new build-time gate.

**Step 4: Run build**

Run: `corepack pnpm build`

Expected: PASS; if broken, validator prints offending slug(s).

**Step 5: Commit**

Run:
```bash
git add scripts/validate-play-dirs.mjs docs/specs/cosmic-playground-authoring-kit-spec.md docs/specs/cosmic-playground-pilot-quality-bar.md
git commit -m "build+docs: require accessible name on instrument root"
```

---

### Task 2: E2E reduced-motion gate for the pilot demo (`binary-orbits`)

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`
- Modify: `docs/specs/cosmic-playground-pilot-quality-bar.md`

**Step 1: Write a failing Playwright test**

Add a Playwright test that:
- sets `reducedMotion: "reduce"` before page load
- installs an init script that wraps `requestAnimationFrame` to increment a counter on `window`
- loads `play/binary-orbits/`
- waits ~300ms
- asserts `requestAnimationFrame` was not called repeatedly (e.g., `count <= 1`)

**Step 2: Run E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Document enforcement**

Add a bullet to the pilot quality bar “Playwright (E2E)” section that reduced-motion behavior is enforced for the exemplar demo.

**Step 4: Commit**

Run:
```bash
git add apps/site/tests/smoke.spec.ts docs/specs/cosmic-playground-pilot-quality-bar.md
git commit -m "test(e2e): enforce reduced-motion behavior for pilot demo"
```

---

### Task 3: Verify and push

**Step 1: Build**

Run: `corepack pnpm build`

Expected: PASS.

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Push**

Run: `git push origin main`

