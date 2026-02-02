---
title: "Telescope Resolution — Assessment Bank"
bundle: "telescope-resolution"
section: "assessment"
demo_slug: "telescope-resolution"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/telescope-resolution/](../../play/telescope-resolution/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## Clicker questions (with distractors + explanation)

### Clicker 1 — What sets resolution?

**Demo setup:** open `/play/telescope-resolution/` (Visible).

**Question:** In this model, the best-case angular resolution is controlled primarily by:

A. Magnification  
B. Aperture diameter and wavelength  
C. Exposure time  
D. The object’s distance

**Correct:** B  
**Why:** Diffraction scaling $\theta \propto \lambda/D$.  
**Misconception targeted:** “More magnification = more detail.”

### Clicker 2 — Doubling aperture

**Demo setup:** keep wavelength fixed; change aperture.

**Question:** If you double the aperture diameter $D$ (same wavelength), the diffraction-limited resolution angle $\theta$:

A. doubles (worse)  
B. halves (better)  
C. stays the same  
D. becomes zero

**Correct:** B  
**Why:** $\theta \propto 1/D$.  
**Misconception targeted:** “Bigger telescope only collects more light.”

### Clicker 3 — Longer wavelength

**Demo setup:** keep aperture fixed; compare **Visible** vs **Radio (21 cm)**.

**Question:** At longer wavelength, resolution becomes:

A. better (smaller $\theta$)  
B. worse (larger $\theta$)  
C. unchanged  
D. unpredictable

**Correct:** B  
**Why:** $\theta \propto \lambda$.  
**Misconception targeted:** “All light behaves the same for imaging.”

### Clicker 4 — Space vs ground

**Demo setup:** compare with and without **Include Atmosphere**.

**Question:** Turning on the atmosphere mainly demonstrates:

A. Space telescopes are diffraction-limited; ground telescopes can be seeing-limited.  
B. Space telescopes have larger apertures.  
C. The speed of light changes in air.  
D. Diffraction disappears in space.

**Correct:** A  
**Why:** The demo’s “seeing” term can dominate ground-based imaging unless corrected.  
**Misconception targeted:** “Space makes telescopes powerful regardless of aperture.”

### Clicker 5 — What does adaptive optics do (in the demo’s story)?

**Demo setup:** enable **Include Atmosphere**, then toggle **Adaptive Optics (AO)**.

**Question:** In this demo’s simplified model, AO mainly:

A. makes wavelength shorter  
B. increases aperture diameter  
C. reduces the effective blurring from the atmosphere  
D. violates the diffraction limit

**Correct:** C  
**Why:** AO is modeled as reducing the seeing contribution; it does not remove diffraction.  
**Misconception targeted:** “AO lets you beat physics.”

### Clicker 6 — Why interferometry?

**Demo setup:** none.

**Question:** Astronomers use interferometry (arrays) in radio astronomy mainly because:

A. Radio photons are too weak to detect with one dish  
B. Radio wavelengths are long, so a larger effective aperture/baseline is needed for good resolution  
C. Radio telescopes can’t be built on Earth  
D. Interferometry increases the speed of light

**Correct:** B  
**Why:** Long $\lambda$ means worse diffraction-limited resolution for a given $D$, so we build larger effective baselines.  
**Misconception targeted:** “Radio just can’t do detail.”

## Short-answer prompts

1. Explain (in words) why magnification has diminishing returns for detail.
2. Using $\theta \propto \lambda/D$, describe two ways to improve angular resolution.
3. What problem does Earth’s atmosphere create for images? How does AO try to help?
4. The demo includes an IR option even though IR has worse diffraction-limited resolution for a given telescope. Give one reason an observatory might still choose IR observations.

## Exit ticket (3 questions)

1. What happens to resolution when $D$ increases (holding $\lambda$ fixed)?
2. What happens to resolution when $\lambda$ increases (holding $D$ fixed)?
3. Name one misconception about telescopes that this demo corrects.
