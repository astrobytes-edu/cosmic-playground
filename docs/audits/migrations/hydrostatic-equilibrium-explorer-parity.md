# Hydrostatic Equilibrium Explorer Parity / Readiness Audit

Date: 2026-03-18
Demo slug: `hydrostatic-equilibrium-explorer`

## Source baseline

- New demo concept; no prior in-repo migrated implementation to compare against.
- Contract anchors reviewed:
  - `docs/specs/cosmic-playground-site-spec.md`
  - `docs/specs/cosmic-playground-model-contract.md`
  - `docs/specs/stellar-structure-suite-prd.md` section 4.2 and Demo 2
  - `docs/plans/2026-03-18-hydrostatic-equilibrium-explorer-plan.md`

## Intended physics chain

The migration target for this demo is the student reasoning chain:

1. gravity sets the required inward force,
2. hydrostatic equilibrium sets the pressure gradient,
3. pressure scale height compresses that balance into a local length scale,
4. the ideal gas law closes the support relation,
5. the core temperature is inferred from the resulting support scale.

## Content bundle parity

Implemented in this content set:

- Demo card with explicit experimental readiness fields.
- Station card with prediction, readout, and claim-evidence structure.
- Instructor bundle with index, activities, assessment, model, and backlog pages.
- Parity path wired in the demo frontmatter to this audit file.

## Required verification once the demo exists

- Confirm the UI surfaces the support chain in the same order used here.
- Confirm every readout names its units and labels the core-temperature value as an inference.
- Confirm the station card can be used without page-local print hacks.
- Confirm the demo content excerpt remains plain text and does not break card rendering.
- Confirm base-path-safe links resolve under the GitHub Pages site path.

## Launch-readiness recommendation

- Current content status: `experimental`.
- Promote only after the demo implementation, build, and classroom/accessibility validation are complete.
- A stronger readiness label would be premature until the instrument itself exists and has been checked against the model contract.
