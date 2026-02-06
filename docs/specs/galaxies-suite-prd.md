# Product Requirements Document: Galaxies Demo Suite

**Version:** 1.0
**Author:** Dr. Anna Rosen / Claude
**Date:** February 5, 2026
**Status:** Draft
**Project:** Cosmic Playground (NSF IUSE Level 2)

---

## Executive Summary

The Galaxies Demo Suite is a progressive, 8-demo learning sequence where students build a galaxy from observables: light → mass → dynamics → gas → star formation → feedback → interactions → evolution/scaling relations. Each demo adds one physical layer, and students "earn" the capstone by mastering the building blocks.

**Key principle:** Comprehensive without becoming Illustris-in-the-browser. The browser did nothing wrong; we are the ones asking too much of it.

**Critical architectural decision:** Demos share a common `GalaxyModel` data structure that propagates between demos, enabling students to build a coherent galaxy piece by piece.

---

## 1. Problem Statement

### The User Problem

Undergraduate astronomy students struggle to connect disparate concepts in extragalactic astronomy: photometry, dynamics, gas physics, star formation, and feedback are often taught as isolated topics. Students memorize scaling relations (Tully-Fisher, Faber-Jackson, mass-metallicity) without understanding why they exist or how observables constrain galaxy properties.

### Who Experiences This Problem

- **Primary:** Undergraduate astronomy majors in galaxies/extragalactic courses (ASTR 400-level)
- **Secondary:** Graduate students reviewing fundamentals, instructors teaching observational techniques
- **Frequency:** Every semester, ~30–80 students per institution taking extragalactic astronomy

### Cost of Not Solving

- Students treat scaling relations as empirical "facts" rather than physical consequences
- No intuition for how mass, dynamics, gas, and star formation interconnect
- Existing tools focus on either dynamics (galpy) or visualization (Illustris), not the pedagogical path between them
- "Where's the dark matter?" becomes rote rather than a genuine discovery moment

### Evidence

- Course feedback from extragalactic astronomy courses: students cite "connecting observations to physics" as the hardest conceptual leap
- Existing simulators (e.g., Galaxy Zoo, Universe Sandbox) prioritize visuals over physical reasoning
- No interactive tool that builds from photometry → mass → dynamics → star formation → scaling relations

---

## 2. Goals

### User Goals (What Students Get)

| Goal | Success Metric |
|------|----------------|
| **G1:** Understand that light is not mass | >80% of students can explain why $M/L$ ratios vary and why stellar mass profiles differ from light profiles |
| **G2:** Discover the dark matter problem themselves | >75% correctly infer dark matter from rotation curve decomposition before being told the answer |
| **G3:** Connect gas, star formation, and feedback as a coupled system | Students can predict qualitatively how changing gas fraction affects SFR and metallicity |
| **G4:** Understand why scaling relations exist | >70% can explain the physics behind Tully-Fisher and the mass-metallicity relation |
| **G5:** Build a coherent galaxy and predict its observables | Capstone completion rate >65% with correct placement on scaling relations |

### Business/Project Goals (What the Grant Gets)

| Goal | Success Metric |
|------|----------------|
| **B1:** Demonstrate NSF IUSE educational innovation | Suite cited in at least 2 peer-reviewed astronomy education papers by Year 3 |
| **B2:** Achieve broad adoption | >15 institutions using suite by end of grant period |
| **B3:** Maintain sustainability | All demos run in pure TypeScript with no server dependencies |

---

## 3. Non-Goals (Explicit Scope Boundaries)

| Non-Goal | Rationale |
|----------|-----------|
| **NG1:** Full cosmological simulation or live hydrodynamics | 🚫 PUNT — This is Illustris, not a teaching demo. Use toy models + precomputed snapshots. |
| **NG2:** Full radiative transfer / dust RT | 🚫 PUNT — Use simplified attenuation laws (Calzetti, Cardelli). |
| **NG3:** Full chemical evolution network | 🚫 PUNT — Use 1–2 parameter yield models (instantaneous recycling + effective yield). |
| **NG4:** Live N-body merger simulations | Use precomputed encounter library with interactive playback, not live integration for N > 1000. |
| **NG5:** SMBH accretion / AGN physics beyond a toy knob | Optional feedback toggle; not a full AGN model. |
| **NG6:** Cosmological redshift evolution | Focus on $z \approx 0$ galaxy physics; evolution is a separate suite. |
| **NG7:** IFU datacube analysis | 2D maps are sufficient; full 3D datacubes are overkill for pedagogy. |

---

## 4. Suite-Wide Design Principles

### 4.1 Layered Complexity Modes (Required for All Demos)

Every demo **must** implement three distinct modes:

| Mode | Definition | UI Behavior |
|------|------------|-------------|
| **Conceptual** | Qualitative relationships, normalized plots, minimal equations. Focus on "what happens when I change X?" | Hide equations by default; show trends and ratios |
| **Quantitative** | Real units (kpc, $M_\odot$, km/s), compute actual values, show governing equations, allow exports | Display equations prominently; show unit-ful values |
| **Advanced** | Extra physics (dust, metallicity gradients, anisotropy), error bars, observational uncertainties | Unlock additional parameters; show validation diagnostics |

### 4.2 Shared Galaxy Model (`GalaxyModel`)

Demos 2–8 build on a shared galaxy model that propagates between demos:

