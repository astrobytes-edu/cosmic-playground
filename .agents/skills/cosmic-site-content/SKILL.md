---
name: cosmic-site-content
description: Use when editing the Cosmic Playground Astro site (apps/site pages, layouts, components, routes) or its Markdown content collections (apps/site/src/content) — links must survive the GitHub Pages base path, the site is fully static so URL-driven behaviour must run in the browser, and Markdown math is typeset at build time.
---

# Cosmic site and content

Read `.agents/references/invariants.md` first (base path, static output, math, units).

## The three things that break here

1. **Base path.** Works locally, 404s on GitHub Pages. Classify the surface (Astro / Markdown / demo)
   and use that surface's pattern from the invariants table. Run
   `node .agents/skills/cosmic-site-content/scripts/check-basepath.mjs` before and after.
2. **Static output.** `output: "static"` means `Astro.url.searchParams` is empty at build time. Explore's
   filters shipped inert for months because they were computed server-side. Anything driven by a query
   string runs client-side as progressive enhancement (`apps/site/src/lib/exploreFilter.ts` is the
   pattern); the no-JS page must still list everything.
3. **Math in Markdown.** remark-math runs before Markdown can mangle TeX, and rehype-katex typesets it at
   build. Display math must be fenced (`$$` on its own lines). Write single backslashes — the doubled
   `\\` workaround from the old client-side pipeline is gone. `KatexAutoRender` skips `.katex`, so it
   only handles frontmatter and `.astro` text.

## Content collections

- `apps/site/src/content/config.ts` is authoritative; match its enums exactly.
- Demo entries: the first paragraph is the card excerpt and must be plain text (no links, math or HTML).
- YAML: in single-quoted strings `\\` stays two characters (KaTeX then sees `\\mathrm`); write `\`. In
  double-quoted strings `\\` becomes one. Never type `&lt;` into a string the page escapes again.
- Readiness fields (`status`, `readiness`, `readinessReason`, ...): use `cosmic-readiness`.
- Instructor bundles and station cards: use `cosmic-instructor-materials`.

## Site conventions

- Global chrome (`Layout.astro`) ships no framework islands; scope any JS to one page.
- `/stations/` and `/instructor/` render in the paper theme; print rules live in
  `packages/theme/styles/print.css`, never per page.
- Wide content (tables, display equations, code) scrolls inside its own container; the page never scrolls
  sideways at 320px (`apps/site/tests/reflow.spec.ts`).
- Pass `hasMath={false}` to `Layout` on pages without math.

## Red flags — stop

- `href="/`, `src="/`, `](/` or `/cosmic-playground/` in site or content source.
- Reading `Astro.url.searchParams` to decide what a static page shows.
- Single-line `$$...$$` in a Markdown body; `\\` inside `$...$` in Markdown.
- A new KaTeX script or renderer.

## Verify

- `node scripts/validate-math-formatting.mjs` and the base-path script above.
- `corepack pnpm build`, then `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
  (`math-rendering.spec.ts` checks every museum route for parse errors and leaked TeX;
  `reflow.spec.ts` checks 320px). Follow `cosmic-verification` for how to run and report gates.
