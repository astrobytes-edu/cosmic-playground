import { describe, it, expect } from "vitest";
import {
  clamp,
  detectorOffsetPx,
  describeMeasurability,
  diagramHalfAngle,
  diagramStarY,
  formatNumber,
  parallaxArcsecFromMas,
  parallaxRadiansFromMas,
  signalToNoise
} from "./logic";

describe("Parallax Distance -- UI Logic", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("clamps to bounds", () => {
      expect(clamp(-2, 0, 10)).toBe(0);
      expect(clamp(17, 0, 10)).toBe(10);
    });
  });

  describe("formatNumber", () => {
    it("formats finite values", () => {
      expect(formatNumber(3.14159)).toBe("3.14");
      expect(formatNumber(3.14159, 4)).toBe("3.1416");
    });

    it("returns em dash for non-finite values", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
      expect(formatNumber(Infinity)).toBe("\u2014");
      expect(formatNumber(-Infinity)).toBe("\u2014");
    });
  });

  describe("parallax conversions", () => {
    it("converts mas to arcsec", () => {
      expect(parallaxArcsecFromMas(1000)).toBeCloseTo(1, 12);
      expect(parallaxArcsecFromMas(250)).toBeCloseTo(0.25, 12);
    });

    it("converts mas to radians", () => {
      const oneArcsecRad = (Math.PI / 180) / 3600;
      expect(parallaxRadiansFromMas(1000)).toBeCloseTo(oneArcsecRad, 12);
    });
  });

  describe("signalToNoise + measurability", () => {
    it("computes p/sigma for positive sigma", () => {
      expect(signalToNoise(100, 2)).toBe(50);
    });

    it("returns Infinity for non-positive sigma", () => {
      expect(signalToNoise(100, 0)).toBe(Infinity);
      expect(signalToNoise(100, -1)).toBe(Infinity);
    });

    it("classifies measurement quality", () => {
      expect(describeMeasurability(25)).toBe("Excellent");
      expect(describeMeasurability(8)).toBe("Good");
      expect(describeMeasurability(4)).toBe("Marginal");
      expect(describeMeasurability(2)).toBe("Poor");
      expect(describeMeasurability(0)).toBe("Not measurable");
      expect(describeMeasurability(Infinity)).toBe("Not measurable");
    });
  });

  describe("diagramHalfAngle", () => {
    it("is monotonic across p = 1..1000 mas", () => {
      const values = [1, 10, 100, 1000].map((p) => diagramHalfAngle(p));

      expect(values[0].halfAngle).toBeLessThan(values[1].halfAngle);
      expect(values[1].halfAngle).toBeLessThan(values[2].halfAngle);
      expect(values[2].halfAngle).toBeLessThan(values[3].halfAngle);

      expect(values[0].logProgress).toBeCloseTo(0, 6);
      expect(values[3].logProgress).toBeCloseTo(1, 6);
      expect(values[2].logProgress).toBeCloseTo(2 / 3, 5);
    });

    it("returns finite exaggeration factors", () => {
      const near = diagramHalfAngle(1000);
      const far = diagramHalfAngle(1);
      expect(near.exaggeration).toBeGreaterThan(1);
      expect(far.exaggeration).toBeGreaterThan(near.exaggeration);
      expect(Number.isFinite(near.exaggeration)).toBe(true);
      expect(Number.isFinite(far.exaggeration)).toBe(true);
    });
  });

  describe("diagramStarY", () => {
    it("moves monotonically with visual half-angle", () => {
      const yA = diagramStarY(320, 320, 0.45, 88, 236);
      const yB = diagramStarY(320, 320, 0.75, 88, 236);
      const yC = diagramStarY(320, 320, 1.0, 88, 236);

      expect(yA).toBeLessThan(yB);
      expect(yB).toBeLessThan(yC);
    });

    it("does not collapse to a single value across slider domain", () => {
      const starYs = [1, 10, 100, 1000].map((p) => {
        const { halfAngle } = diagramHalfAngle(p);
        return diagramStarY(320, 320, halfAngle, 88, 236);
      });

      expect(new Set(starYs.map((value) => value.toFixed(2))).size).toBeGreaterThanOrEqual(3);
    });

    it("keeps visible motion in the far-distance regime", () => {
      const lowParallaxYs = [1, 2, 5, 10].map((p) => {
        const { halfAngle } = diagramHalfAngle(p);
        return diagramStarY(320, 320, halfAngle, 88, 236);
      });

      expect(new Set(lowParallaxYs.map((value) => value.toFixed(2))).size).toBe(4);
      expect(lowParallaxYs[0]).toBeLessThan(lowParallaxYs[1]);
      expect(lowParallaxYs[1]).toBeLessThan(lowParallaxYs[2]);
      expect(lowParallaxYs[2]).toBeLessThan(lowParallaxYs[3]);
    });
  });

  describe("detectorOffsetPx", () => {
    it("is monotonic and bounded", () => {
      const offsets = [1, 10, 100, 1000].map((p) => detectorOffsetPx(p, 120, 12));

      expect(offsets[0]).toBeLessThan(offsets[1]);
      expect(offsets[1]).toBeLessThan(offsets[2]);
      expect(offsets[2]).toBeLessThan(offsets[3]);

      for (const value of offsets) {
        expect(value).toBeGreaterThanOrEqual(12);
        expect(value).toBeLessThanOrEqual(120);
      }
    });

    it("respects minimum offset when track half-width is tiny", () => {
      expect(detectorOffsetPx(500, 6, 12)).toBeGreaterThanOrEqual(12);
    });
  });
});
