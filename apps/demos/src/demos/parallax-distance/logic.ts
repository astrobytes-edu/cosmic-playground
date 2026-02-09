/**
 * Pure UI logic for the parallax-distance demo.
 * No DOM access -- all functions are testable in isolation.
 */

const MAS_PER_ARCSEC = 1000;
const ARCSEC_PER_DEG = 3600;
const DEG_PER_RAD = 180 / Math.PI;

export type DetectorOffsetMas = {
  xMas: number;
  yMas: number;
};

export type DetectorEpochOffsets = {
  epochA: DetectorOffsetMas;
  epochB: DetectorOffsetMas;
  separationMas: number;
};

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
  return pArcsec / ARCSEC_PER_DEG / DEG_PER_RAD;
}

export function normalizePhaseDeg(phaseDeg: number): number {
  const modded = phaseDeg % 360;
  return modded < 0 ? modded + 360 : modded;
}

export function oppositePhaseDeg(phaseDeg: number): number {
  return normalizePhaseDeg(phaseDeg + 180);
}

/**
 * Detector model:
 * - The apparent target displacement has magnitude p (mas).
 * - Epochs separated by 6 months are opposite on the detector path.
 * - Therefore measured angular separation is always 2p.
 */
export function detectorOffsetsMas(parallaxMas: number, phaseDeg: number): DetectorEpochOffsets {
  const pMas = Math.max(0, parallaxMas);
  const phaseRad = (normalizePhaseDeg(phaseDeg) * Math.PI) / 180;
  const xMas = pMas * Math.cos(phaseRad);
  const yMas = pMas * Math.sin(phaseRad);
  return {
    epochA: { xMas, yMas },
    epochB: { xMas: -xMas, yMas: -yMas },
    separationMas: 2 * pMas
  };
}

/**
 * Visualization helper.
 * Exaggeration is purely visual and must not be used in physics readouts.
 */
export function offsetPx(offsetMas: number, exaggeration: number, pxPerMas: number): number {
  return offsetMas * Math.max(exaggeration, 0) * Math.max(pxPerMas, 0);
}

/**
 * Convert sigma_p (mas) into a visible uncertainty circle radius in pixels.
 */
export function errorRadiusPx(
  sigmaMas: number,
  exaggeration: number,
  pxPerMas: number,
  minRadiusPx = 3,
  maxRadiusPx = 44
): number {
  const raw = Math.abs(offsetPx(sigmaMas, exaggeration, pxPerMas));
  return clamp(raw, minRadiusPx, maxRadiusPx);
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
  if (snr >= 10) return "Excellent";
  if (snr >= 5) return "Good";
  return "Poor";
}
