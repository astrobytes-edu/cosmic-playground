import { ZamsTout1996Model } from "./zamsTout1996Model";

export type HrStarStage =
  | "ms"
  | "subgiant"
  | "giant"
  | "supergiant"
  | "white_dwarf"
  | "compact_remnant";

/**
 * Synthetic stellar population generation options.
 * All quantities use explicit physical units in field names.
 */
export type PopulationOptions = {
  N: number;
  seed: string | number;
  distancePc: number;
  photErr: number;
  modeCluster?: boolean;
  clusterAge?: number;
  binaryFrac?: number;
  metallicityZ?: number;
};

/**
 * Synthetic star record used by the HR inference lab.
 * - mass: solar masses
 * - Teff: kelvin
 * - L: solar luminosity units
 * - R: solar radius units
 * - Mv: absolute V magnitude
 * - BminusV: Johnson B-V color index
 */
export type PopulationStar = {
  id: string;
  mass: number;
  Teff: number;
  L: number;
  R: number;
  Mv: number;
  BminusV: number;
  stage: HrStarStage;
};

const T_SUN_K = ZamsTout1996Model.CONSTANTS.tSunK;
const M_BOL_SUN = 4.74;

const MASS_MIN_MSUN = 0.1;
const MASS_MAX_MSUN = 50;
const DEFAULT_Z = ZamsTout1996Model.CONSTANTS.zSun;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

