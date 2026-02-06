# Cosmic Playground: Technical Architecture & Capabilities

*A guide to state-of-the-art web technologies for physics simulations*

**Created:** February 2026
**Purpose:** Technical reference for building advanced interactive astronomy demos
**Audience:** Developers new to TypeScript/web development who want research-grade simulations

---

## ⚠️ Scope Expectations: What "Research-Grade" Means

**"Research-grade" means validated, transparent, and pedagogically sound — NOT "HPC in Safari."**

### What We CAN Do Well
- Pure TypeScript physics models with unit tests and validation oracles
- Canvas 2D / WebGL / Three.js for interactive visualization
- Web Workers for responsive UI during computation
- N-body with N ≤ 500-800 at 60fps (direct summation)
- Precomputed data-driven demos (H-R diagrams, stellar tracks, spectra)
- Thin-lens / approximate visualizations that capture the pedagogy

### What We're NOT Doing (🚫 PUNT)
| Feature | Why PUNT | Alternative |
|---------|----------|-------------|
| Full MESA-like stellar evolution | Maintenance nightmare | Use precomputed MIST/PARSEC tracks |
| Full radiative transfer | Wrong tool for the job | Use curated spectra + simplified models |
| High-N N-body (N > 1000) | Needs Barnes-Hut (significant effort) | Target N ≤ 500-800 for Year 1-2 |
| Full GR ray tracing (Kerr) | Months of work, fragile | Thin-lens approximation with caveats |
| Supernova hydrodynamics | Research code, not a demo | Conceptual animation + precomputed yields |

**Key insight:** TypeScript is sufficient for 90%+ of demos. The browser is powerful, but we respect its limits.

---

## Table of Contents

