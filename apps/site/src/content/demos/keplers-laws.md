---
title: "Kepler’s Laws: Patterns of Planetary Motion"
status: draft
content_verified: true
levels: [Both]
topics: [Orbits]
time_minutes: 12
has_math_mode: false
tags: ["orbits", "period", "ellipses"]
featured: true
learning_goals:
  - "Describe how orbital speed changes along an ellipse."
  - "Connect orbital period to distance from the central body."
  - "Use qualitative evidence to support a Kepler-law claim."
misconceptions:
  - "Planets move at the same speed all along their orbits."
predict_prompt: "Where in an elliptical orbit do you think a planet moves fastest: near perihelion or aphelion?"
play_steps:
  - "Increase eccentricity $e$, then use Play/Pause or the timeline scrub to compare speed near perihelion vs aphelion."
  - "Turn on equal-area slices and check whether the slice areas look similar even when arc lengths differ."
  - "Compare two semi-major axes $a$ (same $M$) and observe how the period $P$ changes."
explain_prompt: "Write a claim consistent with a Kepler law and back it with a specific observation from the demo."
model_notes:
  - "Units: AU / yr / $M_{\\odot}$ with teaching normalization $G = 4\\pi^2\\,\\mathrm{AU}^3/(\\mathrm{yr}^2\\,M_{\\odot})$."
  - "Kepler 3 in these units: $P^2=\\frac{a^3}{M}$, so $P\\propto a^{3/2}$ when $M$ is fixed."
  - "The time slider advances mean anomaly $M$ uniformly (a time proxy); position and speed come from solving Kepler’s equation for the ellipse."
demo_path: "/play/keplers-laws/"
station_path: "/stations/keplers-laws/"
instructor_path: "/instructor/keplers-laws/"
last_updated: "2026-02-04"
---

Use this instrument to connect orbit shape to speed changes (Kepler 2) and connect orbit size to period scaling (Kepler 3).

In Newton mode you can also vary the central mass $M$ to see how period depends on the central body as well as the orbit.
