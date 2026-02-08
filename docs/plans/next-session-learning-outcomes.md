# Next Session: Learning Outcomes Hardening

> **Copy-paste prompt at bottom of this file.**

## Context

Cosmic Playground has 14 interactive astronomy demos with A+ engineering (2,039 tests, zero legacy, 14 physics reviews). But zero evidence that students actually learn from them. This session closes that gap.

## Current State

- 14 demos, each with Station Mode (data collection), Challenge Mode (self-assessment), Export (clipboard for lab reports)
- Shelf tabs have "What to notice" (Observable → Model → Inference) and "Model notes"
- No analytics, no assessment instruments, no guided inquiry worksheets, no LMS integration
- Demos are used in ASTR 201 (intro) and ASTR 101 (gen-ed) at the instructor's university

## What "Learning Outcomes Hardening" Means

### Tier 1: Structured Lab Activities (highest impact, lowest effort)
Each demo needs a **guided inquiry worksheet** that students complete using Station Mode. Pattern:
- Predict → Observe → Explain cycle
- 3-5 data collection tasks using Station Mode's "Add row" feature
- Export results to paste into a lab report template
- Synthesis question that forces the Observable → Model → Inference arc

### Tier 2: Concept Inventory Alignment
Map each demo to established astronomy concept inventories:
- LSCI (Lunar Shapes Concept Inventory) → moon-phases
- ADT (Astronomy Diagnostic Test) → seasons, retrograde-motion
- TOAST (Test of Astronomy Standards) → angular-size, parallax-distance
- Write 2-3 pre/post questions per demo aligned to these instruments

### Tier 3: Lightweight Analytics
Add opt-in telemetry to answer: "What do students actually do?"
- Time on task per demo
- Controls interacted with (sliders moved, presets clicked)
- Challenge completion rate
- Station Mode rows collected
- No PII, local-first (localStorage summary), optional beacon to instructor endpoint

### Tier 4: LMS Integration
- Export as SCORM or LTI provider for Canvas/Blackboard
- Grade passback for Challenge Mode completion
- Deep links from Canvas modules to specific demos with pre-set parameters

## Key Files to Know

- `packages/runtime/src/demoModes.ts` — Station Mode + Challenge Mode infrastructure
- `packages/runtime/src/challengeEngine.ts` — Challenge state machine
- `apps/demos/src/demos/*/index.html` — shelf tab content (pedagogical text)
- `apps/site/src/pages/stations/*.astro` — station card pages (lab-ready landing pages)
- `apps/site/src/pages/exhibits/*.astro` — exhibit pages (narrative context)
- `CLAUDE.md` and `AGENTS.md` — project conventions

## Recommended Session Order

1. **Audit existing pedagogical content** — read all 14 shelf tab texts, assess quality
2. **Design guided inquiry template** — create a reusable worksheet pattern
3. **Write 3 pilot worksheets** — moon-phases (simplest), retrograde-motion (most complex), eos-lab (most novel)
4. **Add analytics hooks** — lightweight event tracking in runtime
5. **Write pre/post questions** — aligned to concept inventories

---

## Copy-Paste Prompt

```
I'm continuing work on Cosmic Playground (~/Teaching/cosmic-playground), a suite of 14 interactive astronomy teaching demos. The engineering is complete (2,039 tests, A+ grade, 14 physics reviews — see docs/reviews/2026-02-07-grade-100.md for full audit).

The next priority is LEARNING OUTCOMES HARDENING. The demos work perfectly but we have zero evidence students learn from them. Read docs/plans/next-session-learning-outcomes.md for the full plan.

Start with Tier 1: create guided inquiry worksheets for 3 pilot demos (moon-phases, retrograde-motion, eos-lab). Each worksheet should follow a Predict → Observe → Explain cycle with 3-5 data collection tasks that use Station Mode. Before writing anything, audit the existing pedagogical content in each demo's shelf tabs (the "What to notice" and "Model notes" HTML in each index.html) to understand what's already scaffolded.

Use the reviewing-demos skill mindset but focused on pedagogy, not code quality. The deliverable is Quarto markdown worksheets in docs/worksheets/ that instructors can hand to students.
```
