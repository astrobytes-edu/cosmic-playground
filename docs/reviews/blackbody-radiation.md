# Blackbody Radiation -- Physics Review

**Reviewer:** Claude Opus 4.6 (automated physics audit)
**Date:** 2026-02-07
**Files reviewed:**
- `packages/physics/src/blackbodyRadiationModel.ts`
- `apps/demos/src/demos/blackbody-radiation/logic.ts`
- `apps/demos/src/demos/blackbody-radiation/main.ts`

## Summary

The blackbody radiation demo correctly implements Planck's spectral radiance law, Wien's displacement law, and Stefan-Boltzmann luminosity scaling. All physics equations are implemented in the `BlackbodyRadiationModel` (physics layer), with no inline physics in the demo code. The Canvas plot uses a log-scale wavelength axis with consistent mapping between curve rendering and tick/marker positioning. One minor edge case: the CMB preset (2.725 K) has a Wien peak at ~1.06 mm, which is 6.3% beyond the plot domain maximum of 1 mm (1e6 nm), so the peak marker is clipped off the right edge.

## Physics Equations Verified

| Equation | Implementation | Reference Value | Status |
|----------|---------------|-----------------|--------|
| Planck spectral radiance: $B_\lambda = \frac{2hc^2}{\lambda^5} \cdot \frac{1}{e^{hc/(\lambda k T)} - 1}$ | `planckSpectralRadianceCgs()` lines 34--47 | Standard form (Rybicki & Lightman eq. 1.51) | CORRECT |
| Wien displacement: $\lambda_\text{peak} = b / T$ | `wienPeakCm()` line 25, `wienPeakNm()` line 31 | $b = 0.2898$ cm K (NIST: 0.28978 cm K, 0.008% error) | CORRECT |
| Stefan-Boltzmann flux: $F = \sigma T^4$ | `stefanBoltzmannFluxCgs()` line 52 | $\sigma = 5.67 \times 10^{-5}$ erg s$^{-1}$ cm$^{-2}$ K$^{-4}$ (NIST: $5.6704 \times 10^{-5}$, 0.007% error) | CORRECT |
| Luminosity ratio (same $R$): $L/L_\text{ref} = (T/T_\text{ref})^4$ | `luminosityRatioSameRadius()` lines 55--61 | $2T_\odot \to L/L_\odot = 16$ (exact) | CORRECT |
| Exponent overflow guard: clip to 0 when $hc/(\lambda kT) > 700$ | Line 44 | $e^{700} \approx 10^{304}$, near float64 max | CORRECT |

### Physical Constants (CGS)

| Constant | Model Value | NIST 2018 Exact | Relative Error |
|----------|-------------|-----------------|----------------|
| $c$ (cm/s) | $2.998 \times 10^{10}$ | $2.99792458 \times 10^{10}$ | 0.0025% |
| $h$ (erg s) | $6.626 \times 10^{-27}$ | $6.62607015 \times 10^{-27}$ | 0.0011% |
| $k$ (erg/K) | $1.381 \times 10^{-16}$ | $1.380649 \times 10^{-16}$ | 0.025% |
| $\sigma$ (erg s$^{-1}$ cm$^{-2}$ K$^{-4}$) | $5.67 \times 10^{-5}$ | $5.670374 \times 10^{-5}$ | 0.007% |
| $b_\text{Wien}$ (cm K) | $0.2898$ | $0.2897772$ | 0.008% |

All constants are within 0.03% of NIST values -- appropriate precision for a teaching demo.

**Note:** `BlackbodyRadiationModel` maintains its own copy of $c$, $h$, $k$ (lines 4--8) separate from the centralized `AstroConstants`. The values are consistent to within rounding of the last digit. This is a minor code-hygiene observation, not a physics error.

## Rendering Chains Audited

### Planck Curve on Canvas

1. **Wavelength sampling:** `sampleLogSpace(10, 1e6, 500)` generates 500 log-spaced points from 10 nm to 1 mm. Each sample is passed to `planckSpectralRadianceCgs()` with wavelength converted via `nm * nmToCm` (= `nm * 1e-7`).

2. **Log-scale x-axis:** Curve points use `x = mL + (i / (N-1)) * plotW` where samples are log-spaced. Tick marks and peak markers use `nmToX()` which calls `wavelengthToLogFraction()`. Both produce identical x-positions for the same wavelength because `logFrac(sampleLogSpace[i]) = i/(N-1)` by construction. **Verified: axes are mutually consistent.**

3. **Y-axis modes:**
   - **Log mode:** 6-decade dynamic range below peak. Y = `(log10(B) - (log10(B_max) - 6)) / 6`. Tick labels show "peak, -1, -2, ..., -6".
   - **Linear mode:** Y = `B / B_max`. Tick labels show 0.0 to 1.0.
   Both correctly normalize to the curve's own peak (relative intensity).

4. **Spectral gradient fill:** Uses `wavelengthToApproxRgb()` (Dan Bruton piecewise-linear approximation, 380--750 nm). UV and IR regions rendered as dim tinted strips. Gradient stops are placed via `wavelengthToLogFraction()`, consistent with the x-axis.

5. **EM band bar:** Rendered as 200 thin vertical strips at the bottom, each colored by `wavelengthToApproxRgb()`. Non-visible regions appear as dark strips. Peak marker (triangle + vertical line) correctly uses `nmToX()`.

### Readout Panel

- Peak wavelength: `wienPeakNm()` -> `formatWavelengthReadout()` (auto-selects nm/um/mm).
- Luminosity ratio: `luminosityRatioSameRadius()` with default reference $T_\odot = 5772$ K.
- Star color circle: `temperatureToRgbApprox()` (perceptual approximation, not CIE colorimetry -- documented).
- Spectral class: piecewise boundaries (O/B/A/F/G/K/M/L+) -- standard teaching-level classification.

## Issues Found

1. **CMB peak clipped at plot boundary (minor, cosmetic):** Wien peak at $T = 2.725$ K is $\lambda_\text{peak} = 1.063$ mm = $1.063 \times 10^6$ nm, but the plot domain ends at $10^6$ nm = 1 mm. The peak marker falls 6.3% beyond the right edge and is not rendered. The rising portion of the Planck curve is visible but the peak itself is off-screen. Extending `maxNm` to $2 \times 10^6$ would show the CMB peak, but this would also add empty space for all higher-temperature presets. The current trade-off is reasonable.

2. **Duplicate physical constants (code hygiene, not physics):** `BlackbodyRadiationModel.CONSTANTS` (lines 3--17) defines its own `cCmPerS`, `hErgS`, `kErgPerK` with 4 significant figures, while the centralized `AstroConstants.PHOTON` uses 9-digit exact SI values. For a physics model, importing from the single source of truth (`AstroConstants`) would be cleaner. The numerical impact is negligible (< 0.03% on any output).

No physics errors were found. All equations, units, and rendering chains are correct.
