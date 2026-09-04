---
title: "Planetary Conjunctions — Backlog"
bundle: "planetary-conjunctions"
section: "backlog"
demo_slug: "planetary-conjunctions"
last_updated: "2026-09-04"
has_math: true
---
> **Scope note:** Future improvements for the `planetary-conjunctions` instrument, split into (A) content correctness, (B) pedagogy and UX, and (C) model extensions that stay honest. Item A1 is a genuine defect found while writing this bundle and should be fixed before the demo is promoted past `experimental`.

## A) Content correctness

**A1. The flash is labelled "conjunction" for all four targets, but it is an opposition for three of them.** *(P1)*

The demo fires when the heliocentric longitude separation drops below 5 degrees (`logic.ts`, `isConjunction`). Same heliocentric longitude means both planets lie on the same ray from the Sun, and what that looks like from Earth depends on the target:

- **Venus** (inside Earth's orbit): Venus is between Earth and the Sun. This is an **inferior conjunction**, and the label is correct.
- **Mars, Jupiter, Saturn** (outside Earth's orbit): Earth is between the Sun and the target. From Earth this is an **opposition**, not a conjunction.

The demo's own learning goal is "Define conjunction and opposition **as seen from Earth**", so the geocentric sense is the one that matters here, and the current label contradicts it for three quarters of the presets. `model.md` documents a classroom workaround, but the instrument should not need one.

*Suggested fix:* detect both the 0-degree and 180-degree alignments, then label each event from the target's classification: for an inferior planet, inferior conjunction at 0 degrees and superior conjunction at 180; for a superior planet, opposition at 0 degrees and conjunction at 180. That change also makes the alternating Venus pair visible, which the current single test hides (see A2).

**A2. Superior conjunctions of Venus are never flagged.** *(P2)*

Venus alternates between inferior conjunction (same heliocentric longitude) and superior conjunction (180 degrees apart), each once per 584-day synodic period. Only the first fires. A student watching Venus pass behind the Sun sees nothing happen. Falls out of the A1 fix.

**A3. `content_verified` is `false` and there is no `docs/reviews/planetary-conjunctions.md` physics review.** *(P2)*

The `validate-play-dirs` gate now enforces that `content_verified: true` requires a review on file, so the metadata is at least honest. A review still needs writing, and A1 should be resolved first so it does not immediately become a finding.

## B) Pedagogy and UX

**B1. No opposition marker.** Opposition is the observationally interesting alignment: the planet is closest, brightest, up all night, and going retrograde. Adding an explicit opposition indicator would connect this demo directly to `retrograde-motion` and make the A1 distinction visible rather than verbal.

**B2. No synodic-period prediction affordance.** Students currently read the synodic period off a readout. A "predict before you run" input, compared against the measured value after two conjunctions, would turn a displayed number into a testable claim and give the demo a Predict-Observe-Explain spine it currently lacks.

**B3. Only six controls total.** This is the thinnest control surface of any demo in the collection, and the UX audit ranked it second-worst overall. Candidates: a second target so students can watch planet-to-planet alignments rather than only Earth-to-planet, and a toggle between the schematic view and a true-scale view.

**B4. No Station Mode, no Challenge Mode, no Help dialog.** This demo does not call `createDemoModes`, making it one of only two demos without the shared shell affordances. Students cannot export a data table for the investigation in `activities.md` without transcribing by hand.

## C) Model extensions that stay honest

**C1. Optional inclination.** Real conjunctions have a non-zero minimum separation because the orbits are tilted. A toggle that adds each planet's real inclination would let the demo answer the question students always ask: why is a conjunction not an eclipse or a transit? Keep it off by default so the core timing lesson stays clean.

**C2. Optional eccentricity.** Circular orbits mean constant angular speed. Adding real eccentricities would make successive synodic intervals vary slightly, which is both true and a good discussion of why "the" synodic period is an average.

**C3. Extend the target list.** Mercury would add a second inferior planet and a short 116-day synodic period, which usefully breaks the impression that Venus is what an inner planet looks like. Uranus and Neptune would push the slow limit further and make the "approaches one year" asymptote convincing.
