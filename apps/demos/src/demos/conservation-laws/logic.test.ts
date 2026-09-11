import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatOrbitType,
  toSvg,
  buildPathD,
  viewRadiusAu,
  pickArrowDtDays,
  arrowLengthPx,
  arrowScale,
  formatSpeedFactor,
  formatSpecificEnergy,
  formatEccentricity,
  formatPeriapsis,
  orbitAnnouncement,
  animationTimeScaleYrPerSec,
  formatTimeScale,
  DEFAULT_SIM_YEARS_PER_SEC,
  MIN_ON_SCREEN_ORBIT_SEC,
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
    it("writes large numbers out in full, never e-notation", () => {
      expect(formatNumber(1.5e8, 3)).toBe("150000000.000");
    });
    it("keeps `digits` significant figures for small numbers, as decimals", () => {
      expect(formatNumber(0.00012, 3)).toBe("0.000120");
      expect(formatNumber(3.8e-8, 3)).toBe("0.0000000380");
    });
    it("never uses e-notation for values the readouts can reach", () => {
      for (const v of [1e-12, 3.3e-7, 5.476e-4, 1.631e7, -1.632e7]) {
        expect(formatNumber(v, 3)).not.toMatch(/e[+-]/);
      }
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
      expect(formatNumber(-1e7, 3)).toBe("-10000000.000");
    });
    it("uses digits default of 3", () => {
      expect(formatNumber(1.23456)).toBe("1.235");
    });
    it("digits=0 gives no decimal places for a large number", () => {
      expect(formatNumber(1e8, 0)).toBe("100000000");
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
  // viewRadiusAu
  // -----------------------------------------------------------------------
  describe("viewRadiusAu", () => {
    it("fits a small closed orbit with the 1.5 r0 floor", () => {
      expect(viewRadiusAu({ raAu: 1, r0Au: 1 })).toBe(1.5);
    });

    it("floors the window at 1.5 r0, not 1.5 AU, so a small orbit is not drawn inside the Sun (P6)", () => {
      expect(viewRadiusAu({ raAu: 0.1, r0Au: 0.1 })).toBeCloseTo(0.15, 12);
      expect(viewRadiusAu({ raAu: 10, r0Au: 10 })).toBeCloseTo(15, 12);
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 10 })).toBe(50);
    });

    it("puts a circular orbit's start point 250/1.5 = 166.67 px from centre at every r0 (P6)", () => {
      for (const r0Au of [0.1, 10 ** -0.5, 1, 10 ** 0.5, 10]) {
        expect((r0Au * 250) / viewRadiusAu({ raAu: r0Au, r0Au })).toBeCloseTo(250 / 1.5, 6);
      }
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

    it("caps at 50 AU and floors at 1.5 r0", () => {
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 10 })).toBe(50);
      // Was 1.5 under the old 1.5 AU floor; the floor is now 1.5 r0 = 1.5 x 10^-0.3 AU.
      expect(viewRadiusAu({ raAu: 0.642859, r0Au: 10 ** -0.3 })).toBeCloseTo(0.751781, 5);
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

    it("caps the fastest arrow at 120 px, not to scale, when even one day overflows (L2)", () => {
      // M = 10, r0 = 0.1 AU, speed factor 0.1: periapsis speed 1250 AU/yr; at this 1.5 AU scale one day is 570 px.
      const s = arrowScale(1250, s15);
      expect(s.toScale).toBe(false);
      expect(s.dtDays).toBeNull();
      expect(1250 * s.pxPerAuYr).toBeCloseTo(120, 10);
    });

    it("stays to scale with the round step whenever that step fits", () => {
      const s = arrowScale(2 * Math.PI, s15);
      expect(s.dtDays).toBe(20);
      expect(s.toScale).toBe(true);
      expect(2 * Math.PI * s.pxPerAuYr).toBeCloseTo(57.341, 3);
    });

    it("draws no arrow when nothing moves", () => {
      const s = arrowScale(0, 100);
      expect(s.dtDays).toBeNull();
      expect(s.pxPerAuYr).toBe(0);
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
  // formatEccentricity / formatPeriapsis
  // -----------------------------------------------------------------------
  describe("formatEccentricity and formatPeriapsis", () => {
    it("shows a circular orbit's round-off eccentricity as 0", () => {
      expect(formatEccentricity("circular", 1.11e-16, 3)).toBe("0");
      expect(formatEccentricity("circular", 1.11e-16, 6)).toBe("0");
    });

    it("shows an em dash for radial or invalid motion, which has no conic", () => {
      expect(formatEccentricity("radial", 1, 6)).toBe("—");
      expect(formatPeriapsis("radial", 0, 6)).toBe("—");
      expect(formatEccentricity("invalid", NaN, 3)).toBe("—");
      expect(formatPeriapsis("invalid", NaN, 3)).toBe("—");
    });

    it("formats an elliptical orbit's e and r_p to the requested digits", () => {
      expect(formatEccentricity("elliptical", 0.4375, 3)).toBe("0.438");
      expect(formatEccentricity("elliptical", 0.4375, 6)).toBe("0.437500");
      expect(formatPeriapsis("elliptical", 0.391304, 3)).toBe("0.391");
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
      expect(orbitAnnouncement({ orbitType: "radial", ecc: 1, epsAu2Yr2: 5 })).toBe("Radial motion: the body moves straight out and escapes.");
      expect(orbitAnnouncement({ orbitType: "invalid", ecc: NaN, epsAu2Yr2: NaN })).toBe("No valid orbit for these settings.");
    });
  });

  // -----------------------------------------------------------------------
  // animation time scale and its caption
  // -----------------------------------------------------------------------
  describe("animationTimeScaleYrPerSec", () => {
    it("keeps 1/3 yr per s for an orbit lasting at least 1.5 s on screen (1 yr takes 3 s)", () => {
      expect(DEFAULT_SIM_YEARS_PER_SEC).toBe(1 / 3);
      expect(MIN_ON_SCREEN_ORBIT_SEC).toBe(1.5);
      expect(animationTimeScaleYrPerSec(1)).toBe(1 / 3);
    });

    it("keeps 1/3 yr per s when there is no characteristic time (radial motion)", () => {
      expect(animationTimeScaleYrPerSec(NaN)).toBe(1 / 3);
      expect(animationTimeScaleYrPerSec(0)).toBe(1 / 3);
    });

    it("slows a 0.01 yr orbit (M = 10, r0 = 0.1 AU, circular) so one lap takes 1.5 s", () => {
      expect(animationTimeScaleYrPerSec(0.01)).toBeCloseTo(0.006667, 6);
    });
  });

  describe("formatTimeScale", () => {
    it("states the default scale in whole months", () => {
      expect(formatTimeScale(1 / 3)).toBe("4 months");
    });

    it("states a slowed scale in days, one decimal", () => {
      expect(formatTimeScale(0.0066667)).toBe("2.4 days");
      expect(formatTimeScale(0.05)).toBe("18.3 days");
    });

    it("states a scale under a day in hours, one decimal", () => {
      expect(formatTimeScale(0.0023747)).toBe("20.8 hours");
    });
  });
});
