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
  const mr = clamp(massRatio, 0.2, 5);
  const sep = clamp(separationAu, 1, 8);

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
  };
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

/**
 * Compute the visual radius of a body for Canvas rendering.
 * Uses a log scale so large mass ratios are visible but not overwhelming.
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
