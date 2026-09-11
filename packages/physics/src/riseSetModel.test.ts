import { describe, expect, test } from "vitest";
import {
  solarDeclinationDegFromDayOfYear,
  solarRiseSetLocalTimeHours,
  moonRiseSetLocalTimeHours
} from "./riseSetModel";

describe("riseSetModel", () => {
  test("declination is ~0 at equinox and ~+/-23.4 at solstices", () => {
    const spring = solarDeclinationDegFromDayOfYear(80);
    const summer = solarDeclinationDegFromDayOfYear(172);
    const fall = solarDeclinationDegFromDayOfYear(265);
    const winter = solarDeclinationDegFromDayOfYear(355);

    expect(Math.abs(spring)).toBeLessThan(2);
    expect(Math.abs(fall)).toBeLessThan(2);
    expect(summer).toBeGreaterThan(20);
    expect(summer).toBeLessThan(26);
    expect(winter).toBeLessThan(-20);
    expect(winter).toBeGreaterThan(-26);
  });

  test("equator has ~12h day length even at solstice", () => {
    const { dayLengthHours } = solarRiseSetLocalTimeHours({
      latitudeDeg: 0,
      dayOfYear: 172
    });
    expect(dayLengthHours).toBeGreaterThan(11.5);
    expect(dayLengthHours).toBeLessThan(12.5);
  });

  test("mid-latitude summer day length > 12h", () => {
    const { dayLengthHours } = solarRiseSetLocalTimeHours({
      latitudeDeg: 60,
      dayOfYear: 172
    });
    expect(dayLengthHours).toBeGreaterThan(14);
  });

  test("polar day/night detection", () => {
    const polarDay = solarRiseSetLocalTimeHours({
      latitudeDeg: 80,
      dayOfYear: 172
    });
    const polarNight = solarRiseSetLocalTimeHours({
      latitudeDeg: 80,
      dayOfYear: 355
    });

    expect(polarDay.status).toBe("polar-day");
    expect(polarDay.riseHour).toBe(null);
    expect(polarDay.setHour).toBe(null);

    expect(polarNight.status).toBe("polar-night");
    expect(polarNight.riseHour).toBe(null);
    expect(polarNight.setHour).toBe(null);
  });

  test("moon rise/set shifts from sun by phase angle", () => {
    const fullMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 0,
      latitudeDeg: 0,
      dayOfYear: 80,
      useAdvanced: true
    });
    const newMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 180,
      latitudeDeg: 0,
      dayOfYear: 80,
      useAdvanced: true
    });

    expect(fullMoon.riseHour).toBeCloseTo(18, 1);
    expect(fullMoon.setHour).toBeCloseTo(6, 1);
    expect(newMoon.riseHour).toBeCloseTo(6, 1);
    expect(newMoon.setHour).toBeCloseTo(18, 1);
  });

  /*
   * The Moon follows its OWN declination.
   *
   * These pin the defect fixed on 2026-09-10: the model used to compute the Sun's rise
   * and set for the given latitude and day and slide it by the phase, which handed the
   * Moon the Sun's declination. At full moon that is not merely imprecise, it is the
   * wrong sign -- the full Moon is opposite the Sun, so its declination is the negative
   * of the Sun's, and a midsummer full moon rides as low as the midwinter Sun.
   */
  test("the midsummer full moon rides low, not high", () => {
    // 45 N, June solstice. The Sun is up ~15.5 h; the full Moon sits at declination
    // -23.4 deg, so cos H0 = -tan(45) tan(-23.44) = 0.4337, H0 = 64.3 deg, and the Moon
    // is above the horizon for 2 x 64.3 / 15 = 8.57 h -- centred on midnight transit.
    const fullMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 0,
      latitudeDeg: 45,
      dayOfYear: 172,
      useAdvanced: true
    });

    expect(fullMoon.status).toBe("ok");
    expect(fullMoon.declinationDeg).toBeCloseTo(-23.4, 0);
    expect(fullMoon.dayLengthHours).toBeCloseTo(8.57, 1);
    expect(fullMoon.riseHour).toBeCloseTo(19.71, 1);
    expect(fullMoon.setHour).toBeCloseTo(4.29, 1);

    // The Sun that same day is up far longer. Borrowing its arc is what went wrong.
    const sun = solarRiseSetLocalTimeHours({ latitudeDeg: 45, dayOfYear: 172 });
    expect(sun.dayLengthHours).toBeGreaterThan(15);
  });

  test("the midwinter full moon rides high", () => {
    // Same latitude, December solstice: declination +23.4, so the full Moon is up longer
    // than the Sun -- the mirror of the summer case, and the reason it dominates the sky.
    const fullMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 0,
      latitudeDeg: 45,
      dayOfYear: 355,
      useAdvanced: true
    });

    expect(fullMoon.declinationDeg).toBeCloseTo(23.4, 0);
    expect(fullMoon.dayLengthHours).toBeCloseTo(15.4, 0);
  });

  test("a new moon shares the sun's declination", () => {
    // The one phase the old model got right, so it must stay right.
    const newMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 180,
      latitudeDeg: 45,
      dayOfYear: 172,
      useAdvanced: true
    });
    const sun = solarRiseSetLocalTimeHours({ latitudeDeg: 45, dayOfYear: 172 });

    expect(newMoon.declinationDeg).toBeCloseTo(sun.declinationDeg, 1);
    expect(newMoon.dayLengthHours).toBeCloseTo(sun.dayLengthHours ?? 0, 1);
  });

  test("a high-latitude midsummer full moon never rises", () => {
    // 70 N in June: cos H0 = -tan(70) tan(-23.44) = 1.19 > 1. The Sun is circumpolar
    // there and the full Moon is its opposite -- it stays below the horizon all night.
    const fullMoon = moonRiseSetLocalTimeHours({
      phaseAngleDeg: 0,
      latitudeDeg: 70,
      dayOfYear: 172,
      useAdvanced: true
    });
    const sun = solarRiseSetLocalTimeHours({ latitudeDeg: 70, dayOfYear: 172 });

    expect(fullMoon.status).toBe("polar-night");
    expect(sun.status).toBe("polar-day");
  });

  test("turning the advanced controls off reproduces the simple equatorial model", () => {
    // With useAdvanced false the exhibit shows the phase-only story: 12 hours up, full
    // moon rising at 6 PM. Latitude and day of year must not leak into that.
    for (const latitudeDeg of [0, 45, 70]) {
      const result = moonRiseSetLocalTimeHours({
        phaseAngleDeg: 0,
        latitudeDeg,
        dayOfYear: 172,
        useAdvanced: false
      });
      expect(result.riseHour).toBeCloseTo(18, 1);
      expect(result.setHour).toBeCloseTo(6, 1);
    }
  });
});

