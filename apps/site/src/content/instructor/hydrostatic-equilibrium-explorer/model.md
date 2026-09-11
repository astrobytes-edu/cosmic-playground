---
title: "Hydrostatic Equilibrium Explorer — Model & Math (Instructor Deep Dive)"
bundle: "hydrostatic-equilibrium-explorer"
section: "model"
demo_slug: "hydrostatic-equilibrium-explorer"
last_updated: "2026-03-18"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Back to guide: [Guide](#index)
> - Student demo: [Student demo](../../play/hydrostatic-equilibrium-explorer/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## Core support chain

The teaching goal is to move from a force-balance statement to a temperature scale:

$$
\frac{dP}{dr} = -\frac{G M(r)\rho(r)}{r^2}
$$

where $P$ is pressure, $r$ is radius, $G$ is the gravitational constant, $M(r)$ is enclosed mass, and $\rho(r)$ is local density.

The companion mass-continuity relation is:

$$
\frac{dM}{dr} = 4\pi r^2 \rho(r)
$$

Together these say that the required pressure gradient is set by the mass already inside the shell.

## Pressure scale height

The pressure scale height is the local distance over which pressure changes by a factor of $e$:

$$
H_P = -\left(\frac{d\ln P}{dr}\right)^{-1} = \frac{P}{\rho g}
$$

with

$$
g = \frac{G M(r)}{r^2}
$$

This is the best bridge between “gravity got stronger” and “the star needs a steeper internal profile.”

## Ideal gas closure

For the pedagogical closure used in this demo:

$$
P = \frac{\rho k_B T}{\mu m_u}
$$

so

$$
T = \frac{\mu m_u}{k_B}\frac{P}{\rho} = \frac{\mu m_u}{k_B} g H_P
$$

This is the key interpretive move: if the model shows a shorter scale height at similar density, the temperature scale has to respond.

## Core-temperature estimate

A one-zone estimate for the core temperature should be presented as a scaling relation, not as an exact stellar-structure solution:

$$
T_c \sim C\,\frac{\mu m_u}{k_B}\frac{G M}{R}
$$

where $C$ is an order-unity structure factor that depends on the chosen density profile and boundary condition.

Useful instructor language:

- “The demo is showing the *support temperature scale*, not a nuclear-burning calculation.”
- “The exact value depends on structure, but the scaling with $\mu M/R$ is the physical takeaway.”
- “Hydrostatic equilibrium is local; it does not require flat pressure or zero pressure.”

## What the demo should not imply

- It should not imply the star is literally static in every sense; hydrostatic equilibrium is a force balance, not a motion detector.
- It should not imply the core temperature is directly observed.
- It should not collapse composition into a vague modifier; $\mu$ must explicitly change the ideal-gas temperature inference.

## Recommended sanity checks during class

- If $M$ rises at fixed $R$, then the required support should rise and $H_P$ should shrink.
- If $R$ shrinks at fixed $M$, then $g$ should rise roughly like $R^{-2}$ at the surface scale.
- If $\mu$ increases, the same pressure requires a higher temperature.
- A balanced state should still have a nonzero $\frac{dP}{dr}$.
- The core-temperature estimate should move in the same direction as $M/R$.

## Simplified assumptions to state explicitly

- Spherical symmetry.
- 1D radial structure.
- Snapshot balance, not time-dependent collapse or expansion.
- Ideal-gas closure for the temperature inference.
- No nuclear burning, transport, rotation, or magnetic fields in the core inference loop.
