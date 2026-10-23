import { AstroConstants, AstroUnits } from "@cosmic/physics";

const KM_PER_AU = AstroConstants.LENGTH.KM_PER_AU;
const KM_PER_PC = AstroConstants.LENGTH.KM_PER_PC;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function logSliderToValue(sliderVal: number, minVal: number, maxVal: number): number {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

export function valueToLogSlider(value: number, minVal: number, maxVal: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const frac = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(frac * 1000), 0, 1000);
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(digits - 1);
  return value.toFixed(digits);
}

export function formatAngleDisplay(thetaDegValue: number): { text: string; unit: string } {
  if (!Number.isFinite(thetaDegValue)) return { text: "\u2014", unit: "" };
  const abs = Math.abs(thetaDegValue);
  if (abs >= 1) return { text: thetaDegValue.toFixed(2), unit: "deg" };
  if (abs >= 1 / 60) return { text: AstroUnits.degToArcmin(thetaDegValue).toFixed(1), unit: "arcmin" };
  return { text: AstroUnits.degToArcsec(thetaDegValue).toFixed(0), unit: "arcsec" };
}

/**
 * How scientific notation is written.
 *   "plain": ASCII, "1.50 x 10^8". For SVG <text>, tooltips and exports, which cannot host KaTeX.
 *   "math":  a KaTeX source string, $1.50 \times 10^{8}$. For HTML readouts only, and only
 *            through setMathText(); written to textContent it would show raw delimiters.
 * The default is "plain" so a caller that forgets to opt in degrades to readable ASCII.
 */
export type SciStyle = "plain" | "math";

/**
 * Format a number in scientific notation (see SciStyle for the two spellings).
 * Uses fixed notation (toPrecision) when the number is in [0.01, 10^sigFigs).
 */
export function formatSci(value: number, sigFigs = 3, style: SciStyle = "plain"): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);

  // Use fixed notation for "human-readable" range
  if (abs >= 0.01 && abs < Math.pow(10, sigFigs)) {
    return value.toPrecision(sigFigs);
  }

  const expStr = value.toExponential(sigFigs - 1);
  const match = expStr.match(/^(.+)e([+-]\d+)$/);
  if (!match) return value.toPrecision(sigFigs);
  const mantissa = match[1];
  const expNum = parseInt(match[2], 10);
  return style === "math"
    ? `$${mantissa} \\times 10^{${expNum}}$`
    : `${mantissa} x 10^${expNum}`;
}

/**
 * Auto-select the best distance unit for a given value in km.
 * Returns { text, unit } with text formatted via formatSci in the requested style.
 * Progression: cm -> m -> km -> AU -> pc -> kpc -> Mpc -> Gpc
 */
export function formatDistanceAuto(km: number, sigFigs = 3, style: SciStyle = "plain"): { text: string; unit: string } {
  if (!Number.isFinite(km)) return { text: "\u2014", unit: "" };
  const abs = Math.abs(km);

  if (abs < 0.001)
    return { text: formatSci(km * 1e5, sigFigs, style), unit: "cm" };
  if (abs < 1)
    return { text: formatSci(km * 1000, sigFigs, style), unit: "m" };
  if (abs < 0.01 * KM_PER_AU)
    return { text: formatSci(km, sigFigs, style), unit: "km" };
  if (abs < 0.1 * KM_PER_PC)
    return { text: formatSci(km / KM_PER_AU, sigFigs, style), unit: "AU" };
  if (abs < 1000 * KM_PER_PC)
    return { text: formatSci(km / KM_PER_PC, sigFigs, style), unit: "pc" };
  if (abs < 1e6 * KM_PER_PC)
    return { text: formatSci(km / (1e3 * KM_PER_PC), sigFigs, style), unit: "kpc" };
  if (abs < 1e9 * KM_PER_PC)
    return { text: formatSci(km / (1e6 * KM_PER_PC), sigFigs, style), unit: "Mpc" };
  return { text: formatSci(km / (1e9 * KM_PER_PC), sigFigs, style), unit: "Gpc" };
}

/**
 * Auto-select the best diameter unit for a given value in km.
 * Returns { text, unit } with text formatted via formatSci in the requested style.
 * Progression: cm -> m -> km -> AU -> kpc -> Mpc
 */
export function formatDiameterAuto(km: number, sigFigs = 3, style: SciStyle = "plain"): { text: string; unit: string } {
  if (!Number.isFinite(km)) return { text: "\u2014", unit: "" };
  const abs = Math.abs(km);

  if (abs < 1e-4)
    return { text: formatSci(km * 1e5, sigFigs, style), unit: "cm" };
  if (abs < 1)
    return { text: formatSci(km * 1000, sigFigs, style), unit: "m" };
  if (abs < 1e8)
    return { text: formatSci(km, sigFigs, style), unit: "km" };
  if (abs < 0.1 * KM_PER_PC)
    return { text: formatSci(km / KM_PER_AU, sigFigs, style), unit: "AU" };
  if (abs < 1e6 * KM_PER_PC)
    return { text: formatSci(km / (1e3 * KM_PER_PC), sigFigs, style), unit: "kpc" };
  return { text: formatSci(km / (1e6 * KM_PER_PC), sigFigs, style), unit: "Mpc" };
}

export function describeMoonOrbitAngle(angleDeg: number): string {
  const normalized = ((angleDeg % 360) + 360) % 360;
  if (Math.abs(normalized - 0) <= 1 || Math.abs(normalized - 360) <= 1) return "Perigee";
  if (Math.abs(normalized - 180) <= 1) return "Apogee";
  return `${Math.round(normalized)} deg`;
}

export function describeMoonRecessionTime(timeMyr: number): string {
  const t = Math.round(timeMyr);
  if (t === 0) return "Today";
  if (t < 0) return `${Math.abs(t)} Myr ago`;
  return `+${t} Myr`;
}
