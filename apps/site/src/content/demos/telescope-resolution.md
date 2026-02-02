---
title: "Telescope Resolution: Sharper Eyes"
status: draft
content_verified: true
levels: [Both]
topics: [Telescopes]
time_minutes: 10
has_math_mode: false
tags: ["resolution", "aperture", "diffraction"]
learning_goals:
  - "Distinguish magnification from resolution."
  - "Explain how aperture affects the ability to separate close objects."
  - "Connect resolution limits to diffraction qualitatively."
misconceptions:
  - "More magnification always shows more detail."
predict_prompt: "If you keep magnification fixed but increase aperture, what changes: brightness, resolution, or both?"
play_steps:
  - "Compare two apertures and note what details become distinguishable."
  - "Try to separate a close pair; record the threshold where it becomes possible."
  - "Compare the effect of changing magnification vs changing aperture."
explain_prompt: "Explain why resolution is limited and why aperture matters for detail."
model_notes:
  - 'Diffraction-limited scaling: $\\theta_\\mathrm{diff} \\approx 1.22\\,\\lambda/D$ (converted to arcseconds for readouts).'
  - "Atmosphere (toy model): seeing can dominate over diffraction; AO reduces the seeing contribution in the demo."
  - "The Copy Results export includes diffraction limit, effective resolution, and resolved/marginal/unresolved status (with explicit units)."
demo_path: "/play/telescope-resolution/"
station_path: "/stations/telescope-resolution/"
instructor_path: "/instructor/telescope-resolution/"
last_updated: "2026-02-02"
---

This demo shows how telescope resolution depends on wavelength and aperture, and how atmospheric seeing can blur images from the ground.
