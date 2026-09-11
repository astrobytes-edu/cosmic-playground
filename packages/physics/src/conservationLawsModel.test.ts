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
    // The demo's view rule clamp(min(closedFit, 6 r0), 1.5, 50) floors at 1.5 AU for an open orbit from r0 = 0.1 AU.
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

