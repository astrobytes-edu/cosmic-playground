---
title: "Binary Orbits — Model & Math (Instructor Deep Dive)"
bundle: "binary-orbits"
section: "model"
demo_slug: "binary-orbits"
last_updated: "2026-02-24"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/binary-orbits/](../../play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/binary-orbits/`
> Demo source: `apps/demos/src/demos/binary-orbits/`  
> Physics helper: `packages/physics/src/twoBodyAnalytic.ts`

## What the demo is modeling (big picture)

This instrument is a **circular, coplanar two-body** teaching model. It exists to make barycentric motion concrete:

- **Both bodies move:** neither mass stays perfectly fixed.
- **The barycenter shifts with mass ratio:** the more massive body has the smaller orbit about the barycenter.
- **The period scales with separation and total mass:** in AU/yr/$M_\odot$ teaching units, $P^2 = a^3/(M_1+M_2)$.

## What the student controls (current instrument)

- Secondary mass ratio $M_2/M_1$ (dimensionless, constrained to $\le 1$)
- Separation $a$ (AU, log scale $0.1\rightarrow100$)
- Motion mode (normalized 20 s cycle vs physical Kepler rate)

In this demo, we hold $M_1 = 1\,M_\odot$ fixed and set $M_2$ via the secondary-ratio slider.

## What the demo reads out

- Barycenter offsets $a_1$ and $a_2$ (AU)
- Orbital speeds $v_1$ and $v_2$ (AU/yr)
- Orbital period $P$ (yr)
- Shared-period cue ($P_1=P_2$)

## Core relationships (units explicit)

### Barycenter geometry

For masses $M_1$ and $M_2$ separated by $a$:

$$a_1 = a \cdot \frac{M_2}{M_1+M_2}, \qquad a_2 = a \cdot \frac{M_1}{M_1+M_2}$$

Sanity checks:
- If $M_1=M_2$, then $a_1=a_2=a/2$.
- If $M_2 \ll M_1$, then $a_1 \approx 0$ and $a_2 \approx a$.

### Period scaling (teaching normalization)

Using $G = 4\pi^2\,\mathrm{AU}^3/(\mathrm{yr}^2\,M_\odot)$:

$$P^2 = \frac{a^3}{M_1 + M_2}$$

## What’s simplified / not modeled (by design)

- Circular orbits only (no eccentricity control).
- Coplanar geometry only (no inclination/precession).
- Not an N-body integrator; this is a conceptual instrument.
