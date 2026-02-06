# Product Requirements Document: Cosmology Demo Suite

**Version:** 1.0
**Author:** Dr. Anna Rosen / Claude
**Date:** February 5, 2026
**Status:** Draft
**Project:** Cosmic Playground (NSF IUSE Level 2)

---

## Executive Summary

This document specifies a **9-demo Cosmology Suite** that "builds a universe" one physical ingredient at a time—mirroring the pedagogical arc of the Stellar Structure Suite. Each demo follows the **Observable → Model → Inference** pattern: students measure something (even if simulated), learn the minimal model that explains it, then infer a cosmological parameter.

**One-sentence learning objective:** Cosmology is the science of measuring the universe's contents, geometry, and history using light that has traveled across cosmic time.

**Truth Contract:** This suite explicitly does NOT implement CAMB/CLASS-in-the-browser, full Boltzmann solvers, or N-body simulations. It uses pedagogical approximations, precomputed curves, and compressed likelihoods—and says so honestly.

---

## 1. Problem Statement

### The User Problem

Students learning cosmology often encounter:

1. **Equations without observables**: Friedmann equations appear as abstract math disconnected from measurements
2. **Black-box codes**: CAMB/CLASS produce power spectra without students understanding the physics
3. **Parameter-fitting without intuition**: Students run MCMC on CMB data without knowing why those parameters matter
4. **Conceptual gaps**: The distinction between comoving/proper distance, or why $D_A(z)$ turns over, remains mysterious

### Who Experiences This Problem

| Persona | Pain Point | Frequency |
|---------|------------|-----------|
| **Undergrad astronomy majors** | Cosmology lectures are equation-heavy without visual intuition | Every semester, ~30-50 per institution |
| **Graduate students** | Review courses assume familiarity with concepts never properly taught | Qualifier prep, first-year courses |
| **Instructors** | Lack interactive tools that don't require installing Python/CLASS | Every course offering |
| **Self-learners** | Popular cosmology books skip quantitative reasoning | Continuous |

### Cost of Not Solving

- Students memorize $H_0 = 70$ km/s/Mpc without understanding what $H(z)$ means
- No intuition for why BAO, SN Ia, and CMB constrain *different* combinations of parameters
- The "cosmic optical illusion" ($D_A$ turnover) remains a curiosity rather than a prediction
- Degeneracies feel like bugs rather than features of inference

---

## 2. Design Principles

### Observable → Model → Inference

Every demo follows this arc:

1. **Observable**: A quantity students can "measure" (wavelength shift, angular size, flux, correlation function bump)
2. **Model**: The minimal physics that predicts the observable (expansion, geometry, thermal history)
3. **Inference**: The parameter(s) students can extract from the observable

### Three Complexity Modes

| Mode | Audience | Math Level | Interaction |
|------|----------|------------|-------------|
| **Conceptual** | Intro astro, public | Minimal equations | Visual exploration, qualitative predictions |
| **Quantitative** | Astro majors | Core equations visible | Slider → compute → compare |
| **Advanced** | Upper-division, grad | Full derivations | Parameter fitting, likelihood surfaces |

### Honest Approximations

Where we use approximations or precomputed data, we say so explicitly. The suite teaches that *all* cosmology involves modeling assumptions.

---

## 3. Goals

| Goal | Success Metric |
|------|----------------|
| **G1:** Students understand expansion as coordinate stretching | >85% correctly distinguish proper vs comoving distance on assessment |
| **G2:** Students connect redshift to scale factor | >80% can derive $1+z = a_0/a_{\rm em}$ and explain physically |
| **G3:** Students understand distance measure distinctions | >70% correctly identify when to use $D_A$ vs $D_L$ vs $D_C$ |
| **G4:** Students grasp energy budget evolution | >75% can sketch $\Omega_i(z)$ for matter, radiation, $\Lambda$ |
| **G5:** Students understand BAO as a standard ruler | >80% can explain why BAO measures distances differently than SN |
| **G6:** Students experience cosmological inference | >70% can explain why combining probes breaks degeneracies |

### Technical Goals

| Goal | Metric |
|------|--------|
| **T1:** Performance | All demos render at 60 fps; integrals compute in <100ms |
| **T2:** Numerical accuracy | Distances match CLASS/astropy to <1% for standard $\Lambda$CDM |
| **T3:** Determinism | Identical parameters → identical outputs |

---

## 4. Non-Goals (Explicit Scope Boundaries)

| Non-Goal | Rationale | Honest Alternative |
|----------|-----------|-------------------|
| **Full CMB $C_\ell$ computation** | Requires Boltzmann solver (CAMB/CLASS territory) | Compressed CMB likelihood; precomputed templates |
| **Full recombination solver** | HyRec/CosmoRec complexity | Pedagogical fits; Saha approximation + correction |
| **Real N-body cosmic web** | $O(N^2)$ or tree codes, memory-intensive | Linear growth factor; toy 2D density field |
| **Radiative transfer / reionization** | Graduate research topic | Conceptual discussion; $\tau$ as single parameter |
| **Inflation / primordial perturbations** | Requires field theory | Brief mention; assume scale-invariant $P(k)$ |
| **Neutrino mass effects (detailed)** | Requires transfer functions | Simple suppression toggle |

**UI Requirement:** Each demo includes a "What This Demo Computes vs. What's Real" panel.

---

## 5. Demo Specifications

### Demo 1: Scale Factor Playground — "Expansion as a Map"

**Primary Observable:** Changing separation of comoving points
**Students Earn:** Intuition for proper vs comoving; what "expansion of space" actually means

#### Physics Model

**Proper distance from comoving distance:**
$$d_{\rm proper}(t) = a(t) \cdot \chi$$

where $\chi$ is the comoving coordinate (constant for objects moving with the Hubble flow) and $a(t)$ is the scale factor.

**Scale factor evolution (matter-dominated):**
$$a(t) \propto t^{2/3}$$

**Scale factor evolution (radiation-dominated):**
$$a(t) \propto t^{1/2}$$

**Scale factor evolution ($\Lambda$-dominated):**
$$a(t) \propto e^{Ht}$$

#### Controls

| Control | Range | Default |
|---------|-------|---------|
| Cosmology preset | Radiation / Matter / $\Lambda$ / Mixed | Matter |
| Time slider | $t/t_0 \in [0.01, 2]$ | 1.0 |
| "Attach ruler" toggle | Proper distance visualization | Off |
| "Attach grid" toggle | Comoving coordinate grid | On |
| "Gravity-bound region" toggle | Shows local regions that don't expand | Off |

