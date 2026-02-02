---
title: "Kepler’s Laws — In-Class Activities"
bundle: "keplers-laws"
section: "activities"
demo_slug: "keplers-laws"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/keplers-laws/](../../play/keplers-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/keplers-laws/`  
> Main guide: `index.qmd`  
> Model deep dive: `model.qmd`

## MW Quick Exploration (3–5 min, pairs)

> **TPS: Where is the planet fastest?**
> **Think (30 s):** “At which point in an elliptical orbit is the planet moving fastest: perihelion or aphelion?”
>
> **Pair (60 s):** Give a *physical* reason (not just “because the demo says so”).
>
> **Share (1–2 min):** Use the demo:
> 1) Turn on **Apsides**.  
> 2) Increase eccentricity (try a high‑$e$ preset).  
> 3) Press Play and pause near perihelion vs aphelion; compare the velocity readout.
>
> **Debrief script:** “Kepler 2 is really a timing law: equal areas in equal times. That forces higher speed at smaller $r$.”

## MW Short Investigation (8–12 min, pairs/triads)

> **Investigation: Period scaling with semi-major axis**
> **Task:** Use two different $a$ values (e.g., $a=1$ AU and $a=4$ AU) at the same star mass.
>
> **Prompt:** “If $a$ increases by a factor of 4, by what factor should $P$ increase?”
>
> **Expected:** $P \propto a^{3/2}$, so $P$ should increase by $4^{3/2}=8$.
>
> **Demo setup:** Keep $M=1$ (default), change $a$, and read the period.

## Friday Astro Lab (20–30+ min, groups of 3–4)

> **Astro Lab: Kepler’s laws → Newton’s law**
> **Deliverable:** A short lab write-up (table + claim + reasoning).
>
> **Part A (Kepler):** Choose an eccentric orbit (e.g., $e\sim0.6$). Turn on **Equal areas** and record:
> - A screenshot near perihelion (wedge shape + readouts)
> - A screenshot near aphelion (wedge shape + readouts)
>
> **Prompt:** “How can the wedge area stay the same while the wedge shape changes?”
>
> **Part B (Newton):** Switch to **Newton Mode** and turn on **Vectors**.
> Record at the same two points:
> - direction of the force vector (always toward the star)
> - direction of the velocity vector (tangent to the path)
>
> **Claim prompt:** “Newton’s inverse-square gravity produces Kepler’s laws because…”
>
> **ASTR 201 extension:** Use vis-viva to predict the ratio $v_{\text{peri}}/v_{\text{aph}}$ from $r_{\min}$ and $r_{\max}$, then compare to the demo’s readouts.

## Station version (for a rotation lab)

> **Station card: Kepler’s Laws (6–8 minutes)**
> **Controls:** $a$, $e$ (and in Newton mode: $M$)  
> **Overlays:** foci, apsides, equal areas, vectors
>
> **Your station artifact (fill in):**
> 1) **Observation:** where is the planet fastest (perihelion or aphelion)?  
> 2) **Kepler law:** explain using “equal areas in equal times.”  
> 3) **Geometry:** identify perihelion and aphelion in the orbit.  
> 4) **Scaling:** if $a$ doubles (same $M$), what happens to $P$ (longer/shorter, and why)?  
> 5) **Connection sentence:** “This connects to another course idea because…”

> **Word bank + sanity checks**
> **Word bank:**
> - **Semi-major axis $a$ (AU):** the orbit’s size scale.
> - **Eccentricity $e$ (unitless):** orbit shape (0 = circle; larger = more stretched).
> - **Perihelion / aphelion:** closest / farthest point from the star.
> - **Kepler 2:** equal areas in equal times (a timing law → speed changes).
> - **Kepler 3:** bigger orbits have longer periods (for the same central mass).
>
> **Key relationship (period scaling):**
>
> $$P \propto a^{3/2}$$
>
> **Sanity checks:**
> - If $e=0$, speed should be constant around the orbit.
> - For an ellipse, the planet should move fastest at perihelion.
> - Increasing $a$ should increase the period $P$.
