# doppler-shift Migration Parity Audit

Date: 2026-02-23

Scope: compare `doppler-shift` implementation against `docs/specs/doppler-shift-spec.md` and launch-gate contracts.

## References (source of truth)

Specs:
- `docs/specs/doppler-shift-spec.md`
- `docs/specs/cosmic-playground-site-spec.md`
- `docs/specs/cosmic-playground-model-contract.md`
- `docs/specs/cosmic-playground-prd.md`

Implementation:
- `packages/physics/src/dopplerShiftModel.ts`
- `packages/physics/src/spectralLineModel.ts`
- `apps/demos/src/demos/doppler-shift/index.html`
- `apps/demos/src/demos/doppler-shift/main.ts`
- `apps/demos/src/demos/doppler-shift/logic.ts`
- `apps/demos/src/demos/doppler-shift/style.css`

Content and teaching materials:
- `apps/site/src/content/demos/doppler-shift.md`
- `apps/site/src/content/stations/doppler-shift.md`
- `apps/site/src/content/instructor/doppler-shift/index.md`
- `apps/site/src/content/instructor/doppler-shift/activities.md`
- `apps/site/src/content/instructor/doppler-shift/assessment.md`
- `apps/site/src/content/instructor/doppler-shift/model.md`
- `apps/site/src/content/instructor/doppler-shift/backlog.md`

## 1) Behavior parity

Implemented:
- Dual coupled controls (`v_r`, `z`) with relativistic state coupling and slider clamp indicator.
- Formula toggle (non-rel vs relativistic) affecting rendered predictions/readouts while preserving physical state mapping.
- Wave diagram with uniform observer-side crest spacing and rest-wavelength ghost reference.
- Lab-vs-observed spectrum comparator with line connectors, shift annotation, zoom-visible, and center-on-lines controls.
- Element catalogs from `SpectralLineModel`, including additive dense Fe path with strongest-8 default / show-all toggle.
- Preset set 1-8 (including z-driven presets) plus keyboard shortcuts per contract.
- Mystery Spectrum challenge using `ChallengeEngine`, deterministic `?challengeSeed=...` test path, non-repeating target selection, and accessible lifecycle announcements.

## 2) Accessibility parity

Implemented:
- Required play markers and live region semantics.
- Keyboard-operable controls for velocity/z/formula/presets/challenge actions.
- Reduced-motion path disables animation loop and announces static mode.
- Copy lock semantics during unrevealed mystery challenge (`disabled`, `aria-disabled`, helper text + live-region reason).

Coverage:
- `apps/site/tests/doppler-shift.spec.ts`
- Cross-demo list updated in `apps/site/tests/accessibility.spec.ts`

## 3) Export and station parity

Implemented:
- Export payload remains `ExportPayloadV1` with additive context fields:
  - parameters: velocity, z, element, spectrum mode, formula, line density, representative line, domain window, challenge state
  - readouts: rest/observed wavelength and frequency, deltas, regime, divergence, z comparison
  - notes: non-rel + relativistic formulas, sign convention, model boundaries
- Station mode columns and preset row set aligned to spec table structure.

## 4) Pedagogy parity

Implemented:
- Student-facing prompts include predict -> play -> explain loop.
- Explicit misconception handling for sound-vs-light wave picture.
- Instructor model notes include:
  - uniform spacing rationale,
  - non-rel wavelength/frequency asymmetry,
  - divergence-threshold interpretation,
  - kinematic vs cosmological/gravitational redshift boundary.

## 5) Outstanding launch-ready blockers

Manual evidence still required for `launch-ready`:
- classroom validation log,
- VoiceOver and NVDA smoke log.

## 6) Promotion recommendation

- Recommended current state: `candidate` (full automated gate bundle is passing for this migration).
- Promote to `launch-ready` only after manual classroom and screen-reader artifacts are attached.

## 7) Verification evidence

Automated checks executed successfully on 2026-02-23:
- `corepack pnpm -C packages/physics test dopplerShiftModel.test.ts`
- `corepack pnpm -C packages/physics typecheck`
- `corepack pnpm -C apps/demos test doppler-shift`
- `corepack pnpm -C apps/demos typecheck`
- `corepack pnpm -C /Users/anna/Teaching/cosmic-playground build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C /Users/anna/Teaching/cosmic-playground/apps/site test:e2e -- tests/doppler-shift.spec.ts`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C /Users/anna/Teaching/cosmic-playground/apps/site test:e2e -- tests/accessibility.spec.ts tests/smoke.spec.ts`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C /Users/anna/Teaching/cosmic-playground/apps/site test:e2e`
