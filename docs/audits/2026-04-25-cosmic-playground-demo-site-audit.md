# Cosmic Playground Demo + Site Audit

> **Date:** 2026-04-25  
> **Scope:** Cosmic Playground museum site, 19 demo entries, 19 `/play/<slug>/` instruments, exhibit pages, station/instructor surfaces, and shared frontend shell conventions.  
> **Method:** Source review against site/model/pilot contracts, metadata inventory, production build, local preview, Playwright visual pass at desktop and mobile widths, and e2e smoke run.

## Executive Summary

Cosmic Playground has a strong foundation: the product idea is coherent, the demo metadata schema is unusually disciplined, most demos have real tests, and the best newer instruments already feel like astronomy reasoning labs rather than toy widgets. The strongest current exemplars are `galaxy-rotation`, `spectral-lines`, `doppler-shift`, `binary-orbits`, `eos-lab`, and parts of `moon-phases`.

The honest launch-readiness answer is: **not launch-ready as a whole yet**. The site builds, but the base-path e2e suite currently fails, most play pages miss the pilot quality bar's `h1` requirement, at least one older demo has a severe mobile layout regression, the home page hides major content behind JS-only entrance animation, and several public discovery/instructor/station surfaces still expose incomplete or generic material.

The best next move is not to polish all 19 equally. Pick a small launch cohort, fix shared blockers, promote only demos with complete pedagogy + accessibility evidence, and keep the rest clearly marked experimental.

## Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Build | Pass | `corepack pnpm build` completed and validated 19 content demos + 19 demo source folders. |
| Site e2e | Fail | `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` failed 1 smoke test after 738 passed / 34 skipped. |
| Readiness metadata | Pass structurally | 4 `candidate`, 15 `experimental`, 0 `launch-ready`. |
| Public status metadata | Conservative | 18 `draft`, 1 `beta`, 0 `stable`. |
| Content verification | Mixed | `retrograde-motion` is explicitly unverified; `planetary-conjunctions` omits `content_verified`, so schema default is false. |
| Instructor bundles | Mixed | Most demos have full bundles; `planetary-conjunctions` and `retrograde-motion` have only partial bundles; `stars-zams-hr` appears to have no instructor bundle. |
| Station cards | Mixed | Most have override cards; `planetary-conjunctions` falls back to a generic template with Moon-phase-specific example rows. |
| Visual audit artifacts | Captured | Representative screenshots saved in `output/playwright/` under `audit-*.png`. |

## What Works Well

1. **The product concept is pedagogically strong.** The site spec's "interactive museum" and "predict -> play -> explain" loop is visible across the IA, exhibit pages, station cards, and instrument copy.

2. **Metadata and governance are strong.** Demo entries carry readiness, parity path, verification date, model notes, misconceptions, and play prompts. That makes the catalog maintainable and auditable.

3. **The better demos are genuinely valuable.** `galaxy-rotation`, `spectral-lines`, `doppler-shift`, `binary-orbits`, and `eos-lab` have rich observable -> model -> inference structure, explicit assumptions, useful challenge/copy workflows, and serious tests.

4. **Physics/model discipline is much better than typical educational demos.** The model contract is backed by test files in `packages/physics`, and many UI readouts keep units explicit.

5. **The shared visual language is recognizable.** The instrument aesthetic, readout cards, tabs, utility toolbar, starfield, and amber/cyan values give the project an identity.

6. **Station/instructor materials are a real differentiator.** For demos such as `galaxy-rotation`, the station card and assessment bank are classroom-usable, not decorative extras.

## Must Fix Before Whole-Site Launch

### P0-1. Base-path e2e currently fails

**Evidence**
- `apps/site/tests/smoke.spec.ts:33` checks the Explore heading with `page.getByRole("heading", { name: "Explore" })`.
- The e2e run failed because that locator now matches both the page `<h1>Explore</h1>` and the `Hydrostatic Equilibrium Explorer` demo-card heading.
- Verification output: 738 passed, 34 skipped, 1 failed.

**Impact**
This blocks the primary launch gate. The site can build, but CI/e2e is not green.

**Recommendation**
Change the smoke assertion to exact match or level-specific matching, for example `getByRole("heading", { name: "Explore", level: 1, exact: true })`, then rerun the full e2e gate.

### P0-2. 18 of 19 play pages appear to miss the single-`h1` instrument requirement

**Evidence**
- `docs/specs/cosmic-playground-pilot-quality-bar.md`, Accessibility + keyboard: "Page has a single `h1`".
- `rg "<h1" apps/demos/src/demos/*/index.html` finds only `apps/demos/src/demos/stars-zams-hr/index.html:18`.
- Playwright DOM audit returned empty `h1` text for most `/play/<slug>/` pages.

