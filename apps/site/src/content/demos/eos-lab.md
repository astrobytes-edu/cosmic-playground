---
title: "EOS Lab: Pressure Support in Stars"
status: draft
content_verified: true
levels: [ASTR201]
topics: [Stars]
time_minutes: 12
has_math_mode: false
tags: ["stellar-structure", "equation-of-state", "pressure"]
readiness: experimental
readinessReason: "EOS core channels + diagnostics + regime map are implemented with finite-T Fermi branches; neutron/pair-rich extensions remain planned."
parityAuditPath: "docs/audits/migrations/eos-lab-parity.md"
lastVerifiedAt: "2026-02-06"
learning_goals:
  - "Compare gas, radiation, and electron-degeneracy pressure channels using cgs units."
  - "Explain how composition enters EOS through mu and mu_e."
  - "Use T/T_F to judge when zero-temperature degeneracy assumptions are plausible."
misconceptions:
  - "Stellar pressure support is only thermal gas pressure."
  - "Radiation pressure always follows aT^4/3 without assumption checks."
predict_prompt: "Before touching controls: in a white-dwarf-like state, which pressure channel should dominate and why?"
play_steps:
  - "Start with Solar core and White dwarf core presets and compare P_gas, P_rad, and P_deg,e."
  - "At fixed density, increase temperature by about one decade and track P_rad/P_gas."
  - "Use T/T_F and the LTE framing chip to justify which assumptions are credible in each state."
station_params:
  - parameter: "Preset"
    value: "Solar core"
    notice: "Gas pressure should be dominant, but radiation is not zero."
  - parameter: "Preset"
    value: "White dwarf core"
    notice: "Electron degeneracy pressure should dominate."
explain_prompt: "Use one table row to explain pressure-channel dominance and one row to explain an assumption limit."
model_notes:
  - "Gas pressure uses P_gas = rho k_B T/(mu m_u) with fully ionized mixture approximations for mu and mu_e."
  - "Radiation pressure uses an LTE-like closure with explicit caution framing for low-density/high-temperature cases."
  - "Finite-temperature electron pressure uses Fermi-Dirac EOS (nonrelativistic branch first, relativistic branch at larger x_F)."
  - "Displayed degeneracy channel is P_deg,e = max(P_e,FD - n_e k_B T, 0), so classical electron pressure is not double-counted."
demo_path: "/play/eos-lab/"
station_path: "/stations/eos-lab/"
instructor_path: "/instructor/eos-lab/"
last_updated: "2026-02-06"
---

A pressure-channel lab for ASTR 201 that keeps units explicit, assumptions visible, and model diagnostics tied to the same state.
