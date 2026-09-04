# P0 UI/UX Test Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden the Cosmic Playground test suite and demo/site UI contracts so P0 regressions are caught before completing demos one by one.

**Architecture:** Add fast static contracts where possible, focused Playwright coverage where layout/runtime behavior matters, then make the smallest UI/content fixes needed to turn each red test green. Keep demo completion work out of this pass; this is a guardrail and P0 polish pass.

**Tech Stack:** pnpm workspace, Astro site (`apps/site`), Vite demos (`apps/demos`), Playwright e2e (`apps/site/tests`), Vitest/static contracts (`apps/demos/src/shared`), shared Cosmic theme (`packages/theme`).

---

## Scope

This plan addresses only P0 hardening from `docs/audits/2026-04-25-cosmic-playground-demo-site-audit.md`:

1. Fix the currently failing Explore e2e locator without weakening coverage.
2. Enforce one accessible page-level heading for every demo play page.
3. Make the home page content progressively visible when JavaScript is unavailable.
4. Fix and guard the blackbody mobile shell layout regression.
5. Replace misleading station fallbacks and surface incomplete instructor bundles honestly.
6. Add a final verification gate so demo-by-demo improvement work starts from a stable baseline.

Out of scope:

- Completing weak demos pedagogically.
- Promoting more demos to launch-ready status.
- Adding new major frontend systems or dependencies.
- Rewriting shared shell architecture beyond P0 fixes.

---

## Repo Evidence This Plan Follows

- `docs/specs/cosmic-playground-site-spec.md`: site/demo contract is the source of truth for public museum pages and `/play/<slug>/` routing.
- `docs/specs/cosmic-playground-model-contract.md`: model-facing demos must keep observables and units explicit.
- `apps/site/tests/smoke.spec.ts`: existing route smoke coverage and the current red e2e failure.
- `apps/site/tests/accessibility.spec.ts`: existing accessibility contract patterns for demo roots, labels, utility controls, status regions, and reduced motion.
- `scripts/validate-invariants.mjs`: existing static invariant style for cross-repo contract checks.
- `packages/theme/styles/demo-shell.css`: shared shell mobile stacking rule that demo-specific CSS must not override accidentally.
- `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts`: precedent for demo-specific design contract tests.

---

## TDD Rules For This Plan

- No production/UI code changes before a failing test or reproduced red gate.
- Every task has RED, GREEN, REFACTOR, and VERIFY steps.
- Keep each task small enough to review independently.
- Prefer static tests for static invariants, Playwright for rendered behavior.
- Do not finish demo content in this pass; make incomplete states explicit and non-misleading.
- Do not revert unrelated user work. If untracked/modified demo work is present, adapt around it.

---

## Task 0: Baseline And Branch Safety

**Files touched:** none expected.

### RED / Baseline

Run the known failing gate and capture the current red state:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Explore renders demo cards"
```

Expected result before Task 1: fails because the locator for heading `Explore` also matches `Hydrostatic Equilibrium Explorer`.

Check dirty state before editing:

```bash
git status -sb
```

Expected result: working tree may contain existing user changes. Do not revert them.

### GREEN

No code changes in this task.

### VERIFY

Record the failing test name and confirm all later tasks remove this exact red failure.

### Commit

No commit.

---

## Task 1: Fix The Explore Smoke Test Locator

**Why:** The current test is red because it asks Playwright for any heading named `Explore`, which also matches demo card titles containing that word. The route still needs coverage, but the assertion should target the page H1.

**Files to edit:**

- `apps/site/tests/smoke.spec.ts`

### RED

The red bar already exists from Task 0.

Re-run the targeted test immediately before editing:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Explore renders demo cards"
```

Expected result: fails in strict mode with multiple heading matches.

### GREEN

Change the brittle assertion from:

```ts
await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
```

to:

```ts
await expect(
  page.getByRole("heading", { level: 1, name: "Explore", exact: true }),
).toBeVisible();
```

Keep the demo card assertion so the page still proves catalog content renders:

```ts
await expect(page.getByText("Open demo").first()).toBeVisible();
```

If the hydrostatic demo remains in the content collection, add a regression assertion that card headings containing `Explore` are allowed:

