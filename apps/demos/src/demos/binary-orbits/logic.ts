/**
 * Pure UI logic for the binary-orbits demo.
 * Extracted from main.ts so that formatting, model computation, and
 * visual helpers can be unit-tested without DOM or Canvas.
 */

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const MASS_RATIO_MIN = 0.1;
export const MASS_RATIO_MAX = 1.0;
export const SEPARATION_MIN_AU = 0.1;
export const SEPARATION_MAX_AU = 100;
export const LOG_SLIDER_MIN = 0;
export const LOG_SLIDER_MAX = 1000;

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
}

/**
 * Callback type for computing orbital period. Uses dependency injection
 * so that logic.ts does not import @cosmic/physics directly.
 */
export type PeriodCallback = (args: { aAu: number; massSolar: number }) => number;

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
  periodFn: PeriodCallback,
): BinaryModel {
  const mr = clamp(massRatio, MASS_RATIO_MIN, MASS_RATIO_MAX);
  const sep = clamp(separationAu, SEPARATION_MIN_AU, SEPARATION_MAX_AU);

  const m1 = 1;
  const m2 = mr;
  const total = m1 + m2;

  const periodYr = periodFn({ aAu: sep, massSolar: total });
  const omegaRadPerYr = Number.isFinite(periodYr) && periodYr > 0
    ? (2 * Math.PI) / periodYr
    : 0;

  // Distances from barycenter
  const r1 = sep * (m2 / total);
  const r2 = sep * (m1 / total);
  const v1AuPerYr = omegaRadPerYr * r1;
  const v2AuPerYr = omegaRadPerYr * r2;

  return {
    massRatio: mr,
    separation: sep,
    m1,
    m2,
    total,
    periodYr,
    omegaRadPerYr,
    r1,
    r2,
    v1AuPerYr,
    v2AuPerYr,
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
 * Compute the pixel scale so that the larger orbit fits within the canvas.
 * Uses 38% of the smaller dimension as the maximum radius.
 */
export function pixelsPerUnit(
  r1: number,
  r2: number,
  canvasW: number,
  canvasH: number,
): number {
  const maxR = Math.max(r1, r2);
  return maxR > 0 ? (Math.min(canvasW, canvasH) * 0.38) / maxR : 1;
}
