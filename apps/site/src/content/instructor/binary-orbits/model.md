---
title: "Binary Orbits — Model & Math (Instructor Deep Dive)"
bundle: "binary-orbits"
section: "model"
demo_slug: "binary-orbits"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/binary-orbits/](/play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/binary-orbits/`
> Model code (tests + shared): `demos/_assets/binary-orbits-model.js`
> UI/visualization code: `demos/binary-orbits/binary-orbits.js`

## What the demo is modeling (big picture)

This demo is a **planar, two-body** gravitational orbit model. Unlike the single-body Kepler's Laws demo, this shows both bodies orbiting their common center of mass (barycenter). It is designed to make these ideas concrete:

- **Barycenter concept:** Both bodies orbit a common point (neither is "stationary")
- **Mass-orbit relationship:** Heavier body has smaller orbit ($a_1/a_2 = M_2/M_1$)
- **Generalized Kepler's 3rd law:** $P^2 = a^3/(M_1 + M_2)$ in solar units
- **Exoplanet detection:** Stellar wobble reveals unseen companions

> **Single source of truth (testable model)**
> The demo loads a shared model module:
>
> - `demos/_assets/binary-orbits-model.js` → `window.BinaryOrbitsModel`
>
> This file is unit tested in Node:
>
> - `tests/binary-orbits-physics.test.js`

## Invariants (must always hold)

The model file documents these invariants:

1. $a_1 + a_2 = a_{\text{rel}}$ — semi-major axes sum to relative separation
2. $a_1/a_2 = M_2/M_1$ — inverse mass ratio for barycentric orbits
3. $P^2 \cdot M_{\text{tot}} = a^3$ — Kepler's 3rd Law in solar units
4. $0 \le e < 1$ — bound orbit requirement
5. $M_1 > 0, M_2 > 0$ — positive masses
6. $a_{\text{rel}} > 0$ — positive separation
7. Both bodies share the same orbital period $P$

## Coordinate convention

The demo places the **barycenter at the origin**. True anomaly $\theta$ is measured with $\theta = 0$ at perihelion. The visualization convention places perihelion to the **left** of the barycenter:

$$x = -r\cos\theta, \qquad y = r\sin\theta$$

Both bodies are always diametrically opposite relative to the barycenter.

## Two-body reduction

### Center of mass (barycenter)

For masses $M_1$ and $M_2$ separated by $a$, the barycenter divides the separation in inverse ratio to the masses:

$$x_{\text{cm}} = \frac{M_2}{M_1 + M_2} \cdot a$$

This gives the distance from $M_1$ to the barycenter. The demo calls this the "barycenter fraction."

In the code: `BinaryOrbitsModel.barycenterFraction({ M1, M2 })`

### Individual orbit sizes

Each body orbits the barycenter with its own semi-major axis:

$$a_1 = a \cdot \frac{M_2}{M_1 + M_2}, \qquad a_2 = a \cdot \frac{M_1}{M_1 + M_2}$$

Note the inverse mass ratio: heavier body ($M_1 > M_2$) has the smaller orbit ($a_1 < a_2$).

> **Geometry sanity checks**
> - If $M_1 = M_2$ (equal masses), then $a_1 = a_2 = a/2$.
> - If $M_2 \ll M_1$ (planet around star), then $a_1 \approx 0$ and $a_2 \approx a$.
> - Always: $a_1 + a_2 = a$ (conservation of separation).

In the code: `BinaryOrbitsModel.individualSemiMajorAu({ aRelAu, M1, M2 })`

## Orbital period (generalized Kepler's 3rd Law)

The orbital period depends on the **total mass** and the **relative separation**:

$$P = 2\pi \sqrt{\frac{a^3}{G(M_1 + M_2)}}$$

In solar units (AU, years, solar masses):

$$P^2 = \frac{a^3}{M_1 + M_2}$$

Both bodies share this same period.

In the code: `BinaryOrbitsModel.orbitalPeriodYr({ aRelAu, M1, M2 })`

## Orbital radius (elliptical orbits)

At true anomaly $\theta$, the orbital radius for each body is:

$$r_i(\theta) = \frac{a_i(1 - e^2)}{1 + e\cos\theta}$$

where $a_i$ is that body's semi-major axis around the barycenter.

> **Radius sanity checks**
> - Perihelion ($\theta = 0$): $r_{\min} = a_i(1 - e)$
> - Aphelion ($\theta = \pi$): $r_{\max} = a_i(1 + e)$
> - Circular orbit ($e = 0$): $r = a_i$ everywhere

In the code: `BinaryOrbitsModel.orbitalRadiusAu({ aAu, e, thetaRad })`

## Orbital velocity (vis-viva equation)

Each body's orbital speed is given by the vis-viva equation applied to its orbit around the barycenter:

$$v_i = \sqrt{G M_{\text{eff},i} \left(\frac{2}{r_i} - \frac{1}{a_i}\right)}$$

where $M_{\text{eff},i}$ is the effective central mass for body $i$'s orbit. For the two-body problem, this reduces to:

$$v_1 = \frac{M_2}{M_1 + M_2} \cdot v_{\text{rel}}, \qquad v_2 = \frac{M_1}{M_1 + M_2} \cdot v_{\text{rel}}$$

In the code: `BinaryOrbitsModel.orbitalVelocityKms({ aRelAu, e, M1, M2, thetaRad })`

## Anomaly conversions

Like the Kepler's Laws demo, animation advances **mean anomaly** uniformly in time, then solves Kepler's equation to recover true anomaly $\theta$.

In the code:
- `BinaryOrbitsModel.trueToMeanAnomalyRad({ thetaRad, e })`
- `BinaryOrbitsModel.meanToTrueAnomalyRad({ meanAnomalyRad, e })`

## What's simplified / not modeled

> **Intentional simplifications**
> - **Planar orbit:** No inclination; both bodies in the same plane.
> - **No precession:** Classical Keplerian ellipses (no GR or tidal effects).
> - **Point masses:** Stellar radii shown for scale but don't affect physics.
> - **No tidal effects:** No Roche lobe overflow or tidal heating.
> - **Teaching time scale:** Speed control is for exploration, not ephemeris accuracy.

## Unit system

| Quantity | Unit | Notes |
|----------|------|-------|
| Mass | $M_\odot$ | Solar masses |
| Distance | AU | Astronomical units |
| Period | years | Sidereal years |
| Velocity | km/s | Display; internal calculations use AU/yr |

Conversion: $1 \text{ AU/yr} = 4.74 \text{ km/s}$
