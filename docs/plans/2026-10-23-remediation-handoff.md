# Handoff prompt — Cosmic Playground remediation (paste into a new Opus 5.5 session)

Everything between the rules below is the prompt. It is written to be pasted whole.

---

You are continuing work on Cosmic Playground (`/Users/anna/Teaching/cosmic-playground`),
an interactive astronomy/physics teaching site for ASTR 101/201. A previous session ran a
full red-team audit and landed the first fixes. Your job is the remediation, not another
audit.

## Read these first, in this order

1. `CLAUDE.md` — project rules. The ones that will bite you: CGS/solar/AU-yr units and
   never SI or `G=1`; all reader-visible math authored as LaTeX and rendered by KaTeX,
   never Unicode glyphs; `D` = physical diameter and `d` = distance, never anything else;
   `import.meta.env.BASE_URL` for every internal link; all physics from `@cosmic/physics`
   with no inline equations in demo code; the 8 design-system invariants; and the git
   workflow (branch off `main`, land with `--ff-only`).
2. `docs/reviews/2026-10-23-red-team-audit.md` — the audit report. Grades, the 15 confirmed
   P0s, the six structural fixes, what is already fixed.
3. `docs/reviews/2026-10-23-red-team-findings.json` — all 599 findings with evidence,
   failure scenario, proposed fix and verifier verdict. 1.9 MB, so query it rather than
   reading it:
   ```bash
   python3 -c "
   import json
   d=json.load(open('docs/reviews/2026-10-23-red-team-findings.json'))
   for f in d['findings']:
       if f.get('verdict')=='CONFIRMED' and f.get('severityConfirmed')=='P0':
           print(f['file'], f.get('line',''), '|', f.get('titleConfirmed') or f['title'])
   "
   ```
   Fields per finding: `severity`, `severityConfirmed`, `category`, `file`, `line`,
   `evidence`, `failureScenario`, `fix`, `fixConfirmed`, `effort`, `area`, `wave`,
   `verdict`, `verifierReason`.
4. `STATUS.md` — live state. Update its `next:` / `blocker:` / `due:` lines as you go; the
   brain pulls them.

## State of the tree — read this before you touch anything

**There are 11 uncommitted changes on `main`.** They are all validated (see section 7 of
the report) but nothing is committed. Your first decision to put to Anna is whether to
commit them as one "audit fixes" commit, split them, or branch first. Do not commit
without asking.

```bash
git status -sb && git diff --stat
```

Changed: `apps/site/src/lib/base.ts` (new), `apps/site/src/lib/nav.ts` (new),
`apps/site/src/lib/catalog.ts`, `apps/site/src/layouts/Layout.astro`,
`apps/site/src/components/{MobileNav,DemoCard,FilterBar}.astro`,
`apps/site/src/pages/instructor/[slug].astro`, `apps/site/src/pages/explore/index.astro`,
`apps/site/src/pages/topics/[slug].astro`, `apps/site/src/styles/global.css`,
11 further pages rewired to `withBase`, `packages/physics/src/galaxyRotationModel.ts`,
`packages/physics/src/telescopeResolutionModel.ts` (+ both test files),
`packages/theme/styles/layer-instrument.css`,
`apps/demos/src/demos/{blackbody-radiation,galaxy-rotation,telescope-resolution}/index.html`,
plus the two new docs.

## The plan: six structural fixes, in this order

Section 5 of the report states each in full. Do them as the spine, because each closes a
whole class of finding and the per-demo P0s get much cheaper afterwards.

1. **S2, harden `scripts/validate-math-formatting.mjs`** (M). Do this first: it is a gate,
   it is cheap, and it currently prints `OK` while Unicode math reaches readers through
   `\uXXXX` escapes. Expect it to light up violations across the demos; fix them in the
   same change or the lint gate stays red.
2. **S6, derive `content_verified` from evidence** (S). Stops the honesty class recurring
   while you work. Includes the moon-phases station card that swaps First and Third
   Quarter against the demo's own model, and `/about/`'s "3 modes per demo" claim.
3. **S4, the shell-level reflow fix** (M). `.cp-playbar` cannot wrap, the mobile shell
   gives it a bare `1fr` track, and no `.katex-display` containment reaches any demo page.
   One fix in `packages/theme` plus deleting the per-demo overrides that mask it, then add
   the `play/` routes to `reflow.spec.ts`. This is the 34-graded area.