#### Visuals

- Galaxies on an expanding grid
- Proper distances grow; comoving coordinates stay fixed
- Optional: "gravity-bound" cluster that maintains fixed proper size

#### Concept Check (Built-in)

> "Do bound systems (like galaxies or the Solar System) expand with the universe?"

Toggle reveals: gravitationally bound systems decouple from Hubble flow.

#### Outputs

- $a(t)$ curve
- Proper distance vs time for selected galaxy pair
- Hubble parameter $H(t) = \dot{a}/a$

---

### Demo 2: Redshift — "Light as a Stretchy Tape Measure"

**Primary Observable:** Spectral line shift / wavelength stretch
**Students Earn:** Why $1+z = 1/a$ and the difference between Doppler and cosmological redshift

#### Physics Model

**Cosmological redshift:**
$$1 + z = \frac{\lambda_{\rm obs}}{\lambda_{\rm em}} = \frac{a(t_0)}{a(t_{\rm em})}$$

Setting $a(t_0) = 1$ (today):
$$1 + z = \frac{1}{a(t_{\rm em})}$$

**Key insight:** The wavelength stretches by the same factor as space itself.

**Lookback time:**
$$t_{\rm lookback} = t_0 - t_{\rm em} = \int_0^z \frac{dz'}{(1+z')H(z')}$$

#### Controls

| Control | Range | Default |
|---------|-------|---------|
| Emission redshift $z_{\rm em}$ | 0.01 – 10 | 1.0 |
| Cosmology | $(\Omega_m, \Omega_\Lambda, H_0)$ | Planck 2018 |
| Spectral line | H$\alpha$, Ly$\alpha$, [O III], custom | H$\alpha$ |

#### Visuals

- Photon worldline on spacetime diagram
- Wavecrests drawn along worldline; animate stretching
- Rest vs observed spectrum comparison

#### Outputs

- Redshift $z$
- Scale factor at emission $a(t_{\rm em})$
- Lookback time
- Light travel distance

#### Pedagogical Highlight

Side-by-side comparison: Doppler shift (source moving through space) vs cosmological redshift (space itself expanding). Same math, different physics.

---

### Demo 3: Distance Zoo — "Ladder of Cosmological Distances"

**Primary Observable:** Flux, angular size, redshift
**Students Earn:** The distinction between $D_A$, $D_L$, $D_C$, and why students hate them

#### Physics Model

**Comoving distance:**
$$D_C(z) = c \int_0^z \frac{dz'}{H(z')}$$

**Angular diameter distance:**
$$D_A(z) = \frac{D_C(z)}{1+z}$$

**Luminosity distance:**
$$D_L(z) = (1+z) \cdot D_C(z) = (1+z)^2 \cdot D_A(z)$$

**Distance modulus:**
$$\mu = 5 \log_{10}\left(\frac{D_L}{\rm 10\,pc}\right) = 5 \log_{10}(D_L/{\rm Mpc}) + 25$$

**Etherington reciprocity:**
$$D_L = (1+z)^2 D_A$$

#### Controls

| Control | Range | Default |
|---------|-------|---------|
| $H_0$ | 50 – 100 km/s/Mpc | 70 |
| $\Omega_m$ | 0 – 1 | 0.3 |
| $\Omega_\Lambda$ | 0 – 1 | 0.7 |
| $\Omega_k$ | $-0.1$ – 0.1 | 0 |
| $w$ (dark energy EOS) | $-2$ – 0 | $-1$ |
| Object intrinsic size | 1 – 100 kpc | 10 kpc |
| Object intrinsic luminosity | $10^{10}$ – $10^{12}$ $L_\odot$ | $10^{11}$ $L_\odot$ |

#### Visuals

**Panel A — Angular Size vs Redshift:**
- Same physical object shown at increasing $z$
- Angular size $\theta = d_{\rm phys}/D_A(z)$
- **Pedagogical kill-shot:** $D_A(z)$ peaks and turns over (the "cosmic optical illusion")

**Panel B — Flux vs Redshift:**
- Same luminosity source at increasing $z$
- Flux $F = L/(4\pi D_L^2)$

**Panel C — Distance Comparison:**
- All four distances on same plot: $D_C(z)$, $D_A(z)$, $D_L(z)$, light-travel distance

#### Outputs

- Table: $z$, $D_C$, $D_A$, $D_L$, $\mu$, lookback time, age at $z$
- Downloadable CSV

#### Key Insight Box

> "At $z \approx 1.6$, angular diameter distance reaches a maximum. Objects beyond this redshift appear *larger* on the sky than closer objects of the same physical size. This is not an illusion—it's geometry."

---

### Demo 4: Friedmann Engine — "What's the Universe Made Of?"

**Primary Observable:** $H(z)$ (expansion rate vs redshift)
**Students Earn:** How different components dominate at different epochs

This is the suite's "EOS Lab" analog—the thermodynamic engine of the universe.

#### Physics Model

**Friedmann equation:**
$$H^2(z) = H_0^2 \left[ \Omega_r (1+z)^4 + \Omega_m (1+z)^3 + \Omega_k (1+z)^2 + \Omega_\Lambda (1+z)^{3(1+w)} \right]$$

**Dimensionless Hubble parameter:**
$$E(z) \equiv \frac{H(z)}{H_0} = \sqrt{\Omega_r (1+z)^4 + \Omega_m (1+z)^3 + \Omega_k (1+z)^2 + \Omega_{\rm DE}(z)}$$

**Dark energy with equation of state $w$:**
$$\Omega_{\rm DE}(z) = \Omega_\Lambda (1+z)^{3(1+w)}$$

For $w = -1$ (cosmological constant): $\Omega_{\rm DE}(z) = \Omega_\Lambda$

**Age of universe:**
$$t_0 = \int_0^\infty \frac{dz}{(1+z)H(z)} = \frac{1}{H_0} \int_0^\infty \frac{dz}{(1+z)E(z)}$$

**Particle horizon:**
$$d_H(t) = a(t) \int_0^t \frac{c \, dt'}{a(t')}$$

#### Controls

| Control | Range | Default | Notes |
|---------|-------|---------|-------|
| $\Omega_r$ | 0 – 0.01 | $9 \times 10^{-5}$ | Radiation (CMB + neutrinos) |
| $\Omega_m$ | 0 – 1.5 | 0.31 | Total matter |
| $\Omega_\Lambda$ | 0 – 1.5 | 0.69 | Dark energy |
| $\Omega_k$ | Auto | $1 - \Omega_r - \Omega_m - \Omega_\Lambda$ | Curvature (derived) |
| $w$ | $-2$ – 0 | $-1$ | Dark energy EOS |
| $H_0$ | 50 – 100 | 70 | km/s/Mpc |

