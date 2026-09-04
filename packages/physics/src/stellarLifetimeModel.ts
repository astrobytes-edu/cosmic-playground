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

export const StellarLifetimeModel = {
  SOLAR_METALLICITY_ONLY,
  mainSequenceLifetimeMyr,
  spectralTypeFromTemperature,
  remnantFateFromInitialMass
} as const;
