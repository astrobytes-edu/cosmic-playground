/**
 * A sampled star cluster: masses from an IMF, positions from a spatial profile, and the
 * observable state each star has at a given age.
 *
 * Composition only. The laws live in `initialMassFunctionModel`, the geometry in
 * `clusterProfileModel`, the zero-age luminosity/radius/temperature in
 * `zamsTout1996Model`, and the clock in `stellarLifetimeModel`. Nothing new is derived
 * here; the value is that all of it is driven from one seed.
 *
 * Determinism is the contract: the same options always produce the same cluster, so
 * "these are the stars I made earlier" is literally true and a seed is shareable. Masses
 * and positions draw from independent named sub-streams, so a future sampled quantity
 * (velocities, binaries) can be added without moving a single existing star.
 *
 * Units: masses in solar masses, positions in parsecs, luminosity in solar luminosities,
 * stellar radius in solar radii, temperature in kelvin, age in megayears.
 */
import type { ProfileSpec, Vector3Pc } from "./clusterProfileModel";
import { makeProfileSampler } from "./clusterProfileModel";
import type { KroupaSegment } from "./initialMassFunctionModel";
import {
  CANONICAL_HIGH_MASS_SLOPE,
  HYDROGEN_BURNING_MIN_MSUN,
  IMF_MAX_MSUN,
  buildKroupaSegments,
  kroupaMassMsun,
  maschbergerMassMsun
} from "./initialMassFunctionModel";
import { subStream } from "./seededRandom";
import type { RemnantFate } from "./stellarLifetimeModel";
import {
  mainSequenceLifetimeMyr,
  remnantFateFromInitialMass,
  spectralTypeFromTemperature
} from "./stellarLifetimeModel";
import { ZamsTout1996Model } from "./zamsTout1996Model";

export type ImfKind = "maschberger" | "kroupa";

/**
 * A star's state, including the case where the model cannot describe it.
 *
 * "outside-model-range" is not an error condition. The IMF's physical range runs from the
 * hydrogen-burning limit (0.08 Msun) to 150 Msun, while the Tout et al. (1996) ZAMS fits
 * are valid only on [0.1, 100] and explicitly forbid extrapolation. Roughly a tenth of a
 * sampled cluster falls below 0.1 Msun, and those stars are real: they have a mass and a
 * position, and they belong in a mass histogram.
 *
 * What they do NOT have is a defensible point on an HR diagram. The alternative -- clamping
 * their mass to 0.1 and plotting them anyway -- is how a tenth of a population turns into a
 * spike at one temperature that looks like data. This repository has already shipped that
 * defect once, in `stars-zams-hr`. Consumers must skip these stars when plotting L and T,
 * and are encouraged to say how many there were.
 */
export type StarPhase = "main-sequence" | "remnant" | "outside-model-range";

export interface ClusterStar {
  id: number;
  massMsun: number;
  positionPc: Vector3Pc;
  /** Distance from the cluster centre [pc]. */
  radiusPc: number;
  /** Zero-age values. Both are zero once the star has left the main sequence. */
  luminosityLsun: number;
  stellarRadiusRsun: number;
  temperatureK: number;
  mainSequenceLifetimeMyr: number;
  phase: StarPhase;
  /** Empty once the star is a remnant, which has no main-sequence spectral type. */
  spectralType: string;
  /** Non-null exactly when `phase` is "remnant". */
  remnant: RemnantFate | null;
}

export interface StarClusterOptions {
  seed: string | number;
  starCount: number;
  imf: ImfKind;
  /** High-mass slope. 2.3 is canonical for both laws. */
  alphaHigh?: number;
  minMassMsun?: number;
  maxMassMsun?: number;
  profile: ProfileSpec;
  metallicityZ?: number;
  /** Cluster age [Myr]. Stars whose main-sequence lifetime has elapsed become remnants. */
  ageMyr?: number;
}

export interface StarCluster {
  stars: ClusterStar[];
  /** Total mass in stars and remnants [Msun]. Remnants keep their initial mass here. */
  totalMassMsun: number;
  /** Radius enclosing half the stars by number [pc]. */
  halfNumberRadiusPc: number;
  /** Most massive star drawn [Msun] — the quantity that visibly flickers on reseed. */
  mostMassiveMsun: number;
  mainSequenceCount: number;
  remnantCount: number;
  /** Stars outside the ZAMS model's validity domain, so absent from the HR diagram. */
  outsideModelCount: number;
}

/** Guard so a pathological star count cannot lock the main thread. */
export const MAX_CLUSTER_STARS = 200_000;

