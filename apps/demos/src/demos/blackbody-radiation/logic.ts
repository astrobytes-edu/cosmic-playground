/**
 * Pure UI logic for the blackbody-radiation demo.
 * No DOM access -- all functions are testable in isolation.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a 0-1000 slider position to a value on a log scale.
 * Used for the temperature slider which spans 2.725 K to 1e6 K.
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
 * Return the wavelength domain for the spectrum plot (in nm).
 * Wide enough to show peaks for both CMB (2.725 K) and hot stars.
 */
export function wavelengthDomainNm(): { minNm: number; maxNm: number } {
  return { minNm: 10, maxNm: 1e6 };
}

/**
 * Generate n logarithmically-spaced values between min and max.
 * Used for sampling the Planck curve across a wide wavelength range.
 */
export function sampleLogSpace(min: number, max: number, n: number): number[] {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push(Math.pow(10, minLog + t * (maxLog - minLog)));
  }
  return out;
}
