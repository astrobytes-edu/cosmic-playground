/**
 * Pure UI logic for the binary-orbits demo.
 *
 * Computes demo model data, validates invariants, and provides helper
 * evaluators for prediction and scaling pedagogy.
 */

import { BinaryOrbitModel } from "@cosmic/physics";

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const MASS_RATIO_MIN = 0.001;
export const MASS_RATIO_MAX = 1.0;
export const SEPARATION_MIN_AU = 0.1;
export const SEPARATION_MAX_AU = 100;
export const INCLINATION_MIN_DEG = 0;
export const INCLINATION_MAX_DEG = 90;
export const LOG_SLIDER_MIN = 0;
export const LOG_SLIDER_MAX = 1000;
export const ORBIT_TRANSITION_MS = 500;
export const CAMERA_TRANSITION_MS = 300;
export const READOUT_PULSE_MS = 450;

const DEFAULT_PRIMARY_MASS_SOLAR = 1;
const DEFAULT_SEPARATION_AU = 4;
const DEFAULT_INCLINATION_DEG = 60;
const AUTO_FIT_TARGET_RADIUS_FRACTION = 0.28;
const FIXED_VIEW_SCALE_AU_PER_PX = 1 / 84;
const MIN_VIEW_SCALE_AU_PER_PX = 1 / 240;
const MAX_VIEW_SCALE_AU_PER_PX = 1.4;

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number for display in readouts.
 * Non-finite values produce an em-dash.
 */
export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

/**
 * Convert a 0-1000 slider position to a value on a base-10 log scale.
 */
export function logSliderToValue(
  sliderVal: number,
  minVal: number,
  maxVal: number,
): number {
  const bounded = clamp(sliderVal, LOG_SLIDER_MIN, LOG_SLIDER_MAX);
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = bounded / LOG_SLIDER_MAX;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

/**
 * Convert a physical value to a 0-1000 slider position on a base-10 log scale.
 */
export function valueToLogSlider(
  value: number,
  minVal: number,
  maxVal: number,
): number {
  if (!Number.isFinite(value) || value <= 0) return LOG_SLIDER_MIN;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const fraction = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(fraction * LOG_SLIDER_MAX), LOG_SLIDER_MIN, LOG_SLIDER_MAX);
}

// ---------------------------------------------------------------------------
// Binary orbit model
// ---------------------------------------------------------------------------

export interface BinaryModel {
  massRatio: number;
  separation: number;
  inclinationDeg: number;
  sinInclination: number;
  m1: number;
  m2: number;
  total: number;
  periodYr: number;
  omegaRadPerYr: number;
  /** Distance from barycenter to m1 (AU) */
  r1: number;
  /** Distance from barycenter to m2 (AU) */
  r2: number;
  /** Orbital speed of m1 around barycenter (AU/yr) */
  v1AuPerYr: number;
  /** Orbital speed of m2 around barycenter (AU/yr) */
  v2AuPerYr: number;
  /** Momentum magnitude of m1 (M_sun AU/yr) */
  p1SolarAuPerYr: number;
  /** Momentum magnitude of m2 (M_sun AU/yr) */
  p2SolarAuPerYr: number;
  /** RV semi-amplitude of m1 (AU/yr) */
  k1AuPerYr: number;
  /** RV semi-amplitude of m2 (AU/yr) */
  k2AuPerYr: number;
  /** RV semi-amplitude of m1 (km/s) */
  k1KmPerS: number;
  /** RV semi-amplitude of m2 (km/s) */
  k2KmPerS: number;
  /** Kinetic energy of M1 (M_sun AU^2/yr^2) */
  kinetic1SolarAu2PerYr2: number;
  /** Kinetic energy of M2 (M_sun AU^2/yr^2) */
  kinetic2SolarAu2PerYr2: number;
  /** Total kinetic energy (M_sun AU^2/yr^2) */
  kineticTotalSolarAu2PerYr2: number;
  /** Potential energy (M_sun AU^2/yr^2) */
  potentialSolarAu2PerYr2: number;
  /** Total orbital energy (M_sun AU^2/yr^2) */
  totalEnergySolarAu2PerYr2: number;
  /** Virial residual 2K + U (M_sun AU^2/yr^2) */
  virialResidualSolarAu2PerYr2: number;
  momentumDifferenceSolarAuPerYr: number;
}

