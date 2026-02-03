# Retrograde Motion (Apparent Longitude) - Design Spec

**Date:** 2026-02-03

**Status:** Draft (physics and UX contracts locked; ready for implementation planning once confirmed)

## Readiness verdict

This spec is **very close to implementable**. The core physics contract (coplanar Keplerian ellipses + apparent direction from observer to target + retrograde via $d\tilde{\lambda}/dt < 0$) is solid and teachable.

Where it is not yet "SoTA-ready" by default is mostly in two places that can otherwise create "wait, why did it jump?" student confusion:

1) **Reference frame and epoch contracts** (what is $0^\circ$ and what does "Model day" mean)
2) **Angle unwrapping and event detection contracts** (stationary points and retrograde bounds must be stable, not jittery)

This document locks those down.

## One-liner

An instrument that lets students pick an **observer planet** and a **target planet**, then visualizes the target's **apparent (sky) longitude** as seen from the observer over model time, highlighting **retrograde** intervals and **stationary points**.

## Goals

- Teach retrograde as a consequence of **relative motion** and **viewing geometry**, not "planets reversing their real orbit."
- Make the primary observable a single, consistent quantity:
  - Apparent (sky) longitude: $\\lambda_{\\mathrm{app}}(t)$ in degrees, defined in a 2D orbital plane with a fixed inertial $0$-deg axis.
- Support a general observer/target workflow immediately (v1):
  - Observer: Earth (default) plus advanced options: Venus, Mars, Jupiter, Saturn.
  - Target: Venus, Mars (suggested preset), Jupiter, Saturn.
- Provide SoTA-but-teachable visuals:
  - A linked longitude-vs-time plot and a top-down orbit view, visible simultaneously.
- Keep the physics model "correct for the stated model" (no avoidable approximations):
  - Keplerian ellipses in one plane around the Sun.
  - Kepler equation solver (no circular-orbit shortcut).
- Keep unit/notation correctness and contracts:
  - Units explicit in labels and exports.
  - All math authored as LaTeX (no unicode math symbols).

## Non-goals (v1)

- Ephemeris-grade prediction of real-world dates/times for retrograde events.
- N-body perturbations.
- Orbital inclination and true sky coordinates (RA/Dec).
- Exoplanet systems (backlog item; requires separate data design and strong honesty messaging).

## Physics model (v1 contract)

### Coordinate system and time

- Work in a 2D orbital plane with a fixed inertial axis.

#### Inertial $0^\circ$ axis (explicit)

- Define longitude $0^\circ$ as the positive $x$ axis (to the right) in the orbit view.
- The UI must **draw this axis** as a faint reference ray with a "0^\circ" tick so students can see what longitude is measured from.

#### Model time and window units (explicit)

- Time is **model day** $t$ (real-valued), measured from a chosen epoch $t_0$.
- The UI must not claim calendar accuracy. Display "Model day" rather than real dates.
- "Month" in UI controls means:
  - $1\ \mathrm{model\ month} = 30\ \mathrm{model\ days}$ (definition for this instrument).

### Keplerian state per planet

Each planet has fixed orbital elements (v1):

- Semi-major axis $a$ (AU)
- Eccentricity $e$ (unitless)
- Longitude of perihelion $\\varpi$ (deg)

#### Orbital element set (avoid the $e \to 0$ footgun)

Prefer storing mean longitude at epoch $L_0$ rather than mean anomaly at epoch $M_0$:

- Mean longitude at epoch $L_0$ (deg at $t=t_0$)
- Mean motion $n$ (rad/day), where $n = 2\pi/P$

Then compute:

$$L(t) = L_0 + \frac{180}{\pi}\,n(t-t_0)\quad (\mathrm{deg})$$
$$M(t) = \operatorname{wrap}_{0..2\pi}\left( \frac{\pi}{180}\left(L(t) - \varpi\right)\right)\quad (\mathrm{rad})$$

Rationale: $M$ is defined relative to perihelion, and becomes pedagogically awkward as $e \to 0$. Using $L$ keeps the reference-frame story coherent and reduces edge-case ambiguity.

### Solving for position

At time $t$:

Solve Kepler's equation for eccentric anomaly $E$:

$$M = E - e\\sin E$$

#### Kepler solver contract (deterministic)

Solve $f(E)=E-e\sin E - M = 0$ via Newton iteration:

- Initial guess:
  - $E_0 = M$ if $e \le 0.8$
  - $E_0 = \pi$ if $e > 0.8$ (robust start for high $e$)
