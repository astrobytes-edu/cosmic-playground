---
title: "Binary Orbits Sandbox"
bundle: "binary-orbits"
section: "index"
demo_slug: "binary-orbits"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Student demo: [/play/binary-orbits/](/play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/binary-orbits/`
> Main code: `demos/binary-orbits/binary-orbits.js`
> Model code (tests + shared): `demos/_assets/binary-orbits-model.js`

> **Where to go next**
> - Model + math + assumptions: `model.qmd`
> - In-class activities (MW quick + Friday lab + station version): `activities.qmd`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.qmd`
> - Future enhancements (planning backlog): `backlog.qmd`

## Why this demo exists

> **Why This Matters**
> Binary orbits reveal that **both bodies move**. Students are often surprised to learn that the Sun wobbles due to Jupiter, and that this wobble is how we detect exoplanets. This demo makes the barycenter concept concrete and connects gravitational physics to observational astronomy.

## Learning goals

### ASTR 101

Students should be able to:

- Recognize that **both bodies orbit the barycenter**, not one around the other
- Explain why heavier bodies have smaller orbits (inverse mass ratio)
- Connect stellar wobble to **exoplanet detection** via the radial velocity method
- Identify the barycenter position for different mass ratios

### ASTR 201

Students should also be able to:

- Derive individual orbit sizes from the center-of-mass condition: $a_1/a_2 = M_2/M_1$
- Apply the generalized Kepler's 3rd law: $P^2 = a^3/(M_1 + M_2)$
- Calculate orbital velocities using the vis-viva equation for each body
- Explain why both bodies share the same orbital period

## 10-15 minute live-teach script (projector)

1. **Start with Sun+Jupiter preset.** Ask: *"Does the Sun move?"* Most students say no. Point out the tiny Sun orbit around the barycenter.

2. **Show the barycenter position.** Use the barycenter overlay. Ask: *"Where is the center of mass for this system?"* It's just outside the Sun's surface for Jupiter.

3. **Switch to Alpha Centauri AB.** Now both orbits are clearly visible. Ask: *"What's different about this system?"* The masses are comparable, so both orbits are substantial.

4. **Use the Equal Mass preset.** Ask: *"If the masses are equal, what do you predict about the orbits?"* They should be identical and opposite.

5. **Explain the inverse relationship.** Use the mass sliders to change $M_2$. Point out that as $M_2$ increases, the $M_1$ orbit gets larger. Connect to the formula $a_1/a_2 = M_2/M_1$.

6. **Connect to exoplanet detection.** Ask: *"If we can't see a planet directly, how might we detect it?"* The star's wobble (measured via Doppler shift) reveals the planet's existence and mass.

7. **(Optional) Increase eccentricity.** Show that both bodies still orbit the barycenter, reaching perihelion and aphelion simultaneously.

## Suggested connections to other demos

- **Kepler's Laws:** Binary orbits is the two-body extension; start with Kepler's Laws for single-body foundations.
- **Doppler/Redshift:** Connect the radial velocity method to spectral line shifts.
- **Stellar Properties:** Binary stars are how we measure stellar masses directly.

## When to use this demo

| Context | Recommended Usage |
|---------|-------------------|
| **ASTR 101 Lecture** | After covering gravity and orbits; emphasize exoplanet detection angle |
| **ASTR 201 Lecture** | After covering two-body problem; use for quantitative predictions |
| **Lab** | Station activity with mass ratio exploration |
| **Exam review** | Clicker questions on barycenter position and period scaling |
