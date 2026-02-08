# Parallax Distance — Physics Review

**Reviewer**: Claude Opus 4.6 (automated physics audit)
**Date**: 2026-02-07
**Files reviewed**:
- `packages/physics/src/parallaxDistanceModel.ts` (core model)
- `packages/physics/src/parallaxDistanceModel.test.ts` (9 physics tests)
- `apps/demos/src/demos/parallax-distance/logic.ts` (pure UI logic)
- `apps/demos/src/demos/parallax-distance/logic.test.ts` (27 logic tests)
- `apps/demos/src/demos/parallax-distance/main.ts` (DOM wiring + SVG rendering)
- `apps/demos/src/demos/parallax-distance/index.html` (SVG structure + readouts)
- `apps/demos/src/demos/parallax-distance/style.css` (visual tokens)
- `packages/data-astr101/src/starsNearby.ts` (preset star data)

## Summary

The physics implementation is correct throughout the full chain. The parsec definition d = 1/p is implemented faithfully, unit conversions are accurate (mas-to-arcsec, pc-to-ly), and the SVG diagram geometry correctly represents the parallax triangle with the baseline as Earth's orbital diameter (2 AU) and 2p as the full angular shift. The exaggeration/clamping scheme for visualization is well-designed and mathematically sound. One minor gap: the demo displays SNR = p/sigma\_p but does not propagate to fractional distance uncertainty sigma\_d/d = sigma\_p/p. One function (`describeMeasurability`) is exported and tested but never called in the demo.

## Physics Equations Verified

| Equation | Implementation | Reference | Status |
|----------|---------------|-----------|--------|
| d(pc) = 1 / p(arcsec) | `parallaxDistanceModel.ts:21` | Standard parsec definition (IAU) | CORRECT |
| d(pc) = 1000 / p(mas) | `parallaxDistanceModel.ts:27` — divides 1000/mas directly | Equivalent: 1 arcsec = 1000 mas | CORRECT |
| p(arcsec) = 1 / d(pc) | `parallaxDistanceModel.ts:33` | Inverse of parsec definition | CORRECT |
| p(mas) = 1000 / d(pc) | `parallaxDistanceModel.ts:39` | Inverse with mas conversion | CORRECT |
| 1 pc = 3.26156 ly | `parallaxDistanceModel.ts:12` constant `PC_TO_LY` | IAU standard: 3.26156 ly/pc | CORRECT |
| SNR = p / sigma\_p | `logic.ts:21` | Standard signal-to-noise ratio | CORRECT |
| p(arcsec) = p(mas) / 1000 | `main.ts:187` and `logic.ts:44` | Definition of milliarcsecond | CORRECT |
| p(rad) = p(arcsec) \* pi / (180 \* 3600) | `logic.ts:45` | arcsec-to-radian conversion | CORRECT |
| Diagram: starDist = (baseline/2) / tan(halfAngle) | `logic.ts:60` | Right-triangle geometry at star vertex | CORRECT |
| Arc half-angle = atan((baseline/2) / perpDist) | `main.ts:167` | Reconstructs visual angle from pixel geometry | CORRECT |
| Non-positive parallax returns Infinity | `parallaxDistanceModel.ts:20,26` | Physically: unmeasurable distance | CORRECT |

## Rendering Chains Audited

### Physics model to readouts

```
Input slider (1..1000 mas)
  -> currentInputs() clamps to [1, 1000]
  -> pArcsec = parallaxMas / 1000
  -> dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(parallaxMas)  [= 1000/mas]
  -> dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc)  [= dPc * 3.26156]
  -> snr = signalToNoise(parallaxMas, sigmaMas)  [= p/sigma_p]
  -> Readout displays: p(arcsec), d(pc), d(ly), SNR
```

All four readouts trace cleanly from the model with no intermediate rounding or unit errors.

### Physics model to SVG diagram

```
Input parallaxMas
  -> diagramHalfAngle(parallaxMas, exaggeration=6000):
       pArcsec = mas/1000
       pRad = pArcsec * pi / (180*3600)
       raw = pRad * 6000
       halfAngle = clamp(raw, 0.02, 0.34 rad)
  -> diagramStarY(baselineY=420, baselineLen=320, halfAngle):
       starY = 420 - (320/2) / tan(halfAngle)
       clamp starY >= 80 (top of SVG)
  -> SVG elements:
       baseline: horizontal line at y=420, width=320 px
       earthA, earthB: at baseline endpoints
       star: at (cx=450, starY)
       rayA, rayB: from star to each earth position
       angleArc: arc centered at star, spanning 2*half about the downward direction
       angleLabel: "2p (exaggerated)"
       clampNote: displayed when clamping is active
```

**Geometry correctness**: The triangle has the baseline (representing 2 AU) at the bottom, with two sightlines converging at the star above. The angle at the star vertex is 2p (the full parallax shift). The exaggeration factor of 6000 maps the true parallax angle to a visible SVG angle while preserving proportional scaling within the unclamped range. Clamping to [0.02, 0.34] rad prevents the star from going off-canvas or the triangle from collapsing to a line.

**SVG coordinate convention**: y-down in SVG means subtracting the perpendicular distance places the star above the baseline. The arc is drawn using standard polar coordinates with `polarToCartesian(cx + r*cos, cy + r*sin)`, centered on the star. The "downward" direction in SVG is angle pi/2 (since sin(pi/2)=1, positive y). The arc sweeps symmetrically about pi/2, which correctly points toward the baseline. No sign bugs.

### Preset star data

| Star | p (mas) | Expected d (pc) | Computed d (pc) | Known d (pc) | Status |
|------|---------|-----------------|-----------------|--------------|--------|
| Proxima Centauri | 768.5 | 1.301 | 1.301 | 1.301 | CORRECT |
| Barnard's Star | 548.3 | 1.824 | 1.824 | 1.834 | ACCEPTABLE (teaching approximation) |
| Sirius | 379.2 | 2.637 | 2.637 | 2.637 | CORRECT |
| Vega | 130.2 | 7.680 | 7.680 | 7.68 | CORRECT |

Preset values are order-of-magnitude correct and appropriate for a teaching demo.

## Issues Found

### Minor (no physics errors, suggestions only)

1. **Dead code**: `describeMeasurability()` in `logic.ts` (lines 28-34) is exported and has 6 test cases but is never called anywhere in `main.ts`. It could be surfaced in the UI as a qualitative readout label (e.g., "Measurement quality: Good") or removed to reduce dead code.

2. **No explicit distance uncertainty readout**: The demo displays SNR = p/sigma\_p but does not show the implied fractional distance error sigma\_d/d = 1/SNR or the absolute uncertainty sigma\_d = d^2 * sigma\_p (in appropriate units). For a teaching demo about why small parallax angles are hard to measure, showing sigma\_d would strengthen the pedagogical message. This is a feature suggestion, not a bug.

3. **Baseline label precision**: The HTML label says "Baseline (Jan - Jul): 2 AU (schematic)" which is correct -- the full orbital diameter is 2 AU, and the parallax angle p is defined as the half-angle subtended by 1 AU. The label and the "2p (exaggerated)" angle label are consistent with the standard definition.

4. **Input range**: The slider range (1-1000 mas) covers d = 1-1000 pc, which spans the nearby stellar neighborhood well but does not reach Gaia's full range (~0.01 mas for distant stars). This is appropriate for an introductory teaching tool.

### None (physics errors)

No physics errors, sign bugs, unit mismatches, or rendering convention issues were found. The full chain from model through logic to SVG output is correct.
