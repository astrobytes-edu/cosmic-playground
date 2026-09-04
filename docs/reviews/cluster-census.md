# Physics review: cluster-census

**Date:** 2026-09-04
**Reviewer:** traced end to end during the port from novascope.
**Verdict:** safe to ship as `readiness: experimental`. No sign or unit errors found. Two
model-domain decisions are made explicitly and are surfaced in the UI.

---

## The chain

```
seed
 └─ subStream(seed, "mass")      → IMF inverse CDF          → mass [Msun]
 └─ subStream(seed, "position")  → Plummer / EFF inverse CDF → position [pc], 3-D
      mass ─→ ZamsTout1996Model  → L [Lsun], R [Rsun], Teff [K]
      mass ─→ mainSequenceLifetimeMyr (Hurley+2000) → t_MS [Myr]
      mass ─→ remnantFateFromInitialMass (Heger+2003)
      Teff ─→ spectralTypeFromTemperature (Pecaut & Mamajek)
                └─ logic.ts (binning, projection, colour) → three Canvas 2-D panels
```

Every step is a pure function. The only state is the seed and the six control values.

## Units

| Quantity | Unit | Where it is named |
|---|---|---|
| Stellar mass | $M_\odot$ | every identifier ends `Msun` |
| Position, radius | pc | every identifier ends `Pc` |
| Luminosity | $L_\odot$ | `luminosityLsun` |
| Stellar radius | $R_\odot$ | `stellarRadiusRsun` |
| Temperature | K | `temperatureK` |
| Age, lifetime | Myr | `ageMyr`, `mainSequenceLifetimeMyr` |

No unit conversion happens anywhere in this demo: every model it calls already works in
solar and parsec units, and nothing is converted between them. That removes the entire
class of error that the eclipse and Kepler reviews had to hunt for.

## Checks performed

**Sampler against its own law.** For both Maschberger and Kroupa, 200,000 stratified
uniforms were binned and compared against the analytic mass fraction, bin by bin, over
eight bins spanning 0.08 to 150 $M_\odot$. Agreement is better than $10^{-4}$ in every bin.
These are genuinely different code paths — one inverts the primitive, the other differences
it — so this is evidence rather than tautology. Stratified uniforms make it deterministic,
so a failure is a real inconsistency and never sampling noise.

**Kroupa continuity.** $\xi = A m^{-\alpha}$ evaluated from each side of the $0.5\,M_\odot$
break agrees to 12 decimal places, which is what the high segment's amplitude is chosen for.

**Environment slope.** `highMassSlopeFromEnvironment` was checked against Jerabkova+2018
Eq. 6 evaluated by hand at three points: $(0, 10^6) \to 1.851399$, $(0, 10^3) \to 2.3$
(below the threshold, canonical), $(-2, 10^8) \to 1.241401$. Both clips were exercised.

**Main-sequence lifetimes against the literature.** Hurley eqs (4)–(7) at $Z = 0.02$:

| $M/M_\odot$ | $t_{\rm MS}$ | Expected |
|---|---|---|
| 0.5 | 129 Gyr | longer than the age of the universe |
| 1 | 11.0 Gyr | the standard Hurley solar value |
| 10 | 24.3 Myr | tens of Myr |
| 25 | 6.84 Myr | a few Myr |
| 100 | 3.35 Myr | approaching the few-Myr floor |

All correct. The relation is monotone across 0.1 to 150 $M_\odot$ and flattens toward a
floor near 3 Myr rather than falling to zero, which is the physical behaviour.

**Plummer geometry.** The half-mass radius is checked against the closed form
$r(0.5) = a/\sqrt{2^{2/3}-1} = 1.304766\,a$, and reproduced from 20,000 sampled radii.
A truncated EFF with $\gamma = 5$ returns $1.2971$, within 1 percent of the Plummer value,
which is the documented degenerate case. $r_h/a$ increases monotonically as $\gamma$
flattens.

