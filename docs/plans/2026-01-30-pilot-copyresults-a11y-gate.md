# Pilot Copy Results A11y Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add one more pragmatic “pilot demo quality bar” enforcement: Copy Results must be a real button (build-time) and keyboard-activatable in the pilot demo (E2E).

**Architecture:** Extend the existing build validator (`scripts/validate-play-dirs.mjs`) with a stricter check for `#copyResults` (must be a `<button type="button">`). Add a Playwright test for the exemplar demo (`binary-orbits`) that tabs to the Copy Results button and triggers export via keyboard, asserting the status updates and clipboard capture works.

**Tech Stack:** Node build script, Playwright, pnpm build.

---

### Task 0: Commit this plan

**Files:**
- Create: `docs/plans/2026-01-30-pilot-copyresults-a11y-gate.md`

**Step 1: Commit**

Run:
```bash
git add docs/plans/2026-01-30-pilot-copyresults-a11y-gate.md
git commit -m "docs(plan): add pilot copy-results a11y gate plan"
```

---

### Task 1: Enforce `#copyResults` is a `<button type="button">` (build-time)

**Files:**
- Modify: `scripts/validate-play-dirs.mjs`

**Step 1: Implement the check**

For every built `apps/site/public/play/<slug>/index.html`:
- locate the start tag that contains `id="copyResults"`
- fail if:
  - the start tag is not a `<button ...>`
  - OR it is missing `type="button"`

**Step 2: Run build**

Run: `corepack pnpm build`

Expected: PASS; if broken, validator prints the offending slug(s) and missing conditions.

**Step 3: Commit**

Run:
```bash
git add scripts/validate-play-dirs.mjs
git commit -m "build: enforce copy results button semantics"
```

---

### Task 2: Add a keyboard activation E2E test for the pilot demo

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write a failing test**

Add a Playwright test (binary-orbits only) that:
- stubs `navigator.clipboard.writeText` and captures the last text
- visits `play/binary-orbits/`
- uses `page.keyboard.press("Tab")` until `#copyResults` is focused
- presses `Enter` (or `Space`) to activate
- asserts:
  - `#status` contains “Copied”
  - captured clipboard text contains `Timestamp:` and `(v1)`

**Step 2: Run**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Commit**

Run:
```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test(e2e): require keyboard copy for pilot demo"
```

---

### Task 3: Document enforcement in the pilot quality bar spec

**Files:**
- Modify: `docs/specs/cosmic-playground-pilot-quality-bar.md`

**Step 1: Update “Enforceable checks (v1)”**

Document:
- build-time: `#copyResults` must be `<button type="button">`
- E2E: pilot demo copy is keyboard-activatable

**Step 2: Commit**

Run:
```bash
git add docs/specs/cosmic-playground-pilot-quality-bar.md
git commit -m "docs: document copy-results a11y enforcement"
```

---

### Task 4: Verify and push

**Step 1: Build**

Run: `corepack pnpm build`

Expected: PASS.

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Push**

Run: `git push origin main`

