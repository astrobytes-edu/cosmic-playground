# Station Cards (Print-First) — PR-Sliced Delivery Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver printable station cards today: `/stations/<slug>/` works, prints cleanly, is linked from `/exhibits/<slug>/`, and instructor pages stay public.

**Architecture:** Astro SSG routes render from `demos` content collection (one station + one instructor page per demo slug). Print behavior is centralized in shared CSS (`packages/theme/styles/print.css`) and activated via `Layout.astro` paper theme for `/stations/` + `/instructor/`.

**Tech Stack:** Astro (`apps/site`), Astro Content Collections, Playwright (`apps/site/tests`), pnpm workspace, shared theme CSS (`packages/theme`).

---

## PR 1 (Must): Centralize print-first behavior (no per-page print hacks)

**Scope:** Make station/instructor printing predictable by putting the key print rules in shared CSS (theme), not inline per page.

**Files:**
- Modify: `packages/theme/styles/print.css`
- Modify: `apps/site/src/layouts/Layout.astro`
- Modify: `apps/site/src/styles/global.css` (only if imports/order needs adjustment)
- Modify: `apps/site/src/pages/stations/[slug].astro` (remove page-local `@media print` once shared rules exist)

**Acceptance criteria:**
- Printing any `/stations/<slug>/` hides all non-content chrome (header/footer/nav/skip link) and uses black-on-white.
- Printing any `/instructor/<slug>/` hides chrome and remains readable.
- No station/instructor page contains page-local `@media print` styling after this PR (print rules live in `packages/theme`).
- Paper theme remains automatic for `/stations/` and `/instructor/` via `Layout.astro` (no duplicated route checks elsewhere).

**Verification:**
- Build: `corepack pnpm -C apps/site build`
- Full build: `corepack pnpm build`
- Manual spot-check (local): open a station page and use browser print preview (Letter); confirm 1-page default template is plausible.

---

## PR 2 (Must): Station card template + override pipeline meets spec

**Scope:** Ensure station cards meet the spec’s “simple structured workflow” by default, while allowing per-demo overrides via the `stations/` content collection.

**Files:**
- Modify: `apps/site/src/pages/stations/[slug].astro`
- Modify: `apps/site/src/content/config.ts` (only if station schema needs fields like `has_math` or future structured blocks)
- Modify/Add (optional): `apps/site/src/content/stations/*.md` (only for urgent, print-today overrides)

**Acceptance criteria:**
- `/stations/<slug>/` renders for every demo slug (static paths derived from `demos` collection).
- Default station card includes (with headings): context, steps, answer blanks, parameter table, “claim + evidence”.
- If an override exists in `apps/site/src/content/stations/` for a demo slug, its content replaces the default body.
- No base-path-breaking links are introduced in station markdown overrides (no `](/...` and no `/cosmic-playground/`).

**Verification:**
- Content + site build: `corepack pnpm -C apps/site build`
- Quick link scan (content): `rg -n -- \"\\]\\(/|/cosmic-playground/\" apps/site/src/content/stations`

---

## PR 3 (Should, time permitting): E2E coverage for station + instructor routes + exhibit linking

**Scope:** Add Playwright smoke coverage so “printables today” doesn’t regress tomorrow—especially under `CP_BASE_PATH=/cosmic-playground/`.

**Files:**
- Modify: `apps/site/tests/smoke.spec.ts`
- Modify (optional): `apps/site/playwright.config.ts` (only if we need extra config for print-media emulation)

**Acceptance criteria:**
- Smoke tests cover at least:
  - One exhibit page has working “Station card” and “Instructor notes” links.
  - All `/stations/<slug>/` pages load and show a heading.
  - All `/instructor/<slug>/` pages load and include `noindex` meta.
  - (Optional) Emulated print media for a station page hides `.cp-no-print` elements.
- Tests pass with the production base path.

**Verification:**
- GH Pages base-path run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
- Full build: `corepack pnpm build`

---

## PR sizing rationale (for the “one big PR” request)

- **PR 1** isolates shared print behavior (high-risk, cross-cutting) so station cards can be iterated without CSS drift.
- **PR 2** locks spec correctness of station cards (core deliverable) while keeping content overrides optional.
- **PR 3** is safety net: prevents base-path and linking regressions after today’s rush.

