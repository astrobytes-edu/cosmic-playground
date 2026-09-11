---
title: "Retrograde Motion — Model & Math (Instructor Deep Dive)"
bundle: "retrograde-motion"
section: "model"
demo_slug: "retrograde-motion"
last_updated: "2026-09-04"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/retrograde-motion/](../../play/retrograde-motion/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/retrograde-motion/`
> Physics model: `packages/physics/src/retrogradeMotionModel.ts`
> Demo logic: `apps/demos/src/demos/retrograde-motion/main.ts`
> Physics review: `docs/reviews/retrograde-motion.md`

## What the demo is modeling (big picture)

Two planets orbit the Sun on fixed, coplanar Keplerian ellipses. At each instant the demo computes the **direction from the observer planet to the target planet** and plots how that direction changes with time. Retrograde motion is not put in anywhere; it emerges.

That is the pedagogical point worth stating to a class: nothing in the source code is called "retrograde". The model computes a direction between two moving points, and the reversal appears on its own.

## Orbital elements

Each planet uses JPL approximate elements for the interval 1800 to 2050 (Standish, Table 1), taken from `https://ssd.jpl.nasa.gov/planets/approx_pos.html`:

| Planet | $a$ (AU) | $e$ | Longitude of perihelion (deg) | Mean longitude at epoch (deg) |
| --- | --- | --- | --- | --- |
| Venus | 0.72333566 | 0.00677672 | 131.60 | 181.98 |
| Earth | 1.00000261 | 0.01671123 | 102.94 | 100.46 |
| Mars | 1.52371034 | 0.09339410 | 336.06 | 355.45 |
| Jupiter | 5.20288700 | 0.04838624 | 14.73 | 34.40 |
| Saturn | 9.53667594 | 0.05386179 | 92.60 | 49.95 |

**Inclination is omitted.** All orbits are placed in one plane. This is the single largest simplification and it is deliberate: a coplanar model gives the correct qualitative retrograde behaviour and keeps the geometry drawable in two dimensions. It is also why the demo must not be used to predict real retrograde dates.

## Apparent (sky) longitude

With observer at $(x_o, y_o)$ and target at $(x_t, y_t)$, the apparent longitude is the direction of the sight line in the inertial frame:

$$
\lambda = \arctan2(y_t - y_o,\ x_t - x_o)
$$

wrapped into $[0, 360)$ degrees. This is the quantity plotted in the lower panel, and it is what an observer on the observer planet would measure against the distant stars.

Because the wrapped value jumps by 360 degrees when it crosses the branch cut, the demo also keeps an **unwrapped** version, adding or subtracting 360 whenever consecutive samples differ by more than 180 degrees. The unwrapped curve is the one whose slope is meaningful.

## Defining retrograde

Retrograde is defined as the interval where the unwrapped longitude is decreasing:

$$
\frac{d\lambda}{dt} < 0
$$

The derivative is evaluated by central difference on an internal step of $\Delta t = 0.25$ model days, independent of whatever step the user is scrubbing at. A **stationary point** is where this derivative crosses zero, located to a tolerance of $10^{-3}$ day.

Two things are worth being explicit about with students:

- The sign convention is a choice about which way we call "forward" in the sky. It is not a physical asymmetry.
- A stationary point is a property of the derivative of a computed angle. Nothing happens at the planet. Students frequently describe stationary points as the planet "stopping", and that is the misconception in its last hiding place.

## Why the inner planet always overtakes

This is the piece students most often get half right, so it is worth having the argument ready.

For a circular orbit of radius $r$ around a mass $M$, the orbital speed is

$$
v = \sqrt{\frac{GM}{r}}
$$

so a smaller orbit means a faster planet. The orbital period follows Kepler's third law, $P^2 \propto a^3$, so a smaller orbit also means a shorter period. Both statements point the same way: **the inner planet completes an orbit sooner and does the passing.**

Which planet that is depends on the target:

| Target | Inner planet | Retrograde occurs at | From Earth, the target is |
| --- | --- | --- | --- |
| Venus | Venus | inferior conjunction | between us and the Sun |
| Mars, Jupiter, Saturn | Earth | opposition | opposite the Sun in our sky |

The unified statement is that retrograde happens while the inner planet passes the outer one. Everything else is bookkeeping about which side of Earth's orbit the target lives on.

Notice also that Jupiter and Saturn barely move during the pass, so their retrograde geometry is nearly the limiting case of Earth going round a fixed point. Mars, with a period closest to Earth's, takes the longest to come back round to the same configuration. That is the same fact the planetary-conjunctions demo measures as the synodic period.

## Time in this demo

Time is **model days**. One model month is defined as exactly 30 model days. The demo makes no calendar-date claims and the coplanar approximation would not support them if it tried. If a student looks up a real retrograde window and finds it does not match, that is the model behaving as documented, and it is a good opening for a conversation about what a model is for.

## Assumptions and honest limitations

- **Coplanar.** Real orbital inclinations are omitted. Retrograde loops in the real sky trace S-shapes or loops because of inclination; this model produces the longitude reversal only.
- **Fixed elements.** No planetary perturbations, no precession of the elements over the model interval.
- **Two bodies at a time.** The "show other planets" overlay draws additional orbits, but the longitude calculation always involves exactly the selected observer and target.
- **No light travel time, no aberration.** Both are far below the resolution of anything this demo displays.
- **Not ephemeris-grade.** Positions are approximate elements evaluated analytically, not integrated.

## Verification status

The coordinate chain was audited end to end for sign errors in the physics review (`docs/reviews/retrograde-motion.md`), which found none: the pixel transform is a clean $c_y - y \cdot s$ with no x-mirror, unlike some sibling demos. The known outstanding items are recorded in `backlog.md`, and one wording issue is worth repeating here because it is easy to reintroduce: any annotation that says "Earth overtaking the target" is **wrong for Venus**. Keep annotation copy geometry-neutral, in terms of the speed difference between the two orbits.
