import type { ExportPayloadV1 } from "@cosmic/runtime";
import { DopplerShiftModel } from "@cosmic/physics";

export type FormulaMode = "non-relativistic" | "relativistic";
export type SpectrumMode = "emission" | "absorption";
export type LineDensityMode = "strongest-8" | "all";

export interface SpectrumLine {
  wavelengthNm: number;
  relativeIntensity: number;
  label: string;
}

export interface SpectrumDomain {
  minNm: number;
  maxNm: number;
}

export interface ChallengeTarget {
  element: string;
  mode: SpectrumMode;
  velocityKmS: number;
  z: number;
}

export const VELOCITY_SLIDER_MIN_KM_S = -100_000;
export const VELOCITY_SLIDER_MAX_KM_S = 100_000;
export const REDSHIFT_SLIDER_MIN = -0.8;
export const REDSHIFT_SLIDER_MAX = 10;
export const DEFAULT_SPECTRUM_DOMAIN: SpectrumDomain = { minNm: 80, maxNm: 2200 };
export const VISIBLE_SPECTRUM_DOMAIN: SpectrumDomain = { minNm: 300, maxNm: 900 };

const MAX_PHYSICAL_BETA = 0.999_999;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (Math.abs(value) >= 1e4 || (Math.abs(value) > 0 && Math.abs(value) < 1e-3)) {
    return value.toExponential(Math.max(0, digits - 1));
  }
  return value.toFixed(digits);
}

export function formatSigned(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  const base = formatNumber(Math.abs(value), digits);
  if (value > 0) return `+${base}`;
  if (value < 0) return `-${base}`;
  return "0";
}

function physicalVelocityClamp(velocityKmS: number): number {
  const maxAbsVelocity = MAX_PHYSICAL_BETA * DopplerShiftModel.C_KM_S;
  return clamp(velocityKmS, -maxAbsVelocity, maxAbsVelocity);
}

export function syncPhysicalFromVelocity(velocityKmS: number): {
  velocityKmS: number;
  z: number;
} {
  const safeVelocity = Number.isFinite(velocityKmS) ? physicalVelocityClamp(velocityKmS) : 0;
  const z = DopplerShiftModel.redshiftFromVelocity({
    velocityKmS: safeVelocity,
    relativistic: true,
  });
  return {
    velocityKmS: safeVelocity,
    z: Number.isFinite(z) ? z : 0,
  };
}

export function syncPhysicalFromRedshift(z: number): {
  velocityKmS: number;
  z: number;
} {
  const safeZ = Number.isFinite(z) ? clamp(z, REDSHIFT_SLIDER_MIN, REDSHIFT_SLIDER_MAX) : 0;
  const velocityKmS = DopplerShiftModel.velocityFromRedshift({
    z: safeZ,
    relativistic: true,
  });
  if (!Number.isFinite(velocityKmS)) {
    return { velocityKmS: 0, z: 0 };
  }
  const clampedVelocity = physicalVelocityClamp(velocityKmS);
  const zRoundTrip = DopplerShiftModel.redshiftFromVelocity({
    velocityKmS: clampedVelocity,
    relativistic: true,
  });
  return {
    velocityKmS: clampedVelocity,
    z: Number.isFinite(zRoundTrip) ? zRoundTrip : safeZ,
  };
}

export function velocitySliderIsClamped(velocityKmS: number): boolean {
  return Math.abs(velocityKmS) > VELOCITY_SLIDER_MAX_KM_S + 1e-6;
}

export function redshiftSliderStep(z: number): number {
  const absZ = Math.abs(z);
  if (absZ < 0.5) return 0.001;
  if (absZ < 3) return 0.01;
  return 0.1;
}

export function selectRepresentativeLine<T extends SpectrumLine>(
  lines: T[],
  options?: {
    preferVisible?: boolean;
    visibleMinNm?: number;
    visibleMaxNm?: number;
  },
): T | undefined {
  if (lines.length === 0) return undefined;
  const preferVisible = options?.preferVisible ?? false;
  const visibleMinNm = options?.visibleMinNm ?? 380;
  const visibleMaxNm = options?.visibleMaxNm ?? 750;

  const candidatePool = preferVisible
    ? lines.filter((line) => line.wavelengthNm >= visibleMinNm && line.wavelengthNm <= visibleMaxNm)
    : lines;
  const scored = candidatePool.length > 0 ? candidatePool : lines;

  let best = scored[0];
  for (const line of scored.slice(1)) {
    if (line.relativeIntensity > best.relativeIntensity) {
      best = line;
      continue;
    }
    if (line.relativeIntensity === best.relativeIntensity && line.wavelengthNm < best.wavelengthNm) {
      best = line;
    }
  }
  return best;
}

