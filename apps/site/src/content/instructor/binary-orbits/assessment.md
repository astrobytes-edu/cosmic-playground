---
title: "Binary Orbits — Assessment Bank"
bundle: "binary-orbits"
section: "assessment"
demo_slug: "binary-orbits"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/binary-orbits/](../../play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this bank**
> Each item includes a **demo setup** so you can reproduce the scenario live, plus distractors tied to common misconceptions.

## Clicker questions

> **Clicker 1: Who orbits whom?**
> **Prompt:** In a star-planet system, which statement is most accurate?
>
> A. The planet orbits the star, which stays stationary
> B. Both the star and planet orbit their common center of mass
> C. The star orbits the planet
> D. Neither body moves; they are gravitationally locked in place
>
> **Correct:** B.
>
> **Reasoning:** Newton's 3rd law requires both bodies to feel equal and opposite forces. Both orbit the barycenter.
>
> **Common misconception:** Option A (the "stationary star" misconception). Students often think the more massive body doesn't move.
>
> **Demo setup:** Use the Sun + Jupiter preset and highlight the Sun's small but visible orbit around the barycenter.

> **Clicker 2: Mass ratio and orbit size**
> **Prompt:** In a binary star system, star A has twice the mass of star B ($M_A = 2 M_B$). How do their orbital radii compare?
>
> A. $a_A = 2 a_B$ (heavier star has larger orbit)
> B. $a_A = a_B$ (same orbit size)
> C. $a_A = \frac{1}{2} a_B$ (heavier star has smaller orbit)
> D. Cannot determine without knowing the separation
>
> **Correct:** C.
>
> **Reasoning:** The barycenter divides the separation in inverse ratio to the masses. $a_A/a_B = M_B/M_A = 1/2$.
>
> **Common misconception:** Option A (heavier = larger orbit). Students may confuse orbit size with gravitational influence.
>
> **Demo setup:** Set $M_1 = 2 M_\odot$ and $M_2 = 1 M_\odot$; compare the orbit sizes.

> **Clicker 3: Barycenter position**
> **Prompt:** For the Sun-Jupiter system, the barycenter is located...
>
> A. At the center of the Sun
> B. Between the Sun's center and surface
> C. Just outside the Sun's surface
> D. Halfway between the Sun and Jupiter
>
> **Correct:** C.
>
> **Reasoning:** Jupiter's mass is about $10^{-3} M_\odot$, so the barycenter is about $10^{-3}$ of the way from the Sun to Jupiter. At 5.2 AU separation, that's about 0.005 AU = 750,000 km, just outside the Sun's radius (696,000 km).
>
> **Demo setup:** Use the Sun + Jupiter preset and turn on the Barycenter overlay.

> **Clicker 4: Orbital period relationship**
> **Prompt:** In a binary system, how do the two bodies' orbital periods compare?
>
> A. The heavier body has a shorter period
> B. The lighter body has a shorter period
> C. Both bodies have the same period
> D. The period depends only on the separation, not the masses
>
> **Correct:** C.
>
> **Reasoning:** Both bodies complete one orbit in the same time. They are always on opposite sides of the barycenter.
>
> **Common misconception:** Options A or B (different periods for different masses). Students may confuse orbital speed with orbital period.
>
> **Demo setup:** Use the Equal Mass preset and show both bodies completing orbits together.

## Short answer

> **Short answer 1: Exoplanet detection**
> **Prompt (3-5 sentences):** Explain how astronomers can detect an exoplanet even if they cannot see it directly. Your answer should reference the motion of the host star.
>
> **Answer key (core idea):** The gravitational pull of an orbiting planet causes the host star to wobble around the system's barycenter. This wobble produces a periodic Doppler shift in the star's spectral lines as the star moves toward and away from us. By measuring this radial velocity variation, astronomers can infer the presence of an unseen planet and estimate its minimum mass and orbital period.

> **Short answer 2: Mass determination in binary stars**
> **Prompt:** Astronomers observe a binary star system and measure both stars' orbital radii: $a_A = 2$ AU and $a_B = 3$ AU. What is the mass ratio $M_A/M_B$?
>
> **Expected:** From $a_A/a_B = M_B/M_A$, we get $M_A/M_B = a_B/a_A = 3/2 = 1.5$. Star A is 1.5 times more massive than star B.

> **Short answer 3: Period scaling (ASTR 201)**
> **Prompt:** A binary system has $M_1 = 2 M_\odot$, $M_2 = 1 M_\odot$, and separation $a = 1$ AU. Calculate the orbital period using $P^2 = a^3/(M_1 + M_2)$.
>
> **Expected:** $P^2 = 1^3/(2 + 1) = 1/3$, so $P = \sqrt{1/3} = 0.577$ years $\approx$ 211 days.
>
> **Demo verification:** Set these parameters and compare to the period readout.

## Exit ticket (1 minute)

> **Exit ticket: Why does the Sun wobble?**
> **Prompt:** In one sentence, explain why the Sun wobbles slightly due to Jupiter.
>
> **Expected:** Jupiter's gravitational pull causes the Sun to orbit the Sun-Jupiter barycenter, which lies just outside the Sun's surface.

> **Exit ticket: Inverse relationship**
> **Prompt:** Complete this sentence: "In a binary system, the more massive body has the \_\_\_\_\_\_ orbit because..."
>
> **Expected:** "...smaller orbit because the barycenter is closer to the heavier body" or "...the masses are in inverse ratio to the orbit sizes."

## Misconception diagnosis questions

> **Diagnosis: Where is the barycenter?**
> **Prompt:** A student says, "The barycenter is always at the center of the larger body." How would you use the demo to address this misconception?
>
> **Suggested approach:** Show the Alpha Centauri AB preset where the barycenter is clearly between the two stars, not inside either one. Then show the Sun + Jupiter preset where the barycenter is just outside the Sun's surface.

> **Diagnosis: Different periods?**
> **Prompt:** A student predicts that in a binary system, the lighter star will have a shorter period because it moves faster. Use the demo and physics reasoning to address this.
>
> **Suggested approach:** Show the Equal Mass preset where both stars clearly complete orbits together. Explain that both bodies must stay on opposite sides of the barycenter, so they must have the same period. The lighter body moves faster but has a larger orbit - these effects exactly cancel to give the same period.
