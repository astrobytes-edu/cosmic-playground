export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const HR_AXIS_LIMITS = {
  teffMinKK: 1,
  teffMaxKK: 100,
  logLumMin: -4,
  logLumMax: 6,
} as const;

export function logSliderToValue(sliderVal: number, minVal: number, maxVal: number): number {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return 10 ** logVal;
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
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

function asPowerOfTenString(value: number, digits = 2): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  const exponent = Math.floor(Math.log10(value));
  const coefficient = value / 10 ** exponent;
  if (Math.abs(coefficient - 1) < 1e-10) return `10^${exponent}`;
  return `${coefficient.toFixed(digits)}x10^${exponent}`;
}

export function formatMetallicity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1e-3) return asPowerOfTenString(value, 2);
  return value.toFixed(4);
}

export function hrDiagramCoordinates(args: {
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
    teffMinK = HR_AXIS_LIMITS.teffMinKK * 1000,
    teffMaxK = HR_AXIS_LIMITS.teffMaxKK * 1000,
    logLumMin = HR_AXIS_LIMITS.logLumMin,
    logLumMax = HR_AXIS_LIMITS.logLumMax,
  } = args;

  if (!Number.isFinite(teffK) || teffK <= 0) return { xNorm: 0, yNorm: 0 };
  if (!Number.isFinite(luminosityLsun) || luminosityLsun <= 0) return { xNorm: 0, yNorm: 0 };

  const logTeff = Math.log10(teffK);
  const logTeffMin = Math.log10(teffMinK);
  const logTeffMax = Math.log10(teffMaxK);
  const xNorm = clamp((logTeffMax - logTeff) / (logTeffMax - logTeffMin), 0, 1);

  const logLum = Math.log10(luminosityLsun);
  const yNorm = clamp((logLum - logLumMin) / (logLumMax - logLumMin), 0, 1);

  return { xNorm, yNorm };
}

export function luminosityLsunFromRadiusTemperature(args: {
  radiusRsun: number;
  teffK: number;
  tSunK: number;
}): number {
  const { radiusRsun, teffK, tSunK } = args;
  if (!Number.isFinite(radiusRsun) || radiusRsun <= 0) return Number.NaN;
  if (!Number.isFinite(teffK) || teffK <= 0) return Number.NaN;
  if (!Number.isFinite(tSunK) || tSunK <= 0) return Number.NaN;
  const tempRatio = teffK / tSunK;
  return radiusRsun * radiusRsun * tempRatio ** 4;
}

export function decadeTicks(minExponent: number, maxExponent: number): number[] {
  const ticks: number[] = [];
  for (let exponent = minExponent; exponent <= maxExponent; exponent += 1) {
    ticks.push(Number((10 ** exponent).toPrecision(12)));
  }
  return ticks;
}

export function minorLogTicks(minExponent: number, maxExponent: number): number[] {
  const ticks: number[] = [];
  for (let exponent = minExponent; exponent < maxExponent; exponent += 1) {
    const base = 10 ** exponent;
    for (let coefficient = 2; coefficient <= 9; coefficient += 1) {
      ticks.push(Number((coefficient * base).toPrecision(12)));
    }
  }
  return ticks;
}

export function superscript(value: number): string {
  const map: Record<string, string> = {
    "0": "\u2070",
    "1": "\u00B9",
    "2": "\u00B2",
    "3": "\u00B3",
    "4": "\u2074",
    "5": "\u2075",
    "6": "\u2076",
    "7": "\u2077",
    "8": "\u2078",
    "9": "\u2079",
    "-": "\u207B",
  };
  return String(value).split("").map((character) => map[character] ?? character).join("");
}

export function logTickPowersOfTenLabel(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  const exponent = Math.round(Math.log10(value));
  return `10${superscript(exponent)}`;
}