#### Visuals

**Panel A — Energy Budget vs Redshift:**
- Stacked area plot: $\Omega_i(z) = \Omega_{i,0}(1+z)^{n_i} / E^2(z)$
- Clear epochs: radiation → matter → dark energy domination
- Vertical lines marking equality redshifts

**Panel B — Expansion Rate:**
- $H(z)$ curve
- $E(z) = H(z)/H_0$ normalized curve
- Deceleration parameter $q(z) = -1 + (1+z) \frac{d \ln E}{dz}$

**Panel C — Cosmic Timeline:**
- Age of universe $t_0$
- Lookback time vs $z$
- Key epochs marked (equality, recombination, reionization, today)

#### Outputs

- Matter-radiation equality: $z_{\rm eq}$, $t_{\rm eq}$
- Matter-$\Lambda$ equality: $z_{\Lambda}$
- Age of universe: $t_0$
- Deceleration → acceleration transition: $z_{\rm acc}$

#### Presets

| Preset | Parameters | Teaches |
|--------|------------|---------|
| Einstein-de Sitter | $\Omega_m = 1$, $\Omega_\Lambda = 0$ | Matter-only universe |
| Open Universe | $\Omega_m = 0.3$, $\Omega_k = 0.7$ | Negative curvature |
| Closed Universe | $\Omega_m = 1.5$, $\Omega_k = -0.5$ | Positive curvature, recollapse |
| Planck 2018 | Best-fit values | Current concordance |
| Phantom Dark Energy | $w = -1.5$ | "Big Rip" scenario |

---

### Demo 5: Hot Big Bang Thermostat — "Thermal History"

**Primary Observable:** Temperature vs redshift, relic backgrounds
**Students Earn:** Why the early universe is a thermal plasma and what "relic" means

#### Physics Model

**CMB temperature evolution:**
$$T(z) = T_0 (1+z)$$

where $T_0 = 2.725$ K today.

**Energy density scaling:**

Radiation:
$$\rho_r \propto a^{-4} \propto (1+z)^4$$

Matter:
$$\rho_m \propto a^{-3} \propto (1+z)^3$$

**Photon energy density:**
$$\rho_\gamma = \frac{\pi^2}{15} \frac{(k_B T)^4}{(\hbar c)^3} = a_{\rm rad} T^4$$

where $a_{\rm rad} = 7.566 \times 10^{-16}$ J m$^{-3}$ K$^{-4}$.

**Matter-radiation equality:**
$$z_{\rm eq} = \frac{\Omega_m}{\Omega_r} - 1 \approx 3400$$

**Baryon-to-photon ratio:**
$$\eta = \frac{n_b}{n_\gamma} \approx 6 \times 10^{-10}$$

#### Controls

| Control | Range | Default | Notes |
|---------|-------|---------|-------|
| $T_0$ | 2.7 – 2.8 K | 2.725 K | CMB temperature today |
| $\Omega_m h^2$ | 0.1 – 0.2 | 0.142 | Physical matter density |
| $\Omega_b h^2$ | 0.01 – 0.03 | 0.0224 | Physical baryon density (Advanced) |
| $N_{\rm eff}$ | 2 – 4 | 3.046 | Effective neutrino species (Advanced) |

#### Visuals

**Panel A — Temperature History:**
- $T(z)$ on log-log scale
- Key temperature thresholds marked:
  - $T \sim 10^{10}$ K: neutrino decoupling
  - $T \sim 10^9$ K: BBN
  - $T \sim 3000$ K: recombination
  - $T \sim 2.7$ K: today

**Panel B — Energy Density Evolution:**
- $\rho_r(z)$ and $\rho_m(z)$ crossing at equality
- $\rho_\Lambda$ (constant) for comparison

**Panel C — Cosmic Eras (Conceptual Timeline):**
- Visual "story mode": Planck → inflation → reheating → BBN → recombination → dark ages → reionization → structure formation → today

#### Outputs

- $z_{\rm eq}$: matter-radiation equality
- $T_{\rm eq}$: temperature at equality
- Age at equality

#### Pedagogical Focus

The point is **scaling laws and eras**, not detailed microphysics. Students should leave knowing:
- Why $\rho_r \propto a^{-4}$ (energy + number density dilution)
- Why $\rho_m \propto a^{-3}$ (number density dilution only)
- What "relic" means (frozen-out species that decoupled from thermal equilibrium)

---

### Demo 6: Recombination & CMB — "Last Scattering Factory"

**Primary Observable:** The CMB "surface of last scattering" and optical depth
**Students Earn:** Why the CMB exists, why it's uniform-ish, and why it's not perfectly uniform

#### Physics Model

**Saha equation (ionization equilibrium):**
$$\frac{n_e n_p}{n_H} = \left(\frac{m_e k_B T}{2\pi\hbar^2}\right)^{3/2} e^{-E_I/(k_B T)}$$

where $E_I = 13.6$ eV is the hydrogen ionization energy.

**Ionization fraction:**
$$x_e \equiv \frac{n_e}{n_H + n_p} = \frac{n_e}{n_b}$$

**Pedagogical fit (Peebles approximation):**
$$x_e(z) \approx \frac{1}{1 + \exp[(z - z_*)/\Delta z]}$$

with $z_* \approx 1090$, $\Delta z \approx 80$ (width of recombination).

**Optical depth:**
$$\tau(z) = \int_0^z n_e(z') \sigma_T \frac{c \, dz'}{H(z')(1+z')^2}$$

**Visibility function:**
$$g(z) = -\frac{d\tau}{dz} e^{-\tau(z)}$$

The visibility function peaks sharply at recombination—this is the "surface of last scattering."

**Mean free path:**
$$\lambda_{\rm mfp} = \frac{1}{n_e \sigma_T}$$

**Sound horizon at decoupling:**
$$r_s(z_*) = \int_{z_*}^\infty \frac{c_s(z)}{H(z)} dz$$

where $c_s = c/\sqrt{3(1+R)}$ and $R = 3\rho_b/(4\rho_\gamma)$.

#### Controls

| Control | Range | Default | Notes |
|---------|-------|---------|-------|
| $\Omega_b h^2$ | 0.01 – 0.03 | 0.0224 | Affects recombination timing |
| $\Omega_m h^2$ | 0.1 – 0.2 | 0.142 | Affects expansion rate |
| Helium fraction $Y_p$ | 0.2 – 0.3 | 0.245 | Advanced |

