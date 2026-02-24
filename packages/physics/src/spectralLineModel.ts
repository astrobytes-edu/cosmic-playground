/**
 * SpectralLineModel
 *
 * Physics model for atomic spectral lines and the Bohr atom.
 *
 * Hydrogen energy levels are computed exactly from the Bohr formula:
 *   E_n = -RYDBERG_EV / n²
 *
 * Multi-element line data is empirical (NIST Atomic Spectra Database).
 *
 * Units policy:
 *   - wavelengths: nm (vacuum)
 *   - energies: eV
 *   - frequencies: Hz
 *   - radii: nm
 *   - temperatures: K
 */

import { AstroConstants } from "./astroConstants";

// ── Constants ──────────────────────────────────────────────

const BOHR = {
  /** Rydberg energy (eV) — ionization energy of hydrogen from n=1 */
  RYDBERG_EV: 13.605693,               // NIST CODATA 2018
  /** Bohr radius a₀ (nm) */
  A0_NM: 0.052918,                      // NIST CODATA 2018
  /** hc product (eV·nm) for λ = hc/E conversions */
  HC_EV_NM: 1239.842,                   // derived from CODATA 2018 h, c
  /** Boltzmann constant (eV/K) */
  KB_EV_PER_K: 8.617333e-5,             // NIST CODATA 2018
  /** Speed of light (cm/s) — for Hz conversions via PhotonModel interop */
  C_CM_PER_S: AstroConstants.PHOTON.C_CM_PER_S,
  /** Planck constant (erg·s) */
  H_ERG_S: AstroConstants.PHOTON.H_ERG_S,
} as const;

// ── Series names ───────────────────────────────────────────

const SERIES_NAMES: Record<number, string> = {
  1: "Lyman",
  2: "Balmer",
  3: "Paschen",
  4: "Brackett",
  5: "Pfund",
  6: "Humphreys",
};

// ── Types ──────────────────────────────────────────────────

export interface TransitionRecord {
  nUpper: number;
  nLower: number;
  wavelengthNm: number;
  energyEv: number;
  frequencyHz: number;
  seriesName: string;
}

export type InferenceQuality = "exact" | "near" | "low-confidence";

export interface HydrogenTransitionInference {
  nUpper: number;
  nLower: number;
  wavelengthNm: number;
  energyEv: number;
  frequencyHz: number;
  seriesName: string;
  residualNm: number;
  quality: InferenceQuality;
}

export interface HydrogenPopulationProxy {
  temperatureK: number;
  n1Fraction: number;
  n2Fraction: number;
  n3Fraction: number;
  neutralHydrogenFractionProxy: number;
  balmerStrengthProxy: number;
}

export interface ElementLineEntry {
  wavelengthNm: number;
  relativeIntensity: number;
  label?: string;
}

export interface ElementLineData {
  symbol: string;
  name: string;
  lines: ElementLineEntry[];
}

export type ElementLineDetail = "standard" | "dense";

// ── Multi-element empirical data (NIST ASD) ────────────────

const ELEMENT_CATALOG: Record<string, ElementLineData> = {
  H: {
    symbol: "H",
    name: "Hydrogen",
    lines: [] // populated dynamically from Bohr model
  },
  He: {
    symbol: "He",
    name: "Helium",
    lines: [
      { wavelengthNm: 388.9, relativeIntensity: 0.45, label: "He I 388.9" },
      { wavelengthNm: 447.1, relativeIntensity: 0.35, label: "He I 447.1" },
      { wavelengthNm: 471.3, relativeIntensity: 0.25, label: "He I 471.3" },
      { wavelengthNm: 501.6, relativeIntensity: 0.40, label: "He I 501.6" },
      { wavelengthNm: 587.6, relativeIntensity: 1.00, label: "He I D₃ 587.6" },
      { wavelengthNm: 667.8, relativeIntensity: 0.55, label: "He I 667.8" },
      { wavelengthNm: 706.5, relativeIntensity: 0.30, label: "He I 706.5" },
    ]
  },
  Na: {
    symbol: "Na",
    name: "Sodium",
    lines: [
      { wavelengthNm: 330.2, relativeIntensity: 0.30, label: "Na I 330.2" },
      { wavelengthNm: 568.8, relativeIntensity: 0.20, label: "Na I 568.8" },
      { wavelengthNm: 589.0, relativeIntensity: 1.00, label: "Na D₂ 589.0" },
      { wavelengthNm: 589.6, relativeIntensity: 0.95, label: "Na D₁ 589.6" },
    ]
  },
  Ca: {
    symbol: "Ca",
    name: "Calcium",
    lines: [
      { wavelengthNm: 393.4, relativeIntensity: 1.00, label: "Ca II K 393.4" },
      { wavelengthNm: 396.8, relativeIntensity: 0.90, label: "Ca II H 396.8" },
      { wavelengthNm: 422.7, relativeIntensity: 0.55, label: "Ca I 422.7" },
      { wavelengthNm: 527.0, relativeIntensity: 0.25, label: "Ca I 527.0" },
      { wavelengthNm: 612.2, relativeIntensity: 0.20, label: "Ca I 612.2" },
    ]
  },
  Fe: {
    symbol: "Fe",
    name: "Iron",
    lines: [
      { wavelengthNm: 438.4, relativeIntensity: 0.70, label: "Fe I 438.4" },
      { wavelengthNm: 440.5, relativeIntensity: 0.55, label: "Fe I 440.5" },
      { wavelengthNm: 466.8, relativeIntensity: 0.45, label: "Fe I 466.8" },
      { wavelengthNm: 489.1, relativeIntensity: 0.40, label: "Fe I 489.1" },
      { wavelengthNm: 495.8, relativeIntensity: 0.50, label: "Fe I 495.8" },
      { wavelengthNm: 516.7, relativeIntensity: 0.65, label: "Fe I 516.7" },
      { wavelengthNm: 527.0, relativeIntensity: 0.60, label: "Fe I 527.0" },
      { wavelengthNm: 532.8, relativeIntensity: 0.75, label: "Fe I 532.8" },
    ]
  }
};

