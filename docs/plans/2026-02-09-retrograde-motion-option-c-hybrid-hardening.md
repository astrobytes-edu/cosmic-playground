# Retrograde Motion Option C (Hybrid) Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden and polish the retrograde-motion demo with a hybrid control architecture, Earth-as-target support, improved pedagogy/science scaffolding, extended analysis windows, and retrograde-surface Unicode-math cleanup.

**Architecture:** Keep the canonical `.cp-demo` shell and preserve existing runtime/model contracts while shifting control ownership: sidebar owns transport/speed/window controls, and stage-adjacent timeline keeps scrubbing/navigation observable-first. Use test-first changes and minimize model churn by adding pure UI-logic helpers in `logic.ts` for pair validation and challenge evaluation. Improve rendering efficiency by separating static SVG layers from dynamic cursor/state updates so longer windows remain smooth.

**Tech Stack:** Vite + TypeScript demos, vanilla SVG, `@cosmic/runtime`, `@cosmic/physics`, Vitest (`apps/demos`), Playwright (`apps/site/tests`), Astro content markdown.

**Relevant skills:** @cosmic-frontend, @cosmic-ui-ux, @cosmic-physics-modeling, @cosmic-content-authoring, @superpowers:test-driven-development

---

### Task 1: Lock Hybrid Layout + Control Placement Contracts

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/design-contracts.test.ts`
- Modify: `apps/site/tests/retrograde-motion.spec.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`
- Modify: `apps/demos/src/demos/retrograde-motion/style.css`

**Step 1: Write the failing test**

Add assertions that enforce the approved hybrid IA:

```ts
expect(html).toMatch(/id="speed-select"/);
expect(html).toMatch(/id="windowMonths"[^>]*max="72"/);
expect(html).toMatch(/class="retro__timeline-row"/);
expect(html).toMatch(/id="scrubSlider"/);
```

Add Playwright assertions:

```ts
await expect(page.locator(".cp-demo__sidebar #speed-select")).toBeVisible();
await expect(page.locator(".cp-demo__sidebar #windowMonths")).toHaveAttribute("max", "72");
await expect(page.locator(".retro__timeline-row #scrubSlider")).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/design-contracts.test.ts
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
```

Expected: FAIL due to transport/speed still in the old location and `windowMonths max="36"`.

**Step 3: Write minimal implementation**

Restructure markup/CSS only:
- Move transport controls (`play/pause/step/reset`) into sidebar as a dedicated control card.
- Keep timeline row (day text + scrub slider + prev/retro/next buttons) stage-adjacent in a new `.retro__timeline-row` region.
- Move `speed-select` into sidebar control groups.
- Keep `windowMonths` in sidebar (already there), but raise max from `36` to `72`.
- Increase `windowMonths` slider max to `72`.
- Keep `.cp-playbar` as the timeline container if useful for shared shell styling; the key requirement is that transport + speed are no longer in that region.

Example target markup fragment:

```html
<div class="cp-playbar retro__timeline-row" role="region" aria-label="Timeline and navigation">
  <span class="playbar-day" id="playbar-day">Day 0 of 720</span>
  <input id="scrubSlider" class="cp-range" type="range" ... />
  <div class="playbar-nav">...</div>
</div>
```

**Step 4: Run test to verify it passes**

Run same commands from Step 2.

Expected: PASS for hybrid placement and max-window contract checks.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/index.html \
        apps/demos/src/demos/retrograde-motion/style.css \
        apps/demos/src/demos/retrograde-motion/design-contracts.test.ts \
        apps/site/tests/retrograde-motion.spec.ts
git commit -m "feat(retrograde): adopt hybrid control layout and extend window max to 72 months"
```

---

### Task 2: Keep Runtime Wiring Correct After Control Relocation

**Files:**
- Modify: `apps/site/tests/retrograde-motion.spec.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`

**Step 1: Write the failing test**

Add/adjust E2E tests that verify relocated controls still work:

```ts
await page.locator(".cp-demo__sidebar #btn-step-forward").click();
await expect(page.locator("#readoutDay")).not.toHaveText("0.0");

await page.locator(".cp-demo__sidebar #speed-select").selectOption("10");
await expect(page.locator("#speed-select")).toHaveValue("10");
```

Also assert timeline controls remain stage-adjacent:

```ts
await expect(page.locator(".retro__timeline-row #nextStationary")).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
```

