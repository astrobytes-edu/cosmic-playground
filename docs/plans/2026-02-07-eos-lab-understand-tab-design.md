# EOS Lab — Tab 2 "Understand" Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the EOS Lab "Understand" tab from a click-one-card deep-dive flow into a simultaneous three-column comparison view that teaches students how gas, radiation, and degeneracy pressure each depend on temperature, density, and composition.

**Architecture:** Replace the mechanism-grid → deep-dive → back-button navigation with a side-by-side layout where all three pressure channels animate simultaneously from shared controls. A live-reaction system replaces static dependency tables — students discover "what depends on what" by dragging sliders and watching which columns respond. An optional "Scaling Law Detective" accordion provides guided challenges for quantitative discovery.

**Tech Stack:** HTML/CSS grid, Canvas 2D animations (existing classes enhanced), KaTeX for live equations, existing `@cosmic/physics` model, existing preset system extended.

---

## 1. Overall Layout

### Shared Controls Bar

Position: Top of Tab 2 panel, always visible.

Contents:
- **Temperature slider** — log-scale, same range as Tab 1 (`logT` 3–9)
- **Density slider** — log-scale, same range as Tab 1 (`logRho` -10–10)
- **Composition sliders** — X, Y, Z with `X+Y+Z=1` constraint (same logic as Tab 1)
- **μ readout** — live mean molecular weight display
- **Preset chips** — same presets as Tab 1 (Sun core, White dwarf core, Neutron star, Red giant), repeated here as compact pills

Shared controls read/write the same model state as Tab 1. When either tab's controls change, `render()` updates both tabs.

### Three-Column Comparison Grid

```
┌──────────────┬──────────────┬──────────────┐
│  GAS         │  RADIATION   │  DEGENERACY  │
│  P_gas       │  P_rad       │  P_deg       │
│  [Canvas]    │  [Canvas]    │  [Canvas]    │
│  [Badge]     │  [Badge]     │  [Badge]     │
│  [Equation]  │  [Equation]  │  [Equation]  │
└──────────────┴──────────────┴──────────────┘
```

CSS grid: `grid-template-columns: repeat(3, 1fr)` at ≥ 900px.

### Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| ≥ 900px | 3 equal columns |
| 600–899px | 2 columns + 1 centered below |
| < 600px | Single column stack, shared controls sticky at top |

Animation canvas height: 160px (wide), 120px (narrow).

---

## 2. Column Anatomy

Each column follows identical vertical structure with channel-specific content.

### Structure

```
┌─────────────────────────────┐
│  HEADER: P_gas (KaTeX)      │
│  Subtitle: "Thermal collis."│
│                             │
│  CANVAS ANIMATION (160px)   │
│                             │
│  STELLAR BADGE              │
│  "Dominates in: Sun core,   │
│   main-sequence stars"      │
│                             │
│  LIVE EQUATION (KaTeX)      │
│  P = ρkT / μm_H            │
│  = 3.21 × 10¹⁶ dyn/cm²     │
└─────────────────────────────┘
```

### Channel-Specific Content

**Gas** ($P_{\rm gas}$):
- Subtitle: "Thermal particle collisions"
- Badge: "Sun core, main-sequence stars, giant envelopes"
- Equation: $P_{\rm gas} = \frac{\rho\,k_{\rm B}\,T}{\mu\,m_{\rm H}}$
- Responds to: T ✓, ρ ✓, μ ✓

**Radiation** ($P_{\rm rad}$):
- Subtitle: "Photon momentum flux"
- Badge: "O/B-star envelopes, supernovae, AGN"
- Equation: $P_{\rm rad} = \frac{a\,T^4}{3}$
- Responds to: T ✓, ρ ✗, μ ✗

**Degeneracy** ($P_{\rm deg}$):
- Subtitle: "Pauli exclusion pressure"
- Badge: "White dwarfs, neutron star crusts"
- Equation: $P_{\rm deg} = K_{\rm NR}\left(\frac{\rho}{\mu_e}\right)^{5/3}$ (switches to $4/3$ at relativistic densities)
- Responds to: T ✗, ρ ✓, μ ✓

### Styling

Each column gets a subtle top-border accent in its channel color:
- Gas: `var(--eos-gas)` (green)
- Radiation: `var(--eos-rad)` (amber)
- Degeneracy: `var(--eos-deg)` (violet)

---

## 3. Live Reaction System

Replaces static dependency tables with experiential discovery.

### Behavior

When any shared slider moves:
1. Each column's equation recomputes with new values
2. Channels that **respond** show a brief **ΔP flash** — old value → new value animates in the channel's accent color
3. Channels that **don't respond** get a momentary subtle gray pulse with the equation dimming slightly
4. After 2 seconds of inactivity, all columns return to neutral

### Pedagogical Payoff

- Drag T: gas speeds up + radiation explodes + degeneracy stays frozen → "why didn't it change?"
- Drag ρ: gas multiplies + radiation does nothing + levels fill up → "radiation doesn't care about density!"
- Drag X/Y/Z: gas changes (μ effect) + radiation frozen + degeneracy changes (μ_e effect) → "composition matters for some but not others"

No explicit table needed — students discover dependencies through interaction.

---

## 4. Enhanced Animations

### Gas Pressure (`GasPressureAnimation`)

Enhancements:
- **Particle count range**: 10–150 (up from 5–80) — high ρ feels crowded
- **Speed range**: 0.2–7 (up from 0.5–4) — dramatic low-T vs high-T difference
- **Physical speed scaling**: `speed = baseSpeed × √(T / T_ref)` (fix from linear mapping)
- **Wall flash intensity** scales with impact speed — harder hits = brighter = more momentum transfer
- **Particle trails**: 2–3 frame afterglow at high T to emphasize speed