function drawMass(
  uniform: number,
  imf: ImfKind,
  segments: KroupaSegment[] | null,
  minMassMsun: number,
  maxMassMsun: number,
  alphaHigh: number
): number {
  if (imf === "kroupa" && segments) return kroupaMassMsun(uniform, segments);
  return maschbergerMassMsun(uniform, { minMassMsun, maxMassMsun, alphaHigh });
}

/**
 * Sample a cluster.
 *
 * The IMF is resolved once rather than per star: Kroupa's segments are an inverse-CDF
 * table that costs a build. Both laws consume exactly one uniform per star, so the mass
 * stream advances identically either way and switching law moves the masses without
 * disturbing the positions.
 */
export function sampleStarCluster(options: StarClusterOptions): StarCluster {
  const minMassMsun = options.minMassMsun ?? HYDROGEN_BURNING_MIN_MSUN;
  const maxMassMsun = options.maxMassMsun ?? IMF_MAX_MSUN;
  const alphaHigh = options.alphaHigh ?? CANONICAL_HIGH_MASS_SLOPE;
  const metallicityZ = options.metallicityZ ?? 0.02;
  const ageMyr = options.ageMyr ?? 0;
  const count = Math.min(MAX_CLUSTER_STARS, Math.max(0, Math.floor(options.starCount)));

  const massStream = subStream(options.seed, "mass");
  const positionStream = subStream(options.seed, "position");
  const segments =
    options.imf === "kroupa" ? buildKroupaSegments(minMassMsun, maxMassMsun, alphaHigh) : null;
  const samplePosition = makeProfileSampler(options.profile);

  const stars: ClusterStar[] = [];
  let totalMassMsun = 0;
  let mostMassiveMsun = 0;
  let mainSequenceCount = 0;
  let outsideModelCount = 0;

  for (let id = 0; id < count; id += 1) {
    const massMsun = drawMass(
      massStream(),
      options.imf,
      segments,
      minMassMsun,
      maxMassMsun,
      alphaHigh
    );
    const positionPc = samplePosition(positionStream);
    const radiusPc = Math.hypot(positionPc.x, positionPc.y, positionPc.z);
    const lifetimeMyr = mainSequenceLifetimeMyr(massMsun);
    const isRemnant = ageMyr >= lifetimeMyr;

    totalMassMsun += massMsun;
    if (massMsun > mostMassiveMsun) mostMassiveMsun = massMsun;

    if (isRemnant) {
      stars.push({
        id,
        massMsun,
        positionPc,
        radiusPc,
        luminosityLsun: 0,
        stellarRadiusRsun: 0,
        temperatureK: 0,
        mainSequenceLifetimeMyr: lifetimeMyr,
        phase: "remnant",
        spectralType: "",
        remnant: remnantFateFromInitialMass(massMsun)
      });
      continue;
    }

    const zamsInput = { massMsun, metallicityZ };
    if (!ZamsTout1996Model.validity(zamsInput).valid) {
      // Real star, no ZAMS point. See the note on StarPhase.
      outsideModelCount += 1;
      stars.push({
        id,
        massMsun,
        positionPc,
        radiusPc,
        luminosityLsun: 0,
        stellarRadiusRsun: 0,
        temperatureK: 0,
        mainSequenceLifetimeMyr: lifetimeMyr,
        phase: "outside-model-range",
        spectralType: "",
        remnant: null
      });
      continue;
    }

    mainSequenceCount += 1;
    const temperatureK = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity(zamsInput);
    stars.push({
      id,
      massMsun,
      positionPc,
      radiusPc,
      luminosityLsun: ZamsTout1996Model.luminosityLsunFromMassMetallicity(zamsInput),
      stellarRadiusRsun: ZamsTout1996Model.radiusRsunFromMassMetallicity(zamsInput),
      temperatureK,
      mainSequenceLifetimeMyr: lifetimeMyr,
      phase: "main-sequence",
      spectralType: spectralTypeFromTemperature(temperatureK),
      remnant: null
    });
  }

  const sortedRadii = stars.map((s) => s.radiusPc).sort((a, b) => a - b);
  const halfNumberRadiusPc =
    sortedRadii.length === 0 ? 0 : sortedRadii[Math.floor(sortedRadii.length / 2)];

  return {
    stars,
    totalMassMsun,
    halfNumberRadiusPc,
    mostMassiveMsun,
    mainSequenceCount,
    remnantCount: stars.length - mainSequenceCount - outsideModelCount,
    outsideModelCount
  };
}

export const StarClusterModel = {
  MAX_CLUSTER_STARS,
  sampleStarCluster
} as const;