**Impact**
Screen-reader and document-outline quality is weaker than the pilot contract requires. Root `aria-label`s help, but they do not replace page heading structure.

**Recommendation**
Add a consistent visible or visually-hidden `<h1>` pattern to the shared instrument header/toolbar convention. Add an e2e or design-contract test that every demo source has exactly one `h1`.

### P0-3. The home page hides major content behind JS-only entrance animation

**Evidence**
- `apps/site/src/pages/index.astro:276-283` sets `.home-section { opacity: 0; transform: translateY(16px); }`.
- `apps/site/src/pages/index.astro:135-150` reveals sections only after an `IntersectionObserver` runs.
- Full-page screenshot `output/playwright/audit-home.png` showed a large dark blank area after "How it works"; later sections exist in DOM but are visually hidden until scrolling/observer state changes.

**Impact**
This violates the static-fast museum goal. If JS is disabled, delayed, or the observer misses a section during screenshot/prerender/assistive workflows, key homepage content disappears.

**Recommendation**
Make content visible by default and add animation only under a JS-enhanced class, e.g. set `document.documentElement.classList.add("js")`, then scope hidden pre-animation states to `.js .home-section`.

### P0-4. `blackbody-radiation` has a severe mobile layout regression

**Evidence**
- Shared shell mobile rule in `packages/theme/styles/demo-shell.css:203-223` intends a single-column stack under 1024px.
- `apps/demos/src/demos/blackbody-radiation/style.css:148-153` overrides `grid-template-areas` after importing the shared shell and does not re-declare a mobile stack.
- Mobile Playwright at 390px produced controls width `222px` and stage width `108px`; screenshot `output/playwright/audit-mobile-play-blackbody-radiation.png` shows unreadable tabs and a nearly unusable stage.

**Impact**
The demo is effectively unusable on phones. More importantly, it proves demo-local shell overrides can bypass shared mobile invariants.

**Recommendation**
Fix `blackbody-radiation` immediately, then add a shell invariant test that no demo can produce a stage narrower than a useful threshold at 390px unless it intentionally shows a minimum-width warning.

### P0-5. Some public station/instructor links resolve to incomplete or generic pedagogy

**Evidence**
- `apps/site/src/pages/stations/[slug].astro:111-123` fallback table includes Moon-phase-specific example rows: "Phase angle" and "illuminated fraction".
- `apps/site/src/content/demos/planetary-conjunctions.md:27-29` publishes station and instructor paths, but `apps/site/src/content/stations/planetary-conjunctions.md` is absent and only one instructor file exists.
- Instructor bundle inventory shows only one file each for `planetary-conjunctions` and `retrograde-motion`; `stars-zams-hr` does not appear in the instructor bundle list.

**Impact**
The catalog advertises classroom materials that are uneven. A student or instructor can land on a valid page that is not actually specific to the demo.

**Recommendation**
For every published `station_path` and `instructor_path`, require either a demo-specific override or a generic fallback that is genuinely demo-agnostic. Add a content validation rule for missing/partial instructor bundles before candidate promotion.

## Major Improvements

### P1-1. Exhibit embeds are often too clipped to be pedagogically useful

**Evidence**
- `apps/site/src/pages/exhibits/[slug].astro:81-82` places `IframeStage` early on every exhibit.
- `apps/site/src/components/IframeStage.astro:31-43` uses a fixed 16:10 iframe frame.
- `output/playwright/audit-exhibit-galaxy.png` shows a large clipped demo embed where the lower readouts and controls are not visible in the exhibit context.

**Impact**
The embed creates a false promise: it appears interactive, but it often shows only a partial instrument. It consumes prime exhibit space before the predict/play/explain blocks.

**Recommendation**
Choose one: make exhibit embeds stage-only/responsive with an `embed` mode, or replace iframe embeds with a high-quality static preview + "Launch demo" CTA. For classroom flow, the exhibit should frame the task; the full instrument should live in `/play/`.

### P1-2. Explore duplicates multi-topic demos and makes the catalog feel larger but noisier

**Evidence**
- `apps/site/src/pages/explore/index.astro:210-219` builds topic sections by including any demo whose `topics` contains the section key.
- The visual pass shows demos such as `galaxy-rotation` appearing under Data & Inference, Galaxies, and Cosmology.

**Impact**
Multi-topic coverage is useful metadata, but repeated full cards make the default catalog harder to scan and inflate perceived redundancy.

**Recommendation**
Default Explore should show each demo once under its primary topic, with secondary topic badges and filters still active. Topic detail pages can show all matching demos.

### P1-3. Several catalog cards have blank or generic illustrations

