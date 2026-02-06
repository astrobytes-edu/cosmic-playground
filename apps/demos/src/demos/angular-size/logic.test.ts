import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatAngleDisplay,
  describeMoonOrbitAngle,
  describeMoonRecessionTime,
} from "./logic";

describe("Angular Size -- UI Logic", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max", () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });
  });

  describe("logSliderToValue / valueToLogSlider round-trip", () => {
    const MIN = 0.0001;
    const MAX = 1e20;

    it("slider 0 maps to MIN", () => {
      const v = logSliderToValue(0, MIN, MAX);
      expect(Math.abs(v - MIN) / MIN).toBeLessThan(0.01);
    });

    it("slider 1000 maps to MAX", () => {
      const v = logSliderToValue(1000, MIN, MAX);
      expect(Math.abs(v - MAX) / MAX).toBeLessThan(0.01);
    });

    it("slider 500 maps to geometric mean", () => {
      const v = logSliderToValue(500, MIN, MAX);
      const expected = Math.sqrt(MIN * MAX);
      expect(Math.abs(Math.log10(v) - Math.log10(expected))).toBeLessThan(0.01);
    });

    it("round-trips value -> slider -> value", () => {
      const values = [1, 100, 1e6, 1e12, 1e-3];
      for (const v of values) {
        const slider = valueToLogSlider(v, MIN, MAX);
        const back = logSliderToValue(slider, MIN, MAX);
        expect(Math.abs(Math.log10(back) - Math.log10(v))).toBeLessThan(0.01);
      }
    });

    it("valueToLogSlider returns 0 for non-positive input", () => {
      expect(valueToLogSlider(0, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(-1, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(NaN, MIN, MAX)).toBe(0);
    });
  });

  describe("formatNumber", () => {
    it("formats normal numbers with fixed digits", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });
    it("uses exponential for large numbers", () => {
      expect(formatNumber(1.5e8, 3)).toBe("1.50e+8");
    });
    it("uses exponential for small numbers", () => {
      expect(formatNumber(0.00012, 3)).toBe("1.20e-4");
    });
    it("returns em-dash for non-finite", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
      expect(formatNumber(Infinity)).toBe("\u2014");
    });
    it("returns 0 for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });
  });

  describe("formatAngleDisplay", () => {
    it("shows degrees for angles >= 1 deg", () => {
      expect(formatAngleDisplay(2.5)).toEqual({ text: "2.50", unit: "deg" });
    });
    it("shows arcmin for angles between 1/60 and 1 deg", () => {
      const result = formatAngleDisplay(0.5);
      expect(result.unit).toBe("arcmin");
      expect(parseFloat(result.text)).toBeCloseTo(30, 0);
    });
    it("shows arcsec for tiny angles", () => {
      const result = formatAngleDisplay(0.001);
      expect(result.unit).toBe("arcsec");
      expect(parseFloat(result.text)).toBeCloseTo(3.6, 0);
    });
    it("returns em-dash for NaN", () => {
      expect(formatAngleDisplay(NaN)).toEqual({ text: "\u2014", unit: "" });
    });
  });

  describe("describeMoonOrbitAngle", () => {
    it("returns Perigee at 0 deg", () => {
      expect(describeMoonOrbitAngle(0)).toBe("Perigee");
    });
    it("returns Apogee at 180 deg", () => {
      expect(describeMoonOrbitAngle(180)).toBe("Apogee");
    });
    it("returns rounded angle for other values", () => {
      expect(describeMoonOrbitAngle(90)).toBe("90 deg");
    });
    it("handles 360 as Perigee", () => {
      expect(describeMoonOrbitAngle(360)).toBe("Perigee");
    });
  });

  describe("describeMoonRecessionTime", () => {
    it("returns Today for 0", () => {
      expect(describeMoonRecessionTime(0)).toBe("Today");
    });
    it("formats negative as past", () => {
      expect(describeMoonRecessionTime(-500)).toBe("500 Myr ago");
    });
    it("formats positive as future", () => {
      expect(describeMoonRecessionTime(500)).toBe("+500 Myr");
    });
  });
});
