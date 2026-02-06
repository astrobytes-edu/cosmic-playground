# Stellar Demo 02 Memo: Opacity & Photon Diffusion Lab (ASTR 201 Primary)

**Date:** 2026-02-06  
**Status:** Draft (implementation-ready memo)  
**Scope:** Demo 2 only, aligned to stellar-suite ordering where Hydrostatic Equilibrium is Demo 3

## 1. Purpose

Build a dedicated opacity and diffusion demo that teaches radiative transport physics as a separate concept from EOS pressure support.

Core pedagogical throughline:
- Demo 1 answers "what sets pressure?"
- Demo 2 answers "how easily does radiation move?"
- Demo 3 (later) answers "how does pressure balance gravity?"

This separation is intentional for ASTR 201 conceptual clarity and model literacy.

## 2. Learning Outcomes

### ASTR 201 outcomes (primary)
- Explain why opacity $\kappa$ is the transport bottleneck variable.
- Compute and interpret mean free path $\lambda$, optical depth $\tau$, and diffusion timescale $t_{\rm diff}$.
- Identify dominant opacity regimes in $\log\rho$-$\log T$ space.
- Distinguish local-state diagnostics from profile-integrated diagnostics.

### Secondary transfer outcomes
- Interpret how composition (especially $X$) changes electron-scattering opacity.
- Explain why Rosseland-mean-style closures depend on LTE-like assumptions.

## 3. Physics Model

## 3.1 Core opacity channels (default)

Model total opacity as a sum of simplified channels:

$$
\kappa_{\rm tot} = \kappa_{\rm es} + \kappa_{\rm Kr} + \kappa_{{\rm H}^-}
$$

with:

$$
\kappa_{\rm es} \approx 0.2(1+X)\ {\rm cm^2\,g^{-1}}
$$

$$
\kappa_{\rm Kr} = \kappa_0\,\rho\,T^{-3.5}
$$

and an envelope-focused ${{\rm H}^-}$ approximation in the cool regime (explicit validity bounds shown in UI).

## 3.2 Transport diagnostics (required)

Mean free path:

$$
\lambda = \frac{1}{\kappa_{\rm tot}\rho}
$$

Optical depth from radius $r$ to surface $R$:

$$
\tau(r) = \int_r^R \kappa_{\rm tot}(r')\,\rho(r')\,dr'
$$

Random-walk scaling and diffusion time:

$$
N_{\rm steps}\sim \left(\frac{L}{\lambda}\right)^2,\quad
t_{\rm diff}\sim \frac{L^2}{D_{\rm rad}},\quad
D_{\rm rad}\sim \frac{c\lambda}{3}
$$

so

$$
t_{\rm diff}\sim \frac{3L^2}{c\lambda}
$$

where $L$ is the relevant path scale (local slab thickness in point mode, $R$-scale in profile mode).

## 3.3 LTE / thermal-equilibrium honesty (required)

Opacity closures are treated as LTE-like pedagogical approximations (Rosseland-mean intent, not full non-LTE transport).

UI must show an assumption chip:
- `Opacity model: LTE-like closure (teaching approximation)`

Advanced mode may include an exploratory departure factor:

$$
\kappa_{\rm eff}=\eta_\kappa\,\kappa_{\rm tot}
$$

with clear warning that $\eta_\kappa\neq 1$ is a proxy, not a full non-LTE solver.

## 4. Interaction Design (recommended pattern)

Use the same two-level pattern as Demo 1:

- Level 1 main compare (fast orientation)
- Level 2 click-to-focus deep dive (mechanism understanding)

## 4.1 Main compare panel

- Opacity channel cards: $\kappa_{\rm es}$, $\kappa_{\rm Kr}$, $\kappa_{{\rm H}^-}$, $\kappa_{\rm tot}$
- Live diagnostics: $\lambda$, $\tau$, $t_{\rm diff}$
- Regime map in $\log\rho$-$\log T$ with current-state marker
- Assumption chips (LTE-like closure, active profile/preset source)

## 4.2 Focus deep dive (per channel)

Tabs:
- `Physical picture`
- `Equation anatomy`
- `Scaling sandbox`

Channel-specific deep-dive examples:
- Electron scattering: composition sensitivity via $X$
- Kramers: strong $T^{-3.5}$ dependence
- H$^-$: cool-atmosphere relevance window and limits
- Diffusion: random walk intuition and scaling checks

## 5. Modes