```ts
await expect(
  page.getByRole("heading", { name: /Hydrostatic Equilibrium Explorer/i }),
).toBeVisible();
```

Only add the hydrostatic assertion if the content file exists in the working tree during implementation.

### VERIFY

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Explore renders demo cards"
```

Expected result: passes.

### REFACTOR

Do not broaden helpers yet. Keep this task a single locator fix.

### Commit

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: harden explore heading smoke assertion"
```

---

## Task 2: Add A Static Demo H1 Contract

**Why:** Play pages need a single accessible page-level heading. The audit found only `stars-zams-hr` has an `<h1>`, so most demos lack a proper page heading.

**Files to create/edit:**

- `apps/demos/src/shared/demoContracts.test.ts`

### RED

Create `apps/demos/src/shared/demoContracts.test.ts`.

Test behavior:

- Read all `apps/demos/src/demos/*/index.html`.
- Ignore non-demo helper directories if any appear.
- Assert each file contains exactly one `<h1`.
- Assert the `<h1>` text is not empty after stripping tags.
- Assert the document still has one `.cp-demo` root with an `aria-label`.

Suggested test shape:

```ts
import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const demosRoot = new URL("../demos/", import.meta.url);

const demoDirs = readdirSync(demosRoot)
  .filter((entry) => statSync(join(demosRoot.pathname, entry)).isDirectory())
  .sort();

describe("demo HTML contracts", () => {
  test.each(demoDirs)("%s exposes exactly one page h1", (slug) => {
    const html = readFileSync(join(demosRoot.pathname, slug, "index.html"), "utf8");
    const h1Matches = html.match(/<h1\b/gi) ?? [];
    expect(h1Matches, `${slug} should have exactly one h1`).toHaveLength(1);

    const h1Text = html
      .match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      ?.replace(/<[^>]*>/g, "")
      .trim();

    expect(h1Text, `${slug} h1 should have readable text`).toBeTruthy();
  });

  test.each(demoDirs)("%s exposes a labelled demo root", (slug) => {
    const html = readFileSync(join(demosRoot.pathname, slug, "index.html"), "utf8");
    expect(html).toMatch(/class="[^"]*\bcp-demo\b[^"]*"/);
    expect(html).toMatch(/aria-label="[^"]+"/);
  });
});
```

Run:

```bash
corepack pnpm -C apps/demos test -- src/shared/demoContracts.test.ts
```

Expected result before Task 3: fails for every demo missing `<h1>`.

### GREEN

No production changes in this task. The failing test is the deliverable.

### VERIFY

Confirm the failure list includes the demos identified in the audit, especially:

- `angular-size`
- `blackbody-radiation`
- `keplers-laws`
- `moon-phases`
- `planetary-conjunctions`
- `retrograde-motion`
- `spectral-lines`
- `telescope-resolution`

### Commit

```bash
git add apps/demos/src/shared/demoContracts.test.ts
git commit -m "test: require accessible h1 in demo html"
```

---

## Task 3: Add One H1 To Every Demo Play Page

**Why:** This turns the Task 2 static contract green and improves screen-reader/page structure across all play pages.

**Files to edit:**

All demo `index.html` files that fail Task 2. Expected list from the audit:

- `apps/demos/src/demos/angular-size/index.html`
- `apps/demos/src/demos/binary-orbits/index.html`
- `apps/demos/src/demos/blackbody-radiation/index.html`
- `apps/demos/src/demos/conservation-laws/index.html`
- `apps/demos/src/demos/doppler-shift/index.html`
- `apps/demos/src/demos/eclipse-geometry/index.html`
- `apps/demos/src/demos/em-spectrum/index.html`
- `apps/demos/src/demos/eos-lab/index.html`
- `apps/demos/src/demos/galaxy-rotation/index.html`
- `apps/demos/src/demos/hydrostatic-equilibrium-explorer/index.html` if present
- `apps/demos/src/demos/keplers-laws/index.html`
- `apps/demos/src/demos/moon-phases/index.html`
- `apps/demos/src/demos/parallax-distance/index.html`
- `apps/demos/src/demos/planetary-conjunctions/index.html`
- `apps/demos/src/demos/retrograde-motion/index.html`
- `apps/demos/src/demos/seasons/index.html`
- `apps/demos/src/demos/spectral-lines/index.html`
- `apps/demos/src/demos/telescope-resolution/index.html`

