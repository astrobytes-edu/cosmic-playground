# Feature Specification: Galaxy Merger & Tidal Encounter Demo

**Version:** 1.0
**Author:** Dr. Anna Rosen / Claude
**Date:** February 5, 2026
**Status:** Draft
**Parent PRD:** Galaxies Demo Suite (Demo 7)
**Project:** Cosmic Playground (NSF IUSE Level 2)

---

## Executive Summary

This document specifies a **restricted N-body / test-particle tidal encounter model** for teaching galaxy interactions. Two galaxies are represented by moving analytic gravitational potentials, while "stars" are massless tracer particles that feel both potentials. This approach produces realistic tidal tails, bridges, and stripping without requiring self-gravitating N-body calculations.

**Truth Contract:** This demo teaches tidal dynamics using an honest approximation. It does NOT compute self-gravity between stars, gas dynamics, or star formation—and it should say so explicitly.

---

## 1. Problem Statement

### The User Problem

Students learning about galaxy interactions often see dramatic images of tidal tails (e.g., the Antennae galaxies) without understanding the physics that produces them. Existing educational materials either:

1. Show static images without dynamics
2. Use full N-body simulations that are computationally expensive and hide the essential physics
3. Oversimplify to the point of being misleading

### Who Experiences This Problem

- **Primary:** Undergraduate astronomy majors in extragalactic/galaxies courses
- **Secondary:** Graduate students reviewing dynamics, instructors needing visualization tools
- **Frequency:** Every semester, ~50 students per institution

### Cost of Not Solving

- Students memorize "mergers make ellipticals" without understanding why
- No intuition for tidal stripping, dynamical friction, or disk orientation effects
- Miss the key insight: geometry (prograde vs retrograde) determines tail morphology

---

## 2. Goals

### User Goals

| Goal | Success Metric |
|------|----------------|
| **G1:** Understand tidal forces produce tails/bridges | >80% correctly identify which regions of a disk will form tails |
| **G2:** Discover prograde vs retrograde asymmetry | >70% predict longer tails for prograde before being told |
| **G3:** Connect mass ratio to tidal strength | Students can explain why minor mergers strip while major mergers destroy |
| **G4:** Understand dynamical friction causes orbital decay | >75% can explain why satellite galaxies spiral in |

### Technical Goals

| Goal | Metric |
|------|--------|
| **T1:** Performance | 20,000 tracers at 30+ fps |
| **T2:** Stability | Isolated disk maintains structure for >50 orbital periods |
| **T3:** Determinism | Identical seed → identical evolution |

---

## 3. Non-Goals (Truth Contract)

This demo explicitly does **NOT** compute:

| Excluded | Why | Honest Alternative |
|----------|-----|-------------------|
| Self-gravity between stars | Would require $O(N^2)$ or tree code | Analytic potentials + test particles |
| Spiral arm formation | Requires self-gravity + swing amplification | Static disk structure |
| Gas dynamics / hydrodynamics | Would need SPH or grid code | Mention in "what's missing" panel |
| Star formation triggering | Requires gas physics | Show SFR indicator based on compression proxy |
| Violent relaxation | Requires self-gravity | Phase mixing only |

**UI Requirement:** Include a "What This Demo Shows vs. What's Real" panel that honestly states these limitations.

---

## 4. Physics Model

### 4.1 Potential Models

#### Primary: Logarithmic Halo (Flat Rotation Curve)

The default potential for pedagogical clarity:

$$\Phi_{\log}(r) = \frac{1}{2} v_0^2 \ln(r_c^2 + r^2)$$

**Acceleration:**
$$\mathbf{a}(r) = -\nabla\Phi = -\frac{v_0^2}{r_c^2 + r^2} \mathbf{r}$$

**Circular velocity:**
$$v_c^2(r) = r \frac{d\Phi}{dr} = v_0^2 \frac{r^2}{r_c^2 + r^2} \quad \Rightarrow \quad v_c \to v_0 \text{ for } r \gg r_c$$

