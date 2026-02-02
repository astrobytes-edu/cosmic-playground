/**
 * ParallaxDistanceModel
 *
 * Teaching model for annual parallax:
 *   d(pc) = 1 / p(arcsec)
 *
 * Units policy:
 * - Distances are explicit (pc, ly).
 * - Parallax angles are explicit (arcsec, mas).
 */

const PC_TO_LY = 3.26156;

export const ParallaxDistanceModel = {
  /**
   * Standard parsec definition.
   * For non-positive p, return Infinity (physically: "too small to measure / effectively infinite distance").
   */
  distanceParsecFromParallaxArcsec(parallaxArcsec: number): number {
    if (!(parallaxArcsec > 0)) return Infinity;
    return 1 / parallaxArcsec;
  },

  /** Convenience form: mas = milliarcseconds. */
  distanceParsecFromParallaxMas(parallaxMas: number): number {
    if (!(parallaxMas > 0)) return Infinity;
    return 1000 / parallaxMas;
  },

  /** Inverse: p(") = 1 / d(pc). */
  parallaxArcsecFromDistanceParsec(distancePc: number): number {
    if (!(distancePc > 0)) return Infinity;
    return 1 / distancePc;
  },

  /** Inverse: p(mas) = 1000 / d(pc). */
  parallaxMasFromDistanceParsec(distancePc: number): number {
    if (!(distancePc > 0)) return Infinity;
    return 1000 / distancePc;
  },

  distanceLyFromParsec(distancePc: number): number {
    return distancePc * PC_TO_LY;
  },

  distanceParsecFromLy(distanceLy: number): number {
    return distanceLy / PC_TO_LY;
  }
} as const;

