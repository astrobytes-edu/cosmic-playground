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

describe("ConservationLawsModel.sampleConicArcAu", () => {
  const maxStep = Math.PI / 90;
  const angleBetween = (a: { xAu: number; yAu: number }, b: { xAu: number; yAu: number }) =>
    Math.abs(Math.atan2(a.xAu * b.yAu - a.yAu * b.xAu, a.xAu * b.xAu + a.yAu * b.yAu));

  it("a quarter circle (p = 1, omega = 0, nu 0 to pi/2) runs from (1, 0) to (0, 1) in steps of at most 2 deg", () => {
    const pts = ConservationLawsModel.sampleConicArcAu({ ecc: 0, pAu: 1, omegaRad: 0, nuFromRad: 0, nuToRad: Math.PI / 2 });
    expect(pts.length).toBeGreaterThan(2);
    expect(pts[0].xAu).toBeCloseTo(1, 12);
    expect(pts[0].yAu).toBeCloseTo(0, 12);
    expect(pts[pts.length - 1].xAu).toBeCloseTo(0, 12);
    expect(pts[pts.length - 1].yAu).toBeCloseTo(1, 12);
    for (const p of pts) expect(Math.hypot(p.xAu, p.yAu)).toBeCloseTo(1, 12);
    for (let i = 1; i < pts.length; i++) expect(angleBetween(pts[i - 1], pts[i])).toBeLessThanOrEqual(maxStep + 1e-12);
  });

  it("a closed arc from 6.0 to 0.2 rad runs forward through periapsis, on the conic (e = 0.5, p = 1)", () => {
    const ecc = 0.5;
    const pAu = 1;
    const delta = 0.2 + 2 * Math.PI - 6.0;
    const pts = ConservationLawsModel.sampleConicArcAu({ ecc, pAu, omegaRad: 0, nuFromRad: 6.0, nuToRad: 0.2 });
    expect(pts).toHaveLength(Math.ceil(delta / maxStep) + 1);
    const nus = pts.map((p) => Math.atan2(p.yAu, p.xAu));
    for (let i = 0; i < pts.length; i++) {
      expect(Math.hypot(pts[i].xAu, pts[i].yAu)).toBeCloseTo(pAu / (1 + ecc * Math.cos(nus[i])), 12);
    }
    expect(nus[0]).toBeCloseTo(6.0 - 2 * Math.PI, 12);
    expect(nus[nus.length - 1]).toBeCloseTo(0.2, 12);
    // Forward: the recovered anomaly rises through 0 rather than falling the long way round.
    for (let i = 1; i < nus.length; i++) expect(nus[i]).toBeGreaterThan(nus[i - 1]);
  });

  it("a near-full forward sweep at e = 0.9999 (nu 0.01 to 0.0, about 2 pi) gives at least 180 points", () => {
    const pts = ConservationLawsModel.sampleConicArcAu({ ecc: 0.9999, pAu: 1, omegaRad: 0, nuFromRad: 0.01, nuToRad: 0 });
    expect(pts.length).toBeGreaterThanOrEqual(180);
  });

  it("an open orbit (e = 1.5) samples a forward arc and returns nothing for a backward one", () => {
    const forward = ConservationLawsModel.sampleConicArcAu({ ecc: 1.5, pAu: 1, omegaRad: 0, nuFromRad: -1, nuToRad: 1 });
    expect(forward.length).toBeGreaterThan(2);
    expect(Math.atan2(forward[0].yAu, forward[0].xAu)).toBeCloseTo(-1, 12);
    expect(Math.atan2(forward[forward.length - 1].yAu, forward[forward.length - 1].xAu)).toBeCloseTo(1, 12);
    expect(ConservationLawsModel.sampleConicArcAu({ ecc: 1.5, pAu: 1, omegaRad: 0, nuFromRad: 1, nuToRad: -1 })).toEqual([]);
  });

  it("returns nothing for invalid input", () => {
    const base = { ecc: 0.5, pAu: 1, omegaRad: 0, nuFromRad: 0, nuToRad: 1 };
    expect(ConservationLawsModel.sampleConicArcAu({ ...base, ecc: -0.1 })).toEqual([]);
    expect(ConservationLawsModel.sampleConicArcAu({ ...base, pAu: 0 })).toEqual([]);
    expect(ConservationLawsModel.sampleConicArcAu({ ...base, nuToRad: Number.NaN })).toEqual([]);
    expect(ConservationLawsModel.sampleConicArcAu({ ...base, maxStepRad: 0 })).toEqual([]);
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

describe("ConservationLawsModel.advanceTrueAnomalyByTime", () => {
  const valid = (o: ReturnType<typeof ConservationLawsModel.initialOrbit>) => {
    if (o.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    return o;
  };

  describe("a bound orbit at speed factor 0.3 (e = 0.91, starts at apoapsis)", () => {
    const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0.3, directionDeg: 0 }));
    // Kepler's third law: T = 2 pi sqrt(a^3 / mu), with a = p / (1 - e^2).
    const aAu = o.pAu / (1 - o.ecc * o.ecc);
    const periodYr = 2 * Math.PI * Math.sqrt((aAu * aAu * aAu) / o.muAu3Yr2);
    const advance = (nuRad: number, dtYr: number) =>
      ConservationLawsModel.advanceTrueAnomalyByTime({
        nuRad,
        ecc: o.ecc,
        pAu: o.pAu,
        hAbsAu2Yr: o.hAbsAu2Yr,
        muAu3Yr2: o.muAu3Yr2,
        dtYr,
        nuMax: 2 * Math.PI
      });

    it("one Kepler period (0.378834 yr) in a single call returns to the start", () => {
      expect(o.ecc).toBeCloseTo(0.91, 12);
      expect(periodYr).toBeCloseTo(0.378834, 5);
      const step = advance(o.nu0Rad, periodYr);
      expect(step.stopped).toBe(false);
      // Compare cos and sin: the start is at nu = pi, where a wrapped angle may land on either side.
      expect(Math.abs(Math.cos(step.nuRad) - Math.cos(o.nu0Rad))).toBeLessThan(1e-9);
      expect(Math.abs(Math.sin(step.nuRad) - Math.sin(o.nu0Rad))).toBeLessThan(1e-9);
    });

    it("half a period from periapsis lands at apoapsis", () => {
      const step = advance(0, periodYr / 2);
      expect(Math.abs(Math.cos(step.nuRad) + 1)).toBeLessThan(1e-9);
    });

    it("a quarter period from periapsis lands at nu = 2.939665, not pi/2 (asymmetric point)", () => {
      // Mean anomaly pi/2. Newton on M = E - e sin E gives E = 2.268277, then
      // nu = 2 atan(sqrt((1 + e)/(1 - e)) tan(E/2)). A uniform angular rate would give pi/2.
      const step = advance(0, periodYr / 4);
      expect(step.stopped).toBe(false);
      expect(step.nuRad).toBeCloseTo(2.939665, 5);
    });

    it("300 equal steps summing to one period return to the start", () => {
      let nu = o.nu0Rad;
      for (let i = 0; i < 300; i++) nu = advance(nu, periodYr / 300).nuRad;
      const wrappedDiff = Math.atan2(Math.sin(nu - o.nu0Rad), Math.cos(nu - o.nu0Rad));
      expect(Math.abs(wrappedDiff)).toBeLessThan(1e-6);
    });
  });

  it("an exact Escape runs from periapsis to r = 6 AU in Barker's time, then stops there", () => {
    const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: Math.SQRT2, directionDeg: 0 }));
    expect(o.ecc).toBe(1);
    expect(o.pAu).toBeCloseTo(2, 12);
    // r = p / (1 + cos nu) = 6 AU at cos nu = -2/3.
    const nuMax = Math.acos(-2 / 3);
    const dtYr = 0.02 / 3;
    let nu = 0;
    let elapsedYr = 0;
    let stopped = false;
    for (let i = 0; i < 10000 && !stopped; i++) {
      const step = ConservationLawsModel.advanceTrueAnomalyByTime({
        nuRad: nu,
        ecc: o.ecc,
        pAu: o.pAu,
        hAbsAu2Yr: o.hAbsAu2Yr,
        muAu3Yr2: o.muAu3Yr2,
        dtYr,
        nuMax
      });
      nu = step.nuRad;
      stopped = step.stopped;
      elapsedYr += dtYr;
    }
    // Barker's equation: t = (1/2) sqrt(p^3 / mu) (D + D^3 / 3), with D = tan(nu / 2) = sqrt(5).
    const D = Math.tan(nuMax / 2);
    const barkerYr = 0.5 * Math.sqrt(o.pAu ** 3 / o.muAu3Yr2) * (D + D ** 3 / 3);
    expect(D).toBeCloseTo(Math.sqrt(5), 12);
    expect(barkerYr).toBeCloseTo(1.342112, 5);
    expect(stopped).toBe(true);
    expect(Math.abs(elapsedYr - barkerYr) / barkerYr).toBeLessThan(0.01);
    expect(nu).toBe(nuMax);
  });

  describe("a near-radial hyperbolic pass (M = 0.1, r0 = 0.1 AU, speed factor 1.8, direction +/-85 deg)", () => {
    // The demo's old 1.5 AU view floor. Its floor is now 1.5 r0, which puts this orbit's edge at 6 r0 = 0.6 AU;
    // the test keeps the longer pass to 1.5 AU, and the Kepler times below are for that edge.
    const rMaxAu = 1.5;
    // One animation frame: 1/60 s at the demo's 1/3 yr of orbital time per second.
    const frameYr = (1 / 60) * (1 / 3);
    // Time from nu0 to the view edge, computed independently in Python from the hyperbolic Kepler equation:
    //   a = p / (e^2 - 1), F(nu) = sign(nu) acosh((e + cos nu) / (1 + e cos nu)),
    //   t(nu) = sqrt(a^3 / mu) (e sinh F - F), elapsed = t(nuMax) - t(nu0).
    // Simpson quadrature of dt = (r^2 / h) dnu over the same range agrees to 2e-11.
    const cases = [
      { directionDeg: 85, keplerYr: 0.176959125 },
      { directionDeg: -85, keplerYr: 0.190052887 }
    ];

    it("reaches the view edge within 1% of Kepler's time in the worse direction", () => {
      const relErrors = cases.map(({ directionDeg, keplerYr }) => {
        const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 0.1, r0Au: 0.1, speedFactor: 1.8, directionDeg }));
        expect(o.orbitType).toBe("hyperbolic");
        const { nuMax } = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: o.ecc, pAu: o.pAu, rMaxAu });
        const advance = (nuRad: number, dtYr: number) =>
          ConservationLawsModel.advanceTrueAnomalyByTime({
            nuRad,
            ecc: o.ecc,
            pAu: o.pAu,
            hAbsAu2Yr: o.hAbsAu2Yr,
            muAu3Yr2: o.muAu3Yr2,
            dtYr,
            nuMax
          });
        let nu = o.nu0Rad;
        let elapsedYr = 0;
        let stopped = false;
        for (let i = 0; i < 1000 && !stopped; i++) {
          const step = advance(nu, frameYr);
          if (!step.stopped) {
            nu = step.nuRad;
            elapsedYr += frameYr;
            continue;
          }
          // Count only the part of the last frame used before the stop: one whole frame is 3% of this trip,
          // more than the tolerance. The nu reached grows with the time step, so bisection finds it.
          let lo = 0;
          let hi = frameYr;
          for (let k = 0; k < 50; k++) {
            const mid = 0.5 * (lo + hi);
            if (advance(nu, mid).stopped) hi = mid;
            else lo = mid;
          }
          elapsedYr += hi;
          stopped = true;
        }
        expect(stopped).toBe(true);
        return (elapsedYr - keplerYr) / keplerYr;
      });
      const worst = Math.max(...relErrors.map(Math.abs));
      expect(worst, `relative timing errors (+85, -85): ${relErrors.map((x) => x.toFixed(5)).join(", ")}`).toBeLessThan(0.01);
    });
  });
});

