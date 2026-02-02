---
title: "Kepler’s Laws — Model & Math (Instructor Deep Dive)"
bundle: "keplers-laws"
section: "model"
demo_slug: "keplers-laws"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/keplers-laws/](../../play/keplers-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/keplers-laws/`  
> Model code (tested): `packages/physics/src/keplersLawsModel.ts` + `packages/physics/src/twoBodyAnalytic.ts`  
> UI/visualization code: `apps/demos/src/demos/keplers-laws/main.ts`

## What the demo is modeling (big picture)

This demo is a **planar, two-body** Keplerian-orbit model (planet mass negligible; no perturbations). It is designed to make these ideas concrete:

- Orbit geometry (Kepler 1): ellipses with a focus at the star
- Orbit timing (Kepler 2): equal areas in equal times → faster near perihelion
- Period scaling (Kepler 3): $P^2 \propto a^3$ for fixed central mass
- Newton’s mechanism: inverse-square gravity explains the Kepler patterns

> **Single source of truth (testable model)**
> The Kepler orbit math lives in `@cosmic/physics` and is unit tested in `packages/physics/src/*.test.ts`.

## Coordinate convention (important!)

The demo uses true anomaly $\theta$ measured in the orbital plane with $\theta=0$ at **perihelion**. For visualization, we choose a coordinate convention where perihelion is drawn to the **right** of the star:

$$x = r\cos\theta,\qquad y = r\sin\theta$$

This is purely a drawing convention. The physics is in $r(\theta)$ and in how $\theta$ evolves with time.

## Kepler 1: Orbit geometry (ellipse with the star at a focus)

The key geometric quantity is the orbital radius (distance from the star to the planet):

$$r(\theta) = \frac{a(1-e^2)}{1+e\cos\theta}$$

Let’s unpack each piece:

- $r$ is the star–planet distance (**AU** in the demo).
- $a$ is the semi-major axis (**AU**).
- $e$ is eccentricity (dimensionless; $0$ = circle).
- $\theta$ is true anomaly (radians in the math; the UI reports angles in degrees).

> **Geometry sanity checks**
> - If $e=0$, then $r(\theta)=a$ (a circle).
> - Perihelion ($\theta=0$): $r_{\min}=a(1-e)$.
> - Aphelion ($\theta=\pi$): $r_{\max}=a(1+e)$.

In the code:

- `TwoBodyAnalytic.orbitalRadius({ a, e, thetaRad })` (with $a$ and $r$ in AU)
- `KeplersLawsModel.stateAtMeanAnomalyRad(...)` returns $r$ and $(x,y)$ in AU.

## Kepler 2: Timing (equal areas in equal times)

Kepler’s 2nd law is most cleanly stated as:

$$\frac{dA}{dt}=\text{constant}$$

where $A$ is the area swept out by the radius vector from star to planet.

In practice, the demo implements the correct “non-uniform motion” using the standard anomaly relationships. The animation advances **mean anomaly** uniformly in time, then solves Kepler’s equation to recover $\theta$.

### Mean anomaly $M$ and Kepler’s equation

Mean anomaly is linear in time:

$$M(t)=\frac{2\pi}{P}t$$

Kepler’s equation relates mean anomaly $M$ to eccentric anomaly $E$:

$$M = E - e\sin E$$

The demo solves this equation numerically (Newton’s method) to get $E$, then converts to true anomaly $\theta$.

In the code (shared model):

- `TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad, e })`
- `TwoBodyAnalytic.meanToTrueAnomalyRad({ meanAnomalyRad, e })`

> **Timing sanity checks**
> - For $e=0$ (circle), $\theta$ increases uniformly with time (constant speed).
> - For $e>0$, the motion is faster near perihelion and slower near aphelion.

## Kepler 3: Period scaling (AU, years, solar masses)

For a Keplerian orbit around a central mass $M$:

$$P = 2\pi\sqrt{\frac{a^3}{GM}}$$

In the “solar unit” system (with $a$ in AU, $P$ in years, and $M$ in solar masses), this becomes:

$$P^2 = \frac{a^3}{M}$$

The demo uses this solar-units form for the period readout.

## Newton mode: varying the central mass $M$

Newton mode lets students vary $M$ (in $M_{\odot}$) and see how the same orbit size $a$ produces a different period.

### Vis-viva (speed along a Kepler orbit)

$$v = \sqrt{GM\left(\frac{2}{r}-\frac{1}{a}\right)}$$

In this instrument, the model state is computed in AU/yr and the speed is displayed (and exported) in **km/s** via a fixed unit conversion.

## Vectors (Newton mode)

The demo can draw a **velocity** vector that is tangent to the path. (It does not currently draw a force/acceleration vector.)

## What’s simplified / not modeled

> **Intentional simplifications**
> - Planar orbit (no inclination).
> - Two-body Keplerian dynamics (no perturbations, no GR precession).
> - “Time” is a teaching scale: the slider advances mean anomaly uniformly (a time proxy), not a calendar ephemeris.
> - Vectors (when shown) are scaled for visibility (not drawn to physical scale).
