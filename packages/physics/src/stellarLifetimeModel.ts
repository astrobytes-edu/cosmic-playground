/**
 * Main-sequence lifetime, spectral type, and remnant fate.
 *
 * Companions to `zamsTout1996Model`, which gives a star's zero-age luminosity, radius and
 * temperature. This module answers the questions that need a clock: how long it stays
 * there, what we call it while it does, and what it leaves behind.
 *
 * Ported from the novascope package, which validates the Hurley relations against a
 * startrax reference fixture. See docs/reviews/2026-09-04-novascope-port-survey.md.
 *
 * Units: mass in solar masses, time in megayears, temperature in kelvin.
 */

/* ── Main-sequence lifetime ───────────────────────────────────────────────────
 * Hurley, Pols & Tout (2000), MNRAS 315, 543, eqs (4)-(7):
 *   t_MS = max(mu * t_BGB, x * t_BGB)   [Myr]
 *
 * The a-coefficients are the Hurley Appendix-A set evaluated at Z = 0.02, so this is the
 * solar-metallicity relation. Varying Z means re-deriving the full zeta polynomials, which
 * is deliberately out of scope here — `SOLAR_METALLICITY_ONLY` names that limit. */

/** These coefficients are evaluated at Z = 0.02; the relation is not Z-dependent here. */
export const SOLAR_METALLICITY_ONLY = 0.02;

/** Index 0 is unused so HURLEY_A[i] matches Hurley's 1-based a_i. */
const HURLEY_A = [
  0, 1593.89, 2706.708, 146.6143, 0.0414196, 0.3426349, 19.49814, 4.90383, 0.05212154,
  1.312179, 0.8073972
] as const;

/** At Z = 0.02 the metallicity parameter zeta = log10(Z/0.02) is zero. */
const HURLEY_ZETA = 0;

/** Metallicity factor x for t_MS. Hurley eq. (5). */
const HURLEY_X = Math.max(0.95, Math.min(0.95 - 0.03 * (HURLEY_ZETA + 0.30103), 0.99));

/** Base-of-giant-branch time [Myr]. Hurley eq. (4). */
function timeToGiantBranchMyr(massMsun: number): number {
  const a = HURLEY_A;
  const numerator = a[1] + a[2] * massMsun ** 4 + a[3] * massMsun ** 5.5 + massMsun ** 7;
  const denominator = a[4] * massMsun ** 2 + a[5] * massMsun ** 7;
  return numerator / denominator;
}

/** Hook-time fraction mu. Hurley eq. (7). */
function hookFraction(massMsun: number): number {
  const a = HURLEY_A;
  const inner = Math.max(a[6] / massMsun ** a[7], a[8] + a[9] / massMsun ** a[10]);
  return Math.max(0.5, 1 - 0.01 * inner);
}

/**
 * Main-sequence lifetime [Myr] at solar metallicity. Hurley eq. (5).
 *
 * This replaces the common classroom shortcut t_MS ~ 10 Gyr * M^-2.5, which is a fit to
 * the middle of the range and is wrong at both ends.
 */
export function mainSequenceLifetimeMyr(massMsun: number): number {
  const giantBranch = timeToGiantBranchMyr(massMsun);
  return Math.max(hookFraction(massMsun) * giantBranch, HURLEY_X * giantBranch);
}

/* ── Spectral type ───────────────────────────────────────────────────────────
 * Nearest anchor on the Pecaut & Mamajek (2013) main-sequence temperature sequence.
 * Source: Pecaut, M. J. & Mamajek, E. E. (2013), ApJS 208, 9.
 *
 * Classification is NEAREST-ANCHOR against a coarse table, so it is a label rather than a
 * measurement: temperatures between two anchors round to whichever is closer, and the
 * anchors themselves are quoted to the precision the published sequence supports. Use it
 * to name a star, not to infer one. */

const SPECTRAL_ANCHORS: ReadonlyArray<readonly [number, string]> = [
  [42000, "O5"],
  [31400, "B0"],
  [16400, "B5"],
  [9800, "A0"],
  [8080, "A5"],
  [7220, "F0"],
  [6510, "F5"],
  [5920, "G0"],
  // The Sun's anchor. Without it the nearest neighbour to 5772 K is G5, and a model that
  // cannot call the Sun a G2 star is one no instructor will trust with anything else.
  [5770, "G2"],
  [5660, "G5"],
  [5280, "K0"],
  [4410, "K5"],
  [3850, "M0"],
  [3060, "M5"],
  [2320, "M8"]
];