### Radiation Pressure (`RadiationPressureAnimation`)

Enhancements:
- **Photon count range**: 3–150 (up from 3–100) — flooding at high T
- **Physical count scaling**: count ∝ T³ (fix from linear mapping; photon number density ∝ T³)
- **Glow halo size** scales with T — more energetic photons have larger halos
- **Wien color shift** more dramatic: deep red → orange → white → blue → deep blue-violet

### Degeneracy Pressure (`DegeneracyPressureAnimation`)

Major visual upgrade:
- **Larger spin arrows**: 12px bold ↑/↓, color-coded (bright violet = spin-up, lighter = spin-down)
- **Fermi energy line**: dashed amber horizontal line at top of filled levels, labeled $E_F$. Rises as ρ increases
- **Level vibration**: topmost filled levels oscillate ±1px (high-energy fermions "pushing back"). Lower levels calm, upper levels vibrate more
- **Non-uniform spacing**: levels closer together toward bottom (mimicking $g(E) \propto \sqrt{E}$ density of states)
- **Fill animation**: new electrons "drop in" from above with brief flash when ρ increases — makes Pauli exclusion tangible

---

## 5. Preset System

### Behavior

Preset chips appear in both Tab 1 and Tab 2's shared controls bar. Clicking a preset:

1. Sets T, ρ, X, Y, Z to that stellar environment's values
2. Updates both Tab 1 and Tab 2 displays via the shared model
3. If on Tab 2: stays on Tab 2, sliders animate smoothly to new values
4. If on Tab 1: stays on Tab 1, Tab 2 syncs silently in background

### Active State

- Active preset chip gets a glow border in `var(--eos-dominant)`
- If student manually adjusts any slider, the active preset deselects
- This teaches that presets are real physical conditions, not arbitrary numbers

### Preset Data (existing, unchanged)

| Preset | T (K) | ρ (g/cm³) | X | Y | Z |
|--------|-------|-----------|---|---|---|
| Sun core | 1.57×10⁷ | 150 | 0.34 | 0.64 | 0.02 |
| White dwarf | 10⁷ | 10⁶ | 0 | 0 | 1.0 |
| Neutron star | 10⁸ | 10¹⁴ | 0 | 0 | 1.0 |
| Red giant | 10⁸ | 10⁴ | 0.10 | 0.88 | 0.02 |

---

## 6. Scaling Law Detective

Optional guided challenge activity in a collapsible accordion below the three columns.

### Structure

```html
<details class="cp-accordion">
  <summary>Scaling Law Detective — "How strongly does each pressure scale?"</summary>
  <!-- Challenge content -->
</details>
```

### Three Challenges

| # | Channel | Prompt | Options | Answer | Insight |
|---|---------|--------|---------|--------|---------|
| 1 | Gas | "Double $T$. By what factor does $P_{\rm gas}$ change?" | ×1, ×2, ×4, ×8 | ×2 | $P \propto T^1$ — linear |
| 2 | Radiation | "Double $T$. By what factor does $P_{\rm rad}$ change?" | ×2, ×4, ×8, ×16 | ×16 | $P \propto T^4$ — explosive! |
| 3 | Degeneracy | "Double $\rho$. By what factor does $P_{\rm deg}$ change?" | ×2, ×3.2, ×4, ×8 | ×3.2 ($2^{5/3}$) | $P \propto \rho^{5/3}$ — steeper than linear |

### Design

- Multiple-choice answers (4 options per challenge) — low friction, immediate feedback
- References *live* equation values so students physically interact with sliders
- After correct answer: one-sentence insight with scaling law in KaTeX
- Progress: "Challenge 1 / 3" using `.cp-challenge-progress` pattern
- Wrong answer: "Try again — watch the numbers carefully" (no penalty, no hints)

---

## 7. Scientific Accuracy Fixes

Folded into the redesign:

1. **Degeneracy card text**: "Quantum correction beyond classical electrons" → "Packed fermions forced into higher energy states by Pauli exclusion; depends only on density"
2. **Gas speed mapping**: Linear-in-logT → physical `√(T/T_ref)` scaling
3. **Radiation count**: Linear-in-logT → physical `(T/T_ref)³` scaling (photon number ∝ T³)
4. **Degeneracy level spacing**: Uniform → `√E`-spaced (3D density of states)

---

## 8. What's Removed

- Click-to-enter deep-dive flow (mechanism-grid → deep-dive → back button)
- Per-channel independent T/ρ sliders
- Per-channel uPlot log-log charts (Tab 1 already has combined pressure curves)
- Static dependency table / comparison strip

## 9. What's Unchanged

- Tab 1 ("Explore") — entirely unchanged
- All three Canvas animation classes — enhanced but not replaced
- All equation LaTeX functions — reused for live equations
- Preset data and `applyPreset()` logic — extended, not rewritten
- Station Mode, Help dialog, accessibility attributes
- The `@cosmic/physics` model — no physics changes

## 10. Files Affected

| File | Change |
|------|--------|
| `index.html` | Replace Tab 2 panel contents (lines 313–404) |
| `style.css` | Add comparison grid, column cards, shared controls, challenge styles |
| `main.ts` | Wire shared controls → animations, preset sync, ΔP flash, challenge engine |
| `mechanismViz.ts` | Enhanced parameters, Fermi level, vibration, trails, physical scaling |
| `logic.ts` | Challenge answer validation, ΔP computation helpers |
| `eos-lab.spec.ts` | Update E2E tests for new Tab 2 structure |

## 11. YAGNI — Explicitly Excluded

- No new physics model changes
- No new npm dependencies
- No changes to Tab 1
- No mobile-specific animations (same Canvas, just smaller)
- No sound effects or haptic feedback
- No saved student progress / localStorage
