# Cosmic Playground — Data Contract (Wave 3 / data-heavy demos)

**Status:** Draft (enforced)  
**Date:** 2026-02-02  
**Audience:** anyone migrating demos that require datasets (Wave 3 and beyond)

## Goal

Make datasets in Cosmic Playground:

- **Deterministic** (no runtime fetch; works on GitHub Pages and offline)
- **Auditable** (provenance + license + versioning are explicit)
- **Scientifically safe** (units are explicit and cannot silently drift)
- **Typecheckable** (TS types describe the schema)

This contract is designed to prevent “it worked on my machine” and “we don’t know what dataset this is” regressions during rapid migrations.

## Non‑negotiables

### 1) No runtime fetch for core datasets

Wave 3 demos must not fetch datasets over the network at runtime.

**Allowed:**
- importing datasets from `packages/data-*` (ESM exports)
- small inline demo-local constants (only if truly trivial; otherwise use a data package)

**Not allowed:**
- `fetch(...)` / HTTP requests for core datasets
- “download the CSV at runtime” patterns

### 2) Units are explicit in field names

Every numeric dataset field must carry its unit in the **field name**, and the unit must be documented.

Examples:
- `wavelengthNm`, `frequencyHz`
- `apertureM`, `baselineAu`
- `thetaArcsec`, `parallaxMas`
- `temperatureK`

This avoids subtle “unitful numbers” drifting between code paths.

### 3) Dataset provenance + license are explicit

Every dataset must include:
- provenance (where values came from, or “project-authored” if created for teaching)
- license (or explicitly `UNSPECIFIED` until resolved)
- version (so changes are intentional and reviewable)

### 4) Dataset exports include metadata

For each dataset export `foo`, also export `fooMeta` describing schema + units + provenance.

This supports instructor-facing citations and future audit tooling.

## Repository structure

Datasets live in packages:

```
packages/
  data-astr101/
  data-spectra/         # future
  data-telescopes/      # future
```

Each `packages/data-*/` must contain:

- `package.json` with a scoped package name (e.g. `@cosmic/data-spectra`)
- `src/index.ts` exporting datasets and their `*Meta`
- `manifest.json` describing all datasets in that package (machine-checkable)

## Machine enforcement

This contract is enforced by:

- `node scripts/validate-datasets.mjs`

and must stay green as part of:

- `corepack pnpm build`

## `manifest.json` schema (required)

Each `packages/data-*/manifest.json` must contain:

```json
{
  "package": "@cosmic/data-astr101",
  "manifestVersion": 1,
  "datasets": [
    {
      "id": "nearbyStars",
      "title": "Nearby stars (parallax)",
      "description": "Teaching dataset for parallax examples.",
      "exports": ["nearbyStars", "nearbyStarsMeta"],
      "unitsPolicy": "units-in-field-names",
      "fields": [
        { "name": "name", "type": "string", "unit": "unitless" },
        { "name": "parallaxMas", "type": "number", "unit": "mas" }
      ],
      "provenance": {
        "kind": "project-authored",
        "notes": "Approximate values curated for teaching; not a single upstream catalog."
      },
      "license": "UNSPECIFIED",
      "version": 1
    }
  ]
}
```

Notes:
- `exports` must match names exported from `src/index.ts`.
- If `unit` is not `unitless`, the `name` must contain the unit (enforced for common units).

## Review checklist (use in PR review)

- [ ] No runtime `fetch(...)` for datasets
- [ ] Dataset lives in `packages/data-*` with `manifest.json`
- [ ] Numeric fields include units in field names
- [ ] Metadata export exists (`*Meta`) and matches `manifest.json`
- [ ] Provenance + license fields are present (even if `UNSPECIFIED`)
- [ ] `corepack pnpm build` passes

