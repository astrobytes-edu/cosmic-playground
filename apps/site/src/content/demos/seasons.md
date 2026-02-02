---
title: "Seasons: Why Tilt Matters"
status: draft
levels: [Both]
topics: [EarthSky]
time_minutes: 12
has_math_mode: false
tags: ["tilt", "sunlight", "insolation"]
learning_goals:
  - "Explain why axial tilt causes seasons."
  - "Relate sun angle/day length to heating."
  - "Distinguish tilt-driven seasons from distance myths."
misconceptions:
  - "Seasons are caused by Earth being closer/farther from the Sun."
predict_prompt: "If Earth’s axis were not tilted, what would happen to seasons?"
play_steps:
  - "Compare tilt = $0^\\circ$ vs tilt = $23.5^\\circ$ and note what changes."
  - "Change date and observe day length changes between hemispheres."
  - "Relate sunlight angle to ‘how concentrated’ the energy is."
explain_prompt: "Use day length and sun angle to explain how tilt produces seasonal temperature changes."
model_notes:
  - 'Declination uses a simplified geometry (toy model): $\delta = \sin^{-1}(\sin\varepsilon\,\sin L)$, where $\varepsilon$ is axial tilt and $L$ is treated as uniform in time (about $1^\circ$ accuracy vs ephemeris).'
  - 'Day length uses a standard sunrise/sunset hour-angle relation; polar day/night appear naturally when geometry demands it.'
  - 'Earth–Sun distance uses a first-order eccentric model (not a Kepler solver): $r \approx 1 - e\cos\theta$; perihelion is anchored near day 3 (Jan 3) with an uncertainty of about $\pm 2$ days.'
  - 'Key idea: opposite hemispheres have opposite seasons; distance variations are small and not the main cause.'
demo_path: "/play/seasons/"
station_path: "/stations/seasons/"
instructor_path: "/instructor/seasons/"
last_updated: "2026-01-30"
---

This demo lets you change day-of-year, axial tilt, and latitude to explore how sun angle and day length change through the year in each hemisphere.
