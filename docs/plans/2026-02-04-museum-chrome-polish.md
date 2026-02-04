# Museum Chrome Polish + Attribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a subtle global attribution + contact link and polish the museum chrome (header/footer) without changing light mode design intent.

**Architecture:** Keep changes in `Layout.astro` markup and `apps/site/src/styles/global.css` for layout + chrome styling; rely on existing theme tokens for color, focus, and hover behavior.

**Tech Stack:** Astro layouts, global CSS, Playwright e2e smoke tests.

---

### Task 1: Add a failing footer attribution test

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`

**Step 1: Write the failing test**
- Add a new smoke test that expects:
  - Footer text “Developed and designed by Anna Rosen.”
  - Contact link `mailto:alrosen@sdsu.edu` with visible label “Contact”.

**Step 2: Run test to verify it fails**
Run: `corepack pnpm -C apps/site test:e2e --grep "Footer shows attribution"`
Expected: FAIL (footer text/link not found).

---

### Task 2: Implement footer markup + attribution

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`

**Step 1: Add footer meta row**
- Insert a new `site-footer__meta` container above the existing note.
- Add:
  - `<p class="site-footer__credit">Developed and designed by Anna Rosen.</p>`
  - `<a class="site-footer__contact" href="mailto:alrosen@sdsu.edu">Contact</a>`

**Step 2: Run test to verify it passes**
Run: `corepack pnpm -C apps/site test:e2e --grep "Footer shows attribution"`
Expected: PASS.

---

### Task 3: Polish museum chrome styles

**Files:**
- Modify: `apps/site/src/styles/global.css`

**Step 1: Add footer layout styles**
- Style `.site-footer__meta` as a flex row with wrap + spacing.
- Style `.site-footer__credit` and `.site-footer__contact` with tokenized colors.
- Keep the existing footer note as muted, secondary text.

**Step 2: Refine header nav tones**
- Override nav links to default to `--cp-text2`.
- Keep `aria-current="page"` in accent and add a subtle hover to `--cp-text`.

**Step 3: Run full e2e smoke**
Run: `corepack pnpm -C apps/site test:e2e`
Expected: PASS.

---

### Task 4: Sanity checks + commit

**Step 1: Verify no new color literals**
Run: `rg -n -- "#[0-9a-fA-F]{3,8}|\brgb\\(|\bhsl\\(" apps/site/src/styles`
Expected: no new color literals added.

**Step 2: Commit**
Run:
```
git add docs/plans/2026-02-04-museum-chrome-polish-design.md \
  docs/plans/2026-02-04-museum-chrome-polish.md \
  apps/site/tests/smoke.spec.ts \
  apps/site/src/layouts/Layout.astro \
  apps/site/src/styles/global.css
git commit -m "feat(site): polish chrome and add attribution footer"
```
