# Binary Orbits — Spectroscopy Extension Spec

**Status:** Draft
**Date:** 2026-02-23
**Owner:** Cosmic Playground
**Slug:** `binary-orbits` (extension to existing demo)
**Category:** Orbital Mechanics / Light & Spectra (cross-domain)

---

## 1) Purpose & Positioning

This spec describes an extension to the existing `binary-orbits` demo: a **"Show Spectroscopy" toggle** that reveals a spectroscopic binary panel below the orbital visualization, connecting orbital mechanics to observable radial velocity measurements.

It answers the question that makes Doppler shift so powerful in astronomy: *How do we measure the masses of stars in binary systems we can't even resolve — using only the wobble of their spectral lines?*

### Primary pedagogical goals

- Connect the **orbital motion** students already see in the demo to **what an observer actually measures**: time-varying radial velocities via spectral line shifts
- Build intuition for **inclination dependence**: i = 0 (face-on) produces zero RV signal; i = 90 (edge-on) produces maximum signal. This geometric insight explains why we often measure "m sin i" rather than true mass.
- Show the **radial velocity curve** — the sinusoidal v_r(t) plot that is the primary observable for spectroscopic binaries
- Demonstrate **SB1** (single-lined: only the brighter star's lines are visible) and **SB2** (double-lined: both sets of lines visible, crossing each other) spectroscopic binaries
- Introduce the **mass function** f(m) as what observers directly measure from RV data

### Audience

- **ASTR 101**: Qualitative — see the lines wobble, understand inclination matters, appreciate that orbital motion creates measurable Doppler shifts
- **ASTR 201**: Quantitative — mass function, K-amplitudes, m sin^3 i, connecting to actual binary star studies

### Relationship to other demos

| Demo | Relationship |
|------|-------------|
| `doppler-shift` | Provides the foundational concept; this extension applies it to a specific system |
| `spectral-lines` | Provides element line catalogs; this extension shifts those lines in real time |
| `keplers-laws` | Period-semimajor axis-mass relationship; the mass function is a direct consequence |
| `galaxy-rotation` (planned) | Another application of Doppler: measuring rotational velocity at different galactocentric radii |

---

## 2) Layout Change — Toggle-Revealed Panel

### Current layout (unchanged when spectroscopy is off)

```
+----------------------------------------------------------+
| Controls (sidebar)    |  Stage: Orbit Canvas               |
|                       |  [  o1  ···X···  o2  ]            |
| [Mass ratio slider]   |                                    |
| [Separation slider]   +------------------------------------+
|                       |  Readouts panel                    |
| [Show Spectroscopy]   |  Barycenter offset: ...  AU       |
|                       |  Period: ...  yr                   |
+----------------------------------------------------------+
| Drawer: What to notice / Model notes                      |
+----------------------------------------------------------+
```

### Layout with spectroscopy ON

```
+----------------------------------------------------------+
| Controls (sidebar)    |  Stage: Orbit Canvas               |
|                       |  [  o1  ···X···  o2  ]            |
| [Mass ratio slider]   |  (observer sightline arrow added) |
| [Separation slider]   +------------------------------------+
| [Inclination slider]  |  Spectroscopy Panel (revealed)     |
|                       |  ┌──────────────────────────────┐  |
| [Show Spectroscopy]   |  │ RV Curve (v_r vs phase)      │  |
|   [SB1/SB2 toggle]    |  │  K1 ───  K2 - - -           │  |
|   [Element selector]  |  │  +──────────────────────+    │  |
|                       |  │  |  \    /  \    /      |    │  |
| Readouts panel        |  │  |   \/    \/       ●   |    │  |
| (expanded)            |  │  |   /\    /\           |    │  |
|  Barycenter: ... AU   |  │  |  /  \  /  \          |    │  |
|  Period: ... yr       |  │  +──────────────────────+    │  |
|  K1: ... km/s         |  │                              │  |
|  K2: ... km/s         |  │ Spectrum Strip                │  |
|  m1 sin^3 i: ... Msun |  │ ┌──────────────────────────┐ │  |
|  m2 sin^3 i: ... Msun |  │ │ Lab:  |  |  |   |       │ │  |
|  f(m): ... Msun       |  │ │ Obs:   | ||  |   |      │ │  |
|                       |  │ │      (lines wobble)      │ │  |
|                       |  │ └──────────────────────────┘ │  |
|                       |  └──────────────────────────────┘  |
+----------------------------------------------------------+
| Drawer: What to notice / Model notes (expanded)          |
+----------------------------------------------------------+
```

### Toggle behavior

- **"Show Spectroscopy"** is a checkbox or toggle switch in the sidebar controls
- When toggled ON:
  - The spectroscopy panel slides down below the orbit canvas (animated, `cp-slide-up`)
  - New controls appear: inclination slider, SB1/SB2 toggle, element selector
  - Readouts panel expands with K1, K2, mass function values
  - An observer sightline arrow appears on the orbit canvas showing the line-of-sight direction (to visualize what "radial" means)
- When toggled OFF: panel collapses, extra controls hide, readouts revert to basic mode
- State preserved in URL hash / localStorage key `cp:binary-orbits:spectroscopy`

---

## 3) New Controls (spectroscopy mode)

### Inclination slider
- Range: 0 to 90 degrees
- Default: 60 degrees (a common pedagogical starting point)
- Step: 1 degree
- Label: "Inclination (i)" with tooltip explaining: "0 = face-on (no radial velocity signal), 90 = edge-on (maximum signal)"
- **Critical pedagogical moment**: at i = 0, the RV curve flatlines. Students need to see this to understand why astronomers measure "m sin i" not "m".

### SB1 / SB2 toggle
- **SB1** (single-lined): only the primary star's lines are visible in the spectrum strip. This represents systems where the secondary is too faint to contribute visible lines.
- **SB2** (double-lined): both stars' lines are visible. Lines from star 1 and star 2 shift in opposite directions, crossing each other at quadrature.
- Default: SB2 (more instructive)

### Element selector
- Chips: H, Na, Ca (subset — these have the strongest optical absorption lines in stellar spectra)
- Default: H
- Determines which lines appear on the spectrum strip

---

## 4) New Readouts (spectroscopy mode)

These readouts appear below the existing barycenter/period readouts when spectroscopy is ON.

| Label | ID | Value | Unit |
|-------|-----|-------|------|
| Semi-amplitude K1 | `k1Value` | Primary star RV semi-amplitude | km/s |
| Semi-amplitude K2 | `k2Value` | Secondary star RV semi-amplitude | km/s |
| m1 sin^3 i | `m1SiniValue` | Minimum mass of primary | Msun |
| m2 sin^3 i | `m2SiniValue` | Minimum mass of secondary | Msun |
| Mass function f(m) | `massFuncValue` | Observable mass function | Msun |
| System velocity | `vsysValue` | Center-of-mass velocity (fixed at 0 for simplicity) | km/s |

---

## 5) Physics — Spectroscopic Binary Model

### Radial velocity of each component (circular orbits)

For a circular binary with orbital period P, separation a, masses m1 and m2:

```
r1 = a * m2 / (m1 + m2)      // distance of star 1 from barycenter
r2 = a * m1 / (m1 + m2)      // distance of star 2 from barycenter

v1_orbital = 2 * pi * r1 / P  // orbital speed of star 1 (AU/yr)
v2_orbital = 2 * pi * r2 / P  // orbital speed of star 2 (AU/yr)

// Convert to km/s
K1 = v1_orbital * sin(i) [in km/s, after unit conversion from AU/yr]
K2 = v2_orbital * sin(i) [in km/s]

// Time-varying radial velocity (circular orbit, omega = 2*pi/P)
v_r1(t) = v_sys + K1 * sin(omega * t)
v_r2(t) = v_sys - K2 * sin(omega * t)
```

where:
- i is the orbital inclination (angle between orbital angular momentum vector and line of sight)
- v_sys is the systemic (center-of-mass) velocity, set to 0 in this demo for clarity
- The opposite signs for v_r1 and v_r2 reflect that when star 1 moves toward the observer, star 2 moves away

### K-amplitude ratio

```
K1 / K2 = m2 / m1 = q (mass ratio)
```

The binary-orbits demo defines the slider as secondary-to-primary mass ratio $q=m_2/m_1$ with $q \le 1$.

- $K_1/K_2 = r_1/r_2 = m_2/m_1 = q$
- Therefore, with $q \le 1$, we expect $K_1 \le K_2$
- Intuition: the lighter secondary usually has the larger/faster orbit

### Mass function (SB1 observable)

When only one star's lines are visible (SB1), the observer measures K1 and P. The mass function is:

```
f(m) = (m2 * sin i)^3 / (m1 + m2)^2 = P * K1^3 / (2 * pi * G)
```

This is a lower limit on m2 (since sin i <= 1 and m1 >= 0).

### Minimum masses (SB2 observable)

When both K1 and K2 are measured (SB2):

```
m1 * sin^3(i) = P * (K1 + K2)^2 * K2 / (2 * pi * G)
m2 * sin^3(i) = P * (K1 + K2)^2 * K1 / (2 * pi * G)
```

These are the "minimum masses" — the true masses are larger by a factor of 1/sin^3(i).

### Unit conversions

The existing binary model works in AU/yr/Msun. For spectroscopic readouts:
- `AstroUnits.auPerYrToKmPerS()` converts orbital velocities to km/s
- K values are in km/s (standard astronomical convention)
- Mass function in solar masses

### Implementation in physics package

Add to `TwoBodyAnalytic` (or create a thin helper in demo logic):

```typescript
/** Radial velocity semi-amplitudes for a circular spectroscopic binary. */
spectroscopicBinaryKAmplitudes(args: {
  r1Au: number;
  r2Au: number;
  periodYr: number;
  inclinationDeg: number;
}): { K1KmS: number; K2KmS: number };

/** Mass function from observables (SB1). */
massFunction(args: {
  K1KmS: number;
  periodYr: number;
}): number; // in solar masses

/** Minimum masses from observables (SB2). */
minimumMasses(args: {
  K1KmS: number;
  K2KmS: number;
  periodYr: number;
}): { m1Sin3i: number; m2Sin3i: number }; // in solar masses
```

### Test benchmarks

| Test case | Input | Expected | Notes |
|-----------|-------|----------|-------|
| Equal masses, edge-on | m1=m2=1 Msun, a=4 AU, i=90 | K1 = K2, both nonzero | Symmetry check |
| Equal masses, face-on | same, i=0 | K1 = K2 = 0 | No RV signal |
| Unequal 1:0.2, edge-on | m1=1, m2=0.2, a=4, i=90 | K1 = 0.2 * K2 | K ratio = mass ratio |
| Earth-Sun analog | m1=1 Msun, m2 = 3e-6 Msun, a=1 AU, i=90 | K1 ≈ 0.03 km/s (9 m/s) | Exoplanet-scale signal |
| Mass function identity | Compute f(m) from K1, P; compare to analytic m2^3 sin^3 i / (m1+m2)^2 | Should match | Self-consistency |
| inclination scaling | K at i=30 should be K(90) * sin(30) = K(90) * 0.5 | Linearity in sin(i) | |

---

## 6) RV Curve — Rendering Specification

### Canvas or SVG: aspect ratio ~3:1, full panel width

**Axes**:
- Horizontal: orbital phase (0 to 2, showing two full orbits for clarity), labeled "Orbital phase"
- Vertical: radial velocity in km/s, centered on v_sys = 0
- Gridlines at v = 0 (horizontal reference line, slightly thicker)

**Curves**:
- **Star 1 (primary)**: solid line, color `--cp-chart-1` (same as orbit canvas body 1)
  - Sinusoidal: v_r1 = K1 * sin(2*pi*phase)
- **Star 2 (secondary)**: dashed line, color `--cp-chart-2`
  - Sinusoidal: v_r2 = -K2 * sin(2*pi*phase)
  - Hidden when SB1 mode is active

**Phase marker**:
- A filled circle on each curve at the current animation phase
- Vertical dashed line connecting to the x-axis showing the current phase
- Synchronized with the orbital animation above: when the stars are at 3 o'clock, the phase marker is at the corresponding position on the RV curve

**Annotations**:
- K1 labeled with a bracket on the star 1 curve (from 0 to peak)
- K2 labeled similarly for star 2 (when visible)
- "Approaching" / "Receding" labels on the y-axis half-planes

**Key insight the animation reveals**: When star 1 is at the point in its orbit where it moves toward the observer (left side of orbit canvas), the RV curve is at its most negative (blueshift). When moving away (right side), RV is most positive (redshift). Students should see this correspondence in real time.

---

## 7) Spectrum Strip — Rendering Specification

### Canvas: full panel width, aspect ratio 16:3

Same rendering approach as the `doppler-shift` spectrum comparator, but:

- **Lab frame** (top): rest-frame lines of the selected element
- **Observed frame** (bottom): lines shifted by the instantaneous radial velocity
  - In SB2 mode: TWO sets of shifted lines, color-coded to match each star
  - Lines from star 1 shift one way while lines from star 2 shift the other way
  - At quadrature: maximum separation between the two line sets
  - At conjunction (along line of sight): lines overlap / cross — this is the moment students realize you can't tell the difference between an SB1 at conjunction and a single star

**Animation**: lines wobble back and forth in sync with the orbital animation and the RV curve phase marker. All three panels (orbit, RV curve, spectrum) are synchronized to the same orbital phase.

---

## 8) Observer Sightline on Orbit Canvas

When spectroscopy mode is ON, add to the orbit canvas:

- A **dashed arrow** from one edge of the canvas through the barycenter toward the observer direction
- This arrow represents the **line of sight** and visually connects "radial" to the actual orbit geometry
- The inclination slider rotates the effective viewing angle, which the arrow visualizes
- At i = 90 (edge-on): the arrow lies in the orbital plane
- At i = 0 (face-on): a note appears: "Viewing face-on — no radial velocity component" (since we can't easily show this in a 2D top-down view, we indicate it textually)

For the 2D orbit canvas, we handle inclination as follows:
- The orbit canvas remains a top-down (face-on) view showing the true orbital motion
- The observer sightline arrow has a label showing the inclination angle
- The RV curve and spectrum strip correctly compute the sin(i) projection
- This teaches the key lesson: the orbit looks the same regardless of inclination, but the measured RV changes dramatically

---

## 9) Equations (added to Understand drawer when spectroscopy is ON)

**Card: Radial velocity semi-amplitude**
```latex
K_1 = \frac{2\pi\,a_1\,\sin i}{P}, \quad K_2 = \frac{2\pi\,a_2\,\sin i}{P}
```
Caption: a_1 and a_2 are the distances from the barycenter. sin(i) is the projection factor.

**Card: K-amplitude ratio**
```latex
\frac{K_1}{K_2} = \frac{m_2}{m_1}
```
Caption: The lighter star orbits faster.

**Card: Mass function (SB1)**
```latex
f(m) = \frac{(m_2\,\sin i)^3}{(m_1 + m_2)^2} = \frac{P\,K_1^3}{2\pi\,G}
```
Caption: Measurable from K_1 and P alone. A lower limit on m_2.

**Card: Minimum masses (SB2)**
```latex
m_1 \sin^3 i = \frac{P\,(K_1 + K_2)^2\,K_2}{2\pi\,G}
```
Caption: True mass is m / sin^3(i). Without knowing i, we measure minimum masses.

---

## 10) Updated Station Mode

When spectroscopy is ON, the station mode table expands with additional columns:

| Key | Label |
|-----|-------|
| `case` | Case |
| `massRatio` | m2/m1 (secondary/primary, <=1) |
| `separationAu` | Separation a (AU) |
| `inclinationDeg` | Inclination i (deg) |
| `periodYr` | Period P (yr) |
| `K1KmS` | K1 (km/s) |
| `K2KmS` | K2 (km/s) |
| `m1Sin3i` | m1 sin^3 i (Msun) |
| `m2Sin3i` | m2 sin^3 i (Msun) |
| `massFuncMsun` | f(m) (Msun) |

### New comparison row set: "Inclination sweep"
Generate rows at i = 15, 30, 45, 60, 75, 90 for the current mass ratio and separation. This directly shows how inclination affects the measured K values and minimum masses.

### Synthesis prompt (updated)
> You measured K1 and P for a spectroscopic binary, giving you f(m). You don't know the inclination. What is the smallest possible mass for the unseen companion? What inclination would give that minimum? Why is this a lower limit?

---

## 11) Predict → Play → Explain (spectroscopy-specific)

### Predict prompt
> Two equal-mass stars (m1 = m2 = 1 Msun) orbit each other at 4 AU separation. You view the system edge-on (i = 90 deg). Do both stars have the same radial velocity amplitude? Now imagine the system is tilted to i = 30 deg. By what factor does the measured velocity amplitude change?

### Play steps
1. Set mass ratio to **1.0**, separation to **4 AU**, inclination to **90 deg**. Verify K1 = K2.
2. Change inclination to **30 deg**. Both K values drop by a factor of sin(30) = 0.5. Check the readouts.
3. Change inclination to **0 deg**. The RV curve flatlines — zero signal! This is why face-on binaries are undetectable spectroscopically.
4. Set mass ratio to **0.2** (very unequal). Notice K1 << K2. Toggle SB1 mode — now you only see the primary's wobble. Can you still infer the companion's mass?
5. Watch the spectrum strip in SB2 mode. At what orbital phase do the two sets of lines cross each other?

### Explain prompt
> In an SB1 system (you only measure K1 and P), can you determine both m1 and m2 individually? What additional information would you need? Explain in terms of the mass function f(m).

---

## 12) New Keyboard Shortcuts (spectroscopy mode)

| Key | Action |
|-----|--------|
| `s` | Toggle spectroscopy panel |
| `i` / `I` | Decrease / increase inclination by 5 deg |
| `d` | Toggle SB1/SB2 |

---

## 13) Implementation Notes

### Minimal disruption to existing code

- The orbit canvas rendering (`draw()` function) remains essentially unchanged
- Add an observer sightline overlay when spectroscopy is ON (a few SVG lines on the canvas)
- The new spectroscopy panel is a separate DOM section that toggles visibility
- New rendering functions: `drawRVCurve()` (canvas) and `drawSpectrumStrip()` (canvas)
- New state variables: `showSpectroscopy`, `inclinationDeg`, `sb2Mode`, `selectedElement`
- Reuse `DopplerShiftModel.shiftLines()` from the new `doppler-shift` physics module for the spectrum strip
- Reuse `SpectralLineModel.elementLines()` for line catalogs

### Synchronization

All three animated panels (orbit, RV curve, spectrum strip) share the same `phase` variable from the existing animation loop. The only addition is calling the new draw functions inside the existing `requestAnimationFrame` callback.

### Performance

- The orbit canvas is already optimized
- The RV curve is a simple sinusoidal plot — negligible cost
- The spectrum strip is similar to the one in `doppler-shift` — well within budget
- Total: three canvas draws per frame, all lightweight
