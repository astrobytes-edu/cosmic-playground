---
title: "Seasons — Future Enhancements (Backlog)"
bundle: "seasons"
section: "backlog"
demo_slug: "seasons"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/seasons/](../../play/seasons/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Keep it honest: “Impact” is about learning value, not cleverness.

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Low | UX | **DONE (2026-01-29):** Added explicit “Not to scale” label for the orbit exaggeration and distance axis. | `demos/seasons/index.html` |
| P0 | High | Medium | Physics | **PARTIAL (2026-01-29):** Distance/orbit-angle math now uses the model’s tropical-year constant, but the calendar day-of-year wrap remains 365 (non-leap-year) for date labeling. | `demos/seasons/seasons.js` + `demos/_assets/seasons-model.js` |
| P1 | High | Medium | Pedagogy | Add an “insolation proxy” readout (relative daily energy) built from day length × cos(zenith angle). | `demos/seasons/seasons.js` |
| P1 | Medium | Medium | Physics | Replace distance toy model with a simple Kepler-solver (mean anomaly → eccentric anomaly → true anomaly) for $r(t)$. | `demos/seasons/seasons.js` |
| P1 | Medium | Low | UX | Add a “Compare hemispheres” toggle that pins both 40°N and 40°S readouts simultaneously. | `demos/seasons/seasons.js` |
| P2 | Medium | Medium | UX | **DONE (2026-01-30):** Added a shared Station Mode overlay (steps + table + CSV copy + print) and a Help/Keys panel. | `demos/seasons/index.html` + `demos/seasons/seasons.js` + `demos/_assets/demo-modes.js` |
| P2 | Medium | Low | Accessibility | **DONE (2026-01-29):** Added a reduced-motion mode that defaults animations to step mode. | `demos/seasons/seasons.js` |
| P2 | Low | Low | Pedagogy | Add 2–3 additional clicker items directly in the instructor guide after classroom pilots. | `demos/_instructor/seasons/assessment.qmd` |
