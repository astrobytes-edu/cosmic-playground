---
title: "Galaxy Rotation Curves"
bundle: "galaxy-rotation"
section: "index"
demo_slug: "galaxy-rotation"
last_updated: "2026-02-23"
has_math: true
---
> **Navigation**
> - Instructor hub: [Instructor hub](../../instructor/)
> - Student demo: [Student demo](../../play/galaxy-rotation/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **This guide is instructor-facing**
> Student demo: `/play/galaxy-rotation/`  
> Main code: `apps/demos/src/demos/galaxy-rotation/main.ts`  
> UI logic: `apps/demos/src/demos/galaxy-rotation/logic.ts`  
> Physics model: `packages/physics/src/galaxyRotationModel.ts`

## Why this demo exists

This instrument makes one central inference visible: measured orbital speed in galaxy outskirts stays too high for visible matter alone, so either extra gravitating mass or modified dynamics is required.

## Learning goals

- Read $V(R)$ as the primary observable inferred from Doppler shifts.
- Compare total and visible-only Keplerian predictions at fixed radius.
- Interpret where $M_{\\rm dark}$ exceeds $M_{\\rm vis}$ and how $f_b(R)$ evolves.
- Distinguish "fits galaxy curves" from "explains all dark-matter evidence across scales."

## Recommended live sequence (12-15 min)

1. Start with **No dark matter** and establish the Keplerian decline baseline.
2. Switch to **Milky Way-like** and emphasize the persistent outer velocity.
3. Increase halo mass while narrating how curve shape and $M_{\\rm dark}/M_{\\rm vis}$ respond.
4. Toggle mass mode and locate the dark-dominance crossing.
5. Show MOND overlay and close with scale-comparison caveat (clusters/CMB).

## Misconceptions to target

- "Flat curve means constant enclosed mass." (It means enclosed mass keeps rising with $R$.)
- "Face-on schematic means face-on observations." (Real measurements require inclination correction.)
- "One MOND-like fit in galaxies falsifies dark matter everywhere." (Cluster/lensing/CMB evidence still constrains alternatives.)
