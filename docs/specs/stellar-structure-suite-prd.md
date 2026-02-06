# Product Requirements Document: Stellar Structure Demo Suite

**Version:** 1.1
**Author:** Dr. Anna Rosen / Claude
**Date:** February 5, 2026
**Status:** Draft (Revised with Expert Feedback)
**Project:** Cosmic Playground (NSF IUSE Level 2)

---

## Executive Summary

The Stellar Structure Demo Suite is a progressive, 8-demo learning sequence that teaches students how stars work from first principles. Rather than presenting stellar structure as a monolithic set of equations, students "build a star" piece by piece: starting with pressure and gravity, adding energy generation, then energy transport, and finally earning the right to see all four stellar structure equations working together.

**Key principle:** Comprehensive without becoming MESA-in-the-browser.

**Critical architectural decision:** Demos 5–7 require a consistent stellar profile source. Demo 4 (Polytropes) serves as the **shared backbone**—its output provides $T(r)$, $\rho(r)$, $M(r)$ for energy generation, opacity, and transport demos.

---

## 1. Problem Statement

### The User Problem

Undergraduate astronomy students struggle to understand stellar structure because it's typically taught as four coupled differential equations that must be solved simultaneously. This "all at once" approach obscures the physical intuition: why does pressure balance gravity? What sets the luminosity? Why do some stars have convective cores while others have convective envelopes?

### Who Experiences This Problem

- **Primary:** Undergraduate astronomy majors in stellar astrophysics courses (ASTR 450-level)
- **Secondary:** Graduate students reviewing fundamentals, instructors needing teaching tools
- **Frequency:** Every semester, ~50–100 students per institution taking stellar physics

### Cost of Not Solving

- Students memorize equations without physical understanding
- Instructors resort to static diagrams that can't show parameter dependencies
- No path from "I understand hydrostatic equilibrium" to "I can predict stellar properties"
- Existing tools (MESA, etc.) are too complex for pedagogical exploration

### Evidence

- Course feedback from ASTR 450 (San Diego State University): students cite stellar structure as the hardest conceptual topic
- Similar feedback documented at Princeton, Sydney, Maryland astronomy programs
- No existing interactive suite that builds from first principles to full stellar structure

---

## 2. Goals

### User Goals (What Students Get)

| Goal | Success Metric |
|------|----------------|
| **G1:** Understand that stellar pressure has multiple components | >80% of students correctly identify which pressure dominates in different stellar regions on post-assessment |
| **G2:** Internalize hydrostatic equilibrium as a balancing act | Students can predict qualitatively what happens when pressure or gravity changes (>75% accuracy) |
| **G3:** Connect energy generation to stellar luminosity | Students can explain why massive stars have centrally concentrated burning |
| **G4:** Understand why convection turns on in certain regions | Students can predict convective vs radiative zones for different stellar masses |
| **G5:** Trace the full path from EOS → HSE → structure → $\varepsilon(\rho,T)$ → $L(r)$ → transport → surface $(L, T_{\rm eff})$ | Capstone completion rate >70% with correct H-R diagram placement |

### Business/Project Goals (What the Grant Gets)

| Goal | Success Metric |
|------|----------------|
| **B1:** Demonstrate NSF IUSE educational innovation | Suite cited in at least 3 peer-reviewed astronomy education papers by Year 3 |
| **B2:** Achieve broad adoption | >20 institutions using suite by end of grant period |
| **B3:** Maintain sustainability | All demos run in pure TypeScript with no server dependencies |

---

## 3. Non-Goals (Explicit Scope Boundaries)

| Non-Goal | Rationale |
|----------|-----------|
| **NG1:** Full MESA-like stellar evolution computed live | 🚫 PUNT — Maintenance nightmare. Use precomputed MIST/PARSEC tracks instead. |
| **NG2:** Full radiative transfer / spectral synthesis | 🚫 PUNT — Wrong tool for the job. Use curated spectra + simplified opacity models. |
| **NG3:** Time-dependent stellar evolution (burning through MS) | Separate demo suite; this focuses on *structure* at a snapshot in time. |
| **NG4:** Binary stellar evolution | Out of scope for Level 2; could be Level 3 extension. |
| **NG5:** Full nuclear network (beyond pp/CNO toy models) | Unnecessary complexity for pedagogical goals. |
| **NG6:** 3D stellar structure | 1D radial profiles are sufficient for teaching fundamentals. |
| **NG7:** Rotation, magnetic fields, mass loss | Advanced topics beyond core stellar structure pedagogy. |

---

## 4. Suite-Wide Design Principles

### 4.1 Layered Complexity Modes (Required for All Demos)

Every demo **must** implement three distinct modes with consistent definitions:

| Mode | Definition | UI Behavior |
|------|------------|-------------|
| **Conceptual** | Qualitative relationships, cartoons, normalized/dimensionless plots, minimal equations (hover-to-reveal). Focus on "what happens when I change X?" | Hide equations by default; show only ratios and trends |
| **Quantitative** | Real units (cgs), compute actual values, show governing equations, allow CSV/JSON exports. Focus on "what are the numbers?" | Display equations prominently; show unit-ful values |
| **Advanced** | Extra physics (degeneracy, OPAL tables, partial ionization), stability notes, diagnostics, and caveats about approximations | Unlock additional parameters; show validation diagnostics |

### 4.2 Shared Star Profile Source (`StarProfileSource`)

Demos 5–7 require $T(r)$, $\rho(r)$, $M(r)$ profiles to compute $\varepsilon$, $\kappa$, and $\nabla_{\rm rad}$. These profiles come from a **shared source**:

- **v1 (Required):** Use Demo 4 Polytrope output as the backbone
- **v2 (Future):** Use Demo 8 Capstone solver output when available

**UI Integration:** Students see one coherent "star skeleton" reused across Demos 5–7. Changing the polytrope in Demo 4 propagates to dependent demos.

```typescript
interface StarProfileSource {
  readonly r: Float64Array;      // radial coordinate [cm]
  readonly rho: Float64Array;    // density [g/cm³]
  readonly T: Float64Array;      // temperature [K]
  readonly M_r: Float64Array;    // enclosed mass [g]
  readonly P: Float64Array;      // pressure [dyn/cm²]
  readonly sourceDemo: 'polytrope' | 'capstone';
}
```

### 4.3 Physics Sanity Invariants (Enforced Suite-Wide)

All solvers must enforce and report:

| Invariant | Enforcement |
|-----------|-------------|
| $M(r)$ strictly increasing | Halt + diagnostic if violated |
| $P, \rho, T \geq 0$ | Clamp to floor + warning indicator |
| $L(r)$ non-decreasing for $\varepsilon > 0$ | Diagnostic if violated |
| Graceful stop conditions | "Photosphere reached," "pressure floor hit," "integration diverged" |

### 4.4 Predict–Play–Explain Pedagogy (P1)

For NSF IUSE alignment, each demo should include:

1. **Predict:** 1–2 prediction questions before interaction ("What do you think will happen if you increase the mass?")
2. **Play:** Interactive exploration
3. **Explain:** 1 reflection prompt after ("Was your prediction correct? Why or why not?")
4. **Check:** Optional "check your understanding" concept question

---

## 5. User Stories (Demo-by-Demo)

### Demo 1: Equation of State Lab

