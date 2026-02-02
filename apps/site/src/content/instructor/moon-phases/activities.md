---
title: "Moon Phases — In-Class Activities"
bundle: "moon-phases"
section: "activities"
demo_slug: "moon-phases"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/moon-phases/](../../play/moon-phases/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/moon-phases/`  
> Main guide: `apps/site/src/content/instructor/moon-phases/index.md`  
> Model deep dive: `apps/site/src/content/instructor/moon-phases/model.md`

## MW Quick Exploration (3–5 min, pairs)

> **TPS: Why is ‘quarter’ half-lit?**
> **Think (30 s):** “Does ‘First Quarter’ mean the Moon is 25% illuminated?”  
>
> **Pair (60 s):** Agree on what “quarter” refers to instead.  
>
> **Share (1–2 min):** Use the demo:
> 1) Jump to **New Moon** and then **First Quarter**.  
> 2) Read the illumination percent.  
> 3) Point at the orbit: “First quarter” is one quarter of the way around the orbit from New Moon.
>
> **Debrief script:** “Quarter is an orbital position label. Illumination is controlled by geometry; at quarter phases, we see half of the lit hemisphere.”

## MW Short Investigation (8–12 min, pairs/triads)

> **Investigation: Build the illumination curve**
> **Task:** Pick 8 angles evenly spaced around the orbit (e.g., $0^\circ$, $45^\circ$, $90^\circ$, $\dots$, $315^\circ$). For each, record:
> - Phase name
> - Illumination (%)
>
> **Prompt:** “How does illumination change with time? Is it linear?”
>
> **Expected pattern:** Illumination changes smoothly but not linearly with angle (it follows a cosine relationship).

> **Share-out (2–3 min)**
> Have one group describe the “shape” of illumination vs time (slow near New/Full, fastest near the quarters). Connect to the cosine in the model.

## Friday Astro Lab (20–30+ min, groups of 3–4)

> **Astro Lab: Phases are geometry, not shadow**
> **Deliverable:** One-page explanation + evidence table.
>
> **Claim (given):** “Moon phases are not caused by Earth’s shadow.”
>
> **Evidence (from the demo):**
> 1) A table showing illumination at the four key phases (use **Station Mode** to export/print).  
> 2) A diagram (sketch) of the Sun–Earth–Moon geometry at New, First Quarter, Full, Third Quarter.  
> 3) One “shadow check”: show that Earth’s shadow points away from the Sun and is only relevant for eclipses, not most phases.
>
> **Reasoning:** Use the “two halves” story: illuminated half is fixed by sunlight; visible half is fixed by where we are; the overlap is the phase.
>
> **Bridge to eclipses (1 sentence):** “Eclipses require New/Full Moon *and* being near a node — phases alone don’t guarantee an eclipse.”

## Station version (for the Cosmic Playground capstone rotation)

> **Station card: Moon Phases (6–8 minutes)**
> **Demo setup:** start at New → First Quarter → Full → Third Quarter.  
> **Tip:** Click **Station Mode** to add key-phase rows and print/copy your table.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** Moon angle $\alpha$  
> 2) **Observable(s):** phase name, illumination fraction $f$  
> 3) **Governing relationship:** write this equation in words:
>
>    $$f=\frac{1+\cos\alpha}{2}$$
> 4) **Sanity check:** what is $f$ at $\alpha=90^\circ$?  
> 5) **Connection sentence:** “This matters for eclipses/totality because…”

> **Word bank + sanity checks**
> **Word bank:**
> - **Phase:** the shape we see from Earth; it’s the overlap of the Moon’s lit half and the half facing Earth.
> - **Illumination fraction $f$ (0–1):** fraction of the visible disk that is lit (0 = New, 1 = Full).
> - **Moon angle $\alpha$ (degrees, this demo):** $0^\circ$ = Full, $180^\circ$ = New; quarter phases are at $90^\circ$ and $270^\circ$.
> - **Waxing:** the illuminated fraction is increasing (after New → toward Full).
> - **Waning:** the illuminated fraction is decreasing (after Full → toward New).
> - **Quarter phase:** about 50% illuminated; “quarter” refers to the orbit position, not the lit fraction.
>
> **Sanity checks:**
> - First/Third Quarter should be about 50% illuminated.
> - New Moon is not “unlit” — the Sun still lights half the Moon; we’re mostly seeing the dark half.
> - Earth’s shadow is not what causes phases (it matters only during eclipses, which are rare).
