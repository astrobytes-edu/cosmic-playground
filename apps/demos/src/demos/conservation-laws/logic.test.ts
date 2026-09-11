import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  classifyOrbit,
  formatOrbitType,
  toSvg,
  orbitalRadiusAu,
  conicPositionAndTangentAu,
  instantaneousSpeedAuPerYr,
  buildPathD,
  velocityArrowSvg,
  viewRadiusAu,
  pickArrowDtDays,
  arrowLengthPx,
  formatSpeedFactor,
  formatSpecificEnergy,
  orbitAnnouncement,
} from "./logic";

describe("Conservation Laws -- UI Logic", () => {
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
  // logSliderToValue / valueToLogSlider
  // -----------------------------------------------------------------------
  describe("logSliderToValue", () => {
    it("slider 0 maps to 10^0 = 1", () => {
      expect(logSliderToValue(0)).toBe(1);
    });
    it("slider 1 maps to 10", () => {
      expect(logSliderToValue(1)).toBeCloseTo(10, 8);
    });
    it("slider -1 maps to 0.1", () => {
      expect(logSliderToValue(-1)).toBeCloseTo(0.1, 8);
    });
    it("slider 0.5 maps to sqrt(10)", () => {
      expect(logSliderToValue(0.5)).toBeCloseTo(Math.sqrt(10), 8);
    });
  });

  describe("valueToLogSlider", () => {
    it("value 1 maps to slider 0", () => {
      expect(valueToLogSlider(1)).toBe(0);
    });
    it("value 10 maps to slider 1", () => {
      expect(valueToLogSlider(10)).toBeCloseTo(1, 8);
    });
    it("value 0.1 maps to slider -1", () => {
      expect(valueToLogSlider(0.1)).toBeCloseTo(-1, 8);
    });
    it("returns 0 for zero", () => {
      expect(valueToLogSlider(0)).toBe(0);
    });
    it("returns 0 for negative", () => {
      expect(valueToLogSlider(-5)).toBe(0);
    });
    it("returns 0 for NaN", () => {
      expect(valueToLogSlider(NaN)).toBe(0);
    });
  });

  describe("logSliderToValue / valueToLogSlider round-trip", () => {
    it("round-trips for typical values", () => {
      for (const v of [0.1, 0.5, 1, 2.5, 5, 10]) {
        const slider = valueToLogSlider(v);
        const back = logSliderToValue(slider);
        expect(back).toBeCloseTo(v, 6);
      }
    });
  });

  // -----------------------------------------------------------------------
  // formatNumber
  // -----------------------------------------------------------------------
  describe("formatNumber", () => {
    it("formats normal numbers with fixed digits", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });
    it("uses exponential for large numbers", () => {
      expect(formatNumber(1.5e8, 3)).toBe("1.50e+8");
    });
    it("uses exponential for small numbers", () => {
      expect(formatNumber(0.00012, 3)).toBe("1.20e-4");
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
    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });
    it("handles negative numbers", () => {
      expect(formatNumber(-2.5, 2)).toBe("-2.50");
    });
    it("handles negative very large", () => {
      expect(formatNumber(-1e7, 3)).toBe("-1.00e+7");
    });
    it("uses digits default of 3", () => {
      expect(formatNumber(1.23456)).toBe("1.235");
    });
    it("digits=0 gives 0 decimal places for exponential", () => {
      expect(formatNumber(1e8, 0)).toBe("1e+8");
    });
  });

  // -----------------------------------------------------------------------
  // classifyOrbit
  // -----------------------------------------------------------------------
  describe("classifyOrbit", () => {
    it("returns 'circular' for e = 0", () => {
      expect(classifyOrbit(0)).toBe("circular");
    });
    it("returns 'circular' for e ~ 1e-7 (below threshold)", () => {
      expect(classifyOrbit(1e-7)).toBe("circular");
    });
    it("returns 'elliptical' for 0 < e < 1", () => {
      expect(classifyOrbit(0.5)).toBe("elliptical");
    });
    it("returns 'elliptical' for e = 0.999", () => {
      expect(classifyOrbit(0.999)).toBe("elliptical");
    });
    it("returns 'parabolic' for e ~ 1", () => {
      expect(classifyOrbit(1)).toBe("parabolic");
      expect(classifyOrbit(1 + 1e-7)).toBe("parabolic");
      expect(classifyOrbit(1 - 1e-7)).toBe("parabolic");
    });
    it("returns 'hyperbolic' for e > 1", () => {
      expect(classifyOrbit(1.5)).toBe("hyperbolic");
      expect(classifyOrbit(3)).toBe("hyperbolic");
    });
    it("returns 'invalid' for negative e", () => {
      expect(classifyOrbit(-0.1)).toBe("invalid");
    });
    it("returns 'invalid' for NaN", () => {
      expect(classifyOrbit(NaN)).toBe("invalid");
    });
  });

  // -----------------------------------------------------------------------
  // formatOrbitType
  // -----------------------------------------------------------------------
  describe("formatOrbitType", () => {
    it("circular -> 'circular'", () => {
      expect(formatOrbitType("circular")).toBe("circular");
    });
    it("elliptical -> 'elliptical'", () => {
      expect(formatOrbitType("elliptical")).toBe("elliptical");
    });
    it("parabolic -> 'parabolic (escape)'", () => {
      expect(formatOrbitType("parabolic")).toBe("parabolic (escape)");
    });
    it("hyperbolic -> 'hyperbolic'", () => {
      expect(formatOrbitType("hyperbolic")).toBe("hyperbolic");
    });
    it("unknown -> 'invalid'", () => {
      expect(formatOrbitType("foo")).toBe("invalid");
      expect(formatOrbitType("")).toBe("invalid");
    });
    it("radial -> 'radial (straight line)'", () => {
      expect(formatOrbitType("radial")).toBe("radial (straight line)");
    });
  });

  // -----------------------------------------------------------------------
  // toSvg
  // -----------------------------------------------------------------------
  describe("toSvg", () => {
    const center = { x: 300, y: 300 };

    it("origin maps to center", () => {
      const p = toSvg(0, 0, center, 100);
      expect(p.x).toBe(300);
      expect(p.y).toBe(300);
    });
    it("positive x moves right", () => {
      const p = toSvg(1, 0, center, 100);
      expect(p.x).toBe(400);
      expect(p.y).toBe(300);
    });
    it("positive y moves up (SVG y-down)", () => {
      const p = toSvg(0, 1, center, 100);
      expect(p.x).toBe(300);
      expect(p.y).toBe(200);
    });
    it("negative coordinates work correctly", () => {
      const p = toSvg(-2, -1, center, 50);
      expect(p.x).toBe(200); // 300 + (-2)*50
      expect(p.y).toBe(350); // 300 - (-1)*50
    });
  });

  // -----------------------------------------------------------------------
  // orbitalRadiusAu
  // -----------------------------------------------------------------------
  describe("orbitalRadiusAu", () => {
    it("circular orbit (e=0): r = p at all angles", () => {
      expect(orbitalRadiusAu(0, 2, 0)).toBeCloseTo(2, 10);
      expect(orbitalRadiusAu(0, 2, Math.PI / 2)).toBeCloseTo(2, 10);
      expect(orbitalRadiusAu(0, 2, Math.PI)).toBeCloseTo(2, 10);
    });
    it("elliptical orbit: periapsis at nu=0", () => {
      const e = 0.5;
      const p = 1;
      const rPeri = orbitalRadiusAu(e, p, 0);
      expect(rPeri).toBeCloseTo(p / (1 + e), 10);
    });
    it("elliptical orbit: apoapsis at nu=pi", () => {
      const e = 0.5;
      const p = 1;
      const rApo = orbitalRadiusAu(e, p, Math.PI);
      expect(rApo).toBeCloseTo(p / (1 - e), 10);
    });
    it("returns NaN for negative eccentricity", () => {
      expect(orbitalRadiusAu(-0.1, 1, 0)).toBeNaN();
    });
    it("returns NaN for non-positive semi-latus rectum", () => {
      expect(orbitalRadiusAu(0, 0, 0)).toBeNaN();
      expect(orbitalRadiusAu(0, -1, 0)).toBeNaN();
    });
    it("returns NaN for NaN inputs", () => {
      expect(orbitalRadiusAu(NaN, 1, 0)).toBeNaN();
      expect(orbitalRadiusAu(0, NaN, 0)).toBeNaN();
      expect(orbitalRadiusAu(0, 1, NaN)).toBeNaN();
    });
    it("returns NaN when denominator hits zero (hyperbolic asymptote)", () => {
      // For e=2, denom = 0 at nu = acos(-1/2) = 2pi/3
      const nuCrit = Math.acos(-1 / 2);
      expect(orbitalRadiusAu(2, 1, nuCrit)).toBeNaN();
    });
  });

  // -----------------------------------------------------------------------
  // conicPositionAndTangentAu
  // -----------------------------------------------------------------------
  describe("conicPositionAndTangentAu", () => {
    it("circular orbit (e=0, omega=0) at nu=0 gives (p, 0)", () => {
      const result = conicPositionAndTangentAu(0, 2, 0, 0);
      expect(result).not.toBeNull();
      expect(result!.xAu).toBeCloseTo(2, 10);
      expect(result!.yAu).toBeCloseTo(0, 10);
    });
    it("circular orbit at nu=pi/2 gives (0, p)", () => {
      const result = conicPositionAndTangentAu(0, 2, 0, Math.PI / 2);
      expect(result).not.toBeNull();
      expect(result!.xAu).toBeCloseTo(0, 10);
      expect(result!.yAu).toBeCloseTo(2, 10);
    });
    it("tangent direction is perpendicular to radius for circular orbit", () => {
      const result = conicPositionAndTangentAu(0, 2, 0, Math.PI / 4);
      expect(result).not.toBeNull();
      // dot product of (x,y) and (dx,dy) should be 0 for circular orbit
      const dot = result!.xAu * result!.dxAu + result!.yAu * result!.dyAu;
      expect(dot).toBeCloseTo(0, 8);
    });
    it("returns null for invalid eccentricity", () => {
      expect(conicPositionAndTangentAu(-1, 1, 0, 0)).toBeNull();
    });
    it("returns null for NaN semi-latus rectum", () => {
      expect(conicPositionAndTangentAu(0, NaN, 0, 0)).toBeNull();
    });
    it("omega rotates the orbit", () => {
      // At omega = pi/2, what was the +x direction becomes +y
      const r0 = conicPositionAndTangentAu(0, 2, 0, 0);
      const rRot = conicPositionAndTangentAu(0, 2, Math.PI / 2, 0);
      expect(rRot).not.toBeNull();
      expect(rRot!.xAu).toBeCloseTo(0, 8);
      expect(rRot!.yAu).toBeCloseTo(r0!.xAu, 8);
    });
  });

  // -----------------------------------------------------------------------
  // instantaneousSpeedAuPerYr
  // -----------------------------------------------------------------------
  describe("instantaneousSpeedAuPerYr", () => {
    it("circular orbit (e=0): v = mu/h for all nu", () => {
      const mu = 4 * Math.PI * Math.PI; // G = 4pi^2 AU^3/(yr^2 Msun), M=1
      const r = 1; // AU
      const vCirc = Math.sqrt(mu / r); // = 2*pi AU/yr
      const h = r * vCirc;
      const speed = instantaneousSpeedAuPerYr(mu, h, 0, 0);
      expect(speed).toBeCloseTo(vCirc, 6);
      const speed2 = instantaneousSpeedAuPerYr(mu, h, 0, Math.PI);
      expect(speed2).toBeCloseTo(vCirc, 6);
    });
    it("returns NaN for invalid mu", () => {
      expect(instantaneousSpeedAuPerYr(0, 1, 0, 0)).toBeNaN();
      expect(instantaneousSpeedAuPerYr(-1, 1, 0, 0)).toBeNaN();
      expect(instantaneousSpeedAuPerYr(NaN, 1, 0, 0)).toBeNaN();
    });
    it("returns NaN for invalid h", () => {
      expect(instantaneousSpeedAuPerYr(1, 0, 0, 0)).toBeNaN();
      expect(instantaneousSpeedAuPerYr(1, -1, 0, 0)).toBeNaN();
    });
    it("returns NaN for negative eccentricity", () => {
      expect(instantaneousSpeedAuPerYr(1, 1, -0.1, 0)).toBeNaN();
    });
    it("elliptical orbit: speed is higher at periapsis than apoapsis", () => {
      const mu = 4 * Math.PI * Math.PI;
      const e = 0.5;
      // For e=0.5, p = a(1-e^2) = a * 0.75; h = sqrt(mu * p)
      const a = 1;
      const p = a * (1 - e * e);
      const h = Math.sqrt(mu * p);
      const vPeri = instantaneousSpeedAuPerYr(mu, h, e, 0);
      const vApo = instantaneousSpeedAuPerYr(mu, h, e, Math.PI);
      expect(vPeri).toBeGreaterThan(vApo);
    });
  });

  // -----------------------------------------------------------------------
  // buildPathD
  // -----------------------------------------------------------------------
  describe("buildPathD", () => {
    const center = { x: 300, y: 300 };

    it("returns empty string for no points", () => {
      expect(buildPathD([], center, 100)).toBe("");
    });
    it("single point gives M command", () => {
      const d = buildPathD([{ xAu: 0, yAu: 0 }], center, 100);
      expect(d).toBe("M 300.00 300.00");
    });
    it("two points give M + L command", () => {
      const d = buildPathD(
        [{ xAu: 0, yAu: 0 }, { xAu: 1, yAu: 0 }],
        center,
        100,
      );
      expect(d).toBe("M 300.00 300.00 L 400.00 300.00");
    });
    it("builds path with correct y-flip", () => {
      const d = buildPathD(
        [{ xAu: 0, yAu: 0 }, { xAu: 0, yAu: 1 }],
        center,
        100,
      );
      // y=1 AU -> SVG y = 300 - 100 = 200
      expect(d).toBe("M 300.00 300.00 L 300.00 200.00");
    });
  });

  // -----------------------------------------------------------------------
  // velocityArrowSvg
  // -----------------------------------------------------------------------
  describe("velocityArrowSvg", () => {
    it("clamps velocity length between 20 and 120 px", () => {
      const slow = velocityArrowSvg(1, 0, 100, 1, 0.01); // vRatio very small
      expect(slow.vLenPx).toBe(20);
      const fast = velocityArrowSvg(1, 0, 100, 1, 100); // vRatio very large
      expect(fast.vLenPx).toBe(120);
    });
    it("unit direction is normalized", () => {
      const { ux, uy } = velocityArrowSvg(3, 4, 100, 1, 1);
      const mag = Math.hypot(ux, uy);
      expect(mag).toBeCloseTo(1, 8);
    });
    it("dir=-1 reverses direction", () => {
      const fwd = velocityArrowSvg(1, 0, 100, 1, 1);
      const rev = velocityArrowSvg(1, 0, 100, -1, 1);
      expect(rev.ux).toBeCloseTo(-fwd.ux, 8);
      expect(rev.uy).toBeCloseTo(-fwd.uy, 8);
    });
    it("y-flip: positive dyAu gives negative uy in SVG", () => {
      const { uy } = velocityArrowSvg(0, 1, 100, 1, 1);
      expect(uy).toBeLessThan(0);
    });
    it("zero tangent gives zero direction", () => {
      const { ux, uy } = velocityArrowSvg(0, 0, 100, 1, 1);
      expect(ux).toBe(0);
      expect(uy).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // viewRadiusAu
  // -----------------------------------------------------------------------
  describe("viewRadiusAu", () => {
    it("fits a small closed orbit with the 1.5 AU floor", () => {
      expect(viewRadiusAu({ raAu: 1, r0Au: 1 })).toBe(1.5);
    });

    it("is continuous across escape: 1.40 (bound, ra = 49 AU) and 1.42 (open) share one window", () => {
      expect(viewRadiusAu({ raAu: 49, r0Au: 1 })).toBe(6);
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 1 })).toBe(6);
    });

    it("keeps the start point well clear of the 10 px Sun near escape", () => {
      expect((1 * 250) / viewRadiusAu({ raAu: 49, r0Au: 1 })).toBeGreaterThan(41);
    });

    it("fits a moderately eccentric orbit with a 10% margin", () => {
      expect(viewRadiusAu({ raAu: 3.381308, r0Au: 1 })).toBeCloseTo(3.719438, 5);
    });

    it("caps at 50 AU and floors at 1.5 AU", () => {
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 10 })).toBe(50);
      expect(viewRadiusAu({ raAu: 0.642859, r0Au: 10 ** -0.3 })).toBe(1.5);
    });
  });

  // -----------------------------------------------------------------------
  // arrow time step and length
  // -----------------------------------------------------------------------
  describe("arrow time step and length", () => {
    const s15 = 250 / 1.5;
    const s6 = 250 / 6;

    it("default circular orbit: 20 days, 57.3 px", () => {
      expect(pickArrowDtDays(2 * Math.PI, s15)).toBe(20);
      expect(arrowLengthPx(2 * Math.PI, 20, s15)).toBeCloseTo(57.341, 3);
    });

    it("is exactly proportional to speed: periapsis / apoapsis = (1 + e)/(1 - e), no clamp", () => {
      const dt = pickArrowDtDays(12.042772, s15)!;
      expect(dt).toBe(20);
      const apo = arrowLengthPx(0.75 * 2 * Math.PI, dt, s15);
      const peri = arrowLengthPx(12.042772, dt, s15);
      expect(apo).toBeCloseTo(43.006, 3);
      expect(peri).toBeCloseTo(109.904, 3);
      expect(peri / apo).toBeCloseTo(1.4375 / 0.5625, 5);
    });

    it("ten solar masses: per-day length is sqrt(10) times longer", () => {
      const dt10 = pickArrowDtDays(19.869177, s15)!;
      expect(dt10).toBe(10);
      const perDay1 = arrowLengthPx(2 * Math.PI, 20, s15) / 20;
      const perDay10 = arrowLengthPx(19.869177, dt10, s15) / dt10;
      expect(perDay10 / perDay1).toBeCloseTo(Math.sqrt(10), 5);
    });

    it("escape, hyperbolic and slow zoomed-out orbits", () => {
      expect(pickArrowDtDays(8.885766, s6)).toBe(100);
      expect(pickArrowDtDays(11.309734, s6)).toBe(50);
      expect(pickArrowDtDays(3.576452, 5)).toBe(2000);
    });

    it("returns null when nothing moves", () => {
      expect(pickArrowDtDays(0, s15)).toBeNull();
    });

    it("never exceeds 120 px at the fastest point unless even one day would", () => {
      for (const v of [0.5, 3, 12, 40, 150]) {
        const dt = pickArrowDtDays(v, s15)!;
        if (dt > 1) expect(arrowLengthPx(v, dt, s15)).toBeLessThanOrEqual(120);
      }
    });
  });

  // -----------------------------------------------------------------------
  // formatSpeedFactor
  // -----------------------------------------------------------------------
  describe("formatSpeedFactor", () => {
    it("shows three decimals so the exact escape preset reads differently from the slider's 1.41", () => {
      expect(formatSpeedFactor(Math.SQRT2)).toBe("1.414");
      expect(formatSpeedFactor(1.41)).toBe("1.410");
      expect(formatSpeedFactor(1)).toBe("1.000");
      expect(formatSpeedFactor(0)).toBe("0");
    });
  });

  // -----------------------------------------------------------------------
  // formatSpecificEnergy
  // -----------------------------------------------------------------------
  describe("formatSpecificEnergy", () => {
    it("shows round-off at exact escape as 0, never e-notation", () => {
      expect(formatSpecificEnergy(3.5e-15, 39.478418)).toBe("0");
      expect(formatSpecificEnergy(-1.4e-14, 197.860789)).toBe("0");
    });

    it("formats ordinary energies to four decimals", () => {
      expect(formatSpecificEnergy(-28.375113, 39.478418)).toBe("-28.3751");
      expect(formatSpecificEnergy(-0.2349, 39.478418)).toBe("-0.2349");
    });
  });

  // -----------------------------------------------------------------------
  // orbitAnnouncement
  // -----------------------------------------------------------------------
  describe("orbitAnnouncement", () => {
    it("says bound, at escape or unbound in words", () => {
      expect(orbitAnnouncement({ orbitType: "circular", ecc: 0, epsAu2Yr2: -19.7 })).toBe("Circular orbit: bound, eccentricity 0.");
      expect(orbitAnnouncement({ orbitType: "elliptical", ecc: 0.4375, epsAu2Yr2: -28.4 })).toBe("Elliptical orbit: bound, eccentricity 0.438.");
      expect(orbitAnnouncement({ orbitType: "parabolic", ecc: 1, epsAu2Yr2: 0 })).toBe("Parabolic orbit: exactly at escape, specific energy 0.");
      expect(orbitAnnouncement({ orbitType: "hyperbolic", ecc: 2.24, epsAu2Yr2: 24.5 })).toBe("Hyperbolic orbit: unbound, eccentricity 2.240.");
      expect(orbitAnnouncement({ orbitType: "radial", ecc: 1, epsAu2Yr2: -39.5 })).toBe("Radial motion: with no sideways speed the body falls straight in.");
      expect(orbitAnnouncement({ orbitType: "invalid", ecc: NaN, epsAu2Yr2: NaN })).toBe("No valid orbit for these settings.");
    });
  });
});
