# Stellar Demo 01 Memo: Equation of State Lab (ASTR 201 Primary)

**Date:** 2026-02-06  
**Status:** Draft (implementation-ready memo)  
**Scope:** Demo 1 only, designed as a full long-term kernel (not throwaway v1)

## 1. Purpose

Build an Equation of State (EOS) demo that is pedagogically optimized for ASTR 201 now, while remaining usable in lower-division contexts and keeping the physics/model architecture extensible so we do not need a rewrite later.

Core learning thread:
- Students see that stellar pressure support is a sum of distinct mechanisms.
- Students connect composition to particle density through $\mu$ and $\mu_e$.
- Students identify when gas pressure, radiation pressure, or electron degeneracy pressure dominates.

## 2. Learning Outcomes

### ASTR 201 outcomes (primary)
- Use EOS equations with units to compute and compare $P_{\rm gas}$, $P_{\rm rad}$, and $P_{\rm deg,e}$.
- Explain the role of composition via $\mu$ and $\mu_e$.
- Use $T/T_F$ to evaluate whether degeneracy assumptions are physically appropriate.
- Distinguish pressure-support physics from transport physics and identify why opacity belongs in a separate transport demo.

### Secondary transfer outcomes
- Explain in words why pressure in stars is not "just gas."
- Predict which pressure channel tends to dominate in stellar envelopes, massive-star interiors, and white dwarf interiors.

## 3. Full-Kernel Architecture (No Rewrite Later)

Implement Demo 1 around a composable pressure model:

- `pressureGasCgs(state)`
- `pressureRadiationCgs(state)`
- `pressureElectronDegeneracyCgs(state)` (zero-temperature baseline now)
- `pressureTotalCgs(state) = P_gas + P_rad + P_deg,e`
- Diagnostic helpers (`beta`, ratios, $T_F$, $T/T_F$, regime classifier)

This keeps the public model contract stable while allowing future swaps:
- finite-$T$ Fermi-Dirac correction,
- Coulomb/ion corrections,
- optional neutron-degeneracy extension module.

## 4. Physics Model (v1 baseline, full quality)

All equations displayed in the UI should be authored in LaTeX with `$...$` / `$$...$$`.

### 4.1 Gas pressure

$$
P_{\rm gas} = \frac{\rho k_B T}{\mu m_u}
$$

Particle number density:

$$
n = \frac{\rho}{\mu m_u}
$$

### 4.2 Radiation pressure

$$
P_{\rm rad} = \frac{a T^4}{3}
$$

This specific closure is valid when the local radiation field is close to thermal equilibrium and approximately isotropic (optically thick LTE-like conditions).

### 4.3 Electron degeneracy pressure (include now)

Electron number density:

$$
n_e = \frac{\rho}{\mu_e m_u}
$$

Fermi momentum:

$$
p_F = \hbar (3\pi^2 n_e)^{1/3}
$$

Define relativity parameter:

$$
x_F = \frac{p_F}{m_e c}
$$

Use Chandrasekhar zero-$T$ EOS form for $P_{\rm deg,e}$ (implementation detail can use closed form or stable NR/relativistic interpolation). Also display limiting scalings:

- non-relativistic: $P_{\rm deg,e} \propto \rho^{5/3}$
- ultra-relativistic: $P_{\rm deg,e} \propto \rho^{4/3}$

### 4.4 Composition and mean molecular weights (must show explicitly)

For fully ionized composition fractions $(X,Y,Z)$:

$$
\frac{1}{\mu} \approx 2X + \frac{3}{4}Y + \frac{1}{2}Z
$$

$$
\frac{1}{\mu_e} \approx X + \frac{Y}{2} + \frac{Z}{2}
$$

UI must include a short interpretation:
- $\mu$: mean mass per particle in units of $m_u$
- $\mu_e$: mean mass per free electron in units of $m_u$

### 4.5 Degeneracy validity diagnostic (required)

Compute Fermi temperature:

$$
T_F = \frac{E_F}{k_B}, \quad E_F = \sqrt{(p_F c)^2 + (m_e c^2)^2} - m_e c^2
$$

Display:

