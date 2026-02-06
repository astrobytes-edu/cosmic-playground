# Cosmic Playground — Physics/Model Contract

**Status:** Draft (enforced where possible)  
**Date:** 2026-02-02  
**Audience:** anyone adding or editing scientific models (especially for demo migrations)

## Goal

Ensure models are:

- **Scientifically correct when feasible** (no “cheats” if the correct model is accessible)
- **Explicit about units and assumptions**
- **Tested** (benchmark + limiting-case + sanity invariants)
- **Pedagogically aligned** (simplifications are intentional and clearly stated)

## Non‑negotiables (physics correctness)

### 1) If we can model it correctly, we must

“Correct” here means: within the scope of the demo, implement the physically correct relationship rather than a convenient approximation **unless**:

- the approximation is explicitly flagged as a *toy model* for pedagogy, and
- the limitations are clearly stated in model notes / docs, and
- the approximation does not teach a false rule.

### 2) Units must be explicit everywhere

In model code (`packages/physics` and demo calculations):
- units must be explicit in variable names, parameter names, and exported APIs.
- avoid unitful numbers without a unit suffix in the identifier.

Repo-wide policies:
- Do **not** introduce “natural units” language.
- Do **not** use `G=1`.
- When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with
  `G = 4π² AU³/(yr²·M☉)` (teaching normalization).

### 3) Notation policy in teaching-facing copy

In UI copy, model notes, exports, and docs:
- `D` = diameter
- `d` = distance

### 4) Tests are required for any model introduced/edited

For any new `packages/physics/src/*Model.ts`:
- a corresponding `packages/physics/src/*Model.test.ts` is required
- include at least:
  - one benchmark check (known-value test)
  - one limiting-case check
  - one sanity invariant check (monotonicity, bounds, symmetry, etc., as appropriate)

### 5) Numerical methods must come from one shared source

For reusable numerical methods (for example: clamp, interpolation, integration, root-finding):
- use `@cosmic/math` (`packages/math/src/math.ts`) as the canonical implementation.
- do not copy generic numerical routines into demo files or physics models.
- if a new reusable numerical routine is needed, add it to `@cosmic/math` with tests first.

## Machine enforcement

This contract is enforced (partially) by:

- `node scripts/validate-physics-models.mjs` (ensures `*Model.ts` has a `*Model.test.ts` and is exported)

and must stay green as part of:

- `corepack pnpm build`

## PR review checklist (use in every migration PR)

- [ ] Model assumptions are written (demo drawer model notes + instructor model page)
- [ ] Units explicit in names and UI labels; exports v1 use unit-explicit row names
- [ ] Limiting-case + benchmark tests exist and pass
- [ ] No “G=1” / “natural units” introduced
- [ ] Build + base-path e2e gates pass:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`
