---
title: "Moon Phases — Model & Math (Instructor Deep Dive)"
bundle: "moon-phases"
section: "model"
demo_slug: "moon-phases"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/moon-phases/](../../play/moon-phases/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/moon-phases/`  
> Model code: `demos/_assets/moon-phases-model.js` (loaded by the demo)  
> UI/visualization code: `demos/moon-phases/moon-phases.js`

## What the demo is modeling (big picture)

This demo is a geometric model of **illumination** and **viewing angle**.

- The Sun illuminates exactly **half** of the Moon at all times (ignoring tiny effects like libration and Earthshine).
- From Earth, we see some fraction of that illuminated half depending on the angle between the Sun and Moon in the sky.

The demo reports:

- Phase name (New, Crescent, Quarter, Gibbous, Full)
- Illumination fraction (0–100%)
- Days since New Moon (using a synodic month)

## Shared model code (single source of truth)

The illumination fraction is computed by a small shared model function:

- `MoonPhasesModel.illuminationFractionFromMoonAngleDeg(angleDeg)`

The student-facing demo loads `demos/_assets/moon-phases-model.js` so the equation used in class discussion and the equation used by the code cannot silently drift apart.

## Angle convention in this demo

The demo uses a classroom-friendly convention:

- `moonAngle = 0°` → **Full Moon** (Moon opposite the Sun; right side of the diagram)
- `moonAngle = 180°` → **New Moon** (Moon toward the Sun; left side of the diagram)
- `moonAngle = 90°` → **Third Quarter**
- `moonAngle = 270°` → **First Quarter**

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

## “Days since New” (mapping phase angle to the synodic month)

The demo uses a synodic month of:

$$P_{\text{syn}} \approx 29.53\ \text{days}$$

and maps angle to time since New Moon by treating the phase cycle as uniform:

$$t_{\text{since new}} \approx \left(\frac{(\alpha-180^\circ)\bmod 360^\circ}{360^\circ}\right)\,P_{\text{syn}}$$

Let’s unpack each piece:

- $t_{\text{since new}}$ is time in days since New Moon.
- The modulo term just means “wrap around the circle.”

What this is really saying: the demo treats the synodic month as evenly spaced in phase. This is good for building intuition, even though real lunar motion is not perfectly uniform.

## What’s simplified / not modeled

> **Model limitations (intentional)**
> - No 3D orbital inclination (that belongs in the Eclipse Geometry demo).
> - No rise/set times or sky-map orientation (this demo is about phase geometry only).
> - The phase “shape” rendering is schematic (designed to look right qualitatively, not to be a photometric model).

## Reduced motion behavior (accessibility)

If a browser reports `prefers-reduced-motion: reduce`, the demo defaults the animation speed to **1×**. Students can still step through phases and manually increase speed; the goal is to avoid surprising rapid motion by default.
