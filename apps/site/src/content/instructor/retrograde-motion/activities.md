---
title: "Retrograde Motion — In-Class Activities"
bundle: "retrograde-motion"
section: "activities"
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
> Main guide: `apps/site/src/content/instructor/retrograde-motion/index.md`
> Model deep dive: `apps/site/src/content/instructor/retrograde-motion/model.md`

> **Materials and setup**
> - One device per pair is enough; one per student is better for the lab.
> - Nothing to install and no login. Works offline once the page has loaded.
> - For the overtaking demonstration you need about three metres of clear floor.
> - Print the station card from `/stations/retrograde-motion/` if you are running the rotation.

## Warm-up without the computer (3 min, whole class)

> **Kinesthetic: overtaking on the inside**
> Two volunteers walk in concentric circles around a third student who plays the Sun. The inner walker (Earth) moves faster and keeps a smaller circle; the outer walker (Mars) moves slowly.
>
> Ask the class to watch **only** the direction from the inner walker to the outer walker, sighting along an outstretched arm. As the inner walker passes on the inside, that arm swings backwards relative to the far wall, even though both walkers are going the same way the whole time.
>
> **Say this out loud:** "Nobody reversed. The arm reversed." Then open the demo.

## MW Quick Exploration (3 to 5 min, pairs)

> **TPS: Does Mars reverse?**
> **Think (30 s):** "During retrograde, what does Mars do in its orbit around the Sun?"
>
> **Pair (60 s):** Agree on a one-sentence answer and a hand gesture for it.
>
> **Share (1 to 2 min):** With the Earth to Mars preset, press **Center on retrograde**, then step through the interval with the orbit view visible.
> 1) Watch each planet's dot travel round its own orbit.
> 2) Watch the line of sight sweep across the reference axis.
> 3) Read the sign of the slope on the longitude plot.
>
> **Debrief script:** "Both orbits ran forward the entire time. What reversed was the direction from us to Mars. Retrograde is a statement about our line of sight, not about Mars."

## MW Short Investigation (8 to 12 min, pairs or triads)

> **Investigation: Where in the geometry does retrograde happen?**
> **Task:** Fill in this table using **Center on retrograde** for each target, then reading the orbit panel at the middle of the shaded interval.
>
> | Target | Where is the target relative to the Sun, as seen from Earth? | Which planet is passing which? |
> | --- | --- | --- |
> | Mars | | |
> | Jupiter | | |
> | Saturn | | |
> | Venus | | |
>
> **Prompt:** "Three of these rows look the same and one does not. Which one, and what is different about that planet?"
>
> **Expected pattern:** Mars, Jupiter and Saturn all go retrograde when they sit opposite the Sun in our sky (opposition), and in all three cases Earth is passing them on the inside. Venus goes retrograde when it lies between us and the Sun (inferior conjunction), and Venus is passing *us*.
>
> **The rule to converge on:** the inner planet is always the faster one and always does the overtaking. Which planet that is depends on whether the target is inside or outside Earth's orbit.

> **Share-out (2 to 3 min)**
> Ask a group that wrote "Earth overtakes it" in every row to read their Venus row aloud, then run the Venus preset on the projector. This is a productive wrong answer and worth the airtime; do not pre-empt it.

## Friday Astro Lab (20 to 30+ min, groups of 3 to 4)

> **Astro Lab: Falsify a rule you just built**
> **Deliverable:** One page, with a table, a diagram, and a revised rule.
>
> **Stage 1 — Build the rule (8 min).** Using Mars, Jupiter and Saturn, write a rule in your own words that predicts *when* a planet will go retrograde. Your rule must be specific enough that someone else could use it to make a prediction.
>
> **Stage 2 — Test it (5 min).** Apply your rule to Venus and write down what it predicts. Then run the Venus preset and record what actually happens.
>
> **Stage 3 — Revise (7 min).** Write a corrected rule that works for all four targets. State plainly which part of your first rule failed and why.
>
> **Stage 4 — Explain (5 min).** In two or three sentences, explain why the corrected rule is really one idea and not two special cases. Use the words *faster*, *inner*, and *line of sight*.
>
> **What good work looks like:** the revised rule refers to the inner planet overtaking the outer one, and the student can say that opposition and inferior conjunction are the two ways that same pass can look from Earth, depending on which side of us the target orbits.
>
> **Common stopping point:** groups that get stuck usually still think retrograde is caused by the target rather than by the pair. Ask them: "Retrograde of *what*, as seen from *where*?"

## Station version (for the Cosmic Playground capstone rotation)

> **Station card: Retrograde Motion (6 to 8 minutes)**
> **Demo setup:** Earth to Mars preset, line of sight on, then **Center on retrograde**.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** observer planet, target planet, model day $t$
> 2) **Observable(s):** sky longitude, sign of its slope, shaded retrograde interval
> 3) **Governing idea, in words:** retrograde occurs while the slope of sky longitude is negative, which happens when the inner planet passes the outer one.
> 4) **Sanity check:** switch the target to Venus. Does retrograde still happen at opposition? Write down what you see instead.
> 5) **Connection sentence:** "This is evidence for a Sun-centred solar system because..."

> **Word bank + sanity checks**
> **Word bank:**
> - **Retrograde motion:** a temporary reversal in a planet's apparent direction against the background stars.
> - **Prograde motion:** the normal direction, the same way the planets orbit.
> - **Sky (apparent) longitude:** the direction from the observer planet to the target, measured as an angle. This is what the lower plot shows.
> - **Stationary point:** a moment when sky longitude stops changing, so the slope is zero. It marks the start or end of retrograde and corresponds to nothing at all happening at the planet itself.
> - **Opposition:** the target is opposite the Sun in our sky, so Earth sits between the Sun and the target. Only possible for planets outside Earth's orbit.
> - **Inferior conjunction:** the target passes between Earth and the Sun. Only possible for planets inside Earth's orbit.
>
> **Sanity checks:**
> - Neither orbit ever reverses. If a student says a planet turns around, replay the orbit panel alone.
> - Nothing physical happens at a stationary point. It is a property of the changing sight line.
> - Retrograde is not rare or ominous. Every planet does it, on a regular schedule set by the synodic period.
> - Time in this demo is **model days**, not calendar dates. Do not look up a real retrograde window and expect it to match.
