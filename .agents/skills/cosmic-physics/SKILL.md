---
name: cosmic-physics
description: Use when adding or changing physics or astronomy in Cosmic Playground — models in packages/physics, or any demo code that maps a physical quantity or angle to the screen — where units, sign and coordinate conventions, and what the drawing shows must all agree with the real sky; includes the mandatory coordinate review before pushing.
---

# Cosmic physics

Read `.agents/references/invariants.md` first (units, CGS, notation).

## Fix it at the source

- Models live in `packages/physics/src/*Model.ts` with tests beside them. Demos call models.
- Never ship a demo-only correction factor. Wrong by 10x means wrong constants, units or formula.
- Cite published fits and data (authors, journal, year) in the model file; say which convention a value
  uses (vacuum vs air wavelengths; reduced-mass vs infinite-mass Rydberg; mean vs true anomaly).

## Tests that would actually catch the bug

- One benchmark against a known value, one limiting case, and **one asymmetric point**. A waxing/waning
  swap passed every test because they checked only full and new moon, the two phases where the wrong and
  right formulas agree.
- Test the inverse where one exists (screen -> angle -> screen; day -> position -> day).
- Tolerances or bounds, not golden decimals. Work expected values by hand before writing the assertion.
- A new test must FAIL against the old code first (run it with the old model), on its assertions.

## Conventions that keep going wrong

| Topic | Convention |
|---|---|
| SVG coordinates | y points down. A view from above the north pole runs counter-clockwise: `y = cy - r*sin(theta)`, inverse `atan2(-(y - cy), x - cx)`. seasons and eclipse-geometry still draw clockwise. |
| Moon phase angle (moon-phases) | 0 full, 90 third quarter, 180 new, 270 first quarter; elongation east of the Sun = (alpha - 180) mod 360. |
| Seasons | March equinox day 80, perihelion day 3; Earth's heliocentric longitude = Sun's longitude + 180 deg. |
| Declination | `asin(sin(eps) * sin(lambda))`; `eps * sin(lambda)` is only exact at equinoxes and solstices. |
| Kepler timing | Interpolate in mean anomaly (uniform in time), never across the +/-pi wrap of true anomaly. |
| Vectors | Arrow length must scale with the quantity; fixed-length v and F arrows assert constant speed and gravity. |
| Spectra | State vacuum or air and stay consistent; the Balmer limit is 364.7 nm vacuum, 364.6 nm air. |
| Interpolating functions | A curve labelled "deep-MOND limit" must be that limit, not the full interpolation. |

## Coordinate review (mandatory before pushing angles, geometry or physical mappings)

1. Trace model -> `logic.ts` -> `main.ts` rendering -> user interaction -> back to the model.
2. Recompute at least three readouts independently (by hand or a separate script) and compare to what
   the page displays, including one non-default state.
3. Measure the rendered geometry (SVG attributes, element positions) at two or more states and check
   direction and magnitude against the real sky.
4. Check labels, captions and legends say the same thing as the drawing.
5. Record the result in the commit message. Use the `physics-reviewer` role for an independent pass.
   `docs/reviews/*.md` are not evidence: six were falsified on specific claims in September 2026.

## Red flags — stop

- "Patch it in the demo for now."
- A test that passes on both the old and new code.
- A formula in demo code; mixing degrees and radians without a named boundary.
- A drawing whose direction, sign or scale nobody measured.

## Verify

`corepack pnpm -C packages/physics exec vitest run src/<file>.test.ts`, the full physics suite, the demo's
unit tests, and a rendered-geometry E2E assertion for anything drawn. Report numbers, not "looks right".
