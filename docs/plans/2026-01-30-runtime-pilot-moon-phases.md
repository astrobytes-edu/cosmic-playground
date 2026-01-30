# Runtime Pilot (Moon Phases) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal `@cosmic/runtime` API (mode + export-results helpers) and update the `moon-phases` demo to use it (copy-results button + more “instrument-like” layout).

**Architecture:** `packages/runtime` provides tiny, framework-agnostic utilities. The demo calls `createInstrumentRuntime()` to manage mode (query + localStorage) and to format/copy export results. The demo remains a Vite MPA entrypoint.

**Tech Stack:** TypeScript, Vite, pnpm workspace.

---

### Task 1: Implement minimal runtime utilities

**Files:**
- Modify: `packages/runtime/src/index.ts`

**Step 1: Implement types**

Add:
- `export type Mode = "concept" | "math";`
- `export type ExportResults = { parameters: Record<string,string>; readouts: Record<string,string>; notes: string[]; timestamp: string };`

**Step 2: Implement mode helpers**

Add:
- `getModeFromUrl(url: URL): Mode | null`
- `getModeFromStorage(storageKey: string): Mode | null` (guard for `window`/`localStorage` presence)
- `setModeInStorage(storageKey: string, mode: Mode): void`
- `resolveInitialMode({ url, storageKey, hasMathMode }): Mode` (never returns `"math"` if `hasMathMode` is false)

**Step 3: Implement export helpers**

Add:
- `formatExport(results: ExportResults): string` (human-readable block)
- `copyTextToClipboard(text: string): Promise<void>` (uses `navigator.clipboard` when available; fallback to `execCommand`-style textarea)

**Step 4: Add a small convenience wrapper**

Add:
- `createInstrumentRuntime({ hasMathMode, storageKey, url }): { mode, setMode(mode), copyResults(results) }`

**Step 5: Verify**

Run: `corepack pnpm -C packages/runtime typecheck`
Expected: PASS

---

### Task 2: Wire runtime into `apps/demos`

**Files:**
- Modify: `apps/demos/package.json`

**Step 1: Add workspace dependency**

Add:
- `"@cosmic/runtime": "workspace:*"`

**Step 2: Verify**

Run: `corepack pnpm -C apps/demos typecheck`
Expected: PASS

---

### Task 3: Update `moon-phases` to use runtime (export results)

**Files:**
- Modify: `apps/demos/src/demos/moon-phases/index.html`
- Modify: `apps/demos/src/demos/moon-phases/main.ts`
- Modify: `apps/demos/src/demos/moon-phases/style.css`

**Step 1: Add “Copy results” button + toast region**

In HTML:
- Add a button in the controls panel: “Copy results”
- Add a small status element (`role="status"`, `aria-live="polite"`)

**Step 2: Compute export results**

In TS:
- Use `createInstrumentRuntime({ hasMathMode: false, storageKey: "cp:moon-phases:mode", url: new URL(location.href) })`
- On click: export `{ parameters: { "Phase angle (deg)": ... }, readouts: { "Illuminated (%)": ... }, notes: [...], timestamp: new Date().toISOString() }` and copy via runtime.
- Update status region on success/failure.

**Step 3: Adjust layout toward “instrument standard”**

In CSS/HTML (still minimal):
- Left column: controls (slider + copy button)
- Center: canvas stage
- Right: readouts + “what to notice”

**Step 4: Verify build**

Run:
- `corepack pnpm -C apps/demos build`
- `corepack pnpm build`
Expected: PASS, and `/play/moon-phases/` still works after copy step.

---

### Task 4: Commit + push

**Step 1: Commit**

Run:
- `git add -A`
- `git commit -m "feat(runtime): add export-results helper and use in moon-phases"`

**Step 2: Push**

Run: `git push`