function gaussianUnit(random: () => number): number {
  const u1 = Math.max(random(), 1e-12);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Salpeter-like IMF sampling (dN/dM ∝ M^-2.35).
 */
function sampleMassMsun(random: () => number, minMsun: number, maxMsun: number): number {
  const alpha = 2.35;
  const p = 1 - alpha;
  const a = minMsun ** p;
  const b = maxMsun ** p;
  const u = random();
  return (a + (b - a) * u) ** (1 / p);
}

function mainSequenceLifetimeGyr(massMsun: number): number {
  if (!(massMsun > 0)) return Number.NaN;
  return 10 * massMsun ** -2.5;
}

function luminosityFromRadiusTeff(radiusRsun: number, teffK: number): number {
  if (!(radiusRsun > 0) || !(teffK > 0)) return Number.NaN;
  const ratio = teffK / T_SUN_K;
  return radiusRsun * radiusRsun * ratio ** 4;
}

function bolometricCorrectionV(teffK: number): number {
  // Torres (2010) polynomial fit based on Flower BC_V tables.
  const logT = Math.log10(clamp(teffK, 2600, 50000));
  if (logT < 3.7) {
    return (
      -0.190537291496456e5 +
      0.155144866764412e5 * logT -
      0.421278819301717e4 * logT ** 2 +
      0.381476328422343e3 * logT ** 3
    );
  }
  if (logT < 3.9) {
    return (
      -0.370510203809015e5 +
      0.385672629965804e5 * logT -
      0.150651486316025e5 * logT ** 2 +
      0.261724637119416e4 * logT ** 3 -
      0.170623810323864e3 * logT ** 4
    );
  }
  return (
    -0.118115450538963e6 +
    0.137145973583929e6 * logT -
    0.636233812100225e5 * logT ** 2 +
    0.147412923562646e5 * logT ** 3 -
    0.170587278406872e4 * logT ** 4 +
    0.78873172180499e2 * logT ** 5
  );
}

function temperatureFromBminusVBallesteros(bMinusV: number): number {
  const x = bMinusV;
  return 4600 * (1 / (0.92 * x + 1.7) + 1 / (0.92 * x + 0.62));
}

function bminusVFromTeffK(teffK: number): number {
  const target = clamp(teffK, 2800, 42000);
  let low = -0.4;
  let high = 2.2;
  for (let i = 0; i < 72; i += 1) {
    const mid = 0.5 * (low + high);
    const tMid = temperatureFromBminusVBallesteros(mid);
    if (Math.abs(tMid - target) / target < 1e-8) return mid;
    if (tMid > target) low = mid;
    else high = mid;
  }
  return 0.5 * (low + high);
}

function observerFromPhysical(args: { luminosityLsun: number; teffK: number }): {
  Mv: number;
  BminusV: number;
} {
  const { luminosityLsun, teffK } = args;
  const safeL = Math.max(luminosityLsun, 1e-10);
  const mBol = M_BOL_SUN - 2.5 * Math.log10(safeL);
  const bcV = bolometricCorrectionV(teffK);
  const mV = mBol - bcV;
  const bMinusV = bminusVFromTeffK(teffK);
  return {
    Mv: mV,
    BminusV: bMinusV
  };
}

function combineBinaryObserverSpace(primary: { Mv: number; BminusV: number }, companion: {
  Mv: number;
  BminusV: number;
}): { Mv: number; BminusV: number } {
  const fV1 = 10 ** (-0.4 * primary.Mv);
  const fV2 = 10 ** (-0.4 * companion.Mv);
  const mB1 = primary.Mv + primary.BminusV;
  const mB2 = companion.Mv + companion.BminusV;
  const fB1 = 10 ** (-0.4 * mB1);
  const fB2 = 10 ** (-0.4 * mB2);

  const fV = fV1 + fV2;
  const fB = fB1 + fB2;

  const Mv = -2.5 * Math.log10(Math.max(fV, 1e-20));
  const Mb = -2.5 * Math.log10(Math.max(fB, 1e-20));
  return {
    Mv,
    BminusV: Mb - Mv
  };
}

function noisyObserverQuantities(args: {
  Mv: number;
  BminusV: number;
  photErr: number;
  distancePc: number;
  random: () => number;
}): { Mv: number; BminusV: number } {
  const { Mv, BminusV, photErr, distancePc, random } = args;
  const safePhotErr = Math.max(0, photErr);
  const dm = 5 * Math.log10(Math.max(distancePc, 1e-3)) - 5;
  const apparentMv = Mv + dm;
  const depthScale = clamp(1 + Math.max(0, apparentMv - 10) * 0.08, 1, 4);

  const sigmaMag = safePhotErr * depthScale;
  const sigmaColor = safePhotErr * 0.65 * depthScale;
  const magDraw = gaussianUnit(random);
  const colorDraw = gaussianUnit(random);
  const noisyAppMv = apparentMv + magDraw * sigmaMag;
  const noisyMv = noisyAppMv - dm;
  const noisyColor = BminusV + colorDraw * sigmaColor;

  return {
    Mv: noisyMv,
    BminusV: safePhotErr > 0 ? clamp(noisyColor, -0.45, 2.4) : BminusV
  };
}

function msProperties(args: { massMsun: number; metallicityZ: number }): {
  L: number;
  R: number;
  Teff: number;
} {
  const { massMsun, metallicityZ } = args;
  return {
    L: ZamsTout1996Model.luminosityLsunFromMassMetallicity({ massMsun, metallicityZ }),
    R: ZamsTout1996Model.radiusRsunFromMassMetallicity({ massMsun, metallicityZ }),
    Teff: ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({ massMsun, metallicityZ })
  };
}

function stageProperties(args: {
  massMsun: number;
  metallicityZ: number;
  ageGyr: number;
  random: () => number;
}): { stage: HrStarStage; L: number; R: number; Teff: number } {
  const { massMsun, metallicityZ, ageGyr, random } = args;
  const ms = msProperties({ massMsun, metallicityZ });
  const tMsGyr = mainSequenceLifetimeGyr(massMsun);

  if (ageGyr <= tMsGyr) {
    return {
      stage: "ms",
      L: ms.L,
      R: ms.R,
      Teff: ms.Teff
    };
  }

  const highMass = massMsun >= 8;
  const postWindowGyr = tMsGyr * (highMass ? 0.15 : 0.25);
  const postPhase = clamp((ageGyr - tMsGyr) / Math.max(postWindowGyr, 1e-6), 0, 1.4);

  if (!highMass) {
    if (postPhase < 0.28) {
      const f = postPhase / 0.28;
      const R = ms.R * (1.3 + 2.5 * f);
      const Teff = ms.Teff * (0.98 - 0.18 * f);
      return {
        stage: "subgiant",
        L: luminosityFromRadiusTeff(R, Teff),
        R,
        Teff
      };
    }
    if (postPhase < 0.95) {
      const f = (postPhase - 0.28) / 0.67;
      const R = ms.R * (5 + 90 * f ** 1.15);
      const Teff = clamp(ms.Teff * (0.82 - 0.48 * f), 3200, 6500);
      return {
        stage: "giant",
        L: luminosityFromRadiusTeff(R, Teff),
        R,
        Teff
      };
    }

    const wdMass = clamp(0.45 + 0.12 * massMsun, 0.52, 1.1);
    const coolPhase = clamp((postPhase - 0.95) / 0.45, 0, 1);
    const R = 0.012 * (wdMass / 0.6) ** (-1 / 3);
    const Teff = 30000 * (1 - 0.72 * coolPhase) + 7000;
    return {
      stage: "white_dwarf",
      L: luminosityFromRadiusTeff(R, Teff),
      R,
      Teff
    };
  }

  if (postPhase < 0.92) {
    const f = postPhase / 0.92;
    const R = ms.R * (12 + 380 * f ** 1.05);
    const Teff = clamp(ms.Teff * (0.9 - 0.7 * f), 3200, 24000);
    return {
      stage: "supergiant",
      L: luminosityFromRadiusTeff(R, Teff),
      R,
      Teff
    };
  }

  const R = 2.0e-5;
  const Teff = 2.2e5;
  return {
    stage: "compact_remnant",
    L: luminosityFromRadiusTeff(R, Teff),
    R,
    Teff
  };
}

export function generatePopulation(options: PopulationOptions): PopulationStar[] {
  const N = Math.max(0, Math.floor(options.N));
  const metallicityZ = clamp(
    options.metallicityZ ?? DEFAULT_Z,
    ZamsTout1996Model.CONSTANTS.metallicityMin,
    ZamsTout1996Model.CONSTANTS.metallicityMax
  );
  const clusterMode = options.modeCluster ?? false;
  const clusterAgeGyr = clusterMode
    ? clamp(options.clusterAge ?? 0, 0, 14)
    : 0;
  const binaryFrac = clamp(options.binaryFrac ?? 0.28, 0, 1);

  const random = mulberry32(hashSeed(options.seed));
  const stars: PopulationStar[] = [];

  for (let i = 0; i < N; i += 1) {
    const mass = sampleMassMsun(random, MASS_MIN_MSUN, MASS_MAX_MSUN);
    const ageGyr = clusterMode ? clusterAgeGyr : random() * 12.5;

    const staged = stageProperties({
      massMsun: mass,
      metallicityZ,
      ageGyr,
      random
    });

    let observer = observerFromPhysical({
      luminosityLsun: staged.L,
      teffK: staged.Teff
    });

    if (random() < binaryFrac) {
      const q = 0.2 + 0.8 * random();
      const companionMass = clamp(mass * q, MASS_MIN_MSUN, MASS_MAX_MSUN);
      const companionMs = msProperties({ massMsun: companionMass, metallicityZ });
      const companionObserver = observerFromPhysical({
        luminosityLsun: companionMs.L,
        teffK: companionMs.Teff
      });
      observer = combineBinaryObserverSpace(observer, companionObserver);
    }

    observer = noisyObserverQuantities({
      Mv: observer.Mv,
      BminusV: observer.BminusV,
      photErr: options.photErr,
      distancePc: options.distancePc,
      random
    });

    stars.push({
      id: `star-${i + 1}`,
      mass,
      Teff: staged.Teff,
      L: staged.L,
      R: staged.R,
      Mv: observer.Mv,
      BminusV: observer.BminusV,
      stage: staged.stage
    });
  }

  return stars;
}

export const HrInferencePopulationModel = {
  generatePopulation,
  mainSequenceLifetimeGyr
} as const;
