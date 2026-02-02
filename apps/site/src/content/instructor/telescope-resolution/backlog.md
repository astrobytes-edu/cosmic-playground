---
title: "Telescope Resolution — Backlog"
bundle: "telescope-resolution"
section: "backlog"
demo_slug: "telescope-resolution"
last_updated: "2026-02-02"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/telescope-resolution/](../../play/telescope-resolution/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## P0 (blocking / correctness / teachability)

- **Teachability:** add a short instructor note that “resolved/marginal/unresolved” thresholds are didactic cutoffs (see `packages/physics/src/telescopeResolutionModel.ts`) and are not a full instrument-performance model.
- **Atmosphere story:** add one explicit “seeing-limited vs diffraction-limited” check step to the activities protocol (students must compare with/without atmosphere).
- **Assessment usability:** create a one-slide-per-clicker mini-deck template (prompt + setup + resolution readout) for fast classroom deployment.

## P1 (important)

- **Interferometry visualization:** add a baseline/array concept mode to connect “effective aperture” to resolution (matches README future ideas).
- **Seeing simulation:** replace the single seeing slider with a simple “turbulence animation” toggle (optional) so “blurring” feels less abstract.
- **Real-world comparison gallery:** add a small curated set of “what Hubble/JWST/ELT could resolve” examples (avoid made-up numbers; use sourced or omit).

## P2 (nice to have)

- **Advanced extensions:** PSF fitting / deconvolution mini-explainer; Strehl ratio deeper dive; sparse aperture masking (as optional collapsible deep dive).
