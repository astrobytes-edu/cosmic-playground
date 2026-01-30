---
title: "Parallax Distance — Activity Protocols"
bundle: "parallax-distance"
section: "activities"
demo_slug: "parallax-distance"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/parallax-distance/](/play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## MW Quick (3–5 min)

**Type:** Demo-driven  
**Goal:** Make “closer → larger parallax” a prediction students test.

1. Open: `/play/parallax-distance/`
2. Jump between **Jan** and **July** (opposite sides of Earth’s orbit).
3. Set the distance to something nearby (around a few pc). Ask: *“Do you expect the target star to shift a lot or a little?”*
4. Increase the distance by a factor of ~10 on the slider. **Prediction prompt (10–20 s):** *“What happens to the parallax angle?”*
5. Reveal by reading the parallax value (arcsec/mas/µas). Say explicitly: **farther → smaller parallax**.

## MW Short (8–12 min)

**Type:** Demo-driven (pairs)  
**Goal:** Practice inverse scaling and connect to measurement precision.

### Student worksheet (pairs)
Fill in the table by using the distance slider and the parallax readout:

| Distance (pc) | Parallax (") | Parallax (mas) | “Measurable with Hipparcos?” | “Measurable with Gaia?” |
|--------------:|-------------:|---------------:|------------------------------|--------------------------|
| 1 |  |  |  |  |
| 10 |  |  |  |  |
| 100 |  |  |  |  |
| 1000 |  |  |  |  |

**Instructions:**
1. Use the **Hipparcos** / **Gaia** toggle and note when the status indicates measurability changes.
2. Use **Jan**/**July** to connect the readout to the visible shift (geometry → number).

**Synthesis prompt (2 minutes):** *“If we want distances across the whole Milky Way, why can’t parallax be the only method?”*

## Friday Lab (20–30+ min)

**Type:** Demo-driven investigation (small groups)  
**Goal:** Do claim–evidence reasoning about what is measurable and why.

### Driving question
“How far can we directly measure stellar distances with parallax, and what sets the limit?”

### Protocol
1. Pick two instruments in the demo: **Hipparcos** and **Gaia**.
2. For each, find an approximate “reach” distance where the parallax becomes difficult to measure (using the measurability indicator and the readout units).
3. Create a short poster (or shared doc) with:
   - Claim: “Hipparcos reaches to about ____ pc; Gaia reaches to about ____ pc.”
   - Evidence: at least 3 distances you tested + their parallax values + the measurability state.
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
> - If distance increases by 10×, parallax should decrease by 10×.
> - Distant stars have tiny parallax angles (mas or µas).
