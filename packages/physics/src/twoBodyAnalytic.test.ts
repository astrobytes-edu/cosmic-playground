import { describe, expect, it } from "vitest";
import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";
import { TwoBodyAnalytic } from "./twoBodyAnalytic";

describe("TwoBodyAnalytic geometry", () => {
  it("orbitalRadius matches periapsis/apapsis for ellipses", () => {
    const a = 2;
    const e = 0.25;
    const rp = a * (1 - e);
    const ra = a * (1 + e);
    expect(TwoBodyAnalytic.orbitalRadius({ a, e, thetaRad: 0 })).toBeCloseTo(rp, 12);
    expect(TwoBodyAnalytic.orbitalRadius({ a, e, thetaRad: Math.PI })).toBeCloseTo(ra, 12);
  });

  it("meanToTrueAnomaly and trueToMeanAnomaly are approximately inverse (small window)", () => {
    const e = 0.7;
    const M = 0.5;
    const theta = TwoBodyAnalytic.meanToTrueAnomalyRad({ meanAnomalyRad: M, e });
    const M2 = TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad: theta, e });
    expect(M2).toBeCloseTo(M, 10);
  });

  it("meanToTrueAnomaly is periodic in mean anomaly (M -> M + 2πk)", () => {
    const e = 0.7;
    const M = 0.5;
    const theta = TwoBodyAnalytic.meanToTrueAnomalyRad({ meanAnomalyRad: M, e });
    const theta2 = TwoBodyAnalytic.meanToTrueAnomalyRad({
      meanAnomalyRad: M + 20 * 2 * Math.PI,
      e
    });
    // The returned true anomaly is an angle; we compare via sine/cosine to avoid branch issues.
    expect(Math.cos(theta2)).toBeCloseTo(Math.cos(theta), 12);
    expect(Math.sin(theta2)).toBeCloseTo(Math.sin(theta), 12);
  });
});

describe("TwoBodyAnalytic teaching-unit relations (AU/yr/M☉)", () => {
  it("Kepler normalization: for M=1, P^2=a^3", () => {
    const p1 = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({ aAu: 1, massSolar: 1 });
    expect(p1).toBeCloseTo(1, 12);

    const p8 = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({ aAu: 8, massSolar: 1 });
    expect(p8).toBeCloseTo(Math.sqrt(512), 12);
  });

  it("circular speed at 1 AU around 1 M☉ is ~29.78 km/s", () => {
    const mu = TwoBodyAnalytic.muAu3Yr2FromMassSolar(1);
    const vAuYr = TwoBodyAnalytic.circularSpeedAuPerYr({ muAu3Yr2: mu, rAu: 1 });
    const vKms = AstroUnits.auPerYrToKmPerS(vAuYr);

    // 2π AU/yr is the circular speed at 1 AU when μ = 4π² AU³/yr².
    expect(vAuYr).toBeCloseTo(2 * Math.PI, 12);
    expect(vKms).toBeCloseTo(29.7852543656, 6);
  });

  it("synodicPeriod: Earth-Venus gives ~584 days", () => {
    const pEarth = 365.25;
    const pVenus = 224.7;
    const syn = TwoBodyAnalytic.synodicPeriod(pEarth, pVenus);
    // Expected: 365.25 * 224.7 / (365.25 - 224.7) = 583.9 days
    expect(syn).toBeCloseTo(365.25 * 224.7 / (365.25 - 224.7), 4);
  });

  it("synodicPeriod: Earth-Mars gives ~780 days", () => {
    const pEarth = 365.25;
    const pMars = 687.0;
    const syn = TwoBodyAnalytic.synodicPeriod(pEarth, pMars);
    // Expected: 365.25 * 687.0 / |365.25 - 687.0| = 779.9 days
    expect(syn).toBeCloseTo(365.25 * 687.0 / Math.abs(365.25 - 687.0), 3);
  });

  it("synodicPeriod: Earth-Jupiter gives ~399 days", () => {
    const pEarth = 365.25;
    const pJupiter = 4332.6;
    const syn = TwoBodyAnalytic.synodicPeriod(pEarth, pJupiter);
    // Expected: 365.25 * 4332.6 / |365.25 - 4332.6| = 399.0 days
    expect(syn).toBeCloseTo(365.25 * 4332.6 / Math.abs(365.25 - 4332.6), 3);
  });

  it("synodicPeriod: equal periods returns Infinity", () => {
    expect(TwoBodyAnalytic.synodicPeriod(365.25, 365.25)).toBe(Infinity);
  });

  it("synodicPeriod: non-positive input returns NaN", () => {
    expect(TwoBodyAnalytic.synodicPeriod(0, 365.25)).toBeNaN();
    expect(TwoBodyAnalytic.synodicPeriod(-1, 365.25)).toBeNaN();
    expect(TwoBodyAnalytic.synodicPeriod(365.25, NaN)).toBeNaN();
  });

  it("orbitElementsFromState detects a circular orbit at 1 AU", () => {
    const mu = AstroConstants.GRAV.G_AU3_YR2_PER_SOLAR_MASS * 1;
    const state = TwoBodyAnalytic.orbitElementsFromStateAuYr({
      rVecAu: { xAu: 1, yAu: 0 },
      vVecAuYr: { vxAuYr: 0, vyAuYr: 2 * Math.PI },
      muAu3Yr2: mu
    });
    if (state.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(state.orbitType).toBe("circular");
    expect(state.ecc).toBeLessThan(1e-8);
    expect(state.aAu).toBeCloseTo(1, 10);
  });
});
