---
title: "Doppler Shift"
bundle: "doppler-shift"
section: "index"
demo_slug: "doppler-shift"
last_updated: "2026-02-23"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Student demo: [Student demo](../../play/doppler-shift/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/doppler-shift/`  
> Main code: `apps/demos/src/demos/doppler-shift/main.ts`  
> UI logic: `apps/demos/src/demos/doppler-shift/logic.ts`  
> Physics model: `packages/physics/src/dopplerShiftModel.ts`

## Why this demo exists

This instrument helps students connect one measurable observable (spectral line shift) to one hidden physical quantity (radial velocity).

It is intentionally dual-view:
- wave-spacing mechanism (uniform observer-side spacing), and
- lab-vs-observed spectral line comparator with connectors.

## Learning goals

- Distinguish redshift and blueshift with sign-correct velocity language.
- Convert among $\lambda$, $\nu$, $z$, and $v_r$ with unit-safe readouts.
- Explain when non-relativistic Doppler is acceptable and when relativistic Doppler is required.
- Separate kinematic Doppler shift from cosmological and gravitational redshift mechanisms.

## Recommended 12-15 minute live sequence

1. Start at rest and establish line-matching baseline.
2. Move to $\pm 300\ \text{km/s}$ and narrate direction + magnitude in both wavelength and frequency.
3. Trigger preset 7 ($z=0.158$) and compare formula outputs.
4. Trigger preset 8 ($z=2$) and ask why non-rel now fails.
5. Use one mystery round as a quick inferential check.

## Misconceptions to target

- "Light should bunch up like sound ripples in air."
- "All redshift is cosmological redshift."
- "If wavelength goes up by x%, frequency always goes down by exactly x%."
