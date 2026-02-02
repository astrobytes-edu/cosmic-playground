---
title: "Conservation Laws: Activities"
bundle: "conservation-laws"
section: "activities"
demo_slug: "conservation-laws"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/conservation-laws/](../../play/conservation-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## MW Quick (3–5 min): Bound vs unbound (prediction first)

**Setup (projector):** Default settings ($M=1\,M_\odot$, $r_0=1\,\mathrm{AU}$).

1. Set **speed factor** to **1.00** (circular) and ask: *“Bound or unbound?”*
2. Set **speed factor** to **1.30** and ask: *“Still bound?”*
3. Set **speed factor** to **1.414** (escape) and ask: *“What’s special about this value?”*

**Key takeaway:** the sign of $\varepsilon$ changes at escape.

## MW Short (8–12 min): Why √2?

**Goal:** students discover $v_{\rm esc}=\sqrt{2}\,v_{\rm circ}$ using the demo’s readouts.

1. Keep $M$ and $r_0$ fixed. Record $v_{\rm circ}$ by setting speed factor = 1.
2. Increase the speed factor until the orbit switches to “parabolic (escape).”
3. Compute the ratio $v_{\rm esc}/v_{\rm circ}$ from the speed factor and compare to $\sqrt{2}$.

**Discussion prompt:** *“Why does energy care about speed squared?”* Tie back to $\varepsilon=v^2/2-\mu/r$.

## Friday Lab (20–30+ min): Map orbit type in (speed, direction) space

### Part A: Build a classification map

Students collect a small dataset by varying:

- speed factor $v/v_{\rm circ}$
- direction angle ($0^\\circ$ tangential; near $\\pm 85^\\circ$ radial)

**Deliverable:** a table with columns:

- speed factor
- direction angle
- orbit type (circular / elliptical / parabolic / hyperbolic)
- $e$
- $\varepsilon$
- $h$

### Part B: Claim–Evidence–Reasoning

**Claim:** “Orbit type depends primarily on energy, while closest approach depends strongly on angular momentum.”

**Evidence:** use at least two paired comparisons where speed factor is similar but direction differs, producing noticeably different $h$ and periapsis distance.

**Reasoning:** connect to:

- $\varepsilon = v^2/2 - \mu/r$ (bound vs unbound)
- $h = |\mathbf{r}\times\mathbf{v}|$ (controls periapsis via $p=h^2/\mu$)

## Station version (6–8 min)

> **Station card: Conservation Laws (Orbits) (6–8 minutes)**
> **Setup:** Use $M=1\,M_\odot$ and $r_0=1\,\mathrm{AU}$ (defaults).
>
> **Your station artifact (fill in):**
> 1) **Escape test:** Find the speed factor where the orbit becomes “escape/parabolic” (about $\sqrt{2}$).  
> 2) **Direction check:** Change direction to $60^\circ$. Does the escape speed factor change?  
> 3) **What does change:** At a fixed speed factor, compare $h$ and periapsis $r_p$ at $0^\circ$ vs $60^\circ$.  
> 4) **Explanation (1–2 sentences):** Use “energy sets bound vs unbound” and “angular momentum sets closest approach.”

> **Word bank + sanity checks**
> **Word bank:**
> - **Speed factor ($v/v_{\mathrm{circ}}$):** speed compared to circular speed at the same $r_0$.
> - **Specific energy $\varepsilon$:** determines bound ($\varepsilon<0$) vs escape ($\varepsilon=0$) vs hyperbolic ($\varepsilon>0$).
> - **Angular momentum $h$:** depends on the tangential part of the velocity; it controls how close the orbit swings in ($r_p$).
>
> **Key relationship (specific orbital energy):**
>
> $$\varepsilon=\frac{v^2}{2}-\frac{\mu}{r}$$
>
> **Sanity checks:**
> - Escape happens at:
>
>   $$v_{\mathrm{esc}}=\sqrt{2}\,v_{\mathrm{circ}}$$
>
>   (so speed factor $\approx 1.414$), regardless of direction.
> - Changing direction changes $h$ (and therefore $r_p$), even if the speed magnitude stays the same.
> - “Bound vs unbound” tracks the sign of $\varepsilon$.
