---
title: "Parallax Distance — Activity Protocols"
bundle: "parallax-distance"
section: "activities"
demo_slug: "parallax-distance"
last_updated: "2026-02-09"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/parallax-distance/](../../play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## MW Quick (3–5 min)

**Type:** Demo-driven  
**Goal:** Make “closer → larger parallax” a prediction students test.

1. Open: `/play/parallax-distance/`
2. Point to target direction and parallax axis in the orbit panel. Ask: *“What changes when Earth moves?”* (Line-of-sight.)
3. Set $d_{\rm true}=10\,\mathrm{pc}$, capture A and B, and read $\Delta\theta$ and inferred $\hat d$.
4. Increase distance to $100\,\mathrm{pc}$, repeat captures at similar phases. **Prediction prompt (10–20 s):** *“Will the measured shift be larger or smaller?”*
5. Reveal by comparing readouts. Say explicitly: **smaller inferred parallax → greater inferred distance**.

## MW Short (8–12 min)

**Type:** Demo-driven (pairs)  
**Goal:** Practice inverse scaling and connect to measurement precision.

### Student worksheet (pairs)
Fill in the table by using distance-first captures:

| $d_{\rm true}$ (pc) | Capture phases A/B (deg) | $\Delta\theta$ (mas) | $B_{\rm eff}$ (AU) | $\hat p$ (mas) | $\hat d$ (pc) | $\hat p/\sigma_{\hat p}$ |
|-------------------:|--------------------------:|---------------------:|-------------------:|---------------:|--------------:|-------------------------:|
| 10 | 0 / 180 |  |  |  |  |  |
| 100 | 0 / 180 |  |  |  |  |  |
| 100 | 30 / 150 |  |  |  |  |  |
| 100 | 80 / 100 |  |  |  |  |  |

**Instructions:**
1. Keep $\sigma_p=1\,\mathrm{mas}$ at first, then increase it and record how $\hat p/\sigma_{\hat p}$ changes.
2. Compare cases with similar chord but different $B_{\rm eff}$ to see geometry effects.
3. Use difference mode to interpret the signed A→B shift direction.

**Synthesis prompt (2 minutes):** *“If we want distances across the whole Milky Way, why can’t parallax be the only method?”*

## Friday Lab (20–30+ min)

**Type:** Demo-driven investigation (small groups)  
**Goal:** Do claim–evidence reasoning about what is measurable and why.

### Driving question
“How far can we directly measure stellar distances with parallax, and what sets the limit?”

### Protocol
1. Pick two uncertainty settings (e.g., $\sigma_p=1\,\mathrm{mas}$ and $\sigma_p=10\,\mathrm{mas}$).
2. For each, find an approximate “reach” distance where inference becomes difficult (use $\hat p/\sigma_{\hat p}\lesssim 1$ as a discussion threshold).
3. Create a short poster (or shared doc) with:
   - Claim: “With $\sigma_p=____$, captures with $B_{\rm eff}=____$ are reliable out to about ____ pc.”
   - Evidence: at least 3 capture sets with $\Delta\theta$, $B_{\rm eff}$, $\hat d$, and $\hat p/\sigma_{\hat p}$.
   - Reasoning: connect tiny shifts and weak baseline projection to measurement challenge.

### Extension (if time)
Use the discussion prompt: *“What if we could observe from Jupiter’s orbit?”* Write one paragraph predicting what would change and what would not.

## Station version (6–8 min)

> **Station card: Parallax Distance (6–8 minutes)**
> **Artifact:** one capture-based inference with quality statement.
>
> At the station, produce:
> - A chosen true distance $d_{\rm true}$ and captures A/B,
> - Measured $\Delta\theta$, inferred $\hat p$, inferred $\hat d$,
> - One note: “This estimate is [strong/weak] because $\hat p/\sigma_{\hat p}$ is ____ and $B_{\rm eff}$ is ____.”

> **Word bank + sanity checks**
> **Word bank:**
> - **Parallax:** apparent shift caused by a change in viewpoint.
> - **Measured shift $\Delta\theta$:** detector-space difference between captures.
> - **Effective baseline $B_{\rm eff}$:** baseline component along the parallax axis.
> - **Inferred parallax $\hat p$:** measured quantity used to infer distance.
> - **Parsec (pc):** defined so that:
>
>   $$d\,(\mathrm{pc})=\frac{1}{p\,(\mathrm{arcsec})}$$
>
> **Sanity checks:**
> - If $d=1\,\mathrm{pc}$, then $p=1\,\mathrm{arcsec}$.
> - If distance increases by $10\times$ for similar capture geometry, inferred parallax should drop by about $10\times$.
> - Inference degrades when $B_{\rm eff}$ is tiny, even if capture phases differ.
