# Premium Motion (anime.js) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add “premium” motion polish to a demo using an animation library, while respecting `prefers-reduced-motion`, staying consistent with the shared theme, and avoiding per-demo animation systems.

**Architecture:** Put the animation implementation in `@cosmic/runtime` alongside the existing `initDemoPolish()` utilities. Demos opt-in by adding lightweight `data-*` markers to elements (reusable across demos). The runtime reads motion tokens from `packages/theme/styles/tokens.css` at runtime via CSS variables so motion matches the shared look/feel.

**Tech Stack:** Vite (demos), pnpm workspace, `@cosmic/runtime` polish layer, `animejs` (ESM), CSS tokens (`--cp-duration-enter`, `--cp-ease-out`, `--cp-stagger`).

---

### Task 1: Add the animation dependency to the shared runtime

**Files:**
- Modify: `packages/runtime/package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Add dependency**
- Add `animejs` to `dependencies` in `packages/runtime/package.json`.

**Step 2: Verify dependency resolution**
- Run: `corepack pnpm -r typecheck`
- Expected: `@cosmic/runtime` typecheck passes.

---

### Task 2: Implement reusable “enter motion” in `@cosmic/runtime` polish

**Files:**
- Modify: `packages/runtime/src/polish.ts`

**Step 1: Add a reusable marker contract**
- Add a new initializer `initEnterMotion(root?: Document|Element)` that:
  - Resolves the demo root via the existing `resolveDemoRoot()`.
  - Skips entirely when `prefersReducedMotion()` is true.
  - Selects elements within `#cp-demo` matching `[data-cp-enter]`.
  - Uses `dataset` to avoid double-init (e.g., `data-cp-enter-init="true"`).

**Step 2: Read motion tokens from CSS variables**
- Add helpers that read and parse:
  - `--cp-duration-enter` (fallback e.g. `250ms`)
  - `--cp-ease-out` (fallback e.g. `cubic-bezier(0.16, 1, 0.3, 1)`)
  - `--cp-stagger` (fallback e.g. `50ms`)

**Step 3: Implement animation with `animejs`**
- Import ESM entry (to avoid CJS interop surprises):
  - `import anime from "animejs/lib/anime.es.js";`
- For each element, interpret `data-cp-enter`:
  - `"fade"` → opacity 0 → 1
  - `"up"` → opacity 0 → 1, translateY `12px` → `0`
  - `"down"` / `"left"` / `"right"` similarly
  - `"scale"` → opacity 0 → 1, scale `0.98` → `1`
- Use a single `anime.timeline()` to:
  - Apply `will-change: transform, opacity` before animating.
  - Stagger elements using `--cp-stagger`.
  - Clear `will-change` when complete.

**Step 4: Make it safe by default**
- If the marker exists but `animejs` throws (or a node is not an `HTMLElement`), swallow errors (same “polish must never break a demo” stance as existing polish).

**Step 5: Wire into the existing polish pipeline**
- Call `initEnterMotion(root)` from `initDemoPolish(root)` so demos that opt in automatically animate when `createInstrumentRuntime()` runs.

---

### Task 3: Opt one demo into premium motion (today’s “stiff” demo)

**Files (pick the demo slug you’re presenting):**
- Modify: `apps/demos/src/demos/<slug>/index.html`

**Step 1: Add `data-cp-enter` markers to shell regions**
- Add markers to existing demo shell regions (reusable pattern):
  - `.cp-demo__controls` → `data-cp-enter="left"`
  - `.cp-demo__stage` → `data-cp-enter="fade"`
  - `.cp-demo__readouts` → `data-cp-enter="right"` (if present)
  - `.cp-demo__drawer` → `data-cp-enter="up"` (if it is visible by default)

**Step 2: Ensure no motion-only meaning**
- Any information conveyed by the animation (e.g. “something changed”) must still be conveyed with text/readouts; animation is purely decorative.

---

### Task 4: Document the reusable marker so other demos can adopt it quickly

**Files:**
- Modify: `docs/specs/cosmic-playground-theme-spec.md`

**Step 1: Add a short “Motion markers” section**
- Document `data-cp-enter` values and the reduced-motion behavior (no animation; final state).
- Emphasize: no per-demo animation code; use the markers + runtime polish.

---

### Task 5: Quick verification (10 minutes max)

**Files:** none (commands only)

**Step 1: Local demo check**
- Run: `corepack pnpm -C apps/demos dev`
- Verify: the opted-in demo has a subtle entrance animation and nothing else breaks.

**Step 2: Reduced motion check**
- In DevTools Rendering settings (or OS setting), enable `prefers-reduced-motion: reduce`.
- Verify: no entrance animation runs; everything still renders immediately and is usable.

**Step 3: Build pipeline check**
- Run: `corepack pnpm build`
- Verify: `scripts/validate-play-dirs.mjs` passes and site build completes.