export function selectDisplayLines(args: {
  lines: SpectrumLine[];
  densityMode: LineDensityMode;
}): SpectrumLine[] {
  if (args.densityMode === "all" || args.lines.length <= 8) {
    return [...args.lines].sort((a, b) => a.wavelengthNm - b.wavelengthNm);
  }

  return [...args.lines]
    .sort((a, b) => {
      if (b.relativeIntensity !== a.relativeIntensity) {
        return b.relativeIntensity - a.relativeIntensity;
      }
      return a.wavelengthNm - b.wavelengthNm;
    })
    .slice(0, 8)
    .sort((a, b) => a.wavelengthNm - b.wavelengthNm);
}

export function centerDomainOnLines(args: {
  linesNm: number[];
  currentDomain: SpectrumDomain;
}): SpectrumDomain {
  const finiteLines = args.linesNm.filter((value) => Number.isFinite(value));
  if (finiteLines.length === 0) return { ...args.currentDomain };

  const currentSpan = args.currentDomain.maxNm - args.currentDomain.minNm;
  const minLine = Math.min(...finiteLines);
  const maxLine = Math.max(...finiteLines);
  const center = (minLine + maxLine) / 2;

  let minNm = center - currentSpan / 2;
  let maxNm = center + currentSpan / 2;

  if (minNm < DEFAULT_SPECTRUM_DOMAIN.minNm) {
    maxNm += DEFAULT_SPECTRUM_DOMAIN.minNm - minNm;
    minNm = DEFAULT_SPECTRUM_DOMAIN.minNm;
  }
  if (maxNm > DEFAULT_SPECTRUM_DOMAIN.maxNm) {
    minNm -= maxNm - DEFAULT_SPECTRUM_DOMAIN.maxNm;
    maxNm = DEFAULT_SPECTRUM_DOMAIN.maxNm;
  }

  minNm = clamp(minNm, DEFAULT_SPECTRUM_DOMAIN.minNm, DEFAULT_SPECTRUM_DOMAIN.maxNm - currentSpan);
  maxNm = minNm + currentSpan;

  return { minNm, maxNm };
}

export function axisTicks(args: { domain: SpectrumDomain; count?: number }): number[] {
  const count = Math.max(2, Math.floor(args.count ?? 6));
  const span = args.domain.maxNm - args.domain.minNm;
  if (!Number.isFinite(span) || span <= 0) return [args.domain.minNm, args.domain.maxNm];
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(args.domain.minNm + index * step));
}

export function wavelengthToFraction(nm: number, domain: SpectrumDomain): number {
  return clamp((nm - domain.minNm) / (domain.maxNm - domain.minNm), 0, 1);
}

export function wavelengthToRgbString(nm: number): string {
  let r = 0;
  let g = 0;
  let b = 0;

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

  let factor = 0;
  if (nm >= 380 && nm < 420) {
    factor = 0.3 + 0.7 * ((nm - 380) / (420 - 380));
  } else if (nm >= 420 && nm <= 700) {
    factor = 1;
  } else if (nm > 700 && nm <= 750) {
    factor = 0.3 + 0.7 * ((750 - nm) / (750 - 700));
  }

  if (factor === 0) {
    if (nm < 380) return "rgb(120, 80, 200)";
    return "rgb(100, 30, 30)";
  }

  return `rgb(${Math.round(r * factor * 255)}, ${Math.round(g * factor * 255)}, ${Math.round(b * factor * 255)})`;
}

