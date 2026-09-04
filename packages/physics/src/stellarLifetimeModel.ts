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

/**
 * The Pecaut & Mamajek main-sequence sequence: temperature, spectral type, and B-V.
 *
 * One table, two uses. It already named spectral types; it now also supplies colour,
 * because the alternative was a second relation that disagreed with it. The Ballesteros
 * (2012) formula this replaced for colour is calibrated over roughly 3,000-10,000 K, and
 * inverting it below that returned colours about 0.46 mag too red -- a 2,812 K dwarf came
 * out at B-V = 2.37 where the empirical sequence puts it at 1.91 and no real M dwarf is
 * redder than about 2.2.
 *
 * B-V values are the dwarf sequence from the same source. Colour is a poor discriminator
 * at the cool end -- the B band has almost no flux there, so B-V compresses -- which is
 * why the last few anchors are close together. That compression is physical and should
 * show on a colour-magnitude diagram.
 */
const SPECTRAL_ANCHORS: ReadonlyArray<readonly [number, string, number]> = [
  [42000, "O5", -0.33],
  [31400, "B0", -0.3],
  [16400, "B5", -0.16],
  [9800, "A0", 0.0],
  [8080, "A5", 0.16],
  [7220, "F0", 0.29],
  [6510, "F5", 0.44],
  [5920, "G0", 0.59],
  // The Sun's anchor. Without it the nearest neighbour to 5772 K is G5, and a model that
  // cannot call the Sun a G2 star is one no instructor will trust with anything else.
  [5770, "G2", 0.65],
  [5660, "G5", 0.68],
  [5280, "K0", 0.82],
  [4410, "K5", 1.15],
  [3850, "M0", 1.42],
  [3060, "M5", 1.81],
  [2320, "M8", 2.15]
];

/** Coolest and hottest the colour relation is defined for [K]. */
export const COLOUR_TEMPERATURE_RANGE_K = {
  min: SPECTRAL_ANCHORS[SPECTRAL_ANCHORS.length - 1][0],
  max: SPECTRAL_ANCHORS[0][0]
} as const;

/**
 * B-V for a main-sequence star of this effective temperature.
 *
 * Linear interpolation between the anchors in log T, which is how the sequence behaves.
 * Outside the tabulated range the endpoint is returned -- those are the ends of the
 * stellar main sequence, not an artifact of the fit.
 *
 * This is a DWARF relation. A white dwarf at the same temperature is bluer, because its
 * atmosphere and surface gravity are nothing like a main-sequence star's; applying this
 * to one puts it a few tenths too red. Stated rather than corrected, because the fix is a
 * separate white-dwarf colour table and this demo does not yet need that precision.
 */
export function bMinusVFromTemperatureK(temperatureK: number): number {
  if (!(temperatureK > 0)) return Number.NaN;
  if (temperatureK >= SPECTRAL_ANCHORS[0][0]) return SPECTRAL_ANCHORS[0][2];
  const last = SPECTRAL_ANCHORS[SPECTRAL_ANCHORS.length - 1];
  if (temperatureK <= last[0]) return last[2];

  const logT = Math.log10(temperatureK);
  for (let i = 0; i < SPECTRAL_ANCHORS.length - 1; i += 1) {
    const [hotT, , hotBv] = SPECTRAL_ANCHORS[i];
    const [coolT, , coolBv] = SPECTRAL_ANCHORS[i + 1];
    if (temperatureK <= hotT && temperatureK >= coolT) {
      const f = (Math.log10(hotT) - logT) / (Math.log10(hotT) - Math.log10(coolT));
      return hotBv + f * (coolBv - hotBv);
    }
  }
  return last[2];
}

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

/*
 * ── White dwarfs ────────────────────────────────────────────────────────────
 *
 * Below the 8 Msun white-dwarf/neutron-star line the star does not vanish when it stops
 * burning: it becomes a white dwarf and cools for the rest of the age of the universe,
 * tracing a diagonal sequence below the main sequence. That sequence is one of the three
 * structures a colour-magnitude diagram is read for, alongside the main sequence and the
 * giant branch.
 *
 * Initial-final mass relation: Cummings et al. (2018), ApJ 866, 21, their three linear
 * segments. Radius: the non-relativistic degenerate relation R ~ M^(-1/3), normalised so
 * a 0.6 Msun white dwarf has R = 0.0125 Rsun. Cooling: Mestel (1952), L ~ t^(-7/5),
 * anchored at 10^-2 Lsun after 100 Myr.
 *
 * The anchoring makes this schematic like the rest of the track, but it is a real
 * sequence rather than a point: at 10 Myr it gives 36,500 K, at 5 Gyr 4,200 K.
 */

/** Mestel's cooling exponent: luminosity falls as t^(-7/5). */
const WHITE_DWARF_COOLING_EXPONENT = -1.4;

/** Luminosity [Lsun] at the anchor age below. */
const WHITE_DWARF_ANCHOR_LSUN = 1e-2;

/** Cooling age [Myr] at which the anchor luminosity applies. */
const WHITE_DWARF_ANCHOR_MYR = 100;