Expected: FAIL on selectors or control interaction after DOM move.

**Step 3: Write minimal implementation**

In `main.ts`:
- Update DOM queries/selectors only where needed.
- Keep existing control IDs to minimize behavioral churn.
- Ensure status/live-region messages still fire for copy + reduced-motion + key interactions.
- Ensure timeline controls remain keyboard-accessible after relocation.

Example guard:

```ts
const timelineRegion = requireEl(
  document.querySelector<HTMLDivElement>(".retro__timeline-row"),
  ".retro__timeline-row"
);
```

**Step 4: Run test to verify it passes**

Run same command from Step 2.

Expected: PASS; no runtime null-query crashes.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/main.ts \
        apps/site/tests/retrograde-motion.spec.ts
git commit -m "fix(retrograde): preserve control behavior after hybrid layout migration"
```

---

### Task 3: Add Earth to Target List + Prevent Degenerate Same-Planet Pair

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/logic.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/logic.test.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`
- Modify: `apps/site/tests/retrograde-motion.spec.ts`

**Step 1: Write the failing test**

Add logic tests for distinct observer/target enforcement:

```ts
expect(resolveDistinctPair("Venus", "Venus")).toEqual({ observer: "Venus", target: "Earth", adjusted: true });
expect(resolveDistinctPair("Earth", "Earth")).toEqual({ observer: "Earth", target: "Mars", adjusted: true });
expect(resolveDistinctPair("Venus", "Earth")).toEqual({ observer: "Venus", target: "Earth", adjusted: false });
```

Add E2E test for Earth target option:

```ts
await expect(page.locator("#target option[value='Earth']")).toBeVisible();
await page.locator("#observer").selectOption("Venus");
await page.locator("#target").selectOption("Earth");
await expect(page.locator("#readoutLambda")).not.toHaveText("—");
```

**Step 2: Run test to verify it fails**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/logic.test.ts
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
```

Expected: FAIL because helper and Earth target option do not exist.

**Step 3: Write minimal implementation**

- Add `<option value="Earth">Earth</option>` to target select.
- Add pure helper in `logic.ts`:

```ts
export function resolveDistinctPair(observer: string, target: string) {
  if (observer !== target) return { observer, target, adjusted: false };
  const fallback = observer === "Earth" ? "Mars" : "Earth";
  return { observer, target: fallback, adjusted: true };
}
```

- Apply helper when observer/target/preset changes in `main.ts` and announce adjustments via live region.

**Step 4: Run test to verify it passes**

Run same commands from Step 2.

Expected: PASS; Venus observer with Earth target works, same-planet pair is auto-corrected.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/index.html \
        apps/demos/src/demos/retrograde-motion/main.ts \
        apps/demos/src/demos/retrograde-motion/logic.ts \
        apps/demos/src/demos/retrograde-motion/logic.test.ts \
        apps/site/tests/retrograde-motion.spec.ts
git commit -m "feat(retrograde): support Earth target and enforce distinct observer-target pair"
```

---

### Task 4: Pedagogy/Science Hardening (Observable-First + Challenge Rigor)

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/logic.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/logic.test.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`
- Modify: `apps/site/tests/retrograde-motion.spec.ts`

**Step 1: Write the failing test**

Add tests for new pure helpers:

```ts
expect(isRetrogradeDurationComparisonComplete({ Mars: 74, Venus: 42 })).toBe(true);
expect(isRetrogradeDurationComparisonComplete({ Mars: 74 })).toBe(false);
expect(formatGeometryHint("Earth", "Venus")).toContain("Inferior");
```

Add E2E checks for new readout/surface:

```ts
await expect(page.locator("#readoutGeometryHint")).toBeVisible();
await expect(page.locator("#readoutGeometryHint")).toContainText(/Inferior|Superior/);
```

**Step 2: Run test to verify it fails**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/logic.test.ts
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
```

Expected: FAIL due to missing helper/readout/challenge logic.

**Step 3: Write minimal implementation**

- Surface geometry hint in readouts and station snapshot rows.
- Strengthen Challenge #2 so it requires evidence from both Mars and Venus durations (not just selecting Venus).
- Improve help/station prompt wording to explicitly distinguish superior vs inferior geometry and link to measured durations.

Example helper:

