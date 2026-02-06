---
title: "Angular Size: The Sky’s Ruler"
status: draft
content_verified: true
levels: [Both]
topics: [EarthSky]
time_minutes: 10
has_math_mode: false
tags: ["angles", "apparent size", "distance"]
readiness: experimental
readinessReason: "Core demo behavior is implemented, but parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/angular-size-parity.md"
lastVerifiedAt: "2026-02-02"
learning_goals:
  - "Relate an object’s apparent size to its physical size and distance."
  - "Interpret small angles as a practical measurement tool in astronomy."
  - "Explain why nearby objects can look larger than distant ones."
misconceptions:
  - "If something looks bigger, it must be physically bigger."
predict_prompt: "If two objects have the same physical size, which looks bigger in the sky: the nearer one or the farther one?"
play_steps:
  - "Compare the apparent size of two objects at different distances."
  - "Hold distance fixed and change physical size; note what changes."
  - "Try to find two different (size, distance) pairs that look the same."
explain_prompt: "Use your observations to explain how apparent size depends on both size and distance."
model_notes:
  - 'Angular diameter uses the exact geometric relation $\theta = 2\arctan\!\left(\frac{D}{2d}\right)$.'
  - 'Units: diameter $D$ and distance $d$ are always in km; angles are reported in $^\circ$ / $^\prime$ / $^{\prime\prime}$.'
  - 'Moon time modes: (1) Orbit (perigee ↔ apogee) and (2) Recession (Myr from today; a toy linear extrapolation using a constant recession rate).'
demo_path: "/play/angular-size/"
station_path: "/stations/angular-size/"
instructor_path: "/instructor/angular-size/"
last_updated: "2026-02-02"
---

This demo explores why objects can look big or small in the sky depending on both their physical size and their distance.

Use presets (astronomical + everyday) to build intuition, then use Station Mode to record (diameter, distance, angular size) cases you can compare and explain.
