/**
 * Pure UI logic for the planetary-conjunctions demo.
 * Extracted from main.ts so that formatting, coordinate helpers,
 * and conjunction detection can be unit-tested without DOM or physics imports.
 */

const TAU = 2 * Math.PI;
const DEG_PER_RAD = 180 / Math.PI;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanetName = "Venus" | "Mars" | "Jupiter" | "Saturn";

/**
 * DI callbacks: physics functions injected from @cosmic/physics so
 * that logic.test.ts can supply stubs or known values.
 */
export interface ConjunctionCallbacks {
  /** Semi-major axis in AU for the named planet. */
  planetSemiMajorAxisAu: (name: PlanetName) => number;
  /** Orbital period in years from Kepler III: P = sqrt(a^3 / M). */
  orbitalPeriodYr: (aAu: number, massSolar: number) => number;
  /** Synodic period from two sidereal periods (same time unit). */
  synodicPeriod: (p1: number, p2: number) => number;
}

// ---------------------------------------------------------------------------
// Planet data
// ---------------------------------------------------------------------------

/**
 * Return the sidereal period of a planet in days, given DI callbacks.
 */
export function siderealPeriodDays(
  name: PlanetName | "Earth",
  cb: Pick<ConjunctionCallbacks, "planetSemiMajorAxisAu" | "orbitalPeriodYr">
): number {
  const key = name as PlanetName;
  const aAu = name === "Earth"
    ? cb.planetSemiMajorAxisAu("Venus") // will be overridden below
    : cb.planetSemiMajorAxisAu(key);

  // For Earth we use the Earth element directly; we need a dedicated lookup.
  // Since the retrograde model has Earth elements, we handle it via a known constant.
  // But the DI pattern only exposes the four target planets. For Earth, we use
  // a dedicated constant consistent with a = 1.00000261 AU.
  if (name === "Earth") {
    // a_Earth = 1.00000261 AU -> P = sqrt(a^3) = sqrt(1.00000261^3) yr
    // Convert to days: P_yr * 365.25636 (Julian year in days from model year).
    // We use the callback to get the exact value.
    const aEarthAu = 1.00000261; // from PLANET_ELEMENTS
    const pYr = cb.orbitalPeriodYr(aEarthAu, 1);
    return pYr * yearDays();
  }

  const pYr = cb.orbitalPeriodYr(aAu, 1);
  return pYr * yearDays();
}

/**
 * Model year in days (Julian year: 365.25 days is the approximate value
 * from the mechanics year of 31557600 seconds).
 */
export function yearDays(): number {
  return 31557600 / 86400; // = 365.25
}

// ---------------------------------------------------------------------------
// Synodic period
// ---------------------------------------------------------------------------

/**
 * Compute the synodic period in days between Earth and a target planet.
 */
export function synodicPeriodDays(
  earthPeriodDays: number,
  targetPeriodDays: number,
  cb: Pick<ConjunctionCallbacks, "synodicPeriod">
): number {
  return cb.synodicPeriod(earthPeriodDays, targetPeriodDays);
}

// ---------------------------------------------------------------------------
// Angular positions
// ---------------------------------------------------------------------------

/**
 * Heliocentric longitude in radians for a circular orbit.
 * angle = 2*pi * t / P  (starting at angle = 0 when t = 0).
 */
export function planetAngleRad(daysSinceEpoch: number, orbitalPeriodDays: number): number {
  if (!Number.isFinite(daysSinceEpoch) || !Number.isFinite(orbitalPeriodDays) || orbitalPeriodDays <= 0) {
    return Number.NaN;
  }
  const raw = (TAU * daysSinceEpoch) / orbitalPeriodDays;
  // Wrap to [0, 2*pi)
  const wrapped = ((raw % TAU) + TAU) % TAU;
  return wrapped === TAU ? 0 : wrapped;
}

/**
 * Angular separation between two heliocentric longitudes.
 * Returns the smallest angle in [0, 180] degrees.
 */
export function angularSeparationDeg(angle1Rad: number, angle2Rad: number): number {
  if (!Number.isFinite(angle1Rad) || !Number.isFinite(angle2Rad)) return Number.NaN;
  let diff = Math.abs(angle1Rad - angle2Rad) % TAU;
  if (diff > Math.PI) diff = TAU - diff;
  return diff * DEG_PER_RAD;
}

/**
 * Check whether the angular separation qualifies as a conjunction.
 */
export function isConjunction(separationDeg: number, thresholdDeg: number = 5): boolean {
  if (!Number.isFinite(separationDeg)) return false;
  return separationDeg <= thresholdDeg;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a number for display. Non-finite -> em-dash.
 */
export function formatNumber(value: number, digits: number = 1): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

/**
 * Format a day count for readout display.
 * Shows as integer days for values < 1000, otherwise shows years with 1 decimal.
 */
export function formatDays(days: number): string {
  if (!Number.isFinite(days)) return "\u2014";
  if (days < 1000) return Math.round(days).toString();
  return (days / yearDays()).toFixed(1) + " yr";
}

/**
 * Convert angle from radians to degrees and format for display.
 */
export function formatAngleDeg(rad: number): string {
  if (!Number.isFinite(rad)) return "\u2014";
  const deg = rad * DEG_PER_RAD;
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped.toFixed(1);
}

// ---------------------------------------------------------------------------
// SVG coordinate helpers
// ---------------------------------------------------------------------------

export interface SvgPoint { x: number; y: number }

/**
 * Convert an orbital angle + radius to SVG coordinates.
 * Convention: angle = 0 is at 3 o'clock, increasing counter-clockwise
 * in the physics frame. SVG y-axis is inverted, so we negate y.
 */
export function orbitToSvg(
  cx: number,
  cy: number,
  radiusPx: number,
  angleRad: number
): SvgPoint {
  return {
    x: cx + radiusPx * Math.cos(angleRad),
    y: cy - radiusPx * Math.sin(angleRad)
  };
}

/**
 * Scale orbit radius in AU to SVG pixels.
 * We map the largest orbit to a fixed fraction of the viewBox.
 */
export function orbitRadiusPx(
  aAu: number,
  maxAu: number,
  maxPx: number
): number {
  if (!Number.isFinite(aAu) || aAu <= 0) return 0;
  if (!Number.isFinite(maxAu) || maxAu <= 0) return 0;
  return (aAu / maxAu) * maxPx;
}

// ---------------------------------------------------------------------------
// Planet CSS token mapping
// ---------------------------------------------------------------------------

const PLANET_CSS_VAR: Record<PlanetName, string> = {
  Venus: "--cp-celestial-venus",
  Mars: "--cp-celestial-mars",
  Jupiter: "--cp-celestial-jupiter",
  Saturn: "--cp-celestial-saturn"
};

/**
 * Get the CSS custom property name for a planet's color.
 */
export function planetCssVar(name: PlanetName): string {
  return PLANET_CSS_VAR[name];
}
