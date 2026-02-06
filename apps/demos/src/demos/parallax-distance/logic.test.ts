import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  signalToNoise,
  describeMeasurability,
  diagramHalfAngle,
  diagramStarY,
} from "./logic";

describe("Parallax Distance -- UI Logic", () => {
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

  describe("formatNumber", () => {
    it("formats normal numbers with default 2 digits", () => {
      expect(formatNumber(3.14159)).toBe("3.14");
    });
    it("formats with custom digit count", () => {
      expect(formatNumber(1.23456, 4)).toBe("1.2346");
    });
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity)).toBe("\u2014");
    });
    it("returns em-dash for -Infinity", () => {
      expect(formatNumber(-Infinity)).toBe("\u2014");
    });
  });

  describe("signalToNoise", () => {
    it("computes p/sigma for positive sigma", () => {
      expect(signalToNoise(100, 1)).toBe(100);
    });
    it("returns Infinity for zero sigma", () => {
      expect(signalToNoise(100, 0)).toBe(Infinity);
    });
    it("returns Infinity for negative sigma", () => {
      expect(signalToNoise(100, -1)).toBe(Infinity);
    });
    it("handles small parallax with large sigma", () => {
      expect(signalToNoise(0.5, 10)).toBeCloseTo(0.05, 10);
    });
  });

  describe("describeMeasurability", () => {
    it("returns Excellent for high SNR", () => {
      expect(describeMeasurability(25)).toBe("Excellent");
    });
    it("returns Good for moderate SNR", () => {
      expect(describeMeasurability(10)).toBe("Good");
    });
    it("returns Marginal for low SNR", () => {
      expect(describeMeasurability(4)).toBe("Marginal");
    });
    it("returns Poor for very low SNR", () => {
      expect(describeMeasurability(2)).toBe("Poor");
    });
    it("returns Not measurable for zero SNR", () => {
      expect(describeMeasurability(0)).toBe("Not measurable");
    });
    it("returns Not measurable for Infinity", () => {
      expect(describeMeasurability(Infinity)).toBe("Not measurable");
    });
  });

  describe("diagramHalfAngle", () => {
    it("returns unclamped result for mid-range parallax (1000 mas)", () => {
      // 1000 mas => pArcsec=1.0, pRad~4.85e-6, raw~0.0291 (between 0.02 and 0.34)
      const { halfAngle, clamped } = diagramHalfAngle(1000);
      expect(halfAngle).toBeCloseTo(0.0291, 3);
      expect(clamped).toBe(false);
    });
    it("clamps large parallax angles to max (100000 mas)", () => {
      // 100000 mas => raw~2.91, clamped to 0.34
      const { halfAngle, clamped } = diagramHalfAngle(100000);
      expect(halfAngle).toBe(0.34);
      expect(clamped).toBe(true);
    });
    it("clamps tiny parallax angles to minimum (1 mas)", () => {
      // 1 mas => raw~2.9e-5, clamped to 0.02
      const { halfAngle, clamped } = diagramHalfAngle(1);
      expect(halfAngle).toBe(0.02);
      expect(clamped).toBe(true);
    });
    it("clamps moderate parallax below threshold (100 mas)", () => {
      // 100 mas => raw~0.00291, below 0.02, clamped
      const { halfAngle, clamped } = diagramHalfAngle(100);
      expect(halfAngle).toBe(0.02);
      expect(clamped).toBe(true);
    });
    it("returns unclamped for parallax near upper mid-range (10000 mas)", () => {
      // 10000 mas => raw~0.291, between 0.02 and 0.34
      const { halfAngle, clamped } = diagramHalfAngle(10000);
      expect(halfAngle).toBeCloseTo(0.2909, 3);
      expect(clamped).toBe(false);
    });
  });

  describe("diagramStarY", () => {
    it("places star above baseline for large angle (unclamped)", () => {
      // baselineY=400, baselineLen=100, halfAngle=0.3
      // starY = 400 - (100/2)/tan(0.3) = 400 - 50/0.3093 ~ 238.4
      const { starY, clamped } = diagramStarY(400, 100, 0.3);
      expect(starY).toBeCloseTo(238.4, 0);
      expect(starY).toBeGreaterThan(80);
      expect(clamped).toBe(false);
    });
    it("clamps starY to 80 for very small angles", () => {
      // halfAngle=0.02 => (100/2)/tan(0.02) ~ 2500, starY = 400 - 2500 = -2100 => clamped
      const { starY, clamped } = diagramStarY(400, 100, 0.02);
      expect(starY).toBe(80);
      expect(clamped).toBe(true);
    });
    it("clamps when baseline is long and angle small", () => {
      // baselineY=420, baselineLen=320, halfAngle=0.15
      // (320/2)/tan(0.15) = 160/0.1511 ~ 1058.9, starY = 420 - 1059 = -639 => clamped
      const { starY, clamped } = diagramStarY(420, 320, 0.15);
      expect(starY).toBe(80);
      expect(clamped).toBe(true);
    });
  });
});
