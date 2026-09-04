# Animated Demo Thumbnail Signature Audit

Date: 2026-04-26
Scope: `apps/site/src/components/DemoCanvasThumbnail.astro` and demo-card thumbnails across the Cosmic Playground museum site.

## Summary

The current animated demo icons are better than the original static SVG fallbacks, but they are not good enough for the role they now play. They are visually pleasant in places, yet still read as generic "space motion" rather than miniature scientific instruments. Several are physically misleading because they compress different observables into the same drawing grammar.

The recommended direction is to replace the current scene-family renderer with per-demo animated signatures. Each thumbnail should show exactly one recognizable observable from the corresponding demo, with token-based color, restrained motion, a static reduced-motion snapshot, and a silhouette that remains identifiable without text.

## Evidence From Project Standards

- `docs/specs/cosmic-playground-site-spec.md` says correctness is the first guiding principle and that every demo should feel like an instrument. A thumbnail that teaches the wrong visual abstraction conflicts with that product rule.
- `docs/specs/cosmic-playground-theme-spec.md` defines the Aurora Ink direction: warm ink backgrounds, neutral text, muted teal/pink/violet accents, and no new hardcoded app-layer colors.
- `docs/specs/cosmic-playground-theme-spec.md` allows museum atmosphere, but says demo/instrument visuals should prioritize readability over "cosmic vibes."
- `packages/theme/styles/tokens.css` already provides the relevant visual vocabulary: celestial object tokens, chart/data tokens, museum opacity tokens, glow tokens, and phase colors.
- `scripts/validate-invariants.mjs` enforces no hardcoded app-layer color literals, with only narrow visualization-data exceptions.
- `apps/site/src/components/HeroOrbit.astro` is the strongest precedent: it works because it is physically coherent, quiet, token-driven, and has one clear motion idea.

## Findings

### P1: Current thumbnails still group distinct demos into shared visual families

`keplers-laws`, `binary-orbits`, `retrograde-motion`, and `planetary-conjunctions` all route through one orbit renderer. That makes binary barycenter motion, apparent retrograde sky motion, and conjunction alignment look like small variants of the same heliocentric cartoon.

`em-spectrum`, `spectral-lines`, and `doppler-shift` share one spectrum renderer. This misses the key distinction that Doppler is about comparing rest and observed wavelengths, while spectral lines are about discrete transitions, and the EM spectrum is about wavelength/frequency scale.

`angular-size` and `parallax-distance` share one geometry branch even though angular size is a tangent-cone/apparent-disk problem and parallax is a baseline/shift measurement.

### P1: Several thumbnails are physically underspecified or misleading

- Retrograde should emphasize apparent sky-coordinate reversal, not merely an orbital squiggle.
- Seasons should show axial tilt held fixed in space and changing illumination/daylight, not just a tilted Earth beside the Sun.
- Eclipse geometry should show syzygy plus node proximity; a shadow cone alone implies every New/Full Moon can eclipse.
- Galaxy rotation should connect a face-on disk/slit to a flat curve; a floating curve and glow do not communicate the observational bridge.
- Conservation laws should show conic motion, velocity/radius vectors, or swept geometry; two dots joined by a line suggests a binary rather than a conserved-orbit problem.
- Hydrostatic equilibrium should show local force balance in a stellar shell, not a generic glowing stellar core.

### P2: Visual style uses tokens, but not the style system's best vocabulary

The renderer uses `--topic-color` and celestial tokens, but it underuses chart/data tokens for plot-like demos and museum opacity tokens for background atmosphere. The result is a set of basic color choices that are technically token-based but not art-directed.

Topic color should be wayfinding trim, not the main scene identity. The signature should read from shape and observable first.

### P2: Motion is always-on for visible cards

The shared runtime correctly respects reduced motion and pauses offscreen thumbnails, but the museum site should feel mostly static and composed. A better default is slow, low-amplitude motion with hover/focus emphasis, or a subtle loop that does not compete with card scanning.

## Recommended Thumbnail Contract

Each demo thumbnail should satisfy these constraints:

1. One observable: the thumbnail shows one thing the demo teaches, not a mini collage.
2. One signature silhouette: the image is identifiable as a still frame.
3. Physical honesty: if a visual exaggeration is used, it must preserve the relevant relationship.
4. Token-first color: use celestial tokens for objects, chart/data tokens for plots, and Aurora Ink accents for emphasis.
5. Reduced-motion parity: the frozen state should be an intentional explanatory frame.
6. No text dependency: card text carries the accessible name; the visual must not require labels to avoid being misleading.