```typescript
interface GalaxyModel {
  // Structural parameters
  readonly M_star: number;           // stellar mass [M_sun]
  readonly M_halo: number;           // halo mass [M_sun]
  readonly R_d: number;              // disk scale length [kpc]
  readonly R_e: number;              // effective radius [kpc]
  readonly n_sersic: number;         // Sérsic index (bulge)
  readonly B_T: number;              // bulge-to-total ratio
  readonly c_halo: number;           // halo concentration

  // Gas and star formation
  readonly M_gas: number;            // gas mass [M_sun]
  readonly f_gas: number;            // gas fraction
  readonly SFR: number;              // star formation rate [M_sun/yr]
  readonly Z: number;                // metallicity [Z_sun]

  // Kinematics
  readonly v_c_max: number;          // maximum circular velocity [km/s]
  readonly sigma_0: number;          // central velocity dispersion [km/s]
  readonly inclination: number;      // viewing angle [deg]

  // Derived profiles (computed on demand)
  readonly profiles: GalaxyProfiles;
}

interface GalaxyProfiles {
  readonly r: Float64Array;          // radial coordinate [kpc]
  readonly I_r: Float64Array;        // surface brightness [L_sun/kpc²]
  readonly Sigma_star: Float64Array; // stellar surface density [M_sun/kpc²]
  readonly v_c: Float64Array;        // rotation curve [km/s]
  readonly Sigma_gas: Float64Array;  // gas surface density [M_sun/pc²]
  readonly Sigma_SFR: Float64Array;  // SFR surface density [M_sun/yr/kpc²]
}
```

### 4.3 Physics Sanity Invariants (Enforced Suite-Wide)

All computations must enforce and report:

| Invariant | Enforcement |
|-----------|-------------|
| $M(r)$ strictly increasing | Halt + diagnostic if violated |
| $v_c^2(r) \geq 0$ (no imaginary velocities) | Clamp to floor + warning |
| $\Sigma_{\rm SFR} \geq 0$ | Physical constraint |
| $0 \leq f_{\rm gas} \leq 1$ | Bound check |
| $Z > 0$ | Metallicity floor at primordial |
| Graceful handling of division by zero | Protected at $r = 0$ |

### 4.4 Observational Realism (P1)

For NSF IUSE alignment, demos should include "observer mode" where possible:

- **Noise:** Add realistic measurement uncertainties
- **Inclination effects:** Show how viewing angle affects measurements
- **Tracer biases:** Different tracers (H$\alpha$, CO, HI) sample different regions
- **Resolution limits:** What you can't see matters

---

## 5. User Stories (Demo-by-Demo)

### Demo 1: Galaxy Anatomy Lab

> **As a** student beginning extragalactic astronomy,
> **I want to** see how a galaxy's appearance changes with bulge fraction, disk size, inclination, and dust,
> **so that** I understand that the "same" galaxy can look very different depending on its structure and viewing angle.

**Physics Notes:**

Surface brightness profiles are fundamental. For a disk:
$$I_{\rm disk}(R) = I_0 \exp\left(-\frac{R}{R_d}\right)$$

For a bulge (Sérsic profile):
$$I_{\rm bulge}(R) = I_e \exp\left[-b_n \left(\left(\frac{R}{R_e}\right)^{1/n} - 1\right)\right]$$

where $b_n \approx 2n - 1/3$ for $n > 1$. The de Vaucouleurs profile is $n = 4$.

**Dust attenuation** follows a modified Calzetti law:
$$I_{\rm obs}(\lambda) = I_{\rm int}(\lambda) \times 10^{-0.4 A_\lambda}$$

where $A_\lambda = E(B-V) \times k(\lambda)$ and $k(\lambda)$ is the attenuation curve.

**Acceptance Criteria:**
- [ ] Sliders: bulge fraction $B/T$ (0–1), disk scale length $R_d$ (1–10 kpc), Sérsic index $n$ (0.5–6), inclination $i$ (0–90°), dust $E(B-V)$ (0–1)
- [ ] Output: synthetic multi-band image (g, r, i) + 1D surface brightness profile $I(R)$
- [ ] "Component stack" plot showing bulge + disk contributions
- [ ] Inclination toggle showing face-on vs edge-on views
- [ ] Dust toggle showing attenuated vs intrinsic emission
- [ ] Pedagogical callout: "Same galaxy, different viewing angle + dust = different apparent morphology"

### Demo 2: Photometry → Mass

> **As a** student learning observational techniques,
> **I want to** convert a galaxy's light profile to a stellar mass profile using mass-to-light ratios,
> **so that** I understand that light is not mass, and $M/L$ varies with stellar populations.

**Physics Notes:**

The stellar mass surface density is:
$$\Sigma_*(R) = (M/L) \times I(R)$$

But $M/L$ is **not constant**—it depends on stellar population age and metallicity:

- Young populations: $M/L_V \sim 0.5$ (blue, massive stars dominate light)
- Old populations: $M/L_V \sim 3–6$ (red giants dominate light, most mass in low-mass dwarfs)

A useful approximation from Bell et al. (2003):
$$\log_{10}(M/L_K) = -0.206 + 0.135 \times (B-V)$$