### Conceptual mode
- Minimal equations, strong visual emphasis on bottlenecks and trends.
- Primary outputs: dominant channel + qualitative diffusion difficulty.

### Quantitative mode
- Full equations and cgs units.
- Live numeric readouts for $\kappa$ terms, $\lambda$, $\tau$, $t_{\rm diff}$.
- Profile plot(s): $\kappa(r)$ and $\tau(r)$ where profile is available.

### Advanced mode
- Optional OPAL overlay for comparison against analytic channels.
- Optional $\eta_\kappa$ exploratory control.
- Error/validity badges for out-of-range approximation use.

## 6. Inputs, Controls, and Presets

## 6.1 Input source modes

- `Point mode` (no profile dependency):
  - User controls local $T$, $\rho$, and composition.
  - Fast for equation intuition and scaling.

- `Profile mode` (with `StarProfileSource`):
  - Load profile from Demo 5 (Polytrope) or curated profile presets.
  - Enables $r$-dependent $\kappa(r)$, $\lambda(r)$, $\tau(r)$, and integrated diffusion estimates.

## 6.2 Core controls

- $\log_{10} T$ slider (K)
- $\log_{10}\rho$ slider (g cm$^{-3}$)
- Composition controls $X$, $Y$, $Z$
- Source mode selector (`Point` vs `Profile`)
- Preset selector
- Mode selector (Conceptual / Quantitative / Advanced)

## 6.3 Presets (ship in v1)

- Solar core
- Solar radiative zone
- Solar convective envelope (cooler/high-$\kappa_{{\rm H}^-}$ context)
- Massive-star envelope
- Red giant envelope
- White dwarf envelope (transport contrast case)

Each preset includes expected dominant opacity channel and expected diffusion behavior.

## 7. Outputs and Exports

Export payload:
- Inputs: mode, source mode, preset ID, $T$, $\rho$, $X$, $Y$, $Z$
- Opacity channels: $\kappa_{\rm es}$, $\kappa_{\rm Kr}$, $\kappa_{{\rm H}^-}$, $\kappa_{\rm tot}$
- Transport diagnostics: $\lambda$, $\tau$, $t_{\rm diff}$, assumed path scale $L$
- Profile arrays (if profile mode): $r$, $\kappa(r)$, $\lambda(r)$, $\tau(r)$
- Assumption flags (LTE-like closure, OPAL overlay on/off, $\eta_\kappa$ if used)

All labels include explicit units.

## 8. Acceptance Criteria

- Demo provides a separate, dedicated opacity/transport experience (not folded into Demo 1).
- Main compare panel and click-to-deep-dive flow are both implemented.
- Mean free path, optical depth, and diffusion-time diagnostics update in real time.
- Regime map clearly shows channel dominance regions and current state.
- Works in both point mode and profile mode.
- Advanced mode supports OPAL comparison overlay without changing default lightweight behavior.
- Includes LTE-like assumption disclosure and validity messaging.

## 9. Validation Tests

- Monotonic/limit checks:
  - At fixed $T$, increasing $\rho$ decreases $\lambda$.
  - At fixed $\rho$, Kramers contribution decreases with increasing $T$.
  - Electron scattering term follows composition trend with $X$.
- Diffusion scaling checks:
  - $t_{\rm diff}\propto L^2$ for fixed $\lambda$.
  - $t_{\rm diff}\propto 1/\lambda$ for fixed $L$.
- Profile integration checks:
  - $\tau(r)$ is non-increasing with radius toward surface.
  - Surface boundary yields $\tau(R)\approx 0$ (numerical tolerance).
- Regression benchmark checks:
  - Canonical preset ordering (core generally shorter $\lambda$ than envelope) holds.

## 10. Future Improvements Backlog

- OPAL default channel calibration and coefficient fitting workflow
- Additional opacity channels for advanced contexts (molecular, conductive where relevant)
- Better non-LTE proxy options for pedagogy experiments
- Optional coupling view with Demo 7 to show $\nabla_{\rm rad}$ sensitivity to $\kappa$

## 11. Linkage to Demo 3 (Hydrostatic, deferred memo)

Demo 3 should consume Demo 1 EOS outputs and optionally borrow Demo 2 transport diagnostics for context overlays, but remain focused on force balance:

$$
\frac{dP}{dr} = -\frac{\rho G M(r)}{r^2}
$$

with mass continuity:

$$
\frac{dM}{dr} = 4\pi r^2\rho
$$

No detailed Demo 3 interaction spec is defined here by design.
