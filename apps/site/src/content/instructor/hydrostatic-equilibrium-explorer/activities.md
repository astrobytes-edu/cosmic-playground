---
title: "Hydrostatic Equilibrium Explorer — Activity Protocols"
bundle: "hydrostatic-equilibrium-explorer"
section: "activities"
demo_slug: "hydrostatic-equilibrium-explorer"
last_updated: "2026-03-18"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Back to guide: [Guide](#index)
> - Student demo: [Student demo](../../play/hydrostatic-equilibrium-explorer/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## 0-2 min: Predict

**Prompt:** “If gravity gets stronger but the star’s size stays the same, what must happen to the pressure gradient and core temperature?”

**Student action:** Write one prediction sentence and one reason.

**Expected observation:** Students usually predict “more pressure” but miss that the gradient has to steepen, not just the center pressure.

**Instructor move:** Ask them to say whether the change is local or global before revealing the readouts.

## 2-6 min: Play the balance

**Prompt:** “What does balanced support look like in the readout?”

**Student action:** Start from the solar-like baseline and identify the balance indicator, $g$, and $H_P$.

**Expected observation:** Students notice that the supported state is not flat; it has a specific gradient scale.

**Instructor move:** Point to the local nature of the balance and connect it to $\\frac{dP}{dr}$.

## 6-10 min: Scale height reasoning

**Prompt:** “What happens to $H_P$ when the star is more compact?”

**Student action:** Shrink the radius or raise the mass and compare the new $H_P$ to the baseline.

**Expected observation:** $H_P$ decreases as gravity strengthens.

**Instructor move:** Translate the visual change into the statement $H_P = P/(\\rho g)$.

## 10-13 min: Ideal gas and temperature

**Prompt:** “If the same pressure must be carried by fewer particles per gram, what changes?”

**Student action:** Adjust $\\mu$ and watch the inferred $T_c$.

**Expected observation:** Higher $\\mu$ requires a higher temperature for the same pressure support.

**Instructor move:** Make the composition link explicit and separate it from the gravity link.

## 13-15 min: Explain

**Prompt:** “Use one sentence to connect gravity, scale height, and the ideal gas law.”

**Student action:** Share a claim with one number or one readout from the station card.

**Expected observation:** Students can usually say “stronger gravity needs a steeper pressure gradient,” but they may need help naming the scale-height step.

**Instructor move:** Close with the support chain in order: gravity -> $\\frac{dP}{dr}$ -> $H_P$ -> ideal gas -> $T_c$.

## Station version (8-10 min)

Use `apps/site/src/content/stations/hydrostatic-equilibrium-explorer.md` as the printable student artifact.
