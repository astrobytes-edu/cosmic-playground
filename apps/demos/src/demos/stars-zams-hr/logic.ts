export type PlotMode = "observer" | "theorist";

export const THEORIST_AXIS_LIMITS = {
  teffMinK: 2500,
  teffMaxK: 50000,
  logLumMin: -5,
  logLumMax: 6
} as const;

export const OBSERVER_AXIS_LIMITS = {
  colorMin: -0.4,
  colorMax: 2.2,
  mvBright: -10,
  mvFaint: 16
} as const;

export const RADIUS_GUIDE_VALUES_RSUN = [0.01, 0.1, 1, 10, 100, 1000] as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e5 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

export function formatWithUnit(value: number, unit: string, digits = 2): string {
  return `${formatNumber(value, digits)} ${unit}`;
}

export function hrCoordinates(args: {
  teffK: number;
  luminosityLsun: number;
  teffMinK?: number;
  teffMaxK?: number;
  logLumMin?: number;
  logLumMax?: number;
}): { xNorm: number; yNorm: number } {
  const {
    teffK,
    luminosityLsun,
    teffMinK = THEORIST_AXIS_LIMITS.teffMinK,
    teffMaxK = THEORIST_AXIS_LIMITS.teffMaxK,
    logLumMin = THEORIST_AXIS_LIMITS.logLumMin,
    logLumMax = THEORIST_AXIS_LIMITS.logLumMax
  } = args;

  if (!(teffK > 0) || !(luminosityLsun > 0)) return { xNorm: 0, yNorm: 0 };

  const xLogMin = Math.log10(teffMinK);
  const xLogMax = Math.log10(teffMaxK);
  const xLog = Math.log10(teffK);

  const yLog = Math.log10(luminosityLsun);

  return {
    xNorm: clamp((xLogMax - xLog) / (xLogMax - xLogMin), 0, 1),
    yNorm: clamp((yLog - logLumMin) / (logLumMax - logLumMin), 0, 1)
  };
}

export function cmdCoordinates(args: {
  bMinusV: number;
  absoluteMv: number;
  colorMin?: number;
  colorMax?: number;
  mvBright?: number;
  mvFaint?: number;
}): { xNorm: number; yNorm: number } {
  const {
    bMinusV,
    absoluteMv,
    colorMin = OBSERVER_AXIS_LIMITS.colorMin,
    colorMax = OBSERVER_AXIS_LIMITS.colorMax,
    mvBright = OBSERVER_AXIS_LIMITS.mvBright,
    mvFaint = OBSERVER_AXIS_LIMITS.mvFaint
  } = args;

  if (!Number.isFinite(bMinusV) || !Number.isFinite(absoluteMv)) return { xNorm: 0, yNorm: 0 };

  return {
    xNorm: clamp((bMinusV - colorMin) / (colorMax - colorMin), 0, 1),
    yNorm: clamp((mvFaint - absoluteMv) / (mvFaint - mvBright), 0, 1)
  };
}

export function luminosityLsunFromRadiusTemperature(args: {
  radiusRsun: number;
  teffK: number;
  tSunK: number;
}): number {
  const { radiusRsun, teffK, tSunK } = args;
  if (!(radiusRsun > 0) || !(teffK > 0) || !(tSunK > 0)) return Number.NaN;
  const tempRatio = teffK / tSunK;
  return radiusRsun * radiusRsun * tempRatio ** 4;
}

export function radiusRsunFromLuminosityTemperature(args: {
  luminosityLsun: number;
  teffK: number;
  tSunK: number;
}): number {
  const { luminosityLsun, teffK, tSunK } = args;
  if (!(luminosityLsun > 0) || !(teffK > 0) || !(tSunK > 0)) return Number.NaN;
  const tempRatio = teffK / tSunK;
  return Math.sqrt(luminosityLsun / (tempRatio ** 4));
}

export function logTicks(minExp: number, maxExp: number): number[] {
  const ticks: number[] = [];
  for (let exp = minExp; exp <= maxExp; exp += 1) {
    ticks.push(10 ** exp);
  }
  return ticks;
}

export function linearTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let x = min; x <= max + 1e-9; x += step) {
    ticks.push(Number(x.toFixed(6)));
  }
  return ticks;
}

export function massColorHex(massMsun: number): string {
  const logMin = Math.log10(0.1);
  const logMax = Math.log10(50);
  const t = clamp((Math.log10(Math.max(massMsun, 0.1)) - logMin) / (logMax - logMin), 0, 1);
  const hue = 220 - 200 * t;
  const sat = 78;
  const light = 56;
  return `hsl(${hue.toFixed(0)}deg ${sat}% ${light}%)`;
}