**Isotropy.** Tested on $\langle x^2/r^2 \rangle = 1/3$ rather than on the per-axis variance.
This matters: a Plummer sphere's $\langle r^2 \rangle$ is formally infinite (density falls
as $r^{-5}$, so the second moment integral goes as $\int dr/r$), and a sample variance of a
divergent quantity scatters by tens of percent between axes with nothing wrong. Measured
across ten seeds, the bounded statistic deviates by at most 2.4 standard errors with
symmetric signs. The tolerance in the test is stated as $4\sigma$, computed from
$\mathrm{Var}[\cos^2] = 4/45$, not as a decimal place.

**Determinism and stream independence.** The same options always reproduce the same
cluster. Switching mass function moves every mass and leaves every position untouched;
switching profile does the reverse. Consuming a sibling stream does not perturb an existing
one. This is what makes a shared seed meaningful.

**No non-finite output.** Asserted across four ages for every star, covering luminosity,
temperature, stellar radius, mass and lifetime. This guard exists because the first
composition of these models produced NaN for 11.5 percent of a cluster (see below).

## The two domain decisions

The IMF's physical range is 0.08 to 150 $M_\odot$. The Tout et al. (1996) ZAMS fits are
published for 0.1 to 100. The two ends are handled differently, on purpose.

**Above 100 $M_\odot$: extrapolated, and labelled.** The polynomials are unusually well
behaved past the ceiling. $L$, $R$ and $T_{\rm eff}$ all stay monotone, and
$d\log L/d\log M$ relaxes smoothly from 1.73 at 100 $M_\odot$ toward 1.5, which is the
direction the physics goes as a star approaches the Eddington limit. At 200 $M_\odot$ the
extrapolation gives $L = 3.9\times10^6\,L_\odot$, $T_{\rm eff} = 48{,}500$ K and
$R = 28\,R_\odot$, all inside the observed range for R136a1-class stars. These stars are
plotted with a ring on the HR diagram, counted on their own line in the tally, and named in
the export. `ZamsTout1996Model` still reports `massInRange: false` for them, so the label
follows the data.

**Below 0.1 $M_\odot$: not extrapolated.** This is where a star approaches the
hydrogen-burning limit, degeneracy begins to matter and the interior physics genuinely
changes; a fit to main-sequence stars has nothing to say there. Those stars are drawn in
the cluster panel as hollow circles, counted in the histogram, and given no HR point.

The alternative — clamping their mass to 0.1 and plotting them anyway — is what the
upstream implementation does, and it is precisely the defect the 2026-09-03 audit found in
`stars-zams-hr`, where a third of the colour-magnitude diagram is a clamping artifact
rather than a population. At the default settings roughly 11 percent of stars fall below
the floor, so clamping would build a visible spike out of a tenth of the sample and present
it as data.

## Honest limitations

- **No post-main-sequence evolution.** A star sits at its zero-age point until $t_{\rm MS}$
  elapses, then becomes a remnant. There is no subgiant branch, no giant branch and no
  horizontal branch. The turnoff region is therefore a sharp edge rather than the hook a
  real colour-magnitude diagram shows, and the demo says so in the Understand tab. This is
  the single largest simplification.
- **Solar metallicity only for lifetimes.** The Hurley coefficients are the
  Appendix-A set evaluated at $Z = 0.02$. The ZAMS values do vary with $Z$, so a
  metallicity control would currently move $L$, $R$ and $T$ but not $t_{\rm MS}$. That is
  why no metallicity control is exposed.
- **No dynamics and no mass segregation.** Positions are drawn from a static profile.
  Nothing orbits and nothing sinks. The upstream package has a primordial-segregation
  sampler that was deliberately not ported for this first version.
- **Star colours are a display fit,** not integrated photometry. Hot looks blue, cool looks
  red, and that is all the colour is claiming.
- **Dot size is a legibility scale** (cube root of mass), not a stellar radius.
- **Not validated against an external fixture.** The upstream package pins these laws
  against progenax and startrax reference fixtures. Those fixtures were not ported. The
  checks above are internal consistency plus published values, which is weaker. Bringing
  the fixtures across is the single highest-value follow-up.

## Follow-ups

1. Port the progenax and startrax fixtures and gate against them.
2. Add primordial mass segregation, which makes the spatial panel do real work.
3. Consider a post-main-sequence track so the turnoff shows a hook rather than an edge.
