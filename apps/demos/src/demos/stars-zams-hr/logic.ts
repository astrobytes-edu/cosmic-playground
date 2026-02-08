export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

export function formatMetallicity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1e-3) return value.toExponential(2);
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
    teffMinK = 2500,
    teffMaxK = 50000,
    logLumMin = -4,
    logLumMax = 6,
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
