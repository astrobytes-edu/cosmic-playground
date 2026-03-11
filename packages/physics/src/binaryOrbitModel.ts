import { AstroUnits } from "./units";
import { TwoBodyAnalytic } from "./twoBodyAnalytic";
import { AstroConstants } from "./astroConstants";

export interface BinaryOrbitInputs {
  primaryMassSolar: number;
  secondaryMassSolar: number;
  separationAu: number;
  inclinationDeg: number;
}

export interface BinaryOrbitState {
  primaryMassSolar: number;
  secondaryMassSolar: number;
  totalMassSolar: number;
  separationAu: number;
  inclinationDeg: number;
  periodYr: number;
  omegaRadPerYr: number;
  a1Au: number;
  a2Au: number;
  v1AuPerYr: number;
  v2AuPerYr: number;
  p1SolarAuPerYr: number;
  p2SolarAuPerYr: number;
  k1AuPerYr: number;
  k2AuPerYr: number;
  k1KmPerS: number;
  k2KmPerS: number;
  kinetic1SolarAu2PerYr2: number;
  kinetic2SolarAu2PerYr2: number;
  kineticTotalSolarAu2PerYr2: number;
  potentialSolarAu2PerYr2: number;
  totalEnergySolarAu2PerYr2: number;
  virialResidualSolarAu2PerYr2: number;
}

export interface BinaryRadialVelocitySample {
  phaseRad: number;
  rv1AuPerYr: number;
  rv2AuPerYr: number;
  rv1KmPerS: number;
  rv2KmPerS: number;
}

export interface BinaryRvMassRatioInferenceInput {
  k1KmPerS: number;
  k2KmPerS: number;
}

export interface BinaryRvMassRatioInferenceResult {
  massRatioEstimate: number;
  valid: boolean;
  reason?: string;
}

export interface BinaryMassFunctionInput {
  k1KmPerS: number;
  periodYr: number;
}

export interface BinaryMinimumMassesInput {
  k1KmPerS: number;
  k2KmPerS: number;
  periodYr: number;
}

export interface BinaryMinimumMassesResult {
  primaryMinimumMassSolar: number;
  secondaryMinimumMassSolar: number;
}

export interface BinaryEnergyBreakdown {
  kinetic1SolarAu2PerYr2: number;
  kinetic2SolarAu2PerYr2: number;
  kineticTotalSolarAu2PerYr2: number;
  potentialMagnitudeSolarAu2PerYr2: number;
  totalEnergySolarAu2PerYr2: number;
  maxMagnitudeSolarAu2PerYr2: number;
  normalized: {
    kinetic1: number;
    kinetic2: number;
    kineticTotal: number;
    potentialMagnitude: number;
    totalEnergySigned: number;
  };
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function emptyState(args: BinaryOrbitInputs): BinaryOrbitState {
  return {
    primaryMassSolar: args.primaryMassSolar,
    secondaryMassSolar: args.secondaryMassSolar,
    totalMassSolar: Number.NaN,
    separationAu: args.separationAu,
    inclinationDeg: args.inclinationDeg,
    periodYr: Number.NaN,
    omegaRadPerYr: Number.NaN,
    a1Au: Number.NaN,
    a2Au: Number.NaN,
    v1AuPerYr: Number.NaN,
    v2AuPerYr: Number.NaN,
    p1SolarAuPerYr: Number.NaN,
    p2SolarAuPerYr: Number.NaN,
    k1AuPerYr: Number.NaN,
    k2AuPerYr: Number.NaN,
    k1KmPerS: Number.NaN,
    k2KmPerS: Number.NaN,
    kinetic1SolarAu2PerYr2: Number.NaN,
    kinetic2SolarAu2PerYr2: Number.NaN,
    kineticTotalSolarAu2PerYr2: Number.NaN,
    potentialSolarAu2PerYr2: Number.NaN,
    totalEnergySolarAu2PerYr2: Number.NaN,
    virialResidualSolarAu2PerYr2: Number.NaN,
  };
}

function radialVelocityAtPhase(args: {
  state: BinaryOrbitState;
  phaseRad: number;
}): BinaryRadialVelocitySample {
  const { state, phaseRad } = args;
  const sinPhase = Math.sin(phaseRad);
  const rv1AuPerYr = state.k1AuPerYr * sinPhase;
  const rv2AuPerYr = -state.k2AuPerYr * sinPhase;

  return {
    phaseRad,
    rv1AuPerYr,
    rv2AuPerYr,
    rv1KmPerS: AstroUnits.auPerYrToKmPerS(rv1AuPerYr),
    rv2KmPerS: AstroUnits.auPerYrToKmPerS(rv2AuPerYr),
  };
}

function sampleRadialVelocityCurve(args: {
  state: BinaryOrbitState;
  sampleCount?: number;
  phaseOffsetRad?: number;
}): BinaryRadialVelocitySample[] {
  const sampleCount = Math.max(24, Math.round(args.sampleCount ?? 180));
  const phaseOffsetRad = args.phaseOffsetRad ?? 0;
  const samples: BinaryRadialVelocitySample[] = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const phaseRad = (i / sampleCount) * (2 * Math.PI);
    samples.push(radialVelocityAtPhase({
      state: args.state,
      phaseRad: phaseRad + phaseOffsetRad,
    }));
  }

