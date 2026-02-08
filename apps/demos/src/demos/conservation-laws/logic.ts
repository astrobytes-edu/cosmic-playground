/**
 * Pure UI logic for the conservation-laws demo.
 * Extracted from main.ts so that formatting, classification, and
 * coordinate helpers can be unit-tested without DOM or physics imports.
 */

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Map a linear slider value (its raw `.value`) through a base-10 log scale.
 * The conservation-laws demo uses sliders whose `.value` IS the log10 of
 * the physical quantity (e.g. slider value 0 -> 10^0 = 1).
 */
export function logSliderToValue(sliderValue: number): number {
  return Math.pow(10, sliderValue);
}

/**
 * Inverse of logSliderToValue: given a physical value, return the
 * slider position (log10).
 */
export function valueToLogSlider(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.log10(value);
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number for display in readouts.
 * - Non-finite values -> em-dash
 * - Zero -> "0"
 * - Very large (>=1e6) or very small (<1e-3) -> exponential notation
 * - Otherwise -> fixed-point with `digits` decimal places
 */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

// ---------------------------------------------------------------------------
// Orbit classification
// ---------------------------------------------------------------------------

/**
 * Classify an orbit by its eccentricity.
 *
 * | e           | Type        |
 * |-------------|-------------|
 * | e < 1e-6    | circular    |
 * | 0 < e < 1   | elliptical  |
 * | |e - 1| < 1e-6 | parabolic |
 * | e > 1       | hyperbolic  |
 *
 * Returns a human-readable label (lowercase).
 */
export function classifyOrbit(ecc: number): string {
  if (!Number.isFinite(ecc) || ecc < 0) return "invalid";
  if (ecc < 1e-6) return "circular";
  if (Math.abs(ecc - 1) < 1e-6) return "parabolic";
  if (ecc < 1) return "elliptical";
  return "hyperbolic";
}

/**
 * Format the orbit-type string for display (adds " (escape)" to parabolic).
 */
export function formatOrbitType(type: string): string {
  switch (type) {
    case "circular":
      return "circular";
    case "elliptical":
      return "elliptical";
    case "parabolic":
      return "parabolic (escape)";
    case "hyperbolic":
      return "hyperbolic";
    default:
      return "invalid";
  }
}

// ---------------------------------------------------------------------------
// SVG coordinate helpers
// ---------------------------------------------------------------------------

export interface SvgPoint {
  x: number;
  y: number;
}

/**
 * Convert orbital (AU) coordinates to SVG pixel coordinates.
 * The y-axis is flipped (SVG y-down, physics y-up).
 */
export function toSvg(
  xAu: number,
  yAu: number,
  center: SvgPoint,
  scalePxPerAu: number,
): SvgPoint {
  return {
    x: center.x + xAu * scalePxPerAu,
    y: center.y - yAu * scalePxPerAu,
  };
}

// ---------------------------------------------------------------------------
// Orbital mechanics helpers (pure geometry, no physics imports)
// ---------------------------------------------------------------------------

/**
 * Compute the orbital radius from the conic equation r = p / (1 + e cos(nu)).
 */
export function orbitalRadiusAu(ecc: number, pAu: number, nuRad: number): number {
  if (!Number.isFinite(ecc) || ecc < 0) return NaN;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return NaN;
  if (!Number.isFinite(nuRad)) return NaN;
  const denom = 1 + ecc * Math.cos(nuRad);
  return denom > 0 ? pAu / denom : NaN;
}

/**
 * Compute position and tangent direction in orbital-plane coordinates,
 * then rotate by argument of periapsis omega.
 */
export function conicPositionAndTangentAu(
  ecc: number,
  pAu: number,
  omegaRad: number,
  nuRad: number,
): { xAu: number; yAu: number; dxAu: number; dyAu: number } | null {
  if (!Number.isFinite(ecc) || ecc < 0) return null;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return null;
  if (!Number.isFinite(omegaRad)) return null;
  if (!Number.isFinite(nuRad)) return null;

  const cosNu = Math.cos(nuRad);
  const sinNu = Math.sin(nuRad);
  const denom = 1 + ecc * cosNu;
  if (!(denom > 0)) return null;

  const r = pAu / denom;
  const xOrb = r * cosNu;
  const yOrb = r * sinNu;

  // Derivative wrt nu for tangent direction.
  const drDnu = (pAu * ecc * sinNu) / (denom * denom);
  const dxOrb = drDnu * cosNu - r * sinNu;
  const dyOrb = drDnu * sinNu + r * cosNu;

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);

  const xAu = xOrb * cosO - yOrb * sinO;
  const yAu = xOrb * sinO + yOrb * cosO;
  const dxAu = dxOrb * cosO - dyOrb * sinO;
  const dyAu = dxOrb * sinO + dyOrb * cosO;
  return { xAu, yAu, dxAu, dyAu };
}

/**
 * Compute the instantaneous orbital speed from the vis-viva-like expression:
 *   v = (mu / h) * sqrt(1 + 2e cos(nu) + e^2)
 */
export function instantaneousSpeedAuPerYr(
  muAu3Yr2: number,
  hAbsAu2Yr: number,
  ecc: number,
  nuRad: number,
): number {
  if (!Number.isFinite(muAu3Yr2) || !(muAu3Yr2 > 0)) return NaN;
  if (!Number.isFinite(hAbsAu2Yr) || !(hAbsAu2Yr > 0)) return NaN;
  if (!Number.isFinite(ecc) || ecc < 0) return NaN;
  if (!Number.isFinite(nuRad)) return NaN;

  const q = 1 + 2 * ecc * Math.cos(nuRad) + ecc * ecc;
  if (!(q >= 0)) return NaN;
  return (muAu3Yr2 / hAbsAu2Yr) * Math.sqrt(Math.max(0, q));
}

/**
 * Build an SVG path `d` attribute from a sequence of orbital points.
 */
export function buildPathD(
  points: { xAu: number; yAu: number }[],
  center: SvgPoint,
  scalePxPerAu: number,
): string {
  if (points.length === 0) return "";
  const start = toSvg(points[0].xAu, points[0].yAu, center, scalePxPerAu);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const p = toSvg(points[i].xAu, points[i].yAu, center, scalePxPerAu);
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Compute velocity vector length in pixels and unit direction in SVG coords.
 * Returns { vLenPx, ux, uy } for rendering the velocity arrow.
 */
export function velocityArrowSvg(
  dxAu: number,
  dyAu: number,
  scalePxPerAu: number,
  dir: number,
  vRatio: number,
): { vLenPx: number; ux: number; uy: number } {
  const vLenPx = Math.max(20, Math.min(120, 60 * vRatio));

  // Tangent direction in SVG coordinates (y flip).
  const dxSvg = dxAu * scalePxPerAu;
  const dySvg = -dyAu * scalePxPerAu;
  const mag = Math.hypot(dxSvg, dySvg);
  const ux = mag > 0 ? (dxSvg / mag) * dir : 0;
  const uy = mag > 0 ? (dySvg / mag) * dir : 0;

  return { vLenPx, ux, uy };
}
