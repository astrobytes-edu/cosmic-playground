# Cosmic Playground Curriculum Guide

**Version:** 1.2
**Date:** February 5, 2026
**Document Type:** Instructor Curriculum Package
**Project:** Cosmic Playground (NSF IUSE Level 2)

---

## Overview

This guide provides a complete curriculum framework for teaching astrophysics using the three Cosmic Playground demo suites as **scaffolded capstone projects**. Each suite functions as a 3-4 week module where students progressively build understanding through guided exploration, culminating in a synthesis report that ties equations and physics to their "experiments."

**Core Pedagogical Model:**

```
Observable → Model → Inference → Synthesis
     ↓          ↓         ↓           ↓
  (Demo)    (Equation)  (Parameter)  (Report)
```

**The Three Suites:**

| Suite | Central Question | Demo Count | Duration | Capstone |
|-------|------------------|------------|----------|----------|
| **Stellar Structure** | How do stars work? | 8 demos | 4 weeks | Research Note |
| **Galaxies** | How do we weigh the invisible? | 8 demos | 4 weeks | Research Note |
| **Cosmology** | How do we measure the universe? | 9 demos | 4 weeks | Full Report |

**Canonical Demo Counts (Locked):**
- Stellar: 8 demos (EOS → HSE → Timescales → Polytropes → Energy Gen → Opacity → Transport → Capstone)
- Galaxies: 8 demos (Anatomy → Photometry → Rotation → Dispersion → Gas/SF → Feedback → Mergers → Scaling)
- Cosmology: 9 demos (Scale Factor → Redshift → Distances → Friedmann → Thermal → Recombination → BAO → Growth → Probes Lab)

*Note: Cosmology has 9 demos because the Probes Lab serves as both Demo 9 and the inference capstone. All pacing tables use these counts.*

---

## Target Course: Astro 201 (Sophomore-Level Astrophysics)

### Prerequisites

| Course | What Students Bring | Why It Matters |
|--------|--------------------|-----------------|
| **Astro 101** | Basic vocabulary (HR diagram, galaxy types, Big Bang); qualitative understanding | Students aren't starting from zero; demos build on existing mental models |
| **Physics 195** | Calculus-based mechanics; energy, force, equilibrium; basic thermo | Can understand $dP/dr$, energy conservation, timescale arguments |

### What This Course IS (and ISN'T)

| This Course IS | This Course IS NOT |
|----------------|-------------------|
| Model-based intuition | Derivation-heavy theory |
| Core equations + interpretation | Full analytic problem sets |
| Observational inference | Numerical methods depth |
| "Think like an astrophysicist" | "Prove like a theorist" |

**The Goal:** Students leave able to *reason* about astrophysical systems—predict behavior, diagnose failures, connect observations to physics—even if they can't derive the Lane-Emden equation from scratch.

**The Trade-off:** Heavy derivations and numerical methods belong in upper-division courses (Astro 301: Stellar Interiors, Astro 302: Galaxies, Astro 303: Cosmology). This course builds the conceptual foundation those courses require.

### Is This Too Heavy for Sophomores?

**Honest assessment:** No—*if* you calibrate correctly.

| Risk | Mitigation |
|------|------------|
| Math overload | Emphasize Conceptual → Quantitative modes; Advanced is optional/extra credit |
| Equation memorization | Focus on "what does this term do?" not "derive from first principles" |
| Report writing anxiety | Provide templates, peer review, scaffolded deadlines |
| Demo overwhelm | Structured missions, not free exploration |

**The key insight:** Sophomores can handle this *because* of the scaffolding. The demos + missions + templates reduce cognitive load compared to traditional "here are the equations, good luck" approaches.

---

## Course Philosophy: Not Three Mini-Courses Stapled Together

### The Unifying Spine: "Build Systems from Observables"

Each suite is a chapter in the *same story*:

| Suite | The Arc |
|-------|---------|
| **Stars** | Microphysics → Structure → Observable outputs |
| **Galaxies** | Light → Mass → Dynamics → Baryon cycle |
| **Cosmology** | Expansion → Distances → Relic scales → Inference |

The coherence comes from the *method*, not just the content:
1. Start with what you can measure
2. Build a model that explains it
3. Infer parameters from the fit
4. Confront limitations honestly

By the third suite, students recognize: "This is another constrained-modeling problem." That recognition is the learning outcome.

### The Final Capstone Ties It Together

The course ends with a **grand synthesis**: "Compare how inference works across stars, galaxies, and cosmology."

This prevents the suites from feeling disconnected and produces students who can articulate *what astrophysics is* as a discipline.

---

## Part I: Semester Course Structure (15 Weeks)

### Primary Structure: Astro 201

| Week | Unit | What Students Do | Capstone |
|------|------|------------------|----------|
| **1** | Modeling Bootcamp | Units/scaling, log thinking, "observable → model → inference," error bars | Mini-cap: "Explain a plot like a scientist" |
| **2–5** | Stellar Structure Suite | Build pressure → HSE → ε → κ → transport | **Capstone 1:** Build-a-Star |
| **6–9** | Galaxies Suite | Light → mass, rotation curves, gas/SFR, feedback | **Capstone 2:** Galaxy Autopsy |
| **10–13** | Cosmology Suite | Expansion, distances, recombination → BAO ruler → probes | **Capstone 3:** Fit the Universe |
| **14–15** | Grand Synthesis | Connect scales + compare inference styles | **Final Capstone:** "Astrophysics as Constrained Modeling" |

### Week-by-Week Breakdown

#### Week 1: Modeling Bootcamp + Demo Literacy

**Purpose:** Establish the course's way of thinking before diving into content. No software installation required—all demos are browser-native.

| Day | Topic | Activity |
|-----|-------|----------|
| 1 | Units and scaling | Order-of-magnitude estimation; dimensional analysis |
| 2 | Log thinking | Why astronomers use logarithms; reading log-log plots |
| 3 | Observable → Model → Inference | Case study: "How do we know the Sun's mass?" |
| 4 | Demo literacy | How to use the demos; read a Model Card; export data |

**Mini-Capstone (Due Week 2):**
> Given a plot from the literature, write a one-page explanation: What is being measured? What model is being tested? What can you infer?

**Optional Track:** Students who want to do Python analysis of exported CSV/JSON data can follow the "Data Analysis Companion" guide (provided separately). This is *not required* and should not be a barrier to course participation.

#### Weeks 2–5: Stellar Structure Suite

| Week | Demos | Focus |
|------|-------|-------|
| 2 | 1-2 (EOS Lab, HSE) | What holds a star up? |
| 3 | 3-4 (Timescales, Polytropes) | How do we simplify? |
| 4 | 5-6 (Energy Generation, Opacity) | Where does the energy come from and go? |
| 5 | 7-8 (Transport, Capstone) | Put it all together |

