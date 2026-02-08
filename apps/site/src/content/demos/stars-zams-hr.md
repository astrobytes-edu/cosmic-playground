---
title: "Stars on the ZAMS: Mass, Metallicity, and H-R Position"
status: draft
content_verified: true
levels: [ASTR201]
topics: [Stars]
time_minutes: 14
has_math_mode: false
tags: ["stars", "zams", "hr-diagram", "metallicity"]
readiness: experimental
readinessReason: "Tout-1996 ZAMS model and instrument workflow are implemented; classroom parity and launch-gate QA remain in progress."
parityAuditPath: "docs/audits/migrations/stars-zams-hr-parity.md"
lastVerifiedAt: "2026-02-08"
learning_goals:
  - "Relate stellar mass and metallicity to ZAMS luminosity, radius, and effective temperature."
  - "Interpret H-R diagram position using explicit model assumptions and units."
  - "Distinguish ZAMS-inferred stars from intentional non-ZAMS override presets."
misconceptions:
  - "Temperature alone determines total stellar luminosity."
  - "Main-sequence fits apply equally to giant and compact remnant stars."
  - "Metallicity only changes spectral lines and not bulk stellar structure."
predict_prompt: "Before using controls, predict what happens to Teff and L when mass increases along the ZAMS at fixed metallicity."
play_steps:
  - "Use the mass slider at Z=0.02 and follow the marker along the ZAMS track."
  - "Hold mass fixed and vary metallicity to see how L, R, and Teff shift."
  - "Select an override preset (for example a red supergiant) and compare it against nearby ZAMS states."
station_params:
  - parameter: "Mass M"
    value: "1 Msun"
    notice: "Use as a baseline before moving to higher or lower masses."
  - parameter: "Metallicity Z"
    value: "0.02"
    notice: "Solar-neighborhood reference for initial comparisons."
explain_prompt: "Use one ZAMS case and one override case to explain how assumptions change what the model is allowed to infer."
model_notes:
  - "ZAMS luminosity and radius use analytic fits from Tout et al. (1996) over 0.1 <= M/Msun <= 100 and 1e-4 <= Z <= 0.03."
  - "Effective temperature is derived via Stefan-Boltzmann closure: $T_{\\rm eff} = T_{\\odot}\\left[(L/L_{\\odot})/(R/R_{\\odot})^2\\right]^{1/4}$."
  - "Override presets intentionally bypass ZAMS constraints so evolved/compact stars can be compared with explicit warning text, and metallicity is shown as not-applied while override mode is active."
demo_path: "/play/stars-zams-hr/"
station_path: "/stations/stars-zams-hr/"
instructor_path: "/instructor/stars-zams-hr/"
last_updated: "2026-02-08"
---

This ASTR 201 instrument turns the H-R diagram into a model-driven lab by tying each plotted point to explicit ZAMS assumptions and units.
