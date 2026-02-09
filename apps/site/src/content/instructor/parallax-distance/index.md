---
title: "Parallax Distance"
bundle: "parallax-distance"
section: "index"
demo_slug: "parallax-distance"
last_updated: "2026-02-09"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/parallax-distance/](../../play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/parallax-distance/`  
> Main code: `apps/demos/src/demos/parallax-distance/main.ts`  
> UI markup: `apps/demos/src/demos/parallax-distance/index.html`  
> Model code (tested): `packages/physics/src/parallaxDistanceModel.ts`  
> Data: `packages/data-astr101/src/starsNearby.ts`

> **Where to go next**
> - Model + math + assumptions: `model.md`
> - In-class activities (MW + Friday lab + station version): `activities.md`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.md`
> - Future enhancements (planning backlog): `backlog.md`

## Why this demo exists

> **Why This Matters**
> Parallax is the first “rung” of the distance ladder: a distance measurement built from **geometry** rather than assumptions about a star’s brightness or physics. This demo helps students see the core astronomy move: use a baseline (Earth’s orbit), measure a tiny angle, and infer an otherwise unreachable distance.

This demo is built to emphasize **cause → observable → inference**:

- **Cause:** Earth moves along its orbit and changes the observing geometry.
- **Observable:** the target’s detector position shifts against fixed background stars.
- **Inference:** two captures provide $\Delta\theta$ and $B_{\rm eff}$, yielding $\hat p$ and $\hat d$.

## Learning goals (ASTR 101)

By the end of this demo, students should be able to:

- Explain parallax as an *apparent shift* caused by viewing geometry, not a “property of the star.”
- State the direction of the relationship: **smaller parallax angle → greater distance**.
- Use the parallax-distance relationship conceptually (and optionally numerically) in the parsec system.
- Describe why parallax measurements are limited by **angular resolution/precision**.

## Learning goals (ASTR 201 stretch)

Students should be able to:

- Use $d(\text{pc}) = 1/p(\text{arcsec})$ to convert between parallax and distance (including mas and $\mu\mathrm{as}$ units).
- Interpret the parsec as a geometry-defined unit tied to the measurement.
- Compare measurement reach for Hipparcos-scale (~mas) vs Gaia-scale (tens of $\mu\mathrm{as}$) astrometry.

## 10–15 minute live-teach script (projector)

1. **Warm start: human parallax.** Have students do the thumb demo (alternate eyes). Ask: *“If your thumb were farther away, would the shift look bigger or smaller?”* (Prediction before observation.)

2. **Introduce cause and measurement axis.** In the orbit panel, point to target direction and parallax axis. Ask: *“What changes when Earth moves?”* (The line-of-sight from Earth to the same star.)

3. **Use distance-first setup.** Set $d_{\rm true}=10\,\mathrm{pc}$. Capture A, then move to a separated phase and capture B. Read $\Delta\theta$ and $B_{\rm eff}$, then show inferred $\hat p$ and $\hat d$.

4. **Make inverse scaling explicit.** Increase $d_{\rm true}$ to $100\,\mathrm{pc}$, repeat captures at similar phases, and compare shifts. Ask: *“Why did $\Delta\theta$ shrink and $\hat d$ grow?”*

5. **Measurement limits = knowledge limits.** Increase $\sigma_p$ and ask: *“When does $\hat p$ become comparable to $\sigma_{\hat p}$?”* Use $\hat p/\sigma_{\hat p}$ and $\sigma_{\hat d}$ to connect tiny angles to weak inference.

6. **Close the story.** Say explicitly: *“Parallax gives us distances that calibrate everything else. When the angle is too tiny, we need other methods — but those methods are anchored to this geometric rung.”*

## Misconceptions + prediction prompts

Use these to surface and correct common wrong models:

- **Misconception:** “Parallax is a property of the star.”  
  **Prompt:** *“If the star stayed exactly the same, could its parallax change?”* (Yes: change baseline or observer location.)

- **Misconception:** “Closer stars have smaller parallax.”  
  **Prompt:** *“Thumb at arm’s length vs across the room: which shifts more?”* Then run near/far distance capture pairs and compare $\Delta\theta$ with inferred $\hat d$.

- **Misconception:** “Any two captures are equally good.”  
  **Prompt:** *“What happens when captures are close along the parallax axis?”* Use $B_{\rm eff}$ warning to make ill-conditioning concrete.

- **Misconception:** “Light-years are more ‘natural’ than parsecs.”  
  **Prompt:** *“Which unit is defined by the measurement itself?”* (Parsec.)

## Suggested connections to other demos

- **Telescope resolution:** parallax is an angle measurement; resolution/precision sets which angles are measurable.
- **Cosmic Distance Builder (activity):** use parallax as the anchor for scaling up the distance ladder language.
