# EM Spectrum -- Physics Review

**Reviewer:** Claude Opus 4.6 (automated physics audit)
**Date:** 2026-02-07
**Files reviewed:**
- `packages/physics/src/photonModel.ts` (core conversions)
- `packages/physics/src/astroConstants.ts` (fundamental constants)
- `packages/physics/src/units.ts` (unit conversion helpers)
- `apps/demos/src/demos/em-spectrum/logic.ts` (UI logic + band data)
- `apps/demos/src/demos/em-spectrum/main.ts` (rendering chain)

## Summary

The em-spectrum demo implements wavelength-frequency-energy conversions using CGS constants sourced from a single-source-of-truth constants file. All three fundamental photon relations (`c = lambda * nu`, `E = h * nu`, `E = hc / lambda`) are implemented correctly in `PhotonModel`. The EM band boundaries are physically reasonable and form a contiguous, gap-free partition of the spectrum. The unit formatting, log-scale position mapping, and spectral gradient are all consistent with the underlying physics.

## Physics Equations Verified

| Equation | Implementation | Reference Value | Status |
|----------|---------------|-----------------|--------|
| `nu = c / lambda` | `PhotonModel.frequencyHzFromWavelengthCm`: returns `C_CM_PER_S / wavelengthCm` | c = 2.99792458e10 cm/s (exact SI->CGS) | CORRECT |
| `lambda = c / nu` | `PhotonModel.wavelengthCmFromFrequencyHz`: returns `C_CM_PER_S / frequencyHz` | Inverse of above | CORRECT |
| `E = hc / lambda` | `PhotonModel.photonEnergyErgFromWavelengthCm`: returns `(H_ERG_S * C_CM_PER_S) / wavelengthCm` | h = 6.62607015e-27 erg*s (exact SI->CGS) | CORRECT |
| `lambda = hc / E` | `PhotonModel.wavelengthCmFromPhotonEnergyErg`: returns `(H_ERG_S * C_CM_PER_S) / energyErg` | Inverse of above | CORRECT |
| `E = h * nu` | `PhotonModel.photonEnergyErgFromFrequencyHz`: returns `H_ERG_S * frequencyHz` | Direct Planck relation | CORRECT |
| `nu = E / h` | `PhotonModel.frequencyHzFromPhotonEnergyErg`: returns `energyErg / H_ERG_S` | Inverse of above | CORRECT |
| `1 eV = 1.602176634e-12 erg` | `AstroConstants.PHOTON.ERG_PER_EV = 1.602176634e-12` | NIST exact (2019 SI redefinition) | CORRECT |
| `EV_PER_ERG = 1 / ERG_PER_EV` | Derived at module init: `PHOTON.EV_PER_ERG = 1 / PHOTON.ERG_PER_EV` | Consistent inverse | CORRECT |
| `1 nm = 1e-7 cm` | `AstroConstants.PHOTON.CM_PER_NM = 1e-7` | Definition | CORRECT |
| `NM_PER_CM = 1 / CM_PER_NM` | Derived at module init: `PHOTON.NM_PER_CM = 1 / PHOTON.CM_PER_NM` = 1e7 | Consistent inverse | CORRECT |

### Known-answer spot checks (manually computed)

| Test | Expected | Implementation |
|------|----------|---------------|
| 500 nm -> freq | c / (500e-7 cm) = 5.996e14 Hz | `frequencyHzFromWavelengthNm(500)` ~ 5.996e14 Hz | CORRECT |
| 500 nm -> energy | hc / (500e-7) = 3.973e-12 erg = 2.480 eV | `photonEnergyEvFromWavelengthNm(500)` ~ 2.48 eV | CORRECT |
| 21 cm -> freq | c / 21 = 1.428e9 Hz = 1.428 GHz | Consistent with HI 21-cm line (1420 MHz) | CORRECT |

## EM Band Boundaries Verified

| Band | lambda_min (cm) | lambda_max (cm) | Physical meaning | Status |
|------|----------------|----------------|------------------|--------|
| Radio | 1e-1 (1 mm) | 1e6 (10 km) | Conventional: > 1 mm | CORRECT |
| Microwave | 1e-2 (0.1 mm) | 1e-1 (1 mm) | Conventional: 0.1-1 mm | CORRECT |
| Infrared | 7e-5 (700 nm) | 1e-2 (0.1 mm) | Red edge of visible to microwave | CORRECT |
| Visible | 3.8e-5 (380 nm) | 7e-5 (700 nm) | Standard human vision range | CORRECT |
| Ultraviolet | 1e-6 (10 nm) | 3.8e-5 (380 nm) | Violet edge to soft X-ray | CORRECT |
| X-ray | 1e-9 (0.01 nm) | 1e-6 (10 nm) | Conventional X-ray range | CORRECT |
| Gamma | 1e-13 (~1 fm) | 1e-9 (0.01 nm) | Shortest wavelengths | CORRECT |