/** Radius [Rsun] of a 0.6 Msun white dwarf; the relation scales as M^(-1/3) from here. */
const WHITE_DWARF_RADIUS_AT_0P6_RSUN = 0.0125;

/**
 * Coolest white dwarf [K].
 *
 * Not a physical floor -- degenerate matter keeps radiating -- but an age-of-the-galaxy
 * one. The observed white-dwarf luminosity function has a sharp cutoff near
 * log(L/Lsun) = -4.5, about 3,900 K, because the disk is only some 10 Gyr old and nothing
 * has had time to cool further. Winget et al. (1987), ApJ 315, L77, is the classic
 * statement of it, and the cutoff is used to date the disk.
 *
 * At 3,200 K the model was producing white dwarfs cooler than any that exist, reaching
 * M_V = 20.3 where the faintest real ones sit near 17.
 */
const WHITE_DWARF_MIN_TEMPERATURE_K = 3900;

/** Above this initial mass the remnant is a neutron star or black hole, not a white dwarf. */
const WHITE_DWARF_MAX_PROGENITOR_MSUN = 8;

/** Above this initial mass a post-main-sequence star is a supergiant, not a giant. */
const SUPERGIANT_MIN_MSUN = 8;

/**
 * White-dwarf mass [Msun] left by a star of this initial mass.
 *
 * Cummings et al. (2018), ApJ 866, 21, Table 1: three linear segments fitted to cluster
 * white dwarfs. Outside the fitted range the nearest segment is extended, which is why
 * the result is clamped to the physical span.
 */
export function whiteDwarfMassMsun(initialMassMsun: number): number {
  const m = initialMassMsun;
  const fitted =
    m < 2.85
      ? 0.08 * m + 0.489
      : m < 3.6
        ? 0.187 * m + 0.184
        : 0.107 * m + 0.471;
  // 0.5 is about the lightest a single star can leave; 1.38 is the Chandrasekhar limit.
  return Math.min(1.38, Math.max(0.5, fitted));
}

export type PostMainSequenceStage =
  | "hertzsprung-gap"
  | "giant"
  | "supergiant"
  | "white-dwarf";

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

  if (ageMyr >= end) {
    // Above the white-dwarf line the remnant is a neutron star or a black hole. Neither
    // belongs on an HR diagram of stellar photospheres, so there is no point to return.
    if (massMsun >= WHITE_DWARF_MAX_PROGENITOR_MSUN) return null;
    return whiteDwarfPoint(massMsun, ageMyr - end);
  }

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
    // Above 8 Msun the same climb is a supergiant, not a giant: no degenerate core, and
    // the star ends as a neutron star or black hole rather than a white dwarf. The word
    // matters on a diagram a reader is being taught to name structures on.
    stage: massMsun >= SUPERGIANT_MIN_MSUN ? "supergiant" : "giant",
    luminosityLsun,
    temperatureK,
    radiusRsun: radiusRsunFromLuminosityTemperature(luminosityLsun, temperatureK)
  };
}

/**
 * A cooling white dwarf, `coolingAgeMyr` after it formed.
 *
 * Radius is fixed: degeneracy pressure does not care about temperature, so a white dwarf
 * contracts negligibly as it cools. The whole sequence is therefore a line of constant
 * radius on the HR diagram, which is exactly why it looks like a sequence.
 */
function whiteDwarfPoint(
  initialMassMsun: number,
  coolingAgeMyr: number
): PostMainSequencePoint {
  const massMsun = whiteDwarfMassMsun(initialMassMsun);
  const radiusRsun =
    WHITE_DWARF_RADIUS_AT_0P6_RSUN * (massMsun / 0.6) ** (-1 / 3);

  // Mestel cooling. The floor on the age keeps a just-formed white dwarf from being
  // infinitely bright rather than merely very hot.
  const age = Math.max(coolingAgeMyr, WHITE_DWARF_ANCHOR_MYR * 1e-3);
  const luminosityLsun =
    WHITE_DWARF_ANCHOR_LSUN *
    (age / WHITE_DWARF_ANCHOR_MYR) ** WHITE_DWARF_COOLING_EXPONENT;

  const temperatureK = Math.max(
    WHITE_DWARF_MIN_TEMPERATURE_K,
    5772 * (luminosityLsun / radiusRsun ** 2) ** 0.25
  );
  // Recompute L from the clamped temperature so the three quantities stay consistent
  // with Stefan-Boltzmann; a reader inferring R from L and T must get the radius back.
  const consistentLuminosityLsun = radiusRsun ** 2 * (temperatureK / 5772) ** 4;

  return {
    stage: "white-dwarf",
    luminosityLsun: consistentLuminosityLsun,
    temperatureK,
    radiusRsun
  };
}

export const StellarLifetimeModel = {
  SOLAR_METALLICITY_ONLY,
  COLOUR_TEMPERATURE_RANGE_K,
  bMinusVFromTemperatureK,
  mainSequenceLifetimeMyr,
  totalLifetimeMyr,
  postMainSequenceTrack,
  whiteDwarfMassMsun,
  spectralTypeFromTemperature,
  remnantFateFromInitialMass
} as const;