**Capstone 1 Due: End of Week 5**

#### Week 6: Synthesis + Peer Review (Stellar)

- Peer review of Capstone 1
- In-class: "What surprised you about stellar structure?"
- Transition discussion: "Stars make elements → Where do those elements go?"

#### Weeks 6–9: Galaxies Suite

| Week | Demos | Focus |
|------|-------|-------|
| 6 | 1-2 (Anatomy, Photometry) | What can we see? |
| 7 | 3-4 (Rotation Curves, Dispersion) | Mass from motion |
| 8 | 5-6 (Gas/SF, Feedback) | The baryon cycle |
| 9 | 7-8 (Mergers, Scaling Relations) | Putting it together |

**Capstone 2 Due: End of Week 9**

#### Week 10: Synthesis + Transition

- Peer review of Capstone 2
- In-class: "Galaxies live in an expanding universe → How does that work?"
- Connect: stellar populations → galaxy ages → cosmic time

#### Weeks 10–13: Cosmology Suite

| Week | Demos | Focus |
|------|-------|-------|
| 10 | 1-3 (Scale Factor, Redshift, Distances) | The expanding universe |
| 11 | 4-5 (Friedmann, Thermal History) | What's the universe made of? |
| 12 | 6-7 (Recombination, BAO) | Early universe relics |
| 13 | 8-9 (Growth, Probes Lab) | Measuring cosmological parameters |

**Capstone 3 Due: End of Week 13**

#### Weeks 14–15: Grand Synthesis

**The Final Question:**
> "Compare how inference works in stars vs galaxies vs cosmology. What are the observables? What's assumed? What are the dominant degeneracies?"

| Day | Activity |
|-----|----------|
| 14.1 | Student presentations: "The demo that taught me most" |
| 14.2 | Cross-suite connections workshop |
| 15.1 | Final capstone writing time |
| 15.2 | Course wrap-up: "What is astrophysics?" |

**Final Capstone Due: Finals Week**

### Alternative Formats

#### Option B: Single Suite Module (4 weeks)

Drop-in module for existing courses.

| Week | Phase | Activities |
|------|-------|------------|
| **Week 1** | Foundation | Demos 1-3; Concept checks; Mission Sheet 1 |
| **Week 2** | Core Physics | Demos 4-6; Quantitative mode; Mission Sheet 2 |
| **Week 3** | Integration | Demos 7-8; Advanced mode; Mission Sheet 3 |
| **Week 4** | Synthesis | Capstone exploration; Report writing; Peer review |

#### Option C: Intensive Workshop (1 week)

Summer school or bootcamp format.

| Day | Morning (3 hr) | Afternoon (3 hr) |
|-----|----------------|------------------|
| **Mon** | Stellar Demos 1-4 | Stellar Demos 5-8 |
| **Tue** | Stellar Capstone work | Galaxies Demos 1-4 |
| **Wed** | Galaxies Demos 5-8 | Galaxies Capstone work |
| **Thu** | Cosmology Demos 1-5 | Cosmology Demos 6-9 |
| **Fri** | Cosmology Capstone | Presentations + synthesis |

#### Option D: Two-Semester Sequence

For programs wanting both conceptual foundation AND rigorous methods:

| Semester | Course | Content |
|----------|--------|---------|
| **Fall** | Astro 201: Astrophysical Modeling | This curriculum (three suites + synthesis) |
| **Spring** | Astro 202: Methods Under the Hood | Full derivations, numerical methods, deeper physics |

This sequence produces students ready for research by junior year.

---

## Part I-B: Demo Infrastructure

### Model Cards (Built Into Every Demo)

Every demo includes a **Model Card** panel—a 2-minute read that builds trust and answers common questions:

| Section | Content |
|---------|---------|
| **What It Computes** | The specific physics being solved |
| **Assumptions** | What's held fixed or simplified |
| **What's Omitted** | Physics NOT included (and why) |
| **Units & Ranges** | Typical values; what's "reasonable" |
| **Failure Modes** | What does "break" mean? When does the model fail? |

**Example Model Card (Polytropes Demo):**

> **What It Computes:** Solutions to the Lane-Emden equation for polytropic equations of state $P = K\rho^{1+1/n}$
>
> **Assumptions:** Spherical symmetry; single polytropic index throughout star; no rotation, magnetic fields, or composition gradients
>
> **What's Omitted:** Real stars aren't polytropes—this is a simplified model that captures qualitative behavior
>
> **Units:** Dimensionless ($\xi$, $\theta$); scaling to physical units requires specifying $M$ and $R$
>
> **Failure Modes:** At $n \geq 5$, solutions extend to infinity (physically meaningless); near $n=5$, numerical integration becomes unstable

### Demo Autologging

**Problem:** Students currently screenshot manually, transcribe parameters, and paste into reports. This is error-prone and tedious.

**Solution:** Every demo can export a **Demo Log** (JSON + optional PDF):

```json
{
  "demo": "Polytropes",
  "timestamp": "2026-02-15T14:32:00Z",
  "parameters": {
    "n": 3.0,
    "M_star": 10.0,
    "R_star": 5.2
  },
  "outputs": {
    "rho_c": 142.3,
    "T_c": 3.2e7,
    "P_c": 1.8e17
  },
  "figures": ["profile_rho.png", "profile_T.png"],
  "notes": "Student-entered notes here"
}
```

**Benefits:**
- Reduces grading pain (instructors see exactly what students ran)
- Makes capstone figures reproducible
- Enables analytics (what parameters do students explore?)

### Faded Guidance (Scaffolding That Decreases Over Time)

**The Principle:** Start structured, then gradually remove scaffolds.

| Week in Suite | Guidance Level | Mission Sheet Style |
|---------------|----------------|---------------------|
| Week 1 | High | "Set X to Y, record Z, explain what you see" |
| Week 2 | Medium | "Design a test to distinguish A vs B" |
| Week 3 | Low | "Investigate the effect of [parameter] on [output]" |
| Capstone | Minimal | Student-designed investigation with constraints |

**Why this works:** By capstone time, students have internalized the cognitive moves. They don't need hand-holding—they've practiced the pattern 6+ times.

---

## Part II: Weekly Structure Template

Each week within a suite follows the same rhythm:

### Before Class (Asynchronous, 30-45 min)

1. **Reading** (10-15 min): Short conceptual primer (provided)
2. **Prediction Activity** (15-20 min): Students make predictions *before* seeing demo results
3. **Vocabulary Check** (5-10 min): Key terms quiz (auto-graded)

### In Class (Synchronous, 75 min)

