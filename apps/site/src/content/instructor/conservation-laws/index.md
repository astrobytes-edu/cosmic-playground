---
title: "Conservation Laws: Orbit Shapes"
bundle: "conservation-laws"
section: "index"
demo_slug: "conservation-laws"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/conservation-laws/](../../play/conservation-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/conservation-laws/`  
> Main code: `apps/demos/src/demos/conservation-laws/main.ts`  
> Shared physics: `packages/physics/src/twoBodyAnalytic.ts`  
> Plot helpers: `packages/physics/src/conservationLawsModel.ts`

> **Where to go next**
> - Model + math + assumptions: `model.qmd`
> - In-class activities (MW quick + Friday lab + station version): `activities.qmd`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.qmd`
> - Future enhancements (planning backlog): `backlog.qmd`

## Why this demo exists

> **Why This Matters**
> Students often learn “ellipses, parabolas, and hyperbolas” as disconnected shapes. In orbital mechanics, those shapes are not arbitrary: **they are determined by conservation laws**. This demo makes a single big idea concrete:
>
> > If you know the conserved **specific energy** $\varepsilon$ and **specific angular momentum** $h$, you know the orbit type.
>
> That’s a durable mental model that transfers to escape velocity, bound vs unbound systems, and later to numerical integration (where conservation drift becomes a diagnostic).

## Learning goals

### ASTR 101

Students should be able to:

- Predict whether an object is **bound** (returns) or **unbound** (escapes) based on speed
- Explain why **escape speed is larger than circular speed**
- Describe how “more sideways motion” means **more angular momentum** and therefore a “less radial” trajectory

### ASTR 201 / Mechanics

Students should also be able to:

- Use $\varepsilon = v^2/2 - \mu/r$ to classify bound vs unbound motion
- Use $v_{\rm circ}=\sqrt{\mu/r}$ and $v_{\rm esc}=\sqrt{2\mu/r}$ and explain why $v_{\rm esc}=\sqrt{2}\,v_{\rm circ}$
- Interpret $h = |\mathbf{r}\times\mathbf{v}|$ as the control knob for periapsis distance and areal sweep rate

## 10–15 minute live-teach script (projector)

1. **Start at the default:** $M=1\,M_\odot$, $r_0=1\,\mathrm{AU}$, speed factor $v/v_{\rm circ}=1$, direction $0^\circ$.
   Ask: *“What do you predict the orbit looks like?”* (Most students say “circle.”)

2. **Decrease speed:** set $v/v_{\rm circ}\approx 0.75$.
   Ask: *“Does it still stay at the same radius?”* (No — it becomes elliptical.)

3. **Go to escape:** set $v/v_{\rm circ}=\sqrt{2}\approx 1.414$.
   Ask: *“What changes qualitatively?”* (It no longer returns; it’s the escape boundary.)

4. **Go beyond escape:** set $v/v_{\rm circ}\approx 1.8$.
   Ask: *“What should the orbit do now?”* (Hyperbolic flyby.)

5. **Change direction:** increase the direction magnitude (e.g. $60^\circ$).
   Ask: *“We kept the speed factor similar — why did the closest approach change?”*
   Connect: changing direction changes $h$.

## Suggested connections to other demos

- **Kepler’s Laws:** This demo explains *why* Keplerian orbits take conic shapes in the first place.
- **Binary Orbits:** The relative orbit is set by the same conservation laws (now with $M_1+M_2$).
- **(Future) Numerical Integrators:** Conservation drift becomes a visual test of algorithm quality.
