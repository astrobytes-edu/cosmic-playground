# conservation-laws Migration Parity Audit

Legacy: `~/Teaching/astr101-sp26/demos/conservation-laws/` (read-only). Compared 2026-09-11 with branch `claude/conservation-laws-refactor`.

## 1) Behavior parity
- Start point: legacy mapped r0 on +x into the start anomaly (`conservation-laws.js:416-427`). The port had lost this and started every orbit at periapsis. Restored through `ConservationLawsModel.initialOrbit` (`nu0Rad`).
- Presets: legacy computed from exact state. The port read the snapped slider back, so Escape gave e = 0.988. Restored: exact `controls`.
- Classification: the same `TwoBodyAnalytic` thresholds, plus a new `radial` type for h = 0 (both versions used to call a body at rest "parabolic").
- Animation: the same equal-area advance (dnu/dt = h/r^2, 1/3 yr per second). New: Play restarts an open orbit that has left the view.

## 2) Visual and interaction parity
- Readouts: legacy showed type, e, eps, h, v, K, U, r_p and a. The refactor shows all of them except a.
- Arrow: legacy and the port both drew 60 px x v/v_circ(r0), clamped to 20-120 px. Now it is the distance covered in a stated number of days, drawn at the orbit's scale.
- View: legacy fitted the drawn path; now a window continuous across e = 1, capped at 6 r0 (1.5 to 50 AU).

## 3) Export parity
- Adds K and U; every field names its unit.

## 4) Pedagogical parity
- Legacy announced "Orbit is X. e = ..." after every update; the port announced nothing. Now announced on `change` and preset clicks.
- Station Mode is new in the port (legacy linked a PDF station card).

## 5) Intentional deltas
- No semi-major-axis readout: the readout row holds 8 cards in two rows at 1280 px.
- Speed factor shown to 3 decimals, so the exact Escape preset (1.414) is distinguishable from 1.41.
- Arrow time step, radial classification and the view window rule, as above.
- Station column labels stay ASCII because the same labels head the CSV export.

## 6) Promotion recommendation
- Parity is met with the deltas above. The readiness decision is recorded in STATUS.md; stable needs Anna's approval.
