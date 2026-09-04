import { linspace } from "@cosmic/math";

export type HydrostaticDensityModel = "uniform" | "central-toy";

export type HydrostaticRadialProfilePoint = {
  radiusCm: number;
  radiusFraction: number;
  densityGPerCm3: number;
  enclosedMassG: number;
  gravityCmPerS2: number;
  pressureDynePerCm2: number;
  pressureGradientDynePerCm3: number;
};

export type LocalShellPatchBalance = {
  radiusCm: number;
  radiusFraction: number;
  shellThicknessCm: number;
  patchAreaCm2: number;
  densityGPerCm3: number;
  gravityCmPerS2: number;
  pressureGradientRequiredDynePerCm3: number;
  pressureGradientAppliedDynePerCm3: number;
  pressureInnerDynePerCm2: number;
  pressureOuterDynePerCm2: number;
  pressureDifferenceDynePerCm2: number;
  pressureForceDifferenceDyne: number;
  gravitationalForceDyne: number;
  netForceDyne: number;
};

const HYDROSTATIC_CONSTANTS = {
  gravitationalConstantCgs: 6.67430e-8,
  boltzmannConstantErgPerK: 1.380649e-16,
  protonMassG: 1.67262192369e-24,
  solarMassG: 1.98847e33,
  solarRadiusCm: 6.957e10
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clampRadiusCm(radiusCm: number, totalRadiusCm: number): number {
  const safeRadiusCm = sanitizePositive(totalRadiusCm);
  return clamp(Number.isFinite(radiusCm) ? radiusCm : 0, 0, safeRadiusCm);
}

function meanDensityGPerCm3(args: { massG: number; radiusCm: number }): number {
  const { massG, radiusCm } = args;
  if (!(massG > 0) || !(radiusCm > 0)) return Number.NaN;
  return (3 * massG) / (4 * Math.PI * Math.pow(radiusCm, 3));
}

function centralPressureScaleDynePerCm2(args: { massG: number; radiusCm: number }): number {
  const { massG, radiusCm } = args;
  if (!(massG > 0) || !(radiusCm > 0)) return Number.NaN;
  return (
    (HYDROSTATIC_CONSTANTS.gravitationalConstantCgs * massG * massG) /
    Math.pow(radiusCm, 4)
  );
}

function coreTemperatureScaleK(args: {
  massG: number;
  radiusCm: number;
  meanMolecularWeightMu: number;
}): number {
  const { massG, radiusCm, meanMolecularWeightMu } = args;
  if (!(massG > 0) || !(radiusCm > 0) || !(meanMolecularWeightMu > 0)) {
    return Number.NaN;
  }
  return (
    (meanMolecularWeightMu *
      HYDROSTATIC_CONSTANTS.gravitationalConstantCgs *
      massG *
      HYDROSTATIC_CONSTANTS.protonMassG) /
    (HYDROSTATIC_CONSTANTS.boltzmannConstantErgPerK * radiusCm)
  );
}

function densityUniformGPerCm3(args: { massG: number; radiusCm: number }): number {
  return meanDensityGPerCm3(args);
}

function enclosedMassUniformG(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const radiusFraction = radiusCm / totalRadiusCm;
  return totalMassG * Math.pow(radiusFraction, 3);
}

function gravityFromEnclosedMassCmPerS2(args: {
  radiusCm: number;
  enclosedMassG: number;
}): number {
  const { radiusCm, enclosedMassG } = args;
  if (!(radiusCm > 0) || !(enclosedMassG >= 0)) return 0;
  return (
    (HYDROSTATIC_CONSTANTS.gravitationalConstantCgs * enclosedMassG) /
    (radiusCm * radiusCm)
  );
}

function pressureGradientUniformDynePerCm3(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const densityGPerCm3 = densityUniformGPerCm3({
    massG: totalMassG,
    radiusCm: totalRadiusCm
  });
  const enclosedMassG = enclosedMassUniformG({
    radiusCm,
    totalRadiusCm,
    totalMassG
  });
  const gravityCmPerS2 = gravityFromEnclosedMassCmPerS2({
    radiusCm,
    enclosedMassG
  });
  return -densityGPerCm3 * gravityCmPerS2;
}

function pressureProfileUniformDynePerCm2(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const radiusFraction = radiusCm / totalRadiusCm;
  return (
    (3 * HYDROSTATIC_CONSTANTS.gravitationalConstantCgs * totalMassG * totalMassG) /
    (8 * Math.PI * Math.pow(totalRadiusCm, 4)) *
    (1 - radiusFraction * radiusFraction)
  );
}

function centralToyDensityNormalizationGPerCm3(args: {
  massG: number;
  radiusCm: number;
}): number {
  const { massG, radiusCm } = args;
  if (!(massG > 0) || !(radiusCm > 0)) return Number.NaN;
  return (15 * massG) / (8 * Math.PI * Math.pow(radiusCm, 3));
}

function densityCentralToyGPerCm3(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const radiusFraction = radiusCm / totalRadiusCm;
  const rhoCentralGPerCm3 = centralToyDensityNormalizationGPerCm3({
    massG: totalMassG,
    radiusCm: totalRadiusCm
  });
  return rhoCentralGPerCm3 * Math.max(0, 1 - radiusFraction * radiusFraction);
}

function enclosedMassCentralToyG(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const x = radiusCm / totalRadiusCm;
  return 0.5 * totalMassG * (5 * Math.pow(x, 3) - 3 * Math.pow(x, 5));
}

function pressureGradientCentralToyDynePerCm3(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const densityGPerCm3 = densityCentralToyGPerCm3({
    radiusCm,
    totalRadiusCm,
    totalMassG
  });
  const enclosedMassG = enclosedMassCentralToyG({
    radiusCm,
    totalRadiusCm,
    totalMassG
  });
  const gravityCmPerS2 = gravityFromEnclosedMassCmPerS2({
    radiusCm,
    enclosedMassG
  });
  return -densityGPerCm3 * gravityCmPerS2;
}

function pressureProfileCentralToyDynePerCm2(args: {
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): number {
  const { totalRadiusCm, totalMassG } = args;
  if (!(totalRadiusCm > 0) || !(totalMassG > 0)) return Number.NaN;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const radiusFraction = radiusCm / totalRadiusCm;
  const rhoCentralGPerCm3 = centralToyDensityNormalizationGPerCm3({
    massG: totalMassG,
    radiusCm: totalRadiusCm
  });
  const polynomial =
    2 -
    5 * Math.pow(radiusFraction, 2) +
    4 * Math.pow(radiusFraction, 4) -
    Math.pow(radiusFraction, 6);
  return (
    (rhoCentralGPerCm3 *
      HYDROSTATIC_CONSTANTS.gravitationalConstantCgs *
      totalMassG) /
    (4 * totalRadiusCm) *
    polynomial
  );
}

function evaluateDensityModelAtRadius(args: {
  densityModel: HydrostaticDensityModel;
  radiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
}): HydrostaticRadialProfilePoint {
  const { densityModel, totalRadiusCm, totalMassG } = args;
  const radiusCm = clampRadiusCm(args.radiusCm, totalRadiusCm);
  const radiusFraction = totalRadiusCm > 0 ? radiusCm / totalRadiusCm : 0;

  if (densityModel === "central-toy") {
    const densityGPerCm3 = densityCentralToyGPerCm3({
      radiusCm,
      totalRadiusCm,
      totalMassG
    });
    const enclosedMassG = enclosedMassCentralToyG({
      radiusCm,
      totalRadiusCm,
      totalMassG
    });
    const gravityCmPerS2 = gravityFromEnclosedMassCmPerS2({
      radiusCm,
      enclosedMassG
    });
    const pressureGradientDynePerCm3 = -densityGPerCm3 * gravityCmPerS2;
    const pressureDynePerCm2 = pressureProfileCentralToyDynePerCm2({
      radiusCm,
      totalRadiusCm,
      totalMassG
    });

    return {
      radiusCm,
      radiusFraction,
      densityGPerCm3,
      enclosedMassG,
      gravityCmPerS2,
      pressureDynePerCm2,
      pressureGradientDynePerCm3
    };
  }

  const densityGPerCm3 = densityUniformGPerCm3({
    massG: totalMassG,
    radiusCm: totalRadiusCm
  });
  const enclosedMassG = enclosedMassUniformG({
    radiusCm,
    totalRadiusCm,
    totalMassG
  });
  const gravityCmPerS2 = gravityFromEnclosedMassCmPerS2({
    radiusCm,
    enclosedMassG
  });
  const pressureGradientDynePerCm3 = -densityGPerCm3 * gravityCmPerS2;
  const pressureDynePerCm2 = pressureProfileUniformDynePerCm2({
    radiusCm,
    totalRadiusCm,
    totalMassG
  });

  return {
    radiusCm,
    radiusFraction,
    densityGPerCm3,
    enclosedMassG,
    gravityCmPerS2,
    pressureDynePerCm2,
    pressureGradientDynePerCm3
  };
}

function sampleRadialProfile(args: {
  densityModel: HydrostaticDensityModel;
  totalMassG: number;
  totalRadiusCm: number;
  sampleCount?: number;
}): HydrostaticRadialProfilePoint[] {
  const { densityModel, totalMassG, totalRadiusCm } = args;
  const sampleCount = Math.max(2, Math.round(args.sampleCount ?? 160));
  if (!(totalMassG > 0) || !(totalRadiusCm > 0)) return [];

  return linspace(0, totalRadiusCm, sampleCount).map((radiusCm) =>
    evaluateDensityModelAtRadius({
      densityModel,
      radiusCm,
      totalRadiusCm,
      totalMassG
    })
  );
}

function localShellPatchBalance(args: {
  densityModel: HydrostaticDensityModel;
  shellRadiusCm: number;
  totalRadiusCm: number;
  totalMassG: number;
  shellThicknessCm: number;
  patchAreaCm2?: number;
  supportFactor?: number;
}): LocalShellPatchBalance {
  const { densityModel, totalRadiusCm, totalMassG } = args;
  const shellRadiusCm = clampRadiusCm(args.shellRadiusCm, totalRadiusCm);
  const shellThicknessCm = clamp(
    sanitizePositive(args.shellThicknessCm),
    totalRadiusCm * 1e-6,
    totalRadiusCm
  );
  const patchAreaCm2 = sanitizePositive(args.patchAreaCm2 ?? Number.NaN) || 1;
  const supportFactor = Number.isFinite(args.supportFactor ?? Number.NaN)
    ? (args.supportFactor ?? 1)
    : 1;

  const localPoint = evaluateDensityModelAtRadius({
    densityModel,
    radiusCm: shellRadiusCm,
    totalRadiusCm,
    totalMassG
  });
  const pressureGradientRequiredDynePerCm3 = localPoint.pressureGradientDynePerCm3;
  const pressureGradientAppliedDynePerCm3 =
    pressureGradientRequiredDynePerCm3 * supportFactor;
  const pressureDifferenceDynePerCm2 =
    -pressureGradientAppliedDynePerCm3 * shellThicknessCm;
  const pressureInnerDynePerCm2 =
    localPoint.pressureDynePerCm2 + 0.5 * pressureDifferenceDynePerCm2;
  const pressureOuterDynePerCm2 =
    Math.max(0, localPoint.pressureDynePerCm2 - 0.5 * pressureDifferenceDynePerCm2);
  const pressureForceDifferenceDyne =
    pressureDifferenceDynePerCm2 * patchAreaCm2;
  const gravitationalForceDyne =
    localPoint.densityGPerCm3 *
    localPoint.gravityCmPerS2 *
    shellThicknessCm *
    patchAreaCm2;
  const netForceDyne = pressureForceDifferenceDyne - gravitationalForceDyne;

  return {
    radiusCm: shellRadiusCm,
    radiusFraction: localPoint.radiusFraction,
    shellThicknessCm,
    patchAreaCm2,
    densityGPerCm3: localPoint.densityGPerCm3,
    gravityCmPerS2: localPoint.gravityCmPerS2,
    pressureGradientRequiredDynePerCm3,
    pressureGradientAppliedDynePerCm3,
    pressureInnerDynePerCm2,
    pressureOuterDynePerCm2,
    pressureDifferenceDynePerCm2,
    pressureForceDifferenceDyne,
    gravitationalForceDyne,
    netForceDyne
  };
}

function solarMassToG(solarMass: number): number {
  return solarMass * HYDROSTATIC_CONSTANTS.solarMassG;
}

function solarRadiusToCm(solarRadius: number): number {
  return solarRadius * HYDROSTATIC_CONSTANTS.solarRadiusCm;
}

function massGToSolarMass(massG: number): number {
  return massG / HYDROSTATIC_CONSTANTS.solarMassG;
}

function radiusCmToSolarRadius(radiusCm: number): number {
  return radiusCm / HYDROSTATIC_CONSTANTS.solarRadiusCm;
}

export const HydrostaticEquilibriumModel = {
  constants: HYDROSTATIC_CONSTANTS,
  meanDensityGPerCm3,
  centralPressureScaleDynePerCm2,
  coreTemperatureScaleK,
  densityUniformGPerCm3,
  enclosedMassUniformG,
  gravityFromEnclosedMassCmPerS2,
  pressureProfileUniformDynePerCm2,
  pressureGradientUniformDynePerCm3,
  densityCentralToyGPerCm3,
  enclosedMassCentralToyG,
  pressureProfileCentralToyDynePerCm2,
  pressureGradientCentralToyDynePerCm3,
  centralToyDensityNormalizationGPerCm3,
  evaluateDensityModelAtRadius,
  sampleRadialProfile,
  localShellPatchBalance,
  solarMassToG,
  solarRadiusToCm,
  massGToSolarMass,
  radiusCmToSolarRadius
} as const;
