---
title: "Seasons — Model & Math (Instructor Deep Dive)"
bundle: "seasons"
section: "model"
demo_slug: "seasons"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/seasons/](../../play/seasons/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/seasons/`  
> Model code: `demos/_assets/seasons-model.js`  
> UI/visualization code: `demos/seasons/seasons.js`

## What the demo is modeling (big picture)

The core “physics” in this demo is geometric. We treat Earth as a tilted sphere and compute how the Sun’s apparent position in the sky changes through the year. The main quantities the demo computes are:

- **Solar declination** $\delta$ (degrees): where the Sun sits north/south of the celestial equator.
- **Day length** $T_{\text{day}}$ (hours): how long the Sun stays above the horizon at a latitude.
- **Noon Sun altitude** $h_\odot$ (degrees): how high the Sun gets at local solar noon.
- **Earth–Sun distance** $r$ (AU): a small, *secondary* seasonal effect shown mainly to confront the “distance causes seasons” misconception.

> **Model parameters as implemented**
> From `demos/_assets/seasons-model.js` (declination/day length/noon altitude):
>
> - March equinox anchor day: `dayOfMarchEquinox = 80` (day-of-year)
> - Tropical year length used in the declination model: `tropicalYearDays = 365.2422` (days)
>
> From `demos/_assets/seasons-model.js` (distance + orbit-angle toy model):
>
> - Eccentricity: `eccentricity = 0.017` (dimensionless)
> - Perihelion anchor day: `perihelionDay = 3` (~ Jan 3)
> - Year length used in the periodic distance/angle functions: `yearDays = 365.2422` (days)
>
> From `demos/seasons/seasons.js` (calendar + visualization):
>
> - Calendar year length used for date wrapping: `YEAR_DAYS = 365` (days; non-leap-year calendar)
> - Physics year length used for distance/orbit display: `TROPICAL_YEAR_DAYS = 365.2422` (days)
> - Perihelion anchor (passed into the model): `PERIHELION_DAY = 3`
>
> The orbit is visually exaggerated for visibility (it is not drawn to scale).

## Solar declination $\delta$ (the key seasonal driver)

The demo uses the standard obliquity geometry:

$$\delta = \arcsin\!\big(\sin\varepsilon \,\sin L\big)$$

Let’s unpack each piece:

- $\delta$ is **solar declination** (degrees). Positive means the Sun is north of the celestial equator.
- $\varepsilon$ is **axial tilt / obliquity** (degrees). For Earth, $\varepsilon \approx 23.5^\circ$.
- $L$ is the Sun’s **ecliptic longitude measured from the March equinox** (radians in the computation).

The demo approximates $L$ as uniformly increasing in time:

$$L \approx 2\pi\,\frac{(\text{dayOfYear} - \text{dayOfMarchEquinox})}{\text{tropicalYearDays}}$$

What this is really saying: tilt matters because it changes the Sun’s north–south position over the year. When $\delta$ is large and positive, the Northern Hemisphere is tilted toward the Sun (more direct sunlight and longer days); when $\delta$ is large and negative, it is tilted away.

> **Declination sanity checks**
> - If $\varepsilon = 0^\circ$, then $\sin\varepsilon = 0$ and $\delta = 0^\circ$ all year → no seasons from tilt.
> - If $\text{dayOfYear} = \text{dayOfMarchEquinox}$, then $L=0$ and $\delta = 0^\circ$ → equinox.
> - The maximum magnitude is $|\delta| \le \varepsilon$ → solstices.

## Day length $T_{\text{day}}$ (hours)

Day length comes from the hour-angle condition at sunrise/sunset (geometric horizon crossing):

$$\cos H_0 = -\tan\phi\,\tan\delta$$

$$T_{\text{day}} = \frac{2H_0}{15^\circ/\text{hour}}$$

Let’s unpack each piece:

- $\phi$ is **observer latitude** (degrees; north positive).
- $\delta$ is **solar declination** (degrees).
- $H_0$ is the **sunrise/sunset hour angle** (degrees): the angular distance in Earth-rotation angle from local noon to sunset.
- $15^\circ/\text{hour}$ is Earth’s rotation rate in angle per time.

What this equation is really saying: when the Sun is far north (positive $\delta$), northern latitudes have the Sun above the horizon for a larger fraction of the day; when the Sun is far south, they have shorter days.

> **Day-length sanity checks**
> - At the equator ($\phi=0^\circ$), $\tan\phi=0$ so $\cos H_0 = 0$ → $H_0 = 90^\circ$ → $T_{\text{day}} = 12\text{ h}$ (always).
> - Near the poles, the formula naturally saturates to 24 h (midnight sun) or 0 h (polar night) when $|\tan\phi\,\tan\delta| > 1$.

## Noon Sun altitude $h_\odot$ (degrees)

The demo uses the standard spherical-geometry relationship for the Sun’s altitude at local solar noon:

$$h_\odot = 90^\circ - \left|\phi - \delta\right|$$

Let’s unpack each piece:

- $h_\odot$ is the Sun’s **altitude above the horizon** at local noon (degrees).
- $\phi$ is latitude; $\delta$ is declination.

What this is really saying: seasons change both **how long** the Sun shines and **how directly** it shines. The noon altitude is a simple proxy for “directness.”

> **Noon-altitude sanity checks**
> - At the equator ($\phi=0^\circ$) on an equinox ($\delta=0^\circ$), $h_\odot = 90^\circ$ (Sun overhead).
> - At $\phi=40^\circ$ on the equinox, $h_\odot \approx 50^\circ$.

## Earth–Sun distance $r$ (AU) (secondary, shown to confront a misconception)

The demo includes a simple distance variation model with eccentricity $e\approx0.017$ and perihelion around day $\approx 3$:

$$r \approx 1 - e\cos\!\left(2\pi\,\frac{(\text{dayOfYear}-\text{perihelionDay})}{\text{tropicalYearDays}}\right)$$

This is *not* intended to be a precise orbital solution; it is there to support the key teaching move: Earth is closest to the Sun in early January, so distance cannot be the main cause of Northern Hemisphere summer.

> **What’s simplified / not modeled**
> - We treat the declination cycle as uniform in time (no equation-of-time effects).
> - We do not model atmospheric refraction, solar disk size, or elevation.
> - We do not compute insolation explicitly; we use day length and noon altitude as interpretable proxies.
> - The globe “terminator” is schematic: it is designed for conceptual clarity, not photorealistic shading.
