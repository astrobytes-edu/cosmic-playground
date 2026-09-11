---
title: "Conservation Laws: Energy & Momentum"
status: draft
content_verified: false
levels: [Both]
topics: [Orbits]
time_minutes: 10
has_math_mode: false
tags: ["energy", "momentum", "invariants", "energy conservation", "angular momentum", "closed system", "kinetic energy", "potential energy"]
readiness: experimental
readinessReason: "Core demo behavior is implemented, but parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/conservation-laws-parity.md"
lastVerifiedAt: "2026-02-02"
learning_goals:
  - "Identify quantities that remain constant under specific assumptions."
  - "Use conservation ideas to predict qualitative outcomes."
  - "Connect ‘conserved’ to ‘closed system’ and stated assumptions."
misconceptions:
  - "Energy is always conserved in the same form without exceptions."
  - "A faster-moving orbiting body has more total energy."
predict_prompt: "A planet on an elliptical orbit moves closer to its star. What happens to its speed, its kinetic energy and its total energy?"
play_steps:
  - "Press Play (or Step) on the Elliptical preset and watch $K$ and $U$ trade places while $\\varepsilon$ stays fixed."
  - "Drag $v/v_{\\rm circ}$ from 1.41 to 1.42: the orbit switches from elliptical to hyperbolic. Press Escape for exactly $\\sqrt{2}$, where $\\varepsilon = 0$."
  - "Set the direction to $60^\\circ$ and compare $|h|$ and periapsis $r_p$ with $0^\\circ$ at the same speed factor."
explain_prompt: "Which quantities stayed constant while the body moved, which changed, and what assumptions make that true?"
model_notes:
  - "Teaching units: AU / yr / $M_{\\odot}$ with $G = 4\\pi^2\\,\\mathrm{AU}^3/(\\mathrm{yr}^2\\,M_{\\odot})$."
  - "Orbit type is determined by conserved specific energy $\\varepsilon$ and angular momentum $h$."
  - "Escape at $v/v_{\\rm circ}=\\sqrt{2}$; the Escape preset sets it exactly, while the slider steps from 1.41 to 1.42."
demo_path: "/play/conservation-laws/"
station_path: "/stations/conservation-laws/"
instructor_path: "/instructor/conservation-laws/"
last_updated: "2026-09-11"
---

Start with a circular case ($v/v_{\rm circ}=1$), press Play on the Elliptical preset to watch $K$ and $U$ trade, then press Escape ($\sqrt{2}$) and go beyond to see $\varepsilon$ change sign.