export function directionSummary(velocityKmS: number): {
  keyword: "blueshift" | "redshift" | "rest";
  sentence: string;
} {
  if (velocityKmS < 0) {
    return {
      keyword: "blueshift",
      sentence: "BLUESHIFT <- source approaching",
    };
  }
  if (velocityKmS > 0) {
    return {
      keyword: "redshift",
      sentence: "source receding -> REDSHIFT",
    };
  }
  return {
    keyword: "rest",
    sentence: "At rest: no Doppler shift",
  };
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickChallengeTarget(args: {
  targets: ChallengeTarget[];
  random: () => number;
  previous?: ChallengeTarget | null;
}): ChallengeTarget {
  if (args.targets.length === 0) {
    throw new Error("pickChallengeTarget requires at least one target.");
  }

  const rawIndex = Math.floor(args.random() * args.targets.length);
  let index = clamp(rawIndex, 0, args.targets.length - 1);

  if (args.targets.length > 1 && args.previous) {
    const current = args.targets[index];
    const sameAsPrevious = current.element === args.previous.element
      && current.mode === args.previous.mode
      && current.velocityKmS === args.previous.velocityKmS;
    if (sameAsPrevious) {
      index = (index + 1) % args.targets.length;
    }
  }

  return args.targets[index];
}

export function isMysteryCopyLocked(args: {
  mysteryActive: boolean;
  mysteryRevealed: boolean;
}): boolean {
  return args.mysteryActive && !args.mysteryRevealed;
}

function formulaLabel(mode: FormulaMode): string {
  return mode === "relativistic" ? "Relativistic" : "Non-relativistic";
}

function spectrumModeLabel(mode: SpectrumMode): string {
  return mode === "emission" ? "Emission" : "Absorption";
}

function lineDensityLabel(mode: LineDensityMode): string {
  return mode === "all" ? "Show all" : "Strongest 8";
}

export function buildDopplerExportPayload(args: {
  timestampIso?: string;
  radialVelocityKmS: number;
  redshift: number;
  element: string;
  formulaMode: FormulaMode;
  spectrumMode: SpectrumMode;
  lineDensityMode: LineDensityMode;
  lambdaRestNm: number;
  lambdaObsNm: number;
  deltaLambdaNm: number;
  nuRestTHz: number;
  nuObsTHz: number;
  deltaNuTHz: number;
  regimeLabel: string;
  divergencePercent: number;
  zNonRel: number;
  zRel: number;
  representativeLineLabel: string;
  wavelengthBand: string;
  domainMinNm: number;
  domainMaxNm: number;
  challengeState: "inactive" | "active-hidden" | "revealed";
}): ExportPayloadV1 {
  const timestampIso = args.timestampIso ?? new Date().toISOString();

  return {
    version: 1,
    timestamp: timestampIso,
    parameters: [
      { name: "Radial velocity (km/s)", value: formatSigned(args.radialVelocityKmS, 2) },
      { name: "Redshift z", value: formatNumber(args.redshift, 6) },
      { name: "Element", value: args.element },
      { name: "Spectrum mode", value: spectrumModeLabel(args.spectrumMode) },
      { name: "Formula", value: formulaLabel(args.formulaMode) },
      { name: "Line density", value: lineDensityLabel(args.lineDensityMode) },
      { name: "Representative line", value: args.representativeLineLabel },
      { name: "Domain window (nm)", value: `${Math.round(args.domainMinNm)}-${Math.round(args.domainMaxNm)}` },
      { name: "Challenge state", value: args.challengeState },
    ],
    readouts: [
      { name: "Representative line", value: args.representativeLineLabel },
      { name: "Rest wavelength (nm)", value: formatNumber(args.lambdaRestNm, 3) },
      { name: "Observed wavelength (nm)", value: formatNumber(args.lambdaObsNm, 3) },
      { name: "Wavelength shift (nm)", value: formatSigned(args.deltaLambdaNm, 3) },
      { name: "Rest frequency (THz)", value: formatNumber(args.nuRestTHz, 3) },
      { name: "Observed frequency (THz)", value: formatNumber(args.nuObsTHz, 3) },
      { name: "Frequency shift (THz)", value: formatSigned(args.deltaNuTHz, 3) },
      { name: "Band", value: args.wavelengthBand },
      { name: "Regime", value: args.regimeLabel },
      { name: "NR divergence (%)", value: formatNumber(args.divergencePercent, 3) },
      { name: "z (non-rel)", value: formatNumber(args.zNonRel, 6) },
      { name: "z (relativistic)", value: formatNumber(args.zRel, 6) },
    ],
    notes: [
      "Non-relativistic: lambda_obs = lambda_0 (1 + v/c), nu_obs = nu_0 / (1 + v/c).",
      "Relativistic: lambda_obs = lambda_0 sqrt((1+beta)/(1-beta)), nu_obs = nu_0 sqrt((1-beta)/(1+beta)).",
      "Sign convention: positive radial velocity means receding (redshift).",
      "Physical state coupling uses relativistic z <-> velocity mapping.",
      "Wave diagram spacing is uniform at the observer (light, no medium).",
      "Spectral lines use vacuum wavelengths; element catalogs are empirical (NIST teaching subset).",
    ],
  };
}