**Cumulative mass:**
$$M_*(<R) = 2\pi \int_0^R \Sigma_*(R') R' \, dR'$$

**Acceptance Criteria:**
- [ ] Input: multi-band photometry or surface brightness profile (with presets)
- [ ] Compute stellar mass surface density $\Sigma_*(R)$ using Bell et al. (2003) color-$M/L$ relations
- [ ] Display uncertainty bars on $M/L$ (typically 0.1–0.2 dex)
- [ ] Output: cumulative mass profile $M_*(<R)$
- [ ] Side-by-side comparison: light profile vs mass profile
- [ ] Pedagogical punchline: "Mass follows light... until it doesn't (at large $R$ where $M/L$ changes)"

### Demo 3: Rotation Curves — Where's the Mass?

> **As a** student learning dynamics,
> **I want to** decompose a galaxy's rotation curve into disk, bulge, and halo contributions,
> **so that** I can discover for myself that visible matter alone cannot explain the observed kinematics.

**Physics Notes:**

The rotation curve $v_c(R)$ relates to the enclosed mass:
$$v_c^2(R) = \frac{G M(<R)}{R}$$

For a galaxy with multiple components, velocities add in quadrature:
$$v_c^2(R) = v_{\rm disk}^2(R) + v_{\rm bulge}^2(R) + v_{\rm halo}^2(R)$$

**Disk contribution** (exponential disk, Freeman 1970):
$$v_{\rm disk}^2(R) = 4\pi G \Sigma_0 R_d y^2 [I_0(y)K_0(y) - I_1(y)K_1(y)]$$

where $y = R/(2R_d)$ and $I_n$, $K_n$ are modified Bessel functions.

**Bulge contribution** (deprojected Sérsic):
$$M_{\rm bulge}(<R) = M_{\rm bulge,tot} \times \gamma(2n, b_n (R/R_e)^{1/n}) / \Gamma(2n)$$

**Halo contribution** (NFW profile):
$$v_{\rm NFW}^2(R) = V_{200}^2 \frac{\ln(1+cx) - cx/(1+cx)}{x[\ln(1+c) - c/(1+c)]}$$

where $x = R/R_{200}$ and $c$ is the concentration parameter.

**The dark matter reveal:** At large $R$, observed $v_c$ stays flat, but $v_{\rm disk} + v_{\rm bulge}$ declines Keplerian → halo dominates.

**Acceptance Criteria:**
- [ ] Let students choose: disk-only, disk+bulge, disk+bulge+halo
- [ ] Show contributions to $v_c^2(R)$ stacked (disk in blue, bulge in orange, halo in gray)
- [ ] Overlay observed rotation curve data (Milky Way, M31, or synthetic)
- [ ] "Observer mode" (P1): add noise, inclination errors, beam smearing
- [ ] Interactive: adjust $M/L$, halo mass, concentration; see fit quality
- [ ] Pedagogical reveal: "The disk alone predicts $v_c \propto R^{-1/2}$ at large $R$, but we see $v_c \approx \text{const}$—where's the missing mass?"

### Demo 4: Dispersion & Virial Mass

> **As a** student learning about elliptical galaxies,
> **I want to** see how velocity dispersion and size give a dynamical mass estimate,
> **so that** I understand that ellipticals aren't "failed rotators" but are supported by random motions.

**Physics Notes:**

The virial theorem gives:
$$M_{\rm dyn} \approx \frac{k \sigma^2 R_e}{G}$$

where $k$ depends on the mass profile (typically $k \approx 5$ for a de Vaucouleurs profile).

For a singular isothermal sphere:
$$\sigma^2 = \frac{G M(<R)}{2R}$$

**Velocity dispersion profile** for an isotropic system:
$$\sigma^2(R) = \frac{1}{\nu(R)} \int_R^\infty \nu(r) \frac{G M(<r)}{r^2} dr$$

where $\nu(R)$ is the stellar density (deprojected from $I(R)$).

**Anisotropy** (Advanced): The Jeans equation includes an anisotropy parameter $\beta$:
$$\beta = 1 - \frac{\sigma_\theta^2}{\sigma_r^2}$$

- $\beta = 0$: isotropic
- $\beta > 0$: radially biased (elongated orbits)
- $\beta < 0$: tangentially biased (circular orbits)

**Fundamental Plane:**
$$R_e \propto \sigma^{1.2} I_e^{-0.8}$$

This tilt from the virial prediction ($R_e \propto \sigma^2 I_e^{-1}$) encodes $M/L$ variations.

**Acceptance Criteria:**
- [ ] Input: $\sigma_0$ (central dispersion), $R_e$, $I_e$, Sérsic $n$
- [ ] Compute virial mass: $M_{\rm vir} = k \sigma_0^2 R_e / G$
- [ ] Show how $k$ varies with profile shape ($n = 1$: $k \approx 3$; $n = 4$: $k \approx 5$)
- [ ] Display on Faber-Jackson relation: $L \propto \sigma^4$
- [ ] Advanced toggle: anisotropy parameter $\beta$; show how it affects inferred mass
- [ ] Pedagogical note: "Ellipticals are dispersion-supported, not rotation-supported"

### Demo 5: Gas Physics & Star Formation

> **As a** student learning about the ISM,
> **I want to** see how gas surface density relates to star formation rate,
> **so that** I understand the Kennicutt-Schmidt law and why gas matters for galaxy evolution.

**Physics Notes:**

The **Kennicutt-Schmidt relation** (Kennicutt 1998):
$$\Sigma_{\rm SFR} = A \times \Sigma_{\rm gas}^N$$

with $A \approx 2.5 \times 10^{-4}$ $M_\odot$ yr$^{-1}$ kpc$^{-2}$ and $N \approx 1.4$ for total gas.

For molecular gas only (Bigiel et al. 2008):
$$\Sigma_{\rm SFR} = \epsilon_{\rm ff} \frac{\Sigma_{\rm H_2}}{t_{\rm ff}}$$

with depletion time $t_{\rm dep} = \Sigma_{\rm H_2} / \Sigma_{\rm SFR} \approx 2$ Gyr.

**Gas profiles:** Exponential with scale length $R_{\rm gas} \approx 1.5 R_d$:
$$\Sigma_{\rm gas}(R) = \Sigma_{\rm gas,0} \exp\left(-\frac{R}{R_{\rm gas}}\right)$$

**Star formation threshold** (Toomre stability):
$$Q = \frac{\sigma_{\rm gas} \kappa}{\pi G \Sigma_{\rm gas}} > 1 \implies \text{stable (no SF)}$$

where $\kappa$ is the epicyclic frequency. Star formation occurs where $Q \lesssim 1$.

**Tracer biases:**
- **HI 21cm:** traces atomic hydrogen, dominant at large $R$
- **CO(1-0):** traces molecular hydrogen (with $X_{\rm CO}$ conversion factor)
- **H$\alpha$:** traces ionized gas around young stars (SFR tracer, not gas mass)

**Acceptance Criteria:**
- [ ] **Loads `GalaxyModel`** from previous demos for stellar profile context
- [ ] Input: gas mass $M_{\rm gas}$, gas scale length $R_{\rm gas}$, metallicity $Z$
- [ ] Compute $\Sigma_{\rm SFR}(R)$ via Kennicutt-Schmidt
- [ ] Display depletion time: $t_{\rm dep}(R) = \Sigma_{\rm gas}(R) / \Sigma_{\rm SFR}(R)$
- [ ] "Where stars form" map: highlight regions with $Q < 1$
- [ ] Tracer toggle (P1): show HI vs CO vs H$\alpha$ profiles and their biases
- [ ] Advanced: metallicity-dependent $X_{\rm CO}$ factor

### Demo 6: Feedback & the Baryon Cycle

> **As a** student learning about galaxy self-regulation,
> **I want to** see how inflows, star formation, and outflows form a coupled system,
> **so that** I understand why dwarf galaxies "struggle" and why metallicity correlates with mass.

**Physics Notes:**

The **bathtub model** (Bouché et al. 2010, Lilly et al. 2013):
$$\frac{dM_{\rm gas}}{dt} = \dot{M}_{\rm in} - (1 - R + \eta) \times \text{SFR}$$

where:
- $\dot{M}_{\rm in}$: gas inflow rate (cosmological accretion)
- $R \approx 0.4$: return fraction (stellar mass loss)
- $\eta$: mass loading factor (outflow rate / SFR)

**Mass loading scales with mass** (from observations and simulations):
$$\eta \propto M_*^{-\alpha} \quad \text{with } \alpha \approx 0.3-0.5$$

Low-mass galaxies have $\eta \gg 1$ → most metals ejected → low $Z$.

**Metallicity evolution:**
$$\frac{dZ}{dt} = \frac{y \times \text{SFR} - Z \times (\eta \times \text{SFR} + \dot{M}_{\rm out})}{M_{\rm gas}}$$

where $y$ is the nucleosynthetic yield.

**Equilibrium metallicity** (when $dZ/dt = 0$):
$$Z_{\rm eq} = \frac{y}{1 + \eta (1 - R)^{-1}}$$

This explains the **mass-metallicity relation**: high $\eta$ at low mass → low $Z$.

**Acceptance Criteria:**
- [ ] Simple control-system model: inflow → gas reservoir → SFR → outflows → CGM recycling
- [ ] Sliders: inflow rate, mass loading $\eta$, yield $y$, recycling timescale
- [ ] Output time series: $M_{\rm gas}(t)$, SFR$(t)$, $Z(t)$
- [ ] Show "bursty dwarfs" (high $\eta$, oscillating SFR) vs "steady spirals" (low $\eta$, smooth SFR)
- [ ] Mass-metallicity relation emergence: plot equilibrium $Z$ vs $M_*$ for different $\eta(M_*)$
- [ ] Pedagogical insight: "Why dwarfs struggle: feedback blows out gas before it can form stars or retain metals"

### Demo 7: Interactions & Mergers

> **As a** student learning about galaxy evolution,
> **I want to** see how galaxy interactions produce tidal features, trigger starbursts, and transform morphology,
> **so that** I understand dynamical friction, tidal stripping, and the merger-driven path to ellipticals.

**Physics Notes:**

**Dynamical friction** (Chandrasekhar 1943):
$$\vec{F}_{\rm df} = -\frac{4\pi G^2 M_{\rm sat}^2 \ln\Lambda \, \rho(<v)}{v^2} \hat{v}$$

where $\ln\Lambda \approx \ln(M_{\rm host}/M_{\rm sat})$ is the Coulomb logarithm and $\rho(<v)$ is the density of background particles moving slower than the satellite.

**Merger timescale:**
$$t_{\rm merge} \approx \frac{0.1 R_{\rm vir}^2 v_c}{G M_{\rm sat} \ln\Lambda}$$

**Tidal radius** (where host's tidal force equals satellite's self-gravity):
$$r_t = R \left(\frac{M_{\rm sat}}{3 M_{\rm host}(<R)}\right)^{1/3}$$

Material outside $r_t$ is tidally stripped → tidal tails.

**Starburst triggering:** Mergers drive gas to the center via gravitational torques, compressing it and triggering intense star formation:
$$\text{SFR}_{\rm burst} \sim 10-100 \times \text{SFR}_{\rm quiescent}$$

**Morphological transformation:**
- Major merger ($M_1/M_2 > 1/3$): disk destruction → elliptical
- Minor merger ($M_1/M_2 < 1/10$): disk thickening, mild bulge growth

**Acceptance Criteria:**
- [ ] Toy N-body visualization (N ~ 500–800, within performance limits) OR precomputed encounter library with interactive playback
- [ ] Adjustable parameters: mass ratio, impact parameter, orbit eccentricity
- [ ] Show tidal tail formation in real-time
- [ ] Starburst indicator: show SFR enhancement during pericenter passages
- [ ] Morphology metrics: track $B/T$ ratio, asymmetry, concentration through merger
- [ ] Presets: Milky Way–LMC-like, Antennae-like, minor merger
- [ ] Pedagogical outcomes: dynamical friction → inspiral; tidal stripping → streams; mergers → ellipticals

### Demo 8: Capstone — Build-a-Galaxy

> **As a** student who has mastered the building blocks,
> **I want to** build a complete galaxy by choosing halo mass, spin, gas fraction, and feedback strength,
> **so that** I can predict its observables and see where it falls on fundamental scaling relations.

**Physics Notes:**

**Halo mass sets the stage:** From $M_{\rm halo}$, derive:
- Virial radius: $R_{200} = \left(\frac{3 M_{200}}{4\pi \times 200 \rho_{\rm crit}}\right)^{1/3}$
- Virial velocity: $V_{200} = \sqrt{G M_{200} / R_{200}}$
- Concentration: $c \approx 10 \times (M_{200}/10^{12} M_\odot)^{-0.1}$ (Dutton & Macciò 2014)

**Spin parameter** sets disk size:
$$R_d = \frac{\lambda}{\sqrt{2}} \frac{j_d}{m_d} R_{200}$$

where $\lambda$ is the spin parameter, $j_d/m_d$ is the specific angular momentum fraction retained by the disk. Typical $\lambda \approx 0.035$.

**Stellar-to-halo mass relation** (abundance matching, Behroozi et al. 2019):
$$\frac{M_*}{M_{\rm halo}} = \epsilon(M_{\rm halo}) \times f_b$$

with peak efficiency $\epsilon \approx 0.2$ at $M_{\rm halo} \sim 10^{12} M_\odot$.

**Scaling relations to reproduce:**

1. **Tully-Fisher** (rotating disks):
$$M_* \propto v_{\rm max}^{3.5-4}$$

2. **Faber-Jackson** (ellipticals):
$$L \propto \sigma^4$$

3. **Star-forming main sequence:**
$$\text{SFR} \propto M_*^{0.8}$$

4. **Mass-metallicity relation:**
$$12 + \log({\rm O/H}) \approx 8.9 + 0.3 \times \log(M_*/10^{10} M_\odot)$$

**Acceptance Criteria:**
- [ ] Inputs: halo mass $M_{200}$, concentration $c$ (or redshift proxy), spin parameter $\lambda$, gas fraction $f_{\rm gas}$, feedback strength $\eta(M)$, environment toggle (field vs group)
- [ ] Computed outputs:
  - Stellar mass $M_*$ (from SHMR)
  - Disk scale length $R_d$ (from spin)
  - Rotation curve $v_c(R)$ (disk + halo)
  - SFR (from gas + K-S law)
  - Metallicity $Z$ (from equilibrium model)
- [ ] Synthetic observables:
  - Multi-band image
  - Rotation curve
  - Velocity dispersion profile (if $B/T$ high)
- [ ] Scaling relation placement:
  - Tully-Fisher: plot $M_*$ vs $v_{\rm max}$ with observed relation + scatter band
  - Main sequence: plot SFR vs $M_*$
  - Mass-metallicity: plot $Z$ vs $M_*$
- [ ] Export: "galaxy state" JSON with all derived properties
- [ ] **Two-layer robustness** (per stellar structure PRD):
  - Layer 1: constrained parameter space, always produces physical result
  - Layer 2 (Advanced): wider parameter space, can produce "failed" galaxies with diagnostics

### Edge Cases & Error States

> **As a** student who enters unphysical parameters,
> **I want to** see a clear explanation of why my galaxy "doesn't work,"
> **so that** I learn the physical constraints on galaxy formation.

**Acceptance Criteria:**
- [ ] Handle: $f_{\rm gas} > 1$, $\eta < 0$, $M_* > f_b M_{\rm halo}$
- [ ] Error messages explain physics: "This gas fraction exceeds the cosmic baryon budget—no galaxy can be this gas-rich"
- [ ] "Reset to physical" button with Milky Way-like defaults
- [ ] Show diagnostic: "Your galaxy is 2σ off the main sequence—this is rare but not impossible"

---

## 6. Requirements

### Must-Have (P0) — Core Learning Sequence

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P0-1** | **Demo 3: Rotation Curves** | Decompose $v_c^2$ into disk + bulge + halo; show dark matter reveal; fit to data |
| **P0-2** | **Demo 5: Gas & Star Formation** | K-S law implementation; depletion time; "where stars form" visualization |
| **P0-3** | **Demo 8: Capstone Build-a-Galaxy** | Halo → disk → SFR → $Z$; placement on 3 scaling relations; two-layer robustness |
| **P0-4** | **`GalaxyModel` contract** | Shared interface propagating between demos |
| **P0-5** | **Layered complexity modes** | Conceptual / Quantitative / Advanced in all demos |
| **P0-6** | **Physics sanity invariants** | No negative masses, $v_c^2 \geq 0$, bounded $f_{\rm gas}$ |
| **P0-7** | **Data export** | All demos export profiles as CSV; capstone exports JSON |
| **P0-8** | **Validation test suite** | Unit tests for NFW, Sérsic, K-S, bathtub model against analytic limits |
| **P0-9** | **Performance** | All computations < 100ms; interaction playback at 30+ fps |

### Should-Have (P1) — Enhanced Experience

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P1-1** | **Demo 1: Galaxy Anatomy Lab** | Bulge + disk + dust; synthetic images; inclination effects |
| **P1-2** | **Demo 2: Photometry → Mass** | Color-$M/L$ conversion; uncertainty visualization; mass profile |
| **P1-3** | **Demo 4: Dispersion & Virial Mass** | Virial estimator; Faber-Jackson; anisotropy toggle |
| **P1-4** | **Demo 6: Feedback & Baryon Cycle** | Bathtub model ODE; mass-$Z$ relation emergence |
| **P1-5** | **Demo 7: Interactions & Mergers** | N-body or precomputed playback; tidal tails; starburst trigger |
| **P1-6** | **Observer mode** | Noise, inclination errors, beam smearing in Demos 3, 5 |
| **P1-7** | **Tracer biases** | HI vs CO vs H$\alpha$ in Demo 5 |
| **P1-8** | **Preset library** | Milky Way, M31, M87, LMC, NGC 1277 presets |
| **P1-9** | **Predict–Play–Explain prompts** | Embedded pedagogy per demo |

### Could-Have (P2) — Future Enhancements

| ID | Requirement | Rationale |
|----|-------------|-----------|
| **P2-1** | **Environment effects** | Ram pressure stripping; cluster quenching |
| **P2-2** | **AGN feedback toggle** | Simple quenching prescription |
| **P2-3** | **Comparison to SDSS/GAMA data** | Overlay real galaxy samples on scaling relations |
| **P2-4** | **Multi-galaxy comparison** | Side-by-side structure for different masses/types |
| **P2-5** | **IFU-lite mode** | 2D velocity fields for Demo 3/4 |
| **P2-6** | **Redshift slider** | Show how relations evolve (requires precomputed tracks) |

### Won't Have (This Version)

| Feature | Rationale |
|---------|-----------|
| Full hydrodynamic simulation | Illustris is not a teaching demo; use toy models |
| Full radiative transfer | Simplified attenuation sufficient for pedagogy |
| Full chemical network | 1–2 parameter yield models capture the physics |
| Live N-body for N > 1000 | Performance constraint; use precomputed library |
| SMBH accretion physics | Optional feedback knob only |

---

## 7. Technical Architecture

### Physics Package Structure

```
packages/galaxies/
├── core/
│   ├── galaxyModel.ts           # Shared GalaxyModel interface
│   ├── constants.ts             # G, M_sun, kpc, cosmological params
│   └── sanityChecks.ts          # Invariant enforcement
├── photometry/
│   ├── sersic.ts                # Sérsic profile: I(R) = I_e exp[-b_n((R/R_e)^{1/n} - 1)]
│   ├── exponentialDisk.ts       # Disk: I(R) = I_0 exp(-R/R_d)
│   ├── dust.ts                  # Calzetti/Cardelli attenuation
│   ├── massToLight.ts           # Bell et al. color-M/L relations
│   └── syntheticImages.ts       # Multi-band image generation
├── dynamics/
│   ├── rotationCurve.ts         # v_c(R) from M(<R)
│   ├── diskContribution.ts      # Freeman disk with Bessel functions
│   ├── bulgeContribution.ts     # Deprojected Sérsic mass profile
│   ├── nfwHalo.ts               # NFW profile: M(<R), v_c(R), concentration
│   ├── virialEstimator.ts       # M_dyn = k σ² R_e / G
│   └── jeansEquation.ts         # Dispersion profile (Advanced)
├── ism/
│   ├── gasProfile.ts            # Exponential gas distribution
│   ├── kennicuttSchmidt.ts      # Σ_SFR = A × Σ_gas^N
│   ├── depletionTime.ts         # t_dep = Σ_gas / Σ_SFR
│   ├── toomreQ.ts               # Stability criterion
│   └── tracerBias.ts            # HI, CO, Hα conversion factors
├── feedback/
│   ├── bathtubModel.ts          # dM_gas/dt ODE system
│   ├── massLoading.ts           # η(M_*) parameterization
│   ├── yieldModel.ts            # Effective yield for metallicity
│   └── equilibriumZ.ts          # Analytic equilibrium metallicity
├── interactions/
│   ├── dynamicalFriction.ts     # Chandrasekhar formula
│   ├── tidalRadius.ts           # r_t calculation
│   ├── encounterLibrary.ts      # Precomputed merger snapshots
│   └── mergerPlayback.ts        # Interactive visualization
├── scalingRelations/
│   ├── tullyFisher.ts           # M_* vs v_max
│   ├── faberJackson.ts          # L vs σ
│   ├── mainSequence.ts          # SFR vs M_*
│   ├── massMetallicity.ts       # Z vs M_*
│   └── stellarHaloMass.ts       # M_* vs M_halo (SHMR)
└── validation/
    ├── analyticLimits.ts        # NFW, isothermal, Sérsic edge cases
    ├── scalingRelationFits.ts   # Compare to observed relations
    └── oracles.ts               # Test case generators
```

### Key Numerical Implementations

#### NFW Halo Profile

```typescript
// packages/galaxies/dynamics/nfwHalo.ts

export interface NFWParams {
  M_200: number;    // virial mass [M_sun]
  c: number;        // concentration
}

export function nfwEnclosedMass(r: number, params: NFWParams): number {
  const { M_200, c } = params;
  const R_200 = virialRadius(M_200);
  const r_s = R_200 / c;
  const x = r / r_s;

  // M(<r) = M_200 × f(x) / f(c)
  // f(x) = ln(1+x) - x/(1+x)
  const f_x = Math.log(1 + x) - x / (1 + x);
  const f_c = Math.log(1 + c) - c / (1 + c);

  return M_200 * f_x / f_c;
}

export function nfwCircularVelocity(r: number, params: NFWParams): number {
  const M_enc = nfwEnclosedMass(r, params);
  const r_cm = r * KPC_TO_CM;
  // v_c = sqrt(G M / r)
  return Math.sqrt(G_CGS * M_enc * MSUN_TO_G / r_cm) / 1e5;  // km/s
}
```

#### Kennicutt-Schmidt Law

```typescript
// packages/galaxies/ism/kennicuttSchmidt.ts

export interface KSParams {
  A: number;        // normalization [M_sun/yr/kpc²]
  N: number;        // power-law index
  threshold?: number; // Σ_gas threshold for SF [M_sun/pc²]
}

const KS_DEFAULT: KSParams = {
  A: 2.5e-4,        // Kennicutt (1998) calibration
  N: 1.4,
  threshold: 5.0    // typical threshold ~5 M_sun/pc²
};

export function sfRateSurfaceDensity(
  Sigma_gas: number,   // [M_sun/pc²]
  params: KSParams = KS_DEFAULT
): number {
  if (params.threshold && Sigma_gas < params.threshold) {
    return 0;  // below SF threshold
  }
  // Σ_SFR = A × Σ_gas^N  [M_sun/yr/kpc²]
  // Note: Σ_gas in M_sun/pc², so convert
  const Sigma_gas_kpc = Sigma_gas * 1e6;  // M_sun/kpc²
  return params.A * Math.pow(Sigma_gas_kpc, params.N);
}

export function depletionTime(Sigma_gas: number, Sigma_SFR: number): number {
  // t_dep = Σ_gas / Σ_SFR [yr]
  if (Sigma_SFR <= 0) return Infinity;
  return (Sigma_gas * 1e6) / Sigma_SFR;  // convert Σ_gas to kpc² units
}
```

#### Bathtub Model ODE

```typescript
// packages/galaxies/feedback/bathtubModel.ts

export interface BathtubParams {
  M_dot_in: number;     // inflow rate [M_sun/yr]
  R: number;            // return fraction (~0.4)
  eta: number;          // mass loading factor
  y: number;            // nucleosynthetic yield
  tau_recycle: number;  // CGM recycling timescale [yr]
}

export interface BathtubState {
  M_gas: number;        // gas mass [M_sun]
  Z: number;            // metallicity [mass fraction]
  M_CGM: number;        // CGM mass [M_sun]
}

export function bathtubDerivatives(
  state: BathtubState,
  params: BathtubParams,
  t: number
): BathtubState {
  const { M_gas, Z, M_CGM } = state;
  const { M_dot_in, R, eta, y, tau_recycle } = params;

  // Star formation rate (simplified: SFR = M_gas / t_dep)
  const t_dep = 2e9;  // 2 Gyr depletion time
  const SFR = M_gas / t_dep;

  // Outflow rate
  const M_dot_out = eta * SFR;

  // CGM recycling
  const M_dot_recycle = M_CGM / tau_recycle;

  // Gas mass evolution
  // dM_gas/dt = inflow + recycling + stellar return - SF - outflow
  const dM_gas = M_dot_in + M_dot_recycle + R * SFR - SFR - M_dot_out;

  // Metallicity evolution
  // dZ/dt = (y × SFR - Z × (outflow + SF - return)) / M_gas
  const dZ = (y * SFR - Z * (M_dot_out + SFR - R * SFR)) / Math.max(M_gas, 1e6);

  // CGM evolution
  const dM_CGM = M_dot_out - M_dot_recycle;

  return { M_gas: dM_gas, Z: dZ, M_CGM: dM_CGM };
}
```

### Data Dependencies

| Demo | Precomputed Data Needed | Source | Size |
|------|------------------------|--------|------|
| Demo 1 | Filter response curves (ugriz) | SDSS | <100KB |
| Demo 3 | Observed rotation curves | SPARC, Sofue | ~500KB |
| Demo 7 | Merger encounter library | Precomputed (idealized sims) | ~10MB |
| Demo 8 | Scaling relation fits + scatter | Literature compilations | <100KB |

---

## 8. Success Metrics

### Leading Indicators (1–4 weeks post-launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Demo completion rate** | >65% complete Demo 3 (Rotation Curves) | Analytics |
| **Dark matter "aha" moment** | >50% try disk-only first, then add halo | Analytics: component toggle order |
| **Capstone attempt rate** | >40% of Demo 3 completers attempt Demo 8 | Funnel tracking |
| **Parameter exploration** | Average >8 parameter changes per demo | Slider interaction count |
| **Scaling relation accuracy** | >60% place capstone galaxy within 1σ of observed relations | Computed position vs bands |

### Lagging Indicators (1 semester+)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Learning assessment improvement** | >12% improvement on galaxy dynamics exam questions | Pre/post assessment |
| **Instructor adoption** | >8 institutions using in Year 1 | Survey + analytics |
| **"Dark matter discovery" retention** | >70% remember the rotation curve argument 6 months later | Follow-up survey |

### Validation Metrics (Continuous)

| Test | Criterion | Frequency |
|------|-----------|-----------|
| NFW enclosed mass | $M(<R_{200}) = M_{200}$ within 0.1% | Every build |
| Freeman disk $v_c$ | Matches Bessel function solution within 1% | Every build |
| K-S law | $\Sigma_{\rm SFR}$ matches Kennicutt (1998) calibration | Every build |
| Bathtub equilibrium | $Z_{\rm eq}$ matches analytic formula | Every build |
| Tully-Fisher slope | Capstone output within 0.2 dex of observed relation | Weekly |

---

## 9. Open Questions

### Blocking (Must resolve before implementation)

| Question | Owner | Notes |
|----------|-------|-------|
| **Q1:** Which rotation curve datasets to include? | Physics | SPARC is public and well-documented; Sofue compilation also useful |
| **Q2:** How to handle merger library generation? | Engineering | Options: use Gadget-4 output, or idealized restricted 3-body |
| **Q3:** Mass loading parameterization $\eta(M_*)$? | Physics | Use FIRE-2 fits or simple power law? |

### Non-Blocking (Can resolve during implementation)

| Question | Owner | Notes |
|----------|-------|-------|
| **Q4:** Synthetic image resolution/quality | Design | 256×256 sufficient for pedagogy? |
| **Q5:** Environment effects scope for P2 | Physics | Ram pressure vs tidal stripping vs both |
| **Q6:** SDSS comparison data license | Legal | Public data but check terms |

---

## 10. Timeline & Phasing

### Recommended Build Order

Based on the principle that **Demo 3 is the "dark matter reveal"** and Demos 3, 5, 8 form the minimum physics progression:

| Phase | Demos | Duration | Deliverable |
|-------|-------|----------|-------------|
| **Phase 0** | `GalaxyModel` contract | 0.5 weeks | Interface + mock data |
| **Phase 1** | Demo 3 (Rotation Curves) | 2.5 weeks | NFW + disk + Bessel functions; dark matter reveal |
| **Phase 2** | Demo 5 (Gas & SF) | 2 weeks | K-S law; depletion time; Toomre Q |
| **Phase 3** | Demo 8 (Capstone) | 3 weeks | Full build-a-galaxy; 3 scaling relations |
| **Phase 4** | Demos 1, 2, 4 | 2.5 weeks | Photometry suite |
| **Phase 5** | Demo 6 (Feedback) | 1.5 weeks | Bathtub ODE; mass-$Z$ emergence |
| **Phase 6** | Demo 7 (Mergers) | 2 weeks | Encounter library + playback |
| **Phase 7** | Validation + Polish | 1 week | Test suite + instructor materials |

**Total:** ~15 weeks for full suite

### Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| **M0: Galaxy Contract** | +0.5 weeks | `GalaxyModel` interface defined |
| **M1: Dark Matter Demo** | +3 weeks | Demo 3 working; rotation curve decomposition |
| **M2: Star Formation** | +5 weeks | Demo 5 complete; K-S law functional |
| **M3: Capstone Alpha** | +8 weeks | Demo 8 producing scaling relation placement |
| **M4: Photometry Suite** | +10.5 weeks | Demos 1, 2, 4 complete |
| **M5: Full Suite Beta** | +14 weeks | All 8 demos; internal testing |
| **M6: v1.0 Release** | +15 weeks | Validated, documented, deployed |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R1:** Merger N-body performance | Medium | High | Use precomputed library instead of live N-body for N > 800 |
| **R2:** Bessel function numerical stability | Low | Medium | Use well-tested library (e.g., `jstat` or custom implementation with asymptotic expansions) |
| **R3:** Students skip to capstone | Medium | Medium | Gate Demo 8 behind completion of Demos 3, 5 |
| **R4:** Scaling relation scatter confuses students | Medium | Low | Show observed scatter bands; explain intrinsic vs measurement scatter |
| **R5:** Scope creep toward full simulations | High | High | Explicit PUNT list; no live hydro |
| **R6:** Rotation curve data IP issues | Low | Medium | Use SPARC (public) and cite appropriately |

---

## 12. Appendix: Physics Reference

### Key Equations Summary

**Sérsic Profile:**
$$I(R) = I_e \exp\left[-b_n \left(\left(\frac{R}{R_e}\right)^{1/n} - 1\right)\right]$$

**Exponential Disk:**
$$I(R) = I_0 \exp\left(-\frac{R}{R_d}\right)$$

**NFW Enclosed Mass:**
$$M(<r) = M_{200} \frac{\ln(1+x) - x/(1+x)}{\ln(1+c) - c/(1+c)}, \quad x = \frac{r}{r_s}$$

**Freeman Disk Rotation Curve:**
$$v_{\rm disk}^2(R) = 4\pi G \Sigma_0 R_d y^2 [I_0(y)K_0(y) - I_1(y)K_1(y)], \quad y = \frac{R}{2R_d}$$

**Kennicutt-Schmidt Law:**
$$\Sigma_{\rm SFR} = (2.5 \times 10^{-4}) \left(\frac{\Sigma_{\rm gas}}{M_\odot \, {\rm pc}^{-2}}\right)^{1.4} M_\odot \, {\rm yr}^{-1} \, {\rm kpc}^{-2}$$

**Toomre Q:**
$$Q = \frac{\sigma_{\rm gas} \kappa}{\pi G \Sigma_{\rm gas}}$$

**Virial Mass Estimator:**
$$M_{\rm vir} = \frac{k \sigma^2 R_e}{G}, \quad k \approx 5 \text{ (de Vaucouleurs)}$$

**Bathtub Equilibrium Metallicity:**
$$Z_{\rm eq} = \frac{y}{1 + \eta/(1-R)}$$

**Tully-Fisher Relation:**
$$\log(M_*/M_\odot) = 3.5 \log(v_{\rm max}/\text{km s}^{-1}) + 1.5$$

**Mass-Metallicity Relation:**
$$12 + \log({\rm O/H}) \approx 8.9 + 0.3 \log(M_*/10^{10} M_\odot)$$

### Key Physical Constants

| Constant | Symbol | Value | Units |
|----------|--------|-------|-------|
| Gravitational constant | $G$ | $4.30 \times 10^{-6}$ | kpc km² s⁻² $M_\odot^{-1}$ |
| Solar mass | $M_\odot$ | $1.989 \times 10^{33}$ | g |
| Kiloparsec | kpc | $3.086 \times 10^{21}$ | cm |
| Hubble constant | $H_0$ | $70$ | km s⁻¹ Mpc⁻¹ |
| Critical density | $\rho_{\rm crit}$ | $1.36 \times 10^{11}$ | $M_\odot$ Mpc⁻³ |
| Cosmic baryon fraction | $f_b$ | $0.157$ | — |

---

## 13. References

1. Binney, J. & Tremaine, S. (2008). *Galactic Dynamics*, 2nd ed. Princeton.
2. Mo, H., van den Bosch, F., & White, S. (2010). *Galaxy Formation and Evolution*. Cambridge.
3. Kennicutt, R. C. (1998). The Global Schmidt Law in Star-forming Galaxies. *ApJ*, 498, 541.
4. Navarro, J. F., Frenk, C. S., & White, S. D. M. (1996). The Structure of Cold Dark Matter Halos. *ApJ*, 462, 563.
5. Bell, E. F. et al. (2003). Stellar Mass-to-Light Ratios and the Tully-Fisher Relation. *ApJS*, 149, 289.
6. Lilly, S. J. et al. (2013). Gas Regulation of Galaxies: The Evolution of the Cosmic Specific Star Formation Rate. *ApJ*, 772, 119.
7. SPARC database: [astroweb.cwru.edu/SPARC](http://astroweb.cwru.edu/SPARC/)
8. Behroozi, P. et al. (2019). UNIVERSEMACHINE: The correlation between galaxy growth and dark matter halo assembly. *MNRAS*, 488, 3143.

---

*Document maintained as part of Cosmic Playground NSF IUSE Level 2 grant.*
