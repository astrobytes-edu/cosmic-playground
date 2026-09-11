import { describe, expect, it } from "vitest";

import { ConservationLawsModel } from "./conservationLawsModel";

describe("ConservationLawsModel", () => {
  it("maps directionDeg=0 to pure tangential (+y)", () => {
    const v = ConservationLawsModel.velocityFromSpeedAndDirectionAuYr({ speedAuYr: 2, directionDeg: 0 });
    expect(Math.abs(v.vxAuYr - 0)).toBeLessThan(1e-12);
    expect(Math.abs(v.vyAuYr - 2)).toBeLessThan(1e-12);
  });

  it("maps directionDeg=90 to pure radial outward (+x)", () => {
    const v = ConservationLawsModel.velocityFromSpeedAndDirectionAuYr({ speedAuYr: 3, directionDeg: 90 });
    expect(Math.abs(v.vxAuYr - 3)).toBeLessThan(1e-12);
    expect(Math.abs(v.vyAuYr - 0)).toBeLessThan(1e-12);
  });

  it("returns full 0..2π domain for elliptical orbits", () => {
    const dom = ConservationLawsModel.conicTrueAnomalyDomainRad({ ecc: 0.3 });
    expect(dom.nuMin).toBe(0);
    expect(Math.abs(dom.nuMax - 2 * Math.PI)).toBeLessThan(1e-12);
  });

  it("clips hyperbolic plotting domain when rMaxAu is provided", () => {
    const dom = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: 2, pAu: 1, rMaxAu: 1 });
    expect(dom.nuMax).toBeGreaterThan(1);
    expect(dom.nuMax).toBeLessThan(2.1);
    expect(Math.abs(dom.nuMin + dom.nuMax)).toBeLessThan(1e-12);
  });

  it("samples a circular orbit when ecc=0 (sanity)", () => {
    const pts = ConservationLawsModel.sampleConicOrbitAu({
      ecc: 0,
      pAu: 2,
      omegaRad: 0,
      numPoints: 60,
      rMaxAu: 5
    });
    expect(pts.length).toBeGreaterThan(10);
    for (const p of pts) {
      const r = Math.hypot(p.xAu, p.yAu);
      expect(Math.abs(r - 2)).toBeLessThan(1e-6);
    }
  });
});

describe("ConservationLawsModel conic helpers", () => {
  const mu = 4 * Math.PI * Math.PI;

  it("orbitalRadiusAu: periapsis at nu = 0, apoapsis at nu = pi, NaN past the asymptote", () => {
    expect(ConservationLawsModel.orbitalRadiusAu({ ecc: 0.5, pAu: 1, nuRad: 0 })).toBeCloseTo(1 / 1.5, 12);
    expect(ConservationLawsModel.orbitalRadiusAu({ ecc: 0.5, pAu: 1, nuRad: Math.PI })).toBeCloseTo(2, 12);
    expect(ConservationLawsModel.orbitalRadiusAu({ ecc: 2, pAu: 1, nuRad: Math.acos(-0.5) })).toBeNaN();
  });

  it("conicPositionAndTangentAu: omega rotates the orbit, tangent is perpendicular on a circle", () => {
    const rot = ConservationLawsModel.conicPositionAndTangentAu({ ecc: 0, pAu: 2, omegaRad: Math.PI / 2, nuRad: 0 });
    expect(rot!.xAu).toBeCloseTo(0, 12);
    expect(rot!.yAu).toBeCloseTo(2, 12);
    const p = ConservationLawsModel.conicPositionAndTangentAu({ ecc: 0, pAu: 2, omegaRad: 0, nuRad: Math.PI / 4 });
    expect(p!.xAu * p!.dxAu + p!.yAu * p!.dyAu).toBeCloseTo(0, 10);
    expect(ConservationLawsModel.conicPositionAndTangentAu({ ecc: -1, pAu: 1, omegaRad: 0, nuRad: 0 })).toBeNull();
  });

  it("instantaneousSpeedAuPerYr: circular speed everywhere on a circle, faster at periapsis", () => {
    const h = 2 * Math.PI;
    expect(ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: mu, hAbsAu2Yr: h, ecc: 0, nuRad: 2 })).toBeCloseTo(2 * Math.PI, 10);
    const hEll = 0.75 * 2 * Math.PI;
    const vPeri = ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: mu, hAbsAu2Yr: hEll, ecc: 0.4375, nuRad: 0 });
    const vApo = ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: mu, hAbsAu2Yr: hEll, ecc: 0.4375, nuRad: Math.PI });
    expect(vPeri).toBeCloseTo(12.042772, 5);
    expect(vApo).toBeCloseTo(0.75 * 2 * Math.PI, 10);
  });

  it("specificEnergyPartsAu2Yr2: K = v^2/2, U = -mu/r, eps = K + U", () => {
    const parts = ConservationLawsModel.specificEnergyPartsAu2Yr2({ rAu: 1, vAuYr: 0.75 * 2 * Math.PI, muAu3Yr2: mu });
    expect(parts.kAu2Yr2).toBeCloseTo(11.103305, 5);
    expect(parts.uAu2Yr2).toBeCloseTo(-39.478418, 5);
    expect(parts.epsAu2Yr2).toBeCloseTo(-28.375113, 5);
  });

  it("K + U is the same at every point of an asymmetric orbit (conservation)", () => {
    const muHere = mu * 10 ** 0.4;
    const ecc = 0.526379;
    const pAu = 0.304471;
    const hAbsAu2Yr = Math.sqrt(muHere * pAu);
    const epsAt = (nuRad: number) => {
      const rAu = ConservationLawsModel.orbitalRadiusAu({ ecc, pAu, nuRad });
      const vAuYr = ConservationLawsModel.instantaneousSpeedAuPerYr({ muAu3Yr2: muHere, hAbsAu2Yr, ecc, nuRad });
      return ConservationLawsModel.specificEnergyPartsAu2Yr2({ rAu, vAuYr, muAu3Yr2: muHere }).epsAu2Yr2;
    };
    const eps0 = epsAt(0.3);
    for (const nu of [1.1, 2.2, 3.3, 4.4, 5.5]) {
      expect(epsAt(nu)).toBeCloseTo(eps0, 9);
    }
  });
});

