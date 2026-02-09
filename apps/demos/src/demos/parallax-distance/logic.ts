/**
 * Pure logic for the parallax-distance demo.
 * No DOM access -- all functions are testable in isolation.
 */

const MAS_PER_ARCSEC = 1000;
const ARCSEC_PER_DEG = 3600;
const DEG_PER_RAD = 180 / Math.PI;
const DEFAULT_NOISE_SALT = "cp-parallax-distance-axis-noise-v1";

export type Vec2 = {
  x: number;
  y: number;
};

export type Basis2D = {
  starDirHat: Vec2;
  axisHat: Vec2;
};

export type CaptureInferenceReason =
  | "ok"
  | "missing_capture"
  | "baseline_too_small"
  | "zero_shift";

export type CaptureInference = {
  computable: boolean;
  reason: CaptureInferenceReason;
  baselineVecAu: Vec2;
  baselineChordAu: number;
  baselineEffAu: number;
  phaseSepDeg: number;
  deltaThetaSignedMas: number;
  deltaThetaMas: number;
  pHatMas: number | null;
  dHatPc: number | null;
  equivalentSixMonthShiftMas: number | null;
  sigmaShiftMas: number | null;
  sigmaPHatMas: number | null;
  sigmaDHatPc: number | null;
  snrPHat: number | null;
  quality: string;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

export function parallaxArcsecFromMas(parallaxMas: number): number {
  return parallaxMas / MAS_PER_ARCSEC;
}

export function parallaxRadiansFromMas(parallaxMas: number): number {
  const pArcsec = parallaxArcsecFromMas(parallaxMas);
  return pArcsec / ARCSEC_PER_DEG / DEG_PER_RAD;
}

export function normalizePhaseDeg(phaseDeg: number): number {
  const modded = phaseDeg % 360;
  return modded < 0 ? modded + 360 : modded;
}

export function phaseSeparationDeg(phaseAdeg: number, phaseBdeg: number): number {
  const a = normalizePhaseDeg(phaseAdeg);
  const b = normalizePhaseDeg(phaseBdeg);
  const diff = Math.abs(a - b);
  return diff > 180 ? 360 - diff : diff;
}

export function vecLength(vector: Vec2): number {
  return Math.hypot(vector.x, vector.y);
}

export function dotVec2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVec2(vector: Vec2, scalar: number): Vec2 {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

export function normalizeVec2(vector: Vec2): Vec2 {
  const length = vecLength(vector);
  if (!(length > 0)) return { x: 1, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

export function perpVec2(vector: Vec2): Vec2 {
  return { x: -vector.y, y: vector.x };
}

export function buildParallaxBasis(starDirHint: Vec2 = { x: 0, y: 1 }): Basis2D {
  const starDirHat = normalizeVec2(starDirHint);
  const axisHat = normalizeVec2(perpVec2(starDirHat));
  return { starDirHat, axisHat };
}

export function earthPosAuFromPhaseDeg(phaseDeg: number): Vec2 {
  const phaseRad = (normalizePhaseDeg(phaseDeg) * Math.PI) / 180;
  return {
    x: Math.cos(phaseRad),
    y: Math.sin(phaseRad)
  };
}

export function detectorTrueOffsetMasFromPosition(
  parallaxMas: number,
  earthPosAu: Vec2,
  axisHat: Vec2
): Vec2 {
  const pMas = Math.max(0, parallaxMas);
  const axis = normalizeVec2(axisHat);
  const scalar = pMas * dotVec2(earthPosAu, axis);
  return scaleVec2(axis, scalar);
}

export function detectorTrueOffsetMasFromPhase(
  parallaxMas: number,
  phaseDeg: number,
  axisHat: Vec2
): Vec2 {
  return detectorTrueOffsetMasFromPosition(
    parallaxMas,
    earthPosAuFromPhaseDeg(phaseDeg),
    axisHat
  );
}

function hashStringFnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianUnitFromSeed(seed: number): number {
  const random = mulberry32(seed);
  const u1 = Math.max(random(), 1e-12);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function deterministicAxisNoiseMas(args: {
  epochLabel: "A" | "B" | string;
  phaseDeg: number;
  distancePc: number;
  sigmaMas: number;
  salt?: string;
}): number {
  if (!(args.sigmaMas > 0)) return 0;

  const roundedPhaseDeg = Math.round(normalizePhaseDeg(args.phaseDeg) * 10) / 10;
  const key = [
    args.salt ?? DEFAULT_NOISE_SALT,
    String(args.epochLabel),
    roundedPhaseDeg.toFixed(1),
    args.distancePc.toFixed(6),
    args.sigmaMas.toFixed(6)
  ].join("|");

  const seed = hashStringFnv1a(key);
  const z = gaussianUnitFromSeed(seed);
  return z * args.sigmaMas;
}

export function applyAxisNoiseToOffset(
  offsetTrueMas: Vec2,
  axisHat: Vec2,
  axisNoiseMas: number
): Vec2 {
  const axis = normalizeVec2(axisHat);
  return addVec2(offsetTrueMas, scaleVec2(axis, axisNoiseMas));
}

export function offsetPx(offsetMas: number, exaggeration: number, pxPerMas: number): number {
  return offsetMas * Math.max(exaggeration, 0) * Math.max(pxPerMas, 0);
}

export function errorRadiusPx(
  sigmaMas: number,
  exaggeration: number,
  pxPerMas: number,
  minRadiusPx = 3,
  maxRadiusPx = 44
): number {
  const raw = Math.abs(offsetPx(sigmaMas, exaggeration, pxPerMas));
  return clamp(raw, minRadiusPx, maxRadiusPx);
}

export function signalToNoise(signal: number, sigma: number): number {
  if (!(sigma > 0)) return Infinity;
  return signal / sigma;
}

export function describeMeasurability(snr: number): string {
  if (snr === Infinity) return "Excellent";
  if (!Number.isFinite(snr) || snr <= 0) return "Not measurable";
  if (snr >= 10) return "Excellent";
  if (snr >= 5) return "Good";
  return "Poor";
}

export function computeCaptureInference(args: {
  earthPosAuA: Vec2 | null;
  earthPosAuB: Vec2 | null;
  detectorMeasMasA: Vec2 | null;
  detectorMeasMasB: Vec2 | null;
  phaseDegA: number | null;
  phaseDegB: number | null;
  axisHat: Vec2;
  sigmaEpochMas: number;
  minEffectiveBaselineAu?: number;
}): CaptureInference {
  const minEffectiveBaselineAu = args.minEffectiveBaselineAu ?? 0.2;

  if (
    !args.earthPosAuA ||
    !args.earthPosAuB ||
    !args.detectorMeasMasA ||
    !args.detectorMeasMasB ||
    args.phaseDegA === null ||
    args.phaseDegB === null
  ) {
    return {
      computable: false,
      reason: "missing_capture",
      baselineVecAu: { x: 0, y: 0 },
      baselineChordAu: 0,
      baselineEffAu: 0,
      phaseSepDeg: 0,
      deltaThetaSignedMas: 0,
      deltaThetaMas: 0,
      pHatMas: null,
      dHatPc: null,
      equivalentSixMonthShiftMas: null,
      sigmaShiftMas: null,
      sigmaPHatMas: null,
      sigmaDHatPc: null,
      snrPHat: null,
      quality: "Not measurable"
    };
  }

  const axis = normalizeVec2(args.axisHat);
  const baselineVecAu = subVec2(args.earthPosAuB, args.earthPosAuA);
  const baselineChordAu = vecLength(baselineVecAu);
  const baselineEffAu = Math.abs(dotVec2(baselineVecAu, axis));
  const phaseSepDeg = phaseSeparationDeg(args.phaseDegA, args.phaseDegB);

  const deltaOffsetMas = subVec2(args.detectorMeasMasB, args.detectorMeasMasA);
  const deltaThetaSignedMas = dotVec2(deltaOffsetMas, axis);
  const deltaThetaMas = Math.abs(deltaThetaSignedMas);

  if (!(baselineEffAu > 0) || baselineEffAu < minEffectiveBaselineAu) {
    return {
      computable: false,
      reason: "baseline_too_small",
      baselineVecAu,
      baselineChordAu,
      baselineEffAu,
      phaseSepDeg,
      deltaThetaSignedMas,
      deltaThetaMas,
      pHatMas: null,
      dHatPc: null,
      equivalentSixMonthShiftMas: null,
      sigmaShiftMas: null,
      sigmaPHatMas: null,
      sigmaDHatPc: null,
      snrPHat: null,
      quality: "Not measurable"
    };
  }

  const pHatMas = deltaThetaMas / baselineEffAu;

  if (!(pHatMas > 0)) {
    return {
      computable: false,
      reason: "zero_shift",
      baselineVecAu,
      baselineChordAu,
      baselineEffAu,
      phaseSepDeg,
      deltaThetaSignedMas,
      deltaThetaMas,
      pHatMas: null,
      dHatPc: null,
      equivalentSixMonthShiftMas: null,
      sigmaShiftMas: null,
      sigmaPHatMas: null,
      sigmaDHatPc: null,
      snrPHat: null,
      quality: "Not measurable"
    };
  }

  const dHatPc = 1000 / pHatMas;
  const sigmaShiftMas = Math.SQRT2 * Math.max(args.sigmaEpochMas, 0);
  const sigmaPHatMas = sigmaShiftMas / baselineEffAu;
  const sigmaDHatPc = (1000 * sigmaPHatMas) / (pHatMas * pHatMas);
  const snrPHat = signalToNoise(pHatMas, sigmaPHatMas);

  return {
    computable: true,
    reason: "ok",
    baselineVecAu,
    baselineChordAu,
    baselineEffAu,
    phaseSepDeg,
    deltaThetaSignedMas,
    deltaThetaMas,
    pHatMas,
    dHatPc,
    equivalentSixMonthShiftMas: 2 * pHatMas,
    sigmaShiftMas,
    sigmaPHatMas,
    sigmaDHatPc,
    snrPHat,
    quality: describeMeasurability(snrPHat)
  };
}
