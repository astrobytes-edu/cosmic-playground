---
title: "Galaxy Rotation Curves — Model & Math (Instructor Deep Dive)"
bundle: "galaxy-rotation"
section: "model"
demo_slug: "galaxy-rotation"
last_updated: "2026-02-23"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Back to guide: [Guide](#index)
> - Student demo: [Student demo](../../play/galaxy-rotation/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## Core model

Component quadrature:
$$
V_{\\rm total}(R)=\\sqrt{V_{\\rm bulge}^2+V_{\\rm disk}^2+V_{\\rm halo}^2}
$$

Dark-matter inference:
$$
M_{\\rm dark}(<R)=\\frac{V_{\\rm obs}^2R}{G}-M_{\\rm vis}(<R)
$$

Keplerian benchmark:
$$
V_{\\rm Kep}(R)\\propto R^{-1/2} \\quad (R\\gg R_d)
$$

MOND comparison (asymptotic form):
$$
V_{\\rm MOND}\\approx\\left(G\\,M_{\\rm vis}\\,a_0\\right)^{1/4}
$$

## Implementation notes

- Shared physics API: `packages/physics/src/galaxyRotationModel.ts`
- Mass components:
  - bulge: Hernquist enclosed mass
  - disk: exact exponential-disk rotation using modified Bessel $I_0,I_1,K_0,K_1$
  - halo: NFW enclosed mass with derived $R_{\\rm vir}$ and concentration $c$
- Units are explicit in API naming (`radiusKpc`, `velocityKmS`, `mass10`).
- `G_{\\rm galaxy}=4.3009\\times10^4\\,\\text{kpc}\\,(\\text{km/s})^2\\,(10^{10}M_\\odot)^{-1}`.
- NFW derived values use internal cosmology defaults ($H_0=67.4\\,{\\rm km\\,s^{-1}\\,Mpc^{-1}}$, $\\Omega_m=0.315$).
- The 21-cm readout ties rotation speed to directly measurable wavelength shift:
$$
\\Delta\\lambda_{21}=\\lambda_0\\frac{V}{c},\\qquad \\lambda_0=21.106\\,{\\rm cm}
$$

## Pedagogical clarifications

- **Face-on panel is schematic:** real observations use inclined disks and recover intrinsic $V(R)$ with inclination corrections.
- **Solar-system comparison inset:** gives students a familiar Keplerian baseline before comparing galaxy behavior.
- **MOND framing:** useful comparison at galaxy scale, but not presented as a full replacement workflow in this instrument.
- **Across-scale context matters:** cluster dynamics, Bullet Cluster lensing offsets, and CMB constraints remain part of the interpretation story.
