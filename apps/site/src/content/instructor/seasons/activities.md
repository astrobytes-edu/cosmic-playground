---
title: "Seasons — In-Class Activities"
bundle: "seasons"
section: "activities"
demo_slug: "seasons"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/seasons/](../../play/seasons/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/seasons/`  
> Main guide: `apps/site/src/content/instructor/seasons/index.md`  
> Model deep dive: `apps/site/src/content/instructor/seasons/model.md`

## MW Quick Exploration (3–5 min, pairs)

> **TPS: Distance vs tilt (fast misconception check)**
> **Think (30 s):** “If Earth is closer to the Sun, should it be summer everywhere on Earth?”  
>
> **Pair (60 s):** Decide what the Southern Hemisphere’s season *must* be if the Northern Hemisphere is in summer.  
>
> **Share (1–2 min):** Use the demo to check the prediction:
> 1) Click **June Solstice** → point out “Season (North)” vs “Season (South)”.  
> 2) Read the **Earth–Sun Distance** value and ask: “Is this the *minimum* distance of the year?”  
> 3) Click **December Solstice** and compare distance again.
>
> **Debrief script:** “Distance changes a little, but the hemispheres are opposite. That single fact tells us distance cannot be the driver of seasons.”

## MW Short Investigation (8–12 min, pairs/triads)

> **Investigation: What actually changes between seasons?**
> **Setup:** Keep **Axial Tilt = $23.5^\\circ$**. Assign each group a latitude (e.g., $0^\\circ$, $23.5^\\circ$, $40^\\circ$, $66.5^\\circ$, $80^\\circ$).
>
> **Task:** For your latitude, record these readouts at:
> - March equinox
> - June solstice
> - September equinox
> - December solstice
>
> Record:
> - Day length (hours)
> - Noon Sun altitude (degrees)
>
> **Prompt:** “Which of these two changes matters more for warming: longer days or higher noon altitude?”
>
> **Expected pattern:** As latitude increases, the *swing* in both day length and noon altitude gets larger (eventually reaching 24 h / 0 h extremes).

> **Share-out (2–3 min)**
> Each group reports one sentence: “At latitude $\phi$, summer vs winter changes day length by ___ and noon altitude by ___.” Then we summarize: tilt changes *both* “how long” and “how direct.”

## Friday Astro Lab (20–30+ min, groups of 3–4)

> **Astro Lab: Build an evidence-based seasons explanation**
> **Deliverable:** One-page CER (Claim–Evidence–Reasoning) or concept map.
>
> **Claim (given):** “Axial tilt is the primary cause of seasons on Earth.”
>
> **Evidence (from the demo):**
> 1) A data table for one latitude showing day length and noon altitude at the four anchor dates (use **Station Mode** to export/print).
> 2) A “tilt = $0^\\circ$” control test showing the seasonal cycle collapses.
> 3) A short note showing perihelion is in early January and therefore distance cannot explain Northern Hemisphere summer.
>
> **Reasoning:** Use the model language: connect the observed changes to declination $\delta$, and connect $\delta$ to tilt $\varepsilon$.
>
> **ASTR 201 extension (optional):** Explain (in words) why the sunrise/sunset condition becomes $\cos H_0 = -\tan\phi\tan\delta$, and how that produces 24 h/0 h behavior near the poles.

## Station version (for the Cosmic Playground capstone rotation)

> **Station card: Seasons (6–8 minutes)**
> **Demo setup:** defaults → then click **June Solstice** and **December Solstice**.  
> **Tip:** Click **Station Mode** to add anchor-date rows and print/copy your table.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** tilt $\varepsilon$, day of year, latitude $\phi$  
> 2) **Observable(s):** day length, noon altitude, season labels  
> 3) **Governing relationship:** write one sentence connecting $\varepsilon$ → $\delta$ → day length  
> 4) **Sanity check:** what happens when $\varepsilon=0^\circ$?  
> 5) **Connection sentence:** “This matters for eclipses/phases because…”

> **Word bank + sanity checks**
> **Word bank:**
> - **Axial tilt $\varepsilon$ (degrees):** tilt of Earth’s spin axis relative to its orbital plane.
> - **Solar declination $\delta$ (degrees):** the Sun’s “latitude” on the sky; it sets where the noon Sun is highest.
> - **Noon altitude (degrees):** the Sun’s height above the horizon at local noon.
> - **Day length (hours):** total daylight time in a day at a latitude.
> - **Equinox:** $\delta \approx 0^\circ$; day and night are about equal.
> - **Solstice:** $|\delta|$ is largest; one hemisphere has its longest day and highest noon Sun.
>
> **Sanity checks:**
> - If $\varepsilon=0^\circ$, then $\delta=0^\circ$ all year → day length stays about 12 h (no seasons).
> - June vs December: at the same latitude, the hemisphere facing the Sun has longer days and a higher noon Sun.
> - Perihelion is in early January, so Earth–Sun distance does not line up with Northern Hemisphere summer.
