---
title: "Cosmic Playground: Kepler’s Laws"
bundle: "keplers-laws"
section: "index"
demo_slug: "keplers-laws"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Student demo: [/play/keplers-laws/](/play/keplers-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/keplers-laws/`  
> Main code: `demos/keplers-laws/keplers-laws.js`  
> Model code (tests + shared): `demos/_assets/keplers-laws-model.js`

> **Where to go next**
> - Model + math + assumptions: `model.qmd`
> - In-class activities (MW quick + Friday lab + station version): `activities.qmd`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.qmd`
> - Future enhancements (planning backlog): `backlog.qmd`

## Why this demo exists

> **Why This Matters**
> Kepler’s laws are one of the cleanest examples of “pattern → mechanism” in physics. Students can *see* the patterns (ellipses, equal areas, period–distance scaling), then flip to Newton mode and watch how a single inverse‑square force implies those patterns.

## Learning goals (ASTR 201)

Students should be able to:

- Interpret the orbit shape parameters (**semi-major axis** $a$ and **eccentricity** $e$) and connect them to perihelion/aphelion distances.
- Explain (in words) Kepler’s 2nd law as a statement about **swept area per unit time** and connect it to “faster near perihelion.”
- Use Kepler’s 3rd law ($P^2 \propto a^3$ for fixed central mass) to predict how orbital period changes with $a$.
- In Newton mode, connect vectors to physics: **gravity points toward the star** and **velocity is tangent** to the orbit.
- Recognize that unit systems are conventions: the demo’s “101 vs 201” toggle is a unit conversion layer, not a different physics model.

## 10–15 minute live-teach script (projector)

1. Start in **Kepler Mode** with Earth-like parameters. Ask: *“What’s the ‘shape story’ here?”* Turn on **Foci** and **Apsides** overlays and point out “Sun at a focus.”

2. Turn on **Equal areas**. Ask: *“Where should the planet move fastest?”* Hit Play and then pause near perihelion/aphelion; use the velocity readout.

3. Use a preset with higher eccentricity. Ask: *“What changed: only the shape, or also the timing?”* Connect to the equal-areas wedge.

4. Use **semi-major axis** to increase $a$ by a factor of ~2 and ask for a prediction: *“What happens to $P$?”* Reveal the period readout and connect to the $a^{3/2}$ scaling.

5. Switch to **Newton Mode**. Turn on **Vectors** and narrate the two critical pictures:
   - The **force/acceleration vector** is radial (toward the star).
   - The **velocity vector** is tangent to the path (direction of motion).

6. (Optional) Move the **star mass** slider. Ask: *“If the star is more massive, what happens to the period and the speed?”* Use the readouts to support the sign of the effect.

## Suggested connections to other demos

- **Seasons:** “geometry of an orbit” and “what changes over a year” are different ideas; Kepler’s 2nd law is a useful contrast to the simplified seasons model.
- **Angular size:** both are ratio stories; here the key ratios are $r/a$ and $v$ vs $r$.
- **Binary orbits (ASTR 201 extension):** this demo is the single-body foundation; binaries add center-of-mass motion and two-body geometry.
