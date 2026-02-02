---
title: "Blackbody Radiation"
bundle: "blackbody-radiation"
section: "index"
demo_slug: "blackbody-radiation"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Student demo: [/play/blackbody-radiation/](../../play/blackbody-radiation/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/blackbody-radiation/`  
> Main code: `apps/demos/src/demos/blackbody-radiation/main.ts`  
> Model code: `packages/physics/src/blackbodyRadiationModel.ts`

> **Where to go next**
> - Model + math + assumptions: `model.md`
> - In-class activities (MW + Friday lab + station version): `activities.md`
> - Assessment bank (clickers + short answer + exit ticket): `assessment.md`
> - Future enhancements (planning backlog): `backlog.md`

## Why this demo exists

> **Why This Matters**
> “Color” is one of the most information-dense measurements we can make in astronomy. This demo helps students build the correct mapping between **temperature** and the spectrum of thermal light: hotter objects emit *more* light overall and peak at *shorter* wavelengths. That turns an observable (spectrum/color) into a physical inference (temperature, and—when combined with radius—luminosity).

This demo makes the Observable → Model → Inference pattern explicit:

- **Observable:** the shape and peak position of a spectrum as temperature changes.
- **Model:** blackbody radiation laws (Planck shape; Wien peak shift; Stefan–Boltzmann total power).
- **Inference:** star temperature (and how “red vs blue” in astronomy reverses everyday fire intuition).

## Learning goals (ASTR 101)

By the end of this demo, students should be able to:

- State the qualitative rules: hotter → peak at shorter wavelength (“bluer” peak) and larger total emitted power.
- Explain why “red” stars are cooler than “blue” stars (astronomy vs fire analogy).
- Recognize stars as approximate blackbodies (useful first model).
- Use the visible band highlight to explain why some objects are “invisible” to our eyes but visible to IR telescopes.

## Learning goals (ASTR 201 stretch)

Students should be able to:

- Use Wien’s law $\lambda_{\text{peak}} \propto 1/T$ to reason about how peak wavelength shifts.
- Use Stefan–Boltzmann scaling $F \propto T^4$ to compare total emitted power per unit area.
- Connect temperature + radius to luminosity conceptually ($L \propto R^2 T^4$).

## 10–15 minute live-teach script (projector)

1. **Start with a prediction rooted in everyday intuition.** Ask: *“In everyday life, red things feel hot (fire, stove coils). In astronomy, do you think red stars are hotter or cooler than blue stars?”* Collect predictions.

2. **Anchor with a familiar reference.** Click the **Sun** preset and point out the visible-band highlight and the peak marker. Ask: *“If we could see from space, would the Sun look yellow or closer to white?”* Use this as a setup for “our atmosphere/eyes bias what ‘color’ feels like.”

3. **Change temperature and watch two things at once.** Move to a cooler preset (e.g., **M dwarf**) and ask students to predict what happens to:
   - the peak wavelength location, and
   - the overall height/area of the curve.
   Then reveal and narrate: cooler → peak shifts to longer wavelengths and total emission drops.

4. **Then go hotter.** Click the **A/B star** preset. Ask: *“Should the peak move toward the UV or toward the IR?”* Confirm with the peak marker and the visible-band highlight.

5. **Compare two temperatures using the instrument workflow.** Add two rows in **Station mode** (or copy results twice) and ask: *“If temperature doubles, what happens to the peak wavelength?”* (Half) and *“What happens to total emitted power per area?”* (Grows dramatically; connect to $T^4$ qualitatively.)

6. **Close with inference.** Say explicitly: *“Color/spectrum is an observable. A model turns that into a temperature inference. Then temperature plus other measurements supports higher-level stories: stellar types, star formation, and what we can detect.”*

## Misconceptions + prediction prompts

Use these to trigger cognitive conflict:

- **Misconception:** “Red means hot.”  
  **Prompt:** *“If ‘red = hot,’ then would a red star be more energetic than a blue star?”* Use the spectrum peak shift to show red stars peak at longer wavelengths (cooler).

- **Misconception:** “Blue stars are young.”  
  **Prompt:** *“What physical property does this demo actually control?”* (Temperature.) Emphasize: color ↔ temperature; age is a separate inference.

- **Misconception:** “The Sun is yellow.”  
  **Prompt:** *“What does the spectrum say about where the Sun emits most strongly?”* Use the peak marker and the visible band highlight to separate “spectrum” from “how it looks from Earth.”

- **Misconception:** “Infrared means ‘heat’ (only).”  
  **Prompt:** *“If IR is ‘heat,’ what would it mean to say the Sun emits infrared?”* Reinforce: thermal radiation spans bands; IR telescopes help because cooler objects peak there.

## Suggested connections to other demos

- **EM spectrum:** puts wavelength bands in context; helps students interpret “peak in UV” vs “peak in IR.”
- **Telescope resolution:** observing in the infrared changes resolution for a given aperture; tie “why JWST is IR” to what tradeoffs it accepts.
