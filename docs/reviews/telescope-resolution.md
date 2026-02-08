# Telescope Resolution -- Physics Review

**Reviewer:** Claude Opus 4.6 (automated physics audit)
**Date:** 2026-02-07
**Files reviewed:**
- `packages/physics/src/telescopeResolutionModel.ts`
- `packages/physics/src/units.ts` (unit conversions)
- `apps/demos/src/demos/telescope-resolution/logic.ts`
- `apps/demos/src/demos/telescope-resolution/main.ts`

## Summary

The telescope resolution demo correctly implements the Rayleigh diffraction limit, Airy pattern (PSF) rendering, seeing-limited and AO-corrected effective resolution, and binary star resolution classification. The physics model uses `TelescopeResolutionModel` from `@cosmic/physics` with unit conversions through `AstroUnits`. The Bessel $J_1$ approximation uses the Numerical Recipes rational polynomial form, verified against known constants ($3\pi/4$, $2/\pi$). The atmosphere model uses a pedagogically clear two-regime approach: pure Airy (space/no atmosphere) or pure Gaussian (ground/atmosphere), rather than a convolved Airy+Gaussian PSF. This is an acceptable simplification for teaching. No physics errors were found.

## Physics Equations Verified

| Equation | Implementation | Reference Value | Status |
|----------|---------------|-----------------|--------|
| Rayleigh criterion: $\theta = 1.22\,\lambda / D$ | `diffractionLimitRadFromWavelengthCmAndApertureCm()` line 72 | Hubble at 550 nm: 0.0577 arcsec (matches published 0.058") | CORRECT |
| Airy pattern: $I(x) = (2 J_1(x) / x)^2$ | `airyIntensityNormalizedFromX()` lines 47--53 | $I(0) = 1$, $I(3.8317) \approx 0$ (first $J_1$ zero) | CORRECT |
| Airy variable: $x = \pi D \theta / \lambda$ | `airyIntensityNormalizedFromThetaRad()` line 63 | Small-angle form of $\pi D \sin\theta / \lambda$ | CORRECT |
| Bessel $J_1$ rational polynomial | `besselJ1Approx()` lines 13--44 | Numerical Recipes coefficients; phase constant $3\pi/4 = 2.356194491$ and $\sqrt{2/\pi} = 0.636619772$ verified | CORRECT |
| Seeing-limited: $\theta_\text{eff} = \max(\theta_\text{diff}, \theta_\text{seeing})$ | `effectiveResolutionArcsec()` line 93 | Standard ground-based limit | CORRECT |
| AO-corrected: $\theta_\text{eff} = \max\!\bigl(\theta_\text{diff},\,\sqrt{\theta_\text{diff}^2 + (\theta_\text{seeing}(1-S))^2}\bigr)$ | Lines 96--101 | Strehl $S = 0.6$: eff = 0.403" for diff=0.05", seeing=1.0" | CORRECT |
| Gaussian FWHM to $\sigma$: $\sigma = \text{FWHM} / (2\sqrt{2\ln 2})$ | `drawPsf()` line 223 | $2\sqrt{2\ln 2} = 2.3548$ (exact) | CORRECT |
| Unit conversion: arcsec $\to$ rad | `AstroUnits.arcsecToRad()` via `degToRad(arcsec / 3600)` | $1" = \pi / 648000$ rad | CORRECT |
| Unit conversion: rad $\to$ arcsec | `AstroUnits.radToArcsec()` via `degToArcsec(radToDeg())` | Same chain, inverse | CORRECT |
| Resolution status thresholds | `resolutionStatusFromSeparationArcsec()` lines 104--118 | Resolved $\geq 1.0$, marginal $\geq 0.8$, unresolved $< 0.8$ (of $\theta_\text{eff}$) | CORRECT |

### Bessel $J_1$ Approximation Constants

| Constant | Code Value | Exact | Match |
|----------|-----------|-------|-------|
| $3\pi/4$ | 2.356194491 | 2.35619449019... | Yes (10 sig figs) |
| $2/\pi$ | 0.636619772 | 0.63661977236... | Yes (9 sig figs) |

## Rendering Chains Audited

### PSF Canvas Rendering (`drawPsf()`)

1. **Coordinate mapping:** Each pixel $(x, y)$ maps to angular offset $(\alpha, \delta)$ in arcsec via `xArcsec = ((x - centerX) / width) * fovArcsec`. The FOV is computed by `computeFovArcsec()` (at least 6x effective resolution or 3x binary separation, clamped to [0.4, 500] arcsec) then divided by zoom factor.

2. **Single/binary star geometry:** Binary stars are placed symmetrically at $\pm \text{separation}/2$ along the x-axis. Each pixel computes the angular distance $r$ to each star center via `Math.hypot()`.

3. **PSF selection:**
   - **Atmosphere OFF:** Pure Airy pattern via `airyIntensityNormalizedFromThetaRad()`. The angular offset is converted from arcsec to radians via `AstroUnits.arcsecToRad()`. This correctly produces the diffraction ring structure.
   - **Atmosphere ON:** Pure Gaussian via `exp(-0.5 * (r/sigma)^2)` where $\sigma = \text{FWHM} / (2\sqrt{2\ln 2})$ and FWHM = `thetaEffArcsec`. This is a pedagogical simplification -- real ground-based PSFs are Airy convolved with a Gaussian seeing disk, but the two-regime switch clearly demonstrates the concept.

4. **Intensity normalization:** `intensity = min(1, (i1 + i2) / 1.4)`. The 1.4 divisor reserves headroom so that binary overlap regions can reach full brightness while individual stars peak at $\sim 0.71$. This is a visualization choice, not a physics normalization.

5. **Gamma correction:** `pow(intensity, 0.45) * 255` approximates sRGB inverse gamma ($1/2.2 = 0.4545$), stretching faint Airy rings to be visible on screen.

6. **Scale bar:** Shows $\text{FOV}/4$ in arcsec at bottom-left. Correctly computed from `(barArcsec / fovArcsec) * width` pixels.

### Model Pipeline (`computeModel()`)

1. Aperture: `state.apertureM * AstroConstants.LENGTH.CM_PER_M` (= $\times 100$). Correct m-to-cm conversion.
2. Diffraction limit: `diffractionLimitArcsecFromWavelengthCmAndApertureCm(wavelengthCm, apertureCm)`. Both arguments in cm. Correct.
3. Effective resolution: Seeing is 0 when atmosphere is off, otherwise `state.seeingArcsec`. AO flag is gated on `state.includeAtmosphere && state.aoEnabled`. Correct.
4. Resolution status: Only computed when binary mode is enabled. Uses `separationArcsec / effectiveResolutionArcsec` ratio. Correct.

### Atmosphere Toggle Logic

- `useAtmosphereBlur` (line 380) is set to `state.includeAtmosphere`, so Airy vs. Gaussian rendering follows the user's atmosphere toggle.
- `blurFwhmArcsec` (line 390) is always `thetaEffArcsec`, which includes AO correction when active. This means the Gaussian width correctly reflects the AO-improved seeing.
- When atmosphere is ON but seeing < diffraction limit (unlikely for optical, possible at radio wavelengths), `effectiveResolutionArcsec` returns the diffraction limit, and the Gaussian PSF has FWHM = diffraction limit. The Gaussian shape is a mild inaccuracy here (should be Airy), but this extreme case is pedagogically unimportant.

## Issues Found

1. **Atmosphere ON renders pure Gaussian, losing Airy ring structure (pedagogical simplification, not a bug):** When atmosphere is enabled (even with AO at Strehl = 0.9), the PSF is rendered as a pure Gaussian rather than a convolved Airy + Gaussian. Real AO systems produce a sharp diffraction-limited core with residual seeing halo. The current two-regime model (pure Airy vs. pure Gaussian) is a deliberate teaching simplification that clearly communicates the seeing-limited vs. diffraction-limited regimes.

2. **Space telescope + atmosphere toggle (UX, not physics):** The code warns when a space-platform preset is selected with atmosphere enabled (line 397--399), but does not prevent it. This is appropriate -- it's a teaching moment, not a physical impossibility in the model.

No physics errors were found. All equations, units, unit conversions, and rendering chains are correct.
