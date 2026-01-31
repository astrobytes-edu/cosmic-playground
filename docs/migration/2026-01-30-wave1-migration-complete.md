# Wave 1 demos migration — completion note (Angular Size, Seasons, Eclipse Geometry)

**Scope:** `angular-size`, `seasons`, `eclipse-geometry`  
**Repo:** `astrobytes-edu/cosmic-playground`  
**Note:** This file is named per the Wave 1 plan date; final verification was run on **2026-01-31**.

## What shipped (Wave 1)

### `angular-size`

- **Physics (TDD):** `packages/physics/src/angularSizeModel.ts`
- **Instrument:** `apps/demos/src/demos/angular-size/`
- **Feature parity (teaching):**
  - Presets (astronomical + everyday), logarithmic sliders for distance/diameter
  - Moon special modes: orbit-angle and recession-time (explicit toy model notes)
  - Station Mode snapshot table + row sets
  - Challenge Mode with state-based checks
  - Copy Results (v1 export)
- **UI polish (non-physics):**
  - Added angle arc + distance/diameter stage indicators and preset-aware glow styling (visual only; readouts remain authoritative)

### `seasons`

- **Physics (TDD):** `packages/physics/src/seasonsModel.ts`
- **Instrument:** `apps/demos/src/demos/seasons/`
- **Feature parity (teaching):**
  - Date/tilt/latitude controls + anchor date buttons
  - Readouts: declination, day length, noon altitude, distance (AU), seasons
  - Station Mode snapshot table + anchor row set
  - Challenge Mode with state-based checks
  - Animate-year toggle (off by default; disabled under reduced motion)
  - Copy Results (v1 export)
- **Bugfix (visual correctness):**
  - Fixed the orbit-panel Earth position dot so it is rendered on the orbit ring (removed double-applied SVG translation).

### `eclipse-geometry`

- **Physics (TDD):** `packages/physics/src/eclipseGeometryModel.ts`
- **Instrument:** `apps/demos/src/demos/eclipse-geometry/`
- **Feature parity (teaching):**
  - New/Full phase buttons, Moon longitude, node longitude Ω, orbital tilt i, Earth–Moon distance presets
  - Solar + lunar eclipse classification and live readouts
  - Station Mode snapshot table + 4-case template row set
  - Challenge Mode with state-based checks
  - Optional animation + long-run simulation (off by default; disabled under reduced motion)
  - Copy Results (v1 export)
- **Site doc alignment:** removed stub note in `apps/site/src/content/demos/eclipse-geometry.md`

## Explicitly deferred (per Wave 1 scope decisions)

- Pixel-perfect replication of legacy SVG styling and micro-interactions.
- Legacy starfield background and “demo-polish” extras (unless needed for clarity).

## Unit audit checklist results

**No `G=1` strings found** outside the plan text.

Command used:
```bash
rg -n "G\\s*=\\s*1|G=1" packages apps docs --glob '!docs/plans/**'
```
Result: no matches.

## Verification gates (must stay green)

Ran:
```bash
corepack pnpm build
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Result:
- Build: ✅
- E2E: ✅

Build artifact sanity:
- `apps/site/public/play/angular-size/index.html` exists after build.
- `apps/site/public/play/seasons/index.html` exists after build.
- `apps/site/public/play/eclipse-geometry/index.html` exists after build.

## Content edits needed / notes for follow-up

- Instructor deep-dive pages still contain legacy file-path references (e.g. `demos/_assets/...`) even though the migrated source lives under `packages/physics/src/` and `apps/demos/src/demos/`. This does not affect the student demo, but should be updated for developer/instructor accuracy.
