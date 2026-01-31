import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

const SYNODIC_MONTH_DAYS = AstroConstants.TIME.MEAN_SYNODIC_MONTH_DAYS;
export const SAROS_CYCLE_DAYS = SYNODIC_MONTH_DAYS * 223;
export const EXELIGMOS_CYCLE_DAYS = SAROS_CYCLE_DAYS * 3;
const CYCLE_TOLERANCE_DAYS = 1;

function normalizeAngleDeg(angleDeg: number): number {
  return ((angleDeg % 360) + 360) % 360;
}

function angularSeparationDeg(aDeg: number, bDeg: number): number {
  const diff = Math.abs(normalizeAngleDeg(aDeg - bDeg));
  return diff > 180 ? 360 - diff : diff;
}

function phaseAngleDeg(args: { moonLonDeg: number; sunLonDeg: number }): number {
  return normalizeAngleDeg(args.moonLonDeg - args.sunLonDeg);
}

function eclipticLatitudeDeg(args: {
  tiltDeg: number;
  moonLonDeg: number;
  nodeLonDeg: number;
}): number {
  const iRad = AstroUnits.degToRad(args.tiltDeg);
  const dRad = AstroUnits.degToRad(args.moonLonDeg - args.nodeLonDeg);
  const betaRad = Math.asin(Math.sin(iRad) * Math.sin(dRad));
  return AstroUnits.radToDeg(betaRad);
}

function nearestNodeDistanceDeg(args: { moonLonDeg: number; nodeLonDeg: number }): number {
  const dAsc = angularSeparationDeg(args.moonLonDeg, args.nodeLonDeg);
  const dDesc = angularSeparationDeg(args.moonLonDeg, args.nodeLonDeg + 180);
  return Math.min(dAsc, dDesc);
}

function betaFromDeltaLambdaDeg(args: { tiltDeg: number; deltaLambdaDeg: number }): number {
  const iRad = AstroUnits.degToRad(args.tiltDeg);
  const dRad = AstroUnits.degToRad(args.deltaLambdaDeg);
  const betaRad = Math.asin(Math.sin(iRad) * Math.sin(dRad));
  return AstroUnits.radToDeg(betaRad);
}

function deltaLambdaFromBetaDeg(args: { tiltDeg: number; betaDeg: number }): number {
  const iRad = AstroUnits.degToRad(args.tiltDeg);
  const denom = Math.sin(iRad);
  if (Math.abs(denom) < 1e-12) return 180;

  const bRad = AstroUnits.degToRad(Math.abs(args.betaDeg));
  const x = Math.min(1, Math.max(0, Math.sin(bRad) / Math.abs(denom)));
  const dRad = Math.asin(x);
  return AstroUnits.radToDeg(dRad);
}

function shadowRadiiKmAtDistance(args: {
  bodyRadiusKm: number;
  sunRadiusKm: number;
  distanceToSunKm: number;
  distanceFromBodyKm: number;
}): { umbraRadiusKm: number; penumbraRadiusKm: number } {
  const D = args.distanceToSunKm;
  const x = args.distanceFromBodyKm;

  const umbraRadiusKm = args.bodyRadiusKm - (x * (args.sunRadiusKm - args.bodyRadiusKm)) / D;
  const penumbraRadiusKm = args.bodyRadiusKm + (x * (args.sunRadiusKm + args.bodyRadiusKm)) / D;
  return { umbraRadiusKm, penumbraRadiusKm };
}

function betaMaxDegFromImpactKm(args: { maxImpactKm: number; distanceKm: number }): number {
  if (!(args.maxImpactKm > 0) || !(args.distanceKm > 0)) return 0;
  const s = Math.min(1, args.maxImpactKm / args.distanceKm);
  return AstroUnits.radToDeg(Math.asin(s));
}

function eclipseThresholdsDeg(args: {
  earthMoonDistanceKm: number;
  earthRadiusKm?: number;
  moonRadiusKm?: number;
  sunRadiusKm?: number;
  auKm?: number;
}): {
  solarCentralDeg: number;
  solarPartialDeg: number;
  lunarTotalDeg: number;
  lunarUmbralDeg: number;
  lunarPenumbralDeg: number;
  _debug: {
    earthShadowAtMoon: { umbraRadiusKm: number; penumbraRadiusKm: number };
    moonShadowAtEarth: { umbraRadiusKm: number; penumbraRadiusKm: number };
  };
} {
  const D_EM = args.earthMoonDistanceKm;
  const earthRadiusKm = args.earthRadiusKm ?? 6371;
  const moonRadiusKm = args.moonRadiusKm ?? 1737.4;
  const sunRadiusKm = args.sunRadiusKm ?? 696000;
  const auKm = args.auKm ?? AstroConstants.LENGTH.KM_PER_AU;

  const earthShadowAtMoon = shadowRadiiKmAtDistance({
    bodyRadiusKm: earthRadiusKm,
    sunRadiusKm,
    distanceToSunKm: auKm,
    distanceFromBodyKm: D_EM
  });

  const bTotalLunarKm = Math.max(0, earthShadowAtMoon.umbraRadiusKm - moonRadiusKm);
  const bUmbralLunarKm = earthShadowAtMoon.umbraRadiusKm + moonRadiusKm;
  const bPenumbralLunarKm = earthShadowAtMoon.penumbraRadiusKm + moonRadiusKm;

  const lunarTotalDeg = betaMaxDegFromImpactKm({ maxImpactKm: bTotalLunarKm, distanceKm: D_EM });
  const lunarUmbralDeg = betaMaxDegFromImpactKm({ maxImpactKm: bUmbralLunarKm, distanceKm: D_EM });
  const lunarPenumbralDeg = betaMaxDegFromImpactKm({
    maxImpactKm: bPenumbralLunarKm,
    distanceKm: D_EM
  });

  const moonShadowAtEarth = shadowRadiiKmAtDistance({
    bodyRadiusKm: moonRadiusKm,
    sunRadiusKm,
    distanceToSunKm: auKm,
    distanceFromBodyKm: D_EM
  });

  const bSolarPartialKm = earthRadiusKm + moonShadowAtEarth.penumbraRadiusKm;
  const bSolarCentralKm = earthRadiusKm + Math.abs(moonShadowAtEarth.umbraRadiusKm);

  const solarPartialDeg = betaMaxDegFromImpactKm({ maxImpactKm: bSolarPartialKm, distanceKm: D_EM });
  const solarCentralDeg = betaMaxDegFromImpactKm({ maxImpactKm: bSolarCentralKm, distanceKm: D_EM });

  return {
    solarCentralDeg,
    solarPartialDeg,
    lunarTotalDeg,
    lunarUmbralDeg,
    lunarPenumbralDeg,
    _debug: {
      earthShadowAtMoon,
      moonShadowAtEarth
    }
  };
}

