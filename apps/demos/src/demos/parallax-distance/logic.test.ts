import { describe, it, expect } from "vitest";
import {
  clamp,
  detectorOffsetsMas,
  describeMeasurability,
  errorRadiusPx,
  formatNumber,
  normalizePhaseDeg,
  oppositePhaseDeg,
  offsetPx,
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

  describe("phase helpers", () => {
    it("normalizes phase to [0, 360)", () => {
      expect(normalizePhaseDeg(0)).toBeCloseTo(0, 12);
      expect(normalizePhaseDeg(360)).toBeCloseTo(0, 12);
      expect(normalizePhaseDeg(725)).toBeCloseTo(5, 12);
      expect(normalizePhaseDeg(-90)).toBeCloseTo(270, 12);
    });

    it("returns opposite phases separated by 180 deg", () => {
      expect(oppositePhaseDeg(0)).toBeCloseTo(180, 12);
      expect(oppositePhaseDeg(90)).toBeCloseTo(270, 12);
      expect(oppositePhaseDeg(270)).toBeCloseTo(90, 12);
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
      expect(describeMeasurability(6)).toBe("Good");
      expect(describeMeasurability(2)).toBe("Poor");
      expect(describeMeasurability(0)).toBe("Not measurable");
      expect(describeMeasurability(Infinity)).toBe("Not measurable");
    });
  });

  describe("detector offsets", () => {
    it("keeps Jan/Jul separation equal to 2p independent of phase", () => {
      const pMas = 40;
      const atJan = detectorOffsetsMas(pMas, 0);
      const atApr = detectorOffsetsMas(pMas, 90);
      const atRandom = detectorOffsetsMas(pMas, 233);

      expect(atJan.separationMas).toBeCloseTo(80, 10);
      expect(atApr.separationMas).toBeCloseTo(80, 10);
      expect(atRandom.separationMas).toBeCloseTo(80, 10);
    });

    it("returns opposite detector vectors for opposite epochs", () => {
      const result = detectorOffsetsMas(24, 57);
      expect(result.epochA.xMas).toBeCloseTo(-result.epochB.xMas, 10);
      expect(result.epochA.yMas).toBeCloseTo(-result.epochB.yMas, 10);
    });

    it("changes smoothly and periodically with phase", () => {
      const a = detectorOffsetsMas(30, 0).epochA;
      const b = detectorOffsetsMas(30, 45).epochA;
      const c = detectorOffsetsMas(30, 360).epochA;

      expect(Math.abs(a.xMas - b.xMas) + Math.abs(a.yMas - b.yMas)).toBeGreaterThan(0.1);
      expect(c.xMas).toBeCloseTo(a.xMas, 10);
      expect(c.yMas).toBeCloseTo(a.yMas, 10);
    });
  });

  describe("display scaling helpers", () => {
    it("scales displayed offset with exaggeration only", () => {
      const base = offsetPx(10, 1, 0.06);
      const exaggerated = offsetPx(10, 12, 0.06);
      expect(exaggerated).toBeCloseTo(base * 12, 12);
    });

    it("maps sigma to visible error radius with clamping", () => {
      const low = errorRadiusPx(0.1, 5, 0.08, 3, 40);
      const high = errorRadiusPx(12, 5, 0.08, 3, 40);
      const capped = errorRadiusPx(1000, 5, 0.08, 3, 40);

      expect(low).toBeGreaterThanOrEqual(3);
      expect(high).toBeGreaterThan(low);
      expect(capped).toBeLessThanOrEqual(40);
    });
  });
});