describe("moon rise/set at quarter phases", () => {
  // Full and new are the only phases where 180 - alpha and (alpha - 180) mod 360 agree, which
  // is why a waxing/waning swap passed every test above. Values worked by hand: at the March
  // equinox the Sun's longitude is 0, so the Moon's longitude is its elongation.
  test("first quarter at the March equinox rides high and transits at 18 h; third quarter mirrors it", () => {
    const fq = moonRiseSetLocalTimeHours({ phaseAngleDeg: 270, latitudeDeg: 45, dayOfYear: 80, useAdvanced: true });
    expect(fq.declinationDeg).toBeCloseTo(23.44, 1);
    expect(fq.dayLengthHours).toBeCloseTo(15.43, 1); // cos H0 = -tan 45 tan 23.44
    expect(fq.riseHour).toBeCloseTo(10.29, 1);
    expect(fq.setHour).toBeCloseTo(1.71, 1);
    const tq = moonRiseSetLocalTimeHours({ phaseAngleDeg: 90, latitudeDeg: 45, dayOfYear: 80, useAdvanced: true });
    expect(tq.declinationDeg).toBeCloseTo(-23.44, 1);
    expect(tq.riseHour).toBeCloseTo(1.71, 1);
  });

  test("at the equator every phase rises at (18 + alpha/15) mod 24", () => {
    for (let a = 0; a < 360; a += 15) {
      const r = moonRiseSetLocalTimeHours({ phaseAngleDeg: a, latitudeDeg: 0, dayOfYear: 80, useAdvanced: false });
      expect(r.riseHour).toBeCloseTo((18 + a / 15) % 24, 6);
    }
  });

  test("uses the exact declination, asin(sin eps sin lambda), not eps sin lambda", () => {
    const r = moonRiseSetLocalTimeHours({ phaseAngleDeg: 225, latitudeDeg: 0, dayOfYear: 80, useAdvanced: true });
    expect(r.declinationDeg).toBeCloseTo(16.34, 1); // the small-angle form gives 16.57
  });
});
