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

/**
 * Map a wavelength (nm) to approximate visible-spectrum RGB.
 * Uses Dan Bruton's piecewise-linear approximation.
 * Returns near-black for wavelengths outside the visible range.
 */
export function wavelengthToApproxRgb(nm: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380);
    b = 1;
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm >= 490 && nm < 510) {
    g = 1;
    b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
  } else if (nm >= 580 && nm < 645) {
    r = 1;
    g = -(nm - 645) / (645 - 580);
  } else if (nm >= 645 && nm <= 750) {
    r = 1;
  }
  // Intensity tapering at edges of visible range
  let f = 0;
  if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / (420 - 380);
  else if (nm >= 420 && nm <= 700) f = 1;
  else if (nm > 700 && nm <= 750) f = 0.3 + 0.7 * (750 - nm) / (750 - 700);
  return {
    r: Math.round(r * f * 255),
    g: Math.round(g * f * 255),
    b: Math.round(b * f * 255)
  };
}

/**
 * Format a wavelength value with the most natural unit (nm / um / mm).
 */
export function formatWavelengthLabel(nm: number): string {
  if (nm >= 1e6) return `${(nm / 1e6).toFixed(0)} mm`;
  if (nm >= 1e4) return `${(nm / 1e3).toFixed(0)} \u03BCm`;
  if (nm >= 1e3) return `${(nm / 1e3).toFixed(nm >= 2e3 ? 0 : 1)} \u03BCm`;
  return `${nm.toFixed(0)} nm`;
}

/**
 * Compute the fractional x-position of a wavelength on a log-scale plot.
 * Returns 0..1 within the plot area.
 */
export function wavelengthToLogFraction(nm: number, minNm: number, maxNm: number): number {
  return (Math.log10(nm) - Math.log10(minNm)) / (Math.log10(maxNm) - Math.log10(minNm));
}

/**
 * Format a wavelength for the readout panel, returning separate value and unit.
 * Picks the most natural unit (nm / um / mm) for readability.
 */
export function formatWavelengthReadout(nm: number): { value: string; unit: string } {
  if (!Number.isFinite(nm)) return { value: "\u2014", unit: "" };
  if (nm >= 1e6) return { value: (nm / 1e6).toFixed(nm >= 2e6 ? 0 : 1), unit: "mm" };
  if (nm >= 1e4) return { value: (nm / 1e3).toFixed(0), unit: "\u03BCm" };
  if (nm >= 1e3) return { value: (nm / 1e3).toFixed(1), unit: "\u03BCm" };
  return { value: Math.round(nm).toString(), unit: "nm" };
}
