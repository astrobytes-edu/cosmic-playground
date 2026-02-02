# Contract Hardening (Site + Demos) — Execution Plan

> **For Codex:** REQUIRED SUB-SKILLS: `superpowers:executing-plans`, `superpowers:systematic-debugging`, `superpowers:test-driven-development`

**Goal:** Harden demos + site to follow the base-path / instrumentation / KaTeX / units / theme-token / a11y contracts, and make regressions fail fast in local + CI gates.

**Architecture:** Add lightweight, repo-local invariant validators (Node scripts) that run in `corepack pnpm build`, then fix current violations in small, reviewable slices. Avoid new dependencies and avoid adding site-wide client JS.

**Tech stack:** Astro (`apps/site`), Vite (`apps/demos`), pnpm workspaces, Node scripts under `scripts/`, Playwright e2e in `apps/site`.

## Contract anchors (treat as source of truth)

- Site spec:
  - Routing and `/play/<slug>/` artifact model: **4.1**, **5.2**, **12.x** (`docs/specs/cosmic-playground-site-spec.md`)
  - Demo runtime “instrument” expectations (modes/export/model notes/KaTeX): **9.2** (`docs/specs/cosmic-playground-site-spec.md`)
  - Performance + accessibility minimums: **11.1–11.2** (`docs/specs/cosmic-playground-site-spec.md`)
  - CI/QA checks + link validation: **13.1–13.3** (`docs/specs/cosmic-playground-site-spec.md`)
- Theme spec:
  - Theme package source of truth + no hardcoded colors + print centralization: **2.x**, **6** (`docs/specs/cosmic-playground-theme-spec.md`)

## Slice 1 (PR-sized): Add invariant gates that fail fast

**Scope:** Add a repo-local invariant validator that enforces non-negotiables (base paths, content link rules, demo link rules, print-hack bans, “no new color literals in apps”), and run it during `corepack pnpm build`.

**File targets:**
- Create: `scripts/validate-invariants.mjs`
- Create: `scripts/validate-invariants.test.mjs`
- Modify: `scripts/build.mjs`
- Modify: `package.json`

**Acceptance criteria:**
- `node scripts/validate-invariants.mjs` fails with actionable errors when:
  - `apps/site/src/**` contains root-absolute internal links/assets (`href="/..."`, `src="/..."`) or hardcoded `"/cosmic-playground/"`.
  - `apps/site/src/content/**` contains root-absolute markdown links/images (`](/...)`) or raw HTML `href="/..."` / `src="/..."`.
  - `apps/demos/src/demos/**` contains root-absolute links (`href="/..."`) or hardcoded `"/cosmic-playground/"`.
  - `apps/demos/src/**` uses `import.meta.env.BASE_URL` (demos must not treat it as the site root).
  - `apps/site/src/pages/**` and `apps/site/src/content/**` contain page-local print hacks (`@media print`) (print fixes must go in `packages/theme/styles/print.css`).
  - `apps/site/src/**` or `apps/demos/src/**` introduces new CSS color literals (`#...`, `rgb(...)`, `hsl(...)`) (visualization-only exceptions remain manual-review; this is a guardrail).
- The validator runs as part of `corepack pnpm build` (before building demos/site) so regressions fail early.
- A vitest test suite exists and exercises at least 3 representative failures (root-absolute link, markdown `](/...)`, demo `BASE_URL` usage).

**Verification commands:**
- `node scripts/validate-invariants.mjs`
- `corepack pnpm test:invariants`
- `corepack pnpm build`

## Slice 2 (PR-sized): Fix all violations surfaced by the new gates (base paths + links)

**Scope:** Make the code/content compliant with base-path rules and demo cross-site linking rules without introducing new patterns.

**File targets (confirm after `validate-invariants` output):**
- Modify: `apps/site/src/**/*.astro` (replace root-absolute links/assets with `import.meta.env.BASE_URL` patterns)
- Modify: `apps/site/src/content/**/*.md` (replace root-absolute markdown links with relative `../../...` links)
- Modify: `apps/demos/src/demos/**/index.html` and/or `main.ts` (replace root-absolute links with `../../...` or computed `siteRoot`)

**Acceptance criteria:**
- No `href="/..."` / `src="/..."` remain in `apps/site/src/**` for internal site routes/assets.
- No `](/...)` remain in `apps/site/src/content/**`.
- No `/cosmic-playground/` hardcoding remains in `apps/site/src/**`, `apps/site/src/content/**`, or `apps/demos/src/**`.
- Demos use only base-path-safe cross-site links from `/play/<slug>/` (`../../explore/`, `../../exhibits/<slug>/`, etc.) and do not use `import.meta.env.BASE_URL` as the site root.

**Verification commands:**
- `node scripts/validate-invariants.mjs`
- `node scripts/validate-play-dirs.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## Slice 3 (PR-sized): A11y + reduced-motion + print centralization polish (no new systems)

**Scope:** Fix any contract-a11y gaps found during the base-path cleanup (focus-visible regressions, dialog semantics/focus management, reduced-motion compliance) and ensure print fixes remain centralized in `packages/theme/styles/print.css`.

**File targets (confirm after audit):**
- Modify: `packages/theme/styles/print.css` (only if a global print issue is observed)
- Modify: `packages/theme/styles/*` (only for shared focus/motion tokens; no new per-app color literals)
- Modify: `packages/runtime/src/demoModes.ts` or `packages/runtime/src/polish.ts` (only if a generic focus/dialog/status behavior is missing)
- Modify: `apps/site/src/layouts/Layout.astro` (only if needed; do not add new KaTeX renderers/scripts)

**Acceptance criteria:**
- Keyboard-only navigation works for updated pages; focus-visible remains clearly visible on interactive elements (no `outline: none` regressions).
- Any dialog/modal behavior touched has correct semantics and focus return; Escape closes.
- Any motion/transition touched respects `prefers-reduced-motion: reduce`.
- No page-local print hacks are added; print fixes (if needed) land in `packages/theme/styles/print.css`.

**Verification commands:**
- `node scripts/validate-invariants.mjs`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## Out of scope (explicitly deferred)

- Refactoring physics formulas or adding new demos (unless a violation is blocking build/e2e).
- Changing content schemas or adding new KaTeX renderers/scripts.
- Introducing new styling systems or per-demo theme token sets.

