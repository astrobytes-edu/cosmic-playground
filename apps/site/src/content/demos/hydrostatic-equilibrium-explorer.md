---
title: "Hydrostatic Equilibrium Explorer"
status: draft
content_verified: true
levels: [ASTR201]
topics: [Stars]
time_minutes: 14
has_math_mode: true
tags: ["stellar-structure", "hydrostatic-equilibrium", "pressure-scale-height", "ideal-gas", "core-temperature"]
readiness: experimental
readinessReason: "The demo is designed as a guided ASTR 201 structure explorer, but launch-gate classroom validation and accessibility evidence are still pending."
parityAuditPath: "docs/audits/migrations/hydrostatic-equilibrium-explorer-parity.md"
lastVerifiedAt: "2026-09-03"
learning_goals:
  - "Explain hydrostatic equilibrium as a balance between inward gravity and outward pressure support."
  - "Use the pressure scale height to connect local gravity to how steeply pressure must change with radius."
  - "Apply the ideal gas law to infer why higher gravity or smaller scale height implies a hotter interior."
  - "Use the support chain to reason from stellar mass and radius to an order-of-magnitude core temperature."
misconceptions:
  - "Hydrostatic equilibrium means there are no forces in the star."
  - "Pressure only matters at the center, not throughout the star."
  - "A star’s core temperature is directly measured instead of inferred from a model."
  - "If a star is supported, the pressure profile must be flat."
predict_prompt: "Before touching any controls, predict what happens to the required pressure gradient and core temperature if gravity gets stronger while the star’s size stays the same."
play_steps:
  - "Start from the solar-like baseline and identify the readouts for gravity, pressure support, pressure scale height, and core temperature."
  - "Increase mass at fixed radius and watch how the support chain steepens."
  - "Shrink the star at fixed mass and compare the pressure scale height against the radius."
  - "Adjust composition or mean molecular weight and note how the ideal-gas temperature estimate changes."
  - "Check the balance display and explain whether the model is under-supported, balanced, or over-supported."
station_params:
  - parameter: "Mass M"
    value: "1 M_sun"
    notice: "Use the solar-like baseline first, then compare to a more compact or more massive state."
  - parameter: "Radius R"
    value: "1 R_sun"
    notice: "Keep the radius fixed for one trial so the gravity change is easy to see."
  - parameter: "Mean molecular weight mu"
    value: "0.61"
    notice: "A higher mu requires a higher temperature for the same pressure."
  - parameter: "Core temperature T_c"
    value: "order 10^7 K"
    notice: "Treat this as an inferred scale, not a directly measured value."
explain_prompt: "Use one sentence to explain how gravity, scale height, and the ideal gas law combine to make a core-temperature estimate."
model_notes:
  - 'The support chain is local and causal: gravity sets the needed pressure gradient, and the pressure gradient determines the scale height.'
  - 'The model should show hydrostatic equilibrium as $\frac{dP}{dr} = -\frac{G M(r) \rho(r)}{r^2}$, not as a statement that pressure vanishes.'
  - 'Pressure scale height should be interpreted as $H_P = -\left(\frac{d\ln P}{dr}\right)^{-1} = \frac{P}{\rho g}$, with $g = \frac{G M(r)}{r^2}$.'
  - 'For an ideal gas, $P = \frac{\rho k_B T}{\mu m_u}$, so $T = \frac{\mu m_u}{k_B} \frac{P}{\rho} = \frac{\mu m_u}{k_B} g H_P$.'
  - 'A one-zone core-temperature estimate should be presented as a scaling relation of the form $T_c \sim \frac{\mu m_u}{k_B} \frac{G M}{R}$ times an order-unity structure factor.'
  - 'This explorer is a teaching model, so the core-temperature number should be labeled as an inference from balance, not a full stellar evolution solution.'
demo_path: "/play/hydrostatic-equilibrium-explorer/"
station_path: "/stations/hydrostatic-equilibrium-explorer/"
instructor_path: "/instructor/hydrostatic-equilibrium-explorer/"
last_updated: "2026-03-18"
---

This ASTR 201 explorer turns stellar structure into a balancing act: gravity sets the required pressure gradient, pressure scale height tells you how sharply that balance must change, and the ideal gas law closes the loop to an inferred core temperature.

Use it to move from “the star is in balance” to “I can explain what must be true inside the star.” The demo is intentionally pedagogical and experimental, so the point is to reason through the chain, not to treat the readout as a direct observation.