function lunarEclipseTypeFromBetaDeg(args: {
  betaDeg: number;
  earthMoonDistanceKm: number;
  earthRadiusKm?: number;
  moonRadiusKm?: number;
  sunRadiusKm?: number;
  auKm?: number;
}): { type: "none" | "penumbral-lunar" | "partial-lunar" | "total-lunar" } {
  const D_EM = args.earthMoonDistanceKm;
  const earthRadiusKm = args.earthRadiusKm ?? 6371;
  const moonRadiusKm = args.moonRadiusKm ?? 1737.4;
  const sunRadiusKm = args.sunRadiusKm ?? 696000;
  const auKm = args.auKm ?? AstroConstants.LENGTH.KM_PER_AU;

  const absBetaRad = Math.abs(AstroUnits.degToRad(args.betaDeg));
  const impactKm = D_EM * Math.sin(absBetaRad);

  const { umbraRadiusKm, penumbraRadiusKm } = shadowRadiiKmAtDistance({
    bodyRadiusKm: earthRadiusKm,
    sunRadiusKm,
    distanceToSunKm: auKm,
    distanceFromBodyKm: D_EM
  });

  const totalLimitKm = umbraRadiusKm - moonRadiusKm;
  const umbralLimitKm = umbraRadiusKm + moonRadiusKm;
  const penumbralLimitKm = penumbraRadiusKm + moonRadiusKm;

  if (totalLimitKm > 0 && impactKm <= totalLimitKm) return { type: "total-lunar" };
  if (impactKm <= umbralLimitKm) return { type: "partial-lunar" };
  if (impactKm <= penumbralLimitKm) return { type: "penumbral-lunar" };
  return { type: "none" };
}

function solarEclipseTypeFromBetaDeg(args: {
  betaDeg: number;
  earthMoonDistanceKm: number;
  earthRadiusKm?: number;
  moonRadiusKm?: number;
  sunRadiusKm?: number;
  auKm?: number;
}): { type: "none" | "partial-solar" | "annular-solar" | "total-solar" } {
  const D_EM = args.earthMoonDistanceKm;
  const earthRadiusKm = args.earthRadiusKm ?? 6371;
  const moonRadiusKm = args.moonRadiusKm ?? 1737.4;
  const sunRadiusKm = args.sunRadiusKm ?? 696000;
  const auKm = args.auKm ?? AstroConstants.LENGTH.KM_PER_AU;

  const absBetaRad = Math.abs(AstroUnits.degToRad(args.betaDeg));
  const impactKm = D_EM * Math.sin(absBetaRad);

  const { umbraRadiusKm, penumbraRadiusKm } = shadowRadiiKmAtDistance({
    bodyRadiusKm: moonRadiusKm,
    sunRadiusKm,
    distanceToSunKm: auKm,
    distanceFromBodyKm: D_EM
  });

  const partialLimitKm = earthRadiusKm + penumbraRadiusKm;
  const centralLimitKm = earthRadiusKm + Math.abs(umbraRadiusKm);

  if (impactKm <= centralLimitKm) {
    return { type: umbraRadiusKm > 0 ? "total-solar" : "annular-solar" };
  }
  if (impactKm <= partialLimitKm) return { type: "partial-solar" };
  return { type: "none" };
}

function isSarosRelated(args: { daysSeparation: number }): boolean {
  if (!Number.isFinite(args.daysSeparation)) return false;
  const absDays = Math.abs(args.daysSeparation);
  return Math.abs(absDays - SAROS_CYCLE_DAYS) <= CYCLE_TOLERANCE_DAYS;
}

function isExeligmosRelated(args: { daysSeparation: number }): boolean {
  if (!Number.isFinite(args.daysSeparation)) return false;
  const absDays = Math.abs(args.daysSeparation);
  return Math.abs(absDays - EXELIGMOS_CYCLE_DAYS) <= CYCLE_TOLERANCE_DAYS;
}

export const EclipseGeometryModel = {
  SAROS_CYCLE_DAYS,
  EXELIGMOS_CYCLE_DAYS,
  normalizeAngleDeg,
  angularSeparationDeg,
  phaseAngleDeg,
  eclipticLatitudeDeg,
  nearestNodeDistanceDeg,
  betaFromDeltaLambdaDeg,
  deltaLambdaFromBetaDeg,
  shadowRadiiKmAtDistance,
  eclipseThresholdsDeg,
  lunarEclipseTypeFromBetaDeg,
  solarEclipseTypeFromBetaDeg,
  isSarosRelated,
  isExeligmosRelated
} as const;

