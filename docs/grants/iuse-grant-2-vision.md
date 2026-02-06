# NSF IUSE Grant 2: Vision Document
## "Cosmic Playground: Advanced Demo Suites for Model-Based Astrophysics Education"

**Status:** Early Planning / Brainstorming
**Builds On:** IUSE Grant 1 (ASTR 101/201 foundational demos)
**Principal Investigator:** Dr. Anna Rosen (SDSU)
**Potential Co-PI:** Dr. Matt Anderson (SDSU CRMSE)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem This Grant Addresses](#the-problem-this-grant-addresses)
   - [The Neglected Middle](#the-neglected-middle-why-intermediate-courses-are-understudied)
   - [The Math Anxiety Crisis](#the-math-anxiety-crisis-in-stem)
3. [Why This Matters in an AI-Driven World](#why-this-matters-in-an-ai-driven-world)
4. [Addressing the Small N Problem](#addressing-the-small-n-problem)
5. [Transferability: Beyond Astronomy](#transferability-beyond-astronomy)
6. [Research Goals](#research-goals)
7. [The Demo Suites](#the-demo-suites)
8. [The ASTR 201 Course Redesign](#the-astr-201-course-redesign)
9. [Measuring Equation Fluency: The Assessment Strategy](#measuring-equation-fluency-the-assessment-strategy)
   - [Related Existing Instruments](#related-existing-instruments)
   - [The Hybrid Strategy: Astro-EFI](#the-hybrid-strategy-astro-efi-equation-fluency-inventory)
   - [Equation Fluency Task Types](#equation-fluency-task-types-astro-efi-items)
   - [Embedded Assessment Tasks](#embedded-assessment-tasks-simulation-based)
   - [Validation Strategy](#validation-strategy)
10. [Research Methodology](#research-methodology)
11. [Expected Outcomes](#expected-outcomes)
12. [How This Builds on Grant 1](#how-this-builds-on-grant-1)
13. [Potential Collaborators](#potential-collaborators)
14. [Budget Categories](#budget-categories-rough-estimate)
15. [Alignment with NSF IUSE Goals](#alignment-with-nsf-iuse-goals)
16. [Grant Landscape: Beyond IUSE](#grant-landscape-beyond-iuse)
    - [NSF HSI Programs](#nsf-hsi-programs--high-priority)
    - [NSF CAREER Award](#nsf-career-award-if-eligible)
    - [Private Foundations](#private-foundations)
    - [Strategic Grant Sequencing](#strategic-grant-sequencing)
17. [Open Questions](#open-questions--needs-further-development)
18. [Next Steps](#next-steps)
19. [References](#references-preliminary)

---

## Executive Summary

This document outlines a vision for a second NSF IUSE grant that would develop **advanced interactive demo suites** for teaching model-based reasoning in astrophysics. While Grant 1 establishes foundational demos for ASTR 101/201, Grant 2 would create comprehensive, research-validated demo ecosystems for **stellar structure**, **galaxies**, and **cosmology**—along with a rigorous study of how interactive simulations can help students overcome math anxiety and develop genuine equation fluency.

**The Core Research Question:** Can structured interaction with physics models help students move from "math avoidance" to "equation ownership"—and can we measure this transformation?

---

## The Problem This Grant Addresses

### The Neglected Middle: Why Intermediate Courses Are Understudied

**Here's the gap:** The vast majority of STEM education research focuses on two endpoints:

1. **Intro/GE courses** (Astro 101, Physics for Poets, etc.) — High enrollment, high impact on general scientific literacy, lots of NSF attention
2. **Upper-division/graduate courses** — Small enrollment, assumed to be "self-filtering" for motivated students

**What's missing:** The intermediate courses (200-level) that determine whether students *become* STEM majors.

| Course Level | NSF/Research Attention | Why |
|--------------|------------------------|-----|
| Intro/GE (101) | **High** | Large N, gen-ed requirements, scientific literacy |
| Intermediate (201) | **Low** | Smaller N, "just prereqs," assumed students will figure it out |
| Upper-div (300+) | **Moderate** | Research pipelines, capstone experiences |

**The irony:** 201-level courses are where students decide if they *can* do physics. This is where math anxiety hits hardest—where the "conceptual" intro course suddenly demands equations. Students who loved Astro 101 hit a wall in Astro 201 and leave the major.

**This is novel because:**
- Most interactive simulation research (PhET, etc.) targets intro courses
- Most "studio physics" implementations are for Physics 101/102
- Almost no rigorous research exists on simulation-based learning in intermediate astrophysics
- The equation fluency question is essentially unstudied at this level

**Why NSF should care:** If we only improve intro courses, we're improving scientific literacy—valuable, but not producing scientists. Improving intermediate courses directly impacts the STEM workforce pipeline.

---

### The Math Anxiety Crisis in STEM

Math anxiety affects 25-80% of college students (Beilock & Maloney, 2015), and it's particularly acute in physics and astronomy where equations are central. The traditional response has been either:

1. **Avoidance:** Remove equations, teach conceptually only → Students can't do upper-division work
2. **Persistence:** Keep teaching the same way → High DFW rates, students drop STEM

Neither works. We need a third path.

### The Hypothesis

**Interactive simulations with structured scaffolding can serve as a "bridge" between conceptual understanding and equation fluency.** When students:

1. See an equation's behavior before memorizing its form
2. Predict what changing a term will do
3. Test that prediction in a simulation
4. Explain the result in their own words

...they develop a fundamentally different relationship with equations. The equation becomes a *tool for understanding*, not a *barrier to understanding*.

### Why This Matters Now

- Grant 1 will establish that interactive demos improve learning in intro courses
- But the hard question remains: **Does this transfer to equation fluency?**
- Upper-division courses still require mathematical sophistication
- If demos only work for conceptual learning, we've just delayed the problem

Grant 2 would test whether the approach scales to equation-heavy content.

---

## Why This Matters in an AI-Driven World

### The Coming Skill Shift

**The blunt truth:** ChatGPT can already solve most undergraduate physics problems. Within 5 years, AI will handle routine quantitative tasks that currently define "STEM competence."

This changes what we need to teach.

| Skill | Pre-AI Value | Post-AI Value |
|-------|--------------|---------------|
| Solving textbook problems | High | Near zero (AI does it faster) |
| Memorizing equations | Moderate | Zero (AI has perfect recall) |
| Recognizing when an answer is physically absurd | Moderate | **Critical** (AI can't do this reliably) |
| Building mental models of physical systems | Moderate | **Critical** (foundation for AI oversight) |
| Knowing which model applies to which situation | Moderate | **Critical** (requires domain intuition) |
| Evaluating whether a model's assumptions are met | Low (rarely tested) | **Critical** (AI doesn't know what it doesn't know) |

**The new core competency:** Not solving equations, but *knowing whether the solution makes sense.*

### Physical Intuition as AI-Resistant Skill

Autor (2015) and Brynjolfsson & McAfee (2014) argue that automation complements—rather than replaces—workers who can exercise judgment in novel situations. The skills that remain valuable are precisely those that require:

1. **Causal understanding** of physical systems (not just pattern matching)
2. **Anomaly detection** (recognizing when outputs violate physical constraints)
3. **Model selection** (knowing which approximation applies where)
4. **Uncertainty quantification** (knowing what you don't know)

These are exactly the skills that demo-based learning with Equation Maps develops. Students who learn to predict what an equation will do—and explain why—are building the intuition that AI lacks.

### Reframing the Proposal

This grant isn't just about teaching astronomy better. It's about **developing pedagogies for AI-resistant STEM competencies.**

The demos become training environments for:
- Detecting when a model is being misapplied
- Recognizing physically absurd outputs
- Understanding what assumptions underlie each equation
- Explaining *why* an equation works, not just *that* it works

**The pitch to NSF:** We're not preparing students for the STEM workforce of 2010. We're preparing them for the STEM workforce of 2035, where their value lies in what AI can't do: physical judgment.

### Citations

- Autor, D. H. (2015). Why are there still so many jobs? The history and future of workplace automation. *Journal of Economic Perspectives*, 29(3), 3-30.
- Brynjolfsson, E., & McAfee, A. (2014). *The Second Machine Age: Work, Progress, and Prosperity in a Time of Brilliant Technologies*. W.W. Norton.
- Frey, C. B., & Osborne, M. A. (2017). The future of employment: How susceptible are jobs to computerisation? *Technological Forecasting and Social Change*, 114, 254-280.
- National Academies of Sciences, Engineering, and Medicine. (2018). *Data Science for Undergraduates: Opportunities and Options*. National Academies Press.

---

## Addressing the Small N Problem

### The Objection

NSF reviewers may ask: "Intro courses have 300+ students. Intermediate courses have 30-50. Why fund research on a smaller population?"

### The Counter-Arguments

#### 1. Pipeline Leverage: Small N, High Impact

Not all students are equal in terms of STEM workforce impact.

| Course | Typical N | Conversion to Major | STEM Workforce Contribution |
|--------|-----------|---------------------|----------------------------|
| Astro 101 (GE) | 300 | ~5% (15 students) | Low (most forget everything) |
| Astro 201 (majors) | 40 | ~80% (32 students) | High (these become scientists) |

**The math:** Improving 201 by 20% retention = 6-8 additional scientists. Improving 101 by 20% engagement = maybe 1-2 additional majors.

**The leverage is at 201, not 101.**

PCAST (2012) estimated that the US needs 1 million additional STEM graduates over a decade. The bottleneck isn't interest (plenty of students start STEM)—it's persistence through the "hard" courses. Intermediate courses are the filter.

#### 2. Multi-Cohort Accumulation

Over a 3-year grant:
- Year 1: 40-50 students (pilot)
- Year 2: 50-60 students (full implementation)
- Year 3: 50-60 students (replication + longitudinal)

**Total N = 140-170 students** — sufficient for detecting medium effect sizes (d = 0.5) with adequate power.

#### 3. Multi-Institution Partnership

To increase N and test generalizability:

| Institution | Type | Est. 201 Enrollment | 3-Year N |
|-------------|------|---------------------|----------|
| SDSU | R2 public | 40-50/year | 120-150 |
| Partner 1 (TBD) | R1 or SLAC | 30-60/year | 90-180 |
| Partner 2 (TBD) | Community college pathway | 20-40/year | 60-120 |

**Combined N = 270-450 students** across diverse institutional contexts.

This also addresses generalizability: if the intervention works at an R2, an R1, and a CC, the results are more convincing than single-institution findings.

#### 4. Cost-Per-Scientist Efficiency

| Intervention | Typical Cost | Target N | Est. Additional STEM Graduates | Cost per Graduate |
|--------------|--------------|----------|-------------------------------|-------------------|
| Intro course reform | $500K | 1,000 | ~20 (2% conversion improvement) | $25,000 |
| Intermediate course reform | $400K | 150 | ~15-20 (10-15% retention improvement) | $20,000-27,000 |

**The efficiency is comparable**—and intermediate course reform has the added benefit of producing graduates with deeper preparation.

### Citations

- President's Council of Advisors on Science and Technology (PCAST). (2012). *Engage to Excel: Producing One Million Additional College Graduates with Degrees in Science, Technology, Engineering, and Mathematics*. Executive Office of the President.
- Seymour, E., & Hewitt, N. M. (1997). *Talking About Leaving: Why Undergraduates Leave the Sciences*. Westview Press.
- Chen, X. (2013). *STEM Attrition: College Students' Paths Into and Out of STEM Fields* (NCES 2014-001). National Center for Education Statistics.

---

## Transferability: Beyond Astronomy

### Why Astronomy Is a Good Testbed

Astronomy occupies a unique pedagogical niche:

| Feature | Astronomy | Physics | Engineering |
|---------|-----------|---------|-------------|
| Equations are real | ✓ (same as physics) | ✓ | ✓ (applied) |
| Math anxiety barrier | Moderate | High | High |
| Visual/intuitive hooks | **High** (pictures of space) | Moderate | Variable |
| Student interest | **High** (everyone loves space) | Moderate | Variable |
| Cultural baggage ("hard") | Moderate | **High** | **High** |

Astronomy is "physics with better PR." Students who are intimidated by "physics" will take astronomy. This makes astronomy an ideal testbed for pedagogies that help students engage with equations—because students show up with interest rather than dread.

### Transferable Pedagogical Innovations

The techniques developed in this grant are not astronomy-specific:

| Innovation | Astronomy Application | Transfer Potential |
|------------|----------------------|-------------------|
| **Equation Maps** | Hydrostatic equilibrium, Friedmann equation | Any equation-heavy course (thermodynamics, circuits, mechanics) |
| **Predict-Explore-Explain** | Demo missions with predictions | Any simulation-based instruction |
| **Model Cards** | "What the star model assumes" | Any computational model in any field |
| **Failure Analysis** | "I broke the polytrope by..." | Engineering design, computational science |
| **Synthesis Memos** | "My star is [type] because..." | Scientific writing in any discipline |

### The Broader Vision

If this grant succeeds, it provides:

1. **Proof of concept** that equation fluency can be taught through simulations
2. **Validated instruments** (Equation Fluency Inventory) usable in any STEM field
3. **Pedagogical framework** (Predict-Explore-Explain + Equation Maps) adaptable to physics, chemistry, engineering
4. **Open-source demonstration** that other disciplines can fork and adapt

**The pitch:** We're using astronomy as a testbed to develop STEM-wide pedagogical innovations. The demos are astronomy-specific, but the *approach* is universal.

### Citations

- Schwarz, C. V., Reiser, B. J., Davis, E. A., Kenyon, L., Achér, A., Fortus, D., ... & Krajcik, J. (2009). Developing a learning progression for scientific modeling: Making scientific modeling accessible and meaningful for learners. *Journal of Research in Science Teaching*, 46(6), 632-654.
- Windschitl, M., Thompson, J., & Braaten, M. (2008). Beyond the scientific method: Model‐based inquiry as a new paradigm of preference for school science investigations. *Science Education*, 92(5), 941-967.
- Bransford, J. D., & Schwartz, D. L. (1999). Rethinking transfer: A simple proposal with multiple implications. *Review of Research in Education*, 24(1), 61-100.

---

## Research Goals

### Primary Research Questions

1. **Math Anxiety Reduction:** Does structured demo-based learning reduce math anxiety as measured by validated instruments (MARS-R, Fennema-Sherman)?

2. **Equation Fluency Development:** Do students who learn through demos develop better "equation sense"—the ability to:
   - Predict what an equation will produce before calculating
   - Identify which terms dominate in different regimes
   - Diagnose when an equation is being misapplied
   - Transfer equation understanding to new contexts

3. **Transfer to Upper-Division:** Do students from demo-based courses perform better in traditional upper-division courses that require mathematical derivation?

4. **Mechanism Identification:** What specific features of demo-based learning drive improvements? Is it:
   - Visualization of abstract relationships?
   - Immediate feedback on predictions?
   - Low-stakes exploration before high-stakes assessment?
   - Writing-to-learn through Equation Maps?

### Secondary Research Questions

5. **Instructor Adoption:** What support do instructors need to implement demo-based teaching effectively?

6. **Equity Effects:** Does demo-based learning differentially benefit students from groups traditionally underrepresented in physics/astronomy?

7. **Optimal Scaffolding:** How much guidance is optimal? How does this change as students gain expertise?

### Why Equity Matters Here

Math anxiety is not evenly distributed. Research shows:

- **Women report higher math anxiety** than men, even at equal performance levels (Hembree, 1990; Else-Quest et al., 2010)
- **First-generation college students** often lack the "hidden curriculum" knowledge that helps navigate math-heavy courses
- **Students from under-resourced high schools** may have gaps that manifest as "anxiety" rather than ability deficits
- **Stereotype threat** can amplify math anxiety in testing situations (Spencer et al., 1999)

**The hypothesis:** If demo-based learning reduces math anxiety and builds equation confidence through low-stakes exploration (rather than high-stakes exams), it may disproportionately benefit students who currently leave STEM due to anxiety rather than ability.

**This is testable.** We can disaggregate outcomes by demographic group and examine whether the intervention closes gaps or maintains them.

**Citations:**
- Hembree, R. (1990). The nature, effects, and relief of mathematics anxiety. *JRME*, 21(1), 33-46.
- Else-Quest, N. M., Hyde, J. S., & Linn, M. C. (2010). Cross-national patterns of gender differences in mathematics. *Psychological Bulletin*, 136(1), 103-127.
- Spencer, S. J., Steele, C. M., & Quinn, D. M. (1999). Stereotype threat and women's math performance. *Journal of Experimental Social Psychology*, 35(1), 4-28.

---

## The Demo Suites

### Overview

Three comprehensive demo suites, each containing 8-9 interconnected demos that build toward a capstone synthesis experience.

| Suite | Focus | Key Equations | Demos |
|-------|-------|---------------|-------|
| **Stellar Structure** | How stars work; equilibrium, energy, transport | HSE, mass continuity, energy generation, opacity | 8 demos |
| **Galaxies** | From light to mass; dark matter inference | Rotation curves, M/L ratios, virial theorem | 8 demos |
| **Cosmology** | The expanding universe; multi-probe inference | Friedmann equation, distance measures, BAO | 9 demos |

### Shared Infrastructure: The "Cosmic Core"

All demos share:

- **Equation Display Panel:** Shows relevant equations with term-by-term highlighting as parameters change
- **Model Card:** Explains assumptions, valid ranges, what the model omits
- **Prediction Mode:** Students commit predictions before seeing results
- **Autologging:** Records exploration path for research and assessment
- **Export:** Figures, parameters, and exploration logs exportable for memos

### Suite 1: Stellar Structure (8 Demos)

| # | Demo | Physics | Key Equation |
|---|------|---------|--------------|
| 1 | EOS Explorer | Ideal gas, radiation pressure, degeneracy | $P = P_{gas} + P_{rad} + P_{deg}$ |
| 2 | Hydrostatic Equilibrium | Force balance in stars | $\frac{dP}{dr} = -\frac{Gm\rho}{r^2}$ |
| 3 | Stellar Timescales | KH, nuclear, dynamical | $\tau_{KH} = \frac{GM^2}{RL}$ |
| 4 | Polytrope Lab | Lane-Emden solutions | $\frac{1}{\xi^2}\frac{d}{d\xi}\left(\xi^2\frac{d\theta}{d\xi}\right) = -\theta^n$ |
| 5 | Nuclear Furnace | pp-chain, CNO, triple-α | $\epsilon \propto \rho T^n$ |
| 6 | Opacity Matters | Kramers, electron scattering | $\kappa = \kappa_0 \rho T^{-3.5}$ |
| 7 | Energy Transport | Radiative vs. convective | $\nabla_{rad}$ vs. $\nabla_{ad}$ |
| 8 | Build-a-Star | Full integration; HR diagram | All above |

**Capstone Challenge:** Build a star of specified mass and composition that lands on the correct location on the HR diagram. Explain why it has that luminosity and temperature.

### Suite 2: Galaxies (8 Demos)

| # | Demo | Physics | Key Equation |
|---|------|---------|--------------|
| 1 | Galaxy Anatomy | Morphology, components, profiles | Sérsic profile, exponential disk |
| 2 | Light to Mass | Photometry, M/L ratios | $M_* = (M/L) \times L$ |
| 3 | Rotation Curves | Circular velocity, enclosed mass | $v_c = \sqrt{GM(<r)/r}$ |
| 4 | Velocity Dispersion | Pressure-supported systems | $\sigma^2 = \frac{GM}{r}$ (virial) |
| 5 | The Baryon Cycle | Gas, star formation, regulation | SFR laws, gas depletion |
| 6 | Feedback in Action | Supernovae, AGN, quenching | Energy injection, mass loading |
| 7 | Galaxy Mergers | Interactions, tidal effects | Dynamical friction, timescales |
| 8 | Scaling Relations | Tully-Fisher, Faber-Jackson, FP | $L \propto v^4$, $L \propto \sigma^4$ |

**Capstone Challenge:** Given observables for a mystery galaxy (photometry, rotation curve, gas mass), determine its dark matter fraction and reconstruct its likely formation history.

### Suite 3: Cosmology (9 Demos)

| # | Demo | Physics | Key Equation |
|---|------|---------|--------------|
| 1 | Scale Factor | Expansion, a(t), Hubble parameter | $H = \dot{a}/a$ |
| 2 | Redshift | Cosmological vs. Doppler | $1 + z = a_0/a_{emit}$ |
| 3 | Distance Measures | $D_L$, $D_A$, $D_C$ and their differences | $D_L = (1+z) D_C$ |
| 4 | Friedmann Equation | Expansion dynamics, components | $H^2 = \frac{8\pi G}{3}\rho - \frac{kc^2}{a^2}$ |
| 5 | Thermal History | Temperature evolution, decoupling | $T \propto 1/a$ |
| 6 | Recombination | Last scattering, CMB origin | Saha equation |
| 7 | BAO | Sound horizon, standard ruler | $r_s = \int_0^{t_{dec}} c_s \, dt$ |
| 8 | Structure Growth | Linear perturbations, $\sigma_8$ | $\delta \propto D(a)$ |
| 9 | Probes Lab | Multi-probe inference, degeneracies | $\chi^2$ minimization |

**Capstone Challenge:** Use at least two cosmological probes to constrain $\Omega_m$ and $\Omega_\Lambda$. Explain why combining probes breaks degeneracies.

---

## The ASTR 201 Course Redesign

Grant 2 would fund full implementation and assessment of the ASTR 201 course redesign (detailed in separate document), including:

### Pedagogical Innovations

1. **Learning Glass Theoretical Foundation:** Pre-recorded video lectures for prerequisite refresh
2. **Predict-Explore-Explain Cycle:** Structured demo missions with required predictions
3. **Equation Maps:** Written artifacts requiring term-by-term physical explanation
4. **Failure Analysis:** Required exploration of model limits
5. **Three Synthesis Memos:** Distributed writing practice across semester

### Assessment Instruments

| Instrument | What It Measures | When | Status |
|------------|------------------|------|--------|
| **PIQL** (Physics Inventory of Quantitative Literacy) | Proportional reasoning, covariation | Pre/post | Validated ✓ |
| **QuaRCS** (attitudes subscale) | Quantitative attitudes, self-efficacy | Pre/post | Validated ✓ |
| **MARS-R** (Math Anxiety Rating Scale) | Math anxiety levels | Pre/post | Validated ✓ |
| **Astro-EFI** (to be developed) | Equation fluency: prediction, dominant terms, diagnosis, transfer | Pre/post | To develop |
| **Embedded Prediction Tasks** | Prediction accuracy, confidence calibration | Continuous | Built into demos |
| **Exploration Analytics** | Engagement patterns, systematic reasoning | Continuous | Built into demos |
| **Transfer Tasks** | Application to novel problems | End of course | Custom |
| **Upper-Div Performance** | Grades in 301/302/303 | Longitudinal | Institutional data |

*See [Measuring Equation Fluency](#measuring-equation-fluency-the-assessment-strategy) for detailed instrument strategy.*

---

## Measuring Equation Fluency: The Assessment Strategy

### The Measurement Problem

**Core challenge:** "Equation fluency" as we've defined it—the ability to predict equation behavior, identify dominant terms, diagnose misapplication, and transfer understanding—is not well-captured by existing validated instruments. This creates a tension:

1. **Validated instruments** (PIQL, QuaRCS) measure related constructs but may miss what makes demo-based learning unique
2. **New instrument development** is publishable and high-impact, but requires psychometrics expertise and significant effort
3. **Custom tasks** capture exactly what we want to measure, but lack validation

**Our solution:** A hybrid approach that adapts existing instruments while piloting astronomy-specific equation fluency tasks.

---

### Related Existing Instruments

#### 1. Symbol Sense (Arcavi, 1994)

**What it is:** Math education construct about "when and how to use symbols"—reading *through* algebraic expressions to understand meaning, not just manipulating them.

**Relevance:** Closest conceptually to equation fluency. Includes:
- Recognizing that symbols represent quantities that vary
- Understanding the structure of an expression (which parts dominate)
- Connecting symbolic and graphical representations

**Limitation:** Not a validated instrument; more of a theoretical framework. No items we can directly use.

#### 2. PIQL (Physics Inventory of Quantitative Literacy)

**What it is:** 20-item validated instrument measuring:
- Proportional reasoning
- Covariation (how quantities change together)
- Signed quantities and negative rates
- Reasoning with ratios

**Sample item type:** "If A doubles and B stays the same, what happens to C = A/B?"

**Relevance:** Captures some of the quantitative reasoning underlying equation fluency. Well-validated, published, used in physics education research.

**Limitation:** Focuses on general reasoning, not equation interpretation in physics contexts. Doesn't assess whether students can "read" a physics equation and predict behavior.

**Citation:** White Brahmia, S., Boudreaux, A., & Kanim, S. E. (2016). Developing Mathematization with Physics Inventory of Quantitative Literacy. *PERC Proceedings*.

#### 3. QuaRCS (Quantitative Reasoning for College Science)

**What it is:** Assessment developed specifically for Astro 101 at University of Arizona measuring:
- Quantitative skills (arithmetic, estimation, graphs)
- Quantitative attitudes (math anxiety, self-efficacy)

**Relevance:**
- Already astronomy-contextualized
- Includes attitudes/anxiety measures (which we care about)
- Validated with intro astro students

**Limitation:** More about general quantitative literacy than equation-specific fluency. Appropriate for 101, may be too basic for 201.

**Citation:** Follette, K., McCarthy, D., Dokter, E., Bursick, S., & Pompea, S. (2017). The Quantitative Reasoning for College Science (QuaRCS) Assessment 1. *Numeracy*, 10(2), Article 3.

#### 4. MARS-R (Math Anxiety Rating Scale - Revised)

**What it is:** Validated 30-item scale measuring math anxiety across dimensions:
- Math test anxiety
- Numerical task anxiety
- Math course anxiety

**Relevance:** Directly measures math anxiety, which is one of our primary outcomes.

**Limitation:** Measures anxiety, not fluency. Useful for pre/post comparison but doesn't capture skill development.

---

### The Hybrid Strategy: Astro-EFI (Equation Fluency Inventory)

**Approach:** Adapt PIQL structure and validation methodology, but with astronomy-specific equation fluency items. This is a recognized methodology in education research called **instrument adaptation**.

#### Phase 1: Use Existing Instruments (Year 1)

| Instrument | Use | Purpose |
|------------|-----|---------|
| **PIQL** | Pre/post | Baseline quantitative reasoning; comparison to literature |
| **QuaRCS (attitudes subscale)** | Pre/post | Math anxiety, self-efficacy |
| **MARS-R (short form)** | Pre/post | Detailed math anxiety measure |

These provide validated, publishable outcomes while we develop the custom instrument.

#### Phase 2: Pilot Astro-EFI Items (Years 1-2)

Develop 15-20 astronomy-specific equation fluency items using PIQL-style validation:
1. **Expert review** (5+ astronomy/physics faculty evaluate items)
2. **Cognitive interviews** (10-15 students think aloud while answering)
3. **Pilot administration** (n = 100+ students)
4. **Item analysis** (difficulty, discrimination, factor structure)

#### Phase 3: Validate & Publish (Year 3+)

- Publish validated Astro-EFI with psychometric properties
- Compare Astro-EFI gains to PIQL gains to test whether demos build *equation-specific* skills beyond general reasoning
- Make instrument freely available for other researchers

---

### Equation Fluency Task Types (Astro-EFI Items)

Based on our definition of equation fluency, items should assess four competencies:

#### Type 1: Behavioral Prediction
*"Before calculating, predict what the equation will do."*

**Example (Hydrostatic Equilibrium):**
> The central pressure of a star is given by $P_c \propto \frac{M^2}{R^4}$.
>
> If a star's mass doubles while its radius stays constant, the central pressure will:
> - (a) Double
> - (b) Quadruple
> - (c) Stay the same
> - (d) Decrease by half

**What it measures:** Can the student read the equation structure and predict behavior without calculating?

---

#### Type 2: Dominant Term Identification
*"Which part of the equation matters most in this regime?"*

**Example (Friedmann Equation):**
> The Friedmann equation is $H^2 = \frac{8\pi G}{3}(\rho_m + \rho_r + \rho_\Lambda) - \frac{kc^2}{a^2}$.
>
> At very early times when the universe was hot and dense, which term dominated?
> - (a) Matter density ($\rho_m$)
> - (b) Radiation density ($\rho_r$)
> - (c) Dark energy ($\rho_\Lambda$)
> - (d) Curvature ($k$)
>
> *Explain your reasoning in 1-2 sentences.*

**What it measures:** Does the student understand how different terms scale with conditions?

---

#### Type 3: Misapplication Diagnosis
*"Why doesn't this equation apply here?"*

**Example (Rotation Curves):**
> A student uses $v = \sqrt{GM/r}$ to predict that velocity should decrease with radius for a spiral galaxy. But observed rotation curves are flat (constant v at large r).
>
> What is the most likely explanation?
> - (a) The equation is wrong
> - (b) The assumption of point mass doesn't apply to extended mass distributions
> - (c) Observations are incorrect
> - (d) Velocity isn't measurable at large radii

**What it measures:** Can the student identify when model assumptions break down?

---

#### Type 4: Transfer / Analogy
*"Apply the same equation structure to a new context."*

**Example (Virial Theorem):**
> The virial theorem relates kinetic and potential energy: $2K + U = 0$ (for bound systems).
>
> In a galaxy cluster, this allows us to estimate total mass from observed velocities. A colleague proposes using the same approach to estimate the mass of a passing asteroid near Earth.
>
> Why would this **not** work?
> - (a) The virial theorem only applies to stars
> - (b) The asteroid is not a bound, virialized system
> - (c) Asteroids are too small to have significant gravity
> - (d) We can't measure asteroid velocities

**What it measures:** Can the student recognize when equation structures do/don't transfer?

---

### Embedded Assessment Tasks (Simulation-Based)

In addition to paper-and-pencil items, we'll develop **embedded assessment tasks** within the demos themselves:

#### Prediction Mode Assessment

Before running any simulation, students must:
1. **Commit a prediction** (slider position, qualitative direction, or multiple choice)
2. **State confidence** (1-5 scale)
3. **Run simulation** and see actual result
4. **Explain discrepancy** if prediction was wrong

**Data captured:**
- Prediction accuracy over time (learning curve)
- Confidence calibration (overconfidence decreases?)
- Quality of explanations (coded qualitatively)

#### Exploration Pattern Analytics

Demo autologs capture:
- Which parameters students explore
- Order of exploration (systematic vs. random)
- Time spent on equation panel vs. visualization
- Whether students use "compare mode" to test hypotheses

**Research question:** Do exploration patterns predict equation fluency gains?

---

### Validation Strategy

| Phase | Activity | Timeline | Sample Size |
|-------|----------|----------|-------------|
| **1. Item Development** | Write 25-30 candidate items across all 4 types | Year 1, Sem 1 | N/A |
| **2. Expert Review** | 5+ faculty rate items for clarity, validity, difficulty | Year 1, Sem 1 | 5-7 experts |
| **3. Cognitive Interviews** | Students think aloud while answering; identify confusion | Year 1, Sem 2 | 12-15 students |
| **4. Pilot Administration** | Administer full item pool to assess psychometrics | Year 2 | n = 120-150 |
| **5. Item Analysis** | Difficulty, discrimination, factor analysis, reliability | Year 2 | - |
| **6. Final Instrument** | Select 15-20 items with best properties | Year 2-3 | - |
| **7. Validation Study** | Test against PIQL, grades, expert ratings | Year 3 | n = 100+ |

---

### How This Positions the Research

**The contribution is three-fold:**

1. **Primary outcomes** use validated instruments (PIQL, QuaRCS, MARS-R)
   - Satisfies reviewers
   - Comparable to existing literature
   - Publishable even if Astro-EFI development is incomplete

2. **Secondary outcomes** use the new Astro-EFI
   - Tests whether demos build *equation-specific* skills beyond general reasoning
   - Generates pilot data for future instrument validation grant

3. **Exploratory outcomes** use embedded simulation tasks
   - Rich process data on how students learn
   - Qualitative insights that inform theory

**The framing to reviewers:**

> "We use established validated instruments for our primary outcomes while simultaneously piloting a new assessment—the Astronomy Equation Fluency Inventory (Astro-EFI)—that targets the specific skills demo-based learning develops. This mixed approach ensures rigorous, publishable findings while advancing assessment methodology in astronomy education."

---

### Potential Collaborators for Instrument Development

| Role | Potential Collaborators | Why |
|------|------------------------|-----|
| **Psychometrics expertise** | SDSU College of Education faculty | Validation methodology, IRT analysis |
| **PIQL developers** | Suzanne White Brahmia (UMaine), Andrew Boudreaux (WWU) | Know the instrument, could advise on adaptation |
| **QuaRCS developers** | Katherine Follette (Amherst), Dennis McCarthy (Arizona) | Astro-specific expertise, could share items/data |
| **Physics Ed Research** | Partner from PER community | Bridges astronomy and physics education |

---

### References (Assessment)

- Arcavi, A. (1994). Symbol sense: Informal sense-making in formal mathematics. *For the Learning of Mathematics*, 14(3), 24-35.
- Follette, K., McCarthy, D., Dokter, E., Bursick, S., & Pompea, S. (2017). The Quantitative Reasoning for College Science (QuaRCS) Assessment. *Numeracy*, 10(2), Article 3.
- Richardson, F. C., & Suinn, R. M. (1972). The Mathematics Anxiety Rating Scale: Psychometric data. *Journal of Counseling Psychology*, 19(6), 551-554.
- White Brahmia, S., Boudreaux, A., & Kanim, S. E. (2016). Developing Mathematization with Physics Inventory of Quantitative Literacy. *PERC Proceedings*.

---

## Research Methodology

### Study Design

**Mixed-methods, quasi-experimental design with longitudinal tracking**

#### Quantitative Components

1. **Pre/Post Assessment:** Math anxiety, equation fluency, conceptual understanding
2. **Comparison Groups:** Demo-based sections vs. traditional sections (where available)
3. **Longitudinal Tracking:** Follow students into upper-division courses
4. **Learning Analytics:** Demo autologs provide fine-grained data on exploration patterns

#### Qualitative Components

1. **Think-Aloud Protocols:** How do students reason through equation problems?
2. **Interview Studies:** How do students describe their relationship with equations?
3. **Instructor Interviews:** What challenges arise in implementation?

### Sample Size and Power

For detecting medium effect sizes (d = 0.5) on math anxiety reduction:
- Minimum n = 64 per group (α = 0.05, power = 0.80)
- Target: 100+ students per condition over grant period

### Timeline (Notional)

| Year | Activities |
|------|------------|
| **Year 1** | Demo suite development; instrument development; pilot in 1-2 sections |
| **Year 2** | Full implementation in ASTR 201; data collection; refinement |
| **Year 3** | Longitudinal tracking; analysis; dissemination; sustainability planning |

---

## Expected Outcomes

### For Students

| Outcome | Metric | Target |
|---------|--------|--------|
| Reduced math anxiety | MARS-R score decrease | >0.5 SD reduction |
| Improved quantitative reasoning | PIQL score | >0.3 normalized gain |
| Improved equation fluency | Astro-EFI (exploratory) | Positive correlation with demo use |
| Better prediction accuracy | Embedded prediction tasks | Improvement over semester |
| Lower DFW rates | Course grades | 40-50% reduction |
| Upper-div success | Grades in 301/302/303 | Improved vs. comparison |

### For the Field

1. **Open-source demo suites** available to any institution
2. **Validated assessment instruments** for equation fluency
3. **Implementation guides** for instructors adopting demo-based pedagogy
4. **Research publications** on math anxiety reduction in astronomy
5. **Replication package** for other institutions to conduct similar studies

### For SDSU

1. Transformed ASTR 201 with documented learning gains
2. Improved pipeline to upper-division and graduate programs
3. National visibility in astronomy education research
4. Foundation for future education research grants

---

## How This Builds on Grant 1

| Grant 1 (ASTR 101/201 Basics) | Grant 2 (Advanced Suites) |
|-------------------------------|---------------------------|
| Foundational demos for intro courses | Comprehensive suites for model-based reasoning |
| Proof of concept: demos improve engagement | Research question: do demos improve equation fluency? |
| Basic implementation guidance | Full pedagogical framework + assessment |
| Preliminary learning outcomes data | Rigorous quasi-experimental design |
| Single-institution pilot | Multi-section comparison; replication potential |

**The Logic:** Grant 1 proves that interactive demos work for intro astronomy. Grant 2 asks: *Can they solve the harder problem of math anxiety and equation fluency in physics-heavy courses?*

---

## Potential Collaborators

| Role | Potential Collaborator | Contribution |
|------|------------------------|--------------|
| **Co-PI: STEM Education** | Dr. Matt Anderson (SDSU CRMSE) | Learning Glass, assessment design, education research expertise |
| **Consultant: Physics Ed** | (TBD from PER community) | Equation fluency instrument development |
| **Consultant: Astronomy Ed** | (TBD from AER community) | Alignment with astronomy concept inventories |
| **External Evaluator** | (TBD) | Independent assessment of outcomes |

---

## Budget Categories (Rough Estimate)

| Category | Estimate | Notes |
|----------|----------|-------|
| **Personnel** | | |
| PI summer salary | $XX,XXX × 3 years | Course development, research |
| Co-PI summer salary | $XX,XXX × 3 years | Assessment design, education research |
| Graduate student | $XX,XXX × 3 years | Demo development, data collection |
| Undergraduate assistants | $XX,XXX × 3 years | Testing, user studies |
| **Development** | | |
| Software development | $XX,XXX | Demo infrastructure, autologging |
| Learning Glass production | $XX,XXX | Video production costs |
| **Research** | | |
| Instrument development | $XX,XXX | Equation fluency inventory |
| Participant incentives | $XX,XXX | Interview studies |
| **Dissemination** | | |
| Conference travel | $XX,XXX | AAS, AAPT, Gordon Conference |
| Publication costs | $XX,XXX | Open access fees |
| Workshop hosting | $XX,XXX | Adopter training |
| **Indirect costs** | XX% | Per SDSU rates |

**Total:** $XXX,XXX - $XXX,XXX (Level 2 IUSE range)

---

## Alignment with NSF IUSE Goals

### The Novelty Pitch

**Most STEM education research stops at the intro course.** We're asking: *What happens next?*

PhET simulations transformed how we teach Physics 101. Studio physics revolutionized introductory mechanics. But those students still hit a wall when they reach intermediate courses where equations become unavoidable.

**This proposal fills a critical gap:**

| What Exists | What's Missing (Our Contribution) |
|-------------|-----------------------------------|
| Intro-level simulations (PhET, etc.) | Intermediate-level simulations with real physics depth |
| Conceptual inventories for 101 | Equation fluency assessments for 201 |
| "Active learning works" (general) | "Active learning helps with math anxiety" (specific) |
| Studio physics for intro courses | Studio astrophysics for the major pipeline |

**The reviewer should think:** "This isn't just another active learning study—it's targeting the course level where students decide whether they can *become* physicists."

---

### Engaged Student Learning (Track 1)

- Develops evidence-based instructional materials for an **understudied course level**
- Targets known barrier (math anxiety) in STEM persistence
- Builds on prior work (Grant 1) with expanded scope
- Addresses the "valley of death" between intro and upper-div courses

### Institutional and Community Transformation (Track 2)

- Changes how ASTR 201 is taught at SDSU
- Provides materials for adoption at other institutions
- Contributes to national conversation on equation fluency
- Could catalyze similar efforts in Physics 201, Chemistry 201, etc.

### The AI-Era Framing (For Reviewers)

**Lead with this:** "We are preparing students for a STEM workforce where AI handles routine calculations. The skills that remain valuable—physical intuition, model evaluation, anomaly detection—are precisely what demo-based learning develops."

This reframes the proposal from "incremental pedagogy improvement" to "essential workforce preparation." It's not just about teaching astronomy better; it's about teaching the skills AI can't replace.

### IUSE Review Criteria

| Criterion | How This Proposal Addresses It |
|-----------|-------------------------------|
| **Intellectual Merit** | Novel research on equation fluency at intermediate level; fills gap in literature; new assessment instruments; addresses AI-era skill needs |
| **Broader Impacts** | Open-source materials; math anxiety reduction benefits underrepresented groups disproportionately; transferable to other STEM disciplines; prepares students for AI-augmented workforce |
| **Evidence Base** | Builds on established active learning research; adds new dimension (equation fluency); targets understudied population; responds to documented workforce skill shifts |
| **Assessment Plan** | Mixed-methods with validated instruments; longitudinal tracking into upper-div courses; multi-institution replication |
| **Sustainability** | Open-source; integrated into curriculum; training materials for adopters; transferable pedagogical framework |

---

## Grant Landscape: Beyond IUSE

### SDSU's HSI Status Is an Underutilized Asset

SDSU is a **Hispanic-Serving Institution** (HSI), which opens doors to dedicated NSF funding streams with *lower competition* than general IUSE. These programs explicitly fund STEM education research at HSIs.

---

### NSF HSI Programs ⭐ (High Priority)

#### [HSI: Equitable Transformation in STEM Education (ETSE)](https://www.nsf.gov/funding/opportunities/hispanic-serving-institutions-equitable-transformation-stem/506287/nsf24-578)

| Feature | Details |
|---------|---------|
| **Focus** | Institutional transformation + STEM education research |
| **Encourages** | Projects on AI, emerging technologies (explicitly!) |
| **Tracks** | Track 2 (Implementation) or Track 3 (Institutional Transformation) |
| **Fit** | Math anxiety research + equation fluency + AI-resistant skills |

**Why this is ideal for Grant 2:** The HSI-ETSE program explicitly encourages projects focused on "artificial intelligence" and "emerging technologies." Our framing of "AI-resistant skills" aligns perfectly. The equity angle (math anxiety disproportionately affects underrepresented students) strengthens the case.

#### [HSI: Enriching Learning, Programs, and Student Experiences (ELPSE)](https://www.nsf.gov/funding/opportunities/hsielpse-hispanic-serving-institutions-enriching-learning-programs/nsf24-551/solicitation)

| Feature | Details |
|---------|---------|
| **Goal** | Increase recruitment, retention, graduation in STEM |
| **Tracks** | PPP (Planning/Pilot), IEP (Implementation), EI (Educational Instrumentation) |
| **Fit** | Demos + Learning Glass directly address retention at the 201 level |

**Strategic option:** Submit Grant 1 to general IUSE, then submit Grant 2 (or a parallel proposal) to HSI-ETSE with different framing. Same demos, different emphasis: "increasing retention of Hispanic students through reduction of math anxiety."

---

### [NSF CAREER Award](https://www.nsf.gov/funding/opportunities/career-faculty-early-career-development-program) (If Eligible)

| Feature | Details |
|---------|---------|
| **Award** | $400K-500K over 5 years |
| **Requirement** | Integrated education plan that is "distinctive, innovative, and beyond typical" |
| **Deadline** | July 23, 2025 (and annually) |
| **Eligibility** | Early-career tenure-track faculty |

**Why this fits:** The CAREER award requires an education component that is genuinely integrated with research. Your demo-based pedagogy + math anxiety/equation fluency research is exactly this kind of integration—not a tacked-on "broader impacts" section, but a genuine research program on teaching.

**The pitch:** "My research develops pedagogies for AI-resistant STEM competencies, using astronomy as a testbed for interventions that transfer to physics, engineering, and beyond."

⚠️ *Note: Monitor CAREER program funding under current administration.*

---

### Private Foundations

#### [Heising-Simons Foundation](https://www.hsfoundation.org/programs/science/)

| Program | Details |
|---------|---------|
| **Science Events & Gatherings** | $20K-80K grants for workshops, summer schools, collaborations |
| **Women in Physics/Astronomy** | Focus on increasing representation and retention |
| **Application** | Open calls (typically Q4); no unsolicited proposals |

**Potential use:** Fund a pilot workshop or summer institute on demo-based pedagogy. Could be a stepping stone to larger grants or a way to build a multi-institution collaboration.

#### [Research Corporation for Science Advancement - Cottrell Scholar Award](https://rescorp.org/cottrell-scholars/cottrell-scholar-award/)

| Feature | Details |
|---------|---------|
| **Award** | $120,000 over 3 years |
| **Eligibility** | Early-career tenure-track in chemistry, physics, astronomy |
| **2026 Cycle** | Started tenure-track in 2023; applications open March 4, 2025, due July 1, 2025 |
| **Focus** | Teacher-scholars who integrate research and education |

**Why this fits:** Cottrell explicitly values the integration of research and teaching. Recent awardees include astronomy education-focused projects. The demo-based pedagogy work is exactly what they're looking for.

---

### Strategic Grant Sequencing

| Grant | Timing | Amount | Focus |
|-------|--------|--------|-------|
| **Grant 1: IUSE Level 1** | Mid-July 2026 | ~$300K | ASTR 101/201 foundational demos |
| **Grant 1b: HSI-ELPSE** | Parallel or shortly after | ~$300-500K | Same work, HSI framing (retention focus) |
| **Cottrell Scholar** | July 2025 (if eligible) | $120K | Integrated research/teaching program |
| **Grant 2: HSI-ETSE** | Year 2-3 of Grant 1 | ~$500K-1M | Advanced suites + ASTR 201 redesign + AI-skills framing |
| **Heising-Simons** | Opportunistic | $20-80K | Workshop or pilot for multi-institution collaboration |

### The HSI Advantage: Lower Competition

| Grant Type | Applicant Pool | Competition Level |
|------------|----------------|-------------------|
| General IUSE | All US institutions | **High** |
| HSI-ELPSE / HSI-ETSE | Only HSIs (~500 institutions) | **Lower** |
| CAREER | All early-career faculty | **Very High** |
| Cottrell Scholar | Early-career in specific fields | **High** |

**The math:** There are ~4,000 degree-granting institutions in the US, but only ~500 HSIs. The applicant pool for HSI programs is 1/8 the size of general programs. Your odds are significantly better.

---

### Key Deadlines to Track

| Grant | Deadline | Notes |
|-------|----------|-------|
| NSF IUSE | Check current solicitation | Grant 1 target |
| NSF HSI-ELPSE | Check NSF 24-551 | Parallel opportunity |
| NSF HSI-ETSE | Check NSF 24-578 | Grant 2 target |
| NSF CAREER | July 23, 2025 | If early-career eligible |
| Cottrell Scholar | July 1, 2025 | If started tenure-track 2023 |
| Heising-Simons Events | Typically Q4 | For workshops |

---

## Open Questions / Needs Further Development

### Research Design
1. ~~**Equation Fluency Inventory:** Does a validated instrument exist, or do we need to develop one?~~ → **RESOLVED:** See [Measuring Equation Fluency](#measuring-equation-fluency-the-assessment-strategy) section. Strategy: Use validated PIQL/QuaRCS/MARS-R for primary outcomes; develop Astro-EFI as secondary contribution.
2. **Comparison Group Ethics:** Is it ethical to have "control" sections with traditional instruction if we believe demos are better? (Consider waitlist design or historical comparison.)

### Partnerships & Scale
3. **Multi-Institution Partners:** Who are the right partners? Consider:
   - Another R2 with similar astronomy program
   - An R1 with larger enrollment (for N)
   - A community college (for diversity and transfer pathway)
4. **PER/AER Collaborators:** Who in the physics/astronomy education research community should we bring in for instrument development?

### Scope & Timing
5. **Scope:** Is three demo suites too ambitious? Options:
   - All three suites + moderate research depth
   - One suite (Stellar) + deep research + instrument development
   - Two suites (Stellar + Galaxies) as compromise
6. **Timing:** When to submit?
   - Option A: Submit in Year 2 of Grant 1 (use preliminary data)
   - Option B: Submit in Year 3 of Grant 1 (use fuller results)
   - Option C: Submit concurrently with Grant 1 renewal if applicable

### Framing
7. **Lead Angle:** Which framing resonates most with IUSE reviewers?
   - "Math anxiety reduction" (well-established concern)
   - "Equation fluency" (novel construct, may need more justification)
   - "AI-resistant skills" (timely, but may seem trendy)
   - Combination of all three?

### Sustainability
8. **Post-Grant Maintenance:** Who maintains the demos after the grant ends? Need sustainability plan.
9. **Adoption Pathway:** How do other institutions actually adopt this? Need clear onboarding process.

---

## Next Steps

1. [ ] Complete Grant 1 proposal (deadline: mid-July 2026)
2. [ ] Discuss collaboration with Matt Anderson
3. [ ] Review Grant 1 outcomes (Year 1-2 data)
4. [ ] Literature review on equation fluency assessment
5. [ ] Identify potential PER/AER collaborators
6. [ ] Refine research questions based on Grant 1 findings
7. [ ] Draft Grant 2 proposal (tentative: Year 2-3 of Grant 1)

---

## References (Preliminary)

### Math Anxiety & Equity
- Beilock, S. L., & Maloney, E. A. (2015). Math anxiety: A factor in math achievement not to be ignored. *Policy Insights from the Behavioral and Brain Sciences*, 2(1), 4-12.
- Else-Quest, N. M., Hyde, J. S., & Linn, M. C. (2010). Cross-national patterns of gender differences in mathematics. *Psychological Bulletin*, 136(1), 103-127.
- Hembree, R. (1990). The nature, effects, and relief of mathematics anxiety. *Journal for Research in Mathematics Education*, 21(1), 33-46.
- Spencer, S. J., Steele, C. M., & Quinn, D. M. (1999). Stereotype threat and women's math performance. *Journal of Experimental Social Psychology*, 35(1), 4-28.

### Active Learning & Simulations
- Freeman, S., et al. (2014). Active learning increases student performance in science, engineering, and mathematics. *PNAS*, 111(23), 8410-8415.
- Hake, R. R. (1998). Interactive-engagement versus traditional methods: A six-thousand-student survey of mechanics test data. *American Journal of Physics*, 66(1), 64-74.
- Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). Why minimal guidance during instruction does not work. *Educational Psychologist*, 41(2), 75-86.
- Wieman, C. E., Adams, W. K., & Perkins, K. K. (2008). PhET: Simulations that enhance learning. *Science*, 322(5902), 682-683.

### AI, Automation & Future of Work
- Autor, D. H. (2015). Why are there still so many jobs? The history and future of workplace automation. *Journal of Economic Perspectives*, 29(3), 3-30.
- Brynjolfsson, E., & McAfee, A. (2014). *The Second Machine Age: Work, Progress, and Prosperity in a Time of Brilliant Technologies*. W.W. Norton.
- Frey, C. B., & Osborne, M. A. (2017). The future of employment: How susceptible are jobs to computerisation? *Technological Forecasting and Social Change*, 114, 254-280.
- National Academies of Sciences, Engineering, and Medicine. (2018). *Data Science for Undergraduates: Opportunities and Options*. National Academies Press.

### STEM Pipeline & Attrition
- Chen, X. (2013). *STEM Attrition: College Students' Paths Into and Out of STEM Fields* (NCES 2014-001). National Center for Education Statistics.
- President's Council of Advisors on Science and Technology (PCAST). (2012). *Engage to Excel: Producing One Million Additional College Graduates with Degrees in Science, Technology, Engineering, and Mathematics*. Executive Office of the President.
- Seymour, E., & Hewitt, N. M. (1997). *Talking About Leaving: Why Undergraduates Leave the Sciences*. Westview Press.

### Model-Based Reasoning & Transfer
- Bransford, J. D., & Schwartz, D. L. (1999). Rethinking transfer: A simple proposal with multiple implications. *Review of Research in Education*, 24(1), 61-100.
- Schwarz, C. V., et al. (2009). Developing a learning progression for scientific modeling. *Journal of Research in Science Teaching*, 46(6), 632-654.
- Windschitl, M., Thompson, J., & Braaten, M. (2008). Beyond the scientific method: Model‐based inquiry as a new paradigm of preference for school science investigations. *Science Education*, 92(5), 941-967.

---

*Vision Document for Future NSF IUSE Grant*
*Cosmic Playground Project*
*San Diego State University*
