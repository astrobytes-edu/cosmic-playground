import { describe, expect, it } from "vitest";

import { AngularSizeModel } from "./angularSizeModel";

describe("AngularSizeModel", () => {
  it("returns 0 degrees for non-positive diameter", () => {
    expect(AngularSizeModel.angularDiameterDeg({ diameterKm: 0, distanceKm: 10 })).toBe(0);
  });

  it("returns 180 degrees for non-positive distance", () => {
    expect(AngularSizeModel.angularDiameterDeg({ diameterKm: 10, distanceKm: 0 })).toBe(180);
  });

  it("matches Sun at 1 AU (~0.53313°)", () => {
    const theta = AngularSizeModel.angularDiameterDeg({
      diameterKm: AngularSizeModel.presets.sun.diameter,
      distanceKm: AngularSizeModel.presets.sun.distance
    });

    expect(Math.abs(theta - 0.53313)).toBeLessThanOrEqual(0.005);
  });

  it("matches Moon today (~0.51780°)", () => {
    const theta = AngularSizeModel.angularDiameterDeg({
      diameterKm: AngularSizeModel.presets.moon.diameter,
      distanceKm: AngularSizeModel.presets.moon.distance
    });

    expect(Math.abs(theta - 0.5178)).toBeLessThanOrEqual(0.01);
  });

  it("inverts angular diameter (sanity)", () => {
    const diameterKm = 1000;
    const thetaDeg = 0.5;

    const distanceKm = AngularSizeModel.distanceForAngularDiameterDeg({
      diameterKm,
      angularDiameterDeg: thetaDeg
    });

    const backThetaDeg = AngularSizeModel.angularDiameterDeg({ diameterKm, distanceKm });
    expect(Math.abs(backThetaDeg - thetaDeg)).toBeLessThan(1e-10);
  });

  it("converts recession cm/yr to km/Myr correctly", () => {
    expect(
      AngularSizeModel.moonDistanceKmFromRecession({
        distanceTodayKm: 384400,
        recessionCmPerYr: 1,
        timeMyr: 1
      })
    ).toBe(384410);
  });

  it("includes required presets and metadata", () => {
    expect(AngularSizeModel.presets.sun.category).toBe("astronomical");
    expect(AngularSizeModel.presets.basketball.category).toBe("everyday");
    expect(AngularSizeModel.presets.moon.timeEvolution).toBe(true);
  });
});

describe("Moon orbit model", () => {
  it("perigee distance is less than apogee", () => {
    const { perigeeKm, apogeeKm } = AngularSizeModel.moonOrbitPeigeeApogeeKm();
    expect(perigeeKm).toBeLessThan(apogeeKm);
    expect(perigeeKm).toBeGreaterThan(350000);
    expect(apogeeKm).toBeLessThan(420000);
  });

  it("orbit angle 0 deg returns perigee distance", () => {
    const { perigeeKm } = AngularSizeModel.moonOrbitPeigeeApogeeKm();
    const d = AngularSizeModel.moonDistanceAtOrbitAngleDeg(0);
    expect(Math.abs(d - perigeeKm)).toBeLessThan(1);
  });

  it("orbit angle 180 deg returns apogee distance", () => {
    const { apogeeKm } = AngularSizeModel.moonOrbitPeigeeApogeeKm();
    const d = AngularSizeModel.moonDistanceAtOrbitAngleDeg(180);
    expect(Math.abs(d - apogeeKm)).toBeLessThan(1);
  });

  it("round-trips angle -> distance -> angle", () => {
    for (const angle of [0, 45, 90, 135, 180]) {
      const d = AngularSizeModel.moonDistanceAtOrbitAngleDeg(angle);
      const back = AngularSizeModel.orbitAngleDegFromMoonDistance(d);
      expect(Math.abs(back - angle)).toBeLessThan(0.01);
    }
  });

  it("moonTimeMyrFromDistanceKm returns 0 for today's distance", () => {
    const t = AngularSizeModel.moonTimeMyrFromDistanceKm(384400);
    expect(Math.abs(t)).toBeLessThan(0.01);
  });

  it("moonTimeMyrFromDistanceKm is consistent with moonDistanceKmFromRecession", () => {
    const timeMyr = 500;
    const d = AngularSizeModel.moonDistanceKmFromRecession({
      distanceTodayKm: 384400,
      recessionCmPerYr: 3.8,
      timeMyr
    });
    const backTime = AngularSizeModel.moonTimeMyrFromDistanceKm(d);
    expect(Math.abs(backTime - timeMyr)).toBeLessThan(0.1);
  });
});

