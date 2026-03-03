# Retrograde Motion UX + Hardening Summary (2026-03-03)

## What Changed
- Clarified longitude semantics in the plot with the y-axis label `Apparent longitude (deg, continuous)`, an inline tooltip explaining the unwrapped/continuous curve, and a compact legend for line, retrograde band, and cursor.
- Replaced the binary state cue with a 3-state indicator (`Direct`, `Stationary`, `Retrograde`) driven by hysteresis thresholds (`epsLo = 0.005 deg/day`, `epsHi = 0.010 deg/day`) to reduce flicker near stationary transitions.
- Added explicit same-planet guardrails (`observer === target`): inline warning, `Undefined` state, disabled retrograde overlays/jump controls, and stable readouts without NaN-driven UI breakage.
- Added orbit-view teaching overlays (default off): line-of-sight ray, 0-degree reference axis, and optional `lambda_app` angle arc.
- Updated stationary controls into teaching cues with approximate target-day labels (`Prev stationary ≈ Day ...`, `Next stationary ≈ Day ...`, `Retrograde midpoint ≈ Day ...`) and midpoint jump feedback.
- Added a coarse-step precision notice for `plotStepDay >= 2`, including text that event detection still uses the internal `0.25 day` model grid.
- Added first-run, non-blocking 3-step onboarding with dismissal persistence (`localStorage` key `cp:retrograde-motion:onboarding:v1`) and a Help-path action to reopen onboarding.
- Added an Advanced derived readout `Δn` (relative angular speed proxy) with explanatory tooltip.
- Hardened unwrap continuity in physics model handling for 180-degree tie cases and added regression tests.

## Why
- New learners can interpret the core observable and visual cues without pre-reading implementation details.
- Hysteresis-based classification makes state transitions near stationary points pedagogically cleaner and less visually noisy.
- Same-planet selection now teaches that retrograde is undefined in that configuration instead of silently auto-retargeting.
- Optional overlays and dynamic jump labels improve conceptual scaffolding while keeping default UI uncluttered.
- Coarse-step warnings and unwrap tests reduce confusion around precision limits and numerical edge cases.

## Known Limitations
- The undefined same-planet mode still computes the underlying model series for continuity, but retrograde-specific overlays/readouts are intentionally suppressed.
- The `Δn` proxy is informational only and does not change event detection or simulation behavior.
- Onboarding persistence is browser-local and does not sync across devices.

## QA Notes
- Unit/logic coverage now includes hysteresis transitions, undefined-mode behavior, stationary label generation, and `Δn` proxy checks.
- Physics coverage now includes unwrap continuity edge cases near 180-degree transitions.
- E2E coverage expanded for axis/legend/tooltip clarity, same-pair disabled states, overlay toggles, dynamic stationary labels, onboarding reopen flow, and focus affordances.