**Why this works:** Students see a flat rotation curve without needing to derive dark matter profiles inside this demo.

#### Alternative Models (Advanced Toggles)

**Plummer (softened point mass / core):**
$$\Phi_{\rm Plummer} = -\frac{GM}{\sqrt{r^2 + b^2}}$$

$$\mathbf{a} = -GM \frac{\mathbf{r}}{(r^2 + b^2)^{3/2}}$$

$$v_c^2(r) = GM \frac{r^2}{(r^2 + b^2)^{3/2}}$$

**Hernquist (bulge-like, realistic profile):**
$$\Phi_{\rm Hernquist} = -\frac{GM}{r + a}$$

$$\mathbf{a} = -GM \frac{\mathbf{r}}{r(r + a)^2}$$

$$v_c^2(r) = GM \frac{r}{(r + a)^2}$$

**Composite model (v1.1):**
$$\Phi_{\rm gal} = \Phi_{\log} + \Phi_{\rm Hernquist} \quad \text{(flat halo + central bulge)}$$

### 4.2 Galaxy Center Dynamics

The two galaxy centers move as softened point masses:

$$\ddot{\mathbf{r}}_1 = -GM_2 \frac{\mathbf{r}_{12}}{(r_{12}^2 + \epsilon^2)^{3/2}} + \mathbf{a}_{\rm df,1}$$

$$\ddot{\mathbf{r}}_2 = +GM_1 \frac{\mathbf{r}_{12}}{(r_{12}^2 + \epsilon^2)^{3/2}} + \mathbf{a}_{\rm df,2}$$

where $\mathbf{r}_{12} = \mathbf{r}_1 - \mathbf{r}_2$ and $\epsilon$ is a softening length.

**Dynamical Friction (Pedagogical v1):**

Use a simple drag term that teaches orbital decay qualitatively:

$$\mathbf{a}_{\rm df,1} = -\gamma (\mathbf{v}_1 - \mathbf{v}_2)$$

$$\mathbf{a}_{\rm df,2} = +\gamma (\mathbf{v}_1 - \mathbf{v}_2) \frac{M_1}{M_2}$$

where $\gamma$ is a user-controlled friction strength.

**Why:** Stable, obvious, and lets students see "orbit decays → merger" without getting lost in Coulomb logarithms.

**Advanced Toggle (P2):** Replace with Chandrasekhar-like formula:
$$\mathbf{a}_{\rm df} = -\frac{4\pi G^2 M_{\rm sat}^2 \ln\Lambda \, \rho(<v)}{v^2} \hat{v}$$

### 4.3 Tracer Particle Dynamics

Massless tracer "stars" feel both galaxy potentials:

$$\ddot{\mathbf{x}}_i = -\nabla\Phi_1(\mathbf{x}_i - \mathbf{r}_1(t)) - \nabla\Phi_2(\mathbf{x}_i - \mathbf{r}_2(t))$$

This is $O(N)$ per timestep—each tracer evaluates 2 potentials (cheap math), no $N^2$ interactions.

---

## 5. Initial Conditions

### 5.1 Disk Tracer Sampling

Sample tracers from an exponential disk surface density:
$$\Sigma(R) \propto e^{-R/R_d}$$

The radial PDF is $p(R) \propto R e^{-R/R_d}$ (Gamma distribution with $k=2$).

**Fast sampling algorithm:**
```
draw u₁, u₂ ~ U(0,1)
R = -R_d × ln(u₁ × u₂)
φ ~ U(0, 2π)
x = R cos(φ)
y = R sin(φ)
```

Optional: truncate at $R_{\max} \sim 5R_d$ for visuals/performance.

### 5.2 Velocity Initialization

Each tracer receives the local circular velocity plus thermal "heat":

