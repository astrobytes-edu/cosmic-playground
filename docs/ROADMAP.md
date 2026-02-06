# Cosmic Playground Roadmap

> **Last Updated:** 2026-02-05
> **Owner:** Dr. Anna Rosen
> **Grant:** NSF IUSE Level 2 (Years 1-3)
> **Current State:** 🔴 **Critical — Migration Quality Crisis**

---

## Strategic Context

Cosmic Playground is an open-source astronomy/physics simulation ecosystem for teaching ASTR 101, 109, 201, and PHYS 195-197 at SDSU and beyond. The project is funded by an NSF IUSE Level 2 grant.

**The Problem:** Previous migration attempts (Codex, Claude) produced demos that are incomplete, poorly written, or unfaithful to the legacy versions. All 12 "migrated" demos are **untrusted** until validated against legacy.

**The Goal:** A validated, trustworthy demo library that can be used in Spring 2026 courses and expanded over the grant period.

---

## Now / Next / Later Overview

| Horizon | Focus | Timeline |
|---------|-------|----------|
| **Now** | Validate & Fix — Get demos working for Spring 2026 | Feb 2026 |
| **Next** | Complete & Expand — Migrate missing demos, add P0 demos | Feb-May 2026 |
| **Later** | Scale & Advance — N-body infrastructure, advanced suites | Summer 2026+ |

---

## 🔴 NOW: Validation & Emergency Fixes (February 2026)

**Theme:** *Trust Nothing — Validate Everything*

**Capacity Allocation:**
- 90% validation and fixes
- 10% documentation of discrepancies

### Must Have (Critical for Spring 2026 courses)

| Demo | Course Need | Target Date | Owner | Status |
|------|-------------|-------------|-------|--------|
| `seasons` | ASTR 101 Week 2 | Feb 7 | — | ❓ Not validated |
| `moon-phases` | ASTR 101 Week 3 | Feb 14 | — | ❓ Not validated |
| `angular-size` | ASTR 101 Week 4 | Feb 21 | — | ❓ Not validated |
| `parallax-distance` | ASTR 101 Week 5 | Feb 28 | — | ❓ Not validated |

### Should Have (Important for mid-semester)

| Demo | Course Need | Target Date | Status |
|------|-------------|-------------|--------|
| `blackbody-radiation` | Light & Spectra unit | Mar 7 | ❓ Not validated |
| `em-spectrum` | Light & Spectra unit | Mar 7 | ❓ Not validated |
| `telescope-resolution` | Telescopes unit | Mar 14 | ❓ Not validated |
| `keplers-laws` | Orbits unit | Mar 21 | ❓ Not validated |
| `binary-orbits` | Orbits unit | Mar 21 | ❓ Not validated |
| `conservation-laws` | Orbits unit | Mar 28 | ❓ Not validated |

### Could Have (Lower course priority)

| Demo | Status |
|------|--------|
| `eclipse-geometry` | ❓ Not validated |
| `retrograde-motion` | ❓ Not validated |

### Won't Have This Month

- New demo development
- Missing demo migrations
- Infrastructure improvements

### Validation Protocol

For each demo:
1. Mount legacy folder (`~/Teaching/astr101-sp26/demos/`)
2. Open legacy and new side-by-side
3. **Feature Parity:** All controls, readouts, modes present?
4. **Physics Correctness:** Same inputs → same outputs?
5. **UI/UX:** Interactions work the same way?
6. **Exports:** Format and content complete?
7. Document discrepancies in `docs/validation/<slug>.md`
8. Fix critical issues or file as known limitation

### Dependencies & Blockers

| Dependency | Status | Mitigation |
|------------|--------|------------|
| Legacy folder access | 🔴 Not mounted | User must select folder |
| Validation time | ~2-4 hours per demo | Prioritize by course schedule |
| Fix complexity | Unknown until validated | May need to flag some as "use legacy for now" |

---

## 🟡 NEXT: Complete & Expand (March-May 2026)

**Theme:** *Finish the Foundation*

**Capacity Allocation:**
- 50% missing demo migrations
- 30% cross-cutting hardening
- 20% P0 new demos

### Initiative 1: Migrate Missing Demos

These demos exist in legacy but have no code in the new repo.

| Demo | Effort (ICE) | Value | Priority | Target |
|------|--------------|-------|----------|--------|
| `doppler-shift-spectrometer` | 3 (Medium) | High | P0 | Mar 2026 |
| `planetary-climate-sandbox` | 3 (Medium) | High | P1 | Apr 2026 |
| `spectral-lines-lab` | 4 (Hard) | Medium | P2 | May 2026 |

**Deliverables per demo:**
- Physics model in `packages/physics/` with vitest tests
- Demo UI in `apps/demos/src/demos/<slug>/`
- Instrument runtime, exports v1, station mode
- Site content (`.md` files)

### Initiative 2: Complete Stub Demo

