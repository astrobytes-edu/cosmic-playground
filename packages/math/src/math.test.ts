import { describe, expect, it } from "vitest";
import {
  clamp,
  EPS,
  findRootBisection,
  findRootNewton,
  integrateSimpson,
  integrateSimpsonSamples,
  integrateTrapz,
  interp1,
  logspace,
  linspace
} from "./math";

describe("math numerics", () => {
  describe("linspace", () => {
    it("returns evenly spaced values including endpoints", () => {
      expect(linspace(0, 1, 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });

    it("returns [min] when n < 2", () => {
      expect(linspace(3, 7, 1)).toEqual([3]);
      expect(linspace(3, 7, 0)).toEqual([3]);
    });
  });

  describe("logspace", () => {
    it("returns log-spaced values including endpoints for base 10", () => {
      expect(logspace(0, 3, 4)).toEqual([1, 10, 100, 1000]);
    });

    it("supports arbitrary bases", () => {
      expect(logspace(0, 3, 4, 2)).toEqual([1, 2, 4, 8]);
    });

    it("returns [base^minExponent] when n < 2", () => {
      expect(logspace(2, 6, 1)).toEqual([100]);
    });
  });

  describe("clamp", () => {
    it("clamps values into the closed interval", () => {
      expect(clamp(-2, 0, 10)).toBe(0);
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(99, 0, 10)).toBe(10);
    });
  });

  describe("integrateTrapz", () => {
    it("integrates smooth functions with good accuracy", () => {
      const x = linspace(0, 1, 2001);
      const area = integrateTrapz((v) => v * v, x);
      expect(area).toBeCloseTo(1 / 3, 5);
    });
  });

  describe("integrateSimpson", () => {
    it("integrates cubic polynomials exactly on uniform odd grids", () => {
      const x = linspace(0, 1, 101);
      const area = integrateSimpson((v) => v * v * v, x);
      expect(area).toBeCloseTo(0.25, 10);
    });

    it("throws when given an even number of samples", () => {
      const x = linspace(0, 1, 100);
      expect(() => integrateSimpson((v) => v, x)).toThrow(
        "Simpson requires an odd number of points >= 3"
      );
    });
  });

  describe("integrateSimpsonSamples", () => {
    it("integrates tabulated samples with Simpson weights", () => {
      const x = linspace(0, 1, 101);
      const y = x.map((v) => v * v * v);
      const area = integrateSimpsonSamples(y, x);
      expect(area).toBeCloseTo(0.25, 10);
    });
  });

  describe("findRootBisection", () => {
    it("finds a bracketed root robustly", () => {
      const root = findRootBisection((v) => v * v - 2, 1, 2, 1e-10, 128);
      expect(root).toBeCloseTo(Math.SQRT2, 8);
    });

    it("throws when root is not bracketed", () => {
      expect(() => findRootBisection((v) => v * v + 1, -1, 1)).toThrow("Root not bracketed");
    });
  });

  describe("findRootNewton", () => {
    it("converges quickly for well-behaved functions", () => {
      const root = findRootNewton((v) => v * v - 2, (v) => 2 * v, 1.5, 1e-10, 50);
      expect(root).toBeCloseTo(Math.SQRT2, 8);
    });

    it("throws when derivative is too small", () => {
      expect(() => findRootNewton((v) => v * v, () => 0, 1)).toThrow("Derivative too small");
    });
  });

  describe("interp1", () => {
    it("linearly interpolates interior values", () => {
      const x = [0, 1, 2];
      const y = [0, 10, 20];
      expect(interp1(x, y, 1.5)).toBeCloseTo(15, 8);
    });

    it("clamps to edge values outside range", () => {
      const x = [0, 1, 2];
      const y = [0, 10, 20];
      expect(interp1(x, y, -1)).toBe(0);
      expect(interp1(x, y, 3)).toBe(20);
    });

    it("throws when x/y lengths mismatch", () => {
      expect(() => interp1([0, 1], [0], 0.5)).toThrow("x/y length mismatch");
    });

    it("supports exact node queries without interpolation drift", () => {
      const x = [1, 2, 4, 8];
      const y = [10, 20, 40, 80];
      expect(Math.abs(interp1(x, y, 4) - 40)).toBeLessThan(EPS);
    });
  });
});
