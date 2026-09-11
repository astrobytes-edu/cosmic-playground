---
title: "Hydrostatic Equilibrium Explorer"
bundle: "hydrostatic-equilibrium-explorer"
section: "index"
demo_slug: "hydrostatic-equilibrium-explorer"
last_updated: "2026-03-18"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Student demo: [Student demo](../../play/hydrostatic-equilibrium-explorer/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/hydrostatic-equilibrium-explorer/`  
> Target model code: `packages/physics/src/hydrostaticEquilibriumModel.ts`  
> Target demo shell: `apps/demos/src/demos/hydrostatic-equilibrium-explorer/main.ts`

> **Where to go next**
> - Model + math + assumptions: `model.md`
> - In-class activities: `activities.md`
> - Assessment bank: `assessment.md`
> - Planning backlog: `backlog.md`

## Why this demo exists

This demo gives students a concrete way to reason through the stellar structure chain:
gravity demands a pressure gradient, the pressure gradient sets a pressure scale height, the ideal gas law turns that balance into a temperature scale, and the core temperature becomes an inference instead of a mystery number.

The pedagogical target is not memorizing the hydrostatic equation. It is learning to ask, “If the star is heavier, smaller, or chemically different, what must the interior do to stay in balance?”

## Learning goals

- Explain hydrostatic equilibrium as a local balance, not a static object.
- Read pressure scale height as a length scale for how quickly support changes with radius.
- Use the ideal gas law to connect composition and temperature at fixed pressure.
- Infer how core temperature scales with $M/R$ in an order-of-magnitude way.
- Use readouts and sanity checks to justify one physical claim.

## 10-15 minute live-teach script

1. Start with the balanced baseline and ask: *“What would have to change for gravity to win?”* Let students name mass, radius, and composition before moving any control.

2. Increase mass at fixed radius. Point to the steeper pressure gradient and ask: *“What happened to the pressure scale height?”* Surface the idea that stronger gravity forces a shorter scale height.

3. Shrink the radius at fixed mass. Ask: *“Does the same pressure now have to support more weight per unit area?”* Connect that to the core-temperature estimate.

4. Change $\mu$. Ask: *“If the same density has fewer particles per gram, what happens to the temperature required for the same pressure?”* Use the ideal gas readout to close the loop.

5. Finish with a one-sentence explanation: gravity, scale height, and ideal-gas closure are the whole story the demo is trying to build.

## Common misconceptions

- “Hydrostatic equilibrium means nothing is happening.”  
  Counter: it means the net force is near zero, not that pressure or gravity disappear.

- “Pressure only matters at the center.”  
  Counter: the whole point of the pressure gradient is that support is distributed through the star.

- “A larger core temperature is measured directly.”  
  Counter: the demo uses balance plus an equation of state to infer a scale.

## What to notice / readouts

- Gravity readout in cm s$^{-2}$ or equivalent local support units.
- Pressure scale height $H_P$ in cm or km.
- Pressure gradient or balance indicator as a sign of under-support or over-support.
- Mean molecular weight $\mu$ and its effect on the ideal-gas temperature estimate.
- Core temperature $T_c$ in K as an inferred scale.

## Related pages

- [Activities](#activities)
- [Assessment](#assessment)
- [Model notes](#model)
- [Backlog](#backlog)
