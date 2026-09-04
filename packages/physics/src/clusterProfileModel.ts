/**
 * Spatial density profiles for a sampled star cluster.
 *
 * A profile answers exactly one question: given a uniform random draw, where does a star
 * sit? Three-dimensional positions are authoritative — a two-dimensional view of a cluster
 * is a projection, never a flatten, and treating it otherwise makes the centre look denser
 * than it is.
 *
 * Ported from the novascope package. See docs/reviews/2026-09-04-novascope-port-survey.md.
 *
 * Units: all radii in parsecs.
 */

/** Plummer half-mass radius in units of the scale radius. Plummer (1911). */
export const PLUMMER_HALF_MASS_OVER_SCALE = 1.305;

export interface Vector3Pc {
  x: number;
  y: number;
  z: number;
}

/** A radius into an isotropic 3-D position, consuming two uniforms (theta, phi). */
function isotropic(radiusPc: number, random: () => number): Vector3Pc {
  const cosTheta = 2 * random() - 1;
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  const phi = 2 * Math.PI * random();
  return {
    x: radiusPc * sinTheta * Math.cos(phi),
    y: radiusPc * sinTheta * Math.sin(phi),
    z: radiusPc * cosTheta
  };
}

/**
 * Radius [pc] enclosing a mass fraction u of a Plummer sphere.
 *
 * Inverts M(<r): r = a / sqrt(u^(-2/3) - 1). Aarseth, Henon & Wielen (1974).
 * u is clamped away from zero because the inverse diverges there.
 */
export function plummerRadiusPc(enclosedMassFraction: number, scaleRadiusPc: number): number {
  const u = Math.min(1 - 1e-12, Math.max(1e-6, enclosedMassFraction));
  return scaleRadiusPc / Math.sqrt(u ** (-2 / 3) - 1);
}

/**
 * Enclosed-mass CDF of a truncated EFF profile, on a radial grid.
 *
 * rho(r) proportional to (1 + r^2/a^2)^(-gamma/2), truncated at rt.
 * Source: Elson, Fall & Freeman (1987), ApJ 323, 54.
 *
 * gamma = 3 is typical of a young cluster; gamma = 5 reduces to Plummer. There is no
 * closed form for general gamma, so this is a numerical inverse CDF.
 */
export function buildEffCdf(
  scaleRadiusPc: number,
  gamma: number,
  truncationRadiusPc: number,
  gridPoints = 512
): { cdf: Float64Array; radiiPc: Float64Array } {
  const radiiPc = new Float64Array(gridPoints);
  const cdf = new Float64Array(gridPoints);
  const step = truncationRadiusPc / (gridPoints - 1);
  let cumulative = 0;
  let previousIntegrand = 0;
  for (let i = 0; i < gridPoints; i += 1) {
    const r = i * step;
    const density = (1 + (r / scaleRadiusPc) ** 2) ** (-gamma / 2);
    const integrand = 4 * Math.PI * r * r * density; // dM/dr
    if (i > 0) cumulative += 0.5 * (integrand + previousIntegrand) * step; // trapezoid
    radiiPc[i] = r;
    cdf[i] = cumulative;
    previousIntegrand = integrand;
  }
  const total = cumulative || 1;
  for (let i = 0; i < gridPoints; i += 1) cdf[i] /= total;
  return { cdf, radiiPc };
}

/** Monotone-CDF inverse by binary search plus linear interpolation. */
function inverseCdf(u: number, cdf: Float64Array, radiiPc: Float64Array): number {
  const n = cdf.length;
  if (u <= cdf[0]) return radiiPc[0];
  if (u >= cdf[n - 1]) return radiiPc[n - 1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] <= u) lo = mid;
    else hi = mid;
  }
  const t = (u - cdf[lo]) / (cdf[hi] - cdf[lo] || 1);
  return radiiPc[lo] + t * (radiiPc[hi] - radiiPc[lo]);
}

/**
 * Half-mass radius of a truncated EFF(gamma) profile, in units of the scale radius.
 *
 * Lets a demo quote a real half-mass radius for any gamma instead of assuming the Plummer
 * ratio. gamma = 5 returns approximately the Plummer value.
 */
export function effHalfMassOverScale(gamma: number): number {
  const { cdf, radiiPc } = buildEffCdf(1, gamma, 15);
  return inverseCdf(0.5, cdf, radiiPc);
}

export interface ProfileSpec {
  kind: "plummer" | "eff";
  scaleRadiusPc: number;
  /** EFF only: the 3-D density slope. Ignored for Plummer. */
  gamma?: number;
}

/** How far out an EFF profile is truncated, in scale radii. */
const EFF_TRUNCATION_SCALE_RADII = 15;

/**
 * A position sampler for a profile.
 *
 * Both paths draw exactly three uniforms per star — radius, then two angles — so switching
 * profile moves the positions without changing how many draws the stream has consumed.
 * That is what keeps a seed meaningful when a control changes.
 */
export function makeProfileSampler(
  profile: ProfileSpec
): (random: () => number) => Vector3Pc {
  if (profile.kind === "eff") {
    const gamma = profile.gamma ?? 5;
    const { cdf, radiiPc } = buildEffCdf(
      profile.scaleRadiusPc,
      gamma,
      profile.scaleRadiusPc * EFF_TRUNCATION_SCALE_RADII
    );
    return (random) => isotropic(inverseCdf(random(), cdf, radiiPc), random);
  }
  return (random) => isotropic(plummerRadiusPc(random(), profile.scaleRadiusPc), random);
}

export const ClusterProfileModel = {
  PLUMMER_HALF_MASS_OVER_SCALE,
  plummerRadiusPc,
  buildEffCdf,
  effHalfMassOverScale,
  makeProfileSampler
} as const;
