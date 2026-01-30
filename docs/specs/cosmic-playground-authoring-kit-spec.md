# Cosmic Playground — Authoring Kit Spec v0.1

**Status:** Draft (Codex-ready)

**Owner:** Anna

**Date:** 2026-01-30

---

## 0. One-liner

The **Authoring Kit v0.1** makes adding (or migrating) a demo feel like adding a Markdown page: it scaffolds the demo shell + export plumbing + theme imports + metadata, and enforces a few quality gates at build time.

---

## 1. Goals

1. **Prevent UI drift:** new demos start from the instrument shell contract.
2. **Enforce “instrument standard”:** export results + model notes are not optional.
3. **Make migration fast:** scaffolding should be a single command with minimal manual wiring.
4. **Keep museum content first-class:** metadata and pedagogy live in content collections.

---

## 2. CLI scaffold

Script:

- `scripts/new-demo.mjs`

Usage:

- `node scripts/new-demo.mjs --slug <kebab-case> --title "<Title>" [--topic EarthSky] [--levels Both] [--time 10] [--math true|false]`

Creates:

- `apps/demos/src/demos/<slug>/{index.html,main.ts,style.css}`
- `apps/site/src/content/demos/<slug>.md`

---

## 3. Demo shell contract (required)

Every demo must include:

- `#cp-demo` root element
- instrument layer classes: `.cp-layer-instrument.cp-demo`
- regions from `@cosmic/theme/styles/demo-shell.css`:
  - `.cp-demo__controls`, `.cp-demo__stage`, `.cp-demo__readouts`, `.cp-demo__drawer`

---

## 4. Export results (required)

Every demo must provide a copy-to-clipboard affordance.

Minimum UI contract:

- `#copyResults` button
- `#status` live region (`role="status"`, `aria-live="polite"`)

Minimum code contract:

- a function named `exportResults()` that returns `{ parameters, readouts, notes, timestamp }`
- the demo registers a global hook (for smoke tests):

```ts
(window as any).__cp = { slug, exportResults };
```

---

## 5. Quality gates (build-time)

Build must fail if:

1. A content demo slug is missing a `/play/<slug>/index.html` artifact (existing gate).
2. A built demo HTML entry is missing any of:
   - `id="cp-demo"`
   - `id="copyResults"`
   - `id="status"`
   - `cp-demo__drawer` (model notes region)
3. A demo source folder exists without a corresponding metadata entry:
   - `apps/demos/src/demos/<slug>/` must have `apps/site/src/content/demos/<slug>.md` (or `.mdx`)

These gates prevent “half-migrated” demos from entering the museum.

---

## 6. Smoke tests (E2E)

Playwright smoke tests must:

- Load `/explore/` and assert the library renders.
- For each demo slug:
  - load `/play/<slug>/`
  - assert `#cp-demo` exists
  - fail on console errors