$$
\chi_{\rm deg} = \frac{T}{T_F}
$$

Interpretation bands:
- $\chi_{\rm deg} \ll 1$: strongly degenerate
- $\chi_{\rm deg} \sim 1$: transition regime
- $\chi_{\rm deg} \gg 1$: weak/non-degenerate limit

### 4.6 Thermal equilibrium framing (required pedagogy, low complexity)

To avoid overcomplicating v1 while staying honest:

- Keep the default radiation channel as:

$$
P_{\rm rad,LTE} = \frac{aT^4}{3}
$$

- Add a visible assumption chip in the main panel:
  - `Radiation model: LTE closure (optically thick approximation)`
- Add one advanced explanatory control (not required for Conceptual mode):
  - departure factor $\eta_{\rm rad}$ with default $\eta_{\rm rad}=1$
  - displayed relation:

$$
P_{\rm rad} = \eta_{\rm rad}\frac{aT^4}{3}
$$

with explicit note: $\eta_{\rm rad}\neq 1$ is a pedagogical proxy for non-LTE/non-blackbody local fields, not full radiative transfer.

This preserves a simple default and gives 201-level students an honest "assumptions lens."

### 4.7 Eddington diagnostic (restored, optional but recommended)

Include an optional radiative-force diagnostic panel in Quantitative/Advanced modes:

$$
\Gamma = \frac{\kappa L}{4\pi c G M}
$$

Interpretation:
- $\Gamma \ll 1$: gravity dominates radiative force
- $\Gamma \rightarrow 1$: radiative force approaches gravitational binding

Scope note:
- This is a force-balance context diagnostic, not a replacement for local EOS terms.
- UI should display assumptions for $\kappa$, $L$, and $M$ inputs used in this estimate.

## 5. Controls and Presets

### 5.1 Required controls

- $\log_{10} T$ slider (K): $3 \rightarrow 9$
- $\log_{10} \rho$ slider (g cm$^{-3}$): $-10 \rightarrow 10$
- Composition sliders: $X$, $Y$, $Z$ with constraint $X+Y+Z=1$
- Mode selector: Conceptual / Quantitative / Advanced
- Preset selector

### 5.2 Presets (ship in v1)

- Solar core (benchmark)
- Solar envelope / photosphere-like
- Massive-star core
- Red giant envelope
- White dwarf core (C/O-like)
- Brown dwarf interior (degeneracy-relevant transition case)

Each preset includes:
- $(T,\rho,X,Y,Z)$
- a one-sentence "why this is interesting"
- expected dominant pressure channel(s)

## 6. Visualization Design ("What pressure looks like")

Use a two-level interaction model:

- Level 1 (main compare): side-by-side pressure comparison at the current state.
- Level 2 (focus deep dive): click a pressure card to open a dedicated mechanism view.

Main compare view:

- three pressure cards ($P_{\rm gas}$, $P_{\rm rad}$, $P_{\rm deg,e}$)
- stacked contribution bar + log chart
- regime map
- assumption chips (including LTE closure for radiation)
- opacity handoff chip linking to Demo 2: "Pressure support is local EOS; transport limits come from $\kappa$ and diffusion."
- optional $\Gamma$ chip/panel for radiative-force context

Focus deep dive view (per pressure):

- `Physical picture` tab: mechanism visualization
- `Equation anatomy` tab: term-by-term equation interpretation
- `Scaling sandbox` tab: hold two variables fixed and vary one to see response

Return from focus view preserves current global state so students can compare immediately again.

Pressure-specific deep dive content:

- Panel A: Gas pressure intuition
  - particle-collision cartoon (qualitative)
  - live $P_{\rm gas}$ and scaling badge $P_{\rm gas}\propto \rho T$
- Panel B: Radiation pressure intuition
  - photon momentum flux cartoon
  - live $P_{\rm rad}$ and scaling badge $P_{\rm rad}\propto T^4$
  - explicit LTE badge with "why this formula applies" tooltip
- Panel C: Degeneracy pressure intuition
  - occupied momentum-state/Fermi-sea concept graphic
  - live $P_{\rm deg,e}$ with regime badge (NR vs relativistic tendency)