**Evidence**
- `apps/site/src/components/DemoIllustration.astro` has explicit cases for many slugs but lacks cases for `doppler-shift`, `galaxy-rotation`, `hydrostatic-equilibrium-explorer`, `spectral-lines`, and `stars-zams-hr`.
- Explore screenshot shows large starfield-only cards for several high-value demos.

**Impact**
The weakest visuals are attached to some of the most pedagogically sophisticated demos. That undersells the project.

**Recommendation**
Add distinctive card illustrations for every demo before public launch. Prioritize the candidate/ASTR201 demos first.

### P1-4. Status and readiness messaging is accurate but not yet user-centered

**Evidence**
- Readiness inventory: 4 `candidate`, 15 `experimental`, 0 `launch-ready`.
- Status inventory: 18 `draft`, 1 `beta`, 0 `stable`.
- Explore cards expose both status and readiness, but there is no "classroom-ready" filter because no demo is launch-ready yet.

**Impact**
Honest metadata is good, but public visitors may interpret the whole site as unfinished. Instructors need a faster answer: "What can I safely assign today?"

**Recommendation**
Keep the conservative readiness states, but add a "recommended for class use" or "launch cohort" collection once the first demos pass gates. Do not promote the whole site; promote individual demos.

### P1-5. Controls density still overwhelms some instruments

**Evidence**
- Playwright audit counted high focusable totals: `spectral-lines` 84, `doppler-shift` 54, `keplers-laws` 54, `eos-lab` 51.
- Some candidate demos handle this with collapsed advanced sections and workflow rails; others still rely on long sidebars.

**Impact**
Advanced demos are valuable, but first-time student use can become "wall of controls" instead of predict -> observe -> explain.

**Recommendation**
For every candidate, define a "first 90 seconds" student path: one primary observable, one primary control, one readout cluster, and one prompt. Advanced controls should remain discoverable but not front-loaded.

### P1-6. `hydrostatic-equilibrium-explorer` is promising but currently worksheet-first

**Evidence**
- Desktop screenshot `output/playwright/audit-play-hydrostatic-equilibrium-explorer.png` shows the first viewport dominated by lesson flow, presets, and a prediction checkpoint.
- The stage/readout/drawer regions are hidden or zero-sized in the initial student-mode DOM audit until the guided flow progresses.

**Impact**
The pedagogical intent is excellent, but the instrument does not yet "show the observable first." It starts like a guided worksheet rather than a model students can inspect.

**Recommendation**
Keep the guided flow, but surface a compact visual support-chain preview and 2-3 live readouts in the first viewport. Let the prediction checkpoint sit beside the observable rather than replacing it.

## Per-Surface Notes

### Museum Site

**Strengths**
- Home and Explore clearly communicate "Predict / Play / Explain."
- Explore offers search, filters, quick filters, playlists, topic sections, and readiness badges.
- Exhibit pages put development state and launch controls near the top.

**Issues**
- Home page progressive animation hides content by default.
- Explore is visually dense and repeats multi-topic demos.
- Some card illustrations are missing for important demos.
- "Surprise me" can select experimental demos; that is playful but risky for classroom-facing use.

### Exhibit Pages

**Strengths**
- Predict, Play, Explain blocks are consistent and copy is often strong.
- Development-state callout is honest and visible.
- Model notes/misconceptions are available without burying them in separate docs.

**Issues**
- The early iframe embed is often clipped and can compete with the learning task.
- Learning goals, misconceptions, model notes, and body copy are collapsed by default; this helps page length but can hide the most pedagogically important framing.

### Play Instruments

**Strengths**
- Candidate demos increasingly use tabs, readouts, model notes, challenge/copy workflows, and unit-explicit outputs.
- Accessibility tests cover root labels, live regions, utility toolbars, readout units, reduced-motion, and keyboard paths.
- Physics-heavy demos have unusually strong model transparency.

**Issues**
- Missing `h1` is a cross-demo contract gap.
- Demo-local shell overrides still create responsive regressions.
- Some instrument pages are too tall before the student sees all of stage/readouts/controls.
- Utility actions and navigation still create a lot of focus stops.

### Station + Instructor Materials

**Strengths**
- Full bundles are very good where complete. `galaxy-rotation` is a strong example: station artifact, table, clicker prompts, short-answer checks, and exit ticket align with the demo.
- The station page fallback is useful in principle.

**Issues**
- Missing/partial bundles are not surfaced clearly enough.
- The generic station fallback contains demo-specific examples and can mislead.
- Instructor notes are public but uneven; the route is always valid, so incompleteness looks intentional.

## Suggested Launch Cohort

Treat these as the first serious candidates after the P0 blockers are fixed:

