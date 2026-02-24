---
title: "Binary Orbits: Two-Body Dance"
status: draft
content_verified: true
levels: [Both]
topics: [Orbits]
time_minutes: 12
has_math_mode: false
tags: ["binaries", "center of mass", "gravity"]
readiness: experimental
readinessReason: "Core demo behavior is implemented with secondary-mass-ratio and realistic-separation controls; parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/binary-orbits-parity.md"
lastVerifiedAt: "2026-02-24"
featured: true
learning_goals:
  - "Describe how two masses orbit a shared center of mass."
  - "Predict how changing mass ratio affects orbital motion."
  - "Connect orbital behavior to the idea of gravitational interaction."
misconceptions:
  - "The larger object stays fixed while the smaller one orbits it."
predict_prompt: "If one star is much more massive than the other, where is the center of mass located?"
play_steps:
  - "Adjust $M_2/M_1$ and watch the barycenter shift (while both bodies keep the same period)."
  - "Change separation $a$ on the log-scale slider and observe how period $P$ changes."
  - "Compare an equal-mass case to an unequal-mass case using Station Mode snapshot rows ($a_1$, $a_2$, $v_1$, $v_2$, $P$)."
station_params:
  - parameter: 'Secondary mass ratio ($M_2/M_1$)'
    value: "________"
    notice: "Lower $M_2/M_1$ moves the barycenter closer to $M_1$ and gives the secondary the larger/faster orbit."
  - parameter: 'Separation ($a$, AU)'
    value: "________"
    notice: 'The slider spans $0.1\rightarrow100$ AU on a log scale; in this circular Kepler model, $P^2 = \frac{a^3}{M_1+M_2}$ (with $P$ in $\mathrm{yr}$, $a$ in $\mathrm{AU}$, masses in $M_{\odot}$).'
explain_prompt: "Explain how the center of mass helps you understand the motion of both bodies."
model_notes:
  - "This pilot assumes perfectly circular orbits and point masses (no eccentricity, tides, or relativity)."
  - 'Units: distance in $\mathrm{AU}$, time in $\mathrm{yr}$, and masses in $M_{\odot}$. This instrument takes $M_1 = 1\,M_{\odot}$ and sets $M_2$ via the secondary-ratio slider ($M_2/M_1 \le 1$); it uses the teaching normalization $G = 4\pi^2\,\mathrm{AU}^3/(\mathrm{yr}^2\,M_{\odot})$.'
demo_path: "/play/binary-orbits/"
station_path: "/stations/binary-orbits/"
instructor_path: "/instructor/binary-orbits/"
last_updated: "2026-02-24"
---

This pilot demo visualizes two masses orbiting a shared barycenter. It emphasizes both qualitative and quantitative relationships: how the barycenter shifts, how orbit size/speed split between bodies, and why both bodies still share one period.
