---
name: cosmic-readiness
description: Use when deciding or changing a Cosmic Playground demo's release state — the status, readiness, readinessReason, content_verified and unlisted frontmatter in apps/site/src/content/demos — or when asked which demos are stable; applies the PRD promotion rules to measured evidence and keeps what readers see honest.
---

# Cosmic readiness

## Fields (`apps/site/src/content/config.ts`)

- `status`: `stable | beta | draft`
- `readiness`: `stub | experimental | candidate | launch-ready`
- `readinessReason`: shown on the public exhibit page — plain language, no audit IDs.
- `content_verified`, `unlisted` + `unlistedReason`, `parityAuditPath`, `lastVerifiedAt`.

## What readers see

- The card and exhibit badge disappears only at `launch-ready` (`apps/site/src/lib/readiness.ts`).
- The exhibit's "Active development: status / readiness" callout disappears only at `status: stable`
  (`apps/site/src/pages/exhibits/[slug].astro`).
- `unlisted` demos are omitted from listings but their routes still build.
- So move the two fields together: **stable with launch-ready, beta with candidate, draft with
  experimental or stub.** `node .agents/skills/cosmic-readiness/scripts/check-readiness.mjs` enforces it.

## Promotion rules (`docs/specs/cosmic-playground-prd.md`)

- `experimental -> candidate`: parity audit complete, major regressions resolved, required tests present.
- `candidate -> launch-ready`: all section 6.1 launch gates pass with no open P0/P1 blockers — including a
  parity audit with reviewer signoff and 0 open P0/P1 accessibility regressions.
- Reviewer signoff is Anna's read-through of the pages. Recommend; do not self-promote to launch-ready.

## Deciding (fix the rule before scoring any demo)

Launch-ready needs all of: no open wrong-science, broken-control or P0/P1 accessibility finding; a
dedicated E2E spec plus logic and physics tests; a full instructor bundle and station card;
`content_verified: true`; not unlisted; measured phone reflow at 320px; announcements that reach `#status`;
Anna's signoff. Candidate needs the tests and content with only localised findings open. Anything with an
open critical or wrong-science finding, or missing tests or instructor content, is experimental.

Evidence table per demo: current fields · open findings with IDs and file:line · E2E/unit/physics test
counts · instructor files and station card · measured reflow and announcement results · recommendation ·
what moves it up. Use the `readiness-auditor` role to compile it, then verify the deciding claims yourself.

## Red flags — stop

- Promoting on green tests alone; `readinessReason` that promises what the demo does not do.
- `status: stable` with `readiness: candidate` (or the reverse).
- Treating `docs/reviews/*.md` verdicts as evidence.

## Verify

The check script, `corepack pnpm build`, and the site E2E (Explore sorts and filters by readiness).
