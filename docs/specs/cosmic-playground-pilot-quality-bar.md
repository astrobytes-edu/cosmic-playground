# Cosmic Playground Pilot Demo Quality Bar (v1)

**Status:** Draft (v1 “Public Beta”)

**Purpose:** Define a pragmatic checklist for a *single exemplar demo* that demonstrates the v1 “Instrument Standard” end-to-end: consistent UI, accessible controls, stable export behavior, honest model notes, and good performance on laptops and phones.

**Contract reference:** This document refines (does not replace) `docs/specs/cosmic-playground-site-spec.md`, especially Sections 9 (Instrument Standard) and 11 (performance + accessibility).

## Scope

This quality bar is meant for a small number of “pilot” demos (the exemplars we point to when authoring new demos). For v1, it is acceptable that many library demos remain “stubbed” or incomplete; the pilot bar is about proving the standard works.

## Checklist (Exemplar Demo)

### A. Instrument shell + UX

- Uses the standard shell layout: controls (left), stage (center), readouts (right), model notes drawer (bottom).
- Includes a clear one-line “what this shows” in the controls panel.
- Stage is meaningful and interactive (not a placeholder image).
- Includes “What to notice” guidance near the readouts (short, concrete, observable).

### B. Accessibility + keyboard

- Page has a single `h1` (inside the instrument shell is fine) and uses semantic structure (labels, headings, lists).
- Every control has an associated `<label>` (or equivalent accessible name).
- Keyboard-only usage works:
  - tab order is logical
  - controls are usable without a mouse
  - focus is visible (`:focus-visible` styles)
- “Copy results” reports status in a live region (`role="status"` / `aria-live="polite"`).
- No keyboard traps; no hover-only functionality.

### C. Theming + visual consistency

- No hardcoded colors in demo UI or stage rendering (prefer CSS variables / theme tokens).
- Readouts and controls match the shared demo shell styles (`@cosmic/theme`).
- Demo remains readable at default contrast (no low-contrast text-on-gradients).

### D. Export results (clipboard)

- Export payload includes:
  - `timestamp` (ISO string)
  - `parameters` (ordered)
  - `readouts` (ordered)
  - `notes` (short model caveats)
- Clipboard export uses a stable, human-readable text format:
  - consistent header with an explicit export version marker
  - predictable section headings (`Parameters`, `Readouts`, `Notes`)
  - one row per parameter/readout in a consistent line format
- Export content is appropriate for pasting into lab notes (units where relevant; short values; no huge dumps).

### E. Model notes (honesty + pedagogy)

- Includes explicit assumptions/simplifications (what’s “missing” and why).
- States what the model is good for and where it breaks.
- Avoids implying false precision (especially if units are arbitrary or the model is dimensionless).

### F. Performance + resilience

- No visible jank during interaction on typical laptops.
- No runaway memory growth during animation (requestAnimationFrame loop is stable).
- Demo is usable if clipboard API is unavailable (fallback copy path, clear error message).

### G. Mobile layout

- No horizontal scrolling at ~360px width.
- Controls and readouts remain usable without requiring pinch-zoom.
- Stage scales (canvas/SVG responsive, not clipped).

## Enforceable checks (v1)

These checks are intentionally pragmatic for v1 and should be expanded later.

### Build-time gates

- `scripts/validate-play-dirs.mjs` enforces core instrument markers exist in built `/play/<slug>/index.html` artifacts (instrument root, copy button, status region, model notes drawer marker).

### Playwright (E2E)

- A pilot-specific Playwright test validates the exemplar demo’s export text shape by stubbing `navigator.clipboard.writeText`, clicking “Copy results”, and asserting the copied text contains:
  - an explicit export version marker
  - a `Timestamp:` line
  - non-empty `Parameters:` and `Readouts:` sections (with at least 2 readouts)

## Spec Deviations

None.

