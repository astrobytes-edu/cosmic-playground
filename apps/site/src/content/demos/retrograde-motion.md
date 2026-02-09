---
title: "Retrograde Motion: Apparent Longitude from Relative Motion"
status: draft
content_verified: false
levels: [Both]
topics: [EarthSky, Orbits]
time_minutes: 12
has_math_mode: false
tags: ["retrograde", "stationary points", "relative motion", "apparent longitude", "inferior conjunction", "opposition"]
readiness: experimental
readinessReason: "Core demo behavior is implemented, but parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/retrograde-motion-parity.md"
lastVerifiedAt: "2026-02-03"
featured: true
learning_goals:
  - "Define retrograde motion as an apparent reversal caused by viewing geometry and relative motion."
  - "Interpret apparent (sky) longitude $\\lambda_{\\mathrm{app}}$ as the direction from an observer planet to a target planet in an inertial frame."
  - "Identify stationary points as times when $d\\tilde{\\lambda}/dt = 0$ and connect them to the start/end of retrograde."
misconceptions:
  - "Retrograde means the planet reverses its real orbit."
predict_prompt: "If Earth is moving faster than Mars, what do you predict happens to Mars’s apparent direction in the sky near opposition?"
play_steps:
  - "Use the Earth (observer) $\\to$ Mars (target) preset and find a retrograde interval (shaded)."
  - "Use sidebar transport controls; use the stage-adjacent timeline row to scrub model day $t$."
  - "Switch to Earth $\\to$ Venus and compare how the geometry hint changes for an inferior planet."
explain_prompt: "Use relative motion and the observer-to-target direction to explain why $d\\tilde{\\lambda}/dt$ can become negative even though neither orbit reverses."
model_notes:
  - "The model uses coplanar Keplerian ellipses around the Sun with elements $(a,e,\\varpi,L_0)$ defined at an epoch $t_0$; it is not ephemeris-grade."
  - "Apparent (sky) longitude is defined by $\\lambda_{\\mathrm{app}}(t)=\\operatorname{wrap}_{0..360}(\\arctan2(y_t-y_o,\\,x_t-x_o))$ and is unwrapped with the 180-deg jump rule to form $\\tilde{\\lambda}(t)$."
  - "Retrograde is defined by $d\\tilde{\\lambda}/dt&lt;0$ using a central-difference derivative on an internal step of $\\Delta t_{\\mathrm{internal}}=0.25$ day (model day)."
  - "Time is model time only: $1$ model month $=30$ model days; do not interpret the output as calendar dates."
demo_path: "/play/retrograde-motion/"
station_path: "/stations/retrograde-motion/"
instructor_path: "/instructor/retrograde-motion/"
last_updated: "2026-02-03"
---

Use a simple Keplerian model to visualize how the direction to a planet can briefly reverse in the sky (retrograde) even though the planet never reverses its orbit.

Links
- [Student demo](../../play/retrograde-motion/)
- [Instructor notes](../../instructor/retrograde-motion/)
