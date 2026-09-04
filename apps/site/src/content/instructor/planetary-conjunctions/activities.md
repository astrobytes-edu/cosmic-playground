---
title: "Planetary Conjunctions — In-Class Activities"
bundle: "planetary-conjunctions"
section: "activities"
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
> Main guide: `apps/site/src/content/instructor/planetary-conjunctions/index.md`
> Model deep dive: `apps/site/src/content/instructor/planetary-conjunctions/model.md`

> **Materials and setup**
> - One device per pair. The demo is short, so pairs keep the pace up.
> - A calculator or phone for the reciprocal arithmetic in the investigation.
> - For the warm-up, a running track, corridor, or just two students walking a circle works.
> - Print the station card from `/stations/planetary-conjunctions/` for the rotation.

## Warm-up without the computer (3 min, whole class)

> **Kinesthetic: lapping on a track**
> Two students walk a circle at clearly different speeds, starting side by side. Ask the class to call out each time the faster one draws level with the slower one again.
>
> Then ask the question that matters: *"To draw level again, how much extra distance does the faster walker have to cover?"* Exactly one full lap. Not a fraction, not a half. One whole lap, every time.
>
> Now make it hard: *"What if their speeds were almost the same?"* The lapping takes forever. Hold that thought and open the demo.

## MW Quick Exploration (3 to 5 min, pairs)

> **TPS: Are they actually close?**
> **Think (30 s):** "A news headline says Venus and Jupiter are 'in conjunction' and appear side by side. How far apart are they in space?"
>
> **Pair (60 s):** Agree on an answer and a reason.
>
> **Share (1 to 2 min):** Run the demo to the first conjunction flash and pause.
> 1) Read the angular separation. It is near zero.
> 2) Look at where the two dots actually are. They are on different orbits.
> 3) Say what a conjunction is a statement about.
>
> **Debrief script:** "A conjunction is a statement about direction, not distance. Two planets share a line of sight from Earth while staying hundreds of millions of kilometres apart. Nothing about them has moved closer."

## MW Short Investigation (8 to 12 min, pairs or triads)

> **Investigation: Which planet is hardest to catch?**
> **Task:** For each target, run the demo until you have timed at least two conjunctions, and record the synodic period.
>
> | Target | Orbital period (yr) | Synodic period with Earth (days) | Synodic period (yr) |
> | --- | --- | --- | --- |
> | Venus | 0.62 | | |
> | Mars | 1.88 | | |
> | Jupiter | 11.86 | | |
> | Saturn | 29.46 | | |
>
> **Prompt:** "Rank the planets from shortest to longest synodic period. Now rank them by orbital period. The two rankings do not match. Why not?"
>
> **Expected values (days):** Venus about 584, Mars about 780, Jupiter about 399, Saturn about 378.
>
> **The pattern to converge on:** the synodic period is longest for the planet whose orbital period is **closest to Earth's** (Mars), and shortest for the planets whose periods are furthest from Earth's (Jupiter, Saturn). Two planets with similar speeds take a very long time to lap one another.
>
> **Extension for ASTR 201:** verify the relationship numerically. Compute $1/P_{\text{Earth}} - 1/P_{\text{target}}$ for a superior planet and take the reciprocal. Compare with the demo readout.

> **Share-out (2 to 3 min)**
> Ask the group that ranked Jupiter as "hardest to catch" to explain their reasoning before revealing the answer. The intuition that a slow planet is hard to catch is exactly backwards here, and hearing it stated is more useful than hearing it corrected.

## Friday Astro Lab (20 to 30+ min, groups of 3 to 4)

> **Astro Lab: Build the synodic period from scratch**
> **Deliverable:** One page with a derivation, a data table, and a prediction that you then test.
>
> **Stage 1 — Reason it out (7 min).** Before using any formula: Earth completes $1/P_{\text{Earth}}$ orbits per year and the target completes $1/P_{\text{target}}$. Write down, in words, how much *extra* angle Earth must gain on the target between one conjunction and the next. Then write down how fast Earth gains that angle.
>
> **Stage 2 — Turn it into a formula (5 min).** Combine the two into an expression for the synodic period. You should reach
>
> $$\frac{1}{P_{\text{syn}}} = \left| \frac{1}{P_{\text{Earth}}} - \frac{1}{P_{\text{target}}} \right|$$
>
> **Stage 3 — Test it (8 min).** Pick two targets. Predict the synodic period from the formula, then measure it in the demo. Record both and the percentage difference.
>
> **Stage 4 — Push on it (5 min).** Answer two questions in writing:
> - What does the formula give for a hypothetical planet with exactly Earth's orbital period, and what does that mean physically?
> - Saturn's orbital period is more than twice Jupiter's, yet their synodic periods differ by only about three weeks. Explain why.
>
> **What good work looks like:** the derivation talks about *rates* rather than periods, and the answer to the last question notices that for a very slow planet the target's term nearly vanishes, so the synodic period approaches Earth's own year no matter how slow the planet gets.
>
> **Common stopping point:** groups that try to subtract periods rather than rates. Let them; the number will be badly wrong and the demo will say so. That failure is the lesson.

## Station version (for the Cosmic Playground capstone rotation)

> **Station card: Planetary Conjunctions (6 to 8 minutes)**
> **Demo setup:** start on Mars at a moderate speed, then repeat with Jupiter.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** target planet, animation speed
> 2) **Observable(s):** angular separation, conjunctions observed, days elapsed, synodic period
> 3) **Governing relationship:** write this in words:
>
>    $$\frac{1}{P_{\text{syn}}} = \left| \frac{1}{P_{\text{Earth}}} - \frac{1}{P_{\text{target}}} \right|$$
> 4) **Sanity check:** which target gives the longest synodic period, and is that the fastest or the slowest planet?
> 5) **Connection sentence:** "This matters for planning observations because..."

> **Word bank + sanity checks**
> **Word bank:**
> - **Conjunction:** two bodies share the same direction in our sky. A statement about line of sight only.
> - **Opposition:** a superior planet sits opposite the Sun in our sky, so it is up all night. Only possible for planets outside Earth's orbit.
> - **Synodic period:** the time for the same Sun, Earth and planet alignment to repeat.
> - **Sidereal (orbital) period:** the time for one full orbit around the Sun, measured against the distant stars.
> - **Superior planet:** orbits outside Earth's orbit (Mars, Jupiter, Saturn here).
> - **Inferior planet:** orbits inside Earth's orbit (Venus here).
>
> **Sanity checks:**
> - A conjunction says nothing about physical distance. Nothing gets closer.
> - The synodic period is never the average of the two orbital periods.
> - For a very distant, very slow planet the synodic period approaches one Earth year, because Earth does essentially all the work.
> - Mars has the longest synodic period of the four targets here, despite being the nearest superior planet.
> - The demo is schematic and not to scale. Orbit sizes on screen are for legibility, not measurement.
