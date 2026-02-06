/**
 * AstroConstants
 *
 * Single source of truth for definitional constants and time scales used across demos.
 *
 * Teaching normalization (AU / yr / M☉):
 *   G = 4π² AU³ / yr² / M☉
 * so that (for a 1 M☉ central mass) Kepler's Third Law is:
 *   P² = a³  with P in years and a in AU.
 */

export const AstroConstants = {
  TIME: {
    // Exact definitions
    DAY_S: 86400,
    JULIAN_YEAR_S: 31557600,

    // Default “mechanics year” used widely by dynamics demos (Julian year, exact seconds).
    YEAR_S: 31557600,

    // Mean/teaching values (epoch-dependent; keep the "MEAN_*" honesty).
    // Source (legacy in-repo): demos/_assets/seasons-model.js
    MEAN_TROPICAL_YEAR_DAYS: 365.2422,

    // Source (legacy in-repo): demos/eclipse-geometry/eclipse-geometry.js
    MEAN_SIDEREAL_MONTH_DAYS: 27.321661,
    MEAN_SYNODIC_MONTH_DAYS: 29.530588,

    // NOAA (user-verified in legacy): "node cycle" ≈ 18.61 Julian years (mean regression period).
    MEAN_NODE_REGRESSION_JULIAN_YEARS: 18.61,

    // Derived values (computed below)
    MEAN_TROPICAL_YEAR_S: 0,
    MEAN_SIDEREAL_MONTH_S: 0,
    MEAN_SYNODIC_MONTH_S: 0,
    MEAN_NODE_REGRESSION_S: 0,
    MEAN_NODE_REGRESSION_DAYS: 0,
    MEAN_DRACONIC_MONTH_DAYS: 0,
    MEAN_DRACONIC_MONTH_S: 0
  },

  LENGTH: {
    CM_PER_M: 100,
    M_PER_KM: 1000,
    CM_PER_KM: 100000,

    // IAU-defined AU value (km)
    KM_PER_AU: 149597870.7,

    // Derived distance scales (km)
    // Light-year: c * Julian year (legacy constant)
    KM_PER_LY: 9.4607304725808e12,
    // Parsec: 1 AU / tan(1 arcsec) (legacy constant)
    KM_PER_PC: 3.0856775814914e13,

    // Derived values (computed below)
    M_PER_AU: 0,
    CM_PER_AU: 0
  },

  PHOTON: {
    // Physical constants (CGS). Kept here so demos/models share a single source of truth.
    // Exact definitions (SI) converted to CGS:
    // - c = 299,792,458 m/s (exact) = 2.99792458×10^10 cm/s
    // - h = 6.62607015×10^-34 J·s (exact) = 6.62607015×10^-27 erg·s
    // - 1 eV = 1.602176634×10^-19 J (exact) = 1.602176634×10^-12 erg
    C_CM_PER_S: 2.99792458e10,
    H_ERG_S: 6.62607015e-27,

    // Unit conversions used by Wave 3 light/spectra demos (teaching-facing outputs may use eV/keV/MeV).
    ERG_PER_EV: 1.602176634e-12,
    EV_PER_ERG: 0,

    // Wavelength convenience conversions (CGS base is cm).
    CM_PER_NM: 1e-7,
    NM_PER_CM: 0
  },

  GRAV: {
    // In AU/yr/M☉ teaching units, it is conventional to take:
    //   G = 4π² AU³ / yr² / M☉
    // so that for a 1 M☉ star: P² = a³ with P in years, a in AU.
    G_AU3_YR2_PER_SOLAR_MASS: 4 * Math.PI * Math.PI
  },

  MOON: {
    // Present-day mean lunar recession rate.
    // Source: laser ranging, Williams & Boggs (2016).
    MEAN_RECESSION_CM_PER_YEAR: 3.8,
    // Present-day mean Earth-Moon distance (km).
    DISTANCE_TODAY_KM: 384400,
    // Mean lunar diameter (km).
    DIAMETER_KM: 3474,
    // Angular size extremes observed from Earth (deg).
    ORBIT_MIN_ANGULAR_SIZE_DEG: 0.49,
    ORBIT_MAX_ANGULAR_SIZE_DEG: 0.56
  }
} as const;

// --------------------------------------------
// Derived constants (match legacy implementation)
// --------------------------------------------

const TIME = AstroConstants.TIME as {
  DAY_S: number;
  JULIAN_YEAR_S: number;
  YEAR_S: number;
  MEAN_TROPICAL_YEAR_DAYS: number;
  MEAN_SIDEREAL_MONTH_DAYS: number;
  MEAN_SYNODIC_MONTH_DAYS: number;
  MEAN_NODE_REGRESSION_JULIAN_YEARS: number;
  MEAN_TROPICAL_YEAR_S: number;
  MEAN_SIDEREAL_MONTH_S: number;
  MEAN_SYNODIC_MONTH_S: number;
  MEAN_NODE_REGRESSION_S: number;
  MEAN_NODE_REGRESSION_DAYS: number;
  MEAN_DRACONIC_MONTH_DAYS: number;
  MEAN_DRACONIC_MONTH_S: number;
};

TIME.MEAN_TROPICAL_YEAR_S = TIME.MEAN_TROPICAL_YEAR_DAYS * TIME.DAY_S;
TIME.MEAN_SIDEREAL_MONTH_S = TIME.MEAN_SIDEREAL_MONTH_DAYS * TIME.DAY_S;
TIME.MEAN_SYNODIC_MONTH_S = TIME.MEAN_SYNODIC_MONTH_DAYS * TIME.DAY_S;

TIME.MEAN_NODE_REGRESSION_S =
  TIME.MEAN_NODE_REGRESSION_JULIAN_YEARS * TIME.JULIAN_YEAR_S;
TIME.MEAN_NODE_REGRESSION_DAYS = TIME.MEAN_NODE_REGRESSION_S / TIME.DAY_S;

// Eclipse-relevant: draconic month (node-to-node) derived from sidereal month + nodal regression.
// If Moon advances +360/P_sid per day and the node regresses −360/P_node per day,
// the relative rate is (1/P_sid + 1/P_node) cycles/day.
// So: P_drac = 1 / (1/P_sid + 1/P_node)
TIME.MEAN_DRACONIC_MONTH_DAYS =
  1 /
  (1 / TIME.MEAN_SIDEREAL_MONTH_DAYS + 1 / TIME.MEAN_NODE_REGRESSION_DAYS);
TIME.MEAN_DRACONIC_MONTH_S = TIME.MEAN_DRACONIC_MONTH_DAYS * TIME.DAY_S;

const LENGTH = AstroConstants.LENGTH as {
  CM_PER_M: number;
  M_PER_KM: number;
  CM_PER_KM: number;
  KM_PER_AU: number;
  KM_PER_LY: number;
  KM_PER_PC: number;
  M_PER_AU: number;
  CM_PER_AU: number;
};

LENGTH.M_PER_AU = LENGTH.KM_PER_AU * LENGTH.M_PER_KM;
LENGTH.CM_PER_AU = LENGTH.M_PER_AU * LENGTH.CM_PER_M;

const PHOTON = AstroConstants.PHOTON as {
  C_CM_PER_S: number;
  H_ERG_S: number;
  ERG_PER_EV: number;
  EV_PER_ERG: number;
  CM_PER_NM: number;
  NM_PER_CM: number;
};

PHOTON.EV_PER_ERG = 1 / PHOTON.ERG_PER_EV;
PHOTON.NM_PER_CM = 1 / PHOTON.CM_PER_NM;
