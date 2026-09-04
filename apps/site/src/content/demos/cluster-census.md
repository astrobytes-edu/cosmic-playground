---
title: "Cluster Census: Sampling Stars from the Initial Mass Function"
status: draft
content_verified: true
levels: [Both]
topics: [Stars, DataInference]
time_minutes: 15
has_math_mode: false
tags: ["imf", "star-clusters", "hr-diagram", "sampling", "statistics"]
readiness: experimental
readinessReason: "Physics is unit-tested end to end and the model's validity domain is handled explicitly, but the demo is new and has not been used in a classroom yet."
parityAuditPath: "docs/reviews/2026-09-04-novascope-port-survey.md"
lastVerifiedAt: "2026-09-04"
short_key_idea: "Star formation makes a population, not a star, and the heaviest star in a small cluster is mostly luck."
learning_goals:
  - "Describe the initial mass function as a distribution, and state that low-mass stars dominate by number."
  - "Explain why the most massive star in a cluster varies a lot between clusters of the same size."
  - "Read a cluster's age from the main-sequence turnoff."
  - "Distinguish a model's output from the range over which the model is valid."
misconceptions:
  - "A cluster contains a typical mix of star types, so the biggest star is about the same everywhere."
  - "More massive stars live longer because they have more fuel."
  - "A histogram of a sample and the law it was drawn from should match exactly."
predict_prompt: "Before touching anything: if you drew 300 stars twice from the same mass function, how different would the heaviest star be? Same to within a few percent, or different by a factor of several?"
play_steps:
  - "Press 'Draw a new cluster' five times at a few hundred stars and record the heaviest star each time."
  - "Raise the number of stars to 20,000 and repeat. Compare how much the same readout moves."
  - "Push the age up from zero and watch the HR diagram lose its top-left corner as the turnoff falls."
  - "Switch between the Maschberger and Kroupa laws and watch the histogram bars move while the positions stay put."
station_params:
  - parameter: "Number of stars"
    value: "300, then 20,000"
    notice: "The heaviest star jumps around at 300 and settles at 20,000. The law did not change."
  - parameter: "Cluster age"
    value: "0, then 120 Myr, then 12 Gyr"
    notice: "The turnoff falls as the cluster ages. That is how a real cluster is dated."
  - parameter: "High-mass slope"
    value: "1.8, then 2.8"
    notice: "A steeper slope means fewer massive stars for the same total number."
station_path: "stations/cluster-census/"
explain_prompt: "Explain why the heaviest star in a 300-star cluster is unpredictable while the shape of the whole mass function is not, and say what changed when you raised the number of stars."
model_notes:
  - "Masses are drawn from Maschberger (2013) or Kroupa (2001); the high-mass slope $\\alpha$ is a control, and $2.3$ is canonical for both."
  - "Positions come from a Plummer (1911) or truncated EFF (1987) profile, sampled in three dimensions in pc and shown as a projection."
  - "Zero-age $L$, $R$ and $T_{\\rm eff}$ come from Tout et al. (1996); main-sequence lifetimes from Hurley, Pols & Tout (2000) at $Z = 0.02$; remnant kinds from Heger et al. (2003)."
  - "Above $100\\,M_\\odot$ the Tout fits are extrapolated. Those stars are ringed on the HR diagram and counted separately, because the fit's published domain ends there."
  - "Below $0.1\\,M_\\odot$ the fits are not used at all. Those stars appear in the cluster and the histogram but carry no HR point, rather than being clamped onto one."
  - "There is no post-main-sequence evolution: a star sits at its zero-age point until its lifetime elapses, then becomes a remnant. The turnoff is therefore an edge, not the hook a real cluster shows."
  - "There are no dynamics and no mass segregation. Dot size scales as the cube root of mass for legibility and is not a stellar radius."
  - "The same seed and controls always reproduce the same cluster; masses and positions are drawn from independent streams."
demo_path: "/play/cluster-census/"
instructor_path: "/instructor/cluster-census/"
last_updated: "2026-09-04"
---

Star formation does not make one star at a time. It makes a population, and the distribution of masses in that population — the initial mass function — is remarkably similar from cluster to cluster. This instrument draws a cluster from that distribution and shows the same stars three ways at once: where they sit in space, where they land on an HR diagram, and how many of each mass you actually got.

The payoff is what happens at the top. Most stars are small, so the massive end of any cluster is only a handful of draws. Redraw a few hundred stars and the heaviest star moves by a factor of several; redraw twenty thousand and it barely moves at all. Nothing about the law changed — there are simply more draws from its tail.
