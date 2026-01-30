---
title: "Telescope Resolution"
bundle: "telescope-resolution"
section: "index"
demo_slug: "telescope-resolution"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Student demo: [/play/telescope-resolution/](/play/telescope-resolution/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/telescope-resolution/`  
> Main code: `demos/telescope-resolution/resolution.js`  
> Model code: `demos/_assets/telescope-resolution-model.js`  
> Data: `demos/telescope-resolution/telescope-data.js`

> **Where to go next**
> - Model + math + assumptions: `model.qmd`
> - In-class activities (MW + Friday lab + station version): `activities.qmd`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.qmd`
> - Future enhancements (planning backlog): `backlog.qmd`

## Why this demo exists

> **Why This Matters**
> “Bigger telescope” is not just about collecting more light; it is also about seeing finer detail. This demo helps students replace the common “magnification = detail” model with the correct constraint: **wave diffraction** sets a best-case angular resolution that depends on **wavelength** and **aperture**.

This demo is structured as Observable → Model → Inference:

- **Observable:** whether two close point sources look like one blur or two distinct peaks.
- **Model:** diffraction (Airy pattern) and the Rayleigh criterion scaling $\theta \propto \lambda/D$.
- **Inference:** why large apertures, short wavelengths, space telescopes, and interferometry matter for what we can measure.

## Learning goals (ASTR 101)

By the end of this demo, students should be able to:

- Explain why **magnification alone** cannot reveal more detail beyond a limit.
- State the qualitative scaling: larger $D$ → smaller (better) $\theta$; longer $\lambda$ → larger (worse) $\theta$.
- Use “resolved vs unresolved” as a measurement concept (an observational constraint, not a personal failure of eyesight).
- Give at least one reason radio astronomy uses huge dishes/arrays (long wavelengths).

## Learning goals (ASTR 201 stretch)

Students should be able to:

- Interpret the Rayleigh criterion formula and the meaning of each symbol.
- Compare resolutions across realistic telescope presets and wavelengths (order-of-magnitude reasoning).
- Connect “instrument design choices” (e.g., infrared optimization) to the resolution tradeoff.

## 10–15 minute live-teach script (projector)

1. **Start with the misconception.** Ask: *“If I keep increasing magnification, can I always see more detail?”* Get a show of hands and commit to predictions.

2. **Binary-star test as the observable.** Turn on the **Binary Star** mode. Set a separation where it is clearly resolved, then decrease separation and ask: *“At what point do two become one?”*

3. **Change aperture (holding wavelength fixed).** Move the **Aperture** slider upward and ask students to predict: *“Does increasing diameter make the blur bigger or smaller?”* Confirm by watching the Airy disk shrink and the status indicator move toward “resolved.”

4. **Change wavelength (holding aperture fixed).** Move the **Wavelength** slider from visible to IR/radio and ask: *“What happens to resolution at longer wavelength?”* Use this to motivate why ALMA-style instruments need large baselines.

5. **Use telescope presets as narrative anchors.** Click a few presets (Human Eye → Hubble → Keck/JWST). Ask: *“Which change matters most for resolution: being in space, or being big?”* Reinforce: space removes atmosphere, but the diffraction limit still depends on aperture and wavelength.

6. **Close with inference language.** Say explicitly: *“Resolution is a constraint on what we can infer. If two things are unresolved, it doesn’t mean they aren’t there; it means your instrument can’t separate them.”*

## Misconceptions + prediction prompts

Use these “predict first” prompts to surface wrong models:

- **Misconception:** “More magnification = more detail.”  
  **Prompt:** *“If magnification were the key, what slider would matter most?”* Then show it’s aperture/wavelength that controls the Airy pattern.

- **Misconception:** “Small telescopes can resolve exoplanets next to stars.”  
  **Prompt:** *“What happens when separation is tiny even for large apertures?”* Use the status indicator to frame “hard measurement problem.”

- **Misconception:** “Radio telescopes can’t see details.”  
  **Prompt:** *“Is the problem radio itself, or radio wavelength?”* Use wavelength dependence, then introduce interferometry as the workaround conceptually.

## Suggested connections to other demos

- **Angular size:** reframes “detail” as an angular concept; what matters is how many arcseconds separate features.
- **EM spectrum:** wavelength choice is an observing choice; students can connect “what you observe” to “what you can resolve.”
