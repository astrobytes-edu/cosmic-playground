---
title: "Conservation Laws: Energy & Momentum"
status: draft
content_verified: true
levels: [Both]
topics: [Orbits]
time_minutes: 10
has_math_mode: false
tags: ["energy", "momentum", "invariants"]
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
predict_prompt: "In an ideal closed system with no external forces, what happens to total momentum over time?"
play_steps:
  - "Start at $v/v_{\\rm circ}=1$ and direction $0^\\circ$ to see a near-circular bound orbit."
  - "Increase $v/v_{\\rm circ}$ toward $\\sqrt{2}$ and notice $\\varepsilon$ approaches 0 at the escape boundary."
  - "Change direction (e.g., $60^\\circ$) and compare how $|h|$ and periapsis $r_p$ change even at similar speed factor."
explain_prompt: "State what appears conserved in the model, and what assumptions make that conservation reasonable."
model_notes:
  - "Teaching units: AU / yr / $M_{\\odot}$ with $G = 4\\pi^2\\,\\mathrm{AU}^3/(\\mathrm{yr}^2\\,M_{\\odot})$."
  - "Orbit type is determined by conserved specific energy $\\varepsilon$ and angular momentum $h$."
  - "Escape at $v/v_{\\rm circ}=\\sqrt{2}$."
demo_path: "/play/conservation-laws/"
station_path: "/stations/conservation-laws/"
instructor_path: "/instructor/conservation-laws/"
last_updated: "2026-02-02"
---

Start with a circular case ($v/v_{\\rm circ}=1$), then move toward escape ($\\sqrt{2}$) and beyond to see how $\\varepsilon$ changes sign.
