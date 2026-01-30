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

