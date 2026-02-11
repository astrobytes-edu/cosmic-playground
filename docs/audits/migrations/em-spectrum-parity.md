# em-spectrum Migration Parity Audit

Date: 2026-02-11

Scope: compare the legacy ASTR101 SP26 `em-spectrum` demo to the Cosmic Playground migrated `em-spectrum` demo, and identify parity gaps + a migration backlog.

## References (source of truth)

Legacy demo (ASTR101 SP26):
- `/Users/anna/Teaching/astr101-sp26/demos/em-spectrum/index.html`
- `/Users/anna/Teaching/astr101-sp26/demos/em-spectrum/em-spectrum.js`
- `/Users/anna/Teaching/astr101-sp26/demos/em-spectrum/telescope-data.js`
- `/Users/anna/Teaching/astr101-sp26/demos/em-spectrum/object-data.js`

Migrated demo (Cosmic Playground):
- `apps/demos/src/demos/em-spectrum/index.html`
- `apps/demos/src/demos/em-spectrum/main.ts`
- `apps/demos/src/demos/em-spectrum/logic.ts`
- `packages/data-spectra/src/emSpectrumTelescopes.ts`
- `packages/data-spectra/src/emSpectrumObjects.ts`
- `packages/data-spectra/src/atomicLines.ts`
- `packages/data-spectra/src/molecularBands.ts`

## Legacy feature inventory (what existed)

Spectrum interaction + accessibility:
- Click spectrum bar to jump wavelength (`setupSpectrumBar()`).
- Keyboard adjust wavelength on the spectrum bar (ArrowLeft/ArrowRight with log steps).
- Clickable/focusable band labels below the spectrum bar (`setupBandLabels()`).
- Keyboard shortcuts for mode tabs (1–4) and band jumps (r/m/i/v/u/x/g) (`setupKeyboard()`).

Convert mode:
- Enter wavelength OR frequency OR photon energy, with unit selects for each quantity (km/m/mm/um/nm/pm/fm; Hz…EHz; erg/J/eV/keV/MeV).
- Displays a “formula display” line that mirrors the three readouts.

Telescopes + objects:
- Card grids with icons + selection highlight.
- Selection opens an info panel (range/location/science for telescopes; bands/why/telescope examples for objects).
- Selection highlights the relevant region on the spectrum bar and moves the wavelength to a representative value.

## Migrated feature inventory (what exists now)

Core instrument shell:
- Slider + band buttons controlling wavelength selection.
- Log-scale spectrum bar (visual), band highlight, marker label, and a chirp overlay (`drawSpectrumWave()`).
- “Scale objects” labels along the spectrum bar (`SCALE_OBJECTS`).

Drawer panels:
- Convert: three numeric inputs (nm / Hz / eV only) with auto-updating.
- Telescopes: list of observatories; currently active coverage gets a “Now:” prefix.
- Objects: list of objects; currently shows only `name — why`.
- Lines: list of atomic lines (visible) + a few IR molecular band centers.

Exports:
- Copy Results export payload via `@cosmic/runtime` (new in migrated demo).

## 1) Behavior parity

✅ Core physics + mapping parity (matches legacy intent):
- Log mapping between wavelength and spectrum position (`wavelengthToPositionPercent()` / inverse).
- Correct conversions using `@cosmic/physics` (`PhotonModel`).
- Band pickers jump to geometric-mean band centers (`bandCenterCm()`), matching the legacy strategy.

❌ Missing legacy interactions:
- Clicking/dragging on the spectrum bar does not change wavelength (legacy supported click-to-jump on the bar).
- Spectrum-bar keyboard controls (ArrowLeft/ArrowRight log steps) are missing.

⚠️ Convert-panel “unit conversion” parity gap:
- Legacy supported unit selects; migrated currently fixes units to nm/Hz/eV.

## 2) Visual/interaction parity

✅ Migrated improvements / acceptable deltas:
- Cosmic Playground instrument shell + drawer structure (consistent with other `/play/` demos).
- Wave “chirp” overlay + scale labels (good teaching affordances).

