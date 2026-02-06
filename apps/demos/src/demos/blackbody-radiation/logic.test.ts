import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  wavelengthDomainNm,
  sampleLogSpace,
  wavelengthToApproxRgb,
  formatWavelengthLabel,
  wavelengthToLogFraction,
  formatWavelengthReadout,
} from "./logic";

describe("Blackbody Radiation -- UI Logic", () => {
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
    it("handles min === max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe("logSliderToValue", () => {
    const MIN = 2.725;
    const MAX = 1e6;

    it("slider 0 returns minVal", () => {
      const v = logSliderToValue(0, MIN, MAX);
      expect(v).toBeCloseTo(MIN, 2);
    });

    it("slider 1000 returns maxVal", () => {
      const v = logSliderToValue(1000, MIN, MAX);
      expect(v).toBeCloseTo(MAX, -2);
    });

    it("slider 500 returns geometric midpoint", () => {
      const v = logSliderToValue(500, MIN, MAX);
      const expected = Math.pow(10, (Math.log10(MIN) + Math.log10(MAX)) / 2);
      expect(v).toBeCloseTo(expected, 0);
    });

    it("slider values increase monotonically", () => {
      const a = logSliderToValue(200, MIN, MAX);
      const b = logSliderToValue(400, MIN, MAX);
      const c = logSliderToValue(800, MIN, MAX);
      expect(a).toBeLessThan(b);
      expect(b).toBeLessThan(c);
    });
  });

  describe("valueToLogSlider", () => {
    const MIN = 2.725;
    const MAX = 1e6;

    it("minVal returns slider 0", () => {
      expect(valueToLogSlider(MIN, MIN, MAX)).toBe(0);
    });

    it("maxVal returns slider 1000", () => {
      expect(valueToLogSlider(MAX, MIN, MAX)).toBe(1000);
    });

    it("returns 0 for non-finite input", () => {
      expect(valueToLogSlider(NaN, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(Infinity, MIN, MAX)).toBe(0);
    });

    it("returns 0 for zero or negative input", () => {
      expect(valueToLogSlider(0, MIN, MAX)).toBe(0);
      expect(valueToLogSlider(-5, MIN, MAX)).toBe(0);
    });

    it("round-trips with logSliderToValue", () => {
      for (const slider of [0, 100, 500, 750, 1000]) {
        const value = logSliderToValue(slider, MIN, MAX);
        const back = valueToLogSlider(value, MIN, MAX);
        expect(back).toBe(slider);
      }
    });
  });

  describe("formatNumber", () => {
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
    });

    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity)).toBe("\u2014");
    });

    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("uses fixed-point for normal numbers", () => {
      expect(formatNumber(3.14159, 2)).toBe("3.14");
    });

    it("uses toFixed rounding", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });

    it("uses scientific notation for very large numbers", () => {
      expect(formatNumber(1.5e7, 3)).toBe("1.50e+7");
    });

    it("uses scientific notation for very small numbers", () => {
      expect(formatNumber(0.00005, 3)).toBe("5.00e-5");
    });

    it("defaults to 3 significant digits", () => {
      expect(formatNumber(42.1234)).toBe("42.123");
    });
  });

  describe("wavelengthDomainNm", () => {
    it("returns domain from 10 nm to 1e6 nm", () => {
      const { minNm, maxNm } = wavelengthDomainNm();
      expect(minNm).toBe(10);
      expect(maxNm).toBe(1e6);
    });
  });

  describe("sampleLogSpace", () => {
    it("returns array of correct length", () => {
      expect(sampleLogSpace(1, 1000, 4)).toHaveLength(4);
    });

    it("first element equals min", () => {
      const arr = sampleLogSpace(10, 10000, 100);
      expect(arr[0]).toBeCloseTo(10, 5);
    });

    it("last element equals max", () => {
      const arr = sampleLogSpace(10, 10000, 100);
      expect(arr[arr.length - 1]).toBeCloseTo(10000, 0);
    });

    it("values increase monotonically", () => {
      const arr = sampleLogSpace(1, 1e6, 50);
      for (let i = 1; i < arr.length; i++) {
        expect(arr[i]).toBeGreaterThan(arr[i - 1]);
      }
    });

    it("produces logarithmically spaced values (ratios equal)", () => {
      const arr = sampleLogSpace(10, 10000, 4);
      // 10, 100, 1000, 10000 -- each ratio should be 10
      const ratio1 = arr[1] / arr[0];
      const ratio2 = arr[2] / arr[1];
      const ratio3 = arr[3] / arr[2];
      expect(ratio1).toBeCloseTo(ratio2, 3);
      expect(ratio2).toBeCloseTo(ratio3, 3);
    });

    it("handles n=1 (returns [min])", () => {
      const arr = sampleLogSpace(42, 9999, 1);
      expect(arr).toHaveLength(1);
      expect(arr[0]).toBeCloseTo(42, 5);
    });
  });

  describe("wavelengthToApproxRgb", () => {
    it("returns near-black for UV (below 380 nm)", () => {
      const { r, g, b } = wavelengthToApproxRgb(200);
      expect(r + g + b).toBe(0);
    });

    it("returns near-black for far IR (above 750 nm)", () => {
      const { r, g, b } = wavelengthToApproxRgb(1000);
      expect(r + g + b).toBe(0);
    });

    it("returns blue-ish for 450 nm", () => {
      const { r, g, b } = wavelengthToApproxRgb(450);
      expect(b).toBeGreaterThan(200);
      expect(b).toBeGreaterThan(r);
    });

    it("returns green-ish for 520 nm", () => {
      const { r, g, b } = wavelengthToApproxRgb(520);
      expect(g).toBeGreaterThan(200);
      expect(g).toBeGreaterThan(b);
    });

    it("returns red-ish for 650 nm", () => {
      const { r, g, b } = wavelengthToApproxRgb(650);
      expect(r).toBeGreaterThan(200);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it("returns yellow-ish for 570 nm (r and g both high)", () => {
      const { r, g, b } = wavelengthToApproxRgb(570);
      expect(r).toBeGreaterThan(100);
      expect(g).toBeGreaterThan(100);
      expect(b).toBe(0);
    });

    it("all channels are 0-255 integers", () => {
      for (const nm of [380, 420, 500, 580, 650, 750]) {
        const { r, g, b } = wavelengthToApproxRgb(nm);
        expect(Number.isInteger(r)).toBe(true);
        expect(Number.isInteger(g)).toBe(true);
        expect(Number.isInteger(b)).toBe(true);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
      }
    });
  });

  describe("formatWavelengthLabel", () => {
    it("formats nm for small wavelengths", () => {
      expect(formatWavelengthLabel(500)).toBe("500 nm");
    });

    it("formats um for thousands of nm", () => {
      expect(formatWavelengthLabel(1500)).toBe("1.5 \u03BCm");
    });

    it("formats um without decimal for large values", () => {
      expect(formatWavelengthLabel(50000)).toBe("50 \u03BCm");
    });

    it("formats mm for >= 1e6 nm", () => {
      expect(formatWavelengthLabel(1e6)).toBe("1 mm");
    });
  });

  describe("wavelengthToLogFraction", () => {
    it("returns 0 at minNm", () => {
      expect(wavelengthToLogFraction(10, 10, 1e6)).toBeCloseTo(0, 5);
    });

    it("returns 1 at maxNm", () => {
      expect(wavelengthToLogFraction(1e6, 10, 1e6)).toBeCloseTo(1, 5);
    });

    it("returns 0.5 at geometric midpoint", () => {
      // Geometric midpoint of 10 and 1e6 = 10^(1+6)/2 = 10^3.5
      const mid = Math.pow(10, 3.5);
      expect(wavelengthToLogFraction(mid, 10, 1e6)).toBeCloseTo(0.5, 5);
    });
  });

  describe("formatWavelengthReadout", () => {
    it("returns nm value and unit for visible range", () => {
      const r = formatWavelengthReadout(502);
      expect(r.value).toBe("502");
      expect(r.unit).toBe("nm");
    });

    it("returns um for near-IR", () => {
      const r = formatWavelengthReadout(10000);
      expect(r.value).toBe("10");
      expect(r.unit).toBe("\u03BCm");
    });

    it("returns mm for far-IR / microwave", () => {
      const r = formatWavelengthReadout(1063486);
      expect(r.value).toBe("1.1");
      expect(r.unit).toBe("mm");
    });

    it("returns em-dash for non-finite input", () => {
      const r = formatWavelengthReadout(NaN);
      expect(r.value).toBe("\u2014");
      expect(r.unit).toBe("");
    });
  });
});
