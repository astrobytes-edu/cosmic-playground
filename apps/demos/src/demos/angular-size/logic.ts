import { AstroUnits } from "@cosmic/physics";

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