1. `galaxy-rotation` — strongest observable/model/inference arc and instructor artifacts.
2. `doppler-shift` — strong spectroscopy workflow and challenge/copy behavior.
3. `spectral-lines` — high pedagogical value, but needs careful first-use simplification because it is dense.
4. `binary-orbits` — excellent ASTR201 value; verify mobile and classroom pacing.
5. `moon-phases` — good ASTR101 value; content verification/readiness should be refreshed before promotion.

Keep `hydrostatic-equilibrium-explorer` experimental until the first viewport shows the physical observable more directly and the uncommitted work is settled.

## Recommended Implementation Slices

### Slice 1: Restore Green Gates

- Fix `tests/smoke.spec.ts` heading locator.
- Rerun `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`.
- Add the e2e failure note to the relevant PR/checklist if work continues on `hydrostatic-equilibrium-explorer`.

### Slice 2: Shared Accessibility Contract

- Add a standard demo `<h1>` pattern.
- Add a design-contract test for one `h1` per demo.
- Confirm visual heading treatment does not add clutter to compact instrument headers.

### Slice 3: Mobile Shell Guardrail

- Fix `blackbody-radiation` mobile grid override.
- Audit every demo-local `grid-template-areas` override.
- Add a visual or DOM-size test at 390px for stage width, no horizontal overflow, and reasonable first controls/readouts access.

### Slice 4: Classroom Materials Completeness

- Replace the generic station fallback rows with demo-neutral rows.
- Add/complete `planetary-conjunctions` station + instructor bundle.
- Add/complete `stars-zams-hr` instructor bundle.
- Decide whether `retrograde-motion` is content-verified or keep warnings prominent.

### Slice 5: Catalog Polish

- Add missing `DemoIllustration` cases.
- Show each demo once on the default Explore page.
- Add a launch-cohort/recommended-class-use section after the first demos pass launch gates.

### Slice 6: Exhibit Embed Strategy

- Either build an `embed` mode for demos or replace the iframe with static preview media.
- Keep launch CTA prominent.
- Make the first exhibit viewport show the task, not a clipped cockpit.

## Evidence Index

- Site spec: `docs/specs/cosmic-playground-site-spec.md`, Product goals and Instrument Standard goals.
- Model contract: `docs/specs/cosmic-playground-model-contract.md`, unit/model/test non-negotiables.
- Pilot quality bar: `docs/specs/cosmic-playground-pilot-quality-bar.md`, single `h1`, keyboard, export, model notes, mobile layout.
- Shell contract: `docs/specs/cosmic-playground-demo-shell-variants.md`, canonical regions and layout variants.
- Shared shell CSS: `packages/theme/styles/demo-shell.css:27-43`, desktop grid; `packages/theme/styles/demo-shell.css:203-223`, mobile stack.
- Blackbody override: `apps/demos/src/demos/blackbody-radiation/style.css:148-153`.
- Home animation risk: `apps/site/src/pages/index.astro:276-295`.
- Explore grouping: `apps/site/src/pages/explore/index.astro:210-219`.
- Exhibit iframe: `apps/site/src/pages/exhibits/[slug].astro:81-82`; `apps/site/src/components/IframeStage.astro:31-43`.
- Missing illustration cases: `apps/site/src/components/DemoIllustration.astro`.
- Station fallback: `apps/site/src/pages/stations/[slug].astro:111-123`.
- Instructor route behavior: `apps/site/src/pages/instructor/[slug].astro:73-99`.
- Smoke failure: `apps/site/tests/smoke.spec.ts:33-43`.
- Visual artifacts: `output/playwright/audit-home.png`, `output/playwright/audit-explore.png`, `output/playwright/audit-exhibit-galaxy.png`, `output/playwright/audit-mobile-play-blackbody-radiation.png`, `output/playwright/audit-mobile-play-eos-lab.png`, `output/playwright/audit-play-galaxy-rotation.png`, `output/playwright/audit-play-hydrostatic-equilibrium-explorer.png`, `output/playwright/audit-play-spectral-lines.png`.

## Verification Run

```bash
corepack pnpm build
```

Result: passed. Built 19 demo artifacts and 80 Astro pages.

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Result: failed. 738 passed, 34 skipped, 1 failed. Failure was `Cosmic Playground smoke › Explore renders demo cards`, caused by a non-exact heading locator matching both `Explore` and `Hydrostatic Equilibrium Explorer`.

```bash
corepack pnpm -C apps/site exec node --input-type=module -e '<Playwright audit script>'
```

Result: passed after running outside the sandbox so Chromium could launch. Saved representative screenshots in `output/playwright/`.

## Bottom Line

This is already a valuable teaching platform, not just a demo gallery. The most important shift now is **promotion discipline**: fix shared blockers, choose a small launch cohort, and make every public "ready" signal evidence-backed. The repo has the right contracts; the next phase is enforcing them on the visible surfaces students and instructors actually touch.