| Time | Activity | Purpose |
|------|----------|---------|
| 0-10 min | **Micro-lecture** | Frame the physics question |
| 10-15 min | **Prediction reveal** | Students share predictions; instructor acknowledges common misconceptions |
| 15-50 min | **Demo Mission** (small groups) | Structured exploration with worksheet |
| 50-65 min | **Concept checks** | Peer instruction; clicker questions |
| 65-75 min | **Synthesis discussion** | "What did we learn? What questions remain?" |

### After Class (Asynchronous, 30-45 min)

1. **Mission Sheet completion** (20-30 min): Finish worksheet, submit screenshots/answers
2. **Retrieval quiz** (10-15 min): Low-stakes questions on key concepts
3. **Reflection prompt** (5 min): "What was confusing? What clicked?"

---

## Part III: Mission Sheet Template

**Use this template for each demo within a suite.**

---

### Mission Sheet: [Demo Name]

**Suite:** [Stellar Structure / Galaxies / Cosmology]
**Demo:** [Number and Title]
**Estimated Time:** 45-60 minutes
**Mode:** ☐ Conceptual  ☐ Quantitative  ☐ Advanced

---

#### Learning Objectives

By the end of this mission, you will be able to:
1. [Specific, measurable objective]
2. [Specific, measurable objective]
3. [Specific, measurable objective]

---

#### Part A: Prediction (Before Demo)

**Do this BEFORE opening the demo.**

1. **Setup:** [Describe the physical scenario]

2. **Prediction Question:**
   > [Question that requires students to commit to an answer]

   Your prediction: _______________

   Your reasoning (2-3 sentences): _______________

3. **Confidence level:** ☐ Very confident  ☐ Somewhat confident  ☐ Guessing

---

#### Part B: Guided Exploration

**Now open the demo.**

**Task 1:** [Specific instruction]
- Set [parameter] to [value]
- Observe [specific output]
- Record: _______________

**Task 2:** [Specific instruction]
- Compare [condition A] to [condition B]
- Screenshot or sketch the key difference:

**Task 3:** [Quantitative task]
- Use the demo to measure/calculate: _______________
- Show your work or describe your method:

---

#### Part C: Concept Check

1. **Revisit your prediction.** Were you correct? If not, what was wrong with your reasoning?

2. **Complete the sentence:** "When [parameter] increases, [output] [increases/decreases/stays the same] because _______________."

3. **Connection to equations:** Which equation(s) from lecture explain what you observed? Write the equation and identify which term is responsible for the behavior.

---

#### Part D: Extension (Optional—Advanced Mode)

For students ready for more:

1. [Challenge question requiring deeper exploration]
2. [Connection to research-level physics]
3. [What approximation does this demo make? How would results differ with full physics?]

---

#### Part E: Reflection

1. **What was the most surprising thing you learned?**

2. **What question do you still have?**

3. **Rate this mission:** ☐ Too easy  ☐ About right  ☐ Too hard

---

## Part IV: Suite Capstone Specifications

### What Makes a Capstone Different from a Lab Report

The capstone is where learning crystallizes. It's not "describe what you did"—it's **"explain what you understand."** Each capstone requires students to:

1. **Build something**: A model star, a galaxy decomposition, a cosmological fit
2. **Use the earned equations**: The key relationships they learned through the demos
3. **Diagnose failure**: What happens when assumptions break?
4. **Connect to reality**: How does their model relate to real observations?

### The Four Capstone Artifacts (Required in Every Suite Capstone)

This structure mirrors how real scientists think and write:

| Artifact | What It Is | Why It Matters |
|----------|------------|----------------|
| **1. Signature Figure** | The ONE plot that tells the story | Forces prioritization; "if I could only show one thing..." |
| **2. Equation Map** | Core equations with term-by-term physical meaning | Connects math to physics; prevents symbol dumping |
| **3. Failure Analysis** | "I broke the model by pushing X; here's what that teaches" | Demonstrates understanding of limits and assumptions |
| **4. Inference Statement** | "Given these observables, what can/can't we conclude?" | The scientific bottom line; honest about uncertainty |

**Example Failure Analysis (Stellar):**

> "When I pushed the polytropic index above n=4.5, the model star became increasingly centrally concentrated until at n=5 it had infinite extent—a physically meaningless result. This taught me that polytropes are mathematical idealizations; real stars have finite radii because they have surfaces where density drops to zero, which polytropes can only approximate for n<5."

**Example Inference Statement (Galaxies):**

> "From the rotation curve decomposition, I can conclude that this galaxy has a dark matter fraction of ~85% within 5 scale lengths. However, I cannot determine whether the dark matter is an NFW halo or a cored profile—both fit the data equally well. Breaking this degeneracy would require stellar kinematics in the inner regions."

---

### Capstone 1: Build-a-Star

**Student Goal:** Pick a mass $M$ and composition, choose physics toggles, and produce a star that lands plausibly on the HR diagram.

#### The "Equation Map" (Required in Every Capstone)

**Why not just "list the equations"?** Symbol dumping ≠ understanding. The Equation Map forces students to connect math to physics.

**For each core equation, students must provide:**

1. **The equation** (properly typeset)
2. **What each term means physically** (in words)
3. **Which term dominated** in their exploration
4. **What changed when they tweaked parameters** (the lever they pulled)

**Example Equation Map Entry:**

> **Equation:** $\frac{dP}{dr} = -\frac{Gm\rho}{r^2}$ (Hydrostatic Equilibrium)
>
> **Terms:**
> - $dP/dr$: How pressure changes with radius (always negative—decreases outward)
> - $G$: Gravitational constant
> - $m$: Mass enclosed within radius $r$
> - $\rho$: Local density
> - $r^2$: Geometric dilution of gravity
>
> **What dominated:** In my 10 M☉ star, the high central density ($\rho_c \approx 100$ g/cm³) required extreme central pressure (~10¹⁷ dyn/cm²) to balance gravity.
>
> **What I learned:** When I increased mass at fixed radius, $m$ increased faster than $P$ could respond, and the star collapsed. This showed me why massive stars need radiation pressure support.

#### Core Equations for Stellar Capstone

| Equation | What It Means | Demo Where Learned |
|----------|---------------|-------------------|
| $\frac{dP}{dr} = -\frac{Gm\rho}{r^2}$ | Hydrostatic equilibrium | Demo 2: HSE |
| $\frac{dm}{dr} = 4\pi r^2 \rho$ | Mass continuity | Demo 2: HSE |
| $\frac{dL}{dr} = 4\pi r^2 \rho \epsilon$ | Energy generation | Demo 5: Energy Gen |
| $\frac{dT}{dr} = -\frac{3\kappa\rho L}{64\pi\sigma T^3 r^2}$ (radiative) | Temperature gradient | Demo 7: Transport |
| $P = P_{\rm gas} + P_{\rm rad}$ | Equation of state | Demo 1: EOS Lab |
| Schwarzschild criterion | Convection condition | Demo 7: Transport |

