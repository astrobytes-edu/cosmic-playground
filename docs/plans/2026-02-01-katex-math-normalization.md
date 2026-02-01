# KaTeX Math Normalization (Demos + Site) Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Ensure all equations and symbols across demos, exhibits, stations, and instructor pages are authored in LaTeX and render nicely via KaTeX; use display math for primary equations.

**Architecture:** Add a shared KaTeX renderer helper in `@cosmic/runtime` for Vite demos (client-side auto-render), enable KaTeX auto-render on relevant Astro pages (exhibits/stations/instructor) without adding JS to unrelated pages, then migrate existing plain-text math to LaTeX delimiters (`$…$` inline, `$$…$$` display) across the codebase.

**Tech Stack:** Astro (site), Vite (demos), TypeScript, KaTeX (CSS + client auto-render JS).

---

## Task 1: Add `@cosmic/runtime/math` helper (client-side KaTeX auto-render)

**Files:**
- Modify: `packages/runtime/package.json`
- Modify: `packages/runtime/src/index.ts`
- Create: `packages/runtime/src/math.ts`

**Step 1: Add KaTeX dependency**

Add `"katex"` to `packages/runtime/package.json` dependencies.

**Step 2: Implement helper**

Create `packages/runtime/src/math.ts` exporting:
- `renderMath(root: Element): void` — renders LaTeX inside `root` using KaTeX auto-render
- `initMath(root: Element | Document = document): void` — convenience wrapper, safe if called multiple times

Use delimiters:
- `$$…$$` display
- `$…$` inline
- `\\[…\\]` display
- `\\(…\\)` inline

Ignore tags: `script`, `noscript`, `style`, `textarea`, `pre`, `code`.

**Step 3: Export**

Export the helper from `packages/runtime/src/index.ts` (or add a subpath export if desired later).

---

## Task 2: Turn on KaTeX auto-render on Astro “math-heavy” pages only

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`
- Modify: `apps/site/src/pages/exhibits/[slug].astro`
- Modify: `apps/site/src/pages/stations/[slug].astro`
- Modify: `apps/site/src/pages/instructor/[slug].astro`

**Step 1: Add a `hasMath` prop to `Layout`**

If `hasMath` is true, include `KatexAutoRender` so `$…$` / `$$…$$` in rendered content becomes KaTeX.

**Step 2: Pass `hasMath={true}` for exhibits/stations/instructor**

Avoid adding KaTeX JS to `/` and `/explore/`.

---

## Task 3: Enable KaTeX rendering in demos (single call per demo)

**Files:**
- Modify: each `apps/demos/src/demos/*/main.ts` that has any math text in injected HTML (help/station prompts)

**Step 1: Call `initMath()` once after UI is present**

Example:
```ts
import { initMath } from "@cosmic/runtime";
initMath(document);
```

If a demo injects HTML later (modals), call `renderMath()` on the injected container after insertion.

---

## Task 4: Convert demo HTML + strings to LaTeX math delimiters

**Files:**
- Modify: `apps/demos/src/demos/**/index.html`
- Modify: `apps/demos/src/demos/**/main.ts`

**Rules:**
- Use `$…$` for inline symbols (e.g. `$\\theta$`, `$D$`, `$d$`, `$M_{\\odot}$`).
- Use `$$…$$` for core equations (display mode).
- Replace Unicode subscripts/superscripts with LaTeX: `m₁ → m_1`, `π² → \\pi^2`.

---

## Task 5: Convert site content + instructor/station text to LaTeX

**Files:**
- Modify: `apps/site/src/content/**/*.md` (and any `.md` used for instructor/station overrides)
- Modify: any `.astro` templates that embed math symbols directly

Apply the same delimiter rules and prefer display math for primary equations.

---

## Task 6: Verification

Run:
- `corepack pnpm -r typecheck`
- `corepack pnpm build`

Expected:
- Typecheck passes.
- Build passes.

