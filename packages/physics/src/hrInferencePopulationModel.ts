import { ZamsTout1996Model } from "./zamsTout1996Model";
import { hashSeed, mulberry32 } from "./seededRandom";
import { mainSequenceLifetimeMyr, postMainSequenceTrack } from "./stellarLifetimeModel";
import type { PostMainSequenceStage } from "./stellarLifetimeModel";

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

/**
 * Main-sequence lifetime [Gyr].
 *
 * Delegates to the Hurley et al. (2000) relation in `stellarLifetimeModel`, which is the
 * one source of truth for this quantity across the package.
 *
 * Until 2026-09-04 this was a private `10 * M^-2.5`, the classroom shortcut. It is a fit
 * to the middle of the mass range and wrong at both ends, and the disagreement is not
 * small: at 100 Msun it gives 0.1 Myr against Hurley's 3.35 Myr, a factor of 33. Two
 * demos in the same course were disagreeing about when a star dies -- cluster-census on
 * Hurley, this population on the shortcut.
 */
function mainSequenceLifetimeGyr(massMsun: number): number {
  if (!(massMsun > 0)) return Number.NaN;
  return mainSequenceLifetimeMyr(massMsun) / 1000;
}


function bolometricCorrectionV(teffK: number): number {
  // Torres (2010), correcting the Flower (1996) BC_V polynomials.
  //
  // The fit is only valid for log T_eff >= 3.5 (3162 K). Below that the cubic diverges
  // fast: it gives BC_V(3000 K) = -5.01 and BC_V(2600 K) = -9.38 against real values
  // near -2.7 and -3. Since M_V = M_bol - BC_V, that pushed the coolest dwarfs several
  // magnitudes too faint and off the bottom of the plotted frame. Clamp the input to the
  // validity floor rather than extrapolating past it.
  const TORRES_MIN_VALID_K = 3162;
  const logT = Math.log10(clamp(teffK, TORRES_MIN_VALID_K, 50000));
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

/**
 * Temperature range the Ballesteros relation actually spans over BALLESTEROS_BV_RANGE.
 * T(B-V) is monotonically decreasing, so the hot end comes from the low B-V endpoint.
 */
const BALLESTEROS_BV_MIN = -0.4; // ~21707 K
const BALLESTEROS_BV_MAX = 3.0; //  ~2392 K

function bminusVFromTeffK(teffK: number): number {
  // Clamp the TARGET into the range the bracket can actually reach. Previously the
  // target was clamped to 2800-42000 K while the bracket [-0.4, 2.2] only spans
  // 2975-21707 K, so any star outside that window drove the bisection into a bracket
  // endpoint and was returned as if it were a real colour. With colorMax = 2.2 on the
  // CMD axis, that stacked ~26% of a default population on the right edge of the plot.
  const tHot = temperatureFromBminusVBallesteros(BALLESTEROS_BV_MIN);
  const tCool = temperatureFromBminusVBallesteros(BALLESTEROS_BV_MAX);
  const target = clamp(teffK, tCool, tHot);
  let low = BALLESTEROS_BV_MIN;
  let high = BALLESTEROS_BV_MAX;
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

/**
 * Where a star of this mass sits at this age.
 *
 * The physics lives in `stellarLifetimeModel`; this function is the adapter that maps its
 * vocabulary onto the stage names this demo's UI and exports already use. Until
 * 2026-09-04 it carried its own schematic track, which meant the two star demos disagreed
 * about the shape of the giant branch as well as about the main-sequence lifetime.
 *
 * The old white-dwarf branch is the reason this mattered in practice. Its cooling phase
 * was `clamp((postPhase - 0.95) / 0.45, 0, 1)` where `postPhase` was itself clamped at
 * 1.4 -- which lands exactly on 1.0, so EVERY white dwarf came out at 15,400 K. The
 * cooling sequence, one of the three structures this demo asks the reader to identify,
 * was a single point with every white dwarf stacked on it.
 */
function stageProperties(args: {
  massMsun: number;
  metallicityZ: number;
  ageGyr: number;
  random: () => number;
}): { stage: HrStarStage; L: number; R: number; Teff: number } {
  const { massMsun, metallicityZ, ageGyr } = args;
  const ms = msProperties({ massMsun, metallicityZ });
  const ageMyr = ageGyr * 1000;

  if (ageMyr < mainSequenceLifetimeMyr(massMsun)) {
    return { stage: "ms", L: ms.L, R: ms.R, Teff: ms.Teff };
  }

  const point = postMainSequenceTrack({
    massMsun,
    ageMyr,
    zamsLuminosityLsun: ms.L,
    zamsTemperatureK: ms.Teff
  });

  if (!point) {
    // Past its whole nuclear life and too massive to leave a white dwarf: a neutron star
    // or a black hole. Neither has a photosphere to plot, so it keeps the tiny, absurdly
    // hot placeholder this demo has always used to park it off the visible diagram.
    return { stage: "compact_remnant", L: COMPACT_REMNANT.L, R: COMPACT_REMNANT.R, Teff: COMPACT_REMNANT.Teff };
  }

  return {
    stage: STAGE_NAMES[point.stage],
    L: point.luminosityLsun,
    R: point.radiusRsun,
    Teff: point.temperatureK
  };
}

/** This demo's stage vocabulary, keyed by the shared model's. */
const STAGE_NAMES: Record<PostMainSequenceStage, HrStarStage> = {
  "hertzsprung-gap": "subgiant",
  giant: "giant",
  supergiant: "supergiant",
  "white-dwarf": "white_dwarf"
};

/** A neutron star or black hole: no photosphere, parked off the diagram. */
const COMPACT_REMNANT = { R: 2.0e-5, Teff: 2.2e5, L: (2.0e-5) ** 2 * (2.2e5 / T_SUN_K) ** 4 };

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
