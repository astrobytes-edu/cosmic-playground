# Demo Review: Retrograde Motion

**Date:** February 7, 2026
**Version:** 1.0 (complete rewrite from Phase 11)
**Reviewer:** Automated review pipeline (code quality + science correctness + coordinate audit)
**Status:** Student-ready. All gates green.

---

## Summary

The retrograde-motion demo is an interactive instrument that lets students explore the apparent backward motion of planets against the background stars. It combines three synchronized views (orbit diagram, longitude-time plot, sky-view strip) with quantitative analysis tools (derivative readouts, stationary-point navigation, data export) and formative assessment (three progressive challenges).

The demo was completely rewritten to follow the moon-phases golden reference architecture. Three independent review agents verified scientific correctness, coordinate conventions, and design-system compliance. Zero critical issues remain.

---

## What It Teaches

Retrograde motion is often the first viewing-geometry effect students encounter. It challenges the intuition that "planets move forward." Most students arrive believing retrograde is mysterious or astrological; the demo reframes it as a predictable consequence of orbital mechanics.

The pedagogical arc follows the Observable-Model-Inference pattern:

1. **Observable:** The longitude plot shows a mostly-rising curve with periodic downward kinks. The sky-view strip shows the planet reversing direction.
2. **Model:** Both planets orbit the Sun on Keplerian ellipses. When one overtakes the other, the line of sight sweeps backward.
3. **Inference:** No planet reverses orbit. Retrograde is geometry, not physics. Its duration depends on the orbital-period ratio.

---

## Feature Comparison with Existing Tools

We surveyed the five most widely used retrograde motion teaching tools available on the web.

| Capability | **This demo** | UNL ClassAction | ScienceSims | SimuFisica | Stellarium |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Multi-planet selection | 5 | 1 (Mars) | 1 (Mars) | 1 (Mars) | All |
| Orbit view (top-down) | Yes | Yes | No | Yes | No |
| Longitude-time plot | **Yes** | No | No | No | No |
| Sky-view projection | Yes | Partial | Yes | No | Yes |
| Derivative readout (dlambda/dt) | **Yes** | No | No | No | No |
| Stationary-point navigation | **Yes** | No | No | No | No |
| Retrograde-interval shading | **Yes** | No | No | No | No |
| State badge (Direct/Retro/Stationary) | **Yes** | No | No | No | No |
| Formative challenges | 3 | 0 | 0 | 0 | 0 |
| Data collection + export | **Yes** | No | No | No | Partial |
| Model documentation (equations) | Full | None | None | Brief | None |
| Ptolemaic comparison | No | No | No | Yes | No |
| Calendar-date mapping | No | No | No | No | Yes |
| Accessibility (WCAG) | Full | Limited | Limited | Limited | Desktop |
| Mobile/responsive | Yes | No (Flash) | Yes | Yes | No |
| Open source | Yes | No | No | No | Yes |

**Bold** marks capabilities unique to this demo among the surveyed tools.

### Sources