describe("ConservationLawsModel.initialOrbit", () => {
  const at = (o: ReturnType<typeof ConservationLawsModel.initialOrbit>) => {
    if (o.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    return o;
  };
  const startPoint = (o: ReturnType<typeof at>) =>
    ConservationLawsModel.conicPositionAndTangentAu({ ecc: o.ecc, pAu: o.pAu, omegaRad: o.omegaRad, nuRad: o.nu0Rad })!;

  it("elliptical preset starts where the student put it: r0 on +x, at apoapsis", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0.75, directionDeg: 0 }));
    expect(o.orbitType).toBe("elliptical");
    expect(o.nu0Rad).toBeCloseTo(Math.PI, 12);
    expect(startPoint(o).xAu).toBeCloseTo(1, 12);
    expect(startPoint(o).yAu).toBeCloseTo(0, 12);
    expect(o.rpAu).toBeCloseTo(0.391304, 6);
    expect(o.raAu).toBeCloseTo(1, 12);
    expect(o.vPeriAuYr).toBeCloseTo(12.042772, 5);
  });

  it("the start speed is the speed that was set, not the periapsis speed", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.2, directionDeg: 60 }));
    const vStart = ConservationLawsModel.instantaneousSpeedAuPerYr({
      muAu3Yr2: o.muAu3Yr2, hAbsAu2Yr: o.hAbsAu2Yr, ecc: o.ecc, nuRad: o.nu0Rad
    });
    expect(vStart).toBeCloseTo(1.2 * 2 * Math.PI, 10);
    expect(o.nu0Rad).toBeCloseTo(2.369222, 5);
    expect(o.raAu).toBeCloseTo(3.381308, 5);
  });

  it("an inward asymmetric start reproduces r0 and wraps nu0 into [0, 2pi)", () => {
    const r0Au = 10 ** -0.3;
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 10 ** 0.4, r0Au, speedFactor: 0.9, directionDeg: -30 }));
    expect(o.nu0Rad).toBeCloseTo(3.870864, 5);
    expect(startPoint(o).xAu).toBeCloseTo(r0Au, 10);
    expect(startPoint(o).yAu).toBeCloseTo(0, 10);
    expect(o.vPeriAuYr).toBeCloseTo(27.546673, 4);
  });

  it("speedFactor = Math.SQRT2 is exactly parabolic with no apoapsis", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: Math.SQRT2, directionDeg: 0 }));
    expect(o.orbitType).toBe("parabolic");
    expect(Math.abs(o.epsAu2Yr2)).toBeLessThan(1e-12);
    expect(o.raAu).toBe(Number.POSITIVE_INFINITY);
  });

  it("the slider's nearest values are honestly bound and unbound", () => {
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.41, directionDeg: 0 }).orbitType).toBe("elliptical");
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.42, directionDeg: 0 }).orbitType).toBe("hyperbolic");
  });

  it("speed factor 0 is radial and bound, with no periapsis speed", () => {
    const o = at(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0, directionDeg: 0 }));
    expect(o.orbitType).toBe("radial");
    expect(o.epsAu2Yr2).toBeCloseTo(-4 * Math.PI * Math.PI, 10);
    expect(o.vPeriAuYr).toBe(0);
    expect(o.raAu).toBeCloseTo(1, 12);
  });

  it("rejects a non-positive radius or mass", () => {
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 0, speedFactor: 1, directionDeg: 0 }).orbitType).toBe("invalid");
    expect(ConservationLawsModel.initialOrbit({ massSolar: 0, r0Au: 1, speedFactor: 1, directionDeg: 0 }).orbitType).toBe("invalid");
  });

  it("an exact Escape after a mass change stays open (e = 1, plot domain inside pi)", () => {
    const o = ConservationLawsModel.initialOrbit({ massSolar: 10 ** -0.96, r0Au: 1, speedFactor: Math.SQRT2, directionDeg: 0 });
    if (o.orbitType === "invalid") throw new Error("invalid");
    expect(o.orbitType).toBe("parabolic");
    expect(o.ecc).toBe(1);
    const dom = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: o.ecc, pAu: o.pAu, rMaxAu: 6 });
    expect(dom.nuMax).toBeLessThan(Math.PI);
  });

  it("rejects a clockwise start, which the conic helpers cannot place", () => {
    expect(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 1.2, directionDeg: 120 }).orbitType).toBe("invalid");
  });
});

