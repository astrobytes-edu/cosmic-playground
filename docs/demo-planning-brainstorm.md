# Cosmic Playground: Demo Planning & Brainstorm

*Living document for planning new demos, tracking ideas, and prioritizing development.*

**Last updated:** February 2026
**Site:** [astrobytes-edu.github.io/cosmic-playground](https://astrobytes-edu.github.io/cosmic-playground/)

---

## ⚠️ Scope Contract: Reality Tiers

**"Research-grade" means validated + transparent, NOT "HPC in Safari."**

### Browser Constraints That Decide Everything

| Constraint | Reality | Workaround |
|------------|---------|------------|
| **WebGPU** | Available but not universal (Chrome 113+, Firefox 141+, Safari 26+) | Keep WebGL2 fallback |
| **SharedArrayBuffer** | Requires COOP/COEP headers; GitHub Pages can't set them directly | Use `coi-serviceworker` or host elsewhere |
| **OffscreenCanvas** | Broadly available | Nice-to-have, don't depend on it |
| **60fps physics** | Realistic for N ≤ 500 direct-sum; beyond that, decouple physics from render | Web Workers, reduced steps/frame |

### Reality Tiers

| Tier | Description | Examples |
|------|-------------|----------|
| ✅ **Tier 1** | Just build it (pure TS + Canvas/SVG) | Tides, Inverse Square, Doppler, Newton's Laws, SR suite |
| ✅ **Tier 2** | Build it, but data-driven (needs curated assets) | H-R Diagram, Light Curves, Stellar Spectra |
| ⚠️ **Tier 3** | Feasible, but simplify physics and say so | Gravitational Lensing (thin-lens), Black Hole viz (approximate), GW chirp |
| ⚙️ **Tier 4** | Needs heavier infra (Workers + 3D) | Star Cluster (N ≤ 800), Galaxy Merger (restricted dynamics) |
| 🚫 **PUNT** | Out of scope — maintenance black hole | MESA-in-browser, full radiative transfer, N > 10k N-body, full GR ray tracing |

### Explicit PUNT List (Out of Scope)

These aren't impossible — they're not worth the opportunity cost:

- **Full MESA-like stellar evolution computed live** → Use precomputed MIST/PARSEC tracks instead
- **Full radiative transfer / spectral synthesis** → Use curated spectra + simplified line models
- **High-N collisional N-body (N > 10k)** → Requires Barnes-Hut or GPU; treat as Level 3 stretch
- **Full GR ray tracing with Kerr + high physical fidelity** → Do honest "visual approximation" mode
- **Supernova hydrodynamics** → Do conceptual + light curve + nucleosynthesis yields as precomputed
- **CMB mapmaking / likelihoods** → Too deep, wrong audience
- **"Interstellar-grade" black hole viz** → Label approximations honestly; educational core is thin lens

---

## Demo Inventory Summary

| Category | Implemented | Planned | Total |
|----------|-------------|---------|-------|
| **Earth & Sky** | 5 | 1 (Tides) | 6 |
| **Orbits / Gravity** | 4 | 3 (Escape Velocity, Gravitational Lensing, Dark Matter) | 7 |
| **Light & Spectra** | 2 | 5 (Doppler, Inverse Square, Atomic Levels, Stellar Spectra, Light Curves) | 7 |
| **Telescopes** | 1 | 0 | 1 |
| **Data & Inference** | 1 | 3 (Magnitude, Color Index, H-R Diagram) | 4 |
| **Physics Foundations** | 0 | 6 (Newton's Laws ×4, Momentum, Angular Momentum) | 6 |
| **Special Relativity** | 0 | 6 (Speed of Light, Time Dilation, Length Contraction, E=mc², Rel. Doppler, Spacetime) | 6 |
| **General Relativity & Black Holes** | 0 | 9 (Equivalence, Curved Spacetime, Grav. Time Dilation, BH Basics, **Spacetime Warpage**, Formation, Accretion, GWs, Kerr) | 9 |
| **N-Body & Dynamics** | 0 | 4 (**Star Cluster**, **Rotation Curves (Planetary)**, **Rotation Curves (Galactic)**, Galaxy Merger) | 4 |
| **Stellar Structure** | 0 | 10 (Gas, Pressure, HSE, K-H, Fusion, pp-Chain, CNO, Transport, Opacity, Equations) | 10 |
| **Stellar Evolution** | 0 | 6 (Main Sequence, Post-MS, Degeneracy, WD, NS, Supernova) | 6 |
| **Compact Objects (M-R)** | 0 | 7 (M-R Relation, WD M-R, NS M-R, TOV, Pulsars, X-ray Binaries, NS Mergers) | 7 |
| **Cosmology** | 0 | 3 (Hubble's Law, Scale of Universe, CMB) | 3 |
| **TOTAL** | **13** | **63** | **76** |

### Roadmap Overview

```
YEAR 1 (Level 2 Grant)
├── P0 Critical (build first)
│   ├── Tides
│   ├── Inverse Square Law
│   └── Doppler/Redshift
├── P1 High Priority
│   ├── H-R Diagram
│   ├── Light Curves
│   ├── Stellar Spectra
│   ├── Gravitational Lensing
│   ├── Escape Velocity
│   └── ⭐ Rotation Curves (Planetary)  ← NEW
├── Physics Foundations (core)
│   ├── Newton's Laws (1st, 2nd, 3rd, Gravitation)
│   ├── Momentum Conservation
│   └── Angular Momentum Conservation
├── Stellar Suite (core)
│   ├── Ideal Gas Law
│   ├── Gas Pressure
│   ├── Hydrostatic Equilibrium
│   └── Nuclear Fusion
└── N-Body Infrastructure  ← NEW
    ├── Web Worker + Three.js template
    ├── Leapfrog integrator
    └── ⭐ Star Cluster (N ≤ 500 prototype)

YEAR 2-3 (Level 2 continued)
├── P2 Medium Priority
│   ├── Magnitude System
│   ├── Color Index
│   ├── Hubble's Law
│   ├── Scale of Universe
│   └── Atomic Energy Levels
├── Special Relativity Suite
│   ├── Speed of Light / Time Dilation
│   ├── Length Contraction / E=mc²
│   └── Relativistic Doppler / Spacetime Diagrams
├── Stellar Suite (extended)
│   ├── pp-Chain / CNO Cycle
│   ├── Energy Transport
│   ├── Main Sequence / Post-MS Evolution
│   └── Degeneracy Pressure
├── Compact Objects (intro)
│   ├── Mass-Radius Relation
│   ├── White Dwarf M-R
│   └── Pulsar Physics
└── N-Body & Dynamics Suite  ← NEW
    ├── ⭐ Star Cluster (N ≤ 800, direct sum only)
    ├── ⭐ Rotation Curves (Galactic, dark matter)
    └── ⭐ Black Hole Lensing (thin-lens approximation)

LEVEL 3 / FUTURE (Stretch Goals)
├── General Relativity & Black Holes
│   ├── Equivalence Principle / Curved Spacetime ✅
│   ├── Gravitational Time Dilation ✅
│   ├── Black Hole Basics / Formation ✅
│   ├── Accretion (parametric visualization) ⚠️
│   ├── Gravitational Waves (chirp + strain) ✅
│   └── Kerr Black Holes (conceptual only) ⚠️
├── Compact Objects
│   ├── M-R Relation (table-driven) ✅
│   ├── WD/NS structure (simplified) ✅
│   ├── TOV (toy EOS, qualitative) ⚠️
│   ├── Pulsars (geometry + inference) ✅
│   └── BNS Mergers (timeline + chirp) ✅
├── N-Body (if capacity)
│   ├── Galaxy Merger (restricted dynamics) ⚙️
│   └── 🚫 Barnes-Hut / N > 10k — PUNT unless serious tree code investment
├── Cosmology
│   ├── CMB (visual + spectrum, precomputed) ✅
│   └── 🚫 CMB mapmaking / likelihoods — PUNT (wrong audience)
└── Advanced Stellar
    ├── Opacity (Kramers-like or table-driven) ⚠️
    ├── 🚫 Full radiative transfer — PUNT (use curated spectra)
    └── 🚫 Supernova hydro — PUNT (do conceptual + precomputed yields)
```

---

## Current Demo Inventory (13 Demos)

### By Category

| Category | Demo | Status | Misconception Target |
|----------|------|--------|---------------------|
| **Earth & Sky** | Seasons: Why Tilt Matters | draft | Distance causes seasons |
| | Moon Phases: Light, Not Shadow | beta | Earth's shadow causes phases |
| | Eclipse Geometry: Shadows in Space | draft | Eclipses every month |
| | Angular Size: The Sky's Ruler | draft | Sun/Moon same actual size |
| | Planetary Conjunctions: Alignments in the Sky | draft | Conjunctions are physical events |
| **Orbits** | Kepler's Laws: Patterns of Planetary Motion | draft | Uniform orbital speed |
| | Retrograde Motion: Apparent Longitude | draft | Retrograde = backward orbit |
| | Binary Orbits: Two-Body Dance | draft | Star doesn't move |
| | Conservation Laws: Energy & Momentum | draft | Energy disappears in orbits |
| **Light & Spectra** | Blackbody Radiation: Color and Temperature | draft | Color unrelated to temperature |
| | Electromagnetic Spectrum: Light Beyond Visible | draft | All light is the same |
| **Telescopes** | Telescope Resolution: Sharper Eyes | draft | Bigger is always better |
| **Data & Inference** | Parallax Distance: Measuring the Stars | draft | Stars don't move |

---

## Brainstorm: New Demo Ideas

### Priority Tiers

- **P0 (Critical):** High-impact misconceptions, essential for ASTR 101/109, ready to build
- **P1 (High):** Important for curriculum coverage, clear design, moderate complexity
- **P2 (Medium):** Nice to have, extends ecosystem, may need more design work
- **P3 (Future):** Advanced topics, Level 3 scaling, requires significant development

---

## P0: Critical — Build Next

### Tides: The Two-Bulge Mystery
- **Misconception:** "The Moon pulls water toward it, creating one bulge"
- **Reality:** Differential gravity creates TWO bulges (near and far side)
- **Layered complexity:**
  - Conceptual: Two-bulge animation, Earth rotation through bulges
  - Quantitative: Differential force calculation, tidal range
  - Advanced: Roche limit, tidal locking timescales, tidal heating
- **Courses:** ASTR 101, ASTR 109, ASTR 201
- **Notes:** Classic misconception, visually compelling, great POE structure

### Inverse Square Law: Light Spreads Out
- **Misconception:** "Light just gets dimmer, no pattern"
- **Reality:** Flux decreases as 1/r² because light spreads over spherical surface
- **Layered complexity:**
  - Conceptual: Visual falloff, area spreading animation
  - Quantitative: 1/r² math, flux vs luminosity
  - Advanced: Apparent magnitude, distance modulus, standard candles
- **Courses:** ASTR 101, PHYS 195, ASTR 201
- **Notes:** Foundational for distance ladder, connects to many other topics

### Doppler Effect / Redshift: Motion from Color
- **Misconception:** "Redshift means the object is red" / "Objects move through space toward us"
- **Reality:** Wavelength shift encodes velocity; cosmological redshift is space expanding
- **Layered complexity:**
  - Conceptual: Color shift animation, approaching vs receding
  - Quantitative: Δλ/λ = v/c, relativistic correction
  - Advanced: Cosmological vs Doppler redshift, spectral line fitting
- **Courses:** ASTR 101, ASTR 201, upper-div
- **Notes:** Essential for exoplanet detection, galaxy distances, expansion

---

## P1: High Priority — Build This Year

### H-R Diagram: Stellar Classification
- **Misconception:** "Hot stars are red" / "Big stars are hot"
- **Reality:** Temperature-luminosity relationship reveals stellar physics
- **Layered complexity:**
  - Conceptual: Plot stars, color-temperature correlation
  - Quantitative: L = 4πR²σT⁴, main sequence fitting
  - Advanced: Stellar evolution tracks, isochrones, cluster ages
- **Courses:** ASTR 101, ASTR 201, upper-div stellar
- **Notes:** Central to stellar astrophysics, many pedagogical entry points

### Light Curves: Transit Signatures
- **Misconception:** "We photograph exoplanets directly"
- **Reality:** Most exoplanets detected via brightness dips during transit
- **Layered complexity:**
  - Conceptual: Transit animation, depth = size ratio
  - Quantitative: Depth calculation, period determination
  - Advanced: Limb darkening, transit timing variations, Kepler data
- **Courses:** ASTR 101, ASTR 201, exoplanet courses
- **Notes:** Timely (JWST era), connects to Binary Orbits demo

### Stellar Spectra: Fingerprints of Elements
- **Misconception:** "Stars are made of the same stuff" / "We can't know what stars are made of"
- **Reality:** Absorption lines reveal composition, temperature, motion
- **Layered complexity:**
  - Conceptual: Line identification, element matching
  - Quantitative: Line strength vs temperature, Boltzmann equation
  - Advanced: Curve of growth, abundance analysis, spectral synthesis
- **Courses:** ASTR 201, upper-div stellar, spectroscopy labs
- **Notes:** Connects to Blackbody demo, essential for stellar physics

### Gravitational Lensing: Bent Light
- **Misconception:** "Light always travels in straight lines"
- **Reality:** Mass bends spacetime, deflecting light paths
- **Layered complexity:**
  - Conceptual: Light bending animation, Einstein ring
  - Quantitative: Deflection angle, Einstein radius
  - Advanced: Strong vs weak lensing, mass estimation, dark matter mapping
- **Courses:** ASTR 201, cosmology, GR intro
- **Notes:** Visually stunning, connects gravity to light

### Escape Velocity: Breaking Free
- **Misconception:** "Rockets need constant thrust to escape" / "Escape velocity depends on mass of escaping object"
- **Reality:** Escape velocity depends only on M and r of the body you're escaping
- **Layered complexity:**
  - Conceptual: Throw-and-fall animation, threshold visualization
  - Quantitative: v_esc = √(2GM/r), energy equation
  - Advanced: Schwarzschild radius, event horizons, gravitational binding
- **Courses:** ASTR 101, PHYS 195, ASTR 201
- **Notes:** Connects to Conservation Laws demo, gateway to black holes

---

## P2: Medium Priority — Build in Year 2-3

### Magnitude System: Astronomical Brightness
- **Misconception:** "Bigger magnitude = brighter"
- **Reality:** Logarithmic scale, 5 magnitudes = 100× brightness difference
- **Layered complexity:**
  - Conceptual: Comparison stars, brightness ordering
  - Quantitative: m₁ - m₂ = -2.5 log(F₁/F₂)
  - Advanced: Absolute magnitude, distance modulus, bolometric corrections
- **Courses:** ASTR 109 (observing), ASTR 201
- **Notes:** Essential for observational astronomy, connects to Inverse Square

### Color Index: Temperature from Color
- **Misconception:** "Blue stars are cold like blue ice"
- **Reality:** B-V color index directly measures surface temperature
- **Layered complexity:**
  - Conceptual: Filter comparison, color-temperature visual
  - Quantitative: B-V calculation, temperature calibration
  - Advanced: Reddening, extinction, intrinsic vs observed color
- **Courses:** ASTR 109, ASTR 201, photometry
- **Notes:** Connects Blackbody + H-R Diagram demos

### Hubble's Law: Universe Expansion
- **Misconception:** "Galaxies are flying apart through space"
- **Reality:** Space itself is expanding; v = H₀d
- **Layered complexity:**
  - Conceptual: Raisin bread model, recession animation
  - Quantitative: v = H₀d, Hubble constant measurement
  - Advanced: Accelerating expansion, dark energy, deceleration parameter
- **Courses:** ASTR 101, cosmology
- **Notes:** Connects to Doppler/Redshift demo

### Scale of the Universe: Cosmic Distance Ladder
- **Misconception:** "We can directly measure distances to everything"
- **Reality:** Distance ladder: parallax → Cepheids → Type Ia SNe → Hubble flow
- **Layered complexity:**
  - Conceptual: Powers-of-ten zoom, method comparison
  - Quantitative: Distance calibration at each rung
  - Advanced: Systematic uncertainties, Hubble tension
- **Courses:** ASTR 101, ASTR 201, cosmology
- **Notes:** Connects Parallax + Inverse Square + Hubble's Law

### Atomic Energy Levels: Quantized Light
- **Misconception:** "Atoms absorb any wavelength of light"
- **Reality:** Only specific wavelengths match electron transitions
- **Layered complexity:**
  - Conceptual: Energy level diagram, photon absorption/emission
  - Quantitative: E = hν, Bohr model, Rydberg formula
  - Advanced: Selection rules, fine structure, Zeeman effect
- **Courses:** PHYS 196, ASTR 201, spectroscopy
- **Notes:** Foundation for Stellar Spectra demo

### Nuclear Fusion: Stellar Energy
- **Misconception:** "Stars burn like fire" / "Fusion is like fission"
- **Reality:** pp-chain converts H to He, E = mc² mass deficit
- **Layered complexity:**
  - Conceptual: Fusion reaction animation, energy release
  - Quantitative: Energy per reaction, luminosity calculation
  - Advanced: CNO cycle, temperature dependence, stellar cores
- **Courses:** ASTR 201, stellar physics
- **Notes:** Essential for stellar structure understanding

---

---

## Stellar Structure & Evolution Suite

*A comprehensive set of demos for teaching how stars work — from gas physics to nuclear burning to evolutionary endpoints. These form a coherent sequence that can be used across ASTR 201, upper-division stellar astrophysics, and graduate courses.*

### Ideal Gas Law: The Foundation
- **Misconception:** "Gas behavior is unpredictable" / "Pressure and temperature are unrelated"
- **Reality:** P = nkT (or P = ρkT/μmₚ) — simple relationship governs stellar interiors
- **Layered complexity:**
  - Conceptual: Particle motion animation, pressure from collisions
  - Quantitative: P = nkT, mean molecular weight μ, number density
  - Advanced: Degeneracy pressure onset, relativistic corrections
- **Courses:** PHYS 195, ASTR 201, stellar structure
- **Notes:** Foundation for everything else in stellar physics

### Gas Pressure: Particles Pushing Back
- **Misconception:** "Pressure is a force" / "Pressure only pushes outward"
- **Reality:** Pressure is force per unit area; acts in all directions; gradient creates net force
- **Layered complexity:**
  - Conceptual: Pressure gradient visualization, balloon analogy
  - Quantitative: dP/dr, pressure scale height
  - Advanced: Radiation pressure, magnetic pressure contributions
- **Courses:** PHYS 195, ASTR 201, stellar structure
- **Notes:** Critical for understanding hydrostatic equilibrium

### Hydrostatic Equilibrium: The Stellar Balancing Act
- **Misconception:** "Stars are exploding" / "Gravity should collapse stars instantly"
- **Reality:** Pressure gradient exactly balances gravity — dynamic equilibrium
- **Layered complexity:**
  - Conceptual: Tug-of-war animation, layer-by-layer balance
  - Quantitative: dP/dr = -ρg = -GMρ/r², pressure profile
  - Advanced: Lane-Emden equation, polytropes, numerical integration
- **Courses:** ASTR 201, stellar structure, graduate stellar
- **Notes:** The central concept of stellar structure

### Gravitational Contraction: Kelvin-Helmholtz Timescale
- **Misconception:** "Stars have always been the same" / "Gravity only destroys"
- **Reality:** Contraction releases gravitational energy → heat → luminosity (before fusion)
- **Layered complexity:**
  - Conceptual: Shrinking star animation, heating from compression
  - Quantitative: t_KH = GM²/(RL), virial theorem, energy budget
  - Advanced: Pre-main-sequence tracks, Hayashi limit, deuterium burning
- **Courses:** ASTR 201, stellar evolution
- **Notes:** Explains pre-main-sequence evolution, historical "age of Sun" problem

### Nuclear Fusion: Stellar Power Source
- **Misconception:** "Stars burn like fire" / "Fusion is like fission" / "Any hydrogen can fuse"
- **Reality:** Quantum tunneling enables fusion at ~15 million K; E = mc² mass deficit
- **Layered complexity:**
  - Conceptual: Proton collision animation, energy release visualization
  - Quantitative: Coulomb barrier, tunneling probability, Q-value calculation
  - Advanced: Gamow peak, reaction rates, temperature sensitivity
- **Courses:** ASTR 201, nuclear astrophysics
- **Notes:** The "why" behind stellar luminosity

### pp-Chain: Solar Fusion Pathway
- **Misconception:** "H + H → He directly" / "Fusion happens instantly"
- **Reality:** Multi-step process: p + p → d + e⁺ + ν, then d + p → ³He, then ³He + ³He → ⁴He + 2p
- **Layered complexity:**
  - Conceptual: Step-by-step reaction animation, neutrino escape
  - Quantitative: Energy per reaction, branching ratios, neutrino energies
  - Advanced: pp-I, pp-II, pp-III chains, solar neutrino problem
- **Courses:** ASTR 201, nuclear astrophysics
- **Notes:** Detailed look at how the Sun actually works

### CNO Cycle: High-Mass Stellar Fusion
- **Misconception:** "All stars fuse the same way"
- **Reality:** Massive stars use C, N, O as catalysts — same net reaction, different pathway
- **Layered complexity:**
  - Conceptual: Catalytic cycle animation, temperature dependence
  - Quantitative: Reaction rates, T⁴ vs T¹⁶ scaling
  - Advanced: CNO equilibrium abundances, nitrogen enrichment, CNO neutrinos
- **Courses:** ASTR 201, massive star physics
- **Notes:** Explains why massive stars are different

### Energy Transport: Getting Heat Out
- **Misconception:** "Heat just flows outward" / "Stars are transparent"
- **Reality:** Radiation (photon diffusion) vs convection — depends on opacity and temperature gradient
- **Layered complexity:**
  - Conceptual: Photon random walk vs convective blob animation
  - Quantitative: Radiative diffusion equation, Schwarzschild criterion
  - Advanced: Mixing length theory, convective overshooting, opacity tables
- **Courses:** ASTR 201, stellar structure
- **Notes:** Explains internal structure differences between low/high mass stars

### Opacity: Why Stars Aren't Transparent
- **Misconception:** "Light passes through gas easily"
- **Reality:** Bound-free, free-free, electron scattering, H⁻ opacity all matter
- **Layered complexity:**
  - Conceptual: Photon absorption animation, opacity sources
  - Quantitative: κ(ρ,T), Rosseland mean, optical depth
  - Advanced: Kramers-like laws (simplified)
- **⚠️ Tier 3 — Feasibility:**
  - ✅ Conceptual + Kramers-like approximations
  - ✅ Precomputed opacity tables for "advanced" layer (build-time pipeline)
  - 🚫 NOT full OPAL table interpolation in-browser
- **Courses:** Stellar structure, radiative transfer
- **Notes:** Connects to blackbody, explains stellar atmospheres

### Stellar Structure Equations: The Four Laws
- **Misconception:** "Stars are too complex to model"
- **Reality:** Four ODEs fully specify stellar structure: mass, hydrostatic, luminosity, temperature
- **Layered complexity:**
  - Conceptual: Four equations visualized as layers
  - Quantitative: dm/dr, dP/dr, dL/dr, dT/dr — solve for profiles (polytropes)
  - Advanced: Lane-Emden numerical integration
- **✅ Tier 1-2 — Very Feasible in TS:**
  - Lane-Emden / polytropes
  - Hydrostatic equilibrium as ODE solve
  - Validated numerics + invariants
- **🚫 NOT building MESA.js** — use precomputed MIST/PARSEC tracks for evolution
- **Courses:** Stellar structure, computational astrophysics
- **Notes:** Capstone demo for stellar structure unit. Keep it to what's genuinely solvable in-browser.

### Main Sequence: The Hydrogen-Burning Band
- **Misconception:** "Stars evolve along the main sequence"
- **Reality:** MS is a snapshot of H-burning stars; position determined by mass
- **Layered complexity:**
  - Conceptual: H-R diagram with mass labels, lifetime variation
  - Quantitative: L ∝ M³·⁵, R ∝ M⁰·⁷, lifetime ∝ M/L
  - Advanced: Mass-luminosity relation derivation, homology
- **Courses:** ASTR 201, stellar evolution
- **Notes:** Connects to H-R Diagram demo, explains MS width

### Post-Main-Sequence Evolution: What Happens Next
- **Misconception:** "Stars die when they run out of fuel" / "All stars become black holes"
- **Reality:** Core contraction → shell burning → giant phases → endpoints depend on mass
- **Layered complexity:**
  - Conceptual: Evolutionary track animation on H-R diagram
  - Quantitative: Shell burning energetics (conceptual), timescale comparisons
  - Advanced: Precomputed MIST/PARSEC track visualization + interpolation
- **✅ Tier 2 — Feasible as precomputed tracks:**
  - Load MIST tracks as JSON
  - Interpolate + animate on H-R diagram
  - 🚫 NOT computing evolution live in-browser
- **Courses:** ASTR 201, stellar evolution
- **Notes:** The hard part is visualization, not physics. Use existing computed tracks.

### Degeneracy Pressure: Quantum Support
- **Misconception:** "All pressure comes from heat" / "Cold objects collapse"
- **Reality:** Pauli exclusion → electron degeneracy pressure independent of temperature
- **Layered complexity:**
  - Conceptual: Fermion crowding animation, phase space filling
  - Quantitative: P ∝ ρ^(5/3), Chandrasekhar mass derivation sketch
  - Advanced: Relativistic degeneracy, white dwarf mass-radius relation
- **Courses:** ASTR 201, compact objects
- **Notes:** Key to understanding white dwarfs, neutron stars

### White Dwarf Structure: Degenerate Endpoints
- **Misconception:** "White dwarfs are dying stars" / "They're small because they're old"
- **Reality:** Electron-degenerate cores; mass-radius relation inverted (more massive = smaller)
- **Layered complexity:**
  - Conceptual: Size comparison, cooling track
  - Quantitative: M-R relation, Chandrasekhar limit (1.4 M☉)
  - Advanced: Cooling curves, crystallization, Type Ia progenitors
- **Courses:** ASTR 201, compact objects
- **Notes:** Endpoint for Sun-like stars

### Neutron Star Structure: Extreme Density
- **Misconception:** "Neutron stars are just dense" / "They're like big atoms"
- **Reality:** Neutron-degenerate matter, nuclear density, extreme gravity and magnetism
- **Layered complexity:**
  - Conceptual: Size/density visualization, pulsar lighthouse model
  - Quantitative: Typical parameters (M ~ 1.4 M☉, R ~ 10 km), surface gravity
  - Advanced: Equation of state uncertainty, maximum mass, gravitational waves
- **Courses:** ASTR 201, compact objects, high-energy astrophysics
- **Notes:** Connects to gravitational waves, X-ray astronomy

### Supernova Explosion: Stellar Death
- **Misconception:** "Stars just burn out quietly"
- **Reality:** Core collapse or thermonuclear runaway — spectacular energy release
- **Layered complexity:**
  - Conceptual: Collapse animation, shock wave, light curve
  - Quantitative: Energy budget, nucleosynthesis yields (precomputed)
  - Advanced: Type Ia vs core-collapse comparison (conceptual)
- **⚠️ Tier 3 — Feasibility:**
  - ✅ Conceptual animation of collapse/explosion sequence
  - ✅ Light curve visualization with precomputed templates
  - ✅ Nucleosynthesis yields as precomputed data
  - 🚫 NOT supernova hydrodynamics in-browser — PUNT
- **Courses:** ASTR 201, stellar evolution, nucleosynthesis
- **Notes:** Dramatic visual, educational focus on energy scales and outcomes, not simulation.

---

---

## Physics Foundations Suite

*Core physics concepts that underpin astronomy — essential for PHYS 195-197 and ASTR 201. These demos bridge the gap between intro physics and astrophysical applications.*

### Newton's First Law: Inertia in Space
- **Misconception:** "Objects naturally slow down" / "Motion requires a force"
- **Reality:** Objects in motion stay in motion unless acted upon — space is the perfect example
- **Layered complexity:**
  - Conceptual: Spacecraft coasting animation, no friction in space
  - Quantitative: Reference frames, velocity persistence
  - Advanced: Inertial vs non-inertial frames, fictitious forces
- **Courses:** PHYS 195, ASTR 101
- **Notes:** Foundation for orbital mechanics, why planets keep moving

### Newton's Second Law: F = ma in Action
- **Misconception:** "Heavier objects fall faster" / "Force equals velocity"
- **Reality:** Force causes acceleration proportional to mass; same force, different accelerations
- **Layered complexity:**
  - Conceptual: Force arrows, acceleration visualization
  - Quantitative: F = ma calculations, multiple forces
  - Advanced: Variable mass systems, rocket equation
- **Courses:** PHYS 195, ASTR 201
- **Notes:** Essential for understanding orbital dynamics, stellar structure

### Newton's Third Law: Action-Reaction Pairs
- **Misconception:** "Stronger object exerts more force" / "Earth doesn't feel the apple"
- **Reality:** Forces come in equal and opposite pairs — Sun pulls Earth, Earth pulls Sun
- **Layered complexity:**
  - Conceptual: Paired force arrows, mutual attraction animation
  - Quantitative: Force magnitudes on both bodies
  - Advanced: Center of mass motion, binary star wobble
- **Courses:** PHYS 195, ASTR 101, connects to Binary Orbits demo
- **Notes:** Critical for understanding stellar wobble, exoplanet detection

### Newton's Law of Gravitation: The Universal Force
- **Misconception:** "Gravity only works on Earth" / "Gravity is different in space"
- **Reality:** F = GMm/r² — same law governs falling apples and orbiting planets
- **Layered complexity:**
  - Conceptual: Force vs distance visualization, shell theorem
  - Quantitative: F = GMm/r², gravitational field g(r)
  - Advanced: Gravitational potential, tidal forces, escape velocity derivation
- **Courses:** PHYS 195, ASTR 201
- **Notes:** Unifying concept — connects terrestrial and celestial mechanics

### Momentum Conservation: Collisions and Explosions
- **Misconception:** "Momentum disappears in collisions" / "Bigger object always wins"
- **Reality:** Total momentum conserved in isolated systems — applies to galaxies colliding
- **Layered complexity:**
  - Conceptual: Before/after collision animations
  - Quantitative: p = mv, elastic vs inelastic
  - Advanced: Rocket propulsion, supernova kicks, gravitational slingshots
- **Courses:** PHYS 195, ASTR 201
- **Notes:** Connects to Conservation Laws demo, supernova physics

### Angular Momentum Conservation: Spin-Up and Spin-Down
- **Misconception:** "Spinning things slow down naturally" / "Angular momentum isn't conserved"
- **Reality:** L = Iω conserved — explains ice skaters, collapsing clouds, neutron stars
- **Layered complexity:**
  - Conceptual: Ice skater spin-up, collapsing cloud animation
  - Quantitative: L = Iω, moment of inertia changes
  - Advanced: Pulsar spin-up, accretion disk formation, Kepler's 2nd law connection
- **Courses:** PHYS 195, ASTR 201, stellar evolution
- **Notes:** Essential for star formation, compact object physics

---

## Special Relativity Suite

*Einstein's special relativity — essential for high-energy astrophysics, cosmology, and understanding light. Appropriate for PHYS 197, ASTR 201, and upper-division courses.*

### Constant Speed of Light: The Cosmic Speed Limit
- **Misconception:** "Light speed depends on source motion" / "You can catch up to light"
- **Reality:** c is constant in all reference frames — the foundational postulate
- **Layered complexity:**
  - Conceptual: Light beam animation, source motion doesn't matter
  - Quantitative: c = 3×10⁸ m/s, Michelson-Morley context
  - Advanced: Implications for simultaneity, causality
- **Courses:** PHYS 197, ASTR 201
- **Notes:** Foundation for all of special relativity

### Time Dilation: Moving Clocks Run Slow
- **Misconception:** "Time is absolute" / "This is just an illusion"
- **Reality:** Δt' = γΔt — time genuinely passes differently for moving observers
- **Layered complexity:**
  - Conceptual: Light clock animation, twin paradox visualization
  - Quantitative: γ = 1/√(1-v²/c²), time dilation calculations
  - Advanced: Muon decay, GPS corrections, relativistic jets
- **Courses:** PHYS 197, ASTR 201, high-energy astrophysics
- **Notes:** Explains cosmic ray muons, jet physics

### Length Contraction: Moving Rulers Shrink
- **Misconception:** "Length is absolute" / "Objects physically compress"
- **Reality:** L' = L/γ — lengths genuinely shorter in direction of motion
- **Layered complexity:**
  - Conceptual: Spacecraft length animation at different speeds
  - Quantitative: L' = L/γ calculations
  - Advanced: Relativistic shape distortion, ladder paradox
- **Courses:** PHYS 197, ASTR 201
- **Notes:** Complements time dilation

### Relativistic Momentum and Energy: E = mc²
- **Misconception:** "Mass increases with speed" / "E = mc² only applies to nuclear reactions"
- **Reality:** E² = (pc)² + (mc²)² — mass-energy equivalence is universal
- **Layered complexity:**
  - Conceptual: Energy vs speed plot, approaching c
  - Quantitative: p = γmv, E = γmc², kinetic energy
  - Advanced: Four-momentum, particle physics applications
- **Courses:** PHYS 197, nuclear astrophysics
- **Notes:** Essential for understanding stellar energy, particle jets

### Relativistic Doppler Effect: Beyond Classical
- **Misconception:** "Doppler shift is the same at all speeds"
- **Reality:** Relativistic Doppler includes time dilation — redshift formula changes
- **Layered complexity:**
  - Conceptual: Color shift at relativistic speeds
  - Quantitative: z = √((1+β)/(1-β)) - 1
  - Advanced: Transverse Doppler, relativistic beaming
- **Courses:** ASTR 201, high-energy astrophysics, cosmology
- **Notes:** Connects to Doppler/Redshift demo, extends to relativistic regime

### Spacetime Diagrams: Visualizing Relativity
- **Misconception:** "Space and time are separate"
- **Reality:** Spacetime is unified; worldlines show complete history
- **Layered complexity:**
  - Conceptual: Worldline animations, light cones
  - Quantitative: Minkowski diagrams, proper time
  - Advanced: Lorentz transformations, causality structure
- **Courses:** PHYS 197, ASTR 201, GR intro
- **Notes:** Gateway to general relativity

---

## General Relativity & Black Holes Suite

*Einstein's general relativity and its most dramatic prediction — black holes. For upper-division astrophysics and graduate courses.*

### Equivalence Principle: Gravity = Acceleration
- **Misconception:** "Gravity is a force like any other"
- **Reality:** Freefall is indistinguishable from no gravity — gravity is geometry
- **Layered complexity:**
  - Conceptual: Elevator thought experiment, astronaut freefall
  - Quantitative: Local inertial frames, geodesic motion
  - Advanced: Tidal forces as curvature detection
- **Courses:** ASTR 201, GR intro
- **Notes:** Conceptual foundation for general relativity

### Curved Spacetime: Gravity as Geometry
- **Misconception:** "Mass pulls objects" / "Gravity reaches out and grabs things"
- **Reality:** Mass curves spacetime; objects follow geodesics (straightest paths in curved space)
- **Layered complexity:**
  - Conceptual: Rubber sheet analogy (with caveats), geodesic paths
  - Quantitative: Metric tensor introduction, Schwarzschild geometry
  - Advanced: Einstein field equations (conceptual), stress-energy
- **Courses:** ASTR 201, GR course
- **Notes:** Central conceptual shift of GR

### ⭐ Black Hole Spacetime Warpage: Seeing Curved Space
- **Misconception:** "Space is flat everywhere" / "Black holes are just very dense"
- **Reality:** Spacetime curvature bends light paths, creating dramatic visual distortions
- **Layered complexity:**
  - Conceptual: Grid distortion visualization, light bending around mass
  - Quantitative: Deflection angle θ = 4GM/rc², Einstein ring radius
  - Advanced: Thin-lens lensing model (NOT full ray tracing)
- **Courses:** ASTR 201, GR intro, public outreach
- **⚠️ Tier 3 — Honest Approaches (pick one):**
  1. **Thin-Lens Mapping:** Impact parameter → deflection angle (fast, stable, educational core)
  2. **Grid Distortion:** Cartesian grid warped by central mass (classic visualization)
  3. **2D Equatorial Geodesics:** Doable but careful implementation needed
- **🚫 NOT doing "Interstellar-grade" full-screen ray marching** — that's a visual approximation at best; label it honestly if attempted later.
- **Visualization Modes (realistic):**
  1. **Grid Distortion:** Warped grid showing curvature concept
  2. **Light Bending:** Thin-lens deflection of background stars
  3. **Einstein Ring:** Ring formation from aligned source
- **Technical:** Canvas/WebGL thin-lens calculation, NOT full metric ray marching
- **Presets:**
  - Stellar-mass BH (10 M☉): Show Einstein ring, deflection
  - Supermassive BH: Scale comparison
- **Notes:** Educational goal is "mass bends light" — NOT photorealistic rendering. Resist feature creep.

### Gravitational Time Dilation: Clocks in Gravity Wells
- **Misconception:** "Time flows the same everywhere"
- **Reality:** Clocks run slower in stronger gravitational fields
- **Layered complexity:**
  - Conceptual: GPS satellite clocks, surface vs orbit comparison
  - Quantitative: Δt = Δt₀/√(1-2GM/rc²), Pound-Rebka
  - Advanced: Redshift from gravitational wells, event horizon limit
- **Courses:** ASTR 201, GR intro
- **Notes:** Measurable on Earth, critical for GPS

### Black Hole Basics: The Event Horizon
- **Misconception:** "Black holes suck everything in" / "You'd be crushed at the horizon"
- **Reality:** Event horizon is a causal boundary, not a physical surface; tidal forces matter
- **Layered complexity:**
  - Conceptual: Escape velocity exceeds c, horizon visualization
  - Quantitative: Schwarzschild radius R_s = 2GM/c²
  - Advanced: Coordinate singularity vs physical singularity, Penrose diagrams
- **Courses:** ASTR 201, compact objects, GR
- **Notes:** Most dramatic GR prediction, public fascination

### Black Hole Formation: Stellar Collapse
- **Misconception:** "Black holes appear randomly" / "Any star can become a black hole"
- **Reality:** Core collapse of massive stars (>~20-25 M☉) when no pressure can halt gravity
- **Layered complexity:**
  - Conceptual: Collapse animation, Chandrasekhar/TOV limits
  - Quantitative: Mass thresholds, collapse timescales
  - Advanced: Pair instability, direct collapse, primordial black holes
- **Courses:** Stellar evolution, compact objects
- **Notes:** Connects stellar evolution to compact object formation

### Black Hole Accretion: Feeding the Monster
- **Misconception:** "Black holes just sit there" / "Nothing escapes so we can't see them"
- **Reality:** Infalling matter heats up, radiates intensely before crossing horizon
- **Layered complexity:**
  - Conceptual: Accretion disk animation, jets
  - Quantitative: Eddington luminosity, accretion efficiency
  - Advanced: Disk structure, relativistic jets, AGN unified model
- **Courses:** High-energy astrophysics, compact objects
- **Notes:** How we detect black holes, explains quasars/AGN

### Gravitational Waves: Ripples in Spacetime
- **Misconception:** "Gravity is instantaneous" / "Nothing escapes black holes"
- **Reality:** Accelerating masses emit gravitational waves at speed c
- **Layered complexity:**
  - Conceptual: Binary inspiral animation, wave propagation
  - Quantitative: Strain amplitude, frequency-chirp relationship
  - Advanced: Detector sensitivity concept, multi-messenger timeline
- **✅ Tier 1-3 — Feasible if scoped correctly:**
  - ✅ Inspiral chirp (frequency/amplitude evolution) — analytical
  - ✅ Strain scaling + detector sensitivity concept
  - ✅ Real GW event light curves/strain data (precomputed)
  - 🚫 NOT "full waveform template generation" unless precomputed
- **Courses:** ASTR 201, compact objects, GR
- **Notes:** 2015 detection was transformative. Focus on "what we measure → what we infer."

### Kerr Black Holes: Spinning Spacetime
- **Misconception:** "All black holes are the same"
- **Reality:** Rotating black holes drag spacetime, have ergospheres, more complex structure
- **Layered complexity:**
  - Conceptual: Frame dragging visualization, ergosphere
  - Quantitative: Kerr metric parameters, ISCO dependence on spin
  - Advanced: Penrose process, jet launching, spin measurement
- **Courses:** GR course, high-energy astrophysics
- **Notes:** Real astrophysical black holes spin

---

## Compact Objects Suite (Expanded)

*Detailed physics of stellar remnants — white dwarfs, neutron stars, and black holes. The M-R relation is the unifying theme.*

### Mass-Radius Relation: The Compact Object Signature
- **Misconception:** "Bigger objects are more massive"
- **Reality:** For degenerate objects, M-R relation is inverted or has maximum mass
- **Layered complexity:**
  - Conceptual: Compare WD, NS, BH sizes at same mass
  - Quantitative: R ∝ M^(-1/3) for non-relativistic WD, TOV limit
  - Advanced: Full M-R curves, equation of state constraints
- **Courses:** Stellar evolution, compact objects
- **Notes:** Unifying framework for all compact objects

### White Dwarf M-R Relation: Electron Degeneracy
- **Misconception:** "White dwarfs all have the same size"
- **Reality:** More massive WDs are smaller; Chandrasekhar limit at 1.4 M☉
- **Layered complexity:**
  - Conceptual: Size comparison across mass range
  - Quantitative: R ∝ M^(-1/3), Chandrasekhar derivation sketch
  - Advanced: Relativistic corrections, cooling tracks on M-R diagram
- **Courses:** Stellar evolution, compact objects
- **Notes:** Classic result, Type Ia connection

### Neutron Star M-R Relation: Nuclear Physics Meets Gravity
- **Misconception:** "Neutron stars are just denser white dwarfs"
- **Reality:** Different EOS, M-R relation reveals nuclear physics at extreme density
- **Layered complexity:**
  - Conceptual: Uncertainty band visualization, different EOS predictions
  - Quantitative: TOV equation, maximum mass ~2-2.5 M☉
  - Advanced: Phase transitions, quark cores, NICER measurements
- **Courses:** Compact objects, nuclear astrophysics
- **Notes:** Active research area, gravitational wave constraints

### Tolman-Oppenheimer-Volkoff Equation: Relativistic Stellar Structure
- **Misconception:** "Hydrostatic equilibrium is the same for all stars"
- **Reality:** GR corrections become essential for neutron stars
- **Layered complexity:**
  - Conceptual: Additional terms beyond Newtonian HSE
  - Quantitative: TOV equation explanation, qualitative behavior
  - Advanced: Toy EOS integration showing M-R dependence
- **⚠️ Tier 3 — Feasibility:**
  - ✅ Provide a few EOS options as precomputed M(R) curves (table-driven)
  - ✅ Implement a "toy EOS" live to show qualitative behavior
  - 🚫 NOT "realistic EOS exploration with full nuclear microphysics" — PUNT
- **Courses:** Compact objects, GR
- **Notes:** GR generalization of hydrostatic equilibrium. Focus on insight, not HPC.

### Pulsar Physics: Cosmic Lighthouses
- **Misconception:** "Pulsars pulse" / "They're like variable stars"
- **Reality:** Rotating neutron stars with misaligned magnetic fields → beamed radiation
- **Layered complexity:**
  - Conceptual: Lighthouse model animation, period = rotation period
  - Quantitative: P, Ṗ, magnetic field estimation, characteristic age
  - Advanced: Pulsar wind nebulae, magnetars, millisecond pulsars
- **Courses:** ASTR 201, compact objects, high-energy astrophysics
- **Notes:** Precision clocks, gravitational wave detection

### X-ray Binaries: Compact Objects Revealed
- **Misconception:** "We can't see neutron stars or black holes"
- **Reality:** Accretion in binary systems produces X-rays, reveals compact object properties
- **Layered complexity:**
  - Conceptual: Roche lobe overflow, accretion disk animation
  - Quantitative: X-ray luminosity, orbital parameters → mass
  - Advanced: QPOs, spectral states, spin measurements
- **Courses:** High-energy astrophysics, compact objects
- **Notes:** How we measure NS and BH masses

### Binary Neutron Star Mergers: Multi-Messenger Gold Mine
- **Misconception:** "Mergers are just gravitational wave sources"
- **Reality:** GWs + EM across spectrum + neutrinos + r-process nucleosynthesis
- **Layered complexity:**
  - Conceptual: Inspiral-merger-ringdown animation, kilonova
  - Quantitative: GW170817 timeline, r-process yields
  - Advanced: EOS constraints from tidal deformability, jet physics
- **Courses:** Compact objects, nucleosynthesis, multi-messenger astronomy
- **Notes:** Landmark 2017 event, origin of heavy elements

---

## N-Body & Dynamics Suite

*Interactive gravitational dynamics from planetary systems to galaxies. These demos showcase the power of numerical simulation and reveal the "missing mass" problem. Requires Web Workers and/or GPU compute for smooth performance.*

**Technical Reference:** See [technical-architecture-plan.md](./technical-architecture-plan.md) for implementation details.

### ⭐ Star Cluster Dynamics: Gravitational Many-Body Dance
- **Misconception:** "Star clusters are static" / "Stars don't interact"
- **Reality:** Gravitational interactions drive cluster evolution — core collapse, mass segregation, ejections
- **Layered complexity:**
  - Conceptual: Watch cluster evolve, see fast stars escape, core contracts
  - Quantitative: Measure half-mass radius, velocity dispersion, virial ratio (2K/|W|)
  - Advanced: King models, relaxation timescale (conceptual)
- **Courses:** ASTR 201, stellar dynamics, computational astrophysics
- **Visualization:**
  - 3D point cloud with orbit trails (optional)
  - Color by velocity (blue = fast, red = slow)
  - Side panel: density profile, velocity histogram
- **Presets:**
  - Plummer sphere (N = 100, 300, 500)
  - King model with different concentrations
- **Physics:**
  - Leapfrog integrator (symplectic, energy-conserving)
  - Direct N² summation only
  - Softening parameter to prevent close encounters
- **Diagnostics:**
  - Total energy (should be conserved)
  - Virial ratio (should approach 1.0 for equilibrium)
  - Half-mass radius evolution
  - Escapers count
- **Technical:** Web Worker for physics, Three.js PointCloud for rendering
- **⚙️ Tier 4 — Performance Targets:**
  - ✅ Green: N ≈ 200–500 at 60fps (achievable)
  - 🟡 Yellow: N ≈ 500–800 at 30-60fps (decouple physics from render)
  - 🔴 Red: N > 1000 — requires Barnes-Hut (Level 3 stretch, not Year 1)
- **Notes:** Classic N-body problem, beautiful dynamics. Do NOT promise N > 1000 without tree code.

### ⭐ Rotation Curves: Planetary Systems (Keplerian)
- **Misconception:** "Planets all move at similar speeds" / "Outer planets are faster because they have farther to go"
- **Reality:** v(r) ∝ 1/√r — outer planets move SLOWER (Kepler's 3rd law consequence)
- **Layered complexity:**
  - Conceptual: Animation showing inner planets lapping outer ones
  - Quantitative: v = √(GM/r), plot v vs r, verify 1/√r scaling
  - Advanced: Perturbations, resonances, multi-planet systems
- **Courses:** ASTR 101, PHYS 195, intro mechanics
- **Visualization:**
  - Left: Top-down solar system view with velocity vectors
  - Right: v(r) rotation curve plot with data points
  - Slider: total central mass, add/remove planets
- **Presets:**
  - Solar system (8 planets)
  - Exoplanet system (TRAPPIST-1)
  - Binary star + planets
- **Notes:** Foundation for understanding galactic rotation curves; contrast with next demo

### ⭐ Rotation Curves: Galaxies (Dark Matter Evidence)
- **Misconception:** "Galaxy rotation should be like planetary system" / "Dark matter is just made up"
- **Reality:** Observed v(r) is FLAT, not Keplerian — requires additional unseen mass (dark halo)
- **Layered complexity:**
  - Conceptual: Compare expected (Keplerian) vs observed (flat) curves
  - Quantitative: Fit disk + bulge + halo model, calculate M(<r)
  - Advanced: NFW profile, MOND alternative, Milky Way data
- **Courses:** ASTR 201, cosmology, galactic astronomy
- **Visualization:**
  - Left: Face-on galaxy view with orbiting stars/gas clouds
  - Right: v(r) plot with components (bulge, disk, halo, total)
  - Toggle: "visible matter only" vs "with dark halo"
- **Physics Model:**
  ```
  v²(r) = G * M_enclosed(r) / r

  M_enclosed(r) = M_bulge(<r) + M_disk(<r) + M_halo(<r)

  Bulge: Hernquist profile
  Disk:  Exponential, M(<r) = Md * [1 - (1+r/Rd)*exp(-r/Rd)]
  Halo:  NFW, M(<r) = M200 * f(r/rs) / f(c)
  ```
- **Presets:**
  - Milky Way (MW parameters)
  - NGC 3198 (classic flat rotation curve)
  - Dwarf galaxy (dark-matter dominated)
  - No dark matter (see the discrepancy!)
- **Key Insight:** Without dark halo, predicted curve drops off; observed curve stays flat → "missing mass"
- **Notes:** One of the strongest pieces of evidence for dark matter; historically important

### Galaxy Merger: Tidal Interactions
- **Misconception:** "Galaxy collisions are violent explosions"
- **Reality:** Stars rarely collide; tidal forces create beautiful bridges and tails
- **Layered complexity:**
  - Conceptual: Watch two disk galaxies interact, form tidal tails
  - Quantitative: Impact parameter, mass ratio effects
  - Advanced: Toomre & Toomre style restricted dynamics
- **Courses:** Galactic astronomy, dynamics
- **⚙️ Tier 4 — Physics (realistic approach):**
  - ✅ Restricted dynamics: test particles in analytic potential (feasible)
  - ✅ Low-N particles with softened forces (N ~ 200 per galaxy)
  - 🚫 NOT full hydrodynamic merger with star formation/feedback (punt)
- **Focus:** Tides and tails visualization, not "realistic merger simulation"
- **Presets:**
  - Antennae-like encounter
  - Mice-like flyby
  - Direct collision
- **Notes:** Visually stunning, great for outreach. Keep it simple — the educational point is "tidal forces make beautiful structures."

---

## P3: Future / Level 3 Scaling

### Cosmic Microwave Background: Baby Picture
- Temperature fluctuations, angular power spectrum
- Cosmology course focus

### Dark Matter: The Missing Mass
- Rotation curves, gravitational evidence
- Conceptually accessible, quantitatively advanced

### Exoplanet Detection Methods: The Full Toolkit
- Transit + RV + direct imaging + microlensing
- Could be expansion of Light Curves demo

---

## By Course Mapping

### ASTR 101 (Intro Non-Majors)
**Current:** Seasons, Moon Phases, Eclipse Geometry, Angular Size, Planetary Conjunctions, Kepler's Laws, Retrograde Motion, Blackbody, EM Spectrum, Telescope Resolution, Parallax

**Needed:**
- Tides (P0)
- Inverse Square Law (P0)
- Doppler/Redshift (P0)
- H-R Diagram (P1) — conceptual layer
- Hubble's Law (P2)
- Scale of Universe (P2)
- Nuclear Fusion — conceptual layer (why stars shine)
- Main Sequence — conceptual layer (what the H-R diagram shows)

### ASTR 109 (Intro Lab)
**Current:** Moon Phases, Angular Size, Eclipse Geometry, Telescope Resolution, Parallax

**Needed:**
- Magnitude System (P2)
- Color Index (P2)
- Light Curves (P1)

### ASTR 201 (Intro Majors)
**Current:** All current demos at quantitative layer

**Needed:**
- All P0 and P1 demos
- Stellar Spectra (P1)
- Gravitational Lensing (P1)
- **Stellar Structure Suite (quantitative layers):**
  - Ideal Gas Law
  - Gas Pressure
  - Hydrostatic Equilibrium
  - Nuclear Fusion / pp-Chain
  - Main Sequence
  - Post-MS Evolution
  - White Dwarf Structure

### PHYS 195 (Mechanics)
**Current:** Kepler's Laws, Conservation Laws

**Physics Foundations Suite:**
- Newton's First Law (Inertia)
- Newton's Second Law (F = ma)
- Newton's Third Law (Action-Reaction)
- Newton's Law of Gravitation
- Momentum Conservation
- Angular Momentum Conservation
- Escape Velocity

### PHYS 196 (E&M, Waves, Thermo)
**Current:** Blackbody, EM Spectrum

**Needed:**
- Inverse Square Law (P0)
- Atomic Energy Levels (P2)
- Ideal Gas Law (Stellar Suite)
- Gas Pressure (Stellar Suite)

### PHYS 197 (Modern Physics)
**Special Relativity Suite:**
- Speed of Light
- Time Dilation
- Length Contraction
- E = mc²
- Relativistic Doppler
- Spacetime Diagrams

**Quantum/Nuclear:**
- Atomic Energy Levels
- Nuclear Fusion

### Upper-Division Stellar Astrophysics
**Full Stellar Structure & Evolution Suite:**
- Ideal Gas Law (+ degeneracy)
- Gas Pressure (+ radiation pressure)
- Hydrostatic Equilibrium (+ Lane-Emden)
- Gravitational Contraction / Kelvin-Helmholtz
- Nuclear Fusion / pp-Chain / CNO Cycle
- Energy Transport (radiative + convective)
- Opacity
- Stellar Structure Equations
- Main Sequence (mass-luminosity derivation)
- Post-MS Evolution (tracks, shell burning)
- Degeneracy Pressure
- White Dwarf Structure
- Neutron Star Structure
- Supernova Explosion

### Upper-Division GR / Compact Objects
**General Relativity & Black Holes:**
- Equivalence Principle
- Curved Spacetime
- Gravitational Time Dilation
- Black Hole Basics
- Black Hole Formation
- Accretion
- Gravitational Waves
- Kerr Black Holes

**Compact Objects Suite:**
- Mass-Radius Relation (unifying)
- White Dwarf M-R
- Neutron Star M-R
- TOV Equation
- Pulsar Physics
- X-ray Binaries
- Binary NS Mergers

### Graduate Computational Astrophysics
**Advanced layers of all demos, plus:**
- Lane-Emden numerical integration
- MESA comparison and validation
- Evolutionary track computation
- Equation of state exploration
- Nucleosynthesis yields
- TOV solver with different EOS
- Gravitational wave template generation

---

## Brainstorm Parking Lot

*Ideas that need more development before prioritizing*

- **Coriolis Effect** — Earth rotation, weather patterns, Foucault pendulum
- **Precession** — Axial wobble, pole star changes, Milankovitch connection
- **Stellar Parallax vs Proper Motion** — Distinguishing annual parallax from real motion
- **Binary Star Types** — Visual, spectroscopic, eclipsing, astrometric
- **Supernova Types** — Ia vs core-collapse, light curves, nucleosynthesis
- **Accretion Disks** — Angular momentum, disk formation, jets
- **Magnetic Fields** — Zeeman splitting, stellar activity, pulsars
- **Gravitational Waves** — Binary inspiral, LIGO detection
- **Coordinate Systems** — Equatorial, ecliptic, galactic, hour angle
- **Time Systems** — Sidereal vs solar, Julian dates, time zones

---

## Demo Design Checklist

For each new demo, ensure:

- [ ] **Misconception identified** — What wrong idea are we confronting?
- [ ] **Observable defined** — What can students see/measure?
- [ ] **Model articulated** — What physical mechanism explains it?
- [ ] **Inference pathway** — What can we conclude about unseen things?
- [ ] **Layered complexity** — Conceptual / Quantitative / Advanced layers defined
- [ ] **Course mapping** — Which courses use which layers?
- [ ] **Prediction checkpoint** — Where do students commit to a prediction?
- [ ] **Presets identified** — Real astronomical systems as examples
- [ ] **Physics validation** — Can we test against analytic solutions?
- [ ] **Accessibility** — Keyboard nav, color contrast, screen reader support

---

## Development Notes

### Technical Patterns to Reuse
- Physics model separation (testable in Node.js)
- SVG-based visualization with responsive scaling
- Preset system with real astronomical data
- Layered UI with progressive disclosure toggles
- Prediction checkpoint pause/reveal flow

### AI-Augmented Development Workflow
1. Define physics model with invariants and test cases
2. Generate implementation with Claude/Codex
3. Validate against analytic solutions
4. Build visualization layer
5. Add instructor scaffolding
6. Accessibility audit

---

## Technical Architecture: TypeScript vs Python for Numerical Physics

*Analysis of codebase capabilities and recommendations for advanced demos.*

### Current Codebase Capabilities

The codebase already implements **real numerical methods in TypeScript**:

**Existing Numerical Work:**
- **Kepler Solver** (`keplerSolver.ts`): Newton-Raphson iteration with deterministic bisection fallback — converges to 10⁻¹² rad tolerance
- **Two-Body Analytic** (`twoBodyAnalytic.ts`): Orbital element ↔ state vector conversions, vis-viva, energy/momentum calculations
- **Blackbody** (`blackbodyRadiationModel.ts`): Planck function evaluation with overflow protection
- **Bessel J₁ approximation** (`telescopeResolutionModel.ts`): For Airy pattern visualization

**Architecture:**
```
packages/physics/src/     ← Pure physics (testable in Node.js)
apps/demos/src/demos/     ← UI + Canvas/SVG rendering
requestAnimationFrame()   ← Animation loop at ~60fps
```

### What TypeScript Can Handle (No Python Needed)

TypeScript/JavaScript is **more than sufficient** for most demos:

| Category | Example Demos | Complexity | TS Viable? |
|----------|--------------|------------|------------|
| **Analytic closed-form** | Kepler's laws, vis-viva, blackbody, parallax | Low | ✅ Excellent |
| **Simple ODE integration** | 2-body motion, oscillators, decay curves | Medium | ✅ Yes |
| **Iterative root-finding** | Kepler equation, hydrostatic equilibrium profiles | Medium | ✅ Yes (already done) |
| **Pre-computed tables + interpolation** | Opacity tables, EOS, stellar tracks | Medium | ✅ Yes |
| **Moderate N-body (N ≤ 100)** | Star clusters, binary + planet | Medium | ✅ Yes at 60fps |
| **Ray tracing (simple)** | Gravitational lensing, light bending | Medium-High | ✅ Yes with Web Workers |

**TS-native numerical patterns:**
```typescript
// Runge-Kutta 4th order — perfectly viable in TS
function rk4Step<T>(
  y: T,
  dydt: (y: T, t: number) => T,
  t: number,
  dt: number
): T {
  const k1 = dydt(y, t);
  const k2 = dydt(add(y, scale(k1, 0.5 * dt)), t + 0.5 * dt);
  const k3 = dydt(add(y, scale(k2, 0.5 * dt)), t + 0.5 * dt);
  const k4 = dydt(add(y, scale(k3, dt)), t + dt);
  return add(y, scale(add(k1, scale(k2, 2), scale(k3, 2), k4), dt / 6));
}
```

### When Python/WebAssembly Becomes Attractive

Python (via Pyodide/WebAssembly) makes sense **only for**:

| Category | Example Demos | Why Python Helps |
|----------|---------------|------------------|
| **Full stellar evolution** | MESA-like tracks, isochrone generation | Existing Python packages (MESA-web), complex physics |
| **TOV equation integration** | Neutron star M-R with realistic EOS | Need to solve coupled ODEs with sophisticated EOS tables |
| **Radiative transfer** | Spectral synthesis, line formation | TARDIS, Synspec integration |
| **Large N-body (N > 1000)** | Galaxy dynamics, cluster evolution | Need optimized integrators (REBOUND) |
| **Monte Carlo methods** | Stellar interiors, photon transport | Large sample sizes, statistical convergence |
| **Pre-computed data generation** | Build-time table generation | Python offline → JSON → TS at runtime |

### Recommended Architecture for Advanced Demos

**Tier 1: Pure TypeScript (90% of demos)**
- All current demos
- Stellar structure equations (shooting method)
- Hydrostatic equilibrium profiles
- Simple gravitational lensing
- M-R relation with polytropic EOS
- Special relativity (Lorentz transforms, spacetime diagrams)

**Tier 2: Pre-computed Tables + TS Interpolation**
- Opacity tables (OPAL-like, but simplified)
- Stellar evolution tracks (pre-computed, load as JSON)
- Realistic EOS for compact objects
- Pattern: Python generates tables at build time → JSON → TS interpolates at runtime

**Tier 3: WebAssembly/Pyodide (only if truly needed)**
- Full stellar evolution integration
- TOV with realistic nuclear EOS
- Spectral synthesis with line lists
- Pattern: Lazy-load Pyodide only for "Advanced" layer of specific demos

### Specific Demo Recommendations

#### Hydrostatic Equilibrium (P0)
**Approach: Pure TypeScript**
```
- Shooting method for Lane-Emden (polytropes)
- RK4 integrator, ~1000 radial zones
- Interactive: adjust polytropic index n, watch structure change
- Totally viable at 60fps in TS
```

#### Mass-Radius Relation (P1-P2)
**Approach: Pre-computed + Interpolation**
```
- Build-time: Python script generates M-R tables for various EOS
- Runtime: TS interpolates table, animates curve
- "Advanced" layer: show EOS sensitivity
```

#### TOV Equation / Neutron Stars (P2-P3)
**Approach: Pre-computed OR Pyodide**
```
Option A (recommended): Pre-compute M(R) for several EOS at build time
Option B: Lazy-load Pyodide for interactive EOS exploration
Decision: Start with Option A, add Pyodide later if student research use cases emerge
```

#### Stellar Evolution Tracks (P2-P3)
**Approach: Pre-computed Tables**
```
- MIST/PARSEC tracks already exist as data products
- Load as JSON, interpolate in TS
- Visualization is the hard part, not physics
```

#### N-body Dynamics (P2)
**Approach: TypeScript with Web Workers**
```
- Move physics to Web Worker for UI responsiveness
- Hermite or leapfrog integrator
- N ~ 50-100 bodies at interactive rates
- Use OffscreenCanvas for rendering in worker
```

### Implementation Recommendations

1. **Start with TypeScript** for all new demos — it's sufficient for 90%+ of cases
2. **Add a generic RK4/RK45 integrator** to `packages/physics/` as reusable infrastructure
3. **Pre-compute expensive tables** at build time using Python scripts in `scripts/`
4. **Reserve Pyodide** for genuine graduate-level research exploration features
5. **Use Web Workers** for computationally intensive animations (N-body, radiative transfer viz)

### New Physics Package Infrastructure Needed

To support advanced demos, add to `packages/physics/`:

```
packages/physics/src/
├── integrators/
│   ├── rk4.ts              # Runge-Kutta 4th order
│   ├── rk45.ts             # Adaptive step RK45
│   ├── leapfrog.ts         # Symplectic (for N-body)
│   └── shooting.ts         # Boundary value problems
├── eos/
│   ├── polytrope.ts        # P ∝ ρ^γ
│   ├── idealGas.ts         # P = ρkT/μmₚ
│   └── degenerateElectron.ts # Non-relativistic + relativistic
├── stellarStructure/
│   ├── laneEmden.ts        # Polytropic models
│   ├── hydrostaticProfile.ts
│   └── massRadiusRelation.ts
└── relativity/
    ├── lorentz.ts          # Lorentz transforms
    ├── schwarzschild.ts    # Metric, geodesics
    └── spacetimeDiagram.ts # Light cones, worldlines
```

### Performance Benchmarks (Realistic)

Based on codebase analysis and typical browser performance:

| Computation | N/Complexity | Expected FPS | Notes |
|------------|--------------|--------------|-------|
| Kepler equation solve | 1 solve/frame | 60 fps | Already proven |
| 2-body integration | 100 steps/frame | 60 fps | Trivial |
| Hydrostatic profile | 1000 zones, RK4 | 60 fps | Per frame if needed |
| N-body (N=100) | Leapfrog O(N²) | 60 fps | Main thread OK |
| N-body (N=300) | Leapfrog O(N²) | 60 fps | Worker recommended |
| N-body (N=500) | Leapfrog O(N²) | 30-60 fps | Worker required, decouple physics |
| N-body (N=800) | Leapfrog O(N²) | 15-30 fps | Yellow zone, reduced steps/frame |
| N-body (N>1000) | O(N²) | ❌ | Needs Barnes-Hut — PUNT for Year 1 |
| Stellar evolution | Full track | N/A (pre-compute) | Offline Python → JSON |
| Opacity tables | Interpolation | 60 fps | Pre-compute tables at build time |

### Conclusion

**You do NOT need Python for the vast majority of planned demos.** TypeScript is fully capable of:
- ODE integration (RK4, RK45, shooting methods)
- Root finding (Newton-Raphson, bisection)
- Matrix operations (for linearized problems)
- Interactive animation at 60fps

**Use Python only for:**
- Build-time table generation (offline → JSON)
- Precomputing MIST/PARSEC track data
- Generating opacity tables or EOS curves

**🚫 Explicitly NOT building:**
- MESA.js (stellar evolution solver in-browser)
- Full radiative transfer / spectral synthesis
- High-N N-body with Barnes-Hut (unless serious investment)
- Full GR ray tracing with Kerr metric
- Supernova hydrodynamics

**Next steps:**
1. Build generic integrator infrastructure in `packages/physics/`
2. Prototype hydrostatic equilibrium demo (pure TS)
3. Set up build-time data pipeline (Python → JSON)
4. Keep N-body target at N ≤ 500 for Year 1

---

## Questions for Brainstorming Sessions

1. What misconceptions do you encounter most frequently in your courses?
2. Which topics do students struggle with that aren't covered by existing demos?
3. What demos would you use if they existed but currently don't?
4. Are there physics concepts that would benefit from layered complexity?
5. What topics bridge astronomy and physics courses?
6. What would Fleet Science Center visitors find most engaging?

---

*Add ideas below as they come up:*

## Raw Ideas (Unsorted)

-
-
-

