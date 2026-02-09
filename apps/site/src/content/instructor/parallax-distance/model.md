---
title: "Parallax Distance — Model & Math (Instructor Deep Dive)"
bundle: "parallax-distance"
section: "model"
demo_slug: "parallax-distance"
last_updated: "2026-02-09"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/parallax-distance/](../../play/parallax-distance/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **Links**
> Student demo: `/play/parallax-distance/`  
> Model code (tested): `packages/physics/src/parallaxDistanceModel.ts`  
> UI/visualization code: `apps/demos/src/demos/parallax-distance/main.ts`

## What the demo is modeling (big picture)

This demo models the **geometry of parallax** and nothing else. It is intentionally “physics-light” because the point of parallax is that it is a distance measurement that does **not** require knowing a star’s luminosity, temperature, or composition.

The demo links three representations of the same idea:

- A top-down cause view: Earth moves around the Sun, changing line-of-sight.
- A detector view: the target shifts relative to fixed background stars.
- A numeric inference: two captures yield $\Delta\theta$, $B_{\rm eff}$, inferred $\hat p$, and inferred $\hat d$.

## Units + conventions used in the code

The demo uses:

- **Distance** in **parsecs** (pc) and **light-years** (ly).
- **Detector shift and parallax** in **milliarcseconds** (mas) and **arcseconds** (").
- A unit-radius orbit (AU) with explicit axis conventions:
  - Target direction $\hat{\mathbf{s}}$.
  - Parallax measurement axis $\hat{\mathbf{a}}=\mathrm{perp}(\hat{\mathbf{s}})$.

## Key relationships to foreground (with meaning + units)

### Distance definition: $d(\text{pc}) = 1/p(\text{arcsec})$

$$d(\text{pc}) = \frac{1}{p(\text{arcsec})}$$

Let’s unpack each piece:

- **$d$** is distance, measured in **parsecs (pc)**.
- **$p$** is the parallax angle, measured in **arcseconds (")**.

What this equation is really saying: parallax is an **inverse** relationship. When a star is $10\times$ farther away, the parallax angle is $10\times$ smaller.

> **Sanity checks**
> - If $p = 1"$, then $d = 1\ \text{pc}$ (this is the definition of a parsec).
> - If $p$ halves, $d$ doubles (inverse scaling).

### Capture-based inference used by the demo

Earth position on a unit orbit:

$$
\mathbf{r}(\phi)=\langle \cos\phi,\sin\phi\rangle \quad (\mathrm{AU})
$$

True detector offset is constrained to the measurement axis:

$$
\mathbf{o}_{\rm true}(\phi)=p_{\rm true,mas}\,(\mathbf{r}(\phi)\cdot\hat{\mathbf{a}})\,\hat{\mathbf{a}}
$$

For captures A and B:

$$
\mathbf{b}=\mathbf{r}_B-\mathbf{r}_A,\qquad
B_{\rm eff}=|\mathbf{b}\cdot\hat{\mathbf{a}}|
$$

$$
\Delta\theta_{\rm axis}=(\mathbf{o}_B-\mathbf{o}_A)\cdot\hat{\mathbf{a}},\qquad
\Delta\theta=|\Delta\theta_{\rm axis}|
$$

$$
\hat p_{\rm mas}=\frac{\Delta\theta}{B_{\rm eff}},\qquad
\hat d_{\rm pc}=\frac{1000}{\hat p_{\rm mas}}
$$

The displayed equivalent six-month shift is derived as $2\hat p$ and is not the direct measurement unless captures are opposite in phase along the parallax axis.

## Assumptions, limitations, and sanity checks

- The demo treats Earth’s orbit as circular and uses an idealized baseline.
- Background stars are treated as effectively fixed for the shift visualization.
- Inference uses the effective projected baseline $B_{\rm eff}$, not raw chord length.
- If $B_{\rm eff}$ is below threshold, inference is intentionally suppressed as ill-conditioned.
- Deterministic capture noise is axis-aligned and applied at capture time.
- Detector exaggeration is visual only and never changes computed $\hat p$ or $\hat d$.