**Circular velocity (from galaxy's own potential):**
$$v_\phi(R) = v_c(R)$$

**Velocity components:**
$$v_x = -v_\phi \sin\phi + v_R \cos\phi$$
$$v_y = +v_\phi \cos\phi + v_R \sin\phi$$

where:
- $v_R \sim \mathcal{N}(0, \sigma_R)$ — radial velocity dispersion
- $v_\phi \sim v_\phi + \mathcal{N}(0, \sigma_\phi)$ — azimuthal dispersion

**Disk "temperature" slider:** Controls $\sigma_R$ and $\sigma_\phi$.

**Pedagogical insight:** "Cold disks make long tails; hot disks smear out."

### 5.3 Orbit Initialization

Work in barycentric coordinates. User controls:
- Initial separation $d_0$
- Pericenter proxy (impact parameter)
- Encounter speed $v_0$

**Simple robust setup:**
$$\mathbf{r}_1 = (-d_0/2, 0), \quad \mathbf{r}_2 = (+d_0/2, 0)$$
$$\mathbf{v}_1 = (0, +v_0/2), \quad \mathbf{v}_2 = (0, -v_0/2)$$

Impact parameter: offset initial $y$ positions or add $x$-component to velocity.

**User-facing labels:**
- "Closest approach" (pericenter proxy)
- "Flyby speed"
- "Mass ratio"

Students don't need orbital elements; they need cause → effect.

### 5.4 Prograde vs Retrograde

The deepest lesson in tidal tails is disk orientation.

**2D Implementation:**
- **Prograde:** disk rotation same direction as orbital motion ($v_\phi > 0$)
- **Retrograde:** disk rotation opposite to orbital motion ($v_\phi < 0$, sign flip)

**3D Extension (v1.1):** Allow disk inclination $i$ and line of nodes $\Omega$. Rotation matrix:
$$\mathbf{R}_{\rm disk} = \mathbf{R}_z(\Omega) \cdot \mathbf{R}_x(i)$$

This produces the famous tail asymmetry effect.

---

## 6. Time Integration

### 6.1 Leapfrog / Velocity Verlet (Kick-Drift-Kick)

Symplectic integrator for long-term stability:

```
1. Compute acceleration a(t) at current positions
2. KICK: v ← v + (Δt/2) × a
3. DRIFT: x ← x + Δt × v
4. Recompute acceleration at new positions
5. KICK: v ← v + (Δt/2) × a_new
```

**Apply to:**
- Galaxy centers: use softened point-mass + friction acceleration
- Tracer particles: use sum of both galaxy potentials

### 6.2 Timestep Selection

Define dynamical time at disk scale length:
$$t_0 \sim \frac{R_d}{v_0}$$

Safe timestep: $\Delta t \approx 0.01 \times t_0$

**Quality slider maps to substeps:**
- "Fast": larger $\Delta t$, fewer substeps per render frame
- "Accurate": smaller $\Delta t$, more substeps

### 6.3 Adaptive Considerations

For close passages, consider:
$$\Delta t_{\rm safe} = \min\left(\frac{r_{12}}{10 \times |\mathbf{v}_{\rm rel}|}, \Delta t_{\rm default}\right)$$

---

## 7. Pedagogical Overlays

### 7.1 Tidal Strength Indicator

For a perturber at separation $d$, tidal acceleration across a disk of size $R$:
$$a_{\rm tidal} \sim \frac{2GM_2 R}{d^3}$$

**Dimensionless tidal parameter:**
$$\mathcal{T} = \left(\frac{M_2}{M_1}\right) \left(\frac{R}{d}\right)^3$$

Display $\mathcal{T}(t)$ as a time series; highlight peak near pericenter.

### 7.2 Tidal Radius Circle

Roche-like estimate:
$$r_t \approx d \left(\frac{M_1}{2M_2}\right)^{1/3}$$

Draw $r_t$ as a circle around each galaxy center. Stars beyond $r_t$ are vulnerable to stripping.

### 7.3 Bound vs Unbound Classification

Compute each tracer's energy relative to its parent galaxy (in galaxy's moving frame):

