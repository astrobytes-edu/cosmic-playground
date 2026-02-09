---
title: "Parallax Distance — Assessment Bank"
bundle: "parallax-distance"
section: "assessment"
demo_slug: "parallax-distance"
last_updated: "2026-02-09"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/parallax-distance/](../../play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

## Observable keys used in prompts

- `deltaTheta`: measured A→B detector shift (mas)
- `B_eff`: effective baseline along the parallax axis (AU)
- `p_hat`: inferred parallax from captures (mas)
- `d_hat`: inferred distance from `p_hat` (pc)
- `inferred uncertainty`: read from `sigma_{p_hat}`, `sigma_{d_hat}`, or `p_hat/sigma_{p_hat}`

## Clicker questions (with distractors + explanation)

### Clicker 1 — Direction of the relationship

**Demo setup:** set $d_{\rm true}=10\,\mathrm{pc}$, capture A/B at $0^\circ/180^\circ$, and record `deltaTheta`, `B_eff`, `p_hat`, `d_hat`. Repeat with $d_{\rm true}=100\,\mathrm{pc}$ at the same phases.

**Question:** With similar `B_eff`, the second run has smaller `deltaTheta`. Which readout change is expected?

A. `p_hat` decreases while `d_hat` increases  
B. `p_hat` increases while `d_hat` increases  
C. `p_hat` decreases while `d_hat` decreases  
D. `p_hat` and `d_hat` both stay the same

**Correct:** A  
**Why:** With similar geometry, smaller measured shift implies smaller inferred parallax and larger inferred distance.  
**Misconception targeted:** “Closer stars have smaller parallax.”

### Clicker 2 — Parsecs from parallax

**Demo setup:** use any high-quality capture pair (`B_eff` near $2\,\mathrm{AU}$) and read `p_hat`.

**Question:** If `p_hat = 100\,\mathrm{mas} = 0.1"`, what `d_hat` should the class expect?

A. 0.1 pc  
B. 1 pc  
C. 10 pc  
D. 100 pc

**Correct:** C  
**Why:** $\hat d(\text{pc}) = 1/\hat p(\text{arcsec}) = 1/0.1 = 10$.  
**Misconception targeted:** inverse scaling confusion.

### Clicker 3 — Which capture geometry improves inference?

**Demo setup:** hold $d_{\rm true}$ fixed. Compare captures at $0^\circ/180^\circ$ versus $80^\circ/100^\circ$. Record `B_eff` and inferred uncertainty.

**Question:** Which pair should give lower inferred uncertainty in `d_hat`?

A. $80^\circ/100^\circ$, because captures are closer in time  
B. $80^\circ/100^\circ$, because small `B_eff` stabilizes inference  
C. $0^\circ/180^\circ$, because larger `B_eff` strengthens inference  
D. Both pairs, because `d_{\rm true}` is unchanged

**Correct:** C  
**Why:** Large effective baseline produces a stronger geometry signal and smaller inferred uncertainty for the same target distance.  
**Misconception targeted:** “Any two captures are equally informative.”

### Clicker 4 — Precision and confidence

**Demo setup:** keep one capture pair fixed (e.g., $0^\circ/180^\circ$), then increase the uncertainty control and watch inferred uncertainty plus `p_hat/sigma_{p_hat}`.

**Question:** If inferred uncertainty grows while `p_hat` stays similar, what should happen?

A. `p_hat/sigma_{p_hat}` increases and confidence in `d_hat` increases  
B. `p_hat/sigma_{p_hat}` decreases and confidence in `d_hat` decreases  
C. `p_hat/sigma_{p_hat}` stays fixed while confidence in `d_hat` decreases  
D. `p_hat/sigma_{p_hat}` decreases but confidence in `d_hat` is unchanged

**Correct:** B  
**Why:** Larger uncertainty lowers signal-to-noise and weakens distance inference reliability.  
**Misconception targeted:** “Measurement precision doesn’t matter.”

### Clicker 5 — Geometry versus star property

**Demo setup:** keep one $d_{\rm true}$ value, then compare two capture geometries with different `B_eff`. Record `deltaTheta`, `p_hat`, and `d_hat`.

**Question:** Which statement is most accurate?

A. Parallax is a physical property of the star.  
B. `deltaTheta` depends on capture geometry, but `p_hat` and `d_hat` are the geometry-corrected inference.  
C. `B_eff` only changes visuals, not measured quantities.  
D. Changing capture geometry should never change any readout.

**Correct:** B  
**Why:** The measured shift changes with baseline projection; the inference uses `B_eff` to recover parallax/distance.  
**Misconception targeted:** “Parallax is a property of the star.”

### Clicker 6 — Bigger baseline thought experiment

**Demo setup:** use any completed capture pair as a reference, then consider a larger physical baseline thought experiment with the same star and measurement precision.

**Question:** With a larger baseline, which change is expected in the same observable framework?

A. smaller `deltaTheta` and larger inferred uncertainty  
B. larger `deltaTheta` and smaller inferred uncertainty in `d_hat`  
C. unchanged `deltaTheta` and unchanged uncertainty  
D. negative `d_hat`

**Correct:** B  
**Why:** Bigger baseline increases measured shift for the same distance, improving inference confidence.  
**Misconception targeted:** “Better measurement is only about better cameras, not geometry.”

## Short-answer prompts

1. From one capture pair, explain how `deltaTheta` and `B_eff` combine to produce `p_hat` and then `d_hat`.
2. In your own words, define a parsec and connect it to `p_hat` in arcseconds.
3. Describe one case where `deltaTheta` is measurable but inferred uncertainty is still high.
4. Why does inferred uncertainty set the distance reach of parallax methods?

## Exit ticket (3 questions)

1. Two runs have similar `B_eff`; one has `deltaTheta` about $10\times$ smaller. What happens to `p_hat` and `d_hat`? (One sentence.)
2. If `p_hat = 0.5"`, what `d_hat` should you report in pc? (One number.)
3. Name one geometry factor and one measurement factor that increase inferred uncertainty.
