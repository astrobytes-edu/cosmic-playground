---
title: "Station card: binary-orbits"
demo_slug: "binary-orbits"
last_updated: "2026-02-25"
has_math: true
---
**Name:** ________________________________  **Section:** __________  **Date:** __________

**Station:** __________  **Group members:** ________________________________________________

*Goal:* Use the demo to build a constraint-based explanation (prediction + invariants + observable).

> **Station card: Binary Orbits (8–10 minutes)**
> **Controls:** $M_2/M_1$ ($0.01\rightarrow1$), separation $a$ (AU, log scale), inclination $i$ (deg)
> **Readouts:** $a_1$, $a_2$, $v_1$, $v_2$, $\omega$, momentum check, $K_1$, $K_2$, $K$, $U$, $E$, period $P$
>
> **Your station artifact (fill in):**
> 1) **Capture + predict:** click **Capture current state**, then lower $M_2/M_1$ and predict whether $P$, $v_1$, and $a_1$ increase/decrease/same.
> 2) **Compare against the live update:** keep watching the live orbit/readouts, then use **Compare with current system** to record which trends matched.
> 3) **Invariant check:** use “What must be true?” to select all must-hold statements and avoid distractors.
> 4) **Observable link:** set two inclinations (e.g., $i=20^\circ$ and $i=80^\circ$) and compare $K_1$, $K_2$.
> 5) **Energy check:** switch to Energy view, change separation, and describe how $E$ moves with $a$.
> 6) **RV inversion challenge:** measure both amplitudes from the RV panel, compute inferred $q=K_1/K_2$, reveal, and record error.
> 7) **Connection sentence:** “From this instrument, we can infer stellar masses from spectra because …”
> 8) **Integrity check:** use the live Physics integrity card to verify $a_1+a_2=a$, $M_1a_1=M_2a_2$, and $K_1/K_2=q$. Only the unrevealed RV challenge should lock snapshots/Copy Results.

> **Word bank + sanity checks**
> **Word bank:**
> - **Barycentric frame:** center of mass at rest; total linear momentum is zero.
> - **Momentum balance:** $M_1v_1 = M_2v_2$.
> - **Shared angular frequency:** both bodies have one $\omega$, so they share period $P$.
> - **Projected velocity:** radial-velocity amplitude scales as $K = v\sin i$.
> - **Orbital energy (circular):** $E = -\dfrac{G M_1 M_2}{2a}$.
>
> **Must-hold relationships:**
>
> $$a_1 + a_2 = a, \qquad M_1a_1 = M_2a_2, \qquad \frac{v_1}{v_2} = \frac{M_2}{M_1}, \qquad P_1 = P_2.$$
>
> **Sanity checks:**
> - If $M_1=M_2$, then $a_1=a_2$ and $v_1=v_2$.
> - If $M_2 \ll M_1$, then $a_1 \to 0$ (planet limit).
> - If $i\to0^\circ$, then $K_1, K_2 \to 0$ even though the orbit still exists.
