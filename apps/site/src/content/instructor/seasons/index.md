---
title: "Cosmic Playground: Seasons"
bundle: "seasons"
section: "index"
demo_slug: "seasons"
last_updated: "2026-01-30"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/seasons/](../../play/seasons/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/seasons/`  
> UI markup: `apps/demos/src/demos/seasons/index.html`  
> Demo logic: `apps/demos/src/demos/seasons/main.ts`  
> Physics model: `packages/physics/src/seasonsModel.ts`

> **Where to go next**
> - Model + math + assumptions: `apps/site/src/content/instructor/seasons/model.md`
> - In-class activities: `apps/site/src/content/instructor/seasons/activities.md`
> - Assessment bank: `apps/site/src/content/instructor/seasons/assessment.md`
> - Future enhancements: `apps/site/src/content/instructor/seasons/backlog.md`

> **New: Station Mode + Help**
> - In the student demo, click **Station Mode** to build a data table you can **print** or **copy as CSV**.
> - Click **Help / Keys** (or press `?`) for shortcuts; press `g` to open Station Mode.

## Why this demo exists

> **Why This Matters**
> Students can often say “tilt causes seasons,” but still picture “summer = closer to the Sun.” This demo makes the *observable consequences* of tilt concrete: the Sun’s declination changes, which changes **day length** and **noon altitude**, and those change the energy received per day at a location.

## Learning goals (ASTR 101)

By the end of this demo, students should be able to:

- Explain why **axial tilt**, not Earth–Sun distance, causes opposite seasons in the two hemispheres.
- Use the ideas of **solar declination**, **day length**, and **noon Sun altitude** to predict what changes between summer and winter.
- Recognize that “closest to the Sun” (perihelion) occurs in early January, so distance cannot be the primary cause of seasons.

## Learning goals (ASTR 201 stretch)

Students should be able to:

- Interpret declination as a geometric consequence of the obliquity and Earth’s orbital position.
- Connect the day-length formula to the sunrise/sunset hour angle condition on the celestial sphere.

## 10–15 minute live-teach script (projector)

1. Start at the lecture defaults (March equinox, tilt 23.5°, latitude 40°N). Ask for a prediction: *“At the equinox, how many hours of daylight should we have?”* Then reveal the day-length readout.

2. Click **June Solstice**. Ask: *“At 40°N, should the Sun be higher or lower at noon than at the equinox?”* Connect the change to the **Sun Altitude** readout and the tilted globe view.

3. Click **December Solstice**. Ask: *“What should happen to day length and noon altitude now?”* Highlight that the two hemispheres must be opposite.

4. Point at the **Earth–Sun Distance** readout and ask: *“Are we closer in June or January?”* Then explicitly surface the misconception: distance varies, but it is not aligned with Northern Hemisphere seasons.

5. Optional “counterfactual”: set **Axial Tilt = 0°**. Ask: *“What happens to seasons and day length over the year?”* Use this to cement “tilt is the driver.”

## Suggested connections to the other demos

This demo sets up the shared “geometry language” used in the rest of Cosmic Playground:

- **Moon phases:** angles and illumination are geometry, not shadow.
- **Angular size:** what you *see* depends on size and distance; this matters for eclipse totality.
- **Eclipse geometry:** eclipses require both phase geometry and near-node geometry.
