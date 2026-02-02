---
title: "Parallax Distance — Model & Math (Instructor Deep Dive)"
bundle: "parallax-distance"
section: "model"
demo_slug: "parallax-distance"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/parallax-distance/](../../play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/parallax-distance/`  
> Model code (tested): `packages/physics/src/parallaxDistanceModel.ts`  
> UI/visualization code: `apps/demos/src/demos/parallax-distance/main.ts`

## What the demo is modeling (big picture)

This demo models the **geometry of parallax** and nothing else. It is intentionally “physics-light” because the point of parallax is that it is a distance measurement that does **not** require knowing a star’s luminosity, temperature, or composition.

The demo links three representations of the same idea:

- A sky view: the target star shifts relative to a background.
- A top-down view: Earth moves around the Sun, providing a baseline.
- A numeric link: a parallax angle $p$ corresponds to a distance $d$.

## Units + conventions used in the code

The demo uses:

- **Distance** in **parsecs** (pc) and **light-years** (ly).
- **Parallax angle** in **milliarcseconds** (mas) and **arcseconds** (").
- A schematic baseline labeled “Jan ↔ Jul: 2 AU” in the diagram (not to scale; angles are exaggerated for visibility).

## Key relationships to foreground (with meaning + units)

### Parallax-distance definition: $d(\text{pc}) = 1/p(\text{arcsec})$

$$d(\text{pc}) = \frac{1}{p(\text{arcsec})}$$

Let’s unpack each piece:

- **$d$** is distance, measured in **parsecs (pc)**.
- **$p$** is the parallax angle, measured in **arcseconds (")**.

What this equation is really saying: parallax is an **inverse** relationship. When a star is $10\\times$ farther away, the parallax angle is $10\\times$ smaller.

> **Sanity checks**
> - If $p = 1"$, then $d = 1\ \text{pc}$ (this is the definition of a parsec).
> - If $p$ halves, $d$ doubles (inverse scaling).

### Demo visualization link: apparent shift over the year

This demo’s diagram is a **static schematic**: it shows two observation points (Jan and Jul) and the angle between the two sightlines to the star. It is designed to support the core inference step (angle → distance), not to be a full astrometry simulator.

## Assumptions, limitations, and sanity checks

- The demo treats Earth’s orbit as circular and uses an idealized baseline.
- Background stars are treated as effectively fixed (infinite distance) for the purpose of showing the target star’s shift.
- The on-screen parallax geometry is visually exaggerated so students can *see* the effect at large distances; the numeric readout is the key.
