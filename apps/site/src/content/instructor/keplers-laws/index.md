---
title: "Cosmic Playground: Kepler’s Laws"
bundle: "keplers-laws"
section: "index"
demo_slug: "keplers-laws"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/keplers-laws/](../../play/keplers-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/keplers-laws/`  
> Main code: `apps/demos/src/demos/keplers-laws/main.ts`  
> UI markup: `apps/demos/src/demos/keplers-laws/index.html`  
> Model code (tested): `packages/physics/src/keplersLawsModel.ts` + `packages/physics/src/twoBodyAnalytic.ts`

> **Where to go next**
> - Model + math + assumptions: `model.md`
> - In-class activities (MW quick + Friday lab + station version): `activities.md`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.md`
> - Future enhancements (planning backlog): `backlog.md`

## Why this demo exists

> **Why This Matters**
> Kepler’s laws are one of the cleanest examples of “pattern → mechanism” in physics. Students can *see* the patterns (ellipses, equal areas, period–distance scaling), then flip to Newton mode and watch how a single inverse‑square force implies those patterns.

## Learning goals (ASTR 201)

Students should be able to:

- Interpret the orbit shape parameters (**semi-major axis** $a$ and **eccentricity** $e$) and connect them to perihelion/aphelion distances.
- Explain (in words) Kepler’s 2nd law as a statement about **swept area per unit time** and connect it to “faster near perihelion.”
- Use Kepler’s 3rd law ($P^2 \propto a^3$ for fixed central mass) to predict how orbital period changes with $a$.
- In Newton mode, predict how period changes with central mass $M$ and verify using readouts.
- Use units consistently (AU, yr, $M_{\odot}$; and speed in km/s in the readout/export).

## 10–15 minute live-teach script (projector)

1. Start with Earth-like parameters. Ask: *“What’s the ‘shape story’ here?”* Turn on **foci + apsides** and point out “Sun at a focus.”

2. Turn on **equal-area slices**. Ask: *“Where should the planet move fastest?”* Use the time slider (or Animate) to compare speed near perihelion vs aphelion.

3. Increase eccentricity $e$. Ask: *“What changed: only the shape, or also the timing?”* Connect to the equal-area slices: same area per equal time, different arc length.

4. Increase semi-major axis $a$ by a factor of ~2 and ask for a prediction: *“What happens to $P$?”* Reveal the period readout and connect to the $a^{3/2}$ scaling.

5. Switch on **Newton mode** and vary the central mass $M$ (in $M_{\odot}$). Ask: *“If the star is more massive, what happens to the period?”* Use the period readout to support the sign of the effect.

## Suggested connections to other demos

- **Seasons:** “geometry of an orbit” and “what changes over a year” are different ideas; Kepler’s 2nd law is a useful contrast to the simplified seasons model.
- **Angular size:** both are ratio stories; here the key ratios are $r/a$ and $v$ vs $r$.
- **Binary orbits (ASTR 201 extension):** this demo is the single-body foundation; binaries add center-of-mass motion and two-body geometry.
