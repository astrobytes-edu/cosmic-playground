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
});