- UNL Astronomy Education: ClassAction Retrograde Motion ([astro.unl.edu](https://astro.unl.edu/classaction/animations/renaissance/retrograde.html))
- ScienceSims: Retrograde Motion ([sciencesims.com](https://sciencesims.com/simdocs/retrograde-motion))
- SimuFisica: Retrograde Movement of the Planets ([simufisica.com](https://simufisica.com/en/retrograde-motion-planets/))
- Foothill College AstroSims ([foothill.edu](https://foothill.edu/astronomy/astrosims.html))
- Tatum, J.B., *Celestial Mechanics*, Ch. 8.4: Direct and Retrograde Motion ([LibreTexts](https://phys.libretexts.org/Bookshelves/Astronomy__Cosmology/Celestial_Mechanics_(Tatum)/08:_Planetary_Motions/8.04:_Direct_and_Retrograde_Motion_and_Stationary_Points))

---

## What Makes This Demo Novel

### 1. The longitude-time plot as primary diagnostic

Most retrograde tools show orbits. Students watch dots circle the Sun and try to intuit when the apparent direction reverses. This is hard. The human eye tracks position, not velocity.

This demo foregrounds the quantity astronomers actually use: ecliptic longitude as a function of time. The S-shaped retrograde loop becomes a visible downward kink in the curve. Students connect the geometric picture (line of sight sweeping backward) to the analytical signature (negative slope). That connection is the learning objective, and no other web tool makes it visually explicit.

### 2. Three synchronized views

The orbit panel, longitude plot, and sky-view strip share a single cursor. Click anywhere on one view and the other two update. This triangulation answers three questions simultaneously:

- **Where are the planets?** (orbit view)
- **What does the observer see?** (sky strip)
- **What does the data look like?** (longitude plot)

Students build the habit of moving between physical setup and observational consequence. That habit transfers to every other viewing-geometry problem in the course (eclipses, parallax, proper motion).

### 3. Quantitative analysis tools

The derivative readout (dlambda/dt in deg/day) and the state badge (Direct / Retrograde / Stationary) turn a qualitative animation into a measurement instrument. Students can:

- Navigate directly to stationary points (the physically meaningful moments where the planet "pauses")
- Read off the retrograde duration from the shaded interval
- Compare durations across different planet pairs
- Export a data table for lab reports

This moves the tool from demonstration to laboratory instrument.

### 4. Inferior vs. superior planet comparison

Switching from Earth-Mars to Earth-Venus in one click reveals that the same phenomenon has different geometry. Mars retrograde occurs at opposition (Earth overtakes Mars). Venus retrograde occurs at inferior conjunction (Venus overtakes Earth). The annotation text uses geometry-neutral language ("difference in orbital speeds") that stays accurate for both cases.

Most tools only show Mars. This demo shows all five classical planets, making the orbital-period dependence of retrograde duration directly observable.

---

## Pedagogical Design

### Scaffolded exploration

The three shelf tabs follow a deliberate sequence:

| Tab | Purpose | Cognitive level |
|-----|---------|----------------|
| What to notice | Directs attention to the observable pattern | Observation |
| Model notes | Shows the equations and assumptions | Comprehension |
| Explore further | Cross-links to related demos + historical context | Transfer |

### Challenges with automated feedback

| # | Prompt | Target skill |
|---|--------|-------------|
| 1 | "Find the first retrograde interval" | Observation + tool use |
| 2 | "Compare Mars vs. Venus retrograde durations" | Comparative analysis |
| 3 | "Find a stationary point" | Precision measurement |

Each challenge checks the actual model state (not text input), gives targeted hints, and records completion. Challenges scaffold from "look at the visualization" to "use the navigation tools analytically."

### Station mode

Students collect data into a structured table:

| Column | Value |
|--------|-------|
| Observer | Planet name |
| Target | Planet name |
| Retrograde duration | days |
| First stationary day | model day |

The export button produces formatted text ready for a lab report. This turns the demo into a data-collection exercise, not just a visualization.

### Model transparency

The Model Notes tab shows every equation in KaTeX-rendered LaTeX. Students can verify:

- Orbital elements come from JPL Table 1 (Standish, valid 1800-2050)
- Apparent longitude is computed as atan2(y_t - y_o, x_t - x_o)
- The unwrapped series uses a 180-degree jump rule
- Stationary points are refined by bisection to 0.001-day tolerance

This transparency teaches students to ask "what assumptions does this model make?" rather than treating simulations as black boxes.

---

## Scientific Correctness

Three independent review agents verified the physics:

### Orbital mechanics chain

| Step | Method | Verdict |
|------|--------|---------|
| Orbital elements | JPL Table 1 (Standish) | Correct |
| Mean anomaly | M = L - varpi, wrapped to [0, 2pi) | Correct |
| Kepler equation | Newton + bisection solver | Correct |
| True anomaly | Half-angle formula | Correct |
| Heliocentric position | x = r cos(theta), y = r sin(theta) | Correct |
| Apparent longitude | atan2(dy, dx), wrapped to [0, 360) | Correct |
| Phase unwrapping | 180-degree jump rule | Correct |
| Derivative | Central finite differences on unwrapped series | Correct |
| Stationary detection | Sign-change scan + bisection refinement | Correct |
| Retrograde intervals | Midpoint derivative test per segment | Correct |

### Coordinate convention audit

Seven rendering chains were traced from physics model through logic functions to SVG output:

1. Orbital position to SVG orbit view: **Correct** (proper y-flip, no x-mirror)
2. Ecliptic longitude to plot y-axis: **Correct** (increasing lambda maps upward)
3. Ecliptic longitude to sky-view strip: **Self-consistent** (longitude increases rightward)
4. Line-of-sight direction: **Correct** (observer to target, extended)
5. Zodiac ring labels: **Correct** (same angular mapping as orbit)
6. Planet trail rendering: **Correct** (same coordinate pipeline, fade oldest-to-newest)
7. Cursor to readout consistency: **Correct** (all mappings are inverse-consistent)

**Zero sign bugs found.** This is notable because the eclipse-geometry demo (similar dual-panel SVG architecture) had three coordinate-convention bugs that passed all unit tests.

---

## Architecture & Quality

| Metric | Value |
|--------|-------|
| Contract tests | 18 (design system compliance) |
| Logic unit tests | 79 (pure functions, 100% export coverage) |
| E2E tests | 46 active + 4 screenshot stubs |
| Physics model tests | 12 (in @cosmic/physics) |
| **Total test coverage** | **155 tests** |
| Lines of code | ~2,100 (HTML + CSS + logic.ts + main.ts) |
| Build | Clean (no color literals, no legacy tokens) |
| Typecheck | Clean |
| Accessibility | Full (aria-labels, keyboard nav, reduced motion) |

Architecture follows the humble-object pattern: logic.ts contains 13 pure, testable functions with no DOM access. main.ts is thin DOM wiring. All physics comes from @cosmic/physics. The DI pattern (RetroModelCallbacks) enables testing without importing the physics module.

---

## Known Limitations

1. **No Ptolemaic comparison.** SimuFisica offers a side-by-side heliocentric/geocentric view. Adding epicycle overlay would strengthen the historical narrative.

2. **No calendar-date mapping.** The model uses abstract "model days." Mapping to J2000 epoch would let students cross-validate against Stellarium or real observations.

3. **SVG rebuilds every frame.** Static elements (gridlines, axes, orbit ellipses) are destroyed and recreated each animation frame. Splitting static and dynamic layers would improve performance on low-power classroom devices.

4. **Sky-view orientation.** The sky strip maps increasing longitude rightward. Standard astronomical sky charts put east to the left. A directional label or toggle would help students connect the model to real observation.

5. **Coplanar approximation.** The model assumes all orbits lie in the ecliptic plane. Real planets have small inclinations (Mars: 1.85 deg) that affect the shape of the retrograde loop in declination. For the longitude-only analysis this demo teaches, the approximation is appropriate.

---

## Grant-Relevant Metrics

For NSF IUSE or similar proposals:

- **Unique capability:** The lambda(t) diagnostic plot with derivative readout and stationary-point navigation has no equivalent among surveyed web-based tools.
- **Accessibility compliance:** Full WCAG keyboard navigation, screen reader support, reduced-motion mode.
- **Open source:** MIT-licensed, deployable to any institution's web server.
- **Assessment integration:** Built-in challenges with automated grading provide formative feedback without instructor intervention.
- **Data literacy:** Station mode + export teaches students to collect, organize, and report quantitative data from simulations.
- **Transferable design:** The Observable-Model-Inference scaffold, three-view synchronization pattern, and challenge engine are reused across all 13 demos in the Cosmic Playground suite.
- **Evidence base:** 155 automated tests verify scientific correctness, coordinate conventions, design compliance, and user interaction. Three independent review agents (code quality, science correctness, coordinate audit) found zero critical issues.