  return samples;
}

function circularState(inputs: BinaryOrbitInputs): BinaryOrbitState {
  if (
    !isFinitePositive(inputs.primaryMassSolar)
    || !isFinitePositive(inputs.secondaryMassSolar)
    || !isFinitePositive(inputs.separationAu)
  ) {
    return emptyState(inputs);
  }

  const inclinationDeg = clamp(inputs.inclinationDeg, 0, 90);
  const inclinationRad = (inclinationDeg * Math.PI) / 180;

  const m1 = inputs.primaryMassSolar;
  const m2 = inputs.secondaryMassSolar;
  const totalMassSolar = m1 + m2;
  if (!isFinitePositive(totalMassSolar)) return emptyState(inputs);

  const periodYr = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({
    aAu: inputs.separationAu,
    massSolar: totalMassSolar,
  });

  if (!isFinitePositive(periodYr)) return emptyState(inputs);

  const omegaRadPerYr = (2 * Math.PI) / periodYr;
  const a1Au = inputs.separationAu * (m2 / totalMassSolar);
  const a2Au = inputs.separationAu * (m1 / totalMassSolar);
  const v1AuPerYr = omegaRadPerYr * a1Au;
  const v2AuPerYr = omegaRadPerYr * a2Au;

  const p1SolarAuPerYr = m1 * v1AuPerYr;
  const p2SolarAuPerYr = m2 * v2AuPerYr;

  const sinI = Math.sin(inclinationRad);
  const k1AuPerYr = v1AuPerYr * sinI;
  const k2AuPerYr = v2AuPerYr * sinI;
  const kinetic1SolarAu2PerYr2 = 0.5 * m1 * v1AuPerYr * v1AuPerYr;
  const kinetic2SolarAu2PerYr2 = 0.5 * m2 * v2AuPerYr * v2AuPerYr;
  const kineticTotalSolarAu2PerYr2 = kinetic1SolarAu2PerYr2 + kinetic2SolarAu2PerYr2;
  const potentialSolarAu2PerYr2 =
    -(AstroConstants.GRAV.G_AU3_YR2_PER_SOLAR_MASS * m1 * m2) / inputs.separationAu;
  const totalEnergySolarAu2PerYr2 = kineticTotalSolarAu2PerYr2 + potentialSolarAu2PerYr2;
  const virialResidualSolarAu2PerYr2 = 2 * kineticTotalSolarAu2PerYr2 + potentialSolarAu2PerYr2;

  return {
    primaryMassSolar: m1,
    secondaryMassSolar: m2,
    totalMassSolar,
    separationAu: inputs.separationAu,
    inclinationDeg,
    periodYr,
    omegaRadPerYr,
    a1Au,
    a2Au,
    v1AuPerYr,
    v2AuPerYr,
    p1SolarAuPerYr,
    p2SolarAuPerYr,
    k1AuPerYr,
    k2AuPerYr,
    k1KmPerS: AstroUnits.auPerYrToKmPerS(k1AuPerYr),
    k2KmPerS: AstroUnits.auPerYrToKmPerS(k2AuPerYr),
    kinetic1SolarAu2PerYr2,
    kinetic2SolarAu2PerYr2,
    kineticTotalSolarAu2PerYr2,
    potentialSolarAu2PerYr2,
    totalEnergySolarAu2PerYr2,
    virialResidualSolarAu2PerYr2,
  };
}