- Iterate:
  - $E_{k+1} = E_k - \frac{f(E_k)}{f'(E_k)}$
  - where $f'(E) = 1 - e\cos E$
- Convergence:
  - stop when $|\Delta E| < 10^{-12}$ rad, or after 15 iterations.
- Fallback:
  - if Newton does not converge, fall back to bisection on $E \in [0,2\pi)$ (deterministic and safe).

Convert to true anomaly $\nu$:

$$\\nu = 2\\arctan2\\left(\\sqrt{1+e}\\,\\sin\\frac{E}{2},\\;\\sqrt{1-e}\\,\\cos\\frac{E}{2}\\right)$$

Radius:

$$r = a(1 - e\\cos E)$$

Heliocentric position in the orbital plane:

$$x = r\\cos(\\nu + \\varpi),\\quad y = r\\sin(\\nu + \\varpi)$$

### Apparent (sky) longitude from observer to target

Observer position $(x_o,y_o)$, target position $(x_t,y_t)$:

$$\\lambda_{\\mathrm{app}}(t)=\\operatorname{wrap}_{0..360}\\left(\\arctan2(y_t-y_o,\\;x_t-x_o)\\right)$$

### Angle wrapping and unwrapping (explicit algorithm)

Students will encounter apparent-angle wraparound. The implementation must treat this as a first-class contract.

Compute a wrapped longitude:

- $\lambda(t) \in [0,360)$ from the $\arctan2$ output.

Then build an unwrapped longitude $\tilde{\lambda}(t)$ by "phase unwrapping" along the sampled time series:

- Let $\tilde{\lambda}_0 = \lambda_0$
- For each subsequent sample $i$:
  - $\Delta = \lambda_i - \lambda_{i-1}$
  - if $\Delta > 180$, set $\Delta \leftarrow \Delta - 360$
  - if $\Delta < -180$, set $\Delta \leftarrow \Delta + 360$
  - $\tilde{\lambda}_i = \tilde{\lambda}_{i-1} + \Delta$

This prevents "teleport" jumps in the plot and makes derivatives meaningful.

### Retrograde detection

Define retrograde intervals by the sign of the time derivative:

$$\\frac{d\\tilde{\\lambda}}{dt} < 0\\quad\\Rightarrow\\quad \\text{retrograde}$$

#### Derivative estimation contract (stable near stationary points)

To avoid jitter exactly where students care most (stationary points), do not rely on a coarse forward difference.

- Internal sampling step:
  - $\Delta t_{\mathrm{internal}} = 0.25\ \mathrm{day}$ (default)
- Derivative estimation:
  - Use a central difference for interior points:
    $$\left.\frac{d\tilde{\lambda}}{dt}\right|_{t_i} \approx \frac{\tilde{\lambda}_{i+1}-\tilde{\lambda}_{i-1}}{2\Delta t_{\mathrm{internal}}}$$
  - Use one-sided differences only at window endpoints.

The plot can be decimated for readability if needed, but event detection must use the internal grid.

#### Stationary point detection + refinement contract

Stationary points are defined by:

$$\frac{d\tilde{\lambda}}{dt} = 0$$

Detection:

- Find brackets $[t_i,t_{i+1}]$ where $d\tilde{\lambda}/dt$ changes sign.

Refinement (so "Next stationary" lands on the event, not "near it"):

- Run bisection (or secant) on the derivative within the bracket until:
  - bracket width $< 10^{-3}\ \mathrm{day}$, or a similar small tolerance.

### Pedagogical guardrail (required copy)

Near the retrograde state indicator and in model notes include a single sentence that targets the core misconception:

- "Retrograde here is **apparent**: the planet never reverses its orbit; the sign flip comes from relative motion and viewing geometry."

## UI/UX and visuals

### Shell and layout

- Use the standard demo shell with a triad-style emphasis (controls / stage / readouts).
- Stage shows **two linked views simultaneously**:
  1) Longitude vs time plot (primary)
  2) Top-down orbit view (secondary)

### Controls (left panel)

- **Preset selector**:
  - Default preset: observer Earth, target Mars
- **Observer planet** select (advanced):
  - Earth (default), Venus, Mars, Jupiter, Saturn
- **Target planet** select:
  - Venus, Mars, Jupiter, Saturn
- **Time controls**:
  - Window length (months) and sampling step (days) for the plotted series
  - A time scrubber (model day) and click-to-scrub on the plot
- **Navigation buttons**:
  - Next stationary
  - Previous stationary
  - Center on retrograde interval (nearest)
- **Visibility toggles** (default off):
  - Show other planets in orbit view (for context)
  - Show auxiliary traces (optional): line-of-sight history, event markers, etc.

### Stage view A: longitude plot

