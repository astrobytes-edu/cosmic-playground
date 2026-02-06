import { describe, expect, test } from "vitest";
import { KeplersLawsModel } from "./keplersLawsModel";

describe("KeplersLawsModel (AU / yr / M☉ teaching units)", () => {
  test("Earth-like benchmark: P≈1 yr at a=1 AU, M=1 M☉", () => {
    const p = KeplersLawsModel.orbitalPeriodYr({ aAu: 1, centralMassSolar: 1 });
    expect(p).toBeGreaterThan(0.98);
    expect(p).toBeLessThan(1.02);
  });

  test("Period scales as a^(3/2) at fixed mass", () => {
    const p1 = KeplersLawsModel.orbitalPeriodYr({ aAu: 1, centralMassSolar: 1 });
    const p8 = KeplersLawsModel.orbitalPeriodYr({ aAu: 8, centralMassSolar: 1 });
    expect(p1).toBeGreaterThan(0);
    expect(p8 / p1).toBeGreaterThan(22.0);
    expect(p8 / p1).toBeLessThan(23.3);
  });

  test("Period scales as M^(-1/2) at fixed a", () => {
    const p1 = KeplersLawsModel.orbitalPeriodYr({ aAu: 4, centralMassSolar: 1 });
    const p4 = KeplersLawsModel.orbitalPeriodYr({ aAu: 4, centralMassSolar: 4 });
    expect(p4 / p1).toBeGreaterThan(0.49);
    expect(p4 / p1).toBeLessThan(0.51);
  });

  test("Ellipse limiting case: e=0 gives rp=ra=a", () => {
    const { perihelionAu, aphelionAu } = KeplersLawsModel.orbitExtremaAu({
      aAu: 2,
      e: 0
    });
    expect(perihelionAu).toBeCloseTo(2, 12);
    expect(aphelionAu).toBeCloseTo(2, 12);
  });

  test("Speed is higher at perihelion than aphelion for e>0", () => {
    const params = { aAu: 2, e: 0.6, centralMassSolar: 1 };
    const peri = KeplersLawsModel.stateAtMeanAnomalyRad({
      ...params,
      meanAnomalyRad: 0
    });
    const aph = KeplersLawsModel.stateAtMeanAnomalyRad({
      ...params,
      meanAnomalyRad: Math.PI
    });
    expect(peri.rAu).toBeLessThan(aph.rAu);
    expect(peri.speedAuPerYr).toBeGreaterThan(aph.speedAuPerYr);
  });

  test("clamps eccentricity to 0.99 (legacy max)", () => {
    expect(KeplersLawsModel.clampEccentricity(0.999)).toBeCloseTo(0.99, 12);
  });

  test("returns conservation quantities for a circular orbit", () => {
    const st = KeplersLawsModel.stateAtMeanAnomalyRad({
      aAu: 1,
      e: 0,
      centralMassSolar: 1,
      meanAnomalyRad: 0
    });

    expect(st.accelAuPerYr2).toBeGreaterThan(39);
    expect(st.accelAuPerYr2).toBeLessThan(40);
    expect(st.specificEnergyAu2Yr2).toBeCloseTo(-2 * Math.PI * Math.PI, 8);
    expect(st.specificAngularMomentumAu2Yr).toBeCloseTo(2 * Math.PI, 8);
    expect(st.arealVelocityAu2Yr).toBeCloseTo(Math.PI, 8);
  });
});
