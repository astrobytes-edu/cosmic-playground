# spectral-lines Migration Parity Audit

Date: 2026-02-24

Scope: compare the `spectral-lines` implementation against the v1 contract in `docs/specs/spectral-lines-spec.md` and record promotion blockers.

## 2026-02-24 SoTA uplift addendum

Completed:
- Added full `cp-playbar` transport (`play/pause/step/reset/speed`) for guided transition-sequence exploration.
- Added tooltip hooks for `n_upper` and `n_lower` sliders.
- Expanded challenge deck from one scenario to three scenario prompts.
- Added explicit misconception-callout class to Bohr caveat panel for contract-aligned misconception framing.
- Improved default frequency readout placeholder from e-notation to high-legibility `x10^14 Hz`.
- Extended station-mode row sets with element fingerprint snapshots (`H/He/Na/Fe`) for quantitative comparison.

Verification:
- `corepack pnpm -C apps/demos test -- src/demos/spectral-lines/design-contracts.test.ts src/demos/spectral-lines/logic.test.ts`

## References (source of truth)

Spec:
- `docs/specs/spectral-lines-spec.md`

Implementation:
- `apps/demos/src/demos/spectral-lines/index.html`
- `apps/demos/src/demos/spectral-lines/main.ts`
- `apps/demos/src/demos/spectral-lines/logic.ts`
- `apps/demos/src/demos/spectral-lines/style.css`
- `packages/physics/src/spectralLineModel.ts`

Content and teaching materials:
- `apps/site/src/content/demos/spectral-lines.md`
- `apps/site/src/content/stations/spectral-lines.md`
- `apps/site/src/content/instructor/spectral-lines/index.md`
- `apps/site/src/content/instructor/spectral-lines/activities.md`
- `apps/site/src/content/instructor/spectral-lines/assessment.md`
- `apps/site/src/content/instructor/spectral-lines/model.md`
- `apps/site/src/content/instructor/spectral-lines/backlog.md`

## 1) Behavior parity

Implemented:
- Shared transition mode state across Hydrogen and Elements tabs.
- Series filter state (`all`, `Lyman`, `Balmer`, `Paschen`, `Brackett`) applied to rendered hydrogen transitions.
- Series-specific spectrum windows and tick sets.
- Elements tab readouts/announcements/export now use a canonical representative element line (strongest intensity, lower-wavelength tie-break).
- Export payload includes mode/tab/element/filter context plus representative-line context for Elements tab.
- Elements-first stage rendering: Elements tab hides Bohr orbit/energy ladder visuals and shows empirical-spectrum guidance.
- `Mystery Spectrum` challenge now uses `ChallengeEngine` lifecycle (`start`, `check`, `getHint`, `stop`) with randomized targets and deterministic seeded mode for tests.
- Mystery anti-leak contract enforced: Copy Results is disabled until check/reveal or explicit mystery exit.

## 2) Visual/interaction parity

Implemented:
- Instrument shell markers and required play contract elements (`#cp-demo`, `#copyResults`, `#status`, drawer).
- Hydrogen tab: synchronized Bohr atom + energy ladder + spectrum.
- Elements tab: spectrum-first stage with explicit empirical-catalog messaging and optional H Balmer comparison overlay.
- Orbit rings are keyboard focusable and selectable (`role="button"`, `tabindex`, ARIA labels).
- Orbit hover/focus tooltip implemented with `n` and `E_n` readout.

## 3) Accessibility parity

Implemented:
- Keyboard path through tab/mode/filter controls.
- Orbit-level keyboard selection and visible focus.
- Live-region transition announcements with wavelength + mode context.
- Reduced-motion branch announces instant updates.
- Mystery announcements include start/check/hint/stop lifecycle updates.
- Copy lock helper text + ARIA disabled state in unrevealed mystery mode.
- Playwright interaction coverage for shared mode state, series filter state, keyboard orbit selection, live-region announcements, and export/link contracts:
  - `apps/site/tests/spectral-lines.spec.ts`

Gaps:
- Screen-reader-specific smoke verification (NVDA/VoiceOver spoken output quality) has not yet been classroom-validated.

## 4) Export parity

Implemented:
- `ExportPayloadV1` includes:
  - parameters: mode, tab, element, `n_upper`, `n_lower`, series filter
  - Elements tab context: representative line
  - readouts: transition/representative line, wavelength, energy, frequency, series, band
  - model notes aligned to Bohr + NIST + display assumptions

## 5) Pedagogical parity

Implemented:
- Demo content has Predict/Play/Explain and misconception framing.
- Station card and instructor bundle are now present and linkable from demo/content routes.
- Student and instructor copy now explicitly separates hydrogen model truth from empirical element-catalog behavior.

Gaps:
- Instructor materials should be classroom-run once to collect timing/flow notes before promotion.

## 6) Promotion recommendation

- Current recommendation: `readiness: candidate`.
- Verification evidence captured:
  - `corepack pnpm -C apps/demos test spectral-lines`
  - `corepack pnpm -C packages/physics test spectralLineModel.test.ts`
  - `corepack pnpm -C apps/demos typecheck`
  - `corepack pnpm -C packages/physics typecheck`
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e -- tests/spectral-lines.spec.ts` (10 passed)
- Promote to `launch-ready` after:
  - classroom/manual accessibility pass (keyboard + screen-reader smoke),
  - collecting a short classroom validation log (timing + misconception notes).
