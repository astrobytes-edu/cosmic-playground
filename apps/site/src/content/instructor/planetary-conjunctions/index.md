---
title: "Cosmic Playground: Planetary Conjunctions"
bundle: "planetary-conjunctions"
section: "index"
demo_slug: "planetary-conjunctions"
last_updated: "2026-09-04"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/planetary-conjunctions/](../../play/planetary-conjunctions/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/planetary-conjunctions/`
> Exhibit page: `/exhibits/planetary-conjunctions/`
> Demo source: `apps/demos/src/demos/planetary-conjunctions/`

> **Where to go next**
> - Model + math + assumptions: `apps/site/src/content/instructor/planetary-conjunctions/model.md`
> - In-class activities: `apps/site/src/content/instructor/planetary-conjunctions/activities.md`
> - Assessment bank: `apps/site/src/content/instructor/planetary-conjunctions/assessment.md`
> - Future enhancements: `apps/site/src/content/instructor/planetary-conjunctions/backlog.md`

> **Controls worth knowing before you teach**
> - **Target planet** chips: Venus, Mars, Jupiter, Saturn.
> - **Speed** slider and **Reset**.
> - Readouts: synodic period, days elapsed, conjunctions observed, both longitudes, and the current angular separation.
> - A conjunction flash fires each time the two longitudes line up, and the counter increments.

## Why this demo exists

> **Why This Matters**
> "Conjunction" is one of the few astronomy words students meet in the news, usually attached to a claim that two planets are "close together". They are not. At a conjunction two planets share a direction in our sky while remaining hundreds of millions of kilometres apart. The demo makes the distinction unavoidable by showing the physical positions and the sky alignment at the same moment.
>
> The deeper payoff is the **synodic period**: the time for the same alignment to repeat. It is the first quantity many students meet that is not a property of any single object but of a *relationship between two*, and it behaves in a way that is genuinely surprising until you see why.

## Learning goals (ASTR 101)

Students should be able to:

- Define a conjunction as a line-of-sight alignment as seen from Earth, and state that it says nothing about the physical separation of the two planets.
- Explain why alignments repeat, in terms of one planet gaining a full lap on the other.
- Read the synodic period from the demo and explain why it differs from either planet's orbital period.
- Predict which of two planets has the longer synodic period with Earth, using how close its orbital period is to Earth's.

## 10 to 15 minute live-teach script (projector)

Open on the **Mars** target with the speed slider low.

1. **Commit to a prediction.** *"Jupiter takes about 12 years to orbit the Sun. Mars takes about 2. Which one lines up with Earth more often?"* Take a show of hands. Most classes vote Mars, reasoning that faster means more often. Record the vote where everyone can see it.

2. **Define the observable.** Run the demo until the first flash. Ask: *"What was true at that instant?"* Steer to: the two planets had the same **heliocentric** longitude, meaning they lay on the same ray out from the Sun. Point at the separation readout going to zero.

   > **Note the label.** With Mars selected the counter reads **"Oppositions observed"**, because that geometry puts Earth between the Sun and Mars. Switch to Venus and it becomes "Inferior conjunctions observed". Ask the class why the same alignment gets two different names before you explain it.

3. **Kill the "close together" idea now.** Freeze at the flash and ask: *"How far apart are these two planets in the picture?"* They are on completely different orbits. The alignment is about direction, not distance. This is worth thirty seconds of silence while they look at it.

4. **Read the synodic period.** Let two or three conjunctions accumulate and point at the days-elapsed and conjunctions-observed readouts. Define the synodic period as the time between successive conjunctions.

5. **Resolve the prediction.** Switch to **Jupiter**. The synodic period drops to about 399 days, barely over one year. Switch to **Mars**: about 780 days, more than two years. The class vote was wrong, and it was wrong for an interesting reason.

6. **Explain the surprise.** Mars is the *hardest* to catch, not the easiest, because its orbital period is closest to Earth's. Earth has to gain a whole lap, and when two runners have similar lap times that takes a long while. Jupiter barely moves, so Earth laps it almost as soon as Earth finishes one orbit.

7. **Push to the limit.** Ask: *"What would the synodic period be for a planet with exactly Earth's orbital period?"* Infinite, because Earth never gains a lap. That limit is the whole idea in one sentence.

## Common student responses, and what to do with them

| What you will hear | What is going on | Move |
| --- | --- | --- |
| "They're really close together." | The headline misconception. | Freeze at conjunction and point at the two orbits. |
| "Faster planet, more conjunctions." | Reasoning about one planet instead of the pair. | Compare Mars and Jupiter directly; the prediction fails. |
| "The synodic period is the average of the two." | Reaching for arithmetic that feels reasonable. | Test it: Earth 1 yr, Jupiter 11.9 yr, average 6.4 yr. The demo says 1.09 yr. |
| "It's the difference of the periods." | Closer, and worth taking seriously. | It is the difference of the *rates*, not the periods. Do the reciprocal on the board. |
| "So conjunctions are rare and special?" | Astrology framing. | Every pair conjoins on a fixed schedule; there is nothing selective about it. |

## Suggested connections to other demos

- **Retrograde motion:** the same relative-motion clock. A superior planet goes retrograde once per synodic period, at opposition.
- **Kepler's laws:** supplies the orbital periods that set the synodic period, so the two demos chain together.
- **Angular size:** why "close in the sky" and "close in space" are unrelated statements.
