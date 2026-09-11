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

import { TwoBodyAnalytic, type TwoBodyOrbitType } from "./twoBodyAnalytic";

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

/** r(nu) = p / (1 + e cos nu). NaN where the conic does not reach (hyperbola past its asymptote). */
function orbitalRadiusAu(args: { ecc: number; pAu: number; nuRad: number }): number {
  const { ecc, pAu, nuRad } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return NaN;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return NaN;
  if (!Number.isFinite(nuRad)) return NaN;
  const denom = 1 + ecc * Math.cos(nuRad);
  return denom > 0 ? pAu / denom : NaN;
}

/** Position and d(position)/d(nu) in the plot frame (orbit rotated by omega). */
function conicPositionAndTangentAu(args: {
  ecc: number;
  pAu: number;
  omegaRad: number;
  nuRad: number;
}): { xAu: number; yAu: number; dxAu: number; dyAu: number } | null {
  const { ecc, pAu, omegaRad, nuRad } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return null;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return null;
  if (!Number.isFinite(omegaRad) || !Number.isFinite(nuRad)) return null;

  const cosNu = Math.cos(nuRad);
  const sinNu = Math.sin(nuRad);
  const denom = 1 + ecc * cosNu;
  if (!(denom > 0)) return null;

  const r = pAu / denom;
  const drDnu = (pAu * ecc * sinNu) / (denom * denom);
  const xOrb = r * cosNu;
  const yOrb = r * sinNu;
  const dxOrb = drDnu * cosNu - r * sinNu;
  const dyOrb = drDnu * sinNu + r * cosNu;

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);
  return {
    xAu: xOrb * cosO - yOrb * sinO,
    yAu: xOrb * sinO + yOrb * cosO,
    dxAu: dxOrb * cosO - dyOrb * sinO,
    dyAu: dxOrb * sinO + dyOrb * cosO
  };
}

/** v(nu) = (mu / h) sqrt(1 + 2 e cos nu + e^2). */
function instantaneousSpeedAuPerYr(args: {
  muAu3Yr2: number;
  hAbsAu2Yr: number;
  ecc: number;
  nuRad: number;
}): number {
  const { muAu3Yr2, hAbsAu2Yr, ecc, nuRad } = args;
  if (!Number.isFinite(muAu3Yr2) || !(muAu3Yr2 > 0)) return NaN;
  if (!Number.isFinite(hAbsAu2Yr) || !(hAbsAu2Yr > 0)) return NaN;
  if (!Number.isFinite(ecc) || ecc < 0 || !Number.isFinite(nuRad)) return NaN;
  const q = 1 + 2 * ecc * Math.cos(nuRad) + ecc * ecc;
  return (muAu3Yr2 / hAbsAu2Yr) * Math.sqrt(Math.max(0, q));
}

/** Specific kinetic and potential energy and their sum, AU^2/yr^2. */
function specificEnergyPartsAu2Yr2(args: { rAu: number; vAuYr: number; muAu3Yr2: number }): {
  kAu2Yr2: number;
  uAu2Yr2: number;
  epsAu2Yr2: number;
} {
  const { rAu, vAuYr, muAu3Yr2 } = args;
  const kAu2Yr2 = Number.isFinite(vAuYr) ? 0.5 * vAuYr * vAuYr : NaN;
  const uAu2Yr2 = rAu > 0 && muAu3Yr2 > 0 ? -muAu3Yr2 / rAu : NaN;
  return { kAu2Yr2, uAu2Yr2, epsAu2Yr2: kAu2Yr2 + uAu2Yr2 };
}

export type InitialOrbit =
  | { orbitType: "invalid" }
  | {
      orbitType: TwoBodyOrbitType;
      muAu3Yr2: number;
      vCircAuYr: number;
      v0AuYr: number;
      rVecAu: Vec2Au;
      ecc: number;
      pAu: number;
      omegaRad: number;
      hAbsAu2Yr: number;
      epsAu2Yr2: number;
      /** True anomaly of the starting point; wrapped to [0, 2pi) for closed orbits. 0 for radial. */
      nu0Rad: number;
      /** Periapsis distance; 0 for radial motion. */
      rpAu: number;
      /** Farthest distance reached; Infinity for open orbits. */
      raAu: number;
      /** Speed at periapsis, the fastest point on the drawn path; 0 for radial motion. */
      vPeriAuYr: number;
    };

/**
 * Everything the instrument shows, from the four controls. The display, Station Mode and the
 * announcements must all read this, so an exact preset (speedFactor = Math.SQRT2) cannot be
 * classified one way on screen and another in the table.
 *
 * It models counter-clockwise starts from +x only: the conic helpers place the body by
 * counter-clockwise true anomaly, so a clockwise start (h < 0) is returned as invalid.
 */
