---
title: "Conservation Laws: Activities"
bundle: "conservation-laws"
section: "activities"
demo_slug: "conservation-laws"
last_updated: "2026-09-11"
has_math: true
---
> **Navigation**
> - Instructor hub: [All instructor notes](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/conservation-laws/](../../play/conservation-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## MW Quick (3–5 min): Bound vs unbound (prediction first)

**Setup (projector):** Default settings ($M=1\,M_\odot$, $r_0=1\,\mathrm{AU}$).

1. Set **speed factor** to **1.00** (circular) and ask: *“Bound or unbound?”*
2. Set **speed factor** to **1.30** and ask: *“Still bound?”*
3. Press the **Escape** preset (speed factor exactly $\sqrt{2}\approx 1.414$) and ask: *"What's special about this value?"*

**Key takeaway:** the sign of $\varepsilon$ changes at escape.

## MW Short (8–12 min): Why $\sqrt{2}$?

**Goal:** students discover $v_{\rm esc}=\sqrt{2}\,v_{\rm circ}$ using the demo’s readouts.

1. Keep $M$ and $r_0$ fixed. Record $v_{\rm circ}$ by setting speed factor = 1.
2. Increase the speed factor until the orbit type switches from elliptical (1.41) to hyperbolic (1.42), then press **Escape** to see the exact boundary, "parabolic (escape)".
3. Compute the ratio $v_{\rm esc}/v_{\rm circ}$ from the speed factor and compare to $\sqrt{2}$.

**Discussion prompt:** *“Why does energy care about speed squared?”* Tie back to $\varepsilon=v^2/2-\mu/r$.

## MW Short (5–8 min): Where does the orbit turn around?

**Goal:** students read turning points from the effective potential, $\varepsilon = \tfrac{1}{2}v_r^2 + U_{\rm eff}(r)$.

**Setup (projector):** Elliptical preset, stage on **Observatory**.

1. Ask for a prediction: *"Where on this orbit is the body neither approaching nor receding from the Sun?"* Press **Step** a few times and let students point.
2. Switch the stage to **Potential**. The gold line from the energy level $\varepsilon$ down to the curve $U_{\rm eff}(r) = -\mu/r + h^2/(2r^2)$ has length $\tfrac{1}{2}v_r^2$.
3. Step until the gold line vanishes. It vanishes only at $r_p$ and $r_a$, where $v_r = 0$ and the motion is purely tangential.

**Key takeaway:** the body can only be where $U_{\rm eff}(r) \le \varepsilon$, and it turns around where the two are equal. The bottom of the curve, at $r_c = h^2/\mu$, is the circular orbit.

**Discussion prompt:** *"Why does more angular momentum push $r_p$ outward?"* A larger $h$ raises the barrier $h^2/(2r^2)$.

## Friday Lab (20–30+ min): Map orbit type in (speed, direction) space

### Part A: Build a classification map

Students collect a small dataset by varying:

- speed factor $v/v_{\rm circ}$
- direction angle ($0^\circ$ tangential; near $\pm 85^\circ$ radial)

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

## Station version (8–10 min)

> **Station card: Conservation Laws (Orbits) (8–10 minutes)**
> **Setup:** Use $M=1\,M_\odot$ and $r_0=1\,\mathrm{AU}$ (defaults).
>
> **Your station artifact (fill in):**
> 1) **Escape test:** Raise the speed factor until the orbit type changes from elliptical to hyperbolic. Record the last elliptical and first hyperbolic values, then press **Escape** and record the exact value it sets.  
> 2) **Turning points:** On **Elliptical**, predict first: where on the orbit is the body neither approaching nor receding from the Sun? Then switch the stage to **Potential** and press **Step** until the gold line has zero length. Is the body at the $r_p$ label or the $r_a$ label? Find the other place the line vanishes.  
> 3) **Direction check:** Change direction to $60^\circ$. Does the escape speed factor change?  
> 4) **What does change:** At a fixed speed factor, compare $h$ and periapsis $r_p$ at $0^\circ$ vs $60^\circ$.  
> 5) **Explanation (1–2 sentences):** Use “energy sets bound vs unbound”, “angular momentum sets closest approach” and “the orbit turns around where $U_{\rm eff}(r) = \varepsilon$.”

> **Word bank + sanity checks**
> **Word bank:**
> - **Speed factor ($v/v_{\mathrm{circ}}$):** speed compared to circular speed at the same $r_0$.
> - **Specific energy $\varepsilon$:** determines bound ($\varepsilon<0$) vs escape ($\varepsilon=0$) vs hyperbolic ($\varepsilon>0$).
> - **Angular momentum $h$:** depends on the tangential part of the velocity; it controls how close the orbit swings in ($r_p$).
> - **Kinetic $K$ and potential $U$:** they trade places as the body moves; their sum $\varepsilon$ does not change.
> - **Effective potential $U_{\rm eff}(r)$ (Potential view):** the energy landscape. The body can only be where the energy line $\varepsilon$ is above it; the gold line between them is $\tfrac{1}{2}v_r^2$.
>
> **Key relationship (specific orbital energy):**
>
> $$
> \varepsilon=\frac{v^2}{2}-\frac{\mu}{r}
> $$
>
> **Sanity checks:**
> - Escape happens at:
>
>   $$
>   v_{\mathrm{esc}}=\sqrt{2}\,v_{\mathrm{circ}}
>   $$
>
>   (so speed factor $\approx 1.414$; the slider steps from 1.41 to 1.42), regardless of direction.
> - Changing direction changes $h$ (and therefore $r_p$), even if the speed magnitude stays the same.
> - “Bound vs unbound” tracks the sign of $\varepsilon$.
