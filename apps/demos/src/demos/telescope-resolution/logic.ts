/**
 * Pure UI logic for the telescope-resolution demo.
 * No DOM access -- all functions are testable in isolation.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a 0-1000 slider position to a value on a log scale.
 * Used for aperture (0.007 m to 1e7 m) and separation (1e-3 to 1e3 arcsec).
 */
export function logSliderToValue(sliderVal: number, minVal: number, maxVal: number): number {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

/**
 * Convert a value back to a 0-1000 slider position on a log scale.
 * Inverse of logSliderToValue.
 */
export function valueToLogSlider(value: number, minVal: number, maxVal: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const frac = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(frac * 1000), 0, 1000);
}

/**
 * Format a number for display: scientific notation for very large/small,
 * fixed-point otherwise. Returns em-dash for non-finite values.
 */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

/**
 * Format an aperture in meters for display with auto unit selection.
 * Returns {text, unit} for flexible display (value + separate unit span).
 */
export function formatApertureM(apertureM: number): { text: string; unit: string } {
  if (!Number.isFinite(apertureM) || apertureM <= 0) return { text: "\u2014", unit: "" };
  if (apertureM >= 1000) return { text: formatNumber(apertureM / 1000, 3), unit: "km" };
  if (apertureM >= 1) return { text: formatNumber(apertureM, 3), unit: "m" };
  return { text: formatNumber(apertureM * 100, 3), unit: "cm" };
}

/**
 * Format a wavelength in cm for display with auto unit selection.
 * Returns {text, unit} for flexible display.
 */
export function formatWavelengthCm(lambdaCm: number, cmToNm: (cm: number) => number): { text: string; unit: string } {
  if (!Number.isFinite(lambdaCm) || lambdaCm <= 0) return { text: "\u2014", unit: "" };
  if (lambdaCm >= 100) return { text: formatNumber(lambdaCm / 100, 3), unit: "m" };
  if (lambdaCm >= 1) return { text: formatNumber(lambdaCm, 3), unit: "cm" };
  if (lambdaCm >= 0.1) return { text: formatNumber(lambdaCm * 10, 3), unit: "mm" };
  if (lambdaCm >= 1e-4) return { text: formatNumber(lambdaCm / 1e-4, 3), unit: "um" };
  return { text: formatNumber(cmToNm(lambdaCm), 3), unit: "nm" };
}

/**
 * Describe a resolution status as a label and visual tone.
 */
export function describeStatus(status: string): { label: string; tone: "good" | "warn" | "bad" } {
  if (status === "resolved") return { label: "Resolved", tone: "good" };
  if (status === "marginal") return { label: "Marginal", tone: "warn" };
  return { label: "Unresolved", tone: "bad" };
}

/**
 * Map a status tone to the data-tone attribute value used by the badge.
 */
export function toneToBadgeAttr(tone: "good" | "warn" | "bad"): string {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  return "danger";
}

/**
 * Compute the field of view in arcsec from the effective resolution and binary separation.
 * FOV is chosen to show the PSF structure clearly (at least 6x theta_eff or 3x separation).
 */
export function computeFovArcsec(thetaEffArcsec: number, separationArcsec: number): number {
  return Math.max(0.4, Math.min(500, Math.max(6 * thetaEffArcsec, 3 * separationArcsec)));
}

/**
 * Compute the zoomed FOV from the base FOV and zoom level.
 */
export function zoomedFov(fovArcsec: number, zoom: number): number {
  return fovArcsec / clamp(zoom, 1, 20);
}
