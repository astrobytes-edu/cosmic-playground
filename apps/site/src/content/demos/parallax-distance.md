---
title: "Parallax Distance: Measuring the Stars"
status: draft
levels: [Both]
topics: [DataInference]
time_minutes: 12
has_math_mode: false
tags: ["parallax", "triangles", "distance"]
learning_goals:
  - "Explain parallax as apparent shift from two viewpoints."
  - "Connect smaller parallax angles to larger distances."
  - "Describe why measurement uncertainty matters for small angles."
misconceptions:
  - "Parallax is about an object moving, not the observer changing viewpoint."
predict_prompt: "If a star is twice as far away, what happens to its parallax angle (bigger or smaller)?"
play_steps:
  - "Choose a preset star and record its parallax $p$ (mas) and distance $d$ (pc)."
  - "Decrease $p$ by a factor of 10 and check that $d$ increases by a factor of 10."
  - "Increase the measurement uncertainty $\\sigma_p$ and discuss why tiny angles are hard to measure."
explain_prompt: "Use the triangle idea to explain why parallax decreases with distance."
model_notes:
  - "Parsec definition: $d\\,(\\mathrm{pc})=1/p\\,(\\mathrm{arcsec})$."
  - "Unit reminder: $1\\,\\mathrm{arcsec}=1000\\,\\mathrm{mas}$."
  - "Because $d\\propto 1/p$, uncertainty in a tiny $p$ can produce large distance uncertainty."
demo_path: "/play/parallax-distance/"
station_path: "/stations/parallax-distance/"
instructor_path: "/instructor/parallax-distance/"
last_updated: "2026-02-02"
---

This demo uses parallax (a geometry measurement) to infer stellar distances in parsecs, and highlights how measurement uncertainty limits what we can know directly.