const FE_DENSE_LINES: ElementLineEntry[] = [
  { wavelengthNm: 361.9, relativeIntensity: 0.16, label: "Fe I 361.9" },
  { wavelengthNm: 372.0, relativeIntensity: 0.20, label: "Fe I 372.0" },
  { wavelengthNm: 374.6, relativeIntensity: 0.18, label: "Fe I 374.6" },
  { wavelengthNm: 382.0, relativeIntensity: 0.26, label: "Fe I 382.0" },
  { wavelengthNm: 386.0, relativeIntensity: 0.22, label: "Fe I 386.0" },
  { wavelengthNm: 404.6, relativeIntensity: 0.32, label: "Fe I 404.6" },
  { wavelengthNm: 406.4, relativeIntensity: 0.28, label: "Fe I 406.4" },
  { wavelengthNm: 414.4, relativeIntensity: 0.30, label: "Fe I 414.4" },
  { wavelengthNm: 427.2, relativeIntensity: 0.34, label: "Fe I 427.2" },
  { wavelengthNm: 430.8, relativeIntensity: 0.42, label: "Fe I 430.8" },
  { wavelengthNm: 432.6, relativeIntensity: 0.38, label: "Fe I 432.6" },
  { wavelengthNm: 438.4, relativeIntensity: 0.70, label: "Fe I 438.4" },
  { wavelengthNm: 440.5, relativeIntensity: 0.55, label: "Fe I 440.5" },
  { wavelengthNm: 452.9, relativeIntensity: 0.33, label: "Fe I 452.9" },
  { wavelengthNm: 466.8, relativeIntensity: 0.45, label: "Fe I 466.8" },
  { wavelengthNm: 489.1, relativeIntensity: 0.40, label: "Fe I 489.1" },
  { wavelengthNm: 495.8, relativeIntensity: 0.50, label: "Fe I 495.8" },
  { wavelengthNm: 501.8, relativeIntensity: 0.36, label: "Fe I 501.8" },
  { wavelengthNm: 516.7, relativeIntensity: 0.65, label: "Fe I 516.7" },
  { wavelengthNm: 519.8, relativeIntensity: 0.41, label: "Fe I 519.8" },
  { wavelengthNm: 522.7, relativeIntensity: 0.48, label: "Fe I 522.7" },
  { wavelengthNm: 527.0, relativeIntensity: 0.60, label: "Fe I 527.0" },
  { wavelengthNm: 532.8, relativeIntensity: 0.75, label: "Fe I 532.8" },
  { wavelengthNm: 537.2, relativeIntensity: 0.39, label: "Fe I 537.2" },
  { wavelengthNm: 540.6, relativeIntensity: 0.35, label: "Fe I 540.6" },
  { wavelengthNm: 543.5, relativeIntensity: 0.37, label: "Fe I 543.5" },
  { wavelengthNm: 561.6, relativeIntensity: 0.43, label: "Fe I 561.6" },
  { wavelengthNm: 570.1, relativeIntensity: 0.31, label: "Fe I 570.1" },
  { wavelengthNm: 595.7, relativeIntensity: 0.29, label: "Fe I 595.7" },
  { wavelengthNm: 613.7, relativeIntensity: 0.27, label: "Fe I 613.7" },
  { wavelengthNm: 621.9, relativeIntensity: 0.24, label: "Fe I 621.9" },
  { wavelengthNm: 643.1, relativeIntensity: 0.22, label: "Fe I 643.1" },
  { wavelengthNm: 649.5, relativeIntensity: 0.20, label: "Fe I 649.5" },
  { wavelengthNm: 667.8, relativeIntensity: 0.18, label: "Fe I 667.8" },
];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function classifyInferenceQuality(residualNm: number): InferenceQuality {
  if (residualNm <= 0.5) return "exact";
  if (residualNm <= 2.0) return "near";
  return "low-confidence";
}

