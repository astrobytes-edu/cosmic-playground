# galaxy-rotation Migration Parity Audit

Date: 2026-02-24

Scope: compare `galaxy-rotation` implementation against `docs/specs/galaxy-rotation-spec.md` and launch-gate contracts.

## 2026-02-24 SoTA uplift addendum

Completed:
- Added full `cp-playbar` transport (`play/pause/step/reset/speed`) for radius-marker sweep with reduced-motion guard.
- Added tooltip hooks for halo-mass and radius sliders.
- Expanded challenge deck from one scenario to three scenario prompts.
- Kept model sliders available during hidden-challenge state while locking preset switching to preserve mystery integrity.
- Replaced pre-hydration readout placeholders with neutral em-dash values to avoid misleading zeros.
- Normalized challenge copy to “Keplerian decline” wording.
- Applied celestial-token and glow-oriented styling updates in galaxy schematic rendering and translucent panel treatment.

Verification:
- `corepack pnpm -C apps/demos test -- src/demos/galaxy-rotation/design-contracts.test.ts src/demos/galaxy-rotation/logic.test.ts`

## References

Specs:
- `docs/specs/galaxy-rotation-spec.md`
- `docs/specs/cosmic-playground-site-spec.md`
- `docs/specs/cosmic-playground-model-contract.md`
- `docs/specs/cosmic-playground-prd.md`

Implementation:
- `packages/physics/src/galaxyRotationModel.ts`
- `apps/demos/src/demos/galaxy-rotation/index.html`
- `apps/demos/src/demos/galaxy-rotation/main.ts`
- `apps/demos/src/demos/galaxy-rotation/logic.ts`
- `apps/demos/src/demos/galaxy-rotation/style.css`

Content bundle:
- `apps/site/src/content/demos/galaxy-rotation.md`
- `apps/site/src/content/stations/galaxy-rotation.md`
- `apps/site/src/content/instructor/galaxy-rotation/index.md`
- `apps/site/src/content/instructor/galaxy-rotation/activities.md`
- `apps/site/src/content/instructor/galaxy-rotation/assessment.md`
- `apps/site/src/content/instructor/galaxy-rotation/model.md`
- `apps/site/src/content/instructor/galaxy-rotation/backlog.md`

## 1) Behavior parity

Implemented:
- `viz-first` instrument shell with required play markers and popover links.
- Two synchronized stage surfaces:
  - galaxy schematic with slit and radius marker
  - curve plot supporting velocity and enclosed-mass modes
- Parameter controls for bulge/disk/halo masses and scales, with preset + custom workflow.
- Readouts for required quantities (`V_total`, `V_Kep`, enclosed/visible/dark mass, ratios, `Delta-lambda_21`, `c`, `R_vir`).
- Optional MOND and solar-system normalized inset.
- Mystery challenge flow (ChallengeEngine-backed) with seeded deterministic path (`?challengeSeed=...`) and post-check evidence copy.
- Copy-results lock while challenge is active and unrevealed.

## 2) Physics/model parity

Implemented:
- New `GalaxyRotationModel` in `@cosmic/physics` with explicit unit-bearing APIs.
- Exact exponential-disk velocity (modified Bessel kernel), Hernquist bulge, NFW halo, MOND comparison, and helper conversions.
- Benchmark/limiting/invariant tests in `packages/physics/src/galaxyRotationModel.test.ts`.
- Public export wired in `packages/physics/src/index.ts`.

Notes:
- Presets are synthetic-calibrated for classroom behavior and benchmark envelopes.
- Runtime plot metadata fields remain `n/a` (no runtime plot-engine metadata layer adopted).

## 3) Accessibility parity

Implemented:
- Keyboard-operable controls, shortcuts, live region updates.
- Required utility toolbar semantics and status live region.
- Non-color differentiation in plot line styles (solid/dashed/dotted variants).
- Copy-lock reason and challenge lifecycle announcements.

## 4) Export/station parity

Implemented:
- Export payload remains `ExportPayloadV1` with additive galaxy-specific parameter/readout rows.
- Station mode includes snapshot and radial profile row set at:
  - `R = 2, 5, 10, 15, 20, 30, 40, 50` kpc

## 5) Remaining blockers for launch-ready

Manual artifacts still required:
- classroom validation log,
- VoiceOver and NVDA smoke logs.

## 6) Promotion recommendation

- Current recommendation: `candidate`.
- Promote to `launch-ready` only after manual classroom + screen-reader evidence is attached.