## Per-Demo Signature Recommendations

| Demo | Recommended animated signature |
| --- | --- |
| `keplers-laws` | Eccentric ellipse with the star at one focus, planet moving faster near perihelion, and a faint equal-area wedge pulsing over equal time steps. |
| `binary-orbits` | Two unequal stars orbiting a visible barycenter cross, with unequal orbit radii and a tiny paired radial-velocity sine trace beneath. |
| `retrograde-motion` | Split composition: heliocentric geometry on one side, sky-longitude trace on the other with a clear backward loop near opposition. |
| `planetary-conjunctions` | Two circular heliocentric orbits; Earth, target, and Sun periodically align, with a brief alignment ray only at conjunction. |
| `moon-phases` | Moon disk cycling through crescent/quarter/gibbous with a true terminator ellipse and a fixed Sun-direction cue. |
| `seasons` | Earth orbiting the Sun while the axis stays fixed in space; daylight band/illuminated hemisphere changes through the year. |
| `eclipse-geometry` | Sun-Moon-Earth syzygy plus tilted lunar orbit nodes; shadow/target highlight appears only when Moon is near a node. |
| `angular-size` | Observer apex with tangent rays to an object disk; object distance/diameter pulse so the apparent cone visibly changes. |
| `parallax-distance` | Two Earth baseline positions with sightlines to a nearby star shifting against fixed background stars; small A/B detector blink. |
| `em-spectrum` | Log-like wavelength strip with a wave whose wavelength changes across the band, making scale/frequency the core observable. |
| `spectral-lines` | Bohr-style electron transition flash feeding discrete vertical emission lines; visible lines remain sharp and sparse. |
| `doppler-shift` | Two stacked spectrum strips: rest lines fixed, observed lines sliding red/blue together; optional uniform wave above, not sound-style ripples. |
| `blackbody-radiation` | Planck-like curve whose peak shifts blueward and upward as temperature rises, with a small visible-band strip beneath. |
| `telescope-resolution` | Binary-star PSF morphing from one blended spot to two Airy disks; rings make it unmistakably telescope/resolution. |
| `conservation-laws` | Particle on conic orbit around central mass with velocity arrow and sweeping radius vector; optional open conic frame for escape. |
| `galaxy-rotation` | Face-on disk with blue/red slit plus a compact flat rotation curve; faint halo grows as the curve flattens. |
| `hydrostatic-equilibrium-explorer` | Stellar shell cutaway with inward gravity arrows and outward pressure-gradient arrows balanced at a highlighted radius. |
| `stars-zams-hr` | H-R diagram with hot-left/luminous-up orientation implied by a descending ZAMS; marker glides along the sequence. |
| `eos-lab` | Log T-log rho regime map with gas/radiation/degeneracy domains; moving point crosses boundaries while a stacked pressure bar rebalances. |

## Implementation Recommendation

Do not keep expanding the current generic renderer. It is already doing too much in one component.

Recommended implementation path:

1. Keep `DemoCanvasThumbnail.astro` as the Astro wrapper/runtime owner.
2. Replace scene-family routing with one renderer function per slug or a `signatureBySlug` table whose values are concrete drawing functions.
3. Add a small shared drawing toolkit inside the component or a nearby module:
   - token resolver
   - alpha helper
   - plate/background
   - glow dot
   - line/path helpers
   - chart axes helper
   - arrow/vector helper
   - phase/static-time helper
4. Add tests that assert every published demo slug has a distinct signature key and that known physics-critical signatures include required drawing markers in source.
5. Run Playwright visual QA on `/cosmic-playground/explore/` in normal and reduced-motion modes.

## Acceptance Criteria For The Next Pass

- Every demo card has a unique `data-signature` matching its slug-level concept.
- No four-demo orbit bucket, no three-demo spectrum bucket, no generic geometry bucket for angular size/parallax.
- Reduced-motion thumbnails draw static snapshots with the same signature elements.
- `corepack pnpm build` passes.
- Targeted Playwright tests pass for signature metadata, reduced-motion behavior, and Explore rendering.
- Visual QA screenshots show the grid as calm, varied, and consistent with Aurora Ink rather than saturated/basic.

## Risks

- A fully per-demo renderer is more code than generic scene families. The risk is worth accepting because the generic renderer is failing the pedagogical contract.
- Some visualizations require exaggeration to fit a small thumbnail. Exaggeration is acceptable only when it preserves the relevant relationship and does not imply false causality.
- If all thumbnails animate constantly, the Explore page may feel busy. Prefer slow loops and hover/focus emphasis where possible.
