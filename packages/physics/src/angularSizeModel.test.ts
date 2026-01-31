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

