import { describe, expect, test } from "vitest";
import { RetrogradeMotionModel } from "./retrogradeMotionModel";

describe("RetrogradeMotionModel.solveEccentricAnomalyRad", () => {
  test("satisfies Kepler equation residual", () => {
    const e = 0.3;
    const M = 1.234;
    const E = RetrogradeMotionModel.solveEccentricAnomalyRad({
      meanAnomalyRad: M,
      eccentricity: e
    });
    const resid = E - e * Math.sin(E) - M;
    expect(Math.abs(resid)).toBeLessThan(1e-10);
  });

  test("circular limit: e=0 gives E≈M", () => {
    const e = 0;
    const M = 2.0;
    const E = RetrogradeMotionModel.solveEccentricAnomalyRad({
      meanAnomalyRad: M,
      eccentricity: e
    });
    expect(Math.abs(E - M)).toBeLessThan(1e-12);
  });

  test("bisection fallback produces a valid solution", () => {
    const e = 0.95;
    const M = 5.8;
    const E = RetrogradeMotionModel.solveEccentricAnomalyRad({
      meanAnomalyRad: M,
      eccentricity: e,
      maxIterations: 0
    });
    const resid = E - e * Math.sin(E) - M;
    expect(Math.abs(resid)).toBeLessThan(1e-10);
  });
});

describe("RetrogradeMotionModel.orbitStateAtModelDay", () => {
  test("circular orbit stays at r=a and advances linearly in angle", () => {
    const elements = { aAu: 1, e: 0, varpiDeg: 0, L0Deg: 0 } as const;
    const t0Day = 0;

    const st0 = RetrogradeMotionModel.orbitStateAtModelDay({
      elements,
      t0Day,
      tDay: 0
    });
    expect(Math.abs(st0.rAu - 1)).toBeLessThan(1e-12);
    expect(Math.abs(st0.xAu - 1)).toBeLessThan(1e-12);
    expect(Math.abs(st0.yAu - 0)).toBeLessThan(1e-12);

    // After one "mechanics year" (as defined by AstroConstants), Earth-like orbit returns near start.
    const yearDays = RetrogradeMotionModel.modelYearDays();
    const st1 = RetrogradeMotionModel.orbitStateAtModelDay({
      elements,
      t0Day,
      tDay: yearDays
    });
    expect(Math.abs(st1.rAu - 1)).toBeLessThan(1e-10);
    expect(Math.abs(st1.xAu - 1)).toBeLessThan(1e-6);
    expect(Math.abs(st1.yAu - 0)).toBeLessThan(1e-6);
  });
});

describe("RetrogradeMotionModel.unwrapDeg180", () => {
  test("produces continuous series across 360 wrap", () => {
    const wrapped = [350, 355, 2, 5];
    const unwrapped = RetrogradeMotionModel.unwrapDeg180(wrapped);
    expect(unwrapped).toEqual([350, 355, 362, 365]);
  });

  test("keeps tie-case continuity near 180-degree jumps", () => {
    const wrapped = [10, 170, 350, 170];
    const unwrapped = RetrogradeMotionModel.unwrapDeg180(wrapped);
    for (let i = 1; i < unwrapped.length; i++) {
      expect(Math.abs(unwrapped[i] - unwrapped[i - 1])).toBeLessThanOrEqual(180);
    }
  });

  test("window-shifted samples stay locally continuous", () => {
    const wrappedA = [359, 1, 3, 5, 7, 9];
    const wrappedB = [1, 3, 5, 7, 9, 11];
    const unwrapA = RetrogradeMotionModel.unwrapDeg180(wrappedA);
    const unwrapB = RetrogradeMotionModel.unwrapDeg180(wrappedB);
    for (let i = 1; i < unwrapA.length; i++) {
      expect(Math.abs(unwrapA[i] - unwrapA[i - 1])).toBeLessThan(30);
    }
    for (let i = 1; i < unwrapB.length; i++) {
      expect(Math.abs(unwrapB[i] - unwrapB[i - 1])).toBeLessThan(30);
    }
  });
});

describe("RetrogradeMotionModel.centralDifferenceDegPerDay", () => {
  test("matches constant slope for a linear series", () => {
    const dt = 0.25;
    const t = [0, 0.25, 0.5, 0.75, 1.0];
    const y = t.map((ti) => 10 + 3 * ti); // dy/dt = 3
    const dydt = RetrogradeMotionModel.centralDifferenceDegPerDay({ yDeg: y, dtDay: dt });
    expect(dydt.length).toBe(y.length);
    // Endpoints are one-sided; interior should be exact for linear data.
    for (let i = 1; i < y.length - 1; i++) {
      expect(Math.abs(dydt[i] - 3)).toBeLessThan(1e-12);
    }
  });
});

describe("RetrogradeMotionModel.computeSeries", () => {
  test("Earth->Mars has a retrograde interval with stationary points", () => {
    const series = RetrogradeMotionModel.computeSeries({
      observer: "Earth",
      target: "Mars",
      windowStartDay: 0,
      windowMonths: 24
    });
    expect(series.dtInternalDay).toBeCloseTo(0.25);
    expect(series.timesDay.length).toBeGreaterThan(10);
    expect(series.stationaryDays.length).toBeGreaterThanOrEqual(2);
    expect(series.retrogradeIntervals.length).toBeGreaterThanOrEqual(1);

    for (const interval of series.retrogradeIntervals) {
      expect(interval.startDay).toBeLessThan(interval.endDay);
    }
  });

  test("Earth->Venus has a retrograde interval", () => {
    const series = RetrogradeMotionModel.computeSeries({
      observer: "Earth",
      target: "Venus",
      windowStartDay: 0,
      windowMonths: 24
    });
    expect(series.retrogradeIntervals.length).toBeGreaterThanOrEqual(1);
  });
});