/** Nearest main-sequence spectral type for an effective temperature [K]. */
export function spectralTypeFromTemperature(temperatureK: number): string {
  let best = SPECTRAL_ANCHORS[0];
  let bestDifference = Infinity;
  for (const anchor of SPECTRAL_ANCHORS) {
    const difference = Math.abs(temperatureK - anchor[0]);
    if (difference < bestDifference) {
      bestDifference = difference;
      best = anchor;
    }
  }
  return `${best[1]}V`;
}

/* ── Remnant fate ────────────────────────────────────────────────────────────
 * Initial-mass thresholds from Heger et al. (2003), ApJ 591, 288. These are the
 * conventional round figures; the true boundaries depend on metallicity, rotation and
 * mass loss, and the neutron-star/black-hole line in particular is not sharp. */

export type RemnantFate = "white dwarf" | "neutron star" | "black hole";

/** Remnant left by a star of this initial mass [Msun]. Heger et al. (2003). */
export function remnantFateFromInitialMass(massMsun: number): RemnantFate {
  if (massMsun < 8) return "white dwarf";
  if (massMsun < 25) return "neutron star";
  return "black hole";
}


/* ── Post-main-sequence track ────────────────────────────────────────────────
 * A SCHEMATIC track, not an evolutionary code.
 *
 * Why this exists: a cluster HR diagram whose only content is the zero-age main sequence
 * is a plot of a function, not a picture of a population. The giant branch is the feature
 * an astronomer looks for first, and it is what makes a cluster's age visible. Deleting
 * post-main-sequence stars -- treating "left the main sequence" as "gone" -- removes the
 * one structure that carries the age.
 *
 * Two of the three timescales below are Hurley's own, not invented here:
 *
 *   t_MS   main-sequence lifetime                 Hurley eq. (5), above
 *   t_BGB  time to the base of the giant branch   Hurley eq. (4), above
 *
 * so the Hertzsprung-gap window t_BGB - t_MS falls straight out of the existing fits. It
 * is at most 5 percent of t_BGB (because t_MS >= 0.95 t_BGB) and narrows to almost nothing
 * at high mass, which is the correct behaviour: the crossing runs on a thermal timescale
 * and that is exactly why real HR diagrams show the gap nearly empty.
 *
 * The third, POST_BGB_FRACTION, is a round figure rather than a fit. Core helium burning
 * runs about 10 percent of the hydrogen-burning lifetime, with the RGB and AGB adding the
 * rest; 0.15 is the conventional classroom value for the whole post-BGB span.
 *
 * The SHAPE of the track is textbook rather than computed:
 *   - Across the Hertzsprung gap the surface cools at roughly constant luminosity.
 *   - On the giant branch the star sits near the Hayashi limit, so temperature is nearly
 *     pinned and luminosity climbs.
 *   - Below 2 Msun the climb ends near a mass-INDEPENDENT tip, because the tip is set by
 *     the degenerate helium core mass at the flash. That is the reason the RGB tip works
 *     as a standard candle, and it is worth a student noticing it in the picture.
 *   - Above 2 Msun there is no degenerate core, so the star crosses to the red at roughly
 *     constant luminosity: the near-horizontal supergiant track.
 *
 * Positions are therefore good to a factor of a few, and good enough to teach the shape.
 * Do not read radii or ages off them as measurements. */

/** Post-BGB phases as a fraction of the time taken to reach the giant branch. */
const POST_BGB_FRACTION = 0.15;

/** Luminosity gain from the turnoff to the base of the giant branch. */
const BGB_BRIGHTENING = 2.2;

/** Tip-of-the-RGB luminosity [Lsun] below 2 Msun, set by the core mass at the flash. */
const RGB_TIP_LSUN = 2500;

/** Above this mass the helium core never becomes degenerate, so there is no fixed tip. */
const DEGENERATE_CORE_MAX_MSUN = 2;

export type PostMainSequenceStage = "hertzsprung-gap" | "giant";

export interface PostMainSequencePoint {
  stage: PostMainSequenceStage;
  luminosityLsun: number;
  radiusRsun: number;
  temperatureK: number;
}

/**
 * Total nuclear-burning lifetime [Myr]: the main sequence plus everything after it.
 *
 * A star older than this is a remnant.
 */
export function totalLifetimeMyr(massMsun: number): number {
  return timeToGiantBranchMyr(massMsun) * (1 + POST_BGB_FRACTION);
}