$$E_i = \frac{1}{2}|\mathbf{v}_i - \mathbf{v}_{\rm gal}|^2 + \Phi_{\rm parent}(|\mathbf{x}_i - \mathbf{r}_{\rm gal}|)$$

- If $E_i > 0$: unbound (color change, e.g., red)
- If $E_i < 0$: bound (color by parent galaxy, e.g., blue/orange)

**Pedagogically delicious:** Students see stars become unbound in real time.

### 7.4 Separation vs Time Plot

Show $r_{12}(t)$ with:
- Current time marker
- Pericenter passages highlighted
- Merger time (when $r_{12} < \epsilon_{\rm merge}$)

### 7.5 "Prograde vs Retrograde" Side-by-Side

Split view showing same encounter with different disk orientations. This is the most dramatic and clean lesson.

---

## 8. User Stories & Acceptance Criteria

### Story 1: Basic Encounter Visualization

> **As a** student learning about galaxy interactions,
> **I want to** see two galaxies approach each other and watch tidal tails form,
> **so that** I understand how gravity at a distance can distort galaxy structure.

**Acceptance Criteria:**
- [ ] Two galaxies rendered with distinct colors (e.g., blue and orange tracers)
- [ ] Galaxy centers marked and optionally trail their paths
- [ ] Tidal tails visibly form during close passage
- [ ] Smooth animation at 30+ fps with 10,000+ total tracers
- [ ] Time controls: play, pause, step forward/backward, speed slider

### Story 2: Parameter Exploration

> **As a** student exploring parameter space,
> **I want to** adjust mass ratio, encounter speed, and impact parameter,
> **so that** I can discover how these affect the outcome (flyby vs capture, tail length, stripping).

**Acceptance Criteria:**
- [ ] Sliders for: mass ratio $M_2/M_1$ (0.1–1), pericenter distance, flyby speed, friction strength
- [ ] Disk temperature slider (cold → hot dispersion)
- [ ] Changes trigger new simulation (with confirmation if mid-run)
- [ ] Reset button restores default parameters

### Story 3: Prograde vs Retrograde Comparison

> **As a** student learning about disk orientation effects,
> **I want to** see the same encounter with prograde vs retrograde disks side-by-side,
> **so that** I understand why disk orientation determines tail morphology.

**Acceptance Criteria:**
- [ ] Preset: "Prograde vs Retrograde comparison"
- [ ] Split-screen or tabbed view showing both simultaneously
- [ ] Identical parameters except disk rotation direction
- [ ] Pedagogical callout explaining the difference

### Story 4: Diagnostic Overlays

> **As a** student trying to understand the physics,
> **I want to** see visual indicators of tidal strength, tidal radius, and bound/unbound particles,
> **so that** I can connect the math to what I'm seeing.

**Acceptance Criteria:**
- [ ] Toggle: tidal radius circles around each galaxy
- [ ] Toggle: bound (blue) vs unbound (red) particle coloring
- [ ] Time series panel: separation $r_{12}(t)$ and tidal parameter $\mathcal{T}(t)$
- [ ] Pericenter passages marked on timeline

### Story 5: Preset Library

> **As an** instructor preparing a demonstration,
> **I want to** quickly load classic encounter types,
> **so that** I can show specific physics without fiddling with parameters.

**Acceptance Criteria:**
- [ ] Presets include:
  - Major merger (equal mass, prograde-prograde)
  - Minor merger (10:1 mass ratio)
  - Flyby (high speed, no capture)
  - Antennae-like (intermediate, prograde-prograde)
  - Milky Way–LMC-like
  - Retrograde encounter
- [ ] Each preset has a 1-sentence description

### Story 6: Honesty Panel

> **As a** student who should understand limitations,
> **I want to** see what this demo does and doesn't simulate,
> **so that** I don't over-interpret the results.

