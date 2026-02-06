# Cosmic Playground Foundational Execution Board

Status: active
Date: 2026-02-06

## Goal

Get Cosmic Playground to launch-ready quality by prioritizing foundational contract enforcement, CI hardening, architecture consistency, and scientific integrity before cosmetic polish.

## Ownership split (no overlap)

- Claude owns implementation (spec edits, scripts, tests, refactors).
- Codex owns audit/review and gate verification (no code edits unless explicitly reassigned).
- Claude ticket is only complete after Codex posts a pass/fail audit for that ticket.

## Execution board (priority-ordered)

| ID | Priority | Owner | Scope | Primary files | Done when |
| --- | --- | --- | --- | --- | --- |
| CP-001 | P0 | Claude | Update migration contract to encode enforceable launch rules | `docs/specs/cosmic-playground-legacy-demo-migration-contract.md` | Contract includes mandatory PR gates, verified-content criteria, non-stub criteria, cross-demo accessibility checks, and export stability checks |
| CP-002 | P0 | Claude | Add PR CI workflow separate from deploy workflow | `.github/workflows/pr-ci.yml`, `.github/workflows/deploy.yml` | Every PR runs lint, typecheck, tests, build, and base-path e2e before merge |
| CP-003 | P0 | Claude | Expand root test command to include demo test suite | `package.json`, `apps/demos/package.json` | `corepack pnpm test` executes demo Vitest suite plus package/script contract tests |
| CP-004 | P0 | Claude | Add content verification validator (`content_verified` governance) | `scripts/validate-content-verification.mjs`, `scripts/validate-content-verification.test.mjs`, `package.json` | `content_verified: true` fails unless required verification artifact exists and passes schema rules |
| CP-005 | P0 | Claude | Harden play artifact validation to strict DOM-level checks | `scripts/validate-play-dirs.mjs`, `scripts/validate-play-dirs.test.mjs` | Validator catches malformed contract elements and false-pass cases |
| CP-006 | P1 | Claude | Create shared demo bootstrap runtime to remove duplicated init logic | `packages/runtime/src/demoBootstrap.ts`, `packages/runtime/src/index.ts` | Demos use shared bootstrap for copy/status/help/station/math/starfield wiring |
| CP-007 | P1 | Claude | Refactor large demo controllers into module structure | `apps/demos/src/demos/eclipse-geometry/main.ts`, `apps/demos/src/demos/moon-phases/main.ts`, `apps/demos/src/demos/angular-size/main.ts` | Main files shrink and logic moves to testable modules with no behavior drift |
| CP-008 | P1 | Claude | Add demo architecture guardrail validator | `scripts/validate-demo-architecture.mjs`, `scripts/validate-demo-architecture.test.mjs`, `package.json` | Non-compliant demos fail CI (missing bootstrap usage, forbidden inline duplication patterns) |
| CP-009 | P1 | Claude | Add cross-demo accessibility e2e coverage for help/station dialogs | `apps/site/tests/smoke.spec.ts` | All migrated demos pass keyboard open/close/focus-return/focus-trap checks |
| CP-010 | P1 | Claude | Normalize button semantics (`type="button"`) across demos | `apps/demos/src/demos/**/index.html` | No implicit-submit buttons remain in demo UI |
| CP-011 | P1 | Claude | Add shared Predict/Play/Explain pattern component | `packages/runtime/src/`, `apps/site/src/components/` | Prompt structure and instructional scaffolding are consistent across demos/pages |
| CP-012 | P1 | Claude | Add per-demo export snapshot tests for v1 text shape and units | `apps/demos/src/demos/*/*test.ts`, `apps/site/tests/smoke.spec.ts` | Export regressions are caught per demo, not only sampled demos |
| CP-013 | P1 | Claude | Add static check for physics source-of-truth usage where applicable | `scripts/validate-physics-usage.mjs`, `scripts/validate-physics-usage.test.mjs` | Model-bearing demos fail if they bypass `packages/physics` |
| CP-014 | P1 | Claude | Resolve stub policy for `planetary-conjunctions` | `apps/demos/src/demos/planetary-conjunctions/`, `apps/site/src/content/demos/planetary-conjunctions.md`, `apps/site/src/pages/explore/index.astro` | Demo is either fully migrated or clearly quarantined from launch-facing discovery |
| QA-001 | P0 | Codex | Review each Claude PR against contracts/gates | review outputs only | Findings-first review with severity + file/line citations |
| QA-002 | P0 | Codex | Run full gate suite for each merge candidate | command outputs only | Pass/fail report with failing tests and regression class |
| QA-003 | P1 | Codex | Maintain launch readiness matrix | `docs/audits/` (or successor location) | Every demo has explicit state: blocked, ready-for-verify, launch-ready |

## Launch gate definition

- Zero failing checks in PR CI and post-merge deploy CI.
- Zero unreviewed `content_verified: true` entries.
- Zero launch-facing stub demos.
- 100% migrated demos pass contract validators and cross-demo accessibility/e2e gates.
- No open P0/P1 defects in model correctness, export integrity, or base-path navigation.

## Standard verification commands

```bash
corepack pnpm lint
corepack pnpm -r typecheck
corepack pnpm test
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

