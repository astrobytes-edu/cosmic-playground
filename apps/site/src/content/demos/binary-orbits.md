---
title: "Binary Orbits: Two-Body Dance"
status: draft
levels: [Both]
topics: [Orbits]
time_minutes: 12
has_math_mode: false
tags: ["binaries", "center of mass", "gravity"]
learning_goals:
  - "Describe how two masses orbit a shared center of mass."
  - "Predict how changing mass ratio affects orbital motion."
  - "Connect orbital behavior to the idea of gravitational interaction."
misconceptions:
  - "The larger object stays fixed while the smaller one orbits it."
predict_prompt: "If one star is much more massive than the other, where is the center of mass located?"
play_steps:
  - "Adjust mass ratio and observe how the orbit changes."
  - "Compare cases where masses are equal vs very unequal."
  - "Identify which quantities appear to remain consistent."
station_params:
  - parameter: 'Mass ratio ($m_2/m_1$)'
    value: "________"
    notice: "Heavier body moves less; barycenter shifts toward the heavier mass."
  - parameter: 'Separation ($a$)'
    value: "________"
    notice: 'In this circular Kepler model, $P^2 = \frac{a^3}{M_1+M_2}$ (with $P$ in $\mathrm{yr}$, $a$ in $\mathrm{AU}$, masses in $M_{\odot}$).'
explain_prompt: "Explain how the center of mass helps you understand the motion of both bodies."
model_notes:
  - "This pilot assumes perfectly circular orbits and point masses (no eccentricity, tides, or relativity)."
  - 'Units: distance in $\mathrm{AU}$, time in $\mathrm{yr}$, and masses in $M_{\odot}$. This instrument takes $M_1 = 1\,M_{\odot}$ and sets $M_2$ via the mass-ratio slider; it uses the teaching normalization $G = 4\pi^2\,\mathrm{AU}^3/(\mathrm{yr}^2\,M_{\odot})$.'
demo_path: "/play/binary-orbits/"
station_path: "/stations/binary-orbits/"
instructor_path: "/instructor/binary-orbits/"
last_updated: "2026-01-30"
---

This pilot demo visualizes two masses orbiting a shared barycenter. It emphasizes *qualitative* relationships (how the barycenter shifts and how the period changes with separation) rather than modeling a specific astrophysical binary.
