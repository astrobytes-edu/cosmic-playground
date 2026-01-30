---
title: "Blackbody Radiation — Backlog"
bundle: "blackbody-radiation"
section: "backlog"
demo_slug: "blackbody-radiation"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](/instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/blackbody-radiation/](/play/blackbody-radiation/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## P0 (blocking / correctness / teachability)

- **Docs correctness:** reconcile `demos/blackbody-radiation/README.md` (“Comparison Mode”) with the current UI implementation (no obvious compare control in `demos/blackbody-radiation/index.html`). Either implement comparison or update docs.
- **Instructor usability:** add a one-page “teach script + misconceptions + one key question” printable summary linked from the instructor guide.
- **CMB storyline (optional):** decide whether CMB presets are in-scope for ASTR 101 and, if so, add a short instructor-note section on how/when to use them.

## P1 (important)

- **Stefan–Boltzmann intuition:** add an “area under the curve” visualization toggle (matches README future ideas) to make $T^4$ scaling more visceral.
- **Approximations clarity:** tighten the “temperature → color” language in the student-facing explanation to emphasize it is perceptual/approximate (see `demos/_assets/blackbody-model.js` notes).
- **Answer keys:** add suggested “ideal student responses” to the activities protocols to reduce TA variability.

## P2 (nice to have)

- **Model extensions (from README ideas):** Wien/Rayleigh-Jeans/Wien approximations overlay; real stellar spectra comparison (absorption lines); HR-diagram connection.
- **Practice mode:** lightweight “guess the temperature from the curve” quiz mode.