4. **S5, the shared `aria-valuetext` + live-region helper** (M) in `packages/runtime`,
   applied by the shell. Announce on `change` and preset clicks, **never** from inside
   `render()` (seasons' render runs every animation frame).
5. **S3, the readout component with mandatory units and an optional qualifier** (M).
   `.cp-readout__qualifier` already exists in `packages/theme/styles/layer-instrument.css`.
6. **S1, the drawing-vs-model contract test per demo** (L). Three asymmetric points per
   demo. This is the one that would have caught ~20 of the 64 P0s, and it is what keeps
   them from coming back.

Then work the 15 confirmed P0s. 14 remain; `telescopeResolutionModel` is done.
Start with `parallax-distance/logic.ts:127` — an inverted detector-offset sign in the one
`launch-ready`, `status: stable` demo in the catalogue.

## Scientific decisions

Anna approved four on 2026-10-23. Three are landed. One is **not yet implemented**:

> **stars-zams-hr metallicity**: lock the displayed pair at $Z = 0.02$ and say so. Label the
> lifetime readout "at $Z = 0.02$", show the ZAMS luminosity beside it at $Z = 0.02$ too so
> the two numbers describe the same star, and keep $Z$ as a control that visibly moves only
> the HR position, with a note that the clock is solar-metallicity.
> (`packages/physics/src/stellarLifetimeModel.ts` already documents the limit as
> `SOLAR_METALLICITY_ONLY`; the demo never surfaces it.)

**Every further scientific choice is Anna's and is asked immediately, in an
`AskUserQuestion` popup, with 2-4 options, the recommended one first and marked, and the
physics, cost and evidence stated in the message just before the popup.** Never let them
pile up, never park one in a report or a closing line. Engineering choices stay yours:
state them in one line and proceed. Decisions already visible in the findings that will
need her: the EFF profile's $\gamma$ convention (`clusterProfileModel.ts:68`), the
`em-spectrum` microwave band edges, the `moon-phases` challenge grading criterion and
eclipse window, and whether `doppler-shift` should report a radial velocity for
cosmological redshifts at all.

## Verification debt — do not treat the findings as settled

- 64 of 72 judged findings were confirmed; of the 8 refuted, **6 were refuted only because
  this session had already fixed them**, so the genuine false-positive rate is 2 of 72 (3%).
  Among the confirmed: 15 P0, 35 P1, 14 downgraded to P2.
- **257 high-severity findings never reached a verifier** (the run capped verification at
  72). They carry `verdict: NOT-VERIFIED-verify-cap`. Confirm a finding by reading the code
  and recomputing before you act on it.
- All 119 wave-2 findings carry `NOT-VERIFIED-wave2`.
- The two real false positives: the `keplerSolver` export claim (it is re-exported) and the
  `hubs/cosmic-playground.md` angular-size claim (wrong line, three claims failed).

## How to work here

- **Test gating.** Run the tests that own the changed path, or a `-k` selection inside them.
  `corepack pnpm -C packages/physics exec vitest run src/<file>.test.ts`;
  `corepack pnpm -C apps/demos exec vitest run src/demos/<slug>`;
  `corepack pnpm -C apps/site typecheck`; the standalone validators are
  `node scripts/validate-{invariants,math-formatting,datasets,plot-contract}.mjs`.
  **Do not run the full suite** unless Anna asks or you are at a batch boundary she agreed
  to, and then only once. Announce anything over ~2 minutes before launching it. Never run
  two Playwright runs at once (shared port 4321, and `test-results/` is wiped at start).
- **TDD on every fix.** Write the failing test first and confirm it fails *on an assertion*
  ("Tests  no tests" means the file failed to load). This repo has a documented history of
  tests that encode the defect; the AO test asserted `eff > 0.35 && eff < 0.6` and pinned
  the wrong model. Read assertions, never test names.
- **Capture exit codes directly**: `cmd > log 2>&1; echo EXIT=$?`, never through a pipe.
- **Never modify `~/Teaching/astr101-sp26/demos/`** — legacy demos in use for teaching this
  semester. Read them for parity only.
- **Insight blocks.** Before and after non-trivial changes, include a short
  `★ Insight ───` block in chat (never in repo files unless asked) with 2-3 points tied to
  this codebase and this change.
- **Evidence language.** No "successfully", "works", "complete", "should work", "fixed"
  without a metric. Give every number the workload it was measured on, on the same line.
  Say "implemented, unvalidated" when that is the truth, and mark anything not run this
  session as NOT VERIFIED inside the sentence that claims it.

## What Anna asked for that is still outstanding

1. **A detailed tracker and roadmap artifact** she will use to guide all work and progress.
   Deliberately paused before it was built. The data is ready in the findings JSON; build
   it as a page with a persistent store so finding status survives across sessions, and
   seed it from that file.
2. **Homepage and navigation refactor.** The site-IA auditor wrote a concrete proposed IA;
   read its `summary` and findings in the JSON (`area` contains "information architecture").
   Known: 15 routes with four separate indexes of the same 20 demos; a `hubs` collection
   with four content files and no route; `/welcome/` hand-lists 6 of 8 topics and routes
   "Stars" to `eos-lab`, a demo withheld from the catalogue; no way back from
   `/play/<slug>/`; `explore/index.astro` renders 29 cards for 20 demos under a count that
   reads 20.
3. **Demo hardening** against the 20 per-demo reports.
4. Nothing from the audit run itself: it completed (99 agents, all 72 verdicts returned)
   and every verdict is joined into the findings JSON. Do not re-run it.

## Do not

- Re-run the audit. It cost ~5M subagent tokens. The findings are on disk.
- Commit or push without asking.
- Use `git add -A` / `git add .` / `git commit -a` (project hooks block them).
- Trust a `NOT-VERIFIED-*` finding without recomputing it yourself.
- Promote a demo's `readiness`/`status` without the evidence; only `launch-ready` removes
  the card badge and only `status: stable` removes the "Active development" callout, and
  `readinessReason` is public copy.

## Start by

Reading the report, then `git status -sb && git diff --stat`, then asking Anna the one
gating question: commit the 11 validated fixes first, or branch and start on S2.
