import { AstroUnits } from "./units";

export type ResolutionStatus = "resolved" | "marginal" | "unresolved";

const RAYLEIGH_COEFFICIENT = 1.22;
const AO_STREHL_DEFAULT = 0.6;

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function besselJ1Approx(x: number): number {
  // Numerical Recipes-style approximation (sufficient for Airy PSF visualization).
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const ans1 =
      x *
      (72362614232.0 +
        y *
          (-7895059235.0 +
            y * (242396853.1 + y * (-2972611.439 + y * (15704.4826 + y * -30.16036606)))));
    const ans2 =
      144725228442.0 +
      y *
        (2300535178.0 +
          y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y * 1.0))));
    return ans1 / ans2;
  }

  const z = 8.0 / ax;
  const y = z * z;
  const xx = ax - 2.356194491; // 3*pi/4
  const ans1 =
    1.0 +
    y * (0.00183105 + y * (-0.00003516396496 + y * (0.000002457520174 + y * -0.000000240337019)));
  const ans2 =
    0.04687499995 +
    y *
      (-0.0002002690873 +
        y * (0.000008449199096 + y * (-0.00000088228987 + y * 0.000000105787412)));
  const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);
  return x < 0 ? -ans : ans;
}

function airyIntensityNormalizedFromX(x: number): number {
  if (!Number.isFinite(x) || x < 0) return 0;
  if (x === 0) return 1;
  const j1 = besselJ1Approx(x);
  const ratio = (2 * j1) / x;
  return ratio * ratio;
}

function airyIntensityNormalizedFromThetaRad(args: {
  thetaRad: number;
  wavelengthCm: number;
  apertureCm: number;
}): number {
  const { thetaRad, wavelengthCm, apertureCm } = args;
  if (!Number.isFinite(thetaRad) || thetaRad < 0) return 0;
  if (!(wavelengthCm > 0) || !(apertureCm > 0)) return 0;
  const x = (Math.PI * apertureCm * thetaRad) / wavelengthCm;
  return airyIntensityNormalizedFromX(x);
}

function diffractionLimitRadFromWavelengthCmAndApertureCm(
  wavelengthCm: number,
  apertureCm: number
): number {
  if (!(wavelengthCm > 0) || !(apertureCm > 0)) return Number.NaN;
  return RAYLEIGH_COEFFICIENT * (wavelengthCm / apertureCm);
}

function diffractionLimitArcsecFromWavelengthCmAndApertureCm(
  wavelengthCm: number,
  apertureCm: number
): number {
  const thetaRad = diffractionLimitRadFromWavelengthCmAndApertureCm(wavelengthCm, apertureCm);
  return AstroUnits.radToArcsec(thetaRad);
}

/**
 * The angular resolution actually delivered.
 *
 * Without AO the atmosphere sets the floor, so the answer is the larger of the
 * diffraction limit and the seeing disc.
 *
 * With AO the corrected point-spread function is a DIFFRACTION-WIDTH CORE sitting in a
 * seeing-width halo. The resolution is the core's width -- the diffraction limit -- and
 * the Strehl ratio is the fraction of the light that lands in it: Strehl sets contrast
 * and halo brightness, not width. `aoPsf` below returns that decomposition.
 *
 * This replaced `sqrt(theta_diff^2 + [seeing (1 - S)]^2)`, which made the reported AO
 * resolution almost independent of the telescope. Recomputed at 550 nm with 1.00 arcsec
 * seeing and S = 0.6, the old expression returned 0.400 arcsec for an 8 m (23x the
 * diffraction limit), 0.400 arcsec for a 10 m (29x) and 0.400 arcsec for a 39 m (113x) --
 * so a student sweeping the aperture with AO on saw the resolution refuse to improve,
 * which is the inverse of the lesson. Real AO on an 8 m delivers a ~0.017 arcsec core.
 */
function effectiveResolutionArcsec(args: {
  diffractionLimitArcsec: number;
  seeingArcsec: number;
  aoEnabled: boolean;
  aoStrehl?: number;
}): number {
  const { diffractionLimitArcsec, seeingArcsec, aoEnabled } = args;
  if (!Number.isFinite(diffractionLimitArcsec) || diffractionLimitArcsec <= 0) return Number.NaN;
  if (!Number.isFinite(seeingArcsec) || seeingArcsec <= 0) return diffractionLimitArcsec;

  if (aoEnabled) return diffractionLimitArcsec;
  return Math.max(diffractionLimitArcsec, seeingArcsec);
}

export interface AoPsf {
  /** Width of the corrected core: the diffraction limit [arcsec]. */
  coreArcsec: number;
  /** Width of the uncorrected halo around it: the seeing disc [arcsec]. */
  haloArcsec: number;
  /** Fraction of the light in the core. This is the Strehl ratio. */
  coreEnergyFraction: number;
  /** Fraction left in the halo, 1 - Strehl. */
  haloEnergyFraction: number;
}

/**
 * The two components of an AO-corrected point-spread function, so a drawing can show the
 * core inside the halo and a readout can report the Strehl ratio as what it is.
 */
function aoPsf(args: {
  diffractionLimitArcsec: number;
  seeingArcsec: number;
  aoStrehl?: number;
}): AoPsf {
  const { diffractionLimitArcsec, seeingArcsec } = args;
  const strehl = clamp01(args.aoStrehl ?? AO_STREHL_DEFAULT);
  return {
    coreArcsec: diffractionLimitArcsec,
    haloArcsec: Math.max(diffractionLimitArcsec, seeingArcsec),
    coreEnergyFraction: strehl,
    haloEnergyFraction: 1 - strehl
  };
}

function resolutionStatusFromSeparationArcsec(args: {
  separationArcsec: number;
  effectiveResolutionArcsec: number;
  marginalThresholdRatio?: number;
}): ResolutionStatus {
  const { separationArcsec, effectiveResolutionArcsec } = args;
  if (!(separationArcsec > 0) || !(effectiveResolutionArcsec > 0)) return "unresolved";

  const ratio = separationArcsec / effectiveResolutionArcsec;
  const marginalRatio = clamp01(args.marginalThresholdRatio ?? 0.8);

  if (ratio >= 1) return "resolved";
  if (ratio >= marginalRatio) return "marginal";
  return "unresolved";
}

export const TelescopeResolutionModel = {
  RAYLEIGH_COEFFICIENT,
  AO_STREHL_DEFAULT,
  besselJ1Approx,
  airyIntensityNormalizedFromX,
  airyIntensityNormalizedFromThetaRad,
  diffractionLimitRadFromWavelengthCmAndApertureCm,
  diffractionLimitArcsecFromWavelengthCmAndApertureCm,
  effectiveResolutionArcsec,
  aoPsf,
  resolutionStatusFromSeparationArcsec
} as const;