// ── Model ──────────────────────────────────────────────────

export const SpectralLineModel = {

  BOHR,

  // ── Hydrogen (Bohr model, exact) ─────────────────────────

  /**
   * Energy of the nth level (eV). Returns negative value (bound state).
   * E_n = -13.605693 eV / n²
   */
  hydrogenEnergyEv(args: { n: number }): number {
    const { n } = args;
    if (n === Number.POSITIVE_INFINITY) return 0;
    if (!Number.isFinite(n) || n < 1 || Math.floor(n) !== n) return NaN;
    return -BOHR.RYDBERG_EV / (n * n);
  },

  /**
   * Transition energy (eV) for n_upper → n_lower.
   * Returns positive value (energy of emitted/absorbed photon).
   * ΔE = 13.605693 eV × (1/n_lower² − 1/n_upper²)
   */
  transitionEnergyEv(args: { nUpper: number; nLower: number }): number {
    const { nUpper, nLower } = args;
    if (
      !Number.isFinite(nUpper) || !Number.isFinite(nLower) ||
      nUpper < 1 || nLower < 1 ||
      Math.floor(nUpper) !== nUpper || Math.floor(nLower) !== nLower ||
      nUpper <= nLower
    ) return NaN;
    return BOHR.RYDBERG_EV * (1 / (nLower * nLower) - 1 / (nUpper * nUpper));
  },

  /**
   * Transition wavelength (nm) for n_upper → n_lower.
   * λ = hc / ΔE
   */
  transitionWavelengthNm(args: { nUpper: number; nLower: number }): number {
    const dE = SpectralLineModel.transitionEnergyEv(args);
    if (!Number.isFinite(dE) || dE <= 0) return NaN;
    return BOHR.HC_EV_NM / dE;
  },

  /**
   * Transition frequency (Hz) for n_upper → n_lower.
   */
  transitionFrequencyHz(args: { nUpper: number; nLower: number }): number {
    const wavelengthNm = SpectralLineModel.transitionWavelengthNm(args);
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) return NaN;
    // ν = c / λ, convert nm to cm first
    const wavelengthCm = wavelengthNm * 1e-7;
    return BOHR.C_CM_PER_S / wavelengthCm;
  },

  /**
   * Bohr orbit radius for level n (nm).
   * r_n = n² × a₀
   */
  bohrRadiusNm(args: { n: number }): number {
    const { n } = args;
    if (!Number.isFinite(n) || n < 1 || Math.floor(n) !== n) return NaN;
    return n * n * BOHR.A0_NM;
  },

  /**
   * Classify a transition into its series name based on n_lower.
   */
  seriesName(args: { nLower: number }): string {
    const { nLower } = args;
    return SERIES_NAMES[nLower] ?? `n=${nLower}`;
  },

  /**
   * Series limit wavelength (nm) — the shortest wavelength in the series.
   * λ_limit = hc / (RYDBERG_EV / n_lower²)
   */
  seriesLimitNm(args: { nLower: number }): number {
    const { nLower } = args;
    if (!Number.isFinite(nLower) || nLower < 1 || Math.floor(nLower) !== nLower) return NaN;
    const energyEv = BOHR.RYDBERG_EV / (nLower * nLower);
    return BOHR.HC_EV_NM / energyEv;
  },

  /**
   * Generate all transitions for a given series up to n_max.
   */
  seriesTransitions(args: { nLower: number; nMax?: number }): TransitionRecord[] {
    const { nLower } = args;
    const nMax = args.nMax ?? 10;
    if (!Number.isFinite(nLower) || nLower < 1 || Math.floor(nLower) !== nLower) return [];
    const results: TransitionRecord[] = [];
    for (let nUp = nLower + 1; nUp <= nMax; nUp++) {
      const energyEv = SpectralLineModel.transitionEnergyEv({ nUpper: nUp, nLower });
      const wavelengthNm = SpectralLineModel.transitionWavelengthNm({ nUpper: nUp, nLower });
      const frequencyHz = SpectralLineModel.transitionFrequencyHz({ nUpper: nUp, nLower });
      results.push({
        nUpper: nUp,
        nLower,
        wavelengthNm,
        energyEv,
        frequencyHz,
        seriesName: SpectralLineModel.seriesName({ nLower })
      });
    }
    return results;
  },

  /**
   * Generate all hydrogen transitions up to nMax for series 1..maxSeries.
   */
  allHydrogenTransitions(args?: { nMax?: number; maxSeries?: number }): TransitionRecord[] {
    const nMax = args?.nMax ?? 10;
    const maxSeries = args?.maxSeries ?? 4;
    const results: TransitionRecord[] = [];
    for (let nLow = 1; nLow <= maxSeries; nLow++) {
      results.push(...SpectralLineModel.seriesTransitions({ nLower: nLow, nMax }));
    }
    return results;
  },

  /**
   * Inverse solver: infer the hydrogen transition that best matches an observed wavelength.
   * Scans allowed series and nUpper values, then returns the minimum-residual candidate.
   */
  inferHydrogenTransitionFromObservedWavelength(args: {
    wavelengthNm: number;
    seriesFilter?: "all" | 1 | 2 | 3 | 4;
    nUpperMax?: number;
  }): HydrogenTransitionInference | null {
    const wavelengthNm = args.wavelengthNm;
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) return null;
    const nUpperMax = args.nUpperMax ?? 40;
    const seriesFilter = args.seriesFilter ?? "all";
    const candidateSeries = seriesFilter === "all" ? [1, 2, 3, 4] : [seriesFilter];

    let best: HydrogenTransitionInference | null = null;
    for (const nLower of candidateSeries) {
      for (let nUpper = nLower + 1; nUpper <= nUpperMax; nUpper += 1) {
        const candidateWavelengthNm = SpectralLineModel.transitionWavelengthNm({ nUpper, nLower });
        if (!Number.isFinite(candidateWavelengthNm)) continue;
        const residualNm = Math.abs(candidateWavelengthNm - wavelengthNm);
        if (best && residualNm >= best.residualNm) continue;
        const energyEv = SpectralLineModel.transitionEnergyEv({ nUpper, nLower });
        const frequencyHz = SpectralLineModel.transitionFrequencyHz({ nUpper, nLower });
        best = {
          nUpper,
          nLower,
          wavelengthNm: candidateWavelengthNm,
          energyEv,
          frequencyHz,
          seriesName: SpectralLineModel.seriesName({ nLower }),
          residualNm,
          quality: classifyInferenceQuality(residualNm),
        };
      }
    }
    return best;
  },

  /**
   * Boltzmann population ratio N_n / N_1 at temperature T.
   * N_n / N_1 = (g_n / g_1) × exp(−(E_n − E_1) / (k_B T))
   * where g_n = 2n² is the statistical weight (degeneracy).
   */
  boltzmannPopulationRatio(args: { n: number; temperatureK: number }): number {
    const { n, temperatureK } = args;
    if (!Number.isFinite(n) || n < 1 || Math.floor(n) !== n) return NaN;
    if (!Number.isFinite(temperatureK) || temperatureK <= 0) return 0;
    if (n === 1) return 1;
    const gRatio = (2 * n * n) / 2; // g_n / g_1 = 2n² / 2 = n²
    const dE = SpectralLineModel.hydrogenEnergyEv({ n }) - SpectralLineModel.hydrogenEnergyEv({ n: 1 });
    // dE is positive (less bound minus more bound)
    const exponent = -dE / (BOHR.KB_EV_PER_K * temperatureK);
    // Prevent underflow
    if (exponent < -700) return 0;
    return gRatio * Math.exp(exponent);
  },

  /**
   * Qualitative population + Balmer-strength proxy for instruction.
   * This is intentionally simplified and should be labeled as such in UI copy.
   * n1/n2/n3 are relative proxy populations normalized over n=1..3 only.
   */
  hydrogenPopulationProxy(args: { temperatureK: number }): HydrogenPopulationProxy {
    const temperatureK = args.temperatureK;
    if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
      return {
        temperatureK: Number.isFinite(temperatureK) ? temperatureK : 0,
        n1Fraction: 1,
        n2Fraction: 0,
        n3Fraction: 0,
        neutralHydrogenFractionProxy: 1,
        balmerStrengthProxy: 0,
      };
    }

    const n1 = 1;
    const n2 = SpectralLineModel.boltzmannPopulationRatio({ n: 2, temperatureK });
    const n3 = SpectralLineModel.boltzmannPopulationRatio({ n: 3, temperatureK });
    const total = n1 + n2 + n3;
    const n1Fraction = total > 0 ? n1 / total : 1;
    const n2Fraction = total > 0 ? n2 / total : 0;
    const n3Fraction = total > 0 ? n3 / total : 0;

    // Simplified neutral-H proxy: high near A-star temperatures, lower toward hotter ionized and cooler low-excitation regimes.
    const coolSuppression = clamp01((temperatureK - 4500) / 3500);
    const hotSuppression = clamp01((17000 - temperatureK) / 8000);
    const neutralHydrogenFractionProxy = clamp01(coolSuppression * hotSuppression);

    // Scale n=2 excitation into a pedagogical 0..1 range, then combine with neutral fraction proxy.
    const excitationScaled = clamp01(n2Fraction / 2.5e-5);
    const balmerStrengthProxy = clamp01(excitationScaled * neutralHydrogenFractionProxy);

    return {
      temperatureK,
      n1Fraction,
      n2Fraction,
      n3Fraction,
      neutralHydrogenFractionProxy,
      balmerStrengthProxy,
    };
  },

  /**
   * Large-n approximation for adjacent (Δn=1) energy spacing.
   * ΔE ≈ 2 * Rydberg / n^3  (eV)
   */
  largeNAdjacentSpacingEv(args: { n: number }): number {
    const n = args.n;
    if (!Number.isFinite(n) || n <= 0) return NaN;
    return (2 * BOHR.RYDBERG_EV) / (n * n * n);
  },

  // ── Multi-element (empirical) ────────────────────────────

  /**
   * List available element keys.
   */
  availableElements(): string[] {
    return Object.keys(ELEMENT_CATALOG);
  },

  /**
   * Get the line catalog for a given element.
   * For hydrogen, lines are computed from the Bohr model (Balmer series visible lines).
   */
  elementLines(args: { element: string; detail?: ElementLineDetail }): ElementLineData {
    const { element } = args;
    const detail = args.detail ?? "standard";
    const key = element.trim();
    if (key === "H") {
      // Generate hydrogen Balmer + Lyman alpha dynamically
      const balmer = SpectralLineModel.seriesTransitions({ nLower: 2, nMax: 8 });
      const lyAlpha = SpectralLineModel.transitionWavelengthNm({ nUpper: 2, nLower: 1 });
      const lines: ElementLineEntry[] = [];
      // Ly-alpha
      lines.push({ wavelengthNm: lyAlpha, relativeIntensity: 1.0, label: "Lyα" });
      // Balmer series
      const balmerLabels = ["Hα", "Hβ", "Hγ", "Hδ", "Hε", "H8"];
      const balmerIntensities = [1.0, 0.75, 0.55, 0.40, 0.30, 0.22];
      for (let i = 0; i < balmer.length; i++) {
        lines.push({
          wavelengthNm: balmer[i].wavelengthNm,
          relativeIntensity: balmerIntensities[i] ?? 0.15,
          label: balmerLabels[i] ?? `H${balmer[i].nUpper}`
        });
      }
      return { symbol: "H", name: "Hydrogen", lines };
    }
    const data = ELEMENT_CATALOG[key];
    if (!data) {
      return { symbol: key, name: "Unknown", lines: [] };
    }
    if (key === "Fe" && detail === "dense") {
      return {
        symbol: data.symbol,
        name: data.name,
        lines: FE_DENSE_LINES.map((line) => ({ ...line })),
      };
    }
    return data;
  },

  /**
   * Map a wavelength (nm) to a spectral band name.
   */
  wavelengthBand(args: { wavelengthNm: number }): string {
    const nm = args.wavelengthNm;
    if (!Number.isFinite(nm) || nm <= 0) return "Unknown";
    if (nm < 10) return "X-ray";
    if (nm < 121) return "Far UV";
    if (nm < 200) return "UV";
    if (nm < 380) return "Near UV";
    if (nm < 450) return "Visible (violet)";
    if (nm < 495) return "Visible (blue)";
    if (nm < 570) return "Visible (green)";
    if (nm < 590) return "Visible (yellow)";
    if (nm < 620) return "Visible (orange)";
    if (nm < 750) return "Visible (red)";
    if (nm < 1400) return "Near IR";
    if (nm < 3000) return "IR";
    if (nm < 1e6) return "Far IR";
    return "Radio";
  }

} as const;
