---
title: "HR Diagram Inference Lab"
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
lastVerifiedAt: "2026-02-24"
learning_goals:
  - "Use observer-space and theorist-space views to interpret stellar populations as measurement-built maps."
  - "Infer stellar radius from luminosity and effective temperature with explicit Stefan-Boltzmann reasoning."
  - "Infer hidden mass ordering along the main sequence after staged reveal controls are enabled."
  - "Connect mass-dependent lifetimes to conceptual stellar-evolution tracks."
misconceptions:
  - "Temperature alone determines total stellar luminosity."
  - "Main-sequence fits apply equally to giant and compact remnant stars."
  - "Metallicity only changes spectral lines and not bulk stellar structure."
  - "Logarithmic axes distort physics rather than reveal dynamic range."
predict_prompt: "Before revealing mass colors, predict where high-mass and low-mass stars should lie along the main sequence."
play_steps:
  - "Start in Observer CMD mode and identify main sequence, giant-branch, and white-dwarf structures."
  - "Switch to Theorist HR mode and enable radius lines to infer stellar size from L and T_eff."
  - "Use the evolve-a-star tool to compare track shape and timescale for 0.8 and 20 M_sun stars."
  - "Reveal mass colors and infer the hidden mass gradient direction along the main sequence."
  - "Add one-sentence claims to the inference log and export JSON."
station_params:
  - parameter: "Mass M"
    value: "1 Msun"
    notice: "Use as a baseline before moving to higher or lower masses."
  - parameter: "Metallicity Z"
    value: "0.02"
    notice: "Solar-neighborhood reference for initial comparisons."
explain_prompt: "Explain how the same population can be interpreted as an observer CMD and a theorist HR map, then justify one radius and one mass inference."
model_notes:
  - "Main-sequence luminosity and radius use Tout et al. (1996) analytic ZAMS fits over 0.1 <= M/Msun <= 100 and 1e-4 <= Z <= 0.03."
  - "Theorist HR mode uses base-10 logarithmic axes: log(L/L_sun) versus log(T_eff) with hot-left orientation."
  - "Observer CMD mode uses M_V versus (B-V), with deterministic photometric scatter and brighter-up magnitude inversion."
  - "Radius guides follow Stefan-Boltzmann scaling: $$\\frac{L}{L_{\\odot}}=\\left(\\frac{R}{R_{\\odot}}\\right)^2\\left(\\frac{T_{\\rm eff}}{T_{\\odot}}\\right)^4$$."
demo_path: "/play/stars-zams-hr/"
station_path: "/stations/stars-zams-hr/"
instructor_path: "/instructor/stars-zams-hr/"
last_updated: "2026-02-24"
---

This ASTR 201 instrument treats the HR diagram as both a measurement-built map and a hidden-variable inference engine, with staged reveals and explicit model assumptions.
