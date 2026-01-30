# Authoring Kit v0.1 Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align specs + scaffolding with the new v1 export-results payload and station card parameter rows so new demos start “pilot-ready” by default.

**Architecture:** Update the contract language in `docs/specs/cosmic-playground-site-spec.md` and `docs/specs/cosmic-playground-authoring-kit-spec.md` to reflect the runtime’s v1 export payload (while keeping backward compatibility). Update `scripts/new-demo.mjs` templates to generate v1-shaped exports and include basic keyboard focus styles.

**Tech Stack:** Markdown specs, Node script scaffolder (`scripts/new-demo.mjs`), pnpm workspace build, Playwright E2E.

## Notes / Constraints

- Work on `main` (no worktree) per repo workflow.
- Keep runtime backward-compatible: older demos may still export `{ parameters, readouts, notes, timestamp }` records.

---

### Task 1: Update the site contract for export payload v1 (backward compatible)

**Files:**
- Modify: `docs/specs/cosmic-playground-site-spec.md:290`

**Step 1: Edit the export-results contract wording**

Update Section **9.2 → Export results** to document:
- Preferred v1 payload shape (ordered rows) including `version: 1`
- Backward-compatible legacy shape (record maps)
- Clipboard export must include a stable header with an explicit version marker

**Step 2: Commit**

Run:
```bash
git add docs/specs/cosmic-playground-site-spec.md
git commit -m "docs(spec): clarify export payload v1 and legacy support"
```

---

### Task 2: Update Authoring Kit spec to match export v1 + station params

**Files:**
- Modify: `docs/specs/cosmic-playground-authoring-kit-spec.md:54`

**Step 1: Update “Export results” section**

Replace the legacy-only description with:
- v1 payload example (arrays for ordered rows)
- note that runtime accepts legacy shape, but new demos should use v1
- keep the global hook requirement `window.__cp = { slug, exportResults }`

**Step 2: Document optional station parameter rows**

Add a short subsection noting the optional content field:
- `station_params: [{ parameter, value, notice }]`
- station card renders real rows when provided; otherwise placeholders

**Step 3: Commit**

Run:
```bash
git add docs/specs/cosmic-playground-authoring-kit-spec.md
git commit -m "docs: align authoring kit with export v1 and station params"
```

---

### Task 3: Update `new-demo` scaffold to generate v1 exports (and basic a11y polish)

**Files:**
- Modify: `scripts/new-demo.mjs:76`

**Step 1: Update the `main.ts` template to return v1 payload**

Change the generated `exportResults()` return value from record maps to:
```ts
return {
  version: 1,
  timestamp: new Date().toISOString(),
  parameters: [],
  readouts: [],
  notes: ["TODO: replace placeholder export results."]
};
```

**Step 2: Add visible focus styles in the scaffolded CSS**

Add `:focus-visible` styles for at least:
- `.cp-action` button

(Keep minimal and token-based: `outline: 3px solid var(--cp-focus)`.)

**Step 3: Verify script parses**

Run: `node --check scripts/new-demo.mjs`

Expected: exit 0 with no output.

**Step 4: Commit**

Run:
```bash
git add scripts/new-demo.mjs
git commit -m "chore(scaffold): generate v1 export payload in new demos"
```

---

### Task 4: Verify workspace build + E2E

**Step 1: Build**

Run: `corepack pnpm build`

Expected: PASS (including `scripts/validate-play-dirs.mjs` gates).

**Step 2: E2E**

Run: `corepack pnpm -C apps/site test:e2e`

Expected: PASS (including pilot export enforcement).

**Step 3: Push**

Run: `git push origin main`

