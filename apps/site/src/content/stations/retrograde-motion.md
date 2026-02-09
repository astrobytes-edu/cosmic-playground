---
title: "Station card: retrograde-motion"
demo_slug: "retrograde-motion"
last_updated: "2026-02-07"
has_math: true
---
**Name:** ________________________________  **Section:** __________  **Model day window:** __________

**Station:** __________  **Group members:** ________________________________________________

*Goal:* Use the demo to make a claim about retrograde motion supported by (1) at least one number/readout and (2) at least one sanity check.

> **Station card: Retrograde Motion (8-10 minutes)**
> **Demo setup:** Select **Earth $\\to$ Mars** as the observer/target pair. Set speed in the sidebar, then press **Play** in the sidebar transport controls.
> **Timeline tip:** Use the timeline row near the visualization stage for scrub and stationary navigation.
> **Tip:** Click **Station Mode** to record stationary-point and opposition data into a table you can export.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** observer planet, target planet, elapsed time
> 2) **Observable(s):** apparent longitude $\lambda_\text{app}$ (deg), motion state (prograde / stationary / retrograde), retrograde arc size (deg), retrograde duration (days)
> 3) **Governing relationship:** Retrograde motion is an apparent backward drift in a target's ecliptic longitude caused by the changing line-of-sight direction as the two planets follow their orbits at different speeds.
> 4) **Sanity check:** Mars retrograde occurs near opposition; Venus retrograde occurs near inferior conjunction. Neither planet physically reverses its orbit.
> 5) **Connection sentence:** "Retrograde motion matters for understanding orbital mechanics because..."

## Data Collection Tasks (Station Mode)

1. Select **Earth $\\to$ Mars**. Press **Play** and let the animation run until you see the apparent longitude reverse direction (the longitude plot curves backward). Pause at the **first stationary point** (where the curve flattens before reversing).

2. Click **Add Row** in Station Mode. Record model day $t$, $\lambda_\text{app}$, and motion state. Label this row **"Mars: start retrograde."**

3. Continue playing until the longitude resumes prograde motion (the second stationary point). Add another row: **"Mars: end retrograde."** The difference in model days is the retrograde duration.

4. Find the midpoint of the retrograde arc; this is close to **opposition** (Sun-Earth-Mars alignment). Add a row: **"Mars: opposition."**

5. Now switch to **Earth $\\to$ Venus**. Repeat steps 1-4, recording the **start**, **end**, and **inferior conjunction** midpoint. Venus retrogrades near inferior conjunction (Sun-Venus-Earth alignment).

6. Optional advanced case: set **observer = Venus** and **target = Earth** to inspect the same geometry from Venus's frame.

7. Compare your two tables: Which planet has a longer retrograde duration? Which has a larger retrograde arc?

### Data table: Mars

| Event | Model day $t$ | $\lambda_\text{app}$ (deg) | Motion state | Notes |
|---|---|---|---|---|
| Start retrograde (1st stationary pt.) | | | Stationary | |
| Opposition (midpoint) | | | Retrograde | |
| End retrograde (2nd stationary pt.) | | | Stationary | |

### Data table: Venus

| Event | Model day $t$ | $\lambda_\text{app}$ (deg) | Motion state | Notes |
|---|---|---|---|---|
| Start retrograde (1st stationary pt.) | | | Stationary | |
| Inferior conjunction (midpoint) | | | Retrograde | |
| End retrograde (2nd stationary pt.) | | | Stationary | |

> **Word bank**
> - **Apparent longitude $\lambda_\text{app}$:** the target's position projected onto the ecliptic as seen from the observer planet ($0^\circ$-$360^\circ$).
> - **Prograde:** normal eastward motion along the ecliptic (increasing $\lambda_\text{app}$).
> - **Retrograde:** apparent westward drift (decreasing $\lambda_\text{app}$); caused by the changing line-of-sight, not a reversal of the planet's orbit.
> - **Stationary point:** the instant when $\lambda_\text{app}$ momentarily stops changing (transition between prograde and retrograde, or vice versa).
> - **Opposition:** Sun-Earth-target aligned with Earth in the middle; occurs for superior planets (Mars, Jupiter, ...).
> - **Inferior conjunction:** Sun-target-Earth aligned with the target between Sun and Earth; occurs for inferior planets (Venus, Mercury).
> - **Synodic period:** the time between successive oppositions (or successive inferior conjunctions); determines how often retrograde recurs.
>
> **Sanity checks:**
> - Mars retrograde should last roughly 70-80 days with an arc of about $15^\circ$-$20^\circ$.
> - Venus retrograde should last roughly 40-45 days with an arc of about $15^\circ$-$17^\circ$.
> - Retrograde always brackets opposition (superior planets) or inferior conjunction (inferior planets).
> - No planet ever physically reverses its orbit; retrograde is purely an apparent, line-of-sight effect.
