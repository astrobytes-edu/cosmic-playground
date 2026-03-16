import { describe, expect, it } from "vitest";

import {
  OBSERVER_AXIS_LIMITS,
  RADIUS_GUIDE_VALUES_RSUN,
  THEORIST_AXIS_LIMITS,
  applyHrLabPreset,
  clamp,
  cmdCoordinates,
  describeSelectedStarInference,
  getGuideRegions,
  getRadiusLinesVisible,
  hrCoordinates,
  linearTicks,
  logTicks,
  luminosityLsunFromRadiusTemperature,
  massColorHex,
  radiusRsunFromLuminosityTemperature,
  sanitizeNumericControl,
  selectBoundaryStar,
  selectNextStarByDirection
} from "./logic";

describe("HR Inference Lab logic", () => {
  it("clamps values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(20, 0, 10)).toBe(10);
  });

  it("maps hotter stars to the left in theorist mode", () => {
    const cool = hrCoordinates({ teffK: 3500, luminosityLsun: 1 });
    const hot = hrCoordinates({ teffK: 25000, luminosityLsun: 1 });
    expect(hot.xNorm).toBeLessThan(cool.xNorm);
  });

  it("maps brighter stars up in observer mode (inverted magnitude axis)", () => {
    const bright = cmdCoordinates({ bMinusV: 0.3, absoluteMv: -2 });
    const faint = cmdCoordinates({ bMinusV: 0.3, absoluteMv: 12 });
    expect(bright.yNorm).toBeGreaterThan(faint.yNorm);
  });

  it("supports SB forward/inverse consistency", () => {
    const l = luminosityLsunFromRadiusTemperature({
      radiusRsun: 2,
      teffK: 5772,
      tSunK: 5772
    });
    expect(l).toBeCloseTo(4, 12);

    const r = radiusRsunFromLuminosityTemperature({
      luminosityLsun: l,
      teffK: 5772,
      tSunK: 5772
    });
    expect(r).toBeCloseTo(2, 12);
  });

  it("provides expected axis domains", () => {
    expect(THEORIST_AXIS_LIMITS.teffMinK).toBe(2500);
    expect(THEORIST_AXIS_LIMITS.teffMaxK).toBe(50000);
    expect(OBSERVER_AXIS_LIMITS.mvBright).toBe(-10);
    expect(OBSERVER_AXIS_LIMITS.mvFaint).toBe(16);
  });

  it("provides log and linear tick helpers", () => {
    expect(logTicks(-2, 1)).toEqual([0.01, 0.1, 1, 10]);
    expect(linearTicks(-0.4, 0.4, 0.2)).toEqual([-0.4, -0.2, 0, 0.2, 0.4]);
  });

  it("keeps required radius guides", () => {
    expect(RADIUS_GUIDE_VALUES_RSUN).toEqual([0.01, 0.1, 1, 10, 100, 1000]);
  });

  it("maps mass to an hsl color", () => {
    const c = massColorHex(1);
    expect(c.startsWith("hsl(")).toBe(true);
  });

  it("selects nearest stars by directional arrow intent", () => {
    const points = [
      { starId: "center", x: 50, y: 50 },
      { starId: "right", x: 66, y: 51 },
      { starId: "left", x: 34, y: 49 },
      { starId: "up", x: 49, y: 34 },
      { starId: "down", x: 51, y: 67 }
    ];

    expect(selectNextStarByDirection({ points, currentStarId: "center", direction: "right" })).toBe("right");
    expect(selectNextStarByDirection({ points, currentStarId: "center", direction: "left" })).toBe("left");
    expect(selectNextStarByDirection({ points, currentStarId: "center", direction: "up" })).toBe("up");
    expect(selectNextStarByDirection({ points, currentStarId: "center", direction: "down" })).toBe("down");
  });

  it("keeps current selection when no candidate exists in that direction", () => {
    const points = [
      { starId: "a", x: 5, y: 10 },
      { starId: "b", x: 16, y: 10 },
      { starId: "c", x: 24, y: 11 }
    ];

    expect(selectNextStarByDirection({ points, currentStarId: "a", direction: "left" })).toBe("a");
    expect(selectNextStarByDirection({ points, currentStarId: "b", direction: "up" })).toBe("b");
  });

  it("supports Home and End boundary selection on the plot", () => {
    const points = [
      { starId: "mid", x: 40, y: 30 },
      { starId: "leftmost", x: 7, y: 90 },
      { starId: "rightmost", x: 92, y: 4 }
    ];

    expect(selectBoundaryStar({ points, boundary: "home" })).toBe("leftmost");
    expect(selectBoundaryStar({ points, boundary: "end" })).toBe("rightmost");
  });

  it("sanitizes blank or invalid numeric controls back to finite defaults", () => {
    expect(
      sanitizeNumericControl({
        rawValue: "",
        fallback: 140,
        min: 1,
        max: 10000
      })
    ).toBe(140);

    expect(
      sanitizeNumericControl({
        rawValue: "not-a-number",
        fallback: 0.03,
        min: 0,
        max: 0.5
      })
    ).toBe(0.03);
  });

  it("clamps sanitized numeric controls to the configured range", () => {
    expect(
      sanitizeNumericControl({
        rawValue: "20000",
        fallback: 140,
        min: 1,
        max: 10000
      })
    ).toBe(10000);

    expect(
      sanitizeNumericControl({
        rawValue: "-1",
        fallback: 0.02,
        min: 0.0001,
        max: 0.03
      })
    ).toBe(0.0001);
  });

  it("applies the requested classroom presets without changing seed-dependent state", () => {
    const young = applyHrLabPreset("young-cluster");
    expect(young).toEqual({
      modeCluster: true,
      clusterAgeGyr: 0.08,
      binaryFrac: 0.2,
      metallicityZ: 0.02
    });

    const solar = applyHrLabPreset("solar-like-reference");
    expect(solar).toEqual({
      modeCluster: true,
      clusterAgeGyr: 4.6,
      binaryFrac: 0.28,
      metallicityZ: 0.02,
      evolveMassMsun: 1
    });
  });

  it("describes guide regions for both plot modes", () => {
    const theorist = getGuideRegions("theorist");
    expect(theorist.map((region) => region.label)).toEqual([
      "Main sequence",
      "Giant branch",
      "White dwarf region"
    ]);

    const observer = getGuideRegions("observer");
    expect(observer).toHaveLength(3);
    expect(observer[0]?.hint.length).toBeGreaterThan(10);
  });

  it("keeps radius-line preference while hiding the overlay outside theorist mode", () => {
    expect(getRadiusLinesVisible({ plotMode: "theorist", showRadiusLinesPreference: true })).toBe(true);
    expect(getRadiusLinesVisible({ plotMode: "observer", showRadiusLinesPreference: true })).toBe(false);
    expect(getRadiusLinesVisible({ plotMode: "theorist", showRadiusLinesPreference: false })).toBe(false);
  });

  it("generates student-facing inference text for representative star locations", () => {
    expect(
      describeSelectedStarInference({
        stage: "ms",
        teffK: 14000,
        luminosityLsun: 0.02,
        radiusRsun: 0.03
      })
    ).toContain("small radius");

    expect(
      describeSelectedStarInference({
        stage: "giant",
        teffK: 3900,
        luminosityLsun: 400,
        radiusRsun: 30
      })
    ).toContain("large radius");

    expect(
      describeSelectedStarInference({
        stage: "white_dwarf",
        teffK: 18000,
        luminosityLsun: 0.01,
        radiusRsun: 0.02
      })
    ).toContain("white dwarfs");
  });
});
