# Cosmic Playground Codebase Audit Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan task-by-task.

**Goal:** Perform a contract-driven audit to verify invariants are enforced, architecture matches specs, and repo checks are CI-ready.

**Architecture:** Use the specs in `docs/specs/` as the contract, verify the monorepo boundaries (`apps/*` vs `packages/*`), run the repo’s own build + test gates, and then write a prioritized findings/remediation report.

**Tech Stack:** pnpm workspaces, TypeScript, Vite, Astro, Vitest, Playwright, Node scripts in `scripts/`.

## Task 1: Read the contracts (spec-driven)

**Files:**
- Review: `docs/specs/cosmic-playground-site-spec.md`
- Review: `docs/specs/cosmic-playground-theme-spec.md`
- Review: `docs/specs/cosmic-playground-model-contract.md`
- Review: `docs/specs/cosmic-playground-data-contract.md`
- Review: `docs/specs/cosmic-playground-legacy-demo-migration-contract.md`

**Acceptance criteria:**
- Identify the repo’s non-negotiable invariants (base paths, instrument markers, no hardcoded colors, unicode-math-free source, unit/notation policies).

**Verification commands:**
- (Read-only) `rg -n "^#" docs/specs/*.md`

## Task 2: Inventory architecture and enforcement points

**Files:**
- Review: `scripts/build.mjs`
- Review: `scripts/validate-*.mjs`
- Review: `apps/site/astro.config.mjs`
- Review: `apps/demos/vite.config.ts`
- Review: `packages/runtime/src/index.ts`

**Acceptance criteria:**
- Confirm build pipeline matches spec: demos build → copied into `apps/site/public/play/` → site build.
- Confirm invariant enforcement exists at build time (validators + artifact checks).

**Verification commands:**
- `ls -la apps packages scripts`

## Task 3: Run the repo’s primary gates (local CI simulation)

**Acceptance criteria:**
- `build`, `typecheck`, unit tests, and base-path e2e all pass.

**Verification commands:**
- `corepack pnpm build`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

## Task 4: Targeted invariant scans (beyond the scripted checks)

**Acceptance criteria:**
- No obvious violations of “no runtime fetch”, “no natural units”, and base-path safe linking conventions.

**Verification commands:**
- `rg -n "\\bfetch\\(" apps/demos/src apps/site/src packages -S || true`
- `rg -n "\\bG\\s*=\\s*1\\b|natural units" -S . || true`

## Task 5: Write audit report + prioritized remediation plan

**Files:**
- Create: `docs/audits/2026-02-02-codebase-audit.md`

**Acceptance criteria:**
- Report includes: current state, what’s enforced, what’s not, DRY/architecture notes, and a small prioritized list of concrete next actions.