#### Visuals

**Panel A — Ionization History:**
- $x_e(z)$ dropping from 1 to $\sim 10^{-4}$
- Recombination epoch highlighted

**Panel B — Visibility Function:**
- $g(z)$ peaked at $z_* \approx 1090$
- Width $\Delta z \approx 80$ (thickness of last scattering)

**Panel C — "Fog Clears" Animation:**
- Mean free path $\lambda_{\rm mfp}(z)$ jumping at recombination
- Visual: photons transitioning from "trapped" to "free-streaming"

**Panel D — Sound Horizon:**
- $r_s(z)$ growing and then freezing at $z_*$
- Connection to BAO demo

#### Outputs

- Recombination redshift $z_*$
- Temperature at recombination $T_*$
- Thickness of last scattering $\Delta z$
- Sound horizon $r_s(z_*)$
- Optical depth to recombination $\tau(z_*)$

#### Non-Goal (Explicit)

This demo does NOT compute:
- Full recombination kinetics (HyRec/CosmoRec)
- CMB anisotropies $C_\ell$
- Detailed helium recombination

Instead: pedagogical fits and precomputed curves with honest labeling.

---

### Demo 7: BAO — "Acoustic Ruler Lab"

**Primary Observable:** The BAO bump in the correlation function / wiggles in $P(k)$
**Students Earn:** BAO is a fossil sound wave; its radius is set by early-universe physics, and its observed angular/redshift scale measures cosmic distances

This is the cosmology suite's "Lane-Emden moment"—where a messy topic becomes structurally inevitable.

#### Physics Model

**Sound speed in photon-baryon fluid:**
$$c_s(z) = \frac{c}{\sqrt{3(1+R)}}$$

where:
$$R \equiv \frac{3\rho_b}{4\rho_\gamma} = \frac{3\Omega_b}{4\Omega_\gamma}(1+z)^{-1}$$

**Sound horizon (the BAO ruler):**
$$r_s(z) = \int_z^\infty \frac{c_s(z')}{H(z')} dz'$$

At the drag epoch $z_d$ (when baryons decouple from photon drag):
$$r_d \equiv r_s(z_d) \approx 147 \text{ Mpc (comoving)}$$

**Drag epoch (fitting formula):**
$$z_d \approx 1060 \left(\frac{\Omega_m h^2}{0.14}\right)^{0.25} \left(\frac{\Omega_b h^2}{0.024}\right)^{-0.08}$$

**BAO observables:**

Transverse (angular):
$$\theta_{\rm BAO} = \frac{r_d}{D_A(z)}$$

Radial (redshift space):
$$\Delta z_{\rm BAO} = \frac{r_d H(z)}{c}$$

Volume-averaged:
$$D_V(z) = \left[ D_A^2(z) \frac{cz}{H(z)} \right]^{1/3}$$

#### Three-Panel UI

**Panel A — Early Universe Acoustic Wave:**

1D radial view of overdensity $\delta(r, z)$ vs radius:
- Component toggles: photons, baryons, CDM (dark matter stays at center)
- Time slider in redshift
- Sound wave shell expanding at $c_s$
- Overlay lines:
  - $z_*$: recombination (photons decouple)
  - $z_d$: drag epoch (baryons stop feeling photon drag; BAO ruler set)

**Pedagogical gold:** Students learn recombination and drag epoch are related but not identical.

**Panel B — Sound Horizon Growth:**

- $r_s(z)$ growing and then saturating at $z_d$
- Controls: $\Omega_b h^2$, $\Omega_m h^2$ (optional: $N_{\rm eff}$)
- Immediate insight:
  - More baryons → lower $c_s$ → smaller $r_s$
  - Different expansion rate → different distance traveled before freeze-out

**Panel C — Late-Time Imprint:**

- Galaxy correlation function $\xi(r)$ with bump at $r \sim r_d$
- Or power spectrum $P(k)$ with wiggles
- Toggle: "no-wiggle" vs "with BAO" (students see what BAO adds)

#### Controls

| Control | Range | Default | Notes |
|---------|-------|---------|-------|
| $\Omega_b h^2$ | 0.01 – 0.03 | 0.0224 | Baryon density |
| $\Omega_m h^2$ | 0.1 – 0.2 | 0.142 | Matter density |
| $N_{\rm eff}$ | 2 – 4 | 3.046 | Neutrino species (Advanced) |
| Observation redshift $z_{\rm obs}$ | 0.1 – 2.5 | 0.5 | For BAO measurement |

#### Complexity Modes

**Conceptual:**
- Cartoon wave expansion
- Freeze at $z_*$ and $z_d$
- Show shell + central peak
- Show $\xi(r)$ bump appear

**Quantitative:**
- Compute $r_s$ from integral (numeric quadrature)
- Measure bump location from mock data
- Convert to distance constraint: $D_A(z)/r_d$, $H(z) r_d$

**Advanced:**
- Silk damping concept (qualitative)
- Compressed BAO likelihood overlay
- Show how BAO + SN + CMB break degeneracies

#### Outputs

- Sound horizon $r_d$ (Mpc comoving)
- Drag epoch $z_d$
- $D_A(z)/r_d$ constraint
- $D_V(z)/r_d$ constraint

#### Validation

- $r_d$ should match CLASS/CAMB to $<1\%$ for $\Lambda$CDM
- Mock correlation function bump should be at correct scale

---

### Demo 8: Structure Growth — "From Tiny Ripples to the Cosmic Web"

**Primary Observable:** Growth factor $D(z)$ / $\sigma_8$-style amplitude
**Students Earn:** The competition between gravity (growth) and expansion (suppression)

#### Physics Model

**Linear growth equation (sub-horizon, matter era):**
$$\ddot{\delta} + 2H\dot{\delta} - 4\pi G \bar{\rho}_m \delta = 0$$

In terms of $a$:
$$\frac{d^2 \delta}{d\ln a^2} + \left(2 + \frac{d\ln H}{d\ln a}\right) \frac{d\delta}{d\ln a} - \frac{3}{2}\Omega_m(a) \delta = 0$$

**Growth factor $D(a)$:**

Normalized so $D(a=1) = 1$ today. In matter domination: $D \propto a$.

**Growth rate:**
$$f(a) \equiv \frac{d\ln D}{d\ln a} \approx \Omega_m(a)^\gamma$$