function inferMassRatioFromRvAmplitudes(
  input: BinaryRvMassRatioInferenceInput,
): BinaryRvMassRatioInferenceResult {
  if (!isFinitePositive(input.k1KmPerS) || !isFinitePositive(input.k2KmPerS)) {
    return {
      massRatioEstimate: Number.NaN,
      valid: false,
      reason: "RV amplitudes must be finite and greater than zero.",
    };
  }

  const massRatioEstimate = input.k1KmPerS / input.k2KmPerS;
  if (!isFinitePositive(massRatioEstimate)) {
    return {
      massRatioEstimate: Number.NaN,
      valid: false,
      reason: "Could not infer a finite mass ratio from amplitudes.",
    };
  }

  return {
    massRatioEstimate,
    valid: true,
  };
}

function massFunctionSolar(
  input: BinaryMassFunctionInput,
): number {
  if (!isFinitePositive(input.k1KmPerS) || !isFinitePositive(input.periodYr)) return Number.NaN;

  const k1AuPerYr = AstroUnits.kmPerSToAuPerYr(input.k1KmPerS);
  return (
    input.periodYr
    * Math.pow(k1AuPerYr, 3)
  ) / (2 * Math.PI * AstroConstants.GRAV.G_AU3_YR2_PER_SOLAR_MASS);
}

function minimumMassesSolar(
  input: BinaryMinimumMassesInput,
): BinaryMinimumMassesResult {
  if (
    !isFinitePositive(input.k1KmPerS)
    || !isFinitePositive(input.k2KmPerS)
    || !isFinitePositive(input.periodYr)
  ) {
    return {
      primaryMinimumMassSolar: Number.NaN,
      secondaryMinimumMassSolar: Number.NaN,
    };
  }

  const k1AuPerYr = AstroUnits.kmPerSToAuPerYr(input.k1KmPerS);
  const k2AuPerYr = AstroUnits.kmPerSToAuPerYr(input.k2KmPerS);
  const velocitySumAuPerYr = k1AuPerYr + k2AuPerYr;
  const denominator = 2 * Math.PI * AstroConstants.GRAV.G_AU3_YR2_PER_SOLAR_MASS;

  return {
    primaryMinimumMassSolar:
      (input.periodYr * velocitySumAuPerYr * velocitySumAuPerYr * k2AuPerYr) / denominator,
    secondaryMinimumMassSolar:
      (input.periodYr * velocitySumAuPerYr * velocitySumAuPerYr * k1AuPerYr) / denominator,
  };
}

function energyBreakdownForState(state: BinaryOrbitState): BinaryEnergyBreakdown {
  const potentialMagnitudeSolarAu2PerYr2 = Math.abs(state.potentialSolarAu2PerYr2);
  const maxMagnitudeSolarAu2PerYr2 = Math.max(
    1e-12,
    Math.abs(state.kinetic1SolarAu2PerYr2),
    Math.abs(state.kinetic2SolarAu2PerYr2),
    Math.abs(state.kineticTotalSolarAu2PerYr2),
    potentialMagnitudeSolarAu2PerYr2,
    Math.abs(state.totalEnergySolarAu2PerYr2),
  );

  return {
    kinetic1SolarAu2PerYr2: state.kinetic1SolarAu2PerYr2,
    kinetic2SolarAu2PerYr2: state.kinetic2SolarAu2PerYr2,
    kineticTotalSolarAu2PerYr2: state.kineticTotalSolarAu2PerYr2,
    potentialMagnitudeSolarAu2PerYr2,
    totalEnergySolarAu2PerYr2: state.totalEnergySolarAu2PerYr2,
    maxMagnitudeSolarAu2PerYr2,
    normalized: {
      kinetic1: state.kinetic1SolarAu2PerYr2 / maxMagnitudeSolarAu2PerYr2,
      kinetic2: state.kinetic2SolarAu2PerYr2 / maxMagnitudeSolarAu2PerYr2,
      kineticTotal: state.kineticTotalSolarAu2PerYr2 / maxMagnitudeSolarAu2PerYr2,
      potentialMagnitude: potentialMagnitudeSolarAu2PerYr2 / maxMagnitudeSolarAu2PerYr2,
      totalEnergySigned: state.totalEnergySolarAu2PerYr2 / maxMagnitudeSolarAu2PerYr2,
    },
  };
}

export const BinaryOrbitModel = {
  circularState,
  radialVelocityAtPhase,
  sampleRadialVelocityCurve,
  inferMassRatioFromRvAmplitudes,
  massFunctionSolar,
  minimumMassesSolar,
  energyBreakdownForState,
};
