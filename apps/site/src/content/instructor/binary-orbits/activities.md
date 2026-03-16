---
title: "Binary Orbits — In-Class Activities"
bundle: "binary-orbits"
section: "activities"
demo_slug: "binary-orbits"
last_updated: "2026-02-24"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/binary-orbits/](../../play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/binary-orbits/`
> Main guide: `apps/site/src/content/instructor/binary-orbits/index.md`
> Model deep dive: `apps/site/src/content/instructor/binary-orbits/model.md`

## MW Quick Exploration (3–5 min, pairs)

> **TPS: Does the heavier body move?**
> **Think (30 s):** “If one body is much more massive, does the heavy one still move?”
>
> **Pair (60 s):** Predict what happens to the barycenter as $M_2/M_1$ decreases below 1.
>
> **Share (1–2 min):** Use the demo:
> 1) Set $M_2/M_1 = 1$ and note the barycenter offsets.
> 2) Set $M_2/M_1 = 0.2$ and compare.
>
> **Debrief:** Both bodies move. The barycenter shifts toward the heavier body, and the heavier body’s orbit shrinks.

## MW Short Investigation (8–12 min, pairs/triads)

> **Investigation: mass ratio vs orbit size**
>
> **Setup:** Fix separation at $a = 4$ AU (log slider still active over $0.1\rightarrow100$ AU).
>
> **Task A (barycenter):**
> 1) Record a snapshot for $M_2/M_1 = 1$.
> 2) Record a snapshot for $M_2/M_1 = 0.2$.
> 3) Write a sentence explaining the trend using the idea “center of mass.”
> 4) Use the live Physics integrity card to confirm both snapshots satisfy $a_1+a_2=a$ and $M_1a_1=M_2a_2$.
>
> **Task B (period scaling):**
> 1) Fix $M_2/M_1 = 1$.
> 2) Compare $a = 0.5$ AU vs $a = 8$ AU.
> 3) Use the readout to test the idea that period grows quickly with separation.
>
> **Key relationship (for discussion):**
> $$P^2=\frac{a^3}{M_1+M_2}\qquad(\mathrm{AU}/\mathrm{yr}/M_\odot\ \text{teaching units})$$

## Station version (rotation lab)

Use the printable station card:
- `/stations/binary-orbits/`

## Quick Demonstration (projector)

> **Demo: inverse relationship**
> Set $M_2/M_1=1$, click **Capture current state**, then move to $M_2/M_1=0.2$ (same $a$). Script: “The lighter body gets the larger/faster orbit, but both bodies still share one period.” Use **Compare with current system** after students commit to a trend prediction.
