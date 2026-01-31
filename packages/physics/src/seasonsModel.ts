import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

const TROPICAL_YEAR_DAYS = AstroConstants.TIME.MEAN_TROPICAL_YEAR_DAYS;
export const PERIHELION_DAY_UNCERTAINTY = 2;

function effectiveObliquityDegrees(obliquityDeg: number): number {
  const t = Math.abs(obliquityDeg % 360);
  const folded = t > 180 ? 360 - t : t; // 0..180
  return folded > 90 ? 180 - folded : folded; // 0..90
}

function sunDeclinationDeg(args: {
  dayOfYear: number;
  axialTiltDeg: number;
  tropicalYearDays?: number;
  dayOfMarchEquinox?: number;
}): number {
  const tropicalYearDays = args.tropicalYearDays ?? TROPICAL_YEAR_DAYS;
  const dayOfMarchEquinox = args.dayOfMarchEquinox ?? 80;
  const eps = effectiveObliquityDegrees(args.axialTiltDeg);
  const L = (2 * Math.PI * (args.dayOfYear - dayOfMarchEquinox)) / tropicalYearDays;
  const deltaRad = Math.asin(Math.sin(AstroUnits.degToRad(eps)) * Math.sin(L));
  return AstroUnits.radToDeg(deltaRad);
}

function dayLengthHours(args: { latitudeDeg: number; sunDeclinationDeg: number }): number {
  const phi = AstroUnits.degToRad(args.latitudeDeg);
  const delta = AstroUnits.degToRad(args.sunDeclinationDeg);
  const cosH = -Math.tan(phi) * Math.tan(delta);
  if (cosH < -1) return 24;
  if (cosH > 1) return 0;
  const Hdeg = AstroUnits.radToDeg(Math.acos(cosH));
  return (2 * Hdeg) / 15;
}

function sunNoonAltitudeDeg(args: { latitudeDeg: number; sunDeclinationDeg: number }): number {
  return 90 - Math.abs(args.latitudeDeg - args.sunDeclinationDeg);
}

function earthSunDistanceAu(args: {
  dayOfYear: number;
  yearDays?: number;
  eccentricity?: number;
  perihelionDay?: number;
}): number {
  const yearDays = args.yearDays ?? TROPICAL_YEAR_DAYS;
  const eccentricity = args.eccentricity ?? 0.017;
  const perihelionDay = args.perihelionDay ?? 3;
  const daysFromPerihelion = args.dayOfYear - perihelionDay;
  const angle = (2 * Math.PI * daysFromPerihelion) / yearDays;
  return 1 - eccentricity * Math.cos(angle);
}

function orbitAngleRadFromDay(args: {
  dayOfYear: number;
  yearDays?: number;
  perihelionDay?: number;
}): number {
  const yearDays = args.yearDays ?? TROPICAL_YEAR_DAYS;
  const perihelionDay = args.perihelionDay ?? 3;
  const daysFromPerihelion = args.dayOfYear - perihelionDay;
  return (2 * Math.PI * daysFromPerihelion) / yearDays;
}

export const SeasonsModel = {
  PERIHELION_DAY_UNCERTAINTY,
  effectiveObliquityDegrees,
  sunDeclinationDeg,
  dayLengthHours,
  sunNoonAltitudeDeg,
  earthSunDistanceAu,
  orbitAngleRadFromDay
} as const;

