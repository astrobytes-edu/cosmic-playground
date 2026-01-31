import { describe, expect, it } from "vitest";

import { EclipseGeometryModel } from "./eclipseGeometryModel";

describe("EclipseGeometryModel", () => {
  it("normalizes angles to [0, 360)", () => {
    expect(EclipseGeometryModel.normalizeAngleDeg(-10)).toBe(350);
  });

  it("computes smallest angular separation", () => {
    expect(EclipseGeometryModel.angularSeparationDeg(10, 350)).toBe(20);
  });

  it("returns 0° ecliptic latitude at the node longitude", () => {
    const tiltDeg = 5.145;
    const nodeLonDeg = 123;
    expect(
      EclipseGeometryModel.eclipticLatitudeDeg({
        tiltDeg,
        moonLonDeg: nodeLonDeg,
        nodeLonDeg
      })
    ).toBeCloseTo(0, 12);
  });

  it("has physically ordered thresholds", () => {
    const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
      earthMoonDistanceKm: 384400
    });

    expect(thresholds.solarCentralDeg).toBeLessThan(thresholds.solarPartialDeg);
    expect(thresholds.lunarTotalDeg).toBeLessThan(thresholds.lunarUmbralDeg);
    expect(thresholds.lunarUmbralDeg).toBeLessThan(thresholds.lunarPenumbralDeg);
  });

  it("matches golden solar thresholds at mean Earth–Moon distance (approx)", () => {
    const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
      earthMoonDistanceKm: 384400
    });

    expect(Math.abs(thresholds.solarPartialDeg - 1.476)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(thresholds.solarCentralDeg - 0.957)).toBeLessThanOrEqual(0.05);
  });

  it("switches central solar eclipse type with Earth–Moon distance", () => {
    const perigeeish = EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
      betaDeg: 0,
      earthMoonDistanceKm: 363300
    });
    expect(perigeeish.type).toBe("total-solar");

    const apogeeish = EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
      betaDeg: 0,
      earthMoonDistanceKm: 405500
    });
    expect(apogeeish.type).toBe("annular-solar");
  });
});

