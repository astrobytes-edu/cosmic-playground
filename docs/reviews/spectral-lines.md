# Physics Review — spectral-lines

**Date:** 2026-09-03
**Reviewer:** adversarial physics audit (full chain: model → logic.ts → main.ts → interaction → model)
**Verdict:** One **P1 constant error found and fixed**. Several presentation defects remain open.

## Findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| SL-1 | **P1** | **fixed** | `spectralLineModel.ts:25` used `RYDBERG_EV = 13.605693` — the *Rydberg energy* `R∞hc` for an infinitely heavy nucleus — and mislabelled it "ionization energy of hydrogen" (13.598435 eV). Missing the reduced-mass factor `μ/mₑ = 0.9994566` made every hydrogen wavelength **0.054% short**: Hα = 656.112 nm against 656.461 nm vacuum. Corrected to `R_H`; the model now reproduces reference vacuum wavelengths to better than 0.01 nm, the residual being the Bohr model itself. |
| SL-2 | **P1** | **fixed** | The benchmark tests used `toBeCloseTo(656.3, 0)` — a ±0.5 nm window, roughly **3× the error above**, so SL-1 shipped green. Tolerances are now ±0.02 nm and a dedicated test asserts the value is *not* the `R∞` one. |
| SL-3 | P2 | **fixed** | Element catalogue wavelengths are *air* values (Na D 589.0/589.6, Ca II 393.4/396.8, He I 587.6, all 34 Fe I lines) but were described as vacuum in `spectralLineModel.ts:14`, `logic.ts:559`, and `index.html:540`. `packages/data-spectra/src/atomicLines.ts` already carries `medium:` per entry — that is the pattern to follow. |
| SL-4 | P2 | open | On-screen self-contradiction: `index.html:395` states the Balmer limit as 364.6 nm while the canvas label at `main.ts:712` computes and prints a different value. After SL-1 the correct vacuum value is 364.70 nm; update both. |
| SL-5 | P2 | open | Line strengths are ad hoc but presented as NIST data. `main.ts:1142` uses `1/(Δn+1)`, giving Hα:Hβ:Hγ:Hδ = 0.50:0.33:0.25:0.20 against Case-B 1.00:0.35:0.16:0.09, and makes Lyα equal to Hα. `spectralLineModel.ts:463` uses a *different* set for the same element. Both drive drawn line width under a caption citing "the NIST Atomic Spectra Database". Either derive from real relative intensities or drop the NIST attribution. |
| SL-6 | P2 | open | The Balmer-strength proxy (`spectralLineModel.ts:409-411`) hard-zeros above 17,000 K and below 4,500 K on a 4,000–20,000 K slider, so it reads exactly `0.000` across ~20% of its own range. B stars have strong Balmer absorption. It is labelled "ionization balance" but contains no Saha physics. Credit where due: it does peak near 10,000 K, close to the real ~9,500 K maximum. |

## Verified correct

Bohr energy algebra, `g_n = 2n²`, the energy-diagram y-sign, series-limit microscope geometry, and the Fe I wavelengths. No SI leakage. No reachable numerical hazard.
