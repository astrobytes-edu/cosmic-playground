---
title: "Binary Orbits Sandbox"
bundle: "binary-orbits"
section: "index"
demo_slug: "binary-orbits"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/binary-orbits/](../../play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/binary-orbits/`  
> UI markup: `apps/demos/src/demos/binary-orbits/index.html`  
> Demo logic: `apps/demos/src/demos/binary-orbits/main.ts`  
> Physics helper: `packages/physics/src/twoBodyAnalytic.ts`

> **Where to go next**
> - Model + math + assumptions: `apps/site/src/content/instructor/binary-orbits/model.md`
> - In-class activities: `apps/site/src/content/instructor/binary-orbits/activities.md`
> - Assessment bank: `apps/site/src/content/instructor/binary-orbits/assessment.md`
> - Future enhancements: `apps/site/src/content/instructor/binary-orbits/backlog.md`

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

1. **Start at equal masses.** Set $m_2/m_1 = 1$. Ask: *“Where is the barycenter?”* It should sit halfway between the bodies, and the two orbits should be the same size.

2. **Make the system unequal.** Set $m_2/m_1 = 5$. Ask: *“What changes, and what stays the same?”* Emphasize that **both bodies still move**, but the barycenter shifts toward the heavier body and the heavier body’s orbit shrinks.

3. **Connect to the inverse relationship.** Ask students to predict whether $a_1/a_2$ increases or decreases when $m_2/m_1$ increases. Connect to:
   $$\frac{a_1}{a_2}=\frac{M_2}{M_1}.$$

4. **Period scaling.** Change separation $a$ (AU) and observe the period readout. Emphasize that in AU/yr/$M_\odot$ teaching units:
   $$P^2=\frac{a^3}{M_1+M_2}.$$

5. **Exoplanet connection (conceptual).** Ask: *“If a star wobbles, how could we detect it?”* Tie barycentric motion to the radial-velocity idea, even though this simplified instrument does not model Doppler spectra directly.

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
