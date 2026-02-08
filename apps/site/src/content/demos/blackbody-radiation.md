---
title: "Blackbody Radiation: Thermal Spectrum and Temperature"
status: draft
content_verified: true
levels: [Both]
topics: [LightSpectra]
time_minutes: 12
has_math_mode: false
tags: ["blackbody", "temperature", "spectrum"]
readiness: experimental
readinessReason: "Thermal-spectrum core is stable with Explore/Understand tabs; full launch-gate and parity signoff remain pending."
parityAuditPath: "docs/audits/migrations/blackbody-radiation-parity.md"
lastVerifiedAt: "2026-02-02"
learning_goals:
  - "Relate temperature to Planck-curve shape and Wien peak shift."
  - "Use Stefan-Boltzmann scaling to separate surface flux from total emitted power trends."
  - "Recognize that perceived color is an integrated visible-band impression, not only the peak wavelength."
misconceptions:
  - "Peak wavelength alone determines observed color."
  - "Temperature alone determines luminosity for all stars."
  - "Red stars are hotter than blue stars."
predict_prompt: "If you heat an object up, does its peak emission shift toward redder or bluer wavelengths?"
play_steps:
  - "Use the temperature slider (or presets) and watch the peak marker shift to shorter/longer wavelength."
  - "Toggle log vs linear intensity to see the long-wavelength tail more clearly."
  - "Use the visible-band highlight to connect spectrum shape to a qualitative color impression."
explain_prompt: "Use peak shift, curve shape, and T^4 scaling to explain what changes with temperature and what assumptions remain."
model_notes:
  - "The curve is generated from Planck's law and plotted in relative (normalized) intensity."
  - "Units: wavelength $\\lambda$ is cm internally (displayed in nm); temperature $T$ is K."
  - "As temperature increases, the peak shifts to shorter wavelengths (Wien scaling: $\\lambda_{\\rm peak}\\propto 1/T$)."
  - "Surface emitted flux rises steeply with temperature (Stefan-Boltzmann scaling: $F\\propto T^4$)."
  - "High-fidelity ZAMS/HR inference is handled in the separate `stars-zams-hr` instrument."
demo_path: "/play/blackbody-radiation/"
station_path: "/stations/blackbody-radiation/"
instructor_path: "/instructor/blackbody-radiation/"
last_updated: "2026-02-08"
---

Use the temperature slider (or presets) to compare where the spectrum peaks and how the overall power changes.
