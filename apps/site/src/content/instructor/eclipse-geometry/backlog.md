---
title: "Eclipse Geometry — Future Enhancements (Backlog)"
bundle: "eclipse-geometry"
section: "backlog"
demo_slug: "eclipse-geometry"
last_updated: "2026-02-02"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/eclipse-geometry/](../../play/eclipse-geometry/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Physics items should improve realism without turning the demo into an ephemeris.

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Medium | Physics | **DONE (2026-01-29):** Added variable Earth–Moon distance (perigee/mean/apogee presets) and classified **total vs annular** solar eclipses (not just “central”). | `demos/_assets/eclipse-geometry-model.js` + `demos/eclipse-geometry/eclipse-geometry.js` |
| P0 | High | Low | UX | **DONE (2026-01-29):** Made the “Speed” control persist and displayed the current speed near the simulation buttons. | `demos/eclipse-geometry/eclipse-geometry.js` + `demos/eclipse-geometry/index.html` |
| P1 | High | Medium | Pedagogy | **DONE (2026-01-30):** Added built-in Station Mode (table + CSV/print + synthesis prompt) using the shared demo-modes helper. | `demos/eclipse-geometry/index.html` + `demos/eclipse-geometry/eclipse-geometry.js` + `demos/_assets/demo-modes.js` |
| P1 | Medium | Medium | Physics | Include Earth orbital eccentricity (Sun distance) as a second-order effect on eclipse cone sizes. | `demos/_assets/eclipse-geometry-model.js` |
| P1 | Medium | Medium | UX | Add a “show shadow cones” overlay (umbra/penumbra) with scale disclaimer. | `demos/eclipse-geometry/index.html` + `demos/eclipse-geometry/eclipse-geometry.js` |
| P2 | Medium | Low | Accessibility | **DONE (2026-01-30):** Added Help/Keys panel (plus global shortcuts `?` and `g`). | `demos/eclipse-geometry/index.html` + `demos/eclipse-geometry/eclipse-geometry.js` + `demos/_assets/demo-modes.js` |
| P2 | Low | Low | Docs | Update `demos/eclipse-geometry/README.md` to match the current penumbral + shadow-model thresholds. | `demos/eclipse-geometry/README.md` |