1. [What's Possible in Modern Browsers](#whats-possible-in-modern-browsers)
2. [Technology Stack Overview](#technology-stack-overview)
3. [Rendering Technologies](#rendering-technologies)
4. [Compute Technologies](#compute-technologies)
5. [Numerical Methods in TypeScript](#numerical-methods-in-typescript)
6. [Demo-Specific Architecture](#demo-specific-architecture)
7. [Performance Optimization Patterns](#performance-optimization-patterns)
8. [Research-Grade Quality Requirements](#research-grade-quality-requirements)
   - [Validation & Test Oracles](#validation--test-oracles)
   - [Determinism & Reproducibility](#determinism--reproducibility)
   - [Precision Considerations](#precision-considerations-float32-vs-float64)
   - [Mobile & Low-Power Constraints](#mobile--low-power-constraints)
9. [Deployment Constraints](#deployment-constraints)
10. [State-of-the-Art Examples](#state-of-the-art-examples)
11. [Recommended Libraries](#recommended-libraries)
12. [Implementation Roadmap](#implementation-roadmap)

---

## What's Possible in Modern Browsers

Modern browsers are **shockingly powerful**. You can build:

| Capability | Technology | Performance |
|------------|------------|-------------|
| **GPU-accelerated graphics** | WebGL 2.0, WebGPU | Millions of particles at 60fps |
| **Parallel computation** | Web Workers, WebGPU Compute | Multi-threaded physics |
| **3D visualization** | Three.js, Babylon.js | Game-quality rendering |
| **Real-time N-body** | Web Workers + GPU | N ≤ 500-800 (direct sum), tree methods PUNT for Year 1 |
| **Scientific visualization** | D3.js, Plotly, custom WebGL | Publication-quality plots |
| **Interactive 3D spacetime** | Custom shaders | Black hole lensing (thin-lens approx, NOT full ray tracing) |

**Key insight:** The browser is no longer "just for websites." It's a cross-platform runtime with GPU access, threading, and near-native performance.

---

## Technology Stack Overview

### Current Cosmic Playground Stack

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
├─────────────────────────────────────────────────────────┤
│  apps/demos/          │  apps/site/                     │
│  ├── Vite (bundler)   │  ├── Astro (static site gen)   │
│  ├── TypeScript       │  ├── Content collections       │
│  └── Canvas 2D        │  └── Markdown + KaTeX          │
├─────────────────────────────────────────────────────────┤
│  packages/physics/    │  packages/runtime/              │
│  ├── Pure TS models   │  ├── Demo modes                │
│  ├── Unit tests       │  ├── Export/copy               │
│  └── No DOM deps      │  └── Accessibility             │
└─────────────────────────────────────────────────────────┘
```

### Enhanced Stack for Advanced Demos

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
├─────────────────────────────────────────────────────────┤
│  Rendering Layer                                         │
│  ├── Canvas 2D (simple demos)                           │
│  ├── WebGL 2.0 / Three.js (3D, particles, shaders)     │
│  └── WebGPU (future: compute + render)                  │
├─────────────────────────────────────────────────────────┤
│  Compute Layer                                           │
│  ├── Main thread (simple physics)                       │
│  ├── Web Workers (parallel physics, keeps UI responsive)│
│  └── GPU Compute Shaders (massive parallelism)          │
├─────────────────────────────────────────────────────────┤
│  Physics Layer                                           │
│  ├── packages/physics/ (pure TS, testable)              │
│  ├── packages/integrators/ (ODE solvers)                │
│  └── packages/nbody/ (optimized N-body)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Rendering Technologies

### Canvas 2D (Current)

**Best for:** Simple 2D animations, orbit diagrams, plots

```typescript
// Current pattern in Cosmic Playground
const ctx = canvas.getContext('2d');
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
```

**Limits:** Single-threaded, CPU-bound, ~10,000 draw calls/frame max

### WebGL 2.0 (Recommended for Advanced Demos)

**Best for:** Particle systems, 3D visualization, shader effects

```typescript
// Render 100,000 stars as points
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const material = new THREE.PointsMaterial({ size: 2, vertexColors: true });
const stars = new THREE.Points(geometry, material);
scene.add(stars);
```

**Performance:** 100,000+ particles at 60fps easily

**⚠️ WebGL Shader Limitations:**
- WebGL supports **vertex + fragment shaders only**
- **No geometry shaders** (unlike desktop OpenGL)
- **No tessellation shaders**
- For trails/ribbons: use instanced line segments, history buffers, or CPU-generated geometry

### WebGPU (Cutting Edge - 2025+)

**Best for:** Compute shaders, next-gen graphics, massive parallelism

```typescript
// WebGPU compute shader for N-body (direct sum - O(N²))
// NOTE: This naive all-pairs loop is O(N²). For N > ~5000,
// you need tree methods (Barnes-Hut) or mesh-based approaches.
const shaderModule = device.createShaderModule({
  code: `
    @compute @workgroup_size(256)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let i = id.x;
      var acc = vec3<f32>(0.0);
      for (var j = 0u; j < N; j++) {
        if (i != j) {
          let r = positions[j] - positions[i];
          let d = length(r) + softening;
          acc += masses[j] * r / (d * d * d);
        }
      }
      velocities[i] += acc * dt;
    }
  `
});
```

**Performance Reality Check:**

| N (bodies) | Algorithm | GPU Performance |
|------------|-----------|-----------------|
| 1,000 | Direct sum O(N²) | 60 fps ✅ |
| 5,000 | Direct sum O(N²) | 60 fps ✅ |
| 10,000 | Direct sum O(N²) | 15-30 fps ⚠️ |
| 100,000 | Direct sum O(N²) | < 1 fps ❌ |
| 100,000 | Barnes-Hut O(N log N) | 30-60 fps ✅ |
| 100,000+ | Particles (non-gravitational) | 60 fps ✅ |

**Key insight:** WebGPU eliminates constant factors, not algorithmic complexity. For N > 10,000 with all-pairs gravity, you MUST use tree codes (Barnes-Hut, FMM) or approximate methods.

**Browser Support (as of Feb 2026):**
- Chrome/Edge: v113+ (stable)
- Firefox: v141+ on Windows (rolling out to other platforms)
- Safari: macOS/iOS family 26+ (not "Safari 18" — version numbering changed)
- See [WebGPU Implementation Status](https://github.com/nicg/nicgwebgpu/wiki/Implementation-Status) for current matrix

---

## Compute Technologies

### Main Thread (Simple)

```typescript
// Fine for N < 100, simple physics
function updatePhysics(bodies: Body[], dt: number) {
  for (const body of bodies) {
    body.position.add(body.velocity.clone().multiplyScalar(dt));
  }
}
```

### Web Workers (Parallel, Keeps UI Responsive)

```typescript
// main.ts
const worker = new Worker('physics-worker.ts', { type: 'module' });
worker.postMessage({ type: 'init', bodies: initialState });
worker.onmessage = (e) => {
  if (e.data.type === 'frame') {
    renderBodies(e.data.positions);
  }
};

// physics-worker.ts
self.onmessage = (e) => {
  if (e.data.type === 'init') {
    let bodies = e.data.bodies;
    function simulate() {
      bodies = integrateStep(bodies, dt);
      self.postMessage({ type: 'frame', positions: extractPositions(bodies) });
      setTimeout(simulate, 16); // ~60fps
    }
    simulate();
  }
};
```

**Key benefit:** Physics runs in background, UI stays responsive

### GPU Compute (Maximum Performance)

For N-body with N > 1000, GPU compute helps — but algorithms still matter:

| N (bodies) | CPU (main) | Web Worker | GPU (Direct Sum) | GPU (Tree) |
|------------|------------|------------|------------------|------------|
| 100 | 60 fps | 60 fps | 60 fps | 60 fps |
| 1,000 | 15 fps | 30 fps | 60 fps | 60 fps |
| 5,000 | 0.5 fps | 2 fps | 60 fps | 60 fps |
| 10,000 | — | 0.3 fps | 15-30 fps | 60 fps |
| 100,000 | — | — | < 1 fps ❌ | 30-60 fps |

**⚠️ Important:** The "GPU = magic" claim is misleading. Direct summation is O(N²) regardless of hardware. For N > 10,000 gravitational bodies at interactive rates, you need:
- **Barnes-Hut tree** (O(N log N)) — moderate implementation effort
- **Fast Multipole Method** (O(N)) — significant implementation effort
- **Particle-Mesh** (O(N log N)) — good for cosmological sims

For **non-gravitational particles** (e.g., velocity fields, noise-driven motion), 100k+ at 60fps is easy.

---

## Numerical Methods in TypeScript

### ODE Integrators

**Runge-Kutta 4 (RK4)** — Workhorse for most problems

```typescript
// packages/integrators/rk4.ts
export function rk4<State>(
  y: State,
  dydt: (y: State, t: number) => State,
  t: number,
  dt: number,
  add: (a: State, b: State) => State,
  scale: (a: State, s: number) => State
): State {
  const k1 = dydt(y, t);
  const k2 = dydt(add(y, scale(k1, 0.5 * dt)), t + 0.5 * dt);
  const k3 = dydt(add(y, scale(k2, 0.5 * dt)), t + 0.5 * dt);
  const k4 = dydt(add(y, scale(k3, dt)), t + dt);

  return add(y, scale(
    add(k1, add(scale(k2, 2), add(scale(k3, 2), k4))),
    dt / 6
  ));
}
```

**Leapfrog/Verlet** — Symplectic, conserves energy for N-body

```typescript
// packages/integrators/leapfrog.ts
export function leapfrogKickDriftKick(
  positions: Float32Array,
  velocities: Float32Array,
  masses: Float32Array,
  dt: number,
  computeAccelerations: (pos: Float32Array) => Float32Array
): void {
  const n = positions.length / 3;

  // Half kick
  const acc1 = computeAccelerations(positions);
  for (let i = 0; i < n * 3; i++) {
    velocities[i] += 0.5 * dt * acc1[i];
  }

  // Full drift
  for (let i = 0; i < n * 3; i++) {
    positions[i] += dt * velocities[i];
  }

  // Half kick
  const acc2 = computeAccelerations(positions);
  for (let i = 0; i < n * 3; i++) {
    velocities[i] += 0.5 * dt * acc2[i];
  }
}
```

### N-Body Acceleration (Direct Summation)

```typescript
// packages/nbody/directSum.ts
export function computeAccelerations(
  positions: Float32Array,
  masses: Float32Array,
  softening: number = 0.01
): Float32Array {
  const n = positions.length / 3;
  const acc = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    const ix = i * 3, iy = ix + 1, iz = ix + 2;
    let ax = 0, ay = 0, az = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const jx = j * 3, jy = jx + 1, jz = jx + 2;

      const dx = positions[jx] - positions[ix];
      const dy = positions[jy] - positions[iy];
      const dz = positions[jz] - positions[iz];

      const r2 = dx*dx + dy*dy + dz*dz + softening*softening;
      const r = Math.sqrt(r2);
      const f = masses[j] / (r2 * r); // G = 1 in natural units

      ax += f * dx;
      ay += f * dy;
      az += f * dz;
    }

    acc[ix] = ax;
    acc[iy] = ay;
    acc[iz] = az;
  }

  return acc;
}
```

### Barnes-Hut Tree (O(N log N) for large N) — 🚫 PUNT for Year 1-2

For N > 1000, tree-based methods become necessary. **This is significant implementation effort and is PUNT for Year 1-2.** Included here for reference:

```typescript
// packages/nbody/barnesHut.ts (sketch)
class OctreeNode {
  centerOfMass: Vec3;
  totalMass: number;
  children: OctreeNode[] | null;
  body: Body | null;

  computeForce(target: Body, theta: number = 0.5): Vec3 {
    if (this.body === target) return Vec3.zero();

    const d = this.centerOfMass.distanceTo(target.position);
    const s = this.size;

    if (this.children === null || s / d < theta) {
      // Treat as point mass
      return this.gravityFrom(target);
    } else {
      // Recurse into children
      return this.children.reduce(
        (acc, child) => acc.add(child.computeForce(target, theta)),
        Vec3.zero()
      );
    }
  }
}
```

---

## Demo-Specific Architecture

### 1. Star Cluster N-Body Demo

**Goal:** Interactive globular cluster with N ≤ 500-800 stars (direct sum only; Barnes-Hut PUNT for Year 1-2)

**Architecture:**

```
┌────────────────────────────────────────────────────────┐
│  Main Thread                                            │
│  ├── Three.js scene                                    │
│  ├── Camera controls (OrbitControls)                   │
│  ├── UI sliders (total mass, concentration, time scale)│
│  └── Receives position updates from worker             │
├────────────────────────────────────────────────────────┤
│  Web Worker                                             │
│  ├── Leapfrog integrator                               │
│  ├── Direct summation (N < 1000) or Barnes-Hut        │
│  ├── Sends positions via postMessage + SharedArrayBuffer│
│  └── Runs at physics timestep (decoupled from render)  │
├────────────────────────────────────────────────────────┤
│  Rendering                                              │
│  ├── THREE.Points with custom shader                   │
│  ├── Color by velocity (blue = fast, red = slow)       │
│  ├── Size by mass (optional)                           │
│  └── Optional: trails via history buffer or line segments│
└────────────────────────────────────────────────────────┘
```

**Layered Complexity:**
- **Conceptual:** Watch cluster evolve, see core collapse, ejected stars
- **Quantitative:** Measure half-mass radius, velocity dispersion, virial ratio
- **Advanced:** Compare King models, add tidal field, binary formation

**Implementation:**

```typescript
// star-cluster/main.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Initialize worker
const worker = new Worker(new URL('./physics-worker.ts', import.meta.url), { type: 'module' });

// Shared buffer for zero-copy position transfer
const positionBuffer = new SharedArrayBuffer(N * 3 * 4); // Float32
const positions = new Float32Array(positionBuffer);

worker.postMessage({ type: 'init', buffer: positionBuffer, N, params });

// Three.js points
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({
  size: 0.5,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8
});
const stars = new THREE.Points(geometry, material);
scene.add(stars);

function animate() {
  requestAnimationFrame(animate);
  geometry.attributes.position.needsUpdate = true; // Worker updates SharedArrayBuffer
  renderer.render(scene, camera);
}
animate();
```

### 2. Rotation Curves Demo (Planetary + Galactic)

**Goal:** Show Keplerian vs flat rotation curves, dark matter evidence

**Architecture:**

```
┌────────────────────────────────────────────────────────┐
│  Two Modes                                              │
│  ├── Planetary System: v(r) ∝ 1/√r (Keplerian)        │
│  └── Galaxy: v(r) ≈ const (flat, implies dark matter)  │
├────────────────────────────────────────────────────────┤
│  Visualization                                          │
│  ├── Left panel: Top-down view of orbiting bodies      │
│  ├── Right panel: v(r) rotation curve plot             │
│  ├── Toggle: visible mass only vs with dark halo       │
│  └── Interactive: drag to add/remove mass              │
├────────────────────────────────────────────────────────┤
│  Physics                                                │
│  ├── Circular orbit assumption: v = √(GM(<r)/r)        │
│  ├── NFW profile for dark halo                         │
│  └── Disk + bulge + halo mass model                    │
└────────────────────────────────────────────────────────┘
```

**Physics Model:**

```typescript
// packages/physics/rotationCurveModel.ts

// Keplerian (point mass)
export function keplerianVelocity(r: number, M: number): number {
  // v = sqrt(GM/r), using G = 4π² AU³/yr²/M☉
  return Math.sqrt(4 * Math.PI * Math.PI * M / r); // AU/yr
}

// Enclosed mass for exponential disk
export function diskEnclosedMass(r: number, Md: number, Rd: number): number {
  const x = r / Rd;
  // M(<r) = Md * [1 - (1 + x) * exp(-x)]
  return Md * (1 - (1 + x) * Math.exp(-x));
}

// NFW dark matter halo
export function nfwEnclosedMass(r: number, M200: number, c: number): number {
  const rs = r200(M200) / c; // scale radius
  const x = r / rs;
  // M(<r) = M200 * [ln(1+x) - x/(1+x)] / [ln(1+c) - c/(1+c)]
  const fc = Math.log(1 + c) - c / (1 + c);
  const fx = Math.log(1 + x) - x / (1 + x);
  return M200 * fx / fc;
}

// Combined rotation curve
export function galaxyRotationVelocity(
  r: number,
  Mbulge: number, Rbulge: number,
  Mdisk: number, Rdisk: number,
  Mhalo: number, chalo: number
): number {
  const Mbulge_enc = hernquistEnclosedMass(r, Mbulge, Rbulge);
  const Mdisk_enc = diskEnclosedMass(r, Mdisk, Rdisk);
  const Mhalo_enc = nfwEnclosedMass(r, Mhalo, chalo);
  const Mtotal = Mbulge_enc + Mdisk_enc + Mhalo_enc;
  return Math.sqrt(G * Mtotal / r);
}
```

**⚠️ Physics Caveat:**

The formula `v = √(GM(<r)/r)` is strictly valid only for **spherically symmetric** mass distributions. A thin disk's true rotation curve involves Bessel functions (more complex).

**Our approach:**
- **Conceptual/Quantitative layers:** Use sphericalized disk approximation (pedagogically correct, computationally simple)
- **Advanced layer:** Note the approximation, optionally show true thin-disk formula

This is a deliberate pedagogical choice — the key insight (flat curves imply dark matter) is preserved. Add a tooltip: *"Disk treated as spherical for simplicity; see Binney & Tremaine for exact expressions."*

**Layered Complexity:**
- **Conceptual:** Compare planetary (drops) vs galactic (flat), "missing mass"
- **Quantitative:** Plot v(r), calculate enclosed mass, fit NFW parameters
- **Advanced:** Decompose curve into bulge+disk+halo, MOND comparison

### 3. Black Hole Spacetime Warpage Demo

**Goal:** Visualize gravitational lensing and spacetime curvature near a Schwarzschild black hole

**⚠️ Scope Limitation:** This demo uses **thin-lens approximation**, NOT full GR ray tracing. Full Kerr ray tracing with proper geodesic integration is 🚫 PUNT — it's a significant undertaking that would become a maintenance burden. The visual approximation captures the pedagogical essence (light bending, photon sphere, Einstein rings) without requiring research-grade numerics.

**Architecture:**

```
┌────────────────────────────────────────────────────────┐
│  Rendering: WebGL Custom Shaders                        │
│  ├── Approximate deflection (thin-lens, NOT geodesics) │
│  ├── Background star field / accretion disk texture    │
│  ├── Photon sphere visualization                       │
│  └── Interactive camera orbit around BH                │
├────────────────────────────────────────────────────────┤
│  Visualization Modes                                    │
│  ├── Mode 1: Grid distortion (embed diagram style)     │
│  ├── Mode 2: Light ray tracing (lensing)               │
│  ├── Mode 3: Accretion disk (thin disk, Doppler)       │
│  └── Mode 4: Photon orbits                             │
├────────────────────────────────────────────────────────┤
│  Physics                                                │
│  ├── Schwarzschild metric                              │
│  ├── Null geodesic integration                         │
│  └── Gravitational redshift                            │
└────────────────────────────────────────────────────────┘
```

**Shader-Based Approximate Lensing:**

The following shader provides a **visually accurate approximation** of gravitational lensing — NOT true null geodesic integration. This is intentional: true geodesics require solving the full Schwarzschild/Kerr equations, which is more complex and slower. For pedagogical purposes, this approximation captures the essential visual phenomena.

```glsl
// blackhole.frag - APPROXIMATE lensing (not true geodesics)
// This uses a simplified deflection model that reproduces:
// - Light bending around BH
// - Photon sphere at r = 1.5*rs
// - Einstein ring formation
// It does NOT accurately model:
// - Exact ray paths at all impact parameters
// - Proper relativistic aberration
// - Frame dragging (Kerr)

uniform float rs;         // Schwarzschild radius
uniform vec3 cameraPos;   // Observer position
uniform mat3 cameraRot;   // Camera rotation matrix
uniform sampler2D skybox; // Background star field

vec3 traceRayApproximate(vec3 origin, vec3 direction) {
    vec3 pos = origin;
    vec3 vel = normalize(direction);
    float dt = 0.1;

    for (int i = 0; i < 500; i++) {
        float r = length(pos);

        // Inside event horizon - return black
        if (r < rs) return vec3(0.0);

        // Escaped to infinity - sample skybox
        if (r > 100.0) {
            vec2 uv = sphericalUV(vel);
            return texture(skybox, uv).rgb;
        }

        // APPROXIMATE deflection (not true geodesic equation)
        // This heuristic reproduces visual behavior qualitatively
        // True geodesics would require integrating the full metric
        vec3 acc = -1.5 * rs * pos / pow(r, 3.0) * dot(vel, vel);

        // Simple Euler step (not RK4 despite comment in original)
        vel += acc * dt;
        pos += vel * dt;
    }

    return vec3(0.0); // Didn't converge
}

void main() {
    vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;

    vec3 rayDir = normalize(cameraRot * vec3(uv, -1.0));
    vec3 color = traceRayApproximate(cameraPos, rayDir);

    gl_FragColor = vec4(color, 1.0);
}
```

**Accuracy Notes:**
- **Visual fidelity:** High — produces convincing lensing, photon sphere, Einstein rings
- **Physical accuracy:** Approximate — deflection angles are qualitatively correct but not exact
- **For research-grade geodesics:** See [Rantonels' Starless](https://github.com/rantonels/starless) for proper Kerr ray tracing

**Layered Complexity:**
- **Conceptual:** See light bending, Einstein ring, photon sphere
- **Quantitative:** Measure deflection angle vs impact parameter, compare to weak-field limit 4GM/rc²
- **Advanced:** Note approximation limitations; compare to exact solutions; Kerr extension

**Three.js Integration:**

```typescript
// blackhole/main.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Custom shader material
const blackholeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    rs: { value: 1.0 },  // Schwarzschild radius (code units)
    cameraPos: { value: new THREE.Vector3(0, 0, 10) },
    cameraRot: { value: new THREE.Matrix3() },
    skybox: { value: starFieldTexture },
    resolution: { value: new THREE.Vector2(width, height) }
  },
  vertexShader: /* glsl */`
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: blackholeFragmentShader // From file
});

// Full-screen quad
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, blackholeMaterial);
scene.add(mesh);

function animate() {
  requestAnimationFrame(animate);

  // Update uniforms from camera
  blackholeMaterial.uniforms.cameraPos.value.copy(camera.position);
  blackholeMaterial.uniforms.cameraRot.value.setFromMatrix4(camera.matrixWorld);

  renderer.render(scene, camera);
}
```

---

## Performance Optimization Patterns

### 1. TypedArrays (10-100x faster than regular arrays)

```typescript
// Bad: Array of objects
const bodies = [{ x: 0, y: 0, vx: 1, vy: 0 }, ...];

// Good: Structure of Arrays with TypedArrays
const positions = new Float32Array(N * 3);
const velocities = new Float32Array(N * 3);
const masses = new Float32Array(N);
```

### 2. Object Pooling (Avoid GC pauses)

```typescript
// Bad: Create new vectors every frame
function update(body) {
  const force = new Vec3(0, 0, 0); // GC pressure!
  // ...
}

// Good: Reuse allocated objects
const _force = new Vec3();
const _temp = new Vec3();
function update(body) {
  _force.set(0, 0, 0);
  // ...
}
```

### 3. SharedArrayBuffer (Shared memory with workers)

```typescript
// Main thread
const buffer = new SharedArrayBuffer(N * 3 * 4);
const positions = new Float32Array(buffer);
worker.postMessage({ buffer }); // Shared (not transferred, not copied)

// Worker directly writes to same memory
// Main thread reads without message passing overhead
```

**⚠️ Cross-Origin Isolation Required:**

SharedArrayBuffer is gated behind security headers. Your page MUST be cross-origin isolated:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**GitHub Pages Problem:** GitHub Pages doesn't allow custom headers. Use `coi-serviceworker` as a workaround:

```html
<!-- index.html - MUST be first script -->
<script src="coi-serviceworker.js"></script>
```

```javascript
// coi-serviceworker.js (from https://github.com/nicg/nicgcoi-serviceworker)
// This service worker patches the isolation headers client-side.
// First load triggers a reload; subsequent loads work normally.
```

**Implications:**
- First page load will reload (one-time)
- External assets (CDN scripts, fonts, images) must have CORS headers
- Test locally with `npx serve --cors` or similar

### 4. OffscreenCanvas (Render in worker)

```typescript
// main.ts
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);

// worker.ts
self.onmessage = (e) => {
  const canvas = e.data.canvas;
  const ctx = canvas.getContext('2d');
  // Render directly in worker - no main thread blocking
};
```

### 5. GPU Instancing (Render millions of objects)

```typescript
// Render 100,000 stars with instancing
const geometry = new THREE.SphereGeometry(0.1, 8, 8);
const material = new THREE.MeshBasicMaterial();
const mesh = new THREE.InstancedMesh(geometry, material, 100000);

// Set each instance's transform
const matrix = new THREE.Matrix4();
for (let i = 0; i < 100000; i++) {
  matrix.setPosition(positions[i*3], positions[i*3+1], positions[i*3+2]);
  mesh.setMatrixAt(i, matrix);
}
mesh.instanceMatrix.needsUpdate = true;
```

---

## Research-Grade Quality Requirements

These sections address what separates "cool demo" from "trustworthy educational tool."

### Validation & Test Oracles

**How we know it's correct:**

| Physics Domain | Analytic Test Case | Acceptance Criterion |
|---------------|-------------------|---------------------|
| **2-body orbit** | Kepler ellipse | Period matches P² = a³/M to < 0.1% |
| **N-body energy** | Total E = K + W | |ΔE/E| < 10⁻⁶ over 100 orbits (symplectic) |
| **Rotation curve** | Isothermal sphere v(r) = const | Flat to < 1% for r > 2*r_core |
| **Light bending** | Weak-field limit | θ = 4GM/rc² ± 5% for b >> rs |
| **Blackbody** | Wien's law | λ_peak matches within 0.1% |

**Implementation:**
```typescript
// packages/physics/src/validation/keplerOracle.test.ts
test('two-body period matches Kepler III', () => {
  const sim = new TwoBodySim({ a: 1.0, e: 0.5, M: 1.0 });
  sim.integrate(10 * sim.analyticPeriod);
  expect(sim.measuredPeriod).toBeCloseTo(sim.analyticPeriod, 3);
});

test('energy conserved over long integration', () => {
  const sim = new NBodySim({ N: 100, integrator: 'leapfrog' });
  const E0 = sim.totalEnergy();
  sim.integrate(1000);
  expect(Math.abs((sim.totalEnergy() - E0) / E0)).toBeLessThan(1e-6);
});
```

### Determinism & Reproducibility

For "research-grade" behavior, simulations must be reproducible:

**Requirements:**
- **Fixed timestep:** Use fixed dt, not adaptive (or log adaptive choices)
- **Seeded RNG:** All random initial conditions use explicit seeds
- **Versioned parameters:** Lock physical constants, default presets
- **Event logging:** Record sim parameters, random seeds, key events

```typescript
// Reproducible initial conditions
export function generatePlummerCluster(params: {
  N: number;
  seed: number;  // REQUIRED - no implicit randomness
  totalMass: number;
  scaleRadius: number;
}): { positions: Float32Array; velocities: Float32Array; masses: Float32Array } {
  const rng = seedrandom(params.seed.toString());
  // ... deterministic generation
}

// Event log for debugging/replay
interface SimEventLog {
  version: string;
  timestamp: string;
  seed: number;
  parameters: Record<string, number>;
  checkpoints: Array<{ t: number; E: number; L: number }>;
}
```

### Precision Considerations (float32 vs float64)

**WebGL/WebGPU are primarily float32.** This affects:

| Issue | Symptom | Mitigation |
|-------|---------|------------|
| **Long integrations** | Drift accumulates | Re-center coordinates periodically |
| **Close encounters** | Position errors | Softening parameter, regularization |
| **Large coordinates** | Subtractive cancellation | Work in local/relative coords |
| **Small perturbations** | Lost to rounding | Use double precision on CPU for sensitive calcs |

**Practical guidance:**
- For N-body: float32 fine for visualization, run energy diagnostics
- For orbital mechanics: Consider float64 in Web Worker (JS numbers are float64)
- For GPU shaders: Stick to float32, accept ~10⁻⁶ relative precision

```typescript
// CPU-side precision where it matters
// JavaScript numbers are IEEE 754 float64
function preciseEnergy(positions: Float64Array, velocities: Float64Array, masses: Float64Array): number {
  // ... high-precision calculation
}

// GPU-side accepts float32 limitations
// Shader uses mediump/highp float (usually float32)
```

### Mobile & Low-Power Constraints

A demo stable on desktop can throttle on laptops/tablets:

**Quality Tiers:**

| Tier | Target Device | N (bodies) | Resolution | FPS Target |
|------|---------------|-----------|------------|------------|
| **High** | Desktop GPU | 5,000+ | Full | 60 fps |
| **Medium** | Laptop/iPad | 1,000-2,000 | 0.75x | 30-60 fps |
| **Low** | Phone/old laptop | 200-500 | 0.5x | 30 fps |

**Adaptive Quality:**

```typescript
// Detect device capability
function detectPerformanceTier(): 'high' | 'medium' | 'low' {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return 'low';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

  // Heuristics (imperfect but useful)
  if (/Apple/.test(renderer) && /GPU/.test(renderer)) return 'medium'; // iOS/M1
  if (/Intel/.test(renderer)) return 'medium';  // Integrated
  if (/NVIDIA|AMD|Radeon/.test(renderer)) return 'high';  // Discrete

  // Fallback: benchmark
  return benchmarkGPU() > 1000 ? 'high' : 'medium';
}

// Thermal throttling detection
let lastFrameTime = performance.now();
let throttleWarnings = 0;

function checkThermalThrottle() {
  const now = performance.now();
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  if (dt > 50) { // < 20fps
    throttleWarnings++;
    if (throttleWarnings > 30) {
      reduceQuality();
      throttleWarnings = 0;
    }
  } else {
    throttleWarnings = Math.max(0, throttleWarnings - 1);
  }
}
```

**Battery considerations:**
- Pause simulation when tab hidden (`document.hidden`)
- Reduce FPS target on battery (`navigator.getBattery()`)
- Offer "eco mode" toggle

---

## Deployment Constraints

### GitHub Pages + SharedArrayBuffer

GitHub Pages doesn't allow custom HTTP headers, but SharedArrayBuffer requires:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

**Solution:** Use `coi-serviceworker` to inject headers client-side:

```html
<!-- Add to index.html BEFORE any other scripts -->
<script src="coi-serviceworker.js"></script>
```

Get it from: https://github.com/nicg/nicgcoi-serviceworker

**Tradeoffs:**
- First visit triggers a page reload (service worker registration)
- External resources (CDN scripts, fonts) must have CORS headers
- Some CDNs work (cdnjs, unpkg); some don't

### WebGL Context Loss

Browsers may kill WebGL contexts under memory pressure. Handle gracefully:

```typescript
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  showMessage('Graphics context lost. Click to restore.');
});

canvas.addEventListener('webglcontextrestored', () => {
  initWebGL(); // Reinitialize everything
});
```

---

## State-of-the-Art Examples

### Existing Inspirations

| Project | Tech | N / Performance | Link |
|---------|------|-----------------|------|
| **Galaxy Zoo** | WebGL, D3 | Interactive classification | galaxyzoo.org |
| **Celestia.js** | Three.js | Full solar system | celestia.space |
| **N-body WebGL** | WebGL compute | N = 65,536 | [davidgao.net](http://davidgao.net/nbody/) |
| **Interstellar (web)** | Three.js, ray marching | Real GR | [sirxemic.github.io](https://sirxemic.github.io/Interstellar) |
| **Black Hole viz** | WebGL shaders | Kerr metric | [rantonels](https://rantonels.github.io/starless/) |
| **GPUUniverse** | WebGPU | N = 1M particles | Research demo |
| **PhET sims** | Canvas/SVG | Educational | phet.colorado.edu |
| **Stellarium Web** | WebGL | Star catalog | stellarium-web.org |

### Research-Grade Web Simulations

1. **REBOUND.js** — Port of REBOUND N-body code to WebAssembly
2. **AstroJS** — Astronomical calculations in JavaScript (kepler, coords)
3. **Three.js Physics** — Cannon.js, Ammo.js for rigid body (not orbital)

---

## Recommended Libraries

### Rendering

| Library | Use Case | Learning Curve |
|---------|----------|----------------|
| **Three.js** | 3D visualization, particles, shaders | Medium |
| **D3.js** | Data visualization, plots, animations | Medium |
| **Plotly.js** | Scientific plots, interactive charts | Low |
| **PixiJS** | High-performance 2D | Low-Medium |
| **Babylon.js** | Alternative to Three.js, more features | Medium-High |

### Math & Physics

| Library | Use Case | Notes |
|---------|----------|-------|
| **gl-matrix** | Fast vector/matrix math | Float32Array-based |
| **mathjs** | Symbolic math, units | Large bundle size |
| **numeric.js** | Linear algebra, ODE solvers | Older but solid |
| **ndarray** | N-dimensional arrays | NumPy-like |
| **scijs** | Scientific computing suite | Modular |

### Visualization Utilities

| Library | Use Case |
|---------|----------|
| **dat.GUI** | Quick parameter sliders |
| **lil-gui** | Modern dat.GUI alternative |
| **stats.js** | FPS monitor |
| **gsap** | Smooth animations, tweening |

### Recommended Package Additions

```json
// package.json additions for advanced demos
// Pin to latest stable and keep @types aligned
{
  "dependencies": {
    "three": "^0.170.0",
    "gl-matrix": "^3.4.3",
    "@tweenjs/tween.js": "^23.0.0"
  },
  "devDependencies": {
    "@types/three": "^0.170.0"
  }
}
```

**Note:** Three.js releases frequently (~monthly). Check [Three.js releases](https://github.com/mrdoob/three.js/releases) and ensure `@types/three` matches your `three` version.

---

## Implementation Roadmap

### Phase 1: Infrastructure (Week 1-2)

- [ ] Add `packages/integrators/` with RK4, leapfrog
- [ ] Add `packages/nbody/` with direct summation
- [ ] Set up Three.js in a demo template
- [ ] Create Web Worker boilerplate

### Phase 2: Star Cluster Demo (Week 3-4)

- [ ] Plummer/King model initial conditions (N ≤ 500 target, max 800)
- [ ] Leapfrog integrator in worker (direct sum only — no Barnes-Hut)
- [ ] Three.js point cloud rendering
- [ ] UI: mass, concentration, time scale
- [ ] Diagnostics: half-mass radius, virial ratio
- [ ] Performance target: 60fps @ N=500, 30-60fps @ N=800

### Phase 3: Rotation Curves Demo (Week 5-6)

- [ ] Keplerian mode (planetary)
- [ ] Galaxy mode with disk + halo
- [ ] Side-by-side orbit view + v(r) plot
- [ ] Toggle dark matter on/off
- [ ] Fit to Milky Way data

### Phase 4: Black Hole Spacetime Demo (Week 7-8)

- [ ] Thin-lens approximation shader (NOT full geodesics)
- [ ] Grid distortion visualization
- [ ] Accretion disk mode (thin-disk, visual approx)
- [ ] Photon sphere / ISCO markers
- [ ] 🚫 Kerr extension — PUNT (would require full geodesic integration)

### Phase 5: Integration & Polish (Week 9-10)

- [ ] Consistent UI with existing demos
- [ ] Layered complexity toggles
- [ ] Instructor materials
- [ ] Performance optimization
- [ ] Accessibility audit

---

## Quick Reference: What's Achievable

| Demo Idea | Complexity | Tech Needed | Feasible? |
|-----------|------------|-------------|-----------|
| N-body star cluster (N ≤ 500) | Medium | Web Worker + Three.js | ✅ Yes |
| N-body star cluster (N ≤ 800) | Medium | Web Worker + Three.js | ✅ Yes (30-60fps) |
| N-body (N > 1000) | High | Barnes-Hut tree | 🚫 PUNT Year 1-2 |
| Rotation curves | Low-Medium | Canvas 2D or D3 | ✅ Easy |
| Black hole lensing | Medium | WebGL shaders | ✅ Thin-lens approx only |
| Full GR ray tracing (Kerr) | Extreme | Custom ray marching | 🚫 PUNT |
| Accretion disk | Medium-High | Custom shaders | ✅ Thin-disk, visual approx |
| Gravitational waves (viz) | Medium | Three.js + shaders | ✅ Yes (chirp + strain) |
| Stellar evolution | Medium | Pre-computed MIST/PARSEC | ✅ With precomputed tracks |
| Real-time MESA | Extreme | Pyodide/WASM | 🚫 PUNT |
| Full radiative transfer | Extreme | Custom compute | 🚫 PUNT |
| Supernova hydrodynamics | Extreme | GPU compute | 🚫 PUNT |

---

## Summary

**You can build research-grade interactive physics demos in TypeScript.** Modern browsers provide:

- GPU-accelerated rendering (WebGL/WebGPU)
- Parallel computation (Web Workers)
- Near-native performance (TypedArrays, WASM)
- Publication-quality visualization (Three.js, D3)

The key is choosing the right architecture:
- **Simple demos:** Canvas 2D, main thread
- **Particle systems:** Three.js, Web Worker
- **N-body (N ≤ 500-800):** Direct sum in Web Worker + Three.js
- **N-body (N > 1000):** 🚫 PUNT — requires Barnes-Hut, significant effort
- **Spacetime visualization:** Thin-lens approximation shaders (NOT full geodesics)

Start with Three.js for 3D demos and Web Workers for physics — this covers 95% of use cases.

**Remember:** "Research-grade" means validated and transparent, not "HPC in Safari." We respect browser limits and are honest about approximations.

---

*Document maintained by the Cosmic Playground development team*