```ts
export function isRetrogradeDurationComparisonComplete(durationByTarget: Partial<Record<string, number>>) {
  return Number.isFinite(durationByTarget.Mars) && Number.isFinite(durationByTarget.Venus);
}
```

**Step 4: Run test to verify it passes**

Run same commands from Step 2.

Expected: PASS; challenge now validates measured comparison workflow.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/index.html \
        apps/demos/src/demos/retrograde-motion/main.ts \
        apps/demos/src/demos/retrograde-motion/logic.ts \
        apps/demos/src/demos/retrograde-motion/logic.test.ts \
        apps/site/tests/retrograde-motion.spec.ts
git commit -m "feat(retrograde): strengthen pedagogy flow and duration-comparison challenge"
```

---

### Task 5: Rendering Performance Hardening for Longer Windows

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`
- Modify: `apps/site/tests/retrograde-motion.spec.ts`

**Step 1: Write the failing test**

Add an E2E stability/perf guard that pushes window to max and exercises scrubbing:

```ts
await page.locator("#windowMonths").evaluate((el: HTMLInputElement) => {
  el.value = "72";
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.locator("#scrubSlider").fill("1800");
await expect(page.locator("#readoutDay")).toContainText(/\d/);
```

(Goal: capture regressions that produce hangs/NaN state on larger windows.)

**Step 2: Run test to verify it fails**

Run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
```

Expected: FAIL or flaky behavior under max-window stress before optimization.

**Step 3: Write minimal implementation**

Refactor render pipeline:
- Build static SVG layers once per recompute (axes/grid/background/orbit ellipses).
- Update dynamic layers only per cursor tick (cursor line, dots, labels, LOS, trail).
- Full static rebuild only when dataset/window/options change.

Implementation sketch:

```ts
function renderStaticLayers() { /* called on recomputeSeries */ }
function renderDynamicLayers() { /* called on setCursorDay / animation frame */ }
```

**Step 4: Run test to verify it passes**

Run same command from Step 2, then:

```bash
corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/design-contracts.test.ts src/demos/retrograde-motion/logic.test.ts
```

Expected: PASS with stable large-window interaction.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/main.ts \
        apps/site/tests/retrograde-motion.spec.ts
git commit -m "perf(retrograde): split static and dynamic SVG rendering for long windows"
```

---

### Task 6: Convert Retrograde-Surface Unicode Math to LaTeX/ASCII-Safe Forms

**Files:**
- Modify: `apps/demos/src/demos/retrograde-motion/index.html`
- Modify: `apps/demos/src/demos/retrograde-motion/main.ts`
- Modify: `apps/site/src/content/demos/retrograde-motion.md`
- Modify: `apps/site/src/content/stations/retrograde-motion.md`
- Modify: `apps/site/src/content/instructor/retrograde-motion/backlog.md`

**Step 1: Write the failing test**

Add targeted assertions/checks:
- Demo content surfaces should avoid Unicode math glyphs in teaching-facing copy when equivalent LaTeX already exists.
- Non-KaTeX contexts (`<option>`, button text, ARIA) should use ASCII-safe forms (`->`, `deg`, `day`).

If no existing content test harness is used, encode a reproducible grep gate in plan execution:

```bash
rg -n "→|←|±|≈|≤|≥|λ|Δ|π|°" \
  apps/demos/src/demos/retrograde-motion/index.html \
  apps/demos/src/demos/retrograde-motion/main.ts \
  apps/site/src/content/demos/retrograde-motion.md \
  apps/site/src/content/stations/retrograde-motion.md \
  apps/site/src/content/instructor/retrograde-motion/backlog.md
```

**Step 2: Run test to verify it fails**

Run grep above.

Expected: FAIL (currently contains Unicode arrow/en-dash style math-like glyphs on retrograde surfaces).

**Step 3: Write minimal implementation**

- Replace Unicode math symbols with LaTeX where rendered math is supported (markdown/tab content).
- Use ASCII-safe alternatives where KaTeX is not available (select options, UI control labels, aria text).
- Keep scientific notation explicit and consistent with repo math policy.

Example replacements:

```md
Earth $\to$ Mars
$0^\circ$--$360^\circ$
$d\tilde{\lambda}/dt$
```

**Step 4: Run test to verify it passes**

Run grep again (expect no remaining prohibited symbols in scoped files), then:

```bash
corepack pnpm -C apps/site build
```

