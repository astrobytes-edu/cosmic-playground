/**
 * ConservationLawsModel (Orbits)
 *
 * Pure helpers for the Conservation Laws instrument:
 * - convert initial-condition UI choices into state vectors
 * - sample conic sections (ellipse/parabola/hyperbola) for rendering
 *
 * Units:
 * - Positions: AU
 * - Velocities: AU/yr
 * - Conic parameters: p in AU, angles in radians
 */

export type Vec2Au = { xAu: number; yAu: number };
export type Vec2AuYr = { vxAuYr: number; vyAuYr: number };

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * At the initial point we place the particle on the +x axis:
 *   r0 = (r0Au, 0)
 *
 * Define directionDeg so that:
 * - 0°   means purely tangential (+y direction)
 * - +90° means purely radial outward (+x direction)
 * - −90° means purely radial inward (−x direction)
 */
function velocityFromSpeedAndDirectionAuYr(args: {
  speedAuYr: number;
  directionDeg: number;
}): Vec2AuYr {
  const { speedAuYr, directionDeg } = args;
  if (!Number.isFinite(speedAuYr) || !Number.isFinite(directionDeg)) return { vxAuYr: NaN, vyAuYr: NaN };
  const a = degToRad(directionDeg);
  return { vxAuYr: speedAuYr * Math.sin(a), vyAuYr: speedAuYr * Math.cos(a) };
}

function initialStateAuYr(args: {
  r0Au: number;
  speedAuYr: number;
  directionDeg: number;
}): { rVecAu: Vec2Au | null; vVecAuYr: Vec2AuYr | null } {
  const { r0Au, speedAuYr, directionDeg } = args;
  if (!Number.isFinite(r0Au) || r0Au <= 0) return { rVecAu: null, vVecAuYr: null };
  return {
    rVecAu: { xAu: r0Au, yAu: 0 },
    vVecAuYr: velocityFromSpeedAndDirectionAuYr({ speedAuYr, directionDeg })
  };
}

/**
 * Determine a safe true-anomaly domain for plotting a conic.
 *
 * Conic in polar form: r(ν) = p / (1 + e cos ν)
 *
 * For hyperbolas, we must keep the denominator positive:
 *   1 + e cos ν > 0  ⇒  cos ν > -1/e.
 */
function conicTrueAnomalyDomainRad(args: { ecc: number }): { nuMin: number; nuMax: number } {
  const { ecc } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return { nuMin: NaN, nuMax: NaN };

  const EPS = 1e-3;
  if (ecc < 1) return { nuMin: 0, nuMax: 2 * Math.PI };
  if (Math.abs(ecc - 1) < 1e-10) return { nuMin: -Math.PI + EPS, nuMax: Math.PI - EPS };

  const nuMax = Math.acos(-1 / ecc) - EPS;
  return { nuMin: -nuMax, nuMax };
}

/**
 * Plotting helper: for open orbits, optionally clip the domain so that r(ν) ≤ rMaxAu.
 *
 * This keeps escape/hyperbolic orbits visible in a finite view window and avoids
 * sampling arbitrarily close to asymptotes where r → ∞.
 */
function conicTrueAnomalyDomainRadForPlot(args: {
  ecc: number;
  pAu: number;
  rMaxAu: number;
}): { nuMin: number; nuMax: number } {
  const { ecc, pAu, rMaxAu } = args;
  const base = conicTrueAnomalyDomainRad({ ecc });
  if (!Number.isFinite(base.nuMin) || !Number.isFinite(base.nuMax)) return base;
  if (!(Number.isFinite(ecc) && ecc >= 1)) return base;
  if (!(Number.isFinite(pAu) && pAu > 0)) return base;
  if (!(Number.isFinite(rMaxAu) && rMaxAu > 0)) return base;

  const c = (pAu / rMaxAu - 1) / ecc;
  const cClamped = Math.max(-1, Math.min(1, c));
  const nuMaxClip = Math.acos(cClamped);
  if (!Number.isFinite(nuMaxClip)) return base;

  const clipped = Math.min(base.nuMax, nuMaxClip);
  return { nuMin: -clipped, nuMax: clipped };
}

function wrap2Pi(rad: number) {
  const twoPi = 2 * Math.PI;
  return ((rad % twoPi) + twoPi) % twoPi;
}

/**
 * Animation helper: advance ν for a simple parameter-sweep animation.
 *
 * - For elliptical orbits, wraps ν into [0, 2π).
 * - For open orbits, clamps at the plotting domain edge and returns stopped=true.
 */
function advanceTrueAnomalyRad(args: {
  nuRad: number;
  ecc: number;
  nuMin: number;
  nuMax: number;
  dir: number;
  dtSec: number;
  nuSpeedRadPerSec: number;
}): { nuRad: number; dir: number; stopped: boolean } {
  const { ecc, nuMin, nuMax } = args;
  const dir = Number.isFinite(args.dir) ? args.dir : 1;
  if (!Number.isFinite(args.nuRad)) return { nuRad: NaN, dir, stopped: true };

  const dt = Number.isFinite(args.dtSec) ? args.dtSec : 0;
  const speed = Number.isFinite(args.nuSpeedRadPerSec) ? args.nuSpeedRadPerSec : 0;
  const next = args.nuRad + dir * speed * dt;

  if (!Number.isFinite(ecc) || ecc < 0) return { nuRad: next, dir, stopped: true };
  if (ecc < 1) return { nuRad: wrap2Pi(next), dir, stopped: false };

  if (!Number.isFinite(nuMin) || !Number.isFinite(nuMax)) return { nuRad: next, dir, stopped: true };
  if (next > nuMax) return { nuRad: nuMax, dir, stopped: true };
  if (next < nuMin) return { nuRad: nuMin, dir, stopped: true };
  return { nuRad: next, dir, stopped: false };
}

function sampleConicOrbitAu(args: {
  ecc: number;
  pAu: number;
  omegaRad: number;
  numPoints: number;
  rMaxAu: number;
}): Vec2Au[] {
  const { ecc, pAu, omegaRad, numPoints, rMaxAu } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return [];
  if (!Number.isFinite(pAu) || pAu <= 0) return [];
  if (!Number.isFinite(omegaRad)) return [];
  if (!Number.isFinite(numPoints) || numPoints < 3) return [];

  const { nuMin, nuMax } = conicTrueAnomalyDomainRadForPlot({ ecc, pAu, rMaxAu });
  if (!Number.isFinite(nuMin) || !Number.isFinite(nuMax)) return [];

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);

  const points: Vec2Au[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const nu = nuMin + t * (nuMax - nuMin);
    const denom = 1 + ecc * Math.cos(nu);
    if (denom <= 0) continue;
    const r = pAu / denom;
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);
    points.push({
      xAu: xOrb * cosO - yOrb * sinO,
      yAu: xOrb * sinO + yOrb * cosO
    });
  }

  return points;
}

export const ConservationLawsModel = {
  velocityFromSpeedAndDirectionAuYr,
  initialStateAuYr,
  conicTrueAnomalyDomainRad,
  conicTrueAnomalyDomainRadForPlot,
  advanceTrueAnomalyRad,
  sampleConicOrbitAu
} as const;

