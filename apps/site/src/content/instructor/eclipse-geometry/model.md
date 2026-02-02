---
title: "Eclipse Geometry — Model & Math (Instructor Deep Dive)"
bundle: "eclipse-geometry"
section: "model"
demo_slug: "eclipse-geometry"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/eclipse-geometry/](../../play/eclipse-geometry/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/eclipse-geometry/`  
> Model code: `demos/_assets/eclipse-geometry-model.js`  
> UI/visualization code: `demos/eclipse-geometry/eclipse-geometry.js`

## What the demo is modeling (big picture)

This demo is a geometric model of why eclipses are rare. It combines:

1) **Phase geometry** (New/Full Moon = conjunction/opposition relative to the Sun), and  
2) **Orbital inclination geometry** (the Moon is usually above/below the ecliptic plane).

The demo’s internal state uses **inertial longitudes** (degrees):

- $\lambda_\odot$ = Sun ecliptic longitude (inertial)
- $\lambda_M$ = Moon ecliptic longitude (inertial)
- $\Omega$ = longitude of the ascending node (inertial)

The visualization is drawn in a Sun-fixed way by subtracting $\lambda_\odot$ for display, but the model calculations are done in inertial angles.

## Phase angle (New vs Full)

The demo defines the phase angle:

$$\Delta = (\lambda_M - \lambda_\odot)\ \bmod\ 360^\circ$$

Let’s unpack each piece:

- $\Delta$ is the phase angle (degrees).
- $\Delta = 0^\circ$ corresponds to **New Moon** (conjunction).
- $\Delta = 180^\circ$ corresponds to **Full Moon** (opposition).

In the interactive “live” eclipse check, the demo requires being within a tolerance of exact syzygy (pedagogical):

- `SYZYGY_TOLERANCE_DEG = 5 deg`

In the long-run simulation, New/Full events are treated as exact conjunction/opposition.

## Ecliptic latitude of the Moon (how far above/below the plane)

The key “tilt” calculation is the Moon’s ecliptic latitude $\beta$ (degrees):

$$\beta = \arcsin\!\big(\sin i\ \sin(\lambda_M - \Omega)\big)$$

Let’s unpack each piece:

- $\beta$ is the Moon’s ecliptic latitude (degrees). $|\beta|$ measures “height” above/below the ecliptic plane in angular terms.
- $i$ is the Moon’s orbital inclination (degrees; default ~$5.145^\\circ$ in the demo).
- $\lambda_M-\Omega$ is the angular distance from the ascending node.

What this equation is really saying: the Moon is in the ecliptic plane at the nodes ($\lambda_M=\Omega$ or $\Omega+180^\circ$), and farthest from the plane about $90^\circ$ away from a node.

> **Latitude sanity checks**
> - At the node: $\lambda_M=\Omega$ → $\sin(\lambda_M-\Omega)=0$ → $\beta=0^\circ$.
> - Max magnitude: $|\beta| \le i$.

## Eclipse “how close is close enough?” (shadow geometry)

The demo uses a physically-motivated shadow model (similar triangles). A key second knob is that **Earth–Moon distance** $D_{EM}$ is selectable (held fixed during a run/simulation):

- Earth–Moon distance: $D_{EM}$ (km; perigee/mean/apogee presets)
- Earth radius: $R_E = 6371\ \text{km}$
- Moon radius: $R_M = 1737.4\ \text{km}$
- Sun radius: $R_\odot = 696{,}000\ \text{km}$
- 1 AU: $D_{ES}=149{,}597{,}870.7\ \text{km}$

> **Earth–Moon distance presets in the student demo**
> The student demo provides three presets (km):
>
> - Perigee-like: $363{,}300$
> - Mean: $384{,}400$
> - Apogee-like: $405{,}500$
>
> These are course-appropriate representative values (the real distance varies continuously).

### Umbra and penumbra radii (similar triangles)

At distance $x$ behind the shadowing body (along the anti-solar direction), the model uses:

$$r_{\text{umbra}}(x) = R_{\text{body}} - x\,\frac{(R_\odot - R_{\text{body}})}{D_{ES}}$$

$$r_{\text{pen}}(x) = R_{\text{body}} + x\,\frac{(R_\odot + R_{\text{body}})}{D_{ES}}$$

These are geometric cone formulas: the umbra narrows with distance; the penumbra widens.

### Turning latitude into an “impact parameter”

The model converts a geocentric ecliptic latitude $|\beta|$ into a transverse offset (“miss distance”) at the relevant distance:

$$b \approx D_{EM}\,\sin|\beta|$$

This is the quantity compared to shadow radii.

## Lunar eclipse classification (penumbral vs umbral vs total)

A lunar eclipse happens when the Moon passes through Earth’s shadow at Full Moon. The demo classifies by comparing $b$ to Earth’s shadow radii at the Moon:

- **Total lunar:** $b \le r_{\text{umbra}}(D_{EM}) - R_M$
- **Umbral (partial) lunar:** $r_{\text{umbra}}(D_{EM}) - R_M < b \le r_{\text{umbra}}(D_{EM}) + R_M$
- **Penumbral lunar:** $r_{\text{umbra}}(D_{EM}) + R_M < b \le r_{\text{pen}}(D_{EM}) + R_M$

> **Thresholds at student distance presets (computed by the model)**
> The model computes the maximum allowed geocentric latitude $|\beta|$ for each class via `EclipseGeometryModel.eclipseThresholdsDeg({ earthMoonDistanceKm })`.
>
> At the three student presets (degrees):
>
> | Preset | $D_{EM}$ (km) | Total lunar | Umbral lunar | Penumbral lunar |
> |---|---:|---:|---:|---:|
> | Perigee-like | 363,300 | $0.467^\\circ$ | $1.015^\\circ$ | $1.548^\\circ$ |
> | Mean | 384,400 | $0.427^\\circ$ | $0.944^\\circ$ | $1.478^\\circ$ |
> | Apogee-like | 405,500 | $0.391^\\circ$ | $0.882^\\circ$ | $1.415^\\circ$ |

## Solar eclipse classification (partial vs total vs annular)

A solar eclipse happens at New Moon when the Moon’s shadow reaches Earth. The demo uses:

- **Partial solar:** Earth intersects the Moon’s penumbra somewhere
- **Total solar:** Earth intersects the Moon’s **umbra** (Moon appears larger than the Sun)
- **Annular solar:** Earth intersects the Moon’s **antumbra** (Moon appears smaller than the Sun)

Geometrically, the model checks whether the miss distance $b$ is smaller than the shadow radius at Earth (including Earth’s radius). Then it distinguishes total vs annular by whether the Moon’s umbra cone still has positive radius at $x=D_{EM}$ (umbra reaches Earth) or has already “ended” (antumbra).

> **Thresholds at student distance presets (computed by the model)**
> The model computes the maximum allowed geocentric latitude $|\beta|$ for “central” vs “partial” solar eclipses via `EclipseGeometryModel.eclipseThresholdsDeg({ earthMoonDistanceKm })`.
>
> At the three student presets (degrees):
>
> | Preset | $D_{EM}$ (km) | “Central” window | “Any partial” window |
> |---|---:|---:|---:|
> | Perigee-like | 363,300 | $1.013^\\circ$ | $1.546^\\circ$ |
> | Mean | 384,400 | $0.957^\\circ$ | $1.476^\\circ$ |
> | Apogee-like | 405,500 | $0.921^\\circ$ | $1.413^\\circ$ |

## Time evolution (what moves in the simulation)

The demo evolves inertial longitudes with constant rates:

- Sun: $360^\circ$ per tropical year (365.2422 days)
- Moon: $360^\circ$ per sidereal month (27.321661 days)
- Node: regression period ~18.61 Julian years (westward drift)

The long-run “Simulate Years” feature counts eclipse events at each New Moon and Full Moon time step (synodic month spacing).

## What’s simplified / not modeled

> **Model limitations (intentional)**
> - Earth–Moon distance is selectable, but it is held fixed during a simulation run (we are not solving the Moon’s eccentric orbit).
> - The Moon’s orbital eccentricity and variable speed are ignored.
> - Earth’s orbital eccentricity is ignored (Sun distance is fixed at 1 AU).
> - We classify using geocentric latitude (parallax effects are only approximated via Earth radius in the solar case).
> - The syzygy tolerance in interactive mode is pedagogical, not ephemeris-grade.
