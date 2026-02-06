import { describe, expect, it } from "vitest";

import {
  clamp,
  compositionFromXY,
  formatScientific,
  logSliderToValue,
  percent,
  pressureBarPercent,
  pressureTone,
  valueToLogSlider
} from "./logic";

describe("EOS Lab -- UI Logic", () => {
  it("clamps values to bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("round-trips log slider conversions", () => {
    const valueMin = 1e3;
    const valueMax = 1e9;
    const slider = valueToLogSlider({
      value: 1e6,
      sliderMin: 0,
      sliderMax: 1000,
      valueMin,
      valueMax
    });
    const value = logSliderToValue({
      sliderValue: slider,
      sliderMin: 0,
      sliderMax: 1000,
      valueMin,
      valueMax
    });

    expect(value).toBeCloseTo(1e6, 8);
  });

  it("formats scientific readouts safely", () => {
    expect(formatScientific(Number.NaN)).toBe("—");
    expect(formatScientific(0)).toBe("0");
    expect(formatScientific(1.2e7)).toContain("e+");
  });

  it("formats percentages", () => {
    expect(percent(0.5)).toBe("50.0%");
    expect(percent(Number.NaN)).toBe("—");
  });

  it("computes bounded pressure bars", () => {
    expect(
      pressureBarPercent({ pressureDynePerCm2: 5, maxPressureDynePerCm2: 10 })
    ).toBe(50);
    expect(
      pressureBarPercent({ pressureDynePerCm2: 20, maxPressureDynePerCm2: 10 })
    ).toBe(100);
    expect(
      pressureBarPercent({ pressureDynePerCm2: 1, maxPressureDynePerCm2: 0 })
    ).toBe(0);
  });

  it("classifies tone by relative dominance", () => {
    expect(
      pressureTone({ pressureDynePerCm2: 9, dominantPressureDynePerCm2: 10 })
    ).toBe("dominant");
    expect(
      pressureTone({ pressureDynePerCm2: 4, dominantPressureDynePerCm2: 10 })
    ).toBe("secondary");
    expect(
      pressureTone({ pressureDynePerCm2: 1, dominantPressureDynePerCm2: 10 })
    ).toBe("minor");
  });

  it("builds composition with X + Y + Z = 1", () => {
    const composition = compositionFromXY({
      hydrogenMassFractionX: 0.7,
      heliumMassFractionY: 0.28
    });
    expect(composition.hydrogenMassFractionX).toBeCloseTo(0.7, 8);
    expect(composition.heliumMassFractionY).toBeCloseTo(0.28, 8);
    expect(composition.metalMassFractionZ).toBeCloseTo(0.02, 8);
  });

  it("clamps Y when X + Y would exceed unity", () => {
    const composition = compositionFromXY({
      hydrogenMassFractionX: 0.9,
      heliumMassFractionY: 0.6
    });
    expect(composition.hydrogenMassFractionX).toBeCloseTo(0.9, 8);
    expect(composition.heliumMassFractionY).toBeCloseTo(0.1, 8);
    expect(composition.metalMassFractionZ).toBeCloseTo(0, 8);
  });
});