export interface BinarySystemState {
  massRatio: number;
  M1: number;
  separation: number;
  inclination: number;
  motionMode: "normalized" | "physical";
  spectroscopyMode: "SB1" | "SB2";
  element: "H" | "Na" | "Ca";
  autoScale: boolean;
}

export type StageView = "orbit" | "rv" | "spectrum" | "energy";

export function createBinarySystemState(
  overrides: Partial<BinarySystemState> = {},
): BinarySystemState {
  return {
    massRatio: DEFAULT_PRIMARY_MASS_SOLAR,
    M1: DEFAULT_PRIMARY_MASS_SOLAR,
    separation: DEFAULT_SEPARATION_AU,
    inclination: DEFAULT_INCLINATION_DEG,
    motionMode: "normalized",
    spectroscopyMode: "SB2",
    element: "H",
    autoScale: true,
    ...overrides,
  };
}

export function derivePhysics(
  state: Pick<BinarySystemState, "massRatio" | "M1" | "separation" | "inclination">,
): BinaryModel {
  const mr = clamp(state.massRatio, MASS_RATIO_MIN, MASS_RATIO_MAX);
  const primaryMassSolar = Number.isFinite(state.M1) && state.M1 > 0
    ? state.M1
    : DEFAULT_PRIMARY_MASS_SOLAR;
  const sep = clamp(state.separation, SEPARATION_MIN_AU, SEPARATION_MAX_AU);
  const incDeg = clamp(state.inclination, INCLINATION_MIN_DEG, INCLINATION_MAX_DEG);
  const secondaryMassSolar = primaryMassSolar * mr;

  const orbitState = BinaryOrbitModel.circularState({
    primaryMassSolar,
    secondaryMassSolar,
    separationAu: sep,
    inclinationDeg: incDeg,
  });

  return {
    massRatio: mr,
    separation: sep,
    inclinationDeg: incDeg,
    sinInclination: orbitState.sinInclination,
    m1: primaryMassSolar,
    m2: secondaryMassSolar,
    total: orbitState.totalMassSolar,
    periodYr: orbitState.periodYr,
    omegaRadPerYr: orbitState.omegaRadPerYr,
    r1: orbitState.a1Au,
    r2: orbitState.a2Au,
    v1AuPerYr: orbitState.v1AuPerYr,
    v2AuPerYr: orbitState.v2AuPerYr,
    p1SolarAuPerYr: orbitState.p1SolarAuPerYr,
    p2SolarAuPerYr: orbitState.p2SolarAuPerYr,
    k1AuPerYr: orbitState.k1AuPerYr,
    k2AuPerYr: orbitState.k2AuPerYr,
    k1KmPerS: orbitState.k1KmPerS,
    k2KmPerS: orbitState.k2KmPerS,
    kinetic1SolarAu2PerYr2: orbitState.kinetic1SolarAu2PerYr2,
    kinetic2SolarAu2PerYr2: orbitState.kinetic2SolarAu2PerYr2,
    kineticTotalSolarAu2PerYr2: orbitState.kineticTotalSolarAu2PerYr2,
    potentialSolarAu2PerYr2: orbitState.potentialSolarAu2PerYr2,
    totalEnergySolarAu2PerYr2: orbitState.totalEnergySolarAu2PerYr2,
    virialResidualSolarAu2PerYr2: orbitState.virialResidualSolarAu2PerYr2,
    momentumDifferenceSolarAuPerYr: Math.abs(
      orbitState.p1SolarAuPerYr - orbitState.p2SolarAuPerYr,
    ),
  };
}

/**
 * Compute the binary orbit model from input parameters.
 *
 * The mass ratio is m2/m1, where m1 is fixed at 1 Msun.
 * Separation is the semi-major axis in AU.
 *
 * Uses teaching units: AU / yr / Msun with G = 4*pi^2 AU^3/(yr^2 Msun).
 */
export function computeModel(
  massRatio: number,
  separationAu: number,
  inclinationDeg: number,
): BinaryModel {
  return derivePhysics({
    massRatio,
    M1: DEFAULT_PRIMARY_MASS_SOLAR,
    separation: separationAu,
    inclination: inclinationDeg,
  });
}

export function isPredictionLocked(args: { predictionPending: boolean }): boolean {
  return args.predictionPending;
}

