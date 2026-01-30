---
title: "Parallax Distance — Model & Math (Instructor Deep Dive)"
bundle: "parallax-distance"
section: "model"
demo_slug: "parallax-distance"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/parallax-distance/](/play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/parallax-distance/`  
> Model code: `demos/_assets/parallax-distance-model.js`  
> UI/visualization code: `demos/parallax-distance/parallax.js`

## What the demo is modeling (big picture)

This demo models the **geometry of parallax** and nothing else. It is intentionally “physics-light” because the point of parallax is that it is a distance measurement that does **not** require knowing a star’s luminosity, temperature, or composition.

The demo links three representations of the same idea:

- A sky view: the target star shifts relative to a background.
- A top-down view: Earth moves around the Sun, providing a baseline.
- A numeric link: a parallax angle $p$ corresponds to a distance $d$.

## Units + conventions used in the code

The shared model utilities in `demos/_assets/parallax-distance-model.js` use:

- **Distance** in **parsecs** (pc).
- **Parallax angle** in **arcseconds** (").
- **Time** as `yearFraction` (dimensionless): 0 is “January,” 0.5 is “July,” 1.0 wraps back to 0.

The “Earth orbit” in the model is a unit circle (coordinates in “orbit units”), because the demo focuses on how the **angle scales** rather than on a to-scale Solar System diagram.

## Key relationships to foreground (with meaning + units)

### Parallax-distance definition: $d(\text{pc}) = 1/p(\text{arcsec})$

$$d(\text{pc}) = \frac{1}{p(\text{arcsec})}$$

Let’s unpack each piece:

- **$d$** is distance, measured in **parsecs (pc)**.
- **$p$** is the parallax angle, measured in **arcseconds (")**.

What this equation is really saying: parallax is an **inverse** relationship. When a star is 10× farther away, the parallax angle is 10× smaller.

> **Sanity checks**
> - If $p = 1"$, then $d = 1\ \text{pc}$ (this is the definition of a parsec).
> - If $p$ halves, $d$ doubles (inverse scaling).

### Demo visualization link: apparent shift over the year

In the shared model, the demo computes an Earth position on a unit circle
and uses that to generate a sign-changing shift in the sky view:

- `earthPosition(yearFraction)` returns $(\cos 2\pi t,\ \sin 2\pi t)$.
- `apparentShift(yearFraction, parallaxArcsec)` returns $-\cos(2\pi t)\,p$ (in arcseconds).

This implements a simple “largest shift at opposite sides of the orbit” story without needing a full 3D astrometry model.

## Assumptions, limitations, and sanity checks

- The demo treats Earth’s orbit as circular and uses an idealized baseline.
- Background stars are treated as effectively fixed (infinite distance) for the purpose of showing the target star’s shift.
- The on-screen parallax geometry is visually exaggerated so students can *see* the effect at large distances; the numeric readout is the key.
