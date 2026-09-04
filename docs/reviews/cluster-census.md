# Physics review: cluster-census

**Date:** 2026-09-04 (revised the same day, after the UI/UX pass added a giant branch)
**Reviewer:** traced end to end during the port from novascope; re-traced after the
post-main-sequence track and the mass-floor change.
**Verdict:** safe to ship as `readiness: experimental`. No sign or unit errors found. Two
model-domain decisions are made explicitly and are surfaced in the UI. The
post-main-sequence track is schematic and is labelled as such in three places.

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

**Below 0.1 $M_\odot$: not extrapolated, and no longer drawn.** This is where a star
approaches the hydrogen-burning limit, degeneracy begins to matter and the interior physics
genuinely changes; a fit to main-sequence stars has nothing to say there.

Clamping their mass to 0.1 and plotting them anyway is what the upstream implementation
does, and it is precisely the defect the 2026-09-03 audit found in `stars-zams-hr`, where a
third of the colour-magnitude diagram is a clamping artifact rather than a population. That
option stays rejected.

The first version instead drew them as hollow circles with no HR point. Measured: roughly
11.5 percent of stars (235 of 2000 at default settings). That was honest but taught
nothing — a tenth of the picture was rings that meant "the model cannot describe this" —
and it made the population tally carry a row of jargon.

**Changed 2026-09-04:** the demo now samples from 0.1 $M_\odot$, the model's own floor, so
every star drawn is a star the model can place. `CENSUS_MIN_MASS_MSUN` names the floor and
the comment states why. The 0.08–0.1 sliver, and the fact that it holds about a tenth of a
real cluster's stars, is stated in the Understand tab and the drawer instead of being drawn
as blanks. `HYDROGEN_BURNING_MIN_MSUN` remains the physical constant in
`@cosmic/physics`; the demo's floor is a separate, named decision.

Note this shifts the sampled population slightly: the histogram's leftmost bin now starts
at 0.1 rather than 0.08, and the total cluster mass is marginally lower than a true
0.08-floor draw would give. Neither is presented as a measurement of a real cluster.

## Honest limitations

- **The post-main-sequence track is schematic.** Added 2026-09-04; before that a star sat
  at its zero-age point until $t_{\rm MS}$ elapsed and then vanished into the remnant
  count, so ageing a cluster *erased* the top of the HR diagram instead of bending it into
  a giant branch. That made the age slider destructive rather than instructive, and left
  the diagram a plot of the ZAMS function rather than a picture of a population.

  Two of the three timescales are Hurley's own and were already in the module:

  | Quantity | Source |
  | --- | --- |
  | $t_{\rm MS}$, end of the main sequence | Hurley et al. (2000) eq. (5) |
  | $t_{\rm BGB}$, base of the giant branch | Hurley et al. (2000) eq. (4) |
  | post-BGB span, 0.15 $t_{\rm BGB}$ | conventional round figure, not a fit |

  The Hertzsprung gap therefore falls out of the existing fits: it is
  $t_{\rm BGB} - t_{\rm MS}$, at most 5 percent of $t_{\rm BGB}$ because
  $t_{\rm MS} \ge 0.95\,t_{\rm BGB}$, narrowing further at high mass. That is the correct
  behaviour — the crossing runs on a thermal timescale, which is why real HR diagrams show
  the gap nearly empty — and it was not tuned to produce it.

  The **shape** of the track is textbook rather than computed: cool at roughly constant
  luminosity across the gap, then climb at nearly fixed temperature up the Hayashi track.
  Below 2 $M_\odot$ the climb ends near a mass-independent tip, because the tip is set by
  the degenerate helium core mass at the flash — the same reason the RGB tip works as a
  standard candle, and a point worth a student noticing in the picture. Above 2 $M_\odot$
  there is no degenerate core, so the star crosses to the red at roughly constant
  luminosity: the near-horizontal supergiant track.

  Checked against published values, and pinned in `stellarLifetimeModel.test.ts`:

  | Case | Model | Observed |
  | --- | --- | --- |
  | RGB tip, 1 $M_\odot$ | $L = 2.3\times10^3\,L_\odot$, $T = 3200$ K, $R = 155\,R_\odot$ | $\sim2.5\times10^3\,L_\odot$, $\sim3100$ K, $\sim170\,R_\odot$ |
  | Total life, 1 $M_\odot$ | 13.3 Gyr | $\sim12$ Gyr |
  | Red supergiant, 20 $M_\odot$ | $L \sim 10^5\,L_\odot$, $T = 3500$ K, $R \sim 10^3\,R_\odot$ | Betelgeuse: $\sim10^5\,L_\odot$, $\sim3600$ K, $\sim900\,R_\odot$ |
  | Turnoff at 12 Gyr | 0.98 $M_\odot$ | $\sim0.8$–$0.9\,M_\odot$ (metal-poor globulars) |

  The turnoff sits high because the Hurley coefficients here are evaluated at $Z = 0.02$
  and real globulars are metal-poor. That is the same solar-metallicity limitation noted
  below, now visible in a number.

  Positions are good to a factor of a few. Read the branch for its shape and its turnoff,
  not for a star's radius. Stated in the Understand tab, the drawer, and guarded by a
  contract test that requires the words "schematic" and "Hurley" in the copy.
