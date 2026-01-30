# Pilot A11y Build Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add one pragmatic, enforceable accessibility gate for demos (live-region status for export) and align docs/specs to reference the pilot quality bar.

**Architecture:** Extend the existing build-time validator (`scripts/validate-play-dirs.mjs`) to verify the `#status` element is a real live region (`role="status"` + `aria-live="polite"`) in built `/play/<slug>/index.html`. Update specs to reference the pilot quality bar and to document the stricter contract where relevant.

**Tech Stack:** Node build script, Markdown specs, pnpm build, Playwright E2E.

---

### Task 0: Commit this plan

**Files:**
- Create: `docs/plans/2026-01-30-pilot-a11y-build-gate.md`

**Step 1: Commit**

Run:
```bash
git add docs/plans/2026-01-30-pilot-a11y-build-gate.md
git commit -m "docs(plan): add pilot a11y build gate plan"
```

---

### Task 1: Add build-time a11y gate for `#status` live region

**Files:**
- Modify: `scripts/validate-play-dirs.mjs`

**Step 1: Add a failing check (conceptual)**

Implement a check that, for every built `apps/site/public/play/<slug>/index.html`:
- finds the start tag for the element with `id="status"`
- fails if that tag does not also include:
  - `role="status"`
  - `aria-live="polite"`

**Step 2: Run the validator via build**

Run: `corepack pnpm build`

Expected: PASS and validator prints `OK:`.

**Step 3: Commit**

Run:
```bash
git add scripts/validate-play-dirs.mjs
git commit -m "build: enforce export status live region"
```

---

### Task 2: Reference the pilot quality bar from the Authoring Kit spec

**Files:**
- Modify: `docs/specs/cosmic-playground-authoring-kit-spec.md`

**Step 1: Add a short “definition of done” note**

Add a note that exemplar/pilot demos must meet:
- `docs/specs/cosmic-playground-pilot-quality-bar.md`

Keep this lightweight: just a pointer, not a re-list of the checklist.

**Step 2: Commit**

Run:
```bash
git add docs/specs/cosmic-playground-authoring-kit-spec.md
git commit -m "docs: reference pilot quality bar from authoring kit"
```

---

### Task 3: Align pilot quality bar enforceable checks with the new gate

**Files:**
- Modify: `docs/specs/cosmic-playground-pilot-quality-bar.md`

**Step 1: Update “Enforceable checks (v1)”**

Add that the build-time validator enforces the export status live region attributes on `#status` in built demo HTML.

**Step 2: Commit**

Run:
```bash
git add docs/specs/cosmic-playground-pilot-quality-bar.md
git commit -m "docs: document build-time live-region gate"
```

---

### Task 4: Verify build + e2e, then push

**Step 1: Build**

Run: `corepack pnpm build`

Expected: PASS.

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Push**

Run: `git push origin main`