describe("ConservationLawsModel orbital time: the period of a bound orbit and the time to the view edge", () => {
  const valid = (o: ReturnType<typeof ConservationLawsModel.initialOrbit>) => {
    if (o.orbitType === "invalid") throw new Error("unexpected invalid orbit");
    return o;
  };

  it("orbitalPeriodYr: the Elliptical preset (M = 1, r0 = 1 AU, speed factor 0.75) takes 0.580214 yr", () => {
    // a = p / (1 - e^2) = 0.5625 / (1 - 0.4375^2) = 0.695652 AU, and T = 2 pi sqrt(a^3 / mu) = a^(3/2) yr at M = 1.
    const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0.75, directionDeg: 0 }));
    expect(ConservationLawsModel.orbitalPeriodYr({ ecc: o.ecc, pAu: o.pAu, muAu3Yr2: o.muAu3Yr2 })).toBeCloseTo(0.580214, 5);
  });

  it("timeBetweenTrueAnomaliesYr: an exact Escape at M = 1 (p = 2 AU, e = 1) takes 1.342112 yr from nu = 0 to acos(-2/3)", () => {
    const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: Math.SQRT2, directionDeg: 0 }));
    expect(o.ecc).toBe(1);
    expect(o.pAu).toBeCloseTo(2, 12);
    const yr = ConservationLawsModel.timeBetweenTrueAnomaliesYr({
      ecc: o.ecc,
      pAu: o.pAu,
      muAu3Yr2: o.muAu3Yr2,
      nuFromRad: 0,
      nuToRad: Math.acos(-2 / 3)
    });
    expect(yr).toBeCloseTo(1.342112, 5);
  });

  describe("a near-radial hyperbolic pass (M = 0.1, r0 = 0.1 AU, speed factor 1.8, direction -85 deg)", () => {
    const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 0.1, r0Au: 0.1, speedFactor: 1.8, directionDeg: -85 }));
    // Expected times computed independently in Python: the hyperbolic Kepler equation, scipy quadrature of
    // dt = (r^2 / h) dnu, and an ODE integration of dnu/dt = h / r^2 all agree to 1e-9 yr.
    const toEdge = (rMaxAu: number) => {
      const { nuMax } = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: o.ecc, pAu: o.pAu, rMaxAu });
      const yr = ConservationLawsModel.timeBetweenTrueAnomaliesYr({
        ecc: o.ecc,
        pAu: o.pAu,
        muAu3Yr2: o.muAu3Yr2,
        nuFromRad: o.nu0Rad,
        nuToRad: nuMax
      });
      return { nuMax, yr };
    };

    it("takes 0.190053 yr from its start to a 1.5 AU edge", () => {
      expect(o.orbitType).toBe("hyperbolic");
      expect(toEdge(1.5).yr).toBeCloseTo(0.190053, 5);
    });

    it("takes 0.070763 yr to the demo's 6 r0 = 0.6 AU edge", () => {
      expect(toEdge(0.6).yr).toBeCloseTo(0.070763, 5);
    });

    it("stepping advanceTrueAnomalyByTime to the 0.6 AU edge takes the same time within 0.1%", () => {
      const { nuMax, yr } = toEdge(0.6);
      const advance = (nuRad: number, dtYr: number) =>
        ConservationLawsModel.advanceTrueAnomalyByTime({
          nuRad,
          ecc: o.ecc,
          pAu: o.pAu,
          hAbsAu2Yr: o.hAbsAu2Yr,
          muAu3Yr2: o.muAu3Yr2,
          dtYr,
          nuMax
        });
      // 90 equal steps: one 60 Hz frame each when the trip is shown in 1.5 s.
      const stepYr = yr / 90;
      let nu = o.nu0Rad;
      let elapsedYr = 0;
      let stopped = false;
      for (let i = 0; i < 1000 && !stopped; i++) {
        const step = advance(nu, stepYr);
        if (!step.stopped) {
          nu = step.nuRad;
          elapsedYr += stepYr;
          continue;
        }
        // Count only the part of the last step used before the stop; the nu reached grows with the step.
        let lo = 0;
        let hi = stepYr;
        for (let k = 0; k < 50; k++) {
          const mid = 0.5 * (lo + hi);
          if (advance(nu, mid).stopped) hi = mid;
          else lo = mid;
        }
        elapsedYr += hi;
        stopped = true;
      }
      expect(stopped).toBe(true);
      expect(Math.abs(elapsedYr - yr) / yr, `stepped ${elapsedYr} yr, Kepler ${yr} yr`).toBeLessThan(0.001);
    });
  });

  describe("a short arc through periapsis with e just above 1 (L1)", () => {
    // p = 0.01 AU, mu = 4 pi^2 x 0.1, nu from -0.001 to 0.001 rad. References computed in Python with mpmath at
    // 50 digits from these exact float64 inputs, two ways that agree to 1e-43: the hyperbolic Kepler equation
    // with F = 2 atanh(sqrt((e - 1)/(e + 1)) tan(nu / 2)), and quadrature of dt = (r^2 / h) dnu.
    // The acosh form of F was off by 1.2e-2 at e - 1 = 1e-8 and 1.7e-6 at e - 1 = 1e-4.
    const pAu = 0.01;
    const muAu3Yr2 = 4 * Math.PI * Math.PI * 0.1;
    const cases = [
      { label: "1 + 1e-8", ecc: 1 + 1e-8, referenceYr: 2.516460999469918e-7 },
      { label: "1 + 1e-4", ecc: 1 + 1e-4, referenceYr: 2.51620939742523e-7 }
    ];

    for (const { label, ecc, referenceYr } of cases) {
      it(`e = ${label}: agrees with the 50-digit reference to 1e-9 relative, and reversing the arc flips the sign`, () => {
        const yr = ConservationLawsModel.timeBetweenTrueAnomaliesYr({ ecc, pAu, muAu3Yr2, nuFromRad: -0.001, nuToRad: 0.001 });
        expect(Math.abs(yr - referenceYr) / referenceYr, `${yr} yr vs ${referenceYr} yr`).toBeLessThan(1e-9);
        const back = ConservationLawsModel.timeBetweenTrueAnomaliesYr({ ecc, pAu, muAu3Yr2, nuFromRad: 0.001, nuToRad: -0.001 });
        expect(Math.abs(back + referenceYr) / referenceYr, `${back} yr vs ${-referenceYr} yr`).toBeLessThan(1e-9);
      });
    }
  });

  it("each is NaN outside its domain: a bound orbit has no open-orbit travel time, an open orbit no period", () => {
    const o = valid(ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1, speedFactor: 0.75, directionDeg: 0 }));
    const yr = ConservationLawsModel.timeBetweenTrueAnomaliesYr({
      ecc: o.ecc,
      pAu: o.pAu,
      muAu3Yr2: o.muAu3Yr2,
      nuFromRad: 0,
      nuToRad: 1
    });
    expect(yr).toBeNaN();
    expect(ConservationLawsModel.orbitalPeriodYr({ ecc: 1, pAu: 2, muAu3Yr2: o.muAu3Yr2 })).toBeNaN();
  });
});

