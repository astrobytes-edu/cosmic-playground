/**
 * KeplersLawsModel
 *
 * Kepler-law-friendly orbit helpers in AU / yr / M☉ teaching units.
 *
 * Notes:
 * - Intended for the Kepler’s Laws demo (ellipse geometry, speed variation, period scaling).
 * - Central mass is expressed in solar masses and uses the repo teaching normalization:
 *   G = 4π² AU³/(yr²·M☉), so P² = a³ / M.
 */

import { TwoBodyAnalytic } from "./twoBodyAnalytic";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export type KeplerOrbitInputs = {
  aAu: number;
  e: number;
  centralMassSolar: number;
};

export type KeplerOrbitState = {
  aAu: number;
  e: number;
  centralMassSolar: number;
  muAu3Yr2: number;

  meanAnomalyRad: number;
  trueAnomalyRad: number;

  rAu: number;
  xAu: number;
  yAu: number;

  vxAuPerYr: number;
  vyAuPerYr: number;
  speedAuPerYr: number;

  accelAuPerYr2: number;
  specificEnergyAu2Yr2: number;
  specificAngularMomentumAu2Yr: number;
  arealVelocityAu2Yr: number;
};

export const KeplersLawsModel = {
  /**
   * Clamp eccentricity to a safe bound for classroom UI.
   * We avoid e→1 because the Kepler solver becomes numerically stiff.
   */
  clampEccentricity(e: number): number {
    if (!Number.isFinite(e)) return 0;
    return clamp(e, 0, 0.99);
  },

  orbitExtremaAu(args: { aAu: number; e: number }): { perihelionAu: number; aphelionAu: number } {
    const aAu = args.aAu;
    if (!isFinitePositive(aAu)) return { perihelionAu: Number.NaN, aphelionAu: Number.NaN };
    const e = KeplersLawsModel.clampEccentricity(args.e);
    return {
      perihelionAu: aAu * (1 - e),
      aphelionAu: aAu * (1 + e)
    };
  },

  orbitalPeriodYr(args: { aAu: number; centralMassSolar: number }): number {
    if (!isFinitePositive(args.aAu)) return Number.NaN;
    if (!isFinitePositive(args.centralMassSolar)) return Number.NaN;
    return TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({
      aAu: args.aAu,
      massSolar: args.centralMassSolar
    });
  },

  meanMotionRadPerYr(args: { aAu: number; centralMassSolar: number }): number {
    const p = KeplersLawsModel.orbitalPeriodYr(args);
    if (!isFinitePositive(p)) return Number.NaN;
    return (2 * Math.PI) / p;
  },

  stateAtMeanAnomalyRad(args: KeplerOrbitInputs & { meanAnomalyRad: number }): KeplerOrbitState {
    const aAu = args.aAu;
    const centralMassSolar = args.centralMassSolar;
    const e = KeplersLawsModel.clampEccentricity(args.e);
    const meanAnomalyRad = Number.isFinite(args.meanAnomalyRad) ? args.meanAnomalyRad : 0;

    const muAu3Yr2 = TwoBodyAnalytic.muAu3Yr2FromMassSolar(centralMassSolar);
    if (!isFinitePositive(aAu) || !isFinitePositive(centralMassSolar) || !isFinitePositive(muAu3Yr2)) {
      return {
        aAu,
        e,
        centralMassSolar,
        muAu3Yr2,
        meanAnomalyRad,
        trueAnomalyRad: Number.NaN,
        rAu: Number.NaN,
        xAu: Number.NaN,
        yAu: Number.NaN,
        vxAuPerYr: Number.NaN,
        vyAuPerYr: Number.NaN,
        speedAuPerYr: Number.NaN,
        accelAuPerYr2: Number.NaN,
        specificEnergyAu2Yr2: Number.NaN,
        specificAngularMomentumAu2Yr: Number.NaN,
        arealVelocityAu2Yr: Number.NaN
      };
    }

    const trueAnomalyRad = TwoBodyAnalytic.meanToTrueAnomalyRad({
      meanAnomalyRad,
      e
    });
    const rAu = TwoBodyAnalytic.orbitalRadius({ a: aAu, e, thetaRad: trueAnomalyRad });
    const xAu = rAu * Math.cos(trueAnomalyRad);
    const yAu = rAu * Math.sin(trueAnomalyRad);

    // Velocity in perifocal coordinates (AU/yr), then rotate into x/y.
    // p = a(1-e^2), h = sqrt(μ p).
    const pAu = aAu * (1 - e * e);
    const hAu2Yr = TwoBodyAnalytic.specificAngularMomentumAu2YrFromOrbit({
      aAu,
      e,
      muAu3Yr2
    });

    // v_r = (μ/h) e sinθ, v_θ = (μ/h) (1 + e cosθ)
    const muOverH = muAu3Yr2 / hAu2Yr;
    const sinT = Math.sin(trueAnomalyRad);
    const cosT = Math.cos(trueAnomalyRad);
    const vRadAuPerYr = muOverH * e * sinT;
    const vTanAuPerYr = muOverH * (1 + e * cosT);

    const vxAuPerYr = vRadAuPerYr * cosT - vTanAuPerYr * sinT;
    const vyAuPerYr = vRadAuPerYr * sinT + vTanAuPerYr * cosT;

    const speedAuPerYr = TwoBodyAnalytic.visVivaSpeedAuPerYr({
      rAu,
      aAu,
      muAu3Yr2
    });

    const accelAuPerYr2 = muAu3Yr2 / (rAu * rAu);
    const specificEnergyAu2Yr2 = TwoBodyAnalytic.specificEnergyAu2Yr2({
      rAu,
      vRelAuYr: speedAuPerYr,
      muAu3Yr2
    });
    const specificAngularMomentumAu2Yr = TwoBodyAnalytic.specificAngularMomentumAu2YrFromOrbit({
      aAu,
      e,
      muAu3Yr2
    });
    const arealVelocityAu2Yr = TwoBodyAnalytic.arealVelocityAu2Yr({
      hAu2Yr: specificAngularMomentumAu2Yr
    });

    // Numerical cross-check (dev sanity): speed computed from components should match vis-viva.
    // Keep the model pure: no asserts/throws; callers can validate if desired.
    void pAu; // (kept for clarity; used implicitly in h above)

    return {
      aAu,
      e,
      centralMassSolar,
      muAu3Yr2,
      meanAnomalyRad,
      trueAnomalyRad,
      rAu,
      xAu,
      yAu,
      vxAuPerYr,
      vyAuPerYr,
      speedAuPerYr,
      accelAuPerYr2,
      specificEnergyAu2Yr2,
      specificAngularMomentumAu2Yr,
      arealVelocityAu2Yr
    };
  }
} as const;
