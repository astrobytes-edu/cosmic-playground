---
title: "Station card: conservation-laws"
demo_slug: "conservation-laws"
last_updated: "2026-09-11"
has_math: true
---
**Name:** ________________________________  **Section:** __________  **Date:** __________

**Station:** __________  **Group members:** ________________________________________________

*Goal:* Use the demo to make a claim supported by (1) at least one number/readout and (2) at least one sanity check.

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