**Capstone Requirement:** Include an Equation Map with at least 4 of these equations, each with full term-by-term explanation and "what I learned" paragraph.

#### Deliverables

| Deliverable | What It Shows | Points |
|-------------|---------------|--------|
| **Radial profiles** (ρ, T, P, L vs r or m) | Student built a functioning model | /20 |
| **HR diagram position** | Model produces reasonable L, T_eff | /15 |
| **Parameter comparison** (e.g., 1 M☉ vs 10 M☉) | Student explored parameter space | /15 |
| **Failure analysis** | What happens when equilibrium breaks? | /15 |
| **Physics explanation** | Why does the structure look this way? | /20 |
| **Limitations discussion** | What's missing from this model? | /10 |
| **Writing quality** | Clear, scientific style | /5 |

#### Cover Page

**Title:** Build-a-Star Laboratory Report
**Student Name:**
**Date:**
**Course:**

**Abstract** (100-150 words):
Summarize what you built, what you learned, and your key findings.

---

#### 1. Introduction (1 page)

**The Central Question:** How does a star maintain equilibrium, and what determines its structure?

Address the following:
- What is hydrostatic equilibrium, and why is it the foundation of stellar structure?
- What are the key physical ingredients (EOS, energy generation, energy transport)?
- What question(s) did you investigate in your exploration?

**Required elements:**
- [ ] Definition of hydrostatic equilibrium with equation
- [ ] Explanation of why stars don't collapse or explode
- [ ] Statement of your specific investigation focus

---

#### 2. Methods: The Demos You Used (1-2 pages)

For each demo you explored, briefly describe:

| Demo | What it computes | Key parameters you varied | What you measured |
|------|------------------|---------------------------|-------------------|
| EOS Lab | | | |
| HSE | | | |
| Polytropes | | | |
| Energy Generation | | | |
| Opacity | | | |
| Transport | | | |
| Capstone | | | |

**Required elements:**
- [ ] Table summarizing your exploration
- [ ] At least 3 demos explored in Quantitative mode
- [ ] At least 1 demo explored in Advanced mode (if applicable)

---

#### 3. Results (2-3 pages)

Present your key findings. Include:

**3.1 Equilibrium Structure**
- Present a density, temperature, or pressure profile from your capstone star
- Include figure with proper labels and caption
- Compare to a reference (e.g., polytrope, Sun)

**3.2 Parameter Dependencies**
- How did changing [mass / composition / mixing length / ...] affect your star?
- Present at least one comparison (e.g., 1 M☉ vs 10 M☉)
- Include figure showing the comparison

**3.3 Stability Analysis**
- What happened when you pushed your star toward instability?
- At what point did equilibrium solutions fail?
- What physical process caused the failure?

**Required figures (minimum 3):**
- [ ] Interior profile (ρ, T, or P vs r or m)
- [ ] Parameter comparison (before/after changing something)
- [ ] Diagnostic output (HR diagram position, central conditions, etc.)

---

#### 4. Discussion (1-2 pages)

Connect your results to the physics. Address:

**4.1 Why Your Star Looks the Way It Does**
- Which physical process dominates energy transport in your star? Why?
- How does the equation of state affect the structure?
- What role does opacity play?

**4.2 Connection to Real Stars**
- Where would your star sit on the HR diagram?
- How does it compare to the Sun or other known stars?
- What would happen to your star as it evolves?

**4.3 Limitations and Approximations**
- What does the demo compute vs. approximate?
- What physics is missing (rotation, magnetic fields, mass loss)?
- How might results differ with a full stellar evolution code like MESA?

**Required elements:**
- [ ] Explicit connection between demo results and equations from class
- [ ] At least one "what if" speculation about missing physics
- [ ] Honest discussion of approximations

---

#### 5. Conclusions (0.5 page)

Summarize:
1. The most important thing you learned about stellar structure
2. The most surprising result from your exploration
3. One question you'd want to investigate further

---

#### 6. Appendix: Demo Logs

Include screenshots or exported data from your key explorations. Label each with:
- Demo name
- Parameter values
- What it shows

---

#### Grading Rubric: Stellar Structure Capstone

| Criterion | Excellent (A) | Good (B) | Adequate (C) | Needs Work (D/F) | Points |
|-----------|---------------|----------|--------------|------------------|--------|
| **Physics Understanding** | Correctly explains equilibrium, transport, and stability with equations | Minor errors or gaps in explanation | Describes what happened but limited "why" | Misconceptions or missing key concepts | /25 |
| **Demo Exploration** | Thorough exploration of 5+ demos; Quantitative + Advanced modes | Solid exploration of 4+ demos; mostly Quantitative | Superficial exploration; mostly Conceptual mode | Minimal exploration; missing key demos | /20 |
| **Results Presentation** | Clear figures with captions; quantitative comparisons; data supports claims | Good figures; some quantitative analysis | Figures present but poorly labeled; limited analysis | Missing figures or uninterpretable data | /20 |
| **Critical Analysis** | Thoughtful discussion of limitations; connects to real stars and research | Some discussion of limitations; partial connections | Acknowledges limitations but doesn't analyze | No discussion of approximations or limitations | /15 |
| **Writing Quality** | Clear, well-organized, proper scientific style | Minor organization or clarity issues | Readable but disorganized or informal | Difficult to follow; major issues | /10 |
| **Synthesis** | Demonstrates genuine insight; makes novel connections | Solid synthesis of material | Summarizes but doesn't synthesize | List of facts without integration | /10 |

**Total: /100**

---

### Galaxies Suite: "Galaxy Autopsy" Report

---

#### Cover Page

**Title:** Galaxy Autopsy: Dissecting [Galaxy Type] to Reveal the Invisible
**Student Name:**
**Date:**
**Course:**

**Abstract** (100-150 words):
Summarize what type of galaxy you analyzed, what you inferred about its dark matter content, and your key findings about its formation history.

---

#### 1. Introduction (1 page)

**The Central Question:** How do we measure what we cannot see?

Address the following:
- Why do we believe dark matter exists?
- What observational evidence distinguishes dark matter from baryonic matter?
- What galaxy did you "autopsy" and what questions did you investigate?

**Required elements:**
- [ ] The rotation curve argument for dark matter
- [ ] Distinction between luminous and dynamical mass
- [ ] Statement of your specific investigation

---

#### 2. The Patient: Your Galaxy's Vital Signs (1 page)

Present your galaxy's observable properties:

| Property | Value | How Measured (which demo) |
|----------|-------|---------------------------|
| Morphological type | | Demo 1 |
| Total luminosity | | Demo 2 |
| Stellar mass | | Demo 2 |
| Effective radius | | Demo 2 |
| Rotation velocity (if disk) | | Demo 3 |
| Velocity dispersion (if elliptical) | | Demo 4 |
| Gas mass | | Demo 5 |
| Star formation rate | | Demo 5 |

**Required elements:**
- [ ] Table of observed properties
- [ ] At least one image/visualization of your galaxy
- [ ] Classification and justification

---

#### 3. The Autopsy: Inferring the Invisible (2-3 pages)

**3.1 Mass from Light**
- What stellar mass do you infer from the luminosity?
- What mass-to-light ratio did you assume? Why?
- Include figure: surface brightness profile

**3.2 Mass from Dynamics**
- What dynamical mass do you infer from rotation curves or velocity dispersion?
- Show your calculation or the demo output
- Include figure: rotation curve decomposition OR dispersion profile

**3.3 The Dark Matter Fraction**
- Compare luminous mass to dynamical mass
- What fraction of your galaxy is dark matter?
- How does this compare to the cosmic average (~85%)?

**3.4 Halo Properties (if applicable)**
- What NFW concentration did you infer?
- What is the virial mass of the halo?
- Include figure: enclosed mass vs radius

**Required figures (minimum 3):**
- [ ] Surface brightness or luminosity profile
- [ ] Rotation curve or velocity dispersion profile
- [ ] Mass decomposition (baryons vs dark matter vs total)

---

#### 4. The Life History: Formation and Evolution (1-2 pages)

**4.1 Star Formation History**
- What does the current SFR tell you about your galaxy?
- Is it forming stars, quenched, or transitioning?
- Where does it sit on the star-forming main sequence?

**4.2 Feedback and Regulation**
- What role does feedback play in your galaxy's evolution?
- Use the bathtub model: is your galaxy in equilibrium?
- What would happen if you turned off feedback?

**4.3 Environment and Interactions**
- Did you simulate a merger or tidal interaction?
- What did it reveal about how galaxies transform?
- Include figure: merger simulation or tidal features (if applicable)

**Required elements:**
- [ ] Discussion of SFR and gas content
- [ ] Connection to feedback physics
- [ ] At least one "what would happen if" scenario

---

#### 5. Diagnosis: What Kind of Galaxy Is This? (1 page)

Synthesize your findings:

**5.1 Final Classification**
- Based on your autopsy, what is this galaxy?
- How confident are you in your dark matter measurement?
- What's the biggest source of uncertainty?

**5.2 Comparison to the Population**
- Where does your galaxy sit on scaling relations (Tully-Fisher, Faber-Jackson, mass-metallicity)?
- Is it typical or unusual?

**5.3 Prognosis**
- What will happen to this galaxy in the future?
- Will it merge, quench, or continue forming stars?

---

#### 6. Limitations and What's Missing (0.5 page)

- What physics did the demos approximate or omit?
- How would results differ with full hydrodynamic simulations?
- What observations would you want to confirm your inferences?

---

#### 7. Conclusions (0.5 page)

1. Your galaxy's dark matter fraction and how you measured it
2. The most important insight about galaxy formation you gained
3. One question that remains unanswered

---

#### Grading Rubric: Galaxies Capstone

| Criterion | Excellent (A) | Good (B) | Adequate (C) | Needs Work (D/F) | Points |
|-----------|---------------|----------|--------------|------------------|--------|
| **Dark Matter Analysis** | Correctly calculates and interprets DM fraction; understands uncertainties | Minor errors in calculation or interpretation | Gets DM fraction but limited understanding of method | Incorrect calculation or major misconceptions | /25 |
| **Dynamical Reasoning** | Clear connection between observables and mass inference | Good connection with minor gaps | Describes observations but weak "how we know" | Confusion about what rotation curves/dispersions tell us | /20 |
| **Demo Exploration** | Thorough use of suite; quantitative parameter exploration | Solid exploration of most demos | Superficial exploration | Minimal engagement with demos | /15 |
| **Figures and Data** | Publication-quality figures; clear decompositions | Good figures with minor issues | Figures present but unclear | Missing key figures | /15 |
| **Synthesis** | Integrates morphology, dynamics, SF, feedback into coherent story | Good integration with gaps | Treats demos as separate rather than connected | No synthesis | /15 |
| **Writing and Honesty** | Clear writing; honest about limitations and approximations | Minor issues; some limitation discussion | Readable; limited limitation discussion | Poor writing; no limitations discussed | /10 |

**Total: /100**

---

### Cosmology Suite: "Fit the Universe" Report

---

#### Cover Page

**Title:** Fitting the Universe: Constraining Cosmological Parameters from [Probes Used]
**Student Name:**
**Date:**
**Course:**

**Abstract** (100-150 words):
Summarize which probes you used, what cosmological parameters you constrained, and how your results compare to Planck 2018.

---

#### 1. Introduction (1 page)

**The Central Question:** How do we measure the contents, geometry, and history of the universe?

Address the following:
- What are the key cosmological parameters ($H_0$, $\Omega_m$, $\Omega_\Lambda$, $w$)?
- Why do we need multiple probes to constrain them?
- What probes did you use, and what question did you investigate?

**Required elements:**
- [ ] The Friedmann equation and what each $\Omega$ represents
- [ ] Why degeneracies exist (different probes constrain different combinations)
- [ ] Statement of your specific investigation

---

#### 2. Building the Background Cosmology (1-2 pages)

Demonstrate understanding of expansion history:

**2.1 Scale Factor and Redshift**
- Explain the relationship between $a(t)$ and $z$
- Include figure: $a(t)$ for your best-fit cosmology

**2.2 Distances**
- What is the difference between $D_C$, $D_A$, and $D_L$?
- Why does $D_A(z)$ turn over?
- Include figure: distance measures vs redshift

**2.3 Energy Budget**
- How do radiation, matter, and dark energy evolve with redshift?
- When did the universe transition from deceleration to acceleration?
- Include figure: $\Omega_i(z)$ stacked plot

**Required elements:**
- [ ] Correct explanation of $1+z = 1/a$
- [ ] Distance measure comparison figure
- [ ] Energy budget evolution figure

---

#### 3. The Probes (2-3 pages)

For each probe you used, explain:

**3.1 Type Ia Supernovae**
- What do SN Ia measure? (distance modulus → $D_L$)
- What parameters does this constrain?
- Include figure: Hubble diagram (μ vs z) with your fit

**3.2 Baryon Acoustic Oscillations**
- What is the BAO feature and why does it exist?
- What does it measure? ($D_V/r_d$, $D_A/r_d$, $H r_d$)
- How does changing $\Omega_b h^2$ affect $r_d$?
- Include figure: BAO constraint or correlation function

