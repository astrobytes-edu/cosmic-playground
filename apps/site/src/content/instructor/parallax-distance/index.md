---
title: "Parallax Distance"
bundle: "parallax-distance"
section: "index"
demo_slug: "parallax-distance"
last_updated: "2026-02-02"
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

This demo is built to emphasize **observable → model → inference**:

- **Observable:** the star’s apparent position shift against a background over six months.
- **Model:** simple triangle geometry linking baseline and angle.
- **Inference:** a distance in parsecs (and how measurement limits cap what we can know directly).

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

2. **Introduce the baseline.** In the demo, point to the two observation points (Jan vs July) and ask: *“What is the baseline we’re using?”* (Opposite sides of Earth’s orbit: ~2 AU.)

3. **Use the parallax slider.** Start at $p=1000\,\mathrm{mas}$ (1 arcsec, 1 pc). Ask students to predict: *“If parallax drops by a factor of 10, what happens to distance?”* Then set $p=100\,\mathrm{mas}$ and read the distance.

4. **Make the inverse relationship explicit.** Pause on a clean value (e.g., 10 pc) and read off the parallax magnitude. Then ask: *“If parallax is half as big, is the star closer or farther? By what factor?”*

5. **Measurement limits = knowledge limits.** Increase $\sigma_p$ and ask: *“When does $p$ become comparable to the uncertainty?”* Use the signal-to-noise readout $p/\sigma_p$ to connect “tiny angle” to “measurement challenge.”

6. **Close the story.** Say explicitly: *“Parallax gives us distances that calibrate everything else. When the angle is too tiny, we need other methods — but those methods are anchored to this geometric rung.”*

## Misconceptions + prediction prompts

Use these to surface and correct common wrong models:

- **Misconception:** “Parallax is a property of the star.”  
  **Prompt:** *“If the star stayed exactly the same, could its parallax change?”* (Yes: change baseline or observer location.)

- **Misconception:** “Closer stars have smaller parallax.”  
  **Prompt:** *“Thumb at arm’s length vs across the room: which shifts more?”* Then map that directly to the demo slider.

- **Misconception:** “We can measure parallax to any star.”  
  **Prompt:** *“What happens to the shift at 10,000 pc?”* Use the precision toggle to make the limitation concrete.

- **Misconception:** “Light-years are more ‘natural’ than parsecs.”  
  **Prompt:** *“Which unit is defined by the measurement itself?”* (Parsec.)

## Suggested connections to other demos

- **Telescope resolution:** parallax is an angle measurement; resolution/precision sets which angles are measurable.
- **Cosmic Distance Builder (activity):** use parallax as the anchor for scaling up the distance ladder language.
