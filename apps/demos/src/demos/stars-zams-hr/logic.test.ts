import { describe, expect, it } from "vitest";

import {
  OBSERVER_AXIS_LIMITS,
  RADIUS_GUIDE_VALUES_RSUN,
  THEORIST_AXIS_LIMITS,
  clamp,
  cmdCoordinates,
  hrCoordinates,
  linearTicks,
  logTicks,
  luminosityLsunFromRadiusTemperature,
  massColorHex,
  radiusRsunFromLuminosityTemperature
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
});
