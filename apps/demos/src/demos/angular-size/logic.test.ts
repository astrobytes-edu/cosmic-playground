import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatAngleDisplay,
  describeMoonOrbitAngle,
  describeMoonRecessionTime,
  toSuperscript,
  formatSci,
  formatDistanceAuto,
  formatDiameterAuto,
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

  describe("toSuperscript", () => {
    it("converts single digit", () => {
      expect(toSuperscript(3)).toBe("\u00B3");
    });
    it("converts multi-digit number", () => {
      expect(toSuperscript(12)).toBe("\u00B9\u00B2");
    });
    it("converts negative exponent", () => {
      expect(toSuperscript(-4)).toBe("\u207B\u2074");
    });
    it("converts zero", () => {
      expect(toSuperscript(0)).toBe("\u2070");
    });
    it("converts all digits 0-9", () => {
      expect(toSuperscript(1234567890)).toBe(
        "\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u2070"
      );
    });
  });

  describe("formatSci", () => {
    it("formats numbers in normal range without exponent", () => {
      expect(formatSci(150, 3)).toBe("150");
    });
    it("formats decimal in normal range", () => {
      expect(formatSci(1.5, 3)).toBe("1.50");
    });
    it("formats small decimal in normal range", () => {
      expect(formatSci(0.5, 3)).toBe("0.500");
    });
    it("uses Unicode exponent for large numbers", () => {
      expect(formatSci(1.5e8, 3)).toBe("1.50 \u00D7 10\u2078");
    });
    it("uses Unicode exponent for small numbers", () => {
      expect(formatSci(0.00012, 3)).toBe("1.20 \u00D7 10\u207B\u2074");
    });
    it("returns em-dash for NaN", () => {
      expect(formatSci(NaN)).toBe("\u2014");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatSci(Infinity)).toBe("\u2014");
    });
    it("returns 0 for zero", () => {
      expect(formatSci(0)).toBe("0");
    });
    it("respects custom sig figs", () => {
      expect(formatSci(6779, 4)).toBe("6779");
      expect(formatSci(6779, 3)).toBe("6.78 \u00D7 10\u00B3");
    });
    it("handles negative numbers", () => {
      expect(formatSci(-150, 3)).toBe("-150");
      expect(formatSci(-1.5e8, 3)).toBe("-1.50 \u00D7 10\u2078");
    });
  });

  describe("formatDistanceAuto", () => {
    it("shows cm for sub-meter distances", () => {
      expect(formatDistanceAuto(0.0007)).toEqual({ text: "70.0", unit: "cm" });
    });
    it("shows m for sub-km distances", () => {
      expect(formatDistanceAuto(0.01)).toEqual({ text: "10.0", unit: "m" });
    });
    it("shows km for moderate distances", () => {
      const r = formatDistanceAuto(384400);
      expect(r.unit).toBe("km");
    });
    it("shows AU for planetary distances (Sun)", () => {
      const r = formatDistanceAuto(149597870.7);
      expect(r.unit).toBe("AU");
      expect(r.text).toBe("1.00");
    });
    it("shows AU for Mars distance", () => {
      const r = formatDistanceAuto(5.46e7);
      expect(r.unit).toBe("AU");
    });
    it("shows pc for stellar distances", () => {
      const r = formatDistanceAuto(3.086e14);
      expect(r.unit).toBe("pc");
    });
    it("shows kpc for galactic distances", () => {
      const r = formatDistanceAuto(2.4e19);
      expect(r.unit).toBe("kpc");
    });
    it("shows Mpc for galaxy cluster distances", () => {
      const r = formatDistanceAuto(5e20);
      expect(r.unit).toBe("Mpc");
    });
    it("shows Gpc for cosmological distances", () => {
      const r = formatDistanceAuto(4e23);
      expect(r.unit).toBe("Gpc");
    });
    it("returns em-dash for NaN", () => {
      expect(formatDistanceAuto(NaN)).toEqual({ text: "\u2014", unit: "" });
    });
  });

  describe("formatDiameterAuto", () => {
    it("shows cm for tiny objects (quarter coin)", () => {
      const r = formatDiameterAuto(0.0000243);
      expect(r.unit).toBe("cm");
      expect(parseFloat(r.text)).toBeCloseTo(2.43, 1);
    });
    it("shows m for sub-km objects (basketball)", () => {
      const r = formatDiameterAuto(0.000239);
      expect(r.unit).toBe("m");
    });
    it("shows km for planets", () => {
      const r = formatDiameterAuto(6779);
      expect(r.unit).toBe("km");
    });
    it("shows km for stars (Sun)", () => {
      const r = formatDiameterAuto(1.392e6);
      expect(r.unit).toBe("km");
    });
    it("shows kpc for galaxies (Andromeda)", () => {
      const r = formatDiameterAuto(2.9e17);
      expect(r.unit).toBe("kpc");
    });
    it("shows Mpc for galaxy clusters", () => {
      const r = formatDiameterAuto(7e19);
      expect(r.unit).toBe("Mpc");
    });
    it("returns em-dash for NaN", () => {
      expect(formatDiameterAuto(NaN)).toEqual({ text: "\u2014", unit: "" });
    });
  });
});
