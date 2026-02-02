---
title: "Moon Phases — Model & Math (Instructor Deep Dive)"
bundle: "moon-phases"
section: "model"
demo_slug: "moon-phases"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/moon-phases/](../../play/moon-phases/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/moon-phases/`  
> Demo source: `apps/demos/src/demos/moon-phases/`  
> Demo logic: `apps/demos/src/demos/moon-phases/main.ts`

## What the demo is modeling (big picture)

This demo is a geometric model of **illumination** and **viewing angle**.

- The Sun illuminates exactly **half** of the Moon at all times (ignoring tiny effects like libration and Earthshine).
- From Earth, we see some fraction of that illuminated half depending on the angle between the Sun and Moon in the sky.

The demo reports:

- Phase name (New, Crescent, Quarter, Gibbous, Full)
- Illumination fraction (0–100%)

## Implementation note (current instrument)

In this repo, the current migrated instrument computes illumination directly in:

- `apps/demos/src/demos/moon-phases/main.ts`

It uses the same core equation shown below and formats results for Station Mode + Copy Results via `@cosmic/runtime`.

## Angle convention in this demo

The demo uses a classroom-friendly convention:

- `moonAngle = $0^\circ$` → **Full Moon** (Moon opposite the Sun; right side of the diagram)
- `moonAngle = $180^\circ$` → **New Moon** (Moon toward the Sun; left side of the diagram)
- `moonAngle = $90^\circ$` → **Third Quarter**
- `moonAngle = $270^\circ$` → **First Quarter**

This is a convention for the diagram, not a universal astronomy standard. The important invariant is: the phase depends on the **Sun–Earth–Moon geometry**, not shadows.

## Illumination fraction (the core equation)

The demo uses:

$$f = \frac{1+\cos\alpha}{2}$$

Let’s unpack each piece:

- $f$ is the **fraction of the Moon’s disk that appears illuminated** from Earth (unitless; 0 to 1).
- $\alpha$ is the **phase angle** in the demo’s convention (degrees in the UI; radians inside $\cos$).

What this equation is really saying: at Full Moon ($\alpha=0^\circ$), $\cos\alpha=1$ so $f=1$. At New Moon ($\alpha=180^\circ$), $\cos\alpha=-1$ so $f=0$. At quarter phases ($\alpha=90^\circ$ or $270^\circ$), $\cos\alpha=0$ so $f=1/2$.

> **Illumination sanity checks**
> - $\alpha=0^\circ$ → $f=1$ (Full Moon)
> - $\alpha=180^\circ$ → $f=0$ (New Moon)
> - $\alpha=90^\circ$ or $270^\circ$ → $f=0.5$ (Quarter)

## What’s simplified / not modeled

> **Model limitations (intentional)**
> - No 3D orbital inclination (that belongs in the Eclipse Geometry demo).
> - No rise/set times or sky-map orientation (this demo is about phase geometry only).
> - The phase “shape” rendering is schematic (designed to look right qualitatively, not to be a photometric model).

## Reduced motion behavior (accessibility)

This instrument has no continuous animation loop; it re-renders on control changes and resize. Under `prefers-reduced-motion: reduce`, there is no additional motion to suppress.
