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

  it("returns 0 deg declination for 0 deg tilt at any day", () => {
    for (const day of [1, 80, 172, 266, 356]) {
      expect(
        SeasonsModel.sunDeclinationDeg({ dayOfYear: day, axialTiltDeg: 0 })
      ).toBeCloseTo(0, 10);
    }
  });

  it("returns 24h day length at north pole in northern summer", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 172, axialTiltDeg: 23.5 });
    const dayLen = SeasonsModel.dayLengthHours({ latitudeDeg: 90, sunDeclinationDeg: decl });
    expect(dayLen).toBe(24);
  });

  it("returns 0h day length at north pole in northern winter", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 356, axialTiltDeg: 23.5 });
    const dayLen = SeasonsModel.dayLengthHours({ latitudeDeg: 90, sunDeclinationDeg: decl });
    expect(dayLen).toBe(0);
  });

  it("day length is symmetric about equator at equinox", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 80, axialTiltDeg: 23.5 });
    const dayN = SeasonsModel.dayLengthHours({ latitudeDeg: 40, sunDeclinationDeg: decl });
    const dayS = SeasonsModel.dayLengthHours({ latitudeDeg: -40, sunDeclinationDeg: decl });
    expect(dayN).toBeCloseTo(dayS, 1);
  });

  it("noon altitude at equator on equinox is 90 deg", () => {
    const alt = SeasonsModel.sunNoonAltitudeDeg({ latitudeDeg: 0, sunDeclinationDeg: 0 });
    expect(alt).toBe(90);
  });

  it("noon altitude at latitude = declination is 90 deg (subsolar)", () => {
    const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: 172, axialTiltDeg: 23.5 });
    const alt = SeasonsModel.sunNoonAltitudeDeg({ latitudeDeg: decl, sunDeclinationDeg: decl });
    expect(alt).toBe(90);
  });

  it("earthSunDistanceAu is minimum at perihelion, maximum ~6 months later", () => {
    const rPeri = SeasonsModel.earthSunDistanceAu({ dayOfYear: 3 });
    const rAphe = SeasonsModel.earthSunDistanceAu({ dayOfYear: 186 });
    expect(rPeri).toBeLessThan(1);
    expect(rAphe).toBeGreaterThan(1);
    expect(rAphe).toBeGreaterThan(rPeri);
  });

  it("orbitAngleRadFromDay returns 0 at perihelion", () => {
    expect(SeasonsModel.orbitAngleRadFromDay({ dayOfYear: 3 })).toBeCloseTo(0, 10);
  });

  it("orbitAngleRadFromDay increases monotonically through the year", () => {
    let prev = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: 4 });
    for (let d = 5; d <= 365; d++) {
      const cur = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: d });
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });

  it("effectiveObliquityDegrees folds large tilt to 0-90 range", () => {
    expect(SeasonsModel.effectiveObliquityDegrees(0)).toBe(0);
    expect(SeasonsModel.effectiveObliquityDegrees(90)).toBe(90);
    expect(SeasonsModel.effectiveObliquityDegrees(180)).toBeCloseTo(0, 10);
    expect(SeasonsModel.effectiveObliquityDegrees(270)).toBeCloseTo(90, 10);
  });
});

