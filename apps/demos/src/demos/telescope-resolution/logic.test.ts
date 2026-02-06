import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatApertureM,
  formatWavelengthCm,
  describeStatus,
  toneToBadgeAttr,
  computeFovArcsec,
  zoomedFov,
} from "./logic";

describe("Telescope Resolution -- UI Logic", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("clamps to min when below", () => {
      expect(clamp(-3, 0, 10)).toBe(0);
    });

    it("clamps to max when above", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("returns min when value equals min", () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it("returns max when value equals max", () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it("handles min === max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe("logSliderToValue", () => {
    // Telescope aperture range: 0.007 m to 1e7 m
    const MIN = 0.007;
    const MAX = 1e7;

    it("slider 0 returns minVal", () => {
      const v = logSliderToValue(0, MIN, MAX);
      expect(v).toBeCloseTo(MIN, 5);
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
      const a = logSliderToValue(100, MIN, MAX);
      const b = logSliderToValue(300, MIN, MAX);
      const c = logSliderToValue(700, MIN, MAX);
      const d = logSliderToValue(900, MIN, MAX);
      expect(a).toBeLessThan(b);
      expect(b).toBeLessThan(c);
      expect(c).toBeLessThan(d);
    });
  });

  describe("valueToLogSlider", () => {
    const MIN = 0.007;
    const MAX = 1e7;

    it("minVal returns slider 0", () => {
      expect(valueToLogSlider(MIN, MIN, MAX)).toBe(0);
    });

    it("maxVal returns slider 1000", () => {
      expect(valueToLogSlider(MAX, MIN, MAX)).toBe(1000);
    });

    it("returns 0 for NaN", () => {
      expect(valueToLogSlider(NaN, MIN, MAX)).toBe(0);
    });

    it("returns 0 for Infinity", () => {
      expect(valueToLogSlider(Infinity, MIN, MAX)).toBe(0);
    });

    it("returns 0 for negative Infinity", () => {
      expect(valueToLogSlider(-Infinity, MIN, MAX)).toBe(0);
    });

    it("returns 0 for zero", () => {
      expect(valueToLogSlider(0, MIN, MAX)).toBe(0);
    });

    it("returns 0 for negative values", () => {
      expect(valueToLogSlider(-5, MIN, MAX)).toBe(0);
    });

    it("round-trips with logSliderToValue", () => {
      for (const slider of [0, 100, 250, 500, 750, 1000]) {
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

    it("returns em-dash for negative Infinity", () => {
      expect(formatNumber(-Infinity)).toBe("\u2014");
    });

    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("uses fixed-point for normal numbers", () => {
      expect(formatNumber(42.567, 2)).toBe("42.57");
    });

    it("uses toFixed rounding", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });

    it("defaults to 3 digits", () => {
      expect(formatNumber(7.123456)).toBe("7.123");
    });

    it("uses scientific notation for very large numbers (>= 1e6)", () => {
      expect(formatNumber(2.5e8, 3)).toBe("2.50e+8");
    });

    it("uses scientific notation for very small numbers (< 1e-3)", () => {
      expect(formatNumber(0.00007, 3)).toBe("7.00e-5");
    });

    it("uses fixed-point at boundary 999999", () => {
      expect(formatNumber(999999, 3)).toBe("999999.000");
    });

    it("uses scientific notation at boundary 1e6", () => {
      expect(formatNumber(1e6, 3)).toBe("1.00e+6");
    });

    it("handles digits=0 safely for scientific notation", () => {
      // Math.max(0, 0-1) = 0 exponent digits
      expect(formatNumber(1e8, 0)).toBe("1e+8");
    });

    it("formats negative normal-range values with toFixed", () => {
      expect(formatNumber(-42.5, 2)).toBe("-42.50");
    });
  });

  describe("formatApertureM", () => {
    it("formats km for >= 1000 m", () => {
      const r = formatApertureM(5000);
      expect(r.text).toBe("5.000");
      expect(r.unit).toBe("km");
    });

    it("formats km for exactly 1000 m", () => {
      const r = formatApertureM(1000);
      expect(r.text).toBe("1.000");
      expect(r.unit).toBe("km");
    });

    it("formats m for 1 to 999 m", () => {
      const r = formatApertureM(2.4);
      expect(r.text).toBe("2.400");
      expect(r.unit).toBe("m");
    });

    it("formats m for exactly 1 m", () => {
      const r = formatApertureM(1);
      expect(r.text).toBe("1.000");
      expect(r.unit).toBe("m");
    });

    it("formats cm for < 1 m", () => {
      const r = formatApertureM(0.07);
      expect(r.text).toBe("7.000");
      expect(r.unit).toBe("cm");
    });

    it("formats small cm values", () => {
      const r = formatApertureM(0.007);
      // 0.007 * 100 = 0.7
      expect(r.text).toBe("0.700");
      expect(r.unit).toBe("cm");
    });

    it("returns em-dash for NaN", () => {
      const r = formatApertureM(NaN);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("returns em-dash for Infinity", () => {
      const r = formatApertureM(Infinity);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("returns em-dash for zero", () => {
      const r = formatApertureM(0);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("returns em-dash for negative values", () => {
      const r = formatApertureM(-5);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("uses scientific notation for very large apertures", () => {
      const r = formatApertureM(1e7);
      // 1e7 / 1000 = 10000 => formatNumber(10000, 3) = "10000.000"
      expect(r.text).toBe("10000.000");
      expect(r.unit).toBe("km");
    });
  });

  describe("formatWavelengthCm", () => {
    // Simple converter: 1 cm = 1e7 nm
    const cmToNm = (cm: number) => cm * 1e7;

    it("formats nm for optical wavelengths (< 1e-4 cm)", () => {
      // 500 nm = 5e-5 cm
      const lambdaCm = 5e-5;
      const r = formatWavelengthCm(lambdaCm, cmToNm);
      // cmToNm(5e-5) = 500
      expect(r.text).toBe("500.000");
      expect(r.unit).toBe("nm");
    });

    it("formats um for near-IR (1e-4 to 0.1 cm)", () => {
      // 10 um = 1e-3 cm => 1e-3 / 1e-4 = 10
      const lambdaCm = 1e-3;
      const r = formatWavelengthCm(lambdaCm, cmToNm);
      expect(r.text).toBe("10.000");
      expect(r.unit).toBe("um");
    });

    it("formats mm for millimeter wavelengths (0.1 to 1 cm)", () => {
      // 3 mm = 0.3 cm => 0.3 * 10 = 3
      const lambdaCm = 0.3;
      const r = formatWavelengthCm(lambdaCm, cmToNm);
      expect(r.text).toBe("3.000");
      expect(r.unit).toBe("mm");
    });

    it("formats cm for centimeter wavelengths (1 to 100 cm)", () => {
      // 21 cm radio line
      const lambdaCm = 21;
      const r = formatWavelengthCm(lambdaCm, cmToNm);
      expect(r.text).toBe("21.000");
      expect(r.unit).toBe("cm");
    });

    it("formats m for meter wavelengths (>= 100 cm)", () => {
      // 300 cm = 3 m
      const lambdaCm = 300;
      const r = formatWavelengthCm(lambdaCm, cmToNm);
      expect(r.text).toBe("3.000");
      expect(r.unit).toBe("m");
    });

    it("returns em-dash for NaN", () => {
      const r = formatWavelengthCm(NaN, cmToNm);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("returns em-dash for Infinity", () => {
      const r = formatWavelengthCm(Infinity, cmToNm);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("returns em-dash for zero", () => {
      const r = formatWavelengthCm(0, cmToNm);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("returns em-dash for negative values", () => {
      const r = formatWavelengthCm(-1, cmToNm);
      expect(r.text).toBe("\u2014");
      expect(r.unit).toBe("");
    });

    it("handles boundary at 1e-4 cm (um side)", () => {
      // Exactly 1e-4 cm = 1 um => in um branch: 1e-4 / 1e-4 = 1
      const r = formatWavelengthCm(1e-4, cmToNm);
      expect(r.text).toBe("1.000");
      expect(r.unit).toBe("um");
    });

    it("handles boundary at 0.1 cm (mm side)", () => {
      // 0.1 cm = 1 mm => in mm branch: 0.1 * 10 = 1
      const r = formatWavelengthCm(0.1, cmToNm);
      expect(r.text).toBe("1.000");
      expect(r.unit).toBe("mm");
    });

    it("handles boundary at 1 cm (cm side)", () => {
      const r = formatWavelengthCm(1, cmToNm);
      expect(r.text).toBe("1.000");
      expect(r.unit).toBe("cm");
    });

    it("handles boundary at 100 cm (m side)", () => {
      // 100 cm = 1 m
      const r = formatWavelengthCm(100, cmToNm);
      expect(r.text).toBe("1.000");
      expect(r.unit).toBe("m");
    });
  });

  describe("describeStatus", () => {
    it("maps 'resolved' to Resolved / good", () => {
      const r = describeStatus("resolved");
      expect(r.label).toBe("Resolved");
      expect(r.tone).toBe("good");
    });

    it("maps 'marginal' to Marginal / warn", () => {
      const r = describeStatus("marginal");
      expect(r.label).toBe("Marginal");
      expect(r.tone).toBe("warn");
    });

    it("maps 'unresolved' to Unresolved / bad", () => {
      const r = describeStatus("unresolved");
      expect(r.label).toBe("Unresolved");
      expect(r.tone).toBe("bad");
    });

    it("maps unknown status to Unresolved / bad", () => {
      const r = describeStatus("something-else");
      expect(r.label).toBe("Unresolved");
      expect(r.tone).toBe("bad");
    });
  });

  describe("toneToBadgeAttr", () => {
    it("maps 'good' to 'good'", () => {
      expect(toneToBadgeAttr("good")).toBe("good");
    });

    it("maps 'warn' to 'warn'", () => {
      expect(toneToBadgeAttr("warn")).toBe("warn");
    });

    it("maps 'bad' to 'danger'", () => {
      expect(toneToBadgeAttr("bad")).toBe("danger");
    });
  });

  describe("computeFovArcsec", () => {
    it("uses 6x thetaEff when larger than 3x separation", () => {
      // 6 * 10 = 60, 3 * 5 = 15 => max(60, 15) = 60
      const fov = computeFovArcsec(10, 5);
      expect(fov).toBeCloseTo(60, 5);
    });

    it("uses 3x separation when larger than 6x thetaEff", () => {
      // 6 * 1 = 6, 3 * 100 = 300 => max(6, 300) = 300
      const fov = computeFovArcsec(1, 100);
      expect(fov).toBeCloseTo(300, 5);
    });

    it("clamps to minimum 0.4 arcsec", () => {
      // 6 * 0.01 = 0.06, 3 * 0.01 = 0.03 => max(0.06, 0.03) = 0.06, clamped to 0.4
      const fov = computeFovArcsec(0.01, 0.01);
      expect(fov).toBeCloseTo(0.4, 5);
    });

    it("clamps to maximum 500 arcsec", () => {
      // 6 * 100 = 600, 3 * 200 = 600 => max(600, 600) = 600, clamped to 500
      const fov = computeFovArcsec(100, 200);
      expect(fov).toBeCloseTo(500, 5);
    });

    it("returns exactly 0.4 at the lower boundary", () => {
      // 6 * (0.4/6) = 0.4, separation small
      const thetaEff = 0.4 / 6;
      const fov = computeFovArcsec(thetaEff, 0.001);
      expect(fov).toBeCloseTo(0.4, 5);
    });

    it("returns value within [0.4, 500] for typical inputs", () => {
      const fov = computeFovArcsec(5, 10);
      expect(fov).toBeGreaterThanOrEqual(0.4);
      expect(fov).toBeLessThanOrEqual(500);
    });
  });

  describe("zoomedFov", () => {
    it("divides FOV by zoom factor", () => {
      expect(zoomedFov(100, 5)).toBeCloseTo(20, 5);
    });

    it("clamps zoom to minimum 1 (no negative zoom)", () => {
      // zoom = 0 => clamped to 1, so 100 / 1 = 100
      expect(zoomedFov(100, 0)).toBeCloseTo(100, 5);
    });

    it("clamps zoom to minimum 1 for negative zoom", () => {
      expect(zoomedFov(100, -5)).toBeCloseTo(100, 5);
    });

    it("clamps zoom to maximum 20", () => {
      // zoom = 50 => clamped to 20, so 100 / 20 = 5
      expect(zoomedFov(100, 50)).toBeCloseTo(5, 5);
    });

    it("zoom = 1 returns original FOV", () => {
      expect(zoomedFov(42, 1)).toBeCloseTo(42, 5);
    });

    it("zoom = 20 returns FOV / 20", () => {
      expect(zoomedFov(200, 20)).toBeCloseTo(10, 5);
    });

    it("handles fractional zoom within range", () => {
      expect(zoomedFov(60, 3)).toBeCloseTo(20, 5);
    });
  });
});
