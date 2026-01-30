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

---

## Task 6: Define the “pilot demo quality bar” + add enforcement

**Files:**
- Create: `docs/specs/cosmic-playground-pilot-quality-bar.md`

**Step 1: Write the pilot quality bar spec**

Add a checklist for an exemplar demo (v1 pragmatic):
- A11y + keyboard: labeled controls, visible focus, status region for copy, no keyboard traps
- Theming: no hardcoded colors; stage + UI respects theme tokens/CSS variables
- Export behavior: typed export payload with stable clipboard text format (see Task 7)
- Model notes: brief assumptions + limitations; “what to notice” present
- Performance: smooth on typical laptops; no layout thrash; lightweight stage
- Mobile layout: controls/readouts usable at narrow widths; stage scales (no horizontal scroll)

If any item deviates from `docs/specs/cosmic-playground-site-spec.md`, add a short **Spec Deviations** note in this new spec.

**Step 2: Commit**

Run:
```bash
git add docs/specs/cosmic-playground-pilot-quality-bar.md
git commit -m "spec: define pilot demo quality bar checklist"
```

---

## Task 7: Tighten the export-results standard in `@cosmic/runtime`

**Files:**
- Modify: `packages/runtime/src/index.ts`
- Modify: `apps/demos/src/demos/moon-phases/main.ts`
- Modify: `apps/demos/src/shared/stub-demo.ts`

**Step 1: Define explicit export types + stable clipboard format**

In `packages/runtime/src/index.ts`, introduce:
- `ExportRow` (name/value, optional note)
- `ExportPayloadV1` (version marker, timestamp, parameters/readouts/notes)
- `formatExportText()` that produces stable headings + row lines

Keep a small shim for the existing `ExportResults` shape (records) so existing demos can be migrated gradually.

**Step 2: Update callsites**

Update `moon-phases` and `stub-demo` to call `runtime.copyResults()` with the new payload shape (using arrays for ordering).

**Step 3: Run**

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: PASS; Playwright export test should fail meaningfully if formatting changes.

**Step 4: Commit**

Run:
```bash
git add packages/runtime/src/index.ts apps/demos/src/demos/moon-phases/main.ts apps/demos/src/shared/stub-demo.ts
git commit -m "feat(runtime): define typed export payload and stable clipboard format"
```

---

## Task 8: Make station cards optionally demo-driven (keep v0.1 compatibility)

**Files:**
- Modify: `apps/site/src/content/config.ts`
- Modify: `apps/site/src/pages/stations/[slug].astro`
- Modify: `apps/site/src/content/demos/binary-orbits.md`

**Step 1: Extend demos content schema**

Add optional `station_params` to the `demos` collection:
```ts
station_params: z
  .array(z.object({ parameter: z.string().min(1), value: z.string().min(1), notice: z.string().min(1) }))
  .optional()
```

**Step 2: Render real rows when provided**

In `apps/site/src/pages/stations/[slug].astro`, render:
- `entry.data.station_params` rows if present and non-empty
- Otherwise fall back to the existing placeholder rows

**Step 3: Add starter rows for binary-orbits**

Update `apps/site/src/content/demos/binary-orbits.md` to include 1–2 suggested parameter rows aligned to the migrated demo controls.

**Step 4: Run**

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: PASS.

**Step 5: Commit**

Run:
```bash
git add apps/site/src/content/config.ts apps/site/src/pages/stations/[slug].astro apps/site/src/content/demos/binary-orbits.md
git commit -m "feat(site): render station parameter rows from demo metadata"
```

---

## Task 9: Migrate `binary-orbits` from stub → real (new export + pilot bar)

**Files:**
- Modify: `apps/demos/src/demos/binary-orbits/index.html`
- Modify: `apps/demos/src/demos/binary-orbits/main.ts`
- Modify: `apps/demos/src/demos/binary-orbits/style.css`
- Modify: `apps/site/src/content/demos/binary-orbits.md`

**Step 1: Replace stub UI with a minimal “real” instrument**

Implement:
- Stage: canvas animation of two bodies orbiting a barycenter
- Controls: 1–2 inputs (e.g., mass ratio and separation)
- Readouts: at least 2 values (e.g., barycenter offset, period; optionally speed)
- Model notes: assumptions/limitations; “what to notice” in readouts panel
- Export: `Copy results` uses `@cosmic/runtime` new export payload

Constraints:
- No hardcoded colors; use CSS variables/tokens in CSS + canvas theme lookup
- Keep required instrument markers: `#cp-demo`, `#copyResults`, `#status`, `.cp-demo__drawer`

**Step 2: Run**

Run:
```bash
corepack pnpm build
corepack pnpm -C apps/site test:e2e
```

Expected: PASS; pilot export test passes for `binary-orbits`.

**Step 3: Commit**

Run:
```bash
git add apps/demos/src/demos/binary-orbits/index.html apps/demos/src/demos/binary-orbits/main.ts apps/demos/src/demos/binary-orbits/style.css apps/site/src/content/demos/binary-orbits.md
git commit -m "feat(demo): migrate binary-orbits to pilot-quality instrument"
```

---

## Task 10: Final verification + push (after Tasks 6–9)

**Step 0: Add an enforceable automated check**

Add a Playwright test that asserts a pilot-quality export on `binary-orbits`:
- Click “Copy results”
- Assert the UI status becomes “Copied…”
- Assert the exported text contains:
  - A fixed header including an export version marker
  - `Timestamp:` line
  - `Parameters:` and `Readouts:` sections
  - At least 2 readout lines

Implementation approach: add an init script to stub `navigator.clipboard.writeText` and capture the last copied string to `window.__cpLastClipboardText`.

Commit:
```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test(e2e): enforce pilot-quality export for binary-orbits"
```

**Step 1: Full build**

Run: `corepack pnpm build`

Expected: PASS.

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS.

**Step 3: Push**

Run: `git push origin main`