**Acceptance Criteria:**
- [ ] "What This Demo Shows" panel accessible from UI
- [ ] Lists: tidal tails ✓, stripping ✓, dynamical friction ✓
- [ ] Lists: self-gravity ✗, gas dynamics ✗, star formation ✗
- [ ] Brief explanation of why each is included/excluded

---

## 9. Requirements

### Must-Have (P0)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P0-1** | Two galaxies with analytic potentials | Logarithmic halo default; acceleration matches analytic formula |
| **P0-2** | Two-body orbit integration with softening | Centers orbit correctly; energy bounded (no friction) |
| **P0-3** | Disk tracer initialization with circular orbits | Isolated disk stable for >50 orbits (90% particles within ±10% of initial radius) |
| **P0-4** | Leapfrog integration | Symplectic; energy drift < 1% over test run |
| **P0-5** | Visual rendering | Stars, centers, optional trails; WebGL or Canvas 2D |
| **P0-6** | Core controls | Mass ratio, pericenter, flyby speed, disk temperature, friction |
| **P0-7** | Tidal overlays | Separation vs time, tidal strength $\mathcal{T}(t)$, tidal radius circles |
| **P0-8** | Preset library | At least 4 presets (major merger, minor merger, flyby, retrograde) |
| **P0-9** | Performance | 20,000 tracers at 30+ fps |
| **P0-10** | Determinism | Seeded RNG; identical seed → identical evolution |

### Should-Have (P1)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **P1-1** | Bound/unbound particle coloring | Energy calculation correct; real-time color updates |
| **P1-2** | Prograde vs retrograde comparison view | Side-by-side or toggle |
| **P1-3** | Alternative potential models | Plummer, Hernquist as toggles |
| **P1-4** | 3D with disk inclination | Rotation matrix for disk orientation |
| **P1-5** | Honesty panel | What's simulated vs what's not |
| **P1-6** | Export | Particle positions/velocities as CSV or JSON |
| **P1-7** | Starburst indicator | Proxy based on central compression |

### Could-Have (P2)

| ID | Requirement | Rationale |
|----|-------------|-----------|
| **P2-1** | Chandrasekhar dynamical friction | More realistic orbital decay |
| **P2-2** | Composite potential (halo + bulge) | Realistic rotation curves |
| **P2-3** | Multiple encounters | Three-body interactions |
| **P2-4** | VR mode | Immersive visualization |

---

## 10. Technical Architecture

### 10.1 Package Structure

```
packages/galaxies/interactions/
├── potentials/
│   ├── logarithmic.ts      # Φ_log, v_c, acceleration
│   ├── plummer.ts          # Φ_Plummer
│   ├── hernquist.ts        # Φ_Hernquist
│   └── composite.ts        # Sum of components
├── initialization/
│   ├── diskSampling.ts     # Exponential disk tracer positions
│   ├── velocityInit.ts     # Circular + dispersion
│   ├── orbitSetup.ts       # Galaxy center initial conditions
│   └── presets.ts          # Preset parameter sets
├── integration/
│   ├── leapfrog.ts         # KDK integrator
│   ├── acceleration.ts     # Tracer + center forces
│   └── dynamicalFriction.ts # Friction model
├── diagnostics/
│   ├── tidalParameter.ts   # T(t) calculation
│   ├── tidalRadius.ts      # r_t estimate
│   ├── boundEnergy.ts      # E_i for each tracer
│   └── separation.ts       # r_12(t) tracking
├── worker/
│   ├── simulationWorker.ts # WebWorker for physics
│   └── messageProtocol.ts  # Main ↔ worker communication
└── validation/
    ├── isolatedDiskStability.test.ts
    ├── energyConservation.test.ts
    └── proRetroComparison.test.ts
```

### 10.2 Data Structures