Expected: clean build + scoped symbol cleanup complete.

**Step 5: Commit**

```bash
git add apps/demos/src/demos/retrograde-motion/index.html \
        apps/demos/src/demos/retrograde-motion/main.ts \
        apps/site/src/content/demos/retrograde-motion.md \
        apps/site/src/content/stations/retrograde-motion.md \
        apps/site/src/content/instructor/retrograde-motion/backlog.md
git commit -m "docs(retrograde): normalize unicode math to LaTeX/ASCII-safe forms"
```

---

### Task 7: Related Content Alignment (Model Day + Hybrid Controls + Earth Target)

**Files:**
- Modify: `apps/site/src/content/demos/retrograde-motion.md`
- Modify: `apps/site/src/content/stations/retrograde-motion.md`
- Modify: `apps/site/src/content/instructor/retrograde-motion/backlog.md`

**Step 1: Write the failing test**

Add/adjust textual expectations in `apps/site/tests/retrograde-motion.spec.ts`:

```ts
expect(noticeText).toContain("model day");
expect(noticeText).toContain("Earth -> Venus");
```

(Or add page-specific checks if spec currently scopes only `/play/retrograde-motion/`.)

**Step 2: Run test to verify it fails**

Run:
```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
```

Expected: FAIL due to old station wording and control-location references.

**Step 3: Write minimal implementation**

- Replace table/instruction “Date” usage with “Model day $t$”.
- Update instructions to reflect hybrid control placement (transport/speed/window in sidebar, timeline near stage).
- Add Earth target context explicitly for Venus-observer scenarios.

Example station table header update:

```md
| Event | Model day $t$ | $\lambda_{\mathrm{app}}$ (deg) | Motion state | Notes |
```

**Step 4: Run test to verify it passes**

Run:
```bash
corepack pnpm -C apps/site build
```

Plus targeted preview/manual check:
```bash
corepack pnpm -C apps/site preview --host 127.0.0.1 --port 4173
# Open /cosmic-playground/stations/retrograde-motion/ and /cosmic-playground/play/retrograde-motion/
```

Expected: content and demo instructions are consistent.

**Step 5: Commit**

```bash
git add apps/site/src/content/demos/retrograde-motion.md \
        apps/site/src/content/stations/retrograde-motion.md \
        apps/site/src/content/instructor/retrograde-motion/backlog.md \
        apps/site/tests/retrograde-motion.spec.ts
git commit -m "docs(retrograde): align station/demo content with hybrid controls and model-day framing"
```

---

### Task 8: Final Verification + Regression Sweep

**Files:**
- Modify (if needed): `apps/site/tests/retrograde-motion.spec.ts`
- Modify (if needed): `apps/demos/src/demos/retrograde-motion/design-contracts.test.ts`

**Step 1: Write the failing test**

If any final gap remains from prior tasks, codify it first before fixing.

**Step 2: Run test to verify it fails**

Run:
```bash
corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/design-contracts.test.ts src/demos/retrograde-motion/logic.test.ts
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"
corepack pnpm build
```

Expected: Any remaining failure is surfaced now.

**Step 3: Write minimal implementation**

Apply only focused fixes for failing assertions; avoid opportunistic refactors.

**Step 4: Run test to verify it passes**

Run the same command set from Step 2.

Expected: all retrograde demo tests and full build pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(retrograde): final verification sweep for hybrid hardening"
```

---

## Verification Matrix (for execution session)

- Unit logic:
  - `corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/logic.test.ts`
- Demo contracts:
  - `corepack pnpm -C apps/demos test -- src/demos/retrograde-motion/design-contracts.test.ts`
- E2E slice:
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e --grep "Retrograde Motion -- E2E"`
- Build gates:
  - `corepack pnpm -C apps/site build`
  - `corepack pnpm build`

## Risks + Mitigations

- **Risk:** Same-planet observer/target produces degenerate line-of-sight.  
  **Mitigation:** enforce `observer !== target` via pure helper + live-region notice.

- **Risk:** 72-month windows increase SVG workload.  
  **Mitigation:** static/dynamic layer split and longer-window E2E stability check.

- **Risk:** Unicode-math cleanup could break readability in non-KaTeX controls.  
  **Mitigation:** LaTeX only in math-rendered surfaces; ASCII-safe labels in controls/ARIA.
