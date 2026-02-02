---
title: "Conservation Laws (Orbits) — Future Enhancements (Backlog)"
bundle: "conservation-laws"
section: "backlog"
demo_slug: "conservation-laws"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/conservation-laws/](../../play/conservation-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Prefer changes that increase correctness and reduce cognitive friction before adding new features.

## Completed items

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Medium | Feature | **DONE (2026-01-29):** Add a standalone “orbit shapes from conservation laws” demo (analytic two-body; classifies bound/unbound). | `apps/demos/src/demos/conservation-laws/` |
| P1 | High | Medium | Docs | **DONE (2026-01-29):** Create instructor resources (index, model, activities, assessment, backlog). | `demos/_instructor/conservation-laws/` |
| P1 | High | Medium | Physics | **DONE (2026-01-29):** Centralize mechanics time/length conventions in shared `AstroConstants` and use shared two-body analytic helpers. | `demos/_assets/physics/` |

## Active backlog

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P1 | High | Medium | Pedagogy | Add an “energy decomposition” toggle that explicitly shows $v^2/2$, $-\mu/r$, and $\varepsilon$ (and makes the “sign of ε” story unavoidable). | `apps/demos/src/demos/conservation-laws/main.ts` |
| P1 | High | Medium | Pedagogy | Add an “equal areas” overlay (wedge + constant areal velocity readout) to connect directly to Kepler’s 2nd law. | `apps/demos/src/demos/conservation-laws/` |
| P1 | Medium | Medium | UX | Add an option to choose the initial position angle (currently fixed at +x), so students can test invariance under rotation. | `packages/physics/src/conservationLawsModel.ts` + `apps/demos/src/demos/conservation-laws/main.ts` |
| P2 | Medium | Low | UX | Add a unit toggle (AU/yr ↔ km/s ↔ CGS) for ε and h readouts (keeps units consistent across the “mechanics suite”). | `apps/demos/src/demos/conservation-laws/main.ts` |
| P2 | Medium | Medium | Pedagogy | Add a “station mode” overlay: numbered prompts, prediction checkpoints, and a small data table students can copy/paste. | `apps/demos/src/demos/conservation-laws/` |
| P3 | Medium | High | Physics | Add an optional “integrator preview” mode (Euler vs symplectic vs RK4) that shows conservation drift — defer until the numerical-integrators project. | `apps/demos/src/demos/conservation-laws/` + `packages/physics/src/*` |

## Priority definitions

- **P0:** Correctness or critical functionality (must fix before use)
- **P1:** High-impact pedagogy or usability (should add soon)
- **P2:** Nice-to-have enhancements (add when time permits)
- **P3:** Future extensions (research-level or specialized topics)