**3.3 CMB Compressed Likelihood**
- What do the shift parameter $\mathcal{R}$ and acoustic scale $\ell_A$ encode?
- Why is this a "compressed" likelihood?
- Include figure: CMB constraint in parameter space

**Required elements:**
- [ ] At least 2 probes explored in depth
- [ ] Figures showing data + model for each probe
- [ ] Explanation of what each probe constrains

---

#### 4. Parameter Inference (2 pages)

**4.1 Single-Probe Constraints**
- What parameters can you constrain with SN alone? BAO alone? CMB alone?
- Include figure: 1D or 2D likelihood for single probe

**4.2 Degeneracies**
- What degeneracy directions do you see?
- Why do SN and BAO have different orientations in ($\Omega_m$, $H_0$) space?
- Include figure: overlapping contours showing different degeneracy directions

**4.3 Combined Constraints**
- What happens when you combine probes?
- What are your best-fit parameters?
- How do they compare to Planck 2018?

| Parameter | Your Best Fit | Reference Cosmology | Difference |
|-----------|---------------|---------------------|------------|
| $H_0$ | | (see instructor guide) | |
| $\Omega_m$ | | (see instructor guide) | |
| $\Omega_\Lambda$ | | (see instructor guide) | |
| $w$ | | (see instructor guide) | |

*Note: Compare to a standard reference cosmology (e.g., Planck 2018 ΛCDM). The instructor will provide current best-fit values. The goal is understanding the comparison process, not matching specific numbers.*

**Required elements:**
- [ ] Contour plot showing degeneracy breaking
- [ ] Table comparing your fit to reference cosmology
- [ ] $\chi^2$ values for your fit
- [ ] Discussion of any discrepancies

---

#### 5. Discussion (1-2 pages)

**5.1 What You Learned About the Universe**
- Is the universe flat? Accelerating? Dominated by dark energy?
- What evidence supports each conclusion?

**5.2 The Hubble Tension (Optional Advanced Topic)**
- Is there a discrepancy between early-universe and late-universe $H_0$?
- Did you see any hint of this in your fits?

**5.3 Limitations**
- What does "compressed likelihood" hide?
- What would full CMB $C_\ell$ analysis add?
- What systematic uncertainties affect SN/BAO?

**Required elements:**
- [ ] Clear statement of what your fit says about the universe
- [ ] Discussion of at least one limitation or systematic

---

#### 6. Conclusions (0.5 page)

1. Your best-fit cosmological parameters and uncertainties
2. The most important insight about cosmological inference
3. Why multiple probes are essential

---

#### 7. Appendix: Inference Details

- Screenshots of likelihood surfaces
- $\chi^2$ breakdown by probe
- If you ran MCMC: chain diagnostics, corner plot

---

#### Grading Rubric: Cosmology Capstone

| Criterion | Excellent (A) | Good (B) | Adequate (C) | Needs Work (D/F) | Points |
|-----------|---------------|----------|--------------|------------------|--------|
| **Probe Understanding** | Correctly explains what each probe measures and why | Minor errors or gaps | Describes probes but limited "why it works" | Misconceptions about probe physics | /25 |
| **Inference Execution** | Proper fitting; understands degeneracies; combines probes correctly | Good fitting with minor issues | Gets answer but limited understanding of method | Incorrect fitting or major errors | /25 |
| **Comparison to Literature** | Accurate comparison to Planck; understands differences | Good comparison with minor issues | Compares but doesn't interpret differences | No comparison or incorrect values | /15 |
| **Figures** | Clear contours, Hubble diagram, energy budget plots | Good figures with minor issues | Figures present but unclear | Missing key figures | /15 |
| **Synthesis** | Integrates expansion, distances, probes, inference into coherent story | Good integration with gaps | Treats sections as separate | No synthesis | /10 |
| **Honesty about Limitations** | Thoughtful discussion of approximations and systematics | Some discussion | Acknowledges but doesn't analyze | No limitations discussed | /10 |

**Total: /100**

---

## Part V: Assessment Design

### Workload Calibration

**The Problem:** Three full capstone reports + a final portfolio = writing overload unless the course is explicitly "writing intensive."

**The Solution:** Tiered capstone structure + lightweight synthesis.

| Capstone | Format | Length | Purpose |
|----------|--------|--------|---------|
| **Capstone 1** (Stellar) | Research Note | 3-4 pages | Learn the format; low stakes |
| **Capstone 2** (Galaxies) | Research Note | 3-4 pages | Practice the format; medium stakes |
| **Capstone 3** (Cosmology) | Full Report | 8-10 pages | Demonstrate mastery; high stakes |
| **Final Synthesis** | Concept Map + Memo | 2-3 pages | Cross-suite connections |

**Alternative:** Let students choose ONE suite capstone to expand into a full report (their strongest work). The other two remain research notes.

### Time Estimates (Be Honest with Students)

| Activity | Weekly Time | Notes |
|----------|-------------|-------|
| Pre-class prep | 30-45 min | Reading + prediction |
| In-class | 75-150 min | 1-2 sessions per week |
| Mission sheets | 60-90 min | Completing and submitting |
| Retrieval quiz | 15-20 min | Low-stakes |
| **Total weekly** | **~3-5 hours outside class** | Varies by week |

**Capstone weeks** require additional time (~8-12 hours for research notes, ~15-20 hours for full report).

### Grade Weights (Recommended)

| Assessment | Frequency | Weight | Purpose |
|------------|-----------|--------|---------|
| **Prediction Activities** | Before each class | 5% | Commit to predictions; surface misconceptions |
| **Mission Sheets** | Weekly | 20% | Guided exploration; retrieval practice |
| **Retrieval Quizzes** | Weekly | 10% | Low-stakes testing effect |
| **Suite Capstones** | End of each suite | 40% | Research notes (2×10%) + Full report (20%) |
| **Final Synthesis** | End of semester | 15% | Concept map + cross-suite memo |
| **Participation** | Ongoing | 10% | Peer discussion; concept checks |

### Optional: Midterm Exam

Some departments require an exam component. If needed, design the midterm as:

- **70% interpretation-heavy:** "Here's a plot—what does it tell us?"
- **20% predict + explain:** "If we increase X, what happens to Y? Why?"
- **10% short derivation:** Only where physically meaningful

**Timing:** After Capstone 2 (end of Galaxies suite)

This maintains the modeling pedagogy while satisfying institutional requirements.

---

### Final Portfolio Template

**Due:** Last day of class
**Format:** PDF, 5-8 pages + appendices

---

#### Section 1: Executive Summary (1 page)

