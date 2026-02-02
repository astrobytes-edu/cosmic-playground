export type Rgb = { r: number; g: number; b: number };

const CONSTANTS = {
  // Physical constants (CGS).
  cCmPerS: 2.998e10,
  hErgS: 6.626e-27,
  kErgPerK: 1.381e-16,
  sigmaErgPerSCm2K4: 5.67e-5,
  wienDisplacementCmK: 0.2898,

  // Unit conversions.
  cmToNm: 1e7,
  nmToCm: 1e-7,

  // Solar reference values (for ratios / labels).
  TSunK: 5772
} as const;

function clampByte(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)));
}

function wienPeakCm(temperatureK: number): number {
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return NaN;
  return CONSTANTS.wienDisplacementCmK / temperatureK;
}

function wienPeakNm(temperatureK: number): number {
  const wavelengthCm = wienPeakCm(temperatureK);
  if (!Number.isFinite(wavelengthCm)) return NaN;
  return wavelengthCm * CONSTANTS.cmToNm;
}

function planckSpectralRadianceCgs(args: { wavelengthCm: number; temperatureK: number }): number {
  const { wavelengthCm, temperatureK } = args;
  if (!Number.isFinite(wavelengthCm) || wavelengthCm <= 0) return 0;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return 0;

  // B_λ(T) = (2hc²/λ⁵) * 1/(exp(hc/(λkT)) - 1)
  const factor1 = (2 * CONSTANTS.hErgS * CONSTANTS.cCmPerS * CONSTANTS.cCmPerS) / Math.pow(wavelengthCm, 5);
  const exponent = (CONSTANTS.hErgS * CONSTANTS.cCmPerS) / (wavelengthCm * CONSTANTS.kErgPerK * temperatureK);

  // Prevent overflow for very small wavelengths / low temperatures.
  if (exponent > 700) return 0;

  return factor1 / (Math.exp(exponent) - 1);
}

function stefanBoltzmannFluxCgs(args: { temperatureK: number }): number {
  const { temperatureK } = args;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return 0;
  return CONSTANTS.sigmaErgPerSCm2K4 * Math.pow(temperatureK, 4);
}

function luminosityRatioSameRadius(args: { temperatureK: number; referenceTemperatureK?: number }): number {
  const { temperatureK } = args;
  const referenceTemperatureK = args.referenceTemperatureK ?? CONSTANTS.TSunK;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return 0;
  if (!Number.isFinite(referenceTemperatureK) || referenceTemperatureK <= 0) return 0;
  return Math.pow(temperatureK / referenceTemperatureK, 4);
}

function temperatureToRgbApprox(args: { temperatureK: number }): Rgb {
  const { temperatureK } = args;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return { r: 0, g: 0, b: 0 };

  // A perceptual approximation (not CIE colorimetry). Kept intentionally simple and documented in model notes.
  let r: number;
  let g: number;
  let b: number;

  if (temperatureK < 1000) {
    r = Math.min(255, temperatureK / 4);
    g = 0;
    b = 0;
  } else if (temperatureK < 4000) {
    r = 255;
    g = Math.min(255, (temperatureK - 1000) / 12);
    b = 0;
  } else if (temperatureK < 6500) {
    r = 255;
    g = Math.min(255, 180 + (temperatureK - 4000) / 35);
    b = Math.min(255, (temperatureK - 4000) / 8);
  } else if (temperatureK < 10000) {
    r = Math.max(200, 255 - (temperatureK - 6500) / 30);
    g = Math.max(200, 255 - (temperatureK - 6500) / 50);
    b = 255;
  } else {
    r = Math.max(150, 200 - (temperatureK - 10000) / 200);
    g = Math.max(180, 200 - (temperatureK - 10000) / 300);
    b = 255;
  }

  return { r: clampByte(r), g: clampByte(g), b: clampByte(b) };
}

function colorName(args: { temperatureK: number }): string {
  const { temperatureK } = args;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return "Unknown";
  if (temperatureK < 2000) return "Infrared (invisible)";
  if (temperatureK < 3500) return "Deep Red";
  if (temperatureK < 4500) return "Orange-Red";
  if (temperatureK < 5500) return "Yellow-Orange";
  if (temperatureK < 6500) return "Yellow-White";
  if (temperatureK < 8000) return "White";
  if (temperatureK < 12000) return "Blue-White";
  return "Blue";
}

function spectralClassLetter(args: { temperatureK: number }): string {
  const { temperatureK } = args;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return "Unknown";
  if (temperatureK >= 30000) return "O";
  if (temperatureK >= 10000) return "B";
  if (temperatureK >= 7500) return "A";
  if (temperatureK >= 6000) return "F";
  if (temperatureK >= 5200) return "G";
  if (temperatureK >= 3700) return "K";
  if (temperatureK >= 2400) return "M";
  return "L+";
}

export const BlackbodyRadiationModel = {
  CONSTANTS,
  wienPeakCm,
  wienPeakNm,
  planckSpectralRadianceCgs,
  stefanBoltzmannFluxCgs,
  luminosityRatioSameRadius,
  temperatureToRgbApprox,
  colorName,
  spectralClassLetter
} as const;

