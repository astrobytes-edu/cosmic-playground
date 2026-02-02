---
title: "Eclipse Geometry — In-Class Activities"
bundle: "eclipse-geometry"
section: "activities"
demo_slug: "eclipse-geometry"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/eclipse-geometry/](../../play/eclipse-geometry/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/eclipse-geometry/`  
> Main guide: `apps/site/src/content/instructor/eclipse-geometry/index.md`  
> Model deep dive: `apps/site/src/content/instructor/eclipse-geometry/model.md`

## MW Quick Exploration (3–5 min, pairs)

> **TPS: Two conditions, not one**
> **Think (30 s):** “Which is more important for a solar eclipse: New Moon, or being near a node?”  
>
> **Pair (60 s):** Decide whether either condition alone is sufficient.
>
> **Share (1–2 min):** Use the demo:
> 1) Click **New Moon** (phase correct) but keep the Moon away from nodes → no eclipse.  
> 2) Drag the Moon near a node but away from New/Full → no eclipse.  
> 3) Do both → eclipse.
>
> **Debrief script:** “Eclipses are constrained by *two* geometric conditions: phase + node proximity.”

## MW Short Investigation (8–12 min, pairs/triads)

> **Investigation: Eclipse seasons are clusters**
> **Task:** Use **Animate 1 Year** (or run a ~10-year sim on Normal speed) and record the *times* when eclipses occur.
>
> **Prompt:** “Do eclipses happen evenly spaced, or in clusters? How far apart are the clusters?”
>
> **Expected pattern:** Eclipses cluster in seasons separated by about half a year (because the Sun must be near a node for New/Full to line up with the plane crossing).

> **Share-out (2–3 min)**
> Ask groups to report “how many eclipses per season” and “roughly how far apart seasons are.” Then connect back to the node geometry and the Sun’s motion around the ecliptic.

## Friday Astro Lab (20–30+ min, groups of 3–4)

> **Astro Lab: How does orbital tilt control eclipse frequency?**
> **Deliverable:** A short report (table + claim + reasoning).
> **Tip:** Use **Station Mode** to record cases and export/print your table.
>
> **Setup:** Assign each group a tilt value (e.g., $0^\circ$, $2^\circ$, $5^\circ$, $8^\circ$).
>
> **Task:** For your tilt:
> 1) Run a **100-year** simulation (or 10 years if time is tight).  
> 2) Record counts for solar and lunar eclipses (including penumbral).  
> 3) Describe how eclipse seasons change as tilt increases.
>
> **Claim prompt:** “Increasing tilt makes eclipses [more/less] frequent because…”
>
> **Reasoning cue:** the node window in longitude narrows as the inclination increases (harder to stay close to the plane at syzygy).
>
> **ASTR 201 extension (optional):** Use the ecliptic latitude equation $\beta=\arcsin(\sin i\sin(\lambda-\Omega))$ to explain why the maximum possible $|\beta|$ is $i$.

## Station version (for the Cosmic Playground capstone rotation)

> **Station card: Eclipse Geometry (6–8 minutes)**
> **Demo setup:** Use **New Moon** and **Full Moon** buttons; drag near/far from nodes.  
> **Tip:** Click **Station Mode** to add snapshot rows and print/copy your table.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** phase angle $\Delta$, node proximity (nearest-node distance or $|\beta|$), tilt $i$  
> 2) **Observable(s):** eclipse type (none/partial/central; penumbral/umbral/total)  
> 3) **Governing relationship:** write “eclipse requires syzygy + small $|\beta|$” in words  
> 4) **Sanity check:** what happens when $i=0^\circ$?  
> 5) **Connection sentence:** “This connects to angular size because…”

> **Word bank + sanity checks**
> **Word bank:**
> - **Syzygy:** Sun–Earth–Moon aligned (New Moon for solar eclipses; Full Moon for lunar eclipses).
> - **Node:** where the Moon’s orbit crosses the ecliptic plane.
> - **Ecliptic latitude $\beta$ (degrees):** how far the Moon is above/below the ecliptic plane.
> - **Inclination $i$ (degrees):** tilt of the Moon’s orbit relative to the ecliptic plane.
> - **Near a node:** small $|\beta|$ (and/or small “nearest node” distance) at syzygy.
>
> **Sanity checks:**
> - You need BOTH: (1) New/Full Moon and (2) near a node (small $|\beta|$). One condition alone is not enough.
> - If $i=0^\circ$, then $\beta=0^\circ$ always → eclipses happen every month.
> - Changing Earth–Moon distance can change whether a solar eclipse is total or annular (size matters too).
