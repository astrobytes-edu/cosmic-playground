# EOS Lab Parity / Readiness Audit

Date: 2026-02-06
Demo slug: `eos-lab`

## Source baseline
- New demo (no legacy migrated implementation in this repo).
- Contract anchors reviewed:
  - `docs/specs/cosmic-playground-site-spec.md` (instrument markers, runtime expectations)
  - `docs/specs/cosmic-playground-model-contract.md` (units + model tests)
  - `docs/specs/stellar-structure-suite-prd.md` section 16.2 (EOS addendum)
  - `docs/specs/stellar-demo-01-eos-lab-memo.md` (implementation memo)

## v1 slice implemented now
- Scaffolded `/play/eos-lab/` with required shell regions and export markers.
- Added shared physics model `StellarEosModel` with explicit cgs units.
- Added benchmark/scaling/sanity tests for EOS channels and diagnostics.
- Added T and rho sliders plus canonical presets.
- Added LTE framing chip and deep-dive panel content per pressure source.

## Gaps intentionally deferred
- Finite-temperature Fermi-Dirac correction.
- Optional neutron-degeneracy extension implementation (API hook exists).
- Dedicated regime-map plot in log rho-log T space.

## Next promotion criteria
- Add quantitative regime map visualization and detailed equation-anatomy tabs.
- Add instructor override content bundle for `eos-lab`.
- Validate full launch gates (`build`, `e2e`, invariant suites) on candidate promotion.