```typescript
// Typed arrays for performance
interface SimulationState {
  // Tracer particles
  positions: Float32Array;    // [x1,y1,z1, x2,y2,z2, ...] length 3N
  velocities: Float32Array;   // [vx1,vy1,vz1, ...] length 3N
  parentGalaxy: Uint8Array;   // [0,0,1,1,0,...] length N (which galaxy owns each)
  boundFlag: Uint8Array;      // [1,1,0,1,...] length N (1=bound, 0=unbound)

  // Galaxy centers
  centerPositions: Float64Array;   // [x1,y1,z1, x2,y2,z2] length 6
  centerVelocities: Float64Array;  // [vx1,vy1,vz1, ...] length 6

  // Simulation metadata
  time: number;
  seed: number;
  params: SimulationParams;
}

interface SimulationParams {
  // Galaxy 1
  M1: number;           // mass [code units]
  v0_1: number;         // rotation velocity scale
  rc_1: number;         // core radius
  Rd_1: number;         // disk scale length
  N1: number;           // number of tracers

  // Galaxy 2 (similar)
  M2: number;
  v0_2: number;
  rc_2: number;
  Rd_2: number;
  N2: number;

  // Orbit
  d0: number;           // initial separation
  v_encounter: number;  // encounter speed
  impact_param: number; // impact parameter

  // Physics
  gamma: number;        // friction strength
  sigma_R: number;      // radial dispersion
  sigma_phi: number;    // azimuthal dispersion
  softening: number;    // center softening

  // Integration
  dt: number;           // timestep
  substeps: number;     // substeps per render frame
}
```

### 10.3 Worker Architecture

```typescript
// Main thread
const worker = new Worker(new URL('./simulationWorker.ts', import.meta.url));

worker.postMessage({
  type: 'INITIALIZE',
  params: simulationParams,
  seed: 42
});

worker.postMessage({ type: 'STEP', frames: 1 });

worker.onmessage = (e) => {
  if (e.data.type === 'STATE_UPDATE') {
    renderParticles(e.data.positions, e.data.boundFlag);
    updateDiagnostics(e.data.diagnostics);
  }
};

// Worker (simulationWorker.ts)
let state: SimulationState;

self.onmessage = (e) => {
  switch (e.data.type) {
    case 'INITIALIZE':
      state = initializeSimulation(e.data.params, e.data.seed);
      break;
    case 'STEP':
      for (let i = 0; i < e.data.frames * state.params.substeps; i++) {
        leapfrogStep(state);
      }
      updateDiagnostics(state);
      self.postMessage({
        type: 'STATE_UPDATE',
        positions: state.positions,  // Transfer, not copy
        boundFlag: state.boundFlag,
        diagnostics: computeDiagnostics(state)
      });
      break;
  }
};
```

### 10.4 Rendering (WebGL or Canvas 2D)

**WebGL approach (recommended for N > 5000):**
- Point sprites for tracer particles
- Color by parent galaxy + bound/unbound
- Lines for galaxy center trails

**Canvas 2D fallback:**
- Batch draw calls
- Skip rendering off-screen particles

---

## 11. Validation Tests

### 11.1 Isolated Disk Stability

**Test:** Initialize single galaxy, no perturber, integrate for 50 orbital periods at $R_d$.

**Pass criteria:**
- >90% of tracers remain within ±10% of initial radius (cold disk, $\sigma = 0$)
- >80% remain for warm disk ($\sigma_R = 0.1 v_c$)

### 11.2 Energy Conservation (No Friction)

**Test:** Two-galaxy system with $\gamma = 0$, compute total energy:
$$E_{\rm tot} = E_{\rm kin,centers} + E_{\rm pot,centers} + \sum_i E_{\rm tracer,i}$$

**Pass criteria:**
- $|E(t) - E(0)| / |E(0)| < 0.01$ over 10 crossing times

### 11.3 Prograde vs Retrograde Tail Asymmetry

**Test:** Same encounter parameters, flip disk rotation sign.

**Pass criteria (qualitative):**
- Prograde encounter produces longer, more pronounced tidal tails
- Visual inspection matches expectations from Toomre & Toomre (1972)