export function selectDisplayModel(args: {
  predictionPending: boolean;
  revealedModel: BinaryModel;
  currentModel: BinaryModel;
}): BinaryModel {
  return isPredictionLocked({ predictionPending: args.predictionPending })
    ? args.revealedModel
    : args.currentModel;
}

export interface IntegrityCheck {
  key: "sum" | "barycenter" | "rvRatio";
  label: string;
  lhs: number;
  rhs: number;
  passed: boolean;
}

export function evaluateIntegrityChecks(model: BinaryModel): IntegrityCheck[] {
  const rvRatio = model.k2KmPerS === 0 ? Number.NaN : model.k1KmPerS / model.k2KmPerS;
  return [
    {
      key: "sum",
      label: "a1 + a2 = a",
      lhs: model.r1 + model.r2,
      rhs: model.separation,
      passed: nearEqual(model.r1 + model.r2, model.separation),
    },
    {
      key: "barycenter",
      label: "M1 a1 = M2 a2",
      lhs: model.m1 * model.r1,
      rhs: model.m2 * model.r2,
      passed: nearEqual(model.m1 * model.r1, model.m2 * model.r2),
    },
    {
      key: "rvRatio",
      label: "K1 / K2 = q",
      lhs: rvRatio,
      rhs: model.massRatio,
      passed: nearEqual(rvRatio, model.massRatio),
    },
  ];
}

export function rvCacheKey(
  model: Pick<BinaryModel, "m1" | "m2" | "separation" | "inclinationDeg">,
  sampleCount = 180,
): string {
  const parts = [model.m1, model.m2, model.separation, model.inclinationDeg, sampleCount]
    .map((value) => (Number.isFinite(value) ? value.toFixed(6) : "NaN"));
  return parts.join("|");
}

export function isRvChallengeLocked(args: { active: boolean; revealed: boolean }): boolean {
  return args.active && !args.revealed;
}

export interface RvInferenceGrade {
  absoluteError: number;
  percentError: number;
}

export function gradeRvInference(args: { inferredQ: number; trueQ: number }): RvInferenceGrade {
  const absoluteError = Math.abs(args.inferredQ - args.trueQ);
  const percentError = args.trueQ !== 0 ? (absoluteError / Math.abs(args.trueQ)) * 100 : Number.NaN;
  return { absoluteError, percentError };
}

export type InvariantKey =
  | "sum"
  | "barycenter"
  | "speedRatio"
  | "sharedPeriod"
  | "equalOffsetsAnyRatio"
  | "equalRvAnyRatio";

export interface InvariantStatement {
  key: InvariantKey;
  statement: string;
  mustBeTrue: boolean;
}

export interface InvariantCheck {
  key: InvariantStatement["key"];
  statement: InvariantStatement["statement"];
  mustBeTrue: boolean;
  lhs: number;
  rhs: number;
  isTrue: boolean;
}

export const INVARIANT_STATEMENTS: ReadonlyArray<InvariantStatement> = [
  { key: "sum", statement: "a1 + a2 = a", mustBeTrue: true },
  { key: "barycenter", statement: "M1 a1 = M2 a2", mustBeTrue: true },
  { key: "speedRatio", statement: "v1 / v2 = M2 / M1", mustBeTrue: true },
  { key: "sharedPeriod", statement: "P1 = P2", mustBeTrue: true },
  { key: "equalOffsetsAnyRatio", statement: "a1 = a2 for any mass ratio", mustBeTrue: false },
  { key: "equalRvAnyRatio", statement: "K1 = K2 at fixed inclination for any mass ratio", mustBeTrue: false },
] as const;

function nearEqual(lhs: number, rhs: number, relativeTolerance = 1e-9, absoluteTolerance = 1e-12): boolean {
  if (!Number.isFinite(lhs) || !Number.isFinite(rhs)) return false;
  const scale = Math.max(absoluteTolerance, Math.abs(lhs), Math.abs(rhs));
  return Math.abs(lhs - rhs) <= Math.max(absoluteTolerance, relativeTolerance * scale);
}

