/**
 * Pure UI logic for the parallax-distance demo.
 * No DOM access -- all functions are testable in isolation.
 */

const MAS_PER_ARCSEC = 1000;
const ARCSEC_PER_DEGREE = 3600;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

export function parallaxArcsecFromMas(parallaxMas: number): number {
  return parallaxMas / MAS_PER_ARCSEC;
}

export function parallaxRadiansFromMas(parallaxMas: number): number {
  const pArcsec = parallaxArcsecFromMas(parallaxMas);
  return (pArcsec * Math.PI) / (180 * ARCSEC_PER_DEGREE);
}

/**
 * Compute signal-to-noise ratio for a parallax measurement.
 * Returns Infinity if sigmaMas is non-positive.
 */
export function signalToNoise(parallaxMas: number, sigmaMas: number): number {
  if (!(sigmaMas > 0)) return Infinity;
  return parallaxMas / sigmaMas;
}

/**
 * Describe measurement quality as a human-readable string.
 * Thresholds based on Gaia DR3 typical precision (~0.02 mas for bright stars).
 */
export function describeMeasurability(snr: number): string {
  if (!Number.isFinite(snr) || snr <= 0) return "Not measurable";
  if (snr >= 20) return "Excellent";
  if (snr >= 5) return "Good";
  if (snr >= 3) return "Marginal";
  return "Poor";
}

function normalizedLog(value: number, minValue: number, maxValue: number): number {
  const safeMin = Math.max(minValue, Number.EPSILON);
  const safeMax = Math.max(maxValue, safeMin + Number.EPSILON);
  const safeValue = clamp(value, safeMin, safeMax);
  const denominator = Math.log10(safeMax / safeMin);
  if (!(denominator > 0)) return 0;
  return Math.log10(safeValue / safeMin) / denominator;
}

/**
 * Compute a visible schematic half-angle for the stage geometry.
 * The mapping is logarithmic in parallax so tiny-but-meaningful changes are visible.
 */
export function diagramHalfAngle(
  parallaxMas: number,
  minVisualHalfAngle = 0.37,
  maxVisualHalfAngle = 1.15
): { halfAngle: number; exaggeration: number; logProgress: number } {
  const pMas = clamp(parallaxMas, 1, 1000);
  const logProgress = normalizedLog(pMas, 1, 1000);
  const halfAngle = minVisualHalfAngle + logProgress * (maxVisualHalfAngle - minVisualHalfAngle);
  const physicalHalfAngle = parallaxRadiansFromMas(pMas);
  const exaggeration = halfAngle / Math.max(physicalHalfAngle, Number.EPSILON);
  return { halfAngle, exaggeration, logProgress };
}

/**
 * Compute star Y position for the schematic triangle from a visual half-angle.
 */
export function diagramStarY(
  baselineY: number,
  baselineLen: number,
  halfAngle: number,
  minStarY = 92,
  maxStarY = 236,
  minVisualHalfAngle = 0.37,
  maxVisualHalfAngle = 1.15
): number {
  const safeMinHalf = Math.max(minVisualHalfAngle, 0.01);
  const safeMaxHalf = Math.max(maxVisualHalfAngle, safeMinHalf + 0.01);
  const safeHalfAngle = clamp(halfAngle, safeMinHalf, safeMaxHalf);

  const nearProjection = 1 / Math.tan(safeMaxHalf);
  const farProjection = 1 / Math.tan(safeMinHalf);
  const currentProjection = 1 / Math.tan(safeHalfAngle);
  const projectionRange = farProjection - nearProjection;

  const progress =
    projectionRange > 0 ? (currentProjection - nearProjection) / projectionRange : 0;
  const clampedProgress = clamp(progress, 0, 1);

  // Map near stars (large p) lower in the panel and far stars (tiny p) higher.
  return maxStarY - clampedProgress * (maxStarY - minStarY);
}

/**
 * Map parallax to a horizontal detector offset in pixels.
 * Uses the same logarithmic scale as the schematic triangle.
 */
export function detectorOffsetPx(
  parallaxMas: number,
  trackHalfWidthPx: number,
  minOffsetPx = 12
): number {
  const progress = normalizedLog(clamp(parallaxMas, 1, 1000), 1, 1000);
  const usableHalf = Math.max(trackHalfWidthPx, minOffsetPx);
  return minOffsetPx + progress * (usableHalf - minOffsetPx);
}