### 11.4 Bound Fraction Evolution

**Test:** Track fraction of bound particles vs time.

**Pass criteria:**
- Bound fraction decreases during pericenter passage
- Rate of unbinding increases with tidal parameter $\mathcal{T}$

---

## 12. Performance Budget

| Component | Target | Notes |
|-----------|--------|-------|
| Tracer count | 20,000 total | 10k per galaxy typical |
| Frame rate | 30+ fps | With diagnostics enabled |
| Integration step | <5ms per substep | For 20k particles |
| Render | <16ms per frame | WebGL point sprites |
| Worker communication | <2ms per frame | Transfer arrays, not copy |

**Scaling:**
- $O(N)$ per timestep (each tracer evaluates 2 potentials)
- Memory: ~400KB for 20k particles (positions + velocities + flags)

---

## 13. Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 1 week | Potential models + disk initialization + stability tests |
| **Phase 2** | 1 week | Two-body orbit integration + friction + leapfrog |
| **Phase 3** | 0.5 weeks | WebWorker architecture + main↔worker protocol |
| **Phase 4** | 1 week | Rendering (WebGL) + UI controls + presets |
| **Phase 5** | 0.5 weeks | Diagnostics overlays + comparison view |
| **Phase 6** | 0.5 weeks | Validation tests + polish |

**Total:** ~4.5 weeks

---

## 14. Open Questions

| Question | Owner | Notes |
|----------|-------|-------|
| **Q1:** 2D or 3D for v1? | Design | 2D simpler; 3D more realistic for inclination effects |
| **Q2:** WebGL vs Canvas 2D? | Engineering | WebGL for >5k particles; Canvas 2D as fallback |
| **Q3:** Code units vs physical units? | Physics | Internal: code units ($G=1$); display: physical (kpc, km/s) |

---

## 15. Appendix: Key Equations Reference

### Logarithmic Potential

$$\Phi_{\log}(r) = \frac{1}{2}v_0^2 \ln(r_c^2 + r^2)$$

$$v_c(r) = v_0 \sqrt{\frac{r^2}{r_c^2 + r^2}}$$

### Tidal Parameter

$$\mathcal{T} = \left(\frac{M_2}{M_1}\right)\left(\frac{R}{d}\right)^3$$

### Tidal Radius

$$r_t \approx d \left(\frac{M_1}{2M_2}\right)^{1/3}$$

### Tracer Binding Energy

$$E_i = \frac{1}{2}|\mathbf{v}_i - \mathbf{v}_{\rm gal}|^2 + \Phi_{\rm parent}(|\mathbf{x}_i - \mathbf{r}_{\rm gal}|)$$

### Dynamical Friction (Pedagogical)

$$\mathbf{a}_{\rm df} = -\gamma \, \mathbf{v}_{\rm rel}$$

### Leapfrog (KDK)

$$\mathbf{v}_{n+1/2} = \mathbf{v}_n + \frac{\Delta t}{2} \mathbf{a}_n$$
$$\mathbf{x}_{n+1} = \mathbf{x}_n + \Delta t \, \mathbf{v}_{n+1/2}$$
$$\mathbf{v}_{n+1} = \mathbf{v}_{n+1/2} + \frac{\Delta t}{2} \mathbf{a}_{n+1}$$

---

## 16. References

1. Toomre, A. & Toomre, J. (1972). Galactic Bridges and Tails. *ApJ*, 178, 623.
2. Barnes, J. E. & Hernquist, L. (1992). Dynamics of interacting galaxies. *ARA&A*, 30, 705.
3. Binney, J. & Tremaine, S. (2008). *Galactic Dynamics*, 2nd ed. Princeton.
4. Springel, V. & White, S. D. M. (1999). Tidal tails in CDM cosmologies. *MNRAS*, 307, 162.

---

*Feature specification for Cosmic Playground Galaxy Merger Demo (Demo 7 of Galaxies Suite)*
