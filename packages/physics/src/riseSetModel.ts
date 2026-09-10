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

/**
 * The Moon's ecliptic longitude, and hence its declination.
 *
 * `solarDeclinationDegFromDayOfYear` is `eps * sin(lambda_sun)`, where the argument
 * `2*pi*(n - 80)/365` IS the Sun's ecliptic longitude measured from the vernal equinox.
 * The Moon sits at its own longitude, `lambda_sun + elongation`, so its declination
 * follows that instead -- taking ecliptic latitude as zero, which drops the Moon's 5.1
 * degree orbital tilt and is the same order of approximation as the solar sinusoid.
 *
 * The consequence is the whole point of the control: at FULL moon the elongation is 180
 * degrees, so `lambda_moon = lambda_sun + 180` and the Moon's declination is the NEGATIVE
 * of the Sun's. A full moon in northern summer therefore rides as low as the midwinter
 * Sun and is up for only a few hours -- which is exactly the observation the seasons and
 * moon-phases exhibits are trying to teach.
 */
export function moonDeclinationDeg(dayOfYear: number, elongationDeg: number): number {
  const n = clamp(dayOfYear, 1, 365);
  const lambdaSunDeg = (360 * (n - 80)) / 365;
  return SOLAR_OBLIQUITY_DEG * Math.sin(toRadians(lambdaSunDeg + elongationDeg));
}

/**
 * Local-solar-time rise and set for the Moon.
 *
 * This used to compute the SUN's rise and set for the given latitude and day, then slide
 * the result by the phase. That borrowed the Sun's declination for the Moon, so the
 * length of the Moon's arc above the horizon was wrong by the full seasonal swing, and
 * wrong in the worst possible direction: the model gave the midsummer full moon the
 * Sun's own sixteen-hour summer arc when the truth is about eight and a half. Measured
 * 2026-09-10 at 45 N on the June solstice, it read "Rises ~4 PM, Sets ~8 AM" against a
 * correct ~7:43 PM to ~4:17 AM. New moon was the one phase it got right, because there
 * the Moon and Sun share a longitude.
 *
 * Teaching model: circular orbits, zero ecliptic latitude, local solar time, no
 * refraction or parallax, and no lunar orbital tilt.
 */
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
  // Demo convention: phase angle 0 is full, 180 is new. Elongation is the Sun-Earth-Moon
  // angle, so it runs the other way -- 180 at full, 0 at new.
  const elongationDeg = 180 - phaseAngleDeg;
  const baseDay = useAdvanced ? dayOfYear : 80;
  const declinationDeg = moonDeclinationDeg(baseDay, elongationDeg);

  const phi = toRadians(useAdvanced ? latitudeDeg : 0);
  const delta = toRadians(declinationDeg);
  const cosH0 = -Math.tan(phi) * Math.tan(delta);

  // The Moon crosses the meridian one elongation later than the Sun does at local noon.
  const transitHour = 12 + elongationDeg / DEG_PER_HOUR;

  if (cosH0 <= -1) {
    return {
      riseHour: null,
      setHour: null,
      dayLengthHours: HOURS_PER_DAY,
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

  const h0Deg = (Math.acos(cosH0) * 180) / Math.PI;
  const hoursAboveHorizon = (2 * h0Deg) / DEG_PER_HOUR;

  return {
    riseHour: wrapHours(transitHour - hoursAboveHorizon / 2),
    setHour: wrapHours(transitHour + hoursAboveHorizon / 2),
    dayLengthHours: hoursAboveHorizon,
    status: "ok",
    declinationDeg
  };
}
