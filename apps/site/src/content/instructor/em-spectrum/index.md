---
title: "EM Spectrum"
bundle: "em-spectrum"
section: "index"
demo_slug: "em-spectrum"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/em-spectrum/](../../play/em-spectrum/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/em-spectrum/`  
> Main code: `demos/em-spectrum/em-spectrum.js`  
> Model code: `demos/_assets/em-spectrum-model.js`  
> Data: `demos/em-spectrum/object-data.js`, `demos/em-spectrum/telescope-data.js`

> **Where to go next**
> - Model + math + assumptions: `model.qmd`
> - In-class activities (MW + Friday lab + station version): `activities.qmd`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.qmd`
> - Future enhancements (planning backlog): `backlog.qmd`

## Why this demo exists

> **Why This Matters**
> In astronomy we mostly observe **photons**, not the objects directly. This demo helps students build a correct mental model of what “different kinds of light” means: same physics, different **wavelength** $\lambda$, **frequency** $\nu$, and **photon energy** $E$. That matters because the Universe looks different in different bands, and because *what you can measure depends on the detector you build*.

This demo is designed to reinforce the ASTR 101 throughline: **observable → model → inference**.

- **Observable:** the wavelength slider (and band buttons) change what part of the spectrum you are “observing.”
- **Model:** the wave + photon relationships connect wavelength to frequency and energy.
- **Inference:** different bands reveal different physical conditions (cold dust vs hot plasma, etc.), so multi-wavelength observations give a more complete story.

## Learning goals (ASTR 101)

By the end of this demo, students should be able to:

- State the core relationships qualitatively: longer wavelength ↔ lower frequency ↔ lower photon energy.
- Recognize that **visible light is a tiny slice** of the electromagnetic spectrum.
- Explain why we need **different telescopes/detectors** for different wavelength bands.
- Predict which bands are best for “cold dust,” “hot gas,” or “violent events,” at a basic descriptive level.

## Learning goals (ASTR 201 stretch)

Students should be able to:

- Use the model equations to convert between $\lambda$, $\nu$, and $E$ (with units).
- Compare photon energies across bands (e.g., “how many radio photons equal one X-ray photon?”).
- Explain why the demo uses CGS internally (cm, erg) while reporting frequency in Hz.

## 10–15 minute live-teach script (projector)

1. **Start in the visible band.** Click **Visible** and ask: *“Is visible the ‘middle’ of what exists, or just what our eyes evolved to detect?”* (Prediction before observation.) Then zoom out with the full slider range to make the “tiny slice” point concrete.

2. **Prediction: ordering game.** Ask students to rank (no calculations): *radio, infrared, visible, X-ray* from lowest to highest photon energy. Then use the slider + energy readout to check the ordering.

3. **Connect the relationships (one idea at a time).**
   - Move the slider to longer wavelengths and ask: *“What must happen to frequency if the speed of light stays the same?”*
   - Then ask: *“If frequency drops, what happens to photon energy?”*
   Use the live updating readouts to confirm each step.

4. **Detector reality check (measurement constraints).** Click bands that are familiar (Radio → Microwave → Visible → X-ray) and ask: *“Could you build a detector for this band and use it from the ground?”* Use this to motivate atmosphere + instrument design (space telescopes for UV/X-ray/gamma; radio can pass through clouds; infrared often needs cooled detectors).

5. **Astronomy examples (inference).** Use the examples/objects mode to show that “different light = different physics.” Ask: *“If you want to see through dust to star-forming regions, which band would you choose?”* Then *“What band reveals extremely hot gas around black holes?”*

6. **Wrap with Observable → Model → Inference.** Say explicitly: *“We measure photons at some wavelength; the physics model tells us what energies/temperatures/processes could produce them; then we infer what’s happening in places we can’t touch.”*

## Misconceptions + prediction prompts

Use these as quick “wrong-model first” prompts:

- **Misconception:** “Radio waves are sound.”  
  **Prompt:** *“If radio is ‘sound,’ would it travel through space?”* Then emphasize: radio is **light** (electromagnetic radiation), not pressure waves.

- **Misconception:** “Infrared = heat (and only heat).”  
  **Prompt:** *“Is visible light ‘not energy’ because it isn’t called heat?”* Reinforce: all EM radiation carries energy; IR is often associated with thermal emission because many warm objects emit strongly there.

- **Misconception:** “X-rays and gamma rays are fundamentally different kinds of stuff.”  
  **Prompt:** *“What changes continuously as you slide from X-ray to gamma?”* Emphasize: same physics; categories are teaching conventions based on wavelength/energy ranges.

- **Misconception:** “We see ‘most’ of the light.”  
  **Prompt:** *“If the spectrum were a piano keyboard, how many keys would your eyes cover?”* Then use the full slider range to correct the intuition.

## Suggested connections to other demos

- **Blackbody radiation:** temperature shifts the peak wavelength; this demo supplies the spectrum vocabulary needed to interpret “hotter → bluer peak.”
- **Telescope resolution:** diffraction limit depends on wavelength; this demo helps students accept that “same telescope” behaves differently across bands.
