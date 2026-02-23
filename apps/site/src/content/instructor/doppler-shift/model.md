---
title: "Doppler Shift — Model & Math (Instructor Deep Dive)"
bundle: "doppler-shift"
section: "model"
demo_slug: "doppler-shift"
last_updated: "2026-02-23"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Back to guide: [Guide](#index)
> - Student demo: [Student demo](../../play/doppler-shift/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## Core model

Non-relativistic:
$$
\lambda_{\rm obs} = \lambda_0\left(1 + \frac{v_r}{c}\right),\qquad
\nu_{\rm obs} = \frac{\nu_0}{1 + v_r/c},\qquad
z_{\rm nonrel} = \frac{v_r}{c}
$$

Relativistic:
$$
\lambda_{\rm obs} = \lambda_0\sqrt{\frac{1+\beta}{1-\beta}},\qquad
\nu_{\rm obs} = \nu_0\sqrt{\frac{1-\beta}{1+\beta}},\qquad
\beta = \frac{v_r}{c}
$$

Inverse relation:
$$
\beta = \frac{(1+z)^2-1}{(1+z)^2+1}
$$

## Implementation notes

- Shared physics API: `packages/physics/src/dopplerShiftModel.ts`
- Demo state coupling is relativistic for $v_r \leftrightarrow z$ synchronization.
- Formula toggle chooses prediction/readout rendering mode.
- The redshift slider includes two regime markers at the 5% NR-divergence boundary (blue side and red side) because the $z(v_r)$ mapping is asymmetric.
- Spectrum lines come from `SpectralLineModel`; Fe uses a dense catalog path and defaults to strongest-8 view for readability.
- Representative-line readouts use visible-first anchoring (strongest line in $380$-$750\ \text{nm}$) with fallback to strongest-overall when no visible line exists.
- Mystery workflow now includes a post-check **Copy challenge evidence** helper for debrief artifacts.

## Pedagogical clarifications

- **Uniform light-wave spacing in this demo:** The observer receives crests at one steady spacing $\lambda_{\rm obs}$ for a fixed source velocity; the diagram intentionally rejects sound-style ripple intuition.
- **Non-rel asymmetry:** the wavelength relation is multiplicative while the frequency relation is divisive; they agree to first order, not exactly at finite speed.
- **Divergence interpretation:** the readout reports percent difference between $z_{\rm nonrel}$ and $z_{\rm rel}$ so students can quantify approximation quality.
- **Regime markers:** slider markers make the 5% NR-error boundary visible in both blue and red directions, with text cue for non-color accessibility.
- **Mechanism boundaries:** kinematic Doppler is modeled; cosmological and gravitational redshift are conceptually noted but not simulated.

## Instructor sanity checks

- H-alpha at rest near $656.3\ \text{nm}$.
- +300 km/s shifts redward by about $0.66\ \text{nm}$ (non-rel close to rel).
- Preset 7 ($z=0.158$) shows visible NR-vs-rel divergence.
- Preset 8 ($z=2$) clearly invalidates the non-rel approximation.
