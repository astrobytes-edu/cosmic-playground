# blackbody-radiation Migration Parity Audit

## 1) Behavior parity
- Core behavior remains centered on blackbody fundamentals: Planck-curve rendering, Wien peak marker, visible-band highlight, and fixed-radius luminosity ratio readout.
- Existing preset and slider workflows remain unchanged relative to the prior instrument version.

## 2) Visual/interaction parity
- Added top-level stage tabs (`Explore`, `Understand`) using shared runtime tab semantics.
- No structural control-panel rewrite was applied; existing layout and readout placement are preserved.

## 3) Export parity
- Export format remains `ExportPayloadV1` and continues to report temperature, intensity scale, peak wavelength, luminosity ratio (same radius), and approximate color/spectral class.

## 4) Pedagogical parity
- Demo remains suitable for Astro 101 thermal-radiation instruction while adding an `Understand` surface for misconception framing.
- Stellar structure and high-fidelity ZAMS inference are intentionally separated into `stars-zams-hr`.

## 5) Intentional deltas
- Added `Explore`/`Understand` tabs as a UX affordance without changing blackbody core modeling assumptions.
- Clarified product split: blackbody instrument stays thermal-first; advanced stellar inference is moved to a dedicated Stars instrument.

## 6) Promotion recommendation
- Current recommendation: `experimental` pending full end-to-end QA on tabs accessibility and classroom pilot feedback.
