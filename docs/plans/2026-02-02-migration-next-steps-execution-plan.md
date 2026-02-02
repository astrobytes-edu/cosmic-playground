# Cosmic Playground — Migration Next Steps Implementation Plan (PR-sized slices)

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan slice-by-slice (one slice per session).

**Goal:** finish Wave 3 + eliminate demo/content drift without weakening guards.  
**Architecture:** verify content/UI/export alignment first (set `content_verified` only when true), then migrate the remaining stub Wave 3 instruments with repo-owned data + unit-tested physics helpers.  
**Tech Stack:** pnpm workspace; Astro (`apps/site`), Vite demos (`apps/demos`), shared runtime/theme (`packages/runtime`, `packages/theme`), Vitest (`packages/physics`).

**Date:** 2026-02-02  
**Owner:** Codex (new-session execution)  

## Contracts (treat as non‑negotiable)

- Site + runtime contract: `docs/specs/cosmic-playground-site-spec.md`
  - Exhibit / station / instructor structure: **8.3–8.5**
  - Instrument Standard: **9.1–9.2**
- Theme contract: `docs/specs/cosmic-playground-theme-spec.md` (esp. “no hardcoded colors” rule)
- Model contract (if physics changes): `docs/specs/cosmic-playground-model-contract.md`
- Data contract (if datasets are involved): `docs/specs/cosmic-playground-data-contract.md`
- Legacy migration contract (math + drift prevention): `docs/specs/cosmic-playground-legacy-demo-migration-contract.md`

## Global invariants (must stay true in every slice)

- Base paths:
  - Astro code (`apps/site/src/**`): use `import.meta.env.BASE_URL` for internal links/assets.
  - Markdown (`apps/site/src/content/**`): no `BASE_URL`; no root-absolute `](/...)`; use relative links.
  - Vite demos (`apps/demos/src/demos/**` served at `/play/<slug>/`): no root-absolute links; use `../../...`; never hardcode `/cosmic-playground/`.
- Instrument artifact contract in built output (`apps/site/public/play/<slug>/index.html`):
  - `#cp-demo` (named), `#copyResults`, `#status` live region, `.cp-demo__drawer`.
- Math authoring:
  - Use LaTeX/KaTeX in authored source; avoid unicode-math symbols.
  - Do not add new KaTeX renderers/scripts; use `@cosmic/runtime` helpers.
- Units explicit in UI + exports + docs; notation policy: `D` = diameter, `d` = distance; never “G=1”.

## Standard verification gates (run per slice before declaring done)

Always run:

1) `node scripts/validate-math-formatting.mjs`
2) `node scripts/validate-invariants.mjs`
3) `node scripts/validate-play-dirs.mjs`
4) `corepack pnpm build`
5) `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

When relevant:
- If physics models changed:
  - `node scripts/validate-physics-models.mjs`
  - `corepack pnpm -C packages/physics test`
- If datasets changed:
  - `node scripts/validate-datasets.mjs`

**Playwright note (only if needed):**
- If e2e fails due to missing browsers: `corepack pnpm -C apps/site exec playwright install --with-deps`

---

## Slice 1 — Verify content + set `content_verified` (priority: the demos you complained about)

**Scope:** Align exhibit/station/instructor content to the current instruments + exports for:
- `keplers-laws`
- `conservation-laws`
- `blackbody-radiation`

**File targets (confirm before edits):**
- `apps/site/src/content/demos/keplers-laws.md`
- `apps/site/src/content/demos/conservation-laws.md`
- `apps/site/src/content/demos/blackbody-radiation.md`
- `apps/site/src/content/stations/keplers-laws.md` (if present), `apps/site/src/content/stations/conservation-laws.md`, `apps/site/src/content/stations/blackbody-radiation.md`
- `apps/site/src/content/instructor/keplers-laws/*`
- `apps/site/src/content/instructor/conservation-laws/*`
- `apps/site/src/content/instructor/blackbody-radiation/*`
- Optional (only if mismatch discovered): corresponding demo sources under `apps/demos/src/demos/<slug>/`

**Acceptance criteria (falsifiable):**
- For each slug above:
  - `apps/site/src/content/demos/<slug>.md` includes `content_verified: true`.
  - Exhibit/station/instructor pages no longer display the “Legacy content (unverified)” warning for that slug.
  - Station/instructor text references controls/readouts that actually exist in `/play/<slug>/`.
  - Export payload names/units match the site’s model notes (and stay explicit).
  - `node scripts/validate-math-formatting.mjs` is green (no unicode-math in sources).
- Full gates pass (see “Standard verification gates”).

**Exact commands (run in this order):**
- Inventory/check targets:
  - `ls apps/site/src/content/demos | rg \"^(keplers-laws|conservation-laws|blackbody-radiation)\\.md$\"`
  - `ls apps/site/src/content/stations | rg \"^(keplers-laws|conservation-laws|blackbody-radiation)\\.md$\" || true`
  - `ls apps/site/src/content/instructor/{keplers-laws,conservation-laws,blackbody-radiation} || true`
- Fast validation:
  - `node scripts/validate-math-formatting.mjs`
  - `node scripts/validate-invariants.mjs`
- Full gates:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Commit guidance:**
- One commit. Suggested message: `chore(content): verify keplers/conservation/blackbody copy`
- Do not push unless explicitly asked.

---

## Slice 2 — Verify remaining interactive demos + bring migration tracking docs up to date

**Scope:** Complete the “content alignment is DoD” loop for the remaining interactive demos:
- `angular-size`, `binary-orbits`, `eclipse-geometry`, `moon-phases`, `parallax-distance`, `seasons`

Also update migration tracking docs so they are “current-state true”.

**File targets:**
- `apps/site/src/content/demos/<slug>.md` (set `content_verified: true` once verified)
- Relevant station overrides: `apps/site/src/content/stations/<slug>.md` (if present)
- Relevant instructor bundles: `apps/site/src/content/instructor/<slug>/*` (if present)
- Tracking:
  - `docs/migration/2026-02-02-demo-migration-dashboard.md`
  - `docs/migration/astr101-sp26-manifest.json`

**Acceptance criteria:**
- For each slug above:
  - `content_verified: true` only after the copy matches current UI + exports.
  - No “Legacy content (unverified)” warnings for those slugs.
- `docs/migration/astr101-sp26-manifest.json` reflects current repo state:
  - `target.demo_status` values match reality (stub vs interactive).
  - Includes the three legacy demos that are currently missing in this repo (`doppler-shift-spectrometer`, `spectral-lines-lab`, `planetary-climate-sandbox`) in inventory/tracking (even if still “missing”).
- Full gates pass.

**Exact commands:**
- Fast validation:
  - `node scripts/validate-math-formatting.mjs`
  - `node scripts/validate-invariants.mjs`
- Full gates:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Commit guidance:**
- One commit. Suggested message: `chore(content): verify remaining interactive demos`

---

## Slice 3 — Wave 3: migrate `em-spectrum` from stub → interactive (data-heavy)

**Scope:** Implement the real instrument for `em-spectrum` with repo-owned datasets (no fetch).

**Required legacy review (read before porting):**
- `~/Teaching/astr101-sp26/demos/em-spectrum/index.html`
- `~/Teaching/astr101-sp26/demos/em-spectrum/em-spectrum.js`
- `~/Teaching/astr101-sp26/demos/_assets/spectra/*` (or legacy data files referenced by the demo)

**File targets (expected):**
- Demo:
  - `apps/demos/src/demos/em-spectrum/index.html`
  - `apps/demos/src/demos/em-spectrum/main.ts`
  - `apps/demos/src/demos/em-spectrum/style.css`
- Data package (new, typed, no fetch):
  - `packages/data-spectra/src/index.ts` (and submodules as needed)
  - `packages/data-spectra/package.json`, `packages/data-spectra/tsconfig.json` (follow existing data-package patterns)
- Optional physics helper (if needed for conversions; must be unit-tested):
  - `packages/physics/src/photonModel.ts` + `packages/physics/src/photonModel.test.ts`
- Content alignment:
  - `apps/site/src/content/demos/em-spectrum.md`
  - `apps/site/src/content/stations/em-spectrum.md` (if used)
  - `apps/site/src/content/instructor/em-spectrum/*`

**Acceptance criteria:**
- `/play/em-spectrum/` is interactive (not stub), accessible, and base-path-safe.
- Uses repo-owned datasets (no network fetch) and units are explicit in data fields and UI labels.
- Exports v1 (`ExportPayloadV1`) with unit-explicit rows.
- Keeps instrument artifact contract markers; `node scripts/validate-play-dirs.mjs` passes.
- Full gates pass (and dataset/physics gates if applicable).

**Exact commands:**
- Validate before/after:
  - `node scripts/validate-math-formatting.mjs`
  - `node scripts/validate-invariants.mjs`
- If you add datasets:
  - `node scripts/validate-datasets.mjs`
- If you add physics:
  - `node scripts/validate-physics-models.mjs`
  - `corepack pnpm -C packages/physics test`
- Full gates:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Commit guidance:**
- 1–2 commits max. Suggested message: `feat(demo): migrate em-spectrum instrument`

---

## Slice 4 — Wave 3: migrate `telescope-resolution` from stub → interactive (data-heavy)

**Scope:** Implement the real instrument for `telescope-resolution` with repo-owned telescope dataset + diffraction model.

**Required legacy review:**
- `~/Teaching/astr101-sp26/demos/telescope-resolution/index.html`
- `~/Teaching/astr101-sp26/demos/telescope-resolution/telescope-resolution.js`
- `~/Teaching/astr101-sp26/demos/_assets/*` telescope data files referenced by legacy

**File targets (expected):**
- Demo:
  - `apps/demos/src/demos/telescope-resolution/index.html`
  - `apps/demos/src/demos/telescope-resolution/main.ts`
  - `apps/demos/src/demos/telescope-resolution/style.css`
- Data package (new, typed):
  - `packages/data-telescopes/src/index.ts` (and submodules)
- Physics model (new, unit-tested):
  - `packages/physics/src/telescopeResolutionModel.ts`
  - `packages/physics/src/telescopeResolutionModel.test.ts`
- Content alignment:
  - `apps/site/src/content/demos/telescope-resolution.md`
  - `apps/site/src/content/stations/telescope-resolution.md` (if present)
  - `apps/site/src/content/instructor/telescope-resolution/*`

**Acceptance criteria:**
- `/play/telescope-resolution/` is interactive (not stub), accessible, and base-path-safe.
- Diffraction model uses explicit units (e.g., wavelength in nm/um with internal meters) and exports with explicit unit labels.
- Exports v1; station mode table matches station card text if an override exists.
- Full gates pass (including physics/dataset validations).

**Exact commands:**
- `node scripts/validate-math-formatting.mjs`
- `node scripts/validate-invariants.mjs`
- `node scripts/validate-datasets.mjs`
- `node scripts/validate-physics-models.mjs`
- `corepack pnpm -C packages/physics test`
- `corepack pnpm build`
- `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

**Commit guidance:**
- 1–2 commits max. Suggested message: `feat(demo): migrate telescope-resolution instrument`

---

## Follow-on (not in these 4 slices)

- Migrate legacy demos missing from this repo:
  - `doppler-shift-spectrometer`, `spectral-lines-lab`, `planetary-climate-sandbox`
- Execute the shared UX hardening plan in `docs/plans/2026-02-01-ui-ux-hardening.md` (prefer shared theme/runtime changes over per-demo styling).
