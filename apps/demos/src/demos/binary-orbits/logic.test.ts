import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  computeModel,
  bodyRadius,
  bodyPositions,
  pixelsPerUnit,
} from "./logic";
import type { PeriodCallback } from "./logic";

// ---------------------------------------------------------------------------
// Kepler period callback for testing (matches TwoBodyAnalytic)
// P = sqrt(a^3 / M_total), using G = 4*pi^2 AU^3/(yr^2*Msun)
// ---------------------------------------------------------------------------
const keplerPeriod: PeriodCallback = ({ aAu, massSolar }) => {
  if (aAu <= 0 || massSolar <= 0) return NaN;
  return Math.sqrt((aAu ** 3) / massSolar);
};

describe("Binary Orbits -- UI Logic", () => {
  // -----------------------------------------------------------------------
  // clamp
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // formatNumber
  // -----------------------------------------------------------------------
  describe("formatNumber", () => {
    it("formats normal numbers with fixed digits", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
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
    it("defaults to 2 digits", () => {
      expect(formatNumber(1.23456)).toBe("1.23");
    });
    it("handles zero", () => {
      expect(formatNumber(0)).toBe("0.00");
    });
    it("handles negative values", () => {
      expect(formatNumber(-2.5, 1)).toBe("-2.5");
    });
    it("handles large values", () => {
      expect(formatNumber(1000, 0)).toBe("1000");
    });
  });

  // -----------------------------------------------------------------------
  // computeModel
  // -----------------------------------------------------------------------
  describe("computeModel", () => {
    it("equal masses (q=1): barycenter at midpoint", () => {
      const m = computeModel(1, 4, keplerPeriod);
      expect(m.m1).toBe(1);
      expect(m.m2).toBe(1);
      expect(m.r1).toBeCloseTo(2, 10);
      expect(m.r2).toBeCloseTo(2, 10);
    });

    it("extreme ratio (q=5): barycenter near heavier body", () => {
      const m = computeModel(5, 6, keplerPeriod);
      // m2 = 5, total = 6
      // r1 = 6 * 5/6 = 5 (far from heavier)
      // r2 = 6 * 1/6 = 1 (near heavier)
      expect(m.r1).toBeCloseTo(5, 10);
      expect(m.r2).toBeCloseTo(1, 10);
    });

    it("period follows Kepler's third law", () => {
      const m1 = computeModel(1, 1, keplerPeriod);
      const m2 = computeModel(1, 4, keplerPeriod);
      // P^2 = a^3 / M_total
      // For q=1 (M_total=2): P(a=1) = sqrt(1/2), P(a=4) = sqrt(64/2) = sqrt(32)
      expect(m1.periodYr).toBeCloseTo(Math.sqrt(0.5), 8);
      expect(m2.periodYr).toBeCloseTo(Math.sqrt(32), 8);
    });

    it("clamps massRatio to [0.2, 5]", () => {
      const low = computeModel(0.01, 4, keplerPeriod);
      expect(low.massRatio).toBe(0.2);
      const high = computeModel(100, 4, keplerPeriod);
      expect(high.massRatio).toBe(5);
    });

    it("clamps separation to [1, 8]", () => {
      const low = computeModel(1, 0.1, keplerPeriod);
      expect(low.separation).toBe(1);
      const high = computeModel(1, 100, keplerPeriod);
      expect(high.separation).toBe(8);
    });

    it("r1 + r2 equals separation", () => {
      const m = computeModel(2.5, 5, keplerPeriod);
      expect(m.r1 + m.r2).toBeCloseTo(m.separation, 10);
    });

    it("omega is 2*pi / period", () => {
      const m = computeModel(1, 4, keplerPeriod);
      expect(m.omegaRadPerYr).toBeCloseTo(2 * Math.PI / m.periodYr, 8);
    });

    it("total mass is m1 + m2", () => {
      const m = computeModel(3, 4, keplerPeriod);
      expect(m.total).toBe(1 + 3);
    });

    it("handles period callback returning NaN gracefully", () => {
      const badPeriod: PeriodCallback = () => NaN;
      const m = computeModel(1, 4, badPeriod);
      expect(m.omegaRadPerYr).toBe(0);
    });

    it("handles period callback returning zero gracefully", () => {
      const zeroPeriod: PeriodCallback = () => 0;
      const m = computeModel(1, 4, zeroPeriod);
      expect(m.omegaRadPerYr).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // bodyRadius
  // -----------------------------------------------------------------------
  describe("bodyRadius", () => {
    it("returns positive for valid inputs", () => {
      expect(bodyRadius(1, 10)).toBeGreaterThan(0);
    });

    it("monotonically increases with mass", () => {
      const r1 = bodyRadius(1, 10);
      const r2 = bodyRadius(2, 10);
      const r5 = bodyRadius(5, 10);
      expect(r2).toBeGreaterThan(r1);
      expect(r5).toBeGreaterThan(r2);
    });

    it("scales linearly with base", () => {
      const r10 = bodyRadius(1, 10);
      const r20 = bodyRadius(1, 20);
      expect(r20).toBeCloseTo(2 * r10, 8);
    });

    it("returns 0 for non-positive mass", () => {
      expect(bodyRadius(0, 10)).toBe(0);
      expect(bodyRadius(-1, 10)).toBe(0);
    });

    it("returns 0 for NaN mass", () => {
      expect(bodyRadius(NaN, 10)).toBe(0);
    });

    it("returns 0 for non-positive base", () => {
      expect(bodyRadius(1, 0)).toBe(0);
      expect(bodyRadius(1, -5)).toBe(0);
    });

    it("matches expected formula: base * (1 + 0.25 * log10(mass + 1))", () => {
      const mass = 3;
      const base = 12;
      const expected = base * (1 + 0.25 * Math.log10(mass + 1));
      expect(bodyRadius(mass, base)).toBeCloseTo(expected, 10);
    });
  });

  // -----------------------------------------------------------------------
  // bodyPositions
  // -----------------------------------------------------------------------
  describe("bodyPositions", () => {
    it("at phase=0, bodies are on the x-axis", () => {
      const { x1, y1, x2, y2 } = bodyPositions(200, 200, 50, 30, 0);
      expect(x1).toBeCloseTo(200 - 50, 10); // left of center
      expect(y1).toBeCloseTo(200, 10);
      expect(x2).toBeCloseTo(200 + 30, 10); // right of center
      expect(y2).toBeCloseTo(200, 10);
    });

    it("at phase=pi, bodies swap sides", () => {
      const { x1, y1, x2, y2 } = bodyPositions(200, 200, 50, 30, Math.PI);
      expect(x1).toBeCloseTo(200 + 50, 8); // now right of center
      expect(y1).toBeCloseTo(200, 8);
      expect(x2).toBeCloseTo(200 - 30, 8); // now left of center
      expect(y2).toBeCloseTo(200, 8);
    });

    it("at phase=pi/2, bodies are on the y-axis", () => {
      const { x1, y1, x2, y2 } = bodyPositions(200, 200, 50, 30, Math.PI / 2);
      expect(x1).toBeCloseTo(200, 8);
      expect(y1).toBeCloseTo(200 - 50, 8); // above center
      expect(x2).toBeCloseTo(200, 8);
      expect(y2).toBeCloseTo(200 + 30, 8); // below center
    });

    it("bodies are always on opposite sides of center", () => {
      for (const phase of [0, Math.PI / 4, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
        const { x1, y1, x2, y2 } = bodyPositions(100, 100, 40, 20, phase);
        // Vector from center to body1 and center to body2 should be anti-parallel
        const dx1 = x1 - 100;
        const dy1 = y1 - 100;
        const dx2 = x2 - 100;
        const dy2 = y2 - 100;
        // Dot product of unit vectors should be -1
        const mag1 = Math.hypot(dx1, dy1);
        const mag2 = Math.hypot(dx2, dy2);
        if (mag1 > 0 && mag2 > 0) {
          const dot = (dx1 * dx2 + dy1 * dy2) / (mag1 * mag2);
          expect(dot).toBeCloseTo(-1, 6);
        }
      }
    });

    it("equal radii: bodies are equidistant from center", () => {
      const { x1, y1, x2, y2 } = bodyPositions(300, 300, 60, 60, Math.PI / 3);
      const d1 = Math.hypot(x1 - 300, y1 - 300);
      const d2 = Math.hypot(x2 - 300, y2 - 300);
      expect(d1).toBeCloseTo(d2, 8);
    });
  });

  // -----------------------------------------------------------------------
  // pixelsPerUnit
  // -----------------------------------------------------------------------
  describe("pixelsPerUnit", () => {
    it("scales so larger orbit uses 38% of smaller canvas dimension", () => {
      const scale = pixelsPerUnit(3, 1, 400, 300);
      // min(400, 300) = 300; 300 * 0.38 / 3 = 38
      expect(scale).toBeCloseTo(38, 8);
    });

    it("returns 1 when both radii are zero", () => {
      expect(pixelsPerUnit(0, 0, 400, 400)).toBe(1);
    });

    it("uses the larger of r1, r2 for scaling", () => {
      const s1 = pixelsPerUnit(2, 1, 400, 400);
      const s2 = pixelsPerUnit(1, 2, 400, 400);
      expect(s1).toBeCloseTo(s2, 10);
    });

    it("uses the smaller canvas dimension", () => {
      const wide = pixelsPerUnit(2, 1, 800, 400);
      const tall = pixelsPerUnit(2, 1, 400, 800);
      expect(wide).toBeCloseTo(tall, 8);
    });
  });
});
