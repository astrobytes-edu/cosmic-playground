---
title: "Retrograde Motion — Backlog"
bundle: "retrograde-motion"
section: "backlog"
demo_slug: "retrograde-motion"
last_updated: "2026-02-03"
has_math: true
---
> **Scope note:** These are *future improvements* for the `retrograde-motion` instrument. They are intentionally split into (A) “SoTA UX + pedagogy”, (B) “Model extensions that remain honest”, and (C) “Physics correctness hardening”.

## A) SoTA UX + pedagogy (fun + teachable)

1) **Time travel controls (past/future)**
   - Add a window-start control (allow negative model days) and a “jump to…” input.
   - Add quick buttons: “Go back 10 months”, “Go forward 10 months”, “Center on nearest retrograde”.
   - Guardrail copy: keep “model day” messaging front-and-center (no calendar claims).

2) **Story mode overlays (toggleable)**
   - Velocity arrows for observer + target at the current time (recommended by design spec).
   - A small “sweep direction” indicator for the sign of $d\\tilde{\\lambda}/dt$ at the current time.
   - A “line-of-sight history” overlay (fading) for the last $N$ model days.

3) **Plot UX polish**
   - Add axis ticks/labels: $t$ (day) and $\\tilde{\\lambda}_{\\mathrm{app}}$ (deg).
   - Add a “zoom to retrograde interval” button (sets window to [start-$\\Delta$, end+$\\Delta$]).
   - Add “hover/focus tooltip” at cursor: $t$, $\\lambda_{\\mathrm{app}}$, $d\\tilde{\\lambda}/dt$ (must work on keyboard focus, not hover-only).

4) **Make it playful**
   - “Compare two targets” mode: same observer, two targets on the same plot (clearly labeled; no color-only meaning).
   - “Race” mode: animate time at a user-controlled rate (must respect reduced motion).
   - “Challenge prompts” (via runtime hooks): find stationary points, estimate retrograde duration, compare inferior vs superior cases.

## B) Versatility (without lying)

1) **Configurable planet set**
   - Add Mercury (interior extreme case) and optionally Uranus/Neptune (outer slow case) with explicit “teaching model” notes.
   - Allow “custom planet” elements entry $(a,e,\\varpi,L_0)$ (with validation) for sandboxed exploration.

2) **Better presets**
   - Add presets for:
     - Earth $\\to$ Jupiter (slow retrograde)
     - Earth $\\to$ Saturn (slow retrograde)
     - Mars observer $\\to$ Jupiter target (advanced)
   - Each preset should include a “what to notice” sentence.

3) **Export richness (still stable)**
   - Add an optional “Copy CSV (series)” action with downsampled rows: $t$, $\\lambda_{\\mathrm{app}}$, $\\tilde{\\lambda}$, $d\\tilde{\\lambda}/dt$, state.
   - Keep “Copy results” as the stable v1 summary payload.

## C) Physics / correctness hardening (SoTA honesty)

1) **Canonical element source + citations**
   - Move planet elements into a dedicated dataset file in `packages/physics` (single source of truth) with citations (e.g. J2000 mean elements).
   - Add a “dataset provenance” note in model notes (still no calendar-date claims).

2) **Numerical stability for far past/far future**
   - Ensure all angle computations avoid catastrophic precision for large $t$:
     - compute $M(t)$ using modular arithmetic (track integer turns separately) so trig inputs stay bounded.
   - Add a regression test that `computeSeries` works for windows centered at large |t| (e.g. $t=\\pm 10^6$ day) without NaNs.

3) **Sharper event detection**
   - Add tests that stationary refinement meets the spec tolerance (bracket width $<10^{-3}$ day) across multiple planet pairs.
   - Add “edge-case” tests: windows that start/end inside retrograde, very short windows, and targets with small eccentricity.

4) **Model extensions (future scope, but physically meaningful)**
   - Optional inclination + projection to ecliptic longitude (3D-to-2D) with careful pedagogy; keep the default coplanar mode for clarity.
   - Optional light-time correction (advanced; likely overkill for ASTR101, but could be a “math mode” extension later).
