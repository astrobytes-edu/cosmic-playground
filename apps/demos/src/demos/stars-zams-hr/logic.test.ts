import { describe, expect, it } from "vitest";

import {
  clamp,
  formatMetallicity,
  formatNumber,
  hrDiagramCoordinates,
  logSliderToValue,
  valueToLogSlider,
} from "./logic";

describe("Stars ZAMS HR -- logic", () => {
  it("clamps values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("round-trips log slider conversions", () => {
    const min = 0.1;
    const max = 100;
    for (const sliderVal of [0, 125, 500, 875, 1000]) {
      const value = logSliderToValue(sliderVal, min, max);
      const back = valueToLogSlider(value, min, max);
      expect(back).toBe(sliderVal);
    }
  });

  it("formats numbers with fixed and scientific notation", () => {
    expect(formatNumber(42.1234, 2)).toBe("42.12");
    expect(formatNumber(1.2e7, 3)).toBe("1.20e+7");
    expect(formatNumber(NaN)).toBe("-");
  });

  it("formats metallicity readouts", () => {
    expect(formatMetallicity(0.02)).toBe("0.0200");
    expect(formatMetallicity(1e-4)).toBe("1.00e-4");
    expect(formatMetallicity(NaN)).toBe("-");
  });

  it("maps HR coordinates with hot stars on the left", () => {
    const cool = hrDiagramCoordinates({ teffK: 3000, luminosityLsun: 1 });
    const hot = hrDiagramCoordinates({ teffK: 30000, luminosityLsun: 1 });
    expect(hot.xNorm).toBeLessThan(cool.xNorm);
  });

  it("maps HR coordinates with luminous stars toward top", () => {
    const dim = hrDiagramCoordinates({ teffK: 6000, luminosityLsun: 1e-2 });
    const bright = hrDiagramCoordinates({ teffK: 6000, luminosityLsun: 1e4 });
    expect(bright.yNorm).toBeGreaterThan(dim.yNorm);
  });
});
