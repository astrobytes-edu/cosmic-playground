---
title: "Angular Size — Future Enhancements (Backlog)"
bundle: "angular-size"
section: "backlog"
demo_slug: "angular-size"
last_updated: "2026-01-30"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/angular-size/](../../play/angular-size/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Prefer changes that improve reasoning and reduce unit-confusion.

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Low | UX | **DONE (2026-01-29):** Added explicit “Internal units = km” label near sliders to prevent silent unit errors. | `demos/angular-size/index.html` |
| P0 | High | Medium | Physics | **DONE (2026-01-29):** Added a “total vs annular” note tied to Moon distance (connect to eclipse demo’s umbra/antumbra idea). | `demos/angular-size/angular-size.js` + instructor docs |
| P1 | High | Medium | Pedagogy | Add a guided “Sun–Moon coincidence” mini-challenge with prediction checkpoints. | `demos/angular-size/angular-size.js` |
| P1 | Medium | Medium | Physics | Replace the linear recession model with a clearly-labeled “toy” vs “geology-informed” option (still keep units explicit). | `demos/_assets/angular-size-model.js` |
| P1 | Medium | Medium | UX | Add a “compare two presets side-by-side” view for ratio reasoning. | `demos/angular-size/index.html` + `demos/angular-size/angular-size.js` |
| P2 | Medium | Low | Accessibility | Ensure all controls have aria labels + keyboard focus order (audit). | `demos/angular-size/index.html` |
| P2 | Medium | Low | UX | **DONE (2026-01-30):** Added shared Station Mode (table + CSV copy + print) and a Help/Keys panel. | `demos/angular-size/index.html` + `demos/angular-size/angular-size.js` + `demos/_assets/demo-modes.js` |
| P2 | Low | Low | Pedagogy | Expand assessment items after classroom pilot; add distractors about degrees vs arcminutes. | `demos/_instructor/angular-size/assessment.qmd` |