Summarize the three suites in one page:
- What did you learn about stars?
- What did you learn about galaxies?
- What did you learn about cosmology?
- What connects them?

---

#### Section 2: Cross-Suite Connections (2 pages)

Identify and explain at least **three** connections across suites:

**Example connections:**
- Stellar nucleosynthesis → galaxy chemical evolution → cosmic metallicity history
- Hydrostatic equilibrium in stars → virial equilibrium in galaxies → pressure support in clusters
- Energy transport in stars → radiative vs convective zones → why massive stars are different
- Timescale arguments: stellar lifetimes → galaxy quenching timescales → cosmic age

For each connection:
1. State the connection
2. Explain the physics that links them
3. Reference specific demos from different suites

---

#### Section 3: Reflection on Learning (1-2 pages)

Answer honestly:
1. What concept was hardest to understand? How did the demos help (or not)?
2. What misconception did you have that got corrected?
3. What would you do differently if you took this course again?
4. How has your understanding of "how we know what we know" in astrophysics changed?

---

#### Section 4: The Demo That Taught You Most (1 page)

Pick one demo from any suite. Explain:
- What it computes
- What you learned from it
- Why it was effective for you
- What you would add or change

---

#### Section 5: Appendix

Include:
- Table of all demos explored with dates and modes
- Best figures from your three capstone reports
- Any additional exploration you did beyond requirements

---

### Final Portfolio Rubric

| Criterion | Excellent | Good | Adequate | Needs Work | Points |
|-----------|-----------|------|----------|------------|--------|
| **Cross-Suite Synthesis** | Novel, insightful connections across all three suites | Good connections, mostly accurate | Some connections, superficial | No real connections | /30 |
| **Reflection Depth** | Honest, specific, demonstrates metacognition | Good reflection with some specificity | Generic reflection | No meaningful reflection | /25 |
| **Physics Accuracy** | All physics correct; proper use of terminology | Minor errors | Some errors but core understanding | Major misconceptions | /20 |
| **Writing Quality** | Clear, well-organized, engaging | Minor issues | Readable but unpolished | Difficult to follow | /15 |
| **Completeness** | All sections complete; thoughtful appendix | Minor omissions | Missing elements | Incomplete | /10 |

**Total: /100**

---

## Part VI: Quick-Reference Materials

### Concept Check Question Bank (Examples)

**Stellar Structure:**
1. A star twice as massive as the Sun has a core temperature that is [higher/lower/the same]. Why?
2. If you increase the opacity in a star's envelope, convection becomes [more/less] likely. Why?
3. A polytrope with n=3 has [more/less] central concentration than n=1.5. What physical property does n represent?

**Galaxies:**
4. A galaxy's rotation curve is flat at large radii. This means the enclosed mass [increases/decreases/stays constant] with radius. What does this imply?
5. If you measure a galaxy's velocity dispersion to be higher than expected from its luminosity, this suggests [more/less] dark matter. Why?
6. Two galaxies merge with prograde disk orientations. The tidal tails will be [longer/shorter] than retrograde. Why?

**Cosmology:**
7. At z=2, the angular diameter distance is [larger/smaller] than at z=1 for standard ΛCDM. Why is this counterintuitive?
8. If you increase Ω_m while keeping H_0 fixed, the age of the universe [increases/decreases]. Why?
9. BAO and SN Ia have different degeneracy directions in (Ω_m, H_0) space. Why is this useful?

---

### Common Misconceptions by Suite

**Stellar Structure:**
| Misconception | Reality | Demo to Address |
|---------------|---------|-----------------|
| "Massive stars live longer because they have more fuel" | Luminosity scales faster than mass; massive stars burn faster | Timescales, Energy Generation |
| "Stars are mostly gas pressure" | Radiation pressure dominates in massive stars | EOS Lab |
| "Convection happens when it's hot" | Convection happens when radiative transport fails | Transport |

**Galaxies:**
| Misconception | Reality | Demo to Address |
|---------------|---------|-----------------|
| "Dark matter is between galaxies" | Most DM is in halos around galaxies | Rotation Curves |
| "Ellipticals are old spirals" | Ellipticals typically have different formation histories; mergers can transform disks into ellipticals, but not all ellipticals were once spirals | Merger Demo |
| "Gas falls in and makes stars" | Feedback regulates; equilibrium is dynamic | Feedback Demo |

**Cosmology:**
| Misconception | Reality | Demo to Address |
|---------------|---------|-----------------|
| "Redshift is Doppler shift from motion" | Cosmological redshift is space expansion | Redshift Demo |
| "Distant things look smaller" | D_A turns over; very distant objects look larger | Distance Zoo |
| "The universe is expanding into something" | Space itself expands; no "outside" | Scale Factor |

---

### Recommended Pacing

**For a 4-week suite module:**

| Week | Demos | Class Sessions | Homework |
|------|-------|----------------|----------|
| 1 | 1, 2 | 2 sessions | Mission Sheets 1-2; Quiz 1 |
| 2 | 3, 4, 5 | 2-3 sessions | Mission Sheets 3-5; Quiz 2 |
| 3 | 6, 7, 8 | 2-3 sessions | Mission Sheets 6-8; Quiz 3 |
| 4 | Capstone | 1-2 sessions | Capstone Report due |

**Total contact hours per suite:** ~12-15 hours
**Total student work per suite:** ~25-30 hours

---

## Part VII: Implementation Checklist

### Before the Semester

- [ ] Test all demos on classroom computers/student laptops
- [ ] Create LMS modules for each suite
- [ ] Upload reading materials and prediction activities
- [ ] Set up auto-graded quizzes
- [ ] Review mission sheets; customize if needed
- [ ] Prepare backup plan for technical failures

### Each Week

- [ ] Review student predictions before class
- [ ] Identify common misconceptions to address
- [ ] Prepare 2-3 concept check questions
- [ ] Grade mission sheets within 1 week
- [ ] Review reflection prompts for recurring issues

### End of Each Suite

- [ ] Distribute capstone report template
- [ ] Schedule peer review session
- [ ] Provide feedback on drafts (optional)
- [ ] Grade capstone reports with rubric
- [ ] Collect student feedback on suite

### End of Semester

- [ ] Collect final portfolios
- [ ] Administer course evaluation
- [ ] Compare pre/post concept inventory (if used)
- [ ] Document what worked and what to change

---

## Part VIII: How Classes Change

### The Shift from Traditional to Studio Astrophysics

