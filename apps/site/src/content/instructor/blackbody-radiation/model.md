---
title: "Blackbody Radiation — Model & Math (Instructor Deep Dive)"
bundle: "blackbody-radiation"
section: "model"
demo_slug: "blackbody-radiation"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/blackbody-radiation/](../../play/blackbody-radiation/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/blackbody-radiation/`  
> Model code: `demos/_assets/blackbody-model.js`  
> UI/visualization code: `demos/blackbody-radiation/blackbody.js`

## What the demo is modeling (big picture)

This demo models the spectrum of an idealized **blackbody**: an object that absorbs all incident radiation and emits a temperature-dependent spectrum of thermal light. The UI is built to highlight three linked ideas:

- **Shape:** the Planck curve has a steep short-wavelength side and a long tail.
- **Peak shift:** hotter objects peak at shorter wavelengths (Wien’s law).
- **Total power:** hotter objects emit dramatically more energy per unit area (Stefan–Boltzmann law).

The model computations live in `demos/_assets/blackbody-model.js` and are used by the interactive view in `demos/blackbody-radiation/blackbody.js`.

## Units + conventions used in the code

The shared model uses CGS internally:

- Wavelength $\lambda$ in **cm**
- Temperature $T$ in **K**
- Spectral radiance $B_\lambda$ in **erg/s/cm²/sr/cm** (theoretical units; the UI may plot in relative scaling for readability)

Key constants (as implemented in `demos/_assets/blackbody-model.js`):

- $c = 2.998\times 10^{10}\ \text{cm/s}$
- $h = 6.626\times 10^{-27}\ \text{erg·s}$
- $k_B = 1.381\times 10^{-16}\ \text{erg/K}$
- $\sigma = 5.670\times 10^{-5}\ \text{erg}/(\text{cm}^2\cdot\text{s}\cdot\text{K}^4)$
- $b = 0.2898\ \text{cm·K}$ (Wien displacement constant in cm·K)

## Key relationships to foreground (with meaning + units)

### Wien’s displacement law: peak wavelength vs temperature

$$\lambda_{\text{peak}} = \frac{b}{T}$$

Let’s unpack each piece:

- **$\lambda_{\text{peak}}$** is the wavelength of peak emission (cm).
- **$b$** is Wien’s displacement constant (cm·K).
- **$T$** is temperature (K).

What this equation is really saying: hotter objects peak at **shorter** wavelengths.

> **Sanity checks**
> - Units: (cm·K)/K = cm ✓
> - Scaling: if $T$ doubles, $\lambda_{\text{peak}}$ halves ✓

### Stefan–Boltzmann law: total emitted flux vs temperature

$$F = \sigma T^4$$

Let’s unpack each piece:

- **$F$** is total emitted energy per unit area per unit time (erg/s/cm²).
- **$\sigma$** is the Stefan–Boltzmann constant.
- **$T$** is temperature (K).

What this equation is really saying: temperature has a **very steep** effect on total power output per unit area.

> **Sanity checks**
> - Scaling: if $T$ doubles, $F$ increases by $2^4 = 16$ ✓

### Planck function: the full spectrum shape (optional deep dive)

$$B_\lambda(T) = \frac{2hc^2}{\lambda^5}\cdot\frac{1}{e^{hc/(\lambda k_B T)} - 1}$$

Let’s unpack each piece (conceptually):

- The prefactor $2hc^2/\lambda^5$ sets the overall scaling and pushes the curve down at long wavelengths.
- The exponential term sets the sharp cutoff at short wavelengths.

For teaching, you usually do not need students to memorize this. The demo uses it to generate the characteristic curve and then uses Wien + Stefan as the interpretable “handles.”

## Assumptions, limitations, and sanity checks

- The model assumes an ideal blackbody (emissivity = 1). Real stars are approximate blackbodies with spectral lines superimposed.
- The temperature-to-color display is a **perceptual approximation**, not full colorimetry (`temperatureToColor` is explicitly documented as approximate in the model).
- Numerical stability: the implementation clips extreme exponents (e.g., returns 0 when the Planck exponent is very large) to avoid overflow.