where $\gamma \approx 0.55$ for $\Lambda$CDM (Linder approximation).

**$\sigma_8$ definition:**
$$\sigma_8 = \sigma(R = 8 h^{-1} \text{Mpc}) = D(z=0) \times \sigma_{8,\rm primordial}$$

**Pedagogical growth factor approximation:**
$$D(a) \approx \frac{5\Omega_m}{2} \frac{H(a)}{H_0} \int_0^a \frac{da'}{[a' H(a')/H_0]^3}$$

#### Controls

| Control | Range | Default | Notes |
|---------|-------|---------|-------|
| $\Omega_m$ | 0.1 – 0.5 | 0.31 | Matter density |
| $w$ | $-2$ – 0 | $-1$ | Dark energy EOS |
| Neutrino suppression | Toggle | Off | Advanced: shows $D(z)$ reduction |
| Normalization redshift | CMB ($z \sim 1100$) or today | CMB | |

#### Visuals

**Panel A — Linear Growth Factor:**
- $D(z)$ from $z = 1100$ to today
- Compare: matter-only vs $\Lambda$CDM vs $w$CDM
- Growth suppression in dark energy era visible

**Panel B — Growth Rate:**
- $f(z) = d\ln D/d\ln a$
- $f\sigma_8$ combination (what redshift surveys actually measure)

**Panel C — Toy 2D Density Field:**
- Gaussian random field whose contrast grows with $D(z)$
- Animation: watch cosmic web "sharpen" as $D$ grows
- Clear labeling: "This is LINEAR growth—real structure goes nonlinear"

#### Outputs

- $D(z)$ at selected redshifts
- $\sigma_8(z = 0)$ given CMB normalization
- Growth suppression factor (compared to matter-only universe)

#### Key Insight Box

> "If you normalize density fluctuations to the CMB amplitude at $z \sim 1100$, what do you predict for $\sigma_8$ today? This is a fundamental test of the growth rate—and it's in mild tension with some late-universe measurements."

#### Non-Goal (Explicit)

This demo does NOT compute:
- Nonlinear structure (requires N-body)
- Halo mass function
- Full transfer function $T(k)$

Instead: linear growth only, with honest labeling.

---

### Demo 9: Observational Probes Lab — "Cosmology is Inference"

**Primary Observable:** Data points with error bars
**Students Earn:** Cosmology is inference, and degeneracies are a feature, not a bug

This is the cosmology capstone—combining probes to constrain parameters.

#### Physics Model

**SN Ia distance modulus:**
$$\mu_{\rm SN}(z) = 5 \log_{10}\left(\frac{D_L(z)}{\rm 10\,pc}\right)$$

**BAO distance scale:**
$$\frac{D_V(z)}{r_d} \quad \text{or} \quad \frac{D_A(z)}{r_d}, \quad \frac{c}{H(z) r_d}$$

**CMB compressed likelihood (shift parameter):**
$$\mathcal{R} = \sqrt{\Omega_m H_0^2} \frac{D_A(z_*)}{c}$$

**Acoustic scale:**
$$\ell_A = \pi \frac{D_A(z_*)}{r_s(z_*)}$$

#### Data Sources

Use public-domain binned data or realistic mock data:

| Probe | Data | Parameters Constrained |
|-------|------|----------------------|
| **SN Ia** | Pantheon+ binned $\mu(z)$ | $\Omega_m$, $w$, $M$ (nuisance) |
| **BAO** | SDSS/DESI $D_V/r_d$, $D_A/r_d$, $H r_d$ | $\Omega_m h^2$, $\Omega_b h^2$, $H_0 r_d$ |
| **CMB** | Planck compressed $\mathcal{R}$, $\ell_A$, $\omega_b$ | $\Omega_m$, $H_0$, $\Omega_b h^2$ |

#### Controls

| Control | Range | Default |
|---------|-------|---------|
| $H_0$ | 50 – 100 | 70 |
| $\Omega_m$ | 0.1 – 0.5 | 0.3 |
| $\Omega_b h^2$ | 0.01 – 0.03 | 0.0224 |
| $w$ | $-2$ – 0 | $-1$ |
| Probe toggles | SN / BAO / CMB | All on |

#### Visuals

**Panel A — Data + Model Comparison:**
- For each enabled probe: data points with error bars + model curve
- Residuals below each

**Panel B — $\chi^2$ Dashboard:**
- Total $\chi^2$ and per-probe breakdown
- Real-time update as sliders move

**Panel C — Degeneracy Contours:**
- 2D likelihood surfaces in:
  - $(\Omega_m, H_0)$
  - $(\Omega_m, w)$
  - $(H_0, w)$
- Show how different probes have different orientations
- Combined contour shows how they break degeneracies

**Panel D — Best-Fit Summary:**
- Current parameter values
- $\chi^2_{\rm red}$
- Comparison to Planck/DES/DESI values

#### Complexity Modes

**Conceptual:**
- Pre-loaded parameter sets; toggle probes on/off
- See how contours change

**Quantitative:**
- Manual slider exploration
- Find best-fit by eye

**Advanced (Capstone Mode):**
- Grid search: sample parameter space, find minimum $\chi^2$
- Simple MCMC (Metropolis-Hastings) with chain visualization
- Export: JSON state + best-fit + posterior samples

#### Outputs

- Best-fit parameters
- $\chi^2$ per probe and total
- Confidence regions (1$\sigma$, 2$\sigma$)
- Exportable: JSON + plot-ready arrays

#### "Fit the Universe" Capstone Flow

1. **Choose probes:** SN only → SN+BAO → SN+BAO+CMB
2. **Run inference:** Grid search (fast) or MCMC (Advanced)
3. **Report results:** Best-fit + confidence intervals
4. **Compare:** How does your fit compare to Planck 2018?

#### Key Insight Box

> "Each probe constrains a *combination* of parameters—not individual values. Combining probes works because they have different degeneracy directions. This is why we need multiple messengers to measure the universe."

---

## 6. User Stories & Acceptance Criteria

### Story 1: Expansion Intuition (Demo 1)

> **As a** student encountering cosmology for the first time,
> **I want to** see galaxies move apart on an expanding grid,
> **so that** I understand the difference between "expansion of space" and "galaxies moving through space."

**Acceptance Criteria:**
- [ ] Grid of galaxies with adjustable scale factor $a(t)$
- [ ] "Attach ruler" shows proper distance growing
- [ ] "Attach grid" shows comoving coordinates fixed
- [ ] Bound region toggle shows gravitationally bound systems don't expand
- [ ] Cosmology presets (radiation/matter/$\Lambda$/mixed)

### Story 2: Redshift Derivation (Demo 2)

> **As a** student learning about cosmological redshift,
> **I want to** see photon wavelengths stretch as space expands,
> **so that** I can derive $1+z = 1/a$ from first principles.

**Acceptance Criteria:**
- [ ] Photon worldline on spacetime diagram
- [ ] Wavecrests visibly stretch during transit
- [ ] Comparison: Doppler vs cosmological redshift
- [ ] Output: $z$, $a(t_{\rm em})$, lookback time

### Story 3: Distance Measure Confusion (Demo 3)

> **As a** student confused by multiple distance definitions,
> **I want to** see the same object's angular size and flux vs redshift,
> **so that** I understand why $D_A$, $D_L$, and $D_C$ are different.

**Acceptance Criteria:**
- [ ] Angular size vs $z$ showing $D_A$ turnover (the "cosmic optical illusion")
- [ ] Flux vs $z$ showing $D_L^{-2}$ dilution
- [ ] All distance measures plotted together
- [ ] Cosmology parameter sliders affect curves

### Story 4: Energy Budget (Demo 4)

> **As a** student learning the Friedmann equation,
> **I want to** see how radiation, matter, and dark energy trade dominance,
> **so that** I understand why the universe has different "eras."

**Acceptance Criteria:**
- [ ] Stacked $\Omega_i(z)$ plot
- [ ] $H(z)$ curve with correct scaling in each era
- [ ] Age of universe and lookback time outputs
- [ ] Presets for different cosmologies (EdS, open, closed, Planck)

### Story 5: Thermal History (Demo 5)

> **As a** student learning about the early universe,
> **I want to** see temperature and density scale with redshift,
> **so that** I understand why the early universe was hot and dense.

**Acceptance Criteria:**
- [ ] $T(z) = T_0(1+z)$ curve
- [ ] $\rho_r \propto (1+z)^4$, $\rho_m \propto (1+z)^3$ crossover
- [ ] Key epochs marked (BBN, recombination, equality)
- [ ] Conceptual timeline of cosmic history

### Story 6: Recombination Understanding (Demo 6)

> **As a** student learning about the CMB,
> **I want to** see why photons suddenly "escape" at recombination,
> **so that** I understand what the "surface of last scattering" means.

**Acceptance Criteria:**
- [ ] $x_e(z)$ ionization fraction dropping
- [ ] Visibility function $g(z)$ peaked at $z_*$
- [ ] "Fog clears" animation as mean free path jumps
- [ ] Sound horizon $r_s$ output (connection to BAO)

### Story 7: BAO Physical Origin (Demo 7)

> **As a** student learning about BAO,
> **I want to** see the acoustic wave expand and freeze,
> **so that** I understand why there's a "bump" in galaxy clustering.

**Acceptance Criteria:**
- [ ] Acoustic wave animation showing shell expansion
- [ ] Sound horizon $r_s(z)$ integral visualized
- [ ] Correlation function $\xi(r)$ with BAO bump
- [ ] Toggle: with/without BAO wiggles
- [ ] Distance constraint outputs: $D_A/r_d$, $D_V/r_d$

### Story 8: Growth vs Expansion (Demo 8)

> **As a** student learning about structure formation,
> **I want to** see how density perturbations grow over time,
> **so that** I understand the competition between gravity and expansion.

**Acceptance Criteria:**
- [ ] Linear growth factor $D(z)$ curve
- [ ] Comparison: matter-only vs $\Lambda$CDM
- [ ] Toy 2D density field with growing contrast
- [ ] Honest labeling: "This is linear growth only"

### Story 9: Parameter Inference (Demo 9)

> **As a** student learning cosmological inference,
> **I want to** fit parameters to real (binned) data from SN, BAO, and CMB,
> **so that** I understand how cosmologists measure the universe.

**Acceptance Criteria:**
- [ ] Toggleable mock datasets (SN, BAO, CMB)
- [ ] Live $\chi^2$ update as parameters change
- [ ] Degeneracy contours in 2D parameter planes
- [ ] Capstone mode: grid search or simple MCMC
- [ ] Export: JSON + best-fit + confidence regions

### Story 10: Honest Approximations (All Demos)

> **As a** student who should understand limitations,
> **I want to** see what each demo computes vs approximates,
> **so that** I don't over-interpret the results.

**Acceptance Criteria:**
- [ ] Each demo has "What This Demo Shows vs Reality" panel
- [ ] Approximations explicitly labeled
- [ ] References to full methods (CAMB/CLASS) provided

---

## 7. Requirements

### Must-Have (P0)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P0-1** | Scale factor evolution | $a(t)$ presets for radiation/matter/$\Lambda$; proper vs comoving visualization |
| **P0-2** | Redshift computation | $1+z = 1/a$ with wavelength stretch animation |
| **P0-3** | Distance measures | $D_C$, $D_A$, $D_L$, $\mu$ computed correctly; match astropy to <1% |
| **P0-4** | Friedmann engine | $E(z) = H(z)/H_0$ for arbitrary $\Omega_i$, $w$ |
| **P0-5** | Thermal history | $T(z)$, density scaling, equality redshifts |
| **P0-6** | Recombination basics | $x_e(z)$ fit, visibility function, $z_*$ output |
| **P0-7** | Sound horizon integral | $r_s(z_d)$ from numeric quadrature; match CLASS to <1% |
| **P0-8** | Linear growth factor | $D(z)$ from ODE or approximation |
| **P0-9** | SN likelihood | $\chi^2$ from distance modulus residuals |
| **P0-10** | Combined inference | Parameter sliders with live $\chi^2$; at least 2 probes |
| **P0-11** | Numerical accuracy | All distances match CLASS/astropy to <1% for $\Lambda$CDM |
| **P0-12** | Performance | All demos at 60 fps; integrals <100ms |

### Should-Have (P1)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P1-1** | BAO correlation function | $\xi(r)$ with bump from template or toy model |
| **P1-2** | BAO power spectrum | $P(k)$ with wiggles (precomputed template) |
| **P1-3** | Degeneracy contours | 2D likelihood surfaces for parameter pairs |
| **P1-4** | Grid search inference | Sample $(\Omega_m, H_0, w)$ grid, find minimum $\chi^2$ |
| **P1-5** | CMB compressed likelihood | $\mathcal{R}$, $\ell_A$ constraints |
| **P1-6** | 2D density field animation | Toy Gaussian field with $D(z)$ contrast |
| **P1-7** | Honesty panels | Each demo explains approximations |
| **P1-8** | Export functionality | JSON state + CSV outputs |

### Could-Have (P2)

| ID | Requirement | Rationale |
|----|-------------|-----------|
| **P2-1** | Simple MCMC | Metropolis-Hastings with chain visualization |
| **P2-2** | Neutrino suppression toggle | Shows $D(z)$ reduction from massive neutrinos |
| **P2-3** | $w_0$-$w_a$ parameterization | Time-varying dark energy EOS |
| **P2-4** | Planck 2018 contours overlay | Compare student fit to official results |
| **P2-5** | Curvature visualization | Embedding diagrams for $\Omega_k \neq 0$ |
| **P2-6** | Silk damping concept | Qualitative in BAO demo |

---

## 8. Technical Architecture

### 8.1 Shared Cosmology Core Package

```
packages/cosmology/
├── background/
│   ├── friedmann.ts          # E(z), H(z), age integrals
│   ├── scaleFactor.ts        # a(t) for various cosmologies
│   └── horizons.ts           # Particle horizon, event horizon
├── distances/
│   ├── comoving.ts           # D_C(z) integral
│   ├── angular.ts            # D_A(z) = D_C/(1+z)
│   ├── luminosity.ts         # D_L(z) = D_C(1+z)
│   └── modulus.ts            # μ = 5 log10(D_L/10pc)
├── thermal/
│   ├── temperature.ts        # T(z) = T_0(1+z)
│   ├── equality.ts           # z_eq, z_Λ
│   └── recombination.ts      # x_e(z), g(z), z_* fits
├── bao/
│   ├── soundSpeed.ts         # c_s(z)
│   ├── soundHorizon.ts       # r_s(z) integral
│   ├── dragEpoch.ts          # z_d fitting formula
│   └── observables.ts        # D_V/r_d, θ_BAO, Δz_BAO
├── growth/
│   ├── linearGrowth.ts       # D(z) ODE solver
│   ├── growthRate.ts         # f(z) = dln D/dln a
│   └── sigma8.ts             # σ_8 normalization
├── probes/
│   ├── snLikelihood.ts       # χ² from SN Ia distance modulus
│   ├── baoLikelihood.ts      # χ² from BAO constraints
│   ├── cmbCompressed.ts      # R, ℓ_A compressed likelihood
│   └── combined.ts           # Total χ², joint fitting
├── integration/
│   ├── quadrature.ts         # Simpson's rule, Romberg
│   ├── odeIntegrator.ts      # RK4 for growth equation
│   └── gridSearch.ts         # Parameter grid sampling
├── validation/
│   ├── classComparison.ts    # Regression tests vs CLASS
│   ├── analyticLimits.ts     # EdS, matter-only limits
│   └── consistency.ts        # Cross-checks between modules
└── types.ts                  # Shared interfaces
```

### 8.2 Core Interfaces

```typescript
interface CosmologyParams {
  H0: number;           // km/s/Mpc
  Omega_r: number;      // radiation
  Omega_m: number;      // total matter
  Omega_b: number;      // baryons (Omega_b h^2 derived)
  Omega_Lambda: number; // dark energy
  Omega_k: number;      // curvature (derived: 1 - sum)
  w: number;            // dark energy EOS (default -1)
  T_cmb: number;        // CMB temperature today (K)
  N_eff: number;        // effective neutrino species
}

interface BackgroundState {
  z: number;
  a: number;
  H: number;            // km/s/Mpc
  E: number;            // H/H0
  t: number;            // age at z (Gyr)
  t_lookback: number;   // lookback time (Gyr)
  Omega_r_z: number;    // Ω_r(z)
  Omega_m_z: number;    // Ω_m(z)
  Omega_Lambda_z: number;
  Omega_k_z: number;
}

interface DistanceResult {
  z: number;
  D_C: number;          // comoving distance (Mpc)
  D_A: number;          // angular diameter distance (Mpc)
  D_L: number;          // luminosity distance (Mpc)
  D_H: number;          // Hubble distance c/H(z) (Mpc)
  mu: number;           // distance modulus
}

interface BAOResult {
  z_d: number;          // drag epoch
  r_d: number;          // sound horizon at drag (Mpc)
  c_s_avg: number;      // average sound speed
  theta_BAO: number;    // angular scale (radians)
  D_V_over_rd: number;  // volume distance / r_d
  D_A_over_rd: number;  // angular distance / r_d
  H_rd: number;         // H(z) × r_d
}

interface GrowthResult {
  z: number;
  D: number;            // linear growth factor
  f: number;            // growth rate f = dln D / dln a
  sigma8: number;       // σ_8(z) if normalized
}

interface InferenceResult {
  params: CosmologyParams;
  chi2_total: number;
  chi2_SN: number;
  chi2_BAO: number;
  chi2_CMB: number;
  dof: number;
  chi2_red: number;
}
```

### 8.3 Key Implementations

#### Friedmann Engine

```typescript
function E(z: number, params: CosmologyParams): number {
  const { Omega_r, Omega_m, Omega_k, Omega_Lambda, w } = params;
  const zp1 = 1 + z;
  return Math.sqrt(
    Omega_r * zp1**4 +
    Omega_m * zp1**3 +
    Omega_k * zp1**2 +
    Omega_Lambda * zp1**(3 * (1 + w))
  );
}

function H(z: number, params: CosmologyParams): number {
  return params.H0 * E(z, params);
}
```

#### Comoving Distance Integral

```typescript
function D_C(z: number, params: CosmologyParams): number {
  // D_C = c ∫₀^z dz'/H(z')
  const c_km_s = 299792.458; // km/s

  const integrand = (zp: number) => 1 / H(zp, params);
  return c_km_s * integrate(integrand, 0, z, { method: 'simpson' });
}
```

#### Sound Horizon Integral

```typescript
function soundHorizon(z: number, params: CosmologyParams): number {
  // r_s(z) = ∫_z^∞ c_s(z')/H(z') dz'
  const c = 299792.458; // km/s

  const R = (zp: number) => {
    // R = 3ρ_b / 4ρ_γ
    const Omega_gamma = params.Omega_r / (1 + 0.2271 * params.N_eff);
    return (3 * params.Omega_b) / (4 * Omega_gamma) / (1 + zp);
  };

  const c_s = (zp: number) => c / Math.sqrt(3 * (1 + R(zp)));

  const integrand = (zp: number) => c_s(zp) / H(zp, params);

  // Integrate from z to z_max (effectively infinity)
  const z_max = 1e6;
  return integrate(integrand, z, z_max, { method: 'romberg' });
}
```

#### Linear Growth ODE

```typescript
function solveGrowthFactor(
  z_array: number[],
  params: CosmologyParams
): GrowthResult[] {
  // Solve: D'' + (2 + d ln H / d ln a) D' - (3/2) Ω_m(a) D = 0
  // in terms of ln(a)

  const results: GrowthResult[] = [];

  // Initial conditions deep in matter era
  const a_init = 1e-4;
  const D_init = a_init;  // D ∝ a in matter era
  const dD_dlna_init = a_init;

  // RK4 integration
  // ... (implementation)

  // Normalize to D(z=0) = 1
  const D_0 = results.find(r => r.z === 0)?.D || 1;
  return results.map(r => ({ ...r, D: r.D / D_0 }));
}
```

### 8.4 Precomputed Data

For quantities that would require Boltzmann solvers:

```typescript
// Precomputed templates (from CLASS)
import P_k_template from './data/pk_template_planck2018.json';
import xi_r_template from './data/xi_template_planck2018.json';
import recomb_xe from './data/recombination_xe_planck2018.json';

// These templates can be scaled/interpolated for different cosmologies
// within ~10% of Planck parameters
```

---

## 9. Validation Tests

### 9.1 Distance Accuracy

**Test:** Compare $D_C$, $D_A$, $D_L$ against astropy.cosmology for Planck 2018 parameters.

**Pass criteria:** <1% relative error for $z \in [0, 10]$

### 9.2 Sound Horizon Accuracy

**Test:** Compare $r_d$ against CLASS for Planck 2018.

**Pass criteria:** <1% relative error ($r_d \approx 147$ Mpc)

### 9.3 Growth Factor Accuracy

**Test:** Compare $D(z)$ against CLASS linear growth output.

**Pass criteria:** <2% relative error for $z \in [0, 100]$

### 9.4 Analytic Limits

**Test:** Einstein-de Sitter universe ($\Omega_m = 1$):
- $D_C = \frac{2c}{H_0}(1 - 1/\sqrt{1+z})$
- $D \propto a$
- $t_0 = 2/(3H_0)$

**Pass criteria:** Exact match to analytic formulae

### 9.5 Inference Sanity

**Test:** Fit Planck 2018 mock data with known parameters.

**Pass criteria:** Recovered parameters within 1σ of input

---

## 10. Demo Build Order

Recommended implementation sequence (highest leverage first):

| Phase | Demo | Why First |
|-------|------|-----------|
| **1** | Demo 1: Scale Factor | Foundation for everything; simplest |
| **2** | Demo 2: Redshift | Builds on scale factor; core concept |
| **3** | Demo 3: Distances | Uses $H(z)$ integrals; unlocks probes |
| **4** | Demo 4: Friedmann | The engine; needed by all subsequent |
| **5** | Demo 9: Probes Lab | Inference payoff; motivates students |
| **6** | Demo 6: Recombination | Needed for CMB/BAO context |
| **7** | Demo 7: BAO | Bridge between early and late universe |
| **8** | Demo 5: Thermal History | Completes early universe picture |
| **9** | Demo 8: Structure Growth | Adds growth; completes suite |

---

## 11. Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 1 week | Cosmology core: $E(z)$, distances, integrals |
| **Phase 2** | 1 week | Demos 1-3: Scale factor, redshift, distances |
| **Phase 3** | 1 week | Demo 4: Friedmann engine + presets |
| **Phase 4** | 1 week | Demo 9: Probes lab (SN + BAO likelihoods) |
| **Phase 5** | 1 week | Demos 5-6: Thermal + recombination |
| **Phase 6** | 1 week | Demo 7: BAO acoustic ruler lab |
| **Phase 7** | 0.5 week | Demo 8: Linear growth |
| **Phase 8** | 0.5 week | Integration, polish, validation |

**Total:** ~8 weeks

---

## 12. Open Questions

| Question | Owner | Notes |
|----------|-------|-------|
| **Q1:** Use real Pantheon+ data or mock? | Data/Legal | Need to check data licensing |
| **Q2:** WebGL for density field or Canvas 2D? | Engineering | Performance vs complexity |
| **Q3:** Include $H_0$ tension discussion? | Physics/Pedagogy | Topical but could confuse beginners |
| **Q4:** MCMC in browser feasible? | Engineering | May need WebAssembly for speed |

---

## 13. Appendix: Key Equations Reference

### Friedmann Equation

$$H^2(z) = H_0^2 \left[ \Omega_r(1+z)^4 + \Omega_m(1+z)^3 + \Omega_k(1+z)^2 + \Omega_\Lambda(1+z)^{3(1+w)} \right]$$

### Distances

$$D_C(z) = \frac{c}{H_0} \int_0^z \frac{dz'}{E(z')}$$

$$D_A(z) = \frac{D_C(z)}{1+z}, \quad D_L(z) = (1+z) D_C(z)$$

### Sound Horizon

$$r_s(z) = \int_z^\infty \frac{c_s(z')}{H(z')} dz', \quad c_s = \frac{c}{\sqrt{3(1+R)}}$$

### Linear Growth

$$\ddot{\delta} + 2H\dot{\delta} - 4\pi G \bar{\rho}_m \delta = 0$$

### Likelihoods

$$\chi^2_{\rm SN} = \sum_i \frac{[\mu_{\rm obs}(z_i) - \mu_{\rm model}(z_i)]^2}{\sigma_i^2}$$

$$\chi^2_{\rm BAO} = (\mathbf{d}_{\rm obs} - \mathbf{d}_{\rm model})^T \mathbf{C}^{-1} (\mathbf{d}_{\rm obs} - \mathbf{d}_{\rm model})$$

---

## 14. References

1. Planck Collaboration (2020). Planck 2018 results. VI. Cosmological parameters. *A&A*, 641, A6.
2. Weinberg, S. (2008). *Cosmology*. Oxford University Press.
3. Dodelson, S. & Schmidt, F. (2020). *Modern Cosmology*, 2nd ed. Academic Press.
4. Eisenstein, D. J. & Hu, W. (1998). Baryonic Features in the Matter Transfer Function. *ApJ*, 496, 605.
5. Scolnic, D. M. et al. (2022). The Pantheon+ Analysis. *ApJ*, 938, 113.
6. DESI Collaboration (2024). DESI 2024 VI: Cosmological Constraints from BAO.

---

*Product Requirements Document for Cosmic Playground Cosmology Demo Suite*
