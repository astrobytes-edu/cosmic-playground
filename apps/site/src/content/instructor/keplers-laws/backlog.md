---
title: "Kepler’s Laws — Future Enhancements (Backlog)"
bundle: "keplers-laws"
section: "backlog"
demo_slug: "keplers-laws"
last_updated: "2026-02-02"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/keplers-laws/](../../play/keplers-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Prefer changes that increase correctness and reduce cognitive friction before adding new features.

> **Note**
> This backlog tracks the migrated Cosmic Playground runtime version of the demo (Feb 2026). Legacy implementation notes are intentionally omitted here to avoid confusion.

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Medium | Migration | **DONE (2026-02-02):** Migrate demo into the standard instrument shell (triad), keep contract markers, and use base-path-safe links. | `apps/demos/src/demos/keplers-laws/index.html` |
| P0 | High | Medium | Exports | **DONE (2026-02-02):** Add v1 results export + live-region status messaging. | `apps/demos/src/demos/keplers-laws/main.ts` |
| P0 | High | Medium | Physics | **DONE (2026-02-02):** Implement a unit-tested Kepler orbit model (AU/yr/M☉ teaching units; no “G=1”). | `packages/physics/src/keplersLawsModel.ts` |
| P1 | Medium | Medium | Pedagogy | Add an optional “prediction checkpoint” mode (pause prompts + guiding questions) aligned to common misconceptions. | `apps/demos/src/demos/keplers-laws/main.ts` |
| P1 | Medium | Medium | Physics | Add a force/acceleration vector overlay (radial) to connect more directly to Newton’s law. | `apps/demos/src/demos/keplers-laws/main.ts` + `packages/physics/src/keplersLawsModel.ts` |
| P2 | Low | Low | UX | Add a small preset picker (Earth/Mars/Jupiter) in the controls panel (in addition to Station Mode row sets). | `apps/demos/src/demos/keplers-laws/main.ts` |
