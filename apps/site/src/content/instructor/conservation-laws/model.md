---
title: "Conservation Laws: Model & Math"
bundle: "conservation-laws"
section: "model"
demo_slug: "conservation-laws"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/conservation-laws/](/play/conservation-laws/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## What the demo computes (in one sentence)

Given an initial position $\mathbf{r}_0$ and velocity $\mathbf{v}_0$ around a central mass, the demo computes the conserved quantities $\varepsilon$ and $h$ and uses them to infer the orbit type (bound vs escape vs flyby).

## The two conserved quantities

### 1) Specific orbital energy

The specific (per unit mass) orbital energy is:

$$\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}$$

Let’s unpack each piece:

- **$\varepsilon$** is specific energy (energy per unit mass)
- **$v$** is the speed (same distance/time units as the demo state)
- **$r$** is the distance from the central mass
- **$\mu$** is the gravitational parameter: $\mu = GM$

What this equation is really saying: kinetic energy per mass ($v^2/2$) competes with gravitational potential per mass ($-\mu/r$). Their sum stays constant in a two‑body Newtonian system.

**Orbit classification from $\varepsilon$:**

- If **$\varepsilon < 0$**, the motion is **bound** (ellipse; includes the circular case).
- If **$\varepsilon = 0$**, the motion is **exactly at escape** (parabola).
- If **$\varepsilon > 0$**, the motion is **unbound** (hyperbola).

### 2) Specific angular momentum

The specific angular momentum is:

$$h = |\mathbf{r}\times\mathbf{v}|$$

Let’s unpack each piece:

- **$h$** is specific angular momentum (per unit mass)
- **$\mathbf{r}$** is the position vector
- **$\mathbf{v}$** is the velocity vector

What this equation is really saying: “sideways motion at large radius” produces large angular momentum. Large $h$ prevents deep plunges; small $h$ allows close approaches.

Dimensional check:

- $\mathbf{r}$ has units of length
- $\mathbf{v}$ has units of length/time
- so $h$ has units of length²/time

✓ Units match.

## Circular vs escape speed (the most teachable relationship)

At a given radius $r$:

$$v_{\rm circ} = \sqrt{\frac{\mu}{r}}$$

$$v_{\rm esc} = \sqrt{\frac{2\mu}{r}}$$

So:

$$v_{\rm esc} = \sqrt{2}\,v_{\rm circ}$$

What this is really saying: escape speed is only about 41% larger than circular speed at the same radius — a powerful intuition for why “a little extra speed” can unbind an orbit.

## How the demo draws the orbit (conic geometry)

The orbit is plotted using the conic-section polar form:

$$r(\nu) = \frac{p}{1 + e\cos\nu}$$

Let’s unpack each piece:

- **$\nu$** is the true anomaly (angle from periapsis)
- **$e$** is eccentricity (shape parameter)
- **$p$** is the semi‑latus rectum

The demo computes:

$$p = \frac{h^2}{\mu}$$

and the eccentricity vector:

$$\mathbf{e} = \frac{\mathbf{v}\times\mathbf{h}}{\mu} - \hat{\mathbf{r}}$$

with $e = |\mathbf{e}|$. The direction of $\mathbf{e}$ points toward periapsis and sets the orbit’s orientation in the plot.

## Units used in this demo

The demo’s UI uses:

- distance in **AU**
- time in **years**

Internally, it uses the teaching normalization:

$$G = 4\pi^2\ \frac{\mathrm{AU}^3}{\mathrm{yr}^2\,M_\odot}$$

So $\mu = GM$ is in AU³/yr², and:

- $\varepsilon$ is in AU²/yr²
- $h$ is in AU²/yr

## What’s simplified / not modeled

- Motion is planar (2D).
- No perturbations (no other planets/stars).
- No relativity.
- The orbit path is drawn from conic geometry; the demo does **not** attempt ephemeris-grade timing along hyperbolic trajectories.