Do not add a second H1 to `apps/demos/src/demos/stars-zams-hr/index.html`.

### RED

Use the failing Task 2 contract:

```bash
corepack pnpm -C apps/demos test -- src/shared/demoContracts.test.ts
```

Expected result: fails for missing H1s.

### GREEN

For each failing demo, add a single accessible H1 near the start of the `.cp-demo` root or the top visible header area.

Preferred pattern when a visual title already exists elsewhere:

```html
<h1 class="sr-only">Moon Phases</h1>
```

Preferred pattern when the demo header can visibly host the title without crowding controls:

```html
<h1>Moon Phases</h1>
```

Guidelines:

- Use the public demo title from `apps/site/src/content/demos/<slug>.md`.
- Keep title text consistent with the site catalog.
- Keep exactly one `<h1>` per `index.html`.
- Do not introduce page-local `.sr-only` definitions unless the shared theme lacks one.
- If `.sr-only` is missing globally, add the utility once in `packages/theme/styles/demo-shell.css`.

### VERIFY

```bash
corepack pnpm -C apps/demos test -- src/shared/demoContracts.test.ts
```

Expected result: passes.

Then run the existing accessibility smoke for demo pages:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/accessibility.spec.ts
```

Expected result: no new accessibility regressions.

### REFACTOR

If repeated H1 placement reveals a consistent local pattern, keep edits local to markup. Do not build a new runtime injection system in this P0 pass.

### Commit

```bash
git add apps/demos/src/demos packages/theme/styles/demo-shell.css
git commit -m "fix: add accessible headings to demo pages"
```

---

## Task 4: Add A No-JS Home Page Visibility Test

**Why:** The home page currently hides `.home-section` by default and reveals sections with JavaScript. A no-JS or observer failure can make major content invisible.

**Files to edit:**

- `apps/site/tests/smoke.spec.ts`

### RED

Add a nested no-JS smoke block:

```ts
test.describe("No-JS smoke", () => {
  test.use({ javaScriptEnabled: false });

  test("Home content remains visible without JavaScript", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 2, name: "Start here" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Recently updated" }),
    ).toBeVisible();
  });
});
```

If headings differ in the current file, use the actual H2 text from `apps/site/src/pages/index.astro`.

Run:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Home content remains visible without JavaScript"
```

Expected result before Task 5: fails because `.home-section` has default `opacity: 0`.

### GREEN

No production changes in this task. The failing test is the deliverable.

### VERIFY

Confirm the test fails for visibility, not for routing.

### Commit

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: cover no-js home content visibility"
```

---

## Task 5: Make Home Section Animation Progressive

**Why:** Content should be visible by default. JavaScript can enhance it with reveal animation only after the page opts into enhanced behavior.

**Files to edit:**

- `apps/site/src/pages/index.astro`

### RED

Use the failing Task 4 test:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Home content remains visible without JavaScript"
```

Expected result: fails.

### GREEN

Change the animation from hidden-by-default to progressive enhancement.

In the existing script, add the JS marker before the observer work:

```ts
document.documentElement.classList.add("js");
```

Change CSS from:

```css
.home-section {
  opacity: 0;
  transform: translateY(22px);
  transition:
    opacity 700ms ease,
    transform 700ms ease;
}

.home-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

to:

```css
.home-section {
  opacity: 1;
  transform: none;
}

:global(.js) .home-section {
  opacity: 0;
  transform: translateY(22px);
  transition:
    opacity 700ms ease,
    transform 700ms ease;
}

:global(.js) .home-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

Keep the reduced-motion override, but scope it so it still cancels enhanced animation:

```css
@media (prefers-reduced-motion: reduce) {
  :global(.js) .home-section,
  :global(.js) .home-section.is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### VERIFY

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Home content remains visible without JavaScript"
```

Expected result: passes.

