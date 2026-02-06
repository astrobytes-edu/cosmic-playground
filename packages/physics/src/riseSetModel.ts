import { clamp } from "@cosmic/math";

const SOLAR_OBLIQUITY_DEG = 23.44;
const HOURS_PER_DAY = 24;
const DEG_PER_HOUR = 15;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function wrapHours(hours: number): number {
  const wrapped = hours % HOURS_PER_DAY;
  return wrapped < 0 ? wrapped + HOURS_PER_DAY : wrapped;
}

export type RiseSetStatus = "ok" | "polar-day" | "polar-night";

export type RiseSetResult = {
  riseHour: number | null;
  setHour: number | null;
  dayLengthHours: number | null;
  status: RiseSetStatus;
  declinationDeg: number;
};

export function solarDeclinationDegFromDayOfYear(dayOfYear: number): number {
  const n = clamp(dayOfYear, 1, 365);
  const gamma = (2 * Math.PI * (n - 80)) / 365;
  return SOLAR_OBLIQUITY_DEG * Math.sin(gamma);
}

export function solarRiseSetLocalTimeHours({
  latitudeDeg,
  dayOfYear
}: {
  latitudeDeg: number;
  dayOfYear: number;
}): RiseSetResult {
  const declinationDeg = solarDeclinationDegFromDayOfYear(dayOfYear);
  const phi = toRadians(latitudeDeg);
  const delta = toRadians(declinationDeg);
  const cosH0 = -Math.tan(phi) * Math.tan(delta);

  if (cosH0 <= -1) {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: 24,
      status: "polar-day",
      declinationDeg
    };
  }

  if (cosH0 >= 1) {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: 0,
      status: "polar-night",
      declinationDeg
    };
  }

  const h0 = Math.acos(cosH0);
  const dayLengthHours = (2 * (h0 * 180)) / (Math.PI * DEG_PER_HOUR);
  const sunRise = 12 - dayLengthHours / 2;
  const sunSet = 12 + dayLengthHours / 2;

  return {
    riseHour: wrapHours(sunRise),
    setHour: wrapHours(sunSet),
    dayLengthHours,
    status: "ok",
    declinationDeg
  };
}

export function moonRiseSetLocalTimeHours({
  phaseAngleDeg,
  latitudeDeg,
  dayOfYear,
  useAdvanced
}: {
  phaseAngleDeg: number;
  latitudeDeg: number;
  dayOfYear: number;
  useAdvanced: boolean;
}): RiseSetResult {
  // Teaching model: declination uses a simple seasonal sinusoid, rise/set is local solar time,
  // and we do not include orbital tilt, refraction, or parallax.
  const baseDay = useAdvanced ? dayOfYear : 80;
  const sun = solarRiseSetLocalTimeHours({ latitudeDeg, dayOfYear: baseDay });
  if (sun.status !== "ok") {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: sun.dayLengthHours,
      status: sun.status,
      declinationDeg: sun.declinationDeg
    };
  }

  const shiftHours = ((phaseAngleDeg - 180) / 360) * HOURS_PER_DAY;
  return {
    riseHour: wrapHours((sun.riseHour ?? 0) + shiftHours),
    setHour: wrapHours((sun.setHour ?? 0) + shiftHours),
    dayLengthHours: sun.dayLengthHours,
    status: sun.status,
    declinationDeg: sun.declinationDeg
  };
}
