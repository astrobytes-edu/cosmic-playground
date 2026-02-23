---
title: "Spectral Lines"
bundle: "spectral-lines"
section: "index"
demo_slug: "spectral-lines"
last_updated: "2026-02-22"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Student demo: [Student demo](../../play/spectral-lines/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/spectral-lines/`  
> Main code: `apps/demos/src/demos/spectral-lines/main.ts`  
> UI logic: `apps/demos/src/demos/spectral-lines/logic.ts`  
> Physics model: `packages/physics/src/spectralLineModel.ts`

## Why this demo exists

This demo links three synchronized representations of one physical process:
- Bohr orbit transitions,
- quantized energy levels in eV,
- observed spectral lines in wavelength space.

The instructional target is to move students from memorizing named lines (H-alpha, Lyman-alpha) to using model structure:
$E_n = -13.6\ \text{eV}/n^2$ and $E_\gamma = hc/\lambda$.

## Learning goals

- Explain why hydrogen emits/absorbs only specific wavelengths.
- Predict how line wavelength changes as $n_{\rm upper}$ increases within a fixed series.
- Distinguish emission vs absorption as the same transition energies with different background conditions.
- Use line-pattern matching language to motivate element fingerprinting.

## Recommended 10-15 minute live sequence

1. Start at Balmer H-alpha ($3\to2$), ask for color prediction before reveal.
2. Step to H-beta and H-gamma, ask what trend they notice in $\lambda$.
3. Switch to Lyman and ask why the lines are not visible.
4. Toggle to Absorption and ask what changed and what did not.
5. Move to Elements tab for quick "fingerprint" pattern comparison.

## Common misconceptions to target

- "Bohr is totally wrong."  
For hydrogen energy levels, Bohr energies are correct; the spatial orbit picture is the approximation.

- "Emission and absorption are different lines."  
The wavelengths are the same; only bright-vs-dark presentation changes.

- "Any near-match photon can be absorbed."  
Bound-bound absorption requires the correct transition energy.
