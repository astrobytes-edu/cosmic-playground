---
title: "Cosmic Playground: Retrograde Motion"
bundle: "retrograde-motion"
section: "index"
demo_slug: "retrograde-motion"
last_updated: "2026-09-04"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/retrograde-motion/](../../play/retrograde-motion/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/retrograde-motion/`
> Demo source: `apps/demos/src/demos/retrograde-motion/`
> Demo logic: `apps/demos/src/demos/retrograde-motion/main.ts`

> **Where to go next**
> - Model + math + assumptions: `apps/site/src/content/instructor/retrograde-motion/model.md`
> - In-class activities: `apps/site/src/content/instructor/retrograde-motion/activities.md`
> - Assessment bank: `apps/site/src/content/instructor/retrograde-motion/assessment.md`
> - Future enhancements: `apps/site/src/content/instructor/retrograde-motion/backlog.md`

> **Controls worth knowing before you teach**
> - **Observer / Target** selectors drive everything. The presets are Earth to Mars, Venus, Jupiter, Saturn.
> - **Transport row** (play, pause, step) plus a **scrub slider** for model day.
> - **Center on retrograde** jumps to the middle of the nearest retrograde interval. Use this instead of hunting.
> - **Overlays:** line of sight, sky-longitude arc, reference axis, zodiac band, other planets.
> - The lower panel plots sky longitude against time; retrograde intervals are shaded.

## Why this demo exists

> **Why This Matters**
> Retrograde motion is the observation that broke geocentric astronomy, and it is still the cleanest classroom example of an apparent motion that is entirely a viewing-geometry effect. Students almost universally hear "Mars goes backwards" and picture Mars actually reversing along its orbit, braking and turning around. Nothing in the sky requires that. This demo shows both orbits running steadily forward the whole time while the *direction from Earth to Mars* swings backward for a few weeks.
>
> The demo's second job is subtler and more valuable: it lets a student build a rule from one planet and then break it with another. That is a rehearsal of how science actually goes.

## Learning goals (ASTR 101 and ASTR 201)

Students should be able to:

- Define retrograde motion as an apparent reversal of a planet's direction in the sky, caused by relative motion and line-of-sight geometry, and state explicitly that neither orbit reverses.
- Read apparent (sky) longitude as the direction from the observer planet to the target planet, and connect a negative slope on the longitude plot to a retrograde interval.
- Identify stationary points as the moments where the slope of sky longitude is zero, and describe them as the boundaries of retrograde rather than as physical events at the planet.
- Explain why a superior planet goes retrograde near **opposition** while an inferior planet goes retrograde near **inferior conjunction**, using a single rule that covers both.

## 10 to 15 minute live-teach script (projector)

Have the demo open on the **Earth to Mars** preset with the **line of sight** overlay on.

1. **Commit to a prediction first.** Before touching anything: *"Mars is out there orbiting the Sun. In a few weeks it will appear to move backwards against the stars. Show me with your hand what Mars does in its orbit."* Most of the room will trace a reversal. Do not correct it yet. Say you will come back to it.

2. **Watch the orbits, not the sky.** Press play and let both planets go round once. Ask: *"Did either planet ever slow down, stop, or reverse?"* They did not, and students can see it. Pause and note that whatever retrograde is, it is not that.

3. **Now watch the line of sight.** Press **Center on retrograde**. Step forward day by day through the shaded interval and point at the sight line sweeping backward across the reference axis. Ask: *"Both planets are still moving forward. What is moving backward?"* The answer you want is the **direction from Earth to Mars**, not Mars.

4. **Read the plot.** Move to the longitude panel. Ask: *"What is different about the shaded stretch?"* The slope is negative. Define a stationary point as where the slope is zero: the start and end of retrograde. Stress that nothing happens *at Mars* at a stationary point.

5. **Explain the overtaking.** Point out that Earth is closer to the Sun, so Earth moves faster and completes an orbit sooner. During retrograde, Earth is passing Mars on the inside, and the sight line swings backward the way a slower car appears to drift backwards when you overtake it on a motorway. Note that this happens when Mars is opposite the Sun in our sky: **opposition**.

6. **Break the rule.** Switch the target to **Venus** and press **Center on retrograde**. Ask: *"Where is Venus when it goes retrograde? Is Earth overtaking Venus?"* It is not. Venus is *between* Earth and the Sun (**inferior conjunction**), and Venus is the one doing the overtaking, because Venus is closer to the Sun and therefore faster.

7. **Land the general rule.** The rule that survives both cases is: *the inner planet always moves faster and overtakes the outer one; retrograde happens for whichever planet we are watching while that pass takes place.* For a superior target we are the overtaker, and it happens at opposition. For an inferior target we are the overtaken, and it happens at inferior conjunction.

8. **Close the loop on step 1.** Return to the opening prediction. *"Who traced a reversal with their hand? What would you trace now?"*

> **If you only have five minutes:** run steps 1, 3, and 6. The prediction, the sight line, and the Venus counterexample are the load-bearing beats.

## Common student responses, and what to do with them

| What you will hear | What is going on | Move |
| --- | --- | --- |
| "Mars slows down and turns around." | The target misconception. | Replay the orbit view with the sky panel hidden. Nothing reverses. |
| "It's an illusion, it isn't real." | Over-correction. The apparent motion is a real, measurable observation. | "The motion in the sky is completely real and we can measure it. What is not real is a reversal in the orbit." |
| "It happens because Mars is closest then." | Conflates retrograde with distance or brightness. | True that Mars is nearest at opposition, but ask what would happen if Mars were nearer and *not* being overtaken. |
| "Earth overtakes it." | Correct for Mars, wrong for Venus. | This is the good mistake. Go straight to step 6. |

## Suggested connections to other demos

- **Planetary conjunctions:** the same relative-motion clock. Retrograde recurs once per synodic period, which is exactly the quantity that demo measures.
- **Parallax distance:** both are apparent shifts caused by the observer moving, at different scales and timescales.
- **Kepler's laws:** why the inner planet is the faster one, rather than that being an arbitrary fact.
