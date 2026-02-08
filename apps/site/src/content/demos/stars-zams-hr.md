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
  - "Interpret H-R diagram position on base-10 log-log axes using explicit model assumptions and units."
  - "Distinguish surface emitted flux (F) from total luminosity (L) using Stefan-Boltzmann scaling."
  - "Distinguish ZAMS-inferred stars from intentional non-ZAMS override presets."
misconceptions:
  - "Temperature alone determines total stellar luminosity."
  - "Main-sequence fits apply equally to giant and compact remnant stars."
  - "Metallicity only changes spectral lines and not bulk stellar structure."
  - "Logarithmic axes distort physics rather than reveal dynamic range."
predict_prompt: "Before using controls, predict what happens to Teff and L when mass increases along the ZAMS at fixed metallicity."
play_steps:
  - "Use ZAMS mode with the mass slider at Z=0.02 and follow the marker along the ZAMS track."
  - "Hold mass fixed and vary metallicity to see how L, R, and Teff shift."
  - "Switch to Stefan mode, keep Teff fixed, and increase R to see the vertical shift in L."
  - "Turn on constant-R guides and identify the nearest guide for each state."
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
  - "Explore view uses base-10 log-log axes: $\\log_{10}(T_{\\rm eff}\\,[\\mathrm{kK}])$ and $\\log_{10}(L/L_{\\odot})$."
  - "Stefan mode exposes the explicit closure equations: $$F=\\sigma T^4$$ and $$\\frac{L}{L_{\\odot}}=\\left(\\frac{R}{R_{\\odot}}\\right)^2\\left(\\frac{T_{\\rm eff}}{T_{\\odot}}\\right)^4$$."
  - "Override presets intentionally bypass ZAMS constraints so evolved/compact stars can be compared with explicit warning text, and metallicity is shown as not-applied while override mode is active."
demo_path: "/play/stars-zams-hr/"
station_path: "/stations/stars-zams-hr/"
instructor_path: "/instructor/stars-zams-hr/"
last_updated: "2026-02-08"
---

This ASTR 201 instrument turns the H-R diagram into a model-driven lab by tying each plotted point to explicit ZAMS assumptions and units.