Run the normal home/explore smoke subset:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts
```

Expected result: passes.

### REFACTOR

Do not change section layout or copy in this task.

### Commit

```bash
git add apps/site/src/pages/index.astro apps/site/tests/smoke.spec.ts
git commit -m "fix: make home reveal animation progressive"
```

---

## Task 6: Add A Blackbody Mobile Shell Regression Test

**Why:** At 390px width, the blackbody demo currently keeps the two-column custom shell layout, shrinking the visualization to roughly 108px and making the controls dominate the viewport.

**Files to create/edit:**

- `apps/site/tests/blackbody-radiation.spec.ts`

### RED

Create a focused Playwright test:

```ts
import { expect, test } from "@playwright/test";

test("blackbody mobile shell gives the visualization usable width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("play/blackbody-radiation/");

  const stage = await page.locator(".cp-demo__stage").boundingBox();
  const controls = await page.locator(".cp-demo__controls").boundingBox();

  expect(stage).not.toBeNull();
  expect(controls).not.toBeNull();

  expect(stage!.width).toBeGreaterThan(300);
  expect(controls!.width).toBeGreaterThan(300);

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
```

Run:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/blackbody-radiation.spec.ts -g "mobile shell"
```

Expected result before Task 7: fails because the stage remains narrow on mobile.

### GREEN

No production changes in this task. The failing test is the deliverable.

### VERIFY

Confirm the failure is a width/layout assertion, not a route/build failure.

### Commit

```bash
git add apps/site/tests/blackbody-radiation.spec.ts
git commit -m "test: cover blackbody mobile shell layout"
```

---

## Task 7: Fix Blackbody Mobile Grid Override

**Why:** `packages/theme/styles/demo-shell.css` defines a one-column shell at `max-width: 1024px`, but `blackbody-radiation/style.css` overrides `.cp-demo` grid areas after the shared import and does not restore a mobile layout.

**Files to edit:**

- `apps/demos/src/demos/blackbody-radiation/style.css`
- Optional, only if useful: `apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts`

### RED

Use the failing Task 6 test:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/blackbody-radiation.spec.ts -g "mobile shell"
```

Expected result: fails.

### GREEN

Add an explicit mobile override after the custom desktop grid:

```css
@media (max-width: 1024px) {
  .cp-demo {
    grid-template-columns: 1fr;
    grid-template-areas:
      "viz"
      "shelf"
      "sidebar";
  }
}
```

If blackbody controls need to appear before the shelf pedagogically, use:

```css
@media (max-width: 1024px) {
  .cp-demo {
    grid-template-columns: 1fr;
    grid-template-areas:
      "viz"
      "sidebar"
      "shelf";
  }
}
```

Choose the order that matches the existing blackbody markup and keeps the visualization first.

Add or extend the demo-specific design contract so future custom shell overrides must include a mobile override:

```ts
expect(css).toMatch(/@media\s*\(max-width:\s*1024px\)[\s\S]*grid-template-areas/);
```

### VERIFY

```bash
corepack pnpm -C apps/demos test -- src/demos/blackbody-radiation/design-contracts.test.ts
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/blackbody-radiation.spec.ts -g "mobile shell"
```

Expected result: both pass.

### REFACTOR

Keep the fix in blackbody CSS unless at least two demos share the same regression.

### Commit

```bash
git add apps/demos/src/demos/blackbody-radiation/style.css apps/demos/src/demos/blackbody-radiation/design-contracts.test.ts apps/site/tests/blackbody-radiation.spec.ts
git commit -m "fix: restore blackbody mobile shell layout"
```

---

## Task 8: Add An Honest Station Fallback Test

**Why:** When a station page lacks demo-specific content, the fallback currently includes Moon-phase-specific examples such as phase angle and illuminated fraction. That is misleading for unrelated demos.

**Files to edit:**

- `apps/site/tests/smoke.spec.ts`

### RED

Add a station fallback regression test:

```ts
test("Station fallback copy is generic when a demo lacks station content", async ({ page }) => {
  await page.goto("stations/planetary-conjunctions/");

  await expect(page.getByRole("heading", { name: /planetary conjunctions/i })).toBeVisible();
  await expect(page.getByText(/phase angle/i)).toHaveCount(0);
  await expect(page.getByText(/illuminated fraction/i)).toHaveCount(0);
  await expect(page.getByText(/generic station template/i)).toBeVisible();
});
```

If `planetary-conjunctions` receives station content before this task is implemented, use another demo that still lacks a station override and station params.

Run:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Station fallback copy"
```

Expected result before Task 9: fails because the fallback contains Moon-phase-specific copy and no explicit generic-template marker.

### GREEN

No production changes in this task. The failing test is the deliverable.

### VERIFY

Confirm failure points at station copy, not missing route.

### Commit

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: require honest station fallback copy"
```

---

## Task 9: Replace Misleading Station Fallback Copy

**Why:** Missing station content should be honest and broadly useful, not copied from a different astronomy concept.

**Files to edit:**

- `apps/site/src/pages/stations/[slug].astro`

### RED

Use the failing Task 8 test:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Station fallback copy"
```

Expected result: fails.

### GREEN

Replace the fallback table rows around the current Moon-specific examples with generic placeholders:

```astro
<p class="callout">
  Generic station template. This demo does not yet have a custom station card,
  so use these prompts as a lightweight observation scaffold.
</p>

<table>
  <thead>
    <tr>
      <th>Observable or setting</th>
      <th>Prediction</th>
      <th>Observation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Primary control you changed</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>Most visible pattern in the visualization</td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>
```

Keep demo-specific station params untouched when present.

### VERIFY

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Station fallback copy"
```

Expected result: passes.

Run the site build to catch Astro/content errors:

```bash
corepack pnpm build
```

Expected result: passes.

### REFACTOR

Do not create real station content in this task. The point is honest fallback behavior.

### Commit

```bash
git add apps/site/src/pages/stations/[slug].astro apps/site/tests/smoke.spec.ts
git commit -m "fix: make station fallback copy generic"
```

---

## Task 10: Add Instructor Bundle Incompleteness Coverage

**Why:** Partial instructor bundles can look like finished teaching support pages. The site should signal incomplete bundles before demos are improved one by one.

**Files to edit:**

- `apps/site/tests/smoke.spec.ts`

### RED

Add a regression test against a known partial bundle:

```ts
test("Instructor pages flag incomplete bundles", async ({ page }) => {
  await page.goto("instructor/planetary-conjunctions/");

  await expect(
    page.getByRole("heading", { name: /planetary conjunctions/i }),
  ).toBeVisible();
  await expect(page.getByText(/Instructor bundle incomplete/i)).toBeVisible();
  await expect(page.getByText(/Missing sections/i)).toBeVisible();
});
```

If `planetary-conjunctions` receives a full bundle before this task is implemented, use `retrograde-motion` or another demo with fewer than the expected instructor sections.

Run:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Instructor pages flag incomplete bundles"
```

Expected result before Task 11: fails because partial bundles render without a visible incompleteness notice.

### GREEN

No production changes in this task. The failing test is the deliverable.

### VERIFY

Confirm failure points at missing notice text, not missing route.

### Commit

```bash
git add apps/site/tests/smoke.spec.ts
git commit -m "test: flag incomplete instructor bundles"
```

---

## Task 11: Surface Missing Instructor Sections

**Why:** Instructor pages should support iterative authoring without pretending partial materials are complete.

**Files to edit:**

- `apps/site/src/pages/instructor/[slug].astro`

### RED

Use the failing Task 10 test:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Instructor pages flag incomplete bundles"
```

Expected result: fails.

### GREEN

Compute expected instructor sections from the existing section keys:

```ts
const expectedSections = ["index", "activities", "assessment", "model", "backlog"] as const;
const presentSections = new Set(sections.map((section) => section.section));
const missingSections = expectedSections.filter((section) => !presentSections.has(section));
const hasPartialInstructorBundle = hasInstructorContent && missingSections.length > 0;
```

Render a visible callout near the top of the page:

```astro
{
  hasPartialInstructorBundle && (
    <section class="callout" aria-label="Instructor bundle status">
      <h2>Instructor Bundle Incomplete</h2>
      <p>
        This page has some instructor material, but it is not a complete bundle yet.
      </p>
      <p>Missing sections: {missingSections.join(", ")}</p>
    </section>
  )
}
```

Use the page’s existing callout/card classes if present. Do not add a new visual system.

### VERIFY

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/smoke.spec.ts -g "Instructor pages flag incomplete bundles"
corepack pnpm build
```

Expected result: both pass.

### REFACTOR

Keep the incomplete state content-facing. Do not block builds on partial bundles yet, because demo-by-demo content completion is a later phase.

### Commit

```bash
git add apps/site/src/pages/instructor/[slug].astro apps/site/tests/smoke.spec.ts
git commit -m "fix: show incomplete instructor bundle status"
```

---

## Task 12: Add Dynamic Demo Accessibility Coverage

**Why:** The current accessibility test uses a hand-maintained demo list. New demos can land without entering the accessibility sweep.

**Files to edit:**

- `apps/site/tests/accessibility.spec.ts`

### RED

Replace or supplement the hard-coded `DEMOS` array with a content-derived list, following the helper pattern already used in `apps/site/tests/smoke.spec.ts`.

Minimal helper:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function demoSlugsFromContent() {
  const contentDir = join(process.cwd(), "src/content/demos");
  return readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();
}
```

Add an assertion that this dynamic list includes demos missing from the old list, such as:

```ts
expect(DEMOS).toContain("spectral-lines");
expect(DEMOS).toContain("stars-zams-hr");
```

If `hydrostatic-equilibrium-explorer` exists in `src/content/demos`, also assert it is included.

Run:

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/accessibility.spec.ts -g "DEMOS"
```

Expected result before GREEN: fails if the old static list remains.

### GREEN

Set:

```ts
const DEMOS = demoSlugsFromContent();
```

Remove stale manual omissions. Keep any demo-specific skips explicit and commented if truly necessary.

### VERIFY

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/accessibility.spec.ts
```

Expected result: passes, sweeping all demo content slugs.

### REFACTOR

If `demoSlugsFromContent()` duplicates smoke test code, keep duplication for now unless a shared test helper already exists in `apps/site/tests`. Do not introduce a new test utility package in this P0 pass.

### Commit

```bash
git add apps/site/tests/accessibility.spec.ts
git commit -m "test: derive accessibility demo list from content"
```

---

## Task 13: Final P0 Verification Gate

**Why:** This creates the stable baseline before demo-by-demo improvement begins.

**Files touched:** none expected unless previous tasks reveal small fixes.

### RED

Run the full gate:

```bash
corepack pnpm -C apps/demos test
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected result after Tasks 1-12: should pass. If any command fails, do not proceed to final status; open a new TDD micro-task for that failure.

### GREEN

Fix only failures caused by this P0 hardening work. Do not opportunistically complete demos.

### VERIFY

Run the same commands again:

```bash
corepack pnpm -C apps/demos test
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected result: all pass.

### Commit

If prior tasks were committed individually, no final commit is needed unless verification required small fixes.

If implementing without intermediate commits, create one coherent commit:

```bash
git add apps/demos apps/site packages/theme
git commit -m "test: harden p0 demo ui contracts"
```

---

## Acceptance Criteria

- `Explore renders demo cards` e2e passes under `CP_BASE_PATH=/cosmic-playground/`.
- Every demo `index.html` has exactly one readable `<h1>`.
- The home page renders core sections visibly when JavaScript is disabled.
- Blackbody mobile layout gives the visualization and controls usable width at 390px.
- Generic station fallback no longer contains Moon-phase-specific copy.
- Partial instructor bundles are visibly marked incomplete.
- Accessibility e2e sweeps all content-backed demos, not a stale manual list.
- Final gate passes:

```bash
corepack pnpm -C apps/demos test
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

---

## Risks And Notes

- `hydrostatic-equilibrium-explorer` appears to be active local work. If it remains untracked during implementation, include it in dynamic tests and H1 fixes without reverting or reshaping unrelated files.
- Adding H1s may expose visual spacing issues if a demo uses a visible title in a compact toolbar. Prefer `sr-only` H1s for cramped shells.
- The station and instructor tasks intentionally make incompleteness explicit rather than completing content. Demo-by-demo pedagogy work should happen after these guardrails pass.
- Full e2e may uncover pre-existing non-P0 failures once the accessibility demo list becomes dynamic. Treat those as new red bars and fix only the minimum contract violation.