describe("ConservationLawsModel effective potential", () => {
  const mu = 4 * Math.PI * Math.PI;
  const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1, Math.abs(b));

  it("at r = 1 AU with h = 2 pi AU^2/yr is -mu/r + h^2/(2 r^2) = -2 pi^2", () => {
    const u = ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 1, hAbsAu2Yr: 2 * Math.PI, muAu3Yr2: mu });
    expect(u).toBeCloseTo(-2 * Math.PI * Math.PI, 12);
  });

  it("with h = 0 is the Newtonian potential -mu/r", () => {
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 2.5, hAbsAu2Yr: 0, muAu3Yr2: mu })).toBeCloseTo(-mu / 2.5, 12);
  });

  it("is NaN for r <= 0, mu <= 0 or a non-finite h", () => {
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 0, hAbsAu2Yr: 1, muAu3Yr2: mu })).toBeNaN();
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 1, hAbsAu2Yr: 1, muAu3Yr2: 0 })).toBeNaN();
    expect(ConservationLawsModel.effectivePotentialAu2Yr2({ rAu: 1, hAbsAu2Yr: Number.NaN, muAu3Yr2: mu })).toBeNaN();
  });

  // Asymmetric and not a preset: tilted outward, so the start is not a turning point.
  const o = ConservationLawsModel.initialOrbit({ massSolar: 1, r0Au: 1.3, speedFactor: 1.17, directionDeg: 17.76 });
  if (o.orbitType !== "elliptical") throw new Error(`expected an elliptical test orbit, got ${o.orbitType}`);
  const U = (rAu: number) =>
    ConservationLawsModel.effectivePotentialAu2Yr2({ rAu, hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });

  it("equals the specific energy at both turning points: U_eff(r_p) = U_eff(r_a) = eps", () => {
    expect(rel(U(o.rpAu), o.epsAu2Yr2)).toBeLessThan(1e-9);
    expect(rel(U(o.raAu), o.epsAu2Yr2)).toBeLessThan(1e-9);
  });

  it("has its minimum -mu^2/(2 h^2) at r_c = h^2/mu, with zero slope there", () => {
    const rc = ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
    expect(rel(rc, (o.hAbsAu2Yr * o.hAbsAu2Yr) / o.muAu3Yr2)).toBeLessThan(1e-12);
    expect(rel(U(rc), -(o.muAu3Yr2 * o.muAu3Yr2) / (2 * o.hAbsAu2Yr * o.hAbsAu2Yr))).toBeLessThan(1e-12);
    const d = 1e-5 * rc;
    expect(Math.abs((U(rc + d) - U(rc - d)) / (2 * d))).toBeLessThan(1e-6);
    expect(U(rc * 1.1)).toBeGreaterThan(U(rc));
    expect(U(rc * 0.9)).toBeGreaterThan(U(rc));
  });

  it("splits the energy along the orbit: v_r^2/2 + U_eff(r) = eps, and v_r^2/2 = (v^2 - (h/r)^2)/2", () => {
    for (let k = 0; k < 12; k++) {
      const nuRad = (2 * Math.PI * k) / 12 + 0.1;
      const pos = ConservationLawsModel.conicPositionAndTangentAu({ ecc: o.ecc, pAu: o.pAu, omegaRad: o.omegaRad, nuRad });
      if (!pos) throw new Error(`no position at nu = ${nuRad}`);
      const rAu = Math.hypot(pos.xAu, pos.yAu);
      const vAuYr = ConservationLawsModel.instantaneousSpeedAuPerYr({
        muAu3Yr2: o.muAu3Yr2,
        hAbsAu2Yr: o.hAbsAu2Yr,
        ecc: o.ecc,
        nuRad
      });
      const kr = ConservationLawsModel.radialKineticAu2Yr2({
        rAu,
        hAbsAu2Yr: o.hAbsAu2Yr,
        muAu3Yr2: o.muAu3Yr2,
        epsAu2Yr2: o.epsAu2Yr2
      });
      expect(rel(kr + U(rAu), o.epsAu2Yr2)).toBeLessThan(1e-9);
      const vt = o.hAbsAu2Yr / rAu;
      expect(Math.abs(kr - 0.5 * (vAuYr * vAuYr - vt * vt))).toBeLessThan(1e-9 * Math.abs(o.epsAu2Yr2));
    }
  });

  it("radial kinetic energy is 0 at a turning point and NaN clearly outside the allowed region", () => {
    const args = { hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2, epsAu2Yr2: o.epsAu2Yr2 };
    expect(ConservationLawsModel.radialKineticAu2Yr2({ ...args, rAu: o.rpAu })).toBeCloseTo(0, 9);
    expect(ConservationLawsModel.radialKineticAu2Yr2({ ...args, rAu: o.rpAu * 0.5 })).toBeNaN();
  });

  it("has no circular radius without angular momentum", () => {
    expect(ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: 0, muAu3Yr2: mu })).toBeNaN();
  });
});