> **As a** stellar astrophysics student,
> **I want to** adjust temperature, density, and mean molecular weight and see how gas pressure vs radiation pressure change,
> **so that** I understand why massive stars care about radiation pressure and can predict which pressure dominates in different stellar environments.

**Physics Notes:**
- Display the **gas fraction** $\beta = P_{\rm gas}/P_{\rm tot}$, NOT an "Eddington limit warning" (that's a different concept)
- If showing an Eddington-related diagnostic, compute and display the **Eddington parameter**:
  $$\Gamma = \frac{\kappa L}{4\pi c G M}$$
  and explain that $\Gamma \to 1$ means radiation pressure approaches the gravitational binding

**Acceptance Criteria:**
- [ ] **Log sliders** for $T$ ($10^3$–$10^8$ K) and $\rho$ ($10^{-8}$–$10^6$ g/cm³)
- [ ] Separate $\mu$ (mean molecular weight per particle) for ideal gas; add $\mu_e$ (per electron) for degeneracy (P2)
- [ ] **Regime map visualization:** Point on $\log \rho$–$\log T$ diagram with shaded regions for core/envelope/atmosphere of canonical stars (Sun, massive MS, RG, WD)
- [ ] Display $P_{\rm rad}/P_{\rm gas}$ on log scale (not just pie chart—dynamic range is huge)
- [ ] Optional pie chart for $\beta$ when values are comparable
- [ ] Degeneracy pressure toggle for Advanced mode (shows when $P_{\rm deg}$ becomes relevant)

### Demo 2: Hydrostatic Equilibrium

> **As a** student learning the stellar structure equations,
> **I want to** choose a density profile and watch the pressure profile get computed via hydrostatic equilibrium,
> **so that** I understand that $\frac{dP}{dr} = -\frac{\rho G M(r)}{r^2}$ is a balancing act between pressure and gravity.

**Physics Notes:**
- Make the workflow explicit: (1) choose $\rho(r)$, (2) compute $M(r)$ from mass continuity, (3) integrate $P(r)$ from HSE
- Boundary condition choice matters pedagogically:
  - **Option A:** Fix $P_c$ and integrate outward → star may not have $P(R)=0$ nicely
  - **Option B:** Enforce $P(R)=0$ and integrate inward (more BVP-ish)
- The "collapse/expand" animation is **conceptual stability intuition**, not a real dynamical simulation—label it as such

**Acceptance Criteria:**
- [ ] Preset density profiles: uniform, linear, power-law, polytropic (from Demo 4)
- [ ] Displays both equations: $\frac{dP}{dr} = -\frac{\rho G M(r)}{r^2}$ and $\frac{dM}{dr} = 4\pi r^2 \rho$
- [ ] Real-time integration as parameters change
- [ ] Animation showing "if pressure is too low → collapse; too high → expand" (labeled as conceptual)
- [ ] Boundary condition selector (Quantitative/Advanced modes)
- [ ] Export $P(r)$, $M(r)$, $\rho(r)$ profiles as CSV

### Demo 3: Timescales & Virial Theorem

> **As a** student confused about why stars don't instantly collapse or explode,
> **I want to** see the three fundamental timescales (dynamical, thermal, nuclear) for a given star,
> **so that** I understand what "equilibrium" means and why stars are stable most of the time.

**Physics Notes:**
- Show formulas (toggleable in Quantitative mode):
  - $t_{\rm dyn} \sim \sqrt{\frac{R^3}{G M}}$ (free-fall / sound crossing)
  - $t_{\rm KH} \sim \frac{G M^2}{R L}$ (Kelvin-Helmholtz / thermal)
  - $t_{\rm nuc} \sim \frac{\eta M c^2}{L}$ (nuclear, with efficiency factor $\eta \sim 0.007$)
- For virial, be explicit it's idealized: "roughly $2K + U \approx 0$" for a stable, self-gravitating gas sphere

**Acceptance Criteria:**
- [ ] Inputs: $M$, $R$, $L$ (with presets for Sun, red giant, white dwarf, massive star)
- [ ] Computes and displays: $t_{\rm dyn}$, $t_{\rm KH}$, $t_{\rm nuc}$ with formulas shown
- [ ] Bar chart comparing timescales on log scale
- [ ] Explanation of what each timescale means physically
- [ ] Virial theorem visualization: $2K + U = 0$, what happens when perturbed (conceptual)

### Demo 4: Polytrope Playground (Lane-Emden)

> **As a** student learning stellar structure,
> **I want to** adjust the polytropic index $n$ and see how the entire star's structure changes,
> **so that** I understand how a single parameter controls density concentration, mass-radius relations, and whether a star is convective or radiative.

**Physics Notes:**
- This is the **"mathematical microscope"** of the suite and serves as the shared profile backbone
- Add explicit "dimensionless → physical scaling" panel:
  - $\xi$, $\theta(\xi)$ are dimensionless
  - Show how choosing $K$ and $\rho_c$ sets $R$ and $M$
- For $n \to 5$: be clear it has infinite radius; show "truncation radius" as user-controlled cutoff

**Acceptance Criteria:**
- [ ] Slider for polytropic index $n$ (0 to 5, with special markers at 1.5, 3, 4.5)
- [ ] Real-time Lane-Emden integration: $\frac{d^2\theta}{d\xi^2} + \frac{2}{\xi}\frac{d\theta}{d\xi} + \theta^n = 0$
- [ ] Boundary conditions: $\theta(0) = 1$, $\theta'(0) = 0$
- [ ] Plots: $\rho(r)/\rho_c$, $P(r)/P_c$, $M(r)/M_{\rm total}$ vs $r/R$
- [ ] Display central concentration $\rho_c/\langle\rho\rangle$
- [ ] **Dimensionless → physical scaling panel** (Quantitative mode)
- [ ] Mass-radius scaling relation for selected $n$
- [ ] Annotations: $n=1.5$ (fully convective), $n=3$ (Eddington standard model), $n \to 5$ (infinite extent with truncation)
- [ ] **Export as `StarProfileSource`** for Demos 5–7

### Demo 5: Energy Generation Sandbox

> **As a** student learning about nuclear burning in stars,
> **I want to** compare how different energy generation laws $\varepsilon(\rho, T)$ affect where luminosity is produced,
> **so that** I understand why massive stars have centrally concentrated burning (CNO) while low-mass stars have more distributed burning (pp-chain).

**Physics Notes:**
- **Requires `StarProfileSource`** from Demo 4 (or Demo 8) to provide $T(r)$, $\rho(r)$
- Energy generation laws need normalization:
  - Default: show normalized $dL/dr$ and $L(r)/L_{\rm tot}$ only (simplest)
  - Advanced: include calibration constant so "Sun preset" produces $\sim L_\odot$

**Acceptance Criteria:**
- [ ] **Loads profile from Demo 4** (or presets if Demo 4 not completed)
- [ ] Toggle between pp-like ($\varepsilon \propto \rho T^4$) and CNO-like ($\varepsilon \propto \rho T^{16-20}$)
- [ ] Custom mode: adjustable exponents $\varepsilon \propto \rho T^n$
- [ ] Plot $\frac{dL}{dr} = 4\pi r^2 \rho \varepsilon$ showing where luminosity is generated
- [ ] Cumulative $L(r)/L_{\rm tot}$ showing energy generation distribution
- [ ] Side-by-side comparison of low-mass vs high-mass profiles

### Demo 6: Opacity & Photon Diffusion

> **As a** student learning about radiative transport,
> **I want to** see how opacity varies with temperature and density and understand the "random walk" of photons,
> **so that** I can predict when radiative transport is efficient vs inefficient.

**Physics Notes:**
- **Opacity regime map in $\log \rho$–$\log T$ space is the killer feature**
- Show scaling relationships:
  - Electron scattering: $\kappa_{\rm es} \approx 0.2(1+X)$ cm²/g (approximately constant)
  - Kramers (bound-free + free-free): $\kappa_{\rm Kr} \propto \rho T^{-3.5}$
  - H⁻ opacity: important in cool stellar atmospheres
- Random walk diagnostics: mean free path $\lambda$, optical depth $\tau$, diffusion time scaling

**Acceptance Criteria:**
- [ ] **Loads profile from Demo 4** for computing $\kappa(r)$ along the star
- [ ] **Opacity regime map** in $\log \rho$–$\log T$ space with labeled regions
- [ ] Opacity regimes visualization: electron scattering ($\kappa \approx \text{const}$), Kramers ($\kappa \propto \rho T^{-3.5}$), H⁻ opacity
- [ ] Mean free path calculator: $\lambda = \frac{1}{\kappa \rho}$
- [ ] Optical depth visualization: $\tau = \int \kappa \rho \, dr$ from surface
- [ ] Random walk animation showing photon diffusion time scaling
- [ ] Advanced mode: load OPAL Rosseland mean opacity table as precomputed dataset (default uses analytic fits)

### Demo 7: Transport Regimes (Radiative vs Convective)

> **As a** student learning about energy transport,
> **I want to** see when convection turns on by comparing the radiative gradient to the adiabatic gradient,
> **so that** I can predict convective zone boundaries for different stellar types.

**Physics Notes:**
- **Requires `StarProfileSource`** to compute $\nabla_{\rm rad}$ along a profile (not in isolation)
- Schwarzschild criterion: convection when $\nabla_{\rm rad} > \nabla_{\rm ad}$
- Add **Kippenhahn-style 1D bar** (radius axis, colored regions)—instantly interpretable

**Acceptance Criteria:**
- [ ] **Loads profile from Demo 4** (or presets)
- [ ] Displays $\nabla_{\rm rad}$ (radiative gradient) vs $\nabla_{\rm ad}$ (adiabatic gradient) along profile
- [ ] Schwarzschild criterion visualization: convection when $\nabla_{\rm rad} > \nabla_{\rm ad}$
- [ ] Adjustable parameters: opacity multiplier, luminosity, composition
- [ ] Presets showing canonical patterns:
  - Solar-type: convective envelope, radiative core
  - Massive MS: convective core, radiative envelope
- [ ] **Kippenhahn-style 1D bar** showing convective vs radiative zones along radius
- [ ] Cartoon cross-section showing convective vs radiative zones

### Demo 8: Capstone — Solve a Toy Star

> **As a** student who has mastered the building blocks,
> **I want to** solve all four stellar structure equations together for a simplified star,
> **so that** I can see how mass continuity, HSE, energy generation, and energy transport combine to determine a star's structure and place on the H-R diagram.

**⚠️ Boss Fight Risk:** This is where numerical methods, boundary conditions, and "why is everything NaN" meet in a dark alley. Requires tighter scoping and deliberate numerical formulation.

#### Two-Layers-of-Truth Contract

| Layer | Behavior | When Active |
|-------|----------|-------------|
| **Layer 1 (Robust)** | Simplified solver that **never catastrophically fails**. May be approximate, but always produces a physically reasonable result. Uses constrained parameter space. | Always on (default) |
| **Layer 2 (Advanced)** | More realistic solver that **can fail gracefully** and shows diagnostics when it does. Unlocks wider parameter space. | Advanced mode toggle |

#### Numerical Formulation (v1 Recommendation)

**Use mass coordinate $m$ instead of radius $r$ as the independent variable.** This avoids center singularities and is the standard stellar structure choice:

$$\frac{dr}{dm} = \frac{1}{4\pi r^2 \rho}, \quad \frac{dP}{dm} = -\frac{Gm}{4\pi r^4}, \quad \frac{dL}{dm} = \varepsilon, \quad \frac{dT}{dm} = -\frac{GmT}{4\pi r^4 P}\nabla$$

**Physics constraints for v1:**
- **EOS:** Ideal gas + radiation pressure; degeneracy deferred to P2
- **Opacity:** Electron scattering + Kramers fit; optional H⁻ fit
- **Energy generation:** pp-like vs CNO-like with tunable exponent
- **Convection:** Schwarzschild criterion with $\nabla_{\rm ad}$ fixed; variable $\nabla_{\rm ad}$ in Advanced

**Numerical method:**
- **v1:** Shooting method (fast, teachable) with strong diagnostics + fallback constraints
- **Future (P2):** Relaxation method (Henyey-lite) for robustness

**Acceptance Criteria:**
- [ ] Inputs: total mass $M$, composition $(X, Y, Z)$, simplified physics choices
- [ ] **Uses mass coordinate $m$** as independent variable (not $r$)
- [ ] Solves coupled ODEs: $dr/dm$, $dP/dm$, $dL/dm$, $dT/dm$
- [ ] Outputs: radial profiles of $\rho(r)$, $P(r)$, $T(r)$, $L(r)$, $M(r)$
- [ ] Places resulting star on H-R diagram ($L$ vs $T_{\rm eff}$)
- [ ] **Layer 1:** Always produces result within guardrailed parameter space
- [ ] **Layer 2 (Advanced):** Wider parameter range with graceful failure + diagnostics
- [ ] Compare to MIST/PARSEC for validation (order-of-magnitude correct; calibrated to hit Sun reasonably)
- [ ] Export all profiles and H-R position as JSON

### Edge Cases & Error States

> **As a** student who enters unphysical parameters,
> **I want to** see a clear explanation of why my star "doesn't work,"
> **so that** I learn the physical constraints on stellar structure.

**Acceptance Criteria:**
- [ ] Graceful handling of: negative pressures, super-Eddington luminosity, unphysical density inversions
- [ ] Error messages explain physics: "This configuration exceeds the Eddington limit ($\Gamma > 1$)—the star would be blown apart by radiation pressure"
- [ ] "Reset to physical" button with suggested parameters
- [ ] Integration failure recovery with diagnostic output
- [ ] Physics sanity invariants displayed as health indicators

---

## 6. Requirements

### Must-Have (P0) — Core Learning Sequence

These define the minimum viable suite. Without these, the pedagogical progression breaks.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P0-1** | **Demo 4: Polytrope Playground** | Lane-Emden solver for $n \in [0,5]$; shows $\rho(r)$, $P(r)$, $M(r)$ profiles; exports `StarProfileSource` |
| **P0-2** | **Demo 2: Hydrostatic Equilibrium** | Integrates HSE + mass continuity; shows collapse/expand animation (labeled conceptual) |
| **P0-3** | **Demo 6: Opacity & Photon Diffusion** | Shows opacity regimes; calculates mean free path; visualizes random walk; loads profile from Demo 4 |
| **P0-4** | **Demo 8: Capstone Toy Star Solver** | Solves 4 coupled ODEs in mass coordinate; produces radial profiles; places star on H-R diagram; two-layer robustness |
| **P0-5** | **`StarProfileSource` contract** | Shared interface for profile data used by Demos 5–7 |
| **P0-6** | **Layered complexity modes** | Each demo implements Conceptual / Quantitative / Advanced with consistent definitions |
| **P0-7** | **Physics sanity invariants** | $M(r)$ increasing, $P,\rho,T \geq 0$, graceful stop conditions |
| **P0-8** | **Data export** | All demos export profiles as CSV; capstone exports JSON with full state |
| **P0-9** | **Validation test suite** | Each physics module has unit tests against analytic solutions |
| **P0-10** | **WebWorker execution** | Heavy integrations run in WebWorker to prevent UI hitching |
| **P0-11** | **Performance** | All ODE integrations complete in <100ms on parameter change |

### Should-Have (P1) — Enhanced Experience

High priority for v1.1, significantly improves learning but not required for core pedagogy.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P1-1** | **Demo 1: Equation of State Lab** | $P_{\rm gas}$ vs $P_{\rm rad}$ ratio on log scale; $\log\rho$–$\log T$ regime map; proper Eddington parameter $\Gamma$ |
| **P1-2** | **Demo 3: Timescales & Virial** | Computes $t_{\rm dyn}$, $t_{\rm KH}$, $t_{\rm nuc}$ with formulas; virial theorem visualization |
| **P1-3** | **Demo 5: Energy Generation Sandbox** | pp vs CNO comparison; adjustable $\varepsilon(\rho,T)$ exponents; loads from `StarProfileSource` |
| **P1-4** | **Demo 7: Transport Regimes** | $\nabla_{\rm rad}$ vs $\nabla_{\rm ad}$ along profile; Kippenhahn-style 1D bar; convective zone boundaries |
| **P1-5** | **Preset library** | Sun, $\alpha$ Centauri A, Sirius A, Betelgeuse, white dwarf presets |
| **P1-6** | **Instructor annotations** | Toggle to show/hide equation derivations and physical insights |
| **P1-7** | **Predict–Play–Explain prompts** | 1–2 prediction questions, 1 reflection prompt per demo |
| **P1-8** | **Progress tracking** | Badge system: "Mastered HSE", "Polytrope Expert", etc. |

### Could-Have (P2) — Future Enhancements

Nice to have if time permits; design architecture to support these later.

| ID | Requirement | Rationale |
|----|-------------|-----------|
| **P2-1** | **OPAL opacity table integration** | Real opacity data for advanced mode |
| **P2-2** | **Degeneracy pressure EOS** | Extend Demo 1 for white dwarf physics; requires $\mu_e$ |
| **P2-3** | **Comparison to MIST tracks** | Overlay computed star on isochrones |
| **P2-4** | **Multi-star comparison** | Side-by-side structure profiles for different masses |
| **P2-5** | **Guided tutorial mode** | Step-by-step walkthrough with checkpoints |
| **P2-6** | **LMS integration** | SCORM/LTI for Canvas/Blackboard grade passback |
| **P2-7** | **Relaxation method solver** | Henyey-lite for Demo 8 Advanced mode |
| **P2-8** | **Variable $\nabla_{\rm ad}$** | For partial ionization zones |

### Won't Have (This Version)

| Feature | Rationale |
|---------|-----------|
| Full stellar evolution | Separate initiative; this suite is structure at a single time |
| 3D visualization | 1D radial profiles sufficient for pedagogy |
| Rotation/magnetic fields | Advanced topics beyond scope |
| Binary interactions | Level 3 or separate suite |
| Real-time MESA integration | 🚫 PUNT — maintenance nightmare |

---

## 7. Technical Architecture

### Physics Package Structure

```
packages/stellar-structure/
├── core/
│   ├── starProfileSource.ts   # Shared StarProfileSource interface
│   ├── physicsConstants.ts    # G, a, k, m_H, solar values
│   └── sanityChecks.ts        # Invariant enforcement
├── eos/
│   ├── idealGas.ts            # P_gas = ρkT/(μm_H)
│   ├── radiation.ts           # P_rad = (1/3)aT⁴
│   ├── degeneracy.ts          # P_deg (P2)
│   └── combined.ts            # P_total with β parameter
├── equilibrium/
│   ├── hydrostaticEq.ts       # dP/dr = -ρGM(r)/r²
│   ├── massContinuity.ts      # dM/dr = 4πr²ρ
│   └── laneEmden.ts           # Polytrope solver → exports StarProfileSource
├── energy/
│   ├── ppChain.ts             # ε_pp ∝ ρT⁴
│   ├── cnoChain.ts            # ε_CNO ∝ ρT^{16-20}
│   └── energyGeneration.ts    # Unified ε(ρ,T) interface with normalization
├── transport/
│   ├── opacity.ts             # κ(ρ,T) models: electron scattering, Kramers, H⁻
│   ├── opalLoader.ts          # OPAL table loader (P2)
│   ├── radiativeGrad.ts       # ∇_rad calculation
│   └── convection.ts          # Schwarzschild criterion
├── structure/
│   ├── toyStarSolver.ts       # Coupled 4-equation solver (mass coordinate)
│   ├── shootingMethod.ts      # v1 numerical method
│   ├── boundaryConditions.ts  # Center + surface BCs
│   └── henyeyRelaxation.ts    # P2 relaxation method
├── diagnostics/
│   ├── eddingtonParameter.ts  # Γ = κL/(4πcGM)
│   ├── virialCheck.ts         # 2K + U ≈ 0
│   └── energyConservation.ts  # ΔE/E tracking
└── validation/
    ├── analyticPolytrope.ts   # n=0,1,5 analytic solutions
    ├── solarCalibration.ts    # Calibrate to hit Sun reasonably
    └── oracles.ts             # Test case generators
```

### Shared Profile Source Contract

```typescript
// packages/stellar-structure/core/starProfileSource.ts

export interface StarProfileSource {
  // Radial arrays (N_shells elements, typically ~1000)
  readonly r: Float64Array;           // radial coordinate [cm]
  readonly rho: Float64Array;         // density [g/cm³]
  readonly T: Float64Array;           // temperature [K]
  readonly M_r: Float64Array;         // enclosed mass [g]
  readonly P: Float64Array;           // pressure [dyn/cm²]

  // Metadata
  readonly sourceDemo: 'polytrope' | 'capstone' | 'preset';
  readonly polytropic_n?: number;     // if from polytrope
  readonly total_mass: number;        // M [g]
  readonly total_radius: number;      // R [cm]
  readonly central_density: number;   // ρ_c [g/cm³]
  readonly central_temperature: number; // T_c [K]
}

export interface StarProfileSourceProvider {
  getProfile(): StarProfileSource | null;
  subscribeToChanges(callback: (profile: StarProfileSource) => void): void;
}
```

### Integration Execution (WebWorker)

```typescript
// All heavy integrations run in WebWorker to prevent UI hitching

// main thread
const worker = new Worker(new URL('./structure-worker.ts', import.meta.url));
worker.postMessage({ type: 'solve-polytrope', params: { n: 3, rho_c: 1e5 } });
worker.onmessage = (e) => {
  if (e.data.type === 'profile-ready') {
    updateVisualization(e.data.profile);
  }
};

// structure-worker.ts
self.onmessage = (e) => {
  if (e.data.type === 'solve-polytrope') {
    const profile = solveLaneEmden(e.data.params);
    self.postMessage({ type: 'profile-ready', profile });
  }
};
```

### Data Dependencies

| Demo | Precomputed Data Needed | Source | Size |
|------|------------------------|--------|------|
| Demo 1 | Regime map boundaries | Hand-curated | <10KB |
| Demo 6 (default) | Analytic opacity fits | Equations | 0KB |
| Demo 6 (advanced) | OPAL Rosseland mean tables | [OPAL](https://opalopacity.llnl.gov) | ~10MB |
| Demo 8 | MIST/PARSEC tracks for comparison | [MIST](https://waps.cfa.harvard.edu/MIST/) | ~1MB subset |

**Data format:** JSON for small datasets; binary TypedArray for OPAL tables. Lazy-loaded on demand.

---

## 8. Success Metrics

### Leading Indicators (1–4 weeks post-launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Demo completion rate** | >70% of users complete Demo 4 (Polytropes) | Analytics: session duration, interaction count |
| **Profile propagation usage** | >50% of Demo 5–7 users load profile from Demo 4 | Analytics: profile source tracking |
| **Capstone attempt rate** | >50% of users who complete Demo 4 attempt Demo 8 | Analytics: funnel progression |
| **Layer 2 unlock rate** | >20% of capstone users try Advanced mode | Analytics: mode toggle tracking |
| **Time per demo** | 5–15 min for Demos 1–7; 15–30 min for Demo 8 | Analytics: session duration |
| **Parameter exploration** | Average >10 parameter changes per demo session | Analytics: slider interaction count |
| **Export usage** | >20% of capstone completions export data | Analytics: export button clicks |

### Lagging Indicators (1 semester+)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Learning assessment improvement** | >15% improvement on stellar structure exam questions vs control | Pre/post assessment with control group |
| **Instructor adoption** | >10 institutions using in Year 1 | Survey + analytics |
| **Student satisfaction** | >4.0/5.0 on "helped me understand stellar structure" | Post-use survey |
| **Retention to advanced topics** | Students who use suite more likely to take advanced astro courses | Longitudinal tracking (if available) |

### Validation Metrics (Continuous)

| Test | Criterion | Frequency |
|------|-----------|-----------|
| Lane-Emden $n=0$ | $\rho_c/\langle\rho\rangle = 1$ within 0.1% | Every build |
| Lane-Emden $n=1$ | $\xi_1 = \pi$ within 0.01% | Every build |
| Lane-Emden $n=5$ | Approaches infinite $\xi_1$ (stop at $\xi=100$) | Every build |
| Virial consistency | $\|2K + U\|/\|U\| < 0.01$ for converged profiles | Every build |
| Toy star vs MIST (solar mass) | $L$, $T_{\rm eff}$ within factor of 2; qualitatively correct trends | Weekly regression |
| Physics invariants | All sanity checks pass for preset library | Every build |

---

## 9. Open Questions

### Blocking (Must resolve before implementation)

| Question | Owner | Notes |
|----------|-------|-------|
| **Q1:** What opacity fits for default mode? | Physics | Kramers + electron scattering; need coefficients |
| **Q2:** Solar calibration approach for Demo 8? | Physics | Tune $\varepsilon_0$ and $\kappa_0$ to hit $L_\odot$, $T_{\rm eff,\odot}$ |
| **Q3:** What composition $(X, Y, Z)$ presets? | Physics | Need solar + a few others; consistency with MIST comparisons |
| **Q4:** Shooting method fallback behavior? | Engineering | When shooting diverges, what does Layer 1 return? |

### Non-Blocking (Can resolve during implementation)

| Question | Owner | Notes |
|----------|-------|-------|
| **Q5:** Badge/achievement system design | Design | P1 feature; can iterate post-v1.0 |
| **Q6:** LMS integration specifics | Engineering | P2 feature |
| **Q7:** Accessibility audit for visualizations | Design | Required but can be parallel track |
| **Q8:** Predict–Play–Explain exact prompts | Physics/Design | P1 feature; iterate with instructors |

---

## 10. Dependencies

### Internal Dependencies

| Dependency | Status | Impact |
|------------|--------|--------|
| `packages/integrators/rk4.ts` | ✅ Exists | Required for all ODE solving |
| `packages/physics/` structure | ✅ Established | New stellar-structure package follows patterns |
| Demo template system | ✅ Exists | Suite uses standard demo harness |
| WebWorker infrastructure | ⚠️ Partial | Need to standardize worker communication |
| Data export infrastructure | ⚠️ Partial | CSV export exists; JSON export needed |

### External Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| OPAL opacity tables | Low | Public data; cache locally in repo; use fits for default |
| MIST isochrone data | Low | Public data; precompute relevant subset |
| No external runtime deps | N/A | All pure TypeScript by design |

---

## 11. Timeline & Phasing

### Recommended Build Order

Based on the principle that **Demo 4 is the backbone** and Demos 2, 4, 6, 8 form the "minimum complete suite":

| Phase | Demos | Duration | Deliverable |
|-------|-------|----------|-------------|
| **Phase 0** | `StarProfileSource` contract | 0.5 weeks | Interface + mock data |
| **Phase 1** | Demo 4 (Polytropes) | 2 weeks | Lane-Emden solver + visualization + profile export |
| **Phase 2** | Demo 2 (HSE) | 1.5 weeks | HSE integrator + collapse/expand animation |
| **Phase 3** | Demo 6 (Opacity) | 1.5 weeks | Opacity models + random walk viz + profile loading |
| **Phase 4** | Demo 8 (Capstone) | 3 weeks | Full 4-equation solver (mass coord) + H-R placement + two-layer robustness |
| **Phase 5** | Demos 1, 3, 5, 7 | 3 weeks | Complete suite + polish |
| **Phase 6** | Validation + Docs | 1 week | Test suite + instructor materials |

**Total:** ~12.5 weeks for full suite

### Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| **M0: Profile Contract** | +0.5 weeks | `StarProfileSource` interface defined and tested with mock |
| **M1: Core Physics** | +4 weeks | Demos 2, 4 working with tests; profile propagation functional |
| **M2: Transport** | +6 weeks | Demo 6 complete; opacity infrastructure; profile loading verified |
| **M3: Capstone Alpha** | +9 weeks | Demo 8 producing H-R placement; Layer 1 robust |
| **M4: Full Suite Beta** | +11.5 weeks | All 8 demos; internal testing; WebWorker execution |
| **M5: v1.0 Release** | +12.5 weeks | Validated, documented, deployed |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R1:** Shooting method instability in Demo 8 | Medium | High | Layer 1/Layer 2 contract; constrain parameter space for Layer 1; implement relaxation as P2 |
| **R2:** OPAL table size impacts load time | Low | Medium | Lazy-load advanced mode; use analytic fits for default |
| **R3:** Students skip to capstone without foundations | Medium | Medium | Gate Demo 8 behind completion of Demos 2, 4, 6 |
| **R4:** Physics validation failures at edge cases | Medium | High | Extensive test suite; bound parameter ranges; sanity invariants |
| **R5:** Scope creep toward "real" stellar evolution | High | High | Explicit PUNT list; regular scope reviews |
| **R6:** Profile propagation bugs | Medium | Medium | Strong typing on `StarProfileSource`; integration tests |
| **R7:** WebWorker communication complexity | Low | Medium | Standardize worker message protocol early |

---

## 13. Analytics & Research Ethics

If collecting funnel data for NSF IUSE grant evaluation:

| Requirement | Implementation |
|-------------|----------------|
| **Anonymization** | No PII collected; session IDs only |
| **Opt-in** | Clear disclosure banner; opt-out option |
| **Instructor control** | Toggle to disable analytics for class |
| **IRB compliance** | Work with institutional IRB before deployment |
| **Data retention** | Define retention period; purge policy |

---

## 14. Appendix: Physics Reference

### The Four Stellar Structure Equations

In mass coordinate $m$:

1. **Radius:** $\frac{dr}{dm} = \frac{1}{4\pi r^2 \rho}$

2. **Hydrostatic Equilibrium:** $\frac{dP}{dm} = -\frac{Gm}{4\pi r^4}$

3. **Luminosity:** $\frac{dL}{dm} = \varepsilon$

4. **Temperature:** $\frac{dT}{dm} = -\frac{Gm T}{4\pi r^4 P} \nabla$

where $\nabla = \nabla_{\rm rad}$ (radiative) or $\nabla_{\rm ad}$ (convective).

### Radiative and Adiabatic Gradients

$$\nabla_{\rm rad} = \frac{3\kappa L P}{16\pi a c G m T^4}$$

$$\nabla_{\rm ad} = 1 - \frac{1}{\gamma} \approx 0.4 \text{ (ideal monatomic gas)}$$

**Schwarzschild criterion:** Convection occurs when $\nabla_{\rm rad} > \nabla_{\rm ad}$

### Lane-Emden Equation

For polytropic EOS $P = K\rho^{1+1/n}$:

$$\frac{d^2\theta}{d\xi^2} + \frac{2}{\xi}\frac{d\theta}{d\xi} + \theta^n = 0$$

With boundary conditions: $\theta(0) = 1$, $\theta'(0) = 0$

**Dimensionless variables:**
- $\xi = r/\alpha$ where $\alpha^2 = \frac{(n+1)K\rho_c^{(1-n)/n}}{4\pi G}$
- $\theta^n = \rho/\rho_c$

### Eddington Parameter

$$\Gamma = \frac{\kappa L}{4\pi c G M}$$

When $\Gamma \to 1$, radiation pressure approaches gravitational binding and the star becomes unstable.

**Note:** This is distinct from the gas fraction $\beta = P_{\rm gas}/P_{\rm tot}$.

### Key Timescales

$$t_{\rm dyn} \sim \sqrt{\frac{R^3}{GM}} \sim \frac{1}{\sqrt{G\bar{\rho}}}$$

$$t_{\rm KH} \sim \frac{GM^2}{RL}$$

$$t_{\rm nuc} \sim \frac{\eta M c^2}{L} \quad (\eta \approx 0.007 \text{ for H burning})$$

### Key Physical Constants

| Constant | Symbol | Value | Units |
|----------|--------|-------|-------|
| Gravitational constant | $G$ | $6.674 \times 10^{-8}$ | cm³ g⁻¹ s⁻² |
| Radiation constant | $a$ | $7.566 \times 10^{-15}$ | erg cm⁻³ K⁻⁴ |
| Speed of light | $c$ | $2.998 \times 10^{10}$ | cm s⁻¹ |
| Boltzmann constant | $k$ | $1.381 \times 10^{-16}$ | erg K⁻¹ |
| Hydrogen mass | $m_{\rm H}$ | $1.673 \times 10^{-24}$ | g |
| Solar mass | $M_\odot$ | $1.989 \times 10^{33}$ | g |
| Solar radius | $R_\odot$ | $6.957 \times 10^{10}$ | cm |
| Solar luminosity | $L_\odot$ | $3.828 \times 10^{33}$ | erg s⁻¹ |
| Solar effective temperature | $T_{\rm eff,\odot}$ | $5772$ | K |

---

## 15. References

1. Kippenhahn, R., Weigert, A., & Weiss, A. (2012). *Stellar Structure and Evolution*. Springer.
2. Hansen, C. J., Kawaler, S. D., & Trimble, V. (2004). *Stellar Interiors*. Springer.
3. Princeton stellar structure course: [astro.princeton.edu](https://www.astro.princeton.edu/~gk/A403/)
4. Sydney stellar physics: [physics.usyd.edu.au](https://www.physics.usyd.edu.au/)
5. Zingale computational astrophysics: [zingale.github.io](https://zingale.github.io/)
6. OPAL opacities: [opalopacity.llnl.gov](https://opalopacity.llnl.gov)
7. MIST isochrones: [waps.cfa.harvard.edu/MIST](https://waps.cfa.harvard.edu/MIST/)

---

## 16. ASTR 201 Active Implementation Addendum (2026-02)

This addendum captures active implementation sequencing for ASTR 201 without replacing or deleting prior sections.

### 16.1 Sequencing note

For active development, use this detailed-spec order:

1. Demo 1: Equation of State Lab
2. Demo 2: Opacity & Photon Diffusion
3. Demo 3: Hydrostatic Equilibrium (detailed interaction spec deferred)

Mapping note:
- Current Demo 2 (Opacity & Photon Diffusion) corresponds to the opacity concept previously detailed as Demo 6 in this document.

### 16.2 Demo 1 enhancement addendum (EOS)

This addendum extends the existing Demo 1 spec with deeper ASTR 201 detail.

Physics additions:
- Keep:
  - $P_{\rm gas} = \frac{\rho k_B T}{\mu m_u}$
  - $P_{\rm rad} = \frac{aT^4}{3}$
- Add electron degeneracy diagnostics:
  - $n_e = \frac{\rho}{\mu_e m_u}$
  - $p_F = \hbar(3\pi^2 n_e)^{1/3}$
  - $x_F = \frac{p_F}{m_e c}$
  - $T_F = \frac{E_F}{k_B}$ and $T/T_F$ validity indicator
- Keep and explicitly surface:
  - $\beta = \frac{P_{\rm gas}}{P_{\rm tot}}$
  - $\Gamma = \frac{\kappa L}{4\pi c G M}$ (optional diagnostic panel with assumptions note)
- Composition equations remain visible:
  - $\frac{1}{\mu} \approx 2X + \frac{3}{4}Y + \frac{1}{2}Z$
  - $\frac{1}{\mu_e} \approx X + \frac{Y}{2} + \frac{Z}{2}$

Interaction additions:
- Main compare panel (all channels side-by-side).
- Click-to-focus deep dive per channel with tabs:
  - `Physical picture`
  - `Equation anatomy`
  - `Scaling sandbox`

Acceptance additions:
- Real-time diagnostics for $p_F$, $x_F$, and $T/T_F$.
- Presets include at minimum: solar core, massive-star core, red giant envelope, white dwarf core.
- Assumption chips include LTE closure language for radiation pressure and assumptions for optional $\Gamma$.

### 16.3 Demo 2 detailed addendum (Opacity & Photon Diffusion)

Purpose:
- Separate transport physics from EOS support physics so students can reason cleanly about bottlenecks.

Core equations and diagnostics:
- $\kappa_{\rm tot} = \kappa_{\rm es} + \kappa_{\rm Kr} + \kappa_{{\rm H}^-}$
- Electron scattering baseline: $\kappa_{\rm es} \approx 0.2(1+X)\ {\rm cm^2\,g^{-1}}$
- Kramers-like baseline: $\kappa_{\rm Kr} \propto \rho T^{-3.5}$
- Mean free path: $\lambda = \frac{1}{\kappa \rho}$
- Optical depth: $\tau(r) = \int_r^R \kappa \rho\,dr$
- Diffusion scaling: $t_{\rm diff} \sim \frac{3L^2}{c\lambda}$

Required UX behavior:
- Main compare panel:
  - regime map in $\log \rho$–$\log T$
  - per-channel opacity contribution cards
  - live $\lambda$, $\tau$, and $t_{\rm diff}$ readouts
- Deep-dive views for channels and diffusion mechanism.
- Random-walk visualization tied to current $\lambda$ scale.
- Assumption chip for LTE-like opacity closure and validity notes.

Source modes:
- Point mode: local $(T,\rho,X,Y,Z)$ exploration.
- Profile mode: consume `StarProfileSource` and compute $\kappa(r)$, $\lambda(r)$, and $\tau(r)$.

Acceptance additions:
- Real-time updates of mean free path, optical depth, and diffusion timescale.
- Profile-aware and preset-only fallback both supported.
- Advanced mode can overlay OPAL comparison data without changing default lightweight behavior.

### 16.4 Demo 3 hydrostatic addendum (deferred detail)

Demo 3 remains core and will be specified in a dedicated memo next.

Baseline scope to preserve:
- Explicit workflow:
  1. choose $\rho(r)$
  2. compute $M(r)$
  3. integrate $P(r)$
- Equations:
  - $\frac{dP}{dr} = -\frac{\rho G M(r)}{r^2}$
  - $\frac{dM}{dr} = 4\pi r^2 \rho$
- Boundary condition selector retained.
- Conceptual collapse/expand cue allowed but clearly labeled non-hydrodynamic.
- Export of $P(r)$, $M(r)$, and $\rho(r)$ retained.

---

## 17. Microphysics Fusion Lab Addendum (ASTR 201)

Recommended demo name:
- **Microphysics Fusion Lab**
- Student-facing name: *Why Stars Shine*
- Internal subtitle: *Tunneling, Cycles, and Mass Defect*

### 17.1 Purpose and placement

Add a dedicated fusion-microphysics demo between Opacity (Demo 2) and Hydrostatic (Demo 3) in the active teaching flow.

Proposed conceptual flow:
1. Demo 1: EOS
2. Demo 2: Opacity & Diffusion
3. **Fusion Microphysics Lab** (new)
4. Demo 3: Hydrostatic Equilibrium
5. Demo 6: Energy Generation Sandbox

This preserves separation between:
- local thermodynamic state (EOS),
- transport bottlenecks (opacity/diffusion),
- microscopic reaction-rate origin (tunneling/fusion),
- macroscopic force balance (HSE).

### 17.2 Required physics content

Thermal population proxy:
$$
f_{\rm MB}(E) \propto E^{1/2} e^{-E/(k_B T)}
$$

Tunneling proxy:
$$
P_{\rm tun}(E) \propto \exp\!\left(-\sqrt{\frac{E_G}{E}}\right)
$$

Gamow-window overlap proxy:
$$
I(E) \propto f_{\rm MB}(E)\,P_{\rm tun}(E)
$$

Rate framing:
$$
\langle \sigma v \rangle \propto \int_0^\infty I(E)\,dE
$$

Density dependence framing (required, explicit):
$$
r_{12} = n_1 n_2\langle \sigma v \rangle \propto \rho^2 \langle \sigma v \rangle
$$
for volumetric reaction rate, and
$$
\varepsilon \propto \rho \langle \sigma v \rangle
$$
for specific (per-mass) energy-generation scaling.

Mass-defect accounting:
$$
Q = \left(\sum m_{\rm reactants}-\sum m_{\rm products}\right)c^2
$$

Net pp-chain ledger:
$$
4\,^1\mathrm{H}\rightarrow\,^4\mathrm{He}+2e^+ +2\nu_e + Q
$$

Net CNO-cycle ledger (catalytic):
$$
4\,^1\mathrm{H}\rightarrow\,^4\mathrm{He}+2e^+ +2\nu_e + Q
$$

Advanced extension reaction:
$$
3\,^4\mathrm{He}\rightarrow\,^{12}\mathrm{C}+\gamma + Q
$$

### 17.3 UX contract

Main compare panel:
- $\log_{10}T$ control, $\log_{10}\rho$ control, channel selector (`pp` vs `CNO`)
- Overlaid curves: $f_{\rm MB}(E)$, $P_{\rm tun}(E)$, and $I(E)$
- Live readouts: Gamow-window region, relative rate proxy, temperature-sensitivity indicator
- Add density-sensitivity readout so students can compare response to $\rho$ changes vs $T$ changes at fixed composition.

Deep-dive panels:
- `pp chain` step map (with branch simplification notes)
- `CNO cycle` step map (explicit catalyst role)
- `Mass-defect ledger` (reactant/product masses, $\Delta m$, and $Q$)
- `3\alpha process` (Advanced tab, with scope note)

### 17.4 Binding-energy-per-nucleon figure requirement

Include a dedicated deep-dive figure:
- **Binding energy per nucleon vs mass number $A$**
- Mark key nuclei and pedagogical anchors (H, He, C/O, Fe/Ni region)
- Explain why fusion is exoergic up to iron-peak scales and why that motivates heavier-element stage transitions

Figure must include:
- clear axis labels and units,
- legend/callouts for key regions,
- concise "what to notice" guidance,
- alt text for accessibility.

### 17.5 Additional info-figure set (recommended)

Add an `Info Figures` drawer in the demo with:
1. Coulomb barrier sketch with tunneling pathway.
2. Gamow-window overlap visualization across two temperatures.
3. pp vs CNO temperature-sensitivity comparison panel.
4. Burning-stage ladder (H, He, C, Ne, O, Si) as a future-facing context figure.

### 17.6 Future extension: heavier elements

Yes, include this as an explicit future extension track:
- Extend from H-burning and He-burning to a qualitative heavy-element sequence.
- Keep this extension conceptual-first (no full nuclear network solver requirement).
- Tie back to binding-energy-per-nucleon logic so the sequence is physically motivated, not memorized.

### 17.7 Scope boundaries

In scope:
- tunneling intuition, rate-proxy comparison, mass-defect accounting, pp/CNO deep dives.

Out of scope for this demo revision:
- full reaction-network integration,
- neutrino transport modeling,
- detailed supernova nucleosynthesis modeling.

### 17.8 Cold-fusion activity connection (pedagogy requirement)

Include a guided activity thread that uses the same physics to analyze why "cold fusion" is often framed as a holy-grail problem.

Activity goals:
- compare required tunneling probabilities at low thermal energies vs stellar-core conditions,
- use the model to show why rates collapse when $T$ is far below Gamow-window-relevant scales,
- distinguish "difficult/low-rate" from "impossible in principle,"
- practice evidence standards for extraordinary energy claims.

Suggested activity prompts:
1. Hold $\rho$ fixed, reduce $T$, and track the rate proxy collapse.
2. Ask students to identify whether changing $\rho$ alone can compensate for very low $T$ in this model.
3. Use a claim-check worksheet: if a system reports large fusion power at low $T$, what measurable signatures (energy ledger, products, reproducibility) must also appear?

Scope note:
- This is an analysis and scientific-reasoning activity, not a policy/opinion module.
- Keep tone neutral and evidence-based.

## 18. Additional ASTR 201 Additions (Approved)

These additions are intentionally additive to the existing suite and are designed to improve physics interpretability without forcing a full re-architecture.

### 18.1 Ionization & $\mu$ Lab (Saha-lite, validity-bounded)

Purpose:
- Bridge EOS and opacity by showing how ionization state changes effective particle counts and therefore $\mu$, $\mu_e$, and related thermodynamic behavior.

Core content:
- Keep fully ionized baseline formulas already used in Demo 1:
  - $\frac{1}{\mu} \approx 2X + \frac{3}{4}Y + \frac{1}{2}Z$
  - $\frac{1}{\mu_e} \approx X + \frac{Y}{2} + \frac{Z}{2}$
- Add Saha-lite partial-ionization toggle in bounded parameter ranges (explicit validity badge).
- Show qualitative ionization-fraction evolution across temperature and density.

Required outputs:
- live $\mu(T,\rho)$ and $\mu_e(T,\rho)$ under selected approximation mode,
- mode comparison panel (`fully ionized` vs `Saha-lite`),
- "where this approximation breaks" warning region.

Recommended placement:
- standalone mini-demo add-on, or deep-dive panel linked from Demo 1 and Demo 2.

### 18.1A Upgrade directive: full Saha-equation solver (ASTR 201 default)

For ASTR 201, implement a real Saha solve as the default model path (not a Saha-lite approximation).

Core equation for stage $i \rightarrow i+1$:
$$
\frac{n_{i+1} n_e}{n_i}
=
\frac{2\,U_{i+1}(T)}{U_i(T)}
\left(\frac{2\pi m_e k_B T}{h^2}\right)^{3/2}
\exp\!\left(-\frac{\chi_i}{k_B T}\right)
$$

with:
- stage populations $n_i$,
- electron density $n_e$,
- ionization energy $\chi_i$,
- partition functions $U_i(T)$.

Numerical contract:
- Solve coupled ionization-balance + charge-neutrality equations for selected species set.
- Support at minimum H and He fully; metals can start as grouped representative species with explicit assumptions.
- Provide robust convergence diagnostics and fallback messaging when parameter choices become numerically stiff.

Derived outputs (required):
- ionization fractions per species and stage,
- electron density $n_e$ and electron pressure contribution,
- resulting $\mu(T,\rho)$ and $\mu_e(T,\rho)$ from solved populations (not fixed presets).

Pedagogy/UX requirements:
- Keep a "show solver details" panel for advanced students (iteration count, residual, convergence status).
- Preserve a quick-compare mode against the fully ionized limit for intuition.
- If a simplified mode exists, it must be clearly labeled as secondary comparison only, not default.

### 18.1B Atmospheres and spectra linkage (explicit expansion)

Use the Ionization Lab as a direct bridge into stellar atmospheres and spectra instruction.

Required bridges:
1. **Ionization state -> spectral line visibility**
   - show qualitative line-strength relevance for key transitions as ionization fraction changes.
2. **Ionization/electron density -> continuum opacity context**
   - connect solved populations to opacity source dominance discussions.
3. **Temperature/density sweeps -> spectral-class intuition**
   - include guided sweeps demonstrating why different photospheric conditions favor different line signatures.

Minimum info figures for this bridge:
- Saha fraction vs $T$ at fixed $\rho$ for H and He stages,
- Saha fraction vs $\rho$ at fixed $T$,
- simple "which lines become prominent/suppressed" map tied to ionization state.

### 18.2 Fusion Energy Ledger Panel (within Microphysics Fusion Lab)

Purpose:
- Make mass defect and energy conservation explicit for each reaction path.

Required equations:
$$
Q = \Delta m\,c^2,\quad \Delta m = \sum m_{\rm reactants}-\sum m_{\rm products}
$$

Required panel behaviors:
- Step-by-step ledger rows for pp and CNO net paths.
- Explicit energy accounting columns:
  - total $Q$,
  - electromagnetic/thermal deposition proxy,
  - neutrino-carried-away channel note (labeled estimate/proxy).
- "Check your ledger" activity prompt where students identify missing terms.

Acceptance:
- students can inspect and export the full mass/energy ledger for each selected pathway.

### 18.3 Opacity Source Explorer (deep-dive for transport)

Purpose:
- Help students connect scalar $\kappa$ values to physical opacity mechanisms.

Required deep-dive modes:
1. Continuum-focused view (electron scattering + free-free/bound-free proxy).
2. Line/feature conceptual overlay (teaching-only, not full line-by-line transfer).
3. Regime-linked explanation cards tied to current $\log\rho$-$\log T$ location.

Required figure additions:
- channel contribution stack across representative stellar zones,
- "dominant source map" overlay linked to current state marker.

Scope boundary:
- keep this conceptual/mesoscopic; no full spectral synthesis or non-LTE RT solver required.

### 18.4 Convection Onset Stress Test (Advanced tab in Demo 7)

Purpose:
- Let students deliberately perturb transport parameters and observe Schwarzschild-boundary movement.

Core equation (already in suite appendix, surfaced interactively):
$$
\nabla_{\rm rad} = \frac{3\kappa L P}{16\pi a c G m T^4}
$$
Convection onset condition:
$$
\nabla_{\rm rad} > \nabla_{\rm ad}
$$

Required controls:
- opacity multiplier,
- luminosity multiplier,
- composition selector (linked to opacity behavior),
- optional $\nabla_{\rm ad}$ override in advanced mode.

Required outputs:
- boundary-shift visualization along radius,
- before/after convective-zone overlay,
- sensitivity summary: which perturbation moved the boundary most.

Acceptance:
- students can run at least three perturbation scenarios and compare resulting convective/radiative zone structure.

---

*Document maintained as part of Cosmic Playground NSF IUSE Level 2 grant.*
*Version 1.1: Revised with expert feedback on Eddington parameter, profile source architecture, numerical formulation, and two-layer robustness contract.*
*Version 1.2: Added ASTR 201 active implementation addendum with Demo 2 opacity-first sequencing and detailed Demo 1/Demo 2 extensions.*
*Version 1.3: Added Microphysics Fusion Lab addendum (tunneling, mass-defect accounting, pp/CNO/3$\alpha$ deep dives, density-vs-temperature controls, cold-fusion reasoning activity, and binding-energy-per-nucleon/info-figure requirements).*
*Version 1.4: Added ASTR 201 extensions: Ionization & $\mu$ Lab, Fusion Energy Ledger panel, Opacity Source Explorer deep dive, and Convection Onset Stress Test tab.*
*Version 1.5: Upgraded Ionization & $\mu$ Lab to require full Saha-equation solving and added explicit stellar-atmosphere/spectra teaching linkage.*
