import { describe, expect, it } from "vitest";

import { SeasonsModel } from "./seasonsModel";

describe("SeasonsModel", () => {
  it("returns 0° declination at March equinox anchor day (given formula)", () => {
    const axialTiltDeg = 23.5;
    const dayOfMarchEquinox = 80;

    expect(
      SeasonsModel.sunDeclinationDeg({
        dayOfYear: dayOfMarchEquinox,
        axialTiltDeg,
        dayOfMarchEquinox
      })
    ).toBe(0);
  });

  it("returns near +tilt at June solstice (approx)", () => {
    const axialTiltDeg = 23.5;
    const dayOfMarchEquinox = 80;
    const juneSolsticeDay = 172;

    const decl = SeasonsModel.sunDeclinationDeg({
      dayOfYear: juneSolsticeDay,
      axialTiltDeg,
      dayOfMarchEquinox
    });

    expect(Math.abs(decl - axialTiltDeg)).toBeLessThanOrEqual(0.5);
  });

  it("returns near -tilt at December solstice (approx)", () => {
    const axialTiltDeg = 23.5;
    const dayOfMarchEquinox = 80;
    const decSolsticeDay = 356;

    const decl = SeasonsModel.sunDeclinationDeg({
      dayOfYear: decSolsticeDay,
      axialTiltDeg,
      dayOfMarchEquinox
    });

    expect(Math.abs(decl + axialTiltDeg)).toBeLessThanOrEqual(0.5);
  });

  it("returns 12 hours day length at equator when declination is 0°", () => {
    expect(
      SeasonsModel.dayLengthHours({ latitudeDeg: 0, sunDeclinationDeg: 0 })
    ).toBeCloseTo(12, 12);
  });

  it("returns near perihelion distance at day 3 for e≈0.017", () => {
    const rAu = SeasonsModel.earthSunDistanceAu({
      dayOfYear: 3,
      eccentricity: 0.017,
      perihelionDay: 3
    });

    expect(Math.abs(rAu - 0.983)).toBeLessThanOrEqual(0.002);
  });
});