**Band contiguity:** Adjacent bands share exact boundary values (e.g., `radio.lambdaMinCm === microwave.lambdaMaxCm`). No gaps or overlaps exist. The `bandFromWavelengthCm` function gives priority to "visible" at boundaries (380 nm and 700 nm map to visible), which is a reasonable teaching convention.

**Band center computation:** Uses geometric mean `sqrt(lambdaMin * lambdaMax)`, which is correct for log-scale distributions. This ensures the center falls at the midpoint on the log-scale slider.

## Unit Scaling Verified

| Conversion | Factor | Implementation | Status |
|------------|--------|---------------|--------|
| cm -> km | / 1e5 | `formatWavelength`: `lambdaCm / 1e5` when >= 1e5 | CORRECT |
| cm -> m | / 100 | `formatWavelength`: `lambdaCm / 100` when >= 100 | CORRECT |
| cm -> mm | * 10 | `formatWavelength`: `lambdaCm * 10` when >= 0.1 | CORRECT |
| cm -> um | / 1e-4 | `formatWavelength`: `lambdaCm / 1e-4` when >= 1e-4 | CORRECT |
| cm -> nm | / 1e-7 | `formatWavelength`: `lambdaCm / 1e-7` when >= 1e-7 | CORRECT |
| cm -> pm | / 1e-10 | `formatWavelength`: `lambdaCm / 1e-10` when >= 1e-10 | CORRECT |
| cm -> fm | / 1e-13 | `formatWavelength`: `lambdaCm / 1e-13` (fallback) | CORRECT |
| Hz -> kHz/MHz/GHz/THz/PHz/EHz | standard SI prefixes | `formatFrequency` thresholds at 1e3/1e6/1e9/1e12/1e15/1e18 | CORRECT |
| erg -> eV/keV/MeV | via DI callback | `formatEnergyFromErg` thresholds at 1e-3/1e3/1e6 eV | CORRECT |

## Rendering Chains Audited

### Slider -> wavelength -> readouts chain
1. Slider value (0-1000 integer) is converted to position percent: `pos = (value / 1000) * 100`
2. Position percent is converted to wavelength: `positionPercentToWavelengthCm(pos)` using inverse log mapping
3. Wavelength is used to compute frequency via `PhotonModel.frequencyHzFromWavelengthCm(lambdaCm)`
4. Wavelength is used to compute energy via `PhotonModel.photonEnergyErgFromWavelengthCm(lambdaCm)`
5. Energy in erg is converted to eV via `AstroUnits.ergToEv` for display
6. All three quantities are formatted with auto-scaling unit selection

**Round-trip consistency:** `positionPercentToWavelengthCm(wavelengthToPositionPercent(lambda))` is verified by tests to round-trip for visible, radio, and X-ray wavelengths.

### Convert panel chain
1. User enters wavelength (nm), frequency (Hz), or energy (eV)
2. The "source" input drives computation of the other two via `PhotonModel` nm/Hz/eV convenience methods
3. A mutex lock (`convertLock`) prevents circular updates
4. All conversions flow through the same `PhotonModel` functions used by the main readouts

### Log-scale position mapping
- `LAMBDA_MIN_LOG = -12` (10 fm), `LAMBDA_MAX_LOG = 6` (10 km): spans 18 orders of magnitude
- Position 0% = radio end (longest), 100% = gamma end (shortest): `pos = 100 - ((log10(lambda) - (-12)) / 18) * 100`
- This is a correct log-linear mapping with the convention that shorter wavelengths are on the right

### Spectral gradient
- The gradient uses 17 hex color stops from dark maroon (radio) through the visible rainbow (red-orange-yellow-green-cyan-blue-indigo) to deep purple/black (gamma)
- Visible spectrum colors are positioned around 32-55% which corresponds roughly to the 380-700 nm range on the 18-decade log scale
- The exact position of 550 nm (visible green) on this scale: `100 - ((log10(5.5e-5) - (-12)) / 18) * 100` = 100 - (7.74/18)*100 = 57%. The gradient places green at 44%, which is reasonable given that the gradient is an artistic approximation of spectral colors, not a physically precise colorimetric mapping.

### Chirp wave overlay
- Exponential frequency sweep from 3 to 60 cycles: `localFreq = 3 * (60/3)^t` where t = x/width
- Phase accumulation via numerical integration: `phase += localFreq * (1/width) * 2*pi`
- This produces a visually correct chirp where wavelength decreases (frequency increases) from left to right, matching the EM spectrum convention

## Issues Found

None. All physics equations, constants, unit conversions, band boundaries, and rendering chains are correct.
