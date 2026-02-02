---
title: "Eclipse Geometry: Shadows in Space"
status: draft
content_verified: true
levels: [Both]
topics: [EarthSky]
time_minutes: 12
has_math_mode: false
tags: ["eclipses", "shadows", "alignment"]
learning_goals:
  - "Explain eclipses using alignment and shadow geometry."
  - "Distinguish umbra vs penumbra in a qualitative way."
  - "Explain why eclipses do not occur every month."
misconceptions:
  - "Eclipses happen every time there’s a new or full Moon."
predict_prompt: "If the Moon orbits Earth once per month, why don’t we have eclipses every month?"
play_steps:
  - "Explore alignments and note when an eclipse is possible."
  - "Change the tilt/offset and see how eclipse likelihood changes."
  - "Compare solar vs lunar eclipse conditions."
explain_prompt: "Use alignment and orbital tilt to explain why eclipses are rare."
model_notes:
  - 'This is a simplified geometric model: eclipses require (1) syzygy (New/Full) and (2) the Moon near a node (small $|\beta|$).'
  - 'Ecliptic latitude is computed from orbital tilt $i$ and distance from the ascending node $\Omega$: $$\beta = \arcsin\!\big(\sin i\ \sin(\lambda_M - \Omega)\big).$$'
  - 'Eclipse “how close is close enough?” thresholds come from a physically motivated shadow-cone model (similar triangles).'
  - 'Earth–Moon distance is selectable (km) and affects eclipse type (e.g., central solar eclipses can be total at perigee-like distances and annular at apogee-like distances).'
  - 'Interactive outcomes use a pedagogical tolerance ($\Delta$ within $5^\circ$ of New/Full); the long-run simulation uses constant-rate angle evolution to show eclipse seasons.'
demo_path: "/play/eclipse-geometry/"
station_path: "/stations/eclipse-geometry/"
instructor_path: "/instructor/eclipse-geometry/"
last_updated: "2026-02-02"
---

This demo helps explain why eclipses do not occur every month: the Moon must be at New/Full *and* near a node so its ecliptic latitude $|\beta|$ is small.

Use the distance presets to connect eclipse geometry to angular size: for central solar alignment, the same geometry can yield total or annular eclipses depending on Earth–Moon distance.
