---
name: cosmic-demo-contracts
description: Use when creating, migrating or changing a Cosmic Playground Vite demo (apps/demos/src/demos/<slug>) or the shared runtime (packages/runtime) — the /play/ page contract, build/copy pipeline, runtime helpers, Station and Challenge modes, screen-reader announcements, presets and Copy-results exports.
---

# Cosmic demo contracts

Read `.agents/references/invariants.md` first.

## Pipeline

- Source: `apps/demos/src/demos/<slug>/` (`index.html`, `main.ts`, `logic.ts`, `style.css`, tests).
- `corepack pnpm build` builds to `apps/demos/dist/<slug>/` and copies to `apps/site/public/play/<slug>/`
  (generated — never edit). Each demo also needs `apps/site/src/content/demos/<slug>.md`.
- Physics comes from `@cosmic/physics`; pure UI logic goes in `logic.ts` with `logic.test.ts`;
  `main.ts` wires the DOM. Per-demo `design-contracts.test.ts` asserts token and markup contracts.

## /play/ page markers (tests depend on them)

`#cp-demo` (accessible name), `#copyResults` button, `#status` live region, `.cp-demo__drawer`.

## Runtime helpers — reuse before writing

`createInstrumentRuntime`, `createDemoModes({ help, station })` (Station Mode table + CSV),
`ChallengeEngine`, `setLiveRegionText`, `initStarfield({ canvas })`, `initMath` / `renderMath`,
`initPopovers`, `initTabs`. Behaviour needed by two demos goes into `packages/runtime`, not a copy.
The About page promises Station, Challenge and Export on every demo; em-spectrum and
planetary-conjunctions have neither mode yet.

## Announcements (`#status`)

- Call `setLiveRegionText(status, text)` on `change` (slider release or keyboard step) and on preset or
  button clicks — never on every `input` event and never inside `render()`, which several demos call on
  every animation frame (eclipse-geometry once flooded screen readers at ~107 updates/s).
- `.cp-status` is visible on screen, so write plain words ("degrees", "times 10 to the 8").
- Announce the headline result from the demo's own formatters, e.g. parallax-distance
  `main.ts` "Distance updated. Capture A and B again."
- E2E must assert the text arrives, not only the ARIA attributes.

## Presets and controls

- A preset must set exact state. Writing a value into a `step="0.01"` slider and reading it back turns
  `Math.SQRT2` into 1.41 (conservation-laws "Escape" became a bound orbit). Write state, then render; set
  the slider for display only.
- After a preset, every dependent control and readout must agree (the Moon preset once loaded perigee
  while labelled "today").
- Every control must change something visible beyond its own label; sliders must respond to arrow keys.

## Exports

- Payloads are versioned (`ExportPayloadV1`); prefer additive changes; a breaking change needs a version
  bump and a note on who consumes it.
- Export labels and units match the UI exactly; use `@cosmic/runtime` formatters (`formatExportText`,
  `toCsv`).

## E2E quirks

- eos-lab's first-visit tour blocks clicks unless `localStorage["eos-lab-toured"] = "1"` (addInitScript).
- Range inputs with decimals: set the value via `evaluate` and dispatch `input` and `change`.
- Wait for entry animations before clicking; shelf tabs sit under the sticky sidebar.

## Red flags — stop

- An equation in `main.ts`; a copied keyboard/dialog helper; an announcement in a render loop.
- A preset that round-trips through a slider; a dead or echo-only control.
- Export labels drifting from UI labels.

## Verify

Demo unit tests (`corepack pnpm -C apps/demos exec vitest run src/demos/<slug>`), `corepack pnpm build`,
site E2E for the slug. Use `cosmic-physics` for model changes and `cosmic-a11y` for keyboard and focus.
