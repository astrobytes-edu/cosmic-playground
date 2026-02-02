---
title: "Angular Size — Future Enhancements (Backlog)"
bundle: "angular-size"
section: "backlog"
demo_slug: "angular-size"
last_updated: "2026-02-02"
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
| P0 | High | Low | UX | **DONE (2026-01-29):** Added explicit “Internal units = km” label near sliders to prevent silent unit errors. | `apps/demos/src/demos/angular-size/index.html` |
| P0 | High | Medium | Physics | **DONE (2026-01-29):** Added a “total vs annular” note tied to Moon distance (connect to eclipse demo’s umbra/antumbra idea). | `apps/demos/src/demos/angular-size/main.ts` + instructor docs |
| P1 | High | Medium | Pedagogy | Add a guided “Sun–Moon coincidence” mini-challenge with prediction checkpoints. | `apps/demos/src/demos/angular-size/main.ts` |
| P1 | Medium | Medium | Physics | Replace the linear recession model with a clearly-labeled “toy” vs “geology-informed” option (still keep units explicit). | `packages/physics/src/angularSizeModel.ts` |
| P1 | Medium | Medium | UX | Add a “compare two presets side-by-side” view for ratio reasoning. | `apps/demos/src/demos/angular-size/index.html` + `apps/demos/src/demos/angular-size/main.ts` |
| P2 | Medium | Low | Accessibility | Ensure all controls have aria labels + keyboard focus order (audit). | `apps/demos/src/demos/angular-size/index.html` |
| P2 | Medium | Low | UX | **DONE (2026-01-30):** Added shared Station Mode (table + CSV copy + print) and a Help/Keys panel. | `apps/demos/src/demos/angular-size/index.html` + `apps/demos/src/demos/angular-size/main.ts` |
| P2 | Low | Low | Pedagogy | Expand assessment items after classroom pilot; add distractors about degrees vs arcminutes. | `apps/site/src/content/instructor/angular-size/assessment.md` |
