---
title: "Cosmic Playground: Moon Phases"
bundle: "moon-phases"
section: "index"
demo_slug: "moon-phases"
last_updated: "2026-02-02"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/moon-phases/](../../play/moon-phases/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/moon-phases/`  
> Demo source: `apps/demos/src/demos/moon-phases/`  
> Demo logic: `apps/demos/src/demos/moon-phases/main.ts`

> **Where to go next**
> - Model + math + assumptions: `apps/site/src/content/instructor/moon-phases/model.md`
> - In-class activities: `apps/site/src/content/instructor/moon-phases/activities.md`
> - Assessment bank: `apps/site/src/content/instructor/moon-phases/assessment.md`
> - Future enhancements: `apps/site/src/content/instructor/moon-phases/backlog.md`

> **New: Station Mode + Help**
> - In the student demo, click **Station Mode** to build a data table you can **print** or **copy as CSV**.
> - Click **Help / Keys** (or press `?`) for shortcuts; press `g` to open Station Mode.

## Why this demo exists

> **Why This Matters**
> The most persistent misconception is that phases are caused by Earth’s shadow. This demo makes the geometry unavoidable: the Sun always lights half the Moon, and the phase we see depends on the viewing angle from Earth. Earth’s shadow only matters during eclipses.

## Learning goals (ASTR 101)

Students should be able to:

- Explain phases as a **viewing-geometry** effect (illuminated half vs visible half), not a shadow effect.
- Identify the phase at four key configurations (New, First Quarter, Full, Third Quarter) and relate “quarter” to orbit position.
- Use the demo’s readouts (phase angle and illumination %) to connect phase to the Sun–Earth–Moon geometry.

## 10–15 minute live-teach script (projector)

1. Start at **Full Moon** (reset). Ask: *“What fraction of the Moon’s disk should be illuminated from Earth right now?”* Confirm the illumination readout is ~100%.

2. Drag the Moon to **New Moon**. Ask: *“Is the Moon ‘unlit’?”* Emphasize that it is still half lit — we just see the dark half.

3. Go to **First Quarter** and **Third Quarter**. Ask: *“Why is ‘quarter’ not 25% illuminated?”* Tie it to being one quarter / three quarters of the way through the orbit from New Moon.

4. Connect to eclipses: emphasize that Earth’s shadow matters for eclipses, which require New/Full *and* near-node geometry (see the Eclipse Geometry demo).

## Suggested connections to the other demos

- **Eclipse geometry:** eclipses require New/Full Moon *and* near-node geometry (phases alone are not eclipses).
- **Angular size:** the Sun and Moon have similar angular sizes, which is why total solar eclipses are possible.
- **Seasons:** tilt changes the Sun’s path in the sky; phases change because the Moon’s position changes relative to the Sun.