❌ Missing legacy UI affordances:
- No “band labels” region under the spectrum bar (legacy had direct, focusable labels).
- No telescope/object selection behavior (info panel + spectrum highlight + wavelength jump).
- No mode-specific “insight box” copy (legacy changed the callout by mode).
- No “formula display” line in Convert (legacy showed the three quantities side-by-side).

## 3) Data parity (catalog completeness)

Telescopes:
- Legacy includes at least `Arecibo` and `Event Horizon Telescope`; migrated data currently omits them.

Objects:
- Migrated object catalog is a reduced subset; legacy includes additional common entries (e.g., elliptical galaxies, starburst galaxies, blazars, cosmic infrared background, planets thermal, comets, molecular clouds).

Lines / teaching anchors:
- Legacy README’s “Real-World Examples” section calls out anchors across multiple bands (e.g., 21 cm HI, 2.7 K CMB peak, 121.6 nm Lyα, 10.6 μm CO₂ laser).
- Migrated “Lines” panel currently only covers visible atomic lines + a few IR molecular band centers.

## 4) Export parity

Not applicable as parity requirement:
- Legacy demo did not have a “Copy results” export; migrated does. Treat as an intentional improvement.

## 5) Pedagogical parity (site + instructor materials)

✅ Station card parity:
- The station workflow (choose a band → record wavelength/energy/object/telescope → one-sentence claim) matches the legacy station-card include.

⚠️ Content/UI drift to resolve:
- Exhibit copy currently says “practice unit conversions” via Convert, but the migrated Convert panel does not implement unit toggles yet (`apps/site/src/content/demos/em-spectrum.md`).
- Instructor “Model & Math” notes still reference legacy code paths (`demos/_assets/em-spectrum-model.js`, `demos/em-spectrum/em-spectrum.js`) rather than the migrated architecture (`@cosmic/physics`, `packages/data-spectra`, `apps/demos/src/demos/em-spectrum/*`).

## 6) Intentional deltas (keep)

- Use the standard instrument shell + drawer panels instead of the legacy “Explore/Convert/Telescopes/Objects” top tabs.
- Keep “Copy Results” export (it supports station/instructor workflows even if legacy lacked it).

## 7) Backlog (recommended migration order)

P0 — fix teaching-facing drift (so docs match the instrument):
- Option A (recommended): add unit toggles to Convert (restore legacy capability).
- Option B: revise exhibit copy + instructor notes to match “representation conversion only” (nm/Hz/eV).

P0 — update instructor deep-dive references:
- Update `apps/site/src/content/instructor/em-spectrum/model.md` to cite `@cosmic/physics` + `packages/data-spectra` + `apps/demos/src/demos/em-spectrum/*`, and remove legacy file references.

P1 — restore spectrum-bar interaction parity:
- Click-to-jump (and optional click-drag) on `.spectrum__bar`, updating the slider/wavelength state.
- Keyboard affordance: ArrowLeft/ArrowRight change wavelength multiplicatively (log steps); announce changes in a live region.

P1 — restore telescope/object selection affordances:
- Make list entries interactive (button-like) with “details” rendering:
  - Telescopes: show `range + location + science`, and highlight coverage on the spectrum.
  - Objects: show `bands + why + telescope examples`, and highlight a representative band.

P1 — fill data gaps in `packages/data-spectra`:
- Add missing telescopes (Arecibo, Event Horizon Telescope).
- Expand objects catalog to include the legacy set (elliptical/starburst galaxies, blazars, cosmic IR background, planets thermal, comets, molecular clouds, etc.).

P2 — upgrade “Lines” to multi-band teaching anchors:
- Add non-visible anchors (21 cm HI, Lyα, CMB peak, CO₂ laser, etc.) and group them by band.
- Consider optionally rendering anchors as small markers on the spectrum bar (toggleable).

P2 — add lightweight shortcut support:
- Band quick-jumps (r/m/i/v/u/x/g) and panel quick-jumps (1–4), but only if they don’t conflict with site-level shortcuts.

## 8) Promotion recommendation

- Keep `readiness: experimental` until P0 + P1 items are addressed and this parity audit is updated with verification notes + screenshots.
