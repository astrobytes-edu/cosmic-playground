---
title: "Planetary Conjunctions — Model & Math (Instructor Deep Dive)"
bundle: "planetary-conjunctions"
section: "model"
demo_slug: "planetary-conjunctions"
last_updated: "2026-09-04"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/planetary-conjunctions/](../../play/planetary-conjunctions/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/planetary-conjunctions/`
> Synodic period: `packages/physics/src/twoBodyAnalytic.ts`
> Demo logic: `apps/demos/src/demos/planetary-conjunctions/logic.ts`

## What the demo is modeling (big picture)

Two planets move on circular orbits at constant angular speed. The demo tracks each planet's heliocentric longitude, watches for the moments when the two longitudes coincide, and reports the interval between those moments.

The model is **schematic**: orbit radii on screen are chosen for legibility, not drawn to scale. Timing, however, is real. The periods come from the actual semi-major axes via Kepler's third law, so the synodic periods the demo reports are the correct ones for the solar system.

## Where the periods come from

Each target's semi-major axis $a$ feeds Kepler's third law with the Sun as the central mass:

$$P = \sqrt{\frac{a^3}{M}}$$

with $P$ in years, $a$ in AU and $M$ in solar masses, so $M = 1$ and $P = a^{3/2}$.

| Planet | $a$ (AU) | Derived $P$ (yr) | Synodic period with Earth |
| --- | --- | --- | --- |
| Venus | 0.7233 | 0.615 | 583.9 d (1.60 yr) |
| Earth | 1.0000 | 1.000 | — |
| Mars | 1.5237 | 1.881 | 779.9 d (2.14 yr) |
| Jupiter | 5.2029 | 11.868 | 398.9 d (1.09 yr) |
| Saturn | 9.5367 | 29.451 | 378.1 d (1.04 yr) |

These derived periods reproduce the observed ones to better than a part in a thousand, which is a nice incidental result to point out: Kepler's third law and a single number per planet get you the whole timing structure.

## The synodic period

The implementation computes

$$P_{\text{syn}} = \left| \frac{P_1 P_2}{P_1 - P_2} \right|$$

which is algebraically the same as the form students usually derive:

$$\frac{1}{P_{\text{syn}}} = \left| \frac{1}{P_1} - \frac{1}{P_2} \right|$$

**The rate form is the one to teach.** It says directly that what matters is the difference in *angular rates*, and that the alignment repeats when the faster planet has gained exactly one full turn on the slower one. The product form is convenient for computing and actively unhelpful for understanding; students who memorise it tend to produce the "subtract the periods" error because the subtraction is sitting right there in the denominator.

The function returns `Infinity` when the two periods are equal. That is not a guard against a division by zero so much as the correct physical answer: two planets on the same orbit never lap one another, so the same alignment never recurs.

## Why the surprise is a surprise

Students predict that a fast planet conjoins often and a slow one rarely. The rate form shows why that is wrong. Write $P_1 = 1$ year for Earth:

$$\frac{1}{P_{\text{syn}}} = \left| 1 - \frac{1}{P_2} \right|$$

- As $P_2 \to \infty$, the second term vanishes and $P_{\text{syn}} \to 1$ year. A very slow planet is *easy* to lap, because Earth does all the work in one of its own orbits.
- As $P_2 \to 1$ year, the difference goes to zero and $P_{\text{syn}} \to \infty$. A planet with nearly Earth's period is nearly impossible to lap.

So the controlling quantity is not the target's speed but **how different its rate is from Earth's**. Mars, the nearest superior planet, has the longest synodic period of the four targets precisely because its period is the closest to Earth's. Jupiter and Saturn differ by more than a factor of two in orbital period yet their synodic periods differ by only about three weeks, because both are already deep in the slow limit.

## Conjunction versus opposition

The demo fires when the two heliocentric longitudes agree to within 5 degrees, meaning both planets lie on the same ray out from the Sun. What that alignment **is**, as seen from Earth, depends on which side of Earth's orbit the target sits:

| Target | Same heliocentric longitude means | Seen from Earth this is |
| --- | --- | --- |
| Venus (inside Earth's orbit) | Venus lies between the Sun and Earth | **inferior conjunction** — target near the Sun in our sky |
| Mars, Jupiter, Saturn (outside) | Earth lies between the Sun and the target | **opposition** — target opposite the Sun, up all night |

**The demo labels this correctly per target.** The counter reads "Oppositions observed" for the three outer planets and "Inferior conjunctions observed" for Venus, and the exported results carry the same label. Until 2026-09-04 it called every alignment a "conjunction", which was correct only for Venus; if you are working from older notes or a printed handout, check the wording.

Opposition is the observationally interesting case: the planet is closest, brightest, up all night, and going retrograde. That last point is the direct bridge to the retrograde-motion demo, which shows the same event from the other side.

**Teaching move worth keeping.** Even with the labels correct, the *why* is worth eliciting rather than telling. Run Venus first, establish inferior conjunction, then switch to Mars and ask: "same geometry from the Sun's point of view — so why does the label change?" The answer, that Earth is now the one in the middle, is the whole idea.

## Assumptions and honest limitations

- **Circular, coplanar orbits.** Eccentricity and inclination are both ignored. Real conjunctions have a non-zero angular separation because the orbits are tilted with respect to one another; this model can drive the separation to exactly zero.
- **Not to scale.** Orbit radii on screen are compressed so all four targets are visible in one frame. Do not let students measure distances off the display.
- **Constant angular speed.** A consequence of the circular assumption. Real planets move faster near perihelion.
- **No third bodies, no perturbations.** Each run involves exactly Earth and one target.
- **Detection is on heliocentric longitude**, and the event is then labelled from the target's geometry (opposition for an outer planet, inferior conjunction for Venus). Published conjunction and opposition dates use full geocentric coordinates including inclination, so they will differ slightly.

## Teaching note on the inferior case

Venus is the one inferior planet available, and it has two distinct alignments with Earth: **inferior conjunction**, with Venus between Earth and the Sun, and **superior conjunction**, with Venus on the far side of the Sun. These are 180 degrees apart in heliocentric longitude, and each occurs once per synodic period of 584 days, alternating.

The demo's 5-degree test only fires on the same-longitude case, so **the counter counts inferior conjunctions only**. Superior conjunctions happen halfway between two flashes and are not flagged. If a student notices Venus passing "behind" the Sun without a flash, they have spotted something real and correct.
