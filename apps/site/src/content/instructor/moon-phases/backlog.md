---
title: "Moon Phases — Future Enhancements (Backlog)"
bundle: "moon-phases"
section: "backlog"
demo_slug: "moon-phases"
last_updated: "2026-02-02"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/moon-phases/](../../play/moon-phases/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. “Physics” items should improve correctness *without* adding cognitive clutter.

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Low | UX | **DONE (2026-01-30):** Added an explicit on-screen Sun direction cue (“Sunlight → from the Sun”) in the top view. | `demos/moon-phases/index.html` |
| P0 | High | Medium | Physics | **DONE (2026-01-29):** Load and use `demos/_assets/moon-phases-model.js` in the demo (single source of truth for illumination equation). | `demos/moon-phases/index.html` + `demos/moon-phases/moon-phases.js` |
| P1 | High | Medium | Pedagogy | Add built-in “prediction checkpoints” in Challenge Mode aligned to common misconceptions. | `demos/moon-phases/moon-phases.js` |
| P1 | Medium | Medium | Physics | Add a simple 3D inclination toggle that hands off to Eclipse Geometry concepts (“phases vs eclipses”). | `demos/moon-phases/moon-phases.js` |
| P1 | Medium | Medium | UX | Add rise/set time intuition (e.g., “Full Moon rises at sunset”) as optional overlay. | `demos/moon-phases/moon-phases.js` |
| P2 | Medium | Low | Accessibility | **DONE (2026-01-29):** Add reduced-motion support that defaults to a slower speed when `prefers-reduced-motion` is set. | `demos/moon-phases/moon-phases.js` |
| P2 | Medium | Low | UX | **DONE (2026-01-30):** Added shared Station Mode (table + CSV copy + print) and a Help/Keys panel. | `demos/moon-phases/index.html` + `demos/moon-phases/moon-phases.js` + `demos/_assets/demo-modes.js` |
| P2 | Low | Low | Pedagogy | Expand the assessment bank after the first teaching pilot (add 2–4 distractor-driven clickers). | `demos/_instructor/moon-phases/assessment.qmd` |
