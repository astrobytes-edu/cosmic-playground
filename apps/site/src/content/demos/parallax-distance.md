---
title: "Parallax Distance: Measuring the Stars"
status: draft
content_verified: true
levels: [Both]
topics: [DataInference]
time_minutes: 12
has_math_mode: false
tags: ["parallax", "triangles", "distance"]
readiness: experimental
readinessReason: "Core demo behavior is implemented, but parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/parallax-distance-parity.md"
lastVerifiedAt: "2026-02-09"
learning_goals:
  - "Trace causality: Earth moves in orbit, line-of-sight changes, apparent star position shifts."
  - "Infer parallax from two captures using measured shift and effective baseline."
  - "Connect smaller inferred parallax to larger inferred distance."
  - "Describe why uncertainty and weak baseline geometry limit inference quality."
misconceptions:
  - "Parallax is about the star moving physically, not observer geometry changing."
  - "Any two captures can be interpreted as a six-month (2p) measurement."
predict_prompt: "If you keep the same two capture phases but move the star farther away, what happens to the measured detector shift deltaTheta?"
play_steps:
  - "Set a true distance $d_{\\rm true}$ (pc or ly)."
  - "Capture epoch A and epoch B from the live orbit after choosing useful phase separation."
  - "Read measured shift $\\Delta\\theta$ and effective baseline $B_{\\rm eff}$, then infer $\\hat p=\\Delta\\theta/B_{\\rm eff}$."
  - "Read inferred distance $\\hat d$ and compare it to $d_{\\rm true}$."
  - "Increase $\\sigma_p$ and observe how $\\hat p/\\sigma_{\\hat p}$ and $\\sigma_{\\hat d}$ change."
explain_prompt: "Explain why the same star can produce different measurement quality depending on capture geometry and uncertainty."
model_notes:
  - "Parsec definition: $d\\,(\\mathrm{pc})=1/p\\,(\\mathrm{arcsec})$ and $d\\,(\\mathrm{pc})=1000/p\\,(\\mathrm{mas})$."
  - "General two-capture inference: $\\hat p\\,(\\mathrm{mas})=\\Delta\\theta\\,(\\mathrm{mas})/B_{\\rm eff}\\,(\\mathrm{AU})$."
  - "Equivalent Jan-Jul shift is derived as $2\\hat p$; it is not the direct measurement unless captures are opposite."
  - "Detector exaggeration changes visualization only, never computed $\\hat p$ or $\\hat d$."
demo_path: "/play/parallax-distance/"
station_path: "/stations/parallax-distance/"
instructor_path: "/instructor/parallax-distance/"
last_updated: "2026-02-09"
---

This demo makes the full causal chain legible: Earth moves, line-of-sight changes, and the target star appears to shift against fixed background stars. Students set distance first, capture two observation moments, and then infer parallax and distance from the measured detector shift.
