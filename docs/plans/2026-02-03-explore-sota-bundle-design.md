# Explore SoTA Bundle — Design

**Date:** 2026-02-03  
**Scope:** Explore page only. Dark museum theme; no behavior changes.

## Goals
- Deliver a designer‑grade Explore experience in one cohesive pass.
- Strengthen narrative flow: orientation → guidance → discovery.
- Keep all styling token‑driven and accessible.

## Layout & Rhythm
1. **Hero** (quiet atmosphere, more vertical breathing room)
2. **Filter band** (lighter density, invitational labels)
3. **Featured row** (curated on‑ramp with lead line)
4. **Onboarding strip** (Predict → Play → Explain)
5. **Count line** (N interactive exhibits)
6. **Browse** (topic index + catalog)

## Onboarding Strip
**Cadence:** *Predict → Play → Explain*  
**Lead:** *A simple loop for every exhibit.*  
Placement: between Featured row and count line (only when no filters).

## Count Line
Always show a calm count above results:  
**“N interactive exhibits”**  
This replaces the filtered‑only summary, keeping consistent hierarchy.

## Microcopy Adjustments
- Hero lede: **Interactive exhibits for seeing how astronomy actually works.**
- Featured lead: **Begin with the core orbit ideas before branching out.**
- Filter labels/placeholder: already updated to calm invitational language.

## Accessibility
- All additions are plain text, no hover‑only meaning.
- Focus styles unchanged; keyboard navigation preserved.

## Verification
- Smoke tests for onboarding strip and count line.
- Full build + e2e.