- Plot $\\tilde{\\lambda}_{\\mathrm{app}}(t)$ (unwrapped) over the chosen window.
- Show the current-time cursor and allow click-to-scrub.
- Highlight retrograde intervals (shaded bands) and stationary points (markers).
- Include a compact, always-visible wrapped strip for intuition:
  - A thin band showing $\lambda_{\mathrm{app}}(t)\bmod 360^\circ$ as a function of time.
  - Keep the unwrapped plot as the main curve for stability and pedagogy.

#### Accessibility requirement (do not rely on color alone)

- Retrograde highlighting must use both:
  - a distinct fill (tone), and
  - a pattern (for example diagonal hatch) or embedded label text "retrograde" within the band.

### Stage view B: orbit view

- Draw Sun at center, and the Kepler ellipses for observer and target.
- Show current positions and the observer-to-target line of sight.
- Show a small angle indicator at the observer corresponding to $\\lambda_{\\mathrm{app}}$.
- "Fit to view" is allowed; include a clear note that geometry is not to scale unless a "true scale" toggle is on (optional).
- Draw the inertial axis reference ray (positive $x$) with a "0^\circ" tick.

#### SoTA pedagogy upgrade (recommended; toggleable)

Add one of these (or both) as toggleable overlays:

1) Velocity arrows (tangential) on observer and target at the current time.
2) A small sweep indicator that mirrors the sign of $d\tilde{\lambda}/dt$ (increasing vs decreasing) at the current time.

This turns retrograde into something students can see happening, not just detect numerically.

### Readouts (right panel)

Minimum readouts:

- Model day $t$
- $\\lambda_{\\mathrm{app}}$ (deg)
- $d\\tilde{\\lambda}/dt$ (deg/day)
- State: Direct / Retrograde
- Nearest stationary day(s)
- Retrograde interval bounds (start/end day) and duration (days)

### Inferior vs superior geometry hint (pedagogical)

When the target is interior to the observer's orbit (for example, Venus as seen from Earth), retrograde aligns conceptually with inferior-conjunction geometry. When the target is exterior (for example, Mars as seen from Earth), retrograde aligns with opposition geometry.

Add a small hint label:

- "Inferior-planet geometry" or "Superior-planet geometry"

Keep it short; link to model notes for explanation.

### Drawer (bottom)

- Model notes (assumptions, limits, and what "retrograde" means here).
- "No calendar claims" note: this is model time, not ephemeris.
- Short glossary:
  - observer, target, apparent longitude, stationary point

All drawer math must be LaTeX.

## Exports (clipboard)

Export payload must be v1 and include:

- Parameters:
  - Observer, target
  - Window settings (start day, end day, step)
  - Model type (Keplerian 2D)
- Readouts:
  - Current day
  - $\\lambda_{\\mathrm{app}}$ (deg)
  - $d\\tilde{\\lambda}/dt$ (deg/day)
  - Direct/Retrograde
  - Next/prev stationary days
  - Retrograde start/end days (nearest event)
- Notes:
  - Assumptions (Keplerian, coplanar, inertial axis, model time)

## Accessibility requirements (minimum)

- Keyboard operable controls and buttons.
- Plot supports keyboard time stepping (e.g., step day forward/back) in addition to pointer scrubbing.
- Visible focus states.
- Copy results updates a live region.

## Performance and determinism

- Precompute series for the current window at fixed step (default 1 day).
- Keep computation deterministic and offline.
- Avoid excessive recomputation: changing only the cursor time should not recompute the entire series.

## Implementation contracts checklist (copy into PR description)

- Reference axis is defined and drawn:
  - $0^\circ$ is +$x$ in the orbit view, and the reference ray is visible.
- Elements and epoch are documented:
  - Elements are explicitly "Keplerian, coplanar, approximate" (no ephemeris claim).
  - Uses $(a,e,\varpi,L_0)$ (or equivalent) and defines $t_0$.
- Kepler solver is deterministic:
  - Newton with the stated tolerance and max iterations, plus fallback.
- Unwrap algorithm is exactly as specified (jump threshold $180^\circ$).
- Derivative uses central difference on an internal step ($\Delta t_{\mathrm{internal}} = 0.25$ day).
- Stationary points are refined (bracket + bisection/secant) for stable "Next stationary" navigation.
- Regression expectations (must be true in this model):
  - Earth observer, Mars target: clear retrograde interval with two stationary points.
  - Earth observer, Venus target: clear retrograde interval near inferior-planet geometry.

## Verification (when implemented)

- `corepack pnpm build`
- `corepack pnpm -r typecheck`
- `corepack pnpm -C packages/physics test` (if adding a model)
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## Backlog (explicitly deferred)

- Exoplanet systems (for example, TRAPPIST-1) with observer-as-planet: requires dedicated dataset + messaging and likely separate "system selector" UX.
- Inclined orbits and true sky coordinates (RA/Dec).
- N-body perturbations or ephemeris-grade calibration.