| Aspect | Traditional | Cosmic Playground |
|--------|-------------|-------------------|
| **Lecture role** | Primary content delivery | Frame the question (5-10 min) |
| **Derivations** | Full blackboard derivation | "Here's the model; predict, test, explain; *then* we derive the piece you just used" |
| **Homework** | "Solve for X" | "Interpret residuals / Identify assumptions / Design a test" |
| **Labs** | Separate course or none | Demos ARE the lab bench (integrated) |
| **Assessment** | Exams test recall | Capstones test model-based reasoning |
| **Misconceptions** | Discovered on exam (too late) | Surfaced in predictions (fixable) |

### The Instructor's New Role

You become a **modeling coach**, not a content deliverer:

- "Show me your run—tell me what assumption caused that behavior"
- "Your prediction was wrong—what did you learn?"
- "The model broke—is that a bug or a feature?"

### What Students Leave With

By end of semester, students can:

1. **Reason about systems they've never seen before** (transfer)
2. **Diagnose model failures** (not just run models)
3. **Articulate uncertainty** ("I can/can't conclude X because...")
4. **Connect equations to physics** (not symbol manipulation)
5. **Explain astrophysics to others** (scientific communication)

These are the skills that matter for research, graduate school, and science careers.

---

## Appendix A: Sample Micro-Lecture Outlines

### Example: Stellar Polytropes (Demo 4)

**Time:** 10 minutes

**Slide 1: The Question**
> "Can we build a star from first principles without knowing all the microphysics?"

**Slide 2: The Trick**
- Assume P ∝ ρ^(1+1/n) — a "polytropic" equation of state
- n is a single parameter that controls the structure
- Real stars aren't polytropes, but polytropes teach us the physics

**Slide 3: The Lane-Emden Equation**
$$\frac{1}{\xi^2}\frac{d}{d\xi}\left(\xi^2 \frac{d\theta}{d\xi}\right) = -\theta^n$$
- Dimensionless!
- Only depends on n
- Solve once, scale to any star

**Slide 4: What n Means**
- n=0: uniform density (incompressible)
- n=1.5: non-relativistic ideal gas (red giants)
- n=3: relativistic gas / Eddington standard model (massive stars)
- n=5: infinite extent (pathological)

**Slide 5: Your Mission Today**
- Explore how n changes the density profile
- Find the "most centrally concentrated" star
- Discover what happens at n ≥ 5

**Transition to Demo**

---

## Appendix B: Technical Requirements

### Student Computers

- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum 4GB RAM
- Screen resolution ≥ 1280×720

### Instructor Station

- All student requirements plus:
- Ability to project/share screen
- Backup PDF exports of key figures

### LMS Integration

- Embed via iframe or LTI
- Export grades via CSV
- Student progress tracking (optional analytics)

---

## Appendix C: Accessibility Considerations

- All demos must have text alternatives for visual elements
- Color choices must be colorblind-safe (provide palette options)
- Keyboard navigation for all controls
- Screen reader compatibility for outputs
- Provide static figure alternatives for students who cannot run demos

---

## Appendix D: Reference Cosmology Values (Instructor Only)

*Update this appendix when new constraints are released. Students should compare to these values but not memorize them.*

### Planck 2018 ΛCDM (Current Default)

| Parameter | Value | Uncertainty |
|-----------|-------|-------------|
| $H_0$ | 67.4 | ± 0.5 km/s/Mpc |
| $\Omega_m$ | 0.315 | ± 0.007 |
| $\Omega_\Lambda$ | 0.685 | ± 0.007 |
| $\Omega_b h^2$ | 0.0224 | ± 0.0001 |
| $w$ | −1.03 | ± 0.03 |
| $\sigma_8$ | 0.811 | ± 0.006 |
| $n_s$ | 0.965 | ± 0.004 |
| $\tau$ | 0.054 | ± 0.007 |

### BAO Reference Values

| Quantity | Value | Source |
|----------|-------|--------|
| $r_d$ (sound horizon) | 147.09 ± 0.26 Mpc | Planck 2018 |
| $z_*$ (recombination) | 1089.92 ± 0.25 | Planck 2018 |
| $z_d$ (drag epoch) | 1059.94 ± 0.30 | Planck 2018 |

### Notes for Future Updates

- If DESI Y3 releases new BAO constraints, update the reference values and note the change
- If Hubble tension is resolved, update $H_0$ accordingly
- The pedagogical goal is *comparison to a reference*, not *matching specific numbers*

---

## Appendix E: Equation Maps for Each Suite (Templates)

### Stellar Structure Equation Map

| Equation | Physical Meaning | Key Term | What Changes When... |
|----------|------------------|----------|---------------------|
| $dP/dr = -Gm\rho/r^2$ | Pressure gradient balances gravity | $\rho$ (density) | Higher mass → steeper gradient |
| $dm/dr = 4\pi r^2 \rho$ | Mass enclosed increases with radius | $\rho$ (density) | Higher density → faster mass accumulation |
| $dL/dr = 4\pi r^2 \rho \epsilon$ | Luminosity generated by nuclear burning | $\epsilon$ (energy rate) | Higher T → higher ε (CNO vs pp) |
| $dT/dr = ...$ | Temperature gradient (radiative or convective) | $\kappa$ (opacity) | Higher opacity → steeper gradient → convection |

### Galaxies Equation Map

| Equation | Physical Meaning | Key Term | What Changes When... |
|----------|------------------|----------|---------------------|
| $v_c^2 = GM(<r)/r$ | Circular velocity from enclosed mass | $M(<r)$ | Flat $v_c$ → $M \propto r$ → dark matter |
| $M/L$ ratio | Mass inferred from luminosity | $M/L$ | Higher $M/L$ → older population or more DM |
| $\Sigma_{\rm SFR} \propto \Sigma_{\rm gas}^N$ | Kennicutt-Schmidt law | $N$ (~1.4) | More gas → more star formation (nonlinear) |
| $\dot{M}_* = \eta \dot{M}_{\rm in}$ | Star formation efficiency | $\eta$ | Feedback reduces $\eta$ at high/low mass |

### Cosmology Equation Map

| Equation | Physical Meaning | Key Term | What Changes When... |
|----------|------------------|----------|---------------------|
| $H^2 = H_0^2 E^2(z)$ | Expansion rate from energy content | $\Omega_i$ | More matter → faster early expansion |
| $1+z = 1/a$ | Redshift from scale factor | $a$ | Light emitted earlier → more stretched |
| $D_L = (1+z) D_C$ | Luminosity distance | $(1+z)$ | Dimming from both distance AND expansion |
| $r_s = \int c_s/H \, dz$ | Sound horizon (BAO ruler) | $c_s$ | More baryons → slower sound → smaller ruler |

---

*Curriculum Guide for Cosmic Playground Demo Suites*
*Prepared for NSF IUSE Level 2 Proposal*
*Version 1.2 — Incorporates feedback on workload, equation maps, and faded guidance*