/**
 * Effective temperature [K] at the BASE of the giant branch for this mass.
 *
 * The star cools further as it climbs -- see `GIANT_TIP_COOLING` -- because the giant
 * branch is not vertical. Holding the temperature fixed drew the branch as a solid
 * vertical bar, which is not what a cluster's red giant branch looks like.
 */
function giantBranchBaseTemperatureK(massMsun: number): number {
  const raw = 4700 * massMsun ** -0.08;
  return Math.min(5000, Math.max(3600, raw));
}

/**
 * Temperature at the tip as a fraction of the base.
 *
 * A solar-mass star leaves the base of the giant branch near 4700 K and reaches the tip
 * near 3200 K, so it cools by about a third while brightening by three decades. With this
 * factor the model puts the tip of the RGB at roughly 3200 K and 155 Rsun, against
 * observed values near 3100 K and 170 Rsun.
 */
const GIANT_TIP_COOLING = 0.68;

/** Coolest a giant gets [K]; red supergiants bottom out here rather than continuing down. */
const GIANT_MIN_TEMPERATURE_K = 3100;

/** Stefan-Boltzmann, in solar units. */
function radiusRsunFromLuminosityTemperature(luminosityLsun: number, temperatureK: number): number {
  return Math.sqrt(luminosityLsun) * (5772 / temperatureK) ** 2;
}

/**
 * Where a star sits after the main sequence, given its zero-age values.
 *
 * Returns `null` when the star has not left the main sequence yet, or has already burned
 * through every post-main-sequence phase and become a remnant -- so a caller can branch on
 * the three cases without recomputing the timescales.
 */
export function postMainSequenceTrack(args: {
  massMsun: number;
  ageMyr: number;
  zamsLuminosityLsun: number;
  zamsTemperatureK: number;
}): PostMainSequencePoint | null {
  const { massMsun, ageMyr, zamsLuminosityLsun, zamsTemperatureK } = args;
  if (!(zamsLuminosityLsun > 0) || !(zamsTemperatureK > 0)) return null;

  const mainSequenceEnd = mainSequenceLifetimeMyr(massMsun);
  if (ageMyr < mainSequenceEnd) return null;

  const giantBranchStart = timeToGiantBranchMyr(massMsun);
  const end = giantBranchStart * (1 + POST_BGB_FRACTION);
  if (ageMyr >= end) return null;

  const giantBaseTemperatureK = giantBranchBaseTemperatureK(massMsun);

  // Hertzsprung gap: cool at roughly constant luminosity. Geometric interpolation keeps
  // the path straight on the log-log axes an HR diagram actually uses.
  if (ageMyr < giantBranchStart) {
    const span = giantBranchStart - mainSequenceEnd;
    const f = span > 0 ? (ageMyr - mainSequenceEnd) / span : 1;
    const luminosityLsun = zamsLuminosityLsun * BGB_BRIGHTENING ** f;
    const temperatureK = zamsTemperatureK * (giantBaseTemperatureK / zamsTemperatureK) ** f;
    return {
      stage: "hertzsprung-gap",
      luminosityLsun,
      temperatureK,
      radiusRsun: radiusRsunFromLuminosityTemperature(luminosityLsun, temperatureK)
    };
  }

  // Giant branch: temperature nearly pinned, luminosity climbing to the tip.
  const g = (ageMyr - giantBranchStart) / (end - giantBranchStart);
  const baseLuminosityLsun = zamsLuminosityLsun * BGB_BRIGHTENING;
  const tipLuminosityLsun =
    massMsun < DEGENERATE_CORE_MAX_MSUN
      ? Math.max(RGB_TIP_LSUN, baseLuminosityLsun)
      : baseLuminosityLsun * 3;
  const luminosityLsun = baseLuminosityLsun * (tipLuminosityLsun / baseLuminosityLsun) ** g;
  const tipTemperatureK = Math.max(
    GIANT_MIN_TEMPERATURE_K,
    giantBaseTemperatureK * GIANT_TIP_COOLING
  );
  const temperatureK = giantBaseTemperatureK * (tipTemperatureK / giantBaseTemperatureK) ** g;
  return {
    stage: "giant",
    luminosityLsun,
    temperatureK,
    radiusRsun: radiusRsunFromLuminosityTemperature(luminosityLsun, temperatureK)
  };
}

export const StellarLifetimeModel = {
  SOLAR_METALLICITY_ONLY,
  mainSequenceLifetimeMyr,
  totalLifetimeMyr,
  postMainSequenceTrack,
  spectralTypeFromTemperature,
  remnantFateFromInitialMass
} as const;
