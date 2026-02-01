---
title: "Angular Size — Model & Math (Instructor Deep Dive)"
bundle: "angular-size"
section: "model"
demo_slug: "angular-size"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/angular-size/](/play/angular-size/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/angular-size/`  
> Model code: `demos/_assets/angular-size-model.js`  
> UI/visualization code: `demos/angular-size/angular-size.js`

## What the demo is modeling (big picture)

This demo models **angular diameter** (how large something appears on the sky) from first principles: physical size and distance.

It’s intentionally multi-scale:

- Nearby objects (cm–km; meters to km away)
- Solar system (km objects; $10^5$–$10^9$ km away)
- Galaxies (many light-years away)

The demo reports the angular diameter in a human-friendly unit:

- degrees ($^\circ$), arcminutes ($′$), or arcseconds ($″$)

## Angular diameter (exact)

The demo uses the exact geometric relationship:

$$\theta = 2\arctan\!\left(\frac{D}{2d}\right)$$

Let’s unpack each piece:

- $\theta$ is **angular diameter** (radians in the math; converted to degrees for display).
- $D$ is **physical diameter** (km in the demo’s internal units).
- $d$ is **distance to the object** (km in the demo’s internal units).

What this equation is really saying: angular size depends on a *ratio* $D/d$. If you double the distance, the object looks about half as big.

> **Dimensional analysis**
> Inside the arctangent, $\frac{D}{2d}$ is a ratio of km/km, so it’s unitless (as required for trig functions).

## Inverting the equation (distance from a desired angular size)

Sometimes the teaching question is the inverse one: “If an object has diameter $D$, how far away would it need to be to appear $\theta$ wide?”

Solving the exact equation for $d$ gives:

$$d = \frac{D}{2\tan(\theta/2)}$$

This inversion is implemented in the shared model as:

- `AngularSizeModel.distanceForAngularDiameterDeg({ diameterKm, angularDiameterDeg })`

The demo uses this idea when it sets “perigee-like” and “apogee-like” endpoints for the Moon’s orbit-variation mode from a chosen angular-size range.

## Small-angle approximation (useful for reasoning)

For small angles (most astronomy cases), $\tan x \approx x$ (when $x$ is in radians), so:

$$\theta \approx \frac{D}{d}\quad(\text{radians})$$

This is the mental math version students should take away: angular size scales as $D/d$.

## Angle unit conversions (for classroom fluency)

$$1^\circ = 60′ \qquad\text{and}\qquad 1′ = 60″$$

So:

$$1^\circ = 3600″$$

These conversions are what let students compare “planets (arcseconds) vs Moon (degrees).”

## Moon special modes (orbit vs recession time)

### Mode 1: Orbit variation (perigee ↔ apogee)

The demo includes an orbit-mode control that varies the Moon’s distance between two endpoints chosen to match the course “sanity range”:

- angular diameter $\approx 0.49^\circ$ (small) to $\approx 0.56^\circ$ (large)

Those endpoints imply distances (computed by inverting the exact formula above):

> **Numbers implied by the demo’s orbit range**
> Using $D_{\text{Moon}} = 3474\ \text{km}$:
>
> - $0.56^\circ \Rightarrow d \approx 355{,}436\ \text{km}$ (perigee-like)
> - $0.49^\circ \Rightarrow d \approx 406{,}213\ \text{km}$ (apogee-like)
>
> These are reasonable order-of-magnitude values for the real Moon.

### Mode 2: Recession time (toy linear model)

The demo’s recession-time mode uses a deliberately simple linear model:

$$d(t) = d_0 + vt$$

Let’s unpack each piece:

- $d(t)$ is Moon distance (km)
- $d_0$ is today’s distance (km)
- $v$ is the recession rate (km/Myr in the demo)
- $t$ is time from today (Myr)

The code starts from a commonly quoted present-day mean recession rate:

- $v \approx 3.8\ \text{cm/yr}$

and converts it into km per million years:

$$1\ \text{cm/yr} = 10\ \text{km/Myr} \;\;\Rightarrow\;\; 3.8\ \text{cm/yr} \approx 38\ \text{km/Myr}$$

> **Why this is a ‘toy’ model**
> The real Earth–Moon recession rate varies with time (tidal dissipation depends on ocean basins, etc.). The demo uses a linear model because the teaching goal is scaling: “farther away → smaller angular size.”

## Connection to eclipses (total vs annular)

The *geometric* reason total and annular solar eclipses both exist is an angular-size comparison.

- If the Moon’s angular diameter is **larger** than the Sun’s ($\theta_{\text{Moon}} > \theta_\odot$), then a well-aligned “central” eclipse can be **total** somewhere on Earth (the Moon’s umbra can reach Earth).
- If the Moon’s angular diameter is **smaller** than the Sun’s ($\theta_{\text{Moon}} < \theta_\odot$), then a well-aligned “central” eclipse is **annular** (the umbra ends before Earth; the antumbra reaches Earth).

This is the conceptual bridge to the **Eclipse Geometry** demo: Moon distance changes $\theta_{\text{Moon}}$, which changes whether “central” eclipses are total or annular.

## Sanity-check anchors (built into presets)

Two especially useful reference points for classroom verification:

- Sun at 1 AU: $\theta \approx 0.53^\circ$ (preset: Sun)
- Moon today: $\theta \approx 0.52^\circ$ (preset: Moon)

The “ISS overhead” preset uses:

- diameter $D \approx 0.109\ \text{km}$ (109 m)
- distance $d \approx 420\ \text{km}$

which puts it around the arcminute scale.
