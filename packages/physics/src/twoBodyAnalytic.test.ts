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

describe("orbitElementsFromStateAuYr at the edges and off-axis", () => {
  const mu = 4 * Math.PI * Math.PI;
  const state = (r0Au: number, speedAuYr: number, directionDeg: number) => {
    const a = (directionDeg * Math.PI) / 180;
    return {
      rVecAu: { xAu: r0Au, yAu: 0 },
      vVecAuYr: { vxAuYr: speedAuYr * Math.sin(a), vyAuYr: speedAuYr * Math.cos(a) }
    };
  };

  it("a body at rest is radial and bound, not parabolic", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 0, 0), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("radial");
    expect(el.epsAu2Yr2).toBeCloseTo(-mu, 10);
    expect(el.hAbsAu2Yr).toBe(0);
  });

  it("purely radial outward motion is radial", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 3, 90), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("radial");
  });

  it("exact escape speed, tangential, is parabolic with zero energy", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 2 * Math.PI * Math.SQRT2, 0), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("parabolic");
    expect(Math.abs(el.epsAu2Yr2)).toBeLessThan(1e-12);
  });

  it("a start below circular speed is at apoapsis (nu = pi)", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 0.75 * 2 * Math.PI, 0), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(Math.cos(el.nuRad)).toBeCloseTo(-1, 12);
  });

  it("an outward start (f = 1.2, +60 deg) is past periapsis", () => {
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(1, 1.2 * 2 * Math.PI, 60), muAu3Yr2: mu });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.orbitType).toBe("elliptical");
    expect(el.ecc).toBeCloseTo(0.893532, 5);
    expect(el.epsAu2Yr2).toBeCloseTo(-11.053957, 5);
    expect(el.nuRad).toBeCloseTo(2.369222, 5);
  });

  it("an inward start at an asymmetric state has negative true anomaly", () => {
    const massSolar = 10 ** 0.4;
    const r0Au = 10 ** -0.3;
    const muHere = mu * massSolar;
    const v = 0.9 * Math.sqrt(muHere / r0Au);
    const el = TwoBodyAnalytic.orbitElementsFromStateAuYr({ ...state(r0Au, v, -30), muAu3Yr2: muHere });
    if (el.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    expect(el.ecc).toBeCloseTo(0.526379, 5);
    expect(el.epsAu2Yr2).toBeCloseTo(-117.727169, 4);
    expect(el.hAbsAu2Yr).toBeCloseTo(5.494814, 5);
    expect(el.nuRad).toBeCloseTo(-2.412321, 5);
  });
});
