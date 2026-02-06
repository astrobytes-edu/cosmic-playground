/**
 * Pure UI logic for the parallax-distance demo.
 * No DOM access -- all functions are testable in isolation.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
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

/**
 * Compute the exaggerated half-angle for the parallax diagram.
 * Returns clamped value and whether clamping was applied.
 */
export function diagramHalfAngle(
  parallaxMas: number,
  exaggeration = 6000
): { halfAngle: number; clamped: boolean } {
  const pArcsec = parallaxMas / 1000;
  const pRad = (pArcsec * Math.PI) / (180 * 3600);
  const raw = pRad * exaggeration;
  const halfAngle = clamp(raw, 0.02, 0.34);
  return { halfAngle, clamped: raw > 0.34 || raw < 0.02 };
}

/**
 * Compute the star Y position for the diagram given the half-angle.
 * Returns { starY, clamped } where clamped is true if starY was pushed to 80.
 */
export function diagramStarY(
  baselineY: number,
  baselineLen: number,
  halfAngle: number
): { starY: number; clamped: boolean } {
  let starY = baselineY - (baselineLen / 2) / Math.tan(halfAngle);
  let clamped = false;
  if (starY < 80) {
    starY = 80;
    clamped = true;
  }
  return { starY, clamped };
}
