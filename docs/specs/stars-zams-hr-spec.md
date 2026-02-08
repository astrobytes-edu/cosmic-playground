# Stars ZAMS + HR Demo Spec (`stars-zams-hr`)

**Status:** Draft  
**Date:** 2026-02-08  
**Owner:** Cosmic Playground

---

## 1) Purpose

Define the ASTR 201 stellar-structure entry instrument that maps:

- inputs: mode-dependent controls (`M,Z` in ZAMS mode; `R,T_{\rm eff}` in Stefan mode)
- model: Tout et al. (1996) ZAMS fits
- outputs: `$L/L_{\odot}$`, `$R/R_{\odot}$`, `$T_{\rm eff}$`, and `$F/F_{\odot}$`
- visualization: log-log H-R marker + ZAMS track + optional constant-$R$ guides

This demo is the foundation for future HR extensions (for example simplified stellar evolution overlays).

---

## 2) Model Contract

Authoritative v1 model:

- Tout, Pols, Eggleton, Han (1996), analytic ZAMS `L(M,Z)` and `R(M,Z)` fits

Validity domain:

- `0.1 <= M/Msun <= 100`
- `1e-4 <= Z <= 0.03`

Derived quantity:

- `Teff = Tsun * [(L/Lsun)/(R/Rsun)^2]^(1/4)`

No natural units. All quantities and labels must stay unit-explicit.
Use LaTeX math notation in teaching-facing copy and labels (`L/L_{\odot}`, `R/R_{\odot}`, `M/M_{\odot}`, `T_{\rm eff}`).

---

## 3) Public Physics API

Module:

- `packages/physics/src/zamsTout1996Model.ts`

Exports:

- `validity({ massMsun, metallicityZ })`
- `luminosityLsunFromMassMetallicity({ massMsun, metallicityZ })`
- `radiusRsunFromMassMetallicity({ massMsun, metallicityZ })`
- `effectiveTemperatureKFromMassMetallicity({ massMsun, metallicityZ })`
- `massFromTemperatureMetallicity({ temperatureK, metallicityZ })`

Index export:

- `packages/physics/src/index.ts` re-exports `ZamsTout1996Model`.

---

## 4) UI Contract

Controls:

- source-mode chips:
  - ZAMS mode (`M`, `Z`)
  - Stefan mode (`R`, `T_{\rm eff}`)
- mass slider (log-scale mapped, `0.1-100 Msun`) in ZAMS mode
- metallicity slider (log-scale mapped, `1e-4-0.03`) in ZAMS mode
- effective-temperature slider (log-scale mapped, `2-100 kK`) in Stefan mode
- radius slider (log-scale mapped, `0.01-1000 Rsun`) in Stefan mode
- constant-$R$ overlay toggle (default off)
- preset chips split into:
  - ZAMS presets
  - override presets (non-ZAMS exemplars)

Readouts:

- `$T_{\rm eff}$` (kK)
- `$L/L_{\odot}$`
- `$R/R_{\odot}$`
- `$M/M_{\odot}$`
- `$F/F_{\odot}$`
- validity/assumption badge text

Stage:

- Explore/Understand tabs with:
  - Explore: H-R log-log canvas
  - Understand: blackbody/Stefan interpretation with display equations (`$$...$$`)
- H-R canvas with:
  - current metallicity ZAMS reference track
  - live point marker
  - constant-$R$ guide families (toggle)
  - hot-left and luminosity-up orientation cues
  - labeled logarithmic axes:
    - `log10(T_eff [kK])`
    - `log10(L/L_sun)`
  - major decade ticks plus minor logarithmic ticks

Shell/components:

- must use standard instrument shell and shared runtime affordances
- must include utility toolbar, copy results, status live region, station mode, and help mode

---

## 5) Preset Policy

ZAMS presets:

- represented as `(M, Z)` states and rendered as model-inferred points

Override presets:

- carry explicit `Teff` and `R` and are flagged as non-ZAMS
- use assumption text in validity badge and export notes
- metallicity control is presented as not-applied while override presets are active

Override examples in v1:

- red supergiant
- blue supergiant
- white dwarf

---

## 6) Export Contract

Use `ExportPayloadV1` with:

- parameters: source mode, mass, metallicity, constant-$R$ toggle state
- readouts: `Teff (kK)`, `L/Lsun`, `R/Rsun`, `F/Fsun`
- notes: validity domain + Stefan-Boltzmann closure + override/ZAMS assumption + log-axis rationale

---

## 7) Site Content Contract

Required metadata file:

- `apps/site/src/content/demos/stars-zams-hr.md`

Must include:

- readiness fields
- parity audit path
- Predict/Play/Explain prompts
- misconceptions for ZAMS limits, flux-vs-luminosity confusion, and log-axis interpretation

Topic sequencing:

- add `stars-zams-hr` to Stars suggested order before EOS lab.

---

## 8) Testing and Verification

Physics tests:

- `packages/physics/src/zamsTout1996Model.test.ts`
  - domain checks
  - benchmark sanity values
  - monotonicity checks
  - inversion accuracy checks

Demo tests:

- `apps/demos/src/demos/stars-zams-hr/logic.test.ts`
- `apps/demos/src/demos/stars-zams-hr/design-contracts.test.ts`

Repository gates:

1. `corepack pnpm -C packages/physics test zamsTout1996Model.test.ts`
2. `corepack pnpm -C apps/demos test stars-zams-hr`
3. `corepack pnpm build`
4. `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e`

---

## 9) Deferred Scope

Not in v1:

- Hurley+2000 or other stellar evolution tracks
- full isochrones/table-driven population overlays
- HR density maps or IMF-weighted distributions

These are planned as follow-on modules once ZAMS baseline usage is validated.
