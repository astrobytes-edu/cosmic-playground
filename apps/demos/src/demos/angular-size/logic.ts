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

const SUPERSCRIPT_DIGITS = "\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079";

/** Convert an integer to Unicode superscript characters (e.g. 8 -> superscript 8). */
export function toSuperscript(n: number): string {
  const s = String(Math.round(n));
  let result = "";
  for (const ch of s) {
    if (ch === "-") result += "\u207B";
    else if (ch >= "0" && ch <= "9") result += SUPERSCRIPT_DIGITS[Number(ch)];
    else result += ch;
  }
  return result;
}

/**
 * Format a number with Unicode scientific notation (e.g. "1.50 x 10^8").
 * Uses fixed notation (toPrecision) when the number is in [0.01, 10^sigFigs).
 */
export function formatSci(value: number, sigFigs = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);

  // Use fixed notation for "human-readable" range
  if (abs >= 0.01 && abs < Math.pow(10, sigFigs)) {
    return value.toPrecision(sigFigs);
  }

  // Scientific notation with Unicode superscripts
  const expStr = value.toExponential(sigFigs - 1);
  const match = expStr.match(/^(.+)e([+-]\d+)$/);
  if (!match) return value.toPrecision(sigFigs);
  const mantissa = match[1];
  const expNum = parseInt(match[2], 10);
  return `${mantissa} \u00D7 10${toSuperscript(expNum)}`;
}

/**
 * Auto-select the best distance unit for a given value in km.
 * Returns { text, unit } with text formatted via formatSci.
 * Progression: cm -> m -> km -> AU -> pc -> kpc -> Mpc -> Gpc
 */
export function formatDistanceAuto(km: number, sigFigs = 3): { text: string; unit: string } {
  if (!Number.isFinite(km)) return { text: "\u2014", unit: "" };
  const abs = Math.abs(km);

  if (abs < 0.001)
    return { text: formatSci(km * 1e5, sigFigs), unit: "cm" };
  if (abs < 1)
    return { text: formatSci(km * 1000, sigFigs), unit: "m" };
  if (abs < 0.01 * KM_PER_AU)
    return { text: formatSci(km, sigFigs), unit: "km" };
  if (abs < 0.1 * KM_PER_PC)
    return { text: formatSci(km / KM_PER_AU, sigFigs), unit: "AU" };
  if (abs < 1000 * KM_PER_PC)
    return { text: formatSci(km / KM_PER_PC, sigFigs), unit: "pc" };
  if (abs < 1e6 * KM_PER_PC)
    return { text: formatSci(km / (1e3 * KM_PER_PC), sigFigs), unit: "kpc" };
  if (abs < 1e9 * KM_PER_PC)
    return { text: formatSci(km / (1e6 * KM_PER_PC), sigFigs), unit: "Mpc" };
  return { text: formatSci(km / (1e9 * KM_PER_PC), sigFigs), unit: "Gpc" };
}

/**
 * Auto-select the best diameter unit for a given value in km.
 * Returns { text, unit } with text formatted via formatSci.
 * Progression: cm -> m -> km -> AU -> kpc -> Mpc
 */
export function formatDiameterAuto(km: number, sigFigs = 3): { text: string; unit: string } {
  if (!Number.isFinite(km)) return { text: "\u2014", unit: "" };
  const abs = Math.abs(km);

  if (abs < 1e-4)
    return { text: formatSci(km * 1e5, sigFigs), unit: "cm" };
  if (abs < 1)
    return { text: formatSci(km * 1000, sigFigs), unit: "m" };
  if (abs < 1e8)
    return { text: formatSci(km, sigFigs), unit: "km" };
  if (abs < 0.1 * KM_PER_PC)
    return { text: formatSci(km / KM_PER_AU, sigFigs), unit: "AU" };
  if (abs < 1e6 * KM_PER_PC)
    return { text: formatSci(km / (1e3 * KM_PER_PC), sigFigs), unit: "kpc" };
  return { text: formatSci(km / (1e6 * KM_PER_PC), sigFigs), unit: "Mpc" };
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