function initialOrbit(args: {
  massSolar: number;
  r0Au: number;
  speedFactor: number;
  directionDeg: number;
}): InitialOrbit {
  const { massSolar, r0Au, speedFactor, directionDeg } = args;
  const muAu3Yr2 = TwoBodyAnalytic.muAu3Yr2FromMassSolar(massSolar);
  const vCircAuYr = TwoBodyAnalytic.circularSpeedAuPerYr({ muAu3Yr2, rAu: r0Au });
  if (!Number.isFinite(vCircAuYr) || !Number.isFinite(speedFactor) || speedFactor < 0) {
    return { orbitType: "invalid" };
  }

  const v0AuYr = speedFactor * vCircAuYr;
  const init = initialStateAuYr({ r0Au, speedAuYr: v0AuYr, directionDeg });
  if (!init.rVecAu || !init.vVecAuYr) return { orbitType: "invalid" };

  const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ rVecAu: init.rVecAu, vVecAuYr: init.vVecAuYr, muAu3Yr2 });
  if (el.orbitType === "invalid" || el.hAu2Yr < 0) return { orbitType: "invalid" };

  const radial = el.orbitType === "radial";
  // Round-off leaves an exact escape at e = 1 - 4e-16 for some masses and radii. Every e >= 1
  // branch (plot domain, animation) must see it as open, so a parabolic orbit is e = 1 exactly.
  const ecc = el.orbitType === "parabolic" ? 1 : el.ecc;
  const closed = !radial && ecc < 1;
  return {
    orbitType: el.orbitType,
    muAu3Yr2,
    vCircAuYr,
    v0AuYr,
    rVecAu: init.rVecAu,
    ecc,
    pAu: el.pAu,
    omegaRad: el.omegaRad,
    hAbsAu2Yr: el.hAbsAu2Yr,
    epsAu2Yr2: el.epsAu2Yr2,
    nu0Rad: radial ? 0 : closed ? wrap2Pi(el.nuRad) : el.nuRad,
    rpAu: radial ? 0 : el.pAu / (1 + ecc),
    raAu: radial
      ? el.epsAu2Yr2 < 0 ? -muAu3Yr2 / el.epsAu2Yr2 : Number.POSITIVE_INFINITY
      : closed ? el.pAu / (1 - ecc) : Number.POSITIVE_INFINITY,
    vPeriAuYr: el.hAbsAu2Yr > 0 ? (muAu3Yr2 * (1 + ecc)) / el.hAbsAu2Yr : 0
  };
}

const MAX_OPEN_ORBIT_DNU_RAD = 0.01;
/** Largest fractional change in the rate h / r^2 across one open-orbit sub-step. */
const MAX_OPEN_ORBIT_RATE_CHANGE = 1e-3;

/**
 * Advance the true anomaly by dtYr of orbital time, in the direction of motion.
 * Closed orbits step the mean anomaly, so the timing is Kepler's exactly for any step size.
 * Open orbits integrate dnu/dt = h / r^2 and stop at nuMax. Each sub-step moves nu by at most
 * MAX_OPEN_ORBIT_DNU_RAD and changes the rate by at most MAX_OPEN_ORBIT_RATE_CHANGE: on a near-radial
 * pass the rate is steep in nu, and a cap on nu alone let the body reach the view edge 7% early.
 */
function advanceTrueAnomalyByTime(args: {
  nuRad: number;
  ecc: number;
  pAu: number;
  hAbsAu2Yr: number;
  muAu3Yr2: number;
  dtYr: number;
  nuMax: number;
}): { nuRad: number; stopped: boolean } {
  const { nuRad, ecc, pAu, hAbsAu2Yr, muAu3Yr2, dtYr, nuMax } = args;
  if (![nuRad, ecc, pAu, hAbsAu2Yr, muAu3Yr2, dtYr].every(Number.isFinite) || !(pAu > 0) || !(hAbsAu2Yr > 0)) {
    return { nuRad, stopped: true };
  }
  if (ecc < 1) {
    const aAu = pAu / (1 - ecc * ecc);
    const meanMotionRadPerYr = Math.sqrt(muAu3Yr2 / (aAu * aAu * aAu));
    const meanAnomalyRad = TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad: nuRad, e: ecc }) + meanMotionRadPerYr * dtYr;
    return { nuRad: wrap2Pi(TwoBodyAnalytic.meanToTrueAnomalyRad({ meanAnomalyRad, e: ecc })), stopped: false };
  }
  let nu = nuRad;
  let remainingYr = dtYr;
  for (let i = 0; i < 100000 && remainingYr > 0; i++) {
    const rAu = orbitalRadiusAu({ ecc, pAu, nuRad: nu });
    if (!(rAu > 0)) return { nuRad: nu, stopped: true };
    const rateRadPerYr = hAbsAu2Yr / (rAu * rAu);
    // |d ln(h / r^2) / d nu| = |2 e sin nu / (1 + e cos nu)|; rAu > 0 above keeps the denominator positive.
    // It is zero at periapsis (sin nu = 0), where only the nu cap applies.
    const rateLogSlope = Math.abs((2 * ecc * Math.sin(nu)) / (1 + ecc * Math.cos(nu)));
    const maxDnuRad =
      rateLogSlope > 0
        ? Math.min(MAX_OPEN_ORBIT_DNU_RAD, MAX_OPEN_ORBIT_RATE_CHANGE / rateLogSlope)
        : MAX_OPEN_ORBIT_DNU_RAD;
    const stepYr = Math.min(remainingYr, maxDnuRad / rateRadPerYr);
    nu += rateRadPerYr * stepYr;
    remainingYr -= stepYr;
    if (nu >= nuMax) return { nuRad: nuMax, stopped: true };
  }
  return { nuRad: nu, stopped: false };
}

