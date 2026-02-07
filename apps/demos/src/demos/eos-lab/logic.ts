import { AstroConstants, StellarEosModel } from "@cosmic/physics";
import type { StellarCompositionFractions } from "@cosmic/physics";
import { logspace } from "@cosmic/math";

export type { StellarCompositionFractions };

const C = AstroConstants.EOS;

/* ──────────────────────────────────────────────────
 * General helpers (unchanged from original)
 * ────────────────────────────────────────────────── */

/** Convert an integer to Unicode superscript (e.g. 12 -> 10^12 style, -3 -> 10^-3 style). */
export function superscript(n: number): string {
  const digits = String(n);
  const map: Record<string, string> = {
    "0": "\u2070", "1": "\u00B9", "2": "\u00B2", "3": "\u00B3",
    "4": "\u2074", "5": "\u2075", "6": "\u2076", "7": "\u2077",
    "8": "\u2078", "9": "\u2079", "-": "\u207B",
  };
  return digits.split("").map(ch => map[ch] ?? ch).join("");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function logSliderToValue(args: {
  sliderValue: number;
  sliderMin: number;
  sliderMax: number;
  valueMin: number;
  valueMax: number;
}): number {
  const { sliderValue, sliderMin, sliderMax, valueMin, valueMax } = args;
  const sliderSpan = sliderMax - sliderMin;
  if (!(sliderSpan > 0) || !(valueMin > 0) || !(valueMax > valueMin)) return Number.NaN;
  const fraction = clamp((sliderValue - sliderMin) / sliderSpan, 0, 1);
  const minLog = Math.log10(valueMin);
  const maxLog = Math.log10(valueMax);
  return Math.pow(10, minLog + fraction * (maxLog - minLog));
}

export function valueToLogSlider(args: {
  value: number;
  sliderMin: number;
  sliderMax: number;
  valueMin: number;
  valueMax: number;
}): number {
  const { value, sliderMin, sliderMax, valueMin, valueMax } = args;
  const sliderSpan = sliderMax - sliderMin;
  if (!(sliderSpan > 0) || !(valueMin > 0) || !(valueMax > valueMin) || !(value > 0))
    return Number.NaN;
  const minLog = Math.log10(valueMin);
  const maxLog = Math.log10(valueMax);
  const valueLog = Math.log10(clamp(value, valueMin, valueMax));
  const fraction = clamp((valueLog - minLog) / (maxLog - minLog), 0, 1);
  return sliderMin + fraction * sliderSpan;
}

export function formatScientific(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e5 || abs < 1e-3) {
    const exp = Math.floor(Math.log10(abs));
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(digits - 1)}\u00D710${superscript(exp)}`;
  }
  return value.toFixed(digits);
}

export function formatFraction(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

export function percent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "\u2014";
  return `${(100 * value).toFixed(digits)}%`;
}

export function pressureBarPercent(args: {
  pressureDynePerCm2: number;
  maxPressureDynePerCm2: number;
}): number {
  const { pressureDynePerCm2: p, maxPressureDynePerCm2: maxP } = args;
  if (!Number.isFinite(p) || !Number.isFinite(maxP) || !(maxP > 0)) return 0;
  return 100 * clamp(p / maxP, 0, 1);
}

export function pressureTone(args: {
  pressureDynePerCm2: number;
  dominantPressureDynePerCm2: number;
}): "dominant" | "secondary" | "minor" {
  const { pressureDynePerCm2: p, dominantPressureDynePerCm2: pDom } = args;
  if (!Number.isFinite(p) || !Number.isFinite(pDom) || !(pDom > 0)) return "minor";
  const ratio = p / pDom;
  if (ratio >= 0.8) return "dominant";
  if (ratio >= 0.2) return "secondary";
  return "minor";
}

export function compositionFromXY(args: {
  hydrogenMassFractionX: number;
  heliumMassFractionY: number;
}): StellarCompositionFractions {
  const x = clamp(
    Number.isFinite(args.hydrogenMassFractionX) ? args.hydrogenMassFractionX : 0,
    0,
    1
  );
  const y = clamp(
    Number.isFinite(args.heliumMassFractionY) ? args.heliumMassFractionY : 0,
    0,
    1 - x
  );
  const z = Math.max(0, 1 - x - y);
  return {
    hydrogenMassFractionX: x,
    heliumMassFractionY: y,
    metalMassFractionZ: z,
  };
}

/* ──────────────────────────────────────────────────
 * Regime map coordinate mapping
 * ────────────────────────────────────────────────── */

export function regimeMapCoordinates(args: {
  temperatureK: number;
  densityGPerCm3: number;
  temperatureMinK: number;
  temperatureMaxK: number;
  densityMinGPerCm3: number;
  densityMaxGPerCm3: number;
}): { xPct: number; yPct: number } {
  const {
    temperatureK,
    densityGPerCm3,
    temperatureMinK,
    temperatureMaxK,
    densityMinGPerCm3,
    densityMaxGPerCm3,
  } = args;

  if (
    !(temperatureMinK > 0) ||
    !(temperatureMaxK > temperatureMinK) ||
    !(densityMinGPerCm3 > 0) ||
    !(densityMaxGPerCm3 > densityMinGPerCm3)
  ) {
    return { xPct: Number.NaN, yPct: Number.NaN };
  }

  const tClamped = clamp(temperatureK, temperatureMinK, temperatureMaxK);
  const rhoClamped = clamp(densityGPerCm3, densityMinGPerCm3, densityMaxGPerCm3);

  const tLogMin = Math.log10(temperatureMinK);
  const tLogMax = Math.log10(temperatureMaxK);
  const rhoLogMin = Math.log10(densityMinGPerCm3);
  const rhoLogMax = Math.log10(densityMaxGPerCm3);

  const xFrac = clamp((Math.log10(tClamped) - tLogMin) / (tLogMax - tLogMin), 0, 1);
  const rhoFrac = clamp(
    (Math.log10(rhoClamped) - rhoLogMin) / (rhoLogMax - rhoLogMin),
    0,
    1
  );

  return {
    xPct: 100 * xFrac,
    yPct: 100 * (1 - rhoFrac),
  };
}

/* ──────────────────────────────────────────────────
 * Mean molecular weight helpers (pure, no model call)
 * ────────────────────────────────────────────────── */

/**
 * Mean molecular weight mu for a fully ionized gas.
 *   1/mu = 2X + (3/4)Y + (1/2)Z
 */
export function meanMolecularWeight(comp: StellarCompositionFractions): number {
  const denom = 2 * comp.hydrogenMassFractionX
    + 0.75 * comp.heliumMassFractionY
    + 0.5 * comp.metalMassFractionZ;
  return denom > 0 ? 1 / denom : Number.NaN;
}

/**
 * Mean molecular weight per free electron mu_e.
 *   1/mu_e = X + (1/2)Y + (1/2)Z
 */
export function meanMolecularWeightPerElectron(comp: StellarCompositionFractions): number {
  const denom = comp.hydrogenMassFractionX
    + 0.5 * comp.heliumMassFractionY
    + 0.5 * comp.metalMassFractionZ;
  return denom > 0 ? 1 / denom : Number.NaN;
}

/* ──────────────────────────────────────────────────
 * Pressure curve data generation (for uPlot)
 * ────────────────────────────────────────────────── */

export type PressureCurveData = {
  /** log10(rho) values */
  densities: Float64Array;
  /** P_gas(rho) at fixed T and composition */
  pGas: Float64Array;
  /** P_rad at fixed T (constant, independent of rho) */
  pRad: Float64Array;
  /** P_deg(rho) via full model */
  pDeg: Float64Array;
  /** P_total(rho) = P_gas + P_rad + P_deg */
  pTotal: Float64Array;
};

/**
 * Generate pressure-vs-density curves for the uPlot chart.
 *
 * Returns arrays in uPlot columnar format: first column is x (densities),
 * remaining columns are y-series.  All values are positive (log-safe).
 */
export function pressureCurveData(args: {
  temperatureK: number;
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
  samples?: number;
  logRhoMin?: number;
  logRhoMax?: number;
}): PressureCurveData {
  const {
    temperatureK,
    composition,
    radiationDepartureEta,
    samples = 200,
    logRhoMin = -10,
    logRhoMax = 10,
  } = args;

  const rhoValues = logspace(logRhoMin, logRhoMax, samples);
  const n = rhoValues.length;

  const densities = new Float64Array(n);
  const pGas = new Float64Array(n);
  const pRad = new Float64Array(n);
  const pDeg = new Float64Array(n);
  const pTotal = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const rho = rhoValues[i];
    densities[i] = rho;

    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK,
        densityGPerCm3: rho,
        composition,
        radiationDepartureEta,
      },
    });

    // Floor at 1e-30 to stay log-safe (uPlot log scale internal lookup
    // table covers 1e-32..1e+32; values outside this range trigger
    // RangeError in the axis-splits algorithm).
    pGas[i] = Math.max(1e-30, state.gasPressureDynePerCm2);
    pRad[i] = Math.max(1e-30, state.radiationPressureDynePerCm2);
    pDeg[i] = Math.max(1e-30, state.electronDegeneracyPressureDynePerCm2);
    pTotal[i] = Math.max(1e-30, state.totalPressureDynePerCm2);
  }

  return { densities, pGas, pRad, pDeg, pTotal };
}

/* ──────────────────────────────────────────────────
 * Regime map boundary curves (analytical)
 *
 * Each function returns log10(rho) for a given log10(T),
 * where two pressure channels are equal.
 * ────────────────────────────────────────────────── */

/**
 * Non-relativistic electron degeneracy pressure prefactor K_NR.
 *
 *   P_deg^NR = K_NR * (rho / (mu_e * m_u))^(5/3)
 *
 * where K_NR = (3 pi^2)^(2/3) * hbar^2 / (5 * m_e)
 *
 * This is the T=0, non-relativistic limit of the Chandrasekhar formula.
 */
function degeneracyPrefactorNR(): number {
  return (
    Math.pow(3 * Math.PI * Math.PI, 2 / 3) *
    C.HBAR_ERG_S * C.HBAR_ERG_S /
    (5 * C.ELECTRON_MASS_G)
  );
}

/**
 * Gas = Radiation boundary: P_gas = P_rad
 *
 *   rho * k_B * T / (mu * m_u) = a * T^4 / 3
 *   => rho = a * mu * m_u * T^3 / (3 * k_B)
 *   => log10(rho) = 3 * logT + log10(a * mu * m_u / (3 * k_B))
 */
export function gasRadBoundaryLogRho(logT: number, mu: number): number {
  const prefactor = (C.RADIATION_CONSTANT_A_ERG_CM3_K4 * mu * C.ATOMIC_MASS_UNIT_G)
    / (3 * C.K_BOLTZMANN_ERG_PER_K);
  return 3 * logT + Math.log10(prefactor);
}

/**
 * Gas = Degeneracy boundary (NR limit): P_gas = P_deg^NR
 *
 *   rho * k_B * T / (mu * m_u) = K_NR * (rho / (mu_e * m_u))^(5/3)
 *
 * Solving for rho:
 *   rho^(2/3) = k_B * T * (mu_e * m_u)^(5/3) / (mu * m_u * K_NR)
 *   => rho = [ k_B * T * (mu_e * m_u)^(5/3) / (mu * m_u * K_NR) ]^(3/2)
 *   => log10(rho) = (3/2) * logT + (3/2) * log10( k_B * (mu_e * m_u)^(5/3) / (mu * m_u * K_NR) )
 */
export function gasDegBoundaryLogRho(logT: number, mu: number, muE: number): number {
  const K_NR = degeneracyPrefactorNR();
  const numerator = C.K_BOLTZMANN_ERG_PER_K * Math.pow(muE * C.ATOMIC_MASS_UNIT_G, 5 / 3);
  const denominator = mu * C.ATOMIC_MASS_UNIT_G * K_NR;
  return 1.5 * logT + 1.5 * Math.log10(numerator / denominator);
}

/**
 * Radiation = Degeneracy boundary (NR limit): P_rad = P_deg^NR
 *
 *   a * T^4 / 3 = K_NR * (rho / (mu_e * m_u))^(5/3)
 *
 * Solving for rho:
 *   (rho / (mu_e * m_u))^(5/3) = a * T^4 / (3 * K_NR)
 *   => rho = mu_e * m_u * [ a * T^4 / (3 * K_NR) ]^(3/5)
 *   => log10(rho) = (12/5) * logT + log10(mu_e * m_u) + (3/5) * log10(a / (3 * K_NR))
 */
export function radDegBoundaryLogRho(logT: number, muE: number): number {
  const K_NR = degeneracyPrefactorNR();
  const coeff = muE * C.ATOMIC_MASS_UNIT_G *
    Math.pow(C.RADIATION_CONSTANT_A_ERG_CM3_K4 / (3 * K_NR), 3 / 5);
  return (12 / 5) * logT + Math.log10(coeff);
}

/**
 * Compute a polyline of boundary points for a given boundary function.
 * Returns arrays [logT[], logRho[]] clipped to the regime map domain.
 */
export function boundaryPolyline(args: {
  boundaryFn: (logT: number) => number;
  logTMin: number;
  logTMax: number;
  logRhoMin: number;
  logRhoMax: number;
  samples?: number;
}): { logT: number[]; logRho: number[] } {
  const { boundaryFn, logTMin, logTMax, logRhoMin, logRhoMax, samples = 100 } = args;
  const step = (logTMax - logTMin) / (samples - 1);
  const logT: number[] = [];
  const logRho: number[] = [];

  for (let i = 0; i < samples; i++) {
    const t = logTMin + i * step;
    const r = boundaryFn(t);
    if (Number.isFinite(r) && r >= logRhoMin && r <= logRhoMax) {
      logT.push(t);
      logRho.push(r);
    }
  }

  return { logT, logRho };
}

/* ──────────────────────────────────────────────────
 * Dominant channel for a point (for regime map coloring)
 * ────────────────────────────────────────────────── */

export type RegimeChannel = "gas" | "radiation" | "degeneracy" | "mixed";

/**
 * Determine which pressure channel dominates at given (T, rho).
 * Uses the full physics model for accuracy.
 */
export function dominantChannelAt(args: {
  temperatureK: number;
  densityGPerCm3: number;
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
}): RegimeChannel {
  const state = StellarEosModel.evaluateStateCgs({
    input: {
      temperatureK: args.temperatureK,
      densityGPerCm3: args.densityGPerCm3,
      composition: args.composition,
      radiationDepartureEta: args.radiationDepartureEta,
    },
  });

  const dom = state.dominantPressureChannel;
  if (dom === "gas" || dom === "radiation" || dom === "degeneracy") return dom;
  return "mixed";
}

/* ──────────────────────────────────────────────────
 * Brute-force regime grid (exact, full-model evaluation)
 *
 * Evaluates the full EOS model at every grid point to determine
 * the dominant pressure channel.  More accurate than analytical
 * boundaries because it captures:
 *   - NR → UR degeneracy transition (high x_F)
 *   - Finite-temperature Fermi-Dirac effects
 *   - Mixed-dominance zones
 *   - Future neutron-matter extensions
 * ────────────────────────────────────────────────── */

export type RegimeGridResult = {
  /** 2D array [row][col] of dominant channels. Row 0 = logRhoMin. */
  grid: RegimeChannel[][];
  /** Number of cells in X (temperature) direction */
  xCells: number;
  /** Number of cells in Y (density) direction */
  yCells: number;
  /** Wall-clock time for the evaluation in milliseconds */
  elapsedMs: number;
};

/**
 * Evaluate the full EOS model on a log-spaced grid to determine
 * the dominant pressure channel at each point.
 *
 * The grid depends only on composition and radiationDepartureEta,
 * NOT on the current (T, rho) state — so it can be cached aggressively.
 */
export function evaluateRegimeGrid(args: {
  logTMin: number;
  logTMax: number;
  logRhoMin: number;
  logRhoMax: number;
  xCells: number;
  yCells: number;
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
}): RegimeGridResult {
  const {
    logTMin, logTMax, logRhoMin, logRhoMax,
    xCells, yCells, composition, radiationDepartureEta,
  } = args;

  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

  const dT = (logTMax - logTMin) / Math.max(1, xCells - 1);
  const dRho = (logRhoMax - logRhoMin) / Math.max(1, yCells - 1);
  const grid: RegimeChannel[][] = [];

  for (let j = 0; j < yCells; j++) {
    const logRho = logRhoMin + j * dRho;
    const row: RegimeChannel[] = [];
    for (let i = 0; i < xCells; i++) {
      const logT = logTMin + i * dT;
      const state = StellarEosModel.evaluateStateCgs({
        input: {
          temperatureK: Math.pow(10, logT),
          densityGPerCm3: Math.pow(10, logRho),
          composition,
          radiationDepartureEta,
        },
      });
      const dom = state.dominantPressureChannel;
      if (dom === "gas" || dom === "radiation" || dom === "degeneracy") {
        row.push(dom);
      } else {
        row.push("mixed");
      }
    }
    grid.push(row);
  }

  const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return { grid, xCells, yCells, elapsedMs: elapsed };
}

/* ──────────────────────────────────────────────────
 * Scaling Law Detective — multiple-choice validation
 * ────────────────────────────────────────────────── */

export type ScalingChallengeDef = {
  id: string;
  channel: "gas" | "radiation" | "degeneracy";
  question: string;
  options: { label: string; factor: number }[];
  correctFactor: number;
  insight: string;
};

export const SCALING_CHALLENGES: ScalingChallengeDef[] = [
  {
    id: "gas-T",
    channel: "gas",
    question: "Double $T$. By what factor does $P_{\\rm gas}$ change?",
    options: [
      { label: "\\times 1", factor: 1 },
      { label: "\\times 2", factor: 2 },
      { label: "\\times 4", factor: 4 },
      { label: "\\times 8", factor: 8 },
    ],
    correctFactor: 2,
    insight: "$P_{\\rm gas} \\propto T^1$ \\u2014 linear scaling. Double $T$ \\u21D2 double $P$.",
  },
  {
    id: "rad-T",
    channel: "radiation",
    question: "Double $T$. By what factor does $P_{\\rm rad}$ change?",
    options: [
      { label: "\\times 2", factor: 2 },
      { label: "\\times 4", factor: 4 },
      { label: "\\times 8", factor: 8 },
      { label: "\\times 16", factor: 16 },
    ],
    correctFactor: 16,
    insight: "$P_{\\rm rad} \\propto T^4$ \\u2014 explosive! Double $T$ \\u21D2 $2^4 = 16\\times P$.",
  },
  {
    id: "deg-rho",
    channel: "degeneracy",
    question: "Double $\\rho$. By what factor does $P_{\\rm deg}$ change?",
    options: [
      { label: "\\times 2", factor: 2 },
      { label: "\\times 3.2", factor: 3.17 },
      { label: "\\times 4", factor: 4 },
      { label: "\\times 8", factor: 8 },
    ],
    correctFactor: 3.17,
    insight: "$P_{\\rm deg} \\propto \\rho^{5/3}$ \\u2014 steeper than linear. $2^{5/3} \\approx 3.17$.",
  },
];

/** Check if a selected scaling-law factor matches the correct answer. */
export function checkScalingAnswer(selectedFactor: number, correctFactor: number): boolean {
  return Math.abs(selectedFactor - correctFactor) < 0.1;
}

/* ──────────────────────────────────────────────────
 * Deep-dive data generation functions
 * ────────────────────────────────────────────────── */

/**
 * Gas deep-dive: P_gas vs rho at fixed T and composition.
 * Returns [densities, pGas] for a mini uPlot chart.
 */
export function gasDeepDiveData(args: {
  temperatureK: number;
  composition: StellarCompositionFractions;
  samples?: number;
  logRhoMin?: number;
  logRhoMax?: number;
}): { densities: Float64Array; pGas: Float64Array } {
  const { temperatureK, composition, samples = 100, logRhoMin = -10, logRhoMax = 10 } = args;
  const mu = meanMolecularWeight(composition);
  const rhoValues = logspace(logRhoMin, logRhoMax, samples);
  const n = rhoValues.length;
  const densities = new Float64Array(n);
  const pGas = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const rho = rhoValues[i];
    densities[i] = rho;
    // P_gas = rho * k_B * T / (mu * m_u)
    pGas[i] = Math.max(1e-30, rho * C.K_BOLTZMANN_ERG_PER_K * temperatureK / (mu * C.ATOMIC_MASS_UNIT_G));
  }

  return { densities, pGas };
}

/**
 * Radiation deep-dive: P_rad vs T, plus P_gas at a fixed rho for comparison.
 * Returns [temperatures, pRad, pGasComparison].
 */
export function radDeepDiveData(args: {
  rhoForComparison: number;
  composition: StellarCompositionFractions;
  samples?: number;
  logTMin?: number;
  logTMax?: number;
}): { temperatures: Float64Array; pRad: Float64Array; pGas: Float64Array } {
  const { rhoForComparison, composition, samples = 100, logTMin = 3, logTMax = 9 } = args;
  const mu = meanMolecularWeight(composition);
  const tValues = logspace(logTMin, logTMax, samples);
  const n = tValues.length;
  const temperatures = new Float64Array(n);
  const pRad = new Float64Array(n);
  const pGas = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const T = tValues[i];
    temperatures[i] = T;
    // P_rad = a * T^4 / 3
    pRad[i] = Math.max(1e-30, C.RADIATION_CONSTANT_A_ERG_CM3_K4 * Math.pow(T, 4) / 3);
    // P_gas at fixed rho for comparison
    pGas[i] = Math.max(1e-30, rhoForComparison * C.K_BOLTZMANN_ERG_PER_K * T / (mu * C.ATOMIC_MASS_UNIT_G));
  }

  return { temperatures, pRad, pGas };
}

/**
 * Degeneracy deep-dive: P_deg vs rho at fixed T, plus P_gas comparison.
 * Uses the full physics model for P_deg to capture NR→UR transition.
 */
export function degDeepDiveData(args: {
  temperatureK: number;
  composition: StellarCompositionFractions;
  samples?: number;
  logRhoMin?: number;
  logRhoMax?: number;
}): { densities: Float64Array; pDeg: Float64Array; pGas: Float64Array } {
  const { temperatureK, composition, samples = 100, logRhoMin = -4, logRhoMax = 10 } = args;
  const rhoValues = logspace(logRhoMin, logRhoMax, samples);
  const n = rhoValues.length;
  const densities = new Float64Array(n);
  const pDeg = new Float64Array(n);
  const pGas = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const rho = rhoValues[i];
    densities[i] = rho;
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK,
        densityGPerCm3: rho,
        composition,
        radiationDepartureEta: 1,
      },
    });
    pDeg[i] = Math.max(1e-30, state.electronDegeneracyPressureDynePerCm2);
    pGas[i] = Math.max(1e-30, state.gasPressureDynePerCm2);
  }

  return { densities, pDeg, pGas };
}

/* ──────────────────────────────────────────────────
 * Adiabatic index (numerical derivative)
 * ────────────────────────────────────────────────── */

/**
 * Effective adiabatic index Gamma_1 (pressure-weighted average).
 *
 * Uses the standard stellar structure approximation:
 *   Gamma_eff = (P_gas * 5/3 + P_rad * 4/3 + P_deg * gamma_deg) / P_total
 *
 * where gamma_deg transitions from 5/3 (NR, x_F << 1) to 4/3 (UR, x_F >> 1).
 * Gamma_eff < 4/3 indicates dynamical instability.
 */
export function adiabaticIndex(args: {
  pGas: number;
  pRad: number;
  pDeg: number;
  pTotal: number;
  xF: number;
}): number {
  const { pGas, pRad, pDeg, pTotal, xF } = args;
  if (!(pTotal > 0)) return NaN;
  // Degeneracy exponent: 5/3 (NR) -> 4/3 (UR), smooth sigmoid on x_F
  const t = Math.min(1, Math.max(0, (xF - 0.3) / 0.7));
  const gammaDeg = 5 / 3 - t * (5 / 3 - 4 / 3);
  return (pGas * (5 / 3) + pRad * (4 / 3) + pDeg * gammaDeg) / pTotal;
}

/* ──────────────────────────────────────────────────
 * Deep-dive live equation formatters
 * ────────────────────────────────────────────────── */

/**
 * Format a number in LaTeX scientific notation: 1.38 \times 10^{-16}
 */
export function latexScientific(value: number, sigFigs = 3): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  return `${mantissa.toFixed(sigFigs - 1)} \\times 10^{${exp}}`;
}

/**
 * Gas pressure equation with highlighted current values.
 *   P_gas = rho * k_B * T / (mu * m_u)
 */
export function gasEquationLatex(args: {
  rho: number;
  T: number;
  mu: number;
  pGas: number;
}): string {
  const { rho, T, mu, pGas } = args;
  return `P_{\\rm gas} = \\frac{\\textcolor{#f5a623}{\\rho}\\, k_B \\, \\textcolor{#f5a623}{T}}{\\textcolor{#6dd5ed}{\\mu} \\, m_u}`
    + ` = \\frac{(${latexScientific(rho)})\\,(${latexScientific(C.K_BOLTZMANN_ERG_PER_K)})\\,(${latexScientific(T)})}`
    + `{(${mu.toFixed(3)})\\,(${latexScientific(C.ATOMIC_MASS_UNIT_G)})}`
    + ` = ${latexScientific(pGas)} \\;\\text{dyne cm}^{-2}`;
}

/**
 * Radiation pressure equation with highlighted current values.
 *   P_rad = a * T^4 / 3
 */
export function radEquationLatex(args: { T: number; pRad: number }): string {
  const { T, pRad } = args;
  return `P_{\\rm rad} = \\frac{a\\, \\textcolor{#f5a623}{T}^4}{3}`
    + ` = \\frac{(${latexScientific(C.RADIATION_CONSTANT_A_ERG_CM3_K4)})\\,(${latexScientific(T)})^4}{3}`
    + ` = ${latexScientific(pRad)} \\;\\text{dyne cm}^{-2}`;
}

/**
 * Degeneracy pressure equation (simplified NR limit display).
 */
export function degEquationLatex(args: {
  rho: number;
  muE: number;
  xF: number;
  pDeg: number;
}): string {
  const { rho, muE, xF, pDeg } = args;
  const regime = xF < 0.3 ? "\\text{NR}" : xF > 1 ? "\\text{UR}" : "\\text{trans-rel}";
  return `P_{\\rm deg}^{${regime}} (\\textcolor{#f5a623}{\\rho}, \\mu_e = ${muE.toFixed(3)}, x_F = ${xF.toFixed(3)})`
    + ` = ${latexScientific(pDeg)} \\;\\text{dyne cm}^{-2}`;
}

/* ──────────────────────────────────────────────────
 * Symbolic equation forms (no numerical substitution)
 * ────────────────────────────────────────────────── */

export function gasEquationSymbolic(): string {
  return `P_{\\rm gas} = \\frac{\\rho \\, k_B \\, T}{\\mu \\, m_u}`;
}

export function radEquationSymbolic(): string {
  return `P_{\\rm rad} = \\frac{a \\, T^4}{3}`;
}

export function degEquationSymbolic(): string {
  return `P_{\\rm deg} = K \\!\\left(\\frac{\\rho}{\\mu_e \\, m_u}\\right)^{\\!5/3} \\;\\text{(NR limit)}`;
}

/* ──────────────────────────────────────────────────
 * Solar model profile for regime map overlay
 * ────────────────────────────────────────────────── */

/**
 * Standard Solar Model profile (Bahcall et al. 2005, approximate).
 * Returns ~13 points from core to photosphere in log(T/K), log(rho/g cm^-3).
 */
export function solarProfileData(): Array<{ logT: number; logRho: number; label?: string }> {
  const raw: [number, number, string?][] = [
    [7.196, 2.176, "Core"],
    [7.15,  2.0],
    [7.05,  1.6],
    [6.9,   1.1],
    [6.75,  0.5],
    [6.55, -0.2],
    [6.35, -0.8, "Radiative zone"],
    [6.15, -1.5],
    [5.9,  -2.5, "Base of CZ"],
    [5.5,  -4.0],
    [5.0,  -5.5],
    [4.5,  -6.5],
    [3.76, -7.0, "Photosphere"],
  ];
  return raw.map(([logT, logRho, label]) => ({ logT, logRho, label }));
}