export function evaluateInvariants(model: BinaryModel): InvariantCheck[] {
  const lhsSpeedRatio = model.v2AuPerYr === 0 ? Number.NaN : model.v1AuPerYr / model.v2AuPerYr;
  const rhsSpeedRatio = model.m1 === 0 ? Number.NaN : model.m2 / model.m1;
  const lhsRvRatio = model.k1KmPerS;
  const rhsRvRatio = model.k2KmPerS;

  return [
    {
      key: "sum",
      statement: "a1 + a2 = a",
      mustBeTrue: true,
      lhs: model.r1 + model.r2,
      rhs: model.separation,
      isTrue: nearEqual(model.r1 + model.r2, model.separation),
    },
    {
      key: "barycenter",
      statement: "M1 a1 = M2 a2",
      mustBeTrue: true,
      lhs: model.m1 * model.r1,
      rhs: model.m2 * model.r2,
      isTrue: nearEqual(model.m1 * model.r1, model.m2 * model.r2),
    },
    {
      key: "speedRatio",
      statement: "v1 / v2 = M2 / M1",
      mustBeTrue: true,
      lhs: lhsSpeedRatio,
      rhs: rhsSpeedRatio,
      isTrue: nearEqual(lhsSpeedRatio, rhsSpeedRatio),
    },
    {
      key: "sharedPeriod",
      statement: "P1 = P2",
      mustBeTrue: true,
      lhs: model.periodYr,
      rhs: model.periodYr,
      isTrue: nearEqual(model.periodYr, model.periodYr),
    },
    {
      key: "equalOffsetsAnyRatio",
      statement: "a1 = a2 for any mass ratio",
      mustBeTrue: false,
      lhs: model.r1,
      rhs: model.r2,
      isTrue: nearEqual(model.r1, model.r2),
    },
    {
      key: "equalRvAnyRatio",
      statement: "K1 = K2 at fixed inclination for any mass ratio",
      mustBeTrue: false,
      lhs: lhsRvRatio,
      rhs: rhsRvRatio,
      isTrue: nearEqual(lhsRvRatio, rhsRvRatio),
    },
  ];
}

export interface InvariantSelectionGrade {
  trueRequiredCount: number;
  trueSelectedCount: number;
  falseSelectedCount: number;
  allTrueSelected: boolean;
  anyFalseSelected: boolean;
}

export function gradeInvariantSelection(args: {
  checks: ReadonlyArray<InvariantCheck>;
  selectedKeys: ReadonlyArray<InvariantKey>;
}): InvariantSelectionGrade {
  const selected = new Set(args.selectedKeys);
  const trueRequiredCount = args.checks.filter((check) => check.mustBeTrue).length;
  const trueSelectedCount = args.checks.filter((check) => check.mustBeTrue && selected.has(check.key)).length;
  const falseSelectedCount = args.checks.filter((check) => !check.mustBeTrue && selected.has(check.key)).length;
  return {
    trueRequiredCount,
    trueSelectedCount,
    falseSelectedCount,
    allTrueSelected: trueSelectedCount === trueRequiredCount,
    anyFalseSelected: falseSelectedCount > 0,
  };
}

export type TrendDirection = "increase" | "decrease" | "same";

export interface PredictionChoices {
  periodTrend: TrendDirection;
  v1Trend: TrendDirection;
  a1Trend: TrendDirection;
}

export interface PredictionEvaluation {
  expected: PredictionChoices;
  actual: PredictionChoices;
  periodCorrect: boolean;
  v1Correct: boolean;
  a1Correct: boolean;
  allCorrect: boolean;
}

function trendDirection(before: number, after: number): TrendDirection {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return "same";
  const delta = after - before;
  const tolerance = Math.max(1e-10, Math.abs(before) * 1e-6);
  if (Math.abs(delta) <= tolerance) return "same";
  return delta > 0 ? "increase" : "decrease";
}

export function evaluatePredictionChoices(args: {
  before: BinaryModel;
  after: BinaryModel;
  predicted: PredictionChoices;
}): PredictionEvaluation {
  const actual: PredictionChoices = {
    periodTrend: trendDirection(args.before.periodYr, args.after.periodYr),
    v1Trend: trendDirection(args.before.v1AuPerYr, args.after.v1AuPerYr),
    a1Trend: trendDirection(args.before.r1, args.after.r1),
  };

  return {
    expected: args.predicted,
    actual,
    periodCorrect: actual.periodTrend === args.predicted.periodTrend,
    v1Correct: actual.v1Trend === args.predicted.v1Trend,
    a1Correct: actual.a1Trend === args.predicted.a1Trend,
    allCorrect:
      actual.periodTrend === args.predicted.periodTrend
      && actual.v1Trend === args.predicted.v1Trend
      && actual.a1Trend === args.predicted.a1Trend,
  };
}

