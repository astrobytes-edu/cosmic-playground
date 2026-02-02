---
title: "Telescope Resolution — Activity Protocols"
bundle: "telescope-resolution"
section: "activities"
demo_slug: "telescope-resolution"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/telescope-resolution/](../../play/telescope-resolution/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## MW Quick (3–5 min)

**Type:** Demo-driven  
**Goal:** Replace “magnification = detail” with “aperture/wavelength set resolution.”

1. Open: `/play/telescope-resolution/`
2. Leave wavelength at **Visible (550 nm)**.
3. Ensure **Binary star mode** is on.
4. Set a moderate binary separation (so students can see the transition).
5. **Prediction prompt:** *“If we increase the telescope diameter, should the two stars become easier or harder to separate?”*
6. Increase aperture (e.g., Hubble → Keck). Watch the **resolution readout** drop and the status move toward resolved.
7. One-sentence debrief: “Magnification doesn’t change the diffraction limit; $D$ and $\lambda$ do.”

## MW Short (8–12 min)

**Type:** Demo-driven (pairs)  
**Goal:** Practice proportional reasoning with $\theta \propto \lambda/D$.

### Student task (pairs)
Fill in the table using presets and wavelength buttons. Record the diffraction limit (arcsec).

| Telescope preset | Wavelength | Resolution (arcsec) | Better/worse than visible? |
|-----------------|------------|---------------------|----------------------------|
| Hubble (2.4m) | Visible (550 nm) |  |  |
| Hubble (2.4m) | Radio (21 cm) |  |  |
| Keck (10m) | Visible (550 nm) |  |  |
| Keck (10m) | Near-IR ($2.2\\,\\mu\\mathrm{m}$) |  |  |

**Synthesis prompt (2 min):** *“Why do radio astronomers build arrays instead of a single ‘normal-sized’ dish?”*

## Friday Lab (20–30+ min)

**Type:** Demo-driven investigation (small groups)  
**Goal:** Connect physics limit (diffraction) to real observing constraints (atmosphere + AO).

### Driving question
“When is a telescope diffraction-limited, and when is it seeing-limited?”

### Protocol
1. Choose one telescope preset (Hubble, Keck, ELT).
2. For each wavelength button (UV, Visible, Near-IR, Mid-IR, Radio), record:
   - diffraction limit (arcsec),
   - whether the same binary separation is resolved.
3. Turn on **Include Atmosphere** and repeat at one wavelength:
   - vary the seeing slider,
   - then turn on **Adaptive Optics (AO)** and compare.
4. Write a claim–evidence–reasoning paragraph:
   - Claim: “For ground telescopes, atmosphere often dominates at ____ wavelength unless ____.”
   - Evidence: your recorded resolutions/status changes.
   - Reasoning: connect “blur from turbulence” to what AO is trying to correct.

## Station version (6–8 min)

> **Station card: Telescope Resolution (6–8 minutes)**
> **Artifact:** a “can this telescope resolve it?” card.
>
> Choose:
> - one telescope preset,
> - one wavelength (UV/Visible/Near-IR/Mid-IR/Radio),
> - one binary separation that is “marginal.”
>
> Record:
> - the resolution (arcsec),
> - the resolved/marginal/unresolved status,
> - one sentence explaining *why* (link to $\lambda$ and $D$, optionally atmosphere).

> **Word bank + sanity checks**
> **Word bank:**
> - **Resolution (diffraction limit):** the smallest angular separation a telescope can distinguish.
> - **Aperture $D$:** bigger $D$ → better (smaller) diffraction limit.
> - **Wavelength $\lambda$:** longer $\lambda$ → worse (larger) diffraction limit.
> - **Seeing (atmosphere):** turbulence can blur images beyond the diffraction limit; AO can partially correct.
>
> **Key relationship (diffraction-limited scaling):**
>
> $$\theta \propto \frac{\lambda}{D}$$
>
> **Sanity checks:**
> - Increasing $D$ should decrease the resolution number (better detail).
> - Increasing $\lambda$ should increase the resolution number (worse detail).
> - With “Include Atmosphere” on, the limit may stop improving unless AO is enabled.
