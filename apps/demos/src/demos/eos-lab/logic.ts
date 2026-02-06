export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function logSliderToValue(args: {
  sliderValue: number;
  sliderMin: number;
  sliderMax: number;
  valueMin: number;
  valueMax: number;
}): number {
  const {
    sliderValue,
    sliderMin,
    sliderMax,
    valueMin,
    valueMax
  } = args;

  const sliderSpan = sliderMax - sliderMin;
  if (!(sliderSpan > 0) || !(valueMin > 0) || !(valueMax > valueMin)) {
    return Number.NaN;
  }

  const fraction = clamp((sliderValue - sliderMin) / sliderSpan, 0, 1);
  const minLog = Math.log10(valueMin);
  const maxLog = Math.log10(valueMax);
  const valueLog = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, valueLog);
}

export function valueToLogSlider(args: {
  value: number;
  sliderMin: number;
  sliderMax: number;
  valueMin: number;
  valueMax: number;
}): number {
  const {
    value,
    sliderMin,
    sliderMax,
    valueMin,
    valueMax
  } = args;

  const sliderSpan = sliderMax - sliderMin;
  if (!(sliderSpan > 0) || !(valueMin > 0) || !(valueMax > valueMin) || !(value > 0)) {
    return Number.NaN;
  }

  const minLog = Math.log10(valueMin);
  const maxLog = Math.log10(valueMax);
  const valueLog = Math.log10(clamp(value, valueMin, valueMax));
  const fraction = clamp((valueLog - minLog) / (maxLog - minLog), 0, 1);
  return sliderMin + fraction * sliderSpan;
}

export function formatScientific(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";

  const abs = Math.abs(value);
  if (abs >= 1e5 || abs < 1e-3) return value.toExponential(digits - 1);
  return value.toFixed(digits);
}

export function formatFraction(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function percent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${(100 * value).toFixed(digits)}%`;
}

export function pressureBarPercent(args: {
  pressureDynePerCm2: number;
  maxPressureDynePerCm2: number;
}): number {
  const { pressureDynePerCm2: p, maxPressureDynePerCm2: maxP } = args;
  if (!Number.isFinite(p) || !Number.isFinite(maxP) || !(maxP > 0)) return 0;
  const ratio = p / maxP;
  const clamped = clamp(ratio, 0, 1);
  return 100 * clamped;
}

export function pressureTone(args: {
  pressureDynePerCm2: number;
  dominantPressureDynePerCm2: number;
}): "dominant" | "secondary" | "minor" {
  const { pressureDynePerCm2: p, dominantPressureDynePerCm2: pDom } = args;
  if (!Number.isFinite(p) || !Number.isFinite(pDom) || !(pDom > 0)) return "minor";
  const ratio = p / pDom;
  if (ratio >= 0.8) return "dominant";
  if (ratio >= 0.2) return "secondary";
  return "minor";
}

export type StellarCompositionFractions = {
  hydrogenMassFractionX: number;
  heliumMassFractionY: number;
  metalMassFractionZ: number;
};

export function compositionFromXY(args: {
  hydrogenMassFractionX: number;
  heliumMassFractionY: number;
}): StellarCompositionFractions {
  const x = clamp(
    Number.isFinite(args.hydrogenMassFractionX) ? args.hydrogenMassFractionX : 0,
    0,
    1
  );
  const y = clamp(
    Number.isFinite(args.heliumMassFractionY) ? args.heliumMassFractionY : 0,
    0,
    1 - x
  );
  const z = Math.max(0, 1 - x - y);
  return {
    hydrogenMassFractionX: x,
    heliumMassFractionY: y,
    metalMassFractionZ: z
  };
}

export function regimeMapCoordinates(args: {
  temperatureK: number;
  densityGPerCm3: number;
  temperatureMinK: number;
  temperatureMaxK: number;
  densityMinGPerCm3: number;
  densityMaxGPerCm3: number;
}): { xPct: number; yPct: number } {
  const {
    temperatureK,
    densityGPerCm3,
    temperatureMinK,
    temperatureMaxK,
    densityMinGPerCm3,
    densityMaxGPerCm3
  } = args;

  if (
    !(temperatureMinK > 0) ||
    !(temperatureMaxK > temperatureMinK) ||
    !(densityMinGPerCm3 > 0) ||
    !(densityMaxGPerCm3 > densityMinGPerCm3)
  ) {
    return { xPct: Number.NaN, yPct: Number.NaN };
  }

  const tClamped = clamp(temperatureK, temperatureMinK, temperatureMaxK);
  const rhoClamped = clamp(densityGPerCm3, densityMinGPerCm3, densityMaxGPerCm3);

  const tLogMin = Math.log10(temperatureMinK);
  const tLogMax = Math.log10(temperatureMaxK);
  const rhoLogMin = Math.log10(densityMinGPerCm3);
  const rhoLogMax = Math.log10(densityMaxGPerCm3);

  const xFrac = clamp((Math.log10(tClamped) - tLogMin) / (tLogMax - tLogMin), 0, 1);
  const rhoFrac = clamp(
    (Math.log10(rhoClamped) - rhoLogMin) / (rhoLogMax - rhoLogMin),
    0,
    1
  );

  return {
    xPct: 100 * xFrac,
    yPct: 100 * (1 - rhoFrac)
  };
}
