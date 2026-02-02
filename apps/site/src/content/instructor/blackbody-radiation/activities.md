---
title: "Blackbody Radiation — Activity Protocols"
bundle: "blackbody-radiation"
section: "activities"
demo_slug: "blackbody-radiation"
last_updated: "2026-02-02"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/blackbody-radiation/](../../play/blackbody-radiation/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## MW Quick (3–5 min)

**Type:** Demo-driven  
**Goal:** Flip the “red = hot” intuition using prediction-first evidence.

1. Open: `/play/blackbody-radiation/`
2. Click the **M dwarf** preset. Ask: *“Hotter or cooler than the Sun?”* (Prediction.)
3. Click **Sun**. Ask again: *“Which is hotter: Sun or M dwarf?”*
4. Reveal with the temperature readout and the spectrum peak position. Say explicitly: in astronomy, **redder stars are cooler**.
5. 20-second debrief: “Color is an observable; the blackbody model connects it to temperature.”

## MW Short (8–12 min)

**Type:** Demo-driven (pairs)  
**Goal:** Empirically discover Wien scaling (peak shifts) without “plug-and-chug.”

### Student task (pairs)
1. Start at **Sun**.
2. Record:
   - temperature $T$,
   - peak wavelength $\lambda_{\text{peak}}$ (use the peak marker),
   - a short description of which band dominates (visible vs IR vs UV/microwave).
3. Change to a cooler preset (**M dwarf**) and a hotter preset (**A/B star**).
4. Answer (in words): *“When $T$ increases, what happens to $\lambda_{\text{peak}}$? What happens to the area under the curve?”*

**Optional quantitative check (2 min):** pick two temperatures where one is about $2\times$ the other and see whether $\lambda_{\text{peak}}$ is about half (Wien scaling).

## Friday Lab (20–30+ min)

**Type:** Demo-driven investigation (small groups)  
**Goal:** Build a claim–evidence model: temperature controls both peak wavelength and total emitted power.

### Driving questions
1. How does $\lambda_{\text{peak}}$ depend on $T$?
2. How does the total emitted power per area depend on $T$?

### Protocol
1. Choose 5 temperatures spanning the slider range (record them).
2. For each temperature, record:
   - $\lambda_{\text{peak}}$ from the peak marker/readout,
   - the luminosity/flux indicator readout (if shown) or a qualitative “more/less area” statement.
3. Make two claims with evidence:
   - Claim A (Wien): “Hotter → peak shifts to shorter wavelength.”
   - Claim B (Stefan): “Hotter → much more total emission.”
4. Write one paragraph connecting the results to stellar color:
   - “Why are cool stars red?”
   - “Why might cool objects be ‘invisible’ to our eyes but visible in IR?”

### Extension (if time)
Use the **log vs linear** display toggle and discuss: “Which view makes the long-wavelength tail easier to see, and why might astronomers like log plots?”

## Station version (6–8 min)

> **Station card: Blackbody Radiation (6–8 minutes)**
> Pick one preset (**M dwarf**, **Sun**, **A/B star**, or **CMB**) and record:
> - Temperature $T$ (K)
> - Peak wavelength $\lambda_{\text{peak}}$ (nm)
> - Which band dominates (IR / visible / UV / microwave)
>
> Then write one sentence:
> > “This star looks ____ because its blackbody peak is at ____.”

> **Word bank + sanity checks**
> **Word bank:**
> - **Blackbody spectrum:** the ideal “thermal glow” curve; temperature sets its shape.
> - **Temperature $T$ (K):** hotter objects emit more and peak at shorter wavelengths.
> - **Peak wavelength $\lambda_{\text{peak}}$:** where the curve is highest (the “peak marker”).
>
> **Key relationship (Wien scaling):**
>
> $$\lambda_{\text{peak}} \propto \frac{1}{T}$$
>
> **Sanity checks:**
> - Hotter → $\lambda_{\text{peak}}$ shifts to *shorter* wavelength (toward blue/UV).
> - Cooler → $\lambda_{\text{peak}}$ shifts to *longer* wavelength (toward red/IR).
> - In astronomy, “redder” blackbodies are **cooler**, not hotter.