export type ScalingCue = {
  key: "separation" | "totalMass";
  equation: string;
  message: string;
};

export function scalingCueForControl(control: "separation" | "massRatio"): ScalingCue {
  if (control === "separation") {
    return {
      key: "separation",
      equation: "P \u221d a^{3/2}",
      message: "Changing separation updates period by a three-halves power law.",
    };
  }

  return {
    key: "totalMass",
    equation: "P \u221d (M1 + M2)^{-1/2}",
    message: "Changing total mass updates period with an inverse square-root law.",
  };
}

export type EnergyScaleCue = {
  key: "separation" | "massRatio";
  equation: string;
  message: string;
};

export function energyScaleCueForControl(control: "separation" | "massRatio"): EnergyScaleCue {
  if (control === "separation") {
    return {
      key: "separation",
      equation: "E \u221d -1/a",
      message: "Increasing separation makes the bound orbit less negative in total energy.",
    };
  }

  return {
    key: "massRatio",
    equation: "|E| \u221d M2",
    message: "With M1 fixed, increasing M2 raises the bound-energy magnitude.",
  };
}

export function computeTargetViewScale(args: {
  autoScale: boolean;
  physicsRadiusAu: number;
  canvasMinDimensionPx: number;
}): number {
  if (!args.autoScale) return FIXED_VIEW_SCALE_AU_PER_PX;

  const safeRadiusAu = Math.max(SEPARATION_MIN_AU * 0.5, args.physicsRadiusAu);
  const safeCanvasMin = Math.max(120, args.canvasMinDimensionPx);
  const targetRadiusPx = Math.max(36, safeCanvasMin * AUTO_FIT_TARGET_RADIUS_FRACTION);
  return clamp(
    safeRadiusAu / targetRadiusPx,
    MIN_VIEW_SCALE_AU_PER_PX,
    MAX_VIEW_SCALE_AU_PER_PX,
  );
}

export function stepViewScale(args: {
  current: number;
  target: number;
  deltaMs: number;
}): number {
  if (!Number.isFinite(args.current) || args.current <= 0) return args.target;
  if (!Number.isFinite(args.target) || args.target <= 0) return args.current;
  const safeDeltaMs = Math.max(0, args.deltaMs);
  if (safeDeltaMs === 0) return args.current;
  const alpha = 1 - Math.exp(-safeDeltaMs / CAMERA_TRANSITION_MS);
  return args.current + ((args.target - args.current) * alpha);
}

export function computeOrbitScreenRadii(args: {
  r1Au: number;
  r2Au: number;
  viewScale: number;
}): { r1Px: number; r2Px: number } {
  const safeViewScale = Number.isFinite(args.viewScale) && args.viewScale > 0
    ? args.viewScale
    : FIXED_VIEW_SCALE_AU_PER_PX;
  return {
    r1Px: args.r1Au / safeViewScale,
    r2Px: args.r2Au / safeViewScale,
  };
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

/**
 * Compute the visual radius of a body for Canvas rendering.
 * Uses a log scale so size differences remain visible but not overwhelming.
 *
 * @param mass - Stellar mass in solar masses (> 0)
 * @param base - Base radius in pixels (depends on canvas size)
 * @returns Visual radius in pixels
 */
export function bodyRadius(mass: number, base: number): number {
  if (!Number.isFinite(mass) || mass <= 0 || !Number.isFinite(base) || base <= 0) return 0;
  return base * (1 + 0.25 * Math.log10(mass + 1));
}

/**
 * Compute the positions of both bodies on the canvas at a given phase angle.
 */
export function bodyPositions(
  cx: number,
  cy: number,
  r1px: number,
  r2px: number,
  phaseRad: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const cos = Math.cos(phaseRad);
  const sin = Math.sin(phaseRad);
  return {
    x1: cx - r1px * cos,
    y1: cy - r1px * sin,
    x2: cx + r2px * cos,
    y2: cy + r2px * sin,
  };
}

/**
 * Logarithmic visual scaling factor for orbit rendering.
 *
 * Returns a smooth, bounded multiplier in [0.68, 1.22], decreasing as
 * separation increases from min to max.
 */