Companion quantitative views:
- stacked pressure bar (fractional contribution)
- log-value chart for $P_{\rm gas}$, $P_{\rm rad}$, $P_{\rm deg,e}$
- $\log \rho$-$\log T$ regime map with current point and dominance shading

## 7. Modes

### Conceptual mode
- Minimal equations by default (expandable).
- Strong focus on mechanism cards and "what to notice."
- Readouts: dominant channel, pressure fractions, regime label.

### Quantitative mode
- Full equations visible.
- Full cgs readouts, ratios, and $\mu/\mu_e$ calculations.
- Regime map with boundaries and numeric diagnostics.

### Advanced mode
- Add solver diagnostics and model assumptions panel.
- Show $x_F$ and $T/T_F$ prominently.
- Enable optional comparison overlays (NR-only vs full relativistic-degeneracy curve).

## 8. Neutrons: Include Now or Later?

Recommendation: **later** (as Advanced extension), not core v1.

Rationale:
- For ASTR 101/201 stellar-structure learning, electron degeneracy is central (white dwarfs, dense stellar matter trend).
- Neutron degeneracy is primarily neutron-star EOS territory and can distract from core stellar-structure outcomes.
- We can keep versatility by reserving an extension interface now.

Planned extension path:
- `pressureNeutronDegeneracyCgs(state)` plugin in Advanced mode
- "Compact Objects Bridge" preset group (white dwarf vs neutron-star regime)
- explicit warning that this extension crosses into compact-object EOS assumptions

## 9. Outputs and Exports

Export payload (v1):
- inputs: $T$, $\rho$, $X$, $Y$, $Z$, mode, preset ID
- derived: $\mu$, $\mu_e$, $n$, $n_e$, $p_F$, $x_F$, $T_F$, $T/T_F$
- pressures: $P_{\rm gas}$, $P_{\rm rad}$, $P_{\rm deg,e}$, $P_{\rm tot}$
- ratios: $P_{\rm rad}/P_{\rm gas}$, $P_{\rm deg,e}/P_{\rm tot}$, $\beta$
- regime classification label
- model version + assumption flags

All exported labels must include explicit units where applicable (cgs).

## 10. Acceptance Criteria

- Demo computes $P_{\rm gas}$, $P_{\rm rad}$, $P_{\rm deg,e}$, and $P_{\rm tot}$ from one shared state.
- UI displays $\mu$ and $\mu_e$ equations and values.
- Presets include at least six canonical environments listed above.
- Regime map and pressure microscope are synchronized to the same state.
- Degeneracy diagnostics include $p_F$, $x_F$, and $T/T_F$.
- Include $\beta$ readout and optional $\Gamma$ diagnostic with assumption notes.
- Mode switch changes pedagogy density, not the core physics model.

## 11. Validation Tests (must ship with model)

- Benchmark tests (known-order behavior):
  - solar-core-like state: gas-dominated with non-negligible radiation
  - white-dwarf-like state: electron degeneracy dominates
- Scaling tests:
  - at fixed $\rho$, $P_{\rm rad}\propto T^4$
  - at fixed $T$, $P_{\rm gas}\propto \rho$
- Degeneracy consistency tests:
  - $p_F$ monotonic in $\rho$
  - NR/relativistic slope transition behaves correctly at high $x_F$
- Composition tests:
  - $\mu$ and $\mu_e$ shift correctly under hydrogen-poor vs hydrogen-rich presets

## 12. Future Improvements Backlog (Designed-In, Not Re-architecture)

- Finite-temperature Fermi-Dirac correction for $P_{\rm deg,e}(T)$
- Partial ionization-aware $\mu(T,\rho)$ approximations
- Coulomb and ion-correlation EOS corrections
- Neutron-degeneracy extension module (compact-object bridge)
- OPAL-backed EOS comparison overlay for "model honesty" check
- Classroom prompt pack tied to preset-specific misconceptions

## 13. Suggested Demo 2 Linkage

Demo 2 should import this EOS module directly so students see continuity:
- same composition sliders and $\mu$ semantics,
- same pressure components,
- added force-balance layer via hydrostatic equilibrium.
