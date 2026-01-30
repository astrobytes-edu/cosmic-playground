---
title: "Kepler’s Laws — Future Enhancements (Backlog)"
bundle: "keplers-laws"
section: "backlog"
demo_slug: "keplers-laws"
last_updated: "2026-01-30"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/keplers-laws/](/play/keplers-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Prefer changes that increase correctness and reduce cognitive friction before adding new features.

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Medium | Physics | **DONE (2026-01-29):** Make Newton-mode velocity vector tangent to the orbit (consistent with the plotted geometry). | `demos/_assets/keplers-laws-model.js` + `demos/keplers-laws/keplers-laws.js` |
| P0 | High | Low | UX | **DONE (2026-01-29):** Label animation speed meaning (“years/sec”) to avoid “real time” confusion. | `demos/keplers-laws/index.html` |
| P1 | High | Low | Physics | **DONE (2026-01-29):** Centralize anomaly conversions and orbital radius math in a shared, unit-tested model module. | `demos/_assets/keplers-laws-model.js` + `tests/keplers-laws-model.test.js` |
| P1 | High | Low | UX | **DONE (2026-01-29):** Make Newton-mode KaTeX readouts consistent with 101/201 units. | `demos/_assets/keplers-laws-model.js` + `demos/keplers-laws/keplers-laws.js` |
| P1 | Medium | Low | Performance | **DONE (2026-01-29):** Throttle dynamic KaTeX renders during animation to reduce jank risk. | `demos/keplers-laws/keplers-laws.js` |
| P1 | Medium | Low | Docs | Add an explicit “model note” box in the student demo UI (planar 2-body; teaching scale). | `demos/keplers-laws/index.html` |
| P2 | Medium | Medium | Pedagogy | Add a built-in “prediction checkpoint” mode (pause prompts + guiding questions) aligned to common misconceptions (speed vs distance, period scaling). | `demos/keplers-laws/keplers-laws.js` |
| P2 | Low | Low | Accessibility | Add an on-screen “keyboard shortcuts” help panel (students forget this exists). | `demos/keplers-laws/index.html` |