| Demo | Effort | Value | Priority | Target |
|------|--------|-------|----------|--------|
| `planetary-conjunctions` | 2 (Easy) | Medium | P2 | Apr 2026 |

**Scope Decision Needed:** Is this ASTR 101-only? Synodic period + conjunction geometry?

### Initiative 3: Cross-Cutting Hardening

| Task | Effort | Impact | Target |
|------|--------|--------|--------|
| Add `aria-atomic="true"` to all demos | 1 day | Accessibility | Mar 2026 |
| Content alignment audit | 3 days | Quality | Mar 2026 |
| Expand Playwright tests | 1 week | Reliability | Apr 2026 |
| Demo contract checklists | 3 days | Documentation | Apr 2026 |

### Initiative 4: P0 New Demos (if capacity)

| Demo | Course Value | Effort | Notes |
|------|--------------|--------|-------|
| Tides | High (ASTR 101) | Medium | Classic misconception |
| Inverse Square Law | High (foundational) | Low | Connects many topics |
| Doppler/Redshift | High (ASTR 101/201) | Medium | Essential for spectra unit |

---

## 🟢 LATER: Scale & Advance (Summer 2026 — Year 2-3)

**Theme:** *Build the Future*

**Capacity Allocation:**
- 40% advanced demos (N-body, relativity)
- 30% infrastructure (Web Workers, WebGL)
- 20% physics model validation (SoTA)
- 10% documentation and outreach

### Year 1 Summer (June-August 2026)

**N-Body Infrastructure:**
- Web Worker + Three.js template
- Leapfrog integrator in `packages/physics/`
- Star Cluster prototype (N ≤ 500, direct sum only)

**P1 Demos:**
- H-R Diagram
- Light Curves (transit signatures)
- Stellar Spectra
- Escape Velocity
- Gravitational Lensing
- Rotation Curves: Planetary (Keplerian)

### Year 2 (2026-2027)

**P2 Demos:**
- Magnitude System
- Color Index
- Hubble's Law
- Scale of Universe
- Atomic Energy Levels

**N-Body & Dynamics:**
- Rotation Curves: Galactic (dark matter evidence, analytic model)
- Star Cluster expanded (N ≤ 800)
- 🚫 Barnes-Hut (N > 10k) — PUNT unless serious investment

**Special Relativity Suite:**
- Speed of Light / Time Dilation
- Length Contraction / E=mc²
- Spacetime Diagrams

**Stellar Suite (core):**
- Ideal Gas Law
- Hydrostatic Equilibrium (polytropes)
- Nuclear Fusion basics

### Year 3 (2027-2028)

**General Relativity & Black Holes:**
- Equivalence Principle
- Black Hole Lensing (thin-lens approximation, NOT full ray tracing)
- Gravitational Waves (chirp + strain)

**Compact Objects:**
- Mass-Radius Relation (table-driven)
- WD / NS structure (simplified, toy EOS)
- Pulsar Physics (geometry + inference)

**Stellar Suite (advanced):**
- pp-Chain / CNO Cycle (conceptual + energetics)
- Energy Transport (qualitative)
- Evolution Tracks (precomputed MIST/PARSEC, NOT live computation)

### Level 3 / Future (Beyond Grant — Stretch Goals)

- Galaxy mergers (restricted dynamics, NOT full hydro)
- CMB visualization (precomputed spectra, NOT mapmaking)
- TOV with toy EOS (qualitative M-R curves)

**🚫 Explicit PUNT List:**
- MESA.js (stellar evolution in-browser)
- Full radiative transfer / spectral synthesis
- High-N N-body with Barnes-Hut (N > 10k)
- Full GR ray tracing with Kerr metric
- Supernova hydrodynamics
- CMB mapmaking / likelihoods

---

## Prioritization Framework: ICE Scores

| Demo/Initiative | Impact | Confidence | Ease | ICE | Priority |
|-----------------|--------|------------|------|-----|----------|
| Validate `seasons` | 10 | 10 | 8 | 800 | **P0** |
| Validate `moon-phases` | 10 | 10 | 8 | 800 | **P0** |
| Validate `angular-size` | 9 | 10 | 8 | 720 | **P0** |
| Validate `blackbody-radiation` | 9 | 9 | 7 | 567 | **P0** |
| Migrate `doppler-shift-spectrometer` | 9 | 8 | 5 | 360 | **P1** |
| Migrate `planetary-climate-sandbox` | 8 | 7 | 5 | 280 | **P1** |
| Add `aria-atomic` hardening | 6 | 10 | 9 | 540 | **P1** |
| Build N-body infrastructure | 8 | 6 | 4 | 192 | **P2** |
| Star Cluster demo | 7 | 6 | 4 | 168 | **P2** |
| Rotation Curves (galactic) | 8 | 7 | 3 | 168 | **P2** |
| Black Hole Warpage viz | 9 | 5 | 3 | 135 | **P3** |

