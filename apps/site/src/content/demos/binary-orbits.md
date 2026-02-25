---
title: "Binary Orbits: Dynamical Reasoning Lab"
status: draft
content_verified: true
levels: [Both]
topics: [Orbits]
time_minutes: 16
has_math_mode: false
tags: ["binaries", "center of mass", "radial velocity", "conservation laws"]
readiness: experimental
readinessReason: "Core dynamics and RV-observable workflows are now implemented; parity and launch-gate signoff are still pending."
parityAuditPath: "docs/audits/migrations/binary-orbits-parity.md"
lastVerifiedAt: "2026-02-25"
featured: true
learning_goals:
  - "Use momentum conservation to explain why the lighter body moves faster around the barycenter."
  - "Explain shared period through shared angular frequency $\\omega = 2\\pi/P$."
  - "Connect barycentric motion to spectroscopic observables through RV amplitudes $K_1$ and $K_2$."
  - "Relate circular-orbit energies ($K$, $U$, $E$) to separation scaling and virial balance."
  - "Infer mass ratio from measured RV amplitudes using $q = K_1/K_2$ and compare to model truth."
misconceptions:
  - "The larger object stays fixed while the smaller one orbits it."
  - "If one object moves faster, it must have a shorter period."
predict_prompt: "When $M_2/M_1$ decreases at fixed separation, predict how $P$, $v_1$, and $a_1$ change before revealing readouts."
play_steps:
  - "Change $M_2/M_1$, complete the prediction checkpoint, then compare your prediction to revealed trends in $P$, $v_1$, and $a_1$."
  - "Prediction gating is enforced for snapshots and Copy Results while a reveal is pending."
  - "Use the linear momentum check to verify $M_1v_1 = M_2v_2$ in the barycentric frame."
  - "Use the invariant panel as a discrimination task: select all must-hold statements and avoid distractors."
  - "Toggle angular frequency view and verify $v_1 = \\omega a_1$ and $v_2 = \\omega a_2$."
  - "Switch to RV view, vary inclination $i$, and compare amplitudes $K_1$ and $K_2$."
  - "Switch to Energy view and track how $K$, $U$, and $E$ scale when changing separation and mass ratio."
  - "Start the RV inversion challenge, click both RV curves to measure amplitudes, infer $q$, then reveal and compare error."
station_params:
  - parameter: 'Secondary mass ratio ($M_2/M_1$)'
    value: "________"
    notice: "Lower $M_2/M_1$ shifts the barycenter toward $M_1$ and increases the secondary's speed/amplitude."
  - parameter: 'Separation ($a$, AU)'
    value: "________"
    notice: 'At fixed masses, period follows $P \\propto a^{3/2}$.'
  - parameter: 'Inclination ($i$, deg)'
    value: "________"
    notice: 'RV amplitudes scale as $K \\propto \\sin i$ and vanish for face-on systems ($i=0^\\circ$).'
explain_prompt: "Explain, using one invariant, one observable, and one energy statement, how this model links conservation laws to stellar mass inference."
model_notes:
  - "This model enforces Newton's laws for two point masses in circular orbit about a shared barycenter."
  - 'It conserves total linear momentum in the barycentric frame: $M_1v_1 = M_2v_2$.'
  - 'Units: distance in $\\mathrm{AU}$, time in $\\mathrm{yr}$, and masses in $M_{\\odot}$ with $G = 4\\pi^2\\,\\mathrm{AU}^3/(\\mathrm{yr}^2 M_{\\odot})$. '
  - "Excluded physics: eccentricity, tides, relativity, and mass transfer."
  - "RV inversion challenge in this pass assumes a circular, double-lined case where $q = K_1/K_2$."
demo_path: "/play/binary-orbits/"
station_path: "/stations/binary-orbits/"
instructor_path: "/instructor/binary-orbits/"
last_updated: "2026-02-25"
---

This instrument turns binary motion into a reasoning workflow: predict first, test conservation constraints, connect orbital dynamics to radial-velocity observables, then use energy decomposition and RV inversion to close the inference loop.
