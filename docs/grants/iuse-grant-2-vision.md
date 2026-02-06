# NSF IUSE Grant 2: Vision Document
## "Cosmic Playground: Advanced Demo Suites for Model-Based Astrophysics Education"

**Status:** Early Planning / Brainstorming (Organized Brain Dump)
**Target Submission:** ~2-3 years from now (after Grant 1 data)
**Builds On:** IUSE Grant 1 (ASTR 101/201 foundational demos)
**Principal Investigator:** Dr. Anna Rosen (SDSU)
**Potential Co-PI:** Dr. Matt Anderson (SDSU CRMSE)

---

## Document Organization

This vision document is organized into four parts:

| Part | Purpose | Contents |
|------|---------|----------|
| **Part I: The Vision** | Why this matters | Problem, research questions, novelty, AI framing |
| **Part II: The Research Design** | How we'll study it | Theory, methodology, measurement, comparison design |
| **Part III: The Intervention** | What we're building | Demo suites, course redesign, pedagogical framework |
| **Part IV: Strategic & Practical** | How to make it happen | Grant landscape, collaborators, budget, TODOs |

---

## Table of Contents

### Part I: The Vision
1. [Executive Summary](#executive-summary)
2. [The Problem This Grant Addresses](#the-problem-this-grant-addresses)
   - [The Neglected Middle](#the-neglected-middle-why-intermediate-courses-are-understudied)
   - [The Math Anxiety Crisis](#the-math-anxiety-crisis-in-stem)
   - [What We Actually See in the Classroom](#what-we-actually-see-in-the-classroom)
   - [What the Research Literature Shows](#what-the-research-literature-shows)
3. [Why This Matters in an AI-Driven World](#why-this-matters-in-an-ai-driven-world)
4. [Addressing the Small N Problem](#addressing-the-small-n-problem)
5. [Transferability: Beyond Astronomy](#transferability-beyond-astronomy)
6. [Research Goals](#research-goals)

### Part II: The Research Design
7. [Theoretical Framework](#theoretical-framework)
   - [Foundational: Grounded Cognition](#foundational-framework-grounded-cognition)
   - [Learning Mechanism: Productive Failure](#learning-mechanism-productive-failure)
   - [Affective Pathway: Self-Efficacy Theory](#affective-pathway-self-efficacy-theory)
   - [Integrated Theory of Change](#integrated-theory-of-change)
8. [Scope Strategy](#scope-strategy-curriculum-vs-research)
   - [Whole-Course with Module Checkpoints](#research-design-whole-course-with-module-checkpoints)
9. [Rethinking Assessment: What We Actually Care About](#rethinking-assessment-what-we-actually-care-about)
   - [The Honest Goal](#the-honest-goal)
   - [Why Existing Instruments Don't Fit](#why-existing-instruments-dont-fit)
   - [Our Assessment Philosophy](#our-assessment-philosophy-authentic-measurement)
   - [The Assessment Strategy](#the-assessment-strategy-what-well-actually-do)
   - [Technical Details: Validated Instruments](#technical-details-the-validated-instruments)
10. [Measuring Equation Fluency](#measuring-equation-fluency-the-assessment-strategy) (Secondary)
   - [Astro-EFI Development](#the-hybrid-strategy-astro-efi-equation-fluency-inventory)
   - [Equation Fluency Task Types](#equation-fluency-task-types-astro-efi-items)
11. [Comparison Group Design](#comparison-group-design)
11. [Research Methodology](#research-methodology)
12. [Expected Outcomes](#expected-outcomes)

### Part III: The Intervention
13. [The Demo Suites](#the-demo-suites)
    - [Learning Glass Lectures](#learning-glass-lectures-theory-before-exploration)
    - [Shared Infrastructure: Cosmic Core](#shared-infrastructure-the-cosmic-core)
14. [The ASTR 201 Course Redesign](#the-astr-201-course-redesign)
15. [How This Builds on Grant 1](#how-this-builds-on-grant-1)

### Part IV: Strategic & Practical
16. [PI Qualifications](#pi-qualifications-why-a-computational-astrophysicist)
17. [Potential Collaborators](#potential-collaborators)
18. [Budget Categories](#budget-categories-rough-estimate)
19. [Alignment with NSF IUSE Goals](#alignment-with-nsf-iuse-goals)
20. [Grant Landscape: Beyond IUSE](#grant-landscape-beyond-iuse)
    - [NSF HSI Programs](#nsf-hsi-programs--high-priority)
    - [NSF CAREER Award](#nsf-career-award-if-eligible)
    - [Private Foundations](#private-foundations)
    - [Strategic Grant Sequencing](#strategic-grant-sequencing)
21. [Open Questions](#open-questions--needs-further-development)
22. [Action Items & TODOs](#action-items--todos)
23. [Next Steps](#next-steps)
24. [References](#references-preliminary)

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

### What We Actually See in the Classroom

Three years of teaching ASTR 201 reveals a consistent pattern:

**The problem is math and problem-solving, not memorization.**

Students don't fail because they can't remember facts about stars. They struggle because:
- They've never been asked to *reason* with equations
- They don't know how to approach unfamiliar problems
- They expect to memorize procedures, not understand principles
- Prior education trained them to pattern-match, not think

**Even students who took Physics 195 struggle.** The physics prerequisite doesn't solve the problem — students arrive having "done" physics but without having learned to *think* with equations.

**For many students, ASTR 201 is their first small STEM class.** They've survived large intro courses (500 students, multiple choice, routine problem sets) with study strategies that don't transfer: memorize definitions, memorize formulas, reproduce on exam.

When those strategies fail in a 40-person class with derivation problems and "explain your reasoning" questions, students are genuinely lost. They ask:

> *"I tried to study like I did in high school and it doesn't work here. What should I do?"*

> *"I memorized all the equations but I still couldn't do the problems."*

**The gap isn't motivation or intelligence. It's skill.** Students have never been taught to reason with equations — and they know it. They're asking for help learning *how to learn*.

### What the Research Literature Shows

These classroom observations align with decades of research documenting systemic problems in STEM education:

#### The Teaching Gap: Procedures Over Understanding

Stigler & Hiebert's landmark TIMSS video studies compared US, German, and Japanese math classrooms. The findings were stark:

- **89% of US math lessons** were rated as containing content of "low quality" by independent evaluators
- US teachers focused overwhelmingly on **procedures** ("here's how to solve this") rather than **conceptual understanding** ("here's why this works")
- Japanese teachers spend significantly more class time having students struggle with problems before showing solutions

The core problem: American math instruction prioritizes **getting the right answer quickly** over **understanding why**. Students learn to mimic procedures without building mental models—exactly the pattern we see when they arrive in ASTR 201.

**Citation:** Stigler, J. W., & Hiebert, J. (1999). *The Teaching Gap: Best Ideas from the World's Teachers for Improving Education in the Classroom*. Free Press.

#### Grade Inflation + Achievement Decline

Evidence that the education system is sending false signals:

- **47% of high school students** now graduate with an A average (compared to ~18% in 1998)
- Meanwhile, **ACT scores have declined** to their lowest levels in 30+ years
- The disconnect: students receive signals that they're excelling while actually being less prepared

When our students say "I tried studying like I did in high school and it didn't work," they're experiencing this gap. They earned A's with surface-level strategies, then hit a wall when those strategies fail.

**Citation:** Rosinger, K. O., & Ford, K. S. (2019). Pell grant versus income data in postsecondary research. *Educational Researcher*, 48(5), 309-315. [Note: See also ACT annual reports and grade inflation studies by Rojstaczer & Healy, 2012]

#### The College Readiness Crisis

- Approximately **one-third of college freshmen** arrive unprepared for college-level mathematics
- Even Harvard created "Math Ma" (a pre-calculus bridge course) because students with "good" high school records couldn't handle standard coursework
- The problem isn't that students are less capable—it's that they've been trained in **procedural mimicry** rather than mathematical reasoning

**Citation:** Chen, X. (2016). *Remedial coursetaking at U.S. public 2- and 4-year institutions: Scope, experiences, and outcomes* (NCES 2016-405). National Center for Education Statistics.

#### "Mile Wide, Inch Deep" Curriculum

US math curricula cover far more topics than high-performing countries but with less depth. The result:

- Surface-level familiarity with many topics
- No deep understanding of any topic
- Inability to transfer knowledge to new contexts

When students arrive knowing "about" physics but unable to *reason* with physics, this is the root cause.

**Citation:** Schmidt, W. H., McKnight, C. C., & Raizen, S. A. (1997). *A Splintered Vision: An Investigation of U.S. Science and Mathematics Education*. Kluwer Academic Publishers.

#### Learned Helplessness: Yes, It's Real

Carol Dweck's research provides strong evidence for the mechanism underlying math avoidance:

**The pattern:** When students encounter difficulty and attribute it to **lack of ability** ("I'm just not a math person") rather than **lack of strategy or effort**, they:
1. Stop trying
2. Avoid challenges
3. Perform worse even on tasks they could previously do

**How schools create it:**
- Emphasis on correct answers over process
- Timed tests and speed-based assessment (reinforces that math ability = speed)
- Lack of productive struggle (when teachers immediately rescue struggling students, students learn they can't figure things out themselves)
- Fixed mindset messaging (subtle cues that mathematical ability is innate)

Math anxiety affects **working memory**—anxious students literally have less cognitive capacity available for problem-solving. The anxiety is often **learned** through negative experiences, not inherent.

**Citations:**
- Dweck, C. S. (2006). *Mindset: The New Psychology of Success*. Random House.
- Beilock, S. L. (2010). *Choke: What the Secrets of the Brain Reveal About Getting It Right When You Have To*. Free Press.

#### Implications for This Grant

These findings explain why simply "teaching the material well" is insufficient. Students arrive with:

| Deficit | Root Cause | Required Intervention |
|---------|------------|----------------------|
| Procedural without conceptual | Years of procedure-focused instruction | Build mental models through simulation |
| False confidence from grades | Grade inflation masked gaps | Low-stakes exploration reveals actual understanding |
| Math avoidance as coping | Learned helplessness from repeated failure | Productive failure in safe environment |
| Inability to transfer | "Mile wide, inch deep" coverage | Deep engagement with fewer concepts |

**The intervention must address all four.** Demos alone aren't enough—the pedagogical framework (Grounded Cognition + Productive Failure + Self-Efficacy) specifically targets each deficit.

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

# PART II: THE RESEARCH DESIGN

---

## Theoretical Framework

### Why Theory Matters

NSF reviewers ask: **"What's your theory of change?"** — meaning, *why* do you think this intervention will work?

Without a clear theoretical framework, a proposal looks like "we believe demos are good, so let's use demos." Theory serves three purposes:

1. **Guides research questions** — what to measure, what mechanisms to look for
2. **Explains design choices** — why prediction mode? why Equation Maps? why low-stakes exploration?
3. **Makes findings generalizable** — if the theory is right, the approach should work in other contexts

We adopt a **three-layer theoretical model**:

| Layer | Framework | Role | What It Explains |
|-------|-----------|------|------------------|
| **Foundation** | Grounded Cognition | The substrate | Why equations + visualization together create meaning |
| **Mechanism** | Productive Failure | The learning driver | Why predictions + feedback produce deep learning |
| **Pathway** | Self-Efficacy | The affective channel | Why low-stakes exploration reduces anxiety and builds persistence |

**Critical design principle:** Equations are presented WITH the demos from the start — not introduced afterward. Students see the equation while they explore, creating real-time perceptual-symbolic binding.

---

### Foundational Framework: Grounded Cognition

**Source:** Barsalou, L. W. (2008); Goldstone & Son (2005); Nathan (2012)

**The Core Idea:** Abstract concepts are understood through perceptual and motor simulations. We don't understand "gravity" as a symbol — we understand it through felt experiences of falling, pulling, weight. Learning is better when abstract ideas are *grounded* in perceptual experience.

**Why This Is Foundational (Not Supporting):**

In our design, equations are **visible during exploration**, not revealed afterward. This means grounded cognition isn't just "helpful" — it's the *mechanism* by which equations become meaningful:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULTANEOUS GROUNDING                        │
│                                                                  │
│   EQUATION PANEL              VISUALIZATION                     │
│   ┌──────────────┐            ┌──────────────┐                 │
│   │ P ∝ M²/R⁴   │ ←──────→  │ [Star cross- │                 │
│   │     ↑        │            │  section     │                 │
│   │  highlights  │            │  shows P     │                 │
│   │  as M       │            │  exploding]  │                 │
│   │  changes    │            │              │                 │
│   └──────────────┘            └──────────────┘                 │
│                                                                  │
│   Student manipulates slider → BOTH update simultaneously       │
│   = Perceptual-symbolic binding in real-time                    │
└─────────────────────────────────────────────────────────────────┘
```

**The Mechanism:**
1. Equation is visible from the start (not hidden, not "earned")
2. Student manipulates a parameter via slider
3. Visualization changes AND equation terms highlight simultaneously
4. The symbol becomes a *label* for a perceptual experience
5. Repeated across many parameters → robust mental model of the equation

**How It Applies to Our Demos:**

| Demo Feature | Grounded Cognition Mechanism |
|--------------|------------------------------|
| **Equation always visible** | No "symbol shock" — equation is normalized from start |
| **Term-by-term highlighting** | Direct perceptual link between symbol and effect |
| **Parameter sliders** | Embodied interaction → feeling how quantities relate |
| **Side-by-side equation + viz** | Continuous binding, not sequential |

**Key Insight:** Students who "see" what $P \propto M^2/R^4$ does while manipulating it don't just *learn* the equation — they develop an intuition that makes the equation *preferable* to words. The equation becomes a concise summary of something they now understand deeply.

**Key Citations:**
- Barsalou, L. W. (2008). Grounded cognition. *Annual Review of Psychology*, 59, 617-645.
- Goldstone, R. L., & Son, J. Y. (2005). The transfer of scientific principles using concrete and idealized simulations. *Journal of the Learning Sciences*, 14(1), 69-110.
- Nathan, M. J. (2012). Rethinking formalisms in formal education. *Educational Psychologist*, 47(2), 125-148.
- Glenberg, A. M., & Kaschak, M. P. (2002). Grounding language in action. *Psychonomic Bulletin & Review*, 9(3), 558-565.

**Strengths:**
- Explains why equations WITH visualization beats visualization THEN equation
- Strong cognitive science foundation
- Predicts that equation fluency requires perceptual grounding, not just practice

---

### Learning Mechanism: Productive Failure

**Source:** Kapur, M. (2008, 2014, 2016)

**The Core Idea:** Learning is deeper when students first *struggle* with a problem before receiving instruction. The struggle activates prior knowledge, reveals gaps, and creates a "need to know" that makes subsequent instruction meaningful.

**The Mechanism:**
1. Students attempt a task they can't fully solve
2. They generate multiple (often incorrect) representations and predictions
3. The gap between expectation and reality creates cognitive dissonance
4. Instruction/feedback follows, which now "sticks" because students know *why* they need it
5. Consolidation activities (writing, explanation) solidify understanding

**How It Applies to Our Demos:**

| Demo Feature | Productive Failure Mechanism |
|--------------|------------------------------|
| **Prediction Mode** | Students commit to a prediction before seeing the result → generation of (often incorrect) expectations |
| **Simulation Run** | Immediate feedback reveals discrepancy → productive failure moment |
| **"Explain the discrepancy"** | Consolidation phase → making sense of why prediction was wrong |
| **Equation Maps** | Structured consolidation → connecting perceptual experience to symbolic representation |

**Key Predictions (Testable):**
- Students who make more *wrong* predictions (and resolve them) should show greater learning gains
- The predict → observe → explain cycle should produce better retention than observe-only
- Struggling with a demo before Equation Maps should produce better maps than Equation Maps alone

**Key Citations:**
- Kapur, M. (2008). Productive failure. *Cognition and Instruction*, 26(3), 379-424.
- Kapur, M. (2014). Productive failure in learning math. *Cognitive Science*, 38(5), 1008-1022.
- Kapur, M. (2016). Examining productive failure, productive success, and restudying. *Learning and Instruction*, 43, 79-88.
- Kapur, M., & Bielaczyc, K. (2012). Designing for productive failure. *Journal of the Learning Sciences*, 21(1), 45-83.

**Strengths:**
- Well-validated in math and science education
- Clear predictions that guide measurement
- Aligns perfectly with our predict-explore-explain cycle
- Explains *why* active exploration beats passive observation

**Limitations:**
- Doesn't directly address math anxiety (cognitive, not affective)
- Requires careful scaffolding — too much failure can be demotivating

---

### Affective Pathway: Self-Efficacy Theory

**Source:** Bandura, A. (1977, 1997)

**The Core Idea:** People's beliefs about their ability to succeed (self-efficacy) determine whether they persist or give up. Self-efficacy is built through four sources:

1. **Mastery experiences** — successfully accomplishing tasks
2. **Vicarious experience** — seeing similar others succeed
3. **Verbal persuasion** — encouragement from credible sources
4. **Physiological states** — interpreting anxiety as excitement vs. threat

**The Vicious Cycle of Math Anxiety:**
```
Low self-efficacy → Avoidance → Less practice → Lower performance → Confirms low self-efficacy
```

**How It Applies to Our Demos:**

| Demo Feature | Self-Efficacy Mechanism |
|--------------|------------------------|
| **Low-stakes exploration** | Removes performance pressure → reduces anxiety → enables engagement |
| **Successful predictions** | Mastery experiences → builds confidence ("I can figure this out") |
| **Incremental complexity** | Scaffolded success → prevents overwhelming failure |
| **Peer discussion** | Vicarious experience → "If they got it, maybe I can too" |

**Key Predictions (Testable):**
- Math anxiety (MARS-R) should decrease after demo-based learning
- Self-efficacy for physics/math should increase
- Students with high initial anxiety should show disproportionate benefit (ceiling effect for low-anxiety students)
- Low-stakes exploration should produce better outcomes than high-stakes (graded) exploration

**Key Citations:**
- Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191-215.
- Bandura, A. (1997). *Self-efficacy: The exercise of control*. Freeman.
- Pajares, F. (1996). Self-efficacy beliefs in academic settings. *Review of Educational Research*, 66(4), 543-578.
- Usher, E. L., & Pajares, F. (2008). Sources of self-efficacy in school: Critical review of the literature and future directions. *Review of Educational Research*, 78(4), 751-796.

**Strengths:**
- Directly addresses math anxiety (our stated concern)
- Well-validated with existing measurement scales
- Explains the *affective* outcomes, not just cognitive
- Connects to equity goals (anxiety disproportionately affects underrepresented students)

**Limitations:**
- Doesn't explain the cognitive mechanisms of learning
- Confidence ≠ competence (need to measure both)

---

### Integrated Theory of Change

**The Story We Tell Reviewers:**

> **Grounded cognition** provides the foundation: equations are visible alongside visualizations from the start, creating real-time perceptual-symbolic binding. Students don't learn equations as abstract symbol strings — they experience what equations *mean* through simultaneous manipulation and observation.
>
> **Productive failure** drives deep learning: students commit to predictions before running simulations. When predictions fail, the cognitive dissonance creates a "need to know" that makes the subsequent exploration meaningful. The equation, already grounded, becomes the tool for understanding why the prediction failed.
>
> **Self-efficacy** sustains engagement: low-stakes exploration builds confidence through repeated small successes. Students who feared equations discover they can *reason* about them, breaking the math anxiety cycle.
>
> The ultimate goal: **students come to prefer equations over words** as concise, powerful summaries of physical understanding. Astronomy becomes a modeling discipline, not a memorization exercise.

**Visual: Theory of Change Logic Model**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LEARNING GLASS: THEORETICAL FOUNDATION               │
│    (Mini-lectures introduce equations in context BEFORE demos)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTERVENTION                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Equation +  │→ │  Prediction  │→ │  Simulation  │→ │   Equation   ││
│  │  Viz visible │  │    Mode      │  │     Run      │  │     Maps     ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌─────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐
│   GROUNDED      │  │    PRODUCTIVE           │  │  SELF-EFFICACY  │
│   COGNITION     │  │    FAILURE              │  │                 │
│  (FOUNDATION)   │  │   (MECHANISM)           │  │   (PATHWAY)     │
│                 │  │                         │  │                 │
│ Equation +      │  │ Predictions fail →      │  │ Low-stakes      │
│ visualization   │  │ cognitive dissonance →  │  │ mastery →       │
│ simultaneous →  │  │ "need to know" →        │  │ confidence →    │
│ perceptual-     │  │ deeper engagement       │  │ persistence     │
│ symbolic        │  │ with grounded           │  │ through         │
│ binding         │  │ equations               │  │ equation work   │
└─────────────────┘  └─────────────────────────┘  └─────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            OUTCOMES                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ Equation       │  │ Quantitative   │  │ Reduced Math   │            │
│  │ Fluency        │  │ Reasoning      │  │ Anxiety        │            │
│  │ (Astro-EFI)    │  │ (PIQL)         │  │ (MARS-R)       │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ Physical       │  │ Confidence in  │  │ EQUATION       │            │
│  │ Intuition      │  │ Quant.         │  │ PREFERENCE     │ ← GOAL!   │
│  │ Growth         │  │ Reasoning      │  │ (over words)   │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                              │                                          │
│                              ▼                                          │
│                   ┌──────────────────┐                                  │
│                   │ STEM Persistence │                                  │
│                   │ • Upper-div success                                 │
│                   │ • Modeling mindset                                  │
│                   │ • Research readiness                                │
│                   └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Scope Strategy: Curriculum vs. Research

### The Challenge

We need **all three demo suites** (Stellar Structure, Galaxies, Cosmology) for the full ASTR 201 course redesign. But NSF reviewers may see three suites as overambitious for rigorous research.

### Key Insight: It's the Process, Not the Suites

The "treatment" isn't "Stellar Structure demos" vs. "Galaxies demos" — it's **demo-based pedagogy with equation grounding** as a whole-course intervention. The three suites are content vehicles, but the pedagogy is consistent throughout.

**This matters because:**
- Learning accumulates over the semester — "aha" moments may come mid-semester
- The pedagogical approach (predict-explore-explain, equations visible) is the intervention
- Transfer across suites tests whether equation fluency generalizes

---

### The Two-Contribution Model

| Contribution Type | Scope | Rigor Level | Deliverable |
|-------------------|-------|-------------|-------------|
| **Curriculum** | All 3 suites (25 demos) | Implementation quality | Open-source materials |
| **Research** | Whole-course intervention with module checkpoints | Publication quality | Learning trajectories + validated instrument |

**The pitch to reviewers:**

> "We contribute both *materials* (comprehensive demo suites for ASTR 201) and *knowledge* (rigorous study of how equation fluency develops over a semester). The curriculum provides the intervention; the research examines the trajectory of learning."

---

### Research Design: Whole-Course with Module Checkpoints

**The intervention is the entire semester.** We measure at multiple points to track learning trajectories, not just pre/post gains.

| Timepoint | When | Instruments | What It Captures |
|-----------|------|-------------|------------------|
| **Baseline (Pre)** | Week 1 | PIQL, MARS-R, Astro-EFI pilot, confidence survey | Starting point |
| **Checkpoint 1** | After Suite 1 (~Wk 5) | Mini-Astro-EFI (5-8 items), confidence, module reflection | Early grounding effects |
| **Checkpoint 2** | After Suite 2 (~Wk 10) | Mini-Astro-EFI, confidence, module reflection | Accumulation, pattern recognition |
| **Final (Post)** | After Suite 3 (~Wk 15) | Full battery: PIQL, MARS-R, Astro-EFI, equation preference, physical intuition | Final outcomes |
| **Longitudinal** | Subsequent courses | Upper-div grades, persistence | Transfer and retention |

**What checkpoints tell us:**
- **Learning curve shape:** Linear improvement? Sudden "click"? Plateau then breakthrough?
- **Suite differences:** Does equation fluency transfer across physics contexts?
- **Confidence trajectory:** Does self-efficacy build gradually or spike?
- **Dose-response:** Do more engaged students show steeper curves?

---

### Module Checkpoint Assessments

Each checkpoint (after completing a demo suite) includes:

#### 1. Mini Astro-EFI (5-8 items)
Quick assessment of equation fluency on that module's content:
- 2 Behavioral Prediction items
- 2 Dominant Term items
- 1-2 Misapplication Diagnosis items
- 1-2 Transfer items

#### 2. Confidence & Growth Survey (3-5 min)
```
On a scale of 1-5:
- How confident are you in your ability to predict what an equation will do?
- How confident are you in your physical intuition about [topic]?
- When explaining a concept, do you prefer to use equations or words?
  [ ] Strongly prefer words
  [ ] Somewhat prefer words
  [ ] No preference
  [ ] Somewhat prefer equations
  [ ] Strongly prefer equations
- Compared to the start of the course, my comfort with equations has:
  [ ] Decreased significantly
  [ ] Decreased somewhat
  [ ] Stayed the same
  [ ] Increased somewhat
  [ ] Increased significantly
```

#### 3. Module Reflection (brief open-ended)
- "What equation from this unit do you feel you understand most deeply? Why?"
- "Describe a moment when an equation 'clicked' for you."

---

### The Research Question (Refined)

> "How does equation fluency develop over a semester of demo-based instruction? What is the trajectory of learning, and what predicts faster/deeper development?"

**Sub-questions:**
1. Does equation preference shift from words → equations over the semester?
2. Does physical intuition grow alongside equation fluency, or separately?
3. At what point do students show confident equation use (if ever)?
4. Do patterns generalize across content areas (stellar → galaxies → cosmology)?

---

### Timeline Integration

| Year | Development | Research Focus |
|------|-------------|----------------|
| **Year 1** | All 3 suites (demos + Learning Glass) | Pilot checkpoints, calibrate instruments, qualitative exploration |
| **Year 2** | Refinement based on Year 1 | Full data collection, trajectory analysis |
| **Year 3** | Finalize materials for dissemination | Longitudinal tracking, validation study, publication |

**Note:** Demo development is rapid (AI-assisted). The research timeline is what paces the grant.

---

## Comparison Group Design

### The Ethical Dilemma

> "Is it ethical to have 'control' sections with traditional instruction if we believe demos are better?"

This is a real concern in education research. Pure randomized controlled trials (RCT) can be ethically problematic when we have reason to believe the intervention helps.

### Options for Comparison

#### Option 1: Historical Comparison (Weakest, but Ethical)
Compare demo cohorts to previous years taught traditionally.

| Year | Condition | N |
|------|-----------|---|
| 2024-2025 | Traditional (historical) | ~40-50 |
| 2026-2027 | Demo-based | ~40-50 |

**Limitations:** Confounded by time, instructor changes, student population shifts.

**When to use:** If no other option is feasible; acknowledge limitations explicitly.

---

#### Option 2: Waitlist/Delayed Implementation (Moderate)
If you teach multiple sections, implement demos in one section first.

| Semester | Section A | Section B |
|----------|-----------|-----------|
| Fall 2026 | Demos | Traditional |
| Spring 2027 | Demos | Demos (delayed) |

**Limitations:** Spillover effects if students talk; instructor effects if different instructors.

**When to use:** When you have multiple concurrent sections.

---

#### Option 3: Dose-Response (Recommended)
All students get demos, but you measure *engagement level* and correlate with outcomes.

| Variable | Measure |
|----------|---------|
| Demo engagement | Autolog data: time, explorations, predictions made |
| Equation Map quality | Scored rubric |
| Prediction accuracy | Embedded assessment |
| Outcome | PIQL, Astro-EFI, MARS-R |

**Analysis:** Do students who engage more deeply with demos show greater gains?

**Strengths:**
- Ethical (everyone gets intervention)
- Tests mechanism (engagement → learning)
- Uses rich autolog data you're already collecting

**Limitations:** Correlation ≠ causation; highly engaged students may differ in other ways.

---

#### Option 4: Component Analysis (Also Recommended)
Compare different "versions" of the intervention.

| Condition | Demos | Prediction Mode | Equation Maps |
|-----------|-------|-----------------|---------------|
| Full | ✓ | ✓ | ✓ |
| Demos Only | ✓ | ✗ | ✗ |
| Demos + Prediction | ✓ | ✓ | ✗ |

**Analysis:** Which components matter? Does prediction mode add value beyond demos alone?

**Strengths:**
- Tests theoretical mechanisms
- Ethical (everyone gets some intervention)
- High scientific value

**Limitations:** Requires larger N to detect component effects; complex implementation.

---

### Recommended Approach

**Primary:** Dose-response design using autolog data
**Secondary:** Component analysis if N allows (compare cohorts/years with different features)
**Supplementary:** Historical comparison to establish baseline

**The pitch to reviewers:**

> "We employ a dose-response design that correlates engagement depth (measured via demo autologs) with learning outcomes. This approach is ethical (all students receive the intervention), leverages the rich data our platform collects, and tests the theoretical mechanism: that deeper engagement with predictions and exploration produces greater equation fluency gains."

---

## The Demo Suites

### Overview

Three comprehensive demo suites, each containing 8-9 interconnected demos that build toward a capstone synthesis experience.

| Suite | Focus | Key Equations | Demos |
|-------|-------|---------------|-------|
| **Stellar Structure** | How stars work; equilibrium, energy, transport | HSE, mass continuity, energy generation, opacity | 8 demos |
| **Galaxies** | From light to mass; dark matter inference | Rotation curves, M/L ratios, virial theorem | 8 demos |
| **Cosmology** | The expanding universe; multi-probe inference | Friedmann equation, distance measures, BAO | 9 demos |

---

### Learning Glass Lectures: Theory Before Exploration

**Critical Clarification:** Demos do NOT replace traditional instruction. They AUGMENT it.

Students still need:
- Full theoretical background (derivations, context, physical meaning)
- Traditional homework with problem solving and algebraic manipulation
- Practice with calculation to prepare for upper-division courses

**The Complete Pedagogical Cycle:**

```
┌─────────────────────────────────────────────────────────────────┐
│ BEFORE CLASS: Learning Glass Lecture (~15 min)                  │
│   - Full theory: derivations, physical meaning, context         │
│   - Equations introduced with explanation of each term          │
│   - "Here's where this equation comes from and what it means"   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ IN CLASS: Demo Exploration + Discussion                         │
│   - Ground the equations from the lecture                       │
│   - Predict-explore-explain cycle                               │
│   - Peer discussion, Equation Maps                              │
│   - Connect visual intuition to mathematical formalism          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ HOMEWORK: Traditional Problem Sets                              │
│   - Algebraic manipulation practice                             │
│   - Quantitative calculation problems                           │
│   - Problem-solving skill development                           │
│   - Derivation practice where appropriate                       │
│   - Prepares students for upper-div mathematical rigor          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SYNTHESIS: Memos (3 per semester)                               │
│   - Integration of theory + exploration + calculation           │
│   - Demonstrate equation ownership in writing                   │
└─────────────────────────────────────────────────────────────────┘
```

**The Key Insight:** Demos don't replace math practice — they make the math *meaningful*. When students do algebraic manipulation in homework, they understand what they're manipulating. The grounding makes the practice stick.

---

### Learning Glass Lecture Structure (~15 min each, before each class)

Each class session is preceded by a Learning Glass video (flipped classroom model).

**Video Structure:**

| Component | Duration | Purpose |
|-----------|----------|---------|
| **Motivation** | 2-3 min | Why does this matter? What problem are we solving? |
| **Physical Setup** | 2-3 min | The system, assumptions, what we're modeling |
| **Derivation/Equation** | 5-7 min | Where the equation comes from, term-by-term explanation |
| **Limiting Cases** | 2-3 min | What happens when X >> Y? When does this break down? |
| **Preview of Exploration** | 1-2 min | "In class, you'll test these predictions in the demo..." |

**Why ~15 min:**
- Long enough for real content (not superficial)
- Short enough to maintain attention
- Students can rewatch difficult parts
- Frees class time for active learning

---

### Learning Glass Topics by Class Session

#### Suite 1: Stellar Structure (~10 class sessions)

| Class | Learning Glass Topic | Key Content | Demo |
|-------|---------------------|-------------|------|
| 1 | Why Stars Don't Collapse | Gravity vs. pressure, timescales | EOS Explorer |
| 2 | The Ideal Gas in Stars | P = ρkT/μmH, mean molecular weight | EOS Explorer |
| 3 | Hydrostatic Equilibrium I | Derivation of HSE, physical meaning | HSE |
| 4 | Hydrostatic Equilibrium II | Central pressure scaling, mass-radius | HSE |
| 5 | Stellar Timescales | τ_KH, τ_nuc, τ_dyn derivations | Timescales |
| 6 | Polytropic Models | Lane-Emden, why polytropes work | Polytrope Lab |
| 7 | Nuclear Energy Generation | pp-chain, CNO, ε(ρ,T) | Nuclear Furnace |
| 8 | Opacity and Radiative Transfer | Kramers, electron scattering | Opacity |
| 9 | Convection vs. Radiation | Schwarzschild criterion, ∇_ad, ∇_rad | Energy Transport |
| 10 | Putting It Together | Full stellar structure, HR diagram | Build-a-Star |

#### Suite 2: Galaxies (~10 class sessions)

| Class | Learning Glass Topic | Key Content | Demo |
|-------|---------------------|-------------|------|
| 11 | Galaxy Morphology | Hubble sequence, components | Galaxy Anatomy |
| 12 | Surface Brightness Profiles | Sérsic, exponential disk, derivation | Galaxy Anatomy |
| 13 | From Light to Mass | M/L ratios, stellar populations | Light to Mass |
| 14 | Rotation Curves I | v_c = √(GM/r), enclosed mass | Rotation Curves |
| 15 | Rotation Curves II | Dark matter inference, NFW profiles | Rotation Curves |
| 16 | Velocity Dispersion & Virial | Virial theorem derivation, σ vs. M | Velocity Dispersion |
| 17 | Gas and Star Formation | Kennicutt-Schmidt, depletion times | Baryon Cycle |
| 18 | Feedback Processes | SNe energy injection, AGN feedback | Feedback |
| 19 | Galaxy Interactions | Dynamical friction, merger timescales | Mergers |
| 20 | Scaling Relations | Tully-Fisher, Faber-Jackson, FP | Scaling Relations |

#### Suite 3: Cosmology (~10 class sessions)

| Class | Learning Glass Topic | Key Content | Demo |
|-------|---------------------|-------------|------|
| 21 | The Expanding Universe | Hubble's law, scale factor a(t) | Scale Factor |
| 22 | Redshift | Cosmological vs. Doppler, 1+z = 1/a | Redshift |
| 23 | Distance Measures | D_L, D_A, D_C derivations | Distances |
| 24 | Friedmann Equation I | Derivation from Newtonian analogy | Friedmann |
| 25 | Friedmann Equation II | Components, Ω parameters, solutions | Friedmann |
| 26 | Thermal History | T ∝ 1/a, radiation-matter equality | Thermal History |
| 27 | Recombination & CMB | Saha equation, last scattering | Recombination |
| 28 | BAO as Standard Ruler | Sound horizon, r_s derivation | BAO |
| 29 | Structure Formation | Linear perturbation theory, σ_8 | Structure Growth |
| 30 | Multi-Probe Cosmology | χ² fitting, breaking degeneracies | Probes Lab |

---

### Homework: Traditional Problem Solving Still Essential

**Demos ground understanding. Homework builds fluency.**

Students still need to:
1. **Manipulate equations algebraically** — solve for different variables, combine equations
2. **Do calculations** — plug in numbers, get answers, check units
3. **Work through derivations** — reproduce key results, extend to new cases
4. **Solve novel problems** — apply equations to situations not covered in demos

**Sample HW Problem Types:**

| Type | Example | Purpose |
|------|---------|---------|
| **Calculation** | "Calculate the central pressure of a 2 M☉ star with R = 1.5 R☉" | Practice with numbers, units |
| **Algebraic manipulation** | "Starting from HSE, derive the scaling P_c ∝ M²/R⁴" | Equation fluency |
| **Limiting cases** | "Show that for n=3 polytrope, M ∝ R⁰ (mass independent of radius)" | Physical insight |
| **Application** | "A white dwarf has M = 0.6 M☉, R = 0.01 R☉. Is it supported by ideal gas or degeneracy pressure?" | Transfer |
| **Estimation** | "Estimate the Kelvin-Helmholtz timescale for the Sun. How does this compare to its age?" | Order-of-magnitude reasoning |

**The Goal:** By doing both demos AND traditional homework:
- Students understand what equations mean (from demos)
- Students can manipulate equations fluently (from homework)
- Students are prepared for upper-division courses that assume mathematical comfort

---

### Matt Anderson's Learning Glass Format

**Technical setup:**
- Transparent glass board, instructor writes while explaining
- Camera captures instructor's face AND writing simultaneously
- Equations appear as natural part of explanation (not slides)
- Feels like one-on-one tutoring, not lecture

**Pedagogical advantages:**
- Students see the *process* of writing/thinking, not just final equations
- Instructor can point to specific terms while explaining
- More personal than traditional lecture capture
- Rewindable — students can replay difficult derivations

**Integration with demos:**
- Each video ends with prediction questions for the upcoming demo
- Students watch video → come to class with framework → explore in demo
- Demo autologs can track whether students watched the video (engagement metric)

---

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
| **PIQL** (Physics Inventory of Quantitative Literacy) | Proportional reasoning, covariation | Pre/post/checkpoints | Validated ✓ |
| **QuaRCS** (attitudes subscale) | Quantitative attitudes, self-efficacy | Pre/post | Validated ✓ |
| **MARS-R** (Math Anxiety Rating Scale) | Math anxiety levels | Pre/post | Validated ✓ |
| **Astro-EFI** (to be developed) | Equation fluency: prediction, dominant terms, diagnosis, transfer | Pre/post/checkpoints | To develop |
| **Embedded Prediction Tasks** | Prediction accuracy, confidence calibration | Continuous | Built into demos |
| **Exploration Analytics** | Engagement patterns, systematic reasoning | Continuous | Built into demos |
| **Confidence & Growth Survey** | Confidence in quant. reasoning, physical intuition | Pre/post/checkpoints | Custom |
| **Equation Preference Scale** | Preference for equations vs. words as explanatory tools | Pre/post | Custom |
| **Physical Intuition Assessment** | Ability to predict physical outcomes without calculation | Pre/post | Custom |
| **Transfer Tasks** | Application to novel problems | End of course | Custom |
| **Upper-Div Performance** | Grades in 301/302/303 | Longitudinal | Institutional data |

*See [Measuring Equation Fluency](#measuring-equation-fluency-the-assessment-strategy) for detailed instrument strategy.*

---

### New Assessments: Confidence, Intuition, and Equation Preference

#### The Ultimate Goal

> **By the end of the semester, students should prefer equations over words** as concise summaries of physical understanding. They should see astrophysics as a modeling discipline grounded in equations — not an Astro 101 textbook of facts to memorize.

This is a measurable shift in attitude, not just skill.

---

#### Equation Preference Scale (Pre/Post)

**Purpose:** Measure whether students' attitudes toward equations shift from "barrier" to "tool."

**Sample items (5-point Likert scale: Strongly Disagree → Strongly Agree):**

1. When explaining a physics concept, I prefer to use words rather than equations.
2. Equations feel like obstacles that get in the way of my understanding.
3. I find equations to be elegant, concise summaries of physical relationships.
4. If I had to teach someone about stellar structure, I would rely mostly on words and diagrams, not equations.
5. When I see an equation, I can usually picture what it means physically.
6. I trust an explanation more when it includes supporting equations.
7. Given the choice, I would rather reason through a problem with equations than with verbal descriptions.

**Scoring:** Items 1, 2, 4 are reverse-scored. Higher scores = greater equation preference.

**Hypothesis:** Post-course scores should be significantly higher than pre-course scores, indicating a shift toward equation preference.

---

#### Confidence in Quantitative Reasoning (Checkpoints)

**Purpose:** Track confidence growth over the semester. Part of module checkpoint surveys.

**Items:**

1. **General confidence:** "How confident are you in your ability to reason quantitatively about physical systems?" (1-5)

2. **Prediction confidence:** "How confident are you that you can predict what an equation will do before calculating?" (1-5)

3. **Physical intuition:** "How confident are you in your physical intuition about [MODULE TOPIC]?" (1-5)

4. **Growth perception:** "Compared to the start of the course, my comfort with equations has: Decreased significantly / Decreased somewhat / Stayed the same / Increased somewhat / Increased significantly"

---

#### Physical Intuition Assessment (Pre/Post)

**Purpose:** Measure whether students can make correct physical predictions WITHOUT explicit calculation.

**Format:** Short scenarios where students predict outcomes based on physical reasoning.

**Example items:**

1. **Stellar Structure:**
   > A star contracts slightly while maintaining the same mass. Without calculating, predict what happens to its central pressure: Increases / Decreases / Stays the same. *Briefly explain your reasoning.*

2. **Galaxies:**
   > You observe two galaxies with identical luminosities, but Galaxy A has a rotation curve that rises steeply and Galaxy B has one that rises slowly. Which galaxy likely has more mass concentrated in its center? *Explain.*

3. **Cosmology:**
   > If the universe had more matter density, would the age of the universe (time since Big Bang) be older or younger than our current estimate? *Explain without using equations.*

**Scoring:** Credit for correct answer + physically sound reasoning. Captures intuition independent of calculation skill.

---

#### Module Reflection Questions (Qualitative)

At each checkpoint, open-ended questions to capture qualitative shifts:

1. "What equation from this unit do you feel you understand most deeply? Why?"
2. "Describe a moment when something 'clicked' for you this unit."
3. "If you had to explain [key concept] to a friend, would you use an equation? Why or why not?"
4. "Has your relationship with equations changed since the start of the semester? How?"

**Analysis:** Qualitative coding for themes of equation ownership, confidence, and modeling mindset.

---

## Rethinking Assessment: What We Actually Care About

### The Honest Goal

Let's be direct about what success looks like for ASTR 201.

**Most students will not become astrophysicists.** Of the 25-30 students per year, maybe 2-3 will pursue graduate school in astronomy. The rest will become engineers, teachers, data scientists, or professionals in unrelated fields.

**So what's the real win?**

| What We Don't Need | What We Actually Need |
|--------------------|----------------------|
| Students become experts in stellar structure | Students lose their fear of equations |
| Perfect scores on concept tests | Confidence that they *can* reason quantitatively |
| Mastery of every derivation | Willingness to engage with mathematical models |
| Flawless problem-solving | Belief that equations are tools, not barriers |

**The transformative outcome isn't expertise. It's attitude.**

If students leave ASTR 201:
- Believing they can figure out what an equation means
- Willing to engage with quantitative problems rather than avoiding them
- Seeing equations as concise summaries rather than incomprehensible symbols
- Confident enough to take another math-heavy course

...then we've succeeded, even if they can't reproduce the Lane-Emden equation from memory.

---

### Why Existing Instruments Don't Fit

#### The Problem with Astronomy Diagnostic Tests

The most commonly used astronomy assessments (ADT, LSCI, TOAST) were designed for **Astro 101**: large lecture courses teaching scientific literacy to non-majors.

| Instrument | Designed For | What It Measures | Fit for ASTR 201? |
|------------|--------------|------------------|-------------------|
| ADT (Astronomy Diagnostic Test) | Astro 101 | Basic astronomical facts, common misconceptions | ❌ Too basic |
| LSCI (Lunar Shapes Concept Inventory) | Astro 101 | Moon phases understanding | ❌ Irrelevant content |
| TOAST (Test of Astronomy Standards) | K-12/Intro | Standards-aligned astronomical knowledge | ❌ Wrong level |

**These instruments test whether students know facts about astronomy.** They don't test whether students can:
- Reason with equations
- Predict physical behavior
- Evaluate model assumptions
- Engage confidently with quantitative problems

Using Astro 101 instruments to assess ASTR 201 learning is like using a spelling test to assess essay writing.

#### The Problem with Physics Concept Inventories

Physics education has better instruments (FCI, BEMA, CSEM), but they share a fundamental limitation: **they measure conceptual understanding as right/wrong answers to multiple-choice questions.**

This approach:
- Rewards test-taking strategies over genuine understanding
- Misses the *process* of reasoning
- Can't capture confidence, willingness, or attitude change
- Treats learning as binary (correct/incorrect) rather than developmental

#### The Problem with "Validated" as a Gold Standard

Education research has developed a culture where "validated instrument" is synonymous with "good measurement." But validation just means the instrument reliably measures *something* — not necessarily the *right* thing.

**An instrument can be perfectly validated and still useless for your research question.**

The existing instruments were validated to answer questions like:
- "Do students have correct Newtonian intuitions?" (FCI)
- "Do students understand basic astronomical phenomena?" (ADT)
- "Can students reason proportionally?" (PIQL)

Our question is different:

> **"Do students' attitudes toward equations shift from avoidance to engagement?"**

No existing instrument measures this. Using proxy measures (PIQL scores, concept inventory gains) would be measuring the wrong thing.

---

### Our Assessment Philosophy: Authentic Measurement

**Principle:** Measure what we actually care about, in the context where it actually matters.

Instead of pulling students out of the learning environment to take artificial tests, we embed assessment *in* the learning activities. The demos themselves become assessment instruments.

#### Why Authentic Assessment?

| Traditional Assessment | Authentic Assessment |
|-----------------------|---------------------|
| Separate from learning | Embedded in learning |
| Artificial context (test conditions) | Natural context (demo exploration) |
| Single snapshot (pre/post) | Continuous trajectory |
| Measures recall | Measures reasoning process |
| Student knows they're being tested | Assessment is invisible |
| Rewards test-taking skills | Rewards genuine engagement |

**The key insight:** Our demos already capture rich data on how students think. Every prediction, every slider adjustment, every exploration path is logged. This is *far more informative* than 20 multiple-choice questions administered twice a semester.

---

### The Assessment Strategy: What We'll Actually Do

#### Tier 1: Validated Touchpoints (Required for Reviewers)

We use validated instruments as "touchpoints" for comparison to existing literature.

**The Complete Assessment Schedule:**

| Timepoint | PIQL | MARS-R | AMAS | Eq. Attitude | Confidence | Time |
|-----------|:----:|:------:|:----:|:------------:|:----------:|------|
| **Pre (Week 1)** | ✓ | ✓ | ✓ | ✓ | ✓ | ~40 min |
| **Checkpoint 1 (after Stellar, ~Wk 5)** | — | — | ✓ | ✓ | ✓ | ~10 min |
| **Checkpoint 2 (after Galaxies, ~Wk 10)** | — | — | ✓ | ✓ | ✓ | ~10 min |
| **Post (after Cosmo, ~Wk 15)** | ✓ | ✓ | ✓ | ✓ | ✓ | ~40 min |

---

**PIQL (Physics Inventory of Quantitative Literacy)** — 20 items, ~15 minutes
- Measures proportional reasoning, covariation, ratio reasoning
- Why: The least bad option for quantitative reasoning; measures process not facts
- When: **Pre and Post only**
- Purpose: Establish that our students show comparable gains to other active learning interventions

**MARS-R (Math Anxiety Rating Scale - Revised)** — 24 items, ~10 minutes
- Comprehensive math anxiety measure across multiple dimensions (test anxiety, numerical task anxiety, course anxiety)
- Why: Gold standard for math anxiety; well-validated, widely cited in literature
- When: **Pre and Post only** (too long for repeated administration)
- Purpose: Detailed anxiety profile at endpoints; publishable pre/post comparison

**AMAS (Abbreviated Math Anxiety Scale)** — 9 items, ~3 minutes
- Short-form anxiety measure, validated against full MARS (r > 0.85)
- Why: Short enough to administer repeatedly without survey fatigue
- When: **All four timepoints**
- Purpose: **Track anxiety trajectory** — when does anxiety drop? Gradually? After Suite 1? Plateau then breakthrough?

**Why both MARS-R and AMAS?**
- MARS-R at endpoints gives detailed, publishable pre/post comparison
- AMAS at all timepoints tracks the *evolution* of anxiety across the semester
- Administering both at pre/post validates they correlate in our population
- The trajectory data is the novel contribution — nobody tracks anxiety evolution through a course

**Why PIQL only at endpoints?**
- Quantitative reasoning changes slowly; checkpoint measurement adds noise
- 15 minutes is too long to administer 4 times
- Pre/post is the standard in the literature; more wouldn't add insight

#### Tier 2: Attitude and Confidence Measures (Our Primary Outcomes)

These directly measure what we actually care about:

**Equation Attitude Survey** — Custom, ~10 items, ~5 minutes

| Item | What It Measures |
|------|------------------|
| "When I see an equation, my first instinct is to skip it" | Avoidance |
| "I can usually figure out what an equation means if I think about it" | Confidence |
| "Equations are a barrier to understanding physics" | Attitude |
| "I would rather have things explained in words than equations" | Preference |
| "When I successfully use an equation, I feel accomplished" | Affect |
| "I am capable of reasoning with mathematical relationships" | Self-efficacy |
| "Equations help me understand physics more deeply" | Value |
| "I avoid courses that involve a lot of math" | Behavioral intention |

Administered: Pre, each checkpoint, post
Analysis: Track trajectory, identify when shifts occur

**Physical Intuition Confidence** — 3 items per module

After each demo suite:
1. "How confident are you that you can predict what will happen in a physical system before calculating?" (1-5)
2. "How confident are you in your physical intuition about [stellar structure / galaxies / cosmology]?" (1-5)
3. "Compared to before this unit, my comfort with equations has: decreased / stayed same / increased"

**Why attitudes matter more than test scores:** A student who finishes ASTR 201 with slightly improved PIQL scores but persistent math avoidance will struggle in every subsequent STEM course. A student who finishes with *confidence* will keep engaging, keep learning, keep growing. Attitude predicts trajectory.

#### Tier 3: Authentic Embedded Assessment (Our Richest Data)

**Prediction Accuracy Tracking**

Every demo includes prediction mode. Students must:
1. Commit to a prediction (slider position, qualitative direction, or multiple choice)
2. State confidence (1-5)
3. Observe the result
4. Explain any discrepancy

Data captured automatically via autolog:
- Prediction accuracy over time (learning curve)
- Confidence calibration (do confident predictions become more accurate?)
- Explanation quality (coded from text responses)

**This is the gold standard.** We're measuring whether students can predict physical behavior *in context*, with real equations, during actual learning. No multiple-choice test captures this.

**Exploration Pattern Analytics**

Autologs capture:
- Which parameters students explore first
- How systematically they vary parameters (one-at-a-time vs. random)
- Whether they test limiting cases
- Time spent on equation panel vs. visualization
- Whether they return to equations after exploring

Research question: Do exploration patterns predict attitude change? Do students who engage more systematically show greater confidence gains?

**Equation Map Quality**

Equation Maps require students to explain each term in an equation in their own words.

Rubric-scored on:
- Correctness of term identification
- Physical interpretation (not just restating symbols)
- Connection to demo behavior
- Appropriate use of limiting cases

This measures *depth* of equation understanding, not just whether students can pick the right multiple-choice answer.

**Synthesis Memo Analysis**

Three memos per semester. Qualitative analysis:
- Do students voluntarily use equations when words would suffice?
- How do they talk about equations? (barrier vs. tool language)
- Does equation usage increase over the semester?

#### Tier 4: Downstream Outcomes (Long-Term)

**Course Performance**
- DFW rates compared to historical
- Exam performance on equation-based questions (your exams, your rubric)
- Final grades

**Persistence**
- Enrollment in upper-division courses (ASTR 301, 302, 303)
- Grades in subsequent courses
- Retention in major

**Why not make these primary outcomes?** Grades are confounded (you control the exams). Persistence is slow to measure. But they're valuable supporting evidence.

---

### Why This Approach Is Defensible

Reviewers may ask: "Why aren't you using validated concept inventories as primary outcomes?"

**Our response:**

> "Existing astronomy concept inventories (ADT, LSCI, TOAST) were designed for introductory courses and measure factual knowledge and common misconceptions. They do not assess the quantitative reasoning and attitude change that are the primary outcomes of this intervention.
>
> We use the Physics Inventory of Quantitative Literacy (PIQL) to measure reasoning gains, allowing comparison to the broader physics education literature. For our primary outcomes — attitude change, confidence development, and equation preference shift — we employ authentic embedded assessments that capture learning *in context* rather than through artificial testing situations.
>
> This approach provides ecological validity: we measure whether students can predict physical behavior while actually working with physics models, not whether they can recall correct answers under test conditions. The rich autolog data from demo interactions offers continuous insight into learning trajectories, something no pre/post instrument can provide."

---

### Comparison to Traditional Approach

| Aspect | Traditional Ed Research | Our Approach |
|--------|------------------------|--------------|
| Primary outcome | Concept inventory gains | Attitude/confidence trajectory |
| Data collection | Pre/post testing | Continuous embedded assessment |
| Context | Artificial test conditions | Authentic learning context |
| What's valued | Correctness | Engagement, reasoning process |
| Underlying assumption | Learning = acquiring facts | Learning = changing relationship with material |
| Sample required | Large N for statistical power | Rich data from smaller N |
| Generalizability | High (standardized measure) | Moderate (context-specific) |
| Validity for our question | Low (measures wrong construct) | High (measures what we care about) |

**We're trading some generalizability for validity.** A study that uses the wrong measures to get publishable results helps no one. A study that measures what actually matters — even with non-standard methods — advances understanding.

---

## Technical Details: The Validated Instruments

### PIQL (Physics Inventory of Quantitative Literacy)

**What it is:** A 20-item assessment measuring quantitative reasoning in physics contexts.

**What it measures:**
- **Proportional reasoning:** If X doubles, what happens to Y?
- **Covariation:** How do two quantities change together?
- **Signed quantities:** Reasoning about negative rates, directions
- **Ratio reasoning:** Comparing fractions, rates, slopes

**Sample item:** "A car travels at constant speed. If it goes twice as far, it takes _____ as long."

**Why we use it:** Unlike concept inventories that test physics facts, PIQL tests *reasoning ability*. This is closer to what we care about — it measures whether students can think quantitatively, not whether they know that seasons are caused by axial tilt.

**Limitations:** Still multiple choice. General reasoning, not equation-specific. Doesn't capture attitudes.

**Administration:** ~15-20 minutes. Pre (Week 1), Post (Week 15).

**Citation:** White Brahmia, S., Boudreaux, A., & Kanim, S. E. (2016). Developing Mathematization with Physics Inventory of Quantitative Literacy. *PERC Proceedings*.

### MARS-R (Math Anxiety Rating Scale - Revised)

**What it is:** A 24-item comprehensive assessment of math anxiety, the most widely used and validated instrument in the field.

**What it measures:**
- **Math Test Anxiety:** Anxiety about being evaluated on math
- **Numerical Task Anxiety:** Anxiety about everyday math tasks (calculating tips, checking receipts)
- **Math Course Anxiety:** Anxiety about math classes and instruction

**Sample items:** (Rate your anxiety 1-5 when...)
- "Taking an examination in a math course"
- "Being given a 'pop' quiz in a math class"
- "Buying a math textbook"
- "Listening to a lecture in a math class"

**Why we use it:** The gold standard for math anxiety measurement. Extensively validated across populations. Allows comparison to decades of published research on math anxiety interventions.

**Limitations:** Too long for repeated administration (survey fatigue). That's why we use AMAS for trajectory tracking and MARS-R for detailed endpoints.

**Administration:** ~10 minutes. Pre (Week 1), Post (Week 15) only.

**Citation:** Plake, B. S., & Parker, C. S. (1982). The development and validation of a revised version of the Mathematics Anxiety Rating Scale. *Educational and Psychological Measurement*, 42(2), 551-557.

### AMAS (Abbreviated Math Anxiety Scale)

**What it is:** A 9-item scale measuring math anxiety, validated as a short form of the full MARS.

**What it measures:**
- Anxiety about math tests
- Anxiety about math courses
- Anxiety about everyday numerical tasks

**Sample items:**
- "Thinking about an upcoming math test"
- "Being given a homework assignment of many difficult problems"
- "Watching a teacher work an algebraic equation on the board"

Response scale: 1 (Low anxiety) to 5 (High anxiety)

**Why we use it:** Short enough to administer repeatedly (every checkpoint) without survey fatigue. Validated. Allows trajectory tracking.

**Limitations:** Measures general math anxiety, not equation-specific or physics-specific attitudes.

**Administration:** ~3 minutes. Pre, Checkpoint 1, Checkpoint 2, Post.

**Citation:** Hopko, D. R., Mahadevan, R., Bare, R. L., & Hunt, M. K. (2003). The Abbreviated Math Anxiety Scale (AMAS): Construction, validity, and reliability. *Assessment*, 10(2), 178-182.

---

## Measuring Equation Fluency: The Assessment Strategy

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

**The contribution is attitude-centered:**

Our primary research question isn't "Do students learn more physics?" — it's **"Do students change their relationship with equations?"**

This reframing positions the research differently:

| Traditional Framing | Our Framing |
|--------------------|-------------|
| Measure concept gains with validated instruments | Measure attitude trajectory with authentic assessment |
| Success = higher test scores | Success = reduced fear, increased confidence |
| Primary outcome = learning | Primary outcome = willingness to engage |
| Students as test subjects | Students as developing learners |

**The contribution is three-fold:**

1. **Primary outcomes: Attitude and Confidence Trajectory**
   - Custom Equation Attitude Survey (pre/checkpoint/post)
   - AMAS anxiety tracking across semester
   - Confidence self-reports at each module
   - Behavioral evidence from synthesis memos (do they choose equations?)

2. **Secondary outcomes: Authentic Embedded Assessment**
   - Prediction accuracy trajectory (from autologs)
   - Exploration pattern analytics
   - Equation Map quality over time
   - Explanation depth in discrepancy responses

3. **Touchpoint outcomes: Validated Instruments**
   - PIQL for quantitative reasoning (comparison to literature)
   - AMAS for anxiety (validated trajectory measure)
   - Course grades, DFW rates, persistence (institutional data)

**The framing to reviewers:**

> "This study addresses a gap in astronomy education research: the measurement and development of productive attitudes toward equations. Existing instruments assess factual knowledge or general anxiety; none capture whether students come to see equations as useful tools rather than barriers.
>
> We employ authentic embedded assessment — using the rich data generated during demo exploration — to track attitude trajectories with ecological validity. Validated instruments (PIQL, AMAS) serve as touchpoints connecting our findings to the broader literature, not as primary outcomes.
>
> Our goal is not to produce students who score higher on tests. It is to produce students who are willing to engage with quantitative reasoning — a prerequisite for success in any subsequent STEM course."

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

### For Students: Attitudes First, Expertise Second

The primary outcomes are attitude-based. The secondary outcomes are skill-based.

**Primary Outcomes (What We Actually Care About):**

| Outcome | Metric | Target |
|---------|--------|--------|
| **Reduced equation avoidance** | Equation Attitude Survey | Significant shift toward engagement |
| **Increased confidence** | Confidence items at checkpoints | Positive trajectory across semester |
| **Reduced math anxiety** | AMAS score decrease | >0.5 SD reduction |
| **Shift to equation preference** | "I prefer equations to words" items | Net positive shift |
| **Willingness to engage** | Behavioral: voluntary equation use in memos | Increases over semester |

**Secondary Outcomes (Traditional Metrics):**

| Outcome | Metric | Target |
|---------|--------|--------|
| **Better prediction accuracy** | Embedded prediction tasks (autolog) | Improvement trajectory |
| **Improved quantitative reasoning** | PIQL score | >0.3 normalized gain |
| **Lower DFW rates** | Course grades | Reduction vs. historical |
| **Upper-div persistence** | Enrollment in 301/302/303 | Improved vs. historical |

### The Attitude Shift (Primary Novel Outcome)

**The signature result we're seeking:**

> By semester's end, students believe they *can* engage with equations — even if they still find them challenging. The fear is gone. The avoidance is gone. They're willing to try.

This is measurable via:
1. Equation Attitude Survey trajectory (quantitative, checkpoint-tracked)
2. Module reflections (qualitative shift in language about equations)
3. Synthesis memos (behavioral: do they voluntarily use equations?)
4. Self-reported confidence (do they believe they can figure out what an equation means?)

**Why attitudes matter more than test scores:**

A student who finishes with slightly higher PIQL scores but persistent equation avoidance will struggle in every subsequent STEM course. A student who finishes with *confidence* and *willingness* will keep engaging, keep practicing, keep improving.

Attitudes predict trajectory. Test scores measure a snapshot.

### For the Field

1. **Open-source demo suites** available to any institution
2. **Equation Attitude Survey** (pilot-tested, ready for others to adapt)
3. **Learning Glass video library** for theory introduction
4. **Implementation guides** for instructors adopting demo-based pedagogy
5. **Research publications** on attitude trajectory development
6. **Authentic assessment examples** showing how to measure learning in context

### For SDSU

1. Transformed ASTR 201 with documented learning gains
2. Improved pipeline to upper-division and graduate programs
3. National visibility in astronomy education research
4. Foundation for future education research grants
5. Model for other physics-heavy courses (PHYS 195, etc.)

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

## PI Qualifications: Why a Computational Astrophysicist?

### Background

**Dr. Anna Rosen** is a computational astrophysicist at San Diego State University. Her research involves building and running complex simulations of star formation, radiation hydrodynamics, and stellar feedback — work that requires deep comfort with equations as tools for understanding physical systems.

She is not a STEM education researcher. But that's a feature, not a bug.

---

### Direct Classroom Experience: 3 Years Teaching ASTR 201

Dr. Rosen has taught ASTR 201 for three years, giving her direct, repeated observation of where students struggle.

**The core finding: It's math and problem-solving, not memorization.**

Students don't fail ASTR 201 because they can't remember facts. They struggle because:
- They've never been asked to *reason* with equations
- They don't know how to approach a problem they haven't seen before
- They expect to memorize procedures rather than understand principles
- They've been trained to pattern-match, not think

**Even students who have taken Physics 195 struggle.** The physics prerequisite doesn't solve the problem — students arrive having "done" physics but not having internalized how to *think* with equations.

---

### The Transition Problem: First Small STEM Class

For many students, ASTR 201 is their **first STEM course that isn't 500 students**.

In large intro courses:
- Assessment is often multiple choice
- Problem sets may be routine plug-and-chug
- Studying = memorizing definitions and formulas
- Individual attention is limited

In ASTR 201 (~40 students):
- Problems require genuine reasoning
- Exams ask "derive" and "explain," not just "calculate"
- The instructor notices when you're lost
- Coasting doesn't work

**The result:** Students experience a shock. The study strategies that got them through Astro 101, Physics 195, and high school simply don't work.

---

### What Students Actually Say

Direct quotes from student conversations:

> *"I tried to study like I did in high school and realized it doesn't work here."*

> *"I memorized all the equations but I still couldn't do the problems."*

> *"I don't even know how to start when I see a problem I haven't seen before."*

Students ask for study advice, for help understanding *how* to learn, not just *what* to learn. They recognize the gap — they just don't know how to bridge it.

---

### Why This Background Matters for the Proposal

| PI Characteristic | Why It Helps |
|-------------------|--------------|
| **Computational astrophysicist** | Genuinely loves equations; can model the relationship students should develop |
| **3 years teaching ASTR 201** | Direct observation of where students struggle; knows the problem firsthand |
| **Not an ed researcher** | Brings authentic domain expertise; teaches the actual course; will sustain beyond grant |
| **Can build demos** | Computational skills enable rapid development of scientifically accurate simulations |
| **Sees the math gap clearly** | Knows it's problem-solving, not memorization; intervention is targeted at real issue |

**The key insight:** Students aren't failing because astronomy is hard. They're failing because no one has taught them to *reason with equations*. They've been trained to memorize and reproduce, and that doesn't work in courses that require genuine understanding.

This proposal is designed to fix that — not by lowering standards, but by helping students develop the skills they need to meet them.

---

### What the PI Needs (Addressed Through Collaboration)

| Gap | How Addressed |
|-----|---------------|
| No ed research publication record | Co-PI with STEM education expertise (Matt Anderson) |
| No psychometrics training | PER/AER consultant for instrument validation |
| No literature expertise in PER/AER | Collaborators provide connections and guidance |
| Study design methodology | Co-PI leads research methodology |

**The team model:** Domain expert (PI) + Education researcher (Co-PI) + Assessment expert (Consultant). This is the standard model for Discipline-Based Education Research, and it's stronger than either type of expertise alone.

---

## Potential Collaborators

### Confirmed / Strong Interest

| Role | Collaborator | Contribution | Status |
|------|--------------|--------------|--------|
| **Co-PI: STEM Education** | Dr. Matt Anderson (SDSU CRMSE) | Learning Glass videos, assessment design, education research methodology | ⏳ In discussion |

### Needed: Physics Education Research (PER) Expert

**Why needed:** Instrument development (Astro-EFI) requires psychometrics expertise. Someone who has published validated instruments in PER.

**What they'd contribute:**
- Guide Astro-EFI item development and validation
- Advise on study design (comparison groups, statistical power)
- Lend credibility to education research component
- Potential co-authorship on assessment papers

**Potential candidates to explore:**

| Name | Institution | Expertise | Why Them |
|------|-------------|-----------|----------|
| Suzanne White Brahmia | U of Maine | PIQL developer, mathematization in physics | Created the instrument we're adapting; ideal collaborator |
| Andrew Boudreaux | Western Washington | PIQL developer, quantitative reasoning | Co-developed PIQL; strong assessment expertise |
| Eugenia Etkina | Rutgers | ISLE, scientific reasoning | Well-known in PER; expertise in reasoning assessment |
| *[PLACEHOLDER]* | *[TBD]* | *[TBD]* | *[Research at PERC/AAPT meetings]* |

**Action items:**
- [ ] Email PIQL developers to introduce project and gauge interest
- [ ] Attend AAPT/PERC meeting to network
- [ ] Ask Matt Anderson for PER contacts

---

### Needed: Astronomy Education Research (AER) Expert

**Why needed:** Ensure alignment with existing astronomy assessments, connect to AER community, strengthen astronomy-specific validity.

**What they'd contribute:**
- Connect Astro-EFI to existing astro concept inventories
- Advise on astronomy-specific content validity
- Help disseminate through astronomy education channels
- Potential co-authorship on astronomy education papers

**Potential candidates to explore:**

| Name | Institution | Expertise | Why Them |
|------|-------------|-----------|----------|
| Katherine Follette | Amherst College | QuaRCS developer, astro ed research | Created QuaRCS; expertise in quantitative reasoning in astro |
| Ed Prather | U of Arizona (CAE) | Think-Pair-Share, lecture tutorials | Director of major astro ed center; high visibility |
| Gina Brissenden | U of Arizona (CAE) | Astro 101 pedagogy | CAE associate; curriculum development expertise |
| *[PLACEHOLDER]* | *[TBD]* | *[TBD]* | *[Research at AAS education sessions]* |

**Action items:**
- [ ] Email QuaRCS developers (Follette, McCarthy)
- [ ] Explore connection to Center for Astronomy Education (CAE)
- [ ] Attend AAS education sessions to network

---

### Needed: External Evaluator

**Why needed:** NSF requires independent assessment of project outcomes. External evaluator provides objectivity and credibility.

**What they'd contribute:**
- Independent assessment of whether project meets stated goals
- Annual evaluation reports for NSF
- Formative feedback during implementation
- Summative evaluation at project end

**What to look for:**
- Experience evaluating NSF education grants (especially IUSE)
- No conflict of interest with PI or institution
- Expertise in STEM education evaluation
- Familiarity with mixed-methods approaches

**Potential sources:**
- SDSU evaluation center (if exists)
- External consulting firms specializing in NSF evaluation
- Faculty at other institutions with evaluation expertise
- NSF program officer recommendations

**Action items:**
- [ ] Check SDSU for internal evaluation resources
- [ ] Ask funded IUSE PIs who they used
- [ ] Budget appropriately (typically 5-10% of grant)

---

### Needed: Multi-Institution Partners (Optional but Strengthening)

**Why helpful:** Increases N, tests generalizability, strengthens broader impacts.

**What they'd contribute:**
- Additional student cohorts for research
- Test whether intervention works at different institution types
- Co-PIs or senior personnel on grant
- Expanded dissemination network

**Ideal partner profile:**

| Institution Type | Why Helpful | What to Look For |
|------------------|-------------|------------------|
| R1 with large program | More students (N), prestige | Astronomy dept with 60+ students/year in 201-equivalent |
| SLAC with engaged faculty | Different pedagogy context | Faculty member interested in simulation-based teaching |
| Community college | HSI angle, transfer pathways | CC with astronomy program that feeds to 4-year institutions |

**Action items:**
- [ ] Identify 2-3 potential partner institutions
- [ ] Reach out after Grant 1 shows promising results
- [ ] Could be part of Grant 2 or separate supplement

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
2. ~~**Comparison Group Ethics:** Is it ethical to have "control" sections with traditional instruction if we believe demos are better?~~ → **RESOLVED:** See [Comparison Group Design](#comparison-group-design) section. Use dose-response design with autolog data as primary; component analysis as secondary.
3. ~~**Theoretical Framework:** What's the theory of change?~~ → **RESOLVED:** See [Theoretical Framework](#theoretical-framework) section. Primary: Productive Failure; Secondary: Self-Efficacy; Supporting: Grounded Cognition.
4. ~~**Scope:** Is three demo suites too ambitious?~~ → **RESOLVED:** See [Scope Strategy](#scope-strategy-curriculum-vs-research) section. Separate curriculum contribution (all 3 suites) from research contribution (primary + replication design).

### Still Open

#### Partnerships & Scale
5. **Multi-Institution Partners:** Who are the right partners? → See [Potential Collaborators](#potential-collaborators) for placeholder; need to identify specific institutions after Grant 1 shows results.
6. **PER/AER Collaborators:** Who in the physics/astronomy education research community should we bring in? → See [Potential Collaborators](#potential-collaborators) for candidates; need to reach out.

#### Timing & Strategy
7. **Timing:** When to submit Grant 2?
   - Option A: Submit in Year 2 of Grant 1 (use preliminary data)
   - Option B: Submit in Year 3 of Grant 1 (use fuller results)
   - **Tentative decision:** Year 2-3, depending on Grant 1 data
8. **Lead Angle:** Which framing resonates most with IUSE reviewers?
   - Current thinking: Lead with "equation fluency" (novel), support with "math anxiety" (established), frame with "AI-resistant skills" (timely)

#### Sustainability
9. **Post-Grant Maintenance:** Who maintains the demos after the grant ends?
   - Potential: GitHub open-source community maintenance
   - Potential: SDSU instructional technology support
   - **Need:** Explicit sustainability plan in proposal
10. **Adoption Pathway:** How do other institutions actually adopt this?
    - Need: Clear documentation, instructor training materials
    - Need: Workshop or summer institute for adopters
    - **Consider:** Heising-Simons grant for dissemination workshop

---

## Action Items & TODOs

### Immediate (Before Grant 1 Submission)

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Finalize Grant 1 proposal | HIGH | In progress | Deadline: mid-July 2026 |
| Discuss collaboration with Matt Anderson | HIGH | ⏳ Pending | Email drafted in previous session |
| Read key productive failure papers (Kapur 2008, 2014) | MEDIUM | Not started | Needed to cite in Grant 1 too |

### Short-Term (Year 1 of Grant 1)

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Email PIQL developers (White Brahmia, Boudreaux) | MEDIUM | Not started | Introduce project, gauge interest in collaboration |
| Email QuaRCS developers (Follette) | MEDIUM | Not started | Same |
| Attend AAPT or PERC meeting | MEDIUM | Not started | Network with PER community |
| Attend AAS education sessions | MEDIUM | Not started | Network with AER community |
| Collect baseline data (PIQL, MARS-R) from current students | HIGH | Not started | Needed for Grant 2 preliminary data |
| Pilot 2-3 Astro-EFI items | MEDIUM | Not started | Generate pilot data for Grant 2 |

### Medium-Term (Year 2 of Grant 1)

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Analyze Grant 1 Year 1 data | HIGH | Future | Inform Grant 2 design |
| Identify external evaluator | MEDIUM | Future | Get recommendations from funded PIs |
| Draft Grant 2 proposal | HIGH | Future | Target Year 2-3 submission |
| Secure PER/AER collaborator commitment | HIGH | Future | Need letter of collaboration |
| Identify multi-institution partners | MEDIUM | Future | After Grant 1 shows results |

### Long-Term (Before Grant 2 Submission)

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Complete Astro-EFI item validation (Phase 1-3) | HIGH | Future | Need at least pilot data |
| Develop sustainability plan | MEDIUM | Future | Required for proposal |
| Develop dissemination plan | MEDIUM | Future | Consider Heising-Simons workshop |
| Write Grant 2 proposal | HIGH | Future | 2-3 years from now |

---

### Literature To Read

**Productive Failure (Primary Framework)**
- [ ] Kapur, M. (2008). Productive failure. *Cognition and Instruction*, 26(3), 379-424.
- [ ] Kapur, M. (2014). Productive failure in learning math. *Cognitive Science*, 38(5), 1008-1022.
- [ ] Kapur, M. (2016). Examining productive failure, productive success, and restudying. *Learning and Instruction*, 43, 79-88.
- [ ] Kapur, M., & Bielaczyc, K. (2012). Designing for productive failure. *Journal of the Learning Sciences*, 21(1), 45-83.

**Self-Efficacy (Secondary Framework)**
- [ ] Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191-215.
- [ ] Pajares, F. (1996). Self-efficacy beliefs in academic settings. *Review of Educational Research*, 66(4), 543-578.
- [ ] Usher, E. L., & Pajares, F. (2008). Sources of self-efficacy in school. *Review of Educational Research*, 78(4), 751-796.

**Grounded Cognition (Supporting Framework)**
- [ ] Barsalou, L. W. (2008). Grounded cognition. *Annual Review of Psychology*, 59, 617-645.
- [ ] Goldstone, R. L., & Son, J. Y. (2005). The transfer of scientific principles using concrete and idealized simulations. *Journal of the Learning Sciences*, 14(1), 69-110.

**Assessment Instruments**
- [ ] White Brahmia et al. (2016). Developing Mathematization with PIQL. *PERC Proceedings*.
- [ ] Follette et al. (2017). QuaRCS Assessment. *Numeracy*, 10(2).
- [ ] Arcavi, A. (1994). Symbol sense. *For the Learning of Mathematics*, 14(3), 24-35.

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

### Theoretical Frameworks
- Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191-215.
- Bandura, A. (1997). *Self-efficacy: The exercise of control*. W.H. Freeman.
- Barsalou, L. W. (2008). Grounded cognition. *Annual Review of Psychology*, 59, 617-645.
- Glenberg, A. M. (1997). What memory is for. *Behavioral and Brain Sciences*, 20(1), 1-19.
- Goldstone, R. L., & Son, J. Y. (2005). The transfer of scientific principles using concrete and idealized simulations. *Journal of the Learning Sciences*, 14(1), 69-110.
- Kapur, M. (2008). Productive failure. *Cognition and Instruction*, 26(3), 379-424.
- Kapur, M. (2014). Productive failure in learning math. *Cognitive Science*, 38(5), 1008-1022.
- Kapur, M. (2016). Examining productive failure, productive success, and restudying. *Learning and Instruction*, 43, 79-88.
- Kapur, M., & Bielaczyc, K. (2012). Designing for productive failure. *Journal of the Learning Sciences*, 21(1), 45-83.
- Nathan, M. J. (2012). Rethinking formalisms in formal education. *Educational Psychologist*, 47(2), 125-148.
- Pajares, F. (1996). Self-efficacy beliefs in academic settings. *Review of Educational Research*, 66(4), 543-578.
- Usher, E. L., & Pajares, F. (2008). Sources of self-efficacy in school: Critical review of the literature and future directions. *Review of Educational Research*, 78(4), 751-796.

### Assessment Instruments
- Arcavi, A. (1994). Symbol sense: Informal sense-making in formal mathematics. *For the Learning of Mathematics*, 14(3), 24-35.
- Follette, K., McCarthy, D., Dokter, E., Bursick, S., & Pompea, S. (2017). The Quantitative Reasoning for College Science (QuaRCS) Assessment. *Numeracy*, 10(2), Article 3.
- Richardson, F. C., & Suinn, R. M. (1972). The Mathematics Anxiety Rating Scale: Psychometric data. *Journal of Counseling Psychology*, 19(6), 551-554.
- White Brahmia, S., Boudreaux, A., & Kanim, S. E. (2016). Developing Mathematization with Physics Inventory of Quantitative Literacy. *PERC Proceedings*.

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
