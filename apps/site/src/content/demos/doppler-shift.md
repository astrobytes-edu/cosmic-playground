---
title: "Doppler Shift of Light"
status: draft
content_verified: true
levels: [Both]
topics: [LightSpectra, DataInference]
time_minutes: 14
has_math_mode: false
tags: ["doppler shift", "redshift", "blueshift", "spectral lines", "radial velocity"]
readiness: candidate
readinessReason: "SoTA UX/pedagogy uplift is complete (playbar transport, deeper challenge deck, tooltip affordances, cross-demo scaffolding) and automated gates are passing; launch-ready now depends on classroom and screen-reader validation artifacts."
parityAuditPath: "docs/audits/migrations/doppler-shift-parity.md"
lastVerifiedAt: "2026-02-24"
learning_goals:
  - "Relate radial motion to observed wavelength and frequency shifts in spectral lines."
  - "Interpret redshift z and convert between z and radial velocity with the correct formula."
  - "Decide when non-relativistic Doppler is acceptable and when relativistic Doppler is required."
  - "Use lab-vs-observed spectral comparisons to infer motion direction and speed."
misconceptions:
  - "Light waves should bunch near the source like sound ripples in air."
  - "Redshift always means cosmological expansion; all redshifts are the same mechanism."
  - "Wavelength and frequency shifts are perfectly symmetric at any speed in non-rel formulas."
predict_prompt: "Hydrogen H-alpha sits at 656.3 nm. If a source is approaching at 300 km/s, does the line move to longer or shorter wavelength, and by about how much?"
play_steps:
  - "Start at rest, identify the representative line in both lab and observed strips."
  - "Set +300 km/s and then -300 km/s. Compare direction changes in both wavelength and frequency readouts."
  - "Switch to relativistic mode and apply preset 7 (3C 273) and preset 8 (high-z galaxy)."
  - "Use the redshift-slider regime markers and divergence readout to identify where non-relativistic error exceeds 5%."
  - "Open the Sound vs Light callout and explain why observer-side crest spacing is uniform for light."
  - "Use the `Why this line?` helper to verify how representative-line anchoring works."
  - "Run one Mystery Spectrum round: predict -> check -> explain your evidence, then copy challenge evidence for debrief."
explain_prompt: "At what velocity scale does the non-relativistic Doppler formula become meaningfully wrong (>5% error), and why does the approximation break there?"
model_notes:
  - "Kinematic Doppler model for light only: positive velocity means receding (redshift), negative means approaching (blueshift)."
  - "Physical state coupling uses relativistic conversion between z and v_r; formula toggle changes readout prediction mode, not physical state storage."
  - "When non-relativistic error exceeds 5% (relativistic regime), the demo applies relativistic predictions and announces the fallback."
  - "The redshift slider includes two marker thresholds (blue and red) for the 5% approximation boundary because $z$ mapping is asymmetric."
  - "Wave diagram shows uniform observer-side crest spacing at $\\lambda_{\\rm obs}$; this is intentional misconception resistance against sound-style ripple intuition."
  - "Non-relativistic formulas: lambda_obs = lambda_0 (1 + v/c) and nu_obs = nu_0 / (1 + v/c); note the finite-v asymmetry."
  - "Relativistic formulas: lambda_obs = lambda_0 sqrt((1+beta)/(1-beta)) and nu_obs = nu_0 sqrt((1-beta)/(1+beta))."
  - "Regime classification uses divergence between z_nonrel and z_rel to quantify approximation quality."
  - "Representative-line readouts use the strongest visible rest line (380-750 nm) when available, while all catalog lines still shift in the comparator."
  - "The representative-line helper chip explains visible-first anchoring and fallback to strongest-overall line when no visible line exists."
  - "Mystery mode includes a post-check evidence copy helper without changing `ExportPayloadV1` Copy Results behavior."
  - "Hydrogen wavelengths are model-derived; multi-element catalogs are empirical line lists (vacuum wavelengths, NIST teaching subset)."
  - "Cosmological and gravitational redshift are distinct mechanisms and not modeled in this instrument."
demo_path: "/play/doppler-shift/"
station_path: "/stations/doppler-shift/"
instructor_path: "/instructor/doppler-shift/"
last_updated: "2026-02-24"
---

Explore how relative motion shifts spectral lines and why astronomers can measure radial velocity from light alone.
