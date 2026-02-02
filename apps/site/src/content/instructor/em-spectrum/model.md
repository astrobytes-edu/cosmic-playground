---
title: "EM Spectrum — Model & Math (Instructor Deep Dive)"
bundle: "em-spectrum"
section: "model"
demo_slug: "em-spectrum"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/em-spectrum/](../../play/em-spectrum/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/em-spectrum/`  
> Model code: `demos/_assets/em-spectrum-model.js`  
> UI/visualization code: `demos/em-spectrum/em-spectrum.js`

## What the demo is modeling (big picture)

This demo is not a “simulation” in the same sense as the orbit demos. It is a **unit-aware calculator + lookup scaffold** that helps students connect three ways of describing the same electromagnetic radiation:

- **Wavelength** $\lambda$ (how long the wave is),
- **Frequency** $\nu$ (how many cycles per second),
- **Photon energy** $E$ (how much energy one photon carries).

The interactive piece (slider + band buttons + unit toggles) is there to make scaling relationships *feel* real: changing one representation forces consistent changes in the others.

## Units + conventions used in the code

The shared model utilities in `demos/_assets/em-spectrum-model.js` use:

- **Wavelength** in **centimeters** (cm) internally.
- **Frequency** in **Hertz** (Hz = 1/s).
- **Photon energy** in **erg** (CGS energy unit) internally, with display conversion to eV/keV/MeV or Joules.

The demo uses CGS constants:

- $c = 2.99792458\times10^{10}\ \text{cm/s}$
- $h = 6.62607015\times10^{-27}\ \text{erg·s}$
- $1\ \text{eV} = 1.602176634\times10^{-12}\ \text{erg}$

Band boundaries are teaching conventions (approximate wavelength ranges) implemented as fixed cutoffs in cm.

## Key relationships to foreground (with meaning + units)

### Wave relationship: $c = \lambda \nu$

$$c = \lambda \nu$$

Let’s unpack each piece:

- **$c$** is the speed of light in vacuum (cm/s).
- **$\lambda$** is wavelength (cm).
- **$\nu$** is frequency (1/s = Hz).

What this equation is really saying: for light, **wavelength and frequency trade off**. If you increase $\lambda$, $\nu$ must decrease so their product stays $c$.

> **Sanity checks**
> - Units: (cm)·(1/s) = cm/s ✓
> - Scaling: if $\lambda$ doubles, $\nu$ halves ✓

### Photon relationship: $E = h\nu = hc/\lambda$

$$E = h\nu = \frac{hc}{\lambda}$$

Let’s unpack each piece:

- **$E$** is energy per photon (erg).
- **$h$** is Planck’s constant (erg·s).
- **$\nu$** is frequency (1/s).
- **$c$** is the speed of light (cm/s).
- **$\lambda$** is wavelength (cm).

What this equation is really saying: shorter wavelengths correspond to **higher-energy photons**, even if the total brightness (number of photons) is a separate question.

> **Sanity checks**
> - Units: (erg·s)·(1/s) = erg ✓
> - Scaling: if $\lambda$ gets $10\\times$ smaller, $E$ gets $10\\times$ larger ✓

## Assumptions, limitations, and sanity checks

- These relationships assume propagation in vacuum (good approximation for most astronomy contexts).
- The “radio / IR / visible / UV / X-ray / gamma” boundaries are approximate conventions; the demo uses fixed cutoffs for teaching.
- The demo is about **photon energy**, not intensity. A radio source can be extremely bright (many low-energy photons).
