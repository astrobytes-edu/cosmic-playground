---
title: "Blackbody Radiation: Color and Temperature"
status: draft
content_verified: true
levels: [Both]
topics: [LightSpectra]
time_minutes: 12
has_math_mode: false
tags: ["blackbody", "temperature", "spectrum"]
readiness: experimental
readinessReason: "Core demo behavior is implemented, but parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/blackbody-radiation-parity.md"
lastVerifiedAt: "2026-02-02"
learning_goals:
  - "Relate temperature to the shape and peak of a thermal spectrum."
  - "Explain why hotter objects can appear ‘bluer’ and cooler ones ‘redder’."
  - "Distinguish spectrum shape from total brightness."
misconceptions:
  - "Red stars are hotter than blue stars."
predict_prompt: "If you heat an object up, does its peak emission shift toward redder or bluer wavelengths?"
play_steps:
  - "Use the temperature slider (or presets) and watch the peak marker shift to shorter/longer wavelength."
  - "Toggle log vs linear intensity to see the long-wavelength tail more clearly."
  - "Use the visible-band highlight to connect spectrum shape to a qualitative color impression."
explain_prompt: "Use peak shift and curve shape to explain how temperature changes observed color."
model_notes:
  - "The curve is generated from Planck's law and plotted in relative (normalized) intensity."
  - "Units: wavelength $\\lambda$ is cm internally (displayed in nm); temperature $T$ is K."
  - "As temperature increases, the peak shifts to shorter wavelengths (Wien scaling: $\\lambda_{\\rm peak}\\propto 1/T$)."
  - "Total emission rises steeply with temperature (Stefan-Boltzmann scaling: $\\propto T^4$)."
demo_path: "/play/blackbody-radiation/"
station_path: "/stations/blackbody-radiation/"
instructor_path: "/instructor/blackbody-radiation/"
last_updated: "2026-02-02"
---

Use the temperature slider (or presets) to compare where the spectrum peaks and how the overall power changes.
