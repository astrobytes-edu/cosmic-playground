---
title: "Cosmic Playground: Eclipse Geometry"
bundle: "eclipse-geometry"
section: "index"
demo_slug: "eclipse-geometry"
last_updated: "2026-01-30"
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/eclipse-geometry/](../../play/eclipse-geometry/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/eclipse-geometry/`  
> UI markup: `apps/demos/src/demos/eclipse-geometry/index.html`  
> Demo logic: `apps/demos/src/demos/eclipse-geometry/main.ts`  
> Physics model: `packages/physics/src/eclipseGeometryModel.ts`

> **Where to go next**
> - Model + math + assumptions: `apps/site/src/content/instructor/eclipse-geometry/model.md`
> - In-class activities: `apps/site/src/content/instructor/eclipse-geometry/activities.md`
> - Assessment bank: `apps/site/src/content/instructor/eclipse-geometry/assessment.md`
> - Future enhancements: `apps/site/src/content/instructor/eclipse-geometry/backlog.md`

> **New: Station Mode + Help**
> - In the student demo, click **Station Mode** to build a data table you can **print** or **copy as CSV**.
> - Click **Help / Keys** (or press `?`) for shortcuts; press `g` to open Station Mode.

## Why this demo exists

> **Why This Matters**
> Students can correctly say “eclipses happen at New or Full Moon,” and still expect them to happen every month. This demo adds the missing geometric condition: the Moon must also be near a **node** (close to the ecliptic plane). That second constraint is the reason eclipses come in “seasons” rather than every month.

## Learning goals (ASTR 101)

Students should be able to:

- State the **two necessary conditions** for eclipses:
  1) correct phase (New for solar, Full for lunar) and
  2) near a node (near the ecliptic plane).
- Use the demo readouts (phase label, ecliptic latitude, node distance) to explain “no eclipse” cases.
- Recognize that “penumbral vs umbral vs total” is about how close the alignment is.

## 10–15 minute live-teach script (projector)

1. Start at defaults. Click **Full Moon**. Ask: *“Do we always get a lunar eclipse at full moon?”* Show the “NO ECLIPSE” status when the Moon is not near the ecliptic.

2. Drag the Moon to a node while staying at Full Moon. Ask: *“What changed?”* Highlight the **Nearest node** readout and the eclipse status.

3. Repeat at **New Moon** for solar eclipses. Emphasize that “New Moon” happens monthly, but “near a node” does not.

4. Set orbital tilt to **0°**. Ask: *“What would happen to eclipses?”* Use this counterfactual to cement the causal role of inclination.

5. Run **Animate 1 Year** (or the long-run simulation at ~10 years) to show eclipse seasons as clustering in time.

## Suggested connections to the other demos

- **Moon phases:** phases tell you *when* eclipses are possible (New/Full), but not *whether* they happen.
- **Angular size:** totality depends on angular size; eclipse geometry depends on alignment.
- **Seasons:** both are “tilt + geometry” stories; learning to read angles is the transferable skill.
