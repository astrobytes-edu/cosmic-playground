/**
 * TwoBodyAnalytic
 *
 * Pure, testable analytic two-body relations.
 *
 * Design:
 * - Geometry helpers are unit-agnostic (they work in any consistent length unit).
 * - “Teaching wrappers” use the AU/yr/M☉ normalization in AstroConstants (G = 4π²).
 * - Conversions (AU ↔ km ↔ cm, yr ↔ s) are delegated to AstroUnits.
 */

import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

export type Vec2Au = { xAu: number; yAu: number };
export type Vec2AuYr = { vxAuYr: number; vyAuYr: number };

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

// -------------------------------------------
// Geometry (unit-agnostic)
// -------------------------------------------

// r(θ) = a(1-e^2) / (1 + e cos θ)
function orbitalRadius(args: { a: number; e: number; thetaRad: number }): number {
  const { a, e, thetaRad } = args;
  if (!isFinitePositive(a)) return Number.NaN;
  if (!Number.isFinite(e) || e < 0 || e >= 1) return Number.NaN;
  const denom = 1 + e * Math.cos(thetaRad);
  return (a * (1 - e * e)) / denom;
}

function trueToEccentricAnomalyRad(args: {
  thetaRad: number;
  e: number;
}): number {
  const { thetaRad, e } = args;
  if (!Number.isFinite(e) || e < 0 || e >= 1) return Number.NaN;
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const denom = 1 + e * cosT;
  const cosE = (e + cosT) / denom;
  const sinE = (Math.sqrt(1 - e * e) * sinT) / denom;
  return Math.atan2(sinE, cosE);
}

function trueToMeanAnomalyRad(args: { thetaRad: number; e: number }): number {
  const E = trueToEccentricAnomalyRad(args);
  return E - args.e * Math.sin(E);
}

function meanToTrueAnomalyRad(args: {
  meanAnomalyRad: number;
  e: number;
}): number {
  const { meanAnomalyRad, e } = args;
  if (!Number.isFinite(e) || e < 0 || e >= 1) return Number.NaN;

  // Intentionally do NOT normalize mean anomaly: callers can build continuous
  // "time windows" without discontinuities at 0/2π.
  const M = meanAnomalyRad;

  // Solve Kepler’s equation: M = E - e sin E using Newton iterations.
  let E = M;
  for (let i = 0; i < 25; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = -f / fp;
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }

  const denom = 1 - e * Math.cos(E);
  const cosT = (Math.cos(E) - e) / denom;
  const sinT = (Math.sqrt(1 - e * e) * Math.sin(E)) / denom;
  return Math.atan2(sinT, cosT);
}

// -------------------------------------------
// Teaching-unit helpers (AU / yr / M☉)
// -------------------------------------------

function muAu3Yr2FromMassSolar(massSolar: number): number {
  if (!isFinitePositive(massSolar)) return Number.NaN;
  return AstroConstants.GRAV.G_AU3_YR2_PER_SOLAR_MASS * massSolar;
}

function orbitalPeriodYrFromAuSolar(args: { aAu: number; massSolar: number }): number {
  const { aAu, massSolar } = args;
  if (!isFinitePositive(aAu)) return Number.NaN;
  if (!isFinitePositive(massSolar)) return Number.NaN;
  return Math.sqrt((aAu * aAu * aAu) / massSolar);
}

function circularSpeedAuPerYr(args: { muAu3Yr2: number; rAu: number }): number {
  const { muAu3Yr2, rAu } = args;
  if (!isFinitePositive(muAu3Yr2)) return Number.NaN;
  if (!isFinitePositive(rAu)) return Number.NaN;
  return Math.sqrt(muAu3Yr2 / rAu);
}

function escapeSpeedAuPerYr(args: { muAu3Yr2: number; rAu: number }): number {
  const { muAu3Yr2, rAu } = args;
  if (!isFinitePositive(muAu3Yr2)) return Number.NaN;
  if (!isFinitePositive(rAu)) return Number.NaN;
  return Math.sqrt((2 * muAu3Yr2) / rAu);
}

function visVivaSpeedAuPerYr(args: {
  rAu: number;
  aAu: number;
  muAu3Yr2: number;
}): number {
  const { rAu, aAu, muAu3Yr2 } = args;
  if (!isFinitePositive(rAu)) return Number.NaN;
  if (!isFinitePositive(aAu)) return Number.NaN;
  if (!isFinitePositive(muAu3Yr2)) return Number.NaN;

  const v2 = muAu3Yr2 * (2 / rAu - 1 / aAu);
  if (v2 < 0) return 0; // numerical safety near edges
  return Math.sqrt(v2);
}

function visVivaSpeedAuPerYrFromAuSolar(args: {
  rAu: number;
  aAu: number;
  massSolar: number;
}): number {
  return visVivaSpeedAuPerYr({
    rAu: args.rAu,
    aAu: args.aAu,
    muAu3Yr2: muAu3Yr2FromMassSolar(args.massSolar)
  });
}

function specificEnergyAu2Yr2(args: {
  rAu: number;
  vRelAuYr: number;
  muAu3Yr2: number;
}): number {
  const { rAu, vRelAuYr, muAu3Yr2 } = args;
  if (!isFinitePositive(rAu)) return Number.NaN;
  if (!Number.isFinite(vRelAuYr)) return Number.NaN;
  if (!isFinitePositive(muAu3Yr2)) return Number.NaN;
  return 0.5 * vRelAuYr * vRelAuYr - muAu3Yr2 / rAu;
}

