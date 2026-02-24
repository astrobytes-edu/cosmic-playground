---
title: "Spectral Lines — Model & Math (Instructor Deep Dive)"
bundle: "spectral-lines"
section: "model"
demo_slug: "spectral-lines"
last_updated: "2026-02-23"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Back to guide: [Guide](#index)
> - Student demo: [Student demo](../../play/spectral-lines/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## Core model

Hydrogen level energies:
$$
E_n = -\frac{13.6\ \text{eV}}{n^2}
$$

Transition energy:
$$
\Delta E = 13.6\ \text{eV}\left(\frac{1}{n_{\rm lower}^2} - \frac{1}{n_{\rm upper}^2}\right)
$$

Photon relation:
$$
E_\gamma = h\nu = \frac{hc}{\lambda}
$$

## Implementation notes

- Shared physics API: `packages/physics/src/spectralLineModel.ts`
- Hydrogen transitions are computed (not hardcoded) from Bohr levels.
- Multi-element lines are empirical catalog entries (NIST-derived teaching subset).
- Wavelength units: nm (vacuum); energy: eV; frequency: Hz.

## Instructional clarifications

- Epistemic split to say explicitly in class: Hydrogen tab is a computed model ($E_n$, $\Delta E$, $\lambda$), while Elements tab is empirical line-catalog behavior used for fingerprint matching.
- Inverse mode makes this explicit: students enter observed $\lambda$ and infer the best hydrogen transition, which reframes spectroscopy as model-constrained inference.
- Bohr gives correct hydrogen energy eigenvalues at this level; it does not provide the modern spatial interpretation.
- Bound-state energies are negative because the zero reference is a free electron + proton at infinite separation.
- $n=\infty$ is the ionization limit and corresponds to $E=0$.
- Emission and absorption lines use the same $\Delta E$ values and therefore appear at the same wavelengths.
- Series convergence comes from shrinking energy-level spacing as $n_{\rm upper}$ increases.
- Large-$n$ scaling callout: adjacent spacing follows $\Delta E \approx 27.2\ \text{eV}/n^3$, so convergence is structural, not cosmetic.
- The Bohr-orbit SVG is explicitly not to scale; the energy-ladder view is the quantitative reference.
- Emission/absorption animations are pedagogical representations of the same transition energies.
- Hydrogen-tab temperature panel uses relative proxy populations normalized over $n=1,2,3$ plus a qualitative Balmer-strength proxy (Boltzmann excitation times neutral-H proxy), and is labeled as simplified.

## Recommended sanity checks during class

- Verify H-alpha near $656.3\ \text{nm}$.
- Verify Lyman-alpha near $121.6\ \text{nm}$.
- Show Balmer convergence trend as $n_{\rm upper}$ increases.
- Use the series microscope to show line pile-up toward $364.6\ \text{nm}$.
- Toggle to absorption and confirm wavelength positions are unchanged.
- Use Mystery reflection gate: students must state one pattern source before reveal.
