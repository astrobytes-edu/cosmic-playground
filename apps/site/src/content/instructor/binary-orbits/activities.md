---
title: "Binary Orbits — In-Class Activities"
bundle: "binary-orbits"
section: "activities"
demo_slug: "binary-orbits"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/binary-orbits/](/play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/binary-orbits/`
> Main guide: `index.qmd`
> Model deep dive: `model.qmd`

## MW Quick Exploration (3-5 min, pairs)

> **TPS: Does the Sun move?**
> **Think (30 s):** "Does our Sun move because of Jupiter? If so, by how much?"
>
> **Pair (60 s):** Make a prediction: is the Sun's wobble bigger than, smaller than, or about the size of the Sun itself?
>
> **Share (1-2 min):** Use the demo:
> 1) Select the **Sun + Jupiter** preset.
> 2) Turn on the **Barycenter** overlay.
> 3) Note where the barycenter is relative to the Sun's surface.
>
> **Debrief script:** "The Sun-Jupiter barycenter is just outside the Sun's surface. This tiny wobble is measurable via Doppler shift and is how we detect many exoplanets."

## MW Short Investigation (8-12 min, pairs/triads)

> **Investigation: Mass ratio and orbit size**
> **Task:** Use the mass sliders to explore the relationship between mass ratio and orbit sizes.
>
> **Setup:**
> 1) Start with the **Equal Mass** preset ($M_1 = M_2 = 1 M_\odot$).
> 2) Note that both orbits are the same size.
> 3) Gradually increase $M_1$ while keeping $M_2$ fixed.
>
> **Prompts:**
> - What happens to each body's orbit size?
> - Can you find a mass ratio where one orbit is 10× larger than the other?
> - Write a formula relating $a_1/a_2$ to $M_1/M_2$.
>
> **Expected:** $a_1/a_2 = M_2/M_1$ (inverse relationship). The heavier body has the smaller orbit.
>
> **ASTR 201 extension:** Derive this relationship from the center-of-mass definition.

## Friday Astro Lab (20-30+ min, groups of 3-4)

> **Astro Lab: Exoplanet Detection Simulation**
> **Deliverable:** A short lab write-up (table + claim + reasoning).
>
> **Part A (Stellar Wobble):** Choose the Sun + Jupiter preset.
> 1) Record the Sun's orbital velocity (km/s) from the readout.
> 2) Switch to Sun + Earth preset and record the Sun's orbital velocity.
> 3) Fill in the table:
>
> | System | Sun's Orbital Velocity | Planet Mass |
> |--------|------------------------|-------------|
> | Sun + Jupiter | \_\_\_ km/s | $9.5 \times 10^{-4} M_\odot$ |
> | Sun + Earth | \_\_\_ km/s | $3 \times 10^{-6} M_\odot$ |
>
> **Prompt:** "Why is it easier to detect Jupiter than Earth using the radial velocity method?"
>
> **Part B (Binary Stars):** Switch to the Alpha Centauri AB preset.
> 1) Record both stellar velocities and the orbital period.
> 2) Compare to a Hot Jupiter system.
>
> **Claim prompt:** "The radial velocity method is most sensitive to planets that are..."
>
> **ASTR 201 extension:** If we measure $v_1 = 12.5$ km/s for Alpha Cen A and $v_2 = 15.1$ km/s for Alpha Cen B, what is the mass ratio $M_A/M_B$?

> **Astro Lab: Period and Mass Relationship**
> **Task:** Test the generalized Kepler's 3rd Law: $P^2 = a^3/(M_1 + M_2)$
>
> **Setup:**
> 1) Use the Equal Mass preset ($a = 1$ AU, $M_1 = M_2 = 1 M_\odot$).
> 2) Record the period.
> 3) Double the total mass (set $M_1 = M_2 = 2 M_\odot$).
> 4) Record the new period.
>
> **Prediction:** By what factor should $P$ change when $M_{\text{tot}}$ doubles?
>
> **Expected:** $P \propto M_{\text{tot}}^{-1/2}$, so $P$ decreases by $\sqrt{2} \approx 1.41$.
>
> **Verification:** Compare your prediction to the demo readout.

## Station version (for a rotation lab)

> **Station card: Binary Orbits (6–8 minutes)**
> **Controls:** $M_1$, $M_2$, separation $a$, eccentricity $e$  
> **Overlays:** barycenter, velocity vectors
>
> **Your station artifact (fill in):**
> 1) **Observation:** In the Sun + Jupiter system, which body’s orbit is larger? By roughly what factor?  
> 2) **Rule:** Write a relationship between orbit sizes and masses (in words or a ratio).  
> 3) **Prediction:** If you doubled Jupiter’s mass, what would happen to the Sun’s wobble (bigger/smaller, and why)?  
> 4) **Exoplanet connection:** How could an astronomer detect a Jupiter-sized planet using only the star’s light?  
> 5) **Connection sentence:** “This connects to another course idea because…”

> **Word bank + sanity checks**
> **Word bank:**
> - **Barycenter:** the center of mass; both bodies orbit this point.
> - **Mass ratio:** if one mass is larger, the barycenter sits closer to that body.
> - **Orbit size about the barycenter:** the more massive body has the smaller orbit.
> - **Radial velocity method:** detect a planet by measuring the star’s back-and-forth Doppler shift.
>
> **Key relationship (mass vs orbit size):**
>
> $$\frac{a_1}{a_2}=\frac{M_2}{M_1}$$
>
> **Sanity checks:**
> - If $M_1=M_2$, both orbits should be the same size (mirror symmetry).
> - Making the planet more massive increases the star’s wobble (harder pull → larger response).
> - The star’s wobble is usually much smaller than the planet’s orbit.

## Quick Demonstrations (projector, no student work)

> **Demo: Why both bodies move**
> **Setup:** Equal Mass preset, play animation.
>
> **Script:** "Watch both bodies. Neither is stationary - they orbit their common center of mass, the barycenter. This is true for all gravitationally bound systems, from binary stars to the Earth-Moon system."

> **Demo: Stellar wobble for exoplanet detection**
> **Setup:** Sun + Jupiter preset, zoom in on Sun's orbit.
>
> **Script:** "The Sun wobbles due to Jupiter. This wobble is about 13 km/s - measurable via Doppler shift in the Sun's spectrum. This is the radial velocity method for detecting exoplanets."