function specificAngularMomentumAu2YrFromOrbit(args: {
  aAu: number;
  e: number;
  muAu3Yr2: number;
}): number {
  const { aAu, e, muAu3Yr2 } = args;
  if (!isFinitePositive(aAu)) return Number.NaN;
  if (!Number.isFinite(e) || e < 0 || e >= 1) return Number.NaN;
  if (!isFinitePositive(muAu3Yr2)) return Number.NaN;
  return Math.sqrt(muAu3Yr2 * aAu * (1 - e * e));
}

function arealVelocityAu2Yr(args: { hAu2Yr: number }): number {
  if (!Number.isFinite(args.hAu2Yr)) return Number.NaN;
  return 0.5 * args.hAu2Yr;
}

function orbitElementsFromStateAuYr(args: {
  rVecAu: Vec2Au;
  vVecAuYr: Vec2AuYr;
  muAu3Yr2: number;
}):
  | { orbitType: "invalid" }
  | {
      rAu: number;
      v2Au2Yr2: number;
      epsAu2Yr2: number;
      hAu2Yr: number;
      hAbsAu2Yr: number;
      ecc: number;
      eVec: { ex: number; ey: number };
      pAu: number;
      aAu: number;
      omegaRad: number;
      orbitType: "elliptical" | "circular" | "parabolic" | "hyperbolic";
    } {
  const { rVecAu, vVecAuYr, muAu3Yr2 } = args;
  if (!rVecAu || !vVecAuYr) return { orbitType: "invalid" };

  const x = rVecAu.xAu;
  const y = rVecAu.yAu;
  const vx = vVecAuYr.vxAuYr;
  const vy = vVecAuYr.vyAuYr;
  if (![x, y, vx, vy].every(Number.isFinite)) return { orbitType: "invalid" };
  if (!isFinitePositive(muAu3Yr2)) return { orbitType: "invalid" };

  const r = Math.sqrt(x * x + y * y);
  if (!(r > 0)) return { orbitType: "invalid" };

  const v2 = vx * vx + vy * vy;
  const eps = 0.5 * v2 - muAu3Yr2 / r; // AU^2/yr^2

  // Specific angular momentum (z-component in 2D).
  const hz = x * vy - y * vx; // AU^2/yr
  const h = Math.abs(hz);

  // Eccentricity vector: e = (v × h)/μ - r̂
  // In 2D: v×h_z = (vy*hz, -vx*hz)
  const rx = x / r;
  const ry = y / r;
  const ex = (vy * hz) / muAu3Yr2 - rx;
  const ey = (-vx * hz) / muAu3Yr2 - ry;
  const ecc = Math.sqrt(ex * ex + ey * ey);

  // Semi-latus rectum p = h^2 / μ
  const p = (h * h) / muAu3Yr2;

  // Semi-major axis a = -μ/(2ε) (infinite for ε=0)
  const EPS_TOL = 1e-12;
  const a = Math.abs(eps) < EPS_TOL ? Number.POSITIVE_INFINITY : -muAu3Yr2 / (2 * eps);

  // Periapsis direction is along eccentricity vector.
  const omega = ecc < 1e-14 ? 0 : Math.atan2(ey, ex);

  const E_TOL = 1e-8;
  let orbitType: "elliptical" | "circular" | "parabolic" | "hyperbolic" | "invalid" =
    "elliptical";
  if (!Number.isFinite(ecc)) orbitType = "invalid";
  else if (ecc < 1e-10) orbitType = "circular";
  else if (Math.abs(ecc - 1) < E_TOL) orbitType = "parabolic";
  else if (ecc > 1) orbitType = "hyperbolic";

  if (orbitType === "invalid") return { orbitType: "invalid" };

  return {
    rAu: r,
    v2Au2Yr2: v2,
    epsAu2Yr2: eps,
    hAu2Yr: hz,
    hAbsAu2Yr: h,
    ecc,
    eVec: { ex, ey },
    pAu: p,
    aAu: a,
    omegaRad: omega,
    orbitType
  };
}

// -------------------------------------------
// Conversions / interoperability
// -------------------------------------------

function muCgsFromMuAu3Yr2(muAu3Yr2: number): number {
  return AstroUnits.au3PerYr2ToCm3PerS2(muAu3Yr2);
}

function speedKmPerSFromAuPerYr(vAuYr: number): number {
  return AstroUnits.auPerYrToKmPerS(vAuYr);
}

function accelMPerS2FromAuPerYr2(aAuYr2: number): number {
  return AstroUnits.auPerYr2ToMPerS2(aAuYr2);
}

export const TwoBodyAnalytic = {
  orbitalRadius,
  trueToEccentricAnomalyRad,
  trueToMeanAnomalyRad,
  meanToTrueAnomalyRad,

  muAu3Yr2FromMassSolar,
  orbitalPeriodYrFromAuSolar,
  circularSpeedAuPerYr,
  escapeSpeedAuPerYr,
  visVivaSpeedAuPerYr,
  visVivaSpeedAuPerYrFromAuSolar,

  specificEnergyAu2Yr2,
  specificAngularMomentumAu2YrFromOrbit,
  arealVelocityAu2Yr,
  orbitElementsFromStateAuYr,

  muCgsFromMuAu3Yr2,
  speedKmPerSFromAuPerYr,
  accelMPerS2FromAuPerYr2
} as const;

