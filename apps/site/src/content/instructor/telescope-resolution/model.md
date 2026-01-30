---
title: "Telescope Resolution — Model & Math (Instructor Deep Dive)"
bundle: "telescope-resolution"
section: "model"
demo_slug: "telescope-resolution"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/telescope-resolution/](/play/telescope-resolution/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/telescope-resolution/`  
> Model code: `demos/_assets/telescope-resolution-model.js`  
> UI/visualization code: `demos/telescope-resolution/resolution.js`

## What the demo is modeling (big picture)

This demo models the **diffraction limit** of a circular telescope aperture and uses it to decide whether a “binary star” pair is resolved. The big idea is that resolution is set by wave physics:

- A point source does not image to a point; it images to an **Airy pattern**.
- Two sources are “just resolved” when their Airy patterns are sufficiently separated (Rayleigh criterion).

The core physics utilities live in `demos/_assets/telescope-resolution-model.js` and are used by `demos/telescope-resolution/resolution.js`.

## Units + conventions used in the code

The shared model uses CGS-style internal units for convenience:

- Wavelength $\lambda$ stored in **cm** (e.g., 550 nm → $5.5\times 10^{-5}$ cm).
- Aperture diameter $D$ stored in **cm** (UI commonly uses meters, then converts).
- Angular resolution reported in **arcseconds**.

The model defines a convenience constant:

- `DIFF_COEFF = 251643.1` so that $\theta_{\text{arcsec}} = \text{DIFF\_COEFF}\cdot\lambda(\text{cm})/D(\text{cm})$ matches $1.22\lambda/D$ (in radians) converted to arcseconds.

## Key relationships to foreground (with meaning + units)

### Diffraction limit / Rayleigh scaling

$$\theta = 1.22\,\frac{\lambda}{D}$$

Let’s unpack each piece:

- **$\theta$** is the best-case angular resolution (radians).
- **$\lambda$** is wavelength (any length unit).
- **$D$** is aperture diameter (same length unit as $\lambda$).

What this equation is really saying: resolution improves with **bigger** apertures and worsens with **longer** wavelengths.

In the demo, this is converted to arcseconds:

$$\theta_{\text{arcsec}} \approx 251643.1\,\frac{\lambda(\text{cm})}{D(\text{cm})}$$

> **Sanity checks**
> - Units: $\lambda/D$ is dimensionless, so $\theta$ is in radians ✓
> - Scaling: if $D$ doubles, $\theta$ halves; if $\lambda$ doubles, $\theta$ doubles ✓

### Airy pattern (optional deep dive)

The intensity profile for a circular aperture is modeled as:

$$I(x) = \left[\frac{2J_1(x)}{x}\right]^2$$

where $J_1$ is a Bessel function and $x$ is a dimensionless radial coordinate (implemented in the shared model). This is what makes the “rings” and central bright spot.

## Assumptions, limitations, and sanity checks

- Assumes an ideal circular aperture and perfect optics (diffraction-limited performance).
- Atmospheric effects are modeled with a simple “seeing” term and an optional adaptive-optics toggle (not a full turbulence simulation).
- The “resolved / marginal / unresolved” labels use ratio cutoffs (didactic thresholds) to support classroom discussion rather than strict instrument performance characterization.
