/**
 * DopplerShiftModel
 *
 * Physics helpers for kinematic Doppler shifts of light.
 *
 * Units policy:
 * - wavelength: nm
 * - frequency: THz
 * - velocity: km/s
 * - redshift z: dimensionless
 */

export type DopplerRegimeLabel =
  | "non-relativistic"
  | "mildly-relativistic"
  | "relativistic";

export interface ShiftLineInput {
  wavelengthNm: number;
  label: string;
  relativeIntensity?: number;
}

export interface ShiftLineResult {
  wavelengthNm: number;
  shiftedNm: number;
  shiftedFrequencyTHz: number;
  label: string;
  deltaLambdaNm: number;
  deltaFrequencyTHz: number;
  z: number;
  relativeIntensity?: number;
}

const C_KM_S = 299_792.458;
const C_M_S = 299_792_458;

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function relativisticFactorWavelength(beta: number): number {
  if (!Number.isFinite(beta) || Math.abs(beta) >= 1) return NaN;
  const numerator = 1 + beta;
  const denominator = 1 - beta;
  if (numerator <= 0 || denominator <= 0) return NaN;
  return Math.sqrt(numerator / denominator);
}

function relativisticFactorFrequency(beta: number): number {
  if (!Number.isFinite(beta) || Math.abs(beta) >= 1) return NaN;
  const numerator = 1 - beta;
  const denominator = 1 + beta;
  if (numerator <= 0 || denominator <= 0) return NaN;
  return Math.sqrt(numerator / denominator);
}

export const DopplerShiftModel = {
  C_KM_S,
  C_M_S,

  beta(velocityKmS: number): number {
    if (!Number.isFinite(velocityKmS)) return NaN;
    return velocityKmS / C_KM_S;
  },

  wavelengthNmToFrequencyTHz(lambdaNm: number): number {
    if (!isFinitePositive(lambdaNm)) return NaN;
    // c in nm*THz is 299_792.458.
    return C_KM_S / lambdaNm;
  },

  frequencyTHzToWavelengthNm(nuTHz: number): number {
    if (!isFinitePositive(nuTHz)) return NaN;
    return C_KM_S / nuTHz;
  },

  shiftedWavelengthNm(args: {
    lambdaRestNm: number;
    velocityKmS: number;
    relativistic?: boolean;
  }): number {
    const { lambdaRestNm, velocityKmS } = args;
    const relativistic = args.relativistic ?? false;
    if (!isFinitePositive(lambdaRestNm) || !Number.isFinite(velocityKmS)) return NaN;

    const b = DopplerShiftModel.beta(velocityKmS);

    if (relativistic) {
      const factor = relativisticFactorWavelength(b);
      if (!Number.isFinite(factor)) return NaN;
      return lambdaRestNm * factor;
    }

    const factor = 1 + b;
    if (factor <= 0 || !Number.isFinite(factor)) return NaN;
    return lambdaRestNm * factor;
  },

  shiftedFrequencyTHz(args: {
    nuRestTHz: number;
    velocityKmS: number;
    relativistic?: boolean;
  }): number {
    const { nuRestTHz, velocityKmS } = args;
    const relativistic = args.relativistic ?? false;
    if (!isFinitePositive(nuRestTHz) || !Number.isFinite(velocityKmS)) return NaN;

    const b = DopplerShiftModel.beta(velocityKmS);

    if (relativistic) {
      const factor = relativisticFactorFrequency(b);
      if (!Number.isFinite(factor)) return NaN;
      return nuRestTHz * factor;
    }

    const factor = 1 + b;
    if (factor <= 0 || !Number.isFinite(factor)) return NaN;
    return nuRestTHz / factor;
  },

  redshift(args: {
    lambdaRestNm: number;
    lambdaObsNm: number;
  }): number {
    const { lambdaRestNm, lambdaObsNm } = args;
    if (!isFinitePositive(lambdaRestNm) || !isFinitePositive(lambdaObsNm)) return NaN;
    return (lambdaObsNm - lambdaRestNm) / lambdaRestNm;
  },

  redshiftFromVelocity(args: {
    velocityKmS: number;
    relativistic?: boolean;
  }): number {
    const { velocityKmS } = args;
    const relativistic = args.relativistic ?? false;
    if (!Number.isFinite(velocityKmS)) return NaN;
    const b = DopplerShiftModel.beta(velocityKmS);

    if (relativistic) {
      const factor = relativisticFactorWavelength(b);
      if (!Number.isFinite(factor)) return NaN;
      return factor - 1;
    }

    return b;
  },

  velocityFromRedshift(args: {
    z: number;
    relativistic?: boolean;
  }): number {
    const { z } = args;
    const relativistic = args.relativistic ?? false;
    if (!Number.isFinite(z)) return NaN;

    if (!relativistic) {
      return z * C_KM_S;
    }

    if (z <= -1) return NaN;
    const onePlusZ = 1 + z;
    const squared = onePlusZ * onePlusZ;
    const b = (squared - 1) / (squared + 1);
    if (!Number.isFinite(b) || Math.abs(b) >= 1) return NaN;
    return b * C_KM_S;
  },

  shiftLines(args: {
    lines: ShiftLineInput[];
    velocityKmS: number;
    relativistic?: boolean;
  }): ShiftLineResult[] {
    const relativistic = args.relativistic ?? false;
    if (!Array.isArray(args.lines)) return [];

    return args.lines.map((line) => {
      const wavelengthNm = line.wavelengthNm;
      const shiftedNm = DopplerShiftModel.shiftedWavelengthNm({
        lambdaRestNm: wavelengthNm,
        velocityKmS: args.velocityKmS,
        relativistic,
      });

      const restFrequencyTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(wavelengthNm);
      const shiftedFrequencyTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(shiftedNm);
      const z = DopplerShiftModel.redshift({
        lambdaRestNm: wavelengthNm,
        lambdaObsNm: shiftedNm,
      });

      return {
        wavelengthNm,
        shiftedNm,
        shiftedFrequencyTHz,
        label: line.label,
        deltaLambdaNm: shiftedNm - wavelengthNm,
        deltaFrequencyTHz: shiftedFrequencyTHz - restFrequencyTHz,
        z,
        relativeIntensity: line.relativeIntensity,
      };
    });
  },

  formulaDivergencePercent(velocityKmS: number): number {
    if (!Number.isFinite(velocityKmS)) return NaN;
    const zNonRel = DopplerShiftModel.redshiftFromVelocity({
      velocityKmS,
      relativistic: false,
    });
    const zRel = DopplerShiftModel.redshiftFromVelocity({
      velocityKmS,
      relativistic: true,
    });

    if (!Number.isFinite(zNonRel) || !Number.isFinite(zRel)) return NaN;
    if (Math.abs(zRel) < 1e-12) return 0;
    return (Math.abs(zRel - zNonRel) / Math.abs(zRel)) * 100;
  },

  regime(velocityKmS: number): {
    label: DopplerRegimeLabel;
    divergencePercent: number;
  } {
    const divergencePercent = DopplerShiftModel.formulaDivergencePercent(velocityKmS);
    const absBeta = Math.abs(DopplerShiftModel.beta(velocityKmS));

    if (!Number.isFinite(absBeta)) {
      return { label: "non-relativistic", divergencePercent: NaN };
    }

    if (absBeta < 0.02) {
      return { label: "non-relativistic", divergencePercent };
    }
    if (absBeta < 0.1) {
      return { label: "mildly-relativistic", divergencePercent };
    }
    return { label: "relativistic", divergencePercent };
  },
} as const;
