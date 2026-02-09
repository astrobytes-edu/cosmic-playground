# parallax-distance Migration Parity Audit

## 1) Behavior parity
- Legacy Jan/Jul fixed-epoch workflow has been intentionally replaced by live orbit plus capture A/B workflow.
- Inference now supports arbitrary phase separation by using effective baseline projection $B_{\rm eff}$.
- Distance remains primary input; inferred parallax and inferred distance are outputs.

## 2) Visual/interaction parity
- Preserved Cosmic Playground shell triad layout (sidebar, stage, readouts, shelf drawer).
- Stage now shows explicit target direction and parallax axis in orbit panel.
- Detector panel supports overlay, difference, and blink modes with reduced-motion guardrails.
- Workflow stepper enforces set distance -> capture A -> capture B progression.

## 3) Export parity
- Export payload schema version remains `version: 1`.
- Parameter/readout naming updated to capture-based semantics (`deltaTheta`, `B_eff`, `p_hat`, `d_hat`).
- No structural breaking changes to `ExportPayloadV1` object shape.

## 4) Pedagogical parity
- Causality chain is explicit: Earth motion -> line-of-sight change -> detector shift.
- Removed ambiguous "measured 2p" framing for non-opposite captures.
- Added effective-baseline warning and uncertainty-driven quality framing.

## 5) Intentional deltas
- Dot-product projection inference replaces raw 2D magnitude separation for unbiased axis-based measurement.
- Equivalent Jan-Jul shift `2p_hat` is now clearly a derived quantity.
- Station-mode table columns changed to distance-first capture workflow fields.

## 6) Promotion recommendation
- Recommendation remains **experimental** until full site e2e pass and screenshot refresh are completed.
