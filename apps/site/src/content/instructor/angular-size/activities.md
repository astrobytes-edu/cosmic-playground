---
title: "Angular Size — In-Class Activities"
bundle: "angular-size"
section: "activities"
demo_slug: "angular-size"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/angular-size/](/play/angular-size/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/angular-size/`  
> Main guide: `index.qmd`  
> Model deep dive: `model.qmd`

## MW Quick Exploration (3–5 min, pairs)

> **TPS: The Sun–Moon coincidence**
> **Think (30 s):** “Which looks larger in the sky: the Sun or the Moon?”  
>
> **Pair (60 s):** Decide whether you expect their angular sizes to differ by a lot, a little, or be about the same.
>
> **Share (1–2 min):** Use the demo:
> 1) Select **Sun** preset → read the angular size.  
> 2) Select **Moon (Today)** preset → read the angular size.  
> 3) Ask: “What does this imply about total solar eclipses?”
>
> **Debrief script:** “It’s a coincidence: the Sun is ~400× larger but also ~400× farther, so the ratios nearly cancel.”

## MW Short Investigation (8–12 min, pairs/triads)

> **Investigation: Scaling without a calculator**
> **Task:** Pick one object (e.g., the Moon preset). Then do three controlled changes and predict first:
>
> 1) Double the distance $D$ (keep diameter fixed).  
> 2) Halve the distance.  
> 3) Double the diameter $d$ (keep distance fixed).
>
> For each, record the angular size and write one proportional-reasoning sentence like: “When $D$ doubles, $\theta$ roughly halves.”
>
> **Expected pattern:** $\theta \propto d/D$ for small angles.

## Friday Astro Lab (20–30+ min, groups of 3–4)

> **Astro Lab: When are total solar eclipses possible?**
> **Deliverable:** A short written claim with evidence + a “future Moon” graph.
>
> **Tip:** Use **Station Mode** to build a data table you can print or copy as CSV.
>
> **Part 1 (evidence table):** Record angular sizes for:
> - Sun
> - Moon (today)
> - Moon at perigee-like and apogee-like settings (orbit mode)
>
> **Part 2 (recession):** Switch to Moon “recession time” mode. Choose two future times (e.g., +500 Myr and +1000 Myr). Record Moon angular size at each.
>
> **Prompt:** “At what point does the Moon become too small to ever fully cover the Sun?”  
>
> **Reasoning cue:** totality requires $\theta_{\text{Moon}} \gtrsim \theta_{\text{Sun}}$ (plus alignment from the eclipse demo).
>
> **ASTR 201 extension (optional):** Compare the exact formula $\theta = 2\arctan(d/2D)$ to the small-angle approximation $\theta\approx d/D$ and estimate the fractional error for the Moon.

## Station version (for the Cosmic Playground capstone rotation)

> **Station card: Angular Size (6–8 minutes)**
> **Demo setup:** Compare **Sun** and **Moon (Today)**; then toggle Moon orbit mode.  
> **Tip:** Click **Station Mode** to add rows and print/copy your table.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** diameter $d$, distance $D$  
> 2) **Observable(s):** angular diameter $\theta$ (°/′/″)  
> 3) **Governing relationship:** write this equation in words:
>
>    $$\theta = 2\arctan\!\left(\frac{d}{2D}\right)$$
> 4) **Sanity check:** what happens to $\theta$ if $D$ doubles?  
> 5) **Connection sentence:** “This matters for eclipses because…”

> **Word bank + sanity checks**
> **Word bank:**
> - **Angular size $\theta$ (degrees/arcmin/arcsec):** how big an object looks on the sky (an angle).
> - **Physical diameter $d$ (km in this demo):** the object’s actual size.
> - **Distance $D$ (km in this demo):** how far the object is from the observer.
> - **Small-angle idea:** larger $d$ → larger $\theta$; larger $D$ → smaller $\theta$.
> - **Unit ladder:** $1^\circ = 60′$ and $1′ = 60″$.
>
> **Sanity checks:**
> - If $D$ doubles, $\theta$ should get about half as big (for small angles).
> - The Sun and Moon have similar angular sizes today, which is why total solar eclipses are possible sometimes.
> - Perigee vs apogee: the Moon’s angular size is slightly larger at perigee than at apogee.