- **No white dwarfs and no horizontal branch.** Once a star burns through its giant phase
  it leaves the tally as a remnant with no HR point. The cooling sequence a real cluster
  shows at bottom left is not modelled.
- **Giants carry no spectral type.** `spectralTypeFromTemperature` classifies against the
  main-sequence temperature sequence and appends luminosity class V, which a giant is not.
  The model returns an empty string rather than a wrong label, and the UI names the star by
  colour and class ("red giant") instead. Guarded by a test.
- **Solar metallicity only for lifetimes.** The Hurley coefficients are the
  Appendix-A set evaluated at $Z = 0.02$. The ZAMS values do vary with $Z$, so a
  metallicity control would currently move $L$, $R$ and $T$ but not $t_{\rm MS}$. That is
  why no metallicity control is exposed.
- **No dynamics and no mass segregation.** Positions are drawn from a static profile.
  Nothing orbits and nothing sinks. The upstream package has a primordial-segregation
  sampler that was deliberately not ported for this first version.
- **The cluster panel is a rendering, not a measurement.** Since 2026-09-04 it is a
  three.js scene with additive blending, so a dense core saturates to white exactly as it
  would in a real image -- which is the point, but it means brightness in that panel is
  not a photometric quantity. Sprite size is the same cube-root legibility scale as before,
  and a giant is bumped rather than drawn at its true (hundreds of times larger) radius.
  Depth in the 3-D view is real: positions are sampled in three dimensions and always were,
  so orbiting shows the actual sampled distribution rather than a synthesised third axis.
- **Star colours are a display fit,** not integrated photometry. Hot looks blue, cool looks
  red, and that is all the colour is claiming.
- **Dot size is a legibility scale** (cube root of mass), not a stellar radius.
- **Not validated against an external fixture.** The upstream package pins these laws
  against progenax and startrax reference fixtures. Those fixtures were not ported. The
  checks above are internal consistency plus published values, which is weaker. Bringing
  the fixtures across is the single highest-value follow-up.

## Follow-ups

1. Port the progenax and startrax fixtures and gate against them. Still the single
   highest-value follow-up, and now larger in scope than before, because the giant branch
   is a second thing worth pinning against a reference.
2. Add primordial mass segregation, which makes the spatial panel do real work.
3. Metallicity-dependent lifetimes. The turnoff being 0.98 rather than ~0.85 $M_\odot$ at
   12 Gyr is entirely this, and it is now a visible number rather than an abstraction.
4. A white-dwarf cooling sequence, which would complete the bottom-left of the diagram.