/** Kepler's third law, T = 2 pi sqrt(a^3 / mu) with a = p / (1 - e^2). NaN unless the orbit is bound (0 <= e < 1). */
function orbitalPeriodYr(args: { ecc: number; pAu: number; muAu3Yr2: number }): number {
  const { ecc, pAu, muAu3Yr2 } = args;
  if (![ecc, pAu, muAu3Yr2].every(Number.isFinite) || !(ecc >= 0 && ecc < 1) || !(pAu > 0) || !(muAu3Yr2 > 0)) {
    return NaN;
  }
  const aAu = pAu / (1 - ecc * ecc);
  return 2 * Math.PI * Math.sqrt((aAu * aAu * aAu) / muAu3Yr2);
}

/**
 * sinh(x) - x. Direct subtraction cancels for small |x| (relative error about 1e-15 / x^2), so below |x| = 0.1 this
 * sums x^3/3! + x^5/5! + ... + x^11/11!, whose first omitted term is below 1e-19 relative there.
 */
function sinhMinusX(x: number): number {
  if (Math.abs(x) >= 0.1) return Math.sinh(x) - x;
  const x2 = x * x;
  return ((x * x2) / 6) * (1 + (x2 / 20) * (1 + (x2 / 42) * (1 + (x2 / 72) * (1 + x2 / 110))));
}

/**
 * Orbital time to go from true anomaly nuFromRad to nuToRad on an open orbit (e >= 1); NaN for a bound one.
 * Both branches measure t(nu) from periapsis, so the result is negative when nuToRad < nuFromRad.
 * - Parabolic (ecc === 1, as initialOrbit sets it): Barker's equation, t(nu) = (1/2) sqrt(p^3 / mu) (D + D^3 / 3),
 *   with D = tan(nu / 2).
 * - Hyperbolic: a = p / (e^2 - 1), F(nu) = 2 atanh(sqrt((e - 1)/(e + 1)) tan(nu / 2)), and
 *   t(nu) = sqrt(a^3 / mu) (e sinh F - F); NaN past the asymptote, where the atanh argument exceeds 1.
 *   Each piece keeps its precision when e - 1 is tiny on a short arc near periapsis: the atanh form carries the sign
 *   of nu, e^2 - 1 is taken as (e - 1)(e + 1), and e sinh F - F as (e - 1) sinh F + (sinh F - F). For nu from -0.001
 *   to 0.001 at e - 1 = 1e-8, an acosh form of F was off by 1.2e-2; the atanh form alone by 5.7e-9.
 */
function timeBetweenTrueAnomaliesYr(args: {
  ecc: number;
  pAu: number;
  muAu3Yr2: number;
  nuFromRad: number;
  nuToRad: number;
}): number {
  const { ecc, pAu, muAu3Yr2, nuFromRad, nuToRad } = args;
  if (![ecc, pAu, muAu3Yr2, nuFromRad, nuToRad].every(Number.isFinite) || !(ecc >= 1) || !(pAu > 0) || !(muAu3Yr2 > 0)) {
    return NaN;
  }
  if (ecc === 1) {
    const barker = (nuRad: number) => {
      const d = Math.tan(nuRad / 2);
      return d + (d * d * d) / 3;
    };
    return 0.5 * Math.sqrt((pAu * pAu * pAu) / muAu3Yr2) * (barker(nuToRad) - barker(nuFromRad));
  }
  const aAu = pAu / ((ecc - 1) * (ecc + 1));
  const tanHalfNuScale = Math.sqrt((ecc - 1) / (ecc + 1));
  const hyperbolicKepler = (nuRad: number) => {
    const f = 2 * Math.atanh(tanHalfNuScale * Math.tan(nuRad / 2));
    return (ecc - 1) * Math.sinh(f) + sinhMinusX(f);
  };
  return Math.sqrt((aAu * aAu * aAu) / muAu3Yr2) * (hyperbolicKepler(nuToRad) - hyperbolicKepler(nuFromRad));
}

export const ConservationLawsModel = {
  velocityFromSpeedAndDirectionAuYr,
  initialStateAuYr,
  conicTrueAnomalyDomainRad,
  conicTrueAnomalyDomainRadForPlot,
  advanceTrueAnomalyByTime,
  orbitalPeriodYr,
  timeBetweenTrueAnomaliesYr,
  sampleConicOrbitAu,
  orbitalRadiusAu,
  conicPositionAndTangentAu,
  instantaneousSpeedAuPerYr,
  specificEnergyPartsAu2Yr2,
  initialOrbit
} as const;