---

## Dependencies Map

```
NOW (Validation)
│
├── Legacy folder access (BLOCKER)
│   └── User must mount ~/Teaching/astr101-sp26/demos/
│
└── Per-demo validation → Fix cycle
    ├── seasons ──────────┐
    ├── moon-phases ──────┤
    ├── angular-size ─────┼── Can run in parallel
    └── parallax-distance ┘

NEXT (Complete)
│
├── doppler-shift-spectrometer
│   ├── Needs: packages/data-spectra/ extension
│   └── Needs: DopplerShiftModel in packages/physics/
│
├── planetary-climate-sandbox
│   ├── Needs: PlanetaryClimateModel in packages/physics/
│   └── Needs: Planet presets dataset
│
└── spectral-lines-lab
    ├── Depends on: doppler-shift-spectrometer (shared spectra data)
    └── Needs: Atomic line datasets

LATER (Advance)
│
├── N-body infrastructure
│   ├── Web Worker template
│   ├── Leapfrog integrator
│   └── Three.js point cloud rendering
│
├── Star Cluster demo
│   └── Depends on: N-body infrastructure
│
├── Rotation Curves (galactic)
│   └── Depends on: N-body concepts (but doesn't need full N-body)
│
└── Black Hole Warpage
    └── Depends on: WebGL shader expertise
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Legacy demos too broken to validate | Medium | High | Fall back to "rebuild from spec" |
| Validation takes longer than estimated | High | Medium | Prioritize ruthlessly by course schedule |
| Missing demos more complex than expected | Medium | Medium | Reduce scope; simpler MVP first |
| N-body performance issues | Medium | Low | Start with N ≤ 100; optimize later |
| WebGL/shader expertise gap | Medium | Medium | Use existing Three.js patterns; defer advanced viz |

---

## Success Metrics

### Now (February 2026)
- [ ] 4 demos validated and trusted by Feb 28
- [ ] 0 critical bugs in demos used in class
- [ ] Validation documentation complete for all tested demos

### Next (March-May 2026)
- [ ] All 12 existing demos validated
- [ ] 2+ missing demos migrated
- [ ] Accessibility hardening complete
- [ ] Playwright test coverage at 100% of interactive demos

### Later (Summer 2026+)
- [ ] N-body infrastructure working
- [ ] Star Cluster demo at N=1000 @ 60fps
- [ ] 20+ demos total in ecosystem
- [ ] First publication / SDSU adoption

---

## Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2026-02-05 | All demos marked UNTRUSTED | Previous migrations were incomplete/incorrect | Anna |
| 2026-02-05 | Validation is P0, blocking all else | Can't use broken demos in class | Anna |
| TBD | `planetary-conjunctions` scope | Need to decide ASTR101-only vs broader | — |
| TBD | Math Mode for `blackbody-radiation` | Legacy had it; is it worth rebuilding? | — |
| TBD | Challenge mode for `binary-orbits` | Legacy didn't have it; is it needed? | — |

---

## Appendix: Demo Inventory by Status

### Untrusted (Has Code, Needs Validation)
1. `angular-size`
2. `binary-orbits`
3. `blackbody-radiation`
4. `conservation-laws`
5. `eclipse-geometry`
6. `em-spectrum`
7. `keplers-laws`
8. `moon-phases`
9. `parallax-distance`
10. `retrograde-motion`
11. `seasons`
12. `telescope-resolution`

### Stub (Needs Implementation)
13. `planetary-conjunctions`

### Missing (Needs Migration)
14. `doppler-shift-spectrometer`
15. `spectral-lines-lab`
16. `planetary-climate-sandbox`

### Future (Not Started)
- Tides
- Inverse Square Law
- Doppler/Redshift
- H-R Diagram
- Light Curves
- Stellar Spectra
- Escape Velocity
- Gravitational Lensing
- Star Cluster Dynamics
- Rotation Curves (Planetary)
- Rotation Curves (Galactic)
- Black Hole Spacetime Warpage
- ... (63 more planned — see `demo-planning-brainstorm.md`)

---

## Appendix: Technical Architecture Summary

**Stack:** TypeScript, Vite, pnpm monorepo, Three.js, Vitest

**Key Insight:** TypeScript is sufficient for 90%+ of demos. Python/WebAssembly only needed for:
- Build-time table generation (opacity, EOS)
- Extremely complex physics (MESA, REBOUND)

**Performance Targets:**
- Simple physics: 60fps in main thread
- N-body (N ≤ 100): 60fps in main thread
- N-body (N ≤ 500): 60fps with Web Worker
- N-body (N ≤ 800): 30-60fps with Worker, decoupled physics
- N-body (N > 1000): 🚫 Requires Barnes-Hut — PUNT for Year 1-2

**See Also:** `docs/technical-architecture-plan.md`

---

*This roadmap is a living document. Update as priorities shift and progress is made.*
