---
title: "Parallax Distance — Activity Protocols"
bundle: "parallax-distance"
section: "activities"
demo_slug: "parallax-distance"
last_updated: "2026-02-02"
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
2. Point to the two observation points in the diagram (Jan vs July). Ask: *“What baseline are we using?”* (Opposite sides of Earth’s orbit: ~2 AU.)
3. Set $p=1000\,\mathrm{mas}$ (1 arcsec). Ask: *“Is this star near or far?”*
4. Decrease parallax by a factor of 10 to $p=100\,\mathrm{mas}$. **Prediction prompt (10–20 s):** *“What happens to distance?”*
5. Reveal by reading the distance. Say explicitly: **smaller parallax → greater distance**.

## MW Short (8–12 min)

**Type:** Demo-driven (pairs)  
**Goal:** Practice inverse scaling and connect to measurement precision.

### Student worksheet (pairs)
Fill in the table by using the parallax slider and the distance readout:

| Parallax (mas) | Parallax (") | Distance (pc) | Distance (ly) | Signal-to-noise $p/\sigma_p$ |
|--------------:|-------------:|--------------:|--------------:|------------------------------:|
| 1000 |  |  |  |  |
| 100 |  |  |  |  |
| 10 |  |  |  |  |
| 1 |  |  |  |  |

**Instructions:**
1. Keep $\sigma_p=1\,\mathrm{mas}$ at first, then increase it and record how $p/\sigma_p$ changes.
2. Use the diagram to connect the two sightlines to the idea of a baseline and a small angle.

**Synthesis prompt (2 minutes):** *“If we want distances across the whole Milky Way, why can’t parallax be the only method?”*

## Friday Lab (20–30+ min)

**Type:** Demo-driven investigation (small groups)  
**Goal:** Do claim–evidence reasoning about what is measurable and why.

### Driving question
“How far can we directly measure stellar distances with parallax, and what sets the limit?”

### Protocol
1. Pick two uncertainty settings (e.g., $\sigma_p=1\,\mathrm{mas}$ and $\sigma_p=10\,\mathrm{mas}$).
2. For each, find an approximate “reach” distance where the parallax becomes difficult to measure (use $p/\sigma_p\lesssim 1$ as a discussion threshold).
3. Create a short poster (or shared doc) with:
   - Claim: “With $\sigma_p=____$, we can measure out to about ____ pc before $p$ is comparable to the uncertainty.”
   - Evidence: at least 3 parallax settings you tested + their distances + $p/\sigma_p$.
   - Reasoning: connect “tiny angle” to “measurement challenge” (instrument precision).

### Extension (if time)
Use the discussion prompt: *“What if we could observe from Jupiter’s orbit?”* Write one paragraph predicting what would change and what would not.

## Station version (6–8 min)

> **Station card: Parallax Distance (6–8 minutes)**
> **Artifact:** a “parallax card” with one numeric example + one sentence interpretation.
>
> At the station, produce:
> - A chosen distance $d$ (pc) and the corresponding parallax $p$ (in arcsec or mas),
> - One sentence: “Because $p$ decreases as $d$ increases, this star is [near/far] compared to ____.”
> - One note about measurement: “Hipparcos/Gaia can/can’t measure this because ____.”

> **Word bank + sanity checks**
> **Word bank:**
> - **Parallax:** an apparent shift caused by a change in viewpoint (here: Jan vs July).
> - **Parallax angle $p$:** the measured angle; larger $p$ means the star is closer.
> - **Parsec (pc):** defined so that:
>
>   $$d\,(\mathrm{pc})=\frac{1}{p\,(\mathrm{arcsec})}$$
>
> **Sanity checks:**
> - If $d=1\,\mathrm{pc}$, then $p=1\,\mathrm{arcsec}$.
> - If distance increases by $10\times$, parallax should decrease by $10\times$.
> - Distant stars have tiny parallax angles (mas or $\mu\mathrm{as}$).
